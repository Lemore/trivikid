import type { AiQuestion } from "@/lib/schemas";

export type ValidQuestion = {
  question: string;
  options: string[];
  correctOptionText: string;
  explanation: string;
};

// Normalizes a topic for history lookups: trimmed, lower-cased, inner spaces collapsed.
export function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase().replace(/\s+/g, " ");
}

// Enforces the business rules a JSON schema can't express. Returns a cleaned
// question, or null when the AI output must be treated as invalid.
export function validateAiQuestion(ai: AiQuestion): ValidQuestion | null {
  if (ai.status !== "ok") return null;

  const question = ai.question.trim();
  const explanation = ai.explanation.trim();
  const options = ai.options.map((option) => option.trim());
  const correctOptionText = ai.correctOptionText.trim();

  if (!question || !explanation) return null;
  if (options.length !== 4) return null;
  if (options.some((option) => option.length === 0)) return null;
  if (new Set(options).size !== options.length) return null;
  if (options.filter((option) => option === correctOptionText).length !== 1) {
    return null;
  }

  return { question, options, correctOptionText, explanation };
}

// Fisher–Yates shuffle, so the correct answer's position is random.
export function shuffleOptions(
  options: string[],
  correctOptionText: string,
  random: () => number = Math.random,
): { options: string[]; correctIndex: number } {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { options: shuffled, correctIndex: shuffled.indexOf(correctOptionText) };
}
