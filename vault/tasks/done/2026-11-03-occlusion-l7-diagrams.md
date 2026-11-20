---
type: task
status: done
hub: occlusion
created: 2026-11-03
requested-by: Sam
due: 2026-11-19
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/220
---

# Build the five approved Occlusion L7 diagrams

## Goal

Sam approved all five diagram candidates from L7 (Malocclusion and Dysfunction)'s diagram review on 2026-11-03; they
were left for a follow-up PR. Build them before the final (Thu Nov 19), and the sooner the better
([ship-it-now](../../rules/ship-it-now.md)).

1. The tolerance model (the functional disturbance model in L7's notes).
2. Orthopedic vs occlusal stability.
3. Splint designs.
4. The rule of thirds.
5. An erosion pattern map.

## Context

- Hub note: [occlusion](../../hubs/occlusion.md)
- Rules: [diagrams-anima](../../rules/diagrams-anima.md), [diagram-review](../../rules/diagram-review.md) (already done for
  these five: don't ask again), [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md) (figures go in a
  `data-sh-noread` wrapper, never into READINGS)
- Change log: "2026-11-03 (Occlusion L7: Malocclusion and Dysfunction" in `DEPLOY_NOTES.md`
- Draw from L7's own notes (`malocclusion` in the hub's READINGS) and check against the `mo-*` questions. Where the
  slides and the recording differ (whether erosion facets match; how long a splint stops bruxism), the notes give both:
  the figure must not pick a side.
- Build in `tools/figures/occlusion/anima/` like the L6 figures (`mounterr.mjs`, `hingearc.mjs`); place with
  `FIG_PLACE.malocclusion` in `tools/figures/occlusion/od.js` (it lives in the generated kit block) and a Review `figs`
  section in L7's tab; rebuild with `node tools/figures/occlusion/build.mjs`.

## Done when

- [x] Five figures built, placed in the L7 notes (both reading levels) and in Review
- [x] `node tools/figures/occlusion/build.mjs --check` passes; anima's own checks pass
- [x] Screenshots at 390 px wide in light and dark in the PR, for Sam's look before merge
- [x] About page "Diagrams" entry updated ([about-page](../../rules/about-page.md))
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Hub note and this note's Outcome written; "Recent major changes" line added

## Log

- 2026-11-03: written from the L7 change-log entry (Sam approved all five that day).
- 2026-11-04: built, placed and checked by a Claude Code session; [PR #220](https://github.com/smcmurry6-source/study-hubs/pull/220) opened for Sam's look.

## Outcome

All five are built and placed, in the L7 notes at both reading levels (after the paragraph each explains, in a
`data-sh-noread` wrapper; READINGS and the narration are unchanged) and in L7's Review tab next to the matching table:

- `tolerance` (after "How a functional disturbance develops" / "How a problem starts"): normal function plus events
  (local: high crown, burned palate, bruxism, deep pain; systemic: stress, the flu) stacked against a movable tolerance
  line; above it the slides' signs a-g light up on a side view with the masseter and temporalis; "Monday, then Tuesday"
  replays the same events against a lower tolerance. A labeled metaphor: block heights are equal by choice, no numbers.
  Two SVGs, so it stacks on a phone.
- `stability` (after "Orthopedic instability" / "The catch"): seat the joints and close to the first contact, bite into
  MIP and a condyle comes off its seat (1-2 mm, more than 3 mm, or the 10% with MIP = CR), bruxer loading, and a flat
  plane splint that gives both.
- `splints` (after "Full coverage covers all the teeth" / "An upper splint"): maxillary or mandibular, full or partial,
  stabilizing or repositioning; protrude on the ramp; months of partial-coverage wear (covered teeth in, others out).
  It doesn't say how long a splint stops bruxism.
- `thirds` (after "The rule of thirds simplifies" / "Most irreversible dental work"): slide the lower molar off its
  ideal; the incline is split into thirds with the treatment for each.
- `erosion` (after the NCCL paragraph at both levels): both arches, per-surface severity for GERD (and the side slept
  on), bulimia, soda swished or pooled, citrus sucked or chewed and NCCLs, with an attrition vs erosion close-up that
  doesn't say whether erosion facets match.

`stability` and `splints` share `tools/figures/occlusion/anima/l7rig.mjs` (skull, mandible, disc, teeth and a contact
solver run in Node). Checked: `build.mjs --check`, anima's line check on every preview page in both themes (0 line ends;
the figures draw paths, so it has little to check), no page errors in the previews or the hub, placement at both levels
and in Review, screenshots at 390 px light and dark in the PR, the three CI scripts. Nothing left on this task; Sam's look
at the screenshots is the last step before merge.
