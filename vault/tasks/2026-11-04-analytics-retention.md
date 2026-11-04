---
type: task
status: blocked
hub: site
created: 2026-11-04
requested-by: Sam
due: 2026-12-15
waiting-on: Sam's call on the retention schedule and the two quick wins in vault/reference/analytics-retention.md
agent:
pr:
---

# Put the analytics retention schedule in force

## Goal

Keep the Supabase database under the free plan's 500 MB (it was 217 MB on 2026-11-04 and grew about 39 MB in an exam week,
so roughly 7 exam weeks of headroom; past the limit the project turns read-only and the hubs stop saving answers), and
stop keeping per-person rows longer than a feature needs them.

## Context

- The proposal, the storage numbers and the traps: [analytics-retention](../reference/analytics-retention.md).
- Rules: [learner-data-privacy](../rules/learner-data-privacy.md), [ship-it-now](../rules/ship-it-now.md).
- Governance overview: [analytics-governance](../reference/analytics-governance.md). The Insights tab's Storage row
  (`review/`) shows size and weeks left.
- `due` is a guess at when exam-season growth would reach about 450 MB; check the Storage row and move it.

## Done when

- [ ] Sam approves, changes or rejects the schedule; the call is a line in [decisions](../decisions.md).
- [ ] Quick wins, if approved: drop `activity_pings_visit_idx` (26 MB, unused since v45); delete the 3 `zz-test` rows.
- [ ] Readers of raw `activity_pings` read `activity_hourly` instead: `get_exam_debriefs`, `get_hub_recap`,
      `tools/retro.sql`, `tools/lessons-daily.sql`, `.claude/skills/lessons-audit/SKILL.md`.
- [ ] `sh_activity_on_delete` no longer rebuilds rollups for retention deletes, and `redeem_link_code` moves
      `activity_hourly` / `activity_visits` rows instead of rebuilding them from raw pings.
- [ ] A retention function (admin-only) runs exactly the approved deletes; how it runs (by hand in each lessons audit, or a
      scheduled job) is Sam's call.
- [ ] Optional, if Sam wants it: a "Delete my data" button in Settings (all rows for this browser's id) and the student's
      id shown in Stats so a deletion request can be honored.
- [ ] [analytics-retention](../reference/analytics-retention.md) says "In force" with the dates; `supabase/schema.sql`
      refreshed.
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)

## Log

- 2026-11-04: written from the analytics governance work (Claude Code). Nothing deleted; waiting for Sam.

## Outcome
