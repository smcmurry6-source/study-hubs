---
type: task
status: blocked
hub: site
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: Sam's "merge" on the switch PR (its preview is up)
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/359
---

# Redesign release: one PR switches the site to the new design

## Goal

Sam wants the whole redesign built and tweaked until Sam likes it before any of it reaches the class (2026-11-06,
[decisions](../decisions.md)). Phases 1 to 4 build it on `main` beside the live site, in files no student sees. This
task is the one PR that then switches the site over. If something goes wrong, reverting that PR brings the old site back.

## Context

- How the new versions are built and kept in step with the live hubs: [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md)
  (Context). The other phases: [2](2026-11-05-redesign-phase-2-live-hubs.md), [3](2026-11-05-redesign-phase-3-dashboard.md),
  [4](2026-11-05-redesign-phase-4-game-layer.md); [5](done/2026-11-05-redesign-phase-5-backend.md) ships as it's ready.
- The plan: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- **Which model:** this session runs on Fable 5.2 at High effort (Sam, 2026-11-12, [decisions](../decisions.md)).
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (tier 3: the release
  suites, UAT, Sam's "merge"), [about-page](../rules/about-page.md),
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md), [question-ids-are-permanent](../rules/question-ids-are-permanent.md),
  [roll-back-a-release](../how-to/roll-back-a-release.md).
- The hubs that get new versions: **Occlusion, Heme & Endo Exam 2 and Perio** (Sam, 2026-11-06). PCD Implants and Special
  Patient Care keep their pages. **When:** Sam plans the release for after the PCD Implants exam (Nov 6). The exams still
  ahead: Heme & Endo Exam 2 Nov 13, Occlusion's final Nov 16, Perio's final Nov 19 (`HUBS` in `index.html`). Only the hubs that are still live get switched. A hub whose exam passed before the release keeps its old page, like the
  archived hubs.

## Done when

- [x] Every session before this one is merged: 1 to 9 in [phase 4](2026-11-05-redesign-phase-4-game-layer.md)'s
      "From here to the release" (the shop's art and client, Timmy everywhere, visiting, the bowling egg, the trophy
      case and the cards, Ask Timmy's chat, the wiring, phase 5 part 2), and beside them Ask Timmy's admin tab and
      Learn and Flashcards (planned with Sam, 2026-11-12)
- [ ] Sam has used the whole redesign on the preview and says it's ready
      **Waiting: the switch PR has the `preview` label, and Sam's word is "merge".**
- [x] One PR: the dashboard and each live hub's address serve the new versions (the new pages take the old ones' place,
      same addresses, so bookmarks and the home-screen app keep working)
      **Done in the switch PR (2026-11-13): the dashboard, Occlusion and Perio. Heme & Endo Exam 2 keeps its old page (Sam: its exam was Nov 13) and its new version was deleted.**
- [x] The content JSON becomes where content is edited: the step that copied it from the old hub files is retired, and
      `narrate.py`, the figure builds, the CI lint, `tools/question-ids/` and the preview transform read the JSON; High
      yield (`notes.json`'s `hy`) is still rebuilt by `tools/hub-next/high-yield.mjs` from the JSON's notes, topics, hints
      and questions, with a CI check that it's current (today `build.mjs --check` does it)
      **Done: `tools/hub-next/build.mjs` no longer reads a hub's page; it rebuilds the question index and High yield from the JSON and CI runs its `--check`.**
- [x] Same hub and question ids, so everyone's answers, XP, ranks, pins and question health carry over (checked on the
      preview with the test accounts)
      **Checked: the smoke test's id registry on Occlusion (844) and Perio (763), and the preview's returning account keeps its streak, XP, misses and pins on both.**
- [x] The rules edited from the drafts below: [hub-home-page](../rules/hub-home-page.md), [arcade-skins](../rules/arcade-skins.md),
      [question-bank-filter-panel](../rules/question-bank-filter-panel.md), [every-choice-gets-a-why](../rules/every-choice-gets-a-why.md);
      [build-a-hub](../how-to/build-a-hub.md) rewritten ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)
      already covers High yield, since its narration on 2026-11-12)
- [x] The About page rewritten for everything students will see change, counts true
      **27 trophies, 16 secret; `supabase/functions/timmy/site.json` rebuilt from it.**
- [x] `sw.js` version bumped, so phones drop the old cached pages, and its lists rewritten for the bundles ("From phase 5,
      part 2" below). The redesign's perf budgets were lowered to the bundled sizes in
      [phase 5, part 2](done/2026-11-05-redesign-phase-5-backend.md) (2026-11-13); the release moves them from the `next/`
      addresses to the pages' own and takes the old pages' rows out
      **`sh-v59`.**
- [ ] CI and the release suites pass on the switch PR, and the UAT is done on its own preview; reverting it there brings
      the old site back
      **The smoke test on every hub and `node tools/release/run.js` ran once on the finished code (the report is in the PR); the UAT was done on the preview, phone and laptop. A revert of the merge is the tree before it; the database stays (the old pages run on it, as the archived hubs' do).**
- [ ] The new dashboard, left from [phase 3](2026-11-05-redesign-phase-3-dashboard.md) (2026-11-12): its three screens
      (`dashboard/next`) added to the accessibility baseline; first paint on the slow-phone profile looked at again (it
      passes its budget but is slower than the live dashboard's); and, once it is the live dashboard, one look with a
      real hub tab open beside it: your Timmy walks in wearing his outfit and his desk says "You" (a preview has no
      realtime, so this was only checked in pieces)
      **Done at the switch: its three screens are in the accessibility baseline (no finding), and the slow-phone first paint is in the PR's test report. Left for after the merge: the one look with a real hub tab open beside it.**
- [x] An archived hub on the engine can take its audio off ([archived-hubs-drop-their-audio](../rules/archived-hubs-drop-their-audio.md),
      2026-11-12): a `core.json` switch that `widget/hub.js` passes to v3.js as `data-audio="off"` (`startWidget`), and that
      hides the engine's own Timmy Time page and Home card and sends Listen to the device's voice without requesting the
      missing mp3s or word files. Needed before Heme & Endo Exam 2, Occlusion or Perio is archived on the engine
      ([to-do](2026-11-12-audio-off-at-archiving.md)). High yield's recordings (`<lecture>-hy.mp3`) come off with the rest;
      the build's `hyAudio` then lists none by itself (`tools/hub-next/build.mjs` checks the files)
      **`"audio": "off"` in `core.json`; the steps are in the rule.**
- [ ] The game layer's wiring left by phase 4, part A (2026-11-12, "From phase 4, part A" below): the arcade's
      sessions and pick indexes and Timmy Time's minutes are [their own session](done/2026-11-12-redesign-game-layer-wiring.md)
      before this one (Sam, 2026-11-12); the journey trophies join the case in
      [the trophy case's session](done/2026-11-12-redesign-trophy-case-and-cards.md); the scenes stay silent. The arcade,
      Timmy Time and the admin page's "Fixed" are wired since 2026-11-13 (ticked below). Left for
      this PR: each episode's length loaded (`admin_set_podcast_episode`, step 4 of the migration's steps) and the service
      worker's lists (the wiring added no file)
      **The service worker's lists are done. Left for the merge: Occlusion's episode length (`admin_set_podcast_episode`, `midterm-review`, 2688 s). Heme & Endo Exam 2 keeps its old page, which doesn't report minutes, so it needs none.**
- [x] **Full Arch comes out** (Sam, 2026-11-12: "I also want to remove the full arch challenge thing"; the redesign's
      pages stop showing it in [the trophy case's session](done/2026-11-12-redesign-trophy-case-and-cards.md)). In this
      PR, from the shared files: its code in `widget/eggs.js` (and the top comment's lines about it), its styles in
      `widget/v3.css`, the `sh_pref_arch` switch in `widget/v3.js` (the old dashboard's goes with `index.html`),
      `sh:arch-done` in `widget/ranks.js`, Timmy's secret tip and his line about it in `widget/pet.js`; and on the
      About page: its entry in Easter eggs, its rows in both trophy tables, its name in Settings, in "Secret tips"
      and in Part 7's list of switches, with every trophy count made true. Then `tools/timmy/build.mjs`, so Ask
      Timmy's site help stops describing it. An earned Full Arch stays in its owner's case as retired
      **On every page, the archived hubs' too: 23 trophies there, 27 on the redesign; an owner keeps it as retired.**
- [ ] From the planning of 2026-11-12 ("What Sam's calls of 2026-11-12 change" below): `widget/pet.js`'s
      `everyone` becomes the only behavior and the adoption code comes out, with the day the redesign went live set
      in its constant (`FULL_FROM`, `"9999-12-31"` until then; `tools/preview/transform.js` and the smoke test look for
      that exact line, so change them with it). Built in [Ask Timmy, part 4](2026-11-12-redesign-ask-timmy.md); what
      comes out then: "From Ask Timmy, part 4" below; the prices Sam wants changed are changed with `admin_upsert_shop_item` once the migration is
      applied ([the shop](2026-11-06-redesign-timmy-shop.md), "Prices to change after the release")
      **Done in the switch PR: the adoption code is out, on every page. Left for the merge: `FULL_FROM` set to the merge day (`widget/pet.js`, then the bundles; the preview and the smoke test take any date). No price is waiting to be changed (the shop's note lists none).**
- [ ] Ask Timmy ([its note](2026-11-12-redesign-ask-timmy.md), "At the release"; the steps: [ask-timmy](../reference/ask-timmy.md)): Sam has saved the API key in Supabase and
      set the Console's spending limit; the `timmy` function deployed; `migration_v55` applied with `migration_v54`; the
      function reads the content from its released place; everyone has Timmy
      **Left for the merge, after Sam has saved the API key and set the spending limit. The function's default content address is the released one.**
- [ ] Learn and Flashcards ([its note](2026-11-06-redesign-learn-and-flashcards.md); the steps: "From the Learn and
      Flashcards toggle" below): `migration_v56` applied after `migration_v54` and `migration_v55`, `widget/study-modes.js`
      and `.css` in `PRECACHE`, the About page's "Study as" entry and its line in "What the hubs record"
      **Done in the switch PR: the precache and the About page. Left for the merge: `migration_v56`.**
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
  and the engine's four scripts, deferred, in this order: `hub-rewards.js`, `hub-timmy.js`, `hub-bank.js`, then `hub.js`
  (the smoke test checks the order). Nothing else goes in the page.
- Its content is JSON beside the page (`content/core.json`, `questions.json`, `notes.json`, `study.json`) plus
  `figures.js/css` and `arcade.js/css`. After the release the JSON is the source (edited by hand or by a build step), and
  `narrate.py`, the lint, the figure builds and the question-id registry read it.
- Its art (emblem, masthead, medals, tint) is drawn in `tools/figures/site/` and built into `widget/hub-art/<hub>.js`
  ([every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)).
- The engine owns the frame, the card, the bank, the rewards, the mock and the settings: a hub never copies or patches
  them; a change for every hub goes in the engine (`widget/hub.js` and its three parts, which file holds what is at the
  top of `hub.js`) / `hub.css`.
- Figure text is 11 px at the smallest (the build raises 9-10.5 px to 11).
- Drop from the old steps: copying a hub file, its palette and type trio (the tint is the hub's color now), `whyHTML`,
  the `.qbar` copy, `renderHome()` and the tour steps.

**About page** (`about/index.html`), Part 3 "Hub modes", rewritten:
- "Each hub has four parts on its bar: **Home, Notes, Questions and More**. On a laptop the bar is at the top; on a phone it's
  at the bottom, with a **Settings** button beside the four." (Replace "four modes in its top bar: Home, Compendium,
  Review and Arcade" and the "top bar that fits your screen" entry.)
- **Home**: what it shows (above), the daily goal and streak, Where to next.
- **Notes**: the lecture list (lectures on the exam first, the others for review, each with a progress bar and how many
  you've tried), the three reading levels (As taught, Plain English, High yield: see its own draft below), Listen, the
  drawn diagrams beside their paragraph, and **Check yourself**: three
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

### The engine's files (the split, 2026-11-12, [phase 4](2026-11-05-redesign-phase-4-game-layer.md))

(Since part A, 2026-11-12: `widget/journeys.js` and `widget/hub-art/journeys.js` too. They load on first use, not with
the page, and are in `tools/ci/syntax.js`. Since Learn and Flashcards, 2026-11-12: `widget/study-modes.js` and
`widget/study-modes.css` too, fetched by `widget/hub-bank.js` the first time Learn or Flashcards is opened.)

**Changed 2026-11-13** ("From phase 5, part 2" below): the pages load the engine as one built file,
`widget/hub.bundle.js`, so `sw.js`'s `PRECACHE` takes that file, not the four scripts, when the new hubs go live. A
file a later session adds to the engine joins `tools/bundle/bundles.json` (then `node tools/bundle/build.mjs`) and
`tools/ci/syntax.js`; the pages and the smoke test read the bundle.

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

### Follow along ([task](done/2026-11-12-redesign-follow-along.md))

Built in the engine (2026-11-12), so every redesigned hub has it from the release; it needs a words file beside each
narration mp3 (`tools/narration_words.py`, written by `tools/narrate.py` since; the smoke lint checks them). When the content
JSON becomes the source, `narrate.py` reads `notes.json` the way `narration_words.py` already does.

**About page**, the Listen entry (Hub modes), add with a "new" tag: **Follow along**: while Listen plays a lecture's
narration, the word being read is highlighted in the notes, with its sentence shaded more softly, and the page scrolls to
keep it in view. Scroll away and it stops following until you come back (or move the narration: then it jumps there).
The **Follow along** button beside Listen turns it off or back on, on this device. A classmate's idea, from the survey.
In a browser too old for it, Listen plays as before, without the highlight.

### High yield, the notes' third reading level (2026-11-12)

Sam, 2026-11-12: "a toggle in the lecture notes that only explains the high likelihood/high yield points that are hinted to
be tested. the toggles can be As taught, plain english, and high yield ... implemented now and also added to the redesign
rules", then "only do it for the redesign right now" ([decisions](../decisions.md)). Built in the engine
(`widget/hub.js` `drawNotes`, `hub.css` `.hy-*`) and the content step (`tools/hub-next/high-yield.mjs`, which
`tools/hub-next/build.mjs` runs into each hub's `notes.json` as `hy`), so every redesigned hub has it from the release. The
live hubs keep As taught and Plain English.

What it is: for each lecture with predicted topics (`LIKELY_TOPICS`, [high-likelihood-topics](../rules/high-likelihood-topics.md)),
the lecture's "What's tested" box, then each topic in the list's order (strongest evidence first) as a numbered heading in the
lecture's color, why it's on the list ("A professor's hint", "Exam 2 review", ...) and how many questions it has, the
professor's own takeaways that go with it ("Know this", from the Exam Hints), and the paragraphs of the As taught notes that
teach it, with their figures. After the topics: the lecture's other flagged hints ("Also flagged in class") and its "less
likely" ones ("You can skip"). No word of it is written by hand: the paragraphs are picked by the match "Find this in the
notes" uses, each topic's questions voting for the paragraph that answers them (`node tools/hub-next/high-yield.mjs <hub>
[<lecture>]` lists every pick). A lecture without topics (Occlusion's midterm lectures) has no High yield button. It runs
about 40-65% of the As taught notes' length (more for Perio's shortest sessions and Heme & Endo's Refresher, a cram list
already). Listen plays its Kokoro narration (`<lecture>-hy.mp3`, recorded 2026-11-12, with Follow along) where it matches
today's High yield, and reads it in the device's voice where it doesn't ([task](done/2026-11-12-high-yield-narration.md)).
Reading it to the end doesn't mark the lecture's notes done; its button at the end opens the lecture's High likelihood
questions. Tracked as `notes:level=hy` and `notes:practice-likely`.

**[hub-home-page](../rules/hub-home-page.md)**, in phase 1's draft for Notes (or a line in [build-a-hub](../how-to/build-a-hub.md)):
every hub's notes have three reading levels, **As taught · Plain English · High yield**, High yield on every lecture with
predicted topics.

**[text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)**: done 2026-11-12 with the High yield narration
([task](done/2026-11-12-high-yield-narration.md)): "at any level", and a changed `hy` means recording `<lecture>-hy.mp3` again
in the same PR (the smoke lint names it; until then the page doesn't offer the old recording).

**[build-a-hub](../how-to/build-a-hub.md)** (with phase 1's rewrite): a new hub's High yield comes from its `LIKELY_TOPICS`
and hints with no extra work; check its picks with `node tools/hub-next/high-yield.mjs <hub>` and fix a weak one by fixing
the topic (its words, its questions), never by writing High yield text by hand. Narrate it with the other two levels:
`python3 tools/narrate.py hubs/<hub>/next/content/notes.json --level hy`, then the build
([narrate-with-kokoro](../how-to/narrate-with-kokoro.md)).

**About page**, Notes (add, tagged new): **Three ways to read**: As taught (the professor's version), Plain English (the same
facts in everyday words) and **High yield**: only what's most likely on the exam. Each predicted topic (the same list as Exam
hints' "Most likely questions"), strongest evidence first, with the part of the notes that teaches it and the professor's own
"know this", then what else was flagged in class and what you can skip. Its button at the end opens that lecture's High
likelihood questions. Listen reads High yield too, in the same voice as the other levels, with Follow along.

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

Sam confirmed the calls in that note (2026-11-06); built 2026-11-12 and checked against the engine as built (the drafts
below are the built behavior). At the release:

1. **Apply `migration_v56.sql`** through the connector right after `migration_v54` and `migration_v55` (it needs both). In
   the switch PR: append it to `supabase/schema.sql` and take its line out of `supabase/pending-migrations.txt`; then
   `node tools/release/rls.js` and `rls-audit.sql` on the live project. Until it's applied, Learn and Flashcards work on
   each device and the ratings wait there (`STATE.cardq`), going out on the first page load after it is.
2. `sw.js`: add `widget/study-modes.js` and `widget/study-modes.css` to `PRECACHE` with the engine's files.
3. The About page entries below, then `node tools/timmy/build.mjs` (with Ask Timmy's step), so Timmy's site help knows
   them.
4. **One Learn round and a few flashcards on the live site** from a phone and a laptop: the ratings reach `card_reviews`
   (count only, read-only SQL), a second device linked with Link my devices shows the same schedule, and XP shows a
   `card` award.

**[question-bank-filter-panel](../rules/question-bank-filter-panel.md)** (add):
- **Study as** at the top of the Questions view: **Questions · Learn · Flashcards** (`STATE.ui.qview`, saved like the panel). The
  panel picks which questions and the toggle how; Lectures, Show, the High likelihood toggle, More filters, search, the tags
  and Clear all work the same in all three. Order (In order / Random) shows only for Questions. Drill, Yesterday's misses and
  Weak spots work in all three; the mock is always questions (no toggle while it runs). Tracked as `bank:view=<view>`.
  Learn and Flashcards draw in `widget/study-modes.js` from the set the panel picked ([the task](2026-11-06-redesign-learn-and-flashcards.md)).

**About page**, Questions (new entry, tagged new): **Study as**: Questions as now; **Learn** asks the questions you picked in
rounds of 7 until you've got each right twice (the second time, when the question allows it, you think of the answer
before the choices show; a miss comes back at the end of the round); a bar shows how far along you are, and each round
ends with what you got. **Flashcards** show the question, you flip it (Show the answer, a tap on the card or the space bar)
and say how well you knew it (Again, Hard, Good, Easy, or keys 1 to 4), and it comes back when you're about to forget
it, never later than the day before the exam; Home tells you when cards are due. Learn's answers count like any answer;
a flashcard counts toward your daily goal and streak (not as an answer: no class stats, no "Last time") and earns 2 XP
when it's due or new, for its first three ratings a day; Study ahead earns none. The mock exam is always questions.
"What the hubs record": how you rated each flashcard and where you are in Learn, so your schedule and progress follow you
to your other devices.

### From phase 4, part A (the journeys' client, [the journeys](2026-11-06-redesign-progression-journeys.md), built 2026-11-12)

**Already wired, switches on by itself when migration_v54 is applied** (step 6 below, in part): the new hubs call
`get_widget_bootstrap_v2`, `record_answer_v2` in place of today's answer calls, `xp_session_start` / `xp_session_finish`
for a mock, `get_rank_profile_v2` and `mark_dark_unlock_seen`; the new dashboard already read the `_v2` profile and
boards. Until the functions exist each of them falls back to today's call. The keys must be loaded (step 3) before
the first answer, or answers are recorded and pay nothing (`why: unknown`).

**Still to wire, at the release or before it** (the box in Done when):

- [x] **The arcade** (`widget/games.js`, shared with the live hubs until the switch): a game starts a session
      (`shGame.startSession("arcade", game)`) and finishes it (`finishSession(id, score)`: the +50, and the server posts
      the score itself, so the page stops calling `submit_arcade_score` for it); its answers send the pick's authored
      index and `session`. An answer without an index is refused by the server and recorded by today's calls instead.
      Done 2026-11-13 by [the wiring](done/2026-11-12-redesign-game-layer-wiring.md) (`shGames.played` / `over`, and
      `gameHooks` in `tools/hub-next/build.mjs` for a hub's own games).
- [x] **Timmy Time** (`widget/podcast.js`): each minute heard reports to `pod_minute_v2`; the +100 at 90% is the
      server's. Its XP should reach the pill the way an answer's does (an event like `sh:answer-paid`, or a profile
      refresh). Done 2026-11-13 by [the wiring](done/2026-11-12-redesign-game-layer-wiring.md) (`sh:pod-paid`); it pays
      only once step 4 below has loaded the episode's length.
- [x] **The journey trophies in the trophy case**: `journey-0` to `journey-2` are drawn (`SH_JOURNEY_ART.trophies`) and
      show on the road ahead and in the hand-off; the case in Stats (`widget/ranks.js`, `TROPHIES`) doesn't list them
      yet, so it still says 24. They join it when phase 4 redraws the case, with `get_trophy_stats_v2` for their
      shares: 27 trophies then. Done 2026-11-13 by [the trophy case's session](done/2026-11-12-redesign-trophy-case-and-cards.md):
      on the redesign's pages the case lists them as "The journeys" (27 trophies, their shares from
      `get_trophy_stats_v2`); a live page still says 24.
- (moved to [the inbox](inbox.md), 2026-11-13) **Sound** for the hand-off and the unlock, only if the redesign gets a sound setting (it has none; the scenes
      are silent).
- [x] `sw.js`: `widget/journeys.js` and `widget/hub-art/journeys.js` join `PRECACHE` with the engine's files, so a
      scene still plays offline.
- [x] The hand-off and the unlock looked at on the release's own preview, reduced motion too (`?xp=124999` and one
      answer plays the hand-off; `?xp=49999` the Handpiece's unlock).
      **2026-11-13, on the release's preview: the Dark Matter unlock, with and without motion; the hand-off is played by the smoke test (the journeys' pass).**

**About page** (`about/index.html`, Part 5, replacing today's "XP", "Handpiece ranks" and "Rank-up celebrations"
entries; tagged new; nothing here is a secret):

- **XP**: 10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss, and a flat 2 for a
  card you grade yourself, plus 20 for every day you study. There is no daily cap any more. A question pays for its
  first three right and its first three wrong answers each day, and answers less than 2 seconds apart (or more than 30
  in a minute) still count but earn nothing. Counted across every hub.
- **More ways to earn XP**: +30 at your 20th answer of the day; +5 the first time you get right a question you missed
  on an earlier day; +50 for a mock exam with 10 or more answers (once a hub a day); +50 for finishing an arcade game
  (each game once a day, after 20 seconds of play); 10 for each minute of a Timmy Time episode you hear for the first time
  (most of the minute, up to twice as fast) and +100 for finishing it;
  +100 when a report or suggestion you sent is fixed; and +100, +200, +300 and +500 for a hub's Bronze, Silver, Gold
  and Crown medals.
- **Double XP**: every new mastery medal starts 24 hours of double XP on answers, the day's bonuses, mocks and games
  (never more than 2x, and a new medal starts the 24 hours again). A gold "2x" chip on your rank shows the time left,
  and the XP that flies up from an answer says "2x".
- **Three journeys**: the handpiece ladder is the first of three. Handpiece: Stone (start), Antique (300 XP), Bronze
  (1,500), Silver (5,000), Gold (12,000), Diamond (25,000), Dark Matter (50,000). At 125,000 XP the ModuPro begins (the
  sim-lab typodont), and at 250,000 the Loupes, each with the same seven ranks, evenly spaced, each rank with levels I,
  II and III. Nothing is lost on the way: your XP, trophies, accent metals and Timmy's house come with you. From the
  ModuPro on your rank reads "ModuPro Gold II". More, Stats shows the road ahead.
- **Rank-up celebrations**: as today (the cutscene for a new rank, the coin-flip card for a new level), now with the
  journey's own object. Two new full-screen scenes: **reaching Dark Matter** opens a starfield inside the medallion
  (once per journey, ever, on whichever device gets there first; each journey has its own sky), and **finishing a
  journey** hands you the next object: "The ModuPro is yours." Both can be skipped, wait until a mock exam is over, are
  one still card with reduced motion, and are off with Settings, Extras, Rank-up and trophy cards.
- **Trophy case**: 27 trophies (was 24), 16 of them secret: the three new ones here are **Handpiece finished**,
  **ModuPro finished** and **Loupes finished**, one for each journey completed; Bowling joins as a secret and Full Arch
  leaves ("From phase 4, session 6" below has the case's own entry and the whole count). "All 24 trophies" in the
  contents and Part 9's list become 27.

### From phase 4, part C (Timmy's place as a real client, [the place](2026-11-06-redesign-timmys-place.md), built 2026-11-12)

What part C built is in the place's note (its Log) and [game-server](../reference/game-server.md). It runs only on the
redesign's pages, on the game layer (`get_my_shop`, `equip_item`), so it goes live with the release and with the shop.

- [x] **The shop first** (part B): until it is built the customizer has no "Get more in the shop" and what Timmy owns
      comes from the server's gifts and rank pieces only (Halloween 2026's set and the Handpiece's rank sets). (Built:
      part B, below; the customizer's "Get more in the shop" opens it.)
- [x] **Five everyday outfits have no drawing** ([task](done/2026-11-12-five-outfits-without-a-drawing.md), Sam's call:
      draw them or take them out of the catalog) and the five rare costumes are part B's art. Until then the place
      draws Timmy as himself in any of them. (Drawn, all ten, and approved by Sam: [#339](https://github.com/smcmurry6-source/study-hubs/pull/339), 2026-11-12.)
- (its own task, not part of the release) **The later journeys' rank sets** ([task](2026-11-12-redesign-later-journeys-rank-sets.md)): 28 drawings and 28
      catalog rows, cut from part C with Sam's yes. Not needed for the release (nobody is near 125,000 XP).
- [x] **Timmy on a hub's bar doesn't wear his place's outfit yet**: `widget/pet.js` wasn't touched in part C. It
      belongs to "everyone has Timmy" ([Ask Timmy](2026-11-12-redesign-ask-timmy.md), part 4), which changes pet.js
      anyway: the outfit equipped at his place (`shop.equipped.outfit`) should show on the bar and in the classroom.
      **Done in Ask Timmy, part 4, and at the release it is the only behavior on every page.**
- [x] **Snack HP**: `get_pet_days_v2` carries each day's `hp` from snacks and `widget/pet.js` doesn't read it yet
      (part B, with the snacks). (Done in part B: `simulate()` adds it, the redesign's pages ask `get_pet_days_v2`.)
- [x] `sw.js`: `widget/place.js`, `widget/place.css` and `widget/hub-art/place.js` join `PRECACHE` with the engine's
      files; the set files in `widget/hub-art/place/` don't (fifteen files, fetched only when a piece of that set is
      drawn).
- [x] **The live dashboard's house card comes down with the old dashboard**: nothing to do in `widget/pet.js` for the
      release itself. `houseSvg`, the old flair pennants and `sh_rank_tier`'s use there can go once no page shows them.
      **At the release: Timmy's lines and checkup no longer describe the old house (BUG-133). `houseSvg` stays as the picture under the place until it has drawn; taking it out is in [the inbox](inbox.md).**
- [x] The place looked at on the release's own preview, phone and laptop, reduced motion too (`?persona=high-xp` has
      everything; `?xp=180000` the ModuPro on the pedestal, `?xp=300000` Timmy in loupes).
      **2026-11-13, on the release's preview as the account that has everything, phone and laptop: the card, the full view, the customizer.**

**About page** (`about/index.html`, a new entry "Timmy's place" in Timmy Tooth's part, tagged new, replacing the lines on
his house card; the tap surprises go inside a `spoil` element):

- **Timmy's place**: Timmy has a place of his own: a home, the scene around it and a yard with five
  spots. It is on the dashboard's "You" card and in every hub under More, Timmy's place. Tap the picture to step in.
- **Timmy at home**: tap anything and he hops over to it; tap him and he waves, and again while he's waving for a
  flip. How he moves is his health: at 90 HP and up he bounces and wanders the most, lower down he slows, and when he
  needs treatment he stays on the doorstep and tells you what he needs. Studying is still what heals him.
- **Your rank and your medals live there**: a statue of your rank stands by the door, in your rank's metal, on one
  step for each level. Past the Handpiece the ModuPro joins it on the pedestal, and in the Loupes journey Timmy wears
  his loupes. Every hub you've earned a mastery medal in hangs its medal on the board by the house (up to twenty; tap
  the board to see them all, in each hub's colors).
- **Customize**: change the home, the scene, what stands in each yard spot, the home's upgrades and paint, and what
  Timmy wears, from what you own. Every change is saved as you make it and follows you to your other linked devices.
  The bowling lane is long: it takes the side yard and the front corner together. "Surprise me" picks a whole new look.
- **What you own**: the cottage on the hill is every Timmy's first home. Halloween 2026's set is a gift to everyone,
  each full rank-up gives an outfit and a yard piece (earned, never sold), and everything else is bought in Timmy's
  shop with Shiny Gold Crowns. What you own is yours for good, on every device you link; spending never lowers your
  XP or your rank.
- **Seasons**: the yard follows the year (spring blossom, fall leaves, winter snow), and on Timmy's holidays the place
  puts out its holiday props. Timmy himself wears what you put on him.
- **Study streak flame**: two more colors, blue from 10 days in a row and Dark Matter from 30.
- In a spoiler: **things to tap at his place**: the sun puts on its shades, the moon has a cow, a cloud rains on the
  garden, Number thirty-one takes his temperature next door, the rabbit down the hill pops out of its burrow, and
  every yard piece does something of its own (the mailbox has a letter from thirty-one; the telescope finds Molar
  Major).
- "What the hubs record" gets: opening Timmy's place and changing something there are counted (which spot, never
  which piece).

**`tools/podcast/LORE.md`** ("Where he lives", replacing the house-card line; nothing here contradicts an episode):

- His **place**: the cottage on a hill is every Timmy's first home, with the toothbrush planted by the front door and
  the tree out front. A student can move him (a castle, a giant mushroom, a treehouse, a lighthouse, and a home in
  each seasonal set) and set the scene around it (the beach, the forest, above the clouds, a snowy mountain, the night
  sky), so an episode never says where he lives today: "my place", "the yard", "the front door" are always true.
- **By the door**: the toothbrush (it talks now), and a statue of the student's rank in the rank's metal; past the
  Handpiece a ModuPro shares the pedestal, and in the Loupes journey Timmy wears loupes. The medal board by the house
  hangs one medal for every hub the student has mastered.
- **Neighbors, seen from the yard**: Number thirty-one's house is the small one up the hill (tap it and he takes his
  temperature; his letters come to Timmy's mailbox, usually about a bump). The rabbit down the hill has a burrow at
  the bottom of the yard. New, and only at certain scenes: a crab on the beach (it has moved into a sandcastle), an
  owl in the forest, a yeti behind a rock on the mountain, a friend in a crater under the night sky, a whale off the
  beach, and the dog in the doghouse, who brushes twice a day.
- **The podcast studio** is a yard piece: where it stands, that's where Timmy Time is recorded. Nothing in an episode
  says otherwise so far; don't place the studio anywhere else.
- **His health shows in how he moves** at his place (bouncing when sparkling, on the doorstep when he needs
  treatment), the same HP as everywhere else. A visitor never sees it: a visited Timmy is always drawn well.

### From phase 4, part B (Timmy's shop, [the shop](2026-11-06-redesign-timmy-shop.md), built 2026-11-12)

What part B built is in the shop's note (session 2 in its Log) and [game-server](../reference/game-server.md) ("How
the client uses it"). It runs only on the redesign's pages, on the game layer, so it goes live with the release.

- [x] `sw.js`: `widget/shop.js`, `widget/shop.css` and `widget/hub-art/shop.js` join `PRECACHE` with the place's files
      (they load on first use, never with a page).
- [x] The shop looked at on the release's own preview, phone and laptop, light and dark, reduced motion too
      (`?persona=returning` about 300 gold crowns, `?persona=high-xp` about 20,000, `?persona=missed` about 80; a
      rare costume: `?persona=returning&now=2027-01-07T10:00`, the detective).
      **2026-11-13, on the release's preview, phone and laptop.**
- [x] **A hub's Shop row waits for Timmy to be adopted** (the shop draws him in the outfits, and pet.js loads on a new
      hub only once he's adopted). "Everyone has Timmy" ([Ask Timmy](2026-11-12-redesign-ask-timmy.md), part 4) takes
      the condition out (`hasShop()` in `widget/hub-timmy.js`). The new dashboard always shows the balance and the button.
      Done in part 4: the row shows whenever the bootstrap carries a shop.

**About page** (`about/index.html`, a new entry "Timmy's shop" after "Timmy's place" in Timmy Tooth's part, tagged
new; the rare costumes go inside a `spoil` element):

- **Shiny Gold Crowns**: the hubs' money, for Timmy's shop. You earn 1 for every 10 XP (a boost's extra XP doesn't
  count), 25 for each trophy, 50 for each mastery medal and 20 for each rank-up. Spending them never lowers your XP or
  your rank. Your balance is on the dashboard's "You" card and on the shop's counter.
- **Timmy's shop**: on the dashboard's "You" card (the Shop button), in every hub under More, and from Timmy's place
  ("Get more in the shop"). Today's picks (four pieces, new at midnight Central time), This week (three, new every
  Monday), the seasons' sets while they're on, a "Back for today" shelf on two throwback days a month, and the snacks
  and boosts, always. Tap anything for a closer look; Buy asks once more, with your balance after. Outfits, homes,
  scenes, yard pieces and the home's upgrades are yours for good: "Put it on" or "Place it" takes you to the customizer.
- **Rarity**: Common, Uncommon, Rare, Epic and Legendary, each with its own frame. The rarer a piece, the less often
  it's on a shelf. Today's showcase is the rarest piece on sale that you don't own yet.
- **Snacks for Timmy**: an apple (+10 HP), a cheese cube (+15), floss (+25) and a fluoride rinse (+40), one of each a
  day, and not while he's at 100 HP. He eats it at once. Studying still heals him too.
- **Double XP boosts**: one hour or three, starting when you buy one; a second one adds its time to the first. The
  2x shows on your rank.
- In a spoiler: **rare costumes**: now and then a rare costume turns up at the shop (the pirate, the astronaut, the
  detective, the chef and the legendary Captain Enamel), on a different day for everyone. Timmy tells you when one
  does, the Shop button gets a dot, and the costume waits on the Spotted shelf until you buy it. "Spotted: 2 of 5"
  counts the ones you've seen; the others are shapes.
- "What the hubs record" gets: opening the shop, a purchase (its kind: an outfit, a snack, a boost..., never which
  piece) and a rare costume turning up are counted. What you bought is kept, so it stays yours on every device.

### From phase 4, part D (the bowling egg, [the bowling egg](done/2026-11-06-redesign-bowling-egg.md), built 2026-11-13)

What part D built is in the bowling egg's note (its Log) and phase 4's Log. It runs only on the redesign's pages (the
engine's answer path and Timmy's place), needs nothing on the server, and goes live with the release.

- [x] `sw.js`: `widget/bowling.js` and `widget/hub-art/bowling.js` join `PRECACHE` with the place's files, if the
      wiring session hasn't already (they load at the first strike or the first tap on the lane, never with a page).
- [x] The clips looked at on the release's own preview, phone and laptop, reduced motion too (`sh_bowl_run` set to 49
      in the device's storage, then one first-try right answer; `?persona=high-xp` has the lane at Timmy's place).
      **2026-11-13, on the release's preview: a clip on a phone and one on a laptop with reduced motion; the run, the strike at 50 and the turkey are played by the smoke test.**
- (moved to [the inbox](inbox.md), 2026-11-13: the first migration after the release) **The Bowling trophy is on the device only** until the first migration after the release adds `bowling` to
      `record_achievement`'s kinds ([the later journeys' rank sets](2026-11-12-redesign-later-journeys-rank-sets.md));
      until then its row on the About page shows no share of the class.

**About page** (`about/index.html`, in a spoiler; a new entry in Part 7, Easter eggs, tagged new and with the trophy's
tag, and a secret row in Part 9's trophy table, counted in the 27; "All 24 trophies" becomes "All 27 trophies" with
the other changes listed below):

- In Easter eggs, the entry's name and how-to inside `spoil`, its placeholder outside: **Bowling night** (the trophy:
  Lane Legend). *How*: get 50 questions right in a row on the first try (any hub; a second try doesn't count, a wrong
  first try starts the run again), or tap the bowling lane at Timmy's place. *What*: a short cartoon plays at the bottom
  of the screen, like the ones bowling alleys show after a strike: the pins are the Plaque crew and the ball is a
  sugar-free mint. Strikes at 50 and 100 in a row; at 150, a turkey. Eight clips in all; tap one to skip it. Not in a
  mock exam, and off with Hidden secrets or Focus mode. Placeholder: "Something happens after a long run of right
  answers (spoiler)."
- In the trophy table, a secret row (`data-k="bowling"`): **Lane Legend**, "See all eight bowling clips", clue "The
  alley's screen plays something odd after a strike. There are eight.", the share column "kept on this device" until the
  server records it.
- "What the hubs record" gets: a bowling clip playing is counted (which clip, never who saw it); the clips you've seen
  and your run of right answers are kept on your device only.
- Timmy's secret tips (his list of eggs, in `widget/pet.js`): add the bowling egg after the Plaque Boss, as a tip
  like "Fifty right in a row, first try, and the alley's screen does something. Thirty-one hates the noise." (one line;
  `pet.js` is shared, so only at the release).

### From phase 4, visiting ([visiting](done/2026-11-12-redesign-visiting.md), built 2026-11-13)

What the visiting session built is in its note (its Log) and phase 4's Log. It runs only on the new dashboard, on the
game layer (the `_v2` boards' visit keys and `get_place`, migration_v54), so it goes live with the release. Without the
game layer no row is a button.

- [x] Visiting looked at on the release's own preview, phone and laptop, light and dark, reduced motion too: a tap on a
      row or one of the stage's top three opens that classmate's place (`?persona=returning`: Fixture Fluoride is a
      ModuPro, Dummy Dentin's place can't be opened, on purpose; your own row is #11).
      **2026-11-13, on the release's preview, phone and laptop: a row opens the place with its #1 badge, the arrows and Back to mine.**
- [ ] **Apply `migration_v57.sql`** (Visit someone random from the whole class, `get_random_place`; Sam, 2026-11-13: "i
      want random to be for the whole class") through the connector right after `migration_v56` (it needs v54's
      `get_place` and `sh_visit_key`). In the switch PR: append it to `supabase/schema.sql` and take its line out of
      `supabase/pending-migrations.txt`; then `node tools/release/rls.js` and `rls-audit.sql` on the live project. Until
      it's applied, the button picks among the board's rows. It picks only people who have decorated their place (Sam:
      "skip people with zero customization"), so on the first day it may say "No one else has decorated their place
      yet" until someone does. On the live site, from a laptop, once a few people have: a few presses of Next on a
      random trip reach someone who isn't on the boards, never your own place and never a plain one.
- (moved to [the inbox](inbox.md), 2026-11-13) The hubs' boards (the shared widget's panel, `widget/v3.js`) don't visit yet (Sam, 2026-11-12: the new dashboard's
      boards only). When the hubs' boards are rebuilt for the redesign, a row there can open a place the same way
      (`shPlace.open({ place })` with what `get_place` gives).
- [x] **BUG-112** ([the bug log](../release/bug-log.md)): `widget/ranks.js`'s medal button for two or more medals shows
      "+1" that its name leaves out (axe: label in name, serious). It's shared with the live pages, so it's fixed when
      the old pages come down: put the count in its `aria-label` ("Mastery medals (2): ...").
      **Fixed in the switch PR, on every page: the name holds the text the button shows.**

**About page** (`about/index.html`, a new entry "Visiting" in Timmy Tooth's part, next to "Timmy's place", tagged new):

- **Visiting**: tap anyone on the dashboard's leaderboard (Ranks or Study streaks, the top three on the stage too)
  to fly over through the clouds to their Timmy's place: their home, scene and yard, what their Timmy is wearing, their rank's statue and their
  hub medals, under their leaderboard name. Tap their Timmy and he waves; the things around the place do what they do
  at yours. Your own row opens your own place.
- **Visit someone random** (under the leaderboard) rolls the die and takes you to anyone in the class who has
  decorated their place, on the leaderboard or not (never your own). Next rolls again, the back arrow returns to the
  places you've been, and you meet everyone once before anyone comes round twice.
- **Top ten**: visiting someone in the leaderboard's top ten shows their number next to their name: gold for #1,
  silver for #2, bronze for #3. Visiting from the leaderboard, the arrows on either side take
  you to the next or the last place on the board. **Back to mine** brings you home. Each trip is through the clouds.
- **What a visitor sees, and doesn't**: only the place. Never your HP, XP as a number, your streak, your answers, your
  Shiny Gold Crowns, what you own beyond what's out, or when you did anything. Nobody can change your place but you,
  and there's no list of who visited. Everyone on a board can be visited (there's no switch to turn it off).
- "What the hubs record" gets: a visit is counted (that one happened, never whose place).

### From phase 4, session 6 (the trophy case and the cards, [its note](done/2026-11-12-redesign-trophy-case-and-cards.md), built 2026-11-13)

What the session built is in its note (its Outcome) and phase 4's Log. It runs only on the redesign's pages (`html.shx`;
Full Arch's gate also on `data-game="v2"`), so it goes live with them; a live page keeps 24 trophies, Full Arch, the
old Stats panel and today's cards.

- [x] `sw.js`: `widget/trophies.js`, `widget/trophies.css` and `widget/hub-art/trophies.js` join `PRECACHE` with the
      engine's files (session 8 or 9). All three load on first use (the case opened, or the first card), so phase 5,
      part 2 counts them among those.
- [x] The case and the cards looked at on the release's own preview, phone and laptop, light and dark, reduced motion
      too (phase 4's Done when): More, Stats and trophies as `?persona=high-xp` (most trophies, Full Arch retired) and
      `returning`; the "you" card's Trophy case on the new dashboard; the cards with `shRanks.preview("trophy", 0)`,
      `("mastery", 2)`, `("tier", 2, 3)`, `("level", 4, 2)`, `("mock", 37, 40)` from the console.
      **2026-11-13: the case on the release's preview, phone and laptop; the cards by the smoke test (their markup, a card after a level-up).**
- (moved to [the inbox](inbox.md), 2026-11-13; Full Arch's branches in `widget/eggs.js` went with the release) When the old pages come down: the `NEW` branches in `widget/ranks.js`, `widget/rankup.js` and `widget/eggs.js`
      (`ARCH_OFF`) become the only path, with "Full Arch comes out" above (the `RETIRED` row stays, for those who won it).
      (**BUG-116**, a level-up card stopping later cards, is fixed on every page: [the bug log](../release/bug-log.md).)
- (moved to [the inbox](inbox.md), 2026-11-13: the first migration after the release) The **Bowling** trophy shows no share until the first migration after the release counts the kind (part D's box
      above); the case reads `get_trophy_stats_v2` and shows a share for any kind it returns.
- (Sam's call, moved to [the inbox](inbox.md), 2026-11-13) **The hub trophies** (8 a hub: the mastery levels, every question answered, mock exams, the boss) aren't in the
      new case; they show in today's panel behind its Leaderboards button. Sam's call whether the case gets a shelf for
      them (this hub's first, as today's panel has it) before the release.

**About page** (`about/index.html`, Part 5, replacing today's "Trophy case" and "Trophy and medal cards" entries; tagged
new; the secret's names stay inside `spoil`):

- **Trophy case**: 27 trophies, in More, Stats and trophies in a hub, or from the "Trophy case" button on your card on
  the dashboard. Your rank sits on top with the road ahead. Then a showcase stand with one trophy at a time (it opens
  on your rarest; tap any trophy to put it there) and a cabinet with three shelves: **Won by studying** (8), **The
  journeys** (3: Handpiece, ModuPro and Loupes finished) and **Secrets** (16). A trophy you've won is lit on its brass
  plate with the share of the class that has it; one you haven't is dimmed, with what earns it; a secret you haven't
  found is only its shape and its clue, with how many have found it. If you won **Full Arch** before it was retired,
  it stays in your case on a "Retired" shelf. The leaderboards are behind the Leaderboards button.
- **Your stats**: under the case, your numbers on a scoreboard (answered, right, best run, days you met your goal),
  a card for each lecture with how you're doing (your strongest and the one that needs work marked), and your
  achievements.
- **Trophy and medal cards**: a new trophy or medal pops up framed in its metal, drawn, with the share of the class
  that has it and what's next ("12 of 27 in your case", "Gold at 90% right"). A new rank names the pieces it brings
  to Timmy's place. They take turns, wait until a mock exam is submitted, are one still card with reduced motion, and
  are off with Settings, Extras, Rank-up and trophy cards.
- **Hub trophies** (Part 9's per-hub list): 8 a hub, not 9 (the 32 teeth are gone with Full Arch). The new case
  doesn't show them: they are in today's panel behind the Leaderboards button, as before. Whether the case gets a
  shelf for this hub's trophies is Sam's call (asked with session 6's PR; the box below).
- Part 9, "All 27 trophies": the three journey rows, Bowling's secret row ("From phase 4, part D"), and Full Arch's
  row out (or marked retired, for the record).

### What Sam's calls of 2026-11-12 change in the drafts above

The sessions that build each part fix the drafts they make untrue; this is the list, so none is missed.

- **Everyone has Timmy** ([Timmy everywhere](2026-11-12-redesign-ask-timmy.md)): "once you adopt Timmy" goes from
  the place's About draft and from anywhere else it appears; the About page's adoption entry goes. Done in part 4: the
  drafts above are fixed, and the About page's changes are in "From Ask Timmy, part 4" below.
- **Timmy wears only what the student put on** (Sam: "if someone doesnt have a costume applied, they are naked. What
  you put wins"): the place's "Seasons" draft keeps the yard and the holiday props but no longer says the place
  "dresses up with him"; the About page's lines on Timmy's holiday outfits are rewritten (they are in his wardrobe
  now: the seasonal sets); `LORE.md`'s "he can't pick one" is canon for the episodes already out, and from the
  redesign on the student dresses him. Rare costumes turn up at the shop; he doesn't wear one by himself. Done in part
  4 (the place's draft, `LORE.md`, and the About lines in "From Ask Timmy, part 4").
- **The trophy count** is 27, 16 of them secret (today's 24 without Full Arch, the three journey trophies and
  Bowling; today's 24 already have 16 secret, so the live About page's "14" was out of date: Sam OK'd 16 on 2026-11-13).
  "From phase 4, part A" now says so. The Bowling trophy is kept on the device until the first migration after the release, so it
  shows no share of the class at first ([the bowling egg](done/2026-11-06-redesign-bowling-egg.md)).
- **Full Arch is gone**: the 32-tooth chart, its switch and its trophy (the box in Done when). Where a draft above
  lists the extras a setting turns off ("the Full Arch chart" in phase 3's Settings draft), it comes out.
- **New drafts to come**, each written by its session under its own heading here: none left from phase 4. (Part B's,
  part D's, visiting's and the trophy case's are written: "From phase 4, part B", "From phase 4, part D", "From phase 4,
  visiting" and "From phase 4, session 6", above.)
- **Which hub is switched**: with no date and ten sessions to go, the release comes after Perio's final (Nov 19), so
  it switches the dashboard and whichever hub is live then. Sam hasn't named the hub that follows Perio: ask at the
  start of the release session, and build that hub on the engine from the start.

### From phase 5, part 2 (the bundles, [phase 5](done/2026-11-05-redesign-phase-5-backend.md), built 2026-11-13)

A redesigned page no longer loads the widget's files one by one. What it loads is listed in
`tools/bundle/bundles.json` and built by `node tools/bundle/build.mjs` ([bundles](../reference/bundles.md)):
`widget/hub.bundle.js` (a hub's engine) or `widget/dash.bundle.js` (the dashboard's), with the page; then
`widget/rest.bundle.js` (the slim database client and the widgets both kinds of page share) and, on a hub,
`widget/hub-rest.bundle.js` (`widget/v3.js`, `widget/v3.css` and what v3.js loads); one stylesheet,
`widget/site.bundle.css`; the fonts in `assets/fonts/` (Nunito Sans, and `vt323.woff2` for the 8-bit code). **This
changes the drafts above and below wherever they name a bundled file:**

- [x] `sw.js`'s `PRECACHE` for the redesign's pages: the four bundles, `widget/site.bundle.css`,
      `assets/fonts/nunito-sans-normal.woff2`, `nunito-sans-italic.woff2` and `vt323.woff2`, **instead of** every file
      in `tools/bundle/bundles.json` (the engine's four scripts and `widget/hub-art.js`; `widget/hub.css`,
      `widget/dash.js`, `widget/dash.css`, `widget/hub-art/dash.js`; `widget/ask.js` and `.css`, `widget/ideas.js` and
      `.css`; and today's `widget/v3.js`, `v3.css`, `archive.js`, `eggs.js`, `clicks.js`, `replies.js`, `linkask.js`,
      `ranks.js`, `pet.js`, `timmy.js`, `drill.js`, `fx.js`, `highlight.js`, `podcast.js`, `qhealth.js` and the full
      client, once no page that stays up loads them by name). The files that stay their own keep their boxes as
      written: `hubs.js`, `widget/hub-art/<hub>.js`, `widget/hub-art/class.js`, `study-modes`, `journeys`, `place`,
      `shop`, `bowling`, `trophies`, `hub-art/board.js`, `rankup.js`, `tour.js`, `games.js`, `cases`, `recap.js`
- [x] `sw.js`: the content JSON (`hubs/<hub>/content/*.json`) served stale-while-revalidate (phase 5's plan; it only
      serves the new engine, so it comes with the release)
      **Done: served from the cache at once and refreshed behind it, so a content edit shows on the load after the one that fetched it.**
- [x] The smoke test's `ENGINE` list is gone: "a file a later session adds to the engine joins ... the smoke test's
      `ENGINE`" (the engine's files, above) now means **a line in `tools/bundle/bundles.json`**, then
      `node tools/bundle/build.mjs` and the rebuilt bundles committed. CI fails when a bundle is stale
      (`node tools/bundle/build.mjs --check`, in "Check hubs"), and the smoke test fails when a redesigned page fetches
      a bundled file by itself
- [x] When the new pages take the old ones' addresses: the pages' paths to `widget/` change (`../../../widget/` to
      `../../widget/` on a hub, `../widget/` to `widget/` on the dashboard, and `C.widget` / `C.assets` / `C.root` in
      their settings). Nothing inside a bundle depends on the page's address: a held file finds its neighbors from the
      bundle's own address (`SH_BUNDLE.dir`), and the stylesheet's `url(...)` are relative to `widget/`
- [x] The old pages (the live dashboard, each hub's old `index.html`, `review/`, the About page) keep loading the
      separate files and the full client `widget/vendor/supabase-2.117.2.js`. Delete a separate file or the full client
      only when `grep` finds no page loading it by name (`review/` uses the full client and isn't being redesigned);
      the sources of a bundle are never deleted, the bundles are built from them
- [x] The budgets: `tools/release/budgets.json`'s rows for `next/` and `hubs/<hub>/next/` move to the pages' own
      addresses; `node tools/release/perf.js` now measures a page's **whole load** (until the network has been quiet
      for 2 s), where it used to stop 3 s after the load event, so a number from before 2026-11-13 isn't comparable
      with one after
- [x] Sam's call, asked in [#358](https://github.com/smcmurry6-source/study-hubs/pull/358): the saved recap image on
      the new dashboard is set in Nunito Sans (the redesign's one typeface) instead of Fraunces and Work Sans from
      Google Fonts (the live dashboard and the admin page still draw it in the old faces). **Sam, 2026-11-13: "dont
      worry about it"**: it stays, and the saved image keeps its static layout (it isn't redrawn to match the
      dashboard's animated infographic; [decisions](../decisions.md))
- The preview: `tools/preview/transform.js` rewrites `widget/rest.bundle.js` the way it rewrites `widget/pet.js`
  (Timmy's full-screen date), so a bundle that takes in a file the preview rewrites needs its line in `PET_FILES`.

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
4. **Set each episode's length** (`admin_set_podcast_episode`), so Timmy Time's minutes pay: Occlusion `midterm-review`
   2688 s and Heme & Endo Exam 2 `exam2-review` 3101 s (`podcast.duration` in each hub's `next/content/core.json`, rounded
   up); Perio has no episode. Until then `pod_minute_v2` answers `unknown` and the page stops asking for that visit.
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

### From the idea board ([the idea board](2026-11-06-idea-board.md), built 2026-11-12)

1. After migration_v54 is applied and the keys are loaded (above), **post the starting ideas**: the table in the idea
   board's note and the ones written from the past check-ins, each checked against the About page and the redesign plan first.
2. The About page: the entries drafted in the idea board's note ("The About page's entries").
3. `sw.js`: add `widget/ideas.js`, `widget/ideas.css` and `widget/hub-art/board.js` (the board's drawings) to `PRECACHE` (since 2026-11-13 only `board.js`: the other two are in the bundles, "From phase 5, part 2").
4. The admin page's Overview: add "Ideas reported" to "Waiting on you" (`ideas` in the Overview's `needs`), left out
   until the function exists so the live page doesn't ask for it on every load.
5. The check-in with the tick is `widget/dash.js`'s; the old `index.html`'s goes with the old dashboard.
6. The hubs' Inbox shows an idea's status note once `widget/v3.js` reads `get_widget_bootstrap_v2` (phase 5, part 2);
   the new dashboard's already does.
7. The 90-day delete of hidden and deleted ideas (approved, not built): add it to the weekly retention job and its
   suite (`tools/release/retention.js`), with its line in [analytics-retention](../reference/analytics-retention.md).

### From Ask Timmy, part 2 (the chat, [its note](2026-11-12-redesign-ask-timmy.md), built 2026-11-12)

The chat is `widget/ask.js` + `widget/ask.css`, loaded only by the new pages ([ask-timmy](../reference/ask-timmy.md),
"The chat in the new pages"). At the release, besides its box above:

1. `sw.js`: add `widget/ask.js` and `widget/ask.css` to `PRECACHE` with the engine's files (since 2026-11-13 both are in the bundles: nothing to add, "From phase 5, part 2").
2. The function's `TIMMY_CONTENT_BASE` is the content's released address (the switch PR says where).
3. **One question from the live site on a phone and a laptop**, plain voice and Timmy's: a "From the notes" link opens
   the paragraph, Report sends, `admin_timmy_days` shows it with its cost.
4. `supabase/functions/timmy/site.json` is rebuilt after the About page's edits below (`node tools/timmy/build.mjs`; CI's
   "generated files are current" step fails otherwise), so Timmy's site help knows about himself.

**About page** (in `section#timmy` unless said; nothing here is a secret):

- **Ask Timmy** <span class="tag new">new</span>: tap Timmy and pick **Ask me** (on the dashboard, Ask me in his house)
  to ask about the notes. He answers from the hub's own notes, review tables, Exam Hints and cram sheet only (on the
  dashboard, from every live hub's), in a few short lines, with a **From the notes** link under each point that opens the
  notes at that very paragraph. When the notes don't cover something he says so and points to the closest lecture. Starter
  questions: "What should I study tonight?" (he reads your own progress in the hub: weakest lectures, questions missed,
  lectures not started; it's worked out on your device and sent only with that question), "Explain this lecture simply"
  (while you're in its notes), "What's most likely on the exam?" and "How do I use this hub?" (on the dashboard, "When are
  my exams?" and "What can this site do?"). **He won't answer a graded quiz,
  take-home or exam question**, and gives no hints on a practice question before you've answered it. 40 questions a day;
  after that he naps until tomorrow. Paused during a mock exam. Thumbs up or down on each answer, **Report** on any answer
  that's wrong or odd (Sam sees the whole chat and replies in your Inbox), and past chats on this hub (the clock).
- **If he spots a problem or an idea**, he writes it up for you: a report for Sam or an idea for the idea board, in a box
  you can edit. Nothing is sent until you tap Send (or Post); **No thanks** drops it. An idea goes up under your
  leaderboard name.
- **Ask Timmy on a question**: after you answer a practice question, **Ask Timmy** under it opens the chat with that
  question attached ("Why is it ...?"). Not before you answer.
- **Timmy off?** When Timmy is turned off (Settings, Dashboard only on a hub, or Focus mode), an
  **Ask button** sits in his spot (a hub's bottom-left corner; the "You" card on the dashboard) and the same chat answers
  in a plain "Ask the hub" voice, with the same rules.
- **What the hubs record** (`section#widget`; replace "Nothing else you type is recorded"): **Your chats with Ask Timmy
  are saved, every message with your browser's id, to help improve the hub** (Sam reads them on the admin page to fix
  gaps in the notes and wrong answers). They're answered by **Claude, Anthropic's AI**: your question, the hub's notes and
  what's on your screen go to Anthropic's API to write the answer, and nowhere else. Only Sam and your own browser can
  read your chats; classmates never see them. Nothing else you type is recorded. (Add the chats to "How long it's kept"
  once Sam decides how long: [analytics-retention](../reference/analytics-retention.md) has it as proposed.)
- **Settings**: Timmy's line reads "Your cartoon tooth buddy, on the bar: tap him to ask about the notes. He hides during
  mock exams. Off, an Ask button takes his place." (the engine's and the dashboard's Settings already say so).

### From Ask Timmy, part 4 (everyone has Timmy, [its note](2026-11-12-redesign-ask-timmy.md), built 2026-11-13)

On the redesign's pages `widget/pet.js` mounts with `everyone: true` (`widget/v3.js` on a page with `data-game="v2"`,
`widget/dash.js` on the new dashboard): no adoption, a hello on the first visit, 100 HP to start for a Timmy met on or
after `FULL_FROM`, and he wears only the outfit on at his place ([ask-timmy](../reference/ask-timmy.md), "Everyone has
Timmy"). At the release, besides the box above:

1. Set `FULL_FROM` in `widget/pet.js` to the day the switch PR merges (Central time). Every Timmy met from then on
   starts at 100 HP; one adopted before keeps his history.
2. Once no page mounts without `everyone` (the old dashboard and the old hubs come down): `everyone` becomes the only
   behavior, and out come `intro()`, the "Tap me!" line, the perch (`perch`, `place()`, `perchSpace()`), the holiday
   `OUTFITS` and `outfit()` (the eggs, the hubs' themes and the place still read `holidayId()` and `isFall()`: keep
   those), fit()'s `<holiday>:<outfit>` and `fitOutfit()` once no live page sends one, `hasTimmy()` in
   `widget/hub-timmy.js` and its use in `widget/hub.js`'s More, and the old `sh_pet_outfit_<holiday>` keys' use.
3. `sw.js`: nothing new (`widget/hub-art/outfits.js` stays out of `PRECACHE`: it loads only after the first scroll, tap
   or key when the outfit on isn't the one kept on the device).

**About page** (`section#timmy`, Part 6 Timmy Tooth):

- Part 6's lead: "Your cartoon tooth buddy. Everyone has one. Settings → Timmy Tooth: Everywhere, Dashboard only, or Off.
  Nobody else can see his health." (it said "An optional cartoon tooth buddy").
- **Meeting him** is replaced by **Everyone has Timmy** <span class="tag new">new</span>: "Nobody has to adopt him any
  more: he's there from your first visit, on the dashboard's You card and in the bottom-left corner of every hub, and he
  says hello. A Timmy you meet from the redesign on starts at full health, 100 HP; one you already had keeps his health
  and his history. Your other linked devices count his health from the day you first met him."
- **Where he lives**: "On the dashboard's You card, at his place (Timmy's place), and in the bottom-left corner of every
  hub with a health bar. He hides during mock exams."
- **Outfits** is rewritten: "He wears what you put on him at his place (Customize, Timmy), from the shop or from your
  rank, and nothing when nothing is on: on the bar, on the dashboard, at his place, in the classroom and on the
  leaderboard's stage. Holiday looks are in the shop's seasonal sets. He no longer dresses himself for holidays." (Part 8's
  list of his holiday outfits comes out with it; the seasonal sets are in the shop's entry.)
- **Talking to him**: "a word about the outfit he's wearing" stays (it's the outfit you put on).
- **His trophies**: "Pearly Whites for getting him to 100 HP (a Timmy who starts at 100 has to slip below it first and
  come back); Full Recovery for bringing him from 0 back to 100." The trophy table's Pearly Whites row (in a spoiler)
  reads the same.
- **The tour** (`widget/tour.js`, the old dashboard's "Meet Timmy Tooth" step) goes with the old dashboard.

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
5. `sw.js` (since 2026-11-13 `widget/dash.bundle.js` and `widget/site.bundle.css` stand for the bundled ones here:
   "From phase 5, part 2"): add `hubs.js`, `widget/dash.js`, `widget/dash.css`, `widget/hub.css`, `widget/hub-art.js`,
   `widget/hub-art/dash.js` and `widget/hub-art/class.js` (the classroom and the stage) to `PRECACHE` (not
   `widget/hub-art/outfits.js`, 168 KB, which loads only when someone on the page wears a shop outfit), drop what only the old dashboard used, and bump the version.
6. `tools/release/a11y.js`, `perf.js`, `matrix.js` and `tools/ci/smoke.js` test `next/` beside the old dashboard today:
   fold the two into one, rename the baseline and budget keys (`dashboard/next` to `dashboard`, `next/` to `index.html`).
7. The old dashboard's keys still read: `sh_dash_last` (the hub you opened last) and `sh_dash_flap` (the countdown's
   last value). `sh_dash_arcade_hub` and `sh_dash_arcade_game` are no longer used; nothing needs migrating.
8. `get_widget_bootstrap_v2` and the `_v2` boards are called first and fall back to today's functions when the database
   doesn't have them (`rpc2` in `widget/dash.js`); once migration_v54 is applied the fallback can come out.
9. **What a Timmy wears, after the shop** (phase 4): done in [Ask Timmy, part 4](2026-11-12-redesign-ask-timmy.md):
   on the redesign's pages `shPet.fit()` in `widget/pet.js` sends the id of the outfit on at his place ("" for nothing),
   never a holiday's; the live hubs still send `<holiday>:<outfit>` until the release (the classroom's `cleanFit()` and
   `timmyArt()` in `widget/dash.js` take both and draw an id with `widget/hub-art/outfits.js`). The leaderboard's top three get theirs from
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
  see with "Pick your name" / "Change name", Timmy's house (everyone has Timmy: his place, in what you put on him), your handpiece medallion, rank,
  XP, place in the class and the bar to the next level, your mastery medals, your day streak with **the last seven days
  as dots** and this week's answers. The top bar shows the streak and rank too. The two-weeks strip is gone.
- **The class**: **Studying right now** is **a drawn classroom** (Sam, 2026-11-11): the count on the chalkboard with
  how many are in each hub, and a Timmy at a desk for everyone who has a hub open, wearing what their own Timmy has on
  (the outfit on at their Timmy's place; a plain tooth when nothing is on, or with Timmy or the extras off). When someone opens a hub their Timmy hops
  in through the door and jumps into a desk; when they close it he gets up and leaves. The desk's front is the hub's
  color, the windows show day or night, rows are added as the room fills, and past a full room a sign by the door says
  how many are in the hall. **Your own Timmy's desk has a "You" plate** while you have a hub open in another tab, on
  your screen only (your browser remembers which one is its own; nobody else can tell). No names: nobody can tell which
  Timmy is anyone else's. Reduce motion (or answer animations off)
  seats them without the walk; Focus mode shows the plain count. The count is in the top bar too. Under it the
  leaderboard, one list at a time: **Ranks** (top 10, with every rank from Stone to Dark Matter folded under it) or
  **Study streaks**, with **the top three on a stage**: curtains, spotlights, torches, confetti, gold, silver and
  bronze blocks, a crown for first, and each winner's own Timmy on top in their outfit (with the shop). The rest of the board is on the dark stage floor with a bar for how close each is to first.
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

## The merge, step by step (written 2026-11-13 with the switch PR)

Nothing below is done before Sam says "merge" (Sam, 2026-11-13: "Nothing changes the live site or the class's data
before I say merge: no migration applied, no function deployed, no price changed"). Then, in this order, in one
sitting; the admin secret is typed into the connector by hand and never into a file:

1. **Sam first:** the Anthropic API key saved in Supabase (Edge Functions, Secrets: `ANTHROPIC_API_KEY`, made inside a
   workspace) and the Console's spending limit set ([ask-timmy](../reference/ask-timmy.md), "At the release", step 1).
   Without it everything else can still go; Ask Timmy answers "can't reach" until it's there.
2. Bring `main` in if it moved, and the fast checks. If a hub that is on the engine archived since the PR was opened,
   nothing changes for it here (its audio comes off in [its own to-do](2026-11-12-audio-off-at-archiving.md)); 
   **Heme & Endo Exam 2** is already archived and its audio already off in this PR (Sam, 2026-11-13).
3. **`FULL_FROM`** in `widget/pet.js` set to the merge day (Central), then `node tools/bundle/build.mjs`; commit, push.
4. **The migrations**, through the connector, in order, each checked before the next: `migration_v54.sql`, `v55`, `v56`,
   `v57`, `v58`. v54 sets the switch time (`game_config.v2_at`) and takes everyone's baseline as it runs, so apply
   them in the same few minutes as the merge.
5. **The answer keys**: `node tools/xp/keys.js occlusion --sql` and `node tools/xp/keys.js perio --sql`, each run through
   the connector with the secret put in, and the count it returns checked (844 and 763, plus the retired ids).
6. **Occlusion's episode**: `select admin_set_podcast_episode('<secret>', 'occlusion', 'midterm-review', 2688);`
7. **The starting ideas** ([the idea board](2026-11-06-idea-board.md), "The starting ideas", and the ones from the past
   check-ins), each checked against the About page first, with `admin_post_starter_idea`.
8. **Ask Timmy's function**: deploy `timmy` (`index.ts`, `core.js`, `site.json`) with JWT verification off
   ([ask-timmy](../reference/ask-timmy.md), step 3).
9. `node tools/release/rls.js`, and `tools/release/rls-audit.sql` on the live project (read-only).
10. Mark the PR ready, wait for its checks, **merge**.
11. `node tools/release/postcheck.js`; then on the live site: one Ask Timmy question (a "From the notes" link opens the
    paragraph; the admin page's Ask Timmy tab shows it with its cost), one Learn round and a flashcard, a random visit,
    and the dashboard with a hub open in another tab (your Timmy walks into the classroom in his outfit, his desk says
    "You").
12. `DEPLOY_NOTES.md`'s entry dated, the site changelog (`log_changelog`), this note's Outcome, `status: done`, and
    the idea board's, Ask Timmy's and Learn and Flashcards' notes closed. A notice to the class only if Sam wants one.

**To roll it back** ([roll-back-a-release](../how-to/roll-back-a-release.md)): revert the merge with a new PR (GitHub's
Revert button on the merged PR) and merge it when Sam says so. That brings back the old dashboard, the old Occlusion
and Perio pages and the old shared files, and `sw.js` there has a different `VERSION`, so phones drop the redesign's
cache. **Leave the database as it is**: the old pages call the old functions, which the migrations keep working (the
archived hubs' pages run on them the same way), and everyone's answers, XP and purchases made on the redesign stay
recorded. Turning Ask Timmy off needs no revert: the admin page's Ask Timmy tab has his switch. Undoing a migration
is a new migration and Sam's call, never a restore.

## Log

- 2026-11-06: written after Sam chose to build the whole redesign side by side and release it at once.
- 2026-11-06: Sam's second look (focus mode, every game with its own art, the answered card's row, no two-weeks card,
  decorated Today and Timmy Time, more color, notes prev/next and report, the More tiles, the live count) added to the
  drafts above.
- 2026-11-06: Sam's third look: Timmy Time among Home's quick starts, animated; Today's ring of 20 teeth.
- 2026-11-12: High yield, the notes' third reading level, built in the engine; its drafts are above.
- 2026-11-12: the engine split into its core and three parts ([phase 4](2026-11-05-redesign-phase-4-game-layer.md), its
  first step); the service worker's list for them is above ("The engine's files").
- 2026-11-12: High yield narrated with Kokoro for all three hubs (21 lectures), played with Follow along where it
  matches today's High yield ([task](done/2026-11-12-high-yield-narration.md)); the drift rule covers it.
- 2026-11-12 (Claude Code, planning only): the sessions from here to this one are in order in
  [phase 4](2026-11-05-redesign-phase-4-game-layer.md) ("From here to the release"), each with a build spec; this
  note's Done when names them, and "What Sam's calls of 2026-11-12 change in the drafts above" lists the drafts they
  make untrue. Part C ([#335](https://github.com/smcmurry6-source/study-hubs/pull/335)) merged the same day.
- 2026-11-13 (Claude Code, **the switch PR built; waiting for Sam's "merge"**). Sam: only the hubs still live get
  switched, so the dashboard, Occlusion and Perio; Heme & Endo Exam 2 keeps its old page; the `preview` label on the PR;
  nothing applied, deployed or priced before "merge" ([decisions](../decisions.md)). Every session in phase 4's "From
  here to the release" was merged. What the PR does is in `DEPLOY_NOTES.md`'s entry and the boxes above. **Drafts that
  were no longer true and were fixed as they were written in:** the trophy case entry (Full Arch is retired on every
  page, not only the redesign's, so an old page lists 23); "Meeting him" and the outfits (everyone has Timmy on every
  page; an old hub's Timmy wears the kept outfit or nothing); the Settings drafts' "the Full Arch chart" (gone) and the
  missing Streak flame switch (added: BUG-135); Timmy's house lines and "House upgrades" in his checkup (BUG-133);
  `LORE.md`'s list of homes (a beach hut, an igloo and an observatory were missing); the content address (the pages'
  own, `hubs/<hub>/content/`); `ARCADES` and the old dashboard's lists (nothing reads them: not carried into
  `hubs.js`); the migrations' step 2 (v54 to v58 are appended to `supabase/schema.sql` after a marker line, so
  `tools/release/xp.js` can still test the moment of the switch); the idea board's step 7 (the 90-day delete is built:
  `migration_v58.sql`); step 4's Heme & Endo Exam 2 episode (not needed: its old page reports no minutes); an idea
  for a hub without keys (the dashboard offers only engine hubs, and a legacy hub's check-in idea goes under All hubs).
  **Found and fixed on the way** ([the bug log](../release/bug-log.md), BUG-130 to BUG-135, and BUG-112): the cases
  check skipping Perio, the admin page's hub frames, the podcast's extractor, a leftover call that broke the dashboard.
  **New with the release:** after a merge that changes a hub's questions its answer keys are loaded again, and Ask
  Timmy's function is deployed again when it changes (both by hand for now: [the inbox](inbox.md)). Left to do is in
  "The merge, step by step" above and the inbox.
- 2026-11-13 (Claude Code, the switch PR is [#359](https://github.com/smcmurry6-source/study-hubs/pull/359), with the
  `preview` label). Its first CI run and the one run of `node tools/release/run.js` found three suites still reading
  the old pages, each a test and not the site (BUG-136 to BUG-138): the preview-safety check looked for an old hub's
  widget tag, the admin page suite read the old dashboard's cards, and the accessibility suite didn't count a focus
  ring drawn around a leaderboard row. Fixed, and each rerun on its own.
  Then the device suite run with the clock a day ahead (Heme & Endo Exam 2 archived, so its refresh and history
  steps run on Occlusion): four more places written for an old page (BUG-139), fixed, and green for today and tomorrow.
  The smoke test in the same state (two hubs under Past hubs) found one bug in the new dashboard itself: on a phone,
  Past hubs went two columns wide when no recap was beside it and the page scrolled sideways (BUG-140, fixed).
- 2026-11-13 (Claude Code, round 2, same PR). Sam used the preview and asked for more before the merge
  ([decisions](../decisions.md), 2026-11-13). Built: a shelf per hub in the trophy case (`widget/trophies.js`; a hub's
  mastery medals drawn by `shRanks.medal`, a higher medal counting the lower ones); Heme & Endo Exam 2 archived
  (`archiveOn` noon Nov 13) and its audio off; the dashboard's Timmy Time card animated again; the You card's rank as a
  hero on the arena's dark plum, the wallet and the stats to match, and **The road** (`#road`, `renderRoad()` in
  `widget/dash.js`: three journeys, seven ranks each, in place of the folded ladder); the idea board's banner; one
  **Exam check-ins** panel at the top of Past hubs (`renderCheckins()`; a sent check-in is remembered on the device as
  `sh_debrief_sent_<hub>_<date>`); the pedestals' wreath redrawn around the numeral (`tools/figures/site/stage.mjs`);
  the preview's made-up recaps now mirror the 8 on the live site; in a hub, **All hubs** in the bar and **Hubs** on a
  phone's top strip; **Learn and Flashcards as a session over the whole screen** (`widget/study-modes.js`: a launcher in
  the bank, `openFocus()`, number keys, "Don't know?", Auto-next; swipe, arrows and a session summary for the cards);
  and the **motion** block at the end of `widget/hub.css` (pop-ups rise, a hub's pages and the dashboard's hub panel
  slide in; `html.hx-still` turns it off). Left as to-dos in the [inbox](inbox.md): Heme & Endo Exam 2's retrospective
  and recap, the two missing recaps, a typed answer in Learn and an undo for a flashcard rating (both only if Sam asks).

## Outcome
