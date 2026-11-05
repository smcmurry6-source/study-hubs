---
type: hub
tags: [hub, live]
hub: perio
status: live
---

# Periodontology (perio)

The D2 Periodontology course (DENT 2145), nine sessions with different professors. Midterm Oct 1 (S1-S4, done, check-in
closed); **final Thu Nov 19, cumulative**. Dates: `HUBS` in `index.html` (and `MIDTERM_DATE` / `FINAL_DATE` in the hub).

## Before you work on it

- **Source:** `hubs/perio/index.html` is the source; edit it directly. The old Perio Claude Project's split sources are
  retired (Sam, 2026-11-03), so every "Perio Project: carry ... into the split sources" line in the change log is obsolete.
- **Its own engine**, not the shared Occlusion one: the bank keeps its filters in `STATE.ui.qbank`, matching grades by
  answer text, picture questions use `figAfter`, `recordAnswer` passes select-all picks. Since 2026-11-03 it has `two()`,
  `tf()`, `nums()`, `mq()` and `mm()`.
- **Sessions** (`status`): S1-S5 taught (exempt from the format minimums, taught before the rules), S6 `preview`
  (slides only), S7 taught (Dr. Kaur), S8 taught (antibiotics from Dr. Litz's 2024 recording; host modulation from the
  slides until the class part is posted, as its `note` says), S9 `upcoming` (exam-review guide only). Any session going
  to taught needs the full set: [two-statement-and-true-false](../rules/two-statement-and-true-false.md),
  [numbered-statements](../rules/numbered-statements.md), [high-likelihood-topics](../rules/high-likelihood-topics.md).
- **Sources:** Drive, Periodontology/hubs (class captures, sometimes as base64 `.txt`; slide PDFs; recordings). The Drive
  connector can't download over 10 MB, so a big PDF may be text only.
- **Quiz card:** `NEXT_QUIZ` shows on Home until its date passes; set the next one there.
- **Figures:** `tools/figures/perio/` (`build.mjs` fills the `anima:js`/`anima:css` markers; `--check`, `--preview`),
  placed with `FIG_BY_LEC` / `figsHTML`. The suture diagrams are hand-drawn SVG in the hub (`SUTURE_DIAGRAMS`).
- **Patient Box cases drawn from their numbers** (since 2026-11-04, [task](../tasks/done/2026-11-04-perio-visual-case-engine.md)):
  `PCASES` in the hub (between the `pcases` markers) holds each case's box rows, its spec (per-tooth probing depths,
  recession, bleeding, suppuration, plaque, mobility, furcation, bone loss, vertical defects, calculus, crowns, root
  fillings, implants with a baseline, missing teeth), its default pictures and an `expect`. The shared kit is
  `widget/cases.js` + `widget/cases.css` (loaded in the hub's head; since 2026-11-05 it is no longer pasted into the
  hub, and `build.mjs` only handles the anima figures). It draws the chart, radiograph and buccal view from the spec,
  `derive()` works out the stage, grade, extent, recession types and peri-implant state, and `validate()` checks every
  number is realistic; `node tools/ci/cases.js` (CI, and `build.mjs --check`) fails when a case's numbers are
  unrealistic or its `expect` disagrees with them. A question names its case in `pcase`, picks its pictures with
  `pfig` (and hides a row that would give its answer away: `hide.cal`, `hide.furc`, `hide.mob`) and lists its `ref`
  links ("In the notes"). Write every new Patient Box item this way: [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md).
- **Narration:** both levels for every session; **Arcade:** the Pocket Arcade, skin `PERIO_SKIN`, painted Clinic Escape
  (`img/clinic-escape.webp`).
- **Kept as taught** after an outside fact check (2026-10-21), so don't "fix" them: molar-area CTG harvest, Kwok & Caton
  whole-dentition prognosis, stage regression only by regenerating the defect, clinic piezo can't root plane, lingual
  furcation entrance wider, Hamp as under 3 / over 3 mm / through (in class it was called "three millimeter increments").

## Diagram decisions

- 2026-09-25: the Atlas mode's diagrams were removed for being inaccurate. Accuracy is the bar.
- 2026-10-14: all four candidates of the first review skipped; S5's Glickman grades, entrance map and CEP grades skipped.
  Don't re-propose these.
- 2026-11-03: six S7/S8 figures approved and built.
- 2026-11-04: all perio figures audited against the S2, S7 and S8 notes and fixed ("vet, audit, and improve all perio
  figures"). Peri-implant states: drawn to scale (15 px/mm) in a buccolingual section, with crater bone, a probe that
  bows around the crown and measured PD. Meffert: each film read against a dashed previous crest. BOP: tooth sites, Lang
  1986. Meffert and the radiograph timeline switch to a phone layout below 470 px (ResizeObserver in `live`). Strokes
  inside a `scale()` group need `vector-effect:none`, because the kit CSS makes every path non-scaling. Suture diagrams
  (`SUTURE_DIAGRAMS`): one proximal tooth behind the interdental section, periosteal anchorage labeled apical/coronal
  with the flap margin, and the horizontal mattress strand ending at a cut, not running off. The braided-thread pattern
  is now herringbone. The figure-eight "nonscalloped incisions" clause was removed because it couldn't be confirmed;
  the figure now says only "flaps will not meet closely (apically positioned flaps)". Kept after checking: sling,
  criss-cross, vertical mattress, continuous, continuous locking, and the materials chart.

## Pending

- [The visual case engine](../tasks/done/2026-11-04-perio-visual-case-engine.md): the first six cases are in for Sam's
  look; the expansion (every session's Patient Box items as drawn cases, S3 and S4 cases) waits for approval.
- [S6 to taught](../tasks/2026-11-03-perio-s6-regeneration-taught.md) ·
  [S8 host modulation](../tasks/2026-11-03-perio-s8-host-modulation-class.md) ·
  [S9](../tasks/2026-11-03-perio-s9-plastic-esthetics.md)

History: grep `perio` in "Recent major changes" (`DEPLOY_NOTES.md`).

Related: [home](../home.md) · [occlusion](occlusion.md) (same final day)
