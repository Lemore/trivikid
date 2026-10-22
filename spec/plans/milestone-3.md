# Milestone 3 — Question rules, child safety, and error handling (plan)

> Builds on the Milestone 2 code. Goal: every PRD edge case behaves correctly and kindly. No new screens, no new dependencies, no new environment variables.

## 0. Starting point (what already exists)
- `lib/schemas.ts` — request/response/AI schemas. The request has no limits on `previousQuestions` and allows extra fields.
- `lib/question-rules.ts` — `normalizeTopic`, `validateAiQuestion`, `shuffleOptions`.
- `lib/server/question-generator.ts` — prompt, one retry on invalid output, passes through `unclear_topic` / `no_new_question`, but has no duplicate check and the prompt always says `status: "ok"`.
- `app/api/question/route.ts` — 400 / 502 / 504 mapping, logs only the error type.
- `lib/api-client.ts` — every failure becomes `{ status: "error" }`; no timeout, no offline handling.
- `components/trivia/TriviaGame.tsx` — history per normalized topic (memory only), but an empty topic silently does nothing and every non-ok status shows the generic error text with no retry.
- `lib/strings.ts` — all M3 Hebrew messages already exist (`emptyTopic`, `unclearTopic`, `error`, `retry`, `offline`, `noNewQuestion`).

## 1. Files to create / change
| File | Change |
|------|--------|
| `lib/schemas.ts` | Request limits + `.strict()`; export limit constants |
| `lib/question-rules.ts` | `normalizeQuestion`, `isDuplicateQuestion`, question length rule in `validateAiQuestion` |
| `lib/server/question-generator.ts` | Prompt rules (safety, unclear, no-new); duplicate check + retry logic |
| `lib/api-client.ts` | 60s client timeout (AbortController), offline/network detection, new `offline` outcome |
| `components/trivia/TriviaGame.tsx` | Message kinds, empty-topic prompt, offline pre-check, retry, history capped at 30 |
| `components/trivia/TopicInput.tsx` | `maxLength={50}` |
| `components/trivia/StatusMessage.tsx` (new) | The message panel (two styles, optional retry button) |
| `tests/*` | New and updated tests (section 6) |
| `spec/ARCHITECTURE.md` | ADRs (section 7) |
| `spec/MILESTONES.md` | 🟡 mark after the build |

## 2. Shared schemas and rules

### `lib/schemas.ts`
- Constants: `TOPIC_MAX_LENGTH = 50` (exists), `PREVIOUS_QUESTIONS_MAX = 30`, `QUESTION_MAX_LENGTH = 300`.
- `QuestionRequestSchema`:
  - `topic`: trimmed, 1–50 (unchanged).
  - `previousQuestions`: `z.array(z.string().max(300)).max(30).default([])`.
  - `.strict()` — unknown fields → validation fails → HTTP 400.
- The client-side result type gets one extra client-only outcome, `offline` (not part of the server response schema): `type FetchResult = QuestionResponse | { status: "offline" }`, defined in `lib/api-client.ts`.

### `lib/question-rules.ts`
- `normalizeQuestion(text)`: trim, lower-case, remove punctuation and quote marks (`? ! . , : ; " ' ״ ׳ ־ - ( )` and similar — via a Unicode punctuation regex `\p{P}`), collapse inner whitespace. So "מהו הכוכב הגדול ביותר?" and "מהו  הכוכב הגדול ביותר" count as the same.
- `isDuplicateQuestion(question, previousQuestions)`: true if the normalized question equals any normalized previous question.
- `validateAiQuestion`: additionally reject a question longer than `QUESTION_MAX_LENGTH` (300). This guarantees every question the client stores in its history can be sent back without breaking the server's 300-character limit.

## 3. Server

### Prompt (`SYSTEM_PROMPT`) — replace the final "Set status to ok" line with:
- **Child-safe redirection:** if the topic is inappropriate for children (violence, weapons, adult content, drugs, etc.), pick a related, child-safe angle of the topic (e.g. history, science, nature, sport, culture) and ask about that. Never refuse, never warn, never mention the inappropriate aspect. Status stays `"ok"`.
- **Unclear topic:** if the topic is meaningless (random letters, gibberish, only symbols), return `status: "unclear_topic"` with empty strings and an empty options array. A short or unusual but real topic (a name, a place, a word in another language) is *not* unclear.
- **No repeats:** do not repeat or closely paraphrase any of `<previous_questions>`; ask about a different fact. If no meaningfully new question is possible, return `status: "no_new_question"` (empty fields).
- Otherwise `status: "ok"`.
- Existing rules (Hebrew, ages 8–12, 4 options, exact `correctOptionText`, 1–2 sentences, verifiable facts, topic is data) stay.

### `generateQuestion` — attempt logic (max 2 AI calls)
For each attempt:
1. Call the model (unchanged error handling: timeout → `GeneratorTimeoutError`; API error → rethrow; refusal/parse failure → treated as invalid).
2. `unclear_topic` / `no_new_question` from the model → return it immediately.
3. Invalid output → remember "last failure = invalid", try again.
4. Valid but `isDuplicateQuestion` → remember "last failure = duplicate", try again.
5. Valid and new → shuffle and return `ok`.

After two failed attempts: return `no_new_question` if the last failure was a duplicate, otherwise `error` (→ HTTP 502). This matches ARCHITECTURE.md step 6.

### `app/api/question/route.ts`
- No logic change: invalid/too long/extra-field requests already get 400 through the schema. Keep logging only the error type, never the topic (re-check no other `console.*` prints request data).

## 4. Client

### `lib/api-client.ts` — `fetchQuestion(body): Promise<FetchResult>`
- `CLIENT_TIMEOUT_MS = 60_000` with an `AbortController`; on abort → `{ status: "error" }`.
- `fetch` throws a `TypeError` (network failure, server unreachable) → `{ status: "offline" }`.
- Any HTTP response (200/400/502/504) → parse with `QuestionResponseSchema`; unparseable → `{ status: "error" }`.

### `components/trivia/TriviaGame.tsx`
- State: replace the single `"message"` state with a message kind: `"emptyTopic" | "unclearTopic" | "noNewQuestion" | "error" | "offline"`.
- On "שאלה חדשה":
  1. Trimmed topic empty → show `emptyTopic`, no request.
  2. `navigator.onLine === false` → show `offline`, no request.
  3. Otherwise as today (button disabled, "טוען…", in-flight guard), sending `previousQuestions = history.slice(-30)` for the normalized topic.
- Result mapping: `ok` → add to history, show question; `unclear_topic` → `unclearTopic`; `no_new_question` → `noNewQuestion`; `error` → `error`; `offline` → `offline`.
- When a message is shown, the previous question card is removed (no partial or old question is shown together with a message).
- **Retry ("נסו שוב"):** shown only with `error` and `offline`. It runs exactly the same action as "שאלה חדשה" (same topic in the box, same history). It is disabled while loading, like the main button.
- History stays in a `useRef` (memory only), so it resets on refresh or close — unchanged.

### `components/trivia/TopicInput.tsx`
- `maxLength={TOPIC_MAX_LENGTH}` — more than 50 characters cannot be typed or pasted.

### `components/trivia/StatusMessage.tsx` (new) — the user's chosen styles
- Rounded panel (radius 16px), circular icon, bold text, inside an ARIA live region (`role="status"`), shown where the question card would be.
- **Problem style** (`error`, `offline`): DESIGN.md failure style — light red `#FDE9E7` background, dark red `#B3241A` text, red circle with "✕". Below the text, a "נסו שוב" **secondary** button (white, blue outline), so the screen keeps one blue primary action.
- **Gentle style** (`emptyTopic`, `unclearTopic`, `noNewQuestion`): the fun-fact panel look — soft yellow `#FFF7CC` background, 6px Block Yellow edge on the start (right) side, 💡 icon, Ink text. No retry button.
- All texts come from `strings.trivia` (already in Hebrew).

## 5. Child safety and privacy checks
- Safety is handled only by the prompt (section 3); no error is ever shown for an inappropriate topic.
- Questions and topics are rendered as plain text (React escaping) — unchanged.
- The server never logs topic or question text.

## 6. Tests (Vitest)
- **`question-rules.test.ts`:** `normalizeQuestion` (punctuation, spaces, case, Hebrew quote marks); `isDuplicateQuestion` true/false cases; `validateAiQuestion` rejects a question over 300 characters.
- **`schemas.test.ts`:** 30 previous questions OK / 31 rejected; a 301-character item rejected; an extra field rejected; 50-character topic OK / 51 rejected; whitespace-only topic rejected.
- **`question-route.test.ts`** (OpenAI mocked): duplicate then new → `ok`; duplicate twice → `no_new_question`; duplicate then invalid → `error`/502; model `unclear_topic` → 200 `unclear_topic`; oversized/extra-field request → 400; timeout → 504; the topic text never appears in `console.error` output.
- **`trivia-game.test.tsx`** (fetch mocked): empty/whitespace topic → empty-topic message and `fetch` not called; offline (`navigator.onLine = false`) → offline message, no request; network `TypeError` → offline message with retry; 502 → error message, retry sends a new request and shows the question; `unclear_topic` and `no_new_question` → their messages with no retry button; the history sent is capped at 30 and keyed by normalized topic; input has `maxLength` 50.
- **`api-client`** test: abort after the timeout → `error` (fake timers).

## 7. ADRs to add in ARCHITECTURE.md
- **ADR: Duplicate detection by normalized question text** — normalization rules, and a cap of 300 characters on generated questions so the history always fits the request limits.
- **ADR: Message styles** — problems use the failure panel with a secondary "נסו שוב" button; gentle prompts use the fun-fact panel style (user's decision, since DESIGN.md does not define them).
- **ADR: Network failure shown as "no connection"** — a failed `fetch` (no response at all) and `navigator.onLine === false` both show the offline message; a client timeout shows the generic error.

## 8. Build-time verification (Claude, before marking 🟡)
- `npm test`, `npm run lint`, `npm run build` pass.
- Run the dev server and check in the browser pane at 360px and desktop:
  - 10 questions in a row on one topic → no repeat; refresh → history reset (check the request body's `previousQuestions` is empty again).
  - An inappropriate topic → a child-safe question, no error.
  - "אאאא" and random letters → unclear-topic message.
  - Empty / spaces-only topic → empty-topic message, no network request.
  - 51+ characters can't be typed; a direct request with a 51-character topic gets HTTP 400.
  - AI failure: run a second dev server with `OPENAI_API_KEY=invalid` set on the command line (the real `.env` is not read or changed) → error message → "נסו שוב" works once the server is the real one again. Timeout is covered by the mocked tests.
  - Network off: stop the dev server while the page is open (and emulate offline) → no-connection message with retry, then works again after restart.
  - All messages in Hebrew, RTL, with the chosen styles.
- Shut the dev server down afterwards. No commit.

## 9. Notes
- No changes to PRD/DESIGN. The message styles are the user's decision, recorded as an ADR.
- The "forced timeout" check in the DoD is verified through the automated test (mocked slow AI), not by changing code or settings for a manual run.
