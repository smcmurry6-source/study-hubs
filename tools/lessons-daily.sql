-- Daily lessons refresh: what changed across ALL hubs since the last refresh (Supabase connector, execute_sql, read-only).
-- Replace every :since with the "Last refreshed" date from LESSONS.md in quotes, e.g. '2026-09-29'.
-- Read with tools/lessons-refresh.md. For a full per-hub retrospective use tools/retro.sql instead.
-- Time: each activity ping = 25 s of active time. Dates are Central time.

-- 1. Student voice first: every report, suggestion, check-in and survey answer since the last refresh (all of them)
select 'flag' kind, hub, note text, resolved, created_at from question_flags where created_at >= :since::date
union all select 'suggestion', hub, note, resolved, created_at from hub_suggestions where created_at >= :since::date
order by created_at;
-- unresolved reports of any age (a report stays open until it is fixed or answered)
select 'flag' kind, id, hub, note, created_at from question_flags where not coalesce(resolved, false)
union all select 'suggestion', id, hub, note, created_at from hub_suggestions where not coalesce(resolved, false)
order by created_at;
select hub, exam, answers, created_at from exam_debriefs where created_at >= :since::date order by created_at;
select s.slug, r.answers, r.created_at from survey_responses r join surveys s on s.id = r.survey_id
where r.created_at >= :since::date and r.answers is not null order by r.created_at;

-- 2. Searches with no results since the last refresh (missing content, synonyms, abbreviations)
select hub, term, sum(searches) searches from search_terms
where day >= :since::date and hits = 0 group by 1, 2 order by 3 desc limit 60;

-- 3. Use per hub since the last refresh: people, minutes, top sections
select hub, count(distinct visitor_id) people, count(*) * 25 / 60 mins from activity_pings
where pinged_at >= :since::date group by 1 order by 3 desc;
select hub, coalesce(section, '(none)') section, count(*) * 25 / 60 mins, count(distinct visitor_id) people
from activity_pings where pinged_at >= :since::date group by 1, 2 order by 1, 3 desc;
-- features found by fewer than 3 people in the last 7 days
select hub, target, count(distinct visitor_id) people from ui_click_reach
where day >= current_date - 7 group by 1, 2 having count(distinct visitor_id) < 3 order by 1, 2 limit 80;

-- 4. Questions (cumulative stats, so compare to the numbers written in LESSONS.md last time)
-- hardest with 20+ attempts: rule out a wrong key, bug or ambiguous stem before calling them hard
select hub, qid, attempts, correct, round(100.0 * correct / attempts) pct from question_stats
where attempts >= 20 and correct::float / attempts < 0.35 order by hub, correct::float / attempts;
-- too easy / giving itself away: 90%+ with 30+ attempts
select hub, qid, attempts, round(100.0 * correct / attempts) pct from question_stats
where attempts >= 30 and correct::float / attempts >= 0.9 order by hub, pct desc limit 60;
-- one wrong choice drawing 40%+ of attempts: the class's real misconception (drop the key's index using the bank)
select c.hub, c.qid, c.choice, c.picks, s.attempts, round(100.0 * c.picks / s.attempts) pct
from question_choices c join question_stats s using (hub, qid)
where s.attempts >= 20 and c.picks::float / s.attempts >= 0.4 order by c.hub, pct desc limit 80;

-- 5. Mock exams and drill since the last refresh
select hub, count(*) mocks, count(distinct visitor_id) people, round(avg(100.0 * correct / total)) avg_pct
from mock_scores where created_at >= :since::date group by 1;
select hub, count(*) * 25 / 60 drill_mins, count(distinct visitor_id) people from activity_pings
where pinged_at >= :since::date and section like 'drill/%' group by 1;
