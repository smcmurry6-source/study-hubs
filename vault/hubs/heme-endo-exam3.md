---
type: hub
tags: [hub, live]
hub: heme-endo-exam3
status: live
---

# Heme & Endo Exam 3

DENT 2160 Hematology & Endocrinology, Exam 3: **35 multiple-choice questions, new material only** (the syllabus), Fri Nov 20,
8:00-9:30 am (the dental sitting; optometry at 10:00), in person on Canvas with LockDown Browser. Its lectures (the course
schedule): **A** Dental endocrinology clinical application (Dr. Taylor, taught 11/6, moved here from Exam 2), **L17** Pregnancy
and lactation (Dr. Madison, 11/10), **L18** Estrogens and androgens (Dr. Fasinu, 11/11), **L19** Introduction to hematology
(Dr. Herr, 11/17), **L20** Lymphomas and leukemias (Dr. Borak, 11/17), **L21** and **L22** Pathology of the male and female
reproductive systems (Dr. Dal Zotto, 11/18). The count per lecture hasn't been announced. Exam date and check-in hours: its
entry in `hubs.js`.

## Before you work on it

- **Source of truth:** `hubs/heme-endo-exam3/content/` (the JSON is where it is edited; then
  `node tools/hub-next/build.mjs --hub heme-endo-exam3`), and `index.html`'s `SH_HUB` for the hub's own wording (Home, hints,
  mock, arcade). Built on the engine from the start ([build-a-hub](../how-to/build-a-hub.md)).
- **Art: Heme & Endo Exam 2's, reused** (Sam, 2026-11-15: "you can reuse the art that was made for endo exam 2"; an exception
  to [every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)): `tools/figures/site/` gives `heme-endo-exam3` Exam
  2's tint, emblem (the thyroid on the trachea with a drop of blood), masthead (thyroid chart, insulin, glucose meter, blood
  tubes, red cells) and medal glyph, and `widget/ranks.js` its medal; `widget/hub-art/heme-endo-exam3.js` is the same art as
  `heme-endo-exam2.js` under this hub's id. The arcade is Exam 2's **Cycle Arcade** (`content/arcade.js` and `arcade.css`,
  copied from Exam 2's redesign version; `HUB_ID` is this hub's, so its scores are its own), with the Path Lab Escape's story
  moved to the week of Exam 3.
- **Lecture A came over whole** from Exam 2 ([the carry-over task](../tasks/2026-11-10-heme-endo-exam3-carry-lecture-a.md)):
  the Exam 2 page at `43ece52` (the last commit with A) was run through the old converter (`tools/hub-next/build.mjs` as of
  `d86f134^`, which read a single-file hub) and A's pieces were kept unchanged: its notes at both levels, its 58 questions
  (same `dc-` ids, retired in Exam 2's registry, live in this hub's), 15 hints, 11 High Likelihood topics, review tables, three
  Side by side tables, three processes and its sort set. Its narration was made again for this hub (all three levels). Its
  content flags (kept as taught) are in that task note.
- **L17 and L18** were written from their slides and recordings (Drive transcripts `GMT20261110-195437`, 1:54 pm, and
  `GMT20261111-190049`, 1 pm; every caption is labeled "Michael Herr", the room's Zoom account). **L19 and L20** are written
  from their slides only (taught Tue 11/17): their `status` is `slides`, a `note` under the title says so, and they have no
  hints yet. **L21 and L22 aren't in the hub yet**: their slides weren't posted when it was built. Both are
  [a task](../tasks/2026-11-16-heme-endo-exam3-l19-l22.md).
- **Sources:** Drive, "Hematology and Endocrinology" → "Hubs" → "Exam 3" (L17-L20's slides and the two transcripts), and the
  course's learning objectives ("Exam 1" folder). **Not used**, by the [graded-coursework](../rules/graded-coursework.md) rule:
  the Exam 3 Anki deck in that folder (a previous year's practice questions), everything in "Resources from D3s", Quiz 4 (open
  until 11/19), the crosswords and the take-home.
- **The mock** gives each lecture 5 questions (one per hour of class, since no count per lecture was announced), at the exam's
  pace (35 in 90 minutes): 25 now; with L21 and L22, the exam's 35 in 90 minutes (`core.json` `mock`).
- **Figures:** Sam said yes to every candidate (2026-11-16). They are anima figures in `tools/figures/heme-endo-exam3/` (one
  module each; `index.mjs` finds them; `node tools/figures/heme-endo-exam3/build.mjs` writes `content/figures.js` and
  `figures.css`; `preview.mjs <id>` draws one on its own). Where each sits in the notes: `FIG_PLACE` in `content/figures.js`
  (by the start of a heading's text at each level) and `figByLec` in `core.json`. Helpers and palette are Exam 2's
  (`shared.mjs`, `makeFig`).
- **Narration:** `hubs/heme-endo-exam3/audio/<lecture>-full|plain|hy.mp3` with their words files
  (`python3 tools/narrate.py heme-endo-exam3 --lec <id> --level <level> --force`); High yield again after any change to a
  lecture's notes, topics, hints or questions, then the content build. No Timmy Time episode yet.
- **Quirks:** `SH_HUB` has no `exam` key on purpose: with one, the engine counts only lectures whose `exam` matches, so
  nothing would count. Lecture A's id is `dental` and its label "A".

## Content flags (kept as taught; check when a recording or review lands)

- **A:** in [the carry-over task](../tasks/2026-11-10-heme-endo-exam3-carry-lecture-a.md).

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam3`
([L19 to L22](../tasks/2026-11-16-heme-endo-exam3-l19-l22.md)).

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam3`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam2](heme-endo-exam2.md) · [heme-endo-exam1](heme-endo-exam1.md)
