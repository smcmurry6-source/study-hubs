-- migration_v100 (2026-11-23): Shiny Gold Crowns that Sam gives by hand, crowns only.
--
-- Sam, 2026-11-23, asking for a gift of 50,000 crowns to one account (named in the chat by its leaderboard name; never in
-- this public repo: vault/rules/learner-data-privacy.md). Every way the wallet pays crowns until now pays XP with them
-- (a prize pays as many crowns as XP, sh_is_prize) or is worked out from XP, rank, trophies, medals or study time, so a gift
-- of 50,000 crowns would also have been 50,000 XP: a jump to the Handpiece's Dark Matter, and its own 5,000 crowns. A gift is
-- crowns and nothing else: no XP, no rank, no trophy, no class number moves.
--
--   1. crown_gifts: one row a gift, its key unique (a gift given twice by mistake is given once), the crowns, a note on why
--      (no free text from a student: it is written by whoever gives it). Closed to visitors; only the functions below read it.
--   2. sh_gift_crowns(visitor, key, crowns, note): gives one, to the id that remains when the visitor's devices are linked,
--      and brings their row on the Crowns board up to date at once (the board's refresh only looks again at someone whose
--      XP or spending moved, or after an hour). Run by an agent through the Supabase connector or the SQL editor (as
--      postgres); anon can't run it. Returns {ok, given, crowns, balance}, or {ok: false, error} for a bad call.
--   3. sh_wallet: + the gifts (`gifts` in its answer), copied from main's newest copy (migration_v89's) with only that
--      added: one lookup by the table's index, so the answer save's cost doesn't move.
--   4. Link my devices: a linked device's gifts move to the id that remains (a trigger on visitor_links, as the pennants').
--
-- Spending is untouched: a gift is spent like any crowns. Never take a gift back by deleting its row once it has been
-- spent (the balance would go below zero): vault/rules/earn-rates-stay-enjoyable.md.

-- ====================================================================== 1. the gifts
create table if not exists public.crown_gifts (
  key text primary key,
  visitor_id text not null,
  crowns integer not null check (crowns between 1 and 1000000),
  note text not null default '' check (length(note) <= 200),
  at timestamptz not null default now()
);
create index if not exists crown_gifts_visitor_idx on public.crown_gifts (visitor_id);
alter table public.crown_gifts enable row level security;   -- no policies: only the functions below touch it
revoke all on table public.crown_gifts from public, anon, authenticated;

-- ====================================================================== 2. giving one
create or replace function public.sh_gift_crowns(p_visitor text, p_key text, p_crowns integer, p_note text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare me text; made integer; bal integer;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return jsonb_build_object('ok', false, 'error', 'visitor'); end if;
  if p_key is null or length(p_key) not between 1 and 80 then return jsonb_build_object('ok', false, 'error', 'key'); end if;
  if p_crowns is null or p_crowns not between 1 and 1000000 then return jsonb_build_object('ok', false, 'error', 'crowns'); end if;
  me := coalesce((select primary_id from visitor_links where alias_id = p_visitor), p_visitor);
  insert into crown_gifts (key, visitor_id, crowns, note) values (p_key, me, p_crowns, left(coalesce(p_note, ''), 200))
    on conflict (key) do nothing;
  get diagnostics made = row_count;
  bal := (sh_wallet(me)->>'balance')::integer;
  update crowns_board set balance = bal, at = now() where visitor_id = me;
  return jsonb_build_object('ok', true, 'given', made = 1, 'crowns', p_crowns, 'balance', bal);
end;
$$;
revoke all on function public.sh_gift_crowns(text, text, integer, text) from public, anon, authenticated;

-- ====================================================================== 3. the wallet counts them
create or replace function public.sh_wallet(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp int; extra int; prize_xp int; prize_c int; n_f int; base_xp int; bl public.game_baseline; badges text[]; t_now text[]; t_was text[];
  m_now text[]; m_was text[]; n_t int; n_m int; n_r int; n_d int; n_p int; n_l int; gt int; earned int; spent int; dd date := (now() at time zone 'America/Chicago')::date;
  t_c int := sh_time_crowns(p_visitor); g_c int;
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
  -- v89: each journey's Dark Matter reached (gtier 6, 13, 20), from the first XP, so it is back pay too
  n_d := (gt + 1) / 7;
  -- v89: the ModuPro reached (gtier 7, 125,000 XP) and the Loupes (gtier 14, 250,000 XP), each once, from the first XP too
  n_p := case when gt >= 7 then 1 else 0 end;
  n_l := case when gt >= 14 then 1 else 0 end;
  -- v100: the crowns Sam gave by hand, crowns only
  select coalesce(sum(c.crowns), 0) into g_c from crown_gifts c where c.visitor_id = p_visitor;
  earned := base_xp / 2 + t_c + prize_c + 1000 * n_f + 25 * n_t + 50 * n_m + 20 * n_r + (sh_prizes()->>'dark')::int * n_d
    + (sh_prizes()->>'modupro')::int * n_p + (sh_prizes()->>'loupes')::int * n_l + g_c;
  select coalesce(sum(price), 0) into spent from pet_purchases where visitor_id = p_visitor;
  return jsonb_build_object('earned', earned, 'spent', spent, 'balance', earned - spent, 'from_xp', base_xp / 2, 'from_time', t_c,
    'prizes', prize_c + 1000 * n_f, 'trophies', n_t, 'medals', n_m, 'rankups', n_r, 'dark', n_d, 'modupro', n_p, 'loupes', n_l, 'rewards', n_f,
    'gifts', g_c, 'pays', sh_prizes(),
    'got', jsonb_build_object(
      'name', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'name'),
      'visit', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'visit:' || dd),
      'game', exists (select 1 from xp_awards w where w.visitor_id = p_visitor and w.key = 'game:' || dd)));
end;
$$;
revoke all on function public.sh_wallet(text) from public, anon, authenticated;

-- ====================================================================== 4. Link my devices
create or replace function public.sh_gifts_on_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.alias_id is distinct from new.primary_id then
    update crown_gifts set visitor_id = new.primary_id where visitor_id = new.alias_id;
  end if;
  return new;
end;
$$;
revoke all on function public.sh_gifts_on_link() from public, anon, authenticated;
drop trigger if exists visitor_links_gifts on public.visitor_links;
create trigger visitor_links_gifts after insert or update of primary_id on public.visitor_links
  for each row execute function public.sh_gifts_on_link();
