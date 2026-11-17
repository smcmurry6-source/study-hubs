---
type: task
status: blocked
hub: heme-endo-exam3
created: 2026-11-16
requested-by: Sam
due: 2026-11-20
waiting-on: L19 and L20's recordings (taught Tue 11/17), L21 and L22's slides and recordings (Wed 11/18), in the Drive folder
agent: 
pr: 
---

# Heme & Endo Exam 3: take L19 and L20 to taught, and add L21 and L22

## Goal

Exam 3 (Fri 11/20, 8:00 am) covers Lecture A and L17-L22. The hub shipped with A, L17 and L18 taught, L19 and L20 written
from their slides (taught Tue 11/17), and L21 and L22 (Wed 11/18) not in it yet because their slides weren't posted. Bring
each one in as soon as its file lands: the exam is two days after the last lecture ([ship-it-now](../rules/ship-it-now.md)).

## Context

- Hub note: [heme-endo-exam3](../hubs/heme-endo-exam3.md). Sources: Drive, "Hematology and Endocrinology" → "Hubs" →
  "Exam 3" (where Sam put L17-L20's slides and the 11/10 and 11/11 transcripts). Never commit them; never use "Resources from
  D3s", the Exam 3 Anki deck in that folder, or Quiz 4 (open until 11/19) ([graded-coursework](../rules/graded-coursework.md)).
- How a lecture is added or taken to taught: [build-a-hub](../how-to/build-a-hub.md), "Adding a lecture". Each lecture's
  content is in `hubs/heme-endo-exam3/content/` (edit the JSON, then `node tools/hub-next/build.mjs --hub heme-endo-exam3`).
- Lecture ids and question prefixes: L19 `hemeintro` (`hi-`), L20 `lymleuk` (`ll-`); use `mpath` (`mr-`) for L21 and `fpath`
  (`fr-`) for L22. The mock gives each lecture 5 (`core.json` `mock.blueprint`); with L21
  and L22 in, it is the exam's 35, and `mock.limit` goes to 5400 (90 minutes). Take the "join when their slides are posted"
  wording out of `index.html` (the mock blurb), `core.json` (`examInfo` "Still to come") and `hubs.js` (the card's text).
- Taking L19 or L20 to taught: check every note and question against the recording, add its hints (quoted) and anything a
  professor said you don't need ([dont-ask-what-professors-skip](../rules/dont-ask-what-professors-skip.md)), re-rank its
  High Likelihood topics from what was stressed, set `status: "taught"`, `source` and the questions' `src` ("rec" where said
  aloud), drop the lecture's `note`, and narrate again at all three levels in the same PR
  ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)).
- Diagrams: Sam said yes to every candidate for this hub (2026-11-16, [decisions](../decisions.md)), so L21 and L22's
  candidates are built without asking (`tools/figures/heme-endo-exam3/`).

## Dr. Herr's study guide for L21 and L22

Sam, 2026-11-17: no in-class review; Dr. Herr's study guide is "very indicative" and everything on it is High Likelihood
([decisions](../decisions.md)). When L21 and L22 go in, give each a `focus` hint first in its Exam Hints (the guide's words as the
quote, as L17-L20 have) and a High Likelihood topic for every item, with every question on it, ranked first (basis "study guide
+ slides", then "+ recording"). Write questions on every item and key term. From the guide (Drive, Exam 3 folder,
`Exam 3 Study Guide (1).docx`):

- **L21, Male reproductive pathology.** Focus on: disorders of testicular development/descent; major categories of testicular
  tumors; common infections of the male reproductive tract; major benign and malignant prostate disorders. Key terms:
  cryptorchidism, germ-cell tumors, seminoma, BPH, prostatic adenocarcinoma, Gleason grading.
- **L22, Female reproductive pathology.** Focus on: common disorders of the vulva, vagina, and cervix; distinguishing neoplastic
  from non-neoplastic lesions; important infectious causes of reproductive tract disease; relationship between HPV and cervical
  neoplasia; important age-related patterns of reproductive tract tumors. Key terms: lichen sclerosus, condyloma acuminatum,
  sarcoma botryoides, HPV, cervical neoplasia, infectious vaginitis.

L19 and L20 already have theirs (focus hints and topics, 2026-11-17). When they go taught, keep the guide's topics first and
add the recording's hints beside them.

## Done when

- [ ] L19 taught: checked against its recording, hints, topics re-ranked, narration redone (all three levels), and its five figures checked against it too (the node's size, slide 40's "(PALS)", open vs closed circulation)
- [ ] L20 taught: the same, its five figures included
- [ ] L21 in the hub (slides, then taught once its recording is posted): notes at both levels and three recordings,
      questions in every format with every why, topics, hints, tables, cram, sequences, a sort set, its figures
- [ ] L22 the same
- [ ] The mock is 35 questions in 90 minutes, and the "join later" wording is gone
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [ ] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-16: written when the hub shipped without L21 and L22 (no slides yet) and with L19 and L20 from their slides.
- 2026-11-17: Dr. Herr's study guide applied to L17-L20 (focus hints, topics re-ranked, five new questions); L21 and L22's lists
  added above. Still waiting on L19-L20's recordings and L21-L22's slides (not in the Drive folder on 11/17).
- 2026-11-17: L19 and L20 got their figures (five each, from the slides) and High yield narration
  ([the figures task](done/2026-11-16-heme-endo-exam3-figures.md)): check both when they go taught.

## Outcome
