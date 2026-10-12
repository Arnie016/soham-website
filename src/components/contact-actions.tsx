"use client";
import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE, GMAIL_COMPOSE } from "@/lib/contact";
export function ContactActions() {
  const [copied, setCopied] = useState("");
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
    } catch {
      setCopied("Please select the address or number to copy it.");
    }
  }
  return (
    <div className="contact-actions">
      <div className="contact-action-row">
        <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer">
          {CONTACT_EMAIL} <ArrowUpRight size={17} />
        </a>
        <button
          type="button"
          onClick={() => copy(CONTACT_EMAIL)}
          aria-label="Copy email address"
        >
          {copied === CONTACT_EMAIL ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied === CONTACT_EMAIL ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <div className="mail-options">
        <a href={GMAIL_COMPOSE} target="_blank" rel="noopener noreferrer">
          Open in Gmail
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`}>Use my mail app</a>
      </div>
      <div className="contact-action-row">
        <a href={`tel:${CONTACT_PHONE}`}>
          +91 93568 46922 <ArrowUpRight size={17} />
        </a>
        <button
          type="button"
          onClick={() => copy(CONTACT_PHONE)}
          aria-label="Copy phone number"
        >
          {copied === CONTACT_PHONE ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied === CONTACT_PHONE ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <span className="sr-only" role="status">
        {copied === CONTACT_EMAIL
          ? "Email address copied."
          : copied === CONTACT_PHONE
            ? "Phone number copied."
            : copied}
      </span>
    </div>
  );
}
