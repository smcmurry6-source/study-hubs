---
type: task
status: open
hub: widget
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: 
agent: 
pr: 
---

# Patient Box v2: cases built from a tooth library and modules

## Goal

Sam's idea (2026-11-06, workshopped in chat): one reusable Patient Box engine built from authoritative dental references. An
author assembles a made-up patient from approved modules (missing teeth, restorations, caries, endodontic findings,
periodontal measurements, recession, CAL, BOP, mobility, furcations, horizontal or vertical bone loss), and one case record
keeps the narrative, odontogram, perio chart, clinical image, radiograph, key and explanation consistent. It refuses
impossible combinations and any answer that depends on something the student isn't shown. First: permanent-dentition perio
cases and bone-level and radiograph variations; then restorations, caries, endo, implants, prosthodontics and other hubs.
The tooth library is shared with the figures, so drawn figures pull from the same catalogue. Its own track, not tied
to the redesign's release.

## Context

- What exists: [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md), `widget/cases.js` + `widget/cases.css`,
  `node tools/ci/cases.js`, [the first engine's task](done/2026-11-04-perio-visual-case-engine.md),
  [shared-infrastructure](../reference/shared-infrastructure.md). Hub notes: [perio](../hubs/perio.md),
  [pcd-implants-exam1](../hubs/pcd-implants-exam1.md), [occlusion](../hubs/occlusion.md).
- Rules that matter most here: [outside-sources-for-figures](../rules/outside-sources-for-figures.md),
  [figures-teach-the-lecture](../rules/figures-teach-the-lecture.md), [diagrams-anima](../rules/diagrams-anima.md) (a
  picture never gives the answer away), [question-ids-are-permanent](../rules/question-ids-are-permanent.md),
  [every-choice-gets-a-why](../rules/every-choice-gets-a-why.md), [ship-it-now](../rules/ship-it-now.md),
  [preview-and-release-test](../rules/preview-and-release-test.md).

## What exists already (since 2026-11-04)

The kit already does a good part of this: one case model per tooth (probing depths, recession, BOP, suppuration, plaque,
mobility, furcations and what the film shows, bone loss per side, vertical defects, calculus, amalgam, crown, endo,
implants, missing teeth), drawn as a perio chart, a periapical film and a buccal view; Wheeler's sizes and shapes for all 16
tooth types (`XT`); `derive()` for staging, grading, recession types, Glickman classes and peri-implant states; and
`validate()` with CI for realistic numbers that agree with the key. Perio, PCD Implants and Occlusion load it. So this is
**v2 of the kit**, not a new engine, and Perio's existing cases move onto it.

## What the data says

Pictures and cases are the class's top request (17 of 95 check-ins), ahead of exam wording (12): of Sam's 2026-11-06
ideas, this one has the strongest evidence ([the audit](done/2026-11-05-redesign-audit-and-plan.md), section 1).

## What v2 adds

1. **A tooth library as data**, grown from `XT`: all 32 permanent teeth with their surfaces, roots (count and names),
   furcation entrances (maxillary molars buccal, mesial and distal, the last two probed from the palatal; mandibular molars
   buccal and lingual; a two-rooted maxillary first premolar mesial and distal), root trunk, the six probing sites,
   landmarks (CEJ, contacts, the crest 1.5 mm below the CEJ in health, as the kit draws it) and the films that show it
   (periapical; bitewing for premolars and molars). **Figures pull from it too** (Sam, 2026-11-06): the library is one file
   that `widget/cases.js` reads in the browser and the figure builds (`tools/figures/*`, the anima kit) import in Node, so
   a drawn figure of a tooth uses the same outline, roots, furcations and landmarks as the cases and the two can't disagree.
2. **Modules**, a layer above the per-tooth numbers: `missing`, `restoration(surfaces, material)`, `caries(surface, depth)`,
   `endo(fill, lesion)`, and perio modules that write consistent numbers from a few choices (`bonePattern({ teeth, percent,
   horizontal or vertical, defect })` sets bone, probing depth, recession and CAL so the pocket and the crest agree;
   `bop(rate)`; mobility and furcations that follow the bone). The author picks modules; the numbers follow.
3. **New views from the same record**: a full-mouth odontogram (missing teeth, restorations and caries by surface),
   bitewings and a full-mouth series layout, beside the chart, the film and the clinical view.
4. **One record, everything drawn from it**: the Patient Box rows (age, smoking, HbA1c, chief complaint), every view, the
   key (`derive()`) and the numbers the explanation quotes, so none of them can disagree.
5. **More checks in `validate()`**: impossible combinations (a restoration, caries, endo or a furcation on a missing tooth; a
   furcation on a tooth or an entrance that has none; an implant and a root in one site; a bitewing of an incisor) and a
   new one, **answerable from what's shown**: each question says what its key rests on (stage: interdental CAL or bone loss
   and tooth loss; grade: bone loss for age, smoking, HbA1c) and CI fails when the figures and rows it shows don't include
   it. That is the twin of `hide`, which stops a picture from giving the answer away.
6. **Sources**: Wheeler's Dental Anatomy (in use), Newman and Carranza's Clinical Periodontology, White and Pharoah's Oral
   Radiology (how bone loss, furcations and lesions look on a film), the 2017 AAP/EFP classification papers; later
   Sturdevant's for caries and restorations and Cohen's Pathways of the Pulp for endo. They make the drawings and the checks
   right; their text and images are never copied, and what is labeled and keyed follows the lecture. Every patient is made
   up.

## Order

1. **v2.0**: the tooth library, the perio and bone modules, the odontogram and bitewings, the answerable-from-what's-shown
   check, and Perio's cases moved onto modules (same case ids, question ids and keys).
2. Restorations and caries. 3. Endodontic findings. 4. Implants on modules (they exist today as per-tooth numbers).
5. Prosthodontics and other hubs (Occlusion's `CASE_IMG` pictures could move onto the kit).

## Where it goes

**Its own track** (Sam, 2026-11-06), not tied to the redesign's release. The kit is content the live hubs use, and
[ship-it-now](../rules/ship-it-now.md) holds, so each step ships to the live hubs when it's ready, with `cases.css` styled for
today's hubs and for the redesign's tokens. Each step is a substantial change (tier 2): preview, the release suites,
screenshots on a phone and in both themes, Sam's look. A new module goes to Sam with its first case, the way a figure does
([diagram-review](../rules/diagram-review.md)).

## Sam's calls (2026-11-06, [decisions](../decisions.md))

Patient Box v2 is done by itself, on its own track. Figures pull from the tooth catalogue too. The first version's scope
(Order, step 1) and Sam's approval of each new module with its first case stand as proposed.

## Done when

- [ ] Sam's calls are in [decisions](../decisions.md) and this note
- [ ] v2.0 built: the library, the modules, the new views, the new checks in `validate()` and `tools/ci/cases.js`
- [ ] The figure builds read the same library (one existing tooth figure redrawn from it to prove the path); `--check` still passes
- [ ] Perio's cases on modules with the same ids and keys (`node tools/ci/smoke.js`, `node tools/ci/cases.js`)
- [ ] The how-to rewritten ([draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md)); the About page if a new kind
      of picture shows ([about-page](../rules/about-page.md))
- [ ] CI and the release suites pass; screenshots on a phone and in both themes; Sam's look
- [ ] Vault written back (decisions, hub notes, `DEPLOY_NOTES.md`, this note's Outcome)

## Log

- 2026-11-06: workshop of Sam's idea.
- 2026-11-06: Sam's calls (above): its own track; figures pull from the catalogue. Ready for an agent.

## Outcome

Related: [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md) · [perio](../hubs/perio.md) ·
[outside-sources-for-figures](../rules/outside-sources-for-figures.md) · [the audit and plan](done/2026-11-05-redesign-audit-and-plan.md)
