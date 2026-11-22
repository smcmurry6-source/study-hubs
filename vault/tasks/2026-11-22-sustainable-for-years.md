---
type: task
status: in-progress
hub: site
created: 2026-11-22
requested-by: Sam
due: 2026-12-02
waiting-on:
agent:
pr:
---

# Keep the repo, the site and the database healthy for years

## Goal

The boards hub is meant to stay live until about August 2028, and every other hub comes and goes each term. Sam asked
whether the GitHub repo, the Pages site and the Supabase database will hold up that long without things running badly,
and agreed on 2026-11-22 to this plan ("Okay all that is good to me"; [decisions](../decisions.md)). The first two
packages go before the free database runs out of room, and before Review of Systems' mocks (Thu Dec 3 and Thu Dec 10) if
they can.

## Where things stood (2026-11-21)

- **The published site:** 40 MB of GitHub Pages' 1 GB (`node tools/ci/size.js`), no audio. Fine for years.
- **The repo:** GitHub counts about 2.4 GB (`gh api -X GET search/repositories -f q='repo:smcmurry6-source/study-hubs' --jq '.items[0].size'`,
  in KB), about 95% of it mp3s left in the history after the audio came off the site. Its limits (1 GB for a site's repo, 5 GB
  "strongly recommended") are recommendations; nothing is enforced. Without new audio it grows slowly.
- **The database:** 359 MB of the Free plan's 500 MB, where it turns read-only and every save fails. Each answer keeps
  about 1.3 KB for good (`personal_answers`, `answer_xp`, `xp_awards`, `xp_seen`: 171 MB together), and its
  question-health rows for a school year. The class answered about 84,000 questions in October and 123,000 in November
  through the 21st, about 4-9 MB a day, so the room left lasts weeks, not years. **All but 70 of the 236,000 saved answers
  belong to hubs whose pages are down.** Pings already stay at 3 days (about 46 MB, steady).
- The Free plan also pauses a project after a week with no activity (a break with nobody studying), and its small shared
  server is what struggled on 2026-11-18. **The fallback is Supabase Pro (about $25 a month)** if either bites; with the
  packages below, the database itself fits the free plan for years.

## The packages, most urgent first

### 1. Shorter windows for the analytics (`migration_v95.sql`)

- [x] A record of when each hub's page came down (`hubs_down`: hub, the day), written by the After merge workflow's `down`
      step (`tools/after-merge/run.js`, where it already deletes the hub's "Good question?" thumbs), filled in for every hub
      already down (the dates are in the hub notes and `DEPLOY_NOTES.md`). Package 2 uses it.
- [x] **Question health rolled up when a hub's page comes down** (Sam's B; this replaces 2026-11-21's "after the year"):
      the nightly job collapses that hub's `question_events` into `question_events_daily` as v93 does, then deletes them.
      Its first run takes every hub already down (about 37 MB). Review of Systems stays as it is while it's live.
- [x] **Clicks kept 30 days, not 90** (Sam's C), with a daily roll-up first (day × page × target: people, no ids), so a
      retrospective's reach still has a number for every day; `ui_clicks` keeps the counts as before.
- [x] **Feature events rolled up at 60 days, not 180** (Sam's C), into `feature_daily` as now.
- [x] `tools/retro.sql` and `tools/lessons-daily.sql` read the roll-ups where they read rows past the new windows.
- [x] `tools/release/retention.js` tests every new step on a throwaway copy: the right rows go, nothing else does, time
      crowns and XP don't move.
- [x] Applied by hand at 1-5 am Central in batches (its first run is a backfill:
      [run-sql-on-the-live-database](../how-to/run-sql-on-the-live-database.md)), then the shrunk tables compacted
      (`VACUUM FULL`, a few seconds each, at the same hour) so the space comes back; the size before and after in the Log.
- [x] The windows written where they live: [analytics-retention](../reference/analytics-retention.md),
      [event-taxonomy](../reference/event-taxonomy.md) if it states them, and **the About page's "What the hubs record"**
      ("which buttons and tabs you tapped is kept for 90 days, and which features you used for 180 days").

### 2. Pack away an archived hub's answers (`migration_v96.sql`)

- [ ] **30 days after a hub's page comes down** (Sam's D), the nightly job replaces each person's per-answer rows for that
      hub (`personal_answers`, `answer_xp`, the per-answer `xp_awards`, `xp_seen`) with one summary row per person per hub.
      The summary keeps generously, so later back pay and the retrospective's check-in comparison still work: answers,
      right, first-try right, days studied, first and last day, the medal reached, and the XP and crowns the hub's answers
      paid.
- [ ] **Nobody's numbers move:** XP, crowns, rank and journey, trophies, medals and leaderboard places read the banked
      totals (as v93 banked time crowns in `activity_time_kept`). One-time award keys stay, so nothing pays twice. The
      `personal_answers_xp_*` triggers don't take XP away for these deletes.
- [ ] Linked devices move the summary (a trigger on `visitor_links`), and a student's own deletion includes it.
- [ ] `tools/release/xp.js` proves it on a throwaway copy with the live schema: for every made-up visitor, every total
      before equals every total after, and a second run changes nothing.
- [ ] On the live database, at 1-5 am Central in batches, with the same before/after check over the real totals (counts
      only, nothing per person leaves the database), then `VACUUM FULL`. Most pages came down on 2026-11-19, so the first
      big pack is around 2026-12-19 (about 150 MB). The size before and after in the Log.
- [ ] [analytics-retention](../reference/analytics-retention.md)'s "keep, revisit when the class graduates" rows and the
      About page ("Your answers, XP, rank and trophies are kept") say what is kept now.
- Given up, as Sam agreed: the answer-by-answer detail of a hub nobody can open; if a hub ever came back, people keep
  their XP but start its question progress over.

### 3. Boards' storage stays bounded (Sam's E)

- [ ] The boards hub keeps each person's latest state on each item, daily totals for XP, and recent attempts (about 30
      days, for question health and paying once), so its storage grows with people × items (about 40 MB at most), not
      with time. The boards build picks how: a boards-only answer path, or folding old attempts into per-item state for
      every hub. Written in [the boards hub note](../hubs/boards.md).

### 4. The second free database

- [ ] The parked line in [the inbox](inbox.md): the analytics move to their own free project. After packages 1 and 2
      it's about load (about a third of the requests) more than room.

### 5. The repo

- [x] The rule: [no-narration-in-the-repo](../rules/no-narration-in-the-repo.md) (Sam's A: the history stays as it is).
- [ ] CI fails a change that adds a narration or Timmy Time recording (a file under `hubs/<hub>/audio/`, or
      `timmy-time.mp3` anywhere); the widget's fixed sounds stay allowed.
- [ ] When narration comes back: the audio repo the rule describes, `tools/narrate.py` and `tools/podcast/` writing to it,
      the engine fetching from it, and a way to wipe its history at each archiving.
- [ ] `DEPLOY_NOTES.md` trimmed: entries older than about a month move to a dated archive file next to it, so a session
      reads a few KB, not 200 (it costs every session about 50k tokens today).

### 6. A health line in every lessons audit

- [x] `tools/lessons-refresh.md` step 1 reads the database's, the repo's and the site's sizes against their limits and
      writes them in `LESSONS.md`'s Live signals.

## Log

- 2026-11-22: written from the chat (Claude Code, the session handling the merging), after measuring the repo, the site
  and the database; packages 5's rule and 6 done in the same PR.
- 2026-11-22: package 1 written (Claude Code): `migration_v95.sql` (`hubs_down`, `ui_click_reach_daily`,
  `sh_retention_hub_down`, `sh_retention_run`'s new windows), the After merge `down` step writing `hubs_down`, the reports,
  `tools/release/retention.js`, the notes and the About page. Measured first (read-only, 2026-11-22 afternoon): the database
  360 MB; `question_events` 38 MB, 129,939 of its rows on hubs already down (into about 12,900 daily rows), Review of
  Systems' 95 stay; `ui_click_reach` 27 MB, 19,358 of 108,995 rows past 30 days (into about 4,600 daily rows);
  `feature_events` 17 MB, none past 60 days yet (the oldest is 2026-10-20, so the first go about 2026-12-19). Applying it
  and compacting the tables wait for the session handling the merging, at 1-5 am Central; the sizes after go here.
- 2026-11-22 (7 pm Central on 2026-11-21, Sam's call: nobody studying, so not the quiet hours): `migration_v95.sql`
  applied by the session handling the merging at 01:03 UTC (apply_migration). Before, `sh_retention_run` was v93's
  (`md5(pg_get_functiondef)` e9c278ed682a7047333691ac5305afcf); after, `sh_retention_run` 847e75ef9f4050d0d87f8f0c43f1d1b7
  and `sh_retention_hub_down` f9f12cdf309b0f40bc569c5be6ab6e2e (`md5(prosrc)` 6aa3b0e2fa2cb5b28d46e7f097c64ca2 and
  d8824f4ca629b51c3e8e0b981c3368fe, matching the file); `hubs_down` has its 12 rows. The dry run counted 129,939
  question-health rows on down hubs, 19,358 click rows and no feature events, as measured. Backfilled a hub a call,
  smallest first (Perio's 43,148 rows took 2.9 s, none longer): 129,939 rows became 12,892 `question_events_daily` rows,
  with answers, right, first tries, views and picks matching the raw rows hub by hub; Review of Systems' 95 stay. Then one
  `sh_retention_run(true)` (4.4 s): 19,358 click rows became 4,559 `ui_click_reach_daily` rows (people summing to 19,358),
  and the night's old pings went. Compacted with `VACUUM (FULL, ANALYZE)` on `question_events` and `ui_click_reach` as a
  one-time pg_cron job (01:06 UTC, 3.3 s), then unscheduled. **Sizes:** the database 360 MB → 319 MB; `question_events`
  38 MB → 72 kB; `ui_click_reach` 27 MB → 19 MB; the new `question_events_daily` 3.2 MB and `ui_click_reach_daily` 568 kB.
  The migration file stays as applied (its header says 1-5 am; it went in early on Sam's say-so). Package 1 done.

## Outcome

Related: [no-narration-in-the-repo](../rules/no-narration-in-the-repo.md) ·
[analytics-retention](../reference/analytics-retention.md) · [shared-infrastructure](../reference/shared-infrastructure.md) ·
[learner-data-privacy](../rules/learner-data-privacy.md) · [the boards hub](../hubs/boards.md)
