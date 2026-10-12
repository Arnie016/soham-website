import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { execute, query } from "../src/server/database";
import { hashPassword } from "../src/server/security";
async function main() {
  if (process.env.VERCEL)
    throw new Error("Run the setup explicitly from a trusted local terminal.");
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.startsWith("file:") &&
    (!process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD ||
      process.env.ADMIN_PASSWORD.length < 12)
  )
    throw new Error(
      "A production email and password of at least 12 characters are required.",
    );
  const email = process.env.ADMIN_EMAIL || "studio@local.test";
  if ((await query("SELECT id FROM users WHERE role='architect'")).length) {
    console.log("Studio account already exists. No changes made.");
    return;
  }
  const password =
    process.env.ADMIN_PASSWORD || randomBytes(18).toString("base64url");
  await execute(
    "INSERT INTO users(id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
    [
      randomUUID(),
      "Soham Khetan",
      email,
      await hashPassword(password),
      "architect",
      new Date().toISOString(),
    ],
  );
  mkdirSync(".data", { recursive: true, mode: 0o700 });
  writeFileSync(
    ".data/local-access.txt",
    `Studio sign-in\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. It is excluded from source control.\n`,
    { mode: 0o600 },
  );
  console.log(
    "Studio account created. Private credentials are in .data/local-access.txt. No client accounts or projects were invented.",
  );
}
main().catch(() => {
  console.error("Setup failed. Check the database configuration.");
  process.exitCode = 1;
});
