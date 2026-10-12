export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/portal", "/api", "/activate", "/login"],
      },
    ],
    ...(process.env.APP_URL
      ? { sitemap: `${process.env.APP_URL}/sitemap.xml` }
      : {}),
  };
}
