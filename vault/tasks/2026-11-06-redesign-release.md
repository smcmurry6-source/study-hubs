---
type: task
status: blocked
hub: site
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: the new versions from phases 1 to 4, then Sam liking the whole redesign on the preview
agent: 
pr: 
---

# Redesign release: one PR switches the site to the new design

## Goal

Sam wants the whole redesign built and tweaked until Sam likes it before any of it reaches the class (2026-11-06,
[decisions](../decisions.md)). Phases 1 to 4 build it on `main` beside the live site, in files no student sees. This
task is the one PR that then switches the site over. If something goes wrong, reverting that PR brings the old site back.

## Context

- How the new versions are built and kept in step with the live hubs: [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md)
  (Context). The other phases: [2](2026-11-05-redesign-phase-2-live-hubs.md), [3](2026-11-05-redesign-phase-3-dashboard.md),
  [4](2026-11-05-redesign-phase-4-game-layer.md); [5](2026-11-05-redesign-phase-5-backend.md) ships as it's ready.
- The plan: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (tier 3: the release
  suites, UAT, Sam ticks "Sam approved this release"), [about-page](../rules/about-page.md),
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md), [question-ids-are-permanent](../rules/question-ids-are-permanent.md),
  [roll-back-a-release](../how-to/roll-back-a-release.md).
- The hubs that get new versions: **Occlusion, Heme & Endo Exam 2 and Perio** (Sam, 2026-11-06). PCD Implants and Special
  Patient Care keep their pages. **When:** Sam plans the release for after the PCD Implants exam (Nov 6). The exams still
  ahead: Heme & Endo Exam 2 Nov 13, Occlusion's final Nov 16, Perio's final Nov 19 (`HUBS` in `index.html`). Only the hubs that are still live get switched. A hub whose exam passed before the release keeps its old page, like the
  archived hubs.

## Done when

- [ ] Sam has used the whole redesign on the preview and says it's ready
- [ ] One PR: the dashboard and each live hub's address serve the new versions (the new pages take the old ones' place,
      same addresses, so bookmarks and the home-screen app keep working)
- [ ] The content JSON becomes where content is edited: the step that copied it from the old hub files is retired, and
      `narrate.py`, the figure builds, the CI lint, `tools/question-ids/` and the preview transform read the JSON
- [ ] Same hub and question ids, so everyone's answers, XP, ranks, pins and question health carry over (checked on the
      preview with the test accounts)
- [ ] The rules edited from the drafts below: [hub-home-page](../rules/hub-home-page.md), [arcade-skins](../rules/arcade-skins.md),
      [question-bank-filter-panel](../rules/question-bank-filter-panel.md); [build-a-hub](../how-to/build-a-hub.md) rewritten
- [ ] The About page rewritten for everything students will see change, counts true
- [ ] `sw.js` version bumped, so phones drop the old cached pages; perf budgets lowered to the new sizes
- [ ] CI and the release suites pass on the switch PR, and the UAT is done on its own preview; reverting it there brings
      the old site back
- [ ] After merge: `node tools/release/postcheck.js`, `DEPLOY_NOTES.md` and the site changelog; a notice to the class only
      if Sam wants one

## Drafts for the release

Each phase writes here the rule, About page and how-to changes it needs, so they all land together.

### From phase 1 (the engine and the new Occlusion, [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md))

Written for the engine as built in `widget/hub.js` / `hub.css` and `hubs/occlusion/next/`. Phase 2 adds what the other hubs
need; at the release, check each draft against the engine as it is then.

**[hub-home-page](../rules/hub-home-page.md)** (replace the body; keep the date of the original rule):
- Every hub has four views, **Home, Notes, Questions and More**, as hash routes (`#home`, `#notes/<lecture>`,
  `#questions[/drill|misses|weak|mock]`, `#more[/<page>]`); Home is the default and logs as `home/dashboard` (`SH_SECTION`).
- Home is a landing page drawn by the engine from the hub's `SH_HUB.home` and its content: the hub's masthead, the exam
  card (countdown and the announced facts; the format line says when it isn't announced), the quick links on the first
  phone screen (practice questions, Daily drill, the notes you were on, the mock and the rest), with **Timmy Time** among
  them when the hub has an episode (Sam, 2026-11-06: "animated and visible without scrolling down"): the hub's color,
  Timmy in headphones bobbing to the music, the notes drifting, a small equalizer, still when motion is off; the last
  column of both rows on a laptop, beside Practice questions on a phone. Then **Where to next** (at most three rows:
  yesterday's misses in exam week, the weakest lecture, a lecture not started), **Today** on a warm field of its own (the
  goal as **a ring of 20 teeth** that fill in as you answer, the streak, XP today, right today, Timmy's HP; **no "last 14
  days"**, Sam, 2026-11-06), progress by lecture (Notes / Questions per row) and the course timeline (`COURSE_DATES`).
  Under the countdown, the live count: "n studying <hub> right now, you included".
- The bar shows the live count on every page (a green dot and the number; "studying now" where there's room): the shared
  widget's presence count for this hub (`sh:online`, sent by `widget/v3.js`), a total with nothing about who.
- Drill, Yesterday's misses, Weak spots and the mock are **sets of the Question Bank** (`#questions/<set>`), not modes.
- The one-time flag rule stays: nothing that moves returning visitors goes in `defaultState()`.

**[arcade-skins](../rules/arcade-skins.md)** (add): the arcade lives in More. Its lobby shows **every game** (Sam,
2026-11-06), the hub's pick first and full width (`SH_HUB.arcade.first`, Occlusion: Cusp Sort), each tile on its own field
of color with **the game's own drawing** across its top: SVG in the house ink style, drawn from the hub's own world in
`tools/figures/site/arcade.mjs` and built into `widget/hub-art/<hub>.js` (`games`); a hub without drawings yet shows each
game's icon. The live lobby's painted thumbnails (`img/thumb-*.webp`) aren't used. The skin rules are unchanged: each hub's
games, names, lobby text and look are its own (`arcade.js` / `arcade.css` beside the page).

**[question-bank-filter-panel](../rules/question-bank-filter-panel.md)** (edit):
- A **Sets** row in the panel, under Show: Daily drill, Yesterday's misses, Weak spots, Mock exam (`#questions/<set>`). A set
  replaces the list until it's closed; the filters stay as they were.
- The panel keeps Lectures (tick boxes, Only), Show (All, Not answered yet, Missed last time, Pinned, each with its count),
  the **Only** line with the High likelihood toggle on top of any Show chip (and a hub's own toggles, `SH_HUB.bank.only`),
  Order (In order / Random), More filters (type, source), the `.qsum` line with removable tags and Clear all, and the
  tracking names (`bank:show=likely`, `bank:show=likely-off`, `bank:tag-off=lk`). On a laptop a Today column (the goal ring, streak, XP, this session) sits beside the questions.
- Report and Pin sit in each card's head (`.qc-tools`), right of the lecture and status.
- After an answer, one row: **Try it again** (Retry on a phone), the shared widget's **Find this in the notes** (on a miss)
  and **Good question?** at its end. No "Notes for <lecture>" link (Sam, 2026-11-06: Find this in the notes does that job).

**[every-choice-gets-a-why](../rules/every-choice-gets-a-why.md)** (one line): in the new card, "Why each choice" is one folded
bar under the explanation; opened, it lists every choice with your pick's reason open (Sam, 2026-11-06).

**[build-a-hub](../how-to/build-a-hub.md)** (rewrite "Build it" and "Wire it into the site"):
- A new hub is a page like `hubs/occlusion/next/index.html`: the guard script, `window.SH_HUB` (hub id, name, state key,
  answered event, exam, the Home/Notes/hints/mock/arcade wording), `widget/hub-art.js` + `widget/hub-art/<hub>.js`, `hub.css`
  and `hub.js`. Nothing else goes in the page.
- Its content is JSON beside the page (`content/core.json`, `questions.json`, `notes.json`, `study.json`) plus
  `figures.js/css` and `arcade.js/css`. After the release the JSON is the source (edited by hand or by a build step), and
  `narrate.py`, the lint, the figure builds and the question-id registry read it.
- Its art (emblem, masthead, medals, tint) is drawn in `tools/figures/site/` and built into `widget/hub-art/<hub>.js`
  ([every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)).
- The engine owns the frame, the card, the bank, the rewards, the mock and the settings: a hub never copies or patches
  them; a change for every hub goes in `widget/hub.js` / `hub.css`.
- Figure text is 11 px at the smallest (the build raises 9-10.5 px to 11).
- Drop from the old steps: copying a hub file, its palette and type trio (the tint is the hub's color now), `whyHTML`,
  the `.qbar` copy, `renderHome()` and the tour steps.

**About page** (`about/index.html`), Part 3 "Hub modes", rewritten:
- "Each hub has four parts on its bar: **Home, Notes, Questions and More**. On a laptop the bar is at the top; on a phone it's
  at the bottom, with a **Settings** button beside the four." (Replace "four modes in its top bar: Home, Compendium,
  Review and Arcade" and the "top bar that fits your screen" entry.)
- **Home**: what it shows (above), the daily goal and streak, Where to next.
- **Notes**: the lecture list (lectures on the exam first, the others for review, each with a progress bar and how many
  you've tried), both reading levels, Listen, the drawn diagrams beside their paragraph, and **Check yourself**: three
  questions at the end of each lecture's notes.
- **Questions**: the bank, its panel (the High likelihood toggle as now) and the four sets (Daily drill, Yesterday's misses, Weak spots, Mock exam); answer
  choices look as they do now (plain rows, a check or cross after you answer); Pin and Report on every card.
- **Rewards on every answer** (new): XP counts up on the rank pill, the goal ring fills, the streak flame grows with the
  streak, Timmy cheers or flinches, and when you leave the questions with 5 or more answered a **session recap** card says
  how it went and offers the misses (never mid-practice; Sam, 2026-11-06).
- **Daily goal** (new): a ring in the bar fills toward 10 to 50 questions a day (default 20, in Settings). The **streak**
  still counts any day you answer a question, as now; missing the goal doesn't break it (Sam, 2026-11-06).
- **More**: a tile per part, each on its own color with a line of what's in it: Timmy Time (the big one, Timmy in
  headphones), Exam hints, Cram sheet, Side by side (was Review), Arcade, Stats and trophies, Settings; then Talk to us
  (Inbox, Suggest, Report, the tour, About, All hubs).
- **Notes** (add): at the end of every lecture's notes, **Previous lecture / Next lecture** buttons, and **Report a mistake
  in these notes** (also in the notes toolbar), which opens the report form with the lecture attached.
- **Arcade** (changed): every game in the lobby, each with its own drawing; Cusp Sort first.
- **Studying now** (new entry): the green dot in the bar counts everyone on this hub right now, you included, and Home says
  it under the countdown. It's a live total: nothing about who.
- **Focus mode** (new, in Settings): one switch at the top turns Timmy and every extra off, for just the notes and the
  questions; turning it off brings back what you had, and turning any one extra back on ends it. It uses the extras' own
  switches, so the dashboard and every hub follow it. (Phase 4: give the dashboard's Settings the same switch.)
- **Settings** (changed): Focus mode, theme, text size, the daily goal, your name, Timmy and the extras. The font choice, background
  music and the accent metal are gone (remove their entries and any trophy text that names them; keep "All 24 trophies"
  true).
- **Tour** (changed): no pop-up on arrival; a one-line tip the first time you open each part, and "Take the tour" in More.
- Timmy Tooth: he stays in the bottom-left corner, as now.

### From phase 2, Heme & Endo Exam 2 ([phase 2](2026-11-05-redesign-phase-2-live-hubs.md), [hub note](../hubs/heme-endo-exam2.md))

Built in `hubs/heme-endo-exam2/next/` (2026-11-11). Its exam is Friday, November 13, 10:00 am: by the rule above ("a hub
whose exam passed before the release keeps its old page"), **this new version is switched in only if the release comes
before then** (Sam, 2026-11-11: "Switch it in only if the release beats 11/13"); after that, the live page stays like an
archived hub's.

**Lecture colors and Notes done** (Sam's look at it, 2026-11-11: "more color ... to distinguish each lecture"): built in the
engine, so every hub on it has them from the release (Occlusion and Heme & Endo now, Perio once it's ported). For the About
page (Notes, Question Bank): every lecture has its own color, on each question's lecture tag and the card's top edge, the notes'
list, Home's progress by lecture, the bank's lecture picker, Exam Hints and the cram sheet (a review-only lecture is grey);
**Notes done**: the button at the end of a lecture's notes, or reading to the end after a minute, fills its badge with its
color and a check, in the notes' list and on Home; tap it again to take it back; kept on this device, like highlights.

**Timmy Time's page** (Sam, 2026-11-11: "Redesign the timmy time ui/card"): built in the engine (`podDress`), so every hub on
it with an episode has it from the release. Home's animated card stays among the quick starts, as now. For the About page
(the Timmy Time entry, rewritten): the episode has its own page under More, on the hub's color with Timmy in headphones
(he bobs while it plays): a big Play button, back 15 s, forward 30 s, the speed, and a bar to drag; the chapters are listed
under it, always open (tap one to jump there, the one playing is marked); then what the class thinks, as now. The small
player pinned to the bottom while you're elsewhere is in the hub's color too.

**[question-bank-filter-panel](../rules/question-bank-filter-panel.md)** (add, with phase 1's draft):
- A hub's **review-only lectures** (`core.json`'s `reviewOnly`, Heme & Endo Exam 2's Exam 1 Refresher) are out of the bank
  until ticked: "All lectures" means the others, the picker's words are the hub's own (`SH_HUB.review`), the tag says when
  they're in, and the summary counts them apart ("Showing n of N questions + m Exam 1 review").
- A hub's own toggle may name a lecture (`SH_HUB.bank.only`: `[key, label, { prop, lec }]`): on, it ticks that lecture;
  off, it unticks it again if it was what ticked it.

**[hub-home-page](../rules/hub-home-page.md)** (add): review-only lectures are out of Home's totals, "you haven't tried"
and Where to next, and listed under their own heading in the progress list (Heme & Endo: "Exam 1 review: not in your
totals").

**[arcade-skins](../rules/arcade-skins.md)** (with phase 1's line): the hub's pick first, full width (Occlusion: Cusp Sort;
Heme & Endo Exam 2: Lab Sort).

**[build-a-hub](../how-to/build-a-hub.md)** (with phase 1's rewrite): a hub without the drawing kit (`od:kit`) still builds:
its `FIGS` and `FIG_PLACE` go into `figures.js` as data. The mock's blueprint may group lectures (`EXAM_GROUPS`) and draw a
lecture's questions from its High Likelihood ones only (`MOCK_LIKELY_ONLY`).

**About page**: nothing new for Heme & Endo beyond phase 1's drafts (its Refresher, Exam 1 High likelihood and the Cycle
Arcade work as now). Its arcade row: every game in the lobby with its own drawing, Lab Sort first. (High Likelihood's line on
the mock's five Exam 1 questions said "each from a different Exam 1 lecture"; Sam, 2026-11-11: "draw at random", so it now
says they're drawn at random, fixed on the live page in [#312](https://github.com/smcmurry6-source/study-hubs/pull/312).)

### From phase 2, Perio ([phase 2](2026-11-05-redesign-phase-2-live-hubs.md), [hub note](../hubs/perio.md))

Built in `hubs/perio/next/` (2026-11-11). Perio's final is Thursday, November 19, so by the rule above it is switched in if
the release comes before then. At the release its own engine goes with the old page, and its content JSON becomes where
it is edited, as for the others (Done when, above).
**The arcade lobby drawings**: all six are in (Sam, 2026-11-11: five on the contact sheet, then Pocket Showdown's redrawn
board).

**About page** (Perio's entries, rewritten for the new version):
- **Review** is gone as a tab: each session's tables sit under its notes ("Charts for this lecture") and the search finds
  their rows. The Compendium's parts are Notes and Questions, as on every hub.
- **The mock exam** follows the final's format from Dr. Abou-Arraj's midterm emails: 46 questions in 80 minutes, 5 Patient
  Box cases, 5 multiple-answer questions scored with partial credit, 1 ordering question, from all 9 sessions; the results
  give points per session.
- **Recall cards** (Perio's short-answer questions) are in the bank: think of the answer, reveal it, then say whether you
  got it; that counts as right or missed.
- Perio's 16 trophies, its saved progress and the arcade's six games carry over as they are (the games' names as they are
  now: Pocket Showdown, Perio Clinic Escape, Mind the Pocket, Million-Dollar Smile, Cross-Section, Calculus Crusher).

**[question-bank-filter-panel](../rules/question-bank-filter-panel.md)**: "Perio has its own engine's copy" (and `QBANK_FILTER`,
`qbankNorm()`, `STATE.ui.qbank`) comes out: Perio's bank is the engine's, its saved filters moved over once (`ui.qbankIn`).

**[hub-home-page](../rules/hub-home-page.md)**: Perio's Home is the engine's (`SH_HUB.home`): the final's countdown and chips.

**[arcade-skins](../rules/arcade-skins.md)**: Perio: Pocket Showdown first. A hub's game tags its question with the lecture's
own color (`env.lc`, `.gm-sess`), and the games keep their own buttons' style inside the stage (BUG-058).

### From the Learn and Flashcards toggle ([Learn and Flashcards](2026-11-06-redesign-learn-and-flashcards.md))

Sam confirmed the calls in that note (2026-11-06); check against the engine as built.

**[question-bank-filter-panel](../rules/question-bank-filter-panel.md)** (add):
- **Study as** at the top of the Questions view: **Questions · Learn · Flashcards** (`STATE.ui.qview`, saved like the panel). The
  panel picks which questions and the toggle how; Lectures, Show, the High likelihood toggle, More filters, search, the tags
  and Clear all work the same in all three. Order (In order / Random) shows only for Questions. Drill, Yesterday's misses and
  Weak spots work in all three; the mock is always questions. Tracked as `bank:view=<view>`.

**About page**, Questions (new entry, tagged new): **Study as**: Questions as now; **Learn** asks the questions you picked in
rounds of 7 until you've got each right twice (the second time you think of the answer before the choices show); **Flashcards**
show the question, you flip it and say how well you knew it (Again, Hard, Good, Easy), and it comes back when you're about to
forget it, never later than the day before the exam. Learn's answers count like any answer; a flashcard counts toward your
daily goal and streak and earns 2 XP when it's due. "What the hubs record": how you rated each flashcard, so your schedule
follows you to your other devices.

### From phase 5, part 3 (the game layer's server, [game-server](../reference/game-server.md))

`migration_v54.sql` is written and tested, not applied. At the release, in this order:

1. **Apply it** through the connector in the same few minutes the switch PR merges: it sets the switch time
   (`game_config.v2_at`) and takes everyone's baseline when it runs, so XP without the cap starts then. Pages that still
   call today's functions keep today's rules either way. (Its section 0, the BUG-049 fix, was applied on its own on
   2026-11-06: it changes nothing the second time.)
2. In the switch PR: append `migration_v54.sql` to `supabase/schema.sql` and take its line out of
   `supabase/pending-migrations.txt`; then `node tools/release/rls.js` and `rls-audit.sql` on the live project.
3. **Load the keys** of every hub that switches: `node tools/xp/keys.js <hub> --sql` (the admin secret typed in by hand,
   never committed), through the connector, and check the count it returns. A hub that keeps its old page records answers
   the old way and needs none, but an idea can only name a hub with keys: load them for each live hub, or its ideas use
   "All hubs".
4. **Set each episode's length** (`admin_set_podcast_episode`), so Timmy Time's minutes pay.
5. **Post the starter ideas** (`admin_post_starter_idea`, the table in [the idea board](2026-11-06-idea-board.md)), checked
   against the About page first.
6. The new pages call the new functions: `record_answer_v2` in place of `record_answer`, `record_choice` /
   `record_choices`, `record_personal_answer` and `record_correct_streak`; `xp_session_start` / `xp_session_finish` for a mock
   and an arcade game; `pod_minute_v2`; `get_widget_bootstrap_v2`; the `_v2` boards; the shop, Timmy's place and the idea
   board's functions; the admin page's `admin_resolve_report_v2` ("Fixed" / "No change needed") and `get_reports_v2`.
7. Before it: Sam confirms the calls made while building it (listed in [game-server](../reference/game-server.md) and the
   PR that added it), the draft catalog's prices, and how long hidden ideas are kept ([analytics-retention](../reference/analytics-retention.md)).
   **Done 2026-11-11** ([the open calls](done/2026-11-11-redesign-open-calls.md)): the two changes are in `migration_v54.sql`;
   the prices are judged again with the art, and the 90 days for hidden ideas is approved but not built yet.
8. About page: the XP sources and the guardrails, Shiny Gold Crowns, the shop, the idea board, and "What the hubs record"
   (ideas show to the class under your name).

### From phase 3 (the new dashboard, [phase 3](2026-11-05-redesign-phase-3-dashboard.md))

Written for the dashboard as built in `next/index.html`, `widget/dash.js` and `widget/dash.css`. The idea board's part
is in [its own note](2026-11-06-idea-board.md).

**The switch itself**

1. `next/index.html` takes `index.html`'s place: move it to the repo root, set `window.SH_DASH = { root: "./", widget:
   "widget/", about: "about/", review: "review/" }`, change its `../` paths to match, and take out its guard script (the
   one that sends visitors to the live dashboard outside a preview). Keep the lines that set the theme and text size
   before the first paint.
2. `next/hubs.js` moves beside it (`hubs.js`) and **becomes where hubs are added, archived and dated**: it holds what
   `HUBS`, `CLASSES`, `ARCHIVED_HUBS`, `ARCADES`, `HUB_LABEL` and the hour constants hold in the old `index.html`. Retire
   `tools/dash-next/build.mjs` (it copies them from the old page until then) and its line in `.github/workflows/check.yml`.
   Everything that reads `HUBS` from `index.html` reads `hubs.js` after that: `widget/archive.js`'s callers, `review/`,
   `tools/release/lib.js` (`hubStatus`), `tools/ci/archive.js`, `tools/ci/smoke.js`, `tools/publish-recap.js`,
   `tools/retro.sql`'s notes. Reword [repo-map](../reference/repo-map.md) ("`index.html` — dashboard. Hub cards come from
   the `HUBS` / `CLASSES` arrays"), [build-a-hub](../how-to/build-a-hub.md), [hub-home-page](../rules/hub-home-page.md)
   where they say exam dates live in `HUBS` in `index.html`, and [repo-is-the-vault](../rules/repo-is-the-vault.md)'s example.
3. The new hubs' `back:` already points at `../../../next/`; at the switch it goes back to `../../`.
4. `hubHref()` in `widget/dash.js` sends a hub with a `next/` folder to it, and to the old page otherwise. Once every live
   hub has switched, drop `next` from the data and the two link shapes (`#drill` and `#timmy` are the old hubs').
5. `sw.js`: add `hubs.js`, `widget/dash.js`, `widget/dash.css`, `widget/hub.css`, `widget/hub-art.js`,
   `widget/hub-art/dash.js` and `widget/hub-art/class.js` (the classroom and the stage) to `PRECACHE` (not
   `widget/hub-art/outfits.js`, 168 KB, which loads only when someone on the page wears a shop outfit), drop what only the old dashboard used, and bump the version.
6. `tools/release/a11y.js`, `perf.js`, `matrix.js` and `tools/ci/smoke.js` test `next/` beside the old dashboard today:
   fold the two into one, rename the baseline and budget keys (`dashboard/next` to `dashboard`, `next/` to `index.html`).
7. The old dashboard's keys still read: `sh_dash_last` (the hub you opened last) and `sh_dash_flap` (the countdown's
   last value). `sh_dash_arcade_hub` and `sh_dash_arcade_game` are no longer used; nothing needs migrating.
8. `get_widget_bootstrap_v2` and the `_v2` boards are called first and fall back to today's functions when the database
   doesn't have them (`rpc2` in `widget/dash.js`); once migration_v54 is applied the fallback can come out.
9. **What a Timmy wears, after the shop** (phase 4): `shPet.fit()` in `widget/pet.js` sends the holiday outfit today
   (`<holiday>:<outfit>`). Once the shop is live it should send the equipped shop outfit's id when there is one (the
   classroom's `cleanFit()` and `timmyArt()` in `widget/dash.js` already take an id and draw it with
   `widget/hub-art/outfits.js`; the preview's made-up class wears some). The leaderboard's top three get theirs from
   `get_place` through the visit key on their row, so they are plain Timmys until migration_v54 is applied.

**About page: Part 1, the dashboard** (rewrite these entries; nothing here is a secret except the last one)

- **Guided tour**: it no longer asks on your first visit. It's "Take the tour" in the top bar's menu (the three lines),
  ten stops at most, on the real page. Each hub still has its own.
- **Your hubs** (replaces "Hub cards" and "Next-exam hero"): every live hub is a tab along the top with its emblem and its
  exam's countdown, soonest first, the open one in the hub's color; the page opens on the hub whose exam is next, or the
  one you had open last. The open hub shows its drawn scene across the page, the exam's date, the days left on a tile
  that flips like a departure board, **a bead for each day left** (up to two weeks out, ending on the hub's emblem), **a
  ring for your progress** in it (questions tried, how many right), **Start studying** and **Daily drill** with today's
  status. Under it: what the hub covers, its other exams, its "Updated" label and its Timmy Time episode when it has one.
  A hub archives itself at 10 pm on its last exam day and moves to **Past hubs** at the bottom for 10 days.
- **Send luck**: unchanged, under the countdown.
- **You** (replaces "Greeting and name", "Your rank card" and "Timmy Tooth's house", now one card): the name classmates
  see with "Pick your name" / "Change name", Timmy's house (or Timmy waiting to meet you), your handpiece medallion, rank,
  XP, place in the class and the bar to the next level, your mastery medals, your day streak with **the last seven days
  as dots** and this week's answers. The top bar shows the streak and rank too. The two-weeks strip is gone.
- **The class**: **Studying right now** is **a drawn classroom** (Sam, 2026-11-11): the count on the chalkboard with
  how many are in each hub, and a Timmy at a desk for everyone who has a hub open, wearing what their own Timmy has on
  (a plain tooth if they haven't adopted him, or have him or the extras off). When someone opens a hub their Timmy hops
  in through the door and jumps into a desk; when they close it he gets up and leaves. The desk's front is the hub's
  color, the windows show day or night, rows are added as the room fills, and past a full room a sign by the door says
  how many are in the hall. No names: nobody can tell which Timmy is whose. Reduce motion (or answer animations off)
  seats them without the walk; Focus mode shows the plain count. The count is in the top bar too. Under it the
  leaderboard, one list at a time: **Ranks** (top 10, with every rank from Stone to Dark Matter folded under it) or
  **Study streaks**, with **the top three on a stage**: curtains, spotlights, torches, confetti, gold, silver and
  bronze blocks, a crown for first, and each winner's own Timmy on top in their outfit (with the shop; a plain Timmy if
  they turned visiting off). The rest of the board is on the dark stage floor with a bar for how close each is to first.
  **Gone from the dashboard** (Sam, 2026-11-11): correct-in-a-row, the arcade high scores (each hub's Arcade keeps its
  own boards) and the "When people study" chart. The Golden Probe line is under the board when someone has won today.
- **What the hubs record** (already on the live About page since the PR that added it): the outfit goes with the
  studying-now count, with no name or id, and isn't saved.
- **Past hubs** (replaces "Hub recaps" and the greyed-out cards): each finished exam's recap is **a drawn card** in that
  hub's color, one exam at a time (chips switch between them): the hours studied together, the classmates as a crowd of
  teeth, **hours per day as a bar graph** (a drawn column for each day, the exam day's with a flag, the most hours
  labeled, Timmy standing on one), then chips for how many answers were right, the day before the exam, the busiest
  hour, night owls and regulars, and "the one that got us" when there is one. The numbers count up and the columns
  grow as you reach it. **Save image** still gives the shareable picture. Totals only, no names. Beside it (under it on
  a phone), a short card for each hub that just closed with its Check in button.
- **What's new is gone** (Sam, 2026-11-11: people don't read it). Each hub still says when it was last updated, and a
  tab left open still offers "a new version is ready". Take the "What's new" entry off the About page.
- **Exam check-ins**: the button is under the open hub from 8 am on exam day, and on the hub's card in Past hubs after it
  archives; the 10 pm pop-up is unchanged. It waits while a reply to your report is on screen.
- **Settings and theme**: the gear opens Settings: Theme, Text size, **Focus mode** (the same switch as in a hub: no
  streak, XP, ranks, boards or Timmy), and the extras (Timmy, hidden secrets, plaque bosses, the Tooth Fairy, the Golden
  Probe, the Full Arch chart, tactical nukes, rank-up and trophy cards, streak cheers, answer animations). Light or dark is
  also in the top bar's menu. **Font, Background sound and Accent are gone from the dashboard** (the redesign has one
  typeface; the hub's own Settings draft is in phase 1's list above).
- **A top bar that fits your screen**: on a narrow phone or at the largest text the dashboard's bar drops, in order, the
  studying-now count, the words "Study Hubs" and the rank badge; nothing runs off the screen.
- **The class's easter egg** (inside a `spoil`): tapping a hub's drawn scene shows its class's line, where tapping the
  class icon did.

**Other notes that change with it**

- [ship-a-change](../how-to/ship-a-change.md) step 7 and [github-is-the-source-of-truth](../rules/github-is-the-source-of-truth.md)
  step 4 say the site changelog is "shown on the dashboard": after the release it only drives each hub's "Updated" label
  (and the admin page). Keep logging to it; reword both.
- [repo-map](../reference/repo-map.md): the `ARCADES` list is no longer read by the dashboard (the arcade boards are in the
  hubs); drop it from `hubs.js` at the switch unless something else reads it.

## Log

- 2026-11-06: written after Sam chose to build the whole redesign side by side and release it at once.
- 2026-11-06: Sam's second look (focus mode, every game with its own art, the answered card's row, no two-weeks card,
  decorated Today and Timmy Time, more color, notes prev/next and report, the More tiles, the live count) added to the
  drafts above.
- 2026-11-06: Sam's third look: Timmy Time among Home's quick starts, animated; Today's ring of 20 teeth.

## Outcome
