---
type: task
status: in-progress
hub: review-of-systems
created: 2026-11-22
requested-by: Sam
due: 2026-12-03
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/541
---

# Review of Systems: check the parts against the professors' slides and recordings

## Goal

Sam, 2026-11-22: "I have uploaded several transcripts and power points for review of systems." The hub was built from
classmates' guides and standard references because the professors' slides weren't available
([the build](done/2026-11-19-review-of-systems-hub.md)). Check each part against its course's slides (and recordings where
there are some): fix what contradicts them, follow what a professor said to skip
([dont-ask-what-professors-skip](../rules/dont-ask-what-professors-skip.md)), add what a professor stressed as High-yield
points with the quote, fill gaps a board-style item could ask, and name the sources. It closes the inbox line "Cardio &
Respiratory and Renal from their slides".

Sam's calls while it ran ([decisions](../decisions.md), 2026-11-22): **the material first** ("I dont want to sacrifice the
quality of the material just so we can have ask timmy"), so nothing correct is cut to save room, and **Ask Timmy reads
the course the student is in** ("Let's do your recommendation to have Timmy only read the course the student is in",
[ask-timmy](../reference/ask-timmy.md), "Limits and money").

## Context

- [The hub note](../hubs/review-of-systems.md) (sources, the course groups, "High yield" not "High likelihood").
- Sources: Sam's Drive, the Review of Systems folder and one folder per course (read with the Google Drive connector; never
  committed). A deck over 10 MB that the connector returns empty can't be read from a cloud session: a PDF or a smaller
  copy can.
- How it was done: one reviewer per part (or per deck set) wrote a checked proposal (exact edits, new questions, hints,
  retirements, items for Sam); one session merged them in order, slides before recordings, and rebuilt the hub.

## Done when

- [x] Cardio & Respiratory: CR-1 to CR-5 against the slides (Dr. Latimer's, Dr. Garnett's, Dr. Anderson's, Dr.
      Fasinu's, Dr. Wilborn's decks)
- [ ] Cardio & Respiratory: the heart anatomy deck (`4-Anatomy of the Heart and Cardiovascular System.pptx`, 75 MB) could
      not be read, so CR-1's anatomy (pericardium, chambers, valves) is unchecked: needs a PDF or smaller copy from Sam
- [x] Renal: RN-1 to RN-5 against the slides, and RN-1 and RN-2 against Dr. Herr's recordings (lectures 0-9)
- [x] Renal: RN-3 to RN-5 against the recordings of lectures 10-16 (and the July 21 dental lecture)
- [x] Renal: the CKD lecture's "I'm not going to test you on reference ranges" applied to RN-4 (a deemphasize hint; no
      question asking a reference range)
- [x] MSK & GI: MG-1 (GI physiology) and MG-2 (GI anatomy and histology) against the slides
- [ ] MSK & GI: MG-2's foregut and abdominal wall decks (`2-Anatomy of the Foregut - Herr.pptx`, 81 MB;
      `4-Anatomy of the Anterolateral and Posterior Abdominal Wall - Herr.pptx`, 94 MB) could not be read: need a PDF
      or smaller copy
- [x] MSK & GI: MG-3 (GI pathology and drugs) against the slides (Dr. Kmeid's, Dr. Reid's, Dr. Wilborn's and Dr. Taylor's decks)
- [x] Fundamentals I: F1-1 to F1-9 against the slides (Dr. Bruns's, Dr. Latimer's, Dr. Amm's, Dr. Ryan's and the other decks)
- [ ] Fundamentals I: F1-1's `DOF-Lecture-1-Protein_structure(1).pptx` could not be read (amino acids, pKa values,
      secondary structure still rest on standard references): needs a PDF or smaller copy
- [ ] Fundamentals I: F1-3's `Eukaryotic Transcription` (.ppt, 31 MB) and `Translation 2024` (.pptx, 67 MB) could not be
      read (those two sections still rest on the class guides): need a PDF or smaller copy
- [ ] Fundamentals I: F1-4's `Introduction to Endocrinology` (.ppt) would not open ("unsupported mime type"): hormone
      basics, G-protein pathways, insulin and the calcium hormones are checked only against the study guides; a PDF or
      .pptx copy would do
- [ ] Fundamentals I: F1-9's `Latimer_Histology4` (96 MB) could not be read (the salivary ducts, serous and mucous cells
      still rest on the study guides): needs a PDF or smaller copy
- [ ] Fundamentals I: F1-6 (innate immunity) from Dr. Bruns's `Cells & Tissues` deck too: its CD markers and lymph's
      return through the subclavian veins aren't in the part yet (the tissues reviewer read it; M1 and M2 are in)
- [ ] Fundamentals I: F1-7's mucosal immunity from Dr. Bruns's tolerance and hypersensitivity decks (none of the adaptive
      decks teach it; the F1-8 reviewer found IgM also crossing the gut lining on the poly-Ig receptor, oral tolerance, and
      the slides' "do not memorize" figure notes)
- [ ] Fundamentals II: F2-1 to F2-8 against the slides
- [x] Ask Timmy reads one course first (`supabase/functions/timmy/core.js`, `widget/hub-timmy.js`, the tests)
- [ ] Ask Timmy's eval on the real model for the `rs-` cases (`node tools/timmy/eval.mjs --only review-of-systems`,
      about $1): waiting on Sam's OK to spend it
- [ ] Sam's calls from the reviewers (the PR lists them)

MSK & GI's bone, joints and skin parts (MG-4 to MG-6) were built from this site's lecture-based hubs and are not part of
this pass.

## Log

- 2026-11-22: 29 reviewers set going. The first 13 proposals merged (CR-1 to CR-5, RN-1 to RN-5, MG-1, MG-2), with
  Ask Timmy's course mode, in the PR below. The content passed Timmy's 200k-token limit (about 245k), which led to Sam's
  two calls above.
- 2026-11-22: F1-1 to F1-7 merged (the cells, molecular biology, enzymes and metabolism, and immunity decks). Fundamentals
  I's prompt passed 95k tokens with every course's cram sheet in it, so a course's part now carries only its own cram sheet
  (every course's when no course is known): every course's prompt fell by about 25k.

## Outcome

(At the end.)
