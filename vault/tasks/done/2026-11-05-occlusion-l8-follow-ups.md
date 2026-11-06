---
type: task
status: done
hub: occlusion
created: 2026-11-05
requested-by: Sam
due: 2026-11-16
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/270
---

# Occlusion L8 (Denture Occlusion): diagram review and the slides check

## Goal

L8 `dentures` went live from the 11/5 recording alone (no slides or handout were in the Drive folder). Two things are
left before the final (Mon Nov 16), the sooner the better ([ship-it-now](../../rules/ship-it-now.md)):

1. **Diagram review** ([diagram-review](../../rules/diagram-review.md)): Sam approves or skips each candidate below, one by
   one; build only the approved ones.
2. **The slides check:** when Dr. Givan's L8 slides or handout reach the Drive Occlusion/Final folder, check the notes,
   questions, hints and likely topics against them.

## Context

- Hub note: [occlusion](../../hubs/occlusion.md). Change log: "2026-11-05 (Occlusion L8: Denture Occlusion" in `DEPLOY_NOTES.md`.
- Rules: [diagrams-anima](../../rules/diagrams-anima.md), [figures-teach-the-lecture](../../rules/figures-teach-the-lecture.md),
  [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md) (figures go in a `data-sh-noread` wrapper; a
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

- [x] Sam has approved or skipped each candidate; the answers are in [decisions](../../decisions.md) and the hub note
- [x] The approved figures are built and checked at 390 px in both themes (Sam seeing the screenshots: PR #260)
- [x] The L8 slides or handout are checked against the notes (names the recording spelled by ear: Gysi, Trubyte, Hanau,
      Thielmann, Berry; the resorption directions; the tooth-form angles), with both mp3s rebuilt if the notes change
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-05: written when L8 shipped from the 11/5 recording ([PR #259](https://github.com/smcmurry6-source/study-hubs/pull/259)); the four candidates went to Sam in chat.
- 2026-11-05: Sam approved all four (Build, Build, Build, Build). Building them is next.
- 2026-11-05: built: Fig 20 `resorb`, Fig 21 `ssr`, Fig 22 `schemes`, Fig 23 `toothforms` (numbered in the notes' order),
  in both note levels and L8's Review; screenshots for Sam in [PR #260](https://github.com/smcmurry6-source/study-hubs/pull/260).
  Occlusion's performance budget raised to 1350 KB there, pending Sam (BUG-030). Left: Sam's look, then the slides check.
- 2026-11-06: Sam made outside sources a standing rule for figures ([outside-sources-for-figures](../../rules/outside-sources-for-figures.md))
  and said "Build all proposed figures". Fig 20 now resorbs the maxilla less, so the mandible loses about twice its height
  (Tallgren; Cawood & Howell for the basal bone), and Figs 20-23 cite their outside sources. Same PR.
- 2026-11-06: Sam approved PR #260 ("Merge when ready"), the budget raise included. Left: the slides check.
- 2026-11-06: Sam added the slides and handout ("Occ Lec7 RDP Occlusion", the course's Lecture 7, in Occlusion/Final) and
  asked for the check; done in [PR #270](https://github.com/smcmurry6-source/study-hubs/pull/270), with the Home-timeline contrast fix for the other hubs (BUG-031).

## Outcome

Both done. The four figures shipped in PR #260. The slides check (2026-11-06) found the recording's names right except
two, and the slides add a good deal the lecture skipped over:

- **Corrected:** Hanau's term is the **Realeff** ("resiliency and like effect"), not "resilient-like effect"; the formula
  is **Thielemann's** (the Review lecture, its questions and the podcast still spell it Thielmann, as they were written:
  left alone so their audio doesn't drift, and the L8 notes say both); semi-anatomic teeth are **12-22°** (the 12° and
  20° molds) and anatomic **30-33°** (the handout: 30° or more); the porcelain history (Duchâteau about 1774, Fonzi's
  "terro-metallic incorruptible" teeth in 1808); lingualized anterior contact is "no: difficult, can be compensated" on
  the slides, "never" in class (both now said). Gysi, Trubyte, Hanau and Berry (1906) were right.
- **Added from the slides:** retention's physical factors (the interposed fluid and surface tension do more than
  suction), what resists tipping, support's "bilateral, equal and simultaneous", the neutrocentric concept and its five
  tooth factors (40% narrower), lingualized's definition and seven advantages, Hanau's first-molar contacts and clinical
  remounts, Thielemann's fixed and variable factors, the balanced setup, the materials (a reverse curve in 5-7 years),
  the six posterior selection criteria, the tooth forms' other names and pros and cons, the slides' table comparing the
  four schemes, and the Abduo 2013 review. Every history slide says "No test questions": a de-emphasize hint, and on
  Sam's word ("if the slides say it isn't tested, then take it out") the seven history questions were retired and the
  history rows left L8's Review; the notes keep the history so the narration stands ("don't redo the narration").
- 17 new questions (`handout`), every L8 topic re-ranked (hint, then slides), Review and the cram sheet updated, Figs 22
  and 23 relabeled (12-22°, 30-33°), both mp3s rebuilt. `tools/narrate.py` now reads rating marks (+++, ++, +, −) aloud.
