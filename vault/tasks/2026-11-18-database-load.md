---
type: task
status: open
hub: all
created: 2026-11-18
requested-by: Sam
due:
waiting-on: Sam, for the compute size
agent:
pr: https://github.com/smcmurry6-source/study-hubs/pull/421
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
- The database: 1 GB, two shared cores, 60 connections; anon's `statement_timeout` is 3 s
  ([shared-infrastructure](../reference/shared-infrastructure.md)).
- Done in the PR that wrote this note (its link is in the Log): the admin page reads one query at a time and says "the database was
  busy" on a timeout; failed answer saves retry for about three minutes (same request id, so nothing counts twice); the A/B
  versions page has its own small query.

## Done when

- [ ] The admin page's heavy reads are fast or cached: `get_insights`, `get_insight_retries`, `get_data_quality` (1 to 2 s
  each), `get_question_health` (`qh_report`, 1 to 3 s), `get_visitor_summary` / `_by_hub` / `_by_section` and
  `get_exam_debriefs` (about 1 s). For example worked out every 15 minutes by `pg_cron` into a small table the page reads.
- [ ] The lessons audit's queries (`tools/economy.sql`, `tools/lessons-daily.sql`, `tools/retro.sql`) stay short, or the
  runbook says to run them when the class is quiet; the connector's queries have no time limit.
- [ ] `vault/how-to/` says to apply a migration with a backfill late at night (or in small batches), not while the class
  studies.
- [ ] Sam's call: a larger compute size for the Supabase project (more memory and CPU, at a monthly cost). Not needed if
  the boxes above are done; worth it for exam weeks.
- [ ] **The answer retries don't pile onto a struggling database.** In the 19:40-20:25 outage (Log) the failed saves were sent
  again up to four times each (#421), which doubled `record_answer_v2`'s calls while 9 in 10 failed and kept PostgREST's
  connection pool full. For example: one page sends one answer at a time while saves fail (a queue, the oldest first),
  and backs off further when every recent try failed. Sam's call against a larger compute size (above).
- [ ] A failed answer that's still unsent when the page closes is kept on the device and sent at the next load (today the
  retries stop when the tab closes).
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

## Outcome
