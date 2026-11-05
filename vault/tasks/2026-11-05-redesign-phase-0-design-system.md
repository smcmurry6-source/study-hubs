---
type: task
status: open
hub: site
created: 2026-11-05
requested-by: Sam
due: 
waiting-on:
agent:
pr:
---

# Redesign phase 0: the design system and the art, on a preview page

## Goal

Build the design system the redesign runs on and show it to Sam before any hub changes: the tokens (one ground, one ink, one accent, one radius, the motion tokens), the same preview page in a humanist sans and in a text serif for Sam to pick, the hand-drawn icon set, Timmy and his house as one SVG symbol sheet in one ink style, the hub emblems and masthead scenes, the mastery medals and trophy icons, and the question card in every format with its answered state and rewards (XP float, Timmy's reaction, the streak flame).

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- Everything drawn by the agent in SVG (no generated images, no emoji, no icon library), in `tools/figures/site/` with a build that writes the symbol sheets into the widget.
- The art today: Timmy in `widget/pet.js` (SVG strings, moods, conditions, outfits), the house (`houseSvg`), ranks in `widget/ranks.js`, cards in `widget/rankup.js`.
- Hubs to draw an emblem and masthead for: Occlusion, perio, PCD Implants, Heme & Endo 2, Special Patient Care (and a generic one for a future hub).

## Done when

- [ ] A preview page (`tools/preview/design/`, served by `node tools/preview/serve.js`) that shows every token, the icon set, Timmy's sheet, the emblems and mastheads, the medals, and the question card in each format, in both typefaces, in light and dark
- [ ] The taste inspector (`--app`) passes with 0 FAIL on the preview page at 1440, 768 and 390
- [ ] Sam picked the typeface and approved the art (one AskUserQuestion per group)
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.

## Outcome
