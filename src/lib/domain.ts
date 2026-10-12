export const services = [
  "Architecture",
  "Interiors & renovation",
  "3D visualisation",
  "Concept development",
] as const;
export const stages = [
  "Brief",
  "Concept",
  "Design development",
  "Technical drawings",
  "Complete",
] as const;
export const inquiryStatuses = [
  "New",
  "Contacted",
  "In discussion",
  "Closed",
] as const;
export type User = {
  id: string;
  name: string;
  email: string;
  role: "architect" | "client";
};
export type Project = {
  id: string;
  title: string;
  client_id: string;
  client_name?: string;
  service: string;
  location: string;
  summary: string;
  stage: string;
  next_step: string;
  version: number;
  created_at: string;
};
export type Inquiry = {
  email_status?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  client_type: string;
  location: string;
  budget: string;
  message: string;
  status: string;
  created_at: string;
};
export type Update = {
  id: string;
  author_name: string;
  role: string;
  body: string;
  kind: string;
  created_at: string;
};
export type Document = {
  id: string;
  title: string;
  filename: string;
  mime: string;
  size: number;
  created_at: string;
};
export type ProjectDetail = Project & {
  updates: Update[];
  documents: Document[];
};
