import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createPublicEnquiryHandler } from "../src/server/public-enquiries";
import { HttpError } from "../src/server/security";
import type { EmailStatus } from "../src/server/email";
const origin = "http://localhost:3119";
const sample = () => ({
  name: "Launch test",
  email: "test@example.test",
  phone: "",
  location: "Test city",
  service: "Architecture",
  client_type: "Homeowner",
  budget: "To discuss",
  message: "An isolated launch test. No real enquiry or email.",
  consent: true,
  website: "",
  request_key: randomUUID(),
});
const request = (data = sample(), source = origin) =>
  new Request(`${origin}/api/enquiries`, {
    method: "POST",
    headers: { Origin: source, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
test("email launch accepts only confirmed provider success and coalesces duplicate submissions", async () => {
  let calls = 0;
  const handle = createPublicEnquiryHandler(async () => {
    calls++;
    return "submitted";
  });
  const data = sample();
  const results = await Promise.all([
    handle(request(data), ["enquiries"]),
    handle(request(data), ["enquiries"]),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    [201, 201],
  );
  assert.equal(calls, 1);
  await assert.rejects(
    handle(
      request({ ...data, message: "This body was changed after sending." }),
      ["enquiries"],
    ),
    (e: unknown) => e instanceof HttpError && e.status === 409,
  );
});
test("failed, unconfirmed, activation and disabled delivery never become a success", async () => {
  for (const status of [
    "failed",
    "uncertain",
    "activation_required",
    "disabled",
  ] as EmailStatus[]) {
    let calls = 0;
    const handle = createPublicEnquiryHandler(async () => {
      calls++;
      return status;
    });
    const data = sample();
    for (let i = 0; i < 2; i++)
      await assert.rejects(
        handle(request(data), ["enquiries"]),
        (e: unknown) => e instanceof HttpError && e.status === 503,
      );
    assert.equal(calls, status === "uncertain" ? 1 : 2);
  }
});
test("the same enquiry can be sent after the owner activates forwarding", async () => {
  let calls = 0;
  const handle = createPublicEnquiryHandler(async () =>
    ++calls === 1 ? "activation_required" : "submitted",
  );
  const data = sample();
  await assert.rejects(handle(request(data), ["enquiries"]));
  assert.equal((await handle(request(data), ["enquiries"])).status, 201);
  assert.equal(calls, 2);
});
test("invalid consent, honeypot and foreign-origin requests cannot send email", async () => {
  let calls = 0;
  const handle = createPublicEnquiryHandler(async () => {
    calls++;
    return "submitted";
  });
  await assert.rejects(
    handle(request({ ...sample(), consent: false }), ["enquiries"]),
  );
  await assert.rejects(
    handle(request({ ...sample(), website: "spam" }), ["enquiries"]),
  );
  await assert.rejects(
    handle(request(sample(), "https://foreign.example"), ["enquiries"]),
    (e: unknown) => e instanceof HttpError && e.status === 403,
  );
  assert.equal(calls, 0);
});
test("email launch limits sends per warm instance and leaves private APIs unavailable", async () => {
  let calls = 0;
  const handle = createPublicEnquiryHandler(async () => {
    calls++;
    return "submitted";
  });
  for (let i = 0; i < 8; i++)
    assert.equal((await handle(request(), ["enquiries"])).status, 201);
  await assert.rejects(
    handle(request(), ["enquiries"]),
    (e: unknown) =>
      e instanceof HttpError && e.status === 429 && !!e.retryAfter,
  );
  assert.equal(calls, 8);
  await assert.rejects(
    handle(request(), ["projects"]),
    (e: unknown) => e instanceof HttpError && e.status === 503,
  );
  assert.deepEqual(
    await (
      await handle(new Request(`${origin}/api/session`), ["session"])
    ).json(),
    { user: null },
  );
});
