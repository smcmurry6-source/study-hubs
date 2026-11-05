---
type: hub
tags: [hub]
hub: heme-endo-exam2
status: live
---

# Heme & Endo Exam 2

DENT 2160 Hematology & Endocrinology Exam 2: 50 questions, 45 on L11-L18 and Dr. Taylor's Lecture A, 5 on Exam 1
material. Fri Nov 13, 10:00-11:30 am (the dental sitting). Exam date and check-in hours: its `HUBS` entry in `index.html`.

## Before you work on it

- **Source of truth:** `hubs/heme-endo-exam2/index.html` (single file; edit it directly). It was generated once by a
  build script from per-lecture data files; that script isn't kept, so edit the hub itself.
- **Built on:** the PCD Implants Exam 1 engine (Home, the labeled Question Bank panel, pins, High Likelihood, the mock),
  without the Patient Box case kit (`PCASES` is empty; Patient Box questions are text boxes). Palette "Luteal" (aubergine
  ink, blush paper, a berry accent and corpus-luteum gold); Literata / Hanken Grotesk / Overpass Mono. State key
  `hee2-state-v1`, answered event `hee2:answered`.
- **Lectures:** L11 Diabetes pharmacology (`dmpharm`), L12a and L12b Endocrine pathology (`path1`, `path2`), A Dental
  endocrinology (`dental`), L13 and L14 Male and female reproductive histology (`mhisto`, `fhisto`), L15 and L16 Male and
  female reproductive physiology (`mphys`, `fphys`) and R, the **Exam 1 Refresher** (`refresh`): 81 questions copied
  from `heme-endo-exam1` (its top two High Likelihood topics per lecture, its hardest questions, format top-ups) with ids
  `r-<exam1 id>`, for the exam's five Exam 1 questions. Its notes are Exam 1's cram sheet.
- **Taught or slides-only:** L11 and L12 were written from their class recordings (11/3, 11/4). A and L13-L16 were
  written from slides (and Dr. Herr's speaker notes) before they were given, `status:'slides'`. L17 and L18 had no slides
  on 2026-11-05: [the task](../tasks/2026-11-05-heme-endo-exam2-l17-l18-and-recordings.md).
- **Sources:** Drive, "Hematology and Endocrinology" → "Exam 2" (slides, schedule, syllabus, the recordings'
  transcripts). **Not used**, by the [graded-coursework](../rules/graded-coursework.md) rule: everything in "Resources
  from D3s" (last year's Exam 2 study guide, Anki deck of practice questions, a female repro study doc), Quiz 3 (open
  until 11/12), Quiz 4, the take-home.
- **Figures:** `tools/figures/heme-endo-exam2/` (`node tools/figures/heme-endo-exam2/build.mjs`; `--check` fails if
  the hub's `anima:css`/`anima:js` blocks are stale; `place.json` puts each figure under its notes heading). Sam said yes to
  every animation (2026-11-05).
- **Narration:** `hubs/heme-endo-exam2/audio/<lecture>-full.mp3` and `-plain.mp3`, made with `tools/narrate.py`
  (`python3 tools/narrate.py hubs/heme-endo-exam2/index.html --lec <id> --force`). No Timmy Time episode yet.
- **Arcade:** the Cycle Arcade, skin `HEE2_SKIN` (sample tubes, the pathology lab escape room with a glucose meter, a
  follicle that ripens into a corpus luteum).
- **Content flags** from the build (as taught, worth checking against the recordings): see the PR that built it and the
  2026-11-05 entry in `DEPLOY_NOTES.md`.

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam2`.

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam2`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam1](heme-endo-exam1.md) · [high-likelihood-topics](../rules/high-likelihood-topics.md)
