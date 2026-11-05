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
create index if not exists activity_pings_visitor_hub_idx on public.activity_pings (visitor_id, hub);
create index if not exists activity_pings_time_idx on public.activity_pings (pinged_at) include (hub, section, visitor_id);

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

-- migration_v34: read back your own answers (cross-device progress sync)
create or replace function public.get_my_answers(p_visitor text, p_hub text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(x.qid, x.t, x.c) order by x.t, x.id), '[]'::jsonb)
  from (
    select a.id, a.qid, floor(extract(epoch from a.answered_at))::bigint as t, case when a.correct then 1 else 0 end as c
    from personal_answers a
    where p_visitor is not null and length(p_visitor) between 1 and 80 and length(coalesce(p_hub, '')) between 1 and 40
      and a.visitor_id = p_visitor and a.hub = p_hub
    order by a.answered_at desc, a.id desc
    limit 5000
  ) x;
$$;

grant execute on function public.get_my_answers(text, text) to anon, authenticated;

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
    'flappy', 'crusher', 'probe', 'quadrants', 'perdle', 'planer', 'smile', 'sweeper', 'cross',  -- perio Pocket Arcade
    'board', 'cloze', 'escape'                                                                   -- shared games (widget/games.js, migration_v40)
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

-- migration_v48: checks the secret with sh_admin_ok(); the old `p_secret <> ...` check let a NULL secret through.
create or replace function public.admin_reset_changelog(p_secret text, p_entries jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare entry jsonb;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
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

create or replace function public.get_my_survey(p_visitor text)
returns table(id bigint, title text, questions jsonb, starts_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.title, s.questions, s.starts_at from surveys s
  where p_visitor is not null and s.active and s.starts_at <= now() and (s.ends_at is null or s.ends_at > now())
    and not exists (select 1 from survey_responses r where r.survey_id = s.id and r.visitor_id = p_visitor and r.answers is not null)
  order by s.starts_at desc limit 1;
$$;
grant execute on function public.get_my_survey(text) to anon, authenticated;

-- p_answers null = "later" (recorded so the pop-up isn't offered again; the survey stays in the Inbox until answered)
create or replace function public.submit_survey(p_survey bigint, p_visitor text, p_answers jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_answers is not null and (jsonb_typeof(p_answers) <> 'object' or length(p_answers::text) > 4000) then return false; end if;
  if not exists (select 1 from surveys where id = p_survey and active) then return false; end if;
  insert into survey_responses (survey_id, visitor_id, answers) values (p_survey, p_visitor, p_answers)
    on conflict (survey_id, visitor_id) do update set answers = excluded.answers, created_at = now()
    where survey_responses.answers is null and excluded.answers is not null;
  return found;
end;
$$;

create or replace function public.admin_upsert_survey(p_secret text, p_slug text, p_title text, p_questions jsonb,
  p_active boolean default false, p_ends_at timestamptz default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) not between 1 and 5 then
    raise exception 'questions must be an array of 1-5 items'; end if;
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
  with d as (select * from exam_debriefs e order by e.created_at desc limit 2000),
  who as (select distinct d.hub, d.visitor_id from d),
  t as (select w.hub, w.visitor_id, count(p.id) * 25 / 60 as minutes
        from who w left join activity_pings p on p.visitor_id = w.visitor_id and p.hub = w.hub
        group by w.hub, w.visitor_id),
  a as (select w.hub, w.visitor_id, count(pa.id) as answered,
               round(avg(case when pa.id is null then null when pa.correct then 100 else 0 end), 0) as accuracy
        from who w left join personal_answers pa on pa.visitor_id = w.visitor_id and pa.hub = w.hub
        group by w.hub, w.visitor_id)
  select d.hub, d.exam, d.visitor_id, d.answers, d.created_at,
    t.minutes::bigint, a.answered::bigint, a.accuracy
  from d
  join t on t.hub = d.hub and t.visitor_id = d.visitor_id
  join a on a.hub = d.hub and a.visitor_id = d.visitor_id
  order by d.created_at desc;
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
returns text language sql stable security definer set search_path = public as $$
  select string_agg(s.hub || ':' || s.lvl, ',' order by s.lvl desc, s.hub)
  from (
    select a.hub, max(case a.kind when 'mastery-crown' then 4 when 'mastery-gold' then 3
                                  when 'mastery-silver' then 2 when 'mastery-bronze' then 1 end) as lvl
    from achievements a
    where a.visitor_id = p_visitor and a.kind like 'mastery-%' and a.hub <> ''
    group by a.hub
  ) s;
$$;

drop function if exists public.get_leaderboard(integer);
create function public.get_leaderboard(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, tier integer, level integer, flair text)
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
$$;

drop function if exists public.get_correct_streak_stats();
create function public.get_correct_streak_stats()
returns table(kind text, display_name text, streak integer, tier integer, level integer, flair text)
language plpgsql security definer set search_path = public as $$
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
$$;

drop function if exists public.get_arcade_leaderboard(text, text, text, integer);
create function public.get_arcade_leaderboard(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, tier integer, level integer, flair text)
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
         sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1,
         sh_mastery_flair(r.visitor_id)
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join sh_visitor_xp(r.visitor_id) x on true
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;

drop function if exists public.get_rank_board(text, integer);
create function public.get_rank_board(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, tier integer, level integer, is_me boolean, flair text)
language sql stable security definer set search_path = public as $$
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from sh_visitor_xp(null) v)
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.xp, sh_tier(r.xp), sh_step(r.xp) - sh_tier(r.xp) * 3 + 1,
    (p_visitor is not null and r.visitor_id = p_visitor), sh_mastery_flair(r.visitor_id)
  from r left join visitor_names vn on vn.visitor_id = r.visitor_id
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk;
$$;

drop function if exists public.get_fairy_board(integer);
create function public.get_fairy_board(p_limit integer default 5)
returns table(display_name text, catches integer, flair text)
language sql stable security definer set search_path = public as $$
  select coalesce(vn.display_name, anon_name(e.visitor_id)), count(*)::int, sh_mastery_flair(e.visitor_id)
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'fairy'
  group by e.visitor_id, vn.display_name
  order by count(*) desc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

-- new trophies: mirror (Indirect Vision), fullarch (Full Arch), flosschain (Floss Chain), cavity (Restorative),
-- holiday (Holiday Spirit; hub = the holiday id), pet-revive (Full Recovery), pet-perfect (Pearly Whites)
create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'konami', 'floss', 'prof',
                    'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown',
                    'mirror', 'fullarch', 'flosschain', 'holiday', 'pet-revive', 'pet-perfect') then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;

-- Cavity Search: each week a tiny cavity hides in one hub's Lecture Notes; the first five people to tap it restore it.
-- p_week is the client's key for the week ("2026-W40"); one claim per person per hub-week.
create unique index if not exists egg_events_cavity_once on public.egg_events (hub, qid, visitor_id) where kind = 'cavity';

create or replace function public.claim_cavity(p_hub text, p_visitor text, p_week text)
returns integer language plpgsql security definer set search_path = public as $$
declare n int; mine int;
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or p_hub is null or p_week !~ '^\d{4}-W\d{2}$' then return 0; end if;
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
$$;

create or replace function public.get_cavity_week(p_hub text, p_week text)
returns table(display_name text, claimed_at timestamptz)
language sql stable security definer set search_path = public as $$
  select coalesce(vn.display_name, anon_name(e.visitor_id)), e.created_at
  from egg_events e left join visitor_names vn on vn.visitor_id = e.visitor_id
  where e.kind = 'cavity' and e.hub = p_hub and e.qid = p_week
  order by e.created_at, e.id
  limit 5;
$$;

-- Tooth buddy: one row per Central-time day with answers in any hub, last 70 days. The client turns this into HP.
create or replace function public.get_pet_days(p_visitor text)
returns table(d date, attempts integer, correct integer)
language sql stable security definer set search_path = public as $$
  select (answered_at at time zone 'America/Chicago')::date, count(*)::int, count(*) filter (where correct)::int
  from personal_answers
  where visitor_id = p_visitor and answered_at > now() - interval '70 days'
  group by 1 order by 1;
$$;

grant execute on function public.sh_mastery_flair(text) to anon, authenticated;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;
grant execute on function public.get_correct_streak_stats() to anon, authenticated;
grant execute on function public.get_arcade_leaderboard(text, text, text, integer) to anon, authenticated;
grant execute on function public.get_rank_board(text, integer) to anon, authenticated;
grant execute on function public.get_fairy_board(integer) to anon, authenticated;
grant execute on function public.claim_cavity(text, text, text) to anon, authenticated;
grant execute on function public.get_cavity_week(text, text) to anon, authenticated;
grant execute on function public.get_pet_days(text) to anon, authenticated;


-- ======================================================================
-- migration_v32 (2026-10-02): trophy unlock rates, Timmy adoption across devices
-- ======================================================================
-- migration_v32 (2026-10-02): trophy unlock rates for the trophy case, and Timmy Tooth's adoption follows you
-- across devices.
--
-- get_trophy_stats(): for every trophy, how many people have it, out of everyone who has answered at least one
-- question (the same "of N" as the rank card). The computed trophies use the same rules as get_rank_profile;
-- the rest are distinct people per kind in `achievements` (holiday/fullarch/cavity/mastery count once per person,
-- whatever the hub). Public, no names, one row per kind.

create or replace function public.get_trophy_stats()
returns table(kind text, n integer, total integer)
language sql stable security definer set search_path = public as $$
  with v as (select visitor_id, answers from sh_visitor_xp(null)),
  dd as (select distinct visitor_id, (answered_at at time zone 'America/Chicago')::date as d from personal_answers),
  isl as (select visitor_id, d - (row_number() over (partition by visitor_id order by d))::int as grp from dd),
  bd as (select visitor_id, max(len) as best_days from (select visitor_id, count(*) as len from isl group by visitor_id, grp) s group by visitor_id),
  br as (select visitor_id, max(best_streak) as best_run from correct_streaks group by visitor_id),
  eg as (select visitor_id, count(*) filter (where e.kind = 'fairy') as fairies, count(*) filter (where e.kind = 'golden') as goldens
         from egg_events e group by visitor_id),
  ar as (select visitor_id, count(*) as plays from arcade_scores group by visitor_id),
  comp as (
    select 'answers-100'::text as k, count(*) filter (where answers >= 100) as c from v
    union all select 'answers-1000', count(*) filter (where answers >= 1000) from v
    union all select 'days-7', count(*) filter (where best_days >= 7) from bd
    union all select 'days-30', count(*) filter (where best_days >= 30) from bd
    union all select 'run-25', count(*) filter (where best_run >= 25) from br
    union all select 'run-100', count(*) filter (where best_run >= 100) from br
    union all select 'golden', count(*) filter (where goldens > 0) from eg
    union all select 'fairy', count(*) filter (where fairies > 0) from eg
    union all select 'fairy-5', count(*) filter (where fairies >= 5) from eg
    union all select 'arcade-25', count(*) filter (where plays >= 25) from ar
    union all select a.kind, count(distinct a.visitor_id) from achievements a where a.kind <> 'pet-adopt' group by a.kind
  )
  select k, c::int, (select count(*) from v)::int from comp;
$$;
grant execute on function public.get_trophy_stats() to anon, authenticated;

-- 'pet-adopt' (not a trophy): recorded when you adopt Timmy Tooth, so a second device skips the introduction
-- (get_rank_profile returns it in `badges` like any achievement).
create or replace function public.record_achievement(p_visitor text, p_kind text, p_hub text default '')
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if p_kind not in ('boss', 'owl', 'rootcanal', 'mock90', 'konami', 'floss', 'prof',
                    'mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown',
                    'mirror', 'fullarch', 'flosschain', 'holiday', 'pet-revive', 'pet-perfect', 'pet-adopt',
                    'seen-all', 'mock-perfect') then return false; end if;  -- seen-all, mock-perfect: migration_v38
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;

-- ============================================================
-- migration_v33 (2026-10-03): nuke unlocks
-- ============================================================
-- migration_v33 (2026-10-03): record when someone unlocks a tactical nuke, not only when they launch one.
--
-- Until now the only record was nuke_launches, so "unlocked but never used" could only be guessed from
-- personal_answers (the in-page streak resets on reload, which the data doesn't show). widget/v3.js now calls
-- record_nuke_unlock the moment the badge appears (100 right in a row on one page load).
--
-- get_nuke_unlocks (admin): per hub, unlocks in the range and how many went unused. An unlock counts as used
-- when the same person launches in the same hub after it and before their next unlock there (launching resets
-- the streak, so each unlock is followed by at most one launch). Unlocks before today were not recorded.

create table if not exists public.nuke_unlocks (
  id bigint generated always as identity primary key,
  hub text not null default '',
  visitor_id text not null,
  unlocked_at timestamptz not null default now()
);
create index if not exists nuke_unlocks_unlocked_idx on public.nuke_unlocks (unlocked_at);
alter table public.nuke_unlocks enable row level security;

create or replace function public.record_nuke_unlock(p_hub text, p_visitor text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 or length(p_visitor) > 80 or length(coalesce(p_hub, '')) > 40 then return; end if;
  -- an unlock takes 100 answers, so two from one person in one hub within 5 minutes is a double fire
  if exists (select 1 from nuke_unlocks where visitor_id = p_visitor and hub = coalesce(p_hub, '')
             and unlocked_at > now() - interval '5 minutes') then return; end if;
  insert into nuke_unlocks (hub, visitor_id) values (coalesce(p_hub, ''), p_visitor);
end;
$$;
grant execute on function public.record_nuke_unlock(text, text) to anon, authenticated;

create or replace function public.get_nuke_unlocks(p_secret text, p_days integer default 30)
returns table(hub text, unlocks bigint, unused bigint, unlockers bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with u as (
    select n.hub, n.visitor_id, n.unlocked_at,
           lead(n.unlocked_at) over (partition by n.visitor_id, n.hub order by n.unlocked_at) as next_at
    from nuke_unlocks n
  ), m as (
    select u.hub, u.visitor_id, u.unlocked_at,
           exists (select 1 from nuke_launches l where l.visitor_id = u.visitor_id and l.hub = u.hub
                   and l.launched_at >= u.unlocked_at and (u.next_at is null or l.launched_at < u.next_at)) as used
    from u where u.unlocked_at >= now() - (p_days || ' days')::interval
  )
  select coalesce(nullif(m.hub, ''), '(unknown)'), count(*)::bigint, count(*) filter (where not m.used)::bigint,
         count(distinct m.visitor_id)::bigint
  from m group by coalesce(nullif(m.hub, ''), '(unknown)') order by 2 desc;
end;
$$;

-- ============================================================
-- migration_v37 (2026-10-20): feature events
-- ============================================================
-- migration_v37 (2026-10-20): feature events, for the things clicks and study time can't answer.
--
-- Clicks (ui_clicks) count button taps and activity_pings count time, but some questions had no data at all:
-- who typed TIMMY, who said "No thanks" to Timmy Tooth or turned him off later (Settings "Off" buttons all look the
-- same as clicks), how far people got in a podcast episode, how many minutes of lecture narration were heard, who
-- moved a diagram's slider or tapped its parts, and which settings people actually have on.
-- widget/clicks.js now also keeps a small counter per event kind (window.shTrack(kind, n)) and sends it with the
-- click batch to record_events: one row per day, page (hub or "dashboard"), kind and visitor, n summed.
-- Kinds are short lowercase names, e.g. "egg:timmy-start", "pet:no-thanks", "pref:pet=off", "pod:exam4-review:q2",
-- "tts:secs", "fig:sarcomere", "state:pet=dash" (a once-a-day snapshot of each visitor's settings) and "view".
-- Automated browsers send nothing (navigator.webdriver), same as clicks.
--
-- get_feature_events (admin): per page and kind, people and total n in the range. review/ -> Clicks shows it.

create table if not exists public.feature_events (
  day date not null default ((now() at time zone 'America/Chicago')::date),
  hub text not null,
  kind text not null,
  visitor_id text not null,
  n integer not null default 0,
  primary key (day, hub, kind, visitor_id)
);
create index if not exists feature_events_kind_idx on public.feature_events (kind, day);
alter table public.feature_events enable row level security;

create or replace function public.record_events(p_hub text, p_visitor text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; k text; n int; c int := 0;
begin
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' or p_visitor is null or length(p_visitor) not between 8 and 80
     or jsonb_typeof(p_items) is distinct from 'array' then return; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    c := c + 1; exit when c > 40;
    k := lower(coalesce(it->>'k', ''));
    continue when k !~ '^[a-z0-9][a-z0-9:=_.+-]{0,63}$';
    n := least(greatest(coalesce((it->>'n')::numeric, 1), 1), 3600)::int;  -- seconds of listening come in chunks
    insert into feature_events (hub, kind, visitor_id, n) values (p_hub, k, p_visitor, n)
      on conflict (day, hub, kind, visitor_id) do update set n = least(feature_events.n + excluded.n, 1000000);
  end loop;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;
grant execute on function public.record_events(text, text, jsonb) to anon, authenticated;

create or replace function public.get_feature_events(p_secret text, p_days integer default 30, p_hub text default null)
returns table(hub text, kind text, people bigint, total bigint, days bigint, last_day date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select e.hub, e.kind, count(distinct e.visitor_id)::bigint, sum(e.n)::bigint, count(distinct e.day)::bigint, max(e.day)
  from feature_events e
  where e.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 365))
    and (p_hub is null or e.hub = p_hub)
  group by e.hub, e.kind order by 3 desc, 4 desc limit 2000;
end;
$$;
grant execute on function public.get_feature_events(text, integer, text) to anon, authenticated;

-- migration_v39 (2026-10-21): get_correct_streak_stats timed out (57014, "canceling statement due to statement timeout").
-- It joined sh_visitor_xp(s.visitor_id) onto every correct_streaks row before the order by + limit 1, so it worked out
-- XP for the whole class (~120 rows, twice) to show two people. Now it picks the top row first and works out XP, tier
-- and flair for that one visitor only. Same signature and columns, so create or replace keeps the anon grant.
create or replace function public.get_correct_streak_stats()
returns table(kind text, display_name text, streak integer, tier integer, level integer, flair text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with top as (
    (select 'active'::text as k, s.visitor_id, s.current_streak as n, 1 as ord
       from correct_streaks s where s.current_streak > 0 order by s.current_streak desc limit 1)
    union all
    (select 'record'::text, s.visitor_id, s.best_streak, 2
       from correct_streaks s where s.best_streak > 0 order by s.best_streak desc limit 1)
  )
  select t.k, coalesce(vn.display_name, anon_name(t.visitor_id)), t.n,
     sh_tier(coalesce(x.xp, 0)), sh_step(coalesce(x.xp, 0)) - sh_tier(coalesce(x.xp, 0)) * 3 + 1, sh_mastery_flair(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id left join lateral sh_visitor_xp(t.visitor_id) x on true
  order by t.ord;
end;
$$;

-- ============================================================================
-- "Is this your other device?" (migration_v41)
-- ============================================================================
create or replace function public.name_shared(p_visitor text, p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  with me as (select coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor) as id)
  select case
    when p_visitor is null or length(p_visitor) not between 1 and 80 then false
    when p_name is null or length(btrim(p_name)) not between 1 and 24 then false
    else exists (
      select 1 from visitor_names vn, me
      where lower(btrim(vn.display_name)) = lower(btrim(p_name))
        and vn.visitor_id <> p_visitor
        and coalesce((select primary_id from visitor_links where alias_id = vn.visitor_id), vn.visitor_id) <> me.id)
  end;
$$;
grant execute on function public.name_shared(text, text) to anon, authenticated;

-- ============================================================================
-- XP and activity summaries (migration_v44, migration_v45): replace the earlier
-- sh_visitor_xp, get_rank_board, get_leaderboard, get_visitor_summary,
-- get_visitor_by_hub and get_visitor_by_section above (later definitions win).
-- ============================================================================

create table if not exists public.xp_seen (
  visitor_id text not null, hub text not null, qid text not null, correct boolean not null,
  primary key (visitor_id, hub, qid, correct)
);
create table if not exists public.xp_days (
  visitor_id text not null, d date not null,
  n int not null default 0, c int not null default 0, raw int not null default 0,
  primary key (visitor_id, d)
);
alter table public.xp_seen enable row level security;
alter table public.xp_days enable row level security;
revoke all on public.xp_seen, public.xp_days from anon, authenticated;

create or replace function public.sh_xp_rebuild(p_ids text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from xp_seen where visitor_id = any(p_ids);
  delete from xp_days where visitor_id = any(p_ids);
  insert into xp_seen (visitor_id, hub, qid, correct)
    select distinct visitor_id, hub, qid, correct from personal_answers where visitor_id = any(p_ids);
  insert into xp_days (visitor_id, d, n, c, raw)
    with pa as (
      select a.visitor_id, a.correct, (a.answered_at at time zone 'America/Chicago')::date as d,
        row_number() over (partition by a.visitor_id, a.hub, a.qid, a.correct order by a.answered_at) as rn
      from personal_answers a where a.visitor_id = any(p_ids)
    )
    select visitor_id, d, count(*), count(*) filter (where correct),
      sum(case when correct and rn = 1 then 10 when correct then 2 else 1 end)
    from pa group by 1, 2;
end; $$;
revoke all on function public.sh_xp_rebuild(text[]) from public, anon, authenticated;

create or replace function public.sh_xp_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare k int;
begin
  if new.visitor_id is null or new.hub is null or new.qid is null or new.correct is null then return null; end if;
  insert into xp_seen (visitor_id, hub, qid, correct) values (new.visitor_id, new.hub, new.qid, new.correct)
    on conflict do nothing;
  get diagnostics k = row_count;
  insert into xp_days (visitor_id, d, n, c, raw)
    values (new.visitor_id, (new.answered_at at time zone 'America/Chicago')::date, 1,
      case when new.correct then 1 else 0 end,
      case when new.correct and k = 1 then 10 when new.correct then 2 else 1 end)
    on conflict (visitor_id, d) do update set n = xp_days.n + 1, c = xp_days.c + excluded.c, raw = xp_days.raw + excluded.raw;
  return null;
end; $$;

create or replace function public.sh_xp_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_xp_rebuild(array(select visitor_id from old_rows union select visitor_id from new_rows));
  return null;
end; $$;

create or replace function public.sh_xp_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_xp_rebuild(array(select distinct visitor_id from old_rows));
  return null;
end; $$;

drop trigger if exists personal_answers_xp_ins on public.personal_answers;
drop trigger if exists personal_answers_xp_upd on public.personal_answers;
drop trigger if exists personal_answers_xp_del on public.personal_answers;
create trigger personal_answers_xp_ins after insert on public.personal_answers
  for each row execute function public.sh_xp_on_insert();
create trigger personal_answers_xp_upd after update on public.personal_answers
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.sh_xp_on_update();
create trigger personal_answers_xp_del after delete on public.personal_answers
  referencing old table as old_rows
  for each statement execute function public.sh_xp_on_delete();

lock table public.personal_answers in share row exclusive mode;
select public.sh_xp_rebuild(array(select distinct visitor_id from public.personal_answers));

create or replace function public.sh_visitor_xp(p_visitor text default null)
returns table(visitor_id text, xp integer, days integer, answers integer, correct integer)
language sql stable security definer set search_path = public as $$
  select x.visitor_id, sum(least(x.raw, 600) + 20)::int, count(*)::int, sum(x.n)::int, sum(x.c)::int
  from xp_days x where p_visitor is null or x.visitor_id = p_visitor
  group by 1;
$$;
revoke all on function public.sh_visitor_xp(text) from public, anon, authenticated;

create or replace function public.get_rank_board(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, tier integer, level integer, is_me boolean, flair text)
language sql stable security definer set search_path = public as $$
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from sh_visitor_xp(null) v),
  top as (select * from r where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor))
  select t.rnk, coalesce(vn.display_name, anon_name(t.visitor_id)), t.xp, sh_tier(t.xp), sh_step(t.xp) - sh_tier(t.xp) * 3 + 1,
    (p_visitor is not null and t.visitor_id = p_visitor), sh_mastery_flair(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id
  order by t.rnk;
$$;

create or replace function public.get_leaderboard(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, tier integer, level integer, flair text)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with islands as (
    select visitor_id, d, d - (row_number() over (partition by visitor_id order by d))::int as grp from xp_days
  ), streaks as (
    select visitor_id, count(*)::int as len, max(d) as last_day from islands group by visitor_id, grp
  ), current_streaks as (
    select visitor_id, max(len) as streak from streaks
    where last_day >= (now() at time zone 'America/Chicago')::date - 1 group by visitor_id
  ), x as (select * from sh_visitor_xp(null)
  ), top as (
    select cs.visitor_id, cs.streak, coalesce(x.answers, 0) as total_answered, coalesce(x.xp, 0) as xp
    from current_streaks cs left join x on x.visitor_id = cs.visitor_id
    where cs.streak >= 2
    order by cs.streak desc, 3 desc
    limit p_limit
  )
  select coalesce(vn.display_name, anon_name(t.visitor_id)), t.streak::int, t.total_answered::int,
    sh_tier(t.xp), sh_step(t.xp) - sh_tier(t.xp) * 3 + 1, sh_mastery_flair(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id
  order by t.streak desc, t.total_answered desc;
end; $$;

create table if not exists public.activity_hourly (
  h timestamptz not null, hub text not null, section text not null, visitor_id text not null,
  n int not null default 0,
  primary key (h, hub, section, visitor_id)
);
create table if not exists public.activity_visits (
  visit_id text not null, visitor_id text not null,
  first_at timestamptz not null, last_at timestamptz not null,
  primary key (visit_id, visitor_id)
);
create index if not exists activity_hourly_visitor_idx on public.activity_hourly (visitor_id);
create index if not exists activity_visits_last_idx on public.activity_visits (last_at);
create index if not exists activity_visits_visitor_idx on public.activity_visits (visitor_id);
alter table public.activity_hourly enable row level security;
alter table public.activity_visits enable row level security;
revoke all on public.activity_hourly, public.activity_visits from anon, authenticated;

create or replace function public.sh_activity_rebuild(p_ids text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from activity_hourly where visitor_id = any(p_ids);
  delete from activity_visits where visitor_id = any(p_ids);
  insert into activity_hourly (h, hub, section, visitor_id, n)
    select date_trunc('hour', pinged_at), coalesce(hub, ''), coalesce(section, ''), visitor_id, count(*)
    from activity_pings where visitor_id = any(p_ids) group by 1, 2, 3, 4;
  insert into activity_visits (visit_id, visitor_id, first_at, last_at)
    select visit_id, visitor_id, min(pinged_at), max(pinged_at)
    from activity_pings where visitor_id = any(p_ids) group by 1, 2;
end; $$;
revoke all on function public.sh_activity_rebuild(text[]) from public, anon, authenticated;

create or replace function public.sh_activity_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into activity_hourly (h, hub, section, visitor_id, n)
    values (date_trunc('hour', new.pinged_at), coalesce(new.hub, ''), coalesce(new.section, ''), new.visitor_id, 1)
    on conflict (h, hub, section, visitor_id) do update set n = activity_hourly.n + 1;
  insert into activity_visits (visit_id, visitor_id, first_at, last_at)
    values (new.visit_id, new.visitor_id, new.pinged_at, new.pinged_at)
    on conflict (visit_id, visitor_id) do update set
      first_at = least(activity_visits.first_at, excluded.first_at),
      last_at = greatest(activity_visits.last_at, excluded.last_at);
  return null;
end; $$;

create or replace function public.sh_activity_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_activity_rebuild(array(select visitor_id from old_rows union select visitor_id from new_rows));
  return null;
end; $$;

create or replace function public.sh_activity_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_activity_rebuild(array(select distinct visitor_id from old_rows));
  return null;
end; $$;

drop trigger if exists activity_pings_sum_ins on public.activity_pings;
drop trigger if exists activity_pings_sum_upd on public.activity_pings;
drop trigger if exists activity_pings_sum_del on public.activity_pings;
create trigger activity_pings_sum_ins after insert on public.activity_pings
  for each row execute function public.sh_activity_on_insert();
create trigger activity_pings_sum_upd after update on public.activity_pings
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.sh_activity_on_update();
create trigger activity_pings_sum_del after delete on public.activity_pings
  referencing old table as old_rows
  for each statement execute function public.sh_activity_on_delete();

lock table public.activity_pings in share row exclusive mode;
truncate public.activity_hourly, public.activity_visits;
insert into public.activity_hourly (h, hub, section, visitor_id, n)
  select date_trunc('hour', pinged_at), coalesce(hub, ''), coalesce(section, ''), visitor_id, count(*)
  from public.activity_pings group by 1, 2, 3, 4;
insert into public.activity_visits (visit_id, visitor_id, first_at, last_at)
  select visit_id, visitor_id, min(pinged_at), max(pinged_at) from public.activity_pings group by 1, 2;
analyze public.activity_hourly;
analyze public.activity_visits;

create or replace function public.get_visitor_by_hub(p_secret text, p_days integer default 30)
returns table(hub text, unique_visitors bigint, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select coalesce(nullif(a.hub, ''), '(unknown)'), count(distinct a.visitor_id)::bigint,
    round((sum(a.n) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_hourly a
  where a.h >= date_trunc('hour', now() - (p_days || ' days')::interval)
  group by 1 order by total_minutes desc;
end; $$;

create or replace function public.get_visitor_by_section(p_secret text, p_days integer default 30)
returns table(hub text, section text, total_minutes numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select coalesce(nullif(a.hub, ''), '(unknown)') as hub, coalesce(nullif(a.section, ''), '(unspecified)'),
    round((sum(a.n) * 25.0 / 60.0)::numeric, 1) as total_minutes
  from activity_hourly a
  where a.h >= date_trunc('hour', now() - (p_days || ' days')::interval)
  group by 1, 2 order by hub, total_minutes desc;
end; $$;

create or replace function public.get_visitor_summary(p_secret text, p_days integer default 30)
returns table(unique_visitors bigint, total_visits bigint, avg_visit_minutes numeric)
language plpgsql security definer set search_path = public as $$
declare since timestamptz := now() - (p_days || ' days')::interval;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select count(distinct v.visitor_id)::bigint, count(*)::bigint,
    round(avg(greatest(extract(epoch from (v.last_at - greatest(v.first_at, since))) / 60.0, 0.4))::numeric, 1)
  from activity_visits v where v.last_at >= since;
end; $$;

-- ============================================================================
-- pinned questions across devices (migration_v46)
-- ============================================================================
-- v46: pinned questions follow you across devices. The Question Bank's Pin button (widget/v3.js, window.shPins) kept pins
-- in localStorage only (sh_pins_<hub>). question_pins keeps one row per visitor, hub and question with the latest change:
-- pinned true or false (an unpin is kept, so it beats an older pin from another device) and t, the device's time of that
-- change in epoch ms. set_pins saves changes (only when newer than the stored one); get_my_pins reads them back on hub load,
-- and the widget merges by t. redeem_link_code (Link my devices) moves a device's pins onto the linked id, newer change winning.

create table if not exists public.question_pins (
  visitor_id text not null,
  hub text not null,
  qid text not null,
  pinned boolean not null,
  t bigint not null,
  primary key (visitor_id, hub, qid)
);
alter table public.question_pins enable row level security;  -- no policies: only the functions below touch it

-- p_pins: [[qid, 1|0, t], ...] (at most 500 per call); a visitor keeps at most 3000 rows per hub
create or replace function public.set_pins(p_visitor text, p_hub text, p_pins jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare n int := 0; x jsonb; tt bigint; now_ms bigint := floor(extract(epoch from now()) * 1000)::bigint;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40
     or jsonb_typeof(p_pins) <> 'array' or jsonb_array_length(p_pins) > 500 then return 0; end if;
  for x in select * from jsonb_array_elements(p_pins) loop
    if jsonb_typeof(x) <> 'array' or length(coalesce(x->>0, '')) not between 1 and 80 then continue; end if;
    tt := least(greatest(coalesce((x->>2)::numeric, 0), 0), now_ms + 86400000)::bigint;
    if not exists (select 1 from question_pins where visitor_id = p_visitor and hub = p_hub and qid = x->>0)
       and (select count(*) from question_pins where visitor_id = p_visitor and hub = p_hub) >= 3000 then continue; end if;
    insert into question_pins (visitor_id, hub, qid, pinned, t) values (p_visitor, p_hub, x->>0, (x->>1) = '1', tt)
      on conflict (visitor_id, hub, qid) do update set pinned = excluded.pinned, t = excluded.t where excluded.t >= question_pins.t;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- [[qid, 1|0, t], ...], newest change first
create or replace function public.get_my_pins(p_visitor text, p_hub text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(qid, case when pinned then 1 else 0 end, t) order by t desc), '[]'::jsonb)
  from question_pins
  where p_visitor is not null and length(p_visitor) between 1 and 80 and visitor_id = p_visitor and hub = p_hub;
$$;

revoke all on function public.set_pins(text, text, jsonb) from public;
revoke all on function public.get_my_pins(text, text) from public;
grant execute on function public.set_pins(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_my_pins(text, text) to anon, authenticated;

-- ============================================================================
-- Timmy Time likes, dislikes and comments (migration_v47)
-- ============================================================================
-- v47: likes, dislikes and comments on Timmy Time episodes (widget/podcast.js; rule: vault/rules/podcast-reactions.md).
-- Under every episode card: a like and a dislike (one per visitor, tap again to take it back), the episode's lore comments
-- (written into the hub's SH_PODCAST.fans, not stored here) and the class's own comments. A comment is posted under the
-- visitor's leaderboard name (get_display_name, so nobody can post as someone else), 280 characters at most, at most 5
-- per visitor per episode a day and one every 20 seconds. It shows at once (Sam, 2026-11-04). Its author can delete it;
-- anyone can report it, and 3 different reporters hide it until Sam looks. The admin page's Inbox lists every comment
-- (admin_pod_comments) and can hide or restore any (admin_hide_pod_comment).

create table if not exists public.podcast_reactions (
  hub text not null,
  episode text not null,
  visitor_id text not null,
  val smallint not null check (val in (-1, 1)),
  updated_at timestamptz not null default now(),
  primary key (hub, episode, visitor_id)
);
create table if not exists public.podcast_comments (
  id bigint generated always as identity primary key,
  hub text not null,
  episode text not null,
  visitor_id text not null,
  name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  hidden boolean not null default false,
  hidden_by text  -- 'self', 'reports' or 'admin'
);
create index if not exists podcast_comments_ep on public.podcast_comments (hub, episode, created_at);
create index if not exists podcast_comments_visitor on public.podcast_comments (visitor_id, created_at);
create table if not exists public.podcast_comment_reports (
  comment_id bigint not null references public.podcast_comments (id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, visitor_id)
);
alter table public.podcast_reactions enable row level security;        -- no policies: only the functions below touch them
alter table public.podcast_comments enable row level security;
alter table public.podcast_comment_reports enable row level security;

-- { likes, dislikes, mine: -1|0|1, comments: [{ id, name, body, at, mine, reported }] }, oldest comment first (the latest 200)
create or replace function public.pod_feed(p_hub text, p_ep text, p_visitor text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'likes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = 1),
    'dislikes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = -1),
    'mine', coalesce((select val from podcast_reactions where hub = p_hub and episode = p_ep and visitor_id = p_visitor), 0),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'body', c.body, 'at', c.created_at,
               'mine', c.visitor_id = p_visitor,
               'reported', exists (select 1 from podcast_comment_reports r where r.comment_id = c.id and r.visitor_id = p_visitor))
             order by c.created_at)
      from (select * from podcast_comments where hub = p_hub and episode = p_ep and not hidden
            order by created_at desc limit 200) c), '[]'::jsonb));
$$;

-- p_val: 1 like, -1 dislike, 0 take it back. Returns the new counts, as pod_feed without the comments.
create or replace function public.pod_react(p_hub text, p_ep text, p_visitor text, p_val integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40
     or length(coalesce(p_ep, '')) not between 1 and 60 or p_val not in (-1, 0, 1) then return null; end if;
  if p_val = 0 then
    delete from podcast_reactions where hub = p_hub and episode = p_ep and visitor_id = p_visitor;
  else
    insert into podcast_reactions (hub, episode, visitor_id, val) values (p_hub, p_ep, p_visitor, p_val)
      on conflict (hub, episode, visitor_id) do update set val = excluded.val, updated_at = now();
  end if;
  return jsonb_build_object(
    'likes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = 1),
    'dislikes', (select count(*) from podcast_reactions where hub = p_hub and episode = p_ep and val = -1),
    'mine', p_val);
end;
$$;

-- { ok: true, id, name, at } or { ok: false, error: 'empty' | 'long' | 'slow' | 'limit' | 'bad' }
create or replace function public.pod_comment(p_hub text, p_ep text, p_visitor text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g')); n text; r podcast_comments;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(coalesce(p_hub, '')) not between 1 and 40
     or length(coalesce(p_ep, '')) not between 1 and 60 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if length(b) = 0 then return jsonb_build_object('ok', false, 'error', 'empty'); end if;
  if length(b) > 280 then return jsonb_build_object('ok', false, 'error', 'long'); end if;
  if exists (select 1 from podcast_comments where visitor_id = p_visitor and created_at > now() - interval '20 seconds') then
    return jsonb_build_object('ok', false, 'error', 'slow'); end if;
  if (select count(*) from podcast_comments where visitor_id = p_visitor and hub = p_hub and episode = p_ep
      and created_at > now() - interval '1 day') >= 5 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  n := left(coalesce(nullif(btrim(get_display_name(p_visitor)), ''), 'A classmate'), 24);
  insert into podcast_comments (hub, episode, visitor_id, name, body) values (p_hub, p_ep, p_visitor, n, b) returning * into r;
  return jsonb_build_object('ok', true, 'id', r.id, 'name', r.name, 'at', r.created_at);
end;
$$;

-- the author takes their own comment down
create or replace function public.pod_delete_comment(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update podcast_comments set hidden = true, hidden_by = 'self' where id = p_id and visitor_id = p_visitor and not hidden;
  return found;
end;
$$;

-- anyone reports a comment once; the third different reporter hides it
create or replace function public.pod_report_comment(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  if not exists (select 1 from podcast_comments where id = p_id and visitor_id <> p_visitor) then return false; end if;
  insert into podcast_comment_reports (comment_id, visitor_id) values (p_id, p_visitor) on conflict do nothing;
  if (select count(*) from podcast_comment_reports where comment_id = p_id) >= 3 then
    update podcast_comments set hidden = true, hidden_by = 'reports' where id = p_id and not hidden;
  end if;
  return true;
end;
$$;

-- admin: every comment from the last p_days, newest first, with its report count
create or replace function public.admin_pod_comments(p_secret text, p_days integer default 60)
returns table (id bigint, hub text, episode text, name text, body text, created_at timestamptz, hidden boolean,
               hidden_by text, reports bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select c.id, c.hub, c.episode, c.name, c.body, c.created_at, c.hidden, c.hidden_by,
           (select count(*) from podcast_comment_reports r where r.comment_id = c.id)
    from podcast_comments c
    where c.created_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 60), 400)))
    order by c.created_at desc limit 500;
end;
$$;

create or replace function public.admin_hide_pod_comment(p_secret text, p_id bigint, p_hidden boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  update podcast_comments set hidden = coalesce(p_hidden, true),
    hidden_by = case when coalesce(p_hidden, true) then 'admin' else null end where id = p_id;
  return found;
end;
$$;

revoke all on function public.pod_feed(text, text, text) from public;
revoke all on function public.pod_react(text, text, text, integer) from public;
revoke all on function public.pod_comment(text, text, text, text) from public;
revoke all on function public.pod_delete_comment(text, bigint) from public;
revoke all on function public.pod_report_comment(text, bigint) from public;
revoke all on function public.admin_pod_comments(text, integer) from public;
revoke all on function public.admin_hide_pod_comment(text, bigint, boolean) from public;
grant execute on function public.pod_feed(text, text, text) to anon, authenticated;
grant execute on function public.pod_react(text, text, text, integer) to anon, authenticated;
grant execute on function public.pod_comment(text, text, text, text) to anon, authenticated;
grant execute on function public.pod_delete_comment(text, bigint) to anon, authenticated;
grant execute on function public.pod_report_comment(text, bigint) to anon, authenticated;
grant execute on function public.admin_pod_comments(text, integer) to anon, authenticated;
grant execute on function public.admin_hide_pod_comment(text, bigint, boolean) to anon, authenticated;

-- ============================================================================
-- Analytics insights and data-quality checks (migration_v49)
-- ============================================================================
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

-- ============================================================================
-- Admin live presence, hub archive overrides, newest-first check-ins and surveys (migration_v50)
-- ============================================================================
-- v50: the admin page's Live and Hubs views (vault/reference/admin-operations.md). Applied to the live project on
-- 2026-11-05, after Sam's written approval (RELEASE_TEST_PLAN.md, tier 3). Its get_exam_debriefs replaces
-- the one above (it reads activity_hourly, as migration_v47's fix applied on 2026-10-30 did) and adds a tie-breaker;
-- get_survey_results too. Later definitions win.

-- ---------------------------------------------------------------- archive overrides
create table if not exists public.hub_archive_overrides (
  hub text primary key check (hub ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  state text not null check (state in ('live', 'archived', 'hidden')),
  until timestamptz,                                  -- null: until Sam sets the hub back to automatic
  note text check (note is null or length(note) <= 300),
  set_at timestamptz not null default now()
);
create table if not exists public.hub_archive_log (
  id bigint generated always as identity primary key,
  hub text not null,
  old_state text not null check (old_state in ('auto', 'live', 'archived', 'hidden')),
  old_until timestamptz,
  new_state text not null check (new_state in ('auto', 'live', 'archived', 'hidden')),
  new_until timestamptz,
  note text,
  at timestamptz not null default now()
);
create index if not exists hub_archive_log_at_idx on public.hub_archive_log (at desc, id desc);
alter table public.hub_archive_overrides enable row level security;   -- no policies: only the functions below touch them
alter table public.hub_archive_log enable row level security;
revoke all on public.hub_archive_overrides, public.hub_archive_log from anon, authenticated;

-- the version token the admin page sends back, so a change made in another tab isn't overwritten blind
create or replace function public.sh_archive_version(p_set_at timestamptz)
returns text language sql stable set search_path = public as $$
  select case when p_set_at is null then 'auto' else (floor(extract(epoch from p_set_at) * 1000000))::bigint::text end;
$$;

-- public: the overrides in force now (the dashboard and widget/v3.js read this; no notes)
create or replace function public.get_hub_overrides()
returns table(hub text, state text, until timestamptz)
language sql stable security definer set search_path = public as $$
  select o.hub, o.state, o.until from hub_archive_overrides o
  where o.until is null or o.until > now()
  order by o.hub;
$$;

-- admin: every override row, with its note, whether it is still in force, and its version token
create or replace function public.admin_hub_overrides(p_secret text)
returns table(hub text, state text, until timestamptz, note text, set_at timestamptz, active boolean, version text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select o.hub, o.state, o.until, o.note, o.set_at, (o.until is null or o.until > now()),
           case when o.until is null or o.until > now() then sh_archive_version(o.set_at) else 'auto' end
    from hub_archive_overrides o order by o.hub;
end;
$$;

-- admin: set a hub to 'auto' (no override: the dates decide), 'live', 'archived' or 'hidden'.
-- p_until: optional end time (future, within 400 days); p_note: optional, 300 characters; p_expect: the version token
-- the page showed ('auto' when no override was in force), or null to skip the check. A different token raises 40001.
create or replace function public.admin_set_hub_archive(p_secret text, p_hub text, p_state text,
  p_until timestamptz default null, p_note text default null, p_expect text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cur hub_archive_overrides%rowtype;
  in_force boolean;
  v_old_state text; v_old_until timestamptz; v_version text;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_until timestamptz := case when p_state = 'auto' then null else p_until end;
  r hub_archive_overrides%rowtype;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' then raise exception 'bad hub id' using errcode = '22023'; end if;
  if p_state is null or p_state not in ('auto', 'live', 'archived', 'hidden') then raise exception 'bad state' using errcode = '22023'; end if;
  if v_until is not null and (v_until <= now() or v_until > now() + interval '400 days') then
    raise exception 'end time must be in the future, within 400 days' using errcode = '22023'; end if;
  if v_note is not null and length(v_note) > 300 then raise exception 'note is over 300 characters' using errcode = '22023'; end if;

  perform pg_advisory_xact_lock(hashtext('hub_archive:' || p_hub));
  select * into cur from hub_archive_overrides o where o.hub = p_hub;
  in_force := found and (cur.until is null or cur.until > now());
  v_old_state := case when in_force then cur.state else 'auto' end;
  v_old_until := case when in_force then cur.until end;
  v_version := case when in_force then sh_archive_version(cur.set_at) else 'auto' end;
  if p_expect is not null and p_expect <> v_version then
    raise exception 'conflict: this hub was changed since the page loaded' using errcode = '40001'; end if;

  if p_state = v_old_state and v_until is not distinct from v_old_until then
    return jsonb_build_object('hub', p_hub, 'state', v_old_state, 'until', v_old_until, 'changed', false, 'version', v_version);
  end if;

  if p_state = 'auto' then
    delete from hub_archive_overrides o where o.hub = p_hub;
  else
    insert into hub_archive_overrides as o (hub, state, until, note, set_at)
    values (p_hub, p_state, v_until, v_note, clock_timestamp())
    on conflict (hub) do update set state = excluded.state, until = excluded.until, note = excluded.note, set_at = excluded.set_at
    returning * into r;
  end if;
  insert into hub_archive_log (hub, old_state, old_until, new_state, new_until, note)
  values (p_hub, v_old_state, v_old_until, p_state, v_until, v_note);
  return jsonb_build_object('hub', p_hub, 'state', p_state, 'until', v_until, 'changed', true,
    'version', case when p_state = 'auto' then 'auto' else sh_archive_version(r.set_at) end);
end;
$$;

-- admin: the audit trail, newest first
create or replace function public.admin_hub_archive_log(p_secret text, p_limit integer default 50)
returns table(id bigint, hub text, old_state text, old_until timestamptz, new_state text, new_until timestamptz, note text, at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select l.id, l.hub, l.old_state, l.old_until, l.new_state, l.new_until, l.note, l.at
    from hub_archive_log l order by l.at desc, l.id desc
    limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

-- ---------------------------------------------------------------- live presence
-- { minutes, as_of, total, hubs: [{ hub, people, names: [..] }] }: busiest hub first, names A-Z. total counts a person
-- once even with two hubs open.
create or replace function public.admin_live_presence(p_secret text, p_minutes integer default 3)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_min integer := greatest(1, least(coalesce(p_minutes, 3), 15));
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return (
    with recent as (
      select distinct p.hub, coalesce(l.primary_id, p.visitor_id) as who
      from activity_pings p
      left join visitor_links l on l.alias_id = p.visitor_id
      where p.pinged_at > now() - make_interval(mins => v_min) and coalesce(p.hub, '') <> ''
    ),
    people as (
      select w.who, coalesce(vn.display_name, anon_name(w.who)) as name
      from (select distinct r.who from recent r) w
      left join visitor_names vn on vn.visitor_id = w.who
    ),
    per_hub as (
      select r.hub, count(*)::int as n, jsonb_agg(pp.name order by lower(pp.name), pp.name) as names
      from recent r join people pp on pp.who = r.who
      group by r.hub
    )
    select jsonb_build_object(
      'minutes', v_min,
      'as_of', now(),
      'total', (select count(*) from people)::int,
      'hubs', coalesce((select jsonb_agg(jsonb_build_object('hub', h.hub, 'people', h.n, 'names', h.names) order by h.n desc, h.hub) from per_hub h), '[]'::jsonb))
  );
end;
$$;

-- ---------------------------------------------------------------- newest first, with a tie-breaker
create or replace function public.get_exam_debriefs(p_secret text)
returns table(hub text, exam text, visitor_id text, answers jsonb, created_at timestamptz,
              minutes bigint, answered bigint, accuracy numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  with d as (select * from exam_debriefs e order by e.created_at desc, e.id desc limit 2000),
  who as (select distinct d.hub, d.visitor_id from d),
  t as (select w.hub, w.visitor_id, coalesce(sum(h.n), 0) * 25 / 60 as minutes
        from who w left join activity_hourly h on h.visitor_id = w.visitor_id and h.hub = w.hub
        group by w.hub, w.visitor_id),
  a as (select w.hub, w.visitor_id, count(pa.id) as answered,
               round(avg(case when pa.id is null then null when pa.correct then 100 else 0 end), 0) as accuracy
        from who w left join personal_answers pa on pa.visitor_id = w.visitor_id and pa.hub = w.hub
        group by w.hub, w.visitor_id)
  select d.hub, d.exam, d.visitor_id, d.answers, d.created_at,
    t.minutes::bigint, a.answered::bigint, a.accuracy
  from d
  join t on t.hub = d.hub and t.visitor_id = d.visitor_id
  join a on a.hub = d.hub and a.visitor_id = d.visitor_id
  order by d.created_at desc, d.id desc;
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
    coalesce(jsonb_agg(r.answers order by r.created_at desc, r.id desc) filter (where r.answers is not null), '[]'::jsonb)
  from surveys s left join survey_responses r on r.survey_id = s.id
  group by s.id order by s.created_at desc, s.id desc;
end;
$$;

-- ---------------------------------------------------------------- grants
revoke all on function public.sh_archive_version(timestamptz) from public, anon, authenticated;
revoke all on function public.get_hub_overrides() from public;
revoke all on function public.admin_hub_overrides(text) from public;
revoke all on function public.admin_set_hub_archive(text, text, text, timestamptz, text, text) from public;
revoke all on function public.admin_hub_archive_log(text, integer) from public;
revoke all on function public.admin_live_presence(text, integer) from public;
grant execute on function public.get_hub_overrides() to anon, authenticated;
grant execute on function public.admin_hub_overrides(text) to anon, authenticated;
grant execute on function public.admin_set_hub_archive(text, text, text, timestamptz, text, text) to anon, authenticated;
grant execute on function public.admin_hub_archive_log(text, integer) to anon, authenticated;
grant execute on function public.admin_live_presence(text, integer) to anon, authenticated;

-- ======================================================================
-- migration_v51 (2026-11-04): question health (widget/qhealth.js, review/ -> Question health,
-- vault/reference/question-health.md)
-- ======================================================================
-- ---------------------------------------------------------------- tables
create table if not exists public.question_versions (
  hub text not null,
  qid text not null,
  v text not null,
  qt text not null default '',          -- mcq, mcq:tf, mcq:2stmt, mcq:num, multi, match, sequence, recall
  nch smallint,                         -- number of choices (mcq / multi)
  key smallint,                         -- authored index of the right choice (mcq)
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (hub, qid, v)
);
create table if not exists public.question_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  hub text not null,
  qid text not null,
  v text not null default '',
  visitor_id text not null,
  visit_id text not null,
  kind text not null check (kind in ('answer', 'view')),
  ctx text not null default '',         -- bank, drill, mock, weak, search...
  try smallint,                         -- answer: 1 = this person's first try at the question ever
  prev boolean,                         -- answer: their previous try was right (null on a first try)
  gap_min integer,                      -- answer: minutes since their previous try
  correct boolean,
  choice smallint,                      -- answer, multiple choice: authored index picked
  ms integer,                           -- answer: active ms on the card before answering; view: active ms unanswered
  expl_ms integer,                      -- answer: active ms on the card after answering (the explanation)
  expl_acts smallint                    -- answer: taps inside the explanation
);
create index if not exists question_events_q on public.question_events (hub, qid, v, at);
create index if not exists question_events_visitor on public.question_events (visitor_id, at);
create table if not exists public.question_feedback (
  hub text not null,
  qid text not null,
  visitor_id text not null,
  v text not null default '',
  vote smallint not null check (vote in (-1, 1)),
  reason text,                          -- on a thumbs down: wrong-key, confusing, not-in-notes, explanation, giveaway
  updated_at timestamptz not null default now(),
  primary key (hub, qid, visitor_id)
);
create table if not exists public.question_reviews (
  hub text not null,
  qid text not null,
  status text not null check (status in ('ok', 'fix', 'fixed')),
  v text not null default '',           -- the version that was reviewed
  flags text[] not null default '{}',   -- the flags it had then; a new kind of flag brings it back
  note text,
  updated_at timestamptz not null default now(),
  primary key (hub, qid)
);
alter table public.question_versions enable row level security;  -- no policies: only the functions below touch them
alter table public.question_events enable row level security;
alter table public.question_feedback enable row level security;
alter table public.question_reviews enable row level security;

-- ---------------------------------------------------------------- recording (public)
-- a whole number from untrusted text, or null; never throws
create or replace function public.qh_int(p text, p_lo integer, p_hi integer)
returns integer language sql immutable as $$
  select case when p ~ '^-?\d{1,9}$' and p::bigint between p_lo and p_hi then p::int end;
$$;

-- p_items: up to 60 of { q: qid, v: version, k: 'a' | 'v', c: ctx, t: type, n: try, p: 1|0 previous try right,
--   g: minutes since previous try, ok: 1|0, ch: choice, ms, em: explanation ms, ea: explanation taps, nch, key }
create or replace function public.record_qh(p_hub text, p_visitor text, p_visit text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare it jsonb; c int := 0; x_q text; x_v text; x_k text; x_ctx text; x_qt text;
begin
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' or p_visitor is null or length(p_visitor) not between 8 and 80
     or p_visit is null or length(p_visit) not between 8 and 80 or jsonb_typeof(p_items) is distinct from 'array' then return; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    c := c + 1; exit when c > 60;
    continue when jsonb_typeof(it) is distinct from 'object';
    x_q := it->>'q'; continue when x_q is null or x_q !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$';
    x_v := coalesce(it->>'v', ''); continue when x_v !~ '^[a-z0-9]{0,16}$';
    x_k := case it->>'k' when 'a' then 'answer' when 'v' then 'view' end; continue when x_k is null;
    x_ctx := lower(coalesce(it->>'c', '')); if x_ctx !~ '^[a-z0-9-]{0,16}$' then x_ctx := ''; end if;
    x_qt := lower(coalesce(it->>'t', '')); if x_qt !~ '^[a-z0-9:]{0,16}$' then x_qt := ''; end if;
    insert into question_events (hub, qid, v, visitor_id, visit_id, kind, ctx, try, prev, gap_min, correct, choice, ms, expl_ms, expl_acts)
    values (p_hub, x_q, x_v, p_visitor, p_visit, x_k, x_ctx,
      case when x_k = 'answer' then qh_int(it->>'n', 1, 9999) end,
      case when x_k = 'answer' then case it->>'p' when '1' then true when '0' then false end end,
      case when x_k = 'answer' then qh_int(it->>'g', 0, 525600) end,
      case when x_k = 'answer' then case it->>'ok' when '1' then true when '0' then false end end,
      case when x_k = 'answer' then qh_int(it->>'ch', 0, 19) end,
      qh_int(it->>'ms', 0, 3600000),
      case when x_k = 'answer' then qh_int(it->>'em', 0, 3600000) end,
      case when x_k = 'answer' then qh_int(it->>'ea', 0, 999) end);
    if x_v <> '' then
      insert into question_versions (hub, qid, v, qt, nch, key) values (p_hub, x_q, x_v, x_qt, qh_int(it->>'nch', 1, 20), qh_int(it->>'key', 0, 19))
      on conflict (hub, qid, v) do update set last_seen = now(),
        qt = case when excluded.qt <> '' then excluded.qt else question_versions.qt end,
        nch = coalesce(excluded.nch, question_versions.nch), key = coalesce(excluded.key, question_versions.key);
    end if;
  end loop;
exception when others then return;  -- analytics must never surface an error to a student
end;
$$;

-- p_vote: 1 good question, -1 not, 0 take the vote back
create or replace function public.qh_vote(p_hub text, p_qid text, p_v text, p_visitor text, p_vote integer, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' or p_qid is null or p_qid !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$'
     or p_visitor is null or length(p_visitor) not between 8 and 80 or p_vote is null or p_vote not in (-1, 0, 1) then return; end if;
  if p_vote = 0 then delete from question_feedback where hub = p_hub and qid = p_qid and visitor_id = p_visitor; return; end if;
  if not exists (select 1 from question_feedback where hub = p_hub and qid = p_qid and visitor_id = p_visitor)
     and (select count(*) from question_feedback where hub = p_hub and visitor_id = p_visitor) >= 3000 then return; end if;
  insert into question_feedback (hub, qid, visitor_id, v, vote, reason)
  values (p_hub, p_qid, p_visitor, case when coalesce(p_v, '') ~ '^[a-z0-9]{0,16}$' then coalesce(p_v, '') else '' end, p_vote,
    case when p_vote = -1 and p_reason in ('wrong-key', 'confusing', 'not-in-notes', 'explanation', 'giveaway') then p_reason end)
  on conflict (hub, qid, visitor_id) do update set v = excluded.v, vote = excluded.vote, reason = excluded.reason, updated_at = now();
exception when others then return;
end;
$$;

-- ---------------------------------------------------------------- flags
-- r: one qh_report row as jsonb. Returns { flags: [{ code, sev, why, src }], score, state }.
-- Thresholds (vault/reference/question-health.md) count people, not answers: each person's first try counts once.
-- src 'version' = answers to the live version since tracking began; 'all' = every answer ever, all versions
-- (personal_answers / question_choices), used only while the version has too few answers and nobody has reviewed it.
create or replace function public.qh_flags(r jsonb)
returns jsonb language plpgsql immutable as $$
declare
  f jsonb := '[]'::jsonb; score int := 0; codes text[] := '{}'; rf text[] := '{}'; state text;
  st text := r->>'review_status';
  n1 int; c1 int; p1 numeric; src text;
  nch int := (r->>'nch')::int; key int := (r->>'key')::int; qt text := coalesce(r->>'qt', '');
  ch jsonb; tot int; kp int; twn int := 0; tw text; x record;
  du int; dl int; pu numeric; pl numeric; pp numeric; se numeric; dsrc text;
  nrm int; crm int; rsrc text;
  n int; m numeric; hm numeric; e int; a int; ha numeric;
  rs jsonb := coalesce(r->'reasons', '{}'::jsonb); dn int := coalesce((r->>'down')::int, 0); up int := coalesce((r->>'up')::int, 0);
  reason_hit boolean := false;
begin
  -- 1. first-try accuracy: this version if it has 10+ people, else every answer ever (unreviewed questions only)
  if coalesce((r->>'n1')::int, 0) >= 10 then n1 := (r->>'n1')::int; c1 := (r->>'c1')::int; src := 'version';
  elsif st is null and coalesce((r->>'a_n1')::int, 0) >= 10 then n1 := (r->>'a_n1')::int; c1 := (r->>'a_c1')::int; src := 'all';
  end if;
  if src is not null then
    p1 := c1::numeric / n1;
    if qt like 'mcq%' and nch >= 2 and p1 < 1.0 / nch then
      f := f || jsonb_build_object('code', 'below_chance', 'sev', 'high', 'src', src, 'why',
        format('Below chance: %s%% right on the first try (%s people), less than guessing among %s choices (%s%%). Check the key.',
          round(100 * p1), n1, nch, round(100.0 / nch)));
    elsif p1 < 0.40 then
      f := f || jsonb_build_object('code', 'very_hard', 'sev', 'medium', 'src', src, 'why',
        format('Very hard: only %s%% right on the first try (%s people). Is the stem clear and the key right?', round(100 * p1), n1));
    end if;
  end if;

  -- 2. a wrong choice beats the key (multiple choice with a known key): first tries on this version, else all picks ever
  if key is not null then
    -- a missing count arrives as JSON null, not SQL null: only an object counts
    ch := case when jsonb_typeof(r->'choices') = 'object' then r->'choices' else '{}'::jsonb end; src := 'version';
    tot := (select coalesce(sum(value::int), 0) from jsonb_each_text(ch));
    if tot < 8 and st is null then
      ch := case when jsonb_typeof(r->'a_choices') = 'object' then r->'a_choices' else '{}'::jsonb end; src := 'all';
      tot := (select coalesce(sum(value::int), 0) from jsonb_each_text(ch)); end if;
    if tot >= (case src when 'version' then 8 else 12 end) then
      kp := coalesce((ch->>key::text)::int, 0);
      for x in select k, value::int as val from jsonb_each_text(ch) as t(k, value) where k <> key::text loop
        if x.val > twn then twn := x.val; tw := x.k; end if;
      end loop;
      if twn > kp and twn::numeric / tot >= 0.35 then
        f := f || jsonb_build_object('code', 'miskey', 'sev', 'high', 'src', src, 'choice', tw::int, 'why',
          format('Possible miskey: choice %s (as written) was picked by %s%%, the key by %s%% (%s %s).',
            tw::int + 1, round(100.0 * twn / tot), round(100.0 * kp / tot), tot, case src when 'version' then 'first tries' else 'picks, all tries' end));
      end if;
    end if;
  end if;

  -- 3. upside down: the stronger half of the class gets it right less often than the weaker half
  if coalesce((r->>'du')::int, 0) >= 8 and coalesce((r->>'dl')::int, 0) >= 8 then
    du := (r->>'du')::int; dl := (r->>'dl')::int; pu := (r->>'pu')::numeric; pl := (r->>'pl')::numeric; dsrc := 'version';
  elsif st is null and coalesce((r->>'a_du')::int, 0) >= 8 and coalesce((r->>'a_dl')::int, 0) >= 8 then
    du := (r->>'a_du')::int; dl := (r->>'a_dl')::int; pu := (r->>'a_pu')::numeric; pl := (r->>'a_pl')::numeric; dsrc := 'all';
  end if;
  -- a gap of 15 points or more that is also unlikely to be chance (z <= -1.65, one-sided 5%): small groups swing a lot
  if dsrc is not null then
    pp := (pu * du + pl * dl) / (du + dl);
    se := sqrt(pp * (1 - pp) * (1.0 / du + 1.0 / dl));
    if pu - pl <= -0.15 and se > 0 and (pu - pl) / se <= -1.65 then
      f := f || jsonb_build_object('code', 'upside_down', 'sev', 'high', 'src', dsrc, 'why',
        format('Stronger students miss it more: %s%% of the top half of the class got it right on the first try, %s%% of the bottom half (%s and %s people). Often a miskey or a trick of wording.',
          round(100 * pu), round(100 * pl), du, dl));
    end if;
  end if;

  -- 4. missed again after seeing the answer
  if coalesce((r->>'nrm')::int, 0) >= 6 then nrm := (r->>'nrm')::int; crm := (r->>'crm')::int; rsrc := 'version';
  elsif st is null and coalesce((r->>'a_nrm')::int, 0) >= 6 then nrm := (r->>'a_nrm')::int; crm := (r->>'a_crm')::int; rsrc := 'all';
  end if;
  if rsrc is not null and crm::numeric / nrm < 0.5 then
    f := f || jsonb_build_object('code', 'missed_again', 'sev', 'medium', 'src', rsrc, 'why',
      format('Missed again after seeing the answer: of %s people who missed it, only %s got it right the next time. The key, the explanation or the stem may be unclear.', nrm, crm));
  end if;

  -- 5. students' own feedback: open reports, and thumbs down with a reason (this version)
  if coalesce((r->>'reports_open')::int, 0) > 0 then
    f := f || jsonb_build_object('code', 'reported', 'sev', 'high', 'src', 'feedback', 'why',
      format('%s open report%s from students (Inbox).', r->>'reports_open', case when (r->>'reports_open')::int = 1 then '' else 's' end));
  end if;
  if coalesce((rs->>'wrong-key')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_wrong', 'sev', 'high', 'src', 'feedback', 'why', format('%s people say the answer looks wrong.', rs->>'wrong-key')); end if;
  if coalesce((rs->>'confusing')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_confusing', 'sev', 'medium', 'src', 'feedback', 'why', format('%s people say the wording is confusing.', rs->>'confusing')); end if;
  if coalesce((rs->>'not-in-notes')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_notes', 'sev', 'medium', 'src', 'feedback', 'why', format('%s people say it isn''t in the notes.', rs->>'not-in-notes')); end if;
  if coalesce((rs->>'explanation')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_explanation', 'sev', 'low', 'src', 'feedback', 'why', format('%s people say the explanation didn''t help.', rs->>'explanation')); end if;
  if coalesce((rs->>'giveaway')::int, 0) >= 2 then reason_hit := true;
    f := f || jsonb_build_object('code', 'voted_giveaway', 'sev', 'low', 'src', 'feedback', 'why', format('%s people say it gives the answer away.', rs->>'giveaway')); end if;
  if not reason_hit and dn >= 3 and dn::numeric / (dn + up) >= 0.5 then
    f := f || jsonb_build_object('code', 'disliked', 'sev', 'medium', 'src', 'feedback', 'why', format('%s of %s votes say it isn''t a good question.', dn, dn + up));
  end if;

  -- 6. time, abandonment and the explanation (this version only: these are new measurements)
  n := coalesce((r->>'nt')::int, 0); m := (r->>'med_ms')::numeric; hm := (r->>'hub_med_ms')::numeric;
  if n >= 8 and m >= 45000 and hm > 0 and m >= 2 * hm then
    f := f || jsonb_build_object('code', 'slow', 'sev', 'low', 'src', 'version', 'why',
      format('Slow: the median first try takes %s s, %s times the hub''s median for this kind of question (%s s). Long or confusing stem?',
        round(m / 1000), round(m / hm, 1), round(hm / 1000)));
  end if;
  e := coalesce((r->>'engaged')::int, 0); a := coalesce((r->>'abandoned')::int, 0); ha := (r->>'hub_abandon')::numeric;
  if e >= 10 and a::numeric / e >= 0.30 and (ha is null or a::numeric / e >= 2 * ha) then
    f := f || jsonb_build_object('code', 'abandoned', 'sev', 'low', 'src', 'version', 'why',
      format('Often left unanswered: %s of %s people who read it for 8 s or more moved on without answering (hub: %s%%).',
        a, e, coalesce(round(100 * ha)::text, '?')));
  end if;
  if coalesce((r->>'miss_n')::int, 0) >= 10 and (r->>'miss_quick')::numeric / (r->>'miss_n')::numeric >= 0.7 then
    f := f || jsonb_build_object('code', 'expl_skipped', 'sev', 'low', 'src', 'version', 'why',
      format('Explanation skipped: %s of %s who missed it left the explanation within 3 s. Too long, or not helpful?', r->>'miss_quick', r->>'miss_n'));
  end if;

  -- 7. class data under an id the hub no longer has (only known when the admin page passes the live ids)
  if (r->>'in_hub') = 'false' then
    f := f || jsonb_build_object('code', 'gone', 'sev', 'low', 'src', 'ids', 'why',
      'This id has class data but isn''t in the hub any more. Renamed or removed? Ids are permanent (tools/question-ids/).');
  end if;

  select coalesce(array_agg(j->>'code'), '{}'), coalesce(sum(case j->>'sev' when 'high' then 3 when 'medium' then 2 else 1 end), 0)
    into codes, score from jsonb_array_elements(f) j;
  if jsonb_typeof(r->'review_flags') = 'array' then
    rf := array(select jsonb_array_elements_text(r->'review_flags'));
  end if;
  state := case
    when st = 'fix' then case when r->>'review_v' = r->>'v' then 'todo' else 'changed' end
    when jsonb_array_length(f) = 0 then 'clear'
    when st in ('ok', 'fixed') and r->>'review_v' = r->>'v'
         and codes <@ rf then 'reviewed'
    else 'new' end;
  return jsonb_build_object('flags', f, 'score', score, 'state', state);
end;
$$;

-- ---------------------------------------------------------------- the report
-- One row per question with any data in this hub. Read it with the SQL connector:
--   select qid, state, score, flags from qh_report('occlusion') where state in ('new', 'changed') order by score desc;
create or replace function public.qh_report(p_hub text, p_days integer default 120, p_current jsonb default null)
returns table(
  hub text, qid text, in_hub boolean, v text, versions integer, v_since timestamptz, qt text, nch integer, key integer,
  n1 integer, c1 integer, choices jsonb, nr integer, cr integer, nrm integer, crm integer,
  nt integer, med_ms integer, hub_med_ms integer, engaged integer, abandoned integer, hub_abandon numeric,
  answers integer, miss_n integer, miss_quick integer, expl_med_ms integer, expl_acts numeric,
  du integer, pu numeric, dl integer, pl numeric,
  a_n1 integer, a_c1 integer, a_nrm integer, a_crm integer, a_du integer, a_pu numeric, a_dl integer, a_pl numeric,
  a_attempts integer, a_correct integer, a_choices jsonb,
  up integer, down integer, reasons jsonb, reports_open integer, reports jsonb,
  review_status text, review_v text, review_flags text[], review_note text, review_at timestamptz,
  flags jsonb, score integer, state text)
language sql stable set search_path = public as $$
with
win as (select now() - make_interval(days => greatest(1, least(coalesce(p_days, 120), 730))) as since),
vers as (select qv.qid, qv.v, qv.qt, qv.nch, qv.key, qv.first_seen from question_versions qv where qv.hub = p_hub),
latest as (select distinct on (vers.qid) vers.* from vers order by vers.qid, vers.first_seen desc),
nv as (select vers.qid, count(*)::int n from vers group by vers.qid),
rep as (
  select substring(f.note from '  — question ([^ ]+)') qid, f.id, f.note, f.resolved, f.created_at, f.reply
  from question_flags f where f.hub = p_hub
),
uni as (
  select vers.qid from vers
  union select pa.qid from personal_answers pa where pa.hub = p_hub
  union select fb.qid from question_feedback fb where fb.hub = p_hub
  union select rep.qid from rep where rep.qid is not null
  union select rv.qid from question_reviews rv where rv.hub = p_hub
),
-- p_current values: the live fingerprint, or { v, key, nch, qt } (the admin page sends both, read off SH_EXPORT, so the
-- key and choice count are known before any version row exists)
pcur as (
  select u.qid,
    case jsonb_typeof(p_current->u.qid) when 'object' then p_current->u.qid->>'v' when 'string' then p_current->>u.qid end v,
    case when jsonb_typeof(p_current->u.qid->'qt') = 'string' then p_current->u.qid->>'qt' end qt,
    case when jsonb_typeof(p_current->u.qid->'nch') = 'number' then (p_current->u.qid->>'nch')::int end nch,
    case when jsonb_typeof(p_current->u.qid->'key') = 'number' then (p_current->u.qid->>'key')::int end key
  from uni u
),
cur as (
  select u.qid, coalesce(pc.v, l.v, '') v, coalesce(nv.n, 0) versions,
         coalesce(nullif(pc.qt, ''), nullif(m.qt, ''), l.qt, '') qt, coalesce(pc.nch, m.nch, l.nch)::int nch,
         coalesce(pc.key, m.key, l.key)::int key, m.first_seen v_since,
         case when p_current is null then null else p_current ? u.qid end in_hub
  from uni u join pcur pc on pc.qid = u.qid left join latest l on l.qid = u.qid left join nv on nv.qid = u.qid
  left join vers m on m.qid = u.qid and m.v = coalesce(pc.v, l.v)
),
ev as (
  select e.qid, e.kind, e.ctx, e.try, e.prev, e.correct, e.choice, e.ms, e.expl_ms, e.expl_acts, e.visit_id, e.at,
         coalesce(lk.primary_id, e.visitor_id) person
  from question_events e
  join cur c on c.qid = e.qid and c.v = e.v
  left join visitor_links lk on lk.alias_id = e.visitor_id
  where e.hub = p_hub and e.at > (select since from win)
),
ft as (select distinct on (ev.qid, ev.person) ev.qid, ev.person, ev.correct, ev.choice, ev.ms, ev.ctx
       from ev where ev.kind = 'answer' and ev.try = 1 order by ev.qid, ev.person, ev.at),
ft_agg as (
  select ft.qid, count(*)::int n1, count(*) filter (where ft.correct)::int c1,
    count(*) filter (where ft.ms is not null and ft.ctx <> 'mock')::int nt,
    (percentile_cont(0.5) within group (order by ft.ms) filter (where ft.ms is not null and ft.ctx <> 'mock'))::int med_ms
  from ft group by ft.qid
),
ft_ch as (select x.qid, jsonb_object_agg(x.choice::text, x.n) choices
          from (select ft.qid, ft.choice, count(*)::int n from ft where ft.choice is not null group by 1, 2) x group by x.qid),
hub_ms as (select c.qt, (percentile_cont(0.5) within group (order by ft.ms))::int m
           from ft join cur c on c.qid = ft.qid where ft.ms is not null and ft.ctx <> 'mock' group by c.qt),
r1 as (select distinct on (ev.qid, ev.person) ev.qid, ev.correct from ev where ev.kind = 'answer' and ev.try > 1 order by ev.qid, ev.person, ev.at),
rm as (select distinct on (ev.qid, ev.person) ev.qid, ev.correct from ev where ev.kind = 'answer' and ev.try > 1 and ev.prev = false order by ev.qid, ev.person, ev.at),
r_agg as (select r1.qid, count(*)::int nr, count(*) filter (where r1.correct)::int cr from r1 group by r1.qid),
rm_agg as (select rm.qid, count(*)::int nrm, count(*) filter (where rm.correct)::int crm from rm group by rm.qid),
vis as (
  select ev.qid, ev.person, coalesce(sum(ev.ms) filter (where ev.kind = 'view'), 0) vms, bool_or(ev.kind = 'answer') ans
  from ev where ev.ctx <> 'mock' group by ev.qid, ev.person, ev.visit_id
),
vis_p as (select vis.qid, vis.person, bool_or(vis.vms >= 8000 or vis.ans) eng, bool_or(vis.vms >= 8000 and not vis.ans) and not bool_or(vis.ans) ab
          from vis group by vis.qid, vis.person),
ab_agg as (select vis_p.qid, count(*) filter (where vis_p.eng)::int engaged, count(*) filter (where vis_p.ab)::int abandoned from vis_p group by vis_p.qid),
hub_ab as (select sum(ab_agg.abandoned)::numeric / nullif(sum(ab_agg.engaged), 0) r from ab_agg),
ex_agg as (
  select ev.qid, count(*)::int answers,
    count(*) filter (where not ev.correct and ev.expl_ms is not null)::int miss_n,
    count(*) filter (where not ev.correct and ev.expl_ms is not null and ev.expl_ms < 3000)::int miss_quick,
    (percentile_cont(0.5) within group (order by ev.expl_ms) filter (where not ev.correct and ev.expl_ms is not null))::int expl_med_ms,
    round(avg(ev.expl_acts) filter (where ev.expl_acts is not null), 2) expl_acts
  from ev where ev.kind = 'answer' and ev.ctx <> 'mock' group by ev.qid
),
pa as (
  select p.visitor_id person, p.qid, p.correct, p.answered_at,
    row_number() over (partition by p.visitor_id, p.qid order by p.answered_at, p.id) rn,
    lag(p.correct) over (partition by p.visitor_id, p.qid order by p.answered_at, p.id) prevc
  from personal_answers p where p.hub = p_hub
),
abil as (select pa.person, avg(pa.correct::int) acc from pa where pa.rn = 1 group by pa.person having count(*) >= 20),
abm as (select percentile_cont(0.5) within group (order by abil.acc) m from abil),
d_v as (
  select ft.qid,
    count(*) filter (where a.acc > abm.m)::int du, round(avg(ft.correct::int) filter (where a.acc > abm.m), 3) pu,
    count(*) filter (where a.acc <= abm.m)::int dl, round(avg(ft.correct::int) filter (where a.acc <= abm.m), 3) pl
  from ft join abil a on a.person = ft.person cross join abm group by ft.qid
),
pa_w as (select pa.* from pa where pa.answered_at > (select since from win)),
a_ft as (select pa_w.qid, count(*)::int a_n1, count(*) filter (where pa_w.correct)::int a_c1 from pa_w where pa_w.rn = 1 group by pa_w.qid),
a_rm as (select x.qid, count(*)::int a_nrm, count(*) filter (where x.correct)::int a_crm
         from (select distinct on (pa_w.qid, pa_w.person) pa_w.qid, pa_w.correct from pa_w where pa_w.prevc = false order by pa_w.qid, pa_w.person, pa_w.answered_at) x
         group by x.qid),
d_a as (
  select pa_w.qid,
    count(*) filter (where a.acc > abm.m)::int a_du, round(avg(pa_w.correct::int) filter (where a.acc > abm.m), 3) a_pu,
    count(*) filter (where a.acc <= abm.m)::int a_dl, round(avg(pa_w.correct::int) filter (where a.acc <= abm.m), 3) a_pl
  from pa_w join abil a on a.person = pa_w.person cross join abm where pa_w.rn = 1 group by pa_w.qid
),
a_ch as (select qc.qid, jsonb_object_agg(qc.choice::text, qc.picks) a_choices from question_choices qc where qc.hub = p_hub group by qc.qid),
a_st as (select qs.qid, qs.attempts, qs.correct from question_stats qs where qs.hub = p_hub),
fb as (
  select f.qid, count(*) filter (where f.vote = 1)::int up, count(*) filter (where f.vote = -1)::int down
  from question_feedback f join cur c on c.qid = f.qid and c.v = f.v where f.hub = p_hub group by f.qid
),
fbr as (
  select x.qid, jsonb_object_agg(x.reason, x.n) reasons
  from (select f.qid, f.reason, count(*)::int n from question_feedback f join cur c on c.qid = f.qid and c.v = f.v
        where f.hub = p_hub and f.vote = -1 and f.reason is not null group by 1, 2) x group by x.qid
),
rep_agg as (
  select rep.qid, count(*) filter (where not rep.resolved)::int reports_open,
    jsonb_agg(jsonb_build_object('id', rep.id, 'note', left(rep.note, 500), 'resolved', rep.resolved, 'at', rep.created_at,
      'reply', left(rep.reply, 300)) order by rep.created_at desc) reports
  from rep where rep.qid is not null group by rep.qid
),
base as (
  select p_hub hub, c.qid, c.in_hub, c.v, c.versions, c.v_since, c.qt, c.nch, c.key,
    fa.n1, fa.c1, fc.choices, ra.nr, ra.cr, rma.nrm, rma.crm,
    fa.nt, fa.med_ms, hm.m hub_med_ms, ab.engaged, ab.abandoned, round((select r from hub_ab), 3) hub_abandon,
    ex.answers, ex.miss_n, ex.miss_quick, ex.expl_med_ms, ex.expl_acts,
    dv.du, dv.pu, dv.dl, dv.pl,
    af.a_n1, af.a_c1, arm.a_nrm, arm.a_crm, da.a_du, da.a_pu, da.a_dl, da.a_pl,
    st.attempts a_attempts, st.correct a_correct, ach.a_choices,
    coalesce(fb.up, 0) up, coalesce(fb.down, 0) down, coalesce(fbr.reasons, '{}'::jsonb) reasons,
    coalesce(rp.reports_open, 0) reports_open, coalesce(rp.reports, '[]'::jsonb) reports,
    rv.status review_status, rv.v review_v, rv.flags review_flags, rv.note review_note, rv.updated_at review_at
  from cur c
  left join ft_agg fa on fa.qid = c.qid left join ft_ch fc on fc.qid = c.qid left join hub_ms hm on hm.qt = c.qt
  left join r_agg ra on ra.qid = c.qid left join rm_agg rma on rma.qid = c.qid left join ab_agg ab on ab.qid = c.qid
  left join ex_agg ex on ex.qid = c.qid left join d_v dv on dv.qid = c.qid
  left join a_ft af on af.qid = c.qid left join a_rm arm on arm.qid = c.qid left join d_a da on da.qid = c.qid
  left join a_st st on st.qid = c.qid left join a_ch ach on ach.qid = c.qid
  left join fb on fb.qid = c.qid left join fbr on fbr.qid = c.qid left join rep_agg rp on rp.qid = c.qid
  left join question_reviews rv on rv.hub = p_hub and rv.qid = c.qid
)
select b.*, (g.x->'flags') flags, (g.x->>'score')::int score, (g.x->>'state') state
from base b cross join lateral (select qh_flags(to_jsonb(b)) x) g
order by (g.x->>'score')::int desc, b.n1 desc nulls last, b.a_n1 desc nulls last, b.qid;
$$;

-- ---------------------------------------------------------------- admin
create or replace function public.get_question_health(p_secret text, p_hub text, p_days integer default 120, p_current jsonb default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub is null or p_hub !~ '^[a-z0-9-]{1,40}$' then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(to_jsonb(r)) from qh_report(p_hub, p_days, p_current) r), '[]'::jsonb);
end;
$$;

-- p_status: ok (looks fine), fix (needs a fix), fixed; null or '' clears the review
create or replace function public.admin_review_question(p_secret text, p_hub text, p_qid text, p_v text, p_status text,
  p_flags text[] default '{}', p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if coalesce(p_status, '') = '' then delete from question_reviews where hub = p_hub and qid = p_qid; return; end if;
  if p_status not in ('ok', 'fix', 'fixed') then raise exception 'status must be ok, fix or fixed'; end if;
  insert into question_reviews (hub, qid, status, v, flags, note)
  values (p_hub, p_qid, p_status, coalesce(p_v, ''), coalesce(p_flags, '{}'), nullif(left(trim(coalesce(p_note, '')), 1000), ''))
  on conflict (hub, qid) do update set status = excluded.status, v = excluded.v, flags = excluded.flags,
    note = excluded.note, updated_at = now();
end;
$$;

-- ---------------------------------------------------------------- grants
revoke all on function public.qh_int(text, integer, integer) from public, anon, authenticated;
revoke all on function public.qh_flags(jsonb) from public, anon, authenticated;
revoke all on function public.qh_report(text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.record_qh(text, text, text, jsonb) from public;
revoke all on function public.qh_vote(text, text, text, text, integer, text) from public;
revoke all on function public.get_question_health(text, text, integer, jsonb) from public;
revoke all on function public.admin_review_question(text, text, text, text, text, text[], text) from public;
grant execute on function public.record_qh(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.qh_vote(text, text, text, text, integer, text) to anon, authenticated;
grant execute on function public.get_question_health(text, text, integer, jsonb) to anon, authenticated;
grant execute on function public.admin_review_question(text, text, text, text, text, text[], text) to anon, authenticated;

-- ============================================================================
-- The analytics retention schedule (migration_v52)
-- ============================================================================
-- v52 (2026-11-05): the analytics retention schedule in force (Sam approved it on 2026-11-04;
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
  -- time (v52): move the hour and visit rollups, then the raw pings with the rebuild trigger off, so hours whose raw
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

  -- v52: from activity_hourly (n pings of 25 s per visitor, hour, hub and section), so it survives the 30-day trim
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

-- v53 (2026-11-05): widget bootstrap, cached visitor XP, and database-advisor cleanup.
--
-- This migration deliberately does not change visible UI.  It replaces the last class-wide
-- XP aggregation with one cached row per visitor, maintained when personal_answers changes;
-- the widget can then collect its eager, visitor-scoped reads in one RPC.  Rank boards,
-- leaderboards and trophy statistics remain separate, lazy calls.

-- ---------- 1. database-advisor fixes ----------
-- These helpers are not security definers, but pinning their lookup path prevents a caller's
-- path from changing the functions they invoke.
alter function public.sh_step(integer) set search_path = public;
alter function public.sh_step_floor(integer) set search_path = public;
alter function public.sh_tier(integer) set search_path = public;
alter function public.sh_tier_floor(integer) set search_path = public;
alter function public.qh_flags(jsonb) set search_path = public;
alter function public.qh_int(text, integer, integer) set search_path = public;

-- The link-attempt log is retained for rate limiting and weekly cleanup.  Give every row a
-- stable key without changing the existing visitor/time lookup.
alter table public.link_attempts add column if not exists id bigint generated by default as identity;
update public.link_attempts set id = default where id is null;
alter table public.link_attempts alter column id set not null;
do $do$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.link_attempts'::regclass and contype = 'p'
  ) then
    alter table public.link_attempts add constraint link_attempts_pkey primary key (id);
  end if;
end;
$do$;

drop index if exists public.hub_suggestions_visitor_idx;
drop index if exists public.question_events_visitor;

-- ---------- 2. cached visitor XP ----------
create table if not exists public.xp_visitors (
  visitor_id text primary key,
  xp integer not null default 0,
  days integer not null default 0,
  answers integer not null default 0,
  correct integer not null default 0,
  best_days integer not null default 0
);
alter table public.xp_visitors enable row level security;
revoke all on table public.xp_visitors from public, anon, authenticated;

-- Rebuild the three private XP caches together after a correction, deletion, or device link.
create or replace function public.sh_xp_rebuild(p_ids text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(cardinality(p_ids), 0) = 0 then return; end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || x.visitor_id))
  from (select distinct unnest(p_ids) as visitor_id order by 1) x
  where x.visitor_id is not null;
  delete from xp_seen where visitor_id = any(p_ids);
  delete from xp_days where visitor_id = any(p_ids);
  delete from xp_visitors where visitor_id = any(p_ids);

  insert into xp_seen (visitor_id, hub, qid, correct)
    select distinct visitor_id, hub, qid, correct
    from personal_answers where visitor_id = any(p_ids);

  insert into xp_days (visitor_id, d, n, c, raw)
    with pa as (
      select a.visitor_id, a.correct, (a.answered_at at time zone 'America/Chicago')::date as d,
        row_number() over (partition by a.visitor_id, a.hub, a.qid, a.correct order by a.answered_at) as rn
      from personal_answers a where a.visitor_id = any(p_ids)
    )
    select visitor_id, d, count(*)::integer, count(*) filter (where correct)::integer,
      sum(case when correct and rn = 1 then 10 when correct then 2 else 1 end)::integer
    from pa group by 1, 2;

  insert into xp_visitors (visitor_id, xp, days, answers, correct, best_days)
    with totals as (
      select visitor_id, sum(least(raw, 600) + 20)::integer as xp, count(*)::integer as days,
        sum(n)::integer as answers, sum(c)::integer as correct
      from xp_days where visitor_id = any(p_ids) group by visitor_id
    ), islands as (
      select visitor_id, d, d - row_number() over (partition by visitor_id order by d)::integer as grp
      from xp_days where visitor_id = any(p_ids)
    ), best as (
      select visitor_id, max(len)::integer as best_days
      from (select visitor_id, grp, count(*)::integer as len from islands group by 1, 2) runs
      group by visitor_id
    )
    select t.visitor_id, t.xp, t.days, t.answers, t.correct, coalesce(b.best_days, 0)
    from totals t left join best b using (visitor_id);
end;
$$;
revoke all on function public.sh_xp_rebuild(text[]) from public, anon, authenticated;

-- The common insert path changes just its visitor's cache row.  xp_days is locked per day
-- first so simultaneous answers for the same visitor keep the daily cap exact.
create or replace function public.sh_xp_on_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  seen_inserted integer;
  raw_delta integer;
  previous_raw integer := 0;
  answer_day date;
  is_new_day boolean := false;
  new_best_days integer := 0;
  xp_delta integer;
begin
  if new.visitor_id is null or new.hub is null or new.qid is null or new.correct is null then return null; end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || new.visitor_id));

  insert into xp_seen (visitor_id, hub, qid, correct)
    values (new.visitor_id, new.hub, new.qid, new.correct)
    on conflict do nothing;
  get diagnostics seen_inserted = row_count;
  raw_delta := case when new.correct and seen_inserted = 1 then 10 when new.correct then 2 else 1 end;
  answer_day := (new.answered_at at time zone 'America/Chicago')::date;

  loop
    previous_raw := 0;
    select raw into previous_raw from xp_days
      where visitor_id = new.visitor_id and d = answer_day for update;
    if found then
      update xp_days set n = n + 1, c = c + case when new.correct then 1 else 0 end,
        raw = raw + raw_delta
      where visitor_id = new.visitor_id and d = answer_day;
      exit;
    end if;
    begin
      insert into xp_days (visitor_id, d, n, c, raw)
        values (new.visitor_id, answer_day, 1, case when new.correct then 1 else 0 end, raw_delta);
      is_new_day := true;
      exit;
    exception when unique_violation then
      -- Another transaction made this visitor/day while this one was checking.  Lock and update it.
      null;
    end;
  end loop;

  if is_new_day then
    select coalesce(max(len), 0)::integer into new_best_days from (
      select count(*)::integer as len from (
        select d, d - row_number() over (order by d)::integer as grp
        from xp_days where visitor_id = new.visitor_id
      ) islands group by grp
    ) runs;
  end if;
  xp_delta := least(previous_raw + raw_delta, 600) - least(previous_raw, 600)
    + case when is_new_day then 20 else 0 end;

  insert into xp_visitors (visitor_id, xp, days, answers, correct, best_days)
    values (new.visitor_id, xp_delta, case when is_new_day then 1 else 0 end, 1,
      case when new.correct then 1 else 0 end, new_best_days)
    on conflict (visitor_id) do update set
      xp = xp_visitors.xp + excluded.xp,
      days = xp_visitors.days + excluded.days,
      answers = xp_visitors.answers + excluded.answers,
      correct = xp_visitors.correct + excluded.correct,
      best_days = greatest(xp_visitors.best_days, excluded.best_days);
  return null;
end;
$$;

create or replace function public.sh_xp_on_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_xp_rebuild(array(
    select distinct visitor_id from (
      select visitor_id from old_rows union select visitor_id from new_rows
    ) affected where visitor_id is not null
  ));
  return null;
end;
$$;

create or replace function public.sh_xp_on_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform sh_xp_rebuild(array(select distinct visitor_id from old_rows where visitor_id is not null));
  return null;
end;
$$;

-- Existing xp_days is already a private, trigger-maintained per-day cache.  Populate the
-- visitor summary from it under the answer-table lock instead of rescanning every answer.
lock table public.personal_answers in share row exclusive mode;
truncate public.xp_visitors;
insert into public.xp_visitors (visitor_id, xp, days, answers, correct, best_days)
  with totals as (
    select visitor_id, sum(least(raw, 600) + 20)::integer as xp, count(*)::integer as days,
      sum(n)::integer as answers, sum(c)::integer as correct
    from public.xp_days group by visitor_id
  ), islands as (
    select visitor_id, d, d - row_number() over (partition by visitor_id order by d)::integer as grp
    from public.xp_days
  ), best as (
    select visitor_id, max(len)::integer as best_days
    from (select visitor_id, grp, count(*)::integer as len from islands group by 1, 2) runs
    group by visitor_id
  )
  select t.visitor_id, t.xp, t.days, t.answers, t.correct, coalesce(b.best_days, 0)
  from totals t left join best b using (visitor_id);
analyze public.xp_visitors;

create or replace function public.sh_visitor_xp(p_visitor text default null)
returns table(visitor_id text, xp integer, days integer, answers integer, correct integer)
language sql stable security definer set search_path = public as $$
  select x.visitor_id, x.xp, x.days, x.answers, x.correct
  from xp_visitors x where p_visitor is null or x.visitor_id = p_visitor;
$$;
revoke all on function public.sh_visitor_xp(text) from public, anon, authenticated;

-- get_rank_profile still reads its visitor's achievements, but positions and totals now read
-- the visitor cache and its day streak never scans personal_answers.
create or replace function public.get_rank_profile(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare x record; t int; st int; pos int; everyone int; best_days int; best_run int; fairies int; goldens int; arcade int; badges text[] := '{}'; ach record;
begin
  select * into x from sh_visitor_xp(p_visitor) limit 1;
  if x.visitor_id is null then
    return jsonb_build_object('xp', 0, 'tier', 0, 'level', 1, 'step', 0, 'step_at', 0, 'next_at', sh_step_floor(1), 'answers', 0, 'correct', 0, 'days', 0, 'badges', '[]'::jsonb);
  end if;
  t := sh_tier(x.xp); st := sh_step(x.xp);
  select count(*) + 1 into pos from xp_visitors o where o.xp > x.xp;
  select count(*) into everyone from xp_visitors;
  select coalesce(v.best_days, 0) into best_days from xp_visitors v where v.visitor_id = p_visitor;
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

create or replace function public.get_trophy_stats()
returns table(kind text, n integer, total integer)
language sql stable security definer set search_path = public as $$
  with v as (select visitor_id, answers, best_days from xp_visitors),
  br as (select visitor_id, max(best_streak) as best_run from correct_streaks group by visitor_id),
  eg as (select visitor_id, count(*) filter (where e.kind = 'fairy') as fairies, count(*) filter (where e.kind = 'golden') as goldens
         from egg_events e group by visitor_id),
  ar as (select visitor_id, count(*) as plays from arcade_scores group by visitor_id),
  comp as (
    select 'answers-100'::text as k, count(*) filter (where answers >= 100) as c from v
    union all select 'answers-1000', count(*) filter (where answers >= 1000) from v
    union all select 'days-7', count(*) filter (where best_days >= 7) from v
    union all select 'days-30', count(*) filter (where best_days >= 30) from v
    union all select 'run-25', count(*) filter (where best_run >= 25) from br
    union all select 'run-100', count(*) filter (where best_run >= 100) from br
    union all select 'golden', count(*) filter (where goldens > 0) from eg
    union all select 'fairy', count(*) filter (where fairies > 0) from eg
    union all select 'fairy-5', count(*) filter (where fairies >= 5) from eg
    union all select 'arcade-25', count(*) filter (where plays >= 25) from ar
    union all select a.kind, count(distinct a.visitor_id) from achievements a where a.kind <> 'pet-adopt' group by a.kind
  )
  select k, c::integer, (select count(*) from v)::integer from comp;
$$;

create or replace function public.get_pet_days(p_visitor text)
returns table(d date, attempts integer, correct integer)
language sql stable security definer set search_path = public as $$
  /* xp_days supplies whole Central-time days. The one cutoff day comes from
     personal_answers so this keeps the original rolling 70-day boundary exact. */
  with edge as (
    select now() - interval '70 days' as at,
      ((now() - interval '70 days') at time zone 'America/Chicago')::date as d
  )
  select z.d, z.attempts, z.correct from (
    select x.d, x.n::integer as attempts, x.c::integer as correct
    from xp_days x, edge e
    where x.visitor_id = p_visitor and x.d > e.d
    union all
    select (a.answered_at at time zone 'America/Chicago')::date,
      count(*)::integer, count(*) filter (where a.correct)::integer
    from personal_answers a, edge e
    where a.visitor_id = p_visitor and a.answered_at > e.at
      and (a.answered_at at time zone 'America/Chicago')::date = e.d
    group by 1
  ) z order by z.d;
$$;

-- ---------- 3. one safe eager-load payload for the shared widget ----------
-- Deliberately absent: get_rank_profile, rank/arcade/leaderboards, get_hub_mastery, and
-- get_trophy_stats.  Those stay panel-open work so a normal hub visit is not a class-wide read.
drop function if exists public.get_widget_bootstrap(text, text, text, text, boolean);
drop function if exists public.get_widget_bootstrap(text, text, text, text);
drop function if exists public.get_widget_bootstrap(text, text, text, text, boolean, boolean, text, date);
create or replace function public.get_widget_bootstrap(
  p_visitor text,
  p_hub text default null,
  p_cavity_week text default null,
  p_episode text default null,
  p_include_pins boolean default false,
  p_dashboard boolean default false,
  p_luck_hub text default null,
  p_luck_date date default null,
  p_link_name text default null
)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  valid_visitor boolean := p_visitor is not null and length(p_visitor) between 1 and 80;
  valid_hub boolean := p_hub is not null and p_hub ~ '^[a-z0-9][a-z0-9-]{0,39}$';
begin
  if not valid_visitor then
    return jsonb_build_object('display_name', null, 'answers', '[]'::jsonb, 'pins', '[]'::jsonb,
      'inbox', '[]'::jsonb, 'survey', '[]'::jsonb, 'overrides', '[]'::jsonb,
      'pet_days', '[]'::jsonb, 'cavity', '[]'::jsonb, 'podcast', null,
      'dashboard_week', '[]'::jsonb, 'survey_popup', '[]'::jsonb, 'exam_luck', null,
      'recaps', '[]'::jsonb, 'golden', '[]'::jsonb, 'name_shared', false);
  end if;

  return jsonb_build_object(
    'display_name', get_display_name(p_visitor),
    'answers', case when valid_hub then get_my_answers(p_visitor, p_hub) else '[]'::jsonb end,
    'pins', case when valid_hub and p_include_pins then get_my_pins(p_visitor, p_hub) else '[]'::jsonb end,
    'inbox', coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox(p_visitor) i), '[]'::jsonb),
    'survey', coalesce((select jsonb_agg(to_jsonb(s) order by s.starts_at desc) from get_my_survey(p_visitor) s), '[]'::jsonb),
    'overrides', coalesce((select jsonb_agg(to_jsonb(o) order by o.hub) from get_hub_overrides() o), '[]'::jsonb),
    'pet_days', coalesce((select jsonb_agg(to_jsonb(d) order by d.d) from get_pet_days(p_visitor) d), '[]'::jsonb),
    'cavity', case when valid_hub and p_cavity_week ~ '^\d{4}-W\d{2}$' then
      coalesce((select jsonb_agg(to_jsonb(c) order by c.claimed_at) from get_cavity_week(p_hub, p_cavity_week) c), '[]'::jsonb)
      else '[]'::jsonb end,
    'podcast', case when valid_hub and length(coalesce(p_episode, '')) between 1 and 80
      then pod_feed(p_hub, p_episode, p_visitor) else null end,
    'dashboard_week', case when p_dashboard then coalesce((
      select jsonb_agg(jsonb_build_object('answer_date', x.answer_date, 'attempts', x.attempts, 'correct', x.correct) order by x.answer_date)
      from (
        select (a.answered_at at time zone 'America/Chicago')::date as answer_date,
          count(*)::integer as attempts, count(*) filter (where a.correct)::integer as correct
        from personal_answers a
        where a.visitor_id = p_visitor
          and (a.answered_at at time zone 'America/Chicago')::date >= (now() at time zone 'America/Chicago')::date - 13
        group by 1
      ) x
    ), '[]'::jsonb) else '[]'::jsonb end,
    'survey_popup', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(s) order by s.id) from get_active_survey(p_visitor) s
    ), '[]'::jsonb) else '[]'::jsonb end,
    'exam_luck', case when p_dashboard and length(coalesce(p_luck_hub, '')) between 1 and 40 and p_luck_date is not null
      then get_exam_luck(p_luck_hub, p_luck_date, p_visitor) else null end,
    'recaps', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(r) order by r.published_at desc) from get_published_recaps() r
    ), '[]'::jsonb) else '[]'::jsonb end,
    'golden', case when p_dashboard then coalesce((
      select jsonb_agg(to_jsonb(g) order by g.claimed_at) from get_golden_today() g
    ), '[]'::jsonb) else '[]'::jsonb end,
    'name_shared', case when length(btrim(coalesce(p_link_name, ''))) between 1 and 24
      then name_shared(p_visitor, p_link_name) else false end
  );
end;
$$;
revoke all on function public.get_widget_bootstrap(text, text, text, text, boolean, boolean, text, date, text) from public;
grant execute on function public.get_widget_bootstrap(text, text, text, text, boolean, boolean, text, date, text) to anon, authenticated;
