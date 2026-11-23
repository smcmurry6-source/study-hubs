---
type: reference
tags: [timmy, ask-timmy, supabase, edge-function, claude-api, redesign, privacy]
---

# Ask Timmy: the server (the `timmy` Edge Function and migration_v55) and the chat

How Ask Timmy answers a student: the Supabase Edge Function `timmy`, its database half (`migration_v55.sql`), the tests
and the eval, and the chat in the new pages (`widget/ask.js`, "The chat" below). Built 2026-11-12 as parts 1 and 2 of [the task](../tasks/done/2026-11-12-redesign-ask-timmy.md) (Sam's calls are
there and in [decisions](../decisions.md)); **deployed and applied at [the redesign's release](../tasks/done/2026-11-06-redesign-release.md)**.

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
   - `context`: `{ view: SH_SECTION(), lec, k, course }` (a view with `mock` in it gets "paused" without calling anything;
     `course`, on a hub of courses away from the notes: the course the student is in, from `askCourse()` in
     `widget/hub-timmy.js`, "Limits and money" below);
   - `ask` (Ask Timmy on a question card, after answering): `{ qid, right, picks }`, picks in **authored** order. The
     question's stem, key and whys are read from the hub's own `questions.json`, and only if the database has this
     visitor's answer to it (`personal_answers`), so the browser can't fish for a key. `w` is the version on screen
     (`variants.json`), and `o` (since 2026-11-18) a statement item's order on screen, "3142" for shown statements 3, 1, 4,
     2 (`widget/statements.js`): `inOrder()` renumbers the stem, choices, whys and explanation the same way, so Timmy calls a
     statement by the student's number (`tools/ci/statements.js` checks it matches the page's on every item);
   - `progress` ("What should I study tonight?"): `{ lectures: [{ hub, lec, questions, answered, right, missed,
     notes_done }], answered_today, drill_today }`, worked out in the browser from the student's own answers (on the
     dashboard, the device's merged with the server's: "The chat in the new pages" below).
2. `timmy_begin` checks the limits, stores the question and returns the last 10 messages (the exact turn sent and the
   exact JSON answered, so the API's prompt cache hits on follow-ups).
3. The request: the rules, then the hub's content (on the dashboard, every live hub's, in a fixed order), then the site
   help (or, on the first question after an idle hour, the rules, the site help, then a part of the content; on a hub of
   courses, every question, with one course's part: "Limits and money" below), the content and the site help each with a 1-hour cache mark (the site help last since 2026-11-18, so an About
   page change rewrites only its ~40k tokens, not the hub's 130-160k: "Limits and money" below); then the earlier turns; then this turn: `<page>` (hub, voice, today in Central time,
   view, lecture, paragraph), `<answered_question>` (its choices without letters, the student's pick by its words: the card
   shuffles the choices and shows no letters), `<progress>`, `<student>` (escaped: what a student types is data).
   Model `claude-haiku-5-5` (Sam, 2026-11-20: "we can switch timmy to run on haiku", when the Review of Systems hub's
   content came in at about 180k tokens; `claude-sonnet-5-5` from 2026-11-14, built and first tested on `claude-opus-5-5`),
   effort `medium`, structured output (the schema in `core.js`). Haiku has no server-side refusal fallback, so `withModel()`
   sends none and a declined question gets the refusal nap; on another model the fallback is on.
4. The answer is checked: every cite's quote must really be in the unit it names, at least three words or the whole of a
   shorter unit such as an exam date (a real quote under the wrong id is moved to the right unit). Only checked cites become links; the rest are stored as `unchecked` for the admin tab.
5. `timmy_finish` stores the answer with its tokens and estimated cost, and the browser gets:
   `{ ok, chat, message, kind, paragraphs: [{ text, cites: [{ id, hub, kind, label, quote, go }] }], offer, go, closest }`,
   plus `limited` (`limit`, `cap`, `off`, `busy`) on a "napping" line and `repeat` on a retried send. `message` is Timmy's
   message id (for thumbs, offers and Report). A nap that never reached the database has no `message`.

6. **A gap in the notes is looked up** (from 2026-11-17, "Not in your notes" below): when the answer is `not_covered`, a
   second call searches trusted sites and the reply also carries `gap: { text, sources: [{ url, title, site }] }`.

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

## "Not in your notes": a gap, looked up (from 2026-11-17)

Sam, 2026-11-17: "the outside source would only be used when there was something about the content that ask timmy doesnt
have an answer for. For example, someone asked what an exostoses was and timmy couldnt answer. i dont want people to use it
for everything, just to fill in the gaps", then "we can do web search, the sites and others like them are good to go on the
list, no limit on gap answers. they are uncommon" ([decisions](../decisions.md)).

- **When:** only when the answer from the notes is `not_covered` (not a partial answer, a declined question or off-topic).
  The notes still come first: Timmy's own rules (`RULES`) are unchanged, so anything the content covers is answered from it.
- **The call** (`gapRequest` in `core.js`): the same model (`MODEL`) at effort `low`, its own short rules (`GAP_RULES`), the API's **basic**
  web search tool (`web_search_20250305`, two searches at most) and plain text, because a search's citations don't mix with
  structured output. The newer tool (`web_search_20260209`) was tried first: its filtering step runs code, which dropped the
  citations and let the model's working notes into the answer. Sent: the question, the last four messages as text, the
  closest lecture and the hub's title. No visitor id, no notes, no progress.
- **The sites** (`GAP_SITES`, each with the name the chat shows): NIH (StatPearls, PubMed, PMC, DailyMed), MedlinePlus, CDC,
  FDA, the National Cancer Institute, WHO, the Merck and MSD Manuals, the ADA, AAP, AAE, AAPD, AAOMS, AAOMP, AAO, Radiopaedia,
  Cleveland Clinic and Mayo Clinic. Sam OK'd "the sites and others like them": add one by adding its row. **The tool's
  `allowed_domains` didn't filter the results** when tried on 2026-11-17 (with two sites listed, preprints and patents still
  came back), so `gapCheck` keeps the answer only when every source it cites is on the list (`gapSite`: https, the domain or
  a subdomain of it), the model searched, and it didn't write `NONE` (its answer when the sites don't have it, or the
  question isn't one for them: the site, the course, an exam, a graded question, a practice question's choice).
  Otherwise the student gets the "not covered" answer alone.
- **What the student sees** (`widget/ask.js`): under the answer, a dashed box, "Not in your notes · looked up", with the
  few sentences and each source (its site in bold, its title) as a link that opens in a new tab (`ask:gap=source`). The
  note at the top of the chat says the notes come first and gaps are looked up on trusted sites. The admin page's chat view
  shows the box with its links, and the "Not covered" list still counts the question (it's still a gap in the notes).
- **Stored:** the reply's `gap` in `timmy_messages.reply`; the message's text gets "Not in your notes (looked up): ..." and
  the source links, so a later lookup in the same chat sees it; the tokens and cost are both calls' together.
- **Cost and time:** on 2026-11-17's trial (8 questions, the gap call alone) a lookup cost 4 to 5 cents (about 14,000
  tokens of search results read, one search at a cent) and took 2 to 6 seconds; a question it turned away cost under a
  cent. "Not covered" was a few of the first 125 answers, so this adds cents a week. No limit of its own (Sam: "no limit on
  gap answers"); the day's cap and the Console's limit still hold. The chat waits up to 75 s for an answer (was 45).
- **Off switch:** the function's secret `TIMMY_LOOKUP=off` (Supabase, Edge Functions, Secrets) turns lookups off without a
  deploy; gaps are then answered from the notes alone.
- **Tests:** `tools/timmy/test.mjs` (the second call's shape, what it's sent, the checks, costs, the off switch),
  `tools/timmy/eval.mjs` (a looked-up answer only on `not_covered`, every source on the list, plain text; its words in the
  report).

## Limits and money

- 40 questions a person a Central day (answers that failed don't count), one at a time, 1,000 characters each.
- A site-wide daily estimate: each question holds $0.08 against the day's cap ($10) while it's answered, then its
  estimated cost from the usage the API reports. Visitor ids are easy to reset, so this cap and **the Console's spending
  limit** (Sam sets it at the credit) are the real backstop.
- `admin_timmy_config(secret, enabled, day_cap_usd, per_visitor_day)` turns him off or changes the limits at once.
- **On Haiku 5.5** (since 2026-11-20; list prices: $0.10 in and $0.50 out a million up to a 100K-token prompt, $0.50 and
  $2.50 past it, which every hub's content is; cache reads 0.1x, 1-hour cache writes 2x): writing a hub's content to the
  cache is about $0.15 ($0.25 for Review of Systems), and a cached question under a cent. The Sonnet figures below are from
  before the switch.
- Cost per question (Sonnet 5.5 list prices on 2026-11-14: $2 in, $10 out, cache reads $0.10 a million, 1-hour cache
  writes 2x; measured on the eval that day): about 2 cents with the content cached (about 5 cents on the dashboard). A hub's
  content is 130-165k tokens (about 420k on the dashboard), cached for an hour that every question starts again, so the
  first question on a hub after an idle hour also writes the cache: about $0.60 ($1.70 on the dashboard). Opus 5.5, as
  first built, cost about twice all of that (measured on 2026-11-12: about $1.10 a hub's cache, 4 cents a question).
- **Writing the cache is most of the bill.** From 2026-11-14 to 11-18, about $33 in all: $13.50 was the After merge
  workflow's check (below), and of the students' $20, about $14 was writing a hub's content to the cache, mostly the
  first question after an idle hour. Two things made it worse, both fixed on 2026-11-18: the After merge workflow asked a
  real question (about $0.60) after **every** deploy, and a deploy follows nearly every About page change (19 of 23 that
  week changed only `site.json`), each on the first live hub (Heme & Endo Exam 3, where no student had asked Timmy
  anything, so every one of its 21 cache writes expired unread; the admin page showed them as the most asked question);
  and the site help came first in the cached prompt, so each of those deploys sent every hub's whole content to the cache
  again. Reusing answers wouldn't help: students almost never ask the same thing (a handful of repeats in their first 148
  questions, all "why is it ..." on a question card, whose answer depends on what they picked).
- **A hub of courses reads one course first** (Review of Systems; Sam, 2026-11-22: "Let's do your recommendation to have
  Timmy only read the course the student is in", after "I dont want to sacrifice the quality of the material just so we can
  have ask timmy": its content passed 200k tokens as the professors' slides and recordings came in, about 245k by the
  function's count). On a hub whose `core.json` has `groups`, `handle()` skips `timmy_cache` and sends every question a
  part: `COURSE_NOTE`, the exam facts, and the notes, review tables, cram sheet, high-yield points and High yield topics of
  **one course** (`part(lecs, { scoped: true })`): the answered question's course, else the course of the lecture on screen,
  else the course the page names (`context.course`: in the Question Bank, the course picked when it is one, otherwise the
  course of the notes last opened). With no course known it gets `CRAM_NOTE`, the exam facts and every course's cram sheet.
  Each is cached for an hour, one entry per course. If the answer is "not_covered" (or doesn't parse), the function asks
  again with the whole content, as the idle-hour part does; that is the net for a question on another course. The edge
  log's `turn` line says `content` `course` or `course+full` and `course` (the course's id, or `none`). Everything in the
  part is the course's own because Haiku 5.5's price goes up fivefold on a prompt over 100k tokens (input $0.50 and output
  $2.50 a million, against $0.10 and $0.50): with the rules and the site help (about 26k), one course's prompt is about
  36-87k tokens (Fundamentals I the biggest; every course's cram sheet, about 30k, was in each until the same day, when
  Fundamentals I passed 95k with it), and `tools/timmy/test.mjs` fails a course's prompt, or the no-course one, that
  reaches 95,000 by the function's count, or whole content past 400,000 (200,000 for a hub without courses). On the
  dashboard the hub is read as before. The eval's
  `rs-` cases are this mode (`rs-03` asks about another course, `rs-07` about nothing in the hub).
- **The first question after an idle hour gets a part of the content** (Sam, 2026-11-19: yes, with the eval;
  [decisions](../decisions.md)). Before the model, the function asks `timmy_cache(key)` (`migration_v85.sql`; the key is the
  hub, or `dashboard`, and a hash of the model, the rules and the content, `cacheKey()` in `core.js`) when the whole content
  was last read. Read within 55 minutes (`WARM_MS`): the whole content, as before. Otherwise **a part** (`buildCorpus().part()`):
  `PART_NOTE` (what's left out, and to answer "not_covered" when the answer needs it), the exam facts, the cram sheet, Exam
  Hints and High likelihood topics, and the notes and review tables of the lecture on screen (`context.lec`) or of the
  answered question; every other lecture is one line with its title and `notes="not sent"`. On the dashboard, no lecture's
  notes. The system prompt is then the rules, the site help (1-hour cache, the same for every hub, so it stays warm), then the
  part (a 5-minute cache: a follow-up reads it, and a write is 1.25x, not 2x). Unit ids are the full content's, so cites check
  the same way. If the part's answer is "not_covered" (or doesn't parse), the function asks again with the whole content
  (both calls' tokens and cost are stored) and marks it (`timmy_cache(key, true)`, at most every 5 minutes), so the rest of
  the hour reads it whole. Declined, off topic, support and refusals from the part aren't asked again. Without the call (not
  applied, or an error) it sends the whole content, as before. The edge log's `turn` line says which: `content` is `part`,
  `part+full` or `full`. The part is a quarter to a third of the content (Perio's about 25k of about 99k tokens, by the
  function's 3.6 characters a token; Heme & Endo Exam 3's about 30k of 113k). The eval in this mode, `--part` (2026-11-19,
  $5.28 for all 50 cases, inflated by three cases writing the whole content at once): 49 passed; 34 turns answered from the
  part, 16 asked again (the six "not covered" cases among them, as they should); a part answer about 1-3 cents, a part written
  about 7-10 cents, the whole content written about $0.68 on Perio and $1.44 on the dashboard.

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
- **The admin page's calls** (behind the admin secret; the Ask Timmy tab draws them, below): `admin_timmy_days` (by day and hub: people,
  questions, answers, cost, not covered, declined, errors, thumbs, quotes, offers, reported), `admin_timmy_chats`,
  `admin_timmy_chat`, `admin_timmy_not_covered` (gaps in the content), `admin_timmy_unchecked`, `admin_timmy_reported`,
  `admin_timmy_config`. None returns a visitor id.

## The eval (`tools/timmy/eval.mjs`)

Each case says what a good answer is: the kind, the lecture its links land in, the offer, words it must or mustn't say.
Every answer is also checked for what no answer may do: an error, a quote that isn't in the paragraph it cites, markdown,
a line of his rules (12 words in a row), an About page spoiler, words in quotation marks that aren't in the content (unless
he says they're his own mnemonic or analogy), an answer choice named by a letter (the card shuffles the choices and shows
no letters, so he names a choice by its words). Warnings (over 170 words, a British spelling, a missing "closest") are for a
person to read. The full report (every question and answer) is written as markdown beside the run's summary.

- `--part`: every question as the first after an idle hour (a part of the content first, the whole content only when the
  part doesn't have it); the summary counts each. Run it after changing `PART_NOTE` or `part()`.
- `node tools/timmy/eval.mjs --dry`: free; checks the test set (every "covered" case's terms are in its lecture, every
  "not covered" case's terms are in no hub content) and the grading. CI and `tools/release/run.js` run it.
- The real run cost $11.71 for all 134 cases on 2026-11-12 (`--only <hub or case ids>` for fewer, `--max-usd` to stop
  early). The first case on each hub writes that hub's content to the API's cache, about $1 a hub and about $3.30 on the
  dashboard (every hub's content); the rest read it for about 5 cents a case. So a few cases on one hub cost about $1.25,
  and a change to `RULES` or the content makes the next run write the cache again.
  **Ask Sam before running it.** It needs the SDK (`npm i --prefix <dir> @anthropic-ai/sdk@1.3.0`, then
  `TIMMY_SDK_DIR=<dir>`) and a key in `TIMMY_EVAL_KEY`. In a Claude Code cloud session Sam adds it as an environment
  variable in the environment's settings (the session's credential form can't hold a key for `api.anthropic.com`: the
  session reaches Anthropic's API without the proxy). Not `ANTHROPIC_API_KEY`, which Claude Code itself reads. Never
  pasted in a chat or written in a file; a key made for the eval, deleted after, is safest. Make it inside a workspace,
  or also set `TIMMY_EVAL_WORKSPACE` to the workspace's id. A variable added to the environment reaches only sessions
  started after it, so a session that started before runs the eval in a fresh session on its branch.
- `--model <id>`: the same cases on another model (`withModel()` in `core.js` leaves the fallback out for Haiku, which has
  none). On 2026-11-14 Sonnet 5.5 cost $6.30 for the whole set and Haiku 5.5 $2.07 ([the task](../tasks/done/2026-11-12-redesign-ask-timmy.md)'s Log).
- `--regrade <report.json>`: free; grades a saved run again with this checkout's grader and quote check, for a change to
  the grading or to `quoteIn`.
- Rerun it after changing `RULES`, the schema, the effort level or the model. Not before the release unless one of those
  changed (Sam, 2026-11-12: "dont bother with the rerun before release").

## At the release (the release note's Ask Timmy box)

The steps as they were done at the redesign's release ([the release](../tasks/done/2026-11-06-redesign-release.md)); they are
also how to set Ask Timmy up again on a new project.

1. Sam saves `ANTHROPIC_API_KEY` in the Supabase dashboard (Edge Functions, Secrets) and sets the Console's spending limit (skipped for now, [decisions](../decisions.md)).
   **The key saved on 2026-11-14 is named `TIMMY_EVAL_KEY`** (found at the release, BUG-150), so `index.ts` reads that
   name when there is no `ANTHROPIC_API_KEY`; a secret with the right name, once saved, is the one used. The fallback
   stays: there is no need to save the key again under the other name (Sam, 2026-11-18).
   **Make the key inside a workspace** (the Console's workspace, then API keys). A key made outside one is refused
   ("This API key is not scoped to a workspace", found on 2026-11-12's first eval run) unless the workspace's id is also
   saved, as `ANTHROPIC_WORKSPACE_ID`.
2. Apply `migration_v55.sql` after `migration_v54.sql` (both are in `supabase/schema.sql`).
3. Deploy the function with JWT verification off: **`node tools/timmy/deploy.mjs`** (it sends `index.ts`, `core.js` and
   `site.json` as they are through Supabase's management API, with the access token in the session's environment, and
   prints the version; the Supabase connector's `deploy_edge_function` does the same if the three files are pasted into
   it). `TIMMY_CONTENT_BASE` needs no setting: its default is the released content address
   (`https://smcmurry6-source.github.io/study-hubs/hubs/{hub}/content/`). **After a merge that changes
   `supabase/functions/timmy/`** (`site.json` changes whenever the About page does), the After merge workflow deploys it
   again by itself ([after-a-merge](../how-to/after-a-merge.md), since 2026-11-15; its chat's visitor id is
   `after-merge-<commit>`). Since 2026-11-18 it does step 4 only when the function's code changed (`core.js`,
   `index.ts`), on the live hub whose exam is soonest, where the cache it writes is read by the next students' questions;
   when only `site.json` changed it sends a question from a mock exam, which the new version answers "paused" without the
   database, the content or the model: free, and nothing is stored. A deploy can't change the key, so that is enough.
4. **One real question after every deploy.** The tests use a fake model and a preview answers with made-up replies, so a
   missing or refused key shows only here (at the release every answer was "I nodded off" until step 1's name was
   found). From the live site on a phone; the admin page's Ask Timmy tab shows it, with its cost, and opens its chat.
   An agent sends one POST to the function with the site's origin and a made-up visitor id of its own (the body is in
   "One question, start to finish" above; `kind` should be `answer`), reads the function's log if it isn't, and tells
   Sam the chat is its own.

## The chat in the new pages (`widget/ask.js` + `ask.css`, part 2)

Loaded only by the redesign's pages, so nothing reaches the class before the release: a new hub (`widget/hub-timmy.js`
loads it once the shared widget is up and mounts it with the hub's options) and the new dashboard (`widget/dash.js`, a
late script, mounted in `startClassData` before Timmy). Its header comment lists `shAsk.mount()`'s options. `ask.css` loads only when something
of the chat is drawn (the Ask icon or button, or the chat itself): a page where Timmy is shown and nobody asks doesn't
download it, which keeps the new dashboard inside its request budget (`tools/release/budgets.json`).

- **Where it opens.** Timmy's "Ask me": a button in his speech bubble when he's tapped and in the dashboard house's menu
  (`widget/pet.js` adds them only when `window.shAsk` exists, so the live hubs' Timmy is unchanged). When he isn't on the
  page (turned off, Dashboard only, Focus mode; everyone has Timmy since part 4), an Ask icon takes his spot: `.ska-fab` in a hub's
  bottom-left corner (above the tab bar on a phone), `#askSpot` in the dashboard's "you" card. A 6-second grace after load
  keeps the icon from flashing before Timmy arrives. "Ask Timmy" (or "Ask the hub") on an answered question card
  (`widget/hub-bank.js`, `[data-ask-q]`) opens it with that question attached and "Why is it “…”?" in the box.
- **The voice** follows what's on the page: Timmy's (`voice: "timmy"`) when he's shown (`html.sh-pet-on` on a hub, the
  house on the dashboard), the plain "Ask the hub" voice otherwise. Same rules either way.
- **What it sends**: the body in "One question, start to finish" above. `context` is the view, and on the notes the
  lecture and the first paragraph on screen (`k`, the engine's own count of `p, li, h3, h4` in `.reading-prose`) when
  the level is As taught. `ask` waits for the answer to be recorded (`sh:answer-paid`, up to 2.5 s) so the server sees it
  answered. `progress` goes only with "What should I study tonight?" (the starter or a question like it), worked out in the
  browser from the hub's `core.json` and the student's own saved state (`shAsk.progressFrom`); on the dashboard, for each
  live hub with a new version, the device's saved state merged with the student's own answers from the server
  (`get_my_answers`, every linked device's; `serverSeen` and `withServer`, a question keeping whichever copy has more tries,
  as `SH_SYNC.merge` does on a hub page), so a new or linked device sees them without opening a hub first. The call is
  skipped in a quiet spell (`shDb.busy()`) and given 4 seconds; without it, the device's copy alone (2026-11-19). The "chat" id continues the newest chat under 6 hours old; "New chat" starts another.
- **What it draws**: every word with `textContent`. Each checked quote is a "From the notes" button (the hub's name in
  front on the dashboard), a `go` is a button ("Practice L8", "Open the notes"), `not_covered` gets "Closest:", a nap
  gets "Open the notes". Thumbs (`timmy_thumb`), Report (`timmy_report`, its note box; on a nap or an error too, with
  `message` null), and offers as draft cards: a report goes into `question_flags` like any report (the question's id and
  "drafted by Timmy" at the end of its note), an idea through `shIdeas.post` with source `board` (the pending `post_idea` takes only `board`, `suggest` and
  `checkin` and isn't changed: Sam, 2026-11-12, [decisions](../decisions.md)), asking for a leaderboard
  name first when there's none; "No thanks" and each send call `timmy_offer`. A failed request (45 seconds, offline, an
  error) says so in his voice with "Try again", which resends the same request id.
- **Links**: on a hub, through the engine (`SH_GOTO`; practice on a lecture filters the bank to it; the drill opens
  `#questions/drill`), closing the sheet on a phone. On the dashboard, a link to a hub is saved in `sessionStorage`
  (`sh_ask_goto`) and the hub's page opens it once its sections have loaded. `about` opens the About page at that section.
- **Paused** during a mock (`html.sh-mock-on` or a `/mock` view): the box is replaced by a line saying why, and the Ask
  icon hides. **Not on an archived hub** (the same check as the engine's).
- **Every button** has a fixed `data-ska` value (click counts never pick up anyone's words); events are `ask:*`
  ([event-taxonomy](event-taxonomy.md)).
- **Previews** never call the function: `tools/preview/runtime/preview.js` answers it with canned replies built from the
  hub's own notes (each ends "(This is the preview's canned answer...)"), and keeps the chats, thumbs, offers and reports
  in its fixture database. Words that steer it: "quiz" or "Canvas" (declined), "broken" or "report" (a report draft),
  "idea" or "would be cool" (an idea draft), "tonight" (a plan from the progress sent), "dragon" or "weather" (not
  covered), "nap" (today's limit reached). The preview panel's "class data" switch reaches it too: slow answers in
  4 seconds instead of 1.2, unreachable shows the chat's "can't reach" line with Try again.
- **The smoke test** (`tools/ci/smoke.js`, `askCheck`) stubs the function and checks, on every new hub (phone and laptop)
  and the new dashboard: Timmy is there and the Ask icon or button isn't, then with Timmy turned off it shows, the chat says chats are saved, the
  request carries what the function reads, an answer's markup is drawn as text, Report and a drafted report work, every
  button has its `data-ska`, a "From the notes" link opens `#notes/<lecture>`, Ask Timmy on an answered card sends its id,
  and the icon hides during the mock.
- `widget/ask.js` and `ask.css` are in the bundles, so `sw.js` precaches them with the rest, and the function's
  `TIMMY_CONTENT_BASE` defaults to the released content (above).

## Everyone has Timmy (`widget/pet.js`, part 4)

Built 2026-11-13 ([the task](../tasks/done/2026-11-12-redesign-ask-timmy.md), "Build spec, part 4"). Sam, 2026-11-12:
"adopting timmy is no longer an option. once the redesign launches, everyone has timmy", and "if someone doesnt have a
costume applied, they are naked. What you put wins." **Since the release it is the only behavior, on every page**: the
adoption, the introduction, "Tap me!", the dashboard's perch and his holiday outfits came out of `pet.js`.

- **No switch**: `widget/v3.js` loads pet.js on every hub page and `widget/dash.js` on the dashboard. An old
  single-file hub's page has no shop in its bootstrap, so there he wears the outfit kept on the device
  (`sh_pet_outfit`), or nothing.
- **No adoption**: a first visit sets `sh_pet_born` to today (Central) and sends the `pet-adopt`
  badge (`record_achievement`) as the introduction did; with two linked devices that each met him on their own, the
  earliest badge's day wins (`syncBadges`). No introduction, no "Tap me!", no "No thanks"; one
  hello in his bubble on the first visit instead ("Hi, I'm Timmy Tooth! ..."), with "Ask me" when the chat is there.
- **100 HP to start**: `simulate()` starts at 100, not 70, when `sh_pet_born` is on or after `FULL_FROM`, the day the
  redesign went live (set in the release's last commit). A Timmy adopted before keeps his history. In a preview,
  `tools/preview/transform.js` rewrites that line to read `window.SH_PREVIEW_TIMMY_FROM`, which the preview's runtime
  sets to the day the test account started (so `new` meets him at 100 and the other accounts keep theirs); the smoke test
  serves pet.js with it set to today. **Pearly Whites** (the 100 HP trophy): a Timmy who starts at 100 earns it by getting
  back to 100 after a day has ended with him under it (`dipped` in `simulate()`), so it isn't given on the first day.
- **What he wears**: only the shop's outfit in his `outfit` slot (`shop.equipped.outfit` in the v2 bootstrap, which
  `load()` reads), never a holiday's, and nothing when nothing is on. `art()` with no `hat` and no `fit` draws him bare
  and puts the outfit on exactly as the kit's `dress()` does (`dressLayer`), so his bar, the dashboard's card, the
  chat's avatar and the checkup all wear it; callers that pass `hat: ""` (the place, the shop, the classroom) dress him
  themselves. `fit()` returns the outfit's id ("" for none) for the hubs' studying-now presence, so the classroom draws
  him as he is; a change fires `sh:pet-fit`, and `widget/v3.js` sends the presence again.
- **No request for it at page load**: the outfit's drawing is kept on the device, `sh_pet_outfit` = `{ id, back, face,
  top, say }` (`say`: its lines, when the place handed them over). When the server's id isn't the kept one (another
  device changed it, or this is a new device), `widget/hub-art/outfits.js` is fetched after the first scroll, wheel, tap
  or key (never with the page: the request budgets), and with it, for a costume or a set's outfit, the file `where` names
  (`widget/hub-art/outfits/costumes.js`, `seasons.js` or `collections.js`, since 2026-11-18), and until then he wears nothing rather than the wrong thing. The
  shop's outfits and the place's kit are used first when they're on the page, so a piece redrawn later reaches the kept
  copy.
- **Changing it**: `shPet.setOutfit(id, parts)` puts it on at once. `widget/place.js` calls it whenever its outfit slot
  changes (`barFollow()`: after the customizer's equip, the server's answer, or a refusal put back), with the kit's
  drawing and lines, so no file is fetched. The place itself (`timmySvg`) always draws him bare under the outfit.
- **What he says**: his outfit lines are the worn outfit's own (when kept), and with nothing on he
  doesn't ask "Do you like my costume?" on Halloween. Holiday jokes and hellos stay.
- **The tests**: `tools/ci/smoke.js` ("everyone has Timmy"), on a phone and a laptop: a first visit on a new hub (on the
  bar, no introduction or "Tap me!", 100 HP, today's birthday, one badge, `fit()` the bootstrap's id, no outfits.js
  with the page, the outfit after the first key, kept; the next visit wears it with no request; nothing on at Halloween
  is nothing; the customizer dresses the bar without a reload; More has the place and the shop), the same first visit on
  the dashboard, and an old single-file hub (on the bar for a first-time visitor, no introduction, nothing on at
  Halloween, no outfits.js fetched).

## The admin page's Ask Timmy tab (`review/index.html`, part 3)

Built 2026-11-12. A tab like the others (`#timmy`, under Feedback; `VIEWS.timmy`, its six loaders in `SRC`, `renderTimmy`),
with the 7, 30 or 90 days range. Its code and notes are under "Ask Timmy" in the page's script.

- **What it shows**, all from migration_v55's admin calls behind the admin secret (none returns a visitor id): figures for
  the range (questions, estimated cost, the share not covered, declined, thumbs, quotes that checked, reports and how many
  of his drafts were sent), **By hub** (the busiest day's people, since people can't be added up across days), the
  **Settings** card, **By day** (one row a Central day, 14 shown), then four lists, each row opening its whole chat in place
  (`admin_timmy_chat`, with the answer in question outlined): **Reported answers** (`admin_timmy_reported`, open or
  resolved, "Reply in the Inbox"), **Not covered** (`admin_timmy_not_covered`, with a count of the closest lectures he
  named: leads for content), **Quotes that didn't check out** (`admin_timmy_unchecked`) and **Chats**
  (`admin_timmy_chats`, the newest 200). A row of hub chips narrows every card to one hub.
- **A chat** shows both sides: what the student typed and where they were (only the context's view, lecture, paragraph,
  the question for Ask Timmy, whether progress was sent, the dashboard's hubs, the plain voice: never the whole context),
  then each answer with its kind, checked quotes, quotes that didn't check out, a drafted report or idea and what the
  student did with it, the "go" button, the closest lecture, the thumb, the report, and the model, time, tokens and cost.
- **Words are text.** Everything a student typed and everything Timmy answered (paragraphs, quotes, labels, drafts,
  report notes) goes through the page's `esc()`, so it is drawn as text and never as markup.
- **Settings**: Timmy's switch, the daily cap (0 to 100 dollars) and the questions a person a day (0 to 500), with
  today's spend against the cap. Save checks the values, then shows what will change and asks (it reaches every student
  at once); Escape or Cancel backs out; Confirm calls `admin_timmy_config` with only what changed.
- **From the Inbox**: a report from the chat's Report button (its note ends "— Timmy's answer <id>") gets "Read the chat
  with Timmy", which opens the tab with that answer's chat open. The reply is written in the Inbox, as for any report.
- On a database without migration_v55 the calls answer "Could not find the function", and the tab says Ask Timmy
  isn't set up (no error, no settings).
- **The preview** answers the six calls with made-up chats shaped as migration_v55 returns them
  (`timmyFixtures`/`timmyAdmin` in `tools/preview/runtime/preview.js`; the quotes are real lines of the new hubs' notes,
  one chat carries markup on purpose), keeps the settings in the account's fixture database, and lists the made-up
  Timmy report in the Inbox, so resolving it there shows on the tab. `{"missing": ["admin_timmy_"]}` in the preview's
  settings shows the tab as it is before the release ([preview-a-change](../how-to/preview-a-change.md)).
- **The test**: `tools/release/admin-ui.js` (the Release tests): the figures against the calls' rows, a chat opened, markup
  drawn as text, no visitor or chat id on the page, the hub chips, no answer without the secret, the settings (a bad value
  refused, asked first, Escape, saved once, off and on again), the Inbox's link, the tab before the release, axe on the
  tab with chats open, and a 390 px phone with a chat open.

Related: [the task](../tasks/done/2026-11-12-redesign-ask-timmy.md) · [the release](../tasks/done/2026-11-06-redesign-release.md) ·
[game-server](game-server.md) · [event-taxonomy](event-taxonomy.md) · [analytics-retention](analytics-retention.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md) · [secrets](../rules/secrets.md)
