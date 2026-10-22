import { beforeEach, describe, expect, test, vi } from "vitest";

const parseMock = vi.fn();

vi.mock("openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("openai")>();
  class FakeOpenAI {
    static APIError = actual.default.APIError;
    responses = { parse: parseMock };
  }
  return { ...actual, default: FakeOpenAI };
});

const { POST } = await import("@/app/api/question/route");
const { APIConnectionTimeoutError } = await import("openai");

const validAi = {
  status: "ok",
  question: "איזה כוכב לכת הוא הגדול ביותר?",
  options: ["מאדים", "צדק", "נוגה", "שבתאי"],
  correctOptionText: "צדק",
  explanation: "צדק הוא הגדול ביותר.",
};

function aiResponse(output: unknown) {
  return { status: "completed", output_parsed: output };
}

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  parseMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/question", () => {
  test("returns 400 for bad JSON, an empty topic or a topic over 50 characters", async () => {
    expect((await post("not json")).status).toBe(400);
    expect((await post({ topic: "  " })).status).toBe(400);
    expect((await post({ topic: "א".repeat(51) })).status).toBe(400);
    expect(parseMock).not.toHaveBeenCalled();
  });

  test("returns 400 for too many previous questions or extra fields", async () => {
    const many = Array.from({ length: 31 }, (_, i) => `שאלה ${i}?`);
    expect((await post({ topic: "חלל", previousQuestions: many })).status).toBe(400);
    expect((await post({ topic: "חלל", previousQuestions: ["א".repeat(301)] })).status).toBe(400);
    expect((await post({ topic: "חלל", extra: true })).status).toBe(400);
    expect(parseMock).not.toHaveBeenCalled();
  });

  test("returns a shuffled question with a correct index", async () => {
    parseMock.mockResolvedValue(aiResponse(validAi));
    const response = await post({ topic: "חלל" });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.options).toHaveLength(4);
    expect(data.options[data.correctIndex]).toBe("צדק");
    expect(data).not.toHaveProperty("correctOptionText");
  });

  test("sends the topic and previous questions as delimited data", async () => {
    parseMock.mockResolvedValue(aiResponse(validAi));
    await post({ topic: "חלל", previousQuestions: ["שאלה קודמת?"] });
    const input = parseMock.mock.calls[0][0].input as string;
    expect(input).toContain("<topic>\nחלל\n</topic>");
    expect(input).toContain("- שאלה קודמת?");
  });

  test("retries once on an invalid AI result, then succeeds", async () => {
    parseMock
      .mockResolvedValueOnce(aiResponse({ ...validAi, options: ["א", "ב", "ג"] }))
      .mockResolvedValueOnce(aiResponse(validAi));
    const response = await post({ topic: "חלל" });
    expect(response.status).toBe(200);
    expect(parseMock).toHaveBeenCalledTimes(2);
  });

  test("returns 502 when both attempts are invalid", async () => {
    parseMock.mockResolvedValue(aiResponse({ ...validAi, correctOptionText: "פלוטו" }));
    const response = await post({ topic: "חלל" });
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ status: "error" });
    expect(parseMock).toHaveBeenCalledTimes(2);
  });

  test("treats a refusal or incomplete response as invalid", async () => {
    parseMock
      .mockResolvedValueOnce(aiResponse(null))
      .mockResolvedValueOnce({ status: "incomplete", output_parsed: validAi });
    expect((await post({ topic: "חלל" })).status).toBe(502);
  });

  test("retries once on a duplicate question, then returns the new one", async () => {
    const fresh = { ...validAi, question: "כמה ירחים יש למאדים?" };
    parseMock
      .mockResolvedValueOnce(aiResponse(validAi))
      .mockResolvedValueOnce(aiResponse(fresh));
    const response = await post({ topic: "חלל", previousQuestions: ["איזה כוכב לכת הוא הגדול ביותר"] });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.question).toBe(fresh.question);
    expect(parseMock).toHaveBeenCalledTimes(2);
  });

  test("returns no_new_question when the retry is also a duplicate", async () => {
    parseMock.mockResolvedValue(aiResponse(validAi));
    const response = await post({ topic: "חלל", previousQuestions: [validAi.question] });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "no_new_question" });
    expect(parseMock).toHaveBeenCalledTimes(2);
  });

  test("returns 502 when a duplicate is followed by an invalid result", async () => {
    parseMock
      .mockResolvedValueOnce(aiResponse(validAi))
      .mockResolvedValueOnce(aiResponse({ ...validAi, options: [] }));
    const response = await post({ topic: "חלל", previousQuestions: [validAi.question] });
    expect(response.status).toBe(502);
  });

  test("passes through unclear_topic and no_new_question from the model", async () => {
    const empty = { question: "", options: [], correctOptionText: "", explanation: "" };
    parseMock.mockResolvedValueOnce(aiResponse({ status: "unclear_topic", ...empty }));
    let response = await post({ topic: "אאאא" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "unclear_topic" });

    parseMock.mockResolvedValueOnce(aiResponse({ status: "no_new_question", ...empty }));
    response = await post({ topic: "חלל" });
    expect(await response.json()).toEqual({ status: "no_new_question" });
    expect(parseMock).toHaveBeenCalledTimes(2);
  });

  test("never logs the topic text", async () => {
    parseMock.mockRejectedValue(new Error("boom"));
    await post({ topic: "נושא-סודי" });
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).not.toContain("נושא-סודי");
  });

  test("returns 504 on an AI timeout", async () => {
    parseMock.mockRejectedValue(new APIConnectionTimeoutError());
    const response = await post({ topic: "חלל" });
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ status: "error" });
  });
});
