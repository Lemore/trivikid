"use client";

import { useRef, useState, type FormEvent } from "react";
import { BlockButton } from "@/components/BlockButton";
import { fetchQuestion } from "@/lib/api-client";
import { normalizeTopic } from "@/lib/question-rules";
import { PREVIOUS_QUESTIONS_MAX, type TriviaQuestion } from "@/lib/schemas";
import { strings } from "@/lib/strings";
import { QuestionCard } from "./QuestionCard";
import { StatusMessage, type MessageKind } from "./StatusMessage";
import { TopicInput } from "./TopicInput";

type UiState = "idle" | "loading" | "question" | "answered" | "message";

const statusMessages = {
  unclear_topic: "unclearTopic",
  no_new_question: "noNewQuestion",
  error: "error",
  offline: "offline",
} as const satisfies Record<string, MessageKind>;

// The Trivia screen's game: topic input, request button, and the current question or message.
export function TriviaGame() {
  const [topic, setTopic] = useState("");
  const [ui, setUi] = useState<UiState>("idle");
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<MessageKind | null>(null);
  // Questions shown per normalized topic during this visit (memory only).
  const history = useRef(new Map<string, string[]>());
  // Guards against double taps before the disabled state re-renders.
  const inFlight = useRef(false);

  function showMessage(kind: MessageKind) {
    setQuestion(null);
    setSelectedIndex(null);
    setMessage(kind);
    setUi("message");
  }

  async function requestQuestion() {
    if (inFlight.current) return;
    const trimmed = topic.trim();
    if (!trimmed) return showMessage("emptyTopic");
    if (!navigator.onLine) return showMessage("offline");

    inFlight.current = true;
    setUi("loading");
    setQuestion(null);
    setSelectedIndex(null);
    setMessage(null);

    const key = normalizeTopic(trimmed);
    const shown = history.current.get(key) ?? [];
    const result = await fetchQuestion({
      topic: trimmed,
      previousQuestions: shown.slice(-PREVIOUS_QUESTIONS_MAX),
    });

    if (result.status === "ok") {
      history.current.set(key, [...shown, result.question]);
      setQuestion(result);
      setUi("question");
    } else {
      showMessage(statusMessages[result.status]);
    }
    inFlight.current = false;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void requestQuestion();
  }

  function answer(index: number) {
    if (ui !== "question") return;
    setSelectedIndex(index);
    setUi("answered");
  }

  const loading = ui === "loading";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TopicInput value={topic} onChange={setTopic} />
        <BlockButton type="submit" disabled={loading}>
          {loading ? strings.trivia.loading : strings.trivia.newQuestion}
        </BlockButton>
      </form>

      <div className="mt-2">
        {question && (ui === "question" || ui === "answered") && (
          <QuestionCard question={question} selectedIndex={selectedIndex} onAnswer={answer} />
        )}
        {ui === "message" && message && (
          <StatusMessage kind={message} onRetry={() => void requestQuestion()} retryDisabled={loading} />
        )}
      </div>
    </div>
  );
}
