---
type: task
status: done
hub: site
created: 2026-11-05
requested-by: Sam
due:
waiting-on:
agent: Claude Code
pr:
---

# Redesign the hubs from the ground up: the audit and the proposed plan

## Goal

Sam asked (2026-11-05) for a ground-up redesign of the hubs, the dashboard and the shared layer, using the taste skill in
full, keeping Timmy and his house, the ranks with their animations, and the Question Bank's functionality, and open to
changing anything else. Hand-drawn art over stock or emoji; animation and gamification that make studying satisfying;
everything intuitive; backend optimizations welcome. **Audit first, then agree the plan with Sam.** This note is the audit
and the proposal. Nothing on the site has changed.

## Context

- Rules that matter most: [preview-and-release-test](../../rules/preview-and-release-test.md) (tier 3: preview, release
  suites, Sam's approval), [about-page](../../rules/about-page.md), [question-bank-filter-panel](../../rules/question-bank-filter-panel.md),
  [hub-home-page](../../rules/hub-home-page.md), [arcade-skins](../../rules/arcade-skins.md), [question-ids-are-permanent](../../rules/question-ids-are-permanent.md),
  [learner-data-privacy](../../rules/learner-data-privacy.md), the taste-skill decision (2026-11-04, [decisions](../../decisions.md)).
- Evidence: a read-only analytics audit (Supabase, aggregates over 5+ people), a code and backend audit, the taste skill's
  inspector on the dashboard and three hubs at 1440, 768 and 390 px, and 70 screenshots of every mode on a laptop and a phone
  (fixture data, `node tools/preview/serve.js`). `LESSONS.md` and `vault/decisions.md` were read first.

## 1. What the data says (the ten findings that shape the design)

1. **Notes and the question bank are the product: 83% of all study time** (bank 51%, notes 32%). Everything else together is
   17%: Review 4.9%, mock 3.4%, Daily Drill 2.5%, cram 1.8%, Weak Spots 1.5%, hints 1.0%, Home 0.7%, podcast 0.7%, arcade 0.6%.
2. **People browse the extras and leave.** Review reaches 27-56% of a hub's people but holds 5% of time; the arcade reaches
   11-34% and holds 0.6%; each Review group and each game sits at 1-10 people. Curiosity taps, not use.
3. **Home is a doorway**: 97-100% reach, 0.7% of time. From Home people tap the Compendium tab or the first lecture's notes
   button (43 and 39 taps); "Where to next", the mock, hints and cram rows on Home get 0-7 taps each. The quick-start row and
   the bank's own filters are where a nudge lands (`LESSONS.md`).
4. **Dismissing things is a top-five interaction.** "Close" 117 people (905 taps), "Hide the boss" 85 (605), "Later" 63, "No
   thanks" 60, "Dismiss" 54. Tours declined by 87% (dashboard) and 91% (hub). The boss egg fired 1,421 times for 109 people.
5. **Nobody changes settings.** 20 of 155 people ever changed a preference; theme stays auto for 138, font and size default
   for 150+, music off for 151. Only the pet setting gets touched. The settings pill reaches 5% of a hub's people.
6. **The game layer reaches a quarter and holds a few.** Timmy adopted by 47 of 166 (28%); 60 of 89 adopted Timmys sit at
   0-49 HP; 62 people earned a mastery rank; 60 ever opened the stats panel, 13 a trophy row. Podcast played by 28, heard to
   the end by about 9. Listen 12, mind map 15, pins 9, "Good question?" thumbs 2.
7. **In the bank, people use two things**: "Try it again" (78 of 82 bank users; 6,125 retries, 78% right) and the High
   likelihood chip (25). Random 22, Not answered yet 22, a lecture's "Only" 13, More filters 13. Missed last time 4, bank
   search 2, question type 1, Pinned 1.
8. **Explanations get about 5 seconds** (median dwell after answering; 7 s to answer; 2 s in the drill). "Find this in the
   notes" was offered 940 times and opened 16. A miss re-asked within 30 minutes is 88-96% right; a day later 69-80%.
9. **Readers who never practice are 15-20% of each hub** (people with 5+ minutes and zero answers). Bounces under 5 minutes
   fell from about 40% (perio, MSK 4) to 11-15% in the hubs that open on Home.
10. **The exam-eve phone session is the use case**: median visit 12 minutes, 37% of visits over 30 minutes, peak 8-10 pm
    Central, Tue-Thu carry 79% of minutes; almost all studying is in the last 3-4 days. Check-ins (n = 95): readiness 4-5 for
    73; "About right" 52, "Exam asked different things" 18. What students ask for is content and formats (pictures and cases
    17, exam wording 12), not features; survey 2: "questions are good as they are" 8 of 14, a guided tutorial No 6 / Yes 3.

Backend, from the same audit: the game layer is the cost. `get_rank_profile` 18k calls at 0.93 s (4.7 h of CPU, the
heaviest function), `get_trophy_stats` 7.3k at 0.85 s, the rank board and leaderboard 1.5-1.8 s each, `get_pet_days`
polled 87k times; `personal_answers` has 294k sequential scans because `sh_visitor_xp` recomputes everyone's XP per call.
Tracking RPCs are 2-10 ms. Advisors: 6 functions with a mutable search_path, `link_attempts` has no primary key, 2 unused
indexes. Full report: `audit-analytics.md` in the session's scratchpad (summarized here; per-person rows never left the
database).

## 2. What the screens look like now (the taste inspector, and a look)

Measured on fixture data at 1440, 768 and 390 px (`--app` rules):

| Surface | FAIL | WARN | What fails |
|---|---|---|---|
| Dashboard | 9 | 6 | no h1, 14 floating panel shadows, 12 icons in tinted chips in 4 colors, a radial-dot gradient, buttons with shadows, 8 px text, emoji, text covered on a phone; 4 panel radii, ragged rows, only 4 of 15 blocks on the first screen, a 394 px void in "Correct in a row" |
| Occlusion | 7 | 6 | 9 tiny uppercase tracked labels, a gradient hero card, gradient text on a phone, buttons with shadows, 9 tinted icon chips, 3 typefaces (Public Sans, JetBrains Mono, Bricolage Grotesque), dark panel borders, 5 radii |
| Perio | 6 | 6 | 10 tracked labels, 11 floating shadows, 8 icon chips, mixed-face headlines, dark borders, text 12 px from the phone's edge |
| Heme & Endo 2 | 6 | 5 | 11 tracked labels, 5 icon chips, 3 typefaces (Hanken Grotesk, Overpass Mono, Literata), dark borders, 4 radii |

Across the site: **10 Google Font families** (2-3 per hub, render-blocking), every hub a different palette and face, five
corner radii per page, monospace used as a label style everywhere, tinted icon chips as the main decoration. The pages
look competent and generic, the "well-applied kit" the skill warns about, with no face of their own apart from Timmy.

What the screenshots show (the critique, by surface):

- **Hub Home, phone.** The exam card (a tracked "OCCLUSION · DR. GIVAN" label, "The final", two countdown tiles, four
  chips) and the readiness ring fill the whole first screen; **"Practice questions" is below the fold.** The data says Home
  is a doorway and the quick-start row is the only part of it people use.
- **Compendium, phone (the way to the bank).** Tapping Compendium shows the **Timmy Time podcast card filling the whole
  screen**: player, likes, a comment, a comment box. The sub-tabs and the Question Bank are two screens down. On a laptop
  the podcast card pushes the bank's filter panel below the fold too. The podcast is 0.7% of time, played by 18% of people.
- **The Question Bank.** The filter panel itself is good (one labeled panel, counts on the chips). The card is a wall of
  equal outlined boxes; after answering, the result is clear (the class's % per choice, "Not quite", "Why each choice") but
  the explanation competes with the pick bars and the "why" list repeats every choice at the same weight. Nothing rewards
  the answer: no XP shown, no Timmy reaction visible, no streak. "Find this in the notes" sits under Timmy's button at the
  bottom left where both overlap. 30 cards at a time, then "Load more" (90 people tap it): long scrolls.
- **Notes.** Good reading measure and a useful "What's tested" box; the lecture list is a column of outlined cards with
  tracked-caps group labels; figures interleave well. The best surface today, and the one 68% of people reach.
- **Review.** A search box, a toggle, a row of lecture chips and a table: it reads as a database, not as the "side by side"
  charts students asked for.
- **Arcade.** Pixel-art generated backdrops and neon type: the one part of the site that looks AI-generated, in a style
  foreign to Timmy. 0.6% of time.
- **The stats panel and the dashboard rank card.** The handpiece medallions and the rank names are strong and distinctive
  (keep). Around them: emoji medals (🥇🥈) for mastery, a "YOUR HANDPIECE" tracked label, a gradient-filled rank name, a
  trophy grid of 24 identical rounded boxes mostly reading "???". The level-up and trophy cards (coin flip, shine, sparks)
  and the mock results card (count-up ring, bars) are the most satisfying moments on the site today; keep their motion.
- **Timmy and his house.** Timmy himself is drawn with character (ink outline, moods, outfits, conditions as HP drops) and
  belongs here. His house is a 240 x 150 SVG card on the dashboard with a 0-100 HP bar and three buttons (joke, checkup,
  secret tip). On a hub he is a small button in the bottom-left corner that is covered by the preview badge and overlaps the
  "Find this in the notes" strip. The dashboard's "Psst. Up here. Tap me!" bubble on every visit until adopted is one of
  the things people dismiss. 60 of 89 adopted Timmys are below 50 HP: the HP model punishes the exam-week pattern the data
  shows (nothing between exams, then four days of cramming).
- **Dashboard.** A greeting, the rank card, Timmy's house, a hero with "1 day to go", the hub cards two per row with their
  "Read more" and feature chips, check-ins, the recaps slideshow, the class board. Four radii, a dotted-gradient side panel,
  a "Correct in a row" card that is empty for most people. The exam countdown and "Start studying" are right; the rest is
  a long page of equal cards.

## 3. The code and the backend

- **Hubs are 0.5-2.3 MB single files, 93% inline JS.** Occlusion: 986 KB of inline anima figures (44%), 383 KB questions,
  189 KB whys, 186 KB notes, about 130 KB engine. The engine is copied nine times (about 2 MB of duplicates); the four
  newest hubs have byte-identical `renderBank`, `loadState`, `whyHTML` and `renderWeak`; perio runs its own engine.
- **Every hub visit loads 17 widget files, 1.14 MB raw / 327 KB gzipped** (supabase-js alone 218 KB), 13 of them injected
  unconditionally (eggs 101 KB, pet 179 KB, ranks 80 KB...). First visit to Occlusion: about 1 MB over the wire, 3.4 MB to
  parse, plus 2-3 font families; the perf budget allows 1,320 KB and 33 requests, LCP 5.5 s.
- **About 17 Supabase round trips per hub load** (name three times, pins, answers, question_stats twice, overrides,
  changelog, rank profile, mastery, trophies, pet days, two eggs, inbox, survey, name_shared, podcast feed), plus timers
  (activity 25 s, qhealth 30 s, clicks 60 s, changelog 4 min, pet 5 min). Dashboard: about 18.
- **The engine's hot spots**: `bankFiltered` runs 15-18 passes over 600+ questions per filter tap; `saveState` rewrites
  the whole STATE JSON on every click; the bank re-renders its panel and list together.
- **What a refactor must keep** (CI): `window.SH_EXPORT = {` as the last statement, the question-id registry, the lint's
  question shape and format minimums, the smoke test's selectors (`#modeSwitch [data-mode]`, `.subtabs button`, `.qcard`,
  `.ar-grid [data-game]`), the `od:kit` / `anima:js` marker blocks, narrate.py's one-line `var READINGS = {...};`, the
  preview transform's literal URL and key strings. Full report: `audit-architecture.md` in the scratchpad.

## 4. The plan Sam agreed (2026-11-05, in chat)

Sam's corrections to the first proposal: dentistry is flavor, never the frame (no "chart as the page"); a hub lives about a
week and serves one upcoming exam, so there is nothing long-term to design for; this is not a product (no competitors, no
"selling"); and every piece of art is drawn by the agent in SVG, never generated from a prompt Sam has to paste.

### 4.1 The feel: playful throughout, organized by the time left

The game layer leads: Timmy, XP and streaks visible everywhere, bolder color and motion, and the study surfaces styled to
match. The countdown is the frame: the next best thing to do is one tap away and the page gets more focused as the exam
gets closer. Dentistry shows in Timmy, the handpiece ranks, each hub's emblem and masthead and small touches (answer marks
like articulating paper), not as a motif that runs the layout. The taste skill's house rules still gate the build (one
typeface, flat surfaces, one radius, no tracked caps, no emoji, no icon chips, no gradients, real motion), with its "playful"
tone.

### 4.2 Type and color

- **One typeface for the whole site, self-hosted.** Phase 0 shows Sam the same preview page twice, once in a humanist sans and
  once in a text serif; Sam picks. Tabular figures everywhere; no monospace; no tracked caps.
- **One uniform design that still tells the hubs apart.** One ground, one ink, one accent for the site; each hub gets **a tint
  of its own** (strip, tabs, emblem, dashboard tab), **a drawn emblem** (an articulator, a probe, an implant fixture...) and
  **a drawn masthead scene** at the top of its Home, all in Timmy's ink style.
- One radius, flat surfaces separated by tone steps; shadows only on menus, dialogs and the celebration cards; dark mode
  designed, not inverted.

### 4.3 A hub's layout

- **Home · Notes · Questions · More.** Home stays a landing page: the masthead scene, the exam countdown and format, where
  to next, quick links (Practice, Drill, Notes, Mock, Timmy Time card, hints, cram), the course timeline, progress by lecture.
  On a phone the quick links sit on the first screen. A bottom bar on phones, a top bar on laptops.
- **Notes**: the lecture list, the notes (with Listen, mind map and the highlighter in a notes toolbar, not the top bar), the
  side-by-side charts next to the lecture they belong to, and three "Check yourself" questions at the end of each lecture's
  notes.
- **Questions**: the bank with its filter panel at the top ([question-bank-filter-panel](../../rules/question-bank-filter-panel.md)
  stays as written). **Daily drill, Yesterday's misses, Weak spots and the Mock are presets of the bank's panel**: one card,
  one engine; the mock still runs as a timed, no-feedback set with its results card.
- **More**: the Timmy Time player (likes, comments), exam hints, cram sheet, Side by side (the review charts), the arcade,
  stats and trophies, settings, inbox, About, the full tour.
- **Timmy on the bar** (the phone's bottom bar, beside the rank pill on a laptop), his bubble opening upward, never over
  content.

### 4.4 The question card and the core loop

One card for every format (fixed order and line breaks kept for two-statement and numbered items), the picked choice marked
with a drawn tick box or dot, flat rows. After answering: the verdict and explanation first at full ink, the class's picks
as marks beside each choice, "Why each choice" with your pick's line opened and the rest folded, "Try it again" kept, "Find
this in the notes" as a link in the explanation. **Rewards on every answer**: an XP float from the choice to the rank pill,
Timmy reacting on the bar, the streak flame. **A daily goal ring** (20 questions, adjustable) on Home and the Questions
strip; Timmy cheers when it closes; streaks count goal days. **A session recap card** after 25 answers or on leaving the
bank (answered, right, XP, Timmy's HP change, the two lectures to look at next, with the mock card's count-up motion).
**Yesterday's misses** as a named preset and a line on Home in exam week. Twenty cards, then an automatic next page.

### 4.5 Timmy, the house, the ranks

The model stays as it is (HP, conditions, moods, outfits, holidays, the house upgrades per rank, pennants, XP rules, the
rank ladder Stone to Dark Matter with levels I-III, 24 trophies, mastery medals, leaderboards, the tier cutscene, the level,
trophy and mock cards, sounds, `widget/timmy.js`). What changes is the presentation: Timmy and the house as one SVG symbol
sheet in one ink style (a renderer over the existing model); drawn mastery medals and trophy icons in place of emoji and
the "???" grid (secret ones stay a silhouette with a one-line riddle); the gradient rank name becomes flat metal; the
dashboard rank card and the hub stats panel become one "you" panel. Timmy's HP model is **kept as is** (Sam).

**Changed 2026-11-06 (Sam, 4.10):** the XP rules (no daily cap, more sources), the ladder (three journeys), the house
(Timmy's place) and HP (snacks and floss from the shop restore it) change, and the shop and the bowling egg are added. The
rest of this section stands.

### 4.6 Cut, fold, keep (Sam's calls)

| Thing | Call |
|---|---|
| Settings: font choice, background music, accent metal | **Cut** (text size and theme stay; Timmy and egg toggles stay) |
| Link my devices | Keep, folded under the name dialog |
| Tour prompt on arrival | **Cut**; one-line tips the first time a control is seen; the full tour stays in More |
| Review mode | **Folded**: side-by-side charts next to their lecture in Notes and one "Side by side" page in More; the search box and recall mode go |
| Arcade | **One game per hub up front, the rest behind "more games"**; mechanics and skins kept; lobby redrawn by hand, no pixel-art backdrops |
| Active-recall items | **Keep** |
| Timmy Time card | A card on hub Home, the full player in More and on the dashboard hub card |
| Pop-ups (Timmy's "Tap me", replies, surveys, boss, nuke) | **Keep as they are**, restyled |
| Dashboard "Correct in a row" card | **Cut**; "When people study" becomes a line under the class board |
| Dashboard rank card + Timmy's house | **One "you" card** |
| Widget search panel | Folded into the bank's search (Sam kept it 09-29; now one search) |
| Archived hubs (Heme & Endo 1, MSK 3, MSK 4, PCD Exam 3) | **Left as they are**; only their dashboard cards change |

### 4.7 Art

Everything drawn by the agent in SVG in Timmy's ink-outline style, in `tools/figures/site/` with a build that writes the
symbol sheets into the widget: Timmy and his house, the icon set (about 24), the hub emblems, the hub masthead scenes, the
mastery medals and trophy icons, the arcade lobby signs and game stages, the dashboard's open-graph images. No emoji, no
icon library, no stock photographs, no generated images.

### 4.8 The architecture under it (all of it: Sam)

1. One shared hub engine, `widget/hub.js` + `hub.css`, extracted from the four byte-identical hubs; a hub file becomes
   configuration, data, its tint, emblem, masthead and arcade skin. Perio is ported onto it.
2. Content split from code: a hub's questions, whys, notes, review, hints, cram, likely topics and cases as JSON files next
   to the hub, loaded on demand; anima figures as per-figure files. CI, narrate.py, the figure builds and the preview
   transform updated in the same PR.
3. One `bootstrap` RPC per page; rank, board and trophy RPCs only when a panel opens; `sh_visitor_xp` cached per visitor;
   `get_pet_days` not polled; one analytics flush timer; the advisor fixes (search_path on 6 functions, a primary key on
   `link_attempts`, 2 unused indexes dropped).
4. Two widget bundles (core on load, the rest on idle or first use), one shared stylesheet, one self-hosted font, a thinner
   Supabase client (realtime presence kept), sw.js precaching the engine and fonts and caching content JSON
   stale-while-revalidate.
5. Engine hot spots fixed in passing: filter once per redraw, debounce saveState, re-render only the list.

### 4.9 Phases

| Phase | Task note | What ships |
|---|---|---|
| 0 | [design system and art](2026-11-05-redesign-phase-0-design-system.md) | Tokens, the two typeface candidates, the icon set, Timmy's symbol sheet, emblems and mastheads, the question card, on a preview page for Sam's pick; nothing live |
| 1 | [hub engine on a preview](2026-11-05-redesign-phase-1-hub-engine.md) | `widget/hub.js`, content split, the new layout, the core loop with its rewards, built on a preview of Occlusion; Sam picks which hub goes live first when he sees it |
| 2 | [the other live hubs](../2026-11-05-redesign-phase-2-live-hubs.md) | Every live hub on the engine, perio ported |
| 3 | [dashboard and About](../2026-11-05-redesign-phase-3-dashboard.md) | The new dashboard ("you" card, hub tabs, class board) and the About page rewritten |
| 4 | [the game layer](../2026-11-05-redesign-phase-4-game-layer.md) | Medals, trophies, celebration cards on the new type, the arcade lobby redrawn |
| 5 | [backend and loading](2026-11-05-redesign-phase-5-backend.md) | Bootstrap RPC, XP cache, timers, advisor fixes, bundles, font, sw.js |
| | | Since 2026-11-06, phase 4 has four parts (A-D) and phase 5 a part 3; Patient Box v2 runs on its own (4.10) |

Each phase is a PR with a preview link first, screenshots on a phone and a laptop, the release suites, and Sam's look
([preview-and-release-test](../../rules/preview-and-release-test.md)). Ship-it-now holds: a phase that is ready lands before
the next exam, never after. Rules that change with phase 1: [hub-home-page](../../rules/hub-home-page.md) (Home stays, as a
landing page with the quick links on the first phone screen; the drill, weak spots and mock as bank presets) and
[arcade-skins](../../rules/arcade-skins.md) (one game up front); they are edited in that PR.

**Changed 2026-11-06 (Sam):** nothing goes live phase by phase. The redesign is built side by side on `main`, in files no
student sees, and released all at once by one PR when Sam likes the whole thing; the rule edits land with that PR
([decisions](../../decisions.md), [the release note](../2026-11-06-redesign-release.md)).

### 4.10 Additions agreed 2026-11-06

Sam brought more ideas to workshop on 2026-11-06 and decided them in chat the same day ([decisions](../../decisions.md)).
Each has its own task note with the data, the design and Sam's calls. Everything but Patient Box v2 is built side by side
and **ships with the redesign's release**. This changes parts of 4.4 and 4.5: XP has no daily cap and many more sources,
the ladder becomes three journeys, the house becomes a scene you build, the shop sells snacks and floss that restore HP,
and bowling is an Easter egg, not part of the session recap. Later the same day Sam added a toggle to the Question Bank
(4.4) that switches it to Learn or Flashcards.

| Where | What it adds | Note |
|---|---|---|
| Phase 1 ([#275](https://github.com/smcmurry6-source/study-hubs/pull/275), merged 2026-11-06) | Nothing new: its answer event already carries the picked choice and the context, which the new XP rules need | |
| Phase 3, the dashboard | The idea board (posts show at once, names and both vote counts shown, agent-written starting ideas); Timmy's place on the "you" card | [idea board](../2026-11-06-idea-board.md) |
| Phase 4, part A | Three journeys (Handpiece, ModuPro, Loupes, 125,000 XP each), the hand-off scene, the Dark Matter unlock, the double-XP boost on the rank pill | [journeys](../2026-11-06-redesign-progression-journeys.md) |
| Phase 4, part B | Shiny Gold Crowns, the rotating shop (daily, weekly, seasonal), rarity tiers, outfits, snacks and floss, XP boosts, rare costumes | [shop](../2026-11-06-redesign-timmy-shop.md) |
| Phase 4, part C | Timmy's place: the house card redrawn as an isometric scene with homes (castle, giant mushroom, treehouse), scenes and yard items | [Timmy's place](../2026-11-06-redesign-timmys-place.md) |
| Phase 4, part D | The bowling egg: eight bowling-alley clips with the Plaque crew as pins | [bowling egg](2026-11-06-redesign-bowling-egg.md) |
| The engine, every hub on it | **Study as: Questions · Learn · Flashcards**, a toggle at the top of the Question Bank (Sam, 2026-11-06): Learn asks the panel's questions in rounds until each is mastered (like Quizlet's Learn); Flashcards flip and rate them, scheduled to come back, never past exam eve (like Anki). The panel still picks which questions; the mock stays questions only. Its server part joins phase 5, part 3 | [Learn and Flashcards](../2026-11-06-redesign-learn-and-flashcards.md) |
| Phase 5, part 3 | The server for all of it: no XP cap, server-checked answers, the guardrails, every new XP source and boost, the 63-step ladder, Shiny Gold Crowns and the shop, the idea board's tables. Built and tested now on a throwaway copy, applied at the release | the notes above |
| Its own track | Patient Box v2: the tooth library (shared with the figure builds), modules, new views and checks; ships to the live hubs step by step | [patient box v2](../2026-11-06-patient-box-v2-modular-cases.md) |
| Dropped | "Ask the Hub", an AI study assistant | [ask the hub](2026-11-06-ask-the-hub-assistant.md) |

## 5. Decisions (all answered 2026-11-05, logged in [decisions](../../decisions.md))

Feel: playful throughout. Layout: Home · Notes · Questions · More, with a Home landing page. Drill, Weak Spots and Mock as
bank presets. Podcast: a card on Home, the player in More. Settings cut: font, music, accent (size stays). Tour prompt cut.
Review folded into Notes and More. Arcade: one game up front. Timmy's HP: as is. Timmy on the bar. Typeface: two shown, Sam
picks. Color: one uniform design with a tint, a drawn emblem and a drawn masthead per hub. First hub: built on a preview
first, Sam picks later. Archived hubs: left alone. Backend: all of it. Recall items: keep. Gamification: XP float and Timmy
reaction, daily goal ring, session recap card, yesterday's misses. Pop-ups: keep as they are. Dashboard: cut "Correct in a
row", one "you" card. Art: all drawn by the agent, nothing generated from prompts.

## Done when

- [x] Sam has answered the decisions (2026-11-05, in chat)
- [x] The plan is written back as phase task notes in `vault/tasks/`; the rules that change are edited in phase 1's PR
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`)

## Log

- 2026-11-05: audit done (analytics, code, backend, inspector, screenshots); proposal written; waiting on Sam.
- 2026-11-05: Sam answered every decision in chat (four rounds); plan rewritten; phase notes written; phase 0 started.

## Outcome

The audit stands as sections 1-3. The agreed plan is section 4; the phases have their own task notes. Phase 0 (the design
system and the art on a preview page) is the next piece of work.
