import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createClient as localDatabase } from "@libsql/client";
import { localSupabaseEnv } from "./local-supabase-env";
async function main() {
  const env = localSupabaseEnv();
  if (process.argv[2] === "setup") {
    const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const email = "sohamkhetan@gmail.com";
    const existing = await admin
      .from("sk_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing.error)
      throw new Error("Apply the local migrations before setup.");
    if (!existing.data) {
      const password = randomBytes(24).toString("base64url");
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error)
        throw new Error("The local architect account could not be created.");
      const profile = await admin.from("sk_profiles").insert({
        id: created.data.user.id,
        email,
        name: "Soham Khetan",
        role: "architect",
      });
      if (profile.error)
        throw new Error("The local architect profile could not be created.");
      mkdirSync(".data", { recursive: true, mode: 0o700 });
      writeFileSync(
        ".data/supabase-local-access.txt",
        `LOCAL SUPABASE PREVIEW ONLY\nEmail: ${email}\nPassword: ${password}\nSign in: http://localhost:3103/login\nKeep this file private. Excluded from deliverables.\n`,
        { mode: 0o600 },
      );
    }
    // Preserve current enquiries locally; never send another email during this copy.
    const db = localDatabase({ url: "file:.data/studio.db" });
    try {
      const rows = await db.execute("SELECT * FROM inquiries");
      if (rows.rows.length) {
        const imported = await admin.from("sk_enquiries").upsert(
          rows.rows.map((row) => ({ ...row })),
          { onConflict: "id", ignoreDuplicates: true },
        );
        if (imported.error)
          throw new Error(
            "Local enquiry copy failed; the original database is unchanged.",
          );
        const notices = await db.execute("SELECT * FROM email_notifications");
        if (notices.rows.length) {
          const result = await admin.from("sk_email_notifications").upsert(
            notices.rows.map((row) => ({
              ...row,
              updated_at: new Date(Number(row.updated_at)).toISOString(),
            })),
            { onConflict: "inquiry_id", ignoreDuplicates: true },
          );
          if (result.error)
            throw new Error("Local notification-state copy failed.");
        }
      }
      console.log(
        `Local Supabase ready. Preserved ${rows.rows.length} enquiries. Credentials are in the private .data/supabase-local-access.txt file.`,
      );
    } finally {
      db.close();
    }
    return;
  }
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3103",
    ],
    { env, stdio: "inherit" },
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.on(signal, () => child.kill(signal));
  child.on("exit", (code) => {
    process.exitCode = code || 0;
  });
}
main().catch(() => {
  console.error(
    "Local Supabase setup did not complete. Check the local services and migrations; no secrets were printed.",
  );
  process.exitCode = 1;
});
