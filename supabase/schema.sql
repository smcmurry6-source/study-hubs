-- ============================================================================
-- study-hubs Supabase schema snapshot (project thytmzsgymydbzcqdnix)
-- Generated 2026-09-25 from the live database, after migration_v18.
--
-- This is the full picture the migration_v*.sql files only partly cover (17 of
-- the functions below had no source in the repo before this file). If the
-- project ever has to be rebuilt, run this once in the SQL editor.
--
-- The admin secret is NOT in this file (the repo is public): every admin
-- function compares p_secret to the placeholder '<ADMIN_SECRET>'. Replace it
-- with the real value from Sam's local ops scripts before running.
--
-- Refresh this file whenever you run a new migration.
-- ============================================================================

-- ---------------------------------------------------------------- tables
create table if not exists public.activity_pings (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  visit_id text not null,
  hub text not null default '',
  section text,
  pinged_at timestamptz not null default now()
);
create table if not exists public.arcade_scores (
  id bigint generated always as identity primary key,
  hub text not null,
  game text not null,
  visitor_id text not null,
  score integer not null,
  played_at timestamptz not null default now()
);
create table if not exists public.changelog (
  id bigint generated always as identity primary key,
  hub text,
  message text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.correct_streaks (
  visitor_id text primary key,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.hub_suggestions (
  id bigint generated always as identity primary key,
  hub text,
  note text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.mode_stats (
  hub text not null,
  mode text not null,
  opens integer not null default 0,
  primary key (hub, mode)
);
create table if not exists public.nuke_launches (
  id bigint generated always as identity primary key,
  hub text not null default '',
  visitor_id text not null,
  display_name text,
  launched_at timestamptz not null default now()
);
create table if not exists public.personal_answers (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  hub text not null,
  qid text not null,
  correct boolean not null,
  answered_at timestamptz not null default now()
);
create table if not exists public.presence_hourly (
  hub text not null,
  hour_of_day integer not null check (hour_of_day >= 0 and hour_of_day <= 23),
  ping_count integer not null default 0,
  primary key (hub, hour_of_day)
);
create table if not exists public.question_choices (
  hub text not null,
  qid text not null,
  choice integer not null,
  picks integer not null default 0,
  primary key (hub, qid, choice)
);
create table if not exists public.question_flags (
  id bigint generated always as identity primary key,
  hub text not null,
  note text not null,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);
create table if not exists public.question_stats (
  hub text not null,
  qid text not null,
  attempts integer not null default 0,
  correct integer not null default 0,
  primary key (hub, qid)
);
create table if not exists public.visitor_names (
  visitor_id text primary key,
  display_name text not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes
create index if not exists arcade_scores_board_idx on public.arcade_scores (hub, game, score desc);
create index if not exists arcade_scores_visitor_idx on public.arcade_scores (visitor_id, hub, game);
create index if not exists nuke_launches_launched_idx on public.nuke_launches (launched_at);
create index if not exists personal_answers_visitor_hub_idx on public.personal_answers (visitor_id, hub);
create index if not exists activity_pings_visitor_idx on public.activity_pings (visitor_id, pinged_at);
create index if not exists activity_pings_visit_idx on public.activity_pings (visit_id, pinged_at);
create index if not exists activity_pings_hub_idx on public.activity_pings (hub, pinged_at);

-- ---------------------------------------------------------------- row level security
-- Every table has RLS on. Tables with no policy are reachable only through the
-- SECURITY DEFINER functions below.
alter table public.activity_pings   enable row level security;
alter table public.arcade_scores    enable row level security;
alter table public.changelog        enable row level security;
alter table public.correct_streaks  enable row level security;
alter table public.hub_suggestions  enable row level security;
alter table public.mode_stats       enable row level security;
alter table public.nuke_launches    enable row level security;
alter table public.personal_answers enable row level security;
alter table public.presence_hourly  enable row level security;
alter table public.question_choices enable row level security;
alter table public.question_flags   enable row level security;
alter table public.question_stats   enable row level security;
alter table public.visitor_names    enable row level security;

create policy "public read changelog"        on public.changelog        for select to public using (true);
create policy "anon can insert suggestions"  on public.hub_suggestions  for insert to public with check (true);
create policy "public read modes"            on public.mode_stats       for select to public using (true);
create policy "public read presence_hourly"  on public.presence_hourly  for select to public using (true);
create policy "public read question_choices" on public.question_choices for select to public using (true);
create policy "public insert question_flags" on public.question_flags   for insert to public with check (true);
create policy "public read stats"            on public.question_stats   for select to public using (true);

-- ---------------------------------------------------------------- names
create or replace function public.anon_name_base(p_visitor_id text)
returns text language sql immutable set search_path = public as $$
  select
    (array['Gleaming','Sterile','Steady','Sharp','Polished','Bright','Bold','Calm',
      'Diligent','Keen','Vigilant','Minty','Pearly','Radiant','Precise','Speedy',
      'Tidy','Shiny','Meticulous','Golden'])[1 + (abs(hashtext(p_visitor_id || ':adj')) % 20)]
    || ' ' ||
    (array['Molar','Scaler','Bur','Enamel','Bicuspid','Incisor','Canine','Floss',
      'Curette','Crown','Veneer','Probe','Suction','Retainer','Bracket','Filling',
      'Drill','Bridge','Cusp','Bib'])[1 + (abs(hashtext(p_visitor_id || ':noun')) % 20)];
$$;

create or replace function public.first_seen(p_visitor_id text)
returns timestamptz language sql stable set search_path = public as $$
  select min(answered_at) from personal_answers where visitor_id = p_visitor_id;
$$;

-- the earliest holder of a generated name keeps it plain; later holders get a two-digit suffix
create or replace function public.anon_name(p_visitor_id text)
returns text language sql stable set search_path = public as $$
  with me as (select anon_name_base(p_visitor_id) as base, first_seen(p_visitor_id) as since)
  select me.base || case when exists (
      select 1 from correct_streaks c
      where c.visitor_id <> p_visitor_id
        and anon_name_base(c.visitor_id) = me.base
        and first_seen(c.visitor_id) is not null
        and (me.since is null or first_seen(c.visitor_id) < me.since
             or (first_seen(c.visitor_id) = me.since and c.visitor_id < p_visitor_id))
    ) then ' ' || (10 + abs(hashtext(p_visitor_id || ':n')) % 90)::text else '' end
  from me;
$$;

create or replace function public.get_display_name(p_visitor text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select display_name from visitor_names where visitor_id = p_visitor), anon_name(p_visitor));
$$;

create or replace function public.set_display_name(p_visitor text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_name is null or length(trim(p_name)) = 0 then return; end if;
  insert into visitor_names (visitor_id, display_name, updated_at)
  values (p_visitor, left(trim(p_name), 24), now())
  on conflict (visitor_id) do update set display_name = excluded.display_name, updated_at = now();
end;
$$;

-- ---------------------------------------------------------------- answers and stats (public)
create or replace function public.record_answer(p_hub text, p_qid text, p_correct boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into question_stats (hub, qid, attempts, correct)
  values (p_hub, p_qid, 1, case when p_correct then 1 else 0 end)
  on conflict (hub, qid) do update
    set attempts = question_stats.attempts + 1,
        correct = question_stats.correct + case when p_correct then 1 else 0 end;
end;
$$;

create or replace function public.record_choice(p_hub text, p_qid text, p_choice integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or p_qid is null or p_choice is null or p_choice < 0 or p_choice > 9 then return; end if;
  insert into question_choices (hub, qid, choice, picks) values (p_hub, p_qid, p_choice, 1)
  on conflict (hub, qid, choice) do update set picks = question_choices.picks + 1;
end;
$$;

create or replace function public.record_personal_answer(p_visitor text, p_hub text, p_qid text, p_correct boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into personal_answers (visitor_id, hub, qid, correct) values (p_visitor, p_hub, p_qid, p_correct);
end;
$$;

create or replace function public.record_correct_streak(p_visitor text, p_correct boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  insert into correct_streaks (visitor_id, current_streak, best_streak, updated_at)
  values (p_visitor, case when p_correct then 1 else 0 end, case when p_correct then 1 else 0 end, now())
  on conflict (visitor_id) do update
    set current_streak = case when p_correct then correct_streaks.current_streak + 1 else 0 end,
        best_streak = greatest(correct_streaks.best_streak, case when p_correct then correct_streaks.current_streak + 1 else 0 end),
        updated_at = now();
end;
$$;

create or replace function public.record_mode_open(p_hub text, p_mode text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into mode_stats (hub, mode, opens) values (p_hub, p_mode, 1)
  on conflict (hub, mode) do update set opens = mode_stats.opens + 1;
end;
$$;

create or replace function public.record_presence_ping(p_hub text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into presence_hourly (hub, hour_of_day, ping_count)
  values (p_hub, extract(hour from now() at time zone 'America/Chicago')::int, 1)
  on conflict (hub, hour_of_day) do update set ping_count = presence_hourly.ping_count + 1;
end;
$$;

create or replace function public.record_activity_ping(p_visitor text, p_visit text, p_hub text, p_section text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_visit is null or length(trim(p_visit)) = 0 then return; end if;
  insert into activity_pings (visitor_id, visit_id, hub, section, pinged_at)
  values (p_visitor, p_visit, coalesce(p_hub, ''), nullif(p_section, ''), now());
end;
$$;

create or replace function public.record_nuke_launch(p_hub text, p_visitor text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  insert into nuke_launches (hub, visitor_id, display_name, launched_at)
  values (coalesce(p_hub, ''), p_visitor, nullif(trim(coalesce(p_name, '')), ''), now());
end;
$$;

create or replace function public.get_personal_stats(p_visitor text, p_hub text)
returns table(answer_date date, attempts integer, correct integer)
language sql security definer set search_path = public as $$
  select (answered_at at time zone 'America/Chicago')::date as answer_date,
         count(*)::int as attempts,
         sum(case when correct then 1 else 0 end)::int as correct
  from personal_answers
  where visitor_id = p_visitor and hub = p_hub
  group by (answered_at at time zone 'America/Chicago')::date
  order by answer_date;
$$;

create or replace function public.get_leaderboard(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with days as (
    select visitor_id, (answered_at at time zone 'America/Chicago')::date as d
    from personal_answers group by visitor_id, (answered_at at time zone 'America/Chicago')::date
  ), islands as (
    select visitor_id, d, d - (row_number() over (partition by visitor_id order by d))::int as grp from days
  ), streaks as (
    select visitor_id, count(*)::int as len, max(d) as last_day from islands group by visitor_id, grp
  ), current_streaks as (
    select visitor_id, max(len) as streak from streaks
    where last_day >= (now() at time zone 'America/Chicago')::date - 1 group by visitor_id
  ), totals as (
    select visitor_id, count(*)::int as total_answered from personal_answers group by visitor_id
  )
  select coalesce(vn.display_name, anon_name(cs.visitor_id)) as display_name, cs.streak, coalesce(t.total_answered, 0) as total_answered
  from current_streaks cs
  left join visitor_names vn on vn.visitor_id = cs.visitor_id
  left join totals t on t.visitor_id = cs.visitor_id
  where cs.streak >= 2
  order by cs.streak desc, total_answered desc
  limit p_limit;
end;
$$;

create or replace function public.get_correct_streak_stats()
returns table(kind text, display_name text, streak integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  (select 'active'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.current_streak
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id
   where s.current_streak > 0 order by s.current_streak desc limit 1)
  union all
  (select 'record'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.best_streak
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id
   where s.best_streak > 0 order by s.best_streak desc limit 1);
end;
$$;

-- ---------------------------------------------------------------- arcade
create or replace function public.submit_arcade_score(p_visitor text, p_hub text, p_game text, p_score integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  if p_game not in (
    'sort', 'snake', 'stack', 'match', 'hangman', 'fact', 'blaster', 'search', 'whack',          -- msk-exam3 Bone Zone Arcade
    'flappy', 'crusher', 'probe', 'quadrants', 'perdle', 'planer', 'smile', 'sweeper', 'cross'   -- perio Pocket Arcade
  ) then return; end if;
  if p_score is null or p_score < 1 or p_score > 200000 then return; end if;
  if exists (select 1 from arcade_scores where visitor_id = p_visitor and hub = coalesce(p_hub, '') and game = p_game
             and played_at > now() - interval '10 seconds') then return; end if;
  insert into arcade_scores (hub, game, visitor_id, score) values (coalesce(p_hub, ''), p_game, p_visitor, p_score);
end;
$$;

create or replace function public.get_arcade_leaderboard(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays
    from arcade_scores a where a.hub = coalesce(p_hub, '') and a.game = p_game group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.best, r.plays,
         (p_visitor is not null and r.visitor_id = p_visitor)
  from ranked r left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;

-- ---------------------------------------------------------------- admin (secret-gated)
create or replace function public.log_changelog(p_secret text, p_hub text, p_message text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  insert into changelog (hub, message) values (p_hub, p_message);
end;
$$;

create or replace function public.admin_reset_changelog(p_secret text, p_entries jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare entry jsonb;
begin
  if p_secret <> '<ADMIN_SECRET>' then raise exception 'invalid secret'; end if;
  delete from changelog;
  for entry in select * from jsonb_array_elements(p_entries) loop
    insert into changelog (hub, message, created_at)
    values (entry->>'hub', entry->>'message', coalesce((entry->>'created_at')::timestamptz, now()));
  end loop;
end;
$$;

create or replace function public.get_reports(p_secret text)
returns table(kind text, id bigint, hub text, note text, resolved boolean, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select 'flag'::text, f.id, f.hub, f.note, f.resolved, f.created_at from question_flags f
  union all
  select 'suggestion'::text, s.id, s.hub, s.note, s.resolved, s.created_at from hub_suggestions s
  order by created_at desc;
end;
$$;

create or replace function public.set_report_resolved(p_secret text, p_kind text, p_id bigint, p_resolved boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_kind = 'flag' then update question_flags set resolved = p_resolved where id = p_id;
  elsif p_kind = 'suggestion' then update hub_suggestions set resolved = p_resolved where id = p_id;
  end if;
end;
$$;

create or replace function public.get_visitor_summary(p_secret text, p_days integer default 30)
returns table(unique_visitors bigint, total_visits bigint, avg_visit_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with visits as (
    select visit_id, visitor_id, extract(epoch from (max(pinged_at) - min(pinged_at))) / 60.0 as span_minutes
    from activity_pings where pinged_at >= now() - (p_days || ' days')::interval group by visit_id, visitor_id
  )
  select count(distinct visitor_id)::bigint, count(*)::bigint, round(avg(greatest(span_minutes, 0.4))::numeric, 1) from visits;
end;
$$;

create or replace function public.get_visitor_by_hub(p_secret text, p_days integer default 30)
returns table(hub text, unique_visitors bigint, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select coalesce(nullif(a.hub, ''), '(unknown)'), count(distinct a.visitor_id)::bigint, round((count(*) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_pings a where a.pinged_at >= now() - (p_days || ' days')::interval
  group by coalesce(nullif(a.hub, ''), '(unknown)') order by total_minutes desc;
end;
$$;

create or replace function public.get_visitor_by_section(p_secret text, p_days integer default 30)
returns table(hub text, section text, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select coalesce(nullif(a.hub, ''), '(unknown)') as hub, coalesce(a.section, '(unspecified)'), round((count(*) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_pings a where a.pinged_at >= now() - (p_days || ' days')::interval
  group by coalesce(nullif(a.hub, ''), '(unknown)'), coalesce(a.section, '(unspecified)') order by hub, total_minutes desc;
end;
$$;

create or replace function public.get_nuke_summary(p_secret text, p_days integer default 30)
returns table(total_launches bigint, unique_launchers bigint)
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select count(*)::bigint, count(distinct visitor_id)::bigint from nuke_launches
  where launched_at >= now() - (p_days || ' days')::interval;
end;
$$;

create or replace function public.get_nuke_by_hub(p_secret text, p_days integer default 30)
returns table(hub text, launches bigint)
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select coalesce(nullif(n.hub, ''), '(unknown)'), count(*)::bigint as launches from nuke_launches n
  where n.launched_at >= now() - (p_days || ' days')::interval group by coalesce(nullif(n.hub, ''), '(unknown)') order by launches desc;
end;
$$;

create or replace function public.get_nuke_recent(p_secret text, p_limit integer default 10)
returns table(display_name text, hub text, launched_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if p_secret is distinct from '<ADMIN_SECRET>' then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query select coalesce(n.display_name, anon_name(n.visitor_id)), coalesce(nullif(n.hub, ''), '(unknown)'), n.launched_at
  from nuke_launches n order by n.launched_at desc limit p_limit;
end;
$$;

-- ============================================================================
-- easter eggs (migration_v13): Golden Probe + Tooth Fairy
-- ============================================================================
-- Golden Probe: one question per hub per (Central-time) day is secretly golden; the first
--   classmate to answer it right claims the day and shows on the dashboard.
-- Tooth Fairy: rare catches, counted per visitor for a small collectors' board.
-- Both live in one table; all access is through the functions below (RLS on, no policies).

create table if not exists public.egg_events (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('golden', 'fairy')),
  hub text not null default '',
  visitor_id text not null,
  qid text,
  day date not null default ((now() at time zone 'America/Chicago')::date),
  created_at timestamptz not null default now()
);
alter table public.egg_events enable row level security;
create unique index if not exists egg_events_golden_once on public.egg_events (hub, day) where kind = 'golden';
create index if not exists egg_events_fairy_visitor on public.egg_events (visitor_id) where kind = 'fairy';

-- returns true only for the first claim of the day on that hub
create or replace function public.claim_golden_probe(p_hub text, p_visitor text, p_qid text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or p_hub is null then return false; end if;
  insert into egg_events (kind, hub, visitor_id, qid) values ('golden', p_hub, p_visitor, p_qid)
  on conflict do nothing;
  return found;
end;
$$;

create or replace function public.get_golden_today()
returns table(hub text, display_name text, qid text, claimed_at timestamptz)
language sql stable security definer set search_path = public as $$
  select e.hub, coalesce(vn.display_name, anon_name(e.visitor_id)), e.qid, e.created_at
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'golden' and e.day = (now() at time zone 'America/Chicago')::date
  order by e.created_at;
$$;

-- one catch per visitor per minute at most; returns that visitor's total
create or replace function public.record_fairy(p_hub text, p_visitor text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return 0; end if;
  if not exists (select 1 from egg_events where kind = 'fairy' and visitor_id = p_visitor and created_at > now() - interval '1 minute') then
    insert into egg_events (kind, hub, visitor_id) values ('fairy', coalesce(p_hub, ''), p_visitor);
  end if;
  return (select count(*)::int from egg_events where kind = 'fairy' and visitor_id = p_visitor);
end;
$$;

create or replace function public.get_fairy_board(p_limit integer default 5)
returns table(display_name text, catches integer)
language sql stable security definer set search_path = public as $$
  select coalesce(vn.display_name, anon_name(e.visitor_id)), count(*)::int
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'fairy'
  group by e.visitor_id, vn.display_name
  order by count(*) desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

-- ============================================================================
-- click analytics + surveys (migration_v14)
-- ============================================================================
--
-- Clicks: the widget (hubs) and the dashboard batch up clicks on buttons, tabs and links and send
--   them once a minute as {s: section, t: target, n: count}. Stored as daily counts, plus a
--   visitor-per-target table so the admin page can show "how many people" and not just "how many clicks".
-- Surveys: at most one active survey is offered on the dashboard; each visitor answers (or skips)
--   once. Surveys are created/activated by Sam (or a Claude session) with admin_upsert_survey.
--
-- The admin secret is not in this file: sh_admin_ok() copies the check from an existing admin
-- function (get_nuke_summary) when the migration runs.

-- ---------- private admin check ----------
do $mig$
declare s text;
begin
  s := (regexp_match(pg_get_functiondef('public.get_nuke_summary'::regproc), 'p_secret is distinct from ''([^'']+)'''))[1];
  if s is null then raise exception 'could not find the admin check in get_nuke_summary'; end if;
  execute format($f$
    create or replace function public.sh_admin_ok(p_secret text) returns boolean
    language sql immutable security definer set search_path = public as $b$ select p_secret is not distinct from %L $b$;
  $f$, s);
end;
$mig$;
revoke all on function public.sh_admin_ok(text) from public, anon, authenticated;

-- ---------- clicks ----------
create table if not exists public.ui_clicks (
  day date not null default ((now() at time zone 'America/Chicago')::date),
  hub text not null,
  section text not null default '',
  target text not null,
  clicks integer not null default 0,
  primary key (day, hub, section, target)
);
create table if not exists public.ui_click_reach (
  day date not null default ((now() at time zone 'America/Chicago')::date),
  hub text not null,
  target text not null,
  visitor_id text not null,
  primary key (day, hub, target, visitor_id)
);
alter table public.ui_clicks enable row level security;
alter table public.ui_click_reach enable row level security;

create or replace function public.record_clicks(p_hub text, p_visitor text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; s text; t text; n int; k int := 0;
begin
  if p_hub is null or length(p_hub) > 40 or jsonb_typeof(p_items) is distinct from 'array' then return; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    k := k + 1; exit when k > 80;
    s := left(coalesce(it->>'s', ''), 80);
    t := left(coalesce(it->>'t', ''), 80);
    n := least(greatest(coalesce((it->>'n')::int, 1), 1), 50);
    continue when t = '';
    insert into ui_clicks (hub, section, target, clicks) values (p_hub, s, t, n)
      on conflict (day, hub, section, target) do update set clicks = ui_clicks.clicks + excluded.clicks;
    if p_visitor is not null and length(p_visitor) between 1 and 80 then
      insert into ui_click_reach (hub, target, visitor_id) values (p_hub, t, p_visitor) on conflict do nothing;
    end if;
  end loop;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;

create or replace function public.get_click_summary(p_secret text, p_days integer default 14, p_hub text default null)
returns table(hub text, section text, target text, clicks bigint, people bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with c as (
    select c.hub, c.section, c.target, sum(c.clicks)::bigint as clicks from ui_clicks c
    where c.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 14), 365))
      and (p_hub is null or c.hub = p_hub)
    group by 1, 2, 3
  ), r as (
    select r.hub, r.target, count(distinct r.visitor_id)::bigint as people from ui_click_reach r
    where r.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 14), 365))
      and (p_hub is null or r.hub = p_hub)
    group by 1, 2
  )
  select c.hub, c.section, c.target, c.clicks, coalesce(r.people, 0) from c left join r on r.hub = c.hub and r.target = c.target
  order by c.clicks desc limit 1000;
end;
$$;

-- ---------- surveys ----------
create table if not exists public.surveys (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  questions jsonb not null,           -- [{id, kind: 'choice'|'multi'|'scale'|'text', prompt, options?: [..]}], at most 3
  active boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  survey_id bigint not null references public.surveys(id) on delete cascade,
  visitor_id text not null,
  answers jsonb,                      -- null = skipped
  created_at timestamptz not null default now(),
  unique (survey_id, visitor_id)
);
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;

create or replace function public.get_active_survey(p_visitor text)
returns table(id bigint, title text, questions jsonb)
language sql stable security definer set search_path = public as $$
  select s.id, s.title, s.questions from surveys s
  where s.active and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now())
    and not exists (select 1 from survey_responses r where r.survey_id = s.id and r.visitor_id = p_visitor)
  order by s.starts_at desc limit 1;
$$;

-- p_answers null = "no thanks" (recorded so it is never offered again to that visitor)
create or replace function public.submit_survey(p_survey bigint, p_visitor text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 4000) then return false; end if;
  if not exists (select 1 from surveys where id = p_survey and active) then return false; end if;
  insert into survey_responses (survey_id, visitor_id, answers) values (p_survey, p_visitor, p_answers)
    on conflict (survey_id, visitor_id) do nothing;
  return found;
end;
$$;

create or replace function public.admin_upsert_survey(p_secret text, p_slug text, p_title text, p_questions jsonb,
  p_active boolean default false, p_ends_at timestamptz default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) not between 1 and 3 then
    raise exception 'questions must be an array of 1-3 items'; end if;
  insert into surveys (slug, title, questions, active, ends_at) values (p_slug, p_title, p_questions, p_active, p_ends_at)
  on conflict (slug) do update set title = excluded.title, questions = excluded.questions, active = excluded.active, ends_at = excluded.ends_at
  returning id into v;
  if p_active then update surveys set active = false where id <> v; end if;  -- one live survey at a time
  return v;
end;
$$;

create or replace function public.admin_set_survey_active(p_secret text, p_survey bigint, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_active then update surveys set active = false where id <> p_survey; end if;
  update surveys set active = p_active where id = p_survey;
end;
$$;

create or replace function public.get_survey_results(p_secret text)
returns table(survey_id bigint, slug text, title text, questions jsonb, active boolean, created_at timestamptz,
              responses bigint, skipped bigint, answers jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select s.id, s.slug, s.title, s.questions, s.active, s.created_at,
    count(r.id) filter (where r.answers is not null), count(r.id) filter (where r.answers is null),
    coalesce(jsonb_agg(r.answers order by r.created_at desc) filter (where r.answers is not null), '[]'::jsonb)
  from surveys s left join survey_responses r on r.survey_id = s.id
  group by s.id order by s.created_at desc;
end;
$$;

-- ============================================================================
-- handpiece ranks, trophies, link devices (migration_v15)
-- ============================================================================
--
-- Ranks: XP is computed from personal_answers (no new tracking needed, so everyone's history counts):
--   first time you get a question right 10, any other right answer 2, a wrong answer 1 (effort counts),
--   capped at 600 per Central-time day, plus 20 for every day studied. Tiers (sh_tier):
--   0 Antique drill, 1 Stone 150, 2 Bronze 600, 3 Silver 1500, 4 Gold 3000, 5 Diamond 6000, 6 Dark Matter 12000.
-- Trophies: most are derived from existing tables; the few that only a browser can see (Plaque Boss final
--   blow, Night Owl, Through the Root Canal, a 90%+ mock, hub mastery tiers) are reported through
--   record_achievement with a fixed whitelist.
-- Leaderboards: get_leaderboard, get_correct_streak_stats and get_arcade_leaderboard gain a `tier` column.
-- Link devices: one device makes a 6-character code (10 minutes); entering it on another device moves that
--   device's history onto the first device's id, and the second device adopts that id from then on.

-- ---------- XP + tier ----------
create or replace function public.sh_tier(p_xp integer) returns integer language sql immutable as $$
  select case when p_xp >= 12000 then 6 when p_xp >= 6000 then 5 when p_xp >= 3000 then 4
              when p_xp >= 1500 then 3 when p_xp >= 600 then 2 when p_xp >= 150 then 1 else 0 end;
$$;
create or replace function public.sh_tier_floor(p_tier integer) returns integer language sql immutable as $$
  select (array[0, 150, 600, 1500, 3000, 6000, 12000])[least(greatest(p_tier, 0), 6) + 1];
$$;

create or replace function public.sh_visitor_xp(p_visitor text default null)
returns table(visitor_id text, xp integer, days integer, answers integer, correct integer)
language sql stable security definer set search_path = public as $$
  with pa as (
    select a.visitor_id, a.correct, (a.answered_at at time zone 'America/Chicago')::date as d,
      row_number() over (partition by a.visitor_id, a.hub, a.qid, a.correct order by a.answered_at) as rn
    from personal_answers a where p_visitor is null or a.visitor_id = p_visitor
  ), per_day as (
    select pa.visitor_id, pa.d, count(*) as n, count(*) filter (where pa.correct) as c,
      sum(case when pa.correct and pa.rn = 1 then 10 when pa.correct then 2 else 1 end) as raw
    from pa group by 1, 2
  )
  select per_day.visitor_id, sum(least(raw, 600) + 20)::int, count(*)::int, sum(n)::int, sum(c)::int
  from per_day group by 1;
$$;
revoke all on function public.sh_visitor_xp(text) from public, anon, authenticated;

-- ---------- achievements a browser reports ----------
create table if not exists public.achievements (
  visitor_id text not null,
  kind text not null,
  hub text not null default '',
  created_at timestamptz not null default now(),
  primary key (visitor_id, kind, hub)
);
alter table public.achievements enable row level security;

create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown') then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;

-- per-hub count of questions whose latest attempt was right (the client divides by the bank size)
create or replace function public.get_hub_mastery(p_visitor text)
returns table(hub text, latest_correct integer, seen integer)
language sql stable security definer set search_path = public as $$
  select l.hub, count(*) filter (where l.correct)::int, count(*)::int from (
    select distinct on (a.hub, a.qid) a.hub, a.qid, a.correct from personal_answers a
    where a.visitor_id = p_visitor order by a.hub, a.qid, a.answered_at desc
  ) l group by l.hub;
$$;

-- ---------- one visitor's rank card + trophy case ----------
create or replace function public.get_rank_profile(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare x record; t int; pos int; everyone int; best_days int; best_run int; fairies int; goldens int; arcade int; badges text[] := '{}'; ach record;
begin
  select * into x from sh_visitor_xp(p_visitor) limit 1;
  if x.visitor_id is null then
    return jsonb_build_object('xp', 0, 'tier', 0, 'tier_at', 0, 'next_at', sh_tier_floor(1), 'answers', 0, 'correct', 0, 'days', 0, 'badges', '[]'::jsonb);
  end if;
  t := sh_tier(x.xp);
  select count(*) + 1 into pos from sh_visitor_xp(null) o where o.xp > x.xp;
  select count(*) into everyone from sh_visitor_xp(null);
  -- longest run of consecutive study days
  select coalesce(max(len), 0) into best_days from (
    select count(*) as len from (
      select d, d - (row_number() over (order by d))::int as grp from (
        select distinct (answered_at at time zone 'America/Chicago')::date as d from personal_answers where visitor_id = p_visitor) dd
    ) i group by grp) s;
  select coalesce(max(best_streak), 0) into best_run from correct_streaks where visitor_id = p_visitor;
  select count(*) filter (where kind = 'fairy'), count(*) filter (where kind = 'golden') into fairies, goldens from egg_events where visitor_id = p_visitor;
  select count(*) into arcade from arcade_scores where visitor_id = p_visitor;

  if x.answers >= 100 then badges := array_append(badges, 'answers-100'); end if;
  if x.answers >= 1000 then badges := array_append(badges, 'answers-1000'); end if;
  if best_days >= 7 then badges := array_append(badges, 'days-7'); end if;
  if best_days >= 30 then badges := array_append(badges, 'days-30'); end if;
  if best_run >= 25 then badges := array_append(badges, 'run-25'); end if;
  if best_run >= 100 then badges := array_append(badges, 'run-100'); end if;
  if goldens > 0 then badges := array_append(badges, 'golden'); end if;
  if fairies > 0 then badges := array_append(badges, 'fairy'); end if;
  if fairies >= 5 then badges := array_append(badges, 'fairy-5'); end if;
  if arcade >= 25 then badges := array_append(badges, 'arcade-25'); end if;
  for ach in select kind, hub from achievements where visitor_id = p_visitor order by created_at loop
    badges := array_append(badges, ach.kind || case when ach.hub <> '' then ':' || ach.hub else '' end);
  end loop;

  return jsonb_build_object('xp', x.xp, 'tier', t, 'tier_at', sh_tier_floor(t), 'next_at', case when t < 6 then sh_tier_floor(t + 1) end,
    'answers', x.answers, 'correct', x.correct, 'days', x.days, 'best_days', best_days, 'best_run', best_run,
    'position', pos, 'of', everyone, 'badges', to_jsonb(badges));
end;
$$;

-- public board: top ranks by XP
create or replace function public.get_rank_board(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, tier integer, is_me boolean)
language sql stable security definer set search_path = public as $$
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from sh_visitor_xp(null) v)
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.xp, sh_tier(r.xp), (p_visitor is not null and r.visitor_id = p_visitor)
  from r left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk;
$$;

-- ---------- existing leaderboards gain a tier column ----------
drop function if exists public.get_leaderboard(integer);
create function public.get_leaderboard(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, tier integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with days as (
    select visitor_id, (answered_at at time zone 'America/Chicago')::date as d
    from personal_answers group by visitor_id, (answered_at at time zone 'America/Chicago')::date
  ), islands as (
    select visitor_id, d, d - (row_number() over (partition by visitor_id order by d))::int as grp from days
  ), streaks as (
    select visitor_id, count(*)::int as len, max(d) as last_day from islands group by visitor_id, grp
  ), current_streaks as (
    select visitor_id, max(len) as streak from streaks
    where last_day >= (now() at time zone 'America/Chicago')::date - 1 group by visitor_id
  ), totals as (
    select visitor_id, count(*)::int as total_answered from personal_answers group by visitor_id
  )
  select coalesce(vn.display_name, anon_name(cs.visitor_id)), cs.streak, coalesce(t.total_answered, 0), sh_tier(coalesce(x.xp, 0))
  from current_streaks cs
  left join visitor_names vn on vn.visitor_id = cs.visitor_id
  left join totals t on t.visitor_id = cs.visitor_id
  left join sh_visitor_xp(null) x on x.visitor_id = cs.visitor_id
  where cs.streak >= 2
  order by cs.streak desc, 3 desc
  limit p_limit;
end;
$$;

drop function if exists public.get_correct_streak_stats();
create function public.get_correct_streak_stats()
returns table(kind text, display_name text, streak integer, tier integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  (select 'active'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.current_streak, sh_tier(coalesce(x.xp, 0))
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.current_streak > 0 order by s.current_streak desc limit 1)
  union all
  (select 'record'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.best_streak, sh_tier(coalesce(x.xp, 0))
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.best_streak > 0 order by s.best_streak desc limit 1);
end;
$$;

drop function if exists public.get_arcade_leaderboard(text, text, text, integer);
create function public.get_arcade_leaderboard(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, tier integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays from arcade_scores a
    where a.hub = coalesce(p_hub, '') and a.game = p_game group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.best, r.plays,
         (p_visitor is not null and r.visitor_id = p_visitor), sh_tier(coalesce(x.xp, 0))
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join sh_visitor_xp(r.visitor_id) x on true
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;

-- ---------- link my devices ----------
create table if not exists public.link_codes (
  code text primary key,
  visitor_id text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.link_attempts (
  visitor_id text not null,
  tried_at timestamptz not null default now()
);
create table if not exists public.visitor_links (
  alias_id text primary key,
  primary_id text not null,
  linked_at timestamptz not null default now()
);
alter table public.link_codes enable row level security;
alter table public.link_attempts enable row level security;
alter table public.visitor_links enable row level security;

create or replace function public.create_link_code(p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
declare c text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return null; end if;
  delete from link_codes where visitor_id = p_visitor or created_at < now() - interval '10 minutes';
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    begin
      insert into link_codes (code, visitor_id) values (c, p_visitor);
      return c;
    exception when unique_violation then -- try another
    end;
  end loop;
end;
$$;

-- returns the id this device should use from now on, or null for a wrong/expired code
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
  update activity_pings set visitor_id = p where visitor_id = p_visitor;
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
  -- keep a chosen name if the first device had none
  insert into visitor_names (visitor_id, display_name, updated_at) select p, display_name, updated_at from visitor_names where visitor_id = p_visitor
    on conflict (visitor_id) do nothing;
  delete from visitor_names where visitor_id = p_visitor;
  update visitor_links set primary_id = p where primary_id = p_visitor;
  insert into visitor_links (alias_id, primary_id) values (p_visitor, p) on conflict (alias_id) do update set primary_id = excluded.primary_id, linked_at = now();
  return p;
end;
$$;

-- ============================================================================
-- steeper rank scale with levels I-III (migration_v16; replaces v15's sh_tier, sh_tier_floor, get_rank_profile, get_rank_board)
-- ============================================================================
-- At v15's scale a daily studier (~500 XP/day) passed Dark Matter's 12,000 in about five weeks. New tier floors:
--   Antique 0, Stone 300, Bronze 1,500, Silver 5,000, Gold 12,000, Diamond 25,000, Dark Matter 50,000,
-- each split into thirds (Dark Matter: 50k / 75k / 100k). XP itself is unchanged.

create or replace function public.sh_tier(p_xp integer) returns integer language sql immutable as $$
  select case when p_xp >= 50000 then 6 when p_xp >= 25000 then 5 when p_xp >= 12000 then 4
              when p_xp >= 5000 then 3 when p_xp >= 1500 then 2 when p_xp >= 300 then 1 else 0 end;
$$;
create or replace function public.sh_tier_floor(p_tier integer) returns integer language sql immutable as $$
  select (array[0, 300, 1500, 5000, 12000, 25000, 50000, 125000])[least(greatest(p_tier, 0), 7) + 1];
$$;
-- 0-based step on the 21-step ladder (tier * 3 + level - 1)
create or replace function public.sh_step(p_xp integer) returns integer language sql immutable as $$
  select t * 3 + least(2, floor((greatest(p_xp, 0) - sh_tier_floor(t))::numeric * 3 / (sh_tier_floor(t + 1) - sh_tier_floor(t)))::int)
  from (select sh_tier(p_xp) as t) s;
$$;
create or replace function public.sh_step_floor(p_step integer) returns integer language sql immutable as $$
  select sh_tier_floor(t) + ((sh_tier_floor(t + 1) - sh_tier_floor(t)) * (p_step - t * 3)) / 3
  from (select least(greatest(p_step, 0), 20) / 3 as t) s;
$$;

create or replace function public.get_rank_profile(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare x record; t int; st int; pos int; everyone int; best_days int; best_run int; fairies int; goldens int; arcade int; badges text[] := '{}'; ach record;
begin
  select * into x from sh_visitor_xp(p_visitor) limit 1;
  if x.visitor_id is null then
    return jsonb_build_object('xp', 0, 'tier', 0, 'level', 1, 'step', 0, 'step_at', 0, 'next_at', sh_step_floor(1), 'answers', 0, 'correct', 0, 'days', 0, 'badges', '[]'::jsonb);
  end if;
  t := sh_tier(x.xp); st := sh_step(x.xp);
  select count(*) + 1 into pos from sh_visitor_xp(null) o where o.xp > x.xp;
  select count(*) into everyone from sh_visitor_xp(null);
  select coalesce(max(len), 0) into best_days from (
    select count(*) as len from (
      select d, d - (row_number() over (order by d))::int as grp from (
        select distinct (answered_at at time zone 'America/Chicago')::date as d from personal_answers where visitor_id = p_visitor) dd
    ) i group by grp) s;
  select coalesce(max(best_streak), 0) into best_run from correct_streaks where visitor_id = p_visitor;
  select count(*) filter (where kind = 'fairy'), count(*) filter (where kind = 'golden') into fairies, goldens from egg_events where visitor_id = p_visitor;
  select count(*) into arcade from arcade_scores where visitor_id = p_visitor;

  if x.answers >= 100 then badges := array_append(badges, 'answers-100'); end if;
  if x.answers >= 1000 then badges := array_append(badges, 'answers-1000'); end if;
  if best_days >= 7 then badges := array_append(badges, 'days-7'); end if;
  if best_days >= 30 then badges := array_append(badges, 'days-30'); end if;
  if best_run >= 25 then badges := array_append(badges, 'run-25'); end if;
  if best_run >= 100 then badges := array_append(badges, 'run-100'); end if;
  if goldens > 0 then badges := array_append(badges, 'golden'); end if;
  if fairies > 0 then badges := array_append(badges, 'fairy'); end if;
  if fairies >= 5 then badges := array_append(badges, 'fairy-5'); end if;
  if arcade >= 25 then badges := array_append(badges, 'arcade-25'); end if;
  for ach in select kind, hub from achievements where visitor_id = p_visitor order by created_at loop
    badges := array_append(badges, ach.kind || case when ach.hub <> '' then ':' || ach.hub else '' end);
  end loop;

  return jsonb_build_object('xp', x.xp, 'tier', t, 'level', st - t * 3 + 1, 'step', st,
    'step_at', sh_step_floor(st), 'next_at', case when st < 20 then sh_step_floor(st + 1) end,
    'tier_at', sh_tier_floor(t), 'answers', x.answers, 'correct', x.correct, 'days', x.days, 'best_days', best_days, 'best_run', best_run,
    'position', pos, 'of', everyone, 'badges', to_jsonb(badges));
end;
$$;

drop function if exists public.get_rank_board(text, integer);
create function public.get_rank_board(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, tier integer, level integer, is_me boolean)
language sql stable security definer set search_path = public as $$
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from sh_visitor_xp(null) v)
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.xp, sh_tier(r.xp), sh_step(r.xp) - sh_tier(r.xp) * 3 + 1,
    (p_visitor is not null and r.visitor_id = p_visitor)
  from r left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk;
$$;

-- ============================================================================
-- more secret trophies (migration_v17; replaces record_achievement)
-- ============================================================================
-- konami (Konami code / swipe code), floss (typed "floss"), prof (a professor's quote from tapping their name)
create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'konami', 'floss', 'prof',
                    'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown') then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;

-- ============================================================================
-- leaderboards return the rank level (migration_v18; replaces the three leaderboard functions)
-- ============================================================================
drop function if exists public.get_leaderboard(integer);
create function public.get_leaderboard(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, tier integer, level integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with days as (
    select visitor_id, (answered_at at time zone 'America/Chicago')::date as d
    from personal_answers group by visitor_id, (answered_at at time zone 'America/Chicago')::date
  ), islands as (
    select visitor_id, d, d - (row_number() over (partition by visitor_id order by d))::int as grp from days
  ), streaks as (
    select visitor_id, count(*)::int as len, max(d) as last_day from islands group by visitor_id, grp
  ), current_streaks as (
    select visitor_id, max(len) as streak from streaks
    where last_day >= (now() at time zone 'America/Chicago')::date - 1 group by visitor_id
  ), totals as (
    select visitor_id, count(*)::int as total_answered from personal_answers group by visitor_id
  )
  select coalesce(vn.display_name, anon_name(cs.visitor_id)), cs.streak, coalesce(t.total_answered, 0),
    sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1
  from current_streaks cs
  left join visitor_names vn on vn.visitor_id = cs.visitor_id
  left join totals t on t.visitor_id = cs.visitor_id
  left join sh_visitor_xp(null) x on x.visitor_id = cs.visitor_id
  where cs.streak >= 2
  order by cs.streak desc, 3 desc
  limit p_limit;
end;
$$;

drop function if exists public.get_correct_streak_stats();
create function public.get_correct_streak_stats()
returns table(kind text, display_name text, streak integer, tier integer, level integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  (select 'active'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.current_streak,
     sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.current_streak > 0 order by s.current_streak desc limit 1)
  union all
  (select 'record'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.best_streak,
     sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.best_streak > 0 order by s.best_streak desc limit 1);
end;
$$;

drop function if exists public.get_arcade_leaderboard(text, text, text, integer);
create function public.get_arcade_leaderboard(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, tier integer, level integer)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays from arcade_scores a
    where a.hub = coalesce(p_hub, '') and a.game = p_game group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.best, r.plays,
         (p_visitor is not null and r.visitor_id = p_visitor),
         sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join sh_visitor_xp(r.visitor_id) x on true
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;
