-- v88 (2026-11-20): reaching Dark Matter pays 5,000 Shiny Gold Crowns, once for each journey's Dark Matter.
-- Sam, 2026-11-20: "reaching dark matter gets you 5000 crowns. be sure to put that on the rank up screen".
--
-- The wallet is worked out from what a student has earned, never stored (sh_wallet), so the award is a term of it, like
-- the +20 a rank-up: 5,000 for every journey whose Dark Matter the student's XP has reached (the Handpiece's at 50,000 XP,
-- the ModuPro's at 232,142, the Loupes' at 357,142; sh_rank's gtier 6, 13 and 20). It counts from the first XP, not from
-- the switch, so a student who reached Dark Matter before today is paid now: the back pay. Crowns only: no XP, so it moves
-- no rank, and a boost doesn't double it.
--
-- sh_prizes() says what it pays ('dark'), so widget/v3.js's PRIZES (the same table; tools/release/xp.js fails if they
-- differ) and the Dark Matter scene (widget/journeys.js, "+5,000 Shiny Gold Crowns") read one number. The wallet also
-- returns 'dark', how many Dark Matters are paid. Everything else in both functions is v79's and v75's.
--
-- Applying it: two function replacements, no table touched, nothing locked; safe at any hour.

-- what every prize pays, for the page (migration_v75's table, and `dark`; widget/v3.js's PRIZES says the same)
create or replace function public.sh_prizes()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object('name', 500, 'ring', 5, 'boss', 500, 'nuke', 10000, 'alltime', 20000, 'notes', 50, 'trophy', 200,
    'visit', 50, 'game', 100, 'pb', 50, 'top', 250, 'report', 100, 'collection', 1000, 'dark', 5000,
    'streak', jsonb_build_array(jsonb_build_array(3, 100), jsonb_build_array(7, 300), jsonb_build_array(14, 700),
      jsonb_build_array(30, 1500), jsonb_build_array(60, 3000), jsonb_build_array(100, 5000)),
    'row', jsonb_build_array(jsonb_build_array(10, 25), jsonb_build_array(25, 100), jsonb_build_array(50, 250)),
    'medal', jsonb_build_array(250, 500, 750, 1000));
$$;
revoke all on function public.sh_prizes() from public;
grant execute on function public.sh_prizes() to anon, authenticated;

create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; prize_xp int; prize_c int; n_f int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[];
  m_now text[]; m_was text[]; n_t int; n_m int; n_r int; n_d int; gt int; earned int; spent int; dd date := (now() at time zone 'America/Chicago')::date;
  t_c int := sh_time_crowns(p_visitor);
begin
  select coalesce(max(x.xp), 0) into v_xp from xp_visitors x where x.visitor_id = p_visitor;
  -- v72: summed by kind first, so sh_is_prize runs once a kind (about 20), not once an award (thousands); the same totals
  -- v79: the sums by kind are kept as the awards are paid (xp_award_totals), so this reads a row a kind
  select coalesce(sum(g.e), 0), coalesce(sum(g.b) filter (where sh_is_prize(g.src)), 0),
         coalesce(sum(g.n) filter (where g.src in ('survey', 'checkin')), 0),
         coalesce(sum(g.b) filter (where sh_is_prize(g.src) and g.src not in ('survey', 'checkin')), 0)
    into extra, prize_xp, n_f, prize_c
    from (select t.src, t.xp - t.base as e, t.base as b, t.n from xp_award_totals t where t.visitor_id = p_visitor) g;
  base_xp := greatest(0, v_xp - extra - prize_xp);
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
  gt := (select r.gtier from sh_rank(v_xp) r);
  n_r := greatest(0, gt - (select r.gtier from sh_rank(coalesce(bl.xp, 0)) r));
  -- v88: each journey's Dark Matter reached (gtier 6, 13, 20), from the first XP, so it is back pay too
  n_d := (gt + 1) / 7;
  earned := base_xp / 2 + t_c + prize_c + 1000 * n_f + 25 * n_t + 50 * n_m + 20 * n_r + (sh_prizes()->>'dark')::int * n_d;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 2, 'from_time', t_c,
    'prizes', prize_c + 1000 * n_f, 'trophies', n_t, 'medals', n_m, 'rankups', n_r, 'dark', n_d, 'rewards', n_f, 'pays', sh_prizes(),
    'got', jsonb_build_object(
      'name', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'name'),
      'visit', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'visit:' || dd),
      'game', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'game:' || dd)));
end;
$$;
revoke all on function public.sh_wallet(text) from public, anon, authenticated;
