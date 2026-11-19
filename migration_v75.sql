-- v75 (2026-11-19): collections, and a bonus for finishing one. Sam: "in the timmy card i want there to be a button where
-- you can view your collections of items bought in the shop. holiday collections and other things. you can see your
-- progress and all and completing a collection gives 1000 xp and 1000 crowns as a bonus".
--
-- What counts as a collection (one list, worked out from the catalog, so a piece added later joins its collection):
--   - each season's set (the fourteen holiday and season sets: shop_items.season), 8 pieces;
--   - each year-round collection (Dino valley, Moon base, Coral reef, Desert ranch, Retro arcade, Rock show), 8 pieces:
--     shop_items gets a `collection` column for them (they were only grouped in tools/figures/site/sets.mjs until now);
--   - the rare costumes (every active `costume`), 10 pieces, as one collection, `costumes`.
-- The rank sets aren't one: they are earned by rank, never bought. A collection whose every piece is a gift (Halloween
-- 2026's set, everyone's from the start) is shown complete but pays nothing: nothing was collected.
--
-- 1. The prize: a new kind of award, `collection`, 1,000 XP once per collection (key `collection:<k>`), never boosted,
--    and as many crowns, like every prize (sh_is_prize; sh_wallet counts it with no change); sh_prizes() says it pays
--    1,000 (widget/v3.js's PRIZES says the same: tools/release/xp.js checks). Kept by the rebuild and Link my devices like
--    every prize row (a key already paid on the other device is skipped).
-- 2. sh_collections(visitor): every collection with how many pieces it has, how many the visitor owns (sh_owned: bought,
--    or a gift), whether it pays and whether it's paid. get_my_collections(visitor) is what the page reads (the
--    Collections view in Timmy's place); claim_collections_v2(visitor) pays every finished collection not paid yet and
--    answers the same list. The page asks after buying a piece of a collection, and the view offers the bonus for one
--    finished before this (a button), so a collection finished earlier is paid too.
-- Additive: nothing that exists changes what it does. Quick to apply: 48 rows get their collection; the new kind of award
-- is checked against the awards already there with `validate constraint` (as migration_v73), which doesn't hold up the
-- answers being saved meanwhile. Written and tested on a throwaway copy of supabase/schema.sql (tools/release/xp.js, rls.js).

-- ====================================================================== the year-round collections in the catalog
alter table public.shop_items add column if not exists collection text
  check (collection in ('dino', 'moonbase', 'reef', 'desert', 'arcade', 'rockshow'));
-- one row each (tools/preview/transform.js reads these lines for the preview's catalog); exactly allCollectionItems() of
-- tools/figures/site/sets.mjs (tools/release/xp.js checks)
update public.shop_items set collection = 'dino' where id = 'stone-den';
update public.shop_items set collection = 'dino' where id = 'volcano-valley';
update public.shop_items set collection = 'dino' where id = 'field-hat';
update public.shop_items set collection = 'dino' where id = 'fossil-vest';
update public.shop_items set collection = 'dino' where id = 'stego-hood';
update public.shop_items set collection = 'dino' where id = 'dino-nest';
update public.shop_items set collection = 'dino' where id = 'fossil-dig';
update public.shop_items set collection = 'dino' where id = 'trex-skeleton';
update public.shop_items set collection = 'moonbase' where id = 'moon-dome';
update public.shop_items set collection = 'moonbase' where id = 'lunar-plains';
update public.shop_items set collection = 'moonbase' where id = 'antenna-headband';
update public.shop_items set collection = 'moonbase' where id = 'space-visor';
update public.shop_items set collection = 'moonbase' where id = 'jetpack';
update public.shop_items set collection = 'moonbase' where id = 'moon-rover';
update public.shop_items set collection = 'moonbase' where id = 'satellite-dish';
update public.shop_items set collection = 'moonbase' where id = 'rocket';
update public.shop_items set collection = 'reef' where id = 'conch-house';
update public.shop_items set collection = 'reef' where id = 'sunlit-reef';
update public.shop_items set collection = 'reef' where id = 'starfish-clip';
update public.shop_items set collection = 'reef' where id = 'octopus-hat';
update public.shop_items set collection = 'reef' where id = 'mer-tail';
update public.shop_items set collection = 'reef' where id = 'coral-garden';
update public.shop_items set collection = 'reef' where id = 'giant-clam';
update public.shop_items set collection = 'reef' where id = 'sunken-chest';
update public.shop_items set collection = 'desert' where id = 'adobe-ranch';
update public.shop_items set collection = 'desert' where id = 'red-rocks';
update public.shop_items set collection = 'desert' where id = 'bandana';
update public.shop_items set collection = 'desert' where id = 'cowboy-hat';
update public.shop_items set collection = 'desert' where id = 'sheriff-vest';
update public.shop_items set collection = 'desert' where id = 'cactus-garden';
update public.shop_items set collection = 'desert' where id = 'windmill-pump';
update public.shop_items set collection = 'desert' where id = 'covered-wagon';
update public.shop_items set collection = 'arcade' where id = 'arcade-hall';
update public.shop_items set collection = 'arcade' where id = 'pixel-hills';
update public.shop_items set collection = 'arcade' where id = 'gamer-headset';
update public.shop_items set collection = 'arcade' where id = 'pixel-shades';
update public.shop_items set collection = 'arcade' where id = 'high-score-jacket';
update public.shop_items set collection = 'arcade' where id = 'arcade-cabinet';
update public.shop_items set collection = 'arcade' where id = 'pinball';
update public.shop_items set collection = 'arcade' where id = 'claw-machine';
update public.shop_items set collection = 'rockshow' where id = 'record-shop';
update public.shop_items set collection = 'rockshow' where id = 'festival-field';
update public.shop_items set collection = 'rockshow' where id = 'band-tee';
update public.shop_items set collection = 'rockshow' where id = 'leather-jacket';
update public.shop_items set collection = 'rockshow' where id = 'electric-guitar';
update public.shop_items set collection = 'rockshow' where id = 'amp-stack';
update public.shop_items set collection = 'rockshow' where id = 'drum-kit';
update public.shop_items set collection = 'rockshow' where id = 'tour-stage';
-- a piece is in one collection at most: a season's set or a year-round collection, never both
alter table public.shop_items drop constraint if exists shop_items_one_collection;
alter table public.shop_items add constraint shop_items_one_collection
  check (collection is null or (season is null and rank_tier is null and kind not in ('snack', 'boost', 'costume')));

-- ====================================================================== 1. the prize
alter table public.xp_awards drop constraint if exists xp_awards_src_check;
alter table public.xp_awards add constraint xp_awards_src_check
  check (src in ('answer', 'goal20', 'fix', 'mock', 'medal', 'pod-min', 'pod-done', 'arcade', 'report', 'card', 'survey', 'checkin',
                 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime', 'notes', 'trophy', 'visit', 'game', 'record', 'restore',
                 'collection'))
  not valid;
alter table public.xp_awards validate constraint xp_awards_src_check;

-- the kinds whose XP pays as many crowns (migration_v68's list, and `collection`)
create or replace function public.sh_is_prize(p_src text)
returns boolean language sql immutable set search_path = public as $$
  select p_src in ('survey', 'checkin', 'report', 'medal', 'pod-done', 'name', 'ring', 'boss', 'streak', 'row', 'nuke', 'alltime',
                   'notes', 'trophy', 'visit', 'game', 'record', 'collection');
$$;

-- what every prize pays, for the page (migration_v68's table, and `collection`; widget/v3.js's PRIZES says the same)
create or replace function public.sh_prizes()
returns jsonb language sql immutable set search_path = public as $$
  select jsonb_build_object('name', 500, 'ring', 5, 'boss', 500, 'nuke', 10000, 'alltime', 20000, 'notes', 50, 'trophy', 200,
    'visit', 50, 'game', 100, 'pb', 50, 'top', 250, 'report', 100, 'collection', 1000,
    'streak', jsonb_build_array(jsonb_build_array(3, 100), jsonb_build_array(7, 300), jsonb_build_array(14, 700),
      jsonb_build_array(30, 1500), jsonb_build_array(60, 3000), jsonb_build_array(100, 5000)),
    'row', jsonb_build_array(jsonb_build_array(10, 25), jsonb_build_array(25, 100), jsonb_build_array(50, 250)),
    'medal', jsonb_build_array(250, 500, 750, 1000));
$$;

-- ====================================================================== 2. the collections
-- every collection and where one visitor stands in it: k (the season, the collection or 'costumes'), kind ('season',
-- 'collection' or 'costumes'), n pieces, have (owned: bought or a gift), pays (not all gifts), paid (its prize is taken),
-- sort (its first piece's place in the catalog)
create or replace function public.sh_collections(p_visitor text)
returns table(k text, kind text, n integer, have integer, pays boolean, paid boolean, sort integer)
language sql stable security definer set search_path = public as $$
  with o as (select item_id from sh_owned(p_visitor)),
  c as (
    select coalesce(i.season, i.collection, 'costumes') as k,
           case when i.season is not null then 'season' when i.collection is not null then 'collection' else 'costumes' end as kind,
           i.id, i.gift, i.sort
    from shop_items i
    where i.active and i.rank_tier is null and (i.season is not null or i.collection is not null or i.kind = 'costume'))
  select c.k, min(c.kind), count(*)::integer, count(o.item_id)::integer, not bool_and(c.gift),
         exists (select 1 from xp_awards a where a.visitor_id = p_visitor and a.key = 'collection:' || c.k), min(c.sort)::integer
  from c left join o on o.item_id = c.id
  where p_visitor is not null
  group by c.k;
$$;

-- the list as the page gets it, oldest kind first (the seasons, then the year-round collections, then the costumes)
create or replace function public.sh_collections_json(p_visitor text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('k', s.k, 'kind', s.kind, 'n', s.n, 'have', s.have, 'done', s.have >= s.n,
      'pays', s.pays, 'paid', s.paid) order by case s.kind when 'season' then 0 when 'collection' then 1 else 2 end, s.sort, s.k), '[]'::jsonb)
  from sh_collections(p_visitor) s;
$$;

-- what the Collections view reads: every collection, how far along you are, and what finishing one pays
create or replace function public.get_my_collections(p_visitor text)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when p_visitor is null or length(p_visitor) not between 1 and 80 then jsonb_build_object('ok', false, 'error', 'bad')
    else jsonb_build_object('ok', true, 'pays', (sh_prizes()->>'collection')::integer, 'collections', sh_collections_json(p_visitor)) end;
$$;

-- pay every finished collection whose prize isn't taken yet (1,000 XP and 1,000 crowns each, once), and answer the list
-- after: `won` names the collections paid now, `xp` what they paid together, `crowns` the balance
create or replace function public.claim_collections_v2(p_visitor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; paid int; total int := 0; won jsonb := '[]'::jsonb; pay int := (sh_prizes()->>'collection')::integer;
begin
  if p_visitor is null or length(p_visitor) not between 1 and 80 then return jsonb_build_object('ok', false, 'error', 'bad'); end if;
  perform pg_advisory_xact_lock(hashtext('xp|' || p_visitor));
  for r in select s.k from sh_collections(p_visitor) s where s.have >= s.n and s.n > 0 and s.pays and not s.paid order by s.sort, s.k loop
    paid := sh_award(p_visitor, 'collection:' || r.k, 'collection', '', pay, 1, clock_timestamp());
    if paid > 0 then total := total + paid; won := won || to_jsonb(r.k); end if;
  end loop;
  return sh_prize_reply(p_visitor, 'collection', total, jsonb_build_object('won', won, 'pays', pay, 'collections', sh_collections_json(p_visitor)));
end;
$$;

-- ====================================================================== privileges
revoke all on function public.sh_is_prize(text) from public, anon, authenticated;
revoke all on function public.sh_prizes() from public;
grant execute on function public.sh_prizes() to anon, authenticated;
revoke all on function public.sh_collections(text) from public, anon, authenticated;
revoke all on function public.sh_collections_json(text) from public, anon, authenticated;
revoke all on function public.get_my_collections(text) from public;
revoke all on function public.claim_collections_v2(text) from public;
grant execute on function public.get_my_collections(text) to anon, authenticated;
grant execute on function public.claim_collections_v2(text) to anon, authenticated;
