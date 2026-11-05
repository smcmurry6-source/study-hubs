---
type: hub
tags: [hub, live]
hub: special-patient-care
status: live
---

# Special Patient Care

Dr. Mitchell's course, eight units (the autism unit is an online module; mental illness is a reading, SAID Module 9).
The exam is on Canvas: opens Fri Nov 6 12:00 am, due Fri Nov 13 11:59 pm, and Canvas keeps it open through Sat Nov 14
11:59 pm. Dates: `HUBS` in `index.html`; the hub counts down to the opening, then to the due time (`EXAM_DATE` /
`EXAM_END`; `EXAM_LAST` is the Saturday close).

**Dr. Mitchell's exam email (2026-11-04):** 45 questions, 135 minutes; a mix of multiple choice, multiple answer,
ordering, matching, Hot Spot (click a place in an image), fill-in-the-blank and true/false; open notes and lecture
materials but no other people; no discussing the exam with anyone, in any form, until after November 18; prior years'
exam material is an honor-code violation. The email's own dates (Fri Nov 17, Sat Nov 18) fit an earlier year's calendar:
Sam kept the dates above. The exam card (`EXAM_INFO`) carries all of this, and the mock matches the exam's size.

## Before you work on it

- **Source:** `hubs/special-patient-care/index.html`; edit it directly.
- **Built on** the Heme & Endo Exam 1 engine; palette "Sparks" (DM Serif Text / Source Sans 3 / JetBrains Mono).
- **The model to copy for the Question Bank's filter panel** ([question-bank-filter-panel](../rules/question-bank-filter-panel.md)).
- **No figures or animations** (Sam): `FIGS`/`ANIMA` are empty stubs and there is no diagram review for this hub.
- **Whys** are written inline with `mq(id, lec, src, stem, [[choice, why], ...], ex)`, so `QUESTION_WHY` is empty.
- **Check-in and archiving wait for the exam to close** (Sam). The card stays live through Canvas's Saturday close
  (hub-level `archiveOn:{date:"2026-11-14", hour:24}` in `HUBS`, mirrored in `SH_EXPORT.archiveOn`). Check-in (button
  and pop-up) waits for Thu Nov 19 (`checkinFrom` in its `HUBS` exam entry, `TALK_FROM` in the hub), because the email
  bans discussing the exam until after Nov 18; Home's done message says so until then. Read the check-ins from Nov 19.
- **Question formats:** multiple choice (with two-statement, numbered-statement and EXCEPT items), true/false, matching
  and, since 2026-11-04, multiple answer (24, three per unit, `mm()` with an inline why per choice). Sam chose no ordering,
  fill-in-the-blank or Hot Spot practice. **Mock:** 45 questions in 135 minutes (`MOCK_BLUEPRINT`, `MOCK_LIMIT`), one
  multiple-answer item per unit (`MOCK_MULTI`); a multiple-answer item counts as right only when every right answer and
  nothing else is picked, and its review shows the bank's partial credit.
- **Statement keys** (2026-11-04, after PCD Implants suggestion #14 found the same habit there): statement 1 was true in
  all 24 numbered items, so their statements were reordered (the false one now sits at every number) and four
  two-statement items swapped statements; two more became "both false". CI checks the spread (`tools/ci/smoke.js`).
- **Sources:** Drive, Special Patient Care/hubs (recorded lectures and handouts, the autism module's pages, the reading
  with Dr. Mitchell's video introduction). No graded quiz or exam content.
- **Arcade:** the Sparks Arcade, skin `SPC_SKIN`; Sparks After Hours is a painted operatory (`img/after-hours-escape.webp`)
  with measured hotspots.

History: grep `Special Patient Care` in "Recent major changes" (`DEPLOY_NOTES.md`).

Related: [home](../home.md) · [pcd-implants-exam1](pcd-implants-exam1.md) (built on this engine)
