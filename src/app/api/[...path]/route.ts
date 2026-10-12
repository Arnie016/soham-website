import { handle } from "@/server/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const route = async (request: Request, context: Context) =>
  handle(request, (await context.params).path);
export { route as GET, route as POST, route as PATCH };
