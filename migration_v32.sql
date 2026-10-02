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
                    'mirror', 'fullarch', 'flosschain', 'holiday', 'pet-revive', 'pet-perfect', 'pet-adopt') then return false; end if;
  insert into achievements (visitor_id, kind, hub) values (p_visitor, p_kind, left(coalesce(p_hub, ''), 40))
    on conflict do nothing;
  return found;
end;
$$;
