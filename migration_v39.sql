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
