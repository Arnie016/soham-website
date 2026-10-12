import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { localSupabaseEnv } from "./local-supabase-env";
async function main() {
  const env = {
    ...localSupabaseEnv(3112),
    EMAIL_TRANSPORT: "disabled",
    RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
  };
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3112",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null)
        throw new Error("Isolated Supabase app stopped.");
      try {
        if ((await fetch(env.APP_URL + "/api/session")).ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (!ready) throw new Error("Isolated Supabase app did not start.");
    const code = await new Promise<number | null>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "tests/supabase.integration.ts"],
        { env, stdio: "inherit" },
      );
      child.on("error", reject);
      child.on("exit", resolve);
    });
    if (code !== 0) process.exitCode = 1;
  } finally {
    if (server.exitCode === null) {
      server.kill("SIGTERM");
      await new Promise((resolve) => server.once("exit", resolve));
    }
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
