---
type: task
status: blocked
hub: occlusion
created: 2026-11-03
requested-by: Sam
due: 2026-11-16
waiting-on: Dr. Givan announcing the final's format
agent: 
pr: 
---

# Put the Occlusion final's time and format into the hub

## Goal

The Occlusion final is Mon Nov 16, 6:30-7:45 pm, the midterm's time window (moved up from Thu Nov 19; not
comprehensive: L6 on). Its format (question count, Canvas or not) hasn't been announced, so the mock uses the midterm's
clock. When the announcement arrives (Sam passes it on), make the hub match it.

## Context

- Hub note: [occlusion](../hubs/occlusion.md)
- `hubs/occlusion/index.html`: `FINAL_TIME` / `FINAL_CLOSES` (`'18:30'` / `'19:45'` since 2026-11-05), `EXAM_INFO` (the exam card), `MOCK_BLUEPRINT` and the mock clock (now 80 s a question).
- `index.html` `HUBS` entry `occlusion`: the final's exam entry (`checkinHour:20, promptHour:20`, after the 7:45 close).
- If it gives counts per lecture: `EXAM_COUNTS` and `MOCK_BLUEPRINT` follow them, and each lecture gets that many
  `LIKELY_TOPICS` ([high-likelihood-topics](../rules/high-likelihood-topics.md)).

## Done when

- [x] Countdown, exam card, hints banner and timeline say the new date and the 6:30-7:45 pm window (2026-11-05)
- [ ] Exam card, hints banner and mock intro say the announced format
- [ ] Mock length and clock match the real exam
- [x] Dashboard check-in timing matches when the exam closes (8 pm, 2026-11-05)
- [ ] CI passes; hub note and Outcome written

## Log

- 2026-11-03: written; waiting on the announcement.
- 2026-11-05: Sam: the final moves to Mon Nov 16, "the same time window, just on a different date" (the midterm's
  6:30 pm, closing 7:45). Date and window are in the hub and on the dashboard (check-in from 8 pm), PR #250; still
  waiting on the format.

## Outcome

