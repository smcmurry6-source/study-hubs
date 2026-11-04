---
type: hub
tags: [hub, live]
hub: occlusion
status: live
---

# Occlusion

Dr. Givan's D2 Occlusion course. Two exams: the midterm (Wed Oct 21, L1-L5, done) and the **final (Thu Nov 19, not
comprehensive: L6 on, building on the midterm)**. The hub now leans to the final. Dates and check-in hours: `HUBS` in
`index.html`.

## Before you work on it

- **Source:** `hubs/occlusion/index.html` (single file), except the generated blocks below.
- **Lectures:** L1-L5 carry `exam:'midterm'`, L6 `instruments` and L7 `malocclusion` carry `exam:'final'`.
  **Each new final lecture:** add it with `exam:'final'`, add it to `MOCK_BLUEPRINT`, and update `EXAM_INFO`.
- **The final's time and format** aren't announced: `FINAL_TIME` / `FINAL_CLOSES` are null
  ([task](../tasks/2026-11-03-occlusion-final-time-and-format.md)).
- **Built on** the MSK Exam 4 engine; palette "articulating paper" (Bricolage Grotesque / Public Sans / JetBrains Mono).
  It is the model other hubs copy for `two()`, `tf()`, `nums()`, `choiceOrder()`, `whyHTML`, shared patients (`CASES`,
  `pc()`) and Patient Box pictures (`pimg`, `CASE_IMG`).
- **Sources** (Drive, Occlusion): the help sheet (`Occ Lec0 help`, Hubs folder), the Midterm and Final folders (slides,
  handouts, lecture captures). Board-exam items in last year's class deck were deliberately not reproduced.
- **Figures and the cusp game** come from `tools/figures/occlusion/`: `od.js` (the kit, the contact map, `CASE_IMG`
  and **`FIG_PLACE`**, which lives in the generated block: edit it in `od.js`, never in the hub), `game.js`, `cases.js`,
  and the anima figures in `anima/*.mjs`. `node tools/figures/occlusion/build.mjs` pastes them between the hub's
  `od:kit`/`od:css` and `anima:js`/`anima:css` markers; `--check` fails if they're stale; `--preview` writes pages.
  - Controls of a figure inside the notes must not use `data-go`, `data-view`, `data-tab`, `data-sub`, `data-mode`,
    `data-lec` or `data-group` (the notes and the widget read those).
  - The anima kit sets `vector-effect:non-scaling-stroke`; a path drawn with `stroke-dasharray` needs `vector-effect:none`.
- **Narration:** `audio/<lecture>-full.mp3` and `-plain.mp3` for all seven lectures.
- **Timmy Time:** the midterm episode (`tools/podcast/occlusion/script.md`); there is no final episode yet.
- **Arcade:** the Freeway Space Arcade, skin `OCCL_SKIN`. Lab Escape is a painted backdrop (`img/lab-escape.webp`) with
  hotspots measured onto it: a new backdrop means re-measuring every `api.spot()`.

## Diagram decisions

- 2026-10-14 (first review): all four candidates of that review skipped.
- 2026-10-20: Sam approved ten anima figures for L1-L5 (all built). 2026-10-27: four for L6 (built).
- 2026-11-03: five for L7, approved, not built yet ([task](../tasks/2026-11-03-occlusion-l7-diagrams.md)).

## Pending

- [Build the five L7 diagrams](../tasks/2026-11-03-occlusion-l7-diagrams.md)
- [The final's time and format](../tasks/2026-11-03-occlusion-final-time-and-format.md)

History: grep `Occlusion` in "Recent major changes" (`DEPLOY_NOTES.md`). Data: `LESSONS.md` → Live signals.

Related: [home](../home.md) · [diagrams-anima](../rules/diagrams-anima.md) · [perio](perio.md) (same final day)
