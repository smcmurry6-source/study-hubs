-- v93 (2026-11-21): the old analytics compacted. The last part of the retention schedule Sam approved on 2026-11-04 ("Yes to
-- the data retention suggestions"; vault/reference/analytics-retention.md): per-person study time is kept for the school
-- year, then collapsed to totals with no visitor ids. Sam, 2026-11-21, on the two rows question health had proposed:
-- question_events "Collapse after the year"; question_feedback "Delete with the hub" (not here: the After merge workflow
-- deletes a hub's thumbs when its page comes down, tools/after-merge/run.js's "down" step).
--
-- "The school year" is 365 days, counted in whole Central days (sh_retention_run's cut_year). The nightly job
-- (sh-retention-nightly, 3:23 am Central) collapses each day the night it turns a year old, so a run only ever handles one
-- day's rows (the first on about 2027-09-13: the oldest hours are from 2026-09-12). Nothing is collapsed when this is applied.
--
--   1. activity_daily (day x hub x section: people, pings), activity_visits_daily (day: visits, people) and
--      question_events_daily (day x hub x question x version: people, answers, right, first tries, retries, unanswered
--      reads, the picks, median times): the totals, no ids, admin-only like every analytics table.
--   2. activity_time_kept (visitor -> capped pings): what the collapsed hours paid in time crowns. Since migration_v68 the
--      wallet pays 100 crowns per hour of hub time from activity_hourly (sh_time_crowns, at most 144 pings a clock hour);
--      deleting a visitor's hours would lower their balance. The job adds each collapsed hour's capped pings here first,
--      and sh_time_crowns adds this row to the hours still kept, before rounding, so the crowns come out exactly the same.
--   3. sh_time_crowns reads it (one primary-key lookup; still PL/pgSQL, migration_v76).
--   4. Linking devices moves it: a trigger on visitor_links (redeem_link_code inserts the alias's row) adds the alias's
--      kept pings to the primary id's, the way redeem_link_code moves the hours themselves. (Two linked devices' kept
--      hours are capped apart, not together; it only matters for an hour both used past the cap a year ago.)
--   5. sh_retention_run: three more steps, after the test-row deletes (v74's body otherwise): activity_hourly (the
--      kept crowns, then the totals, then the delete), activity_visits, question_events. A dry run counts them.
--
-- Applying it: new tables, two function replacements and a trigger; nothing is read or rewritten. Any quiet hour; one call.

set local lock_timeout = '3s';

-- ====================================================================== 1. the totals and the kept crowns
create table if not exists public.activity_daily (
  day date not null, hub text not null, section text not null,
  people int not null default 0,          -- visitors who spent time there that day (summed if a day is ever added twice)
  n bigint not null default 0,            -- pings (one a minute of active time)
  primary key (day, hub, section)
);
create table if not exists public.activity_visits_daily (
  day date primary key,                   -- the Central day a visit began
  visits int not null default 0,
  people int not null default 0
);
create table if not exists public.question_events_daily (
  day date not null, hub text not null, qid text not null, v text not null default '',
  people int not null default 0,
  answers int not null default 0, correct int not null default 0,
  firsts int not null default 0, firsts_correct int not null default 0,     -- a person's first try at the question ever
  retries int not null default 0, retries_correct int not null default 0,
  views int not null default 0,                                             -- cards read 3 s or more and left unanswered
  med_ms int, med_expl_ms int,                                              -- median active ms before answering, on the explanation
  choices jsonb not null default '{}'::jsonb,                               -- authored choice index -> picks
  primary key (day, hub, qid, v)
);
create table if not exists public.activity_time_kept (
  visitor_id text primary key,
  n bigint not null default 0,            -- the collapsed hours' pings, each clock hour capped at 144 (sh_time_crowns)
  updated_at timestamptz not null default now()
);
alter table public.activity_daily enable row level security;
alter table public.activity_visits_daily enable row level security;
alter table public.question_events_daily enable row level security;
alter table public.activity_time_kept enable row level security;
revoke all on public.activity_daily, public.activity_visits_daily, public.question_events_daily, public.activity_time_kept
  from anon, authenticated;

-- ====================================================================== 2. time crowns: the hours kept plus what was collapsed
create or replace function public.sh_time_crowns(p_visitor text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare c integer;
begin
  select coalesce(((coalesce(sum(least(t.n, 144)), 0)
                    + coalesce((select k.n from activity_time_kept k where k.visitor_id = p_visitor), 0)) * 100 / 144)::integer, 0)
    into c
  from (select h.h, sum(h.n) as n from activity_hourly h
        where h.visitor_id = p_visitor and h.hub <> '' and h.hub <> 'zz-test' group by h.h) t;
  return c;
end;
$$;
revoke all on function public.sh_time_crowns(text) from public, anon, authenticated;

-- ====================================================================== 3. linking devices moves the kept crowns
create or replace function public.sh_link_time_kept()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id = new.primary_id then return null; end if;
  insert into activity_time_kept (visitor_id, n)
    select new.primary_id, k.n from activity_time_kept k where k.visitor_id = new.alias_id
    on conflict (visitor_id) do update set n = activity_time_kept.n + excluded.n, updated_at = now();
  delete from activity_time_kept where visitor_id = new.alias_id;
  return null;
end;
$$;
revoke all on function public.sh_link_time_kept() from public, anon, authenticated;
drop trigger if exists visitor_links_time_kept on public.visitor_links;
create trigger visitor_links_time_kept after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_link_time_kept();

-- ====================================================================== 4. the retention job's three new steps
create or replace function public.sh_retention_run(p_apply boolean default false)
returns jsonb language plpgsql set search_path = public as $$
declare
  c jsonb := '{}'::jsonb;
  k bigint;
  cut_pings timestamptz := now() - interval '3 days';   -- v74: 3 days (Sam, 2026-11-18), was 30
  cut_reach date := current_date - 90;
  cut_events date := current_date - 180;
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
