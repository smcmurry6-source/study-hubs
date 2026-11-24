---
type: task
status: open
hub: widget
created: 2026-11-20
requested-by: Sam
due: 
waiting-on: the next hub with dental Patient Box cases
agent: 
pr: 
---

# Patient Box v2: the steps after v2.0

## Goal

v2.0 shipped the tooth library, the modules, the odontogram, bitewing and full-mouth views and the new checks
([the v2.0 task](done/2026-11-06-patient-box-v2-modular-cases.md)). This note holds the rest of its Order (steps 2-5) and
what v2.0 left, so it isn't lost. Its own track (Sam, 2026-11-06, [decisions](../decisions.md)).

## Context

- How a case is written now: [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md). The examples:
  `tools/cases/examples.json`. The library: `widget/teeth.js`; the kit: `widget/cases.js`; CI: `node tools/ci/cases.js`.
- Sam's call that stands: **a new module goes to Sam with its first case**, the way a figure does
  ([diagram-review](../rules/diagram-review.md)). v2.0's modules and views have no case on a live page yet (no live hub has
  dental cases since Perio's page came down, 2026-11-19), so their first real cases are the next hub's.

## Done when

- [ ] The next hub with dental cases: its first cases use modules, and Sam approves each new module and view with its first
      case (restoration, caries, endo, the odontogram, the bitewing, the full-mouth series)
- [ ] The next hub with dental cases ships a `content/figures.js` (an empty `window.SH_FIGURES = function(){ return {}; };`
      is enough) and `figures.css`, or `needFigures()` in `widget/hub.js` stops waiting on them: it loads the hub's figure
      file before it draws any case question, and Review of Systems has none, so a case question there never draws (found
      2026-11-24, drawing a sample case for Sam)
- [ ] The About page gets the new kinds of picture (odontogram, bitewing, full-mouth series) when a live hub first shows one
      ([about-page](../rules/about-page.md))
- [x] Restorations and caries (Order step 2, Sturdevant's): preparation outlines that follow the crown's own surface (smooth
      walls, rounded line angles, flat gingival floors), inlays, onlays, veneers, crowns by material, overhangs, open
      margins and recurrent caries under a restoration (v2.1, 2026-11-21); the odontogram's marks still go to Sam with
      their first case (the box above)
- [x] Endodontic findings (step 3, Cohen's Pathways of the Pulp): a widened PDL before a lesion, short, long and voided
      fills, posts and cores, a separated instrument, a missed canal (v2.1)
- [x] Fractures (Sam, 2026-11-21): crown, cusp, crack, vertical and horizontal root fractures, on every view, with the checks
      that keep a question off a picture that can't show one (a crack on no film) (v2.1)
- [x] The four calls v2.1's review left, settled from outside sources (Sam, 2026-11-21: "Use outside sources to determine
      answers"; citations in `widget/cases.js`'s header): zirconia drawn nearly as bright as metal and lithium disilicate between
      dentin and enamel, nearer dentin, feldspathic porcelain about dentin's and composite about enamel's (Pekkan 2011, Atala
      2019, Erzurumlu 2021, Hitij and Fidler 2013); the access cavity as wide as the chamber with walls flaring to the occlusal,
      lingual on an anterior (Cohen's, ADEX); the calculus spur kept (films show only thick deposits: Buchanan 1987, Hyer 2021);
      the pontic's root crossed out with a full X and a key entry (the charting convention)
- [x] A root-filled incisor or canine with only a veneer now fails `validate()`: its lingual access needs its own composite
      (`L`, drawn as the access), as a posterior one needs a restoration with O (Ray and Trope 1995; a veneer on a root-filled
      tooth is accepted, Gresnigt 2019, but doesn't seal the access)
- [x] Decay seen from the buccal (Sam, 2026-11-21, [decisions](../decisions.md): the view shows fillings and decay, "Yes"):
      cervical (Class V) lesions as a crescent along the gingival margin, a white spot told from a cavity, arrested lesions
      brown, root caries on a root exposed by recession, recurrent caries at a Class V's, veneer's or crown's buccal margin, an
      incisor's proximal lesion as a shadow through the labial enamel; the view's restorations checked (a Class II box's sliver
      at the outline, nothing of a lingual surface); `rests: ["caries"]` and the validate rules (root caries needs recession);
      example `v21-buccal-decay` with `v21-ex-5` (branch `claude/patient-box-buccal-decay`)
- [ ] Sam looks at decay seen from the buccal with its first case, the way the first box says
- [x] Proximal root caries (a lesion under the contact on a root exposed by interdental attachment loss, a film finding): the
      kit draws root caries on the facial and lingual only (v2.2, 2026-11-24: `root: true` on M or D, a saucer-shaped notch on
      a film between the CEJ and the crest; it needs interdental recession and bone loss at that side, the view doesn't show it,
      and an arrested one needs the exam in a row; example `v22-root-caries`)
- [ ] Sam still looks at v2.1's drawings with their first case (crown materials, posts, fractures, bridges, the redrawn
      fillings and calculus, and the answers above), the way the first box says
- [x] Root tips, resorption, sealants and temporary restorations (left out of v2.1; optional in Sam's ask) (v2.2: the
      `roottip` module, retained or a fragment in a healed socket; `resorption`, internal, external cervical by Heithersay's
      class, external apical and replacement; `sealant` on O, a mandibular molar's B, a maxillary molar's or incisor's L;
      `material: "temporary"` with `temp` IRM or Cavit, and the `provisional` crown; on every view and in the checks, with
      `rests` `roottip`, `resorption` and `sealant`; examples `v22-root-tips`, `v22-resorption`, `v22-sealants-temps`)
- [x] A crack's own row: the kit has no bite-test or transillumination field, so a crack question gives its finding in the
      question's `pbox`; a `tests` field in the record would put it in the case's own rows (v2.2: `tests`, the bite test,
      transillumination and percussion, each a Patient Box row, each result checked against the record; example
      `v22-cracked-tooth`)
- [ ] Sam looks at v2.2's drawings with their first case (proximal root caries, the retained root and the root tip, the four
      resorptions and the pink spot, sealants, temporary fillings and the pellet, the provisional crown, and their odontogram
      marks), the way the first box says
- [ ] Pulp tests in `tests` (cold and the electric pulp test), with a pulp diagnosis to check them against: v2.2 left them out
- [ ] On the drawn chart, a long upper root's apex runs under its tooth's mobility label ("M0"): the premolars of
      `v2-molar-furcation` and `v22-root-tips` show it (from before v2.2)
- [x] Implants on modules (step 4): an `implant` module for what is per-tooth numbers today (v2.3, 2026-11-24: `{ m:'implant' }`
      with its state (health, mucositis, peri-implantitis, failed, healing under its cover screw), width and length by site,
      crown material, cement or screw retention, excess cement, the delivery film's bone, recession, swelling, bleeding and
      suppuration; the 2017 case definitions and the lecture's failure rule in `derive()`; the distances to a tooth and between
      implants, the pocket base against the bone and the rest in `validate()`; every view draws it; examples
      `v23-implant-states` and `v23-implant-anterior`)
- [x] Prosthodontics and other hubs (step 5): fixed bridges are done on every view (v2.1), and since v2.3 an implant-supported
      bridge (two implants, one pontic, never joined to a tooth; example `v23-implant-bridge`); still to do: removable partial and
      complete dentures, a cantilever or resin-bonded bridge, and ~~Occlusion's `CASE_IMG` pictures onto the kit~~ (dropped:
      Occlusion's page came down 2026-11-19, so no page draws them); with the dentures, an overdenture abutment (a root-filled
      retained root under a denture, which v2.2's `roottip` refuses for now) and a provisional bridge (v2.2 has the provisional
      crown only) (v2.4, 2026-11-24: `{ m:'denture' }`, partial with its connector, clasps, RPIs and rests and the Kennedy class
      `derive()` works out, or complete over its overdenture abutments; the bridge module's `cantilever`, `type: "resin-bonded"`
      and `material: "provisional"`; every view draws them; examples `v24-partial-class-i`, `v24-partial-class-ii`,
      `v24-complete-overdenture`, `v24-cantilevers` and `v24-resin-bonded`; a front space's labial flange, 2026-11-24:
      `v24-front-flanges`)
- [ ] Sam looks at v2.4's drawings with their first case (on the view, the denture's pink base and teeth, the clasp arms, the
      RPI's plate and I-bar and the rests, a front space's gum-fitted teeth and full labial flange, and with the denture out the
      resorbed ridge and an overdenture abutment's dome; on the
      film the ridge, the dome and its seal, the resin-bonded wing, the cantilever's joins and the provisional bridge; the
      odontogram's denture marks and key), the way the first box says
- [ ] An implant-retained overdenture (attachments on implants under a complete denture): `validate()` refuses an implant under
      a complete denture for now; with it, a root's attachment or coping, and a vital overdenture abutment (v2.4 draws the
      root-filled, domed and sealed one only)
- [ ] An overdenture abutment under a partial denture, and caries on one (the commonest way they're lost: Ettinger and Qian
      2004): v2.4 refuses both
- [ ] A cantilever on implants, and a molar cantilevered as a premolar-sized pontic on two splinted premolars: v2.4 refuses
      both (the molar is in the sources; the pontic's smaller size isn't drawn)
- [ ] Sam looks at v2.3's drawings with their first case (the implant crown by material on the film, the screw access channel,
      the excess cement, the failed implant's radiolucent line along its taper, the abutment and threads on the view, the chart's
      submerged implant, the odontogram's cover screw, the implant bridge), the way the first box says
- [x] Sam's call (v2.3): for a patient with no earlier records, the 2017 consensus calls it peri-implantitis only with bleeding
      or suppuration **and** probing of 6 mm or more **and** bone 3 mm or more below the implant's most coronal intraosseous part;
      the PCD Implants lecture teaches the probing and the bone as either one. `derive()` follows the lecture
      ([figures-teach-the-lecture](../rules/figures-teach-the-lecture.md)); a case that should read the same both ways has both
      (Sam, 2026-11-24: "Go with outside sources": `derive()` now follows the consensus, and `validate()` refuses a record without
      records that has bleeding and only one of the other two; [decisions](../decisions.md))
- [ ] An implant placed too close (under 1.5 mm from a root or 3 mm from another implant) isn't drawn: `validate()` refuses it,
      so a case about that mistake (the crestal bone it costs: Tarnow 2000, Esposito 1993) needs a flag that allows it and draws
      the loss
- [ ] Two implants carry a four-unit bridge under an opposing complete denture or a light bite (the lecture's exception):
      `validate()` refuses more than one pontic on two implants because the record has no opposing arch; with the dentures
- [ ] An implant's healing abutment (one-stage, or after uncovering), an immediate implant in a fresh socket, and a mucosa
      inflamed at one implant only on the drawn view (the view's `gingiva.look` is the whole case's; one implant's mucositis
      shows as its bleeding dots): v2.3 draws the cover screw and the loaded implant only
- [ ] If PCD Implants Exam 1's page ever comes back, its four implant cases (in git before 6727d7f) move onto the `implant`
      module with the same ids and keys: three of them fail v2.3's pocket-base rule as written (they gave facial numbers only, and
      the lingual defaults sit 4 mm above their bone)
- [x] More figures from the library as they're next touched: `widget/journeys.js`'s typodont (`TYPO`) still carries its own
      copy of the size table and outlines, and the arcade's other tooth tiles (Pocket Showdown, Cross-Section) are drawn by hand
      (2026-11-24: the typodont reads `widget/teeth.js`, which `handoff()` fetches, and draws the same 13,498 numbers as before;
      Pocket Showdown's molars, Occlusion's Cross-Section molar and Perio's Cross-Section incisor are drawn from the library,
      the incisor from its new proximal view)
- [ ] The rest of the arcade's hand-drawn teeth onto the library when they're next touched: Mind the Pocket's tooth,
      Million-Dollar Smile's teeth and the cards' crowns in `tools/figures/site/arcade.mjs` (the `TEETH` comment there)
- [ ] The library's proximal view for canines, premolars and molars: `proxOutlineMM()` draws incisors only (Wheeler's
      mesial aspect; the outline between his landmarks is schematic) and returns null for the rest
- [ ] If Perio's page ever comes back, its eleven cases (in git before 6b32460) move onto modules with the same ids and keys

## Log

- 2026-11-20: written by the v2.0 session with what it left.
- 2026-11-21: Patient Box v2.1 (branch `claude/patient-box-v2-1`): crown materials, inlays, onlays and veneers, endodontics,
  fractures, margins and bridges, the filling and calculus redraw, examples 3 and 4. Ticked steps 2 and 3; added what it
  left.
- 2026-11-21: v2.1's art and code review (same branch): an uncrowned root-filled tooth's access cavity, gutta-percha wall to
  wall and in the palatal root, the overhang and open margin redrawn, recurrent caries by depth (and on the root under a
  crown), cusps over an occlusal restoration enamel to the outline, ceramic's cement line, zirconia and lithium disilicate's
  radiopacity, calculus smaller and irregular on films and tapered on the view, the horizontal root fracture ending at the
  root's surface; the bridge materials checked, data-built class names whitelisted and the chart table escaped, the
  odontogram's key wrapping on a phone and ceramic lighter there. Added two boxes above.
- 2026-11-21: v2.1's open questions answered from outside sources (branch `claude/patient-box-v2-1-answers`): radiopacity,
  the access cavity and the rule that it is restored, the veneer, stainless steel crowns on molars only, an untreated vertical
  root fracture only on a molar marked `vital`, onlay reduction by material, the pontic's chart mark. Ticked the two boxes;
  Sam's look with the first case stays open.
- 2026-11-21: decay seen from the buccal (branch `claude/patient-box-buccal-decay`, on top of #526): the view's lesions, its
  restorations rechecked, the `caries` rests and validate rules, example 5. Ticked its box; added Sam's look and proximal root
  caries.
- 2026-11-24: the typodont and the arcade's tooth tiles from the library (branch `claude/typodont-and-tiles-from-library`):
  `buccalGroovesMM()` and the incisors' proximal view (`LL`, `proxOutlineMM()`) added to `widget/teeth.js`; the typodont's own
  tables taken out of `widget/journeys.js`; Pocket Showdown and both Cross-Section tiles redrawn. Ticked its box; added the
  arcade's other teeth and the proximal view for the other teeth.

- 2026-11-24: Patient Box v2.2 ([#551](https://github.com/smcmurry6-source/study-hubs/pull/551), branch `claude/patient-box-v2-2`, from `main` at 6038dee): proximal root caries, root tips
  and retained roots, resorption, sealants, temporary fillings and provisional crowns, the clinical tests (`tests`), each call
  cited in `widget/cases.js`'s header; five examples and six questions in `tools/cases/examples.json`; a record for each rule in
  `tools/ci/cases.js`; the how-to. Also fixed: a crowned tooth on the drawn chart looked natural in the dark theme. Ticked the
  three boxes; added Sam's look, pulp tests, the chart's mobility label and the overdenture abutment. **Where it stopped:** the
  kit is done for this package; next are the implant module (step 4), then dentures and bridges (step 5), each from `main`
  once this merges.
- 2026-11-24: Patient Box v2.3 (branch `claude/patient-box-v2-3`, from `main` at ef1ee24): the `implant` module and an
  implant-supported bridge on every view, each call cited in `widget/cases.js`'s header (the 2017 World Workshop, the PCD Implants
  lectures, Tarnow 2000, Wilson 2009 and the rest); three examples and six questions in `tools/cases/examples.json`; a record for
  each rule and each of `derive()`'s readings in `tools/ci/cases.js`; the how-to. Also: a failed implant's radiolucent line
  follows its taper (v1 drew a box), and a full-mouth view's tooth count leaves implants out, as `validate()` does. Ticked step
  4 and the implant bridge in step 5; added Sam's look, the and/or call, an implant placed too close, the four-unit bridge, the
  healing abutment and one-site mucositis, and PCD Implants' old cases. **Where it stopped:** next is step 5's dentures (with the
  overdenture abutment and the four-unit implant bridge) and the cantilever and resin-bonded bridges, from `main` once this
  merges.
- 2026-11-24: Patient Box v2.4 (branch `claude/patient-box-v2-4`, from `main` at 84f3a29): the `denture` module (partial and
  complete, overdenture abutments, the Kennedy class by Applegate's rules) and the bridge module's cantilever, resin-bonded and
  provisional bridges, on every view, each call cited in `widget/cases.js`'s header (McCracken's, the Glossary, Kratochvil 1963,
  Krol 1973, Zarb's, Crum and Rooney 1978, Shillingburg's, Kern 2005 and 2011 and the rest); five examples and ten questions in
  `tools/cases/examples.json`; a record for each rule, each question's pictures and each Kennedy class in `tools/ci/cases.js`;
  the how-to. Also, at Sam's word ("The way the gingiva is handled needs to be better. It looks bad"), the view's gum redone on
  every case: one smooth ridge over a gap (Tan 2012), the dark of the mouth past the gum, a mound under an overdenture abutment,
  a rounded collar for a bounded denture base (the PR has before and after); then, at Sam's word again, the papillae (one U per
  tooth from tip to tip, Becker 1997, Tarnow 1992) and the framework's metal (tapered bars on the crowns' outlines). Ticked step 5 (Occlusion's `CASE_IMG` struck: its
  page came down 2026-11-19); added Sam's look, the implant overdenture, a partial overdenture and caries on an abutment, and the
  implant and molar cantilevers. The four-unit implant bridge stays its own box. **Where it stopped:** the kit is done for this
  package; what's left is above.
- 2026-11-24: the two calls #554 left (Sam: "No to canine cingulum rest, use outside sources to answer #2"). (1) No cingulum
  rest on a mandibular canine: the kit already refused it; recorded in [decisions](../decisions.md). (2) A front bounded space's
  labial flange, from Faigenblum 2023 (Prim Dent J) and Dental Update: the denture's `flange` is `none` (the teeth gum-fitted
  on the ridge, drawn as a bridge's pontics are, with their own margins and papillae), `partial` (a collar 1 mm past the
  ridge's crest) or `full` (a labial flange into the sulcus), chosen from `ridge` (to 1.5 mm, to 3, past it: the kit's
  reading, since the papers give no millimeters) and refused past those; example `v24-front-flanges` and question `v24-ex-28`;
  9 records in `tools/ci/cases.js`. Also on every view: the ridge over a gap is measured from the neighbors' mid-facial margins
  (it was from their CEJs, so a gap sat about 2 mm too deep), and a front denture base fills the cervical embrasure beside
  each abutment.
- 2026-11-24: Sam asked for a sample case. `v24-front-flanges` (with `v24-ex-28`) and `v24-partial-class-i` (with `v24-ex-19`)
  were put into a local copy of Review of Systems only, drawn by the engine on the preview's made-up data at phone width, and
  the screenshots sent to Sam in chat; nothing was committed. The first try found that a hub without `content/figures.js`
  never draws a case question (the box above). The "Sam looks at v2.4's drawings" box stays open until Sam says.

## Outcome

Related: [the v2.0 task](done/2026-11-06-patient-box-v2-modular-cases.md) ·
[draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md)
