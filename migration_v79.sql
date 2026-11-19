-- v79 (2026-11-19, to apply after Heme & Endo Exam 3, at night): a student's awards are summed once, as they're paid,
-- instead of again on every answer. The optimization pass, phase 2 (vault/tasks/2026-11-18-database-optimization-pass.md).
--
-- Every answer's reply carries the crown balance (sh_crowns -> sh_wallet), and the page bootstrap and the shop read it too.
-- After migration_v76 the largest part of a heavy student's answer save is sh_wallet summing every award they were ever
-- paid (xp_awards): on a throwaway copy 1.7 of 4.4 ms at 9,000 awards, 0.6 ms at 3,000. The most active student live has
-- 2,753 awards (2026-11-19; 91 students have any, 63,000 in all), and the sum grows with every answer they give.
--
-- xp_award_totals keeps, for each student and kind of award (xp_awards.src), how many awards there are and the sums of
-- their base and paid XP: what sh_wallet summed. Statement-level triggers on xp_awards keep it: each insert, delete or
-- update adds what it changed, per student and kind, in one statement (Link my devices' rebuild deletes and re-adds
-- thousands of awards in one statement each; a row trigger would update the same total thousands of times). A kind
-- that isn't there yet starts at what the statement added.
-- sh_wallet then reads about ten rows for a student instead of thousands; everything else in it is v72's, and every
-- balance is the same (the copy: every made-up student's wallet compared before and after, and the totals compared with
-- the sums after every suite in tools/release/xp.js, Link my devices and the rebuilds included).
--
-- Applying it (one transaction, as apply_migration runs it): xp_awards is locked against writes (share row exclusive,
-- which reads still pass) for the moment it takes to fill the totals from the awards already there and add the triggers,
-- so no award can be paid between the two. On the copy with 63,000 awards the whole file takes about a second
-- (tools/release/pg.js); answers wait behind it meanwhile, so it goes in at night (1 to 5 am Central,
-- vault/how-to/run-sql-on-the-live-database.md), and the lock gives up after 3 s instead of holding answers up longer.
-- Check after: the totals equal the sums, for every student (the query at the end of this file, which returns no rows).

set local lock_timeout = '3s';
lock table public.xp_awards in share row exclusive mode;

create table if not exists public.xp_award_totals (
  visitor_id text not null,
  src text not null,
  n integer not null,
  base integer not null,
  xp integer not null,
  primary key (visitor_id, src)
);
alter table public.xp_award_totals enable row level security;   -- no policies: only the functions below touch it
revoke all on public.xp_award_totals from anon, authenticated;

-- each statement's change, per student and kind, added in one go; in key order, so two statements never wait on each
-- other's rows in opposite orders
create or replace function public.sh_award_totals_step()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into xp_award_totals as t (visitor_id, src, n, base, xp)
      select r.visitor_id, r.src, count(*), sum(r.base), sum(r.xp) from new_rows r group by 1, 2 order by 1, 2
      on conflict (visitor_id, src) do update set n = t.n + excluded.n, base = t.base + excluded.base, xp = t.xp + excluded.xp;
  elsif tg_op = 'DELETE' then
    insert into xp_award_totals as t (visitor_id, src, n, base, xp)
      select r.visitor_id, r.src, -count(*), -sum(r.base), -sum(r.xp) from old_rows r group by 1, 2 order by 1, 2
      on conflict (visitor_id, src) do update set n = t.n + excluded.n, base = t.base + excluded.base, xp = t.xp + excluded.xp;
  elsif tg_op = 'UPDATE' then
    insert into xp_award_totals as t (visitor_id, src, n, base, xp)
      select d.visitor_id, d.src, sum(d.n), sum(d.b), sum(d.x)
        from (select r.visitor_id, r.src, 1 as n, r.base as b, r.xp as x from new_rows r
              union all select r.visitor_id, r.src, -1, -r.base, -r.xp from old_rows r) d
        group by 1, 2 having sum(d.n) <> 0 or sum(d.b) <> 0 or sum(d.x) <> 0 order by 1, 2
      on conflict (visitor_id, src) do update set n = t.n + excluded.n, base = t.base + excluded.base, xp = t.xp + excluded.xp;
  elsif tg_op = 'TRUNCATE' then
    delete from xp_award_totals;
  end if;
  return null;
end;
$$;
revoke all on function public.sh_award_totals_step() from public, anon, authenticated;

-- the awards already there (the backfill: 63,000 live on 2026-11-19, about 700 totals)
insert into public.xp_award_totals (visitor_id, src, n, base, xp)
  select a.visitor_id, a.src, count(*), sum(a.base), sum(a.xp) from public.xp_awards a group by 1, 2
  on conflict (visitor_id, src) do update set n = excluded.n, base = excluded.base, xp = excluded.xp;

drop trigger if exists xp_awards_totals_ins on public.xp_awards;
drop trigger if exists xp_awards_totals_del on public.xp_awards;
drop trigger if exists xp_awards_totals_upd on public.xp_awards;
drop trigger if exists xp_awards_totals_trunc on public.xp_awards;
create trigger xp_awards_totals_ins after insert on public.xp_awards
  referencing new table as new_rows for each statement execute function public.sh_award_totals_step();
create trigger xp_awards_totals_del after delete on public.xp_awards
  referencing old table as old_rows for each statement execute function public.sh_award_totals_step();
create trigger xp_awards_totals_upd after update on public.xp_awards
  referencing old table as old_rows new table as new_rows for each statement execute function public.sh_award_totals_step();
create trigger xp_awards_totals_trunc after truncate on public.xp_awards
  for each statement execute function public.sh_award_totals_step();

-- sh_wallet is v72's (md5-checked against the live body on 2026-11-19), with the one change marked "v79"
create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; prize_xp int; prize_c int; n_f int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[];
  m_now text[]; m_was text[]; n_t int; n_m int; n_r int; earned int; spent int; dd date := (now() at time zone 'America/Chicago')::date;
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
  n_r := greatest(0, (select gtier from sh_rank(v_xp)) - (select gtier from sh_rank(coalesce(bl.xp, 0))));
  earned := base_xp / 2 + t_c + prize_c + 1000 * n_f + 25 * n_t + 50 * n_m + 20 * n_r;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 2, 'from_time', t_c,
    'prizes', prize_c + 1000 * n_f, 'trophies', n_t, 'medals', n_m, 'rankups', n_r, 'rewards', n_f, 'pays', sh_prizes(),
    'got', jsonb_build_object(
      'name', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'name'),
      'visit', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'visit:' || dd),
      'game', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'game:' || dd)));
end;
$$;
revoke all on function public.sh_wallet(text) from public, anon, authenticated;

-- The check, after applying (and any time): no rows means every total equals the sum of its awards.
--   select coalesce(a.visitor_id, t.visitor_id), coalesce(a.src, t.src), a.n, t.n, a.base, t.base, a.xp, t.xp
--   from (select visitor_id, src, count(*)::int n, sum(base)::int base, sum(xp)::int xp from public.xp_awards group by 1, 2) a
--   full join (select * from public.xp_award_totals where n <> 0 or base <> 0 or xp <> 0) t using (visitor_id, src)
--   where a.n is distinct from t.n or a.base is distinct from t.base or a.xp is distinct from t.xp;
