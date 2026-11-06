---
type: task
status: review
hub: widget
created: 2026-11-05
requested-by: Sam
due: 
waiting-on: Sam's look and approval; migration_v53.sql applied to the live project
agent: Codex (part 1); Claude Code (rebase onto main and the release suites)
pr: https://github.com/smcmurry6-source/study-hubs/pull/262
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

Part 1 (the loading and the database) is [PR #262](https://github.com/smcmurry6-source/study-hubs/pull/262); part 2 (the bundles, the
stylesheet, the font, the client and sw.js precaching) is still to do.

- [x] Hub load: one bootstrap round trip (plus presence); dashboard the same (part 1)
- [ ] `get_rank_profile` and friends under 50 ms (measure once `migration_v53.sql` is applied); XP cache verified against the old function on live data (read-only comparison): done, 157 of 157 visitors identical
- [ ] The release suites pass; perf budgets lowered and met; sw.js version bumped (`sh-v58`; budgets lowered with part 2)
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`)
- [ ] Preview link, phone and laptop screenshots, and Sam's look ("Sam approved this release" ticked by Sam)
- [ ] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome)
- [ ] Part 2: two widget bundles, one shared stylesheet, one self-hosted font, a thinner Supabase client, sw.js precaching the engine and fonts and caching content JSON stale-while-revalidate

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-05 (Codex): implementation started on `codex/redesign-phase-5-backend` from `origin/main`.
- 2026-11-05 (Codex): implemented the fixture-safe bootstrap, trigger-maintained `xp_visitors` cache and advisor cleanup in `migration_v53.sql`; refreshed the schema snapshot. Previewed the dashboard and a returning-learner hub through `node tools/preview/serve.js` using browser-held fixtures only; no class data or live migration was touched.
- 2026-11-05 (Codex): `node tools/ci/syntax.js` and `node tools/ci/vault.js` pass; the browser and database suites were blocked (no Playwright, axe-core or PostgreSQL on that machine). Draft PR #261.
- 2026-11-06 (Claude Code): #261 couldn't merge (it was branched before #253 added this note, so `DEPLOY_NOTES.md` and this note conflicted) and CI never ran. Rebased onto `main` as `claude/redesign-phase-5-backend`, conflicts resolved (both change-log entries kept; this note is #253's plan plus Codex's log). Ran every suite: `rls.js` caught BUG-032 (the cache dropped each day's first answer; fixed), `smoke.js` caught BUG-033 (Timmy past the screen's edge at the largest text, live already; fixed), `perf.js` counted the preview's own runtime against About's budget (now excluded).
- 2026-11-06 (Claude Code): the preview showed Codex's lazy ranks took away the badge by the name and every rank-up, level-up, trophy and mastery card until Stats was opened (17 of 108 people in a hub opened it in 14 days). Sam chose "own rank on load": the bootstrap carries the visitor's own rank profile and hub mastery, refreshed every 10 answers; the class-wide board, leaderboards and trophy rarity wait for Stats.
- 2026-11-06 (Claude Code): UAT in the preview found BUG-034 (cards with no choices, such as Perio's "Show answer" recall cards, sat on "Loading class data…" once class data waited for an answer); the class line now also loads when it comes into view. Before anything is answered, Perio's bank makes 0 class-data reads (main: 8).

## Outcome

(pending the release run)
