---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [x] **Sam's calls on the weekly pennant** (2026-11-22, idea board #6, `migration_v98.sql`): Sam, "lets do 100, the rest
  looks good": the goal is 100 answers a week, the prize 500 XP and crowns, no pennant on a visit; in
  [decisions](../decisions.md) (#540)
- [ ] **The weekly pennant's first week, read after a Monday sweep** (2026-11-22): once `migration_v98` has run a week, how
  many pennants were made and how many by the sweep (`select how, count(*) from week_pennants group by 1`, totals only): a
  large sweep share means the page's claim is missing them (`widget/pet.js` `weekClaim`).
- [x] **Sam's call: the mystery box's numbers** (2026-11-22, idea board #9, migration_v99, `sh_box_rules()`): proposed 750 crowns a box (about 0.8 of a median study day of about 950 crowns; a third of a 75th-percentile day), up to 3 a Central day (2,250 crowns at most), odds Common 40, Uncommon 30, Rare 18, Epic 9, Legendary 3. For someone who owns nothing a box is worth about 730 crowns of list price, so it costs about what it gives. Change them in `sh_box_rules()` alone (a one-function migration), the About page and [game-server](../reference/game-server.md). **Sam, 2026-11-22: as built** ("The rest looks good to me") (#538)
- [x] **Sam's call: the box's tail** (2026-11-22, same): a rarity you've finished passes its share to the rest, so the box gets better as you own more. Owning every everyday Common and Uncommon, a box is worth about 1,800 crowns of list price for 750; with only Legendaries left, one is 4,000-8,000 for 750. (a) Leave it, a reward for someone who has bought most of the shop (recommended for now: it takes months of buying to get there; check the inventories at the next lessons audit's economy step); (b) the price follows what's left (the list value of what it could give you, never under 750); (c) a finished rarity's roll pays back crowns instead of moving. **Sam, 2026-11-22: (a), leave it** ("The rest looks good to me") (#538)
- [x] **Sam's call: who shows under Studying now** (2026-11-22, same; also asked of the merging session): built as (A) no switch, as for visiting (Sam, 2026-11-11), but only a name someone picked, so the generated name never shows and Go back to a random name takes you off. (B) A, with a Settings switch to leave the list, on by default; (C) the same switch, off by default. **Sam, 2026-11-22: (A), as built** ("The rest looks good to me"); and the Study streaks board became the Crowns board ("Replace study streaks with crowns balance") (#538)
- [ ] **The boards order people tied on a place by chance** (2026-11-22, #533's CI): `get_rank_board_v2`,
  `get_leaderboard_v2` and the others end `order by rnk` alone, so tied people can trade places between loads (and at a
  board's limit, who shows can change). Cosmetic and older than v96: add a stable second key (the name, then the id) when
  someone next changes a board function.
- [ ] **Does Link my devices time out for someone with thousands of answers?** (2026-11-22, applying `migration_v96`): on
  the live database `sh_xp_rebuild` took 25 s for 10 people the first time (cold cache), then about 1 s for 4 others.
  `redeem_link_code` runs a rebuild under anon's 3 s `statement_timeout`, so time one rebuild of a heavy visitor (read-only:
  inside a transaction that rolls back, under `set local statement_timeout`, while the class is quiet) or look for
  `redeem_link_code` timeouts in the Postgres logs. A lead, not a confirmed bug.
- [ ] **The mastery read is slower a call than before the optimization pass** (2026-11-20, its readout): `get_hub_mastery`
  236 → 349 ms on the server on average (673 calls since phase 1), the evening's median 242 → 709 ms on 77 calls, 11% of the
  database's time. Since #459 the page works out the rank between answers, so the reads left are the ones when a hub's page
  opens (`loadOwn()` in `widget/ranks-hub.js`), beside the bootstrap: likely the cold ones, not a slower body, but not checked.
  Read it again a busy evening after `migration_v84.sql` (live 2026-11-20) with the bootstrap; if it's still slow, time it on
  a throwaway copy first-of-page against warmed, and against the body before `migration_v76.sql`, before changing anything
  ([the pass](done/2026-11-18-database-optimization-pass.md), its Log).
  **Read 2026-11-21 (Claude Code, read-only): no busy evening yet, so nothing changed.** Friday night (Nov 20, 6-10 pm Central,
  the edge logs) had 398 requests, 5 answer saves and **no** mastery reads: Heme & Endo Exam 3 was over that morning and
  Review of Systems is the only live hub, its Mock 1 on Thu Dec 3. Since v84 (Nov 20, 2:45 am to Nov 21, 2:45 am Central)
  all 33 mastery reads came on exam morning (3 am to 9 am Central), median 433 ms, 95th percentile 1.2 s at the edge, beside
  209 bootstraps (median 439 ms, 1.7 s). `pg_stat_statements` (still no reset since 2026-11-18 20:57 UTC): 2,240 calls,
  613 s, so 21 calls and about 13 s since the 2:30 am readout of Nov 20 (about 620 ms each, too few to read). A lead for the
  copy: about 5,600 buffer pages touched a call on average (12.6 million over 2,240, 44 MB read from memory each), where
  `get_rank_profile_v2` touches 73. **Read it next on Thu Dec 3, 1-5 am Central**, for Wed Dec 2's evening (the eve of Mock
  1): the edge logs for Dec 3 00:00-04:00 UTC, `pg_stat_statements` less the totals above; if a few people or more opened
  the hub and the median is still over about 250 ms, time it on the copy as above.
- [ ] **Review of Systems: weigh the mock by what Mock 1 asked** (2026-11-19, the hub's build): the hub's 200-question mock
  spreads its questions by the size of each course (`core.json` `mock.blueprint`), a guess: the course announced no counts.
  After Mock 1 (Thu Dec 3, noon), read its exam check-ins (which courses felt heavy, what surprised people) and, before Mock 2
  (Dec 10), move the blueprint toward that, and add High likelihood topics for what the check-ins say came up
  ([hub note](../hubs/review-of-systems.md)).
- [ ] ~~**Review of Systems: an arcade with its own skin** (2026-11-19, the hub's build): it shipped without one (More hides
  the tile). Sam's call whether it wants one; if so, its games, names and lobby art are its own
  ([arcade-skins](../rules/arcade-skins.md)), and the hub comes out of `TEXT_ONLY` in `sw.js`.~~ dropped: Sam, 2026-11-20, "No
  arcade" ([decisions](../decisions.md)).
- [ ] **Review of Systems: Cardio & Respiratory and Renal from their slides** (2026-11-19, the hub's build): their Drive
  folders had the thinnest sources (classmates' guides, no professor slides), so those sections rest most on standard
  references. If Sam can share their slides or transcripts, check those parts against them. Sam, 2026-11-20: "ill get you the other
  slides soon": waiting on Sam.
- [x] **Run the test-runs data fix once more on 2026-11-21** (2026-11-19, the evening lessons audit): the PR that adds
  `tools/ci/no-leaks.js` runs `tools/data-fixes/2026-11-19-test-runs.sql` after its merge, but a smoke test run locally from a
  branch older than the fix (another session's) still writes its game-layer check into the live hub until that branch takes
  `main`. Two days later, run it again (`node tools/after-merge/run.js ... --fix tools/data-fixes/2026-11-19-test-runs.sql`, or
  the connector with Sam's OK; it is safe to run twice), first counting what it would select (its first statement as a `select
  count(*)`), and tick BUG-192's retest. Until then, a Heme & Endo Exam 3 retrospective reads that hub's arcade and Timmy Time
  clicks of 11-19 as test runs. **Run `tools/data-fixes/2026-11-20-quiet-test-rows.sql` again with it** (2026-11-20, the Exam 3
  retrospective): `tools/ci/quiet.js`'s mock checks, run from those same older branches, wrote two `pq-` rows each into question
  health (13 made-up visitors to 6:37 am on 11-20); today's `quiet.js` sends nothing past its routes (checked behind a refusing proxy). **2026-11-21, counted** (the data-fixes PR): the test-runs fix selects 1 visitor, the quiet fix 22 `pq-` rows in Review of Systems (today's `quiet.js` still leaks: [BUG-197](../release/bug-log.md)); the deletes run after the merge of #521, as `tools/data-fixes/2026-11-21-test-rows-again.sql` (both files' bodies, by the After merge workflow, since this session's connector couldn't answer its "are you sure?": the hook line below). Tick this once its result shows on `main` and a count finds no test visitors and no `pq-` rows left past BUG-197's. **Done** (#521; checked in #524): #521's After merge run on `main` green, so `2026-11-21-test-rows-again.sql` ran; counted 2026-11-21 (read-only, each query alone): 0 test visitors in the test-runs selection and 0 `qid like 'pq-%'` rows in question events. BUG-192 retested; BUG-197's leak closed by `tools/ci/no-leaks.js`'s guard proxy (#524).
- [ ] **Retest BUG-197 a day after #524 merges** (2026-11-21): count `select count(*) from question_events where qid like 'pq-%'` (read-only, under `statement_timeout = '5s'`); 0 means the guard proxy holds: set BUG-197 to retested. Any rows: add a data fix like `tools/data-fixes/2026-11-20-quiet-test-rows.sql` and look for the path the guard missed.
- [ ] **The smoke test's game-layer wiring check runs again on the next hub with an arcade** (2026-11-20, Exam 3's page down):
  `tools/ci/smoke.js`'s `wiringCheck` (Million-Dollar Smile's sessions and answers, Timmy Time's minutes) needs a live engine hub
  with Smile in its `content/arcade.js`, and Review of Systems has no arcade, so it is skipped until one is built. When the next
  hub with an arcade ships, check its smoke run prints "the game layer's wiring" for it (nothing to change: it picks the hub itself).
- [x] **The rest of the fallbacks for a database without the game layer** (2026-11-20, found in #512; nothing students see):
  every page asks for the game layer now, but `widget/v3.js` still falls back to `get_widget_bootstrap` (`GAME.want`,
  `GAME.on = false`), `widget/ranks-hub.js` to `get_rank_profile`, `widget/ranks.js` to `get_trophy_stats`, and
  `widget/replies.js` and `widget/dash.js` to `submit_survey` (and `submit_exam_debrief`), with the preview's answers to
  each (`tools/preview/runtime/preview.js`) and the smoke test's stubs. Take them out together, with `tools/ci/quiet.js`
  run, since a missing `_v2` call then fails instead of falling back. Also: the five archived hubs' tint lines in
  `widget/hub.css` (`:root[data-hx-hub="perio"]`... `.hx[data-hub=...]`: check the dashboard's Past hubs and the idea
  board's notes still need the `.hx` half) and whether pages still need to set the `shx` class (`widget/eggs.js` reads it). (#523: the page always asks for the game layer
  and never switches back to the old calls; the preview answers only the `_v2` names; `tools/ci/quiet.js` passed. The five
  tint lines came out: no page sets those hubs' `data-hx-hub`, and the dashboard's tinted parts and the idea board's notes
  take inline colors, not `.hx[data-hub]`. The `shx` class stays: the preview's pill and the figure builds select
  `html.shx`; eggs.js's font fallback for pages without it came out. Left as they are: `answerToday()` for an answer the
  server can't grade, the prize calls' `missing` fallbacks, `get_display_name` and `get_hub_overrides` when the bootstrap
  times out, and the database's old functions themselves, which `tools/release/xp.js` still tests.)
- [ ] **Learn: a typed answer** (2026-11-13, idea from making Learn "more like quizlet"): Quizlet's Learn ends on written
  questions. Ours ends on recall before the choices show (Sam's call 5, 2026-11-06), because a typed answer can't be
  graded against a bank question's choice. Only if Sam asks for it.
- [ ] **Flashcards: undo the last rating** (2026-11-13, same): not built, because a rating is paid and sent to the server
  at once; it needs the rating held back a few seconds first. Only if Sam asks for it.
- [ ] ~~**Sound for the hand-off and the Dark Matter unlock**, only if the redesign ever gets a sound setting (it has none; the
  scenes are silent on purpose: [the journeys](done/2026-11-06-redesign-progression-journeys.md)).~~ dropped: Sam, 2026-11-21,
  "No beeps" (no sound setting is coming).
- [x] **The restyle after `widget/v3.css` goes in** (2026-11-20, from the line above): the hub bundle puts v3.css's 107 KB in as a `<style>` once the page is drawn, and the browser then styles and lays out the whole page again, about 120 ms on `perf.js`'s slow phone (now in the first frame after it, where v3.js's fitter measures). Ideas: only the rules a hub on the engine uses (much of v3.css styled the old single-file pages, down since 2026-11-19), or the sheet with the first paint (weigh the first screen's bytes). Measure as #498 did. Done (#525): timed by forcing style and layout right as the sheet goes in, on the slow phone (CPU 4x), then one rule at a time on a loaded page: all but about 2 ms of the extra cost was one rule, `:root{--sh-cp-fill:...}` (the class-picks fill), a custom property new to the root, so every element's inherited values changed and all of them were restyled. It is now set on `.sh-cp`, the only element that reads it (`--ink` is only set on `:root`, so the color is the same; the engine draws its own class picks, so no live page draws a `.sh-cp` at all). Putting the sheet in: about 58 to about 21 ms (median of 8); `perf.js`'s `tbt` on Review of Systems (the fixed script, the next line but one), 10 alternating runs each: medians about 237 to about 156 ms. Computed styles of every element on Home, Notes, Questions and More, light and dark, are the same, and the phone screenshots are pixel-identical. Not done: cutting v3.css to the rules a hub on the engine uses (the next line), and the sheet with the first paint (not needed now).
- [ ] **Cut `widget/v3.css` to the rules a hub on the engine draws** (2026-11-21, left from the line above): about 20 ms of putting the sheet in is still matching its 789 rules against the page, and much of it styled the old single-file pages. A static check finds almost nothing dead yet, because `widget/v3.js` still draws those old parts; once the game layer's last fallbacks are out of `widget/v3.js` (another session, 2026-11-21), find the rules nothing left can draw, drop them, and diff every element's computed style before and after as #525 did. Small gain: do it with the next v3.js cleanup, not on its own.
- [x] **`perf.js` counts DevTools' own work as blocking time** (2026-11-20): it turns on the Network domain without a buffer limit, so Chromium keeps a copy of each response for DevTools; for the two 1.2 MB content files that was about 30-40 ms of each 70 ms "read" task in a trace (with `Network.enable({ maxTotalBufferSize: 0, maxResourceBufferSize: 0 })` it was 27-32). Students never pay it. A fix changes every page's measured `tbt`: rebaseline in the same PR, with Sam's OK on the budgets. Done (#525; Sam, 2026-11-21: "Yes if you think so"): `perf.js` turns the Network domain on with `maxTotalBufferSize: 0, maxResourceBufferSize: 0`. It moved no number, so the budgets stay as they are: on `main`'s code, 5 alternating runs of every page with the old and the fixed script gave `tbt` medians of 403 and 316 ms (dashboard), 176 and 182 (About), 299 and 347 (Review of Systems), and 10 more on Review of Systems 238 and 260, all inside the run-to-run spread (Review of Systems 141 to 566); bytes and requests were the same in every run. A trace of 4 loads each way showed the same long tasks: #513 since split the content files' read (`parseSteps()`), where the copy's 30-40 ms was.
- [x] **The Supabase confirmation hook misses a connector named by id** (2026-11-21, applying v93): `.claude/settings.json`'s Elicitation
  matcher is `Supabase|supabase`, but in some cloud sessions the connector's server is named by a UUID (its tools
  `mcp__c63257eb-1d94-419c-8868-716ff71ffcf6__*`), so `.claude/hooks/supabase-confirm.js` never runs there (no line in its log) and
  `apply_migration`'s question goes to Sam's app and times out (about 4 minutes). Sam's call: widen the matcher (add that id, or
  match all servers and let the hook check the question), or keep applying from a session where the server is named "Supabase".
  **Done** (2026-11-22, Sam: "Yes to 2 and 3", 3 being "The Supabase hook: should it match connectors named by an ID?"; [decisions](../decisions.md)): the id is added
  to the matcher, the allow list and the three "ask" rules in `.claude/settings.json` (not a pattern for every server, which would
  answer other connectors' questions too); a session that finds the connector under another id adds that one the same way. Checked
  once a session whose connector is named by the id applies a migration without the question reaching Sam's app.
- [x] **Going back to a random name on one linked device: the other takes it as picked** (2026-11-21, BUG-196's fix): the
  other device now shows the server's name, but the bootstrap's `display_name` doesn't say whether it is a random one, so
  that device keeps it as its own (its name window offers "Go back to a random name"; the idea board asks for a name when it
  refuses one). Small: a `name_custom` flag in `get_widget_bootstrap_v2` (a migration copied from `main`'s newest copy), and
  `nameFromServer` in `widget/v3.js` and `widget/dash.js` clears the device's copy when it's false. (#523: `migration_v94`, applied
  2026-11-21 at 8:09 am Central; retested with BUG-196 after the merge.)
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
- [x] **The a11y baseline still lists Perio's five screens** (2026-11-20, seen in #506): `perio · home`, `notes`, `questions`, `more` and `perio (dark)` in `tools/release/baselines/a11y.json`, and `--hub perio` in `tools/release/a11y.js`'s usage line, though Perio's page came down 2026-11-19. Harmless (a screen not run isn't compared), but take them out and point the usage line at `review-of-systems`. Done (#525).
- [ ] **A "Delete my data" button, only if Sam asks** (2026-11-04, left unticked in [the retention task](done/2026-11-04-analytics-retention.md),
  moved here 2026-11-20): a button in Settings that deletes every row for this browser's id, and the id shown in Stats so a
  deletion request can be honored ([analytics-retention](../reference/analytics-retention.md)). Not asked for; build it only
  when Sam asks.
- [ ] **Parked: a second free Supabase project for the analytics, when it's needed** (Sam, 2026-11-18: "i think adding the
  second database may be necessary at some point"; "Not now"; moved here from [the database-load task](done/2026-11-18-database-load.md),
  2026-11-20): pings, clicks, feature events and question health (about a third of the requests, over half the storage) move
  to their own free project; answers, XP and the shop stay. Due once the database nears about 420 MB of its 500 MB (every
  lessons audit reads the size, `tools/lessons-refresh.md` step 1; 323 MB on 2026-11-19).
  **2026-11-22:** Sam plans to make it; it is package 4 of [the sustainability task](2026-11-22-sustainable-for-years.md),
  and after packages 1 and 2 (shorter analytics windows, archived hubs' answers packed away) it's about load more than room
  (359 MB on 2026-11-21).
- [ ] **Bring the 16 open boards PRs up to date** (2026-11-20, after the catch-up of `claude/boards-hub` with `main`): #81, #87,
  #91, #94, #95, #97-#104, #106, #110, #111 each need `origin/claude/boards-hub` merged in, `node tools/build-boards.js`
  rerun (never resolve `hubs/boards/index.html` by hand) and their checks rerun; then the fixes `docs/boards/reviews/session-7b.md`
  asks for (#94, #95, #97, #99-#101) and the fact check for #103, #104, #106. #97's migration takes the next free number on
  `main`. Merging any of them is Sam's call ([boards](../hubs/boards.md)).
- [x] **Sam: should the boards hub move onto the engine before it ships?** (2026-11-20) Every hub on `main` is on the engine
  and no new hub is built as one page, but `claude/boards-hub`'s page is generated by `tools/build-boards.js`; its smoke
  test walks it separately ([boards](../hubs/boards.md)). (What ranks a board exam's High Likelihood topics: decided
  2026-11-21, none for now, the line below.)
  **Decided** (2026-11-22, Sam: "Yes to 2 and 3", 2 being "Should boards move onto the hub engine? I recommend yes"): it moves onto the engine
  before it ships; the work is [its task](2026-11-22-boards-onto-the-engine.md).
- [ ] **Boards: the High Likelihood check skips boards when its first unit is published** (Sam, 2026-11-21: "I have no idea so
  maybe just take it out for now"): on `claude/boards-hub`, `tools/ci/smoke.js`'s check for a lecture with questions but no
  topics skips the boards hub, and `LIKELY_TOPICS` stays empty ([boards](../hubs/boards.md)).
