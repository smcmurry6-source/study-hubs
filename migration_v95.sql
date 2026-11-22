-- v95 (2026-11-22): shorter windows for the analytics. Package 1 of vault/tasks/2026-11-22-sustainable-for-years.md; Sam,
-- 2026-11-22, "Okay all that is good to me" (vault/decisions.md), which is Sam's OK for these deletes of student rows
-- (vault/rules/learner-data-privacy.md). Nothing else is deleted.
--
--   (B) A hub's question health (question_events) rolls up into question_events_daily when its page comes down, not after
--       the school year (this replaces 2026-11-21's "Collapse after the year" for hubs that are down; a live hub's rows still
--       collapse at a year, v93's step, which only Review of Systems and the hubs after it reach).
--   (C) Who tapped what (ui_click_reach) is kept 30 days, not 90, with a daily roll-up first (ui_click_reach_daily: day x
--       page x target, people, no ids); ui_clicks keeps the counts as before. Feature events roll up into feature_daily at
--       60 days, not 180.
--
--   1. hubs_down (hub, day): the Central day each hub's page came down. The After merge workflow's "down" step writes it
--      when a push deletes hubs/<hub>/index.html (tools/after-merge/run.js) and takes the row out when a page is added back.
--      Filled in here for every hub already down, from the hub notes and DEPLOY_NOTES.md. Package 2 (migration_v96, an
--      archived hub's answers packed 30 days after its page came down) reads it too.
--   2. ui_click_reach_daily: the clicks' daily roll-up, admin-only like every analytics table.
--   3. sh_retention_hub_down(p_hub): rolls one down hub's question_events up into question_events_daily (as v93 does) and
--      deletes them; refuses a hub that isn't in hubs_down. The nightly job calls it for every down hub with rows left
--      (a page's kept answers can still arrive after it comes down); the first backfill calls it by hand, a hub a call.
--   4. sh_retention_run: v93's body (supabase/schema.sql's newest copy), with cut_reach 30 days and the roll-up first,
--      cut_events 60 days, and the down hubs' step after v93's school-year step. A dry run counts them.
--
-- Applying it: two new tables (one with 12 rows), two functions; nothing is read or rewritten, so any quiet hour, one call.
-- The first run is a backfill (about 130,000 question-health rows of the hubs already down, about 19,000 click rows):
-- the session that applies it runs it hub by hub at 1-5 am Central, then compacts the tables (the PR says how).

set local lock_timeout = '3s';

-- ====================================================================== 1. when each hub's page came down
create table if not exists public.hubs_down (
  hub text primary key,
  day date not null,                      -- the Central day its page came down (the After merge workflow's "down" step)
  noted_at timestamptz not null default now()
);
alter table public.hubs_down enable row level security;
revoke all on public.hubs_down from anon, authenticated;

-- the hubs already down. Dates: the hub notes (vault/hubs/) and DEPLOY_NOTES.md. Genetics' page left no record in the
-- repo: its day is its last saved answer (2026-09-10), so its 30 days in package 2 count from no later than the truth.
insert into public.hubs_down (hub, day) values
  ('genetics', '2026-09-10'),
  ('hepatobiliary', '2026-09-23'),
  ('special-patient-care', '2026-11-14'),
  ('heme-endo-exam1', '2026-11-19'), ('heme-endo-exam2', '2026-11-19'), ('msk-exam3', '2026-11-19'), ('msk-exam4', '2026-11-19'),
  ('pcd-exam3', '2026-11-19'), ('pcd-implants-exam1', '2026-11-19'), ('occlusion', '2026-11-19'), ('perio', '2026-11-19'),
  ('heme-endo-exam3', '2026-11-20')
on conflict (hub) do nothing;

-- ====================================================================== 2. the clicks' daily roll-up
create table if not exists public.ui_click_reach_daily (
  day date not null, hub text not null, target text not null,
  people int not null default 0,          -- visitors who tapped it that day (summed if a day is ever added twice)
  primary key (day, hub, target)
);
alter table public.ui_click_reach_daily enable row level security;
revoke all on public.ui_click_reach_daily from anon, authenticated;

-- ====================================================================== 3. one down hub's question health into daily totals
create or replace function public.sh_retention_hub_down(p_hub text)
returns bigint language plpgsql set search_path = public as $$
declare k bigint;
begin
  if not exists (select 1 from hubs_down where hub = p_hub) then
    raise exception 'sh_retention_hub_down: % is not in hubs_down (its page is up)', p_hub;
  end if;
  -- the same totals as v93's school-year step (day x hub x question x version), with the picks counted in one pass
  insert into question_events_daily (day, hub, qid, v, people, answers, correct, firsts, firsts_correct, retries,
                                     retries_correct, views, med_ms, med_expl_ms, choices)
    with e as (select (at at time zone 'America/Chicago')::date as day, * from question_events where hub = p_hub),
    picks as (
      select p.day, p.qid, p.v, jsonb_object_agg(p.choice, p.n) as choices from
        (select day, qid, v, choice::text as choice, count(*) as n from e
         where kind = 'answer' and choice is not null group by 1, 2, 3, 4) p
      group by 1, 2, 3),
    d as (
      select day, qid, v,
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
      from e group by 1, 2, 3)
    select d.day, p_hub, d.qid, d.v, d.people, d.answers, d.correct, d.firsts, d.firsts_correct, d.retries,
           d.retries_correct, d.views, d.med_ms, d.med_expl_ms, coalesce(p.choices, '{}'::jsonb)
    from d left join picks p on p.day = d.day and p.qid = d.qid and p.v = d.v
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
  delete from question_events where hub = p_hub; get diagnostics k = row_count;
  return k;
end;
$$;
revoke all on function public.sh_retention_hub_down(text) from public, anon, authenticated;

-- ====================================================================== 4. the retention job's new windows
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
                                  'school_year', cut_year));
end;
$$;
revoke all on function public.sh_retention_run(boolean) from public, anon, authenticated;
