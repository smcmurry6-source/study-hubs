---
type: task
status: blocked
hub: occlusion
created: 2026-11-03
requested-by: Sam
due: 2026-11-16
waiting-on: Dr. Givan announcing the final's length and format
agent: 
pr: 
---

# Put the Occlusion final's time and format into the hub

## Goal

The Occlusion final is Mon Nov 16 at 6:30 pm (moved up from Thu Nov 19; not comprehensive: L6 on). Its length and format
haven't been announced, so the mock uses the midterm's clock and the dashboard's check-in waits for 8 pm. When the
announcement arrives (Sam passes it on), make the hub match it.

## Context

- Hub note: [occlusion](../hubs/occlusion.md)
- `hubs/occlusion/index.html`: `FINAL_TIME` (`'18:30'` since 2026-11-05) / `FINAL_CLOSES` (null until the length is
  announced; set it and Home says "on now" until then and "done" after), `EXAM_INFO` (the exam card), `MOCK_BLUEPRINT` and the mock clock (now 80 s a question).
- `index.html` `HUBS` entry `occlusion`: the final's exam entry (`checkinHour:20` for now; move it to the hour the
  window closes, as the midterm's 19 did).
- If it gives counts per lecture: `EXAM_COUNTS` and `MOCK_BLUEPRINT` follow them, and each lecture gets that many
  `LIKELY_TOPICS` ([high-likelihood-topics](../rules/high-likelihood-topics.md)).

## Done when

- [x] Countdown, exam card, hints banner and timeline say the new date and the 6:30 pm start (2026-11-05)
- [ ] Exam card, hints banner and mock intro say the announced length and format
- [ ] Mock length and clock match the real exam
- [ ] Dashboard check-in timing matches when the exam closes
- [ ] CI passes; hub note and Outcome written

## Log

- 2026-11-03: written; waiting on the announcement.
- 2026-11-05: Sam: the final moves to Mon Nov 16 at 6:30 pm. Date and start time are in the hub and on the dashboard
  (check-in from 8 pm); still waiting on the length and format.

## Outcome

