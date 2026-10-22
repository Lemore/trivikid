import Image from "next/image";
import { BlockButton } from "@/components/BlockButton";
import { LetterBlocksTitle } from "@/components/LetterBlocksTitle";
import { strings } from "@/lib/strings";
import homeImage from "@/public/images/home-image.png";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col pt-10 pb-10">
      <LetterBlocksTitle />

      <div className="mt-8 flex justify-center">
        <Image
          src={homeImage}
          alt={strings.home.imageAlt}
          priority
          sizes="(max-width: 448px) 90vw, 400px"
          className="h-auto w-[92%] max-w-[360px] drop-shadow-soft"
        />
      </div>

      <div className="min-h-8 flex-1" />

      <nav className="flex flex-col gap-4">
        <BlockButton href="/trivia">{strings.home.play}</BlockButton>
        <BlockButton href="/about" variant="secondary">
          {strings.home.about}
        </BlockButton>
      </nav>
    </main>
  );
}
