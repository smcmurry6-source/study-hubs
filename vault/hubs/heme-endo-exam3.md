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
- **Lecture A came over whole** from Exam 2 ([the carry-over task](../tasks/done/2026-11-10-heme-endo-exam3-carry-lecture-a.md)):
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
- **Figures:** Sam said yes to every candidate (2026-11-16), 22 in all (two for A, five for each of L17-L20), but the hub
  was merged before they were done (Sam was running out of usage), so it **shipped with none**. Their drafts are in
  `tools/figures/heme-endo-exam3/drafts/` and each one's plan is in [the figures task](../tasks/2026-11-16-heme-endo-exam3-figures.md).
  They are anima figures: one module each in `tools/figures/heme-endo-exam3/` (`index.mjs` builds every `.mjs` there, not
  `drafts/`; `node tools/figures/heme-endo-exam3/build.mjs` writes `content/figures.js` and `figures.css`; `preview.mjs <id>`
  draws one on its own). Placed by `FIG_PLACE` in `content/figures.js` (the start of a heading's text at each level),
  `figByLec` in `core.json` and a `figs` section in the lecture's Review group. Helpers and palette are Exam 2's
  (`shared.mjs`, `makeFig`).
- **Narration:** `hubs/heme-endo-exam3/audio/<lecture>-full|plain|hy.mp3` with their words files
  (`python3 tools/narrate.py heme-endo-exam3 --lec <id> --level <level> --force`). Every lecture has As taught and Plain
  English; High yield is recorded for A only so far (the others read it in the device's voice until it is:
  [the figures task](../tasks/2026-11-16-heme-endo-exam3-figures.md) has the step). High yield again after any change to a
  lecture's notes, topics, hints or questions, then the content build. No Timmy Time episode yet.
- **Quirks:** `SH_HUB` has no `exam` key on purpose: with one, the engine counts only lectures whose `exam` matches, so
  nothing would count. Lecture A's id is `dental` and its label "A".

## Content flags (kept as taught; check when a recording or review lands)

No question's key depends on any of these.

- **A:** in [the carry-over task](../tasks/done/2026-11-10-heme-endo-exam3-carry-lecture-a.md).
- **L17 (Dr. Madison):** she ties meiosis II to ZP2 binding (textbooks: sperm entry); estrogen "raises" vaginal pH (slide:
  "buffers"); the deck uses "corona radiata" for the whole cumulus; she credits hCG itself with lowering LH and FSH (Costanzo:
  the steroids it maintains); she and the slide name only progesterone as prolactin's antagonist in pregnancy (textbooks add
  estrogen); the baby's sounds and sight "lower dopamine" (textbooks: oxytocin); speaker notes swapped on slides 7 and 8.
  Said not needed (no question on them): the cleavage stages' names, the adhesion molecules' names, the methods that keep
  sperm and egg apart, and fetal development.
- **L18 (Dr. Fasinu):** slide 5 labels DHEA "dihydrotestosterone" (he corrected it); testosterone in children "absolutely
  contraindicated" aloud vs "caution" on the slide, and estrogen in pregnancy used "in a few cases" aloud vs contraindicated
  on the slide; cypionate and ethinyl estradiol called "salts", a 3-month cypionate interval, unsure of Proscar and Propecia
  strengths; his clomiphene receptor split; two slides disagree on estrogen and LDL; brand and route errors on slide 30.
  Said not needed: the other androgen analogs (23:37), the second estrogen-effects slide (32:04), the rarely used SERMs
  (43:21). The notes write clotting factors as 2, 7, 9 and 10 so the voice reads them; questions use II, VII, IX and X.
- **L19 (slides only):** slide 4 calls NK cells "Killer T cells"; slide 6 swaps the azurophilic granule labels; slide 10
  writes micrometers as "mm"; the notes use "IgG" for any immunoglobulin; lymph node size differs between slide 30 and its
  notes; slide 40 puts "(PALS)" on the sheathed capillaries; open vs closed splenic circulation is contradictory. The notes
  follow the standard histology. Check them all against the recording.
- **L20 (slides only):** his objectives slides say no individual CD markers and not every acute leukemia type (no key
  depends on a marker); "acute leukemias are usually children" vs AML's median age of 65; ">20%" blasts on the slide vs
  the WHO's 20% or more; the Hodgkin slide drops the cell of origin (the notes give germinal-center B cells, Robbins); Ann
  Arbor staging and CRAB are images only; Auer rods "acid phosphatase-positive" on the slide (textbooks: myeloperoxidase).
  Its 10 Patient Box cases are written for the hub. Check them all against the recording.

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam3`:
[the figures and High yield narration](../tasks/2026-11-16-heme-endo-exam3-figures.md) and
[L19 and L20 to taught, L21 and L22 in](../tasks/2026-11-16-heme-endo-exam3-l19-l22.md). Shipped with 285 questions
(A 58, L17 58, L18 59, L19 55, L20 55) and 53 High Likelihood topics.

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam3`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam2](heme-endo-exam2.md) · [heme-endo-exam1](heme-endo-exam1.md)
