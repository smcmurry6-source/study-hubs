-- migration_v74: raw activity pings are kept 3 days instead of 30, and the retention job runs every night instead of Sundays.
-- Sam, 2026-11-18, asked whether pings need keeping even 14 days ("could we do 1 day? what would that affect"), then: "do 3
-- days". Every reader of study time uses the hourly rollup (activity_hourly, activity_visits: the admin page's time views, the
-- lessons audit, retrospectives, recaps, time crowns, check-ins against study time), kept the school year. The raw pings are
-- read only for who is studying right now (the last 15 minutes, admin_live_presence), the admin page's newest-write check, and
-- repairs such as the evening outage's (tools/data-fixes/2026-11-18-outage-time.sql); 3 days still covers a repair found after
-- a weekend. activity_pings was 166 MB of the 419 MB database (500 MB is the Free plan's read-only line); 3 days is about 10 to
-- 40 MB once the table is rewritten (VACUUM FULL or CLUSTER, at night, after the first run: deleted rows' space is reused, not
-- given back). vault/reference/analytics-retention.md.
--   1. sh_retention_run: the pings' cutoff is 3 days; everything else it does is unchanged (v58's body otherwise).
--   2. The job is sh-retention-nightly, every night at 3:23 am Central ('23 9 * * *' UTC); sh-retention-weekly is removed.
--      The other deletes keep their ages (90 days, 180 days...): run nightly they only happen in smaller steps.
--   3. sh_retention_status reads the nightly job (or the weekly one, on a database v74 hasn't reached).
-- The first nightly run deletes about 27 days of pings at once (about 250,000 rows): at 3:23 am, with the rollups kept
-- (sh.keep_rollups), as every run does.

create or replace function public.sh_retention_run(p_apply boolean default false)
returns jsonb language plpgsql set search_path = public as $$
declare
  c jsonb := '{}'::jsonb;
  k bigint;
  cut_pings timestamptz := now() - interval '3 days';   -- v74: 3 days (Sam, 2026-11-18), was 30
  cut_reach date := current_date - 90;
  cut_events date := current_date - 180;
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
    'cutoffs', jsonb_build_object('activity_pings', cut_pings, 'ui_click_reach', cut_reach, 'feature_events', cut_events));
end;
$$;
revoke all on function public.sh_retention_run(boolean) from public, anon, authenticated;

create or replace function public.sh_retention_status()
returns jsonb language plpgsql set search_path = public as $$
declare sched text;
begin
  if to_regclass('cron.job') is not null then
    execute $q$select schedule from cron.job where jobname in ('sh-retention-nightly', 'sh-retention-weekly')
               order by jobname = 'sh-retention-nightly' desc limit 1$q$ into sched;
  end if;
  return jsonb_build_object(
    'schedule', sched,
    'runs', coalesce((select jsonb_agg(jsonb_build_object('ran_at', x.ran_at, 'database_mb', x.database_mb, 'counts', x.counts) order by x.ran_at desc)
                      from (select * from retention_runs order by ran_at desc limit 8) x), '[]'::jsonb));
end;
$$;
revoke all on function public.sh_retention_status() from public, anon, authenticated;

do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.unschedule(jobid) from cron.job where jobname in ('sh-retention-weekly', 'sh-retention-nightly');
      perform cron.schedule('sh-retention-nightly', '23 9 * * *', 'select public.sh_retention_run(true)');
    exception when others then
      raise notice 'pg_cron not set up (%): run select sh_retention_run(true); by hand', sqlerrm;
    end;
  end if;
end
$do$;
