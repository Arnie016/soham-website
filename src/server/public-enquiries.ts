import { createHmac } from "node:crypto";
import { inquirySchema } from "../lib/validation";
import { sendEnquiryEmail } from "./email";
import { checkOrigin, HttpError, ipKey, jsonBody } from "./security";

// Email-only launch mode: no local database or client accounts on Vercel.
// These bounded guards apply per warm instance, not across serverless instances.
export function createPublicEnquiryHandler(deliver = sendEnquiryEmail) {
  const attempts = new Map<string, { count: number; expires: number }>();
  const submissions = new Map<
    string,
    {
      expires: number;
      fingerprint: string;
      result: Promise<Awaited<ReturnType<typeof sendEnquiryEmail>>>;
    }
  >();
  const privateHash = (value: string) =>
    createHmac("sha256", process.env.RATE_LIMIT_SECRET || "local-email-test")
      .update(value)
      .digest("hex");
  return async (request: Request, parts: string[]) => {
    const path = parts.join("/");
    const headers = { "Cache-Control": "no-store" };
    if (path === "session" && request.method === "GET")
      return Response.json({ user: null }, { headers });
    if (request.method !== "GET") checkOrigin(request);
    if (path !== "enquiries" || request.method !== "POST")
      throw new HttpError(
        503,
        "Client access is being prepared. Please contact Soham for project updates.",
      );
    const data = inquirySchema.parse(await jsonBody(request));
    const now = Date.now();
    for (const [key, entry] of attempts)
      if (entry.expires <= now) attempts.delete(key);
    for (const [key, entry] of submissions)
      if (entry.expires <= now) submissions.delete(key);
    const key = privateHash(data.request_key);
    const fingerprint = privateHash(JSON.stringify(data));
    let submission = submissions.get(key);
    if (submission && submission.fingerprint !== fingerprint)
      throw new HttpError(
        409,
        "This enquiry changed after submission. Reload the page before sending a new enquiry.",
      );
    if (!submission) {
      const address = privateHash(ipKey(request));
      const limit = attempts.get(address) || {
        count: 0,
        expires: now + 3600000,
      };
      if (limit.count >= 8)
        throw new HttpError(
          429,
          "Please wait before sending another enquiry, or use the email link.",
          Math.ceil((limit.expires - now) / 1000),
        );
      if (attempts.size >= 1000 || submissions.size >= 1000)
        throw new HttpError(
          503,
          "The enquiry form is busy. Please use the email link to contact Soham.",
        );
      limit.count += 1;
      attempts.set(address, limit);
      submission = {
        expires: now + 3600000,
        fingerprint,
        result: deliver({
          ...data,
          id: data.request_key,
          status: "New",
          created_at: new Date(now).toISOString(),
        }),
      };
      submissions.set(key, submission);
    }
    const status = await submission.result;
    if (status === "submitted")
      return Response.json(
        { ok: true, delivery: "submitted" },
        { status: 201, headers },
      );
    if (status === "uncertain")
      throw new HttpError(
        503,
        "We could not confirm delivery. Your details are still here. Please email Soham directly instead of submitting again.",
      );
    // Explicit rejection is safe to retry after activation or a provider fix.
    // Keep accepted/ambiguous submissions cached to avoid accidental repeats.
    submissions.delete(key);
    if (status === "activation_required")
      throw new HttpError(
        503,
        "Email forwarding is being activated. Your details are still here; please use the email link to contact Soham.",
      );
    throw new HttpError(
      503,
      "The email service could not accept your enquiry. Your details are still here; please use the email link to contact Soham.",
      undefined,
      status === "failed" ? "email_provider_rejected" : undefined,
    );
  };
}
export const handlePublicEnquiry = createPublicEnquiryHandler();
