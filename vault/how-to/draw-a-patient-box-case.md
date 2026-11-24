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
  lesion by surface (`restoMM`, `cariesMM`), a molar's buccal grooves (`buccalGroovesMM`), an incisor seen from the side
  (`proxOutlineMM(n)`, with `proxCrownMM`, `mkProxRoot` and the crown's labiolingual sizes in `LL`; incisors only so far) and
  a tooth's place along the arch (`archMM`), so the two can't disagree. Drawn from it: the arcade's Stage & Grade tile
  (`stageMolar()` in `tools/figures/site/arcade.mjs`), its Pocket Showdown and Cross-Section tiles (`boardTooth()`,
  `sectionMolar()`, `sectionIncisor()`, 2026-11-24) and the ModuPro hand-off's typodont (`TYPO` in `widget/journeys.js`,
  which fetches the library itself).
- **`widget/cases.js` + `widget/cases.css`, the case kit** (`window.shCases`), which reads the library. One record per case
  draws every picture, the Patient Box rows and the key (`derive()`), and `validate()` rejects numbers outside clinical
  ranges, numbers that disagree with each other and impossible combinations. CI runs it on every hub and on
  `tools/cases/examples.json` (`node tools/ci/cases.js`).

## A hub on the engine

Put the cases in `content/core.json` as `pcases` (an object, id → case) and name one from a question with `pcase`. The
engine loads `teeth.js` then `cases.js` and `cases.css` only on a hub that has cases, draws the pictures in the Patient
Box, and puts the case's rows above the question's own `pbox` rows. Nothing else to wire. (The old single-file hubs, all
down since 2026-11-19, loaded the two scripts by hand: `teeth.js` first.)

**Start from an example**: `tools/cases/examples.json` has ten made-up patients built from modules, with a question or two
each using `rests` and `says`: a full mouth, a molar furcation, since v2.1 (2026-11-21) a bridge with a post and core
(`v21-bridge-post`), a trauma case (`v21-trauma`) and decay seen from the buccal (`v21-buccal-decay`), and since v2.2
(2026-11-24) proximal root caries (`v22-root-caries`), a retained root and a root tip (`v22-root-tips`), the four kinds of
resorption (`v22-resorption`), sealants and temporaries (`v22-sealants-temps`) and a cracked tooth found by its tests
(`v22-cracked-tooth`). Copy one, change it, run `node tools/ci/cases.js`.

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
| `restoration` `{ tooth, surfaces, material, type, overhang, open, temp }` | `amalgam`, `composite`, `gold`, `ceramic` or (v2.2) `temporary` by surface (`MOD`; `B`/`F` and `O`/`I` are taken for the tooth's own). A film draws the preparation's outline from the crown's own surface, so it meets the outside exactly: O in the middle of the crown under the cusps with its outline following them, a box per proximal surface with smooth walls, rounded line angles and a flat floor about 2.8 mm under the contact, a buccal-groove extension for OB, a cervical oval for a B or L alone (Class V), Class III and IV on an incisor or canine; metal bright white, composite about enamel's brightness or a little more, ceramic about dentin's, a ceramic inlay or onlay outlined on the tooth's side by its brighter resin cement, and the cusps over an occlusal restoration enamel to the outline (no sliver of dentin between them). `type`: `direct` (the default), `inlay` (gold or ceramic, walls flared), `onlay` (gold or ceramic, the cusps capped: gold 1.5 mm, ceramic 1.8 mm) or `veneer` (ceramic or composite, the labial surface of an incisor, canine or premolar). `overhang` and `open` (`m`, `d` or `md`): an overhang is a ledge of the material past the box's gingival margin, bulging into the embrasure (White and Pharoah); an open margin a dark band under the gingival floor from the surface to the axial wall. `material: "crown"` with `crown`: `gold`, `pfm`, `zirconia`, `lithium` (lithium disilicate) or `ssc` (stainless steel), each over its own preparation (Rosenstiel's reductions and margins: a PFM's metal coping under its porcelain, which is about as radiopaque as dentin; zirconia nearly as bright as metal, hiding the preparation almost entirely; lithium disilicate between dentin and enamel, nearer dentin, the preparation and the pulp seen through it, outlined by its resin cement; an SSC's thin shell with no preparation to speak of, on a molar only), or (v2.2) `provisional` (a temporary crown on the preparation its definitive crown will take, drawn as a metal-ceramic one's: on a film darker than dentin, so the preparation shows through it, set with a bright zinc oxide-eugenol line; `T` on the odontogram); `crown: true` (or none) is v1's crown, drawn as before; `open`/`overhang` on a crown are its margin. **A temporary filling** (v2.2): `material: "temporary"` with `temp` `irm` (the default) or `cavit`, placed directly (no inlay, onlay, veneer, overhang or open margin); on a film brighter than enamel with the small dark voids of a hand-packed material, over a dark cotton pellet in the chamber when it seals a root-filled tooth's access (it counts as that access's restoration); IRM ivory and Cavit pinkish white on the view; sand with two dots on the odontogram |
| `caries` `{ tooth, surface, depth, recurrent }` | `enamel`, `dentin` or `pulp`. On a film a proximal one is a triangle in the enamel just cervical to the contact, and from `dentin` a second one spreading along the DEJ toward the pulp horn; an occlusal one shows only in the dentin; a B or L one is a faint round shadow. `recurrent: true`: at a restoration's margin, M or D, a smooth-edged lesion under the gingival floor and along the axial wall, as deep as `depth` (enamel a notch at the margin, dentin into the dentin short of the pulp, pulp reaching it); under a crown, on the root just apical to its margin. Red, hatched, on the odontogram (recurrent: hatched the other way). **Decay seen from the buccal** (2026-11-21): `stage: "white-spot"` or `"cavitated"` (by default an enamel lesion is a white spot, a dentin or pulp one cavitated; a white spot is enamel only), `arrested: true` (brown and hard instead of chalky), `root: true` (root caries on the exposed facial or lingual root: needs at least 1 mm of recession at that surface's middle site, depth `dentin` or `pulp`, never on a crowned tooth; since v2.2 also on `M` or `D`, proximal root caries under the contact, which needs that side's interdental site receded at least 1 mm, facial or lingual, and its bone crest at least 2.5 mm from the CEJ: a film draws a saucer-shaped notch cut into the root between the CEJ and the crest, deepest toward the CEJ, its inner edge ill defined; the view doesn't show it, and a film can't tell an arrested one, so a question about one gives the exam in a row), and `recurrent: true` on `B`/`F` at a buccal margin (a Class V, a veneer or a crown). The view draws a buccal lesion where the chart puts the gingival margin: a crescent along it in the gingival third (a chalky white spot, or a brown cavity in a chalky rim; dark and rimless when arrested), root caries as a shallow yellow-brown band on the root between the CEJ and the margin (dark when arrested), recurrent caries as a brown-gray band at the Class V's or veneer's gingival edge or on the root under a crown's margin, and an incisor's or canine's proximal lesion into the dentin as a gray shadow through the labial enamel by the contact; a premolar's or molar's proximal lesion, an occlusal one and a lingual one don't show from the buccal. A lesion under the gingiva (a crown margin with no recession) is drawn but covered. On a film a buccal white spot given as one doesn't show, and root caries is a faint shadow on the root |
| `endo` `{ tooth, fill, lesion, post, core, sep, missed, widened }` | a root canal filling (`fill: false` for none; `true` is v1's; or `adequate`, `short` (more than 2 mm short of the radiographic apex), `long` (past it, with a puff of sealer) or `voids`; with one the chamber is filled too, the gutta-percha fills each canal wall to wall, a maxillary molar's or first premolar's palatal root as well, and a tooth without a crown shows its access cavity opened through the occlusal (an incisor's or canine's lingual), as wide as the chamber with its walls flaring a little to the occlusal, and filled with its restoration's material: amalgam under an amalgam, composite otherwise (Cohen). That tooth needs its access restored: a restoration with O (a premolar or molar) or L (an incisor or canine: an `L` composite there is drawn as the access itself), or a crown; a veneer alone doesn't count) and a periapical `lesion` mm across: the PDL space widening toward the apex, the lamina dura gone there, into a soft-edged radiolucency; `widened: true` the widened PDL alone. `post`: `cast` (one casting with its core), `metal` (prefabricated, parallel) or `fiber` (barely brighter than dentin), leaving 4-5 mm of gutta-percha; `core`: `amalgam`, `composite` or `cast`; both under a crown. `sep`: a separated instrument in that root's apical third; `missed`: that root's canal unfilled (a molar's mesial or distal) |
| `fracture` `{ tooth, type, ... }` | `crown` (an incisor or canine: `depth` enamel, dentin or pulp, `side` m or d; the corner gone on the film and the view, the dentin's band and the pulp's dot on the view), `cusp` (a premolar or molar: `cusp` B, L, MB, DB, ML or DL), `crack` (no film shows it: the odontogram's dashed line, and a row for the bite test), `vrf` (a vertical root fracture, `side`, `root`: a J-shaped radiolucency along the root on the film and a narrow pocket, `pd` mm (default 8), at the middle site of `surface` f or l on the chart) or `hrf` (a horizontal root fracture `at` cervical, middle or apical, a single-rooted tooth: a thin line across the root) |
| `roottip` `{ tooth, kind, len, root }` | v2.2. `kind: "retained"`: the crown lost to decay about a millimeter above the CEJ, the root in its socket (a ragged top with a band of soft decay and the chamber open on a film; a tan stump with a brown top on the view, where it shows above the gingiva; the crown crossed out and the root drawn solid with a bar on the odontogram); nothing of a crown's (no restoration, caries, fracture, sealant, resorption, root canal filling: an overdenture abutment isn't drawn yet), a periapical lesion allowed (`endo` with `fill: false`). `kind: "fragment"`: a root tip left in a healed socket after an extraction, the tooth otherwise missing: the apical `len` mm (1.5 to 6, default 4) of one `root` (one the film shows; the first by default), its coronal end broken obliquely, with its canal, PDL space and lamina dura, under a healed ridge a little concave over the socket; on the odontogram the tooth crossed out, its root dashed, and a bar with the solid tip past it. Alone, or under a pontic |
| `resorption` `{ tooth, type, ... }` | v2.2, one of each type a tooth. `internal` (`at` cervical, middle or apical, `size` 1-4 mm, no wider than the root allows, `root`; not in a root-filled canal): a smooth oval widening of the canal, centered on it, the canal's outline lost in it. `cervical` (external cervical, `side` m, d, f or l, `heithersay` 1-4, `root`): below the CEJ (under the enamel from class 2), as long and as deep as its class; on M or D a ragged notch from the root's surface toward the canal that stops short of it, on F or L an irregular radiolucency over the canal with the canal's walls still drawn through it, mottled with bone from class 2, and on the facial from class 2 a pink spot through the cervical crown on the view. `apical` (`mm` 1 to the lesser of 5 and a third of the root, `root`): the root shorter and its end blunted. `replacement` (ankylosis: `side` m, d or md, `at`, `mm` 2 to the lesser of 10 and 60% of the root): along that much of the root the PDL space and lamina dura gone and the bone running into the root; the tooth must have mobility 0, and a percussion test on it must say `metallic`. A diamond on the root on the odontogram |
| `sealant` `{ teeth, surfaces }` | v2.2. `O` on a premolar or molar (the default), `B` a mandibular molar's buccal pit, `L` a maxillary molar's palatal groove or a maxillary incisor's lingual pit; not on a crowned tooth, a restored surface, or over caries into the dentin or a cavity (it may go over a non-cavitated enamel lesion: ADA and AAPD 2016). No film draws one (it is thin and no brighter than enamel); the view draws a buccal pit's, opaque white; the odontogram fills the surface green |
| `bridge` `{ abutments: [a, b], material }` | a fixed bridge: crowns of `material` (`pfm`, `gold`, `zirconia` or `lithium`; never `ssc`, and lithium disilicate only in front of the molars) on the two abutments, a pontic at every tooth between them, joined by connectors on the film, the chart, the view and the odontogram (the charting convention: a bar across the units, the pontic's crown drawn and its root crossed out with an X). The teeth between must be in the `missing` module |
| `bone` `{ teeth, percent, pattern, defect, side, rec, swell, furc, mob }` | bone loss (% of the root; a number or `{ tooth: % }`), horizontal or `vertical` with `defect` mm on `side` `m` or `d`; then CAL at all six sites so the pocket base sits about 1 mm coronal to the crest, recession (`rec` facial mm, the lingual 1 less), probing depth (at least 2 mm; `swell` adds a pseudopocket), furcations that follow the bone past the trunk (Class I within 1.5 mm, II from 1.5 mm past, III from 4 mm) and mobility that follows the bone (1 from 55%, 2 from 70%) |
| `bop`, `pus`, `plaque` `{ rate, teeth }` | that share of the sites, the deepest first |
| `recession` `{ teeth, mm }` | facial recession at the middle site |

**The record** also holds `age`, `sex`, `smoke` (cigarettes a day; 0 = doesn't smoke), `hba1c`, `medical`, `cc` (the chief
complaint), `mouth` (`teeth` present, `lost` to periodontitis, `involved`, `stage4` complexity factors) and, since v2.2, `tests`:
the clinical tests, each a row of the Patient Box (`Bite test`, `Transillumination`, `Percussion`), so a crack's finding lives
in the case, not in a question's `pbox`. `{ test: "bite", tooth, result: "positive" | "negative", cusp, release }` (`cusp` and
`release`, pain sharpest on letting go, only on a positive one; a positive one needs a crack, a fractured cusp, a vertical root
fracture or apical periodontitis, and `release` a crack or fractured cusp, `cusp` one that is fractured if any is);
`{ test: "transillumination", tooth, result }` (never through a crown; positive, the light stopping at a line, needs a crack or
fractured cusp); `{ test: "percussion", tooth, result: "normal" | "tender" | "metallic" }` (tender needs apical periodontitis, a
crack or a fracture; metallic is an ankylosed tooth's, and replacement resorption needs it). One of each test a tooth, on a tooth
in the case that is there (not missing, an implant or a retained root). Pulp tests (cold, EPT) aren't in the kit yet. **A case
without its own `box` gets its rows from the record** (`shCases.rows`), so the age, smoking and teeth the question shows
are the ones the key was worked out from. **`full: true`** makes it a full-mouth case: every tooth not named is drawn healthy,
and `validate()` checks `mouth.teeth`, `involved` and `lost` against the record.

The v1 per-tooth fields still work, alone or under modules: `pd`, `rec`, `bop`, `pus`, `plaque` (three sites a surface, in
tooth terms `[mesial, middle, distal]`), `mob`, `furc { f, l }`, `furcX`, `bone { m, d }`, `vdef`, `calc`, `amalgam`,
`crown`, `endo`, `implant { w, len, baseline, cement, cover }`, `halo`, `missing`, and v2's `resto`, `caries`, `lesion`, and
v2.1's `margin`, `apdl`, `fx`, `pontic` and `abut` (written by the modules above). `calc` draws calculus on a film as a small, irregular
radiopaque spur on each proximal root surface just apical to the CEJ (about half a millimeter thick, 1 to 2.5 mm long, never
past the crest: White and Pharoah, Newman and Carranza), and on the view as a yellow-tan band on the cervical third with an
irregular edge, thickest toward the line angles and tapering off where the margin climbs a papilla (v2.1).
Defaults are a healthy site: `pd 2, rec -2` (CAL 0).

## The pictures (`figs`, or a question's `pfig`)

`chart` (the probing chart and its numbers), `film` (a periapical), `view` (the drawn buccal view), each of one arch and of
the case's `teeth` or the figure's own `teeth`; `bitewing` (`teeth`: the premolars and molars of one side, both arches, in
Class I occlusion, each tooth at its place along the arch: on a `full` case the neighbors in the film's 31 mm width show
too, cut off at its edges); `fmx` (the full-mouth series, mounted as a real one: 14 periapicals, the anterior films upright
at 23 x 37 mm and the posterior ones across at 36 x 30.5 mm, each showing its stretch of the arch with the apices in, upper
films above and lower below, the 4 bitewings between them under their posterior films, R and L on the mount; on a phone it
scrolls sideways); `odontogram` (the whole mouth, five surfaces a tooth: one row an arch on a wide screen, one row a quadrant
on a phone; materials in colors told apart without color too (caries is hatched, a crown is ringed and lettered, an inlay or onlay
boxed, a veneer outlined, ceramic lighter than composite and gold), the root canal filling
and the periapical lesion drawn past the tooth toward its apex, a key under it, and the chart as text).
The view also draws what of a restoration shows from the buccal (2026-11-21): a Class V, a buccal-groove extension (OB), an
onlay's cap over the buccal cusps, a Class III or IV (faint when placed from the lingual; a lingual surface not at all), a
crown or veneer by material, and of a Class II's proximal box only a sliver at the crown's outline (its buccal wall just clears
the contact); an overhang, an open margin and a box's gingival floor lie under the papilla and don't show.
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
  vertical root fracture on a tooth with no root canal treatment or restoration** is an error on an incisor, canine or
  premolar; on a molar the fracture module must say `vital: true` (an attrited molar of an older patient, the way the rare
  untreated ones present: Liao 2017). A stainless steel crown only on a molar (AAPD). A root-filled tooth without its access
  restored (above). A bridge: two abutments in one arch with a tooth between, every pontic
  missing, every run of pontics with an abutment at each end, the abutments crowned, one material across the bridge, and that
  material gold, PFM, zirconia or lithium disilicate (lithium never on a molar abutment). Recurrent
  caries only at a margin that is restored (or crowned): proximal, or buccal at a Class V, a veneer or a crown; caries on a
  restored or veneered surface must say whether it is recurrent. Decay seen from the buccal: a white spot only in the enamel;
  root caries only on a facial or lingual root exposed by recession, never in the enamel or on a crowned tooth (that is recurrent
  caries at its margin); `stage` and `arrested` only on a primary lesion; no caries field the kit doesn't know. Nothing of v2.1's on a missing tooth or an implant.
- **v2.2's findings**: proximal root caries without interdental attachment loss at its side (the modules table); a retained root
  with anything of a crown's or a root canal filling; a root tip on a present tooth, of a root the film doesn't show, or outside
  1.5-6 mm; resorption of an unknown type, two of one type on a tooth, a field its type doesn't take, internal resorption wider
  than the root allows or in a root-filled canal, a Heithersay class outside 1-4, apical resorption past a third of the root,
  replacement resorption on a mobile tooth; a sealant on a surface it doesn't fill (an incisal edge, a maxillary molar's buccal), on
  a crown or a restored surface, or over dentin caries or a cavity; a temporary that isn't direct, a `temp` the kit doesn't know
  or on another material, an overhang or open margin on one; a test the kit doesn't have, on a tooth that isn't there, twice on
  one tooth, or with a result the record can't explain (above). `tools/ci/cases.js` holds a record for each call.
- **Impossible combinations**: a restoration, caries, an endo filling, a lesion or a furcation on a missing tooth; a
  furcation on a tooth or an entrance that has none (the library knows a maxillary first premolar's mesial and distal
  entrances, and that a film rarely shows them); an implant with a root's things (a filling, caries, a lesion); a
  bitewing of an incisor or canine, or of one arch; a full-mouth view whose box counts aren't the record's.
- **`expect`**: what the key relies on (kind, stage, grade, extent, triggers, maxInterdental, maxRBL, `rt`, `impl`); it
  fails if the numbers give something else.
- **Answerable from what's shown**: a question says what its key rests on, `rests: ["stage", "grade", "extent", "rt",
  "furc", "impl", "kind", "endo", "fracture", "resto", "caries", "roottip", "resorption", "sealant"]`, and CI fails when the pictures and rows it shows don't include it (stage: the chart of the
  tooth with the worst interdental CAL, or the film of the one with the worst bone loss, plus what raised the stage; grade:
  the film and the age, and the smoking and HbA1c rows, or the row that makes it Grade C; extent: the teeth-involved row; endo: a periapical (a film or the
  full-mouth series: a bitewing stops short of the apices); fracture: a crack never from a film (the odontogram, or a row
  with the bite test or transillumination), a vertical root fracture from a periapical or its chart, a horizontal one from
  a periapical, a crown or cusp fracture from a film, the odontogram or the view (a cusp from the view only when buccal);
  resto: a film, the odontogram or the view, and a film for an overhang, an open margin or recurrent caries at a proximal
  margin; caries: a buccal lesion from the view where it shows above the gingiva (or the odontogram or an exam row, except a
  white spot's, root lesion's or arrested lesion's look, which only the view shows), a proximal lesion from a film or the
  odontogram (from the view only an incisor's or canine's into the dentin), an occlusal one from a film once in the dentin or
  the odontogram, a lingual one from the odontogram or a row, proximal root caries from a film only, and an arrested one also
  with the exam (hard, shiny) in a row; `rests: ["caries"]` covers every lesion in the record, so show what shows each;
  roottip: a root tip from a periapical or the odontogram, a retained root from any film, the odontogram, or the view where its
  stump is above the gingiva (it needs recession); resorption: a periapical, external cervical from any film; sealant: the
  odontogram, a row that says so, or the view for a buccal pit's; a crack's bite test or transillumination counts from the
  record's own `tests` rows).
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
Operative Dentistry (the preparation outlines a restoration's shape follows, inlays, onlays and veneers; Class V and Class III
lesions, and what of a restoration shows from the buccal); for decay seen from the buccal, Fejerskov, Nyvad and Kidd's Dental
Caries (where smooth-surface lesions form, active against arrested), the ICDAS II visual criteria (Ismail 2007), Nyvad and
Fejerskov's root caries criteria (1982) with Banting's root caries index, and Mjor and Toffenetti (2000: secondary caries mostly
at the gingival margin); Rosenstiel, Land and
Fujimoto's Contemporary Fixed Prosthodontics (reduction and margins by crown material, posts and cores, pontics and
connectors); Cohen's Pathways of the Pulp (fill length and quality, post space, separated instruments, missed canals, cracked
teeth, vertical root fractures); Andreasen's Textbook and Color Atlas of Traumatic Injuries to the Teeth (crown and
horizontal root fractures); the 2017 AAP/EFP classification (staging, grading, extent) and the peri-implant case definitions, as the hubs
teach them.

**Patient Box v2.1's clinical calls** (Sam, 2026-11-21: "Use outside sources to determine answers"; the citations are in
`widget/cases.js`'s header): how bright each material is on a film, from studies that measure it against an aluminum step
wedge (Pekkan, J Prosthet Dent 2011: zirconia about a base metal's, e.max Press and feldspathic porcelain no different from
dentin; Atala, J Esthet Restor Dent 2019: e.max CAD equal to dentin; Erzurumlu, Clin Oral Investig 2021: e.max CAD and Vita
Mark II above dentin, resin cements above enamel; Hitij and Fidler, Clin Oral Investig 2013: every composite above dentin, most
above enamel; Balci, Oper Dent 2023: amalgam highest, enamel about 2 mm of aluminum to the millimeter and dentin about 1); the
access cavity's outline (Cohen's; ADEX's endodontic criteria: directly over the chamber, the roof removed) and why it must be
restored (Ray and Trope, Int Endod J 1995: the coronal restoration's quality matters to the periapex as much as the
filling's); veneers on root-filled anteriors (Gresnigt, Dent Mater 2019: survival like vital teeth's, the lingual access still
filled with composite); fill length (Sjogren, J Endod 1990; Schaeffer, White and Walton, J Endod 2005) and the gutta-percha
left under a post (Rahimi, J Oral Sci 2008: more is better from 4 to 6 mm); onlay reduction (Sturdevant's: gold 1.5 mm over the
functional cusps; the IPS e.max chairside preparation guide: ceramic 1.5-2.0 mm); stainless steel crowns (AAPD, Pediatric
restorative dentistry, 2026: primary teeth and permanent molars); untreated vertical root fractures (Liao, J Endod 2017 and J Pers
Med 2021); calculus on a film (Buchanan, J Periodontol 1987, and Hyer, J Periodontol 2021: films show about half of proximal
deposits, the thick, extensive ones); and how a pontic is charted (dental assisting charting conventions: an X through the
missing tooth's roots, the crowns outlined, a line joining the units).

**Patient Box v2.2's clinical calls** (2026-11-24, the same way; the citations are in `widget/cases.js`'s header): proximal root
caries forms only on a bared root, and proximal surfaces are among the most affected (Katz, Caries Res 1982), seen on a film as a
saucer-shaped radiolucency between the CEJ and the crest, told from cervical burnout (White and Pharoah); retained roots and root
tips as the commonest finding on films of edentulous jaws (Sumer, Quintessence Int 2007; Kose, J Adv Prosthodont 2015), told
from bone by their canal, PDL space and lamina dura; resorption by type (Patel and others, J Endod 2010 and 2009; Heithersay's
classes, Quintessence Int 1999; Andreasen and Hjorting-Hansen, Acta Odontol Scand 1966, for replacement resorption and the
ankylosed tooth's metallic sound); sealants (the ADA and AAPD guideline, Wright, JADA 2016; their radiopacity, Celikel 2024);
temporary materials' radiopacity (Tanomaru-Filho, J Appl Oral Sci 2008, for IRM; DuBois, Mil Med 2000, for Cavit), the depth of
Cavit that seals (Webber, Oral Surg 1978) and provisional crown materials' (Pekkan 2011); and the cracked tooth's tests (Cameron,
JADA 1964; the AAE's Cracking the Cracked Tooth Code, 2008; Cohen's). Their text and images are never copied; what is labeled and keyed follows the lecture
([outside-sources-for-figures](../rules/outside-sources-for-figures.md)). Every patient is made up; everything is original SVG.

Related: [build-a-hub](build-a-hub.md) · [diagram-review](../rules/diagram-review.md) ·
[figures-teach-the-lecture](../rules/figures-teach-the-lecture.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[the v2 task](../tasks/done/2026-11-06-patient-box-v2-modular-cases.md) · [the perio hub note](../hubs/perio.md) ·
[verify-before-pushing](verify-before-pushing.md)
