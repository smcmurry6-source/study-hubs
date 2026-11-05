-- v49 (2026-11-04): the read side of the analytics governance layer (vault/reference/analytics-governance.md).
-- Read-only: nothing here inserts, updates or deletes a row. It adds:
--   sh_surface(section)    the canonical surface (bank, notes, mock, review, drill, home, ...) of a '<mode>/<sub-view>'
--                          section. Hubs name the same view differently (compendium/bank vs compendium/question-bank,
--                          compendium/notes vs compendium/lecture-notes), so every cross-hub number goes through this.
--   sh_insights(p_exams)   per-hub scorecard (reach, activation, depth, return, cramming), time by surface, feature reach,
--                          student voice and check-in coverage, as one jsonb document
--   sh_insight_retries()   accuracy of re-answers by the gap since the person's previous try at the same question
--   sh_data_quality()      the data-quality checks described in vault/reference/analytics-data-quality.md
--   get_insights / get_insight_retries / get_data_quality: the same behind the admin secret, for review/ -> Insights.
-- The sh_* functions are for agents on the Supabase connector (it has no admin secret); anon and authenticated can't
-- call them. Each group is its own call so each stays inside anon's 3 s statement_timeout (2026-11-04, ~260k pings and
-- ~120k answers, warm: insights ~0.5 s, retries ~1.1 s, quality 0.7-1.3 s; 0.8-1.5 s each through the API). The first
-- call after a quiet spell can pass 3 s while the tables load into memory: the admin page tries a failed call once more.
-- p_exams: {"<hub>": "YYYY-MM-DD", ...}, each hub's most recent exam, from HUBS in index.html (the admin page reads it
-- from there). Hubs whose id starts with 'zz-' are test data and are left out everywhere, as are rows with a blank hub.
-- Time: one activity ping = 25 s of active time; days are Central time.

create or replace function public.sh_surface(p_section text)
returns text language sql immutable parallel safe set search_path = public as $$
  select case
    when p_section is null or p_section = '' then 'unknown'
    when p_section ~ '^compendium/(bank|question-bank)(/|$)' then 'bank'
    when p_section ~ '^(compendium/(notes|lecture-notes)|notes)(/|$)' then 'notes'
    when p_section ~ '^(compendium/(mock|mock-exam|mockexam)|mock|mockexam)(/|$)' then 'mock'
    when p_section ~ '^compendium/(cram|cram-sheet)(/|$)' then 'cram'
    when p_section ~ '^compendium/(hints|exam-hints)(/|$)' then 'hints'
    when p_section ~ '^compendium/weak' then 'weak-spots'
    when p_section ~ '^compendium/(recall|active-recall)(/|$)' then 'recall'
    when p_section ~ '^(home|compendium/(home|course-info|dashboard))(/|$)' then 'home'
    when p_section ~ '^review(/|$)' then 'review'
    when p_section ~ '^drill(/|$)' then 'drill'
    when p_section ~ '^(arcade|game|quest)(/|$)' then 'arcade'
    when p_section ~ '^podcast(/|$)' then 'podcast'
    when p_section ~ '^atlas(/|$)' then 'retired'
    else 'other' end
$$;
grant execute on function public.sh_surface(text) to anon, authenticated;

create or replace function public.sh_insights(p_exams jsonb default '{}'::jsonb)
returns jsonb language sql stable set search_path = public as $$
with
ex as (
  select e.key as hub, (e.value #>> '{}')::date as exam
  from jsonb_each(case when jsonb_typeof(p_exams) = 'object' then p_exams else '{}'::jsonb end) e
  where jsonb_typeof(e.value) = 'string' and (e.value #>> '{}') ~ '^\d{4}-\d{2}-\d{2}$'),
-- map each distinct section once (sh_surface per row costs ~30 us x every hourly row)
secmap as (select s.section, sh_surface(s.section) as surf from (select distinct section from activity_hourly) s),
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

create or replace function public.sh_insight_retries()
returns jsonb language sql stable set search_path = public set work_mem = '64MB' as $$
with
r as (
  select hub, correct,
    lag(correct) over w as prev_ok,
    answered_at - lag(answered_at) over w as gap,
    row_number() over w as k
  from personal_answers where hub <> '' and hub !~ '^zz-'
  window w as (partition by hub, visitor_id, qid order by answered_at)),
g as (
  select case when gap < interval '10 minutes' then 1 when gap < interval '1 day' then 2 when gap < interval '3 days' then 3 else 4 end as ord,
    prev_ok, count(*) as n, sum(correct::int) as ok
  from r where k > 1 group by 1, 2),
hb as (
  select hub,
    count(*) filter (where k = 1) as first_tries, sum(correct::int) filter (where k = 1) as first_ok,
    count(*) filter (where k > 1) as retries,
    count(*) filter (where k > 1 and prev_ok) as retries_of_right,
    count(*) filter (where k > 1 and not prev_ok and gap < interval '10 minutes') as quick_retries_of_missed,
    sum(correct::int) filter (where k > 1 and not prev_ok and gap < interval '10 minutes') as quick_retries_of_missed_ok,
    count(*) filter (where k > 1 and not prev_ok and gap >= interval '1 day') as late_retries_of_missed,
    sum(correct::int) filter (where k > 1 and not prev_ok and gap >= interval '1 day') as late_retries_of_missed_ok
  from r group by hub)
select jsonb_build_object(
  'by_gap', coalesce((select jsonb_agg(jsonb_build_object(
      'gap', (array['under 10 min', '10 min to 1 day', '1 to 3 days', '3+ days'])[g.ord],
      'after', case when g.prev_ok then 'right' else 'missed' end, 'n', g.n, 'ok', g.ok) order by g.prev_ok, g.ord) from g), '[]'::jsonb),
  'by_hub', coalesce((select jsonb_agg(to_jsonb(hb) order by hb.first_tries desc) from hb), '[]'::jsonb))
$$;
revoke all on function public.sh_insight_retries() from public, anon, authenticated;

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
  -- sections sh_surface() can't place: a new mode or sub-view to add to it, or no section at all
  'unmapped_sections', coalesce((select jsonb_agg(jsonb_build_object('hub', x.hub, 'section', x.section, 'pings', x.n,
      'last_day', x.last_day) order by x.n desc) from (
    select a.hub, a.section, sum(a.n) as n, max((a.h at time zone 'America/Chicago')::date) as last_day from activity_hourly a
    join (select s.section from (select distinct section from activity_hourly) s where sh_surface(s.section) in ('other', 'unknown')) u
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

-- ---------- admin wrappers (review/ -> Insights) ----------
create or replace function public.get_insights(p_secret text, p_exams jsonb default '{}'::jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return sh_insights(p_exams);
end;
$$;
create or replace function public.get_insight_retries(p_secret text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return sh_insight_retries();
end;
$$;
create or replace function public.get_data_quality(p_secret text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return sh_data_quality();
end;
$$;
grant execute on function public.get_insights(text, jsonb) to anon, authenticated;
grant execute on function public.get_insight_retries(text) to anon, authenticated;
grant execute on function public.get_data_quality(text) to anon, authenticated;
