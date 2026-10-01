-- ============================================================================
-- study-hubs Supabase schema snapshot (project thytmzsgymydbzcqdnix)
-- Generated 2026-09-25 from the live database, after migration_v22.
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
  created_at timestamptz not null default now(),
  visitor_id text,
  reply text,
  resolved_at timestamptz,
  reply_seen_at timestamptz
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
  resolved boolean not null default false,
  visitor_id text,
  reply text,
  resolved_at timestamptz,
  reply_seen_at timestamptz
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
create policy "anon can insert suggestions"  on public.hub_suggestions  for insert to public
  with check (resolved = false and reply is null and resolved_at is null and reply_seen_at is null
              and (visitor_id is null or length(visitor_id) between 1 and 80));
create policy "public read modes"            on public.mode_stats       for select to public using (true);
create policy "public read presence_hourly"  on public.presence_hourly  for select to public using (true);
create policy "public read question_choices" on public.question_choices for select to public using (true);
create policy "public insert question_flags" on public.question_flags   for insert to public
  with check (resolved = false and reply is null and resolved_at is null and reply_seen_at is null
              and (visitor_id is null or length(visitor_id) between 1 and 80));
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

-- select-all questions: one pick per ticked option (migration_v28)
create or replace function public.record_choices(p_hub text, p_qid text, p_choices integer[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or p_qid is null or p_choices is null
     or cardinality(p_choices) = 0 or cardinality(p_choices) > 10 then return; end if;
  insert into question_choices (hub, qid, choice, picks)
  select p_hub, p_qid, c, 1 from (select distinct unnest(p_choices) c) x where c between 0 and 9
  on conflict (hub, qid, choice) do update set picks = question_choices.picks + 1;
end;
$$;

grant execute on function public.record_choices(text, text, integer[]) to anon, authenticated;

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
returns table(kind text, id bigint, hub text, note text, resolved boolean, created_at timestamptz,
              reply text, resolved_at timestamptz, can_notify boolean, reply_seen_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select 'flag'::text, f.id, f.hub, f.note, f.resolved, f.created_at, f.reply, f.resolved_at, f.visitor_id is not null, f.reply_seen_at
    from question_flags f
  union all
  select 'suggestion'::text, s.id, s.hub, s.note, s.resolved, s.created_at, s.reply, s.resolved_at, s.visitor_id is not null, s.reply_seen_at
    from hub_suggestions s
  order by 6 desc;
end;
$$;

create or replace function public.set_report_resolved(p_secret text, p_kind text, p_id bigint, p_resolved boolean, p_reply text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r text := nullif(left(trim(coalesce(p_reply, '')), 1500), '');
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_kind = 'flag' then
    update question_flags set resolved = p_resolved, reply = coalesce(r, reply),
      resolved_at = case when p_resolved then now() end, reply_seen_at = null where id = p_id;
  elsif p_kind = 'suggestion' then
    update hub_suggestions set resolved = p_resolved, reply = coalesce(r, reply),
      resolved_at = case when p_resolved then now() end, reply_seen_at = null where id = p_id;
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

-- a visitor can drop their custom name and go back to the generated one (migration_v19)
create or replace function public.clear_display_name(p_visitor text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return null; end if;
  delete from visitor_names where visitor_id = p_visitor;
  return anon_name(p_visitor);
end;
$$;

-- hub recap for the admin Recap tab (migration_v20)

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
  secs as (select split_part(coalesce(section, ''), '/', 1) as mode, section, count(*) * 25 / 60.0 as minutes from p group by 1, 2)
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
    'fairies', (select count(*) from egg_events where hub = p_hub and kind = 'fairy')
  ) into r;
  return r;
end;
$$;

-- saved mock exam scores + recap awards (migration_v21; replaces get_hub_recap)
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

-- published hub recaps for the dashboard slideshow (migration_v22)
create table if not exists public.hub_recaps (
  hub text primary key,
  title text not null,
  color text,
  data jsonb not null,
  question jsonb,
  names boolean not null default true,
  footnote text,
  published_at timestamptz not null default now()
);
alter table public.hub_recaps enable row level security;

create or replace function public.admin_publish_recap(p_secret text, p_hub text, p_title text, p_color text, p_data jsonb,
  p_question jsonb, p_names boolean, p_footnote text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'not allowed'; end if;
  if p_hub is null or length(p_hub) > 40 or p_data is null or length(p_data::text) > 200000 then raise exception 'bad recap'; end if;
  insert into hub_recaps (hub, title, color, data, question, names, footnote, published_at)
  values (p_hub, left(coalesce(nullif(trim(p_title), ''), p_hub), 60), left(p_color, 16), p_data, p_question, coalesce(p_names, true), left(p_footnote, 300), now())
  on conflict (hub) do update set title = excluded.title, color = excluded.color, data = excluded.data, question = excluded.question,
    names = excluded.names, footnote = excluded.footnote, published_at = now();
end;
$$;

create or replace function public.admin_unpublish_recap(p_secret text, p_hub text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'not allowed'; end if;
  delete from hub_recaps where hub = p_hub;
end;
$$;

create or replace function public.get_published_recaps()
returns table(hub text, title text, color text, data jsonb, question jsonb, names boolean, footnote text, published_at timestamptz)
language sql stable security definer set search_path = public as $$
  select hub, title, color, data, question, names, footnote, published_at from hub_recaps
  order by coalesce((data->>'exam_day')::date, published_at::date) desc, published_at desc;
$$;

-- ============================================================================
-- exam check-ins + search terms (migration_v23, v24)
-- ============================================================================
create table if not exists public.exam_debriefs (
  id bigint generated always as identity primary key,
  hub text not null,
  exam text not null,                 -- 'YYYY-MM-DD <label>', e.g. '2026-10-01 Midterm'
  visitor_id text not null,
  answers jsonb,                      -- {ready: 1-5, went: text, match: text, missed: text}; null = no thanks
  created_at timestamptz not null default now()
);
create index if not exists exam_debriefs_who_idx on public.exam_debriefs (hub, exam, visitor_id);
alter table public.exam_debriefs enable row level security;

-- (migration_v24: several per person, up to 10 per exam, 90 days)
create or replace function public.submit_exam_debrief(p_hub text, p_exam text, p_visitor text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or length(p_hub) not between 1 and 40 then return false; end if;
  if p_exam is null or p_exam !~ '^\d{4}-\d{2}-\d{2}' or length(p_exam) > 60 then return false; end if;
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' or p_answers = '{}'::jsonb or length(p_answers::text) > 3000 then return false; end if;
  -- only for an exam that has happened (exam day counts), and not forever after
  if left(p_exam, 10)::date > (now() at time zone 'America/Chicago')::date
     or left(p_exam, 10)::date < (now() at time zone 'America/Chicago')::date - 90 then return false; end if;
  if (select count(*) from exam_debriefs where hub = p_hub and exam = p_exam and visitor_id = p_visitor) >= 10 then return false; end if;
  insert into exam_debriefs (hub, exam, visitor_id, answers) values (p_hub, p_exam, p_visitor, p_answers);
  return true;
exception when others then return false;
end;
$$;

create or replace function public.get_exam_debriefs(p_secret text)
returns table(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz,
              minutes bigint, answered bigint, accuracy numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select d.hub, d.exam, d.visitor_id, d.answers, d.created_at,
    (select count(*) * 25 / 60 from activity_pings p where p.hub = d.hub and p.visitor_id = d.visitor_id)::bigint,
    (select count(*) from personal_answers a where a.hub = d.hub and a.visitor_id = d.visitor_id)::bigint,
    (select round(avg(case when a.correct then 100 else 0 end), 0) from personal_answers a where a.hub = d.hub and a.visitor_id = d.visitor_id)
  from exam_debriefs d order by d.created_at desc limit 2000;
end;
$$;

-- ---------- search terms ----------
create table if not exists public.search_terms (
  day date not null default (now() at time zone 'America/Chicago')::date,
  hub text not null,
  term text not null,
  searches integer not null default 0,
  hits integer not null default 0,    -- results found the last time this term was searched
  primary key (day, hub, term)
);
alter table public.search_terms enable row level security;

create or replace function public.record_search(p_hub text, p_term text, p_hits integer)
returns void language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if p_hub is null or length(p_hub) > 40 then return; end if;
  t := lower(regexp_replace(trim(coalesce(p_term, '')), '\s+', ' ', 'g'));
  if length(t) not between 2 and 60 then return; end if;
  insert into search_terms (hub, term, searches, hits) values (p_hub, t, 1, greatest(0, least(coalesce(p_hits, 0), 100000)))
    on conflict (day, hub, term) do update set searches = least(search_terms.searches + 1, 1000000), hits = excluded.hits;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;

create or replace function public.get_search_terms(p_secret text, p_days integer default 30)
returns table(hub text, term text, searches bigint, hits integer, last_day date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select s.hub, s.term, sum(s.searches)::bigint, (array_agg(s.hits order by s.day desc))[1], max(s.day)
  from search_terms s
  where s.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 365))
  group by s.hub, s.term order by 3 desc limit 1000;
end;
$$;

-- ---------------------------------------------------------------- report replies + notices (v25)
-- ---------- student side (public) ----------
-- Resolved reports/suggestions of this visitor not yet shown, from the last 60 days.
create or replace function public.get_my_replies(p_visitor text)
returns table(kind text, id bigint, hub text, note text, reply text, resolved_at timestamptz)
language sql stable security definer set search_path = public as $$
  select * from (
    select 'flag'::text, f.id, f.hub, f.note, f.reply, f.resolved_at from question_flags f
     where p_visitor is not null and f.visitor_id = p_visitor and f.resolved and f.reply_seen_at is null
       and f.resolved_at > now() - interval '60 days'
    union all
    select 'suggestion'::text, s.id, s.hub, s.note, s.reply, s.resolved_at from hub_suggestions s
     where p_visitor is not null and s.visitor_id = p_visitor and s.resolved and s.reply_seen_at is null
       and s.resolved_at > now() - interval '60 days'
  ) r order by 6 limit 10;
$$;

create or replace function public.mark_reply_seen(p_visitor text, p_kind text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null then return; end if;
  if p_kind = 'flag' then
    update question_flags set reply_seen_at = now() where id = p_id and visitor_id = p_visitor and reply_seen_at is null;
  elsif p_kind = 'suggestion' then
    update hub_suggestions set reply_seen_at = now() where id = p_id and visitor_id = p_visitor and reply_seen_at is null;
  end if;
exception when others then return;
end;
$$;
grant execute on function public.get_my_replies(text) to anon, authenticated;
grant execute on function public.mark_reply_seen(text, text, bigint) to anon, authenticated;

-- ---------- notices to everyone ----------
-- For a fix worth telling the whole class about (Sam, 2026-09-29: "for this instance, push a notification to everyone").
-- widget/replies.js shows each live notice once per device (localStorage sh_notice_seen), on the hubs and the dashboard;
-- hub = null means everywhere, otherwise only on that hub's page and the dashboard.
create table if not exists public.site_notices (
  id bigint generated always as identity primary key,
  hub text,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);
alter table public.site_notices enable row level security;

create or replace function public.get_notices()
returns table(id bigint, hub text, title text, message text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select n.id, n.hub, n.title, n.message, n.created_at from site_notices n
   where n.expires_at > now() order by n.created_at limit 5;
$$;
grant execute on function public.get_notices() to anon, authenticated;

create or replace function public.admin_post_notice(p_secret text, p_hub text, p_title text, p_message text, p_days integer default 14)
returns bigint language plpgsql security definer set search_path = public as $$
declare nid bigint;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_message), '') = '' then raise exception 'title and message required'; end if;
  insert into site_notices (hub, title, message, expires_at)
  values (nullif(trim(coalesce(p_hub, '')), ''), left(trim(p_title), 120), left(trim(p_message), 1500),
          now() + make_interval(days => greatest(1, least(coalesce(p_days, 14), 60))))
  returning id into nid;
  return nid;
end;
$$;

-- ---------------------------------------------------------------- inbox (v26)
create or replace function public.get_my_inbox(p_visitor text)
returns table(kind text, id bigint, hub text, title text, note text, message text, at timestamptz,
              seen boolean, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select * from (
    select 'flag'::text, f.id, f.hub, null::text, f.note, f.reply, f.resolved_at, f.reply_seen_at is not null, null::timestamptz
      from question_flags f
     where p_visitor is not null and f.visitor_id = p_visitor and f.resolved and f.resolved_at > now() - interval '90 days'
    union all
    select 'suggestion'::text, s.id, s.hub, null::text, s.note, s.reply, s.resolved_at, s.reply_seen_at is not null, null::timestamptz
      from hub_suggestions s
     where p_visitor is not null and s.visitor_id = p_visitor and s.resolved and s.resolved_at > now() - interval '90 days'
    union all
    select 'notice'::text, n.id, n.hub, n.title, null::text, n.message, n.created_at, false, n.expires_at
      from site_notices n
     where n.created_at > now() - interval '60 days'
  ) r order by 7 desc limit 60;
$$;
grant execute on function public.get_my_inbox(text) to anon, authenticated;

-- ---------- migration_v27: exam-day luck (dashboard) ----------
create table if not exists public.exam_luck (
  hub text not null,
  exam_date date not null,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (hub, exam_date, visitor_id)
);
alter table public.exam_luck enable row level security;

create or replace function public.get_exam_luck(p_hub text, p_date date, p_visitor text default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'count', (select count(*)::int from exam_luck where hub = p_hub and exam_date = p_date),
    'mine', exists (select 1 from exam_luck where hub = p_hub and exam_date = p_date and p_visitor is not null and visitor_id = p_visitor),
    'recent', coalesce((select jsonb_agg(n) from (
        select coalesce(vn.display_name, anon_name(l.visitor_id)) as n
          from exam_luck l left join visitor_names vn on vn.visitor_id = l.visitor_id
         where l.hub = p_hub and l.exam_date = p_date
         order by l.created_at desc limit 5) r), '[]'::jsonb)
  );
$$;

create or replace function public.send_exam_luck(p_visitor text, p_hub text, p_date date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'America/Chicago')::date;
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80
     or p_hub is null or length(p_hub) > 40 or p_date is null then
    return get_exam_luck(p_hub, p_date, p_visitor);
  end if;
  -- only around a real exam day (the dashboard offers it the day before and the morning of)
  if p_date between today and today + 2 then
    insert into exam_luck (hub, exam_date, visitor_id) values (p_hub, p_date, p_visitor) on conflict do nothing;
  end if;
  return get_exam_luck(p_hub, p_date, p_visitor);
end;
$$;

grant execute on function public.get_exam_luck(text, date, text) to anon, authenticated;
grant execute on function public.send_exam_luck(text, text, date) to anon, authenticated;

-- ============================================================================
-- migration_v31 (2026-10-01): mastery flair, Cavity Search, new trophies, Timmy Tooth health history
-- ============================================================================
-- migration_v31 (2026-10-01): mastery flair on the leaderboards, new easter eggs (Cavity Search, Full Arch, mirror,
-- floss chain, holiday words) and the tooth buddy's health history.
--
-- Mastery flair: every hub mastery tier someone has reached (mastery-bronze/silver/gold/crown achievements, recorded by
-- widget/ranks.js) comes back as a short text, "perio:3,msk-exam3:1" (1 bronze, 2 silver, 3 gold, 4 crown), best first.
-- The leaderboards gain a `flair` column for it (dropped + recreated, the same way v18 added `level`).

create or replace function public.sh_mastery_flair(p_visitor text)
returns text language sql stable security definer set search_path = public as $
  select string_agg(s.hub || ':' || s.lvl, ',' order by s.lvl desc, s.hub)
  from (
    select a.hub, max(case a.kind when 'mastery-crown' then 4 when 'mastery-gold' then 3
                                  when 'mastery-silver' then 2 when 'mastery-bronze' then 1 end) as lvl
    from achievements a
    where a.visitor_id = p_visitor and a.kind like 'mastery-%' and a.hub <> ''
    group by a.hub
  ) s;
$;

drop function if exists public.get_leaderboard(integer);
create function public.get_leaderboard(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, tier integer, level integer, flair text)
language plpgsql security definer set search_path = public as $
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
    sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1,
    sh_mastery_flair(cs.visitor_id)
  from current_streaks cs
  left join visitor_names vn on vn.visitor_id = cs.visitor_id
  left join totals t on t.visitor_id = cs.visitor_id
  left join sh_visitor_xp(null) x on x.visitor_id = cs.visitor_id
  where cs.streak >= 2
  order by cs.streak desc, 3 desc
  limit p_limit;
end;
$;

drop function if exists public.get_correct_streak_stats();
create function public.get_correct_streak_stats()
returns table(kind text, display_name text, streak integer, tier integer, level integer, flair text)
language plpgsql security definer set search_path = public as $
begin
  return query
  (select 'active'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.current_streak,
     sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1, sh_mastery_flair(s.visitor_id)
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.current_streak > 0 order by s.current_streak desc limit 1)
  union all
  (select 'record'::text, coalesce(vn.display_name, anon_name(s.visitor_id)), s.best_streak,
     sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1, sh_mastery_flair(s.visitor_id)
   from correct_streaks s left join visitor_names vn on vn.visitor_id = s.visitor_id left join sh_visitor_xp(s.visitor_id) x on true
   where s.best_streak > 0 order by s.best_streak desc limit 1);
end;
$;

drop function if exists public.get_arcade_leaderboard(text, text, text, integer);
create function public.get_arcade_leaderboard(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, tier integer, level integer, flair text)
language plpgsql security definer set search_path = public as $
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
         sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1,
         sh_mastery_flair(r.visitor_id)
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join sh_visitor_xp(r.visitor_id) x on true
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$;

drop function if exists public.get_rank_board(text, integer);
create function public.get_rank_board(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, tier integer, level integer, is_me boolean, flair text)
language sql stable security definer set search_path = public as $
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from sh_visitor_xp(null) v)
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.xp, sh_tier(r.xp), sh_step(r.xp) - sh_tier(r.xp) * 3 + 1,
    (p_visitor is not null and r.visitor_id = p_visitor), sh_mastery_flair(r.visitor_id)
  from r left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk;
$;

drop function if exists public.get_fairy_board(integer);
create function public.get_fairy_board(p_limit integer default 5)
returns table(display_name text, catches integer, flair text)
language sql stable security definer set search_path = public as $
  select coalesce(vn.display_name, anon_name(e.visitor_id)), count(*)::int, sh_mastery_flair(e.visitor_id)
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'fairy'
  group by e.visitor_id, vn.display_name
  order by count(*) desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$;

-- new trophies: mirror (Indirect Vision), fullarch (Full Arch), flosschain (Floss Chain), cavity (Restorative),
-- holiday (Holiday Spirit; hub = the holiday id), pet-revive (Full Recovery), pet-perfect (Pearly Whites)
create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'konami', 'floss', 'prof',
                    'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown',
                    'mirror', 'fullarch', 'flosschain', 'holiday', 'pet-revive', 'pet-perfect') then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$;

-- Cavity Search: each week a tiny cavity hides in one hub's Lecture Notes; the first five people to tap it restore it.
-- p_week is the client's key for the week ("2026-W40"); one claim per person per hub-week.
create unique index if not exists egg_events_cavity_once on public.egg_events (hub, qid, visitor_id) where kind = 'cavity';

create or replace function public.claim_cavity(p_hub text, p_visitor text, p_week text)
returns integer language plpgsql security definer set search_path = public as $
declare n int; mine int;
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or p_hub is null or p_week !~ '^\d{4}-W\d{2} then return 0; end if;
  perform pg_advisory_xact_lock(hashtext('cavity|' || p_hub || '|' || p_week));
  select r into mine from (
    select visitor_id, row_number() over (order by created_at, id) as r from egg_events
    where kind = 'cavity' and hub = p_hub and qid = p_week) x where x.visitor_id = p_visitor;
  if mine is not null then return mine; end if;
  select count(*) into n from egg_events where kind = 'cavity' and hub = p_hub and qid = p_week;
  if n >= 5 then return 0; end if;
  insert into egg_events (kind, hub, visitor_id, qid) values ('cavity', p_hub, p_visitor, p_week);
  insert into achievements (visitor_id, kind, hub) values (p_visitor, 'cavity', p_hub) on conflict do nothing;
  return n + 1;
end;
$;

create or replace function public.get_cavity_week(p_hub text, p_week text)
returns table(display_name text, claimed_at timestamptz)
language sql stable security definer set search_path = public as $
  select coalesce(vn.display_name, anon_name(e.visitor_id)), e.created_at
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'cavity' and e.hub = p_hub and e.qid = p_week
  order by e.created_at, e.id
  limit 5;
$;

-- Tooth buddy: one row per Central-time day with answers in any hub, last 70 days. The client turns this into HP.
create or replace function public.get_pet_days(p_visitor text)
returns table(d date, attempts integer, correct integer)
language sql stable security definer set search_path = public as $
  select (answered_at at time zone 'America/Chicago')::date, count(*)::int, count(*) filter (where correct)::int
  from personal_answers
  where visitor_id = p_visitor and answered_at > now() - interval '70 days'
  group by 1 order by 1;
$;

grant execute on function public.sh_mastery_flair(text) to anon, authenticated;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;
grant execute on function public.get_correct_streak_stats() to anon, authenticated;
grant execute on function public.get_arcade_leaderboard(text, text, text, integer) to anon, authenticated;
grant execute on function public.get_rank_board(text, integer) to anon, authenticated;
grant execute on function public.get_fairy_board(integer) to anon, authenticated;
grant execute on function public.claim_cavity(text, text, text) to anon, authenticated;
grant execute on function public.get_cavity_week(text, text) to anon, authenticated;
grant execute on function public.get_pet_days(text) to anon, authenticated;
