-- ============================================================
-- migration_v8.sql — tactical-nuke analytics (for the review admin
-- page) + correct-answer streak tracking (for the public dashboard).
--
-- 1. nuke_launches: logs every tactical-nuke strike. widget/v3.js
--    already calls record_nuke_launch(p_hub, p_visitor, p_name) on
--    every launch (it's been doing so since the nuke feature shipped,
--    but silently no-opped because this function didn't exist yet —
--    that's why the review page showed nothing).
-- 2. correct_streaks: a per-visitor running count of correct answers
--    in a row, persisted (unlike the in-page-only counter that gates
--    the nuke badge, which resets on reload by design). Feeds two
--    numbers on the public dashboard: the longest streak currently
--    still standing, and the best any visitor has ever reached.
--
-- Run this whole file once in the Supabase SQL editor.
-- ============================================================

-- ---------- tactical nuke ----------

create table if not exists nuke_launches (
  id bigint generated always as identity primary key,
  hub text not null default '',
  visitor_id text not null,
  display_name text,
  launched_at timestamptz not null default now()
);
alter table nuke_launches enable row level security;
-- no select policy — function-only access, same pattern as activity_pings/personal_answers

create index if not exists nuke_launches_launched_idx on nuke_launches (launched_at);
create index if not exists nuke_launches_hub_idx on nuke_launches (hub, launched_at);

-- write-only from the client, no secret needed (matches record_presence_ping/record_answer)
create or replace function record_nuke_launch(p_hub text, p_visitor text, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor is null or length(trim(p_visitor)) = 0 then return; end if;
  insert into nuke_launches (hub, visitor_id, display_name, launched_at)
  values (coalesce(p_hub, ''), p_visitor, nullif(trim(coalesce(p_name, '')), ''), now());
end;
$$;
grant execute on function record_nuke_launch(text, text, text) to anon, authenticated;

-- ---------- admin-secret-gated reads (same '093025' secret as get_reports / get_visitor_summary) ----------

create or replace function get_nuke_summary(p_secret text, p_days int default 30)
returns table(total_launches bigint, unique_launchers bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is distinct from '093025' then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query
  select count(*)::bigint, count(distinct visitor_id)::bigint
  from nuke_launches
  where launched_at >= now() - (p_days || ' days')::interval;
end;
$$;
grant execute on function get_nuke_summary(text, int) to anon, authenticated;

create or replace function get_nuke_by_hub(p_secret text, p_days int default 30)
returns table(hub text, launches bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is distinct from '093025' then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query
  select coalesce(nullif(n.hub, ''), '(unknown)') as hub, count(*)::bigint as launches
  from nuke_launches n
  where n.launched_at >= now() - (p_days || ' days')::interval
  group by coalesce(nullif(n.hub, ''), '(unknown)')
  order by launches desc;
end;
$$;
grant execute on function get_nuke_by_hub(text, int) to anon, authenticated;

create or replace function get_nuke_recent(p_secret text, p_limit int default 10)
returns table(display_name text, hub text, launched_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_secret is distinct from '093025' then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  return query
  select coalesce(n.display_name, anon_name(n.visitor_id)) as display_name,
         coalesce(nullif(n.hub, ''), '(unknown)') as hub,
         n.launched_at
  from nuke_launches n
  order by n.launched_at desc
  limit p_limit;
end;
$$;
grant execute on function get_nuke_recent(text, int) to anon, authenticated;

-- ---------- correct-answer streaks ----------

create table if not exists correct_streaks (
  visitor_id text primary key,
  current_streak int not null default 0,
  best_streak int not null default 0,
  updated_at timestamptz not null default now()
);
alter table correct_streaks enable row level security;
-- no select policy — function-only access

-- write-only from the client: called on every answer (correct or not) alongside
-- record_answer/record_personal_answer. Increments on a correct answer, resets
-- to 0 on a miss; best_streak is a high-water mark that only ever grows.
create or replace function record_correct_streak(p_visitor text, p_correct boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
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
grant execute on function record_correct_streak(text, boolean) to anon, authenticated;

-- public read for the dashboard (no secret, same pattern as get_leaderboard): up to
-- two rows, kind='active' (the longest streak still standing right now) and
-- kind='record' (the best any visitor has ever reached, even if since broken).
create or replace function get_correct_streak_stats()
returns table(kind text, display_name text, streak int)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  (
    select 'active'::text as kind, coalesce(vn.display_name, anon_name(s.visitor_id)) as display_name, s.current_streak as streak
    from correct_streaks s
    left join visitor_names vn on vn.visitor_id = s.visitor_id
    where s.current_streak > 0
    order by s.current_streak desc
    limit 1
  )
  union all
  (
    select 'record'::text as kind, coalesce(vn.display_name, anon_name(s.visitor_id)) as display_name, s.best_streak as streak
    from correct_streaks s
    left join visitor_names vn on vn.visitor_id = s.visitor_id
    where s.best_streak > 0
    order by s.best_streak desc
    limit 1
  );
end;
$$;
grant execute on function get_correct_streak_stats() to anon, authenticated;
