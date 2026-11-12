---
type: task
status: in-progress
hub: widget
created: 2026-11-05
requested-by: Sam
due: 
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/330
---

# Redesign phase 4: the game layer's presentation

## Goal

Put the ranks, trophies and celebrations on the design system without changing their model: drawn mastery medals and trophy icons in place of emoji and the ??? grid (secret trophies as a silhouette with a one-line riddle), the rank name in flat metal, the tier cutscene and the level, trophy and mock cards on the site's type with their motion kept, one "you" panel shared by the hub and the dashboard, the arcade lobby redrawn by hand with one game up front.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- `widget/ranks.js`, `widget/rankup.js`, `widget/games.js`/`games.css`, each hub's skin, `widget/eggs.js` (pop-ups stay as they are: Sam).
- Timmy's HP model stays as it is (Sam, 2026-11-05), except that the shop's snacks and floss now restore HP (Sam, 2026-11-06).
- **Four more parts, agreed 2026-11-06 (Sam)**, each its own PR and art review, on top of the presentation work above:
  - **A**: [three journeys, more XP and the Dark Matter unlock](2026-11-06-redesign-progression-journeys.md) (the client side);
  - **B**: [Timmy's shop](2026-11-06-redesign-timmy-shop.md) (Shiny Gold Crowns, the rotating shop, rarity, snacks and floss, XP boosts,
    rare costumes);
  - **C**: [Timmy's place](2026-11-06-redesign-timmys-place.md) (the house card redrawn as a scene you build);
  - **D**: [the bowling egg](2026-11-06-redesign-bowling-egg.md).
  - **E** (Sam, 2026-11-12): [Ask Timmy](2026-11-12-redesign-ask-timmy.md), Timmy as every hub's study assistant. Its
    part 4, **everyone has Timmy** ("adopting timmy is no longer an option"), changes `widget/pet.js`: do it with parts B
    and C, or right after them, so it doesn't collide with their work on Timmy.
  Their server side is [phase 5](2026-11-05-redesign-phase-5-backend.md), part 3. This changes "without changing their
  model" in the goal: XP rules, the ladder, the house and HP change as those notes say.
- **Released with the rest** (Sam, 2026-11-06, [decisions](../decisions.md)): these widget files are shared with the
  live hubs, so the new look goes in files or styles only the new versions load (see
  [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md)), and the live hubs keep today's cards until
  [the release](2026-11-06-redesign-release.md).

## Done when

- [x] First, before parts A-D grow it: `widget/hub.js` split into its core and the parts each session changes (the
  bank and study toggle, rewards and cards, Timmy and his place), loaded as now, with no behavior change and the
  smoke, a11y and perf suites passing ([run-a-redesign-session](../how-to/run-a-redesign-session.md), step 4) ([#330](https://github.com/smcmurry6-source/study-hubs/pull/330), 2026-11-12)
- [ ] Every card and the cutscene reviewed in a recording on the preview, reduced motion too
- [ ] Part A, B, C and D done as their notes say (each note's "Done when"), and part E's "everyone has Timmy"
- [ ] The arcade lobby of each live hub redrawn; game mechanics unchanged
- [ ] The About page's trophy and rank entries updated
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look, then Sam's "merge"
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: parts A-D added (Sam's calls on the journeys, the shop, Timmy's place and the bowling egg).
- 2026-11-06: part C's art drawn on the design page for Sam's look ([Timmy's place](2026-11-06-redesign-timmys-place.md), its log).
- 2026-11-12 (Claude Code, **the split; hand-off**). `widget/hub.js` (2,064 lines, 188 KB, one closure) is now four
  files, in [#330](https://github.com/smcmurry6-source/study-hubs/pull/330). Nothing students see changes, migration_v54 is still pending, and no other step of this note is started.
  - **The files**, loaded by each new hub's page as four deferred scripts in this order:
    - `widget/hub-rewards.js` (17 KB): the one answer path (`recordAnswer`, `xpFor`, the daily goal, the streak,
      `achievements`), the rank (`RANK`, `rankName`, `rankXp`, `rankArt`, the `sh:rank-profile` listener), the bar's
      meters (`paintMeters`), `reward` with the flying XP, the ring of teeth, the Today panel, the session recap.
    - `widget/hub-timmy.js` (2 KB): `say`, `petHp`, `timmyReact` (his cheer or flinch on the bar, taken out of
      `reward`) and `petFromBadges` (loading him when he was adopted on another device, taken out of the rank
      listener). Small on purpose: it is where parts B and C put the shop and Timmy's place.
    - `widget/hub-bank.js` (62 KB): the question card (`card`, `wireCard`, `result`, `whyHTML`, `classPicks`), the
      bank with its panel and presets (`drawQuestions`, `filtered`, `SETS`, `fill`, `page`) and the mock.
    - `widget/hub.js` (116 KB), the core, last: helpers, drawings, state, content, the frame, routing, Home, Notes,
      Follow along, More (Timmy Time's page stays here: it is the podcast's player), the shared widget's hooks, boot.
  - **How they share names** (written at the top and the end of `hub.js`, and at the top of each part): a part
    registers a function in `window.SH_HUB_PARTS`; the core runs the three, in the order rewards, Timmy, bank, just
    before it boots, and hands each one `HX`. A part takes the core's helpers and lookups under their own names in the
    `var` list at its top (`esc`, `$`, `STATE`, `QBY`); what the core replaces after the page loads it reads as
    `HX.CORE`, `HX.QS`, `HX.LECS`, `HX.IDX`, `HX.FIG`, `HX.view`; what a part has for the other files it puts on `HX`
    at its end, and they call it as `HX.card(...)`. To use one more of the core's names in a part: add it to the `HX`
    object in `hub.js` (most helpers are already there) and to the part's list. A name used but not taken is an error
    only when that line runs, so click the new thing in the smoke test.
  - **Every place the engine is listed**: the three pages' script tags, `tools/ci/syntax.js`, the smoke test's `ENGINE`
    (it fails a page that doesn't load the four, deferred, in order), the service worker's list in
    [the release note](2026-11-06-redesign-release.md) ("The engine's files"), [repo-map](../reference/repo-map.md). The
    preview copies `widget/` whole, so it needed nothing.
  - **Request budgets**: three more requests a page. Occlusion 20 of 21, Heme & Endo Exam 2 20 of 22, Perio 18 of 21:
    under, not raised. **A new file that loads with the page doesn't fit on Occlusion more than once**: load anything
    new when it is first used (`loadScript`), or put it in the part it belongs to.
  - **Checked**: a parser moved the code and confirmed that every name in the four files resolves, each of the 119
    shared names is defined and no function was lost or doubled. The same scripted visit (both test accounts, phone
    and laptop with reduced motion, every view, every page in More, every question format, the sets, the mock, the
    widget's hooks, and Timmy's cheer, "Goal met!" and loading) on `main`'s copy and on the split, on the preview's
    made-up data with the clock and the shuffles fixed: identical markup, saved state and events at all 368 steps,
    once what differs between two runs of `main` itself was left out (the preview's own label, random ids, animated
    figures' frames, the made-up live count, Timmy's idle chatter). One earlier run of the split drew the rank badge
    one time fewer in one of its six visits, which changes an internal id and nothing shown; two repeats matched
    `main` exactly, so it reads as load timing in the shared widget, not the split. The release suites: `node
    tools/release/run.js` once on the finished code, all 14 passing (accessibility run by itself with `AXE_CORE_PATH`,
    since this machine has no axe-core): the smoke test on every hub, accessibility at 37 screens with nothing new,
    the performance budgets, the device matrix, the preview-safety and database suites.
  - **The next session starts from**: this entry and the part it works in. **Part A**
    ([journeys](2026-11-06-redesign-progression-journeys.md)): `widget/hub-rewards.js` (`xpFor`, `recordAnswer`, the
    rank functions, `paintMeters`, `reward`, the recap), with `widget/ranks.js`, `rankup.js` and `pet.js` as its note
    says. **Parts B and C with the bowling egg** ([shop](2026-11-06-redesign-timmy-shop.md),
    [place](2026-11-06-redesign-timmys-place.md), [egg](2026-11-06-redesign-bowling-egg.md)): `widget/hub-timmy.js` for
    what the engine shows of Timmy, `widget/pet.js` for the renderer; a new page in More also needs its row in the
    core's `MORE` list and its entry in `renderMore`'s map (call the part's function as `HX.<name>`).
    [Learn and Flashcards](2026-11-06-redesign-learn-and-flashcards.md): `widget/hub-bank.js`.

## Outcome
