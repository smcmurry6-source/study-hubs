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
