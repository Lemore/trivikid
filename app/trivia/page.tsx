import type { Metadata } from "next";
import { TopBar } from "@/components/TopBar";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.trivia.pageTitle,
};

// The game content (topic input, question card) is added in Milestone 2.
export default function TriviaPage() {
  return (
    <main className="flex flex-1 flex-col">
      <TopBar title={strings.trivia.title} />
    </main>
  );
}
