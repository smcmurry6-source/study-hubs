---
type: task
status: in-progress
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/289
---

# Timmy's place: the house card, redrawn as a scene you build

## Goal

Sam's idea (2026-11-06): a full redesign of Timmy's house card, more detailed and with a 3D look, where students upgrade the
scene, the house itself and what's around it (a swimming pool, a garden...) and can buy a whole new home: a castle, a giant
mushroom, a treehouse. The shop sells the pieces ([Timmy's shop](2026-11-06-redesign-timmy-shop.md)). Ships with the redesign.

## Context

- Today's card: `houseSvg` in `widget/pet.js`, a 240 x 150 SVG cottage on a hill with a toothbrush by the door and a tree out
  front; decorations grow with the handpiece rank, mastered hubs fly pennants, the yard follows the seasons and holidays.
  The redesign plan puts Timmy and the house on one SVG symbol sheet and on the dashboard's "you" card
  ([the audit and plan](done/2026-11-05-redesign-audit-and-plan.md), 4.5, 4.7; [phase 3](2026-11-05-redesign-phase-3-dashboard.md)).
- Rules that matter most here: [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (drawn by the agent in
  SVG in Timmy's ink style; nothing generated, no emoji), [podcast-reactions](../rules/podcast-reactions.md) (the lore
  rules), [preview-and-release-test](../rules/preview-and-release-test.md), [about-page](../rules/about-page.md).
- Lore: the cottage on a hill is canon (`tools/podcast/LORE.md`). It stays every Timmy's starting home and the podcast's
  Timmy keeps it; a student's own Timmy can move up. Add a line to `LORE.md` saying so.

## The design

- **A 3D look, drawn in SVG**: an isometric scene (the way the anima figures are drawn), in Timmy's ink outline with flat
  tones and depth from overlap and shading, not a 3D engine. It stays in the site's style, stays sharp on a phone and loads
  as fast as a drawing. A little life: smoke from the chimney, water in the pool, leaves, Timmy walking between spots; a
  slight tilt when you drag or tilt the phone. Reduced motion: still.
- **Built from slots, not free placement**, so every combination looks right and nothing overlaps:
  - **The home**: the cottage (free, the start), then shop homes: a castle, a giant mushroom, a treehouse, and more later
    (a lighthouse, a houseboat...). Each home has its own spots for Timmy and its own night lights.
  - **The scene**: the hill (free), then a beach, a forest, a snowy mountain, a night sky with the Dark Matter stars.
  - **The yard**: four to six spots by the home for a garden, a swimming pool, a hammock, a mailbox, a bowling lane (the
    [bowling egg](2026-11-06-redesign-bowling-egg.md) lives there), a doghouse...
  - **Upgrades of the home itself**: windows, a porch, a chimney, a flag, a paint color.
- **What students already earned still shows** on any home and scene: the rank decorations (now one set per journey: the
  ModuPro on the porch, Timmy in loupes: [the journeys](2026-11-06-redesign-progression-journeys.md)), the mastery
  pennants, the seasons and the holiday props, Timmy's mood and HP.
- **Two sizes**: a card on the "you" panel (the dashboard and a hub's More), and a full view where you tap a spot to change
  what's there, from what you own, with "Get more in the shop".
- **Light and dark**, and the scene's own day and night by the student's clock.
- **Weight**: the art loads only when the house is on screen (phase 5's on-demand bundle), not with every page.

## Done when

- [ ] The homes, scenes, yard items and upgrades drawn and approved by Sam in a preview (phone and laptop, light and dark),
      starting with the cottage redrawn, the castle, the giant mushroom, the treehouse, the pool and the garden
- [ ] The scene renderer (slots, depth order, the rank and season layers) and the full view built in phase 4, recorded on the
      preview with reduced motion too
- [x] What's placed is kept on the server (`equip_item`, [the shop note](2026-11-06-redesign-timmy-shop.md)) and the same on
      every linked device (the server side, phase 5 part 3; the full view that calls it is phase 4); its five yard spots and
      names follow the art (Sam, 2026-11-06)
- [ ] `LORE.md` and the About page (Timmy's place) updated
- [ ] CI and the release suites pass, perf budgets met (`node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: written from Sam's calls in chat.
- 2026-11-06 (Claude Code): `equip_item` and `pet_equipped` keep the home, the scene, six yard spots and the home's upgrades
  (windows, porch, chimney, flag, paint) on the server; a yard item moves between spots; on Link my devices the newer
  choice per slot wins (`migration_v54.sql`, [game-server](../reference/game-server.md)). The slot names are a draft for
  phase 4's renderer.
- 2026-11-06 (Claude Code): the art, drawn first on the design page, for Sam's look before anything goes into
  `widget/pet.js`. One kit, `tools/figures/site/place.mjs`, built by `build.mjs` into `tools/preview/design/place.js`
  (`window.SH_PLACE`): an isometric 14 x 14 plot with five yard slots (a wide one for the lane), drawn back to front.
  Four homes (the cottage redrawn, the castle, the giant mushroom, the treehouse), each with its own Timmy spots, door,
  toothbrush and night lights, and four to five upgrades (windows, a porch or landing, a chimney, a flag, a paint color);
  five scenes (the hill, with thirty-one's house on the next hill and the rabbit by its burrow; a beach, a forest, a snowy
  mountain, the night sky with the Dark Matter stars); six yard items (a garden, a pool, a hammock, a mint fountain, a
  doghouse, a bowling lane). The rank layers, the pennants, the Crown, the seasons and the holiday props draw on every
  home and scene. The design page's "Timmy's place" section has the full view (tap a spot, Timmy walks there, drag or
  tilt) and the card, light and dark, at 390 px, reduced motion still. The build checks 188 combinations. Waiting for
  Sam's look; then the renderer goes into `widget/pet.js`, and `LORE.md` and the About page get their lines when a
  student's Timmy can really move.
- 2026-11-06 (Claude Code): the art against the server draft above: its rarity tags now follow `shop_items` in
  `migration_v54.sql`. Two differences are Sam's call (PR #289): the server keeps six yard spots, the art draws five
  (the lane takes two); the server sells a mailbox, the art keeps the mailbox as the Bronze rank's and has a mint fountain
  instead. The upgrades' names differ too (round windows and a brick chimney there; shutters, window boxes and a stone
  chimney here): whichever Sam picks, the other side follows.
- 2026-11-06 (Claude Code): redrawn from Sam's feedback, with free rein. **No plot square**: each scene's ground fills the
  picture (a hilltop, dunes into the sea, a pine clearing, a snowy ledge over the clouds, a little planet, a cloud bank),
  and the homes sit in it with a soft shadow and the scene's own ground, path, tree and lamp. **Eight homes** (the cottage,
  the castle, the giant mushroom, the treehouse, and new: a beach hut, a lighthouse, an igloo, an observatory), **six
  scenes** (new: above the clouds), **twelve yard things** (new: a sandcastle, a beach umbrella, a campfire, a hot spring,
  a telescope, the mailbox back in the shop) and **seven theme outfits** for Timmy, in six themes (hilltop, seaside,
  woodland, snowy, starlight, clouds) plus the classics. **Earned things are part of the place**: the rank is a statue of
  the handpiece by the door (the rank's material, one to three steps for the level), each mastered hub a pennant in the
  bunting (gold with a crown mark for a Crown). **Rarity art**: each rarity has its own animated card frame, placing burst
  and coin. **Timmy hops** on the ground between spots, round the house and the yard things (a route over a visibility
  graph; he climbs the treehouse ladder and the beach hut's steps), never floats. **Eggs**: tapping the sun or moon, the
  house, the yard things and each scene's critter plays a small animation with a line from Timmy. The design page has Play
  and Customize, rarity cards with prices, and the galleries; the build checks 648 drawings and 1872 walks.
- 2026-11-06 (Claude Code): Sam's calls on the redraw: five yard spots, the mint fountain stays, the server's names follow
  the art. `migration_v54.sql` now has the five spots (`yard-left`, `yard-front`, `yard-corner`, `yard-side`,
  `yard-right`), `wide` for the bowling lane (`equip_item` keeps it in the side yard and clears the front corner), the
  upgrades renamed (`fancy-windows`, `chimney`, Timmy flag) and every new piece with the kit's id, rarity and price (68
  rows); `tools/release/xp.js` tests the spots and the lane (247 checks pass). Still waiting for Sam's look at the art;
  then the renderer goes into `widget/pet.js`, and `LORE.md` (the new critters: the rabbit, a crab, an owl, a yeti, a
  friend in a crater, a whale, the dog) and the About page get their lines.
- 2026-11-10: Sam's third round of feedback (the art, the scenes, the yard, mastery, rank-up unlocks, seasonal sets, the
  shop's shelves, visiting someone's Timmy) is its own task: [round 3](2026-11-10-redesign-timmys-place-round-3.md). PR #289 stays open for it.
- 2026-11-10 (Claude Code): round 3 is built on the design page ([its note](2026-11-10-redesign-timmys-place-round-3.md)):
  the scenes, homes and yard redrawn, Timmy's wave and his bubble, two mastery displays for Sam to pick from, and the
  seasonal and rank sets as packs (`tools/figures/site/packs/`). Still nothing in `widget/pet.js`.
- 2026-11-10 (Claude Code): Sam's second look: hub mastery is one **medal board** (each hub's own medal, a big view on
  tap), the statue stands upright, and the design page has the shop's window, the customizer, the rank board and
  visiting ([round 3's note](2026-11-10-redesign-timmys-place-round-3.md)). Still nothing in `widget/pet.js`.

## Outcome

Related: [round 3](2026-11-10-redesign-timmys-place-round-3.md) · [Timmy's shop](2026-11-06-redesign-timmy-shop.md) · [the bowling egg](2026-11-06-redesign-bowling-egg.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [diagrams-anima](../rules/diagrams-anima.md)
