export function usesEmailOnly() {
  return process.env.STUDIO_BACKEND === "email";
}
export function usesSupabase() {
  if (usesEmailOnly()) return false;
  if (process.env.VERCEL) return true;
  if (process.env.STUDIO_BACKEND === "local") return false;
  return (
    process.env.STUDIO_BACKEND === "supabase" || !!process.env.SUPABASE_URL
  );
}
