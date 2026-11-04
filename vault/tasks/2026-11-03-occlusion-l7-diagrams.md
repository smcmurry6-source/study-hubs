---
type: task
status: open
hub: occlusion
created: 2026-11-03
requested-by: Sam
due: 2026-11-19
waiting-on: 
agent: 
pr: 
---

# Build the five approved Occlusion L7 diagrams

## Goal

Sam approved all five diagram candidates from L7 (Malocclusion and Dysfunction)'s diagram review on 2026-11-03; they
were left for a follow-up PR. Build them before the final (Thu Nov 19), and the sooner the better
([ship-it-now](../rules/ship-it-now.md)).

1. The tolerance model (the functional disturbance model in L7's notes).
2. Orthopedic vs occlusal stability.
3. Splint designs.
4. The rule of thirds.
5. An erosion pattern map.

## Context

- Hub note: [occlusion](../hubs/occlusion.md)
- Rules: [diagrams-anima](../rules/diagrams-anima.md), [diagram-review](../rules/diagram-review.md) (already done for
  these five: don't ask again), [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md) (figures go in a
  `data-sh-noread` wrapper, never into READINGS)
- Change log: "2026-11-03 (Occlusion L7: Malocclusion and Dysfunction" in `DEPLOY_NOTES.md`
- Draw from L7's own notes (`malocclusion` in the hub's READINGS) and check against the `mo-*` questions. Where the
  slides and the recording differ (whether erosion facets match; how long a splint stops bruxism), the notes give both:
  the figure must not pick a side.
- Build in `tools/figures/occlusion/anima/` like the L6 figures (`mounterr.mjs`, `hingearc.mjs`); place with
  `FIG_PLACE.malocclusion` in `tools/figures/occlusion/od.js` (it lives in the generated kit block) and a Review `figs`
  section in L7's tab; rebuild with `node tools/figures/occlusion/build.mjs`.

## Done when

- [ ] Five figures built, placed in the L7 notes (both reading levels) and in Review
- [ ] `node tools/figures/occlusion/build.mjs --check` passes; anima's own checks pass
- [ ] Screenshots at 390 px wide in light and dark in the PR, for Sam's look before merge
- [ ] About page "Diagrams" entry updated ([about-page](../rules/about-page.md))
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [ ] Hub note and this note's Outcome written; "Recent major changes" line added

## Log

- 2026-11-03: written from the L7 change-log entry (Sam approved all five that day).

## Outcome

