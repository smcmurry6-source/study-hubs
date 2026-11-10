---
type: task
status: blocked
hub: perio
created: 2026-11-03
requested-by: Sam
due: 2026-11-19
waiting-on: the live class's capture (gingival excess and abnormal color, the week of Nov 9), and Sam's answers on the diagram candidates
agent: Claude Code (claude/bold-thompson-v88wcy)
pr: https://github.com/smcmurry6-source/study-hubs/pull/298
---

# Perio Session 9 (Periodontal Plastic Therapy & Esthetics)

## Goal

S9 is `status:'upcoming'`: its short notes and questions come from the exam-review guide only. When Dr. Abou-Arraj's
slides (then the recording) are in the Drive folder, build it out before the final (Thu Nov 19): first as slides-only
(`preview`), then taught.

## Context

- Hub note: [perio](../hubs/perio.md); S6 (slides first, then taught) and S7/S8 (taught from recordings) are the
  worked examples in `DEPLOY_NOTES.md`.
- A taught session needs everything in [perio-s6](2026-11-03-perio-s6-regeneration-taught.md)'s "Done when" list:
  both reading levels and both mp3s, exam hints, `LIKELY_TOPICS`, the three question formats with their minimums,
  a why for every choice, and a diagram review put to Sam one candidate at a time.
- [LESSONS.md](../../LESSONS.md): read it first (it's a new lecture); [graded-coursework](../rules/graded-coursework.md).

## Done when

- [x] Slides-only version shipped as soon as the slides arrive (skipped: the slides and the recording arrived together, Nov 9)
- [x] Taught version shipped as soon as the recording arrives, meeting every taught-lecture rule (the recorded part;
  the live class's part is still to come)
- [x] CI passes; hub note and Outcome written
- [ ] The live class's capture (gingival excess, altered passive eruption, esthetics, abnormal color): check those
  sections, their questions and hints against it, take the "(slides; the live session)" labels and the lecture `note`
  off, regenerate both mp3s
- [ ] Diagram candidates put to Sam (below); build what's approved, note the skipped ones in the hub note

## Diagram candidates (2026-11-10, waiting on Sam, one by one)

1. **Cairo RT1 / RT2 / RT3 side by side**: a facial view and probe readings for each type, with a toggle that draws the
   line a graft can cover to. Supports `q9-L10`-`L12`, `q9-S02`, `q9-P02`, `q9-P04`. Under the notes' recession
   classification and in Review. About an hour.
2. **The palate in cross-section**: the epithelium, lamina propria and submucosa, with the greater palatine bundle
   at 7, 12 or 17 mm from the CEJ for a shallow, average or high vault (a three-way switch). Supports `q9-04`,
   `q9-L14`, `q9-L15`, `q9-L36`, `q9-T02`. Under the notes' graft sources. About an hour.
3. **Covered vs. exposed graft**: a CTG under a coronally advanced flap next to an FGG left exposed with an apically
   positioned flap, stepping through placement to healing (root coverage vs. a new band of keratinized gingiva).
   Supports `q9-02`, `q9-L16`, `q9-L26`, `q9-S01`, `q9-P01`, `q9-P03`. Under the notes and in Review. About an hour.
4. **Altered passive eruption 1A / 1B / 2A / 2B**: four sections showing the MGJ, CEJ and crest, each with its
   treatment. Supports `q9-07`, `q9-08`, `q9-L31`, `q9-L32`, `q9-S05`, `q9-T06`, `q9-T07`, `q9-N03`. Under the notes and
   in Review's `ape`. About 1-1.5 hours. From the slides; best checked against the live class.
5. **Gummy smile cause finder**: step through the findings (lower facial third, lip length, lip mobility, crown
   proportions) to the cause and its treatment. Supports `q9-09`-`q9-11`, `q9-L29`, `q9-L30`, `q9-L34`, `q9-L35`,
   `q9-N04`. In Review's `esthetics`. About 45 minutes. From the slides.

## Log

- 2026-11-03: written; waiting on the lecture.
- 2026-11-10: Dr. Abou-Arraj's recording (posted Nov 9, the first part of the session) and his 2026 slides were in
  Drive. S9 taken straight to taught; see Outcome.

## Outcome

2026-11-10, [PR 298](https://github.com/smcmurry6-source/study-hubs/pull/298):
- **Status taught**, with a lecture `note` saying it was lectured in two parts. The recording covers the phenotype,
  recession (factors, the two pathways, why treat, Cairo RT1-RT3), graft sources and the palate, the CTG + coronally
  advanced flap and ADM + tunnel cases, keratinized gingiva (is it needed, the 2 mm rule, an FGG left exposed) and the
  frenum. Gingival excess, altered passive eruption, crown lengthening, the esthetic evaluation and tattoos come from his
  slides and the exam-review guide until the live class is posted; those headings say "(slides; the live session)".
- **Notes** rewritten at both levels (40 aligned paragraphs each, so the "In the notes" links match), both mp3s
  regenerated; ten names added to `tools/podcast/lexicon.json`.
- **Questions:** 59 new (`q9-L01`-`L36`, `E01`-`E02`, `M01`-`M02`, `S01`-`S05`, `T01`-`T10`, `N01`-`N04`) and four drawn
  Patient Box items (`q9-P01`-`P04`) on two new cases, `no-kg-24` (no keratinized gingiva on #24, RT2) and
  `recession-11` (RT1 on #10-#11). The old `q9-01`-`q9-12` stay as they were. Every choice has its why.
- **Exam Hints:** 12 from the recording (one de-emphasized: restorative treatment of recession is next year's course).
  **LIKELY_TOPICS:** 12, ranked, the recording's hints first.
- **Review:** recession (factors, why treat), grafts and which one when, keratinized gingiva and the frenum, gingival
  excess, altered passive eruption and crown lengthening, the esthetic evaluation. Cram and mind map redone; four arcade
  words added.
- **Where the sources differ** (the notes give both; no question turns on them): recession prevalence (the recording
  vs the slide's 88% / 50%), and ADM ("comparable or superior" on a slide vs "doesn't work as well" in the guide).
- **Left:** the live class's capture, and the diagram candidates (see the checklist above).

