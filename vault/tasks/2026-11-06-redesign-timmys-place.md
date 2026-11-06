---
type: task
status: in-progress
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: Claude Code
pr: 
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
- [ ] What's placed is kept on the server (`equip_item`, [the shop note](2026-11-06-redesign-timmy-shop.md)) and the same on
      every linked device
- [ ] `LORE.md` and the About page (Timmy's place) updated
- [ ] CI and the release suites pass, perf budgets met (`node tools/release/run.js`)
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: written from Sam's calls in chat.
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

## Outcome

Related: [Timmy's shop](2026-11-06-redesign-timmy-shop.md) · [the bowling egg](2026-11-06-redesign-bowling-egg.md) ·
[phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [diagrams-anima](../rules/diagrams-anima.md)
