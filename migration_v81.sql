-- v81 (2026-11-19, to apply after Heme & Endo Exam 3): activity_visits without its index on last_at, so a ping's update
-- of its visit stays on the visit's page. The optimization pass, phase 2 (vault/tasks/2026-11-18-database-optimization-pass.md).
--
-- Every study-time ping moves its visit's last_at (sh_activity_on_insert), and a column with an index of its own can't be
-- updated in place (a "HOT" update): each ping wrote a new copy of the visit's row and a new entry in all three of the
-- table's indexes. Live, since the restart of 2026-11-18: 39,443 updates, 6.6% of them in place; the index was 4.7 MB of
-- the table's 7.6 MB for 8,800 visits. On the throwaway copy of the optimization pass, without it: every update in place,
-- 24% less write-ahead log and 17% less time for the pings.
-- Its one reader was the admin page's visitor summary (get_visitor_summary: `where v.last_at >= since`), which now reads
-- the whole table instead: on a copy with 9,000 visits, a sequential scan of 1.4 MB, the same rows and the same numbers
-- (the time in the PR). Nothing else filters or sorts on last_at.
--
-- Live, this is `drop index concurrently if exists public.activity_visits_last_idx;` sent alone in its own call (it can't
-- run in a transaction, and it doesn't stop the pings while it waits). Then, at night, the table is rewritten once to give
-- back the room the copies took: `cluster public.activity_visits using activity_visits_pkey;` under `set local
-- lock_timeout = '3s'`, then `analyze public.activity_visits;` (vault/how-to/run-sql-on-the-live-database.md).
-- The line below is the same drop in the form a transaction takes (supabase/schema.sql and the tests' throwaway copy).

drop index if exists public.activity_visits_last_idx;
