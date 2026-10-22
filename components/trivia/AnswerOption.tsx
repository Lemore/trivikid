import { strings } from "@/lib/strings";

// Letter block colors in option order: א Blue, ב Green, ג Red, ד Orange.
const letterColors = ["bg-block-blue", "bg-block-green", "bg-block-red", "bg-block-orange"];

type AnswerOptionProps = {
  index: number;
  text: string;
  onSelect: () => void;
};

// One answer row: a colored letter block at the start, then the answer text.
export function AnswerOption({ index, text, onSelect }: AnswerOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex min-h-[50px] w-full items-center gap-3 rounded-option border-[2.5px] border-wood-tan bg-white px-3 py-2 text-start text-lg leading-[1.5] transition-colors hover:border-block-blue/50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-block-blue"
    >
      <span
        aria-hidden="true"
        className={`flex size-[30px] shrink-0 items-center justify-center rounded-tile text-base font-bold text-white ${letterColors[index]}`}
      >
        {strings.trivia.optionLetters[index]}
      </span>
      <span>{text}</span>
    </button>
  );
}
