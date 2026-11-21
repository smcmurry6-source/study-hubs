-- v91 (2026-11-20): the ModuPro's and the Loupes' rank sets for Timmy's place.
-- vault/tasks/2026-11-12-redesign-later-journeys-rank-sets.md (Sam, 2026-11-12: after the release, in a new migration).
-- (v89 is PR #492's, the Dark Matter crowns; v90 the admin page's kept copies.)
--
-- Every full rank-up of the later two journeys gives what the Handpiece's six do: an outfit and a yard piece, earned and
-- never sold. Fourteen ranks, 28 rows: rank_tier 7-13 the ModuPro (Stone to Dark Matter), 14-20 the Loupes, price 0, on no
-- shelf and out of the rotation, exactly allSetItems() of tools/figures/site/sets.mjs (tools/release/xp.js checks).
-- Nothing else changes: sh_owns already gives a rank item to everyone whose gtier has reached its rank_tier, and
-- get_my_shop lists the rest as locked with their tier. Their drawings are tools/figures/site/packs/ranks.mjs.
--
-- Rows only: no function, no lock beyond the insert, safe at any hour. Running it twice changes nothing.

insert into public.shop_items (id, name, kind, rarity, price, season, gift, rank_tier, rotates, sort) values
  ('rank-modu-stone-outfit', 'Sculptor''s beret and smock', 'outfit', 'epic', 0, null, false, 7, false, 2013),
  ('rank-modu-stone-yard', 'Half-carved stone molar', 'yard', 'epic', 0, null, false, 7, false, 2014),
  ('rank-modu-antique-outfit', 'Lab visor and brass-buttoned coat', 'outfit', 'epic', 0, null, false, 8, false, 2015),
  ('rank-modu-antique-yard', 'Brass articulator', 'yard', 'epic', 0, null, false, 8, false, 2016),
  ('rank-modu-bronze-outfit', 'Foundry cap and casting tongs', 'outfit', 'epic', 0, null, false, 9, false, 2017),
  ('rank-modu-bronze-yard', 'Bronze casting machine', 'yard', 'epic', 0, null, false, 9, false, 2018),
  ('rank-modu-silver-outfit', 'Head mirror and scrub cap', 'outfit', 'epic', 0, null, false, 10, false, 2019),
  ('rank-modu-silver-yard', 'Silver instrument tray', 'yard', 'epic', 0, null, false, 10, false, 2020),
  ('rank-modu-gold-outfit', 'Gold crown and velvet cape', 'outfit', 'legendary', 0, null, false, 11, false, 2021),
  ('rank-modu-gold-yard', 'Golden dental chair', 'yard', 'legendary', 0, null, false, 11, false, 2022),
  ('rank-modu-diamond-outfit', 'Crystal face shield and diamond bur', 'outfit', 'legendary', 0, null, false, 12, false, 2023),
  ('rank-modu-diamond-yard', 'Giant diamond bur', 'yard', 'legendary', 0, null, false, 12, false, 2024),
  ('rank-modu-dark-outfit', 'Nebula cape and ringed planet', 'outfit', 'legendary', 0, null, false, 13, false, 2025),
  ('rank-modu-dark-yard', 'Nebula in a bell jar', 'yard', 'legendary', 0, null, false, 13, false, 2026),
  ('rank-loupes-stone-outfit', 'Explorer''s pith helmet', 'outfit', 'legendary', 0, null, false, 14, false, 2027),
  ('rank-loupes-stone-yard', 'Stone sundial', 'yard', 'legendary', 0, null, false, 14, false, 2028),
  ('rank-loupes-antique-outfit', 'Navigator''s tricorn and spyglass', 'outfit', 'legendary', 0, null, false, 15, false, 2029),
  ('rank-loupes-antique-yard', 'Brass telescope', 'yard', 'legendary', 0, null, false, 15, false, 2030),
  ('rank-loupes-bronze-outfit', 'Lamplighter''s cap and lantern', 'outfit', 'legendary', 0, null, false, 16, false, 2031),
  ('rank-loupes-bronze-yard', 'Bronze armillary sphere', 'yard', 'legendary', 0, null, false, 16, false, 2032),
  ('rank-loupes-silver-outfit', 'Bobble hat and binoculars', 'outfit', 'legendary', 0, null, false, 17, false, 2033),
  ('rank-loupes-silver-yard', 'Silver microscope', 'yard', 'legendary', 0, null, false, 17, false, 2034),
  ('rank-loupes-gold-outfit', 'Sun crown and golden sash', 'outfit', 'legendary', 0, null, false, 18, false, 2035),
  ('rank-loupes-gold-yard', 'Golden lighthouse', 'yard', 'legendary', 0, null, false, 18, false, 2036),
  ('rank-loupes-diamond-outfit', 'Prism cape', 'outfit', 'legendary', 0, null, false, 19, false, 2037),
  ('rank-loupes-diamond-yard', 'Crystal prism', 'yard', 'legendary', 0, null, false, 19, false, 2038),
  ('rank-loupes-dark-outfit', 'Constellation robe and crescent moon', 'outfit', 'legendary', 0, null, false, 20, false, 2039),
  ('rank-loupes-dark-yard', 'Dark Matter observatory', 'yard', 'legendary', 0, null, false, 20, false, 2040)
on conflict (id) do nothing;
