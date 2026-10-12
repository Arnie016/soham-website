import { createClient } from "@supabase/supabase-js";
import { emailSchema } from "../src/lib/validation";
async function main() {
  const url = process.env.SUPABASE_URL,
    secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret)
    throw new Error(
      "Set the target project's Supabase URL and server secret privately in the process environment.",
    );
  const email = emailSchema.parse(process.env.ADMIN_EMAIL);
  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const existing = await admin
    .from("sk_profiles")
    .select("id,role")
    .eq("email", email)
    .maybeSingle();
  if (existing.error)
    throw new Error(
      "Apply the studio migrations to the selected project before account setup.",
    );
  if (existing.data) {
    if (existing.data.role !== "architect")
      throw new Error(
        "This email already belongs to a client. No role or password was changed.",
      );
    console.log("Architect account already exists. No password changed.");
    return;
  }
  let id = process.env.ADMIN_AUTH_USER_ID;
  if (id) {
    const user = await admin.auth.admin.getUserById(id);
    if (
      user.error ||
      user.data.user.email?.toLowerCase() !== email ||
      !user.data.user.email_confirmed_at
    )
      throw new Error(
        "The explicit Auth user must have the same confirmed email. No account changed.",
      );
  } else {
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 12)
      throw new Error(
        "Provide ADMIN_PASSWORD privately, at least 12 characters, or an existing confirmed ADMIN_AUTH_USER_ID.",
      );
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error)
      throw new Error(
        "Account creation failed. If the user already exists in Supabase Auth, supply its ADMIN_AUTH_USER_ID instead. No existing password is reset.",
      );
    id = created.data.user.id;
  }
  const profile = await admin
    .from("sk_profiles")
    .insert({ id, email, name: "Soham Khetan", role: "architect" });
  if (profile.error)
    throw new Error(
      "Architect profile could not be created. Check the selected project's migration state.",
    );
  console.log(
    "Architect profile created in the configured Supabase project. No credentials printed or saved.",
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Setup failed.");
  process.exitCode = 1;
});
