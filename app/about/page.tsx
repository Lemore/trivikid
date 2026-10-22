import type { Metadata } from "next";
import { ContentCard } from "@/components/ContentCard";
import { QuestionTiles } from "@/components/QuestionTiles";
import { TopBar } from "@/components/TopBar";
import { strings } from "@/lib/strings";

export const metadata: Metadata = {
  title: strings.about.title,
};

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <TopBar title={strings.about.title} />

      <div className="mt-2 flex flex-col gap-5">
        <ContentCard title={strings.about.whatTitle} accent="purple">
          {strings.about.whatBody}
        </ContentCard>
        <ContentCard title={strings.about.howTitle} accent="orange">
          {strings.about.howBody}
        </ContentCard>
      </div>

      <QuestionTiles />
    </main>
  );
}
