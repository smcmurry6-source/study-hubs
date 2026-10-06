# Boards hub: build spec

Status: 2026-10-06, lead-architect spec. **This file is the single source of truth for building the boards hub.**
When documents disagree, the order is: `DECISIONS.md` (Sam's decisions) > this file > `design/GAME-critique.md` >
`design/GAME.md` > `research/architecture.md`. Research files (`research/*.md`) stay as the evidence; facts of record
(`research/facts-*.md`) stay the only place keyed facts come from.

Contents

1. Hub identity and integration
2. Source layout and build
3. Curriculum
4. Item rules and schema
5. Notes format
6. The game (Chairside, after the critique)
7. Quality pipeline per unit
8. Release plan and token budget
9. Work breakdown for release 1 (JSON)
10. Open questions for Sam

---

## 1. Hub identity and integration

### 1.1 Identity

| Thing | Value |
|---|---|
| Hub id (`data-hub`, RPC `p_hub`, `HUB_LABEL` key) | `boards` |
| Folder | `hubs/boards/` (generated; sources in `src/boards/`, section 2) |
| Page title / dashboard title | `Boards Hub` / "Boards Hub: INBDE + ADEX" (code line "Boards · INBDE + ADEX") |
| Widget tag | `<script src="../../widget/v3.js" data-hub="boards" data-answered-event="boards:answered" data-default-mode="home" defer>` |
| Answered event | `boards:answered`, detail `{qid, lec, correct, choice, conf, ctx}`; `choice` is always the **authored** index; `conf` = `sure`/`unsure`/`guess` from the game, absent elsewhere; `ctx` = `bank`/`case`/`mock`/`drill`/`game` |
| Hub state key | `boards-state-v1`, perio shape: `{answered:{qid:{lastCorrect, n, t, first}}, totalSeen, activeDates:[], ui:{level, coverOptions, unit}, retired:{qid:date}}` so the dashboard's `readProgress` works unchanged |
| Game save key | `boards-game-v1` (local) and `game_saves(hub='boards', slot='chairside')` (server) |
| Widget keys (automatic) | `sh_srs_boards`, `sh_drill_boards` |
| Ids | items `b-<unit>-NNNN`, cases `c-<unit>-NNNN` (home unit), notes sections `<unit>-<slug>`; ids are never reused; a changed meaning gets a new id |
| Exams | `exams: []` everywhere until Sam gives real dates; show "~Aug 2028" through `examNote` only (DECISIONS.md) |
| Game | **Chairside**, mode label "Clinic", game id `chairside` |

### 1.2 Modes and sub-views

Section strings are what `window.SH_SECTION()` returns, so `activity_pings` read as plain sentences ("notes/perio/core",
"arcade/chairside/rounds"). Only the Exam blocks mode starts with `mock` (the widget stands eggs, Timmy and the nuke
down there; nothing else may contain a segment starting with `mock`).

| `data-mode` | Visible label | Sub-views (`SH_SECTION`) | What it is |
|---|---|---|---|
| `home` (default) | Today | `home/today`, `home/readiness` | One-tap start: **Today's shift** (or "Today's 12" for non-players, same set), Continue notes, units grid; readiness per unit ("Likely right 64%", "Seen 120 of 180"); practice days this week; "N classmates did today's shift" |
| `notes` | Notes | `notes/<unit>/core`, `notes/<unit>/deep` | Unit notes, Core / Deep dive toggle, review tables inside the notes, "Practice this section" buttons |
| `bank` | Questions | `bank/practice`, `bank/cases`, `bank/missed` | Filtered practice (unit, section, exam tag, standalone/case, new, hard); case sets in exam layout with feedback after the last item; missed and Sure-wrong items |
| `mock` | Exam blocks | `mock/setup`, `mock/standalone`, `mock/cases`, `mock/review` | Timed INBDE-style blocks: standalone (63 s/item) and case (95 s/item), no feedback until the end, no image zoom; fires `sh:mock-done` |
| `arcade` | Clinic | `arcade/lobby`, `arcade/chairside/<area>` with areas `home`, `today`, `sheet`, `visit`, `walkin`, `rounds`, `attending`, `summary` | Chairside (section 6). The `arcade` name and lobby markup are what `tools/ci/smoke.js` already enters |

Every panel's sub-tabs are `.subtabs button` (smoke.js clicks them). Phone: mode tabs in their own labeled row (as perio);
nothing in the bottom-left 90 x 90 px (Timmy) or under the launcher / phone bar.

### 1.3 Globals the hub provides (in this order inside the one inline IIFE)

- `var LECTURES` = units: `{id, num, title, short, exam:['inbde','adex'], status:'taught'|'preview', audio:false, added}`.
  `status:'taught'` = released (keeps the widget's Golden Probe and mastery semantics); `'preview'` = announced, hidden
  from the bank, drill and game. No `who` (no professors), so the professor-quote egg stays off by itself.
- `var QUESTIONS`, `var CASES`, `var READINGS` (Core HTML per unit), `var READINGS_DEEP`, `var READINGS_PLAIN = {}`.
- `window.SH_SRS` (set at the top of the IIFE, which runs before the deferred `v3.js`; section 1.5).
- `window.SH_SECTION`, `window.SH_GOTO(go)` (`{unit, sec}` or `{qid}`), `window.SH_DRILL = {pool, render, scope, size:12, plan}`.
- Inline shared functions used by home, drill and game: `readiness(unit)` and `dailyPlan(opts)` (~270 lines, section 6.4).
- `window.BOARDS_GAME_API` (the adapter, section 6.3) and the lazy loader for `game/chairside-core.js`.
- Last line of the script: `window.SH_EXPORT = { lectures, questions, cases, sections, hints: [], exams: [] }`
  (exactly once in the file; the CI lint hook depends on it).

### 1.4 Dashboard entry (`index.html`)

```js
// HUBS
{ id:"boards", cls:"boards", title:"Boards Hub: INBDE + ADEX", code:"Boards · INBDE + ADEX",
  exams:[],                                  // stays empty until real dates: no hero countdown, no check-ins, no auto-archive
  examNote:"INBDE + ADEX ~Aug 2028",         // display only
  updated:"<release date>",
  desc:"Notes, a board-style question bank and Chairside, a clinic game built on the same questions. Grows unit by unit.",
  modes:["Today","Notes","Questions","Exam blocks","Clinic"],
  stateKey:"boards-state-v1" }
// CLASSES.boards = { name:"Licensure boards", ring:"boards", egg:..., icon:... }; HUB_RING.boards = "boards"; HUB_LABEL.boards = "Boards"
```

Plus `--c-boards` / `--c-boards-soft` in the three token blocks, and two reads of `examNote` (in `hubCardHTML`'s due
line and in the hero's no-exam fallback). `ARCADES` gets no entry in release 1 (no leaderboard yet). The card's drill
row works unchanged (`hubs/boards/#drill`). When real dates arrive: put both into `HUBS.exams` and `SH_EXPORT.exams`,
set `SH_SRS.examCap:true`, and use `hideCardOn` if the ADEX parts come months after the INBDE.

### 1.5 Spaced review: long intervals, server copy, daily budget

**Widget (`widget/v3.js`, opt-in, no change for perio/MSK):**

```js
// hub, top of the IIFE
window.SH_SRS = { steps:[1,3,7,14,30,60,120], examCap:false, v:'boards-1', fuzz:0.1, server:true };
```

- `SRS_STEPS` comes from `SH_SRS.steps` when present (else `[1,2,4,7]`); `srsDue` skips the exam-eve cap when
  `examCap === false`; the one-time `_v` migration pass skips hubs that set `SH_SRS`.
- `fuzz`: each new due date moves by a seeded +-10% (seed = qid + day) so a batch learned together doesn't return as a wall.
- `server:true`: at boot `get_my_srs(p_visitor, p_hub)` is merged into `localStorage` (latest `t` wins per qid); each
  change is queued and sent with `upsert_srs` in batches (every 10 s while dirty and on `pagehide`). Safari's 7-day
  storage eviction and phone changes no longer reset two years of spacing (critique M6).
- Only the first right answer of a day advances a step (unchanged). A **Sure-wrong** (game) also schedules the item for
  tomorrow regardless of the 20 h block (critique S3).

**Hub (`dailyPlan`, inline, used by the drill and by Today's shift; critique M5):**

1. Budget: 12 items a day (`SH_DRILL.size`), about 10 minutes.
2. Fill from due items by priority = `(1 + log2(1 + daysOverdue)) * (1 + classDifficulty) * (1 + 0.5 * sureWrong)`;
   leftovers stay due (they are not lost, and fuzz spreads them).
3. **New-item governor**: new items (or a new case) are offered only while the projected due load for the next 7 days is
   under `0.8 * budget` per day; at most 4 new items a day from Today's plan (the bank stays unlimited).
4. **Retirement**: an item at the 120-day step whose last 3 recorded answers were right (Sure-right in the game) moves to
   `STATE.retired`; each month a seeded sample of up to 4 retired items comes back; a miss returns it to step 0.
5. About-page arithmetic: one item costs 7 reviews over about 235 days, so **12 a day keeps about 400 items in rotation**.

**Drill (`widget/drill.js`, opt-in, critique M4):** `SH_DRILL.size` (`hook().size || 10`); if `SH_DRILL.plan` exists,
the day's set is `plan({day, size})` instead of drill.js's own picks; `window.shDrill` gains `ensureSet()` (build and
freeze today's set without opening the sheet) and `set()` (read it); any `boards:answered` for a qid in today's set
counts toward the drill whether or not the sheet is open. Finishing Today's shift completes the drill and vice versa.

### 1.6 The `question_stats` 1,000-row limit

`drill.js:72` and `v3.js:1655` select all of a hub's `question_stats` rows; the API returns at most 1,000 rows per
request, and an RPC that returns a set is capped the same way. Fix (v33 + widget PR):

- `get_question_stats_lite(p_hub text) returns jsonb`: **one** row, `{"<qid>":[attempts, correct], ...}`, built with
  `jsonb_object_agg`, so no row cap applies.
- `widget/v3.js` exposes `window.shQuestionStats(hub)` (cached per page load; RPC first, falls back to the current
  select); `drill.js`, the "toughest questions" list and the boards adapter all use it. Perio and MSK get identical
  results.
- `review/index.html` Questions tab: page its selects with `.range()` (R1b, before the boards bank passes 1,000
  answered items).

### 1.7 Migration v33 (`migration_v33.sql`; applied through the Supabase connector; `supabase/schema.sql` refreshed)

1. `submit_arcade_score`: copy v11 exactly (list, 10 s throttle, 1..200000), add
   `or (p_hub = 'boards' and p_game ~ '^[a-z][a-z0-9-]{1,23}$')`. (Unused in R1; ready for Board Day.)
2. `record_achievement`: replace whole from v32, add `or (p_hub = 'boards' and p_kind ~ '^cs-[a-z0-9-]{1,30}$')`.
   Site trophies `cs-shift` (finish your first shift) and `cs-week` (meet your practice-day goal for a week) go through it.
3. `game_saves(visitor_id text, hub text, slot text, data jsonb, updated_at timestamptz, primary key(visitor_id, hub, slot))`;
   `save_game(p_visitor, p_hub, p_slot, p_data)` (200,000-char cap, one write per 5 s per row), `load_game(p_visitor, p_hub, p_slot)`.
4. `srs_state(visitor_id text, hub text, qid text, b int, due date, t date, primary key(visitor_id, hub, qid))`;
   `get_my_srs(p_visitor, p_hub)` (jsonb, one row) and `upsert_srs(p_visitor, p_hub, p_rows jsonb)` (max 200 rows per call,
   latest `t` wins).
5. `get_my_latest(p_visitor, p_hub) returns jsonb`: per qid `[last_correct, last_at, attempts, first_correct]` from
   `personal_answers` (one row), for readiness and the selector on a new device.
6. `get_question_stats_lite(p_hub) returns jsonb` (section 1.6).
7. `activity_pings.device text` (`phone`/`tablet`/`desktop`, coarse, from the widget) and `record_activity_ping` with a
   new trailing `p_device text default null` (old callers keep working) (critique S13).
8. `get_today_reach(p_hub, p_prefix) returns int`: distinct visitors today (America/Chicago) with a ping whose section
   starts with `p_prefix` (e.g. `arcade/chairside/`), for "N classmates did today's shift" (critique S14). Public, counts only.
9. `redeem_link_code`: also move `game_saves` and `srs_state` rows (on conflict keep the newest `updated_at` / `t`).

RLS on as for every table; all writes through the functions; no admin secret in the file (`sh_admin_ok()` pattern if any
admin RPC is added). `apply_migration` is pre-approved; log "applied via the connector" in DEPLOY_NOTES.

### 1.8 Every edit outside the hub

| File | Change | PR |
|---|---|---|
| `migration_v33.sql`, `supabase/schema.sql` | Section 1.7 | R1a-1 (first) |
| `widget/v3.js` | `SH_SRS` (steps, examCap, fuzz, server sync), `shQuestionStats`, device field in pings, Sure-wrong callback | R1a-1 |
| `widget/drill.js` | `SH_DRILL.size` and `.plan`, `shDrill.ensureSet/set`, count answers with the sheet closed, use `shQuestionStats` | R1a-1 |
| `widget/pet.js` | hide Timmy while `<html data-sh-fullscreen>` is set (3 lines) | R1a-1 |
| `widget/ranks.js` | `HUB_NAMES.boards`; `TROPHIES` `cs-shift`, `cs-week` (not secret) | R1a-1 (trophies) |
| `widget/replies.js` | `HUB_NAME.boards = "Boards"` | R1a-1 |
| `index.html` | ring tokens x3, `CLASSES.boards`, `HUB_RING`, `HUB_LABEL`, `HUBS` entry, `examNote` reads | R1a-2 |
| `review/index.html` | `HUB_LABEL`, `HUB_COLOR`, `HUB_TITLE` (boards); `.range()` paging in Questions | R1a-2 / R1b |
| `tools/publish-recap.js` | `HUB_COLOR`/`HUB_TITLE` boards | R1a-2 |
| `about/index.html` | Part 2 settings (long review intervals, cover the options, Clinic sound), Part 3 hub modes (Boards), Part 4 Chairside (R1b), Part 9 two trophies + count; a note on "Add to Home Screen" and Link my devices for long-term review | R1a-2, R1b |
| `sw.js` | `'hubs/boards/'` in `PRECACHE`; bump `VERSION` (now `sh-v10`); game files are cached on first use, not precached | R1a-2, R1b |
| `tools/ci/syntax.js` | glob `hubs/*/game/*.js`; also `widget/pet.js`, `timmy.js`, `recap.js` (known gap) | R1a-2 |
| `tools/ci/smoke.js` | boards lint block (`if (hub === 'boards')`, section 4.7); skip narration for units with `audio:false` | R1a-2 |
| `tools/ci/game-tests.js`, `tools/ci/game-smoke.js` | new (section 6.6) | R1b |
| `.github/workflows/check.yml` | `node tools/build-boards.js --check` first; then syntax, game-tests, smoke, game-smoke | R1a-2, R1b |
| `DEPLOY_NOTES.md`, `CLAUDE.md` | lines below; `boards` added to the hub list in "Shared infrastructure" | each PR |

### 1.9 About page entry (R1a; Chairside part in R1b)

Part 3, "Boards Hub (INBDE + ADEX)", tag `new`: what each mode does; readiness in plain words ("Likely right" is the
chance of getting an average question in that unit right today, not a predicted score; "Seen" is coverage); case sets
show answers after the last question, as on the exam; options are shuffled each time; the hub grows unit by unit.
Part 2: "Long review gaps on the boards hub (1, 3, 7, 14, 30, 60, 120 days), saved to your account so a new phone keeps
them; 12 a day keeps about 400 questions in rotation", "Cover the options", "Clinic sound (off by default)".
Part 4 (R1b): Chairside, Sure / Unsure / Guess scoring and why ("always answer on the real exam"), Rounds, practice
days and rest weeks. Part 9: First Shift (`cs-shift`), Kept Week (`cs-week`); update "All N trophies" in both places.

### 1.10 DEPLOY_NOTES and CLAUDE.md lines

DEPLOY_NOTES (top of "Recent major changes", after merge):

> **<date> (Boards hub R1a, Claude Code)**: new hub `hubs/boards/` (INBDE + ADEX, ~Aug 2028, `exams: []` so it never
> auto-archives; "~Aug 2028" via `examNote`). **Generated file: edit `src/boards/`, run `node tools/build-boards.js`;
> CI fails if the build is stale.** Units: medcx, pharm (perio in R1b). `migration_v33.sql` (applied via the connector):
> `game_saves`, `srs_state`, `get_my_srs`/`upsert_srs`, `get_my_latest`, `get_question_stats_lite`, `get_today_reach`,
> device in pings, boards patterns in `submit_arcade_score`/`record_achievement`, link-code moves. Widget: `SH_SRS`
> opt-in (long gaps, server copy), `SH_DRILL.size/plan`, `shDrill.ensureSet/set`, `shQuestionStats`. Spec:
> `docs/boards/BUILD_SPEC.md`.

CLAUDE.md, repo map, after the `hubs/<hub-id>/index.html` line:

> - `hubs/boards/` is **generated** from `src/boards/` by `node tools/build-boards.js` (CI runs `--check`). Edit the
>   sources, never the built file; resolve conflicts in it by rebuilding. Its spec, item rules and pipeline are
>   `docs/boards/BUILD_SPEC.md`; keyed facts come only from `docs/boards/research/facts-*.md`.

---

## 2. Source layout and build

### 2.1 Layout

```
src/boards/
  README.md                    how to edit and build; "hubs/boards/index.html is generated"
  config.js                    hub id, title, UNITS order, ENABLED_TYPES ['mcq'], SRS config, budgets, size limit
  shell.html                   <head>/<body> skeleton with {{STYLE}} {{SCRIPT}} {{BODY}} slots
  css/                         tokens.css (light/dark, --c-boards), base, cards, case, notes, mock, home, phone
  app/                         concatenated in name order into the one inline IIFE
    00-util.js 10-state.js 20-card.js 25-case.js 30-notes.js 40-bank.js 45-readiness-plan.js
    50-mock.js 60-home.js 80-game-adapter.js 90-boot.js
    99-export.js               SH_SECTION, SH_GOTO, SH_DRILL, then `window.SH_EXPORT = {` (last)
  units/<unit>/
    unit.js                    module.exports = {id, num, title, short, exam, status, audio:false, added}
    items.js                   module.exports = { items:[...], cases:[...] }   (one item per line block)
    notes.core.html            Core notes (HTML fragment)
    notes.deep.html            Deep dive (HTML fragment, same section ids)
  figures/<key>.js             code-drawn SVG figures (module.exports = {key, alt, svg(opts)}); no AI art
  synonyms.js                  search synonyms and abbreviations (lesson 22)
  game/                        Chairside sources (section 6.5)
tools/build-boards.js          dependency-free Node 22 build
hubs/boards/index.html         GENERATED single-file hub
hubs/boards/game/*.js          GENERATED game bundles, loaded on demand with ?v=<hash>
```

No `hubs/boards/audio/` in release 1 (section 5.5). Never put an `index.html` anywhere else under `hubs/`.

### 2.2 `tools/build-boards.js`

1. Load `config.js`, then each unit in `UNITS` order (`require`), then `figures/`, `synonyms.js`.
2. **Validate** (fail loudly with file and id): every rule in section 4.7 marked "build"; facts: parse
   `docs/boards/research/facts-*.md` for `**XX-n**` ids and refuse a `refs` id that is missing or whose fact line says
   UNVERIFIED; notes: every item's `sec` exists in its unit's notes, Core and Deep have the same section ids, every
   `data-practice`/`data-ref` resolves; cases: section 4.5 rules.
3. **Publish filter**: only items and cases with `checked` set (passed verification) and units with `status:'taught'`
   are emitted; drafts stay in the sources. Print counts per unit: items, case items, cases, by FK, component, cog, exam tag.
4. Emit `<style>` (css in order), one inline `<script>` IIFE: `window.SH_SRS`, data vars, app files, `SH_EXPORT` last;
   build `SH_EXPORT.sections` (notes paragraphs, table rows, high-yield lines) for the widget's search.
5. Game: concatenate `src/boards/game/<bundle>/*.js` (classic scripts) into one IIFE per bundle that registers on
   `window.BoardsGame`; write `hubs/boards/game/<bundle>.js`; stamp the loader with `?v=<sha1 8>` of each file.
6. Write `hubs/boards/index.html` with a banner: generated, edit `src/boards/`, run the build; merge conflicts are
   resolved by rebuilding. Stable ordering, one item per line, so diffs stay local.
7. Size report per part; **fail over 3.5 MB raw** for `index.html` (projected 2-3 MB at 1,200 items) and over 110 KB
   gzipped for `chairside-core.js`.
8. `--check`: build to memory, compare with the committed files byte for byte, exit 1 with the differing paths.
   Other flags: `--report` (FK x component matrix vs target, case share, ov counts, per-unit cue/negative/longest-key
   rates), `--unit <id>` (validate one unit, for content agents), `--include-drafts` (local preview only; refuses to
   write when combined with a clean `--check`).

### 2.3 CI

`.github/workflows/check.yml`: `node tools/build-boards.js --check` -> `node tools/ci/syntax.js` (now globbing
`hubs/*/game/*.js`) -> `node tools/ci/game-tests.js` (plain Node, no browser) -> `node tools/ci/smoke.js` (enters the
Clinic lobby, Start, waits for `[data-ready="1"]`, Back; boards lint) -> `node tools/ci/game-smoke.js` (section 6.6).
Game files are covered by syntax (parse), smoke and game-smoke (`pageerror`, one full Today's shift) and game-tests
(logic). Content agents run `node tools/build-boards.js --unit <id>` and the full chain before handing off.

---

## 3. Curriculum

### 3.1 Units

The 19 units of `research/inbde.md` 4.2 are kept (shares are this project's estimate; JCNDE publishes only component
and FK weights). Changes: short ids; case share raised in clinical units (cases cross units, and each item counts in
its own unit) so the bank reaches the exam's 40%; DLOSCE areas mapped from `research/adex.md` 5. Tag: **BOTH** = INBDE
and ADEX/DLOSCE; **INBDE** = not on the DLOSCE outline. ADEX is retiring the DSE OSCE: the class takes the JCNDE
**DLOSCE** (150 items; select-one-or-more and prescription tasks) plus the ADEX clinical parts.

| # | id | Unit | Home CCs (also) | Main FKs | Tag (DLOSCE area) | Items | Case items |
|---|---|---|---|---|---|---|---|
| U1 | `anat` | Head and neck anatomy, oral histology, embryology | none (CC3, CC5, CC19, CC33) | FK1, FK4, FK2 | INBDE | 60 | 18 |
| U2 | `physio` | Physiology, biochemistry, nutrition, genetics | none (CC5, CC8, CC9, CC21) | FK1, FK2, FK4 | INBDE | 36 | 11 |
| U3 | `micro` | Microbiology and immunology | none (CC4, CC18, CC22, CC23, CC51) | FK7, FK5 | INBDE | 60 | 18 |
| U4 | `gpath` | General and systemic pathology | none (CC4, CC8, CC9) | FK6, FK5 | INBDE | 36 | 11 |
| U5 | `opath` | Oral pathology and oral medicine | CC3, CC4, CC5, CC23 (CC10, CC14) | FK6, FK4, FK5, FK7 | BOTH (oral path, pain, TMD 13%) | 84 | 42 |
| U6 | `rad` | Oral radiology and imaging | CC6, CC7, CC10 (CC5) | FK3, FK1, FK10 | BOTH (image reads) | 60 | 30 |
| U7 | `perio` | Periodontics | CC22, CC36, CC37 (CC9, CC52) | FK5, FK7, FK6, FK1 | BOTH (perio 10%) | 84 | 42 |
| U8 | `endo` | Endodontics and dental pain diagnosis | CC20, CC28, CC17 (CC6, CC18) | FK1, FK6, FK7 | BOTH (endo 8%) | 72 | 36 |
| U9 | `oper` | Operative dentistry, cariology, dental materials | CC21, CC30, CC38, CC52 | FK2, FK3, FK7 | BOTH (restorative 24%) + ADEX prep critique | 84 | 34 |
| U10 | `pros` | Prosthodontics: fixed, removable, implants | CC29, CC31, CC56 (CC36-38) | FK3, FK1 | BOTH (prosth 19%) + ADEX crown preps | 84 | 42 |
| U11 | `ortho` | Orthodontics, occlusion, TMD | CC34, CC35 | FK1, FK4 | BOTH (ortho 6%; TMD) | 48 | 19 |
| U12 | `peds` | Pediatric dentistry | CC14, CC24 (CC17, CC21, CC34) | FK4, FK9, FK8 | BOTH (ortho/peds, space mgmt) | 60 | 24 |
| U13 | `oms` | Oral and maxillofacial surgery, infection, trauma | CC18, CC32, CC33 (CC17, CC36) | FK1, FK6, FK7 | BOTH (oral surgery 9%) | 48 | 24 |
| U14 | `anes` | Local anesthesia, sedation, pain control | CC19 (CC15, CC27) | FK1, FK8, FK9 | BOTH | 36 | 13 |
| U15 | `pharm` | Pharmacology and therapeutics, substance use | CC25, CC26, CC27 | FK8 | BOTH (prescriptions 5%) + ADEX Rx tasks | 84 | 38 |
| U16 | `medcx` | Medically complex patients, medical emergencies | CC1, CC8, CC9, CC11, CC16 | FK6, FK8, FK5 | BOTH (med emergencies 6%) | 84 | 42 |
| U17 | `infect` | Infection control and occupational safety | CC48, CC51 (CC47) | FK7, FK3 | INBDE (+ ADEX clinic-floor conduct) | 36 | 9 |
| U18 | `prof` | Behavioral science, communication, ethics, law, practice management | CC13, CC15, CC42, CC44-47, CC49, CC50, CC55 | FK9, FK10 | INBDE | 72 | 22 |
| U19 | `pubh` | Research, biostatistics, epidemiology, community oral health | CC39-41, CC43, CC53, CC54 | FK10, FK7, FK9 | INBDE | 72 | 18 |
| | | **Total** | 56 CCs | | | **1,200** | **~493 (41%)** |

Bank-level quotas (checked by `--report`, enforced at each release for the units released so far): primary FK within
about 1 point of the TS weights; component shares 36 / 42 / 22% (D&TP CC1-15 / OHM CC16-38 / P&P CC39-56); at least half
of each clinical unit's items carry a primary FK from FK1-FK7 (biomedical science asked inside clinical decisions);
negatives 10-20% per unit; cognitive levels about 25% L1 / 45% L2 / 30% L3. "Case spine" CCs (CC2, CC12, CC13, CC37)
are counted in the unit the case is homed in. ADEX-only items (prep critique, Rx tasks, DLOSCE select-one-or-more)
come in R5 and are about 5% of the final bank, inside `oper`, `pros` and `pharm`.

### 3.2 Notes outlines (section headings; Core and Deep dive share them)

- **anat**: Trigeminal and facial nerves in dentistry; Glossopharyngeal, hypoglossal and taste; Muscles of mastication and
  the TMJ; Blood supply and lymph drainage; Fascial spaces and spread of infection; Salivary glands; Pharyngeal arches
  and facial development, clefts; Tooth development and enamel, dentin, pulp histology; Periodontium and oral mucosa
  histology; Eruption and tooth morphology.
- **physio**: Cell metabolism essentials; Cardiovascular and respiratory physiology at the chair; Calcium, phosphate and
  bone; Glucose regulation; Renal and hepatic drug handling; Nutrition, vitamins and oral signs; Saliva; Inheritance
  patterns and syndromes with dental signs; Collagen and connective tissue.
- **micro**: Oral biofilm ecology; Cariogenic and periodontal pathogens; Bacterial structure, toxins and antibiotic
  targets; Viruses with oral signs (HSV, VZV, HPV, EBV, HIV, hepatitis); Candida and other fungi; Innate and adaptive
  immunity; Hypersensitivity types I-IV in the dental office; Immunodeficiency; Microbiology of sterilization (spores, prions).
- **gpath**: Cell injury and death; Acute and chronic inflammation; Repair and wound healing; Hemostasis, thrombosis
  and bleeding tests (PT/INR, aPTT, platelets); Neoplasia: terms, grade vs stage, carcinogens; Hemodynamic disorders;
  Systemic disease with oral signs (bridge to medcx).
- **opath**: Describing a lesion; Developmental conditions; White and red lesions; Ulcerative and vesiculobullous
  disease; Pigmented lesions; Soft-tissue enlargements and benign tumors; Oral cancer and potentially malignant
  disorders; Odontogenic cysts and tumors; Fibro-osseous and other bone lesions; Salivary gland disease; Biopsy,
  follow-up and referral; Look-alike tables.
- **rad**: Radiation physics and biology; Dose, ALARA and selection criteria (ADA/FDA); Receptors and image quality;
  Intraoral technique and errors; Panoramic technique, ghost images and errors; CBCT indications; Normal landmarks;
  Reading caries, periodontal bone and periapical change; Radiolucent and radiopaque differentials; Safety, pregnancy,
  infection control in imaging.
- **perio**: The periodontium in health; Biofilm, calculus and risk factors; Gingival health and gingivitis (2017);
  Periodontitis staging, extent and grading; Necrotizing disease, abscesses and endo-perio lesions; Mucogingival
  conditions and recession; Peri-implant health, mucositis and peri-implantitis; The periodontal exam (probing, CAL,
  BOP, mobility, furcation); Radiographic assessment; Prognosis; Nonsurgical therapy and reevaluation; Adjuncts and host
  modulation; Surgical therapy overview; Supportive periodontal therapy; Perio and systemic health.
- **endo**: Pulp and periapical biology; Pain history and pulp/periapical tests; AAE pulpal diagnoses; AAE apical
  diagnoses; Cracks and vertical root fracture; Non-odontogenic toothache; Treatment options and planning; Emergency
  management and when antibiotics help; Access, shaping, irrigation, obturation; Procedural errors; Outcomes and
  post-treatment evaluation; Restoring the treated tooth.
- **oper**: The caries process and risk assessment; Detection and the ADA Caries Classification System; Fluoride,
  sealants and SDF; When to restore; Preparation design; Isolation; Amalgam; Composite and adhesion; Glass ionomer and
  RMGI; Indirect restorations and cements; Materials science and biocompatibility; Esthetic treatment; ADEX Class II/III
  criteria (R5).
- **pros**: Diagnosis and planning for missing teeth; Occlusion for prosthodontics; Fixed: abutments, preparation
  principles, materials, impressions, provisionals, cementation; Removable partial dentures: Kennedy, Applegate,
  components, design; Complete dentures: records, VDO and rest space, delivery and complaints; Implants: planning,
  spacing, osseointegration, restoration, complications; Lab communication and evaluating the result; ADEX crown
  preparation criteria (R5).
- **ortho**: Growth of the face and jaws; Development of the occlusion; Malocclusion classification; Screening and
  referral timing; Space management; Tooth-movement biology and appliances; TMJ function; TMD diagnosis and conservative
  care; Orofacial pain differential.
- **peds**: Development and behavior guidance; Caries risk, fluoride and sealants in children; Primary tooth anatomy and
  pulp therapy; Restoring primary teeth; Dental trauma (IADT 2020); Space maintenance; Child abuse and neglect: signs and
  reporting; Special health care needs; Pediatric anesthesia doses and sedation basics; Adolescents.
- **oms**: Preoperative assessment; Exodontia principles; Third molars; Complications (dry socket, bleeding, sinus
  exposure, nerve injury); Odontogenic infections and airway red flags; Biopsy; Preprosthetic surgery; Facial fractures;
  MRONJ and osteoradionecrosis in surgery; Implant surgery basics.
- **anes**: Nerve conduction and how local anesthetics work; Amides and esters; Vasoconstrictors and ceilings; Maximum
  doses and cartridge math; Injection techniques; Complications (toxicity, methemoglobinemia, paresthesia, hematoma);
  Nitrous oxide and minimal sedation; Anxiety and pain control plans.
- **pharm**: Pharmacokinetics, pharmacodynamics and CYP interactions; Analgesics (NSAIDs, acetaminophen, opioids, the
  ADA approach to acute pain); Antibiotics: when, which, stewardship; Prophylaxis regimens; Antifungals and antivirals;
  Drugs that change dental care (anticoagulants, antiplatelets, antiresorptives, diabetes and cardiac drugs, psychiatric
  drugs); Adverse effects with oral signs; Substance use disorders and tobacco cessation; Pregnancy and lactation;
  Prescription writing (ADEX Rx, R5).
- **medcx**: The medical history and ASA status; Vital signs and blood-pressure thresholds; Cardiovascular disease and IE
  prophylaxis; Prosthetic joints; Bleeding risk and anticoagulation; Diabetes; Asthma and COPD; Kidney, liver, thyroid
  and adrenal disease; Cancer therapy, MRONJ and radiation; Pregnancy; Infectious disease patients; Sickle cell,
  transplant and immunosuppression; Medical emergencies: prevention, kit and BLS; Emergency by emergency (syncope,
  hypoglycemia, asthma, anaphylaxis, chest pain, seizure, stroke).
- **infect**: Chain of infection and standard precautions; Hand hygiene and PPE; Instrument processing and the
  Spaulding classes; Sterilization monitoring; Surfaces and barriers; Dental unit waterlines; Sharps injuries and
  post-exposure steps; Vaccination; OSHA standards; Waste; Aerosols and respiratory hygiene.
- **prof**: ADA Principles of Ethics; Informed consent and refusal; Capacity, minors and surrogates; Confidentiality and
  HIPAA; Records; Abuse and neglect reporting; Communication, health literacy, motivational interviewing; Anxiety and
  behavior change; Scope, referral and consultation; Risk management; Practice management, staff supervision, disaster
  preparedness.
- **pubh**: Study designs and levels of evidence; Bias, confounding and validity; Descriptive and inferential
  statistics; Sensitivity, specificity, predictive values; Measures of association and risk; Epidemiology of caries
  and periodontal disease; Indices; Community water fluoridation and programs; Access, delivery and financing;
  Evidence-based dentistry; Quality improvement.

### 3.3 Release-1 units

**medcx, pharm, perio**, 60 items each in R1 (topped up to 84 in R3), about half in case sets (30 / 27 / 30 case items,
about 24 cases in all; cases may cross these three units). Why these: the three largest INBDE units (7% each) and all
BOTH-tagged (DLOSCE periodontics 10%, medical emergencies 6%, prescriptions 5%); the class is in perio and
pharmacology-heavy coursework now; and their facts of record already exist (facts-medical 1-8, facts-dental 1), so
research cost is the lowest of any unit. Endo (facts-dental 2 done) leads R2.

---

## 4. Item rules and schema

### 4.1 INBDE item style (every item tagged `inbde`)

- **Single best answer**, 4 options by default (3 only when no fourth plausible option exists, 5 at most). No
  select-all, matching, ordering, two-statement or free recall. Never "all of the above" or "none of the above".
- **Negatives** sparingly (10-20% of a unit): EXCEPT, NOT or LEAST in capitals, `fmt` set; the EXCEPT form reads
  "Each of the following ... EXCEPT one. Which is the EXCEPTION?" No double negatives; no negative inside a case's first item.
- **Short stem, detail in the box**: usually one sentence, a direct question; whole item (box + stem + options) about
  40-110 words. One concept per item (diagnosis or treatment, drug or dose, not both). Never "this patient" in a stem.
  Facts that only one item of a set needs go in that item's stem, not the shared box.
- **Patient box**, exactly four headed parts in this order: **Patient** ("Female, 62 years old"; ethnicity only when
  relevant), **Chief Complaint** (patient's own words in quotes, with duration; a parent's words attributed; never the
  diagnosis), **Background and/or Patient History** (one line each, in order: conditions, medications, other treatment,
  dental history, allergies, social history), **Current Findings** (vitals, tests, exam findings, imaging read in words
  when no image). Blank = unknown or none. **Realistic irrelevant data** is required (a box that lists only what the key
  needs gives it away), and every fact in the box must agree with the stem, options and key.
- **Drugs**: generic name first, brand in parentheses with (R) as `®` in the box when a patient would name it
  ("Apixaban (Eliquis®) 5 mg twice daily"); stems and options use generic names; current drugs only; doses only when
  they matter.
- **Teeth**: Universal numbering written "tooth 30", never "#30"; images carry R/L markers and no tooth labels.
  Radiographs are never called "film"; no darkroom items. Abbreviations from the JCNDE list.
- **Options**: same category, grammatically parallel, similar length (the key must not stand out as longest or most
  specific), in logical order (numbers ascending, else alphabetical) when `fixed:true`, otherwise shuffled on every
  render (section 4.6). Realistic distractor data: plausible doses, real drug names, real diagnoses that a student who
  made one specific error would pick.
- **Guideline versions** keyed to what JCNDE uses (2017 AAP/EFP perio classification, 2017 ACC/AHA blood pressure,
  2021 AHA IE prophylaxis, 2020 ASA status, 2020 IADT trauma, cigarettes per day), re-checked against the JCNDE update
  list each release.
- **Cases** (`case` set): 2-6 items (typically 3-4) sharing one box and optional stimuli; each item answerable from the
  box plus its own stem; later items may move the story on in their stems ("Two weeks later he returns with...");
  items may come from different units and CCs (a medicated perio patient: drug mechanism FK8, staging CC22, consent
  CC13). Explanations use only facts in the case (lesson 11).

### 4.2 ADEX / DLOSCE items

- Clinical diagnosis and planning items fit both exams: tag `exam:['inbde','adex']` whenever the item fits a DLOSCE area
  (adex.md 5 area map). Most R1 items are BOTH.
- ADEX-only formats (R5, `exam:['adex']`, never in the game, INBDE blocks or the drill): `dlmulti` (select one or more;
  options keyed `correct`/`incorrect`/`neutral`; any incorrect pick scores 0, else credit = correct picks / correct
  options, as the DLOSCE does); `rx` (choose the drug, then strength, number dispensed, number per dose, frequency;
  0-4 points); `spot` (which labeled region of a to-scale code-drawn preparation or radiograph is deficient; 3-6 regions;
  "All criteria acceptable" pinned last); ADEX-only `mcq` may have up to 10 options (DLOSCE long lists). These need
  `facts-adex.md` (built from adex.md 4 with criteria-sheet ids) and `ov.adex`. `ENABLED_TYPES` in `config.js` keeps
  them out until their release.

### 4.3 Explanations, cues, citations, versions, difficulty

- `ex`: 2-4 sentences: the reasoning path from the box to the key, naming the **most tempting wrong answer** and why
  it fails (lesson 12). Plain words, American English.
- `why[]`: one line **per option**, same order as `choices`: the key's line starts "Correct." and gives the decisive
  fact; each distractor's line says what error leads there and the fact that rules it out. The card shows `ex`, then the
  picked option's line highlighted, then the others.
- `cue`: a short memory hook shown after a miss. **Required** when `diff` is 3 or `cog` is 3, recommended always (lesson 13).
- `refs`: at least one; a fact id from `facts-*.md` (`IE-5`) or an `https://` URL to a public primary source (guideline,
  FDA label on DailyMed, CDC, ADA, AAP, AAE, AAOMS, AAPD, AHA) with the location after `#` or in `refs` text
  (`'https://...#Table 5'`). The refs must support the key **and** each distractor's "why not". Never cite prep
  companies, released exam items or textbooks we can't link.
- `ov`: outline version per tagged exam: `{inbde:'DoD2018/CG2026'}` and/or `{adex:'DLM2026-27'}`; the yearly re-check
  greps by it.
- `cog` 1-3 (recall / application / reasoning, IDG levels); `diff` 1-3 (author's estimate; class data replaces it once
  an item has 8+ attempts); `concept` (kebab tag; siblings share it); `hy` (optional high-yield reason, used by the drill).

### 4.4 Schema (`src/boards/units/<unit>/items.js`)

```js
module.exports = {
  items: [
  { id:'b-<unit>-NNNN',          // stable forever
    lec:'<unit>',                // unit id (home unit)
    type:'mcq',                  // R1: mcq only (ENABLED_TYPES)
    fmt:undefined,               // 'except' | 'not' | 'least' (stem then shows the word in capitals)
    pbox:undefined,              // standalones only: {patient, cc, hx:[...], findings:[...]}; case items use the case box
    img:undefined,               // key into src/boards/figures; alt text lives with the figure
    stem:'...',
    choices:['...','...','...','...'],   // 3-5 (INBDE)
    answer:2,                    // authored index of the key
    fixed:false,                 // true = keep authored (logical/numeric) order; else shuffled on every render
    pin:undefined,               // indexes always rendered last (ADEX "All criteria acceptable")
    ex:'...', why:['...','...','...','...'], cue:'...',
    refs:['IE-5','https://...#section'],
    exam:['inbde','adex'], ov:{inbde:'DoD2018/CG2026', adex:'DLM2026-27'},
    cc:'CC26', cc2:['CC8'], fk:'FK8', fk2:['FK7'],
    cog:2, diff:2, concept:'ie-prophylaxis-allergy', sec:'pharm-antibiotics', hy:undefined,
    case:undefined, phase:'clear',     // case id when in a set; phase: clear|dx|plan|tx|fu|prev|prof
    added:'2026-11-02',
    checked:null },              // set by the fix step after verification: {on:'2026-11-05', by:'verify', round:1}
  ],
  cases: [
  { id:'c-<unit>-NNNN', units:['endo','medcx'],
    box:{ patient:'...', cc:'"..." (duration)', hx:['...'], findings:['...'] },
    stim:[],                     // figure keys shown with the box
    items:['b-...','b-...'],     // 2-6, in visit order
    beats:{ 'b-...':'one flavor sentence before this item' },   // game only; never carries a fact an item needs
    exam:['inbde','adex'], added:'2026-11-02', checked:null }
  ]
};
```

### 4.5 Examples (original; facts from facts-medical.md and facts-dental.md)

**Standalone with a patient box** (pharm):

```js
{ id:'b-pharm-0001', lec:'pharm', type:'mcq',
  pbox:{ patient:'Female, 71 years old', cc:'"My gums bleed when I floss." (2 months)',
    hx:['Aortic stenosis treated with transcatheter aortic valve replacement (2023)', 'Hypercholesterolemia',
        'Aspirin 81 mg daily', 'Atorvastatin (Lipitor®) 20 mg daily',
        'Allergy: amoxicillin (hives and lip swelling, 2011)', 'Retired teacher; never smoked'],
    findings:['BP 128/76, pulse 70', 'Generalized 5-6 mm probing depths with bleeding on probing',
        'Subgingival calculus visible on bitewing radiographs'] },
  stem:'Scaling and root planing is planned, starting today. Which antibiotic, as a single oral dose 30-60 minutes beforehand, is most appropriate?',
  choices:['Amoxicillin 2,000 mg', 'Azithromycin 500 mg', 'Cephalexin 2,000 mg', 'Clindamycin 600 mg'],
  answer:1, fixed:true,
  ex:'First ask whether she needs prophylaxis: a transcatheter prosthetic valve is an AHA high-risk condition and scaling and root planing manipulates the gingiva, so yes. Then fit the drug to the allergy: hives and lip swelling after amoxicillin rule out cephalosporins as well as penicillins, and clindamycin is no longer recommended, which leaves azithromycin. The tempting wrong answer is cephalexin, which is an allergy option only when the reaction was not anaphylaxis, angioedema or hives.',
  why:['A penicillin is out: her reaction to amoxicillin was hives with swelling.',
       'Correct. Azithromycin 500 mg is an AHA oral option for penicillin allergy; nothing in her box (such as a known long QT) argues against it.',
       'An AHA allergy option, but not after anaphylaxis, angioedema or hives, which is what she had.',
       'Removed from the AHA dental regimens in 2021 because of more frequent and severe reactions, including C. difficile infection after one dose.'],
  cue:'Hives or swelling with penicillin: both "C" drugs are out (no cephalexin, no clindamycin).',
  refs:['IE-2','IE-4','IE-5','IE-6','IE-7','IE-8'],
  exam:['inbde','adex'], ov:{inbde:'DoD2018/CG2026', adex:'DLM2026-27'},
  cc:'CC26', cc2:['CC8','CC1'], fk:'FK8', fk2:['FK7'], cog:2, diff:2,
  concept:'ie-prophylaxis-allergy', sec:'pharm-prophylaxis', phase:'clear',
  hy:'AHA 2021 removed clindamycin', added:'2026-10-06', checked:null }
```

**Standalone, calculation, fixed numeric order** (anes):

```js
{ id:'b-anes-0001', lec:'anes', type:'mcq',
  stem:'A healthy adult weighing 70 kg (154 lb) needs quadrant dentistry with 4% articaine with epinephrine 1:100,000 (68 mg of articaine per 1.7-mL cartridge). Based on the labeled maximum of 7 mg/kg, what is the greatest number of full cartridges that may be given at this visit?',
  choices:['2', '4', '7', '14'], answer:2, fixed:true,
  ex:'Maximum dose = 7 mg/kg x 70 kg = 490 mg; 490 / 68 mg = 7.2, so 7 full cartridges. The epinephrine in 7 cartridges (7 x 0.017 mg = 0.119 mg) also stays within the label ceiling of 0.0017 mg/kg (0.119 mg at 70 kg). The tempting wrong answer is 14, which divides by 34 mg, the content of a 2% lidocaine cartridge.',
  why:['The 0.04 mg epinephrine ceiling for significant cardiovascular disease (about 2 cartridges of 1:100,000); it does not apply to a healthy adult.',
       'Uses 4.4 mg/kg, the AAPD pediatric maximum for lidocaine and mepivacaine (308 mg / 68 mg = 4.5); articaine allows 7 mg/kg.',
       'Correct. 490 mg / 68 mg per cartridge = 7.2; give no more than 7 full cartridges.',
       'Divides by 34 mg per cartridge (2% = 20 mg/mL), but 4% articaine is 40 mg/mL, 68 mg per 1.7 mL.'],
  cue:'Percent x 10 = mg/mL: 4% = 40 mg/mL = 68 mg in a 1.7-mL cartridge.',
  refs:['LA-1','LA-3','LA-5','LA-6','VC-1','VC-8'],
  exam:['inbde','adex'], ov:{inbde:'DoD2018/CG2026', adex:'DLM2026-27'},
  cc:'CC19', fk:'FK8', cog:2, diff:2, concept:'la-max-dose-calc', sec:'anes-max-doses', phase:'tx',
  added:'2026-10-06', checked:null }
```

**Case set** (homed in endo; items from endo and medcx):

```js
{ id:'c-endo-0001', units:['endo','medcx'],
  box:{ patient:'Male, 67 years old',
    cc:'"My lower right back tooth throbs at night, and cold drinks make it ache for a long time." (3 days)',
    hx:['Atrial fibrillation', 'Hypertension, controlled', 'Apixaban (Eliquis®) 5 mg twice daily',
        'Lisinopril (Zestril®) 20 mg daily', 'Allergy: penicillin (rash, 2015)',
        'Retired bus driver; quit smoking 12 years ago'],
    findings:['BP 134/82, pulse 78, irregular',
        'Tooth 30: large distal-occlusal amalgam with recurrent caries at the distal margin',
        'Cold test, tooth 30: sharp pain lasting about 40 seconds after the stimulus is removed',
        'Cold test, teeth 29 and 31: brief response that fades within 2 seconds',
        'Tooth 30: tender to percussion; palpation normal',
        'Probing depths around tooth 30: 2-3 mm',
        'Periapical radiograph: widened PDL space at the mesial root apex of tooth 30; no periapical radiolucency'] },
  stim:[], items:['b-endo-0001','b-medcx-0001','b-medcx-0002'],
  beats:{ 'b-medcx-0001':'He thinks it over and comes back on Thursday.' },
  exam:['inbde','adex'], added:'2026-10-06', checked:null }

{ id:'b-endo-0001', lec:'endo', type:'mcq', case:'c-endo-0001', phase:'dx',
  stem:'What is the most likely pulpal and apical diagnosis for tooth 30?',
  choices:['Reversible pulpitis; normal apical tissues',
           'Symptomatic irreversible pulpitis; symptomatic apical periodontitis',
           'Asymptomatic irreversible pulpitis; asymptomatic apical periodontitis',
           'Pulp necrosis; acute apical abscess'], answer:1,
  ex:'Give the diagnosis as a pair. The cold test answers the pulp question: pain that lingers about 40 seconds, with spontaneous night pain, is symptomatic irreversible pulpitis. Percussion answers the apical question: tenderness means symptomatic apical periodontitis, which may show only a widened PDL space. The tempting wrong answer pairs the "asymptomatic" terms, chosen by reading the radiograph before the tests.',
  why:['Reversible pulpitis fades within seconds and normal apical tissues are not tender to percussion; tooth 30 lingers and is tender.',
       'Correct. Lingering cold pain and night pain = symptomatic irreversible pulpitis; percussion tenderness = symptomatic apical periodontitis, with or without a radiolucency.',
       'Neither part fits: his pulp is painful (not asymptomatic), and asymptomatic apical periodontitis means a radiolucency with no tenderness.',
       'A necrotic pulp does not respond to cold, and an acute apical abscess brings rapid swelling; tooth 30 responds to cold and has no swelling.'],
  cue:'Cold tells the pulp, tap tells the apex.',
  refs:['EN-4','EN-6','EN-9','EN-10','EN-11','EN-13','EN-14','EN-15'],
  exam:['inbde','adex'], ov:{inbde:'DoD2018/CG2026', adex:'DLM2026-27'},
  cc:'CC20', cc2:['CC7','CC28'], fk:'FK6', fk2:['FK1'], cog:2, diff:2,
  concept:'endo-dx-pair', sec:'endo-aae-diagnoses', added:'2026-10-06', checked:null }

{ id:'b-medcx-0001', lec:'medcx', type:'mcq', case:'c-endo-0001', phase:'plan',
  stem:'He decides to have tooth 30 extracted. Which is the most appropriate plan for his apixaban?',
  choices:['Continue apixaban as prescribed and use local hemostatic measures',
           'Check his INR that morning and extract only if it is 3.5 or less',
           'Stop apixaban 7 days before and bridge him with heparin injections',
           'Replace apixaban with daily aspirin for the week before surgery'], answer:0,
  ex:'Apixaban is a DOAC: fixed dose, short half-life, no INR monitoring. For most dental procedures, including extraction of one to three teeth, DOACs are continued and bleeding is controlled locally; any delay or 24-48 hour pause is reserved for higher-bleeding-risk surgery and decided with his physician. The tempting wrong answer is the INR check, which belongs to warfarin.',
  why:['Correct. No change for a single extraction; pressure, an oxidized cellulose or gelatin sponge, sutures and tranexamic acid control the bleeding.',
       'The INR and its 3.5 cutoff apply to warfarin; apixaban is not monitored with the INR.',
       'A week off is not needed for one extraction, and the risks of stopping (stroke, thromboembolism) generally outweigh prolonged bleeding.',
       'Changing his anticoagulant is not needed for one extraction, and any change to it is his physician\'s decision.'],
  cue:'INR is for warfarin. DOAC: keep taking it, pack the socket.',
  refs:['AC-1','AC-3','AC-5'],
  exam:['inbde','adex'], ov:{inbde:'DoD2018/CG2026', adex:'DLM2026-27'},
  cc:'CC8', cc2:['CC27','CC33'], fk:'FK8', cog:2, diff:2,
  concept:'doac-dental-mgmt', sec:'medcx-bleeding', added:'2026-10-06', checked:null }

{ id:'b-medcx-0002', lec:'medcx', type:'mcq', case:'c-endo-0001', phase:'clear',
  stem:'Which antibiotic plan is most appropriate before the extraction of tooth 30?',
  choices:['Amoxicillin 2 g orally 30-60 minutes before',
           'Azithromycin 500 mg orally 30-60 minutes before',
           'Clindamycin 600 mg orally 30-60 minutes before',
           'No antibiotic prophylaxis for this extraction'], answer:3,
  ex:'Ask "is the condition on the AHA list?" before "which drug?". The list is a prosthetic valve or valve material, previous endocarditis, certain congenital heart disease, and a heart transplant with valvulopathy. Atrial fibrillation and hypertension are not on it, so the penicillin allergy line is irrelevant here. The tempting wrong answer is azithromycin, the allergy regimen for a patient who would need prophylaxis.',
  why:['The usual regimen when prophylaxis is indicated, but nothing in his history calls for it (and he reports a penicillin allergy).',
       'Right drug for a penicillin-allergic high-risk patient, but he is not high risk: atrial fibrillation is not an AHA category.',
       'Removed from the AHA dental regimens in 2021, and he needs no prophylaxis anyway.',
       'Correct. None of his conditions is one of the four AHA high-risk categories.'],
  cue:'IE prophylaxis has four boxes: prosthetic valve, prior IE, certain CHD, transplant valvulopathy. A-fib is not a box.',
  refs:['IE-1','IE-2','IE-3','IE-4','IE-6'],
  exam:['inbde','adex'], ov:{inbde:'DoD2018/CG2026', adex:'DLM2026-27'},
  cc:'CC8', cc2:['CC26'], fk:'FK7', fk2:['FK8'], cog:2, diff:1,
  concept:'ie-prophylaxis-who', sec:'medcx-cardiac', added:'2026-10-06', checked:null }
```

These examples go through the full pipeline (section 7) like any item before they ship.

### 4.6 Rendering rules that protect learning and data

- **Shuffle on every render** unless `fixed`, with `pin` honored; the card maps the shown position back to the authored
  index for `recordAnswer` and `question_choices` (critique M8a).
- **Case sets**: in the bank and the game, each item locks with "Recorded" and no verdict; the verdicts, `ex`, `why[]`
  and cues of all items appear together after the last item (**Rounds**), with the box beside them (critique M3). Mock
  blocks give no feedback until the block ends. Standalones give feedback at once.
- **Cover the options** setting (off by default): stem and box first, options on tap.
- Every item is recorded at most once per encounter; Rounds and review re-renders never record.
- **Siblings** (critique M8b): for each unit's top concepts (`hy` set), write 2-3 sibling items (same `concept`, a
  different stem or box); the selector rotates siblings for due reviews of that concept, and readiness weights first
  attempts and sibling answers above repeats.

### 4.7 Lint and validation

Existing CI rules (`tools/ci/smoke.js`, all hubs): duplicate id; `lec` not a unit; mcq with under 2 choices, answer out
of range or duplicate choices; missing `ex`; key strictly the longest choice in more than 40% of MCQs (3+ choices).

Boards rules (build = `tools/build-boards.js`, fail unless marked warn; mirrored in smoke.js under `hub === 'boards'`):

1. Required fields: `id, lec, type, stem, choices, answer, ex, why, refs, exam, ov, cc, fk, cog, diff, concept, sec,
   added`; `type` in `ENABLED_TYPES`; id matches `^b-<lec>-\d{4}$`.
2. INBDE-tagged mcq: 3-5 choices; no choice matching `/\b(all|none) of the above\b/i` or "both A and B".
3. `why.length === choices.length`, all non-empty; `why[answer]` starts with "Correct."
4. `fmt` set if and only if the stem contains capitalized EXCEPT, NOT or LEAST; negatives 10-20% of a unit (warn outside).
5. `cue` present when `diff === 3 || cog === 3`.
6. `refs`: at least one; fact ids exist and are not UNVERIFIED; URLs are `https://`.
7. `ov` has a key for every exam in `exam`.
8. Style: no `#\d{1,2}\b` tooth numbers; no "this patient"; no "film"; British spellings list
   (colour, haem, anaes, paediatric, centre, behaviour...) fail; `pbox`/case box has `patient` and `cc` non-empty and
   `cc` in quotes.
9. Key strictly longest: at most 35% of a unit's MCQs (stricter than the 40% hub-wide CI rule, so the hub never trips it);
   authored key index spread: no index above 40% of a unit's non-fixed items (warn).
10. Cases: 2-6 items; all exist, are game-eligible and point back with `case`; no case item has its own `pbox`; items of a
    case are not reused elsewhere; **leakage warn**: an earlier item's `ex`/`why`/`stem` contains a later item's key text.
11. `sec` exists in the unit's notes; Core and Deep have the same section ids.
12. Copy guard (warn, reviewed in verification): any 8 consecutive words shared with a cached source text in
    `docs/boards/research/` or with another item.

---

## 5. Notes format

### 5.1 Two levels

- **Core** (`notes.core.html`, `READINGS[unit]`): what the exam asks, in plain words: definitions, decision rules,
  numbers to know, look-alike tables. About 2,000-3,500 words per unit. The default level (Plain English beat As
  taught in MSK, lesson 21).
- **Deep dive** (`notes.deep.html`, `READINGS_DEEP[unit]`): mechanisms, the evidence behind each rule, exceptions,
  worked examples (dose math, staging walk-throughs). About 4,000-7,000 words. Same section ids and order as Core, so
  the toggle keeps the reader's place (`STATE.ui.level`).

### 5.2 Markup (HTML fragments; the build validates them)

```html
<aside class="hy" data-unit="medcx"><h3>High-yield</h3><ol><li>...</li></ol></aside>   <!-- top of Core: 8-12 lines -->
<section id="medcx-bleeding" data-sec="medcx-bleeding">
  <h2>Bleeding risk and anticoagulation</h2>
  <p>... <span class="ref" data-ref="AC-3"></span></p>          <!-- renders as a small source chip -->
  <table class="rt" data-rt="medcx-anticoag-table">            <!-- review table; .rt-hide columns blur in recall mode -->
    <caption>Anticoagulants and antiplatelets at the chair</caption>
    <thead><tr><th>Drug</th><th>Class</th><th>Monitored by</th><th class="rt-hide">Before a simple extraction</th></tr></thead>
    <tbody>...</tbody>
  </table>
  <figure data-fig="<figure key>"></figure>                     <!-- code-drawn figure from src/boards/figures -->
  <button class="practice" data-practice="sec:medcx-bleeding">Practice this section</button>
  <footer class="sources">Sources: AC-1, AC-3, AC-4, AC-5</footer>
</section>
```

- Review tables live **inside** the notes (not a separate mode): one per look-alike group and one per "numbers to know"
  set (lesson 20); each has a recall toggle that blurs `.rt-hide` cells.
- **Notes to items**: every item's `sec` points at a section; the card's explanation ends with "Read: <section title>"
  (`SH_GOTO({unit, sec})`); each section's "Practice this section" opens the bank filtered by `sec`. The build warns on
  a section with no items and fails on an item with an unknown `sec`.
- Every factual sentence that a keyed item could rest on carries a `data-ref` (fact id or URL); the section footer lists
  them. Same no-copy rule as items. American English.
- `SH_EXPORT.sections` gets each paragraph, table row and high-yield line (kind `Notes`, `Table`, `High-yield`) with
  `go:{unit, sec}`, plus `synonyms.js` terms, for the widget's search.

### 5.3 Narration

None in release 1: every unit has `audio:false`, no `hubs/boards/audio/` folder exists, and the Listen button uses the
browser's speech fallback. Kokoro narration is added for a unit only after its notes have gone 3 months without edits
and Sam asks (each later text edit must then regenerate that level's mp3, per CLAUDE.md). The smoke lint skips units
with `audio:false`, so narrating some units never forces the rest.

---

## 6. The game: Chairside (final design after the critique)

### 6.1 What it is

**Chairside** is a short-session clinic game in which every action is a board item from the hub's own bank.
A **shift** (4-15 minutes, phone first, playable silent, resumable) brings patients: **booked** patients are the bank's
case sets (the INBDE patient box, 2-6 linked items in visit order), **walk-ins** are standalone items, **recall
patients** are spaced-review items that are due, **callbacks** are recent misses. Each answer is locked in as
**Sure, Unsure or Guess**, which teaches calibrated confidence and always answering. A Half or Full shift ends with the
**attending's case**: the hardest eligible case in the shift's units. Around the shifts sits a calm two-year frame:
a clinic facade whose wing windows light with readiness per unit, practice days per week with rest weeks, and
**Today's shift**, which *is* the Daily Drill. The game holds no questions of its own and records every answer through
the hub's `recordAnswer`, so class stats, spaced review, XP, ranks, mastery and Weak Spots move exactly as in the bank.

Design rules that hold everywhere: knowledge is the only power (nothing makes an item easier, timed or skippable for
profit); speed never scores; guessing never pays; no manipulative hooks (no expiring rewards, loss framing,
notifications, loot or streak shaming); coming back is the win condition, measured from day one.

### 6.2 The rules (release 1)

| Thing | Rule |
|---|---|
| Lock-in (M1) | Pick an option, then submit with **Sure** / **Unsure** / **Guess**; every item needs a pick; the pick is always recorded |
| Care (run score) | Sure +3 / -3, Unsure +1 / -0.5, Guess 0 / 0 (blind guessing has expected value <= 0 for 3-5 options) |
| Flow (tiers 0-4: x1, x1.5, x2, x2.5, x3) | Rises one tier per 2 consecutive Sure-correct; resets only on Sure-wrong; multiplies **Sure outcomes only**; Unsure and Guess hold it. Shown as light and (optional) sound, not a HUD meter |
| Teaching line | Once, on the first Guess: "On the real exam, always answer. Guess when you'd guess." Thresholds shown in Help: Sure above about even odds, Unsure if you can rule some out, Guess otherwise |
| Composure (M2) | Cut. No resource ends or mutes a shift |
| Skim guard | Locked in faster than max(2 s, words / 15 per s): no positive Care, still recorded, "Take your time" |
| Booked patient (M3) | Items in order, each locks with "Recorded" only; **Rounds** after the last item shows all verdicts, explanations, `why[]` lines and cues with the box beside them; outcome (Delighted / Stable / Complication) shown there |
| Walk-in, recall, callback | One item, immediate feedback. A due item that belongs to a case is served **alone with its patient box** as a "follow-up visit" (M4) |
| Sure-wrong (S3) | Explanation expanded, mentor cue shown, item returns as tomorrow's callback |
| Recall wrapper (M8) | A recall patient gets a fresh generated face and name (portraits never depend on conditions); the line "back for recall" is the continuity |
| Shift lengths | **Today's shift** (the drill set, auto-routed: one "Continue" per patient, no choices), **Quick visit** (1 patient), **Half shift** (3 patients + attending), **Full shift** (5 patients + attending, the only shift with protocol drafts) |
| Day sheet | Half and Full: 2 slot choices per row (Walk-in, Booked, Recall, Callback; Referral only when items have 8+ class attempts and accuracy under 55%) |
| Attending's case | Hardest eligible case (class difficulty, then cog level) in the shift's units; +15 Care if 60%+ right; no gimmicks in R1 |
| Protocols (perks) | Full shift only, at most 2 drafts of 1-of-3: **Conviction** (Sure +4 / -4), **Hedge** (Unsure +1.5 / -0.75), **Triage Nurse** (3 choices per row), **Recall Desk** (recall patients x2 Care), **Chart Review** (summary lists each missed item's notes section), **Mentor's Ear** (cues also after Unsure-correct). Validator: no hook sees the key before LOCKED |
| Cover the options (S4) | Hub setting honored by the item host |
| Progress words (S2) | Two new terms only: **Care** (per shift) and **Readiness** (per unit). Long-term rank = the site's XP and handpiece ranks |
| Habit | Practice days this week (goal 4 of 7, 2-7 adjustable); weeks kept; one rest week earned per 4 kept weeks (max 3); **Welcome back** shift after an absence; **Keep it** line after a course exam when `config.js` has the course calendar |
| Social (S14) | One line: "N classmates did today's shift" (`get_today_reach`). No leaderboard in R1 |
| Sound (S8) | Off until turned on; `navigator.audioSession.type = 'ambient'` where supported; a few synthesized cues, no alarms |
| Trophies | `cs-shift`, `cs-week` (site trophies, not secret) |

Scoring tests (section 6.6) prove that for simulated students with true accuracy 0.25-0.95 on 3-5 option items, the
honest policy is never beaten and always-Sure / always-Guess never tops a seeded comparison, under every protocol.

### 6.3 Adapter: `window.BOARDS_GAME_API` (hub side, v1)

```js
{ v:1, hub:'boards',
  units()                          -> [{id, title, status, exam}]            // released units only
  questions(filter)                -> [item]                                 // game-eligible: mcq, 3-5 choices, released
  item(qid) -> item;  cases() -> [case];  caseOf(qid) -> case|null
  renderItem(el, qid, {lockIn:true, deferFeedback, shuffle:true, review:false})
                                   -> { picked():int|null, submit(conf), destroy() }   // the hub's own card
  onAnswered(fn)                   // subscribes to boards:answered (verdict arrives through it)
  history()                        -> {qid:{lastCorrect, n, t, first}}       // STATE.answered merged with get_my_latest
  srsDue() -> [qid];  srsMap() -> {qid:{b, due, t}}
  dailyPlan({day, size})           -> [qid]                                  // section 1.5
  drill: { ensureSet(), set() }    // widget shDrill
  classStats(ids)                  -> {qid:[attempts, correct]}              // shQuestionStats
  readiness(unit)                  -> {likely, seen, total, band}
  reach(prefix)                    -> Promise<int>                           // get_today_reach
  save: { get(), set(obj), remote:{ get(), set(obj) } }                      // localStorage + save_game/load_game
  section(area)                    // SH_SECTION reports arcade/chairside/<area>
  settings: { sfx(), reducedMotion(), coverOptions(), theme() }
  fullscreen(on)                   // toggles <html data-sh-fullscreen>
  goto(go)                         // SH_GOTO, for "Read: <section>"
}
// game file:  window.BoardsGame = { mount(rootEl, api) -> { stop() } }
```

`submit(conf)` calls the hub's `recordAnswer(qid, lec, correct, choice, {conf, ctx:'game'})`, which dispatches
`boards:answered`; the game reads the verdict from that event. The game never calls `recordAnswer` any other way and
never records Rounds or review renders.

### 6.4 Shared inline functions (in the hub, used by home, drill and game)

- **Item difficulty**: `acc_i = (correct + 2 * prior) / (attempts + 2)`, prior by cog level (L1 0.75, L2 0.62, L3 0.50);
  `b_i = logit(1 - acc_i)`. Class splits are shown only from 8 attempts (S5); until then the prior carries it.
- **Ability per unit**: replayed from history in time order: `theta += K * w * (o - sigma(theta - b_i))`, K 0.4 -> 0.15
  after 40 answers; weight `w` = 1 for a first attempt, 0.8 for a sibling's first attempt, 0.3 for a repeat (M8d).
- **Readiness (M7)**: `likely = mean_i sigma(theta_eff - b_i)` over the unit's released items, with
  `theta_eff = theta * exp(-daysSinceLastAnswerInUnit / 120)` (unpracticed units drift back toward the prior);
  `seen` = items attempted / released. Bands: Started (seen >= 10%), Practicing (likely >= 55%, seen >= 25%), Solid
  (likely >= 65%, seen >= 50%), Board-ready (likely >= 75%, seen >= 70% including half the unit's case items). Adding
  items raises "of N" without lowering "likely". Never called a predicted score.
- **dailyPlan**: section 1.5.

### 6.5 Modules, interfaces and size

Sources in `src/boards/game/<bundle>/`; classic scripts concatenated per bundle into one IIFE; no dependencies, no ES
modules. Logic modules are pure and Node-testable (no DOM).

| Module (R1, bundle `chairside-core.js`) | Interface | Lines |
|---|---|---|
| `core/boot.js` | `BoardsGame.mount(root, api) -> {stop}`; checks `api.v === 1`; sets `root.dataset.ready = '1'`; test seams `?cs-seed=`, `?cs-date=` (honored on `file://` or with `cs-test=1`), `window.__cs.state()` | 200 |
| `core/fsm.js` | `transition(state, event, ctx) -> {state, effects}`, states HOME, SETUP, SHEET, VISIT, ITEM, LOCKED, ROUNDS, FEEDBACK, ATTENDING, SUMMARY, PAUSED, RESUME; each state has a `section` | 280 |
| `core/rng.js` | `rng(seed) -> {next, int, pick, shuffle}`, `stream(seed, name)` (xmur3 + mulberry32) | 60 |
| `core/bus.js` | `on, off, emit` | 40 |
| `core/store.js` | `load() -> save`, `patch(obj)`, `flush()`; schema `v:1`; autosave debounced 300 ms, server every 10 s while dirty and on `pagehide`; merge newest-wins, counters take the max (S15) | 300 |
| `sched/selector.js` | `buildShift({mode, seed, day, plan, history, srs, stats, units, cases}) -> {rows, promised}`; `nextPatient(run)`; pools due / callback / new / referral, shares and spacing (no item twice per shift, 20 h block unless due, max 3 per concept, max 3 patients in a row from one unit), follow-up visits for case items | 550 |
| `sched/ability.js` | `difficulty(stat, cog)`, `replay(history, items) -> theta`; calls `api.readiness` for display | 160 |
| `run/shift.js` | `start(mode, seed)`, `advance(run, outcome)`, `attendingCase(units, pool)`, outcome per patient | 420 |
| `run/scoring.js` | `score({conf, correct, flow, perks, skim}) -> {care, flow}`, `calibration(run)`; constants table | 180 |
| `run/perks.js` | `PERKS` (6 above), `draft(seed, owned) -> [3]`, `apply(hook, ctx)`, `validate()` | 220 |
| `ui/item.js` | `mountItem(el, qid, {mode, onLocked})` around `api.renderItem`; Sure / Unsure / Guess buttons as submit (ids `lock-sure`, `lock-unsure`, `lock-guess`); Rounds view | 600 |
| `ui/chart.js` | `renderBox(el, box, {collapsed})`: desktop left column, phone pinned "Chart" sheet; exact four INBDE headings | 300 |
| `ui/viewer.js` | `openFigure(key)`: zoom and pan for code-drawn figures (practice only; no zoom inside mock blocks) | 200 |
| `ui/home.js` | `renderHome(el, {readiness, week, today, reach})`: Today's shift button, practice days, Welcome back, Keep it | 380 |
| `gfx/facade.js` | `facadeSvg(units, readiness) -> svg`: static clinic front, one lit window per released unit by band | 280 |
| `gfx/portrait.js` | `portraitSvg(seed) -> svg`: geometric faces from a seed; names from a reviewed list, independent of conditions | 200 |
| `audio/sfx.js` | `sfx.play(name)`, `sfx.enable(on)`: WebAudio cues created after a gesture | 140 |
| Hub inline `readiness` + `dailyPlan` (in `src/boards/app/45-readiness-plan.js`) | section 6.4 | 270 |
| `tools/ci/game-tests.js` | section 6.6 | 500 |
| `tools/ci/game-smoke.js` | section 6.6 | 220 |
| **Total** | | **~5,500** |

Click targets carry stable ids or a first `data-cs` attribute (`lock-sure`, `slot-recall`, `rounds-next`), never per-item
ids. Controls stay out of Timmy's corner and the launcher. Canvas is not used in R1 (SVG + DOM); `requestAnimationFrame`
runs only during short transitions and honors reduced motion. Budgets: core bundle <= 110 KB gzipped, first item within
2 s of Start, idle CPU 0%.

Later bundles (each gated, section 6.7): `chairside-social.js` (Board Day weekly seeded run with `bd-<yy>w<ww>` scores,
class median and item split, census line), `chairside-bosses.js` (Code Blue, Brown Bag, Shadow Play, Phantom Pain; each
falls back to the attending's case when the bank can't meet it, S12), `chairside-lab.js` (Lab Bench `spot` items on
code-drawn preparations and the ADEX Gauntlet stations; R5), `chairside-audio.js` (one music layer). Cut: Grand Rounds
live raid, the INBDE simulation inside the game (it lives in the hub's Exam blocks), the 2.5D/WebGL map, decor shop,
seasons and mentor story lines until a gate shows return.

### 6.6 Tests

- `tools/ci/game-tests.js` (Node, fixtures under `tools/ci/fixtures/boards/`): identical shifts for identical seed and
  inputs; no repeats in a shift; every promised due item present; budget and governor; follow-up visits for case items;
  **policy simulation** (10,000 seeded shifts per setting, accuracy 0.25-0.95, 3-5 options, every protocol, through the
  real `scoring.js` and `fsm.js`): the honest policy is never beaten and always-Sure / always-Guess never rank first;
  perks validator; readiness fixtures (adding items never lowers `likely`); save migration and merge.
- `tools/ci/game-smoke.js` (Playwright, desktop 1366x860 and phone 390x844): open `hubs/boards/#arcade` with
  `?cs-seed=ci&cs-date=2027-01-15`, Start Today's shift, answer every item from `SH_EXPORT` (keyboard on desktop),
  check one `boards:answered` per answer, that case items show no verdict before Rounds, reload mid-visit and resume,
  finish, check the drill reads done; no horizontal overflow; no `pageerror`.

### 6.7 Release-1 slice and the gate

R1b ships the table in 6.5: Today's shift, Quick, Half and Full shifts, booked / walk-in / recall / callback patients,
Rounds, attending's case, 6 protocols, home facade, portraits, sfx, two trophies, About entry, tests. Out of R1:
Composure, Board Day, ghosts, census, raids, boss gimmicks, Lab Bench, Gauntlet, map, music, decor, seasons, mentors
beyond the authored `cue`, `spot` items.

**R1 exit gate** (4 weeks outside exam eves, from pings with the device field): at least 25% of hub visitors start a
shift; at least 30% of players play on a second day within 14 days; item and Rounds screens at least 85% of game time;
game-vs-bank accuracy on the same items within 5 points. Pass: build R2's social bundle and bosses. Fail: keep Today's
shift (it is the drill either way) and put the game budget into content.

---

## 7. Quality pipeline per unit

Every unit goes through the same six stages. Each stage is a separate agent with a bounded input; the verifier never
shares context with the writers.

| # | Stage | Input | Output | Gate to pass |
|---|---|---|---|---|
| 1 | **Facts research** | the unit outline (3.2), existing `facts-*.md` | the unit's section(s) of `docs/boards/research/facts-*.md` finished: paraphrased facts with ids, source URL and page/section, UNVERIFIED where a primary source could not be opened | every outline section has the facts its items will need; no fact rests on a prep company, a forum or a textbook we can't link |
| 2 | **Notes + blueprint** | facts, this spec (sections 3-5) | `notes.core.html`, `notes.deep.html`, `blueprint.json` (concepts with `hy` and sibling plan; item quota grid by section, FK, CC, cog, phase; 5-8 case outlines with their four-part boxes sketched) | build `--unit` passes on notes; every keyed sentence has a `data-ref` |
| 3 | **Items** (two batches: standalones; cases) | blueprint, notes, facts, section 4 | `items.js` drafts (`checked:null`) | build `--unit --include-drafts` passes all section 4.7 rules; the writer's own pass through 4.1 |
| 4 | **Independent adversarial verification** | items, facts, notes, section 4 only (no writer context); web access | `docs/boards/verify/<unit>-<batch>.json`: per item `{id, verdict:'pass'|'fix'|'reject', issues:[{check, detail, suggestion}]}` and `facts_errata` | every item judged on every check below |
| 5 | **Fixes** | verify file | edited `items.js`; facts errata fixed in `facts-*.md` first, then the bank grepped for that id; `checked` set on passed items; changed items listed | no item ships with an open issue; a changed key or distractor goes to stage 4b |
| 4b | **Re-verify changed items** (fresh agent) | changed items only | verdicts | pass, else one more fix round, else the item is dropped |
| 6 | **Build + CI** | sources | `hubs/boards/index.html`, `--report` numbers in the PR description | `--check`, syntax, smoke lint, game tests and game smoke all pass; unit quotas within range |

**Verification checks (every item, every one):**

1. **Key correct and best**: the key is right under the guideline version JCNDE uses, and no other option is equally
   defensible ("most appropriate" must hold for a general dentist, today, with only the box's facts).
2. **Every distractor definitely wrong**, each for the reason its `why` line gives; check older and newer guideline
   versions (an option right under the 2007 or a 2026 revision is a defect to fix in wording or tags).
3. **Current**: drug availability and names, dosing labels, classification versions; flag anything changed since the
   fact was recorded.
4. **No giveaway**: longest or most specific key, grammar or plural cues, stem words echoed only in the key, two options
   that mean the same, a box that lists only what the key needs, absolute words ("always", "never") only in distractors.
5. **No ambiguity**: units, numbers, timing, negatives, "first / next / most" all well defined; the case's box and stem
   hold every fact the reasoning needs (lesson 11); no leakage between items of a case.
6. **Citation supports the key and the why-lines**: open the primary source passage behind each distinct fact id the
   unit's keys rest on (once per unit, cached by fact id) and every URL ref.
7. **No copied text**: no 8+ consecutive words from a source, the official sample items, or another item; no prep-bank
   look-alikes.
8. **Style and tags**: section 4.1 rules, American English, plausible `cc`/`fk`/`cog`/`phase`, cue present where required
   and correct.

After release: student reports (Inbox) on boards items are read in each `/lessons-audit`; a fix gets a reply; a fact
change updates `facts-*.md` first, then every item citing it is re-verified. Every August (ADEX manual) and on any JCNDE
update, `--report` lists items by `ov` for the yearly re-check.

---

## 8. Release plan and token budget

### 8.1 Cost per unit (60 items, about half in cases)

| Stage | Tokens | Model / effort |
|---|---|---|
| Facts research (finish a section; more for units with no facts yet) | 100-400k (avg ~200k) | Opus, medium (primary sources; never lighter) |
| Notes + blueprint | ~130k | Sonnet, medium (drafting; verification catches errors) |
| Items, 2 batches | ~300k | Sonnet, high (distractor craft matters) |
| Verification, 2 batches | ~300k | **Opus, high** (never lighter, never the writer's context) |
| Fixes | ~90k | Opus, medium (touches keys) |
| Re-verify changed items | ~50k | Opus, high |
| **Per unit** | **~0.9-1.3M** (~1.0M with existing facts) | |

Economies built in: items cite facts of record, so verification opens each source passage once per unit, not once per
item; one item per line and `--unit` builds keep agent reads small; agents grep and read ranges, never whole large files.

### 8.2 Release 1 (three drops, about 6.6M tokens in all, +-30%)

| Drop | Contents | Est. tokens | Lands |
|---|---|---|---|
| **R1a** | migration v33, widget PR, build tool, hub app (cards, cases, bank, notes, home, readiness and daily plan, Exam blocks), outside edits, About; unit **medcx** (60 items, 30 in cases) | ~2.9M | week 1 (target Nov 2026) |
| **R1b** | units **pharm** and **perio** (60 each) | ~2.1M | week 2 |
| **R1c** | Chairside slice (section 6.7), About entry, trophies | ~1.6M | week 3 (target Dec 2026 - Jan 2027) |

Each drop fits one weekly budget with headroom (the limit was hit near 4M). Opus-heavy stages may weigh more against
the limit than their token count suggests; if a week is short, drop the Deep dive level of the last unit (Core ships
first) rather than any verification. Order is deliberate: notes and the bank were 70-80% of study time in past hubs
(lesson 1), so the hub ships useful before the game exists, and the game arrives with 180 verified items and ~24 cases
to serve.

### 8.3 Later releases (about one per 6-10 weeks, each ~2.5-4M; order to be matched to UAB's course calendar)

| Release | Units / features | When (approx.) |
|---|---|---|
| R2 | endo, anes, opath; game R2 if the R1 gate passes (Board Day, class median, census line, 3-4 bosses) | Feb-Mar 2027 |
| R3 | rad, oper, infect; top up medcx, pharm, perio to 84 with sibling items | Apr-May 2027 |
| R4 | pros, oms, peds, ortho | Aug-Sep 2027 (D3) |
| R5 | anat, physio, micro, gpath; ADEX track: `facts-adex.md`, `spot`, `rx`, `dlmulti`, Lab Bench | Nov 2027 - Jan 2028 |
| R6 | prof, pubh; full-length INBDE simulation in Exam blocks; ADEX Gauntlet stations; final quota balancing | Feb-Apr 2028 |
| Yearly | outline re-check by `ov`; JCNDE update list; ADEX manual each August | every Aug + on changes |

Before each release: `LESSONS.md` refresh check (CLAUDE.md), read the boards Live signals, and route the drill toward
the new unit for its first two weeks (lesson 18).

---

## 9. Work breakdown for release 1

Research work is listed with `kind: "notes"` (it exists to feed the notes and items). `est_tokens` are per work unit,
all-in. Each unit is sized for one agent; units without a dependency path between them can run in parallel.

```json
[
  {"id":"int-v33","kind":"integration","unit":null,"title":"Migration v33: game_saves, srs_state, stats/latest/reach RPCs, device in pings, boards patterns, link-code moves","outputs":["migration_v33.sql","supabase/schema.sql","applied via the Supabase connector"],"depends_on":[],"est_tokens":150000,"model_hint":"opus","effort_hint":"high"},
  {"id":"int-widget","kind":"integration","unit":null,"title":"Widget PR: SH_SRS opt-in with server sync and fuzz, shQuestionStats, device field, drill size/plan/ensureSet/set, pet fullscreen, ranks and replies names, 2 trophies","outputs":["widget/v3.js","widget/drill.js","widget/pet.js","widget/ranks.js","widget/replies.js","about/index.html (trophy rows)"],"depends_on":["int-v33"],"est_tokens":220000,"model_hint":"opus","effort_hint":"high"},
  {"id":"int-build","kind":"integration","unit":null,"title":"Build tool, src/boards skeleton, shell, CSS tokens, CI wiring (--check, syntax glob, boards lint in smoke.js, check.yml)","outputs":["tools/build-boards.js","src/boards/{config.js,shell.html,README.md,css/*}","tools/ci/syntax.js","tools/ci/smoke.js",".github/workflows/check.yml"],"depends_on":[],"est_tokens":220000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"int-cards","kind":"integration","unit":null,"title":"Hub app: state, item card (shuffle with authored-index mapping, why lines, cue, Report, class row, lockIn API), case renderer with Rounds, Questions mode","outputs":["src/boards/app/00-util.js","10-state.js","20-card.js","25-case.js","40-bank.js"],"depends_on":["int-build"],"est_tokens":260000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"int-plan","kind":"integration","unit":null,"title":"Readiness and dailyPlan (budget, governor, retirement, follow-up visits) with Node tests","outputs":["src/boards/app/45-readiness-plan.js","tools/ci/fixtures/boards/plan-*.json"],"depends_on":["int-build"],"est_tokens":160000,"model_hint":"opus","effort_hint":"high"},
  {"id":"int-notes-home","kind":"integration","unit":null,"title":"Notes mode (Core/Deep, tables, refs, practice links), Today/home with readiness, settings, SH_SECTION/SH_GOTO/SH_DRILL/SH_EXPORT","outputs":["src/boards/app/30-notes.js","60-home.js","90-boot.js","99-export.js"],"depends_on":["int-cards","int-plan","int-widget"],"est_tokens":220000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"int-mock","kind":"integration","unit":null,"title":"Exam blocks: timed standalone and case blocks, exam layout, review, sh:mock-done","outputs":["src/boards/app/50-mock.js","src/boards/css/mock.css"],"depends_on":["int-cards"],"est_tokens":160000,"model_hint":"sonnet","effort_hint":"medium"},
  {"id":"int-outside","kind":"integration","unit":null,"title":"Edits outside the hub: dashboard entry and examNote, review/ and publish-recap maps, sw.js, About Part 2/3, DEPLOY_NOTES, CLAUDE.md","outputs":["index.html","review/index.html","tools/publish-recap.js","sw.js","about/index.html","DEPLOY_NOTES.md","CLAUDE.md"],"depends_on":["int-notes-home","int-mock"],"est_tokens":120000,"model_hint":"sonnet","effort_hint":"low"},

  {"id":"facts-medcx-emerg","kind":"notes","unit":"medcx","title":"Facts research: finish facts-medical section 9 (emergencies, kit, BLS)","outputs":["docs/boards/research/facts-medical.md#9"],"depends_on":[],"est_tokens":180000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"facts-medcx-systemic","kind":"notes","unit":"medcx","title":"Facts research: finish facts-medical section 10 (infectious disease, bleeding disorders, renal, liver, thyroid, adrenal, sickle cell, COPD, transplant)","outputs":["docs/boards/research/facts-medical.md#10"],"depends_on":[],"est_tokens":220000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"notes-medcx","kind":"notes","unit":"medcx","title":"medcx Core + Deep dive notes and blueprint","outputs":["src/boards/units/medcx/{unit.js,notes.core.html,notes.deep.html,blueprint.json}"],"depends_on":["facts-medcx-emerg","facts-medcx-systemic","int-build"],"est_tokens":130000,"model_hint":"sonnet","effort_hint":"medium"},
  {"id":"items-medcx-a","kind":"items","unit":"medcx","title":"medcx 30 standalone items","outputs":["src/boards/units/medcx/items.js (standalones)"],"depends_on":["notes-medcx"],"est_tokens":140000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"items-medcx-b","kind":"items","unit":"medcx","title":"medcx 30 case items in about 8 cases","outputs":["src/boards/units/medcx/items.js (cases)"],"depends_on":["notes-medcx"],"est_tokens":160000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"verify-medcx-a","kind":"verify","unit":"medcx","title":"Independent verification of medcx standalones","outputs":["docs/boards/verify/medcx-a.json"],"depends_on":["items-medcx-a"],"est_tokens":140000,"model_hint":"opus","effort_hint":"high"},
  {"id":"verify-medcx-b","kind":"verify","unit":"medcx","title":"Independent verification of medcx cases","outputs":["docs/boards/verify/medcx-b.json"],"depends_on":["items-medcx-b"],"est_tokens":160000,"model_hint":"opus","effort_hint":"high"},
  {"id":"fix-medcx","kind":"items","unit":"medcx","title":"Apply medcx verdicts and facts errata, set checked, build --unit","outputs":["src/boards/units/medcx/items.js","docs/boards/research/facts-medical.md (errata)"],"depends_on":["verify-medcx-a","verify-medcx-b"],"est_tokens":90000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"verify2-medcx","kind":"verify","unit":"medcx","title":"Fresh re-verification of changed medcx items","outputs":["docs/boards/verify/medcx-2.json"],"depends_on":["fix-medcx"],"est_tokens":50000,"model_hint":"opus","effort_hint":"high"},
  {"id":"qa-r1a","kind":"integration","unit":null,"title":"R1a release QA: full build and CI, phone/desktop screenshots for Sam, --report quotas, PR text","outputs":["hubs/boards/index.html","PR description"],"depends_on":["verify2-medcx","int-outside"],"est_tokens":100000,"model_hint":"sonnet","effort_hint":"medium"},

  {"id":"facts-pharm","kind":"notes","unit":"pharm","title":"Facts research: top up facts-medical sections 3 and 8 (drug mechanisms used as distractors, ADA acute-pain guidance, antifungals/antivirals, substance use, interactions)","outputs":["docs/boards/research/facts-medical.md#8"],"depends_on":[],"est_tokens":100000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"notes-pharm","kind":"notes","unit":"pharm","title":"pharm Core + Deep dive notes and blueprint","outputs":["src/boards/units/pharm/{unit.js,notes.core.html,notes.deep.html,blueprint.json}"],"depends_on":["facts-pharm","int-build"],"est_tokens":130000,"model_hint":"sonnet","effort_hint":"medium"},
  {"id":"items-pharm-a","kind":"items","unit":"pharm","title":"pharm 33 standalone items","outputs":["src/boards/units/pharm/items.js (standalones)"],"depends_on":["notes-pharm"],"est_tokens":140000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"items-pharm-b","kind":"items","unit":"pharm","title":"pharm 27 case items in about 7 cases (may include medcx/perio items)","outputs":["src/boards/units/pharm/items.js (cases)"],"depends_on":["notes-pharm"],"est_tokens":160000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"verify-pharm-a","kind":"verify","unit":"pharm","title":"Independent verification of pharm standalones","outputs":["docs/boards/verify/pharm-a.json"],"depends_on":["items-pharm-a"],"est_tokens":140000,"model_hint":"opus","effort_hint":"high"},
  {"id":"verify-pharm-b","kind":"verify","unit":"pharm","title":"Independent verification of pharm cases","outputs":["docs/boards/verify/pharm-b.json"],"depends_on":["items-pharm-b"],"est_tokens":160000,"model_hint":"opus","effort_hint":"high"},
  {"id":"fix-pharm","kind":"items","unit":"pharm","title":"Apply pharm verdicts and errata, set checked, build --unit","outputs":["src/boards/units/pharm/items.js"],"depends_on":["verify-pharm-a","verify-pharm-b"],"est_tokens":90000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"verify2-pharm","kind":"verify","unit":"pharm","title":"Fresh re-verification of changed pharm items","outputs":["docs/boards/verify/pharm-2.json"],"depends_on":["fix-pharm"],"est_tokens":50000,"model_hint":"opus","effort_hint":"high"},

  {"id":"facts-perio","kind":"notes","unit":"perio","title":"Facts research: new facts-dental section 11 (nonsurgical therapy and reevaluation, adjuncts and local delivery, host modulation, surgery overview, supportive therapy intervals, peri-implant disease management, abscess and necrotizing disease)","outputs":["docs/boards/research/facts-dental.md#11"],"depends_on":[],"est_tokens":200000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"notes-perio","kind":"notes","unit":"perio","title":"perio Core + Deep dive notes and blueprint","outputs":["src/boards/units/perio/{unit.js,notes.core.html,notes.deep.html,blueprint.json}"],"depends_on":["facts-perio","int-build"],"est_tokens":130000,"model_hint":"sonnet","effort_hint":"medium"},
  {"id":"items-perio-a","kind":"items","unit":"perio","title":"perio 30 standalone items","outputs":["src/boards/units/perio/items.js (standalones)"],"depends_on":["notes-perio"],"est_tokens":140000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"items-perio-b","kind":"items","unit":"perio","title":"perio 30 case items in about 8 cases (charts as text or code-drawn figures)","outputs":["src/boards/units/perio/items.js (cases)","src/boards/figures/perio-chart-*.js"],"depends_on":["notes-perio"],"est_tokens":170000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"verify-perio-a","kind":"verify","unit":"perio","title":"Independent verification of perio standalones","outputs":["docs/boards/verify/perio-a.json"],"depends_on":["items-perio-a"],"est_tokens":140000,"model_hint":"opus","effort_hint":"high"},
  {"id":"verify-perio-b","kind":"verify","unit":"perio","title":"Independent verification of perio cases","outputs":["docs/boards/verify/perio-b.json"],"depends_on":["items-perio-b"],"est_tokens":160000,"model_hint":"opus","effort_hint":"high"},
  {"id":"fix-perio","kind":"items","unit":"perio","title":"Apply perio verdicts and errata, set checked, build --unit","outputs":["src/boards/units/perio/items.js"],"depends_on":["verify-perio-a","verify-perio-b"],"est_tokens":90000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"verify2-perio","kind":"verify","unit":"perio","title":"Fresh re-verification of changed perio items","outputs":["docs/boards/verify/perio-2.json"],"depends_on":["fix-perio"],"est_tokens":50000,"model_hint":"opus","effort_hint":"high"},
  {"id":"qa-r1b","kind":"integration","unit":null,"title":"R1b release QA: rebuild, CI, --report quotas across 3 units, review/ paging, screenshots, PR text","outputs":["hubs/boards/index.html","review/index.html","PR description"],"depends_on":["verify2-pharm","verify2-perio","qa-r1a"],"est_tokens":90000,"model_hint":"sonnet","effort_hint":"medium"},

  {"id":"game-core","kind":"game","unit":null,"title":"Chairside core: boot (test seams), fsm, rng, bus, store with server sync and merge","outputs":["src/boards/game/core/{boot,fsm,rng,bus,store}.js"],"depends_on":["int-notes-home"],"est_tokens":220000,"model_hint":"opus","effort_hint":"high"},
  {"id":"game-adapter","kind":"game","unit":null,"title":"Hub adapter BOARDS_GAME_API v1, Clinic lobby tile, lazy loader with ?v= hash, build step for game bundles","outputs":["src/boards/app/80-game-adapter.js","tools/build-boards.js (game step)"],"depends_on":["int-cards","int-plan"],"est_tokens":120000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"game-sched","kind":"game","unit":null,"title":"Selector (pools, shares, spacing, follow-up visits, seeded) and ability","outputs":["src/boards/game/sched/{selector,ability}.js"],"depends_on":["game-core","int-plan"],"est_tokens":220000,"model_hint":"opus","effort_hint":"high"},
  {"id":"game-run","kind":"game","unit":null,"title":"Shift flow, Sure/Unsure/Guess scoring with Flow and skim guard, 6 protocols with key-access validator","outputs":["src/boards/game/run/{shift,scoring,perks}.js"],"depends_on":["game-core","game-sched"],"est_tokens":200000,"model_hint":"opus","effort_hint":"high"},
  {"id":"game-ui","kind":"game","unit":null,"title":"Item host with lock-in and Rounds, patient box chart (desktop column, phone sheet), figure viewer","outputs":["src/boards/game/ui/{item,chart,viewer}.js","src/boards/css/game-shell.css"],"depends_on":["game-core","game-adapter"],"est_tokens":220000,"model_hint":"sonnet","effort_hint":"high"},
  {"id":"game-home-art","kind":"game","unit":null,"title":"Home view, SVG clinic facade lit by readiness, seeded portraits and name list, synthesized sfx (off by default); screenshots for Sam","outputs":["src/boards/game/ui/home.js","src/boards/game/gfx/{facade,portrait}.js","src/boards/game/audio/sfx.js"],"depends_on":["game-core"],"est_tokens":200000,"model_hint":"sonnet","effort_hint":"medium"},
  {"id":"game-tests","kind":"game","unit":null,"title":"game-tests.js (determinism, budget, policy simulation, perks validator, readiness, saves) and game-smoke.js (desktop + phone Today's shift)","outputs":["tools/ci/game-tests.js","tools/ci/game-smoke.js","tools/ci/fixtures/boards/*",".github/workflows/check.yml"],"depends_on":["game-run","game-ui","game-home-art"],"est_tokens":220000,"model_hint":"opus","effort_hint":"medium"},
  {"id":"game-integrate","kind":"integration","unit":null,"title":"Chairside integration: About Part 4 entry, trophy wiring, sw.js bump, section names, perf budgets, DEPLOY_NOTES, R1c QA and PR","outputs":["about/index.html","sw.js","DEPLOY_NOTES.md","hubs/boards/game/chairside-core.js","PR description"],"depends_on":["game-tests","qa-r1b"],"est_tokens":140000,"model_hint":"sonnet","effort_hint":"medium"}
]
```

Totals: R1a ~2.9M (int-* 1.51M + medcx 1.27M + qa 0.1M), R1b ~2.1M (pharm 0.97M + perio 1.08M + QA 0.09M), R1c ~1.5M (game, incl. integration).
Merge order: `int-v33` -> `int-widget` (own PR, perio/MSK smoke-tested) -> R1a hub PR -> R1b PR -> R1c PR.

---

## 10. Open questions for Sam

1. **Course calendar**: which courses (and exam dates) does the class have from D2 spring to D4? It sets the unit
   order, the "Keep it" lines and the course-exam cram waves.
2. **Release 1 units**: OK to start with medcx, pharm and perio, and to ship in three weekly drops (hub + medcx first)?
3. **Exam timing**: when does UAB expect the INBDE, and which ADEX parts (DLOSCE plus which clinical exams, CIF or not)?
   Until then `exams: []` and "~Aug 2028".
4. **Server copy of review schedules** (`srs_state`) and game saves tied to the visitor id: OK?
5. **Your review role**: screenshots of each visual piece before merge (game art), plus a spot check of 10 random items
   per unit?
6. **Images**: code-drawn figures only, or also openly licensed real radiographs and photos (CC0 / CC BY, credited)?
7. **Names**: "Chairside" for the game and "Clinic" for its tab; "Boards Hub: INBDE + ADEX" for the hub?
