# Boards hub: architecture and build contract

Status: complete (written 2026-10-04 against main @ e2c3fc6). File:line references are to that commit.

## 1. Summary

- A hub is one page `hubs/<id>/index.html` with one inline IIFE script, then `supabase-2.117.2.js` (defer) and
  `widget/v3.js` (defer) carrying `data-hub`, `data-answered-event`, `data-default-mode`. The widget brings search,
  class stats, SRS + Daily Drill, ranks, eggs, Timmy, inbox, clicks and the service worker.
- The hub must provide: `#modeSwitch [data-mode]` + `[data-mode-panel]` panels, `.qcard[data-qid]` cards with
  `[data-role=classdata-result]`, one `recordAnswer` that dispatches `boards:answered {qid, lec, correct, choice|picks}`,
  `window.SH_SECTION`, `SH_GOTO`, `SH_DRILL`, and last of all `window.SH_EXPORT = {` (the CI lint injects its hook
  before the last occurrence of that exact text and reads `QUESTIONS/LECTURES/READINGS/READINGS_PLAIN` from scope).
- Keep `exams: []` on the dashboard and in `SH_EXPORT` until real dates exist; show "~Aug 2028" through a new
  optional `examNote` field (two small reads in `index.html`). Any real date drives archiving at 22:00.
- Long review intervals: an opt-in `window.SH_SRS = {steps:[1,3,7,14,30,60,120]}` read by `widget/v3.js:553`;
  other hubs unchanged.
- Recommended architecture: sources in `src/boards/` (per-unit `questions.js`, notes HTML), a dependency-free
  `tools/build-boards.js` that assembles one `hubs/boards/index.html` with the bank + notes inline, a CI
  `--check` for build freshness, and the game in separate `hubs/boards/game/*.js` files loaded on demand (added to
  `syntax.js`, entered by `smoke.js`).
- Projected size of one file: about 2-3 MB raw / 0.6-0.9 MB gzipped. Fine with the game split out. Per-unit lazy
  loading breaks or weakens SH_EXPORT, Golden Probe, mastery, review/, drill, the lint and dump-banks; avoid it
  unless the build passes about 3.5 MB.
- New game ids and achievement kinds need a migration (v33) that replaces `submit_arcade_score` /
  `record_achievement` whole; prefer a bounded pattern for boards so later additions need no migration.

## 2. How a hub plugs in (load order, required globals, events)

A hub is one page, `hubs/<id>/index.html`, plus the shared widget layer it loads. Perio is the reference
(`hubs/perio/index.html`, 5,784 lines, ~750 KB).

**Page skeleton (perio):**

- `<head>`: icons + manifest with `?v=2` (`hubs/perio/index.html:6-12`), Google Fonts (`:24`), `../../widget/v3.css` (`:25`),
  then one hub `<style>` block (`:26-774`).
- `<body>`: `#app > header.hub-header` with `#sh-ribbon-back` (back button slot the widget fills), `<h1>`, `nav#modeSwitch`
  (role=tablist, buttons `data-mode="..."` + `aria-selected`), `.hub-meta` (`#sh-ribbon-name`, `#countdownPill`,
  `#progressSummary`, `#themeBtn`) (`:777-797`); `<main>` with one `section.mode-panel#panel-<mode>[data-mode-panel=<mode>]`
  per mode (`:799-803`); `#toastHost` (`:808`).
- One inline `<script>` (no attributes) holding a single IIFE (`:809-5779`, `'use strict'`). Everything (LECTURES,
  QUESTIONS, READINGS...) is `var` inside that IIFE, i.e. lexical, not global. The last statements are
  `window.SH_SECTION`, `window.SH_GOTO`, `window.SH_DRILL`, then `window.SH_EXPORT = {` (`:5766`) and `})();` (`:5778`).
- Then, in this order (`:5780-5782`):

```html
<script src="../../widget/vendor/supabase-2.117.2.js" defer></script>
<script defer src="../../widget/v3.js" data-hub="boards" data-answered-event="boards:answered" data-default-mode="compendium"></script>
<script>document.addEventListener("DOMContentLoaded", function(){ if (window.shWireClassStats) window.shWireClassStats(".qcard[data-qid]"); });</script>
```

The hub script calls `boot()` synchronously (`:5715`) because the markup above it is parsed; the deferred widget runs
after it, so `SH_EXPORT` etc. already exist when v3.js executes.

**What v3.js reads from its own `<script>` tag** (`widget/v3.js:13-18`): `data-hub` (the id used in every RPC `p_hub`,
localStorage keys `sh_srs_<hub>`, `sh_drill_<hub>`, presence channel `presence:<hub>`), `data-answered-event` (default
`<hub>:answered`), `data-default-mode` (default `compendium`). v3.js then loads, itself, `eggs.js` (`:2145`),
`ranks.js` (`:2151`), `pet.js` (`:2158`), `timmy.js` (`:2165`), `drill.js` (`:2171`), `clicks.js` (`:2203`),
`replies.js` (`:2210`), and registers `../sw.js` (`:32-34`). `?sh_export=1` (`:25`) disables all network/presence so
`review/` can read `SH_EXPORT` in a hidden iframe.

**The answered event (the one choke point).** Every answer anywhere in the hub (bank, drill, mock, notes quick checks,
arcade games) goes through one hub function that updates hub state and dispatches the event. Perio
`recordAnswer(qid, lecId, correct, choice)` (`hubs/perio/index.html:3411-3423`):

```js
document.dispatchEvent(new CustomEvent('boards:answered', { detail:{
  qid:'b-pharm-0123', lec:'pharm',          // lec = unit id
  correct:true,
  choice: 2,        // MCQ: the AUTHORED index picked (0 = key in perio's convention), else null
  picks:  null      // select-all: array of authored indexes ticked, else null
}}));
```

v3.js listener (`widget/v3.js:1158-1170`): `srsRecord`, `record_answer`, then `record_choice` if `choice` is a number,
else `record_choices` if `picks` is a non-empty array (`migration_v28`), `record_personal_answer` (feeds XP/ranks),
`record_correct_streak`, confetti every 5, nuke at 100. Perio passes the 4th argument as a number for MCQ and as an
array for multi (`:3546`, `:3639`, mock `:4022`); sequence/match/recall pass nothing.

**Other events a hub fires or listens to:**

- `sh:mock-done` `{detail:{correct, total}}` when a mock is submitted (`hubs/perio/index.html:4025`); ranks.js records
  `record_mock_score` and the `mock90` trophy; recap "Mock exam ace" uses 20+ question mocks.
- Widget events a hub may listen to: `sh:pref` (setting changed), `sh:name`, `sh:rank`, `sh:egg-local`.
- Eggs, Timmy and the pet stand down "during a mock": they test the current section against `/(^|\/)mock/`
  (`widget/eggs.js:28`, `widget/timmy.js:17`, `widget/pet.js:1120`), so the mock sub-view's section string must have a
  segment starting with `mock` (perio: `compendium/mock-exam`). A game boss fight that is exam-like should NOT match.

**Required globals the hub defines (contract):**

| Global | Required? | Used by |
|---|---|---|
| `window.SH_EXPORT` | yes (CI lint fails without the marker line) | search, toughest questions, drill labels, SRS exam cap, archived notice, eggs, review/ admin, recap |
| `window.SH_SECTION()` | strongly recommended | per-section time (`activity_pings`) |
| `window.SH_GOTO(go)` | yes if `sections` carry `go` | search result jump (`widget/v3.js:1800`) |
| `window.SH_DRILL` | yes for the Daily Drill | `widget/drill.js` |
| `.qcard[data-qid]` cards with `[data-role="classdata-result"]` | yes | class % + Report button (`shWireClassStats`, `widget/v3.js:671`) |
| `#modeSwitch [data-mode]` + `[data-mode-panel]` | yes | smoke test, widget mode detection |
| `#sh-ribbon-back`, `#sh-ribbon-name`, `#themeBtn` | yes | widget back button, name badge, inbox button inserted before `#themeBtn` |

Widget functions a hub may call: `window.shTTS.speak(containerEl, btn, audioUrl)` / `.stop()` / `.listening()`
(`widget/v3.js:475-495`), `window.shMindMap.render(el, data, {accent})` (`:1987`), `window.shFlash(el)` (`:605`),
`window.shSrsDue()` (`:598`), `window.shOpenFlag(qid)` (`:1885`), `window.shGetClassStats(qids, cb)`,
`window.shSupabase` (shared client, `:37`), `window.shEditName()`, `window.shConfettiTheme`.

## 3. SH_EXPORT and the other hub-provided globals

**`window.SH_EXPORT`** (perio `hubs/perio/index.html:5765-5776`). The widget reads it lazily, at use time
(`getExport()`, `widget/v3.js:1627-1631`; SRS/exam helpers `:558`, `:569`; eggs `exp()`, `widget/eggs.js:35`), so a hub
may extend `questions`/`sections` after load, with the caveats in section 13.

```js
window.SH_EXPORT = {
  lectures: [ { id:'pharm', title:'Pharmacology', who:'', status:'taught' } ],      // status 'taught' (or absent) = eligible for Golden Probe / Cavity Search
  questions: [ { id:'b-pharm-0001', lec:'pharm',
                 text:'stem (Patient box rows prepended as "Key: value. ")',
                 hint:'key text — explanation',                                         // search + toughest questions
                 choices:[...] | null, answer: 0 | null, correct:[0,2] | null } ],      // review/ shows key + most-picked wrong option
  sections: [ { kind:'Notes', where:'Pharmacology', text:'one paragraph', lec:'pharm', go:{ v:'notes', lec:'pharm', k:12 } } ],
  hints: [ { lec:'pharm', quote:'...' } ],                                              // professor-quote egg; optional for boards
  exams: [ { label:'INBDE', date:'2028-08-01' } ]                                        // see section 11 on approximate dates
};
```

- `sections[].kind` is free text shown as the result label; Cavity Search only uses `kind` matching `/^notes$/i` with
  `text.length >= 140` from a taught lecture (`widget/eggs.js:654-656`) and then finds the paragraph in the DOM via
  `.reading-prose p, .reading-prose li` (`:661`). `go` is opaque to the widget and handed back to `SH_GOTO`.
- `exams` drives: SRS cap at the eve of the next exam (`widget/v3.js:557-565`), exam-day nuke suppression (`:567`,
  `:979`, `:1306`), the "This hub is archived" dialog from 10 pm on the last date (`:2175-2196`) and Timmy's exam-day
  greeting (`widget/pet.js:1067-1072`). The dashboard's countdown and check-ins use its own `HUBS.exams`, not this. **Empty `exams` is valid** and
  switches all of that off.
- Golden Probe picks `questions[hash(hub|day) % n]` among taught lectures (`widget/eggs.js:205-211`): the list must be
  complete and stably ordered at the time eggs.js runs, or the day's probe changes under people (see section 13).
- `?sh_export=1` must still produce a full `SH_EXPORT` synchronously or very soon: `review/` reads it in a hidden iframe
  (section 11).

**`window.SH_SECTION()`** returns `"<mode>/<sub>"`, max 80 chars (`widget/v3.js:1062-1074`). Perio
(`hubs/perio/index.html:5689-5695`): `compendium/<view id>`, `arcade/<game id or lobby>`, `review/<lec or all>`. Without
it the widget guesses from `#modeSwitch` (aria-selected or `.is-active/.active`) and the first visible active element
carrying `data-view|sub|ctab|gtab|dtab|tab|group|section|pane|panel` (`:1025-1061`). While the drill sheet is open the
section is `drill/daily` regardless (`:1064`). Recap awards key off section names: Bookworm = sections ending in
`notes`/`lecture-notes`, Arcade champion = `arcade/*` (DEPLOY_NOTES 2026-09-28), so keep those spellings for boards
(e.g. `compendium/lecture-notes`, `arcade/<game>` or `game/<area>` only if recap is updated).

**`window.SH_GOTO(go)`** (`hubs/perio/index.html:5740-5751`): switch mode/view, render, then `shFlash` the target.

**`window.SH_DRILL`** (`hubs/perio/index.html:5754-5763`, contract in `widget/drill.js:14-21`):

```js
window.SH_DRILL = {
  scope: function(){ return ''; },                    // label or ''
  pool: function(){ return QUESTIONS.map(q => ({ id:q.id, lec:q.lec,
          last: /* latest try on this device */ true|false|null, hy: q.hy ? 'why it is high-yield' : '' })); },
  render: function(el, qid){ /* draw the hub's own card into el, wire it to recordAnswer */ return true; }
};
```

**`window.shOpenFlag(qid)`** is provided by the widget (`widget/v3.js:1885`); `shWireClassStats` adds a Report button
to every `.qcard[data-qid]` it wires, so a hub only needs the card markup.

## 4. Question object schema (perio, the reference hub)

Perio's bank is a literal array `var QUESTIONS = [ {...}, ... ]` (`hubs/perio/index.html:1263-1651`), indexed right after
(`:1653-1656`). Every item:

| Field | Meaning |
|---|---|
| `id` | unique, stable forever (stats, SRS, choices, flags are keyed by it; never reuse an id for a different item) |
| `lec` | lecture/unit id; the lint fails if it is not in `LECTURES` (`tools/ci/smoke.js:34`) |
| `type` | `mcq`, `multi`, `sequence`, `match`, `recall` (note: `sequence`, not `seq`) |
| `stem` | question text; `white-space:pre-line` keeps `\n` (needed for `2stmt`) |
| `choices`, `answer` | MCQ: options and the key's index. **Perio authors the key at index 0** and shuffles at render (`choiceOrder`, `:3433`); `data-idx` keeps the authored index and that is what `choice` reports |
| `correct` | multi: array of key indexes (`:1507`); partial credit `(hits - wrong)/n`, floor 0 (`multiScore`, `:3514-3518`) |
| `steps` | sequence: steps in correct order (shuffled on render) |
| `pairs` | match: `[[left, right], ...]` |
| `answer` (string) | recall: model answer; self-graded "I had it right / I missed it" |
| `ex` | explanation; required for everything except recall (lint) |
| `src` | source key -> `SRC_LABEL` chip (`:3438`) |
| `cue` | optional mnemonic shown only after a miss (`cueHTML`, `:3455`; `.qx-cue`) |
| `pbox` | optional Patient Box: `[[label, value], ...]` drawn above the stem (`pboxHTML`, `:3508-3511`) |
| `fmt` | `'2stmt'` (choices kept in authored order: both true / both false / 1T2F / 1F2T, `:1589`) or `'except'` (all-EXCEPT/NOT) |
| `img` | key into a hub diagram map (`SUTURE_DIAGRAMS`), drawn by `figHTML` (`:3506`); answer-revealing labels carry `.sd-hint` and are hidden inside `.qcard-figure` |
| `mid` | `mid:false` = outside midterm scope (legacy, now unused) |

Examples (`:1266`, `:1270`, `:1273`, `:1286`, `:1507`):

```js
{ id:'q1-02', lec:'diagnosis-tx-planning', type:'mcq', cue:'CAL = PD + GR...', stem:'...', choices:['3 mm','7 mm','11 mm','4 mm'], answer:0, ex:'...', src:'lecture' },
{ id:'q1-M01', lec:'...', type:'multi', stem:'... Select all that apply.', choices:[5 options], correct:[0,1], ex:'...', src:'lecture' },
{ id:'q1-21', lec:'...', type:'sequence', stem:'Put ... in order.', steps:['first','second','third','fourth'], ex:'...' },
{ id:'q1-08', lec:'...', type:'match', stem:'Match ...', pairs:[['RT1','...'],['RT2','...'],['RT3','...']], ex:'...' },
{ id:'q1-05', lec:'...', type:'recall', stem:'Name the two findings...', answer:'Attachment loss AND radiographic bone loss...' }
```

**Card markup (the CSS/JS hooks other code relies on)** (`qCardHTML`, `:3459-3504`):
`.qcard[data-qid][data-qtype]` > `.qcard-top` chips, `.pbox`, `.qcard-figure`, `p.qcard-stem`, then
`.qcard-choices[data-qtype=mcq] > button.qcard-choice[data-idx]`, multi `button.qcard-choice.multi[data-multi-idx]` +
`[data-action=multi-check]`, sequence `.qcard-seq-steps > .qcard-choice[data-step-idx]` + `.qcard-seq-tools`
(undo/clear), match `.qcard-match-cols > .qcard-match-item[data-side][data-pair-idx]`, recall `[data-action=reveal]` +
`[data-role=grade-wrap]`. Every type ends with `div.qcard-explain[data-role=explain]` holding `.qx-body`, the cue and
`CLASS_ROW` (`[data-role="classdata-result"]`, `:3458`), which the widget fills with the class %. One delegated click
handler per container (`wireQuestionContainer`, `:3530`, guarded by `container.__wired`) routes all types to
`recordAnswer`. Per-render state (`SEQ_STATE`, `MATCH_STATE`, `MULTI_STATE`) is deleted on every render (the
2026-09-16 bug: state keyed globally by qid made a question uncompletable the second time it appeared).

**Boards additions to the schema** (recommended, all optional and ignored by existing code): `ov` (outline version,
e.g. `'INBDE-DoD-2024'`/`'ADEX-2026'`, per DECISIONS.md), `exam:['inbde','adex']`, `area` (INBDE foundation
knowledge / clinical content code), `refs` (public sources used to fact-check), `hy` (high-yield reason for the drill),
`added` (date, for "new" chips). Whatever the key position, `choice` must be the AUTHORED index: `review/index.html:632` and
`tools/lessons-join.py:60` compare it with the authored `answer`. Key-first authoring (perio's convention) is simplest,
but it makes the longest-choice lint (section 10) the only guard against a key that stands out, so write distractors of
similar length.

## 5. Notes, reading levels, Listen and narration

- **Two levels.** `var READINGS = {}` then `READINGS['<lec id>'] = \`<p>...</p><h3>...</h3>...\`` (HTML in template
  literals; `hubs/perio/index.html:1658-1661`), and `var READINGS_PLAIN = {}` the same way (`:2020`). The level is
  `STATE.ui.level` (`'full'|'plain'`), toggled by `.level-seg [data-level]` (`:3888`); notes render into
  `#reading-pane .reading-prose` (`:3891`). Keep `.reading-prose` and `p/li/h3/h4` children: the search index
  (`shSearchSections`, `:5720-5725`), `SH_GOTO` flash (`:5742-5743`) and Cavity Search (`widget/eggs.js:661`) use them.
- **Listen.** A `#sh-tts-btn` (class `sh-tts-btn`) in `.reading-tools`; click calls
  `window.shTTS.speak(proseEl, btn, 'audio/' + lecId + '-' + level + '.mp3')` (`:3908-3913`). With an audioUrl the
  widget plays the file with seek, +/-15 s, speed, resume and lock-screen controls; without one (or if it fails) it
  falls back to browser speech synthesis with word highlighting (`widget/v3.js:475-495`). `shTTS.stop()` on every
  view/level/mode change (`:3830`, `:3874`, `:5678`). The widget styles the button with `var(--card,#fff)`; re-skin it
  with hub tokens (perio `:255-262`) or it is white-on-white in dark mode (DEPLOY_NOTES 2026-09-24).
- **Narration files** `hubs/<id>/audio/<lec>-full.mp3` and `<lec>-plain.mp3` (Kokoro `af_heart`, CLAUDE.md). The lint
  fails if `hubs/<id>/audio/` exists and any READINGS / READINGS_PLAIN entry lacks its mp3 (`tools/ci/smoke.js:58-62`);
  if the folder does not exist there is no check. Text and audio must never drift: editing either level's text means
  regenerating that mp3 in the same PR. Size: perio 72 MB for 18 files, MSK 43 MB.
  **Boards implication:** with ~20+ units x 2 levels that grow over 22 months, narration doubles every content edit's
  cost. Recommended: generate narration per unit only when a unit is marked complete, or chunk narration per section
  (`<unit>-<section>-full.mp3`) so a one-paragraph edit regenerates one short file. Chunking needs either a widget
  change (playlist) or a hub-side wrapper that calls `speak` per section; the CI rule only knows `<lec>-full/plain.mp3`,
  so a chunked scheme must also update `tools/ci/smoke.js:58-62` (or set READINGS keys per section).
- **Other per-lecture content** (all keyed by lecture id): `EXAM_HINTS` `{lec,type,quote,takeaway}` (`:1841`),
  `CRAM_CONTENT` `{lec,points:[...]}` (`:3802`), `MINDMAPS[lec] = {label, children:[...]}` rendered by
  `window.shMindMap.render(el, data, {accent})` (`:2208`, `:3899-3904`), `REF_SECTIONS` `{id, lec, title, body:()=>html}`
  for the Review mode tables (`:3681`; rows become search entries, `:5728-5732`). For boards, "exam hints" (verbatim
  professor quotes) do not apply; the equivalent is "outline notes" or "high-yield traps".

## 6. Modes, sub-views, activity pings, layout, CSS tokens, icons, phone layout

**Modes and sub-views (perio).** Modes: `compendium`, `review`, `arcade` (`hubs/perio/index.html:784-788`;
`MODE_RENDERERS`, `:5674`). `setMode` sets `aria-selected` on `#modeSwitch [data-mode]`, toggles `hidden` on
`.mode-panel`, stops TTS/arcade, saves `STATE.ui.mode` (`:5675-5683`). `location.hash` = a mode name opens it (`:5712`);
`#drill` is reserved by the drill (`widget/drill.js:353`). Compendium sub-views (`COMPENDIUM_VIEWS`, `:3814-3823`):
course-info, lecture-notes, question-bank, mock-exam, weak-spots, active-recall, cram-sheet, exam-hints, rendered as
`nav.subtabs#compendium-subnav > button.subtab[data-view][aria-selected]` into `#compendium-content` (`:4211-4221`).

**What the smoke test needs** (`tools/ci/smoke.js:88-101`): `#modeSwitch [data-mode]` buttons; inside
`[data-mode-panel="<mode>"]`, sub-tab buttons matching `.subtabs button` or `#compendium-subnav button` (each is
clicked, and the page must not scroll sideways by >1 px at 1366 px and 390 px); in the `arcade` mode,
`#panel-arcade .ar-grid [data-game]` tiles, a `[data-start]` button and a `[data-back]` button. Any JS error on the
page (`pageerror`) fails CI. A boards mode named something other than `arcade` (e.g. `game`) is not clicked into beyond
its sub-tabs, so either name the game mode `arcade` with that markup, or extend smoke.js (section 14).

**Activity pings.** 25 s per ping, banked per section every second, paused when hidden, and stopped after 15 min with
no input unless `shTTS.listening()` (`widget/v3.js:1076-1100`). Define `SH_SECTION` so a long game session reads as
`arcade/<game>` and notes as `compendium/lecture-notes` (see section 3).

**State.** One localStorage key per hub (perio `perio-d2-compendium-state-v1`, `:3331`) with
`answered{qid:{correct,seen,lastCorrect}}`, `totalCorrect`, `totalSeen`, `activeDates{}`, `streak`, `ui{}`,
`arcade{}` (`:3332-3343`); `loadState` merges defaults (`:3344-3358`). The dashboard reads this key read-only
(`readProgress`, section 11), so keep `answered/totalSeen/activeDates` (perio shape) and never rename the key.
Theme: site-wide `sh_theme` (`''|'light'|'dark'`), applied as `html[data-theme]` (`:5698-5707`).
**Boards:** 1,200 items x ~40 bytes in `answered` is ~50 KB, fine. The game's save should live in its own key
(e.g. `boards-game-v1`) with a `v` field and migrations, so the bank state and the game save can evolve separately.

**CSS tokens** (`:30-95`): `:root` defines `--bg --surface --surface-2/3 --ink --ink-soft --ink-faint --line
--line-strong --accent --accent-ink --accent-soft --good(-soft) --bad(-soft) --caution(-soft) --tag-<color>(-soft)
--shadow(-lg) --radius --font-display/body/mono`; dark values are repeated under
`@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){...} }` and `:root[data-theme="dark"]{...}`.
`widget/ranks.js applyAccent` overrides `--accent/--accent-ink/--accent-soft` and sets `html[data-sh-accent]` +
`--sh-tex`; `widget/v3.css:589-596` then paints the metal texture on `.btn.primary`, `.qs-btn.primary`,
`.pill.countdown`, `.toggle`, `.qcard-choice.multi[data-selected|picked]::before`, `.bar i` (not inside `.tag-*`),
`.weak-meter i`. So: primary buttons must be `.btn.primary`, progress bars `.bar > i` (`:158-179`), or the unlock does
nothing in this hub. Reduced motion: global rule (`:96`). Game world colors are fixed tokens independent of theme
(`--ar-*`, `:49-51`).

**Icons.** Inline SVG strings in `ICON_PATHS` (24x24, stroke 1.8, `currentColor`; `:3267`) and `icon(name, cls)`
(`:3316-3319`); static markup uses `<span data-ic="name">` filled in `boot()` (`:5697`). No emoji (perio revamp,
DEPLOY_NOTES 2026-09-24).

**Phone layout** (`:724-773`): at <=560 px the header wraps and `#modeSwitch` becomes a full-width labeled row; <=380 px
hides mode icons; sub-tabs scroll horizontally with a fade mask at <=760 px, wrap at >=761 px; grids collapse with
`minmax(0,1fr)` (never plain `1fr` next to long words). The widget adds a phone bottom bar (3 items + More + Drill)
and reserves space for it, so leave ~90 px of bottom padding in full-height views (perio arcade `:725`). Never size
fixed overlays with `vh/vw` (text-size zoom on `<html>` breaks them; DEPLOY_NOTES 2026-09-30).

## 7. Mock exam, arcade games, score submit

**Mock exam (perio).** A compendium sub-view (`mock-exam`) with `EXAM_FORMAT` (`hubs/perio/index.html:3966`) and
`EXAM_STATE {phase:'setup'|'running'|'results', pool, answers, startedAt, ...}` (`:3967`); the pool is drawn
round-robin across lectures (`roundRobin`, `:3971-3975`). Picks are held until submit; `submitMockExam`
(`:4019-4027`) calls `recordAnswer` once per item (with the MCQ index / multi picks array as the 4th argument), then
dispatches `sh:mock-done {correct, total}`. Section string `compendium/mock-exam` makes eggs/pet/Timmy stand down.
**Boards:** an INBDE-style mock (blocks with a timer, case sets, an ADEX-style block) fits the same contract;
`sh:mock-done` with `total >= 20` and >=90% grants the `mock90` trophy and posts to `mock_scores` (recap "Mock exam ace").

**Arcade framework (perio "Pocket Arcade", `:4394-5672`).**

- `var GAME_IMPL = {}` registry (`:4401`): `GAME_IMPL.<id> = function(g, C){ return { mount(root), stop(), rescope? } }`
  (e.g. `:4706`, `:4856`). `ARCADE` IIFE (`:4402-4703`) holds `GAMES` metadata `{id, name, cat, kind, color, hex, bank,
  desc, thumb()}` (`:4404-4414`), the lobby (`.ar-grid` of `button.ar-tile[data-game]`, `:4648`), and the shared
  context `CTX = {A (STATE.arcade), SFX, bankPool, termPool, dealer, dealMCQ, scopeSelectHTML, ...}` (`:4640`).
- Shell markup per game: `.ar-wrap > .gm > .gm-bar` (back `[data-back]`, `[data-fs]` full screen, HUD
  `[data-hud=...]`), a stage, `introHTML` overlay with `[data-start]` (`:4586-4591`), `overHTML` with personal best,
  missed-question review and "Class top 5" (`:4592-4597`).
- Loops: `requestAnimationFrame` with a frame-time clamp (`:4956`, `:5402`), `cancelAnimationFrame` on stop; key
  handlers check `running`; `ARCADE.stop()` is called when leaving the mode (`:5677`).
- Answers inside games: bank questions come from `bankPool(scope)` = MCQs without `pbox`, `img` or `2stmt`
  (`:4450`), and every answer goes through `recordAnswer(q.id, q.lec, ok)` (e.g. `:4770`, `:4894`, `:5229`), so they
  count for class stats, SRS, XP, the pet. (They do not pass `choice`, so game answers do not feed
  `question_choices`; boards should pass the authored index when the game knows it.)
- Scores: `finish()` saves `STATE.arcade.best/plays`, then `submit_arcade_score {p_visitor, p_hub, p_game, p_score <=
  200000}` and `get_arcade_leaderboard {p_hub, p_game, p_visitor, p_limit}` via `window.shSupabase` (`:4479-4495`,
  `:4598-4611`). The server drops unknown game ids silently (`migration_v11.sql:20-25`) and more than one score per
  visitor/hub/game per 10 s (`:27-31`).
- Arcade colors are a fixed dark world (`--ar-*`), not themed.

**Boards game.** The deep game should reuse exactly these contracts: answers via the hub's `recordAnswer` (one choke
point), `submit_arcade_score` for any leaderboard (new game ids need a migration, section 11), section strings
`arcade/<game>[/<area>]`, `stop()` that cancels rAF/audio/listeners, and the `[data-game]/[data-start]/[data-back]`
markup so CI enters it. Long-term progression (months) needs its own save key and, if it should follow people across
devices, a server table (`record_achievement` only stores whitelisted one-off kinds).

## 8. Daily Drill and spaced review (long-interval option)

**Where the intervals live.** Not in drill.js: v3.js owns spaced review. `SRS_KEY = "sh_srs_" + HUB`,
`SRS_STEPS = [1, 2, 4, 7]` (`widget/v3.js:553`); record `{b: right answers in a row, due, t: last day}`; a miss sets
`b = 0` (due tomorrow); only the first right answer of a day advances `b` (`:572-583`); `srsDue` caps any due date at
the eve of the next exam in `SH_EXPORT.exams` (`:557-565`, `:571`). A one-time pass (`sh_srs_<hub>_v = "2"`) pulled
older long reviews in (`:584-596`). `window.shSrsDue()` lists due ids (`:598`), `shEggHooks.srs/day` expose the map to
drill.js (`:2142`).

**drill.js** (`widget/drill.js:1-27`) builds 10 a day per hub (`SIZE`, `:31`): up to 6 SRS-due, up to 8 with older
misses, then high-yield (class accuracy from `question_stats` with 5+ attempts, plus the hub's `hy`), max 3 per lecture,
from lectures already studied (`:82-110`); frozen per day in `sh_drill_<hub>`; "10 more"; streak in `sh_drill_days`.
Opens from `[data-sh-drill]`, the phone bar, the desktop chip, and `#drill` (`:338`, `:353`).

**Per-hub long intervals without touching other hubs (recommended change, ~10 lines in v3.js):**

```js
// hub page, before the widget runs (inline script, so it exists when the deferred v3.js executes):
window.SH_SRS = { steps: [1, 3, 7, 14, 30, 60, 120], examCap: false, v: 'boards-1' };

// widget/v3.js, replacing line 553:
var SRS_CFG = window.SH_SRS || {};
var SRS_STEPS = (Array.isArray(SRS_CFG.steps) && SRS_CFG.steps.length) ? SRS_CFG.steps.map(Number) : [1, 2, 4, 7];
// srsDue(): apply the exam-eve cap only if SRS_CFG.examCap !== false
// the one-time "_v" migration pass (:584-596) must skip hubs that set SH_SRS (or compare SRS_CFG.v)
```

Alternative: a `data-srs-steps="1,3,7,14,30,60,120"` attribute on the v3.js script tag (read with `ds.srsSteps`), which
keeps the setting next to `data-hub`. Either way perio/MSK keep `[1,2,4,7]` because they define nothing.
Considerations for boards: (1) with a real exam date later, keep `examCap` true so reviews still land before the exam,
and optionally compress in the last 60 days; (2) drill.js's due count (`:307-308`) and badge work unchanged;
(3) `SIZE = 10` may be small for a 1,200-item bank with long gaps; if boards wants 20, add `SH_DRILL.size` read in
drill.js (`hook().size || 10`), again opt-in; (4) SRS is per device (`localStorage`); "Link my devices" moves server
rows only, so a boards SRS that must survive 22 months and phone changes would need a server table later (out of scope
for v1, but worth a note on the About page).

**Drill pitfall for a big bank:** drill.js fetches all `question_stats` rows for the hub in one select
(`widget/drill.js:72`), as does v3.js "toughest questions" (`widget/v3.js:1655`). Supabase's API returns at most its
"max rows" setting (1,000 by default) per request, so once boards passes ~1,000 answered items the rest silently
disappear from high-yield picks. Before the bank passes 1,000, page with `.range()` or add an RPC that returns only the
hardest N.

## 9. Ranks, trophies, eggs, pet hooks

All of these come free with v3.js (`widget/v3.js:2134-2172`); the hub only has to provide the hooks below.

- **`window.shEggHooks`** (`widget/v3.js:2135-2142`): `{hub, answeredEvent, visitor, supabase, send(payload), name,
  section(), online(), toast, confetti, prefGet, prefSet, esc, statsPanel(), srs(), day()}`. eggs.js, ranks.js, pet.js
  and drill.js all `mount(H)` with it.
- **ranks.js**: XP is server-side from `personal_answers` (10 first-time right, 2 repeat right, 1 miss, 600/day cap,
  +20 per study day; `migration_v15.sql:3-35`, rescaled in v16), so boards answers raise everyone's handpiece rank like
  any hub. Hub mastery = latest-correct count / `SH_EXPORT.questions.length` (`widget/ranks.js:524-530`), tiers Bronze
  50 / Silver 75 / Gold 90 / Crown 100%, recorded once as `mastery-*` achievements with `hub = 'boards'`
  (`:590-599`). **Boards consequences:** the denominator must be the whole bank (a lazily-filled `questions` array would
  inflate mastery and award permanent badges early); the bank grows for 22 months, so mastery % falls as units are
  added (badges already earned stay). Mock trophy and `mock_scores` on `sh:mock-done` (`:679-683`).
- **eggs.js** (`widget/eggs.js`): Golden Probe needs `SH_EXPORT.lectures[].status` (`taught` or absent) and a stable
  `questions` list (`:205-211`); Cavity Search needs `sections` of kind `Notes` (>=140 chars) and `.reading-prose p/li`
  in the DOM (`:651-661`); professor quotes need `lectures[].who` + `hints` (no professors in boards: omit both and
  the egg just never triggers); Full Arch is once per hub (`sh_egg_arch_done_<hub>`, server badge `fullarch:<hub>`). Plaque Boss and Floss Chain use the `presence:<hub>` channel. All stand down when
  `section()` matches `/(^|\/)mock/` (`:28`) and when Surprises is off (`sh_pref_eggs`).
- **pet.js**: fixed in the bottom-left corner of every hub (`.shpet-home`, `left:14px; bottom:12px; width:64px;
  z-index:9989`, `widget/pet.js:830`), hidden on mock sections (`:1117-1126`); heals from the answered event (`:1093`);
  greets by `SH_EXPORT.exams` (`:1067-1072`). **Keep game controls out of the bottom-left 90x90 px** (or hide the pet
  while the game is full screen, which needs a pet hook such as treating `arcade/*` full screen like mock).
- **timmy.js**: overlay egg; stands down on mock sections (`widget/timmy.js:17`).
- **clicks.js**: names click targets from `id`, then the first `data-*` attribute, then label
  (DEPLOY_NOTES 2026-09-25), so give boards buttons meaningful `id`/`data-*` names; question-level attributes are
  skipped and numbers collapsed, so per-item ids do not explode `ui_clicks`.

## 10. CI: syntax.js, smoke.js, bank lint rules, dump-banks

CI = `.github/workflows/check.yml` (Node 22, Playwright 1.56.1): `node tools/ci/syntax.js`, then `node tools/ci/smoke.js`.

**syntax.js** (`tools/ci/syntax.js`):
- Pages: `index.html`, `review/index.html`, `about/index.html`, and `hubs/<every folder>/index.html` that exists (`:4`).
- Only inline scripts written exactly `<script>` (no attributes) are extracted and `node --check`ed (`:10`). A
  `<script type="module">`, `<script id=...>` or external `src` file in a hub is **not** checked here.
- Line-anchored conflict markers `^<<<<<<<`, `^=======$`, `^>>>>>>>` in those pages (`:11`).
- A fixed list of widget files is checked (`:13`); `pet.js`, `timmy.js`, `recap.js` are not in it (a known gap).
  **Any new hub-side `.js` file (game, unit data) must be added to this list, or syntax.js must glob `hubs/*/**/*.js`.**

**smoke.js** (`tools/ci/smoke.js`):
- Serves the repo on 127.0.0.1; all other network is stubbed (Supabase REST returns `[]`, `get_display_name` returns a
  name; websockets closed; everything else aborted) (`:20-27`). Service workers blocked (`:69`).
- Hub discovery: every `hubs/<dir>` that has an `index.html` (`:15`). So `hubs/boards/` is picked up automatically, and
  any other folder with an `index.html` under `hubs/` is treated as a hub too (do not put a second `index.html` in, e.g.,
  `hubs/boards-src/`).
- Desktop 1366x860 and phone 390x844 (`:67`). Per page: any `pageerror` fails; horizontal overflow >1 px fails
  (dashboard and every sub-tab, `:76`, `:94`). It clicks every `#modeSwitch [data-mode]`, every
  `[data-mode-panel=<mode>] .subtabs button` / `#compendium-subnav button`, and in `arcade` every
  `#panel-arcade .ar-grid [data-game]` then `[data-start]` then `[data-back]` (`:88-101`). Waits are short (150-800 ms).
- **The lint hook** (desktop only, `:81-86`): fetches `hubs/<hub>/index.html`, finds the LAST occurrence of the exact
  text `window.SH_EXPORT = {` and injects, just before it,
  `window.__CI = { QUESTIONS: typeof QUESTIONS!=="undefined"?QUESTIONS:[], LECTURES: ..., READINGS: ..., READINGS_PLAIN: ... }`.
  Consequences: the marker must be in `index.html` itself (not an external file); `QUESTIONS`, `LECTURES`, `READINGS`,
  `READINGS_PLAIN` must be identifiers in scope at that point (perio: `var`s in the same IIFE); everything the lint
  should see must already be in those variables when that line runs; and the marker text must not appear later in the
  file (e.g. in a comment). If `__CI` is missing, CI fails with "could not read its question data" (`:87`).
- **Bank lint rules** (`lint`, `:30-63`), all on `QUESTIONS`:
  1. duplicate `id` -> fail (`:33`);
  2. `lec` not in `LECTURES[].id` -> fail (`:34`);
  3. `type:'mcq'`: fewer than 2 choices, `answer` out of range, or duplicate choices (case-insensitive, trimmed) -> fail (`:35-40`);
  4. every non-`recall` item needs a non-empty `ex` -> fail (`:41`);
  5. `type:'match'`: the same left or right text twice -> fail unless `hub:qid` is in `SAME_ANSWER_OK` (only
     `perio:q4-L27`, `:29`, `:42-48`);
  6. heads-up only (not a failure): `sequence` with >5 steps, `multi` with >6 options (`:49-51`);
  7. longest-choice rule: among MCQs with >=3 choices, the key strictly longer (in characters) than every other
     choice in more than 40% of them -> fail (`:53-57`);
  8. narration: if `hubs/<hub>/audio/` exists, every `READINGS[lec]` needs `audio/<lec>-full.mp3` and every
     `READINGS_PLAIN[lec]` needs `audio/<lec>-plain.mp3` -> fail (`:58-62`). Keys are iterated over `LECTURES`, so
     reading entries keyed by something other than a lecture id are not checked.
  Not checked: `multi.correct` indexes, `sequence.steps` content, `pbox`, `fmt`, `img` keys, `cue`, `src` labels.
  **Boards should add** (in smoke.js `lint`, harmless to other hubs): `multi.correct` range/uniqueness,
  `img` key exists, and per-hub rules behind `if (hub === 'boards')`: required `ov` (outline version) and `refs`.
- `tools/dump-banks.js` uses the same hook (`window.__DUMP = {Q, L}`) after an 800 ms wait (`:23-28`) and writes
  `<out>/<hub>.json` for `/lessons-audit` and `tools/lessons-join.py`. Same constraint: the full bank must be in
  `QUESTIONS` within ~800 ms of load.

## 11. Edits outside the hub (dashboard, review, About, sw.js, migrations, DEPLOY_NOTES)

**Dashboard (`index.html`).**

1. **Class + ring color.** Add `--c-boards` / `--c-boards-soft` in all three token blocks (light `:52-54`, dark media
   `:69-71`, `[data-theme=dark]` `:82-84`), a `CLASSES.boards = { name, ring:'boards', egg, icon }` entry
   (`:727-734`), and `HUB_RING.boards = 'boards'` (`:771`). `ringVars(r)` reads `--c-<ring>` (`:803`).
2. **`HUBS` entry** (`:735-745`; contract comment `:718-726`):

   ```js
   { id:"boards", cls:"boards", title:"Boards Hub: INBDE + ADEX", code:"Boards · INBDE + ADEX",
     exams:[],                       // no date until Sam confirms one: see below
     examNote:"INBDE + ADEX ~Aug 2028",
     updated:"2026-10-xx",
     desc:"...", modes:["Compendium","Question bank","Mock exam","<game name>"],
     stateKey:"boards-state-v1" }
   ```

   **Approximate date without auto-archiving.** Everything date-driven keys off `exams[].date`: `lastExam` /
   `archiveAt` move a hub to `ARCHIVED_HUBS` at `ARCHIVE_HOUR` (22:00) on its last date (`:757-768`), cards vanish
   `CARD_DAYS` (10) later, check-in buttons appear from `CHECKIN_HOUR` (8) and pop-ups run up to `DEBRIEF_DAYS` (60)
   (`:746-753`, `:1313-1320`); `nextExam` / `upcomingExams` put the soonest dated exam of any hub in the hero
   countdown (`:968-976`, `:1024-1047`) and the card's "Exam in N days" (`:1100-1107`). With `exams:[]`, `lastExam`
   returns null, so the hub never archives, never offers check-ins, never takes the hero, and the card shows no
   date. That is the safe default (DECISIONS.md). To still show "~Aug 2028", add one optional field and two small
   reads: in `hubCardHTML` (`:1101-1107`) `else if (hub.examNote) due = '<span class="due">' + ICON.cal +
   esc(hub.examNote) + '</span>';` and, optionally, in the hero fallback branch (`:1053-1060`) the same note. Do
   **not** put an approximate date into `exams` (no `approx` flag exists; every reader treats a date as real). Also
   keep `SH_EXPORT.exams` empty in the hub until the date is real: the widget would otherwise cap SRS at the eve,
   show "This hub is archived" after 10 pm on that date (`widget/v3.js:2175-2196`), mute the nuke and make Timmy
   say "exam day" (`widget/pet.js:1067-1072`). When real dates arrive, add both exams (INBDE and ADEX parts) to
   `HUBS.exams` and `SH_EXPORT.exams`; the hub then archives at 22:00 on the LAST one, so if ADEX parts run months
   after the INBDE, use `hideCardOn` or keep the ADEX date last on purpose.
3. **`stateKey` + `readProgress`** (`:916-937`): it understands the msk shape (`seen/totalAnswered/days`) and the perio
   shape (`answered{qid:{lastCorrect}}/totalSeen/activeDates`). Use the perio shape and the card works unchanged.
4. **`HUB_LABEL.boards = "Boards"`** (`:770`; `ALL_HUBS` derives from it, `:772`, used for changelog/stats rows).
5. **`ARCADES`** (`:774-781`): add `{ hub:"boards", title:"<game>", from:"Boards hub", games:[["<id>","<Name>"], ...] }`
   only for game modes that post to `submit_arcade_score`; `money:[ids]` formats scores as dollars.
6. The hero's "Daily drill" link and the card drill row use `hubs/boards/#drill` and `sh_drill_boards` /
   `sh_srs_boards` (`:945-960`): nothing to add.

**Admin page (`review/index.html`).** `HUB_LABEL.boards` (`:239`); `HUB_COLOR.boards` and `HUB_TITLE.boards` for the
Recap renderer (`:766-767`); nothing in `ARCHIVED` (`:241`) or `ARCHIVE_BANK` (`:769`) until the hub is archived
(then export the bank to `question-banks/boards-question-bank.json` and add it). The Questions tab and Recap read
question text from a hidden `hubs/boards/index.html?sh_export=1` iframe on its `load` event (`:610-625`, `:782`), so
`SH_EXPORT.questions` must be complete by `window.onload` (section 13).

**Other hub-name maps** (cosmetic, but add `boards`): `widget/replies.js:12` `HUB_NAME`, `widget/ranks.js:330`
`HUB_NAMES` (fallback title-cases the id), `tools/publish-recap.js:13-14` `HUB_COLOR`/`HUB_TITLE` (it also reads the
exam date from `index.html` and refuses without one; pass `--exam`).

**About page (`about/index.html`)** (standing rule, CLAUDE.md step 5): Part 3 "Hub modes" (`:142`) describes
Perio's tabs: add the boards hub's modes; Part 4 "Arcade games" (`:153`) gets the game with a `new` tag; any new trophy
goes into Part 9 (`:240-267`) as `<tr data-k="<kind>">` (secret ones with the `spoil`/`spoil-ph` pair) and the count
"All 24 trophies" changes in both places (`:98`, `:240`); any setting (e.g. long-interval review, game sound) goes in
Part 2. `tools/ci/syntax.js` parses the About page's inline scripts.

**Service worker (`sw.js`).** Add `'hubs/boards/'` to `PRECACHE` (`:6-7`) and bump `VERSION` (`'sh-v10'`, `:5`)
whenever the precache list changes. It is network-first for every same-origin GET and caches what it fetches
(`:21-27`), so lazily fetched unit/game files are cached on first use; mp3/mp4/webm and range requests are never
cached (`:19`). `manifest.webmanifest` needs no change (one site-wide app, `start_url ./`).

**Migrations** (run once via the Supabase connector's `apply_migration`, commit `migration_vNN.sql`, refresh
`supabase/schema.sql`; next free number is v33):

- **Arcade game ids**: `submit_arcade_score` silently drops ids not in its list (`migration_v10.sql:38`, replaced by
  `migration_v11.sql:12-35`). A boards game id needs `create or replace function submit_arcade_score(...)` with the
  full current list plus the new ids (copy v11 exactly, keep the 10-second throttle and the 1..200000 range).
  Recommendation: whitelist by a bounded pattern for boards, e.g.
  `if p_game not in (...existing...) and not (p_hub = 'boards' and p_game ~ '^[a-z][a-z0-9-]{1,23}$') then return;`
  so future boards modes or seasonal events don't each need a migration. `get_arcade_leaderboard` takes any id.
- **Achievement kinds**: `record_achievement` has a fixed `p_kind not in (...)` list, replaced whole each time
  (`migration_v15.sql:54`, `v17.sql:7-8`, `v31.sql:124-126`, latest `v32.sql:39-48`). New game trophies need the same
  whole-function replacement, the `TROPHIES` entry in `widget/ranks.js:297` (with `clue` if secret), the About row, and
  `get_trophy_stats` picks them up automatically (`migration_v32.sql:31`). For a game with many milestone badges,
  prefer a pattern (`p_kind ~ '^bd-[a-z0-9-]{1,30}$'`) stored with `hub='boards'`, and keep only a few as site trophies.
  `achievements` is keyed `(visitor_id, kind, hub)` (`supabase/schema.sql:782-787`), so a badge can be recorded once.
- **Game save across devices / seasons**: no table exists; a long-term game needs a new table + RPCs (e.g.
  `game_saves(visitor_id, hub, slot, data jsonb, updated_at)` with a size cap like `get_hub_recap`'s 200000-char check)
  and must respect "Link my devices" (`redeem_link_code` moves a device's rows onto the code maker's id: add the new
  table to that function).
- RPCs that only check `length(p_hub) <= 40` (answers, clicks, pings) need nothing for a new hub id.

**`DEPLOY_NOTES.md`**: one line at the top of "Recent major changes" after merge (date, what, files, any migration
"applied via the connector", and "Boards: sources live in `src/boards/`; edit those, then run the build"), plus the
site changelog (`log_changelog(p_secret, p_hub, p_message)`) if `ADMIN_SECRET` is available. Also add `boards` to the
widget list sentence in "Shared infrastructure" (`DEPLOY_NOTES.md`, the hubs list after `data-hub`).

## 12. Evaluation: sources in repo + build script

**The problem.** Perio and MSK are "built from split sources in that Project's session; the deployed `index.html` is
the single-file build" (DEPLOY_NOTES 2026-09-24, 2026-09-23). Since then, 15+ DEPLOY_NOTES entries end with
"Perio/MSK Project: carry this into the split sources, or the next single-file build reverts them" (e.g. 2026-10-02
cues and undo, 2026-10-01 two-statement/EXCEPT items, 2026-09-29 giveaway audit). The real source of truth is outside
the repo, so every Claude Code fix to the built file is at risk. A 22-month hub edited by many sessions and
workflows cannot work that way.

**Recommendation: sources in the repo, one dependency-free Node build, CI checks the build is fresh.**

- `src/boards/` holds everything a human or agent edits (layout in section 15). Unit content is plain CommonJS
  (`module.exports = [...]`), which allows comments, trailing commas and template literals for notes, needs no
  parser, and `require()`s cleanly. Notes can be `.html` fragments (no Markdown dependency; the hubs already author
  notes as HTML strings).
- `tools/build-boards.js` (Node 22, no npm packages; CI only installs Playwright):
  1. loads `src/boards/units/*/unit.js` in `UNITS` order, validates (unique ids, `lec` = unit id, required boards
     fields such as `ov`, `refs`), and fails loudly;
  2. concatenates `src/boards/css/*.css` into the `<style>`, `src/boards/app/*.js` into the single inline `<script>`
     IIFE, and emits the data as `var LECTURES = [...]; var QUESTIONS = [...]; var READINGS = {...};
     var READINGS_PLAIN = {...};` inside that IIFE, then the app code, then `window.SH_SECTION/SH_GOTO/SH_DRILL`,
     and LAST `window.SH_EXPORT = {` (exactly once in the file, so the CI hook works);
  3. writes `hubs/boards/index.html` with a banner comment: generated, do not edit, edit `src/boards/` and run
     `node tools/build-boards.js`;
  4. copies/emits any lazy files (`hubs/boards/game/*.js`, optional `hubs/boards/data/*.js`), with a content hash
     or `?v=` stamp so browsers and `sw.js` pick up new versions;
  5. prints sizes per part and fails over a budget (e.g. 3.5 MB raw for `index.html`);
  6. `--check` mode: build to memory and compare with the committed output; non-zero exit if they differ.
- CI: add `node tools/build-boards.js --check` as the first step of `.github/workflows/check.yml` (before
  `syntax.js`). A PR that hand-edits `hubs/boards/index.html`, or edits `src/boards/` without rebuilding, then fails,
  which is exactly the drift DEPLOY_NOTES keeps warning about.
- Commit the built output (GitHub Pages serves `main` as-is; there is no build step on Pages). Merge conflicts in the
  generated file are resolved by rebuilding from the merged sources, never by hand (say so in the banner and in
  `CLAUDE.md`).
- Per-unit files make parallel work safe: two workflow agents writing different units touch different files, and
  question ids carry the unit prefix (`b-<unit>-NNNN`), so collisions are rare and the build catches the rest.

**Costs.** One more tool to keep working; the build output is large in diffs (mitigate with stable ordering and one
item per line so diffs stay local); contributors who edit the built file by habit get a CI failure (that is the
point). Net: strongly positive for a long-lived, multi-agent hub.

## 13. Evaluation: size and performance (one file vs lazy-loaded units)

**Baseline (measured).** Perio `index.html` is 751,801 bytes (227 KB gzipped; GitHub Pages serves gzip) for 357
questions: QUESTIONS 206 KB (~580 B/item), READINGS 77 KB + READINGS_PLAIN 72 KB (9 lectures), CSS 63 KB, mind maps
23 KB, Pocket Arcade (9 games) 103 KB. MSK: 498 KB / 160 KB gzipped.

**Boards projection.** 1,200 items x ~700-900 B (boards items carry `refs`, `ov`, cases) = 0.85-1.1 MB; notes for
~20-25 units x 2 levels at perio's depth (~8-15 KB per unit per level) = 0.4-0.75 MB; app code + CSS + review tables
~0.3-0.4 MB; one deep game 0.3-0.8 MB of code (art drawn in code, so no image weight). Total about **2-3 MB raw,
~0.6-0.9 MB gzipped** if everything is one file. Parsing that much JS on a mid-range phone costs roughly 100-300 ms,
and perio builds the search `sections` eagerly at load (`shSearchSections`, `hubs/perio/index.html:5719`) by parsing
every notes string into DOM, which grows linearly with notes.

| Concern | A. One file (all inline) | B. Bank + notes inline, game separate (recommended) | C. Per-unit data lazy-loaded + game separate |
|---|---|---|---|
| First load | ~0.8 MB gz, all parsed | ~0.5-0.7 MB gz; game only when opened | smallest (shell + index) |
| `SH_EXPORT` | complete at load | complete at load | must still list every question (Golden Probe hashes over the list, `widget/eggs.js:205-211`; mastery divides by its length, `widget/ranks.js:524-530`; `review/` reads it on iframe `load`, `review/index.html:617-625`), so a full question index ships inline anyway, which is most of the bytes |
| Widget search | everything | everything (`sections` can be a getter to build lazily) | only loaded units, unless a build-time text index ships inline |
| Daily Drill | works | works | `SH_DRILL.pool()` needs every item; `render()` must be async-capable (drill.js calls it synchronously, `widget/drill.js:188`) or the unit must already be loaded |
| CI lint hook / `dump-banks` | full bank in `QUESTIONS` | same | sees only what is inline at the `SH_EXPORT` line; lazy units escape the lint unless smoke.js/dump-banks learn to load them |
| syntax.js | inline script checked | inline checked; game files must be added to syntax.js | every data file must be added |
| Narration lint | works | works | `READINGS` keys must still exist inline |
| `sw.js` / offline | precache `hubs/boards/` = everything offline | hub offline; game cached on first play (runtime cache, `sw.js:21-27`); add game files to `PRECACHE` for offline-first | only visited units offline |
| Cavity Search, eggs | work | work | Notes sections missing until loaded |

**Recommendation: B**, with a budget. Keep the bank, the notes and the core UI in the single built `index.html`
(every widget, CI, review/ and drill contract holds unchanged), make `SH_EXPORT.sections` a lazy getter (or build it
on first search) so load time does not scale with notes, render notes HTML from the strings only when a unit is
opened (as perio does), and load the game from separate files on demand. Revisit C only if the build's size report
passes ~3.5 MB raw; if it does, the first thing to move out is the plain-English notes (`READINGS_PLAIN`) and review
tables, not the bank, and the lint/dump/drill gaps above have to be closed in the same PR.

Notes on audio: narration mp3s are not cached by `sw.js` (`:19`) and not part of the page weight; at perio's rate
(~4 MB per lecture-level) 25 units x 2 levels would be ~200 MB in the repo over time. Generate narration only for
finished units and consider a lower bitrate (mono 48-64 kbps is plenty for speech).

## 14. Evaluation: game module integration

**Option 1, inline in `index.html`** (how perio and MSK do their arcades). Pros: covered by `syntax.js` for free,
same IIFE scope (direct access to `QUESTIONS`, `recordAnswer`, `icon`, `STATE`), offline with the page. Cons: adds
0.3-0.8 MB that 98% of visits never use (LESSONS: both arcades got 1.4-1.7% of hub time), every game edit rebuilds and
re-downloads the whole hub, and a game bug at parse time breaks the entire hub.

**Option 2, separate files `hubs/boards/game/*.js`, loaded on demand (recommended).** The hub inline code keeps a thin
adapter; the game never reaches into hub internals except through it:

```js
// inline (hub side), defined before the game loads
window.BOARDS_GAME_API = {
  hub: 'boards',
  questions: function(filter){ /* returns item objects (bank is inline) */ },
  answer: function(qid, correct, choice){ /* calls recordAnswer(qid, lec, correct, choice) */ },
  submitScore: function(gameId, score){ /* submit_arcade_score via window.shSupabase */ },
  board: function(gameId, n){ /* get_arcade_leaderboard */ },
  save: { get: function(){}, set: function(obj){} },     // localStorage 'boards-game-v1' (+ server later)
  section: function(sub){ /* sets what SH_SECTION reports, e.g. 'arcade/<game>/<area>' */ },
  sfxMuted: function(){}, reducedMotion: function(){}, theme: function(){}
};
// game file
window.BoardsGame = { mount: function(rootEl, api){ /* returns { stop() } */ } };
```

Loading: when the game mode (or its `[data-start]`) is first used, insert
`<script src="game/engine.js?v=<hash>">` (relative to the hub, like the hub's `audio/` paths) and mount on `onload`;
show a loading state; on error show a message and keep the rest of the hub working.

**CI coverage for option 2 (must be done in the same PR):**
- `tools/ci/syntax.js:13`: add the game files (or glob `hubs/*/game/*.js` and `hubs/*/*.js`). Without this a syntax
  error reaches `main`.
- `tools/ci/smoke.js`: today it only enters games in a mode named `arcade`, via `#panel-arcade .ar-grid [data-game]`,
  `[data-start]`, `[data-back]`, with 250-400 ms waits (`:95-100`). Either use exactly that markup and mode name
  (render the lobby tiles from inline metadata synchronously, load the engine on `[data-start]`, and keep the first
  frame cheap), or add a boards-specific step that waits for a `data-ready` attribute on the game root and clicks
  through its first screens. `pageerror` then covers runtime errors in the loaded script.
- The game's question use goes through `api.answer`, i.e. `recordAnswer`, so the bank lint already covers the
  items it shows; game-only content (e.g. dialogue, item names) should live in `src/boards/game/` data files that the
  build validates.
- `sw.js`: add the game files to `PRECACHE` if the game should work offline before its first play; bump `VERSION`.

**Option 3, ES modules (`<script type="module">`).** Cleaner imports, but `syntax.js` ignores module scripts and
`node --check` needs `.mjs` to parse `import`; the build step would have to handle it. Not worth it here: a classic
script with one global (`window.BoardsGame`) is enough.

**Game rules that come from the existing contracts:** one `requestAnimationFrame` loop with a dt clamp, cancelled in
`stop()` (perio `:4956`, `:5402`); pause on `visibilitychange`; keyboard handlers ignore events from inputs; touch
targets >= 44 px; no controls in the bottom-left 90 px (Timmy) or under the widget launcher bottom-right and the phone
bottom bar (~70-90 px); canvas sized from its container (never `vh/vw`, DEPLOY_NOTES 2026-09-30) and re-sized on
`resize`; honor `prefers-reduced-motion`; WebAudio created only after a user gesture and muted with the hub's
setting; scores sent once per run (server throttles 10 s); sections `arcade/<game>[/<area>]` (and never containing a
segment starting with `mock`, unless it is an exam simulation). Answers count toward XP/ranks, so a game must not let
anyone farm XP by re-answering instantly (XP is capped at 600/day server-side, but a self-graded or trivially
repeatable question in a game still inflates `question_stats`): pass the authored `choice` index and answer each
item at most once per encounter.

## 15. Recommended file layout

```
src/boards/                         # the only place anyone edits boards content or code
  README.md                         # how to edit + build; "hubs/boards/index.html is generated"
  config.js                         # hub id 'boards', title, UNITS order, exams: [], SRS steps, state key, size budget
  shell.html                        # <head>/<body> skeleton with {{STYLE}} / {{SCRIPT}} slots (perio's header markup)
  css/                              # tokens.css (light/dark), base.css, cards.css, notes.css, game-shell.css, phone.css
  app/                              # concatenated in name order into the single inline IIFE
    00-util.js 10-state.js 20-cards.js 30-notes.js 40-bank.js 50-mock.js
    60-review.js 70-weak-drill.js 80-game-loader.js 90-boot.js
    99-export.js                    # SH_SECTION, SH_GOTO, SH_DRILL, then `window.SH_EXPORT = {` (last)
  units/<unit-id>/                  # one folder per outline unit, e.g. pharm, oral-path, endo, perio, ...
    unit.js                         # { id, num, title, exam:['inbde','adex'], area, status, ov, audio:false }
    questions.js                    # module.exports = [ { id:'b-pharm-0001', ... }, ... ]
    notes.full.html  notes.plain.html
    review.js  cram.js  mindmap.js  # optional
  diagrams/*.js                     # code-drawn SVG figures keyed for q.img (no AI art)
  game/                             # game source (engine, content data) -> built to hubs/boards/game/
tools/build-boards.js               # dependency-free Node build: validate, assemble, size report, --check
hubs/boards/index.html              # GENERATED single-file hub (bank + notes + UI), banner says so
hubs/boards/game/*.js               # GENERATED/copied game files, loaded on demand, versioned with ?v=<hash>
hubs/boards/audio/<unit>-full.mp3   # narration, only for finished units (see the audio note below)
migration_v33.sql                   # boards game ids + achievement kinds (+ game_saves later)
docs/boards/                        # planning (DECISIONS.md, research/, design/)
```

Edits outside these paths in the same first PR: `index.html` (class, ring tokens, `HUBS`, `HUB_LABEL`, `HUB_RING`,
`examNote` rendering, `ARCADES` if a leaderboard), `review/index.html` (`HUB_LABEL`, `HUB_COLOR`, `HUB_TITLE`),
`widget/replies.js` / `widget/ranks.js` name maps, `about/index.html`, `sw.js` (`PRECACHE` + `VERSION`),
`tools/ci/syntax.js` (game files), `tools/ci/smoke.js` (game entry if not `arcade` markup; optional boards lint
rules; per-lecture `audio:false` skip), `.github/workflows/check.yml` (build `--check`), optionally `widget/v3.js`
(`SH_SRS`), `DEPLOY_NOTES.md` and `CLAUDE.md` (repo map: "boards is built from `src/boards/`").

**Audio note.** The narration lint is all-or-nothing per hub: once `hubs/boards/audio/` exists, every unit with
notes needs both mp3s (`tools/ci/smoke.js:58-62`). For staged releases either (a) keep the folder absent until every
published unit is narrated (Listen then uses browser speech; it also falls back to it if an mp3 fails to load,
`widget/v3.js:438-441`), or (b) change the lint to skip lectures whose `LECTURES` entry has `audio:false` (a one-line
condition, harmless to other hubs) and have the hub pass no audio URL for those units.

**Naming.** Hub id `boards` (`data-hub`, RPC `p_hub`, `sh_srs_boards`, `sh_drill_boards`); answered event
`boards:answered`; state key `boards-state-v1`; game save `boards-game-v1`; question ids `b-<unit>-NNNN` (never
reused; a changed meaning gets a new id); game ids short lowercase (`[a-z][a-z0-9-]{1,23}`).

## 16. Pitfalls from DEPLOY_NOTES and LESSONS

**From DEPLOY_NOTES (things that already broke once):**

1. **Split sources outside the repo** revert fixes (15+ "carry this into the split sources" notes). Sources in
   `src/boards/` + build `--check` in CI (section 12).
2. **Guessed exam dates archive the hub.** The dashboard archives at 22:00 on the last `exams` date and the widget
   shows "This hub is archived" (`index.html:746-768`, `widget/v3.js:2175-2196`). Keep `exams: []` until real dates.
3. **Per-render question state.** `SEQ_STATE`/`MATCH_STATE` keyed by qid globally made a question uncompletable the
   second time it appeared (2026-09-16); delete state on every render (`hubs/perio/index.html:3485`, `:3493`).
4. **Answers from games must dispatch the answered event** (perio `recordGameAnswer` didn't, 2026-09-16). One
   `recordAnswer` for everything.
5. **Section tracking.** Hepatobiliary only set a class, so ~12k minutes logged as "(unspecified)" (2026-09-23).
   Define `SH_SECTION`; keep `notes`/`arcade/*`/`mock` spellings that recap, eggs and the pet read.
6. **Both `widget/v3.js` and `widget/v3.css`** must ship together (mind maps went live unstyled, 2026-09-16).
7. **Listen button white-on-white** in dark mode via the widget's `var(--card,#fff)` (2026-09-24): re-skin
   `.sh-tts-btn` with hub tokens or define `--card`.
8. **Feedback must be unmistakable**: the `[data-picked]` style out-ranked the right/wrong colors on sequences, and
   self-graded buttons looked unchanged (reports #3, #6). Test one right and one wrong answer per type on a phone.
9. **Matching graded by index** marked the duplicate answer wrong (`q4-L27`); grade by text, and give every pair a
   distinct answer (lint rule 5).
10. **Choices that give the answer away** (labels, stem echoes, throwaway distractors; 24 fixed 2026-09-29) and the
    key being the longest choice (lint rule 7, <=40%).
11. **Fixed overlays sized with `vh/vw`** overshoot when the text-size setting zooms `<html>` (2026-09-30).
12. **Load order**: hubs call `boot()` directly (markup is parsed); supabase-js is self-hosted and `defer`red
    (2026-09-25); never depend on a CDN for core features.
13. **Changing an item under the same id** mixes old and new stats/choices (`q4-49`, the select-all trims). Give a
    rewritten question a new id.
14. **Heavy RPCs time out** at the anon 3 s limit (`get_hub_recap`, 2026-10-01); 22 months of boards data will make
    any whole-hub aggregate slower: pass date bounds, and page `question_stats` (1,000-row API cap, section 8).
15. **`sw.js`**: bump `VERSION` when `PRECACHE` changes; mp3s are never cached; icons/manifest carry `?v=2`.
16. **Text and audio must never drift**: regenerate a level's mp3 in the same PR as its text.
17. **About page, American English, no secrets, no course or prep-company material** (CLAUDE.md standing rules); for
    boards, original items written to the public INBDE/ADEX outlines only.
18. **Exam-day behavior** keys off `SH_EXPORT.exams` (nuke local-only, pet greeting): another reason for real dates only.
19. **Conflict markers**: check line-anchored; the CSS uses long `====` dividers.

**From LESSONS.md (what students actually do):**

20. **Notes + bank are ~80% of time; arcades got 1.4-1.7%** (LESSONS "Lecture notes and the question bank are the
    hub"). The deep game only earns its cost if it IS question practice (every encounter an item from the bank, with
    real feedback and explanations), not a side attraction. Build and polish notes + bank first.
21. **Use stops the day after an exam; nothing pulls people back between exams** (LESSONS, "Use stops..."). A
    22-month hub needs a reason to return weekly: the drill with long intervals, unit readiness goals, new units
    announced, game seasons tied to course timing.
22. **Most studying happens in the last days** before an exam: expect boards use to spike before course exams on the
    same topics and in summer 2028; line units up with the courses the class is taking (DECISIONS.md).
23. **Ordering > 4-5 steps and select-all > 5 options barely work**; matching scores ~30 points lower than MCQ; Patient
    Box select-alls are the worst. Keep them short and few; prefer MCQ and case-based MCQ (the INBDE is mostly
    single-best-answer with case sets).
24. **Explanations**: name the favorite wrong answer and why it is wrong; case explanations use only facts in the
    case; state the number and which figure it is. Fixes that do this lift accuracy within a day.
25. **Write in the exam's formats from day one** (two-statement, EXCEPT/NOT, images, Patient Box / case sets); the
    perio midterm went worse than expected because the hub lacked them.
26. **Cues and undo** were asked for: include `cue` on hard items and undo/start-over on orderings from the start.
27. **Bounce**: 26-40% leave within 5 minutes; the landing view must reach a question or notes in one tap (perio's
    quick-start row).
28. **Low-value items get reported**: test decisions and reasons, not trivia orderings.
29. **Look-alikes need side-by-side tables** plus one question per distinguishing feature.
30. **Tag sources** (`src`) and show them; class-quiz items were practiced most. For boards, the outline area and
    version (`ov`) play that role.
