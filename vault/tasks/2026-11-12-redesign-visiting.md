---
type: task
status: open
hub: dashboard
created: 2026-11-12
requested-by: Sam
due: before the redesign's release
waiting-on: 
agent: 
pr: 
---

# Visiting: a row on the boards opens that person's place

## Goal

Sam, 2026-11-10: "Its on by default and you visit from the boards." The server and the renderer are ready and nothing
opens a place yet. This makes a row on the new dashboard's boards open that person's Timmy's place.

## Context

- Session 4 of [phase 4](2026-11-05-redesign-phase-4-game-layer.md)'s "From here to the release", after
  [Timmy everywhere](2026-11-12-redesign-ask-timmy.md). "For every session above" there holds here.
- Sam, 2026-11-12 ([decisions](../decisions.md)): visiting is in the release, as one small session; the new
  dashboard's boards only, the hubs' boards wait.
- The server: [game-server](../reference/game-server.md), "Visiting". No opt-out (Sam, 2026-11-11). A visitor sees
  only the place, under the leaderboard name; a visitor id never leaves the database
  ([learner-data-privacy](../rules/learner-data-privacy.md)).
- The place: [Timmy's place](2026-11-06-redesign-timmys-place.md); `widget/place.js`'s top comment.

## Build spec

**Files to touch**: `widget/dash.js` and `widget/dash.css` (the rows and the stage), `widget/place.js` only if the
visiting view needs a line it doesn't have (below), `tools/preview/runtime/preview.js` (its `get_place` case), the
tests, the vault.

**Not to touch**: `migration_v54.sql`; `widget/v3.js` (the hubs' boards are the shared widget's panel, used by the
live hubs: they wait); `widget/pet.js`; the engine.

**What it calls**:
- A board row already carries its key: the `_v2` boards return `visit` (24 hex characters) on every row, and
  `widget/dash.js` writes it on the row as `data-visit` (grep `data-visit`: the list rows and the stage's steps).
  Without the game layer there is no key and nothing to tap.
- `get_place({ p_key })` → `{ name, equipped: { <slot>: <item id> }, rank: { journey, tier, level }, flair }`, or
  null for a key that opens nothing. Never an id, XP as a number, HP, the streak, the wallet or any date.
  `loadFits` in `dash.js` already calls it for the top three's outfits: use what it fetched, don't ask twice.
- `shPlace.open({ place })` with that object (`widget/place.js`: `theirs(p)` makes it a visit: the name in the
  title, Timmy always drawn well, no HP line, no customizer; `canChange()` is false). The dashboard already fetches
  `place.js` on first use (`placeStart`, `placeLoad`): a tap on a row is one more first use.

**How it behaves**:
- Every board row with a key, and each of the stage's top three, is a button named for what it does ("Visit
  <leaderboard name>'s place"); your own row opens your own place as the card does. The button carries one fixed name for the click count (grep how
  `widget/clicks.js` names a button, and what `dash.js`'s other buttons carry), so the count never holds a person's name.
- A tap fetches the place, then opens the full view: "<name>'s place" in the title, their home, scene, yard, rank
  statue, medal board and outfit, the tap surprises working, no Customize. Closing it returns to the board, focus on
  the row.
- A key that opens nothing (null) or a call that fails: one plain line on the row ("That place couldn't be opened
  just now"), nothing else changes.
- The name is drawn as text, never as markup (it is what a classmate typed).
- Tracking: `place:visit` (`window.shTrack`), nothing about whose; its row in
  [event-taxonomy](../reference/event-taxonomy.md).

**The preview's made-up data**: `get_place` is already answered for the made-up classmates (one of them can't be
read, on purpose). Give them different homes, scenes and outfits from the kit's ids, one in the ModuPro journey, so a
visit looks like someone else's place.

**Budgets**: the new dashboard stays at its 30 requests: nothing here loads with the page; `get_place` is called on
a tap (and by `loadFits`, as today).

**Tests to add**:
- `node tools/ci/smoke.js`, the new dashboard on the game layer: a row with a key is a button with a name; a tap
  opens the dialog with that classmate's name as text and no Customize; a name with markup in it is drawn as text;
  the classmate whose place can't be read gives the plain line; without the game layer no row is a button; nothing of
  the place loaded with the page.
- `tools/release/a11y.js`: the dashboard's boards with the rows as buttons, and a visited place, with no new issue.
- `node tools/release/rls.js` already checks that a place and the boards give a key and never an id: it must still pass.

**Out of scope**: visiting from a hub's boards, from the classroom or from the idea board; anything a visitor could
do at a place besides look and tap; a list of who visited; an opt-out (Sam: none).

## Done when

- [ ] A row on each of the new dashboard's boards, and the stage's top three, opens that person's place
- [ ] A visited place shows only what `get_place` gives, under the leaderboard name, and can't be changed
- [ ] The tests above added and passing; `node tools/release/run.js` once; the budget unchanged
- [ ] Screenshots (phone and laptop, light and dark) sent to Sam
- [ ] The About draft in [the release note](2026-11-06-redesign-release.md) ("From phase 4, visiting": anyone on a
      board can be visited, what a visitor sees and doesn't), the event taxonomy row, the hand-off in phase 4's Log
- [ ] Vault written back (`DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-12 (Claude Code, planning only): written with Sam's call that visiting is in the release.

## Outcome

Related: [Timmy's place](2026-11-06-redesign-timmys-place.md) · [game-server](../reference/game-server.md) ·
[phase 3](2026-11-05-redesign-phase-3-dashboard.md) · [phase 4](2026-11-05-redesign-phase-4-game-layer.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md)

## Opening prompt

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries, then do the task in
> `vault/tasks/2026-11-12-redesign-visiting.md`. Grep the big files (`widget/dash.js`, `widget/place.js`), never read
> them whole. No subagents. `migration_v54.sql` is not applied and is not to be changed: if the client disagrees with
> it, tell me. A visitor id never reaches the page. No hosted preview: screenshots from a scripted browser on the
> preview's made-up data. Open a draft PR with the test report; I'll say "merge".
