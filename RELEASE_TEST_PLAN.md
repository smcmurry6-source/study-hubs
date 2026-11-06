# Release test plan

How every substantial change to the study hubs is tested and approved (and previewed, when Sam asks) before it reaches the class, and how
it is checked and, if needed, rolled back after. It is a standing rule
([vault/rules/preview-and-release-test.md](vault/rules/preview-and-release-test.md), Sam, 2026-11-04) for every agent
and session. Merging to `main` is the release: GitHub Pages publishes it to the class within a minute or two.

Contents: [1. Which changes](#1-which-changes) · [2. The flow](#2-the-flow) · [3. Previews](#3-interactive-previews) ·
[4. Data isolation](#4-data-isolation) · [5. Test accounts](#5-test-accounts) · [6. Automated gates](#6-automated-gates) ·
[7. Manual UAT](#7-manual-uat) · [8. Browsers and devices](#8-browsers-and-devices) · [9. Bug log](#9-bug-log) ·
[10. Approval](#10-approval) · [11. Release and verification](#11-release-and-post-release-verification) ·
[12. Rollback](#12-rollback) · [13. Hosting and staging](#13-hosting-and-staging)

## 1. Which changes

The process scales with risk, so a small fix still ships the same day ([ship-it-now](vault/rules/ship-it-now.md)). An exam
is never a reason to hold a change; on an exam day, a tier 3 change only needs Sam to be around for it.

| Tier | What | What it needs |
|---|---|---|
| 0, notes | Only `vault/`, `DEPLOY_NOTES.md`, `LESSONS.md`, `tools/` docs | CI ("Check hubs") |
| 1, small content | A question's wording, an explanation or "why" line, a typo, a date or label, a new question in an existing format | CI, and the author looks at it (screenshots with the class's data stubbed; a preview only if Sam asks). Sam's merge is the approval. |
| 2, substantial | Anything that changes how the site behaves or what it saves: a new feature, mode, tab, game, setting, easter egg or question type; anything in `widget/`, `sw.js`, the dashboard's or admin page's script; a new hub or lectures added to one; ranks, XP, trophies, names, device linking, reports, comments, surveys, admin; a change to more than one hub; a redesign | Everything below: the release suites green (or each failure explained), the bug log, **Sam's explicit approval**; the agent asks once whether Sam wants a preview, and with a yes, a preview link and UAT from the checklist on a real phone |
| 3, high risk | A Supabase migration; anything in answer saving, sync or the service worker; deleting or moving student data; a change on a live hub's exam day | Tier 2, plus `tools/release/rls.js` and `rls-audit.sql`, a staging run when staging exists, a written rollback in the PR, and the post-release check within the hour |

When unsure, use the higher tier.

## 2. The flow

1. Branch from a fresh `origin/main`; make the change ([ship-a-change](vault/how-to/ship-a-change.md)).
2. **A preview only on request** (Sam, 2026-11-06): for a tier 2 or 3 change, ask Sam once, in one line, whether to
   make one; Sam can also ask any time. With a yes, open it and use it like a student
   ([preview-a-change](vault/how-to/preview-a-change.md)).
3. The **automated gates** run on the PR; run `node tools/release/run.js` locally first if you can.
4. With a preview, **UAT** by the agent in it, with [the checklist](vault/release/uat-checklist.md) for the change's
   type, on an emulated phone and a computer.
5. Every problem found goes in the **[bug log](vault/release/bug-log.md)**, is fixed and retested, or accepted by Sam.
6. Write the PR's **test report** ([template](vault/templates/release-test-report.md)): what was exercised, results,
   what's left. A long one goes in `vault/release/reports/`.
7. The agent **shows Sam the change** (screenshots, a recording, the preview link when there is one); **Sam approves** it in the PR, then
   merges ([approval](#10-approval)).
8. **After the merge:** the post-release check and the changelogs; roll back if needed.

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
| Database permissions | `node tools/release/rls.js` | every PR | A table without RLS; anon access beyond `rls-expectations.json`; student data readable; a definer function without `search_path`; a secret-gated function that answers no or a wrong secret, or writes; per-visitor reads that leak |
| Smoke and question lint | `node tools/ci/smoke.js` | every PR | A JavaScript error or sideways scroll on any screen of the hubs a PR touches (every hub when a shared file changes); the question rules (formats, whys, likely topics, answer length) |
| Preview safety | `node tools/ci/preview.js` | every PR | Any request reaching Supabase; a page without noindex or the runtime; a write path not reaching the fixtures; the admin page answering a wrong secret |
| Accessibility | `node tools/release/a11y.js` | Release tests | A new or worse axe (WCAG 2.2 AA) issue than `tools/release/baselines/a11y.json`; focus you can't see; a keyboard trap; endless animation with reduced motion on |
| Performance | `node tools/release/perf.js` | Release tests | Bytes or requests over `tools/release/budgets.json` on a slow-4G phone; FCP, LCP or blocking time past 1.5x budget |
| Devices and resilience | `node tools/release/matrix.js` | Release tests | An error or sideways scroll on 7 device sizes in Chromium, WebKit and Firefox; state lost on refresh; Back/Forward broken; no offline copy; a hub that breaks when class data is slow or down; slower than 45 s to usable on slow 3G |
| All of the above | `node tools/release/run.js` | by hand, Release tests | Writes one summary to paste into the test report |
| After the merge | `node tools/release/postcheck.js` | after each release | The live files differ from `main`; a live page throws |

"Check hubs" (the first six) runs on every PR. "Release tests" (trimmed on Sam's call, 2026-11-06) runs on a PR only when it
changes shared code (the dashboard, About, the admin page, `widget/`, assets, the service worker, the database, the
preview runtime, the suites or its own workflow) or has the **`full-tests` label**, and then skips the suites Check hubs
already ran on that commit; question and notes changes skip it. **A tier 2 or 3 change that stays inside hubs** (a new
hub, lectures added to one, a new mode or game in a hub) gets the `full-tests` label. Run by hand (Actions, Release
tests, Run workflow), it runs every suite. Regression coverage is the smoke test (every hub a change can reach, every mode, two sizes; `--all` or `SMOKE_ALL=1` for every hub),
the question lint, the baselines (accessibility, performance) and the preview's write-path checks; a bug that slipped
through gets a check added in the PR that fixes it, where a script can see it.

Baselines only move down. Raise one (a new page's numbers, an approved heavier feature) only with `--update` in the PR
that needs it, saying why; never to make a check pass.

## 7. Manual UAT

When Sam asked for a preview, the agent does the UAT itself: it uses the change in the preview with a scripted browser (Playwright) on an emulated
phone, tablet and laptop, as the test accounts the change affects, with [the UAT checklist](vault/release/uat-checklist.md):
a core pass for every substantial change plus a section per kind of change (questions and notes, a new hub or lecture,
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

Sam is the product owner, and nothing substantial reaches the class without Sam's explicit approval of that release.
Sam's part is a look, not a test pass (Sam, 2026-11-04): before asking, the agent **shows Sam the change**
([preview-a-change](vault/how-to/preview-a-change.md)):

- when Sam asked for a preview, **the preview link on its own line, first**: `Preview: https://pr-<n>.<project>.pages.dev`
  from the PR's preview comment ([section 3](#3-interactive-previews)), then the page and test account to open;
- screenshots of what changed on a phone and a laptop (dark mode too when colors changed), sent in the chat; without a
  preview, taken in a scripted browser with the class's data stubbed, as `tools/ci/smoke.js` does;
- a short recording when it moves or takes several steps.

Sam says yes, or what to change, and a change gets a new round of screenshots. For tier 2 and 3, the PR description
has a checkbox, "Sam approved this release", that **only Sam ticks** (or Sam writes "approved for release" in a PR
comment). Agents never tick it, never
merge, and never treat a merge request from anyone else as approval. Tier 0 and 1: Sam's merge is the approval, as
before. Sam can make "Check hubs" and "Release tests" required checks in the repo's branch protection settings.

## 11. Release and post-release verification

1. **Release:** Sam merges. GitHub Pages publishes ("pages build and deployment" in Actions; about a minute).
2. **Verify** (within the hour; tier 3 at once): `node tools/release/postcheck.js` checks every changed file is live and
   identical to `main`, and opens the dashboard and the changed hubs on the live site with every Supabase request
   blocked (it writes nothing). Then open the changed feature on a phone, as a person.
3. **Log it:** a "Recent major changes" line in `DEPLOY_NOTES.md`, and the site changelog when students would notice
   (`log_changelog`, [secrets](vault/rules/secrets.md)).
4. Close the bug-log rows the release fixed (retested on the live site), and write the test report's outcome.

## 12. Rollback

[vault/how-to/roll-back-a-release.md](vault/how-to/roll-back-a-release.md): revert the merge with a new PR (GitHub's
Revert button), which Sam merges like any other; never force-push `main`. A migration is undone with a new migration,
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
