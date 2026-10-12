import { CONTACT_EMAIL } from "./contact";
import { inquirySchema } from "./validation";

// FormSubmit supports browser AJAX. Use it only after an explicit rejection
// from the cloud relay, never after a timeout or an ambiguous server outcome.
export function createEnquirySubmission(
  transport: typeof fetch,
  origin: string,
) {
  const outcomes = new Map<string, Promise<{ body: object; status: number }>>();
  return async (input: Record<string, unknown>) => {
    const data = inquirySchema.parse(input);
    let result = outcomes.get(data.request_key);
    if (!result) {
      result = (async () => {
        try {
          const response = await transport("/api/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(20000),
          });
          const body = await response.json();
          if (body.code !== "email_provider_rejected")
            return { body, status: response.status };
          const direct = await transport(
            `https://formsubmit.co/ajax/${CONTACT_EMAIL}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              credentials: "omit",
              referrerPolicy: "strict-origin-when-cross-origin",
              body: JSON.stringify({
                name: data.name,
                email: data.email,
                phone: data.phone,
                location: data.location,
                service: data.service,
                client_type: data.client_type,
                budget: data.budget,
                message: data.message,
                reference: data.request_key,
                _subject: `New architecture enquiry: ${data.service}`,
                _template: "table",
                _url: `${origin}/contact`,
                _honey: data.website,
              }),
              signal: AbortSignal.timeout(12000),
            },
          );
          const delivered = await direct.json();
          if (/activat|confirm.*email/i.test(String(delivered.message || "")))
            return {
              status: 503,
              body: {
                error:
                  "Email forwarding is being activated. Please use the email link to contact Soham.",
              },
            };
          if (
            direct.ok &&
            (delivered.success === true || delivered.success === "true")
          )
            return { status: 201, body: { ok: true, delivery: "submitted" } };
          return {
            status: 503,
            body: {
              error:
                "The email service could not accept your enquiry. Please use the email link to contact Soham.",
            },
          };
        } catch {
          // Keep this outcome for this request key; don't resend an uncertain email.
          return {
            status: 503,
            body: {
              uncertain: true,
              error:
                "We could not confirm delivery. Your details are still here. Please email Soham directly instead of submitting again.",
            },
          };
        }
      })();
      outcomes.set(data.request_key, result);
    }
    const outcome = await result;
    if (outcome.status >= 400 && !("uncertain" in outcome.body))
      outcomes.delete(data.request_key);
    return Response.json(outcome.body, { status: outcome.status });
  };
}
