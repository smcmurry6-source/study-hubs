---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [ ] **The arcade games themselves at 320 px with the largest text** (2026-11-19, left from BUG-168's fix): the lobby and
  every view of a hub now fit a 320 px phone at XX-Large (220 px of layout), and the smoke test checks them, but a game once
  it's started (each hub's own `content/arcade.css` and `widget/games.css`) wasn't swept. Open each in a scripted browser at
  that size, the way `tools/ci/smoke.js`'s 320 px check does, and fix any that scroll sideways or cut off a control.
- [ ] **A hub's report-reply pop-up covers the reward card on a phone** (2026-11-19, seen while moving the card to
  `widget/prize.js`): on an emulated iPhone 13 (Perio, the preview's made-up data) a reply pop-up open at the top of the
  screen sits over the gold card (`.hx-prizes`, z-index 45) so only its first line shows. On `main` too. Perhaps lift the
  card above the pop-up for its few seconds, or drop it in under the pop-up.
- [x] **The dashboard's toast on a phone** (2026-11-19, left from BUG-126's fix): a hub's toasts now drop in at the top on a
  phone, clear of Timmy, the streak flame and the Listen player; the dashboard's own (`toast()` in `widget/dash.js`) still
  comes up at the bottom and wasn't checked against what sits there. Check it on a phone and move it if anything covers it. Checked 2026-11-19 on an emulated iPhone 13 with the preview's made-up data: since #458 the rule in `widget/hub.css` drops the dashboard's toasts in at the top too (64 px, under its 56 px bar), clear of the report-reply pop-up and the bottom corners; nothing covers a long one, so nothing to move. And its prizes are on the gold card now (the next line). (#466)
- [ ] **`xp_seen` grows back with every full rebuild** (2026-11-19, the optimization pass's phase 2,
  [its note](2026-11-18-database-optimization-pass.md)). `sh_xp_rebuild` (Link my devices, an edited or deleted answer) deletes
  and copies all of a student's `xp_seen` rows, `xp_days` and answer awards, whatever changed: 65,125 `xp_seen` rows went and
  came back in the 18 hours after the 2026-11-18 restart, and on a copy 60 such rebuilds grew its index 16 → 23 MB. Phase 2
  rewrites the table once at night (about 24 MB back). If it passes about 40 MB again, look at rebuilding only what changed
  (an `xp_seen` row is one per question and right-or-wrong: inserting the missing ones would do for a link), or another
  `cluster` at night. Measure on a copy first (`tools/release/bench-answers.js`).
- [ ] **Read the data-quality report** (2026-11-18, the evening lessons refresh; 2026-11-19, the Perio retrospective):
  `select sh_data_quality();` stopped at the audit's 5 s limit both times (80 people in Perio on its final's eve; then at 12:40 pm
  the next day, between the Perio final and the Heme & Endo Exam 3 eve). `qh_report('perio')` was read with the retrospective
  (2026-11-19: no miskeys). Once `migration_v83.sql` is live, read the admin page's kept copy instead, at any hour (`admin_cache`'s
  `quality`; the query in `tools/lessons-refresh.md` step 1; the night v83 is applied fills it, and it's refreshed nightly for a
  week); until then, once between 1 and 5 am Central. Tick this when it's read.
- [x] **The other `shGame.v2()` checks while the bootstrap times out** (#468) (2026-11-19, found with the rank pill's fix). Three more
  places wait for `v2()` (true only once the bootstrap or an answer's reply came back) where `shGame.live()` would do: Timmy
  Time's minutes (`minOn()` in `widget/podcast.js`: an episode heard then pays nothing for those minutes), Timmy's HP days
  (`loadRemote()` in `widget/pet.js` reads `get_pet_days` without the snacks' HP) and the Inbox (`widget/replies.js` reads
  `get_my_inbox` without the idea board's notes; its `v2` comes from the page). Check each the way #427 and the rank pill did.
  **Done** (#468): all three ask `shGame.live()` (the Inbox's `v2` now passed by a hub too), with today's call when the v2 one is missing.
- [x] **A mock's or a game's answers that fail both quick tries are lost** (#468) (2026-11-19, found while keeping the line's answers
  on the device). `answerV2` in `widget/v3.js` sends an answer with a session at once and tries twice more (4 and 10 s), and
  `finishSession` waits for them, so in a busy minute a mock's answers can miss the server: its score, its +50 (10 answers
  needed) and their XP. Not kept on the device like the rest, because the session is finished on the page. Perhaps: keep
  them like the line's and finish the session from the next page (a session takes answers for 6 hours, and 10 minutes after
  it's finished), or hold the finish until the line is clear.
  **Done** (#468): both: out of its quick tries an answer joins the line with its session, and the finish waits behind it
  there (kept on the device with it), so the next page sends the answers, then the finish.
- [x] **The reward card on the dashboard too** (2026-11-18, from the hubs' reward card: Sam, "i want it to look much cooler and
  communicate that you just got xp and crowns better"). A hub shows what a bonus paid on a gold card (`drawPrize` in
  `widget/hub-rewards.js`, its styles inside it); the dashboard's prizes (the daily visit, the leaderboard name, trophies:
  `toast()` in `widget/dash.js`) are still the dark toast. The dashboard measured 342 of its 345 KB budget on 2026-11-18, so
  the card would go in a file the dashboard fetches when a prize first pays (not `dash.bundle.js`), or with Sam's OK to raise
  the budget. Done 2026-11-19: the card is `widget/prize.js` (`window.shPrize`), run in `hub.bundle.js` for a hub and fetched by the dashboard when a prize first pays; over Timmy's place when the prize is a visit, under the bar on a phone, the stars flying into the crowns. (#466)
- [x] **The dashboard is at its 345 KB budget** (2026-11-19: 353,341 bytes of the 353,791 the budget allows, after the What's
  new box, the stage's foot and Send luck's art added about 3.3 KB gzipped; `node tools/release/perf.js --page index.html`). The next change that adds to `dash.bundle.js` or
  `site.bundle.css` won't fit: move something the first screen doesn't need into a file fetched on first use (as Timmy's
  place and the trophy case are), or ask Sam to raise the budget in `tools/release/budgets.json`. Done 2026-11-19: `widget/ranks.js`'s hub widget moved to `widget/ranks-hub.js` (a hub's only): the dashboard measures 340 of its 346 KB, with the reward card and the one analytics call in, the budget unchanged. (#466)
- [ ] **More ways to earn crowns, if Sam wants them** (2026-11-17; Sam, with the prizes of `migration_v68.sql`: "im open to
  other ways too"). Ideas offered, none built: catching the Tooth Fairy or the Golden Probe, a perfect mock, Yesterday's
  misses all right, an idea of yours marked done on the idea board, the first day back after a week away. Each would be one
  `xp_awards` row with a key that pays once and an amount in `sh_prizes()` ([game-server](../reference/game-server.md)).
  (Studying's rate was raised to 5 crowns per 10 XP the same day, Sam: "lets increase it to 5 crowns per 10xp".)
- [x] **A tall piece in the front yard slot covers Timmy at the door** (2026-11-18, seen on the collection sheets): the
  `front` slot (`SLOTS` in `tools/figures/site/place.mjs`, x 6.7, y 10.2) is in front of every home's `spots.door`, so a tall
  piece there (Desert ranch's windmill, July 4's fireworks stand, Thanksgiving's balloon) hides him on the card. Ideas: draw
  Timmy over a front-slot piece when he's at the door, or nudge the door spot when the front slot holds a tall piece. Ask Sam. Done: Timmy is drawn on top (Sam, 2026-11-19), `timmyZ()` ([#467](https://github.com/smcmurry6-source/study-hubs/pull/467)).
- [x] **Kit niceties the collection drawers asked for** (2026-11-18, [the task](done/2026-11-18-more-cosmetics.md)): a yard egg
  can only animate its `.tp-eb` group, so the moon rover can't roll, the dish can't turn and the windmill's and wagon's wheels
  only blur (a hook that moves the whole piece while its egg plays, within [motion-cost](../reference/motion-cost.md)); a coral
  or kelp `treeKind` for the reef and a plain one for the moon (both use the crystal tree); no snow on an underwater scene. Done: a piece's `move` and `T.spinner`, a scene's own `tree`, `noSnow` ([#467](https://github.com/smcmurry6-source/study-hubs/pull/467)).
- [ ] **After the redesign's release: what the old pages still hold up** (2026-11-13, [the release](done/2026-11-06-redesign-release.md)).
  When the last single-file hub's page comes down (the archived ones and Heme & Endo Exam 2): take out the `NEW` (`html.shx`)
  branches in `widget/ranks.js` and `widget/rankup.js` (the old cards, the 23-trophy list), the old house picture and
  `sh_rank_tier`'s use in `widget/pet.js` (`houseSvg`: today only the fallback under the place on the dashboard), the
  `rpc2` fallbacks in `widget/dash.js` for a database without the game layer, `legacy` and the unused `modes` in `hubs.js`,
  and any separate widget file or the full client (`widget/vendor/supabase-2.117.2.js`) that `grep` finds no page loading
  by name (`review/` keeps the full client). The sources of a bundle are never deleted.
- [ ] **The hubs' own arcade lobby, never shown on the engine** (2026-11-19, found retesting BUG-012): More's Arcade on a hub on
  the engine draws its own lobby (`moreArcade()` in `widget/hub.js`) and opens a game on its stage, so the lobby inside a hub's
  `content/arcade.js` (`lobby()` in Perio's, with the `.ar-board-tabs` boards; Heme & Endo Exam 3's has `.ar-board-grid`) looks
  unreachable. Check whether anything still calls it (its mute button redraws it) and whether its per-game boards are shown
  anywhere else; if not, take it out of the next hub built from these files ([build-a-hub](../how-to/build-a-hub.md)).
- [ ] **Learn: a typed answer** (2026-11-13, idea from making Learn "more like quizlet"): Quizlet's Learn ends on written
  questions. Ours ends on recall before the choices show (Sam's call 5, 2026-11-06), because a typed answer can't be
  graded against a bank question's choice. Only if Sam asks for it.
- [ ] **Flashcards: undo the last rating** (2026-11-13, same): not built, because a rating is paid and sent to the server
  at once; it needs the rating held back a few seconds first. Only if Sam asks for it.
- [ ] **A smoke check for visiting from a hub's arcade board** (2026-11-19, from #467): `tools/ci/smoke.js` checks the
  dashboard's visit but not a hub's. Stub `get_arcade_leaderboard_v2` and `get_place`, finish a game, tap a name on the
  game-over board: the place opens as a visit, Escape gives focus back, a key that opens nothing says so on the row.
- [x] **Visiting from a hub's boards** (2026-11-13, [visiting](done/2026-11-12-redesign-visiting.md)): the leaderboards in a
  hub's own panel (`widget/v3.js`) don't open anyone's place yet (Sam, 2026-11-12: the dashboard's boards first). Done: the hubs' boards are their arcades' (`v3.js`'s panel has none now); `window.shVisitPlace` in `widget/hub-timmy.js`, Perio's and Heme & Endo Exam 3's arcades ([#467](https://github.com/smcmurry6-source/study-hubs/pull/467)).
- [ ] **Sound for the hand-off and the Dark Matter unlock**, only if the redesign ever gets a sound setting (it has none; the
  scenes are silent on purpose: [the journeys](done/2026-11-06-redesign-progression-journeys.md)).
- [x] ~~**Perio's page weight is near its budget**~~ (moot: Perio's page came down 2026-11-19, [#464](https://github.com/smcmurry6-source/study-hubs/pull/464)) (2026-11-14, [#362](https://github.com/smcmurry6-source/study-hubs/pull/362)): `perf.js`
  measured the live Perio page at 1167 KB of its 1180 KB budget (`tools/release/budgets.json`) after Figs 6-8 (+38 KB gzipped), and its
  first paint warns at 1.6 s on the slow phone (budget 1.5 s; CI passed). The next figure or big content change needs room: trim
  what the anima blocks repeat (each figure's static SVG is drawn again by its live code), or ask Sam before raising the budget.
  **On the engine (the release, #359) it is the same story with other numbers:** 812 KB of its 830 KB budget with Figs 6-8
  in `content/figures.js` (178 KB by the load event; the figures load with Notes), first paint inside its budget.
  **2026-11-18:** 834 of 850 after the final's bank audit (BUG-176), then 864 of 885 with S6 taught (BUG-180, [#419](https://github.com/smcmurry6-source/study-hubs/pull/419));
  the [S6 diagrams](done/2026-11-18-perio-s6-diagrams.md) took none of it (still 864 of 885: `figures.js` loads with Notes, not on a Home
  visit; it is 157 KB gzipped with S6's five, was 121), so the next change to the notes, questions or hints needs room: trim first or ask Sam.
- [ ] **A new hub's blocking time after the bundles** (2026-11-13, [phase 5, part 2](done/2026-11-05-redesign-phase-5-backend.md), [#358](https://github.com/smcmurry6-source/study-hubs/pull/358)):
  on `perf.js`'s slow phone a new hub's total blocking time was 230-365 ms on `main` and is 310-540 ms with the bundles
  across runs (350-385 in the final run; budget 500, fails past 750). The same scripts run, in fewer and longer tasks.
  Not looked into: a trace of the first seconds to see which tasks are long (the engine's start, or `widget/v3.js`'s,
  which is shared with the live hubs). Worth a look at the release, when v3.js no longer has to stay as it is for the old pages.
- [x] Ask Timmy's "What should I study tonight?" on the new dashboard reads each hub's progress from this device's saved state
  (`progressFrom` in `widget/ask.js`), so on a new or linked device it sees nothing until a hub page has synced the answers. Read the
  student's own answers from the server there instead (their own rows, like the v2 bootstrap), or say "open a hub first" when every
  hub's state is empty (2026-11-12, [Ask Timmy](done/2026-11-12-redesign-ask-timmy.md) part 2). Done: the dashboard merges `get_my_answers` with the device's (#469).
- [ ] Anima figures on phones: at 390 px their in-drawing labels scale down to about 6-7 px. A plain bigger font for narrow screens clipped labels at the edges in about half the PCD Implants figures (tried 2026-11-04, reverted); it needs a per-figure phone layout (labels moved inside the drawing) or tap-to-zoom. Heme & Endo Exam 3's 22 (2026-11-17) mostly draw them at 10-15 px; its four L17 figures after the oocyte are the smallest (labels about 8 px on the timeline, implantation, estriol and breastfeeding figures). 
- [ ] Retention, the part not built yet (approved 2026-11-04, [analytics-retention](../reference/analytics-retention.md)): before the school year ends (spring 2027), collapse `activity_hourly` / `activity_visits` older than the school year to hub × section × day with people counts and no ids, as one more step in `sh_retention_run`. **Since migration_v68 the wallet pays 100 crowns per hour of hub time from `activity_hourly`** (`sh_time_crowns`): before the collapse deletes a visitor's hours, keep what they paid (each visitor's capped ping total in a small table `sh_time_crowns` reads, or the crowns as a row), or balances drop. Also ask Sam about the two rows the question-health work proposed (`question_events`, `question_feedback`).
- [ ] **The workflows' actions off Node.js 20** (2026-11-18, seen in #407's After merge run): every run warns "Node.js 20 is
  deprecated" for `actions/checkout@v4` and `actions/setup-node@v4` (8 uses each in `.github/workflows/*.yml`) and runs them
  on Node 24 for now; `actions/upload-artifact@v4` (3) and `actions/github-script@v7` (2) are likely the same. Before GitHub
  drops Node 20 entirely: move each to the major version that runs on Node 24, and let CI run every job once ("Check hubs" and
  "Release tests" both run when a workflow changes).
- [x] **Sam's call: Ask Timmy's first question after an idle hour** (2026-11-18, found while answering why Heme & Endo Exam 3 had 21
  identical questions): writing a hub's content to the API's cache is most of what students' questions cost (about $14 of their
  $20 from 11-14 to 11-18), and most of it is the first question on a hub after nobody asked for an hour (about $0.60 each; the
  cache lasts an hour). The deploys that broke the cache are fixed ([ask-timmy](../reference/ask-timmy.md), "Limits and money").
  What's left would mean sending less: for example only the exam facts, Exam Hints and the lecture the student is on, with the
  rest of the notes only when the question needs them. That changes what Timmy can answer, so it needs the eval ($6) and Sam's OK. Done: Sam said yes; built with the eval in `--part` mode (#469).
- [ ] **Apply `migration_v85.sql` (Ask Timmy's `timmy_cache`) once its PR merges** (2026-11-19): one small table and one
  service-role function, no backfill, safe at any hour. Until it's applied the function gets an error from the call and sends
  the whole content as before, so the cheaper first question starts only then. Through the connector, md5-checked; then append
  it to `supabase/schema.sql` and take its line out of `supabase/pending-migrations.txt`
  ([run-sql-on-the-live-database](../how-to/run-sql-on-the-live-database.md)).
- [ ] **A week after `migration_v85` is applied, check what the part saved** (2026-11-19): the admin page's Ask Timmy tab (cost by
  day against 11-14 to 11-18's) and the edge logs' `turn` lines (`content`: `part`, `part+full`, `full`). In the eval, 16 of 50
  first questions were asked again with the whole content; if real students' share is much higher, the part costs more than it
  saves: send more with it (another lecture, the review tables) or turn it off (`WARM_MS` in `supabase/functions/timmy/core.js`).
- [ ] **Ask Timmy's quote check fails a table cell under three words** (2026-11-19, the eval's pe-02 on the whole content):
  he cited R1.3 with "≥10 cigarettes/day", which is in the table, but `quoteIn` wants at least three words or the whole unit, so
  the link was dropped and the eval failed. Either accept a whole table cell (the text between two ` · `) as a quote, or say in
  `RULES` that a table quote takes the row's label with it.
- [ ] **a11y.js checks the About page in light mode on a laptop only** (2026-11-19, found fixing BUG-002, BUG-006 and BUG-007):
  `check('about', 'about/')` in `tools/release/a11y.js` runs at 1280 px in light mode, so a phone-only problem (four of the five
  tables that scroll sideways were only too wide at 390 px) or a dark-mode one would never be counted. Add the About page in dark
  mode and at a phone width (with spoilers shown, since the hidden hints are styled apart), each with its baseline entry at 0.
