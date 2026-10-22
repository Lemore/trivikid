"use client";

import { useRef, useState, type FormEvent } from "react";
import { BlockButton } from "@/components/BlockButton";
import { fetchQuestion } from "@/lib/api-client";
import { normalizeTopic } from "@/lib/question-rules";
import type { TriviaQuestion } from "@/lib/schemas";
import { strings } from "@/lib/strings";
import { QuestionCard } from "./QuestionCard";
import { TopicInput } from "./TopicInput";

type UiState = "idle" | "loading" | "question" | "answered" | "message";

// The Trivia screen's game: topic input, request button, and the current question.
export function TriviaGame() {
  const [topic, setTopic] = useState("");
  const [ui, setUi] = useState<UiState>("idle");
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // Questions shown per normalized topic during this visit (memory only).
  const history = useRef(new Map<string, string[]>());
  // Guards against double taps before the disabled state re-renders.
  const inFlight = useRef(false);

  async function requestQuestion(event: FormEvent) {
    event.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || inFlight.current) return;

    inFlight.current = true;
    setUi("loading");
    setQuestion(null);
    setSelectedIndex(null);

    const key = normalizeTopic(trimmed);
    const previousQuestions = history.current.get(key) ?? [];
    const result = await fetchQuestion({ topic: trimmed, previousQuestions });

    if (result.status === "ok") {
      history.current.set(key, [...previousQuestions, result.question]);
      setQuestion(result);
      setUi("question");
    } else {
      setUi("message");
    }
    inFlight.current = false;
  }

  function answer(index: number) {
    if (ui !== "question") return;
    setSelectedIndex(index);
    setUi("answered");
  }

  const loading = ui === "loading";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={requestQuestion} className="flex flex-col gap-4">
        <TopicInput value={topic} onChange={setTopic} />
        <BlockButton type="submit" disabled={loading}>
          {loading ? strings.trivia.loading : strings.trivia.newQuestion}
        </BlockButton>
      </form>

      <div className="mt-2">
        {question && (ui === "question" || ui === "answered") && (
          <QuestionCard question={question} selectedIndex={selectedIndex} onAnswer={answer} />
        )}
        {ui === "message" && (
          <p role="status" className="rounded-2xl bg-error-bg px-4 py-3 text-lg font-bold text-error-ink">
            {strings.trivia.error}
          </p>
        )}
      </div>
    </div>
  );
}
