import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.STUDIO_BUILD_DIR || ".next",
  poweredByHeader: false,
  devIndicators: false,
  turbopack: { root: process.cwd() },
  serverExternalPackages: ["@libsql/client"],
  async headers() {
    const scriptSources =
      process.env.NODE_ENV === "development"
        ? "'self' 'unsafe-inline' 'unsafe-eval'"
        : "'self' 'unsafe-inline'";
    return [
      ...[
        "/models/:path*",
        "/media/:path*",
        "/portfolio-hd/:path*",
        "/fonts/:path*",
      ].map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${scriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://formsubmit.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};
export default config;
