---
type: task
status: open
hub: widget
created: 2026-11-05
requested-by: Sam
due: 
waiting-on: 
agent: Codex (part 1); Claude Code (part 1: rebase onto main, the release suites, merge and migration); part 2 not taken
pr: https://github.com/smcmurry6-source/study-hubs/pull/266
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
- **Still ships when ready** (Sam, 2026-11-06, [decisions](../decisions.md)): the rest of the redesign waits for one
  release, but this phase's changes don't change what students see. Part 2's pieces that only serve the new engine
  (precaching it, the one font) come with [the release](2026-11-06-redesign-release.md).

- **Suited to a parallel agent (Codex 5.6 Terra, Sam, 2026-11-05)**: this phase does not depend on the design work. The
  numbers to beat and the RPC inventory are in the audit note (sections 1 and 3) and in the session's architecture
  report summarized there; every change is verifiable with the release suites on a throwaway database.

## Done when

Part 1 (the loading and the database) is [PR #266](https://github.com/smcmurry6-source/study-hubs/pull/266), live since 2026-11-06
with `migration_v53.sql` applied. Part 2 (the bundles, the stylesheet, the font, the client and sw.js precaching) is still to do.

- [x] Hub load: one bootstrap round trip (plus presence); dashboard the same (part 1)
- [x] `get_rank_profile` and friends under 50 ms: about 2 ms after `migration_v53.sql` (it was about 0.9 s); `get_trophy_stats` 5 ms. XP cache verified on live data: 157 of 157 visitors identical before, all 158 matching the per-day XP after
- [ ] The release suites pass; perf budgets lowered and met; sw.js version bumped (part 1: every suite passes and `sh-v58`; budgets are lowered with part 2)
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`) (part 1)
- [x] Preview link, phone and laptop screenshots, and Sam's look (part 1: approved in chat, "Go ahead"; the PR's box is Sam's to tick)
- [x] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome) (part 1; no About-page change, no new feature)
- [ ] Part 2: two widget bundles, one shared stylesheet, one self-hosted font, a thinner Supabase client, sw.js precaching the engine and fonts and caching content JSON stale-while-revalidate

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-05 (Codex): implementation started on `codex/redesign-phase-5-backend` from `origin/main`.
- 2026-11-05 (Codex): implemented the fixture-safe bootstrap, trigger-maintained `xp_visitors` cache and advisor cleanup in `migration_v53.sql`; refreshed the schema snapshot. Previewed the dashboard and a returning-learner hub through `node tools/preview/serve.js` using browser-held fixtures only; no class data or live migration was touched.
- 2026-11-05 (Codex): `node tools/ci/syntax.js` and `node tools/ci/vault.js` pass; the browser and database suites were blocked (no Playwright, axe-core or PostgreSQL on that machine). Draft PR #261.
- 2026-11-06 (Claude Code): #261 couldn't merge (it was branched before #253 added this note, so `DEPLOY_NOTES.md` and this note conflicted) and CI never ran. Rebased onto `main` as `claude/redesign-phase-5-backend`, conflicts resolved (both change-log entries kept; this note is #253's plan plus Codex's log). Ran every suite: `rls.js` caught BUG-032 (the cache dropped each day's first answer; fixed), `smoke.js` caught BUG-033 (Timmy past the screen's edge at the largest text, live already; fixed), `perf.js` counted the preview's own runtime against About's budget (now excluded).
- 2026-11-06 (Claude Code): the preview showed Codex's lazy ranks took away the badge by the name and every rank-up, level-up, trophy and mastery card until Stats was opened (17 of 108 people in a hub opened it in 14 days). Sam chose "own rank on load": the bootstrap carries the visitor's own rank profile and hub mastery, refreshed every 10 answers; the class-wide board, leaderboards and trophy rarity wait for Stats.
- 2026-11-06 (Claude Code): UAT in the preview found BUG-034 (cards with no choices, such as Perio's "Show answer" recall cards, sat on "Loading class data…" once class data waited for an answer); the class line now also loads when it comes into view. Before anything is answered, Perio's bank makes 0 class-data reads (main: 8).
- 2026-11-06 (Claude Code): the full `node tools/release/run.js` passed (13 of 13 suites), and so did CI ("Check hubs", "Release tests", preview). Sam: "Go ahead". Merged as 04c4b3a; `postcheck.js` passed (11 of 11 changed files live, the dashboard and 4 hubs with no errors). Sam: "apply it". `migration_v53.sql` applied through the connector at about 01:55 UTC, while students were answering. Afterward: all 158 cache rows match the per-day XP, the answer totals match, `get_rank_profile` takes about 2 ms, the bootstrap about 115 ms (hub) and 170 ms (dashboard), `rls-audit.sql` is clean and the advisors' `search_path`, primary-key and unused-index warnings are gone. Site changelog posted.

## Outcome

**Part 1 is live (2026-11-06, [PR #266](https://github.com/smcmurry6-source/study-hubs/pull/266), `migration_v53.sql`).** A hub or the dashboard reads everything it needs on load in one `get_widget_bootstrap` call. In the fixture preview that's 12 reads down to 1 on a hub and 19 down to 1 on the dashboard, besides presence and the changelog. Each visitor's own rank and hub mastery come with it (Sam's call), and the class-wide board, leaderboards and trophy rarity wait for Stats or the dashboard panel. XP is cached per visitor in `xp_visitors`, kept by the answer trigger, so a rank lookup takes about 2 ms instead of about 0.9 s. The advisor fixes are in. Three bugs were found and fixed on the way (BUG-032, BUG-033, BUG-034 in the [bug log](../release/bug-log.md)). Codex's #261 is superseded by #266.

**Still to do (part 2):** two widget bundles (core on load, the rest on idle or first use), one shared stylesheet, one self-hosted font, a thinner Supabase client with realtime presence kept, sw.js precaching the engine and fonts and caching content JSON stale-while-revalidate, then lower the `perf.js` budgets to the new sizes. The bootstrap is the slowest single request now: about 115 ms on a hub and 170 ms on the dashboard for the most active visitor. That's worth a look if part 2 measures load time.
