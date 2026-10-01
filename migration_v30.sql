-- migration_v30: get_hub_recap fast enough for the API's 3 s anon timeout.
-- per_person counted each visitor's answers and study days with correlated subqueries over the pings/answers CTEs,
-- re-scanning them once per person; perio (31k pings, 15k answers, ~100 people) timed out, so review/ -> Recap and
-- tools/publish-recap.js couldn't make its midterm recap. Same output, aggregated once per table, and anon_name()
-- (~15 ms each) only for the 3 people the recap names instead of everyone.
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
  -- one pass per table (correlated per-visitor subqueries re-scanned p and ans for every person and hit the API's 3 s timeout)
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
