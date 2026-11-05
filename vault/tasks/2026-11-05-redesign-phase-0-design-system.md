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

## Prep done on 2026-11-05 (this session stopped here)

- **Typeface candidates, downloaded and committed** in `assets/fonts/` (latin subsets of the Google Fonts variable files,
  OFL): `nunito-sans-normal.woff2` + `-italic` (the humanist sans, weights 300-900, opsz 6-12) and
  `fraunces-normal.woff2` + `-italic` (the text serif, weights 100-900, opsz 9-144). The preview page shows both; Sam picks.
- **Hub tints to use** (one per live hub, distinct hues, Occlusion and perio kept close to what students know):
  Occlusion blue `#2747a3`, perio rose `#b4466f`, PCD Implants steel teal `#2f6f84`, Heme & Endo red `#a83232`, Special
  Patient Care green `#2e7d4f`. Ink: Timmy's outline color `#3B2E3A` (`OUT` in `widget/pet.js`) is the drawing ink for every
  piece of art, so the icons, emblems and mastheads match him.
- **Timmy and the house stay as drawn** (`shPet.art(state, px)` and `shPet.house()` in `widget/pet.js`; Sam wants them
  preserved); the preview page renders them through those functions to show how they sit in the new system. The handpiece
  medallions come from `shRanks.art(tier, px)` in `widget/ranks.js`.
- **File layout for the art** (none written yet): `tools/figures/site/icons.mjs` (about 30 icons, 24-box, 2px ink strokes,
  round caps), `emblems.mjs` (one per live hub plus a generic), `mastheads.mjs` (one scene per live hub, about 600 x 200),
  `medals.mjs` (bronze, silver, gold, crown mastery medals and the trophy icons), `build.mjs` writing them as a JS object
  (`tools/preview/design/art.js`) the preview page inlines, and later as symbol sheets into the widget.
- **The preview page**: `tools/preview/design/index.html`. `tools/preview/serve.js` serves only the site's own folders
  (`SITE_ENTRIES` in `tools/preview/transform.js`), so serve the page with a plain static server from the repo root
  (`python3 -m http.server 4174`) and inspect it with
  `CHROME_PATH=tools/chrome-no-sandbox.sh node .claude/skills/taste-skill/scripts/inspect.mjs http://127.0.0.1:4174/tools/preview/design/ --app`.
- **Tokens**: start from the taste skill's `assets/app.css` defaults and its motion tokens (`references/motion.md` §4);
  radius soft (16 / 14 / full pills, the "playful" pair); one accent for the site plus the hub tints; dark mode true
  neutral; no gradients in the UI (Timmy's own shading is art and stays).
- The "before" inspector reports and screenshots are in `.taste-skill/before/` locally (gitignored); re-run them from
  the audit note's section 2 if a comparison is needed.

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
