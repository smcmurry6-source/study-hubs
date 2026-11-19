-- v79 (2026-11-19): the admin page's heavy reads worked out ahead, into a small table the page reads.
-- vault/tasks/2026-11-18-database-load.md, its first box.
--
-- On 2026-11-18 the admin page's reads failed with "canceling statement due to statement timeout" (anon's 3 s limit) and,
-- run back to back while the class studied, took the shared CPU from students' answer saves. On a throwaway copy at the
-- live database's size (2026-11-19's catalog: 222,000 answers, 114,000 question events, 56,000 feature events, the
-- class's 310 visitors) with the live settings (JIT off, 2 MB work_mem): get_insights 1.05 s, get_data_quality 0.98 s,
-- get_insight_retries 0.81 s, get_question_health 0.51 s for Perio, the click summary over 90 days 0.16 s, the visitor
-- totals, check-ins and feature events 30 to 60 ms each. The live server is several times slower (1 to 3 s each).
--
--   1. Two lookups done once a section, not once a row. sh_surface() (the section-to-surface map) was meant to run once per
--      distinct section, but PostgreSQL folded the lookup into the join (sh_insights) or tested it before the distinct
--      (sh_data_quality), so it ran once per hourly row: 0.7 s of each. `as materialized` and `offset 0` keep it to the
--      sections: sh_insights 1.05 → 0.43 s, sh_data_quality 0.98 → 0.37 s, the same results (ties in one list can come
--      in another order, as they always could).
--   2. admin_cache: one row a read (insights, retries, quality, qh:<hub>, visitors:<days>, debriefs, clicks:<days>,
--      features:<days>), with what it was worked out from, when, and when the admin page last read it. Closed to anon.
--   3. The admin functions read it: get_insights, get_insight_retries, get_data_quality, get_question_health,
--      get_visitor_summary / _by_hub / _by_section, get_exam_debriefs, and get_click_summary / get_feature_events without
--      a hub. Same arguments, same results, same shape: a page from before this change works unchanged. A read the table
--      doesn't have yet is worked out at once, as before, and kept. A read with new arguments (the page's question
--      fingerprints after an edit, new exam dates) returns the copy it has and asks for a new one.
--      Question health lays the reviews (Looks fine / Needs a fix / Fixed) and the reports' state over the kept copy at
--      every read, so a review shows at once; the rest of a row is as old as the copy.
--      get_data_quality's retention part (the job's schedule and its last runs) is read fresh every time.
--   4. sh_admin_cache_tick, run by pg_cron every minute ('sh-admin-cache', with a 10 s limit), works out what is due:
--      - a read asked with new arguments, or asked for again (Refresh on the admin page): at once;
--      - a read the page has used in the last 2 hours: every 15 minutes, or every hour while 20 or more people are
--        studying (pinged in the last 5 minutes);
--      - any read used in the last 7 days: once a night, in the quiet hours (1 to 5 am Central), if older than 12 hours.
--      At most one read a minute while the class is busy, three (and 2 s) otherwise. A read that fails or stops at the
--      limit waits 10 minutes, then 20, 40... up to 6 hours. Rows nobody read in 30 days are deleted, and the job's own
--      run log is kept 2 days. Nothing runs while nobody uses the admin page, except the nightly refresh for a week.
--   5. get_admin_cache_status(secret, ask): when each read was worked out, whether a newer one is on its way; `ask` asks
--      for the named ones again (at most once in 2 minutes each).
--
-- Functions, one small new table and a pg_cron job: no backfill, nothing locked, safe at any hour. Apply it at night
-- anyway (Sam's order for this package), then fill the table, one read a call, so the page's first reads are ready.

-- ---------------------------------------------------------------- 1. sh_surface once a section
create or replace function public.sh_insights(p_exams jsonb default '{}'::jsonb)
returns jsonb language sql stable set search_path = public as $$
with
ex as (
  select e.key as hub, (e.value #>> '{}')::date as exam
  from jsonb_each(case when jsonb_typeof(p_exams) = 'object' then p_exams else '{}'::jsonb end) e
  where jsonb_typeof(e.value) = 'string' and (e.value #>> '{}') ~ '^\d{4}-\d{2}-\d{2}$'),
-- map each distinct section once (sh_surface per row costs ~30 us x every hourly row); materialized (v79), or PostgreSQL
-- folds this into the join below and calls sh_surface once per hourly row after all (0.7 s of 1.1 on a copy)
secmap as materialized (select s.section, sh_surface(s.section) as surf from (select distinct section from activity_hourly) s),
h as (
  select a.hub, a.visitor_id, (a.h at time zone 'America/Chicago')::date as d, m.surf, a.n
  from activity_hourly a join secmap m on m.section = a.section where a.hub <> '' and a.hub !~ '^zz-'),
v as (
  select h.hub, h.visitor_id, count(distinct h.d) as days, sum(h.n) * 25 / 60.0 as mins,
    sum(h.n) filter (where h.d between ex.exam - 2 and ex.exam) * 25 / 60.0 as last3,
    sum(h.n) filter (where h.d <= ex.exam) * 25 / 60.0 as upto
  from h left join ex on ex.hub = h.hub group by h.hub, h.visitor_id),
pa as (select hub, visitor_id, count(*) as n from personal_answers group by hub, visitor_id),
span as (select hub, min(d) as first_day, max(d) as last_day from h group by hub),
qs as (select hub, sum(attempts) as attempts, sum(correct) as correct, count(*) as questions from question_stats group by hub),
mk as (select hub, count(*) as mocks, count(distinct visitor_id) as people, round(avg(100.0 * correct / nullif(total, 0))) as avg_pct
       from mock_scores group by hub),
card as (
  select v.hub,
    count(*) as people,
    count(*) filter (where coalesce(pa.n, 0) > 0) as answerers,
    count(*) filter (where coalesce(pa.n, 0) >= 50) as answered_50,
    count(*) filter (where v.days = 1) as one_day,
    count(*) filter (where v.days >= 3) as three_days,
    count(*) filter (where v.mins < 5) as under_5,
    round(percentile_cont(0.5) within group (order by v.mins)::numeric) as median_mins,
    round(percentile_cont(0.9) within group (order by v.mins)::numeric) as p90_mins,
    round(sum(v.mins)) as total_mins,
    round(100 * sum(v.last3) / nullif(sum(v.upto), 0)) as last3_pct,
    round(percentile_cont(0.5) within group (order by coalesce(pa.n, 0))::numeric) as median_answers
  from v left join pa on pa.hub = v.hub and pa.visitor_id = v.visitor_id group by v.hub),
hubs as (
  select jsonb_agg(jsonb_build_object(
    'hub', c.hub, 'exam', ex.exam, 'first_day', s.first_day, 'last_day', s.last_day,
    'people', c.people, 'answerers', c.answerers, 'answered_50', c.answered_50, 'one_day', c.one_day,
    'three_days', c.three_days, 'under_5', c.under_5, 'median_mins', c.median_mins, 'p90_mins', c.p90_mins,
    'total_mins', c.total_mins, 'median_answers', c.median_answers,
    'last3_pct', case when ex.exam <= (now() at time zone 'America/Chicago')::date then c.last3_pct end,
    'attempts', coalesce(qs.attempts, 0), 'correct', coalesce(qs.correct, 0), 'questions_seen', coalesce(qs.questions, 0),
    'mocks', coalesce(mk.mocks, 0), 'mock_people', coalesce(mk.people, 0), 'mock_avg_pct', mk.avg_pct
  ) order by c.total_mins desc) as j
  from card c join span s on s.hub = c.hub left join ex on ex.hub = c.hub
  left join qs on qs.hub = c.hub left join mk on mk.hub = c.hub),
surfaces as (
  select jsonb_agg(jsonb_build_object('hub', x.hub, 'surface', x.surf, 'mins', x.mins, 'people', x.people) order by x.hub, x.mins desc) as j
  from (select hub, surf, round(sum(n) * 25 / 60.0) as mins, count(distinct visitor_id) as people from h group by hub, surf) x),
features as (
  select jsonb_agg(to_jsonb(x) order by x.hub) as j from (
    select hub, min(day) as since,
      count(distinct visitor_id) filter (where kind = 'view') as viewers,
      count(distinct visitor_id) filter (where kind like 'fig-seen:%') as fig_seen,
      count(distinct visitor_id) filter (where kind like 'fig:%' or kind like 'fig-part:%') as fig_used,
      count(distinct visitor_id) filter (where kind ~ '^pod:[^:]+:play$') as pod_play,
      count(distinct visitor_id) filter (where kind ~ '^pod:[^:]+:q2$') as pod_half,
      count(distinct visitor_id) filter (where kind ~ '^pod:[^:]+:q4$') as pod_end,
      count(distinct visitor_id) filter (where kind = 'tts:secs') as listen_people,
      coalesce(sum(n) filter (where kind = 'tts:secs'), 0) / 60 as listen_mins,
      count(distinct visitor_id) filter (where kind = 'pin:add') as pinners,
      count(distinct visitor_id) filter (where kind like 'hl:%') as highlighters,
      count(distinct visitor_id) filter (where kind = 'mmap:open') as mind_maps,
      count(distinct visitor_id) filter (where kind = 'notes-jump:shown') as find_in_notes,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:prompt$') as tour_prompted,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:start$') as tour_started,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:done$') as tour_done,
      count(distinct visitor_id) filter (where kind ~ '^tour(-hub)?:decline$') as tour_declined,
      count(distinct visitor_id) filter (where kind like 'state:%') as settings_people,
      count(distinct visitor_id) filter (where kind in ('state:pet=off', 'state:pet=dash')) as pet_off,
      count(distinct visitor_id) filter (where kind = 'state:fx=off') as fx_off,
      count(distinct visitor_id) filter (where kind = 'state:eggs=off') as eggs_off
    from feature_events where hub <> '' and hub !~ '^zz-' group by hub) x),
rep as (
  select hub, created_at, resolved, resolved_at, reply from question_flags
  union all select coalesce(hub, ''), created_at, resolved, resolved_at, reply from hub_suggestions),
voice as (
  select jsonb_agg(to_jsonb(x) order by x.reports desc) as j from (
    select hub, count(*) as reports, count(*) filter (where not resolved) as open,
      count(*) filter (where reply is not null) as replied,
      round((percentile_cont(0.5) within group (order by extract(epoch from resolved_at - created_at) / 3600)
        filter (where resolved_at is not null))::numeric, 1) as median_hours_to_resolve,
      max(created_at)::date as last_report
    from rep group by hub) x),
db as (
  select distinct on (hub, exam, visitor_id) hub, exam, visitor_id, answers
  from exam_debriefs where hub !~ '^zz-' order by hub, exam, visitor_id, created_at desc),
checkins as (
  select jsonb_agg(to_jsonb(x) order by x.exam) as j from (
    select db.hub, db.exam, count(*) as people,
      round(percentile_cont(0.5) within group (order by coalesce(v.mins, 0))::numeric) as their_median_mins,
      (select c.median_mins from card c where c.hub = db.hub) as hub_median_mins,
      (select c.people from card c where c.hub = db.hub) as hub_people,
      round(avg((db.answers->>'ready')::numeric) filter (where db.answers->>'ready' ~ '^[1-5]$'), 1) as avg_ready,
      (select jsonb_object_agg(m.k, m.n) from (
         select d2.answers->>'match' as k, count(*) as n from db d2
         where d2.hub = db.hub and d2.exam = db.exam and coalesce(d2.answers->>'match', '') <> '' group by 1) m) as match
    from db left join v on v.hub = db.hub and v.visitor_id = db.visitor_id group by db.hub, db.exam) x),
surveys as (
  select jsonb_build_object('responses', count(*), 'declined', count(*) filter (where answers is null)) as j from survey_responses)
select jsonb_build_object(
  'generated_at', now(),
  'hubs', coalesce((select j from hubs), '[]'::jsonb),
  'surfaces', coalesce((select j from surfaces), '[]'::jsonb),
  'features', coalesce((select j from features), '[]'::jsonb),
  'voice', coalesce((select j from voice), '[]'::jsonb),
  'checkins', coalesce((select j from checkins), '[]'::jsonb),
  'surveys', (select j from surveys))
$$;
revoke all on function public.sh_insights(jsonb) from public, anon, authenticated;

create or replace function public.sh_data_quality()
returns jsonb language sql stable set search_path = public as $$
select jsonb_build_object(
  'generated_at', now(),
  -- when each source last wrote: a source that stops while pings keep coming is broken tracking, not quiet students
  'last_write', jsonb_build_object(
    'activity_pings', (select max(pinged_at) from activity_pings),
    'personal_answers', (select max(answered_at) from personal_answers),
    'ui_clicks', (select max(day) from ui_clicks),
    'feature_events', (select max(day) from feature_events where hub !~ '^zz-'),
    'search_terms', (select max(day) from search_terms),
    'mock_scores', (select max(created_at) from mock_scores),
    'exam_debriefs', (select max(created_at) from exam_debriefs),
    'survey_responses', (select max(created_at) from survey_responses),
    'question_flags', (select max(created_at) from question_flags)),
  -- rows from test hubs ('zz-...') or with no hub: exclude them, or delete them (vault/tasks retention note)
  'test_rows', jsonb_build_object(
    'feature_events', (select count(*) from feature_events where hub = '' or hub ~ '^zz-'),
    'ui_clicks', (select count(*) from ui_clicks where hub = '' or hub ~ '^zz-'),
    'activity_hourly', (select count(*) from activity_hourly where hub = '' or hub ~ '^zz-'),
    'personal_answers', (select count(*) from personal_answers where hub = '' or hub ~ '^zz-')),
  -- sections sh_surface() can't place: a new mode or sub-view to add to it, or no section at all (`offset 0`, v79: without it
  -- PostgreSQL tests sh_surface on every hourly row before the distinct, 0.7 s of 1.0 on a copy)
  'unmapped_sections', coalesce((select jsonb_agg(jsonb_build_object('hub', x.hub, 'section', x.section, 'pings', x.n,
      'last_day', x.last_day) order by x.n desc) from (
    select a.hub, a.section, sum(a.n) as n, max((a.h at time zone 'America/Chicago')::date) as last_day from activity_hourly a
    join (select s.section from (select distinct section from activity_hourly offset 0) s where sh_surface(s.section) in ('other', 'unknown')) u
      on u.section = a.section
    where a.hub <> '' and a.hub !~ '^zz-' group by 1, 2) x), '[]'::jsonb),
  -- every feature-event family, when it first and last fired: new ones need a row in vault/reference/event-taxonomy.md,
  -- and one that stopped firing while its feature is still up is broken tracking
  'event_families', coalesce((select jsonb_agg(jsonb_build_object('family', x.f, 'first_day', x.first_day,
      'last_day', x.last_day, 'people', x.people, 'kinds', x.kinds) order by x.first_day desc, x.f) from (
    select split_part(split_part(kind, ':', 1), '=', 1) as f, min(day) as first_day, max(day) as last_day,
      count(distinct visitor_id) as people, count(distinct kind) as kinds
    from feature_events where hub <> '' and hub !~ '^zz-' group by 1) x), '[]'::jsonb),
  -- active time counted twice: more than 144 pings (60 min) from one visitor in one hour, e.g. two hubs visible side by side
  'overcount', (select jsonb_build_object('visitor_hours', count(*), 'excess_minutes', coalesce(round(sum(x.t - 144) * 25 / 60.0), 0))
    from (select visitor_id, h, sum(n) as t from activity_hourly group by 1, 2 having sum(n) > 144) x),
  -- writes from a device id after it was linked to another (an old tab still open); they count as an extra person
  -- (one index probe per linked id: a join would scan all of activity_pings, ~2 s)
  'alias_writes', jsonb_build_object(
    'activity_pings', (select coalesce(sum((select count(*) from activity_pings p
                         where p.visitor_id = l.alias_id and p.pinged_at > l.linked_at + interval '1 minute')), 0) from visitor_links l),
    'personal_answers', (select coalesce(sum((select count(*) from personal_answers a
                           where a.visitor_id = l.alias_id and a.answered_at > l.linked_at + interval '1 minute')), 0) from visitor_links l)),
  'identity', jsonb_build_object(
    'visitor_ids', (select count(distinct visitor_id) from activity_visits),
    'linked_aliases', (select count(*) from visitor_links)),
  -- questions answered 20+ times with no picks in question_choices: "most popular wrong answer" can't be read for them
  'choices_missing', coalesce((select jsonb_agg(jsonb_build_object('hub', x.hub, 'answered_20', x.q20, 'no_choices', x.nc)
      order by x.nc desc) from (
    select s.hub, count(*) filter (where s.attempts >= 20) as q20,
      count(*) filter (where s.attempts >= 20 and not exists (select 1 from question_choices c where c.hub = s.hub and c.qid = s.qid)) as nc
    from question_stats s where s.hub <> '' and s.hub !~ '^zz-' group by s.hub) x where x.nc > 0), '[]'::jsonb),
  -- class-wide counters vs each person's rows: they are written by two separate calls and should agree within a few
  'stats_drift', coalesce((select jsonb_agg(jsonb_build_object('hub', q.hub, 'question_stats', q.att, 'personal_answers', coalesce(p.n, 0))
      order by abs(q.att - coalesce(p.n, 0)) desc) from (select hub, sum(attempts) as att from question_stats group by hub) q
    left join (select hub, count(*) as n from personal_answers group by hub) p on p.hub = q.hub
    where abs(q.att - coalesce(p.n, 0)) > 5), '[]'::jsonb),
  'storage', jsonb_build_object(
    'database_mb', round(pg_database_size(current_database()) / 1048576.0),
    'pings_last_7_days', (select count(*) from activity_pings where pinged_at > now() - interval '7 days'),
    'answers_last_7_days', (select count(*) from personal_answers where answered_at > now() - interval '7 days'),
    'tables', (select jsonb_agg(jsonb_build_object('table', c.relname, 'mb', round(pg_total_relation_size(c.oid) / 1048576.0, 1),
        'rows', greatest(c.reltuples, 0)::bigint) order by pg_total_relation_size(c.oid) desc)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and pg_total_relation_size(c.oid) > 1048576)))
$$;
revoke all on function public.sh_data_quality() from public, anon, authenticated;

-- ---------------------------------------------------------------- 2. the table
create table if not exists public.admin_cache (
  key text primary key,                       -- insights, retries, quality, qh:<hub>, visitors:<days>, debriefs, clicks:<days>, features:<days>
  args jsonb not null default '{}'::jsonb,    -- what the page last asked with: the next copy is worked out from these
  body jsonb,                                 -- the read's result, as the admin function returns it
  body_args text,                             -- md5 of the args the body was worked out from (args changed: a new copy is due)
  computed_at timestamptz,
  took_ms integer,
  wanted_at timestamptz not null default now(),   -- the admin page last read it
  asked_at timestamptz,                       -- Refresh: worked out again at the next tick
  fails integer not null default 0,           -- failed refreshes in a row (each waits twice as long before the next)
  failed_at timestamptz,
  error text
);
alter table public.admin_cache enable row level security;
revoke all on table public.admin_cache from public, anon, authenticated;

-- ---------------------------------------------------------------- 3. the reads, as functions of their arguments
-- Each returns the rows its admin function returns, as a JSON array in the same order (the bodies moved here unchanged).
create or replace function public.sh_admin_days(p_days integer, p_default integer)
returns integer language sql immutable set search_path = public as $$ select greatest(1, least(coalesce(p_days, p_default), 365)) $$;

create or replace function public.sh_visitor_summary(p_days integer)
returns jsonb language plpgsql stable set search_path = public as $$
declare since timestamptz := now() - make_interval(days => p_days);
begin
  return (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
    select count(distinct v.visitor_id)::bigint as unique_visitors, count(*)::bigint as total_visits,
      round(avg(greatest(extract(epoch from (v.last_at - greatest(v.first_at, since))) / 60.0, 0.4))::numeric, 1) as avg_visit_minutes
    from activity_visits v where v.last_at >= since) x);
end;
$$;

create or replace function public.sh_visitor_by_hub(p_days integer)
returns jsonb language plpgsql stable set search_path = public as $$
begin
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.total_minutes desc), '[]'::jsonb) from (
    select coalesce(nullif(a.hub, ''), '(unknown)') as hub, count(distinct a.visitor_id)::bigint as unique_visitors,
      round((sum(a.n) * 25.0 / 60.0)::numeric, 1) as total_minutes
    from activity_hourly a
    where a.h >= date_trunc('hour', now() - make_interval(days => p_days))
    group by 1) x);
end;
$$;

create or replace function public.sh_visitor_by_section(p_days integer)
returns jsonb language plpgsql stable set search_path = public as $$
begin
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.hub, x.total_minutes desc), '[]'::jsonb) from (
    select coalesce(nullif(a.hub, ''), '(unknown)') as hub, coalesce(nullif(a.section, ''), '(unspecified)') as section,
      round((sum(a.n) * 25.0 / 60.0)::numeric, 1) as total_minutes
    from activity_hourly a
    where a.h >= date_trunc('hour', now() - make_interval(days => p_days))
    group by 1, 2) x);
end;
$$;

create or replace function public.sh_exam_debriefs()
returns jsonb language plpgsql stable set search_path = public as $$
begin
  return (
    with d as (select * from exam_debriefs e order by e.created_at desc, e.id desc limit 2000),
    who as (select distinct d.hub, d.visitor_id from d),
    t as (select w.hub, w.visitor_id, coalesce(sum(h.n), 0) * 25 / 60 as minutes
          from who w left join activity_hourly h on h.visitor_id = w.visitor_id and h.hub = w.hub
          group by w.hub, w.visitor_id),
    a as (select w.hub, w.visitor_id, count(pa.id) as answered,
                 round(avg(case when pa.id is null then null when pa.correct then 100 else 0 end), 0) as accuracy
          from who w left join personal_answers pa on pa.visitor_id = w.visitor_id and pa.hub = w.hub
          group by w.hub, w.visitor_id)
    select coalesce(jsonb_agg(jsonb_build_object('hub', d.hub, 'exam', d.exam, 'visitor_id', d.visitor_id, 'answers', d.answers,
        'created_at', d.created_at, 'minutes', t.minutes::bigint, 'answered', a.answered::bigint, 'accuracy', a.accuracy)
      order by d.created_at desc, d.id desc), '[]'::jsonb)
    from d
    join t on t.hub = d.hub and t.visitor_id = d.visitor_id
    join a on a.hub = d.hub and a.visitor_id = d.visitor_id);
end;
$$;

create or replace function public.sh_click_summary(p_days integer, p_hub text)
returns jsonb language plpgsql stable set search_path = public as $$
begin
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.clicks desc), '[]'::jsonb) from (
    with c as (
      select c.hub, c.section, c.target, sum(c.clicks)::bigint as clicks from ui_clicks c
      where c.day > (now() at time zone 'America/Chicago')::date - p_days
        and (p_hub is null or c.hub = p_hub)
      group by 1, 2, 3
    ), r as (
      select r.hub, r.target, count(distinct r.visitor_id)::bigint as people from ui_click_reach r
      where r.day > (now() at time zone 'America/Chicago')::date - p_days
        and (p_hub is null or r.hub = p_hub)
      group by 1, 2
    )
    select c.hub, c.section, c.target, c.clicks, coalesce(r.people, 0) as people from c left join r on r.hub = c.hub and r.target = c.target
    order by c.clicks desc limit 1000) x);
end;
$$;

create or replace function public.sh_feature_events(p_days integer, p_hub text)
returns jsonb language plpgsql stable set search_path = public as $$
begin
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.people desc, x.total desc), '[]'::jsonb) from (
    select e.hub, e.kind, count(distinct e.visitor_id)::bigint as people, sum(e.n)::bigint as total,
      count(distinct e.day)::bigint as days, max(e.day) as last_day
    from feature_events e
    where e.day > (now() at time zone 'America/Chicago')::date - p_days
      and (p_hub is null or e.hub = p_hub)
    group by e.hub, e.kind order by 3 desc, 4 desc limit 2000) x);
end;
$$;

-- one read, by its key and arguments
create or replace function public.sh_admin_compute(p_key text, p_args jsonb)
returns jsonb language plpgsql stable set search_path = public as $$
declare k text := split_part(p_key, ':', 1); a text := substr(p_key, length(k) + 2); d int;
begin
  if k in ('visitors', 'clicks', 'features') then
    if a !~ '^[0-9]{1,3}$' then raise exception 'admin_cache: bad key %', p_key; end if;
    d := sh_admin_days(a::int, 30);
  end if;
  if k = 'insights' then return sh_insights(coalesce(p_args->'exams', '{}'::jsonb));
  elsif k = 'retries' then return sh_insight_retries() || jsonb_build_object('generated_at', now());
  elsif k = 'quality' then return sh_data_quality();
  elsif k = 'qh' then
    if a !~ '^[a-z0-9-]{1,40}$' then raise exception 'admin_cache: bad key %', p_key; end if;
    return coalesce((select jsonb_agg(to_jsonb(r)) from qh_report(a, coalesce((p_args->>'days')::int, 120),
                                                                    nullif(p_args->'current', 'null'::jsonb)) r), '[]'::jsonb);
  elsif k = 'visitors' then
    return jsonb_build_object('summary', sh_visitor_summary(d), 'by_hub', sh_visitor_by_hub(d), 'by_section', sh_visitor_by_section(d));
  elsif k = 'debriefs' then return sh_exam_debriefs();
  elsif k = 'clicks' then return sh_click_summary(d, null);
  elsif k = 'features' then return sh_feature_events(d, null);
  end if;
  raise exception 'admin_cache: unknown key %', p_key;
end;
$$;

-- the read path: the kept copy, or (the first time) worked out now and kept
create or replace function public.sh_admin_cached(p_key text, p_args jsonb default '{}'::jsonb)
returns jsonb language plpgsql set search_path = public as $$
declare c record; b jsonb; a jsonb := coalesce(p_args, '{}'::jsonb); t0 timestamptz := clock_timestamp();
begin
  select x.body, x.args, x.wanted_at into c from admin_cache x where x.key = p_key;
  if found and c.body is not null then
    if c.args is distinct from a or c.wanted_at < now() - interval '1 minute' then
      update admin_cache set args = a, wanted_at = now() where key = p_key;
    end if;
    return c.body;
  end if;
  b := sh_admin_compute(p_key, a);
  insert into admin_cache (key, args, body, body_args, computed_at, took_ms, wanted_at)
  values (p_key, a, b, md5(a::text), now(), (extract(epoch from clock_timestamp() - t0) * 1000)::int, now())
  on conflict (key) do update set args = excluded.args, body = excluded.body, body_args = excluded.body_args,
    computed_at = excluded.computed_at, took_ms = excluded.took_ms, wanted_at = excluded.wanted_at,
    fails = 0, failed_at = null, error = null;
  return b;
end;
$$;

-- question health: the reviews and the reports' state laid over the kept rows, the rows they change worked out again
create or replace function public.sh_qh_overlay(p_hub text, p_rows jsonb)
returns jsonb language sql stable set search_path = public as $$
with
r as (select e.x from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) e(x)),
rep as (
  select substring(f.note from '  — question ([^ ]+)') qid, f.id, f.note, f.resolved, f.created_at, f.reply
  from question_flags f where f.hub = p_hub
),
rep_agg as (
  select rep.qid, count(*) filter (where not rep.resolved)::int reports_open,
    jsonb_agg(jsonb_build_object('id', rep.id, 'note', left(rep.note, 500), 'resolved', rep.resolved, 'at', rep.created_at,
      'reply', left(rep.reply, 300)) order by rep.created_at desc) reports
  from rep where rep.qid is not null group by rep.qid
),
cur as (
  select r.x, r.x || jsonb_build_object(
      'reports_open', coalesce(ra.reports_open, 0), 'reports', coalesce(ra.reports, '[]'::jsonb),
      'review_status', rv.status, 'review_v', rv.v, 'review_flags', to_jsonb(rv.flags), 'review_note', rv.note,
      'review_at', rv.updated_at) y
  from r left join question_reviews rv on rv.hub = p_hub and rv.qid = r.x->>'qid'
  left join rep_agg ra on ra.qid = r.x->>'qid'
),
-- inside the case, so qh_flags runs only for a changed row (as a lateral join's filter it ran for every row first)
z as (
  select case when c.y = c.x then c.x
    else (select c.y || jsonb_build_object('flags', g.f->'flags', 'score', (g.f->>'score')::int, 'state', g.f->>'state')
          from (select qh_flags(c.y - 'flags' - 'score' - 'state') f) g) end z
  from cur c
)
select coalesce(jsonb_agg(z.z order by (z.z->>'score')::int desc, (z.z->>'n1')::int desc nulls last,
                                    (z.z->>'a_n1')::int desc nulls last, z.z->>'qid'), '[]'::jsonb)
from z
$$;

-- ---------------------------------------------------------------- 4. the admin functions read the table
create or replace function public.get_insights(p_secret text, p_exams jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return sh_admin_cached('insights', jsonb_build_object('exams', coalesce(p_exams, '{}'::jsonb)));
end;
$$;
create or replace function public.get_insight_retries(p_secret text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return sh_admin_cached('retries');
end;
$$;
create or replace function public.get_data_quality(p_secret text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return sh_admin_cached('quality') || jsonb_build_object('retention', sh_retention_status());
end;
$$;
create or replace function public.get_question_health(p_secret text, p_hub text, p_days integer default 120, p_current jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' then return '[]'::jsonb; end if;
  return sh_qh_overlay(p_hub, sh_admin_cached('qh:' || p_hub,
    jsonb_build_object('days', greatest(1, least(coalesce(p_days, 120), 730)), 'current', p_current)));
end;
$$;

create or replace function public.get_visitor_summary(p_secret text, p_days integer default 30)
returns table(unique_visitors bigint, total_visits bigint, avg_visit_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select x.unique_visitors, x.total_visits, x.avg_visit_minutes
    from jsonb_to_recordset(sh_admin_cached('visitors:' || sh_admin_days(p_days, 30))->'summary')
      as x(unique_visitors bigint, total_visits bigint, avg_visit_minutes numeric);
end; $$;

create or replace function public.get_visitor_by_hub(p_secret text, p_days integer default 30)
returns table(hub text, unique_visitors bigint, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select x.hub, x.unique_visitors, x.total_minutes
    from jsonb_to_recordset(sh_admin_cached('visitors:' || sh_admin_days(p_days, 30))->'by_hub')
      as x(hub text, unique_visitors bigint, total_minutes numeric);
end; $$;

create or replace function public.get_visitor_by_section(p_secret text, p_days integer default 30)
returns table(hub text, section text, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select x.hub, x.section, x.total_minutes
    from jsonb_to_recordset(sh_admin_cached('visitors:' || sh_admin_days(p_days, 30))->'by_section')
      as x(hub text, section text, total_minutes numeric);
end; $$;

create or replace function public.get_exam_debriefs(p_secret text)
returns table(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz,
              minutes bigint, answered bigint, accuracy numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select x.hub, x.exam, x.visitor_id, x.answers, x.created_at, x.minutes, x.answered, x.accuracy
    from jsonb_to_recordset(sh_admin_cached('debriefs'))
      as x(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz, minutes bigint, answered bigint, accuracy numeric);
end;
$$;

-- with a hub (no page sends one today): worked out at once, as before
create or replace function public.get_click_summary(p_secret text, p_days integer default 14, p_hub text default null)
returns table(hub text, section text, target text, clicks bigint, people bigint)
language plpgsql security definer set search_path = public as $$
declare d int := sh_admin_days(p_days, 14);
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select x.hub, x.section, x.target, x.clicks, x.people
    from jsonb_to_recordset(case when p_hub is null then sh_admin_cached('clicks:' || d) else sh_click_summary(d, p_hub) end)
      as x(hub text, section text, target text, clicks bigint, people bigint);
end;
$$;

create or replace function public.get_feature_events(p_secret text, p_days integer default 30, p_hub text default null)
returns table(hub text, kind text, people bigint, total bigint, days bigint, last_day date)
language plpgsql security definer set search_path = public as $$
declare d int := sh_admin_days(p_days, 30);
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select x.hub, x.kind, x.people, x.total, x.days, x.last_day
    from jsonb_to_recordset(case when p_hub is null then sh_admin_cached('features:' || d) else sh_feature_events(d, p_hub) end)
      as x(hub text, kind text, people bigint, total bigint, days bigint, last_day date);
end;
$$;

-- ---------------------------------------------------------------- 5. when each was worked out; Refresh
create or replace function public.get_admin_cache_status(p_secret text, p_ask text[] default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_ask is not null then
    update admin_cache set asked_at = now(), wanted_at = now()
    where key = any(p_ask[1:20]) and computed_at < now() - interval '2 minutes'
      and (asked_at is null or asked_at <= computed_at);
  end if;
  return coalesce((select jsonb_object_agg(c.key, jsonb_build_object(
      'at', c.computed_at, 'ms', c.took_ms, 'failed_at', c.failed_at,
      'waiting', c.body_args is distinct from md5(c.args::text) or coalesce(c.asked_at > c.computed_at, false)))
    from admin_cache c), '{}'::jsonb);
end;
$$;

-- ---------------------------------------------------------------- 6. the job: what is due, one read at a time
create or replace function public.sh_admin_cache_tick()
returns integer language plpgsql set search_path = public as $$
declare
  busy boolean; night boolean; c record; b jsonb; t0 timestamptz; t_start timestamptz := clock_timestamp(); n int := 0;
  local_t time := (now() at time zone 'America/Chicago')::time;
begin
  delete from admin_cache where wanted_at < now() - interval '30 days';
  -- the class is busy: 20 or more people studying (a ping in the last 5 minutes; an index-only read of a few hundred rows)
  busy := (select count(distinct p.visitor_id) from activity_pings p where p.pinged_at > now() - interval '5 minutes') >= 20;
  night := local_t >= time '01:00' and local_t < time '05:00';
  loop
    exit when n >= case when busy then 1 else 3 end or (n > 0 and clock_timestamp() - t_start > interval '2 seconds');
    select x.key, x.args into c from admin_cache x
    where x.wanted_at > now() - interval '7 days'
      and (x.failed_at is null or x.failed_at < now() - least(interval '10 minutes' * power(2, least(x.fails - 1, 6)), interval '6 hours'))
      and (x.body is null or x.body_args is distinct from md5(x.args::text) or x.asked_at > x.computed_at
           or (x.wanted_at > now() - interval '2 hours'
               and x.computed_at < now() - case when busy then interval '1 hour' else interval '15 minutes' end)
           or (night and x.computed_at < now() - interval '12 hours'))
    order by (x.body is null or x.body_args is distinct from md5(x.args::text) or coalesce(x.asked_at > x.computed_at, false)) desc,
      x.computed_at nulls first
    limit 1;
    exit when not found;
    t0 := clock_timestamp();
    begin
      b := sh_admin_compute(c.key, c.args);
      update admin_cache set body = b, body_args = md5(c.args::text), computed_at = now(),
        took_ms = (extract(epoch from clock_timestamp() - t0) * 1000)::int, fails = 0, failed_at = null, error = null
      where key = c.key;
    exception when query_canceled or others then
      -- the 10 s limit (the database is busy) or an error: wait before trying this one again, and stop for this minute
      update admin_cache set fails = fails + 1, failed_at = now(), error = left(sqlerrm, 200),
        took_ms = (extract(epoch from clock_timestamp() - t0) * 1000)::int
      where key = c.key;
      exit;
    end;
    n := n + 1;
  end loop;
  -- the job's own run log: one row a minute, kept 2 days (pg_cron keeps every run otherwise)
  if extract(minute from now()) = 41 and to_regclass('cron.job_run_details') is not null then
    begin
      execute $q$delete from cron.job_run_details where end_time < now() - interval '2 days'
                 and jobid in (select jobid from cron.job where jobname = 'sh-admin-cache')$q$;
    exception when others then null;
    end;
  end if;
  return n;
end;
$$;

-- ---------------------------------------------------------------- grants
revoke all on function public.sh_admin_days(integer, integer) from public, anon, authenticated;
revoke all on function public.sh_visitor_summary(integer) from public, anon, authenticated;
revoke all on function public.sh_visitor_by_hub(integer) from public, anon, authenticated;
revoke all on function public.sh_visitor_by_section(integer) from public, anon, authenticated;
revoke all on function public.sh_exam_debriefs() from public, anon, authenticated;
revoke all on function public.sh_click_summary(integer, text) from public, anon, authenticated;
revoke all on function public.sh_feature_events(integer, text) from public, anon, authenticated;
revoke all on function public.sh_admin_compute(text, jsonb) from public, anon, authenticated;
revoke all on function public.sh_admin_cached(text, jsonb) from public, anon, authenticated;
revoke all on function public.sh_qh_overlay(text, jsonb) from public, anon, authenticated;
revoke all on function public.sh_admin_cache_tick() from public, anon, authenticated;
revoke all on function public.get_admin_cache_status(text, text[]) from public;
grant execute on function public.get_admin_cache_status(text, text[]) to anon, authenticated;

-- ---------------------------------------------------------------- the job (pg_cron, where the database has it)
do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.unschedule(jobid) from cron.job where jobname = 'sh-admin-cache';
      perform cron.schedule('sh-admin-cache', '* * * * *', $c$set statement_timeout = '10s'; select public.sh_admin_cache_tick()$c$);
    exception when others then
      raise notice 'pg_cron not set up (%): the admin page works each heavy read out the first time it asks, then keeps it', sqlerrm;
    end;
  end if;
end $do$;
