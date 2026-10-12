import { query, database } from "./database";
import { HttpError } from "./security";
import { usesSupabase } from "./backend";
import type {
  User,
  Project,
  ProjectDetail,
  Update,
  Document,
} from "../lib/domain";
export async function ownProject(id: string, user: User): Promise<Project> {
  if (usesSupabase())
    return (await import("./supabase/repository")).supabaseOwnProject(id);
  const [project] = await query<Project>(
    "SELECT p.*,u.name client_name FROM projects p JOIN users u ON u.id=p.client_id WHERE p.id=? AND (? = 'architect' OR p.client_id=?)",
    [id, user.role, user.id],
  );
  if (!project) throw new HttpError(404, "This project is not available.");
  return project;
}
export async function projectDetail(
  id: string,
  user: User,
): Promise<ProjectDetail> {
  if (usesSupabase())
    return (await import("./supabase/repository")).supabaseProjectDetail(id);
  const project = await ownProject(id, user);
  const [updates, documents] = await Promise.all([
    query<Update>(
      "SELECT n.id,n.body,n.kind,n.created_at,u.name author_name,u.role FROM updates n JOIN users u ON u.id=n.author_id WHERE n.project_id=? ORDER BY n.created_at DESC LIMIT 100",
      [id],
    ),
    query<Document>(
      "SELECT id,title,filename,mime,size,created_at FROM documents WHERE project_id=? ORDER BY created_at DESC LIMIT 100",
      [id],
    ),
  ]);
  return { ...project, updates, documents };
}

// Records the result and the write in one transaction so a retry cannot create duplicates.
export async function createOnce(
  actorId: string,
  key: string,
  kind: string,
  resourceId: string,
  write: (tx: import("@libsql/client").Transaction) => Promise<unknown>,
) {
  const tx = await (await database()).transaction("write");
  try {
    const existing = (
      await tx.execute({
        sql: "SELECT actor_id,kind,resource_id FROM operation_keys WHERE request_key=?",
        args: [key],
      })
    ).rows[0];
    if (existing) {
      if (existing.actor_id !== actorId || existing.kind !== kind)
        throw new HttpError(400, "Please reload and try again.");
      await tx.commit();
      return String(existing.resource_id);
    }
    await write(tx);
    await tx.execute({
      sql: "INSERT INTO operation_keys(request_key,actor_id,kind,resource_id) VALUES (?,?,?,?)",
      args: [key, actorId, kind, resourceId],
    });
    await tx.commit();
    return resourceId;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}
