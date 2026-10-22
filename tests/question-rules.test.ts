import { describe, expect, test } from "vitest";
import { normalizeTopic, shuffleOptions, validateAiQuestion } from "@/lib/question-rules";
import type { AiQuestion } from "@/lib/schemas";

const valid: AiQuestion = {
  status: "ok",
  question: "איזה כוכב לכת הוא הגדול ביותר במערכת השמש?",
  options: ["מאדים", "צדק", "נוגה", "שבתאי"],
  correctOptionText: "צדק",
  explanation: "צדק כל כך גדול שכל שאר כוכבי הלכת יכולים להיכנס בתוכו!",
};

describe("validateAiQuestion", () => {
  test("accepts a valid question and trims its texts", () => {
    const result = validateAiQuestion({ ...valid, options: [" מאדים ", "צדק", "נוגה", "שבתאי"] });
    expect(result?.options[0]).toBe("מאדים");
    expect(result?.correctOptionText).toBe("צדק");
  });

  test("rejects anything other than exactly 4 options", () => {
    expect(validateAiQuestion({ ...valid, options: ["מאדים", "צדק", "נוגה"] })).toBeNull();
    expect(validateAiQuestion({ ...valid, options: [...valid.options, "אורנוס"] })).toBeNull();
  });

  test("rejects an empty or duplicate option", () => {
    expect(validateAiQuestion({ ...valid, options: ["מאדים", "צדק", " ", "שבתאי"] })).toBeNull();
    expect(validateAiQuestion({ ...valid, options: ["מאדים", "צדק", "צדק ", "שבתאי"] })).toBeNull();
  });

  test("rejects a correct answer that matches no option", () => {
    expect(validateAiQuestion({ ...valid, correctOptionText: "פלוטו" })).toBeNull();
  });

  test("rejects an empty question or explanation", () => {
    expect(validateAiQuestion({ ...valid, question: "" })).toBeNull();
    expect(validateAiQuestion({ ...valid, explanation: "  " })).toBeNull();
  });

  test("rejects non-ok statuses", () => {
    expect(validateAiQuestion({ ...valid, status: "unclear_topic" })).toBeNull();
  });
});

describe("shuffleOptions", () => {
  // Small deterministic pseudo-random generator for repeatable tests.
  function seeded(seed: number) {
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  test("keeps the same 4 options and points correctIndex at the correct one", () => {
    const { options, correctIndex } = shuffleOptions(valid.options, "צדק", seeded(7));
    expect([...options].sort()).toEqual([...valid.options].sort());
    expect(options[correctIndex]).toBe("צדק");
  });

  test("places the correct answer in different positions", () => {
    const random = seeded(42);
    const positions = new Set(
      Array.from({ length: 40 }, () => shuffleOptions(valid.options, "צדק", random).correctIndex),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("normalizeTopic", () => {
  test("trims, lower-cases and collapses spaces", () => {
    expect(normalizeTopic("  Star   Wars ")).toBe("star wars");
  });
});
