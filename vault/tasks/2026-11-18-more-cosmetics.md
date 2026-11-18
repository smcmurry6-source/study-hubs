---
type: task
status: in-progress
hub: widget
created: 2026-11-18
requested-by: Sam
due:
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/409
---

# More cosmetics for Timmy and Timmy's place: six year-round collections, five rare costumes, six paints

## Goal

Sam, 2026-11-18: "Lets work on timmy outfits and place cosmetics. Go crazy" (the inbox's "More cosmetics", on hold since
2026-11-17). Fill the shop's everyday rotation with much more to save up for, without making every page heavier.

## Context

- How the place and the shop work: [Timmy's place](done/2026-11-06-redesign-timmys-place.md), [round 3](done/2026-11-10-redesign-timmys-place-round-3.md)
  (the seasonal sets and packs), [the shop](done/2026-11-06-redesign-timmy-shop.md), [game-server](../reference/game-server.md)
  ("Shiny Gold Crowns and the shop"), [draw-a-seasonal-set](../how-to/draw-a-seasonal-set.md).
- Before this, the daily and weekly picks drew from 46 everyday pieces (7 homes, 5 scenes, 12 outfits, 13 yard pieces,
  9 upgrades and paints); the 112 seasonal pieces are sold only in their season.
- Rules: [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md) (the house style), [podcast-reactions](../rules/podcast-reactions.md)
  (the lore), [about-page](../rules/about-page.md), [preview-and-release-test](../rules/preview-and-release-test.md) (a tier 2 change: a
  migration and shared widget code).

## The plan (the agent's, from "Go crazy"; [decisions](../decisions.md))

- **Six year-round collections** (`COLLECTIONS` in `tools/figures/site/sets.mjs`), eight pieces each, like a season's set
  but in the everyday rotation all year (`season` null, `rotates`): a Legendary home, an Epic scene, outfits Common /
  Uncommon / Rare, yard pieces Uncommon / Rare / Epic. Dino valley, Moon base, Coral reef, Desert ranch, Retro arcade, Rock
  show. Each is a pack (`tools/figures/site/packs/<k>.mjs`), so its drawings load only where a place shows one and the kit
  every page loads stays its size. 48 pieces: the rotation goes from 46 to 94 pieces (100 with the paints).
- **Five more rare costumes** (`COSTUMES` in `sets.mjs`, ten in all): the wizard, the robot, the firefighter, the shark
  (Epic) and the dragon (Legendary), drawn in `place.mjs`'s `OUTFITS`, with their lines in `tools/podcast/LORE.md`.
- **Six more paints**: coral, sage, sand, rose, slate, teal (`PAINTS` and `BOLD` in `place.mjs`).
- **The server**: `migration_v65.sql`, 59 rows into `shop_items`, nothing else; applied once the PR is live.
- **The client**: the customizer gets a Collections tab (`widget/place.js`), the shop names a piece's collection and stands
  it in its own scene (`widget/shop.js`), the costume lists name ten (`widget/hub-timmy.js`, `widget/dash.js`, `widget/shop.js`).

## Done when

- [x] The six packs drawn, each checked (`node tools/figures/site/build.mjs --pack <k> --dry`) and looked at on its contact sheet, light and dark
- [x] The five costumes drawn, with three lines each and their `LORE.md` entries
- [x] `node tools/figures/site/build.mjs` (every walk, every combination) and `--check`; the generated files committed
- [x] The client: the Collections tab, the shop's collection names and scenes, ten costumes; bundles rebuilt
- [ ] `migration_v65.sql` tested on a throwaway copy (`tools/release/xp.js`), the preview sells the new rows
- [ ] CI's checks and the release suites pass; a test report in the PR
- [ ] Contact sheets of all of it sent to Sam (sent 2026-11-18); Sam's look and "merge"
- [ ] After the merge: `migration_v65.sql` applied through the connector, appended to `supabase/schema.sql`, its line out of `supabase/pending-migrations.txt` (a small follow-up PR)
- [x] About page, Ask Timmy's site help, `DEPLOY_NOTES.md`, the changelog line, this note's Outcome

## Log

- 2026-11-18: Sam: "Lets work on timmy outfits and place cosmetics. Go crazy". Planned and started (Claude Code): the lists,
  the kit's plumbing and the client first; the six packs and the costumes drawn in parallel, each by its own agent.
- 2026-11-18: the drawers stopped at the usage limit partway (their files were kept) and were resumed after it reset. Each
  pack reviewed on its sheet, day and night: Rock show's night glows near the door made smaller, Moon base's door spot moved
  out of the front yard slot (it stood in it). Two kit bugs found and fixed on the way ([the bug log](../release/bug-log.md)):
  BUG-171, a set fetched late never brought its yard eggs' CSS, so seasonal eggs stayed hidden on the live site; BUG-172
  (CI), the kit's lists after `addPack` dropped `coll`, so the Collections tab came up empty. The build checks both now.
- 2026-11-18: CI's performance suite: the dashboard at 358 KB of its 345 (all 88 outfits in `outfits.js`). Split it
  (BUG-173): 340 KB in 10 requests.

## Outcome

[#409](https://github.com/smcmurry6-source/study-hubs/pull/409). Six collections (48 pieces, `widget/hub-art/place/<k>.js`,
45-55 KB each, fetched only where a place shows one), five costumes and six paints, the Collections tab, the shop's collection
names and scenes, and `migration_v65.sql` (59 rows; applied after the merge). Two shared files grow and are still fetched on
first use only: the kit (`widget/hub-art/place.js`, 269 to 302 KB, the costumes); the outfits are split (BUG-173): `outfits.js`
has the everyday and rank outfits (50 KB, 9 over the wire; it was 187 KB with all of them), and `widget/hub-art/outfits/`
has the costumes, the seasonal sets' and the collections' outfits, each file fetched only when someone drawn wears one. Left for later, in [the inbox](inbox.md): a tall piece in the front yard slot covers Timmy at the door (as July 4's
fireworks and Thanksgiving's balloon already do), and kit niceties the drawers asked for (eggs that move the whole piece, a
coral and a moon tree, no snow under the sea). Its status stays in-progress until Sam's "merge" and the migration.

Related: [the shop](done/2026-11-06-redesign-timmy-shop.md) · [Timmy's place](done/2026-11-06-redesign-timmys-place.md) ·
[draw-a-seasonal-set](../how-to/draw-a-seasonal-set.md) · [game-server](../reference/game-server.md) · [the inbox](inbox.md)
