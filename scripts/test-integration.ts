import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
async function main() {
  if (process.env.VERCEL)
    throw new Error("Integration tests run locally only.");
  mkdirSync(".data", { recursive: true });
  const file = resolve(".data", `integration-${randomUUID()}.db`);
  const env = {
    ...process.env,
    EMAIL_TRANSPORT: "disabled",
    DATABASE_URL: `file:${file}`,
    DATABASE_AUTH_TOKEN: "",
    APP_URL: "http://localhost:3111",
    TEST_BASE_URL: "http://localhost:3111",
  };
  const server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3111",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let logs = "";
  server.stdout?.on("data", (c) => (logs += c));
  server.stderr?.on("data", (c) => (logs += c));
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null)
        throw new Error(
          "Test server stopped. Run npm run build first and check port 3111 is free.",
        );
      try {
        const r = await fetch(env.APP_URL + "/api/session");
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready)
      throw new Error("Test server did not start. Run npm run build first.");
    const code = await new Promise<number | null>((done, reject) => {
      const child = spawn(
        process.execPath,
        ["--import", "tsx", "tests/integration.ts"],
        { env, stdio: "inherit" },
      );
      child.on("error", reject);
      child.on("exit", done);
    });
    if (code !== 0) process.exitCode = 1;
  } finally {
    if (server.exitCode === null) {
      server.kill("SIGTERM");
      await new Promise((resolve) => server.once("exit", resolve));
    }
    for (const suffix of ["", "-shm", "-wal"])
      rmSync(file + suffix, { force: true });
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
