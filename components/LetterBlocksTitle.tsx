import { strings } from "@/lib/strings";

// Letters of the app name in reading order (right to left), each with its block color.
export const letterBlocks = [
  { letter: "ט", color: "bg-block-blue" },
  { letter: "ר", color: "bg-block-pink" },
  { letter: "י", color: "bg-block-red", tall: true },
  { letter: "ו", color: "bg-block-green" },
  { letter: "ו", color: "bg-sky-blue" },
  { letter: "י", color: "bg-block-purple" },
  { letter: "ק", color: "bg-block-yellow" },
  { letter: "י", color: "bg-block-orange" },
  { letter: "ד", color: "bg-block-blue" },
] as const;

// The app name as a row of colored wooden letter blocks.
export function LetterBlocksTitle() {
  return (
    <h1
      aria-label={strings.appName}
      className="flex items-center justify-center gap-1 sm:gap-1.5"
    >
      {letterBlocks.map((block, i) => (
        <span
          key={i}
          aria-hidden="true"
          data-testid="letter-block"
          className={`flex max-w-11 flex-1 items-center justify-center rounded-tile text-[clamp(22px,7vw,30px)] font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.22)] ${block.color} ${
            "tall" in block ? "h-[70px]" : "h-[60px]"
          }`}
        >
          {block.letter}
        </span>
      ))}
    </h1>
  );
}
