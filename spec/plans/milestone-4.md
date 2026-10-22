# Milestone 4 — Installable PWA (plan)

> Builds on the Milestone 3 code. Goal: טריוויקיד can be installed from desktop Chrome (running locally), opens in its own window with its icon and name, and still opens all three screens offline — where asking for a question shows the existing no-connection message. No new screens, no new environment variables, no UI text changes.

## 0. Starting point (what already exists)
- `app/layout.tsx` — `lang="he" dir="rtl"`, Rubik font, `viewport.themeColor = "#FBF1E2"`. No manifest, no icons, no service worker.
- `next.config.ts` — global security headers (`nosniff`, `DENY`, `strict-origin-when-cross-origin`); `cacheComponents: true`, so the three pages are prerendered static HTML.
- `lib/api-client.ts` — already shows `offline` when `navigator.onLine` is false or when `fetch` fails with no response (ADR-3). So once the app shell loads offline, the no-connection message already works — no game-logic changes are needed.
- `app/page.tsx` — the Home picture uses `next/image` (`priority`), so the browser loads it from `/_next/image?url=…&w=…`.
- `spec/app-icon.png` — 1024×1024 RGBA with transparent rounded corners.
- `sharp` is present in `node_modules` (pulled in by Next), but not a direct dependency.

## 1. Files to create / change
| File | Change |
|------|--------|
| `scripts/generate-icons.mjs` (new) | One-off script: builds all icon files from `spec/app-icon.png` |
| `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (new, generated) | Manifest icons |
| `app/apple-icon.png` (new, generated) | Apple touch icon (Next.js file convention) |
| `app/favicon.ico` (new, generated) | Favicon (Next.js file convention) |
| `app/manifest.ts` (new) | Web app manifest |
| `public/sw.js` (new) | The service worker |
| `components/ServiceWorkerRegistration.tsx` (new) | Client component that registers `/sw.js` |
| `app/layout.tsx` | Render `<ServiceWorkerRegistration />`; add `appleWebApp` metadata |
| `next.config.ts` | Extra headers for `/sw.js` |
| `package.json` | `sharp` as a devDependency; `icons` script |
| `tests/manifest.test.ts`, `tests/service-worker.test.ts`, `tests/next-config.test.ts` (new) | Tests (section 7) |
| `CLAUDE.md` | Add a "Run (production, for PWA checks)" line under Run commands |
| `spec/ARCHITECTURE.md` | ADRs (section 8) |
| `spec/MILESTONES.md` | 🟡 mark after the build |

## 2. App icons — `scripts/generate-icons.mjs`
Run once with `npm run icons` (`"icons": "node scripts/generate-icons.mjs"`); the generated files are committed, so the build does not depend on the script. Add `sharp` to `devDependencies` (pin the version Next already installed) so the script's dependency is explicit.

Outputs (all from `spec/app-icon.png`, resized with `sharp`, PNG):
- `public/icons/icon-192.png` — 192×192, transparent corners kept (purpose `any`).
- `public/icons/icon-512.png` — 512×512, transparent corners kept (purpose `any`).
- `public/icons/icon-maskable-512.png` — 512×512 Light Wood (`#FBF1E2`) square with the icon scaled to ~80% and centered, so the whole artwork stays inside the maskable "safe zone" and the square is fully filled (as ARCHITECTURE.md requires).
- `app/apple-icon.png` — 180×180, icon on a Light Wood background (iOS shows transparency as black, so it must be opaque), icon at ~88% so it is not clipped by iOS rounding.
- `app/favicon.ico` — an ICO file holding 16×16, 32×32 and 48×48 PNG images. `sharp` cannot write ICO, so the script writes the small ICO header + directory by hand around the PNG buffers (ICO supports embedded PNGs; ~20 lines).

Next.js picks up `app/favicon.ico` and `app/apple-icon.png` automatically and adds the `<link>` tags.

## 3. Manifest — `app/manifest.ts`
`MetadataRoute.Manifest`, served by Next.js at `/manifest.webmanifest` and linked automatically in `<head>`:
- `name: strings.appName`, `short_name: strings.appName` ("טריוויקיד"), `description: strings.home.description`.
- `lang: "he"`, `dir: "rtl"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`.
- `background_color: "#FBF1E2"`, `theme_color: "#FBF1E2"` (Light Wood — matches the existing `viewport.themeColor`).
- `icons`: 192 (`any`), 512 (`any`), maskable 512 (`purpose: "maskable"`), all `image/png`.

`app/layout.tsx` metadata: add `appleWebApp: { capable: true, title: strings.appName, statusBarStyle: "default" }` so an iPhone "Add to Home Screen" opens full-screen with the right name (checked on the live site in Milestone 5).

## 4. Service worker — `public/sw.js`
Plain JavaScript (no build step, no library), roughly 100 lines. Constants at the top:
- `CACHE_VERSION = "v1"` → cache names `trivikid-pages-v1` and `trivikid-assets-v1`.
- `PAGES = ["/", "/trivia", "/about"]`.
- `EXTRA = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/favicon.ico"]`.

**install**
1. Fetch each page in `PAGES` (with `cache: "no-store"`) and store the response in the pages cache.
2. From each page's HTML, extract every same-origin `/_next/static/…` URL (scripts, CSS, preloaded fonts) and every `/_next/image?…` URL (from `src`, `srcset` and `imagesrcset`, with `&amp;` decoded). This is how "precache the static assets" works without a build-time file list: the HTML already names exactly the files each page needs.
3. Fetch each CSS file found and also extract its `url(/_next/static/media/…)` font files.
4. Add all found asset URLs plus `EXTRA` to the assets cache (individual failures are ignored so one missing file does not block installation).
5. `self.skipWaiting()`.

**activate**
- Delete every cache whose name starts with `trivikid-` but is not one of the two current names.
- `self.clients.claim()`.

**fetch** (only `GET`, only same-origin; everything else is not intercepted):
- `/api/*` → **not intercepted at all** (never cached; goes straight to the network). POSTs are also never intercepted.
- React Server Component requests (header `RSC: 1` or a `_rsc` query parameter, used by in-app link navigation) → not intercepted. When offline they fail, and the Next.js router then falls back to a full page load, which hits the navigation rule below. *(Verified during the build — see section 9. If the fallback does not happen, the alternative is to answer those requests network-first from a third cache.)*
- Page navigations (`request.mode === "navigate"`) → **network-first**: try the network; on success, store a copy in the pages cache (keyed by path, ignoring the query string) and return it; on failure return the cached page, else the cached `/`, else a minimal built-in Hebrew offline response ("אין חיבור לאינטרנט. התחברו ונסו שוב") with `dir="rtl"`.
- `/_next/static/*` → **cache-first** (these file names contain a content hash, so they never change); on a miss, fetch and store.
- `/_next/image*`, `/icons/*`, `/manifest.webmanifest`, `/favicon.ico`, `/apple-icon.png` → cache-first; on a miss, fetch and store.
- Anything else → not intercepted.

**Fresh versions after a new build** (DoD): pages are network-first, so whenever the app is online it shows the newest build's HTML, which references the newest hashed assets (fetched and cached on first use). The cache only serves pages when the network fails. `sw.js` itself is never cached by the browser (headers in section 6 + `updateViaCache: "none"`), so a changed service worker is picked up on the next visit. `CACHE_VERSION` is bumped by hand only when the service worker's own logic changes; that clears the old caches on activation.

## 5. Registration — `components/ServiceWorkerRegistration.tsx`
`"use client"` component that renders nothing. In `useEffect`:
- If `process.env.NODE_ENV !== "production"` or `!("serviceWorker" in navigator)` → do nothing. The service worker is **production-only**, so `npm run dev` (hot reload) is never served stale files by it.
- Otherwise `navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })`; errors are caught and ignored (the app works without it).

Rendered once inside `<body>` in `app/layout.tsx`.

Consequence for local checking: the PWA is checked with a production run — `npm run build` then `npm start` (http://localhost:3000; Chrome treats `localhost` as secure, so installation works without HTTPS). Add this to the Run commands in `CLAUDE.md`.

## 6. Headers — `next.config.ts`
Keep the global headers. Add a second entry for `source: "/sw.js"`:
- `Content-Type: application/javascript; charset=utf-8`
- `Cache-Control: no-cache, no-store, must-revalidate`
- `Content-Security-Policy: default-src 'self'; script-src 'self'`

(As in the Next.js PWA guide and ARCHITECTURE.md.)

## 7. Tests (Vitest)
- `tests/manifest.test.ts` — `manifest()` returns the name/short_name "טריוויקיד", `lang: "he"`, `dir: "rtl"`, `start_url: "/"`, `display: "standalone"`, Light Wood colors, and the three icons with the right sizes and purposes; every icon file listed exists in `public/`.
- `tests/next-config.test.ts` — `headers()` keeps the three security headers on all routes and returns the no-cache + content-type + CSP headers for `/sw.js`.
- `tests/service-worker.test.ts` — loads `public/sw.js` into a small sandbox (Node `vm`) with fake `self`, `caches`, `fetch` and `clients`, then checks:
  - a `/api/question` request (GET or POST) is not intercepted (`respondWith` is never called) and nothing is ever put in a cache for `/api/*`;
  - a navigation returns the network page when online and stores it; returns the cached page when the network fails;
  - `/_next/static/*` is served from the cache when present, without calling the network;
  - install extracts `/_next/static/…` and `/_next/image?…` URLs from sample HTML (including `srcset` and `&amp;`) and font URLs from sample CSS;
  - activate deletes old `trivikid-*` caches and keeps the current ones.
- `tests/components.test.tsx` — `ServiceWorkerRegistration` does not register outside production.
- Existing tests keep passing; `npm run build` and `npm run lint` pass.

## 8. ADRs to add to `spec/ARCHITECTURE.md`
- **ADR-4: Service worker only in production builds** — avoids stale files during development; PWA checks use `npm run build && npm start`.
- **ADR-5: Precache list read from the pages' HTML** — the hand-written service worker has no build-time asset list, so on install it reads the asset URLs (scripts, CSS, fonts, Home picture) from the three prerendered pages. Network-first pages + hashed assets mean no stale versions; `CACHE_VERSION` is bumped only when `sw.js` logic changes.

## 9. How I verify during the build (then shut everything down)
1. `npm test`, `npm run lint`, `npm run build` — all pass.
2. `npm start` in the background, open http://localhost:3000 in the built-in browser:
   - `/manifest.webmanifest` returns the expected JSON; the icon URLs load; `<head>` has the manifest, favicon and apple-icon links.
   - `/sw.js` response has the no-cache, content-type and CSP headers.
   - The service worker is registered and active (`navigator.serviceWorker.controller`), and the caches contain the three pages, their scripts/CSS/fonts and the Home picture.
3. Offline simulation: stop the server (from the browser's point of view the network is gone), then reload `/`, `/trivia`, `/about` and navigate between them by the buttons → every screen still renders with its styles, font and picture. On Trivia, type a topic and tap "שאלה חדשה" → the no-connection message appears. (Confirms the RSC fallback from section 4.)
4. Restart the server, request a question → it reaches the server (seen in the network list as a real `/api/question` response, never from the service worker).
5. New-version check: change a visible string temporarily, rebuild, restart, reload once → the new text shows; revert the change and rebuild.
6. Installability in DevTools ("Application → Manifest", no errors) and the actual install from desktop Chrome can't be driven from here — that is part of the user's check.

## 10. Out of scope (later / not required)
- Installing on phones and the HTTPS check — Milestone 5 (live site).
- A custom "Install" button, push notifications, offline questions — not in the PRD.
