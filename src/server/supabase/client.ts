import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
export function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration is incomplete.");
  return { url, key };
}
export async function userClient() {
  const { url, key } = supabaseConfig();
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure:
        !!process.env.VERCEL || !!process.env.APP_URL?.startsWith("https:"),
      path: "/",
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Server components cannot write cookies; proxy refreshes them. */
        }
      },
    },
  });
}
export function adminClient() {
  const { url } = supabaseConfig();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Supabase server secret is missing.");
  return createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
