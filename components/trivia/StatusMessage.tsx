import { BlockButton } from "@/components/BlockButton";
import { strings } from "@/lib/strings";

export type MessageKind = "emptyTopic" | "unclearTopic" | "noNewQuestion" | "error" | "offline";

type StatusMessageProps = {
  kind: MessageKind;
  onRetry: () => void;
  retryDisabled: boolean;
};

const texts: Record<MessageKind, string> = {
  emptyTopic: strings.trivia.emptyTopic,
  unclearTopic: strings.trivia.unclearTopic,
  noNewQuestion: strings.trivia.noNewQuestion,
  error: strings.trivia.error,
  offline: strings.trivia.offline,
};

// Problems use the failure style with a retry button; gentle prompts use the fun-fact style.
export function StatusMessage({ kind, onRetry, retryDisabled }: StatusMessageProps) {
  const problem = kind === "error" || kind === "offline";

  return (
    <div role="status" className="flex flex-col gap-3">
      {problem ? (
        <p className="flex items-center gap-3 rounded-2xl bg-error-bg px-4 py-3 text-lg leading-snug font-bold text-error-ink">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-block-red text-base text-white"
          >
            ✕
          </span>
          <span>{texts[kind]}</span>
        </p>
      ) : (
        <p className="flex items-center gap-3 rounded-2xl border-s-6 border-block-yellow bg-fact-bg px-4 py-3 text-lg leading-snug font-bold text-ink">
          <span aria-hidden="true">💡</span>
          <span>{texts[kind]}</span>
        </p>
      )}
      {problem && (
        <BlockButton variant="secondary" onClick={onRetry} disabled={retryDisabled}>
          {strings.trivia.retry}
        </BlockButton>
      )}
    </div>
  );
}
