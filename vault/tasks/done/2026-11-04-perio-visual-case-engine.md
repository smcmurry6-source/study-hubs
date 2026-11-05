---
type: task
status: done
hub: perio
created: 2026-11-04
requested-by: Sam
due: 2026-11-19
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/238
---

# Perio: the Patient Box as a visual diagnostic-case engine

## Goal

Turn Perio's text-only Patient Box cases into cases drawn from their numbers: a periodontal chart, a periapical
radiograph and a drawn view of the gums, produced from one case model (probing depths, CAL, recession, bleeding,
suppuration, plaque, mobility, furcations, bone loss, vertical defects, missing teeth, restorations, implants), so
staging, grading, diagnosis and treatment-planning cases can be varied without drawing a picture for every
combination. Every question shows all the evidence before the answer; no picture gives a cue away.

## Why (the evidence)

Perio midterm check-ins (`exam_debriefs`, 2026-10-01 to 10-21, n = 27): "the exam had more staging and grading
diagnostic question/patient box", "better cases more representative with pictures and charts and radiographs",
"more diagnostic questions", "maybe more case based questions and pictures", "specific components in severity of
staging and complexity of staging, comparing stage III and IV", "radiographs/pt examples". `question_stats`: the
text-only Patient Box items that need a calculation or a trigger are the ones the class misses (`q1-P01` 56%,
`q1-P05` 41%, `q2-P01` 48%); the recall-style ones score 85-100%. `LESSONS.md`: "Patient Box items should show the
chart or radiograph finding, not only describe it."

## What was built (the proposal, in the PR for Sam to look at)

- **One shared kit**, `tools/figures/shared/dental-cases.js` + `.css` (pasted into the hub between the `pcase` markers
  by `tools/figures/perio/build.mjs`): the Occlusion case-picture tooth model (Wheeler's average sizes, the film look),
  generalized so any hub can draw a case from numbers. `DCASE.chart` (an SVG strip per surface in the style of a
  probing chart plus the numbers as a real table), `DCASE.film` (periapical: per-side bone levels, angular defects,
  furcation radiolucency, calculus, crowns, root fillings, amalgams, implants with a baseline, missing teeth),
  `DCASE.view` (buccal view: recession, swollen or fibrotic gingiva, bleeding, suppuration, plaque, calculus), and
  `DCASE.derive` (the 2018 staging and grading from the same numbers, recession types, peri-implant states).
- **Cases are data** (`PCASES` in the hub): rows for the box, the spec, the default pictures and an `expect`;
  `tools/figures/perio/cases-check.mjs` (run by `build.mjs`) fails if a case's key disagrees with its own numbers.
- **Questions** reference a case (`pcase`), pick their pictures and hide answer rows (`pfig`, `hide.cal` /
  `hide.furc` / `hide.mob`), and carry `ref` links ("In the notes" buttons under the explanation, through `SH_GOTO`).
- **Accessibility:** every drawing is `role="img"` with a label that states what it shows (never the answer); the
  chart's numbers are a real table with a caption; nothing animates; the buttons are keyboard-reachable; the chart
  table scrolls sideways on a phone with a sticky first column.
- **Provenance:** all drawings are original SVG built from numbers; tooth sizes from Wheeler's Dental Anatomy;
  chart conventions as on a standard probing chart; staging, grading, recession types, Glickman classes and
  peri-implant states as taught in this hub (S1, S4, S5, S6, S7). No photographs, no patient images, no course files.

## The first six cases (for approval)

| Case | Sessions | Questions |
|---|---|---|
| Lower right, first visit (localized Stage 3 Grade B) | S1 | CAL from the chart; the diagnosis; what would make it Grade C |
| Bleeding gums at 23 (gingivitis on an intact periodontium) | S1, S4 | the diagnosis; which care (D4346) |
| Recession on the lower front teeth (RT1, RT2, RT3) | S1 | #24's type; where full coverage is predictable |
| A furcation on #19 (Class II; Stage 3 by the trigger; Grade C from smoking) | S5, S1 | the Glickman class; the diagnosis; the treatment least suited (regeneration in a smoker) |
| One deep pocket after Phase I (a deep, narrow intrabony defect) | S6, S1 | walls are counted at surgery; what favors regeneration; what comes next |
| An implant at #30, three years on (peri-implantitis; Meffert failing) | S7 | the peri-implant diagnosis; Meffert's term |

## Done when

- [x] Shared kit, perio build step and the self-check; six cases and 16 questions with a why for every choice and
      notes references; `LIKELY_TOPICS` updated; About page entry
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Sam approves the proposal and the case set (in the session, 2026-11-04: "Merge when ready")
- [ ] Then: the question expansion (every session's Patient Box items rebuilt as cases; S3 risk and S4 re-evaluation
      cases; two-statement and numbered items on cases), the phone layouts polished on a real device, visual QA of
      every case in both themes, the full UAT pass, a test report
- [x] Vault written back (hub notes, decisions, the how-to, this note's Outcome)

## Open questions for Sam

1. **The "newly uploaded source material":** nothing newer than Nov 2 is in Drive → Periodontology → hubs (the
   latest files there are the S7/S8 sources already used). The cases were written from the hub's own notes only. If
   there is a new file (a perio chart example, the final review, S9 slides), say which one and where, and the cases
   will be checked against it before the expansion.
2. The drawn view: keep it (it shows what a chart can't: color, swelling, plaque, calculus), or charts and films
   only?
3. Should the old text-only Patient Box items (`q1-P01` to `q6-P04`, `q5-RP*`, `q7-P*`, `q8-P*`) be rebuilt as drawn
   cases in the expansion, or left as they are beside the new ones?

## Log

- 2026-11-04: written; kit, six cases and the PR built the same day; waiting for Sam's look.
- 2026-11-04 (Sam, in the session): "I also want this system to be called for patient box questions in other hubs";
  "Merge when ready"; "All teeth need to be anatomically correct. All variables need to be realistic."
- 2026-11-05: the kit moved to `widget/cases.js` + `.css`; every tooth type redrawn from Wheeler's anatomy (checked on a
  tooth sheet of all 16 types in both themes); `validate()` + `node tools/ci/cases.js` in CI; PCD Implants' four Patient
  Box items drawn; Occlusion hooked; how-to note written; merged on Sam's approval.

## Outcome

Shipped in [PR #238](https://github.com/smcmurry6-source/study-hubs/pull/238) (Sam: "Merge when ready"): the shared case
kit in `widget/`, six Perio cases (16 questions) and four PCD Implants cases, the realism validator and its CI step, the
how-to. Still open, as new tasks when Sam wants them: the Perio expansion (every session's text-only Patient Box items as
drawn cases, S3 and S4 cases, two-statement and numbered items on cases); the drawn view stays unless Sam says otherwise;
no "newly uploaded" Perio source was found in Drive (nothing after Nov 2), so the cases rest on the hub's own notes.
