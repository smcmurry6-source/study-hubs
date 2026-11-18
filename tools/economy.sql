-- The game economy: are XP and Shiny Gold Crowns earned at a healthy rate against the shop's prices?
-- Part of every lessons audit (Sam, 2026-11-18): .claude/skills/lessons-audit/SKILL.md step 1b, tools/lessons-refresh.md.
-- The yardstick (what "healthy" means, in study days) is vault/rules/earn-rates-stay-enjoyable.md; how XP and crowns are
-- paid is vault/reference/game-server.md and, as live, sh_wallet() / sh_prizes() / sh_time_crowns().
-- Read-only (Supabase connector, execute_sql). Replace :since with a date in quotes, e.g. '2026-11-15': the window the
-- per-day rates are read over (the last two weeks, or since the last change to a rate or a price, whichever is shorter,
-- so the rate is today's rules). Everything written down from it is a total over 5 or more people
-- (vault/rules/learner-data-privacy.md): never a visitor id, a name or one person's balance.
--
-- A "study day" is a person's Central day with at least one paid answer. Crowns are worked out the way sh_wallet does:
-- study XP (answers, the day's bonuses, mocks, games, Timmy Time's minutes, cards: an award that isn't a prize) at the
-- wallet's rate per XP, prizes 1:1 (sh_is_prize), hub time at sh_time_crowns' rate (at most 100 a clock hour), a
-- survey's or check-in's reward apart (one-time). If sh_wallet's formula changes, change E1's "study / 2" to match.

-- E0. The rules as they are live: what every prize pays, the price bands, and the wallet's own formula (read its
--     "earned :=" line: the share of study XP that becomes crowns)
select sh_prizes() prizes,
  (select json_agg(x order by x.lo) from (select rarity, count(*) n, min(price) lo, max(price) hi, round(avg(price)) avg
     from shop_items where active and not coalesce(gift, false) and rank_tier is null and kind not in ('snack', 'boost')
     group by 1) x) bands,
  (select json_agg(x) from (select id, rarity, price, boost_minutes, hp from shop_items where kind in ('snack', 'boost') and active order by price) x) consumables,
  substring(pg_get_functiondef('public.sh_wallet(text)'::regprocedure) from 'earned := [^;]+;') wallet_formula;

-- E1. Crowns and XP per study day and per study hour since :since (today's rules), the median day split by source
with aw as (select visitor_id, d, sum(base) filter (where not sh_is_prize(src)) study,
              sum(base) filter (where sh_is_prize(src) and src not in ('survey', 'checkin')) prize, sum(xp) xp
            from xp_awards where d >= :since::date group by 1, 2),
     tm as (select visitor_id, (h at time zone 'America/Chicago')::date d, sum(least(n, 144)) * 100 / 144 tc, sum(n) * 25 / 60.0 mins
            from (select visitor_id, h, sum(n) n from activity_hourly where hub <> '' and hub <> 'zz-test'
                  and h >= (:since::date)::timestamp at time zone 'America/Chicago' group by 1, 2) z group by 1, 2),
     s as (select aw.visitor_id, aw.d, coalesce(study, 0) study, coalesce(prize, 0) prize, coalesce(tc, 0) tc, coalesce(mins, 0) mins,
             coalesce(xp, 0) xp, coalesce(study, 0) / 2 + coalesce(prize, 0) + coalesce(tc, 0) crowns
           from aw left join tm on tm.visitor_id = aw.visitor_id and tm.d = aw.d where coalesce(study, 0) > 0)
select count(*) study_days, count(distinct visitor_id) people,
  percentile_cont(array[0.25, 0.5, 0.75, 0.9]) within group (order by crowns) crowns_per_day,
  percentile_cont(0.5) within group (order by study / 2) median_from_study,
  percentile_cont(0.5) within group (order by tc) median_from_time,
  percentile_cont(0.75) within group (order by prize) p75_from_prizes,
  percentile_cont(array[0.25, 0.5, 0.75, 0.9]) within group (order by xp) xp_per_day,
  percentile_cont(0.5) within group (order by mins) median_minutes,
  round(sum(crowns) / nullif(sum(mins) / 60, 0)) crowns_per_hour, round(sum(xp) / nullif(sum(mins) / 60, 0)) xp_per_hour
from s;

-- E2. The class's rhythm: study days and minutes per person in the last 28 days (a day with 10+ minutes in a hub).
--     Turns "N study days" into weeks for a typical student.
with d as (select visitor_id, (h at time zone 'America/Chicago')::date d, sum(n) * 25 / 60.0 mins from activity_hourly
           where hub <> '' and hub <> 'zz-test' and h >= now() - interval '28 days' group by 1, 2 having sum(n) * 25 / 60.0 >= 10)
select count(distinct visitor_id) people,
  percentile_cont(array[0.25, 0.5, 0.75, 0.9]) within group (order by days) study_days_in_28,
  percentile_cont(0.5) within group (order by mins) median_minutes_in_28
from (select visitor_id, count(*) days, sum(mins) mins from d group by 1) p;

-- E3. Wallets of everyone who studied since :since: what they hold, where it came from, what they could buy today, and
--     how much of what was earned has been spent (sh_wallet per person; a few seconds)
with act as (select distinct visitor_id from xp_awards where d >= :since::date and src = 'answer'),
     w as (select visitor_id, sh_wallet(visitor_id) w from act)
select count(*) people,
  percentile_cont(array[0.1, 0.25, 0.5, 0.75, 0.9]) within group (order by (w->>'balance')::int) balance,
  percentile_cont(0.5) within group (order by (w->>'from_xp')::int) median_from_xp,
  percentile_cont(0.5) within group (order by (w->>'from_time')::int) median_from_time,
  percentile_cont(0.5) within group (order by (w->>'prizes')::int) median_from_prizes,
  count(*) filter (where (w->>'balance')::int < 150) under_a_common,
  count(*) filter (where (w->>'balance')::int >= 700) a_rare, count(*) filter (where (w->>'balance')::int >= 1800) an_epic,
  count(*) filter (where (w->>'balance')::int >= 5000) a_legendary, count(*) filter (where (w->>'balance')::int >= 8000) anything,
  count(*) filter (where (w->>'spent')::int > 0) ever_bought,
  round(100.0 * sum((w->>'spent')::int) / nullif(sum((w->>'earned')::int), 0)) pct_of_earned_spent
from w;

-- E4. The price ladder in study days: each band's price against E1's median and 75th-percentile day (paste E1's two
--     numbers in place of 700 and 1350). Compare with the targets in vault/rules/earn-rates-stay-enjoyable.md.
with b as (select rarity, min(price) lo, max(price) hi from shop_items
           where active and not coalesce(gift, false) and rank_tier is null and kind not in ('snack', 'boost') group by 1)
select rarity, lo, hi, round(lo / 700.0, 1) lo_median_days, round(hi / 700.0, 1) hi_median_days,
  round(lo / 1350.0, 1) lo_heavy_days, round(hi / 1350.0, 1) hi_heavy_days
from b order by lo;

-- E5. Spending: what sells (kind and rarity), by day, and how many people open the shop and the place
select json_build_object(
  'by_kind', (select json_agg(x) from (select p.kind, s.rarity, count(*) n, count(distinct p.visitor_id) people, sum(p.price) crowns
      from pet_purchases p left join shop_items s on s.id = p.item_id where p.day >= :since::date group by 1, 2 order by 5 desc) x),
  'by_day', (select json_agg(x) from (select day, count(*) n, count(distinct visitor_id) people, sum(price) crowns
      from pet_purchases where day >= :since::date group by 1 order by 1) x),
  'reach', (select json_agg(x) from (select kind, count(distinct visitor_id) people, sum(n) n from feature_events
      where day >= :since::date and (kind like 'shop%' or kind in ('place:open', 'place:visit')) group by 1 order by 2 desc) x),
  'customized', (select count(distinct visitor_id) from pet_equipped));

-- E6. XP and ranks: where the people who studied since :since stand on the ladder, and how many moved up a rank
--     (sh_rank's gtier: 0 to 6 on the Handpiece, 7+ the ModuPro and the Loupes) since the release's baseline
with act as (select distinct visitor_id from xp_awards where d >= :since::date and src = 'answer'),
     r as (select x.xp, (sh_rank(x.xp)).gtier, (select gtier from sh_rank(coalesce(b.xp, 0))) gtier0
           from act a join xp_visitors x using (visitor_id) left join game_baseline b using (visitor_id))
select gtier, count(*) people, min(xp) min_xp, max(xp) max_xp, sum((gtier > gtier0)::int) moved_up_since_release
from r group by 1 order by 1;
