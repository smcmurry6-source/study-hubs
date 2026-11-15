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
      -- select ... into left previous_raw null when the day had no row yet; a null here would make
      -- least(previous_raw + raw_delta, 600) read 600 and drop this answer's XP from the cache.
      previous_raw := 0;
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
-- The visitor's own rank profile and hub mastery are included (Sam, 2026-11-06): with xp_visitors they are cheap
-- per-visitor reads, and they drive the badge by the name, the rank-up and trophy cards and the mastery medals.
-- Deliberately absent: the rank board, arcade and leaderboards, and get_trophy_stats.  Those are class-wide and
-- stay panel-open work.
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
      'recaps', '[]'::jsonb, 'golden', '[]'::jsonb, 'name_shared', false, 'rank', null, 'mastery', '[]'::jsonb);
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
      then name_shared(p_visitor, p_link_name) else false end,
    'rank', get_rank_profile(p_visitor),
    'mastery', case when valid_hub then
      coalesce((select jsonb_agg(to_jsonb(m) order by m.hub) from get_hub_mastery(p_visitor) m), '[]'::jsonb)
      else '[]'::jsonb end
  );
end;
$$;
revoke all on function public.get_widget_bootstrap(text, text, text, text, boolean, boolean, text, date, text) from public;
grant execute on function public.get_widget_bootstrap(text, text, text, text, boolean, boolean, text, date, text) to anon, authenticated;

-- v54, section 0 only (2026-11-06): BUG-049, applied to the live project on its own ahead of the rest of migration_v54.sql
-- (Sam's OK; the rest waits in supabase/pending-migrations.txt for the release). v53's get_widget_bootstrap sent Timmy's
-- days as bare dates (to_jsonb over an alias that is also a column name); the alias is renamed. Same signature and grants.
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
      'recaps', '[]'::jsonb, 'golden', '[]'::jsonb, 'name_shared', false, 'rank', null, 'mastery', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'display_name', get_display_name(p_visitor),
    'answers', case when valid_hub then get_my_answers(p_visitor, p_hub) else '[]'::jsonb end,
    'pins', case when valid_hub and p_include_pins then get_my_pins(p_visitor, p_hub) else '[]'::jsonb end,
    'inbox', coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox(p_visitor) i), '[]'::jsonb),
    'survey', coalesce((select jsonb_agg(to_jsonb(s) order by s.starts_at desc) from get_my_survey(p_visitor) s), '[]'::jsonb),
    'overrides', coalesce((select jsonb_agg(to_jsonb(o) order by o.hub) from get_hub_overrides() o), '[]'::jsonb),
    'pet_days', coalesce((select jsonb_agg(to_jsonb(pd) order by pd.d) from get_pet_days(p_visitor) pd), '[]'::jsonb),
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
      then name_shared(p_visitor, p_link_name) else false end,
    'rank', get_rank_profile(p_visitor),
    'mastery', case when valid_hub then
      coalesce((select jsonb_agg(to_jsonb(m) order by m.hub) from get_hub_mastery(p_visitor) m), '[]'::jsonb)
      else '[]'::jsonb end
  );
end;
$$;

-- ======================================================================================================================
-- >>> the redesign's release <<<
-- Everything below was applied together at the redesign's release (2026-11; vault/tasks/2026-11-06-redesign-release.md),
-- in this order: migration_v54.sql (the game layer's server), migration_v55.sql (Ask Timmy), migration_v56.sql (Learn and
-- Flashcards), migration_v57.sql (Visit someone random), migration_v58.sql (hidden ideas kept 90 days). The marker line
-- above is read by tools/release/pg.js: tools/release/xp.js builds the database as it was before the release, puts
-- made-up history in it, and then applies the rest, the way the live project met these migrations. Don't remove it.
-- ======================================================================================================================

-- ====================================================================== migration_v54.sql
-- v54 (2026-11-06): the game layer's server. Written and tested on a throwaway copy of supabase/schema.sql
-- (tools/release/rls.js, tools/release/xp.js); applied to the live project at the redesign's release, not before
-- (vault/tasks/2026-11-06-redesign-release.md). Until then it is listed in supabase/pending-migrations.txt.
--
-- Section 0 fixes today's bootstrap (BUG-049, vault/release/bug-log.md). It was applied to the live project on its own on
-- 2026-11-06 (Sam's OK) and is in supabase/schema.sql; at the release it changes nothing.
--
-- What it adds (the notes: vault/tasks/2026-11-06-redesign-progression-journeys.md, -redesign-timmy-shop.md,
-- -redesign-timmys-place.md, 2026-11-06-idea-board.md; how it works: vault/reference/game-server.md):
--   1. the switch time (game_config) and each visitor's baseline at the switch, so nothing is paid twice or back paid;
--   2. question_keys: the right answer of every question, so the server decides right or wrong;
--   3. XP without a daily cap, as award rows with a unique key (xp_awards), with the guardrails (a speed limit, three
--      paying right answers per question per day), every new source (the day's 20th answer, a fixed miss, a finished
--      mock, a hub mastery medal, Timmy Time minutes, a finished arcade game, a fixed report) and the double-XP boosts;
--      Link my devices (sh_xp_rebuild) replays it all;
--   4. the 63-step ladder (three journeys: Handpiece, ModuPro, Loupes), the rank profile, boards and leaderboards with it;
--   5. Shiny Gold Crowns (worked out from XP), the shop catalog and its rotation, buy_item, equip_item, the inventory,
--      HP from snacks and floss, the rare-costume log; and since 2026-11-10 (Sam's third round,
--      vault/tasks/2026-11-10-redesign-timmys-place-round-3.md): a full set for every season, on sale in its window
--      (sh_shop_seasons), Halloween's set as everyone's gift, a set earned at every full rank-up, two throwback days a
--      month, and visiting someone's place from the boards (get_place; everyone can be visited, no opt-out);
--   6. the idea board (ideas, votes, reports, statuses with Inbox notes);
--   7. the bootstrap with all of it.
--
-- Beside today's functions, not instead of them: record_personal_answer, record_achievement, get_rank_profile,
-- get_widget_bootstrap, get_pet_days, get_my_inbox, set_report_resolved and the boards keep today's rules (the 600-a-day
-- cap included) for every page that still calls them. The new pages call the *_v2 functions and the new ones below.
-- Three of today's functions are replaced with versions that behave the same while the new tables are empty:
-- sh_xp_on_insert (skips the capped answer XP for a v2 answer, which is paid by its award instead), sh_xp_rebuild
-- (adds the award rows and replays the v2 answers) and redeem_link_code (also moves the new tables).
--
-- No XP back pay (Sam, 2026-11-06): answers recorded before the switch keep what they paid, and a medal reached before it
-- earns no XP or boost. The gold crowns follow all XP, old and new (the shop opens with what XP already earned); the
-- one-time grants (trophies, medals, rank-ups) count from the switch on.
--
-- Every new table has row-level security on and no policy: only the functions below reach them.

-- ====================================================================== 0. a fix for today's bootstrap (BUG-049)
-- migration_v53's get_widget_bootstrap sent Timmy's days as bare dates (["2026-11-06"]): to_jsonb(d) over a row aliased d
-- that also has a column d turns the column into JSON, not the row. widget/pet.js then read 0 answers for every day and
-- worked out HP from this device's own tally only. Same function, same signature, the alias renamed. Applied on its own
-- on 2026-11-06, so at the release this statement changes nothing.
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
      'recaps', '[]'::jsonb, 'golden', '[]'::jsonb, 'name_shared', false, 'rank', null, 'mastery', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'display_name', get_display_name(p_visitor),
    'answers', case when valid_hub then get_my_answers(p_visitor, p_hub) else '[]'::jsonb end,
    'pins', case when valid_hub and p_include_pins then get_my_pins(p_visitor, p_hub) else '[]'::jsonb end,
    'inbox', coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox(p_visitor) i), '[]'::jsonb),
    'survey', coalesce((select jsonb_agg(to_jsonb(s) order by s.starts_at desc) from get_my_survey(p_visitor) s), '[]'::jsonb),
    'overrides', coalesce((select jsonb_agg(to_jsonb(o) order by o.hub) from get_hub_overrides() o), '[]'::jsonb),
    'pet_days', coalesce((select jsonb_agg(to_jsonb(pd) order by pd.d) from get_pet_days(p_visitor) pd), '[]'::jsonb),
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
      then name_shared(p_visitor, p_link_name) else false end,
    'rank', get_rank_profile(p_visitor),
    'mastery', case when valid_hub then
      coalesce((select jsonb_agg(to_jsonb(m) order by m.hub) from get_hub_mastery(p_visitor) m), '[]'::jsonb)
      else '[]'::jsonb end
  );
end;
$$;

-- ====================================================================== 1. the switch and the baseline
create table if not exists public.game_config (
  id boolean primary key default true check (id),
  v2_at timestamptz not null default now()          -- when the new rules started (this migration ran)
);
insert into public.game_config (id, v2_at) values (true, now()) on conflict (id) do nothing;

-- what each visitor had at the switch: the gold-crown grants count trophies, medals and rank-ups beyond it
create table if not exists public.game_baseline (
  visitor_id text primary key,
  xp integer not null default 0,
  badges text[] not null default '{}',
  at timestamptz not null default now()
);

create or replace function public.sh_v2_at()
returns timestamptz language sql stable security definer set search_path = public as $$
  select coalesce((select v2_at from game_config where id), now());
$$;

-- ====================================================================== 2. the answer keys
-- One row per question version. kind: 'one' (one right choice), 'all' (select all: the set of right choices), 'order'
-- (put in order: the right order of the authored steps), 'self' (graded by the student: recall cards, matching).
-- answer holds authored choice indexes, as record_choice gets them. counted = false keeps a question out of the hub's
-- mastery medal (review-only questions, such as Heme & Endo Exam 2's Exam 1 Refresher). Loaded from the hubs' content at
-- the release (admin_load_question_keys); the client sends the version it showed (question health's fingerprint), so a
-- page cached before an edit is still graded against the key it showed.
create table if not exists public.question_keys (
  hub text not null,
  qid text not null,
  v text not null default '',
  kind text not null check (kind in ('one', 'all', 'order', 'self')),
  answer smallint[] not null default '{}',
  counted boolean not null default true,
  is_current boolean not null default true,
  retired boolean not null default false,
  loaded_at timestamptz not null default now(),
  primary key (hub, qid, v)
);
create unique index if not exists question_keys_current on public.question_keys (hub, qid) where is_current;

create or replace function public.sh_key(p_hub text, p_qid text, p_v text)
returns setof public.question_keys language sql stable security definer set search_path = public as $$
  select * from question_keys k
  where k.hub = p_hub and k.qid = p_qid and (k.v = coalesce(p_v, '') or k.is_current)
  order by (k.v = coalesce(p_v, '')) desc, k.is_current desc
  limit 1;
$$;

-- p_keys: [{"id": "q1", "v": "<fingerprint>", "kind": "one", "answer": [2], "counted": true}, {"id": "q9", "retired": true}]
-- p_retire_missing: a current key of this hub missing from p_keys is retired (its id is out of use for good).
create or replace function public.admin_load_question_keys(p_secret text, p_hub text, p_keys jsonb, p_retire_missing boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it jsonb; v_id text; v_v text; v_kind text; v_ans smallint[]; n_loaded int := 0; n_retired int := 0; k int; ids text[] := '{}';
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' then raise exception 'bad hub id'; end if;
  if jsonb_typeof(p_keys) is distinct from 'array' then raise exception 'p_keys must be a JSON array'; end if;
  for it in select * from jsonb_array_elements(p_keys) loop
    v_id := it->>'id';
    if v_id is null or length(v_id) not between 1 and 80 then raise exception 'bad question id: %', left(coalesce(v_id, 'null'), 90); end if;
    ids := ids || v_id;
    if coalesce((it->>'retired')::boolean, false) then
      update question_keys set retired = true where hub = p_hub and qid = v_id and not retired;
      get diagnostics k = row_count; n_retired := n_retired + k;
      continue;
    end if;
    v_kind := it->>'kind';
    v_v := left(coalesce(it->>'v', ''), 40);
    v_ans := array(select x::smallint from jsonb_array_elements_text(coalesce(it->'answer', '[]'::jsonb)) x);
    if v_kind = 'one' and not (cardinality(v_ans) = 1 and v_ans[1] between 0 and 19) then raise exception '%: a one-choice key needs one answer', v_id; end if;
    if v_kind = 'all' and not (cardinality(v_ans) between 1 and 20 and (select bool_and(x between 0 and 19) and count(distinct x) = count(*) from unnest(v_ans) x))
      then raise exception '%: a select-all key needs distinct answers 0-19', v_id; end if;
    if v_kind = 'order' and not (cardinality(v_ans) between 2 and 20 and (select array_agg(x order by x) from unnest(v_ans) x) = (select array_agg(g::smallint) from generate_series(0, cardinality(v_ans) - 1) g))
      then raise exception '%: an order key is the steps 0..n-1 in their right order', v_id; end if;
    if v_kind = 'self' then v_ans := '{}'; end if;
    if v_kind is null or v_kind not in ('one', 'all', 'order', 'self') then raise exception '%: bad kind %', v_id, coalesce(v_kind, 'null'); end if;
    update question_keys set is_current = false where hub = p_hub and qid = v_id and v <> v_v and is_current;
    insert into question_keys (hub, qid, v, kind, answer, counted, is_current, retired, loaded_at)
      values (p_hub, v_id, v_v, v_kind, v_ans, coalesce((it->>'counted')::boolean, true), true, false, now())
      on conflict (hub, qid, v) do update set kind = excluded.kind, answer = excluded.answer, counted = excluded.counted,
        is_current = true, retired = false, loaded_at = now();
    n_loaded := n_loaded + 1;
  end loop;
  if p_retire_missing then
    update question_keys set retired = true where hub = p_hub and is_current and not retired and not (qid = any(ids));
    get diagnostics k = row_count; n_retired := n_retired + k;
  end if;
  return jsonb_build_object('hub', p_hub, 'loaded', n_loaded, 'retired', n_retired,
    'keys', (select count(*) from question_keys where hub = p_hub and is_current and not retired));
end;
$$;

-- ====================================================================== 3. XP: awards, boosts, sessions
-- Every XP payment after the switch is a row with a unique key, so a reload, a double tap or a replayed call can't pay
-- twice. xp = base * the boost multiplier at the time; base is what the gold crowns count.
create table if not exists public.xp_awards (
  visitor_id text not null,
  key text not null,
  src text not null check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report')),
  hub text not null default '',
  base integer not null check (base > 0),
  xp integer not null check (xp >= base),
  at timestamptz not null,
  d date not null,
  primary key (visitor_id, key)
);
create index if not exists xp_awards_src on public.xp_awards (visitor_id, src, at);

-- double XP: 24 hours on each new hub mastery medal ('medal'), or bought in the shop ('shop'); never more than 2x at once
create table if not exists public.xp_boosts (
  visitor_id text not null,
  key text not null,
  src text not null check (src in ('medal', 'shop')),
  mult smallint not null default 2 check (mult between 2 and 3),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  primary key (visitor_id, key)
);

-- a mock exam or an arcade game in progress, so its answers and its end can be checked
create table if not exists public.xp_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  hub text not null,
  kind text not null check (kind in ('mock', 'arcade')),
  game text,
  started_at timestamptz not null,
  finished_at timestamptz
);
create index if not exists xp_sessions_visitor on public.xp_sessions (visitor_id, started_at);

-- what the server knew about each answer recorded by record_answer_v2 (a personal_answers row without one is a
-- record_personal_answer answer, paid by today's capped rules)
create table if not exists public.answer_xp (
  answer_id bigint primary key references public.personal_answers (id) on delete cascade,
  request_id text,
  session_id uuid,
  ctx text not null,
  kind text not null check (kind in ('one', 'all', 'order', 'self', 'unknown', 'retired')),
  resp jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists answer_xp_request on public.answer_xp (request_id) where request_id is not null;
create index if not exists answer_xp_session on public.answer_xp (session_id) where session_id is not null;

-- the boost multiplier at a moment: a boost counts from just after it starts
create or replace function public.sh_xp_mult(p_visitor text, p_at timestamptz)
returns integer language sql stable security definer set search_path = public as $$
  select least(2, coalesce(max(b.mult), 1))::integer from xp_boosts b
  where b.visitor_id = p_visitor and b.starts_at < p_at and b.ends_at > p_at;
$$;

create or replace function public.sh_boost_json(p_visitor text, p_at timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when count(*) = 0 then null else jsonb_build_object('mult', least(2, max(b.mult)), 'until', max(b.ends_at),
    'src', (array_agg(b.src order by b.ends_at desc))[1]) end
  from xp_boosts b where b.visitor_id = p_visitor and b.starts_at < p_at and b.ends_at > p_at;
$$;

-- pays one award once; returns the XP paid (0 when the key was paid before)
create or replace function public.sh_award(p_visitor text, p_key text, p_src text, p_hub text, p_base integer, p_mult integer, p_at timestamptz)
returns integer language plpgsql security definer set search_path = public as $$
declare paid int := coalesce(p_base, 0) * greatest(1, coalesce(p_mult, 1));
begin
  if p_visitor is null or coalesce(p_base, 0) <= 0 then return 0; end if;
  insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d)
    values (p_visitor, p_key, p_src, coalesce(p_hub, ''), p_base, paid, p_at, (p_at at time zone 'America/Chicago')::date)
    on conflict (visitor_id, key) do nothing;
  if not found then return 0; end if;
  insert into xp_visitors (visitor_id, xp) values (p_visitor, paid)
    on conflict (visitor_id) do update set xp = xp_visitors.xp + excluded.xp;
  return paid;
end;
$$;

-- ---------- today's answer trigger, with one change: a v2 answer (record_answer_v2 sets sh.xp_v2) adds no capped answer
-- XP, since its award pays it. It still counts toward the day (+20 once a day, as before), the totals and the pet days.
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
  if current_setting('sh.xp_v2', true) = 'on' then raw_delta := 0; end if;   -- v54: paid by its award instead
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
      previous_raw := 0;
      exit;
    exception when unique_violation then
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

-- ---------- the replay: what record_answer_v2 paid for each v2 answer, worked out again from the answers alone ----------
-- The same rules as sh_answer below, in one pass: the speed limit (2 seconds since your last answer, at most 30 in a
-- minute; a mock's answers instead need 2 seconds of mock time each), three paying right (and three paying wrong)
-- answers per question per day, 10 for a question's first right answer ever, the day's 20th answer, a fixed miss, and
-- the boost multiplier at the time. For one device it gives exactly what the live calls paid (tools/release/xp.js checks);
-- after Link my devices it gives what one device with both histories would have earned.
create or replace function public.sh_xp_replay(p_ids text[])
returns table(visitor_id text, key text, src text, hub text, base integer, xp integer, at timestamptz, d date)
language sql stable security definer set search_path = public as $$
  with pa as (
    select a.id, a.visitor_id, a.hub, a.qid, a.correct, a.answered_at as t,
      (a.answered_at at time zone 'America/Chicago')::date as d,
      x.answer_id is not null as v2, x.kind, x.session_id, s.kind as s_kind, s.started_at as s_start
    from personal_answers a
    left join answer_xp x on x.answer_id = a.id
    left join xp_sessions s on s.id = x.session_id
    where a.visitor_id = any(p_ids)
  ), w as (
    select pa.*,
      lag(pa.t) over (partition by pa.visitor_id order by pa.t, pa.id) as prev_t,
      count(*) filter (where coalesce(pa.s_kind, '') <> 'mock')
        over (partition by pa.visitor_id order by pa.t range between interval '60 seconds' preceding and current row) as n60,
      row_number() over (partition by pa.session_id order by pa.t, pa.id) as s_rank,
      row_number() over (partition by pa.session_id, pa.qid order by pa.t, pa.id) as s_qrank,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d, pa.correct order by pa.t, pa.id) as rn_same,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.d order by pa.t, pa.id) as rn_all,
      row_number() over (partition by pa.visitor_id, pa.hub, pa.qid, pa.correct order by pa.t, pa.id) as rn_ever,
      row_number() over (partition by pa.visitor_id, pa.d order by pa.t, pa.id) as pos_day,
      lag(pa.correct) over (partition by pa.visitor_id, pa.hub, pa.qid order by pa.t, pa.id) as prev_c,
      lag(pa.d) over (partition by pa.visitor_id, pa.hub, pa.qid order by pa.t, pa.id) as prev_d
    from pa
  ), e as (
    select w.*,
      coalesce(w.v2 and w.kind in ('one', 'all', 'order', 'self') and case
        when w.s_kind = 'mock' then w.s_qrank = 1 and w.s_rank <= 300 and w.t - w.s_start >= w.s_rank * interval '2 seconds'
        else (w.prev_t is null or w.t - w.prev_t >= interval '2 seconds') and w.n60 <= 30 end, false) as ok,
      max(case when w.prev_d is distinct from w.d then case when w.prev_c then 1 when not w.prev_c then 0 end end)
        over (partition by w.visitor_id, w.hub, w.qid, w.d) as day_prev
    from w
  ), b as (
    select e.*,
      case when not e.ok then 0
        when e.kind = 'self' then case when e.rn_all <= 3 then 2 else 0 end
        when e.correct then case when e.rn_same <= 3 then case when e.rn_ever = 1 then 10 else 2 end else 0 end
        else case when e.rn_same <= 3 then 1 else 0 end end as base_xp,
      sh_xp_mult(e.visitor_id, e.t) as mult
    from e
  )
  select b.visitor_id, 'a:' || b.id, 'answer'::text, b.hub, b.base_xp, b.base_xp * b.mult, b.t, b.d from b where b.base_xp > 0
  union all
  select g.visitor_id, 'g20:' || g.d, 'goal20'::text, g.hub, 30, 30 * g.mult, g.t, g.d from (
    select distinct on (b.visitor_id, b.d) b.visitor_id, b.d, b.hub, b.mult, b.t from b
    where b.ok and b.pos_day >= 20 order by b.visitor_id, b.d, b.t, b.id) g
  union all
  select f.visitor_id, 'fix:' || f.hub || ':' || f.qid, 'fix'::text, f.hub, 5, 5 * f.mult, f.t, f.d from (
    select distinct on (b.visitor_id, b.hub, b.qid) b.visitor_id, b.hub, b.qid, b.mult, b.t, b.d from b
    where b.ok and b.correct and b.kind <> 'self' and b.day_prev = 0 order by b.visitor_id, b.hub, b.qid, b.t, b.id) f;
$$;

-- ---------- the rebuild (after a correction, a deletion or Link my devices): today's capped XP for the answers recorded the
-- old way, the replayed awards for the v2 answers, and every other award row as it stands.
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
        row_number() over (partition by a.visitor_id, a.hub, a.qid, a.correct order by a.answered_at) as rn,
        exists (select 1 from answer_xp x where x.answer_id = a.id) as v2
      from personal_answers a where a.visitor_id = any(p_ids)
    )
    select visitor_id, d, count(*)::integer, count(*) filter (where correct)::integer,
      coalesce(sum(case when v2 then 0 when correct and rn = 1 then 10 when correct then 2 else 1 end), 0)::integer
    from pa group by 1, 2;

  delete from xp_awards where visitor_id = any(p_ids) and src in ('answer', 'goal20', 'fix');
  insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d)
    select r.visitor_id, r.key, r.src, r.hub, r.base, r.xp, r.at, r.d from sh_xp_replay(p_ids) r
    on conflict (visitor_id, key) do nothing;

  insert into xp_visitors (visitor_id, xp, days, answers, correct, best_days)
    with totals as (
      select visitor_id, sum(least(raw, 600) + 20)::integer as xp, count(*)::integer as days,
        sum(n)::integer as answers, sum(c)::integer as correct
      from xp_days where visitor_id = any(p_ids) group by visitor_id
    ), aw as (
      select visitor_id, sum(xp)::integer as xp from xp_awards where visitor_id = any(p_ids) group by visitor_id
    ), ids as (
      select visitor_id from totals union select visitor_id from aw
    ), islands as (
      select visitor_id, d, d - row_number() over (partition by visitor_id order by d)::integer as grp
      from xp_days where visitor_id = any(p_ids)
    ), best as (
      select visitor_id, max(len)::integer as best_days
      from (select visitor_id, grp, count(*)::integer as len from islands group by 1, 2) runs
      group by visitor_id
    )
    select i.visitor_id, coalesce(t.xp, 0) + coalesce(a.xp, 0), coalesce(t.days, 0), coalesce(t.answers, 0),
      coalesce(t.correct, 0), coalesce(b.best_days, 0)
    from ids i left join totals t using (visitor_id) left join aw a using (visitor_id) left join best b using (visitor_id);
end;
$$;

-- ---------- a hub mastery medal, worked out from the server-checked answers ----------
-- The share of the hub's counted questions whose latest answer is right: Bronze 50%, Silver 75%, Gold 90%, Crown 100%.
-- Each new medal pays +100/+200/+300/+500 (not boosted) and starts 24 hours of double XP (a new medal during a boost
-- restarts the 24 hours). A medal reached before the switch pays nothing (no back pay).
create or replace function public.sh_medal_check(p_visitor text, p_hub text, p_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare bank int; got int; lvl int := 0; i int; kinds text[] := array['mastery-bronze', 'mastery-silver', 'mastery-gold', 'mastery-crown'];
  pays int[] := array[100, 200, 300, 500]; c timestamptz; paid int; total int := 0; newest int := 0;
begin
  select count(*) into bank from question_keys k where k.hub = p_hub and k.is_current and not k.retired and k.counted;
  if bank = 0 then return null; end if;
  select count(*) filter (where l.correct) into got from (
    select distinct on (a.qid) a.qid, a.correct from personal_answers a
    where a.visitor_id = p_visitor and a.hub = p_hub order by a.qid, a.answered_at desc, a.id desc
  ) l join question_keys k on k.hub = p_hub and k.qid = l.qid and k.is_current and not k.retired and k.counted;
  lvl := case when got >= bank then 4 when got * 10 >= bank * 9 then 3 when got * 4 >= bank * 3 then 2 when got * 2 >= bank then 1 else 0 end;
  for i in 1..lvl loop
    c := null;
    select a.created_at into c from achievements a where a.visitor_id = p_visitor and a.kind = kinds[i] and a.hub = p_hub;
    if c is not null and c < sh_v2_at() then continue; end if;
    if c is null then
      insert into achievements (visitor_id, kind, hub, created_at) values (p_visitor, kinds[i], p_hub, p_at) on conflict do nothing;
    end if;
    paid := sh_award(p_visitor, 'medal:' || p_hub || ':' || i, 'medal', p_hub, pays[i], 1, p_at);
    if paid > 0 then
      insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
        values (p_visitor, 'mb:' || p_hub || ':' || i, 'medal', 2, p_at, p_at + interval '24 hours')
        on conflict (visitor_id, key) do nothing;
      total := total + paid; newest := i;
    end if;
  end loop;
  if newest = 0 then return null; end if;
  return jsonb_build_object('kind', kinds[newest], 'level', newest, 'xp', total, 'boost_until', p_at + interval '24 hours');
end;
$$;

-- ---------- one answer, checked and paid by the server ----------
-- p_choice: the picked choice's authored index (one-choice questions); p_picks: the ticked indexes (select all) or the
-- order of the authored steps as placed (put in order); p_self: the student's own grade (recall cards, matching);
-- p_v: the question's version as shown; p_ctx: where it was answered (bank, drill, weak, misses, mock, arcade, check,
-- review, case); p_request: a random id per answer, so a retried or replayed call records and pays once; p_session: the
-- mock or arcade game it belongs to (xp_session_start); p_claim: the page's own verdict, used only for a question the
-- server has no key for (recorded for class stats and your progress, never paid). p_at is null except in the tests.
create or replace function public.sh_answer(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_choice integer,
  p_picks integer[], p_self boolean, p_v text, p_ctx text, p_request text, p_session uuid, p_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  k public.question_keys; v_kind text; v_ctx text; v_ok boolean; v_correct boolean; v_at timestamptz;
  s public.xp_sessions; s_ok boolean := false; s_n int := 0; s_dup boolean := false;
  aid bigint; dd date; prev_t timestamptz; n60 int; rn_same int; rn_all int; rn_ever int := 0; pos_day int; dp boolean;
  speed_ok boolean := false; v_base int := 0; v_mult int := 1; paid int := 0; v_n int; why text; bonus jsonb := '[]'::jsonb;
  medal jsonb; v_resp jsonb; prev record;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qid is null or length(p_qid) not between 1 and 80
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$')
     or (p_picks is not null and (cardinality(p_picks) > 20 or exists (select 1 from unnest(p_picks) z where z is null or z not between 0 and 19)))
     or (p_choice is not null and p_choice not between 0 and 19) then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  v_ctx := case when p_ctx in ('bank', 'drill', 'weak', 'misses', 'mock', 'arcade', 'check', 'review', 'case') then p_ctx else 'other' end;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());

  -- the same answer again (a retry, a reload, a replayed call): what it got the first time, nothing new
  if p_request is not null then
    select x.resp, a.visitor_id into prev from answer_xp x join personal_answers a on a.id = x.answer_id where x.request_id = p_request;
    if found then
      if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
      return jsonb_build_object('ok', false, 'error', 'dup');
    end if;
  end if;

  -- right or wrong, from the key
  select * into k from sh_key(p_hub, p_qid, p_v);
  v_kind := case when k.qid is null then 'unknown' when k.retired then 'retired' else k.kind end;
  if v_kind = 'one' then
    if p_choice is null and coalesce(cardinality(p_picks), 0) <> 1 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := coalesce(p_choice, p_picks[1]) = k.answer[1];
  elsif v_kind = 'all' then
    if p_picks is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    v_correct := (select coalesce(array_agg(distinct z order by z), '{}') from unnest(p_picks) z)
               = (select array_agg(distinct z::int order by z::int) from unnest(k.answer) z);
  elsif v_kind = 'order' then
    v_correct := p_picks is not null and p_picks = k.answer::integer[];
  elsif v_kind = 'self' then
    v_correct := coalesce(p_self, p_claim, false);
  else
    v_correct := coalesce(p_claim, false);
  end if;

  -- the mock or arcade game it belongs to: this visitor's, this hub's, started within 6 hours, not finished long ago
  if p_session is not null then
    select * into s from xp_sessions where id = p_session and visitor_id = p_visitor and hub = p_hub
      and started_at <= v_at and started_at > v_at - interval '6 hours'
      and (finished_at is null or finished_at > v_at - interval '10 minutes');
    if found then
      s_ok := true;
      select count(*), coalesce(bool_or(a.qid = p_qid), false) into s_n, s_dup
        from answer_xp x join personal_answers a on a.id = x.answer_id where x.session_id = p_session;
    end if;
  end if;

  -- record it as the four calls a page makes today do: class stats, the class's picks, the right-in-a-row streak, your answers
  perform record_answer(p_hub, p_qid, v_correct);
  if p_choice is not null then perform record_choice(p_hub, p_qid, p_choice);
  elsif p_picks is not null and v_kind <> 'order' then
    if cardinality(p_picks) = 1 and v_kind <> 'all' then perform record_choice(p_hub, p_qid, p_picks[1]);
    else perform record_choices(p_hub, p_qid, p_picks); end if;
  end if;
  perform record_correct_streak(p_visitor, v_correct);
  perform set_config('sh.xp_v2', 'on', true);
  insert into personal_answers (visitor_id, hub, qid, correct, answered_at) values (p_visitor, p_hub, p_qid, v_correct, v_at)
    returning id into aid;
  perform set_config('sh.xp_v2', 'off', true);
  insert into answer_xp (answer_id, request_id, session_id, ctx, kind)
    values (aid, p_request, case when s_ok then p_session end, v_ctx, v_kind);
  dd := (v_at at time zone 'America/Chicago')::date;

  -- the guardrails: no key, no XP; then the speed limit
  if v_kind in ('one', 'all', 'order', 'self') then
    if s_ok and s.kind = 'mock' then
      speed_ok := not s_dup and s_n + 1 <= 300 and v_at - s.started_at >= (s_n + 1) * interval '2 seconds';
    else
      select max(a.answered_at) into prev_t from personal_answers a where a.visitor_id = p_visitor and a.id <> aid and a.answered_at <= v_at;
      select count(*) into n60 from personal_answers a
        left join answer_xp x on x.answer_id = a.id left join xp_sessions ss on ss.id = x.session_id
        where a.visitor_id = p_visitor and a.answered_at >= v_at - interval '60 seconds' and a.answered_at <= v_at
          and coalesce(ss.kind, '') <> 'mock';
      speed_ok := (prev_t is null or v_at - prev_t >= interval '2 seconds') and n60 <= 30;
    end if;
    if not speed_ok then why := 'fast'; end if;
  else
    why := v_kind;
  end if;

  if speed_ok then
    select count(*) filter (where a.correct = v_correct), count(*), count(*) filter (where a.correct)
      into rn_same, rn_all, v_n
      from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
        and (a.answered_at at time zone 'America/Chicago')::date = dd;
    if v_correct then select count(*) into rn_ever from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid and a.correct; end if;
    v_base := case when v_kind = 'self' then case when rn_all <= 3 then 2 else 0 end
                   when v_correct then case when rn_same <= 3 then case when rn_ever = 1 then 10 else 2 end else 0 end
                   else case when rn_same <= 3 then 1 else 0 end end;
    if v_base = 0 then why := 'repeat'; end if;
    v_mult := sh_xp_mult(p_visitor, v_at);
    paid := sh_award(p_visitor, 'a:' || aid, 'answer', p_hub, v_base, v_mult, v_at);
    -- the day's 20th answer
    select n into pos_day from xp_days where visitor_id = p_visitor and d = dd;
    if coalesce(pos_day, 0) >= 20 then
      v_n := sh_award(p_visitor, 'g20:' || dd, 'goal20', p_hub, 30, v_mult, v_at);
      if v_n > 0 then bonus := bonus || jsonb_build_object('src', 'goal20', 'xp', v_n); end if;
    end if;
    -- a question missed the last time you answered it before today, right today
    if v_correct and v_kind <> 'self' then
      select a.correct into dp from personal_answers a where a.visitor_id = p_visitor and a.hub = p_hub and a.qid = p_qid
        and (a.answered_at at time zone 'America/Chicago')::date < dd order by a.answered_at desc, a.id desc limit 1;
      if found and not dp then
        v_n := sh_award(p_visitor, 'fix:' || p_hub || ':' || p_qid, 'fix', p_hub, 5, v_mult, v_at);
        if v_n > 0 then bonus := bonus || jsonb_build_object('src', 'fix', 'xp', v_n); end if;
      end if;
    end if;
  end if;
  if v_kind in ('one', 'all', 'order', 'self') then medal := sh_medal_check(p_visitor, p_hub, v_at); end if;

  v_resp := jsonb_build_object('ok', true, 'correct', v_correct, 'kind', v_kind, 'xp', paid, 'base', v_base, 'mult', v_mult,
    'first', v_correct and rn_ever = 1 and paid > 0, 'why', why, 'bonus', bonus, 'medal', medal,
    'boost', sh_boost_json(p_visitor, v_at), 'total', (select xv.xp from xp_visitors xv where xv.visitor_id = p_visitor));
  update answer_xp set resp = v_resp where answer_id = aid;
  return v_resp;
end;
$$;

create or replace function public.record_answer_v2(p_visitor text, p_hub text, p_qid text, p_choice integer default null,
  p_picks integer[] default null, p_self boolean default null, p_v text default null, p_ctx text default null,
  p_request text default null, p_session uuid default null, p_claim boolean default null)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_answer(null, p_visitor, p_hub, p_qid, p_choice, p_picks, p_self, p_v, p_ctx, p_request, p_session, p_claim);
$$;

-- ---------- a mock exam or an arcade game: its start, then its end ----------
create or replace function public.sh_session_start(p_at timestamptz, p_visitor text, p_hub text, p_kind text, p_game text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := coalesce(p_at, clock_timestamp()); sid uuid;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_kind not in ('mock', 'arcade') then return null; end if;
  if p_kind = 'arcade' and coalesce(p_game, '') not in (
    'sort', 'snake', 'stack', 'match', 'hangman', 'fact', 'blaster', 'search', 'whack',
    'flappy', 'crusher', 'probe', 'quadrants', 'perdle', 'planer', 'smile', 'sweeper', 'cross',
    'board', 'cloze', 'escape') then return null; end if;   -- the games submit_arcade_score takes
  if (select count(*) from xp_sessions where visitor_id = p_visitor and started_at > v_at - interval '1 day') >= 200 then return null; end if;
  insert into xp_sessions (visitor_id, hub, kind, game, started_at)
    values (p_visitor, p_hub, p_kind, case when p_kind = 'arcade' then p_game end, v_at) returning id into sid;
  return sid;
end;
$$;

-- a mock pays +50 once per hub per day when 10 or more of its answers were recorded, and saves its score (record_mock_score)
-- from the server's own count; a game pays +50 the first time that game is finished each day, at least 20 seconds after
-- it started, and posts its score (submit_arcade_score, with its own checks). Both are boosted.
create or replace function public.sh_session_finish(p_at timestamptz, p_visitor text, p_session uuid, p_score integer, p_total integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz; s record; n int := 0; nc int := 0; paid int := 0; v_mult int; dd date;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_session is null then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  select * into s from xp_sessions where id = p_session and visitor_id = p_visitor for update;
  if not found or s.started_at > v_at or s.started_at < v_at - interval '6 hours' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if s.finished_at is not null then return jsonb_build_object('ok', true, 'repeat', true, 'xp', 0); end if;
  update xp_sessions set finished_at = v_at where id = s.id;
  v_mult := sh_xp_mult(p_visitor, v_at);
  dd := (v_at at time zone 'America/Chicago')::date;
  if s.kind = 'mock' then
    select count(*), count(*) filter (where a.correct) into n, nc
      from answer_xp x join personal_answers a on a.id = x.answer_id where x.session_id = s.id;
    if n >= 10 then paid := sh_award(p_visitor, 'mock:' || s.hub || ':' || dd, 'mock', s.hub, 50, v_mult, v_at); end if;
    if n > 0 then perform record_mock_score(p_visitor, s.hub, nc, least(300, greatest(n, coalesce(p_total, n)))); end if;
    return jsonb_build_object('ok', true, 'xp', paid, 'mult', v_mult, 'answers', n, 'correct', nc);
  end if;
  if v_at - s.started_at >= interval '20 seconds' then
    paid := sh_award(p_visitor, 'arc:' || s.hub || ':' || s.game || ':' || dd, 'arcade', s.hub, 50, v_mult, v_at);
  end if;
  if p_score is not null then perform submit_arcade_score(p_visitor, s.hub, s.game, p_score); end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'mult', v_mult);
end;
$$;

create or replace function public.xp_session_start(p_visitor text, p_hub text, p_kind text, p_game text default null)
returns uuid language sql volatile security definer set search_path = public as $$
  select sh_session_start(null, p_visitor, p_hub, p_kind, p_game);
$$;
create or replace function public.xp_session_finish(p_visitor text, p_session uuid, p_score integer default null, p_total integer default null)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_session_finish(null, p_visitor, p_session, p_score, p_total);
$$;

-- ---------- Timmy Time: 10 XP per minute of an episode heard for the first time, +100 for finishing it ----------
-- The player reports each minute as it's heard (its index from 0). A minute counts once ever, at most one minute every
-- 25 seconds (2x speed with room), only within the episode's length; finishing is hearing 90% of its minutes.
create table if not exists public.podcast_episodes (
  hub text not null,
  episode text not null,
  seconds integer not null check (seconds between 60 and 14400),
  primary key (hub, episode)
);

create or replace function public.admin_set_podcast_episode(p_secret text, p_hub text, p_ep text, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$' or p_ep !~ '^[a-z0-9][a-z0-9-]{0,59}$' or p_seconds not between 60 and 14400 then
    raise exception 'bad episode'; end if;
  insert into podcast_episodes (hub, episode, seconds) values (p_hub, p_ep, p_seconds)
    on conflict (hub, episode) do update set seconds = excluded.seconds;
  return true;
end;
$$;

create or replace function public.sh_pod_minute(p_at timestamptz, p_visitor text, p_hub text, p_ep text, p_minute integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_at timestamptz; e record; mins int; last_at timestamptz; v_mult int; paid int := 0; done int := 0; heard int;
  pre text := 'pod:' || coalesce(p_hub, '') || ':' || coalesce(p_ep, '') || ':';
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_ep is null or p_minute is null then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  select * into e from podcast_episodes where hub = p_hub and episode = p_ep;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  mins := ceil(e.seconds / 60.0)::int;
  if p_minute < 0 or p_minute >= mins then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  if exists (select 1 from xp_awards where visitor_id = p_visitor and key = pre || p_minute) then
    return jsonb_build_object('ok', true, 'xp', 0, 'repeat', true); end if;
  select max(at) into last_at from xp_awards where visitor_id = p_visitor and src = 'pod-min';
  if last_at is not null and v_at - last_at < interval '25 seconds' then return jsonb_build_object('ok', true, 'xp', 0, 'why', 'fast'); end if;
  v_mult := sh_xp_mult(p_visitor, v_at);
  paid := sh_award(p_visitor, pre || p_minute, 'pod-min', p_hub, 10, v_mult, v_at);
  select count(*) into heard from xp_awards where visitor_id = p_visitor and src = 'pod-min' and left(key, length(pre)) = pre;
  if heard >= ceil(mins * 0.9) then done := sh_award(p_visitor, 'pod-done:' || p_hub || ':' || p_ep, 'pod-done', p_hub, 100, v_mult, v_at); end if;
  return jsonb_build_object('ok', true, 'xp', paid, 'done', done, 'mult', v_mult, 'heard', heard, 'of', mins);
end;
$$;

create or replace function public.pod_minute_v2(p_visitor text, p_hub text, p_ep text, p_minute integer)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_pod_minute(null, p_visitor, p_hub, p_ep, p_minute);
$$;

-- ---------- a report or suggestion fixed: +100 to the person who sent it ----------
-- Sam resolves it on the admin page as "Fixed" (pays, once per report, to the sender's linked id) or "No change needed"
-- (pays nothing); "open" takes it back to unresolved (an award already paid stays). The reply reaches the sender as now.
create table if not exists public.report_outcomes (
  kind text not null check (kind in ('flag', 'suggestion')),
  report_id bigint not null,
  outcome text not null check (outcome in ('fixed', 'no-change')),
  set_at timestamptz not null default now(),
  primary key (kind, report_id)
);

create or replace function public.admin_resolve_report_v2(p_secret text, p_kind text, p_id bigint, p_outcome text, p_reply text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare sender text; v_hub text; paid int := 0;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_kind not in ('flag', 'suggestion') or p_outcome not in ('fixed', 'no-change', 'open') then raise exception 'bad kind or outcome'; end if;
  if p_kind = 'flag' then select visitor_id, hub into sender, v_hub from question_flags where id = p_id;
  else select visitor_id, hub into sender, v_hub from hub_suggestions where id = p_id; end if;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  perform set_report_resolved(p_secret, p_kind, p_id, p_outcome <> 'open', p_reply);
  if p_outcome = 'open' then
    delete from report_outcomes where kind = p_kind and report_id = p_id;
    return jsonb_build_object('ok', true, 'outcome', 'open', 'xp', 0);
  end if;
  insert into report_outcomes (kind, report_id, outcome) values (p_kind, p_id, p_outcome)
    on conflict (kind, report_id) do update set outcome = excluded.outcome, set_at = now();
  if p_outcome = 'fixed' and sender is not null then
    sender := coalesce((select primary_id from visitor_links where alias_id = sender), sender);
    paid := sh_award(sender, 'rep:' || p_kind || ':' || p_id, 'report', v_hub, 100, 1, now());
  end if;
  return jsonb_build_object('ok', true, 'outcome', p_outcome, 'xp', paid);
end;
$$;

-- the admin page's Inbox, with each report's outcome and whether its XP was paid
create or replace function public.get_reports_v2(p_secret text)
returns table(kind text, id bigint, hub text, note text, resolved boolean, created_at timestamptz,
              reply text, resolved_at timestamptz, can_notify boolean, reply_seen_at timestamptz, outcome text, xp_paid boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
  select r.kind, r.id, r.hub, r.note, r.resolved, r.created_at, r.reply, r.resolved_at, r.can_notify, r.reply_seen_at, o.outcome,
    exists (select 1 from xp_awards w where w.src = 'report' and w.key = 'rep:' || r.kind || ':' || r.id)
  from get_reports(p_secret) r left join report_outcomes o on o.kind = r.kind and o.report_id = r.id
  order by r.created_at desc;
end;
$$;

-- ====================================================================== 4. the ladder: three journeys, 63 steps
-- Handpiece (0-125,000, exactly today's 21 steps), ModuPro (125,000-250,000) and Loupes (250,000-375,000), each seven
-- tiers (Stone ... Dark Matter) of three levels; the later two evenly spaced (about 17,900 a tier). The floors of every step:
create or replace function public.sh_rank(p_xp integer)
returns table(journey integer, tier integer, level integer, step integer, gtier integer, step_at integer, next_at integer, tier_at integer)
language sql immutable set search_path = public as $$
  with f as (select '{0,100,200,300,700,1100,1500,2666,3833,5000,7333,9666,12000,16333,20666,25000,33333,41666,50000,75000,100000,
    125000,130952,136904,142857,148809,154761,160714,166666,172618,178571,184523,190475,196428,202380,208332,214285,220237,226189,
    232142,238094,244047,250000,255952,261904,267857,273809,279761,285714,291666,297618,303571,309523,315475,321428,327380,333332,
    339285,345237,351189,357142,363094,369047,375000}'::integer[] as a),
  s as (select f.a, least(62, greatest(0, (select count(*)::integer from unnest(f.a[1:63]) z where z <= greatest(coalesce(p_xp, 0), 0)) - 1)) as st from f)
  select s.st / 21, (s.st % 21) / 3, s.st % 3 + 1, s.st, s.st / 3, s.a[s.st + 1], case when s.st < 62 then s.a[s.st + 2] end, s.a[(s.st / 3) * 3 + 1] from s;
$$;

-- today's profile, with the journey, its step on the 63-step ladder, the journey trophies (one per journey finished),
-- the boost running now, and which Dark Matter unlocks this visitor has seen
create or replace function public.get_rank_profile_v2(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p jsonb := get_rank_profile(p_visitor); v_xp int := coalesce((p->>'xp')::integer, 0); r record; b jsonb; j int; seen int[] := '{}';
begin
  select * into r from sh_rank(v_xp);
  b := coalesce(p->'badges', '[]'::jsonb);
  for j in 0..2 loop
    if v_xp >= 125000 * (j + 1) then b := b || to_jsonb('journey-' || j); end if;
  end loop;
  select coalesce(array_agg(substr(a.kind, 11)::integer order by a.kind), '{}') into seen
    from achievements a where a.visitor_id = p_visitor and a.kind like 'dark-seen-%';
  return p || jsonb_build_object('journey', r.journey, 'tier', r.tier, 'level', r.level, 'step', r.step, 'gtier', r.gtier,
    'step_at', r.step_at, 'next_at', r.next_at, 'tier_at', r.tier_at, 'steps', 63, 'badges', b,
    'boost', case when p_visitor is null then null else sh_boost_json(p_visitor, clock_timestamp()) end,
    'dark_seen', to_jsonb(seen));
end;
$$;

-- the Dark Matter unlock plays once per journey, ever: the page calls this when it has played it
create or replace function public.mark_dark_unlock_seen(p_visitor text, p_journey integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_journey not between 0 and 2 then return false; end if;
  select * into r from sh_rank(coalesce((select xp from xp_visitors where visitor_id = p_visitor), 0));
  if not (r.journey > p_journey or (r.journey = p_journey and r.tier >= 6)) then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, 'dark-seen-' || p_journey, '') on conflict do nothing;
  return found;
end;
$$;

-- Visiting (Sam, 2026-11-10: "Its on by default and you visit from the boards"; 2026-11-11: no one can turn it off). The
-- boards never give out a visitor id, so every row of the four boards below carries a visit key instead (`visit`): an
-- opaque digest of the person's id with a secret only the server holds. get_place(key) opens that person's place. The
-- secret is one random value made when this migration runs; nobody but the functions here can read it, so a key can't be
-- worked out from an id, or an id from a key.
create table if not exists public.visit_secret (
  id boolean primary key default true check (id),
  secret text not null
);
insert into public.visit_secret (id, secret)
  values (true, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')) on conflict (id) do nothing;

-- a person's visit key, which every board row carries: 24 hex characters, the same every time (null for no id). Private:
-- only the functions in this file call it.
create or replace function public.sh_visit_key(p_visitor text)
returns text language sql stable security definer set search_path = public as $$
  select left(encode(sha256(convert_to(s.secret || ':' || p_visitor, 'UTF8')), 'hex'), 24) from visit_secret s where s.id;
$$;

create or replace function public.get_rank_board_v2(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, xp integer, journey integer, tier integer, level integer, step integer, is_me boolean, flair text, visit text)
language sql stable security definer set search_path = public as $$
  with r as (select v.visitor_id, v.xp, rank() over (order by v.xp desc) as rnk from xp_visitors v),
  top as (select * from r where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor))
  select t.rnk, coalesce(vn.display_name, anon_name(t.visitor_id)), t.xp, k.journey, k.tier, k.level, k.step,
    (p_visitor is not null and t.visitor_id = p_visitor), sh_mastery_flair(t.visitor_id), sh_visit_key(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id cross join lateral sh_rank(t.xp) k
  order by t.rnk;
$$;

create or replace function public.get_leaderboard_v2(p_limit integer default 10)
returns table(display_name text, streak integer, total_answered integer, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with islands as (
    select x.visitor_id, x.d, x.d - (row_number() over (partition by x.visitor_id order by x.d))::int as grp from xp_days x
  ), streaks as (
    select i.visitor_id, count(*)::int as len, max(i.d) as last_day from islands i group by i.visitor_id, i.grp
  ), current_streaks as (
    select s.visitor_id, max(s.len) as streak from streaks s
    where s.last_day >= (now() at time zone 'America/Chicago')::date - 1 group by s.visitor_id
  ), top as (
    select cs.visitor_id, cs.streak, coalesce(v.answers, 0) as total_answered, coalesce(v.xp, 0) as xp
    from current_streaks cs left join xp_visitors v on v.visitor_id = cs.visitor_id
    where cs.streak >= 2
    order by cs.streak desc, 3 desc
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  )
  select coalesce(vn.display_name, anon_name(t.visitor_id)), t.streak::int, t.total_answered::int,
    k.journey, k.tier, k.level, k.step, sh_mastery_flair(t.visitor_id), sh_visit_key(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id cross join lateral sh_rank(t.xp) k
  order by t.streak desc, t.total_answered desc;
end;
$$;

create or replace function public.get_correct_streak_stats_v2()
returns table(kind text, display_name text, streak integer, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with top as (
    (select 'active'::text as k, s.visitor_id, s.current_streak as n, 1 as ord
       from correct_streaks s where s.current_streak > 0 order by s.current_streak desc limit 1)
    union all
    (select 'record'::text, s.visitor_id, s.best_streak, 2
       from correct_streaks s where s.best_streak > 0 order by s.best_streak desc limit 1)
  )
  select t.k, coalesce(vn.display_name, anon_name(t.visitor_id)), t.n, k.journey, k.tier, k.level, k.step, sh_mastery_flair(t.visitor_id),
    sh_visit_key(t.visitor_id)
  from top t left join visitor_names vn on vn.visitor_id = t.visitor_id
  left join xp_visitors v on v.visitor_id = t.visitor_id cross join lateral sh_rank(coalesce(v.xp, 0)) k
  order by t.ord;
end;
$$;

create or replace function public.get_arcade_leaderboard_v2(p_hub text, p_game text, p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, best integer, plays bigint, is_me boolean, journey integer, tier integer, level integer, step integer, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with best as (
    select a.visitor_id, max(a.score) as best, count(*) as plays from arcade_scores a
    where a.hub = coalesce(p_hub, '') and a.game = p_game group by a.visitor_id
  ), ranked as (
    select b.visitor_id, b.best, b.plays, rank() over (order by b.best desc) as rnk from best b
  )
  select r.rnk, coalesce(vn.display_name, anon_name(r.visitor_id)), r.best, r.plays,
    (p_visitor is not null and r.visitor_id = p_visitor), k.journey, k.tier, k.level, k.step, sh_mastery_flair(r.visitor_id),
    sh_visit_key(r.visitor_id)
  from ranked r
  left join visitor_names vn on vn.visitor_id = r.visitor_id
  left join xp_visitors v on v.visitor_id = r.visitor_id cross join lateral sh_rank(coalesce(v.xp, 0)) k
  where r.rnk <= greatest(1, least(coalesce(p_limit, 10), 50)) or (p_visitor is not null and r.visitor_id = p_visitor)
  order by r.rnk, r.best desc;
end;
$$;

-- someone's place, opened with the visit key from a board row. Only what a place shows: the leaderboard name exactly as
-- the boards show it, what stands in each slot (the home, the scene, the five yard spots, the upgrades and paint, the
-- outfit), the rank (journey, tier, level) and the mastery flair the boards already show. Never the visitor id, XP as a
-- number, HP, snacks, the streak, answers, the wallet, the inventory, or any date or time. An unknown key gives null.
-- The search covers everyone a board can list.
create or replace function public.get_place(p_key text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v text; k record;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{24}$' then return null; end if;
  select z.visitor_id into v from (
    select x.visitor_id from xp_visitors x
    union select c.visitor_id from correct_streaks c
    union select a.visitor_id from arcade_scores a
  ) z where sh_visit_key(z.visitor_id) = p_key limit 1;
  if v is null then return null; end if;
  select * into k from sh_rank(coalesce((select x.xp from xp_visitors x where x.visitor_id = v), 0));
  return jsonb_build_object(
    'name', coalesce((select vn.display_name from visitor_names vn where vn.visitor_id = v), anon_name(v)),
    'equipped', coalesce((select jsonb_object_agg(e.slot, e.item_id) from pet_equipped e where e.visitor_id = v), '{}'::jsonb),
    'rank', jsonb_build_object('journey', k.journey, 'tier', k.tier, 'level', k.level),
    'flair', sh_mastery_flair(v));
end;
$$;

-- trophy rarity with the journey trophies, without the Dark Matter "seen" marks (they aren't trophies)
create or replace function public.get_trophy_stats_v2()
returns table(kind text, n integer, total integer)
language sql stable security definer set search_path = public as $$
  select t.kind, t.n, t.total from get_trophy_stats() t where t.kind not like 'dark-seen-%'
  union all
  select 'journey-' || j, count(*) filter (where v.xp >= 125000 * (j + 1))::integer, count(*)::integer
  from generate_series(0, 2) j cross join xp_visitors v group by j;
$$;

-- ====================================================================== 5. Shiny Gold Crowns and Timmy's shop
-- The catalog. kind: outfit (Timmy wears one at a time), costume (a rare costume: on sale to someone who has spotted it),
-- home, scene, yard (one of the five yard spots), upgrade (its own slot on the home), snack (HP at once), boost (double XP).
-- Prices follow the rarity's band. season: one of a season's set, on sale only in that season's window (sh_shop_seasons),
-- and now and then on a throwback day. wide: a yard item that takes two spots (the bowling lane: the side yard and the
-- front corner; tools/figures/site/place.mjs draws it).
-- gift: everyone owns it from the start, with no row in pet_inventory (Sam, 2026-11-10: "only Halloween 2026's set is free
-- for everyone"); it is never sold. rank_tier: one of a rank set (Sam: "timmy outfit and a decoration only. Do rank only"),
-- owned by everyone whose rank has reached that tier (sh_rank's gtier: 1 Antique ... 6 Dark Matter of the Handpiece, 7-13
-- the ModuPro, 14-20 the Loupes); earned, never sold, so its price is 0 and it is on no shelf.
create table if not exists public.shop_items (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  name text not null,
  kind text not null check (kind in ('outfit', 'costume', 'home', 'scene', 'yard', 'upgrade', 'snack', 'boost')),
  rarity text not null check (rarity in ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  price integer not null,
  season text check (season in ('halloween', 'thanksgiving', 'winter', 'newyear', 'mardigras', 'valentine', 'toothfairy', 'dentist',
    'stpatrick', 'easter', 'spring', 'july4', 'summer', 'fall')),
  slot text check (slot in ('windows', 'porch', 'chimney', 'flag', 'paint')),
  hp integer check (hp between 1 and 50),
  boost_minutes integer check (boost_minutes between 15 and 720),
  boost_mult smallint check (boost_mult between 2 and 3),
  shelf boolean not null default false,          -- always on sale (snacks, floss, boosts)
  rotates boolean not null default true,         -- can come up in the daily and weekly picks
  active boolean not null default true,
  sort integer not null default 0,
  wide boolean not null default false,
  gift boolean not null default false,           -- everyone owns it (Halloween 2026's set)
  rank_tier smallint check (rank_tier between 1 and 20),   -- owned from this global tier on (a rank set)
  added_on date not null default current_date,   -- the day it joined the catalog: a throwback needs its season to have run since
  check ((rank_tier is not null and price = 0) or (rank_tier is null and (
         (rarity = 'common' and price between 100 and 200) or (rarity = 'uncommon' and price between 250 and 500)
      or (rarity = 'rare' and price between 600 and 1200) or (rarity = 'epic' and price between 1500 and 3000)
      or (rarity = 'legendary' and price between 4000 and 8000)))),
  check (rank_tier is null or (kind in ('outfit', 'yard') and season is null and not gift and not shelf and not rotates)),
  check (not gift or kind not in ('snack', 'boost')),
  check ((kind = 'upgrade') = (slot is not null)),
  check ((kind = 'snack') = (hp is not null)),
  check ((kind = 'boost') = (boost_minutes is not null and boost_mult is not null)),
  check (not wide or kind = 'yard')
);

-- Everything bought, once per tap (request_id). Spending is the sum of price; it never lowers XP or rank.
create table if not exists public.pet_purchases (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  item_id text not null references public.shop_items (id),
  kind text not null,
  price integer not null check (price >= 0),
  hp integer,
  request_id text not null unique,
  bought_at timestamptz not null default now(),
  day date not null,
  resp jsonb
);
create index if not exists pet_purchases_visitor on public.pet_purchases (visitor_id, day);

-- what's owned for good (everything but snacks and boosts)
create table if not exists public.pet_inventory (
  visitor_id text not null,
  item_id text not null references public.shop_items (id),
  bought_at timestamptz not null default now(),
  primary key (visitor_id, item_id)
);

-- what Timmy wears and where his things stand, the same on every linked device. The five yard spots, as the art names
-- them: yard-left and yard-front by the path, yard-corner (the front corner), yard-side (the side yard), yard-right (the
-- back corner).
create table if not exists public.pet_equipped (
  visitor_id text not null,
  slot text not null check (slot in ('outfit', 'home', 'scene', 'yard-left', 'yard-front', 'yard-corner', 'yard-side',
    'yard-right', 'windows', 'porch', 'chimney', 'flag', 'paint')),
  item_id text not null references public.shop_items (id),
  set_at timestamptz not null default now(),
  primary key (visitor_id, slot)
);

-- the "you" panel's costume log: the first sighting of each rare costume (at most one new one a day)
create table if not exists public.costume_log (
  visitor_id text not null,
  costume text not null references public.shop_items (id),
  first_day date not null,
  primary key (visitor_id, costume)
);

-- Easter Sunday of a year (the Gregorian computus), for sh_season and sh_shop_seasons
create or replace function public.sh_easter(p_year integer)
returns date language plpgsql immutable set search_path = public as $$
declare y int := p_year; a int; b int; c int; dd int; e int; ff int; g int; h int; i int; k int; l int; mm int;
begin
  a := y % 19; b := y / 100; c := y % 100; dd := b / 4; e := b % 4; ff := (b + 8) / 25; g := (b - ff + 1) / 3;
  h := (19 * a + b - dd - g + 15) % 30; i := c / 4; k := c % 4; l := (32 + 2 * e + 2 * i - h - k) % 7; mm := (a + 11 * h + 22 * l) / 451;
  return make_date(y, (h + l - 7 * mm + 114) / 31, ((h + l - 7 * mm + 114) % 31) + 1);
end;
$$;

-- the holidays and the fall weeks by Central date, in step with holidayId() and isFall() in widget/pet.js: the days Timmy
-- dresses up by himself. (When a season's set is on sale is sh_shop_seasons, below: longer for the short holidays.)
create or replace function public.sh_season(p_day date)
returns text language plpgsql immutable set search_path = public as $$
declare y int := extract(year from p_day); m int := extract(month from p_day); x int := m * 100 + extract(day from p_day)::int;
  f date; tg_end date; easter date;
begin
  if x between 1001 and 1031 then return 'halloween'; end if;
  f := make_date(y, 11, 1);
  tg_end := f + ((4 - extract(dow from f)::int + 7) % 7) + 21 + 1;      -- the day after the fourth Thursday of November
  if m = 11 and p_day <= tg_end then return 'thanksgiving'; end if;
  if p_day > tg_end and x between 1101 and 1226 then return 'winter'; end if;
  if x = 1231 or x <= 102 then return 'newyear'; end if;
  if x between 210 and 214 then return 'valentine'; end if;
  if x = 306 then return 'dentist'; end if;
  if x between 314 and 317 then return 'stpatrick'; end if;
  easter := sh_easter(y);
  if p_day between easter - 6 and easter + 1 then return 'easter'; end if;
  return null;
end;
$$;
create or replace function public.sh_is_fall(p_day date)
returns boolean language sql immutable set search_path = public as $$
  select (extract(month from p_day) * 100 + extract(day from p_day)) between 922 and 1130;
$$;

-- every season whose set is on sale on a Central date (Sam, 2026-11-10); several can be on at once, the holidays first.
--   halloween Oct 1-31; thanksgiving Nov 1 to the day after the fourth Thursday; winter from the day after that to Dec 26
--   (these three as sh_season has them);
--   the short holidays for the 7 days ending on their last day: newyear Dec 27 - Jan 2, valentine Feb 8-14, toothfairy
--   Feb 22-28, dentist the 7 days ending Mar 6, stpatrick Mar 11-17, july4 Jun 28 - Jul 4, mardigras the 7 days ending on
--   Fat Tuesday (47 days before Easter);
--   easter from 6 days before Easter to the day after (as sh_season);
--   spring Mar 20 - May 31, summer Jun 1 - Sep 21, fall Sep 22 - Nov 30 (sh_is_fall).
create or replace function public.sh_shop_seasons(p_day date)
returns text[] language plpgsql immutable set search_path = public as $$
declare y int := extract(year from p_day); x int := extract(month from p_day)::int * 100 + extract(day from p_day)::int;
  f date := make_date(y, 11, 1); tg_end date; easter date := sh_easter(y); r text[] := '{}';
begin
  if p_day is null then return r; end if;
  tg_end := f + ((4 - extract(dow from f)::int + 7) % 7) + 21 + 1;      -- the day after the fourth Thursday of November
  if x between 1001 and 1031 then r := r || 'halloween'::text; end if;
  if x >= 1101 and p_day <= tg_end then r := r || 'thanksgiving'::text; end if;
  if p_day > tg_end and x <= 1226 then r := r || 'winter'::text; end if;
  if x >= 1227 or x <= 102 then r := r || 'newyear'::text; end if;
  if p_day between easter - 53 and easter - 47 then r := r || 'mardigras'::text; end if;
  if x between 208 and 214 then r := r || 'valentine'::text; end if;
  if x between 222 and 228 then r := r || 'toothfairy'::text; end if;
  if p_day between make_date(y, 3, 6) - 6 and make_date(y, 3, 6) then r := r || 'dentist'::text; end if;
  if x between 311 and 317 then r := r || 'stpatrick'::text; end if;
  if p_day between easter - 6 and easter + 1 then r := r || 'easter'::text; end if;
  if x between 628 and 704 then r := r || 'july4'::text; end if;
  if x between 320 and 531 then r := r || 'spring'::text; end if;
  if x between 601 and 921 then r := r || 'summer'::text; end if;
  if x between 922 and 1130 then r := r || 'fall'::text; end if;
  return r;
end;
$$;

-- throwback days (Sam, 2026-11-10: "two throwback days a month, the same for everyone"): one day in the month's first
-- half (the 1st to the 14th) and one in its second (the 15th to the 28th), worked out from the year and month alone.
create or replace function public.sh_throwback_days(p_day date)
returns integer[] language sql immutable set search_path = public as $$
  select array[1 + (('x' || '00000000' || substr(h.m, 1, 8))::bit(64)::bigint % 14)::integer,
               15 + (('x' || '00000000' || substr(h.m, 9, 8))::bit(64)::bigint % 14)::integer]
  from (select md5('throwback:' || extract(year from p_day)::integer || '-' || lpad(extract(month from p_day)::integer::text, 2, '0')) as m) h;
$$;
create or replace function public.sh_is_throwback(p_day date)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(extract(day from p_day)::integer = any(sh_throwback_days(p_day)), false);
$$;

-- the rotation, the same for everyone and worked out from the Central date: 3 weekly items (new every Monday), then 4 daily
-- ones (new at midnight, never one of the week's), each a weighted draw where rarer items come up less often; plus the sets
-- of the seasons on sale, a throwback day's three, and the shelf (snacks, floss, boosts). Deterministic: the same day gives
-- the same shop. The daily and weekly draws never hold a seasonal item, a gift or a rank item.
create or replace function public.sh_shop_pick(p_seed text, p_n integer, p_exclude text[])
returns table(item_id text, pos integer) language sql stable security definer set search_path = public as $$
  select z.id, (row_number() over (order by z.k, z.id))::integer from (
    select i.id, -ln((('x' || '00000000' || substr(md5(p_seed || ':' || i.id), 1, 8))::bit(64)::bigint + 0.5) / 4294967296.0)
      / case i.rarity when 'common' then 10 when 'uncommon' then 6 when 'rare' then 3 when 'epic' then 1.5 else 0.6 end as k
    from shop_items i
    where i.active and i.rotates and i.season is null and not i.gift and i.rank_tier is null
      and i.kind not in ('snack', 'boost', 'costume')
      and not (i.id = any(coalesce(p_exclude, '{}')))
  ) z order by z.k, z.id limit greatest(0, p_n);
$$;

-- has this season been on sale on some day from p_since up to the day before p_day? (Sam, 2026-11-10: holiday content
-- is never in the shop before its own dates, so a throwback can only bring back a season that has already had a run
-- since its items joined the catalog.) It looks back 400 days: more than the longest gap between two Easters' weeks.
create or replace function public.sh_season_was_on(p_season text, p_since date, p_day date)
returns boolean language sql stable set search_path = public as $$
  select exists (select 1 from generate_series(greatest(p_since, p_day - 400), p_day - 1, interval '1 day') g
                 where p_season = any(sh_shop_seasons(g::date)));
$$;

-- a throwback day's "Back for today" shelf: up to 3 seasonal items whose season is not on sale that day but has been
-- since the items joined the catalog (so nothing is sold before its season's first run), at their usual price.
-- The same weighted draw as the daily picks, seeded by the date; homes and scenes come up least (their weight is 0.4 of
-- their rarity's). Never a gift (everyone has it) or a rank item. No rows on any other day.
create or replace function public.sh_throwback_items(p_day date)
returns table(item_id text, pos integer) language sql stable security definer set search_path = public as $$
  select z.id, (row_number() over (order by z.k, z.id))::integer from (
    select i.id, -ln((('x' || '00000000' || substr(md5('throwback:' || p_day || ':' || i.id), 1, 8))::bit(64)::bigint + 0.5) / 4294967296.0)
      / (case i.rarity when 'common' then 10 when 'uncommon' then 6 when 'rare' then 3 when 'epic' then 1.5 else 0.6 end
         * case when i.kind in ('home', 'scene') then 0.4 else 1 end) as k
    from shop_items i
    where sh_is_throwback(p_day) and i.active and i.season is not null and not i.gift and i.rank_tier is null
      and i.kind not in ('snack', 'boost', 'costume') and not (i.season = any(sh_shop_seasons(p_day)))
      and (i.season, i.added_on) in (select s.season, s.added_on from (select distinct season, added_on from shop_items where season is not null) s
                                     where sh_season_was_on(s.season, s.added_on, p_day))
  ) z order by z.k, z.id limit 3;
$$;

create or replace function public.sh_shop_day(p_day date)
returns table(item_id text, shelf text, pos integer) language plpgsql stable security definer set search_path = public as $$
declare wk text[]; ssn text[] := sh_shop_seasons(p_day);
begin
  wk := array(select w.item_id from sh_shop_pick('week:' || date_trunc('week', p_day)::date, 3, null) w order by w.pos);
  return query
    select w.item_id, 'weekly'::text, w.pos::integer from unnest(wk) with ordinality w(item_id, pos)
    union all select d.item_id, 'daily', d.pos from sh_shop_pick('day:' || p_day, 4, wk) d
    union all select i.id, 'season', (row_number() over (order by array_position(ssn, i.season), i.sort, i.id))::integer from shop_items i
      where i.active and i.season = any(ssn)
    union all select t.item_id, 'throwback', t.pos from sh_throwback_items(p_day) t
    union all select i.id, 'always', (row_number() over (order by i.sort, i.id))::integer from shop_items i where i.active and i.shelf;
end;
$$;

-- What someone owns, decided in this one place: what they bought (a row in pet_inventory), every gift (Halloween 2026's
-- set, everyone's), and every rank item whose tier their rank has reached (so the sets of ranks already passed are theirs
-- with no rows written). Gifts and rank items count while they are active in the catalog. `how` says which: 'bought',
-- 'gift' or 'rank'; `at` is when it was bought (null for the other two).
create or replace function public.sh_owned(p_visitor text)
returns table(item_id text, how text, at timestamptz) language sql stable security definer set search_path = public as $$
  with me as (select (select k.gtier from sh_rank(coalesce((select x.xp from xp_visitors x where x.visitor_id = p_visitor), 0)) k) as g)
  select i.id, case when v.item_id is not null then 'bought' when i.gift then 'gift' else 'rank' end, v.bought_at
  from shop_items i cross join me
  left join pet_inventory v on v.visitor_id = p_visitor and v.item_id = i.id
  where p_visitor is not null
    and (v.item_id is not null or (i.active and (i.gift or (i.rank_tier is not null and i.rank_tier <= me.g))));
$$;
create or replace function public.sh_owns(p_visitor text, p_item text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from sh_owned(p_visitor) o where o.item_id = p_item);
$$;

-- one visitor's shop today: the shared one, plus one rare costume they've spotted and don't own yet ('spotted')
create or replace function public.sh_shop_for(p_visitor text, p_day date)
returns table(item_id text, shelf text, pos integer) language sql stable security definer set search_path = public as $$
  select * from sh_shop_day(p_day)
  union all
  select c.costume, 'spotted', 1 from costume_log c join shop_items i on i.id = c.costume and i.active
  where p_visitor is not null and c.visitor_id = p_visitor and not sh_owns(p_visitor, c.costume)
  order by 2, 3 limit 100;
$$;

-- Shiny Gold Crowns, worked out by the server: 1 per 10 XP of base XP (a boost's extra earns none), plus 25 per trophy,
-- 50 per mastery medal and 20 per rank-up reached since the switch; minus what was spent. Balance = earned - spent.
create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[]; m_now text[]; m_was text[];
  n_t int; n_m int; n_r int; earned int; spent int;
begin
  select coalesce(max(x.xp), 0) into v_xp from xp_visitors x where x.visitor_id = p_visitor;
  select coalesce(sum(a.xp - a.base), 0) into extra from xp_awards a where a.visitor_id = p_visitor;
  base_xp := greatest(0, v_xp - extra);
  select * into bl from game_baseline where visitor_id = p_visitor;
  badges := array(select jsonb_array_elements_text(coalesce(get_rank_profile_v2(p_visitor)->'badges', '[]'::jsonb)));
  t_now := array(select distinct split_part(b, ':', 1) from unnest(badges) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  t_was := array(select distinct split_part(b, ':', 1) from unnest(coalesce(bl.badges, '{}')) b
                 where b not like 'mastery-%' and b not like 'dark-seen-%' and split_part(b, ':', 1) <> 'pet-adopt');
  m_now := array(select b from unnest(badges) b where b like 'mastery-%:%');
  m_was := array(select b from unnest(coalesce(bl.badges, '{}')) b where b like 'mastery-%:%');
  n_t := (select count(*) from unnest(t_now) z where not (z = any(t_was)));
  n_m := (select count(*) from unnest(m_now) z where not (z = any(m_was)));
  n_r := greatest(0, (select gtier from sh_rank(v_xp)) - (select gtier from sh_rank(coalesce(bl.xp, 0))));
  earned := base_xp / 10 + 25 * n_t + 50 * n_m + 20 * n_r;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 10,
    'trophies', n_t, 'medals', n_m, 'rankups', n_r);
end;
$$;

-- one visitor's shop, wallet, things and what's on today; with no visitor, just today's shop. `seasons` are the sets on
-- sale today and `throwback` says whether today is a throwback day. `inventory` is everything owned, each with how it is
-- owned ('bought', 'gift' or 'rank'); `locked` lists the rank items not reached yet, with the tier that unlocks each
-- ("Unlocks at Silver").
-- sh_my_shop takes the Central date (the tests set it; null = today); get_my_shop is what a page calls.
create or replace function public.sh_my_shop(p_day date, p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare dd date := coalesce(p_day, (now() at time zone 'America/Chicago')::date); ok boolean := p_visitor is not null and length(p_visitor) between 1 and 80;
  v text := case when p_visitor is not null and length(p_visitor) between 1 and 80 then p_visitor end;
begin
  return jsonb_build_object(
    'day', dd,
    'seasons', to_jsonb(sh_shop_seasons(dd)),
    'throwback', sh_is_throwback(dd),
    'wallet', case when ok then sh_wallet(p_visitor) end,
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'kind', i.kind, 'rarity', i.rarity, 'price', i.price,
        'season', i.season, 'slot', i.slot, 'hp', i.hp, 'boost_minutes', i.boost_minutes, 'boost_mult', i.boost_mult, 'shelf', s.shelf,
        'gift', i.gift, 'owned', o.item_id is not null)
        order by s.shelf, s.pos)
      from sh_shop_for(v, dd) s join shop_items i on i.id = s.item_id left join sh_owned(v) o on o.item_id = i.id), '[]'::jsonb),
    'inventory', coalesce((select jsonb_agg(jsonb_build_object('id', o.item_id, 'at', o.at, 'how', o.how) order by o.at nulls last, o.item_id)
      from sh_owned(v) o), '[]'::jsonb),
    'locked', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'kind', i.kind, 'rarity', i.rarity, 'rank_tier', i.rank_tier)
        order by i.rank_tier, i.sort, i.id)
      from shop_items i where i.active and i.rank_tier is not null
        and not exists (select 1 from sh_owned(v) o where o.item_id = i.id)), '[]'::jsonb),
    'equipped', case when ok then coalesce((select jsonb_object_agg(e.slot, e.item_id) from pet_equipped e where e.visitor_id = p_visitor), '{}'::jsonb) else '{}'::jsonb end,
    'costumes', case when ok then coalesce((select jsonb_agg(jsonb_build_object('id', c.costume, 'day', c.first_day) order by c.first_day, c.costume)
      from costume_log c where c.visitor_id = p_visitor), '[]'::jsonb) else '[]'::jsonb end,
    'snacks_today', case when ok then coalesce((select jsonb_agg(distinct p.item_id) from pet_purchases p
      where p.visitor_id = p_visitor and p.day = dd and p.kind = 'snack'), '[]'::jsonb) else '[]'::jsonb end,
    'boost', case when ok then sh_boost_json(p_visitor, clock_timestamp()) end);
end;
$$;
create or replace function public.get_my_shop(p_visitor text)
returns jsonb language sql stable security definer set search_path = public as $$
  select sh_my_shop(null, p_visitor);
$$;

-- buy one thing: not owned already (outfits, costumes, the home's things; a gift is everyone's, so it can never be
-- bought), not a rank item (earned by rank, never sold), on sale today for this visitor (a shelf of sh_shop_for: daily,
-- weekly, a season on sale, a throwback day's three, the always-shelf, a spotted costume), at most one of each snack a
-- day, enough gold crowns. Idempotent on p_request (a double tap or a replayed call buys once). A snack's HP counts today
-- (get_pet_days_v2); a boost starts now, or extends the one running instead of stacking.
-- sh_buy takes the Central date (the tests set it; null = today); buy_item is what a page calls.
create or replace function public.sh_buy(p_day date, p_visitor text, p_item text, p_request text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it record; prev record; dd date := coalesce(p_day, (now() at time zone 'America/Chicago')::date); w jsonb; bal int; pid bigint;
  v_resp jsonb; bst record; b_until timestamptz;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_item is null or p_item !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_request is null or p_request !~ '^[A-Za-z0-9_-]{8,64}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  select visitor_id, resp into prev from pet_purchases where request_id = p_request;
  if found then
    if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
    return jsonb_build_object('ok', false, 'error', 'dup');
  end if;
  select * into it from shop_items where id = p_item and active;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  if it.kind not in ('snack', 'boost') and sh_owns(p_visitor, p_item) then return jsonb_build_object('ok', false, 'error', 'owned'); end if;
  if it.rank_tier is not null then return jsonb_build_object('ok', false, 'error', 'rank', 'rank_tier', it.rank_tier); end if;
  if not exists (select 1 from sh_shop_for(p_visitor, dd) s where s.item_id = p_item) then return jsonb_build_object('ok', false, 'error', 'not-today'); end if;
  if it.kind = 'snack' and exists (select 1 from pet_purchases where visitor_id = p_visitor and item_id = p_item and day = dd) then
    return jsonb_build_object('ok', false, 'error', 'today'); end if;
  w := sh_wallet(p_visitor); bal := (w->>'balance')::integer;
  if bal < it.price then return jsonb_build_object('ok', false, 'error', 'balance', 'balance', bal, 'price', it.price); end if;
  insert into pet_purchases (visitor_id, item_id, kind, price, hp, request_id, day)
    values (p_visitor, p_item, it.kind, it.price, it.hp, p_request, dd) returning id into pid;
  if it.kind not in ('snack', 'boost') then
    insert into pet_inventory (visitor_id, item_id) values (p_visitor, p_item) on conflict do nothing;
  end if;
  if it.kind = 'boost' then
    select * into bst from xp_boosts where visitor_id = p_visitor and src = 'shop' and starts_at <= now() and ends_at > now()
      order by ends_at desc limit 1;
    if found then
      update xp_boosts set ends_at = ends_at + make_interval(mins => it.boost_minutes) where visitor_id = p_visitor and key = bst.key
        returning ends_at into b_until;
    else
      insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
        values (p_visitor, 'shop:' || pid, 'shop', it.boost_mult, now(), now() + make_interval(mins => it.boost_minutes))
        returning ends_at into b_until;
    end if;
  end if;
  v_resp := jsonb_build_object('ok', true, 'item', p_item, 'kind', it.kind, 'price', it.price, 'balance', bal - it.price,
    'hp', it.hp, 'boost_until', b_until);
  update pet_purchases set resp = v_resp where id = pid;
  return v_resp;
end;
$$;

create or replace function public.buy_item(p_visitor text, p_item text, p_request text)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_buy(null, p_visitor, p_item, p_request);
$$;

-- wear an outfit, move into a home, pick a scene, put a yard item in one of the five spots, or fit an upgrade; p_item null
-- takes the slot back to the free default (no outfit, the cottage, the hill, an empty spot). Only what you own (sh_owns:
-- bought, a gift, or a rank item whose rank you've reached). A wide yard item (the bowling lane) always stands in the side
-- yard and takes the front corner too: it clears that spot, and putting something in the front corner takes the lane away.
-- If someone's XP ever drops below a rank (a rebuild after a correction), a rank item they already put on simply stays
-- on: nothing takes it off, they just can't put it on again until the rank is back.
create or replace function public.equip_item(p_visitor text, p_slot text, p_item text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it record; v_slot text := p_slot;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_slot is null or p_slot not in ('outfit', 'home', 'scene',
     'yard-left', 'yard-front', 'yard-corner', 'yard-side', 'yard-right', 'windows', 'porch', 'chimney', 'flag', 'paint') then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if p_item is null then
    delete from pet_equipped where visitor_id = p_visitor and slot = p_slot;
  else
    select i.* into it from shop_items i where i.id = p_item and sh_owns(p_visitor, p_item);
    if not found then return jsonb_build_object('ok', false, 'error', 'not-owned'); end if;
    if not ((p_slot = 'outfit' and it.kind in ('outfit', 'costume')) or (p_slot = it.kind and it.kind in ('home', 'scene'))
            or (p_slot like 'yard-%' and it.kind = 'yard') or (it.kind = 'upgrade' and p_slot = it.slot)) then
      return jsonb_build_object('ok', false, 'error', 'slot'); end if;
    if it.kind = 'yard' and it.wide then
      if p_slot not in ('yard-side', 'yard-corner') then return jsonb_build_object('ok', false, 'error', 'slot'); end if;
      v_slot := 'yard-side';
      delete from pet_equipped where visitor_id = p_visitor and slot = 'yard-corner';
    elsif p_slot = 'yard-corner' then
      delete from pet_equipped e using shop_items i
      where e.visitor_id = p_visitor and e.slot = 'yard-side' and i.id = e.item_id and i.wide;
    end if;
    if it.kind = 'yard' then delete from pet_equipped where visitor_id = p_visitor and item_id = p_item and slot <> v_slot; end if;
    insert into pet_equipped (visitor_id, slot, item_id, set_at) values (p_visitor, v_slot, p_item, clock_timestamp())
      on conflict (visitor_id, slot) do update set item_id = excluded.item_id, set_at = excluded.set_at;
  end if;
  return jsonb_build_object('ok', true, 'equipped',
    coalesce((select jsonb_object_agg(e.slot, e.item_id) from pet_equipped e where e.visitor_id = p_visitor), '{}'::jsonb));
end;
$$;

-- a rare costume seen for the first time (the page picks the day's costume itself): into the costume log and that
-- visitor's shop; at most one new sighting a day, as he wears one costume a day
create or replace function public.record_costume_sighting(p_visitor text, p_costume text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare dd date := (now() at time zone 'America/Chicago')::date;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80
     or not exists (select 1 from shop_items where id = p_costume and kind = 'costume' and active) then
    return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if exists (select 1 from costume_log where visitor_id = p_visitor and costume = p_costume) then
    return jsonb_build_object('ok', true, 'first', false); end if;
  if exists (select 1 from costume_log where visitor_id = p_visitor and first_day = dd) then
    return jsonb_build_object('ok', false, 'error', 'today'); end if;
  insert into costume_log (visitor_id, costume, first_day) values (p_visitor, p_costume, dd) on conflict do nothing;
  return jsonb_build_object('ok', true, 'first', true);
end;
$$;

-- the catalog is edited with this (or a later migration); p_item has the shop_items columns
create or replace function public.admin_upsert_shop_item(p_secret text, p_item jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if jsonb_typeof(p_item) is distinct from 'object' or coalesce(p_item->>'id', '') = '' then raise exception 'p_item needs an id'; end if;
  insert into shop_items (id, name, kind, rarity, price, season, slot, hp, boost_minutes, boost_mult, shelf, rotates, active, sort, wide,
    gift, rank_tier)
  values (p_item->>'id', p_item->>'name', p_item->>'kind', p_item->>'rarity', (p_item->>'price')::integer, p_item->>'season',
    p_item->>'slot', (p_item->>'hp')::integer, (p_item->>'boost_minutes')::integer, (p_item->>'boost_mult')::smallint,
    coalesce((p_item->>'shelf')::boolean, false),
    coalesce((p_item->>'rotates')::boolean, p_item->>'season' is null and p_item->>'rank_tier' is null),
    coalesce((p_item->>'active')::boolean, true), coalesce((p_item->>'sort')::integer, 0),
    coalesce((p_item->>'wide')::boolean, false), coalesce((p_item->>'gift')::boolean, false), (p_item->>'rank_tier')::smallint)
  on conflict (id) do update set name = excluded.name, kind = excluded.kind, rarity = excluded.rarity, price = excluded.price,
    season = excluded.season, slot = excluded.slot, hp = excluded.hp, boost_minutes = excluded.boost_minutes,
    boost_mult = excluded.boost_mult, shelf = excluded.shelf, rotates = excluded.rotates, active = excluded.active, sort = excluded.sort,
    wide = excluded.wide, gift = excluded.gift, rank_tier = excluded.rank_tier;
  return true;
end;
$$;

-- Timmy's days with the HP his snacks and floss gave that day (bought in the shop); the page adds it on that day
create or replace function public.get_pet_days_v2(p_visitor text)
returns table(d date, attempts integer, correct integer, hp integer)
language sql stable security definer set search_path = public as $$
  with a as (select g.d, g.attempts, g.correct from get_pet_days(p_visitor) g),
  s as (
    select p.day as d, sum(p.hp)::integer as hp from pet_purchases p
    where p.visitor_id = p_visitor and p.hp is not null and p.day > (now() at time zone 'America/Chicago')::date - 70
    group by p.day
  )
  select coalesce(a.d, s.d), coalesce(a.attempts, 0), coalesce(a.correct, 0), coalesce(s.hp, 0)
  from a full join s on s.d = a.d order by 1;
$$;

-- the starting catalog. Names, ids, rarities and prices follow the art (tools/figures/site/place.mjs: its HOMES, SCENES,
-- YARD, OUTFITS, PAINTS and UPGRADES name each piece's id here; Sam, 2026-11-06: the server's names follow the art).
-- The seasonal sets and the rank sets are the second statement below.
insert into public.shop_items (id, name, kind, rarity, price, season, slot, hp, boost_minutes, boost_mult, shelf, rotates, sort) values
  ('scrub-cap', 'Scrub cap', 'outfit', 'common', 150, null, null, null, null, null, false, true, 101),
  ('bow-tie', 'Bow tie', 'outfit', 'common', 120, null, null, null, null, null, false, true, 102),
  ('beanie', 'Beanie and scarf', 'outfit', 'common', 180, null, null, null, null, null, false, true, 103),
  ('safety-glasses', 'Safety glasses', 'outfit', 'uncommon', 300, null, null, null, null, null, false, true, 104),
  ('white-coat', 'White coat', 'outfit', 'uncommon', 450, null, null, null, null, null, false, true, 105),
  ('graduation-cap', 'Graduation cap', 'outfit', 'rare', 900, null, null, null, null, null, false, true, 106),
  ('sun-hat', 'Straw sun hat', 'outfit', 'common', 150, null, null, null, null, null, false, true, 107),
  ('ranger-hat', 'Ranger hat', 'outfit', 'uncommon', 300, null, null, null, null, null, false, true, 108),
  ('sunglasses-lei', 'Sunglasses and a lei', 'outfit', 'uncommon', 350, null, null, null, null, null, false, true, 109),
  ('captain-hat', 'Captain''s hat', 'outfit', 'rare', 800, null, null, null, null, null, false, true, 110),
  ('nightcap', 'Starry nightcap', 'outfit', 'rare', 900, null, null, null, null, null, false, true, 111),
  ('aviator-cap', 'Aviator cap and goggles', 'outfit', 'rare', 1000, null, null, null, null, null, false, true, 112),
  ('castle', 'Castle', 'home', 'legendary', 8000, null, null, null, null, null, false, true, 201),
  ('giant-mushroom', 'Giant mushroom', 'home', 'legendary', 6000, null, null, null, null, null, false, true, 202),
  ('treehouse', 'Treehouse', 'home', 'legendary', 5000, null, null, null, null, null, false, true, 203),
  ('lighthouse', 'Lighthouse', 'home', 'legendary', 7000, null, null, null, null, null, false, true, 204),
  ('observatory', 'Observatory', 'home', 'legendary', 7500, null, null, null, null, null, false, true, 205),
  ('beach-hut', 'Beach hut', 'home', 'epic', 2600, null, null, null, null, null, false, true, 206),
  ('igloo', 'Igloo', 'home', 'epic', 2200, null, null, null, null, null, false, true, 207),
  ('beach', 'Beach', 'scene', 'rare', 1000, null, null, null, null, null, false, true, 301),
  ('forest', 'Forest', 'scene', 'rare', 800, null, null, null, null, null, false, true, 302),
  ('snowy-mountain', 'Snowy mountain', 'scene', 'epic', 1800, null, null, null, null, null, false, true, 303),
  ('night-sky', 'Night sky', 'scene', 'epic', 2500, null, null, null, null, null, false, true, 304),
  ('clouds', 'Above the clouds', 'scene', 'epic', 2800, null, null, null, null, null, false, true, 305),
  ('mailbox', 'Mailbox', 'yard', 'common', 100, null, null, null, null, null, false, true, 401),
  ('garden', 'Garden', 'yard', 'uncommon', 300, null, null, null, null, null, false, true, 402),
  ('hammock', 'Hammock', 'yard', 'uncommon', 350, null, null, null, null, null, false, true, 403),
  ('doghouse', 'Doghouse', 'yard', 'uncommon', 400, null, null, null, null, null, false, true, 404),
  ('bowling-lane', 'Bowling lane', 'yard', 'rare', 1200, null, null, null, null, null, false, true, 405),
  ('swimming-pool', 'Swimming pool', 'yard', 'epic', 2000, null, null, null, null, null, false, true, 406),
  ('mouthwash-fountain', 'Mouthwash fountain', 'yard', 'rare', 900, null, null, null, null, null, false, true, 407),
  ('sandcastle', 'Sandcastle', 'yard', 'common', 150, null, null, null, null, null, false, true, 408),
  ('beach-umbrella', 'Beach umbrella', 'yard', 'uncommon', 350, null, null, null, null, null, false, true, 409),
  ('campfire', 'Campfire', 'yard', 'uncommon', 400, null, null, null, null, null, false, true, 410),
  ('hot-spring', 'Hot spring', 'yard', 'epic', 2200, null, null, null, null, null, false, true, 411),
  ('telescope', 'Telescope', 'yard', 'rare', 1000, null, null, null, null, null, false, true, 412),
  ('podcast-studio', 'Podcast studio', 'yard', 'epic', 2400, null, null, null, null, null, false, true, 413),
  ('fancy-windows', 'Fancy windows', 'upgrade', 'uncommon', 250, null, 'windows', null, null, null, false, true, 501),
  ('porch', 'Porch', 'upgrade', 'rare', 700, null, 'porch', null, null, null, false, true, 502),
  ('chimney', 'Chimney', 'upgrade', 'uncommon', 300, null, 'chimney', null, null, null, false, true, 503),
  ('flag', 'Timmy flag', 'upgrade', 'common', 120, null, 'flag', null, null, null, false, true, 504),
  ('paint-mint', 'Mint paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 505),
  ('paint-lilac', 'Lilac paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 506),
  ('paint-sky', 'Sky paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 507),
  ('paint-butter', 'Butter paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 508),
  ('paint-peach', 'Peach paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 509),
  ('apple', 'Apple', 'snack', 'common', 100, null, null, 10, null, null, true, false, 601),
  ('cheese-cube', 'Cheese cube', 'snack', 'common', 150, null, null, 15, null, null, true, false, 602),
  ('floss', 'Floss', 'snack', 'uncommon', 250, null, null, 25, null, null, true, false, 603),
  ('fluoride-rinse', 'Fluoride rinse', 'snack', 'uncommon', 400, null, null, 40, null, null, true, false, 604),
  ('boost-1h', 'Double XP for 1 hour', 'boost', 'rare', 600, null, null, null, 60, 2, true, false, 701),
  ('boost-3h', 'Double XP for 3 hours', 'boost', 'epic', 1500, null, null, null, 180, 2, true, false, 702),
  ('pirate', 'Pirate', 'costume', 'epic', 2000, null, null, null, null, null, false, false, 901),
  ('astronaut', 'Astronaut', 'costume', 'epic', 2500, null, null, null, null, null, false, false, 902),
  ('detective', 'Detective', 'costume', 'epic', 1800, null, null, null, null, null, false, false, 903),
  ('chef', 'Chef', 'costume', 'epic', 1500, null, null, null, null, null, false, false, 904),
  ('captain-enamel', 'Captain Enamel', 'costume', 'legendary', 4000, null, null, null, null, null, false, false, 905)
on conflict (id) do nothing;
update public.shop_items set wide = true where id = 'bowling-lane' and not wide;

-- The seasonal sets and the rank sets (Sam, 2026-11-10): exactly the pieces of tools/figures/site/sets.mjs (allSetItems()),
-- which the art draws by the same ids; tools/release/xp.js fails if the two differ. These rows are generated from that
-- file: change it, then these. A season's set is 1 home and 1 scene (both Legendary) and a Rare, an Epic and a Legendary
-- outfit and yard thing; Halloween's is everyone's gift. A rank set is an outfit and a yard thing for a full rank-up.
insert into public.shop_items (id, name, kind, rarity, price, season, gift, rank_tier, rotates, sort) values
  ('haunted-manor', 'Haunted manor', 'home', 'legendary', 6500, 'halloween', true, null, false, 1001),
  ('pumpkin-patch', 'Pumpkin patch at dusk', 'scene', 'legendary', 5000, 'halloween', true, null, false, 1002),
  ('floss-mummy', 'Floss mummy', 'outfit', 'rare', 800, 'halloween', true, null, false, 1003),
  ('bedsheet-ghost', 'Bedsheet ghost', 'outfit', 'epic', 1800, 'halloween', true, null, false, 1004),
  ('skeleton-suit', 'Skeleton suit', 'outfit', 'legendary', 4500, 'halloween', true, null, false, 1005),
  ('pumpkin-lantern', 'Pumpkin lanterns', 'yard', 'rare', 700, 'halloween', true, null, false, 1006),
  ('bubbling-cauldron', 'Bubbling cauldron', 'yard', 'epic', 1800, 'halloween', true, null, false, 1007),
  ('haunted-tree', 'Haunted tree', 'yard', 'legendary', 4200, 'halloween', true, null, false, 1008),
  ('harvest-barn', 'Harvest barn', 'home', 'legendary', 6000, 'thanksgiving', false, null, false, 1011),
  ('harvest-fields', 'Harvest fields', 'scene', 'legendary', 5000, 'thanksgiving', false, null, false, 1012),
  ('scarecrow-hat', 'Scarecrow hat', 'outfit', 'rare', 700, 'thanksgiving', false, null, false, 1013),
  ('football-helmet', 'Football helmet', 'outfit', 'epic', 1800, 'thanksgiving', false, null, false, 1014),
  ('parade-marshal', 'Parade grand marshal', 'outfit', 'legendary', 4500, 'thanksgiving', false, null, false, 1015),
  ('hay-bales', 'Hay bales', 'yard', 'rare', 700, 'thanksgiving', false, null, false, 1016),
  ('harvest-table', 'Harvest table', 'yard', 'epic', 2000, 'thanksgiving', false, null, false, 1017),
  ('turkey-balloon', 'Turkey parade balloon', 'yard', 'legendary', 4500, 'thanksgiving', false, null, false, 1018),
  ('log-cabin', 'Snowy log cabin', 'home', 'legendary', 6500, 'winter', false, null, false, 1021),
  ('aurora-lake', 'Frozen lake under the northern lights', 'scene', 'legendary', 5500, 'winter', false, null, false, 1022),
  ('ugly-sweater', 'Holiday sweater', 'outfit', 'rare', 700, 'winter', false, null, false, 1023),
  ('elf-suit', 'Elf suit', 'outfit', 'epic', 1800, 'winter', false, null, false, 1024),
  ('nutcracker', 'Nutcracker uniform', 'outfit', 'legendary', 4800, 'winter', false, null, false, 1025),
  ('snow-globe', 'Snow globe', 'yard', 'rare', 800, 'winter', false, null, false, 1026),
  ('ice-rink', 'Ice rink', 'yard', 'epic', 2200, 'winter', false, null, false, 1027),
  ('holiday-tree', 'Decorated tree', 'yard', 'legendary', 4500, 'winter', false, null, false, 1028),
  ('clock-tower', 'Clock tower', 'home', 'legendary', 7000, 'newyear', false, null, false, 1031),
  ('midnight-rooftops', 'Midnight rooftops', 'scene', 'legendary', 5500, 'newyear', false, null, false, 1032),
  ('sparkle-bow-tie', 'Sparkly bow tie', 'outfit', 'rare', 700, 'newyear', false, null, false, 1033),
  ('tuxedo', 'Tuxedo', 'outfit', 'epic', 2000, 'newyear', false, null, false, 1034),
  ('father-time', 'Father Time', 'outfit', 'legendary', 4500, 'newyear', false, null, false, 1035),
  ('confetti-cannon', 'Confetti cannon', 'yard', 'rare', 800, 'newyear', false, null, false, 1036),
  ('countdown-clock', 'Countdown clock', 'yard', 'epic', 2000, 'newyear', false, null, false, 1037),
  ('ball-drop', 'Midnight ball drop', 'yard', 'legendary', 4500, 'newyear', false, null, false, 1038),
  ('french-quarter', 'French Quarter townhouse', 'home', 'legendary', 7000, 'mardigras', false, null, false, 1041),
  ('parade-street', 'Parade street', 'scene', 'legendary', 5000, 'mardigras', false, null, false, 1042),
  ('bead-necklaces', 'Parade beads', 'outfit', 'rare', 700, 'mardigras', false, null, false, 1043),
  ('jester', 'Jester', 'outfit', 'epic', 1800, 'mardigras', false, null, false, 1044),
  ('carnival-king', 'Carnival king', 'outfit', 'legendary', 4500, 'mardigras', false, null, false, 1045),
  ('bead-tree', 'Bead tree', 'yard', 'rare', 700, 'mardigras', false, null, false, 1046),
  ('jazz-stand', 'Jazz stand', 'yard', 'epic', 1800, 'mardigras', false, null, false, 1047),
  ('parade-float', 'Parade float', 'yard', 'legendary', 4500, 'mardigras', false, null, false, 1048),
  ('heart-cottage', 'Heart cottage', 'home', 'legendary', 6000, 'valentine', false, null, false, 1051),
  ('rose-garden', 'Rose garden', 'scene', 'legendary', 5000, 'valentine', false, null, false, 1052),
  ('mail-cap', 'Love-letter mail cap', 'outfit', 'rare', 700, 'valentine', false, null, false, 1053),
  ('knight-of-hearts', 'Knight of hearts', 'outfit', 'epic', 1800, 'valentine', false, null, false, 1054),
  ('masquerade', 'Masquerade mask and cape', 'outfit', 'legendary', 4500, 'valentine', false, null, false, 1055),
  ('heart-balloon', 'Heart balloons', 'yard', 'rare', 700, 'valentine', false, null, false, 1056),
  ('swing-for-two', 'Swing for two', 'yard', 'epic', 1800, 'valentine', false, null, false, 1057),
  ('swan-pond', 'Swan pond', 'yard', 'legendary', 4500, 'valentine', false, null, false, 1058),
  ('pillow-palace', 'Pillow palace', 'home', 'legendary', 7000, 'toothfairy', false, null, false, 1061),
  ('fairy-glen', 'Moonlit fairy glen', 'scene', 'legendary', 5500, 'toothfairy', false, null, false, 1062),
  ('fairy-wand', 'Wand and tiara', 'outfit', 'rare', 800, 'toothfairy', false, null, false, 1063),
  ('fairy-wings', 'Fairy wings', 'outfit', 'epic', 2000, 'toothfairy', false, null, false, 1064),
  ('tooth-fairy', 'The Tooth Fairy', 'outfit', 'legendary', 5000, 'toothfairy', false, null, false, 1065),
  ('coin-pile', 'Pile of shiny coins', 'yard', 'rare', 800, 'toothfairy', false, null, false, 1066),
  ('tooth-pillow', 'Tooth pillow', 'yard', 'epic', 1800, 'toothfairy', false, null, false, 1067),
  ('fairy-ring', 'Fairy ring', 'yard', 'legendary', 4500, 'toothfairy', false, null, false, 1068),
  ('dental-office', 'Dental office', 'home', 'legendary', 7000, 'dentist', false, null, false, 1071),
  ('main-street', 'Main Street', 'scene', 'legendary', 5000, 'dentist', false, null, false, 1072),
  ('gold-mirror', 'Golden mouth mirror', 'outfit', 'rare', 900, 'dentist', false, null, false, 1073),
  ('surgical-scrubs', 'Surgical scrubs and mask', 'outfit', 'epic', 1800, 'dentist', false, null, false, 1074),
  ('dr-timmy', 'Dr. Timmy''s long white coat', 'outfit', 'legendary', 4500, 'dentist', false, null, false, 1075),
  ('dental-chair', 'Dental chair', 'yard', 'rare', 900, 'dentist', false, null, false, 1076),
  ('operatory-light', 'Operatory light and tray', 'yard', 'epic', 1800, 'dentist', false, null, false, 1077),
  ('molar-monument', 'Molar monument', 'yard', 'legendary', 4500, 'dentist', false, null, false, 1078),
  ('thatched-cottage', 'Thatched cottage', 'home', 'legendary', 6000, 'stpatrick', false, null, false, 1081),
  ('emerald-hills', 'Emerald hills', 'scene', 'legendary', 5000, 'stpatrick', false, null, false, 1082),
  ('flat-cap', 'Tweed flat cap', 'outfit', 'rare', 700, 'stpatrick', false, null, false, 1083),
  ('bagpiper', 'Bagpiper', 'outfit', 'epic', 1800, 'stpatrick', false, null, false, 1084),
  ('gold-buckle-suit', 'Gold-buckle suit', 'outfit', 'legendary', 4500, 'stpatrick', false, null, false, 1085),
  ('clover-patch', 'Clover patch', 'yard', 'rare', 700, 'stpatrick', false, null, false, 1086),
  ('wishing-well', 'Wishing well', 'yard', 'epic', 1800, 'stpatrick', false, null, false, 1087),
  ('pot-of-gold', 'Pot of gold', 'yard', 'legendary', 4500, 'stpatrick', false, null, false, 1088),
  ('egg-house', 'Painted egg house', 'home', 'legendary', 6000, 'easter', false, null, false, 1091),
  ('tulip-meadow', 'Tulip meadow', 'scene', 'legendary', 5000, 'easter', false, null, false, 1092),
  ('easter-bonnet', 'Easter bonnet', 'outfit', 'rare', 700, 'easter', false, null, false, 1093),
  ('egg-painter', 'Egg painter''s smock', 'outfit', 'epic', 1800, 'easter', false, null, false, 1094),
  ('bunny-suit', 'Bunny suit', 'outfit', 'legendary', 4500, 'easter', false, null, false, 1095),
  ('egg-basket', 'Giant egg basket', 'yard', 'rare', 700, 'easter', false, null, false, 1096),
  ('carrot-patch', 'Carrot patch', 'yard', 'epic', 1800, 'easter', false, null, false, 1097),
  ('chick-coop', 'Chick coop', 'yard', 'legendary', 4200, 'easter', false, null, false, 1098),
  ('flowerpot-house', 'Flowerpot house', 'home', 'legendary', 6000, 'spring', false, null, false, 1101),
  ('cherry-blossoms', 'Cherry blossom grove', 'scene', 'legendary', 5000, 'spring', false, null, false, 1102),
  ('rain-slicker', 'Raincoat and boots', 'outfit', 'rare', 700, 'spring', false, null, false, 1103),
  ('beekeeper', 'Beekeeper', 'outfit', 'epic', 1800, 'spring', false, null, false, 1104),
  ('butterfly-wings', 'Butterfly wings', 'outfit', 'legendary', 4500, 'spring', false, null, false, 1105),
  ('birdbath', 'Birdbath', 'yard', 'rare', 700, 'spring', false, null, false, 1106),
  ('beehives', 'Beehives', 'yard', 'epic', 1800, 'spring', false, null, false, 1107),
  ('greenhouse', 'Glass greenhouse', 'yard', 'legendary', 4500, 'spring', false, null, false, 1108),
  ('a-frame-cabin', 'A-frame cabin', 'home', 'legendary', 6000, 'july4', false, null, false, 1111),
  ('fairgrounds', 'Fairgrounds', 'scene', 'legendary', 5000, 'july4', false, null, false, 1112),
  ('stars-top-hat', 'Stars-and-stripes top hat', 'outfit', 'rare', 700, 'july4', false, null, false, 1113),
  ('drum-major', 'Drum major', 'outfit', 'epic', 1800, 'july4', false, null, false, 1114),
  ('lady-liberty', 'Lady Liberty', 'outfit', 'legendary', 4500, 'july4', false, null, false, 1115),
  ('picnic-blanket', 'Picnic blanket', 'yard', 'rare', 700, 'july4', false, null, false, 1116),
  ('fireworks-launcher', 'Fireworks launcher', 'yard', 'epic', 1800, 'july4', false, null, false, 1117),
  ('ferris-wheel', 'Little Ferris wheel', 'yard', 'legendary', 4500, 'july4', false, null, false, 1118),
  ('camper-van', 'Camper van', 'home', 'legendary', 6500, 'summer', false, null, false, 1121),
  ('summer-lake', 'Summer lake', 'scene', 'legendary', 5000, 'summer', false, null, false, 1122),
  ('snorkel', 'Snorkel and flippers', 'outfit', 'rare', 700, 'summer', false, null, false, 1123),
  ('lifeguard', 'Lifeguard', 'outfit', 'epic', 1800, 'summer', false, null, false, 1124),
  ('deep-sea-diver', 'Deep-sea diver', 'outfit', 'legendary', 4500, 'summer', false, null, false, 1125),
  ('lawn-sprinkler', 'Lawn sprinkler', 'yard', 'rare', 700, 'summer', false, null, false, 1126),
  ('barbecue-grill', 'Barbecue grill', 'yard', 'epic', 1800, 'summer', false, null, false, 1127),
  ('water-slide', 'Water slide', 'yard', 'legendary', 4500, 'summer', false, null, false, 1128),
  ('acorn-house', 'Acorn house', 'home', 'legendary', 6000, 'fall', false, null, false, 1131),
  ('autumn-woods', 'Autumn woods', 'scene', 'legendary', 5000, 'fall', false, null, false, 1132),
  ('flannel', 'Flannel and scarf', 'outfit', 'rare', 700, 'fall', false, null, false, 1133),
  ('fox-hood', 'Fox hood', 'outfit', 'epic', 1800, 'fall', false, null, false, 1134),
  ('tweed-professor', 'Tweed professor', 'outfit', 'legendary', 4500, 'fall', false, null, false, 1135),
  ('leaf-pile', 'Leaf pile', 'yard', 'rare', 700, 'fall', false, null, false, 1136),
  ('cider-stand', 'Apple cider stand', 'yard', 'epic', 1800, 'fall', false, null, false, 1137),
  ('apple-tree', 'Apple tree with a swing', 'yard', 'legendary', 4200, 'fall', false, null, false, 1138),
  ('rank-antique-outfit', 'Brass monocle and bowler', 'outfit', 'rare', 0, null, false, 1, false, 2001),
  ('rank-antique-yard', 'Treadle dental engine', 'yard', 'rare', 0, null, false, 1, false, 2002),
  ('rank-bronze-outfit', 'Bronze gladiator helmet', 'outfit', 'rare', 0, null, false, 2, false, 2003),
  ('rank-bronze-yard', 'Bronze bell', 'yard', 'rare', 0, null, false, 2, false, 2004),
  ('rank-silver-outfit', 'Silver knight''s helm', 'outfit', 'epic', 0, null, false, 3, false, 2005),
  ('rank-silver-yard', 'Silver trophy cup', 'yard', 'epic', 0, null, false, 3, false, 2006),
  ('rank-gold-outfit', 'Golden laurels and toga', 'outfit', 'epic', 0, null, false, 4, false, 2007),
  ('rank-gold-yard', 'Golden tooth statue', 'yard', 'epic', 0, null, false, 4, false, 2008),
  ('rank-diamond-outfit', 'Diamond shades and ice cape', 'outfit', 'legendary', 0, null, false, 5, false, 2009),
  ('rank-diamond-yard', 'Diamond geode', 'yard', 'legendary', 0, null, false, 5, false, 2010),
  ('rank-dark-outfit', 'Dark Matter cloak', 'outfit', 'legendary', 0, null, false, 6, false, 2011),
  ('rank-dark-yard', 'Dark Matter orb', 'yard', 'legendary', 0, null, false, 6, false, 2012)
on conflict (id) do nothing;

-- ====================================================================== 6. the idea board
-- Ideas show as soon as they're posted, under the poster's leaderboard name, with up and down votes. Each picks a hub (one
-- hub, or null for all hubs) and a category. Three reports hide one until Sam looks; Sam gives a status with one line on
-- why, and the author and everyone who voted it up get a note in their Inbox. Votes inform, they don't decide.
create table if not exists public.ideas (
  id bigint generated always as identity primary key,
  visitor_id text,                                   -- null for the starter ideas
  name text not null,
  title text not null,
  body text not null default '',
  hub text,                                          -- null: all hubs
  category text not null check (category in ('feature', 'better', 'content', 'fun', 'look', 'other')),
  source text not null check (source in ('board', 'suggest', 'checkin', 'starter')),
  request_id text unique,
  status text not null default 'open' check (status in ('open', 'considering', 'planned', 'shipped', 'not-doing')),
  status_note text,
  status_at timestamptz,
  hidden boolean not null default false,
  hidden_by text check (hidden_by in ('reports', 'admin')),
  restored_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ideas_visitor on public.ideas (visitor_id, created_at);
create table if not exists public.idea_votes (
  idea_id bigint not null references public.ideas (id) on delete cascade,
  visitor_id text not null,
  val smallint not null check (val in (-1, 1)),
  at timestamptz not null default now(),
  primary key (idea_id, visitor_id)
);
create table if not exists public.idea_reports (
  idea_id bigint not null references public.ideas (id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  primary key (idea_id, visitor_id)
);
create table if not exists public.idea_notes (
  id bigint generated always as identity primary key,
  idea_id bigint not null references public.ideas (id) on delete cascade,
  visitor_id text not null,
  status text not null,
  note text,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);
create index if not exists idea_notes_visitor on public.idea_notes (visitor_id, created_at);

-- { ok: true, id, name } or { ok: false, error: 'bad' | 'name' | 'title' | 'long' | 'hub' | 'category' | 'slow' | 'limit' | 'dup' }
create or replace function public.post_idea(p_visitor text, p_title text, p_body text, p_hub text, p_category text,
  p_source text default 'board', p_request text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t text := btrim(regexp_replace(coalesce(p_title, ''), '\s+', ' ', 'g')); b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g'));
  h text := nullif(btrim(coalesce(p_hub, '')), ''); n text; prev record; iid bigint;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or coalesce(p_source, 'board') not in ('board', 'suggest', 'checkin')
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$') then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  if p_request is not null then
    select id, visitor_id, name into prev from ideas where request_id = p_request;
    if found then
      if prev.visitor_id = p_visitor then return jsonb_build_object('ok', true, 'id', prev.id, 'name', prev.name, 'repeat', true); end if;
      return jsonb_build_object('ok', false, 'error', 'dup');
    end if;
  end if;
  n := (select btrim(display_name) from visitor_names where visitor_id = p_visitor);
  if coalesce(n, '') = '' then return jsonb_build_object('ok', false, 'error', 'name'); end if;
  if length(t) < 3 or length(t) > 80 then return jsonb_build_object('ok', false, 'error', 'title'); end if;
  if length(b) > 280 then return jsonb_build_object('ok', false, 'error', 'long'); end if;
  if h is not null and (h !~ '^[a-z0-9][a-z0-9-]{0,39}$' or not exists (select 1 from question_keys k where k.hub = h)) then
    return jsonb_build_object('ok', false, 'error', 'hub'); end if;
  if p_category is null or p_category not in ('feature', 'better', 'content', 'fun', 'look', 'other') then
    return jsonb_build_object('ok', false, 'error', 'category'); end if;
  perform pg_advisory_xact_lock(hashtext('idea|' || p_visitor));
  if exists (select 1 from ideas where visitor_id = p_visitor and created_at > now() - interval '20 seconds') then
    return jsonb_build_object('ok', false, 'error', 'slow'); end if;
  if (select count(*) from ideas where visitor_id = p_visitor
      and (created_at at time zone 'America/Chicago')::date = (now() at time zone 'America/Chicago')::date) >= 3 then
    return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  insert into ideas (visitor_id, name, title, body, hub, category, source, request_id)
    values (p_visitor, left(n, 24), t, b, h, p_category, coalesce(p_source, 'board'), p_request) returning id into iid;
  return jsonb_build_object('ok', true, 'id', iid, 'name', left(n, 24));
end;
$$;

-- p_val: 1 up, -1 down, 0 take it back. Returns the new counts.
create or replace function public.vote_idea(p_visitor text, p_id bigint, p_val integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_val is null or p_val not in (-1, 0, 1)
     or not exists (select 1 from ideas where id = p_id and not hidden) then return null; end if;
  if p_val = 0 then delete from idea_votes where idea_id = p_id and visitor_id = p_visitor;
  else insert into idea_votes (idea_id, visitor_id, val) values (p_id, p_visitor, p_val)
    on conflict (idea_id, visitor_id) do update set val = excluded.val, at = now(); end if;
  return jsonb_build_object('up', (select count(*) from idea_votes where idea_id = p_id and val = 1),
    'down', (select count(*) from idea_votes where idea_id = p_id and val = -1), 'mine', p_val);
end;
$$;

-- anyone reports an idea once (not their own); the third reporter since Sam last restored it hides it
create or replace function public.report_idea(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
declare r timestamptz;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return false; end if;
  select restored_at into r from ideas where id = p_id and not hidden and visitor_id is distinct from p_visitor;
  if not found then return false; end if;
  insert into idea_reports (idea_id, visitor_id) values (p_id, p_visitor) on conflict do nothing;
  if (select count(*) from idea_reports where idea_id = p_id and created_at > coalesce(r, '-infinity'::timestamptz)) >= 3 then
    update ideas set hidden = true, hidden_by = 'reports' where id = p_id and not hidden;
  end if;
  return true;
end;
$$;

-- the author's own delete removes the idea completely (Sam, 2026-11-11): its row, and with it (on delete cascade) its
-- votes, reports and Inbox notes. Nothing is kept, so a deleted idea no longer counts toward the day's three or the 20
-- seconds, and Sam can't see or bring it back.
create or replace function public.delete_my_idea(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null then return false; end if;
  delete from ideas where id = p_id and visitor_id = p_visitor;
  return found;
end;
$$;

-- the board: p_tab 'top' (by score), 'new' (newest) or 'shipped'; p_hub: null every idea, '' only the all-hubs ones, or a
-- hub (its ideas and the all-hubs ones); p_category: null or one. counts: how many each hub and category filter would show.
-- Never a visitor id: 'own' and 'mine' say what is the asking visitor's.
create or replace function public.get_ideas(p_visitor text, p_tab text default 'top', p_hub text default null, p_category text default null, p_limit integer default 50)
returns jsonb language sql stable security definer set search_path = public as $$
  with v as (
    select i.*, coalesce((select count(*) from idea_votes x where x.idea_id = i.id and x.val = 1), 0)::integer as up,
      coalesce((select count(*) from idea_votes x where x.idea_id = i.id and x.val = -1), 0)::integer as down
    from ideas i
    where not i.hidden and case when p_tab = 'shipped' then i.status = 'shipped' else i.status <> 'shipped' end
  ), hubf as (
    select * from v where p_hub is null or (p_hub = '' and v.hub is null) or (p_hub <> '' and (v.hub = p_hub or v.hub is null))
  ), catf as (
    select * from v where p_category is null or v.category = p_category
  ), shown as (
    select * from hubf where p_category is null or hubf.category = p_category
  )
  select jsonb_build_object(
    'ideas', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'body', s.body, 'name', s.name, 'hub', s.hub,
        'category', s.category, 'source', s.source, 'status', s.status, 'note', s.status_note, 'status_at', s.status_at,
        'up', s.up, 'down', s.down, 'at', s.created_at,
        'own', p_visitor is not null and s.visitor_id = p_visitor,
        'mine', coalesce((select x.val from idea_votes x where x.idea_id = s.id and x.visitor_id = p_visitor), 0),
        'reported', exists (select 1 from idea_reports r where r.idea_id = s.id and r.visitor_id = p_visitor))
      order by case when p_tab = 'top' then s.up - s.down end desc nulls last,
               case when p_tab = 'shipped' then s.status_at end desc nulls last, s.created_at desc, s.id desc)
      from (select * from shown order by case when p_tab = 'top' then shown.up - shown.down end desc nulls last,
              case when p_tab = 'shipped' then shown.status_at end desc nulls last, shown.created_at desc, shown.id desc
            limit greatest(1, least(coalesce(p_limit, 50), 200))) s), '[]'::jsonb),
    'total', (select count(*) from shown),
    'hubs', coalesce((select jsonb_object_agg(coalesce(c.hub, ''), c.n) from (select catf.hub, count(*) as n from catf group by catf.hub) c), '{}'::jsonb),
    'categories', coalesce((select jsonb_object_agg(c.category, c.n) from (select hubf.category, count(*) as n from hubf group by hubf.category) c), '{}'::jsonb));
$$;

-- the admin page's Idea board (no visitor ids): every idea from the last p_days with its votes and reports
create or replace function public.admin_ideas(p_secret text, p_days integer default 90)
returns table(id bigint, hub text, category text, source text, name text, title text, body text, status text, status_note text,
  up bigint, down bigint, reports bigint, hidden boolean, hidden_by text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select i.id, i.hub, i.category, i.source, i.name, i.title, i.body, i.status, i.status_note,
      (select count(*) from idea_votes x where x.idea_id = i.id and x.val = 1),
      (select count(*) from idea_votes x where x.idea_id = i.id and x.val = -1),
      (select count(*) from idea_reports r where r.idea_id = i.id), i.hidden, i.hidden_by, i.created_at
    from ideas i where i.created_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 90), 400)))
    order by i.created_at desc limit 500;
end;
$$;

-- p_action: 'hide', 'restore' or 'status' (with p_status and one line on why). A new status notes the author and every
-- up-voter in their Inbox.
create or replace function public.admin_set_idea(p_secret text, p_id bigint, p_action text, p_status text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare i record; nn text := nullif(left(btrim(coalesce(p_note, '')), 200), ''); k int := 0;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  select * into i from ideas where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  if p_action = 'hide' then update ideas set hidden = true, hidden_by = 'admin' where id = p_id;
  elsif p_action = 'restore' then update ideas set hidden = false, hidden_by = null, restored_at = now() where id = p_id;
  elsif p_action = 'status' then
    if p_status is null or p_status not in ('open', 'considering', 'planned', 'shipped', 'not-doing') then raise exception 'bad status'; end if;
    if p_status is distinct from i.status or nn is distinct from i.status_note then
      update ideas set status = p_status, status_note = nn, status_at = now() where id = p_id;
      if p_status is distinct from i.status and p_status <> 'open' then
        insert into idea_notes (idea_id, visitor_id, status, note)
          select p_id, w.visitor_id, p_status, nn from (
            select i.visitor_id where i.visitor_id is not null
            union select x.visitor_id from idea_votes x where x.idea_id = p_id and x.val = 1) w;
        get diagnostics k = row_count;
      end if;
    end if;
  else raise exception 'bad action';
  end if;
  return jsonb_build_object('ok', true, 'notified', k);
end;
$$;

-- the starting ideas, posted at the release by Timmy and his neighbors (names as in tools/podcast/LORE.md), with no visitor
create or replace function public.admin_post_starter_idea(p_secret text, p_poster text, p_title text, p_body text, p_hub text, p_category text)
returns bigint language plpgsql security definer set search_path = public as $$
declare iid bigint; h text := nullif(btrim(coalesce(p_hub, '')), '');
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if length(btrim(coalesce(p_poster, ''))) not between 1 and 40 or length(btrim(coalesce(p_title, ''))) not between 3 and 80
     or length(coalesce(p_body, '')) > 280 then raise exception 'bad starter idea'; end if;
  insert into ideas (visitor_id, name, title, body, hub, category, source)
    values (null, btrim(p_poster), btrim(p_title), btrim(coalesce(p_body, '')), h, p_category, 'starter') returning id into iid;
  return iid;
end;
$$;

-- the Inbox with the idea notes, and each report's outcome ('fixed' says +100 XP was paid)
create or replace function public.get_my_inbox_v2(p_visitor text)
returns table(kind text, id bigint, hub text, title text, note text, message text, at timestamptz, seen boolean, expires_at timestamptz, outcome text)
language sql stable security definer set search_path = public as $$
  select * from (
    select i.kind, i.id, i.hub, i.title, i.note, i.message, i.at, i.seen, i.expires_at, o.outcome
      from get_my_inbox(p_visitor) i left join report_outcomes o on o.kind = i.kind and o.report_id = i.id
    union all
    select 'idea'::text, n.id, d.hub, d.title, n.status, n.note, n.created_at, n.seen_at is not null, null::timestamptz, null::text
      from idea_notes n join ideas d on d.id = n.idea_id
     where p_visitor is not null and n.visitor_id = p_visitor and n.created_at > now() - interval '90 days'
  ) r order by 7 desc limit 60;
$$;

create or replace function public.mark_idea_note_seen(p_visitor text, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null then return false; end if;
  update idea_notes set seen_at = now() where id = p_id and visitor_id = p_visitor and seen_at is null;
  return found;
end;
$$;

-- ====================================================================== 7. Link my devices, and the bootstrap
-- Today's redeem_link_code (migration_v52), plus the new tables, moved before the answers so the answer trigger's rebuild
-- sees them: awards and boosts (a key both devices earned pays once), sessions, the baseline (added together), purchases
-- (spending adds up), the inventory (both devices' things), what's equipped (per slot, the newer choice wins), the costume
-- log, ideas, votes (the newer vote wins), reports and notes.
-- Then one rebuild for both ids.
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

  -- the game layer (v54)
  insert into xp_awards (visitor_id, key, src, hub, base, xp, at, d)
    select p, key, src, hub, base, xp, at, d from xp_awards where visitor_id = p_visitor on conflict (visitor_id, key) do nothing;
  delete from xp_awards where visitor_id = p_visitor;
  insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
    select p, key, src, mult, starts_at, ends_at from xp_boosts where visitor_id = p_visitor on conflict (visitor_id, key) do nothing;
  delete from xp_boosts where visitor_id = p_visitor;
  update xp_sessions set visitor_id = p where visitor_id = p_visitor;
  insert into game_baseline (visitor_id, xp, badges, at)
    select p, xp, badges, at from game_baseline where visitor_id = p_visitor
    on conflict (visitor_id) do update set xp = game_baseline.xp + excluded.xp,
      badges = array(select distinct z from unnest(game_baseline.badges || excluded.badges) z order by 1);
  delete from game_baseline where visitor_id = p_visitor;
  update pet_purchases set visitor_id = p where visitor_id = p_visitor;
  insert into pet_inventory (visitor_id, item_id, bought_at)
    select p, item_id, bought_at from pet_inventory where visitor_id = p_visitor
    on conflict (visitor_id, item_id) do update set bought_at = least(pet_inventory.bought_at, excluded.bought_at);
  delete from pet_inventory where visitor_id = p_visitor;
  insert into pet_equipped (visitor_id, slot, item_id, set_at)
    select p, slot, item_id, set_at from pet_equipped where visitor_id = p_visitor
    on conflict (visitor_id, slot) do update set
      item_id = case when excluded.set_at > pet_equipped.set_at then excluded.item_id else pet_equipped.item_id end,
      set_at = greatest(pet_equipped.set_at, excluded.set_at);
  delete from pet_equipped where visitor_id = p_visitor;
  delete from pet_equipped e using pet_equipped e2                       -- a yard item now in two spots stays in the newer one
    where e.visitor_id = p and e2.visitor_id = p and e.item_id = e2.item_id and e.slot <> e2.slot
      and (e.set_at, e.slot) < (e2.set_at, e2.slot);
  insert into costume_log (visitor_id, costume, first_day)
    select p, costume, first_day from costume_log where visitor_id = p_visitor
    on conflict (visitor_id, costume) do update set first_day = least(costume_log.first_day, excluded.first_day);
  delete from costume_log where visitor_id = p_visitor;
  update ideas set visitor_id = p where visitor_id = p_visitor;
  insert into idea_votes (idea_id, visitor_id, val, at)
    select idea_id, p, val, at from idea_votes where visitor_id = p_visitor
    on conflict (idea_id, visitor_id) do update set val = case when excluded.at > idea_votes.at then excluded.val else idea_votes.val end,
      at = greatest(idea_votes.at, excluded.at);
  delete from idea_votes where visitor_id = p_visitor;
  insert into idea_reports (idea_id, visitor_id, created_at)
    select idea_id, p, created_at from idea_reports where visitor_id = p_visitor on conflict do nothing;
  delete from idea_reports where visitor_id = p_visitor;
  update idea_notes set visitor_id = p where visitor_id = p_visitor;

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
  -- one rebuild for both ids, also when the second device had no answers (v54)
  perform sh_xp_rebuild(array[p, p_visitor]);
  return p;
end;
$$;

-- today's bootstrap, with the new rank (journey, 63 steps, boost, Dark Matter seen), Timmy's days with snack HP, the Inbox
-- with idea notes and outcomes, and the shop (wallet, inventory, what's equipped, today's shop, the costume log)
create or replace function public.get_widget_bootstrap_v2(
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
declare b jsonb := get_widget_bootstrap(p_visitor, p_hub, p_cavity_week, p_episode, p_include_pins, p_dashboard, p_luck_hub, p_luck_date, p_link_name);
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then
    return b || jsonb_build_object('shop', get_my_shop(null));
  end if;
  return b || jsonb_build_object(
    'rank', get_rank_profile_v2(p_visitor),
    'pet_days', coalesce((select jsonb_agg(to_jsonb(pd) order by pd.d) from get_pet_days_v2(p_visitor) pd), '[]'::jsonb),
    'inbox', coalesce((select jsonb_agg(to_jsonb(i) order by i.at desc) from get_my_inbox_v2(p_visitor) i), '[]'::jsonb),
    'shop', get_my_shop(p_visitor));
end;
$$;

-- ====================================================================== 8. the baseline at the switch
insert into public.game_baseline (visitor_id, xp, badges)
  select v.visitor_id, coalesce(x.xp, 0),
    array(select jsonb_array_elements_text(coalesce(public.get_rank_profile(v.visitor_id)->'badges', '[]'::jsonb)))
  from (select visitor_id from public.xp_visitors union select visitor_id from public.achievements) v
  left join public.xp_visitors x on x.visitor_id = v.visitor_id
on conflict (visitor_id) do nothing;

-- ====================================================================== 9. row-level security and grants
alter table public.game_config enable row level security;
alter table public.game_baseline enable row level security;
alter table public.question_keys enable row level security;
alter table public.xp_awards enable row level security;
alter table public.xp_boosts enable row level security;
alter table public.xp_sessions enable row level security;
alter table public.answer_xp enable row level security;
alter table public.podcast_episodes enable row level security;
alter table public.report_outcomes enable row level security;
alter table public.shop_items enable row level security;
alter table public.pet_purchases enable row level security;
alter table public.pet_inventory enable row level security;
alter table public.pet_equipped enable row level security;
alter table public.costume_log enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.idea_reports enable row level security;
alter table public.idea_notes enable row level security;
alter table public.visit_secret enable row level security;
revoke all on table public.game_config, public.game_baseline, public.question_keys, public.xp_awards, public.xp_boosts,
  public.xp_sessions, public.answer_xp, public.podcast_episodes, public.report_outcomes, public.shop_items, public.pet_purchases,
  public.pet_inventory, public.pet_equipped, public.costume_log, public.ideas, public.idea_votes, public.idea_reports,
  public.idea_notes, public.visit_secret from public, anon, authenticated;

-- private helpers: only the functions above call them
revoke all on function public.sh_v2_at() from public, anon, authenticated;
revoke all on function public.sh_key(text, text, text) from public, anon, authenticated;
revoke all on function public.sh_xp_mult(text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_boost_json(text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_award(text, text, text, text, integer, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_xp_replay(text[]) from public, anon, authenticated;
revoke all on function public.sh_xp_rebuild(text[]) from public, anon, authenticated;
revoke all on function public.sh_medal_check(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_answer(timestamptz, text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public, anon, authenticated;
revoke all on function public.sh_session_start(timestamptz, text, text, text, text) from public, anon, authenticated;
revoke all on function public.sh_session_finish(timestamptz, text, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.sh_pod_minute(timestamptz, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.sh_shop_pick(text, integer, text[]) from public, anon, authenticated;
revoke all on function public.sh_shop_day(date) from public, anon, authenticated;
revoke all on function public.sh_shop_for(text, date) from public, anon, authenticated;
revoke all on function public.sh_wallet(text) from public, anon, authenticated;
revoke all on function public.sh_throwback_items(date) from public, anon, authenticated;
revoke all on function public.sh_season_was_on(text, date, date) from public, anon, authenticated;
revoke all on function public.sh_owned(text) from public, anon, authenticated;
revoke all on function public.sh_owns(text, text) from public, anon, authenticated;
revoke all on function public.sh_buy(date, text, text, text) from public, anon, authenticated;
revoke all on function public.sh_my_shop(date, text) from public, anon, authenticated;
-- the visit key is made only inside the boards and get_place: nobody can ask for the key of an id
revoke all on function public.sh_visit_key(text) from public, anon, authenticated;

-- what pages call (sh_rank, sh_season, sh_is_fall, sh_easter, sh_shop_seasons, sh_throwback_days and sh_is_throwback are
-- pure arithmetic on the ladder and the calendar)
revoke all on function public.record_answer_v2(text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) from public;
grant execute on function public.record_answer_v2(text, text, text, integer, integer[], boolean, text, text, text, uuid, boolean) to anon, authenticated;
revoke all on function public.xp_session_start(text, text, text, text) from public;
grant execute on function public.xp_session_start(text, text, text, text) to anon, authenticated;
revoke all on function public.xp_session_finish(text, uuid, integer, integer) from public;
grant execute on function public.xp_session_finish(text, uuid, integer, integer) to anon, authenticated;
revoke all on function public.pod_minute_v2(text, text, text, integer) from public;
grant execute on function public.pod_minute_v2(text, text, text, integer) to anon, authenticated;
revoke all on function public.sh_rank(integer) from public;
grant execute on function public.sh_rank(integer) to anon, authenticated;
revoke all on function public.sh_season(date) from public;
grant execute on function public.sh_season(date) to anon, authenticated;
revoke all on function public.sh_is_fall(date) from public;
grant execute on function public.sh_is_fall(date) to anon, authenticated;
revoke all on function public.sh_easter(integer) from public;
grant execute on function public.sh_easter(integer) to anon, authenticated;
revoke all on function public.sh_shop_seasons(date) from public;
grant execute on function public.sh_shop_seasons(date) to anon, authenticated;
revoke all on function public.sh_throwback_days(date) from public;
grant execute on function public.sh_throwback_days(date) to anon, authenticated;
revoke all on function public.sh_is_throwback(date) from public;
grant execute on function public.sh_is_throwback(date) to anon, authenticated;
revoke all on function public.get_rank_profile_v2(text) from public;
grant execute on function public.get_rank_profile_v2(text) to anon, authenticated;
revoke all on function public.mark_dark_unlock_seen(text, integer) from public;
grant execute on function public.mark_dark_unlock_seen(text, integer) to anon, authenticated;
revoke all on function public.get_rank_board_v2(text, integer) from public;
grant execute on function public.get_rank_board_v2(text, integer) to anon, authenticated;
revoke all on function public.get_leaderboard_v2(integer) from public;
grant execute on function public.get_leaderboard_v2(integer) to anon, authenticated;
revoke all on function public.get_correct_streak_stats_v2() from public;
grant execute on function public.get_correct_streak_stats_v2() to anon, authenticated;
revoke all on function public.get_arcade_leaderboard_v2(text, text, text, integer) from public;
grant execute on function public.get_arcade_leaderboard_v2(text, text, text, integer) to anon, authenticated;
revoke all on function public.get_trophy_stats_v2() from public;
grant execute on function public.get_trophy_stats_v2() to anon, authenticated;
revoke all on function public.get_place(text) from public;
grant execute on function public.get_place(text) to anon, authenticated;
revoke all on function public.get_my_shop(text) from public;
grant execute on function public.get_my_shop(text) to anon, authenticated;
revoke all on function public.buy_item(text, text, text) from public;
grant execute on function public.buy_item(text, text, text) to anon, authenticated;
revoke all on function public.equip_item(text, text, text) from public;
grant execute on function public.equip_item(text, text, text) to anon, authenticated;
revoke all on function public.record_costume_sighting(text, text) from public;
grant execute on function public.record_costume_sighting(text, text) to anon, authenticated;
revoke all on function public.get_pet_days_v2(text) from public;
grant execute on function public.get_pet_days_v2(text) to anon, authenticated;
revoke all on function public.post_idea(text, text, text, text, text, text, text) from public;
grant execute on function public.post_idea(text, text, text, text, text, text, text) to anon, authenticated;
revoke all on function public.vote_idea(text, bigint, integer) from public;
grant execute on function public.vote_idea(text, bigint, integer) to anon, authenticated;
revoke all on function public.report_idea(text, bigint) from public;
grant execute on function public.report_idea(text, bigint) to anon, authenticated;
revoke all on function public.delete_my_idea(text, bigint) from public;
grant execute on function public.delete_my_idea(text, bigint) to anon, authenticated;
revoke all on function public.get_ideas(text, text, text, text, integer) from public;
grant execute on function public.get_ideas(text, text, text, text, integer) to anon, authenticated;
revoke all on function public.get_my_inbox_v2(text) from public;
grant execute on function public.get_my_inbox_v2(text) to anon, authenticated;
revoke all on function public.mark_idea_note_seen(text, bigint) from public;
grant execute on function public.mark_idea_note_seen(text, bigint) to anon, authenticated;
revoke all on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text) from public;
grant execute on function public.get_widget_bootstrap_v2(text, text, text, text, boolean, boolean, text, date, text) to anon, authenticated;
-- the admin page's, behind the admin secret
revoke all on function public.admin_load_question_keys(text, text, jsonb, boolean) from public;
grant execute on function public.admin_load_question_keys(text, text, jsonb, boolean) to anon, authenticated;
revoke all on function public.admin_set_podcast_episode(text, text, text, integer) from public;
grant execute on function public.admin_set_podcast_episode(text, text, text, integer) to anon, authenticated;
revoke all on function public.admin_resolve_report_v2(text, text, bigint, text, text) from public;
grant execute on function public.admin_resolve_report_v2(text, text, bigint, text, text) to anon, authenticated;
revoke all on function public.get_reports_v2(text) from public;
grant execute on function public.get_reports_v2(text) to anon, authenticated;
revoke all on function public.admin_upsert_shop_item(text, jsonb) from public;
grant execute on function public.admin_upsert_shop_item(text, jsonb) to anon, authenticated;
revoke all on function public.admin_ideas(text, integer) from public;
grant execute on function public.admin_ideas(text, integer) to anon, authenticated;
revoke all on function public.admin_set_idea(text, bigint, text, text, text) from public;
grant execute on function public.admin_set_idea(text, bigint, text, text, text) to anon, authenticated;
revoke all on function public.admin_post_starter_idea(text, text, text, text, text, text) from public;
grant execute on function public.admin_post_starter_idea(text, text, text, text, text, text) to anon, authenticated;

-- ====================================================================== migration_v55.sql
-- v55 (2026-11-12): Ask Timmy's server side, the database half (vault/tasks/2026-11-12-redesign-ask-timmy.md, how it
-- works: vault/reference/ask-timmy.md). Written and tested on a throwaway copy of supabase/schema.sql
-- (tools/release/rls.js, tools/release/timmy.js); applied to the live project at the redesign's release with
-- migration_v54, not before. Until then it is listed in supabase/pending-migrations.txt.
--
-- The Edge Function `timmy` (supabase/functions/timmy/) answers students' questions from the hubs' own content. It is the
-- only writer: it calls timmy_begin before it asks the model and timmy_finish after, with the service role. Students'
-- browsers read only their own chats (get_timmy_history) and can only thumb an answer, say what they did with an offer,
-- or report an answer.
-- The admin page reads everything behind the admin secret.
--
-- What it adds:
--   1. timmy_config: on or off, the site-wide daily spending cap (about $10), the messages per person per day (40);
--   2. timmy_chats and timmy_messages: every message to and from Timmy, with the visitor id (Sam, 2026-11-12: "store all
--      chat logs with timmy"; vault/rules/learner-data-privacy.md), closed to anon and authenticated altogether;
--   3. timmy_begin / timmy_finish (service role only): the limits, the chat, the last 10 messages, whether the question
--      being asked about was answered, then the reply with its tokens and estimated cost;
--   4. the students' calls: get_timmy_history, timmy_thumb, timmy_offer, and timmy_report (the chat's Report button on
--      an answer that went wrong; Sam, 2026-11-12: "so if timmy gives an error or bad answer or something, you can report
--      it and we can fix what went wrong"), sent as a usual report so it reaches the admin Inbox and Sam's reply comes back;
--   5. the admin page's: admin_timmy_days, admin_timmy_chats, admin_timmy_chat, admin_timmy_not_covered,
--      admin_timmy_unchecked, admin_timmy_reported, admin_timmy_config;
--   6. Link my devices moves the chats (a trigger on visitor_links, so redeem_link_code stays as migration_v54 has it).
--
-- Every new table has row-level security on and no policy, and anon and authenticated have no privilege on it.

-- ====================================================================== 1. the settings
-- One row. enabled = false turns Timmy off everywhere at once (the chat says he's napping). day_cap_usd stops new
-- questions for the rest of the Central day once the day's estimated cost (plus what's in flight) would pass it.
-- reserve_usd is what each question in flight holds against the cap until its answer's real cost is known.
create table if not exists public.timmy_config (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  day_cap_usd numeric(8,2) not null default 10 check (day_cap_usd >= 0),
  per_visitor_day integer not null default 40 check (per_visitor_day >= 0),
  reserve_usd numeric(8,4) not null default 0.08 check (reserve_usd >= 0),
  updated_at timestamptz not null default now()
);
insert into public.timmy_config (id) values (true) on conflict (id) do nothing;

-- ====================================================================== 2. the chats
-- hub: a hub id, or 'dashboard' (there Timmy knows every live hub; the function sends the hubs it used in context).
create table if not exists public.timmy_chats (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  hub text not null,
  started_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  messages integer not null default 0
);
create index if not exists timmy_chats_visitor on public.timmy_chats (visitor_id, hub, last_at desc);
create index if not exists timmy_chats_last on public.timmy_chats (last_at desc);

-- One row per message. A student's row: what they typed (text), where they were and what the page sent with it (context:
-- view, lecture, paragraph, the answered question's id and pick, the progress summary for "What should I study
-- tonight?"), the exact text the model was sent (sent, so later turns replay it byte for byte and the prompt cache holds),
-- the browser's id for the send (request_id), and what it holds against the day's cap while in flight (reserve_usd).
-- Timmy's row (reply_to = the student's row): the answer's paragraphs as plain text (text), the checked answer as the
-- browser got it (reply), what the model wrote (raw), its kind, the quotes that checked and the ones that didn't, the
-- offer and what the student did with it, the thumb, the model that served it, its tokens, estimated cost and time.
create table if not exists public.timmy_messages (
  id bigint generated always as identity primary key,
  chat_id uuid not null references public.timmy_chats (id) on delete cascade,
  who text not null check (who in ('student', 'timmy')),
  text text not null,
  context jsonb,
  sent text,
  request_id text,
  reserve_usd numeric(8,4) not null default 0,
  reply_to bigint references public.timmy_messages (id) on delete cascade,
  reply jsonb,
  raw text,
  kind text check (kind in ('answer', 'not_covered', 'quiz_declined', 'hint_declined', 'off_topic', 'support', 'refusal', 'error')),
  cites_ok integer,
  cites_bad integer,
  unchecked jsonb,
  offer_kind text check (offer_kind in ('report', 'idea')),
  offer_action text check (offer_action in ('sent', 'posted', 'dismissed')),
  offer_at timestamptz,
  thumb smallint check (thumb in (-1, 1)),
  thumb_at timestamptz,
  report_id bigint,
  reported_at timestamptz,
  model text,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_write_tokens integer,
  cost_usd numeric(10,6),
  ms integer,
  day date not null default ((now() at time zone 'America/Chicago')::date),
  created_at timestamptz not null default now()
);
create index if not exists timmy_messages_chat on public.timmy_messages (chat_id, id);
create index if not exists timmy_messages_day on public.timmy_messages (day);
create unique index if not exists timmy_messages_reply on public.timmy_messages (reply_to) where reply_to is not null;
create unique index if not exists timmy_messages_request on public.timmy_messages (request_id) where request_id is not null;

alter table public.timmy_config enable row level security;
alter table public.timmy_chats enable row level security;
alter table public.timmy_messages enable row level security;
revoke all on table public.timmy_config, public.timmy_chats, public.timmy_messages from public, anon, authenticated;
grant all on table public.timmy_config, public.timmy_chats, public.timmy_messages to service_role;

-- ====================================================================== 3. the function's two calls (service role only)
-- Before the model is asked. p_chat: the chat to continue (null starts one; a chat of someone else's or another hub's
-- starts a new one). p_qid: the question "Ask Timmy" was tapped on, so the function knows whether this visitor answered it
-- (only then may its key and whys go in the prompt). p_request: the browser's random id for this send.
-- { ok: true, chat, message, history: [{ who, text, kind, sent, raw }] (the last 10 messages before this one, oldest
--   first), answered, spent, cap }
-- { ok: true, repeat: true, chat, message, reply }         this request was answered before: the same answer, no new call
-- { ok: false, error: 'bad' | 'off' | 'limit' | 'cap' | 'busy' }
--   limit: this person's 40 for the Central day; cap: the site's daily spend; busy: a question of theirs is still being
--   answered (one at a time, so a script can't fire forty at once).
create or replace function public.timmy_begin(p_visitor text, p_hub text, p_chat uuid, p_text text, p_context jsonb,
  p_request text default null, p_qid text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cfg record; t text := btrim(coalesce(p_text, '')); today date := (now() at time zone 'America/Chicago')::date;
  prev record; n int; spent numeric; ch uuid; mid bigint; hist jsonb; ans boolean := false; rep record;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or length(t) not between 1 and 1000
     or (p_context is not null and (jsonb_typeof(p_context) <> 'object' or length(p_context::text) > 6000))
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$')
     or (p_qid is not null and length(p_qid) not between 1 and 80) then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  select * into cfg from timmy_config where id;
  if not found or not cfg.enabled then return jsonb_build_object('ok', false, 'error', 'off'); end if;
  perform pg_advisory_xact_lock(hashtext('timmy|' || p_visitor));

  -- a retried send: the same answer again, or wait for the one in flight
  if p_request is not null then
    select m.id, m.chat_id, m.created_at, c.visitor_id into prev from timmy_messages m join timmy_chats c on c.id = m.chat_id where m.request_id = p_request;
    if found then
      if prev.visitor_id <> p_visitor then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
      select id, reply into rep from timmy_messages where reply_to = prev.id;
      if found and rep.reply is not null then
        return jsonb_build_object('ok', true, 'repeat', true, 'chat', prev.chat_id, 'message', rep.id, 'reply', rep.reply);
      end if;
      if prev.created_at > now() - interval '2 minutes' then return jsonb_build_object('ok', false, 'error', 'busy'); end if;
      -- asked over 2 minutes ago and never answered (the function stopped): ask again as a new message
      delete from timmy_messages where id = prev.id;
      update timmy_chats set messages = greatest(0, messages - 1) where id = prev.chat_id;
    end if;
  end if;

  -- one question at a time
  if exists (select 1 from timmy_messages m join timmy_chats c on c.id = m.chat_id
             where c.visitor_id = p_visitor and m.who = 'student' and m.created_at > now() - interval '2 minutes'
               and not exists (select 1 from timmy_messages r where r.reply_to = m.id)) then
    return jsonb_build_object('ok', false, 'error', 'busy');
  end if;

  -- this person's messages today (an answer that failed doesn't count)
  select count(*) into n from timmy_messages m join timmy_chats c on c.id = m.chat_id
    where c.visitor_id = p_visitor and m.who = 'student' and m.day = today
      and not exists (select 1 from timmy_messages r where r.reply_to = m.id and r.kind = 'error');
  if n >= cfg.per_visitor_day then return jsonb_build_object('ok', false, 'error', 'limit'); end if;

  -- the site's spend today: what answers cost, plus what questions in flight hold
  perform pg_advisory_xact_lock(hashtext('timmy-spend'));
  select coalesce(sum(cost_usd), 0) + coalesce(sum(reserve_usd) filter (where created_at > now() - interval '5 minutes'), 0)
    into spent from timmy_messages where day = today;
  if spent + cfg.reserve_usd > cfg.day_cap_usd then return jsonb_build_object('ok', false, 'error', 'cap'); end if;

  -- the chat
  if p_chat is not null then select id into ch from timmy_chats where id = p_chat and visitor_id = p_visitor and hub = p_hub; end if;
  if ch is null then insert into timmy_chats (visitor_id, hub) values (p_visitor, p_hub) returning id into ch; end if;
  select coalesce(jsonb_agg(jsonb_build_object('who', h.who, 'text', h.text, 'kind', h.kind, 'sent', h.sent, 'raw', h.raw) order by h.id), '[]'::jsonb)
    into hist from (select * from timmy_messages where chat_id = ch order by id desc limit 10) h;
  insert into timmy_messages (chat_id, who, text, context, request_id, reserve_usd)
    values (ch, 'student', t, p_context, p_request, cfg.reserve_usd) returning id into mid;
  update timmy_chats set last_at = now(), messages = messages + 1 where id = ch;

  if p_qid is not null and p_hub <> 'dashboard' then
    ans := exists (select 1 from personal_answers where visitor_id = p_visitor and hub = p_hub and qid = p_qid);
  end if;
  return jsonb_build_object('ok', true, 'chat', ch, 'message', mid, 'history', hist, 'answered', ans,
    'spent', round(spent, 4), 'cap', cfg.day_cap_usd);
end;
$$;

-- After the model answered (or failed: kind 'error', no cost). p_sent: the exact text the model was sent for the
-- student's turn (kept on the student's row, so a later turn replays it byte for byte). Returns Timmy's message id; a
-- second call for the same student message returns the first one's id and changes nothing.
create or replace function public.timmy_finish(p_student bigint, p_sent text, p_kind text, p_text text, p_reply jsonb, p_raw text,
  p_cites_ok integer default 0, p_cites_bad integer default 0, p_unchecked jsonb default null, p_offer_kind text default null,
  p_model text default null, p_input integer default null, p_output integer default null, p_cache_read integer default null,
  p_cache_write integer default null, p_cost numeric default 0, p_ms integer default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare s record; mid bigint;
begin
  select * into s from timmy_messages where id = p_student and who = 'student';
  if not found then raise exception 'unknown message'; end if;
  select id into mid from timmy_messages where reply_to = p_student;
  if found then return mid; end if;
  insert into timmy_messages (chat_id, who, text, reply_to, reply, raw, kind, cites_ok, cites_bad, unchecked, offer_kind,
      model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, ms)
    values (s.chat_id, 'timmy', left(coalesce(p_text, ''), 8000), p_student, p_reply, left(p_raw, 24000), p_kind,
      greatest(0, coalesce(p_cites_ok, 0)), greatest(0, coalesce(p_cites_bad, 0)), p_unchecked, p_offer_kind,
      left(p_model, 80), p_input, p_output, p_cache_read, p_cache_write, greatest(0, coalesce(p_cost, 0)), p_ms)
    returning id into mid;
  update timmy_messages set reserve_usd = 0, sent = left(p_sent, 24000) where id = p_student;
  update timmy_chats set last_at = now(), messages = messages + 1 where id = s.chat_id;
  return mid;
end;
$$;

-- ====================================================================== 4. the students' calls
-- The caller's own chats on one hub (or the dashboard), newest first, with their messages oldest first: what each said,
-- Timmy's checked answers, the thumbs and what was done with each offer. Never the context, tokens or cost.
create or replace function public.get_timmy_history(p_visitor text, p_hub text, p_limit integer default 10)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', c.id, 'started', c.started_at, 'last', c.last_at, 'messages', (
        select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'who', m.who, 'text', m.text, 'reply', m.reply, 'kind', m.kind,
            'thumb', m.thumb, 'offer', m.offer_kind, 'offer_action', m.offer_action, 'at', m.created_at) order by m.id), '[]'::jsonb)
        from (select * from timmy_messages where chat_id = c.id order by id desc limit 60) m)) order by c.last_at desc)
    from (select * from timmy_chats where visitor_id = p_visitor and hub = p_hub order by last_at desc
          limit greatest(1, least(coalesce(p_limit, 10), 20))) c), '[]'::jsonb);
end;
$$;

-- a thumb on one of Timmy's answers to the caller: 1 up, -1 down, 0 takes it back
create or replace function public.timmy_thumb(p_visitor text, p_message bigint, p_val integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or p_val is null or p_val not in (-1, 0, 1) then return false; end if;
  update timmy_messages m set thumb = nullif(p_val, 0)::smallint, thumb_at = now()
    from timmy_chats c where m.id = p_message and m.who = 'timmy' and c.id = m.chat_id and c.visitor_id = p_visitor;
  return found;
end;
$$;

-- what the student did with Timmy's offer: 'sent' (the report), 'posted' (the idea), 'dismissed' (No thanks)
create or replace function public.timmy_offer(p_visitor text, p_message bigint, p_action text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_visitor is null or p_action is null or p_action not in ('sent', 'posted', 'dismissed') then return false; end if;
  update timmy_messages m set offer_action = p_action, offer_at = now()
    from timmy_chats c where m.id = p_message and m.who = 'timmy' and m.offer_kind is not null
      and (p_action = 'dismissed' or (p_action = 'sent') = (m.offer_kind = 'report'))
      and c.id = m.chat_id and c.visitor_id = p_visitor;
  return found;
end;
$$;

-- a report on one of Timmy's answers (the chat's Report button: a wrong or bad answer, an error), sent the site's usual
-- way: a question_flags row, so it is in the admin page's Inbox and Sam's reply reaches the sender as any reply does. Its
-- note ends " — Timmy's answer <id> · <where>", and the answer is marked, so the Timmy tab opens the whole chat. p_message
-- null: a report about Timmy with no answer to point at (he was napping, or wouldn't answer); then p_hub says where.
-- Ten Timmy reports a person a day; reporting the same answer again returns the first report.
-- { ok: true, id } or { ok: false, error: 'bad' | 'limit' }
create or replace function public.timmy_report(p_visitor text, p_hub text, p_message bigint, p_note text, p_section text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n text := btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g')); m record; h text; fid bigint;
  w text := nullif(left(regexp_replace(coalesce(p_section, ''), '[^A-Za-z0-9/_:-]', '', 'g'), 60), '');
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or length(n) not between 1 and 600 then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  if p_message is not null then
    select tm.id, tm.report_id, c.hub into m from timmy_messages tm join timmy_chats c on c.id = tm.chat_id
      where tm.id = p_message and tm.who = 'timmy' and c.visitor_id = p_visitor;
    if not found then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    if m.report_id is not null then return jsonb_build_object('ok', true, 'id', m.report_id, 'repeat', true); end if;
    h := m.hub;
  else
    if p_hub is null or not (p_hub = 'dashboard' or p_hub ~ '^[a-z0-9][a-z0-9-]{0,39}$') then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
    h := p_hub;
  end if;
  perform pg_advisory_xact_lock(hashtext('timmy-report|' || p_visitor));
  if (select count(*) from question_flags where visitor_id = p_visitor and note like '% — Timmy%' and created_at > now() - interval '1 day') >= 10 then
    return jsonb_build_object('ok', false, 'error', 'limit');
  end if;
  insert into question_flags (hub, note, visitor_id)
    values (h, left(n, 600) || ' — Timmy' || coalesce('''s answer ' || p_message, '') || coalesce(' · ' || w, ''), p_visitor) returning id into fid;
  if p_message is not null then update timmy_messages set report_id = fid, reported_at = now() where id = p_message; end if;
  return jsonb_build_object('ok', true, 'id', fid);
end;
$$;

-- ====================================================================== 5. the admin page (the Timmy tab)
-- By Central day and hub: people, questions, answers, estimated cost, not covered, declined (quiz and practice), errors,
-- thumbs, quotes that checked and didn't, offers made and taken, answers reported.
create or replace function public.admin_timmy_days(p_secret text, p_days integer default 30)
returns table(day date, hub text, people bigint, questions bigint, answers bigint, cost_usd numeric, not_covered bigint,
  quiz_declined bigint, hint_declined bigint, errors bigint, thumbs_up bigint, thumbs_down bigint, cites_ok bigint,
  cites_bad bigint, offers bigint, offers_taken bigint, reported bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select m.day, c.hub, count(distinct c.visitor_id), count(*) filter (where m.who = 'student'), count(*) filter (where m.who = 'timmy'),
      round(coalesce(sum(m.cost_usd), 0), 4), count(*) filter (where m.kind = 'not_covered'), count(*) filter (where m.kind = 'quiz_declined'),
      count(*) filter (where m.kind = 'hint_declined'), count(*) filter (where m.kind in ('error', 'refusal')),
      count(*) filter (where m.thumb = 1), count(*) filter (where m.thumb = -1),
      coalesce(sum(m.cites_ok), 0)::bigint, coalesce(sum(m.cites_bad), 0)::bigint,
      count(*) filter (where m.offer_kind is not null), count(*) filter (where m.offer_action in ('sent', 'posted')),
      count(*) filter (where m.report_id is not null)
    from timmy_messages m join timmy_chats c on c.id = m.chat_id
    where m.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 400))
    group by m.day, c.hub order by m.day desc, c.hub;
end;
$$;

-- recent chats, newest first: no visitor id, the first question and how each went
create or replace function public.admin_timmy_chats(p_secret text, p_hub text default null, p_days integer default 14, p_limit integer default 100)
returns table(id uuid, hub text, started_at timestamptz, last_at timestamptz, messages integer, first_question text,
  kinds text[], thumbs_down bigint, cost_usd numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select c.id, c.hub, c.started_at, c.last_at, c.messages,
      (select left(m.text, 200) from timmy_messages m where m.chat_id = c.id and m.who = 'student' order by m.id limit 1),
      array(select distinct m.kind from timmy_messages m where m.chat_id = c.id and m.kind is not null order by 1),
      (select count(*) from timmy_messages m where m.chat_id = c.id and m.thumb = -1),
      (select round(coalesce(sum(m.cost_usd), 0), 4) from timmy_messages m where m.chat_id = c.id)
    from timmy_chats c
    where (p_hub is null or c.hub = p_hub) and c.last_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 14), 400)))
    order by c.last_at desc limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

-- one chat, every message with what it carried (no visitor id)
create or replace function public.admin_timmy_chat(p_secret text, p_chat uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return (select jsonb_build_object('id', c.id, 'hub', c.hub, 'started', c.started_at, 'last', c.last_at, 'messages', (
      select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'who', m.who, 'text', m.text, 'kind', m.kind, 'context', m.context,
          'reply', m.reply, 'cites_ok', m.cites_ok, 'cites_bad', m.cites_bad, 'unchecked', m.unchecked, 'offer', m.offer_kind,
          'offer_action', m.offer_action, 'thumb', m.thumb, 'report_id', m.report_id, 'reported_at', m.reported_at,
          'report', (select f.note from question_flags f where f.id = m.report_id), 'model', m.model, 'input_tokens', m.input_tokens,
          'output_tokens', m.output_tokens, 'cache_read_tokens', m.cache_read_tokens, 'cache_write_tokens', m.cache_write_tokens,
          'cost_usd', m.cost_usd, 'ms', m.ms, 'at', m.created_at) order by m.id), '[]'::jsonb)
      from timmy_messages m where m.chat_id = c.id))
    from timmy_chats c where c.id = p_chat);
end;
$$;

-- the questions Timmy said the notes don't cover (gaps in the content), with the closest lecture he named
create or replace function public.admin_timmy_not_covered(p_secret text, p_days integer default 30)
returns table(message_id bigint, chat_id uuid, hub text, day date, question text, closest text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select r.id, c.id, c.hub, r.day, s.text, r.reply->>'closest'
    from timmy_messages r join timmy_messages s on s.id = r.reply_to join timmy_chats c on c.id = r.chat_id
    where r.kind = 'not_covered' and r.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 400))
    order by r.id desc limit 500;
end;
$$;

-- the quotes that didn't check out against the paragraph they cited (each shows as plain text, without a link)
create or replace function public.admin_timmy_unchecked(p_secret text, p_days integer default 30)
returns table(message_id bigint, chat_id uuid, hub text, day date, unchecked jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select m.id, c.id, c.hub, m.day, m.unchecked
    from timmy_messages m join timmy_chats c on c.id = m.chat_id
    where m.cites_bad > 0 and m.day > (now() at time zone 'America/Chicago')::date - greatest(1, least(coalesce(p_days, 30), 400))
    order by m.id desc limit 500;
end;
$$;

-- the answers students reported from the chat, newest first, with the report's words and whether it's resolved
-- (the reply itself is written in the Inbox, as for any report)
create or replace function public.admin_timmy_reported(p_secret text, p_days integer default 30)
returns table(message_id bigint, chat_id uuid, hub text, day date, kind text, answer text, report_id bigint, report text,
  resolved boolean, reported_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  return query
    select m.id, c.id, c.hub, m.day, m.kind, left(m.text, 400), m.report_id, f.note, coalesce(f.resolved, false), m.reported_at
    from timmy_messages m join timmy_chats c on c.id = m.chat_id left join question_flags f on f.id = m.report_id
    where m.report_id is not null and m.reported_at > now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 400)))
    order by m.reported_at desc limit 500;
end;
$$;

-- read the settings, or change them (a null leaves a setting as it is), with today's spend
create or replace function public.admin_timmy_config(p_secret text, p_enabled boolean default null, p_day_cap_usd numeric default null,
  p_per_visitor_day integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cfg record; today date := (now() at time zone 'America/Chicago')::date;
begin
  if not sh_admin_ok(p_secret) then raise exception 'unauthorized' using errcode = '28000'; end if;
  if p_enabled is not null or p_day_cap_usd is not null or p_per_visitor_day is not null then
    update timmy_config set enabled = coalesce(p_enabled, enabled),
      day_cap_usd = coalesce(greatest(0, least(p_day_cap_usd, 100)), day_cap_usd),
      per_visitor_day = coalesce(greatest(0, least(p_per_visitor_day, 500)), per_visitor_day), updated_at = now() where id;
  end if;
  select * into cfg from timmy_config where id;
  return jsonb_build_object('enabled', cfg.enabled, 'day_cap_usd', cfg.day_cap_usd, 'per_visitor_day', cfg.per_visitor_day,
    'reserve_usd', cfg.reserve_usd, 'updated_at', cfg.updated_at,
    'spent_today', (select round(coalesce(sum(cost_usd), 0), 4) from timmy_messages where day = today),
    'questions_today', (select count(*) from timmy_messages where day = today and who = 'student'));
end;
$$;

-- ====================================================================== 6. Link my devices moves the chats
-- redeem_link_code (migration_v54) records each pair in visitor_links (alias -> the id that remains); the chats follow it,
-- so a linked device's history shows on the other. The trigger runs inside redeem_link_code's transaction.
create or replace function public.sh_timmy_on_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id is distinct from new.primary_id then
    update timmy_chats set visitor_id = new.primary_id where visitor_id = new.alias_id;
  end if;
  return new;
end;
$$;
drop trigger if exists visitor_links_timmy on public.visitor_links;
create trigger visitor_links_timmy after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_timmy_on_link();

-- ====================================================================== grants
revoke all on function public.timmy_begin(text, text, uuid, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.timmy_begin(text, text, uuid, text, jsonb, text, text) to service_role;
revoke all on function public.timmy_finish(bigint, text, text, text, jsonb, text, integer, integer, jsonb, text, text, integer, integer, integer, integer, numeric, integer) from public, anon, authenticated;
grant execute on function public.timmy_finish(bigint, text, text, text, jsonb, text, integer, integer, jsonb, text, text, integer, integer, integer, integer, numeric, integer) to service_role;
revoke all on function public.sh_timmy_on_link() from public, anon, authenticated;
revoke all on function public.get_timmy_history(text, text, integer) from public;
grant execute on function public.get_timmy_history(text, text, integer) to anon, authenticated;
revoke all on function public.timmy_thumb(text, bigint, integer) from public;
grant execute on function public.timmy_thumb(text, bigint, integer) to anon, authenticated;
revoke all on function public.timmy_offer(text, bigint, text) from public;
grant execute on function public.timmy_offer(text, bigint, text) to anon, authenticated;
revoke all on function public.timmy_report(text, text, bigint, text, text) from public;
grant execute on function public.timmy_report(text, text, bigint, text, text) to anon, authenticated;
revoke all on function public.admin_timmy_reported(text, integer) from public;
grant execute on function public.admin_timmy_reported(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_days(text, integer) from public;
grant execute on function public.admin_timmy_days(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_chats(text, text, integer, integer) from public;
grant execute on function public.admin_timmy_chats(text, text, integer, integer) to anon, authenticated;
revoke all on function public.admin_timmy_chat(text, uuid) from public;
grant execute on function public.admin_timmy_chat(text, uuid) to anon, authenticated;
revoke all on function public.admin_timmy_not_covered(text, integer) from public;
grant execute on function public.admin_timmy_not_covered(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_unchecked(text, integer) from public;
grant execute on function public.admin_timmy_unchecked(text, integer) to anon, authenticated;
revoke all on function public.admin_timmy_config(text, boolean, numeric, integer) from public;
grant execute on function public.admin_timmy_config(text, boolean, numeric, integer) to anon, authenticated;

-- ====================================================================== migration_v56.sql
-- v56 (2026-11-12): Learn and Flashcards' server side (vault/tasks/2026-11-06-redesign-learn-and-flashcards.md; how it
-- works: vault/reference/game-server.md, "Learn and Flashcards"). Written and tested on a throwaway copy of
-- supabase/schema.sql with migration_v54 and migration_v55 (tools/release/xp.js, tools/release/rls.js); applied to the
-- live project at the redesign's release with them, not before. Until then it is listed in
-- supabase/pending-migrations.txt, after v54 and v55, which it needs and doesn't change (Sam, 2026-11-12: "B, go ahead":
-- a new file, so migration_v54.sql and migration_v55.sql stay as they are).
--
-- The Question Bank's "Study as" toggle studies the questions three ways. Questions and Learn are answers: they go
-- through record_answer_v2 as today (Learn's are filed under the context `other`, since v54's list of contexts is left
-- as it is). Flashcards are not answers: you flip a card and say how well you knew it (Again, Hard, Good, Easy), and
-- that rating never reaches question_stats, the class's picks, personal_answers or question health. This file keeps
-- those ratings, and Learn's step for each question, so a person's schedule and progress follow them to their other
-- devices, and pays a flashcard as v54 pays a self-graded card.
--
-- What it adds:
--   1. card_reviews: one row per rating or Learn step (visitor, hub, question id, what happened, when), per person,
--      closed to anon and authenticated altogether (kept like personal_answers: vault/reference/analytics-retention.md);
--   2. `card` as a kind of XP award (xp_awards.src), so the rebuild after a correction or Link my devices keeps them
--      as it keeps a mock's or a game's;
--   3. record_card_v2: records one rating or Learn step; a rating of a card that was due or new pays a flat 2 (doubled
--      by a boost), for a card's first three ratings a Central day, under the answers' speed limit (2 seconds since the
--      last answer or rating, no more than 30 in a minute); Study ahead (p_ahead) and Learn's steps pay nothing; a
--      replayed call returns its first answer and pays once, and another visitor's request id is refused;
--   4. reset_my_learn: Learn's Start over for a whole set in one call (a `learn-reset` row per question, no pay);
--      get_my_cards: your own rows for one hub, oldest first, which the page replays with the same scheduling code
--      (widget/study-modes.js) to rebuild the schedule and Learn's progress on another device;
--   5. Link my devices moves them (a trigger on visitor_links, as migration_v55 does for Timmy's chats, so
--      redeem_link_code stays as migration_v54 has it).
--
-- What it leaves alone (Sam, 2026-11-12): a rating is not an answer, so it doesn't make a day studied on the server (no
-- +20, not on the streak board, not the 20th answer) and never counts toward a medal. On the page it counts toward the
-- daily goal ring and the streak on every device (get_my_cards brings the days).

-- ====================================================================== 1. the log
create table if not exists public.card_reviews (
  id bigserial primary key,
  visitor_id text not null check (length(visitor_id) between 1 and 80),
  hub text not null check (hub ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  qid text not null check (length(qid) between 1 and 80),
  -- a flashcard's rating, or Learn's step for the question after this answer (0 missed, 1 right once, 2 mastered),
  -- or `learn-reset` (Start over)
  what text not null check (what in ('again', 'hard', 'good', 'easy', 'learn-0', 'learn-1', 'learn-2', 'learn-reset')),
  ahead boolean not null default false,       -- rated early with Study ahead: moves the schedule, pays nothing
  at timestamptz not null default now(),      -- when the server recorded it (the speed limit and the day use this)
  seen_at timestamptz not null default now(), -- when the page says it happened, kept within the last two days (the replay's order)
  request_id text unique check (request_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  xp integer not null default 0,
  resp jsonb
);
create index if not exists card_reviews_mine on public.card_reviews (visitor_id, hub, seen_at, id);
create index if not exists card_reviews_day on public.card_reviews (visitor_id, at);
alter table public.card_reviews enable row level security;
revoke all on table public.card_reviews from public, anon, authenticated;
revoke all on sequence public.card_reviews_id_seq from public, anon, authenticated;

-- ====================================================================== 2. a flashcard is a kind of award
alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check
  check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report', 'card'));

-- ====================================================================== 3. one rating or Learn step
-- p_what: 'again' | 'hard' | 'good' | 'easy' (a flashcard), 'learn-0' | 'learn-1' | 'learn-2' | 'learn-reset' (Learn);
-- p_ahead: rated with Study ahead (the card wasn't due); p_request: a random id per rating, so a retried or replayed call
-- records and pays once; p_seen: when the page says it happened (epoch milliseconds), for the replay's order only.
-- p_at is null except in the tests. The page decides whether a card was due or new; the server pays a card only for its
-- first three ratings a Central day, so tapping Easy over and over earns nothing after that.
create or replace function public.sh_card(p_at timestamptz, p_visitor text, p_hub text, p_qid text, p_what text,
  p_ahead boolean, p_request text, p_seen bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_at timestamptz; v_seen timestamptz; prev record; k public.question_keys; v_kind text; rid bigint; dd date;
  prev_t timestamptz; prev_c timestamptz; n60 int; n_day int; speed_ok boolean := false; v_base int := 0; v_mult int := 1;
  paid int := 0; why text; v_resp jsonb; rating boolean;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qid is null or length(p_qid) not between 1 and 80
     or p_what is null or p_what not in ('again', 'hard', 'good', 'easy', 'learn-0', 'learn-1', 'learn-2', 'learn-reset')
     or (p_request is not null and p_request !~ '^[A-Za-z0-9_-]{8,64}$') then
    return jsonb_build_object('ok', false, 'error', 'bad');
  end if;
  rating := p_what in ('again', 'hard', 'good', 'easy');
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  v_at := coalesce(p_at, clock_timestamp());
  v_seen := v_at;
  if p_seen is not null and p_seen between 0 and 32503680000000 then
    v_seen := least(v_at, greatest(v_at - interval '2 days', to_timestamp(p_seen / 1000.0)));
  end if;

  -- the same rating again (a retry, a reload, a replayed call): what it got the first time, nothing new
  if p_request is not null then
    select r.resp, r.visitor_id into prev from card_reviews r where r.request_id = p_request;
    if found then
      if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
      return jsonb_build_object('ok', false, 'error', 'dup');
    end if;
  end if;

  insert into card_reviews (visitor_id, hub, qid, what, ahead, at, seen_at, request_id)
    values (p_visitor, p_hub, p_qid, p_what, rating and coalesce(p_ahead, false), v_at, v_seen, p_request)
    returning id into rid;
  dd := (v_at at time zone 'America/Chicago')::date;

  if not rating then
    why := 'learn';
  elsif coalesce(p_ahead, false) then
    why := 'ahead';
  else
    -- a question the server has a key for (an unknown or retired id is recorded and never paid, as with answers)
    select * into k from sh_key(p_hub, p_qid, null);
    v_kind := case when k.qid is null then 'unknown' when k.retired then 'retired' else 'card' end;
    if v_kind <> 'card' then
      why := v_kind;
    else
      -- the speed limit, shared with answers: 2 seconds since the last answer or rating, 30 in a minute (a mock's
      -- answers aside, as for answers)
      select max(a.answered_at) into prev_t from personal_answers a where a.visitor_id = p_visitor and a.answered_at <= v_at;
      select max(r.at) into prev_c from card_reviews r
        where r.visitor_id = p_visitor and r.id <> rid and r.at <= v_at and r.what in ('again', 'hard', 'good', 'easy');
      select count(*) into n60 from (
        select a.answered_at from personal_answers a
          left join answer_xp x on x.answer_id = a.id left join xp_sessions ss on ss.id = x.session_id
          where a.visitor_id = p_visitor and a.answered_at >= v_at - interval '60 seconds' and a.answered_at <= v_at
            and coalesce(ss.kind, '') <> 'mock'
        union all
        select r.at from card_reviews r where r.visitor_id = p_visitor and r.at >= v_at - interval '60 seconds' and r.at <= v_at
          and r.what in ('again', 'hard', 'good', 'easy')) z;
      speed_ok := (prev_t is null or v_at - prev_t >= interval '2 seconds')
              and (prev_c is null or v_at - prev_c >= interval '2 seconds') and n60 <= 30;
      if not speed_ok then
        why := 'fast';
      else
        -- a card's first three ratings a Central day (Study ahead's don't count)
        select count(*) into n_day from card_reviews r
          where r.visitor_id = p_visitor and r.hub = p_hub and r.qid = p_qid and r.what in ('again', 'hard', 'good', 'easy')
            and not r.ahead and r.at <= v_at and (r.at at time zone 'America/Chicago')::date = dd;
        v_base := case when n_day <= 3 then 2 else 0 end;
        if v_base = 0 then why := 'repeat'; end if;
        v_mult := sh_xp_mult(p_visitor, v_at);
        paid := sh_award(p_visitor, 'c:' || rid, 'card', p_hub, v_base, v_mult, v_at);
      end if;
    end if;
  end if;

  v_resp := jsonb_build_object('ok', true, 'xp', paid, 'base', v_base, 'mult', v_mult, 'why', why,
    'boost', sh_boost_json(p_visitor, v_at), 'total', (select xv.xp from xp_visitors xv where xv.visitor_id = p_visitor));
  update card_reviews set xp = paid, resp = v_resp where id = rid;
  return v_resp;
end;
$$;

create or replace function public.record_card_v2(p_visitor text, p_hub text, p_qid text, p_what text,
  p_ahead boolean default false, p_request text default null, p_seen bigint default null)
returns jsonb language sql volatile security definer set search_path = public as $$
  select sh_card(null, p_visitor, p_hub, p_qid, p_what, p_ahead, p_request, p_seen);
$$;

-- Learn's Start over for a whole set at once (up to 2,000 questions of one hub): one `learn-reset` row per question, in
-- one call. It pays nothing and needs no request id: a replayed reset resets again, which changes nothing.
create or replace function public.reset_my_learn(p_visitor text, p_hub text, p_qids text[], p_seen bigint default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_at timestamptz := clock_timestamp(); v_seen timestamptz := v_at; n int;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_hub is null or p_hub !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_qids is null or cardinality(p_qids) not between 1 and 2000
     or exists (select 1 from unnest(p_qids) z where z is null or length(z) not between 1 and 80) then
    return 0;
  end if;
  if p_seen is not null and p_seen between 0 and 32503680000000 then
    v_seen := least(v_at, greatest(v_at - interval '2 days', to_timestamp(p_seen / 1000.0)));
  end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  insert into card_reviews (visitor_id, hub, qid, what, at, seen_at, resp)
    select p_visitor, p_hub, z, 'learn-reset', v_at, v_seen, '{"ok": true, "xp": 0, "why": "learn"}'::jsonb
    from (select distinct unnest(p_qids) as z) d;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ====================================================================== 4. your own rows, for the replay
-- [qid, what, when (epoch ms, the page's time), ahead (1/0), request id], oldest first: the newest 20,000 of one hub
create or replace function public.get_my_cards(p_visitor text, p_hub text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_array(x.qid, x.what, x.t, x.ahead, x.request_id) order by x.t, x.id), '[]'::jsonb)
  from (
    select r.id, r.qid, r.what, floor(extract(epoch from r.seen_at) * 1000)::bigint as t, case when r.ahead then 1 else 0 end as ahead, r.request_id
    from card_reviews r
    where p_visitor is not null and length(p_visitor) between 1 and 80 and length(coalesce(p_hub, '')) between 1 and 40
      and r.visitor_id = p_visitor and r.hub = p_hub
    order by r.seen_at desc, r.id desc
    limit 20000
  ) x;
$$;

-- ====================================================================== 5. Link my devices
-- redeem_link_code (migration_v54) records each pair in visitor_links (alias -> the id that remains); the ratings and
-- Learn's steps follow it inside the same transaction, after which its rebuild keeps the `card` awards it moved.
create or replace function public.sh_cards_on_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id is distinct from new.primary_id then
    update card_reviews set visitor_id = new.primary_id where visitor_id = new.alias_id;
  end if;
  return new;
end;
$$;
drop trigger if exists visitor_links_cards on public.visitor_links;
create trigger visitor_links_cards after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_cards_on_link();

-- ====================================================================== grants
revoke all on function public.sh_card(timestamptz, text, text, text, text, boolean, text, bigint) from public, anon, authenticated;
revoke all on function public.sh_cards_on_link() from public, anon, authenticated;
revoke all on function public.record_card_v2(text, text, text, text, boolean, text, bigint) from public;
grant execute on function public.record_card_v2(text, text, text, text, boolean, text, bigint) to anon, authenticated;
revoke all on function public.reset_my_learn(text, text, text[], bigint) from public;
grant execute on function public.reset_my_learn(text, text, text[], bigint) to anon, authenticated;
revoke all on function public.get_my_cards(text, text) from public;
grant execute on function public.get_my_cards(text, text) to anon, authenticated;

-- ====================================================================== migration_v57.sql
-- v57 (2026-11-13): Visit someone random, from the whole class (vault/tasks/done/2026-11-12-redesign-visiting.md; how
-- it works: vault/reference/game-server.md, "Visiting"). Written and tested on a throwaway copy of supabase/schema.sql
-- with migration_v54, migration_v55 and migration_v56 (tools/release/xp.js, tools/release/rls.js); applied to the live
-- project at the redesign's release with them, not before. Until then it is listed in supabase/pending-migrations.txt,
-- after v56. It needs migration_v54 (sh_visit_key, get_place) and changes nothing in it: migration_v54.sql is not to be
-- changed (Sam, 2026-11-12), so this is a new file.
--
-- Sam, 2026-11-13: "i want random to be for the whole class". The new dashboard's "Visit someone random" picked among
-- the rows of the board on the screen, because the page only ever holds the keys the boards hand out. This picks on the
-- server, from everyone get_place can open (anyone with XP, an answer streak or an arcade score: the same people) who has
-- customized their place, and hands back what get_place would for them plus their visit key, so the page can go back to
-- them and on to the next.
--
-- What it adds: get_random_place(p_visitor, p_skip), one read.
--   - only someone who has made their place their own (Sam, 2026-11-13: "skip people with zero customization"): at
--     least one thing chosen in a slot (pet_equipped; setting a slot back to its default deletes its row), so a plain
--     default place never comes up. A tap on a board row still opens anyone's;
--   - never you: not your own id, nor the id your linked devices share, nor any device linked to another (its place
--     is the one under the id that remains, which can be picked itself);
--   - p_skip: up to 100 visit keys the page has already shown on this trip; anyone else comes first, so a trip goes
--     through the class before it sees someone twice, and once everyone has been seen it starts again (never nothing
--     while there is someone else);
--   - nothing when no one else has customized their place (the page says so), or the visitor id is malformed;
--   - the answer is get_place's (name, what stands in each slot, rank, mastery flair) and `visit`, the key the boards
--     show for that person: never a visitor id, XP, a date or anything a place doesn't show. No opt-out, as on the
--     boards (Sam, 2026-11-11).

create or replace function public.get_random_place(p_visitor text, p_skip text[] default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  me text;
  skip text[];
  v text;
  k text;
begin
  if p_visitor is not null and length(p_visitor) not between 1 and 80 then return null; end if;
  me := coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
  skip := array(select s from unnest(coalesce(p_skip, '{}'::text[])) s where s ~ '^[0-9a-f]{24}$' limit 100);
  select z.visitor_id into v from (
    select x.visitor_id from xp_visitors x
    union select c.visitor_id from correct_streaks c
    union select a.visitor_id from arcade_scores a
  ) z
  where z.visitor_id is distinct from me and z.visitor_id is distinct from p_visitor
    and not exists (select 1 from visitor_links l where l.alias_id = z.visitor_id)
    and exists (select 1 from pet_equipped e where e.visitor_id = z.visitor_id)
  order by (cardinality(skip) > 0 and sh_visit_key(z.visitor_id) = any(skip)), random()
  limit 1;
  if v is null then return null; end if;
  k := sh_visit_key(v);
  return get_place(k) || jsonb_build_object('visit', k);
end;
$$;

-- ====================================================================== grants
revoke all on function public.get_random_place(text, text[]) from public;
grant execute on function public.get_random_place(text, text[]) to anon, authenticated;

-- ====================================================================== migration_v58.sql
-- v58 (2026-11-13): hidden ideas are kept 90 days (vault/reference/analytics-retention.md; the idea board:
-- vault/tasks/2026-11-06-idea-board.md). Sam approved the 90 days on 2026-11-11; it wasn't built with the board.
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/retention.js, tools/release/rls.js);
-- applied to the live project at the redesign's release, after migration_v54 to v57. It needs migration_v54 (ideas)
-- and changes nothing in it: a new file, as v56 and v57 are.
--
-- An idea is hidden by three reports (report_idea) or by Sam (admin_set_idea), and Sam can restore it. One that stays
-- hidden for 90 days is deleted by the weekly retention job (sh_retention_run, migration_v52), with its votes, reports
-- and Inbox notes (they reference it on delete cascade). An author's own delete already removes everything at once
-- (delete_my_idea), so there is nothing else to clean up.
--
-- When an idea was hidden wasn't recorded, so: a new column, kept by a trigger (the two functions that hide and the one
-- that restores stay exactly as migration_v54 wrote them).

alter table public.ideas add column if not exists hidden_at timestamptz;
update public.ideas set hidden_at = now() where hidden and hidden_at is null;

create or replace function public.sh_idea_hidden_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if not new.hidden then new.hidden_at := null;                       -- shown, or restored: the 90 days start over
  elsif tg_op = 'INSERT' then new.hidden_at := coalesce(new.hidden_at, now());
  elsif not old.hidden or new.hidden_at is null then new.hidden_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.sh_idea_hidden_at() from public, anon, authenticated;
drop trigger if exists ideas_hidden_at on public.ideas;
create trigger ideas_hidden_at before insert or update of hidden on public.ideas
  for each row execute function public.sh_idea_hidden_at();

-- The weekly job, as migration_v52 wrote it, with one more part: the idea board (before the device-link attempts).
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
