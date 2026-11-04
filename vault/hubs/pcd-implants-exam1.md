---
type: hub
tags: [hub, live]
hub: pcd-implants-exam1
status: live
---

# PCD Implants Exam 1

Nine lectures (Dr. Mueninghoff, Dr. Chavali, Dr. Chen, Dr. Givan, Dr. Geisinger). The exam is on Canvas, Fri Nov 6,
7:00 am-8:00 pm: 40 questions in one hour (3 multiple-answer, 3 matching, the rest MCQ). Dates and check-in hours (the
window closes at 8 pm, so `checkinHour:20`): `HUBS` in `index.html`.

## Before you work on it

- **Source:** `hubs/pcd-implants-exam1/index.html`; edit it directly, except the figures.
- **Built on** the Special Patient Care engine; palette "Anodized" (Sora / Manrope / Red Hat Mono). Adds `mm()` for
  multiple-answer items (one `[choice, isCorrect, why]` per option).
- **Sources** (Drive, PCD Implants): the recordings (transcribed in-session; L2's is an earlier year's run), slides,
  handouts and the course's hint list. A prior class's answers to the hint list and a diagram-aids doc were used only as a
  checklist against the lectures. No graded quiz or previous years' exam content.
- **Mock:** 40 questions / 60 minutes, MCQ only; `MOCK_BLUEPRINT` is the hub's own (no official counts per lecture).
- **Figures:** eleven anima figures from `tools/figures/pcd-implants-exam1/` (one generic live controller, `amLive`, in
  `shared.mjs`); edit them there and rerun `build.mjs` (`--check`, `--preview`).
- **Arcade:** the Osseo Arcade, skin `IMPL_SKIN`.
- **Brand and admin details** (Sam, 2026-11-03, reports #35/#36): keep a system's details only with an exam signal
  (a hint, a focus list, "on my exam", an example question). Kept: each system's surface, alloy and torques, conical vs
  non-conical, `pf-systems`.

History: grep `PCD Implants` in "Recent major changes" (`DEPLOY_NOTES.md`).

Related: [home](../home.md) · [special-patient-care](special-patient-care.md) (its engine)
