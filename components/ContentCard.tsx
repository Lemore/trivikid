import type { ReactNode } from "react";

type Accent = "purple" | "orange";

type ContentCardProps = {
  title: string;
  accent: Accent;
  children: ReactNode;
};

const accentColors: Record<Accent, string> = {
  purple: "bg-block-purple",
  orange: "bg-block-orange",
};

// White content card with a small colored bar beside the heading (About screen).
export function ContentCard({ title, accent, children }: ContentCardProps) {
  return (
    <section className="rounded-card bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2.5 text-xl font-bold">
        <span
          aria-hidden="true"
          className={`h-6 w-1.5 shrink-0 rounded-full ${accentColors[accent]}`}
        />
        {title}
      </h2>
      <p className="mt-3 text-base leading-[1.75]">{children}</p>
    </section>
  );
}
