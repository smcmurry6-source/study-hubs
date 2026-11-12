---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (deleting the line: the note carries it) or just does it, if it's small and clear, and ticks it with its PR
(`- [x] ... (#123)`); ticked lines are cleared the next time someone goes through the inbox. Anything left to do from a chat
lands here or in a task note ([to-dos-go-in-the-vault](../rules/to-dos-go-in-the-vault.md)). See [README](README.md).

- [ ] Class picks on each choice ignore question versions: `question_choices` (and `question_stats`) are keyed by position, so when
  an edit moves or rewrites choices, last week's percentages show beside a different choice until someone moves or clears the rows by
  hand (2026-11-04 evening lessons audit). Record the version with each pick (`record_choice`, `question_versions.v`) and read only the
  current one, as question health already does.

- [ ] Anima figures on phones: at 390 px their in-drawing labels scale down to about 6-7 px. A plain bigger font for narrow screens clipped labels at the edges in about half the PCD Implants figures (tried 2026-11-04, reverted); it needs a per-figure phone layout (labels moved inside the drawing) or tap-to-zoom. 
- [x] The site is near GitHub Pages' 1 GB cap: 960 MB on 2026-11-12, most of it narration (430 MB of it from archived hubs:
  Heme & Endo Exam 1, PCD Implants, MSK Exam 3 and 4, Special Patient Care, PCD Fixed Pros Exam 3). Ask Sam what can come down
  (for example archived hubs' mp3s, their pages falling back to the device voice) before adding more big files; the High yield
  narration waits on it ([task](2026-11-12-high-yield-narration.md)). Check whether the size is behind the slow publishes of
  11-06 and 11-10. Done 2026-11-12 (this PR): Sam kept the bitrates and had the five archived hubs' audio
  taken off (958 → 589 MB), and every hub's at its archiving ([rule](../rules/archived-hubs-drop-their-audio.md),
  [next ones](2026-11-12-audio-off-at-archiving.md)). The publishes take 1-3 minutes at 958 MB; 11-10's timeout was a one-off.
- [ ] Retention, the part not built yet (approved 2026-11-04, [analytics-retention](../reference/analytics-retention.md)): before the school year ends (spring 2027), collapse `activity_hourly` / `activity_visits` older than the school year to hub × section × day with people counts and no ids, as one more step in `sh_retention_run`. Also ask Sam about the two rows the question-health work proposed (`question_events`, `question_feedback`).
