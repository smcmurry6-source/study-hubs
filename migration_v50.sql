-- v50 (2026-11-05): the analytics retention schedule in force (Sam approved it on 2026-11-04;
-- vault/reference/analytics-retention.md, vault/rules/learner-data-privacy.md).
-- What it does, in order:
--   1. Drops activity_pings_visit_idx (27 MB; nothing has read it since the rollups of v45).
--   2. Deleting or moving raw pings no longer rebuilds activity_hourly / activity_visits from what is left when the
--      transaction sets sh.keep_rollups = 'on' (the retention job and device linking do), so trimming old pings keeps
--      their hours.
--   3. redeem_link_code ("Link my devices") moves the linked id's activity_hourly and activity_visits rows itself,
--      instead of rebuilding both ids from raw pings (which would drop every hour older than the raw pings kept).
--   4. get_hub_recap reads activity_hourly (same minutes, days, sections and hours of day; the pre-2026-09-25 cap of
--      3 hours per visit no longer applies, which changes only a few hours of Perio's and MSK 3's first days).
--   5. feature_daily (feature events collapsed to day x page x kind with people counts, no ids) and retention_runs
--      (what each run removed, and the database size).
--   6. sh_retention_run(p_apply): the approved deletes. With p_apply false (the default) it only counts what is due.
--        raw activity_pings          older than 30 days         deleted (activity_hourly / activity_visits keep them)
--        ui_click_reach              older than 90 days         deleted (ui_clicks keeps the counts, no ids)
--        feature_events              older than 180 days        collapsed into feature_daily, then deleted
--        question_flags, hub_suggestions   120 days after resolving   visitor id removed (text and reply kept)
--        exam_debriefs               a year after the check-in  visitor id replaced by 'anon-<row id>'
--        survey_responses            "No thanks" rows of a closed survey deleted; answers 90 days after it closed
--                                    get 'anon-<row id>' instead of the visitor id
--        link_attempts               older than 7 days          deleted
--        test hubs ('zz-...') and blank-hub rows                deleted
--      Not here: personal_answers / xp (ranks are built from them), the trophies and games tables, and Timmy Time
--      reactions and comments (removed by hand with the hub's page, vault/reference/analytics-retention.md).
--   7. sh_retention_status(): the last runs and the schedule; get_data_quality adds it for the admin page. What a
--      run would remove now: select sh_retention_run(); (counts only).
--   8. A weekly pg_cron job runs sh_retention_run(true) on Sundays at 09:23 UTC (3:23 am Central).
-- Every function here is closed to visitors (anon, authenticated); agents call them on the Supabase connector.

-- ---------- 1. the unused index ----------
drop index if exists public.activity_pings_visit_idx;

-- ---------- 2. rollups survive a retention delete or a device link ----------
create or replace function public.sh_activity_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- the retention job and device linking keep activity_hourly / activity_visits themselves
  if current_setting('sh.keep_rollups', true) = 'on' then return null; end if;
  perform sh_activity_rebuild(array(select distinct visitor_id from old_rows));
  return null;
end; $$;

create or replace function public.sh_activity_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('sh.keep_rollups', true) = 'on' then return null; end if;
  perform sh_activity_rebuild(array(select visitor_id from old_rows union select visitor_id from new_rows));
  return null;
end; $$;

-- ---------- 3. Link my devices moves the rollups instead of rebuilding them ----------
create or replace function public.redeem_link_code(p_code text, p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
declare p text; c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return null; end if;
  if (select count(*) from link_attempts where visitor_id = p_visitor and tried_at > now() - interval '1 hour') >= 10 then return null; end if;
  insert into link_attempts (visitor_id) values (p_visitor);
  select visitor_id into p from link_codes where code = c and created_at > now() - interval '10 minutes';
  if p is null then return null; end if;
  delete from link_codes where code = c;
  if p = p_visitor then return p; end if;
  -- follow an existing chain so everything ends on one id
  p := coalesce((select primary_id from visitor_links where alias_id = p), p);

  update personal_answers set visitor_id = p where visitor_id = p_visitor;
  update arcade_scores set visitor_id = p where visitor_id = p_visitor;
  update egg_events set visitor_id = p where visitor_id = p_visitor;
  -- time (v50): move the hour and visit rollups, then the raw pings with the rebuild trigger off, so hours whose raw
  -- pings the retention job already removed are kept
  insert into activity_hourly (h, hub, section, visitor_id, n)
    select h, hub, section, p, n from activity_hourly where visitor_id = p_visitor
    on conflict (h, hub, section, visitor_id) do update set n = activity_hourly.n + excluded.n;
  delete from activity_hourly where visitor_id = p_visitor;
  insert into activity_visits (visit_id, visitor_id, first_at, last_at)
    select visit_id, p, first_at, last_at from activity_visits where visitor_id = p_visitor
    on conflict (visit_id, visitor_id) do update set first_at = least(activity_visits.first_at, excluded.first_at),
      last_at = greatest(activity_visits.last_at, excluded.last_at);
  delete from activity_visits where visitor_id = p_visitor;
  perform set_config('sh.keep_rollups', 'on', true);
  update activity_pings set visitor_id = p where visitor_id = p_visitor;
  perform set_config('sh.keep_rollups', 'off', true);
  update nuke_launches set visitor_id = p where visitor_id = p_visitor;
  insert into achievements (visitor_id, kind, hub, created_at) select p, kind, hub, created_at from achievements where visitor_id = p_visitor on conflict do nothing;
  delete from achievements where visitor_id = p_visitor;
  insert into survey_responses (survey_id, visitor_id, answers, created_at) select survey_id, p, answers, created_at from survey_responses where visitor_id = p_visitor on conflict do nothing;
  delete from survey_responses where visitor_id = p_visitor;
  insert into ui_click_reach (day, hub, target, visitor_id) select day, hub, target, p from ui_click_reach where visitor_id = p_visitor on conflict do nothing;
  delete from ui_click_reach where visitor_id = p_visitor;
  insert into correct_streaks (visitor_id, current_streak, best_streak, updated_at)
    select p, current_streak, best_streak, updated_at from correct_streaks where visitor_id = p_visitor
    on conflict (visitor_id) do update set best_streak = greatest(correct_streaks.best_streak, excluded.best_streak),
      current_streak = case when excluded.updated_at > correct_streaks.updated_at then excluded.current_streak else correct_streaks.current_streak end,
      updated_at = greatest(correct_streaks.updated_at, excluded.updated_at);
  delete from correct_streaks where visitor_id = p_visitor;
  -- pinned questions (v46): per question, the newer change wins
  insert into question_pins (visitor_id, hub, qid, pinned, t)
    select p, hub, qid, pinned, t from question_pins where visitor_id = p_visitor
    on conflict (visitor_id, hub, qid) do update set pinned = case when excluded.t > question_pins.t then excluded.pinned else question_pins.pinned end,
      t = greatest(question_pins.t, excluded.t);
  delete from question_pins where visitor_id = p_visitor;
  -- keep a chosen name if the first device had none
  insert into visitor_names (visitor_id, display_name, updated_at) select p, display_name, updated_at from visitor_names where visitor_id = p_visitor
    on conflict (visitor_id) do nothing;
  delete from visitor_names where visitor_id = p_visitor;
  update visitor_links set primary_id = p where primary_id = p_visitor;
  insert into visitor_links (alias_id, primary_id) values (p_visitor, p) on conflict (alias_id) do update set primary_id = excluded.primary_id, linked_at = now();
  return p;
end;
$$;

-- ---------- 4. the end-of-hub recap reads the hourly rollup ----------
create or replace function public.get_hub_recap(p_secret text, p_hub text, p_exam date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  tz text := 'America/Chicago';
  r jsonb;
begin
  if not sh_admin_ok(p_secret) then raise exception 'not allowed'; end if;

  -- v50: from activity_hourly (n pings of 25 s per visitor, hour, hub and section), so it survives the 30-day trim
  -- of raw pings; Central time is a whole number of hours from UTC, so hours and days come out exactly as before
  with p as (
    select a.visitor_id, nullif(a.section, '') as section, a.h at time zone tz as t, a.n
    from activity_hourly a where a.hub = p_hub
  ),
  ans as (select pa.visitor_id, pa.qid, pa.correct, pa.answered_at at time zone tz as t from personal_answers pa where pa.hub = p_hub),
  people as (select visitor_id from p union select visitor_id from ans),
  days as (
    select d, sum(m) as minutes, sum(a) as answers, count(distinct v) as people from (
      select t::date as d, n * 25 / 60.0 as m, 0 as a, visitor_id as v from p
      union all select t::date, 0, 1, visitor_id from ans) u group by d),
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
  secs as (select split_part(coalesce(section, ''), '/', 1) as mode, section, sum(n) * 25 / 60.0 as minutes from p group by 1, 2),
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
    'people', (select count(*) from people),
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

-- ---------- 5. collapsed feature events and the run log ----------
create table if not exists public.feature_daily (
  day date not null,
  hub text not null,
  kind text not null,
  people integer not null,   -- distinct visitor ids that day (no ids kept)
  n bigint not null,          -- the events' summed counts
  primary key (day, hub, kind)
);
alter table public.feature_daily enable row level security;

create table if not exists public.retention_runs (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  database_mb numeric,
  counts jsonb not null
);
alter table public.retention_runs enable row level security;

-- ---------- 6. the approved deletes ----------
create or replace function public.sh_retention_run(p_apply boolean default false)
returns jsonb language plpgsql set search_path = public as $$
declare
  c jsonb := '{}'::jsonb;
  k bigint;
  cut_pings timestamptz := now() - interval '30 days';
  cut_reach date := current_date - 90;
  cut_events date := current_date - 180;
begin
  -- raw pings older than 30 days, and test or blank-hub pings; their hours stay in activity_hourly / activity_visits
  if p_apply then
    perform set_config('sh.keep_rollups', 'on', true);
    delete from activity_pings where pinged_at < cut_pings or hub = '' or hub ~ '^zz-';
    get diagnostics k = row_count;
    perform set_config('sh.keep_rollups', 'off', true);
  else
    select count(*) into k from activity_pings where pinged_at < cut_pings or hub = '' or hub ~ '^zz-';
  end if;
  c := c || jsonb_build_object('activity_pings', k);

  -- who tapped what, older than 90 days (ui_clicks keeps the counts, with no ids)
  if p_apply then delete from ui_click_reach where day < cut_reach or hub = '' or hub ~ '^zz-'; get diagnostics k = row_count;
  else select count(*) into k from ui_click_reach where day < cut_reach or hub = '' or hub ~ '^zz-'; end if;
  c := c || jsonb_build_object('ui_click_reach', k);

  -- feature events older than 180 days: day x page x kind with people counts, then the per-person rows go
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

  -- device-link attempts: only the last hour is read (the rate limit)
  if p_apply then delete from link_attempts where tried_at < now() - interval '7 days'; get diagnostics k = row_count;
  else select count(*) into k from link_attempts where tried_at < now() - interval '7 days'; end if;
  c := c || jsonb_build_object('link_attempts', k);

  if p_apply then
    analyze activity_pings;
    insert into retention_runs (database_mb, counts) values (round(pg_database_size(current_database()) / 1048576.0, 1), c);
  end if;
  return jsonb_build_object('applied', p_apply, 'counts', c,
    'cutoffs', jsonb_build_object('activity_pings', cut_pings, 'ui_click_reach', cut_reach, 'feature_events', cut_events));
end;
$$;
revoke all on function public.sh_retention_run(boolean) from public, anon, authenticated;

-- ---------- 7. status for agents and the admin page ----------
create or replace function public.sh_retention_status()
returns jsonb language plpgsql set search_path = public as $$
declare sched text;
begin
  if to_regclass('cron.job') is not null then
    execute $q$select schedule from cron.job where jobname = 'sh-retention-weekly' limit 1$q$ into sched;
  end if;
  return jsonb_build_object(
    'schedule', sched,
    'runs', coalesce((select jsonb_agg(jsonb_build_object('ran_at', x.ran_at, 'database_mb', x.database_mb, 'counts', x.counts) order by x.ran_at desc)
                      from (select * from retention_runs order by ran_at desc limit 8) x), '[]'::jsonb));
end;
$$;
revoke all on function public.sh_retention_status() from public, anon, authenticated;

create or replace function public.get_data_quality(p_secret text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return sh_data_quality() || jsonb_build_object('retention', sh_retention_status());
end;
$$;

-- ---------- 8. the weekly job (pg_cron, where the database has it) ----------
do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.unschedule(jobid) from cron.job where jobname = 'sh-retention-weekly';
      perform cron.schedule('sh-retention-weekly', '23 9 * * 0', 'select public.sh_retention_run(true)');
    exception when others then
      raise notice 'pg_cron not set up (%): run select sh_retention_run(true); by hand', sqlerrm;
    end;
  end if;
end
$do$;
