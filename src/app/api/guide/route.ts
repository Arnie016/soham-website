import { z } from "zod";
import { answerQuestion } from "@/lib/guide/knowledge";
import { checkOrigin, readBody, HttpError } from "@/server/security";
export const runtime = "nodejs";
const schema = z.object({
  question: z.string().trim().min(2).max(600),
  context: z.string().max(80).nullable().optional(),
});
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    checkOrigin(request);
    const parsed = schema.safeParse(
      JSON.parse((await readBody(request, 2048)).toString()),
    );
    if (!parsed.success)
      return Response.json(
        { error: "Ask a question between 2 and 600 characters." },
        { status: 400, headers },
      );
    return Response.json(
      answerQuestion(parsed.data.question, parsed.data.context),
      { headers },
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof HttpError
            ? e.message
            : "Please send a short text question.",
      },
      { status: e instanceof HttpError ? e.status : 400, headers },
    );
  }
}
