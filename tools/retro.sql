-- Hub retrospective: run these when a hub is archived (Supabase connector, execute_sql, read-only).
-- Replace every :hub with the hub id in quotes, e.g. 'msk-exam3', and :exam with its exam date, e.g. '2026-10-02'.
-- Then write what you learned into LESSONS.md (see the steps at the top of that file).
-- Time: activity_hourly holds n pings of 25 s of active time per hour, hub, section and person (raw activity_pings are
--    kept 30 days only, migration_v52). Pings before 2026-09-25 had no idle rule
--    (vault/reference/analytics-data-quality.md). An empty section is stored as ''.
-- 0. The hub's line next to every other hub (reach, bounce, return, cramming, first try, retries; migration_v49):
--    select x from jsonb_array_elements(sh_insights(jsonb_build_object(:hub, :exam))->'hubs') x where x->>'hub' = :hub;
--    Only totals over 5+ people go into LESSONS.md (vault/rules/learner-data-privacy.md).

-- 1. Reach and depth: people, study days per person, median minutes, how many bounced (< 5 min)
with v as (
  select visitor_id, count(distinct (h at time zone 'America/Chicago')::date) days, sum(n) * 25 / 60 mins
  from activity_hourly where hub = :hub group by 1)
select count(*) people, sum((days = 1)::int) one_day, sum((days >= 3)::int) three_plus_days,
  percentile_cont(0.5) within group (order by mins) median_mins, sum((mins < 5)::int) under_5_min from v;

-- 2. Study curve: minutes and people per day, with days before the exam
select (h at time zone 'America/Chicago')::date d, :exam::date - (h at time zone 'America/Chicago')::date days_before,
  sum(n) * 25 / 60 mins, count(distinct visitor_id) people
from activity_hourly where hub = :hub group by 1 order by 1;

-- 3. Time by section (what was actually used) and clicks per feature
select coalesce(nullif(section, ''), '(none)') section, sum(n) * 25 / 60 mins, count(distinct visitor_id) people
from activity_hourly where hub = :hub group by 1 order by 2 desc limit 40;
-- clicks per button/tab/link and distinct people (tracked from 2026-09-25; perio and msk-exam3 are the first hubs with
-- full click data). Lots of time + few clicks = being read; nobody clicks it = candidate to cut or move.
select c.section, c.target, sum(c.clicks) clicks, (select count(distinct r.visitor_id) from ui_click_reach r
  where r.hub = c.hub and r.target = c.target) people
from ui_clicks c where c.hub = :hub group by c.hub, c.section, c.target order by 3 desc limit 60;
-- features almost nobody found: widget tools and mode tabs with fewer than 3 people
select target, count(distinct visitor_id) people from ui_click_reach where hub = :hub group by 1 having count(distinct visitor_id) < 3 order by 1;
-- time per section per study day before the exam (what people switch to as the exam nears)
select :exam::date - (h at time zone 'America/Chicago')::date days_before, split_part(coalesce(nullif(section, ''), '(none)'), '/', 1) mode,
  sum(n) * 25 / 60 mins from activity_hourly where hub = :hub group by 1, 2 order by 1 desc, 3 desc;

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

-- 6. Did it work? Exam check-ins (from migration_v23) next to each person's use of the hub
select d.exam, d.answers, (select sum(p.n) * 25 / 60 from activity_hourly p where p.hub = d.hub and p.visitor_id = d.visitor_id) mins,
  (select count(*) from personal_answers a where a.hub = d.hub and a.visitor_id = d.visitor_id) answers
from exam_debriefs d where d.hub = :hub order by d.exam, d.created_at;

-- 7. What people looked for (from migration_v23): 0 results = content the hub didn't have
select term, sum(searches) searches, (array_agg(hits order by day desc))[1] hits
from search_terms where hub = :hub group by 1 order by (array_agg(hits order by day desc))[1] = 0 desc, 2 desc limit 60;

-- 8. Survey answers given while this hub was live (dashboard surveys are site-wide)
select s.slug, r.answers, r.created_at from survey_responses r join surveys s on s.id = r.survey_id
where r.answers is not null order by r.created_at desc limit 60;
