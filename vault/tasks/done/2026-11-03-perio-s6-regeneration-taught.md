---
type: task
status: done
hub: perio
created: 2026-11-03
requested-by: Sam
due: 2026-11-19
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/419
---

# Perio Session 6 (Periodontal Regeneration): from slides only to taught

## Goal

S6 is `status:'preview'` ("Slides only so far"): its notes and the 54 questions added on 2026-10-21
(`q6-L*`, `-S*`, `-E*`, `-M*`, `-P*`, `-X01`) come from Dr. Geurs' slide deck.
When the class recording or capture is in the Drive folder, make it a taught session before the final (Thu Nov 19).

## Context

- Hub note: [perio](../../hubs/perio.md)
- **The recording's transcript** (Drive, Periodontology → hubs): `en-FA2026_DENT2145-VT_Lecturecapture_AVLC (1).txt`,
  uploaded 2026-10-25. It opens "Good morning, so you've had a day of occlusion, and we're going to do a little bit of
  biology and therapy combined, and this is a day that I circle". The name doesn't say which session it is, which is why
  it was missed: search Drive for its first words. Read it; never commit it.
- Change log: "2026-10-21 (perio S6: Periodontal Regeneration slide deck" in `DEPLOY_NOTES.md`
- Going from slides-only to taught brings in the rules a taught lecture must meet:
  [two-statement-and-true-false](../../rules/two-statement-and-true-false.md) (about 5 and 8; CI minimum 3 and 5),
  [numbered-statements](../../rules/numbered-statements.md) (3-5; minimum 2),
  [high-likelihood-topics](../../rules/high-likelihood-topics.md) (re-rank from what Dr. Geurs stressed),
  [every-choice-gets-a-why](../../rules/every-choice-gets-a-why.md),
  [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md) (both mp3s regenerated),
  [diagram-review](../../rules/diagram-review.md) (S6's review hasn't been put to Sam yet).
- Never use a graded quiz that is still open ([graded-coursework](../../rules/graded-coursework.md)).

## Done when

- [x] `status:'taught'`; both reading levels rewritten from the recording; both `periodontal-regeneration-*.mp3` regenerated
  (and High yield's, the third level since 2026-11-12)
- [x] Exam hints quoted from the recording; `LIKELY_TOPICS` re-ranked
- [x] Two-statement, true/false and numbered items meet the minimums; every choice has its why (and the which / which-false
  minimum, which applies to a session taught after 2026-11-10)
- [x] Diagram candidates put to Sam (in one message, as Sam asked); a follow-up task written:
  [2026-11-18-perio-s6-diagrams](../2026-11-18-perio-s6-diagrams.md)
- [x] CI passes; hub note and Outcome written; "Recent major changes" line added

## Log

- 2026-11-03: written; waiting on the recording.
- 2026-11-18: Sam: "i did upload the session 6 transcript a long time ago". Found (Context, above): it had been in the
  folder since 2026-10-25 under a lecture-capture file name. Unblocked, the day before the final.
- 2026-11-18: done (Claude Code), in the order Sam set: the check against the recording, hints and topics first, then the
  notes and narration, the question formats, version B wordings, Timmy Time, and the diagram candidates.

## Outcome

Sam's order for the day (2026-11-18): "Check every S6 note and its 56 questions against the recording and fix what it
contradicts. Add Dr. Geurs' exam hints (quoted) and anything he said you don't need. Re-rank S6's High Likelihood topics from
what he stressed", then the reading levels and all three narrations, the taught-lecture question rules, version B of every
edited or added question, Timmy Time's section 6, and the diagram candidates. "Do not follow tier 2 rules."

- **Checked against the recording.** Little in the slide-based notes was wrong; what the class changed: "Everything in the
  deck's cases is cell-free" (an autograft may bring some of the patient's own cells: `q6-L26`'s explanation), and the
  study names in `q6-L06` and `q6-L08` (same ids, same keys; their version B too). **One question retired** under
  [dont-ask-what-professors-skip](../../rules/dont-ask-what-professors-skip.md): `q6-L38` (which feature had the strongest
  evidence in the 2021 meta-analysis), on "This slide is not there for you to read all these studies... These are your
  sources" (said of the defect-morphology slide).
- **21 Exam Hints**, quoted from the recording (20 emphasize, 1 de-emphasize): the objectives, the three tissues "in
  harmony", 3-wall defects "the most contained ones", walls, angle and depth, horizontal bone loss ("no defect to fill"), the
  radiograph ("by the time we see it on the radiograph, it likely is not a three-wall defect"), the decision tree ("I think you
  should study it"), scaling and root planing, granulomatous tissue, the race for the space, no root canal needed, the
  open-flap baseline, surgical technique, mobility, DFDBA's BMP, autograft vs donor ("a toss-up"), EMD's porcine origin and
  consent, vertical to horizontal, furcations, and teeth over implants. Three of them he said while looking at the S6 quiz
  (closed in October); they quote only his teaching words.
- **High Likelihood re-ranked**: 14 S6 topics, led by the definition, 3-wall defects, the root canal point and the decision
  tree, all `hint` but the risk-factor table.
- **Notes**: As taught and Plain English rewritten from the class (the clean root, granulomatous tissue, the race for the
  space, walls, angle and depth, finding the defect on a chart and a film, his canine, Jeffrey and EMD cases, grafts and
  consent, tooth vs implant, histology and subtraction), with the deck's tables kept. Status `taught`; the lecture's `note`
  says to study the decision tree and not the slide's studies. Cram sheet rewritten (16 lines). All three narrations
  recorded again with Kokoro (full, plain, High yield).
- **Questions**: 56 → 79 (24 new, 1 retired): 8 true/false (`q6-T01`-`T08`, 4 true), 2 more two-statement (`q6-S05` both true,
  `S06` 1 false 2 true; 6 in all), 4 numbered (`q6-N01`-`N04`, keys in four positions), 2 which and 2 which-false
  (`q6-W01`-`W04`), 6 multiple choice (`q6-F02`-`F07`), every choice with its why, every one with its version B in
  `content/variants.json`. New facts only, none asked more than twice (the bank audit's bar).
- **Timmy Time**: section 6 rewritten from the class (it said "What we have is his slides"), with his hints in his words, and a
  lightning-round line on the root canal; the episode rebuilt (49 → 52 min; its length on the dashboard card,
  the About page and `LORE.md` too).
- **Diagrams**: five candidates put to Sam; [the follow-up task](../2026-11-18-perio-s6-diagrams.md) builds the approved ones.
- Verified: `node tools/hub-next/build.mjs --check`, the bank lint (format minimums, key spreads, the id registry, every
  wording), `node tools/ci/syntax.js`, `node tools/ci/vault.js`, and CI on the PR.

