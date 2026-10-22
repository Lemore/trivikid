import { QuestionRequestSchema } from "@/lib/schemas";
import { GeneratorTimeoutError, generateQuestion } from "@/lib/server/question-generator";

// Leaves room for one retry of the ~30s AI call.
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: "error" }, { status: 400 });
  }

  const parsed = QuestionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ status: "error" }, { status: 400 });
  }

  try {
    const result = await generateQuestion(parsed.data.topic, parsed.data.previousQuestions);
    return Response.json(result, { status: result.status === "error" ? 502 : 200 });
  } catch (error) {
    // Log only the error type, never the topic.
    console.error("question generation failed:", error instanceof Error ? error.name : "unknown");
    if (error instanceof GeneratorTimeoutError) {
      return Response.json({ status: "error" }, { status: 504 });
    }
    return Response.json({ status: "error" }, { status: 502 });
  }
}
