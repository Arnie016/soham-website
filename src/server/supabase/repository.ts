import { userClient } from "./client";
import { HttpError } from "../security";
import type { Project, ProjectDetail } from "@/lib/domain";
export async function supabaseOwnProject(id: string): Promise<Project> {
  const client = await userClient();
  const { data, error } = await client
    .from("sk_projects")
    .select("*,client:sk_profiles!client_id(name)")
    .eq("id", id)
    .maybeSingle();
  if (error || !data)
    throw new HttpError(404, "This project is not available.");
  const { client: owner, ...project } = data;
  return { ...project, client_name: owner?.name } as Project;
}
export async function supabaseProjectDetail(
  id: string,
): Promise<ProjectDetail> {
  const project = await supabaseOwnProject(id),
    client = await userClient();
  const [updates, documents] = await Promise.all([
    client
      .from("sk_updates")
      .select("id,body,kind,created_at,author_name,role")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("sk_documents")
      .select("id,title,filename,mime,size,created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (updates.error || documents.error) throw updates.error || documents.error;
  return {
    ...project,
    updates: updates.data || [],
    documents: documents.data || [],
  };
}
