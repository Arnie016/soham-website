import { createClient, type Client, type InValue } from "@libsql/client";
import { chmodSync, mkdirSync } from "node:fs";
let client: Client | undefined;
let ready: Promise<unknown> | undefined;
const schema = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT, role TEXT NOT NULL CHECK(role IN ('architect','client')), created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS invitations (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL, used_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, service TEXT NOT NULL, client_type TEXT NOT NULL, location TEXT NOT NULL, budget TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'New', request_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, title TEXT NOT NULL, client_id TEXT NOT NULL REFERENCES users(id), service TEXT NOT NULL, location TEXT NOT NULL, summary TEXT NOT NULL, stage TEXT NOT NULL DEFAULT 'Brief', next_step TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS updates (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), author_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL, kind TEXT NOT NULL, request_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL, filename TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, body BLOB NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS operation_keys (request_key TEXT PRIMARY KEY, actor_id TEXT NOT NULL, kind TEXT NOT NULL, resource_id TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS email_notifications (inquiry_id TEXT PRIMARY KEY REFERENCES inquiries(id), status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS projects_client ON projects(client_id)`,
  `CREATE INDEX IF NOT EXISTS updates_project ON updates(project_id,created_at)`,
  `CREATE INDEX IF NOT EXISTS documents_project ON documents(project_id)`,
];
export async function database() {
  if (!client) {
    if (
      process.env.VERCEL &&
      (!process.env.DATABASE_URL ||
        process.env.DATABASE_URL.startsWith("file:"))
    )
      throw new Error("A remote database must be configured for deployment.");
    if (!process.env.DATABASE_URL) {
      mkdirSync(".data", { recursive: true, mode: 0o700 });
      chmodSync(".data", 0o700);
    }
    client = createClient({
      url: process.env.DATABASE_URL || "file:.data/studio.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  if (!ready)
    ready = client.batch(schema, "write").catch((error) => {
      ready = undefined;
      throw error;
    });
  await ready;
  return client;
}
export async function query<T = Record<string, unknown>>(
  sql: string,
  args: InValue[] = [],
): Promise<T[]> {
  const result = await (await database()).execute({ sql, args });
  return result.rows.map((row) => ({ ...row })) as unknown as T[];
}
export async function execute(sql: string, args: InValue[] = []) {
  return (await database()).execute({ sql, args });
}
