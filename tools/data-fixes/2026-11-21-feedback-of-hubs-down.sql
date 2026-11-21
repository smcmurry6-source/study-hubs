-- The "Good question?" thumbs of the hubs whose pages have already come down (2026-11-21, migration_v93's PR).
-- Run once after this PR merges (the After merge workflow does it; Sam's "merge" is the OK).
-- Why: Sam, 2026-11-21, on question_feedback's retention: "Delete with the hub". From this PR on, the After merge
-- workflow's "down" step deletes a hub's rows when a push deletes hubs/<hub>/index.html (tools/after-merge/run.js); these
-- five came down before it existed: Perio and Occlusion (2026-11-19), PCD Implants Exam 1 and Heme & Endo Exam 2 (the old
-- single-file hubs, 2026-11-19), Heme & Endo Exam 3 (2026-11-20). 38 rows in all on 2026-11-21: a small batch, any hour.
-- Review of Systems (live) keeps its own. Safe to run twice: a delete of what's still there.
begin;
set local statement_timeout = '5s';
delete from question_feedback where hub in ('perio', 'occlusion', 'pcd-implants-exam1', 'heme-endo-exam2', 'heme-endo-exam3');
commit;
