---
type: hub
tags: [hub, live]
hub: occlusion
status: live
---

# Occlusion

Dr. Givan's D2 Occlusion course. Two exams: the midterm (Wed Oct 21, L1-L5, done) and the **final (Mon Nov 16, 6:30-7:45 pm, the midterm's window, moved up from Thu Nov 19;
not comprehensive: L6 on, building on the midterm)**. The hub now leans to the final. Its lectures are Dr. Givan's except
**L9 `nccl`, Noncarious Cervical Lesions, Dr. Lawson's** (prerecorded for the 11/12 session; added 2026-11-10). Dates and check-in hours: `HUBS` in
`index.html`.

## Before you work on it

- **Source:** `hubs/occlusion/index.html` (single file), except the generated blocks below.
- **Lectures:** L1-L5 carry `exam:'midterm'`, L6 `instruments`, L7 `malocclusion`, L8 `dentures` and L9 `nccl` carry `exam:'final'`.
  **Each new final lecture:** add it with `exam:'final'`, add it to `MOCK_BLUEPRINT`, and update `EXAM_INFO`, `COURSE_DATES`,
  the hints banner, the mock intro, the Home notice ("New: ..."), the dashboard card and the same words in
  `next/index.html`'s `SH_HUB`. All nine tag colors are in use (L9 is `slate`, added 2026-11-10): a tenth lecture needs a
  new one in the tag CSS (light and both dark blocks). The mock stays at 45 questions, 80 s each (the midterm's pace),
  split over the final's lectures until the format is announced: 12 each from L6-L8 and 9 from L9 (2026-11-10; it was
  15 each before L9); with a fifth final lecture, 9 each.
- **No fact more than twice** (Sam, 2026-11-10, [decisions](../decisions.md)): a concept may be asked two ways, not for every
  concept. `mo-10` was retired for it, and on 2026-11-11 the rest of the final's questions were checked the same way
  ("check the rest of the final questions"): 58 facts in L6-L9 were asked three to five times, and 58 questions came out,
  so every fact is now asked at most twice (the list is in the PR, [#318](https://github.com/smcmurry6-source/study-hubs/pull/318)).
  **How it was counted:** every statement of a two-statement or numbered item counts as asking its fact, a which/whichf
  item counts for its key, a case question for what it applies, and a fact asked in two lectures counts across both. The
  two kept are in different formats where possible, a Patient Box question is kept over a plain one, and nothing was
  retired that would leave a fact unasked or a lecture under its format minimums. The 10% fact is now in `in-2s-4` and
  `mo-tf-3`. **Before adding a final question, check its fact isn't already asked twice.** Don't add questions for it.
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
  **L9 (`nccl`, Dr. Lawson)** is built from his prerecorded lecture for the 11/12 session (`en-Dr. Lawson NCCLs.txt` in
  Occlusion/Hubs/Final; no slides yet, so its badge says "Recording"; the transcript is not in the repo). Its questions
  are `nc-*` and `cs-nc-*` on three text-only Patient Box cases (`ncbrush`, `ncgrind`, `ncacid`). Where it meets L7 the
  notes say both: Dr. Lawson teaches abfraction as one of three causes, with a night guard for it; Dr. Givan's L7 slides
  call it supported in vitro but unproven clinically. Restoring follows both (his "cleansable, doesn't hurt, doesn't look
  bad, not deep" and L7's "when necessary"). Names spelled by ear, the judgment calls, the slides check and the other
  11/12 lecture: [task](../tasks/2026-11-10-occlusion-l9-follow-ups.md).
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
  - The anima figures are numbered Fig 1-26 (plus Fig 2b) in lecture order; a new one takes the next free number.
  - **An alias shows a figure under a second lecture** without a second copy of its drawing: an entry
    `{ id, alias, lec, title, caption, data }` in `anima/index.mjs` (after the figure it copies); `build.mjs` gives it the
    original's markup and live code, and `data` overrides the original's. `erosion9` is Fig 19 under L9: `start` opens it
    on bulimia and `extra` adds L9's reasons to the bulimia and NCCL summaries (`erLive` reads both).
  - L9's figures draw what the L9 notes teach, with sources cited in each one's "What this shows" block. `abfract`
    (Fig 24) bends a mandibular premolar as a cantilever about the bone crest (exaggerated about 100x), the load on the
    buccal cusp's outer incline pushing the crown lingually, so the buccal side is tensile. `cupping` (Fig 26) is a
    mandibular first molar's mesial cusps in section; its pH scale places the critical pHs at about 6.3 (dentin) and 5.5
    (enamel) but labels only their order, since the lecture gave no numbers. `buffer` (Fig 25) computes both drinks'
    pH: A an unbuffered strong acid, B citric acid from its three pKa values, sized so A takes 5 drops and B 40.
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
- **Narration:** `audio/<lecture>-full.mp3` and `-plain.mp3` for all nine lectures. The notes are template literals,
  not the one-line objects `tools/narrate.py` reads, so L8 was narrated through a small wrapper that evaluates READINGS
  and calls `narrate.spoken()` / `narrate.render()` (spoken "1/16" as "one sixteenth", "11/5" as "November fifth").
  L9 the same way ("11/12" as "November twelfth", "lower-RDA" as "lower RDA"); the lexicon gained NCCLs, Dzakovich,
  chelator, exostoses, tori, subgingivally and CEJ for it.
- **Timmy Time:** the midterm episode (`tools/podcast/occlusion/script.md`); there is no final episode yet.
- **Arcade:** the Freeway Space Arcade, skin `OCCL_SKIN`. Lab Escape is a painted backdrop (`img/lab-escape.webp`) with
  hotspots measured onto it: a new backdrop means re-measuring every `api.spot()`.

## The new version (the redesign, not live yet)

`hubs/occlusion/next/` is the redesigned Occlusion, built beside this one ([phase 1](../tasks/done/2026-11-05-redesign-phase-1-hub-engine.md))
and switched in at the [release](../tasks/2026-11-06-redesign-release.md). Until then **edit content in the live file only**:
- `node tools/hub-next/build.mjs` rewrites `next/content/` from `hubs/occlusion/index.html` (its `LECTURES`, `QUESTIONS`,
  `QUESTION_WHY`, `READINGS`, hints, cram, review tables, `PCASES`, the generated figure and arcade blocks). Run it after any
  change to the live hub and commit the JSON; CI's "generated files are current" step fails when it's stale.
- The page itself (`next/index.html`) is settings only: `window.SH_HUB` holds the words the live hub writes in its own code
  (the Home exam card, the hints banner, the mock's blurb, the arcade's games and which one is up front). When one of those
  changes in the live hub (the final's format, a new lecture's dates), change it there too.
- Its art (tint `#2747a3`, emblem, masthead, medals) is `widget/hub-art/occlusion.js`, built by
  `node tools/figures/site/build.mjs` from `tools/figures/site/`.
- The build raises the figures' 9-10.5 px text to 11 px (the redesign's floor); the live hub keeps its sizes.
- Narration and the podcast are the live hub's files (`audio/`), loaded from `../audio/`.
- The "which statement" formats (2026-11-10) reach `next/content/` through the build, and their choices shuffle
  there too; the new engine's type filter lists them (since phase 2's Heme & Endo Exam 2, 2026-11-11).
- Test it only through the preview (`node tools/preview/serve.js`, then `/hubs/occlusion/next/`): opened any other way,
  the page sends you to the live hub, and a plain static server would reach the class's data.
- `SH_HUB.home.prof` and `SH_HUB.hints.prof` say "Dr. Givan", so the new Exam hints read "What Dr. Givan said to know"
  and "In Dr. Givan's words" though L9's hints are Dr. Lawson's. `widget/hub.js` builds "In " + prof + "'s words", so
  "the professors" would read wrong: word it per lecture (or plural) before the release. Since phase 2 the engine takes
  `SH_HUB.hints.words` for that heading (Heme & Endo Exam 2: "In the professors' words").
- Since 2026-11-11 (Sam's look at Heme & Endo Exam 2's new version: "more color"), **each lecture has its own color** here too,
  from the engine, by its place in `LECTURES` (L1 blue, L2 orange, L3 teal, L4 magenta, L5 olive, L6 violet, L7 mustard, L8
  sky, L9 brown), and the notes have **Notes done**. A lecture added at the end takes the next color; one inserted earlier
  shifts the rest.
- Since 2026-11-11 (Sam: "Redesign the timmy time ui/card"), **More > Timmy Time** is the engine's own page: the shared
  player (`widget/podcast.js`) fills the slot and `podDress` in `widget/hub.js` lays it out (the episode on the hub's color
  with Timmy in headphones, the chapters always open, then what the class thinks; `.pod-x` in `widget/hub.css`). This is
  the only hub on the engine with an episode so far, so check it here after any change to the player. Home's animated card
  is unchanged.

## Diagram decisions

- 2026-10-14 (first review): all four candidates of that review skipped.
- 2026-10-20: Sam approved ten anima figures for L1-L5 (all built). 2026-10-27: four for L6 (built).
- 2026-11-03: five for L7 (built 2026-11-04: `tolerance`, `stability`, `splints`, `thirds`, `erosion`;
  [task](../tasks/done/2026-11-03-occlusion-l7-diagrams.md)). L1-L7's diagram reviews are done; don't propose these again.
- 2026-11-05: Sam approved all four L8 candidates (the three schemes in motion, ridge resorption,
  support/stability/retention, posterior tooth forms); built the same day as Figs 20-23 (`resorb`, `ssr`, `schemes`,
  `toothforms`; [PR #260](https://github.com/smcmurry6-source/study-hubs/pull/260)). L8's diagram review is done; don't
  propose these again.
- 2026-11-10: Sam approved all four L9 candidates ("make all diagrams"); built the same day as Figs 24-26 (`abfract`,
  `cupping`, `buffer`) plus `erosion9`, Fig 19 again under L9 opened on bulimia
  ([task](../tasks/2026-11-10-occlusion-l9-follow-ups.md)). L9's diagram review is done; don't propose these again.

## Drawn Patient Box cases

The hub loads the shared case kit (`widget/cases.js`, 2026-11-05) and has an empty `PCASES` between its `pcases`
markers, so a Patient Box question can name a case (`pcase`) and get a chart, film and drawn view from its numbers
([draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md)). Its own case pictures (`CASE_IMG`, `pimg`: casts,
marks, the TMJ view) stay as they are; use the kit for any new perio chart or radiograph.

- **"Which statement" items** (2026-11-10, [rule](../rules/which-statement-questions.md)): `which()` and `whichf()` sit right
  after `nums()`, followed by two of each for L6-L8 (`in-`, `mo-`, `dn-` + `ws-`/`wf-`); L9's (`nc-ws-*`, `nc-wf-*`) sit
  with its other questions. Each new final lecture needs at
  least one of each (CI); the midterm lectures are grandfathered. `rv-mip-dynamic`, `rv-cf` and `ap-mip` are tagged `which`.

## Pending

- [The final's time and format](../tasks/2026-11-03-occlusion-final-time-and-format.md)
- [L9's diagrams, Dr. Lawson's slides and the other 11/12 lecture](../tasks/2026-11-10-occlusion-l9-follow-ups.md)
- Figure questions the 2026-11-04 audit left for Sam (the notes don't settle them; listed in [PR #232](https://github.com/smcmurry6-source/study-hubs/pull/232)):
  the TMJ figure's TM ligament shortens as the condyle translates while its readout says "taut"; Fig 2b's swing is
  exaggerated (about 9°); group function's lower partners (#26-28) are inferred; the thirds (Fig 18) are counted from the
  central fossa (Okeson), and the notes don't say from which end; the contact map's distal band (c..d) against the sheet's
  "oblique ridge to distal fossa"; case `sda` says "flared and worn ... see the chart", which a perio chart can't show.

History: grep `Occlusion` in "Recent major changes" (`DEPLOY_NOTES.md`). Data: `LESSONS.md` → Live signals.

Related: [home](../home.md) · [diagrams-anima](../rules/diagrams-anima.md) · [perio](perio.md) (same final day)
