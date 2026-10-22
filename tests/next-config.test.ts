import { describe, expect, test } from "vitest";
import nextConfig from "@/next.config";

describe("next.config headers", () => {
  test("keeps the security headers on every route", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === "/(.*)")!;
    expect(all.headers).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ]),
    );
  });

  test("serves the service worker uncached, as JavaScript, with a strict CSP", async () => {
    const rules = await nextConfig.headers!();
    const sw = rules.find((r) => r.source === "/sw.js")!;
    expect(sw.headers).toEqual(
      expect.arrayContaining([
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
      ]),
    );
  });
});
