import type { TriviaQuestion } from "@/lib/schemas";
import { AnswerFeedback } from "./AnswerFeedback";
import { AnswerOption } from "./AnswerOption";

type QuestionCardProps = {
  question: TriviaQuestion;
  selectedIndex: number | null;
  onAnswer: (index: number) => void;
};

// White card with a purple top bar: the question, then the options or (after answering) the feedback.
export function QuestionCard({ question, selectedIndex, onAnswer }: QuestionCardProps) {
  const answered = selectedIndex !== null;

  return (
    <section className="overflow-hidden rounded-card border-t-8 border-block-purple bg-white shadow-soft">
      <div className="flex flex-col gap-4 p-5">
        <h2 className="text-[22px] leading-[1.4] font-bold">{question.question}</h2>
        <div aria-live="polite">
          {answered ? (
            <AnswerFeedback
              isCorrect={selectedIndex === question.correctIndex}
              correctAnswer={question.options[question.correctIndex]}
              explanation={question.explanation}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {question.options.map((option, i) => (
                <AnswerOption key={i} index={i} text={option} onSelect={() => onAnswer(i)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
