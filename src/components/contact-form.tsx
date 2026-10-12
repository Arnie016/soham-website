"use client";
import { useState, useContext, useEffect, useRef } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { Field, Form, Fields } from "./ui";
import { GMAIL_COMPOSE } from "@/lib/contact";
import { inquirySchema } from "@/lib/validation";
import { services } from "@/lib/domain";
import { createEnquirySubmission } from "@/lib/enquiry-submission";
export function ContactForm({ initialService }: { initialService?: string }) {
  const [sent, setSent] = useState(false);
  const success = useRef<HTMLDivElement>(null);
  const submitter = useRef<ReturnType<typeof createEnquirySubmission> | null>(
    null,
  );
  useEffect(() => {
    if (sent) {
      success.current?.focus();
      success.current?.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }, [sent]);
  if (sent)
    return (
      <div
        className="enquiry-success"
        role="status"
        ref={success}
        tabIndex={-1}
      >
        <span className="success-icon">
          <Check size={28} />
        </span>
        <span className="eyebrow">A GOOD BEGINNING</span>
        <h2>
          Your idea is
          <br />
          on the drawing board.
        </h2>
        <p>
          Your enquiry has been received. Soham will review your brief and
          contact you using the details you shared.
        </p>
        <p>
          Have plans or reference images to add? You can email them directly.
        </p>
        <a
          className="text-link"
          href={GMAIL_COMPOSE}
          target="_blank"
          rel="noopener noreferrer"
        >
          Email Soham <ArrowUpRight size={17} />
        </a>
        <button className="quiet-button" onClick={() => setSent(false)}>
          Send another enquiry
        </button>
      </div>
    );
  return (
    <Form
      noValidate
      endpoint="/api/enquiries"
      submitRequest={(data) => {
        submitter.current ||= createEnquirySubmission(
          fetch,
          window.location.origin,
        );
        return submitter.current(data);
      }}
      label="Send project enquiry"
      onSuccess={() => setSent(true)}
      validate={(data) => {
        const result = inquirySchema.safeParse(data);
        return result.success
          ? {}
          : Object.fromEntries(
              result.error.issues.map((issue) => [
                issue.path.join("."),
                issue.message,
              ]),
            );
      }}
      transform={(d) => ({ ...d, consent: d.consent === "on" })}
    >
      <div className="form-grid">
        <Field name="name" label="Your name" required autoComplete="name" />
        <Field
          name="email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
        />
        <Field
          name="phone"
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
        />
        <Field
          name="location"
          label="Where is your project?"
          placeholder="City or town"
          required
        />
        <Field
          name="service"
          label="What can I help with?"
          options={services}
          defaultValue={
            services.includes(initialService as any)
              ? initialService
              : services[0]
          }
        />
        <Field
          name="client_type"
          label="A little about you"
          options={[
            "Homeowner",
            "Builder / developer",
            "Business owner",
            "Design professional",
            "Other",
          ]}
        />
        <Field
          name="budget"
          label="Your budget, if known"
          options={[
            "Let’s discuss",
            "Under ₹10 lakh",
            "₹10–30 lakh",
            "₹30–75 lakh",
            "₹75 lakh and above",
          ]}
        />
        <Field
          name="message"
          label="Tell me what you have in mind"
          type="textarea"
          required
          placeholder="A new home, a renovation, or an early idea. Share your space, priorities and any timing you have in mind."
          maxLength={4000}
        />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <ContactConsent />
      <p className="form-note">
        No account needed. We’ll discuss scope and fees before any work begins.
      </p>
    </Form>
  );
}

function ContactConsent() {
  const errors = useContext(Fields);
  return (
    <div>
      <label className="check-label">
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={!!errors.consent}
          aria-describedby={errors.consent ? "consent-error" : undefined}
        />
        <span>
          Soham may use these details to contact me about this project.{" "}
          <a href="/privacy">How your details are used</a>
        </span>
      </label>
      {errors.consent && (
        <span className="field-error" id="consent-error">
          {errors.consent}
        </span>
      )}
    </div>
  );
}
