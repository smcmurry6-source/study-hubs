-- v44: XP as a running total. sh_visitor_xp(null) recomputed everyone's XP from every row of
-- personal_answers (a window sort that spilled to disk, ~0.9 s), and get_rank_profile,
-- get_trophy_stats, get_rank_board, get_leaderboard and get_correct_streak_stats call it on
-- every hub and dashboard load. On exam day (2026-10-30) that saturated the database: the
-- dashboard's handpiece rank board and the admin page's Time by section hit the 3 s anon limit.
--
-- Now a trigger keeps two small tables in step with personal_answers:
--   xp_seen  one row per (visitor, hub, qid, correct): the first time decides 10 vs 2 XP
--   xp_days  per visitor and Central-time day: answers, right answers, raw XP before the cap
-- sh_visitor_xp keeps its signature and rules (10 first-time right, 2 repeat right, 1 miss,
-- 600/day cap, +20 per study day) and reads xp_days. Updates and deletes on personal_answers
-- (redeem_link_code moves a device's rows) rebuild the affected visitors from scratch.

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

-- Recompute the given visitors from personal_answers with the original rules.
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

-- Backfill everyone, with inserts held off so none is missed or counted twice (the migration
-- runs as one transaction, so the lock holds until it commits).
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
