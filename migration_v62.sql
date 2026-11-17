-- v62 (2026-11-17): what the shop's double XP boosts cost, and a boost bought during another one waits its turn.
-- Sam, 2026-11-17: "Refine what double XP boosts cost": retune them against how fast crowns are earned.
-- Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js).
--
-- The class's numbers, 2026-11-14 to 11-17 (77 people): a median study day earns about 95 crowns (a quarter of days under
-- 31, a quarter over 190) and a median study hour about 270 XP. At 600 and 1,500 crowns a boost cost 6 and 16 median days'
-- crowns for about 270 more XP an hour (its extra XP earns no crowns), and no one had bought one (the 15 purchases so far:
-- snacks, outfits and yard pieces).
--
-- 1. The 1-hour boost costs 150 crowns and the 3-hour one 400, priced with the snacks, the shop's other thing that gets used
--    up; three hours stay cheaper an hour (133 against 150). Their rarity follows the price (the catalog's bands: Common
--    100-200, Uncommon 250-500).
-- 2. sh_buy: a boost's time goes after every boost running or waiting. Before, a boost bought during a medal's 24 hours ran
--    alongside it and doubled nothing (never more than 2x), so its crowns were lost. When the last boost is a shop one it is
--    extended, as before.
-- 3. sh_boost_json: "until" runs on to the end of a shop boost that starts as the running ones end, so the 2x chip shows the
--    whole stretch of double XP.

update public.shop_items set rarity = 'common', price = 150 where id = 'boost-1h';
update public.shop_items set rarity = 'uncommon', price = 400 where id = 'boost-3h';

-- buy one thing: not owned already (outfits, costumes, the home's things; a gift is everyone's, so it can never be
-- bought), not a rank item (earned by rank, never sold), on sale today for this visitor (a shelf of sh_shop_for: daily,
-- weekly, a season on sale, a throwback day's three, the always-shelf, a spotted costume), at most one of each snack a
-- day, enough gold crowns. Idempotent on p_request (a double tap or a replayed call buys once). A snack's HP counts today
-- (get_pet_days_v2); a boost's time goes after every boost running or waiting (v62).
-- sh_buy takes the Central date (the tests set it; null = today); buy_item is what a page calls.
create or replace function public.sh_buy(p_day date, p_visitor text, p_item text, p_request text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare it record; prev record; dd date := coalesce(p_day, (now() at time zone 'America/Chicago')::date); w jsonb; bal int; pid bigint;
  v_resp jsonb; b_until timestamptz; l_key text; l_src text; l_end timestamptz;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 or p_item is null or p_item !~ '^[a-z0-9][a-z0-9-]{0,39}$'
     or p_request is null or p_request !~ '^[A-Za-z0-9_-]{8,64}$' then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  select visitor_id, resp into prev from pet_purchases where request_id = p_request;
  if found then
    if prev.visitor_id = p_visitor then return coalesce(prev.resp, '{}'::jsonb) || jsonb_build_object('repeat', true); end if;
    return jsonb_build_object('ok', false, 'error', 'dup');
  end if;
  select * into it from shop_items where id = p_item and active;
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown'); end if;
  if it.kind not in ('snack', 'boost') and sh_owns(p_visitor, p_item) then return jsonb_build_object('ok', false, 'error', 'owned'); end if;
  if it.rank_tier is not null then return jsonb_build_object('ok', false, 'error', 'rank', 'rank_tier', it.rank_tier); end if;
  if not exists (select 1 from sh_shop_for(p_visitor, dd) s where s.item_id = p_item) then return jsonb_build_object('ok', false, 'error', 'not-today'); end if;
  if it.kind = 'snack' and exists (select 1 from pet_purchases where visitor_id = p_visitor and item_id = p_item and day = dd) then
    return jsonb_build_object('ok', false, 'error', 'today'); end if;
  w := sh_wallet(p_visitor); bal := (w->>'balance')::integer;
  if bal < it.price then return jsonb_build_object('ok', false, 'error', 'balance', 'balance', bal, 'price', it.price); end if;
  insert into pet_purchases (visitor_id, item_id, kind, price, hp, request_id, day)
    values (p_visitor, p_item, it.kind, it.price, it.hp, p_request, dd) returning id into pid;
  if it.kind not in ('snack', 'boost') then
    insert into pet_inventory (visitor_id, item_id) values (p_visitor, p_item) on conflict do nothing;
  end if;
  if it.kind = 'boost' then
    -- its time goes after every boost running or waiting (v62): the last one a shop boost, it is extended; otherwise a new
    -- one starts now, or when the last one (a medal's 24 hours) ends
    select b.key, b.src, b.ends_at into l_key, l_src, l_end from xp_boosts b where b.visitor_id = p_visitor and b.ends_at > now()
      order by b.ends_at desc, (b.src = 'shop') desc limit 1;
    if l_src = 'shop' then
      update xp_boosts set ends_at = ends_at + make_interval(mins => it.boost_minutes) where visitor_id = p_visitor and key = l_key
        returning ends_at into b_until;
    else
      insert into xp_boosts (visitor_id, key, src, mult, starts_at, ends_at)
        values (p_visitor, 'shop:' || pid, 'shop', it.boost_mult, coalesce(l_end, now()),
          coalesce(l_end, now()) + make_interval(mins => it.boost_minutes))
        returning ends_at into b_until;
    end if;
  end if;
  v_resp := jsonb_build_object('ok', true, 'item', p_item, 'kind', it.kind, 'price', it.price, 'balance', bal - it.price,
    'hp', it.hp, 'boost_until', b_until);
  update pet_purchases set resp = v_resp where id = pid;
  return v_resp;
end;
$$;

-- the running boost: its multiplier (never over 2), the source of the one that ends last, and until when double XP lasts,
-- a shop boost that starts as the running ones end included (v62)
create or replace function public.sh_boost_json(p_visitor text, p_at timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  with run as (select b.mult, b.src, b.ends_at from xp_boosts b where b.visitor_id = p_visitor and b.starts_at < p_at and b.ends_at > p_at),
  nxt as (select max(q.ends_at) e from xp_boosts q where q.visitor_id = p_visitor and q.starts_at >= p_at
    and q.starts_at <= (select max(run.ends_at) from run))
  select case when count(*) = 0 then null else jsonb_build_object('mult', least(2, max(r.mult)),
    'until', greatest(max(r.ends_at), (select nxt.e from nxt)), 'src', (array_agg(r.src order by r.ends_at desc))[1]) end
  from run r;
$$;
revoke all on function public.sh_boost_json(text, timestamptz) from public, anon, authenticated;
revoke all on function public.sh_buy(date, text, text, text) from public, anon, authenticated;
