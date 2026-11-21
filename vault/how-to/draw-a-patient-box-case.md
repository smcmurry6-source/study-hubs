---
type: how-to
tags: [how-to, questions, figures, cases]
---

# Draw a Patient Box case from its numbers

Sam's rule, 2026-11-04: **Patient Box questions in every hub use the shared case system**, never a hand-drawn picture per
case. Since Patient Box v2 (2026-11-20, [the task](../tasks/done/2026-11-06-patient-box-v2-modular-cases.md)) it is two files:

- **`widget/teeth.js`, the tooth library** (`window.SH_TEETH` in a browser, `require()` in Node): Wheeler's sizes and
  outlines for the 16 tooth types, and one catalogue entry for each of the 32 permanent teeth (`SH_TEETH.tooth(n)`: name,
  arch, side, surfaces, roots by name, furcation entrances and where each is probed from, the root trunk, the six probing
  sites, landmarks such as the CEJ, the contacts and the crest 1.5 mm below the CEJ, and the films that show it). **Figures
  pull from it too** (Sam, 2026-11-06): a figure build imports it (`createRequire(import.meta.url)("../../../widget/teeth.js")`)
  and draws its tooth with `outlineMM(n)` or the same `crownMM`, `mkRoots`, `rootOutline` and `trunkPts` the cases use,
  with the enamel over its dentin (`dejPts`: thinning to nothing at the CEJ), the pulp (`pulpPts`), a restoration or a
  lesion by surface (`restoMM`, `cariesMM`) and a tooth's place along the arch (`archMM`), so the two can't disagree. The
  first: the arcade's Stage & Grade tile (`stageMolar()` in `tools/figures/site/arcade.mjs`).
- **`widget/cases.js` + `widget/cases.css`, the case kit** (`window.shCases`), which reads the library. One record per case
  draws every picture, the Patient Box rows and the key (`derive()`), and `validate()` rejects numbers outside clinical
  ranges, numbers that disagree with each other and impossible combinations. CI runs it on every hub and on
  `tools/cases/examples.json` (`node tools/ci/cases.js`).

## A hub on the engine

Put the cases in `content/core.json` as `pcases` (an object, id → case) and name one from a question with `pcase`. The
engine loads `teeth.js` then `cases.js` and `cases.css` only on a hub that has cases, draws the pictures in the Patient
Box, and puts the case's rows above the question's own `pbox` rows. Nothing else to wire. (The old single-file hubs, all
down since 2026-11-19, loaded the two scripts by hand: `teeth.js` first.)

**Start from an example**: `tools/cases/examples.json` has four made-up patients built from modules, with a question each
using `rests` and `says`: a full mouth, a molar furcation, and since v2.1 (2026-11-21) a bridge with a post and core
(`v21-bridge-post`) and a trauma case (`v21-trauma`). Copy one, change it, run `node tools/ci/cases.js`.

## Writing a case: modules

```json
"first-visit": {
  "title": "Full mouth, first visit",
  "spec": {
    "full": true, "teeth": ["28", "29", "30", "31"],
    "age": 52, "sex": "man", "smoke": 12, "hba1c": 5.6, "cc": "My gums bleed when I brush.",
    "mouth": { "teeth": 27, "involved": 13, "lost": 1 },
    "gingiva": { "look": "inflamed", "edema": 0.6, "kt": 3 },
    "modules": [
      { "m": "missing", "teeth": ["1", "16", "17", "32", "19"] },
      { "m": "bone", "teeth": ["2", "3", "28", "29", "31"], "percent": 22, "rec": 1 },
      { "m": "bone", "teeth": ["30"], "percent": 30, "pattern": "vertical", "side": "m", "defect": 3 },
      { "m": "restoration", "tooth": "30", "surfaces": "MOD", "material": "amalgam" },
      { "m": "restoration", "tooth": "3", "material": "crown" },
      { "m": "endo", "tooth": "3" },
      { "m": "caries", "tooth": "29", "surface": "D", "depth": "dentin" },
      { "m": "endo", "tooth": "20", "fill": false, "lesion": 4 },
      { "m": "bop", "rate": 0.35 }
    ],
    "t": { "30": { "calc": true } }
  },
  "figs": [{ "kind": "chart" }, { "kind": "film" }, { "kind": "odontogram" }],
  "expect": { "kind": "periodontitis", "stage": 3, "grade": "C", "extent": "generalized" }
}
```

The author picks modules and the numbers follow. They run in order, then `t` (the per-tooth numbers, as in v1) is laid
over the result field by field, for the one number you want by hand.

| Module | What it writes |
|---|---|
| `missing` `{ teeth }` | the teeth are gone (X on the odontogram, a gap on a film) |
| `restoration` `{ tooth, surfaces, material, type, overhang, open }` | `amalgam`, `composite`, `gold` or `ceramic` by surface (`MOD`; `B`/`F` and `O`/`I` are taken for the tooth's own). A film draws the preparation's outline from the crown's own surface, so it meets the outside exactly: O in the middle of the crown under the cusps with its outline following them, a box per proximal surface with smooth walls, rounded line angles and a flat floor about 2.8 mm under the contact, a buccal-groove extension for OB, a cervical oval for a B or L alone (Class V), Class III and IV on an incisor or canine; metal bright white with a crisp edge, composite and ceramic a shade under enamel with a softer one. `type`: `direct` (the default), `inlay` (gold or ceramic, walls flared), `onlay` (gold or ceramic, the cusps capped 1.8 mm) or `veneer` (ceramic or composite, the labial surface of an incisor, canine or premolar). `overhang` and `open` (`m`, `d` or `md`) put a ledge or a gap at a box's gingival margin. `material: "crown"` with `crown`: `gold`, `pfm`, `zirconia`, `lithium` (lithium disilicate) or `ssc` (stainless steel), each over its own preparation (Rosenstiel's reductions and margins: a PFM's metal coping under its porcelain, zirconia nearly as bright as metal, lithium disilicate a shade over enamel, an SSC's thin shell with no preparation to speak of); `crown: true` (or none) is v1's crown, drawn as before; `open`/`overhang` on a crown are its margin |
| `caries` `{ tooth, surface, depth, recurrent }` | `enamel`, `dentin` or `pulp`. On a film a proximal one is a triangle in the enamel just cervical to the contact, and from `dentin` a second one spreading along the DEJ toward the pulp horn; an occlusal one shows only in the dentin; a B or L one is a faint round shadow. `recurrent: true`: under a restoration's (or a crown's) margin, M or D, a dark band under the gingival floor. Red, hatched, on the odontogram (recurrent: hatched the other way) |
| `endo` `{ tooth, fill, lesion, post, core, sep, missed, widened }` | a root canal filling (`fill: false` for none; `true` is v1's; or `adequate`, `short` (2 mm or more short of the apex), `long` (past it, with a puff of sealer) or `voids`; with one the chamber is filled too) and a periapical `lesion` mm across: the PDL space widening toward the apex, the lamina dura gone there, into a soft-edged radiolucency; `widened: true` the widened PDL alone. `post`: `cast` (one casting with its core), `metal` (prefabricated, parallel) or `fiber` (barely brighter than dentin), leaving 4-5 mm of gutta-percha; `core`: `amalgam`, `composite` or `cast`; both under a crown. `sep`: a separated instrument in that root's apical third; `missed`: that root's canal unfilled (a molar's mesial or distal) |
| `fracture` `{ tooth, type, ... }` | `crown` (an incisor or canine: `depth` enamel, dentin or pulp, `side` m or d; the corner gone on the film and the view, the dentin's band and the pulp's dot on the view), `cusp` (a premolar or molar: `cusp` B, L, MB, DB, ML or DL), `crack` (no film shows it: the odontogram's dashed line, and a row for the bite test), `vrf` (a vertical root fracture, `side`, `root`: a J-shaped radiolucency along the root on the film and a narrow pocket, `pd` mm (default 8), at the middle site of `surface` f or l on the chart) or `hrf` (a horizontal root fracture `at` cervical, middle or apical, a single-rooted tooth: a thin line across the root) |
| `bridge` `{ abutments: [a, b], material }` | a fixed bridge: crowns of `material` (`pfm`, `gold`, `zirconia` or `lithium`) on the two abutments, a pontic at every tooth between them, joined by connectors on the film, the chart, the view and the odontogram (a bar across the units, the pontic's root crossed out). The teeth between must be in the `missing` module |
| `bone` `{ teeth, percent, pattern, defect, side, rec, swell, furc, mob }` | bone loss (% of the root; a number or `{ tooth: % }`), horizontal or `vertical` with `defect` mm on `side` `m` or `d`; then CAL at all six sites so the pocket base sits about 1 mm coronal to the crest, recession (`rec` facial mm, the lingual 1 less), probing depth (at least 2 mm; `swell` adds a pseudopocket), furcations that follow the bone past the trunk (Class I within 1.5 mm, II from 1.5 mm past, III from 4 mm) and mobility that follows the bone (1 from 55%, 2 from 70%) |
| `bop`, `pus`, `plaque` `{ rate, teeth }` | that share of the sites, the deepest first |
| `recession` `{ teeth, mm }` | facial recession at the middle site |

**The record** also holds `age`, `sex`, `smoke` (cigarettes a day; 0 = doesn't smoke), `hba1c`, `medical`, `cc` (the chief
complaint) and `mouth` (`teeth` present, `lost` to periodontitis, `involved`, `stage4` complexity factors). **A case
without its own `box` gets its rows from the record** (`shCases.rows`), so the age, smoking and teeth the question shows
are the ones the key was worked out from. **`full: true`** makes it a full-mouth case: every tooth not named is drawn healthy,
and `validate()` checks `mouth.teeth`, `involved` and `lost` against the record.

The v1 per-tooth fields still work, alone or under modules: `pd`, `rec`, `bop`, `pus`, `plaque` (three sites a surface, in
tooth terms `[mesial, middle, distal]`), `mob`, `furc { f, l }`, `furcX`, `bone { m, d }`, `vdef`, `calc`, `amalgam`,
`crown`, `endo`, `implant { w, len, baseline, cement, cover }`, `halo`, `missing`, and v2's `resto`, `caries`, `lesion`, and
v2.1's `margin`, `apdl`, `fx`, `pontic` and `abut` (written by the modules above). `calc` draws subgingival calculus on a film as
tapering radiopaque spurs on the root just apical to the CEJ, and on the view as a yellow-tan band with an irregular edge
along the gum (v2.1).
Defaults are a healthy site: `pd 2, rec -2` (CAL 0).

## The pictures (`figs`, or a question's `pfig`)

`chart` (the probing chart and its numbers), `film` (a periapical), `view` (the drawn buccal view), each of one arch and of
the case's `teeth` or the figure's own `teeth`; `bitewing` (`teeth`: the premolars and molars of one side, both arches, in
Class I occlusion, each tooth at its place along the arch: on a `full` case the neighbors in the film's 31 mm width show
too, cut off at its edges); `fmx` (the full-mouth series, mounted as a real one: 14 periapicals, the anterior films upright
at 23 x 37 mm and the posterior ones across at 36 x 30.5 mm, each showing its stretch of the arch with the apices in, upper
films above and lower below, the 4 bitewings between them under their posterior films, R and L on the mount; on a phone it
scrolls sideways); `odontogram` (the whole mouth, five surfaces a tooth: one row an arch on a wide screen, one row a quadrant
on a phone; materials in colors told apart without color too (caries is hatched, a crown is ringed), the root canal filling
and the periapical lesion drawn past the tooth toward its apex, a key under it, and the chart as text).
`hide: { cal, furc, mob }` takes a row off a chart that would give the answer away.

## The checks (`node tools/ci/cases.js`)

- **Realistic, consistent numbers**: probing depths, recession and CAL in clinical ranges and whole mm, the pocket base
  and the crest agreeing (or a vertical defect that reaches it), furcations only past the trunk, mobility with bone loss.
- **v2.1's findings** (`node tools/ci/cases.js`): a crown material, restoration type, fill, post, core, fracture type
  or side the kit doesn't know; ceramic placed directly, an amalgam inlay, a composite inlay or onlay, an inlay or onlay on an
  anterior tooth, an onlay without O, a veneer on a molar or past the labial surface; an overhang or open margin on a
  surface the restoration doesn't cover, on an onlay or veneer, or on an anterior tooth; a crown margin with no crown, a
  restoration by surface under a crown; a post or core without a crown, a cast post with another core, a post over a short
  fill, a separated instrument or missed canal in a root the film doesn't show on its own, both in one root; a widened PDL
  with a lesion; a crown fracture on a posterior tooth, a cusp the tooth hasn't got, a fractured cusp or a crack under a
  full crown, a horizontal root fracture on a multirooted tooth, a vertical root fracture's pocket outside 5-12 mm. **A
  vertical root fracture on a vital, unrestored tooth is an error** (it follows root canal treatment, a post or a large
  restoration: give the tooth one of them). A bridge: two abutments in one arch with a tooth between, every pontic
  missing, every run of pontics with an abutment at each end, the abutments crowned, one material across the bridge. Recurrent
  caries only at a proximal margin that is restored (or crowned); caries on a restored surface must say whether it is
  recurrent. Nothing of v2.1's on a missing tooth or an implant.
- **Impossible combinations**: a restoration, caries, an endo filling, a lesion or a furcation on a missing tooth; a
  furcation on a tooth or an entrance that has none (the library knows a maxillary first premolar's mesial and distal
  entrances, and that a film rarely shows them); an implant with a root's things (a filling, caries, a lesion); a
  bitewing of an incisor or canine, or of one arch; a full-mouth view whose box counts aren't the record's.
- **`expect`**: what the key relies on (kind, stage, grade, extent, triggers, maxInterdental, maxRBL, `rt`, `impl`); it
  fails if the numbers give something else.
- **Answerable from what's shown**: a question says what its key rests on, `rests: ["stage", "grade", "extent", "rt",
  "furc", "impl", "kind", "endo", "fracture", "resto"]`, and CI fails when the pictures and rows it shows don't include it (stage: the chart of the
  tooth with the worst interdental CAL, or the film of the one with the worst bone loss, plus what raised the stage; grade:
  the film and the age, and the smoking and HbA1c rows, or the row that makes it Grade C; extent: the teeth-involved row; endo: a periapical (a film or the
  full-mouth series: a bitewing stops short of the apices); fracture: a crack never from a film (the odontogram, or a row
  with the bite test or transillumination), a vertical root fracture from a periapical or its chart, a horizontal one from
  a periapical, a crown or cusp fracture from a film, the odontogram or the view (a cusp from the view only when buccal);
  resto: a film, the odontogram or the view, and a film for an overhang, an open margin or recurrent caries).
  It is the twin of `hide`, which stops a picture from giving the answer away.
- **The numbers an explanation quotes**: `says: { "stage": 3, "maxInterdental": 6 }` on a question; each must be what the
  record gives and must appear in the question's text.

Also, by hand: **nothing in a picture may give the answer away** ([diagrams-anima](../rules/diagrams-anima.md)); every
choice gets its why ([every-choice-gets-a-why](../rules/every-choice-gets-a-why.md)); `ref: [{ label, go }]` adds "In the
notes" buttons. Numbering is universal, in viewer order (the patient's right on your left), upper arches crowns down on
the chart and the film. Look at it on a phone and in dark mode before the PR, in a scripted browser with the class's data
stubbed ([preview-and-release-test](../rules/preview-and-release-test.md)). A new module goes to Sam with its first case,
the way a figure does ([diagram-review](../rules/diagram-review.md)).

## Where the anatomy comes from

Wheeler's Dental Anatomy, Physiology and Occlusion (crown and root sizes, outlines, contacts, roots and trunks); Newman and
Carranza's Clinical Periodontology (furcation entrances, the crest's height in health, the pocket base against the crest);
White and Pharoah's Oral Radiology (what a periapical, a bitewing and a full-mouth series show, the film sizes, how bone
loss, furcations, caries, restorations, crown materials, posts, fills and fractures look); Sturdevant's Art and Science of
Operative Dentistry (the preparation outlines a restoration's shape follows, inlays, onlays and veneers); Rosenstiel, Land and
Fujimoto's Contemporary Fixed Prosthodontics (reduction and margins by crown material, posts and cores, pontics and
connectors); Cohen's Pathways of the Pulp (fill length and quality, post space, separated instruments, missed canals, cracked
teeth, vertical root fractures); Andreasen's Textbook and Color Atlas of Traumatic Injuries to the Teeth (crown and
horizontal root fractures); the 2017 AAP/EFP classification (staging, grading, extent) and the peri-implant case definitions, as the hubs
teach them. Their text and images are never copied; what is labeled and keyed follows the lecture
([outside-sources-for-figures](../rules/outside-sources-for-figures.md)). Every patient is made up; everything is original SVG.

Related: [build-a-hub](build-a-hub.md) · [diagram-review](../rules/diagram-review.md) ·
[figures-teach-the-lecture](../rules/figures-teach-the-lecture.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[the v2 task](../tasks/done/2026-11-06-patient-box-v2-modular-cases.md) · [the perio hub note](../hubs/perio.md) ·
[verify-before-pushing](verify-before-pushing.md)
