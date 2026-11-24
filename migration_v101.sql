-- v101 (2026-11-24): the year-spanning readers read the totals. The to-do "Before the first collapse (about 2027-09-13), point
-- the year-spanning readers at the totals" (vault/tasks/inbox.md, from migration_v93). From the night a day turns a year old,
-- the nightly job (sh_retention_run, v93) collapses its per-person hours (activity_hourly) into daily totals with no ids
-- (activity_daily: day x hub x section, people and pings). The two readers that span a hub's whole life read activity_hourly
-- only, so a hub's oldest days would have dropped out of them, and a hub older than a year out of the Insights tab altogether.
-- Nothing has been collapsed yet (the oldest hours are from 2026-09-12), so nothing needs filling in.
--
--   1. insight_cards_kept (hub): a hub's per-person numbers on the Insights tab (people, answered, one day, 3+ days, under
--      5 minutes, median and p90 minutes, median answers), its people per surface and its check-ins' median minutes, as
--      sh_insights worked them out the night its first day was collapsed. Totals and medians over a hub, no ids; admin-only
--      like every analytics table. They can't be worked out again from daily totals (a person's days and minutes are what
--      the collapse gives up), and without them a hub's people would shrink day by day and the page would then leave the
--      hub out as "fewer than 5 people".
--   2. sh_insights (v96's body, supabase/schema.sql's newest copy): a hub's time (total minutes, first and last day, the
--      last 3 days' share, the minutes per surface) from the kept hours and the daily totals together, worked out from
--      pings so a day gives the same numbers before and after it is collapsed; a hub with a kept card reads its per-person
--      numbers, surface people and check-ins' median from it. Two new fields per hub: collapsed_through (the last day kept
--      only as totals) and per_person_kept_on (the night its card was kept), both null until then.
--   3. get_hub_recap (v52's body, the newest copy): the minutes by day, section and mode and the night before from both,
--      also from pings; what needs the person (the hours of the day, after midnight, the regulars, the notes and arcade
--      awards, the best run) counts the kept hours; a collapsed day's people are the most in one of its sections, and the
--      hub's people never fewer than its kept card's, both floors. A new field, collapsed_through.
--   4. sh_retention_run (v96's body, the newest copy) with one step before v93's collapse: a hub that has hours past the
--      school year and no kept card gets one (sh_insights, once, only on a night some hub needs it). A dry run counts the
--      hubs due.
--
-- What changes before the first collapse: total_mins, a hub's last 3 days' share and the recap's minutes are worked out
-- from pings, then converted, instead of person by person (or row by row) then summed; a total can move by a minute at
-- most, only where it sits on a half minute. tools/release/retention.js checks every number is the same before and after.
--
-- Applying it: a new table and three function replacements; nothing is read or rewritten. One call, 1-5 am Central.

set local lock_timeout = '3s';

-- ====================================================================== 1. the per-person numbers kept at the collapse
create table if not exists public.insight_cards_kept (
  hub text primary key,
  kept_on date not null,                       -- the Central day of the run that kept it (its first day's collapse)
  card jsonb not null,                         -- people, answerers, answered_50, one_day, three_days, under_5, median_mins,
                                               -- p90_mins, median_answers: sh_insights' per-person numbers for the hub
  surfaces jsonb not null default '{}'::jsonb, -- surface -> people who spent time there
  checkins jsonb not null default '{}'::jsonb, -- exam -> the check-ins' median minutes on the hub
  kept_at timestamptz not null default now()
);
alter table public.insight_cards_kept enable row level security;
revoke all on public.insight_cards_kept from anon, authenticated;

-- ====================================================================== 2. the Insights tab
create or replace function public.sh_insights(p_exams jsonb default '{}'::jsonb)
returns jsonb language sql stable set search_path = public as $$
with
ex as (
  select e.key as hub, (e.value #>> '{}')::date as exam
  from jsonb_each(case when jsonb_typeof(p_exams) = 'object' then p_exams else '{}'::jsonb end) e
  where jsonb_typeof(e.value) = 'string' and (e.value #>> '{}') ~ '^\d{4}-\d{2}-\d{2}$'),
-- map each distinct section once (sh_surface per row costs ~30 us x every hourly row); materialized (v83), or PostgreSQL
-- folds this into the join below and calls sh_surface once per hourly row after all (0.7 s of 1.1 on a copy).
-- v101: the daily totals' sections too
secmap as materialized (select s.section, sh_surface(s.section) as surf from
  (select section from activity_hourly union select section from activity_daily) s),
h as (
  select a.hub, a.visitor_id, (a.h at time zone 'America/Chicago')::date as d, m.surf, a.n
  from activity_hourly a join secmap m on m.section = a.section where a.hub <> '' and a.hub !~ '^zz-'),
-- v101: the days past the school year, from their daily totals (activity_daily: no ids, migration_v93)
o as (
  select a.hub, a.day as d, m.surf, a.n
  from activity_daily a join secmap m on m.section = a.section where a.hub <> '' and a.hub !~ '^zz-'),
-- v101: a hub's per-person numbers as the nightly job kept them the night its first day was collapsed (sh_retention_run)
kept as (select hub, kept_on, card, surfaces, checkins from insight_cards_kept),
v as (
  select h.hub, h.visitor_id, count(distinct h.d) as days, sum(h.n) * 25 / 60.0 as mins
  from h group by h.hub, h.visitor_id),
-- v96: with each packed hub's answers from its summary
pa as (select hub, visitor_id, sum(n) as n from (
         select hub, visitor_id, count(*) as n from personal_answers group by hub, visitor_id
         union all select hub, visitor_id, answers from answers_packed) z group by hub, visitor_id),
-- v101: a hub's days and time from the kept hours and the daily totals, from pings (a day gives the same before and after
-- it is collapsed)
t as (
  select x.hub, min(x.d) as first_day, max(x.d) as last_day, max(x.d) filter (where x.old) as collapsed_through,
    round(sum(x.n) * 25 / 60.0) as total_mins,
    round(100.0 * sum(x.n) filter (where x.d between ex.exam - 2 and ex.exam)
          / nullif(sum(x.n) filter (where x.d <= ex.exam), 0)) as last3_pct
  from (select hub, d, n, false as old from h union all select hub, d, n, true from o) x
  left join ex on ex.hub = x.hub group by x.hub),
qs as (select hub, sum(attempts) as attempts, sum(correct) as correct, count(*) as questions from question_stats group by hub),
mk as (select hub, count(*) as mocks, count(distinct visitor_id) as people, round(avg(100.0 * correct / nullif(total, 0))) as avg_pct
       from mock_scores group by hub),
pp as (
  select v.hub, jsonb_build_object(
    'people', count(*),
    'answerers', count(*) filter (where coalesce(pa.n, 0) > 0),
    'answered_50', count(*) filter (where coalesce(pa.n, 0) >= 50),
    'one_day', count(*) filter (where v.days = 1),
    'three_days', count(*) filter (where v.days >= 3),
    'under_5', count(*) filter (where v.mins < 5),
    'median_mins', round(percentile_cont(0.5) within group (order by v.mins)::numeric),
    'p90_mins', round(percentile_cont(0.9) within group (order by v.mins)::numeric),
    'median_answers', round(percentile_cont(0.5) within group (order by coalesce(pa.n, 0))::numeric)) as j
  from v left join pa on pa.hub = v.hub and pa.visitor_id = v.visitor_id group by v.hub),
-- v101: a hub with a kept card reads its per-person numbers there (every person up to the night it was kept); one with
-- neither kept hours nor a card has none
card as (
  select t.hub, k.kept_on, coalesce(k.card, pp.j, jsonb_build_object('people', null, 'answerers', null, 'answered_50', null,
    'one_day', null, 'three_days', null, 'under_5', null, 'median_mins', null, 'p90_mins', null, 'median_answers', null)) as j
  from t left join kept k on k.hub = t.hub left join pp on pp.hub = t.hub),
hubs as (
  select jsonb_agg(c.j || jsonb_build_object(
    'hub', c.hub, 'exam', ex.exam, 'first_day', t.first_day, 'last_day', t.last_day, 'total_mins', t.total_mins,
    'last3_pct', case when ex.exam <= (now() at time zone 'America/Chicago')::date then t.last3_pct end,
    'attempts', coalesce(qs.attempts, 0), 'correct', coalesce(qs.correct, 0), 'questions_seen', coalesce(qs.questions, 0),
    'mocks', coalesce(mk.mocks, 0), 'mock_people', coalesce(mk.people, 0), 'mock_avg_pct', mk.avg_pct,
    'collapsed_through', t.collapsed_through, 'per_person_kept_on', c.kept_on
  ) order by t.total_mins desc) as j
  from card c join t on t.hub = c.hub left join ex on ex.hub = c.hub
  left join qs on qs.hub = c.hub left join mk on mk.hub = c.hub),
surfaces as (
  select jsonb_agg(jsonb_build_object('hub', x.hub, 'surface', x.surf, 'mins', x.mins,
           'people', coalesce((k.surfaces ->> x.surf)::bigint, x.people)) order by x.hub, x.mins desc) as j
  from (select y.hub, y.surf, round(sum(y.n) * 25 / 60.0) as mins, count(distinct y.visitor_id) as people
        from (select hub, surf, n, visitor_id from h union all select hub, surf, n, null from o) y group by y.hub, y.surf) x
  left join kept k on k.hub = x.hub),
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
      -- v101: a hub with a kept card: the median as it was kept (a person's minutes are only partly kept after it)
      coalesce((select (k.checkins ->> db.exam)::numeric from kept k where k.hub = db.hub),
               round(percentile_cont(0.5) within group (order by coalesce(v.mins, 0))::numeric)) as their_median_mins,
      (select (c.j ->> 'median_mins')::numeric from card c where c.hub = db.hub) as hub_median_mins,
      (select (c.j ->> 'people')::bigint from card c where c.hub = db.hub) as hub_people,
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

-- ====================================================================== 3. the end-of-hub recap
create or replace function public.get_hub_recap(p_secret text, p_hub text, p_exam date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  tz text := 'America/Chicago';
  r jsonb;
begin
  if not sh_admin_ok(p_secret) then raise exception 'not allowed'; end if;

  -- v52: from activity_hourly (n pings of 25 s per visitor, hour, hub and section), so it survives the 30-day trim
  -- of raw pings; Central time is a whole number of hours from UTC, so hours and days come out exactly as before
  -- v101: and the days past the school year from their daily totals (activity_daily: day x section, people and pings, no
  -- ids; migration_v93). Their minutes count in full (by day, the sections and modes, the night before), from pings, so a
  -- day gives the same before and after it is collapsed. What needs the person (the hours of the day, after midnight, the
  -- regulars, the notes and arcade awards, the best run) counts the kept hours; a collapsed day's people are the most in one
  -- of its sections, and the hub's people never fewer than its kept card's (insight_cards_kept): both floors.
  with p as (
    select a.visitor_id, nullif(a.section, '') as section, a.h at time zone tz as t, a.n
    from activity_hourly a where a.hub = p_hub
  ),
  o as (select nullif(a.section, '') as section, a.day as d, a.n, a.people from activity_daily a where a.hub = p_hub),
  ans as (select pa.visitor_id, pa.qid, pa.correct, pa.answered_at at time zone tz as t from personal_answers pa where pa.hub = p_hub),
  people as (select visitor_id from p union select visitor_id from ans),
  days as (
    select d, sum(pg) * 25 / 60.0 as minutes, sum(a) as answers, greatest(count(distinct v), max(op)) as people from (
      select t::date as d, n as pg, 0 as a, visitor_id as v, null::int as op from p
      union all select t::date, 0, 1, visitor_id, null from ans
      union all select o.d, o.n, 0, null, o.people from o) u group by d),
  exam as (select coalesce(p_exam, (select max(d) from days where minutes >= 30)) as d),
  per_ans as (select visitor_id, count(*) as answers, count(*) filter (where correct) as correct from ans group by 1),
  per_days as (select visitor_id, count(distinct t::date) as days from (select visitor_id, t from p union all select visitor_id, t from ans) z group by 1),
  -- names only for the 3 shown (anon_name is slow: ~15 ms a person)
  per_person as (
    select v.visitor_id, coalesce(pa.answers, 0) as answers, coalesce(pa.correct, 0) as correct, coalesce(pd.days, 0) as days
    from people v left join per_ans pa on pa.visitor_id = v.visitor_id left join per_days pd on pd.visitor_id = v.visitor_id
  ),
  runs as (
    select visitor_id, count(*) as len from (
      select visitor_id, correct,
        row_number() over (partition by visitor_id order by t) - row_number() over (partition by visitor_id, correct order by t) as grp
      from ans) s where correct group by visitor_id, grp
  ),
  best_run as (
    select r.len, coalesce(vn.display_name, anon_name(r.visitor_id)) as name
    from (select * from runs order by len desc limit 1) r left join visitor_names vn on vn.visitor_id = r.visitor_id
  ),
  secs as (select split_part(coalesce(section, ''), '/', 1) as mode, section, sum(n) * 25 / 60.0 as minutes
           from (select section, n from p union all select section, n from o) z group by 1, 2),
  nm as (select visitor_id, display_name from visitor_names),
  notes_top as (
    select p.visitor_id, sum(p.n) * 25 / 60.0 as minutes from p
    where p.section ~ '(^|/)(notes|lecture-notes|lectures|reading)$' group by 1 order by 2 desc limit 1),
  arcade_top as (
    select p.visitor_id, sum(p.n) * 25 / 60.0 as minutes from p
    where p.section like 'arcade%' group by 1 order by 2 desc limit 1),
  mock_top as (
    select m.visitor_id, m.correct, m.total from mock_scores m
    where m.hub = p_hub and m.total >= 20 and (p_exam is null or (m.created_at at time zone tz)::date <= p_exam)
    order by m.correct::numeric / m.total desc, m.total desc, m.created_at limit 1)
  select jsonb_build_object(
    'hub', p_hub,
    'first_day', (select min(d) from days),
    'last_day', (select max(d) from days),
    'exam_day', (select d from exam),
    'minutes', (select round(coalesce(sum(minutes), 0)) from days),
    'people', greatest((select count(*) from people), (select max(people) from days),
                       (select (k.card ->> 'people')::bigint from insight_cards_kept k where k.hub = p_hub)),
    'collapsed_through', (select max(d) from o),
    'answers', (select coalesce(sum(attempts), 0) from question_stats where hub = p_hub),
    'correct', (select coalesce(sum(correct), 0) from question_stats where hub = p_hub),
    'questions_seen', (select count(*) from question_stats where hub = p_hub and attempts > 0),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'minutes', round(minutes), 'answers', answers, 'people', people) order by d), '[]') from days),
    'by_hour', (select jsonb_agg(coalesce(c, 0) * 25 / 60 order by h) from generate_series(0, 23) h
                left join (select extract(hour from t)::int as hr, sum(n) as c from p group by 1) x on x.hr = h),
    'after_midnight', (select count(distinct visitor_id) from p where extract(hour from t) < 4),
    'night_before', (select round(coalesce(sum(minutes), 0)) from days, exam where days.d = exam.d - 1),
    'night_before_people', (select coalesce(max(people), 0) from days, exam where days.d = exam.d - 1),
    'sections', (select coalesce(jsonb_agg(jsonb_build_object('section', section, 'minutes', round(minutes)) order by minutes desc), '[]')
                 from (select * from secs where section <> '' order by minutes desc limit 8) s),
    'modes', (select coalesce(jsonb_agg(jsonb_build_object('mode', mode, 'minutes', round(m)) order by m desc), '[]')
              from (select mode, sum(minutes) as m from secs where mode <> '' group by mode order by 2 desc limit 6) s),
    'mode_opens', (select coalesce(jsonb_agg(jsonb_build_object('mode', mode, 'opens', opens) order by opens desc), '[]') from mode_stats where hub = p_hub and opens > 0),
    'toughest', (select coalesce(jsonb_agg(jsonb_build_object('qid', qid, 'attempts', attempts, 'correct', correct) order by pct, attempts desc), '[]')
                 from (select qid, attempts, correct, correct::numeric / attempts as pct from question_stats
                       where hub = p_hub and attempts >= greatest(5, (select count(*) from people) / 6) order by pct, attempts desc limit 25) s),
    'choices', (select coalesce(jsonb_agg(jsonb_build_object('qid', qid, 'choice', choice, 'picks', picks)), '[]') from question_choices where hub = p_hub),
    'top_answers', (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'answers', answers, 'correct', correct) order by answers desc), '[]')
                    from (select coalesce(vn.display_name, anon_name(t.visitor_id)) as name, t.answers, t.correct
                          from (select * from per_person where answers > 0 order by answers desc limit 3) t
                          left join visitor_names vn on vn.visitor_id = t.visitor_id) s),
    'best_run', (select jsonb_build_object('name', name, 'len', len) from best_run),
    'regulars', (select count(*) from per_person where days >= 3),
    'median_answers', (select coalesce(percentile_cont(0.5) within group (order by answers), 0) from per_person where answers > 0),
    'arcade_plays', (select count(*) from arcade_scores where hub = p_hub),
    'nukes', (select count(*) from nuke_launches where hub = p_hub),
    'goldens', (select count(*) from egg_events where hub = p_hub and kind = 'golden'),
    'fairies', (select count(*) from egg_events where hub = p_hub and kind = 'fairy'),
    'awards', jsonb_build_object(
      'notes', (select jsonb_build_object('name', coalesce(nm.display_name, anon_name(t.visitor_id)), 'minutes', round(t.minutes)) from notes_top t left join nm on nm.visitor_id = t.visitor_id),
      'arcade', (select jsonb_build_object('name', coalesce(nm.display_name, anon_name(t.visitor_id)), 'minutes', round(t.minutes)) from arcade_top t left join nm on nm.visitor_id = t.visitor_id),
      'mock', (select jsonb_build_object('name', coalesce(nm.display_name, anon_name(t.visitor_id)), 'correct', t.correct, 'total', t.total) from mock_top t left join nm on nm.visitor_id = t.visitor_id)),
    'mocks_taken', (select count(*) from mock_scores where hub = p_hub)
  ) into r;
  return r;
end;
$$;

-- ====================================================================== 4. the nightly job keeps a hub's card before its first collapse
create or replace function public.sh_retention_run(p_apply boolean default false)
returns jsonb language plpgsql set search_path = public as $$
declare
  c jsonb := '{}'::jsonb;
  k bigint;
  hd text;
  cut_pings timestamptz := now() - interval '3 days';   -- v74: 3 days (Sam, 2026-11-18), was 30
  cut_reach date := current_date - 30;                  -- v95: 30 days (Sam, 2026-11-22), was 90
  cut_events date := current_date - 60;                 -- v95: 60 days (Sam, 2026-11-22), was 180
  -- v93: the school year. Per-person time and question-health rows are kept 365 days, counted in whole Central days, so a
  -- day is collapsed all at once on the night it turns a year old (and an hour never splits across two runs).
  cut_year timestamptz := (((now() at time zone 'America/Chicago')::date - 365)::timestamp at time zone 'America/Chicago');
  -- v96: a hub's answers are packed once its page has been down 30 days, those more than 30 days old, 20,000 a night
  cut_pack timestamptz := now() - interval '30 days';
  due_day date := (now() at time zone 'America/Chicago')::date - 30;
  left_n bigint := 20000;
  pr jsonb;
  np bigint := 0;
begin
  -- raw pings older than 3 days, and test or blank-hub pings; their hours stay in activity_hourly / activity_visits
  if p_apply then
    perform set_config('sh.keep_rollups', 'on', true);
    delete from activity_pings where pinged_at < cut_pings or hub = '' or hub ~ '^zz-';
    get diagnostics k = row_count;
    perform set_config('sh.keep_rollups', 'off', true);
  else
    select count(*) into k from activity_pings where pinged_at < cut_pings or hub = '' or hub ~ '^zz-';
  end if;
  c := c || jsonb_build_object('activity_pings', k);

  -- v95: who tapped what, older than 30 days: day x page x target with people counts, then the per-person rows go
  -- (ui_clicks keeps the counts, with no ids)
  if p_apply then
    insert into ui_click_reach_daily (day, hub, target, people)
      select day, hub, target, count(*) from ui_click_reach          -- one row per visitor (the primary key)
      where day < cut_reach and hub <> '' and hub !~ '^zz-' group by 1, 2, 3
      on conflict (day, hub, target) do update set people = ui_click_reach_daily.people + excluded.people;
    delete from ui_click_reach where day < cut_reach or hub = '' or hub ~ '^zz-'; get diagnostics k = row_count;
  else select count(*) into k from ui_click_reach where day < cut_reach or hub = '' or hub ~ '^zz-'; end if;
  c := c || jsonb_build_object('ui_click_reach', k);

  -- feature events older than 60 days (v95; 180 before): day x page x kind with people counts, then the per-person rows go
  if p_apply then
    insert into feature_daily (day, hub, kind, people, n)
      select day, hub, kind, count(distinct visitor_id), sum(n) from feature_events
      where day < cut_events and hub <> '' and hub !~ '^zz-' group by 1, 2, 3
      on conflict (day, hub, kind) do update set people = feature_daily.people + excluded.people, n = feature_daily.n + excluded.n;
    delete from feature_events where day < cut_events or hub = '' or hub ~ '^zz-'; get diagnostics k = row_count;
  else select count(*) into k from feature_events where day < cut_events or hub = '' or hub ~ '^zz-'; end if;
  c := c || jsonb_build_object('feature_events', k);

  -- the other rollups and counters: test hubs and blank hubs only
  if p_apply then
    delete from activity_hourly where hub = '' or hub ~ '^zz-'; get diagnostics k = row_count; c := c || jsonb_build_object('activity_hourly_test', k);
    delete from ui_clicks where hub = '' or hub ~ '^zz-'; get diagnostics k = row_count; c := c || jsonb_build_object('ui_clicks_test', k);
  else
    c := c || jsonb_build_object('activity_hourly_test', (select count(*) from activity_hourly where hub = '' or hub ~ '^zz-'),
                                 'ui_clicks_test', (select count(*) from ui_clicks where hub = '' or hub ~ '^zz-'));
  end if;

  -- v101: a hub's per-person numbers on the Insights tab, kept the night its first day is collapsed (below), since a
  -- person's days and minutes can't be worked out again from the daily totals: sh_insights once, only on a night some hub
  -- with hours past the school year has no card yet (insight_cards_kept; sh_insights reads it from then on)
  select count(distinct a.hub) into k from activity_hourly a
  where a.h < cut_year and a.hub <> '' and a.hub !~ '^zz-' and not exists (select 1 from insight_cards_kept i where i.hub = a.hub);
  if p_apply and k > 0 then
    with s as materialized (select sh_insights('{}'::jsonb) as j),
    due as (select distinct a.hub from activity_hourly a
            where a.h < cut_year and a.hub <> '' and a.hub !~ '^zz-' and not exists (select 1 from insight_cards_kept i where i.hub = a.hub))
    insert into insight_cards_kept (hub, kept_on, card, surfaces, checkins)
      select x->>'hub', (now() at time zone 'America/Chicago')::date,
        (select jsonb_object_agg(e.key, e.value) from jsonb_each(x) e
         where e.key in ('people', 'answerers', 'answered_50', 'one_day', 'three_days', 'under_5', 'median_mins', 'p90_mins', 'median_answers')),
        coalesce((select jsonb_object_agg(y->>'surface', y->'people') from s s2, jsonb_array_elements(s2.j->'surfaces') y
                  where y->>'hub' = x->>'hub'), '{}'::jsonb),
        coalesce((select jsonb_object_agg(y->>'exam', y->'their_median_mins') from s s2, jsonb_array_elements(s2.j->'checkins') y
                  where y->>'hub' = x->>'hub'), '{}'::jsonb)
      from s, jsonb_array_elements(s.j->'hubs') x where x->>'hub' in (select hub from due)
      on conflict (hub) do nothing;
    get diagnostics k = row_count;
  end if;
  c := c || jsonb_build_object('insight_cards_kept', k);

  -- v93: hub time older than the school year. First what its hours paid in time crowns (sh_time_crowns: 100 crowns per
  -- hour of hub time, at most 144 pings a clock hour), kept per visitor as capped pings in activity_time_kept, so no
  -- balance moves; then hub x section x day totals with people counts and no ids (activity_daily); then the per-person
  -- hours go. Test and blank hubs pay nothing (the same filter as sh_time_crowns) and the test step above deletes them.
  if p_apply then
    insert into activity_time_kept (visitor_id, n)
      select t.visitor_id, sum(least(t.n, 144)) from
        (select visitor_id, h, sum(n) as n from activity_hourly
         where h < cut_year and hub <> '' and hub <> 'zz-test' group by 1, 2) t
      group by 1
      on conflict (visitor_id) do update set n = activity_time_kept.n + excluded.n, updated_at = now();
    insert into activity_daily (day, hub, section, people, n)
      select (h at time zone 'America/Chicago')::date, hub, section, count(distinct visitor_id), sum(n) from activity_hourly
      where h < cut_year and hub <> '' and hub !~ '^zz-' group by 1, 2, 3
      on conflict (day, hub, section) do update set people = activity_daily.people + excluded.people, n = activity_daily.n + excluded.n;
    delete from activity_hourly where h < cut_year; get diagnostics k = row_count;
  else select count(*) into k from activity_hourly where h < cut_year; end if;
  c := c || jsonb_build_object('activity_hourly_year', k);

  -- v93: visits that ended before the school year: visits and people per Central day (of the visit's start), no ids
  if p_apply then
    insert into activity_visits_daily (day, visits, people)
      select (first_at at time zone 'America/Chicago')::date, count(*), count(distinct visitor_id) from activity_visits
      where last_at < cut_year group by 1
      on conflict (day) do update set visits = activity_visits_daily.visits + excluded.visits,
        people = activity_visits_daily.people + excluded.people;
    delete from activity_visits where last_at < cut_year; get diagnostics k = row_count;
  else select count(*) into k from activity_visits where last_at < cut_year; end if;
  c := c || jsonb_build_object('activity_visits_year', k);

  -- v93: question health older than the school year (Sam, 2026-11-21: "Collapse after the year"): day x hub x question x
  -- version totals (answers, right, first tries and retries, unanswered reads, the picks, median times, people), no ids.
  -- Question health itself reads 120 days; question_stats and question_choices keep the all-time class totals already.
  -- Since v95 this only reaches a live hub's rows: a hub whose page is down is rolled up by the step after it.
  if p_apply then
    insert into question_events_daily (day, hub, qid, v, people, answers, correct, firsts, firsts_correct, retries,
                                       retries_correct, views, med_ms, med_expl_ms, choices)
      select d.day, d.hub, d.qid, d.v, d.people, d.answers, d.correct, d.firsts, d.firsts_correct, d.retries, d.retries_correct,
             d.views, d.med_ms, d.med_expl_ms,
             coalesce((select jsonb_object_agg(x.choice, x.n) from
                        (select e.choice::text as choice, count(*) as n from question_events e
                         where e.at < cut_year and e.kind = 'answer' and e.choice is not null
                           and (e.at at time zone 'America/Chicago')::date = d.day and e.hub = d.hub and e.qid = d.qid and e.v = d.v
                         group by 1) x), '{}'::jsonb)
      from (select (at at time zone 'America/Chicago')::date as day, hub, qid, v,
                   count(distinct visitor_id) as people,
                   count(*) filter (where kind = 'answer') as answers,
                   count(*) filter (where kind = 'answer' and correct) as correct,
                   count(*) filter (where kind = 'answer' and try = 1) as firsts,
                   count(*) filter (where kind = 'answer' and try = 1 and correct) as firsts_correct,
                   count(*) filter (where kind = 'answer' and try > 1) as retries,
                   count(*) filter (where kind = 'answer' and try > 1 and correct) as retries_correct,
                   count(*) filter (where kind = 'view') as views,
                   (percentile_cont(0.5) within group (order by ms) filter (where kind = 'answer'))::int as med_ms,
                   (percentile_cont(0.5) within group (order by expl_ms) filter (where kind = 'answer'))::int as med_expl_ms
            from question_events where at < cut_year and hub <> '' and hub !~ '^zz-' group by 1, 2, 3, 4) d
      on conflict (day, hub, qid, v) do update set
        people = question_events_daily.people + excluded.people, answers = question_events_daily.answers + excluded.answers,
        correct = question_events_daily.correct + excluded.correct, firsts = question_events_daily.firsts + excluded.firsts,
        firsts_correct = question_events_daily.firsts_correct + excluded.firsts_correct,
        retries = question_events_daily.retries + excluded.retries,
        retries_correct = question_events_daily.retries_correct + excluded.retries_correct,
        views = question_events_daily.views + excluded.views,
        med_ms = coalesce(question_events_daily.med_ms, excluded.med_ms),
        med_expl_ms = coalesce(question_events_daily.med_expl_ms, excluded.med_expl_ms),
        choices = (select coalesce(jsonb_object_agg(z.k, z.n), '{}'::jsonb) from
                    (select u.k, sum(u.n)::int as n from
                      (select key as k, value::int as n from jsonb_each_text(question_events_daily.choices)
                       union all select key, value::int from jsonb_each_text(excluded.choices)) u group by u.k) z);
    delete from question_events where at < cut_year; get diagnostics k = row_count;
  else select count(*) into k from question_events where at < cut_year; end if;
  c := c || jsonb_build_object('question_events_year', k);

  -- v95: question health of a hub whose page came down (Sam, 2026-11-22): rolled up the same way, then deleted, a hub at
  -- a time (hubs_down, written by the After merge workflow). Every night, for rows a page sent after it came down too.
  k := 0;
  for hd in select d.hub from hubs_down d where exists (select 1 from question_events e where e.hub = d.hub) order by d.day, d.hub loop
    if p_apply then k := k + sh_retention_hub_down(hd);
    else k := k + (select count(*) from question_events where hub = hd); end if;
  end loop;
  c := c || jsonb_build_object('question_events_down', k);

  -- v96: the answers of a hub whose page came down 30 or more days ago (Sam, 2026-11-22: "30 days after a hub's page comes
  -- down, each person's answers for it are packed into one summary row per hub"), a person at a time, at most about
  -- 20,000 answers a night (whole people), oldest hub first; nobody's XP, crowns, rank, trophies, medals or boards move.
  -- A dry run counts every answer due, past tonight's 20,000 too.
  k := 0;
  for hd in select d.hub from hubs_down d where d.day <= due_day
      and exists (select 1 from personal_answers a where a.hub = d.hub) order by d.day, d.hub loop
    if p_apply then
      exit when left_n <= 0;
      pr := sh_pack_answers(hd, cut_pack, left_n::int, true);
      k := k + (pr->>'answers')::bigint; np := np + (pr->>'people')::bigint; left_n := left_n - (pr->>'answers')::bigint;
    else
      select k + coalesce(sum(r.n), 0), np + count(*) into k, np from sh_pack_due(hd, cut_pack) r;
    end if;
  end loop;
  c := c || jsonb_build_object('answers_packed', k, 'answers_packed_people', np);

  -- reports and suggestions: the sender's id goes 120 days after the reply (the reply has reached their Inbox by then)
  if p_apply then
    update question_flags set visitor_id = null where visitor_id is not null and resolved and resolved_at < now() - interval '120 days';
    get diagnostics k = row_count; c := c || jsonb_build_object('question_flags_ids', k);
    update hub_suggestions set visitor_id = null where visitor_id is not null and resolved and resolved_at < now() - interval '120 days';
    get diagnostics k = row_count; c := c || jsonb_build_object('hub_suggestions_ids', k);
  else
    c := c || jsonb_build_object(
      'question_flags_ids', (select count(*) from question_flags where visitor_id is not null and resolved and resolved_at < now() - interval '120 days'),
      'hub_suggestions_ids', (select count(*) from hub_suggestions where visitor_id is not null and resolved and resolved_at < now() - interval '120 days'));
  end if;

  -- exam check-ins: compared with the person's own use only in that hub's retrospective; the id goes after a year
  if p_apply then
    update exam_debriefs set visitor_id = 'anon-' || id where visitor_id !~ '^anon-' and created_at < now() - interval '1 year';
    get diagnostics k = row_count;
  else select count(*) into k from exam_debriefs where visitor_id !~ '^anon-' and created_at < now() - interval '1 year'; end if;
  c := c || jsonb_build_object('exam_debriefs_ids', k);

  -- surveys: "No thanks" rows only stop a live survey asking twice; answers lose their id 90 days after it closed
  -- (closed = not active, or past ends_at; when it closed = ends_at, else its last response)
  if p_apply then
    delete from survey_responses r using surveys s where s.id = r.survey_id and r.answers is null
      and (not s.active or s.ends_at < now());
    get diagnostics k = row_count; c := c || jsonb_build_object('survey_declines', k);
    update survey_responses r set visitor_id = 'anon-' || r.id from surveys s
      where s.id = r.survey_id and r.answers is not null and r.visitor_id !~ '^anon-' and (not s.active or s.ends_at < now())
        and coalesce(s.ends_at, (select max(x.created_at) from survey_responses x where x.survey_id = s.id)) < now() - interval '90 days';
    get diagnostics k = row_count; c := c || jsonb_build_object('survey_answer_ids', k);
  else
    c := c || jsonb_build_object(
      'survey_declines', (select count(*) from survey_responses r join surveys s on s.id = r.survey_id
                          where r.answers is null and (not s.active or s.ends_at < now())),
      'survey_answer_ids', (select count(*) from survey_responses r join surveys s on s.id = r.survey_id
                            where r.answers is not null and r.visitor_id !~ '^anon-' and (not s.active or s.ends_at < now())
                              and coalesce(s.ends_at, (select max(x.created_at) from survey_responses x where x.survey_id = s.id)) < now() - interval '90 days'));
  end if;

  -- the idea board: an idea hidden (by three reports, or by Sam) and not restored for 90 days goes, with its votes,
  -- reports and Inbox notes (they go with their idea: on delete cascade). Sam, 2026-11-11.
  if p_apply then delete from ideas where hidden and hidden_at < now() - interval '90 days'; get diagnostics k = row_count;
  else select count(*) into k from ideas where hidden and hidden_at < now() - interval '90 days'; end if;
  c := c || jsonb_build_object('ideas_hidden', k);

  -- device-link attempts: only the last hour is read (the rate limit)
  if p_apply then delete from link_attempts where tried_at < now() - interval '7 days'; get diagnostics k = row_count;
  else select count(*) into k from link_attempts where tried_at < now() - interval '7 days'; end if;
  c := c || jsonb_build_object('link_attempts', k);

  if p_apply then
    analyze activity_pings;
    insert into retention_runs (database_mb, counts) values (round(pg_database_size(current_database()) / 1048576.0, 1), c);
  end if;
  return jsonb_build_object('applied', p_apply, 'counts', c,
    'cutoffs', jsonb_build_object('activity_pings', cut_pings, 'ui_click_reach', cut_reach, 'feature_events', cut_events,
                                  'school_year', cut_year, 'answers_packed', cut_pack));
end;
$$;
revoke all on function public.sh_retention_run(boolean) from public, anon, authenticated;
