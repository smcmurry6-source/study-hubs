---
type: reference
tags: [timmy, ask-timmy, supabase, edge-function, claude-api, redesign, privacy]
---

# Ask Timmy: the server (the `timmy` Edge Function and migration_v55) and the chat

How Ask Timmy answers a student: the Supabase Edge Function `timmy`, its database half (`migration_v55.sql`), the tests
and the eval, and the chat in the new pages (`widget/ask.js`, "The chat" below). Built 2026-11-12 as parts 1 and 2 of [the task](../tasks/2026-11-12-redesign-ask-timmy.md) (Sam's calls are
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
   view, lecture, paragraph), `<answered_question>` (its choices without letters, the student's pick by its words: the card
   shuffles the choices and shows no letters), `<progress>`, `<student>` (escaped: what a student types is data).
   Model `claude-opus-5-5`, effort `medium`, structured output (the schema in `core.js`), the refusal fallback on.
4. The answer is checked: every cite's quote must really be in the unit it names, at least three words or the whole of a
   shorter unit such as an exam date (a real quote under the wrong id is moved to the right unit). Only checked cites become links; the rest are stored as `unchecked` for the admin tab.
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
- `--regrade <report.json>`: free; grades a saved run again with this checkout's grader and quote check, for a change to
  the grading or to `quoteIn`.
- Rerun it after changing `RULES`, the schema, the effort level or the model. Not before the release unless one of those
  changed (Sam, 2026-11-12: "dont bother with the rerun before release").

## At the release (the release note's Ask Timmy box)

1. Sam saves `ANTHROPIC_API_KEY` in the Supabase dashboard (Edge Functions, Secrets) and sets the Console's spending limit.
   **Make the key inside a workspace** (the Console's workspace, then API keys). A key made outside one is refused
   ("This API key is not scoped to a workspace", found on 2026-11-12's first eval run) unless the workspace's id is also
   saved, as `ANTHROPIC_WORKSPACE_ID`.
2. Apply `migration_v55.sql` with `migration_v54.sql`, append both to `supabase/schema.sql`, take their lines out of
   `supabase/pending-migrations.txt` (same PR).
3. Deploy the function with JWT verification off (the Supabase connector's `deploy_edge_function`: `index.ts`, `core.js`,
   `site.json`), and set `TIMMY_CONTENT_BASE` to the released content address
   (`https://smcmurry6-source.github.io/study-hubs/hubs/{hub}/content/` or wherever the switch PR puts it).
4. One question from the live site on a phone; the admin page's Ask Timmy tab shows it, with its cost, and opens its chat.

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
  live hub with a new version. The "chat" id continues the newest chat under 6 hours old; "New chat" starts another.
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
- At the release: `sw.js` precaches the new pages' files (add `widget/ask.js` and `widget/ask.css` with the rest), and
  the function's `TIMMY_CONTENT_BASE` points at the released content (above).

## Everyone has Timmy (`widget/pet.js`, part 4)

Built 2026-11-13 ([the task](../tasks/2026-11-12-redesign-ask-timmy.md), "Build spec, part 4"). Sam, 2026-11-12:
"adopting timmy is no longer an option. once the redesign launches, everyone has timmy", and "if someone doesnt have a
costume applied, they are naked. What you put wins." Only on the redesign's pages: the live hubs and the live dashboard
pass nothing and keep every line of the old behavior.

- **The switch** is `shPet.mount({ everyone: true, outfit })`. `widget/v3.js` passes it (and loads pet.js for everyone,
  adopted or not) on a page whose tag has `data-game="v2"`, which the engine writes on every new hub; `widget/dash.js`
  passes it on the new dashboard (whose porch line, "Timmy Tooth wants to meet you", is gone).
- **No adoption**: `adopted()` is true. A first visit sets `sh_pet_born` to today (Central) and sends the `pet-adopt`
  badge (`record_achievement`) as the introduction did; with two linked devices that each met him on their own, the
  earliest badge's day wins (`syncBadges`, only with `everyone`). No introduction, no "Tap me!", no "No thanks"; one
  hello in his bubble on the first visit instead ("Hi, I'm Timmy Tooth! ..."), with "Ask me" when the chat is there.
- **100 HP to start**: `simulate()` starts at 100, not 70, when `sh_pet_born` is on or after `FULL_FROM`, the day the
  redesign goes live (`"9999-12-31"` until the release sets it). A Timmy adopted before keeps his history. In a preview,
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
  or key (never with the page: the request budgets), and until then he wears nothing rather than the wrong thing. The
  shop's outfits and the place's kit are used first when they're on the page, so a piece redrawn later reaches the kept
  copy.
- **Changing it**: `shPet.setOutfit(id, parts)` puts it on at once. `widget/place.js` calls it whenever its outfit slot
  changes (`barFollow()`: after the customizer's equip, the server's answer, or a refusal put back), with the kit's
  drawing and lines, so no file is fetched. The place itself (`timmySvg`) always draws him bare under the outfit.
- **What he says**: with `everyone` his outfit lines are the worn outfit's own (when kept), and with nothing on he
  doesn't ask "Do you like my costume?" on Halloween. Holiday jokes and hellos stay.
- **The tests**: `tools/ci/smoke.js` ("everyone has Timmy"), on a phone and a laptop: a first visit on a new hub (on the
  bar, no introduction or "Tap me!", 100 HP, today's birthday, one badge, `fit()` the bootstrap's id, no outfits.js
  with the page, the outfit after the first key, kept; the next visit wears it with no request; nothing on at Halloween
  is nothing; the customizer dresses the bar without a reload; More has the place and the shop), the same first visit on
  the new dashboard, and the live hub and live dashboard as before (not shown before adoption, the Halloween costume and
  `<holiday>:<outfit>`, "Tap me!" and the introduction with "No thanks").
- **At the release**: the release note's "From Ask Timmy, part 4" (`FULL_FROM`, then the adoption code comes out).

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
- **Before the release** the live database has none of these functions: the calls answer "Could not find the
  function", and the tab says Ask Timmy starts at the release (no error, no settings). It fills in once migration_v55 is
  applied; nothing in the page changes then.
- **The preview** answers the six calls with made-up chats shaped as migration_v55 returns them
  (`timmyFixtures`/`timmyAdmin` in `tools/preview/runtime/preview.js`; the quotes are real lines of the new hubs' notes,
  one chat carries markup on purpose), keeps the settings in the account's fixture database, and lists the made-up
  Timmy report in the Inbox, so resolving it there shows on the tab. `{"missing": ["admin_timmy_"]}` in the preview's
  settings shows the tab as it is before the release ([preview-a-change](../how-to/preview-a-change.md)).
- **The test**: `tools/release/admin-ui.js` (the Release tests): the figures against the calls' rows, a chat opened, markup
  drawn as text, no visitor or chat id on the page, the hub chips, no answer without the secret, the settings (a bad value
  refused, asked first, Escape, saved once, off and on again), the Inbox's link, the tab before the release, axe on the
  tab with chats open, and a 390 px phone with a chat open.

Related: [the task](../tasks/2026-11-12-redesign-ask-timmy.md) · [the release](../tasks/2026-11-06-redesign-release.md) ·
[game-server](game-server.md) · [event-taxonomy](event-taxonomy.md) · [analytics-retention](analytics-retention.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md) · [secrets](../rules/secrets.md)
