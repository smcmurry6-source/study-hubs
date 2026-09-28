-- migration_v21 (2026-09-28): awards on the hub recap, and saved mock exam scores.
-- mock_scores: one row per submitted mock exam (hubs fire sh:mock-done; widget/ranks.js calls record_mock_score).
-- get_hub_recap gains 'awards': most time in lecture notes, most time in the arcade (both from activity_pings,
-- same 3-hour-per-visit cap before 2026-09-25) and the best mock score (20+ questions, up to the exam day).

create table if not exists public.mock_scores (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  hub text not null,
  correct integer not null,
  total integer not null,
  created_at timestamptz not null default now()
);
create index if not exists mock_scores_hub_idx on public.mock_scores (hub, created_at);
alter table public.mock_scores enable row level security;

create or replace function public.record_mock_score(p_visitor text, p_hub text, p_correct integer, p_total integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or p_hub is null or length(p_hub) > 40 then return; end if;
  if p_total is null or p_total < 1 or p_total > 300 or p_correct is null or p_correct < 0 or p_correct > p_total then return; end if;
  -- one score per person per hub per minute (a double-fired submit shouldn't count twice)
  if exists (select 1 from mock_scores where visitor_id = p_visitor and hub = p_hub and created_at > now() - interval '1 minute') then return; end if;
  insert into mock_scores (visitor_id, hub, correct, total) values (p_visitor, p_hub, p_correct, p_total);
end;
$$;

create or replace function public.get_hub_recap(p_secret text, p_hub text, p_exam date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  tz text := 'America/Chicago';
  r jsonb;
begin
  if not sh_admin_ok(p_secret) then raise exception 'not allowed'; end if;

  with pings as (
    select a.visitor_id, a.section, a.pinged_at at time zone tz as t,
           row_number() over (partition by a.visit_id order by a.pinged_at) as n
    from activity_pings a where a.hub = p_hub
  ),
  p as (select * from pings where n <= 432 or t >= timestamp '2026-09-25'),
  ans as (select pa.visitor_id, pa.qid, pa.correct, pa.answered_at at time zone tz as t from personal_answers pa where pa.hub = p_hub),
  people as (select visitor_id from p union select visitor_id from ans),
  days as (
    select d, sum(m) as minutes, sum(a) as answers, count(distinct v) as people from (
      select t::date as d, 25 / 60.0 as m, 0 as a, visitor_id as v from p
      union all select t::date, 0, 1, visitor_id from ans) u group by d),
  exam as (select coalesce(p_exam, (select max(d) from days where minutes >= 30)) as d),
  per_person as (
    select v.visitor_id, coalesce(vn.display_name, anon_name(v.visitor_id)) as name,
      (select count(*) from ans where ans.visitor_id = v.visitor_id) as answers,
      (select count(*) filter (where correct) from ans where ans.visitor_id = v.visitor_id) as correct,
      (select count(distinct t::date) from (select t from p where p.visitor_id = v.visitor_id union all select t from ans where ans.visitor_id = v.visitor_id) z) as days
    from people v left join visitor_names vn on vn.visitor_id = v.visitor_id
  ),
  runs as (
    select visitor_id, count(*) as len from (
      select visitor_id, correct,
        row_number() over (partition by visitor_id order by t) - row_number() over (partition by visitor_id, correct order by t) as grp
      from ans) s where correct group by visitor_id, grp
  ),
  best_run as (
    select r.len, coalesce(vn.display_name, anon_name(r.visitor_id)) as name
    from runs r left join visitor_names vn on vn.visitor_id = r.visitor_id order by r.len desc limit 1
  ),
  secs as (select split_part(coalesce(section, ''), '/', 1) as mode, section, count(*) * 25 / 60.0 as minutes from p group by 1, 2),
  nm as (select visitor_id, display_name from visitor_names),
  notes_top as (
    select p.visitor_id, count(*) * 25 / 60.0 as minutes from p
    where p.section ~ '(^|/)(notes|lecture-notes|lectures|reading)$' group by 1 order by 2 desc limit 1),
  arcade_top as (
    select p.visitor_id, count(*) * 25 / 60.0 as minutes from p
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
    'people', (select count(*) from people),
    'answers', (select coalesce(sum(attempts), 0) from question_stats where hub = p_hub),
    'correct', (select coalesce(sum(correct), 0) from question_stats where hub = p_hub),
    'questions_seen', (select count(*) from question_stats where hub = p_hub and attempts > 0),
    'by_day', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'minutes', round(minutes), 'answers', answers, 'people', people) order by d), '[]') from days),
    'by_hour', (select jsonb_agg(coalesce(c, 0) * 25 / 60 order by h) from generate_series(0, 23) h
                left join (select extract(hour from t)::int as hr, count(*) as c from p group by 1) x on x.hr = h),
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
                    from (select * from per_person where answers > 0 order by answers desc limit 3) s),
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
