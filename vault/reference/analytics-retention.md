---
type: reference
tags: [analytics, supabase, retention, privacy]
---

# Analytics retention: how long each kind of row is kept

Part of [analytics governance](analytics-governance.md). **In force since 2026-11-05** (Sam approved the schedule on
2026-11-04, [decisions](../decisions.md); `migration_v52.sql`, [task](../tasks/done/2026-11-04-analytics-retention.md)).
A weekly job, `sh-retention-weekly` (pg_cron, Sundays 09:23 UTC = 3:23 am Central), runs `sh_retention_run(true)`, which
does exactly the deletes marked "the weekly job" below and nothing else. A new kind of delete needs Sam's OK first.

## How to check it

- `select sh_retention_status();`: the schedule and the last 8 runs (what each removed, the database size then). The
  admin page shows the same as the **Retention** row of Insights → Data quality, flagged if a week was missed.
- `select sh_retention_run();` (no argument): what a run would remove now. **Counts only, nothing is deleted.**
- `select sh_retention_run(true);` runs it by hand (the job does this; only for a missed week or right after a change).
- `select * from cron.job_run_details order by start_time desc limit 5;`: whether the job ran and any error.
- `node tools/release/retention.js` tests every delete on a throwaway database built from `supabase/schema.sql` (CI runs it).

## Why it matters

- **Storage.** The project is on Supabase's free plan, which allows a 500 MB database and switches a project that goes
  past it to read-only: answers, progress sync, reports and check-ins would all stop saving. On 2026-11-04 the database was
  217 MB and grew about 39 MB in the last exam week (`activity_pings` about 29 MB of that). After the first run it is
  200 MB, and raw pings no longer pile up: they stay at about 30 days' worth.
- **Privacy.** Rows with a `visitor_id` are pseudonymous, not anonymous: a browser's full study history is a profile. Keep
  per-person rows only as long as a feature or a retrospective needs them ([learner-data-privacy](../rules/learner-data-privacy.md)).

## The schedule

| Data | Keep per-person rows | Then | Done by | Why |
|---|---|---|---|---|
| `activity_pings` (raw pings) | 30 days | delete; `activity_hourly` and `activity_visits` keep the same time at hour level | the weekly job | Every reader uses the hourly rollup; raw pings were 2/3 of the database |
| `activity_hourly`, `activity_visits` | the school year | collapse to hub × section × day with people counts, no ids | **approved, not built yet**: a job before the school year ends ([inbox](../tasks/inbox.md)) | Retrospectives and cross-hub comparisons need per-person days and minutes for a year |
| `personal_answers`, `xp_seen`, `xp_days` | keep | revisit when the class graduates | | Ranks, XP, mastery and progress sync are built from them; deleting answers lowers students' ranks |
| `ui_click_reach` | 90 days | delete (`ui_clicks` keeps the counts, no ids) | the weekly job | Reach is read for recent features |
| `feature_events` | 180 days | collapse into `feature_daily` (day × page × kind, people and `n`, no ids), then delete | the weekly job | Feature reach is read per hub and per term |
| `question_flags`, `hub_suggestions` | the visitor id until 120 days after resolving | id set to null; the text and the reply stay | the weekly job | Replies show in the sender's Inbox for 60-90 days |
| `exam_debriefs` | the visitor id for a year after the check-in | id replaced by `anon-<row id>` (the column can't be null); answers stay | the weekly job | Check-ins are read against the person's use only in that hub's retrospective |
| `survey_responses` | "No thanks" rows until the survey closes; answers keep their id until 90 days after it closes | decline rows deleted; answer rows get `anon-<row id>` | the weekly job | The decline rows only stop a live survey asking twice. Closed = not active or past `ends_at`; when it closed = `ends_at`, else its last response |
| `podcast_reactions`, `podcast_comments`, `podcast_comment_reports` | until the hub's page comes down | delete with the hub | by hand, with the archiving | The episode leaves the site with its hub |
| `question_events` | the school year | collapse to hub × qid × version totals (tries, right, choices, medians), no ids | **proposed, not approved**: added by the question-health work after Sam's call; ask Sam | Question health reads 120 days per person (tries and retries need the person) |
| `question_feedback` | until the hub's page comes down | delete with the hub, or keep counts per question with no ids | **proposed, not approved**: ask Sam | One thumb per person per question, read only while the hub is live |
| `link_attempts` | 7 days | delete | the weekly job | Only the last hour is read (rate limit) |
| Who has a hub open, and what their Timmy is wearing (Realtime presence, [event-taxonomy](event-taxonomy.md)) | not stored | gone when the tab closes | nothing to run | No visitor id or name; never written to a table. A hub tab's own random key stays in its browser while it is open, for the "You" plate |
| `zz-test` and blank-hub rows | none | delete (pings, click reach, feature events, hourly rows, click counts) | the weekly job | Test data |
| `question_stats`, `question_choices`, `question_versions`, `question_reviews`, `ui_clicks`, `search_terms`, `mode_stats`, `presence_hourly`, `hub_recaps`, `changelog`, `feature_daily`, `retention_runs`, `hub_archive_log` | keep | | | No visitor ids; small |
| Trophies and games: `achievements`, `arcade_scores`, `egg_events`, `nuke_*`, `exam_luck`, `correct_streaks`, `visitor_names`, `visitor_links`, `question_pins` | keep | | | They are the students' own records and settings |
| The game layer (migration_v54, from the release): `xp_awards`, `xp_boosts`, `answer_xp`, `game_baseline`, `pet_purchases`, `pet_inventory`, `pet_equipped`, `costume_log` | keep | revisit when the class graduates, with `personal_answers` | | XP, gold crowns and what students bought are built from them; deleting them lowers XP or takes things away. `answer_xp` goes with its answer |
| `xp_sessions` | keep for now | **proposed, not approved**: delete sessions older than 30 days in the weekly job (only the last 6 hours are read); ask Sam | | A mock's or game's start and finish |
| `ideas`, `idea_votes`, `idea_reports`, `idea_notes` | keep while the board is up; an idea hidden by reports or by Sam, 90 days (Sam, 2026-11-11) | delete the hidden idea with its votes, reports and notes | **approved, not built yet** | Public to the class under the poster's name; votes and notes are per person. An author's own delete removes the idea, its votes, reports and notes at once (`delete_my_idea`; Sam, 2026-11-11: nothing of it is kept) |
| `question_keys`, `shop_items`, `podcast_episodes`, `report_outcomes`, `game_config` | keep | | | No visitor ids |

A student who asks for their data to be deleted: there is no self-serve way yet, and a student can't see their own id.
Until there is, Sam deletes by the id from the student's own browser, never by guessing from a name.

## The first run (2026-11-05)

Removed 89,387 raw pings older than 2026-10-06 (Perio 31,265, MSK 3 29,335, Hepatobiliary 28,775, GI 1 and Genetics a
few; Occlusion's, PCD 3's, MSK 4's and Heme & Endo's start on 2026-10-07 or later, so the next runs reach them), 81 survey
"No thanks" rows of closed surveys, 14 link attempts and the 3 test feature events.
No report, suggestion, check-in or survey answer was old enough to lose its id. Every hub's `activity_hourly` total and
visit count was the same before and after; every archived hub's recap (`get_hub_recap`) came out identical. Dropping the
unused `activity_pings_visit_idx` took the database from about 221 MB to 200 MB; the deleted rows' space is reused by new
rows (the reported size only shrinks after a `VACUUM FULL activity_pings`, which locks the table for a minute or two:
a quiet-hour step, only if the size ever matters).

## What changed so it could run (migration_v52)

1. **Deleting pings no longer wipes their hourly rollup.** `sh_activity_on_delete` / `sh_activity_on_update` skip the
   rebuild when the transaction sets `sh.keep_rollups = 'on'` (the job and device linking do). An ordinary delete still
   rebuilds.
2. **Linking devices moves the rollups.** `redeem_link_code` moves the linked id's `activity_hourly` and
   `activity_visits` rows itself, then moves the raw pings with the rebuild off, so hours whose raw pings are gone stay.
3. **Readers moved to the rollup.** `get_hub_recap`, `tools/retro.sql`, `tools/lessons-daily.sql` and the lessons-audit
   skill read `activity_hourly` (`get_exam_debriefs` and `sh_insights` already did). Only the admin page's Live view
   (the last few minutes) and the data-quality checks (last write, last 7 days) still read raw pings.
4. **The recap's old idle cap is gone.** Before 2026-09-25 there was no idle rule, and the recap counted only the first
   3 hours of each visit from then. That needs the raw pings. It only ever mattered for Hepatobiliary (14 long visits,
   4,300 pings, 1,792 minutes): its published recap keeps 10,198 minutes, but a recap made now says 11,990, as the
   Insights tab already did. Don't republish Hepatobiliary's recap ([analytics-data-quality](analytics-data-quality.md)).
5. Answers are never deleted (the `personal_answers_xp_*` triggers would lower ranks). Take a hub's retrospective before
   its page comes down as before: the hourly rollup keeps everything `tools/retro.sql` reads.

Related: [analytics-governance](analytics-governance.md) · [event-taxonomy](event-taxonomy.md) ·
[analytics-data-quality](analytics-data-quality.md) · [learner-data-privacy](../rules/learner-data-privacy.md)
