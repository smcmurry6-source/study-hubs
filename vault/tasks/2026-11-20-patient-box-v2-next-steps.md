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
- [ ] Sam looks at v2.1's drawings with their first case (crown materials, posts, fractures, bridges, the redrawn fillings
      and calculus), the way the box above says; the screenshots are in v2.1's PR
- [ ] Root tips, resorption, sealants and temporary restorations (left out of v2.1; optional in Sam's ask)
- [ ] A crack's own row: the kit has no bite-test or transillumination field, so a crack question gives its finding in the
      question's `pbox`; a `tests` field in the record would put it in the case's own rows
- [ ] Implants on modules (step 4): an `implant` module for what is per-tooth numbers today
- [ ] Prosthodontics and other hubs (step 5): fixed bridges are done on every view (v2.1); still to do: removable partial and
      complete dentures, a cantilever or resin-bonded bridge, an implant-supported bridge, and Occlusion's `CASE_IMG`
      pictures onto the kit
- [ ] More figures from the library as they're next touched: `widget/journeys.js`'s typodont (`TYPO`) still carries its own
      copy of the size table and outlines, and the arcade's other tooth tiles (Pocket Showdown, Cross-Section) are drawn by hand
- [ ] If Perio's page ever comes back, its eleven cases (in git before 6b32460) move onto modules with the same ids and keys

## Log

- 2026-11-20: written by the v2.0 session with what it left.
- 2026-11-21: Patient Box v2.1 (branch `claude/patient-box-v2-1`): crown materials, inlays, onlays and veneers, endodontics,
  fractures, margins and bridges, the filling and calculus redraw, examples 3 and 4. Ticked steps 2 and 3; added what it
  left.

## Outcome

Related: [the v2.0 task](done/2026-11-06-patient-box-v2-modular-cases.md) ·
[draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md)
