-- tools/ci/quiet.js's made-up answers in the class's question health (2026-11-20, the Heme & Endo Exam 3 retrospective).
-- Run once after this PR merges (the After merge workflow does it; Sam's "merge" is the OK).
-- Why: quiet.js's mock checks answer two questions that exist in no hub, `pq-1` and `pq-2`, on a page that hides
-- navigator.webdriver, and a closing page's held question-health rows skip Playwright's routing (the same hole as BUG-192,
-- tools/data-fixes/2026-11-19-test-runs.sql). tools/ci/no-leaks.js closed it on 2026-11-19 (#476): run behind a proxy that logs
-- and refuses every request, today's quiet.js sends nothing past its routes, and with the guard taken out it sends two. But a
-- run of an older copy (another session's branch cut before #476, run locally) still writes them: 13 made-up visitors in
-- Heme & Endo Exam 3 from 2026-11-19 2:59 pm to 2026-11-20 6:37 am Central, two rows each (ctx "mock", correct, no try), and 6
-- rows in Perio from before its page came down. Nothing else: no clicks, feature events, study time, saved answers or XP.
-- How: every question_events row whose qid starts with "pq-" goes. No hub has ever shipped such an id (tools/question-ids/),
-- and question_versions, question_stats, question_choices and personal_answers have none (checked 2026-11-20).
-- Safe to run twice, and again later (the 2026-11-21 re-run in vault/tasks/inbox.md): a delete of what's still there.
begin;
select count(*) quiet_test_rows from question_events where qid like 'pq-%';
delete from question_events where qid like 'pq-%';
commit;
