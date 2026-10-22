# Milestone 5 — Production release (plan)

> Builds on the Milestone 4 code. Goal: טריוויקיד is live on its Vercel Production URL over HTTPS, deploys automatically on every push to `main`, uses a separate production OpenAI key with a budget limit, and every PRD flow is checked on the live site on phones and desktop browsers.
>
> This milestone is mostly **account setup done by the user** (Vercel, OpenAI) with step-by-step guidance from Claude, plus **checks on the live site**. No new screens, no new features, and no UI text changes are planned. Code changes happen only if a live-site check finds a real bug.

## 0. Starting point (what already exists)
- GitHub repo `github.com/Lemore/trivikid` is connected locally (`origin`), and `main` on GitHub matches the local code (Milestone 4 commit `cdc2ea1`).
- No Vercel project exists; nothing is deployed. The Vercel CLI is not installed, and it is **not needed**: ARCHITECTURE.md uses Vercel's GitHub integration (connected in the Vercel website).
- `lib/server/question-generator.ts` reads `OPENAI_API_KEY` and `OPENAI_MODEL` (falls back to `gpt-5`) from the environment, on the server only.
- `.env.example` lists `OPENAI_API_KEY` and `OPENAI_MODEL` with no values; `.env` and `.vercel/` are git-ignored.
- `next.config.ts` sets the security headers and the no-cache headers for `/sw.js`. `app/api/question/route.ts` sets `maxDuration = 60` (well under the Hobby limit of 300s).
- PWA (manifest, icons, `appleWebApp` metadata, service worker) is done and checked locally on desktop Chrome. Phone installation needs HTTPS, so it is checked here.
- Vercel defaults fit as-is: framework Next.js, build command `next build`, Node.js 24 (same major version as local), region `iad1`. No `vercel.json` / `vercel.ts` is needed.

## 1. Files to create / change
| File | Change |
|------|--------|
| `spec/plans/milestone-5.md` | This plan |
| `CLAUDE.md` | Add a **Live site** line under Run commands (the Production URL) |
| `spec/ARCHITECTURE.md` | ADR-6 (section 7), only if its decision is confirmed during the build |
| `spec/MILESTONES.md` | 🟡 mark after the build |
| Any app file | Only to fix a bug found on the live site (each fix explained to the user first if it changes spec behavior) |

No new environment variables, so `.env.example` does not change.

## 2. User setup — guided, in this order
Claude gives each part as short numbered steps in plain language, waits for the user to confirm each part, and never handles keys or passwords itself. (Screen labels on the Vercel and OpenAI websites may differ slightly; Claude adjusts the steps to what the user sees.)

### 2.1 OpenAI — production key and cost guard (before Vercel, so the key is ready)
1. In the OpenAI platform, create a separate **project** for the live site (e.g. "Trivikid Production"), so its usage and budget are separate from development.
2. Inside that project, create a new API key (e.g. "trivikid-vercel-production"). Copy it once and keep it only until step 2.3 — don't paste it into the chat, a file, or the repo.
3. Set a **monthly budget limit** on the project and **usage alerts** (e.g. emails at 50% and 80% of the budget). The amount is the user's choice; for a children's trivia game, a small amount (e.g. $5–$10/month) covers thousands of questions.
4. Confirm the account is on a paid tier (ARCHITECTURE.md: never a free tier that uses data for training).
5. The user tells Claude: "budget and alerts are set" (needed for the Definition of Done).

### 2.2 Vercel — account and GitHub connection
1. Sign up at vercel.com with "Continue with GitHub" (Hobby plan; free, for personal / non-commercial use — see ARCHITECTURE.md risks).
2. "Add New… → Project" → allow Vercel's GitHub app to access the `Lemore/trivikid` repository (only that repo is enough) → "Import".
3. On the import screen: keep all defaults (Framework: Next.js, Root directory: `./`, build settings untouched). **Do not add environment variables on this screen** — this screen applies them to every environment, and the production key must be in Production only. Click "Deploy".
4. The first deployment builds and goes live, but questions will show the error message until the key is added (step 2.3). The pages themselves already load. This is expected.
5. The user sends Claude the Production URL (e.g. `https://trivikid.vercel.app` or similar).

### 2.3 Vercel — Production environment variables
1. Project → Settings → Environment Variables.
2. Add `OPENAI_API_KEY` = the production key, with **only "Production"** ticked (untick Preview and Development). Mark it **Sensitive** if offered (it can then never be viewed again, only replaced).
3. Add `OPENAI_MODEL` = `gpt-5`, Production only.
4. Deployments → the latest Production deployment → "Redeploy" (environment variables only take effect on a new deployment).
5. The development key is **not** added anywhere in Vercel. Preview deployments are left without keys for now (ARCHITECTURE.md: "if used"); if the user later wants working Previews, the development key can be added for Preview only.
6. After this, the user deletes any temporary copy of the production key.

### 2.4 Custom domain (optional)
Claude asks whether the user wants one. Default: no — the free `*.vercel.app` address is enough. If yes, Claude guides Settings → Domains and the DNS records Vercel shows; it requires owning a domain.

## 3. Release — first deployment and automatic deploys
1. After 2.3, the redeployed Production site is the first full release of `main`.
2. **Check automatic deployment:** the build changes from this milestone (this plan, the `CLAUDE.md` live-URL line, the 🟡 mark) need a push to `main` anyway. Per CLAUDE.md, Claude **stops and asks the user's approval before this push**. After the push, Claude has the user confirm in the Vercel dashboard (Deployments) that a new Production deployment started by itself from that commit and finished as "Ready".
3. Preview deployments for other branches work by default with Vercel's GitHub integration; nothing to set up. (Vercel protects Preview URLs with a login by default; Production stays public.)

## 4. Live-site checks Claude runs itself
Run from the terminal (`curl`) and the built-in browser against the Production URL. Nothing here needs keys.

**HTTPS and headers**
- `http://` redirects to `https://`; the certificate is valid; `Strict-Transport-Security` is present (Vercel adds it).
- Every page returns `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- `/sw.js` returns `Cache-Control: no-cache, no-store, must-revalidate` and the JavaScript content type.
- `/manifest.webmanifest` returns the correct name, `lang`/`dir`, colors and the three icons; the icon URLs load.

**Key never exposed**
- Download the page HTML and every `/_next/static/…` JavaScript file it references; search them for `sk-` and `OPENAI_API_KEY` — no match.
- `git grep` the repository for `sk-` — no match (the key is never in the repo).
- A real `/api/question` response contains only `status`, `question`, `options`, `correctIndex`, `explanation`.

**API behavior on the live server** (a handful of calls only — each `ok` call costs a tiny amount)
- A valid topic (e.g. "חלל") → HTTP 200, `status: "ok"`, 4 options — proves the production key works.
- Empty topic, a 51-character topic, and an extra field → HTTP 400.
- A meaningless topic (e.g. "אאאא") → `unclear_topic`.

**Screens and flows in the built-in browser** (desktop width and 360px mobile width)
- Home → Trivia → question → answer → feedback and fun fact → "שאלה חדשה" (same topic) → edit topic → "שאלה חדשה" (new topic, also before answering).
- Home → About → back. Trivia → back.
- Empty topic message; loading state disables the button; inappropriate topic gives a child-safe question; RTL, Rubik font, colors and layout match the Mockups; no horizontal scrolling.
- Chrome DevTools-equivalent checks: manifest valid, service worker activated, offline reload of `/`, `/trivia`, `/about` works, and a question request offline shows the no-connection message.

## 5. Checks only the user can do (Claude gives a short checklist)
Real devices and browsers the built-in browser cannot replace:
1. **Android phone, Chrome:** open the live URL → install (install prompt or menu → "Install app") → the טריוויקיד icon and name on the home screen → opens without the browser bar → play one question → turn on airplane mode → reopen the app → Home/Trivia/About open, asking for a question shows "אין חיבור לאינטרנט…".
2. **iPhone, Safari:** Share → "Add to Home Screen" → same checks as Android (name, icon, full-screen, offline message).
3. **Desktop:** one quick play-through in Chrome, Safari, Edge and Firefox (whichever the user has; Claude notes any browser the user could not check).
4. **Wrong-key safety check is skipped on Production** — it was verified locally in Milestone 3 and must not be simulated on the live site.

The user reports what they saw; anything broken becomes a fix (see section 6).

## 6. If something fails on the live site
- Build fails on Vercel → the user copies the error lines from the deployment's "Building" log; Claude fixes locally, runs `npm run build` + `npm test`, and asks to push again.
- Questions show the error message → most likely the key/variable setup (wrong scope, missing redeploy, budget reached). Claude walks the user through the Environment Variables screen and the OpenAI usage page; the server log shows only the error type (Vercel → Logs), never the topic.
- A real bug → fixed locally, verified locally, then pushed with the user's approval (each push redeploys automatically).

## 7. ADR to add to `spec/ARCHITECTURE.md` (if confirmed during the build)
- **ADR-6: Production-only OpenAI key; Previews have no key.** Context: the import screen applies environment variables to all environments, and ARCHITECTURE.md requires the production key only in Production. Decision: variables are added after import, scoped to Production only; Previews get no key until needed (then the development key, Preview scope only). Consequences: Preview deployments show the error message on question requests; the production key can't leak into branch builds.

## 8. Definition of Done — how each criterion is checked
| Criterion | How it is checked |
|-----------|-------------------|
| Repo connected; a push to `main` deploys to Production automatically; live URL loads over HTTPS | Section 3 step 2 (user confirms in the dashboard) + section 4 HTTPS checks |
| Production uses the production key; the dev key is not in Production; no key in the repo | User confirms the Environment Variables screen (section 2.3); a live question works; `git grep` and bundle search find nothing (section 4) |
| OpenAI budget limit and alerts configured, user confirms | Section 2.1 step 5 |
| Every PRD flow works on the live URL, including the Milestone 3 edge cases | Section 4 (Claude) + section 5 (user on real devices) |
| Installs on Android and iPhone, standalone with icon and name; offline shows the no-connection message | Section 5 (user) |
| Screens match DESIGN.md and the Mockups on mobile and desktop, Hebrew RTL | Section 4 screenshots compared with `spec/mockups.png` + user's phone check |

## 9. Build order
1. Guide 2.1 (OpenAI) → 2.2 (Vercel import) → 2.3 (Production variables + redeploy) → ask about 2.4.
2. Run the section 4 checks on the live URL; fix and re-check anything that fails.
3. Add the live URL to `CLAUDE.md`, ADR-6 to ARCHITECTURE.md, and the 🟡 mark to MILESTONES.md.
4. Stop and ask approval to push (needed to prove automatic deployment); after the push, the user confirms the new deployment.
5. Give the user the section 5 device checklist. The milestone stays 🟡 until the user approves.

## 10. Out of scope
- Vercel WAF rate limiting, analytics, monitoring, or any paid Vercel feature (ARCHITECTURE.md: only if abuse happens).
- Switching the model away from `gpt-5` (a configuration change for later, if OpenAI retires it).
- Installing the Vercel CLI or deploying any way other than the GitHub integration.
