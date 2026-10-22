# Architecture — טריוויקיד (Trivikid)

> The technical architecture required to build the product described in PRD.md. It includes only the components the product needs and keeps the design as simple as possible. Milestones and tasks are defined separately in MILESTONES.md.

## 1. Selected Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend + Backend framework | **Next.js 16 (App Router)** with **React** and **TypeScript** | Builds the three screens and one small server-side API endpoint in a single project |
| Styling | **Tailwind CSS** | Responsive, mobile-first, RTL-friendly styling (using logical properties) |
| PWA | Next.js built-in **web app manifest** (`app/manifest.ts`) + a small hand-written **service worker** | Lets the app be installed on the home screen and caches the app shell so a friendly "no connection" message can be shown offline |
| AI service | **OpenAI API**, model **GPT-5** (`gpt-5`), via the official OpenAI TypeScript SDK (Responses API), with **Structured Outputs** (JSON schema defined in Zod) | Generates each Hebrew trivia question, its 4 options, the correct answer and the explanation |
| Validation | **Zod** | Validates incoming requests and the AI's response before anything reaches the child |
| Testing | **Vitest** | Automated tests for the server-side logic (input validation, response validation, shuffling, duplicate checks) |
| Hosting and deployment | **Vercel** (Git integration, Vercel Functions) | Hosts the site and the API endpoint; deploys automatically from GitHub |
| Source code | Git repository on **GitHub** | Code storage and version history |
| Database | **None** | The PRD requires no accounts, scores or saved history, so no database is needed |

### Key technology decisions

- **No database or authentication.** The PRD has no accounts, no scores and no history between visits. The "no repeat" rule only applies within the current visit, so the browser's memory is enough. This removes Supabase and any login system entirely.

- **A backend is still required, but only one endpoint.** The AI key must not be exposed in the browser (PRD, Constraints), so the AI call has to run on a server. That makes this a "frontend + backend" app, and the guideline default is Vercel. A single Next.js project holds both the screens and the endpoint, so there is one codebase and one deployment.

- **Next.js over the alternatives.**
  - *Vite + React plus separate Vercel Functions* would also work, but it means two pieces wired together by hand.
  - *A plain static site on GitHub Pages* cannot hide the AI key.
  - Next.js is Vercel's own framework (zero configuration on Vercel), and it has an official PWA guide and built-in manifest support ([Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)). It is also extremely well documented, which suits AI-assisted development.

- **GPT-5 for question generation (product owner's decision).** The question model is **OpenAI GPT-5** ([GPT-5 model page](https://developers.openai.com/api/docs/models/gpt-5)):
  - **Structured Outputs support:** the official JS SDK can turn a Zod schema into the required JSON format (`zodTextFormat` with `responses.parse`), so the server receives a typed, schema-conforming object ([OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)).
  - **Reasoning effort:** GPT-5 is a reasoning model that supports reasoning effort `minimal`, `low`, `medium` and `high`. The app uses **`minimal`**, because a short trivia question needs little reasoning, and lower effort means a faster response and fewer billed tokens.
  - **Price:** $1.25 per 1M input tokens and $10.00 per 1M output tokens.
  - **Estimated cost per question:** a single question is a short request, so it costs well under one cent. This is an estimate; the actual cost depends on prompt length and reasoning tokens.
  - **Configurable model ID:** the model ID is kept in configuration (`OPENAI_MODEL`), so the model can be replaced without code changes.

- **Minimal PWA approach.** Installation needs a valid manifest and HTTPS ([Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)), and Vercel provides HTTPS automatically. A small service worker built on standard Web APIs is added only to cache the app shell. That way, an installed app opened without internet still loads and shows the PRD's friendly "no connection" message instead of a browser error page. No PWA plugin library is needed for this. Serwist, the option suggested in the Next.js docs, is the upgrade path if fuller offline support is ever required.

### Risks and limitations

- **Vercel Hobby (free) plan is for non-commercial, personal use only** ([Vercel Hobby plan](https://vercel.com/docs/plans/hobby)). It is enough for development and a personal or course project. If the app is used commercially (for example, as part of paid tutoring), the project must move to the Vercel Pro plan, which costs $20 per user per month at the time of writing.
- **Hobby plan usage limits.** These include 1,000,000 function invocations and 4 active CPU-hours per month, and the function maximum duration is 300 seconds ([Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel Functions limits](https://vercel.com/docs/functions/limitations)). Waiting for the AI's response does not count as active CPU time. These limits are far above what this app needs.
- **Public endpoint and cost.** The question endpoint is public (there are no accounts), so in theory someone could call it heavily and run up AI costs. The PRD sets no usage limits and a budget is available. The mitigations are therefore a monthly budget limit and usage alerts configured in the OpenAI platform settings, strict input validation, and Vercel's built-in DDoS mitigation. If abuse ever happens, a Vercel WAF rate-limit rule can be added without code changes.
- **AI content quality.** The model may occasionally produce a factually doubtful question or a malformed response. The server validates every response (see Data Flow), but factual accuracy cannot be fully guaranteed by code. The prompt asks for well-known, verifiable facts suited to ages 8–12.
- **GPT-5 is marked "Deprecated" by OpenAI.** OpenAI recommends its newer GPT-6 Astra model instead. No shutdown date is listed at the time of writing ([GPT-5 model page](https://developers.openai.com/api/docs/models/gpt-5)). The model works today, but it may be retired in the future. Because the model ID is a configuration value, switching to a successor model is a configuration change plus a quick re-test of question quality.
- **Speed and cost.** OpenAI rates GPT-5's speed as "Medium". It is also priced higher than some newer OpenAI models (for example, gpt-6-luna at $0.10 / $0.50 per 1M tokens, per the [OpenAI pricing](https://developers.openai.com/api/docs/pricing) page). Using `minimal` reasoning effort keeps both waiting time and cost down. The server and client timeouts (see Data Flow) cover slow responses.
- **Structured-output guarantees are not enough on their own.** The server still enforces the business rules that a JSON schema cannot express, such as "exactly 4 distinct options" and "the correct answer is one of them". It also handles a model refusal as an invalid response.
- **Prices and model versions change.** The figures above are as of October 2026. Check the OpenAI pricing page for current rates ([OpenAI pricing](https://developers.openai.com/api/docs/pricing)).

## 2. System Architecture

### System structure

The system has three parts:

1. **Client (the browser or installed PWA).** It renders the three screens (Home, Trivia Questions, About) in Hebrew RTL. It holds the current topic, the current question, and the per-topic list of questions already shown during this visit, and it decides whether the child's answer is correct.
2. **Question API (one Vercel Function, `POST /api/question`).** It receives a topic and the list of already-shown questions, builds the AI prompt, calls GPT-5, validates and normalizes the answer, and returns one ready-to-display question or a known status code.
3. **External AI service (OpenAI API, GPT-5).** It generates the question content.

There is no database, no file storage and no authentication service.

### Modules and layers

| Layer | Module | Responsibility |
|-------|--------|----------------|
| UI (client) | **Pages:** `/` (Home), `/trivia` (Trivia Questions), `/about` (About) | Screen layout and navigation |
| UI (client) | **Trivia components:** topic input, question card, answer options, feedback panel, loading and error states | Game interaction on the Trivia screen |
| Client logic | **Trivia state** (React state inside the Trivia screen) | Current topic, current question, chosen answer, and in-memory history `{ topic → shown question texts }`; it resets on refresh or close |
| Client logic | **API client** | Calls `/api/question`, applies a client-side timeout, and maps responses to UI states |
| Content | **Hebrew UI texts** (one constants file) | All user-facing strings in one place, so the wording can be refined from DESIGN.md |
| PWA | **Manifest + service worker** | Installation, and offline app-shell caching |
| Server | **Question route handler** (`app/api/question/route.ts`) | Request validation and orchestration |
| Server | **Question generator** | Builds the prompt, calls GPT-5 with the JSON schema, and validates and retries |
| Shared | **Schemas** (Zod) | Request and response shapes shared by client and server |

Dependencies flow in one direction: UI → client logic → API client → Question API → question generator → OpenAI API.

### Frontend and Backend

**Frontend**
- Next.js App Router pages, all rendered statically except for the API route. The Trivia screen is a client component because it is interactive.
- Root layout sets `<html lang="he" dir="rtl">`. A Hebrew-supporting font is loaded via `next/font`; the font itself is defined in DESIGN.md.
- Mobile-first responsive layout with Tailwind. Directional styling uses logical properties (start and end) so RTL is correct by default.
- Navigation follows the PRD:
  - Home has buttons to "בואו נשחק!" (`/trivia`) and "אודות" (`/about`).
  - Trivia and About each have a back/home button to `/`.
- Answer checking happens on the client by comparing the selected option index with `correctIndex`. Once the child chooses, the options are replaced by the feedback (one attempt). Because there are no scores, exposing the correct index to the browser carries no risk.
- The request button is disabled while a request is in flight, so only one request runs at a time.

**Backend**
- One Next.js Route Handler, `POST /api/question`, running as a Vercel Function on the Node.js runtime. It is stateless and has no sessions.
- The AI request runs with a server-side time limit of about 30 seconds; the function's `maxDuration` is set to 60 seconds, which leaves room for one retry.
- The handler retries at most once when the AI response is invalid or duplicates a previously shown question.

### Data Model

There is no persistent storage. The data exists only in transit or in the browser's memory.

**Request to `/api/question`**
| Field | Type | Rules |
|-------|------|-------|
| `topic` | string | Trimmed; required; 1–50 characters (PRD assumption) |
| `previousQuestions` | string[] | Question texts already shown for this topic in this visit; the client sends at most the 30 most recent, each up to 300 characters |

**Response from `/api/question`**
| Field | Type | Notes |
|-------|------|-------|
| `status` | `"ok"` \| `"unclear_topic"` \| `"no_new_question"` \| `"error"` | Drives which UI state is shown |
| `question` | string | Hebrew question text (when `status = "ok"`) |
| `options` | string[4] | Exactly 4 distinct, non-empty Hebrew options, already shuffled |
| `correctIndex` | 0–3 | Index of the correct option after shuffling |
| `explanation` | string | 1–2 simple Hebrew sentences about the correct answer |

**AI output schema (Zod schema sent to GPT-5 as the Structured Outputs format; all fields required, no extra fields)**
- `status`: `"ok"` \| `"unclear_topic"` \| `"no_new_question"`
- `question`: string
- `options`: string[]
- `correctOptionText`: string (must equal one of the options)
- `explanation`: string

**Client in-memory state (per visit)**
- `history`: a map from the normalized topic (trimmed, lower-cased, inner spaces collapsed) to the list of question texts shown.
- The current topic, the current question, the selected option, and the UI state: `idle`, `loading`, `question`, `answered`, or `message`.

### APIs and integrations

**Internal API**
- `POST /api/question`: JSON in and JSON out, as defined in the Data Model.
  - It returns HTTP 200 with a `status` for all "expected" outcomes (`ok`, `unclear_topic`, `no_new_question`).
  - It returns HTTP 400 for an invalid request, such as an empty topic or one that is too long.
  - It returns HTTP 502 or 504 with `status: "error"` for AI failures or timeouts.

**External integration: OpenAI API (GPT-5)**
- Uses the official OpenAI TypeScript SDK and the **Responses API** (`responses.parse`). The model ID comes from `OPENAI_MODEL` (default `gpt-5`), with reasoning effort `minimal`.
- The output format is `zodTextFormat(<question schema>)`, and the parsed result is read from `output_parsed` ([OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)).
- If the model returns a refusal, or the response is incomplete, it is treated as an invalid response (retry once, then `error`).
- The system prompt instructs the model to:
  - Write everything in Hebrew, for children aged 8–12, with simple and clear wording.
  - Produce one question with 4 plausible options, exactly one of them correct, plus a 1–2 sentence fun explanation.
  - **Child-safe redirection:** if the topic is inappropriate for children, choose a related, child-safe angle of the topic and ask about that, never refusing and never mentioning the inappropriate aspect.
  - Return `unclear_topic` when the topic is meaningless (e.g., random letters).
  - Not repeat or closely paraphrase any of the supplied `previousQuestions`, and return `no_new_question` if no meaningfully new question is possible.
  - Prefer well-known, verifiable facts.
- The topic is placed in the user message as data and is never treated as an instruction.

### Data Flow

**Getting a question**
1. The child types (or keeps, or edits) a topic and taps "שאלה חדשה".
2. The client trims the topic.
   - If it is empty, the client shows "כתבו נושא כדי לקבל שאלה 🙂" and stops, with no request sent.
   - If the browser reports that it is offline, the client shows the no-connection message and stops.
3. The client disables the button, shows the loading state, and sends `{ topic, previousQuestions }`, where `previousQuestions` comes from `history` for the normalized topic.
4. The API validates the request with Zod; an invalid request gets HTTP 400.
5. The API calls GPT-5 with the system prompt (sent as the instructions), the topic and the JSON schema.
6. The API validates the AI result:
   - It must be valid JSON matching the schema.
   - If `status = "ok"`: there must be exactly 4 options, all non-empty and distinct; `correctOptionText` must match exactly one option; and the question text must not equal any entry in `previousQuestions` after normalization.
   - If validation fails or the question is a duplicate, the API retries the AI call once. If the retry also fails, it returns `status: "error"` (or `no_new_question` when the retry is again a duplicate).
7. The API shuffles the 4 options randomly, computes `correctIndex`, and returns the response.
8. The client handles the response:
   - On `ok`, it adds the question text to `history[topic]` and shows the question.
   - On `unclear_topic`, `no_new_question` or `error`, it shows the matching Hebrew message, with a "נסו שוב" (try again) option for errors.
9. The child taps an option (one attempt). The client removes the options and shows in their place, below the question, the success or failure message (with the correct answer on failure) and the explanation.

**Changing the topic mid-question:** if the child edits the topic and requests again before answering, the client discards the current question and runs the flow for the new topic.

**Client timeout:** if no response arrives within about 60 seconds, the client aborts the request and shows the error message with a retry option.

### Authentication, authorization, security, and privacy

- **No authentication or authorization.** The app has no users or accounts, as the PRD requires.
- **AI key protection.** `OPENAI_API_KEY` exists only on the server, in Vercel environment variables and in a local `.env` file that is never committed. It is never prefixed with `NEXT_PUBLIC_`, so it can never reach the browser.
- **Input hardening.**
  - The server enforces the topic length (≤ 50 characters) and the `previousQuestions` limits (≤ 30 items, each ≤ 300 characters), and rejects any other fields.
  - The topic is passed to the model as data, inside a clearly delimited section of the user message.
- **Output safety.**
  - The AI's text is rendered as plain text (React escaping), never as HTML.
  - The schema plus server validation ensure that only well-formed questions are displayed.
- **Privacy.**
  - No personal data is collected or stored, and there are no cookies, analytics or accounts.
  - Only the typed topic (and the texts of previously shown questions) is sent to the AI service.
  - The server does not intentionally log topic text; error logs record only the error type.
  - A paid API tier is used, never a free tier that uses submitted content for training.
- **Security headers.** These are set in `next.config` as recommended by the Next.js PWA guide: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and no-cache headers for the service worker file.
- **Cost guard.** A monthly spend limit and usage alerts are configured on the OpenAI account (project budget and usage alerts). This is account configuration, not product code.

### Infrastructure, Hosting, Deployment, and Configuration

**Source code and deployment**
- Code lives in a GitHub repository (`github.com/Lemore/trivikid`).
- **During development (Milestones 1–4) the app runs only locally.** Pushes to GitHub do not deploy anything, so unfinished milestones never reach a live site.
- **In the final milestone (Production release)** the repository is connected to a Vercel project through Vercel's GitHub integration. From then on:
  - Every push to the `main` branch builds and deploys to **Production**.
  - Pushes to other branches and pull requests get automatic **Preview** deployments, each with its own URL, for testing before merging.
- After that connection there is no manual deployment step. Vercel builds with `next build`, and its default settings for Next.js need no extra configuration.
- HTTPS and a `*.vercel.app` domain are provided automatically. A custom domain is optional.

**Environments and configuration**
There is no database, so the only per-environment configuration is environment variables:

| Variable | Local development (`.env`, git-ignored) | Vercel Preview (after the release, if used) | Vercel Production |
|----------|-----------------------------------------|----------------|-------------------|
| `OPENAI_API_KEY` | Development key | Development key | Production key (stored only in Vercel) |
| `OPENAI_MODEL` | `gpt-5` | `gpt-5` | `gpt-5` |

- Two separate OpenAI API keys are used, one for development and testing and one for production. A development key can then be revoked without affecting the live site, and usage can be told apart.
- `.env.example` (committed) lists the variable names with no values; the local `.env` (git-ignored) holds the development values.
- Local testing runs with `npm run dev` against the real OpenAI API using the development key. Nothing else (no Docker, no local database) is required.

**PWA configuration**
- `app/manifest.ts` sets:
  - `name: "טריוויקיד"`, `short_name: "טריוויקיד"`, `lang: "he"`, `dir: "rtl"`, `start_url: "/"`, `display: "standalone"`.
  - Theme and background colors from DESIGN.md.
  - 192×192 and 512×512 icons generated from `app-icon.png`, including a maskable icon (the icon placed on the Light Wood color so it fills the whole square, since `app-icon.png` has transparent rounded corners).
- `public/sw.js` is registered from the root layout. It:
  - Precaches the three pages and the static assets (cache-first for `/_next/static/*`).
  - Uses network-first for page navigations, falling back to the cached page when offline.
  - **Never caches `/api/*`.**
- iOS supports installation through the Share menu → "Add to Home Screen"; the browser handles this, and no custom install button is required by the PRD.

### Additional key technical decisions

- **Duplicate prevention is two-layered.** The prompt tells the model which questions to avoid, and the server rejects exact or normalized duplicates and retries once. History is kept only in memory, so it resets on refresh or close, exactly as the PRD requires.
- **Options are shuffled on the server** so the correct answer's position is random, and the model's positional bias cannot make the game predictable.
- **All Hebrew UI strings live in one constants module.** The PRD's suggested wording (e.g., "בואו נשחק!", "שאלה חדשה", "כל הכבוד! תשובה נכונה 🎉", "לא נורא! התשובה הנכונה היא:", "אופס! משהו השתבש. נסו שוב", "לא הצלחנו להבין את הנושא, נסו נושא אחר", "כתבו נושא כדי לקבל שאלה 🙂", "אין חיבור לאינטרנט. התחברו ונסו שוב", "נגמרו לנו שאלות חדשות על הנושא הזה. נסו נושא אחר!") can be refined in one place.
- **Accessibility basics.** Success and failure are shown with color plus an icon and text, not by color alone. Buttons are large touch targets, and the feedback area is announced to screen readers through an ARIA live region.
- **Region.** Vercel Functions run in a single default region (`iad1`) ([Vercel Functions limits](https://vercel.com/docs/functions/limitations)). Most of the response time is the AI call itself, so the default is acceptable and needs no change.

## Key decisions (ADRs)

### ADR-1: Duplicate detection by normalized question text
**Context:** The PRD forbids repeating a question within a visit. The model may return a question that differs from a shown one only in punctuation, quote marks, spacing or letter case.
**Decision:** The server compares questions after normalization: lower-cased, all Unicode punctuation and symbols removed (including Hebrew ״ ׳), and whitespace collapsed. A duplicate triggers one retry; if the retry is also a duplicate, the server returns `no_new_question`. Generated questions longer than 300 characters are rejected as invalid, so every question the client stores in its history always fits the request limit (≤ 300 characters per item).
**Consequences:** Exact and near-exact repeats are always caught. Close paraphrases rely on the prompt rule. A rare long question costs a retry.

### ADR-2: Styles for status messages
**Context:** DESIGN.md defines the success, failure and fun-fact panels but not the look of the error, offline, empty-topic, unclear-topic and no-new-question messages.
**Decision (product owner's choice):** Problems ("אופס! משהו השתבש. נסו שוב", "אין חיבור לאינטרנט…") use the failure panel (light red, ✕) followed by a secondary-style "נסו שוב" button. Gentle prompts (empty topic, unclear topic, no new question) use the fun-fact panel look (soft yellow, Block Yellow start edge, 💡) with no retry button. The retry button runs the same request as "שאלה חדשה".
**Consequences:** The screen keeps a single blue primary action, and gentle prompts don't look like mistakes.

### ADR-3: Network failure shown as "no connection"
**Context:** The PRD requires a friendly no-connection message, but `navigator.onLine` is not always reliable.
**Decision:** The client shows the no-connection message when `navigator.onLine` is false (no request is sent) and also when `fetch` fails without any response (network error, server unreachable). A client timeout (60s, via `AbortController`) and any HTTP error response show the generic error message.
**Consequences:** Offline cases are covered even when the browser wrongly reports being online. If the server itself is unreachable while the internet works, the child sees the no-connection message, which still asks them to try again.

### ADR-4: Service worker only in production builds
**Context:** A service worker that caches pages and scripts would serve stale files during development, where `npm run dev` rebuilds them on every change.
**Decision:** `components/ServiceWorkerRegistration.tsx` registers `/sw.js` only when `NODE_ENV` is `production`. PWA checks run on a production build locally (`npm run build`, then `npm start`; Chrome treats `localhost` as secure, so installation works without HTTPS).
**Consequences:** Development is unaffected by caching. Offline behavior and installation can only be checked on a production run or on the live site.

### ADR-5: Precache list read from the pages' HTML
**Context:** The hand-written service worker has no build-time list of the hashed files each page needs, but an installed app opened offline needs all of them (scripts, CSS, fonts and the Home picture).
**Decision:** On install, the service worker fetches the three prerendered pages and caches every `/_next/static/…` and `/_next/image?…` URL named in their HTML (optimized-image widths above 1200px are skipped), plus the font files named in the CSS. Pages are network-first, hashed files are cache-first, cached responses are matched by URL only (`ignoreVary`), and `/api/*` and in-app navigation data (RSC requests) are never intercepted. `CACHE_VERSION` in `sw.js` is bumped by hand only when the worker's own logic changes; activation then deletes the old caches.
**Consequences:** No build step or PWA library is needed. Online, the app always shows the newest build, because pages come from the network first and new hashed files are fetched on first use. Files from older builds stay in the cache until `CACHE_VERSION` changes; for an app this small, that is acceptable.

### ADR-6: Production-only OpenAI key; Previews have no key
**Context:** Vercel's project import screen applies environment variables to every environment, but the production OpenAI key must exist only in Production.
**Decision:** The project was imported with no environment variables. `OPENAI_API_KEY` (the production key, marked Sensitive) and `OPENAI_MODEL=gpt-5` were then added with the Production scope only, followed by a redeploy. The production key belongs to a separate OpenAI project with its own monthly budget and usage alerts. Preview deployments get no key until they are needed; then the development key is added with the Preview scope only.
**Consequences:** The production key cannot reach branch builds, and its usage and cost are tracked apart from development. Until a Preview key is added, question requests on Preview URLs show the error message.
