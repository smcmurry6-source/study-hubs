---
type: task
status: open
hub: widget
created: 2026-11-12
requested-by: Sam
due: after the redesign's release
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

## Sam's calls (2026-11-12, [decisions](../decisions.md))

- **After the release**, in its own session, with its rows in **a new migration** (the next free number then), not
  in `migration_v54.sql`. Nobody is near 125,000 XP, and it is the one piece of the redesign that needs catalog rows.
- The same migration adds **`bowling` to the trophy kinds `record_achievement` takes**
  ([the bowling egg](done/2026-11-06-redesign-bowling-egg.md): until then that trophy is kept on the device), and the
  client then records it for everyone whose device has it.

## Build spec

Not one of the sessions before the release ([phase 4](2026-11-05-redesign-phase-4-game-layer.md), "From here to the
release"); "For every session above" there still holds, except that the redesign is live by then, so this is an
ordinary tier 2 change to the live site ([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md)).

**Files to touch**: `tools/figures/site/sets.mjs` (`RANKS`: tiers 7 to 20), a pack file beside
`tools/figures/site/packs/ranks.mjs` (or that file), the generated kit files (`node tools/figures/site/build.mjs`:
`widget/hub-art/place/ranks.js` and `widget/hub-art/outfits.js`), `widget/place.js` (`RANKS`, the names a locked
card shows: "Reach ModuPro Gold"), a new `migration_v<N>.sql` with the 28 rows (`rank_tier` 7 to 20, price 0, on
no shelf, `kind` `outfit` or `yard`, exactly `allSetItems()` of `sets.mjs`) and `bowling` added to
`record_achievement`'s list, `supabase/pending-migrations.txt` until it is applied, `tools/release/xp.js` (its
"twelve rank items" check becomes forty; the trophy kind), `widget/trophies.js` or `widget/ranks.js` (record the
Bowling trophy when the device has it and the server takes it), the About page (the rank sets, the trophy's share).

**Not to touch**: `migration_v54.sql` (applied by then: a change is a new migration); the Handpiece's six sets.

**What it calls**: the server already owns the rule (`sh_owns` gives a rank item to everyone whose `gtier` has
reached its `rank_tier`; `get_my_shop`'s `locked` lists the ones not reached with their tier), and `widget/place.js`
draws any rank piece the catalog names. How to draw a set: [draw-a-seasonal-set](../how-to/draw-a-seasonal-set.md)
(`node tools/figures/site/pack-preview.mjs ranks <out.png>`). In the Loupes journey Timmy wears loupes: each of those
seven outfits leaves room for them or goes on the kit's `NO_LOUPES` list.

**Sam's look**: two contact sheets (the ModuPro's fourteen pieces, the Loupes' fourteen), light and dark, and his
yes before the kit files are committed. Ask Sam before the migration is applied (it is applied through the
Supabase connector after his "merge", as every migration is).

**The preview's made-up data**: `?xp=180000` and `?xp=300000` own the sets their rank has reached and show the rest
locked.

**Tests**: `node tools/release/xp.js` (the catalog's rank rows are exactly `sets.mjs`; an account at each later tier
owns that tier's set and not the next), `node tools/release/rls.js`, the smoke test's place steps at `?xp=180000`.

**Out of scope**: new ranks or XP rules; pieces for sale; redrawing the Handpiece's sets.

## Done when

- [x] Sam's yes to adding the 28 rows to the catalog (2026-11-12: after the release, in a new migration)
- [ ] The 28 pieces drawn (a contact sheet per journey, light and dark) and approved by Sam
- [ ] In `sets.mjs`, a pack file, the generated kit files (`node tools/figures/site/build.mjs`) and the catalog
- [ ] `widget/place.js` names the later ranks on a locked card
- [ ] `bowling` added to the trophy kinds in the same migration, and the client records the trophy
- [ ] `node tools/release/xp.js` and the smoke test pass

## Log

- 2026-11-12 (Claude Code): written when part C cut it.
- 2026-11-12 (Claude Code, planning only): Sam: after the release, in a new migration. Build spec above; the
  Bowling trophy's server kind rides in the same migration.

## Outcome

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [the journeys](2026-11-06-redesign-progression-journeys.md) ·
[game-server](../reference/game-server.md) · [the release](2026-11-06-redesign-release.md)

## Opening prompt

After the redesign's release:

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then do the task in
> `vault/tasks/2026-11-12-redesign-later-journeys-rank-sets.md` (its "Build spec"). The redesign is live, so this is
> a change to the live site: its rows go in a new migration, never into `migration_v54.sql`, and nothing is applied
> before I say "merge". Grep the big files, never read them whole. No subagents. Send me the two contact sheets,
> light and dark, and wait for my yes before the kit files are final. Open a draft PR with the test report.
