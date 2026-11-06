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
8. About page: the XP sources and the guardrails, Shiny Gold Crowns, the shop, the idea board, and "What the hubs record"
   (ideas show to the class under your name).

## Log

- 2026-11-06: written after Sam chose to build the whole redesign side by side and release it at once.
- 2026-11-06: Sam's second look (focus mode, every game with its own art, the answered card's row, no two-weeks card,
  decorated Today and Timmy Time, more color, notes prev/next and report, the More tiles, the live count) added to the
  drafts above.
- 2026-11-06: Sam's third look: Timmy Time among Home's quick starts, animated; Today's ring of 20 teeth.

## Outcome
