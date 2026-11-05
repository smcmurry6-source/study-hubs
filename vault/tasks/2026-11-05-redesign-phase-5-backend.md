---
type: task
status: review
hub: widget
created: 2026-11-05
requested-by: Sam
due:
waiting-on: Sam's review and approved manual application of migration_v53.sql after merge; local release dependencies for the blocked suites
agent: Codex
pr: https://github.com/smcmurry6-source/study-hubs/pull/261
---

# Redesign phase 5: the backend and loading

## Goal

One `bootstrap` RPC per page load; rank, board and trophy RPCs only when a panel opens; `sh_visitor_xp` cached per visitor (kept by trigger) so rank calls stop recomputing the whole class; `get_pet_days` not polled; one analytics flush timer; and the advisor fixes (search_path on 6 functions, a primary key on `link_attempts`, 2 unused indexes dropped).

## Context

- The numbers to beat are in the redesign audit and plan, sections 1 and 3 (the planning note is pending its own merge to `main`).
- This is tier 3: preview with fixtures, release suites, written rollback and Sam's approval are required before merge ([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md)).
- New SQL belongs in `migration_v53.sql` (or later) and in the refreshed [schema snapshot](../../supabase/schema.sql). It must not be applied to the live project from this task.

## Done when

- [x] Hub and dashboard use one eager widget-bootstrap round trip (plus presence); rank, board and trophy data remain lazy.
- [x] The visitor XP cache is trigger-maintained, and rank/trophy reads no longer re-aggregate `personal_answers` for the whole class.
- [x] `get_pet_days` is not polled; click and question-health analytics share one flush timer.
- [x] The six search-path settings, `link_attempts` primary key and two unused-index removals are in the migration and snapshot.
- [ ] Required CI and release suites pass; preview UAT uses fixture data only.
- [x] The draft PR says the migration still needs applying, and this note, `DEPLOY_NOTES.md` and the PR are written back.

## Log

- 2026-11-05: written from the agreed redesign plan.
- 2026-11-05: implementation started on `codex/redesign-phase-5-backend` from `origin/main`.
- 2026-11-05: implemented the fixture-safe bootstrap, trigger-maintained `xp_visitors` cache and advisor cleanup in `migration_v53.sql`; refreshed the schema snapshot. Previewed the dashboard and a returning-learner hub through `node tools/preview/serve.js` using browser-held fixtures only; no class data or live migration was touched.
- 2026-11-05: `node tools/ci/syntax.js` and `node tools/ci/vault.js` pass. `node tools/ci/smoke.js` is blocked because this checkout lacks `playwright`. `node tools/release/run.js` confirms those passes, reports its browser/database suites blocked by missing `playwright`, `axe-core` and PostgreSQL binaries, and reports the pre-existing untracked `.cache/boards-sources/*.pdf` files in its public-repo scan. They were preserved and are not part of this branch.
- 2026-11-05: draft PR [#261](https://github.com/smcmurry6-source/study-hubs/pull/261) opened from `codex/redesign-phase-5-backend`; its template includes the release-runner summary and the manual migration requirement.

## Outcome

Ready for Sam's review in [#261](https://github.com/smcmurry6-source/study-hubs/pull/261): hub and dashboard eager reads now flow through `get_widget_bootstrap`; visitor XP is summarized in the trigger-maintained `xp_visitors` cache; rank, leaderboard, mastery and trophy work stays panel-open; and Timmy's days read once rather than polling. `migration_v53.sql` and the schema snapshot include the six `search_path` fixes, `link_attempts` primary key and two index drops. The migration was deliberately **not** applied to the live project; it needs an approved manual application after merge. Fixture UAT showed the dashboard and a returning hub loading normally with no visual changes. Syntax and vault checks pass; the release limitations are recorded above.
