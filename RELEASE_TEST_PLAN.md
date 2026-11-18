# Release test plan

How every change to the study hubs is checked and approved (and previewed, when Sam asks) before it reaches the class,
and how it is checked and, if needed, rolled back after. It is a standing rule
([vault/rules/preview-and-release-test.md](vault/rules/preview-and-release-test.md), Sam, 2026-11-04, last changed
2026-11-18) for every agent and session. Merging to `main` is the release: GitHub Pages publishes it to the class within
a minute or two.

Contents: [1. One process](#1-one-process) · [2. The flow](#2-the-flow) · [3. Previews](#3-interactive-previews) ·
[4. Data isolation](#4-data-isolation) · [5. Test accounts](#5-test-accounts) · [6. Automated gates](#6-automated-gates) ·
[7. Manual UAT](#7-manual-uat) · [8. Browsers and devices](#8-browsers-and-devices) · [9. Bug log](#9-bug-log) ·
[10. Approval](#10-approval) · [11. Release and verification](#11-release-and-post-release-verification) ·
[12. Rollback](#12-rollback) · [13. Hosting and staging](#13-hosting-and-staging)

## 1. One process

**There are no tiers** (Sam, 2026-11-18: "i want to take out all the tier change rules for merging. it takes too long. it
didnt use to take so long"). A typo, a question, a feature, a new hub and a migration all ship the same way, the way
they did before this plan: the checks for what you touched, a PR, CI, Sam's "merge". Before 2026-11-18, a "substantial"
change (tier 2) also needed the release suites run locally, a test report, bug-log rows and an offer of a preview. A
"high risk" one (tier 3) also needed a live permissions audit, a written rollback and a post-release check within the
hour. All of that is gone. What still runs is automatic: CI on the PR, the After merge workflow after it.
[ship-it-now](vault/rules/ship-it-now.md) holds: an exam is never a reason to wait.

## 2. The flow

1. Branch from a fresh `origin/main`; make the change ([ship-a-change](vault/how-to/ship-a-change.md)).
2. Run the checks for what you touched ([verify-before-pushing](vault/how-to/verify-before-pushing.md)): the fast checks
   and the smoke test, plus `node tools/release/xp.js` and `rls.js` when SQL changed. The other release suites are CI's
   job. Run one locally only to reproduce a failure.
3. Push and open a draft PR: what changed in plain words, what you ran, anything you're unsure of. The
   **automated gates** run on it ([section 6](#6-automated-gates)).
4. **Show Sam** what students will see when it looks different: a screenshot or two, taken with the class's data
   stubbed ([section 10](#10-approval)).
5. **Sam says "merge"** and the agent merges, or Sam merges.
6. **After the merge:** the After merge workflow does the post-release check and the changelogs
   ([section 11](#11-release-and-post-release-verification)); roll back if needed ([section 12](#12-rollback)).

A **preview** is made only when Sam asks for one (Sam, 2026-11-06). The agent doesn't offer one. With a preview, the
agent does the UAT in it ([section 7](#7-manual-uat)) and can write a test report
([template](vault/templates/release-test-report.md)). A bug found and not fixed goes in the
**[bug log](vault/release/bug-log.md)** ([section 9](#9-bug-log)).

## 3. Interactive previews

A preview is the whole site (dashboard, About, admin page, every hub) from a branch, running in a real browser with
made-up data. Testers click, answer, pin, report, switch accounts and travel in time: a preview is something to use,
not a screenshot. The tools are `tools/preview/`:

- `node tools/preview/serve.js`: this checkout at `http://127.0.0.1:4173/`, transformed on the fly (`--host 0.0.0.0` to
  reach it from a phone on the same Wi-Fi, `--latency 400` for a slow server, `--dir <folder>` to serve a built preview).
- `node tools/preview/build.js --out _preview`: a static copy for a preview host or a download (about 23 MB; narration
  is streamed from the live site's public mp3s unless the branch changed it; `--audio all` copies everything, about
  700 MB). `--check <folder>` verifies a build.
- In CI, **on request only** (Sam, 2026-11-06): the **Preview** workflow (`.github/workflows/preview.yml`) runs for a
  PR with the `preview` label (and on each push to it after that), or by hand on a branch (Actions, Preview, Run
  workflow). It attaches the `preview-site` artifact (kept 14 days): download, unzip,
  `node tools/preview/serve.js --dir preview-site`. "Release tests" no longer builds a preview.
- **A link per PR on Cloudflare Pages** (Sam's choice, 2026-11-04): the same workflow builds the
  preview without Timmy Time episodes (`--no-podcast`: they're over Cloudflare's 25 MB a file and play the live site's
  copy, so a new or changed episode doesn't play there), deploys it to `https://pr-<n>.<project>.pages.dev` and puts
  that link on the PR in one comment it keeps up to date. It needs the repo secret `CLOUDFLARE_API_TOKEN` (a token with
  only "Cloudflare Pages: Edit", never the Global API Key) and the repo variable `CLOUDFLARE_ACCOUNT_ID`; without them
  it says so on the run's page.
- In a Claude Code cloud session, the agent runs `serve.js` in the background and calls `report_preview_port`, so Sam
  can open the preview from the Claude app where it shows a preview panel, while the session is up. It has no address
  outside the session; the PR's link is what Sam opens ([section 10](#10-approval)).

**Where previews may be hosted.** Never on the live site's origin (`smcmurry6-source.github.io`), which rules out a
second GitHub Pages repo too: pages on one origin share localStorage and the service worker's scope, so a preview there
would read and overwrite real progress and could be served from the live site's cache. A hosted preview gets its own
domain, and access control when classmates aren't meant to find it. The options are in [section 13](#13-hosting-and-staging); Sam
chose Cloudflare Pages.

**Noindex.** Every preview page carries `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet,
noimageindex">`, every response from `serve.js` an `X-Robots-Tag` header with the same, a build adds `_headers` (Cloudflare
Pages, Netlify) and a `robots.txt` that disallows everything, and every title starts "Preview ·". CI fails a build
missing any of it (`tools/ci/preview.js`).

**What testers see.** A dashed orange frame around the page and a **Preview** button (bottom left) that opens the
controls: the build and branch, whether anything tried to reach production (it turns red if so: report that as a bug),
the test account, **Pretend it's** (time travel to any date and time: exam day, the night it archives, after
Thanksgiving), **Class data** (normal, slow, unreachable) and **What this site tried to save** (the write log, to copy
into a bug report). It works by keyboard and touch, in dark mode and at 390 px.

## 4. Data isolation

**No preview, test or automated run writes to the class's data, and none of them shows up in Sam's analytics.**

A preview runs on **fixtures** by default: synthetic data answered inside the browser. Four independent layers keep it
off production; any one of them is enough:

1. `tools/preview/transform.js` rewrites every production Supabase URL and key in the served pages to
   `fixtures.preview.invalid` (the `.invalid` domain never resolves) or to a staging project.
2. A Content-Security-Policy (`connect-src`, `img-src`, `media-src`) that leaves the production host out, so the browser
   refuses any request to it however its URL was built.
3. The preview runtime (`tools/preview/runtime/preview.js`, loaded first) answers the fixture host the way PostgREST
   would, blocks and counts anything aimed at any `supabase.co` project but staging, and logs every write.
4. Previews live on their own origin ([section 3](#3-interactive-previews)).

CI proves it on every PR: it opens every page as every test account, answers questions, files a report, changes a name,
then tries to reach production on purpose five ways (fetch, XHR, beacon, WebSocket, image, plus a fetch from a clean
frame that skips the runtime) and fails if a single request leaves the browser for Supabase.

| Area | In a preview |
|---|---|
| Answers, sync, spaced review, pins | Saved to the fixtures; each account's history is generated from the hub's own question ids, the same every time |
| XP, ranks, trophies, mastery | Each account's starting XP plus a little for every answer given in the preview; the boards are made-up names |
| Profiles: names, device linking | Saved to the fixtures; linking codes are fake and never match |
| Reports, suggestions, comments, likes, surveys | Saved to the fixtures, and visible on the admin page |
| Admin page (`review/`) | Opens with the preview's own secret, `preview-admin`, on fixture reports, surveys and comments. **Never type the real admin secret into a preview.** |
| Analytics (pings, clicks, events, searches) | Go to the fixtures' write log only. Since nothing reaches production, the preview turns off the widget's "skip automated browsers" rule so tests exercise every write path. |
| Class numbers (% right, picks per choice, who's online) | Made up per question. Realtime (who's online, nukes, bosses) isn't simulated: it shows 1 online. |
| AI calls | None today. A future feature that calls an AI service must do it through a URL the preview can rewrite, with a fixture answer added to `preview.js` in the same PR, and its key never in the page. |
| Purchases | None today. If one is ever added, previews and staging use the payment provider's test mode only. |
| Live site checks after a release | `tools/release/postcheck.js` blocks every Supabase request in the browser, so it reads pages and writes nothing. |

**Staging** (`serve.js --data staging` with `SH_STAGING_URL` and `SH_STAGING_KEY`, a staging project's URL and publishable
key) is for what fixtures can't show: a migration, server-side logic (XP, streaks, leaderboards), RLS against real
requests. It needs a separate Supabase project with its own admin secret, never production's. It isn't set up
(Sam, 2026-11-04: not for now; [section 13](#13-hosting-and-staging)); `tools/release/rls.js` covers permissions.

Never copy production rows into fixtures, staging or a test report: the repo is public, and the fixtures are made up
on purpose.

## 5. Test accounts

Six synthetic accounts (`tools/preview/fixtures/personas.json`; ids, names and numbers all made up). Open one from the
Preview button, or with `?persona=<id>` on any page (it starts that account fresh). `?now=2026-11-19T21:00` sets the
clock; `?now=real` resets it.

| id | Account | Use it for |
|---|---|---|
| `new` | New learner | First visit: tour, empty states, picking a name, nothing synced |
| `returning` | Returning learner (the default) | A week of studying: progress, pins, an Inbox reply, a survey |
| `high-xp` | High-XP learner | Top of the boards, Dark Matter rank, badges, rank-up and trophy cards |
| `missed` | Missed-question learner | Weak spots, Daily Drill, Questions I missed, "Find this in the notes" |
| `archived` | Archived-hub learner | Hubs whose exams are over: the archived notice and card, check-ins (pair with time travel) |
| `admin` | Admin | The admin page: Inbox, replies, notices, surveys, hiding comments, recaps |

## 6. Automated gates

| Gate | Command | Runs | What fails it |
|---|---|---|---|
| Syntax and merge markers | `node tools/ci/syntax.js` | every PR | A script that doesn't parse; a conflict marker |
| Vault | `node tools/ci/vault.js` | every PR | A broken link, a rule not listed, a task out of order |
| Public-repo check | `node tools/release/secrets.js` | every PR | Anything that looks like a key or token; course material or data files; media outside the narration folders |
| Database permissions | `node tools/release/rls.js` | every PR | A table without RLS; anon access beyond `rls-expectations.json`; student data readable; a definer function without `search_path`; a secret-gated function that answers no or a wrong secret, or writes; per-visitor reads that leak; any function a visitor can run handing back another visitor's id (with `supabase/pending-migrations.txt` applied) |
| Database functions on fixtures | `node tools/release/admin-ops.js`, `retention.js`, `xp.js` | every PR | The admin page's functions; the retention job's deletes; the game layer's server ([game-server](vault/reference/game-server.md)): today's XP unchanged after the migration, server-graded answers, the guardrails, every XP source, a replayed call, a double tap, a linked device, the rebuild against the live calls, the shop, the idea board |
| Smoke and question lint | `node tools/ci/smoke.js` | every PR | A JavaScript error or sideways scroll on any screen of the hubs a PR touches (every hub when a shared file changes); the question rules (formats, whys, likely topics, answer length) |
| Preview safety | `node tools/ci/preview.js` | every PR | Any request reaching Supabase; a page without noindex or the runtime; a write path not reaching the fixtures; the admin page answering a wrong secret |
| Accessibility | `node tools/release/a11y.js` | Release tests | A new or worse axe (WCAG 2.2 AA) issue than `tools/release/baselines/a11y.json`; focus you can't see; a keyboard trap; endless animation with reduced motion on |
| Performance | `node tools/release/perf.js` | Release tests | Bytes or requests over `tools/release/budgets.json` on a slow-4G phone; FCP, LCP or blocking time past 1.5x budget |
| Devices and resilience | `node tools/release/matrix.js` | Release tests | An error or sideways scroll on 7 device sizes in Chromium, WebKit and Firefox; state lost on refresh; Back/Forward broken; no offline copy; a hub that breaks when class data is slow or down; slower than 45 s to usable on slow 3G |
| All of the above | `node tools/release/run.js` | by hand, Release tests | Writes one summary to paste into the test report |
| After the merge | `node tools/release/postcheck.js` | after each release | The live files differ from `main`; a live page throws |

"Check hubs" (the first seven) runs on every PR. "Release tests" (trimmed on Sam's call, 2026-11-06) runs on a PR only when it
changes shared code (the dashboard, About, the admin page, `widget/`, assets, the service worker, the database, the
preview runtime, the suites or its own workflow) or has the **`full-tests` label**, and then skips the suites Check hubs
already ran on that commit; question and notes changes skip it. The `full-tests` label is there for
when Sam, or an agent chasing a bug, wants them on a PR that stays inside hubs; no change needs it. Run by hand (Actions, Release
tests, Run workflow), it runs every suite. **Since 2026-11-13 both run in parallel jobs** (Sam: "do 1 and 2 in their own
PR"): Check hubs as the fast checks with the database suites, the smoke test's desktop half and its phone half
(`SMOKE_PART`); Release tests as one job per suite and one per browser for the device matrix. Each workflow's result is
its last job (`check`, `release`), which passes only when every part did, except **"devices in WebKit", which doesn't
block a merge** (Sam, 2026-11-18): it runs and shows on the PR, `release` doesn't wait for it, and a failure there goes
in the bug log and a follow-up. The Firefox and WebKit jobs run in Playwright's own image
(`mcr.microsoft.com/playwright:v1.63.0-noble`), which has the browsers and their system packages; installing those
from Ubuntu's mirror took up to 22 minutes a job. On a PR, both keep an earlier green result
when only notes (`.md` files, `.obsidian/`) changed since the run that tested the code, as when a merge of `main`
brought only notes: the long jobs are skipped and the run's summary names the run it kept (`tools/ci/reuse.js`; the
fast checks always run). An old run steps aside when a newer push has come in. Regression coverage is the smoke test (every hub a change can reach, every mode, two sizes; `--all` or `SMOKE_ALL=1` for every hub),
the question lint, the baselines (accessibility, performance) and the preview's write-path checks; a bug that slipped
through gets a check added in the PR that fixes it, where a script can see it.

Baselines only move down. Raise one (a new page's numbers, an approved heavier feature) only with `--update` in the PR
that needs it, saying why; never to make a check pass.

## 7. Manual UAT

Only when Sam asked for a preview: the agent does the UAT itself. It uses the change in the preview with a scripted browser (Playwright) on an emulated
phone, tablet and laptop, as the test accounts the change affects, with [the UAT checklist](vault/release/uat-checklist.md):
a core pass plus a section per kind of change (questions and notes, a new hub or lecture,
the widget, saving and sync, ranks and trophies, admin, a migration, the service worker, a redesign). It looks at its
own screenshots and writes what it saw in the test report. **Sam doesn't test** (Sam, 2026-11-04): Sam looks at the
change and decides whether to ship it ([section 10](#10-approval)). Classmates can be UAT testers only on a preview that runs on fixtures and that Sam chose to
share.

## 8. Browsers and devices

| | Automated (`matrix.js`) | On real devices, when one is at hand |
|---|---|---|
| Phones | iPhone SE, iPhone 13, Pixel 7 sizes, touch | A real iPhone in Safari (most of the class) and an Android phone in Chrome; once a term, the home-screen app |
| Tablets | iPad Mini, portrait and landscape | An iPad in Safari for anything with a layout change |
| Computers | 1280x800, 1920x1080 | Chrome, Safari and Edge on a laptop |
| Engines | Chromium; WebKit and Firefox in CI | Real Safari (WebKit on Linux is close, not the same) |
| Slow network | Slow 4G phone budgets; slow 3G usable in 45 s | DevTools throttling, or `serve.js --latency 400` |
| Offline and cache | Opens offline after one visit; recovers online | Airplane mode after a visit; then back online and reload |
| Refresh | Mode and answers survive a reload | Reload mid-question, mid-mock, mid-game |
| History | Dashboard, hub, Back, Forward, the back button | Back and Forward through modes, the drill and the mock |
| Class data down | Every hub and mode works with class data slow or unreachable | Class data: Unreachable in the Preview panel |

## 9. Bug log

[vault/release/bug-log.md](vault/release/bug-log.md): one row per problem found in a preview, a test run or after a
release, with its severity, owner, fix (PR) and retest status. Severity:

- **S1, blocker:** wrong answers taught or keyed; lost or corrupted student data; anything reaching production from a
  preview; the site or a live hub down or unusable; a security hole. Fix before release; a live S1 means roll back.
- **S2, major:** a feature broken for many students or a whole device type; an accessibility failure that blocks a task.
  Fix before release, unless Sam accepts it in writing.
- **S3, minor:** wrong in a corner, with a workaround; a contrast or labeling issue; a slow screen. Fix soon; may ship.
- **S4, cosmetic.**

**Security problems are never written in the public repo** (log, PR, issue, commit) until they're fixed: tell Sam in chat.

## 10. Approval

Sam is the product owner: nothing reaches the class without Sam's "merge". Sam's part is a look, not a test pass (Sam,
2026-11-04). When a change looks different to students, the agent **shows Sam the change**
([preview-a-change](vault/how-to/preview-a-change.md)):

- a screenshot or two of what changed, on a phone and, when the layout changed, a laptop, sent in the chat. They're taken
  in a scripted browser with the class's data stubbed, as `tools/ci/smoke.js` does. Dark mode too when colors changed;
- a short recording only when a still can't show it (an animation);
- when Sam asked for a preview, **the preview link on its own line, first**: `Preview: https://pr-<n>.<project>.pages.dev`
  from the PR's preview comment ([section 3](#3-interactive-previews)), then the page and test account to open.

A change nobody sees (notes, tools, the server) needs no screenshots. Sam says "merge", or what to change. A change gets
a new screenshot. **Sam's "merge" is the approval**, for every change (Sam, 2026-11-12: "Remove the sam approval tick
stuff entirely. If i say merge, merge. We are adding too many steps"). There is no checkbox and no separate "I approve".
The agent merges the PR (a draft is marked ready first), waiting only for "Check hubs" and "Release tests" when they're
still running (not "devices in WebKit") and fixing a failing one first; or Sam merges it. Without Sam's "merge" an agent doesn't merge, and it never treats a merge request from anyone
else as approval. Sam can make "Check hubs" and "Release tests" required checks in the repo's branch protection settings.

## 11. Release and post-release verification

1. **Release:** the agent merges when Sam says "merge" (or Sam merges). GitHub Pages publishes ("pages build and deployment" in Actions; about a minute).
2. **Verify** (by itself since 2026-11-15: the **After merge** workflow runs it once Pages serves the push,
   [after-a-merge](vault/how-to/after-a-merge.md); read its result): `node tools/release/postcheck.js` checks every changed file is live and
   identical to `main`, and opens the dashboard and the changed hubs on the live site with every Supabase request
   blocked (it writes nothing). Then open the changed feature on a phone, as a person.
3. **Log it:** a "Recent major changes" line in `DEPLOY_NOTES.md`, and the site changelog when students would notice
   (a `<hub> | <message>` line in `tools/after-merge/changelog.txt` in the PR, which the After merge workflow logs).
4. Close the bug-log rows the release fixed (retested on the live site), and write the test report's outcome.

## 12. Rollback

[vault/how-to/roll-back-a-release.md](vault/how-to/roll-back-a-release.md): revert the merge with a new PR (GitHub's
Revert button), merged like any other (Sam's "merge"); never force-push `main`. A migration is undone with a new migration,
never by restoring the database without Sam. Then the post-release check again, a note to the class if they saw the
problem (Sam's call), and the bug log.

## 13. Hosting and staging

**Sam's call, 2026-11-04: A, Cloudflare Pages, for a preview link per PR** (since 2026-11-06 only on request: the
`preview` label or a run by hand of the Preview workflow, [section 3](#3-interactive-previews)), and **1, fixtures only, for staging** for now. Cloudflare Access isn't set up:
previews show only made-up data and the site is public anyway, but anyone with a link can open one; adding Access later
costs $0. Connected 2026-11-04 ([task](vault/tasks/done/2026-11-04-preview-hosting-and-staging.md)). Prices are from each
vendor's published plans as of November 2026; confirm on their pricing pages before signing up.

**Hosted preview link per PR** (so a preview opens on a phone from the PR, with no computer):

| Option | Cost | What Sam would do | Notes |
|---|---|---|---|
| A. Cloudflare Pages, deployed from the Release tests workflow (**chosen 2026-11-04**) | $0 (Free: unlimited bandwidth, 500 builds a month); Cloudflare Access to keep previews private: $0 up to 50 users | Create a Cloudflare account and a Pages project (e.g. `study-hubs-preview`); create an API token with "Cloudflare Pages: Edit"; add it as the repo secret `CLOUDFLARE_API_TOKEN` and the account id as the variable `CLOUDFLARE_ACCOUNT_ID`; optionally an Access policy on `*.study-hubs-preview.pages.dev` (email one-time code) | Its own origin; reads `_headers` (X-Robots-Tag); per-PR URL `pr-<n>.<project>.pages.dev`. The `preview` job does the rest. |
| B. Netlify deploy previews | Free plan (credit-based for new accounts; check how many deploys it covers) | Create an account; connect the repo or add a token secret | Reads `_headers`; previews public unless password protection (a paid feature) |
| C. Vercel preview deployments | $0 on Hobby (non-commercial use only) | Create an account; connect the repo | Adds noindex to previews by itself; Vercel Authentication can keep them private |
| D. Keep the current ways only | $0 | Nothing | Local or cloud-session preview, or the CI artifact (needs a computer) |
| Not an option | | | A second GitHub Pages repo: same origin as the live site (shared storage and service worker) |

**Staging database** (for migrations and server logic):

| Option | Cost | What Sam would do | Notes |
|---|---|---|---|
| 1. Fixtures only (**chosen 2026-11-04**) | $0 | Nothing | UI and every write path; no real server logic. `rls.js` covers permissions. |
| 2. A second free Supabase project (the pick if one is wanted) | $0 (the Free plan allows two active projects; the account has one active now) | Create `study-hubs-staging`, load `supabase/schema.sql` with a staging-only admin secret, add its URL and publishable key as repo variables `SH_STAGING_URL`, `SH_STAGING_KEY`; keep its admin secret in Sam's local ops scripts | Pauses after a week idle (restore from the dashboard). Seed it with `personas.json`-style made-up data, never production rows. |
| 3. Supabase branching (a database per PR) | Pro plan $25 a month, plus compute for each branch while it runs | Upgrade, connect the GitHub integration; the migrations move into `supabase/migrations/` | Most automatic; real money and a restructure |

Also Sam's call: whether to make "Check hubs" and "Release tests" required checks, and whether classmates may be UAT
testers (only on fixture previews Sam shares).

Related: [preview-and-release-test](vault/rules/preview-and-release-test.md) ·
[preview-a-change](vault/how-to/preview-a-change.md) · [uat-checklist](vault/release/uat-checklist.md) ·
[bug-log](vault/release/bug-log.md) · [roll-back-a-release](vault/how-to/roll-back-a-release.md) ·
[ship-a-change](vault/how-to/ship-a-change.md) · [verify-before-pushing](vault/how-to/verify-before-pushing.md)
