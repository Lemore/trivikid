import { describe, expect, test } from "vitest";
import { QuestionRequestSchema, QuestionResponseSchema } from "@/lib/schemas";

describe("QuestionRequestSchema", () => {
  test("trims the topic and defaults previousQuestions", () => {
    const result = QuestionRequestSchema.parse({ topic: "  חלל  " });
    expect(result).toEqual({ topic: "חלל", previousQuestions: [] });
  });

  test("rejects an empty or whitespace-only topic", () => {
    expect(QuestionRequestSchema.safeParse({ topic: "" }).success).toBe(false);
    expect(QuestionRequestSchema.safeParse({ topic: "   " }).success).toBe(false);
  });

  test("accepts 50 characters and rejects 51", () => {
    expect(QuestionRequestSchema.safeParse({ topic: "א".repeat(50) }).success).toBe(true);
    expect(QuestionRequestSchema.safeParse({ topic: "א".repeat(51) }).success).toBe(false);
  });

  test("limits previousQuestions to 30 items of at most 300 characters", () => {
    const parse = (previousQuestions: string[]) =>
      QuestionRequestSchema.safeParse({ topic: "חלל", previousQuestions }).success;
    expect(parse(Array.from({ length: 30 }, (_, i) => `שאלה ${i}?`))).toBe(true);
    expect(parse(Array.from({ length: 31 }, (_, i) => `שאלה ${i}?`))).toBe(false);
    expect(parse(["א".repeat(300)])).toBe(true);
    expect(parse(["א".repeat(301)])).toBe(false);
  });

  test("rejects extra fields", () => {
    expect(QuestionRequestSchema.safeParse({ topic: "חלל", extra: 1 }).success).toBe(false);
  });

  test("rejects a missing or non-string topic", () => {
    expect(QuestionRequestSchema.safeParse({}).success).toBe(false);
    expect(QuestionRequestSchema.safeParse({ topic: 5 }).success).toBe(false);
  });
});

describe("QuestionResponseSchema", () => {
  const ok = {
    status: "ok",
    question: "שאלה?",
    options: ["א", "ב", "ג", "ד"],
    correctIndex: 2,
    explanation: "הסבר.",
  };

  test("accepts a valid question", () => {
    expect(QuestionResponseSchema.safeParse(ok).success).toBe(true);
  });

  test("rejects 3 options or an out-of-range correctIndex", () => {
    expect(QuestionResponseSchema.safeParse({ ...ok, options: ["א", "ב", "ג"] }).success).toBe(false);
    expect(QuestionResponseSchema.safeParse({ ...ok, correctIndex: 4 }).success).toBe(false);
  });

  test("accepts status-only responses", () => {
    expect(QuestionResponseSchema.safeParse({ status: "error" }).success).toBe(true);
  });
});
