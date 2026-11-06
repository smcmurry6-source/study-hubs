---
type: task
status: open
hub: widget
created: 2026-11-05
requested-by: Sam
due: 
waiting-on:
agent:
pr:
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
  Their server side is [phase 5](2026-11-05-redesign-phase-5-backend.md), part 3. This changes "without changing their
  model" in the goal: XP rules, the ladder, the house and HP change as those notes say.
- **Released with the rest** (Sam, 2026-11-06, [decisions](../decisions.md)): these widget files are shared with the
  live hubs, so the new look goes in files or styles only the new versions load (see
  [phase 1](done/2026-11-05-redesign-phase-1-hub-engine.md)), and the live hubs keep today's cards until
  [the release](2026-11-06-redesign-release.md).

## Done when

- [ ] Every card and the cutscene reviewed in a recording on the preview, reduced motion too
- [ ] Part A, B, C and D done as their notes say (each note's "Done when")
- [ ] The arcade lobby of each live hub redrawn; game mechanics unchanged
- [ ] The About page's trophy and rank entries updated
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-06: parts A-D added (Sam's calls on the journeys, the shop, Timmy's place and the bowling egg).
- 2026-11-06: part C's art drawn on the design page for Sam's look ([Timmy's place](2026-11-06-redesign-timmys-place.md), its log).
- 2026-11-06: part D's eight clips drawn and animated on the design page for Sam's look ([the bowling egg](2026-11-06-redesign-bowling-egg.md), its log).

## Outcome
