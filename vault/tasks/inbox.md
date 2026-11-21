---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [x] **Sam: confirm the readings of the journey crowns** (done 2026-11-20: "merge, do backpay if someone is already past"; `migration_v89.sql` applied live before the merge) (#492) (2026-11-20, [decisions](../decisions.md)): 5,000 for each journey's
  Dark Matter (three in all), 20,000 for reaching the ModuPro and 30,000 for the Loupes (Sam's numbers, once each), all crowns
  only (no XP), with back pay for anyone already there. Each is one line of `sh_wallet` in `migration_v89.sql` to change, and
  the scenes read the amounts from `sh_prizes()`'s `dark`, `modupro` and `loupes`. Never take crowns back once paid
  ([earn-rates-stay-enjoyable](../rules/earn-rates-stay-enjoyable.md)): dropping the back pay after v89 is live would lower balances.
  The next lessons audit reads the economy with the back pay in it (a one-off jump in balances, not a rate).
- [x] **After #492 merges: replay the new Dark Matter unlock for the one student Sam asked for** (done 2026-11-20 at about 7:20 am Central, once the merge had published: the one `dark-seen-0` row deleted through the connector, their profile's `dark_seen` empty again, so it plays on their next visit; their crowns already include its 5,000) (2026-11-20, "replay the dark
  matter animation for ... since they didnt get to see it"; the name is in that session's chat, not here: per-person rows stay in
  the database, [learner-data-privacy](../rules/learner-data-privacy.md)). It plays when the profile's `dark_seen` lacks 0:
  delete that visitor's `achievements` row of kind `dark-seen-0` through the connector (one row, Sam's OK), after v89 is applied
  and the merge has published; the page marks it seen again once it has played.
- [ ] **The mastery read is slower a call than before the optimization pass** (2026-11-20, its readout): `get_hub_mastery`
  236 → 349 ms on the server on average (673 calls since phase 1), the evening's median 242 → 709 ms on 77 calls, 11% of the
  database's time. Since #459 the page works out the rank between answers, so the reads left are the ones when a hub's page
  opens (`loadOwn()` in `widget/ranks-hub.js`), beside the bootstrap: likely the cold ones, not a slower body, but not checked.
  Read it again a busy evening after `migration_v84.sql` (live 2026-11-20) with the bootstrap; if it's still slow, time it on
  a throwaway copy first-of-page against warmed, and against the body before `migration_v76.sql`, before changing anything
  ([the pass](done/2026-11-18-database-optimization-pass.md), its Log).
- [ ] **Review of Systems: weigh the mock by what Mock 1 asked** (2026-11-19, the hub's build): the hub's 200-question mock
  spreads its questions by the size of each course (`core.json` `mock.blueprint`), a guess: the course announced no counts.
  After Mock 1 (Thu Dec 3, noon), read its exam check-ins (which courses felt heavy, what surprised people) and, before Mock 2
  (Dec 10), move the blueprint toward that, and add High likelihood topics for what the check-ins say came up
  ([hub note](../hubs/review-of-systems.md)).
- [ ] ~~**Review of Systems: an arcade with its own skin** (2026-11-19, the hub's build): it shipped without one (More hides
  the tile). Sam's call whether it wants one; if so, its games, names and lobby art are its own
  ([arcade-skins](../rules/arcade-skins.md)), and the hub comes out of `TEXT_ONLY` in `sw.js`.~~ dropped: Sam, 2026-11-20, "No
  arcade" ([decisions](../decisions.md)).
- [x] **The engine's background work after Home in small pieces** (2026-11-20, [#480](https://github.com/smcmurry6-source/study-hubs/pull/480)):
  on the performance suite's slowed phone, Review of Systems blocks the page for about 850 ms after Home has drawn (Heme & Endo
  Exam 3: about 330). A CPU profile put the JavaScript in `exportSections()` in `widget/hub.js` (every part's notes parsed into
  the page in one task for the search index), `fit()`/`fitFigs()` in `widget/v3.js`'s layer and `fmt()`'s `toLocaleString`;
  the rest is the browser parsing the content JSON. Building the index a few parts at a time, yielding between them, would
  cut it on every hub; then lower the hub's `tbt` in `tools/release/budgets.json` (set to 900 from that day's run). Done (#498): the index is built a lecture at a time, `widget/fx.js` measures every bar before animating any (the biggest share, about 370 ms: not in the first profile), `fit()` reads before it writes, the rank pill is fitted once a frame, `fmt()` keeps one formatter. Review of Systems about 920 to 490 ms, `tbt` 900 to 700; Heme & Endo Exam 3 about 430 to 230.
- [ ] **Review of Systems: Cardio & Respiratory and Renal from their slides** (2026-11-19, the hub's build): their Drive
  folders had the thinnest sources (classmates' guides, no professor slides), so those sections rest most on standard
  references. If Sam can share their slides or transcripts, check those parts against them. Sam, 2026-11-20: "ill get you the other
  slides soon": waiting on Sam.
- [ ] **Run the test-runs data fix once more on 2026-11-21** (2026-11-19, the evening lessons audit): the PR that adds
  `tools/ci/no-leaks.js` runs `tools/data-fixes/2026-11-19-test-runs.sql` after its merge, but a smoke test run locally from a
  branch older than the fix (another session's) still writes its game-layer check into the live hub until that branch takes
  `main`. Two days later, run it again (`node tools/after-merge/run.js ... --fix tools/data-fixes/2026-11-19-test-runs.sql`, or
  the connector with Sam's OK; it is safe to run twice), first counting what it would select (its first statement as a `select
  count(*)`), and tick BUG-192's retest. Until then, a Heme & Endo Exam 3 retrospective reads that hub's arcade and Timmy Time
  clicks of 11-19 as test runs. **Run `tools/data-fixes/2026-11-20-quiet-test-rows.sql` again with it** (2026-11-20, the Exam 3
  retrospective): `tools/ci/quiet.js`'s mock checks, run from those same older branches, wrote two `pq-` rows each into question
  health (13 made-up visitors to 6:37 am on 11-20); today's `quiet.js` sends nothing past its routes (checked behind a refusing proxy).
- [x] **Heme & Endo Exam 3 out of `HUBS` in `sw.js`** (2026-11-20, its retrospective): done with its page coming down, `sh-v68`
  with Review of Systems alone (#503).
- [x] **Sam's call: take Heme & Endo Exam 3's page down?** Sam, the morning of the exam: "Yes come down. Merge". `hubs/heme-endo-exam3/`
  is gone, `archiveOn` 9 am on 2026-11-20, and what named it moved to Review of Systems or went (#503,
  [the hub note](../hubs/heme-endo-exam3.md)).
- [ ] **The smoke test's game-layer wiring check runs again on the next hub with an arcade** (2026-11-20, Exam 3's page down):
  `tools/ci/smoke.js`'s `wiringCheck` (Million-Dollar Smile's sessions and answers, Timmy Time's minutes) needs a live engine hub
  with Smile in its `content/arcade.js`, and Review of Systems has no arcade, so it is skipped until one is built. When the next
  hub with an arcade ships, check its smoke run prints "the game layer's wiring" for it (nothing to change: it picks the hub itself).
- [x] **The arcade games themselves at 320 px with the largest text** (2026-11-19, left from BUG-168's fix): the lobby and
  every view of a hub now fit a 320 px phone at XX-Large (220 px of layout), and the smoke test checks them, but a game once
  it's started (each hub's own `content/arcade.css` and `widget/games.css`) wasn't swept. Open each in a scripted browser at
  that size, the way `tools/ci/smoke.js`'s 320 px check does, and fix any that scroll sideways or cut off a control.
  Done (#508): Heme & Endo Exam 3's six games, from `b0057d1` on today's widget, fixed in `widget/games.css` (and Showdown's
  column headers in `widget/games.js`); the smoke test's 320 px check now starts every game of a hub with an arcade.
- [x] **A hub's report-reply pop-up covers the reward card on a phone** (2026-11-19, seen while moving the card to
  `widget/prize.js`): on an emulated iPhone 13 (Perio, the preview's made-up data) a reply pop-up open at the top of the
  screen sits over the gold card (`.hx-prizes`, z-index 45) so only its first line shows. On `main` too. Perhaps lift the
  card above the pop-up for its few seconds, or drop it in under the pop-up. Done 2026-11-20: the card is lifted above the pop-up for its
  few seconds (`.hx-prizes` z-index 10004 in `widget/prize.js`: over `.sh-reply`'s 10001, under a phone's toasts' 10005,
  which drop in under it). The same overlap was on a laptop from about 870 to 1,250 px wide, where the pop-up (bottom right)
  covered the card's right end; fixed by the same line. Checked on the preview's made-up data on Review of Systems and Heme
  & Endo Exam 3, iPhone 13 and 1100 px: the card is on top. (#497)
- [x] **Read the data-quality report** (done 2026-11-20 at 8:30 am Central, the admin page's kept copy of 1:41 am, in `LESSONS.md`'s
  Live signals: no test rows, every table writing; the one problem it can't see, `quiet.js`'s `pq-` rows, found by reading question
  health) (#503) (2026-11-18, the evening lessons refresh; 2026-11-19, the Perio retrospective):
  `select sh_data_quality();` stopped at the audit's 5 s limit both times (80 people in Perio on its final's eve; then at 12:40 pm
  the next day, between the Perio final and the Heme & Endo Exam 3 eve). `qh_report('perio')` was read with the retrospective
  (2026-11-19: no miskeys). `migration_v83.sql` is live since 2026-11-20 (1:45 am Central): read the admin page's kept copy
  instead, at any hour (`admin_cache`'s `quality`, first worked out at 1:41 am that night; the query in `tools/lessons-refresh.md`
  step 1; refreshed nightly for a week, and every 15 minutes while the admin page is in use). Tick this when it's read. (Not run again on 2026-11-19 at 5 pm either, the
  Heme & Endo Exam 3 eve; that audit found test runs in the data by reading the clicks, BUG-192.)
- [x] **More ways to earn crowns, if Sam wants them** (done 2026-11-20: Sam, "Yes and backpay"; seven prizes in `migration_v92.sql`, [game-server](../reference/game-server.md)) (#514) (2026-11-17; Sam, with the prizes of `migration_v68.sql`: "im open to
  other ways too"). Ideas offered, none built: catching the Tooth Fairy or the Golden Probe, a perfect mock, Yesterday's
  misses all right, an idea of yours marked done on the idea board, the first day back after a week away. Each would be one
  `xp_awards` row with a key that pays once and an amount in `sh_prizes()` ([game-server](../reference/game-server.md)).
  (Studying's rate was raised to 5 crowns per 10 XP the same day, Sam: "lets increase it to 5 crowns per 10xp".)
- [x] **After the redesign's release: what the old pages still hold up** (2026-11-13, [the release](done/2026-11-06-redesign-release.md)).
  **The last single-file hub pages came down 2026-11-19** (Sam: "lets go ahead and take down all old pages"), so this can
  start: take out the `NEW` (`html.shx`)
  branches in `widget/ranks.js` and `widget/rankup.js` (the old cards, the 23-trophy list), the old house picture and
  `sh_rank_tier`'s use in `widget/pet.js` (`houseSvg`: today only the fallback under the place on the dashboard), the
  `rpc2` fallbacks in `widget/dash.js` for a database without the game layer, `legacy` and the unused `modes` in `hubs.js`,
  and any separate widget file or the full client (`widget/vendor/supabase-2.117.2.js`) that `grep` finds no page loading
  by name (`review/` keeps the full client). The sources of a bundle are never deleted. `legacy` goes only with the
  `dash.js` code that reads it (it tells the dashboard a hub has no `content/`). Also the old pages' leftovers in
  `tools/ci/smoke.js` (`WHY_EXEMPT` and the other exemption sets, the `OLD` hub's checks, the old cards' markup check). (#496)
- [x] **What the old pages' cleanup left** (2026-11-20, from #496; none of it changes what students see; done in #512, (2) as `:root` since the bare selectors changed the pages):
  (1) `widget/hub-art/<hub>.js` for the hubs whose pages came down (`generic`, `heme-endo-exam2`, `heme-endo-exam3`, `occlusion`,
  `pcd-implants-exam1`, `perio`, `special-patient-care`): `tools/figures/site/build.mjs` writes one for every hub in its list
  and no page loads them; trim its list, keeping what the dashboard's art (`hub-art/dash.js`) and the recaps still need.
  (2) Every CSS rule that starts `html.shx` (`widget/hub.css`, `trophies.css`, `study-modes.css`, `dash.css` and others;
  every page sets the class now) could lose the prefix, with a screenshot check of the dashboard and a hub.
  (3) Options that are now always on: `widget/pet.js`'s `live` and `widget/replies.js`'s `v2` (the dashboard passes true),
  with their branches for a database without the game layer, and the preview's answers to the non-`_v2` calls nothing sends
  any more (`tools/preview/runtime/preview.js`). (4) The tools' old-page branches: `tools/release/a11y.js` (an old hub's
  modes), `tools/release/lib.js`, `tools/ci/cases.js` and `tools/ci/preview.js` (the single-file case), and the line in
  `AGENTS.md` and [verify-before-pushing](../how-to/verify-before-pushing.md) about keeping `window.SH_EXPORT = {` last in an
  old hub's script.
- [ ] **The rest of the fallbacks for a database without the game layer** (2026-11-20, found in #512; nothing students see):
  every page asks for the game layer now, but `widget/v3.js` still falls back to `get_widget_bootstrap` (`GAME.want`,
  `GAME.on = false`), `widget/ranks-hub.js` to `get_rank_profile`, `widget/ranks.js` to `get_trophy_stats`, and
  `widget/replies.js` and `widget/dash.js` to `submit_survey` (and `submit_exam_debrief`), with the preview's answers to
  each (`tools/preview/runtime/preview.js`) and the smoke test's stubs. Take them out together, with `tools/ci/quiet.js`
  run, since a missing `_v2` call then fails instead of falling back. Also: the five archived hubs' tint lines in
  `widget/hub.css` (`:root[data-hx-hub="perio"]`... `.hx[data-hub=...]`: check the dashboard's Past hubs and the idea
  board's notes still need the `.hx` half) and whether pages still need to set the `shx` class (`widget/eggs.js` reads it).
- [x] **The hubs' own arcade lobby, never shown on the engine** (2026-11-19, found retesting BUG-012): More's Arcade on a hub on
  the engine draws its own lobby (`moreArcade()` in `widget/hub.js`) and opens a game on its stage, so the lobby inside a hub's
  `content/arcade.js` (`lobby()` in Perio's, with the `.ar-board-tabs` boards; Heme & Endo Exam 3's has `.ar-board-grid`) looks
  unreachable. Check whether anything still calls it (its mute button redraws it) and whether its per-game boards are shown
  anywhere else; if not, take it out of the next hub built from these files ([build-a-hub](../how-to/build-a-hub.md)).
  Done (#508): unreachable (every game's Back went to the engine's lobby in a scripted run), and its top-ten boards
  aren't shown anywhere else (only the game-over card's top five); [build-a-hub](../how-to/build-a-hub.md) says what to leave out.
- [ ] **Learn: a typed answer** (2026-11-13, idea from making Learn "more like quizlet"): Quizlet's Learn ends on written
  questions. Ours ends on recall before the choices show (Sam's call 5, 2026-11-06), because a typed answer can't be
  graded against a bank question's choice. Only if Sam asks for it.
- [ ] **Flashcards: undo the last rating** (2026-11-13, same): not built, because a rating is paid and sent to the server
  at once; it needs the rating held back a few seconds first. Only if Sam asks for it.
- [x] **A smoke check for visiting from a hub's arcade board** (2026-11-19, from #467): `tools/ci/smoke.js` checks the
  dashboard's visit but not a hub's. Stub `get_arcade_leaderboard_v2` and `get_place`, finish a game, tap a name on the
  game-over board: the place opens as a visit, Escape gives focus back, a key that opens nothing says so on the row.
  Done (#508): `visitCheck` in `tools/ci/smoke.js`, passed on Exam 3 from `b0057d1`; skipped (a note says so) until a live
  hub has an arcade with Smile, like the wiring check.
- [ ] **A sound switch for the arcade on the engine** (2026-11-20, found checking the hubs' own lobby): the games' beeps
  (`beep()` in a hub's `content/arcade.js`) obey `STATE.arcade.muted`, but the only switch for it was the hub's own lobby,
  which the engine never shows, so on the engine the beeps can't be turned off. When the next hub with an arcade is built:
  a sound switch in the engine's lobby (`moreArcade()` in `widget/hub.js`), or no beeps. Sam's call which.
- [ ] **Sound for the hand-off and the Dark Matter unlock**, only if the redesign ever gets a sound setting (it has none; the
  scenes are silent on purpose: [the journeys](done/2026-11-06-redesign-progression-journeys.md)).
- [x] **A new hub's blocking time after the bundles** (2026-11-13, [phase 5, part 2](done/2026-11-05-redesign-phase-5-backend.md), [#358](https://github.com/smcmurry6-source/study-hubs/pull/358)):
  on `perf.js`'s slow phone a new hub's total blocking time was 230-365 ms on `main` and is 310-540 ms with the bundles
  across runs (350-385 in the final run; budget 500, fails past 750). The same scripts run, in fewer and longer tasks.
  Not looked into: a trace of the first seconds to see which tasks are long (the engine's start, or `widget/v3.js`'s,
  which is shared with the live hubs). Worth a look at the release, when v3.js no longer has to stay as it is for the old pages. Done (#498): traced with the Long Animation Frames API on the slow phone; the fixes are in the line above, and what is left is the next line.
- [x] **A hub's three remaining long tasks after Home** (2026-11-20, #498's trace of Review of Systems on `perf.js`'s slow phone): `widget/v3.js`'s start runs in one script task (about 180 ms, 60 of it a forced layout); the synced answers redraw the whole of Home (`applySync` to `SH_SYNC.merge` to `renderHome`, about 130 ms, then about 110 ms laying the new Home out for its bars); and parsing `notes.json` and `questions.json` (about 70 ms each). Ideas: split v3.js's start into a few tasks, have the merge redraw only the parts whose numbers changed, and fetch the notes as each part opens. Done (#513): v3.js's notes-layout fitter starts in the next frame (its forced layout was 65 ms of the script task), the merge redraws only Home's parts whose markup changed (`refreshHome()`, in its own task) and the meters skip writes that change nothing, and `notes.json`, `questions.json` and `variants.json` are parsed a few lines at a time (`parseSteps()` in `widget/hub.js`, checked against `JSON.parse` by `tools/ci/syntax.js`) instead of fetched per lecture (search and the widget need all of the notes at idle anyway, and the page is at 11 of its 12 requests). Review of Systems: about 475 to about 415 ms across 14 alternating runs (`tbt` budget 700 to 650). What is still long is below.
- [ ] **The restyle after `widget/v3.css` goes in** (2026-11-20, from the line above): the hub bundle puts v3.css's 107 KB in as a `<style>` once the page is drawn, and the browser then styles and lays out the whole page again, about 120 ms on `perf.js`'s slow phone (now in the first frame after it, where v3.js's fitter measures). Ideas: only the rules a hub on the engine uses (much of v3.css styled the old single-file pages, down since 2026-11-19), or the sheet with the first paint (weigh the first screen's bytes). Measure as #498 did.
- [ ] **`perf.js` counts DevTools' own work as blocking time** (2026-11-20): it turns on the Network domain without a buffer limit, so Chromium keeps a copy of each response for DevTools; for the two 1.2 MB content files that was about 30-40 ms of each 70 ms "read" task in a trace (with `Network.enable({ maxTotalBufferSize: 0, maxResourceBufferSize: 0 })` it was 27-32). Students never pay it. A fix changes every page's measured `tbt`: rebaseline in the same PR, with Sam's OK on the budgets.
- [x] Anima figures on phones: at 390 px their in-drawing labels scale down to about 6-7 px. A plain bigger font for narrow screens clipped labels at the edges in about half the PCD Implants figures (tried 2026-11-04, reverted); it needs a per-figure phone layout (labels moved inside the drawing) or tap-to-zoom. Heme & Endo Exam 3's 22 (2026-11-17) mostly draw them at 10-15 px; its four L17 figures after the oocyte are the smallest (labels about 8 px on the timeline, implantation, estriol and breastfeeding figures). Done with tap-to-zoom in the engine (`figZoomWrap()` in `widget/hub.js`; [diagrams-anima](../rules/diagrams-anima.md)) (#507)
- [x] Retention, the part not built yet (done: `migration_v93.sql`, applied after the merge; Sam's two answers 2026-11-21 in [decisions](../decisions.md)) (#516) (approved 2026-11-04, [analytics-retention](../reference/analytics-retention.md)): before the school year ends (spring 2027), collapse `activity_hourly` / `activity_visits` older than the school year to hub × section × day with people counts and no ids, as one more step in `sh_retention_run`. **Since migration_v68 the wallet pays 100 crowns per hour of hub time from `activity_hourly`** (`sh_time_crowns`): before the collapse deletes a visitor's hours, keep what they paid (each visitor's capped ping total in a small table `sh_time_crowns` reads, or the crowns as a row), or balances drop. Also ask Sam about the two rows the question-health work proposed (`question_events`, `question_feedback`).
- [x] **Apply `migration_v93.sql` after its PR merges** (done 2026-11-20 at about 9:45 pm Central, from the merging session, md5-checked before and after; in `supabase/schema.sql` since #517) (#517) (2026-11-21, the old analytics compacted): one connector call at any quiet hour (new tables,
  `sh_time_crowns`, `sh_retention_run`, a trigger on `visitor_links`; nothing is collapsed until about 2027-09-13), md5-checked; then
  append it to `supabase/schema.sql` and take its line out of `supabase/pending-migrations.txt`, in a small PR. Its PR's data fix
  (`tools/data-fixes/2026-11-21-feedback-of-hubs-down.sql`) runs by itself after the merge and doesn't need it.
- [ ] **The Supabase confirmation hook misses a connector named by id** (2026-11-21, applying v93): `.claude/settings.json`'s Elicitation
  matcher is `Supabase|supabase`, but in some cloud sessions the connector's server is named by a UUID (its tools
  `mcp__c63257eb-1d94-419c-8868-716ff71ffcf6__*`), so `.claude/hooks/supabase-confirm.js` never runs there (no line in its log) and
  `apply_migration`'s question goes to Sam's app and times out (about 4 minutes). Sam's call: widen the matcher (add that id, or
  match all servers and let the hook check the question), or keep applying from a session where the server is named "Supabase".
- [ ] **Before the first collapse (about 2027-09-13), point the year-spanning readers at the totals** (2026-11-21, migration_v93):
  `sh_insights` (the admin page's Insights, every hub side by side), `get_hub_recap`, `tools/retro.sql` and `tools/lessons-daily.sql` read
  `activity_hourly` only, so a hub older than a year would show no time. Read `activity_daily` / `activity_visits_daily` (people per day,
  no ids) for days past the school year, or decide those hubs' numbers are only in their published recaps and `LESSONS.md`.
- [ ] **A week after `migration_v85` is applied (2026-11-19), so on 2026-11-26, check what the part saved** (2026-11-19): the admin page's Ask Timmy tab (cost by
  day against 11-14 to 11-18's) and the edge logs' `turn` lines (`content`: `part`, `part+full`, `full`). In the eval, 16 of 50
  first questions were asked again with the whole content; if real students' share is much higher, the part costs more than it
  saves: send more with it (another lecture, the review tables) or turn it off (`WARM_MS` in `supabase/functions/timmy/core.js`).
- [ ] **Ask Timmy's quote check fails a table cell under three words** (2026-11-19, the eval's pe-02 on the whole content):
  he cited R1.3 with "≥10 cigarettes/day", which is in the table, but `quoteIn` wants at least three words or the whole unit, so
  the link was dropped and the eval failed. Either accept a whole table cell (the text between two ` · `) as a quote, or say in
  `RULES` that a table quote takes the row's label with it.
- [x] **Review of Systems' a11y screens have no baseline entries** (2026-11-20, seen running a11y.js for #494): `tools/release/a11y.js` lists its five screens (home, notes, questions, more, dark) as "not in the baseline yet", so only a serious or critical issue there fails. All five were at 0 axe nodes: add them to `tools/release/baselines/a11y.json` at 0 (by hand, or `--update --hub review-of-systems`). Done by #503, which renamed Exam 3's entries to Review of Systems' (home, notes, questions, more, dark, all at 0); found and ticked in #506.
- [ ] **The a11y baseline still lists Perio's five screens** (2026-11-20, seen in #506): `perio · home`, `notes`, `questions`, `more` and `perio (dark)` in `tools/release/baselines/a11y.json`, and `--hub perio` in `tools/release/a11y.js`'s usage line, though Perio's page came down 2026-11-19. Harmless (a screen not run isn't compared), but take them out and point the usage line at `review-of-systems`.
- [ ] **A "Delete my data" button, only if Sam asks** (2026-11-04, left unticked in [the retention task](done/2026-11-04-analytics-retention.md),
  moved here 2026-11-20): a button in Settings that deletes every row for this browser's id, and the id shown in Stats so a
  deletion request can be honored ([analytics-retention](../reference/analytics-retention.md)). Not asked for; build it only
  when Sam asks.
- [ ] **Parked: a second free Supabase project for the analytics, when it's needed** (Sam, 2026-11-18: "i think adding the
  second database may be necessary at some point"; "Not now"; moved here from [the database-load task](done/2026-11-18-database-load.md),
  2026-11-20): pings, clicks, feature events and question health (about a third of the requests, over half the storage) move
  to their own free project; answers, XP and the shop stay. Due once the database nears about 420 MB of its 500 MB (every
  lessons audit reads the size, `tools/lessons-refresh.md` step 1; 323 MB on 2026-11-19).
- [ ] **Bring the 16 open boards PRs up to date** (2026-11-20, after the catch-up of `claude/boards-hub` with `main`): #81, #87,
  #91, #94, #95, #97-#104, #106, #110, #111 each need `origin/claude/boards-hub` merged in, `node tools/build-boards.js`
  rerun (never resolve `hubs/boards/index.html` by hand) and their checks rerun; then the fixes `docs/boards/reviews/session-7b.md`
  asks for (#94, #95, #97, #99-#101) and the fact check for #103, #104, #106. #97's migration takes the next free number on
  `main`. Merging any of them is Sam's call ([boards](../hubs/boards.md)).
- [ ] **Sam: should the boards hub move onto the engine before it ships?** (2026-11-20) Every hub on `main` is on the engine
  and no new hub is built as one page, but `claude/boards-hub`'s page is generated by `tools/build-boards.js`; its smoke
  test walks it separately ([boards](../hubs/boards.md)). Also Sam's: what ranks a board exam's High Likelihood topics,
  needed once its first unit is published.
