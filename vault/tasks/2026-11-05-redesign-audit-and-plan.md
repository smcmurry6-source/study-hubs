---
type: task
status: review
hub: site
created: 2026-11-05
requested-by: Sam
due:
waiting-on: Sam (the decisions at the end)
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

- Rules that matter most: [preview-and-release-test](../rules/preview-and-release-test.md) (tier 3: preview, release
  suites, Sam's approval), [about-page](../rules/about-page.md), [question-bank-filter-panel](../rules/question-bank-filter-panel.md),
  [hub-home-page](../rules/hub-home-page.md), [arcade-skins](../rules/arcade-skins.md), [question-ids-are-permanent](../rules/question-ids-are-permanent.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste-skill decision (2026-11-04, [decisions](../decisions.md)).
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

## 4. The proposal

### 4.1 The idea

The taste skill asks for one idea taken from the subject, and dealt directions. Dealt (seed 2131202252, page; seed 573643080,
app): **"The page is the object"** for the dashboard and hub Home, **"Achromatic ledger"** for the working screens (notes,
bank), with the palette's proportions kept and the colors taken from the subject.

The sentence: **On these pages, the patient chart becomes the page.** A dental chart is the one printed object every
student in this class handles daily: the odontogram (teeth 1-32 in universal numbering), the perio chart's rows of numbers,
the red and blue of articulating paper, the treatment-plan folder with its tabs. It carries the whole product:

- **Your progress is your own chart.** Each hub is a quadrant; each lecture a tooth; a tooth fills in (drawn, in ink and one
  color) as you master it (Bronze 50%, Silver 75%, Gold 90%, Crown 100% already exist). Mastery is a mouth you fill in, not a
  percent in a ring. Timmy is a tooth; he lives in that mouth's world; "number thirty-one" from the lore is tooth 31.
- **The dashboard is the folder**: tabbed, one tab per class, the next exam on the front; the hub cards become the chart's
  pages.
- **Answer marks are articulating-paper marks**: a red contact for a miss, a blue one for a right answer (flat ink, no
  pastel fills), the class's pick bars drawn as a row of marks.
- **The one live thing**: the chart itself, on Home and in the stats panel, with a tap on any tooth opening that lecture's
  unanswered questions.

The competitor test: a bakery two streets away cannot say this; another study site could draw a chart, but not with Timmy in it
and the class's own teeth, hubs and ranks on it.

### 4.2 Type and color (one system for the whole site)

- **One typeface for the whole site, self-hosted** (two weights plus italics), in place of 10 Google families: the sheet deals
  STIX Two Text (a bookish roman, right for a chart) for the page layer and Geist for the app layer; I propose one humanist
  sans or one text serif for both, tabular figures for every number, no monospace anywhere, no tracked caps. Sam picks the
  face in the preview (two candidates shown side by side).
- **One ground, one ink, one accent, per hub a tint.** The dealt palette is "newsprint and brass": paper grey, near-black ink,
  brass as the single accent; the app sheet adds one chart hue on the main data element. Hubs keep an identity through one
  tint each (the chart's "tooth" color for that course) rather than a whole palette and face each.
- **One radius, flat surfaces, tone steps instead of borders and shadows; shadows only on menus, dialogs and the
  celebration cards.** Buttons: one shape, one fill.
- **Dark mode designed, not inverted** (the exam-eve session is at night; 14 people chose dark, 138 never touched it, so the
  auto theme must be good in both).

### 4.3 Information architecture

**A hub** (the data: 83% of time in two surfaces, Home a doorway, the bank two screens away on a phone):

- **Three destinations, one tap each, on a bottom bar on the phone and a top bar on a laptop: Notes · Questions · More.**
  Home shrinks to a strip at the top of Notes and Questions: the exam countdown, one line of "where to next", and the daily
  goal ring (below). The exam card's details (format, what's on it, the course timeline) fold under it; `renderHome` and the
  Home rule's content all stay, as the strip plus a "This exam" sheet.
- **Notes**: the lecture list as the chart (teeth), then the notes; **three questions at the end of every lecture's notes**
  ("Check yourself"), drawn from that lecture's bank, to convert the 15-20% who read and never practice.
- **Questions**: the bank with the filter panel at the top, the same card everywhere (bank, drill, weak spots, mock, review
  answers). Daily drill, Weak Spots and the Mock become **presets of the bank's own panel** ("Today's drill", "Yesterday's
  misses", "Mock"), not sub-tabs: one card, one engine.
- **More**: exam hints, cram sheet, Review (as the "Side by side" charts), the arcade, Timmy Time, stats, settings, inbox,
  About. The podcast card moves here and onto the dashboard's hub card; it no longer sits above the bank.
- **Interruptions**: the tour prompt goes (teach in place with one-line tips the first time a control is seen; the full tour
  stays in More). The boss stays docked; report replies, surveys and notices live behind one inbox badge and never pop
  over a question. Timmy's "Tap me" bubble appears once, not every visit.

**The dashboard**: the next exam and "Start studying" first (they already are), then the folder's tabs (the hubs), then
**one "you" card** (your chart, your rank, Timmy's house together), then the class board. The recaps slideshow stays for
archived hubs. The "Correct in a row" card goes (empty for most); "When people study" becomes a line under the board.

### 4.4 The question card (the core loop, where 51% of the time is)

- **One card design** for every format, with the stem set large, the choices as flat rows, the picked choice marked with a
  drawn tick box (select-all) or a dot, two-statement and numbered formats with their fixed order and line breaks kept.
- **After answering**: the verdict line and the explanation first, at full ink; the class's picks as a row of
  articulating-paper marks beside each choice; "Why each choice" folded, opened by default only for the choice you picked
  (the data says 5 seconds of reading: put the one sentence that matters first). "Try it again" stays (78 of 82 use it).
  "Find this in the notes" becomes a link in the explanation, not a strip over Timmy.
- **Reward every answer**: a floating "+10 XP" from the choice to the rank pill, the streak flame already in `fx.js`, Timmy
  reacting in the corner (he already does; make it visible), a tooth on the chart filling a little. All transform and
  opacity, all under `prefers-reduced-motion`.
- **A session recap card** when you leave the bank or after every 25 answers: answered, right, XP earned, Timmy's HP
  change, the two lectures to look at next, with the mock card's count-up motion. This is the satisfying close the site
  lacks.
- **Yesterday's misses first**: the drill preset and Home's "where to next" put yesterday's misses first in exam week and
  say so (the 12-hour re-ask is what catches the 20-30% that didn't stick).
- **Pagination**: 20 cards, then an automatic "next 20" sentinel instead of a button, with the filter panel pinned.

### 4.5 Timmy, the house, the ranks (keep the model, redraw the presentation)

Everything stays: the HP model and its conditions, the moods, the outfits and holidays, the house's upgrades per rank tier
(fence, mailbox, lamppost, gold trim, diamond windows, night sky), the pennants per hub mastered, the rank ladder Stone to
Dark Matter with levels I-III, XP rules, 24 trophies, mastery medals, the leaderboards, the tier cutscene, the level,
trophy and mock cards, the sounds, `widget/timmy.js`. What changes:

- **A renderer layer** over the existing model: Timmy and the house drawn once as an SVG symbol sheet in one ink-outline
  style (his current style, tidied), so the dashboard card, the hub corner, the celebration cards and the chart all use the
  same drawings at any size, and a designer can restyle without touching 1,400 lines of path strings.
- **Timmy's house becomes the "you" card's scene**: the house, his HP as the lawn's health or the sky, the pennants, a
  bubble; the three buttons become his bubble's actions. In a hub he sits on the bottom bar (phone) or beside the rank pill
  (laptop), never over content.
- **The HP model is softened for exam-week studying** (Sam's call): no decay for the first 7 days away, or decay only during
  a hub's live window, so returning after an exam does not mean a bandaged Timmy (60 of 89 are under 50 HP).
- **Emoji medals and the "???" trophy grid go**: drawn mastery medals (bronze, silver, gold, crown) with each hub's emblem,
  drawn trophy icons, and a trophy case that shows what each locked trophy is for (secret ones stay a silhouette with a
  one-line riddle).
- **The rank art stays**; the gradient rank name becomes flat metal color; the celebration cards keep their motion and take
  the site's type.
- **The dashboard rank card and the hub stats panel become one "you" panel** (rank, chart, trophies, Timmy), reachable
  from the rank pill in every hub and from the dashboard.

### 4.6 More gamification, where the data says it pays

- **A daily goal ring** (20 questions, adjustable) on the strip, filling as you answer; Timmy cheers when it closes; the
  streak counts goal days.
- **The mastery chart** (4.1) as the visible long-term goal, with the Crown as the mouth filled in.
- **"Yesterday's misses" as a named daily set** with its own small win card.
- **Mock results stay** (the best card on the site); add a per-lecture "practice these" button on it.
- **Class moments stay**: Send luck, the leaderboard, the streak board; the nuke and the boss stay as eggs, docked, with the
  off switch right where they appear (what people do is dismiss, not disable in Settings).
- **No new currency, shop or feeding** (the data says people reach the game layer and leave; depth over breadth).

### 4.7 Cut, fold or keep (Sam decides each; data in section 1)

| Thing | Data | Proposal |
|---|---|---|
| Settings: font, size, accent, music | 0-6 people ever changed each | Cut font/size/music; keep theme, Timmy, eggs toggles, name |
| Link my devices | 6 linked ever | Fold under the name dialog |
| Widget search panel | 8 searches ever (Sam kept it 09-29) | Fold into the bank's search; keep "Find this in the notes" as a link |
| Mind map, Listen, highlighter | 15, 12, 23 people | Keep, in the notes toolbar (not the top bar) |
| Podcast likes, dislikes, comments | 2 likes, 1 comment | Keep (a rule), but on the podcast page in More |
| "Good question?" thumbs | 2 people | Keep as a small link under the explanation |
| Pins | 9 people | Keep (a rule); the Pinned chip stays in Show |
| Review mode | 5% of time, 27-56% reach | Becomes "Side by side" charts in More and inline in notes; recall mode cut |
| Active recall items | 0% of time; survey: not when the exam is MCQ | Cut from new hubs |
| Arcade | 0.6% of time; survey: shrug or remove | Keep the mechanics; one game per hub by default, the rest behind "more games"; redraw the lobby in the site's drawn style (no pixel-art backdrops) |
| Tour prompt | declined 87-91% | Cut the prompt; keep the tour in More; one-line first-use tips instead |
| "Correct in a row" dashboard card | empty for most | Cut |
| Trophy rows | 13 people opened one | Keep, redrawn (4.5) |
| Timmy Time card above the bank | pushes the bank down two screens | Move to More and the dashboard hub card |

### 4.8 Hand-drawn art (what gets drawn, by whom)

- **Drawn in SVG in Timmy's ink-outline style, by me, in `tools/figures/site/`**: the chart (32 teeth, each a symbol), the
  hub emblems (one per course, used on the folder tab, the medal and the chart's quadrant), the icon set (notes, questions,
  drill, mock, hints, cram, review, arcade, podcast, stats, settings, inbox, pin, report, listen, search; about 24 icons),
  the mastery medals and trophy icons, the house parts, the arcade lobby's six game signs. One language, one stroke weight,
  the palette's real colors.
- **Sam generates, from prompts I write, the few raster pictures the pages want**: the arcade's game stages (today's
  pixel-art backdrops replaced in the drawn style), the dashboard's open-graph images. Or I draw those too in SVG; the
  inspector counts raster pictures, but a study tool is honest with drawings.
- **Nothing stock**: no emoji, no icon library, no tinted icon chips, no picsum photographs (the sheet's "Architecture" set
  does not belong on a dental chart).

### 4.9 The architecture under it

1. **One shared hub engine, `widget/hub.js` + `hub.css`**, extracted from the four byte-identical hubs; a hub file becomes
   configuration, data, its tint and its arcade skin. Perio is ported onto it (its own engine retires); the three oldest
   archived hubs are left as they are (archived, pages still up) unless Sam wants them restyled too.
2. **Content split from code**: each hub's questions, whys, notes, review, hints, cram, likely topics and cases as JSON files
   next to the hub, loaded on demand (Home + the first lecture first; the bank's data on first open; a lecture's notes and
   figures when opened); the anima figures as per-figure files. Occlusion goes from 2.26 MB to a first load of a few hundred
   KB. CI, narrate.py, the figure builds and the preview transform are updated in the same PR.
3. **One `bootstrap` RPC** per page (name, pins, answers, rank, mastery, trophies, pet days, eggs, inbox, survey, overrides,
   podcast feed, question stats): about 17 round trips to 1; the rank, leaderboard and trophy RPCs are called only when a
   panel opens; `sh_visitor_xp` cached per visitor (a materialized `visitor_xp` kept by trigger); `get_pet_days` not polled.
   One analytics flush timer. The advisor fixes (search_path on 6 functions, a primary key on `link_attempts`, drop 2 unused
   indexes).
4. **Two widget bundles** (core on load; eggs, pet art, ranks art, tour, podcast on idle or first use), one shared
   stylesheet, one self-hosted font, a thinner Supabase client (a fetch wrapper; realtime presence kept), sw.js precaching
   the engine and fonts and caching content JSON stale-while-revalidate.
5. **Engine hot spots** fixed in passing: filter once per redraw, debounce saveState, re-render only the list.

### 4.10 Phases (each a PR with a preview link, screenshots, the release suites and Sam's look)

| Phase | What ships | Student sees | Size |
|---|---|---|---|
| 0 | This note; the design tokens, the font, the drawn icon set, Timmy's symbol sheet, the chart, built in a preview page | nothing yet (a preview link to react to) | 1 week of sessions |
| 1 | `widget/hub.js` + content split, on **one** live hub (Occlusion or Heme & Endo 2), the new IA (Notes · Questions · More), the question card and feedback, session recap, daily goal | the redesigned hub | the big one |
| 2 | The other live hubs on the engine (Heme & Endo 2, PCD Implants if still live, Special Patient Care, perio port) | every live hub | per hub, small once the engine exists |
| 3 | The dashboard: folder, "you" card with Timmy's house, chart, class board; About page rewritten | the new dashboard | medium |
| 4 | The game layer's presentation: medals, trophies, celebration cards on the new type, arcade lobby redrawn, HP model change | the game layer | medium |
| 5 | Backend: bootstrap RPC, XP cache, timers, advisor fixes, sw.js, bundles | faster loads | medium, can run alongside 1-4 |

Ship-it-now still holds: Occlusion and perio finals are 11-19; PCD Implants is tomorrow (untouched); phase 1 can land on
Occlusion before the final if Sam approves the preview, or on Heme & Endo 2 (exam 11-13) if that is the safer first hub.

## 5. Decisions for Sam

1. **The idea**: the patient chart as the page (4.1). Yes, or another from the inventory (articulating paper as the whole
   motif; the treatment-plan folder only; the operatory).
2. **The IA**: three destinations (Notes · Questions · More) with Home as a strip, the drill, Weak Spots and the mock as
   presets of the bank (4.3). This changes the Home rule and the filter-panel rule's wording (the content stays).
3. **Cut, fold, keep**: each row of 4.7, especially font/size/music settings, the tour prompt, Review as a mode, active
   recall, one game per hub, the podcast card's move.
4. **Timmy's HP model** softened for exam-week studying (4.5), and Timmy on the bottom bar instead of the corner.
5. **Type**: one face for the whole site. I'll show two in the preview (a humanist sans and a text serif); Sam picks.
6. **Color**: one palette with one tint per hub, or keep a whole palette per hub (the skill and the data both say one).
7. **Art**: I draw everything in SVG in Timmy's style (4.8); Sam generates raster game stages from my prompts, or I draw
   those too.
8. **The first hub** for phase 1: Occlusion (final 11-19, most used, most figures) or Heme & Endo 2 (exam 11-13, newest).
9. **Archived hubs**: leave the four archived pages as they are (my proposal), or restyle them too.
10. **Backend changes** (4.9.3): all of them, or only the bootstrap RPC and the XP cache.

Access I need: none. Everything proposed is free: self-hosted open fonts, SVG I draw, the existing Supabase project. If Sam
wants raster art generated, the ElevenLabs connector already attached can generate images from prompts (it spends
credits); I'd rather draw.

## Done when

- [ ] Sam has answered the decisions above (in chat or in this note)
- [ ] The plan is written back as phase task notes in `vault/tasks/` and the rules that change are edited in `vault/rules/`
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`)

## Log

- 2026-11-05: audit done (analytics, code, backend, inspector, screenshots); proposal written; waiting on Sam.

## Outcome
