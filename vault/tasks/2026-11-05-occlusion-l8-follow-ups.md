---
type: task
status: in-progress
hub: occlusion
created: 2026-11-05
requested-by: Sam
due: 2026-11-16
waiting-on: Sam's look at the four figures (PR #260), then L8's slides or handout in the Drive Final folder
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/260
---

# Occlusion L8 (Denture Occlusion): diagram review and the slides check

## Goal

L8 `dentures` went live from the 11/5 recording alone (no slides or handout were in the Drive folder). Two things are
left before the final (Mon Nov 16), the sooner the better ([ship-it-now](../rules/ship-it-now.md)):

1. **Diagram review** ([diagram-review](../rules/diagram-review.md)): Sam approves or skips each candidate below, one by
   one; build only the approved ones.
2. **The slides check:** when Dr. Givan's L8 slides or handout reach the Drive Occlusion/Final folder, check the notes,
   questions, hints and likely topics against them.

## Context

- Hub note: [occlusion](../hubs/occlusion.md). Change log: "2026-11-05 (Occlusion L8: Denture Occlusion" in `DEPLOY_NOTES.md`.
- Rules: [diagrams-anima](../rules/diagrams-anima.md), [figures-teach-the-lecture](../rules/figures-teach-the-lecture.md),
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md) (figures go in a `data-sh-noread` wrapper; a
  notes change means both mp3s again, `audio/dentures-full.mp3` and `-plain.mp3`).
- Draw from L8's notes (`dentures` in the hub's READINGS) and check against the `dn-*` / `cs-dn-*` questions. Build like
  the L7 figures (`tools/figures/occlusion/anima/`, `FIG_PLACE.dentures` in `od.js`, a Review `figs` section).

**Diagram candidates** (proposed 2026-11-05; **Sam approved all four the same day**, "Build" to each; built the same day as Figs 20-23, [PR #260](https://github.com/smcmurry6-source/study-hubs/pull/260)):

1. **The three schemes in motion**: a frontal view of a pair of complete dentures (posterior teeth both sides) stepping
   centric occlusion, right working, protrusion, with a toggle for balanced / non-balanced / lingualized; contacts light
   up on both sides (balanced), separate (non-balanced) or sit on the upper lingual cusps (lingualized), and an unbalanced
   denture tips off the far side. Supports `dn-balance`, `dn-one-tooth`, `dn-bal-def`, `dn-nonbal-def`, `dn-ling-def`,
   `dn-sel-nonbal`, `dn-sel-ling`, `dn-2s-*`, the "Balanced or non-balanced?" sort. Under the notes ("The occlusal
   schemes") and in Review. Large, about 3 hours.
2. **How the ridges resorb**: front and back cross-sections of both jaws with a slider from dentate to long edentulous;
   the maxilla goes up and in, the mandible down and out, so the posterior teeth end up set in crossbite and the jaws read
   pseudo-Class III. Supports `dn-resorb-maxpost`, `dn-resorb-mand`, `dn-crossbite`, `dn-match-resorb`, `cs-dn-flat-*`.
   Under the notes ("What makes it harder") and in Review. Medium, about 2 hours.
3. **Support, stability and retention**: a denture on its ridge with three forces (down, sideways, off) and, on hover,
   what resists each (palate, buccal shelf and retromolar pad; ridge height and flanges; fit, seal, saliva and muscles).
   Supports `dn-support`, `dn-stability`, `dn-ssr-most`, `dn-support-areas`, `cs-dn-ret-*`, the "Retention or
   stability?" sort. Under the notes and in Review. Small, about 1 hour.
4. **Posterior tooth forms**: anatomic (30° or more), semi-anatomic (about 12-20°) and flat (0°) molar profiles side by
   side, with the lingualized mortar and pestle (a long upper lingual cusp in a flat or wide lower fossa). Supports
   `dn-anat-angle`, `dn-flat-pro`, `dn-ling-def`, `dn-ling-con`, `dn-cg0`. Under the notes ("Tooth forms compared") and
   in Review. Small, about 1 hour.

## Done when

- [x] Sam has approved or skipped each candidate; the answers are in [decisions](../decisions.md) and the hub note
- [x] The approved figures are built and checked at 390 px in both themes (Sam seeing the screenshots: PR #260)
- [ ] The L8 slides or handout are checked against the notes (names the recording spelled by ear: Gysi, Trubyte, Hanau,
      Thielmann, Berry; the resorption directions; the tooth-form angles), with both mp3s rebuilt if the notes change
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [ ] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-05: written when L8 shipped from the 11/5 recording ([PR #259](https://github.com/smcmurry6-source/study-hubs/pull/259)); the four candidates went to Sam in chat.
- 2026-11-05: Sam approved all four (Build, Build, Build, Build). Building them is next.
- 2026-11-05: built: Fig 20 `resorb`, Fig 21 `ssr`, Fig 22 `schemes`, Fig 23 `toothforms` (numbered in the notes' order),
  in both note levels and L8's Review; screenshots for Sam in [PR #260](https://github.com/smcmurry6-source/study-hubs/pull/260).
  Occlusion's performance budget raised to 1350 KB there, pending Sam (BUG-030). Left: Sam's look, then the slides check.

## Outcome
