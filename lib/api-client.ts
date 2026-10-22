import {
  QuestionResponseSchema,
  type QuestionRequest,
  type QuestionResponse,
} from "@/lib/schemas";

// The server allows ~30s per AI call plus one retry, so the client waits a little longer.
export const CLIENT_TIMEOUT_MS = 60_000;

// "offline" is client-only: the request never reached the server.
export type FetchResult = QuestionResponse | { status: "offline" };

// Requests a question from the server. A network failure becomes { status: "offline" };
// a timeout or any other unexpected outcome becomes { status: "error" }.
export async function fetchQuestion(body: QuestionRequest): Promise<FetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch("/api/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return controller.signal.aborted ? { status: "error" } : { status: "offline" };
  }

  try {
    const parsed = QuestionResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : { status: "error" };
  } catch {
    return { status: "error" };
  } finally {
    clearTimeout(timer);
  }
}
