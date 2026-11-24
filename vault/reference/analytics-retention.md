---
type: reference
tags: [analytics, supabase, retention, privacy]
---

# Analytics retention: how long each kind of row is kept

Part of [analytics governance](analytics-governance.md). **In force since 2026-11-05** (Sam approved the schedule on
2026-11-04, [decisions](../decisions.md); `migration_v52.sql`, [task](../tasks/done/2026-11-04-analytics-retention.md)).
A nightly job, `sh-retention-nightly` (pg_cron, every night 09:23 UTC = 3:23 am Central; weekly on Sundays, `sh-retention-weekly`,
until `migration_v74.sql`), runs `sh_retention_run(true)`, which does exactly the deletes marked "the nightly job" below and
nothing else. A new kind of delete needs Sam's OK first.

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
  200 MB, and raw pings no longer pile up: they stay at about 3 days' worth (30 until 2026-11-18, `migration_v74.sql`).
- **Privacy.** Rows with a `visitor_id` are pseudonymous, not anonymous: a browser's full study history is a profile. Keep
  per-person rows only as long as a feature or a retrospective needs them ([learner-data-privacy](../rules/learner-data-privacy.md)).

## The schedule

**The shorter windows Sam approved on 2026-11-22** ([the task](../tasks/2026-11-22-sustainable-for-years.md), package 1;
[decisions](../decisions.md)) are `migration_v95.sql`: `question_events` roll up when the hub's page comes down (not after the
year), `ui_click_reach` 30 days with a daily roll-up, `feature_events` at 60 days. The rows below say so. Applied on 2026-11-22
(01:03 UTC): the first run rolled up 129,939 question-health rows of the hubs already down and 19,358 click rows, and the
database went from 360 MB to 319 MB after compacting ([the task's Log](../tasks/2026-11-22-sustainable-for-years.md)).
**Approved, not built yet** (package 2, `migration_v96`): 30 days after a hub's page comes down, its answers and their XP
rows packed into one summary row per person per hub.

**When each hub's page came down: `hubs_down`** (migration_v95; admin-only, no ids): `hub` (primary key), `day` (the
Central day its page came down), `noted_at`. The After merge workflow's `down` step writes it when a push deletes
`hubs/<hub>/index.html` (the first day is kept if the step runs again) and deletes the row when a push adds the page back,
so a live hub's rows are never rolled up ([after-a-merge](../how-to/after-a-merge.md)). v95 filled in the hubs already down
from the hub notes and the change log (`DEPLOY_NOTES*.md`) (Genetics left no record: its day is its last saved answer, 2026-09-10). A hub
taken down or brought back without a push (by hand): add or delete its row by hand. Package 2 counts its 30 days from it.

| Data | Keep per-person rows | Then | Done by | Why |
|---|---|---|---|---|
| `activity_pings` (raw pings) | 3 days (Sam, 2026-11-18: "do 3 days"; 30 before, `migration_v74.sql`) | delete; `activity_hourly` and `activity_visits` keep the same time at hour level | the nightly job | Every reader uses the hourly rollup; the raw pings are read only for who is studying now (15 minutes), the admin page's newest-write check, and a repair after an outage (3 days covers one found after a weekend: [the outage's](../../tools/data-fixes/2026-11-18-outage-time.sql)). They were 166 MB of the 419 MB database on 2026-11-18 |
| `activity_hourly`, `activity_visits` | the school year (365 days, in whole Central days) | collapse into `activity_daily` (day × hub × section: people, pings) and `activity_visits_daily` (day: visits, people), no ids, then delete. **First what the hours paid in time crowns** (100 an hour since migration_v68, `sh_time_crowns`) goes into `activity_time_kept` (visitor → the collapsed hours' pings, capped at 144 a clock hour), which `sh_time_crowns` adds before rounding, so no balance moves; linking devices moves it (a trigger on `visitor_links`). **Before a hub's first day is collapsed** the job keeps its Insights per-person numbers (people, answered, one day, 3+ days, under 5 minutes, median and p90 minutes, median answers, people per surface, the check-ins' median minutes) in `insight_cards_kept`, one row a hub with no ids (`migration_v101.sql`); `sh_insights` reads them from then on, and it and `get_hub_recap`, `tools/retro.sql` and `tools/lessons-daily.sql` add the collapsed days' minutes from `activity_daily` | the nightly job (`migration_v93.sql`; the first collapse about 2027-09-13, a day a night) | Retrospectives and cross-hub comparisons need per-person days and minutes for a year. A student's own deletion (below) includes their `activity_time_kept` row |
| `personal_answers`, `xp_seen`, `answer_xp` and the answers' `xp_awards` rows (`src` `answer`, one an answer) | while the hub's page is up, and 30 days after it comes down (Sam's D, 2026-11-22: [the task](../tasks/2026-11-22-sustainable-for-years.md)); a live hub's are kept | **pack** each person's answers on the hub into one `answers_packed` row (below) and one award row with the same XP, then delete them (`answer_xp` goes with its answer). A person's answers on a hub go all together, once the newest is over 30 days old | the nightly job (`migration_v96.sql`: `sh_pack_answers`, at most about 20,000 answers a night, oldest hub first); the first, Genetics and Hepatobiliary, at once; most hubs about 2026-12-19 | Nobody's XP, crowns, rank, journey, trophies, medals or board place moves: they're stored (`xp_visitors`, `xp_award_totals`, `achievements`) or rebuilt with the summaries (`sh_xp_rebuild`). Given up: the answer-by-answer detail of a hub nobody can open; a hub brought back starts its question progress over. A hub's recap and retrospective are made before its page comes down |
| `answers_packed` (migration_v96) | keep | revisit when the class graduates, with `xp_awards` | | One row per person per packed hub: answers, right, questions, first tries right, right on the latest try, days studied, first and last answer, the medal reached, the XP and crowns the answers paid, each day's share (`day_rows`, which the rebuild adds to `xp_days`) and the retries report's counts. Moved with Link my devices (a trigger on `visitor_links`); read by `first_seen`, `get_hub_mastery` and the admin page's Insights, retries, drift check and check-ins. A student's own deletion includes it and their `pack:` award rows |
| `xp_days` | keep | revisit when the class graduates | | One row a person a day studied: ranks, days studied, the leaderboard's run of days and Timmy's HP read it; not touched by the pack |
| `ui_click_reach` | 30 days (Sam, 2026-11-22; 90 until `migration_v95.sql`) | roll up into `ui_click_reach_daily` (day × page × target: people, no ids), then delete; `ui_clicks` keeps the counts, no ids | the nightly job | Reach is read for recent features. A retrospective of a hub studied longer than 30 days reads the daily roll-up for the older days (`tools/retro.sql`: most people on one day, a floor). The admin page's Clicks view over 90 days counts people over the last 30 |
| `feature_events` | 60 days (Sam, 2026-11-22; 180 until `migration_v95.sql`) | collapse into `feature_daily` (day × page × kind, people and `n`, no ids), then delete | the nightly job | Feature reach is read per hub and per term. The Insights tab's tours and settings per hub count the last 60 days' people since v95 (they read `feature_events` whole). The bowling egg's `egg:bowling=<clip>` (from the release) is one of these rows; its run and sightings are kept on the device only, never in the database. So is visiting's `place:visit` (from the release): a count of visits, never whose place. So are a lecture's one-page sheet's `sheet:open` and `sheet:hy` (from 2026-11-22; `sheet:print` was sent for a few hours that day, until Sam took printing out): counts, never which lecture. So are Listen's device-voice rows (from 2026-11-24, BUG-199): `tts:voice-error=<code>`, the browser's error code only (never the words, the voice's name or the device), and `tts:secs` / `tts:end`, as for a recording |
| `question_flags`, `hub_suggestions` | the visitor id until 120 days after resolving | id set to null; the text and the reply stay | the nightly job | Replies show in the sender's Inbox for 60-90 days |
| `exam_debriefs` | the visitor id for a year after the check-in | id replaced by `anon-<row id>` (the column can't be null); answers stay | the nightly job | Check-ins are read against the person's use only in that hub's retrospective |
| `survey_responses` | "No thanks" rows until the survey closes; answers keep their id until 90 days after it closes | decline rows deleted; answer rows get `anon-<row id>` | the nightly job | The decline rows only stop a live survey asking twice. Closed = not active or past `ends_at`; when it closed = `ends_at`, else its last response |
| `podcast_reactions`, `podcast_comments`, `podcast_comment_reports` | until the hub's page comes down | delete with the hub | by hand, with the archiving | The episode leaves the site with its hub |
| `question_events` | while the hub's page is up (Sam, 2026-11-22; a live hub's rows still collapse at the school year, as above) | collapse into `question_events_daily` (day × hub × qid × version: people, answers, right, first tries, retries, unanswered reads, the picks, median times), no ids, then delete | the nightly job: the night after the hub goes into `hubs_down`, a hub at a time (`sh_retention_hub_down`, `migration_v95.sql`), and every night after for rows its page sent later; a live hub's at the year (`migration_v93.sql`) | Question health reads 120 days per person (tries and retries need the person); `question_stats` and `question_choices` keep the class's all-time totals |
| `question_feedback` | until the hub's page comes down | delete with the hub, nothing kept (Sam, 2026-11-21: "Delete with the hub") | the After merge workflow's `down` step, on a push that deletes `hubs/<hub>/index.html` ([after-a-merge](../how-to/after-a-merge.md)); the hubs down before it: `tools/data-fixes/2026-11-21-feedback-of-hubs-down.sql` | One thumb per person per question, read only while the hub is live |
| `link_attempts` | 7 days | delete | the nightly job | Only the last hour is read (rate limit) |
| Who has a hub open, and what their Timmy is wearing (Realtime presence, [event-taxonomy](event-taxonomy.md)) | not stored | gone when the tab closes | nothing to run | No visitor id or name; never written to a table. A hub tab's own random key stays in its browser while it is open, for the "You" plate |
| `zz-test` and blank-hub rows | none | delete (pings, click reach, feature events, hourly rows, click counts) | the nightly job | Test data |
| `activity_daily`, `activity_visits_daily`, `question_events_daily` (migration_v93), `ui_click_reach_daily` and `hubs_down` (migration_v95), `insight_cards_kept` (migration_v101: a hub's per-person Insights numbers the night its first day was collapsed) | keep | | | Totals with people counts, no ids |
| `question_stats`, `question_choices`, `question_choices_past`, `question_versions`, `question_reviews`, `ui_clicks`, `search_terms`, `mode_stats`, `presence_hourly`, `hub_recaps`, `changelog`, `feature_daily`, `retention_runs`, `hub_archive_log`, `eve_bosses` (migration_v97: an exam-eve boss's count and how it ended, one row an eve) | keep | | | No visitor ids; small |
| Trophies and games: `achievements`, `arcade_scores`, `egg_events`, `nuke_*`, `exam_luck`, `correct_streaks`, `visitor_names`, `visitor_links`, `question_pins` | keep | | | They are the students' own records and settings |
| The game layer (migration_v54, from the release): `xp_awards` (but a packed hub's answers' rows, above), `xp_boosts`, `answer_xp` (but a packed hub's), `game_baseline`, `pet_purchases`, `pet_inventory`, `pet_equipped`, `costume_log`, `week_pennants` (migration_v98: which weeks a person reached 100 answers), `crown_gifts` (migration_v100: the crowns Sam gave by hand, a row a gift) | keep | revisit when the class graduates, with `personal_answers` | | XP, gold crowns and what students bought are built from them; deleting them lowers XP or takes things away. `answer_xp` goes with its answer. The shop's taps (`shop:open`, `shop:buy:<kind>`, `shop:spotted`, from the release; `shop:collection` and the place's `place:collections`, from 2026-11-19) are `feature_events` rows and follow that line; a collection's bonus (migration_v75) is an `xp_awards` row, kept with the rest; a mystery box opened (migration_v99) is a `pet_purchases` row of kind `box` and its piece a `pet_inventory` row, kept with the rest (its tap, `shop:box:<rarity>`, is a `feature_events` row); Studying now (`get_studying_now`) stores nothing: it reads the study pings already kept; a rare costume's day is `costume_log`, kept here |
| Learn and Flashcards (migration_v56, from the release): `card_reviews` | keep | revisit when the class graduates, with `personal_answers` | | Each student's flashcard schedule and Learn progress are rebuilt from them on another device, and their `card` XP is in `xp_awards`; deleting them resets schedules and lowers XP. Moved with Link my devices |
| The prizes (migration_v68): `xp_runs`, `game_records`, `prize_seen` | keep | revisit when the class graduates, with `xp_awards` | | A visitor's current run (one row, overwritten), the class's record and its holder, the trophies held when the prizes began (so they don't pay twice) |
| The Crowns board (migration_v99): `crowns_board` | while the person is in `xp_visitors` (one row each, overwritten) | dropped, with a linked device's row | `sh_crowns_refresh` (pg_cron `sh-crowns-board`, every 2 minutes) | A cache of each person's crowns on hand, worked out from `xp_awards` and `pet_purchases`; deleting it loses nothing, the job fills it again |
| `notes_reads` (migration_v68) | 2 days | delete | `notes_start_v2` itself, for the caller's own rows | Only the time between opening a lecture and its end is read, for the 50 a read pays; no one else reads it |
| `xp_sessions` | keep for now | **proposed, not approved**: delete sessions older than 30 days in the nightly job (only the last 6 hours are read); ask Sam | | A mock's or game's start and finish |
| `ideas`, `idea_votes`, `idea_reports`, `idea_notes` | keep while the board is up; an idea hidden by reports or by Sam, 90 days (Sam, 2026-11-11) | delete the hidden idea with its votes, reports and notes | nightly job, `ideas_hidden` (`migration_v58.sql`: `ideas.hidden_at` is set by a trigger when an idea is hidden, cleared when it's restored; an idea already hidden when v58 ran counts from that day) | Public to the class under the poster's name; votes and notes are per person. An author's own delete removes the idea, its votes, reports and notes at once (`delete_my_idea`; Sam, 2026-11-11: nothing of it is kept) |
| `question_keys`, `shop_items`, `podcast_episodes`, `report_outcomes`, `game_config` | keep | | | No visitor ids |
| Ask Timmy (migration_v55, from the release): `timmy_chats`, `timmy_messages` | the school year, with the visitor id | **proposed, not approved**: delete with the end-of-year job (or keep counts by day, hub and kind with no ids); ask Sam then. Until then kept whole, as Sam asked ("store all chat logs with timmy") | not built | The whole chat is read on the admin page's Timmy tab and its not-covered list points at gaps in the content. A Timmy report is a `question_flags` row and follows its line above |
| Ask Timmy's cache marks (migration_v85): `timmy_cache_marks` | a week | when a hub's whole content was last read, by a key made of the hub and a hash; no visitor, no text | built: `timmy_cache` clears rows over a week old each time it marks one | The function sends a part of the content when the whole one hasn't been read for 55 minutes |
| `timmy_config` | keep | | | No visitor ids |

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
5. Answers are never deleted by an ordinary delete (the `personal_answers_xp_*` triggers would lower ranks); since
   migration_v96 the pack deletes a down hub's with `sh.packing` on, which the delete trigger skips, keeping every total
   itself. Take a hub's retrospective and recap before its page comes down as before (`tools/retro.sql` and
   `get_hub_recap` read its answers, which are packed 30 days later).

Related: [analytics-governance](analytics-governance.md) · [event-taxonomy](event-taxonomy.md) ·
[analytics-data-quality](analytics-data-quality.md) · [learner-data-privacy](../rules/learner-data-privacy.md)
