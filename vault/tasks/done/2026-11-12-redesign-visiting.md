---
type: task
status: done
hub: dashboard
created: 2026-11-12
requested-by: Sam
due: before the redesign's release
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/352
---

# Visiting: a row on the boards opens that person's place

## Goal

Sam, 2026-11-10: "Its on by default and you visit from the boards." The server and the renderer are ready and nothing
opens a place yet. This makes a row on the new dashboard's boards open that person's Timmy's place.

## Context

- Session 4 of [phase 4](../2026-11-05-redesign-phase-4-game-layer.md)'s "From here to the release", after
  [Timmy everywhere](../2026-11-12-redesign-ask-timmy.md). "For every session above" there holds here.
- Sam, 2026-11-12 ([decisions](../../decisions.md)): visiting is in the release, as one small session; the new
  dashboard's boards only, the hubs' boards wait.
- The server: [game-server](../../reference/game-server.md), "Visiting". No opt-out (Sam, 2026-11-11). A visitor sees
  only the place, under the leaderboard name; a visitor id never leaves the database
  ([learner-data-privacy](../../rules/learner-data-privacy.md)).
- The place: [Timmy's place](../2026-11-06-redesign-timmys-place.md); `widget/place.js`'s top comment.

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
  [event-taxonomy](../../reference/event-taxonomy.md).

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

- [x] A row on each of the new dashboard's boards, and the stage's top three, opens that person's place
- [x] A visited place shows only what `get_place` gives, under the leaderboard name, and can't be changed
- [x] The tests above added and passing; `node tools/release/run.js` once; the budget unchanged
- [x] Screenshots (phone and laptop, light and dark) sent to Sam
- [x] The About draft in [the release note](../2026-11-06-redesign-release.md) ("From phase 4, visiting": anyone on a
      board can be visited, what a visitor sees and doesn't), the event taxonomy row, the hand-off in phase 4's Log
- [x] Vault written back (`DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-12 (Claude Code, planning only): written with Sam's call that visiting is in the release.
- 2026-11-13 (Claude Code): built. Sam, seeing the visit window while it was built: "this window should be more epic",
  so a visit opens in the leaderboard's theater look ([decisions](../../decisions.md)). Contact sheets (laptop and phone,
  light and dark) and a recording sent. Bugs: BUG-112 to BUG-115 ([the bug log](../../release/bug-log.md)); BUG-112 is
  `widget/ranks.js`'s and waits for the release.
- 2026-11-13: [#352](https://github.com/smcmurry6-source/study-hubs/pull/352) merged as `86b81a3` (Sam: "merge when ready",
  "no preview needed"). Then Sam: "build the random visit and next/back", the rest of round 3's visiting: built in
  [#PR_TOUR](https://github.com/smcmurry6-source/study-hubs/pull/PR_TOUR) (the tour, in the Outcome).

## Outcome

**Built, not live until the redesign's release** (2026-11-13). What changed:

- **The boards** (`widget/dash.js`, `widget/dash.css`): on the game layer every row of Ranks and Study streaks with a
  visit key (24 hex characters; anything else isn't one) has its name as a button, `data-dash="visit"`, named "Visit
  <name>'s place" (your own: "<name> (you): open your place"); its `::after` covers the whole row, so a tap anywhere on it
  visits while the rank and number still read as text; the medals stay their own button on top. The key stays on the row
  (`data-visit`), never on the button, so a click count never holds it. Each of the stage's top three is its name's button
  under the stage, and a tap on a winner's Timmy on the stage is a tap on it. White focus ring (your own row is ringed in
  gold). Without the game layer there's no key and nothing is a button.
- **A tap**: `getPlace()` asks `get_place` once a page for a person (the stage's outfits, `loadFits`, share the answer; a
  failed call isn't kept), keeps only what a place shows (the slots as strings, the rank as numbers, the name and medals as
  text), fetches the place's renderer if it isn't here yet (`placeLoad()` now resolves once it's set up), and opens
  `shPlace.open({ place, onClose })`; closing gives focus back to the row even if the board was drawn again meanwhile. A
  null place or a failed call puts one plain line on the row ("That place couldn't be opened just now."), kept through a
  repaint; nothing else changes. Your own row opens your own place.
- **The visit window** (`widget/place.js`, `widget/place.css`; Sam's "more epic"): a visit opens with `is-visit`: the
  leaderboard's theater, dark in both themes, "Welcome to" over the name in gold, chasing marquee bulbs, the stage in a gold
  frame under two spotlights, and a guest card
  (`guestCard()`): their rank drawn at 112 px (the journey's object past the Handpiece), its name in gold, each hub medal
  with its hub's name, "See the medals". Your own place is unchanged. A visit counts `place:visit`, never whose. The bowling
  lane plays its clips at a visited place too (over the stage).
- **The trip through the clouds** (Sam: "there should be a clouds animation when switching to another persons place",
  then "i already approved a cloud animation before"): a visit plays the trip Sam approved on the design page in round 3,
  `clouds()` in `tools/preview/design/design.js`, ported to `widget/place.js` (`tripIn`, `tripOut`) and `place.css` with
  its shapes and timings. Soft separate clouds pile up over the whole screen with "Off to <name>'s place" and their rank,
  the window shows behind them at 800 ms, and they scatter from 1.4 s (or once the place is drawn), then a burst goes up
  over their home. Until the clouds cover the page, the window and its backdrop are hidden (`is-trip`). The clouds are
  fixed inside the dialog, so they cover the screen from the top layer, and are `aria-hidden`. None with reduced motion;
  no whoosh (the place has no sounds). The smoke test checks the line is text and that all of it is gone 2.6 s in.
- **The tour** (after #352; Sam: "build the random visit and next/back", from round 3's design page). **Visit someone
  random** (`#visitRand`, `data-dash="visit-random"`, the design page's die button) sits under the board when it has
  someone to visit, and picks one of its rows with a key, never your own. A visit opened from a board carries the
  board (`nav`: the rows with keys but yours, as names and ranks; `load(i)` in `widget/dash.js` asks `get_place` for the
  i-th, sharing the page's answers). In the visit window, round arrows on either side of the stage go to the previous
  and next person (wrapping round; "Previous place: <name>", "Next place: <name>"), **Back to mine** sits by the close
  button (its icon alone on a phone, its name kept), and the guest card says "Place 3 of 9 on the board, Next: <name>".
  Each hop goes through the clouds: they roll in over the place you're leaving, and once they cover the screen and the
  next place is here, this window gives way to the next one under the same clouds (`covered`: the same clouds for the
  same screen), which then scatter. A place that can't be read leaves you where you are with "That place couldn't be
  opened just now." Pressing Next again keeps going (focus lands on it). Closing gives focus to the row of the place
  you ended at, your own row after "Back to mine", or the random button after a random visit. Each place counts
  `place:visit`. With reduced motion there are no clouds. Nothing on the server.
- **The preview's made-up data** (`tools/preview/runtime/preview.js`): each classmate has a place of their own
  (`FAKE_PLACES`: different homes, scenes, yards, outfits, seasonal sets, rank pieces their rank has reached); Fixture
  Fluoride is a ModuPro (`fakeXp`), the same rank on every board and at the place; three have one hub medal each
  (`FAKE_FLAIR`); Dummy Dentin's can't be read, on purpose; your own key opens your own place; your own row stays on the
  rank board below the top ten, as on the server.
- **Tests**: the smoke test's "visiting" block (rows as buttons with only `data-dash="visit"`, a markup name drawn as
  text on the row and in the title, the visit's title, no Customize or HP, the theater look and the guest card,
  `get_place` asked once, `place:visit` counted with nothing about whose, focus back, the plain line, the streaks board,
  a key that isn't one, and no buttons without the game layer); `a11y.js`'s "dashboard/next · boards", "· visited place"
  and "· visited place (dark)" (no issues; in the baseline at zero). Both checked to fail on a name drawn as markup and on
  `get_place` asked twice. `rls.js` passes unchanged (a place and the boards give a key, never an id).
- **Left for later**, written down: the hubs' boards ([the release](../2026-11-06-redesign-release.md), "From phase 4,
  visiting", with its About draft and BUG-112).

Related: [Timmy's place](../2026-11-06-redesign-timmys-place.md) · [game-server](../../reference/game-server.md) ·
[phase 3](../2026-11-05-redesign-phase-3-dashboard.md) · [phase 4](../2026-11-05-redesign-phase-4-game-layer.md) ·
[learner-data-privacy](../../rules/learner-data-privacy.md)

## Opening prompt

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries, then do the task in
> `vault/tasks/2026-11-12-redesign-visiting.md`. Grep the big files (`widget/dash.js`, `widget/place.js`), never read
> them whole. No subagents. `migration_v54.sql` is not applied and is not to be changed: if the client disagrees with
> it, tell me. A visitor id never reaches the page. No hosted preview: screenshots from a scripted browser on the
> preview's made-up data. Open a draft PR with the test report; I'll say "merge".
