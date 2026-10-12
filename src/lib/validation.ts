import { z } from "zod";
import { services, stages, inquiryStatuses } from "./domain";
const short = z.string().trim().min(1, "Please complete this field.").max(180);
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(256),
});
export const inquirySchema = z.object({
  name: short,
  email: emailSchema,
  phone: z.string().trim().max(30),
  service: z.enum(services),
  client_type: z.enum([
    "Homeowner",
    "Builder / developer",
    "Business owner",
    "Design professional",
    "Other",
  ]),
  location: short,
  budget: z.string().max(100),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more, at least 20 characters.")
    .max(4000),
  consent: z.literal(true, {
    error: "Please agree to be contacted about this enquiry.",
  }),
  website: z.string().max(0),
  request_key: z.uuid(),
});
export const inviteSchema = z.object({ name: short, email: emailSchema });
export const activateSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
});
export const projectSchema = z.object({
  request_key: z.uuid(),
  title: short,
  client_id: z.uuid(),
  service: z.enum(services),
  location: short,
  summary: z.string().trim().min(10).max(3000),
  next_step: z.string().trim().min(3).max(500),
});
export const projectEditSchema = z.object({
  stage: z.enum(stages),
  next_step: z.string().trim().min(3).max(500),
  version: z.number().int().positive(),
});
export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message first.").max(4000),
  request_key: z.uuid(),
});
export const inquiryEditSchema = z.object({ status: z.enum(inquiryStatuses) });
