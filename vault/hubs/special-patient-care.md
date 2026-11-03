---
type: hub
tags: [hub, live]
hub: special-patient-care
status: live
---

# Special Patient Care

Dr. Mitchell's course, eight units (the autism unit is an online module; mental illness is a reading, SAID Module 9).
The exam is on Canvas, open Fri Nov 6 12:00 am to Fri Nov 13 11:59 pm; its format wasn't announced. Dates: `HUBS` in
`index.html`; the hub counts down to the opening, then to the due time (`EXAM_DATE` / `EXAM_END`).

## Before you work on it

- **Source:** `hubs/special-patient-care/index.html`; edit it directly.
- **Built on** the Heme & Endo Exam 1 engine; palette "Sparks" (DM Serif Text / Source Sans 3 / JetBrains Mono).
- **The model to copy for the Question Bank's filter panel** ([question-bank-filter-panel](../rules/question-bank-filter-panel.md)).
- **No figures or animations** (Sam): `FIGS`/`ANIMA` are empty stubs and there is no diagram review for this hub.
- **Whys** are written inline with `mq(id, lec, src, stem, [[choice, why], ...], ex)`, so `QUESTION_WHY` is empty.
- **Check-in and archiving wait for the exam to close** (Sam): its exam entry has `checkinHour:24, promptHour:24,
  archiveHour:24`, and `SH_EXPORT.exams` matches.
- **Sources:** Drive, Special Patient Care/hubs (recorded lectures and handouts, the autism module's pages, the reading
  with Dr. Mitchell's video introduction). No graded quiz or exam content.
- **Arcade:** the Sparks Arcade, skin `SPC_SKIN`; Sparks After Hours is a painted operatory (`img/after-hours-escape.webp`)
  with measured hotspots.

History: grep `Special Patient Care` in "Recent major changes" (`DEPLOY_NOTES.md`).

Related: [home](../home.md) · [pcd-implants-exam1](pcd-implants-exam1.md) (built on this engine)
