-- Hub retrospective: run these when a hub is archived (Supabase connector, execute_sql, read-only).
-- Replace every :hub with the hub id in quotes, e.g. 'msk-exam3', and :exam with its exam date, e.g. '2026-10-02'.
-- Then write what you learned into LESSONS.md (see the steps at the top of that file).
-- Time: activity_hourly holds n pings of 25 s of active time per hour, hub, section and person (raw activity_pings are
--    kept 3 days only, migration_v74). Pings before 2026-09-25 had no idle rule
--    (vault/reference/analytics-data-quality.md). An empty section is stored as ''.
-- Days past the school year: the nightly job collapses each day the night it turns a year old (365 Central days,
--    migration_v93; the first about 2027-09-13) into activity_daily (day x hub x section: people and pings, no ids). The
--    queries below that read time add those days' minutes in full (2, 3 and the time per section per day); a person's own
--    days and minutes (1, 6) count only the hours still kept, and a collapsed day's people are the most in one of its
--    sections (a floor). Section 0 keeps the hub's per-person numbers from the night its first day was collapsed
--    (insight_cards_kept, migration_v101), and its collapsed_through says through which day.
-- Running them (vault/how-to/run-sql-on-the-live-database.md): each query is its own execute_sql call, starting with
--    `set local statement_timeout = '5s';` (the connector itself allows 2 minutes, and a call returns only its last
--    result), one call at a time, never several at once. On a throwaway copy at 1.5 times the class's size (2026-11-18)
--    each takes under 0.1 s (section 0's sh_insights about 0.7 s). One that stops at the limit waits for the quiet hours
--    (1 to 5 am Central), never re-sent at once.
-- 0. The hub's line next to every other hub (reach, bounce, return, cramming, first try, retries; migration_v49):
--    select x from jsonb_array_elements(sh_insights(jsonb_build_object(:hub, :exam))->'hubs') x where x->>'hub' = :hub;
--    Only totals over 5+ people go into LESSONS.md (vault/rules/learner-data-privacy.md).

-- 1. Reach and depth: people, study days per person, median minutes, how many bounced (< 5 min). The kept hours only: on
--    a hub with days past the school year, read section 0's line instead.
with v as (
  select visitor_id, count(distinct (h at time zone 'America/Chicago')::date) days, sum(n) * 25 / 60 mins
  from activity_hourly where hub = :hub group by 1)
select count(*) people, sum((days = 1)::int) one_day, sum((days >= 3)::int) three_plus_days,
  percentile_cont(0.5) within group (order by mins) median_mins, sum((mins < 5)::int) under_5_min from v;

-- 2. Study curve: minutes and people per day, with days before the exam (a day past the school year from its totals)
select d, :exam::date - d days_before, sum(n)::bigint * 25 / 60 mins, greatest(count(distinct visitor_id), max(people)) people from (
  select (h at time zone 'America/Chicago')::date d, n, visitor_id, null::int people from activity_hourly where hub = :hub
  union all select day, n, null, people from activity_daily where hub = :hub) t
group by 1 order by 1;

-- 3. Time by section (what was actually used) and clicks per feature. `people` counts the kept hours; on a hub with days
--    past the school year, `older_most_in_a_day` is the most people on one of those days (a floor for how many used it then).
select coalesce(nullif(section, ''), '(none)') section, sum(n)::bigint * 25 / 60 mins, count(distinct visitor_id) people,
  coalesce(max(people_day), 0) older_most_in_a_day from (
  select section, n, visitor_id, null::int people_day from activity_hourly where hub = :hub
  union all select section, n, null, people from activity_daily where hub = :hub) t
group by 1 order by 2 desc limit 40;
-- clicks per button/tab/link and distinct people (tracked from 2026-09-25; perio and msk-exam3 are the first hubs with
-- full click data). Lots of time + few clicks = being read; nobody clicks it = candidate to cut or move.
-- (The people are counted in one pass over the hub's reach, not once a row: 0.3 s to 0.03 s on a throwaway copy, the same list.)
-- Who tapped what is kept per person 30 days (migration_v95); older days are in ui_click_reach_daily, people per day with
-- no ids. So `people` is distinct over the last 30 days, and `older_most_in_a_day` is the most people on one older day (a
-- floor for how many found it then); a hub studied for more than 30 days reads both.
with r as (select target, count(distinct visitor_id) people from ui_click_reach where hub = :hub group by 1),
     o as (select target, max(people) most from ui_click_reach_daily where hub = :hub group by 1)
select c.section, c.target, sum(c.clicks) clicks, coalesce(max(r.people), 0) people, coalesce(max(o.most), 0) older_most_in_a_day
from ui_clicks c left join r using (target) left join o using (target) where c.hub = :hub
group by c.section, c.target order by 3 desc, 1, 2 limit 60;
-- features almost nobody found: widget tools and mode tabs with fewer than 3 people (both windows)
with t as (select target, count(distinct visitor_id) people from ui_click_reach where hub = :hub group by 1
           union all select target, max(people) from ui_click_reach_daily where hub = :hub group by 1)
select target, max(people) people from t group by 1 having max(people) < 3 order by 1;
-- time per section per study day before the exam (what people switch to as the exam nears)
select :exam::date - d days_before, split_part(coalesce(nullif(section, ''), '(none)'), '/', 1) mode, sum(n)::bigint * 25 / 60 mins from (
  select (h at time zone 'America/Chicago')::date d, section, n from activity_hourly where hub = :hub
  union all select day, section, n from activity_daily where hub = :hub) t
group by 1, 2 order by 1 desc, 3 desc;

-- 3b. Engagement: answers per person, and whether people came back after their first day
with a as (select visitor_id, count(*) n, count(distinct (answered_at at time zone 'America/Chicago')::date) days
  from personal_answers where hub = :hub group by 1)
select count(*) answerers, percentile_cont(0.5) within group (order by n) median_answers, max(n) most,
  sum((days >= 2)::int) came_back from a;
select mode, opens from mode_stats where hub = :hub order by opens desc;

-- 3c. Lecture notes: which lectures were opened, reading level (Plain English vs As taught), Listen, mind maps.
--     Targets look like lec=<id> / goto-lecture=<id>, level=plain|full, #sh-tts-btn, #sh-mmap-toggle.
select target, sum(clicks) clicks from ui_clicks where hub = :hub
  and (target ~ '^(lec|goto-lecture|level|practice)=' or target in ('#sh-tts-btn', '#sh-mmap-toggle'))
group by 1 order by 2 desc;

-- 4. Questions: hardest (20+ attempts), never-answered count is bank size minus rows here.
--    Join qids to the bank (tools/dump-banks.js output, or SH_EXPORT) locally for lecture/type/source splits.
select qid, attempts, correct, round(100.0 * correct / attempts) pct from question_stats
where hub = :hub and attempts >= 20 order by correct::float / attempts limit 25;
select json_object_agg(qid, array[attempts, correct]) from question_stats where hub = :hub;  -- for local joins
-- most-picked choices relative to attempts; drop the correct index using the bank (choice = index as stored)
select c.qid, c.choice, c.picks, s.attempts from question_choices c join question_stats s using (hub, qid)
where c.hub = :hub order by c.picks::float / greatest(s.attempts, 1) desc limit 25;

-- 5. Features: mock exams, drill, arcade, reports
select count(*) mocks, count(distinct visitor_id) people, round(avg(100.0 * correct / total)) avg_pct from mock_scores where hub = :hub;
select game, count(*) plays, count(distinct visitor_id) people from arcade_scores where hub = :hub group by 1 order by 2 desc;
select note, resolved, created_at from question_flags where hub = :hub order by created_at;
select note, resolved, created_at from hub_suggestions where hub = :hub order by created_at;

-- 6. Did it work? Exam check-ins (from migration_v23) next to each person's use of the hub (the kept hours: a check-in's id
--    is replaced a year after it, and a hub's days past the school year have no person; section 0's check-ins keep the
--    median from the night its first day was collapsed)
select d.exam, d.answers, (select sum(p.n) * 25 / 60 from activity_hourly p where p.hub = d.hub and p.visitor_id = d.visitor_id) mins,
  (select count(*) from personal_answers a where a.hub = d.hub and a.visitor_id = d.visitor_id) answers
from exam_debriefs d where d.hub = :hub order by d.exam, d.created_at;

-- 7. What people looked for (from migration_v23): 0 results = content the hub didn't have
select term, sum(searches) searches, (array_agg(hits order by day desc))[1] hits
from search_terms where hub = :hub group by 1 order by (array_agg(hits order by day desc))[1] = 0 desc, 2 desc limit 60;

-- 8. Survey answers given while this hub was live (dashboard surveys are site-wide)
select s.slug, r.answers, r.created_at from survey_responses r join surveys s on s.id = r.survey_id
where r.answers is not null order by r.created_at desc limit 60;
