---
type: task
status: open
hub: all
created: 2026-11-18
requested-by: Sam
due:
waiting-on: Sam, for the compute size
agent:
pr:
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
- [ ] A failed answer that's still unsent when the page closes is kept on the device and sent at the next load (today the
  retries stop when the tab closes).

## Log

- 2026-11-18: written, with the admin page's one-lane loading, the answer retries and the A/B versions page.

## Outcome
