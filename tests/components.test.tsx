import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { BlockButton } from "@/components/BlockButton";
import { LetterBlocksTitle } from "@/components/LetterBlocksTitle";
import { TopBar } from "@/components/TopBar";
import { strings } from "@/lib/strings";

describe("LetterBlocksTitle", () => {
  test("renders the 9 letters of the app name in reading order", () => {
    render(<LetterBlocksTitle />);
    const blocks = screen.getAllByTestId("letter-block");
    expect(blocks).toHaveLength(9);
    expect(blocks.map((b) => b.textContent).join("")).toBe("טריוויקיד");
  });

  test("exposes the app name as an accessible heading", () => {
    render(<LetterBlocksTitle />);
    expect(screen.getByRole("heading", { name: "טריוויקיד" })).toBeInTheDocument();
  });
});

describe("TopBar", () => {
  test("back button links to Home with a Hebrew label", () => {
    render(<TopBar title="אודות" />);
    const back = screen.getByRole("link", { name: strings.nav.back });
    expect(back).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "אודות" })).toBeInTheDocument();
  });
});

describe("BlockButton", () => {
  test("renders a link when href is given", () => {
    render(<BlockButton href="/trivia">בואו נשחק!</BlockButton>);
    expect(screen.getByRole("link", { name: "בואו נשחק!" })).toHaveAttribute(
      "href",
      "/trivia",
    );
  });

  test("renders a disabled button when disabled", () => {
    render(<BlockButton disabled>טוען…</BlockButton>);
    expect(screen.getByRole("button", { name: "טוען…" })).toBeDisabled();
  });
});
