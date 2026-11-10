---
type: task
status: blocked
hub: heme-endo-exam3
created: 2026-11-10
requested-by: Sam
due: 2026-11-20
waiting-on: the Heme & Endo Exam 3 hub being built (it doesn't exist yet), and the course confirming Exam 3's lectures
agent: 
pr: 
---

# Heme & Endo Exam 3: bring back Dr. Taylor's Lecture A

## Goal

Dr. Taylor's Lecture A (Dental Endocrinology Clinical Application, taught Fri 11/6, 8 am) is **not on Exam 2**: Sam asked
Dr. Herr, who said he forgot about it, so it will likely be on the next exam (Sam, 2026-11-10: "i guess save all that for
exam 3"). It was taken out of `heme-endo-exam2` whole, and everything it had is saved here so the Exam 3 hub starts with
it, already taught and vetted, instead of writing it again.

## Context

- Hub notes: [heme-endo-exam2](../hubs/heme-endo-exam2.md) (where A came from; its content flags for A are below) and
  [heme-endo-exam1](../hubs/heme-endo-exam1.md). Exam 3 is on the Exam 2 hub's timeline as Fri 11/20 (`COURSE_DATES`).
- **Where it is:** commit `43ece52` on `main` (the last one with A in it). Get the file with
  `git show 43ece52:hubs/heme-endo-exam2/index.html > /tmp/hee2-with-a.html`, and the narration with
  `git show 43ece52:hubs/heme-endo-exam2/audio/dental-full.mp3 > dental-full.mp3` (and `dental-plain.mp3`).
- **What to copy** (every piece keyed `dental`, or with ids starting `dc-`), all from that file:
  - the `LECTURES` row: `{ id:"dental", num:0, label:"A", title:"Dental Endocrinology Clinical Application", who:"Dr. Taylor", tag:"sage", source:"Recorded lecture (11/6, 8 am) + slides", status:"taught" }`;
  - **58 questions**: the section from `/* ===... A DENTAL ENDOCRINOLOGY CLINICAL APPLICATION */` to the L13 header
    (54 questions, plus the five Patient Box cases `DC_CASE1`-`DC_CASE5` they share), and four "which statement" items
    right after `mq()`'s block: `dc-ws-calcium`, `dc-ws-thyroid`, `dc-wf-addison`, `dc-wf-dmmouth`. Every choice has its
    why; the formats meet `FORMAT_MIN` and `WHICH_MIN`;
  - the notes, both levels: `READINGS["dental"]`, `READINGS_PLAIN["dental"]` (and the two mp3s above, which match them:
    reuse them only if the text is copied unchanged, [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md));
  - `NOTE_TABLES["dental"]`, `CRAM["dental"]`, the `REVIEW` group `id:"dental"` and three "Side by side" sections
    (`A · Hyperthyroidism vs hypothyroidism`, `A · Thyroid storm vs adrenal crisis vs hypoglycemia`,
    `A · Addison disease vs Cushing syndrome`);
  - 15 `HINTS` (14 `emphasize`, 1 `deemphasize`) quoted from the recording, 3 `SEQUENCES` (`dental-pth-gut`,
    `dental-addison-pigment`, `dental-dm-visit`) and 1 `SORT_SETS` entry (`dental-thyroid-hyper-hypo`);
  - 11 `LIKELY_TOPICS` (42 High Likelihood questions), ranked within A: re-rank them with Exam 3's other lectures, and
    re-check them against Exam 3's review or focus list if there is one;
  - its mock share was 5 of 45 in Exam 2's `MOCK_BLUEPRINT` (weighted by lecture time, one hour).
- **Question ids:** the `dc-*` ids are retired in `tools/question-ids/heme-endo-exam2.txt`. The Exam 3 hub has its own
  registry (`tools/question-ids/heme-endo-exam3.txt`), so it keeps the same ids
  ([question-ids-are-permanent](../rules/question-ids-are-permanent.md)).
- **Content flags (kept as taught, from the Exam 2 hub note):** slide 15's PTH "inhibits osteoblasts" he also said aloud
  (13:21); the notes keep Exam 1's mechanism (PTH acts on osteoblasts, which drive osteoclasts); no key depends on it.
  Slide 17 is the lamina dura radiographs and a brown tumor (14:52-15:58); slide 35 an image he didn't teach. Kept as
  taught, no key depends on them: FSH named as the driver of testosterone (2:56; L13 and L15 teach LH, and the notes say
  use LH); hyperthyroidism "generally an adenoma" (11:02; L12a: Graves is the most common cause); diabetes insipidus tied
  to sodium retention (17:29); Addison patients "losing sodium and potassium" (17:46; losing aldosterone retains
  potassium); the pituitary "stimulating" the adrenal medulla (19:36); Farxiga "stimulating" the sodium-glucose
  transporter (26:39; it inhibits SGLT2); HbA1c above 5.3 a "prediabetes risk" and fasting glucose over 100 suggesting
  diabetes (25:56, 28:07; L11's cutoffs are used for diagnosis); fructose "toxic" and honey "all fructose" (34:28,
  35:02); a "3.5-gland" parathyroidectomy "causing hyperparathyroidism" (13:02). He called metformin with a skipped
  breakfast a high hypoglycemia risk (21:43-22:31), against L11; `dc-metformin-skip` asks it "in Dr. Taylor's example"
  ("the numbers may not be accurate" is not "you don't need it", Sam 2026-11-10).
- A leans on Exam 2's lectures (L11's diabetes drugs and cutoffs, L12's thyroid, parathyroid and adrenal pathology): its
  notes and whys mention them. If Exam 3 doesn't cover those, keep the wording that explains them on its own.
- **L17 and L18 too:** L16 is the last lecture on Exam 2 (Sam, 2026-11-10, from Dr. Herr), so L17 Pregnancy and lactation
  (Dr. Madison, Tue 11/10) and L18 Estrogens and androgens (Dr. Fasinu, Wed 11/11) were never built; the Exam 3 hub builds
  them from their slides and recordings, with every per-lecture rule.
- Sources: Drive, "Hematology and Endocrinology" → "Exam 2" (A's slides and the `GMT20261106` 8 am transcript). Never
  commit them; the [graded-coursework](../rules/graded-coursework.md) rules apply as in Exam 2.

## Done when

- [ ] The Exam 3 hub has Lecture A with its notes at both levels and narration, its 58 questions (same ids), hints,
      tables, cram lines, sequences, sort set and High Likelihood topics, ranked with the rest
- [ ] Its `MOCK_BLUEPRINT` gives A a share, and Exam 3's exam facts say A is on it (or, if the course says it isn't, ask Sam)
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [ ] Vault written back (the Exam 3 hub note, decisions, this note's Outcome)

## Log

- 2026-11-10: written when Lecture A came out of `heme-endo-exam2` (Sam: Dr. Herr left it off Exam 2; "i guess save all
  that for exam 3").

## Outcome
