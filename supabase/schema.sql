-- ============================================================================
-- study-hubs Supabase schema snapshot (project thytmzsgymydbzcqdnix)
-- Generated 2026-09-25 from the live database, after migration_v12.
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
