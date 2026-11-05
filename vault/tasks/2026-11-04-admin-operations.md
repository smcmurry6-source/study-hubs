---
type: task
status: review
hub: site
created: 2026-11-04
requested-by: Sam
due: 
waiting-on: Sam's first look at the signed-in admin views on real data; Sam closes PR #205
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/236
---

# Admin operations: who's studying now, hub archive overrides, newest-first check-ins, and the page's redesign

## Goal

Make running the hubs from the admin page (`review/`) safer and clearer: see who is studying right now without
exposing anyone, archive or reopen a hub by hand without touching its files or anyone's data, and read check-ins and
surveys newest first.

## Context

- How it works: [admin-operations](../reference/admin-operations.md)
- Sam's calls: [decisions](../decisions.md) (2026-11-04: leaderboard names; manual state until cleared or an end time)
- Process: [preview-and-release-test](../rules/preview-and-release-test.md), tier 3 (a migration and the dashboard)
- Bug fixed on the way: BUG-019 in the [bug log](../release/bug-log.md)
- Test report: [2026-11-04-admin-operations](../release/reports/2026-11-04-admin-operations.md)

## Done when

- [x] Live tab: count and leaderboard names, a documented 3-minute threshold, polling only while open and visible
- [x] Check-ins and surveys newest first by `created_at`, groups by their newest check-in
- [x] Archive overrides: Live / Archived / Hidden / Automatic, optional end time, confirmation, audit log, stale-tab check,
  one precedence rule shared by the dashboard, the hubs and the admin page; nothing deleted
- [x] Migration, `supabase/schema.sql`, vault notes, change log (no About entry: Sam keeps admin information off it)
- [x] CI and the release suites run on fixtures; screenshots shown to Sam
- [x] Sam's follow-up, "a full optimization of the admin page": redesigned with the taste-skill (sidebar views, a header
  per view, data per view, Overview of what's waiting, check-ins and searches split out, phone menu); #237's Insights
  tab moved in as a view
- [x] Sam approves the release in writing ("Merge when ready", 2026-11-05)
- [x] `migration_v50.sql` applied to the live project (connector `apply_migration`), then the PR merged
- [x] After the release: `node tools/release/postcheck.js`, the Live and Hubs views load on the live admin page, BUG-019
  retested (2026-11-05)
- [ ] PR #205 closed (its function is in v50)

## Log

- 2026-11-04: written; built on PR #233's preview process, then moved onto `main` when #233 merged. Waiting for Sam.
- 2026-11-04: Sam: keep admin information off the About page (reverted) and "a full optimization of the admin page"
  (done: [admin-operations](../reference/admin-operations.md), "The page").
- 2026-11-05: merged `main` (#237: Insights tab and its own `migration_v49.sql`); this PR's migration is now
  `migration_v50.sql`. Insights moved into the new layout. The "Release tests" check is red for reasons outside this
  PR (the same failures on #237): explained on the PR.
- 2026-11-05: Sam: "Merge when ready". Applied `migration_v50.sql` (the live audit found nothing), merged after CI's
  check passed. Post-release check and monitoring per the test report.
- 2026-11-05: `main` moved three times while CI ran (#235 top bars, #238 Patient Box cases, #239 small-screen fixes);
  each merged into the branch, both sides kept (the check-in bug renumbered BUG-019). "Release tests" went green once
  #235 and #239 were in. Merged as `e6a8f02`; postcheck passed; the live functions checked read-only (the test report).
- 2026-11-05: Sam dropped post-release monitoring for this release and every future one; the 1-hour check was cancelled
  before it ran.

## Outcome

Shipped in PR #236 (2026-11-05): the redesigned admin page, Live and Hubs views, newest-first check-ins, and
`migration_v50.sql` on the live project. Verified on fixtures and throwaway databases before release (the test
report), and on the live database with read-only checks after the migration (grants, RLS, a wrong passphrase refused,
the permission audit), and after the merge by `postcheck.js` and read-only calls to the live functions. Left:
Sam's first look at the signed-in views on real data, PR #205 closed by Sam.
