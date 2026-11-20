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

- **The redesign is live (#359 merged 2026-11-14, about 6:46 pm Central; Claude Code)** — Sam: "Merge". The dashboard,
  Occlusion and Perio are on the redesign at their old addresses (`d86f134`); Heme & Endo Exam 2 keeps its old page.
  Done at the merge, in the release note's order ([the release](vault/tasks/done/2026-11-06-redesign-release.md); its Log's
  last entry has the detail): `FULL_FROM` in `widget/pet.js` is `"2026-11-14"`; **`migration_v54.sql` to
  `migration_v58.sql` are applied** to the live project (each file sent whole, as one transaction, through Supabase's
  management API with the access token in the session's environment, because the connector can't take a file: so they
  aren't in Supabase's own migration list, and `supabase/schema.sql` is the record); the switch time
  (`game_config.v2_at`) is 2026-11-15 00:39 UTC; **the answer keys** are loaded (Occlusion 844, Perio 750);
  Occlusion's episode is registered (2688 s); **eight starting ideas** are on the board; **the `timmy` function is
  deployed** (JWT verification off); the live permissions audit is clean; `node tools/release/postcheck.js` passed;
  the site changelog has the release.
  **BUG-150, found after the merge and fixed in about four minutes:** Ask Timmy answered "I nodded off" to every
  question, because the key Sam saved in the function's secrets is named `TIMMY_EVAL_KEY`, not `ANTHROPIC_API_KEY`.
  `supabase/functions/timmy/index.ts` now reads that name when the first isn't set.
  **Two new commands for the two steps that are by hand after a merge:** `node tools/xp/keys.js <hub> --load` (a hub's
  answer keys, after every merged change to its questions) and `node tools/timmy/deploy.mjs` (Ask Timmy's function,
  after every merged change to `supabase/functions/timmy/`, which the About page's site help is part of).
  **To roll back:** revert #359 with a new PR and leave the database as it is
  ([roll-back-a-release](vault/how-to/roll-back-a-release.md)); Ask Timmy has his own switch on the admin page.
- **The release PR takes in `main` (#359, 2026-11-14, Claude Code; live from the merge)** — Sam: "I believe I updated
  the occlusion hub and the perio hub". #361 (the lessons refresh), #362 (Perio's Nov 12 class, the review for the
  final and Figs 6-8) and #363 (Ask Timmy on Sonnet 5.5) were written for the old pages and `next/`; they are now in
  the switched tree. **Occlusion's and Perio's content** (`hubs/<hub>/content/`) is `main`'s, key for key (the 22 new
  and 36 retired Perio questions, the session notes, the hints, `in-bennett`, `dn-support`, `dn-resorb-mand`), with
  Perio's three new figures in `content/figures.js` and its re-recorded audio. **The engine's exam-format mock** learned
  what Perio's final needs (`formatMock` in `widget/hub-bank.js`): **matching items** (`mock.format.match`; a list
  beside each row, every pair scored by itself, kept in `STATE.mock.picks[id]` by row) and **the midterm's share**
  (`midShare` of each kind from the lectures numbered up to `midThrough`; Perio: 0.15 and 4). Special Patient Care is
  in `archived` in `hubs.js` and out of the About page, the budgets and the baselines, as on `main`. The bank's page
  is 50 (`main`'s change to `hub-bank.js`). `sw.js` is `sh-v60` (`main` shipped `sh-v59`). Both branches had logged a
  BUG-130 and a BUG-131: `main`'s keep the numbers, the release's are BUG-148 and BUG-149.
- **The release PR's fourth round: smooth scrolling (#359, 2026-11-14, Claude Code; live from the merge)** — Sam on
  the preview: "scrolling and things are kind of sluggish and jittery" (BUG-147; what was measured and what was
  learned: [motion-cost](vault/reference/motion-cost.md)).
  - **The dashboard's drawn pictures move when you arrive, then rest** (`lifeWatch` in `widget/dash.js`): the "you"
    card's place, the classroom, the stage, the road, the idea board's header and Past hubs are alive for 8 s (`LIFE`)
    when they come on screen, when a scroll ends on them and under a mouse; they rest at once when a scroll or a touch
    starts, behind an open window and off screen. `.is-rest` takes the animations inside a drawing away
    (`widget/dash.css`), which frees their layers (310 on the page before, 23 at rest now); `.is-away` stops
    everything else in a part that is off screen. Nobody walks in or out of the classroom while it rests.
  - **The picture of Timmy's place** on a card is a still with the moving one drawn over it in a shadow root
    (`.tpc-live`; it was one animated image). A page puts `.is-rest` on `.tpc-live` to take it away; its stars hold
    still. **The full view's stage** holds while anything in the window scrolls and, in Customize, rests 5 s after the
    last change. **The customizer's rarity frames are stills.**
  - **The shop** (`widget/shop.js`, `shopLife`): every moving frame and the storefront's two layers have a still under
    them; the moving ones show for 6 s after it opens, after a scroll ends and under a mouse.
  - **A crown medal's glint** (`widget/ranks.js`) is a glow whose opacity moves; it was an animated filter.
  - The little Timmys in the classroom and on the stage no longer blink or sparkle (63 layers nobody could see).
  - Scrolling the whole dashboard under a 4x slower processor: 59 → 17 ms a frame (phone-size), 81 → 19 (laptop-size).
- **The release PR's third round (#359, 2026-11-14, Claude Code; live from the merge)** — two more of Sam's calls
  from the preview ([decisions](vault/decisions.md), 2026-11-14):
  - **Timmy's place, the full view** (`widget/place.js`, `widget/place.css`): one theater-look window for your own
    place and a visit. The dialog sets the design tokens for everything inside (`--ground`, `--row`, `--text`...), so
    it is dark in both themes; the stage and its Close-up chip sit in `.tpv-frame`; your own panel is `hostCard()`
    (Timmy today with an HP meter, Customize and Shop, the rank plate, the medals); the customizer's foot is sticky on
    a laptop and has Done (`data-tp="done"`). The window is larger (1240 by 820 at most) and stacks on an upright
    tablet. Every button still carries a fixed `data-tp`. `.tpv button { color: inherit }` beats a one-class rule, so
    a button inside the window that needs its own color is written `.tpv .name`.
  - **The customizer's cards are in the shop's rarity frames** (Sam: "reuse the rarity art instead of just having
    'legendary' in yellow"): `shopArt()` in `widget/place.js` fetches `widget/hub-art/shop.js` the first time
    Customize opens and `rframe()` draws `SH_SHOP_ART.frame(rarity)` behind each card (`.tpv-card.is-framed`, laid
    out like the shop's `.tsh-card`); without the art the cards are plain, as before. Nothing more loads with a page.
  - **The Preview workflow** no longer fails when a deploy that worked prints no alias address (BUG-146).
  - **The dashboard's closed-hub cards are gone** (`widget/dash.js`: `renderArchived()` only draws the check-ins and
    Past hubs' note; `#archived` and the `.dx-arch*` styles are removed). Past hubs is the exam check-ins and the
    recaps. `tools/release/admin-ui.js` now expects no tab and no link for an archived hub.
- **The release PR's second round (#359, 2026-11-13, Claude Code; live from the merge)** — what Sam asked for after
  using the preview ([decisions](vault/decisions.md), 2026-11-13), all in the same PR:
  - **Dashboard:** the You card's rank is a hero on dark plum (`renderMyRank()`), the wallet and stats match, and
    **The road** (`#road`, `renderRoad()`) lays out the three journeys rank by rank in place of the folded ladder; one
    **Exam check-ins** panel at the top of Past hubs (`renderCheckins()`; archived rows no longer carry the button); the
    Timmy Time card is animated again; the idea board has a banner; the pedestals' wreath sits around the numeral
    (`tools/figures/site/stage.mjs`); a hub's panel slides in on a tab change.
  - **Trophy case:** a shelf per hub with its eight (`widget/trophies.js`; badges stay `"<trophy>:<hub>"`).
  - **Hubs on the engine:** "All hubs" in the bar and "Hubs" on a phone's top strip (`.hx-back`, `.hx-home`); pages
    slide in from their tab's side (`route()` in `widget/hub.js`).
  - **Learn and Flashcards** (`widget/study-modes.js` + `.css`, `widget/hub-bank.js`): a launcher in the bank, above
    the "Which questions" panel, and a **session over the whole screen** (`openFocus()`): numbered tiles, "Don't
    know?" and Auto-next in Learn; swipe, arrows and a session summary in Flashcards. Tests that drive them click
    `[data-sm="start"]` first.
  - **Motion:** the block at the end of `widget/hub.css` (pop-ups rise, pages slide; zero-specificity `:where()` rules
    with `translate` / `scale`, so a pop-up's own transform and entrance are left alone; `html.hx-still` turns it off,
    set by `widget/hub.js` and now `widget/dash.js`).
  - **Heme & Endo Exam 2:** archived (`archiveOn` noon Nov 13 in `hubs.js`) and its audio off the site (173 MB).
- **THE REDESIGN'S RELEASE (the switch PR, #359, opened 2026-11-13, Claude Code; live from the merge)** — **Read this before
  touching the dashboard, Occlusion or Perio: the files moved.** One PR switches the site to the redesign
  ([the release](vault/tasks/done/2026-11-06-redesign-release.md)); reverting it brings the old site back
  ([roll-back-a-release](vault/how-to/roll-back-a-release.md); the database stays as it is, the old pages run on it).
  - **The pages:** `index.html` is the new dashboard (its hub list is **`hubs.js`**, edited by hand: add, date or archive
    a hub there, not in `index.html`); `hubs/occlusion/` and `hubs/perio/` are on the engine, their old single-file pages
    gone. `next/` and every `hubs/<hub>/next/` are gone. **Heme & Endo Exam 2 keeps its old page** (Sam: its exam was the
    13th) and its new version was deleted, with the 59 MB of High yield recordings only that version played.
  - **A hub's content is its JSON** (`hubs/<hub>/content/`): edit it there, then `node tools/hub-next/build.mjs`
    (the question index, High yield, one layout; CI's `--check`). `tools/narrate.py`, `narration_words.py`, the figure
    builds (they write `content/figures.js/css`), `tools/ci/cases.js`, the smoke lint, `tools/xp/keys.js`,
    `tools/podcast/extract_hub.js`, `dump-banks.js`, `publish-recap.js`, the preview and Ask Timmy all read it.
    `tools/dash-next/` is gone. New hubs: [build-a-hub](vault/how-to/build-a-hub.md), rewritten.
  - **After a merge that changes a hub's questions, load its answer keys** (`node tools/xp/keys.js <hub> --sql`): the
    server grades and pays from its own copy. A new Timmy Time episode is registered with `admin_set_podcast_episode`.
  - **The database:** `migration_v54.sql` to `migration_v58.sql` (the game layer, Ask Timmy, Learn and Flashcards, the
    random visit, and v58, new: hidden ideas are deleted after 90 days by the weekly retention job) are applied at the
    merge and are in `supabase/schema.sql` after a marker line; `supabase/pending-migrations.txt` is empty.
  - **Shared widget files, on every page (the archived hubs' too):** **Full Arch is retired** (the chart, its switch
    and its code are gone; 23 trophies on an old page, 27 on the redesign; whoever won it keeps it as "retired").
    **Everyone has Timmy**: no adoption, introduction, "Tap me!" or holiday outfits in `widget/pet.js`; he wears what
    is on at his place (on an old hub's page, the outfit kept on the device, or nothing). `FULL_FROM` in `pet.js` is
    the release day. BUG-112 fixed (the medal button's label for two or more medals). The run flame has its own
    switch in the new Settings.
  - **`sw.js`** (`sh-v60`): precaches the dashboard, the bundles, the files fetched on first use and each engine hub in
    its `HUBS` list; a hub's content JSON is served from the cache and refreshed behind it (**a content edit shows on the
    load after the one that fetched it**). A new engine hub adds itself to `HUBS`; `tools/ci/syntax.js` checks it.
  - **The About page** is rewritten for all of it (27 trophies, 16 secret), and Ask Timmy's site help rebuilt from it.
    Rules and how-tos rewritten for the engine: hub-home-page, arcade-skins, question-bank-filter-panel,
    every-choice-gets-a-why, archived-hubs-drop-their-audio (`"audio": "off"` in `core.json`), build-a-hub,
    narrate-with-kokoro, the repo map, shared-infrastructure, `/podcast`, `tools/podcast/LORE.md` (his place).
  - Tests: the smoke test on every hub, `node tools/release/run.js` (the report is in the PR). Left to do:
    [the inbox](vault/tasks/inbox.md) (what the old pages still hold up, keys and the function loaded by hand, the
    first migration after the release, the hub trophies' shelf: Sam's call).
- **2026-11-14 (Ask Timmy's model, Claude Code)** — Nothing students see changes (Ask Timmy starts at the redesign's
  release). Sam: "Lets do sonnet": the `timmy` function's model is Sonnet 5.5, not Opus 5.5, after the eval ran the whole
  test set on Sonnet 5.5 and Haiku 5.5 (`--model`, new): Sonnet matched Opus at half the cost and twice the speed; Haiku
  deflected more. `core.js` also prices both models for the day's cap. [#363](https://github.com/smcmurry6-source/study-hubs/pull/363),
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md).
- **2026-11-14 (Perio: the Nov 12 live class and the review for the final, Claude Code)** — Sam: "Update the perio hub with the
  added google drive contents", with Dr. Abou-Arraj's furcation email. **S9** now has the live class: its notes' slides-only tail
  became 15 paragraphs from the class at both levels (gingival excess and drug enlargement, the gummy smile, altered passive
  eruption with A as 1.5-2 mm, crown lengthening by type and his Patient 1, the esthetic evaluation, the tattoo), his answers on
  the recording went into their paragraphs, both S9 mp3s were regenerated, 22 questions were added (`q9-L37`-`L52`, `T11`-`T14`,
  `S06`-`S07`, `N05`), 9 hints, the topics re-ranked, Review, cram, mind map and Figs 4-5 brought in line, and the task moved to
  done. **The review for the final**: the format (60-65 questions, about 15% from S1-S4, an hour and a half that can be two, no
  suture images, few or no Patient Box) in an S1 hint, a new final card on Home (`FINAL_FACTS`), `COURSE_GRADING` and the mock
  (`EXAM_FORMAT` 62 in 90 minutes, 3 matching, `midShare` 0.15 via `drawSplit()`); what to know and skip as hints and session
  `note`s for S1-S5 and S8; **36 questions retired** under dont-ask-what-professors-skip (S2 suture techniques and pictures, S3
  Miller & McEntire, S5 entrance widths, S8 doses; Dr. Litz's "know dosing" hint marked superseded), `q3-07`, `q2-P01`, `q2-P02`
  rewritten (same ids). High yield re-recorded for S1-S5, S8 and S9; `next/` rebuilt with the final's chips, banner and blurb.
  Engine mock's matching and 15% split: a box in the release task. Then Sam: "Yes to all figures and anima": three new S9
  figures (`tools/figures/perio/`, under the S9 notes and in Review): Fig 6 `excess` (pseudopocket or drug enlargement,
  then hygiene or a gingivectomy), Fig 7 `clsteps` (crown lengthening step by step, or a gingivectomy alone that grows back),
  Fig 8 `smile` (the esthetic checklist on an ideal smile and Patient 1 before and after); the About page's Perio diagrams
  entry lists 15. Dr. Kaur's word for her part of the final (peri-implant health, mucositis and peri-implantitis) is a
  line on Home's final card. ([hub note](vault/hubs/perio.md))
- **2026-11-14 (Lessons refresh follow-up, Claude Code, same PR)** — Sam: "do another sweep", then the calls below. **Special Patient
  Care is off the site** ("remove everything for it"; no recap, no retrospective): `hubs/special-patient-care/` (page, audio, images)
  deleted, its precache line out of `sw.js` (`VERSION` sh-v59), its arcade board out of the dashboard's `ARCADES`, its `HUBS` entry
  moved to `ARCHIVED_HUBS` (no card, no check-in), its About page entries out (the arcade table's column, Home, check-ins, filters,
  pins), `next/hubs.js` and Timmy's `site.json` rebuilt, its perf budget and accessibility baselines dropped; its question-id list and
  drawn art stay, and a stub in `LESSONS.md` says why it has no retrospective. **The Question Bank shows more at a time**: 100 a page
  in every single-file hub (`BANK_PAGE`, was 30; opening the bank on a throttled phone: about 0.2-0.3 s against 0.15 s) and 50 in
  the redesign's bank (`widget/hub-bank.js`, was 20; bundles rebuilt). **Occlusion `in-bennett`**: "Cusp height" became "How
  steep the cusps can be in protrusion" (data fix after the merge). The sweep found no new reports, no new question-health flags
  on the live hubs and the live site identical to `main`; it closed the finished Heme & Endo Exam 2 L17-L18 task and added a 9th
  check-in to that hub's retrospective.
- **2026-11-13 (Lessons refresh, Claude Code)** — `/lessons-audit`, data read 9 pm Central, the evening of Heme & Endo Exam 2.
  **Heme & Endo Exam 2 is archived** (10 pm tonight): its retrospective is in `LESSONS.md` (86 people and 360 h, the most of any hub;
  9 check-ins, 5 "About right", none "Exam asked different things"), its recap went up on the dashboard (`tools/publish-recap.js`),
  and its narration, High yield recordings and Timmy Time came off the site (232 MB; the site is 533 MB): `data-audio="off"` on its
  widget tag, its `next/` content rebuilt with no `hyAudio`. **Occlusion**, three days before its final: reports #42 (`dn-support`,
  the stem now asks which force a complete denture's support resists) and #43 (`dn-resorb-mand`: "less
  bone, but a bigger arch" in the explanation and whys, the stem asks about the arch's outline), and `in-bennett` (54% picked "Cusp
  height", which the midterm's determinants table supports for Bennett movement: that choice became "How steep the cusps can be in
  protrusion", and its 9 old picks are cleared by `tools/data-fixes/2026-11-14-in-bennett.sql` after the merge). Ids, keys and
  choice order unchanged, so the class's picks on the other choices stay right; no
  High yield text changed (checked with `tools/hub-next/build.mjs`). Occlusion's page was 93 bytes under its 1480 KB budget on `main`,
  so the new wording is trimmed to fit (`tools/release/perf.js`: 1,516,026 bytes, 1480 KB). In `tools/ci/smoke.js`, the redesigned-page checks skip a hub whose exam
  has passed (the release never switches one in) and the live click-through waits for "This hub is archived" on an archived hub:
  Heme & Endo Exam 2 counts as archived on a UTC runner from 4 pm Central 11-13, and every all-hub run failed on it (BUG-131).
  **The redesign's new dashboard** (not live): on a phone, two closed hubs sat side by side and made the page 434 px wide on a 390 px
  screen (BUG-130); `widget/dash.css`'s phone rule now wins (one column), `site.bundle.css` rebuilt, and the smoke test's sideways
  check counts a layout wider than the screen.
  Special Patient Care's retrospective waits for Canvas to close (Sat 11-14).
- **2026-11-13 (the redesign's bundles, phase 5 part 2, Claude Code)** — Nothing students see changes: the live
  dashboard and hubs load exactly the files they loaded (the smoke test fails if one asks for a bundle). A redesigned
  page (`next/`, `hubs/<hub>/next/`) now loads the widget as **built files** instead of one request per source file:
  `widget/hub.bundle.js` or `widget/dash.bundle.js` with the page, then `widget/rest.bundle.js` (a slim database
  client, 23 KB gzipped where the full one is 55, and the widgets every page shares) and, on a hub,
  `widget/hub-rest.bundle.js` (`v3.js`, `v3.css` and what v3.js loads); one stylesheet, `widget/site.bundle.css`; no
  font from another site (`assets/fonts/vt323.woff2` for the 8-bit code; the new dashboard's saved recap image is in
  Nunito Sans). **The bundles are generated and committed: after changing a widget file listed in
  `tools/bundle/bundles.json`, run `node tools/bundle/build.mjs` and commit both** (CI's `--check` fails on a stale
  one). `widget/v3.js`'s thirteen script loaders are one function, `widgetFile()`; on a live page it does what they
  did. `tools/release/perf.js` now measures a page's whole load (it stopped 3 s after the load event and missed about
  a third of a new hub: BUG-128), and the redesign's budgets are set on it: the new dashboard 22 requests and 416 KB
  to 9 and 332 KB, a new hub 28-29 requests to 11 and about 100 KB lighter. How it works:
  [vault/reference/bundles.md](vault/reference/bundles.md); for the release:
  [the release note](vault/tasks/done/2026-11-06-redesign-release.md), "From phase 5, part 2"
  ([phase 5](vault/tasks/done/2026-11-05-redesign-phase-5-backend.md), PR #358).
- **2026-11-13 (the game layer's wiring, phase 4 session 8, Claude Code)** — Nothing students see changes: every new call
  runs only on a page on the game layer (`shGame.v2()`), which no live page is, and the smoke test plays two arcade games
  and Timmy Time on a live hub with this change's files and with `main`'s and fails unless the calls are identical. On
  the redesign's pages, once migration_v54 is applied: **the arcade** starts and finishes a session per game
  (`xp_session_start` / `xp_session_finish`: the +50, and the server posts the score, so no `submit_arcade_score`), its
  answers carry the session, and the toast says "<game> finished: +50 XP." (`widget/games.js`: `shGames.played`, `over`,
  `session`, `ran`; a hub's own games get the hooks from `tools/hub-next/build.mjs`'s `gameHooks`, so the three hubs'
  `next/content/arcade.js` were rebuilt); **Timmy Time** sends each minute heard as `pod_minute_v2` and its XP reaches the
  pill (`widget/podcast.js`, `sh:pod-paid`, `widget/hub-rewards.js`; minutes sent kept in `sh_pod_min:<hub>:<episode>`);
  **the admin page's Inbox** reads `get_reports_v2` and resolves as "Fixed" (+100 to the sender) or "No change needed"
  with `admin_resolve_report_v2` (`review/index.html`), today's Inbox without them. The preview answers all of it
  (BUG-122: its made-up reports now stay resolved). Neither pending migration was applied or changed. Left for the
  release: the episode lengths (`admin_set_podcast_episode`: 2688 s and 3101 s) and `sw.js` (no new file).
  [The task](vault/tasks/done/2026-11-12-redesign-game-layer-wiring.md), [#357](https://github.com/smcmurry6-source/study-hubs/pull/357).
- **2026-11-13 (the trophy case and the cards, phase 4 session 6, Claude Code)** — One live fix (Sam: "ship the BUG-116 live fix
  too"): after a level-up card, later cards (a rank-up, a trophy, a medal, a mock result) play again; until now none
  did until the page reloaded. Otherwise nothing students see changes: the live hubs and dashboard keep 24 trophies, Full Arch, the old Stats panel and today's cards. On the redesign's pages
  (`html.shx`): **the trophy case** (`widget/trophies.js` + `widget/trophies.css`, `window.shTrophies`; its drawings in
  the new `widget/hub-art/trophies.js`, `window.SH_TROPHY_ART`, 128 KB, 23 KB compressed, built by
  `tools/figures/site/build.mjs`), all three fetched on first use through `widget/ranks.js` (`trophyCase`, `trophyCss`,
  `trophyStats`). 27 trophies, 16 secret: the rank on top with the road ahead, a showcase stand, a cabinet with "Won by
  studying", "The journeys" and "Secrets" shelves, and "Full Arch (retired)" only for someone who won it. In a new hub's
  More, Stats and trophies (with the rest of that page redrawn: a scoreboard, a card per lecture, the achievements as
  rosettes; Sam: "make it more epic") and from the new dashboard's "you" card. **The cards** (`widget/rankup.js`) in
  the new look: drawn trophies, the class share and a "what's next" line, Timmy's place pieces on a rank-up; they wait
  for their styles and drawings (2.5 s at most). **Full Arch retired** on the redesign (`ARCH_OFF` in `widget/eggs.js`,
  out of the Extras and both trophy lists). Found: BUG-116, a level-up card stopped later cards (fixed everywhere, above). Tests: the smoke test's trophy-case block, `a11y.js`'s case and
  card. [#356](https://github.com/smcmurry6-source/study-hubs/pull/356), [the task](vault/tasks/done/2026-11-12-redesign-trophy-case-and-cards.md).
- **2026-11-13 (Visit someone random, from the whole class, Claude Code)** — Nothing students see changes (the new
  dashboard, on the game layer). Sam: "i want random to be for the whole class". A new pending migration,
  **`migration_v57.sql`** (`get_random_place`; `migration_v54.sql` unchanged), picks on the server from everyone a place
  can be opened for, never you or your linked device, and gives the place and its key, never an id; the class comes
  round once before anyone twice (`p_skip`). Applied at the release after v56 (listed in
  `supabase/pending-migrations.txt`). `widget/dash.js` (`visitRandom`, `getRandom`, `placeOf`), `widget/place.js` (a
  `nav` with `more()`: Next rolls the die in the clouds, then the name; Previous goes back through the trip),
  `widget/place.css`, the preview's stub. Without the function the button picks among the board's rows as before.
  Then Sam: "skip people with zero customization" (only places with something chosen; "No one else has decorated their
  place yet" when none) and a **number badge for the top ten** on a visit (gold, silver, bronze, then purple to #10).
  Tests: `xp.js` 14a, `rls.js`, the smoke test's random trip, the badge, nobody customized and the fallback.
  [Visiting](vault/tasks/done/2026-11-12-redesign-visiting.md), [game-server](vault/reference/game-server.md), [#355](https://github.com/smcmurry6-source/study-hubs/pull/355).
- **2026-11-13 (visiting's tour, Claude Code)** — Nothing students see changes (the new dashboard, on the game layer).
  Sam: "build the random visit and next/back", the rest of round 3's visiting. **Visit someone random** under the board
  picks one of its rows (never your own); in a visit, round arrows go to the previous and next person on that board and
  **Back to mine** goes home, each through the round-3 clouds, one window giving way to the next under them; the guest
  card says where on the board you are. `widget/dash.js` (`visitList`, `visitNav`, the die button), `widget/dash.css`,
  `widget/place.js` (`open({ nav, covered })`, `hop()`), `widget/place.css`. Nothing on the server (a key still comes only
  on a board row). Tests: the smoke test's visiting block walks a tour (next, a place that can't be read, Back to mine,
  focus) and a random visit. [Visiting](vault/tasks/done/2026-11-12-redesign-visiting.md).
- **2026-11-13 (visiting, phase 4 session 4, Claude Code)** — Nothing students see changes: it runs only on the new
  dashboard (`next/`), on the game layer (the `_v2` boards' visit keys and `get_place`, migration_v54, not applied and
  not changed). A row of Ranks or Study streaks, each of the stage's top three and a winner's Timmy on the stage open
  that person's Timmy's place; your own row opens yours. `widget/dash.js`: the name is a button (`data-dash="visit"`,
  "Visit <name>'s place"; the key stays on the row) stretched over the row in `widget/dash.css`; `getPlace()` asks
  `get_place` once a page per person and `loadFits` shares it; a null place or a failed call is one plain line on the
  row; closing gives focus back to the row. Sam, seeing it: "this window should be more epic": `widget/place.js` and
  `place.css` open a visit in the leaderboard's theater look (dark in both themes, "Welcome to" over the name in gold,
  chasing marquee bulbs, a gold-framed stage under spotlights, a guest card
  with their rank drawn big and their medals) and count `place:visit`; your own place is unchanged. Then "there should
  be a clouds animation" ("i already approved a cloud animation before"): a visit plays the design page's trip through
  the clouds, ported as approved in round 3 (soft clouds over the whole screen, "Off to <name>'s place", then they
  scatter; none with reduced motion). The preview's
  classmates have places of their own (one a ModuPro, one that can't be read), one rank on every board, and your own
  row stays on the rank board below the top ten. Tests: the smoke test's "visiting" block, `a11y.js`'s boards and
  visited place (light and dark, zero issues, in the baseline). BUG-112 (`widget/ranks.js`'s "+1" medal button's name,
  shared with the live pages) waits for the release. [Visiting](vault/tasks/done/2026-11-12-redesign-visiting.md).
- **2026-11-13 (faster CI, Claude Code)** — Nothing students see changes. Sam, after #349 waited most of an hour while
  `main` moved three times: "merge now, then do 1 and 2 in their own PR". (1) **Parallel jobs.** "Check hubs" is now
  `scope`, `fast` (the fast checks and the database suites), `smoke (desktop)` and `smoke (phone)`
  (`SMOKE_PART=desktop|phone` in `tools/ci/smoke.js`; a local run still does both halves) and `check`, the one result to
  read. "Release tests" is `scope`, one `suite (...)` job each for accessibility, performance and the admin page, one
  per browser for the device matrix, and `release`. Release tests no longer repeats Ask Timmy's suites, which Check hubs
  runs. (2) **A notes-only change keeps the green result.** New `tools/ci/reuse.js`: on a PR, when every file that
  changed since a run whose long jobs passed is a `.md` file (or `.obsidian/`), the long jobs are skipped and the run's
  summary links the run it kept. The comparison uses the merge commit being tested, so code that came in from `main`
  still runs everything; a run that kept a result is never itself kept. (3) A stale run steps aside: Check hubs cancels
  an older run of the same PR, and Release tests' scope starts no suite when a newer push has come in (it had cancelled
  the head's suites once that day). `RELEASE_TEST_PLAN.md`, [verify-before-pushing](vault/how-to/verify-before-pushing.md)
  and [long-tests-once](vault/rules/long-tests-once.md) say so. Measured on #351: Check hubs about 7 minutes (was about
  13) and Release tests about 5 (was about 17), both at once; a notes-only commit about 3, its long jobs kept.
- **2026-11-13 (the bowling egg, phase 4 part D, Claude Code)** — Nothing students see changes: it runs only on the
  redesign's pages, with no XP and nothing on the server (neither pending migration touched). The eight clips drawn in
  #291 (never merged, closed) carried over unchanged as `tools/figures/site/bowling.mjs`, built into
  `widget/hub-art/bowling.js` (`window.SH_BOWL`) and the design page's "The bowling egg" section (with the Bowling
  trophy, "Lane Legend", drawn in `medals.mjs` as `EGG_TROPHIES.bowling`). New `widget/bowling.js` (`window.shBowl`,
  fetched at the first strike or the first tap on the lane): a small card docked at the bottom, 3 to 5 seconds, a tap
  or Esc closes it, the still and its word with reduced motion, queued behind rank-up and trophy cards. The run of
  first-try right answers is counted in the engine's answer path (`widget/hub-rewards.js`, kept on the device across
  hubs): strikes at 50 and 100, the turkey at 150; not in the mock or the arcade, nor with the eggs off or in Focus
  mode. The bowling lane at Timmy's place plays a random clip (`widget/place.js`). Sightings and the trophy are kept
  on the device. Tracked as `egg:bowling=<clip>`. Tests: the smoke test (the run, strike, retry, miss, turkey, mock,
  eggs off, Focus, reduced motion, the lane, a live hub untouched), `a11y.js` (the clip card). BUG-110 and BUG-111
  found and fixed in testing.
- **2026-11-13 (Ask Timmy part 4, "Timmy everywhere", phase 4 session 3, Claude Code)** — Nothing students see
  changes: only the redesign's pages pass the new option. `widget/pet.js` takes `mount({ everyone: true })`: no
  adoption (a first visit sets `sh_pet_born` to today and sends the `pet-adopt` badge; linked devices keep the earliest
  day), no introduction or "Tap me!", one hello instead; a Timmy met on or after `FULL_FROM` (far future until the
  release sets it) starts at 100 HP, and Pearly Whites then needs a day under 100 first; he wears only the shop outfit on
  at his place (the v2 bootstrap's `shop.equipped.outfit`), never a holiday's, nothing when nothing is on: on the bar, the
  dashboard's card, the chat's avatar, his place, the classroom (`fit()` is the outfit's id) and the stage. The drawing
  is kept on the device (`sh_pet_outfit`); `widget/hub-art/outfits.js` loads only after the first scroll, tap or key,
  when the outfit on isn't the kept one. `shPet.setOutfit()` (called by `widget/place.js` when the outfit slot changes).
  `widget/v3.js` loads and mounts him for everyone on `data-game="v2"` pages and resends the presence on `sh:pet-fit`;
  `widget/dash.js` mounts with `everyone` and drops the porch line; `widget/hub-timmy.js` drops the adoption waits
  (Timmy's place and the shop for everyone); `widget/ask.js` no longer waits for adoption. The preview: `FULL_FROM` is the
  test account's start (`tools/preview/transform.js`, the runtime's `SH_PREVIEW_TIMMY_FROM`), and "returning" wears the
  sun hat. `tools/ci/smoke.js`: "everyone has Timmy" on a new hub and the new dashboard, and the live hub and dashboard
  as before; the Ask checks turn Timmy off first. `tools/podcast/LORE.md`: from the redesign on, the student dresses him.
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md), [ask-timmy](vault/reference/ask-timmy.md).
- **2026-11-12 (Timmy's shop, the client, phase 4 part B, Claude Code)** — Nothing students see changes: the shop
  runs only on the redesign's pages, on the game layer (`migration_v54.sql`, not applied, unchanged). New
  `widget/shop.js` + `widget/shop.css` (`window.shShop`, fetched on first use): the storefront with the balance, Today's
  showcase, Today's picks, This week, Back for today, the seasons' sets, Spotted (the rare costumes) and Always here;
  an item's sheet with Buy, every refusal's line, one request id per sheet, "Put it on" / "Place it" into the
  customizer. Opened from a new hub's More (`widget/hub.js`, `widget/hub-timmy.js`), the new dashboard's "you" card
  (the balance and a Shop button, `widget/dash.js`/`.css`) and the place's "Get more in the shop" (`widget/place.js`).
  `widget/pet.js`: on the game layer only, snacks' HP from `get_pet_days_v2` count in `simulate()`, and
  `refresh(true)` reads his days again; live pages compute HP exactly as before. The rare costume of the day. The
  preview sells the catalog read from the migration and answers `buy_item` in the server's order of checks. Tests:
  the smoke test (the shop on a new hub and the new dashboard; a live hub never asks for it), `xp.js` (367 checks:
  the preview's purchases against `sh_buy`, the costume of the day over three years), `a11y.js` (the shop, its sheet,
  dark mode; no issues). BUG-098 to BUG-104 found and fixed in testing.
- **2026-11-12 (Learn and Flashcards, Claude Code)** — Nothing students see changes yet: the redesign's Question Bank gets
  **Study as: Questions · Learn · Flashcards** ([the task](vault/tasks/done/2026-11-06-redesign-learn-and-flashcards.md)), in
  the three new hubs only. Learn asks the panel's questions in rounds of 7 until each is right twice (the second time
  without the choices when the question allows it), with a bar that fills, a round track, praise and a streak, and a
  round recap (Sam asked for it to feel like Quizlet's). Flashcards turn over and are rated Again, Hard, Good or Easy on
  an Anki-like schedule that ends on exam eve; Home shows "n flashcards due". `widget/study-modes.js` + `.css` load the
  first time either is opened. The server part is a new pending migration, `migration_v56.sql` (`card_reviews`,
  `record_card_v2`, `reset_my_learn`, `get_my_cards`, a `card` award: a flat 2 XP for a due or new card's first three
  ratings a day), applied at the release after v54 and v55, which are unchanged; `xp.js` and `rls.js` check it, the
  preview answers it. Two icons (`learn`, `cards`), approved by Sam from a contact sheet. `widget/qhealth.js` and
  `widget/v3.js` gain two hooks nothing on a live hub calls (`shQH.rate`, `window.shNoteJump`).

- **2026-11-12 (Ask Timmy's admin tab, part 3, Claude Code)** — Nothing students see changes: the admin page
  (`review/index.html`) gets an **Ask Timmy** tab for [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md): figures for
  the range, by hub and by day (questions, estimated cost, not covered, declined, errors, thumbs, quotes, reports), his
  switch and daily limits (Save asks first, then `admin_timmy_config`), the answers students reported, the questions the
  notes don't cover, the quotes that didn't check out and every chat, each opening in place; the Inbox links a Timmy report
  to its chat. Every student's or Timmy's word is drawn as text, and no visitor id is drawn. migration_v55 isn't applied
  until the release, so until then the tab says Ask Timmy starts then. The preview answers the `admin_timmy_*` calls with
  made-up chats and can show a page as it is before a migration (`missing` in its settings); `tools/release/admin-ui.js`
  covers the tab (and its Hubs form touch-target check now measures the form, which it hadn't been). How it works:
  [ask-timmy](vault/reference/ask-timmy.md).
- **2026-11-12 (the redesign's shop, session 1: its art; Claude Code, #339)** — Art only: no client code, nothing
  students see (the redesign isn't live), `migration_v54.sql` unchanged. New `tools/figures/site/shop.mjs`, built by
  `build.mjs` into **`widget/hub-art/shop.js`** (`window.SH_SHOP_ART`, 11.4 KB compressed, loaded by no page yet): the
  Shiny Gold Crown coin (`coin(px)`, with its own cut for 16 px), thumbnails for the four snacks and two boosts
  (`thumb(id)`), and the five rarity frames (`frame(rarity)`), which moved here with the coin from the place's kit
  (`SH_PLACE.frame`, `.coin`, `.RARITIES` are gone; nothing used them). **Ten new outfits** in the kit's `OUTFITS`
  (`tools/figures/site/place.mjs`), keyed by the shop's ids: the five everyday ones that had no drawing (BUG-090:
  scrub cap, bow tie, safety glasses, white coat, graduation cap) and the five rare costumes (pirate, astronaut,
  detective, chef, Captain Enamel; `costume: true`, three lines each). **Timmy's door spot moved in all 22 homes**
  (BUG-089) so he no longer hides the rank statue, with the yard's left spot, the path's lamp and nine statues.
  `tools/release/xp.js` now fails on any catalog piece without a drawing and checks the shelf's thumbnails against
  the catalog (358 checks). The design page shows them ("The shop's own art: the coin and the shelf", "The shop's ten outfits");
  `node tools/figures/site/shop-sheets.mjs <dir>` makes the contact sheets. **The shop's look, "more epic"** (Sam,
  after the sheets): the design page's shop is redrawn as a storefront (Timmy at the counter under an arch of light;
  `SH_SHOP_ART.store()`), "Today's showcase" (`stand()`) and shelves whose cards fill them, with Spotted and Always
  here; the client session builds the page to it. Left open: BUG-095. Hand-off for
  the shop's client session: `vault/tasks/2026-11-06-redesign-timmy-shop.md`, "What session 1 built".
- **2026-11-12 (Ask Timmy's chat, part 2, Claude Code)** — Nothing students see changes yet: the chat half of
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md), in the redesign's pages only. `widget/ask.js` + `ask.css`
  (a bottom sheet on a phone, a side panel on a laptop) open from Timmy's "Ask me" (his bubble, the dashboard house), from
  an Ask icon in his spot when he isn't shown (a hub's bottom-left corner, the dashboard's "you" card; a plain "Ask the
  hub" voice), and from "Ask Timmy" on an answered question card (`widget/hub-bank.js`). Answers draw as text with "From
  the notes" links to the paragraph, thumbs, Report (`timmy_report`), and drafted reports and ideas the student edits and
  sends (an idea posts as `board`: neither pending migration is changed). Paused during a mock,
  off on an archived hub. `widget/pet.js` adds "Ask me" only where `window.shAsk` exists, so the live hubs' Timmy is
  unchanged. The preview answers the function with canned replies; `tools/ci/smoke.js` checks the chat on every new hub
  (phone and laptop) and the new dashboard. How it works: [ask-timmy](vault/reference/ask-timmy.md); release steps and
  the About page's entries: [the release](vault/tasks/done/2026-11-06-redesign-release.md). Parts 3 (the admin tab) and 4
  (everyone has Timmy) are next.
- **2026-11-12 (the rest of the redesign's phase 4, planned: vault only, Claude Code)** — No code and nothing students
  see. Sam answered one list of calls, and what is left of phase 4 is now ten sessions in order, each with a build
  spec a fresh session can follow (files to touch and not to, the calls and their shapes, the preview's made-up data,
  the request budgets, the tests to add, what is out of scope, a Done when and an opening prompt):
  `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md`, "From here to the release". New task notes: visiting, the
  trophy case and the cards (phase 4's first goal, found unbuilt), the game layer's wiring. Sam's calls are in
  `vault/decisions.md`; the biggest: Timmy wears only what the student put on ("if someone doesnt have a costume
  applied, they are naked"), the five undrawn outfits are drawn, the bowling egg uses the clips already drawn on
  #291, `migration_v54.sql` is not changed (`vault/reference/game-server.md` lists where the client works around it), and
  the Full Arch chart and its trophy are retired with the redesign. #335 (Timmy's place) was merged in the same session.
- **2026-11-12 (the redesign's Timmy's place, client side: phase 4, part C, Claude Code)** — Nothing students see
  changes: it runs only on the new pages (`hubs/<id>/next/`, `next/`, shown in a preview), `widget/pet.js` is
  untouched, and migration_v54 is still **not applied** and wasn't changed. New: `widget/place.js` + `widget/place.css`
  (`window.shPlace`: the place as a card and a full view, Timmy's hops, wave and bubble, his health in how he moves,
  the medal board's big view, the rank statue with the ModuPro and Timmy's loupes in the later journeys, and a
  customizer that saves each change through `equip_item`), its kit `widget/hub-art/place.js` and one file per set in
  `widget/hub-art/place/` (generated by `tools/figures/site/build.mjs`). All of it loads on first use: a new hub from
  More, "Timmy's place"; the new dashboard on the first scroll, tap or key (its "you" card shows a still kept on the
  device until then, because the page is at its request budget). `widget/hub.js`, `widget/hub-timmy.js`,
  `widget/dash.js` and their styles carry the wiring and flame levels 4 and 5. The preview answers `get_my_shop`,
  `equip_item` and `get_pet_days_v2` from made-up data. `tools/release/xp.js` now checks the client against the server
  as written (the customizer's rules against `equip_item`, the place's seasons against `sh_shop_seasons`, the kit's ids
  against the catalog) and found one gap: five everyday outfits in the catalog have no drawing
  (`vault/tasks/2026-11-12-five-outfits-without-a-drawing.md`, Sam's call). Hand-off for the shop and the bowling egg:
  `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` (Log). About-page and lore lines are drafted in the release
  note and land at the release.
- **2026-11-12 (Occlusion L10: Occlusion and the Periodontium, Dr. Abou-Arraj; L9 checked against Dr. Lawson's slides, Claude Code)**
  — Sam: "i just added the last occlusion materials to the folder" and "yes to all figures and anima". **L10 `occtrauma`** (the first
  hour of the 11/12 session; `nov 12 occ.txt` and `Dr. Abou-Arraj Occlusion and Periodontal Correlations.pdf` in Drive, not in the repo),
  the last lecture on the final: notes at both levels, 59 questions (`ot-*`, `cs-ot-*`) in every format with every choice's why,
  three Patient Box cases (`otcrown`, `otperio`, `otfrem`), 19 hints, 11 likely topics, Review, cram, sort sets `primsec` and
  `otsigns`, two side-by-side rows, tag `plum` (a tenth tag color), the mock at 9 each from L6-L10, and the exam card, timeline,
  banner, Home notice and dashboard card. His mobility degrees differ from Dr. Givan's L7 handout: L10's questions say "on
  Dr. Abou-Arraj's scale", and the notes, Review and `mo-miller2` point out the difference. Five figures (`tools/figures/occlusion/anima/`,
  in the notes at both levels and in Review): Fig 27 `otsupport` (primary vs secondary, the fence post), Fig 28 `otjiggle` (unilateral
  vs jiggling, the hourglass), Fig 29 `otxray` (the radiographic signs on a film), Fig 30 `otmobility` (degrees 0-3 to scale, fremitus)
  and Fig 31 `otanimal` (the 1970s animal experiments); Figs 27, 28 and 30 share `anima/l10tooth.mjs`. **L9** checked against
  `Dr. Lawson Non-carious cervical lesions.pdf`: RDA below 250 for the seal, the sensor, acid vs plaque sites, the drinks' pH and
  bicarbonate, mouth rinses, the summary slide; `nc-rda-seal` and `nc-erosion-sites` are new; the "Recording" badge is gone. Narration:
  L10 and L9 at all three levels from `next/content/notes.json`; the lexicon gained Abou-Arraj, Waerhaug and others. The new
  Occlusion's hint headings say "the professors". About page: an L10 sentence in Diagrams. Occlusion's page is 1470 KB over the
  wire, so its budget went from 1395 to 1480 KB (BUG-087; Sam's "merge when ready"). The site is 760 MB, past `size.js`'s 750 MB warning; no
  archived hub still has audio. Task: [done](vault/tasks/done/2026-11-10-occlusion-l9-follow-ups.md).
- **2026-11-12 (Ask Timmy's server, part 1, Claude Code)** — Nothing students see changes yet: this is the server half of
  [Ask Timmy](vault/tasks/done/2026-11-12-redesign-ask-timmy.md), which goes live with the redesign. The Supabase Edge Function
  `timmy` (`supabase/functions/timmy/`: the logic in `core.js`, the Deno wrapper in `index.ts`, the site help in
  `site.json`, built from the About page by `tools/timmy/build.mjs` with the spoilers left out) answers from a hub's own
  notes, review tables, cram sheet, Exam Hints and High likelihood topics with Claude Opus 5.5, every point linked to the
  paragraph it came from and every quote checked against it; it declines graded quiz questions and unanswered practice
  questions, offers a report or an idea-board post, and naps at 40 questions a person a day or the site's $10 a day.
  `migration_v55.sql` (pending until the release, with v54) stores the chats and adds the students' calls (history,
  thumbs, what they did with an offer, and the Report button Sam asked for, which sends a usual report the Inbox answers)
  and the admin tab's reads. Tests: `tools/timmy/test.mjs` (paragraph links against the engine's own numbering in
  Chromium), `tools/release/timmy.js` (the database), and `tools/timmy/eval.mjs` with a 134-case test set (`--dry` in CI;
  the real-API run, all 134 cases for $11.71, passed once its fixes were in: choices named by their words, not letters,
  since the card shuffles them; a short exam fact quotable whole). How it all works: [ask-timmy](vault/reference/ask-timmy.md).

- **2026-11-12 (the redesign's three journeys, client side: phase 4, part A, Claude Code)** — Nothing students see
  changes: it runs only on the new pages (`hubs/<id>/next/`, `next/`, shown in a preview) and only once the database
  has migration_v54, which is still **not applied**. The rank ladder becomes three journeys (Handpiece, then the
  ModuPro at 125,000 XP, then the Loupes at 250,000). New: `widget/journeys.js` (the hand-off to the next journey and
  the Dark Matter unlock, two full-screen scenes with a still card for reduced motion, and the road ahead) and
  `widget/hub-art/journeys.js` (the ModuPro and the loupes drawn in the handpiece's medallion, from
  `tools/figures/site/journeys.mjs`), **both loaded on first use, never with a page**. **Shared files changed, inert
  for the live hubs**: `widget/v3.js` has a switch, `data-game="v2"` on its script tag (only the engine writes it):
  with it, the page asks for the v2 bootstrap and sends each answer as one `record_answer_v2` call, falling back to
  today's calls while the function isn't there; without it nothing differs. `widget/ranks.js` draws and names a rank
  past the Handpiece only for a v2 profile, and its `art()` without a shape is byte for byte what it was;
  `widget/rankup.js` takes the journey's object for its cards. The engine (`widget/hub-rewards.js`, `hub-bank.js`,
  `hub.js`) shows XP by the new rules when the game layer is on (no daily cap, double XP after a mastery medal as a
  chip on the rank pill), runs a mock inside a server session and shows the road ahead in More, Stats; the new
  dashboard (`widget/dash.js`) knows the journeys. The preview answers the new calls from made-up data and takes
  `?xp=<n>`. **Before changing how an answer is recorded, or the rank art, read
  [the journeys note](vault/tasks/done/2026-11-06-redesign-progression-journeys.md) and
  [game-server](vault/reference/game-server.md).** Left for the release, written in
  [its note](vault/tasks/done/2026-11-06-redesign-release.md): the arcade's and Timmy Time's XP, the journey trophies in
  the trophy case, the About entries (drafted there).

- **2026-11-12 (High yield narration for the redesign, Claude Code)** — Nothing students see changes until the redesign's
  release. The notes' third reading level, High yield, now has Kokoro narration like the other two: `<lecture>-hy.mp3` and
  its word timings for all 21 lectures that have it (Heme & Endo Exam 2's 8, Occlusion's 4 final lectures, Perio's 9; Sam
  asked for Heme & Endo too though it archives Nov 13), 148 MB at 64 kbps (about 5 hours 20 minutes); the site is 738 MB of the 1 GB limit, under `size.js`'s 750 MB warning. `tools/narrate.py` reads the
  redesign's `notes.json` (`--level hy`), says a topic's number as "Topic 2." and the "·" as a pause, stamps each words file
  with the text it was spoken from (`"h"`), and spreads lectures over `--jobs` longest first. `tools/hub-next/build.mjs`
  lists in `notes.json`'s `hyAudio` the lectures whose recording matches today's High yield, and only those get the
  recording (with Follow along) in `widget/hub.js`; the rest read in the device's voice, so a stale one never plays.
  `tools/ci/smoke.js` fails on a recording made from another version of a lecture's High yield and checks the page offers
  exactly the listed ones. The drift rule now covers High yield: it changes whenever a lecture's notes, predicted topics,
  hints or questions do, so a question edit on these three hubs can mean recording that lecture's High yield again in the
  same PR ([rule](vault/rules/text-and-audio-never-drift.md), [task](vault/tasks/done/2026-11-12-high-yield-narration.md)).

- **2026-11-12 (the redesign's hub engine split into four files, Claude Code)** — Nothing students see changes: only the
  new hubs (`hubs/<id>/next/`, shown in a preview only) load the engine, and no live file changed. `widget/hub.js` was
  one 188 KB closure; it is now the core (`widget/hub.js`, 116 KB) and three parts, each holding what one kind of
  session changes: `widget/hub-rewards.js` (the answer path, XP, the rank, the bar's meters, Today, the recap),
  `widget/hub-timmy.js` (what the engine asks of Timmy) and `widget/hub-bank.js` (the question card, the bank, the
  mock). **A new hub's page loads all four, deferred, the core last**; the smoke test fails a page that doesn't. The
  parts share the core's names through one object, `HX` (how: the top and the end of `hub.js`). Before editing the
  engine, find the function's file first (`grep -n "function name" widget/hub*.js`). Three more requests a page (20,
  20 and 18 against budgets of 21, 22 and 21, not raised). No behavior change: the same scripted visit on `main`'s copy
  and on the split gave identical pages and saved state at all 368 steps. Hand-off for parts A to D:
  [phase 4's note](vault/tasks/done/2026-11-05-redesign-phase-4-game-layer.md). ([#330](https://github.com/smcmurry6-source/study-hubs/pull/330))

- **2026-11-12 (archived hubs' audio off the site, Claude Code)** — The site was 958 MB of GitHub Pages' 1 GB limit, 909 MB
  of it mp3s. Sam kept the bitrates (narration 64 kbps, Timmy Time 96 kbps) and made it a standing rule that an archived
  hub's narration and Timmy Time come off the site ([rule](vault/rules/archived-hubs-drop-their-audio.md)). Done now for
  MSK Exam 3 and 4, PCD Fixed Pros Exam 3, Heme & Endo Exam 1 and PCD Implants Exam 1: 83 mp3s, 368 MB, site 958 → 589 MB.
  Their pages stay up. `widget/v3.js` reads `data-audio="off"` on a hub's widget tag: Listen reads in the device's voice
  without requesting the missing file (voice picker included), Timmy Time isn't loaded, and `widget/v3.css` hides the hub's
  Timmy Time links (`html.sh-audio-off`). `tools/ci/smoke.js` skips the narration checks for such a hub and fails if any
  audio is left behind; new `tools/ci/size.js` in "Check hubs" prints the site's size, warns from 750 MB and fails from
  900 MB. The next four (Special Patient Care after Nov 13, Heme & Endo Exam 2, Occlusion, Perio) are a
  [to-do](vault/tasks/done/2026-11-12-audio-off-at-archiving.md); the engine's version is a box in the redesign release. The
  High yield narration is no longer waiting for room. About page: Listen and Timmy Time say so.
- **2026-11-12 (Occlusion: `in-locator`'s explanation names the pantograph, Claude Code)** — About half of the people who
  tried it picked "Trace protrusive and lateral paths on six recording tables" as how the hinge axis is found. Its why
  row named the pantograph; now the explanation does too (L6's notes: the kinematic facebow finds the axis, the
  pantograph then records how the jaw moves). Approved on the 2026-11-11 lessons refresh's list; it waited for #319.
  Explanation only; `next/content` rebuilt.
- **2026-11-12 (the idea board, built for the redesign, Claude Code)** — Nothing students see changes: the board is on
  the new dashboard (`next/`) and in the new hubs' More, which only a preview shows, and its server (migration_v54) is
  still not applied. New: `widget/ideas.js` + `widget/ideas.css` (`window.shIdeas`: the board, its post form with the hub
  and the six kinds, votes, Report, Delete, Top / New / Shipped and two filters; and `shIdeas.tick()`, the "Also post this
  on the idea board" box). `widget/dash.js` mounts the board in `#ideas` and puts the tick under the check-in's last
  question (ticked to start; the live `index.html` check-in is untouched); `widget/hub.js` adds the page `#more/ideas`
  and a row under "Talk to us". **Two live files change, both inert until the release**: `widget/v3.js` (the Suggest
  box gets the tick only where `ideas.js` is loaded, which no live hub does) and `widget/replies.js` (it can show an
  idea's status note, kind `idea`, which no server sends yet; `get_my_inbox_v2` only where the page says so). The admin
  page's Inbox has an "Idea board" card (hide, restore, a status with one line on why); until migration_v54 it says the
  board opens with the redesign. The preview answers the board from made-up ideas; the release's starting ideas are not
  posted.
  `tools/ci/smoke.js` draws a made-up board and checks votes, the pickers, that words never become markup and that every
  button has a fixed `data-shi` name. BUG-078 (WebKit only: a "ResizeObserver loop" error on the new dashboard while
  the board's stylesheet loads) fixed in `widget/dash.js`. Sam then asked for a more decorative board, done after
  #318 merged and approved from a contact sheet: **a cork board in a wood frame, every idea a pinned paper note** (the
  paper's color and a picture for its kind, a pushpin in the hub's tint, Sam's answer as a stamp, a rosette on the top
  idea, Timmy looking over the frame, the form as a page of a pad). The drawings are a kit, `tools/figures/site/board.mjs`,
  built into `widget/hub-art/board.js`, which `ideas.js` loads itself. Hand-off: [the idea board's note](vault/tasks/done/2026-11-06-idea-board.md). ([#324](https://github.com/smcmurry6-source/study-hubs/pull/324))

- **2026-11-12 (a standing rule: run the long tests once, Claude Code)** — Notes only. Sam asked why the dashboard's
  merge took two hours; part of it was the agent running the every-hub smoke test again on its own machine each time
  `main` moved. New rule, `vault/rules/long-tests-once.md`: the long suites run once on the finished code, then the
  fast checks and a push, and CI is the check. The dashboard PR (#318) was merged on Sam's word the same day;
  `node tools/release/postcheck.js` after it: passed.

- **2026-11-12 (No approval checkbox: Sam's "merge" is the approval, Claude Code)** — Sam: "Remove the sam approval
  tick stuff entirely. If i say merge, merge. We are adding too many steps." The "Sam approved this release" box is gone
  from the PR template and the test report template, and [preview-and-release-test](vault/rules/preview-and-release-test.md),
  `RELEASE_TEST_PLAN.md` (sections 10-12), `AGENTS.md`, `CLAUDE.md`, ship-a-change, roll-back-a-release, home and the
  redesign task notes now say it: when Sam says "merge", the agent merges (a draft is marked ready first), waiting only
  for checks still running and fixing a failing one first; Sam can still merge it. Nothing in CI read the box.
- **2026-11-12 (A standing rule: anything left to do goes on the to-do list, Claude Code)** — Sam: "make it a standing rule
  to add things like that to a to do so things dont get lost in chats that need to be done. check them off as they are
  done." New rule [to-dos-go-in-the-vault](vault/rules/to-dos-go-in-the-vault.md), loaded in every Claude Code session and
  linked from `AGENTS.md`: deferred, held or blocked work and found follow-ups go in a task note, the inbox or a task's Done
  when (never only in a chat), and are ticked off in the PR that does them. The inbox's done lines are now ticked with their
  PR and cleared on the next pass. Its first entries: the High yield narration task and an inbox line on the site nearing
  GitHub Pages' 1 GB cap; the redesign release's checklist now names every rule it has a draft for.
- **2026-11-12 (High yield: the redesign's notes get a third reading level, Claude Code)** — Sam: "a toggle in the lecture
  notes that only explains the high likelihood/high yield points that are hinted to be tested ... As taught, plain english,
  and high yield", for the redesign only for now. The notes' level switch in the engine is **As taught · Plain English · High
  yield** (`widget/hub.js` `drawNotes`, `widget/hub.css` `.hy-*`) on every lecture with predicted topics: the "What's tested"
  box, then each `LIKELY_TOPICS` topic in order as a numbered heading in the lecture's color, why it's on the list and its
  question count, the Exam Hints' takeaways that go with it ("Know this"), and the paragraphs (or list items) of the As taught
  notes that teach it, with their figures; then the other flagged hints and the "You can skip" ones. Nothing is written by
  hand: `tools/hub-next/high-yield.mjs` picks each topic's paragraphs with the BM25 match "Find this in the notes" uses, each
  of the topic's questions voting for the paragraph that answers it (two at most, a second only where two signals agree; no
  repeats), and `tools/hub-next/build.mjs` writes the result into `notes.json` as `hy` (21 lectures: Heme & Endo Exam 2's 8,
  Occlusion's 4 final lectures, Perio's 9), so CI's `--check` keeps it current. `node tools/hub-next/high-yield.mjs <hub>
  [<lecture>]` lists every pick. In High yield, Listen uses the device's voice, the end-of-notes button opens the lecture's
  High likelihood questions (`notes:practice-likely`), and reading to the end doesn't mark the notes done. The smoke test
  opens High yield on each redesigned hub. **Narration held**: about 135 MB of Kokoro would take the site (960 MB) past
  GitHub Pages' 1 GB cap; Sam chose to hold it ([task](vault/tasks/done/2026-11-12-high-yield-narration.md)). The About page text
  and the rule edits wait in the [redesign release](vault/tasks/done/2026-11-06-redesign-release.md) note;
  [high-likelihood-topics](vault/rules/high-likelihood-topics.md) now says the topics build it.
- **2026-11-12 (Follow along: the redesign highlights the word being read, Claude Code)** — The survey's "highlight the words
  being read when listening to the lecture notes voiceover", approved by Sam for the redesign. While Listen plays a lecture's
  narration in a redesigned hub (`hubs/<id>/next/`), the word being read is highlighted in the notes and its sentence shaded
  more softly (CSS Custom Highlights, `::highlight(sh-read)` / `(sh-read-line)` in `widget/hub.css`: the notes' text and the
  student's own highlights are never touched); the page scrolls to keep it in view while the reader follows along, stops
  following when they scroll away, and jumps to the new place on a seek. A **Follow along** toggle beside Listen
  (`sh_pref_follow`, `notes:follow=on|off`). The times: `hubs/<hub>/audio/<lecture>-<level>.words.json` beside each mp3, for all
  52 narrations of Heme & Endo Exam 2, Occlusion and Perio, made from the recordings by the new `tools/narration_words.py`
  (Kokoro's duration model cut to that output, aligned to each mp3's loudness; median error 20-40 ms, 96-100% of words within
  0.2 s against exact timings). `tools/narrate.py` now writes the file from Kokoro's own timings whenever it renders, and the
  smoke lint fails a redesigned hub whose narration has no words file or one made from another recording.
  `tools/kokoro-setup.sh` installs kokoro-onnx 0.6.1+ and `onnx`. **Live on Perio:** Session 5's narration (both levels)
  is regenerated: its middle (minutes 5-9 Plain English, 6-15 As taught) no longer said what the notes say, found by the
  timings' fit check and confirmed by comparing a fresh rendering minute by minute (`narration_words.py --render`). `widget/v3.js`: `shTTS.audio()` and the `sh:tts-audio` /
  `sh:tts-stop` events for it, and the Listen dock's title no longer repeats a hidden lecture badge ("L11L11 · ...", every
  hub). The About page text waits in the [redesign release](vault/tasks/done/2026-11-06-redesign-release.md) note, like the
  redesign's other features. [Task](vault/tasks/done/2026-11-12-redesign-follow-along.md).
- **2026-11-11 (Lessons refresh, Claude Code)** — Data read 5:30 pm Central, two days before Heme & Endo Exam 2. The 11-10
  evening's six explanation fixes worked (first tries 29% before, 81% since, against the bank's 70% -> 74%), and the Cushing labs
  no longer read backwards (`p1-corticotroph` 1 of 12 -> 6 of 10). Five more Heme & Endo Exam 2 explanations now name the class's
  favorite wrong answer, from the notes: `dm-pb-cpep-2` (the three drugs that still work without beta cells), `mh-wall` (Leydig
  cells sit between the tubules, not in the wall), `mp-e2-role` (inhibin is the brake on FSH), `dm-pb-hf-1` (glipizide has no
  heart failure warning) and `p1-hashi-3` (diffuse hyperplasia is Graves). Perio `q3-S02` (report #41): its explanation now says
  what each statement claims and which of the slide's three numbers belongs to which group. Explanations only: ids, keys,
  choices and their order are unchanged, so no picks move; `next/content` rebuilt for both hubs. `LESSONS.md` Live signals
  rewritten; the PCD Implants retrospective now counts 6 check-ins.
- **2026-11-11 (migration_v54: no visiting opt-out, an idea delete removes the idea, Claude Code)** — Nothing students see
  changes, and the migration is still not applied (it waits for the redesign's release). Sam's two "no" answers on the open
  calls, made in `migration_v54.sql`: **visiting can't be turned off** (`set_visiting`, `pet_visit_off`, `visiting` in
  `get_my_shop`, Link my devices' move of it and `sh_visit_link` are gone; every board row has a visit key), and **an
  author's delete removes their idea completely** (`delete_my_idea` deletes the row; its votes, reports and Inbox notes go by
  cascade, so it no longer counts toward the day's three or the 20 seconds; `hidden_by` has no `self`). `xp.js` (344 checks),
  `rls.js`, `rls-expectations.json`, `rls-audit.sql`, the design page's rank board (no switch, no "Visits off" row) and the
  notes follow. [The open calls](vault/tasks/done/2026-11-11-redesign-open-calls.md) are done.

- **2026-11-11 (Timmy Time: Heme & Endo Exam 2 episode, Claude Code)** — A 52-minute (51.7) last-minute review for Heme &
  Endo Exam 2 (Fri Nov 13): `hubs/heme-endo-exam2/audio/timmy-time.mp3` (37 MB, -16 LUFS), script
  `tools/podcast/heme-endo-exam2/script.md`, from the hub's notes (As taught), Exam Hints (every professor quote word for
  word), cram sheet, `LIKELY_TOPICS` and LESSONS.md's live signals for the hub (the Cushing labs read backwards,
  meglitinides and hypoglycemia, metformin vs the disulfiram reaction, secondary hyperparathyroidism on dialysis,
  follicular carcinoma's spread). 14 chapters: insulin and diagnosis, the non-insulin drugs, primary or secondary and the
  pituitary, thyroid, parathyroid, adrenal, male and female reproductive histology and physiology, a short Exam 1
  refresher, a 31-question lightning round and the sign-off. It follows #320 (merged while it rendered): the refresher
  covers only L2, L3, L6 and L10 and starts with the class's split of the five (two from L2, the synergy pairs, how PTH
  keeps calcium up), the histology segments say the exam's two picture questions are the Sertoli cell and the follicle
  stages, and each of the 11/11 in-class review's 20 questions has its point in the episode. Lecture A, L17 and L18 (not on this exam) are left out; no graded quiz content (Quiz 3 is still open). Where the notes
  give two numbers it says whose is whose. Lore (Sam picked three): thirty-one bought a glucose meter and checks it after
  every meal, yours ("You don't have a pancreas"); Timmy came from a dental follicle too (it made his cementum, ligament
  and the bone around his roots); the Thanksgiving pie is "a postprandial event". Two lore comments (rolled): number
  thirty-one and the toothbrush by the door. `lexicon.json` gains 69 entries (the gliptins, gliflozins and glitazones,
  semaglutide, oxytocin, oophorus, Leydig, Sertoli, Mullerian, Wolffian, Zellballen, sestamibi, Dababneh, Fasinu, and `C-E-A`, `P-S-A`,
  `I-G-A`, `D-A-G`, `S-I-A-D-H`, `type-A`, whose final A read "uh"). Hub: `SH_PODCAST` (id `exam2-review`), card on Home
  under the quick-start row, "Also here" link, `#timmy` opens Home; `next/content/` rebuilt so the new version carries
  it; dashboard card gets `podcast` and "Timmy Time" in modes; About page's episode list and `LORE.md` updated.

- **2026-11-11 (Heme & Endo Exam 2: Exam 2's review questions with twins, the Exam 1 breakdown, the two pictures, Claude Code)** —
  Sam sent the in-class review's 20 PollEv questions: "add these exact questions and then use each question to make a similar
  question with a different option as the answer". All 20 are in the bank as given (`rv-*`, src `review2`, "Exam 2 in-class
  review", one typo fixed), each with a twin (`rv-*-twin`, src `twin`, "Like an Exam 2 review question") keyed on a different
  choice, every choice with its why, all from the hub's notes; each lecture gets an "Exam 2 in-class review (11/11)" High
  Likelihood topic. Sam on the five Exam 1 questions: "2 questions from l2, question on which hormones synergize, and pth
  maintenance": three new R topics (PTH and calcitriol synergize; how PTH maintains blood calcium; T3 synergizes with GH on bone)
  with three new questions and three Exam 1 copies, R's notes (both levels, narration regenerated), cram and a focus hint, and the
  mock's five now follow the split (`MOCK_PLAN`: 2 from L2, 1 synergy, 1 PTH, 1 any). "The two images on the exam are sertoli and
  female reproductive stages": focus hints and an `EXAM_INFO` "Pictures" row, and (Sam: "Yes, draw it", then a screenshot of the slide: "This is
  actually the female question he was talking about") an unlabeled drawing laid out like Dr. Herr's five-stage slide
  (`FIGS.follicles`, `tools/figures/heme-endo-exam2/follicles.mjs`: his numbers 1-5, his labels as letters A-K) under L14's
  notes with six picture questions. 547 questions (52 new ids in the registry); `next/` rebuilt. About page's High Likelihood and Diagrams entries updated.

- **2026-11-11 (Heme & Endo Exam 2: the five Exam 1 questions come from L2, L3, L6 and L10, Claude Code)** — Sam: "the exam 1
  questions for heme and endo exam 2 will come from l2,6,3, and 10". The Exam 1 Refresher's `LIKELY_TOPICS` keep only those four
  Exam 1 lectures' 23 topics (93 questions; 32 topics dropped), so the mock's five Exam 1 questions, **Exam 1 High likelihood** in the
  Question Bank and the drill draw on them alone. Then Sam: "cut the refresher questions that arent from tested lectures": the
  other six lectures' 114 questions (`r-pa-2s-2` among them) are retired in `tools/question-ids/heme-endo-exam2.txt`, so R holds
  93 and the hub 495. R's notes, both levels, and its cram sheet now cover only L2, L3, L6 and L10 (the plain level gains PNMT, Addison's and
  four L10 lines from the full notes), so `refresh-full.mp3` and `refresh-plain.mp3` were regenerated. An R `focus` Exam Hint, Home's
  chips and exam card, `EXAM_INFO`, the hints banner, the mock's intro and the About page say which four. `next/` rebuilt (its
  `SH_HUB` words too). No schema change.
- **2026-11-11 (redesign phase 3, third pass: a classroom and a stage; the hubs share each Timmy's outfit, Claude Code)** —
  Sam: "make a fully drawn classroom with the timmys of the people studying and make them wear what the user has their
  timmy dressed as. it should be animated. timmys should walk in and sit at a desk or get up and leave as people join or
  leave. Also i want the leaderboards and pedestals to be more epic". **One live change:** each hub tab now sends what its
  Timmy is wearing with its studying-now presence (`widget/v3.js` `trackPresence()`, `shPet.fit()` in `widget/pet.js`:
  `<holiday>:<outfit>`, empty before he's adopted, with Timmy off or in Focus mode), with no name or id; it isn't stored.
  The About page's "What the hubs record", [event-taxonomy](vault/reference/event-taxonomy.md) and
  [analytics-retention](vault/reference/analytics-retention.md) say so. **On the new dashboard** (still beside the live
  one): the studying-now tile is a drawn classroom (`tools/figures/site/classroom.mjs`), 150 px tall (170 on a phone),
  the count and the three busiest hubs on its chalkboard, a Timmy at a desk for each presence key in that outfit
  (`shPet.art({ fit })`; an outfit is only ever a lookup key), desks in the hub's tint, day or night by the viewer's
  clock, rows added as it fills, "+N in the hall" on a sign past a full room; people hop in through the door and jump
  into a desk, or get up and leave (the Web Animations API on wrapper groups; more than six changes at once, a hidden
  tab, reduced motion or answer animations off seat them without the walk; Focus mode keeps the plain count). The
  leaderboard is a stage (`stage.mjs`): curtains, lights, torches, confetti, gold, silver and bronze blocks, a crown, the
  top three as Timmys (their outfit from `get_place` through the row's visit key once migration_v54 is applied; plain
  until then), places 4 to 10 as dark rows with a bar against first. Both kits are written into
  `widget/hub-art/class.js` (`window.SH_CLASS_ART`, 26 KB) by `tools/figures/site/build.mjs`, which also writes the
  shop's 55 outfits and `dress()` to `widget/hub-art/outfits.js` (168 KB, loaded only when someone on the page wears
  one). The preview has a made-up class that comes and goes (`shDash.setLive(by, list)`) and a `get_place` stub. The
  smoke test seats eight made-up people and checks the count, the stage and that markup sent as an outfit is never
  drawn. **The recap** (Sam: the first redraw "doesnt read as a bar graph and it also also needs to fit in a smaller
  card") is a compact drawn card: the hours, the classmates as a crowd of teeth, hours per day as drawn columns with
  the exam day's flag and Timmy on one (`recap.mjs`, drawn by `recapArt()` at the card's width), fact chips with trophy
  drawings, beside the hubs that just closed on a laptop. `class.js` carries the recap kit, its six icons and the hat
  (55 KB). BUG-068 to BUG-073 found and fixed (two in the preview's UAT, two on the recap). **Your own Timmy is
  marked** (Sam: "Mark your timmy"): a "You" plate on his desk, on your own screen only. A hub tab keeps its random
  presence key in the browser (`sh_presence_mine`, `rememberMine()` in the live `widget/v3.js`) and the dashboard's
  `paintMe()` finds that desk; nothing new is sent or stored on the server (BUG-074). Merged 2026-11-12 on Sam's word ("merge"), after a rebase
  and one more fix the smoke test found the day before an exam (BUG-075: "Send luck" at the largest text on a phone).
- **2026-11-11 (redesign phase 3: the new dashboard, beside the live one, Claude Code)** — Nothing students see changes.
  `next/index.html` is the dashboard on the design system (`widget/dash.js`, `widget/dash.css`); outside a preview it sends
  visitors to the live dashboard, and it takes `index.html`'s place at the redesign's release. The hubs are tabs with their
  emblems and colors; the open hub is a stage (its drawn scene, the days left on a flip tile with a bead for each day, a
  progress ring, Start studying, Daily drill, luck); one "you" card (Timmy's house, rank, mastery medals, streak with the
  week as dots); the class panel has the live "studying right now" count with a chip for each hub and the leaderboard
  (ranks or streaks, the top three on a podium); Past hubs shows each finished exam's recap as a live infographic (Save
  image still draws the picture with `widget/recap.js`) and the hubs that just closed. **Out, on Sam's calls:** correct in
  a row, the What's new log, the arcade scores and the When people study chart. Check-ins, surveys, the Inbox, luck, the
  name picker, Settings with Focus mode and the tour (from the menu, its own steps through `window.SH_TOUR.steps`) are the
  live dashboard's logic, moved over. Its hub list is `next/hubs.js`, copied from `index.html` by
  `tools/dash-next/build.mjs` (`--check` in CI) until the release; `widget/hub-art/dash.js` holds every hub's emblem and
  tint (from `tools/figures/site/build.mjs`). `migration_v54.sql` is still pending: the page calls the `_v2` functions with
  a fallback to today's, and the preview stubs them. The smoke test, `a11y.js`, `perf.js`, `matrix.js` and the syntax check
  cover the page; the new hubs' Back button goes to it. The idea board is a second session's (its slot is `#ideas`); Timmy's
  place and visiting (`data-visit` on the board's rows) are phase 4's. Drafts for the About page and the switch are in the
  [release note](vault/tasks/done/2026-11-06-redesign-release.md); bugs BUG-063 to BUG-067 found and fixed while building.
- **2026-11-11 (Occlusion: the final's repeat questions retired, Claude Code)** — Sam: "merge it and check the rest of the
  final questions", with the bar from `mo-10` (a concept may be asked two ways, never more than twice; no new questions).
  Every L6-L9 question's facts were listed, counting each statement of a two-statement or numbered item and facts shared
  across lectures (the bulimia pattern and cupping are in both L7 and L9): 58 facts were asked three to five times. 58
  questions came out (L6 17, L7 15, L8 13, L9 13: mostly the plain repeat, plus the two-statement and numbered items whose
  every statement was asked elsewhere), so each fact is now asked at most twice, in two formats where possible, with Patient
  Box questions kept over plain ones. No fact is left unasked, each lecture keeps its format minimums, and the bank is
  783 questions. Ids marked `retired` in `tools/question-ids/occlusion.txt`; their why rows and High Likelihood ids went
  with them; `next/content` rebuilt. The kept/retired list per fact is in the PR.
- **2026-11-11 (Occlusion: `mo-10` retired, Claude Code)** — Sam: "Retire mo-10 if it is redundant ... it is okay to test the
  same concept multiple ways. just not for every single question and not more than twice." It was (report #40): the final's
  lectures asked the same fact, about 10% of people have MIP coincident with CR closure, three times. `mo-10` came out with its
  why row and its place in the orthopedic-instability High Likelihood topic, and is `retired` in `tools/question-ids/occlusion.txt`;
  `in-90` (L6) and `mo-tf-3` (L7) keep the fact. The final's lectures hold 412. `next/content/` rebuilt. No questions added.
- **2026-11-11 (Perio S7: Dr. Kaur's final focus, peri-implant health, mucositis and peri-implantitis, Claude Code)** — Sam: "Dr. Kaur
  said for her part of the perio final to really know peri-implant health, mucositis, and implantitis. The clinical questions will be
  based on that." `hubs/perio`: **three new drawn Patient Box cases**, one per 2017 state, each read against its own baseline
  (`implant-19`, health that probes 5 mm with 1 mm of first-year remodeling; `implant-5`, mucositis in a smoker; `implant-14`,
  peri-implantitis in a former smoker treated for periodontitis, with poorly controlled diabetes and suppuration), validated by
  `tools/ci/cases.js`, and **14 case questions** (`pc-g1`-`g4`, `pc-h1`-`h5`, `pc-i1`-`i5`: the diagnosis, why a 5 mm implant can be
  healthy, remodeling vs pathologic loss, why the pockets deepened, treat mucositis now, the one finding that makes it
  peri-implantitis, when a film is indicated, suppuration, the cause, the risk-factor list, the susceptible host), each choice with
  its why and "In the notes" links; bank 749 -> 763. An S7 **Exam Hint** (new `src:'relay'`, shown as "Paraphrased", since it
  isn't her exact words), an S7 **notice** at the top of its notes (`note`, not narrated, so no audio change), S7's **High
  Likelihood** list re-ranked with five "final focus" topics first (the new basis is explained in the list's intro), Review's
  **Reading an implant case, step by step** under the 2017 table, and a cram line. The notes' text is unchanged (no narration to
  regenerate; perio has no Timmy Time episode). No schema change.

- **2026-11-11 (redesign phase 2: the new Perio, beside the live one, Claude Code)** — Nothing students see changes.
  `hubs/perio/next/` is Perio on the shared engine, with no engine of its own: settings in `window.SH_HUB`, content in
  `next/content/` written from the live hub by `tools/hub-next/build.mjs --hub perio` (its `adaptPerio()` maps Perio's own
  names: hints, cram, trophies, the exam format, the suture pictures, each session's Review tables), and outside a preview it
  sends visitors to the live hub. Same hub id, state key, answered event, all 749 question ids and **Perio's own saved shape**
  (`stateShape: "answered"`; the live page reads a save the new one wrote), and the same export, so question health keeps
  every version. The engine (`widget/hub.js`, gated) learned recall cards, case links, HTML review sections under the notes,
  the exam-format mock (46 in 80, partial credit, an ordering question) and Perio's arcade API; for every new hub, the games
  keep their own button style (BUG-058) and tag questions with the lecture's color. Perio's text takes a deeper pink for
  contrast (`widget/hub.css`). Its six arcade lobby drawings are in (`tools/figures/site/arcade.mjs`, Sam's look on
  2026-11-11; Pocket Showdown's board redrawn after the first one's teeth). The games' icons on the engine are sized as on the live hubs
  (BUG-059: Occlusion's and Heme & Endo's Back and Full screen buttons had grown). Budgets and the accessibility baseline
  gain the page. Hub note: `vault/hubs/perio.md`, "The new version".
- **2026-11-11 (redesign phase 2: the new Heme & Endo Exam 2, beside the live one, Claude Code)** — Nothing students see
  changes. `hubs/heme-endo-exam2/next/` is the hub on the shared engine, built the way phase 1 built Occlusion's: settings in
  `window.SH_HUB`, content in `next/content/` written from the live hub by `tools/hub-next/build.mjs` (now with
  `heme-endo-exam2`; CI's `--check` covers it), and outside a preview it sends visitors to the live hub. Same hub id, state
  key, answered event and all 609 question ids. The engine (`widget/hub.js`, gated so Occlusion's new version is unchanged)
  learned what this hub needs: **review-only lectures** (the Exam 1 Refresher out of every total and out of the bank until
  ticked, `SH_EXPORT.uncounted` for the medal), **a toggle tied to a lecture** (Exam 1 High likelihood ticks R and unticks it
  again), **the mock's grouped L12 and the Refresher's five High Likelihood picks**, "which statement" type filters, focus-list
  hints and a plural "In the professors' words". The build handles a hub without the Occlusion drawing kit (its `FIGS` and
  `FIG_PLACE` as data). Its six arcade lobby drawings are new (`tools/figures/site/arcade.mjs`, from `HEE2_SKIN`). After Sam's
  look ("more color ... to distinguish each lecture"): **each lecture has its own color** on every hub on the engine (question
  cards' lecture chip and top edge, the notes' list, Home's rows, the picker, hints, cram, mock and stats; a review-only
  lecture grey; `LCOL`/`lc()`, `.lc-0` to `.lc-9`), and **Notes done** (a button at the end of the notes, or reading to the
  end after a minute; `STATE.read`, this device) fills a lecture's badge. **BUG-056**, fixed: on the new hubs the Timmy Time
  player's Play and Post buttons were in the default color with dark labels (each hub's tint now on the page root too,
  `data-hx-hub`). `/podcast` now rebuilds a hub's new version. **Live:** the About page's High Likelihood entry now says the
  mock's five Exam 1 questions are drawn at random (Sam: "draw at random"). Round 3 (Sam: "Redesign the timmy time
  ui/card"): on every hub on the engine, More > Timmy Time is one page: the episode on a field of the hub's color with Timmy
  in headphones (he bobs while it plays), a big Play, round skip and speed buttons and a progress bar on it, the chapters as
  a track list (always open, two columns on a laptop, the one playing marked with a small equalizer), then "What the class
  thinks"; the pinned player is in the hub's color too. The engine only lays out and restyles the shared player
  (`podDress` in `widget/hub.js`, `.pod-x` in `widget/hub.css`), so the live hubs' player looks the same. Home's animated
  Timmy Time card stays where it was. **Live, no look change: BUG-057**, fixed in `widget/podcast.js`: the speed and
  like/dislike buttons' spoken names now include what they show ("Playback speed 1×", "Like this episode, 7 likes").
  Notes: [hub note](vault/hubs/heme-endo-exam2.md), [phase 2](vault/tasks/done/2026-11-05-redesign-phase-2-live-hubs.md).

- **2026-11-11 (CI: the test browsers install when Ubuntu's mirror is down, Claude Code)** — Three "Check hubs" runs on
  #312 in a row failed before any browser test ran: the GitHub runner couldn't resolve `azure.archive.ubuntu.com`, so
  `npx playwright install --with-deps` failed on optional font packages and never downloaded Chromium. Both workflows
  (`check.yml`, `release.yml`) now fall back to installing the browsers alone (the runner image already has the
  libraries they need) and put a warning on the run's page. Nothing students see changes. Sam asked for it in its own PR.

- **2026-11-11 (cheaper sessions for the rest of the redesign, Claude Code)** — Sam: "implement these changes". The eight
  question-writing rules (every choice's why, two-statement and true/false, numbered, which-statement, high likelihood, what
  professors skip, the bank's panel, question-health flags) are `load: on-demand`: the new `hubs/CLAUDE.md` loads them whenever
  a session opens a hub file, and `CLAUDE.md` lists them under "Feature rules". The narration, usage-data and reports how-tos
  are links. Every session now starts with about 58 KB of notes instead of 81 KB (about 5.6k tokens less on every turn). New:
  [run-a-redesign-session](vault/how-to/run-a-redesign-session.md) and [the open calls](vault/tasks/done/2026-11-11-redesign-open-calls.md)
  for Sam in one list; phase 4 starts by splitting `widget/hub.js`.

- **2026-11-10 (migration_v54 applied by mistake, then undone, Claude Code)** — After Sam's "also apply the sql", a
  session applied `migration_v54.sql` (the game layer's server) to the live project, though it was meant to wait for the
  redesign's release. No page called it and no student data reached its tables. Sam: "dont run the migration if it wasnt
  supposed to yet". `supabase/rollback-v54.sql` (tested on a throwaway copy: schema + v54 + rollback = schema) drops what v54
  added and restores today's three replaced functions; Sam OK'd it and it ran on the live project the same night (none of v54's
  tables or functions left, the three functions back with today's grants, no migration-history row, today's bootstrap
  answers). v54 stays in `supabase/pending-migrations.txt` for the release.
  Lesson: a migration listed as pending waits for its release, even when someone asks to "apply the sql"; ask which one.

- **2026-11-11 (Heme & Endo Exam 2: L16 taught from its recording, Claude Code)** — Sam uploaded the L16 transcript
  (Dr. Madison, Tue 11/10). Female Reproductive Physiology goes from slides-only to taught: notes at both levels checked
  against what he said (a "What he stressed" box; DHT and the external genitalia, leptin and what inhibits GnRH, theca cells
  with no aromatase, oocyte maturation inhibitor, the luteal phase's glycogen and slight rise in temperature, Turner
  syndrome as his primary amenorrhea example, prolactin turning GnRH down), 17 Exam Hints quoted from the recording (he
  called comparing the follicular and luteal phases "high yield for exam" and the two-cell slide "very important"; he
  won't test the other steroid enzymes, the in-between follicle names or the whole-body actions slide, and no question
  depended on them), 7 new questions and 2 back (`fp-2s-default`, `fp-lh-block`; L16 43 to 52, the Exam 2 lectures 402),
  `src` relabeled `rec` on 28, High Likelihood re-ranked from the recording (40 questions under 10 topics, none dropped),
  cram, a follicular versus luteal table in Review, the sequences and sort set, and both mp3s. **Midcycle FSH is settled:**
  he said FSH rises too, far less than LH, because inhibin holds it back, as in Dr. Herr's L14 graph; the `cycle` figure's
  hover text and sources say so (`tools/figures/heme-endo-exam2/cycle.mjs`). The pronunciation lexicon reads KNDy as
  "candy" and OMI as letters.
- **2026-11-10 (Lessons refresh, evening, Claude Code)** — `/lessons-audit`, data read 9:45 pm Central. Heme & Endo Exam 2: six
  explanations now name the class's favorite wrong answer and why it's wrong: `p2-case4-a` (an adrenal tumor, not a pituitary one,
  with ACTH under 5), `p2-case6-a` (Addison's high ACTH is lost feedback, not a tumor), `p2-shpt-dialysis` (primary hyperplasia raises
  calcium), `dm-meg` (meglitinides still cause hypoglycemia), `dm-met-lactic` (the disulfiram-like reaction is the sulfonylureas') and
  `p1-fc-mets` (follicular carcinoma reaches the lung by the blood). Occlusion: report #39, `mo-repos-irrev`'s choices no longer give the
  answer away (two said "Reversible", one "Irreversible"): now two of each, each with a reason, and its why lines and explanation
  match; positions 0 and 2 keep their meaning, and no class picks sat on 1 or 3, so nothing is stale. `next/content/` rebuilt. Same ids
  and answer positions everywhere. `LESSONS.md` Live signals rewritten; two report lessons added (a category word repeated in two
  choices; one fact asked three times, report #40; Sam kept `mo-10`). Reports #39 and #40 answered at merge.
- **2026-11-10 (Occlusion L9 diagrams: abfraction, cupped cusp tips, pH vs buffering capacity, Fig 19 again, Claude Code)**
  — Sam: "Approve the budget, make all diagrams, merge when ready". All four L9 candidates are built in
  `tools/figures/occlusion/anima/`, in the L9 notes at both levels next to the paragraph each explains (`FIG_PLACE.nccl`
  in `od.js`) and in L9's Review (three `figs` sections). **Fig 24 `abfract`**: a mandibular premolar in its bone; move the
  load from the long axis onto the buccal cusp's incline and the tooth bends about the crest like the pushed stop sign
  beside it (compression lingual, tension buccal); "Load it again and again" grows the notch on the tensile side just
  above the bone. **Fig 26 `cupping`**: a mandibular first molar's crown in section; wear the cusp tips down until a
  pinpoint of dentin shows, then wear alone (a flat facet, L7) or wear plus acid (the dentin cups out below an enamel rim),
  beside a pH scale with dentin's critical pH above enamel's. **Fig 25 `buffer`**: two drinks at pH 4 with pH probes; add
  bicarbonate a drop at a time (A neutral after 5, B, a citric acid buffer, after 40) or water (the pH barely moves), with
  a pH vs drops chart. **`erosion9`**: L7's Fig 19 again under L9, opened on bulimia with L9's reasons (the lip, the
  tongue) and the NCCL view one tap away, as an **alias**, a new `build.mjs` entry type that reuses a figure's drawing and
  live code under another lecture with data overrides (`erLive` reads `D.start` and `D.extra`). About page: an L9 sentence
  in Diagrams. Occlusion's page is 1379 KB over the wire, so its budget went from 1370 to 1395 KB (BUG-055; BUG-053's raise
  approved).
- **2026-11-10 (Timmy's place, round 3: on the design page and in the pending migration only, Claude Code)** — Sam's
  third round of feedback ([task](vault/tasks/done/2026-11-10-redesign-timmys-place-round-3.md), PR #299, stacked on #289).
  **Students see nothing yet**: nothing is wired into `widget/pet.js`, `widget/eggs.js`, `widget/hub.js` or
  `widget/ranks.js`, and `migration_v54.sql` is still unapplied. (1) Art fixes: "Why each choice" folded, a pop on the
  "Good question?" thumbs, shiny gold XP text, a five-level streak flame (blue at 10 days, Dark Matter at 30), the coin
  as a dental crown, Perio's emblem tooth, "Default" on the cottage; the hill and island rise gradually; the seaside,
  cloud and starlight scenes, the castle, treehouse, beach hut, observatory and igloo, and most of the yard redrawn (a
  **mouthwash fountain**, id `mouthwash-fountain`, a dog with the doghouse, a mint for the lane's ball). Timmy waves and
  his speech bubble follows him. (2) Hub mastery: the pennants are gone; a **medal board** beside the house hangs each
  hub's own mastery medal in miniature (up to 20), and tapping it opens a big view of every medal (Sam picked the plaque,
  then asked for the same medals on the board and in the pop-up; no trophy case, no gems, no `mastery` option).
  (3) **Sets**: `tools/figures/site/sets.mjs`
  lists 14 seasonal sets of 8 pieces (new: Spring, Summer, Tooth Fairy week, Mardi Gras, the Fourth of July) and the
  Handpiece's six rank sets (an outfit and a yard piece per full rank-up, earned, never sold); each is one file in
  `tools/figures/site/packs/` ([how-to](vault/how-to/draw-a-seasonal-set.md)); the build checks 1,436 drawings and 3,384
  walks and `--strict` fails on a set with no pack. (4) Server, still pending: the catalog is 181 rows; seasonal windows
  (`sh_shop_seasons`), two throwback days a month, rank sets by rank, Halloween's set as a gift, the shop's shelves in
  `get_my_shop`, and visiting (`get_place` by a board's visit key, on by default, `set_visiting`); `tools/release/xp.js`
  348 checks; nothing seasonal is sold before its season's first run (`added_on`, `sh_season_was_on`); the Fourth of
  July's set is June 28 to July 4 (Sam confirmed). (5) The design page shows all of it as mock-ups on made-up names: a
  **wooden shop** (plank walls, cabinets, a counter; any piece opens in its own window; "Back for today" is a corner stamp; buying plays out by rarity
  with synthesized sound cues), a **customizer** (a picture dock, shelves, a wardrobe rail, a camera that moves in), the
  **rank board** with each rank's handpiece emblem and your own name on a gold nameplate, and **visiting** (Visit, a
  random visit, next and back, a trip through soft clouds). (6) Polish: the statue's handpiece stands upright; the
  igloo's doorway is clear; the emerald hills have one gated wall. (7) **Timmy's podcast studio** is a yard piece (kit
  key `studio`, shop id `podcast-studio`, Epic, 2,400): a sound booth with an on-air lamp, an antenna, the show's poster
  and his mic; tapped, it goes on air. (8) **Timmy's health at his place**: the kit's `HEALTH` table (eight levels, the
  cut-offs of `conditions()` in `widget/pet.js`) sets his drawing, how he hops, how much he wanders, his wave, whether he
  flips and what he says; at 0 HP he stays on the doorstep. A visitor never sees it. (9) **Gentler ground**: every
  scene's contour is a wider, flatter bell (`arcTop(cx, top, edge)`; Sam: "too extreme and pointy"), and each scene
  raises its backdrop to match (`farLift`). Sam: "Looks good", "its good to merge when youre ready" (#299, with #289's
  commits). Next: the wiring into the live widgets.
- **2026-11-10 (Heme & Endo Exam 2: the exam's own count per lecture, Claude Code)** — Sam, from Dr. Herr: 5 on Exam 1, 8
  on L11, 9 on L12, 7 each on L13-L16, and L16 is the last lecture on the exam. `EXAM_COUNTS` (= `MOCK_BLUEPRINT`, with
  `EXAM_GROUPS` letting L12's two hours share their 9, drawn at random) drives the mock, the "Most likely questions" box,
  Home's exam facts and the Exam Hints banner. High Likelihood keeps every topic (Sam: "Dont remove any high likelihood
  questions"; the High Likelihood rule now says counts never trim topics, for every hub). L17 and
  L18 aren't added to this hub (they go to Exam 3 with Lecture A). Also fixes two places #304 missed that still said
  Lecture A was on the exam (BUG-054).
- **2026-11-10 (Occlusion L9: Noncarious Cervical Lesions, Dr. Lawson's prerecorded lecture, Claude Code)** — Sam added
  the transcript of Dr. Lawson's prerecorded lecture for the 11/12 session ("i dont have his slides yet or the other
  lecture from thursday"), so L9 `nccl` went live from the recording alone, the way L8 did. It has its own notes at both
  levels with both mp3s (`audio/nccl-full.mp3`, `-plain.mp3`), 57 questions (`nc-*`, `cs-nc-*`: 22 multiple-choice, 10
  Patient Box case items on three pbox-only cases, 5 two-statement, 9 true/false, 4 numbered, 2 which-true, 2
  which-false, 2 select-all, 1 match, every choice with its why), 16 emphasize and 2 de-emphasize Exam Hints, 10 High
  Likelihood topics, a Review group and two side-by-side rows, cram lines and two sort sets. The bank grows from 785 to
  842. The mock stays 45 questions in an hour, now 12 each from L6-L8 and 9 from L9. A ninth tag color, slate, was
  added to the tag CSS (light and both dark blocks). The exam card, hints banner, mock intro, Home notice, page
  description, footer and dashboard card list L9 and no longer say the final is only Dr. Givan's lectures; the
  redesign (`next/`) copy matches and its content was rebuilt. Lexicon: NCCLs, Dzakovich, chelator, exostoses, tori,
  subgingivally, CEJ. The notes give both views where L9 meets L7 (Lawson: abfraction is a cause, treat it with a night
  guard; Givan: not yet proven clinically). Pending in [the follow-up task](vault/tasks/done/2026-11-10-occlusion-l9-follow-ups.md):
  Sam's answers on four diagram candidates, the check against Dr. Lawson's slides (names spelled by ear) and the other
  11/12 lecture as L10. Occlusion's performance budget 1350 -> 1370 KB (L9 adds about 25 KB over the wire; BUG-053),
  for Sam to approve with the PR. No schema change.
- **2026-11-10 (Heme & Endo Exam 2: Dr. Taylor's Lecture A out, saved for Exam 3, Claude Code)** — Sam asked Dr. Herr:
  he forgot Lecture A when he wrote Exam 2, so it will likely be on the next exam ("i guess save all that for exam 3").
  A came out of the hub whole: its notes at both levels and both mp3s, 58 questions (`dc-*`, retired in the hub's
  registry), 15 Exam Hints, its Review group and three side-by-side tables, cram lines, 3 sequences, 1 sort set and 11
  High Likelihood topics. The mock's 45 new questions now come from L11-L16 (A's 5 went one each to L12a and L13-L16).
  The exam facts on Home say A isn't on Exam 2, and the timeline marks it for Exam 3. A mock started before the change
  drops A's questions instead of counting them unanswered. Everything A had waits in
  `vault/tasks/2026-11-10-heme-endo-exam3-carry-lecture-a.md` (from commit `43ece52`) for the Exam 3 hub.
- **2026-11-10 (Heme & Endo Exam 2: the two-Sertoli-cell figure, Claude Code)** — Report #38 and Sam's "Draw the figure":
  the hub's own unlabeled version of Dr. Herr's L13 drawing he said is on the exam (`tools/figures/heme-endo-exam2/sertoli.mjs`),
  laid out like his slide (Sam's screenshot, matched and not committed): his ten labels numbered in scrambled order and the
  two compartments lettered, with the key after answering. It sits above
  `mh-fig-seq` and `mh-fig-label` and under the notes' "Sertoli cells" heading; `build.mjs` now writes the hub's `FIGS` line.
- **2026-11-10 (Perio S9: five drawn diagrams, Claude Code, #301)** — Sam: "Yes to all diagrams. Merge when ready". The five
  S9 candidates, built with the anima kit in `tools/figures/perio/` (`cairo.mjs`, `palate.mjs`, `grafts.mjs`, `ape.mjs`,
  `egd.mjs`; `build.mjs` pastes them into the hub): **Fig 1 The Cairo recession types** (one canine with 4 mm of
  recession as RT1, RT2 and RT3, the buccal and interproximal CAL, and a toggle for what a graft can cover), **Fig 2 The
  palate as a donor site** (a section through a premolar and the palate: epithelium, lamina propria, submucosa, and the
  greater palatine bundle at about 7, 12 or 17 mm for a shallow, average or high vault, with FGG and CTG outlines),
  **Fig 3 Covered or exposed: which graft** (a CTG under a coronally advanced flap and an FGG left exposed above an
  apically positioned flap, four steps each, from his two recorded cases), **Fig 4 Altered passive eruption** (Coslet's
  Types 1/2 and A/B, before and after their crown lengthening) and **Fig 5 A gummy smile: find the cause** (lip length
  and mobility sliders, the lower facial third and short crowns, each pointing to its cause and treatment). Under the S9
  notes and in the Review section each illustrates; Figs 4 and 5 follow the slides until the live class is posted. Each
  cites its outside sources. About page: the Perio diagrams sentence. No notes, questions or audio changed.
- **2026-11-10 ("Which statement" questions, Claude Code)** — Sam: "add which statement questions" and "also do the inverse".
  Two new formats with their own Question Bank filter entries: **Which statement is true** (`which`, one true of four) and
  **Which statement is false** (`whichf`, one false of four), built by `which()` / `whichf()` in Heme & Endo Exam 2 and Occlusion.
  42 new items written from the hubs' notes (30 in Heme & Endo Exam 2, 12 in Occlusion), so each of Heme & Endo Exam 2's eight
  lectures (not the Exam 1 Refresher) and Occlusion L6-L8 has at least two of each; nine older items tagged `which`. New standing rule `vault/rules/which-statement-questions.md`;
  `tools/ci/smoke.js` checks the shape and needs one of each per lecture taught from now on (`WHICH_MIN`, with exempt hubs and
  grandfathered lectures). About page: the Question types entry. Same PR as the lessons refresh (#297).
- **2026-11-10 (Lessons refresh, Claude Code)** — `/lessons-audit`, data read 5:50 am Central. PCD Implants Exam 1 is archived: its
  retrospective is in `LESSONS.md` (88 people, 339 h, median 199 min each; the notes carried the first two days; the lecture lag closed
  by itself on the eve; 5 check-ins) and its recap was published to the dashboard. Four explanations fixed in live hubs: Heme & Endo
  Exam 2 `p2-cah-17` and `p1-corticotroph` now name the class's favorite wrong answer (21-hydroxylase; ACTH low with cortisol high);
  perio `q4-44` gives its number (4 µm, not 0.4 mm) and `q4-M02` lists the three goals of SRP. Same ids and choice order, so the
  class picks stay put. `LESSONS.md` Live signals rewritten and the standing lessons updated; the data-quality note adds
  early-ended mocks and cleared class counters; PCD Implants and Special Patient Care move to Archived in `vault/home.md`.
- **2026-11-10 (Heme & Endo Exam 2: every Exam 1 High Likelihood question, fuller gaps, focus slides from the decks,
  Claude Code)** — Sam: "include all of the exam 1 high likelihood questions. do not cut them. pull randomly from them for
  the mock. do not include them in the default question bank filter unless you click to include them"; "fill in the gaps
  a little more"; "38-39 for l14 is the layers of the endometrium during menstruation". (1) The Refresher holds all 206
  Exam 1 High Likelihood questions again (207 with `r-pa-2s-2`); the mock draws its five Exam 1 questions at random from
  them (`mockLikelyPick`). (2) The Question Bank's default lectures are the 8 Exam 2 ones (`bankDefaultIds`): R joins only
  when ticked, with Exam 1 High likelihood on (which unticks it again when turned off) or on a search jump that matches it.
  (3) A key-term gap pass: 68 more cut questions back (the rule of 10s and Dr. Taylor's metformin example among them) and 2
  new (`mh-sertoli-fridge`, `fh-tf-atresia`): the Exam 2 lectures hold 421, 300 High Likelihood. (4) L13 and L14 topics
  re-ranked from the decks' real slide order, with a new L14 topic for the uterine wall (33-34); the focus hints say what
  each slide range covers.
- **2026-11-10 (Perio: Session 9 taught, from Dr. Abou-Arraj's recording, Claude Code, #298)** — Sam: "Update perio hub".
  Dr. Abou-Arraj's recorded first part of S9 (posted Nov 9) and his 2026 slides were in Drive, so S9 (Periodontal
  Plastic Therapy & Esthetics) went from `upcoming` straight to `taught`. Notes rewritten at both levels (40 aligned
  paragraphs; the gingival excess, altered passive eruption, esthetics and tattoo sections are labeled "(slides; the
  live session)" until the live class is posted) and both mp3s regenerated; 59 new questions (`q9-L01`-`L36`, `E`, `M`,
  five two-statement, ten true/false, four numbered) plus four drawn Patient Box items on two new cases (`no-kg-24`,
  `recession-11`); 12 Exam Hints and 12 ranked `LIKELY_TOPICS`; Review, cram, mind map and arcade words redone; ten
  names in `tools/podcast/lexicon.json`. The teal and amber session chips are a shade darker in light mode, for AA
  contrast (BUG-050, caught by `a11y.js`). Still to come: the live class's part, and the diagram candidates for Sam
  ([task](vault/tasks/done/2026-11-03-perio-s9-plastic-esthetics.md)). S6 still waits on its recording.
- **2026-11-10 (Heme & Endo Exam 2: coverage over count, Dr. Herr's FSH and his focus slides, Claude Code)** — Sam: "be
  sure the emphasized points are covered, deemphasized points are left out ... be sure that the high likelihood questions
  are sufficient. I dont know what you took out from them. Go with dr herrs version", then Dr. Herr's in-class focus
  slides for L13 and L14. (1) Midcycle FSH peaks with LH just before ovulation, as on Dr. Herr's L14 graph, everywhere:
  L14 and L16 notes (both levels), cram, note tables, the ovulation sequence, the `cycle` figure (`cycle.mjs`) and
  `fh-tf-fshpeak`; L16's slide is noted as differing; `fhisto-full`, `fphys-full` and `fphys-plain` regenerated.
  (2) A `focus` Exam Hint kind ("focus list", no quotation marks) at the top of L13 and L14, and the topics on those
  slides rank first ("focus list + recording"). (3) Every lecture audited for coverage: 90 cut questions back (ids
  un-retired), 2 new (`dm-met-lactic`, `mh-spermio-phases`), five topic lines reworded; 339 → 431 (L11 53, L12a 44, L12b
  45, A 43, L13 44, L14 45, L15 42, L16 35, R 80), 369 High Likelihood. Hub note: "Coverage, not a count".
- **2026-11-08 (Heme & Endo Exam 2: a high-yield bank, and a standing rule on what professors skip, Claude Code)** — Sam:
  "That should be a standing rule. Also 803 is way too many questions. They need to be higher yield". (1) New standing
  rule for every hub, `vault/rules/dont-ask-what-professors-skip.md`: no question tests what a professor said you don't
  need; check every recording, review and focus list; retire what tests it (Sam's standing OK). (2) The bank is cut from
  803 to 339: L11 70 → 48, L12a 66 → 38, L12b 70 → 42, A 84 → 32, L13 79 → 32, L14 78 → 32, L15 79 → 32, L16 58 → 28 and
  the Exam 1 Refresher 219 → 55 (one per Exam 1 predicted topic), about 6 per expected exam question (the median student
  answered about 300 before Exam 1). Kept: what a professor stressed, the predicted topics and each lecture's core, one
  question per fact. Cut: near-duplicates in other formats, minor details and slide numbers, long ordering, matching and
  select-all items, stained-section identification, and points a professor played down (alpha-glucosidase inhibitors,
  pramlintide, the SGLT2 inhibitors' rare trial findings, the pheochromocytoma rule of 10s, empty sella, spermiation).
  464 ids retired in `tools/question-ids/heme-endo-exam2.txt`; no question was reworded. `LIKELY_TOPICS` keep every
  topic, each with its 1-3 best questions (156 of 284 lecture questions High Likelihood, all 55 of R's). Format minimums
  and key balance hold (two-statement keys 26/23/26/26%, true/false 49% True, numbered positions 10/6/8/7, longest choice
  10%). Notes and narration unchanged. Hub note, task note, decisions and `LESSONS.md` updated.
- **2026-11-08 (Heme & Endo Exam 2: no questions on what a professor said you don't need, Claude Code)** — Sam: "2 should
  come out along with any questions that professors say we dont need to know". `mh-2s-6` (the erectile blood-supply
  figure Dr. Herr said you don't need) is removed and retired in `tools/question-ids/heme-endo-exam2.txt`. Every recording
  (L11, L12a, L12b, A, L13-L15) was searched for what a professor said you don't need, and the Refresher was checked
  against Exam 1's de-emphasis hints; no other question tests such a point. L13 has 79 questions, the hub 803.

- **2026-11-08 (Heme & Endo Exam 2: Lecture A and L13-L15 taught from their recordings, Claude Code)** — Sam: "update the
  heme and endo exam 2 hub with the transcripts i just added to the drive folder" (the four 11/6 recordings), then "merge
  when ready". Dr. Taylor's A, Dr. Herr's L13 and L14 (his re-recording, posted that afternoon) and Dr. Madison's L15 go
  from slides-only to taught: notes at both levels checked against what was said (what each professor stressed added,
  what he said you don't need marked, slips and contradictions kept as taught and listed in the hub note's content
  flags), 57 new questions (A 62 to 84, L13 68 to 80, L14 70 to 78, L15 64 to 79; same ids for every edited question;
  `src` relabeled `rec` where the point was said aloud), 58 Exam Hints quoted from the recordings, High Likelihood
  re-ranked from what each flagged (Dr. Herr: the labeled Sertoli cell drawing "is actually on your exam"), cram and
  tables, and both mp3s for all four lectures. Dr. Madison's in-class correction (aromatase mostly in the Sertoli cells)
  now drives the notes, `mp-2s-2` and the `hpg` figure (`tools/figures/heme-endo-exam2/hpg.mjs`: its hover text and the
  estradiol mark moved to the tubule). The pronunciation lexicon reads "Class II/III" as two and three. Open: the `cycle`
  figure's FSH at midcycle (L14 says it peaks with LH; L16's slide says inhibin holds it down), L16 on 11/10, L17, L18.

- **2026-11-06 (redesign phase 4 part C: Timmy's place, the art, Claude Code)** — Nothing students see changes. Timmy's
  house card redrawn as a little isometric world you build, on the design page only (`tools/preview/design/`, "Timmy's
  place"), then redrawn again from Sam's feedback: no plot square (each scene's ground fills the picture and the homes sit
  in it), eight homes (new: a beach hut, a lighthouse, an igloo, an observatory), six scenes (new: above the clouds),
  twelve yard things in five spots, seven theme outfits in six themes, the rank as a handpiece statue by the door and
  mastery as pennants in the bunting, animated art per rarity (card frames, a placing burst), Timmy hopping on the ground
  round things instead of floating, and small eggs on what you tap. Play and Customize on the design page. One kit,
  `tools/figures/site/place.mjs`, built into `tools/preview/design/place.js` by `build.mjs` (`--check` covers it; 648
  drawings and 1872 walks checked). `migration_v54.sql` (still unapplied) follows Sam's calls: five yard spots, the
  bowling lane `wide`, the art's names and ids in the catalog (68 rows); `tools/release/xp.js` 247 checks.
  `widget/pet.js` is unchanged until Sam approves the art
  ([task](vault/tasks/done/2026-11-06-redesign-timmys-place.md)).
- **2026-11-06 (redesign phase 5, part 3: the game layer's server, written and tested, not applied, Claude Code)** — Nothing
  changes for students and nothing reaches the live database: `migration_v54.sql` waits in `supabase/pending-migrations.txt`
  for the redesign's release ([vault/reference/game-server.md](vault/reference/game-server.md)). It adds, beside today's
  functions: server-graded answers (`question_keys`, `record_answer_v2`), XP with no daily cap as award rows with
  guardrails and every new source (the day's 20th answer, a fixed miss, mocks, mastery medals with 24 hours of double XP,
  Timmy Time minutes, the arcade, fixed reports), the 63-step ladder (Handpiece, ModuPro, Loupes), Shiny Gold Crowns and
  Timmy's shop (`buy_item`, `equip_item`, the rotation, snack HP), and the idea board. No XP back pay. Tests:
  `tools/release/xp.js` (new, 243 checks: a replayed call, a double tap, a linked device, the rebuild against the live
  calls), `rls.js` (now also calls every function a visitor can run and fails if another visitor's id comes back),
  `admin-ops.js` and `retention.js`, all with the pending migration applied; CI runs `xp.js` too. `tools/xp/keys.js` builds a
  hub's keys from its content JSON. Found **BUG-049, live since v53**: today's bootstrap sent Timmy's days as bare dates,
  so his HP counted only the device's own log. Its fix, the migration's section 0, **was applied live on its own** (Sam's OK,
  about 20:25 UTC) and appended to `supabase/schema.sql`; checked on five active visitors, `rls-audit.sql` clean, site
  changelog posted. The rest of v54 is not applied.
- **2026-11-06 (redesign phase 1: the hub engine and the new Occlusion, beside the live one, Claude Code)** — Nothing
  students see changes. `widget/hub.js` + `widget/hub.css` are the one engine every redesigned hub will use (Home, Notes,
  Questions, More; the bar at the top on a laptop and at the bottom on a phone, with a Settings button; Timmy stays
  bottom-left; drill, misses, weak spots and the mock as sets of the bank; the question card with its rewards, the daily
  goal ring and streak, the session recap, Check yourself under each lecture's notes). `hubs/occlusion/next/` is the new
  Occlusion: a page of settings (`window.SH_HUB`), its art (`widget/hub-art/occlusion.js`) and content JSON written from
  the live hub by `tools/hub-next/build.mjs` (CI's "generated files are current" step runs its `--check`). Outside a
  preview the page sends visitors to the live hub. Same hub id, state key, answered event and question ids, so progress
  carries over at the release. First load 371 KB over the wire before the bank's data (the live hub: 1317 KB with it).
  Shared-widget changes are gated to the new versions: `window.shPet.say`/`hp`, `sh:rank-profile`, `SH_TOUR.steps`/`prompt`,
  `shDrill.set`, and in `v3.js` Timmy's script loads only once he's adopted and the tour's only when it's started, for
  pages with `SH_HUB`. `tools/ci/smoke.js` clicks through every `hubs/*/next/` page; `tools/release/perf.js` measures it.
  The new bank follows #273's rule (High likelihood is an Only toggle on top of any Show chip; a hub adds its own in
  `SH_HUB.bank.only`). Sam's calls: the streak counts any study day (the goal ring is today's target), the session recap
  shows only on leaving the questions, Cusp Sort leads the arcade, "Why each choice" opens on your pick. Sam's second look,
  all built: Focus mode in Settings (every extra off, then back to what you had), every arcade game in the lobby with its
  own drawn art (`tools/figures/site/arcade.mjs`), the answered card in one row (no "Notes for <lecture>"), no "Your last
  two weeks", Today and Timmy Time decorated (`spots.mjs`), four soft colors, previous / next lecture and "Report a mistake
  in these notes", More as colored tiles, and a live "studying now" count in the bar and on Home (`v3.js` sends
  `sh:online` with its presence count; nothing else changes on the live hubs). Sam's third look: Today's goal is a ring of
  20 teeth, Timmy Time is an animated card among Home's quick starts (on the first screen), and Home's spacing is fixed
  (BUG-047: the reset now uses `:where()`). Rule, About page and build-a-hub changes are drafted in `vault/tasks/done/2026-11-06-redesign-release.md`. Timmy's secret-tip line now readable in light mode (BUG-048). Approved by Sam ("Looks good. Merge when ready") and merged;
  the bugs found and fixed are BUG-040 to 048 in `vault/release/bug-log.md` (#281 took 037 to 039 while this was open).

- **2026-11-06 (Pages didn't publish #285 and #281, Claude Code)** — Both publishes ("pages build and deployment")
  ended in "Deployment failed, try again later" after a few minutes queued, and a re-run of #281's failed the same way,
  so the live site stayed on #282 (`postcheck.js`: the four files #281 changed differed from `main`). This notes-only PR
  is the new commit that publishes both. [shared-infrastructure](vault/reference/shared-infrastructure.md) now says so.

- **2026-11-06 (PCD Implants check-in: how the class felt about the week's changes, Claude Code)** — Sam: "for the
  implants check in, develop some questions to see how the class feels about changes in this hub like the improved patient
  boxes". The PCD Implants Exam 1 check-in (button and pop-up from 8 pm tonight) now has eight steps: after readiness, how it
  went and hub vs exam, it asks whether the **new drawn Patient Box cases** were better than the Patient Box questions
  students had before (Sam: "i want to know if they are better than the previous pt box questions"; 1 worse, 3 about the
  same, 5 better; `pbox_better`) and how
  helpful the **diagrams and the seven implant-type drawings** were (1-5, `diagrams`, the id Occlusion's midterm used); each has an
  "I didn't get to them" / "I didn't use them" button, saved as `"none"` and kept out of the average (half the people who
  answered anything never reached a case). Then **which study tools helped** (tick any, `helped`: how the class answered each
  choice, Why each choice, Practice questions by least practiced, High likelihood, Pinned, Timmy Time, None of these) and **how
  the changes up to exam day felt** (`changes`: keep improving / hardly noticed / rather it held still). The text box stays
  last. `index.html`'s `openDebrief` learned a scale's `none` button, a third label under its middle (`ends:[low, middle,
  high]`) and a `multi` (tick any) kind, with an `only` option that
  clears the others; the admin page's Check-ins view tallies 1-5 ratings with "didn't use it" apart, choices and tick-any lists.
  Found in testing and fixed: a comment with apostrophes inside `HUBS` broke `widget/archive.js`'s reading of the list (BUG-037,
  never shipped; `literalAt()` now skips comments), and the Quick survey could open on top of a check-in started from a card in
  the first 4 seconds (BUG-038; it now waits for the next visit). No schema change: `submit_exam_debrief` already takes any
  answers. About page, event taxonomy, lessons-audit skill, hub note.

- **2026-11-06 (Release tests trimmed, Claude Code)** — Sam asked whether the 18-minute Release tests were necessary, then
  chose "Trim it". `.github/workflows/release.yml`: a few-second `scope` job runs the suites only when a PR changes shared
  code or has the `full-tests` label (a tier 2 or 3 change inside hubs gets it); on a PR they skip syntax, vault, archive,
  secrets, smoke, preview safety, database permissions, admin operations and retention, which Check hubs already ran on
  the same commit, leaving the admin page in a preview, accessibility, performance and the device matrix. By hand it
  runs every suite. What the suites had caught: about 20 bugs, all S3/S4, most when the baselines were set on Nov 4; both
  S2s automated tests found came from `rls.js` in Check hubs. Documented in `RELEASE_TEST_PLAN.md` section 6,
  `verify-before-pushing` and `preview-and-release-test`.
- **2026-11-06 (previews on request, Claude Code)** — Sam: "can i make the preview site an option that you ask to do
  instead of something you do by default. for the majority of cases i dont need it". `vault/rules/preview-and-release-test.md`
  (now "Release-test every substantial change; preview it on request"), `RELEASE_TEST_PLAN.md` (tiers, the flow, sections
  3, 7, 10, 13), `preview-a-change`, `ship-a-change`, `AGENTS.md`, the UAT checklist, the test-report and PR templates:
  an agent asks once for a tier 2 or 3 change and makes a preview only with a yes. **CI**: the preview build, the
  `preview-site` artifact and the Cloudflare link moved out of "Release tests" into `.github/workflows/preview.yml`, which
  runs only for a PR with the `preview` label (and each push after) or by hand (it finds the branch's PR for the `pr-<n>`
  link and comment). Release tests still run every suite. Without a preview, screenshots come from a stubbed browser;
  never the plain page as a test account (it would save to the class's data). Nothing students see changed.
- **2026-11-06 (faster sessions and CI, Claude Code)** — Sam asked why every task takes longer, then "do these".
  **Feature rules load on demand**: `arcade-skins`, `podcast-intro`, `podcast-reactions`, `diagram-review`, `diagrams-anima`,
  `figures-teach-the-lecture`, `outside-sources-for-figures` and `every-hub-gets-its-own-art` carry `load: on-demand`;
  `CLAUDE.md` lists them under "Feature rules" (when to read each) instead of importing them, `tools/figures/CLAUDE.md`
  and `tools/podcast/CLAUDE.md` import them so Claude Code loads them when it opens those folders, and the `/podcast` and
  `anima` skills name them. `tools/ci/vault.js` enforces it (an on-demand rule must be linked there, not imported).
  **Smoke test checks only the hubs a PR touches** (`tools/ci/smoke.js`, `pickHubs()`): every hub when a shared file
  changes (`widget/`, the dashboard, `sw.js`, assets, a workflow, the test), on `main`, with `--all`/`SMOKE_ALL=1`, or when
  git can't tell; Check hubs fetches the PR's base (`fetch-depth: 2`) and both workflows set `SMOKE_CHANGED_FROM=HEAD^1`
  on pull requests. A one-hub change: 32 s locally instead of a full run. **Kokoro installs itself on first use**: `tools/narrate.py` and
  `render_podcast.py` run the new `tools/kokoro-setup.sh` (via `tools/podcast/kokoro_ready.py`) when kokoro-onnx or the
  model is missing; tested from a clean machine. No setup script on the cloud environment (one was tried and taken off:
  most sessions never narrate and it made each one wait about 70 s). Nothing students see changed.
- **2026-11-06 (admin page: light only, Claude Code)** — Sam: "i dont want the admin page to be dark mode. its hard to
  see". `review/index.html` drops its two `prefers-color-scheme: dark` blocks (the page's colors and the switch knob) and sets
  `color-scheme: light` plus `<meta name="color-scheme" content="only light">`, so a laptop or phone in dark mode still gets
  the light page, form controls and scrollbars included (and Chrome's auto-dark leaves it alone). `tools/release/admin-ui.js`
  now fails if the page turns dark on a dark-mode phone. Admin only: students see no change. No schema change.

- **2026-11-06 (question health: PCD Implants on exam day, Claude Code)** — Sam: "review implants question health, fix the
  issues, mark them in the admin page, and merge". The 10 questions flagged since #267 were checked against the notes; every
  key matches; same ids; no notes text changed, so no narration or podcast change. **New wording**: `ev-tmi-bone` (its key
  said "distal to the plate"; the notes say the bone *behind* the plate grew thicker) and `bm-goodacre` (the stem names
  Goodacre's review instead of "the slide", and the porcelain choice's why says the veneer that fractured often was resin).
  **New explanations and why lines**: `im-crest` (the crest as the early warning sign; the stability dip isn't on a film),
  `su-esth-span` (the table's span row: a wide single space is low risk), `su-bar` (her table by the space available),
  `su-mm-1` (each risk factor's group: malpositioning is surgical-related) and `su-match` (a matching card shows only its
  explanation after answering, so it now lists the four pairs). These seven start fresh numbers. **Looks fine**:
  `bm-moment`, `im-pa-follow`, `tm-2s-6`. All ten marked on the admin page (`admin_review_question`; the seven as Fixed
  once the new versions were live). Then three more flagged while #277 shipped ("stronger students miss it more"; keys
  match): `ev-2s-5` (statement 2 uses the notes' white, yellow, red instead of "grippier colors"), and new explanations and
  why lines for `in-num-3` (the JE does attach to titanium; the hemidesmosomes are the false part) and `su-voxel` (more
  dose with smaller voxels; "choose the smallest voxel" is about detail). Marked Fixed once live. Then two more:
  `in-1stage` (the most-picked wrong choice, "Brånemark (1985); it avoids a cover screw", was half true, since one-stage
  surgery skips the cover screw; it now reads "avoids a healing abutment", with an explanation that sets the two
  techniques side by side) and `cb-hu-ref` (the explanation now gives the values, air -1000 and water 0, instead of
  "know both definitions").

- **2026-11-06 (Question Bank: High likelihood on top of any Show chip, Claude Code)** — Sam: "when im filtering questions in the
  bank, i want to be able to filter by both high likelihood and not answered yet or missed last time or pinned". In Occlusion,
  Perio, Special Patient Care, PCD Implants and Heme & Endo Exam 2, High likelihood leaves the Show chips (now All, Not answered
  yet, Missed last time, Pinned) and becomes a tick-box toggle on its own **Only** line under Show (`STATE.ui.qlikely`,
  `BANK_LIKELY`; Perio `QBANK_FILTER.likely`), which works on top of whichever Show chip is on. Its count follows the Show chip,
  the chips' counts follow it, and the line under the panel gets a "High likelihood" tag. A saved Show "High likelihood" from
  before becomes the toggle (`bankNormShow()`, Perio `qbankNorm()`); Exam Hints' "Practice these" turns it on, Home's buttons into
  the bank turn it off. Heme & Endo Exam 2's **Exam 1 High likelihood** is a second toggle (one on at a time; it still ticks R).
  The empty state says "You haven't missed any High likelihood questions in these lectures" and the like. Tracked as before
  (`bank:show=likely`), plus `bank:show=likely-off` / `likely1-off` and `bank:tag-off=lk`. About page, both rules. No schema change.

- **2026-11-06 (Occlusion L8 checked against the slides, and the Home timeline contrast in every hub, Claude Code)** —
  Sam: "Ive added the slides and lecture study guide. Fix the timeline contrast in the other hubs too." **Occlusion L8**
  (`dentures`), checked against `Occ Lec7 RDP Occlusion` (slides and handout, Drive Occlusion/Final): Hanau's term is
  the **Realeff** (was "resilient-like effect"), the formula **Thielemann's** (L8 only; the Review lecture and podcast keep
  "Thielmann"), semi-anatomic teeth **12-22°**, anatomic **30-33°**, the porcelain history fixed; added the slides'
  retention factors, what resists tipping, support, the neutrocentric concept, lingualized's definition and advantages,
  Hanau's first-molar contacts and remounts, Thielemann's fixed and variable factors, materials, the posterior selection
  criteria, the tooth forms' names and pros and cons, the four-scheme comparison table and the Abduo 2013 review. Both
  note levels and both mp3s; 17 new questions (`handout` source), every why; LIKELY_TOPICS re-ranked (hint, then slides;
  the history slides say "No test questions", so a de-emphasize hint, and on Sam's word the seven history questions
  retired and the history rows out of L8's Review; the notes keep the history, as narrated); Review, cram sheet and Figs
  22-23 updated. `tools/narrate.py` reads rating marks (+++, ++, +, −) aloud; the podcast lexicon gained Thielemann,
  Duchâteau, Gysi, Trubyte, Fauchard, Boucher, Abduo and bizygomatic. **Home timeline (BUG-031):** Heme & Endo 1 and 2,
  PCD Implants, Special Patient Care and Occlusion dim past and far-off course-timeline rows with the soft ink color
  instead of opacity, so their text keeps 4.5:1 contrast as rows turn past each day.
  [Task](vault/tasks/done/2026-11-05-occlusion-l8-follow-ups.md).

- **2026-11-06 ("Why each choice" starts folded, every live hub, Claude Code)** — Sam: "after you answer a question,
  have the 'why each choice' be collapsed by default. it takes up a lot of screen space". `whyHTML` no longer opens its
  `<details class="qx-why">`, so after answering a student sees the explanation and one "Why each choice" bar, and taps it
  for the list (with their pick marked, as before). On a phone the folded bar is 43 px tall, against 430-590 px open. The
  bar is now the whole tap target (padding moved from the box to the `summary`). In Occlusion, Perio, Special Patient Care,
  Heme & Endo Exams 1 and 2 and PCD Implants: Question Bank, Daily Drill, Weak Spots and mock review. Opening it is
  counted by `widget/clicks.js` as the "Why each choice" click (no new tracking). About page entry rewritten.

- **2026-11-06 (question health: the newly flagged PCD Implants questions, Claude Code)** — Sam had the agent mark the 33
  questions reviewed in #258 on the admin page (12 Fixed, 21 Looks fine, through `admin_review_question` with the admin page's
  versions and flags; recorded in `vault/decisions.md`), then said yes to reviewing the PCD Implants questions flagged since
  (19 over the evening, the night before the exam). Every key matches the notes; same ids; no notes text changed, so no
  narration or podcast change. **New wording**: `in-3weeks` ("after the healing abutment is placed" also fits a one-stage
  case, where the bone needs months, so "3 months" was defensible: the stem now asks how long the soft tissue needs),
  `tm-mm-3` (it asked which "make" the crown need 7 mm, but the subgingival margin subtracts 1: it now asks which go into the
  7 mm) and `tm-early-place` ("after an extraction": most misses picked immediate loading, which counts from placement).
  **New explanations and why lines**: `im-tf-3` (metal does scatter the beam, but the starburst comes from sampling
  limits), `im-flapless` (CT shows the sinus but doesn't make bone; the old why was "Not his point"), `im-software` (DICOM is
  the file format the software reads), `cb-num-3` (beam hardening vs motion fixes), `su-def-bran` (the surgery lecture's two
  definitions; many textbooks credit the "structural and functional" wording to Brånemark, the slides to Albrektsson and
  Sennerby, and the question follows the slides). These eight start fresh numbers (PCD's versions include the explanation).
  **Why lines only** (numbers kept): `bm-moment`, `su-edent`. **Looks fine**: `in-collagen`, `im-num-2`, `im-medct`,
  `tm-2s-1`, `cb-num-2`. **Removed on purpose** (Sam's 11-03 call on reports #35/#36): `tm-code-6010`, `tm-code-6058`,
  `tm-conelog`, `tm-rc-grooves` show as "gone"; `tm-conelog`, `tm-rc-grooves` and `gs-credit` are now retired in
  `tools/question-ids/pcd-implants-exam1.txt`. Sam asked the agent to mark them all on the admin page after the merge.
- **2026-11-06 (Heme & Endo Exam 2: every Exam 1 High Likelihood question, in the mock and the bank, Claude Code)** — Sam:
  "have the 5 exam 1 questions come from the high likelihood question bank". The mock's five Exam 1 questions now come only
  from the Exam 1 Refresher's High Likelihood questions: one per topic, each from a different Exam 1 lecture, questions not seen or missed last time first
  (`MOCK_LIKELY_ONLY`, `mockLikelyPick` in `hubs/heme-endo-exam2/index.html`). The Refresher's "Exam 1's hardest questions
  for the class" entry came out of `LIKELY_TOPICS`: it was class data, not a predicted topic, so those 10 questions stay
  in the Refresher without the High Likelihood tag. The mock's intro, the exam facts and the About page say so.
  Then "also have the exam 1 high likelihood questions available in the exam 2 question bank filter": the Question Bank's
  Show row gains **Exam 1 High likelihood** (`likely1` in `BANK_SHOW`), only the Refresher's High Likelihood questions;
  tapping it ticks R if it isn't ticked, and with R unticked the empty list says so. Tracked as `bank:show=likely1`.
  Then "yes all exam 1 high likelihood questions": the Refresher held 68 of them (Exam 1's top two topics per lecture);
  the other 138 came in, so it has **all 206, over all 55 of Exam 1's predicted topics** (219 questions in R, 747 in the
  hub), copied unchanged except id `r-<id>`, lecture R and "(Exam 1 · L#)" after the explanation, and its `LIKELY_TOPICS`
  are Exam 1's. The Refresher's notes say so at both levels, so both narration mp3s were regenerated.
  Then "do not count the exam 1 questions in the overall count. they are just available for review": R is review only.
  The header's progress, Home's readiness ring and "you haven't tried", Where to next and the bank's "of N" count the
  528 Exam 2 questions (the bank adds "+ n Exam 1 review"), and the mastery medal leaves R out too: a hub may now export
  `SH_EXPORT.uncounted()` and `widget/ranks.js` takes those questions off both sides of the medal. R's answers still
  earn XP and streaks.

- **2026-11-06 (redesign phase 5, part 1: one request per page load and a cached XP total, Codex and Claude Code, #266)** — Codex's draft (#261) rebased onto `main` by Claude Code with its conflicts resolved, and finished. A hub now reads everything it needs on load in one `get_widget_bootstrap` call (besides realtime presence and the changelog): 12 reads become 1 on a hub and 19 become 1 on the dashboard (fixture preview). The class-wide rank board, leaderboards and trophy rarity load when Stats opens or the dashboard panel scrolls into view. **Each visitor's own rank and hub mastery ride in the bootstrap** (Sam, 2026-11-06) and refresh every 10 answers, so the badge by the name, the rank-up, level-up, trophy and mastery cards and the medals work as before (Codex's draft loaded them only with Stats, which 17 of 108 people in a hub opened in 14 days). `migration_v53.sql`: the `xp_visitors` cache, kept by the existing answer trigger, so ranks stop summing the whole class (BUG-032, the cache dropping each day's first answer, fixed before it was applied); the advisor fixes (six `search_path`s, a `link_attempts` primary key, two unused indexes); `get_pet_days` no longer polled; clicks and question health share one flush timer; a class percentage is fetched when its question is answered or its class line comes into view, not for every card on the page (BUG-034: in Codex's draft, Perio's "Show answer" cards stayed on "Loading class data…"). Every part falls back to its old call while the migration isn't applied, so merge order doesn't matter. Also: Timmy on the dashboard at the largest text no longer sits past the screen's edge (BUG-033), `perf.js` no longer counts the preview's own runtime against a page's budget, `sw.js` `sh-v58`. **Live 2026-11-06** with Sam's OK ("Go ahead", then "apply it"): merged as 04c4b3a, and `postcheck.js` passed (11 of 11 changed files live, the dashboard and 4 hubs with no errors). `migration_v53.sql` was applied at about 01:55 UTC while students were answering. Afterward the cache matched the per-day XP for all 158 visitors, and its answer total matched the answer table. `get_rank_profile` takes about 2 ms (it was about 0.9 s), the bootstrap about 115 ms on a hub and 170 ms on the dashboard for the most active visitor, and `get_trophy_stats` 5 ms. The live permissions audit (`rls-audit.sql`) is clean, and the advisors' `search_path`, primary-key and unused-index warnings are gone. Site changelog posted. Still open in phase 5: the two widget bundles, one stylesheet, one font, the thinner client and sw.js precaching ([task](vault/tasks/done/2026-11-05-redesign-phase-5-backend.md)).
- **2026-11-06 (outside sources for every figure, and Perio S8 Fig 3, Claude Code)** — Sam's new standing rule
  ([outside-sources-for-figures](vault/rules/outside-sources-for-figures.md)): outside sources are encouraged on every
  figure, for accuracy and for how it works, and cited in the figure; what it names and tests still follows the lecture.
  The same message ("Build all proposed figures") approved the one figure proposed but never put to Sam: **Perio S8 · Fig 3
  The host response, and host modulation** (`tools/figures/perio/hostmod.mjs`, under the S8 notes and in Review):
  Dr. Litz's flowchart as a cycle, with No bacteria, SRP, NSAIDs, bisphosphonates and Periostat. The L8 figures now cite
  theirs: Fig 20's maxilla resorbs less, so the mandible loses about twice its height (Tallgren 1972 and 1980; Cawood &
  Howell 1988 for the basal bone staying put), and Figs 21-23 cite the Glossary of Prosthodontic Terms and the usual mold
  angles. About page: the Perio diagrams sentence. No schema change, no text or audio change.

- **2026-11-05 (Occlusion L8: four drawn figures, Claude Code)** — Sam approved all four L8 diagram candidates ("Build" to
  each). Built with the anima kit from the L8 notes and placed after the paragraph each explains, at both note levels, and
  in L8's Review: **Fig 20 How the ridges resorb** (`resorb`: a side view at the midline and a section through the first
  molars; a slider from natural teeth to long edentulous, Play, and "Set denture teeth" near the ridges: posterior
  crossbite, pseudo-Class III), **Fig 21 Support, stability and retention** (`ssr`: the force each resists on a pair of
  complete dentures, the dentures moving with it, and what resists it), **Fig 22 Balanced, non-balanced, lingualized**
  (`schemes`: five setups, closed / right working / protrusion, contact lamps per side and the front teeth, and "contact on
  one side only" tipping the lower denture off its ridge) and **Fig 23 Posterior tooth forms** (`toothforms`: anatomic,
  semi-anatomic, flat and lingualized pairs; "Slide sideways" draws the contact force square to the surfaces in contact).
  `tools/figures/occlusion/anima/l8den.mjs` is the frontal section Figs 21 and 22 share (and the tooth profiles Fig 20 and
  23 use). Occlusion's performance budget 1320 -> 1350 KB (the figures add about 21 KB over the wire), approved
  by Sam on 2026-11-06 (BUG-030). About page: the Diagrams entry. No schema change, no text or audio change.

- **2026-11-06 (redesign phase 0: the design system preview page, Claude Code)** — Nothing students see changes yet. The
  redesign's design system is a preview page, `tools/preview/design/` (`node tools/preview/serve.js`, then
  `/tools/preview/design/`; `PREVIEW_PAGES` in `tools/preview/transform.js` lets the preview server and build include it).
  It shows the tokens, both candidate typefaces, 49 hand-drawn icons, an emblem and a masthead scene for each live hub and
  a placeholder pair for a future one, the mastery medals (24) and trophies (26), Timmy and his house as drawn today
  (rendered by `widget/pet.js` and `widget/ranks.js`), and the question card in all nine formats waiting and answered, with
  the new rewards (the XP spark, Timmy's cheer and flinch, the streak flame, the daily-goal ring, the session recap), in
  light and dark, on made-up data. Every drawing is SVG in Timmy's ink in `tools/figures/site/`; `build.mjs` writes
  `tools/preview/design/art.js` (`--check` fails if it's stale; Timmy's holiday outfit is pinned so the build repeats).
  **Sam's picks (2026-11-06):** Nunito Sans for the whole site (Fraunces has no tabular figures); the icons, emblems,
  masthead scenes, trophies and rewards art approved; the five live hubs keep the shared medal design; and a new rule,
  [every-hub-gets-its-own-art](vault/rules/every-hub-gets-its-own-art.md): every new hub gets its own emblem, scene and
  unique medals. The taste inspector (`--app`) shows 0 FAIL at 1440, 768 and 390 in Nunito light, Fraunces and dark.
  Next: phase 1, Occlusion on a preview
  ([task](vault/tasks/done/2026-11-05-redesign-phase-0-design-system.md)).
- **2026-11-05 (question health: every flagged question reviewed, Claude Code)** — Sam: "review and fix all questions flagged
  for question health". `qh_report` listed 33 to review on the live hubs (PCD Implants 14, Perio 10, Occlusion 9; none on
  Special Patient Care or Heme & Endo Exam 2). Each was read against its hub's notes: **every key matches the notes**, and
  no question was removed. Same ids throughout; no notes text changed, so no narration or podcast change.
  **PCD Implants** (exam tomorrow): `in-bh` stem ("the three implant systems the school's clinic uses"), `bm-25lb`,
  `bm-occ-two` and `im-process` explanations now say why the popular wrong answer is wrong (the lever's 25 + 50 = 75 lb;
  pull-through is the single-implant check in MI; the radiographic guide is worn during the scan); why lines only for
  `ev-blade`, `ev-hader`, `ev-frialit` (versions kept). The subperiosteal drawing `ty-sub` (`ev-pic-sub`) had its lattice
  12 px below the crest, so it read as in the bone (half the recent tries picked "Blade"): it now rides the crest
  (`tools/figures/pcd-implants-exam1/types.mjs`, rebuilt). **Perio**: `q3-04` and `q3-08` had a second defensible answer
  because the exam-review guide and the class notes word the prognosis systems differently (the notes call McGuire &
  Nunn "tooth retention" and say it can be given for the whole dentition): `q3-04`'s distractor is now Miller & McEntire's
  own ("A numeric score of how likely a molar is to be retained", same slot), `q3-08` asks about prognosis systems and says
  McGuire & Nunn is also given tooth by tooth, and `q3-S03` (not flagged, same problem) has a statement 1 that is false by
  both sources; `q4-06`'s key reads "S204SD9 sickle scaler" (only the wrong H6/7 said "scaler"); `q4-15`'s explanation no
  longer says "don't read the class off the millimeters". Every changed choice keeps its slot's meaning, so no
  `question_choices` rows need clearing. **Looks fine, no change** (for Sam to mark on the admin page): PCD `bm-sizes`,
  `bm-occ-goals`, `tm-2s-6`, `tm-mm-1`, `ev-misch` (keys confirmed; small recent groups), `tm-mm-2` (fixed in #252);
  Perio `q3-M01` and `q2-P01` (their low numbers are the 7-option versions cut to 5 on 10-01), `q1-P05`, `q4-M05`,
  `q4-02`, `q4-L34` (kept as taught); Occlusion all nine (midterm lectures, all-time data, explanations already name the
  favorite wrong choice since the 10-20 and 10-27 audits). `LESSONS.md`: four question-writing lessons. Hub notes updated.
  **Live**: merged on Sam's "Merge" at 23:52 UTC, live about two minutes later; `postcheck.js --from 46eafd8 --to d145a46`
  passed (both files live and identical to `main`, no errors on the dashboard or either hub); site changelog lines logged for
  both hubs (ids 288, 289). Marking each question Looks fine / Fixed on the admin page is Sam's.
- **2026-11-05 (perio S8: host modulation from the Nov 5 class, and the dosing chart, Claude Code)** — Sam: "update the perio
  hub with the files I added": `litz nov5.txt` in Drive, Periodontology/hubs, Dr. Litz's Nov 5 class (a short antibiotics recap,
  then all of host modulation). `hubs/perio`, S8 only: the host modulation section rewritten at both levels from the class (what
  it means; bacteria the key, the host response the engine, not autoimmune, the vicious cycle; pellicle, complement, neutrophils
  24-48 h then macrophages, IL-1; "step lightly"; NSAIDs; bisphosphonates and why BRONJ is so hard to treat; Periostat as a fifth
  of the antibiotic dose; Caton 2000 as statistically, not clearly clinically, significant) and a new **dosing chart** section
  from the slides' last table, which he said to know for the exam (where it differs from the drug slides, both are given; its
  meal column was left out because the PDF text couldn't place it). The recap's emphases added. Both
  `audio/antibiotics-host-mod-*.mp3` regenerated. The lecture's `note`/`source` updated. 10 exam hints from the class; S8
  `LIKELY_TOPICS` re-ranked to 13. **21 new questions** (`q8-L49..L59`, `q8-M03`, `q8-T09..T12`, `q8-S06..S08`, `q8-N05`,
  `q8-N06`), each choice with its why; bank 665 -> 686 (statement keys still spread: two-statement 25/14/36/25%, true/false 50%
  True). Review: host modulation rows and a dosing-chart table (`abx-doses`); cram, mind map, arcade word COMPLEMENT.
  `tools/narrate.py` reads perio's template-literal readings and says mg/po/qd/bid/tid/qid/q6h/IL-1 properly; lexicon:
  Epocrates, osteonecrosis. Task: `vault/tasks/done/2026-11-03-perio-s8-host-modulation-class.md`. No schema change.

- **2026-11-05 (Occlusion L8: Denture Occlusion, Claude Code)** — Sam: "Update the occlusion hub with the files i added": `occ nov 5.txt` in Drive Occlusion/Hubs/Final, the 11/5 lecture capture (no slides or handout there yet; the transcript is not in the repo). New lecture `dentures` (L8, `exam:'final'`, tag `sage`, taught): notes at both levels and both mp3s (`audio/dentures-full.mp3`, `-plain.mp3`): why denture occlusion is about keeping the prosthesis in (one upper tooth, one lower tooth; balance = resisting tipping), the history (Fauchard, Washington and Greenwood, Bonwill the father of articulation, Gysi), how a denture stays in (suction, fit, muscle control above all), what makes it harder (anatomy, all removable is movable, the resilient-like effect, resorption up and in / down and out, crossbite, pseudo-Class III, the tongue, interarch space), support / stability / retention, CR and centric occlusion (not MIP), the balanced, non-balanced and lingualized schemes, Hanau's quint, denture tooth materials, choosing a mold, tooth forms and the evidence. 92 questions (`dn-*`, `cs-dn-*` on 3 new Patient Box cases `dnflat`/`dnbal`/`dnret`; 8 two-statement (keys 2/2/2/2), 11 true/false (5 True), 6 numbered, 3 EXCEPT, 2 select-all, 1 matching; each with its why; correct answer longest in 25% of L8's MCQs), 18 exam hints quoted from the capture (one de-emphasized: setting the teeth is the January denture course), 14 `LIKELY_TOPICS`, a Review tab, two Side by side rows, cram lines and 2 sort sets. `MOCK_BLUEPRINT` = `{ instruments:15, malocclusion:15, dentures:15 }` (45 questions at 80 s each, a placeholder until the final's format is announced), and the mock's tab and clock are fixed: since L7 the tab said "(20)" and the clock turned red at 27 minutes for 40 questions (BUG-028; now "Mock Exam (45)" and 60 minutes). `EXAM_INFO`, `COURSE_DATES`, the hints banner, the mock intro and the dashboard card updated. A lecture can now carry its own status `badge` (L8's says "Recording", not "Recording + slides"), and the light-mode sage tag is darker for contrast (BUG-029). `tools/podcast/lexicon.json` gains "ala-to-ala". Bank 671 -> 763. Diagram review: four candidates went to Sam, none built ([task](vault/tasks/done/2026-11-05-occlusion-l8-follow-ups.md), with the slides check; [PR #259](https://github.com/smcmurry6-source/study-hubs/pull/259)). No schema change.
- **2026-11-05 (arcade crossword clues no longer give each other away; arcade sentences start where they should, Claude Code, BUG-026, BUG-027)** — Sam: "fix the clue issues too" (the two noticed in BUG-024's retest). Both fixes are in `widget/games.js`, so every hub's crossword and Mind the Gap get them; no hub file changed. **Clashing clues:** each hub's `termPool` cuts note clues from sentences, so two clues could be one sentence with different words blanked ("The adrenal ___ … the medulla" beside "The adrenal cortex … the ___"), and a question stem could name another answer: 47% of test puzzles had such a pair. `build()` now skips a word when its clue shows an answer already in the puzzle or a placed clue shows its answer (`cluesClash`: the word or its plural, whole word, any case), and draws 24 candidate words per try instead of 16 to keep puzzles full: 0 of 2,680 test builds clash, 8.2-8.4 words on average. Lectures with only 9-12 crossword words (PCD Implants L1 Evolution and L2 Introduction, Special Patient Care L1 Introduction, Heme & Endo's diabetes pharmacology) now often give 6-7 words instead of 8, since several of their words come from one sentence. **Sentences:** `sentencesOf()` cut at any period not followed by a space and threw away what came before, so "U.S.", "et al.", decimals ("3.08 mm") and a period inside parentheses produced fragments such as ") The not-necessarily-conscious decision to swallow…" and ", 1969: an intimate bone-to-implant contact…". It now ends a sentence at . ! or ? (with a closing bracket or quote) before a space, unless the period ends an abbreviation (`ABBR`) or the next word is a plain lower-case word (so "rhPDGF-BB" or "kVp" can still open a sentence); Mind the Gap has 2,689 items over the five live hubs, up from 2,600. Noticed, not changed: `termPool` blanks the answer inside longer words too ("Intra___l insert" for MUCOSA), in each hub's own copy.
- **2026-11-05 (Special Patient Care archives when the exam opens, no check-in, Claude Code)** — Sam: archive the hub when the
  exam opens and skip check-ins for this hub only; take the card off when it's archived. `index.html` `HUBS`: `archiveOn` and
  `hideCardOn` both `{date:"2026-11-06", hour:0}` (so it goes straight from live to no card), the exam's `checkinFrom`
  replaced by `checkinClosed:true`. The hub's `SH_EXPORT.exams` / `archiveOn` now use `EXAM_DATE` hour 0 so its own
  "archived" notice agrees; Home's done message no longer mentions a check-in. About page's check-in entry updated.
- **2026-11-05 (PCD Implants: Practice questions goes to the lectures practiced least; `tm-mm-2` is 3 of 5, Claude Code)** — The two optional items left open by #245 (Sam: "fix both of the optional suggestions"). `hubs/pcd-implants-exam1`: Home's quick-start **Practice questions** button, the part of Home people tap, now does what the untapped "Practiced least" row does: while some lectures have under half their questions tried, it names them ("Practiced least: L1, L2, L5, L6 · 129 to try", by lecture number) and opens the Question Bank on them with "Not answered yet"; otherwise it opens every unanswered question as before. Both use the new `lecsBehind(rows)`. Clicks log as `qs=practice-least` / `qs=practice`. The subtitle wraps only on that button (`.qs-wrap`, the count kept whole by `.qs-nw`), since the laptop's four-across row cut it off. **`tm-mm-2`** (platform switching, 7% on a first try with 4 of 5 options right): "Increases soft tissue volume" (right) became "Decreases soft tissue volume" (wrong), so it is 3 of 5; explanation and every why updated, same id, no notes text changed (no narration). Its class picks and accuracy went stale (option 4 changed meaning). **Live:** #252 merged at 19:35 UTC (rebased twice onto #251 and #250, CI green each time), live at 19:39; then (Sam: "yes, run the SQL") `tm-mm-2`'s 5 `question_choices` rows (68 ticks) and its `question_stats` row (34 attempts) were deleted, `postcheck.js --from c8a49d1 --to f5aaf51` passed, and the changelog line was logged. About page, hub note, `vault/decisions.md` and `LESSONS.md` updated.
- **2026-11-05 (Occlusion final moves to Mon Nov 16, 6:30-7:45 pm, Claude Code)** — Sam: the final moves up from Thu Nov 19,
  same time window as the midterm. `hubs/occlusion`: `FINAL_DATE` `2026-11-16`, `FINAL_TIME` / `FINAL_CLOSES` `'18:30'` / `'19:45'`
  (Home now counts down days, hours and minutes, then "on now" until 7:45, then done), `EXAM_INFO`, the Home hero, exam card, hints
  banner, timeline, header title and header pill ("Final tonight", "Exams done" after 7:45). Dashboard `HUBS`: the final's date,
  `checkinHour:20, promptHour:20` (check-in after the window closes, not from 8 am before an evening exam) and the card text. No
  notes text changed, so no narration. Still waiting on the format: [task](vault/tasks/2026-11-03-occlusion-final-time-and-format.md).
- **2026-11-05 (arcade crossword can be started again, Claude Code, BUG-024)** — Sam: "the arcade crossword is broken." Opening
  the crossword (Cross-Section; Crossing Over, Cross-Slice and the other skins) showed an empty 30 px strip on every hub, laptop
  and phone: before a puzzle starts the stage holds only the intro overlay, which is absolutely placed, so the stage had no
  height and the intro and its "New puzzle" button were clipped. The clicks show students opening it, trying Full screen and
  leaving; `arcade_scores` had no crossword score in 30 days. `widget/games.css`: `.cx-stage{min-height:380px}` (a started
  puzzle is taller than that, so its layout is unchanged). Checked in the preview on all five live hubs: every arcade game's
  start button takes a real tap, and every crossword types through to "Solved!". No `sw.js` bump (styles are network-first).
  Noticed, not changed: two clues can come from the same note sentence with different blanks, so each gives the other's
  answer away, and a clue can start with a stray ")".

- **2026-11-05 (the 11-04 lessons refresh is live, Claude Code)** — #245 merged at 15:03 UTC, but its GitHub Pages deploy timed out ("Deploy to GitHub Pages" failed after 10 minutes), so #248 (vault only: Sam's calls in `vault/decisions.md`) gave `main` the new commit that publishes; the hubs were live at 15:30. At 15:31 `tools/data-fixes/2026-11-04-statement-keys.sql` ran (Sam's OK) with a guard that rolled everything back unless each reordered item's new key held exactly its correct count: it passed, nothing was left mid-move, and the rewritten items start fresh. `postcheck.js` passed (both hubs identical to main, 0 errors), a changelog line for each hub, and suggestion #14 got Sam's reply. BUG-022 retested; BUG-023 done for these items (version-aware picks still in the inbox).
- **2026-11-04 evening (lessons audit: statement keys no longer a pattern, Claude Code)** — Suggestion #14 (PCD Implants, two days
  out): "a lot of the statement questions seem to all have the same answer... select all being options 1,2,4 a lot." True:
  `hubs/pcd-implants-exam1` keyed 36 of 46 two-statement items "Statement 1 is true; statement 2 is false", had statement 1 true in
  all 30 numbered items and keyed the second choice in 23; `hubs/special-patient-care` had statement 1 true in all 24 numbered items.
  Same ids. **Two-statement:** 7 PCD items swap their two statements, 8 have the false statement made true and 10 the true one made
  false by one taught detail (facts from each item's explanation and the hub's notes), now 12 / 11 / 11 / 12 over the four choices;
  SPC 4 swaps and 2 made "both false" (12 / 6 / 10 / 12). **Numbered:** statements reordered so the false one sits at every number
  and the key at every position (PCD 7 / 8 / 8 / 7, SPC 6 / 6 / 6 / 6), the key's size shared by another choice, and in PCD three
  items keyed "all four" and two "two true" (`ev-num-1`, `pf-num-1`, `cb-num-1`; `su-num-4`, `bm-num-1`). Every why line is rebuilt by
  `two()` / `nums()`. The class's picks on each choice (`question_choices`, by position) would show beside the wrong choices: 
  `tools/data-fixes/2026-11-04-statement-keys.sql`, tested on a throwaway Postgres, that moves the picks of 43 reordered items with their choices and clears the 25
  rewritten ones (`question_stats` too), to run at merge with Sam's OK; question health starts the new versions by itself. Also `im-template-vdo`'s explanation and whys now say why "room for the drill and the guide
  sleeves" (6 of 15) is wrong. **CI:** `tools/ci/smoke.js` fails a hub whose statement keys form a pattern (a two-statement choice
  keyed in over 40% or under 10% of items, a numbered key position over 45%, a statement number true in over 90%); rule notes
  [two-statement-and-true-false](vault/rules/two-statement-and-true-false.md) and [numbered-statements](vault/rules/numbered-statements.md)
  say so. `LESSONS.md` refreshed (Live signals; lessons on the key's position and on steering through what people tap). No reading
  text, audio or schema change.
- **2026-11-05 (new hub: Heme & Endo Exam 2, `hubs/heme-endo-exam2/`, Claude Code)** — Sam: "build a hub for heme and endo
  exam 2. yes to all animations. no need to verify before release. merge when ready", then "use extra effort" and "also vet
  all questions for accuracy and effectiveness" (the waived preview gate and the merge are in [decisions](vault/decisions.md)).
  DENT 2160 Exam 2, Fri 11/13, 10:00-11:30 am, 50 questions (45 on L11-L18 and Lecture A, 5 on Exam 1). Built on the PCD
  Implants Exam 1 engine (Home, the labeled Question Bank panel, pins, High Likelihood, the mock), palette "Luteal". **609
  questions in 9 lectures:** L11 diabetes pharmacology and L12a/L12b endocrine pathology written from their recordings;
  Dr. Taylor's Lecture A and L13-L16 reproductive histology and physiology from slides and speaker notes (`status:'slides'`
  until their recordings); R, an Exam 1 Refresher of 81 questions copied from `heme-endo-exam1` (`r-<id>`). Every new lecture
  has two-statement, true/false and numbered items, a why for every choice, High Likelihood topics, notes at both levels and
  both narration levels (new `tools/narrate.py`: a hub's READINGS to Kokoro mp3s, [narrate-with-kokoro](vault/how-to/narrate-with-kokoro.md)).
  **Vetting:** a second reviewer checked each of the 528 new questions against its slides and recording; 131 were rewritten
  (wrong or doubtful keys, give-aways, duplicates, a distractor that was also true), and numbered-statement keys were spread
  out. Where a lecture contradicts a textbook or itself the hub keeps what was taught; the list is in the hub note
  ([heme-endo-exam2](vault/hubs/heme-endo-exam2.md)). **Nine animated figures** (`tools/figures/heme-endo-exam2/`, placed
  by its `place.json` under a notes heading and in Review): diabetes drug sites, insulin curves, primary vs secondary labs
  (L12a and L12b), CAH on the steroid pathway, the seminiferous tubule, the duct system, follicle stages, the 28-day cycle
  (L14 and L16) and the male HPG axis. The Cycle Arcade (`HEE2_SKIN`), the dashboard card and arcade, its medal
  (`widget/ranks.js`), the admin and recap lists, `sw.js` sh-v57, the About page (Home, Arcade, Diagrams). Light-mode tag
  colors darkened for contrast; its accessibility baseline (0 issues) and performance budget are new. For every hub, the
  shared Stats launcher's spoken name now starts with the count it shows (`widget/v3.js`, BUG-003 in part), and the admin
  page test names Heme & Endo Exam 1's card in full now that two Heme & Endo cards exist. Not yet in it: L17
  and L18 (no slides on 11/5) and the recordings of A and L13-L16:
  [the task](vault/tasks/2026-11-05-heme-endo-exam2-l17-l18-and-recordings.md).

- **2026-11-05 (analytics retention in force: `migration_v52.sql`, Claude Code)** — Sam approved the retention schedule ("Yes to the data retention suggestions", 2026-11-04); [vault/reference/analytics-retention.md](vault/reference/analytics-retention.md) says what is kept and for how long. **Applied live on 2026-11-05** after Sam's "go ahead" (numbered v50, then v51, while #236 and #240 took those numbers). It drops the unused `activity_pings_visit_idx` (27 MB); lets a retention delete or a device link skip the rollup rebuild (`sh.keep_rollups`), so `activity_hourly` / `activity_visits` keep hours whose raw pings are gone; `redeem_link_code` moves the rollups itself; `get_hub_recap` reads `activity_hourly` (the pre-09-25 idle cap went with the raw pings: only Hepatobiliary's already-published recap had it); new `feature_daily` and `retention_runs`; `sh_retention_run(p_apply)` (counts only by default) and `sh_retention_status()`, closed to visitors; `get_data_quality` returns the status; and a weekly pg_cron job `sh-retention-weekly` (Sundays 09:23 UTC). **First run:** 89,387 raw pings older than 2026-10-06, 81 "No thanks" rows of closed surveys, 14 link attempts, 3 test rows; every hub's hourly totals and every archived hub's recap identical before and after; database about 221 → 200 MB; live `rls-audit.sql` clean. Repo: `tools/retro.sql`, `tools/lessons-daily.sql` and the lessons-audit skill read `activity_hourly`; `tools/analytics-quality.sql` gains the retention checks; the admin page's Insights → Data quality has a **Retention** row (flagged when the job misses a week) and its storage growth comes from the runs' sizes; the About page's "What the hubs record" says how long each kind of data is kept; `tools/release/retention.js` tests it in CI ("Check hubs") and `run.js`. Left: the school-year collapse of the hourly rollup and Sam's call on the question-health rows (inbox). Task: [vault/tasks/done/2026-11-04-analytics-retention.md](vault/tasks/done/2026-11-04-analytics-retention.md).
- **2026-11-05 (Settings rows and Timmy's bubble fit a phone at the largest text: BUG-013, Claude Code)** — the follow-up to the top-bar PR (#235). **Settings sheet** (dashboard `index.html` `.set-x .set-seg`, hubs `widget/v3.css` `.shset-x .shset-seg`): a row of buttons beside its label was `flex:none`, so Timmy Tooth's Everywhere / Dashboard only / Off ran past the sheet at XX-Large on a phone; rows now shrink to their line and wrap (unchanged at normal text). **Timmy's speech bubble** (`widget/pet.js`, the dashboard perch): `place()` flipped it to his left whenever the right had under 200 px without checking the left, so at 320 px with the largest text it started 95 px off screen. It now measures both sides (rects against the page's own rect, turned into CSS px by the perch's offsetWidth), takes the roomier one, caps its width to that room (`--pet-room`), and goes above him, kept on screen, when neither side has 120 px. Its `100vw` caps use `--pet-vw` (the screen in zoomed px, set when he talks), the house bubble is capped to its scene (260% of his spot). **CI:** `tools/ci/smoke.js` opens the Settings sheet on the dashboard and every hub at 390 px with the largest text and fails a button past the sheet's edge (fails on `main`, passes here). The other two follow-ups from #235 (Perio's arcade 6 px, the Review table's keyboard stop) were already fixed by PR 239. `sw.js` sh-v56.
- **2026-11-05 (no post-release monitoring, Claude Code)** — Sam: "take out all of the monitoring instructions now and
  for the future". The 1, 24 and 48 hour checks after a release are gone from `RELEASE_TEST_PLAN.md` (section 11 is now
  "Release and post-release verification"), the [preview-and-release-test](vault/rules/preview-and-release-test.md) rule,
  [ship-a-change](vault/how-to/ship-a-change.md), the PR template, the test-report template and the repo map;
  `tools/release/monitor.sql` is deleted, and the open "Monitored" boxes came off the current reports. The pending
  1-hour check for the admin page release was cancelled before it ran. `postcheck.js`, the changelogs and rollback stay.

- **2026-11-04 (Question health for every hub, Claude Code)** — Sam: "Build a question-health system for all hubs. Create
  stable question IDs, track accuracy, retries, time/abandonment, explanation engagement, and feedback; flag likely-quality
  problems for admin review without automatically deleting or changing educational content." How it works and every
  threshold: [vault/reference/question-health.md](vault/reference/question-health.md). In short:
  - **Stable ids**: `tools/question-ids/<hub>.txt` registers every id each hub has shipped (written from the live banks,
    plus ids with class data that are no longer in a hub, marked retired); `tools/ci/smoke.js` fails a renamed or deleted
    id and a retired id that comes back, and a local run adds new ids. New rule:
    [question-ids-are-permanent](vault/rules/question-ids-are-permanent.md). Versions: a fingerprint of what SH_EXPORT
    shows of a question, so an edited question starts fresh numbers.
  - **Tracking**, `widget/qhealth.js` (loaded by v3.js, no hub code): per answer, which try it was for that person, the
    previous result and gap, the choice, active time before answering and on the explanation after, and taps in the
    explanation; a card read 3 s or more and left unanswered is a view (abandonment). Batched to `record_qh`
    (`migration_v51.sql`, applied 2026-11-04: `question_versions`, `question_events`, `question_feedback`,
    `question_reviews`). `sw.js` → `sh-v55`.
  - **"Good question?"**: a thumbs up/down under every explanation, with a reason on a thumbs down (`qh_vote`); on the
    About page.
  - **Flags for review**: `qh_report(hub)` (SQL connector) and the admin page's new **Question health** tab (`review/`):
    below chance, very hard, possible miskey, stronger students missing it more, missed again, open reports, thumbs
    reasons, disliked, slow, often left unanswered, explanation skipped, ids not in the hub. Sam marks each Looks fine /
    Needs a fix / Fixed with a note (`admin_review_question`, metadata only); a new flag or a new version brings it back.
    New rule: [question-health-flags-are-leads](vault/rules/question-health-flags-are-leads.md): **nothing changes,
    hides or deletes a question automatically.** The lessons refresh now reads the list (`tools/lessons-refresh.md`).
  - Timing, abandonment, the explanation and thumbs count from today; accuracy, miskey, retries and top-vs-bottom fall
    back to every answer ever (`personal_answers`, `question_choices`) until a version has 10 first tries. First run on
    the live data: 10 Perio questions to review (one possible miskey, q4-06).
- **2026-11-04 (admin page redesign; who's studying now, hub archive overrides, newest-first check-ins, Claude Code)** — Sam's
  asks: safer admin operations, then "a full optimization of the admin page. Its clunky and not user friendly". **The page**
  (`review/`) is rebuilt with the taste-skill's app-screen run: a sidebar of views (Overview, Live, Inbox; Insights, Time by
  section, Questions, Clicks and features, Searches, Engagement; Exam check-ins, Surveys; Hubs on the dashboard, Recap),
  each with its own address, title, a one-line finding and only the controls that apply; data loads per view instead of
  18 queries at once; Overview says what is waiting on Sam; check-ins and searches have their own views; on a phone the
  sidebar is a Menu sheet. #237's Insights tab moved in as a view, unchanged in what it computes. **Live view**: how many
  people used a hub in the last 3 minutes and, hub by hub, their leaderboard names (Sam's call), never an id, email or
  section; it asks every 30 s only while open and visible. **Hubs view:** set any hub Live, Archived or Hidden on the
  dashboard by hand, until set back to Automatic or until an optional end time (Sam's call), with a confirmation, a note,
  an audit log and a stale-tab check; nothing is deleted. The rules live once in `widget/archive.js` (loaded by
  `index.html` and `review/`; `widget/v3.js`'s archived notice follows them). **Exam check-ins:** groups sort by their
  newest check-in (they sorted by hub name, BUG-019), rows and survey answers newest first with an id tie-break.
  `migration_v50.sql` (numbered v49 until #237 took that number; tier 3, **applied 2026-11-05** after Sam's written
  approval, "Merge when ready"; the live permission audit found nothing after it): `hub_archive_overrides`, `hub_archive_log`, `get_hub_overrides`, `admin_hub_overrides`,
  `admin_set_hub_archive`, `admin_hub_archive_log`, `admin_live_presence`, and `get_exam_debriefs` / `get_survey_results`
  in order; `supabase/schema.sql` now also records the `activity_hourly` version of `get_exam_debriefs` applied on 10-30
  (PR #205, never merged). `sw.js` sh-v54. No About page entry (Sam: admin information stays off it). Preview fixtures
  for every admin view. Tests: `tools/release/admin-ops.js` and `tools/ci/archive.js` (in CI), `tools/release/admin-ui.js`
  (`run.js`, as `adminui`). How it works: [vault/reference/admin-operations.md](vault/reference/admin-operations.md).

- **2026-11-05 (small-screen fixes from the first full release test, Claude Code)** — The first full "Release tests"
  run on GitHub (WebKit and Firefox for the first time) found pages that scroll sideways. Most were the top bars, which
  the measured top bar (PR 235, its entry below) fixes for every hub and the dashboard. The rest, fixed here: **Perio's arcade** no
  longer wiggles 6 px sideways on phones (its full-bleed margin follows the page's 14 px padding at 520 px and below), and
  **Perio Review's** tables that scroll sideways take keyboard focus and are named for screen readers ("Antibiotics
  (table)"). The device matrix (`tools/release/matrix.js`) now measures against the layout width, because a phone browser
  zooms out to fit a page that's too wide, which hid the overflow from Chromium's phone emulation; it also names the
  element that sticks out. Bug log BUG-015 to BUG-018.
- **2026-11-05 (The drawn Patient Box case system for every hub; anatomy and realism, Claude Code)** — Sam: "I also want
  this system to be called for patient box questions in other hubs", "All teeth need to be anatomically correct. All
  variables need to be realistic", "Merge when ready". The case kit moved out of the Perio hub into **`widget/cases.js` +
  `widget/cases.css`** (`window.shCases`; a hub loads both and calls `shCases.pboxFigures(q, PCASES)` from its
  `pboxHTML`, `shCases.refHTML(q)` for the "In the notes" buttons). **Every tooth type is redrawn from Wheeler's anatomy**:
  crown shapes with the right cusps (two buccal cusps on upper molars, three on the lower first molar, two on the second),
  contact heights and incisal angles, the canine's long root, the upper first premolar's two roots, the upper molars'
  palatal root behind the buccal pair, the lower molars' broad mesial and narrower distal roots curving distally, root
  trunks above the furcations, the cervical line dipping at mid-facial. **`shCases.validate()`** rejects unrealistic or
  inconsistent numbers (ranges for probing depths, recession, CAL, bone loss, mobility, furcations, implants, age,
  cigarettes, HbA1c; the pocket base and the bone crest must agree unless a vertical defect is declared; a furcation
  needs a molar and bone loss to the trunk; a Class III is through and through), and **`node tools/ci/cases.js`** (new
  CI step) runs it on every hub's `PCASES` and checks each case's `expect` against `derive()`. **PCD Implants** (exam Nov
  6): its four L8 Patient Box items now draw their cases (mucositis, peri-implantitis under a cement-retained crown with
  the cement fleck on the film, a new patient with no baseline, an early failure under a cover screw with the radiolucent
  line) with "In the notes" buttons. **Occlusion** has the hook and an empty `PCASES`. How-to:
  `vault/how-to/draw-a-patient-box-case.md`. Sam approved the release in chat.
- **2026-11-04 (Perio: Patient Box cases drawn from their numbers, Claude Code)** — Sam: upgrade the Perio Patient Box into a
  visual diagnostic-case engine (the midterm check-ins asked for "cases with pictures, charts and radiographs" and more
  staging/grading cases). A **shared kit**, `tools/figures/shared/dental-cases.js` + `.css` (the Occlusion case-picture
  tooth model generalized; pasted into the hub between the `pcase` markers by `tools/figures/perio/build.mjs`), draws a
  **periodontal chart** (an SVG strip per surface like a probing chart, blue margin line, red pocket line, bleeding dots,
  furcation triangles, mobility, implants, missing teeth, with the numbers as a table), a **periapical radiograph**
  (per-side bone levels as % of root length, angular defects, furcation radiolucency, calculus, crowns, root fillings,
  amalgams, implants against a baseline) and a **drawn buccal view** (recession, swollen or fibrotic gingiva, bleeding,
  suppuration, plaque, calculus), all from one case model, and `derive()` works the 2018 stage, grade and extent,
  recession types and peri-implant states out of the same numbers; `tools/figures/perio/cases-check.mjs` fails the build
  when a case's `expect` disagrees. **Six cases, 16 questions** (`PCASES`, `pc-*`: staging and grading, gingivitis vs
  periodontitis with D4346, RT1-3, a Class II furcation with the stage trigger and the smoking modifier, a deep narrow
  defect for regeneration, peri-implantitis and Meffert), each with a why per choice, memory cue, and **"In the notes"**
  buttons (`q.ref`, through `SH_GOTO`; tracked `case:ref`). A question's `pfig` hides the row that would give its answer
  away (CAL, furcation). `LIKELY_TOPICS` updated (two new topics); About page. No notes text, narration or schema change.
  Tier 2: a draft PR for Sam's look; the expansion waits for approval ([task](vault/tasks/done/2026-11-04-perio-visual-case-engine.md)).
- **2026-11-04 (top bars fit their content: no more clipped Arcade tab, Claude Code)** — Sam: the dashboard top bar is cramped and
  the Arcade tab gets cut off. **Root cause:** every hub picked its top-bar layout from a stack of screen-width breakpoints
  (380/520/560/760/860 in each hub, plus the 561-1000 px patch of 2026-10-28 in `widget/v3.css`), but whether the bar fits
  depends on what's in it: the hub's name, your name and rank, the countdown's wording, the streak and tour buttons, the font,
  and the text-size setting, which zooms `<html>` where media queries can't see it. When a guess was wrong, `#modeSwitch`
  (`min-width:0; overflow-x:auto` with a hidden scrollbar) shrank and **clipped Arcade** with nothing to show it was there (1001-1280
  px in six hubs), or the tabs ran past the edge (320 px, four hubs, the page scrolled sideways); under 760 px some tab labels were
  `display:none`, leaving tabs with no spoken name. **Fix (shared):** `widget/v3.js` measures the bar (ResizeObserver, a
  MutationObserver for names and pills filling in, font loading) and keeps the first layout that fits: `data-sh-head` = `row` (one
  line, every tab at full size), `stack` (title and pills on top, full-width tabs below) or `stack3` (phones and large text: title
  and the round buttons on top, your name and the pills next, then the tabs; your name shortens with an ellipsis before the
  countdown wraps); `data-sh-tabs` = `inline`, `tall` (icon over label) or `grid` (two columns). `widget/v3.css` draws them, scoped
  to `header.hub-header[data-sh-head]` so they outrank each hub's own breakpoints; labels always show, the hub's name shows on
  phones (with an ellipsis), touch screens get 40 px tabs and 32 px round buttons. It also keeps `--sh-head-h` current. **Dashboard**
  (`index.html`): the top bar's buttons are one group (`.tb-actions`) that wraps onto its own row when it doesn't fit beside the
  wordmark and live count; the Arcade high scores' hub and game rows wrap instead of scrolling past the edge (the game row is now a
  group of `aria-pressed` buttons, not a tablist without arrow keys). **Perio:** the arcade leaderboard tabs wrap. CI:
  `tools/ci/smoke.js` checks the dashboard and every hub at 320 px, 1001 px and 390 px with the largest text: no sideways scroll,
  every top-bar control and tab fully on screen and not clipped, every mode tab labeled. About page: "A top bar that fits your
  screen"; Hub modes now says four modes. The largest text also showed Home's "Where to next" rows wider than a phone in
  five hubs (a shared guard in `widget/v3.css`: the column may shrink, the button drops below) and Perio's course-map titles
  (`overflow-wrap`). Bug log BUG-010-013; report `vault/release/reports/2026-11-04-responsive-top-bars.md`.
  `sw.js` -> `sh-v53`.

- **2026-11-04 (analytics governance and learner insights, Claude Code)** — Sam asked for an analytics governance and
  learner-insights layer over every live and archived hub. **Admin page**: a new **Insights** tab (`review/`) puts every hub
  side by side (scorecard, where time goes by canonical surface, spacing of retries, feature reach, student voice, data
  quality); each number past its threshold (`INSIGHT_RULES`) turns orange and the card lists the decision it drives. Hubs
  with fewer than 5 people are left out. The admin page now reads hub names, exam dates and live/archived status from
  `HUBS` / `ARCHIVED_HUBS` in `index.html` instead of its own lists. **Database**: `migration_v49.sql` (applied; read-only:
  `sh_surface`, `sh_insights`, `sh_insight_retries`, `sh_data_quality`, and admin wrappers `get_insights`,
  `get_insight_retries`, `get_data_quality`); `supabase/schema.sql` refreshed. **Vault**: [analytics-governance](vault/reference/analytics-governance.md)
  (start there), [event-taxonomy](vault/reference/event-taxonomy.md), [analytics-data-quality](vault/reference/analytics-data-quality.md),
  [analytics-retention](vault/reference/analytics-retention.md) (a proposed schedule, nothing deleted: the free plan's 500 MB
  is about 7 weeks away at the current rate; task `vault/tasks/2026-11-04-analytics-retention.md` waits on Sam),
  [insights-dashboard](vault/reference/insights-dashboard.md) (the cards, the first reading, proposals for Sam), and a new
  rule, [learner-data-privacy](vault/rules/learner-data-privacy.md). **About page**: "What the hubs record". Also
  `tools/analytics-quality.sql`, a format breakdown and stale-id list in `tools/lessons-join.py`, and three standing
  lessons in `LESSONS.md`. The preview answers the three admin calls with made-up numbers (`synthInsights()` in
  `tools/preview/runtime/preview.js`), and `tools/release/rls-audit.sql` checks the new internal functions stay closed
  to visitors (the live audit returned no findings after the migration).
- **2026-11-04 (a permanent preview and release-test process, Claude Code)** — Sam's ask, now a standing rule
  ([vault/rules/preview-and-release-test.md](vault/rules/preview-and-release-test.md)); the whole process is
  [`RELEASE_TEST_PLAN.md`](RELEASE_TEST_PLAN.md) (tiers, previews, data isolation, test accounts, gates, UAT, device matrix,
  bug log, Sam's approval, release, monitoring, rollback). **Previews:** `tools/preview/serve.js` (this checkout, on the fly)
  and `build.js` (a static copy; the "Release tests" workflow attaches it to every site-changing PR as `preview-site`). A
  preview runs on fixture data in the browser and can't reach the class's data: production Supabase URLs and keys are
  rewritten to `fixtures.preview.invalid`, a connect/img/media CSP leaves production out, and `runtime/preview.js` (loaded
  first, previews only) answers PostgREST-style from synthetic data, blocks and counts anything aimed at Supabase, and logs
  every write; pages are noindex (meta, X-Robots-Tag, `_headers`, robots.txt) and titled "Preview ·". Its Preview button
  has six synthetic test accounts (`fixtures/personas.json`: new, returning, high-XP, missed-question, archived-hub, admin
  with the secret `preview-admin`), time travel, a class-data switch (normal, slow, unreachable) and the write log.
  **CI ("Check hubs")** adds `tools/release/secrets.js` (keys, course material, data files), `tools/release/rls.js`
  (RLS, grants and secret-gated functions as anon on a throwaway PostgreSQL built from `supabase/schema.sql`, against
  `rls-expectations.json`) and `tools/ci/preview.js` (every page as every account, real write paths into fixtures, and
  production attempted five ways without one request leaving the browser). **"Release tests"** (new workflow) runs
  `tools/release/run.js`: those plus `a11y.js` (axe WCAG 2.2 AA, keyboard focus, reduced motion, against
  `baselines/a11y.json`), `perf.js` (slow-4G phone budgets, `budgets.json`) and `matrix.js` (7 device sizes in Chromium,
  WebKit and Firefox; refresh, history, offline, class data down, slow 3G). After a merge: `postcheck.js` (live files
  identical to `main`, live pages load, every Supabase request blocked) and `monitor.sql` (read-only counts). Also
  `rls-audit.sql` for the live database (run read-only today: no findings, 38 tables and 98 functions, matching the
  snapshot). **Fixed:** `supabase/schema.sql`'s migration_v31 section had `$` for `$$` and couldn't rebuild the database.
  Vault: rule, `vault/how-to/preview-a-change.md`, `roll-back-a-release.md`, `vault/release/` (UAT checklist, bug log with
  the known accessibility and slow-3G issues, the dry-run report), a report template and a PR template. Sam looks at a change
  and doesn't test it: every site-changing PR gets a Cloudflare Pages link in a PR comment (once the token is in GitHub;
  no Timmy Time episodes in that copy), plus screenshots; no staging database for now (Sam, 2026-11-04). No site change: nothing students see changed.

- **2026-11-04 (Occlusion: every figure vetted, audited and fixed, Claude Code, [PR #232](https://github.com/smcmurry6-source/study-hubs/pull/232))** —
  Sam: "vet, audit, and improve all occlusion figures." Every drawn figure in the hub (the kit drawings, contact map and cusp
  game, the 19 anima figures and the case pictures) was checked against the hub's notes and questions, at 390 px and in both
  themes, and fixed in its source in `tools/figures/occlusion/` (no new figures, no notes or audio changed).
  - **Kit and game (L1):** #30's anatomy (MB widest, D smallest), the inclines figure, the sagittal envelope's E, the contact
    map's straight contact lines and variable band, the cusp game's reveal. Class III #4 stays on #30's mesial fossa (the
    help sheet's picture). The pathway questions `fig-pmax-*`/`fig-pmand-*` no longer give the arrow's direction in the stem.
  - **L1 anima:** `crslide` (Fig 7) worked out at true scale on the shared skull rig (second-molar contact, a 1.25 mm slide,
    the condyle 0.39 mm off its seat); `envelope` (Fig 6) step text describes the border just traced, and the frontal letters
    follow Dr. Givan's handout (C = right lateral opening, D = right lateral superior; `fig-front-d` now asks about C, same
    border and answer); `interferences`, `guidance`, `cuspmotion` and `cuspheight` redrawn so inclines sit on their cusps,
    Class I positions are right and the cusp stays on the jaw.
  - **L2, L3, L5:** the TMJ (Fig 1) gets a real ramus and coronoid under the arch and a lateral pterygoid that runs below the
    eminence; muscles (Fig 4), swallowing (Fig 9, a full midline section) and the implant figure (Fig 10, the wrong "x500"
    readout fixed) corrected.
  - **L6:** `hingearc` (Fig 12) drawn on the rig with the magnified molar miss; `scirec` (Fig 13) shows real molars whose
    cusps grow with the setting; `bennett` (Fig 14) the lower left molar the right way round, with the non-working cusp
    leaving the central fossa distobuccally.
  - **L7:** `l7rig.mjs` now draws a whole skull and a real mandible with the disc's true profile (Figs 7, 12, 15-17 use it;
    cropped edges fade); labels moved off the teeth; thirds numbered from the central fossa; erosion stacks on a phone.
  - **Case pictures:** radiographs rebuilt on one tooth model in mm (PDL, lamina dura, osseointegrated implants), the TMJ film,
    the Div 2 and right buccal views, articulating-paper marks and wider perio charts.
  - **Labels and hover text name only what the lecture teaches** ([figures-teach-the-lecture](vault/rules/figures-teach-the-lecture.md)):
    "ear canal" for EAM; no orbit, mastoid, sigmoid notch or postglenoid process.
  - Open questions for Sam are in the PR and [vault/hubs/occlusion.md](vault/hubs/occlusion.md) → Pending.

- **2026-11-04 (PCD Implants: the seven implant types redrawn, the intramucosal insert added, Claude Code)** — Sam: "there
  are only 6 drawn and i feel like they could be better and more accurate." The L1 drawings (`FIGS` `ty-*`) were hand-pasted
  boxes: teeth as teardrops, a subperiosteal frame sunk into the bone, transosteal posts that missed the bar, a blade's bar
  floating in the air, and no intramucosal insert. They are now built from `tools/figures/pcd-implants-exam1/types.mjs` (by
  `build.mjs`, which also rewrites the `var FIGS` line; `--check` covers it), in the lecture's order A-G: subperiosteal,
  endodontic stabilizer, transosseous (Bosker's TMI: base plate, four posts, cortical screws, bar), intramucosal insert
  (buttons on a palateless upper denture), blade, ramus frame, root form. Each is drawn the way it turns up (a panoramic or
  periapical radiograph, or the denture's tissue side) with numbered parts and a key, plus a section through the jaw
  showing where it sits. Above a question the section is hidden (`.qcard-figure:not(.qcard-figure-after) .ty-sec`) until
  it's answered, so it can't give the answer away. Checked against Linkow (1970, 1977), Bosker's patent 4,516,937, the
  intramucosal insert patents and the ICOI glossary for accuracy, but under Sam's new rule
  ([figures-teach-the-lecture](vault/rules/figures-teach-the-lecture.md): outside sources for accuracy, the lecture for
  what's shown and named) the keys name only what L1 teaches (no strut types, cortical screws or blade depths). Same rule
  applied to `attach` (tooth vs implant): still drawn to Gargiulo's and Cochran's layers, but its labels now give only the
  lecture's 2.04 and 3.08 mm, not each layer's thickness. Two new picture questions, `ev-pic-mucosal` and `ev-pic-root`,
  added to the types' High Likelihood topic. About page updated. No notes text, narration or schema change.
- **2026-11-04 (Perio: all figures audited and fixed, Claude Code)** — Sam: "vet, audit, and improve all perio
  figures." Six anima figures (`tools/figures/perio/`, rebuilt into the hub) and the suture diagrams (`SUTURE_DIAGRAMS`):
  - **Peri-implant health, mucositis, peri-implantitis** (S7): redrawn from scratch to scale (15 px/mm) as a section
    through the ridge. Threaded implant, abutment and crown with emergence profiles; a buccal and lingual plate that
    remodels about 2 mm and then craters in peri-implantitis; mucosa that reddens and swells; a probe that bows around
    the crown and reads 4, 5.5 and 8 mm against the baseline; bleeding and pus; brackets for the remodeling line and
    the bone lost beyond it; a 5 mm scale bar.
  - **Ailing, failing, failed** (S7): redrawn as three radiographs with the neighbor teeth. Each film's crest is
    compared with a dashed line for the crest on the previous film. The failed implant wobbles, with a radiolucent band.
    A key says a film shows bone, not inflammation or mobility. On a phone it shows one film at a time.
  - **BOP over four visits** (S7): the axis says "losing 2 mm or more of attachment"; tooth sites, Lang 1986 (cited).
    Fixed the bars' grow animation (negative heights in the console).
  - **When to take implant radiographs** (S7): a brace shows the extra film can come at any maintenance visit. Phone
    layout as a vertical list.
  - **Biofilm** (S8): the barrier step works again after β-lactamase (the test never reached exactly 0).
  - **Antibiotic targets** (S8): mRNA drawn on the 30S, drug dots on the lit target, simplification note.
  - All: the title corner hides on phones so it no longer runs into the readout.
  - **Suture diagrams** (S2): one proximal tooth behind the interdental section, not two crowns; periosteal anchorage
    labeled apical and coronal, with the flap margin; the horizontal mattress strand now ends at a cut, not running off
    the picture; braided thread as herringbone. Figure-eight caption and q2-D03 explanation keep only what the notes
    say (flaps that won't meet closely, as with apically positioned flaps).
- **2026-11-04 (PCD Implants: all eleven figures checked against the notes and fixed, Claude Code)** — Sam: "vet, audit, and
  improve all implants figures." Each figure in `tools/figures/pcd-implants-exam1/` was rendered in every state, both themes and
  at 390 px, and read against its lecture's notes. **Content fixes:** `attach` (tooth vs implant) drew the tooth's junctional
  epithelium about 2.4 mm long, starting above the CEJ, and the implant's layers didn't add up to its 3.08 mm mark; now the
  sulcus, JE and connective tissue are to scale on both (tooth 0.69 / 0.97 / 1.07 mm, Gargiulo 1961; implant 0.16 / 1.88 /
  1.05 mm, Cochran 1997, the averages behind the lecture's 2.04 and 3.08), with enamel, dentin, pulp, PDL and lamina dura,
  and the implant's circular fibers shown cut across. `zones` drew the B zone convex (the notes: concave) and said the margin
  "creeps down (coronally)" while it moved up; it is now an upper incisor in section (coronal down), B zone concave, the facial
  E zone on the slider, the palatal side following the natural tooth, with the straight-E-zone margin marked. `retention`
  (screw or cement?) had the crown floating on the gum with nothing reaching the implant, and its facial tilt showed nothing;
  now a lower molar in section in occlusion: one-piece screw-retained crown on a titanium base with the abutment screw and
  access channel, the channel coming out through the buccal when the implant is tilted, and an angled abutment with a
  cemented crown when that forces cement. `position`'s section labeled "2 mm+" on a gap drawn at 6.6 mm (it claimed 16 px
  per mm); every distance is now measured at the crest and to scale (3 / 1 mm anterior, 1.5 / 1.5 mm posterior), the
  proximal values sit in a row with what the rule needs, the tooth-implant papilla is drawn, and touching a slider switches
  to the proximal view. **Drawing fixes:** `connection` (the external hex was hidden behind the abutment; every connection now
  shows the abutment screw), `stages` (white gaps around the final abutment, the crown sitting on the gum, floating sutures,
  and surgery 2 now closed around the healing abutment), `guided` (freehand drew a 28-degree tilt poking out of the bone;
  fully guided and dynamic now land 1.1 mm / 1.3 mm off, the L8 averages, freehand and pilot marked as illustrations; the
  pilot template comes off after the pilot drill; the screen no longer covers a tooth), `misch` (the marrow spaces formed a
  diagonal stripe; now both arches in occlusal view and a trabecular pattern whose marrow spaces grow from D1 to D4),
  `stability` (a kink in the total curve; the inset labels old bone, the resorbed gap and new bone), `cantilever` (the bridge
  is drawn unit by unit, a clipped label, the 0 lb wording), `cbct` (two clipped labels), and leader lines that crossed their
  own labels. `shared.mjs`: `amLive` calls `D[D.ONSET]` after a button or slider sets a key. Checked: `build.mjs --check`,
  every figure mounted in the hub's notes (light 1200 px, dark 390 px), anima's line check (0 of 0: these figures use no
  `.iso-line`), `syntax.js`, `vault.js`, `smoke.js`. About page (the Diagrams entry). No question, notes text, audio or
  schema change. Phone labels are still small (inbox).

- **2026-11-04 (Occlusion L6: the mounting-error figure redrawn and made accurate, Claude Code)** — Sam: "the articulator
  anima is not accurate." `mounterr` (L6 notes at "The facebow transfer" and Review) is rebuilt in
  `tools/figures/occlusion/anima/mounterr.mjs`. What was wrong: the casts didn't meet (a gap between the arches), only the
  maxillary cast moved (the mandibular cast is mounted to it with the CR record, so both carry the error), the condylar
  element hung outside its housing, there was no incisal guide table, the lit teeth were drawn to the rule rather than
  worked out, and "Move to the side" showed the same side view as protrusion. Now: a semi-adjustable arcon articulator to
  scale (condylar elements on the lower member, housings with a 35° condylar guidance on the upper, the incisal pin on the
  upper member lifting off a flat incisal guide table as the casts' own front teeth guide, mounting plates and stone),
  both casts in Class I occlusion moving together, a slider for the size of the error (1-15 mm) and a chart of how many
  microns more or less each lower posterior tooth drops on the articulator than in the mouth after 1 mm of protrusion.
  One closed-form model (`meModel`: condyle down 35°, lower incisal edge down the upper central's 50° lingual surface, 3 mm
  overbite, incisal edge 82 mm in front of and 43 mm below the axis) drives both panels. It reproduces the slide's rule
  for all four errors: too far back or too high puts the teeth closer to the axis, the back teeth separate less there
  (−19 / −13 µm at the second molar for 10 mm), so work built there leans on the anterior teeth; too far forward or too low,
  they separate more (+16 / +11 µm), cusps are built too tall and the most posterior teeth hit. An arbitrary facebow's 2-5 mm
  gives 2-9 µm, in line with the notes' "clinically insignificant". The direction reverses if the anterior guidance is
  flatter than the condylar guidance (said in the figure's sources). Laterotrusion is no longer drawn: a 3-D check of right
  laterotrusion matched the slide for back/forward errors but not cleanly for high/low on the non-working side, so the figure
  states the slide's rule for it instead of showing a side view that can't. Checked with anima's line check (both themes),
  at 390 px and in dark mode, in the hub's notes; caption and About page updated. No question, notes text or audio change.
- **2026-11-04 (site down: repo made private, Claude Code)** — The repo was made private for a while; on GitHub's free
  plan that unpublishes Pages, so the whole site returned "Site not found" from about 16:24 to the next publish. Making it
  public again didn't turn Pages back on: Sam re-enabled it in Settings → Pages (`main`, `/ (root)`). That publish timed
  out during GitHub's Actions/Pages incident, and its re-run failed with "Deployment cancelled" (same commit, same
  deployment ID), so this notes-only PR is the new commit that publishes the site again. What to do next time:
  `vault/reference/shared-infrastructure.md` (GitHub Pages deploy).
- **2026-11-04 (class picks on each choice, Sam's ask, Claude Code)** — `widget/v3.js` + `widget/v3.css`, every hub, no hub
  changes: once a question card is answered, each choice shows the share of the class that picked it (a % at the right, a fill
  behind the choice as wide as its share, the top pick in bold) and a line under "% of the class got this right" says how many
  answers it's from. Reads `question_choices` (by authored index) through `shGetClassStats(qids, cb, true)`, which now also returns
  `byQid[qid].choices`; choice buttons are found by `data-idx`, `data-multi-idx`, `data-mock-pick`, `data-mock-multi` or
  `data-exam-choice` (`CP_ATTRS`), so a new hub that keeps those attributes gets it for free. A card drawn unanswered fetches the
  counts as it renders and adds your own pick from the answered event (no race with `record_choice`); a card drawn already answered
  (mock results) waits 1.2 s and uses the server's numbers. Multiple choice: picks / all picks; select-all: ticks /
  `question_stats.attempts`. Shown from 2 answers. Nothing shows during a mock exam. About page: "Class accuracy on every question".

- **2026-11-04 (Supabase: `admin_reset_changelog` refuses a missing secret, Claude Code)** — Found by `/reddit-scout`'s
  first run, Sam's go. The function checked `p_secret <> '...'`; with `p_secret = null` that comparison is NULL, so the
  check was skipped and any visitor with the publishable key could have emptied the site changelog and written their own
  entries. `migration_v48.sql` checks it with `sh_admin_ok()` like every other admin function (`is not distinct from`, so
  NULL fails); applied to the live database through the connector and checked, and `supabase/schema.sql` updated. The
  other secret-gated functions use `sh_admin_ok()` or `is distinct from`, so none has the same hole. Nothing in the repo
  calls this function. No site change.
- **2026-11-04 ("Find this in the notes" after a missed question, Claude Code)** — From `/reddit-scout`'s first run, Sam's
  go. `widget/v3.js` (`njAttach` and helpers, after `findQuestionMeta`) + `widget/v3.css` (`.sh-nj*`), so every hub gets it:
  when the student misses a question they just tapped, a **Find this in the notes** button appears under the explanation
  (inside `.qcard-explain`, before the class-accuracy row). It opens the best-matching notes paragraph in the card, its six
  most telling words marked, and **Open this in the notes** jumps there through the hub's `window.SH_GOTO` (the search's jump:
  opens the lecture at As taught and flashes the paragraph), closing the Daily drill first if it's open. The match is BM25
  over that lecture's `Notes` entries in `SH_EXPORT.sections` (50+ characters), weighting the right answer 2, the
  explanation 1.5 and the stem 1 (numbers a third), from `SH_EXPORT.questions[].hint`; below a score of 14 or with fewer
  than two shared words there is no button (`NJ_MIN_SCORE`). On the current banks 90-97% of questions get one (Occlusion
  649/671, Perio 633/650, PCD Implants 486/543). Only the card the student just tapped (capture-phase click/keydown), so the
  mock's submit and the arcade never get one; also skipped for `ctx` `mock` / `arcade`. Tracked `notes-jump:shown`, `:none`,
  `:show`, `:open`. Checked in Playwright on Occlusion, Perio, PCD Implants and Special Patient Care, desktop and phone,
  plus the drill and dark mode. About page ("In every hub"); `sw.js` -> `sh-v52`. No hub, notes, audio or schema change.

- **2026-11-04 (Timmy Time comments open folded, Claude Code)** — Sam: under every episode the comment thread now shows
  only its first comment (the first lore comment when there are any), with "Show n more comments" / "Show fewer
  comments" (`aria-expanded`; `pod:<id>:comments-all` still tracks opening it). Posting a comment opens the thread so
  the new one shows. `widget/podcast.js` only (`SHOW_FOLDED`); rule note and About page updated.

- **2026-11-04 (PCD Implants: "Practiced least" on Home, Claude Code)** — Sam approved the lessons audit's proposal. Two days out,
  practice in `pcd-implants-exam1` fell off in bank order (the last four lectures had 6-7 answerers each vs 23 on L1-L2), so Home's
  "Where to next" now lists up to four lectures with under half their questions tried, fewest first, and its Practice button opens
  the Question Bank on them with "Not answered yet" (`homeGo('least:<ids>')`, `STATE.ui.qlec` as an array). It replaces the "Not
  started" row once you've answered anything; a brand-new visitor still sees "Not started". About page (PCD Implants' Home line),
  `vault/decisions.md`, hub note. No question, notes, audio or schema change.
- **2026-11-04 (reddit scout, Claude Code)** — New `/reddit-scout` skill (`.claude/skills/reddit-scout/`, model
  invocation off, so it runs only when Sam calls it): reads r/ClaudeAI, r/ClaudeCode, r/Anthropic and r/claude through
  `tools/reddit-scout/scout.py` (Atom feeds, since Reddit's JSON API answers 403 to cloud sessions; standard library
  only, paced for Reddit's 429s), checks each idea against the repo, Sam's decisions and the docs, and reports only what
  clears the bar; no suggestions is a normal result. Every run is logged in `tools/reddit-scout/log.md`, which also
  tells the next run what was already judged. Unfixed security findings go to Sam in chat, never into the public repo.
  First run (past month, 728 posts) logged there. Listed in `CLAUDE.md`, `vault/home.md` and the repo map. No site change.
- **2026-11-04 morning (lessons audit, PCD Implants two days out, Claude Code)** — `hubs/pcd-implants-exam1`, same ids and answer
  positions: report #37 (`bm-goodacre` printed each complication's percentage in its choice, so the biggest number was the key): the
  choices are now plain names and the numbers are in the why lines. Explanations name the favorite wrong answer on `ev-misch` (Ford
  Turner), `bm-moment` (force / area is stress) and `ev-blade` (screws through both plates are transosteal), and the select-alls `tm-mm-1`,
  `tm-mm-2`, `tm-mm-3` explain every option (explanation and why lines). **Select-all ticks are recorded** in `pcd-implants-exam1`,
  `occlusion` and `special-patient-care`: their `recordAnswer` passes the ticked options as `picks` in the answered event, so
  `widget/v3.js` sends `record_choices` (until now only perio did; `question_choices` has no select-all rows for these hubs before
  today). `LESSONS.md` refreshed (Live signals; standing lessons on bank order, select-all tracking, numbers as giveaways, and the
  Occlusion-then-Heme & Endo check-ins; Heme & Endo retrospective now n = 13). No reading text, audio or schema change.

- **2026-11-04 (Timmy Time: PCD Implants Exam 1 episode, and likes, dislikes and comments on every episode, Claude Code)** —
  A 48-minute last-minute review for PCD Implants Exam 1 (Fri Nov 6): `hubs/pcd-implants-exam1/audio/timmy-time.mp3`
  (35 MB, -16 LUFS), script `tools/podcast/pcd-implants-exam1/script.md`, from the hub's notes (As taught), Exam Hints
  (the course's hint list, every professor quote, Dr. Givan's study guide), cram sheet and `LIKELY_TOPICS`, 14 chapters
  (L1-L9, with Dr. Chen's terms split in two) and a 25-question lightning round. No graded quiz content; no CDT codes,
  clinic credits or brand details without an exam signal (reports #35/#36). Where lectures give different numbers (the 5 mm
  rule vs the 7 mm count from bone vs Dr. Geisinger's table) it says whose is whose. **New rule
  ([podcast-intro](vault/rules/podcast-intro.md)):** the cold open skips the minutiae (no question counts, exam time or
  LockDown Browser); the `/podcast` skill now says so. Lore (Sam picked all four): three Thanksgiving costumes, one per page
  load; Timmy is proud of his ligament (never splint him to an implant); thirty-one thinks he's a failing implant;
  Brånemark's rabbit. `lexicon.json` gains 34 entries (Brånemark, Geisinger, Chavali, Mueninghoff, Straumann, DICOM, ALARA,
  Bremsstrahlung, endosteal/eposteal/endosseous/subperiosteal, periapical, trabeculae, and `S-L-A`, `U-C-L-A`, `U-A-B`,
  whose final A read "uh"). Hub: `SH_PODCAST` (id `exam1-review`), card on Home under the quick-start row, "Also here"
  link, `#timmy` opens Home; dashboard card gets `podcast` and "Timmy Time" in modes. **New rule
  ([podcast-reactions](vault/rules/podcast-reactions.md)), for every episode:** `widget/podcast.js` + `widget/v3.css` add a
  like and a dislike (one per visitor, tap again to undo), the episode's 1-3 lore comments (`SH_PODCAST.fans`, a random
  count; this one has three: number thirty-one, the rabbit down the hill, the toothbrush by the door, all in `LORE.md`) and
  the class's comments (post at once under the leaderboard name, 280 characters, 5 per episode a day, delete your own,
  report anyone's, three reports hide one). `migration_v47.sql` (applied through the connector): `podcast_reactions`,
  `podcast_comments`, `podcast_comment_reports`, `pod_feed`, `pod_react`, `pod_comment`, `pod_delete_comment`,
  `pod_report_comment`, `admin_pod_comments`, `admin_hide_pod_comment`. Admin page: Inbox → "Podcast comments", hide or
  restore any. Tracked as `pod:<id>:like|dislike|unvote|comment|report|comments-all`. About page updated. Older episodes
  get the buttons and the class's comments too, but no lore comments (their hubs are archived). Sam asked about Gemini
  TTS: no `GEMINI_API_KEY` in the environment, so this episode is Kokoro.
- **2026-11-04 (Special Patient Care: the exam's format, 45-question mock, multiple-answer questions, Claude Code)** — Dr.
  Mitchell's exam email: 45 questions, 135 minutes, open notes and lecture materials, no other people, a mix of multiple
  choice, multiple answer, ordering, matching, Hot Spot, fill-in-the-blank and true/false, and no discussing the exam until
  after November 18. Its dates (Fri Nov 17, Sat Nov 18) are an earlier year's calendar; Sam kept opens Fri Nov 6, due Fri
  Nov 13 11:59 pm, and Canvas closes Sat Nov 14 11:59 pm. The hub: `EXAM_INFO` (new Rules and Practice rows), the exam card's
  summary, a Canvas-closes line in `COURSE_DATES`, `EXAM_LAST` / `TALK_FROM`, the header pill ("Past due · Canvas closes
  tonight") and Home's done message (no discussing until after Nov 18; check-in opens Nov 19). The mock is now 45 questions
  in 135 minutes (`MOCK_BLUEPRINT` 5/6/6/6/6/6/6/4, `MOCK_LIMIT`), with one multiple-answer item per unit (`MOCK_MULTI`):
  tick boxes, all-or-nothing for the score, the bank's partial credit and the why list in review; its clock label read
  "/ 90:00" against a 75-minute limit and now reads the limit. 24 new multiple-answer questions, three per unit (`mm()`,
  copied from PCD Implants, inline whys); bank 452 -> 476. Sam chose no ordering, fill-in-the-blank or Hot Spot practice.
  Dashboard: new per-exam `checkinFrom:{date,hour}` (holds the Check in button and pop-up), set to Nov 19 for this exam; the
  card stays live through Saturday (hub-level `archiveOn` Nov 14 hour 24, mirrored in `SH_EXPORT.archiveOn`); the card text
  gives the format. About page (check-in line), hub note, decisions; `sw.js` -> `sh-v51`. No schema change.

- **2026-11-04 (Occlusion L7: five interactive diagrams, Claude Code)** — The five figures Sam approved on 2026-11-03,
  built with anima in `tools/figures/occlusion/anima/` and placed in the L7 notes at both levels (`FIG_PLACE.malocclusion`
  and `FIG_BY_LEC.malocclusion` in `od.js`, in `data-sh-noread` wrappers; READINGS and the mp3s unchanged) and in L7's
  Review tab (`figs` sections next to the matching tables): `tolerance` (normal function + events against a movable
  tolerance line; above it the slides' signs a-g light on a side view with the masseter and temporalis; "Monday, then
  Tuesday"; two SVGs that stack on a phone), `stability` (seat the joints and close to the first contact, bite into MIP
  and the condyle comes off its seat, 1-2 mm / > 3 mm / the 10% with MIP = CR, bruxer loading, a flat plane splint),
  `splints` (maxillary or mandibular, full or partial, stabilizing or repositioning, protrude on the ramp, months of
  partial-coverage wear), `thirds` (slide the lower molar: first third grinding, middle third minor ortho and fixed pros,
  beyond that major ortho, surgery, pros) and `erosion` (both arches, GERD with the side slept on, bulimia, soda swished or
  pooled, citrus sucked or chewed, NCCLs, plus an attrition vs erosion close-up that doesn't say whether erosion facets
  match). `stability` and `splints` share a side-view rig, `anima/l7rig.mjs` (skull, mandible, disc, teeth, a contact
  solver; poses solved in Node). About page "Diagrams" entry updated. No question, notes or audio change; no schema change.
- **2026-11-04 (taste skill, Claude Code)** — `.claude/skills/taste-skill/` (install name `design-taste-frontend`),
  vendored from Leonxlnx/taste-skill (MIT; commit and what was left out in its `UPSTREAM.md`): art direction for web
  pages and app screens, with a library of directions, a source linter and a real-browser inspector. Sam's call: when
  Sam asks for a redesign, the skill is used in full, its house rules included (no monospace, eyebrows, gradients, index
  numbers), even where they differ from a hub's current look; the vault's content and feature rules still hold, and
  nobody restyles a live page unasked (the local box at the top of its `SKILL.md`, `vault/decisions.md`). New
  `tools/chrome-no-sandbox.sh`: set it as `CHROME_PATH` so Chrome-driven scripts run as root in cloud sessions.
  Listed in `CLAUDE.md` → Claude Code specifics; `.taste-skill/` (its working files) is gitignored. Cowork/Claude
  Projects don't load repo skills. No site change.

- **2026-11-04 (Thanksgiving all November, then Christmas to Dec 26, Claude Code)** — Sam: Thanksgiving was only Nov 20-27, after most hubs archive. `widget/eggs.js` (`tgSeason`, `xmasSeason`) and `widget/pet.js` (`holidayId`, kept in step): Thanksgiving now runs Nov 1 to the day after Thanksgiving, and the `winter` holiday (renamed "Christmas"; id unchanged, so costumes, outfits and lines carry over) from then to Dec 26 (was Dec 10-30). Dec 27-30 has no holiday; New Year unchanged. About page dates, `sw.js` -> `sh-v50`. No schema change.

- **2026-11-03 (the repo is a vault: AGENTS.md, vault/ notes, tasks, Claude Code)** — Sam's new standing rule: use the repo
  like an Obsidian vault that any AI agent can be pointed at to do tasks (`vault/rules/repo-is-the-vault.md`). New
  `AGENTS.md` at the root is the entry point for every agent (Claude Code loads it through `CLAUDE.md`). New `vault/`:
  `home.md` (the map), `rules/` (every standing rule as its own note: the `CLAUDE.md` sections and this file's rule
  sections, moved word for word, plus new `repo-is-the-vault` and `american-english`), `how-to/` (new: `build-a-hub`,
  the checklist and every file a new hub or lecture touches), `reference/`, a note per hub (`hubs/`: sources, build
  steps, quirks, diagram calls, pending work; `boards` for the hub on its own branch), `decisions.md` (Sam's calls,
  started from this log), `tasks/` (one note per task with a status, an inbox, `done/`; six open or waiting tasks:
  Occlusion L7 diagrams and final time/format, perio S6, S8 host modulation, S9, and merging `main` into
  `claude/boards-hub`, whose own older `AGENTS.md` will conflict with the new one) and `templates/`. `CLAUDE.md` is now
  short and `@`-imports `AGENTS.md` and every rule, how-to and reference note, so Claude Code sessions load the same
  rules as before. **It no longer loads this file** (over 200 KB, about 50k of the 65k tokens a session started with):
  read its first entries and grep it before you change a hub. When a skill, Project doc or memory disagrees with the
  vault, the vault wins. This file's opening sections became the redirect table above. Notes link with relative
  markdown links (GitHub, Obsidian and agents all follow them); `.obsidian/app.json` sets that up for opening the repo
  root in Obsidian. **New CI check** `node tools/ci/vault.js` (last step of `check.yml`): every relative link in the
  vault, `AGENTS.md`, `CLAUDE.md` and `README.md` resolves, no `[[wikilinks]]`, every vault note has frontmatter, task
  notes have a valid status (done ones in `done/`), every rule note is listed in `vault/home.md` and imported by
  `CLAUDE.md`, and every hub folder has its note on the map. References to `CLAUDE.md` sections in the skills, `tools/`,
  `LESSONS.md` and the CI messages now point at the notes. The repo's skills, checked against the vault:
  `/lessons-audit` drops the retired "carry into the split sources" step, keeps each edited question's why lines in
  step and checks `vault/decisions.md` before proposing; `/podcast` and `/lessons-audit` run `vault.js` and write back
  to the vault; the anima skill opens with a box saying the house rules override it (no figure without Sam's approval).
  No site change.
  **Every agent: write back what you learn to the vault in the same PR** (task outcome, decisions, hub note, new rules).

- **2026-11-03 (lecture notes: scrolling list, Previous / Next, Report, figures that fit, Claude Code)** — Sam: the lecture list
  scrolled with the notes (Occlusion's list is 790 px tall, so on a 768 px laptop L7 was only reachable at the bottom of the notes),
  there was no way to the next lecture from the end of the notes, interactive figures didn't fit on screen with their controls, and
  each lecture needs a flag button. All in the shared widget, so every hub gets it: a "lecture notes" block in `widget/v3.js` sets
  `--sh-head-h` (the sticky top bar's height) and `--sh-vh` (screen height divided by the text-size zoom) on `<html>`, and watches
  for a `.notes-layout` with a `.lec-nav` and an `article.reading`. `widget/v3.css` (wide screens, 861 px+): the list sticks under
  the top bar and scrolls on its own (`max-height` from those vars; the open lecture is scrolled into view, also across the top on
  phones). Under each lecture's notes, `.sh-lec-pager`: Previous / Next (they click the hub's own nav buttons, then scroll to the
  top of the notes) and **Report a problem with these notes**, which opens the Report panel with `shOpenFlag({lec, label})`; the
  report lands in `question_flags` with "lecture notes L2 · Title (id)" in its note, so Inbox replies work as for questions. Perio's
  own "Next:" button is gone (the pager replaces it). **Figures**: an anima drawing's height is capped to about 62% of the screen
  (the SVG letterboxes), and a figure with one drawing and controls (`.anima > figure.iso-figure` + `.am-controls`) gets
  `sh-fig-pin` (sticky under the top bar) when it fits in 70% of the screen, so the drawing stays put while its options and
  explanation scroll under it. Tracked `notes:prev`, `notes:next`, `notes:report`. About page, `sw.js` -> `sh-v49`. No schema change.
  **A new hub gets all of this by keeping that notes markup.**

- **2026-11-03 (Question Bank filters redone in Occlusion, Perio, Special Patient Care and PCD Implants, Claude Code)** — Sam: "it
  doesn't seem like people know how to use it". The data: in Occlusion 66 people opened the bank and 2 ever opened the lecture
  picker; in PCD Implants 5 of the 8 who used it tapped Clear first just to get one lecture; select changes weren't tracked at all;
  and since 10-30 the bank reopens with the last filters with nothing on screen saying so. Each bank now opens with one labeled
  panel (`.qbar`): **Lectures** (Perio: Sessions; the tick list, every row with **Only**, All lectures / Untick all, Occlusion's
  final/midterm presets) beside the search box; **Show** chips with live counts (`BANK_SHOW`: All, High likelihood, Not answered
  yet, Missed last time, Pinned; replaces the status dropdown and the separate Pinned button); **Order** In order / Random; **More
  filters** (folded, "n on" badge): question type (only the formats that bank has, with counts; new: Matching, Put in order,
  Diagram questions in the three shared-engine hubs) and where it's from (new in Perio). Under it, "Showing n of N questions" with a
  tag per filter (tap to remove) and Clear all; an empty result names the filter in the way and offers "Show all N questions".
  **"Likely first" is gone** at Sam's request (High likelihood is a filter: those questions or the whole bank); a saved
  `qorder:'likely'` falls back to In order. Perio's rarely reachable "Mastered" status is gone (a saved one falls back to All).
  Fixed on the way: "In order" stayed highlighted beside "Likely first" after a reload. New tracking (`feature_events`):
  `bank:show=`, `bank:lec-only`, `bank:lec-all|none|final|midterm`, `bank:type=`, `bank:src=`, `bank:more`, `bank:search`,
  `bank:tag-off=`, `bank:clear`, `bank:empty-clear`. Heme & Endo Exam 1 unchanged (Sam). New standing rule (above and `CLAUDE.md`).
  About page. No schema change.

- **2026-11-03 midday (lessons audit + Heme & Endo Exam 1 retrospective, Claude Code)** — `hubs/pcd-implants-exam1`, same ids and key
  positions: report #34 (`cb-pe`: each wrong choice named only one of the two variables, so the key was the only complete answer) now has
  all four atomic-number / photon-energy combinations, each with its why; `cb-atten-z` had the same giveaway and gets the same treatment.
  No notes text changed, so no narration rebuilt; `question_choices` rows before today for both ids refer to the old choices.
  `tools/publish-recap.js`: the exam date it reads from `index.html` skipped exams after an `extraQs` list (Occlusion's final would have
  been recapped as of the midterm) and took a reopened hub's `archiveOn` date as an exam (Heme & Endo as of 11-03); both fixed. The Heme &
  Endo recap published 10-30 is unchanged (Sam reopened the hub for a late exam). `LESSONS.md`: Heme & Endo Exam 1 retrospective (the best
  check-ins yet: 8 of 10 "About right", none "Exam asked different things"), the last refresh checked (MCQ fixes worked, two-statement
  and true/false ones didn't), new Live signals. **Reports #35/#36 (Sam: remove those and ones like them)**: removed from PCD Implants
  the brand and admin details with no exam signal (no hint, focus list, "on my exam" or example question): `tm-conelog` (CONELOG's taper),
  `tm-rc-grooves` (Straumann RC's grooves, plus its card in the engaging sort), `tm-code-6010` and `tm-code-6058` (CDT codes) and
  `gs-credit` (clinic crown credits); bank 548 -> 543. Kept, because the hint list or the professor flags them: each system's surface,
  alloy and torques, conical vs non-conical, and `pf-systems` (Dr. Chavali's own example question). **Heme & Endo** (Sam reopened it for a
  late exam): it still archives tonight at 10 pm (`archiveOn`), but its card stays on the dashboard with the Check in button until
  **Fri 11-06 10 pm** (new `hideCardOn:{date,hour}` and per-exam `checkinUntil:{date,hour}` in `index.html`). No schema change.

- **2026-11-03 (perio S7 and S8 taught, true/false and numbered items, six diagrams, Claude Code)** — Sam: update perio with
  the new files in Drive (Periodontology/hubs, added Nov 2): `perio oct 29.txt` (the Oct 29 class capture of S7) and
  `D2 Implants in periodontally compromised patients 2026 updated.pdf` (**S7 is Dr. Kaur's**, not Dr. Carr's), plus Dr. Litz's
  `Antibiotics in Periodontics recording_Dr. Litz_03252024.mp3` (a 2024 recording he gives every year; `litz antibiotics.txt` is its
  transcript) and `Antibiotics and Host Modulation in Periodontics_Dr. Litz.pdf`. Both sessions go from `upcoming` to `taught`
  (S8 carries a `note`: host modulation comes from the slides until its class part is posted). Both reading levels rewritten for
  both, and all four mp3s regenerated. **Engine**: perio gets Occlusion's `two()`, `tf()` and `nums()` (plus `mq()`/`mm()`,
  which build an item from [choice, why] pairs); `choiceOrder()` keeps tf/numbered in order, `arcadeQ` skips them, and the bank's
  type filter gains "True or false" and "Numbered statements". **Questions**: 68 S7 (`q7-L*`, `-M*`, `-E01`, `-P01..04` on the
  #31 case and others, 5 two-statement `q7-S*`, 8 true/false `q7-T*`, 4 numbered `q7-N*`) and 73 S8 (`q8-L*`, `-M*`, `-E*`,
  `-P01..04`, `q8-S*`, `q8-T*`, `q8-N*`), each choice with its why; bank 509 -> 650. **Fix**: the hub said ciprofloxacin is
  absorbed better with food; the slides and recording say most rapidly 1 hour before or 2 hours after meals (`q8-04` reworded,
  same id and key position; its `question_choices` rows before today mean the old wording; the antibiotics table and cram line
  corrected). 25 exam hints quoted from the capture and the recording; `LIKELY_TOPICS` re-ranked for S7 (10) and S8 (10) from
  those hints (Dr. Kaur's own end-of-class list: smoking, mucositis vs peri-implantitis, bone loss as the difference,
  physiologic vs pathologic bone loss, risk assessment at every stage); Review (diagnoses, Meffert, risk factors, BOP and
  radiographs; prescribing, the full antibiotics table with doses, local delivery, host modulation); cram, mind maps, 5 arcade
  words. **Diagrams** (Sam approved all six): new `tools/figures/perio/` (copied from heme-endo's build: `build.mjs` fills the
  hub's `anima:js`/`anima:css` markers, `--check`, `--preview`): peri-implant states, Meffert, BOP over 4 visits, the radiograph
  schedule (S7), why a biofilm beats antibiotics, where each antibiotic acts (S8); under the notes (`FIG_BY_LEC`/`figsHTML`,
  outside `.reading-prose`, `data-sh-noread`) and in Review. About page. No schema change.

- **2026-11-03 (Occlusion L7: Malocclusion and Dysfunction, Claude Code)** — From the Drive Occlusion/Final folder (Occ Lec6 malocc slides + handout, `Occ oct29.txt`, the 10/29 lecture capture). New lecture `malocclusion` (L7, `exam:'final'`, tag `rose`, taught): notes at both levels and both mp3s (`audio/malocclusion-full.mp3`, `-plain.mp3`): the functional disturbance model, TMD (Bell's classification; muscles ~50%, joints ~35%; not orofacial pain), the five etiologies, orthopedic vs occlusal stability and its risk factors, interferences and the high crown, occlusal therapy (reversible vs irreversible, splints, the rule of thirds), trauma, mobility, wear and erosion patterns, NCCLs, stress, deep pain and bruxism. 145 questions (`mo-*`, `cs-mo-*` on 4 new Patient Box cases `mohigh`/`mobrux`/`moeros`/`momob`; 8 two-statement, 12 true/false (6 True), 6 numbered (keys 2/1/1/2 over the four positions), 5 EXCEPT, 2 select-all, 1 ordering, 1 matching; each with its why; correct answer longest in 33% of L7's MCQs), 17 exam hints quoted from the capture (one de-emphasized: the TMD classification list is the third-year course), 12 `LIKELY_TOPICS`, a Review tab, cram lines, 2 sort sets and a process. Where slides and recording differ (whether erosion facets match; how long a splint stops bruxism) the notes give both and no question turns on it. `MOCK_BLUEPRINT` = `{ instruments:20, malocclusion:20 }`; `EXAM_INFO`, `COURSE_DATES`, the hints banner, the mock intro and the dashboard card updated. Bank 526 -> 671. Diagram review: Sam approved all five candidates (the tolerance model, orthopedic vs occlusal stability, splint designs, the rule of thirds, an erosion pattern map); they ship in a follow-up PR. No schema change.

- **2026-11-03 (new hub: PCD Implants Exam 1, with 11 interactive diagrams, Claude Code)** — `hubs/pcd-implants-exam1/` for
  PCD Implants Exam 1 (Fri Nov 6, Canvas 7:00 am-8:00 pm, 40 questions in one hour: 3 multiple-answer, 3 matching, the rest
  MCQ). Nine lectures, all `status:'taught'`: L1 Evolution of Dental Implants (Dr. Mueninghoff), L2 Introduction and the
  Implant-Tissue Interface, L3 Biomechanics, L5 Prefabricated Abutments (Dr. Chavali; L2's recording is an earlier year's run),
  L4 Implant Terminology and L9 Guided vs Freehand (Dr. Chen), L6 Imaging for Implant Diagnosis and L7 CBCT 101 (Dr. Givan's
  study guide and handouts), L8 Introduction to Implant Surgery (Dr. Geisinger). Sources (Drive, PCD Implants): the recordings
  (transcribed in-session), slides and handouts, the course's hint list; a prior class's answers to the hint list and a
  diagram-aids doc were used only as a checklist against the lectures. No graded quiz or previous years' exam content used.
  Built on the Special Patient Care engine (Home first, why for every choice, lecture picker, pins, retries, sync, drill) with a new
  palette ("Anodized": titanium blue-gray; Sora / Manrope / Red Hat Mono). 548 questions (src `rec` / `slides` / `hub`): 373 MCQ,
  11 multiple-answer (`mm()`, a new helper: one `[choice, isCorrect, why]` per option), 11 matching, 46 two-statement, 77 true/false
  (38 True), 30 numbered-statement; correct answer longest in 37% of MCQs; 5 picture questions name an old implant type from a
  drawn radiograph (`FIGS` `ty-*`). Notes at two levels with Kokoro narration for all nine, 68 exam hints (the hint list plus
  recording quotes), 53 `LIKELY_TOPICS` (263 questions tagged), cram sheet, Review (each lecture's note tables, a Side by side tab:
  the space numbers that sound alike (Chavali's 5 mm on the casts vs the 7 mm from bone vs Geisinger's 7-8 / 7.5 mm), torque and
  stability numbers, osseointegration definitions, health vs mucositis vs peri-implantitis), a 40-question / 60-minute mock (MCQ
  only, `MOCK_BLUEPRINT` 3/6/5/9/3/4/3/5/2; no official counts per lecture). **11 anima figures** (Sam: "Yes to all animations and
  figures"; `tools/figures/pcd-implants-exam1/`, one generic live controller `amLive` in `shared.mjs`, `build.mjs --check`,
  `--preview`): tooth vs implant attachment, one- vs two-stage, Misch D1-D4, cantilever (25 lb -> 75/50 lb), ideal position
  (papilla and black triangle under 3 mm), connections / platform switching / microgap, the stability dip, the E/B/C zones,
  screw vs cement (the 5 mm rule), CBCT beam and detector, freehand vs pilot vs fully guided vs dynamic; placed in the notes
  (`FIG_PLACE`, both levels) and Review (`figs` sections). Arcade: the **Osseo Arcade** (`IMPL_SKIN`, `[data-sg-skin="impl"]`, drawn
  implant lab: CBCT unit, light box, planning computer, order form, kit drawer; the scan template's gutta-percha markers show the
  last digit): Osseo Sort, Platform Showdown (Torque Check, Final Torque), Implant Lab Escape, Mind the Microgap, The Golden Fixture,
  Cross-Slice. Dashboard `HUBS` (`checkinHour:20, promptHour:20`: the window closes at 8 pm), new class `implants` on the `pros`
  ring, `ARCADES`, `HUB_LABEL`/`HUB_RING`; `review/` and `tools/publish-recap.js` labels; `widget/ranks.js` name and medal (an
  implant emblem); `sw.js` -> `sh-v48`; About page (Home, pick/pins lists, Diagrams, arcade table). `LESSONS.md` refreshed first
  (steps 1-3). The build sources stay in the session (the hub is a single file: edit it directly, but edit the figures in
  `tools/figures/pcd-implants-exam1/` and rerun its `build.mjs`). No schema change.

- **2026-10-30 (pins sync across devices; the bank remembers its filters, Claude Code)** — Sam: pins should follow you, and hubs
  should open the bank with the filter you used last. `migration_v46.sql`: `question_pins` (visitor, hub, qid, pinned, t = the
  device's change time in ms; an unpin is kept so it beats an older pin), public `set_pins(p_visitor, p_hub, p_pins)` and
  `get_my_pins(p_visitor, p_hub)`, and `redeem_link_code` moves a device's pins (newer change wins). `widget/v3.js`: each Pin tap
  saves at once; `shPins.sync()` runs with the answer sync (hub load, and back after 3+ minutes), merges per question by time,
  uploads anything newer and fires `sh:pins {synced:true}` so an open Pinned view redraws. Change times in `sh_pins_t_<hub>`.
  Perio's bank now saves its sessions, type and status (`STATE.ui.qbank`) like Occlusion and Special Patient Care already did
  (the search box still starts empty). About page. **Perio Project: carry `STATE.ui.qbank` into the split sources.**

- **2026-10-30 (High Likelihood Exam Questions in every live hub, Claude Code)** — Sam: carry Heme & Endo's feature to all current and
  future hubs (now a standing rule in `CLAUDE.md`). `LIKELY_TOPICS` + `EXAM_COUNTS` (empty: no hub has announced counts per lecture),
  `likelyChip()`, `likelyHTML()` (top of Exam Hints, "Practice these" opens the bank on that lecture with status "High likelihood only"),
  a **Likely first** button in the bank's order toggle and a **High likelihood only** status. Topics, each with its evidence: **Occlusion**
  11 for L6 (the final's only lecture so far; Dr. Givan's hints from the recording, 52 questions); **Special Patient Care** 50 over the 8
  units (Dr. Mitchell's hints first, then module / reading / lecture; 174 questions); **Perio** 52 over S1-S9 (recording hints, the midterm
  check-ins, the exam-review guide and the slides; 212 questions; S7-S9 from the guide until they are lectured). No graded quiz content
  used. Tracked as `bank:order=likely`, `hints:likely-practice`. About page. No schema change.
  **Perio Project: carry `LIKELY_TOPICS` and its code into the split sources. Re-rank a hub's topics when hints, reviews or counts arrive.**

- **2026-10-30 (Question Bank: pick your lectures, in order or random, pinned questions, Claude Code)** — Sam's request, for
  Occlusion, Perio and Special Patient Care and every future hub (not Heme & Endo Exam 1: its exam has passed). The lecture
  dropdown is now a tick-box list (`lecPickHTML()`/`wireLecPick()`, all ticked by default, Select all / Clear; Occlusion adds For the
  final / Midterm lectures; `STATE.ui.qlec` takes an array; Perio keeps `QBANK_FILTER.lec` in memory as before). Shuffle became an
  **In order / Random** toggle (`STATE.ui.qorder`; In order = by lecture then bank order, patient sets kept together). **Pins**:
  `widget/v3.js` adds a Pin button beside Report on every card in hubs that set `window.SH_PINS = true` (`window.shPins`,
  `sh_pins_<hub>`, `sh:pins`, tracked `pin:add`/`pin:remove`, `bank:order=`); the bank has a Pinned (n) button and a "Pinned" status.
  Occlusion's default lecture pick is now all lectures, and everyone starts once with all ticked (`STATE.ui.qpickOn`). New standing
  rule in `CLAUDE.md`. About page, `sw.js` -> `sh-v47`. Pins are per device (no sync yet). No schema change.
  **Perio Project: carry the picker, order toggle and `SH_PINS` into the split sources.**

- **2026-10-30 (Heme & Endo Exam 1 check-in live, Claude Code)** — Sam: open the check-in now. The exam ended at 9:30 am, so its
  `HUBS` entry sets `checkinHour:9, promptHour:9`: the card's "Check in" button and the dashboard pop-up both go out on exam day
  instead of the button at 10 am and the pop-up at 10 pm. No schema change.

- **2026-10-30 (database timeouts on exam day: XP and activity summaries, Claude Code)** — On Heme & Endo exam morning the
  dashboard's handpiece rank board stopped loading and the admin page's Time by section kept failing, even after #200's index.
  Cause: `sh_visitor_xp(null)` recomputed everyone's XP from all of `personal_answers` (~0.9 s, a window sort spilling to disk),
  and `get_rank_profile` (every hub and dashboard load: 15k calls), `get_trophy_stats`, `get_rank_board`, `get_leaderboard` and
  `get_correct_streak_stats` all call it, so the database was saturated and every RPC near the 3 s anon limit failed.
  `migration_v44.sql` (**applied via the connector**): a trigger on `personal_answers` keeps `xp_seen` (first try per
  visitor/hub/qid/correct, which decides 10 vs 2 XP) and `xp_days` (per visitor and Central-time day: answers, right, raw XP)
  in step; updates/deletes (Link my devices) rebuild the affected visitors. `sh_visitor_xp` keeps its signature and rules and
  reads `xp_days` (3 ms; all 151 visitors' XP, days, answers and right answers checked identical to the old formula);
  `get_rank_profile` 1.1 s -> 8 ms. `get_rank_board` and `get_leaderboard` now name only the rows they return (leaderboard reads
  days and totals from `xp_days`; same output). `migration_v45.sql` (**applied**): the admin page sends 16 RPCs at once and the
  three time queries each counted ~190k raw pings (~1.1 s), so a trigger on `activity_pings` keeps `activity_hourly` (pings per
  hour, hub, section, visitor; null section stored as '') and `activity_visits` (first/last ping per visit);
  `get_visitor_by_hub`, `get_visitor_by_section` and `get_visitor_summary` read those (6-19 ms; 30-day sections and ping counts
  checked identical) and now use `sh_admin_ok()`. The range now starts on a whole hour. Still slow: `anon_name()` (~65 ms per
  call; it computes every streak holder's base name), which keeps the boards at ~0.5 s. **Anything new that totals answers or
  pings per visitor: read `xp_days` / `activity_hourly` / `activity_visits`, not the raw tables.** No site change.

- **2026-10-29 afternoon (lessons audit, Heme & Endo exam eve, Claude Code)** — `hubs/heme-endo-exam1`, same ids and answer
  positions, explanations only plus one stem: `td-num-2`, `ca-2s-4`, `ad-11bhsd`, `td-inducers` and `ca-r-vdr` now answer their
  favorite wrong choice; `cs-triam`'s stem asks "Which corticosteroid is the popular intermediate-acting one?" instead of what
  Dr. Fasinu named (same choices and key). No notes text changed, so no narration or Timmy Time rebuild. `LESSONS.md` refreshed
  (this morning's cue on `pa-insulin-fat`: 43% -> 11 of 17). No schema change.

- **2026-10-29 (Heme & Endo Exam 1: professors' focus lists for L3 and L4, Claude Code)** — Sam passed on the professors' hints the
  night before Exam 1. L3 (Growth): regulation of GH secretion, GH and IGF-1, major metabolic effects of GH, effects of GH excess or
  deficiency, changes in GH with aging. L4 (Thyroid): synthesis, storage and release, T4 to T3 conversion, regulation of the
  thyroid axis, major metabolic and cardiovascular effects, hyper- vs hypothyroidism including Graves; both: understand the major
  relationships and physiologic effects. The notes already covered every item, so **no notes text changed and no narration or
  Timmy Time rebuild**. `hubs/heme-endo-exam1`: 21 new questions (`gr-f-*` 9, `th-f-*` 12, new src `focus`, "Professor's focus list"),
  written as relationship questions (block somatostatin, give IGF-1; where hormone
  is stored and how it is released, where T3 comes from, why the heart races) with a why for every choice; per lecture
  2 two-statement, 2-3 true/false, 2-3 numbered. Bank 610 -> 631. Only what the slides and the recordings say: nothing beyond them was added (Sam). `LIKELY_TOPICS` for L3 and L4 rewritten around the focus lists (L3's 6
  = the five hints with feedback split out; L4's 4 Patient Box topics kept, so its other 4 = synthesis/storage/release, T4 to T3, the
  axis, metabolic and CV effects), a new hint entry at the top of each lecture in Exam Hints, an exam-card line, cram lines. No schema change.

- **2026-10-29 early morning (lessons audit, Heme & Endo exam eve, Claude Code)** — `hubs/heme-endo-exam1`, same ids and answer
  positions, explanations and memory cues only: "Remember it" cues on `pa-insulin-fat` (lipoprotein lipase still picked 7 of 19
  after yesterday's explanation fix), `gr-ghrelin` and `h1-enzyme-linked`; `pa-num-1`, `pa-tf-3` and `ad-angII-gq` now answer their
  favorite wrong choice. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed (the docked Plaque Boss is hidden
  by 4 of 55 people, against 10 of 30 when it floated). No schema change.

- **2026-10-29 (arcade crossword layout fix, Claude Code, #194)** — A student said the crossword was unplayable ("the window is
  compressed where you can't see anything"). Its three tool buttons set the grid column's width, so the grid's columns stretched and
  the clue list was crushed to about 130 px (or cut off) at tablet and small-laptop widths. `widget/games.css`: fixed-size cells
  (`--cx`, up to 34 px, scaled to the screen; the grid gets `--cols` from `games.js`), the clue panel (`.cx-right`) wraps under the
  grid below 280 px, Across/Down stack when narrow, and the buttons fit inside the grid's width. All four live hubs (shared file).
  `sw.js` -> `sh-v46`. No schema change.

- **2026-10-28 night (Timmy Time: Heme & Endo Exam 1 episode, and a /podcast skill, Claude Code)** — A 53-minute last-minute
  review for Exam 1 (Fri Oct 30, 8:00 am), hosted by Timmy Tooth: `hubs/heme-endo-exam1/audio/timmy-time.mp3` (38 MB,
  -16 LUFS), script `tools/podcast/heme-endo-exam1/script.md`, written from the hub's notes (As taught), exam hints, cram
  sheet, `LIKELY_TOPICS` and the 10/28 review items, gland by gland (signals and feedback, pituitary, growth, thyroid in two
  parts, thyroid drugs, pancreas, adrenal, corticosteroids, calcium), with time weighted by the official counts and a
  34-question lightning round. No quiz content (Quizzes 1-2 are open until 10/29). Lore (Sam picked all four): his four
  Halloween costumes, one per page load (as `widget/pet.js` does); a neighbor, number thirty-one, the hypochondriac second
  molar; TIMMY as a fight-or-flight surge with no adrenal medulla; enamel isn't a calcium bank. `lexicon.json` gains 105
  endocrine words (hormones, drugs, eponyms, `GLUT`, `JAK`, `D-H-E-A`, `zona`). Every segment was transcribed back with
  faster-whisper and diffed against the script (it caught "It isn't" heard as "it is an" and a run-together
  "beta-endorphin"). Hub: `window.SH_PODCAST` (id `exam1-review`), the episode card on **Home** under the quick-start row,
  a Timmy Time link in Home's "Also here", `#timmy` opens Home; dashboard card gets `podcast` and "Timmy Time" in modes;
  About page updated. **New for every episode:** `tools/podcast/LORE.md` (the canon: read it, add to it),
  `tools/podcast/extract_hub.js` (a hub's notes, hints, cram and exam facts as text; works on every live hub, perio
  included), `render_podcast.py --words` (hard words and heteronyms in context), and the **`/podcast` skill**
  (`.claude/skills/podcast/SKILL.md`): ask Sam the length and lore, write, fix pronunciations, render, wire in, verify, PR.
  **When the notes change, fix the script and rebuild the episode in the same PR.** No schema change.

- **2026-10-28 evening (device-link prompt streamlined, Claude Code)** — The "Is this your other device?" prompt linked nobody in its
  first week (2 "Yes", 0 links). `widget/linkask.js`: "Yes, link them" now makes the code at once (no make-or-enter choice) and offers
  **Send the link** (share sheet) / **Copy the link**: `<site>/?link=CODE` opens a "Link this device?" card on the other device and
  links in one tap (the `link` param is removed from the address first). Typing a code links at the sixth character; the Link button
  stays. Tracked as `link-ask:share`, `link-ask:url-open`, plus the existing `code` / `linked` / `fail`. About page, `sw.js` -> `sh-v45`.
  Report #32 resolved with its reply. No schema change.

- **2026-10-28 afternoon (lessons audit + Timmy and device-link tracking, Claude Code)** — Two days before Heme/Endo Exam 1.
  `hubs/heme-endo-exam1`, same ids and answer positions, explanations only: report #32 (`th-r-nis`: "an ATP dependent
  symporter... wouldn't it directly use ATP?"): `th-nis` no longer calls NIS "ATP-dependent active transport", and both say NIS
  doesn't split ATP, the Na+/K+-ATPase keeps the sodium gradient (the notes' "ultimately ATP-dependent" stays; narration unchanged);
  `th-r-2s-1`, `pa-insulin-fat`, `gr-ghrelin`, `pa-liver-glut` and `h1-enzyme-linked` now answer their favorite wrong choice.
  **Tracking** (no schema change, `feature_events`): `widget/pet.js` `pet:tap-hub|dashboard`, `pet:joke|checkup|tip` and a daily
  `state:pet-hp=<band>`; `widget/ranks.js` (Stats → Link my devices) `link:code|linked|fail`; `widget/linkask.js` `link-ask:fail`;
  `widget/clicks.js` exposes `shClicks.flush()`, called after `linked` in both flows (the event was lost to the reload, so the
  prompt's outcome was invisible). `sw.js` -> `sh-v44`. `LESSONS.md` refreshed (names, device links and Timmy Tooth numbers).
  **A feature that reloads or leaves the page: call `shClicks.flush()` after its last `shTrack`.**
- **2026-10-28 (patient pictures and arcade art in Heme & Endo, Special Patient Care arcade art, Claude Code)** — More of Sam's Argon art.
  **Heme & Endo patient pictures**: `CASE_IMG` + `caseImgHTML(q)` (the stub is now real, Occlusion's pattern with `<img>`): a
  question's `pimg:[keys]` draws painted illustrations inside its Patient Box, labeled as illustrations, not patient images.
  Three so far (`img/case-*.webp`): `ad-addison-gums` (pigmented attached gingiva), `gr-acro-dental` (face and hands),
  `cs-asthma-bone` (moon face, central obesity, thin bruised forearm skin). Each shows only findings its box already lists; the
  arcade already skips `pimg` questions. **Special Patient Care arcade**: Sparks After Hours now draws a painted operatory
  (`img/after-hours-escape.webp`, 1280x714 drawn to 800x450) with every hotspot measured onto its props (`SPC_SKIN.escape.scene`:
  panoramic viewer dark until solved, charting computer, consent form clipboard, padlocked supply drawer, visual-schedule poster
  the curing light reveals, sink and mirror, door + keypad; the clock hand rides the painted clock); the hero banner, the Sparks
  Superstar stage (`smile.bg`) and the escape/Superstar lobby tiles (`thumbImg`) are painted too; the other four tiles keep their
  icon tiles. **Perio**: Mind the Pocket's lobby tile is painted (`img/thumb-gap.webp`), so every Perio tile is now art.
  **Heme & Endo arcade**: Endo Lab Escape draws a painted lab (`img/lab-escape.webp`, hotspots measured onto the microscope with
  its lamp off until solved, the analyzer, the lab report clipboard, the padlocked reagent cabinet, the starch paper on the
  corkboard, the eyewash sink and mirror, the door keypad; the clock hand rides the painted clock), replacing the drawn room; the
  hero banner, the Golden Gland stage (`smile.bg`) and the escape/Golden Gland lobby tiles are painted. About page,
  `sw.js` -> `sh-v43`. No schema change.

- **2026-10-28 (Heme & Endo Exam 1: in-class review, official counts, High Likelihood tags, Claude Code)** — From the 10/28 review
  PollEv doc (Drive: Heme/Endo Exam 1, "Endocrine Exam 1 PollEv"; its comments are classmates' notes on what the professors said):
  20 items `rv-*`, new src `review` ("In-class review", Daily drill high-yield), stems and keys as given, typos fixed, explanations
  from the class notes. `rv-sst`'s last choice now reads "stimulated by ... amino acids and fatty acids" (the doc's "inhibited by ...
  ketoacids" would have made a second choice untrue). Sam gave the exam's count per lecture (6/6/6/8/6/5/3/5/4/6) and said the
  four Patient Box questions are all on L4: `EXAM_COUNTS` = `MOCK_BLUEPRINT`, `MOCK_PBOX = { thyroid:4 }` (the mock takes Patient Box
  items only there), `EXAM_INFO` line; 8 new L4 Patient Box cases (`th-pb-*`, two shared-patient pairs). Bank 582 -> 610.
  **High Likelihood Exam Question** tag: `LIKELY_TOPICS` (as many topics per lecture as exam questions, ranked by review + hints,
  each with 2-4 question ids, 171 tagged) sets `q.likely`; `likelyChip()` in the bank and drill (not the mock); bank sort menu
  (`STATE.ui.qsort`: bank order / High likelihood first / High likelihood only); Exam Hints opens with a folded "Most likely
  questions" list (`likelyHTML()`). About page. No notes text changed, so no narration regenerated. No schema change.

- **2026-10-28 (arcade art, round 2: Showdown stages and painted lobby pictures, Claude Code)** — More of Sam's Argon art.
  **Showdown stage**: a skin's `board.bg` paints a stage behind the quiz board (`.sg-stage` in `widget/games.css`, dimmed so the
  tiles stay readable): Occlusion's Freeway Showdown stage, Perio's Pocket Showdown stage (`img/showdown-stage.webp`).
  **Lobby pictures** are now painted (`thumbImg(f)` in each hub, files in `img/`): Occlusion Cusp Sort, Freeway Showdown,
  Mind the Gap and Cross-Section; Perio Pocket Showdown, Cross-Section and Calculus Crusher (each Showdown picture is
  cropped from its stage). Perio's Mind the Pocket keeps its drawn picture until it has art. The pictures now fill Perio's
  wider frames (`preserveAspectRatio` slice; they sat between side bars). `sw.js` -> `sh-v42`. No schema change.

- **2026-10-28 (Special Patient Care check-in and archiving wait for the exam to close, Claude Code)** — Sam: no check-in until the exam
  closes. The exam is due Fri Nov 13 at 11:59 pm, so its `HUBS` entry sets `checkinHour:24, promptHour:24` (`setHours(24)` = midnight
  starting Sat Nov 14): no "Check in" button at 8 am and no pop-up at 10 pm on the due date. The card also stays live until then:
  new optional per-exam `archiveHour` (dashboard `archiveAt()`, and `widget/v3.js`'s "This hub is archived" notice, read from the
  hub's `SH_EXPORT.exams`), 24 for this exam in both places, so the Open button doesn't disappear at 10 pm while the exam is still
  open. `sw.js` -> `sh-v41`. No schema change.

- **2026-10-28 (new hub: Special Patient Care, Claude Code)** — `hubs/special-patient-care/` for Dr. Mitchell's Special Patient
  Care exam (Canvas, opens Fri Nov 6 12:00 am, due Fri Nov 13 11:59 pm; format not announced, so the bank is multiple choice,
  true/false and matching, plus the two-statement and numbered-statement items the standing rules require). Sources (Drive:
  Special Patient Care/hubs): the recorded lectures and handouts for the introduction, behavior guidance, Down syndrome, cerebral
  palsy, syndromes and prevention; the autism module's pages (what is autism, characteristics, stimming, meltdowns, sensory
  defensiveness, dental conditions, appointment prep, operatory, communication, the successful appointment, advanced treatment);
  and the mental illness reading (SAID Module 9) with Dr. Mitchell's video introduction. No graded quiz or exam content used.
  Eight units (`intro`, `behavior`, `down`, `cp`, `syndromes`, `autism`, `prevention`, `mental`), all `status:'taught'`. Built on
  the Heme & Endo Exam 1 engine (Home first, why for every choice, retries, sync, drill) with a new palette ("Sparks": clinic teal
  and coral; DM Serif Text / Source Sans 3 / JetBrains Mono). **No figures or animations** (Sam): `FIGS`/`ANIMA` are empty stubs,
  no diagram review, and the arcade has no drawn art (lobby tiles are an icon and a word; the escape room uses the shared operatory
  with this hub's labels and story). 452 questions (src `rec` / `module` / `reading`), each MCQ with a why for every choice written
  inline (`mq(id, lec, src, stem, [[choice, why], ...], ex)`, so `QUESTION_WHY` is empty); per unit 5 two-statement, 8
  true/false, 3 numbered-statement and 1-2 matching; correct answer longest in 34%; true/false 53% True; numbered keys 6/7/5/6.
  Notes at two levels with Kokoro narration for all eight, 41 exam hints quoted from the recordings (plus the autism module's and
  the reading's own notes), cram sheet, Review (each unit's note tables plus written ones, and a Side by side tab: Down syndrome vs
  CP vs autism, look-alike pairs), a 50-question / 75-minute mock (`MOCK_BLUEPRINT`; no official counts), and the Sparks Arcade
  (`SPC_SKIN`, `[data-sg-skin="spc"]`: Chairside Sort, Chart Showdown, Sparks After Hours, Say It Once, Sparks Superstar,
  Cross-Check). Home counts down to the window opening, then to the due time (`EXAM_DATE`/`EXAM_END`); `SH_EXPORT.exams` and the
  dashboard's `HUBS` use the due date, so the card archives itself at 10 pm on Nov 13. Dashboard `HUBS`/`CLASSES` (`spc`, on the
  free `genetics` ring), `ARCADES`, `HUB_LABEL`/`HUB_RING`; `review/` and `tools/publish-recap.js` labels; `widget/ranks.js` name and
  medal ribbons (the shared tooth emblem); `sw.js` -> `sh-v40`; About page (Home, arcade table). The build sources and script stay
  in the session (the hub is a single file: edit it directly from here on). No schema change.

- **2026-10-28 (admin Surveys tab: exam check-ins load the first time, Claude Code)** — Sam: the Surveys tab often said
  "Couldn't load exam check-ins (migration_v23)" and worked after a refresh. `get_exam_debriefs` hit the API's 3 s anon
  timeout on a cold load (~2.5 s warm): three subqueries per check-in, and `activity_pings` had no `(visitor_id, hub)` index.
  `migration_v42.sql` (**applied via the connector**) adds `activity_pings_visitor_hub_idx` and counts each (hub, person)
  pair once: ~100 ms, same rows and numbers (checked against the old query). `supabase/schema.sql` updated. No site change.

- **2026-10-28 (tablet-width top bar, Claude Code)** — Sam spotted the Heme & Endo top bar cut off on a tablet. Between about
  561 and 1000 px every hub's one-row top bar overflowed (Heme & Endo, Occlusion, Perio and the archived three): the Arcade (and
  sometimes Review) tab was cut off, the theme button sat off screen and the page scrolled sideways. One rule in `widget/v3.css`
  (`@media (min-width:561px) and (max-width:1000px)`, scoped to `header.hub-header`) wraps the mode tabs onto their own
  full-width row under the title, as phones already do (all labels shown). Checked at 561-1001 px in all six hubs: nothing past
  the edge, no sideways scroll; at 1001 px and up the one-row bar is unchanged. `sw.js` -> `sh-v38`. No hub file changed.

- **2026-10-28 (numbered-statement rule, Occlusion items, the boss moves to the top bar, Claude Code)** — Sam: add the "which
  statements are true" questions to Occlusion and keep it as a rule; move the bosses widget, which blocked questions. **Rule**
  (above, `CLAUDE.md` → "Numbered-statement questions"): `tools/ci/smoke.js` adds `numbered: 2` to `FORMAT_MIN` and checks each
  numbered item's stem lines, choice wording and canonical order. **Occlusion**: new helper `nums()` (with `numList()`,
  `numLabel()`) builds the stem, sorted combinations, key and "why each choice" lines from one reason per statement;
  `choiceOrder()` keeps them in order, `arcadeQ` skips them, the bank's format filter gains "Numbered statements". 16 items
  written from the notes (`rv-num-1..3`, `an-num-1..2`, `fn-num-1..2`, `cc-num-1..2`, `ap-num-1..2`, `in-num-1..5`; keys
  spread 3/5/4/4 over the four positions); bank 510 -> 526. **Heme & Endo**: `th-num-2`, `h2-num-2`, `ca-num-2` (the three lectures that had one);
  bank 579 -> 582. **Plaque boss** (`widget/eggs.js` `bossDock()`, `widget/v3.css` `.sh-egg-boss.is-docked`): it now docks as a
  solid band along the bottom edge of the hub's sticky `header.hub-header` (`fitDock()` bleeds it to the bar's edges and flush
  with its bottom border, from the header's own padding, so nothing scrolls through behind it; icon, name, HP bar, HP, the line it
  says on desktop, ×; hit numbers stay inside the band) instead of a card floating over the bottom of the screen, where it covered answer choices (53 of 89 Occlusion students who met
  one hid it). A page without a sticky header still floats it. About page, `sw.js` -> `sh-v37`. No schema change.
  **Perio Project: add `nums()` and numbered items before S6 goes taught.**

- **2026-10-27 evening (lessons audit, Claude Code)** — Heme & Endo Exam 1's first day (39 people, 29 h). `hubs/heme-endo-exam1`:
  `h1-mag` ("Dr. Herr said he would NOT expect you to be able to:") removed after two reports on its first afternoon (#30, #31: "not
  an exam-style question"; the notes already say the pars distalis stains aren't tested; bank 580 -> 579); `h1-downreg`'s explanation
  and why line say both routes start in an endosome and the lysosome decides it (sequestration picked 12 of 26); `gr-muscle`'s stem
  no longer quotes the lecture ("Apart from its effects on growth, which pairing of GH effects is correct?", same choices) and its
  explanation says GH opposes insulin. `hubs/perio`: `q4-06` had two right answers (the S204SD9 *is* the posterior sickle, per the
  hub's notes), so "Sickle scaler" is now "H6/7 sickle scaler" (same position; older `question_choices` rows for that slot mean the old
  text); `q3-04`'s explanation says why "likelihood of retaining the tooth" (Miller & McEntire) sounds like McGuire & Nunn's
  maintainability. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed (new lessons: misses re-asked a day
  later; questions about what the professor said; a choice that contains the key; the Plaque Boss gets hidden, never switched off).
  **Perio Project: carry the `q4-06` and `q3-04` changes into the split sources.**

- **2026-10-27 (every hub opens on a Home page, Claude Code)** — Sam: "build a home page into each hub as a rule going forward".
  New standing rule (above, and `CLAUDE.md`). **Occlusion** gets a Home mode (first tab, default, `home/dashboard`): the final's
  countdown (days; `FINAL_TIME`/`FINAL_CLOSES` are null until the time is announced, then it counts hours and minutes), chips,
  a ring for the final's questions right on the latest try, a "more lectures are coming" note, quick start (practice, drill,
  notes, the 20-question mock), the exam card (moved from Compendium, along with the quick-start row; the Timmy Time card stays
  on Compendium), Where to next (final lectures first, then midterm misses), progress by lecture grouped "On the final" /
  "Midterm lectures", `COURSE_DATES` (L1-L6, the midterm, the final), the last two weeks and links. **Perio**: Compendium's Course
  Home is now the Home mode (same content, plus Where to next and the last two weeks); `course-info` is gone from
  `COMPENDIUM_VIEWS` and old saved views fall back to Lecture Notes. Returning visitors open on Home once (`STATE.ui.homeOn`).
  **Fix**: #173's `finalOn` flag sat in Occlusion's `defaultState()`, which `loadState()` merges into saved state, so the
  switch to the final never ran for returning visitors; it's out of the defaults now (visitors who opened the hub since
  then already saved the flag). Heme & Endo's Home now redraws after a sync. Time on Perio's Course Home was logged as
  `compendium/course-info`; from today it's `home/dashboard`. About page, `sw.js` -> `sh-v36`. No schema change.

- **2026-10-27 (Occlusion L6: four animated diagrams, Claude Code)** — From L6's diagram review (Sam approved all four):
  `mounterr` (the maxillary cast at the facebow position or too far back / high / forward / low; in the mouth the most anterior
  or most posterior teeth hit, the slide's rule), `hingearc` (one model, `hgModel`: the patient's arc about PHA vs the articulator's
  about an AHA 5 mm off; a thicker CR record leaves the molar farther off, shown magnified with no number; "restore at this
  vertical" and "kinematic facebow" zero it), `scirec` (protrusive vs lateral reading vs arbitrary 30°/20°; a crown built at the
  setting discludes or hits when the patient protrudes along their real eminence; the lateral reading is drawn 8° steeper only to
  show "steeper") and `bennett` (the orbiting path bows medially, so a record at 3-5 mm reads a larger angle than at 7-10 mm, and
  the fossa built from the smaller one is too narrow). Built in `tools/figures/occlusion/anima/`; placed with `FIG_PLACE.instruments`
  in `od.js` (FIG_PLACE lives in the generated kit block: edit it there, not in the hub) and a Review `figs` section. About page.

- **2026-10-27 (Heme & Endo Exam 1: L3, L4, L9, L10 from their recordings, Claude Code)** — Sam posted the missing
  recordings to the Drive Heme/Endo folder: `Growth_Hormone.mp3` and `Thyroid_Hormone.mp3` (transcribed in-session with
  faster-whisper small.en) and the 10/27 Zoom VTTs (`GMT20261027-180303` = L9, `-183636` = L10). **L3's recording is Dr.
  Madison giving the lecture** (he signs off for male reproductive physiology; this year's slides are Dr. Galin's) and both
  mp3s look like another year's run (morning times), so L3's notes say so and quote "the recording", not Dr. Galin. All four
  go to `status:'taught'`: both reading levels rewritten (status banners gone; where recording and slides differ the notes
  give both: GH's sleep pulses REM vs deep sleep, NIS 20-50x vs "tens to hundreds", zone shares 15/65-80/10 vs the slides'
  ranges; Dr. Herr calling the somatostatin cell "gamma" is noted, the table keeps delta) and all eight mp3s regenerated.
  `NOTE_TABLES` rebuilt for the four lectures (growth gains a GH-by-tissue table). 72 new questions (`gr-r-*`, `th-r-*`,
  `h2-r-*`, `ca-r-*`, src `rec`: 8 two-statement, 16 true/false, 1 ordering; each MCQ with its `QUESTION_WHY` row); bank
  508 → 580. `h2-dual` and `h2-spongio` now quote Dr. Herr ("the question that's going to be on your exam"; spongiocytes
  "the thing to remember for the exam") and carry src `rec`. 36 exam hints, cram lines, `EXAM_INFO` and `COURSE_DATES` gain
  the Wed 10/28 1:00-1:50 review with Dr. Galin and Dr. Madison. Figures (`tools/figures/heme-endo-exam1`, rebuilt): thyroid
  adds sodium riding in through NIS, the TSH receptor with its NADPH → H2O2 supply, the deiodinases and a **Low iodide**
  case; calcium adds **High phosphate (soda)** and **Menopause** cases, estrogen's brake in the panel, the recording's
  wording on the kidney exception and the osteoblast's PTH receptor; adrenal adds a **Dual blood supply** view, the three
  arterial sources and the T1-L2 preganglionic fiber; the pituitary's GHRH row adds Gs/Gi and somatostatin feedback.
  About page (Diagrams). No schema change.

- **2026-10-27 (arcade art: painted rooms, banners and stages, Claude Code)** — More of Sam's Argon art. **Perio Clinic Escape**
  now draws `hubs/perio/img/clinic-escape.webp` (stretched to the 800x450 scene) with every hotspot measured onto the painted
  props (`PERIO_SKIN.escape.scene`): panoramic viewer (dark "VIEWER OFF" overlay until solved), charting computer, perio chart on
  the clipboard, instrument cassette, typodont (the tablets stain its digit pink), corkboard, door; the clock hand rides the
  painted clock. The drawn `perioTooth` room is gone. **Arcade hero banners** (`img/arcade-hero.webp`, `.ar-hero` background in
  both hubs). **Million-Dollar Smile**: a skin's `smile.bg` paints the marquee with a stage picture (`img/smile-stage.webp`,
  `.ms-banner--art`) instead of the drawn grin; `smile.art()` (Heme & Endo's gland) still works, and `bg` wins if both are set.
  **Lobby thumbnails** for Smile and the escape room are painted too (`img/thumb-smile.webp`, `img/thumb-escape.webp`). A new
  backdrop means re-measuring every `api.spot()` rectangle. `sw.js` -> `sh-v35`. No schema change.

- **2026-10-27 (Occlusion switches to the final: L6 Occlusal Instrumentation, Claude Code)** — Sam: "Occlusion can now
  switch to final exam." The final (Thu Nov 19) is not comprehensive: Dr. Givan's lectures from 10/22 on, building on the
  midterm material; its time and format aren't announced yet (update `EXAM_INFO` and the mock clock when they are). New
  **L6 `instruments`**, "Occlusal Instrumentation: Articulators, Facebows and Records" (`exam:'final'`; L1-L5 now carry
  `exam:'midterm'`), from the Drive Final folder (Occ Lec4 slides + handout, the 10/22 lecture capture): notes at both levels
  and both mp3s (`audio/instruments-full.mp3`, 27.6 min; `-plain`, 9.3 min), 92 questions (`in-*`, `cs-in-*` on 3 new Patient
  Box cases `incrown`/`inrehab`/`inhigh`, 8 two-statement, 10 true/false (6 True), 1 select-all, 1 ordering, 2 EXCEPT; each with
  its why; correct answer longest in 26% of L6's MCQs), 17 exam hints quoted from the recording (two de-emphasized: the slide's
  "Not on test" Handulator, and balanced-denture SCI), a cram list, a Review tab (articulator kinds, the records, where mounting
  errors show, MIP record rules, Dr. Givan's selection table, 3 processes) and 2 sort sets. Bank 418 → 510. **The hub now leans to
  the final**: `isFinalLec()` / `lecOrder()`; notes and hints list the final's lectures first under "Final" / "Midterm" labels;
  the bank's lecture filter gains "For the final" (default) and "Midterm lectures"; the quick-start count, Daily Drill pool and
  mock (`MOCK_BLUEPRINT = { instruments:20 }`, clock at the midterm's 80 s a question) use the final's lectures only; the exam
  card and hints banner describe the final. Returning visitors are moved once (`STATE.ui.finalOn`: L6, bank scope final, the
  closed-card flag and any old mock cleared). Titles: "Occlusion Final Hub" (dashboard card, `<title>`, ribbon); recap label
  "Occlusion". The midterm Timmy Time episode stays (dashboard row now "The midterm review"). **Each new final lecture: add it
  with `exam:'final'` and to `MOCK_BLUEPRINT`, and update `EXAM_INFO`.** Diagram review for L6 still to be put to Sam.

- **2026-10-27 (Heme & Endo Exam 1: six animated diagrams, Claude Code)** — Sam: "Yes to all animations." Built with the
  anima skill in `tools/figures/heme-endo-exam1/` (`build.mjs` fills the hub's `anima:js` / `anima:css` markers; `--check`,
  `--preview`), each from the hub's own notes: **beta** (L5: glucose → GLUT2 → ATP → K-ATP closes → depolarization → Ca2+ →
  insulin, low glucose and sulfonylurea toggles), **thyroid** (L4: the seven synthesis steps in a follicular cell; methimazole/PTU
  and an iodide load show where they block), **hpa** (L2/L6/L7: normal, Addison's, Cushing's disease, adrenal tumor, prednisone
  on / stopped suddenly / tapered; feedback loops, α-MSH on the skin, an HTML lab panel that reads primary vs secondary),
  **calcium** (L10: calcium falls / rises / primary hyperparathyroidism; CaSR on chief cells, PTH on kidney and bone, 1α- vs
  24-hydroxylase, calcitriol in the enterocyte, calcitonin on osteoclasts), **pituitary** (L1/L2: the portal route with a
  releasing-hormone picker lighting its target cell, and the long-axon route with Herring bodies and pituicytes) and **adrenal**
  (L6/L9: zones with their shares, cortex-to-medulla blood flow, a stress response turning on PNMT). In the notes via `FIG_PLACE`
  (each at the end of the section it explains, both levels; `data-sh-noread`, so narration is unchanged) and in Review (a `figs`
  section in each lecture's tab). Levels are qualitative (no lab values); `calcium` reuses the lab-panel CSS `hpa` defines. No
  SVG ids, so copies don't clash. About page (Diagrams). No questions or notes text changed; no schema change.

- **2026-10-27 (new hub: Heme & Endo Exam 1, with its own Home page, Claude Code)** — `hubs/heme-endo-exam1/` for DENT 2160
  Hematology & Endocrinology Exam 1 (Fri Oct 30, 8:00-9:30 am dental, 55 MCQ, in person on Canvas with LockDown Browser,
  lectures 1-10), built on the Occlusion engine (without its figure kit: `FIGS`/`ANIMA` are empty stubs) with a new palette
  ("H&E"; Young Serif / Atkinson Hyperlegible / Spline Sans Mono). Sources (Drive, Heme/Endo Exam 1 folder): every slide deck,
  the 10/20 (L1, L2) and 10/23 (L5-L8) recordings, transcribed in-session. **The 10/21 recordings (L3 Growth, L4 Thyroid) have
  no sound**, so those two and L9/L10 (10/27) are `status:'slides'` ("Slides only"): when their recordings arrive, flip to
  `taught`, add exam hints, rewrite the notes and regenerate both mp3s. **Not used, by the syllabus rule:** last year's D3
  "Endocrinology Exam 1" study doc and D3 Anki deck (they reproduce last year's graded quizzes and crossword), this year's
  Quizzes 1-2 (open until Oct 29), and the password-protected Quizlet folder (quizlet.com blocks this container). 508 questions
  (src `slides` / `rec` / `class` = the professors' own in-class cases, rewritten / `hub`), each with its why; 49 two-statement,
  80 true/false (46 True) and 17 **numbered-statement** items (`fmt:'numbered'`, "Which statements are true? 1-4", combinations
  in a fixed canonical order via `choiceOrder`, keys spread over all four positions; Question Bank format filter), Patient Box
  cases (Dr. Fasinu's lab-value style), EXCEPT items; correct answer longest in 19%. Notes at two levels with Kokoro narration
  for all 10, 36 exam hints quoted from the recordings, cram sheet, Review (each lecture's own note tables via `NOTE_TABLES`
  plus written tables, a Side by side tab: reading labs, which receptor, look-alikes), a 55-question / 90-minute mock.
  **Home mode** (Sam: "its own dashboard/homepage"): a fourth mode, the default, `renderHome()`: live countdown, exam facts,
  the quiz-deadline alert (until `QUIZ_DUE`), a readiness ring (right on latest try), quick start, the exam card, Where to next
  (weakest lecture, misses, unstarted lecture), progress by lecture, course timeline (`COURSE_DATES`), last 14 days. Section
  `home/dashboard`. `widget/tour.js` gains Home steps (skipped in hubs without `#panel-home`). Arcade: the **Feedback Loop
  Arcade** with its own skin (`ENDO_SKIN`, `[data-sg-skin="endo"]`): Axis Showdown (glass slides stained purple/pink; Hormone
  Surge, Final Feedback), Endo Lab Escape (drawn endocrine lab; Lugol's iodine turns starch paper blue-black), Fill the Receptor,
  The Golden Gland (a thyroid that turns gold), Cross-Stain, Feedback Sort. `widget/games.js` lets a skin draw the quiz-ladder
  marquee (`skin.smile.art`, `winTitle`). Dashboard `HUBS` (`checkinHour:10`: the exam ends at 9:30), new class `hemeendo` on a
  new `endo` ring (`--c-endo`), `ARCADES`; `review/` and `tools/publish-recap.js` labels; `widget/ranks.js` name and medal;
  `sw.js` -> `sh-v34`; About page (Home page, numbered statements, the arcade table); `assets/og-heme-endo-exam1.png`. Build sources and
  the build script stay in the session (the hub is a single file; edit it directly from here on). **Diagram review still to be
  put to Sam.** No schema change.

- **2026-10-22 (Settings → Extras: every optional feature has its own switch, Claude Code)** — Sam asked to be able to turn the
  bosses, nukes, Tooth Fairy, rank-up animations and the rest off one by one, plus one button that turns everything optional off.
  Each hub's Settings panel (`EXTRAS` / `extrasHTML()` in `widget/v3.js`) and the dashboard's Settings (`EXTRAS` in `index.html`;
  **keep the two lists in step**) now end with an **Extras** section: **All on / All off** at the top (lit only when every extra
  matches), then one row per feature, each its own localStorage key (default `on`): `sh_pref_boss` (Plaque bosses), `sh_pref_fairy`,
  `sh_pref_probe` (Golden Probe), `sh_pref_arch` (Full Arch), `sh_pref_nuke` (`on` | `mine` = no classmates' strikes | `off` = no
  unlock at all; replaces `sh_pref_nuke_alerts`), `sh_pref_celebrate` (rank-up cutscene, level-up, trophy and medal cards in
  `widget/ranks.js`; the mock results card goes quiet), `sh_pref_cheers` (confetti + toast every 5 in a row), `sh_pref_flame`,
  `sh_pref_fx` (Answer animations: `widget/fx.js` treats it like reduced motion, so marks stay), `sh_pref_pet` (unchanged) and
  `sh_pref_eggs`, now **"Hidden secrets"**: only the eggs without a switch of their own (holidays, magic words, TIMMY, Night Owl,
  professor quotes, root canal, Cavity Search, Floss Chain). `widget/eggs.js` gates the four with `feat(k)` instead of
  `ok()`. One-time carry-over (`sh_pref_extras_v`): Surprises off sets the six keys it used to cover off; nuke alerts off becomes
  `mine`. Turning a feature off hides it at once (boss, arch, nuke badge, flame). `widget/clicks.js` snapshots the new keys. About
  page, `sw.js` -> `sh-v33`. No schema change. **A new optional feature: give it a key and a row in both `EXTRAS` lists.**

- **2026-10-22 (rule: every lecture gets two-statement and true/false questions, Claude Code)** — Sam: follow the
  Occlusion question formats for the upcoming lectures. New standing rule (above, and `CLAUDE.md`). `tools/ci/smoke.js`
  now fails a taught lecture with fewer than 3 two-statement or 5 true/false items (`FORMAT_MIN`; exempt: archived hubs and
  perio S1-S5 via `FORMAT_GRANDFATHERED`), a two-statement item whose choices or "1. / 2." stem lines differ from the
  standard, a true/false item not choosing True / False, and a hub whose true/false keys are under 35% or over 65% True.
  No site change.

- **2026-10-21 night (MSK Exam 4 and PCD Exam 3 check-ins closed, cards off the dashboard, Claude Code)** — Sam: close both
  check-ins (`checkinClosed:true` on each exam in `HUBS`) and take both archived cards off the dashboard now
  (`hideCardOn:"2026-10-21"`, ahead of the usual `CARD_DAYS`). Answers already sent stay on `review/`. The hub pages
  stay up; retrospective and folder cleanup are still manual.

- **2026-10-22 (GI and PCD cards off the dashboard, Claude Code)** — Sam: take the MSK Exam 4 (GI & MSK) and PCD
  Exam 3 cards off now. Both were already archived; `hideCardOn:"2026-10-22"` on their `HUBS` entries removes the
  archived cards today instead of Oct 26 / Oct 25. Hub pages, arcade high scores and check-in data are unchanged.

- **2026-10-22 (Occlusion: two-statement and true/false questions, Claude Code)** — Sam asked for both formats in
  `hubs/occlusion`. New helpers `two(id, lec, src, s1, s2, t1, t2, ex, r1, r2)` (`fmt:'2stmt'`, the four fixed choices in
  `TWO_CHOICES`, answer computed from t1/t2, its "why each choice" lines built from one reason per statement) and
  `tf(id, lec, src, statement, isTrue, ex, whyTrue, whyFalse)` (`fmt:'tf'`, stem "True or false: …", choices True/False);
  both set `q.why` themselves instead of a `QUESTION_WHY` row. `choiceOrder(q)` keeps their choices unshuffled in the bank,
  drill, Weak Spots and the mock; the arcade skips them (`arcadeQ`); `.qcard-stem` keeps line breaks. 27 two-statement and
  42 true/false items written from the L1-L5 notes (`*-2s-*`, `*-tf-*`; keys balanced, 21 true / 21 false); bank 349 → 418.
  Question Bank gains a **format filter** (`STATE.ui.qfmt`: two statements, true or false, EXCEPT / NOT, Patient Box, select
  all). About page updated. No notes text changed, so no narration or podcast rebuild.

- **2026-10-21 evening (perio midterm check-in closed, Claude Code)** — Sam: the Periodontology midterm's check-in is closed

- **2026-10-21 evening (perio midterm and PCD Exam 3 check-ins closed, Claude Code)** — Sam: the Periodontology midterm's and PCD Exam 3's check-ins are closed
  (`checkinClosed:true` on that exam in `HUBS`; `pastExams()` skips it, so no card button and no pop-up). The perio final's
  check-in will still open on Nov 19. Answers already sent (perio 28, PCD 10) stay on `review/`.

- **2026-10-21 evening (exam check-in changes, Claude Code, #160-#162, #164)** — Sam: the Occlusion midterm check-in opened at 7 pm
  (`checkinHour`/`promptHour` 19). An exam in `HUBS` can carry `extraQs`, inserted before the closing text question
  (`debriefQs()`); Occlusion's midterm asks 1-5 `diagrams` ("How helpful were the hub's diagrams?") and `pbox_img` (the
  Patient Box questions with pictures), shown as averages on `review/`. **Every check-in's last question is now "Anything the
  hub could do better?"** (still saved as `missed`; before today it asked what topics or formats the hub missed). About page
  and `/lessons-audit` updated. No schema change.

- **2026-10-21 (Try it again in every hub's Question Bank, Claude Code)** — Sam: apply #156's missed-question retry
  everywhere. `pcd-exam3`, `msk-exam4` and `msk-exam3` (same engine as Occlusion) get the identical change: `RETRY_GAP`,
  `list.__retry` in `renderBank`, the hook at the end of `finishCard`, `qCardHTML(q, {retry:true})` and the CSS. **Perio**
  (its own engine): `markMissed` hands the miss to `list.__retry` (set in `renderQuestionBank`), which renders `qCardHTML(q)`,
  adds `is-retry` and the chip; a copy counts as pending until its explanation is shown, and a second click listener counts
  `bank:retry-right` / `-missed` once (recall cards when graded); new `cycle` icon. The chip wraps on phones in every hub.
  Tested in all five: miss, retry 5 cards down; miss the retry, another; right, none. About page now says every hub.
  **A new hub: copy the retry from `occlusion`. Perio and MSK Projects: carry it into the split sources.**

- **2026-10-21 ("Is this your other device?", Claude Code)** — Sam: 16 ids had a custom name but only 13 names (Dr Winters
  on 3, LeSunshine on 2), likely the same people on unlinked devices. New `widget/linkask.js` (loaded by v3.js and the dashboard):
  saving a name another, unlinked id already uses keeps the name and opens a card ("Yes, link them" → get a code or enter one
  right there, same RPCs as Stats → Link my devices; "No, that's someone else", remembered per name in `sh_link_ask_no`; "Not
  now", 3 days in `sh_link_ask_later`). A device whose saved name is shared is also asked once a day on load (`sh_link_ask_day`),
  never during a mock, the tour, a survey or the Inbox. `migration_v41.sql` (**applied via the connector**): public
  `name_shared(p_visitor, p_name)` (case-insensitive, follows `visitor_links`). The random class names aren't checked (computing
  `anon_name` for everyone is too slow). Tracked as `link-ask:shown|yes|no|later|code|linked`. About page, CI syntax check,
  `sw.js` -> `sh-v32`.

- **2026-10-21 afternoon (lessons audit: horizontal envelope matches the slide, Claude Code)** — Occlusion exam day.
  Suggestion #11: the horizontal envelope of motion was upside down and mirrored compared with Dr. Givan's slide 71. Codex's
  #155 swapped left and right in the built hub only (CR stayed at the bottom, and a rebuild would revert it); now `envHoriz`
  (`tools/figures/occlusion/od.js`) and the envelope tracer's horizontal tab (`anima/envelope.mjs`) draw CR at the top,
  maximum protrusion at the bottom and the patient's left on your right, as the slide does, rebuilt with `build.mjs` (same
  A-D letters, so `fig-hor-b`/`fig-hor-d` are unchanged). `cs-pro-incline`'s key now reads "Distal inclines of the maxillary
  palatal cusps against mesial inclines of the mandibular cusps" (same position; 8/20 since this morning's explanation fix),
  with its explanation and `QUESTION_WHY` row. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed
  (first read of the guided tours: 5 students took one on exam day).
  **Missed it? Try it again** (suggestion #10, at Sam's request): in the Occlusion Question Bank a missed question comes back
  as a fresh card `RETRY_GAP` (5) cards further down (`list.__retry` in `renderBank`, called from `finishCard`; `qCardHTML(q,
  {retry:true})` draws a dashed card with a "Try it again" chip). Missed again, it comes back again; one pending retry per
  question; never inside a patient's case set. Answers count as normal bank answers (ctx `bank`); tracked as
  `bank:retry-shown` / `bank:retry-right` / `bank:retry-missed`. About page updated. Perio's bank doesn't have it yet.

- **2026-10-21 (arcade skins: every hub's games look like that hub, Claude Code)** — Sam: copy the new games to Perio but not as a
  copy-paste; same ideas, visually unique, and the same for every new hub (now a standing rule in `CLAUDE.md` → "Every hub's arcade
  looks like that hub"). `widget/games.js` takes `C.skin` (`{ id, board, cloze, escape }`) and tags each game root
  `data-sg-skin="<id>"`. The escape room's plain room is now a set of parts (`BASE_PARTS`: room, clock, decor, xray, poster, door,
  monitor, chair, chart, cabinet, drawer, sink) that a skin replaces whole (`escape.scene(api)`) or in part (`escape.parts`), with
  helpers `api.spot / hand / digit / check / keypad / padlock / slotColor / digitOf`; spot labels, flavor text, the item and its
  reveal, the intro and the wager-round names come from the skin. **Perio** (`PERIO_SKIN` + `[data-sg-skin="perio"]` CSS): Perio Clinic
  Escape (panoramic film, charting computer, perio chart on the bracket table, a sealed instrument cassette holding disclosing tablets
  that stain the hidden digit onto a typodont, corkboard hint, frosted PERIO door), Pocket Showdown drawn as a perio chart whose
  teeth bleed on a miss (Deep Pocket, Final Probe), Mind the Pocket with a UNC-15 probe as its clock. **Occlusion** (`OCCL_SKIN`): Lab
  Escape (an occlusion lab; articulating paper from the drawer marks the digit on casts mounted on an articulator), articulating-paper
  board strips (Centric Double, Final Contact). New lobby thumbnails per hub. **Million-Dollar Smile art redrawn** (Sam: "terrible"): a
  quiz-show marquee above the question (chasing bulbs, `grinSVG()`: lips, gums, two rows of teeth, a gold tooth that sparkles from
  rung 6), colored by `skin.smile`; Perio's thumbnail is a spotlit studio stage, Occlusion's a pixel-art grin. **Painted escape rooms**: Sam makes backdrops with an image model
  (Argon); Occlusion's Lab Escape now draws `hubs/occlusion/img/lab-escape.webp` (1024x572, stretched to the 800x450 scene) with
  invisible hotspots placed over the painted props (`OCCL_SKIN.escape.scene`; a dark overlay switches the view box and computer off
  until solved, a red countdown hand rides the painted clock). A new backdrop means re-measuring every `api.spot()` rectangle on a grid
  overlay. Perio's Clinic Escape got its own painted backdrop on 2026-10-27 (entry above). Game-over cards in the shared games scroll instead of
  squashing the missed list. Dashboard `ARCADES` and About page names updated. **Perio Project: carry `PERIO_SKIN` and its CSS into the split sources.**

- **2026-10-21 (perio S5: Resective Osseous Surgery from the Oct 15 class, Claude Code)** — Drive: Periodontology/hubs,
  `en-FA2026_DENT2145-VT_Lecturecapture_AVLC.txt` (the Oct 15 class capture, base64 text: Dr. Litz's in-person review of
  furcations, then Resective Osseous Surgery) and `Resective Periodontal Surgery_Dr. Litz.pdf` (text only: 16 MB is over the
  connector's 10 MB download limit; its picture slides are the surgical cases he talked through). Session 5's resective half
  is no longer the exam-review stub: status note gone, source updated, both reading levels rewritten from "In class: the
  furcation points he repeated" to the end (Phase I and re-evaluation paths, the 11 surgery indications, the 1981 SRP
  study, why bone must follow the scalloped gingiva, positive/flat/negative architecture, 0.6 mm and the 1-year mobility,
  indications and contraindications, ostectomy vs osteoplasty, the 4 steps, sparing furcation bone) and both mp3s
  regenerated. 30 new questions (`q5-R01`-`R24`, 2 two-statement `q5-RS*`, 2 select-all `q5-RM*`, 2 Patient Box `q5-RP*`;
  `q5-R05`/`R08` are EXCEPT; src `lecture`; bank 479 → 509), 7 exam hints quoted from the capture, 2 Review sections
  (phases + re-evaluation, resective osseous surgery), cram lines, a mind-map branch and 4 arcade words. Not changed: in
  class another instructor described Hamp as "three millimeter increments" (1-3, 4-6, >6 mm), which is Tarnow and
  Fletcher's vertical scale; the hub keeps Hamp as under 3 / over 3 / through. **Perio Project: carry all of this into the
  split sources.**

- **2026-10-21 (boss costumes match their seasonal names, Claude Code)** — `widget/eggs.js`: the one-costume-per-holiday
  block in `bossIcon` is replaced by `COSTUMES[holiday][boss]`, 64 outfits that match each seasonal name (Strep
  Mummy-tans in bandages instead of the vampire cape, Tartar-stein's bolts, the Gingi-witch's hat, Tartar the Snowman,
  the Red-Nosed Complex's antlers, etc.). `FIT` places hats, glasses and noses per body. `bossIcon(k, hid)` takes an
  optional holiday id for previewing. About page Part 8 note updated.
- **2026-10-21 (perio S6: Periodontal Regeneration slide deck, Claude Code)** — Dr. Geurs' slide deck (Drive:
  Periodontology/hubs, `Periodontal_regeneration_Dr. Geurs.pdf`; downloaded through the Drive connector and its
  pages rendered with `pdftoppm`, so the image-only slides were read too) is in `hubs/perio` ahead of the lecture. Session 6 goes from `upcoming` to
  `preview` ("Slides only so far"). Both reading levels rewritten (definition vs repair, the four factors, defect
  morphology with the slide's odds ratios and Nibali's pooled numbers, the strategy map (tissue engineering vs
  endogenous regeneration), Levine's regeneration risk assessment, the AAP (Reynolds 2015) decision tree, the toolbox, the open-flap-debridement table, evaluation and subtraction
  radiography; the exam-review guide's EMD / rhPDGF-BB / β-TCP kept) and both mp3s regenerated. The angle is now
  "≤25°" as on the slides (`q6-01`, `q6-06` choice text; same ids and positions). 54 new questions (`q6-L01`-`L38`,
  4 two-statement `q6-S*`, 4 EXCEPT `q6-E*`, 3 select-all `q6-M*`, 4 Patient Box `q6-P*`, 1 matching `q6-X01`; bank
  425 → 479), each with its `QUESTION_WHY` row; 4 Review sections (definition and case selection, risk assessment +
  decision tree, toolbox + graft sources, OFD baseline + evaluation), cram sheet, mind map and 5 arcade words
  (the Quadrants group was dropped in the merge with #151, which retired that game). `NEXT_QUIZ` not set
  (date unknown). No diagrams drawn; the diagram review is still to be put to Sam. **When the recording arrives: flip to
  `taught`, add what the lecture emphasizes, exam hints, and regenerate both mp3s. Perio Project: carry all of this
  into the split sources.**

- **2026-10-21 (arcade revamp: six games, shared `widget/games.js`, Claude Code)** — Sam: the games were a bust; cut nine to six and
  make them playable. Data behind the pick: the arcade was under 2% of study time in every hub; only the sort game (Sort Storm 50
  plays/9 people, Split Decision, Silane Sort), Perio's Cross-Section (12/6), Calculus Crusher (10/8) and Million-Dollar Smile got
  repeat plays; snake, flappy, whack, blaster, search, sweeper, perdle and planer each got about one. Survey 3's games question asked
  for fewer games, a Jeopardy board by lecture with wagers, cloze fill-in-the-blank, quiz-based games and a lecture / missed-question
  filter. New **`widget/games.js`** (+ `widget/games.css`, linked by the script; each hub loads it with `<script defer>` before v3.js):
  `shGames.make(id, g, C)` for **board** (Showdown: one column per lecture, $100-$500 sorted by class accuracy via
  `shGetClassStats`, 2 Daily Doubles, a Final wager on one of the hardest leftovers), **cloze** (Mind the Gap: a sentence from the
  notes with a bolded term blanked out, typed answer, `grade()` allows a letter or two of typos and plurals, 3 lives, clock tightens
  from 32 s to 16 s), **escape** (Operatory Escape: an SVG operatory with hotspots; X-ray viewer, patient chart and drawer are MCQ
  locks, the computer's password is a cloze term, the drawer gives a curing light that reveals the poster's digit; 4 colored digits
  open the door; 6 min, -20 s per wrong answer), plus **smile** and **cross** moved out of Perio. Cloze items come from
  `clozePool(notes)`: `<b>` terms in `p`/`li` (not the "What's tested" box or tables), 3-36 chars, at most 4 words, with a stop list
  for emphasis words. Each hub passes a context `C` (contract at the top of games.js): bank/terms/notes pools, the scope select
  (now with **Questions I missed**: last answer wrong), shell, HUD, finish (best score + leaderboard) and `record` (its answer choke
  point, so class stats and Weak Spots update). **Occlusion**: Cusp Sort + Freeway Showdown, Operatory Escape, Mind the Gap,
  Million-Dollar Smile, Cross-Section (crossword words = one-word bank answers + one-word bolded terms); snake, stack, match, hangman,
  fact, blaster, search and whack removed with their CSS. **Perio**: Calculus Crusher + Pocket Showdown, Operatory Escape, Mind the
  Gap, Smile, Cross-Section; flappy, probe, quadrants, perdle, planer and sweeper removed (and `QUAD_GROUPS`); the category filter row
  is gone. Archived MSK 3/4 and PCD 3 keep their nine games. `migration_v40.sql` (**applied via the connector**) whitelists `board`,
  `cloze`, `escape`. Dashboard `ARCADES`, About page Part 4, `widget/tour.js` arcade step, CI syntax check, `sw.js` -> `sh-v30`.
  **A new hub: load `widget/games.js` and build `C` like Occlusion's (`CTX` in its ARCADE). Perio Project: carry the arcade into the
  split sources.**

- **2026-10-21 (tour fixes and a faster streak board, Claude Code)** — `widget/tour.js`: the dim layer is one element with a
  rounded `clip-path` hole matching the spotlight ring (the four panels showed seams and square corners when zoomed in); short
  screens (under 560 px tall, e.g. a laptop at 200%+ zoom) get compact card type, and a docked card may use up to 60% of the
  height. The dashboard tour no longer explains hub features (the five "Inside every hub" cards are gone); one step on a hub's
  Open button points to the hub's own tour. `sw.js` -> `sh-v29`. `migration_v39.sql`: `get_correct_streak_stats` timed out
  (57014) because it ran `sh_visitor_xp` for every `correct_streaks` row before `limit 1`; it now picks the two top rows first (applied to the live database 2026-10-21).
- **2026-10-21 (Occlusion + Perio: outside fact-check fixes, Claude Code)** — Sam ran both banks past a second model (Gemini); each flag was checked against the hub's notes. Same ids and answer positions throughout. **Occlusion**: `fn-fricative` / `cs-fricative` no longer call the wet-dry line the "vermilion border"; `cs-crown3-plunger`'s #30 cusp rises above the plane (matches `ap-pb-crown`); `cc-step5` says envelope of function. Kept as taught: Stuart/D'Amico attribution, plunger-cusp definition, help-sheet cusp-fossa contacts, stylo-/sphenomandibular ligaments. **Perio**: the Grade C smoking modifier is "10 or more cigarettes a day" in every question (`q1-19`, `q1-O01`, `q1-P02`, `q1-M01`, `q1-S02`, arcade clue; the notes still say "more than 10", as the class did, and are narrated, so unchanged); `q1-M04` RT2/RT3 wording matches `q1-08`; PGCL is poly(glycolide-co-caprolactone), not "poly-glycolide" (same polymer as PGA) in the suture chart and `q2-02`/`03`/`04`/`M01`; `q2-05` asks for the natural braided suture; `q4-07` names the H6/7 sickle; `q4-L36` asks about a Gracey; `q5-L17`/`S02`/`E01`/`E04` say no connective-tissue attachment forms on enamel (junctional epithelium does attach); `q8-04` no longer says food speeds ciprofloxacin; `q8-09`'s low-dose doxycycline choice (also avoided in pregnancy) is now Penicillin V, so `question_choices` rows for that slot before today mean the old choice. Kept as taught: molar-area CTG harvest, Kwok & Caton whole-dentition, stage regression only by regenerating the defect, clinic piezo can't root plane, lingual furcation entrance wider. **Perio Project: carry these into the split sources.**

- **2026-10-21 (guided tours: dashboard and every hub, Claude Code)** — New `widget/tour.js`, loaded by `index.html` and by
  `widget/v3.js` in every hub (`shTour.mount({where:"hub"})`). Each place asks once, "Want a quick tour?" (Show me around / No thanks),
  remembered in `sh_tour` (dashboard) and `sh_tour_hub` (all hubs together): `done` | `skipped` | `no`. Tour buttons: `#tourBtn` in
  the dashboard top bar; in a hub, `.sh-ribbon-tour` in the top bar (hidden under 1000 px, the bar is full) and "Take the tour"
  (`#shstat-tour-pill`) in the widget menu / phone More sheet; any `[data-sh-tour]` starts it. Dashboard: up to 16 steps (a spotlight on
  each part; what's inside a hub is left to the hub's own tour). Hub: up to 19 steps found by shared markup (`#modeSwitch`, `#countdownPill`,
  `#sh-ribbon-name`, `[data-sh-podcast]`, `.quick-start`, `#examCard`, the Compendium `.subtabs` buttons by label, `.sh-tts-btn`,
  `.reading-prose`, `.qcard`, `#panel-review`, `#panel-arcade`, the launcher menu, `.shpet-home`, `#sh-ribbon-back`); a step can
  switch mode/tab or open the menu first, missing parts are skipped, and the hub goes back to its starting mode, tab and scroll at
  the end. The hub question is not asked on an archived hub, a page opened with a #hash, during a mock, or with the drill open.
  While a question or tour is up, the survey/check-in pop-up and `widget/replies.js` pop-ups wait (`shTour.whenIdle`), and an open
  survey or reply card is hidden (`html.sh-touring`). The dimming is one full-screen layer with a rounded hole cut by `clip-path: path(evenodd, …)`
  (a huge box-shadow didn't paint on hub pages; four panels left seams and square corners when zoomed). Tracked as `tour:` / `tour-hub:` + `prompt`, `start`, `decline`, `done`, `quit@<step>`.
  **A new dashboard section, hub mode, Compendium tab or widget tool: add a step or a line in `dashSteps()` / `hubSteps()` /
  `SUB_INFO` in `widget/tour.js`.** About page, CI syntax check, `sw.js` -> `sh-v28`. No schema change.

- **2026-10-21 (mastery medals: one per row, unique per hub, Claude Code, #145)** — Leaderboard rows showed up to three 16px medals that got cut off (in the hub arcade boards they sat inside the name's ellipsis). `shRanks.flair()` in `widget/ranks.js` now draws one tappable medal per row (this page's hub first, else the best) plus "+N"; tapping opens a card with every medal (`openFlair`, a fixed inset:0 layer, tracked `flair:open`). `{ list:true }` gives the rank cards one chip per hub with its name. `medalSvg(lvl, px, hub)`: the metal is the tier, the emblem and ribbons are the hub's (`HUB_MEDAL`; unknown hubs get the tooth), Crown wears a crown on top; the mastery card uses it. Hubs' arcade `row()` puts the flair after `.lb-nm`. **A new hub: add its emblem and ribbons to `HUB_MEDAL`. Perio and MSK Projects: carry the arcade row change into the split sources.** About page, `sw.js` -> `sh-v27`. No schema change.

- **2026-10-21 morning (lessons audit, Claude Code)** — Occlusion midterm day. **"What cusp hits where?" Movements**
  (`tools/figures/occlusion/game.js`, rebuilt into the hub's `od:kit` block): the round's verdict now says which step missed
  ("Right cusp, but step 1 missed. The arrow shows ...", "Right movement, wrong cusp.", "Both missed.") instead of a bare
  "Not quite." (report #28: a right cusp after a wrong movement lit green under "Not quite."). Scoring unchanged (both steps
  needed). `cs-record-best`'s stem now reads "prefer over using any registration material" (was "prefer to", readable as
  "prefer for"; 13 of 26 picked Aluwax); `cs-pro-incline`'s explanation and `QUESTION_WHY` row say why streaks on the
  palatal cusps are still protrusive. Same ids and answer positions. No notes text changed, so no narration regenerated.
  `LESSONS.md` refreshed.

- **2026-10-21 (Timmy Time: Occlusion midterm episode, Claude Code)** — A 45-minute last-minute review for the Occlusion
  midterm, hosted by Timmy Tooth: `hubs/occlusion/audio/timmy-time.mp3` (~32 MB, -16 LUFS), script
  `tools/podcast/occlusion/script.md`, written from the hub's notes (As taught), exam hints and cram sheet, in exam-weight order
  (L1 split into terms, what cusp hits where with the fence post walked through, and guidance/determinants/envelope), 28-question
  lightning round. Light lore building on the MSK 4 episode (his house, his costume, he's a lower first molar, the other TIMMY).
  `lexicon.json` gains 49 occlusion/anatomy words (condyle, pterygoid, masseter, temporalis, the hyoid muscles, mesio-/disto-
  words, Givan with a hard G, Schuyler, D'Amico, ginglymoarthrodial). Hub: `window.SH_PODCAST` (id `midterm-review`) and a
  `data-sh-podcast` slot at the top of Compendium, `#timmy` opens Compendium; dashboard card gets `podcast`; About page updated.
  **When the notes change, fix the script and rebuild the episode in the same PR.**

- **2026-10-20 evening (lessons audit, Claude Code)** — Occlusion midterm eve. `hubs/occlusion`, same ids and answer
  positions: `fp-post`'s stem now says "Class I, cusp-fossa" and names the anterior/posterior contacts on #3 (report #27; its
  favorite wrong answer, the MB cusp of #31, is right in a cusp-marginal ridge reading), and its explanation says why that cusp
  tempts; `cc-parfitt` (Monson, picked 20 times: no condyles, so no condylar paths) and `ap-quad` (root canal therapy is on the
  lecture's list) answer their favorite wrong choice; `QUESTION_WHY` rows updated to match. `question_choices` rows for
  `fp-post` before today go with the old stem. No notes text changed, so no narration regenerated. `LESSONS.md` refreshed.

- **2026-10-21 (Occlusion anima 10 of 10: tooth vs implant under load, Claude Code)** — In the L5 notes at 'Implants' (both levels;
  a heading anchor, so after the table and the anterior/posterior paragraph) and in Review (L5 tab, before Registration). A tooth in its
  PDL beside an osseointegrated implant: Under load (push down: about 28 µm vs about 2-3 µm; sideways: 56-75 vs 10-50 µm; the PDL's
  "felt" signal), drawn ×500 (0.5 px/µm) with the notes' numbers at full load; Shimstock check (12 µm): light closure holds on the tooth
  and pulls through the implant, clench holds on both. Controls use `data-imtab`/`data-imdir`/`data-implay`. Built by
  `tools/figures/occlusion/anima/implant.mjs`. About page updated. **This completes the 10 Occlusion figures Sam approved on 2026-10-20.**

- **2026-10-21 (Occlusion anima 9 of 10: swallowing, stage by stage, Claude Code)** — In the L3 notes after 'Part 2: swallowing'
  (plain 'Swallowing'; new `FIG_PLACE.function` / `FIG_BY_LEC.function`) and in Review (L3 tab, after Swallowing stages). Schematic
  midline section: tongue, palates, pharynx, epiglottis, hyoid, trachea, esophagus, cervical spine. A stage slider (0-3) blends
  keyframes (`swState`): stage 1 tongue presses the bolus back; stage 2 soft palate up, hyoid up and forward, epiglottis over the
  inlet, Eustachian tube opening opens; stage 3 down the esophagus. Somatic vs visceral toggle (tongue tip between the incisors,
  teeth apart). Only the notes' numbers (66.5 lb / 683 ms, 590 a day, 1 s, 6-7 s). Controls use `data-swstep`/`data-swplay`/`data-swmode`.
  Built by `tools/figures/occlusion/anima/swallow.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 8 of 10: canine guidance vs group function, Claude Code)** — In the L1 notes at 'Guidance and the
  goals of ideal occlusion' (plain 'Guidance and the ideal'), in the L5 notes at 'Schemes and guidance' (plain 'Guidance and MIP'; new
  `FIG_PLACE.applying` and `FIG_BY_LEC.applying`), and in Review in both tabs (L1 Guidance and determinants after Schemes; L5 before
  Conformative vs reorganized). The patient's right side from the cheek in a right working move plus a front view of the canines; canine
  guidance (#6 with #27, steep) vs group function (#7-6-5 with #26-27-28, flatter, the notes' example). The lower jaw is one rigid piece
  that drops by slope × travel at the canine, less toward the back (turning about the working condyle). Slopes and gaps schematic.
  Controls use `data-gumode`/`data-guplay`. Built by `tools/figures/occlusion/anima/guidance.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 7 of 10: CR to MIP slide, Claude Code)** — In the L1 notes at 'MIP, centric occlusion and centric
  relation' (plain 'Three positions people confuse'; a heading anchor, so it lands at the end of that section) and in Review (L1 tab,
  Positions and terms, before Terms). Side view: hinge closure with the condyle seated (CR) until the first contact, then the slide up the
  inclines into MIP while the condyle comes off its seat along the eminence; toggle for CO = MIP (the 10%). One model: lower teeth drawn
  in MIP, any pose = condyle offset + rotation about it, the rotation solved by bisection so the teeth just touch (`crContactRot`); the
  first contact falls on the second molars (asserted at build time, matching `pb-slide`). The slide is to scale (1.25 mm at 6 px/mm)
  with ×4 zoom panels that reuse the same markup in a zoomed viewBox. **Lesson: exaggerating a slide past half a cusp pitch lands cusps
  tip on tip; keep the teeth far enough from the hinge (here M2 about 140 px from the condyle) or the CO rotation balloons.** Built by
  `tools/figures/occlusion/anima/crslide.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 6 of 10: envelope of motion tracer, Claude Code)** — In the L1 notes after the static envelope
  figures (`FIG_PLACE` second entry on 'Horizontal view (from above)', plain 'The envelope of motion') and in Review (L1 tab, Envelope
  of motion, after Diagrams). A pen on the lower incisor traces each border of the static `envSag`/`envHoriz`/`envFront` outlines
  (copied, same A-F/A-D points) in the notes' order; sagittal: A→E rotation, E→F rotation + translation, F→D closing protruded, D→C,
  C→B up the guidance, B→A the CO-MIP slide. A joint view uses `tmjModel` (now exported from `tmj.mjs` with `TMJ_D`) for the opening
  steps. **Lesson: the anima kit sets `vector-effect:non-scaling-stroke` on every path, which measures dashes in screen pixels; a
  path drawn with `stroke-dasharray`/`getTotalLength` needs `vector-effect:none`.** Controls use `data-entab`/`data-enstep`/`data-enplay`.
  About page updated.

- **2026-10-21 (Occlusion anima 5 of 10: determinants of cusp height, Claude Code)** — In the L1 notes after the determinants
  section (`FIG_PLACE` 'The determinants of posterior morphology', plain 'How tall can back cusps be?') and in Review (L1 tab, Guidance
  and determinants, after the vertical determinants table). Side view: condyle on the eminence, M2-PM1, canines, central incisors.
  Sliders for CG, VO, HO, plane of occlusion and curve of Spee, plus protrusion (Play). One model (`chModel`): the jaw's path at each
  tooth blends the condylar slope and the incisor slope (VO/HO) by distance from the condyle; allowed incline = path angle minus the
  local occlusal angle (plane + Spee). Solid teeth are built from the starting settings, the dashed outline is the cusp that would just
  clear, too-tall cusps turn red, and in protrusion the gap (Christensen) and any overlap are filled per column. All numbers schematic;
  the module throws at build time if the trends ever stop matching the notes' table. Controls use `data-ch`/`data-chplay`.
  Built by `tools/figures/occlusion/anima/cuspheight.mjs`. About page updated.

- **2026-10-21 (Occlusion anima 4 of 10: muscles by movement, Claude Code)** — In the L2 notes after the exam-slide table
  (`FIG_PLACE` 'The exam slide: muscles for each movement', plain 'The exam chart') and in Review (Functional TMJ Anatomy, a
  "Muscles by movement" `figs` section after the exam-slide table). Schematic side view of the right side (superficial:
  temporalis anterior/middle/posterior, masseter superficial/deep, digastric, hyoid, infrahyoids; deep, cropped to the jaw, arch
  removed: lateral pterygoid superior and inferior heads, medial pterygoid). Pick a movement and the exam slide's muscles light up
  with an arrow along each line of pull (`D.LIT`, exactly the slide; the superior head shows dashed as "also active" in closing, per
  the notes); a toggle mirrors to the left side for the lateral moves. Controls use `data-mumove`/`data-muside-btn`. Built by
  `tools/figures/occlusion/anima/muscles.mjs`. About page updated.

- **2026-10-20 (Occlusion anima 3 of 10: working and non-working interferences, Claude Code)** — In the L1 notes right after the
  static frontal-section figure (`FIG_PLACE` 'Help sheet method for interferences', both levels) and in Review (L1 tab, What cusp
  hits where, Diagrams). Front view: the same #3/#30 section as `inclines` (outlines copied from `od.js`); a slider slides the lower
  molar toward the cheek (right working: 2-6 and 4-5 light up) or the tongue (left move: 1-3); side tab: protrusive in a schematic
  Class I buccal view (mandibular mesial on maxillary distal inclines). One model (`ixRide`, sampled crown profiles) rides the lower
  tooth down whatever it touches and marks the contact; "Let the guidance lift the teeth apart" removes all contact. Built by
  `tools/figures/occlusion/anima/interferences.mjs`. **Inside the notes a figure's controls must not use `data-go`, `data-view`,
  `data-tab`, `data-sub`, `data-mode`, `data-lec` or `data-group`**: the notes wire every `[data-go]` as navigation and
  `widget/fx.js`/`v3.js` read the others (this one uses `data-ixgo`/`data-ixv`/`data-ixtab`). About page updated.

- **2026-10-20 (Occlusion anima 2 of 10: cusp pathways in motion, Claude Code)** — In the L1 notes after the static
  pathway figures (`FIG_PLACE` 'Cusp pathways:', both levels) and in Review (L1 tab, part What cusp hits where, Diagrams). Fig 2: #3 and
  #30 drawn by the hub's own kit (`od.js` loaded at build time with `vm`, so teeth and arrows match `pathMax`/`pathMand`);
  pick A-D and the opposing cusp leaves its MIP contact on both teeth at once (+d on the upper tooth, -d on the lower).
  Fig 2b: the mandible from above rotating about the working condyle (`jawMove`/`jawAngles`/`jawFrame`), sliders for
  distance from the rotating condyle, from the midline and intercondylar distance plus a Bennett side-shift toggle; the
  angle between the paths follows the L1 horizontal-determinants rule (schematic distances, so it shows the trend). Built by
  `tools/figures/occlusion/anima/cuspmotion.mjs`; `build.mjs --preview` now includes `od.css`. About page updated.

- **2026-10-20 (Occlusion anima 1 of 10: TMJ opening, Claude Code)** — First of the 10 approved Occlusion figures, in the L2
  notes after the disc/compartments paragraph (plain: end of "The jaw joint") and in Review → Functional TMJ Anatomy. Slider
  0-50 mm and Play: pure rotation in the lower joint space to 25 mm (outer TM ligament taut from about 20-22 mm), then
  rotation + translation down the eminence in the upper joint space with the disc rotating posteriorly on the condyle and the
  retrodiscal tissue filling the fossa; LP inferior head lit while opening, superior head while closing; tap-to-explain
  parts. Built by `tools/figures/occlusion/anima/` (one model, `tmjModel`/`tmjFrame`, drives the built SVG and the live
  figure; the temporal bone's articular surface is molded to the disc along the path) via the same `build.mjs`, which now
  also fills the hub's `anima:js`/`anima:css` markers (`--preview` writes dist pages). No SVG ids. About page updated.

- **2026-10-20 (Occlusion: several questions per patient, Claude Code)** — At Sam's suggestion, every Patient Box case is now
  a shared patient: `CASES` (defined once, after the question helpers) holds each box and its drawn findings, and
  `pc('<key>')` gives a question that box plus `pcase`. `pboxHTML` shows "Same patient · k of n" (`caseSet()`), and the
  bank's Shuffle keeps a set together in its own order. 18 cases, 30 new questions written from the L1-L5 notes (bank
  319 -> 349), e.g. `cs-div2-vo`/`-teeth`/`-molar`, `cs-nw-side`/`-incline`, `cs-pro-incline`/`-christ`, `cs-worn-vdo`/`-weeks`,
  `cs-record-best`/`-check`; each explanation answers every wrong choice, and each has its `QUESTION_WHY` row (#129's rule). `cs-upright` and `cs-reorg` now show the full
  shared box, so their stems no longer say "the previous case" (same ids, keys and answer positions). About page updated.
  No notes text changed, so no narration regenerated.

- **2026-10-20 (Occlusion Review: one tab per lecture, Claude Code)** — Sam asked for one Review tab per lecture. L1's
  four groups (Positions and terms, What cusp hits where, Guidance and determinants, Envelope of motion) are now one
  tab, "Review of Basic Occlusion" (id still `positions`, so saved picks and `review/positions` time carry over; old
  `contacts`/`guidance`/`motion` picks fall back to it). A section's `part` field draws a part heading, and a tab with
  2+ parts opens with jump links (`partNavHTML()`). The "Processes (all lectures)" tab is gone: each lecture's tab ends
  with its own processes (a `flows` section with `lec`, filtered by `seqsOf()`). Side by side stays as the one
  cross-lecture tab. Content unchanged. About page, `sw.js` -> `sh-v26`. No schema change.
- **2026-10-20 (why each choice, highlighter colors, egg refresh, hub trophies, Claude Code)** — Sam's list.
  **Why each choice**: every mcq/multi in `occlusion` (317, incl. #128's 11 new cases) and `perio` (388) has a `QUESTION_WHY` row (one line per
  choice, same order as `choices`, written from each question's explanation and the hub's notes), applied as `q.why`
  and drawn by `whyHTML()` under the explanation after answering (bank, drill, Weak Spots, mock review), right choices
  first, the student's pick marked (a document click listener marks it). **Standing rule** (`CLAUDE.md` → "Every choice
  gets a why"): new questions need their row; the CI lint fails without it, except the archived `WHY_EXEMPT` hubs
  (msk-exam3, msk-exam4, pcd-exam3). **Highlighter** (`widget/highlight.js`): five pens (yellow, green, blue, pink,
  orange; `sh_hl_pen` remembers the last), saved ranges may carry a color key (`[s, e, "g"]`; none = yellow, so old
  highlights still load), a new stroke paints over what it covers, tapping a highlight can recolor it. **Mock exams**:
  a second Submit (with the answered count) after the last question (`.mock-foot`, all hub engines incl. perio).
  **Eggs** (`widget/eggs.js`): a drawn gold periodontal probe (`probeArt()`, also on the dashboard's Golden Probe line);
  a redrawn Tooth Fairy (`fairyArt()`, 5 looks + a rare Golden Fairy 1 in 10, 5 flight paths, sparkle trail, varied
  catch lines; still one `record_fairy` per catch); **8 bosses** (`BOSSES`: Plaque Boss, Tartar Titan, Biofilm Blob,
  Strep Mutans Swarm, Cavity Creep, Gingivitis Goblin, Halitosis Haze, The Red Complex), one per 2-hour window picked
  from the window id so everyone fights the same one, own HP and lines by health, floating damage, a crit for 2 on
  every 5th right in a row; each boss has a regular and a seasonal version (`SEASONAL`: per holiday, a name for every boss plus an opening line, worn with that holiday's costume). Console previews record nothing: `shEggs.preview("boss", 0-7)`,
  `("fairy", look 0-5, "wave|loop|zigzag|swoop|back")`, `("golden")`. **Hub trophies** (`widget/ranks.js`
  `HUB_TROPHIES`): the trophy case gains a section per hub (this hub open first, then every hub you studied or earned
  in): Bronze/Silver/Gold Mastery, Crown, Seen It All (new), Full Arch, Mock Ace, Perfect Mock (new), Final Blow, plus
  "Secrets found here". `migration_v38.sql` (**applied via the connector**) whitelists `seen-all` and `mock-perfect` in
  `record_achievement`. About page, `sw.js` -> `sh-v25`. **Perio Project: carry `QUESTION_WHY`, `whyHTML` and the mock
  footer into the split sources.**

- **2026-10-20 (Occlusion: accurate diagrams in the notes, cusp game, image cases, Claude Code)** — Midterm eve. All seven
  Occlusion figures redrawn from Dr. Givan's help sheet (Drive: Occlusion/Hubs, `Occ Lec0 help`) by one plain-JS kit,
  `tools/figures/occlusion/` (`build.mjs` pastes it between the hub's `od:kit`/`od:css` markers; `--check`): real occlusal
  anatomy, #3/#30 cusp pathways with a movement **key** (A protrusive, B working leaning slightly mesial on the upper tooth as
  the help sheet's pathway pictures draw it, C non-working, D retrusive and short; a student asked for the key), the
  help-sheet zigzag fence post, colored inclines in the frontal section, labeled envelopes. Keys use the folded
  `figKeyHTML` from #125 (each FIG's `key`); after answering, the explanation now shows the figure again with its key open
  (`figAfterHTML`, which also handles `imgAfter`); in-picture `fg-hint` labels hide above a question stem.
  New **fence post + contact map** widget with Class I/II/III tabs (`OD.CONTACTS`, read off the help sheet's three contact
  pictures). Figures now sit **inside the L1 notes** next to their paragraph (`FIG_PLACE`, both reading levels) in a
  `data-sh-noread` wrapper: `widget/v3.js` (browser-voice word wrapping) and `widget/highlight.js` (text, hash, offsets) skip
  it, `SH_GOTO` note jumps too, and READINGS text is unchanged, so no narration was regenerated. **"What cusp hits where?"**
  game at the top of the Question Bank (`CUSP_GAME`; Contacts and Movements, 10 rounds, best in `STATE.cusp`; not bank
  questions, no class stats). **Patient cases with drawn findings** (`pimg:[CASE_IMG keys]` inside the Patient Box): perio
  charts, periapical/bitewing/TMJ films (maxillary films crown-down), intraoral views, articulating paper, shimstock, mounted
  casts, a PVS record. 9 Patient Box items enriched (same ids and keys: `pb-div2`, `pb-upright`, `pb-slide`, `an-pb-lock`,
  `fn-pb-aob`, `cc-pb-sda`, `ap-pb-crown`, `ap-pb-agt`, `ap-pb-c4`) and 11 new (`cs-upright`, `cs-reorg`, `cs-trauma`, `cs-nw`,
  `cs-pro`, `cs-implant`, `cs-implant6`, `cs-worn`, `cs-record`, `cs-group6`, `cs-fricative`); bank 308 -> 319. Diagram-question
  stems name #3/#30 (same ids and keys). Sam approved all 10 anima candidates for Occlusion (TMJ opening, cusp pathways in
  motion, inclines, muscles by movement, cusp-height determinants, envelope tracer, CR-MIP slide, guidance, swallowing, tooth vs
  implant); they ship in follow-up PRs. About page, `CLAUDE.md` (inline-figure rule), `sw.js` -> `sh-v22`.

- **2026-10-20 (longer drill, Review by lecture, comparison charts, Claude Code)** — From survey round 2, at Sam's
  request. **Daily Drill length** (`widget/drill.js`): 10, 20 or 30 questions, picked on the intro screen before the day's
  first set starts (`sh_drill_size`, every hub); switching grows the saved set (keeps the picks, adds more) or trims it;
  the caps scale with the length (spaced review up to 60%, misses 80%, 30% per lecture); the finish screen offers 10, 20
  or 30 more. Tracked as `drill:size=<n>` / `drill:more=<n>`. **Occlusion Review**: each group has a `lec` and shows that
  lecture's L-number in its color on the chip and heading (`groupLecTag()`); groups that cover one lecture take its title
  (L2-L5), the L1 ones say "From L1 · Review of Basic Occlusion". New group **Side by side** (`compare`): the four
  movements from every angle, Class I vs II vs III cusp by cusp, joint words, the four curves, and the pairs the class
  mixes up (from the hardest items), all from the hub's notes. Perio's Review already filters by session title, so it
  is unchanged. About page (Daily drill, Review), perio's drill button text, `sw.js` -> `sh-v23`. No schema change.
  Sam's calls the same day: the archived hub folders stay; Timmy Tooth keeps asking unadopted visitors to tap him;
  no cloze items for now.

- **2026-10-20 (lessons audit + feature events, Claude Code)** — `LESSONS.md` refreshed: retrospectives for **PCD Exam 3**
  and **MSK Exam 4** (both recaps were already on the dashboard), the 10-15 fixes checked, Occlusion's eve signals, a
  feature-use summary (podcast, Timmy Tooth, Listen, mind maps, names, diagrams) and new standing lessons (heaviest users
  ask for application questions; build on a course's hint email; the extras each reach a minority). **New tracking**:
  `migration_v37.sql` (**applied via the connector**) adds `feature_events` (one row per day, page, kind and visitor, `n`
  summed), public `record_events` and admin `get_feature_events`. `widget/clicks.js` defines `window.shTrack(kind, n)`
  (lowercase kinds, sent with the click batch; automated browsers send nothing) and counts on every page: `view`, a daily
  `state:<setting>=<value>` snapshot (pet, pet-adopted, eggs, theme, font, size, music, accent, nuke, own-name),
  `pref:<setting>=<value>` on change (`sh:pref`, never the display name; the dashboard's Settings call it directly),
  `egg:<t>` from `sh:egg-local`, `fig-seen:` / `fig:` / `fig-part:` for diagrams (`[data-anima]`, `figure.fig-card`).
  Hooks: `widget/timmy.js` `egg:timmy-start` on every summon; `widget/pet.js` `pet:intro`, `pet:adopt-button`,
  `pet:adopt-closed-stepN`, `pet:no-thanks-stepN`; `widget/podcast.js` `pod:<id>:play`, `:secs` (content seconds heard, seeks
  excluded) and `:q1`-`:q4` (25/50/75/95% heard, once per device, `sh_pod_heard:<hub>:<id>`); `shTTS` in `widget/v3.js`
  `tts:start-full|plain|voice`, `tts:lec=<file>`, `tts:secs`, `tts:end`; `mmap:open`; `name:set` / `name:reset`. The About
  page now loads `clicks.js` too (hub `about`, `about:spoilers=on|off`). `review/` -> Clicks opens with a **Features**
  section. `supabase/schema.sql` updated, `sw.js` -> `sh-v22`. Not student-visible. **A new feature: add a `shTrack` call
  for whatever a click can't show.**

- **2026-10-20 (Occlusion midterm eve, Claude Code, #125)** — From the lessons audit, the day before the midterm.
  `hubs/occlusion`, same ids and answer positions: explanations now answer the class's favorite wrong choice on
  `an-compound` (4/27; "hinge and gliding" is the ginglymoarthrodial definition), `fp-m2`, `fp-post`, `fp-c2-pm`,
  `rv-ch-spee`, `fig-pmand-a`, `fig-incl-w`, `fp-arrow`, `cc-parfitt`, `cc-cingulum`. **Diagram keys** (suggestion #6): a
  FIGS entry can carry `key:[[label, text], ...]`, drawn by `figKeyHTML()` as a folded "Show the key" under the copies in
  the notes and Review (`figCardHTML`) only, never on a question's picture (`figHTML`); envSag, envHoriz, envFront,
  pathMax, pathMand and inclines have one. New `rv-thielmann-f` asks for Thielmann's formula itself (report #26). 11 more
  help-sheet items (suggestion #8; the help-sheet source was the weakest at 60%): `fp-pm1b`, `fp-pm2l`, `fp-l-pm2b`,
  `fp-l-ml`, `fp-l-m2`, `fp-c2-pm1b`, `fp-c2-pm1l`, `fp-l-c2`, `fp-c3-pm1l` (fence post: other cusps, the left side, Class
  II/III) and `fp-facet`, `fp-path14` (inclines and cusp paths applied). Bank 296 -> 308. About page: the diagram key. No
  notes text changed, so no narration regenerated.
- **2026-10-20 (Occlusion midterm: Dr. Givan's exam email, Claude Code)** — The email: Wed Oct 21, 6:30 pm, Canvas with
  LockDown Browser + Monitor, 40-45 multiple-choice questions on the first three sessions (9/17, 9/24, 10/1, i.e. all five
  lectures already in the hub; the Drive Midterm folder holds exactly those three recordings), one hour, log in from 6:25,
  window closes 7:45, one blank sheet shown on both sides in the environmental scan. `hubs/occlusion`: a collapsible
  **exam card** under the quick-start row on Compendium (`EXAM_INFO`, `examCardHTML()`; closing it is remembered in
  `STATE.ui.examCard`; gone once the window closes at `EXAM_CLOSES`), with a button to the mock; the ribbon countdown counts
  calendar days and says "Midterm tonight" on exam day, switching to the final at 7:45 pm (was 10 pm); the Exam Hints banner
  and header tooltip give the time. **Mock is now 45 questions** (`MOCK_BLUEPRINT` 15/8/7/8/7, 15 per session; no official
  per-lecture counts) and its clock reads against 60:00, turning red past the hour (`MOCK_LIMIT`). Dashboard: the midterm's
  Check in button and pop-up wait for 8 pm (`checkinHour:20, promptHour:20`). No notes text changed, so no narration
  regenerated. No schema change.

- **2026-10-15 (unanswered survey waits in the Inbox, Claude Code)** — The dashboard survey pop-up's "No thanks" is now
  **Later** (it still records a null row so the pop-up doesn't come back, then says "Saved to your Inbox"). The live survey
  the visitor hasn't answered sits at the top of the Inbox on every hub and the dashboard (`widget/replies.js`,
  `get_my_survey`), unread (badge/dot) until the Inbox is opened (`sh_survey_seen`), and is answered right there with the
  same question kinds (Other included). `migration_v36.sql` (**applied via the connector**): `get_my_survey`, and
  `submit_survey` now lets answers replace an earlier null "Later" row. `shReplies.refresh()`; `sh:survey-done` closes the
  dashboard card if it was answered from the Inbox. About page, `sw.js` -> `sh-v21`.

- **2026-10-15 (surveys: 5 questions + Other, Claude Code, #120)** — `migration_v35.sql` (**applied via the connector**):
  `admin_upsert_survey` takes 1-5 questions (was 3); the dashboard card shows up to 5. A pick-one / pick-any question with
  `"other": true` gets an **Other** button that opens a text box, saved as `answers["<id>_other"]` (300 chars); `review/` →
  Surveys lists those answers and its form has 5 rows. Survey 3, "Help shape the hubs, round 2" (question formats incl.
  Quizlet/Anki, routine on the hub, guided tutorial yes/no, what's annoying, what to do about the games), is live and
  replaced survey 2. About page updated.

- **2026-10-15 (Timmy Time podcast, Claude Code)** — A last-minute audio review episode for MSK Exam 4, hosted by Timmy
  Tooth: `hubs/msk-exam4/audio/timmy-time.mp3` (~42 min, 96 kbps stereo, -16 LUFS), built by the new `tools/podcast/`
  (script `tools/podcast/msk-exam4/script.md`, written from the hub's notes and exam hints; Kokoro voice
  `am_michael:0.6,am_onyx:0.4` with `lexicon.json` for ~100 drug/anatomy words espeak mispronounces; synthesized lo-fi
  music, stingers, a bell on each lightning-round answer, ducking and mastering in `produce.py`; see its README). Player:
  new shared `widget/podcast.js` (loaded by v3.js when the hub defines `window.SH_PODCAST`): an episode card in any
  `[data-sh-podcast]` slot (MSK 4: top of Compendium), one `<audio>` on `<body>` so playback survives tab/mode switches,
  a pinned player when no card is on screen, chapters, 1-2× speed, ±15/30 s, resume (`sh_pod_pos:<hub>:<id>`, speed
  `sh_pod_rate`), Media Session lock-screen controls, preload none. `#timmy` opens the hub on Compendium at the card; the
  widget menu gains a Timmy Time item; the dashboard's MSK 4 card gets a Timmy Time row and the hero a button (`hub.podcast`).
  Listening counts as study time (idle rule) and logs as `podcast/<id>`. A lecture's Listen pauses the episode.
  About page, CI syntax check, `sw.js` -> `sh-v20` (the mp3 is never cached). **When the notes change, fix the script and
  rebuild the episode in the same PR.** No schema change.

- **2026-10-15 (Listen dock + highlighter, Claude Code)** — Two student suggestions, built at Sam's request.
  **Listen dock** (#4): `shTTS` in `widget/v3.js` now remembers the current narration (`cur`) and, while it plays or is
  paused and the lecture's Listen row and player are out of view (IntersectionObserver), shows `.sh-tts-dock` pinned to the
  bottom of the screen (above the phone bar via `--sh-tabbar-h`): play/pause, the lecture title (tap to scroll back),
  a seek bar (narration files; read-only progress for the browser voice), the time and a stop button. It also shows if
  the hub re-renders and the Listen button leaves the page while audio keeps going. **Highlighter** (#5): new
  `widget/highlight.js`, loaded by v3.js (`shHighlight.mount(HUB)`): selecting text inside any `.reading-prose` shows a
  "Highlight" button; highlights are `<mark class="sh-hl">` wrapped around existing text nodes (notes text and narration
  unchanged; Listen word-highlighting still works inside them), saved per device in `sh_hl:<hub>:<hash of the notes
  text>` as merged [start, end] offsets, redrawn by a MutationObserver whenever a hub renders notes, and dropped if the
  text changes (the hash). Tapping a highlight offers Remove / Clear all. Works in every hub with no hub changes; a new
  hub gets both if its notes use `.reading-prose` and its Listen button `.sh-tts-btn`. About page, CI syntax check,
  `sw.js` precache -> `sh-v19`. No schema change.

- **2026-10-15 morning (lessons audit, Claude Code)** — MSK Exam 4 eve-1; PCD Exam 3 is open today. `hubs/msk-exam4`,
  same ids and answer positions: `sk-keratinization`'s key reworded (report #21: "Programmed cell death that removes the
  nucleus but leaves the cell intact"); `sk-ex-func`'s throwaway key "Producing bile" is now "Activating vitamin D to
  calcitriol" (report #22, "too easy"; the explanation says the kidney does that step, as `sk-vitd` already teaches);
  explanations now answer the favorite wrong choice on `dp-clinda` (gramicidin = membrane), `dp-terb-pk` (not converted to
  an azole), `mu-dhpr` (SERCA pumps calcium back) and `nm-sux-cv` (no beta-1 block; hyperkalemia). Picture questions
  `mu-fig-h` and `mu-fig-a` (report #25, "can't tell what is highlighted"): the lit band gets a dashed outline and a stronger
  fill, the A-band still now lights its H zone too, and the H-band still drops the A-band tint (`STILL_CSS` in
  `tools/figures/msk-exam4/build.mjs`, rebuilt). `question_choices` rows before today for `sk-keratinization` and
  `sk-ex-func` refer to the old key wording. No reading text changed, so no narration regenerated. `LESSONS.md` refreshed.
  **At Sam's request (same audit):** MSK 4's two weakest matching items are now MCQs: `pa-warts-match` (2/10) became
  `pa-wart-plana`, `pa-wart-plantar` and `pa-wart-condyloma` (verruca vulgaris already had `pa-wart-hpv`), and `dp-ecto`
  (4/15) became `dp-ecto-malathion`, `dp-ecto-spinosad` and `dp-ecto-ivermectin` (crotamiton is already in `dp-ex-ecto`);
  bank 232 -> 236, matching 10 -> 8 (the Melanin Match arcade blurb no longer promises warts). **PCD Exam 3**: `gl-email`
  removed (reports #23, #24; bank 335 -> 334), and explanations now answer the favorite wrong choice on `on-telio`,
  `on-materials-list`, `ve-same-day`, `ce-short-prep`, `on-isthmus`, `gl-system`, `ve-zenith` and `gl-c-shade`.
  **Automated browsers are no longer tracked**: when `navigator.webdriver` is true (Playwright, Puppeteer, Selenium),
  `widget/v3.js` skips every `record_*` RPC and the online-now presence (`window.shAutomated`), `widget/clicks.js` sends
  no clicks and `widget/ranks.js` saves no mock score. Test sessions on the live site no longer add fake visitors.
  `sw.js` -> `sh-v18`. **MSK Project: carry these into the split sources.**

- **2026-10-15 (MSK 4: in-class review questions, Claude Code)** — The 12 in-class review questions (Drive, Exam 4
  folder, "Exam 4 Practice questions") are in `hubs/msk-exam4` as `rv-*` with a new source `review` ("In-class review"),
  stems and choices as given (typos fixed). The two picture items use the hub's own drawings instead of the slide
  images (public repo): `rv-gland` shows a new anima **skin block** (`tools/figures/msk-exam4/skin.mjs`, still
  `skin-gland`: layers, follicle + sebaceous gland + arrector pili, eccrine coil labeled "1." with its duct to a pore,
  plexuses, a Pacinian corpuscle; still only, not under the notes), `rv-mline` the sarcomere with the M line lit
  (`sarc-m`). Approved by Sam 2026-10-15; About page Diagrams entry updated. The shared doc's marks were wrong on two (spasm: keyed
  Baclofen, not cisatracurium; "-curonium" reversal: Sugammadex, not pyridostigmine) and blank on the sun-exposed-tumor
  one, keyed SCC as Dr. Dababneh's slide says (`pa-scc-common`). The bank's source filter drops "10/13 recording" (those
  items keep their chip) and gains "In-class review" first (`SRC_FILTER`; a saved pick of `rec` resets); the Daily Drill
  counts the set as high-yield. Bank 220 -> 232. No notes text changed, so no narration regenerated.
  **MSK Project: carry these into the split sources.**

- **2026-10-14 (PCD Exam 3: staining recommendations, Claude Code)** — A course email says the two exam questions from
  James Bradley's glaze video are on its staining recommendations. Checked the hub against the video transcript (Drive,
  `13 Glaze and Add Porcelain Contacts ... .txt`): the notes already covered every step. 7 new questions (`gl-email`,
  `gl-c-shade`, `gl-occlusal`, `gl-white`, `gl-texture`, `gl-ln-thin`, `gl-gingival-where`; bank 328 -> 335), the email
  and 3 video quotes as exam hints, 3 Review rows and 2 cram lines. Notes text unchanged, so no narration regenerated.

- **2026-10-14 (MSK 4: clinical lecture off, official exam counts, Claude Code)** — Sam: Dr. Taylor's MSK & Skin
  Clinical Application lecture (`clinical`, label `CA`) is not on Exam 4, so it is gone from `hubs/msk-exam4`: the
  lecture, its 29 `ca-*` questions (bank 249 → 220), both reading levels and their mp3s, the "Dental clinic" Review
  group, its cram lines, the MRONJ ordering and the osteoporosis/osteomalacia sort. Three dermpath explanations no
  longer cite Dr. Taylor's slides (same answers). The mock now uses the official counts, **30 questions: L28 6, L29 3,
  L30 6, L31 11, L32 4**. Saved views or an unfinished mock pointing at the lecture reset on load. Dashboard card text
  updated. Recover the lecture from git history (`git show ed35097:hubs/msk-exam4/index.html`) if a later exam needs it.
  **MSK Project: carry this into the split sources.**

- **2026-10-14 (perio S5: Furcation Management recording, Claude Code)** — Dr. Litz's recorded Furcation Management
  lecture (Drive: Periodontology/hubs, `Furcation_Management_Dr. Litz.mp4` + slide PDF; transcribed in-session with
  faster-whisper) is in `hubs/perio` before the Oct 15 quiz on it. Session 5 keeps its id `resective-furcation` (audio
  file names) and is now "Furcation Management & Resective Surgery", status `taught`, with a new lecture field `note`
  (shown as the notes banner instead of the status notice): only the furcation half is lectured; Resective Osseous
  Surgery is taught in class after the quiz and its short section still comes from the exam-review guide. Both reading
  levels rewritten and both mp3s regenerated. Entrance depths now follow the lecture (Bower: maxillary 3.6 / 4.2 /
  4.8 mm, mandibular 2.4 / 2.5 mm; the guide's 3 / 3.5 / 5 mm noted). 68 new questions (`q5-L01`-`q5-L50`, 4 Patient
  Box `q5-P*`, 3 select-all `q5-M*`, 5 two-statement `q5-S*`, 5 EXCEPT `q5-E*`, 1 matching `q5-X01`; bank 357 → 425);
  `q5-01`/`02`/`04` explanations and `q5-07` (stem and choices) updated to match the lecture. 10 exam hints quoted from
  the recording, 6 Review sections (terms, anatomy + root depressions, contributing factors, CEPs, classifications +
  detection, treatment options), cram sheet, mind map, 6 arcade words and 2 Quadrants groups. Course Home shows a
  **quiz card** until `NEXT_QUIZ.date` passes (set the next one there). Diagram review: Sam skipped all three candidates
  (Glickman grades, entrance map, CEP grades); don't re-propose them. **Perio Project: carry all of this into the
  split sources.**

- **2026-10-14 (PCD Exam 3 check-in waits for 8 pm, Claude Code)** — PCD Exam 3 is a Canvas exam open 8 am-8 pm, so
  its dashboard "Check in" button now appears at 8 pm, not 8 am. New optional per-exam `checkinHour` in `HUBS` (default
  `CHECKIN_HOUR`); the pop-up still goes out from `ARCHIVE_HOUR` (10 pm). About page updated. No schema change.

- **2026-10-14 (MSK 4: L31 and L32 recordings, Claude Code)** — Sam added the 10/13 class recordings of L31 Skeletal
  Muscle and L32 NMJ Pharmacology to the Drive (Exam 4 folder; both VTTs are labeled "Michael Herr", the room's Zoom
  account). Both lectures go from "Slides only" to "Recording + slides". Notes at both levels gain what the lectures
  added (muscle: adult regeneration and satellite cells with age, M line and the overlap zone, the weak/strong
  cross-bridge cycle, actin sliding toward the M line, twitch vs AP and tetany, ~80% of glucose kept as glucose-6-phosphate,
  fiber types by job and IIx switching, myokine modes, sarcopenia and innervation; NMJ: "paralytics", pseudocholinesterase
  genetics (up to ~8 h, dibucaine), bradycardia far more common, tubocurarine from curare, train-of-four thresholds,
  glycopyrrolate first for heart, airways and gut, sugammadex only for -curonium drugs plus backup contraception,
  tizanidine tried first, Botox for migraine via CGRP, descending botulism). Where the recording and slides differ
  (where the T tubules sit) the notes give both and no question turns on it. All four L31/L32 mp3s regenerated.
  20 exam hints quoted from the recordings, 20 new questions (src `rec`, "10/13 recording"; bank 229 → 249), new cram
  lines. No other lecture changed. **MSK Project: carry these into the split sources.**

- **2026-10-14 (MSK 4 diagrams in Review, Claude Code)** — Sam asked for the drawn figures in Review too, in the
  sections they belong to. `hubs/msk-exam4` Review: **The neuromuscular junction and its drugs (L32)** sits in Drugs right
  after the L32 drug cards, **The sliding sarcomere (L31)** in Muscle right after the Sarcomere bands table, both live.
  New section type `figs` (`{ title, type:'figs', lec, figs:[ANIMA keys], find:'extra search words' }`; not counted in
  the chip totals); Review search and the widget's site search find them (e.g. "sugammadex"). Because the hidden Notes
  panel stays in the page, the build now gives every copy of a figure its own SVG ids and radio group (`uniq()` in
  `build.mjs`; `ANIMA.html(key, true)` leaves the title to the caller; the sarcomere's live code and CSS no longer
  hard-code `#sc-…` ids). Side effects, both fixes: troponin C now lights up when Ca2+ is bound (an id selector was
  outranking that rule), and on phones the cropped figures no longer draw past their frame (the sarcomere's crop keeps
  its full height so its labels show). No question or notes text changed. About page updated.

- **2026-10-14 (diagrams after answering, Claude Code)** — Sam: in the question bank, don't show a diagram before the
  question is answered unless it's needed, so it can't give the answer away (standing rule, now in `CLAUDE.md` →
  "Diagrams"). New question field `imgAfter:true`: the diagram opens inside the explanation (after the verdict) instead
  of above the stem, in the bank, the Daily Drill and the mock review. Applied to every picture question that can be
  answered from its stem: MSK 4 `nm-fig-ache`, `nm-fig-rec`, `nm-fig-ves`, `nm-fig-na`, `mu-fig-a` (stems reworded to
  stand alone; `mu-fig-h` keeps its picture first), PCD `ve-dogleg`, `ve-papilla`, `co-munsell-coords`, `co-specular`,
  and perio `q2-D14` (stem reworded; its "Diagram" chip hides too). Occlusion's 20 and the rest of PCD's and perio's ask
  you to read the diagram, so they keep it above the stem. Same ids and answers. **Perio Project: carry `figAfter`,
  `imgAfter` on `q2-D14` and its new stem into the split sources.**

- **2026-10-14 (first anima figures: MSK Exam 4, Claude Code)** — From the first diagram review (Sam approved 2 of 16
  candidates across the live hubs; skipped: all 4 PCD Exam 3, MSK 4's melanin unit and blister split, all 4 Occlusion and
  all 4 Perio, so don't re-propose them for those exams). `hubs/msk-exam4` gets two interactive figures under the notes
  (outside `.reading-prose`, so no narration change): **the neuromuscular junction** (L32; selector for no drug /
  succinylcholine / rocuronium / roc + neostigmine / roc + sugammadex / botulinum toxin, with end plate, Na+ channel
  inactivation gates, a qualitative train of four and a small particle model) and **the sliding sarcomere** (L31; slider
  and Play; A band constant, I and H shrink, cross-bridges when Ca2+ is on troponin C). Six picture questions
  (`nm-fig-ache`, `nm-fig-rec`, `nm-fig-ves`, `nm-fig-na`, `mu-fig-h`, `mu-fig-a`; `img:` = an `ANIMA` still with one part
  highlighted, labels hidden) render above the stem in the bank, drill and mock; arcade pools skip `q.img`. Bank 223 → 229.
  Built by `tools/figures/msk-exam4/build.mjs` (kit tokens mapped onto the hub palette in `shared.mjs`), which rewrites the
  `anima:css` / `anima:js` blocks in the hub: edit the build, never those blocks. About page Diagrams entry updated.

- **2026-10-14 (calmer right-answer feedback, Claude Code)** — Sam found the right-answer "pop" shaky: `pop()` in
  `widget/fx.js` scaled the whole option (1 -> 1.035 -> .997 -> 1), which wobbles its text, and the check badge
  overshot. Now the option never moves: a `.sh-fx-sweep` wash in the option's own (green) color sweeps left to right in
  ~230 ms, holds, and fades by 720 ms, with a smaller, shorter glow; the check badge scales in from .4 with only a slight
  settle and draws faster. Wrong answers still shake. About page wording, `sw.js` -> `sh-v17`. No hub changes.

- **2026-10-14 (motion pass, Claude Code)** — New `widget/fx.js` (loaded by v3.js, `shFx.mount(shEggHooks)`), one
  MutationObserver plus a capture-phase click listener, so **hubs need no changes**: **answer feedback** (right after a tap
  inside a `.qcard`, an option that turns `.is-correct`/`.is-matched`/`data-state="correct"` pops with a ring and gets a
  `.sh-fx-mark` check that draws itself; `.is-wrong`/`incorrect` shakes and gets an X; the right answer then lights up;
  select-all and ordering cards mark each option in turn; the explanation grows open; cards drawn already answered stay
  still), **streak flame** (`#sh-flame`, from v3.js's new `sh:streak {n, prev}` event: 3+ in a row, ring toward 100,
  colors at 5/10/25/50/100, fizzles on a miss; Surprises off hides it; hidden on the mock tab), **bar fills** (`.bar`,
  `.weak-meter`, rank, mastery and drill bars animate from their last width, keyed by container), **view fades** (after a
  `[data-mode]`/`[data-sub]`/`[data-view]`/... click, the largest redrawn area without that row of tabs fades in) and the
  **countdown pill** (`#countdownPill` gets `.sh-cd-eve`/`.sh-cd-day` from `SH_EXPORT.exams`). `widget/rankup.js` gains a
  **queue** (cards take turns), **`shRankUp.trophy`** (coin-spin medal card with rarity) and **`shRankUp.mock`** (results
  card: count-up ring, verdict, best in this hub from `sh_mock_best_<hub>`, bars from the hubs' new `sh:mock-done`
  `byLec`, celebration at 90%+, "See what I missed" clicks `#mockMissed` or scrolls to perio's `#examMissedList`).
  `widget/ranks.js`: `track()` announces newly seen **non-secret trophies** (`sh_trophy_seen`; the first look only records;
  secret ones keep their egg/Timmy moment), the mastery toast is now a trophy card, celebrations wait only while a mock is
  **in progress** (open `[data-mock-pick]`/perio exam choices), `shRanks.celebrate(kind, d)`, previews
  `shRanks.preview("trophy", i)`, `("mastery", 0-3)`, `("mock", right, total)`, and `HUB_NAMES` gains MSK 4, Occlusion and
  PCD 3 (they showed as "Pcd Exam3"). `widget/drill.js`: animated finish screen (check draws, count-up, rows tick in,
  streak rolls up). Dashboard: the hero countdown flips like a departure board (`heroFlap`, `sh_dash_flap`). Hubs
  (`pcd-exam3`, `occlusion`, `msk-exam4`, `perio`) pass `byLec` with `sh:mock-done`. `sw.js` -> `sh-v16`, CI syntax check
  and About page updated. No schema change. **A new hub gets all of this** if its cards use `.qcard` / `.qcard-choice`
  with those state classes, its countdown pill is `#countdownPill`, and its `sh:mock-done` carries `byLec`.

- **2026-10-14 (question progress syncs across devices, Claude Code)** — Every answer was already saved per person
  (`personal_answers`) and "Link my devices" moves a device's rows onto the linked id, but nothing read them back, so a
  hub's own progress stayed per device. `migration_v34.sql` (**applied 2026-10-14 via the connector**) adds public
  `get_my_answers(p_visitor, p_hub)` (one jsonb array `[[qid, epoch s, 1/0], ...]`, oldest first, latest 5000).
  `widget/v3.js` calls it when a hub opens (and when the tab comes back after 3+ minutes), replays the history into
  spaced review (`sh_srs_<hub>`, so the Daily Drill sees misses from every device) and hands per-question totals
  `{qid: {n, c, last, t}}` plus local study days to the hub's **`window.SH_SYNC.merge(byQid, days)`**. The hub keeps
  whichever copy has more tries (nothing local is lost; re-opening doesn't double count), updates its totals, lecture
  stats and days, toasts "Synced N questions from your other devices" and redraws Compendium only in the first 8 s
  (never during a mock or narration). In `occlusion`, `pcd-exam3`, `msk-exam4` and `perio` (its `answered` shape).
  **A new hub gets sync by defining `SH_SYNC` (copy it from `occlusion`).** Link-devices text, About page, `sw.js` →
  `sh-v15`. **Perio Project: carry `SH_SYNC` into the split sources.**

- **2026-10-13 evening (lessons audit, Claude Code)** — A day and a half before PCD Exam 3. Three PCD reports fixed
  (same ids and answer positions): `on-crack-types` no longer labels a choice "Cracked tooth (treatable)" (#18);
  `ve-pbox-3`'s key is now "Plan a more opaque all-ceramic crown", since the Patient Box says bleaching was already
  tried (#15); `ce-isolation`'s key reads "RMGI, because it tolerates moisture and its excess cleans off easily" and the
  explanation says why RMGI counts as moisture tolerant despite its resin (#16). Explanations now answer the class's
  favorite wrong choice on PCD `ce-sbu`, `co-translucent`, `bo-zprime`, `bo-adh-thick`, `co-correct-high`; MSK 4
  `dp-impetigo` no longer quotes the lecture's "option B and D" (not this hub's letters). `question_choices` rows before
  today for the three keys refer to the old wording. **At Sam's request:** `rm-why-now` removed (report #17, "not
  relevant"), and the two matching items `on-cement-match` and `ce-cure-match` (48-50%) split into MCQs: each pair already
  had its own MCQ except two, now `ce-cure-emax` (dual-cured) and `ce-cure-zr` (retentive zirconia: RMGI). Bank 329 -> 328,
  matching 10 -> 8 (the arcade's Shade Match uses the 8 left). No reading text changed, so no narration regenerated.
  `LESSONS.md` refreshed.

- **2026-10-13 (diagram review rule, Claude Code)** — New standing rule above ("Building a hub = diagram review"):
  every hub build, or new lectures added to a hub, includes a review for diagram candidates, and each one goes to Sam
  for approval before it is drawn. `CLAUDE.md` → "Diagrams (the anima skill)" says how a Claude Code session asks.
  No site change.

- **2026-10-13 (anima diagram skill, Claude Code)** — `.claude/skills/anima/`, vendored from Garinmckayl/anima (MIT;
  commit and what was trimmed in its `UPSTREAM.md`), so Claude Code sessions can draw accurate isometric SVG figures
  (anatomy, cells, receptors, drug mechanisms) for the hubs' lecture notes and Review. `CLAUDE.md` → "Diagrams (the
  anima skill)" says how a figure gets into a single-file hub. Cowork/Claude Projects don't load repo skills. No site
  change.

- **2026-10-13 (rank-up and level-up celebrations, Claude Code)** — New `widget/rankup.js`, fetched by `widget/ranks.js`
  the first time it's needed. **A new rank** (Silver -> Gold) is a full-screen cutscene (`shRankUp.tier`): letterbox bars,
  the old medallion shakes and charges while light streams in (canvas sparks), flickers between old and new, then a
  white flash, shockwave rings and a spark burst reveal the new one in front of turning light rays; "RANK UP" ("MAX
  RANK" for Dark Matter) slams in with the new name, old -> new, XP and class place, and what it unlocked (accent
  metal swatch, Timmy Tooth's house upgrade if adopted, next rank). Synthesized riser, boom and fanfare. A tap during
  the build-up skips to the reveal; "Let's go", Esc or a tap outside closes it. **A new level** (Gold I -> Gold II) is
  a non-blocking card (`shRankUp.level`): coin-flip medallion, rolling numeral, the level's bar segment fills, a few
  sparks and a chime; gone after ~6 s or on tap. Both carry their own CSS (the dashboard doesn't load `v3.css`; the old
  `.sh-rankup` rules are gone) and keep only fades under reduced motion. **`shRanks.track(profile)`** now owns the
  "did the rank change?" check (`sh_rank_tier` + `sh_rank_step`) for the hub widget **and the dashboard**, which used to
  overwrite `sh_rank_tier` silently and swallow the celebration if you went there first. It waits for a visible tab and
  for a hub's mock exam to end; Surprises off skips it, as before. Try them from the console:
  `shRanks.preview("tier", 3)` (Silver -> Gold), `shRanks.preview("level", 4, 2)` (Gold I -> II). `sw.js` -> `sh-v14`,
  CI syntax check and About page updated. No schema change.

- **2026-10-13 (Timmy Tooth: holiday outfits and a lot more to say, Claude Code)** — `widget/pet.js`. **Outfits**: every
  holiday has 3 outfits (Halloween 4) and the fall weeks between holidays have 3, replacing the single hat (`OUTFITS`,
  28 in all). He wears the next one each time a page loads (`sh_pet_outfit_<season>`; first visit random). An outfit can
  draw four layers in `art()`: `back` (cape, wings, tail feathers), `face` (glasses, a nose, fangs; may depend on mood),
  `top` (hats; tips with `do-hat`, now wobbles with him) and `prop` (in his left hand, swings with that arm on
  `do-cheer`). Each has `say` lines. **Lines**: 73 jokes (was 32), 30 true tooth facts, 30 musings, greetings and
  small talk by time of day / weekday / month, situational lines (streak, big day, sharp day, second visit, away 3+ days
  via `simulate().away`, exam in 2-7 days, adoption milestones once that day `sh_pet_anniv`, his house upgrades),
  larger holiday pools, comeback / streak-over / long-session / nap / tickle pools. Everything is dealt from shuffled
  decks (`deal()`), and hellos pick by weight (`smallTalk()`/`choose()`), so he talks no more often than before.
  `tools/ci/syntax.js` now checks `widget/pet.js`. About page Parts 6 and 8 updated. No schema change.

- **2026-10-13 (lessons audit, Claude Code)** — Two days before PCD Exam 3. **Select-all options now show a tick box**
  that fills when picked and stays after grading (green right, red wrong), in `pcd-exam3`, `msk-exam4` and `occlusion`
  (CSS only, `.qcard-choice[data-act="multi"]`), from PCD report #14 ("not very clear what options you have selected";
  the picked state was only a thin accent border). PCD `co-afterimage` stem reworded (report #13; same answer and
  choices). Explanations now name the favorite wrong answer on PCD `ce-irm` (TempBond NE), `ve-pbox-3` (light try-in
  paste), `ce-contact-open`, `ce-burnish`, `ce-isolation` and MSK 4 `sk-lamellar` (Langerhans), `dp-clinda`
  (bacitracin). No reading text changed, so no narration regenerated. `LESSONS.md` refreshed.

- **2026-10-10 (lessons audit + MSK Exam 4 dashboard date, Claude Code)** — The 10-08 PCD date fix (9d3463d) also moved
  **MSK Exam 4's** `HUBS` date to 2026-10-15; the hub itself says Fri Oct 16. Back to `2026-10-16` in `index.html`, so
  the card no longer auto-archives (no Open button) at 10 pm on MSK 4's exam eve and check-ins open on the real exam
  day. `LESSONS.md` refreshed: MSK Exam 3 retrospective written (its recap was already on the dashboard since 10-09),
  Live signals for PCD Exam 3 / MSK Exam 4 / Occlusion, new standing lesson on keeping a hub's two exam dates in step.
  **Cleanup still manual:** `hubs/msk-exam3/` (card leaves the dashboard 10-12).

- **2026-10-09 (graded course work rule, Claude Code)** — Standing rule in `CLAUDE.md` → "Content from lecture
  materials": graded quiz, crossword, take-home and exam questions are never copied into a hub; once closed they are
  used as context so every topic they test is covered by hub-written questions; nothing still open is used at all;
  previous years' graded quiz, take-home or exam content is never used, even as context;
  and Sam is asked before any content is removed or excluded for these reasons. MSK Exam 4 already works this way.
  MSK Exam 3 is unchanged (its exam has passed). No site change.

- **2026-10-07 (new hub: PCD Fixed Pros Exam 3, Claude Code)** — `hubs/pcd-exam3/` for the D2 PCD Fixed Pros didactic Exam 3
  (Thu Oct 15, Canvas 8 am-8 pm, 40 questions: 1 multiple answer, 4 matching, the rest MCQ). Built from the Drive folder
  PCD Fixed Pros/Hubs/Exam 3: L1 Cement & Cementation (Dr. Fu; 2026 lecture capture + 2021 recording, which adds crown
  try-in/delivery), L2 Bonding Dental Ceramics (Dr. Lawson), L3 Removing a Crown (Dr. Fu, 2026 capture), L4 Onlays
  (Dr. Robles), L5 Laminate Veneers (Dr. Fu), L6 Color (Dr. Givan) and James Bradley's glaze/add-contact video (labeled `V`),
  plus the course's Exam 3 hint email, which drives src `hint`, the mock blueprint (8/7/3/6/7/7/2) and the Exam Hints tab
  (new hint kind `list`, shown as "exam list"). Built on the Occlusion engine with a new palette/type ("porcelain &
  cement"; DM Serif Display / Figtree / DM Mono). 329 questions (src `slides` / `rec` / `hint`): 309 MCQ, 10 matching
  (4 pairs, unique answers), 5 select-all (5 options, 3 correct), 5 orderings (3-5 steps), 12 EXCEPT, 6 Patient Box,
  9 diagram questions, 40 memory cues; correct answer longest in 33% of MCQs. No two-statement items. 8 drawn figures
  (Munsell solid, additive vs subtractive, specular vs diffuse, veneer prep designs, dog leg, papilla rule, PFM vs zirconia
  cut paths, the bonding "Lego" chain) under the notes and in Review. As taught + Plain English notes with Kokoro
  narration for all 7, review tables, cram sheet, and the arcade reskinned as the Bond Street Arcade (same nine game
  ids, `p_hub:'pcd-exam3'`). Dashboard: new `fixedpros` class on the `pros` ring, `HUBS` + `ARCADES`; `review/` labels,
  `tools/publish-recap.js`, `sw.js` (VERSION sh-v13), About page (arcade table, Diagrams), `assets/og-pcd-exam3.png`.
  Where the 2021 and 2026 recordings disagree (whether to cure the adhesive before seating; whether the patient bites to
  seat), the notes give both and no question turns on it. No schema change.

- **2026-10-07 (new hub: Occlusion Midterm, Claude Code)** — `hubs/occlusion/` for the D2 Occlusion midterm (Wed Oct 21):
  Dr. Givan's five lectures (L1 Review of Basic Occlusion with his "What cusp hits where?" help sheet, L2 TMJ anatomy and
  muscles, L3 mastication/deglutition/speech, L4 occlusal concepts, L5 applying occlusion), built on the MSK Exam 4
  engine with a new palette/type ("articulating paper"; Bricolage Grotesque / Public Sans / JetBrains Mono). 296
  questions (src `handout` / `hub` / `help`), including 20 **drawn diagram questions** (`img:'<FIGS key>'`, rendered by
  `figHTML()` in the bank card and the mock; arcade pools skip them) on the envelope of motion in three planes, cusp
  pathways on a maxillary and a mandibular molar, which inclines collide, and the fence post; 9 Patient Box and 15
  EXCEPT items; no two-statement items. Every figure also sits under its lecture's notes (`FIG_BY_LEC`, outside the
  narrated `.reading-prose`) and in Review (new section type `figs`). Board-exam items in last year's class deck were
  not reproduced. As taught + Plain English notes with Kokoro narration, exam hints quoted from the 9/17, 9/24 and 10/1
  recordings, a 40-question mock (12/8/7/7/6), review tables, and the arcade reskinned as the Freeway Space Arcade (same
  nine game ids, `p_hub:'occlusion'`). Dashboard: new `occlusion` class on the unused `pros` ring, `HUBS` + `ARCADES`;
  `review/` labels, `tools/publish-recap.js`, `sw.js` (VERSION sh-v12) and the About page (arcade table, Diagrams)
  updated. No schema change. **Two exams** (midterm Oct 21, final Thu Nov 19, both in `HUBS.exams` and the hub's
  `SH_EXPORT.exams`), so the hub archives itself the night of the final, not the midterm; the ribbon counts down to
  the midterm, then to the final (`FINAL_DATE`). The final is not cumulative; its new lectures aren't in this hub yet.

- **2026-10-07 (new hub: MSK Exam 4, Claude Code)** — `hubs/msk-exam4/` for GI & MSK Exam 4 (Fri Oct 16): L28 skin
  histology (Herr), L29 derm pharm (Fasinu), L30 dermpath (Dababneh), L31 skeletal muscle (Latimer), L32 NMJ pharm
  (Wilborn) and Dr. Taylor's MSK & skin clinical application (labeled `CA` via a new `label` field and `lecLabel()`).
  Built on the MSK Exam 3 engine with a new palette/type ("dermis & myoglobin"; Newsreader / Instrument Sans / IBM Plex
  Mono). 223 questions: 11 lecture self-checks, 44 rewritten from a classmate's study deck, 168 hub-written, including
  13 EXCEPT, 7 Patient Box (`pbox`) and 2 select-all (`type:'multi'`, perio-style partial credit) items, ported into this
  engine (qCardHTML, the mock exam; arcade pools skip `pbox` items). **No two-statement items in this hub** (Sam, 10-07).
  **Last year's graded Canvas quiz screenshots in the Exam 4 study deck were deliberately left out** (syllabus rule, as in
  #64); their concepts are covered by new questions. As taught + Plain English notes for all six lectures with Kokoro
  narration, a "what's tested" box and comparison tables per lecture, a one-tap quick-start row on Compendium, 35 exam
  hints quoted from the 9/25 recordings, a 40-question mock (7/7/8/7/7/4), review tables, and the arcade reskinned as the
  Skin Deep Arcade (same nine game ids, `p_hub:'msk-exam4'`). Dashboard `HUBS` + `ARCADES`, `review/` labels,
  `tools/publish-recap.js`, `sw.js` precache (VERSION sh-v11) and the About page's arcade table updated. Also fixed in
  this hub only: the bank's search debounce threw after leaving the tab (same bug is in `msk-exam3`, now archived).

- **2026-10-04 (Timmy Tooth is scared of TIMMY, Claude Code)** — After the TIMMY show (`sh:egg-local` `t:"timmy"`),
  `widget/pet.js` sets `sh_pet_scared_until` (now + 5 min, so it carries across the dashboard and hubs) and draws mood
  `scared`: wide eyes with darting pupils, worried brows, a wavy mouth, pale cheeks, a sweat drop and a constant tremble
  (`.is-scared`, off under reduced motion). While it lasts his hellos and most joke taps are `SCARED` lines and he glances
  around when idle; when it ends he says a `CALM` line. The dashboard pet now reacts to TIMMY too (hubs already did).

- **2026-10-04 (TIMMY curses instead of blessing, Claude Code)** — The TIMMY show ended with "TIMMY HAS BLESSED THIS STUDY
  SESSION", which contradicted the setup (the whisper "you shouldn't have said his name", Timmy Tooth's "do NOT type my
  name"). It now reads "TIMMY HAS CURSED THIS STUDY SESSION" with one of six harmless curses (`CURSES` in
  `widget/timmy.js`, picked by the device's summon count, so each summon gets the next one) and "He will return."; the
  closing chord now descends. Timmy Tooth's `EGG_LINES.timmy` gains two lines about it. About page reworded.

- **2026-10-03 (nuke unlocks tracked, Claude Code)** — `widget/v3.js` now calls `record_nuke_unlock` when the nuke badge
  appears (100 right in a row on one page load); before this only launches were saved, so "unlocked but never used"
  could only be guessed. `migration_v33.sql` (**applied 2026-10-03 via the connector**): `nuke_unlocks`, public
  `record_nuke_unlock` (one per person per hub per 5 min), admin `get_nuke_unlocks` (per hub: unlocks, never used =
  no launch before their next unlock, people). `review/` → Engagement shows a "Nukes unlocked" tile and Unlocked /
  Never used columns in Nukes by hub. Not student-visible.

- **2026-10-02 (Timmy Tooth holiday talk, Claude Code, #63)** — `HOLIDAY_TALK` in `widget/pet.js` replaces the single
  `HOLIDAY_HELLO` line per holiday: greetings, right/wrong-answer quips and jokes for each holiday, plus a `fall` pool for
  autumn weeks without one (`isFall()`). `deal(key, arr)` hands lines out from a shuffled deck per pool
  (`sh_pet_deck_<pool>` in localStorage): every line before a repeat, never twice in a row; the regular jokes use it too.
  Seasonal greetings now show in hubs (40% of hub hellos in a holiday, 15% in fall), 75% of dashboard hellos in a
  holiday; 40% of answer quips and 50% of jokes are seasonal in a holiday. About page updated.

- **2026-10-02 (Timmy Tooth "do NOT type my name", Claude Code, #61)** — Reverse-psychology hint for the TIMMY egg:
  `DONT_SAY` lines in `widget/pet.js`, used in ~20% of dashboard hellos (when no holiday/HP line takes the slot) and ~12%
  of hub hellos, plus the last entry of `TIPS`. Never with Surprises off (`eggsOn()`).
- **2026-10-02 (archived banks and the MSK PollEv set off the public site, Claude Code)** — `question-banks/` (GI Exam 1
  and 2 banks plus their extract scripts) deleted and gitignored, so past banks aren't publicly downloadable by later
  classes; `review/`'s `ARCHIVE_BANK` is gone (an archived hub's recap there has no question text; publish with
  `tools/publish-recap.js --bank <local file>` before the page comes down). The 23 MSK PollEv exam-review items
  (`rv-*`, `src:'review'`) removed after Exam 3; the bank's "Exam review set" callout hides itself when empty, and the
  source filter lists only sources that have questions. **To recover them** (they stay in git history):
  `git checkout 1e6b580 -- question-banks` restores the folder; `git show 1e6b580:hubs/msk-exam3/index.html` has the
  `rv-*` items (the block after "Exam review (PollEv review session"). Copy them somewhere private first if this repo
  is ever recreated with fresh history. **MSK Project: drop the
  `rv-*` items from the split sources too.**
- **2026-10-02 (check-ins ask for topics, not exam questions, Claude Code)** — The exam check-in's last question is now
  "Any topics or question formats the hub missed or barely covered?" with a note asking people not to write out exam
  questions or answers (the honor code keeps exam content private; the DENT 2155 syllabus bans copying any part of an
  exam). Answer key `missed` unchanged, so `review/` and the audit queries still read it. `/lessons-audit` now says to
  use a check-in only as a topic or format, never to rebuild an exam question from one. About page entry updated.

- **2026-10-02 (TIMMY easter egg, Claude Code, #59)** — `widget/timmy.js`: typing TIMMY (outside a text field, or into a
  hub's Search box) runs a 15-second overlay show (dark fade, page crumbles, crowned Timmy with cursor-tracking eyes,
  letters slam in, mini-Timmy rain, "blessed this study session" banner, page restored). Esc / corner button ends it;
  reduced-motion skips crumble, starfield and rain. Separate from Timmy Tooth (`pet.js`), who gets an `EGG_LINES.timmy`
  reaction via `sh:egg-local` when the show ends. Off with Surprises (`sh_pref_eggs`), never during a mock. Loaded by
  `v3.js` in every hub and by `<script>` on the dashboard and review page. Per-device counter in `sh_timmy_count`.
  On the About page (Part 7, behind spoilers; added in #60). No trophy.

- **2026-10-02 (MSK `nq-folate-case` explanation, Claude Code)** — Report #12: "is trouble concentrating not a neurologic
  symptom?" The stem lists trouble concentrating while the explanation said "without neurologic symptoms". Answer and
  stem unchanged; the explanation now says the concentrating trouble comes from the anemia (like the fatigue) and names
  the B12 signs that do separate it (numbness/tingling, lost vibration/position sense, gait: subacute combined
  degeneration). **MSK Project: carry this into the split sources.**

- **2026-10-02 (undo on ordering questions, Claude Code)** — From suggestion #3 (MSK). Ordering (sequence) cards gain
  **Undo last step** and **Start over** under the steps, shown once a step is tapped and hidden once graded (the last
  step is forced, so it still grades on the final tap). MSK: `data-act="seq-undo"/"seq-clear"` in
  `wireQuestionContainer`, `[data-role="seq-tools"]`; perio: `.qcard-seq-tools [data-seq-tool]`, which restores each
  step's text. About page entry added. **Perio and MSK Projects: carry this into the split sources.**

- **2026-10-02 (memory cues on missed questions, Claude Code)** — From a student suggestion ("when you miss a question, give
  a way to remember it"). A perio question can carry `cue:"..."`, a mnemonic or hook drawn inside the explanation as
  **Remember it:** (`cueHTML(q)`, `.qx-cue`), shown only after a miss: a wrong MCQ pick, a partly wrong select-all, a
  sequence or matching with a mistake, or "I missed it" on a recall card (`markMissed()` adds `.missed` to the
  explanation). Works in the bank, the daily drill and the mock's missed-question review, which all use `qCardHTML`.
  80 cues written for every perio item under 80% class accuracy with 8+ attempts (plus q5-01/q5-06). **MSK** too: its
  88 cues (items under 75%, 8+ attempts) live in one `QUESTION_CUES` map applied to `QUESTIONS` (its bank is built by
  `mcq()`/`seq()` calls); `finishCard()` adds `.is-missed`, and the submitted mock marks missed cards the same way.
  No reading text changed, so no narration regenerated. **Perio and MSK Projects: carry the cues, `cueHTML` and the
  CSS into the split sources. A new hub gets cues by rendering `q.cue` the same way.**

- **2026-10-02 (Timmy + trophy follow-ups, Claude Code)** — `migration_v32.sql` (**applied 2026-10-02 via the connector**):
  `get_trophy_stats()` (public: people per trophy out of everyone who has answered, same rules as `get_rank_profile`),
  shown as a % pill under each trophy in the trophy case and in its detail line; `record_achievement` accepts
  `pet-adopt` (hub = the adoption day), so **adopting Timmy follows you to your other devices** (`shPet.syncBadges`,
  called from the dashboard's `loadMyRank` and `widget/ranks.js`; existing adopters are backfilled once,
  `sh_pet_adopt_sent`). Closing his introduction any way but "No thanks" now adopts him (he could stay stuck on your
  name). **Secret tips**: a "Secret tip" button on his house, every 4th tap, and some hub greetings walk through how to
  find each egg (`TIPS` in `widget/pet.js`; the current holiday's word first). **House**: mastery pennants fly from a
  flagpole in the yard (were strung across the sky from nothing), the TIMMY nameplate is a plaque above the door,
  winter covers the whole yard in snow with a snowman, and **fall** (Sep 22 - Nov 30, `isFall()`) adds a tree with
  turning leaves (try `localStorage.sh_egg_holiday_test = "fall"`). **Full Arch fix**: the teeth after #16 drew below
  the chart (the pop animation's CSS transform replaced each tooth's flip); each tooth now sits in a positioned group.
  **About the hubs** (`about/index.html`, linked from an "About" button in the dashboard top bar and the footer): every
  feature, easter egg, holiday and trophy with how to find it. Easter-egg walkthroughs and secret trophy names sit behind a
  "Show spoilers" switch (`sh_about_spoilers`); trophy rates load live from `get_trophy_stats`. **When you add a feature,
  egg or trophy, add it to this page too.** On phones under 430 px the dashboard wordmark shows only its rings so the top
  bar fits on one line. `tools/ci/syntax.js` now checks `about/index.html`.

- **2026-10-01 (mastery flair, new eggs, Timmy Tooth, Claude Code)** — `migration_v31.sql` (**applied 2026-10-01 via the connector**):
  the leaderboards (`get_leaderboard`, `get_correct_streak_stats`, `get_arcade_leaderboard`, `get_rank_board`, `get_fairy_board`) gain a
  `flair` column ("perio:3,msk-exam3:1"; 1 bronze … 4 crown, from the mastery-* achievements via `sh_mastery_flair`), drawn as
  medals by `shRanks.flair()` next to names on every dashboard board, both hub arcade boards and the rank cards; a new mastery tier
  gets a toast. New eggs in `widget/eggs.js` (all announce a `sh:egg-local` event): **mirror** (type it; flips the in-flow body
  children, `.sh-mirror-flip`), **Full Arch** (a 32-tooth chart bottom-left; right answers add a tooth, misses knock one out;
  **once per hub**, `sh_egg_arch_done_<hub>`, and ranks.js retires it when the server badge `fullarch:<hub>` exists),
  **Floss Chain** (3+ people type floss in the same hub within 60 s, over the presence `egg` broadcast), **Cavity Search**
  (weekly, one paragraph of each hub's Lecture Notes picked from `SH_EXPORT.sections` kind Notes; first 5 to tap it,
  `claim_cavity`/`get_cavity_week`, shown in the Stats egg board), **holidays** (Halloween, Thanksgiving, winter, New Year,
  Valentine's, Dentist's Day, St Patrick's, Easter: themed confetti via `window.shConfettiTheme`, a costumed Plaque Boss and a
  magic word each; Halloween runs all of October (Oct 1-31; the others keep their short windows); try one with `localStorage.sh_egg_holiday_test = "halloween"`). Magic words also work typed into the hub Search
  box (phones). 7 new secret trophies (24 total). **Timmy Tooth** (`widget/pet.js`, loaded by v3.js and the dashboard): an
  optional cartoon tooth (Settings → Timmy Tooth: Everywhere / Dashboard only / Off, `sh_pref_pet`). Before adoption he perches
  on your name; tapping opens the intro; afterwards he lives in his house card (`#petHome`) and in each hub's bottom-left corner
  (hidden during mock exams). HP comes from `get_pet_days` merged with the device tally `sh_pet_log` (heal per right answer +
  streak bonus, decay per missed day, half-speed healing after 0 until 50); ailments drawn by HP: plaque, stains + gingivitis,
  caries, periodontitis, fracture, bandage. `prefSet` in v3.js now fires `sh:pref`. **His house** (`houseSvg`) is decorated
  by what you earn (`UPGRADES`: one item per handpiece tier from `sh_rank_tier`; a pennant per mastered hub and a roof crown
  from `sh_rank_flair`, which ranks.js and the dashboard write and announce with `sh:rank`) and by the holiday calendar.

- **2026-10-01 (MSK `ex-mets` fix, Claude Code, #51)** — Report #11: the bone-metastasis EXCEPT question keyed
  "Colon", but the notes list colon as a source ("BLT with a Kosher Pickle, plus colon"). The exception is now "Brain"
  (same position); explanation updated. Earlier `question_choices` rows for it refer to "Colon". Report resolved with a
  reply. **MSK Project: carry this into the split sources.**

- **2026-10-01 (suture-diagram questions, Claude Code)** — 14 perio picture questions (`q2-D01`-`q2-D14`): a question
  with `img:'<SUTURE_DIAGRAMS key>'` draws that diagram above the stem (`figHTML()`, in the bank card and the mock exam;
  "Diagram" chip; bank type filter "Suture diagrams"; arcade games skip them). Labels that would give the answer away
  carry `class="sd-hint"` and are hidden inside `.qcard-figure` (still shown in Review). `SUTURE_DEFS` (gradients) is
  now added to the page once in `boot()`. Bank 343 → 357. **Perio Project: carry these into the split sources.**

- **2026-10-01 (suture diagrams, Claude Code)** — Perio Review → Incisions, Flaps & Sutures gains **Suture diagrams**:
  illustrated inline-SVG figures (`SUTURE_DIAGRAMS`, shared gradients in `SUTURE_DEFS`, fixed illustration colours on a
  light plate, captioned): simple loop and figure-of-eight as interdental cross-sections, sling and criss-cross as
  occlusal views, mattress sutures as surface + section, continuous/locking on a ridge, periosteal anchorage in
  section, plus monofilament vs braided, because 5 of 14 midterm check-ins said the exam showed suture
  pictures. Drawn for the hub, not from the slides; Sam reviewed them before merge. **Perio Project: carry these into
  the split sources.**

- **2026-10-01 (fourth lessons refresh: exam formats, midterm settings out, Claude Code)** — From the perio midterm
  check-ins (n = 14): the exam used two-statement and "all EXCEPT / NOT" questions, suture pictures and staging details
  the class charts left out. **Perio**: 20 two-statement items (`fmt:'2stmt'`, `q1-S01`-`q4-S04`; choices always in
  the fixed order both true / both false / 1 true 2 false / 1 false 2 true, via `choiceOrder()` in the card and the
  mock exam; arcade games skip them) and 21 EXCEPT/NOT items (`fmt:'except'`, `q1-E01`-`q4-E06`, plus `q1-A02`); a
  **"Staging and grading: the full 2018 AAP/EFP tables"** review table (`AAP_STAGING`, `AAP_GRADING`) and 12 items with
  the new source `aap` ("2018 AAP/EFP tables", `q1-A01`-`q1-A08`, `q1-S06`-`q1-S09`); bank type filter gains
  "Two-statement" and "EXCEPT / NOT"; `.qcard-stem` keeps line breaks (`white-space:pre-line`). Bank 296 → 343.
  **Midterm-only settings removed** (Sam: the final is cumulative): "Not on midterm" chips, the bank's Midterm-scope
  option, the mock exam's scope toggle (always all 9 sessions), the Course Home midterm card/stat/milestone, the
  notes nav "Midterm" divider, arcade "Midterm · S1-4" scopes, the drill's midterm scope and the ribbon's midterm
  countdown; `MIDTERM_INFO` deleted. Kept: `MIDTERM_DATE` (SH_EXPORT exams, dashboard check-ins), the `mid:false`
  fields (now unused) and the notes' "(not on the midterm)" headings, which are narrated reading text (edit them only
  with new narration). Explanations: perio `q3-M01` (plaque index), `q4-M05` (motile bacteria); MSK `h-tu-mdm2`,
  `h-nut-vitA-epith`, `h-tu-gct-demo`, `h-tu-match`. **MSK**: 15 EXCEPT/NOT items (`ex-*`), bank 287 → 302. No reading
  text changed, so no narration regenerated. **Perio and MSK Projects: carry these into the split sources.**

- **2026-10-01 (recaps no longer time out + Perio Midterm recap, Claude Code)** — `get_hub_recap` timed out for perio
  (the API stops anon calls at 3 s): it counted each person's answers and days by re-scanning all pings/answers once per
  person, and ran the slow `anon_name()` (~15 ms) for all 118 people when the recap names 3. `migration_v30.sql` (applied
  via the connector) aggregates once and names only the people shown: same output, perio ~1.6 s, MSK 1.1 s. **Perio
  Midterm** recap published (`tools/publish-recap.js perio --exam 2026-10-01 --title "Perio Midterm"`, names on,
  featured question limited to midterm scope by passing a bank without `mid:false` items). `hub_recaps` holds one recap
  per hub, so publishing the perio final's recap will replace this one.

- **2026-10-01 (exam check-ins save on exam day, Claude Code, #46)** — `submit_exam_debrief` refused any exam dated
  today, but the dashboard opens check-ins on exam day (button from 8 am, perio midterm pop-up from 10 am), so the 2
  perio midterm check-ins sent that morning were dropped (answers not recoverable; the request logs hold no bodies).
  `migration_v29.sql` (applied via the connector) accepts exam day, never a future date. The dashboard's check-in
  pop-up now waits for the save and says "That didn't save" instead of always thanking.

- **2026-10-01 (nuke stays local on exam day, Claude Code)** — On the day of any of a hub's exams
  (`SH_EXPORT.exams`, local date), a tactical nuke plays only for the person who launched it: `launchNuke` in
  `widget/v3.js` skips the `nuke` broadcast and the receiver ignores one too (`isExamDay()`), so stale clients can't
  interrupt classmates either. The launch is still recorded (`record_nuke_launch`). No schema change.

- **2026-10-01 (select-all picks + shorter select-alls, Claude Code)** — **Select-all questions now record which options
  were ticked**: perio's `recordAnswer` passes the ticked indexes (practice and mock exam) as `detail.picks`, and
  `widget/v3.js` sends them in one call to `record_choices` (`migration_v28.sql`, applied via the connector), one
  `question_choices` row per option. For a multi item a row's `picks` = times that option was ticked (none before
  today). Perio's `SH_EXPORT` questions carry `correct` for multi items; `review/` shows a select-all's key and its
  most-ticked wrong option; `tools/lessons-join.py` lists ticks per option (+ key, - wrong). **Any hub with select-alls:
  pass the ticked array as the 4th argument of its answer call.** The three 7-option select-alls are now 5 options with
  3 correct (standing lesson): perio `q3-M01` (UniFe), `q2-P01` (augmentation flap), `q1-M03` (Phase I); ids kept, so
  their `question_stats` mix both versions from today. `sw.js` → `sh-v10`. **Perio Project: carry these into the split
  sources.**

- **2026-10-01 (third lessons refresh, Claude Code)** — Midterm-morning refresh. Perio `q3-P02` (report #10): the Patient
  Box now lists the radiographs ("Deep, narrow vertical bone defects on those teeth", as the notes describe the case) and
  the explanation walks stage, extent and grade from the box. Explanations now name the tempting wrong option on perio
  `q4-L11` (tooth extruding after losing its antagonist), `q1-M02`, `q4-M05`, `q2-P01` (split-thickness) and MSK
  `h-ai-mikulicz` (sicca), `qz-rickets` (unmineralized osteoid goes up). No reading text changed, so no narration
  regenerated. `LESSONS.md` refreshed. **Perio and MSK Projects: carry these into the split sources.**

- **2026-10-01 (lessons-audit skill, Claude Code)** — `/lessons-audit` (`.claude/skills/lessons-audit/SKILL.md`) runs the
  lessons refresh on demand in a Claude Code session: all data plus "since last time", a check of whether the last
  refresh's fixes worked, reading every hard question, safe explanation edits, `LESSONS.md`, a draft PR and draft replies
  to reports. Helpers: `tools/dump-banks.js <dir>` (each live hub's QUESTIONS/LECTURES as JSON, the CI lint's hook) and
  `tools/lessons-join.py` (accuracy by lecture/type/source and the hardest items with their favourite wrong answer).
  The audit also reads **check-ins against each person's study time**, and when a hub's last exam has passed it writes
  that hub's full retrospective and **publishes its recap to the dashboard** without asking (Sam, 2026-10-01) via
  `tools/publish-recap.js <hub> --bank <file> [--dry-run]` (same snapshot as `review/` → Recap; needs `SB_KEY` +
  `ADMIN_SECRET`; exam date from `index.html`, since `get_hub_recap` can time out without one). **CI lint**: a matching
  item that repeats an answer now fails (`SAME_ANSWER_OK` lists perio `q4-L27`, which perio grades by text), and 6+
  step orderings / 7+ option select-alls are listed as a heads-up. No site change.

- **2026-09-30 (bronze without patina, Claude Code)** — The green patina specks are gone from the Bronze handpiece
  medallion too (`filters()` in `widget/ranks.js`); Sam found them ugly. Accent tiles were already clean.

- **2026-09-30 (accent textures fixed + Stone/Antique, Claude Code)** — The metal accents are now **pre-rendered PNGs**
  (`assets/tex/<key>.png`, made by `tools/make-accent-tex.js` from `shRanks.accentSvg()`; bump `TEX_V` in
  `widget/ranks.js` when you regenerate): the SVG-filter data URIs didn't show up for students (Safari/phones). Bronze
  lost its green patina specks; new **Stone** (everyone) and **Antique** accents with quieter grain than the medallions.
  The texture also covers the ribbon's exam countdown pill, and the **dashboard** now applies the accent to its primary
  buttons (it never applied it before).

- **2026-09-30 (luck moves to the dashboard + metal accents, Claude Code)** — The hubs' exam "luck wall" pop-up
  (`widget/eggs.js`) is gone (#35: it got in the way of last-minute studying). The dashboard's next-exam card now has a
  **Send luck** row the day before and the morning (before 2 pm) of the exam: one per person per exam, with the class
  count and the latest names (`exam_luck`, `get_exam_luck`, `send_exam_luck`; `migration_v27.sql`, applied via the
  connector). **Unlocked accents are now metals**: `widget/ranks.js` `accentTex(key)` draws the medallions' own
  gradient + texture filter on a stretchable SVG tile, and `applyAccent` sets `data-sh-accent` and `--sh-tex` on
  `<html>`; `widget/v3.css` paints it on primary buttons, switches, multi-answer boxes, untagged progress bars and the
  drill badge (text/borders keep the flat `--accent`). Settings swatches (hub widget and dashboard) show the metal.
  **A new hub gets the textures if its primary buttons use `.btn.primary` / `.qs-btn.primary` and its bars `.bar i`.**

- **2026-09-30 (second lessons refresh, Claude Code)** — `LESSONS.md` refreshed with all data to date (last refresh's
  fixes checked: `q2-03` 30% → 61%, `q4-L27` 20% → 44%, perio under-5-minute visits 40% → 17% on midterm eve). New
  standing lesson: ordering questions over 4-5 steps and select-all questions with many options barely work.
  Explanations now name the favourite wrong answer on MSK `h-dr-hypoCa` (hyporeflexia), `h-tu-gct-arthritis`
  (osteochondroma), `h-ai-sle-ab` (anti-Ro/La) and perio `q3-M01` (UniFe inputs). No reading text changed, so no
  narration regenerated. **Perio and MSK Projects: carry these into the split sources.**

- **2026-09-29 (first lessons refresh, Claude Code)** — `LESSONS.md` refreshed from all data since 09-25 (Live signals
  written; new lessons on duplicate matching answers, explanations that name the favourite wrong answer, exam harder
  than hub + Patient Box questions). Perio: matching questions now grade by answer text in practice and mock
  (`q4-L27` listed "4-6 weeks" twice, so the other copy was marked wrong); `q2-03` and `q4-15` explanations cover the
  most-picked wrong answer. MSK: `sl-calcitriol` explanation covers cholecalciferol; a wrong ordering question now
  says "Not quite: k of n in the right spot". Perio Course Home gets a **quick-start row** at the very top (`.quick-start`:
  Practice questions (midterm scope until the midterm, with an untried count), Daily drill, Lecture notes), because
  23 of 58 visitors left within 5 minutes of landing there; clicks show as `practice=`, `sh-drill=quick`. Widget Search
  stays (Sam, 2026-09-29) though nobody has opened it yet. No reading text changed, so no narration regenerated.
  **Perio and MSK Projects: carry these into the split sources, or the next single-file build reverts them.**

- **2026-09-30 (one inbox, Claude Code)** — The Inbox is now the same on every hub and the dashboard: notices are no
  longer filtered by hub (`site_notices.hub` only labels which hub a notice is about), and pop-ups go out on whichever
  page someone opens first. Read state was already shared (server for replies, `sh_notice_seen` for notices).
  An **Inbox button now sits in each hub's top bar** beside the name (`.sh-ribbon-inbox`, added by `widget/v3.js`
  before `#themeBtn`), so it's reachable from every page. **Text size fix:** the size setting zooms `<html>`, and
  `vh`/`vw` inside a zoomed page overshoot the screen, so the inbox now sizes inside its fixed `inset:0` layer and the
  pop-up measures the real viewport (`fitViewport`); only the pop-up's message scrolls, so its buttons stay visible.
  `sw.js` → `sh-v9`. **Any new fixed overlay: don't size it with `vh`/`vw`.**

- **2026-09-29 (student inbox, Claude Code)** — Replies to your reports/suggestions (90 days) and notices to everyone
  (60 days) now stay in an **Inbox**: an item in the hub widget menu (unread count; a dot on the desktop launcher and the
  phone More tab) and an inbox button in the dashboard top bar (`[data-sh-inbox]` opens it, `.sh-inbox-badge` shows
  unread). Opening it marks everything read. The one-time pop-up moved from top-center to the **bottom-right** (above
  the phone bar). `get_my_inbox` (`migration_v26.sql`, applied via the connector). Admin Inbox: "Tell everyone" now has
  its own title + message box, started from the reply so it can be reworded for the class. `sw.js` → `sh-v8`.

- **2026-09-29 (replies to reports + notices to everyone, Claude Code, #29)** — Reports and suggestions now store the
  sender's `visitor_id`, and resolving one can carry a `reply`. `widget/replies.js` (loaded by v3.js and the dashboard)
  shows it to the sender once on their next visit (`get_my_replies`, `mark_reply_seen`). **Always write the reply when
  resolving** (for a question report: what was wrong and what changed). Admin Inbox: reply box, "Resolve & notify", and
  "Tell everyone", which posts a **notice** every visitor sees once (`site_notices`, `get_notices`, `admin_post_notice`;
  hub null = every page, 14 days; seen per device in `sh_notice_seen`). The student insert policies now refuse a
  reply/resolved row. Rows from before today have no sender, so only a notice reaches them. `migration_v25.sql` (applied
  via the connector). First notice: the `cw-osteosarcoma` fix (report #7; its stem now says "Malignant", Osteoma →
  Ewing sarcoma). `sw.js` → `sh-v7`. **MSK Project: carry the `cw-osteosarcoma` change into the split sources.**

- **2026-09-29 (daily lessons refresh, Claude Code)** — New routine "Daily lessons refresh" (fresh cloud session
  each day) runs `tools/lessons-refresh.md`: queries in `tools/lessons-daily.sql` (every report, suggestion, check-in,
  survey answer and zero-result search since the last run, use per hub, hardest/easiest questions, popular wrong
  answers, mocks, drill), rewrites `LESSONS.md`'s new "Live signals" section and "Last refreshed" date, and opens a
  draft PR with small data-backed fixes to live hubs (bigger ideas go to Sam in the PR). New hubs: refresh first if
  the date isn't today. No site change by itself.

- **2026-09-29 (automatic archiving, Claude Code)** — The dashboard (`index.html`) archives a hub by itself at 10 pm on
  the day of its last exam (`ARCHIVE_HOUR`) and removes the archived card 10 days later (`CARD_DAYS`; `hideCardOn`
  overrides; GI Exam 2's goes 2026-10-06). "Check in" buttons show from 8 am on exam day (`CHECKIN_HOUR`); the pop-up
  goes out from 10 pm, or an exam's `promptHour` (perio midterm: 10 am), and still reaches first visits up to
  `DEBRIEF_DAYS` (60) after. `widget/v3.js` shows an "This hub is archived" notice once per visit on a hub page opened
  after that time (from `SH_EXPORT.exams`). Retrospective and removing the hub folder are still manual.

- **2026-09-29 (MSK exam review set, Claude Code)** — The 23 PollEv exam-review questions (Sam: the professor said six
  are verbatim on Exam 3 and the rest very similar) added to `hubs/msk-exam3` as `rv-*` with a new source `review`
  ("Exam review (PollEv)"), stems/choices as given (typos fixed only). Question Bank has an "Exam review set" callout
  with a one-tap filter; the Daily Drill counts them as high-yield (`DRILL_HY.review`). They overlap older `sl-*` Slido
  items on purpose (the wording matters). Bank 264 → 287. No reading text changed, so no narration regenerated.
  **MSK Project: carry these into the split sources, or the next single-file build drops them.**

- **2026-09-29 (Anki deck vetting, Claude Code)** — Vetted the class Anki decks (Drive: 7 "MSK & GI Exam 3" decks + last
  year's Exam 3 practice deck; the D2 Perio Midterm and Practice Questions decks) card by card against each bank and the
  lecture notes; only real gaps were added, nothing imported wholesale. MSK +5 (`h-jt-oa-case`, `h-nut-vitA-epith`,
  `h-nut-iron-us`, `h-ai-sjogren-lymph`, `h-dr-teri-limit`), perio +2 (`q1-31` Stage 3 vs 4, `q1-32` grading vs staging).
  PerioChip corrected from 1.5 mg to **2.5 mg** chlorhexidine (review table, `q8-11`, arcade clue). The D2 Perio Final
  Exam deck (S5-S9) is on hold until those sessions are taught. No reading text changed, so no narration regenerated.
  **MSK and Perio Projects: carry these into the split sources, or the next single-file build reverts them.**

- **2026-09-29 (retrospectives + new tracking, Claude Code)** — New standing rule: archiving a hub includes a
  retrospective from all its data; `LESSONS.md` (standing lessons + a GI Exam 2 retro written from its data) and
  `tools/retro.sql` (the queries). Two new data sources (`migration_v23.sql`, applied via the connector):
  **exam check-ins** (how ready they felt, how it went, hub vs exam, what the hub missed, with a line saying answers
  go to the AI that builds the hubs), stored in `exam_debriefs` via `submit_exam_debrief`. Pop-up once on a person's
  first dashboard visit after an exam they studied for, however late (`sh_debrief_<hub>_<date>` = shown; replaces that
  visit's survey). Every hub card with an exam in the last 60 days (`DEBRIEF_DAYS`) has a **Check in** button, and
  people can send several (up to 10 per exam, `migration_v24.sql`, applied). **Archived hubs** now go into
  `ARCHIVED_HUBS` in `index.html` (move the `HUBS` entry, keep `exams` + `stateKey`): a greyed "Archived" card with
  the check-in button, shown for 60 days after its last exam. GI Exam 2 is the first one. **Search terms** — the widget's Search sends the term (lowercased, 3-60 chars, 1.5 s
  after typing stops, once per term per page load) and its result count to `record_search` → `search_terms`.
  Admin page Surveys tab shows both (`get_exam_debriefs`, `get_search_terms`, admin only).
- **2026-09-29 (perio: ordering-question feedback + q4-49, Claude Code)** — From student report #6. Finished sequence
  questions never showed right/wrong: `.qcard-seq-steps .qcard-choice[data-picked]` out-ranked the `data-state` colours.
  Now the steps re-sort into the tapped order, turn green/red, wrong ones say "Belongs in step N", and a verdict line
  ("Correct" / "Not quite: k of n in the right spot") sits under them. `q4-49` (a trivial 4-step disclosing-tablet order)
  is now an MCQ on why the rinse is brief (same id, so its old `question_stats` rows were a sequence). **Perio Project:
  carry both into the split sources, or the next single-file build reverts them.**
- **2026-09-29 (MSK mock exam blueprint, Claude Code, #21)** — `MOCK_BLUEPRINT` in `hubs/msk-exam3` now uses the official
  Exam 3 question counts per lecture: L19 4, L20 4, L21 6, L22 4, L23 4, L24 5, L25 4, L26 5, L27 4 (40). Intro text updated.
  **MSK Project: carry this into the split sources, or the next single-file build reverts it.**
- **2026-09-29 (answer choices that gave the answer away, Claude Code)** — From a student report on perio `q2-02` (wrong
  choices were labeled "(… monofilament)" while the stem asked for the braided suture). Audited all 499 MCQ/multi items in
  both hubs for the same kind of giveaway: labels on choices that rule themselves out, stem wording echoed only by the
  answer, and wrong choices nobody would pick. Fixed 16 perio items (`q1-12`, `q1-14`, `q1-19` (stem reworded), `q1-27`,
  `q2-02`, `q2-21`, `q2-22`, `q7-01`, `q7-04`, `q7-06`, `q7-09`, `q8-01`, `q8-07`, `q8-10`, `q9-02`, `q9-04`) and 8 MSK
  items (`dq-ckd`, `h-jt-gout-chronic`, `h-ca-stickler`, `h-bo-oi-ar`, `h-bd-ccd`, `h-tu-alveolar`, `h-he-paget-tx`,
  `h-jt-reactive-time`). Where a label was removed, the explanation now says it instead. Answer positions are unchanged;
  `question_choices` rows recorded before today for these ids refer to the old wording. **Perio and MSK Projects: carry
  these into the split sources, or the next single-file build reverts them.**
- **2026-09-28 (Daily Drill, Claude Code)** — From a survey answer ("a daily drill of questions I missed + high-yield so
  they stay fresh"); the old "Due today" list in Weak Spots had 1 click per hub. `widget/drill.js` (loaded by v3.js) picks
  10 questions a day per hub, frozen for the day in `sh_drill_<hub>`: spaced-review items due (`sh_srs_<hub>`, up to 6),
  older misses (latest try wrong, up to 8 with those), then high-yield ones from lectures you've studied (lowest class
  accuracy in `question_stats` with 5+ attempts, plus the hub's own flag), max 3 per lecture; shortfalls filled from the
  rest. **Spaced review gaps shortened** (hubs are live ~a week before the exam): right answers come back after 1, 2, 4,
  then 7 days (was 1/3/7/14/30), never later than the day before the hub's next exam (`SH_EXPORT.exams`), and only the
  first right answer of a day moves a question along (`t` = last day); a one-time pass (`sh_srs_<hub>_v` = 2) pulls in
  reviews scheduled under the old gaps. One question at a time in a full-screen sheet with a reason tag ("You missed this last time", "High-yield: the class
  gets this right 41%..."), a done screen with results, **10 more**, and a drill streak (`sh_drill_days`, any hub). Hubs
  provide `window.SH_DRILL = { pool(), render(el, qid), scope }` (just before `SH_EXPORT`); answers go through the hub's own
  handler, so class stats, SRS, XP and Weak Spots update as usual. Entry points: a Drill tab in the phone bar (badge = due
  count or progress), a desktop chip beside the launcher (hidden once done), `[data-sh-drill]` buttons (perio Course Home
  and both Weak Spots tabs, where it replaces "Due today"), and `hubs/<id>/#drill`, which the dashboard's new drill row on
  each hub card and the hero's "Daily drill" button link to. Time in it logs as `drill/daily`. Perio stays in midterm scope
  until Oct 1 and flags `exam-review` questions; MSK flags `quiz`/`lecture-quiz`/`slido`. Perio's `markExplain` now reveals
  the answered card's own explanation (the same question can be on screen twice). `sw.js` → `sh-v6`. No schema change.
  **A new hub gets the drill by defining `SH_DRILL`. Perio and MSK Projects: carry the `SH_DRILL` block, the Daily drill
  buttons, the `bolt` icon (MSK) and `explainOf` (perio) into the split sources, or the next single-file build drops them.**
- **2026-09-28 (perio: two student reports fixed, Claude Code, #15)** — Self-graded cards (recall questions via
  `qCardHTML`, and Active Recall) now keep the tapped grade button highlighted (`data-picked`, `--good-soft`/`--bad-soft`),
  dim the other and add a "Saved as right / missed" note (`markGraded()`). The grade was always saved, but the buttons
  looked unchanged, so it read as broken (report #3). `q3-47`'s explanation now states the 10% "resistant" figure and
  separates it from the slide's 10-15% / 20-25% numbers; unused choice "About 35%" → "About 25%" (report #4). Both reports
  marked resolved. **Perio Project: carry these into the split sources, or the next single-file build reverts them.**
- **2026-09-28 (hub recap slideshow, Claude Code)** — Published recaps play on the dashboard in a **Hub recaps** section
  (after Hubs; hidden until one is published): image on the left, title/summary, prev/next, Save image, and a list whose
  active item's bar times the 8 s autoplay (pauses on hover/focus/hidden tab; swipe and arrow keys; slide + fade
  transition, opacity-only under reduced motion). The Recap tab's **Publish to dashboard** stores a snapshot
  (`shRecap.snapshot`: only the fields `draw()` reads, names dropped when unticked) via `admin_publish_recap`;
  `admin_unpublish_recap` removes it; the dashboard reads `get_published_recaps()` (public) and draws each with the same
  renderer, lazily loading it plus Fraunces/Work Sans only when there's something to show. `migration_v22.sql` (table
  `hub_recaps`, applied via the connector). **`review/recap.js` moved to `widget/recap.js`.** GI Exam 2 published
  2026-09-28 (names on).
- **2026-09-28 (recap awards + saved mock scores, Claude Code)** — The Recap image gains an **Awards** panel: Question
  machine (most answers), Unbreakable (longest correct streak), Bookworm (most time in lecture notes: sections ending in
  `notes`/`lecture-notes`), Arcade champion (most time in `arcade/*`) and Mock exam ace (best score on a 20+ question mock,
  up to the exam day). Each only shows when the data exists; the image height grows with the number of awards
  (~1,970 px with all five). New `mock_scores` table + public `record_mock_score` (validated, one per person per hub per
  minute), called from `widget/ranks.js` on `sh:mock-done`, so mock scores are saved from 2026-09-28 on (none before).
  `migration_v21.sql` (applied via the connector) also replaces `get_hub_recap` to return `awards` and `mocks_taken`.
- **2026-09-26 (hub recap, dashboard rank + settings, Claude Code)** — **Recap tab** on `review/`: pick a hub (live or
  archived) and it draws a 1080x1640 shareable image (`review/recap.js`, canvas; Download PNG, or Share on phones) with
  hours studied, classmates, answers, class accuracy, hours per day up to the exam, the day before the exam, peak hour,
  people studying after midnight, regulars (3+ days), the hardest multiple-choice question with its answer, and a hall of
  fame (most answers, longest correct streak). Data from `get_hub_recap(p_secret, p_hub, p_exam)` (`migration_v20.sql`,
  admin-gated via `sh_admin_ok`, applied via the connector). Pings before 2026-09-25 count only the first 3 h of each
  visit (no idle rule back then). Question text: `ARCHIVE_BANK` → `question-banks/*.json` for archived hubs, `SH_EXPORT`
  for live ones. **Dashboard**: a "your rank" card under the greeting (handpiece, XP, animated bar to the next level,
  `get_rank_profile`); a Settings sheet (gear in the top bar) that edits the same localStorage keys as the hub widget's
  Settings (theme, font, size, accent, music, surprises, nuke alerts; font/size also apply on the dashboard). "Add exams
  to my calendar" removed (everyone has them already). `widget/ranks.js` exposes `ACCENTS` and re-applies the chosen
  accent once the rank loads.
- **2026-09-26 (easier name change, Claude Code)** — The hub top-bar name badge now always shows (your custom name, or
  the random class name like "Gleaming Molar") with a pencil; tapping it opens a small editor (`window.shEditName()` in
  `widget/v3.js`) that explains where the name shows, saves on Enter, and offers "Go back to a random name"
  (`clear_display_name`, `migration_v19.sql`, applied via the connector). The rank card in Stats has a "Shown as NAME ·
  change" link and the dashboard greeting a "Pick your name / Change name" button. One save path (`saveName`/`resetName`)
  keeps the Settings and Stats name boxes in sync and fires `sh:name`. Before this only 1 of 77 visitors had set a name.
- **2026-09-26 (home-screen icon, Claude Code)** — App icons are now the Gold handpiece medallion (rendered from
  `widget/ranks.js`) on a solid dark ground: `assets/apple-touch-icon.png` (180), `icon-192/512.png`, `icon-maskable-512.png`
  (extra safe-zone margin), `favicon-32/64.png`. All opaque; the old ones had transparent corners, and iPhones were
  showing a generic "S" tile. Every page links them with `?v=2` (bump it when the art changes, phones cache icons hard) and
  sets `apple-mobile-web-app-title` = "Study Hubs". `assets/icon.svg` (the old bars) is no longer linked.
- **2026-09-25 (nuke countdown key fix, Claude Code, #5)** — `runNukeCountdownKeyCanvas` in `widget/v3.js` now keys each
  frame against its own background (sampled at the crop's four corners; falls back to the fixed green if they disagree)
  instead of one fixed green. The countdown clip whites out on its own from ~12.25 s, so the fixed key left a pale green
  square around the icon until the 13 s blast; now the icon swells into a soft white disc as the clip whitens. Timing
  and `nuke-countdown.mp3` unchanged (its build-up peaks ~12-12.5 s, which is why the blast stays at 13 s).
- **2026-09-26 (perio: midterm format, Perio Project/Cowork)** — From Dr. Abou-Arraj's midterm email (Oct 1,
  10:00 am, rooms 220/222, ~40 questions: mostly MCQ, a few Patient Box cases, a few multiple-answer with
  partial credit, matching, no essays). `hubs/perio` gains a `pbox` question field (case table rendered
  above the stem) and a `multi` type (`correct:[...]`, Canvas-style partial credit: +1/n per right pick,
  −1/n per wrong pick, floor 0). 29 new items (13 Patient Box, 19 multiple-answer, some overlap). Mock Exam
  gets a 40-question exam-format option (5 Patient Box, 5 multi, 3 matching, rest MCQ, spread across
  sessions); matching is scored per pair; `sh:mock-done` counts full-credit items. Course Home has a
  "Midterm day" card. Arcade bank games skip `pbox` items. Three-way merged onto the 28 commits since
  6f97c09 (explanations, Report button, CLASS_ROW, choice tracking); CI smoke + lint pass locally.
  No reading text changed, so no narration was regenerated.

- **2026-09-25 (rank order + phone panel, Claude Code)** — Stone is now the first rank (0 XP) and Antique the second
  (300 XP): only the order of the first two `TIERS` entries in `widget/ranks.js` changed; server tier numbers are the same.
  Dashboard ranks panel fits phones (grid columns `minmax(0,1fr)`).
- **2026-09-25 (rank numerals, Claude Code)** — Every handpiece icon shows its level: large medallions get an engraved
  I/II/III plaque on the rim (replacing the pips), small ones a text tag in the corner (`shRanks.mini(tier, level)`,
  `.sh-rank-lv`), and the name badge appends the numeral. `migration_v18.sql` (applied via the connector) adds `level`
  to `get_leaderboard`, `get_correct_streak_stats` and `get_arcade_leaderboard`.
- **2026-09-25 (easter-egg clues, Claude Code)** — Hints for the hidden extras live in the trophy case: three new secret
  trophies (`konami` Cheat Code, `floss` Floss Boss, `prof` Office Hours; `migration_v17.sql` adds them to
  `record_achievement`'s whitelist, applied via the connector), every secret `TROPHIES` entry in `widget/ranks.js` has a
  `clue`, trophies are buttons (tap to read; a secret shows its clue), and a "Psst" line under the grid shows a random
  clue for a secret you haven't found. 17 trophies total. The Surprises setting points at the clues.
- **2026-09-25 (idle rule for study time, Claude Code)** — `widget/v3.js` activity tracking now stops banking time after
  15 minutes without input (pointerdown/keydown/wheel/touchstart/scroll/mousemove; `IDLE_MS`), unless
  `shTTS.listening()` is true (narration or browser TTS playing). Before this, any visible tab counted, so time from a hub
  left open on a desk inflated `activity_pings`. Minutes before 2026-09-25 were recorded under the old rule; compare trends
  across that date with care.
- **2026-09-25 (rank scale, nuke audio, card edge, Claude Code)** — **Ranks rescaled** (`migration_v16.sql`, applied via
  the connector): tier floors 0 / 300 / 1,500 / 5,000 / 12,000 / 25,000 / 50,000, each split into levels I-III
  (`sh_step`, `sh_step_floor`; Dark Matter I-III at 50k/75k/100k). v15's scale let a daily studier pass Dark Matter in
  ~5 weeks. `get_rank_profile` adds `level`/`step`/`step_at` (next_at is now the next level); `get_rank_board` adds
  `level`. The medallions show 1-3 pips on the rim; a level-up is a toast, a new tier keeps the full celebration.
  **Nuke countdown audio**: the countdown video's soundtrack only existed in its muted .mp4 (the .webm Chrome plays has
  no audio), so it's now `widget/sfx/nuke-countdown.mp3` (first 13 s of that track), played by `shNukeSfx` with the
  countdown and stopped at the blast. **Dashboard hub cards**: the colour stripe is now a full-card `::before` with
  `border-radius:inherit` painting only the left 7px, so it follows the card's corners.
- **2026-09-25 (handpiece ranks, trophies, link devices, Claude Code)** — `widget/ranks.js` (loaded by v3.js and the
  dashboard) draws seven tiers of handpiece medallions in inline SVG (Antique, Stone, Bronze, Silver, Gold, Diamond,
  Dark Matter; textures are SVG filters, the glint/sparkles animate only at large sizes) and mounts the rank card,
  per-hub mastery bar (Bronze 50 / Silver 75 / Gold 90 / Crown 100% of the bank right on the latest try), a 14-trophy
  case (6 secret ones read "???" until earned), unlockable accent colours in Settings (`sh_pref_accent`; injects
  `--accent/--accent-ink/--accent-soft` for light + dark) and **Link my devices** into the hub widget. XP is computed
  on the server from `personal_answers` (`sh_visitor_xp`, private): 10 first-time right, 2 repeat right, 1 miss, 600/day
  cap on answer XP, +20 per study day; tiers at 150/600/1500/3000/6000/12000 (`sh_tier`). Public RPCs:
  `get_rank_profile`, `get_rank_board`, `get_hub_mastery`, `record_achievement` (whitelisted kinds: boss, owl,
  rootcanal, mock90, mastery-*), `create_link_code`/`redeem_link_code` (6-char, 10 min, 10 tries/hour; redeeming moves
  the device's rows onto the code maker's id, `visitor_links` records it). `get_leaderboard`,
  `get_correct_streak_stats` and `get_arcade_leaderboard` gained a `tier` column (dropped + recreated). Hubs fire
  `sh:mock-done {correct,total}` when a mock is submitted. Dashboard: "Handpiece ranks" panel (top 10 + ladder) and tier
  icons on every board. `migration_v15.sql` **applied 2026-09-25 via the connector**. First dashboard survey
  ("Help shape the hubs") published live the same day.
- **2026-09-25 (Atlas retired; clicks + surveys, Claude Code)** — **Perio Atlas mode removed** at Sam's request (the
  diagrams were inaccurate; it had ~2 minutes of use from 5 people in two weeks). Removed from `hubs/perio/index.html`
  (tab, panel, `ATLAS_VIEWS`, `ATLAS_RENDERERS`, CSS) and the dashboard card. **Perio Project: drop Atlas from the split
  sources too, or the next single-file build brings it back.** Click analytics: `widget/clicks.js` (loaded by v3.js and
  the dashboard) batches clicks as `{section, target, count}` into `record_clicks` → `ui_clicks`/`ui_click_reach`;
  targets are named from `id`, the first `data-*` attribute (question-level ones skipped, numbers collapsed) or the
  label, and answer choices are grouped by class. Dashboard survey card: `get_active_survey`/`submit_survey`, one survey
  live at a time, shown once per visitor (answer or "No thanks" both count, plus `sh_survey_done_<id>` locally).
  Admin page gained **Clicks** and **Surveys** tabs (results, on/off, publish form). `migration_v14.sql` **applied
  2026-09-25 via the connector**; its admin functions call `sh_admin_ok()`, which copies the secret check from
  `get_nuke_summary` at migration time, so no secret is in the repo.
- **2026-09-25 (audit batch 2 + easter eggs, Claude Code)** — Widget: new launcher/menu (desktop) and a 3-item bottom
  bar with a "More" sheet (phones), redrawn icons, **full-content search** over each hub's `SH_EXPORT.sections` (notes
  paragraphs, review rows, hints, cram lines) that jumps to the spot via the hub's `window.SH_GOTO(go)`; a **Report**
  button on every question (`window.shOpenFlag(qid)`); `record_choice` stores which option was picked
  (`question_choices`, migration_v12, applied) and `review/` shows question text + the most-picked wrong answer (it
  reads each hub's `SH_EXPORT` through a hidden `?sh_export=1` iframe). Listen player: seek, ±15 s, speed, resume,
  lock-screen controls. Spaced review (`sh_srs_<hub>`, `window.shSrsDue()`) feeds a "due today" drill in both hubs'
  Weak Spots tab (new in MSK). Dashboard "Add exams to my calendar" (.ics). PWA: `manifest.webmanifest`, `sw.js`
  (network-first; bump `VERSION` when you change what it precaches), icons/OG images in `assets/`. 136 explanations
  added and distractors rebalanced in both banks. CI: `.github/workflows/check.yml`. `supabase/schema.sql` is a full
  schema snapshot (admin secret as a `<ADMIN_SECRET>` placeholder) — refresh it with every migration.
  **Easter eggs** live in `widget/eggs.js` (loaded by v3.js, which hands it `window.shEggHooks`): Golden Probe (one
  taught question per hub per Central-time day; `claim_golden_probe`/`get_golden_today`, shown on the dashboard),
  Tooth Fairy (`record_fairy`/`get_fairy_board`, board in the Stats panel) — both in `migration_v13.sql`, **applied
  2026-09-25 via the connector**; Plaque Boss (5+ online, shared HP over the `presence:<hub>` channel's `egg`
  broadcast), exam luck wall (evening before / morning of each date in `SH_EXPORT.exams`), professor quotes (tap a
  name 5x; `SH_EXPORT.lectures[].who` + `SH_EXPORT.hints`), Night Owl, Through the Root Canal, Konami 8-bit mode (phones: swipe ↑↑↓↓←→←→ then tap twice),
  "floss". Off via Settings → Surprises (`sh_pref_eggs`) and never during a mock exam (section matching `mock`). A new
  hub gets them for free if its `SH_EXPORT` carries `who`/`status` on lectures, `hints` and `exams`.
- **2026-09-25 (exam-week fixes, Claude Code)** — Dashboard `HUBS` entries now take `exams:[{name,label,date,code}]`
  (several per hub; perio has midterm + final) instead of `examDate`/`examName`; the hero lists every exam in the next
  14 days and has a real "no exams" state. Perio accuracy on the dashboard uses each question's latest try (perio's
  `totalCorrect` counts unique questions). supabase-js is **self-hosted and pinned** at
  `widget/vendor/supabase-2.117.2.js`, loaded with `defer` everywhere (no jsdelivr dependency); hubs call `boot()`
  directly instead of waiting for DOMContentLoaded, and the class-stats wiring runs on DOMContentLoaded. The widget no
  longer returns early without Supabase (search, settings, mind maps keep working) and exposes `window.shSupabase`,
  which the arcades reuse. Light/dark is one shared key, `sh_theme` (old per-page keys still read). Phones: mode tabs
  get their own labeled row in both hubs; MSK lecture chips wrap. Perio's class % now sits inside the explanation
  (hidden until answered). MSK mock exam is exam-style (pick all, submit, review; `STATE.mock.picks/order/submitted`).
  The dashboard no longer groups hubs by term (`TERMS` and each class's `term` field are gone); every class with a
  live hub shows in one grid, since old exams get archived.
- **2026-09-25** — Added `CLAUDE.md` (imports this file) so Claude Code sessions
  start with the repo rules; Claude Code deploys go through branches + PRs.
  Kokoro model re-hosted as release `kokoro-model-v1.0`. No site changes.
- **2026-09-25 (perio: midterm date + Session 4 lectured)** — Midterm set to **Thu Oct 1** (sessions 1-4):
  `MIDTERM_DATE = '2026-10-01'` in the perio hub (ribbon countdown, course home, course map) and
  `examDate:"2026-10-01"` on the dashboard's perio HUBS entry (it now leads the next-exam hero, a day
  before MSK Exam 3). Session 4 (Phase I) flipped from `preview` to `taught` from the class recording:
  both reading levels rewritten, 42 lecture questions (`q4-L01`-`q4-L42`), 17 verbatim exam hints, 6
  new review tables (Glickman furcations, CAL/Salud trap, tissue modifiers, prophy vs D4346 vs SRP vs
  maintenance vs debridement, healing timeline, radiograph reads + SRP limits), new cram sheet and mind
  map, 8 arcade terms and 3 Quadrants groups. Both `phase1-therapy` narration files regenerated.
  Midterm scope from Dr. Kaur's email (no instruments/ultrasonics/polishing; slides up to failure of
  therapy): 31 S4 questions carry `mid:false` (a "Not on midterm" chip; excluded from the midterm mock
  exam and from the new "Midterm scope" question-bank filter), and the matching notes sections, review
  tables, cram lines, mind-map branch and Atlas diagram are labeled.

- **2026-09-24 (perio revamp + Pocket Arcade)** — `hubs/perio/index.html` rebuilt (Perio Project) to
  match the revamped site: compact one-row ribbon (back, title, icon mode pills, countdown, progress,
  theme toggle), inline-SVG icon set (no emoji), Instrument Serif/Sans + IBM Plex Mono. Modes are now
  **Compendium · Review · Atlas · Arcade**; the Understory game + cutscenes were retired at Sam's
  request (replaced by the Arcade). Reference tables moved to a Review mode (data-driven `REF_SECTIONS`,
  search + hide-answers). New content: Session 4 (Phase I, Dr. Kaur slide deck, status `preview`) and
  the Session 3 in-class case review; bank 150 → 216. **Pocket Arcade**: nine new games (flappy,
  crusher, probe, quadrants, perdle, planer, smile, sweeper, cross) posting to `arcade_scores` with
  `p_hub='perio'`; `migration_v11.sql` (whitelists those ids) **was applied 2026-09-24 via the
  connector**. Bank-based games call `recordAnswer`, so they fire `perio:answered`. The state key and
  `answered/totalSeen/activeDates` shape are unchanged (dashboard `readProgress` still works); new
  `STATE.ui`/`STATE.arcade` sub-objects. The hub was then built from split sources in the Perio Project
  session (no longer: since 2026-11-03 the single file is the source; see "Perio: the single file is the source" above). Lecture Notes now have an **As taught / Plain English** toggle (`READINGS_PLAIN`, `STATE.ui.level`); each level has
  its own narration file, `audio/<id>-full.mp3` and `audio/<id>-plain.mp3` (all 9 plain files new; full regenerated for
  `phase1-therapy` and `risk-assessment`) — **edit either level's text and you must regenerate that file**. The Listen
  button is re-skinned with hub tokens in `hubs/perio` (the widget's `var(--card,#fff)` fallback made it white-on-white
  in dark mode; any hub without a `--card` token has the same issue). Dashboard: perio `HUBS` entry updated, and the arcade
  high-score panel is now data-driven by an `ARCADES` array (Bone Zone + Pocket Arcade, hub switcher).
- **2026-09-24** — msk-exam3: Listen button on Lecture Notes (shared `window.shTTS`, same
  markup as perio) plus Kokoro narration `hubs/msk-exam3/audio/<lec>-full.mp3` for all 9
  lectures (af_heart). **msk-exam3 now has pre-generated audio: any READINGS text edit must
  regenerate that lecture's mp3** (text-and-audio-must-not-drift rule).
- **2026-09-24 (later)** — msk-exam3: As Taught / Plain English toggle on Lecture Notes
  (`READINGS_PLAIN`, `STATE.ui.level`), each level with its own narration
  (`audio/<lec>-full.mp3`, `audio/<lec>-plain.mp3`). Edits to either text need that level's mp3 remade.
- **2026-09-23 (dashboard revamp)** — `index.html` rebuilt (hub index Project). Hub cards
  are now rendered from a `HUBS` array (+ `CLASSES`, `TERMS`) near the top of the script:
  **to add or archive a hub on the dashboard, edit that array, not markup.** Each entry's
  `examDate` drives the hero countdown and card "Exam in N days"; `stateKey` is the hub's own
  localStorage key, read-only, used to show personal progress (supports the msk-style
  `seen/totalAnswered/days` and perio-style `answered/totalSeen/activeDates` shapes; if a
  hub changes its state shape or key, update `readProgress()`). New: next-exam hero, personal
  14-day activity strip (`get_personal_stats` across live hubs), greeting via
  `sh_display_name`/`get_display_name`, light/dark/system toggle (`sh_dash_theme`), arcade
  high-score panel (`get_arcade_leaderboard`, hub `msk-exam3`), changelog as a timeline.
  Hub links now open in the same tab (hubs have their own back button). Fonts: Instrument
  Sans/Serif. Kept: presence count, busiest hours, streak boards, update-available prompt,
  changelog-driven "Updated" labels, class easter eggs, collapse state keys.
- **2026-09-23 (latest)** — msk-exam3: arcade grows to nine games (Clast Blaster shooter,
  Bone Search word search, Whack-a-Clast). `migration_v10.sql` updated in place to accept the
  new game ids (`blaster`, `search`, `whack`). **migration_v10 was applied to Supabase on
  2026-09-23 via the Supabase connector**; arcade leaderboards are live for all nine games.
- **2026-09-23 (later)** — msk-exam3: 40-question Mock Exam; emoji replaced by a
  hub-local inline-SVG icon set (`ICON_PATHS`/`icon()`); compact one-row
  ribbon; Arcade grew to six games (added Marrow Match, Bone to Pick, Fact or
  Fracture) with a fullscreen toggle and an easier Snake. **Class-wide arcade
  leaderboards** via `migration_v10.sql` (`arcade_scores` table,
  `submit_arcade_score`, `get_arcade_leaderboard`): run it once in the Supabase
  SQL editor. Until then the hub shows "leaderboard warming up" and keeps
  working. Other hubs can reuse the same two RPCs with their own `p_hub`.

- **2026-09-23** — Archived GI Exam 2 (`hubs/hepatobiliary/`, incl. its
  narration audio) off the live site after the exam, same pattern as GI
  Exam 1: the full 404-question bank + lecture list was saved first to
  `question-banks/gi2-question-bank.json` (hub's own field names; see
  `question-banks/README.md`, regenerate with `extract_gi2.js`). Dashboard
  card removed; `hepatobiliary` stays in `HUB_LABEL` so old changelog/stats
  rows still label correctly. **Widget time tracking is now per section:**
  `record_activity_ping`'s `p_section` is `"<mode>/<sub-view>"` (e.g.
  `compendium/bank`, `review/drugs`, `compendium/exam-hints`) instead of
  only the top-level mode. Mode detection accepts `aria-selected="true"` OR
  an `is-active`/`active` class (hepatobiliary only set the class, so all of
  its ~12k minutes had logged as `(unspecified)`); sub-view = first visible
  active element outside `#modeSwitch` carrying `data-view|sub|ctab|gtab|
  dtab|tab|group|section|pane|panel`. A hub can override with
  `window.SH_SECTION = () => "mode/sub"`. Time is banked per section each
  second and a ping only fires once a section has earned a full 25s, so
  switching mid-interval no longer credits the wrong section. No schema
  change. `review/` rebuilt as a tabbed admin (Overview / Time by section /
  Questions / Engagement / Inbox) with a 7/30/90-day range, an "include
  archived hubs" toggle (archived list is `ARCHIVED` in `review/index.html`
  — add a hub there when you archive it), and "active time per visit"
  (total ping minutes ÷ visits) replacing the old span-based average, which
  counted hours of backgrounded tabs.

- **2026-09-23** — New hub: `hubs/msk-exam3/` ("Musculoskeletal Exam 3 Hub", widget
  `data-hub="msk-exam3"`, event `msk3:answered`, localStorage `msk3-state-v1`),
  built from the GI 3 Claude Project (L19-L27; L26 drugs and L27 tumors are
  slides-only until their recordings are uploaded). Modes: Compendium, Review
  (grouped reference: drugs, hormones, cells, matrix, genes, diseases, tumors,
  processes, superlatives; with a recall/blur toggle), and an Arcade that
  REPLACES the illustrated-scene game pattern at Sam's request: three
  cool-math-games-style mini games (Sort Storm, Osteo Snake, Stack Attack).
  Osteo Snake answers go through the normal answered event, so they count in
  class stats. Hub source is built from split files (css/js) in that Project's
  session; the deployed `index.html` is the single-file build. Added the hub to
  the dashboard GI group, `HUB_LABEL`/`ALL_HUBS`, and `review/` `HUB_LABEL`.

- **2026-09-18** — Tactical nuke: raised the streak requirement from 50 to
  100 correct answers in a row, per request. Also replaced the generic
  "Someone has called in a tactical strike" banner with the visitor's
  actual resolved name — the same deterministic name (e.g. "Gleaming
  Molar") the leaderboard and nuke/streak analytics already fall back to
  when a visitor hasn't set a custom display name, instead of a generic
  placeholder word. Added `get_display_name(p_visitor)` (`migration_v9.sql`,
  public, no secret) so the client can resolve it once on load; degrades
  gracefully back to "Someone" if the RPC isn't reachable.

- **2026-09-18** — Wired up analytics that had been silently no-op-ing:
  `widget/v3.js` was already calling `record_nuke_launch` on every tactical-
  nuke strike (since the feature shipped 2026-09-17), but the backing
  Supabase table/function never existed, so every call failed silently and
  the review page showed nothing. `migration_v8.sql` adds `nuke_launches` +
  `record_nuke_launch`/`get_nuke_summary`/`get_nuke_by_hub`/`get_nuke_recent`,
  and a new "Tactical nuke" section on the review page (launches, unique
  launchers, by hub, recent activity). Also added persisted correct-answer
  streak tracking (`correct_streaks` table + `record_correct_streak`, called
  from the same answered-question handler as `record_answer` — separate from
  the in-page-only counter that gates the nuke badge, which still resets on
  reload by design) and `get_correct_streak_stats()` (public, no secret,
  same pattern as `get_leaderboard`) showing the longest streak currently
  still standing and the all-time record. Shown in two places per request:
  a "Correct-answer streaks" section on the review page, and a matching
  card on the public dashboard (`index.html`) next to Study Streaks.

- **2026-09-16** — Perio: Session 3 (Risk Assessment, Dr. Geisinger) ingested
  from its lecture recording transcript + slide deck — flipped from
  exam-review-guide-only to fully lectured (new reading, 2 reference tables,
  17 new lecture-sourced questions, rewritten cram-sheet entry and mind map).
  Session 2 (Incisions/Flaps/Sutures) enriched with a supplementary in-class
  Q&A transcript (sub-marginal incisions, flap-thickness-by-procedure,
  palatal graft harvesting) — 9 new questions, 1 new incision type, 1 new
  reference table, 3 new exam hints. Question bank grew from 124 to 150.
  Regenerated Kokoro narration (`audio/risk-assessment-full.mp3`,
  `audio/incisions-flaps-sutures-full.mp3`) to match, per the
  text-and-audio-must-not-drift rule above. Also fixed two pre-existing bugs
  surfaced by testing against the larger bank (neither introduced by this
  content work — both date from the earlier Game-mode/gameplay-progress-split
  change, and both are general fixes in the shared `qCardHTML`/
  `wireQuestionContainer` pattern, not perio-specific): `recordGameAnswer`
  never dispatched the event the cutscene-trigger listener watches for, so
  clearing a lecture by actually playing through Understory never played its
  reward cutscene; and `SEQ_STATE`/`MATCH_STATE` (sequence/match
  click-tracking) were keyed globally by question id instead of per-render,
  so a sequence or match question could only ever be completed once per page
  load, in whichever mode/view reached it first — re-encountering the same
  question in a second context (Question Bank, then a Game encounter)
  silently could never be completed there. Worth checking other hubs that
  share this rendering pattern for the same two issues.

- **2026-09-16** — Added data-driven lecture mind maps: a new shared
  `window.shMindMap.render()` renderer in `widget/v3.js` (generic
  hierarchical tree layout, inline SVG, horizontally scrollable) plus a
  `MINDMAPS` data object per hub (10 hepatobiliary lectures, 9 perio
  sessions, content grounded in each hub's own lecture notes/reading
  text). A "Show mind map" toggle now appears under the lecture-notes
  reading pane in both hubs, following the same shared-renderer/
  hub-local-data pattern as `shGetClassStats`/`qCardHTML` — a future hub
  only needs its own `MINDMAPS` object, not new rendering code. Also
  fixed a spacing bug in the renderer itself: `layout()` was assigning
  leaf rows a fixed height while `nodeBoxHTML()` sized each box to its
  actual wrapped-line count, so any 2-3-line label produced a box taller
  than its row and visually spilled into the node below it. **Follow-up
  fix, same day:** the first deploy of this feature shipped
  `widget/v3.js` and both hub HTML files but forgot `widget/v3.css` —
  the mind maps went live as unstyled black SVG silhouettes (no fill/
  stroke/font rules) until a second deploy an hour later added the
  missing CSS file. Lesson: when a change touches both `widget/v3.js`
  and `widget/v3.css`, double-check FILES in `deploy_rollout.py`
  includes both before running it — it's easy to edit both files and
  only remember to list one.

- **2026-09-16** — Hub index: integrated the universal back button into each
  live hub's own sticky ribbon instead of a separate fixed bar above it
  (perio, hepatobiliary); removed a redundant duplicate background-music
  system inside Hepatobiliary's own Lounge panel; converted all 60
  originally free-recall questions in the archived GI Exam 1 question bank
  (question-banks/gi1-question-bank.json) to multiple-choice with curated
  distractors, so all 89 GI1 questions are now MCQ, and expanded
  Hepatobiliary Mock Exam's embedded EXAM1_REVIEW_POOL from a 27-question
  curated subset to the full 89.


- **2026-09-15** — Hepatobiliary: GI Pharmacology + Clinical Applications for
  Dentistry lecture transcripts mined into Lecture Notes/Exam Hints/Questions
  (now 10/10 lectures, 363 questions), reconciled via 3-way merge with a
  parallel session's Active Recall tab + `widget/v3.js` integration work,
  republished to the Claude Artifact and deployed to GitHub Pages.
- **2026-09-12** *(approx, from widget history)* — Active Recall flashcard
  mode added (hide-and-reveal cards pulled from Cram Sheet/reference content,
  deliberately excluding direct-quote Exam Hints cards since a raw quote makes
  a weak recall prompt); `widget/v3.js` v3 rollout across all 5 hubs.
- **2026-09-09** *(approx, from Supabase changelog)* — Study streaks, live
  class activity pulse, opt-in leaderboard, question flag/suggest-fix; search
  across every hub; class-wide correctness shown automatically; Listen
  (text-to-speech) button with word-by-word highlighting; mobile redesign.

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
