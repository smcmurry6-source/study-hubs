---
type: reference
tags: [timmy, ask-timmy, supabase, edge-function, claude-api, redesign, privacy]
---

# Ask Timmy: the server (the `timmy` Edge Function and migration_v55)

How Ask Timmy answers a student: the Supabase Edge Function `timmy`, its database half (`migration_v55.sql`), the tests
and the eval. Built 2026-11-12 as part 1 of [the task](../tasks/2026-11-12-redesign-ask-timmy.md) (Sam's calls are
there and in [decisions](../decisions.md)); **deployed and applied at [the redesign's release](../tasks/2026-11-06-redesign-release.md),
not before**. Until then `migration_v55.sql` is in `supabase/pending-migrations.txt` and nothing calls the function.

## The files

| File | What it is |
|---|---|
| `supabase/functions/timmy/core.js` | Everything the function decides, as a plain ES module (no imports) so it runs under Node in the tests: reading the request, the content corpus and its unit ids, Timmy's rules (`RULES`), the answer's JSON schema, the request to the API, checking every quote, the cost estimate, the "napping" lines, HTTP |
| `supabase/functions/timmy/index.ts` | The Deno wrapper: the Anthropic SDK (`npm:@anthropic-ai/sdk@1.3.0`), the two database calls through PostgREST with the service-role key, the content fetched from the site and kept 10 minutes |
| `supabase/functions/timmy/site.json` | The site help, built from the About page by `tools/timmy/build.mjs` with every spoiler left out. **Rebuild it when `about/index.html` changes** (CI's "generated files are current" step fails otherwise) |
| `migration_v55.sql` | `timmy_config`, `timmy_chats`, `timmy_messages`; `timmy_begin` / `timmy_finish` (the function's, service role only); the students' calls; the admin page's calls; a trigger that moves chats when devices link |
| `tools/timmy/test.mjs` | The function's tests with a fake model and database (CI): paragraph numbering against Chromium and the engine's own `exportSections`, the corpus (no question bank in it), quotes, offers, links, limits, HTTP |
| `tools/release/timmy.js` | The database suite on a throwaway copy (CI): limits, the daily spend, own rows only, reports, admin reads, linked devices |
| `tools/timmy/test-set.json`, `tools/timmy/eval.mjs` | The eval: 134 cases (about 40 a hub, 10 on the dashboard) run on the real API and graded. `--dry` checks the test set itself with a fake model (free; CI runs it, so a note edit that makes a "not covered" case covered fails there) |

## One question, start to finish

1. The browser POSTs to `https://thytmzsgymydbzcqdnix.supabase.co/functions/v1/timmy` (JWT checking off; only the site's own
   origin is answered) with `{ visitor, hub, text, chat, request, voice, context, hubs, ask, progress }`:
   - `hub`: a hub id, or `dashboard` with `hubs` (the live hub ids; the function keeps up to 4 it has content for);
   - `text`: up to 1,000 characters; `chat`: the chat id from the last answer (or null); `request`: a fresh random id per
     send (8-64 of `A-Za-z0-9_-`), **the same one on a retry**, so a retried send gets the stored answer and costs nothing;
   - `voice`: `timmy`, or `plain` when Timmy is turned off (the same rules, "the hub" with no character);
   - `context`: `{ view: SH_SECTION(), lec, k }` (a view with `mock` in it gets "paused" without calling anything);
   - `ask` (Ask Timmy on a question card, after answering): `{ qid, right, picks }`, picks in **authored** order. The
     question's stem, key and whys are read from the hub's own `questions.json`, and only if the database has this
     visitor's answer to it (`personal_answers`), so the browser can't fish for a key;
   - `progress` ("What should I study tonight?"): `{ lectures: [{ hub, lec, questions, answered, right, missed,
     notes_done }], answered_today, drill_today }`, worked out in the browser from the student's own answers.
2. `timmy_begin` checks the limits, stores the question and returns the last 10 messages (the exact turn sent and the
   exact JSON answered, so the API's prompt cache hits on follow-ups).
3. The request: the rules, then the site help and the hub's content (on the dashboard, every live hub's, in a fixed
   order) with a 1-hour cache mark; then the earlier turns; then this turn: `<page>` (hub, voice, today in Central time,
   view, lecture, paragraph), `<answered_question>`, `<progress>`, `<student>` (escaped: what a student types is data).
   Model `claude-opus-5-5`, effort `medium`, structured output (the schema in `core.js`), the refusal fallback on.
4. The answer is checked: every cite's quote must really be in the unit it names (a real quote under the wrong id is
   moved to the right unit). Only checked cites become links; the rest are stored as `unchecked` for the admin tab.
5. `timmy_finish` stores the answer with its tokens and estimated cost, and the browser gets:
   `{ ok, chat, message, kind, paragraphs: [{ text, cites: [{ id, hub, kind, label, quote, go }] }], offer, go, closest }`,
   plus `limited` (`limit`, `cap`, `off`, `busy`) on a "napping" line and `repeat` on a retried send. `message` is Timmy's
   message id (for thumbs, offers and Report). A nap that never reached the database has no `message`.

**Kinds:** `answer`, `not_covered` (with `closest`: `{ hub, lec, label, title }`), `quiz_declined`, `hint_declined`,
`off_topic`, `support`; and from the function itself `error`, `refusal`, `paused`, `hub`, `limit`, `cap`, `off`, `busy`.

**Where a link goes** (`go`; the page's `SH_GOTO` opens it, part 2): notes `{ v: "notes", lec, k }` (a notes table links to
the paragraph before it), review `{ v: "review", lec, t }`, cram `{ v: "cram", lec }`, Exam Hints and High likelihood
`{ v: "hints", lec }`, exam facts and course dates `{ v: "home" }`, site help `{ v: "about", id: <About section> }`, the
answered question `{ v: "bank", q }`; "go" buttons: `{ v: "notes", hub, lec, k }`, `{ v: "practice", hub, lec }`,
`{ v: "drill", hub }`. On the dashboard every link carries its `hub`.

**Unit ids** (what the model cites): `N<l>.<k>` a notes paragraph (`k` counted exactly as `exportSections` in
`widget/hub.js` counts it: `p, li, h3, h4` in the parsed as-taught HTML), `N<l>t<n>` a notes table, `R<g>.<s>` a review
table section, `C<l>.<j>` a cram line, `H<i>` an Exam Hint, `K<i>` a High likelihood topic, `X<i>` an exam fact, `S<i>`
site help, `Q` the answered question; lectures are `L<n>` in `core.json` order. On the dashboard every id but `S` starts
with `<hub>:`.

## Limits and money

- 40 questions a person a Central day (answers that failed don't count), one at a time, 1,000 characters each.
- A site-wide daily estimate: each question holds $0.08 against the day's cap ($10) while it's answered, then its
  estimated cost from the usage the API reports. Visitor ids are easy to reset, so this cap and **the Console's spending
  limit** (Sam sets it at the credit) are the real backstop.
- `admin_timmy_config(secret, enabled, day_cap_usd, per_visitor_day)` turns him off or changes the limits at once.
- Cost per question (Opus 5.5 list prices on 2026-11-12: $4 in, $20 out, cache reads $0.20 a million, 1-hour cache writes 2x):
  about 3-6 cents with the content cached (70-84k tokens a hub, about 230k on the dashboard); the first question on a hub
  in an hour also writes the cache, about $0.60 (about $1.80 on the dashboard).

## The database (migration_v55)

- Tables: RLS on, no policies, closed to `anon` and `authenticated`; the function writes with the service role. Who may
  read what: [learner-data-privacy](../rules/learner-data-privacy.md); the rows: [event-taxonomy](event-taxonomy.md);
  how long: [analytics-retention](analytics-retention.md).
- **The students' calls** (the browser, with its own visitor id): `get_timmy_history(visitor, hub, limit)` (its own chats
  on that hub, no prompt, context or cost), `timmy_thumb(visitor, message, 1 | -1 | 0)`, `timmy_offer(visitor, message,
  'sent' | 'posted' | 'dismissed')` (what the student did with a drafted report or idea; the report itself goes through the
  hub's usual Report form and the idea through `post_idea`), and `timmy_report(visitor, hub, message, note, section)`.
- **The Report button** (Sam, 2026-11-12: "so if timmy gives an error or bad answer or something, you can report it and
  we can fix what went wrong"): `timmy_report` writes a usual `question_flags` row, so it is in the admin page's Inbox and
  Sam's reply reaches the sender as any reply does. The note ends `— Timmy's answer <id> · <section>`, the answer is
  marked (`report_id`), and the Timmy tab opens the whole chat from it. With `message` null (he was napping or wouldn't
  answer), `hub` says where. One report an answer (again returns the first), ten Timmy reports a person a day.
- **The admin page's calls** (behind the admin secret, part 3 draws them): `admin_timmy_days` (by day and hub: people,
  questions, answers, cost, not covered, declined, errors, thumbs, quotes, offers, reported), `admin_timmy_chats`,
  `admin_timmy_chat`, `admin_timmy_not_covered` (gaps in the content), `admin_timmy_unchecked`, `admin_timmy_reported`,
  `admin_timmy_config`. None returns a visitor id.

## The eval (`tools/timmy/eval.mjs`)

Each case says what a good answer is: the kind, the lecture its links land in, the offer, words it must or mustn't say.
Every answer is also checked for what no answer may do: an error, a quote that isn't in the paragraph it cites, markdown,
a line of his rules, an About page spoiler. Warnings (over 170 words, a British spelling, a missing "closest") are for a
person to read. The full report (every question and answer) is written as markdown beside the run's summary.

- `node tools/timmy/eval.mjs --dry`: free; checks the test set (every "covered" case's terms are in its lecture, every
  "not covered" case's terms are in no hub content) and the grading. CI and `tools/release/run.js` run it.
- The real run costs about $10-12 for all 134 cases (`--only <hub or case ids>` for fewer, `--max-usd` to stop early).
  **Ask Sam before running it.** It needs the SDK (`npm i --prefix <dir> @anthropic-ai/sdk@1.3.0`, then
  `TIMMY_SDK_DIR=<dir>`) and a key in `TIMMY_EVAL_KEY`. In a Claude Code cloud session Sam adds it as an environment
  variable in the environment's settings (the session's credential form can't hold a key for `api.anthropic.com`: the
  session reaches Anthropic's API without the proxy). Not `ANTHROPIC_API_KEY`, which Claude Code itself reads. Never
  pasted in a chat or written in a file; a key made for the eval, deleted after, is safest.
- Rerun it after changing `RULES`, the schema, the effort level or the model, and before the release.

## At the release (the release note's Ask Timmy box)

1. Sam saves `ANTHROPIC_API_KEY` in the Supabase dashboard (Edge Functions, Secrets) and sets the Console's spending limit.
2. Apply `migration_v55.sql` with `migration_v54.sql`, append both to `supabase/schema.sql`, take their lines out of
   `supabase/pending-migrations.txt` (same PR).
3. Deploy the function with JWT verification off (the Supabase connector's `deploy_edge_function`: `index.ts`, `core.js`,
   `site.json`), and set `TIMMY_CONTENT_BASE` to the released content address
   (`https://smcmurry6-source.github.io/study-hubs/hubs/{hub}/content/` or wherever the switch PR puts it).
4. One question from the live site on a phone; `admin_timmy_days` shows it with its cost.

## Notes for the chat (part 2) and the admin tab (part 3)

- Enable "Ask Timmy" on a card only after the answer is recorded (`personal_answers` has the row), or the function
  won't see it as answered and he'll decline it like an unanswered practice question.
- `limited: "busy"` means the last question is still being answered: keep the box disabled until it comes back.
- A nap or an error can still be reported (`timmy_report` with `message` null).
- Unit ids, kinds and `go` shapes are fixed by `core.js`; `site` links (`{ v: "about", id }`) open the About page at that
  section; `{ v: "home" }` opens the hub's Home.
- Text the student typed and Timmy's answers are untrusted text: draw them with `textContent`, never as markup.

Related: [the task](../tasks/2026-11-12-redesign-ask-timmy.md) · [the release](../tasks/2026-11-06-redesign-release.md) ·
[game-server](game-server.md) · [event-taxonomy](event-taxonomy.md) · [analytics-retention](analytics-retention.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md) · [secrets](../rules/secrets.md)
