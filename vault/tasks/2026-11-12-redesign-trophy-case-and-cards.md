---
type: task
status: open
hub: widget
created: 2026-11-12
requested-by: Sam
due: before the redesign's release
waiting-on: 
agent: 
pr: 
---

# The trophy case and the celebration cards, on the design system

## Goal

[Phase 4](2026-11-05-redesign-phase-4-game-layer.md)'s original goal, never built: the redesign's pages still open
today's trophy panel (an emoji grid with ??? for secrets) and show today's rank-up, level, trophy and mock cards.
The trophies and their silhouettes were drawn in phase 0. This puts the trophy case and the cards on the design
system, on the redesign's pages only: drawn trophies in place of emoji and ???, a secret trophy as its silhouette
with a one-line riddle, the rank name in flat metal, and the tier cutscene and the level, trophy and mock cards on
the site's type with their motion kept.

## Context

- Session 6 of phase 4's "From here to the release", after [the bowling egg](2026-11-06-redesign-bowling-egg.md), so
  the case lists the three journey trophies and the Bowling trophy once. "For every session above" there holds here.
- Sam, 2026-11-12 ([decisions](../decisions.md)): build it before the release. Earlier calls that stand: the eggs'
  pop-ups stay as they are; "the mastery medals that pop up on the screen and the ones that are visible in timmys
  board need to be the same" (2026-11-10); the scenes are silent (no sound setting in the redesign).
- The plan: [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4; the taste skill in full
  (`.claude/skills/taste-skill/`, Sam, 2026-11-04); the design page, `tools/preview/design/`.
- Where things are today:
  - The case's list: `TROPHIES` in `widget/ranks.js` (24 rows: `k`, `n`, `d`, `ic` an icon path, `secret`, `clue`
    the riddle). The panel that shows it is the shared widget's Stats panel; a new hub's More, "Stats and trophies"
    (`moreStats` in `widget/hub.js`) draws a few numbers and a button that clicks the old panel open
    (`#shstat-stats-pill`).
  - The cards: `widget/rankup.js` (`window.shRankUp`: `tier`, `level`, `trophy`, `mock`, `scene`; its styles are
    built in `css()`; `trophyArt(ic, px, key)` draws a trophy's icon). `widget/ranks.js` decides when
    (`trackTrophies`, `trophyCard`, `masteryCard`, `playRankUp`).
  - The drawings: `tools/figures/site/medals.mjs` (`TROPHIES`, `silhouette(key)`, the medals), built today only into
    the design page; the three journey trophies are in `widget/hub-art/journeys.js` (`SH_JOURNEY_ART.trophies`).
  - Shares: `get_trophy_stats_v2` (the 24 kinds and `journey-0` to `journey-2`).

## Build spec

**Sam's look comes first.** Before the build: one contact sheet, light and dark, phone and laptop widths, of the
case (earned, not earned, secret) and of each card's last frame (a new rank, a new level, a trophy, a mastery medal,
a mock result), drawn as static pages from the real drawings. Sam's yes, then build.

**Files to touch**:
- `tools/figures/site/build.mjs`: build the trophies and silhouettes into a new `widget/hub-art/trophies.js`
  (`window.SH_TROPHY_ART`), fetched on first use.
- New: `widget/trophies.js` (+ its styles): the case as something a page can mount
  (`window.shTrophies.mount(el, { profile, stats })`), fetched on first use.
- `widget/hub.js`: `moreStats` mounts the case in More, "Stats and trophies"; the leaderboards stay behind today's
  button (the agent's cut, to keep this one session; Sam can widen it).
- `widget/dash.js`: the "you" card's trophies open the same case.
- `widget/ranks.js`: the Bowling trophy's row, and the three journey trophies in the list, **only for a page on
  the redesign** (a v2 profile, or the engine): a live page's case must still say 24.
- `widget/rankup.js`: the cards' new look **only on the redesign's pages**. The safest way: the new styles go in a
  stylesheet only the new pages load (`widget/hub.css`, `widget/dash.css`, or a file fetched with the first card),
  keyed on a class the new pages set on `<html>`, and `trophyArt` draws from `SH_TROPHY_ART` when it is there. The
  cards' timing, order, queue (`enqueue`), skip and reduced-motion stills don't change.
- The tests, the vault.

**Not to touch**: the migrations; what earns a trophy or a rank; `widget/eggs.js`'s pop-ups; `widget/v3.js`'s Stats
panel (the live hubs use it); the journeys' scenes (`widget/journeys.js`).

**What it shows**:
- **28 trophies, 15 of them secret**: today's 24, `journey-0`, `journey-1`, `journey-2` (Handpiece, ModuPro and
  Loupes finished) and Bowling (secret). An earned trophy: its drawing, name, what it was for, and the share of the
  class that has it. Not earned: the drawing dimmed, with what earns it. A secret one not earned: its silhouette and
  its riddle (`clue`), never its name. Bowling is earned on the device (`sh_bowl_trophy`,
  [the bowling egg](2026-11-06-redesign-bowling-egg.md)) and shows no share until the server knows the kind.
- **The rank** at the top of the case: the medallion (`HX.rankArt`, `shRanks.artOf`), the rank's name set in flat
  metal, the level, the XP to the next step, and the road ahead (`shJourneys.road(profile)`, as More, Stats has it).
- **The cards**: the site's typeface and tokens, the drawn trophy or medal, one line of what happened and one of
  what's next. Motion as today; with reduced motion one still card.

**The preview's made-up data**: `high-xp` has most trophies and all three kinds of secret state; `new` has none;
`?xp=124999` and one answer still plays the hand-off after a card. `get_trophy_stats_v2` is answered with made-up
shares, each over at least 5 people.

**Budgets**: `widget/trophies.js` and `widget/hub-art/trophies.js` load when the case is first opened or a trophy
card first shows, never with a page. Report `hub-art/trophies.js`'s size.

**Tests to add**:
- `node tools/ci/smoke.js`: on a new hub, More, "Stats and trophies" shows 28 trophies, a secret one as a silhouette
  with no name in the page, an earned one with its drawing; neither file loaded with the page; a trophy earned in
  the test shows the new card, and it can be skipped. On the new dashboard: the case opens from the "you" card. On a
  live hub: the case says 24 and the cards look as today (compare the card's markup and class list before and after).
- `tools/release/a11y.js`: the case (every trophy has a name a screen reader gets, a secret one is announced as
  secret, never by name) and one card, added to the baseline with no issues.

**Out of scope**: new trophies beyond the four; the leaderboards' look; sound; the old pages; the About page (draft
in [the release note](2026-11-06-redesign-release.md): its "From phase 4, part A" draft says 27 trophies and becomes
28 with Bowling, 15 secret).

## Done when

- [ ] Sam's yes to the contact sheet, then to a recording of each card and the cutscene from a scripted browser on
      made-up data, reduced motion too
- [ ] The case on the design system in a new hub's More and on the new dashboard, with 28 trophies, 15 secret
- [ ] The cards on the site's type on the redesign's pages; a live page's case and cards unchanged
- [ ] The tests above added and passing; `node tools/release/run.js` once; budgets unchanged
- [ ] The release note's About drafts say 28 and 15; its "journey trophies in the trophy case" box ticked
- [ ] Vault written back (decisions, `DEPLOY_NOTES.md`, the hand-off in phase 4's Log, this note's Outcome)

## Log

- 2026-11-12 (Claude Code, planning only): written when the planning found this part of phase 4 unbuilt; Sam:
  build it before the release.

## Outcome

Related: [phase 4](2026-11-05-redesign-phase-4-game-layer.md) · [the journeys](2026-11-06-redesign-progression-journeys.md) ·
[the bowling egg](2026-11-06-redesign-bowling-egg.md) · [the release](2026-11-06-redesign-release.md) ·
[about-page](../rules/about-page.md)

## Opening prompt

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries, then do the task in
> `vault/tasks/2026-11-12-redesign-trophy-case-and-cards.md`. Use the taste skill. Grep the big files
> (`widget/ranks.js`, `widget/rankup.js`, `widget/hub.js`), never read them whole. No subagents. The live pages must
> look and behave exactly as today. Neither pending migration is applied or changed. Send me the contact sheet first
> and wait for my yes before building; then a recording of the cards. No hosted preview. Open a draft PR with the
> test report; I'll say "merge".
