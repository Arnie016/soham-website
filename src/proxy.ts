import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { usesSupabase } from "./server/backend";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (
    !usesSupabase() ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_PUBLISHABLE_KEY
  )
    return response;
  const client = createServerClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure:
          !!process.env.VERCEL || !!process.env.APP_URL?.startsWith("https:"),
        path: "/",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/portal/:path*",
    "/studio/:path*",
    "/login",
    "/activate",
    "/api/:path*",
  ],
};
