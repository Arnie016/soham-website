"use client";
import { useSearchParams } from "next/navigation";
import { ContactForm } from "./contact-form";
export function ContactEntry() {
  const service = useSearchParams().get("service") || undefined;
  return <ContactForm key={service || "default"} initialService={service} />;
}
