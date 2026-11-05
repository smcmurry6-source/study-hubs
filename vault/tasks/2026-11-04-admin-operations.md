---
type: task
status: review
hub: site
created: 2026-11-04
requested-by: Sam
due: 
waiting-on: Sam's look at the preview and written approval; then migration_v50 is applied and the PR merged
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/236
---

# Admin operations: who's studying now, hub archive overrides, newest-first check-ins

## Goal

Make running the hubs from the admin page (`review/`) safer and clearer: see who is studying right now without
exposing anyone, archive or reopen a hub by hand without touching its files or anyone's data, and read check-ins and
surveys newest first.

## Context

- How it works: [admin-operations](../reference/admin-operations.md)
- Sam's calls: [decisions](../decisions.md) (2026-11-04: leaderboard names; manual state until cleared or an end time)
- Process: [preview-and-release-test](../rules/preview-and-release-test.md), tier 3 (a migration and the dashboard)
- Bug fixed on the way: BUG-010 in the [bug log](../release/bug-log.md)
- Test report: [2026-11-04-admin-operations](../release/reports/2026-11-04-admin-operations.md)

## Done when

- [x] Live tab: count and leaderboard names, a documented 3-minute threshold, polling only while open and visible
- [x] Check-ins and surveys newest first by `created_at`, groups by their newest check-in
- [x] Archive overrides: Live / Archived / Hidden / Automatic, optional end time, confirmation, audit log, stale-tab check,
  one precedence rule shared by the dashboard, the hubs and the admin page; nothing deleted
- [x] Migration, `supabase/schema.sql`, vault notes, change log (no About entry: Sam keeps admin information off it)
- [x] CI and the release suites run on fixtures; screenshots shown to Sam
- [ ] Sam approves the release in writing
- [ ] `migration_v50.sql` applied to the live project (connector `apply_migration`), then the PR merged
- [ ] After the release: `node tools/release/postcheck.js`, the Live and Hubs tabs load on the live admin page, BUG-010
  retested, monitoring at 1, 24 and 48 hours; PR #205 closed (its function is in v50)

## Log

- 2026-11-04: written; built on PR #233's preview process, then moved onto `main` when #233 merged. Waiting for Sam.

## Outcome
