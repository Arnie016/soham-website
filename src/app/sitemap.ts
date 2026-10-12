import projects from "@/content/projects.json";
export default function sitemap() {
  if (!process.env.APP_URL) return [];
  return [
    "",
    "/work",
    "/services",
    "/about",
    "/contact",
    ...projects.map((p) => `/work/${p.id}`),
  ].map((path) => ({ url: `${process.env.APP_URL}${path}` }));
}
