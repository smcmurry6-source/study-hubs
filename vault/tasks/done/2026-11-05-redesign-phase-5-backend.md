---
type: task
status: done
hub: widget
created: 2026-11-05
requested-by: Sam
due: 
waiting-on: 
agent: Codex (part 1); Claude Code (part 1: rebase onto main, the release suites, merge and migration); Claude Code (part 3); Claude Code (part 2)
pr: https://github.com/smcmurry6-source/study-hubs/pull/358
---

# Redesign phase 5: the backend and loading

## Goal

One `bootstrap` RPC per page load; rank, board and trophy RPCs only when a panel opens; `sh_visitor_xp` cached per visitor (kept by trigger) so rank calls stop recomputing the whole class; `get_pet_days` not polled; one analytics flush timer; the advisor fixes (search_path on 6 functions, a primary key on `link_attempts`, 2 unused indexes dropped); two widget bundles (core on load, the rest on idle or first use), one shared stylesheet, one self-hosted font, a thinner Supabase client with realtime presence kept, sw.js precaching the engine and fonts and caching content JSON stale-while-revalidate.

## Context

- The plan and Sam's decisions: [the redesign audit and plan](2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../../rules/preview-and-release-test.md) (every phase is tier 2 or 3:
  preview link first, screenshots, the release suites, Sam's look), [about-page](../../rules/about-page.md),
  [learner-data-privacy](../../rules/learner-data-privacy.md), the taste skill in full (Sam, 2026-11-04).
- The audit's backend numbers: the audit note, sections 1 and 3. Schema in `supabase/schema.sql`; a new `migration_v53.sql` (and up), applied through the connector, `supabase/schema.sql` refreshed ([repo map](../../reference/repo-map.md)).
- Tests: `node tools/release/rls.js`, `admin-ops.js`, `retention.js` on a throwaway copy; `tools/release/perf.js` budgets lowered to the new sizes.
- **Still ships when ready** (Sam, 2026-11-06, [decisions](../../decisions.md)): the rest of the redesign waits for one
  release, but this phase's changes don't change what students see. Part 2's pieces that only serve the new engine
  (precaching it, the one font) come with [the release](../2026-11-06-redesign-release.md).

- **Part 3, added 2026-11-06 (Sam): the server for the game-layer additions**, built and tested now on a throwaway copy and
  applied at [the release](../2026-11-06-redesign-release.md), because it changes how the class earns XP: no daily XP cap,
  `question_keys` and server-checked answers, the guardrails, every new XP source and boost, award rows, the 63-step ladder
  ([journeys](../2026-11-06-redesign-progression-journeys.md)); Shiny Gold Crowns, the shop catalog and rotation, `buy_item`, `equip_item`,
  inventory, HP from snacks ([shop](../2026-11-06-redesign-timmy-shop.md), [Timmy's place](../2026-11-06-redesign-timmys-place.md));
  the idea board's tables and functions ([idea board](../2026-11-06-idea-board.md)). The new functions sit beside today's, so the
  live hubs keep today's rules until the release switches them. **Still to add** (Sam, 2026-11-06, after part 3 merged):
  the Learn and Flashcards toggle's server, `learn` in `record_answer_v2`'s `ctx` list, the `card_reviews` log,
  `record_card_v2` and `get_my_cards` ([Learn and Flashcards](../2026-11-06-redesign-learn-and-flashcards.md)), in the pending
  migration with its checks.
- **Suited to a parallel agent (Codex 5.6 Terra, Sam, 2026-11-05)**: this phase does not depend on the design work. The
  numbers to beat and the RPC inventory are in the audit note (sections 1 and 3) and in the session's architecture
  report summarized there; every change is verifiable with the release suites on a throwaway database.

## Done when

Part 1 (the loading and the database) is [PR #266](https://github.com/smcmurry6-source/study-hubs/pull/266), live since 2026-11-06
with `migration_v53.sql` applied. Part 3 is [PR #290](https://github.com/smcmurry6-source/study-hubs/pull/290). Part 2 (the
bundles, the stylesheet, the font, the client, the budgets) is [PR #358](https://github.com/smcmurry6-source/study-hubs/pull/358);
what only the release can do (`sw.js`'s lists) is a box in [the release](../2026-11-06-redesign-release.md), "From phase 5, part 2".

- [x] Hub load: one bootstrap round trip (plus presence); dashboard the same (part 1)
- [x] `get_rank_profile` and friends under 50 ms: about 2 ms after `migration_v53.sql` (it was about 0.9 s); `get_trophy_stats` 5 ms. XP cache verified on live data: 157 of 157 visitors identical before, all 158 matching the per-day XP after
- [x] The release suites pass; perf budgets lowered and met; sw.js version bumped (part 1: every suite passes and `sh-v58`; part 2: the redesign's budgets set to the bundled sizes, on a meter that counts the whole load)
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`, `node tools/release/run.js`) (part 1)
- [x] Preview link, phone and laptop screenshots, and Sam's look (part 1: approved in chat, "Go ahead"; the PR's box is Sam's to tick)
- [x] Vault written back (hub notes, decisions, `DEPLOY_NOTES.md`, the About page, this note's Outcome) (part 1; no About-page change, no new feature)
- [x] Part 3: the server for the game-layer additions (above), each note's server items done, its migration ready to apply at the release (`migration_v54.sql`, tested on a throwaway copy; not applied: [the release](../2026-11-06-redesign-release.md) applies it)
- [x] Part 2: the widget bundles, one shared stylesheet, one self-hosted font, a thinner Supabase client (2026-11-13). `sw.js` precaching the bundles and fonts and caching content JSON stale-while-revalidate only serve the new engine, so they are boxes in [the release](../2026-11-06-redesign-release.md) ("From phase 5, part 2")

## Log

- 2026-11-05: written from the agreed plan.
- 2026-11-05 (Codex): implementation started on `codex/redesign-phase-5-backend` from `origin/main`.
- 2026-11-05 (Codex): implemented the fixture-safe bootstrap, trigger-maintained `xp_visitors` cache and advisor cleanup in `migration_v53.sql`; refreshed the schema snapshot. Previewed the dashboard and a returning-learner hub through `node tools/preview/serve.js` using browser-held fixtures only; no class data or live migration was touched.
- 2026-11-05 (Codex): `node tools/ci/syntax.js` and `node tools/ci/vault.js` pass; the browser and database suites were blocked (no Playwright, axe-core or PostgreSQL on that machine). Draft PR #261.
- 2026-11-06 (Claude Code): #261 couldn't merge (it was branched before #253 added this note, so `DEPLOY_NOTES.md` and this note conflicted) and CI never ran. Rebased onto `main` as `claude/redesign-phase-5-backend`, conflicts resolved (both change-log entries kept; this note is #253's plan plus Codex's log). Ran every suite: `rls.js` caught BUG-032 (the cache dropped each day's first answer; fixed), `smoke.js` caught BUG-033 (Timmy past the screen's edge at the largest text, live already; fixed), `perf.js` counted the preview's own runtime against About's budget (now excluded).
- 2026-11-06 (Claude Code): the preview showed Codex's lazy ranks took away the badge by the name and every rank-up, level-up, trophy and mastery card until Stats was opened (17 of 108 people in a hub opened it in 14 days). Sam chose "own rank on load": the bootstrap carries the visitor's own rank profile and hub mastery, refreshed every 10 answers; the class-wide board, leaderboards and trophy rarity wait for Stats.
- 2026-11-06 (Claude Code): UAT in the preview found BUG-034 (cards with no choices, such as Perio's "Show answer" recall cards, sat on "Loading class data…" once class data waited for an answer); the class line now also loads when it comes into view. Before anything is answered, Perio's bank makes 0 class-data reads (main: 8).
- 2026-11-06 (Claude Code): the full `node tools/release/run.js` passed (13 of 13 suites), and so did CI ("Check hubs", "Release tests", preview). Sam: "Go ahead". Merged as 04c4b3a; `postcheck.js` passed (11 of 11 changed files live, the dashboard and 4 hubs with no errors). Sam: "apply it". `migration_v53.sql` applied through the connector at about 01:55 UTC, while students were answering. Afterward: all 158 cache rows match the per-day XP, the answer totals match, `get_rank_profile` takes about 2 ms, the bootstrap about 115 ms (hub) and 170 ms (dashboard), `rls-audit.sql` is clean and the advisors' `search_path`, primary-key and unused-index warnings are gone. Site changelog posted.
- 2026-11-06 (Claude Code, part 3, [PR #290](https://github.com/smcmurry6-source/study-hubs/pull/290)): `migration_v54.sql`, the game layer's server, built and tested only on throwaway copies of
  `supabase/schema.sql`, never on the live project ([game-server](../../reference/game-server.md) says how it works). New:
  `supabase/pending-migrations.txt` (migrations written ahead of their release, applied by every database suite on top of the
  schema), `tools/release/xp.js` (243 checks: today's rules unchanged after the migration, server-graded answers, the
  guardrails, every source, a replayed call, a double tap, a linked device, the rebuild against the live calls, the shop, the
  idea board) and `tools/xp/keys.js` (a hub's keys from its content JSON; Occlusion's 773 load). `rls.js` now seeds the new
  tables and calls every function a visitor can run with one visitor's id, failing if another's comes back (checked by
  planting a leaky function: caught). Found BUG-049, live since v53: today's bootstrap sends Timmy's days as bare dates, so HP
  counts only this device's log; the fix is section 0 of the migration and can be applied alone on Sam's OK.
- 2026-11-06 (Claude Code, part 3): Sam: apply the BUG-049 fix now ("Yes"). Section 0 alone applied through the connector at
  about 20:25 UTC, after checking the live function matched `supabase/schema.sql` byte for byte; afterward the live definition
  matches the tested fix, the grants are unchanged, five active visitors' bootstraps send rows with each day's answers, and
  `rls-audit.sql` is clean. Appended to `supabase/schema.sql`; site changelog posted. Sam: "Merge" for PR #290.

- 2026-11-13 (Claude Code, part 2, [PR #358](https://github.com/smcmurry6-source/study-hubs/pull/358)): the bundles.
  How it works is in [bundles](../../reference/bundles.md); what the release does with it is in
  [the release note](../2026-11-06-redesign-release.md) ("From phase 5, part 2"). Nothing students see changes: the live
  pages load what they loaded, and the smoke test fails if one asks for a bundle. Neither pending migration was applied
  or changed. No hosted preview (Sam).
  - **Built**: `tools/bundle/` (`bundles.json`, `build.mjs`, the vendored parser, `client/`), four script bundles and
    one stylesheet in `widget/` (generated and committed; CI's `--check`), the slim client
    `widget/vendor/supabase-lite-2.117.2.js`, `assets/fonts/vt323.woff2`.
  - **The loading code, reorganized** (Sam: "reorganize it where that makes the bundles cleaner, rather than adding to
    what's there"): `widget/v3.js`'s thirteen hand-written `<script>` loaders are one function, `widgetFile()`, which
    runs a file from the page's bundle or adds its `<script>` (a live page always does the second; v3.js is 127 bytes
    smaller gzipped); `widget/hub.js`'s `startWidget()` adds two bundles where it added a stylesheet, the client and
    v3.js; `widget/dash.js`'s `loadLate()` loads one bundle where it loaded eight files.
  - **Three script files on a hub, not two.** The widgets a hub and the dashboard share are one file,
    `rest.bundle.js`, the same address on both, so going from the dashboard to a hub downloads Timmy, the ranks and
    the client once; a hub's own layer (`v3.js` and what it loads) is `hub-rest.bundle.js`. Folding the two into one
    per page would save a request and make every visitor download the shared 140 KB twice.
  - **Found on the way**: BUG-127 (`v3.css` in the shared stylesheet restyled the new dashboard's rank badge; it now
    rides in the hub's bundle), BUG-128 (the performance meter stopped 3 s after the load event and missed about a
    third of a new hub's load), BUG-129 (held files compiled on the main thread), in the [bug log](../../release/bug-log.md).
  - **The meter and the budgets**: `tools/release/perf.js` counts the whole load now. Measured that way on `main` and
    on this change (slow 4G, a mid-range phone): the new dashboard 416 KB and 22 requests to 332 KB and 9; the new
    Occlusion 882 KB and 29 to 780 KB and 11; the new Perio 898 KB and 28 to 807 KB and 11; the new Heme & Endo Exam 2
    830 KB and 29 to 728 KB and 11. First paint about 0.15 s sooner on a hub, about 0.5 s sooner on the dashboard.
    The budgets: requests 21-22 to 12 on a hub and 30 to 10 on the dashboard; the dashboard's bytes 420 to 345 KB and
    its paint limits 3.5 to 3.0 s; a hub's bytes are **set again on the whole load** (800, 750 and 830 KB), which is
    more than the old numbers (650, 680, 680) only because those were set on the part the old meter saw. The live
    pages' budgets are untouched.
  - **Left**: a new hub's blocking time is a little higher than `main`'s on some runs (230-365 ms on `main`, 310-540
    with the bundles, 350-385 in the final run; budget 500): the same scripts run in fewer, longer tasks. Not looked
    into further; a line in [the inbox](../inbox.md), for the release.
  - **Checks**: the smoke test on every hub, and `node tools/release/run.js`: every suite passes (accessibility run by
    itself, since axe-core had to be installed first). Before-and-after screenshots of the three new hubs and the new
    dashboard against `main`, phone and laptop, light and dark.

## Outcome

**Part 1 is live (2026-11-06, [PR #266](https://github.com/smcmurry6-source/study-hubs/pull/266), `migration_v53.sql`).** A hub or the dashboard reads everything it needs on load in one `get_widget_bootstrap` call. In the fixture preview that's 12 reads down to 1 on a hub and 19 down to 1 on the dashboard, besides presence and the changelog. Each visitor's own rank and hub mastery come with it (Sam's call), and the class-wide board, leaderboards and trophy rarity wait for Stats or the dashboard panel. XP is cached per visitor in `xp_visitors`, kept by the answer trigger, so a rank lookup takes about 2 ms instead of about 0.9 s. The advisor fixes are in. Three bugs were found and fixed on the way (BUG-032, BUG-033, BUG-034 in the [bug log](../../release/bug-log.md)). Codex's #261 is superseded by #266.

**Part 2 is built (2026-11-13, [PR #358](https://github.com/smcmurry6-source/study-hubs/pull/358)); it reaches students with the release.** A redesigned page loads the widget as built files instead of one request per source file
([bundles](../../reference/bundles.md)): the engine with the page, then one file of shared widgets (with a database client
less than half the size: 23 KB instead of 55) and, on a hub, one file of the hub's own layer; one stylesheet; no font
from another site (the 8-bit face is `assets/fonts/vt323.woff2`, and the new dashboard's saved recap image is set in
Nunito Sans). The new dashboard goes from 22 requests to 9 and from 416 KB to 332; a new hub from 28-29 requests to 11
and about 100 KB lighter. The budgets are lowered to match, on a meter that now counts the whole load. Left for the
release: `sw.js`'s lists and the content JSON's caching ([the release note](../2026-11-06-redesign-release.md), "From
phase 5, part 2"). Sam's open call: the recap image's typeface (the same section).

**Part 3 is written and tested, waiting for the release** (`migration_v54.sql`; [game-server](../../reference/game-server.md)). The
server for the journeys, Shiny Gold Crowns and Timmy's shop, Timmy's place and the idea board sits beside today's functions, so
the live hubs keep today's rules (and the 600-a-day cap) until the release switches the pages to the new calls. No XP back pay.
What the release does with it is in [the release note](../2026-11-06-redesign-release.md) ("From phase 5, part 3"). The judgment
calls made while building it, for Sam to confirm before the release, are listed in the reference note and the PR.

## Opening prompt (part 2)

Session 9 of [phase 4](../2026-11-05-redesign-phase-4-game-layer.md)'s "From here to the release": after every session
that adds a file, so the bundles are cut once (planned with Sam, 2026-11-12). Run it on Fable 5.2 at High effort
(Sam, 2026-11-12, [decisions](../../decisions.md)).

> Work in smcmurry6-source/study-hubs. Read `AGENTS.md`, then "From here to the release" in
> `vault/tasks/2026-11-05-redesign-phase-4-game-layer.md` and its Log's last entries (the files phase 4 added and
> when each loads), then do **part 2** of `vault/tasks/2026-11-05-redesign-phase-5-backend.md`: the two widget
> bundles, one shared stylesheet, one self-hosted font, the thinner Supabase client, and the budgets lowered to the
> new sizes. The loading code is yours to restructure: reorganize it where that makes the bundles cleaner, rather
> than adding to what's there. The live pages must keep working exactly as today until the release. Neither pending migration is
> applied or changed. Grep the big files, never read them whole. No subagents. No hosted preview. Open a draft PR
> with the test report; I'll say "merge".
