import type { Metadata } from "next";
import { QuestionTiles } from "@/components/QuestionTiles";
import { TopBar } from "@/components/TopBar";
import { TriviaGame } from "@/components/trivia/TriviaGame";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.trivia.pageTitle,
};

export default function TriviaPage() {
  return (
    <main className="flex flex-1 flex-col">
      <TopBar title={strings.trivia.title} />
      <TriviaGame />
      <QuestionTiles />
    </main>
  );
}
