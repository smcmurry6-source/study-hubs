-- The study time the evening outage of 2026-11-18 didn't record. Sam, 2026-11-18: "we can do fixes for 1 and 2" (this is
-- 1, the time; vault/tasks/2026-11-18-database-load.md). From 19:35 to 21:03 UTC about 2,900 activity pings failed (the
-- edge logs), about 20 hours of the class's studying, and with it the crowns time pays (sh_time_crowns, 100 an hour).
-- The pings that did save show who was studying and when: a page pings every 25 s of active time, so a gap of 40 s to
-- 10 minutes between two saved pings of one visit, in that window, is filled with the pings that would have been there,
-- evenly spaced, in the hub and section of the ping before the gap. Measured before the fix: 2,691 pings (18.7 hours) for
-- 52 people, under the 2,900 that failed (a visit with no saved ping in the window gets nothing; a pause of a few minutes
-- can be filled, about 17% of such gaps on a normal evening), so the class as a whole gets back less than it lost.
-- Inserted as pings, so the insert trigger adds them to activity_hourly and activity_visits at their own hour, as any
-- ping (sh_activity_on_insert), and the time crowns follow from activity_hourly by themselves.
-- Safe to run twice: a filled gap is 20 to 32 s between pings, under the 40 s a gap needs, so a second run adds nothing.
-- About 2,700 rows: run when the class is quiet if it can wait; the trigger's two upserts a row are on past hours only.
begin;
with p as (
  select visitor_id, visit_id, hub, section, pinged_at,
         lag(pinged_at) over w as prev_at, lag(hub) over w as prev_hub, lag(section) over w as prev_section
  from activity_pings
  where pinged_at >= '2026-11-18 19:35:00+00' and pinged_at < '2026-11-18 21:06:00+00' and hub <> '' and hub !~ '^zz-'
  window w as (partition by visit_id, visitor_id order by pinged_at)
), g as (
  select visitor_id, visit_id, prev_hub as hub, prev_section as section, prev_at, pinged_at,
         round(extract(epoch from pinged_at - prev_at) / 25.0)::int as k
  from p
  where prev_at is not null and pinged_at - prev_at between interval '40 seconds' and interval '600 seconds'
), ins as (
  insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
  select g.visitor_id, g.visit_id, g.hub, g.section, g.prev_at + (g.pinged_at - g.prev_at) * i / g.k
  from g cross join lateral generate_series(1, g.k - 1) as i
  returning visitor_id
)
select count(*) as pings_restored, count(distinct visitor_id) as people from ins;
commit;
