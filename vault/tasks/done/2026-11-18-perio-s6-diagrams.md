---
type: task
status: done
hub: perio
created: 2026-11-18
requested-by: Sam
due: 2026-11-19
agent: Claude Code
pr:
---

# Perio Session 6: the diagram candidates

## Goal

S6 (Periodontal Regeneration) went to taught on 2026-11-18 ([its task](2026-11-03-perio-s6-regeneration-taught.md)).
Building it includes the diagram review ([diagram-review](../../rules/diagram-review.md)): these candidates were put to Sam in
one message (Sam, 2026-11-18: "Diagram candidates for S6: put them to me in one message and build the ones I approve. If
there isn't time, write a follow-up task"). Build the ones Sam approves; note the skipped ones here and in the hub note.

## Context

- Hub note: [perio](../../hubs/perio.md) (its "Diagram decisions" list what was approved and skipped before; the first review's
  four Perio candidates, 2026-10-14, came before S6 existed)
- Rules: [diagram-review](../../rules/diagram-review.md), [diagrams-anima](../../rules/diagrams-anima.md),
  [figures-teach-the-lecture](../../rules/figures-teach-the-lecture.md), [outside-sources-for-figures](../../rules/outside-sources-for-figures.md)
- Where Perio's figures are built: `tools/figures/perio/` (`build.mjs` writes `hubs/perio/content/figures.js` and `.css`;
  placed with `figByLec` in `content/core.json`). Perio's page weight is near its budget (the inbox line of 2026-11-14): check
  `node tools/release/perf.js` or keep each figure small.
- What each one teaches is in S6's notes (`hubs/perio/content/notes.json`) and its Exam Hints; the class recording is in Drive
  (Periodontology → hubs, `en-FA2026_DENT2145-VT_Lecturecapture_AVLC (1).txt`; never commit it).

## The candidates

1. **The race for the space** (S6 Fig 1). A section through an intrabony defect beside a cleaned root, the flap over it,
   with three settings: *no barrier* (the flap's epithelium runs down the root and the site heals as a long junctional
   epithelium, a pocket again), *GTR membrane* (the membrane between flap and defect; bone, PDL and new cementum fill it),
   and *graft under the membrane* (combination therapy: the graft holds the space). A time slider (a week, six weeks, months)
   shows epithelium fast and bone slow. Supports `q6-W01`, `q6-S06`, `q6-L16`, `q6-L17`, `q6-S04`, `q6-L03`, `q6-L01`,
   `q6-M01`. Under the notes (after "The race for the space") and in Review's toolbox section. Medium; about 2 hours.
2. **Counting the walls** (S6 Fig 2). One defect beside a root, drawn in 3-D, set to 3-wall, 2-wall, 1-wall, the opening
   case's combination (about 3 mm of 3-wall at the base, 4-6 mm of 2-wall, a 1-wall part at the crest) or horizontal bone
   loss ("no defect to fill"), with the radiograph each one gives beside it: why a defect that is obvious on a film has
   usually lost its buccal or lingual wall, and why a deep probing with a faint shadow is the better candidate. Supports
   `q6-02`, `q6-L09`, `q6-F07`, `q6-F02`, `q6-N01`, `q6-T03`, `q6-L10`, `pc-e1`. Under "Which defects regenerate" and
   "Finding the defect before surgery". Medium to large; about 3 hours (the walls have to be right).
3. **The decision tree, step by step** (S6 Fig 3). Reynolds 2015 as a flowchart you walk: patient factors first, the site
   assessment, under 3 mm (probing 5 mm or less without bleeding: non-surgical; over 5 mm: osseous surgery) or 3 mm and more,
   then the walls and width to the treatment, with the esthetic-risk branch (avoid the membrane). A case (`q6-P04`'s #30) can
   light its path. He told the class to study it. Supports `q6-L27`-`L32`, `q6-P04`. In Review's risk assessment and decision
   tree section, and under the notes. Medium; about 1.5 hours.
4. **Vertical to horizontal** (S6 Fig 4). The canine case before and after: a vertical defect filled to a horizontal crest,
   the fuzzy crest before and the dense crest (crestal lamina dura) after, and a cut through the H-shaped root (two canals)
   showing why floss bridges the concavity and an interdental brush reaches it. Supports `q6-W02`, `q6-F04`, `q6-T08`. Under
   the canine case in the notes. Small to medium; about 1 hour.
5. **Subtraction radiography** (S6 Fig 5). Two standardized films, one inverted and laid over the other, so what stayed the
   same cancels and only the bone gained shows; a slider from baseline to 6 months to the subtraction image. Supports
   `q6-L22`. Under "What can you achieve, and how do you know?". Small; about 45 minutes.

## Done when

- [x] Sam's answer for each candidate written here and in the hub note's "Diagram decisions"
- [x] Each approved figure built in `tools/figures/perio/`, placed under the S6 notes or in Review, checked against the notes
      and its questions, with its sources ("What this shows, and what's simplified")
- [x] `node tools/figures/perio/build.mjs`, `node tools/hub-next/build.mjs --hub perio`, CI passes

## Log

- 2026-11-18: written with the S6 taught PR; the five candidates were put to Sam in one message.
- 2026-11-18: Sam: "yes to all diagrams. merge when ready". All five built the same day, while the S6 PR merged.

## Outcome

Sam, 2026-11-18: **"yes to all diagrams. merge when ready"**. All five approved, all five built as anima figures in
`tools/figures/perio/` and placed under the S6 notes, each at the end of the section it explains, in As taught and Plain
English (`FIG_PLACE` in `content/figures.js`; `figByLec` lists them in lecture order):

1. **The race for the space** (`race.mjs`, S6 · Fig 1, after "The race for the space"): no barrier, a GTR membrane or a
   graft under the membrane, a time slider from surgery to months later and "Run the race"; the root and the outcome read
   out (repair, a long junctional epithelium, or regeneration). Sources: Melcher 1976; Caton, Nyman & Zander 1980; Nyman et
   al. 1982; Gottlow et al. 1986; Polimeni et al. 2006. The membrane's sag without a graft and the timing are illustrative.
2. **Counting the walls** (`walls.mjs`, S6 · Fig 2, after "Which defects regenerate"): 3-, 2- and 1-wall, the opening case
   and horizontal loss in 3-D, with a narrow or wide angle, a drawn film and "Mineral lost along the beam" against a 50%
   mark. Sources: Goldman & Cohen 1958; Papapanou & Tonetti 2000; Steffensen & Weber 1989; Bender & Seltzer 1961 (the
   mineral loss a film needs). The 1-wall part's height is illustrative.
3. **The decision tree, step by step** (`dtree.mjs`, S6 · Fig 3, after "Risk assessment and the decision tree"): Reynolds
   et al. 2015, walked one answer at a time or along the `q6-P04` #30 mesial case; high esthetic risk strikes the membrane
   options. Esthetic risk is asked before the defect's configuration (the slide weighs them alongside), and the case's
   steps are inferred from its stem.
4. **Vertical to horizontal** (`vtoh.mjs`, S6 · Fig 4, after "Bone grafts: the canine case"): the canine case's films
   before and after, and a cut through the H-shaped root with floss or an interdental brush. The fuzzy and dense crest
   reading is from the Jeffrey case in class, drawn on the canine's films (the figure says so). Sources: Wheeler's, White &
   Pharoah, Carranza.
5. **Subtraction radiography** (`subtr.mjs`, S6 · Fig 5, after "What can you achieve"): five steps from the presurgical
   film to the subtraction image, the bone gained in green ("that green part", in class). Sources: Ziedses des Plantes 1935;
   Webber et al. 1982; Gröndahl et al. 1983.

Not in Review: the candidates named Review sections too, but a Review `figs` section also draws under the notes, so each
figure is placed once, in the notes. `figures.js` is fetched only with the notes, so Perio's page-weight budget (885 KB, a
Home visit) didn't change. Checked: the five on the S6 notes page at 390 px in light and dark, both reading levels, no
console errors or sideways scroll; `node tools/figures/perio/build.mjs --check`, `node tools/hub-next/build.mjs --check`,
the fast checks and the Perio smoke test. PR: see `pr:` above.
