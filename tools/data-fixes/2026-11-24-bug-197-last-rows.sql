-- BUG-197's last rows: tools/ci/quiet.js's made-up mock answers still in the class's question health (2026-11-24, the
-- housekeeping package). Run once after this PR merges (the After merge workflow does it; Sam's "merge" is the OK).
-- Why: #521's fix (tools/data-fixes/2026-11-21-test-rows-again.sql) took the 22 `pq-` rows there were on 2026-11-21, and #524
-- closed the leak (tools/ci/no-leaks.js's guard proxy) at 8:07 am Central that morning. One run in between, at 7:54 am
-- Central (13:54 UTC), 12 minutes before #524 merged, still wrote its two rows.
-- Counted first, 2026-11-24, read-only, each query alone under a 5 s limit: 2 rows in question_events with a qid starting
-- "pq-", both Review of Systems, ctx mock, kind answer, 1 made-up visitor, both at 2026-11-21 13:54:58 UTC; none since, so
-- the guard holds. None in question_events_daily (Review of Systems is live, so nothing of it is rolled up yet).
-- How: the body of tools/data-fixes/2026-11-20-quiet-test-rows.sql, unchanged: every question_events row whose qid starts
-- with "pq-" goes. No hub has ever shipped such an id (tools/question-ids/). Safe to run twice: a delete of what's still there.
begin;
set local statement_timeout = '5s';
select count(*) quiet_test_rows from question_events where qid like 'pq-%';
delete from question_events where qid like 'pq-%';
commit;
