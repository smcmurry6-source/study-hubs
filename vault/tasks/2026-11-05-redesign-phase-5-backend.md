---
type: task
status: review
hub: widget
created: 2026-11-05
requested-by: Sam
due: 
waiting-on: Sam's look and approval; migration_v53.sql applied to the live project
agent: Codex (part 1); Claude Code (rebase onto main and the release suites)
pr:
---

# Redesign phase 5: the backend and loading

## Goal

One `bootstrap` RPC per page load; rank, board and trophy RPCs only when a panel opens; `sh_visitor_xp` cached per visitor (kept by trigger) so rank calls stop recomputing the whole class; `get_pet_days` not polled; one analytics flush timer; the advisor fixes (search_path on 6 functions, a primary key on `link_attempts`, 2 unused indexes dropped); two widget bundles (core on load, the rest on idle or first use), one shared stylesheet, one self-hosted font, a thinner Supabase client with realtime presence kept, sw.js precaching the engine and fonts and caching content JSON stale-while-revalidate.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../rules/about-page.md),
  [learner-data-privacy](../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- The audit's backend numbers: the audit note, sections 1 and 3. Schema in `supabase/schema.sql`; a new `migration_v53.sql` (and up), applied through the connector, `supabase/schema.sql` refreshed ([repo map](../reference/repo-map.md)).
- Tests: `node tools/release/rls.js`, `admin-ops.js`, `retention.js` on a throwaway copy; `tools/release/perf.js` budgets lowered to the new sizes.

- **Suited to a parallel agent (Codex 5.6 Terra, Sam, 2026-11-05)**: this phase does not depend on the design work. The
  numbers to beat and the RPC inventory are in the audit note (sections 1 and 3) and in the session's architecture
  report summarized there; every change is verifiable with the release suites on a throwaway database.

## Done when

- [ ] Hub load: one bootstrap round trip (plus presence); dashboard the same
- [ ] `get_rank_profile` and friends under 50 ms; XP cache verified against the old function on live data (read-only comparison)
- [ ] The release suites pass; perf budgets lowered and met; sw.js version bumped
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-05: implementation started on `codex/redesign-phase-5-backend` from `origin/main`.
- 2026-11-05: implemented the fixture-safe bootstrap, trigger-maintained `xp_visitors` cache and advisor cleanup in `migration_v53.sql`; refreshed the schema snapshot. Previewed the dashboard and a returning-learner hub through `node tools/preview/serve.js` using browser-held fixtures only; no class data or live migration was touched.
- 2026-11-05: `node tools/ci/syntax.js` and `node tools/ci/vault.js` pass. `node tools/ci/smoke.js` is blocked because this checkout lacks `playwright`. `node tools/release/run.js` confirms those passes, reports its browser/database suites blocked by missing `playwright`, `axe-core` and PostgreSQL binaries, and reports the pre-existing untracked `.cache/boards-sources/*.pdf` files in its public-repo scan. They were preserved and are not part of this branch.

## Outcome

(pending)
