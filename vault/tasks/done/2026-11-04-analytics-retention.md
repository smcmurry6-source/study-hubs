---
type: task
status: done
hub: site
created: 2026-11-04
requested-by: Sam
due: 2026-12-15
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/241
---

# Put the analytics retention schedule in force

## Goal

Keep the Supabase database under the free plan's 500 MB (it was 217 MB on 2026-11-04 and grew about 39 MB in an exam week,
so roughly 7 exam weeks of headroom; past the limit the project turns read-only and the hubs stop saving answers), and
stop keeping per-person rows longer than a feature needs them.

## Context

- The schedule, the storage numbers and the traps: [analytics-retention](../../reference/analytics-retention.md).
- Rules: [learner-data-privacy](../../rules/learner-data-privacy.md), [ship-it-now](../../rules/ship-it-now.md).
- Governance overview: [analytics-governance](../../reference/analytics-governance.md). The Insights tab's Storage and
  Retention rows (`review/`) show size, weeks left and the last run.

## Done when

- [x] Sam approves, changes or rejects the schedule; the call is a line in [decisions](../../decisions.md).
- [x] Quick wins, if approved: drop `activity_pings_visit_idx` (26 MB, unused since v45); delete the 3 `zz-test` rows.
- [x] Readers of raw `activity_pings` read `activity_hourly` instead: `get_exam_debriefs`, `get_hub_recap`,
      `tools/retro.sql`, `tools/lessons-daily.sql`, `.claude/skills/lessons-audit/SKILL.md`.
- [x] `sh_activity_on_delete` no longer rebuilds rollups for retention deletes, and `redeem_link_code` moves
      `activity_hourly` / `activity_visits` rows instead of rebuilding them from raw pings.
- [x] A retention function (admin-only) runs exactly the approved deletes; how it runs (by hand in each lessons audit, or a
      scheduled job) is Sam's call. (A weekly pg_cron job; Sam can switch it to by hand.)
- [ ] Optional, if Sam wants it: a "Delete my data" button in Settings (all rows for this browser's id) and the student's
      id shown in Stats so a deletion request can be honored. (Not asked for; left out.)
- [x] [analytics-retention](../../reference/analytics-retention.md) says "In force" with the dates; `supabase/schema.sql`
      refreshed.
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)

## Log

- 2026-11-04: written from the analytics governance work (Claude Code). Nothing deleted; waiting for Sam.
- 2026-11-04: Sam: "Yes to the data retention suggestions."
- 2026-11-05: `migration_v52.sql` applied after Sam's "go ahead" (numbered v50, then v51, while #236 and #240 took those
  numbers); first run; Sam: "merge when ready".

## Outcome

`migration_v52.sql` is live: the unused pings index is dropped, retention deletes and "Link my devices" keep the hourly
rollups, the recap reads `activity_hourly`, `sh_retention_run` / `sh_retention_status` exist (closed to visitors), and a
weekly pg_cron job (`sh-retention-weekly`, Sundays 3:23 am Central) runs the approved deletes. The first run removed
89,387 raw pings, 81 "No thanks" survey rows of closed surveys, 14 link attempts and the 3 test rows; every hub's hourly
totals and visit count matched before and after, every archived hub's recap came out identical, the database went from
about 221 MB to 200 MB, and the live permission audit found nothing. The repo's readers (`tools/retro.sql`,
`tools/lessons-daily.sql`, the lessons-audit skill) read the rollup; the admin page has a Retention row; the About page
says how long each kind of data is kept; `tools/release/retention.js` tests it all in CI.

Left: the school-year collapse of `activity_hourly` / `activity_visits` (approved, due before spring 2027) and Sam's call
on the `question_events` / `question_feedback` rows the question-health work proposed: both in the
[inbox](../inbox.md). The recap's pre-2026-09-25 idle cap went with the raw pings; only Hepatobiliary's (already
published) recap was affected ([analytics-data-quality](../../reference/analytics-data-quality.md)).
