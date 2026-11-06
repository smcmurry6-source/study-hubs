---
type: hub
tags: [hub, live]
hub: occlusion
status: live
---

# Occlusion

Dr. Givan's D2 Occlusion course. Two exams: the midterm (Wed Oct 21, L1-L5, done) and the **final (Mon Nov 16, 6:30-7:45 pm, the midterm's window, moved up from Thu Nov 19;
not comprehensive: L6 on, building on the midterm)**. The hub now leans to the final. Dates and check-in hours: `HUBS` in
`index.html`.

## Before you work on it

- **Source:** `hubs/occlusion/index.html` (single file), except the generated blocks below.
- **Lectures:** L1-L5 carry `exam:'midterm'`, L6 `instruments`, L7 `malocclusion` and L8 `dentures` carry `exam:'final'`.
  **Each new final lecture:** add it with `exam:'final'`, add it to `MOCK_BLUEPRINT`, and update `EXAM_INFO`, `COURSE_DATES`,
  the hints banner, the mock intro and the dashboard card. The mock takes 15 from each final lecture (45 questions, 80 s
  each, the midterm's pace) until the final's format is announced.
- **The final's format** isn't announced (question count, Canvas or not): `FINAL_TIME` / `FINAL_CLOSES` are `'18:30'` /
  `'19:45'`, and the dashboard's check-in button and pop-up go out at 8 pm (`checkinHour:20, promptHour:20`), after the
  window closes ([task](../tasks/2026-11-03-occlusion-final-time-and-format.md)).
- **Built on** the MSK Exam 4 engine; palette "articulating paper" (Bricolage Grotesque / Public Sans / JetBrains Mono).
  It is the model other hubs copy for `two()`, `tf()`, `nums()`, `choiceOrder()`, `whyHTML`, shared patients (`CASES`,
  `pc()`) and Patient Box pictures (`pimg`, `CASE_IMG`).
- **Sources** (Drive, Occlusion): the help sheet (`Occ Lec0 help`, Hubs folder), the Midterm and Final folders (slides,
  handouts, lecture captures). Board-exam items in last year's class deck were deliberately not reproduced.
  **L8 (`dentures`)** is built from the 11/5 recording (`occ nov 5.txt` in Occlusion/Hubs/Final) and, since
  2026-11-06, the slides and handout (`Occ Lec7 RDP Occlusion`, the course's Lecture 7, in Occlusion/Final;
  [task](../tasks/done/2026-11-05-occlusion-l8-follow-ups.md)). Where class and slides differ the notes say both
  (lingualized anterior contact: "never" in class, "difficult, can be compensated" on the slides). Hanau's term is the
  **Realeff**. L8 spells **Thielemann** (the slides); the Review lecture, `rv-thielmann*` and the podcast keep the
  spelling they were written with, "Thielmann" (Sam, 2026-11-06: leave them; no narration redo). The history slides say "No test questions", so L8 has
  no history questions (seven retired) and its Review no history rows; the notes keep the history, as narrated. Its cases are `dnflat`,
  `dnbal`, `dnret`. Its notes are narrated with `tools/narrate.py`'s `spoken()`/`render()` on the extracted
  `dentures` template literals (the hub's READINGS isn't one JSON line), substituting "one sixteenth" for 1/16 and
  "divided by" in Thielemann's formula.
- **Figures and the cusp game** come from `tools/figures/occlusion/`: `od.js` (the kit, the contact map, `CASE_IMG`
  and **`FIG_PLACE`**, which lives in the generated block: edit it in `od.js`, never in the hub), `game.js`, `cases.js`,
  and the anima figures in `anima/*.mjs`. `node tools/figures/occlusion/build.mjs` pastes them between the hub's
  `od:kit`/`od:css` and `anima:js`/`anima:css` markers; `--check` fails if they're stale; `--preview` writes pages.
  - Controls of a figure inside the notes must not use `data-go`, `data-view`, `data-tab`, `data-sub`, `data-mode`,
    `data-lec` or `data-group` (the notes and the widget read those).
  - The anima kit sets `vector-effect:non-scaling-stroke`; a path drawn with `stroke-dasharray` needs `vector-effect:none`.
  - `mounterr` (L6) is computed, not drawn to the rule: `meModel` solves protrusion in closed form for the patient and for
    casts offset on the articulator (both casts move together), and the chart's microns come from it. Its geometry and
    assumptions are in the file's header and the figure's "What's simplified"; if the notes' guidance angles or the slide's
    rule change, re-check that the four errors still come out the slide's way.
  - The side-view figures share `anima/l7rig.mjs`: a whole skull (`BACK` behind the mandible, `FRONT` over it, with
    `EDGES`, `SHADE`, `ORBIT`, `NASAL`, `EAM`), a real mandible, the disc in its true profile and the teeth, in mm (y up,
    the seated condyle at the origin, facing left), plus a contact solver run in Node at build time. `crslide` (Fig 7,
    mirrored), `hingearc` (Fig 12), `tolerance`, `stability` and `splints` (Figs 15-17) draw it. Reuse it for any new side
    view of the jaws rather than drawing another skull. Where a frame crops the skull, fade it (`rgScene`'s `fog`, or
    `rgFog`) instead of leaving a hard cut, and put labels on a soft card (`rgCard`), never across bone lines.
  - The L8 figures share `anima/l8den.mjs`: a frontal section through the first molars of a patient wearing complete
    dentures (maxilla and palate, mandible, tongue, both bases, the molars), in mm with the occlusal plane at y = 0, a jaw
    move `{dx, dy, rot}`, a lower-denture tip about its right ridge crest, separate denture offsets (`opt.up`, `ddx`/`ddy`)
    and a contact finder; plus the four posterior tooth profiles (`PROF`: anatomic 30°, semi-anatomic 20°, flat 0°,
    lingualized with a wide, shallow lower fossa). `schemes` (Fig 22) solves its poses in Node at build time, so a profile
    change re-poses it: look at every scheme and move again after one. Reuse it for any new denture section.
    Fig 20's proportions come from outside sources (2026-11-06, [outside-sources-for-figures](../rules/outside-sources-for-figures.md)):
    the mandible loses about twice the maxilla's ridge height (Tallgren), and the basal bone stays put (Cawood & Howell).
  - The anima figures are numbered Fig 1-23 (plus Fig 2b) in lecture order; a new one takes the next free number.
  - **What settles a figure's content** (audit of every figure, 2026-11-04, [PR #232](https://github.com/smcmurry6-source/study-hubs/pull/232)):
    the notes, then the help sheet's contact pictures for `CONTACTS` (Class III: #4's lingual cusp goes to the
    **mesial** fossa of #30, as the sheet draws it, though real crown widths would put it nearer the central fossa) and
    Dr. Givan's handout for the envelope's letters (both views run A-D round the shape as he numbers them 1-4; frontal:
    C = right lateral opening, D = right lateral superior). Labels and hover text name only what the lecture teaches
    ([figures-teach-the-lecture](../rules/figures-teach-the-lecture.md)): say "ear canal" (the facebow lecture's words),
    not EAM; no orbit, mastoid, sigmoid notch or postglenoid process.
  - Picture questions on the arrow figures (`fig-pmax-*`, `fig-pmand-*`) ask "which movement does arrow A show?": the
    arrows carry letters only, so the stem doesn't name the direction.
- **Select-all ticks** reach `question_choices` only from 2026-11-04 (`picks` in `occl:answered`, set in `recordAnswer`). Hubs
  copied from this engine need the same lines.
- **Narration:** `audio/<lecture>-full.mp3` and `-plain.mp3` for all eight lectures. The notes are template literals,
  not the one-line objects `tools/narrate.py` reads, so L8 was narrated through a small wrapper that evaluates READINGS
  and calls `narrate.spoken()` / `narrate.render()` (spoken "1/16" as "one sixteenth", "11/5" as "November fifth").
- **Timmy Time:** the midterm episode (`tools/podcast/occlusion/script.md`); there is no final episode yet.
- **Arcade:** the Freeway Space Arcade, skin `OCCL_SKIN`. Lab Escape is a painted backdrop (`img/lab-escape.webp`) with
  hotspots measured onto it: a new backdrop means re-measuring every `api.spot()`.

## Diagram decisions

- 2026-10-14 (first review): all four candidates of that review skipped.
- 2026-10-20: Sam approved ten anima figures for L1-L5 (all built). 2026-10-27: four for L6 (built).
- 2026-11-03: five for L7 (built 2026-11-04: `tolerance`, `stability`, `splints`, `thirds`, `erosion`;
  [task](../tasks/done/2026-11-03-occlusion-l7-diagrams.md)). L1-L7's diagram reviews are done; don't propose these again.
- 2026-11-05: Sam approved all four L8 candidates (the three schemes in motion, ridge resorption,
  support/stability/retention, posterior tooth forms); built the same day as Figs 20-23 (`resorb`, `ssr`, `schemes`,
  `toothforms`; [PR #260](https://github.com/smcmurry6-source/study-hubs/pull/260)). L8's diagram review is done; don't
  propose these again.

## Drawn Patient Box cases

The hub loads the shared case kit (`widget/cases.js`, 2026-11-05) and has an empty `PCASES` between its `pcases`
markers, so a Patient Box question can name a case (`pcase`) and get a chart, film and drawn view from its numbers
([draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md)). Its own case pictures (`CASE_IMG`, `pimg`: casts,
marks, the TMJ view) stay as they are; use the kit for any new perio chart or radiograph.

## Pending

- [The final's time and format](../tasks/2026-11-03-occlusion-final-time-and-format.md)
- Figure questions the 2026-11-04 audit left for Sam (the notes don't settle them; listed in [PR #232](https://github.com/smcmurry6-source/study-hubs/pull/232)):
  the TMJ figure's TM ligament shortens as the condyle translates while its readout says "taut"; Fig 2b's swing is
  exaggerated (about 9°); group function's lower partners (#26-28) are inferred; the thirds (Fig 18) are counted from the
  central fossa (Okeson), and the notes don't say from which end; the contact map's distal band (c..d) against the sheet's
  "oblique ridge to distal fossa"; case `sda` says "flared and worn ... see the chart", which a perio chart can't show.

History: grep `Occlusion` in "Recent major changes" (`DEPLOY_NOTES.md`). Data: `LESSONS.md` → Live signals.

Related: [home](../home.md) · [diagrams-anima](../rules/diagrams-anima.md) · [perio](perio.md) (same final day)
