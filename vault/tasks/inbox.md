---
type: inbox
tags: [tasks]
---

# Inbox

Quick ideas and requests, one line each. An agent asked to go through the inbox turns each line into a task note in
this folder (or just does it, if it's small and clear) and deletes the line in the same PR. See [README](README.md).

- [ ] Class picks on each choice ignore question versions: `question_choices` (and `question_stats`) are keyed by position, so when
  an edit moves or rewrites choices, last week's percentages show beside a different choice until someone moves or clears the rows by
  hand (2026-11-04 evening lessons audit). Record the version with each pick (`record_choice`, `question_versions.v`) and read only the
  current one, as question health already does.

- [ ] Anima figures on phones: at 390 px their in-drawing labels scale down to about 6-7 px. A plain bigger font for narrow screens clipped labels at the edges in about half the PCD Implants figures (tried 2026-11-04, reverted); it needs a per-figure phone layout (labels moved inside the drawing) or tap-to-zoom. 
- [ ] Retention, the part not built yet (approved 2026-11-04, [analytics-retention](../reference/analytics-retention.md)): before the school year ends (spring 2027), collapse `activity_hourly` / `activity_visits` older than the school year to hub × section × day with people counts and no ids, as one more step in `sh_retention_run`. Also ask Sam about the two rows the question-health work proposed (`question_events`, `question_feedback`).
- [ ] Home timeline contrast in the other hubs (BUG-031): Heme & Endo 1 and 2, PCD Implants and Special Patient Care still dim past timeline rows with `opacity:.62` (under 4.5:1). They pass today, but each day another row turns past and the a11y gate fails with no code change, as Occlusion did on 2026-11-06. Use Occlusion's `.home-tl .tl-past .tl-what{color:var(--ink-soft)}` instead (2026-11-06).
