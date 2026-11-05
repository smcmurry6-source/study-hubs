---
type: reference
tags: [analytics, supabase, retention, privacy]
---

# Analytics retention: how long each kind of row is kept

Part of [analytics governance](analytics-governance.md). **Today nothing is deleted on a schedule**: every row since
2026-09-08 is still in the database (only `link_codes` clean themselves after 10 minutes). The schedule below is a
**proposal waiting for Sam's call** ([task](../tasks/2026-11-04-analytics-retention.md)); until Sam approves it, no agent
deletes analytics rows. When Sam decides, record it in [decisions](../decisions.md) and change "Proposed" to "In force".

## Why it matters now

- **Storage.** The project is on Supabase's free plan, which allows a 500 MB database and switches a project that goes
  past it to read-only: answers, progress sync, reports and check-ins would all stop saving. On 2026-11-04 the database was
  217 MB and grew about 39 MB in the last exam week (`activity_pings` about 29 MB of that, `personal_answers` with its XP
  rows about 10 MB). That is roughly 7 exam weeks of headroom. The Insights tab's Storage row tracks it.
- **Privacy.** Rows with a `visitor_id` are pseudonymous, not anonymous: a browser's full study history is a profile. Keep
  per-person rows only as long as a feature or a retrospective needs them ([learner-data-privacy](../rules/learner-data-privacy.md)).

Where the space goes (2026-11-04): `activity_pings` 145 MB (40 MB of rows, **105 MB of indexes**), `xp_seen` 21 MB,
`personal_answers` 17 MB, `ui_click_reach` 6 MB, `feature_events` 5 MB, everything else under 3 MB each. One pings index,
`activity_pings_visit_idx` (26 MB), had been used 30 times since August: `activity_visits` replaced it in v45.

## Proposed schedule

| Data | Keep per-person rows | Then | Why |
|---|---|---|---|
| `activity_pings` (raw pings) | 30 days | delete; `activity_hourly` and `activity_visits` keep the same time at hour level | Every insight reads the hourly rollup; raw pings are 2/3 of the database |
| `activity_hourly`, `activity_visits` | the school year | collapse to hub × section × day with people counts, no ids | Retrospectives and cross-hub comparisons need per-person days and minutes for a year |
| `personal_answers`, `xp_seen`, `xp_days` | keep | revisit when the class graduates | Ranks, XP, mastery and progress sync are built from them; deleting answers lowers students' ranks |
| `ui_click_reach` | 90 days | delete (`ui_clicks` keeps the counts, no ids) | Reach is read for recent features |
| `feature_events` | 180 days | collapse to day × page × kind with people and `n`, no ids | Feature reach is read per hub and per term |
| `question_flags`, `hub_suggestions` | the visitor id 120 days after resolving | keep the text and the reply, id set to null | Replies show in the sender's Inbox for 60-90 days |
| `exam_debriefs` | the visitor id 1 year after the exam | keep the answers, id set to null | Check-ins are read against the person's use only in that hub's retrospective |
| `survey_responses` | "No thanks" rows until the survey closes; answers keep, id null 90 days after it closes | | The rows only stop a survey being asked twice |
| `podcast_reactions`, `podcast_comments`, `podcast_comment_reports` | until the hub's page comes down | delete with the hub | The episode leaves the site with its hub |
| `question_events` | the school year | collapse to hub × qid × version totals (tries, right, choices, medians), no ids | Question health reads 120 days per person (tries and retries need the person); a hub's exams fit in a school year |
| `question_feedback` | until the hub's page comes down | delete with the hub, or keep counts per question with no ids | One thumb per person per question, read only while the hub is live |
| `link_attempts` | 7 days | delete | Only the last hour is read (rate limit) |
| `zz-test` and blank-hub rows | none | delete | Test data |
| `question_stats`, `question_choices`, `question_versions`, `question_reviews`, `ui_clicks`, `search_terms`, `mode_stats`, `presence_hourly`, `hub_recaps`, `changelog` | keep | | No visitor ids; small |
| Trophies and games: `achievements`, `arcade_scores`, `egg_events`, `nuke_*`, `exam_luck`, `correct_streaks`, `visitor_names`, `visitor_links`, `question_pins` | keep | | They are the students' own records and settings |

A student who asks for their data to be deleted: there is no self-serve way yet, and a student can't see their own id
(a gap in the task note). Until there is, Sam deletes by the id from the student's own browser, never by guessing from a
name.

## Before anyone deletes anything (traps in the current schema)

1. **Deleting pings wipes their hourly rollup.** The `activity_pings_sum_del` trigger rebuilds `activity_hourly` and
   `activity_visits` for the affected visitors from the pings that are left, so a retention delete would erase their
   older hours. The retention job must skip that rebuild (a migration that changes `sh_activity_on_delete`, or the
   trigger disabled inside the job's transaction).
2. **Linking devices rebuilds from raw pings too.** `redeem_link_code` updates `activity_pings`, and the update trigger
   rebuilds both ids' rollups from the raw rows: once old pings are gone, linking would drop the older hours. Change it to
   move `activity_hourly` / `activity_visits` rows directly before pings are trimmed.
3. **Readers of raw pings move first.** `get_exam_debriefs`, `get_hub_recap`, `tools/retro.sql`, `tools/lessons-daily.sql`
   and the lessons-audit skill read `activity_pings`; switch them to `activity_hourly` (same numbers at hour level) before
   the first trim. `sh_insights()` already reads the rollup.
4. **Deleting answers changes ranks** (the `personal_answers_xp_*` triggers recompute XP). Don't.
5. **Take the hub's retrospective first.** `tools/retro.sql` and the recap (`tools/publish-recap.js`) need the hub's full
   history; trim a hub's raw data only after its retrospective is in `LESSONS.md`.
6. Deletes are permanent (the free plan has no point-in-time recovery). Sam approves each new kind of delete; a scheduled
   job, once approved, runs only what was approved.

## Quick wins that delete no data (also for Sam's OK)

- Drop `activity_pings_visit_idx` (26 MB, unused since v45).
- Delete the 3 `zz-test` rows.

Related: [analytics-governance](analytics-governance.md) · [event-taxonomy](event-taxonomy.md) ·
[analytics-data-quality](analytics-data-quality.md) · [learner-data-privacy](../rules/learner-data-privacy.md)
