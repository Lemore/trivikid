import Link from "next/link";
import { strings } from "@/lib/strings";

type TopBarProps = {
  title: string;
};

// Screen header: Sky Blue back button (to Home) at the start side, then the title.
export function TopBar({ title }: TopBarProps) {
  return (
    <header className="flex items-center gap-3 pt-6 pb-4">
      <Link
        href="/"
        aria-label={strings.nav.back}
        className="flex size-11 shrink-0 items-center justify-center rounded-option bg-sky-blue text-ink shadow-block-sky transition-transform duration-100 active:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-block-blue"
      >
        {/* Right-pointing arrow: "back" in RTL */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
      <h1 className="text-[22px] leading-tight font-bold">{title}</h1>
    </header>
  );
}
