-- v99 (2026-11-22): the idea board's "Drip for Timmy" (Sam set it Planned: "You can already visit other timmys, but ill try
-- to make a way where you can specifically select the people currently online. You already earn gold crowns for those
-- things, but we can add a mystery box"). Three new parts, no function replaced:
--
--   1. The mystery box, in Timmy's shop: Shiny Gold Crowns for one random piece of the everyday shop that you don't own yet.
--      The roll is made here, in one call that is idempotent on its request id, as buy_item is. Its rules are sh_box_rules():
--      the price (750 crowns), how many a Central day (3) and the odds by rarity (40 / 30 / 18 / 9 / 3 in a hundred). Only
--      rarities you still have a piece of can come out, so the odds a page shows are worked out for you (get_mystery_box):
--      a rarity you own all of has its share spread over the rest. When you own every piece it could give, it sells nothing.
--      What it can give: the everyday rotation (rotates, no season, no gift, no rank, not the always-shelf; outfits, homes,
--      scenes, yard pieces, upgrades and paints, the year-round collections included). Never a seasonal piece (Sam,
--      2026-11-10: holiday content only in its season), a rare costume (they are found by spotting Timmy in one), a rank
--      piece (earned), a snack or a boost.
--      A box is one pet_purchases row: the piece it gave as item_id, kind 'box', the box's price. So sh_wallet's spending
--      (the sum of price), Link my devices, the collections (pet_inventory) and tools/economy.sql's E5 (kind and rarity)
--      count it with no change, and buy_item, sh_wallet and get_my_shop are untouched.
--   2. Studying now: get_studying_now(visitor), the people with a hub open right now (a study ping in the last 3 minutes, any
--      hub: the admin page's "Live" rule, migration_v50) who picked their own name for the boards (a visitor_names row), so
--      someone can pick one and visit their place. Each comes as get_place shows them: the name, the visit key, the rank and
--      the mastery flair; never an id, a hub, a section or a time. Two linked devices are one person; the caller and the
--      caller's linked devices are left out. `others` is how many people are studying now besides the caller (named or
--      not), a count with nothing about who. No opt-out, as for visiting (Sam, 2026-11-11), with one difference: someone
--      with the generated name never shows, so going back to a random name takes you off the list.
--
--   3. The Crowns board (Sam, 2026-11-22, on this PR: "Replace study streaks with crowns balance"): the dashboard
--      leaderboard's Study streaks tab becomes the class's Shiny Gold Crowns on hand. A balance is sh_wallet's, about
--      50-100 ms for a busy student, too slow to work out for the whole class (176 people) on every look. So it is worked
--      out ahead into crowns_board, a few people at a time, by pg_cron's sh-crowns-board job (every 2 minutes, up to 8
--      people, at most 2 s): first anyone whose XP or spending moved since theirs was worked out (the busiest first), then
--      anyone whose balance is over an hour old (study time pays crowns too). get_crowns_board_v2 reads it, working out
--      only the caller's own balance live, so your own row is always right. It is filled by the job, not here: the first
--      pass takes about 45 minutes, highest XP first. The streaks board's function (get_leaderboard_v2) stays.
--
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js section 18, rls.js). Nothing is
-- backfilled: function definitions, one new table (crowns_board, empty until the job fills it) and the job, safe at any
-- hour.

set local lock_timeout = '3s';

-- ====================================================================== 1. the mystery box
-- its rules, in one place: the price, how many a Central day, and each rarity's share (out of 100) of the roll
create or replace function public.sh_box_rules()
returns jsonb language plpgsql immutable set search_path = public as $$
begin
  return jsonb_build_object('price', 750, 'per_day', 3,
    'odds', jsonb_build_array(
      jsonb_build_object('rarity', 'common', 'w', 40), jsonb_build_object('rarity', 'uncommon', 'w', 30),
      jsonb_build_object('rarity', 'rare', 'w', 18), jsonb_build_object('rarity', 'epic', 'w', 9),
      jsonb_build_object('rarity', 'legendary', 'w', 3)));
end;
$$;

-- what the box can give: the everyday rotation's pieces, and for a visitor only those they haven't bought (a gift, a rank
-- piece and a seasonal one are never in it, so "owned" here is pet_inventory alone)
create or replace function public.sh_box_pool(p_visitor text)
returns table(item_id text, rarity text) language plpgsql stable security definer set search_path = public as $$
begin
  return query select i.id, i.rarity from shop_items i
    where i.active and i.rotates and not i.shelf and not i.gift and i.season is null and i.rank_tier is null
      and i.kind in ('outfit', 'home', 'scene', 'yard', 'upgrade')
      and (p_visitor is null or not exists (select 1 from pet_inventory v where v.visitor_id = p_visitor and v.item_id = i.id));
end;
$$;

-- the odds for one visitor: each rarity's share, how many of its pieces they don't have (n_left) and how many there are
-- (n_of), and its chance now: its share over the shares of the rarities with a piece left (null when none is left)
create or replace function public.sh_box_odds(p_visitor text)
returns table(rarity text, ord integer, w integer, n_left integer, n_of integer, chance numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with r as (select o->>'rarity' as rarity, (o->>'w')::integer as w, n::integer as ord
             from jsonb_array_elements(sh_box_rules()->'odds') with ordinality as e(o, n)),
  pool_all as (select p.rarity, count(*)::integer as n from sh_box_pool(null) p group by p.rarity),
  pool_me as (select p.rarity, count(*)::integer as n from sh_box_pool(p_visitor) p group by p.rarity),
  x as (select r.rarity, r.ord, r.w, coalesce(m.n, 0) as n_left, coalesce(a.n, 0) as n_of
        from r left join pool_all a on a.rarity = r.rarity left join pool_me m on m.rarity = r.rarity)
  select x.rarity, x.ord, x.w, x.n_left, x.n_of,
    case when x.n_left > 0 then round(x.w::numeric / nullif(sum(x.w) filter (where x.n_left > 0) over (), 0), 4) end
  from x order by x.ord;
end;
$$;

-- what a page shows before you open one: the price, the day's limit and how many are left today, the pieces it could still
-- give you, the odds for you now, and your balance. With no visitor: the box as it is for someone who owns nothing.
-- sh_box_info takes the Central date (the tests set it; null = today); get_mystery_box is what a page calls.
create or replace function public.sh_box_info(p_day date, p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare dd date := coalesce(p_day, (now() at time zone 'America/Chicago')::date); cfg jsonb := sh_box_rules();
  ok boolean := p_visitor is not null and length(p_visitor) between 1 and 80; v text; n_today integer := 0;
begin
  v := case when ok then p_visitor end;
  if ok then select count(*)::integer into n_today from pet_purchases p where p.visitor_id = p_visitor and p.kind = 'box' and p.day = dd; end if;
  return jsonb_build_object(
    'day', dd,
    'price', (cfg->>'price')::integer,
    'per_day', (cfg->>'per_day')::integer,
    'today', n_today,
    'left_today', greatest(0, (cfg->>'per_day')::integer - n_today),
    'left', coalesce((select sum(o.n_left) from sh_box_odds(v) o), 0)::integer,
    'of', coalesce((select sum(o.n_of) from sh_box_odds(v) o), 0)::integer,
    'odds', coalesce((select jsonb_agg(jsonb_build_object('rarity', o.rarity, 'chance', o.chance, 'left', o.n_left, 'of', o.n_of) order by o.ord)
      from sh_box_odds(v) o), '[]'::jsonb),
    'balance', case when ok then (sh_wallet(p_visitor)->>'balance')::integer end);
end;
$$;

create or replace function public.get_mystery_box(p_visitor text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  return sh_box_info(null, p_visitor);
end;
$$;

-- open one: the day's limit, a piece left to give, enough gold crowns; then the rarity by p_r1 over the shares of the
-- rarities with a piece left, and the piece by p_r2 among that rarity's pieces you don't have (by id). Idempotent on
-- p_request, as buy_item: the same request again gives the first answer with repeat: true and opens nothing; another
-- visitor's request id is refused (dup). The same per-visitor lock as answers and purchases, so two taps can't both pass
-- the balance or the day's limit. The answer: the piece (item, kind, rarity, name), the price, the balance after, and how
-- many are left today and in the box for you.
-- sh_box_open takes the Central date and the two rolls (the tests set them); open_mystery_box is what a page calls.
create or replace function public.sh_box_open(p_day date, p_visitor text, p_request text, p_r1 double precision, p_r2 double precision)
returns jsonb language plpgsql security definer set search_path = public as $$
declare dd date := coalesce(p_day, (now() at time zone 'America/Chicago')::date); cfg jsonb := sh_box_rules();
  v_price integer := (cfg->>'price')::integer; v_per integer := (cfg->>'per_day')::integer;
  r1 double precision := greatest(0, least(0.999999, coalesce(p_r1, 0))); r2 double precision := greatest(0, least(0.999999, coalesce(p_r2, 0)));
  prev record; n_today integer; v_rar text; n_rar integer; v_item text; it record; bal integer; pid bigint; v_resp jsonb; n_left integer;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80
     or p_request is null or p_request !~ '^[A-Za-z0-9_-]{8,64}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  select p.visitor_id, p.resp into prev from pet_purchases p where p.request_id = p_request;
  if found then
    if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
    return jsonb_build_object('ok', false, 'error', 'dup');
  end if;
  select count(*)::integer into n_today from pet_purchases p where p.visitor_id = p_visitor and p.kind = 'box' and p.day = dd;
  if n_today >= v_per then return jsonb_build_object('ok', false, 'error', 'today', 'per_day', v_per); end if;
  select z.rarity into v_rar from (
    select o.rarity, o.ord, sum(o.w) over (order by o.ord) as cum, sum(o.w) over () as tot from sh_box_odds(p_visitor) o where o.n_left > 0
  ) z where z.cum > r1 * z.tot order by z.ord limit 1;
  if v_rar is null then return jsonb_build_object('ok', false, 'error', 'empty'); end if;
  bal := (sh_wallet(p_visitor)->>'balance')::integer;
  if bal < v_price then return jsonb_build_object('ok', false, 'error', 'balance', 'balance', bal, 'price', v_price); end if;
  select count(*)::integer into n_rar from sh_box_pool(p_visitor) b where b.rarity = v_rar;
  select b.item_id into v_item from sh_box_pool(p_visitor) b where b.rarity = v_rar order by b.item_id
    offset least(n_rar - 1, floor(r2 * n_rar)::integer) limit 1;
  select * into it from shop_items i where i.id = v_item;
  insert into pet_purchases (visitor_id, item_id, kind, price, hp, request_id, day)
    values (p_visitor, v_item, 'box', v_price, null, p_request, dd) returning id into pid;
  insert into pet_inventory (visitor_id, item_id) values (p_visitor, v_item) on conflict do nothing;
  select count(*)::integer into n_left from sh_box_pool(p_visitor);
  v_resp := jsonb_build_object('ok', true, 'box', true, 'item', v_item, 'kind', it.kind, 'rarity', it.rarity, 'name', it.name,
    'price', v_price, 'balance', bal - v_price, 'today', n_today + 1, 'left_today', greatest(0, v_per - n_today - 1), 'left', n_left);
  update pet_purchases set resp = v_resp where id = pid;
  return v_resp;
end;
$$;

create or replace function public.open_mystery_box(p_visitor text, p_request text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  return sh_box_open(null, p_visitor, p_request, random(), random());
end;
$$;

-- ====================================================================== 2. studying now
-- the people with a hub open right now who picked their own name for the boards, to pick one and visit their place.
-- "Now" is a study ping in the last 3 minutes in any hub (activity_pings_time_idx: a few minutes of rows). Each person once
-- (a linked device under the id that remains), never the caller or the caller's linked devices, and only someone get_place
-- can open (on a board: XP, an answer streak or an arcade score). At most 50, by name. Nothing about anyone who isn't
-- studying, and of those who are, only the named ones' name, key, rank and flair; `others` counts everyone studying now
-- but the caller, and `you` says whether the caller is.
create or replace function public.get_studying_now(p_visitor text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me text;
begin
  if p_visitor is not null and length(p_visitor) not between 1 and 80 then return null; end if;
  me := coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
  return (
    with recent as (
      select distinct coalesce(l.primary_id, p.visitor_id) as who
      from activity_pings p left join visitor_links l on l.alias_id = p.visitor_id
      where p.pinged_at > now() - interval '3 minutes' and p.pinged_at < now() + interval '1 minute' and coalesce(p.hub, '') <> '' and p.hub !~ '^zz-'
    ),
    named as (
      select r.who, vn.display_name as name from recent r join visitor_names vn on vn.visitor_id = r.who
      where r.who is distinct from me and r.who is distinct from p_visitor
        and (exists (select 1 from xp_visitors x where x.visitor_id = r.who)
          or exists (select 1 from correct_streaks c where c.visitor_id = r.who)
          or exists (select 1 from arcade_scores a where a.visitor_id = r.who))
      order by lower(vn.display_name), vn.display_name limit 50
    )
    select jsonb_build_object(
      'minutes', 3,
      'you', me is not null and exists (select 1 from recent r where r.who = me),
      'others', (select count(*) from recent r where r.who is distinct from me and r.who is distinct from p_visitor)::integer,
      'people', coalesce((select jsonb_agg(jsonb_build_object('name', n.name, 'visit', sh_visit_key(n.who),
          'rank', jsonb_build_object('journey', k.journey, 'tier', k.tier, 'level', k.level), 'flair', sh_mastery_flair(n.who))
          order by lower(n.name), n.name)
        from named n left join xp_visitors x on x.visitor_id = n.who cross join lateral sh_rank(coalesce(x.xp, 0)) k), '[]'::jsonb))
  );
end;
$$;

-- ====================================================================== 3. the Crowns board
-- each person's Shiny Gold Crowns on hand, as sh_wallet worked it out at `at`, with the XP and spending it was worked out
-- from (so a refresh can tell whose has moved). Never read directly by a page: get_crowns_board_v2 below.
create table if not exists public.crowns_board (
  visitor_id text primary key,
  balance integer not null,
  xp integer not null,
  spent integer not null,
  at timestamptz not null default now()
);
alter table public.crowns_board enable row level security;
revoke all on table public.crowns_board from public, anon, authenticated;
create index if not exists crowns_board_balance_idx on public.crowns_board (balance desc);

-- work out up to p_n balances, at most about 2 s of it: first the people whose XP or spending moved since theirs was
-- worked out (or never worked out), highest XP first, then anyone over an hour old, oldest first. A device linked to
-- another (its rows are under the id that remains) and anyone with no XP left are taken off. Returns how many it did.
create or replace function public.sh_crowns_refresh(p_n integer default 8)
returns integer language plpgsql security definer set search_path = public as $$
declare c record; n integer := 0; w jsonb; t0 timestamptz := clock_timestamp();
begin
  delete from crowns_board b where not exists (select 1 from xp_visitors v where v.visitor_id = b.visitor_id)
    or exists (select 1 from visitor_links l where l.alias_id = b.visitor_id);
  for c in
    with sp as (select p.visitor_id, sum(p.price)::integer as spent from pet_purchases p group by p.visitor_id),
    cand as (
      select v.visitor_id, v.xp, coalesce(sp.spent, 0) as spent, b.at,
        (b.visitor_id is null or b.xp is distinct from v.xp or b.spent is distinct from coalesce(sp.spent, 0)) as moved
      from xp_visitors v left join sp on sp.visitor_id = v.visitor_id left join crowns_board b on b.visitor_id = v.visitor_id
      where not exists (select 1 from visitor_links l where l.alias_id = v.visitor_id)
    )
    select cand.visitor_id, cand.xp, cand.spent from cand where cand.moved or cand.at < now() - interval '1 hour'
    order by cand.moved desc, case when cand.moved then cand.xp end desc nulls last, cand.at nulls first, cand.visitor_id
    limit greatest(1, least(coalesce(p_n, 8), 200))
  loop
    exit when n > 0 and clock_timestamp() - t0 > interval '2 seconds';
    w := sh_wallet(c.visitor_id);
    insert into crowns_board (visitor_id, balance, xp, spent, at)
      values (c.visitor_id, coalesce((w->>'balance')::integer, 0), c.xp, c.spent, now())
      on conflict (visitor_id) do update set balance = excluded.balance, xp = excluded.xp, spent = excluded.spent, at = excluded.at;
    n := n + 1;
  end loop;
  -- the job's own run log: kept 2 days (pg_cron keeps every run otherwise)
  if extract(minute from now()) = 40 and to_regclass('cron.job_run_details') is not null then
    begin
      execute $q$delete from cron.job_run_details where end_time < now() - interval '2 days'
                 and jobid in (select jobid from cron.job where jobname = 'sh-crowns-board')$q$;
    exception when others then null;
    end;
  end if;
  return n;
end;
$$;

-- the board: the top p_limit (10, at most 50) by crowns on hand, ties sharing a place, and the caller's own row wherever
-- it falls (is_me), each as the other _v2 boards give a row: the leaderboard name, the rank (from XP), the mastery
-- flair and the visit key, never an id. The caller's balance is worked out now (one sh_wallet), the rest come from
-- crowns_board; a balance of 0 isn't listed (but yours is). A linked device is its id that remains.
create or replace function public.get_crowns_board_v2(p_visitor text default null, p_limit integer default 10)
returns table(rnk bigint, display_name text, crowns integer, xp integer, journey integer, tier integer, level integer, step integer, is_me boolean, flair text, visit text)
language plpgsql stable security definer set search_path = public as $$
declare me text; my integer;
begin
  if p_visitor is not null and length(p_visitor) between 1 and 80 then
    me := coalesce((select l.primary_id from visitor_links l where l.alias_id = p_visitor), p_visitor);
    if exists (select 1 from xp_visitors v where v.visitor_id = me) then my := coalesce((sh_wallet(me)->>'balance')::integer, 0); end if;
  end if;
  return query
  with b as (
    select c.visitor_id as who, case when c.visitor_id = me and my is not null then my else c.balance end as crowns from crowns_board c
    union all select me, my where my is not null and not exists (select 1 from crowns_board c where c.visitor_id = me)
  ), r as (
    select b.who, b.crowns, rank() over (order by b.crowns desc) as rk from b where b.crowns > 0 or b.who = me
  ), top as (
    select * from r where r.rk <= greatest(1, least(coalesce(p_limit, 10), 50)) or r.who = me
  )
  select t.rk, coalesce(vn.display_name, anon_name(t.who)), t.crowns, coalesce(x.xp, 0), k.journey, k.tier, k.level, k.step,
    (me is not null and t.who = me), sh_mastery_flair(t.who), sh_visit_key(t.who)
  from top t left join visitor_names vn on vn.visitor_id = t.who left join xp_visitors x on x.visitor_id = t.who
    cross join lateral sh_rank(coalesce(x.xp, 0)) k
  order by t.rk, lower(coalesce(vn.display_name, anon_name(t.who))), t.who;
end;
$$;

-- ====================================================================== grants
revoke all on function public.sh_box_rules() from public, anon, authenticated;
revoke all on function public.sh_box_pool(text) from public, anon, authenticated;
revoke all on function public.sh_box_odds(text) from public, anon, authenticated;
revoke all on function public.sh_box_info(date, text) from public, anon, authenticated;
revoke all on function public.sh_box_open(date, text, text, double precision, double precision) from public, anon, authenticated;
revoke all on function public.get_mystery_box(text) from public;
grant execute on function public.get_mystery_box(text) to anon, authenticated;
revoke all on function public.open_mystery_box(text, text) from public;
grant execute on function public.open_mystery_box(text, text) to anon, authenticated;
revoke all on function public.get_studying_now(text) from public;
grant execute on function public.get_studying_now(text) to anon, authenticated;
revoke all on function public.sh_crowns_refresh(integer) from public, anon, authenticated;
revoke all on function public.get_crowns_board_v2(text, integer) from public;
grant execute on function public.get_crowns_board_v2(text, integer) to anon, authenticated;

-- ====================================================================== the job (pg_cron, where the database has it)
do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      create extension if not exists pg_cron;
      perform cron.unschedule(jobid) from cron.job where jobname = 'sh-crowns-board';
      perform cron.schedule('sh-crowns-board', '*/2 * * * *', $c$set statement_timeout = '10s'; select public.sh_crowns_refresh(8)$c$);
    exception when others then
      raise notice 'pg_cron not set up (%): the Crowns board shows only what sh_crowns_refresh has worked out', sqlerrm;
    end;
  end if;
end $do$;
