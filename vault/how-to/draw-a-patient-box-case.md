---
type: how-to
tags: [how-to, questions, figures, cases]
---

# Draw a Patient Box case from its numbers

Sam's rule, 2026-11-04: **Patient Box questions in every hub use the shared case system** (`widget/cases.js` +
`widget/cases.css`, `window.shCases`), never a hand-drawn picture per case. One case model (per-tooth probing depths,
recession, bleeding, suppuration, plaque, mobility, furcations, bone loss, vertical defects, calculus, restorations,
implants, missing teeth) produces the periodontal chart, the periapical radiograph and the drawn buccal view, and
the kit works the diagnosis out of the same numbers, so a key can never drift from its picture. **Every tooth is drawn
from real anatomy** (Wheeler's sizes and shapes, root number and curvature per type, root trunks, the cervical line)
and **every number must be realistic**: `shCases.validate()` rejects a case whose numbers are outside clinical ranges
or disagree with each other, and CI runs it on every hub (`node tools/ci/cases.js`).

## A hub that doesn't have it yet

1. In `<head>`, after `widget/v3.css`: `<link rel="stylesheet" href="../../widget/cases.css">` and
   `<script src="../../widget/cases.js"></script>` (synchronous, before the hub's own script).
2. A `PCASES` object between `/* pcases begin */` and `/* pcases end */` lines (CI finds it by those markers).
3. In `pboxHTML(q)`, after the `<dl>`: `+ (window.shCases ? window.shCases.pboxFigures(q, PCASES) : '')`.
4. In every explanation builder, after `whyHTML(q)`: `+ refHTML(q)`, with
   `function refHTML(q){ return window.shCases ? window.shCases.refHTML(q) : ''; }`.
5. If the case's own box rows should come first, after `QUESTIONS` is built: `window.shCases.foldBox(QUESTIONS, PCASES)`.

Perio, PCD Implants and Occlusion have all of this (Occlusion's `PCASES` is empty: its own case pictures stay in
`CASE_IMG`). Medical cases with no teeth (Special Patient Care, Heme & Endo) don't use the kit.

## Writing a case

```js
'first-visit': {
  title:'Lower right, first visit',
  box:[['Patient','44-year-old man'], ...],          // rows shown before the question's own pbox rows (foldBox)
  spec:{ teeth:['28','29','30','31'], age:44, smoke:0, hba1c:null, lingual:false,   // lingual:false = facial only
    mouth:{ teeth:28, involved:4, lost:0 },          // for extent and the tooth-loss trigger
    gingiva:{ look:'inflamed', edema:.5, kt:4 },      // healthy | inflamed | fibrotic; edema 0-1; keratinized mm
    t:{ '30':{ pd:{ f:[6,3,3], l:[5,3,3] },           // three sites per surface, in tooth terms [mesial, middle, distal]
               rec:{ f:[1,0,-1], l:[1,0,-1] },        // CEJ to margin, mm; negative = margin coronal to the CEJ
               bop:{ f:[1,0,0] }, pus:{ f:[0,0,0] }, plaque:{ f:[0,0,0] },
               mob:0, furc:{ f:1 }, furcX:1,          // Glickman class per surface; furcX: what the film shows (0-3)
               bone:{ m:40, d:15 }, vdef:{ m:0 },     // bone loss, % of root length per side; vertical defect, mm
               calc:true, amalgam:true, crown:false, endo:false },
        '31':{ missing:true },
        '30i':null } },                               // implants: implant:{ w, len, baseline:{m,d}, cement, cover }
  figs:[{ kind:'chart', hide:{ cal:true } }, { kind:'film', title:'#28-#31' }, { kind:'view', title:'#28-#31, facial' }],
  expect:{ kind:'periodontitis', stage:3, grade:'B', extent:'localized', maxInterdental:7, maxRBL:40 }
}
```

- **Defaults** are a healthy site: `pd 2, rec -2` (CAL 0). CAL = PD + recession, sign and all; a healthy sulcus
  base sits at the CEJ. Gingivitis with pseudopockets is `pd 4, rec -4`.
- **Bone** is a percent of root length from the CEJ per side; the film draws it (the crest sits 1.5 mm from the
  CEJ in health). An implant's bone is mm below its platform, with a `baseline` for the comparison film; `cement`
  draws excess cement under the crown margin; `cover` draws a submerged implant with a cover screw; `halo:true` with
  `mob` is a failed implant (a radiolucent line round it).
- **The pocket and the bone must agree**: the crest 0-3 mm apical to the pocket base, or a `vdef` that reaches it.
  A furcation needs a molar, bone loss to the trunk and (Class II or III) a `furcX` the film shows; Class III is
  through and through. Mobility rises with bone loss. `validate()` lists what's wrong; `node tools/ci/cases.js`
  prints it.
- **`expect`** is what the key relies on (kind, stage, grade, extent, triggers, maxInterdental, maxRBL, `rt` per
  tooth, `impl` per implant); the build fails if the numbers give something else.
- **A question**: `pcase:'first-visit'`, `pfig:[...]` to pick its pictures (and `hide:{ cal, furc, mob }` for a row
  that would give its answer away), `ref:[{ label, go }]` for the "In the notes" buttons (`go` as the hub's
  `SH_GOTO` takes it: `{ v:'notes', lec, k }` is the k-th paragraph, `{ v:'review', id|q }`, `{ v:'cram' }`,
  `{ v:'hints' }`). Every choice still gets its why ([every-choice-gets-a-why](../rules/every-choice-gets-a-why.md)).
- **Nothing in a picture may give the answer away** ([diagrams-anima](../rules/diagrams-anima.md)): hide the row,
  and check the drawn view too (a furcation question can show the film's radiolucency but not the chart's triangle).
- Numbering is universal; the kit puts teeth in viewer order (the patient's right on your left) and flips upper
  arches crowns-down on the chart and the film, as on a real chart and film.
- Look at it on a phone and in dark mode before the PR: in a scripted browser with the class's data stubbed, or in the
  preview when Sam asked for one ([preview-and-release-test](../rules/preview-and-release-test.md)).

## Where the anatomy comes from

Tooth dimensions and shapes: Wheeler's Dental Anatomy, Physiology and Occlusion (average crown and root lengths,
mesiodistal widths at the contacts and the cervix, cusp count and position, contact heights, root number, trunk
length and apical curvature). Chart conventions: a standard periodontal probing chart. Staging and grading, recession
types, Glickman classes and the peri-implant case definitions: as the hubs teach them (Perio S1, S4, S5, S6, S7;
PCD Implants L8). Everything is original SVG drawn from numbers: no photographs, no patient images.

Related: [build-a-hub](build-a-hub.md) · [diagram-review](../rules/diagram-review.md) ·
[figures-teach-the-lecture](../rules/figures-teach-the-lecture.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[the perio hub note](../hubs/perio.md) · [verify-before-pushing](verify-before-pushing.md)
