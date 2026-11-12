---
type: task
status: open
hub: widget
created: 2026-11-12
requested-by: Claude Code (found building Timmy's place, part C of phase 4)
due: before the redesign's release
waiting-on: 
agent: 
pr: 
---

# Five everyday outfits in the shop's catalog have no drawing

## Goal

Every outfit the shop can sell is one Timmy can be drawn in. Today five can't be.

## Context

- Found on 2026-11-12 while building Timmy's place as a real client ([the place](2026-11-06-redesign-timmys-place.md),
  [phase 4](2026-11-05-redesign-phase-4-game-layer.md) part C), checking the client against the server as written
  ([game-server](../reference/game-server.md)). Sam's instruction for that session: "If they disagree, tell me instead
  of changing the migration." So the migration is unchanged.
- `migration_v54.sql` (pending, [the release](2026-11-06-redesign-release.md)) lists twelve everyday outfits. Seven are
  drawn by the place's kit (`tools/figures/site/place.mjs`, `OUTFITS`): `sun-hat`, `sunglasses-lei`, `captain-hat`,
  `ranger-hat`, `beanie`, `nightcap`, `aviator-cap`. **Five are not drawn anywhere**: `scrub-cap` (common, 150),
  `bow-tie` (common, 120), `safety-glasses` (uncommon, 300), `white-coat` (uncommon, 450) and `graduation-cap` (rare,
  900). They look like the first draft of the catalog ([the shop note](2026-11-06-redesign-timmy-shop.md) names "a scrub
  cap, a white coat, safety glasses, a bow tie, a beanie, a graduation cap"), from before "the server's names follow
  the art" (Sam, 2026-11-06).
- All five `rotate`, so the daily and weekly shelves would offer them. Bought and put on, the place draws Timmy as
  himself (what he wears that day), and its customizer doesn't list them; the classroom and the leaderboard
  (`widget/hub-art/outfits.js`) can't draw them either.
- `node tools/release/xp.js` now checks the kit against the catalog and names exactly these five as the known gap; a
  sixth undrawn piece fails it. Whichever way this goes, that check's list changes in the same PR.
- The five **rare costumes** (`pirate`, `astronaut`, `detective`, `chef`, `captain-enamel`) are also in the catalog
  and not drawn yet. That one is known: it is the shop note's first Done-when box ("the rare costumes"), part B's art.

## Sam's call (2026-11-12): draw them

Sam chose the first way ([decisions](../decisions.md)): **the five are drawn**, in the shop's art session, with the
five rare costumes, on one contact sheet for his yes. The migration is not changed. The build spec is
[the shop](2026-11-06-redesign-timmy-shop.md)'s "Build spec, session 1: the shop's art" (item 5 there), and that
session ticks this note's boxes and moves it to `done/`. In the bug log this is BUG-090.

## The two ways, as they were asked

1. **Draw them**: five outfits in the kit's style (hat or eyewear, body, how they sit with the loupes), a contact sheet
   on the design page for Sam's yes, then into `place.mjs` and the generated files. No change to the migration.
2. **Take them out of the catalog**: five rows deleted from the pending `migration_v54.sql` (and
   `tools/release/xp.js`'s count of 57 everyday rows becomes 52). That changes the migration, so it needs Sam's OK. It
   has not been applied, so nothing has to be undone.

## Done when

- [x] Sam picks one (2026-11-12: draw them)
- [ ] The five are drawn, approved and built (`node tools/figures/site/build.mjs`)
- [ ] `tools/release/xp.js`'s kit-against-catalog check expects no undrawn outfit, and passes
- [ ] The shop note and [game-server](../reference/game-server.md) say which

## Log

- 2026-11-12 (Claude Code): written from part C; told Sam in the hand-off.
- 2026-11-12 (Claude Code, planning only): Sam: draw them. The spec is the shop's art session.

## Outcome

Related: [Timmy's shop](2026-11-06-redesign-timmy-shop.md) · [Timmy's place](2026-11-06-redesign-timmys-place.md) ·
[game-server](../reference/game-server.md) · [the release](2026-11-06-redesign-release.md)

## Opening prompt

This note has no session of its own: it is done by the shop's art session. Its prompt is the first one at the end of
[the shop's note](2026-11-06-redesign-timmy-shop.md).
