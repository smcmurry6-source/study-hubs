---
type: test-report
tags: [testing, release, questions]
---

# Release test: question health for every hub (2026-11-04)

- **Change:** under every explanation students get a "Good question?" thumbs up / down (with a reason on a thumbs down);
  behind the scenes each answer records which try it was, the time on the question and on the explanation, and cards
  read but left unanswered. Sam gets a **Question health** tab on the admin page that lists likely problem questions per
  hub, with Looks fine / Needs a fix / Fixed. Question ids are registered and checked by CI. Nothing changes a question
  automatically. How it works: [question-health](../../reference/question-health.md).
- **Tier:** 3: a Supabase migration (`migration_v51.sql`), plus the shared widget, the admin page's script and `sw.js`.
- **Preview:** `node tools/preview/serve.js` on `claude/determined-hamilton-po4rc8` (commit `b3fd847` and after), shown to
  Sam in the cloud session's preview panel; the PR's Cloudflare link once "Release tests" has run. Screenshots (phone
  390 px and laptop 1280 px, light and dark) of the student row and the admin tab were sent to Sam in chat.
- **Data:** fixtures. The preview runtime now answers `get_question_health` with made-up flags on each hub's real ids and
  keeps `admin_review_question` calls in the fixtures (`tools/preview/runtime/preview.js`). Every preview run ended with
  the Preview button at 0 requests to production.

## Automated

`node tools/release/run.js` at 22:01 UTC on `b3fd847` (axe-core 4.x from a scratch folder, PostgreSQL 16):

| Suite | Result | Time | Summary |
|---|---|---|---|
| Syntax (`tools/ci/syntax.js`) | pass | 2 s | 11 pages and the widget scripts parse (`widget/qhealth.js` added to the list) |
| Vault (`tools/ci/vault.js`) | pass | 0 s | 64 notes, links resolve, the two new rules listed and imported |
| Public-repo check (`tools/release/secrets.js`) | pass | 1 s | 568 tracked files, 369 scanned; no secrets, course material or data files |
| Smoke and question lint (`tools/ci/smoke.js`) | pass | 182 s | Every hub on desktop and phone; with `CI=true` the id registry matches all 8 hubs |
| Preview safety (`tools/ci/preview.js`) | pass | 46 s | No request left the browser for Supabase |
| Database permissions (`tools/release/rls.js`) | pass | 3 s | 42 tables (the 4 new ones RLS on, no anon policies), 26 secret-gated functions (the 2 new admin ones included) refused no secret and a wrong one; 7 revoked functions (`qh_int`, `qh_flags`, `qh_report` included) stay shut |
| Accessibility (`tools/release/a11y.js`) | pass | 41 s | Within the baseline |
| Performance (`tools/release/perf.js`) | pass | 79 s | Within the budgets (qhealth.js loads async after v3.js) |
| Devices and resilience (`tools/release/matrix.js`) | pass | 280 s | 7 device sizes, refresh, history, offline, slow and unreachable |

Re-run at 01:14 UTC on 2026-11-05 on `f879b56`, after rebasing onto `main` with the analytics governance change (which
took the number v49, so this migration became `migration_v50.sql`, and `migration_v51.sql` once the admin page change took v50): every suite passed again (smoke 185 s, matrix 217 s).

GitHub's first "Release tests" run on the PR (01:30 UTC, WebKit and Firefox too) failed in two suites, neither from this
change: it tested the PR merged into `main` from before PR 235, which fixed the mode rows and the dashboard bar (the
sideways scroll at 320 px and on an iPad in landscape), and the two problems still on `main` (Perio's arcade 6 px wider than
a phone; Perio Review's sideways-scrolling tables with no keyboard stop) had a fix in PR 239. That fix was carried here line
for line, and the re-run on `57ea160` (rebased onto PRs 235 and 238) passed every suite in Chromium, WebKit and Firefox
("check", "release" and "preview" green, 02:11 UTC). PR 239 then merged with the same lines, so after the last rebase this
PR no longer changes `hubs/perio/index.html`. The rebase onto 238 also registered Perio's 15 new Patient Box case ids.

Then PR 236 redesigned the admin page (a sidebar of views) and took `migration_v50.sql`. This migration became
`migration_v51.sql` (the live database is unchanged: it was applied under its own names), `sw.js` went to `sh-v55`, and
Question health was rebuilt as a view in the new sidebar (*Study data*, after Questions) on the redesign's own parts: its
cards, figures, chips with each hub's dot, buttons, the view's title row ("n questions to review in Perio") and the
sidebar count. The list, the flags, the calls and Copy list work as before. `tools/release/admin-ui.js` now opens it with
the other views and checks it on a 390 px phone.

Also: the id-registry check by itself (a registered id gone, a retired id back, a new id in CI and locally: each gives
the right failure or note); `tools/release/rls-audit.sql` on the live project after the migration: no findings, anon's
direct table access exactly `rls-expectations.json`.

## Manual (UAT)

Scripted browser against the preview, screenshots looked at. Checklist sections: core pass, the shared widget, saving,
admin page, a Supabase migration.

| Device | Browser | Accounts | Result |
|---|---|---|---|
| Laptop 1280×860, light and dark | Chromium | returning, admin | Answered a question, read the explanation, thumbs down + "Not in the notes": the write log shows `qh_vote` (twice: the thumb, then the reason) and `record_qh` (the answer: try 1, choice, time before and on the explanation; and the card read 9 s and left, as a view). "Something else: report it" opens the Report form on that question with the cursor in it. Admin: Question health lists 8 fixture flags and one id not in the hub, sorted by severity; Looks fine with a note moves it to Reviewed, and it stays there after switching hubs |
| Phone 390×844, light and dark | Chromium, emulated | returning, admin | Same; no sideways scroll on the hub or the admin page; the reason chips wrap |
| Laptop, reduced motion, class data Unreachable | Chromium | returning (Perio) | No errors; the row still works and keeps the vote on the device; keyboard only: Tab reaches the thumbs and each reason, Enter and Space work, focus is visible; after a reload the vote is still marked |

Before the preview existed on `main`, the tracker was also checked on four hub engines (Occlusion, Perio, Special
Patient Care, PCD Implants) with Supabase stubbed: tries counted from the synced history, mock answers carry no timing,
and the row shows on mock results.

## Bugs

- BUG-020 (S3; logged as BUG-010 before the rebases, ids that PRs 235, 239 and 236 took on `main`): switching hubs on the Question health tab while one was loading left it on "Reading…". Fixed in this PR
  and retested (laptop and phone, light and dark).

## Not covered

- Real Safari and Firefox: not installed in this session (CI's "Release tests" runs WebKit and Firefox).
- Staging: none exists (Sam, 2026-11-04). The migration was applied to the live project on 2026-11-04, before the
  release process reached `main`; it only adds tables and functions that nothing calls until this PR ships (rollback
  below). The live database was then read (catalogs, `qh_report` on real data for calibration); a test write to a
  throwaway hub id (`zz-qh-test`) was made and deleted the same hour. The admin page was also loaded once, outside any
  preview, against the live `get_question_health` with the admin secret from the session's environment, with every
  save intercepted (nothing written).
- "Link my devices" doesn't move question-health rows, so a second device's first try counts as a first try.

## Rollback

1. Revert the PR (GitHub's Revert button). That removes the tracker, the thumbs, the admin tab and the CI check; bump
   `VERSION` in `sw.js` in the revert, since `widget/qhealth.js` is precached.
2. The database part can stay: with the client gone nothing calls `record_qh` or `qh_vote`, and the admin functions
   need the secret. Dropping the four tables would delete what students recorded, so only with Sam's OK, as a new
   migration (the next free number): drop `admin_review_question`, `get_question_health`, `qh_report`, `qh_flags`, `qh_vote`,
   `record_qh`, `qh_int`, then `question_reviews`, `question_feedback`, `question_events`, `question_versions`.

## Release

- [ ] Sam approved this release: in chat, 2026-11-05, "Merge when ready" (recorded in [decisions](../../decisions.md)).
- [ ] Merged; `node tools/release/postcheck.js` passed:
- [ ] `DEPLOY_NOTES.md` and the site changelog updated.

Related: [question-health](../../reference/question-health.md) · [bug log](../bug-log.md) ·
[RELEASE_TEST_PLAN.md](../../../RELEASE_TEST_PLAN.md)
