---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [ ] **The dashboard's progress ring reads only this device's copy of the hub** (2026-11-24, found fixing BUG-107):
  `readProgress()` in `widget/dash.js` reads the hub's saved state on the device, so on a new or linked device (and in the
  preview before a hub is opened) the open hub's card says "Your progress in this hub shows here" and 0 tried, though the
  bootstrap already brings the account's answers. Draw the ring from those answers when the device has none? Live, minor.
- [ ] **Scroll the dashboard and the shop on a real phone** (2026-11-22, the no-pausing change): an iPhone in Safari and an
  Android phone in Chrome, a long scroll of the dashboard top to bottom and of the shop's shelves, then Timmy's place at
  night. The cloud browser draws without a graphics card, so the compositor's part (the stage's sparkles and confetti, the
  place card's layer) couldn't be measured there ([motion-cost](../reference/motion-cost.md)). Jitter that is left goes in
  the bug log with what was on screen.
- [ ] **Timmy's place at night: about 60 stars twinkle one by one inside the stage's drawing** (2026-11-22): the open
  place view keeps a slowed phone's main thread about half busy (`main` about nine-tenths, so not new). Draw the night sky's
  stars as a layer over the scene, the way the leaderboard's stage does its sparkles (`tools/figures/site/place.mjs`,
  `widget/place.js`), or twinkle them in a few groups, and measure again ([motion-cost](../reference/motion-cost.md)).
- [ ] **What else moves inside a dashboard drawing** (2026-11-22): the classroom's Timmys bob (`rm-bob`, up to 10), the
  hub card's megaphone waves (`dx-wn-wave`, `dx-wn-spark`), the idea board's and the recap's Timmys blink. Each is small;
  lift one out of its drawing like the stage if a real phone shows it.
- [ ] **The shop takes about 4 s to open on a slowed phone** (2026-11-22, measured at 4x): the dashboard draws itself again
  on `sh:shop`, a set's art file loads, and the room's size is worked out again. Find which of the three is most of it.
- [ ] **Read how the first Midnight Plaque went, the morning of Dec 3** (2026-11-22, idea board #4): `select * from
  eve_bosses where day = '2026-12-02'` (fell or not, when, how many people, what it paid), and the pg_cron runs of
  `sh-eve-boss` that night (any over a second, any failed). If it fell before 6 pm (from 3 pm, the past eves' middle one would have fallen about 8 pm) or got away with over a quarter left,
  tell Sam and suggest a new HP for Dec 9 (`eveBoss: <hp>` on mock2 in `hubs.js`, which the After merge step writes before
  the eve). Totals only, over 5 or more people ([learner-data-privacy](../rules/learner-data-privacy.md)).
- [ ] **The weekly pennant's first week, read after a Monday sweep** (2026-11-22): once `migration_v98` has run a week, how
  many pennants were made and how many by the sweep (`select how, count(*) from week_pennants group by 1`, totals only): a
  large sweep share means the page's claim is missing them (`widget/pet.js` `weekClaim`).
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
- [x] **Retest BUG-197 a day after #524 merges** (2026-11-21): count `select count(*) from question_events where qid like 'pq-%'` (read-only, under `statement_timeout = '5s'`); 0 means the guard proxy holds: set BUG-197 to retested. Any rows: add a data fix like `tools/data-fixes/2026-11-20-quiet-test-rows.sql` and look for the path the guard missed. Done 2026-11-24 (#544): 2 rows, both from 12 minutes before #524 merged, none since; BUG-197 retested, and `tools/data-fixes/2026-11-24-bug-197-last-rows.sql` takes the two after the merge.
- [ ] **The smoke test's game-layer wiring check runs again on the next hub with an arcade** (2026-11-20, Exam 3's page down):
  `tools/ci/smoke.js`'s `wiringCheck` (Million-Dollar Smile's sessions and answers, Timmy Time's minutes) needs a live engine hub
  with Smile in its `content/arcade.js`, and Review of Systems has no arcade, so it is skipped until one is built. When the next
  hub with an arcade ships, check its smoke run prints "the game layer's wiring" for it (nothing to change: it picks the hub itself).
- [ ] **Learn: a typed answer** (2026-11-13, idea from making Learn "more like quizlet"): Quizlet's Learn ends on written
  questions. Ours ends on recall before the choices show (Sam's call 5, 2026-11-06), because a typed answer can't be
  graded against a bank question's choice. Only if Sam asks for it.
- [ ] **Flashcards: undo the last rating** (2026-11-13, same): not built, because a rating is paid and sent to the server
  at once; it needs the rating held back a few seconds first. Only if Sam asks for it.
- [ ] **Cut `widget/v3.css` to the rules a hub on the engine draws** (2026-11-21, left from #525's restyle fix): about 20 ms of putting the sheet in is still matching its 789 rules against the page, and much of it styled the old single-file pages. A static check finds almost nothing dead yet, because `widget/v3.js` still draws those old parts; once the game layer's last fallbacks are out of `widget/v3.js` (another session, 2026-11-21), find the rules nothing left can draw, drop them, and diff every element's computed style before and after as #525 did. Small gain: do it with the next v3.js cleanup, not on its own.
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
- [ ] **The open boards PRs, as the engine plan splits them** (2026-11-20; rewritten 2026-11-24 to section 6 of
  [the engine plan](https://github.com/smcmurry6-source/study-hubs/blob/claude/boards-hub/docs/boards/ENGINE_PLAN.md), on
  `claude/boards-hub`, which says each one's step): **#81, #97, #100 and #102 are closed as replaced** (2026-11-22: the
  engine's card and bank, T-13's `item_state`, `widget/cases.js`'s charts, T-14's mock blocks). **#95 and #101 land through
  T-16 and T-17** (Chairside's core, then its art and sound, each rebased onto the engine move), then close as landed. **The
  other ten are finished as they are**: #87, #91, #94, #98, #99, #103, #104, #106, #110 and #111, each with the small fix,
  checker or quote pass, or read section 6 gives it. None merges `main` in on its own, and once T-07 has landed they merge
  without a page rebuild. Merging any of them is Sam's call ([boards](../hubs/boards.md),
  [the task](2026-11-22-boards-onto-the-engine.md)).
- [ ] **Boards: the High Likelihood check skips boards when its first unit is published** (Sam, 2026-11-21: "I have no idea so
  maybe just take it out for now"): on `claude/boards-hub`, `tools/ci/smoke.js`'s check for a lecture with questions but no
  topics skips the boards hub, and `LIKELY_TOPICS` stays empty ([boards](../hubs/boards.md)).
