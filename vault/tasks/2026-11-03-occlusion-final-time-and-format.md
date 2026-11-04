---
type: task
status: blocked
hub: occlusion
created: 2026-11-03
requested-by: Sam
due: 2026-11-19
waiting-on: Dr. Givan announcing the final's time and format
agent: 
pr: 
---

# Put the Occlusion final's time and format into the hub

## Goal

The Occlusion final is Thu Nov 19 (not comprehensive: L6 on). Its time, length and format haven't been announced, so the
hub counts down in days and the mock uses the midterm's clock. When the announcement arrives (Sam passes it on), make the
hub match it.

## Context

- Hub note: [occlusion](../hubs/occlusion.md)
- `hubs/occlusion/index.html`: `FINAL_TIME` / `FINAL_CLOSES` (null until announced; set them and the countdown shows
  hours and minutes), `EXAM_INFO` (the exam card), `MOCK_BLUEPRINT` and the mock clock (now 80 s a question).
- `index.html` `HUBS` entry `occlusion`: the final's exam entry (add `checkinHour`/`promptHour` if it's a Canvas window
  that closes late, as the midterm did).
- If it gives counts per lecture: `EXAM_COUNTS` and `MOCK_BLUEPRINT` follow them, and each lecture gets that many
  `LIKELY_TOPICS` ([high-likelihood-topics](../rules/high-likelihood-topics.md)).

## Done when

- [ ] Countdown, exam card, hints banner and mock intro say the announced time and format
- [ ] Mock length and clock match the real exam
- [ ] Dashboard check-in timing matches when the exam closes
- [ ] CI passes; hub note and Outcome written

## Log

- 2026-11-03: written; waiting on the announcement.

## Outcome

