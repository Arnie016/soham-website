import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  checkPassword,
  checkOrigin,
  HttpError,
} from "../src/server/security";
import {
  inquirySchema,
  projectEditSchema,
  activateSchema,
} from "../src/lib/validation";
import { randomUUID } from "node:crypto";
test("password hashes are salted and incorrect passwords fail", async () => {
  const a = await hashPassword("a long sample passphrase");
  const b = await hashPassword("a long sample passphrase");
  assert.notEqual(a, b);
  assert.ok(!a.includes("sample"));
  assert.equal(await checkPassword("a long sample passphrase", a), true);
  assert.equal(await checkPassword("wrong", a), false);
  assert.equal(await checkPassword("wrong", null), false);
});
test("mutations reject foreign and missing origins", () => {
  assert.throws(
    () =>
      checkOrigin(
        new Request("http://localhost:3100/api/test", {
          method: "POST",
          headers: { origin: "https://attacker.example" },
        }),
      ),
    HttpError,
  );
  assert.throws(
    () =>
      checkOrigin(
        new Request("http://localhost:3100/api/test", { method: "POST" }),
      ),
    HttpError,
  );
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request("http://localhost:3100/api/test", {
        method: "POST",
        headers: { origin: "http://localhost:3100" },
      }),
    ),
  );
});
test("enquiries require contact consent and reject honeypot spam", () => {
  const valid = {
    name: "Example",
    email: "person@example.test",
    phone: "",
    service: "Architecture",
    client_type: "Homeowner",
    location: "Chandrapur",
    budget: "",
    message: "A considered home for a family.",
    consent: true,
    website: "",
    request_key: randomUUID(),
  };
  assert.ok(inquirySchema.safeParse(valid).success);
  assert.ok(!inquirySchema.safeParse({ ...valid, consent: false }).success);
  assert.ok(!inquirySchema.safeParse({ ...valid, website: "spam" }).success);
  assert.ok(!inquirySchema.safeParse({ ...valid, email: "invalid" }).success);
});
test("project stages and invitation tokens are validated", () => {
  assert.ok(
    !projectEditSchema.safeParse({
      stage: "Made up stage",
      next_step: "Next",
      version: 1,
    }).success,
  );
  assert.ok(
    !activateSchema.safeParse({ token: "short", password: "weak" }).success,
  );
});
