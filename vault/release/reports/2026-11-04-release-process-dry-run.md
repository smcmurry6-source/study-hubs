---
type: test-report
tags: [testing, release]
---

# Release test: the release process itself (dry run, 2026-11-04)

The first run of [RELEASE_TEST_PLAN.md](../../../RELEASE_TEST_PLAN.md), on the branch that builds it: every tool exercised
end to end, against the site as it is on `main` today (no site change in this PR). Run in a Claude Code cloud session
(Linux, Node 22, Playwright 1.56 with Chromium, PostgreSQL 16, axe-core 4.14). Nothing was deployed, and no production
data was written: the live database was only read, through its system catalogs (schema metadata, no student rows).

- **Change:** the preview and release-test process ([rule](../../rules/preview-and-release-test.md)); no student-visible change.
- **Tier:** 2 (CI, tooling and process for every agent). Sam's approval is the PR's checkbox.
- **Preview:** `node tools/preview/serve.js` on the branch; static build `node tools/preview/build.js` (101 files, 23 MB,
  narration streamed from the live site). Data: fixtures. Every run ended with no request reaching production.

## Automated

`node tools/release/run.js` at 20:03 UTC on `7235f92` plus this branch's changes (about 10 minutes):

| Suite | Result | Time | What it exercised |
|---|---|---|---|
| Syntax (`tools/ci/syntax.js`) | pass | 2 s | 11 pages, the widget scripts, and the new preview and release tools parse |
| Vault (`tools/ci/vault.js`) | fail, then pass | 0 s | Failed in the run because this report didn't exist yet (its link from home); after writing it: 60 notes, links resolve |
| Public-repo check (`tools/release/secrets.js`) | pass | 0 s | 552 files, 353 scanned: no keys, tokens, course material or data files. A planted fake service-role key and a planted `.pdf` were both caught, then removed |
| Smoke and question lint (`tools/ci/smoke.js`) | pass | 185 s | Every hub, every mode, desktop and phone; question rules |
| Preview safety (`tools/ci/preview.js`) | pass | 44 s | A static build (101 files) checked file by file; the dashboard as all six accounts, About, the admin page and all 8 hubs, desktop and phone; answers on the 4 live hubs reached the fixtures (`record_answer`, `record_personal_answer`, `record_choice`); a report and a name change saved; the admin page opened with the preview secret and refused a wrong one; production attempted by fetch, XHR, beacon, WebSocket, image and a guard-free fetch: all refused, **no request left the browser for Supabase** |
| Database permissions (`tools/release/rls.js`) | pass | 2 s | `supabase/schema.sql` in a fresh PostgreSQL 16 with Supabase's roles and default grants (38 tables, 98 functions); RLS on every table; anon's direct access exactly as expected; seeded student rows unreadable; direct writes refused; every definer function pins `search_path`; 24 secret-gated functions refused no secret and a wrong one, writing nothing (48 checks), and accepted the right one; per-visitor reads stay per visitor |
| Accessibility (`tools/release/a11y.js`) | pass | 39 s | 24 screens (every mode of the 4 live hubs, dashboard, About, admin sign-in, 5 in dark mode): 157 known axe nodes, held by the new baseline; 18 keyboard stops without visible focus (About); no keyboard trap; no endless animation with reduced motion |
| Performance (`tools/release/perf.js`) | pass | 77 s | Slow-4G phone, CPU 4x: dashboard 234 KB, FCP 0.5 s; hubs 0.7-1.1 MB, FCP about 1.0 s, LCP up to 2.8 s (Perio), blocking time 0.2-0.55 s; within the new budgets |
| Devices and resilience (`tools/release/matrix.js`) | pass | 273 s | 7 device sizes × 17 screens in Chromium, no errors or sideways scroll (5 small tap targets: BUG-009); refresh, history, offline and recovery, class data slow and unreachable, on a phone and a laptop; slow 3G usable in 8.6-14.8 s (BUG-008) |

Not run here: WebKit and Firefox (not installed in this session; CI's Release tests installs them).

## Exercised by hand (scripted browser, screenshots looked at)

- The Preview panel on a laptop (light) and a 390 px phone (dark): frame, button above the phone's bottom bar, account
  picker, time travel, class-data switch, the write log, keyboard (Tab, Escape returns focus to the button).
- Test accounts: **missed** on Occlusion (synced 313 questions, 29% right, Daily Drill full); **high-xp** on the
  dashboard (Dark Matter I, 61,000 XP, #1 of 64, mastery badges); **returning**, **archived**, **admin** and **new** through
  `tools/ci/preview.js` (every page as each account).
- Time travel through the panel to Thu Nov 19, 11 pm: Occlusion and Special Patient Care turned into archived cards with
  check-in buttons; "Back to now" restored them.
- Admin page as **admin**: unlocked with `preview-admin`; a wrong secret refused.
- A found bug fixed on the way: the missed-question account showed 1,858 XP instead of 900, because generated history
  counted as new answers (fixed in `preview.js` before this run).

## The live database, read-only

`tools/release/rls-audit.sql` through the Supabase connector's `execute_sql` (catalog queries only): **no findings**; anon's
direct access is exactly `rls-expectations.json` (SELECT on changelog, mode_stats, presence_hourly, question_choices,
question_stats; INSERT on hub_suggestions, question_flags); 38 tables and 98 functions, the same as the snapshot `rls.js`
tests. Functions anon can run that the site doesn't call are pure helpers or secret-gated; nothing to report privately.

## After a release (exercised on the last real one)

`node tools/release/postcheck.js` on PR #228's merge (`a1dcac5` → `7235f92`): both changed files live and identical to
`main`; the live dashboard and Occlusion loaded with 0 errors; 26 Supabase requests blocked in the browser, none sent.
`tools/release/monitor.sql` parsed and ran on the throwaway database (not run live: no release to watch).

## Bugs

Logged in the [bug log](../bug-log.md): BUG-001 (S2, fixed and retested here: `supabase/schema.sql` couldn't rebuild the
database), BUG-002 to BUG-007 (S3, known accessibility issues, now held at their counts by the baseline), BUG-008 (S3,
slow 3G: taps dead for about 15 s on Occlusion), BUG-009 (S4, small tap targets). No S1.

## Not covered, or blocked

- **A hosted preview link per PR:** not wanted for now (Sam, 2026-11-04): Sam looks at the agent's screenshots and its
  cloud session's live preview ([task, dropped](../../tasks/done/2026-11-04-preview-hosting-and-staging.md)).
- **Staging database:** not set up (same call). Server-side logic (XP, streaks, boards) is approximated in fixtures;
  permissions are covered by `rls.js`.
- **WebKit and Firefox:** not installed in this session; the "Release tests" workflow installs them, so its first run is
  their first run. Real Safari on an iPhone isn't covered by an agent.
- **The workflows themselves** ("Check hubs" with the new steps, "Release tests") run for the first time on this PR.
  Performance timings were calibrated here and may need `perf.js --update` from CI's numbers if CI machines are slower.
- **Realtime** (who's online, nukes, bosses) isn't simulated in previews.
- **Sam's look:** Sam doesn't run the UAT (2026-11-04); Sam looks at this PR's preview before approving.
