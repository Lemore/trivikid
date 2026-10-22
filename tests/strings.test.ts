import { describe, expect, test } from "vitest";
import { strings } from "@/lib/strings";

function collectValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectValues);
  }
  return [];
}

describe("UI strings", () => {
  test("app name and home buttons match the PRD", () => {
    expect(strings.appName).toBe("טריוויקיד");
    expect(strings.home.play).toBe("בואו נשחק!");
    expect(strings.home.about).toBe("אודות");
  });

  test("About texts match DESIGN.md", () => {
    expect(strings.about.whatTitle).toBe("מה זה טריוויקיד?");
    expect(strings.about.whatBody).toBe(
      "טריוויקיד הוא משחק טריוויה לילדים. בוחרים כל נושא שאוהבים, ומקבלים שאלות חדשות ומעניינות עליו.",
    );
    expect(strings.about.howTitle).toBe("איך משחקים?");
    expect(strings.about.howBody).toBe(
      "כותבים נושא, לוחצים על הכפתור ובוחרים תשובה אחת מתוך ארבע. אחרי כל תשובה מגלים אם צדקתם ולומדים עובדה מעניינת!",
    );
  });

  test("no string is empty", () => {
    for (const text of collectValues(strings)) {
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });
});
