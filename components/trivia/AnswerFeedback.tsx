import { strings } from "@/lib/strings";

type AnswerFeedbackProps = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

// Success/failure message (color + icon + text) followed by the fun-fact panel.
export function AnswerFeedback({ isCorrect, correctAnswer, explanation }: AnswerFeedbackProps) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-lg leading-snug font-bold ${
          isCorrect ? "bg-success-bg text-success-ink" : "bg-error-bg text-error-ink"
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex size-8 shrink-0 items-center justify-center rounded-full text-base text-white ${
            isCorrect ? "bg-block-green" : "bg-block-red"
          }`}
        >
          {isCorrect ? "✓" : "✕"}
        </span>
        <span>
          {isCorrect ? strings.trivia.success : `${strings.trivia.failurePrefix} ${correctAnswer}`}
        </span>
      </p>
      <p className="flex gap-2 rounded-control border-s-6 border-block-yellow bg-fact-bg px-4 py-3 text-base leading-normal">
        <span aria-hidden="true">💡</span>
        <span>{explanation}</span>
      </p>
    </div>
  );
}
