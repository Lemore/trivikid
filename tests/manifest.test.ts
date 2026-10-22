import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import manifest from "@/app/manifest";

describe("web app manifest", () => {
  const m = manifest();

  test("has the app name, Hebrew RTL and standalone display", () => {
    expect(m.name).toBe("טריוויקיד");
    expect(m.short_name).toBe("טריוויקיד");
    expect(m.lang).toBe("he");
    expect(m.dir).toBe("rtl");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
  });

  test("uses the Light Wood colors", () => {
    expect(m.background_color).toBe("#FBF1E2");
    expect(m.theme_color).toBe("#FBF1E2");
  });

  test("lists 192, 512 and maskable icons that exist in public/", () => {
    const icons = m.icons ?? [];
    expect(icons.map((i) => [i.sizes, i.purpose])).toEqual([
      ["192x192", "any"],
      ["512x512", "any"],
      ["512x512", "maskable"],
    ]);
    for (const icon of icons) {
      expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });
});
