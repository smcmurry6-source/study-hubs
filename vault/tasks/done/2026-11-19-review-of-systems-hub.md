---
type: task
status: done
hub: review-of-systems
created: 2026-11-19
requested-by: Sam
due: 2026-12-03
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/480
---

# Build the Review of Systems hub

## Goal

A hub for DENT 2165 Review of Systems: the class's two 200-question mock board exams (Thu Dec 3 and Thu Dec 10, 8:00 am to
noon CST), which cover every course in the course's intro deck. Sam, 2026-11-19: "please go through all materials. things
from previous classes and quiz content is okay. please use everything from those folders. is this going to end up being
too big? i dont think we do any figures. keep notes very high yield with a section for each course tested and then sub
sections to make it more manageable."

## Context

- Hub note: [review-of-systems](../../hubs/review-of-systems.md). Sam's calls: [decisions](../../decisions.md) (2026-11-19).
- Rules that matter most: [graded-coursework](../../rules/graded-coursework.md) (with Sam's "topic check only" for this
  hub), [every-hub-gets-its-own-art](../../rules/every-hub-gets-its-own-art.md), the question rules (`hubs/CLAUDE.md`).
- Sources: Sam's Drive, the Review of Systems folder and each course's folder (never committed).
- **Too big?** No: with no narration and no figures it is a few MB of text (the size check, `tools/ci/size.js`, barely
  moves). It is the biggest bank on the site, which the engine already pages (At a time, 100 to start).

## Done when

- [x] The engine lists a hub's parts under their courses (`core.json` `groups`), in the notes, Home and the bank's picker
- [x] Two mocks: the countdown moves to the second once the first closes, with Home's words for each
- [x] Its own art: tint, emblem, masthead scene, medal glyph and ribbon
- [x] Notes (As taught and Plain English), a cram list, review tables and board-style questions for every course
- [x] High likelihood topics for every part; every choice with its why; the format minimums per course
- [x] Wired into the site: `hubs.js`, `sw.js`, the admin page, the recap tool, the budgets
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Vault written back (hub note, decisions, this note's Outcome)

## Log

- 2026-11-19: written; Sam answered the four questions (structure, old quizzes, scope, question style).
- 2026-11-19: 13 drafting sessions, one per course or pair of courses, each from that course's folders; merged here.

## Outcome

Shipped in [#480](https://github.com/smcmurry6-source/study-hubs/pull/480): 14 courses in 70 parts, 1,126 questions, 316 High likelihood topics. Every part has notes As
taught and in Plain English, a cram list, High likelihood topics (about 40% of its questions) and board-style questions with
every choice explained; the special formats meet their minimums per course. Narration off, no figures, no arcade.

**How it was built.** One drafting session per course (or pair), each reading only that course's Drive folders and this
site's earlier hubs for it, writing into a scratch folder (never the repo), with a report of what it read, where its sources
disagreed and what Sam should decide. A merge script checked every draft (answer ranges, a why for every choice, the fixed
two-statement and true/false choices, ids, likely topics pointing at real questions), capped High likelihood at about 40% a
part and ran the hub build. None of the drafts or reports is in the repo (course material, classmates' docs).

**Where sources disagreed, the standard fact was used**, and the hub never says a classmate's guide was wrong. Most courses'
sources were classmates' guides and answered objectives, not professor slides, so the notes lean on standard references
(`src: "ref"` on those questions). By course:
- Head & Neck: the stylomandibular ligament limits protrusion (a practice set said it "prevents excessive opening").
- Dental Anatomy & Occlusion: primary teeth start calcifying in utero; the maxillary first molar usually has 4 canals; the
  most often missing tooth after third molars and two angle facts where sources differ are not keyed.
- Fundamentals I: about 16 study-guide errors (proton counts per complex, PEP carboxykinase, β2-microglobulin, what Tfh and NK
  cells secrete, RLRs and MAVS, among others); enzyme inhibition sits in both halves.
- Fundamentals II: high-risk HPV 16 and 18; M. tuberculosis acid-fast; mirabegron a β3 agonist; fluoroquinolones on DNA
  gyrase; AHA 2021 prophylaxis without clindamycin; several outdated drugs left out.
- Oral Microbiology: Kaposi sarcoma as HHV-8; localized aggressive periodontitis with its current name.
- Neuroscience: Wernicke area in the temporal lobe; the rule of 4; amides metabolized in the liver.
- Cardio & Respiratory: written from the class's objectives and the class above's reviews (no slides); its dental points
  (epinephrine limits, blood pressure cutoffs, INR for an extraction, the wait after an MI) from standard references; Mobitz II,
  normal aPTT 25-35 s, protamine fully reverses heparin and only partly LMWH, clopidogrel and CYP2C19, CO2 about 70% as
  bicarbonate, tetracyclines (not fluoroquinolones) stain teeth. It holds the coagulation and anticoagulants Heme & Endo left to it.
- Renal: GFR 125 mL/min and 180 L/day; NKCC2 in the thick ascending limb; contraction alkalosis; the ion and segment
  percentages; CKD not High likelihood (above).
- Heme & Endo: Hashimoto as anti-TPO destruction; pramlintide apart from the alpha-glucosidase inhibitors; hypoglycemia below
  70 here (Heme & Endo Exam 3 keeps Dr. Taylor's "under 60" from his recording); LCIS as a risk marker.
- MSK & GI: duodenal papilla as foregut to midgut; the inguinal hernia routes; metoclopramide a D2 antagonist and 5-HT4
  agonist; Hashimoto as above.
- Ethics & Professionalism: HCV needlestick risk about 2%; HIV survives poorly outside the body.
- Evidence-Based Dentistry: false positives from low specificity; what a p-value is; CONSORT.
- Radiology: the fetal threshold about 0.3 Gy (a guide copy said mGy); contrast and grayscale kept brief, with no question
  turning on them (the guide says the professor won't ask).
- Medical Emergencies: the four recordings settled most points; what the professors said they won't test has no questions;
  normal heart rate 60-100, aspirin held 7-10 days, hemophilia B is factor IX, chest thrusts for a choking infant.

**Graded work:** the earlier courses' quizzes, crosswords and exams that turned up were used as a topic check only; nothing
was copied or reworded, and this course's own quizzes were never opened. **Not read:** Anki decks (`.apkg`), HEIC photos,
Quizlet sets behind a login, videos where a transcript existed.

**Also in the PR:** the engine's course groups and two-exam countdown, lecture badges that widen for a label like HN-1, the
About page, and **Ask Timmy on Haiku 5.5** (Sam: "we can switch timmy to run on haiku"), whose eval is still to run
([inbox](../inbox.md)). **Left for Sam:** the calls listed in [the inbox](../inbox.md) ("Sam's calls from the build").
