# Deploy Notes — the change log

This repo is edited from several different Claude Projects (one per hub, plus a
"hub index" / overarching project for cross-hub UI and shared functionality),
from Claude Code sessions and from other agents (Codex and others).
They don't share context with each other — a session in one Project has no idea
what a session in another Project just changed. **This file is the one place every
session can check for what shipped.** Add an entry whenever you make a non-trivial
change, and read the recent entries before you deploy.

## Start at AGENTS.md: the rules are notes in vault/ (2026-11-03)

Since 2026-11-03 the repo is a vault ([vault/rules/repo-is-the-vault.md](vault/rules/repo-is-the-vault.md)): start at
[`AGENTS.md`](AGENTS.md), then [vault/home.md](vault/home.md). The rules that used to open this file, and the sections of
`CLAUDE.md`, are notes now, one per rule, with the same titles. **Hub Projects and Cowork sessions: fetch and read them
the way you read this file; they are the rules.** Where they went:

| Was | Now |
|---|---|
| The core rule: GitHub is the source of truth | [vault/rules/github-is-the-source-of-truth.md](vault/rules/github-is-the-source-of-truth.md) |
| The About page lists everything | [vault/rules/about-page.md](vault/rules/about-page.md) |
| Shared infrastructure | [vault/reference/shared-infrastructure.md](vault/reference/shared-infrastructure.md) |
| Perio: the single file is the source | [vault/hubs/perio.md](vault/hubs/perio.md) |
| Archiving a hub = retrospective | [vault/rules/archiving-is-a-retrospective.md](vault/rules/archiving-is-a-retrospective.md) |
| Building a hub = diagram review | [vault/rules/diagram-review.md](vault/rules/diagram-review.md) |
| Ship it now; Home page; two-statement and true/false; numbered statements; High Likelihood; the Question Bank panel | their notes in `vault/rules/` (listed in [vault/home.md](vault/home.md)) |
| `CLAUDE.md` → "<section>" (in older entries below) | the note with that title in `vault/rules/`, `vault/how-to/` or `vault/reference/` |

Hub-specific knowledge (sources, build steps, quirks, what's pending) is in `vault/hubs/<hub-id>.md`; Sam's calls are in
[vault/decisions.md](vault/decisions.md); open work is in `vault/tasks/`. This file keeps the change log below.


## Recent major changes (newest first — add a line when you ship something)

- **2026-11-24 (Learn's typed answer and Flashcards' Undo, migration_v102, Claude Code)** — Sam: "Do typed answers in
  learn and undo in flashcards too" (the two inbox lines). **Learn:** a question's second, mastering step is typed when its
  right answer is short (six words or fewer, not "all of the above" or the like, distinct from every other choice: 163 of
  Review of Systems' questions); a longer one is still asked without its choices, or with them. A forgiving match
  (`SH_STUDY.match` in `widget/study-modes.js`: case, spaces, punctuation, accents, articles, a plural s, number words,
  word order, and one typo in a word of 7 letters or more, never in its first two) marks a clear match right by itself;
  otherwise the right answer shows and the student taps "I had it" or "I missed it" (Sam's call). A match pays as an
  answer (10, then 2), a self-mark like a recall card (a flat 2), and a typed answer counts in your own answers but not
  in the class's numbers: `sh_answer` takes the new context `typed` (migration_v102, applied live at about 6:55 pm Central
  on 2026-11-23, md5-checked before and after; `tools/release/xp.js` section 20). The typed words never leave the page.
  `tools/ci/typed.js` (in "Check hubs") checks the match on every live hub's typed questions. **Flashcards:** a rating is
  held for 5 seconds under the next card with an Undo (or U, or Ctrl+Z), which puts the card back, flipped, with its
  schedule as it was; it is saved at the next rating, Close, or when the page is hidden or closed, and one still queued is
  sent by the hub's next page, paid once (its request id). `tools/ci/smoke.js` walks both.
  [The task](vault/tasks/done/2026-11-06-redesign-learn-and-flashcards.md).

- **2026-11-24 (A faster shop and a lighter Timmy's place, Claude Code)** — Two inbox lines, measured at 4x CPU as
  [motion-cost](vault/reference/motion-cost.md) does. **The shop's opening:** of the three suspects none was most of it:
  `mount()` in `widget/shop.js` drew every shelf twice on each first open (the cached shop, then the server's, which always
  differed because the mystery box is never cached; about 600 ms). Now the server is asked while the files load and the
  shelves wait for it up to 1.2 s; the sets' files are fetched beside the shop's art, not after it. The dashboard's
  `drawWallet` (`widget/dash.js`) no longer focuses the Shop button behind the open shop (about 200 ms of layout) and draws
  the row again only when it changes. The page keeps its scrollbar's room while the shop is open (`tsh-gut`,
  `scrollbar-gutter: stable`; about 250 ms on a desktop with classic scrollbars). Long tasks 1.4 s → 0.9 s on a phone-size
  screen, 1.8 s → 1.0 s on a laptop with scrollbars. **The place at night:** the stars were 2-3% of the busy main thread
  (three twinkling groups cost more, so they stay as they were); the rest was the rank medal's shine in the place's panel,
  a SMIL `<animate>` that drew the page every frame. It is a CSS transform now (`art()` in `widget/ranks.js`, its keyframes
  inside the drawing), same path and timing: 95-97% busy → 11% (phone size), 87-90% → 33-38% (laptop size). It shines the
  same in a hub's Stats, the trophy case and the cards. Rule 9 in motion-cost: no looping SMIL. Left on the to-do list:
  the Diamond and Dark Matter medals' other SMIL, Timmy's place's and Focus mode's scrollbar, what's left of the shop's
  opening, an iPhone look at the stars.
- **2026-11-24 (The typodont and the arcade's tooth tiles drawn from the tooth library, Claude Code)** — the package "The
  typodont and the arcade's tooth tiles drawn from the tooth library" ([the task](vault/tasks/2026-11-20-patient-box-v2-next-steps.md)).
  `widget/journeys.js`'s typodont (the ModuPro hand-off) dropped its own copy of Wheeler's table, the crown outline, the
  grooves and the curve smoothing and reads `widget/teeth.js`, which `handoff()` now fetches beside the journey art (`typo()`
  is null until it arrives); every one of the 13,498 numbers it draws is the same as before. The library gained
  `buccalGroovesMM()` (the typodont's molar grooves) and an incisor's proximal view (`LL`, Wheeler's labiolingual sizes and
  curvatures; `proxCrownMM`, `mkProxRoot`, `proxOutlineMM`; schematic between his landmarks). In
  `tools/figures/site/arcade.mjs`: Pocket Showdown's molars (`boardTooth()`, a lower second molar), Occlusion's Cross-Section
  (`sectionMolar()`, a lower first molar in its bone, ligament and gum) and Perio's Cross-Section (`sectionIncisor()`, a lower
  central incisor from the side with its probe) are drawn from the library; built into `tools/preview/design/art.js` only,
  since neither hub's page is up. Nothing students see changes.

- **2026-11-24 (The year-spanning readers read the totals, migration_v101, Claude Code)** — The to-do "Before the first
  collapse (about 2027-09-13), point the year-spanning readers at the totals". From the night a day turns a year old, the
  nightly job collapses its per-person hours into `activity_daily` (migration_v93), and the Insights tab (`sh_insights`), the
  recap (`get_hub_recap`), `tools/retro.sql` and `tools/lessons-daily.sql` read `activity_hourly` only: a hub's oldest days
  would have dropped out, and a hub older than a year out of Insights altogether (its people falling under 5). Now all four
  add the collapsed days' minutes from `activity_daily`, worked out from pings so a day gives the same numbers before and
  after. What totals can't give (a hub's people, one day / 3+ days, median and p90 minutes, median answers, a surface's
  people, the check-ins' median) the job keeps per hub in `insight_cards_kept` the night its first day is collapsed, and
  Insights reads it from then on ("per person as of <day>" on the hub's row); the recap's hours of the day, regulars and
  awards count the kept days, and its image says so. Nothing has been collapsed yet, so nothing needed filling in.
  `tools/release/retention.js` checks a partly collapsed hub's Insights line, surfaces, check-ins and recap are the same
  before and after. **Applied after the merge**, 1-5 am Central (in `supabase/pending-migrations.txt` until then). How:
  [insights-dashboard](vault/reference/insights-dashboard.md), [analytics-retention](vault/reference/analytics-retention.md).

- **2026-11-24 (The preview's two small bugs, BUG-107 and BUG-039, Claude Code)** — Preview only, nothing on the live
  site changes. (1) The preview's dashboard drew Timmy at 0 HP for the returning, missed and high-XP test accounts until a
  hub had been opened, because the made-up answer history was built from the hub page's own question list: the preview's
  build now puts every engine hub's question ids and exam dates into the runtime (`hubFixtures()` in
  `tools/preview/transform.js`), so any page makes the same history (the dashboard first: 100 HP). (2) On a small phone the
  Preview button covered the exam check-in's buttons: while one of the page's dialogs is open it now moves to the corner or
  edge that covers least of it (`dodge()` in `tools/preview/runtime/preview.js`), and stays put otherwise.
- **2026-11-24 (Housekeeping: BUG-197's last rows, four retests, the inbox, Claude Code, #544)** — Nothing students see.
  **BUG-197:** counted read-only, 2 `pq-` rows in question health (Review of Systems, ctx mock, 1 made-up visitor), from
  12 minutes before #524 merged, none since: the guard proxy holds. `tools/data-fixes/2026-11-24-bug-197-last-rows.sql` (the
  2026-11-20 fix's body) takes them after the merge. **Retested:** BUG-197; BUG-198 on the live site (Review of Systems'
  `--hub` is `#6b46a8` on Home and Notes, light and dark, with every request off the site blocked); BUG-195 and BUG-194
  (no recurrence in any of the 147 Check hubs and 111 Release tests runs since #506, logs searched). **Inbox:** its 16 ticked and struck lines cleared (each is in its PR, `decisions.md` or the bug log); the
  boards PRs' line and the boards hub note rewritten to section 6 of `docs/boards/ENGINE_PLAN.md` (#81, #97, #100, #102
  closed as replaced; #95, #101 through T-16 and T-17; ten finished as they are). **The sustainability task's** `due` moves
  from 2026-12-02 (packages 1 and 2, done) to 2026-12-31, its next open box (the compaction after the December packs).
- **2026-11-23 (Crowns given by hand, migration_v100, Claude Code)** — Sam: "Give [one account, by its leaderboard name]
  50,000 crowns". Every way to crowns until now pays XP too (a prize pays as many crowns as XP) or is worked out from XP and
  rank, so a new kind: `crown_gifts`, one row a gift, which `sh_wallet` adds to what was earned (`gifts` in its answer) and
  nothing else reads; `sh_gift_crowns(visitor, key, crowns, note)` gives one once per key, to the id that remains when
  devices are linked, and updates the Crowns board row at once; a trigger moves a linked device's gifts. Closed to visitors:
  only an agent (through the connector, when Sam asks) or Sam (the SQL editor) gives one. Applied live at about 7:03 pm
  Central on 2026-11-22 (md5-checked before and after), then the 50,000 given: the balance went up 50,000, XP and rank
  stayed. `tools/economy.sql` E3 leaves gifts out of the share spent. `tools/release/xp.js` section 19 tests it. How:
  [game-server](vault/reference/game-server.md).

- **2026-11-22 (Smoother scrolling, and nothing you can see pauses, Claude Code)** — Sam: "Is there a way that we can make the
  performance better for the dashboard when scrolling and in timmys shop and such?", then "I also hate that animations
  pause". The 2026-11-14 fix (BUG-147) made the drawings rest: 8 s of motion, frozen while scrolling or touching, the shop's
  frames 6 s at a time, the place's stage holding while its window scrolled. Measured on a slowed browser, the resting
  was most of the jitter left: each rest and wake restyled every shape in a drawing (`.is-rest svg *`, up to 3,700 shapes,
  40-150 ms each time). Now **nothing on screen pauses**; only a part off the screen, or behind a window that covers it,
  stops, through a rule that names the moving classes (`.is-away :is(...)` in `widget/dash.css`; `lifeWatch` in
  `widget/dash.js`, which now also notices a window that opens after it loads). The **stage** is two stills with its
  beams and sparkles between them and its crown and confetti over them, each in a box the compositor moves (`fx()` and
  `stage({ part })` in `tools/figures/site/stage.mjs`; `stageSvg`/`stageFx` in `widget/dash.js`). The **shop's** frames,
  storefront and mystery box are drawn in the page, not as moving images (`live()`/`watch()` in `widget/shop.js`; `shopLife` is
  gone). The **place card's** moving picture is its own layer (`widget/place.css`), the place's stage no longer holds
  (`stageLife` is gone), and the hot-air balloon lost an empty moving group that redrew the page on every frame
  (`tools/figures/site/place.mjs`; the art build now fails on one). Under a 4x slower processor a second scroll of the
  dashboard with everything moving takes about what `main` took with everything frozen (20/24 ms a frame on phone/laptop,
  `main` 19/20). This cloud browser has no graphics card, so the compositor's share couldn't be measured: check on a real
  phone. [motion-cost](vault/reference/motion-cost.md), [decisions](vault/decisions.md).

- **2026-11-22 (Review of Systems against the professors' slides and recordings; Ask Timmy reads one course, Claude Code)** —
  Sam uploaded the courses' slides and some recordings' transcripts. One reviewer per part checked it and wrote a proposal
  (exact edits, new questions, hints, retirements, calls for Sam), merged in order, slides before recordings:
  Cardio & Respiratory (CR-1 to CR-5), Renal (RN-1 to RN-5, with Dr. Herr's recordings), MSK & GI's GI parts (MG-1 to MG-3),
  Fundamentals I (F1-1 to F1-9) and Fundamentals II (F2-1 to F2-8) ([the task](vault/tasks/done/2026-11-22-review-of-systems-from-the-slides.md);
  ten decks were too big or too old to read: on 2026-11-23 Sam gave three as PDFs (the heart anatomy deck, Dr. Herr's
  foregut and abdominal wall decks), F1's endocrinology and Histology 4 were checked against the Heme & Endo and MSK hubs,
  and the rest are left to the study guides). 1,126 questions to 1,369, High-yield points 18 to 169 (all what a professor
  said to know), High yield topics 316 to 383, 554 questions now on the slides.
  Errors fixed against the slides, gaps filled at both note levels with cram lines, new questions with every choice's why,
  the professors' "know this" as High-yield points with their words, what they said to skip left out with nothing saying so
  (Sam, 2026-11-23: "dont include a note saying 'dont memorize'"; the 50 deemphasize points the reviewers wrote came out and
  [the rule](vault/rules/dont-ask-what-professors-skip.md) changed), the twelve conflicts settled from current references
  (Sam: "use outside sources to decide the content calls": [decisions](vault/decisions.md)), sources
  named in each part's `from` and questions' `src`. Questions only added, none retired (ids in
  `tools/question-ids/review-of-systems.txt`). Content grew to about 245k tokens for Ask Timmy, past his 200k limit; Sam: "I
  dont want to sacrifice the quality of the material just so we can have ask timmy", then "have Timmy only read the course
  the student is in". **Ask Timmy's course mode** (`supabase/functions/timmy/core.js`): on a hub with `groups`, every
  question gets one course's notes, tables, cram sheet, High-yield points and topics (`COURSE_NOTE`,
  `part(lecs, { scoped: true })`; no course known, every course's cram sheet, `CRAM_NOTE`), about 36-87k tokens with the rules and site help (under the 100k prompt where Haiku 5.5's
  price goes up fivefold), cached an hour per course, the whole content only on "not covered". The course is the answered
  question's, the lecture on screen's, or what the page names (`context.course`, `askCourse()` in `widget/hub-timmy.js`:
  the Question Bank's course when one is picked, else the notes last opened). `tools/timmy/test.mjs` checks each course's
  prompt under 95,000 and the mode itself; the smoke test checks the chat names the course; the eval has 8 `rs-` cases.
  Deploys itself after the merge (After merge: Ask Timmy's function changed). The page's download budget
  (`tools/release/budgets.json`) went from 1,500 to 1,800 KB (Sam: "a budget raise is fine"): about 1,605 KB with the slides, drawn by about 2.7 s. The
  real-model eval wasn't run (Sam: "dont worry about the eval, its a waste").

- **2026-11-22 (The exam-eve boss, the Midnight Plaque, idea board #4, Claude Code)** — Sam set the idea Planned ("This could
  be fun. Maybe have an xp + gold crowns reward"), then, on the PR's numbers: "open it from 3pm to midntight, hp is good, pay
  is good, he can also have a card below the today card on the question bank". The night before every exam in `hubs.js`, 3 pm to midnight Central, one
  boss per hub with 3,000 HP: every right answer anyone gives in the hub is a hit; if it falls before midnight, everyone who
  landed a hit gets 250 + 25 a hit, up to 1,000, XP and crowns (one `xp_awards` row, key `eve:<hub>:<day>`, src `boss`).
  **`migration_v97.sql`** (applied by the merging session on 2026-11-22 at about 11:46 am Central; **replaces no function**): the table `eve_bosses`
  (closed to anon), `get_eve_boss`, the count (`sh_eve_count`: the answers `record_answer_v2` already writes, from an id
  found by a binary search on the primary key, at most once every 20 s, under a try-lock: no hot row and nothing new in the
  answer save) and pg_cron's `sh-eve-boss` every 10 minutes, which settles it after midnight. Seeded with Review of
  Systems' Dec 2 and Dec 9; after that the After merge workflow's new **`eves`** step writes each exam's eve on every push
  that changes `hubs.js` (`eveBoss: false` skips one, `eveBoss: <hp>` sets its HP). The page (`widget/eggs.js`): asks only
  on an eve (and the exam's morning, for the result), every 30-38 s while it's up and in view, never in a mock, with the
  boss switch off (Focus mode) or in a quiet spell; a band under the bar (the regular boss stays away that night), a card on
  Home (`[data-eveslot]`, `widget/hub.js`) and a smaller one under Today in the Question Bank's side column
  (`[data-eveslot="side"]`, `widget/hub-bank.js`; the column now scrolls on its own when it's taller than the window), the win's confetti and reward card (`sh:prize` src `eve`) or the loss's toast; a
  line on the dashboard's hub panel from the dates alone (`widget/dash.js`). New art: `tools/figures/site/eveboss.mjs` (six
  states, the Santa hat; `eveboss-sheet.mjs` draws its contact sheet) built into `widget/hub-art/eveboss.js`, fetched on
  first use. About page, the Extras switch's line, [game-server](vault/reference/game-server.md),
  [after-a-merge](vault/how-to/after-a-merge.md), the hub note and two inbox lines (check the rows once applied; read the
  first eve's result on Dec 3). `tools/release/xp.js` section 14f, `rls.js` and `tools/after-merge/test.js` cover it.
- **2026-11-22 (The weekly pennant: idea board #6, `migration_v98.sql`, applied, Claude Code)** — Answer 100 questions from
  Monday to Sunday (Central), in any hub and any part of it (xp_days.n: practice, drill, mock, arcade, Learn; not
  flashcards), and Timmy gets that week's pennant, with `week` 500 XP and as many crowns (Sam: "lets do 100, the rest looks good"; the idea said 50). Server:
  `week_pennants` (a row per person per week, made once), `claim_week_v2` (the page asks after the 100th answer's reply; the
  server counts again), `get_my_week_v2` (this week, the class count from 5, the pennants earned), `sh_week_sweep` (pg_cron
  `sh-week-pennants`, Mondays 1:17 am Central: the ones the page didn't claim), a `visitor_links` trigger; `sh_prizes`,
  `sh_is_prize` and the `xp_awards` src check gain `week`. Nothing in the answer path changes. Page: the count is
  `shPet.week()` in `widget/pet.js` (Timmy's days, so no request), the server read at most every 30 minutes (`sh_week` on
  the device); Home's Today card (`weekRow`, `widget/hub-rewards.js`), the dashboard's You card (`pennantStat`, asked only
  after the first scroll or tap), the reward card's pennant badge, and Timmy's place (`widget/place.js`): the newest flies
  from the lamp post (own place only, never a visit), a Pennants view, a panel row. Art: `tools/figures/site/pennant.mjs`
  (`window.SH_PENNANT` in `widget/hub-art.js`: the month's felt and badge, the week of the month as stars, the school year's
  sleeve; 209 Mondays checked by the build; `pennant-sheet.mjs` draws a contact sheet), the lamp's pennant in `place.mjs`.
  Linked devices are one person: the claim, the read and the sweep count and pay under the main id. Every function is
  PL/pgSQL. Tested: `tools/release/xp.js` 14g, `rls.js`. About page entry. The merging session applied the migration on 2026-11-22 at about 11:15 am Central.
- **2026-11-22 (No printing on the one-page sheet, Sam, Claude Code)** — Sam: "lets take away the print/pdf download option".
  `widget/sheet.js` draws the sheet on screen only: the Print or save as PDF button, its "Fits on one sheet of paper" line, the
  printed copy (`body > .shp`, `fit()`, `sheet:print`) and `widget/sheet.css`'s `@page` and print rules are gone; Practice is
  now the sheet's main button, the toolbar's One-page sheet button has the cram sheet's icon (the `print` icon is out of
  `tools/figures/site/icons.mjs`), and More's wording no longer says "to print". `tools/ci/smoke.js` checks every sheet's cram
  lines on screen and fails if printing comes back. About page and Ask Timmy's site help, event taxonomy, retention, repo
  map, hub note and [decisions](vault/decisions.md). Same PR as Review of Systems' violet (#537).
- **2026-11-22 (Review of Systems in its own violet, BUG-198, Claude Code)** — the hub had drawn in the engine's default
  grey-purple (`--hub: #6b5a68`) since it was built: `widget/hub.css` never had its tint line, and #523 had taken out the
  archived hubs' lines. One line adds it (ink `#6b46a8`, mid `#a58ad6`, light `#e8e0f5`, dark `#b9a2ec`, as in
  `tools/figures/site/style.mjs`): buttons, the active tab, the countdown, icons, course headings and the one-page sheet's
  accent are violet, as its emblem, masthead and dashboard card already were. Contrast: ink 5.35:1 on its light, dark 7.72:1
  on the dark panel. `widget/site.bundle.css` rebuilt; no `sw.js` bump (styles are network-first). Found while building #536;
  shown to Sam before and after (Home, Notes, a sheet, light and dark). [build-a-hub](vault/how-to/build-a-hub.md) and the hub note say a new engine hub needs
  its own line.
- **2026-11-22 (a mystery box in Timmy's shop, Studying now to visit, and the Crowns board, idea board #9, Claude Code)** — From the idea board's "Drip for Timmy", which Sam set Planned. **The box** (`migration_v99.sql`, applied live by the merging session at about 16:45 UTC that day and appended to `supabase/schema.sql`): `get_mystery_box` and `open_mystery_box` (one call, idempotent on its request id, under the per-visitor lock); 750 crowns for a random piece you don't have from the everyday rotation, up to 3 a Central day, the odds by rarity on the box before you open it (40/30/18/9/3, a finished rarity's share shared out over the rest), nothing charged when nothing is left. It writes a `pet_purchases` row of kind `box`, so the wallet is unchanged. `widget/shop.js` draws it above Today's picks with its odds, a sheet with the odds table, and the opening (the box shakes, the lid comes off, the piece and its rarity's burst); new art in `tools/figures/site/shop.mjs` (contact sheet from `shop-sheets.mjs`). **Studying now**: `get_studying_now` (a ping in the last 3 minutes, any hub; only people who picked their own name for the boards; name, visit key, rank and medals; a count of the rest; about 2 ms a call) behind a third leaderboard tab on the dashboard (refreshed every minute while shown) and a list under Timmy's place in a hub's More; a visit from either goes through the list with the place's arrows. **The Crowns board** (Sam: "Replace study streaks with crowns balance"): the dashboard leaderboard's Study streaks tab is now Crowns, the top 10 by Shiny Gold Crowns on hand; `get_crowns_board_v2` reads a new cache, `crowns_board`, filled by the pg_cron job `sh-crowns-board` (every 2 minutes, `sh_crowns_refresh(8)`, at most 2 s a run; the whole class in about 45 minutes after the migration), and works out the caller's own balance live. No function replaced. Smoke checks for all three, `tools/release/xp.js` section 18, the preview's fake server, the About page, the event taxonomy (`shop:box:<rarity>`, `dash:board=now|crowns`) and [game-server](vault/reference/game-server.md). Sam approved the price, the odds, the limit, the tail and who shows as built.
- **2026-11-22 (A one-page sheet for every lecture, idea board #5, #536, Claude Code)** — Sam's note on the idea ("do you actually
  want to print this or just have the cram sheet and likely topics/hints all together?") is answered with one thing that does
  both. **`#notes/<lecture>/sheet`** on every hub on the engine: the lecture's cram lines, its High likelihood topics
  (strongest evidence first, with each `basis`) and its Exam hints (a "You can skip" part for `deemphasize` ones), word for
  word from `study.json`'s `cram` and `hints` and `core.json`'s `likelyTopics`; on a hub of courses (`hintsFrom: "courses"`,
  Review of Systems) High-yield topics, High-yield points and "Said not needed". **Print or save as PDF** calls the browser's
  own print window: the printed copy is its own block (`body > .shp`), Letter in two columns with half-inch margins, and
  `fit()` sets its type from 10.5 pt down to 7 pt until it measures one page against a 10-inch ruler inside it (so the text
  size setting's zoom doesn't change the answer), at draw time, once the fonts are in and on `beforeprint`; the print rules
  hide the rest of the page and force light colors in dark mode. All 70 Review of Systems sheets fit at 10.5 pt; a made-up
  lecture with 48 cram lines fits at 8.25 pt, and 72 goes to two pages at 7 pt, each matching a Letter PDF's page count.
  **Not High yield:** High yield is the notes' third reading level, the paragraphs that teach each topic (about 6,000
  characters a lecture, two printed pages or more); the sheet is the list that fits one page, and links to High yield for the
  why. New files `widget/sheet.js` + `widget/sheet.css`, fetched the first time a sheet opens (precached in `sw.js`, `VERSION`
  sh-v73); `widget/hub.js` keeps the route, the button in the notes' toolbar and under each lecture on More → Cram sheet (its
  tile's line too), and `section()` sends `compendium/cram/sheet` (`sh_surface` → `cram`; no migration); time on a sheet
  doesn't count toward the notes' "read it through" timer for Notes done. A printer icon in `tools/figures/site/icons.mjs`.
  Events `sheet:open`, `sheet:print` (on `beforeprint`, so the browser's own Print counts too) and `sheet:hy`. Search is
  unchanged: every line on a sheet was already in it. `tools/ci/smoke.js` checks every lecture's sheet on the laptop (its
  cram lines all on the printed copy, no sideways scroll, gone after leaving) and prints the one with the smallest type to a
  Letter PDF, which must be one page; a sheet that needs two even at 7 pt is a note. About page, Ask Timmy's site help.
  Found on the way: Review of Systems' violet tint was never added to `widget/hub.css` (BUG-198, not fixed here).
- **2026-11-22 (no new recordings; the change log split by month, Claude Code)** — Package 5 of
  [the sustainability task](vault/tasks/2026-11-22-sustainable-for-years.md). `tools/release/secrets.js` (CI's public-repo
  check) now fails any tracked file under `hubs/<hub>/audio/` or named `timmy-time.mp3`, and `.gitignore` leaves both out
  ([no-narration-in-the-repo](vault/rules/no-narration-in-the-repo.md)); the widget's own sounds (`widget/audio/`,
  `widget/sfx/`) are still allowed. This file now keeps a week: `node tools/deploy-notes/trim.mjs` moved the 309 entries
  dated before 2026-11-15, unchanged and in order, to `DEPLOY_NOTES-2026-11.md`, `DEPLOY_NOTES-2026-10.md` and
  `DEPLOY_NOTES-2026-09.md` (593 KB → 192 KB here). Grep `DEPLOY_NOTES*.md` for the whole log; every note that said to grep
  this file says so now. The lessons audit runs the trim again.
- **2026-11-22 (An archived hub's answers packed away, `migration_v96.sql`, Claude Code)** — Package 2 of
  [the plan for years](vault/tasks/2026-11-22-sustainable-for-years.md) (Sam's D). 30 days after a hub's page comes down
  (`hubs_down`), the nightly retention job (`sh_pack_answers`, about 20,000 answers a night, oldest hub first) replaces each
  person's `personal_answers`, `answer_xp`, per-answer `xp_awards` and `xp_seen` rows for it with one `answers_packed` row
  (answers, right, questions, first tries right, latest right, days, first and last answer, medal, XP and crowns, each
  day's share, the retries report's counts) and one award row `pack:<hub>:<id>` with the same XP. A person's answers on a
  hub go together, once the newest is over 30 days old. Nobody's XP, crowns, rank, trophies, medals or board place moves:
  `sh_xp_rebuild` adds the packed days and keeps the pack rows and their days' 20th-answer awards; `first_seen` (the class
  name), `get_hub_mastery` and the admin page's Insights, retries, drift check and check-ins read the summary; Link my
  devices moves it (a trigger on `visitor_links`). Tested in `tools/release/xp.js` section 16 (every made-up visitor
  before and after, a rebuild, a second run, a link) and `retention.js`. About page: what is kept. Applied 2026-11-22 (8:20 pm
  Central on 2026-11-21, Sam's call), md5-checked, with trials on the live data first; Genetics (1,907 answers) and
  Hepatobiliary (9,974) packed, then compacted: the database 293 MB, `personal_answers` 84 → 69 MB, `xp_awards` 27 → 19 MB
  (the task's Log). Most hubs come due about 2026-12-19; their compaction is a box in the task.

- **2026-11-22 (Shorter windows for the analytics, `migration_v95.sql`, Claude Code)** — Package 1 of
  [the plan for years](vault/tasks/2026-11-22-sustainable-for-years.md) (Sam: "Okay all that is good to me"). `hubs_down`
  (hub, the Central day its page came down) is written by the After merge workflow's `down` step (`tools/after-merge/run.js`;
  a page added back takes its row out) and filled in for the 12 hubs already down. The nightly retention job now rolls a
  down hub's question health into `question_events_daily` (`sh_retention_hub_down`, a hub at a time), keeps who tapped what
  30 days (90 before) with a daily roll-up first (`ui_click_reach_daily`, people, no ids), and rolls feature events up at 60
  days (180 before). `tools/retro.sql` and `tools/lessons-daily.sql` read the roll-ups; `tools/release/retention.js` checks
  every step (XP and crowns the same before and after); the About page's "How long it's kept" says the new windows. Applied
  2026-11-22 at 01:03 UTC (7 pm Central, Sam's call with nobody studying) by the session handling the merging: its first
  run rolled up 129,939 question-health rows and 19,358 click rows, then the tables were compacted (360 MB → 319 MB).
- **2026-11-21 (Patient Box: decay seen from the buccal, Claude Code)** — Sam's "Yes" to the drawn cheek-side view showing
  fillings and decay ([decisions](vault/decisions.md)). `widget/cases.js` draws a buccal lesion where the chart puts the gingival
  margin: a cervical crescent (a chalky white spot, or a brown cavity in a chalky rim), arrested lesions brown and rimless, root
  caries on a root exposed by recession, recurrent caries at a Class V's, veneer's or crown's buccal margin, and an incisor's
  proximal lesion as a gray shadow through the labial enamel (sources: Fejerskov's Dental Caries, ICDAS II, Nyvad and Fejerskov
  1982, Banting, Sturdevant's, Mjor 2000). New caries fields `stage`, `arrested`, `root` and buccal `recurrent`, with validate
  rules (root caries needs recession, a white spot is enamel, nothing primary on a veneered surface); `rests: ["caries"]`; the
  view's restorations rechecked (a Class II box now shows as a sliver at the outline; a lingual surface no longer draws a
  labial Class V). Old cases validate and their films draw as before. CI's records in `tools/ci/cases.js`; example
  `v21-buccal-decay` with `v21-ex-5`; `sw.js` sh-v72. No live hub has dental cases, so students see nothing yet.
- **2026-11-21 (A hub's restyle when the widget's stylesheet goes in, about 40 ms shorter, Claude Code, #525)** — The hub bundle puts `widget/v3.css` in as a `<style>` once the page is drawn, and the browser restyled every element for it: one rule set the class-picks fill color (`--sh-cp-fill`) on `:root`, and a custom property new to the root changes what every element inherits. It is set on `.sh-cp` now, the one element that reads it. On `perf.js`'s slow phone putting the sheet in went from about 58 to about 21 ms; Review of Systems' blocking time, about 237 to about 156 ms (medians of 10 alternating runs; budgets unchanged). Nothing looks different (every element's computed style compared, light and dark). `tools/release/perf.js` no longer has Chromium keep a copy of every response for DevTools (`Network.enable` with no buffers; Sam: "Yes if you think so"); it moved no page's numbers past their run-to-run spread, so the budgets stay. Also: Perio's five screens out of the a11y baseline, and `a11y.js`'s usage line names `review-of-systems`. Left: the inbox line "Cut `widget/v3.css` to the rules a hub on the engine draws".
- **2026-11-21 (Back to a random name on a linked device; the game layer's last fallbacks out, #523, Claude Code)** —
  BUG-196's follow-up: `migration_v94` (applied live 2026-11-21, 8:09 am Central, md5-checked) adds `name_custom` to
  `get_widget_bootstrap_v2` (true when `visitor_names` has the id's row), and `nameFromServer` in `widget/v3.js` and `widget/dash.js` drops the device's copy when it's false, so "Go
  back to a random name" on one linked device reaches the other (before, the other kept the random name as one it had
  picked). The fallbacks for a database without the game layer came out: `widget/v3.js` always asks for
  `get_widget_bootstrap_v2` and never switches to the old answer calls (`GAME.want` is gone, `GAME.on` is never false);
  `widget/ranks-hub.js` reads only `get_rank_profile_v2`, `widget/ranks.js` only `get_trophy_stats_v2`, `widget/replies.js`
  only `submit_survey_v2`; the preview (`tools/preview/runtime/preview.js`) no longer answers the old names. The five
  archived hubs' tint lines left `widget/hub.css` (and Perio's darker ink), and `widget/eggs.js`'s VT323 fetch for pages
  without `shx`. The `shx` class stays (the preview's pill and the figure builds select it). Nothing students see, except the
  random name now following. `tools/release/xp.js` checks the flag; `tools/ci/quiet.js` passed.
- **2026-11-21 (Patient Box v2.1's clinical calls settled from outside sources, Claude Code)** — Sam: "Use outside sources to
  determine answers" to the questions v2.1's review left. Radiopacity on a film now follows mm-Al studies (Pekkan 2011, Atala
  2019, Erzurumlu 2021, Hitij and Fidler 2013, Balci 2023): zirconia nearly as bright as metal, composite about enamel's or a
  little more, lithium disilicate between dentin and enamel (nearer dentin), feldspathic porcelain (a PFM's, a ceramic inlay's)
  about dentin's, a veneer a faint extra layer (`widget/cases.css`). A molar's access cavity flares to the occlusal instead of
  narrowing, and an incisor's `L` composite on a root-filled tooth is drawn as its access, not a Class V. `validate()`: a
  root-filled tooth needs its access restored (a crown, or a restoration with O on a posterior tooth or L on an anterior one; a
  veneer alone fails: Ray and Trope 1995); a stainless steel crown only on a molar (AAPD 2026); a vertical root fracture on an
  untreated, unrestored tooth only on a molar marked `vital: true` (Liao 2017, 2021). A gold onlay's cusps are reduced 1.5 mm,
  a ceramic one's 1.8 (`widget/teeth.js`). The odontogram's pontic: its root crossed out with a full-length X, and a key entry
  for it (and, on a phone, room between a lower quadrant's name and a bridge's bar). Kept, with sources: short fill > 2 mm, 4-5 mm of gutta-percha under a post, calculus's size, the box floor, no
  horizontal root fracture on the view. `tools/ci/cases.js` checks the new rules; the four examples and Perio's eleven old cases
  still pass. Sources in `widget/cases.js`'s header and [draw-a-patient-box-case](vault/how-to/draw-a-patient-box-case.md).
  `sw.js` VERSION sh-v71.
- **2026-11-21 (No test run can reach the class's data, BUG-197, Claude Code)** — `tools/ci/quiet.js`'s mock check still wrote
  two question-health rows per run into Review of Systems (22 on the evening of 11-20). Found behind a recording proxy: a
  request still waiting in a Playwright route when its page closes is sent on to the network, and the check closes its page
  right after acting out a hidden one (whose keepalive `record_qh` flush was sometimes still in its route on a busy runner).
  `tools/ci/no-leaks.js` now also launches the test browser behind a proxy that refuses everything off 127.0.0.1;
  `quiet.js` and `smoke.js` use it. Test code only; nothing students see.
- **2026-11-21 (A name changed on one linked device shows on the other, BUG-196, Claude Code)** — Sam: "When you change
  your name on one device it doesnt change on the other linked device. Its still saying 'welcome count plaqula'". Linked
  devices share one id, so the server already had the new name, but each device kept its own copy (`sh_display_name`) and
  showed that first, forever. Now the dashboard (`widget/dash.js`) and a hub (`widget/v3.js`) take the bootstrap's
  `display_name` when the device has a name of its own that differs (`nameFromServer`), except when that device's own rename
  hasn't reached the server: a name saved there is marked `sh_name_unsaved` until the server answers, and a page that loads
  with the mark set sends it again instead of taking the server's older one; nor when the rename was made after the bootstrap
  was asked. A device with no name of its own keeps showing the server's as before. The hub's "Good to see you" and Timmy's
  hello (`widget/pet.js`) wait for the bootstrap, at most 3 s, so they say the new name. No migration. Checked with a scripted
  browser on stubbed data: on `main` the second device still said "Good to see you, Count Plaqula."; with the fix, the new
  name, and an unsaved rename is sent again rather than lost. About page (Link my devices), `site.json`, bundles. Left on the
  inbox: going back to a random name on one device shows that random name on the other, which then treats it as picked.
- **2026-11-21 (Patient Box v2.1: crown materials, endodontics, fractures, bridges; cleaner fillings and calculus, Claude Code)** —
  Sam: "more possibilities like endodontically treated teeth, fractured teeth, and different crown materials... when theres a
  filling, the lines dont look clean and accurate. Also calculus looks bad." `widget/teeth.js` draws restorations from the
  crown's own outline (`restoParts`, `prepMM`, `recurMM`, `ponticMM`, `PREP`): smooth walls, rounded line angles, flat
  floors 2.8 mm under the contact, a softer edge for composite and ceramic. `widget/cases.js` adds crowns by material (gold,
  PFM, zirconia, lithium disilicate, SSC), inlays, onlays and veneers, overhangs and open margins, recurrent caries, posts and
  cores, fill quality, a separated instrument, a missed canal, a widened PDL, the `fracture` module (crown, cusp, crack,
  vertical and horizontal root) and the `bridge` module, on the film, bitewing, full-mouth series, chart, view and
  odontogram, with their checks (a VRF on a vital unrestored tooth is an error) and three new `rests` (`endo`, `fracture`,
  `resto`; a crack never rests on a film). Calculus is redrawn: a small irregular spur on each proximal root surface on
  films, a tan band on the view's cervical third that tapers off up the papillae. An art and code review on the same branch:
  an uncrowned root-filled tooth shows its access cavity (filled with its restoration's material) and gutta-percha wall to wall,
  the palatal root's too; the overhang, open margin and recurrent caries (by depth, and on the root under a crown) redrawn;
  the cusps over an occlusal restoration enamel to the outline; a ceramic inlay's cement line; zirconia brighter than enamel
  and lithium disilicate about enamel's; the bridge materials checked (no SSC bridge), class names built from data
  whitelisted. v1 records draw as before except for v1's amalgam (now the O outline, its cusps enamel) and calculus. Two new examples (`v21-bridge-post`,
  `v21-trauma`) in `tools/cases/examples.json`; `sw.js` `sh-v70`. No live hub has cases, so students see nothing yet.
  How: [draw-a-patient-box-case](vault/how-to/draw-a-patient-box-case.md); what's left:
  [the next steps](vault/tasks/2026-11-20-patient-box-v2-next-steps.md).
- **2026-11-21 (the old analytics compacted, Claude Code)** — The last part of the retention schedule: `migration_v93.sql`
  (pending until applied after the merge). The nightly job collapses `activity_hourly`, `activity_visits` and `question_events`
  older than the school year (365 Central days, a day a night, the first about 2027-09-13) into `activity_daily`,
  `activity_visits_daily` and `question_events_daily` (people counts, no ids). What the collapsed hours paid in time crowns is kept
  per visitor first (`activity_time_kept`, capped pings), and `sh_time_crowns` adds it, so no balance moves; linking devices moves it.
  `question_feedback` goes when a hub's page comes down: the After merge workflow's new `down` step, and a data fix for the five
  hubs already down. Sam's answers on the two question-health rows are in `vault/decisions.md`. `tools/release/retention.js` checks it.
- **2026-11-20 (The ModuPro's and the Loupes' rank sets, Claude Code)** — Every full rank-up of the later two journeys now gives an outfit and a yard piece, as the Handpiece's do: 28 drawings in `tools/figures/site/packs/ranks.mjs` (listed in `sets.mjs` `RANKS`, gtier 7-20, Stone to Dark Matter in each journey), 28 catalog rows in `migration_v91.sql` (applied through the connector at the merge, 2026-11-20), the outfits in a new `widget/hub-art/outfits/journeys.js` so `outfits.js` stays its size, and a locked one reads "Reach ModuPro Gold" (`RANKS` in `widget/place.js`). The ModuPro's are the sim lab's (a half-carved stone molar, a brass articulator, a casting machine, an instrument tray, a golden dental chair, a giant diamond bur, a nebula in a bell jar); the Loupes' are things to see by (a sundial, a brass telescope, an armillary sphere, a microscope, a lighthouse, a prism, an observatory), their outfits clear of the loupes and headlight. `tools/release/xp.js` checks forty rank rows and every later tier; `pack-preview.mjs ranks:modupro|loupes` draws one journey's sheet. [Task](vault/tasks/2026-11-12-redesign-later-journeys-rank-sets.md).
- **2026-11-20 (Patient Box v2.0: the tooth library, modules, new views and checks, Claude Code)** — The Patient Box v2
  package ([task](vault/tasks/done/2026-11-06-patient-box-v2-modular-cases.md)). `widget/teeth.js` is the tooth library
  (`window.SH_TEETH`, `require()` in Node): the Wheeler table and outlines moved out of `widget/cases.js`, plus a catalogue
  entry for all 32 teeth (surfaces, named roots, furcation entrances, trunk, sites, landmarks, films). The kit reads it;
  `widget/hub.js` loads it before `cases.js` (hub bundle rebuilt), `sw.js` precaches it (`sh-v69`). Cases can be built
  from modules (`missing`, `restoration`, `caries`, `endo`, `bone`, `bop`/`pus`/`plaque`, `recession`) with `full: true`
  for a whole mouth; new views `odontogram`, `bitewing`, `fmx`; films draw caries, composites and periapical lesions; a
  case without a `box` gets its rows from the record (`hub-bank.js` shows them). New checks: impossible combinations,
  `checkFigs()`, answerable-from-what's-shown (`rests`) and quoted numbers (`says`), all in `node tools/ci/cases.js`, which
  also checks the library and `tools/cases/examples.json`. The arcade's Stage & Grade tile draws its molar from the library
  (it goes into `widget/hub-art/perio.js` if Perio's page returns; #512 stopped building art for pages that are down). Perio's eleven old cases still draw identically. No live hub has dental cases today,
  so students see no change; what's left: [next steps](vault/tasks/2026-11-20-patient-box-v2-next-steps.md). Then an art review (a second agent): restorations drawn by their surfaces (Class I-V outlines), composite a shade under enamel, caries along the DEJ, a periapical lesion as a widened PDL with the lamina dura gone, bitewings in Class I occlusion, a full-mouth series at true film sizes, an odontogram one row per quadrant on a phone with color-blind-safe marks, and the library's enamel and pulp (`dejPts`, `pulpPts`) in every film and the arcade tile; a calculus-mirroring bug fixed on films, and a root-filled tooth may be restored with any restoration.
- **2026-11-20 (The arcade on a small phone, and visiting from its board, Claude Code, [#508](https://github.com/smcmurry6-source/study-hubs/pull/508))** — No live hub has an arcade, so Heme & Endo Exam 3's six games (git, `b0057d1`) were opened and started on today's widget at 320 px with XX-Large text. Fixed in `widget/games.css`: the dark panel bled past the page's 16 px gutter (every game scrolled sideways 6 px); Lab Sort's bins split `1fr 1fr`, so "Hypothyroidism" pushed one off the screen; the crossword sized its cells from `100vw` (too wide under the text size's zoom) and its clue column from 200 px; The Yellow Body's marquee cut its title and its long intro hid Play below the fold; and in `widget/games.js` Showdown's column headers show only the lecture's tag on a small phone (the full name as their title). `tools/ci/smoke.js`: the 320 px check starts every game of a hub with an arcade, and `visitCheck` taps a name on Smile's game-over board (a visit opens, Escape gives focus back, a dead key says so); both skip while no live hub has an arcade. The hubs' own lobby in `content/arcade.js` is unreachable on the engine: [build-a-hub](vault/how-to/build-a-hub.md) says to leave it out of the next one.
- **2026-11-20 (A hub's last long tasks after Home, Claude Code, [#513](https://github.com/smcmurry6-source/study-hubs/pull/513))** — On `perf.js`'s slow phone: `widget/v3.js`'s notes-layout fitter (`fit()`, `scan()`) starts in the next frame instead of inside the script that loads the widget, where it forced the whole page's layout right after v3.css went in; the synced answers (`SH_SYNC.merge`) redraw only the parts of Home whose markup changed (`refreshHome()` in `widget/hub.js`: the quick starts, Where to next, the progress line and each lecture's row carry a `data-hp`, their markup from the last draw is kept and compared as text, and the redraw runs in its own task), and `paintMeters()` (`widget/hub-rewards.js`) writes a meter or the Today panel only when its markup changed; `notes.json`, `questions.json` and `variants.json` are parsed a few lines at a time (`parseSteps()`, about 15 ms a step, falling back to `JSON.parse` for a file laid out another way; `tools/ci/syntax.js` checks every engine hub's files against `JSON.parse`). Review of Systems' blocking time: about 475 to about 415 ms (`tbt` budget 700 to 650). Left on the to-do list: the restyle after v3.css goes in, and `perf.js` counting DevTools' response buffering.
- **2026-11-20 (Zoom for the anima figures on a phone, Claude Code)** — Their in-drawing labels shrank to 6-8 px at 390 px. `widget/hub.js` now wraps the figures kit's `ANIMA.mount()` once (`figZoomWrap()` in `needFigures()`), so every figure the engine draws (notes, the bank, Learn, Flashcards, Review) gets a Zoom button under its drawing when it is shown at less than 85% of its viewBox width; it opens a full-screen view (`.hx-figzoom`, styles in `widget/hub.css`) with the figure's own `.anima` element moved in and back, at its drawn width (+ to 1.5x and 2x, Fit), the drawing scrolling sideways in its plate. Checked on Heme & Endo Exam 3's L17 figures from git (labels about 7 px before, 12-13.5 px zoomed; steps and tap-a-part still work; Esc returns focus; nothing on a laptop). Counted as `fig-zoom:<figure>`. No live hub has anima figures today, so it waits for the next ones. About page and [diagrams-anima](vault/rules/diagrams-anima.md) updated.
- **2026-11-20 (More ways to earn crowns, Claude Code, `migration_v92.sql`)** — Sam: "yes want more ways to earn crowns", then "Yes and backpay" to the list in study days. Seven prizes, each one `xp_awards` row with a key that pays once and as many crowns as XP: the first Tooth Fairy 250, the first Golden Tooth Fairy 500, a Golden Probe won 300, a perfect mock (20+, all right) 750 once per hub, yesterday's misses all right 100 a day, an idea shipped 500, the first answer after a week away 200. New calls `claim_fairy_v2`, `claim_golden_probe_v2`, `claim_misses_v2`; `sh_session_finish`, `sh_streak_step` and `admin_set_idea` pay the rest; the old egg calls pay too. Back pay in the migration: first fairy catches, every Golden Probe won, each hub's first perfect mock. `widget/eggs.js`, `hub-bank.js`, `v3.js` (`PRIZES`, the names), the About page, `tools/release/xp.js` section 14e ([game-server](vault/reference/game-server.md)). Applied live 2026-11-20 at about 6:45 pm Central, md5-checked: back pay went to 42 first fairy catches, 58 Golden Probe wins (29 people) and 8 perfect mocks (7 people), 33,900 XP and crowns in all.
- **2026-11-20 (CI's two flaky failures, Claude Code, #506)** — BUG-195: the smoke test's `petFrom()` tries its `route.fetch()` twice and reports a reset as a problem line instead of crashing the half. BUG-194: the dashboard's What's new "More" (`.dx .dx-wn-more`) is 28 px tall at least, so it never measures under 24 on a small phone; bundles rebuilt. Review of Systems' a11y baseline entries were already in (#503): ticked.
- **2026-11-20 (What the old pages' cleanup left, Claude Code, #512)** — Follow-up to #496; nothing students see changes. (1) `tools/figures/site/build.mjs` writes `widget/hub-art/<hub>.js` only for a hub whose page is up (`hubs/<hub>/index.html`) and `generic` (the dashboard's masthead for a hub with no art), and deletes the rest (`--check` fails on one left): the six files for Occlusion, Perio, PCD Implants, Heme & Endo 2 and 3 and Special Patient Care are gone; their tints and emblems stay in `hub-art/dash.js`. (2) The stylesheets' `html.shx` prefix (`hub.css`, `dash.css`, `study-modes.css`, `trophies.css`, `shop.css`, and the CSS in `prize.js` and `tour.js`) is now `:root`, so no rule waits on the class any more. Stripping it bare was tried first and changed the pages (the rank name lost its metal, Timmy's bubble and the question pin buttons restyled): the prefix is what lets the design system win over the shared widget's own styles, so it stays as `:root` (shared-infrastructure says so). Checked by every element's computed style on the dashboard and 13 hub views, light and dark, laptop and phone, against `main`: no difference. (3) `widget/pet.js` always reads `get_pet_days_v2` and `widget/replies.js` always `get_my_inbox_v2`: their `live` and `v2` options and the fallbacks to the calls from before the game layer are out, and so are the preview's answers to `get_pet_days` and `get_my_inbox`. (4) The tools' old-page branches: `tools/release/a11y.js` (an old hub's modes), `lib.js`'s `isEngine()` (with its use in `tools/ci/syntax.js`), `tools/ci/cases.js`'s `pcases` block in a page, `tools/ci/preview.js`'s three old answer calls, and the `window.SH_EXPORT = {` line in `AGENTS.md` and verify-before-pushing.
- **2026-11-20 (The cleanup the old single-file pages held up, Claude Code, #496)** — Sam: "lets go ahead and take down all old pages". With the last of them down (2026-11-19), the shared code stops carrying them: `widget/ranks.js`, `ranks-hub.js` and `rankup.js` lose the `NEW` (`html.shx`) gates, so there is one trophy list (27) and one look for the cards (the old cards, `unlocks()`, the old rarity line, `HOUSE` and the old trophy-stats read are gone); `widget/pet.js` loses the old house picture (`houseSvg`, `houseDeco`, the `sh:rank` redraw, `shPet.house`, its use of `sh_rank_tier`): the "you" card draws a blank frame the size of the picture until Timmy's place has drawn over it, as before; `widget/dash.js` calls the game layer's `_v2` functions with no fallback (`rpc2` is one line, `sendForm` has no old call, `V2` and `missing()` are gone); `hubs.js` loses `legacy` and every hub's unused `modes`, and its readers: `dash.js`'s `LEGACY`, and `widget/trophies.js`'s shelves, which are now the hub you're in, the live hubs and any hub you've won in; an idea from an old hub's exam check-in, which `post_idea` refuses for a hub with no answer keys, is sent again as an idea for all hubs (`widget/ideas.js`). `tools/ci/smoke.js` loses the old-hub walk, the `OLD` hub's checks (bowling, the shop, Timmy, 23 trophies and the old cards' markup, `LIVE_CARDS`), the "without the game layer" dashboard check and the lint's exemption sets (`WHY_EXEMPT`, `FORMAT_EXEMPT`, `WHICH_EXEMPT`, `LIKELY_EXEMPT` and the grandfathered lectures, all for hubs whose pages are gone); its BUG-116 check (a card after a level-up still plays) moved to the engine hub. `tools/figures/site/build.mjs` and the design page drop the old houses. No widget file was found that no page loads (`review/` keeps the full client; the per-hub art left over is on the inbox's to-do). Bundles rebuilt.
- **2026-11-20 (Lessons refresh: the Heme & Endo Exam 3 retrospective, its recap, its audio off and its page down, Claude Code)** — Sam, the morning of the exam: "Hematology is over. You can do what you need to do". The audit wrote Exam 3's retrospective in `LESSONS.md` (88 people, 169 h, half Exam 2's: the hub got one evening, the afternoon of the Perio final, 74% of its time; first tries 67%, the lowest of any hub; Dr. Herr's study guide page 38 people and its On the study guide filter 34; two two-statement items near zero on first tries, a word-swap trap the plain MCQ on the same fact doesn't have), published its recap to the dashboard (`tools/publish-recap.js`, Sam's standing OK; featured `ll-num-bsx`), and took its narration, the study guide's recording and Timmy Time off the site ([archived-hubs-drop-their-audio](vault/rules/archived-hubs-drop-their-audio.md)): 23 mp3s and 22 words files (283 MB; the site 327 → 44 MB, no audio left on it), `"audio": "off"` in `hubs/heme-endo-exam3/content/core.json` (the build emptied `hyAudio` and set `guideAudio` false), and Listen, Timmy Time and the `podcast` out of its `hubs.js` entry. Then its page (Sam: "Yes come down. Merge"): `hubs/heme-endo-exam3/` removed (in git at `b0057d1`), `hubs.js` archives it at 9 am on 2026-11-20 (`archiveOn`) with its check-in still from 10 am, `sw.js` `sh-v68` with Review of Systems alone, CI's figure check for it dropped, the About page's Exam 3 entries rewritten without it (the arcade table now names the six games, not one hub's) and Ask Timmy's site help rebuilt; the tests that ran on its page run on Review of Systems (`tools/ci/quiet.js`, `tools/release/admin-ui.js`, the a11y baselines, Ask Timmy's dashboard questions), and the smoke test's game-layer wiring check waits for the next hub with an arcade (the inbox). Found reading question health: `tools/ci/quiet.js`'s mock checks, run from branches older than `tools/ci/no-leaks.js`, wrote two `pq-` rows each into the class's question health (13 made-up visitors, 6 rows in Perio); today's `quiet.js` sends nothing past its routes (checked behind a proxy that refuses every request), and `tools/data-fixes/2026-11-20-quiet-test-rows.sql` takes them out after the merge (BUG-192). Also: the Perio final's later check-ins (29: About right 23), Live signals and the game economy rewritten (median study day about 950 crowns in exam week, the median wallet 11,140, 12% of crowns spent; Sam's "prices are good for now" stands), the data-quality report read (the inbox), `vault/home.md`'s hub list brought up to date.
- **2026-11-20 (The gold card over the report-reply pop-up, and the large-text retests, Claude Code, [#497](https://github.com/smcmurry6-source/study-hubs/pull/497))** — On a phone a report-reply pop-up (`.sh-reply`, z-index 10001, at the top under the bar) covered the gold reward card (`.hx-prizes`, 45) so only its first line showed; on a laptop from about 870 to 1,250 px the pop-up (bottom right) covered the card's right end. `widget/prize.js` lifts the card to 10004 for its few seconds (under a phone's toasts, 10005, which drop in under it). Bundles rebuilt. Retested on `main` (a28cb13) with the preview's made-up data: BUG-190 (Timmy's Shop, an item's sheet and Ask Timmy at X-Large and XX-Large) and BUG-191 (Home's Timmy Time card at about 900 px), on the dashboard, Review of Systems and Heme & Endo Exam 3 (the Timmy Time card on Heme & Endo Exam 3 only: Review of Systems has none): both retested (done).
- **2026-11-20 (A hub's work after Home in smaller pieces, Claude Code, [#498](https://github.com/smcmurry6-source/study-hubs/pull/498))** — On `perf.js`'s slow phone, `exportSections()` in `widget/hub.js` builds the search index a lecture or chart group at a time (`exportSections(pace)`, steps of about 25 ms; without a pace it runs at once, as `tools/timmy/test.mjs` calls it), `widget/fx.js`'s `fillBars` measures every bar before animating any, once a frame (an animation started between two measurements laid the page out again for each of Home's bars), `widget/v3.js`'s `fit()` reads before it writes and skips unchanged values, `widget/hub-rewards.js` fits the rank pill once a frame, and `fmt()` keeps one `Intl.NumberFormat`. Review of Systems' blocking time went from about 920 to about 490 ms (`tbt` budget 900 to 700), Heme & Endo Exam 3's from about 430 to about 230. What is left: the inbox line "A hub's three remaining long tasks after Home".
- **2026-11-20 (The ModuPro hand-off: the typodont eats the Handpiece, Claude Code)** — Sam, after the Loupes one: "I think instead I want the modupro to basically eat the handpiece and then replace it". `modupro()` in `widget/journeys.js` is a new scene, about 9.5 seconds to its button (timeline `MP` above it): the Dark Matter III Handpiece in its purple space; the screen darkens and rumbles; the typodont (the same Wheeler crowns, gum and plates) comes in from above and below with its jaws wide open around the Handpiece (`labFx.jaw(m)`, sized by `jawK()` so its mouth is wider than the medallion: on a phone its back teeth go off the sides); its mouth glows purple and dust and stars stream in (`labFx.pull`, `labFx.suck`, particles that end at the mouth); the Handpiece shivers and is sucked in (`shj-suck`), then the canvas draws it inside the mouth behind the teeth (`labFx.swallow`, the medallion as an image from `shRanks.artOf`); the jaws snap shut (`close()`: a flash along the bite, a ring, the canvas shakes, 90 metal shards and Dark Matter sparks spray from the corners of the mouth); two chews with crumbs (`chew()`), a gulp (`gulp()`), and it folds into the ModuPro medallion (`morph()`) as the sim lab's light comes on. The reward box is unchanged (+20,000 crowns, the Handpiece's trophy, "Collect 20,000 crowns"); Skip, Esc and reduced motion as before. Gone with the old version: the spin-up to 400,000 RPM (the counter and the whirl), the lunge and the rush of light, the teeth flying into place, and their styles and code. About page, the design page's caption, Ask Timmy's site help, the site changelog line.
- **2026-11-20 (The Loupes hand-off: the headlight's sunbeam, Claude Code)** — Sam: "a unique one for reaching loops [the Loupes] ... turning on the light of the loupes acts like some kind of sunbeam and like destroys the Maju Pro [the ModuPro], and then the loupes take its place". Finishing the ModuPro now plays its own scene in `widget/journeys.js` (`loupes()`, `lpHTML()`, `.shj-lp`), about 9 seconds to its button, in place of the shared hand-off (`handoffHTML` and `placeFly` are gone, with their styles): the Dark Matter III ModuPro under its nebula; the loupes, drawn big from the kit's own drawing (`lpSvg()`, `SH_JOURNEY_ART.shape(2)`, in polished metal), come down over it; the headlight clicks on and flickers, the lenses catch it; a thin beam (`.shj-sun`, a child of the loupes so it moves with them) grows into a sunbeam with rays in it while the screen dims around it and dust turns in the light (`labFx.motes`); the ModuPro trembles, goes white-hot (`.shj-heat`), cracks (`crackSvg()`) and throws embers (`labFx.embers`), then burns away (`labFx.burn`: embers drawn as sparks and dark ash with glowing edges, pulled up into the light; a warm flash, shock waves, the screen shakes) and the ModuPro's nebula gives way to the Loupes' sky; the loupes come down into its place, turned and sized as the medallion draws them, and the Loupes medallion forms around them, a glint across each lens. Until it rises the stage is scaled up to fill the screen (`--zoom`, at most 1.6; the caption keeps its own size), and nothing scrolls while the waves and the beam reach past the screen (the sky's slow zoom is clipped in `.shj-bg`). Then the reward box as before: +30,000 crowns, the "ModuPro finished" trophy, "Collect 30,000 crowns"; Skip goes to the last frame, Esc closes, reduced motion gets the last frame. The canvas is in front of the scene until the words start, then behind them, so the coins fall behind the text as in the other scenes. The Dark Matter unlock already played on every journey (`trackJourney` in `widget/ranks.js`, once per journey, `dark_seen`); unchanged. About page, the design page's caption, Ask Timmy's site help, the site changelog.
- **2026-11-20 (The ModuPro hand-off redrawn, and crowns for reaching a journey, Claude Code)** — Sam, of the first cut below: "the modupro animation with the pink gingiva and all looks bad. the model is inaccurate. the teeth are not anatomic, the molars look like they are spiky and not cusps. i also dont like the screen shatter", then "10,000 crowns for reaching modupro", then "we can upp modupro to 20,000 and then loupes to 30,000". In `widget/journeys.js`: no more crack and shatter: at `--imp` the handpiece lunges at the screen, the space behind it zooms away and `labFx.rush()` throws streaks of light out from the middle, faster and faster, and at `--arr` the sim lab comes in (`is-lab`, its light after it). The typodont is `TYPO`: Wheeler's crown sizes and facial outlines (copied from `widget/cases.js`'s `crownMM`, the Patient Box kit), each tooth set between its contact points on an average maxillary or mandibular arch and projected from 26 cm in front, so the back teeth turn away and narrow as in a frontal photograph; a turned-away tooth's cusps are flattened in proportion (`face`), which is what made the first cut's molars spikes; 32 teeth, a Class I bite with 2.5 mm of overbite in front and the curve of Spee; the gum follows each cervical line with a papilla in every embrasure, root bulges over the front teeth and shadowed ends, on two plates. Before they land, every tooth's outline glows on the empty gum like a blueprint (`slot`), then the teeth fly in, the bite, the fold into the medallion as before. The reward: `paying()` gives both hand-offs (the ModuPro's and the Loupes', which keeps its scene) the Dark Matter unlock's reward box, the crowns counted up with a fountain and a rain of coins and the finished journey's trophy, and a gold "Collect 20,000 crowns" / "Collect 30,000 crowns"; Skip on the Loupes' hand-off now goes to its last frame too. On a 568 px-tall phone the line and the trophy's row make room so the frame fits. `migration_v89.sql` (**applied live 2026-11-20 at about 7 am Central**, before the merge, through the connector in one call, md5-checked before and after; `supabase/schema.sql` has it) adds `sh_prizes()`'s `modupro` 20,000 and `loupes` 30,000 and the wallet's terms (gtier 7 and 14, once each, crowns only, back pay), `widget/v3.js`'s PRIZES, and `tools/release/xp.js` checks both. About page, the design page's caption, Ask Timmy's site help.
- **2026-11-20 (The hand-off to the ModuPro, its own scene, Claude Code)** — Sam, after the new Dark Matter unlock: "looks good. now we just need something absolutely bananas when you rank up to modupro. completely unique and epic". `widget/journeys.js`'s `handoff()` plays `modupro()` for `to: 1` (the Loupes keep the hand-off of 2026-11-12), about 9 s to its button: the Dark Matter III Handpiece spins up (an RPM counter 0 to 400,000, a whirl faster and faster, grinding sparks off its head, a growing tremble), lunges at the screen, the glass cracks from where it hit (`--imp`) and shatters into falling shards (`--brk`), revealing the sim lab under its overhead light; the typodont's base and gums slide in, its 28 teeth (front view, incisors to second molars, drawn from four crown shapes) fly in from everywhere and snap into their arches, the jaws bite down (`--chomp`: a flare along the bite, sparks, a quake), and the typodont folds into the ModuPro medallion (`--slam`), which rises to its place (`--rise`); then the road, "The ModuPro is yours." word by word, the seven new ranks and the trophy, as before. The moving parts are one canvas (`labFx`). Skip jumps to the last frame; Esc closes; reduced motion gets the last frame; `still("handoff", { to: 1 })` (the design page) is the new one. About page and the design page's caption updated.
- **2026-11-20 (The Dark Matter unlock, redrawn, and 5,000 crowns for reaching it, Claude Code)** — Sam, after watching the old scene: "these feel too similar to any other rank. lets make it significantly more epic and rewarding feeling. also reaching dark matter gets you 5000 crowns. be sure to put that on the rank up screen". `widget/journeys.js`'s Dark Matter unlock is a new scene, about 8.5 s to its button: dust streams into the Diamond III medallion and a disk spins up around it, rings close in, it trembles harder and collapses into a point, a beat of dark, then a detonation (flash, three shock waves, a quake, the journey's sky, rays, the Dark Matter medallion slamming in and rising from the middle of the screen to its place, a slow ring of light around it), "Dark Matter" letter by letter with one sheen, and the reward: **+5,000 Shiny Gold Crowns** counted up with a fountain and a rain of coins, the Handpiece's two Legendary pieces for Timmy's place, the class position when the profile has it (`widget/ranks.js` passes it), and "Collect 5,000 crowns" (the coin flies up as it closes). The moving light is one canvas (`cosmos()`), the rest transform and opacity. Skip now jumps to the last frame (the reward stays); Esc still closes; reduced motion gets the last frame. Fixed with it: in the still frame the rays and glow painted over the medallion (it lost its transform; now positioned). **`migration_v89.sql`** (applied live 2026-11-20, see above): `sh_wallet` adds 5,000 for each journey's Dark Matter reached (gtier 6, 13, 20), from the first XP, so it is back pay for anyone already there; `sh_prizes()` has `dark` and `widget/v3.js`'s `PRIZES` its copy; `tools/release/xp.js` tests it. About page, the design page's caption and Ask Timmy's site help updated.
- **2026-11-20 (CI upkeep: After merge's canceled runs, Node 24 actions, the About page's a11y, Claude Code)** — **After merge** no longer drops a push whose run was canceled while waiting (three merges close together): a push run starts where the last push run that wasn't canceled ended (`--since-last-run`, `coverFrom()` in `tools/after-merge/run.js`, `actions: read`; 10 new cases in `tools/after-merge/test.js`; checked on the real history, run 97 would have covered #467's canceled run 96) ([after-a-merge](vault/how-to/after-a-merge.md), "Merges close together"). Every workflow's actions moved off Node 20: `actions/checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `github-script@v9` (their scripts use only `github.rest` and `github.paginate`, which v9 keeps). `tools/release/a11y.js` checks the About page in dark mode and at 390 px with the spoilers shown (axe, the keyboard, motion), both at 0 in the baseline. Nothing students see.
- **2026-11-20 (The admin page's first read of a new key no longer times out, Claude Code)** — the inbox's "An admin read
  the kept copies don't have yet still times out" ([#495](https://github.com/smcmurry6-source/study-hubs/pull/495)). `migration_v90.sql` (**applied live 2026-11-20 at about 6:35 am Central** through the connector, md5-checked before and after; `supabase/schema.sql` has it; v89 is #492's):
  `sh_admin_cached` no longer works a read out inline when `admin_cache` has no row for it (live, insights 4.1 s, Perio's
  question health 3.6 s, over a visitor's 3 s, and the error rolled the new row back so the job never saw it): it inserts
  the row empty for `sh-admin-cache`, the admin functions answer `{"pending": true}` (or no rows) and
  `get_admin_cache_status` says `pending`. `review/index.html` says "Being worked out" under the view's title (Insights and
  Question health in the view too) and redraws when it has come. `tools/release/admin-ops.js` checks it (a first read slower
  than the limit answers at once); the preview gets a `pending` setting ([preview-a-change](vault/how-to/preview-a-change.md)).
- **2026-11-20 (No more plain dark toasts: every message is a sticker, Claude Code)** — Sam: "it still seems like there are a lot of boring black plain toasts. lets fix all the remaining ones". **`widget/toast.js`** (`window.shToast(msg, kind | { kind, title, icon, ms, sticky, action })`, run first in `hub.bundle.js` and `dash.bundle.js`, after `hub-art.js`) draws every short message as a sticker in the gold reward card's family (`widget/prize.js`): a white card with the ink outline and drop, a round badge with the kind's icon and color, a small heading, the words, and a bar that runs down while it stays (longer for longer words, 3.2-7 s); a tap closes it, a mouse over it holds it, the same words tapped twice restart the one already up, at most three at once. Kinds: tip, wait ("One moment"), err ("Oops"), sync, ok, notes, focus, achv ("Achievement unlocked") and streak ("On a roll", with a sunburst and shine), nuke, egg, hi ("Welcome back"), timmy, update (stays, with a Reload button), info; a message without one is guessed from its words (a hub's `arcade.js` passes none). On a laptop the toasts move up above a reward card that's up, on a phone down under it (`--hxt-lift`), still under the bar on a phone (BUG-126). Still with reduced motion or Answer animations off (`hx-still`): a fade, no bar. Styles: `.hx-toast` in `widget/hub.css`, dark mode included. **Moved onto it:** every `toast()` in `widget/hub.js`, `widget/dash.js`, `widget/hub-rewards.js` (an achievement), `widget/guide.js` and `widget/hub-timmy.js`, each with its kind; `widget/v3.js`'s `showStreakToast` (the 5-in-a-row cheer, Tactical nuke ready, Welcome back, now "Good to see you, Sam.") and its "This hub has been updated." bar; the dashboard's "A newer version of the hubs is live." pill (`.dx-update` gone from `widget/dash.css`); `widget/pet.js`'s "Timmy is off". The dark pill and bar stay in `v3.css` and `pet.js` only for a page without `toast.js`. **Also:** the XP flight after an answer (`.xpfly`) is a white sticker chip now, not a dark pill, and the tour's "No problem, the tour is right here" note (`widget/tour.js`) is a sticker with the tour icon. Untouched: the easter eggs' toasts (`widget/eggs.js`, already white cards with their own art) and the gold reward card. `node tools/release/perf.js --page index.html`: the dashboard 338 → 342 KB of its 346.
- **2026-11-20 (A survey asks each person once, not each device, Claude Code)** — Sam: "Surveys are asking once per device", then "Once per person". `migration_v88.sql` (**applied live 2026-11-20 at about 5 am Central**, right after the merge, as v88a-d through the connector, one statement each; the live bodies md5-checked against the file. After it, a new device is still asked, none of survey 4's 65 respondents is, and none of the 38 ids left behind by Link my devices is: before it, all 38 would have been, though none is still in use): `get_active_survey` (the pop-up, the bootstrap's `survey_popup`) and `get_my_survey` (the Inbox, `survey`) look across the person (the id that remains in `visitor_links` and every id linked to it) instead of the one id asking, in PL/pgSQL. Link my devices already moved a device's rows and gave it the remaining id, so the gap was a device still on an id linked away from, and rows written under one. Devices never linked are still two people to the server, so the dashboard's survey pop-up has a line under Send: "Already answered it on another device? Link this device and it won't ask again" (`widget/dash.js`, `.survey-link` in `widget/dash.css`): it closes the window without recording anything and opens Link my devices (`link:open=survey`). On survey 4, read 2026-11-20 at 4 am: 65 rows (30 answers, 35 Laters), none of them two rows for one linked person. `tools/release/xp.js` 14c: 14 checks (a new device asked, a linked device on the old id not, an answer or a Later under an alias id, the Inbox until an answer). About page (Surveys), event taxonomy.
- **2026-11-20 (Review of Systems: High yield, not exam hints, Claude Code)** — Sam: "exam hints for old exams are not exam hints for review of systems", "they do indicate higher yield content, however", then "Everything" when asked how far. A hub whose quotes and predicted topics come from the courses it reviews sets `"hintsFrom": "courses"` in `core.json` (Review of Systems does): `widget/hub.js` (`courses()`, `hintsName()`, `likelyName()`) says **High-yield points** for Exam hints (Home's link, More's tile and page title, the search group) and **Highest-yield topics** for Most likely questions; `widget/hub-bank.js` says **High yield** for High likelihood (the Only toggle, filter tags, the card's tag and its why: "it tests a topic its course stressed", "What it rests on, in its course"); High yield's intro says "Only what the courses stressed most"; `widget/ask.js`'s starter asks "What's highest yield here?"; and Ask Timmy's server labels them the same and is told they don't predict the mocks (`supabase/functions/timmy/core.js`). The hub's `SH_HUB.hints` words and banner say where they come from. Other hubs are unchanged. `exportSections()` keeps "Exam hints" and the caller renames it, because `tools/timmy/test.mjs` runs that function alone.
- **2026-11-20 (The database pass's phase 3 applied live, and its readout, Claude Code)** — `migration_v84.sql` (the bootstrap and the sync send only the answers the device doesn't have; Timmy's days read one day) applied at about 2:40 am Central through the connector, md5-checked before and after, the API answering as before; `supabase/schema.sql` has it. The readout of Heme & Endo Exam 3's eve (6-10 pm Central): 21,648 requests, the answer save 31% of the database's time at 45 ms a call (55% at 106 ms before the pass), 3 failed saves of 4,706, all in one minute of a CPU stall; the database 353 MB, `xp_seen` 33 MB. The optimization pass is done: [its note](vault/tasks/done/2026-11-18-database-optimization-pass.md).
- **2026-11-20 (migration_v83 applied live: the admin page's heavy reads worked out ahead, Claude Code, [#487](https://github.com/smcmurry6-source/study-hubs/pull/487))** — #456's migration went in at 1:35 to 1:47 am Central, one statement a call through the connector, with the class quiet and no failed request; all 24 functions it writes match a throwaway copy (md5), pg_cron's `sh-admin-cache` runs every minute, and a visitor can't reach the table, the helpers or the tick. 15 reads kept (Insights' three, question health for Heme & Endo Exam 3 and Perio, visitors, clicks and features for 7, 30 and 90 days, check-ins). Live, working them out takes several times what the copy said (insights 4.1 s, Perio's question health 3.6 s, clicks up to 3.2 s), so the kept copies matter more than measured; a read the table doesn't have yet still times out (inbox). `supabase/schema.sql` has v83; v84 went in after it the same night (#488). Notes: `vault/tasks/done/2026-11-18-database-load.md` (Log), `vault/reference/admin-operations.md`, `tools/lessons-refresh.md`.
- **2026-11-20 (The study guide folds too, Claude Code)** — Sam: "yes make the study guide fold too". Heme & Endo Exam 3's study guide page (`#notes/guide`, `widget/guide.js`) folds each item, the "Also stressed in class" ones and Key terms, under its lecture, with Collapse all in its toolbar (kept as `guide/<lecture>` in `sh_fold:<hub>`). `widget/hub.js`'s fold is now `foldParts(parts, el, stop)`, shared through `HX` (`foldBtn`, `foldParts`); a topic's body stops at the guide's Practice buttons (`.gd-acts`). Its readable text is unchanged, so `guide.mp3` still matches. Fixed with it: search's Key terms results jumped to the first "Also stressed in class" heading (`exportSections` counted only the items before Key terms); `SH_GOTO` now opens the item it lands on.
- **2026-11-20 (Topics in the notes fold, Claude Code)** — Sam: "make the individual topics collapsible in the notes". In every hub on the engine, each top-level heading of a lecture's notes (As taught's and Plain English's `h4`s, High yield's numbered `h3`s with their why line) gets a button laid over it that folds its topic, down to the next heading, and the toolbar's **Collapse all** / **Expand all** turns the lecture into a list of its topics (`foldTopics()` in `widget/hub.js`, styles in `widget/hub.css`; a lecture with fewer than two topics doesn't fold). The heading's words stay put and the button has none (`data-sh-noread`), so highlights (keyed on the notes' text, checked unchanged), Follow along and the device's voice read the same words. A folded body is `hidden="until-found"` (find-in-page opens it where the browser has it; `hub.css`'s `.hx [hidden]` rule is lifted for it only there, `.nt-find`); `SH_GOTO` (search, Ask Timmy, Open this in the notes) opens the topic it lands in, Follow along opens one when the reader is following or seeks into it, and the device's voice opens it as it reads (`widget/v3.js` sends `sh:reveal`). `placeFigs()` looks inside topics. What's folded is kept on the device (`sh_fold:<hub>`, by lecture and heading, so As taught and Plain English share it); only the buttons save. Events `notes:fold`, `notes:unfold`, `notes:fold-all`, `notes:unfold-all` ([event-taxonomy](vault/reference/event-taxonomy.md)); About page's Notes entry. The study guide page (`widget/guide.js`) doesn't fold.
- **2026-11-20 (Rule: nothing a professor said you don't need, in the notes either, Claude Code)** — Sam: "dont include anything that was deemphasized or we were told not to worry about", then "make it a rule for every hub". `vault/rules/dont-ask-what-professors-skip.md` now covers the notes as well as the questions: no level, cram line, table or High likelihood topic teaches a point the professor said to skip, and it isn't used as a wrong choice or in a why. The `deemphasize` Exam Hint ("skip this, know that") stays (Sam: "Keep the hints"). A classmate's or an earlier class's "not on the test" is a lead to ask Sam about. From 2026-11-20 on: Heme & Endo Exam 3 keeps its marked asides until it archives (Sam: "Rule from now on"); Review of Systems was built to it. `CLAUDE.md`'s feature-rule line, `hubs/CLAUDE.md`, home and the podcast skill point at it ([decisions](vault/decisions.md)).
- **2026-11-20 (The Review of Systems hub, and Ask Timmy on the smaller model, Claude Code)** — Sam: "please go through all materials ... keep notes very high yield with a section for each course tested and then sub sections to make it more manageable". `hubs/review-of-systems/` is a new hub on the engine for DENT 2165's two 200-question mock boards (Thu Dec 3 and Thu Dec 10): 14 courses in 70 parts, 1,126 board-style questions (every choice with its why, the special formats per course), 316 High likelihood topics, notes As taught and in Plain English, a cram list and review tables per course; no narration, figures or arcade ([the task](vault/tasks/done/2026-11-19-review-of-systems-hub.md), [hub note](vault/hubs/review-of-systems.md)). **Engine:** `core.json` `groups` puts a hub's parts under their courses (notes list, Home's progress, the bank's lecture picker, whose course row picks all its parts); Home counts down two exams in turn (`SH_HUB.home.byExam`); lecture badges widen for labels like HN-1 (`widget/hub.css`). **Ask Timmy runs on Haiku** (Sam: "we can switch timmy to run on haiku"): this hub's content is about 180k tokens, so `supabase/functions/timmy/core.js` `MODEL` changed, `withModel()` leaves out the fallback and betas Haiku doesn't take, `PRICES` has its rates and the test's size guard is 200k; Sam: "dont worry about testing haiku, just switch timmy to it". Sam's calls from the build (2026-11-20): everything kept but the order of the teeth most often missing after third molars, and nothing the professors de-emphasized in the notes ([decisions](vault/decisions.md)). Its perf budget is set from its size (about 2.5 times a usual hub's questions).
- **2026-11-20 (Heme & Endo Exam 3: the study guide filter without the repeats, Claude Code)** — Sam: "theres still a ton of questions in the study guide high likelihood questions. can we make it higher yield with less redundant questions". Each of the 57 study guide topics in `hubs/heme-endo-exam3/content/core.json` gets `picks`, the questions that ask each point it names once (a numbered, which-statement or EXCEPT item where it covers several; a true/false, case or second wording of a point already asked comes out), and the bank's **On the study guide** toggle and the study guide page's Practice buttons use them: 209 → 115 (L17 15, L18 22, L19 22, L20 27, L21 14, L22 15). `lkBasis()` in `widget/hub-bank.js` reads `t.picks || t.ids`; `tools/hub-next/build.mjs` fails a pick outside its topic's ids and leaves `picks` out of each question's `likely`, so `questions.json`, High likelihood (284) and High yield (and its narration) don't change. Bundles rebuilt.
- **2026-11-20 (Heme & Endo Exam 3: an "On the study guide" filter, Claude Code)** — Sam: "make a filter for heme and endo exam 3 questions that is only the high likelihood questions from the study guide". The Question Bank's **Only** row has a second toggle, **On the study guide**: the questions listed in a `likelyTopics` entry whose `basis` names "study guide" (209 questions, L17 28, L18 42, L19 39, L20 43, L21 30, L22 27; Lecture A has none). The engine's hub toggles (`SH_HUB.bank.only`, `[key, label, spec]`) take a new spec, `{ basis: "..." }`, worked out from `core.json`'s topics on the page (`lkBasis()` in `widget/hub-bank.js`, also `HX.lkBasis`), so no question JSON changed and no answer keys need loading. The study guide page (`widget/guide.js`) gets a **Practice all 209 study guide questions** button under its lecture chips, and each lecture's Practice button there now opens that lecture's study guide questions (`data-lqlk="<toggle>"`, read by `wireLecLinks()` in `widget/hub.js`; tracked `notes:practice-guide`, `notes:practice-guide-all`, `bank:show=guide`). Bundles rebuilt.
- **2026-11-19 ("Is this your other device?" fixed, BUG-193, Claude Code)** — Sam asked who had a custom name (19 names on 24 devices), then to reprompt the ones on more than one device. The card already asked them every few days, so the data said why it wasn't working: some were asked many times about a device nobody had opened in a month, and some tapped Yes again and again without linking, because the Yes screen said "when this card shows up there, tap Yes and type this code": it shows up there a day later, after the code's 10 minutes, and Yes there makes a new code. Sam: "do 1 and 2, skip the notice". `migration_v87.sql`: `name_shared` (and so the v2 bootstrap's `name_shared`) needs the other device, or the person it's linked to, to have a visit in the last 21 days; PL/pgSQL. `widget/linkask.js`: the Yes screen says to type the code on the other device now (Settings, Link my devices), with a line that a home-screen app should type the code rather than open the link (on an iPhone it keeps its own storage, apart from Safari); the first screen has a "Have a code from your other device?" box; Escape closes the card from anywhere on the page. Link my devices' card has the same home-screen line. About page (both entries), `site.json`, `rest.bundle.js`. Tests: `tools/release/xp.js` section 8a. **v87 applied live at the merge** (about 6 pm Central, through the connector, md5-checked; in `supabase/schema.sql`).
- **2026-11-19 (The six old single-file hub pages come down, Claude Code)** — Sam: "lets go ahead and take down all old pages. that should make things run a bit better". `hubs/heme-endo-exam1/` (its page and painted case images), `hubs/heme-endo-exam2/`, `hubs/msk-exam3/`, `hubs/msk-exam4/`, `hubs/pcd-exam3/` and `hubs/pcd-implants-exam1/` are removed, with `assets/og-heme-endo-exam1.png`, `og-msk-exam3.png`, `og-msk-exam4.png` and `og-pcd-exam3.png`: about 6 MB off every publish, and no hub on the site is an old single-file page any more (Heme & Endo Exam 3, on the engine, is the only hub up). All six were archived, with their retrospectives, recaps and audio already done, and none was in `sw.js`'s `HUBS`, so the dashboard (which links only live hubs) and the service worker are unchanged. Their About entries came off (Older hubs, the Feedback Loop, Osseo and Exam 2 arcade columns, the MSK and PCD nine-games line, their diagrams, Heme & Endo Exam 1's painted patient pictures and High Likelihood paragraph, Heme & Endo Exam 2's Exam 1 Refresher), and the lines that named PCD Implants as an example now name Heme & Endo Exam 3; Ask Timmy's site help rebuilt. Their perf budget lines are gone. Their `hubs.js` entries (and `legacy`), `tools/question-ids/`, art, figure kits and podcast scripts stay; each hub note says which commit still has its page (`a897c0c`) and the repo map how to dump its bank from it. The shared-code cleanup the old pages held up (the `NEW` gates, the old cards, `rpc2` fallbacks) is next, in its own PR (the inbox).
- **2026-11-19 (Charts: Cover the answers, Claude Code)** — Sam: "yes to the table cover button too" (a survey answer had asked to "hide the answers in the charts"). Every chart section the engine draws as a table or as cards (`sectionHTML` in `widget/hub.js`: a lecture's "Charts for this lecture" and More, Side by side) has a **Cover the answers** button beside its title. Pressed, every cell but a row's first (a table's `td`, a card's `dd`) keeps its size with its words hidden (`visibility`, so from screen readers too) under a **Show** button that reveals that one (from the keyboard, focus goes on to the next); the button becomes **Show all**, and after the last Show it is Cover the answers again (`coverSection`, one click listener on the document). Fixed `data-rvcover` and `data-rvpeek` values, so click counts never hold a cell's words. CSS in `widget/hub.css` (`.rv-head`, `.rv-cover`, `.rv-hid`, `.rv-peek`); bundles rebuilt; About page (Notes) and Ask Timmy's site help. Old single-file hubs don't have it (they don't draw charts with the engine).
- **2026-11-19 (Lessons refresh, the Heme & Endo Exam 3 eve; test runs out of the class's data, Claude Code)** — Sam: "lessons audit". Read at 4:40-6 pm Central, the evening before Exam 3. (1) **Four explanations** in `hubs/heme-endo-exam3/content/questions.json` now answer the class's favorite wrong pick: `ea-tf-ratio` (cypionate is the slow-release depot: it changes how long testosterone lasts, not its anabolic-to-androgenic ratio), `pg-no-milk` (dopamine comes from the hypothalamus, and prolactin is already rising, so progesterone blocks its action in the breast), `ea-tf-proscar` (two brand names, one drug) and `dc-acro` (report #67: why a 47-year-old man fits acromegaly), with their whys; ids, keys and choices unchanged, so the class's picks stay right. Every key question health flagged (12, on 8-13 first tries) was read against the notes and is right; with Sam's yes, `ea-tf-proscar`'s stem now asks whether Proscar and Propecia "have different active ingredients" (it said "are two different drugs", true as two products; key and choices unchanged). (2) **BUG-192**: since #459 that morning, a closing test page's keepalive flush skipped Playwright's routing, so every CI and local run of `tools/ci/smoke.js` (which hides `navigator.webdriver`) wrote its game-layer check into Heme & Endo Exam 3's live clicks, events and question health (68 made-up visitors by 5 pm). `tools/ci/no-leaks.js` answers, inside the page, what it sends once it is really leaving (every context in `smoke.js` and `quiet.js`), and `tools/data-fixes/2026-11-19-test-runs.sql` (After merge) removes the rows; [verify-before-pushing](vault/how-to/verify-before-pushing.md) has the rule. (3) `LESSONS.md`: Live signals rewritten (the eve, the economy read again: unchanged, Sam's "prices are good" stands), the Perio final's 9 check-ins and the Occlusion final's 36 in their retrospectives, a standing lesson from #67.
- **2026-11-19 (Older exam check-ins closed, on the page and on the server, Claude Code)** — Sam: "close all current check ins
  except for perio and occlusion final. no one should be able to submit for any older exams" (the data showed check-ins still
  coming in for the Occlusion midterm and Heme & Endo Exam 2 that hour). `checkinClosed:true` in `hubs.js` on Heme & Endo Exam 2,
  the Occlusion midterm and Heme & Endo Exam 1 (already past its `checkinUntil`), so `pastExams()` in `widget/dash.js` leaves them
  out of Past hubs and the pop-up. **The server refuses them too** (`migration_v86.sql`, applied live at about 2 pm Central, ahead
  of the pending v83 to v85; written as v85 and renumbered when #469's Ask Timmy cache took that number): `exam_checkins_closed` (hub, exam date; closed to anon) lists the closed ones, and
  `sh_submit_exam_debrief` answers `{ok: false, closed: true}` for one before anything is saved or paid; the dashboard then says
  "This check-in is closed." instead of "try again". The After merge workflow keeps the table equal to `hubs.js` (its new
  `checkins` step, whenever a push changes `hubs.js`), so closing or reopening a check-in is still only `checkinClosed`. Still
  open: the Perio final and the Occlusion final; Heme & Endo Exam 3's opens on exam day (Fri 11-20, 10 am). Check-ins already sent
  stay on `review/` → Check-ins. Tested: `tools/release/xp.js` (a closed check-in is refused, saves and pays nothing) and `rls.js`.
  The rewards already paid for those two stay (Sam: "dont take it back"). Then Sam: "repush the perio check in pop up for
  everyone": the Perio final's pop-up (out since 1 pm, `promptHour: 13`, #464) goes out once more to every device that opened
  it without sending (`askAgain: "2026-11-19"`). Fixed with it in `widget/dash.js`: a device that first saw a check-in after its
  `askAgain` round was set was asked a second time on its next visit; seeing it now counts as the round's showing.
- **2026-11-19 (Perio's page comes down, Claude Code)** — Sam, after the lessons audit: "you can take perio down now. merge when ready". `hubs/perio/` (the page, its content JSON, its A/B wordings, its images) and `assets/og-perio.png` are removed, as Occlusion's were the day before. `hubs.js` archives it at 1 pm that day (`archiveOn`), so the dashboard has no card linking to the missing page before 10 pm, and the final's check-in pop-up goes out from 1 pm (`promptHour: 13`; the exam was that morning). It left `HUBS` in `sw.js` (`sh-v66`, Heme & Endo Exam 3 alone). Its About page entries came off (its mock's format, Stage & Grade, the A/B wordings, its diagrams, its redesign entry, its arcade column), and the lines that named Perio as an example now name the hubs still up; Ask Timmy's site help rebuilt. Its budget line, its figure build in "Check hubs" and Ask Timmy's 41 test cases for it are gone; `tools/release/xp.js` now grades the newest engine hub's real bank (with a made-up ordering and matching item, since Heme & Endo Exam 3 has neither), and `admin-ui.js` and `quiet.js` use Heme & Endo Exam 3's page. Its `hubs.js` entry (the check-ins), `tools/question-ids/perio.txt`, its art, the figure kit and the podcast scripts stay. [The hub note](vault/hubs/perio.md).
- **2026-11-19 (Lessons refresh: the Perio retrospective, Claude Code)** — Sam: "lessons audit. perio is over". Perio's final (cumulative) was that morning, so the audit wrote its retrospective in `LESSONS.md` (both exams: 173 people, 759 h, 53,710 answers; the final's eve the biggest of any hub, 283 h from 87 people), published its recap to the dashboard (`tools/publish-recap.js`, Sam's standing OK; featured `q3-S02`), and took its narration and Timmy Time off the site ([archived-hubs-drop-their-audio](vault/rules/archived-hubs-drop-their-audio.md)): the 28 mp3s and their words files (289 MB; the site 656 → 367 MB), `"audio": "off"` in `hubs/perio/content/core.json` (the build emptied `hyAudio`), and the `podcast`, Listen and Timmy Time out of its `hubs.js` entry, so the dashboard offers no episode before 10 pm. `sw.js` keeps `perio` in `HUBS` until the dashboard archives it (10 pm): `tools/ci/syntax.js` fails a live engine hub missing from it, so that line is a follow-up ([the task](vault/tasks/done/2026-11-12-audio-off-at-archiving.md)). Live signals and the game economy rewritten (median study day about 1,400 crowns; the median wallet 9,300; 11% of crowns spent; Sam's "prices are good for now" stands). The audit now reads the database's size every run (`tools/lessons-refresh.md` step 1: 323 MB). Heme & Endo Exam 3, the one live hub, had nothing to fix (no reports, no flags yet).
- **2026-11-19 (Mock and game answers that ride out a busy database, Claude Code)** — (1) A mock's or an arcade game's
  answers go at once and try twice more (4 and 10 s); when all three failed in a busy minute they were lost, and with them
  the mock's score, its +50 and their XP. Now `widget/v3.js` puts such an answer in the answer line with its session (8 tries,
  kept on the device when the page is hidden or they run out), and `finishSession` holds the finish behind it in the same
  line (`sessionHold`; it answers `{ ok: true, held: true }`, so `widget/games.js` doesn't also send the score the old way),
  kept on the device with the answers, so the hub's next page sends the answers, then the finish. The page that sends it says
  what it paid (`sh:session-paid` now carries `kind` and `game`; `widget/hub-rewards.js` names a game it never ran).
  (2) With the bootstrap timed out, Timmy Time's minutes (`widget/podcast.js`) weren't counted, Timmy's HP days
  (`widget/pet.js`) left out the snacks' HP and the Inbox (`widget/replies.js`) the idea board's notes until the first
  answer's reply: they ask `shGame.live()` now (a hub passes the Inbox its `v2`, it passed none; the dashboard passes `V2 !==
  false` to both), and the last two fall back to today's call when the v2 one is missing. `tools/ci/quiet.js` checks both
  (`mock()`, `timedOut()`). About page ("What the hubs record") and Ask Timmy's site help updated; bundles rebuilt.
- **2026-11-19 (Heme & Endo Exam 3: High Likelihood made higher yield, Claude Code)** — Sam: "There are a lot of high
  likelihood questions ... make sure that those need to be high likelihood and see if we can make it a little bit higher
  yield." 410 of 460 questions were tagged, so the tag no longer picked anything out. Every topic was read against Dr.
  Herr's study guide and the recorded hints: each guide item and each hint keeps its topic, and a question stays tagged only
  when it tests what the item or hint names. 108 questions on details neither names came off the tag (a slide's number or
  name, a side fact, a second question on the same point, a key that rests on a content flag), and five topics resting on
  neither came off whole (L17 capacitation and maternal hormones, L19 splenic sinuses and MALT and tonsils, L20 plasma cell
  neoplasms): 410 → 284 High Likelihood, 86 → 81 topics, 42 topic titles trimmed to what stays. No question was edited or
  retired; Lecture A is unchanged (Sam: "lecture a shouldnt be ranked lower"). The mock (no `likelyShare` here) is
  unchanged. High yield, built from the topics, is shorter for L17-L22 and was recorded again (`<lec>-hy.mp3`). Decision
  and the rule for new questions: `vault/decisions.md`, `vault/hubs/heme-endo-exam3.md`.
- **2026-11-19 (Ask Timmy: "What should I study tonight?" from the server, and a cheaper first question, Claude Code)** —
  On the dashboard, "What should I study tonight?" now also reads the student's own answers from the server
  (`get_my_answers`, one call a live hub, skipped in a quiet spell, 4 s at most), merged with this device's (a question
  keeps whichever copy has more tries), so a new or linked device no longer sees nothing until a hub page has synced
  (`serverSeen`/`withServer` in `widget/ask.js`; the smoke test stubs it). And, Sam's call: the first question on a hub
  after nobody read its whole content for 55 minutes gets **a part of it** (the exam facts, cram sheet, Exam Hints, High
  likelihood topics and the lecture on screen or the answered question's; every other lecture as one line with its title),
  with the site help moved ahead of it so its cache is shared by every hub; when the part doesn't have the answer
  ("not_covered"), he's asked again with the whole content, which is then marked as cached (`timmy_cache`,
  `migration_v85.sql`: one small table, the service role only; applied through the connector right after the merge,
  md5-checked; without it the function sends the whole content, as before). The eval in that mode (`node tools/timmy/eval.mjs --part`, $5.28 for all 50 cases): 49 passed, 34 answered
  from the part, 16 asked again; the one failure was a two-word quote from a table cell on a whole-content answer.
  Also: `tools/timmy/test.mjs` defines the `C` that `exportSections` reads since the study guide (it failed on `main`).
  [Ask Timmy](vault/reference/ask-timmy.md), "Limits and money".
- **2026-11-19 (The dashboard: room under its budget, then the gold reward card, Claude Code, #466)** — Sam's package from the to-do list. **Room:** `widget/ranks.js`'s hub widget (`mount()`: the rank card, hub mastery and the trophy case in Stats, the accent colors, Link my devices) is now `widget/ranks-hub.js`, which `widget/v3.js` loads right after `ranks.js` on a hub only (held in `hub-rest.bundle.js` on the engine, by name on an old single-file page); `ranks.js` hands it what it draws with as `shRanks._hub`. `rest.bundle.js` 131.3 → 125.4 KB gzipped. **One call:** the dashboard's clicks and events go in one `record_analytics` call (migration_v82), as a hub's do: `widget/dash.js` gives `widget/clicks.js` a client that joins its two calls (the two calls again if the function is missing). **The card:** the hubs' gold reward card is `widget/prize.js` (`window.shPrize.show(lines, opts, env)`, its styles inside), run in `hub.bundle.js` ahead of `widget/hub-rewards.js` (which batches and calls it, unchanged to the eye); the dashboard fetches it the first time a prize pays (the daily visit, the leaderboard name, a trophy, a collection) in place of the dark toast: under its bar on a phone, inside Timmy's place when a visit pays there, the stars flying into the crowns; the toast only if the file can't be fetched. `sw.js` precaches it (`sh-v65`). **The toast on a phone:** already at the top since #458 (the rule is in `widget/hub.css`), nothing covers it. `node tools/release/perf.js`: the dashboard 345.4 → 340 KB of 346 (budget unchanged), Perio 877 → 878 KB. Found, on the to-do list: a hub's report-reply pop-up covers the card on a phone.
- **2026-11-19 (The database pass's phase 3: the bootstrap's answers, Claude Code)** — A hub page keeps its answer history on the device (`sh_answers_hist:<hub>` in `widget/v3.js`, the newest 5,000) and sends the bootstrap, and the sync every 3 minutes, the newest answer's id and the count; the server sends only the answers after it (`migration_v84.sql`: `sh_answers_since`, `get_my_answers_since`, two new arguments on `get_widget_bootstrap_v2`), or the whole history when the count doesn't add up (Link my devices). Timmy's days (`get_pet_days`) read the one boundary day by its end too. On a throwaway copy, a heavy student: the bootstrap 14.3 → 6.9 ms, the sync 6.6 → 1.3 ms, Timmy's days 2.1 → 0.1 ms; the same rows (checked old against new). A database without v84 gets asked again without the cursor. Nothing students see changes. `tools/ci/quiet.js`, `tools/release/xp.js` and `rls.js` check it. Applied live at night: [the task](vault/tasks/2026-11-18-database-optimization-pass.md).
- **2026-11-19 (Heme & Endo Exam 3: the study guide made short, with the in-class hints, Claude Code)** — Sam, the evening before the exam: "the study guide is really long. can we combine the study guide with in class exam hints to make it much higher yield". Dr. Herr's study guide page (`#notes/guide`) went from about 14,000 words to about 6,500: each of its 31 items is now a "Said in class" box (short quotes from `study.json`'s hints, `.gd-said`), a short "Know this" and a one-line "Watch for"; the lead paragraphs and most tables went (three stay: L19's organs, L20's translocations, L22's lichens). Each lecture adds `more` sections that aren't on the guide: "Also stressed in class" (L17, L21, L22) and "Said not needed" (all six), and its key terms are one line each. `widget/guide.js` and `tools/hub-next/guide.mjs` draw and speak `guide[].more` after the items; `widget/guide.css` has the new boxes. The recording (`audio/guide.mp3`) was made again from the new text; `SH_HUB.notes.guide`'s wording, the About page's entry and Ask Timmy's site help (`supabase/functions/timmy/site.json`) say what's on it now. Lecture A stays off the page (Sam's call of the same day).
- **2026-11-19 (the admin page's heavy reads worked out ahead, Claude Code, [#456](https://github.com/smcmurry6-source/study-hubs/pull/456))** — the database-load task's first
  box. `migration_v83.sql`: the admin page's slow reads (Insights' three, Question health, the visitor totals, check-ins,
  clicks and features) come from a small table, `admin_cache`, that pg_cron's `sh-admin-cache` job fills one read at a time:
  every 15 minutes while the page is in use, every hour while 20 or more people are studying, at once after an edit or
  Refresh, nightly for a week after, nothing while nobody looks. The functions keep their arguments and results (all 22 reads
  compared exactly on a copy); question health lays today's reviews and reports over the copy. Two lookups got cheaper too
  (`sh_surface` once a section, not once a row: insights 1.05 → 0.43 s, data quality 0.98 → 0.37 s on the copy). The page
  shows when each read was worked out and "newer numbers on the way" after Refresh, and looks again until they come. The
  lessons audit and agents read the kept copies (`tools/lessons-refresh.md`, [admin-operations](vault/reference/admin-operations.md)).
  Applied live at night (the task note's Log).
- **2026-11-19 (Large text: the shop, Ask Timmy, the tour, bowling, and Home's Timmy Time card; BUG-190, BUG-191, Claude Code)** —
  The rest of #462's sweep. Timmy's Shop and an item's sheet (`widget/shop.css`) are sized in % of the screen with a flex
  column that shrinks and scrolls (at 1280 px XX-Large the shop was 1,537 px wide and its Close button off the top). Ask
  Timmy's panel (`widget/ask.css`): % of its fixed box, a one-column footer whose starters wrap (it scrolled 50 px sideways
  at 320 px XX-Large), an intro note that scrolls inside 22% of the panel, no avatar under 260 px. The tour (`widget/tour.js`):
  cards in %, and **positions worked out in screen px and divided by the zoom** (`getBoundingClientRect` is in screen px,
  `style.left` and `offsetWidth` in the zoomed page's px; at a laptop's X-Large the cards landed off the screen). The bowling
  card (`widget/bowling.js`) in %; the update prompt, the reply pop-up's cap, the survey's margin and the notes' lecture list
  off `vw`/`vh`. Home's Timmy Time card (`widget/hub.css`) is a container: a narrow card drops the minutes from "Listen ·
  52 min", gives the title the full width, and shrinks Timmy at X-Large and XX-Large. `tools/ci/smoke.js` opens the shop, an
  item and Ask Timmy at 320 px XX-Large and 375 px X-Large. Also retested BUG-184 to BUG-188, BUG-168, BUG-126 and BUG-009 (done).
- **2026-11-19 (Timmy's place fixes: the front yard, the kit niceties, visiting from a hub's boards, Claude Code)** — Three
  inbox lines. **Front yard**: Timmy at the door is drawn over a tall piece in the front slot (Sam: "draw Timmy on top"):
  `layout()` in `tools/figures/site/place.mjs` keeps the front piece's depth (`frontZ`) and `timmyZ(layout, p)`, used by
  `render()` and by `widget/place.js`'s hops, lifts him over it within 1.3 of the door spot on the ground. **Kit
  niceties**: a yard piece's `move` ({ "": the whole piece, ".tp-spin" or another class: a part }) plays while its egg
  does, and `T.spinner(c, u, v, inner)` draws a part in its own plane under a matrix so a CSS rotate turns it like a real
  wheel (`vector-effect` keeps the strokes): the moon rover rolls out and back with its wheels turning, the satellite dish
  swings to aim, the windmill's wheel and the wagon's wheels turn (their blurs are gone). A scene's own `tree(b, o)`
  replaces `treeKind`: the reef has a coral tree, the lunar plains a plain tree under a glass dome (the night sky keeps its
  crystal tree). `noSnow` on the reef: no snow, snowfall or snowman there in the winter holidays (the lights stay).
  **Visiting from a hub**: `window.shVisitPlace(key)` in `widget/hub-timmy.js` (get_place, then `shPlace.open({ place })`,
  the day's visit bonus through `claim_visit_v2`), and every `button[data-sh-visit]` on a hub's page opens its `data-key`'s
  place; Perio's and Heme & Endo Exam 3's arcades (`content/arcade.js`) read `get_arcade_leaderboard_v2` (the old call when
  it's missing) and draw a classmate's name as that button. The inbox line said the boards were in `widget/v3.js`'s panel;
  that panel has no leaderboards any more, and a hub's own boards are its arcade's.
- **2026-11-19 (The database pass's phase 2 applied live, Claude Code)** — Sam, at noon the day before Heme & Endo Exam 3: "the hubs are quiet right now. go ahead and run the migrations you were waiting on" (4 people on, 2 answers in 10 minutes). Through the connector, one call at a time, 12:10-12:13 pm Central: `migration_v79.sql` (the awards' running totals; no total off from its sum, the three most active students' balances the same), `migration_v80.sql` (`answer_xp` once an answer), `migration_v81.sql` (`drop index concurrently`, then `cluster` of `activity_visits` and `xp_seen`: **the database 349 → 323 MB**, `xp_seen` 53 → 31 MB) and `migration_v82.sql` (`get_class_numbers`, `record_analytics`, `shop_days` with its hourly pg_cron job, the lighter bootstrap, `get_my_answers`, `anon_name`). Every live body md5-checked against its file before and after; no request failed in the edge logs, and the pages took the two new calls within a minute. All four are in `supabase/schema.sql`; `supabase/pending-migrations.txt` lists none. Nothing students see changes. [The task note](vault/tasks/2026-11-18-database-optimization-pass.md) has the numbers.
- **2026-11-19 (Large text on a phone: BUG-184 to BUG-188, Claude Code)** — The text-size setting zooms `<html>`, and inside a zoomed page
  `100vw` and `100vh` are bigger than the screen, so four pop-ups sized that way ran off it at X-Large and XX-Large. The dashboard's More menu is
  at most the top bar's content wide (`100cqw - 4px`, the bar is a container: `widget/dash.css`); Timmy's place's full view is sized in % of the
  screen and its stage in `cqh` of the dialog, now a container, with a two-row header and a smaller "Timmy today" card under 310 px
  (`widget/place.css`), and his speech bubble stays inside the picture (`widget/place.js`); Settings' rows can be
  narrower than 220 px and its button wraps (`widget/hub.css`, Focus mode on a hub's Settings too); the dashboard's dialogs and Timmy's cards
  (`widget/pet.js`) take `max-height: 100%` in place of `calc(100vh - 32px)`, so their Close button is on the screen; the checkup's Show me row
  wraps. Home's Timmy Time card on a phone keeps the XP line out of the notes' column (`.pm-earn`). Default text is unchanged to the pixel.
  `tools/ci/smoke.js` opens the four pop-ups at 320 px XX-Large and 375 px X-Large. Found doing it, logged: BUG-190 (Timmy's Shop and the
  other `vw`/`vh` sizes) and BUG-191 (Home's Timmy Time card at about 900 px puts its Listen button over Timmy).
- **2026-11-19 (The hub bar fits on every laptop, BUG-083, Claude Code)** — Sam: "do the heme and endo bug fix". On Heme & Endo Exam 3 (and Perio) the top bar ran 26-95 px past the screen between 1,101 and about 1,190 px wide, with Search half off and Settings gone, even with the rank pill down to its medallion. `fitPill()` in `widget/hub-rewards.js` now takes two more steps: the hub name folds to its emblem (`.hx-bar.is-cramped`; still read out as the link's name) and the pill gets its XP back if that leaves room; past that, at Large text and up on a laptop (the setting zooms the page, which the 1,100 px breakpoint can't see), the meters move to the strip under the bar as on a tablet (`.hx-bar.no-meters`, `.hx.is-strip` in `widget/hub.css`). It also measures again when the live count changes and when the fonts arrive. Scripted on the preview's made-up data at 1,101-1,920 px and every text size: nothing runs past the screen; below 1,101 px nothing changed. Bundles rebuilt.
- **2026-11-19 (the database optimization pass, phase 2: fewer calls from the page, Claude Code, [#459](https://github.com/smcmurry6-source/study-hubs/pull/459))** — nothing students see
  or earn changes; the pages make fewer requests and the bootstrap does less. `migration_v82.sql` (**pending: apply at
  night after Fri 2026-11-20, 9:30 am**, after #457's v79 to v81, `supabase/pending-migrations.txt`; written as v79, renumbered at the merge): `get_class_numbers` (a card's class numbers,
  `question_stats` and `question_choices`, in one call instead of two REST reads: they were a fifth of every request),
  `record_analytics` (question health's rows, the clicks and the events in one call instead of three), the shop's picks of
  the day stored once for everyone (`shop_days`, filled by pg_cron hourly, cleared by a trigger on `shop_items`),
  `get_widget_bootstrap_v2` built once (it worked out v1's rank, Timmy's days and Inbox and threw them away),
  `get_my_answers` in PL/pgSQL, and `anon_name` by an index on the name's base. The bootstrap 38.7 / 26.9 / 19.4 → 22.5 /
  13.8 / 10.2 ms on a throwaway copy, every value the same. Page side, working with or without the migration (the old
  calls when it's missing): `widget/v3.js` (`classNumbers`, `shAnalytics.send`; `widget/qhealth.js` hands its rows to it,
  and `widget/clicks.js`, unchanged, sends through a client v3.js gives it; the dashboard keeps its two calls, its 345 KB
  page budget had no room), and `shRankLocal` in `widget/v3.js`, which `widget/ranks.js` asks first: the rank and this
  hub's mastery after every tenth answer from the replies and the answers the page holds, reading the server only when
  something it can't count changed (`sh:trophy-sent` from `widget/eggs.js` and the bowling egg, a medal, a new day, the
  100/1,000 answers and 25/100 runs, mocks and games, at least every 50 answers).
  Tested by `tools/release/xp.js` (a new section), `rls.js` (`shop_days` and its helpers closed to anon) and
  `tools/ci/quiet.js` (both ways). [The task](vault/tasks/2026-11-18-database-optimization-pass.md).
- **2026-11-19 (Phone and large-text fixes on the hubs: BUG-168, BUG-126, BUG-009, Claude Code, [#458](https://github.com/smcmurry6-source/study-hubs/pull/458))** — Sam's package of
  three bugs. **Nothing on a hub scrolls sideways on a phone at the largest text** (BUG-168): the text sizes zoom the page,
  so XX-Large on a 320 px phone lays out in 220 px, and the arcade lobby, the Question Bank, Notes, Exam Hints, the cram
  sheet, Stats and Settings all ran past the screen there (Exam Hints and the cram sheet at 320 px at every size). In
  `widget/hub.css` every grid's column minimum is `min(Npx, 100%)` (the lobby's beats each hub's own `arcade.css`), the
  bank's filter panel is one column, a long word breaks instead of running off in a lecture title, Exam Hints' quotes and the
  hint, cram and flow lists (only there: a word a hair too wide elsewhere stays whole), Exam Hints' "Notes" goes under a
  long title, and on a phone a button or chip too long for the screen wraps its words; the Study as buttons drop their icons under 300 px
  and stack under 240 px. In `widget/trophies.css` the Stats gauge's turning rays stop at the board on a narrow phone and
  the badges' words break, and the rank's medal goes above its name in a narrow card. `tools/ci/smoke.js` opens 12 views of each hub on the engine at 320 px with the largest text
  (it opened only Home before). **Toasts on a phone drop in at the top**, under the strip, as the reward card and the
  reply pop-up do (BUG-126): at the bottom they sat under Timmy, his bubble, the streak flame and the Listen player; the
  smoke test checks one is clear. **Small controls** (BUG-009): the four of 11-04 were on the old single-file pages;
  `tools/release/matrix.js` now checks every screen and fails a control under 24x24 px, naming it, and its first run found
  the mastery-medal button beside a name on the dashboard's boards (22x20 at 1920 px), now 24x24 (`widget/ranks.js`).
  Bundles rebuilt. **The dashboard's budget is 346 KB** (was 345, BUG-189): `main` measured 345.40 KB and these rules add
  about 150 bytes gzipped to `widget/site.bundle.css`, which the dashboard loads too; it's the page with the least room.
- **2026-11-19 (the database optimization pass, phase 2: the answer save and its tables, Claude Code, [#457](https://github.com/smcmurry6-source/study-hubs/pull/457))** —
  three migrations, written and tested, **not applied yet** (Sam: nothing live before Heme & Endo Exam 3, the rewrites at night;
  set for Sat 11-21, 1:30 am Central, and listed in `supabase/pending-migrations.txt` until then). `migration_v79.sql`:
  `xp_award_totals`, each student's awards summed by kind, kept by statement-level triggers on `xp_awards`, so the crown
  balance in every answer's reply (`sh_wallet`) reads a row a kind instead of every award; filled in the same transaction
  (63,000 awards live). `migration_v80.sql`: `sh_answer` inserts its `answer_xp` row once, with the reply, instead of an
  insert and an update. `migration_v81.sql`: `activity_visits_last_idx` dropped (every ping's update of its visit was a new
  row and three index entries; the admin page's visitor summary gives the same numbers without it). Then `cluster` of
  `activity_visits` and of `xp_seen` (54.7 MB, about twice what its rows need). On two throwaway copies
  (`tools/release/bench-answers.js`, new, for the next phase): the same replies to 37,630 calls, wallets and rows in every
  table; an answer save 3.81 → 2.19 ms for a heavy student, 2.86 → 2.12 middling, 2.53 → 2.01 light. Nothing students see
  or earn changes. `tools/release/xp.js` checks the totals against the sums; `pg.js` takes extra server settings.
  [The task note](vault/tasks/2026-11-18-database-optimization-pass.md) has the numbers; tonight's readout goes there too.
- **2026-11-19 (The check-in's last question, Claude Code)** — Sam: "Lets change the free response question to just asking what the hub could
  have done better". The exam check-in's text step (`DEBRIEF_QS` in `widget/dash.js`) now asks "What could the hub have done better?" and its box
  has no placeholder (it was "e.g. more on suture types, more EXCEPT questions", from the 2026-10-02 version that asked for topics the hub
  missed). Timmy's line on that step is "What could I have done better?" when the check-in no longer pays. The honor-code note stays, and the
  answer key is still `missed`, so the admin page (its heading now "What the hub could have done better"), `/lessons-audit` and the idea board's tick
  read it as before. About page, Ask Timmy's site help and the lessons-audit skill updated.
- **2026-11-19 (About page accessibility, Claude Code, [#453](https://github.com/smcmurry6-source/study-hubs/pull/453))** — the last three accessibility bugs from
  the release dry run, all on `about/index.html`: BUG-007, the nine contents links at the top turned their focus outline off
  (`nav.toc a:focus-visible{outline:none}`), so a keyboard user couldn't see where they were; they now get the page's ring.
  BUG-006, a table wider than its box (the seasonal bosses' on a laptop, all five on a phone) couldn't be scrolled from the
  keyboard: while it scrolls it is now a named region in the Tab order (`tabindex`, `role="region"`, its `data-label`), set by
  a `ResizeObserver` in the page's script, and one that fits stays out of the Tab order. BUG-002's last part, light mode's
  `--gold` (#8A6417 → #7D5A13) and `--ink-3` (#5F6D78 → #56636E) a shade darker, so the trophy tags and the hidden-spoiler hint on
  the gold note pass AA. The About entry in `tools/release/baselines/a11y.json` is now 0 everywhere. Found while doing it
  (inbox): a11y.js checks the About page only in light mode at 1280 px.
- **2026-11-19 (No more "A miss fixed" bonus, Claude Code)** — Sam asked why "A miss fixed" kept coming up, then: "we can just take out the miss fixed bonus alltogether". It paid +5 XP (doubled by a boost) the first time a question missed on an earlier day was answered right, once per question; since the reward card (2026-11-18) each one was a gold card with confetti, on nearly every right answer in Yesterday's misses, Missed last time and the drill. **`migration_v78.sql`**: `sh_answer` (v72's) no longer pays it; `sh_xp_replay` (v68's) no longer works it out, and drops the three windows only it read; `sh_xp_rebuild` (v54's) keeps the `fix` awards already paid (3,695 XP to 48 people since 11-14, about 0.5% of the game layer's XP) instead of replaying them, so no balance goes down. All three md5-checked against the live bodies; only functions, so any hour. The page drops its label (`widget/hub-rewards.js`, `widget/hub.bundle.js`), the preview's fake server drops it (`tools/preview/runtime/preview.js`), `tools/release/xp.js` checks that it no longer pays and that an old one survives the rebuild (599 checks), and the About page's "More ways to earn XP" and Ask Timmy's site help lose it. The `fix` source stays in `xp_awards`' check for the old rows.
- **2026-11-19 (Heme & Endo Exam 3: L21 and L22 checked against their slides, Claude Code, [#449](https://github.com/smcmurry6-source/study-hubs/pull/449))** — the inbox's last item for the
  hub: Sam put smaller copies of Dr. Dal Zotto's two decks in the Drive folder, so both lectures, written from their recordings
  on 11-18, were compared with every slide. The notes (both levels) gained what only the slides say, marked "the slide":
  bladder cancer's eighth place among deaths, urothelial carcinoma's sites and the low- and high-grade papillary behavior,
  PeIN's 30 vs 2-8 percent, penile carcinoma's numbers, hydrocele, epididymitis and orchitis (mumps), torsion's hemorrhagic
  infarct and the hernia's bowel sounds, cryptorchidism's 3 and 30 percent and its complications, germ cell tumors' risk
  factors and peak, PSA after treatment; CIN1-3, the cervical cancer numbers, serous and clear cell carcinoma, leiomyoma vs
  leiomyosarcoma, vaginal clear cell adenocarcinoma, lichen planus's look and histology, the breast lesions' risk scale and the
  male breast. 23 new questions (`src: "slides"`, L21 75 and L22 72, 460 in the hub), two fixed: `mr-tf-pein30` says
  "HPV-associated", and `fr-tf-ls-only` now asks about lichen simplex chronicus (keyed False), because the slide lists lichen
  planus beside lichen sclerosus for the HPV-independent vulvar carcinoma. Topics, hints, cram, review tables and the study
  guide page follow; the reading-notes and `core.json` notes saying "not checked against the slides" are gone. Narration of
  both lectures (three levels) and the guide recorded again, seven words added to `tools/podcast/lexicon.json`, and Timmy
  Time's lichen lines reworded and the episode rebuilt.
- **2026-11-19 (Perio report #65, Claude Code)** — `q4-L27`'s fourth pair, the one #59 reworded the day before, was read
  as the Phase I re-evaluation itself by a second student ("the re-eval is 4-6 months, not 2 weeks"). The item was right as
  taught (Dr. Kaur: re-evaluate at 4-6 weeks; calculus left then is removed and evaluated again 2 weeks later), so the key
  stays; the row now reads "A second Phase I evaluation, after calculus left at the first one is removed", and the
  explanation and cue say the evaluation itself is at 4-6 weeks, not months. Same id, same key; High yield unchanged.
- **2026-11-19 (the database optimization pass, phase 1, Claude Code, [#444](https://github.com/smcmurry6-source/study-hubs/pull/444))** — Sam's package: measure the optimization
  pass's ideas 1-5 on a throwaway copy and ship the ones worth it; nothing students see or earn changes. Measured with a
  made-up class of 200 (188,000 answers) and `pg_stat_statements` timing every statement inside a call
  ([the task](vault/tasks/2026-11-18-database-optimization-pass.md) has the table). **`migration_v76.sql`**: 60-66% of
  every answer save was the crown balance in its reply, most of it planning: a SQL-language function with its own
  `search_path` is planned again on every call, and the balance called six of them. 18 small functions (`sh_rank`,
  `sh_tier`, `sh_step`, `sh_key`, `sh_xp_mult`, `sh_boost_json`, `sh_time_crowns`, `sh_crowns`, `qh_int`, the
  `record_answer_v2` and `record_card_v2` wrappers and others) are PL/pgSQL with the same bodies; the medal check is
  skipped while under half the hub's bank was ever answered right; `get_hub_mastery` looks up each question's latest
  answer. On the copy an answer goes from 6.9 / 5.7 / 4.8 ms (heavy / middling / light student) to 4.4 / 3.6 / 2.4, a
  question-health batch from 1.9 to 0.75 ms, `get_hub_mastery` from 7.9 to 3.4 ms. **`migration_v77.sql` and
  `widget/v3.js`**: a page's study-time pings go out together once a minute (`record_activity_pings`, each ping saved at
  the time it was counted: the same rows and totals), 58% fewer ping calls; they were 18% of every request. **The
  changelog read** (`widget/v3.js`, `widget/dash.js`): the newest row's time is kept on the device for half an hour and
  shared by every tab, so the "updated" banner asks the database twice an hour a device, not every four minutes a page
  (5% of requests); it now comes up to half an hour after a deploy. Fillfactor wasn't worth it (the hot tables already
  update in place), but `activity_visits` can't, because every ping moves an indexed column: on the to-do list with the
  awards' running totals and the rest of phase 2. `tools/ci/quiet.js` checks the pings and the changelog read on a fake
  database. BUG-181's retest: the evening before the Perio final, 20 of about 11,900 answer saves failed their first try
  (no burst; the page sends each again), against 9 in 10 the afternoon before. **Both migrations applied live** on
  2026-11-19 at about 4:15 am Central, before the merge (through the connector, md5-checked before and after; in
  `supabase/schema.sql`). The ping table's rewrite had run half an hour before (#445: `activity_pings` 179 MB to 31 MB, the
  database 465 MB to 318 MB), and the live `pg_stat_statements` and same-page update numbers are in the task's Log.
- **2026-11-19 (Perio: the implant cases' films read in words, Claude Code)** — a student report on `pc-h1` ("need more info
  from the radiograph, it's just a sketch"). The four implant Patient Box cases (`implant-5`, `-19`, `-30`, `-14` in
  `hubs/perio/content/core.json`, and the folded copies in their 15 questions' `pbox`) gain a row, "Today's film, in words",
  with the bone level below the platform at the mesial and the distal, from each case's `spec`. Keys, ids and High yield unchanged.
- **2026-11-19 (Heme & Endo Exam 3: the study guide narrated with Kokoro, Claude Code)** — Sam: "add kokoro". Dr. Herr's
  study guide page (`#notes/guide`) has its own recording, `hubs/heme-endo-exam3/audio/guide.mp3` with its words file, so Listen
  plays it in the notes' narrator's voice with Follow along and tap-a-word-to-jump. It is spoken from the page's readable part,
  which `tools/hub-next/guide.mjs` writes (each lecture's heading, said "Lecture 17", its items and its key terms; not the badges,
  question counts or buttons). `tools/narrate.py` has a `--level guide` (and reads `data-say`, `<h2>`, `<dt>`/`<dd>`, a power of
  ten, 10<sup>9</sup>/L, as "10 to the ninth per liter", and /µL as "per microliter"). `tools/hub-next/build.mjs` writes
  `notes.json`'s `guideAudio`, true only while the recording was spoken from today's guide (its words file's `h`, as for High
  yield), and `widget/guide.js` offers the recording only then. The smoke test checks the recording against the text and
  compares the page's readable text with `guide.mjs`'s. Follow along's button and wiring are shared helpers in `widget/hub.js`
  (`followBtn`, `wireFollow`). `sw.js` sh-v64. The text-and-audio rule, the narration how-to, the hub note and the About page
  say so.
- **2026-11-18 (lessons refresh, the Perio final's eve, Claude Code)** — `/lessons-audit` again at 7:30 pm Central (the morning's
  was #414). Perio report #62 ("Contradicts other lectures", `q6-T02`): the true/false on Dr. Geurs sometimes skipping initial
  therapy before regeneration (9 of 18 answers had said False) is **retired** (Sam: "it can go"; `q6-T02 retired` in
  `tools/question-ids/perio.txt`, out of `questions.json`, `variants.json` and its High Likelihood topic), so S6's High yield
  changed and was recorded again (`periodontal-regeneration-hy.mp3` and its words file). `q6-L35`'s explanation and why separate the root's sides from a defect's bony walls (15 of
  30 first tries took "3 or more sides" for contained). Report #63 (`q7-P01`, "not enough info in the question"): the case box
  (and `q7-P02`'s, the same #31 case) says the loss is at #31's margin with the apex not involved, which its explanation relied on.
  `LESSONS.md`: Live signals rewritten (Perio's biggest day, 80 people and 205 h by 7:30 pm; the economy over 11-18,
  the first day of #403's rates: 630 crowns an hour, 13% of crowns spent), the later check-ins in the Occlusion and Heme & Endo
  Exam 2 retrospectives, a reports lesson on exception items. Every query under the 5 s limit; `sh_data_quality()` stopped there,
  so it and `qh_report` weren't read (`tools/lessons-refresh.md` step 1, the database-load task, the inbox).
- **2026-11-19 (Heme & Endo Exam 3: Dr. Herr's study guide in Notes, Claude Code)** — Sam: "under notes, make a section for dr
  herrs study guide. have each item as a heading and have [high] yield explainer of everything we need to know about that topic.
  since it skips dr taylors lecture, dont include it". A **study guide page** at `#notes/guide`, first in the notes' lecture list,
  for any hub whose `content/study.json` has a `guide` (one entry per lecture: the guide's items as headings with their
  explainers, then its key terms), with jump buttons per lecture, Listen (the device's voice), Report, the highlighter, and each
  lecture's notes and High likelihood questions at the end of its part. It is drawn by `widget/guide.js` + `widget/guide.css`,
  which `widget/hub.js` fetches the first time Notes opens on a hub with a guide (Sam: "the study guide is only for this
  particular heme test. why is it at the 805 limit": in the shared bundle it had put Occlusion 1 KB over its 800 KB budget; now
  the bundle carries only the loader, about 0.4 KB, and no budget changed; both are precached, `sw.js` sh-v63). Search finds it
  under its own "Study guide" group (`widget/v3.js` `SEARCH_GROUPS`), and Ask Timmy's place is none while it's open
  (`widget/hub-timmy.js`). Exam 3's: 31 items and 35 key terms for L17 to L22, written from the hub's notes and keys; no
  Lecture A. About page entry; bundles and Ask Timmy's site help rebuilt.
- **2026-11-19 (Heme & Endo Exam 3: Timmy Time, Claude Code)** — Sam (11-18): "after you finish, start a new session for
  timmy time". A 52-minute episode (`exam3-review`, 14 chapters): Dr. Taylor's Lecture A, then L17-L22 in order, each of
  L17-L22 opening on Dr. Herr's study guide list word for word, the professors' hints quoted, the "you don't need" remarks,
  then a 29-question lightning round. Written from the hub's own notes, hints, cram and High Likelihood topics only; it steers
  around every content flag in the hub note (the script's header lists them). Lore (Sam's picks): number thirty-one's letter
  about a bump ("That's your cusp"), "a tooth for every baby" is a saying, not physiology, and Timmy has blood too; one lore
  comment (thirty-one's four cusps). 31 words added to `tools/podcast/lexicon.json` (finasteride, dutasteride, tamoxifen,
  raloxifene, ulipristal, levonorgestrel, Sézary, Sjögren, the trophoblasts...). Wired in `content/core.json` `podcast`
  (Home's quick link and More's tile), `hubs.js` (the dashboard) and the About page's episode list. Script
  `tools/podcast/heme-endo-exam3/script.md`; the After merge workflow registers the episode for XP.
- **2026-11-19 (the dashboard's hub card and What's new, Claude Code)** — Sam: "Make the timmy time card a part of the hub
  blast on home dashboard. Make the whats new box take up that space between the hub card and the you and leaderboard
  cards and look super cool, reformat and rework send luck to make space". `widget/dash.js` + `widget/dash.css` (bundles
  rebuilt). **The stage** (the open hub's card) gets a foot, `.dx-dock`: the Timmy Time card is now a strip there (Timmy on
  the air at the left, still animated, Listen at the right), and exam-day luck is a tile beside it (clover, count and
  latest names, Send luck; the exam's name is the title just above, so it isn't repeated); either one alone spans the
  foot. The hub's other exams moved under the countdown. **What's new** (`.dx-wn`, `newsHTML`/`drawNews`) replaces the
  row under the stage (Timmy Time + the About card with its one-line What's new): a box on a night field of the hub's color
  (dark in both themes) with a drawn megaphone, the hub's and the site's latest six changelog lines as paper cards on a
  timeline, newest first (a gold ring on it), each with its time and hub tag on the timeline's line (gold for every hub),
  the first clause bold when it is short, three lines and More for a long one; it scrolls sideways a card at a time
  (arrows on a laptop, swipe on a phone). Then Sam: "make it a bit thinner. its taking up a lot of space": one-line
  header, tags on the line, three-line cards, about 230 px tall on a laptop (it was about 400 in the first draft).
  Then **"redo the send luck button"**: Send luck is a chunky game button (an ink outline, pressed into its shadow when
  tapped, a shine across it, the clover on a gold coin that wiggles now and then), gold with "Luck sent!" once sent, and
  the tile's separate clover circle is gone; on a phone the button takes its own full-width row. And **"do the art too"**:
  exam-day luck's clover is drawn as a sticker (`CLOVER` in `widget/dash.js`: one heart-shaped leaf four times, the ink
  outline under the green, a vein and a shine on each), on the coin, in the burst when you send it, as two small clovers
  and a sparkle bobbing around the button, and as a big faint one in the tile's corner. One drawing reused, so it costs
  about 0.5 KB: the dashboard is at 353,341 of the 353,791 bytes its 345 KB budget allows.
  Changes since this device last saw that hub's box say New, with a count ("3 new since your last visit", "3 new" on a
  phone; `sh_news_seen` in localStorage, per hub; a first visit counts the last day's). The hub's description opens
  from "About this hub" in the box's header.
  Event `news:more` (the arrows) replaces `news:open` ([event-taxonomy](vault/reference/event-taxonomy.md)). The About
  page, the tour's steps and the preview's fixture changelog (five entries now) follow.
  The shared stylesheet's growth (about 1.7 KB gzipped) put Occlusion's archived page at 801 KB of its 800 KB budget on
  CI (800 on `main`); Sam: "occlusion can be retired since the exam has already happened", so `tools/release/perf.js` now
  measures only live hubs, as a11y and the device matrix already did (`--page` still measures an archived one).
  Then Sam: **"we can take the page down"**: **Occlusion's page is off the site** (`hubs/occlusion/`: the page, its content
  JSON and 10 images, 3.5 MB; and `assets/og-occlusion.png`). Its retrospective and recap were done 2026-11-17 and its audio
  was already off. With it: its About page entries (What cusp hits where?, its drawn and interactive diagrams, its arcade
  column, its filters, formats and mock), its budget line, its figure build in "Check hubs" (`tools/figures/occlusion/`
  stays, with nothing to write to), the smoke test's cusp-game checks, and Ask Timmy's 43 eval cases for it (two dashboard
  cases now ask about Heme & Endo Exam 3). `tools/release/xp.js` grades Perio's real bank and `tools/release/admin-ui.js`
  archives Perio by hand instead. Its `hubs.js` entry stays for its check-ins, and its id list, art and podcast scripts stay
  ([hub note](vault/hubs/occlusion.md)).
- **2026-11-19 (Collections, Claude Code)** — Sam: "in the timmy card i want there to be a button where you can view your
  collections of items bought in the shop. holiday collections and other things. you can see your progress and all and
  completing a collection gives 1000 xp and 1000 crowns as a bonus". A **Collections** button in Timmy's place (under
  Customize and Shop, with "2/21"), on the dashboard's You card (beside Timmy's shop) and in a hub's More → Timmy's place
  opens `widget/place.js`'s `openCollections` over the place: the 14 season sets (on sale now first), the 6 year-round
  collections and the 10 rare costumes, each a card with a bar, its 8 (or 10) pieces in their rarity colors (owned with a
  tick, the rest gray) and when it's in the shop; each card's drawings are fetched when it nears the screen. Finishing
  one pays **1,000 XP and 1,000 crowns once** (`migration_v75.sql`: `shop_items.collection`, `get_my_collections`,
  `claim_collections_v2`, key `collection:<k>`, `sh_prizes()`'s `collection`): the shop pays it when a purchase finishes one
  (a gold banner on its "Got it" sheet), and a collection finished before shows a Claim button. Halloween 2026's gift set
  pays nothing; rank sets aren't collections ([decisions](vault/decisions.md)). Tests: `tools/release/xp.js` 14d (596
  checks), the smoke test's place section. `migration_v75.sql` was applied right after the merge, through the connector
  (md5-checked), and is in `supabase/schema.sql` ([the task](vault/tasks/done/2026-11-19-shop-collections.md)).
- **2026-11-19 (pages that ride out a busy database: answers kept on the device, and the rank pill, Claude Code)** — (1) An
  answer still unsaved when its tab closed was lost (the line's retries lived in the page). Now `widget/v3.js` writes the
  answers still in the line to the device when the page is hidden (`sh_answers_kept:<hub>`), takes them back when it shows
  again, and the hub's next page sends them first, oldest first, with the same request ids (an answer that did reach the
  server pays nothing new); a page that finds its answers taken by another drops them. An answer out of its 8 tries is kept
  too. At most 3 days and 24 tries; the server stamps each when it arrives. A backlog (after a quiet spell, or kept) now goes
  out spaced as it was answered, up to 2.1 s apart, so its misses pay and count toward a run as they would have (the speed
  limit); live answers go at once as before. Mocks' and games' answers aren't kept (inbox). (2) With the bootstrap timed
  out, `widget/ranks.js` read the old rank profile until the first answer: no double-XP chip, and from 50,000 XP the wrong
  rank or journey (nobody is there yet). It asks `get_rank_profile_v2` when `shGame.live()` (a new `live` hook in
  `shEggHooks`). The dashboard already asked v2 first. About page ("What the hubs record") and Ask Timmy's site help
  updated; bundles rebuilt; `tools/ci/quiet.js` checks the kept answers. It also closes every WebSocket now: since #429 its
  pages (not marked automated, so they act as visitors) opened the real realtime connection and showed in Perio's
  "studying now" count for about a minute each CI run (nothing saved; the smoke test always closed them).
- **2026-11-18 (rules for heavy queries, Claude Code)** — From the database-load task's second and third boxes: on
  2026-11-18 the lessons audit's economy queries (11 and 13 s) and a migration's 43 s transaction failed students' answer
  saves. Timed on a throwaway copy at 1.5 times the class's size: `tools/economy.sql`'s E3 worked every wallet out about ten
  times (an inlined CTE), 4.7 s, now 0.5 s with `as materialized` and the same numbers; `tools/retro.sql`'s click list
  counted people once a row, now in one pass (0.3 s to 0.03 s); every other audit query under 0.1 s. The connector runs as
  `postgres` with a 2-minute limit, so every audit query is now its own call under `set local statement_timeout = '5s'`,
  one at a time (`tools/lessons-refresh.md`, the `lessons-audit` skill, the SQL files' headers). New how-to:
  [run-sql-on-the-live-database](vault/how-to/run-sql-on-the-live-database.md) (the class's quiet hours, 1 to 5 am Central;
  a backfill at night or in batches; `create index concurrently`; `lock_timeout`; small data fixes). Nothing on the site
  changes.
- **2026-11-18 (Heme & Endo Exam 3: L21 and L22 in, Claude Code)** — Sam: "i just added the last endo lectures. update the hub.
  no to all diagrams". Dr. Dal Zotto's **L21** Male reproductive and lower urinary tract pathology (`mpath`, 64 questions,
  `mr-`) and **L22** Female reproductive pathology (`fpath`, 60, `fr-`), both taught 11/18, written from their recordings (the
  slides were in Drive but too big for the connector to read: checking them is an inbox line). Notes at both levels, every
  question format with every why (13 Patient Box cases), the study guide's focus hints and topics first, the "you don't need"
  remarks as hints with no question keyed on them, tables, cram, processes, sort sets, all three narration levels. **No
  figures** (Sam's call, replacing the 11-16 yes for these two). The mock is the exam's 35 in 90 minutes; the "join later"
  wording is gone (`index.html`, `examInfo`, `hubs.js`). 437 questions, 86 topics. Shared: 29 words in
  `tools/podcast/lexicon.json` and "WHO" read as W H O in `tools/narrate.py` (only new recordings change). Content flags
  in `vault/hubs/heme-endo-exam3.md`; the task is done.
- **2026-11-18 (the backlog board, Claude Code)** — Sam: "would it be effective to make the backlog into a trello board
  artifact that i can initiate sessions from?", then "yes build it". `/backlog` now also redraws a private claude.ai
  artifact, "Study Hubs Backlog": the packages in four columns (This week, Next, Later, Set aside; tabs on a phone), each
  card with its items and where they're written, its prompt, Copy prompt, and Start session, which opens a cloud session
  through the Claude Code Remote connector (the first time, claude.ai asks Sam to allow it; without it, Copy prompt).
  `tools/todo/board.mjs` builds the page (`tools/todo/board.html`) from a packages file the agent writes in its scratch
  space, filling every prompt from the template in `vault/how-to/package-the-to-dos.md`. A view only: the vault stays the
  to-do list. Nothing on the site changes.
- **2026-11-18 (the outage repairs and raw pings kept 3 days, Claude Code)** — Sam: "we can do fixes for 1 and 2. do 3 days.
  dont cut anything for now". The evening outage (19:35-21:03 UTC) lost about 1,300 answer saves and about 2,900 activity
  pings (about 20 hours of the class's time, with the crowns it pays) for the 53 people studying then, in Perio and Heme &
  Endo Exam 3. (1) `tools/data-fixes/2026-11-18-outage-time.sql` (After merge runs it) fills each visit's 40 s to 10 minute
  gaps in that window with the pings that would have been there: 2,691 (18.7 hours) for 52 people, under what was lost;
  `activity_hourly` and the time crowns follow by the insert trigger; safe twice. (2) `migration_v73.sql` (applied live):
  `restore_outage_v2` takes a device's kept day (answers, right, XP, ring met) and pays the missing answers' XP (crowns as
  answers pay), the 20th answer, the day's first answer, the ring and the streak, once a person and hub, only for someone
  studying in that hub during the outage, 3 answers a minute at most, until 11-21; `widget/hub-rewards.js` asks once, a few
  seconds after a hub opens, and shows "Saved from Wednesday's outage". The answers themselves aren't added (the device
  doesn't keep which choice was picked). (3) `migration_v74.sql` (applied live): raw pings kept 3 days, the retention job
  nightly (`sh-retention-nightly`, 3:23 am Central); the admin page reads the nightly schedule; the About page says 3 days
  and every night. `tools/release/xp.js` (569 checks) and `retention.js` updated.
- **2026-11-18 (pages back off when the database fails: a quiet spell, Claude Code)** — In the evening outage each failed
  answer retried on its own timer (#421), which doubled the answer calls while 9 in 10 failed, with every page's analytics
  on top. Now (Sam: "Stay free, keep fixing") a call the server fails (a 5xx, or no answer) starts a quiet spell on that
  page, `window.shDb` in `widget/v3.js`: 30 s, doubling to 5 minutes while failures go on, jittered; a saved answer ends
  it. Answers wait in one line and go one at a time, a failed one again at the spell's end (up to 8 tries, about 20
  minutes, the same request id, so nothing counts twice); clicks, events (`widget/clicks.js`) and question health
  (`widget/qhealth.js`) keep their batches; mode opens, presence and searches are skipped; cards skip the class's
  numbers. Study time and what a student does on purpose still go; mocks and games keep their two quick tries. Bundles
  rebuilt. `tools/ci/quiet.js`, in CI's desktop smoke half, fails the first save on a fake database and checks it all.
- **2026-11-18 (answer saves cost a quarter as much; the database is on the Free plan, Claude Code)** — Sam: "i am getting a
  bunch of errors for the database and things are getting really slow". From 19:35 UTC answer saves failed in bursts, then
  from 20:10 without letup (40-70% of every request for about 35 minutes), until even the connector couldn't connect; Sam
  restarted the database from the dashboard at about 20:50 (unreachable until 20:57; no failures from 21:03). The cause: the project is on the **Free plan**,
  whose shared CPU was starved (a one-row query took 442 ms to plan with everything in memory), and since `migration_v68`
  that morning every answer worked out the whole crown balance and the hub's medal count. `migration_v72.sql` makes both
  cheap with the same results: the awards summed by kind before `sh_is_prize` (13 → 2.9 ms for a student of 8,000
  answers), and the medal count only on a right answer that turns a question right, one index lookup a question (5.7 →
  1.6 ms); a heavy student's answer 20.5 → 5-7 ms on a throwaway copy, every balance and medal the same, `tools/release/xp.js`
  passed. Also found: the Free plan's database goes read-only at 500 MB and it is 414 MB (166 MB of it the pings and their
  bloated indexes): the rest is in [the task](vault/tasks/done/2026-11-18-database-load.md).
- **2026-11-18 (right answers showed "+0 XP", Claude Code)** — Sam: "im getting 0xp for correct answers now ... it happened for 2
  questions and then the third gave me 10". The server paid them; the card's number is the page's guess, which used the game
  layer's rules only once the bootstrap or the first answer's reply confirmed it (`shGame.v2()`). With the bootstrap timed
  out in a busy minute, it guessed by the old 600-a-day cap, so an active day showed +0 until a reply came back. Now
  `widget/hub-rewards.js` `v2()` and `widget/games.js` `gameOn()` (the arcade's session and +50 had the same gap) ask
  `shGame.live()`, and the card shows what the server paid when it differs from the guess (`paidOnCard`). Bundles rebuilt.
  [BUG-183](vault/release/bug-log.md).
- **2026-11-18 (Ask Timmy costs less after a merge, Claude Code)** — The 21 "When is the exam, and what is on it?" on
  Heme & Endo Exam 3 in the admin page's Ask Timmy tab ($12.31) were the After merge workflow's own check, not students:
  it asked one real question on the first live hub after every deploy, and a deploy follows nearly every About page change.
  Now `tools/after-merge/run.js` asks a real question only when the function's code changed, on the live hub with the
  soonest exam (where its cache write is read by students); an About-page-only deploy gets a free check (a question from a
  mock exam, answered "paused" with no model call). And `buildRequest` in `supabase/functions/timmy/core.js` puts the site
  help after the hub's content, each block with its own 1-hour cache mark, so an About page change no longer sends every
  hub's 130-160k tokens to the cache again ([ask-timmy](vault/reference/ask-timmy.md), "Limits and money").
- **2026-11-18 (study time counts listening with the screen off, Claude Code)** — Sam asked whether Perio's study time
  was right on the day before the final, with so many people on it. It was: about 64 hours by 1 pm from 59 people, more than
  twice the same time the day before, and the study-time saves nearly all reached the database (about 15 errors in 10,000).
  It looked slow because people come and go: 45 people opened Perio in the noon hour, but about 16 were studying at any one
  time. The one gap: the clock stopped when the tab was hidden or the phone locked, even with a lecture's narration or
  Timmy Time still playing. Now (Sam: "add that study time tracking") `widget/v3.js` keeps counting while either one
  plays hidden, by how far the audio played at its speed, so a locked phone's late timer credits what was heard and
  nothing more. A pause stops it, and a play from the lock screen starts it again (`sh:audio-play`, from both players;
  `shPodcast.audio()`). Bundles rebuilt. The admin page's notes, [event-taxonomy](vault/reference/event-taxonomy.md)
  and the About page's "What the hubs record" say so (Ask Timmy's site help rebuilt).
- **2026-11-18 (two indexes for saving an answer, Claude Code)** — `migration_v71.sql`: `personal_answers` gets
  `(visitor_id, answered_at desc, id desc)` and `(visitor_id, hub, qid, answered_at desc, id desc)`. Every answer's speed limit,
  double-tap check and per-question counts read all of the person's answers before (9,377 for the heaviest visitor; the
  day's most frequent statement timeout). Built live with `create index concurrently` the same day (Sam: "Now, then
  merge"), so saves went on while they built; the speed limit's read is now one row from an index
  ([#423](https://github.com/smcmurry6-source/study-hubs/pull/423), [the task](vault/tasks/done/2026-11-18-database-load.md)).
- **2026-11-18 (A gold reward card for XP and crowns, and the Today card's crowns back, Claude Code)** — Sam: "the Today card in the
  question bank is no longer showing how many crowns youve earned. also when you reach a goal or other things like that where you get
  xp or crowns, a black box comes up from the bottom of the screen to tell you. i want it to look much cooler and communicate that you
  just got xp and crowns better". **The reward card** (`prizeCard`/`drawPrize` in `widget/hub-rewards.js`, its styles inside it so
  the dashboard, at 342 of 345 KB, carries none of it): what an answer's bonuses, a prize (`sh:prize`), a medal, a finished mock or
  game and Timmy Time pay comes up as a gold card in place of the dark toast: a title ("10 right in a row!"), the XP and the crowns in
  two pills counting up from 0, a turning sunburst behind the coin, confetti, and on closing the stars and coins fly to the rank pill.
  Rewards from one reply share a card (260 ms). Crowns: as many as XP for a prize, XP + 50 for a medal, and for study XP (the 20th
  answer, a mock, a game) 5 per 10 before a boost, shown only when that's exact (`studyCrowns`, the replies' `mult`). Today's goal
  waits up to 5 s for the daily ring's prize and makes one card with it ("Today's goal met! 20 questions · 8 days in a row",
  +100 XP, +100 crowns). Bottom center on a laptop, dropping in at the top on a phone (`.hx-prizes`, clear of Timmy, the tab bar
  and the report button, BUG-126's spot); a tap closes it; still with reduced motion, Answer animations off or Focus mode
  (`hx-still`). `widget/v3.js` adds `shGame.prizeName` (prizeText uses it). **The crowns tile (BUG-182)**: it came only from the
  bootstrap, which timed out for up to one page in ten in the busy minutes ([#421](https://github.com/smcmurry6-source/study-hubs/pull/421)'s load);
  `widget/hub-timmy.js` now takes the balance from the last paying reply and asks `get_my_shop` on its own (8-20 s later, once
  more a minute after), and the tile says "+n today" (`t.c`, from `sh:crowns` gains). The smoke test reads the arcade's +50 from
  the card. About page ("The reward card", the shop's balance line) and Ask Timmy's site help. An index for `sh_answer`'s
  speed-limit reads was found and tested, and left to #421's database work ([inbox](vault/tasks/inbox.md)).
- **2026-11-18 (the admin page's A/B versions page; answer saves that survive a busy database, Claude Code)** — Sam asked
  for the A/B results on the admin page and reported its loading errors ("canceling statement due to statement timeout").
  The Supabase logs showed the same timeouts failing students' answer saves in bursts of 1 to 5 minutes all day (242 of
  about 3,900 `record_answer_v2` calls), each while something heavy ran on the small database: a migration, the lessons
  audit's economy SQL, the admin page's reads sent all at once (BUG-181). Now: the admin page reads **one query at a time**
  (`queued()` in `review/index.html`), tries a timed-out read once more after 5 s, and says "the database was busy" instead
  of naming a migration; `widget/v3.js` retries a failed answer for about three minutes with the same request id (bundles
  rebuilt); **A/B versions** (`#ab`) shows each hub's first tries on A against B with a z and a 95% range, by kind of
  question, and the questions with 5+ people a side, biggest gap first, from `get_ab_summary` (`migration_v70.sql`, applied
  through the connector; a partial index `question_events_ab`). Still to do: [the task](vault/tasks/done/2026-11-18-database-load.md)
  (the heavy admin functions cached, the audits' queries short, migrations at night, Sam's call on a bigger database).
- **2026-11-18 (Perio S6: five diagrams, Claude Code)** — Sam: "yes to all diagrams. merge when ready", to the five S6
  candidates. Built as anima figures in `tools/figures/perio/` (`race.mjs`, `walls.mjs`, `dtree.mjs`, `vtoh.mjs`, `subtr.mjs`,
  S6 · Figs 1-5) and placed at the end of their sections in the S6 notes, in As taught and Plain English (`FIG_PLACE` in
  `content/figures.js`, `figByLec` in `core.json`): the race for the space (no barrier, a GTR membrane or a graft, over
  time), counting the walls (3-, 2-, 1-wall, the opening case and horizontal loss, with the film each gives), the
  regeneration decision tree walked step by step or along a case, the canine case's vertical-to-horizontal fill with its
  H-shaped root and the brush, and subtraction radiography in five steps. `figures.js` 121 → 157 KB gzipped; it loads with
  Notes, so the Perio budget (864 of 885 KB on a Home visit) is unchanged. About page's Diagrams entry: twenty for Perio.
  [The task](vault/tasks/done/2026-11-18-perio-s6-diagrams.md), [#420](https://github.com/smcmurry6-source/study-hubs/pull/420).
- **2026-11-18 (Perio S6: Periodontal Regeneration taught, Claude Code)** — Sam: "take Perio Session 6 (Periodontal
  Regeneration) from slides only to taught", the day before the final. Source: the class recording's transcript in Drive
  (Periodontology/hubs, `en-FA2026_DENT2145-VT_Lecturecapture_AVLC (1).txt`; read, never committed), with the deck and the
  exam-review guide. S6 `preview` → `taught`; both reading levels rewritten from the class and all three narrations
  (`periodontal-regeneration-full`, `-plain`, `-hy`) recorded again; 21 Exam Hints quoted (he said to study the decision
  tree; the defect-morphology slide's studies are "not there for you to read", so `q6-L38` was retired and `q6-L06`,
  `q6-L08` lost their study names); 14 High Likelihood topics re-ranked from what he stressed; cram rewritten; 24 new
  questions (8 true/false, 2 two-statement, 4 numbered, 2 which, 2 which-false, 6 multiple choice, `q6-T*`, `S05`-`S06`,
  `N*`, `W*`, `F02`-`F07`), each with a why per choice and its version B in `content/variants.json`; S6 56 → 79, the bank
  674 → 697 (after #414 retired `q5-L14`). Timmy Time's section 6 rewritten from the class (it said "what we have is his slides") with a new lightning
  round line, and the episode rebuilt. Five diagram candidates put to Sam, all approved and built the same day (next entry up): [the task](vault/tasks/done/2026-11-18-perio-s6-diagrams.md).
  [The task](vault/tasks/done/2026-11-03-perio-s6-regeneration-taught.md).
- **2026-11-18 (A or B on the question cards, and the two-sided perio charts say they are one visit, Claude Code)** — Sam:
  "address the reports. also instead of saying \"reworded\" on the question cards, just display A or B and have that be the
  differentiator". A question that comes in versions (Perio's `variants.json`) shows the letter of the one on screen beside its
  number on every card (`verTag` in `widget/hub-bank.js`, `HX.qParts.verTag`: the bank, the drill, misses, weak spots, the mock,
  Learn and Flashcards; `.qc-ver` in `widget/hub.css`, small and muted: Sam, "The a and b should be smaller/less noticeable"), on the first try too, and "Last time: right · reworded" is just "Last
  time: right". A report says "(version A)" or "(version B)" in the form and in its note (`widget/v3.js` `flagVersion()`; was
  "(reworded: wording 2)" and nothing on A); Flashcards' Report now passes its version and statement order too. Perio report #61
  (`pc-e3`, "two perio charts over the course of time?"): the case kit's chart (`widget/cases.js` `I.chart`) now heads each
  surface FACIAL / LINGUAL above its strip, with a line at the top saying both are one chart from one visit and a rule between
  them, on every case that draws both surfaces; `deep-pocket-19`'s chart and film are titled "today's re-evaluation" and
  "today". The About page's "Questions come back reworded" entry says A or B.
- **2026-11-18 ("Release tests" faster, and WebKit doesn't block a merge, Claude Code, #416; nothing on the site changes)** — Sam: "do both". The device matrix's Firefox and WebKit jobs run in Playwright's own image (`mcr.microsoft.com/playwright:v1.63.0-noble`, `--user 1001`), which already has the browsers and their system packages: installing those from Ubuntu's mirror took 22 minutes for WebKit and 11 for Firefox on today's runs, for one to two minutes of tests. WebKit's job is out of `release` ("devices in WebKit (doesn't block a merge)", `continue-on-error`). Found on the way (BUG-179): since the per-browser split of 2026-11-13 those two jobs stopped at `matrix.js`'s Chromium-only resilience part, which `run.js` called blocked and passed, so neither had tested anything. Now the resilience part runs only with Chromium, a browser that won't start is a problem in CI, and `run.js` fails a blocked suite in CI. The Chromium jobs keep `--with-deps` (it brings the fonts the layout checks and baselines were measured with).
- **2026-11-18 (No more tiers for merging, Claude Code; nothing on the site changes)** — Sam: "i want to take out all the tier change rules for merging. it takes too long. it didnt use to take so long". Every change now ships one way: the checks for what you touched, a draft PR, CI, a screenshot for Sam when students will see a difference, Sam's "merge". No local release suites, test report, bug-log rows or preview offer, and no tier 3 extras. CI and the After merge workflow are unchanged. Rewritten: [preview-and-release-test](vault/rules/preview-and-release-test.md), [RELEASE_TEST_PLAN.md](RELEASE_TEST_PLAN.md) sections 1, 2, 6, 7 and 10, `AGENTS.md`, ship-a-change, verify-before-pushing, long-tests-once, preview-a-change, package-the-to-dos and `/backlog`, the PR template (no Tier, UAT or Bugs sections) and the test report template (optional now).
- **2026-11-18 (statements in a new order on a later try, and the High likelihood tag says why, Claude Code, #417)** — Sam: "yes to
  the two ideas" (Perio reports #55/#56 and #57). A numbered-statement or two-statement item that comes back (a second try, a
  retry of a miss, Learn and Flashcards) shows its statements shuffled and renumbered, never in its own order on the second
  try, and each choice relabeled to the same statements in canonical order: choice k still means what it meant, so the key,
  grading, XP, class picks and question health are unchanged. The why lines and the explanation are renumbered with it
  ("Statement 3 is false", "It leaves out 2, which is true", the B versions' bare "1 and 2 are true"); an item whose words
  the kit can't follow keeps its own order (5 of 244). The kit is `widget/statements.js` (`window.shStatements`, in
  `hub.bundle.js`); `hub-bank.js` calls it from `card()` and `HX.qParts.later` (Learn and Flashcards), the card carries
  `data-order`, a report names the order it was shown in, and Ask Timmy gets the order (`o`) and renumbers the item the same
  way on the server (`inOrder()` in `supabase/functions/timmy/core.js`), so he calls a statement by the number on the screen.
  `node tools/ci/statements.js` (in "Check hubs") checks every order of every item and version against its key, and that
  Ask Timmy's copy renumbers it exactly as the page does. The High likelihood tag on a card is a button: it opens why (the
  predicted topic, its place in the lecture's list and what it rests on: the professor's hint, the review, the check-ins) and
  links to Exam Hints. BUG-178 (bare numbers in the B versions' whys weren't renumbered) found and fixed before release.
  The About page and the three rule notes say so.
- **2026-11-18 (lessons refresh, and the game economy joins the audit, Claude Code, #414)** — Sam: "add to the lessons audit a review of xp
  and crowns across the class to make sure earn rates are healthy. also include shop prices". A standing rule,
  [earn-rates-stay-enjoyable](vault/rules/earn-rates-stay-enjoyable.md) (on demand, for anything that changes a rate, a prize or a
  price), with a yardstick in median study days per rarity; `tools/economy.sql` (E0-E7: the live rules, crowns and XP per study day
  and hour, the class's rhythm, wallets and spending, the price ladder in study days, ranks, the leaderboards), step 1b of `/lessons-audit` and a line in
  `tools/lessons-refresh.md`. First reading in `LESSONS.md` ("The game economy"): about 700 crowns a median study day since
  the crown raise (#403's migration, live on the database), everything under Legendary two to three times cheaper than the yardstick, half the active class able to buy anything,
  4% spent (7% by the afternoon); Sam: "lets keep all the prices for now". **Perio, the day before its final**: `q5-L14` retired (furcation
  entrance widths, which the final won't ask; its High Likelihood topic reworded and S5's High yield recorded again), `pc-d3`'s stem
  states its assumption, `q7-P01` asks about the case (report #54), `q4-L27`'s "re-check" pair reworded (report #59), `q7-01`'s
  explanation gives both bone-loss limits (report #60), their `variants.json` wordings too. Occlusion's retrospective has its 22 check-ins.
- **2026-11-18 (The launch trailer's tools, Claude Code, #415; nothing on the site changes)** — Sam: "you can merge
  the tools and notes in case we ever make another trailer". `tools/trailer/` made the redesign's launch trailer, a
  94 second, 16:9 video narrated by Timmy from a newly drawn Timmy Time studio
  ([the task](vault/tasks/done/2026-11-13-launch-trailer.md), [README](tools/trailer/README.md)): `script.md` (his lines),
  `voice.py` (the show's Kokoro voice and lexicon), `audio.py` (a new music cue and sound effects from the show's
  instruments, the master, and the timeline everything is cut to), `studio.mjs` (the studio in the site's ink style,
  in layers, with its light), `shots.mjs` + `record.mjs` (the feature shots and where the camera looks, recorded a
  frame at a time from a preview on made-up data at 2560 x 1440), `compose.mjs` (every frame: the cold open, the
  "Rebuilt." title card, a chapter card before each feature, the recorded page on a screen the camera pushes in on,
  Timmy's booth cam with his line in a bar beside it, the end card) and `cut.mjs` (the mp4 with `.vtt`/`.srt`).
  **The video is not in the repo and not on the site** (Sam: "A link/file only"): `tools/trailer/out/` and
  `names.local.json` (the leaderboard names its boards show, with Sam's OK) are in `.gitignore`. Ask Timmy's answer
  in the footage is staged from Occlusion's notes (the preview has no model), and the idea board's notes are the
  preview's made-up ideas under made-up names. Built 2026-11-14 on the release branch as #360, which was closed
  unmerged on 2026-11-18 (Sam: "im done with the trailer"); this PR lands the same files on `main`. **The tools were last run against
  the site as it was on 2026-11-14**: a new trailer starts by checking `shots.mjs`'s selectors and `record.mjs`'s
  patches of the preview against the pages as they are then.
- **2026-11-18 (the to-do list as packages, `/backlog`, and the to-do rule tightened, Claude Code)** — Sam: "give me a list
  of all the open items on the to do and the inbox ... group them in packages that can be shipped in the same pr ... a really
  big item should go alone in its own session ... make this a skill". `node tools/todo/list.mjs` prints every open item (task
  notes and their unticked boxes, the inbox, pending migrations, the bug log's open and awaiting-retest rows, leftovers in
  done tasks; `--ref origin/main`, `--full`, `--json`); [package-the-to-dos](vault/how-to/package-the-to-dos.md) says how to
  set aside what's in a PR, waiting, Sam's or parked, group the rest into one-PR packages (S, M, L; an L always alone) and
  write each one's launch prompt; `.claude/skills/backlog/` runs it in Claude Code. Sam's second ask, "make it a rule that
  any sessions from now on will add open items to the to do list and check things off that have been done", went into the
  existing rule ([to-dos-go-in-the-vault](vault/rules/to-dos-go-in-the-vault.md): check the list at the start, tick and add
  in the PR, tick what you find already done) and the PR template's new "To-do list" section. The first run's vetting closed the launch trailer (done in #360, never merged; Sam: done), struck the Ask Timmy key line (Sam: not needed) and updated BUG-002, -003 and -004 from today's accessibility baselines. Nothing on the site changed.
- **2026-11-18 (Perio's questions as A/B versions, Claude Code)** — Sam: "They are A/B versions of questions", "Split the
  class". `abStart()` in `widget/hub.js` picks each question's first version by device (a mixed FNV hash of
  `sh_visitor_id` and the id: about half the class on each, every question), later tries alternate; a mock keeps each
  question's version (`STATE.mock.wv`) until it's submitted. Every Perio card says its version (`data-wording`, 0 = A, 1 = B),
  `widget/qhealth.js` sends it (`w`), and `migration_v67.sql` (applied through the connector) keeps it on
  `question_events.w`, splits first tries by version (`qh_report`'s `wordings`; the old function renamed `qh_report_v51`)
  and adds the medium flag `ab_gap` (20+ points apart, z ≥ 1.96, 10+ people a version). The admin page shows "First try
  by version" and version B's text. Tests: `tools/release/admin-ops.js` section 5. About page updated.
- **2026-11-18 (The class's picks follow the version of a question's choices, Claude Code)** — the inbox's "class picks on
  each choice ignore question versions" (BUG-023's general fix). `question_choices` was keyed by position only, so after an
  edit the "% of the class picked it" beside a choice counted picks of the old choices: since the release, 169 Perio and
  125 Occlusion questions had their choices rewritten (8 of Perio's only moved), and #404 rewrote 7 of Heme & Endo Exam 3's. `migration_v66.sql`: a one-choice or
  select-all key carries `cv`, the version of its choices (`choiceVersion` in `tools/xp/keys.js`: the choices and the key;
  the stem, the explanation and the whys don't count); `record_choice` / `record_choices` stamp each pick with the current
  one (`question_choices.v`); when it changes, `admin_load_question_keys` moves the old picks to `question_choices_past`
  (closed to the public, nothing deleted; an undone edit brings them back), with a backstop at the next pick
  (`sh_choices_to`). The page, `sh_answer` and every reader of `question_choices` are unchanged. Picks from before versions
  are kept as the current choices', except on the 301 questions whose choices changed since their content JSON shipped
  (`tools/xp/choice-history.js`, from git), whose picks are set aside. Hubs without keys (the old pages) behave as before.
  Takes effect when the After merge workflow reloads every engine hub's keys (it does for any change to `keys.js`). Tests:
  `tools/release/xp.js` section 3b; `rls-expectations.json` closes the past table and the two helpers. About page entry.
- **2026-11-18 (CI back on the newest Ubuntu, Claude Code, #407)** — The inbox to-do from #402. Every workflow is back on
  `runs-on: ubuntu-latest` (Ubuntu 26.04 since 2026-11-18) with Playwright **1.63.0** in place of 1.56.1 (the
  `playwright@` lines in `check.yml`, `release.yml` and `after-merge.yml`): 1.63.0 has Chromium, WebKit and Firefox
  builds for `ubuntu26.04-x64`, and it is the copy preinstalled in Claude Code cloud sessions, so a session's run and CI's
  use the same Chromium (build 1243). The 26.04 image has PostgreSQL 18 (24.04 had 16): `tools/release/pg.js` takes the
  newest it finds. Run here on 1.63.0, the accessibility suite passed with nothing new or better than its baseline;
  `tools/release/baselines/a11y.json` was re-recorded (`--update`) only to drop the archived Occlusion's and Heme & Endo
  Exam 2's screens and add Heme & Endo Exam 3's 14, all at zero. The performance budgets passed and are unchanged:
  `perf.js --update` would have raised several (budgets go up only with Sam's OK), and bytes and requests don't depend on
  the browser. The site itself doesn't change. What to do the next time `ubuntu-latest` moves:
  [verify-before-pushing](vault/how-to/verify-before-pushing.md).
- **2026-11-17 (Crowns go up as you earn them, and prizes that pay XP and crowns, Claude Code, #403)** —
  Sam: "my crowns are not increasing after i answer questions. make sure there is no cap on daily crown or xp earn rates",
  then a list of prizes. The crowns were paid but never redrawn (BUG-177): `migration_v68.sql` puts `crowns` (the balance
  after it) in every paying reply and `widget/v3.js` sends it as `sh:crowns` (the hub's meters, its shop, the dashboard's
  wallet; a gold "+n crowns" under the rank). No daily cap on either (the 600 cap is the old pages' only). Prizes, one
  `xp_awards` row each, paying as many crowns as XP (`sh_prizes()`, copied as `PRIZES` in `v3.js`): the name 500, the daily
  ring 5 a question of the goal, a Plaque Boss's 500 by damage (`widget/eggs.js`), 10/25/50 in a row, day streaks
  3-100, a nuke 10,000 (`launch_nuke_v2`), the all-time run record 20,000, a lecture read to the end 50 (timed on the
  page, `widget/hub.js`), a new trophy 200 (`widget/ranks.js`), medals 250-1,000, the day's first game 100, a personal best
  50 and a hub high score 250, a daily visit 50 (`widget/dash.js`), a fixed report's 100 crowns. Every card says what it
  pays (Timmy Time, Mark as read, the arcade, the goal, the visit, the name, the nuke badge, the shop's list). About page,
  [game-server](vault/reference/game-server.md), event taxonomy and retention updated; `xp.js` 519 checks.
  Then Sam: "Every right answer should give xp": `sh_answer` pays every right answer graded from its key (a retired
  question's too), with no speed limit and no limit a day (a double tap and the same question twice in a mock count once);
  misses keep their limits, and the run toward the nuke still counts only answers at the speed limit. `sh_xp_replay` pays the
  same, and the migration rebuilds every visitor from it, paying the right answers since the release that had paid nothing
  (about 80 from about 25 people since the release, nearly all under 2 seconds after the one before). The page's guess
  (`xpFor` in `widget/hub-rewards.js`), the About page's XP entry and More's note say the same.
  Then "lets increase it to 5 crowns per 10xp": `sh_wallet` pays 5 crowns per 10 study XP (was 1), from all the XP so far
  (the balance is worked out, so every balance went up); every card, the shop's list, the About page and the preview's
  wallet say 5. The shop's prices weren't changed. And "also 100 crowns per hour of hub time": `sh_time_crowns` pays 100 an
  hour from `activity_hourly` (all the time recorded, at most 144 pings in a clock hour), in the wallet's `from_time`;
  the planned collapse of `activity_hourly` must keep it (inbox).
  **Applied to the live project on 2026-11-18** through the connector (its confirmation answered by the new hook,
  `.claude/hooks/supabase-confirm.js`), appended to `supabase/schema.sql`; every function's body matched the tested copy, and
  the rebuild agreed with live XP for all 77 people with an answer since the release. Class-wide after it: 168 wallets, none
  below zero, median about 1,200 crowns, about 300,000 of the 740,000 from hub time.
  It was written and applied as "v64", but other sessions' v64 (matching items graded as an order), v65, v66 and v67 reached
  `main` first (v66 and v67 while this PR waited to merge), so it is `migration_v68.sql`; applied after that v64, it had replaced `sh_answer` without
  that v64's one branch (a cached page's matching answer, taken at its word), so `migration_v69.sql` puts it back (applied the
  same day; no answer in between needed it). Bug BUG-177 (the numbers before it were taken). Before applying a migration, fetch `main` and
  take the next free number, and fetch it again before merging ([repo map](vault/reference/repo-map.md)).
- **2026-11-18 (more cosmetics: six year-round collections, five rare costumes, six paints, Claude Code)** — Sam: "Lets work on
  timmy outfits and place cosmetics. Go crazy" ([the task](vault/tasks/done/2026-11-18-more-cosmetics.md)). **Six collections**
  (`COLLECTIONS` in `tools/figures/site/sets.mjs`, one pack each in `tools/figures/site/packs/`: `dino`, `moonbase`, `reef`,
  `desert`, `arcade`, `rockshow`), eight pieces each like a season's set (a Legendary home, an Epic scene, outfits Common to
  Rare, yard pieces Uncommon to Epic), but everyday pieces in the daily and weekly picks all year: the rotation goes from 46
  pieces to 100. Each is its own file (`widget/hub-art/place/<k>.js`), fetched only where a place shows one of its pieces, so
  no page loads more. **Five more rare costumes** (the wizard, the robot, the firefighter, the shark, the legendary dragon;
  `COSTUMES` in `sets.mjs`, drawn in `place.mjs`, lines in `tools/podcast/LORE.md`) and **six more paints** (coral, sage,
  sand, rose, slate, teal). The kit marks a collection's piece `coll` (`SH_PLACE.collOf`); a pack outfit can say
  `noLoupes`. Client: the customizer's Collections tab (`widget/place.js`), the shop names a piece's collection and stands
  it in its own scene (`widget/shop.js`), ten costumes in `widget/hub-timmy.js`, `widget/dash.js` and `widget/shop.js`.
  Server: `migration_v65.sql`, 59 rows into `shop_items` (240 in all) and nothing else, applied once the pages are live.
  Tests: `tools/release/xp.js` (the collection rows are exactly `allCollectionItems()`, the ten costumes are `COSTUMES`, the
  three client lists follow it), `tools/ci/smoke.js` (Collections in the customizer, only the owned collection's file
  loads; ten costume shapes), the preview's catalog reads a later migration's inserts (`tools/preview/transform.js`). The
  design page has a "year-round collections" gallery. About page (the shop's entry) and Ask Timmy's site help.
  **A bug from before, fixed:** a set fetched late (`addPack`, which is how every page gets one) never added its yard eggs'
  animation rules to the kit's CSS, so tapping a seasonal yard piece said its line but its egg stayed hidden; `addPack`
  appends them now, and `tools/figures/site/build.mjs` fails if a late kit lacks any. Moon base's door spot moved out of the
  front yard slot. Found by CI and fixed: the kit's lists after `addPack` dropped `coll` (BUG-172: an empty Collections tab),
  and one `outfits.js` of all 88 outfits put the dashboard over its budget (BUG-173): it now holds the everyday and rank
  outfits (9 KB), and `widget/hub-art/outfits/costumes.js`, `seasons.js` and `collections.js` are fetched only when someone
  drawn wears one of theirs (`where`; `widget/pet.js`, `widget/dash.js`). Found by the local smoke test: on a phone the
  customizer's four tabs ran past their panel (BUG-174, a phone rule in `widget/place.css` widened them). To do from it (the inbox): a tall front-slot piece
  covers Timmy at the door; kit niceties the drawers asked for.
- **2026-11-18 (Heme & Endo Exam 3: L19 and L20 taught, and every High Likelihood question marked, Claude Code, #404)** — `hubs/heme-endo-exam3/content/`, `tools/figures/heme-endo-exam3/`, `audio/hemeintro-*` and `audio/lymleuk-*`, `tools/hub-next/build.mjs`. L19 (Dr. Herr) and L20 (Dr. Borak) were checked against their 11/17 recordings: notes at both levels follow what was said, every key reread, L19 57 to 72 questions and L20 57 to 65 (`ll-hl-case`, `ll-2s-scatter` and `ll-specimen` retired: Hodgkin subtypes and flow cytometry, said not needed), 16 and 18 Exam Hints, topics re-ranked with the study guide's first, their ten figures corrected, and two new figures (Fig 23 `nkcheck`, Fig 24 `nodespread`); all three narration levels recorded again. BUG-164: the study guide's re-ranking (#393) had left 77 questions in a topic without their `likely` flag (the bank's toggle, the mock's share and the drill missed them); the content build now sets `likely` from `likelyTopics` on every engine hub (Occlusion and Perio unchanged). Flags: [the hub note](vault/hubs/heme-endo-exam3.md).
- **2026-11-18 (Link my devices beside every name button, BUG-169 and BUG-170, Claude Code)** — Sam: "link my device is
  nowhere to be found. add it to the settings page next to where you change your name. anywhere else that you can change
  your name, add another button to link device". Since the redesign it lived only in an old hub's Stats panel, which the
  new pages never show (the redesign's plan said "folded under the name dialog"; it never was). `widget/linkask.js` has
  the whole thing now as one card, `shLinkAsk.link({ back, from })`: get a code (and send or copy the link), or type the
  other device's code (it links at the sixth character), tracked as `link:open=<where>`, `link:code`, `link:share`,
  `link:linked`, `link:fail`. Buttons for it: the dashboard's Settings (a row under Your name), its You card and its name
  window (`widget/dash.js`); a hub's More → Settings (`widget/hub.js`), its name window, Timmy Time's and the idea board's
  "Posting as … change" (`widget/v3.js` opens any `[data-sh-link]` button; `widget/podcast.js`, `widget/ideas.js`); an
  old hub's Stats and Settings name boxes and its rank card (`widget/v3.js`, `widget/ranks.js`, `widget/v3.css`). A
  hub's Settings now draws Your name and Link my devices before the shared widget is in (a tap waits for it): opened
  straight on `#more/settings`, both rows were missing. About page, the dashboard tour's Settings step, Ask Timmy's site
  help and the event taxonomy updated; bundles rebuilt.
- **2026-11-18 (Perio's questions come back reworded, Claude Code, stacked on #402)** — Sam: "do one extra wording and only do it
  for perio". `hubs/perio/content/variants.json` holds a second wording of each of the 652 Perio questions with choices (stem,
  choices and whys; choice k is choice k reworded), written session by session from the notes and hints by 14 writers and
  checked by 14 independent reviewers, who changed about 100. The engine (`worded()` in `widget/hub.js`) shows the original
  on the first try and the next wording after (by the try count; Flashcards by its reviews): `card()` in `widget/hub-bank.js`
  covers the bank, drill, misses, weak spots, the mock and Learn; Flashcards (`widget/study-modes.js`) and the arcade
  (`widget/games.js`, `hubs/perio/content/arcade.js` `dealMCQ`) call it too. The file is fetched with the bank or the arcade,
  not with Home or the notes, and isn't precached. Search, Find this in the notes, SH_EXPORT and question health keep the
  original (the fingerprint is unchanged). A report says "reworded: wording 2"; Ask Timmy gets `ask.w` and the server swaps in
  the wording (`wordingOf` in `supabase/functions/timmy/core.js`, `loadVariants` in `index.ts`). `tools/hub-next/build.mjs`
  checks every wording (`checkVariants`) and counts it in `core.json`'s `variants`; `tools/ci/smoke.js` lints each one.
  No High yield changed. Not done: recording which wording was shown on each answer (a migration; task note).
- **2026-11-17 (Perio's Stage & Grade game, its bank audited against the final's hints, matching pays 10 XP, What's new on the
  dashboard, the recap stays still, Claude Code, #402)** — Sam: "add an interactive visualization/game for staging and grading
  using all of the criteria ... accessible on the home of perio hub, top of the question bank, and in the arcade", "using the
  final exam hints dr abou arraj gave ... vet the whole question bank", "using all of the perio midterm check ins, see if there
  are any additions", "matching questions are only giving 2xp instead of 10", "add the recent change log back".
  **Stage & Grade** (`tools/figures/perio/stagegame.js` + `.css`, built into `hubs/perio/content/figures.js`/`.css` between
  `stage:js`/`stage:css` markers by `tools/figures/perio/build.mjs`, `--check` in CI): ten made-up patients, each drawn as a
  mouth chart (each tooth's own facial outline at its average size: incisal edges, canine cusps, premolars, molars with their roots; Sam: "make the mouth chart use teeth shapes instead of arbitrary rectangles") and a radiograph of its worst site, with their findings; call the stage, the extent and the grade, and the
  finding that decided each call lights up gold. Explore sets every criterion by hand and the diagnosis follows, with why.
  The rules follow Session 1's notes (CAL first, the bone-loss bands, the Stage 3 triggers, Stage 4 by teeth lost or
  complexity, the grade by direct evidence or the bone-loss/age ratio, smoking and HbA1c lifting it); 20,000 dealt cases
  checked against them. It sits at the top of the Question Bank (`bank.cuspGame`, the slot Occlusion's cusp game uses), on
  Home as a wide quick link (`SH_HUB.home.links`, new in `widget/hub.js`: any hub can list extra links there) and in the
  arcade as its seventh game (`#more/arcade/stage` opens it straight away; `GAME_IMPL.stage` in `content/arcade.js`, lobby art
  `pStage` in `tools/figures/site/arcade.mjs`). Arcade plays earn the usual +50; it doesn't count in class stats.
  **migration_v64.sql (applied live 2026-11-17):** `sh_answer` pays a matching question (an `order` key whose picks
  arrive empty) as a self-graded one, 10 XP the first time right, instead of the flat 2; `submit_arcade_score` and
  `sh_session_start` accept `stage`. `tools/release/xp.js` tests both. **The audit**
  ([task](vault/tasks/done/2026-11-17-perio-final-hints-audit.md)): six reviewers read the bank session by session against the
  notes and the Nov 12 hints; 111 questions fixed in place (ids kept: wrong or thin whys, unclear stems, one second
  defensible answer, a sickle "toe"), 2 retired (`q3-20`, a third ask of one fact; `q1-E03`, a near-duplicate), 8 added:
  suture materials from the midterm check-ins (`q2-F04`-`F06`; the final asks the materials, not the techniques), and
  `q4-F06`, `q8-F03`, `q8-F04`, `q9-F03`, `q9-F04` for hinted facts the bank didn't ask. 669 → 675. High yield recorded again
  for every session whose `hy` changed. **The dashboard:** a hub card's "Updated" opens What's new (its last few changelog
  lines and the site's), and the hub recap plays its bars once, then stays still while you scroll. **CI:** every workflow is pinned to `ubuntu-24.04`: `ubuntu-latest` became 26.04 on 2026-11-18 and Playwright 1.56.1
  can't install a browser there (a to-do in the inbox moves it back).
- **2026-11-17 (the dashboard at the large text sizes, BUG-076 and BUG-163, Claude Code, #401)** — `widget/dash.css` (and
  the rebuilt `widget/site.bundle.css`). On a 320 px phone at XX-Large the page scrolled 49 px sideways (10 px at X-Large):
  the "You" card's week dots now shrink, still round, when the card is narrower than the week, and "Start studying" wraps
  inside its row. That sideways scroll had also widened the layout so a reply to your report opened wider than the screen;
  it fits now with no change of its own. Found while checking: at X-Large and XX-Large the rank card gave its words about
  50 px beside the medallion ("Bronze I" broke in two, the Trophy case count was cut off, even at 390 px), so the "You"
  column is a size container (`dxyou`) and under 260 px the medallion goes above the words, and the card's buttons wrap
  between label and count. The hub card's exam block keeps to one column the card's width, and under a 215 px column
  (`dxhubs`) the title is 21 px, so "Periodontology final" fits at 320 px. Default and Large measure as before.
- **2026-11-17 (two inbox to-dos, notes and the schema record only, Claude Code, #401)** — `supabase/schema.sql` checked
  against the live database by hash: every difference was text only. With comments, line endings, layout and the secret
  left out, only three functions differed: `get_display_name` (laid out on four lines live) and `get_nuke_by_hub` and
  `get_nuke_recent` (column labels live, which change nothing in a `returns table` function). The file now matches live,
  and it has `question_flags_visitor_idx` (migration_v25). The same 210 functions and 114 indexes now hash the same on both
  sides; the file's header says how to check again. Nothing was applied to the database. And the redesign's six task notes
  still open after the release (phases 2, 3 and 4, the journeys, the shop, Timmy's place) are ticked, given their Outcome
  and moved to `vault/tasks/done/`, with 383 links rewritten. The one thing left, BUG-076 (the dashboard at 320 px with the
  largest text) and a report-reply pop-up cut off at that size, is a to-do in the inbox.
- **2026-11-17 (The check-in and the survey in a window, Timmy peeking over it, a celebration for the reward, and one more ask, Claude Code, #398)** —
  Sam: "make the check in and survey prompt more interesting and also advertise that it earns you 1000xp and 1000 gold crowns.
  make it take up the center of the screen and a window. have timmy peek over the top of the window", then "the thank you stage
  should show that you earned the crowns and xp. make it do a super epic and cool animation" and "push this new prompt to anyone
  who has said no on the occlusion final check in and the new survey". `widget/dash.js`: `formWindow` (one window for both: the
  middle of the screen over the dimmed page, a title bar in the hub's tint or gold, the same top for every step so it doesn't jump,
  focus kept inside and given back, Escape / × / a tap outside = Not now or Later) with Timmy (`shPet.art`, in his outfit) cut at
  its top edge and his hands drawn again over it (`PEEK_HANDS`), a line for each step in a bubble; the reward as two tiles before
  sending (`lootHtml`, only when it would pay: a check-in already sent from this device doesn't offer it); the check-in's bar fills
  toward a crown coin. `celebrate`: when `_v2` says it paid, a turning sunburst, a shockwave, 28 pieces of confetti, crowns and
  stars, the tiles popping in and counting up, Timmy jumping with his arms up, and Collect (or ×, Escape, 12 s), which flies 12
  crowns and stars from the tiles into the bar's rank (`#dxRank`, which glows) and only then calls `rewardPaid`, so a rank-up card
  follows instead of covering it. All still with reduced motion or "Answer animations" off (the CSS stops every animation in
  `.survey`; no flyers, no counting). **Ask again**: `hubs.js` `askAgain` on an exam (a device that showed the check-in and never
  sent it gets it once more per round, `sh_debrief_again_*`) and `surveyAgain` (`{ "<id>": "<round>" }`: whoever said Later, i.e.
  in the bootstrap's `survey` but not `survey_popup`, gets the pop-up once more, `sh_survey_again_*`); set for the Occlusion final
  and survey 4, round `2026-11-17`. `rewardLine` gone. The preview: `submit_survey_v2` and `submit_exam_debrief_v2` pay as
  migration_v60/v61 do (`formReward`, its crowns kept out of the 1-per-10 share), and "Later" now leaves the survey in the Inbox
  (`get_my_survey`) while the pop-up (`get_active_survey`) stops, as on the live database. About page and Ask Timmy's site help.
  The pop-ups now wait while another window is open (`whenUncovered`, on `lifeCovered()`): a classmate's place or the shop is a
  `<dialog>` above everything, so the check-in opened hidden under it and took its Escape (CI's smoke test caught it). The smoke
  test closes the window when it opens over the dashboard, like the tour and the archived notice, and checks a visit has none under it.
- **2026-11-17 (Heme & Endo Exam 3: the exam's count per lecture, Claude Code)** — Sam gave the breakdown: A 3, L17 4, L18 6,
  L19 8, L20 6, L21 4, L22 4. `core.json` `examCounts` (all seven; "n on the exam" under Most likely questions, and Ask Timmy's
  exam facts through `examInfo`) and `mock.blueprint` (the five lectures in the hub, 27 questions in 69 minutes at the exam's
  pace; L21 and L22 add theirs when they go in). The hints banner and mock blurb in `index.html`; the hub note and the L19-L22
  task. High Likelihood topics unchanged.
- **2026-11-17 (Ask Timmy looks up what the notes don't cover, Claude Code, #399)** — Sam: "the outside source would only be
  used when there was something about the content that ask timmy doesnt have an answer for" (exostoses was the example),
  then "we can do web search, the sites and others like them are good to go on the list, no limit on gap answers". When
  the answer from the notes is `not_covered`, `supabase/functions/timmy/core.js` makes a second call (`gapRequest`: Sonnet
  5.5 at effort low, `GAP_RULES`, the basic `web_search_20250305` tool, two searches at most, plain text) and keeps its few
  sentences only when the model searched, didn't answer `NONE`, and every cited source is on `GAP_SITES` (`gapCheck`,
  `gapSite`): the tool's `allowed_domains` didn't filter results when tried. The reply carries `gap: { text, sources }`;
  `widget/ask.js` + `ask.css` draw it in a dashed "Not in your notes · looked up" box with the sources as links (the chat
  waits 75 s now, was 45); the admin page's chat view shows it. Costs: about 4-5 cents and 2-6 seconds a lookup (8 real
  calls tried, 28 cents). Off switch: the secret `TIMMY_LOOKUP=off`. The About page (Ask Timmy, What the hubs record), Ask
  Timmy's site help, the privacy rule (the search words go to Anthropic's search provider), the event taxonomy, the Ask Timmy
  reference, the tests and the eval's grading. The preview answers "what is an exostosis?" with a made-up lookup.
- **2026-11-17 (The large text sizes on a phone: the tab bar and the journeys' scenes, Claude Code, #397)** — The inbox's 320px
  line (BUG-161). The size setting zooms the page (`html` `zoom`, 1.45 at XX-Large), so a phone lays out in about 220-270px.
  `widget/hub.css`: under 290px of bar (`@container hxbar`) the four tabs take their labels' widths at 11px instead of equal
  widths ("Questions" was wider than its tab on any phone at XX-Large). `widget/journeys.js`: `vw`/`vh` don't follow the zoom,
  so the scenes are a size container (`container: shj / size`, not on the design page's inline stills) and size the stage and
  title in `cqw`/`cqh` with `100%` as a cap; `overflow-x` is hidden (the glow and rays scrolled the scene sideways a little at
  every size); the eyebrows break only at their "·"; the small-screen rules also apply as container queries; on a scene under
  420px the hand-off's track starts below Skip, and under 300px it shares the width and the seven ranks wrap. Bundles rebuilt.
- **2026-11-17 (Heme & Endo Exam 3: its 22 figures and High yield narration, Claude Code, #396)** — Sam: "continue with where things
  left off" (the hub was merged without them, #379). 22 anima figures, Fig 1-22 in lecture order: A's endocrine glands and
  the mouth and the lamina dura in hyperparathyroidism; L17's oocyte, first weeks, implantation, estriol and breastfeeding
  reflex; L18's testosterone's two fates, pulsed vs continuous GnRH, clots, the SERM map and the emergency contraception
  window; L19's hematopoiesis, the five white cells, the thymus, the lymph node and the spleen; L20's neutrophil ladder, the
  follicle, smear look-alikes, the head and neck map and five translocations. One module each in
  `tools/figures/heme-endo-exam3/` (the `drafts/` folder is gone), built into `content/figures.js` (2.3 MB, fetched only with
  the notes) and `figures.css`, placed by `FIG_PLACE`, `figByLec` and a "Diagrams" section in each Review group. High yield
  recorded for L17-L20 (after the study guide's rebuild, #393), so every lecture has all three levels. `hubs.js` (Diagrams back
  on the card), the About page's Diagrams entry, Ask Timmy's site help. Vault: the figures task is done
  (`vault/tasks/done/2026-11-16-heme-endo-exam3-figures.md`), the hub note, the L19-L22 task (check L19's and L20's figures
  against their recordings).
- **2026-11-17 (A medal no longer runs over a bought boost; the Bowling trophy on the server, Claude Code, #395)** —
  Two inbox lines. `migration_v63.sql`: **`sh_boost_bump`** (new), called by `sh_medal_check` when a new medal starts its 24
  hours: what's left of the visitor's shop boosts (running or waiting) moves to start when the last medal boost ends, as one
  row (`shop:moved:<time>`); the part already used stays. The medal's `boost_until` is then the moved boost's end (BUG-160,
  the other order of #394's BUG-159). **`record_achievement` takes `bowling`**: `widget/v3.js` sends the bowling egg's trophy
  once (`sh_bowl_trophy` set, `sh_bowl_trophy_sent` not), on `sh:bowl-trophy` or 5 s after a hub page loads, so it pays its
  25 crowns (`sh_wallet` counts the badge) and gets a class share (`get_trophy_stats` counts every kind); the trophy case
  already shows a share when the stats have one. Comments in `bowling.js`, `ranks.js`, `trophies.js`; the preview's medal
  moves its shop boost too; `tools/release/xp.js` (a medal during a boost, a second medal, a medal with none, the trophy once,
  its crowns and share); About page (Double XP, Timmy's shop, Bowling night), Ask Timmy's site help, game-server note.
- **2026-11-17 (Double XP boosts: 150 and 400 crowns, and a boost bought during a medal's waits its turn, Claude Code, #394)** —
  Sam: "Refine what double XP boosts cost" (the inbox). `migration_v62.sql`: `boost-1h` 600 → 150 crowns (Rare → Common),
  `boost-3h` 1,500 → 400 (Epic → Uncommon), from the class's earning rate (Nov 14-17, 77 people: a median study day earns about 95
  crowns, a median study hour about 270 XP; no boost had been bought). **BUG-159**: `sh_buy` started a shop boost at once, so one
  bought during a medal's 24 hours ran under it and doubled nothing; a boost's time now goes after every boost running or waiting
  (extending the last one when it's a shop boost), and `sh_boost_json`'s `until` runs on through a boost waiting right after the
  running ones. `widget/shop.js`: the boost sheet says when it will start ("Double XP is already on until …, so this one starts
  then and runs to …") and the always-shelf's note says so. The shop's art data (`tools/figures/site/shop.mjs` →
  `widget/hub-art/shop.js`), the preview's catalog (`tools/preview/transform.js` now applies a later migration's
  `update public.shop_items set ... where id = ...`) and its buy (`boostEnd`), `tools/release/xp.js` (the prices, the wait, the
  chip's `until`), the About page, Ask Timmy's site help, `vault/reference/game-server.md`. Applied to the live project at the merge.
- **2026-11-17 (Heme & Endo Exam 3: Dr. Herr's study guide, Claude Code)** — Sam: no in-class review for Exam 3; Dr. Herr's
  study guide is "very indicative" and "everything on the study guide should be high likelihood questions". L17-L20: each
  lecture's Exam Hints open with its focus list (`focus` hints in `study.json`), `likelyTopics` rewritten so every question on a
  guide item is High Likelihood (62 topics, 260 of 290 questions; nothing previously High Likelihood dropped), five new
  questions on the thinner items (`hi-sg-platelets`, `hi-tf-sg-neut`, `ll-sg-classify`, `ll-num-sg-leuk`, `ea-sg-pop`), a
  "Study guide" row in Exam info and new Exam Hints wording. Only High yield text changed in the notes (L17-L20 read it in the
  device's voice, so no narration to redo); Lecture A untouched. L21-L22's lists wait in the L19-L22 task note.
- **2026-11-17 (Inbox: tap a word to jump the narration, the highlighter on phones and its colors, retries, crowns on Today, Claude Code, #391)** —
  Sam: "Lets start working on the open to do items. Also for the highlighting fix, can we make sure it works on mobile too".
  **Tap a word** (`widget/hub.js`, Follow along's `tapped()`): while a lecture's narration plays or is paused, a tap or click on a
  word in the notes seeks the mp3 to that word's time from its `.words.json` and plays. It listens on `.reading-prose` itself, not
  the document, because iPhone Safari only sends a tap's click to an element that listens for it (plus `cursor: pointer` on touch
  screens and no gray tap flash, `widget/hub.css`); not on a link, a figure, a highlight or a selection, not after Stop, not with
  Follow along off; a mouse's double-click doesn't jump; a finger gets 10 px of slack, a mouse 3. One tip toast per device
  (`sh_tip_wordseek`); `notes:follow-seek` tracked. **BUG-157, the Highlight button on phones** (`widget/highlight.js`, every hub,
  old pages too): the bar cancels touchstart to keep the selection, which also cancelled the tap's click, so a finger never made a
  highlight since 10-15; it now acts on touchend (a mouse and the keyboard still click). **Retries** (`widget/hub-bank.js`): a missed
  question comes back tinted with a dashed edge and a "Second try" / "Third try" band (`data-try`), one waiting retry per question,
  and `bank:retry-shown` is sent again. **Crowns on Today** (`widget/hub-rewards.js`, `hub-timmy.js` `HX.wallet()`): a tile with the
  bootstrap's `shop.wallet.balance` that opens `#more/shop`, repainted on `sh:shop`. **320px at XX-Large**: Home's ring caption wraps
  under the ring (flex-wrap) and the timeline's words wrap. Bundles and Ask Timmy's site help rebuilt; About page updated. Checked in
  headless Chromium as an iPhone 13, a Pixel 7 and a laptop on the preview's made-up data.
  **BUG-158, highlight colors** (Sam: "Re add the ability to highlight in multiple colors"): on the engine's hubs every highlight was
  drawn gold, because `hub.css`'s `.hx mark.sh-hl` tied with v3.css's pen colors and came later; each pen has its color again (`--hl`).
- **2026-11-17 (Perio report #53, Claude Code)** — `q5-L06` (why a long root trunk is only initially favorable): the
  keyed choice gave only the later drawback, while the favorable half sat in the explanation. Stem, choices and whys
  rewritten so the key names both halves (more loss to reach the furcation; short roots left for resection). Same id and
  key position; High yield unchanged, so no narration to redo.
- **2026-11-17 (The survey and check-in reward goes to 1,000 XP, Claude Code)** — Sam: "Lets up the xp to 1000".
  `migration_v61.sql`: `sh_form_reward` pays 1,000 XP (crowns stay 1,000: `sh_wallet` already leaves a reward row's whole
  base out of the 1-per-10 share), and a one-time top-up moves every reward row paid at 500 to 1,000 and adds 500 to its
  owner's XP (a second run changes nothing; the rebuild agrees). About page, Ask Timmy's site help, a changelog line.
  `tools/release/xp.js` 14c checks 1,000 and the top-up.
- **2026-11-17 (Dashboard contrast with Perio first, Claude Code, #387)** — Once Occlusion archived, Perio became the
  dashboard's first hub and "Release tests" failed accessibility on every branch, `main` included: Perio's `#b4466f` is
  4.05:1 as text on its light tint (`.dx-when`, the timeline's dates) and 4.4:1 under the Timmy Time card's .88-white
  subtitle. `widget/dash.css` now gives Perio the darker text color the hub pages already use (`#9e3a60`, `widget/hub.css`)
  and the subtitle full white, as on a hub's Home. Bundles rebuilt; `node tools/release/a11y.js` passes.
- **2026-11-17 (A reward for surveys and check-ins, Claude Code, #387)** — Sam: "Also give 500xp and 1000 crowns as a reward for
  completing a survey or check in. Only reward for the first submission of each". `migration_v60.sql`: two award kinds, `survey`
  and `checkin`, +500 XP each through `sh_award` (one row per survey and per hub's exam, so a replay, a second check-in or a
  linked device pays once; not boosted), and `sh_wallet` adds 1,000 crowns per reward row while leaving its XP out
  of the 1-per-10 share. `submit_survey` and `submit_exam_debrief` keep their signatures (old pages) and pay too;
  `submit_survey_v2` and `submit_exam_debrief_v2` answer `{ ok, xp, crowns }`.
  Back pay (Sam: "You can implement backpay for the active survey and occlusion check in only"):
  `tools/data-fixes/2026-11-17-reward-backpay.sql`, run by After merge, pays survey 4's answers and Occlusion's final
  check-ins once each (the midterm's don't). The dashboard's check-in and survey cards and the
  Inbox's survey (`widget/replies.js`) say what was paid and refresh the You card; both fall back to the old calls until the
  migration is applied. About page updated (check-ins, surveys, the shop's crowns, More ways to earn XP). Tested in
  `tools/release/xp.js` (section 14c).
- **2026-11-17 (Lessons refresh: Occlusion archived, Claude Code)** — `/lessons-audit` the morning after the Occlusion final. Its
  **retrospective** is in `LESSONS.md` ("Hub retrospectives": 104 people and 439 h for the final, 42% of it on exam day, the evening
  exam's eve; the instrument look-alikes and Hanau's quint the hardest), its **recap is on the dashboard**, and **its narration, High
  yield and Timmy Time came off the site** (51 files, 211 MB; `"audio": "off"` in `content/core.json`, rebuilt, out of `HUBS` in
  `sw.js`, now `sh-v62`): the site is 427 MB. No question or notes changed on Perio or Heme & Endo Exam 3 (Perio's leads are 10 first
  tries each, two days out). Occlusion's last reports (#49-#52) left open by Sam's call. Also: Sam asked that every session can run
  SQL without a prompt, so `.claude/settings.json` pre-approves the Supabase connector's `execute_sql` (and its list and advisor
  tools) beside `apply_migration`. The stale task for the final's format went to `done/` as dropped.
  **The smoke test learned that a hub on the engine can be archived** (Occlusion is the first): it presses "Keep browsing" on the
  archived dialog whenever it comes (it never closed it on the engine's pages, so every run failed from 10 pm on 11-16, `main`
  included), expects no Ask icon on an archived hub (Timmy isn't there, `hub-timmy.js`), and checks Timmy Time's minute on a hub
  whose audio is still up.
- **2026-11-16 (Occlusion Question Bank, Codex)** — Restored **What cusp hits where?** at the top of the base Question Bank (`/hubs/occlusion/#questions`): students can choose **Contacts** or **Movements**, and the existing best-score behavior remains. The game had survived the redesign in the generated figures code, but its mount point had been removed. It is intentionally absent from Learn, Flashcards, Daily drill, Yesterday's misses, Weak spots and the mock; the Occlusion-only `SH_HUB.bank.cuspGame` configuration makes that explicit. `tools/ci/smoke.js` now holds that placement and launcher behavior.
- **2026-11-16 (Occlusion, Claude Code)** — Sam: "fix the open reports in occlusion, send the replies, and merge." The
  drawn figures' base styles (letter pins, lines, labels: `.fg-pin`, `.fg-line`, `.fg-t`...) had been left behind on the old
  page at the redesign's release, so the A-D pins were black dots (unreadable in dark mode); restored in
  `tools/figures/occlusion/od.css` and rebuilt. `mo-orth-occ` rewritten (two choices were the same words swapped) and
  `nc-tf-4` reworded to Dr. Lawson's "night guard". Reports 45-48 resolved with replies.
- **2026-11-16 (Heme & Endo Exam 3 hub, Claude Code, #379)** — Sam: "create the hub for endo exam 3. you can reuse the art
  that was made for endo exam 2. also, the lecture from dr taylor was moved from exam 2 to exam 3. you can reuse what was
  made for his lecture for this exam". New hub `hubs/heme-endo-exam3/` on the engine (Exam 3, Fri 11/20, 8:00-9:30 am, 35
  questions, new material only), **285 questions** over five lectures: **A** Dental endocrinology (Dr. Taylor) brought over
  whole from Exam 2 (58 questions, same `dc-` ids, hints, topics, tables; `vault/tasks/done/2026-11-10-heme-endo-exam3-carry-lecture-a.md`),
  **L17** Pregnancy and lactation and **L18** Estrogens and androgens from their slides and recordings (58 and 59 questions,
  16 quoted hints each), **L19** Introduction to hematology and **L20** Lymphomas and leukemias from their slides (55 each;
  taught Tue 11/17). Every format the rules ask for, every choice with its why, 53 High Likelihood topics, review tables,
  Side by side, processes and Lab Sort sets, a 25-question mock (5 per lecture, at the exam's pace). Narration: As taught and
  Plain English for all five, High yield for A. **Art and arcade are Exam 2's, reused** (Sam's exception to
  every-hub-gets-its-own-art): `tools/figures/site/` gives the hub Exam 2's tint, emblem, masthead and medal
  (`widget/hub-art/heme-endo-exam3.js`), `widget/ranks.js` its medal, and Exam 2's Cycle Arcade is `content/arcade.js` with
  this hub's scores (the Path Lab Escape moved to the week of Exam 3). Wired into `hubs.js` (first card), `sw.js` (`HUBS`,
  `sh-v61`), the admin page's and recap's labels, `budgets.json`, the About page's arcade entries, and CI's figure check.
  **Not done, merged early because Sam was running out of usage** ("merge before i run out of usage, we can finish the rest
  when it resets"): the 22 figures Sam approved (drafts in `tools/figures/heme-endo-exam3/drafts/`) and High yield
  narration for L17-L20 (`vault/tasks/2026-11-16-heme-endo-exam3-figures.md`); L19 and L20 to taught and L21 and L22, whose
  slides weren't posted (`vault/tasks/done/2026-11-16-heme-endo-exam3-l19-l22.md`). Not used (graded-coursework): the Exam 3 Anki
  deck in Drive, "Resources from D3s", Quiz 4 (open until 11/19). Hub note: `vault/hubs/heme-endo-exam3.md`.
- **2026-11-16 (Time in Learn and in Flashcards, told apart from the Question Bank, Claude Code, [#381](https://github.com/smcmurry6-source/study-hubs/pull/381))** — Sam asked
  "do we have tracking for how people do questions between the bank, learn, and flashcards", then "i want to see where people
  spend the most time between the three", then "yes do it. merge when ready". Nothing students see changes. The engine logged
  all three as `compendium/bank`, so the admin page's time by section couldn't split them (a first day's estimate from answer
  and rating timing: about 94% of the time in the bank, 5% in Learn, under 1% in Flashcards). Now `section()` in
  `widget/hub.js` sends `compendium/learn` or `compendium/cards` while the bank is studied as Learn or Flashcards (on any set
  but the mock, the launcher and the full-screen session alike), and `migration_v59.sql` (applied through the connector)
  replaces `sh_surface()` with the surfaces `learn` and `cards`, and places the redesign's other sections the lessons audit
  found unplaced (`compendium/drill` and `compendium/misses` as `drill`, `more/timmy` as `podcast`, the rest of More as a
  new `more`; days already recorded are placed too). It also keeps Learn's answers as context `learn` in `answer_xp`
  (they were `other`; nothing pays by it). The admin page's Insights → "Where time goes" has Learn, Flashcards and More
  columns. Tests: `tools/release/admin-ops.js` checks 26 section names, `tools/release/xp.js` Learn's context and pay.
  Bundles rebuilt; the event taxonomy, game-server, Insights notes, decisions and the inbox (two lines ticked) updated.
- **2026-11-15 (Perio: `q7-07` retired, Claude Code, the lessons audit's follow-up)** — Report #44 ("too many details for a
  non-MC question"): `q7-07` was a self-graded recall card listing the immune changes smoking causes, which `q7-03` and
  statement 2 of `q7-N03` already ask; the final has no recall items, and the bank audit's own rule retires a recall card that
  repeats a scored item's fact. Sam: "retire it". Out of `questions.json` and the smoking topic's `ids` (core.json and the seven
  questions that carry a copy); `q7-07 retired` in `tools/question-ids/perio.txt`; 670 → 669 questions. S7's High yield
  ("8 questions in the bank" → 7) recorded again (`audio/implants-perio-hy.mp3` and its words file). The class's numbers on
  the other questions are untouched (nothing moved).
- **2026-11-16 (PCD Implants Exam 1, MSK Exam 3 and GI Exam 2 check-ins closed, Claude Code)** — Sam: "close the check
  ins for implants, musculoskeletal 3, and gi 2". `checkinClosed:true` on each exam in `hubs.js` (`pcd-implants-exam1`,
  `msk-exam3`, `hepatobiliary`); `pastExams()` in `widget/dash.js` skips them, so they leave the Exam check-ins panel in
  Past hubs and the pop-up no longer goes out. Answers already sent stay on `review/` → Check-ins. The hub pages, their
  recaps and the other open check-ins (Heme & Endo Exam 2, the Occlusion midterm and final) are unchanged.
- **2026-11-15 (Question Bank: 50, 100, 200 or all at a time, every card numbered, Claude Code, #373)** — Sam: "Lets implement the numbering of
  the questions in the question bank idea" (a classmate: "adding question numbers so we know how many more are left ... if
  it's like 80+ questions I'm not just scrolling forever and I could maybe take a break when I hit #40"; also on the idea
  board), then "I want the questions to be shown in intervals of 100 unless there are less questions than that in the
  filter. Showing all 844 feels unmanageable", then "an option by the filters with how many questions to show at a time.
  50/100/200/all questions". **At a time**, beside Order in the panel: 50, 100 (to start), 200 or All (`STATE.ui.qsize`). A
  longer list is shown a set of that size at a time: above it, "Questions [101–200] of 845" with Previous, Next and a
  picker for any set (`.qsets`); at the end of a set, "That's questions 1–100 of 845" and **Next 100 questions**, which goes
  to the top of the next set. Every card starts with **"Question 12 of 100"**, its place in the set (fewer than the size,
  one set: "of 84"; All: "of 845"). Inside a set the cards still come fifty at a time and
  load by themselves (Sam's 11-14 call). The bank keeps its place while the filters stay the same (`STATE.ui.qpage`, the
  set's first question, so a new size keeps it: 101–200 becomes 101–150), except
  Not answered yet and Missed last time, which start at their first set. The Daily drill counts the ones done today (with 5
  done, its first card left is "Question 6 of 20"); Yesterday's misses and Weak spots count from 1; the mock's existing
  "Question n" gains "of N". "Try it again" keeps the number; the missed question that comes back a few cards later has
  none; Learn and Flashcards keep their own progress. New events `bank:size=` and `bank:page=next|prev|pick|end`. `widget/hub-bank.js`
  (`qNum()`, `setsBar()`, `toSet()`, `page()`), `widget/hub.css` (`.qc-n`, `.qsets`, `.qset-end`), bundles rebuilt.
  Found in testing and fixed: BUG-154 (the number crowded the lecture chip on a narrow phone) and BUG-155 (Next 100 left a
  phone at the bottom of the new set: scroll anchoring). The single-file engines weren't touched: every hub still on one is
  archived. About page ("Questions"), the bank's rule note, decisions, the event taxonomy and the inbox updated. **After the
  merge** (the After merge workflow, #375): Ask Timmy deployed again for the About page's new words
  (`supabase/functions/timmy/site.json`), the post-check, and the changelog lines for Occlusion and Perio
  (`tools/after-merge/changelog.txt`).
- **After merge: the after-merge steps run by themselves (2026-11-15, Claude Code)** — Sam: "for the after the merge, lets
  make all of that automatic." A new workflow, **After merge** (`.github/workflows/after-merge.yml`), runs
  `tools/after-merge/run.js` on every push to `main`. The script works out from git what the push changed and does only
  what that needs:
  - **answer keys:** a changed hub bank's keys load;
  - **Ask Timmy:** the function deploys when `supabase/functions/timmy/` changed, then gets one real question (it fails on
    a nap);
  - **Timmy Time:** a new episode (or a new length) is registered;
  - **pages:** it waits up to 15 minutes for GitHub Pages to serve the push;
  - **data fixes:** a fix the push added to `tools/data-fixes/` runs once, after the pages are live;
  - **changelog:** each line the push added to `tools/after-merge/changelog.txt` (`<hub> | <message>`, the new home of
    the changelog line) is logged;
  - **post-release check:** `postcheck.js` runs.

  Each run's summary is a table of the steps. A missing secret shows as "blocked", and either a blocked or a failed step
  turns `main` red. The secrets go in the repository's `after-merge` environment, limited to `main`, so no pull request's
  workflow can read them; **Sam adds them once** (the inbox). The logs are public, so it prints no secret and no row of
  data. `tools/after-merge/test.js` checks the plan on made-up pushes in "Check hubs". It was dry-run on #361, #366, #369
  and #371, and every plan matched what those merges needed.
  **First real run, by hand, for #370:** 845 Occlusion keys loaded, Ask Timmy version 6 (its question answered), Pages
  live in 61 s, both data fixes run (#370's and the 11-14 `in-bennett` one, which had never run), the post-release check
  passed, and the changelog line logged. Docs: [after-a-merge](vault/how-to/after-a-merge.md), ship-a-change steps 3, 7
  and 8, build-a-hub's answer keys, ask-timmy, secrets, the release plan, the PR template, and the podcast and
  lessons-audit skills. **Not automated:** migrations.
- **2026-11-15 (the Plaque Boss gets its own band on the redesign's hubs, Claude Code)** — Sam: "Refine the question bank
  monsters ui appearance. It looks like its messing up other buttons." Since the release, the boss docked itself inside the
  engine's top bar (`widget/eggs.js` `bossDock()` found the page's sticky `<header>`, the bar's one row of buttons): on a
  phone it squeezed the bottom tabs to 4-11 px with their labels piled up, on a laptop it ran off the screen
  ([BUG-153](vault/release/bug-log.md)). Now, on Occlusion and Perio, it is a band of its own right after the top bar (laptop,
  tablet) or the top strip (phone), sticky under it and moved when a phone turns (`placeBoss()`), tinted with the boss's
  own color in the engine's type and tokens (`widget/hub.css` `.sh-egg-boss.is-band`: face, name, HP bar, HP, its line on
  a laptop, a 32 px ×). While it's up, eggs.js sets `--boss-h` on the page, and what sticks under the bar moves down by it
  (the lecture list, the bank's side panel, the mock's clock, a pinned figure, Ask Timmy's panel in `widget/ask.css`). The old
  single-file hubs' docked strip is unchanged. Bundles rebuilt; About page's Plaque Boss line reworded. No schema change.
- **Occlusion: the final's question bank audited, and a mock that leans on High likelihood (2026-11-15, Claude Code, [#370](https://github.com/smcmurry6-source/study-hubs/pull/370))** — Sam:
  "audit occlusions question bank to see if we can make it higher yield ... accurate, with good answer options and sufficient
  explanations", then "make sure the exam hints are utilized as best as possible". Every L6-L10 question checked against the
  notes and the Exam Hints. **156 questions fixed** in place (ids kept): 4 that the notes contradict ([BUG-152](vault/release/bug-log.md):
  `cs-in-crown-lab`'s case, `nc-sel-acid`, `mo-histo`, `ot-sel-clin`), keys that were the longest choice trimmed, giveaway and
  arguable distractors rewritten, whys and explanations completed, professors' words quoted where a hint backs the point. **Every
  emphasized hint is now tested**: 4 new questions (`in-worth`, `mo-joint-load`, `mo-splint-cause`, `dn-wf-skel`), weak ones
  re-aimed, 3 new High likelihood topics for L7's orphan hints (the splint as an environment of healing, painless wear, a
  traumatic force), and topics renamed, added to and trimmed across L6-L10 (63 in all). **Retired** on Sam's call: `mo-better-q`,
  `mo-swim`, `in-2s-4` (kept: `mo-bell`, `mo-occupational`, `ot-tf-4`, `ot-tf-5`, `dn-tf-6`). 845 questions. **The mock**: 7 of each
  lecture's 9 from its High likelihood questions (Sam: "mostly high likelihood. Like 75%"): `core.mock.likelyShare` (0-1),
  read by `buildMock()` in `widget/hub-bank.js` for any hub that sets it, each side unseen and missed first, topped up from the
  other side when short (L10 is all High likelihood: 9 of 9). The mock's blurb and the About page's High Likelihood entry say
  so; Ask Timmy's site help rebuilt. High yield rebuilt and **recorded again for all five final lectures**. Class data:
  `tools/data-fixes/2026-11-15-occlusion-audit.sql` (73 rewritten choices' picks, 8 re-aimed questions' "% right", recounted
  from the new versions' answers) runs once after the merge. Sam's calls on its two open questions: the splint follows Dr. Givan's slides, and L10 keeps "Miller" as
  Dr. Abou-Arraj's slide has it ([decisions](vault/decisions.md)); after-merge steps: [the inbox](vault/tasks/inbox.md);
  what the next audit needs to know: "The final's bank audit" in [the hub note](vault/hubs/occlusion.md).
- **2026-11-15 (Perio: the question bank audited for the final, Claude Code)** — Sam: "audit perios question bank to see
  if we can make it higher yield ... accurate, with good answer options and sufficient explanations. Make sure the exam
  hints are utilized as best as possible." Every question was read against its session's notes, hints, review tables
  and cram lines (one reviewer per session, every proposal checked against the notes before it went in). **750 → 670
  questions**: 263 edited in place (30 accuracy fixes to explanations, why lines or choices, e.g. `q8-03`'s second right
  answer, `q9-07`'s Type 1B treatment, `q6-L07`'s "well contained"; 113 answer-choice fixes for giveaways and
  throwaways; 85 thin explanations; 22 clarity; 13 format, such as 2- and 3-pair matching items brought to 4), 103
  retired under Sam's "not more than twice" bar (76 repeats, counting statements and across sessions; 27 trivia with no
  exam signal), 23 new (`q<n>-F01`..., 8 select-all and 5 matching, the final's formats) where an emphasize hint had no
  question on its own point. Two new High likelihood topics (S4), none removed; 460 questions tagged (was 424). The
  key is the longest choice in 15% of MCQs (was 24%). Notes, hints and review tables unchanged, so As taught, Plain
  English and Timmy Time stand; **High yield changed in all nine sessions and was narrated again**
  (`audio/<lecture>-hy.mp3` and words files). Every retired id is listed with its reason in
  [the audit's note](vault/tasks/done/2026-11-15-perio-bank-audit.md), with eight notes issues for Sam (none changes a key).
  Merged as #371 (Sam: "Merge when ready"; and on the notes: "Leave the 8 spots", the 27 retirements stand). **Done at
  the merge:** `node tools/xp/keys.js perio --load` (670 keys loaded, 103 retired), `log_changelog` for Perio, and
  `node tools/release/postcheck.js` passed (21 of 21 files live, the dashboard and Perio with no errors).
- **Occlusion: Timmy Time for the final, in the midterm episode's place (2026-11-15, Claude Code)** — Sam: "Podcast for occlusion final. Replace the midterm with it." A 48-minute episode (`final-review`, 11 chapters) on L6-L10: articulators and the facebow, the records, functional disturbances and TMD, splints, mobility, wear and bruxism, keeping a denture in, balanced, non-balanced and lingualized, Dr. Lawson's NCCLs and Dr. Abou-Arraj's occlusion and the periodontium, then a 27-question lightning round. Written from the hub's own notes, Exam Hints (quoted word for word), cram sheet, High Likelihood topics and LESSONS.md's live signals (the Bennett angle and the fossae, the facebow's level, "less bone, but a bigger arch", both Miller scales). Script `tools/podcast/occlusion/script.md`; the midterm's moved to `midterm.md`; mp3 `hubs/occlusion/audio/timmy-time.mp3` (replaced, 34 MB, -16.4 LUFS); `podcast` in `content/core.json` with one lore comment (the toothbrush by the door); the dashboard's `sub` and the About page's episode list. Lexicon: A-D-A, R-D-A, N-C-C-L(s), Abou-Arraj's, kinematic, periodontitis, periodontics, Realeff, orofacial, and the verbs "ever use" and "don't use". Lore (LORE.md): thirty-one's one-tooth night guard, his self-checked mobility, the toothbrush vindicated by L9. Merged as #366 (Sam: "Merge"), after a rebase onto #367: both PRs' About lines, lore, lexicon entries and decision rows kept. **Done at the merge:** `admin_set_podcast_episode(..., 'occlusion', 'final-review', 2863)` (listening earns XP), `log_changelog` for Occlusion, and `node tools/release/postcheck.js` passed (4 of 4 files live, the dashboard and Occlusion with no errors). Then, on Sam's OK ("Merge and ok"), the `timmy` function was deployed again for the new site help (`node tools/timmy/deploy.mjs`, version 5), which the session's permission check had first stopped.
- **2026-11-15 (Timmy Time: the Perio final episode, Claude Code)** — Sam: "Podcast for perio final. Replace the midterm
  with it." Perio never had an episode, so this is its first, for the final (Thu Nov 19); Occlusion's midterm episode
  stays (Sam's answer, [decisions](vault/decisions.md)). A 49-minute (49.1) review: `hubs/perio/audio/timmy-time.mp3`
  (35 MB, -16.4 LUFS, 96 kbps), script `tools/podcast/perio/script.md`, from the hub's notes (As taught), Exam Hints (every
  professor quote word for word; Dr. Kaur's final focus as a paraphrase, as the hub has it), the cram sheet, the High
  Likelihood topics and LESSONS.md's live signals (the select-all on what SRP aims for, the closest furcation entrance
  mixed up with the narrowest). 13 chapters: S1-S3, S4 (with the instruments, in for the final), furcations, resective
  surgery, regeneration, implants (health, mucositis and peri-implantitis read case by case), antibiotics, host
  modulation, recession and grafts, gingival excess with crown lengthening and the esthetic norms, a 32-question
  lightning round and the sign-off. S1-S4 take 16% of it, as the final's split does. Left out on the Nov 12 review's word:
  suture techniques and pictures, Miller & McEntire, entrance widths and the doses (it says Dr. Litz's "know the chart" was
  superseded). Lore (Sam took all four): Timmy's own furcation (a lower first molar's two entrances, about 2.5 mm down, and
  its mesial root concavity), thirty-one stages himself with a toothpick ("You're not staged. You're anxious."), may have
  an enamel projection and wasn't Dr. Kaur's thirty-one, the toothbrush's big episode, and the pie after the release.
  Two lore comments (rolled): thirty-one and the toothbrush by the door. `lexicon.json` gains 43 entries (gingiva,
  gingival, gingivitis, gingivectomy and mucogingival, which espeak read with a hard g; Kaur, Geurs, Caton, McGuire,
  Salud, debride, digoxin, the cyclines, PerioChip, Periostat, Arestin, and `C-A-L`, `P-G-A`, `E-D-T-A`, `F-D-A`,
  `D-F-D-B-A`, whose final A read "uh"; narration made from now on gets them too). Hub: `content/core.json`'s `podcast`
  (id `final-review`), so Home's Timmy Time quick link and More's tile appear; dashboard card gets `podcast` and "Timmy
  Time" in modes; About page's episode list, `supabase/functions/timmy/site.json`, `LORE.md` and the hub note updated.
  The title is "Perio final: ..." ("Periodontology" broke mid-word on Home's phone tile). Shared fix with it
  ([BUG-151](vault/release/bug-log.md)): the small line on a hub's Timmy Time tiles (Home and More, `widget/hub.css`) is full
  white, since 86-88% white on Perio's pink failed the 4.5:1 contrast check.
  Merged as #367 (Sam: "Merge"). **Done at the merge:** `admin_set_podcast_episode(..., 'perio', 'final-review', 2948)`
  (listening earns XP), the `timmy` function deployed again for the new site help (version 4), `log_changelog` for Perio,
  and `node tools/release/postcheck.js` passed (6 of 6 files live, the dashboard, Occlusion and Perio with no errors).

This list is intentionally short — it's an orientation aid, not a full
changelog (that's the Supabase `changelog` table / dashboard "What's New"
box) or a per-hub history (that's each hub's own manifest doc, kept in its
Claude Project).

## Why this file exists

Sam runs one Claude Project per hub plus a separate "hub index" Project for
cross-hub/UI work. A change made in the index Project (e.g. adding the Active
Recall tab and the shared widget) can silently collide with a change made the
same week in a single hub's own Project (e.g. mining a new lecture transcript
into Hepatobiliary), because neither session has any way to know the other
ran. There's no mechanism to make Claude Projects "talk to each other" — the
fix is procedural: treat this repo as the single source of truth, always
re-pull before you push, and put anything cross-hub here or in `widget/`
instead of copy-pasted into individual hubs.

Since 2026-11-03 the same fix covers knowledge, not just code: rules, decisions, hub notes and tasks live in
`vault/` as linked notes any agent can read and write back to (`vault/rules/repo-is-the-vault.md`).
