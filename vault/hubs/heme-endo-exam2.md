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
  female reproductive physiology (`mphys`, `fphys`) and R, the **Exam 1 Refresher** (`refresh`): 55 questions copied
  from `heme-endo-exam1` with ids `r-<exam1 id>`, for the exam's five Exam 1 questions: **one for each of Exam 1's 55
  predicted topics**, in Exam 1's topic order. (It held 219 from 2026-11-06, every Exam 1 High Likelihood question plus 13 of
  its hardest, until the high-yield cut below.) A copy is the Exam 1 question unchanged except its id, `lec: 'refresh'`, "(Exam 1 · L#
  Title)" after the explanation and `pcase` prefixed `r-`; the Refresher's `LIKELY_TOPICS` are Exam 1's, "L# Title: "
  before each topic and "Exam 1 " before its basis. Its notes are Exam 1's cram sheet. Only the predicted topics are High
  Likelihood (all 55, one per topic), and **the mock's five Exam 1 questions come only
  from them** (Sam, 2026-11-06): `MOCK_LIKELY_ONLY` and
  `mockLikelyPick` take one per topic, each from a different Exam 1 lecture (read off the topic's "L4 Thyroid
  Physiology: ..." prefix, so keep it), unseen or missed questions first.
  The Question Bank's Only line has an extra toggle for them, **Exam 1 High likelihood** (`likely1`, Sam, 2026-11-06): only R's
  High Likelihood questions; turning it on ticks R if it isn't ticked, and turns "High likelihood" (every lecture's) off. Either
  one works on top of the Show chip (Missed last time, Not answered yet, Pinned).
  **R is review only and not in the hub's totals** (Sam, 2026-11-06: "they are just available for review since the exam 2
  will have 5 questions from that pool"): `COUNT_SKIP` / `COUNTED_QS` keep it out of the header's progress, Home's
  readiness ring and "you haven't tried" (whose button opens the other lectures), Where to next, the bank's "of N" (which
  adds "+ n Exam 1 review") and, through `SH_EXPORT.uncounted()`, the mastery medal in `widget/ranks.js`. Its answers
  still count for XP, streaks and leaderboards, and the bank, mock, drill and search still use its questions.
- **Taught or slides-only:** L11 and L12 were written from their class recordings (11/3, 11/4). A, L13, L14 and L15
  went to taught on 2026-11-08 from their 11/6 recordings (Drive, the four `GMT20261106-*` transcripts: 8 am A, 9 am L13,
  10 am L15, and 1:42 pm L14, which Dr. Herr re-recorded and posted after class, so its in-class emphasis isn't on it).
  Every Zoom caption is labeled "Michael Herr" because the room's account is his: A is Dr. Taylor and L15 Dr. Madison.
  Their questions' `src` is `rec` where the point was said aloud. L16 is still slides-only (taught Tue 11/10). L17 and L18
  had no slides on 2026-11-05: [the task](../tasks/2026-11-05-heme-endo-exam2-l17-l18-and-recordings.md).
- **Sources:** Drive, "Hematology and Endocrinology" → "Exam 2" (slides, schedule, syllabus, the recordings'
  transcripts). **Not used**, by the [graded-coursework](../rules/graded-coursework.md) rule: everything in "Resources
  from D3s" (last year's Exam 2 study guide, Anki deck of practice questions, a female repro study doc), Quiz 3 (open
  until 11/12), Quiz 4, the take-home.
- **Figures:** `tools/figures/heme-endo-exam2/` (`node tools/figures/heme-endo-exam2/build.mjs`; `--check` fails if
  the hub's `anima:css`/`anima:js` blocks are stale). Sam said yes to every animation (2026-11-05). Nine, each under a notes
  heading and in its lecture's Review: `drugsites` and `insulins` (L11), `axislab` (L12a and L12b), `cah` (L12b), `tubule`
  and `ducts` (L13), `follicle` (L14), `cycle` (L14 and L16), `hpg` (L15). Where each goes is in the hub's `FIG_PLACE` /
  `FIG_BY_LEC` (matched by heading text, both levels; `place.json` keeps the same list): renaming a heading unplaces its
  figure. The slide images were too large to read, so curve shapes, histology and the steroid chart follow the slide text
  and standard textbook layout; each figure's "What this shows, and what's simplified" says what was assumed (detemir
  drawn without a peak, no FSH peak at midcycle because L16 says inhibin suppresses it, hCG unnamed because the slides
  don't name it). Check them against the slides when the recordings land. `hpg` follows Dr. Madison's in-class
  correction since 2026-11-08 (aromatase mostly in the Sertoli cells, some in the Leydig cells; its slide said Leydig from
  puberty on). **Open:** `cycle` draws no FSH peak at midcycle (L16's slide: inhibin suppresses FSH), but in L14 Dr. Herr
  walks his graph with FSH peaking alongside LH just before ovulation (10:52, 20:39); the L14 notes say so above the
  figure. Settle it after L16's recording (Tue 11/10).
- **Narration:** `hubs/heme-endo-exam2/audio/<lecture>-full.mp3` and `-plain.mp3`, made with `tools/narrate.py`
  (`python3 tools/narrate.py hubs/heme-endo-exam2/index.html --lec <id> --force`). No Timmy Time episode yet.
- **Arcade:** the Cycle Arcade, skin `HEE2_SKIN` (sample tubes, the pathology lab escape room with a glucose meter, a
  follicle that ripens into a corpus luteum).
- **The bank is high yield** (Sam, 2026-11-08: "803 is way too many questions. They need to be higher yield"): it was cut
  from 803 to 339, about 6 questions for each question the lecture is expected to get on the exam (the median student
  answered about 300 before Exam 1): L11 48, L12a 38, L12b 42, A 32, L13 32, L14 32, L15 32, L16 28, R 55. Kept: what a
  professor stressed, the predicted topics and the core of each lecture, one question per fact; cut: near-duplicates in
  other formats, minor details and slide numbers nobody stressed, long ordering, matching and select-all items, stained-
  section identification (Dr. Herr: stained images aren't tested), and points a professor played down. The 464 removed ids
  are retired. **Keep it that size:** a new lecture (L17, L18) gets about 30-35 questions, and a lecture going taught (L16)
  swaps questions rather than adding. High Likelihood is selective too: each topic lists its 1-3 best questions, about
  half of each lecture (156 of 284; R all 55).
- **What a professor says you don't need isn't asked** (Sam, 2026-11-08; now a standing rule for every hub,
  [dont-ask-what-professors-skip](../rules/dont-ask-what-professors-skip.md)): no question tests it. On 2026-11-08 every
  recording (L11, L12a, L12b, A, L13-L15) and Exam 1's de-emphasis hints (for the Refresher) were checked; only `mh-2s-6`
  tested such a point, and it was retired. Questions that only mention a skipped point in a wrong choice or an
  explanation stay. When L16-L18 and the review come in, check their "you don't need" remarks the same way.
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
- **A (taught, 11/6 recording):** slide 15's PTH "inhibits osteoblasts" he also said aloud (13:21); the notes keep Exam
  1's mechanism (PTH acts on osteoblasts, which drive osteoclasts); no key depends on it. Slide 17 is the lamina dura
  radiographs and a brown tumor (14:52-15:58); slide 35 an image he didn't teach. Kept as taught, no key depends on them:
  FSH named as the driver of testosterone (2:56; L13 and L15 teach LH, and the notes say use LH); hyperthyroidism
  "generally an adenoma" (11:02; L12a: Graves is the most common cause); diabetes insipidus tied to sodium retention
  (17:29); Addison patients "losing sodium and potassium" (17:46; losing aldosterone retains potassium); the pituitary
  "stimulating" the adrenal medulla (19:36); Farxiga "stimulating" the sodium-glucose transporter (26:39; it inhibits
  SGLT2); HbA1c above 5.3 a "prediabetes risk" and fasting glucose over 100 suggesting diabetes (25:56, 28:07; L11's
  cutoffs are used for diagnosis); fructose "toxic" and honey "all fructose" (34:28, 35:02); a "3.5-gland"
  parathyroidectomy "causing hyperparathyroidism" (13:02). He called metformin with a skipped breakfast a high
  hypoglycemia risk (21:43-22:31), against L11; `dc-metformin-skip` asked it "in Dr. Taylor's example" until the
  high-yield cut retired it (2026-11-08), so no question turns on it now.
- **L13 (taught, 11/6 recording):** he said "lower" for the testis temperature (3:58), so 35 °C stays from the slide;
  74 days said aloud (14:59). Slips the hub doesn't follow: "gap junctions" for the Sertoli occluding junctions (7:09),
  "ductus deferens" for the efferent ductules (1:45), "seminiferous tubules" for the seminal vesicles (33:35). His
  release order is bulbourethral, prostate, then seminal vesicles with the sperm (36:01; textbooks put most sperm in the
  prostatic fraction). He said the labeled Sertoli cell drawing "is actually on your exam" (5:19) and stained images won't
  be tested (18:29). `mh-2s-6`, on the erectile blood-supply figure he said you don't need, was removed and retired on 2026-11-08 (Sam).
- **L15 (taught, 11/6 recording):** 34 °C said three times (L13's slide: 35); each lecture's questions use its own.
  "Two months" for sperm maturation is only on his slide (L13 says 74 days aloud). At 26:42 he had the class cross out
  his slide's "aromatase in the Leydig cells from puberty on": the Sertoli cells carry most of it from fetal development
  on, the Leydig cells some; the notes, questions (`mp-2s-2` rewritten, same key) and `hpg` follow him. He tied the testes
  dropping in warmth to the cremaster, and put each meiotic division one step early (18:41); the notes keep the standard
  order and say so. The speaker note that the right testis hangs lower stays out (anatomy texts say the left).
- **L14 (taught, posted recording):** he read the LH-driven edema as "theca externa" (22:48) and the secondary oocyte
  as "entering prophase" (23:06); the hub keeps the slides' theca interna and metaphase II. Cycle length: slide 28-30
  days, said 28-33 (no key depends on it). FSH peaks with LH before ovulation in his lecture (`fh-tf-fshpeak` says "In
  Dr. Herr's lecture"); L16's slide says inhibin holds it down. Lactation "activated by estrogen and progesterone surges
  during pregnancy and after childbirth" (35:48; check against L17). He calls the corpus luteum "more translucent" (not
  used). ZP1-3: "you don't need to know those".
- **L14 / L16:** follicle names (L16 calls any follicle with an antrum Graafian) and day counts (L16 ovarian 0-14 /
  14-28, L14 uterine 1-5 / 5-14 / 15-28) differ; each lecture's questions use its own. L16 (slides only): rising GnRH
  causes hot flashes (fp-meno-2 says "according to the lecture").

## Pending

Open tasks for this hub: `vault/tasks/` notes with `hub: heme-endo-exam2`.

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `heme-endo-exam2`. Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [heme-endo-exam1](heme-endo-exam1.md) · [high-likelihood-topics](../rules/high-likelihood-topics.md)
