-- v65 (2026-11-18): more cosmetics for Timmy and Timmy's place. Sam: "Lets work on timmy outfits and place cosmetics.
-- Go crazy". 59 new rows in the shop's catalog, nothing else changes:
--   - six year-round collections, eight pieces each (48 rows): a home, a scene, three outfits and three yard pieces that
--     belong together, like a season's set, but in the everyday rotation (season null, rotates): the daily and weekly
--     picks draw from them with the rest, the rarer ones less often. Dino valley, Moon base, Coral reef, Desert ranch,
--     Retro arcade and Rock show. Exactly allCollectionItems() of tools/figures/site/sets.mjs (tools/release/xp.js checks),
--     drawn in tools/figures/site/packs/<collection>.mjs;
--   - five more rare costumes (the wizard, the robot, the firefighter, the shark and the legendary dragon): like the first
--     five, never on a shelf until spotted (record_costume_sighting), the page names the day's costume itself
--     (costumeOfDay in widget/hub-timmy.js and widget/dash.js, from sets.mjs COSTUMES);
--   - six more paints (coral, sage, sand, rose, slate, teal), in the rotation like the first five.
-- Every price is inside its rarity's band (the table's check). The functions are unchanged: sh_shop_day, buy_item,
-- equip_item and get_my_shop already sell, equip and list any active row by its kind and slot. Written and tested on a
-- throwaway copy of supabase/schema.sql (tools/release/xp.js). Apply after the pages that draw these pieces are live, so
-- the daily picks never show a piece before its drawing has shipped.

insert into public.shop_items (id, name, kind, rarity, price, season, slot, hp, boost_minutes, boost_mult, shelf, rotates, sort) values
  ('stone-den', 'Stone-age den', 'home', 'legendary', 6000, null, null, null, null, null, false, true, 3001),
  ('volcano-valley', 'Volcano valley', 'scene', 'epic', 2400, null, null, null, null, null, false, true, 3002),
  ('field-hat', 'Fossil hunter''s hat', 'outfit', 'common', 150, null, null, null, null, null, false, true, 3003),
  ('fossil-vest', 'Dig-site vest and brush', 'outfit', 'uncommon', 350, null, null, null, null, null, false, true, 3004),
  ('stego-hood', 'Stegosaurus hood', 'outfit', 'rare', 900, null, null, null, null, null, false, true, 3005),
  ('dino-nest', 'Dino egg nest', 'yard', 'uncommon', 400, null, null, null, null, null, false, true, 3006),
  ('fossil-dig', 'Fossil dig', 'yard', 'rare', 900, null, null, null, null, null, false, true, 3007),
  ('trex-skeleton', 'T. rex skeleton', 'yard', 'epic', 2200, null, null, null, null, null, false, true, 3008),
  ('moon-dome', 'Moon base dome', 'home', 'legendary', 6500, null, null, null, null, null, false, true, 3011),
  ('lunar-plains', 'Lunar plains', 'scene', 'epic', 2600, null, null, null, null, null, false, true, 3012),
  ('antenna-headband', 'Antenna headband', 'outfit', 'common', 150, null, null, null, null, null, false, true, 3013),
  ('space-visor', 'Space visor', 'outfit', 'uncommon', 400, null, null, null, null, null, false, true, 3014),
  ('jetpack', 'Jetpack', 'outfit', 'rare', 1000, null, null, null, null, null, false, true, 3015),
  ('moon-rover', 'Moon rover', 'yard', 'uncommon', 450, null, null, null, null, null, false, true, 3016),
  ('satellite-dish', 'Satellite dish', 'yard', 'rare', 1000, null, null, null, null, null, false, true, 3017),
  ('rocket', 'Rocket on its pad', 'yard', 'epic', 2400, null, null, null, null, null, false, true, 3018),
  ('conch-house', 'Conch shell house', 'home', 'legendary', 6000, null, null, null, null, null, false, true, 3021),
  ('sunlit-reef', 'Sunlit reef', 'scene', 'epic', 2600, null, null, null, null, null, false, true, 3022),
  ('starfish-clip', 'Starfish clip', 'outfit', 'common', 120, null, null, null, null, null, false, true, 3023),
  ('octopus-hat', 'Octopus hat', 'outfit', 'uncommon', 400, null, null, null, null, null, false, true, 3024),
  ('mer-tail', 'Mer-tail', 'outfit', 'rare', 950, null, null, null, null, null, false, true, 3025),
  ('coral-garden', 'Coral garden', 'yard', 'uncommon', 350, null, null, null, null, null, false, true, 3026),
  ('giant-clam', 'Giant clam', 'yard', 'rare', 900, null, null, null, null, null, false, true, 3027),
  ('sunken-chest', 'Sunken treasure chest', 'yard', 'epic', 2000, null, null, null, null, null, false, true, 3028),
  ('adobe-ranch', 'Adobe ranch house', 'home', 'legendary', 5500, null, null, null, null, null, false, true, 3031),
  ('red-rocks', 'Red rock desert', 'scene', 'epic', 2200, null, null, null, null, null, false, true, 3032),
  ('bandana', 'Bandana', 'outfit', 'common', 120, null, null, null, null, null, false, true, 3033),
  ('cowboy-hat', 'Cowboy hat', 'outfit', 'uncommon', 350, null, null, null, null, null, false, true, 3034),
  ('sheriff-vest', 'Sheriff''s vest and star', 'outfit', 'rare', 800, null, null, null, null, null, false, true, 3035),
  ('cactus-garden', 'Cactus garden', 'yard', 'uncommon', 300, null, null, null, null, null, false, true, 3036),
  ('windmill-pump', 'Windmill', 'yard', 'rare', 800, null, null, null, null, null, false, true, 3037),
  ('covered-wagon', 'Covered wagon', 'yard', 'epic', 1900, null, null, null, null, null, false, true, 3038),
  ('arcade-hall', 'Arcade hall', 'home', 'legendary', 6500, null, null, null, null, null, false, true, 3041),
  ('pixel-hills', 'Pixel hills', 'scene', 'epic', 2400, null, null, null, null, null, false, true, 3042),
  ('gamer-headset', 'Gamer headset', 'outfit', 'common', 180, null, null, null, null, null, false, true, 3043),
  ('pixel-shades', 'Pixel shades', 'outfit', 'uncommon', 300, null, null, null, null, null, false, true, 3044),
  ('high-score-jacket', 'High-score jacket', 'outfit', 'rare', 850, null, null, null, null, null, false, true, 3045),
  ('arcade-cabinet', 'Arcade cabinet', 'yard', 'uncommon', 450, null, null, null, null, null, false, true, 3046),
  ('pinball', 'Pinball machine', 'yard', 'rare', 1000, null, null, null, null, null, false, true, 3047),
  ('claw-machine', 'Giant claw machine', 'yard', 'epic', 2200, null, null, null, null, null, false, true, 3048),
  ('record-shop', 'Record shop', 'home', 'legendary', 6000, null, null, null, null, null, false, true, 3051),
  ('festival-field', 'Festival field', 'scene', 'epic', 2400, null, null, null, null, null, false, true, 3052),
  ('band-tee', 'Band tee', 'outfit', 'common', 120, null, null, null, null, null, false, true, 3053),
  ('leather-jacket', 'Leather jacket', 'outfit', 'uncommon', 450, null, null, null, null, null, false, true, 3054),
  ('electric-guitar', 'Electric guitar', 'outfit', 'rare', 1000, null, null, null, null, null, false, true, 3055),
  ('amp-stack', 'Amp stack', 'yard', 'uncommon', 400, null, null, null, null, null, false, true, 3056),
  ('drum-kit', 'Drum kit', 'yard', 'rare', 1000, null, null, null, null, null, false, true, 3057),
  ('tour-stage', 'Little stage and lights', 'yard', 'epic', 2400, null, null, null, null, null, false, true, 3058),
  ('wizard', 'Wizard', 'costume', 'epic', 2000, null, null, null, null, null, false, false, 906),
  ('robot', 'Robot', 'costume', 'epic', 2200, null, null, null, null, null, false, false, 907),
  ('firefighter', 'Firefighter', 'costume', 'epic', 1600, null, null, null, null, null, false, false, 908),
  ('shark', 'Shark', 'costume', 'epic', 2400, null, null, null, null, null, false, false, 909),
  ('dragon', 'Dragon', 'costume', 'legendary', 4500, null, null, null, null, null, false, false, 910),
  ('paint-coral', 'Coral paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 510),
  ('paint-sage', 'Sage paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 511),
  ('paint-sand', 'Sand paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 512),
  ('paint-rose', 'Rose paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 513),
  ('paint-slate', 'Slate paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 514),
  ('paint-teal', 'Teal paint', 'upgrade', 'common', 150, null, 'paint', null, null, null, false, true, 515)
on conflict (id) do nothing;
