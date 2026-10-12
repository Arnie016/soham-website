import { cookies } from "next/headers";
import { query, execute } from "./database";
import { digest, newToken, HttpError } from "./security";
import type { User } from "../lib/domain";
import { usesEmailOnly, usesSupabase } from "./backend";
export const SESSION_COOKIE = "sk_session";
export async function sessionUser(): Promise<User | null> {
  if (usesEmailOnly()) return null;
  if (usesSupabase())
    return (await import("./supabase/auth")).supabaseSessionUser();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [user] = await query<User>(
    `SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`,
    [digest(token), Date.now()],
  );
  return user || null;
}
export async function requireUser(role?: User["role"]) {
  const user = await sessionUser();
  if (!user)
    throw new HttpError(
      401,
      "Please sign in again. Your form has been kept on this page.",
    );
  if (role && user.role !== role)
    throw new HttpError(403, "This area is for the studio.");
  return user;
}
export async function startSession(userId: string) {
  const token = newToken();
  await execute(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)",
    [digest(token), userId, Date.now() + 1000 * 60 * 60 * 24 * 7],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: !!process.env.VERCEL || !!process.env.APP_URL?.startsWith("https:"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token)
    await execute("DELETE FROM sessions WHERE token_hash=?", [digest(token)]);
  store.delete(SESSION_COOKIE);
}
