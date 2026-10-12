import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createEnquirySubmission } from "../src/lib/enquiry-submission";
const sample = () => ({
  name: "Test",
  email: "test@example.test",
  phone: "",
  location: "Test city",
  service: "Architecture",
  client_type: "Homeowner",
  budget: "To discuss",
  message: "A synthetic enquiry for the isolated test suite.",
  consent: true,
  website: "",
  request_key: randomUUID(),
});
test("browser fallback uses the fixed recipient only after explicit relay rejection", async () => {
  const calls: string[] = [];
  const send = createEnquirySubmission(async (url, options) => {
    calls.push(String(url));
    if (calls.length === 1)
      return Response.json(
        { code: "email_provider_rejected" },
        { status: 503 },
      );
    assert.equal(url, "https://formsubmit.co/ajax/sohamkhetan@gmail.com");
    assert.equal(options?.credentials, "omit");
    assert.equal(options?.referrerPolicy, "strict-origin-when-cross-origin");
    const body = JSON.parse(String(options?.body));
    assert.equal(body._url, "https://studio.example/contact");
    assert.equal(body._cc, undefined);
    return Response.json({ success: "true" });
  }, "https://studio.example");
  const data = sample();
  const responses = await Promise.all([send(data), send(data)]);
  assert.deepEqual(
    responses.map((r) => r.status),
    [201, 201],
  );
  assert.equal(calls.length, 2);
});
test("validation errors and unconfirmed server results do not trigger direct email", async () => {
  for (const status of [400, 403, 429, 503]) {
    let calls = 0;
    const send = createEnquirySubmission(async () => {
      calls++;
      return Response.json({ error: "Unavailable" }, { status });
    }, "https://studio.example");
    assert.equal((await send(sample())).status, status);
    assert.equal(calls, 1);
  }
});
test("activation responses and delivery timeouts never become accepted or automatically retried", async () => {
  let calls = 0;
  const uncertain = createEnquirySubmission(async () => {
    calls++;
    throw Error("Timeout");
  }, "https://studio.example");
  const data = sample();
  assert.equal((await uncertain(data)).status, 503);
  assert.equal((await uncertain(data)).status, 503);
  assert.equal(calls, 1);
  const activation = createEnquirySubmission(
    async (url) =>
      String(url).startsWith("/api")
        ? Response.json({ code: "email_provider_rejected" }, { status: 503 })
        : Response.json({ success: "true", message: "Activate your form" }),
    "https://studio.example",
  );
  assert.equal((await activation(sample())).status, 503);
});
