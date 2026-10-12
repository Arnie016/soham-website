import { execute, query } from "./database";
import { CONTACT_EMAIL } from "../lib/contact";
import type { Inquiry } from "../lib/domain";
export type EmailStatus =
  | "queued"
  | "sending"
  | "submitted"
  | "activation_required"
  | "failed"
  | "uncertain"
  | "disabled";
export function enquiryEmail(data: Inquiry) {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone || "Not provided",
    service: data.service,
    client_type: data.client_type,
    location: data.location,
    budget: data.budget || "To discuss",
    message: data.message,
    reference: data.id,
    _subject: `New architecture enquiry: ${data.service}`,
    _template: "table",
    _url: `${process.env.APP_URL || "http://localhost:3100"}/contact`,
  };
}
export async function sendEnquiryEmail(
  data: Inquiry,
  transport: typeof fetch = fetch,
): Promise<EmailStatus> {
  if (process.env.EMAIL_TRANSPORT === "disabled") return "disabled";
  try {
    const response = await transport(
      `https://formsubmit.co/ajax/${CONTACT_EMAIL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: process.env.APP_URL || "http://localhost:3100",
          Referer: `${process.env.APP_URL || "http://localhost:3100"}/contact`,
        },
        body: JSON.stringify(enquiryEmail(data)),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) {
      console.warn("Enquiry provider rejected request", {
        status: response.status,
      });
      return "failed";
    }
    const result = await response.json();
    if (/activat|confirm.*email/i.test(String(result.message || "")))
      return "activation_required";
    return result.success === true || result.success === "true"
      ? "submitted"
      : "failed";
  } catch {
    // A network timeout may happen after the provider accepted it. Never retry automatically.
    return "uncertain";
  }
}
export async function notifyEnquiry(id: string, retry = false) {
  await execute(
    "INSERT INTO email_notifications(inquiry_id,status,attempts,updated_at) VALUES (?,'queued',0,?) ON CONFLICT(inquiry_id) DO NOTHING",
    [id, Date.now()],
  );
  const [claimed] = await query<{ inquiry_id: string }>(
    "UPDATE email_notifications SET status='sending',attempts=attempts+1,updated_at=? WHERE inquiry_id=? AND (status='queued' OR (?=1 AND status IN ('failed','disabled','activation_required') AND updated_at<?)) RETURNING inquiry_id",
    [Date.now(), id, retry ? 1 : 0, Date.now() - 60000],
  );
  if (!claimed) return;
  const [data] = await query<Inquiry>("SELECT * FROM inquiries WHERE id=?", [
    id,
  ]);
  if (!data) return;
  const status = await sendEnquiryEmail(data);
  await execute(
    "UPDATE email_notifications SET status=?,updated_at=? WHERE inquiry_id=?",
    [status, Date.now(), id],
  );
  return status;
}
