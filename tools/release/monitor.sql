-- Post-release monitoring (RELEASE_TEST_PLAN.md, "After the release"): read-only, aggregate counts only.
-- Run it in the Supabase SQL editor or through the connector's read-only execute_sql 1 hour, 24 hours and 48 hours after
-- a release. It compares the hours since the release with the same hours a week earlier, per hub. Set the release time
-- (the merge time, UTC) in the first line. Nothing here names or exports a student: counts only, never visitor ids.
-- What to look for: a hub whose activity or answers dropped to zero or far below last week while others held up
-- (the page or its saving broke), a jump in reports, or a hub with activity but no answers (answers stopped saving).
with params as (select timestamptz '2026-11-04 20:00+00' as released, now() as until),
win as (select released, until, until - released as span from params),
act as (
  select hub,
    sum(n) filter (where h >= (select released from win)) as pings_since,
    sum(n) filter (where h >= (select released from win) - interval '7 days' and h < (select until from win) - interval '7 days') as pings_week_before,
    count(distinct visitor_id) filter (where h >= (select released from win)) as people_since
  from activity_hourly where h >= (select released from win) - interval '7 days' group by hub),
ans as (
  select hub,
    count(*) filter (where answered_at >= (select released from win)) as answers_since,
    count(*) filter (where answered_at >= (select released from win) - interval '7 days' and answered_at < (select until from win) - interval '7 days') as answers_week_before
  from personal_answers where answered_at >= (select released from win) - interval '7 days' group by hub),
rep as (
  select hub, count(*) as reports_since from question_flags where created_at >= (select released from win) group by hub)
select coalesce(act.hub, ans.hub, rep.hub) as hub,
  coalesce(people_since, 0) as people_since, coalesce(pings_since, 0) as pings_since, coalesce(pings_week_before, 0) as pings_week_before,
  coalesce(answers_since, 0) as answers_since, coalesce(answers_week_before, 0) as answers_week_before, coalesce(reports_since, 0) as reports_since,
  case when coalesce(pings_since, 0) > 20 and coalesce(answers_since, 0) = 0 then 'CHECK: activity but no answers saved'
       when coalesce(pings_week_before, 0) > 50 and coalesce(pings_since, 0) < coalesce(pings_week_before, 0) / 4 then 'CHECK: activity far below last week'
       when coalesce(reports_since, 0) >= 3 then 'CHECK: several reports'
       else '' end as flag
from act full join ans on ans.hub = act.hub full join rep on rep.hub = coalesce(act.hub, ans.hub)
order by flag desc, people_since desc;

-- Feature events since the release (page loads, Listen, podcast, diagrams...), per hub and kind: a kind that went to
-- zero after a release that touched it is a lead.
select hub, kind, sum(n) as events, count(distinct visitor_id) as people
from feature_events where day >= (timestamptz '2026-11-04 20:00+00' at time zone 'America/Chicago')::date
group by 1, 2 order by 1, 3 desc;
