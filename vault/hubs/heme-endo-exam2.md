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
- **Vetted:** every question was checked against its slides and recording by a second reviewer on 2026-11-05 (about
  1 in 4 rewritten). Where the lecture disagrees with a textbook or with itself, the hub keeps what was taught; those
  places are listed below so whoever takes a lecture to taught can check them against its recording.

## Content flags (kept as taught; check when the recording or review lands)

- **L11:** at about 1:29 the answer read aloud to slide practice question 4 (glucose-dependent insulin release) was
  sulfonylureas; the summary slide says GLP-1 agonists / DPP-4 inhibitors, and the hub follows the slide (the notes
  mention the mix-up). The fluoroquinolone slide has the K-ATP effect backwards (not tested). Dulaglutide half-life:
  slide 5 days, said 7 (hub: 5).
- **L12a:** Hashimoto's taught as TSH-receptor-blocking antibodies (slide and recording 23:42; textbooks say anti-TPO /
  anti-thyroglobulin); no key depends on it. Calcitonin "might" cause hypercalcemia in medullary carcinoma (said 33:20,
  against his own slide; not tested).
- **L12b:** the pheochromocytoma rule of 10s is taught with his warning that the numbers are dated. CAH: the slide's
  "1/3 of cases have sodium wasting" may be inverted (references say most classic cases); p2-tf-12 is keyed True to the
  slide. Adrenal cortical carcinoma "> 2 cm" on the slide (likely meant larger).
- **A (slides only):** slide 15 says PTH "inhibits osteoblasts"; the mechanism follows Exam 1 (PTH acts on osteoblasts,
  which drive osteoclasts); no key depends on it. Slides 17 and 35 are images that weren't read.
- **L13 / L15 (slides only):** testis temperature 35 °C (L13) vs 34 °C (L15); sperm maturation 74 days (L13) vs
  2 months (L15); each question uses its own lecture's number. L15's speaker note that the right testis hangs lower was
  left out (anatomy texts say the left). Speaker notes for L13 and L14 couldn't be read (file size).
- **L14 / L16 (slides only):** follicle names (L16 calls any follicle with an antrum Graafian) and day counts (L16
  ovarian 0-14 / 14-28, L14 uterine 1-5 / 5-14 / 15-28) differ; each lecture's questions use its own. L16: inhibin
  suppresses FSH at midcycle (so the cycle figure draws no FSH peak), rising GnRH causes hot flashes (fp-meno-2 says
  "according to the lecture"). L14: lactation "activated by estrogen and progesterone surges after birth" (check
  against L17).

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam2`.

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam2`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam1](heme-endo-exam1.md) · [high-likelihood-topics](../rules/high-likelihood-topics.md)
