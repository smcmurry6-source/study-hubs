---
type: task
status: open
hub: all
created: 2026-11-18
requested-by: Sam
due:
waiting-on:
agent:
pr: https://github.com/smcmurry6-source/study-hubs/pull/421, https://github.com/smcmurry6-source/study-hubs/pull/429, https://github.com/smcmurry6-source/study-hubs/pull/430, https://github.com/smcmurry6-source/study-hubs/pull/434, https://github.com/smcmurry6-source/study-hubs/pull/435, https://github.com/smcmurry6-source/study-hubs/pull/456
---

# Keep heavy queries from failing students' answer saves

## Goal

Students' answers must save even while the admin page, an analysis or a migration runs. On 2026-11-18 they didn't: answer
saves failed in bursts of 1 to 5 minutes, about eight times in the day, up to 1 in 2 of them, the day before the Perio final.

## Context

- Sam, 2026-11-18: "im also getting a bunch of loading errors on the admin page" (Couldn't load the checks, question
  health "canceling statement due to statement timeout", click data, feature events). The admin page's errors and the
  failed answer saves had one cause.
- What happened (Supabase logs, 2026-11-18, times UTC): `record_answer_v2` averaged about 150 ms the night before with no
  errors; that day it returned 242 errors out of about 3,900 calls, all in bursts. Each burst lined up with something heavy:
  14:51 a migration's 43 s transaction and a 17 s backfill; 16:22 and 16:28 the lessons audit's economy queries (11 and
  13 s, through the connector, no time limit); 17:53 and 18:06-18:11 the admin page loading Insights, Clicks, Question health
  and Time all at once. A few bursts (16:53, 17:14) had nothing in the logs over 10 s: probably several shorter queries
  through the connector. At 18:27 and 18:30 another session timed `get_widget_bootstrap_v2` in a loop over the top
  visitors through the connector, and the admin page loaded at 18:31: 26 of 63 saves failed in those minutes. Benchmarks
  belong on a throwaway copy (`tools/release/pg.js`), not the live database. In a burst, answers from one device also waited on its own advisory lock
  (`pg_advisory_xact_lock('xp|' || visitor)`) behind its slower calls.
- The database: the Free plan's Nano size (a shared CPU, up to 0.5 GB of memory; this note first said 1 GB and two cores,
  the paid Micro), 60 connections; anon's `statement_timeout` is 3 s
  ([shared-infrastructure](../reference/shared-infrastructure.md)).
- Done in the PR that wrote this note (its link is in the Log): the admin page reads one query at a time and says "the database was
  busy" on a timeout; failed answer saves retry for about three minutes (same request id, so nothing counts twice); the A/B
  versions page has its own small query.

## Done when

- [x] The admin page's heavy reads are fast or cached: `get_insights`, `get_insight_retries`, `get_data_quality` (1 to 2 s
  each), `get_question_health` (`qh_report`, 1 to 3 s), `get_visitor_summary` / `_by_hub` / `_by_section` and
  `get_exam_debriefs` (about 1 s). For example worked out every 15 minutes by `pg_cron` into a small table the page reads.
  **Done, both** (`migration_v83.sql`, [#456](https://github.com/smcmurry6-source/study-hubs/pull/456); how it works: [admin-operations](../reference/admin-operations.md)).
  Measured on a throwaway copy at the live size (222,000 answers, 114,000 question events, 310 visitors) with the live
  settings. *Faster:* `sh_surface()` ran once per hourly row instead of once per section in Insights and the data-quality
  report (the planner folded the lookup into the join, or tested it before the distinct): insights 1.05 → 0.43 s, data
  quality 0.98 → 0.37 s, the same results. (The 3 s first measured for `qh_report` was the copy's JIT compiler, 4.3 of
  4.4 s; the live database has JIT off: 0.5 s for a big hub.) *Cached:* all nine reads, plus Clicks and features (0.16 s
  over 90 days on the copy, among the 11-18 errors), are worked out ahead into `admin_cache` by pg_cron's `sh-admin-cache`
  (every minute, one read at a time, 10 s limit): every 15 minutes while the page is in use, **every hour while 20 or more
  people are studying**, at once for new arguments or Refresh, nightly for a week after; nothing at all while nobody uses
  the page. Read from the table: under 3 ms each, question health 42 ms (today's reviews and reports laid over the copy)
  against 0.5 s. Same results as the old functions on all 22 reads compared (exact JSON); the page shows when each was
  worked out and "newer numbers on the way" after Refresh. The lessons audit reads the kept copies too
  (`tools/lessons-refresh.md`), so its two heaviest calls no longer touch the class's CPU.
- [x] `migration_v83.sql` applied live at night (1 to 5 am Central, one statement a call, after fetching `main` for the
  number), the tables filled one read a call, `supabase/schema.sql` appended and the pending line taken out; the first
  ticks read back (`select key, computed_at, took_ms, fails, error from admin_cache order by key;`).
  **Done** 2026-11-20, 1:35 to 1:47 am Central: md5-checked (all 24 functions match a throwaway copy built with it), 15
  reads kept, no failed request; the times are in the Log ([#456](https://github.com/smcmurry6-source/study-hubs/pull/456)'s write-back).
- [x] The lessons audit's queries (`tools/economy.sql`, `tools/lessons-daily.sql`, `tools/retro.sql`) stay short, or the
  runbook says to run them when the class is quiet; the connector's queries have no time limit.
  **Done, both** ([run-sql-on-the-live-database](../how-to/run-sql-on-the-live-database.md), [#434](https://github.com/smcmurry6-source/study-hubs/pull/434)). Timed on a throwaway copy at
  1.5 times the class's size: E3 (the wallets) took 4.7 s, because PostgreSQL inlined its CTE and worked each wallet out
  again for every column that reads it (most likely the audit's 11 and 13 s queries live); `as materialized` makes it 0.5 s,
  the same numbers. The retrospective's click list counted people once a row (0.3 s, 4.5 s without its `limit`), now in one
  pass (0.03 s, the same list); E7 works the rank board out once. Every other query in the three files: under 0.1 s. The
  connector runs as `postgres` with a 2-minute limit (not none), so every call starts with
  `set local statement_timeout = '5s';` (checked live: it stops the call and doesn't carry over to the next), one query a
  call (a call returns only its last result), one call at a time: the files' headers (and `tools/analytics-quality.sql`'s),
  `tools/lessons-refresh.md` step 1 and the `lessons-audit` skill say so. One that stops at the limit is split or waits for
  the quiet hours (1 to 5 am Central).
- [x] The next lessons audit sends every query under that 5 s limit: its PR says whether any stopped there (live, not on a
  copy), and one that did is made shorter. **Done** (the 2026-11-18 evening audit, 7:30 pm, 80 people in Perio on its final's
  eve): about 30 queries, one at a time, each under `set local statement_timeout = '5s'`. **One stopped at the limit:
  `select sh_data_quality();`** (under 1 s on the copy), and the audit didn't send `qh_report` (about 3 s on the copy) for the
  same reason; every query in `tools/lessons-daily.sql` and `tools/economy.sql` returned, E3 (the wallets) and E7 included.
  Making them shorter is the first box's work (`get_data_quality` and `get_question_health` are the same functions); until then
  `tools/lessons-refresh.md` step 1 says to read both early in the day or in the quiet hours, never on a busy evening.
- [x] `vault/how-to/` says to apply a migration with a backfill late at night (or in small batches), not while the class
  studies. **Done:** [run-sql-on-the-live-database](../how-to/run-sql-on-the-live-database.md): the quiet hours (1 to 5 am
  Central, from `presence_hourly`, clear of the 3:23 am retention job), functions any time, a backfill kept out of the
  migration's transaction and run at night or a few thousand rows a call, `create index concurrently` alone in a call,
  `lock_timeout` before an `alter table` on a table the pages write, and data fixes kept small (they run at the merge,
  whatever the hour). Linked from the repo map, after-a-merge, shared-infrastructure, analytics-governance and
  read-usage-data.
- [x] Sam's call: a larger compute size for the Supabase project (more memory and CPU, at a monthly cost). Not needed if
  the boxes above are done; worth it for exam weeks. Asked 2026-11-18 during the outage (Pro, $25 a month with Micro, or
  about $30 with Small): **"Stay free, keep fixing"** ([decisions](../decisions.md)). Open again if it happens after v72.
- [x] **The answer retries don't pile onto a struggling database.** In the 19:40-20:25 outage (Log) the failed saves were sent
  again up to four times each (#421), which doubled `record_answer_v2`'s calls while 9 in 10 failed and kept PostgREST's
  connection pool full. For example: one page sends one answer at a time while saves fail (a queue, the oldest first),
  and backs off further when every recent try failed. Sam's call against a larger compute size (above).
  The page's telemetry (clicks, events, question health) could pause for a few minutes after a failed call too.
  **Done** (`widget/v3.js`, "a quiet spell"): a call the server fails starts a quiet spell on that page (30 s, doubling
  to 5 minutes while failures go on, jittered; a saved answer ends it). Answers wait in one line and go one at a time,
  a failed one again at the spell's end (up to 8 tries, about 20 minutes, the same request id); clicks, events and
  question health keep their batches, mode opens, presence and searches are skipped, cards skip the class's numbers.
  Mocks and games keep their two quick tries. `tools/ci/quiet.js` (CI, the desktop smoke half) fails the first save on
  a fake database and checks it all.
- [x] A failed answer that's still unsent when the page closes is kept on the device and sent at the next load (today the
  retries stop when the tab closes). **Done** (`widget/v3.js`, "answers kept on the device"): when the page is hidden (a
  tab or app switched away from, the screen locked, the tab closed), the answers still in its line are written to the device
  (`sh_answers_kept:<hub>`); shown again, it takes back the ones still there. The hub's next page (or another open one, when
  it opens or shows) takes them all and sends them first in its own line, with the same request ids, so one that did reach
  the server pays nothing new; a page that finds its answers taken drops them. An answer out of its 8 tries is kept the same
  way. At most 3 days old and 24 tries in all; the server stamps each when it arrives. A backlog now goes out spaced as it
  was answered, up to 2.1 s apart (a miss within 2 s of the answer before paid nothing and broke no run, the speed limit).
  Mocks' and games' answers aren't kept (their session finishes on the page: the inbox). `tools/ci/quiet.js` checks it.
  Since 2026-11-19 they are: one out of its three quick tries joins the line with its session, and the finish waits
  behind it (`sessionHold`), kept with it on the device.
- [x] **The answer save's own cost** (`migration_v72.sql`): every answer worked out the whole crown balance (`sh_wallet`,
  summing the person's awards with `sh_is_prize` called once an award) and the hub's medal count (`sh_medal_check`, every
  answer the person ever gave in the hub), on every answer. On a throwaway copy with a made-up student of 8,000 answers:
  20.5 ms an answer, 19 ms of it those two; after v72, 5.1 ms (a wrong answer) to 6.8 ms (a right one that can reach a
  medal), the same balances and medals. Applied live on 2026-11-18 at about 21:00 UTC, once the restart had finished
  (Sam: "Apply it now"); the three live bodies' md5 match the file.
- [x] **The ping table rewritten after the first 3-day cleanup** (no data deleted by the rewrite): `activity_pings` was 166 MB of
  the 414 MB database, 117 MB of it three bloated indexes. Since `migration_v74.sql` the nightly job keeps 3 days of raw pings
  (below), and deleted rows' space is only reused, so once its first run (3:23 am Central, 2026-11-19, about 27 days of pings)
  is done, `vacuum full public.activity_pings` (or `cluster ... using activity_pings_time_idx`) at night gives it back and
  rebuilds the indexes, in place of the index rebuild planned first (Sam asked "could we do it now"; in the afternoon it would
  have taken the CPU from the class). **Done** 2026-11-19, 3:46-3:48 am Central (Log): **the database 465 MB → 318 MB**, the
  ping table 179 MB → 31 MB, all 86,372 rows kept, every index valid, no request failed.
- [x] **Sam's call: the Free plan's 500 MB limit.** The project is on the **Free plan** (not a paid Micro: `get_organization`,
  2026-11-18), whose database goes **read-only at 500 MB** of database size, and every save then fails. 414 MB on
  2026-11-18; a busy exam day adds about 15 MB of pings alone. Sam: "i dont want to upgrade the plan. stay free", and to
  "do we need to even save pings for 14 days? ... could we do 1 day?": **"do 3 days"** (`migration_v74.sql`, applied live:
  raw pings kept 3 days, the retention job nightly; every reader of study time uses `activity_hourly`). 318 MB once
  the table is rewritten (the box above).
- [x] **The outage's study time restored** (Sam: "we can do fixes for 1 and 2"): `tools/data-fixes/2026-11-18-outage-time.sql`
  fills the window's 40 s to 10 minute gaps between saved pings, 2,691 pings (18.7 hours) for 52 people, under the ~2,900
  lost. The After merge workflow ran it at 22:33 UTC after [#430](https://github.com/smcmurry6-source/study-hubs/pull/430)
  merged: the window (19:35-21:06 UTC) now holds 4,922 pings for 53 people and no 40 s to 10 minute gap is left; the
  hourly totals and time crowns followed through the insert trigger.
- [x] **The outage's answers caught up** (Sam's fix 2): `migration_v73.sql` (applied live 2026-11-18, md5-checked):
  `restore_outage_v2` pays what a device's kept day says didn't save (XP, crowns as answers pay, the 20th answer, the day's
  first answer, the ring, the streak), once a person and hub, only for someone studying in that hub during the outage, 3
  answers a minute at most, until 11-21; `widget/hub-rewards.js` asks once on the next visit ("Saved from Wednesday's
  outage"). The answers themselves aren't re-added (no choice kept): medals and the class's numbers don't count them.
- [ ] **A second free Supabase project for the analytics, when it's needed** (Sam, 2026-11-18: "i think adding the second
  database may be necessary at some point"): pings, clicks, feature events and question health (about a third of the
  requests, over half the storage) move to their own free project; answers, XP and the shop stay. Not now.
- [x] **The lessons audit reads the database's size every run** (found 2026-11-19, when Sam saw the dashboard still at about
  400 MB after the rewrite: Log). Add one catalog query to `tools/lessons-refresh.md` step 1
  (`select pg_size_pretty(sum(pg_database_size(datname))) from pg_database`, plus the five biggest tables) and a line in
  `LESSONS.md`'s Live signals, so nobody has to go by the dashboard's once-a-day figure. Outside the 3-day pings, the
  tables grew about 38 MB in the 14 busiest hours of the term (the evening before the Perio final), so with several live
  hubs a busy week can add 150 MB or more: from about 420 MB, the analytics move (the box above) or a trim is due.
  Done 2026-11-19 by the lessons audit: the query is in `tools/lessons-refresh.md` step 1 and the skill; that afternoon it read
  323 MB (`personal_answers` 79 MB, `activity_pings` 36, `question_events` 35, `xp_seen` 31, `ui_click_reach` 24).
- [ ] [The optimization pass](2026-11-18-database-optimization-pass.md): the answer save is still 55% of the database's time.
- [x] `personal_answers`' two indexes (`migration_v71.sql`: the person's answers newest first, and one question's answers)
  built on the live database with `create index concurrently`, then the file appended to `supabase/schema.sql` and its line
  taken out of `supabase/pending-migrations.txt`. Each answer's speed limit, double-tap check and per-question counts read
  every answer the person ever gave without them (the day's most frequent timeout, BUG-182's trace).

## Log

- 2026-11-18: written, with the admin page's one-lane loading, the answer retries and the A/B versions page
  ([#421](https://github.com/smcmurry6-source/study-hubs/pull/421)).
- 2026-11-18: #421 merged. `migration_v71.sql` (the two `personal_answers` indexes another session found while tracing
  BUG-182) written and tested (`tools/release/xp.js`), listed as pending until it's built live.
- 2026-11-18: Sam: "Now, then merge". Both indexes built live with `create index concurrently` (valid, 15 and 20 MB);
  the speed limit's read is now an index-only scan of one row. v71 appended to `supabase/schema.sql`
  ([#423](https://github.com/smcmurry6-source/study-hubs/pull/423)).
- 2026-11-18, readout after #421 and v71 (edge logs, `record_answer_v2`, times UTC): 19:10-19:20, 0 of 264 saves failed;
  19:23-19:30, 2 of 274. **One burst still came, 19:20-19:22: 28 of 115 failed** (HTTP 500, statement timeouts spread
  over cheap statements: a count of `question_keys`, `sh_rank`, an insert into `answer_xp`, the sign of the CPU taken by
  something else). Not found in the logs: the REST calls in those minutes were the usual mix (no surge of page loads or
  admin reads), the post-release check blocks every call to the database, and the checkpoints were routine (about 1,000
  buffers over 100 s). It began a minute after #422 merged (19:19); queries sent through the connector or the Management
  API don't show in the edge logs, so the next look is `pg_stat_statements` for roles other than `authenticator`, or the
  Supabase dashboard's CPU graph for those minutes. The answer retries (#421) cover a burst that short. BUG-181 stays
  "fixed, awaiting retest" until a busy day passes without one.
- 2026-11-18, **the evening outage, 19:40-20:25 UTC** (edge and Postgres logs; found while reading #427's After merge,
  whose Perio changelog line failed with "fetch failed" and a 522): from 19:40 about 9 in 10 `record_answer_v2` calls
  failed (1,896 of 2,108 between 19:40 and 20:10, against 1,023 calls in the half hour before), as 504s (gateway
  timeouts), 522s (the database's server unreachable), 500s (statement timeouts) and a few 503s, with PostgREST's
  "Timed out acquiring connection from connection pool" (PGRST003) every minute; the class's reads (`question_stats`,
  `question_choices`, the activity ping) failed about 1 in 3. The other paths' counts stayed level, so no new caller
  (#424's screen-off study time included) added load: the doubling of answer calls was the retries. Heavy queries in the
  slow log: three `pg_stat_statements` reports at 19:40 (10-14 s; the Supabase dashboard's query performance page or a
  session following the line above) and two Management API queries at 20:00 (11 and 17 s). #427's own diagnostic
  queries ran at 19:41-19:43 (one stopped by its 8 s limit); none is in the slow log and none was running at 20:27. It
  settled by itself from 20:25, with the class's traffic far below the evening's (about 40 requests a minute against
  300-500). Nothing was changed on the database. The live check at 20:27: nothing heavy running, only the realtime
  replication. BUG-181's retest failed.

- 2026-11-18, afternoon (Sam: "i am getting a bunch of errors for the database and things are getting really slow. we need
  to optimize everything"): saves failed in bursts from 19:35 UTC, then without letup from 20:10 (40-70% of every
  request, about 35 minutes), until the connector itself couldn't connect. Live timings with everything in memory (no
  disk reads): 442 ms to plan a one-row query, 41 ms to scan a 167-row table, 2.1 s to sum one person's 1,773 awards, so
  the server's shared CPU was starved, not a slow query or a lock. **The project is on the Free plan** (the notes had
  assumed a paid Micro). On the throwaway copy the answer save's cost was two parts added or kept by `migration_v68`
  (`sh_wallet` for the balance in every reply, 13 ms; `sh_medal_check`, 5.7 ms), so `migration_v72.sql` makes both cheap.
  Sam restarted the database from the dashboard at about 20:50 UTC ("Restart project"): it was unreachable from about 20:45
  to 20:57 (Cloudflare's 520-525), then at 20:56 the pages' held retries came at once (3,300 requests in a minute against
  the usual 300-500); failures fell to a few a minute by 21:00 and stopped at 21:03, just after v72 went in.
  The restart doesn't give back CPU: it clears a jam (queued requests, retries) and let v72 in. Retries from the pages
  (four over three minutes, #421) kept a jam going once it started (the retries box above).
  Two corrections to the evening entry above, from the edge logs read later (they arrive about 5 minutes late): it did
  not settle at 20:25, it went on at 40-70% of every request until the restart (20:25-20:50: about 3,500 of 7,000 failed),
  and the Management API queries around 20:00-20:10 were this session's diagnosis (`pg_stat_statements` reports and a few
  `explain analyze` runs of `sh_wallet`, the slowest 6.4 s on the starved CPU). Diagnose on a throwaway copy
  (`tools/release/pg.js`) and read the edge logs, which cost the database nothing, while the class is failing.

- 2026-11-18, after #429 merged: what the outage lost, from the edge logs and the pings that saved (totals; 53 people were
  studying then, in Perio and Heme & Endo Exam 3): about 1,300 answer saves of about 2,500 tried (each device still has them),
  their XP and crowns (about 100-150 XP a person on average), about 2,900 pings (about 20 hours, with the crowns time pays),
  about 25 lecture reads' rewards, a few flashcard ratings and trophies, and half the window's analytics (not repaired).
  Since the restart the answer save is 55% of the database's time (360 ms mean on the shared CPU, 12% of requests), the
  pings 8%, question health 7%. Sam: "we can do fixes for 1 and 2. do 3 days. dont cut anything for now" (the boxes above).
- 2026-11-18, 22:31 UTC: [#430](https://github.com/smcmurry6-source/study-hubs/pull/430) merged (the catch-up's page side,
  the study-time repair, the 3-day retention's docs). Its After merge run passed: the repair ran once, the Perio and Heme &
  Endo Exam 3 changelog lines went out, the live copy matched `main`. CI's performance suite failed once on PCD Implants
  Exam 1's LCP (3772 ms against 2500; an old hub that loads none of the changed files, 1652 ms locally) and passed on its
  one re-run.

- 2026-11-18, evening (the second and third boxes, [#434](https://github.com/smcmurry6-source/study-hubs/pull/434)): read live only the catalog's table sizes,
  `presence_hourly` and two probes of the connector's time limit (a `pg_sleep`, which uses no CPU); everything else on a
  throwaway copy. For the first box, the admin page's reads that the audit also calls, on that copy: `qh_report('perio')`
  3.3-3.5 s (the slowest call of an audit), `sh_data_quality()`, `sh_insights` and `sh_insight_retries` about 0.7 s each.
- 2026-11-19 ([#435](https://github.com/smcmurry6-source/study-hubs/pull/435)): the box "A failed answer that's still unsent" done (`widget/v3.js`, answers kept on the device; a backlog
  spaced as it was answered), with the rank pill while the bootstrap times out (`widget/ranks.js` asks the game layer's
  profile when `shGame.live()`, the inbox line). `tools/ci/quiet.js` gained a run: a page whose saves fail is hidden, shown,
  hidden again, and a second page on a working database sends its two answers with the same ids, 2.5 s apart; the first
  page, shown again, sends nothing more. Nobody was past 50,000 XP (165 on the ladder), so the wrong rank had shown no one
  yet; the missing double-XP chip had.
- 2026-11-19, 3:23-3:48 am Central (the night task scheduled from #430's session; the class quiet, 10-13 requests a minute,
  no 5xx). The first nightly 3-day run (`sh-retention-nightly`) succeeded in 11 s and deleted 253,666 pings older than 3 days.
  **The database had reached 465 MB** (419 MB the afternoon before: the busy evening before the Perio final, with deleted
  pings' space not given back), 35 MB from the Free plan's read-only limit, and a full rewrite of the ping table needs room
  for its new copy first, so it went in two steps: `reindex index concurrently` on the three bloated indexes, one call each
  (writes went on; `activity_pings_time_idx` 45 → 8 MB, `_visitor_idx` 41 → 6 MB, `_hub_idx` 27 → 3 MB; the database
  465 → 370 MB), then `cluster public.activity_pings using activity_pings_time_idx` under `lock_timeout 5s` (heap 53 → 12 MB,
  the primary key 9 → 2 MB) and `analyze`. After: **318 MB**, the ping table 31 MB (86,372 rows, newest a few seconds old),
  every index valid, no failed request or database error in those minutes. The biggest tables now: `personal_answers` 76 MB,
  `xp_seen` 52 MB, `question_events` 34 MB, `ui_click_reach` 23 MB, `xp_awards` 22 MB, `answer_xp` 21 MB (for the
  [optimization pass](2026-11-18-database-optimization-pass.md); `xp_seen` is worth a look).
- 2026-11-19, 4:10 am Central ([#444](https://github.com/smcmurry6-source/study-hubs/pull/444)): the rewrite read back from the catalog before
  the optimization pass's phase 1 went in: the ping table 31 MB (the table 12 MB, its five indexes 19 MB), the database
  318 MB. `migration_v76.sql` and `migration_v77.sql` applied the same hour: [its note](2026-11-18-database-optimization-pass.md).
- 2026-11-19, 5 am Central (Claude Code, read-only through the connector): Sam: "supabase is still saying its at like 400 mb
  and the memory commitment is at severe". The database read **318 MB** (332 MB with the two template databases, the sum
  the 500 MB limit counts). Supabase refreshes the dashboard's size once a day, so it still showed the figure from before
  the 3:46 am rewrite. about 20 connections, all idle but the connector's and Realtime's replication (5 PostgREST, 2 Realtime, 1 Storage, the pooler, the
  exporter); Realtime's replication slot holds 63 kB of WAL and publishes none of our tables (the site's presence channels
  don't touch the database). Settings: `shared_buffers` 224 MB, `work_mem` 2 MB, `effective_cache_size` 384 MB, PostgreSQL
  17.6. The Free plan is Nano (up to 0.5 GB, a shared CPU: Supabase's compute docs), not the 1 GB these notes said, so Postgres's cache alone is
  close to half the server. The Memory commitment chart compares memory promised to every process (Postgres and Supabase's
  own API, Storage, Auth, pooler, metrics and logging) with the most the kernel will promise; it's a warning, not memory
  used. The Postgres logs of the last 24 hours have no out-of-memory kill, crash or unplanned restart (only Sam's restart
  at about 3 pm Central the day before). They have 2,754 statement timeouts, 2,669 of them between 10 am and 4 pm Central
  on 11-18 (the outage) and at most 20 an hour since. Growth over the 14 hours since that restart, from the insert and
  delete counts (Postgres reset its table statistics at the restart) times each table's size a row: about 38 MB outside
  the pings, the most in `personal_answers`, `answer_xp`, `question_events`, `xp_awards`, `ui_click_reach` and `xp_seen`
  (4-7 MB each). With Perio's final today and Heme & Endo Exam 3 tomorrow, about 390-400 MB by the weekend; then no live
  hub until the next one goes up. The Free plan has no setting for PostgREST's pool (Database Settings' pool size is the
  pooler's, which the site doesn't use), so the levers are fewer, shorter queries (v72, v76, v77 and the changelog read,
  all live since this morning) and, past that, the analytics move or a larger compute size (Sam: stay free).
- 2026-11-19 (the housekeeping package): the compute-size box ticked: Sam's call was made on 11-18 ("Stay free, keep
  fixing", [decisions](../decisions.md)); it opens again only if the saves fail in bursts after v72.
- 2026-11-19, noon Central (Claude Code): the optimization pass's phase 2 applied live at Sam's word, with the rewrites of
  `xp_seen` and `activity_visits`: **the database 349 → 323 MB** (it had grown 31 MB since the morning's 318 MB, Perio's final
  day). No request failed ([the optimization pass](2026-11-18-database-optimization-pass.md), its Log).

- 2026-11-19 (Claude Code, [#456](https://github.com/smcmurry6-source/study-hubs/pull/456)): the first box. Everything measured on a throwaway copy
  (live only: catalog reads, `pg_stats`, settings, the cron table). `migration_v83.sql` written and tested
  (`tools/release/admin-ops.js`: 116 checks, the cache's among them; `rls.js`, `retention.js`, `xp.js`, `timmy.js` pass with
  it pending); the admin page reads its time from `get_admin_cache_status`. Applied live at night (the box below).
- 2026-11-19, evening (Claude Code): #456 brought up to date. `main` had taken `migration_v79.sql` to `v82` at noon (the
  database pass's phase 2, applied live), so #456's migration, written as v79, is now `migration_v83.sql`, with its pending
  line and every mention; it replaces none of the functions v79 to v82 wrote. Run again on `main` with v83 pending:
  `admin-ops.js` (116 checks), `rls.js` and `xp.js` (629 checks) pass. Still to do: the box above, applying it live at night.
- 2026-11-20, 1:30 to 1:50 am Central (Claude Code, the night apply): `main` fetched (#456 had merged as v83; v84 pending, its
  own session's apply set for 2:30 am, after this one). The edge logs quiet (about 15 requests a minute; four failed requests at
  1:23 am, after a forced checkpoint, none from 1:25 on). Before: the 12 functions v83 replaces matched `main`'s copy, except that
  `sh_data_quality` was the same body without its comments and **`sh_insights` already had v83's body** (the same md5; no
  migration history row, so applied by hand earlier). Applied one statement a call, in file order except that `sh_insights`
  (already there) was skipped and the helpers' revokes went in before the tick (a new function is open to visitors until its
  revoke; the edge logs show no call to any of them). After: all 24 functions match a throwaway copy of `main` with v83
  (body md5, volatility, security definer); `sh-admin-cache` runs every minute (10 s), the retention and shop jobs unchanged;
  through the API a visitor gets "unauthorized" (28000) from the admin functions and "permission denied" from the helpers,
  the tick and the table. **Live times** to work each read out (`took_ms`), the class quiet: insights 4,135 ms (by the first
  tick; the connector's 5 s limit stopped it the first time), Perio's question health 3,583, clicks 30 days 3,165 (7 days
  2,062, 90 days 1,613), data quality 2,754, retries 1,848, Heme & Endo Exam 3's question health 1,790, features 30 days 995
  (7 days 228, 90 days 250), check-ins 385, visitors 100 to 116. That is 2 to 20 times the copy (the copy had no
  `ui_click_reach` rows, 100,000 live, and a faster CPU). 15 rows kept (the reads above, each day range the page offers),
  then set as read 3 hours ago, so they're refreshed nightly and not every 15 minutes overnight. The ticks after: 0.01 s with
  nothing due. Found, for later (inbox): a read the table doesn't have yet that takes over 3 s still times out for the page,
  and leaves no row for the job.

## Outcome
