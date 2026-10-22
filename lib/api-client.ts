import {
  QuestionResponseSchema,
  type QuestionRequest,
  type QuestionResponse,
} from "@/lib/schemas";

// Requests a question from the server. Any unexpected outcome becomes { status: "error" }.
export async function fetchQuestion(body: QuestionRequest): Promise<QuestionResponse> {
  try {
    const response = await fetch("/api/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const parsed = QuestionResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : { status: "error" };
  } catch {
    return { status: "error" };
  }
}
