import { userClient } from "./client";
import type { User } from "@/lib/domain";
export async function supabaseSessionUser(): Promise<User | null> {
  const client = await userClient();
  // Check the current Auth user, including revocation, rather than trusting cookie contents.
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const profile = await client
    .from("sk_profiles")
    .select("id,name,email,role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile.error) throw profile.error;
  return profile.data as User | null;
}
