# Boards hub: the move onto the engine (plan, 2026-11-22)

**Status: draft, waiting for Sam's approval.** Nothing in this plan is built yet. Written for the first Done when box of
`vault/tasks/2026-11-22-boards-onto-the-engine.md` (on `main`): Sam said yes to moving boards onto the hub engine
(2026-11-22, `vault/decisions.md` on `main`). When Sam approves it, the briefs in `docs/boards/tasks/T-07.md` to `T-15.md`
are built in order, one PR each.

Sam's calls that still hold and shape this plan:

- `DECISIONS.md` (this folder): exams roughly August 2028 and never auto-archived on a guessed date; original questions
  from the fact records only; no AI art or audio; long spaced review; local-first with a server copy.
- `vault/hubs/boards.md` (on `main`): **no High Likelihood for now** (2026-11-21); **storage grows with people × items, not
  time** (2026-11-22, package 3 of `vault/tasks/2026-11-22-sustainable-for-years.md`); **no narration or Timmy Time
  recording in the repo** (`vault/rules/no-narration-in-the-repo.md`).

Once approved, this plan **supersedes `BUILD_SPEC.md` 1.2-1.7 and 2.1-2.3** (modes, globals, the dashboard entry,
spaced review, migration v33, the page build) where they disagree; the item rules (section 4), the curriculum (3) and the
quality pipeline (7, with PLAN_V2) stand. T-15 marks those sections in BUILD_SPEC.

## 1. What changes, in one paragraph

Today `tools/build-boards.js` turns `src/boards/` into one generated page (`hubs/boards/index.html`) with its own app
(`src/boards/app/*.js`, `src/boards/css/`), and loads `widget/v3.js` like an old single-file hub. After the move,
`hubs/boards/index.html` is a small settings page (`window.SH_HUB`) like `hubs/review-of-systems/index.html`, its content
is JSON in `hubs/boards/content/`, and `widget/hub.js` draws it: Home, Notes, Questions and More, the game layer (XP,
crowns, ranks, journeys, Timmy, the shop, the place), Learn and Flashcards, the mock, Ask Timmy, the service worker,
the bundles and every CI check the other hubs have. **The authoring side stays as it is**: questions, notes, blueprints
and fact records keep being written in `src/boards/` and checked by `tools/boards/lint-core.cjs`; a converter writes
them into `content/`.

## 2. How each part of `src/boards/` maps onto the engine

| Today (`src/boards/`) | On the engine | Who gains |
|---|---|---|
| `config.js`: hub id, title, `STATE_KEY`, `UNITS`, modes | `hubs/boards/index.html`'s `SH_HUB` (hub `boards`, state key `boards-state-v1`, answered event `boards:answered`, the hub's wording) and `content/core.json` (`lectures`, `exams`, `examNote`). The five modes become the engine's four views (below) | boards |
| Units (`units/<id>/unit.js`, 19 planned, each tagged INBDE or BOTH) | One engine **lecture per unit** (`core.json` `lectures`: `id`, `num`, `title`, `status`, `tag`; no `who`). `status: 'taught'` → `taught`, `'preview'` → `upcoming` (shown as "coming", no questions). **Two exams** → `core.json` `exams` holds `inbde` and `adex` with **no dates** (`date` absent) and `examNote: "INBDE + ADEX ~Aug 2028"`; each lecture and question carries `exam: ['inbde','adex']` | boards; the no-date exam card helps any hub whose date isn't announced yet |
| INBDE components (D&TP / OHM / P&P) | `core.json` `groups` (as Review of Systems groups its courses), so Notes, the bank's panel and progress by lecture group the 19 units into three | boards |
| Notes: Core and Deep dive (`notes.core.html`, `notes.deep.html`, same section ids) | `notes.json` `plain` = Core, `full` = Deep dive, with the two buttons **labeled by the hub** ("Core", "Deep dive") instead of "Plain English" / "As taught". **High yield off** for boards (`core.json` `"hy": false`: no third level, nothing built from `likelyTopics`, which is `[]`). Listen reads in the device's voice (`"audio": "off"` from the start: no recordings in the repo) | every hub can name its levels and switch High yield off |
| Section ids and "Practice this section" (`data-practice`, an item's `sec`) | Each section heading in the notes gets a "Practice this section" button that opens the bank on `#questions` filtered to that `sec`; `sec` kept on each question | every hub (sections are optional) |
| Fact citations (`refs: ['IE-5', 'https://…']`, notes' `data-ref`) | **Source chips** under an explanation and in the notes: each fact id shows its source's name and date and links to the source URL; `content/facts.json` holds only the public part of each cited fact (id, source name, URL, date; never the quotes, which stay in `src/boards/facts/`). The engine's `src` label ("Board fact") stays the one-line source line | every hub can cite sources (`refs` optional) |
| Item fields `fmt` (`except`/`not`/`least`), `fixed`, `pin`, `why`, `cue`, `diff`, `cog`, `cc`, `fk`, `concept`, `ov`, `checked` | `fmt: 'except'` is the engine's; `not`/`least` added to the same rule (the stem's word in capitals). `fixed` and `pin` (keep authored order, a choice always last) added to the card's shuffle. `why` is the engine's. `cue` becomes the line after a miss (engine has none: new, optional). Blueprint fields (`cc`, `fk`, `cog`, `concept`, `ov`) are kept in `questions.json` but the page ignores them; `checked` is consumed by the converter (only checked items are published) | `fixed`/`pin`/`not`/`least`/`cue` for every hub |
| Standalone patient box (`pbox: {patient, cc, hx, findings}`) | The engine's `pbox` rows (`[["Patient", …], ["Chief complaint", …], …]`), written by the converter | already there |
| Case sets (`cases`: shared box, 2-6 items in visit order, `beats` for the game) | **Case sets on the engine**: `core.json` `cases` (id, box rows, item ids in order). The card already shows "Same patient · n of m" for a drawn `pcase`; this generalizes it to a plain box, adds a **Cases** set in the bank (`#questions/cases`) that walks a case's items in order with feedback after the last one (INBDE layout), and keeps the drawn dental kit (`widget/cases.js`) for cases that have a chart. `beats` stay in `src/` until a game uses them | every hub with patient-box cases |
| Readiness and the daily plan (`app/45-readiness-plan.js`, pure, Node-tested; #80 merged, #111's fix open) | `widget/plan.js` (`window.shPlan`), the same pure core with #111's fix and its tests moved to `tools/ci/plan.test.js`, used when `core.json` has `plan` (boards: `{ daily: 12, newPerDay: 4, governor: 0.8, retireStep: 120, retireStreak: 3, retiredSamplePerMonth: 4 }`). Home's **Today** gets "Today's 12" (the drill set from `shPlan`, through `SH_DRILL.plan`) and **readiness per unit** ("Likely right 64%", "Seen 120 of 180") in progress by lecture; the Daily Drill is the same set | opt-in for any hub; boards first |
| Spaced review (`SRS: steps [1,3,7,14,30,60,120], examCap:false, fuzz:0.1, server:true`) | `core.json` `srs` read by `widget/v3.js` (its `SRS_STEPS` are fixed at `[1,2,4,7]` today); the server copy is the per-item state of section 5, so a phone change or Safari's 7-day eviction doesn't reset two years of spacing | opt-in for any hub |
| Exam blocks (`app/50-mock.js`; #102: standalone 63 s/item, case 95 s/item, no feedback until the end) | The engine's mock with **block presets** (`core.json` `mock.blocks`: `standalone` and `cases`, each with seconds per item and a size), on top of its blueprint mock. The engine's mock already has no feedback until submit, the review and `sh:mock-done` | every hub (a preset is optional) |
| Bank: Practice, Cases, Missed, filters (unit, section, exam tag, standalone/case, new, hard) | The engine's bank and panel: lecture = unit, `#questions/misses`, `weak`, `drill`; **new**: the `cases` set (above) and an **exam filter** ("INBDE and ADEX" / "INBDE only") in the panel when the hub has two exams with `exam` tags. Section comes from the notes' button | exam filter: any multi-exam hub |
| Cards (#81: full card, Rounds, cover the options) | The engine's question card. "Cover the options" (answer before the choices show) is Learn's recall step today; a per-hub setting isn't needed for R1. #81's walk-through findings become acceptance tests for the case-set brief | none new |
| Home (`app/60-home.js`) | The engine's Home ([hub-home-page](../../vault/rules/hub-home-page.md) on `main`): masthead, exam card (no date: "~Aug 2028" and "Dates aren't announced yet"), quick links, Where to next, Today, progress by unit, the course timeline left out (no `courseDates`) | — |
| Clinic / Chairside (`app/80-clinic.js` placeholder; #95 game core, #101 art) | **Parked** (question 2): More's Arcade on the engine with boards' own skin ([arcade-skins](../../vault/rules/arcade-skins.md)) when boards gets games; Chairside, if kept, becomes an engine arcade game reading the bank through the engine, its save in the place's or a game's server row | — |
| `app/00-util.js`, `10-state.js`, `20-card.js`, `30-notes.js`, `40-bank.js`, `90-boot.js`, `99-export.js`, `css/*`, `shell.html` | **Retired**: the engine does each of them. The state key and shape (`boards-state-v1`, perio's shape) are what the engine keeps anyway | — |
| `SH_SECTION` strings (`notes/medcx/core`, `bank/practice`) | The engine's (`notes/<lec>`, `questions/...`); nothing is live yet, so no history to keep | — |
| Fact records (`src/boards/facts/`), `tools/boards/check-quotes.mjs`, `lint-items.mjs`, `lint-core.cjs`, `bench.mjs`, the bench | **Stay** where they are; the converter runs `lint-core.cjs` before it writes anything | boards |

**Art:** boards gets its own emblem, masthead scene, medal set and tint in `tools/figures/site/`
([every-hub-gets-its-own-art](../../vault/rules/every-hub-gets-its-own-art.md)), shown to Sam in screenshots.

## 3. What the engine lacks, and who gains

For every hub (each opt-in, a hub without the setting draws exactly as today; each needs its smoke-test check):

1. An exam card and Home for exams **with no date yet** (`exams` without `date`, `examNote`), and an **exam filter** for
   two exams in one bank. (T-09)
2. **Reading-level labels** set by the hub, **High yield off** per hub, and **"Practice this section"** from a notes
   section. (T-08)
3. **Case sets** with a plain shared box and a Cases set in the bank. (T-10)
4. **Source chips** (`refs` → `facts.json`), and the card's `fixed`, `pin`, `not`/`least` and `cue`. (T-11)
5. **Spaced review settings** per hub (`srs`: steps, fuzz, no exam-eve cap) and the **daily plan / readiness**
   (`widget/plan.js`). (T-12)
6. **Mock block presets** (seconds per item, standalone or cases). (T-14)
7. **The rolling answer store** (section 5), a per-hub switch on the database. (T-13)

For boards only: the converter, the content, the art, the wiring (`hubs.js` with `exams: []` and the note, no
auto-archive; `sw.js`; `widget/ranks.js` `HUB_NAMES`/`HUB_MEDAL`; `review/`; `tools/publish-recap.js`;
`tools/release/budgets.json`), the About page entry, and the CI switch. (T-07, T-15)

Not needed: narration, Timmy Time, High Likelihood, figures (until a unit has an approved one: the
[diagram review](../../vault/rules/diagram-review.md) applies when it does).

## 4. What `tools/build-boards.js` becomes

**A converter into `content/`, not retired** (question 3). `tools/build-boards.js` keeps its loading and validation
(`config.js`, units in `UNITS` order, `lint-core.cjs`, notes and fact-id checks, the publish filter: only `checked`
items and cases and `taught` units) and stops writing a page. Instead it writes `hubs/boards/content/core.json`,
`questions.json`, `notes.json`, `study.json` and `facts.json`, then `node tools/hub-next/build.mjs --hub boards` lays
them out. `--check` compares both steps' output with what is committed (CI runs it). `--include-drafts` writes to
`--out <dir>` only (a local preview), never to `hubs/boards/content/`. `--report` and `--unit` stay as they are.

Why keep it: everything the writers, the checker and the bench read (`items.js` with `refs`, `checked`, blueprint
fields; Core and Deep HTML with `data-ref`; the fact records) and every tool built on that stays as it is, and a published
question can only come out of a checked one. The other way (`content/` as the source, the lint ported to JSON) would
mean rewriting `lint-core.cjs`, `bench.mjs`, `check-quotes.mjs` and the open item PRs for no student-visible gain.

The generated `hubs/boards/index.html` becomes the hand-written settings page (it no longer carries the content).

## 5. Storage: how package 3's bound fits the answer path

The engine's answer path is `record_answer_v2` (`vault/reference/game-server.md` on `main`). It writes, for every answer,
rows in `personal_answers`, `answer_xp`, `xp_awards` (per-answer awards) and `xp_seen`, kept for good (about 1.3 KB an
answer). Boards, live for about two years, with 1,200 items and the long review schedule, would grow without bound.

**Recommendation (question 4): one answer path, plus a rolling store for hubs on a list.** `record_answer_v2` stays
exactly as it is for every hub (one place grades, pays and guards; the page doesn't change). A new migration (the next
free number on `main` when it's written) adds:

- `item_state(visitor_id, hub, qid)`: answers, right, first try right, last right or wrong, first and last day, the
  spaced-review step and due day. Updated by `record_answer_v2` for hubs in `rolling_hubs` (boards), so the page's
  bootstrap can hand a new device its review schedule (BUILD_SPEC 1.5's "server copy", replacing its `srs_state` table and
  #97's `upsert_srs`).
- `xp_daily(visitor_id, hub, day)`: the XP and crowns a day's answers paid.
- A nightly step (in the job package 2 adds, `migration_v96`'s pack-away, run on the same code) that, **for hubs in
  `rolling_hubs` only**, deletes per-answer rows older than 30 days after folding them into `item_state` and `xp_daily`.
  `xp_seen`'s paid-once keys for those answers are kept as the daily totals plus the per-item counts, so nothing pays
  twice (the 30 days cover question health, the "first three a day" rule and a replayed call).
- Totals, ranks, journeys, medals and leaderboards read the banked totals, as package 2 makes them do for archived hubs;
  `sh_xp_rebuild` and `redeem_link_code` move the two new tables.

Size: about 150 people × 1,200 items × ~120 bytes with indexes ≈ 20-40 MB at most, plus 30 days of attempts; it doesn't
grow with time. `tools/release/xp.js` and `retention.js` prove on a throwaway copy that every total before the fold
equals every total after, and that a second run changes nothing.

Why not a boards-only answer path: a second copy of the grading, paying and guardrails would drift from the first, which
is what moving onto the engine is meant to end. Why not every hub: other hubs live a few weeks, and package 2 already
packs them away 30 days after their page comes down. The list is one row, so any long-lived hub can join it.

**This depends on package 2** (`migration_v96`, not built yet on `main`): T-13 is written to build on it, or to build
the shared fold first if package 2 hasn't landed.

## 6. What happens to the 16 open PRs

| PR | What | Becomes |
|---|---|---|
| #87 | T-03 perio notes + blueprint | **Keep**: content, touches only `src/boards/units/perio/`. One small fix (`reviews/session-7.md`), then merge any time |
| #91 | T-06, 60 medcx draft items | **Keep**: stage 4b (two checker passes on changed items), then merge. `items.js` is still the source |
| #103, #104, #106 | Endo, anesthesia and gap facts | **Keep**: quote check (`check-quotes.mjs --dir`) and a verifier pass, then merge |
| #110 | Session 7 follow-up (meth mouth line, prompts) | **Keep**: merge; its `NEXT.md` edit conflicts with this PR's, so merge this one first and rebase it (or the reverse; one line) |
| #111 | T-05 stale final-review fix | **Keep**: merge; T-12 moves the fixed core to `widget/plan.js` |
| #94 | Item review sheets | **Keep** (tooling on `items.js`): its three fixes (`session-7b.md`), then merge |
| #98 | Task helper (`tools/boards/task.mjs`) | **Keep**: read and merge (tooling) |
| #99 | Scripted checker | **Keep**: fix the catch rate (count the planted defect), then merge |
| #81 | T-04 full cards, Rounds, filters | **Close**: the engine's card and bank replace it. Its walk-through findings become T-10's acceptance |
| #102 | Exam blocks | **Close**: the engine's mock with block presets replaces it (T-14). Its timing rules become T-14's acceptance |
| #100 | Perio chart figure | **Close**: `widget/cases.js` already draws periodontal charts for the engine; a boards case with a chart uses it |
| #97 | Migration v34 draft (`game_saves`, `srs_state`, `upsert_srs`) | **Close**: replaced by T-13 (`item_state`), with its `>=` lesson kept in T-13's brief |
| #95, #101 | Chairside game core and art | **Park** (left open, not merged) until Sam's call on Chairside (question 2); closed if Chairside is dropped |

None of them should merge `main` in on their own; content and tool PRs touch only `src/boards/`, `tools/boards/` or
`docs/boards/` and merge without a page rebuild once T-07 has landed (the page is no longer generated from them).

## 7. The build, in order (one PR each)

| Brief | What | Into | Needs |
|---|---|---|---|
| T-07 | Converter (`tools/build-boards.js` → `content/`), the settings page, the CI switch to the engine walk for boards (with `lintBoards` kept) | `claude/boards-hub` | this plan approved |
| T-08 | Engine: level labels, High yield off, Practice this section | see question 1 | T-07 |
| T-09 | Engine: exams without dates, the exam note, the exam filter | see question 1 | T-07 |
| T-10 | Engine: case sets (plain box, Cases set, feedback after the last item) | see question 1 | T-07 |
| T-11 | Engine: source chips and `facts.json`; card `fixed`, `pin`, `not`/`least`, `cue` | see question 1 | T-07 |
| T-12 | `widget/plan.js` (with #111), per-hub `srs` in `widget/v3.js`, Today's 12 and readiness per unit | see question 1 | #111, T-07 |
| T-13 | Database: `rolling_hubs`, `item_state`, `xp_daily`, the nightly fold; the bootstrap hands back the review schedule | `main` (database work is shared; see question 1) | package 2 (`migration_v96`) or built with it |
| T-14 | Engine: mock block presets | see question 1 | T-10 |
| T-15 | Boards' art, the wiring (`hubs.js`, `sw.js`, ranks, `review/`, budgets), About page, the hub note says it's on the engine | `claude/boards-hub` | T-07 to T-14; art shown to Sam |

T-08 to T-12 and T-14 are independent of each other after T-07 and can run in parallel sessions. Content work (items,
notes, facts) goes on alongside on its own briefs; the next content brief takes the next free number after T-15 (the
`items-pharm` brief Session 7 called T-07 becomes T-16).

The release itself (unit by unit, BUILD_SPEC 8.2 and PLAN_V2's release 1) is unchanged, except that its "Before shipping"
list is the engine's ([build-a-hub](../../vault/how-to/build-a-hub.md) on `main`).

## 8. Sam's questions (each with a recommendation)

1. **Where do the engine changes land?** Recommended: every change to the shared engine or the database (T-08 to T-14)
   goes to `main` in its own PR, off by default, so it ships now and nothing drifts; boards-only work (T-07, T-15, the
   content) stays on `claude/boards-hub`, which brings `main` in after each. The other way is to build them all on
   `claude/boards-hub`, where they reach other hubs only when boards ships.
2. **Chairside: keep it, or park it?** Recommended: park it. Boards ships first with the engine's game layer (XP, crowns,
   ranks, Timmy, the shop, Learn, Flashcards, the mock), and its own arcade games come later with their own brief. #95
   and #101 stay open but unmerged.
3. **`tools/build-boards.js`: converter, or retire it?** Recommended: converter (section 4). The questions, notes and
   fact records stay in `src/boards/` with every check on them; `content/` is what the converter writes.
4. **The storage bound: one answer path with a rolling store for boards, or a boards-only answer path?** Recommended:
   one answer path (section 5), with a per-hub list any long-lived hub can join.
5. **The open PRs:** close #81, #97, #100 and #102 (replaced by the engine), park #95 and #101, and finish and merge the
   other ten as section 6 says? Recommended: yes.
