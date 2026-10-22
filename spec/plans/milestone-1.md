# Milestone 1 — Plan: Project setup, Home and About screens

> Source: `MILESTONES.md` → Milestone 1. Specs: `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md` and the images `wireframes.png`, `mockups.png`, `style-guide.png`, `Trivikid-Inspiration-board.png`.
> No AI, no `.env`, no API route, no manifest/service worker in this milestone (those are Milestones 2–4).

## 1. Goal

A Next.js app that runs locally with `npm run dev`, where:
- **Home (`/`)** and **About (`/about`)** look like the Mockups.
- **Trivia (`/trivia`)** exists with only its top bar + back button (content comes in Milestone 2).
- Navigation Home ↔ About and Home ↔ Trivia works.
- `npm run build`, `npm run lint` and `npm test` pass.

## 2. Project setup

### 2.1 Scaffolding
The project root already contains `spec/`, `CLAUDE.md` and `.gitignore`, so `create-next-app` cannot run directly in it.
- Run `npx create-next-app@latest` (Next.js 16) in a temporary folder in the scratchpad with: TypeScript, ESLint, Tailwind CSS, App Router, **no** `src/` folder, import alias `@/*`, npm.
- Copy the generated files into the project root. **Do not copy its `.gitignore`** — keep ours. Add only missing lines if needed (e.g. `next-env.d.ts`); `.next/`, `node_modules/`, `.env` are already covered.
- Remove the starter demo content (default `page.tsx` body, demo SVGs in `public/`, default `globals.css` dark-mode rules).
- Node v24 / npm 11 are installed — fine for Next.js 16.

### 2.2 Vitest
- Dev dependencies: `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`.
- `vitest.config.mts` (jsdom environment, React plugin, tsconfig paths).
- `package.json` script: `"test": "vitest run"`.
- A small test set for this milestone (see §7) so `npm test` has real tests, not zero.

### 2.3 `package.json` scripts
`dev`, `build`, `start`, `lint` (`eslint`), `test` (`vitest run`).

### 2.4 Security headers — `next.config.ts`
`headers()` for all routes (`/(.*)`):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

(The no-cache header for `/sw.js` is added in Milestone 4 together with the service worker.)

## 3. Files to create / change

```
app/
  layout.tsx            # <html lang="he" dir="rtl">, Rubik font, wood background, metadata
  globals.css           # Tailwind import + @theme tokens + wood-grain background
  page.tsx              # Home
  about/page.tsx        # About
  trivia/page.tsx       # Trivia placeholder: top bar + back button only
components/
  BlockButton.tsx       # primary / secondary (and disabled style ready for M2), renders a Link or <button>
  TopBar.tsx            # Sky Blue back button (→ "/") + screen title
  ContentCard.tsx       # white card, heading with small colored bar, body text
  LetterBlocksTitle.tsx # "טריוויקיד" as 9 colored wooden letter blocks
  QuestionTiles.tsx     # decorative row of scattered rotated "?" tiles
lib/
  strings.ts            # all Hebrew UI strings (single module)
public/
  images/home-image.png # web-optimized copy of spec/home-image.png
tests/
  strings.test.ts
  components.test.tsx
vitest.config.mts
next.config.ts
```

## 4. Global design

### 4.1 Root layout (`app/layout.tsx`)
- `<html lang="he" dir="rtl">`.
- Rubik via `next/font/google`: subsets `["hebrew", "latin"]`, weights 400/500/700/800, exposed as a CSS variable used by the Tailwind `font-sans` token, with system sans-serif fallback.
- `metadata`: title "טריוויקיד", short Hebrew description.
- `viewport`: `width=device-width`, `themeColor: #FBF1E2`.
- `<body>`: Light Wood background, Ink text, `min-h-dvh`, `overflow-x-hidden` as a safety net.
- Page container: `mx-auto w-full max-w-md px-4 sm:px-5` with `flex flex-col min-h-dvh` so each screen is a phone-width column centered on desktop (mockups are 360px-wide phone screens; on desktop the column stays centered on the wood background — no horizontal scroll).

### 4.2 Theme tokens (`app/globals.css`, Tailwind v4 `@theme`)
**Colors** (names → DESIGN.md palette):
| Token | HEX |
|-------|-----|
| `block-blue` | `#016FB7` |
| `block-green` | `#1A9949` |
| `block-red` | `#E52D20` |
| `block-purple` | `#744597` |
| `block-yellow` | `#FBD90B` |
| `block-orange` | `#FA8417` |
| `block-pink` | `#F96B9B` |
| `sky-blue` | `#90D3E6` |
| `wood-light` | `#FBF1E2` |
| `wood-tan` | `#E4CDB5` |
| `ink` | `#2B2B2E` |
Also the feedback tints for later milestones: `success-bg #E6F5EC`, `success-ink #11733A`, `error-bg #FDE9E7`, `error-ink #B3241A`, `fact-bg #FFF7CC`.

**Radii:** `tile` 5px, `option` 12px, `control` 14px, `card` 20px.

**Shadows:**
- `block`: hard bottom shadow ≈ `0 5px 0 <darker shade>`; for the primary button a darker blue (e.g. `#01558C`), for the secondary/white button Wood Tan. Implemented as a small set of shadow tokens (`shadow-block-blue`, `shadow-block-tan`, `shadow-block-sky`).
- `soft`: warm low-opacity brown, e.g. `0 6px 18px rgba(120, 80, 40, 0.12)` for cards and the Home picture.

**Typography helpers** (per DESIGN.md table): display 800·40px/1.1, h1 700·28px/1.2, top-bar title 700·22px, button 700·20–22px, body 400·18px/1.5 (min 16px), caption 500·15px/1.4, About headings 700·20px, About body 16px.

**Spacing:** Tailwind's default 4px scale already covers the 8-point scale (2/4/6/8/12 = 8/16/24/32/48px).

### 4.3 Wood background
Light Wood `#FBF1E2` with subtle horizontal wood-grain lines, done in CSS only (no image): a `repeating-linear-gradient` of very faint brown horizontal lines (e.g. 1px at ~4% opacity every ~7px) on `body`. This is page background decoration, not a UI control, so it doesn't break the "no gradients on UI controls" rule.

### 4.4 Hebrew strings (`lib/strings.ts`)
One exported object, used by every screen (no Hebrew literals inside components):
- `appName`: "טריוויקיד"
- `home.play`: "בואו נשחק!", `home.about`: "אודות", `home.imageAlt`: e.g. "מגש טריוויה מעץ עם סימן שאלה"
- `about.title`: "אודות"; `about.whatTitle`: "מה זה טריוויקיד?", `about.whatBody` (DESIGN.md text); `about.howTitle`: "איך משחקים?", `about.howBody` (DESIGN.md text)
- `trivia.title`: "טריוויקיד"
- `nav.back`: "חזרה לדף הבית" (accessible label for the back button)
- The PRD/ARCHITECTURE game messages ("שאלה חדשה", "על מה תרצו שאלה?", "טוען…", success/failure/error/empty/offline/unclear/no-new texts) are added now as well, so the module is complete; they're used from Milestone 2.

## 5. Shared components

### `BlockButton`
- Props: `variant: "primary" | "secondary"`, `href?` (renders `next/link`) or `onClick`, `disabled?`, `children`.
- 60px high (`h-15`), full width, radius 14px, Rubik 700 ~21px.
- Primary: Block Blue fill, white text, hard dark-blue bottom shadow.
- Secondary: white fill, Blue text, 2.5px Blue border, hard Wood Tan bottom shadow (as in the mockup).
- Disabled/loading style (Wood Tan fill, white text, no press) is included now — used in Milestone 2.
- Press feedback: on `:active` it moves down ~3px and the shadow shrinks (looks like pressing a wooden block). Visible focus ring for keyboard users.

### `TopBar`
- Row: back button at the **start (right)**, then the title.
- Back button: `next/link` to `/`, 44×44px, Sky Blue, radius 12px, small hard bottom shadow, dark right-pointing arrow (inline SVG, Ink color), `aria-label` from `strings.nav.back`.
- Title: Rubik 700 ~22px, Ink.
- Mockup has no divider line under the bar (the wireframe's line is a structural hint only; mockup wins on look).

### `ContentCard`
- White, radius 20px, soft warm shadow, padding ~20px.
- Heading row: a small vertical colored bar (≈6×22px, radius 3px) at the start side + heading (700, 20px). Prop `accent` chooses the bar color (purple / orange).
- Body: 400, 16px, line-height ~1.7, Ink.

### `LetterBlocksTitle`
- 9 blocks in a row (RTL, so ט is rightmost), white bold letters (Rubik 800), radius 4–5px, hard darker bottom shadow per block.
- Colors in reading order: ט Blue, ר Pink, י Red (slightly taller), ו Green, ו Sky Blue, י Purple, ק Yellow, י Orange, ד Blue.
- Sizing: blocks share the row width (≈ 36×60px each on a 360px screen, small gaps) and scale down so the row never overflows at 360px.
- Accessibility: the wrapper is an `<h1>` with the full name as its accessible text (`aria-label="טריוויקיד"`); individual blocks `aria-hidden`.
- Note: white letters on Yellow/Sky Blue have low contrast — the mockup does it this way, so we follow it; the `<h1>` label keeps it accessible.

### `QuestionTiles`
- Decorative (`aria-hidden`) row of 6 small "?" tiles (≈ 30×40px), colors Pink, Purple, Yellow, Blue, Green, Red, each with a fixed slight rotation (−15°…+15°) and small vertical offsets, radius 5px, hard bottom shadow, white bold "?".
- Placed at the bottom of the About and Trivia screens (pushed down with `mt-auto`, with bottom padding).

## 6. Screens

### Home (`/`) — `app/page.tsx` (server component)
Top to bottom, inside the page column:
1. `LetterBlocksTitle` near the top (~32px top padding).
2. Hero picture: `next/image` of `public/images/home-image.png`, square, centered, ~ 90% of column width (max ~340px), `priority`, soft warm drop shadow via CSS `drop-shadow` (the PNG has transparency, so the shadow follows the tray shape, no card/border).
3. Flexible spacer (`flex-1`) pushing the buttons down.
4. `BlockButton` primary "בואו נשחק!" → `/trivia`.
5. `BlockButton` secondary "אודות" → `/about`, ~16px below.
6. Bottom padding ~32px.

**Image optimization:** `spec/home-image.png` is 1948×1945, 5.5MB. Create a resized copy (≈ 800×800, keeping transparency) with macOS `sips` into `public/images/home-image.png`; `next/image` then serves modern formats (WebP/AVIF) at the right size. The original in `spec/` stays untouched.

### About (`/about`) — `app/about/page.tsx`
1. `TopBar` with title "אודות".
2. `ContentCard` purple: "מה זה טריוויקיד?" + DESIGN.md text.
3. `ContentCard` orange: "איך משחקים?" + DESIGN.md text (~16–24px gap between cards).
4. `QuestionTiles` at the bottom.

### Trivia placeholder (`/trivia`) — `app/trivia/page.tsx`
- `TopBar` with title "טריוויקיד" only (per milestone scope). No input/button/card yet; no "coming soon" text is invented. The "?" tiles are part of the screen's design but belong to the content built in Milestone 2 — leave them out now.

Each page sets its own `metadata.title` (e.g. "אודות · טריוויקיד").

## 7. Tests (Vitest)
- `tests/strings.test.ts`: the app name is "טריוויקיד"; About texts equal the DESIGN.md texts; no string is empty.
- `tests/components.test.tsx` (React Testing Library):
  - `LetterBlocksTitle` renders 9 blocks in the right letter order and exposes the accessible name "טריוויקיד".
  - `TopBar` back link points to `/` and has the Hebrew aria-label.
  - `BlockButton` with `href` renders a link with that href; `disabled` renders a disabled button.

## 8. Verification (done by Claude during Build, then the dev server is stopped)
1. `npm run lint`, `npm test`, `npm run build` — all pass with no errors.
2. Run `npm run dev` and check in the built-in browser:
   - `<html>` has `lang="he"` and `dir="rtl"`; computed font is Rubik; colors match the palette.
   - Home vs. the Mockup: block-letter title, picture, two buttons at the bottom.
   - Click "בואו נשחק!" → `/trivia`; back → `/`. Click "אודות" → `/about`; back → `/`.
   - Viewport 360px wide and a desktop width (~1280px): no horizontal scroll (`document.documentElement.scrollWidth <= clientWidth`), layout centered and readable.
   - Response headers include the three security headers.
3. Fix anything that fails, then mark Milestone 1 with 🟡 in `MILESTONES.md` and fill in the **Run commands** section of `CLAUDE.md` (`npm run dev`, `npm test`).

## 9. Definition of Done (from MILESTONES.md)
- [ ] All screens render RTL in Hebrew, with Rubik and the DESIGN.md colors.
- [ ] Home matches the Mockup: block-letter name, picture, both buttons.
- [ ] "בואו נשחק!" opens `/trivia`; "אודות" opens `/about`; the back buttons on both return to `/`.
- [ ] Correct layout at 360px and at desktop width, no horizontal scrolling.
- [ ] `npm run build`, the linter and `npm test` pass with no errors.

## 10. Notes / decisions
- **Letter-block colors:** the style-guide header shows a slightly different color order (e.g. ד in Sky Blue) than the Mockup. DESIGN.md's text matches the Mockup, and the Mockup shows the final look, so the DESIGN.md order is used.
- **Desktop layout:** the PRD/DESIGN only show phone-sized screens. On desktop the same phone-width column is centered on the wood background (simplest correct approach; no separate desktop layout is specified).
- No new ADR expected; if the build needs a significant technical decision, it is recorded in `ARCHITECTURE.md` under `## Key decisions (ADRs)`.
- No commit in this milestone until the user asks for a push.
