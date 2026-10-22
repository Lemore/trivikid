# Milestones — Build Plan

> The main development milestones of טריוויקיד (Trivikid), in build order, based on PRD.md, ARCHITECTURE.md, and DESIGN.md. Each milestone is a vertical slice that ends with a working, testable app.
>
> **Environments:** the product has no database (ARCHITECTURE.md), so there are no database migrations. The only per-environment configuration is the OpenAI API key and model:
> - The **development key** is used locally (`.env`).
> - The **production key** is stored only in Vercel **Production** and is set in Milestone 5.
>
> **Deployment:** Milestones 1–4 run only locally. Vercel and automatic deployment of the live site are turned on only in Milestone 5, so pushing a milestone to GitHub never publishes unfinished work.

## Development Execution Rules
- Develop the milestones **in the order defined in this document**.
- After completing each milestone, **stop development**. Present the user with:
  - the completed deliverable;
  - the test results against its Definition of Done, criterion by criterion.
- The user checks the deliverable themselves and asks for fixes where needed.
- **Do not begin the next milestone without the user's explicit approval**, either an explicit approval or a request to push the changes to GitHub.
- Do not add features that are not defined in PRD.md, ARCHITECTURE.md, or DESIGN.md.
- Any step the user must perform (creating accounts, API keys, connecting services) is given to the user as clear, numbered, step-by-step instructions in plain language. The user is not a programmer.

> Progress marks next to a milestone title (Claude adds them; the rules are in CLAUDE.md): 🟡 = built, waiting for approval · ✅ = approved.

---

## Milestone 1 — Project setup: the app runs locally, with the Home and About screens ✅
- **Purpose:** Establish the project and the design system, and deliver the first two complete screens.
- **Implementation scope:**
  - **Project:** Next.js 16 (App Router) + TypeScript + Tailwind CSS, with Vitest configured. The GitHub repository already exists (`github.com/Lemore/trivikid`).
  - **Global design:**
    - Root layout with `<html lang="he" dir="rtl">` and the Rubik font via `next/font` (Hebrew subset).
    - The DESIGN.md color palette, radii, spacing and shadows as Tailwind theme tokens.
    - The light-wood background.
    - A Hebrew UI-strings constants module.
  - **Shared components:** primary and secondary buttons ("block" shadow), top bar with the Sky Blue back button, white content card, and the decorative "?" tiles row.
  - **Home screen (`/`):**
    - The block-letter name "טריוויקיד".
    - The Home picture, from `spec/home-image.png` (optimized for the web).
    - The "בואו נשחק!" and "אודות" buttons.
  - **About screen (`/about`):** back button, title "אודות", and the two content cards ("מה זה טריוויקיד?" and "איך משחקים?") with the DESIGN.md texts and the "?" tiles.
  - **Trivia route (`/trivia`):** exists with its top bar and back button only, so navigation works. Its content is built in Milestone 2.
  - **Security headers** in `next.config`, as listed in ARCHITECTURE.md.
- **Expected deliverable:** The app running locally (`npm run dev`), where the Home and About screens look like the Mockups, and navigation between Home, About and the Trivia route works.
- **Definition of Done:**
  - All screens render right-to-left in Hebrew, with the Rubik font and the DESIGN.md colors.
  - Home matches the Mockup: the block-letter name, the picture, and both buttons.
  - "בואו נשחק!" opens `/trivia`. "אודות" opens `/about`. The back buttons on both return to `/`.
  - The layout is correct on a mobile width (360px) and on a desktop width, with no horizontal scrolling.
  - `npm run build`, the linter and `npm test` (Vitest) pass with no errors.

## Milestone 2 — Play a trivia question end-to-end ✅
- **Purpose:** Deliver the core capability: the child enters a topic, gets an AI-generated question with 4 options, answers once, and sees feedback, the correct answer and a fun fact.
- **Implementation scope:**
  - **User setup (guided):**
    - Create an OpenAI account and a development API key (the production key is created in Milestone 5).
    - Claude creates `.env.example` and copies it to `.env`; the user fills in the development key in `.env`, together with `OPENAI_MODEL=gpt-5`.
  - **Shared Zod schemas:**
    - The request: `topic`, `previousQuestions`.
    - The response: `status`, `question`, `options`, `correctIndex`, `explanation`.
    - The AI output schema.
  - **`POST /api/question` route handler:**
    - Validates the request: topic trimmed, 1–50 characters.
    - Builds the system prompt: Hebrew, ages 8–12, 4 options with one correct, a 1–2 sentence explanation, and the topic passed as data.
    - Calls GPT-5 through the OpenAI SDK Responses API with `zodTextFormat`, reasoning effort `minimal`, and the model taken from `OPENAI_MODEL`.
    - Validates the result: exactly 4 distinct non-empty options, and `correctOptionText` matches exactly one of them.
    - Retries once if the result is invalid or the model refuses.
    - Shuffles the options on the server and returns `correctIndex`.
    - `maxDuration` 60s, with a server time limit of about 30s.
  - **Trivia screen, per DESIGN.md:**
    - The label "על מה תרצו שאלה?" and the topic input (default and focus styles).
    - The "שאלה חדשה" button (the only request button).
    - The question card: purple top bar, 4 options with the א–ד colored letter blocks.
    - The "?" tiles row.
  - **Answer flow:**
    - The first tap (one attempt) removes the 4 options; in their place, inside the card below the question, the feedback appears:
      - Correct: the success message "כל הכבוד! תשובה נכונה 🎉".
      - Wrong: the failure message "לא נורא! התשובה הנכונה היא: …" with the correct answer.
      - In both cases, the fun-fact panel (💡, yellow edge) shows the explanation.
  - **Continue:**
    - Tapping "שאלה חדשה" again requests a new question on the same topic.
    - Editing the topic and tapping "שאלה חדשה" requests a question on the new topic.
  - **Loading state:** while a request is running, the request button is disabled (Wood Tan, "טוען…") and only one request is sent at a time.
  - **Vitest unit tests** for request validation, AI-output validation and option shuffling.
- **Expected deliverable:** A playable game running locally. Typing a topic produces a Hebrew question, and answering shows the correct feedback and fun fact.
- **Definition of Done:**
  - For several different topics (e.g., "חלל", "דינוזאורים", "כדורגל"), a Hebrew question with exactly 4 options and one correct answer appears.
  - Tapping an answer replaces the options with the feedback below the question: the success or failure message, the correct answer (on failure) and the explanation, with the DESIGN.md styles.
  - Tapping "שאלה חדשה" again brings a new question on the same topic. Changing the topic brings a question on the new topic, including when the current question was not yet answered.
  - The button is disabled during loading, and repeated taps send no extra requests.
  - The correct answer is not always in the same position across repeated questions.
  - The OpenAI API key never appears in the browser: it is not in the page source, the JavaScript bundles or the network responses.
  - Unit tests pass, and `npm run build` succeeds.

## Milestone 3 — Question rules, child safety, and error handling
- **Purpose:** Complete the PRD's business rules and edge cases so the game behaves correctly and kindly in every situation.
- **Implementation scope:**
  - **No repeats within a visit:**
    - The client keeps an in-memory history per normalized topic and sends up to 30 previous questions.
    - The prompt tells the model to avoid them.
    - The server rejects normalized duplicates and retries once.
    - If no new question is possible, the server returns `no_new_question`.
    - The history resets on refresh or close.
  - **Child-safe redirection:** prompt rules so an inappropriate topic produces a question on a related, child-safe angle, with no refusal or error shown.
  - **Unclear topic:** the model returns `unclear_topic`, and the app shows "לא הצלחנו להבין את הנושא, נסו נושא אחר".
  - **Empty topic:** the app sends no request and shows "כתבו נושא כדי לקבל שאלה 🙂".
  - **Topic length:** the input is limited to 50 characters, and the server enforces the same limit.
  - **AI failure, invalid response or timeout:**
    - The server returns `status: "error"` (HTTP 502/504).
    - The client aborts after about 60s.
    - The app shows "אופס! משהו השתבש. נסו שוב" with a "נסו שוב" retry option.
    - No partial question is ever displayed.
  - **No internet connection:** the app detects the offline state or a network failure and shows "אין חיבור לאינטרנט. התחברו ונסו שוב" with a retry option.
  - **Running out of new questions:** when `no_new_question` is returned, the app shows "נגמרו לנו שאלות חדשות על הנושא הזה. נסו נושא אחר!".
  - **Input hardening on the server:**
    - At most 30 `previousQuestions`, each at most 300 characters.
    - Extra fields are rejected.
    - The server does not log topic text.
  - **Vitest tests** for duplicate detection, the status handling and request limits.
- **Expected deliverable:** The full game with all PRD edge cases handled, testable locally.
- **Definition of Done:**
  - Asking for 10 questions in a row on one topic produces no repeated question during the visit. After a page refresh, the history is reset.
  - An inappropriate topic produces a child-safe question on a related angle, never an error or refusal message.
  - A meaningless topic (e.g., "אאאא" or random letters) shows the unclear-topic message.
  - An empty or whitespace-only topic sends no request and shows the empty-topic prompt.
  - A topic longer than 50 characters cannot be entered, and the server rejects longer input with HTTP 400.
  - A simulated AI failure, such as a wrong API key or a forced timeout, shows the error message with a working retry.
  - With the network turned off, the app shows the no-connection message instead of breaking.
  - All user-facing messages are in Hebrew and use the DESIGN.md feedback styles.
  - All unit tests pass, and `npm run build` succeeds.

## Milestone 4 — Installable PWA
- **Purpose:** Let the child install טריוויקיד on the home screen and open it like an app, including a friendly experience when offline.
- **Implementation scope:**
  - **`app/manifest.ts`:**
    - `name` and `short_name` "טריוויקיד", `lang: "he"`, `dir: "rtl"`, `start_url: "/"`, `display: "standalone"`.
    - Theme and background colors from DESIGN.md (e.g., Light Wood `#FBF1E2`).
  - **App icons:** generated from `spec/app-icon.png` at 192×192 and 512×512, a maskable icon (placed on Light Wood so it fills the square), an Apple touch icon, and a favicon.
  - **Service worker (`public/sw.js`), registered from the root layout:**
    - Precaches the three pages and the static assets.
    - Cache-first for `/_next/static/*`.
    - Network-first for page navigations, with the cached page as the offline fallback.
    - Never caches `/api/*`.
    - Served with no-cache headers.
- **Expected deliverable:** The app, running locally, can be installed from desktop Chrome, and the installed app opened without internet loads and shows the no-connection message when a question is requested. (Installing on phones needs a public HTTPS address, so it is checked on the live site in Milestone 5.)
- **Definition of Done:**
  - Chrome DevTools shows a valid manifest with the correct name and icons, and no installability errors.
  - The app installs from desktop Chrome (running locally) and opens in its own window with the טריוויקיד icon and name.
  - With the network turned off, the installed app still opens the Home, Trivia and About screens. Requesting a question shows the no-connection message.
  - `/api/question` responses are never served from the cache. A question request while online always reaches the server.
  - After a new build, the app picks up the new version on the next visit; the service worker does not keep serving stale pages indefinitely.

## Milestone 5 — Production release
- **Purpose:** Turn on the live site and automatic deployment, configure the Production environment, and verify the complete product on the live site.
- **Implementation scope:**
  - **User setup (guided):**
    - Create a Vercel account and connect the GitHub repository with Vercel's GitHub integration. From then on, every push to `main` deploys to Production automatically, and other branches get Preview deployments.
    - Create the OpenAI production key and add it to Vercel's Production environment variables only, together with `OPENAI_MODEL=gpt-5`.
    - Set a monthly budget limit and usage alerts in the OpenAI account settings.
    - Optionally connect a custom domain.
  - **Release:** the first deployment of `main` to Production, plus the security headers and HTTPS check on the live URL.
  - **Final verification:** check every PRD flow on the live URL on a phone and a desktop browser (Chrome, Safari, Edge, Firefox).
- **Expected deliverable:** טריוויקיד live on its Production URL, fully working and installable, using the production API key.
- **Definition of Done:**
  - The repository is connected to Vercel. A push to `main` triggers an automatic Production deployment, and the live URL loads over HTTPS.
  - The Production deployment uses the production key, and the development key is not configured in Production. Neither key appears in the repository.
  - The OpenAI budget limit and alerts are configured, and the user confirms this.
  - On the live URL, every PRD flow works:
    - Home → Trivia → question → answer → feedback and fun fact → "שאלה חדשה" (same or changed topic).
    - Home → About → back.
    - The edge cases from Milestone 3.
  - The app installs from the Production URL on an Android phone (Chrome install prompt) and on an iPhone (Share → Add to Home Screen), and opens in standalone mode with the טריוויקיד icon and name. With the phone offline, the installed app opens and shows the no-connection message when a question is requested.
  - The screens match DESIGN.md and the Mockups on mobile and desktop, in Hebrew RTL.
