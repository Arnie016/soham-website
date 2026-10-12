import { execFileSync } from "node:child_process";
export function localSupabaseEnv(port = 3103) {
  const status = JSON.parse(
    execFileSync("supabase", ["status", "--output", "json"], {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }),
  );
  const url = new URL(status.API_URL);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.port !== "55421"
  )
    throw new Error(
      "Expected this project's isolated local Supabase instance.",
    );
  if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY)
    throw new Error("Start local Supabase first.");
  return {
    ...process.env,
    STUDIO_BACKEND: "supabase",
    SUPABASE_URL: status.API_URL,
    SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
    SUPABASE_SECRET_KEY: status.SERVICE_ROLE_KEY,
    APP_URL: `http://localhost:${port}`,
    STUDIO_BUILD_DIR: port === 3103 ? ".next-supabase" : ".next-supabase-test",
  };
}
