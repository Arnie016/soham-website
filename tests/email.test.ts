import test from "node:test";
import assert from "node:assert/strict";
import { enquiryEmail, sendEnquiryEmail } from "../src/server/email";
import type { Inquiry } from "../src/lib/domain";
const sample: Inquiry = {
  id: "test-enquiry",
  name: "Test Client",
  email: "client@example.test",
  phone: "",
  service: "Architecture",
  client_type: "Homeowner",
  location: "Test city",
  budget: "To discuss",
  message: "This is a local test, not a real enquiry.",
  status: "New",
  created_at: new Date(0).toISOString(),
};
test("email recipients are fixed and reply details preserve the enquiry", async () => {
  let called = false;
  const mock = async (url: RequestInfo | URL, options?: RequestInit) => {
    called = true;
    assert.equal(url, "https://formsubmit.co/ajax/sohamkhetan@gmail.com");
    const body = JSON.parse(String(options?.body));
    assert.equal(body.email, sample.email);
    assert.equal(body.message, sample.message);
    assert.equal(body._cc, undefined);
    return Response.json({ success: "true" });
  };
  assert.equal(await sendEnquiryEmail(sample, mock), "submitted");
  assert.equal(called, true);
  assert.equal(
    enquiryEmail(sample)._subject,
    "New architecture enquiry: Architecture",
  );
});
test("activation remains distinguishable from accepted delivery", async () => {
  assert.equal(
    await sendEnquiryEmail(sample, async () =>
      Response.json({ success: true, message: "Please activate your email" }),
    ),
    "activation_required",
  );
});
test("provider failures never become a sent claim", async () => {
  assert.equal(
    await sendEnquiryEmail(
      sample,
      async () => new Response("Unavailable", { status: 503 }),
    ),
    "failed",
  );
  assert.equal(
    await sendEnquiryEmail(sample, async () =>
      Response.json({ success: false }),
    ),
    "failed",
  );
  assert.equal(
    await sendEnquiryEmail(sample, async () => {
      throw new Error("Timeout");
    }),
    "uncertain",
  );
});
test("disabled test transport makes no external request", async () => {
  const before = process.env.EMAIL_TRANSPORT;
  process.env.EMAIL_TRANSPORT = "disabled";
  try {
    assert.equal(
      await sendEnquiryEmail(sample, async () => {
        throw new Error("Must not call");
      }),
      "disabled",
    );
  } finally {
    if (before === undefined) delete process.env.EMAIL_TRANSPORT;
    else process.env.EMAIL_TRANSPORT = before;
  }
});
