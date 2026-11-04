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
  `shared.mjs`); edit them there and rerun `build.mjs` (`--check`, `--preview`). All eleven were checked against the notes
  and fixed on 2026-11-04 (change log): `attach` draws its soft tissue layers to scale from Gargiulo 1961 and Cochran
  1997 (the averages behind 2.04 and 3.08 mm); `zones` is an upper incisor, so coronal is down as in the notes' "creep
  down (coronally)"; `position` measures every distance at the crest, to scale. A figure that wants to react when a
  slider or button sets a key names a helper in `D.ONSET` (`position` switches views that way). anima's line check has
  nothing to test here (these figures draw no `.iso-line`), so review them by eye in both themes and at 390 px.
- **Arcade:** the Osseo Arcade, skin `IMPL_SKIN`.
- **Timmy Time:** an episode (`hubs/pcd-implants-exam1/audio/timmy-time.mp3`, script `tools/podcast/pcd-implants-exam1/script.md`),
  card on Home under the quick-start row, `#timmy` opens Home. `SH_PODCAST.fans` holds its three lore comments
  ([podcast-reactions](../rules/podcast-reactions.md)). **A notes change means fixing the script and rebuilding the episode**
  ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)). The script keeps CDT codes, clinic credits and
  brand details with no exam signal out, like the bank.
- **Brand and admin details** (Sam, 2026-11-03, reports #35/#36): keep a system's details only with an exam signal
  (a hint, a focus list, "on my exam", an example question). Kept: each system's surface, alloy and torques, conical vs
  non-conical, `pf-systems`.
- **Select-all ticks** reach `question_choices` only from 2026-11-04 (`picks` in `impl:answered`, set in `recordAnswer`); older
  `mm()` items have no per-option rows. Choices must not carry their own numbers when the stem asks which is most common (report #37).
- **Practice follows bank order** (lessons audit, 11-04): two days out the last four lectures had 6-7 answerers each vs 23 on L1-L2.
  So Home's "Where to next" has a **Practiced least** row (`homeNextHTML`, `homeGo('least:<ids>')`; Sam, 2026-11-04): it
  replaces "Not started" once you've answered anything. Its clicks log as `home=least:<ids>`.

History: grep `PCD Implants` in "Recent major changes" (`DEPLOY_NOTES.md`).

Related: [home](../home.md) · [special-patient-care](special-patient-care.md) (its engine)
