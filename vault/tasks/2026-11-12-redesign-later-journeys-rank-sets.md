---
type: task
status: open
hub: widget
created: 2026-11-12
requested-by: Sam
due: 
waiting-on: 
agent: 
pr: 
---

# The ModuPro's and the Loupes' rank sets for Timmy's place

## Goal

Every full rank-up of the later two journeys gives what the Handpiece's do: an outfit and a yard piece, earned and
never sold. Fourteen ranks (seven in the ModuPro, seven in the Loupes), 28 drawings.

## Context

- Cut from part C of [phase 4](2026-11-05-redesign-phase-4-game-layer.md) with Sam's yes (2026-11-12, to the open
  calls in [the place's note](2026-11-06-redesign-timmys-place.md): "okay thats fine"): the place as a real client was
  one session's work already, and nobody is within reach of 125,000 XP.
- What exists: the Handpiece's six rank sets (`tools/figures/site/packs/ranks.mjs`, listed in `sets.mjs` `RANKS`, gtier
  1 to 6), their twelve catalog rows in `migration_v54.sql` (`rank_tier` 1 to 6), and the client. `widget/place.js`
  draws any rank piece the catalog names and shows the locked ones with the rank that gives them ("Reach Gold"), so
  **the client needs only its names for ranks past 6** (`RANKS` in `widget/place.js` stops at Dark Matter; a locked
  piece of gtier 7 to 20 should read "Reach ModuPro Gold").
- The server already owns the rule: `sh_owns` gives a rank item to everyone whose `gtier` has reached its `rank_tier`
  (1 to 6 the Handpiece, 7 to 13 the ModuPro, 14 to 20 the Loupes: [game-server](../reference/game-server.md)).
- **This changes the pending migration**: 28 new rows in `shop_items`, and `tools/release/xp.js` requires the
  catalog's rank rows to be exactly `sets.mjs`. Sam's instruction on 2026-11-12 was to tell him instead of changing
  the migration, so ask before adding the rows. If the migration has been applied by then, it is a new migration.
- How to draw a set: [draw-a-seasonal-set](../how-to/draw-a-seasonal-set.md) (`pack-preview.mjs` makes a contact
  sheet of one set). Rules: [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md), the lore rules in
  [podcast-reactions](../rules/podcast-reactions.md). In the loupes journey Timmy wears his loupes, so those seven
  outfits either leave room for them or go on the kit's `NO_LOUPES` list.

## Done when

- [ ] Sam's yes to adding the 28 rows to the catalog
- [ ] The 28 pieces drawn (a contact sheet per journey, light and dark) and approved by Sam
- [ ] In `sets.mjs`, a pack file, the generated kit files (`node tools/figures/site/build.mjs`) and the catalog
- [ ] `widget/place.js` names the later ranks on a locked card
- [ ] `node tools/release/xp.js` and the smoke test pass

## Log

- 2026-11-12 (Claude Code): written when part C cut it.

## Outcome

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [the journeys](2026-11-06-redesign-progression-journeys.md) ·
[game-server](../reference/game-server.md) · [the release](2026-11-06-redesign-release.md)
