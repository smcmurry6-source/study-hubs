---
type: task
status: done
hub: occlusion
created: 2026-11-10
requested-by: Sam
due: 2026-11-16
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/305
---

# Occlusion L9 (Noncarious Cervical Lesions): diagrams, the slides check and the other 11/12 lecture

## Goal

L9 `nccl` went live from Dr. Lawson's prerecorded lecture alone (the transcript `en-Dr. Lawson NCCLs.txt` in Drive
Occlusion/Hubs/Final; no slides yet). Sam: "this is technically part of the session for this thursday, but it was
prerecorded instead. i dont have his slides yet or the other lecture from thursday." Three things are left before the
final (Mon Nov 16), the sooner the better ([ship-it-now](../../rules/ship-it-now.md)):

1. **Diagram review** ([diagram-review](../../rules/diagram-review.md)): Sam approves or skips each candidate below, one by
   one; build only the approved ones.
2. **The slides check:** when Dr. Lawson's slides reach the Drive folder, check the notes, questions, hints and likely
   topics against them (as L8's were in [PR #270](https://github.com/smcmurry6-source/study-hubs/pull/270)).
3. **The other 11/12 lecture:** when its recording (and slides) arrive, add it as L10 the same way.

## Context

- Hub note: [occlusion](../../hubs/occlusion.md). Change log: "2026-11-10 (Occlusion L9" in `DEPLOY_NOTES.md`.
- Rules: [diagrams-anima](../../rules/diagrams-anima.md), [figures-teach-the-lecture](../../rules/figures-teach-the-lecture.md),
  [outside-sources-for-figures](../../rules/outside-sources-for-figures.md), [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md)
  (a notes change means both mp3s again, `audio/nccl-full.mp3` and `-plain.mp3`).
- Names spelled by ear in the recording, to check on the slides: **Dzakovich** (the brushing study; the transcript has
  "Dzajakovich", and he said he can't pronounce it), Dr. Burgess (his mentor, the camel), "Basic Bites", "Milo's sweet
  tea", "Crest Pro-Health" and the RDA of about 124 for a Colgate whitening toothpaste.
- Judgment calls made from the transcript alone (check them against the slides): the cupped-cusp point ("not totally
  related to this lecture") kept as one question (`nc-cupping`) and out of the likely topics; the mouth-rinse pH
  ("probably not that big of a deal") and the wives' tales recorded as de-emphasize hints, with no question keyed on them;
  "2.5 is like the pH of battery acid" left out of the questions (battery acid is far below 2.5).
- Adding L10: a new tag color (all nine are used: add a tenth to the tag CSS), `MOCK_BLUEPRINT` (45 split five ways: 9
  each), `EXAM_INFO`, `COURSE_DATES`, the hints banner, the mock intro, the Home notice, the dashboard card, and the same
  words in `hubs/occlusion/next/index.html`.

**Diagram candidates** (proposed 2026-11-10; Sam approved all four the same day, and they are built: see the Log):

1. **Abfraction: the tooth flexes like a stop sign.** A premolar in buccolingual section, in its bone, with a load you can
   move from straight down the long axis to an inclined plane: under the inclined load the crown tips, the tooth flexes
   about the fulcrum at the bone, one cervical side turns compressed and the other tensile, and the lesion appears on the
   tensile side just above the bone; a toggle shows the stop sign beside it. Supports `nc-tension`, `nc-fulcrum`,
   `nc-2s-3`, `nc-num-2`, `nc-wf-1`, `cs-nc-gr-cause`. Under "Abfraction: the occlusion" and in
   Review. Medium, about 2 hours (which side is tensile from the stress studies, cited).
2. **pH vs buffering capacity: add bicarbonate.** Two drinks that start at the same pH (4, his example): tap to add
   bicarbonate a little at a time and watch each one's pH climb to neutral; one gets there in a few drops (low buffering
   capacity, good), the other takes many (high, bad, like orange juice). A water button doubles the volume and barely
   moves the pH (a log scale). Supports `nc-buffer-def`, `nc-buffer-high`, `nc-2s-4`, `nc-num-3`, `nc-wf-2`, `nc-water`,
   `nc-tf-6`, `cs-nc-ac-drink`, `cs-nc-ac-help`. Under "pH vs buffering capacity" and in Review. Medium, about 2 hours
   (no drink numbers the lecture didn't give).
3. **Cupped cusp tips: wear plus erosion.** One molar cusp in section with a slider for time: wear flattens the enamel
   until the dentin horn shows, then the dentin dissolves faster (higher critical pH) and the cup forms. Supports
   `nc-cupping`, `nc-2s-5`, `nc-ws-2`. Under "Erosion: acid that isn't caries". Small, about 1 hour. (He called it a side
   point.)
4. **Reuse L7's Fig 19 (the erosion pattern map)** under L9's erosion section, opened on its bulimia view (maxillary
   linguals) and its NCCL view. No new drawing; its other views (GERD, soda, citrus) are L7's content. Supports
   `nc-vomit`, `nc-2s-5`. Tiny, minutes.

## Done when

- [x] Sam has approved or skipped each candidate; the answers are in [decisions](../../decisions.md) and the hub note
- [x] The approved figures are built and checked at 390 px in both themes, with screenshots for Sam
- [x] Dr. Lawson's slides are checked against L9's notes, questions, hints and likely topics (the names above), with
      both mp3s rebuilt if the notes change (2026-11-12, all three levels)
- [x] The other 11/12 lecture is added as L10 (2026-11-12: Dr. Abou-Arraj's occlusal trauma, with five figures)
- [x] CI passes; vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-10: written when L9 shipped from the transcript ([PR #305](https://github.com/smcmurry6-source/study-hubs/pull/305)); the four candidates went to Sam in chat.
- 2026-11-10: Sam: "Approve the budget, make all diagrams, merge when ready". All four built in the diagrams PR: Fig 24
  `abfract` (after "His analogy: push on a stop sign"), Fig 26 `cupping` (after "Cupped-out cusp tips."), `erosion9` (Fig 19
  again, after "Vomiting (bulimia"), Fig 25 `buffer` (after "pH and buffering capacity sound"); in plain English after the
  matching paragraphs; in Review as three `figs` sections. The About page's Diagrams entry has an L9 sentence. The page went
  to 1379 KB, so the budget is 1395 KB now (BUG-055).

- 2026-11-12: Sam: "i just added the last occlusion materials to the folder" (Dr. Lawson's slides, Dr. Abou-Arraj's
  slides and the 11/12 recording). **The slides check:** the slides are mostly pictures and name none of Dzakovich,
  Dr. Burgess, Basic Bites, Crest Pro-Health or the 124 toothpaste, so those keep the recording's spellings (no question
  is keyed on a name). The notes gained what the slides add: RDA below 250 for the ADA seal, the sensor changing color,
  where acid demineralizes vs where plaque does, the buffering experiment's pH 6.5, OJ (about 3.6) and wine (about 4.0)
  needing the most bicarbonate though they aren't the lowest pH, mouth rinses as low as about 3.2, "Milo's unsweet tea"
  beside the recording's sweet tea with Splenda, and the summary slide; Review and the cram sheet follow, and two
  questions are new (`nc-rda-seal`, `nc-erosion-sites`). The cupped cusp tips, the mouth-rinse pH and the battery-acid
  line aren't on the slides, so the earlier calls stand. **L10** (`occtrauma`, Dr. Abou-Arraj, "Occlusion and Periodontal
  Correlations"): notes at both levels, 59 questions in every format, three Patient Box cases, 19 hints, 11 likely topics,
  Review, cram, two sort sets, two side-by-side rows, the mock at 9 each from L6-L10, tag `plum`. Sam: "yes to all figures
  and anima" (Figs 27-31). L9 and L10 narrated at all three levels.

## Outcome

Done 2026-11-12. The diagrams shipped 2026-11-10; Dr. Lawson's slides were checked against L9 and L10 was added with its
figures and narration on 2026-11-12 (see the Log; [hub note](../../hubs/occlusion.md)). L10 is the last lecture on the
final. Still open for the hub: [the final's format](../2026-11-03-occlusion-final-time-and-format.md).
