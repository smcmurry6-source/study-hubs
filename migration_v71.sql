-- v71 (2026-11-18): two indexes for the reads every answer makes of the person's own answers.
-- Found by another of Sam's sessions on 2026-11-18 (tracing the Today card's missing crowns, BUG-182) and checked here:
-- personal_answers had only (visitor_id, hub), so sh_answer's speed limit (the newest earlier answer, the count in the
-- last 60 s), its double-tap check (the newest earlier answer), the per-question counts and "missed last time" read every
-- answer the person ever gave: 9,377 rows for the heaviest visitor, over 2,000 for 36 people, several times per answer.
-- The most frequent statement timeout that day (103 of about 436 in postgres_logs) was inside the speed limit's max(),
-- about 0.4 s for the heaviest visitor even on a quiet database. With these, each is a short index read.
--   personal_answers_visitor_time: (visitor_id, answered_at desc, id desc): the speed limit, the 60-second count, the
--     double tap, a hub's answers since a time (sh_ring_step) and the newest-first reads.
--   personal_answers_visitor_q: (visitor_id, hub, qid, answered_at desc, id desc): one question's answers (the day's
--     counts, right ever, the last try before today) and sh_medal_check's distinct on (qid).
-- No function changes; nothing a student sees changes, except saves get quicker.
-- The table is small (23 MB, about 185,000 rows on 2026-11-18), so each index builds in about a second.
-- On the live database they are built CONCURRENTLY, so the class's answers keep saving while they build: each of these
-- on its own, outside a transaction (the Supabase SQL editor, or the connector's execute_sql one at a time; not
-- apply_migration, which wraps a transaction). An interrupted build leaves an invalid index: drop it and run it again.
--   create index concurrently if not exists personal_answers_visitor_time on public.personal_answers (visitor_id, answered_at desc, id desc);
--   create index concurrently if not exists personal_answers_visitor_q on public.personal_answers (visitor_id, hub, qid, answered_at desc, id desc);
-- The lines below are the same indexes in the form a transaction takes (supabase/schema.sql and the tests' throwaway
-- copy). Tested there with tools/release/xp.js.

create index if not exists personal_answers_visitor_time on public.personal_answers (visitor_id, answered_at desc, id desc);
create index if not exists personal_answers_visitor_q on public.personal_answers (visitor_id, hub, qid, answered_at desc, id desc);
