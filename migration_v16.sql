-- migration_v16 (2026-09-25): a steeper rank scale with three levels (I, II, III) inside every tier.
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
