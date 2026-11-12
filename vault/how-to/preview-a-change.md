---
type: how-to
tags: [shipping, testing]
---

# Preview a change

A preview is the site from your branch, in a real browser, on made-up data: use it like a student before Sam does.
Why and the safety layers: [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md) (sections 3-5).

**Only on request** (Sam, 2026-11-06: "for the majority of cases i dont need it";
[preview-and-release-test](../rules/preview-and-release-test.md)). For a tier 2 or 3 change, ask Sam once, in one line,
when you hand it over: "Want a preview of this?" Make one only when Sam says yes, or asks. Tier 0 and 1: don't ask.
Without a preview, take screenshots in a scripted browser with the class's data stubbed (as `tools/ci/smoke.js` does),
never on the plain page as a test account: that saves to the class's real data.

## Open one

- **On your computer:** `node tools/preview/serve.js`, then open `http://127.0.0.1:4173/`. It serves the checkout as it
  is, so edit, reload, look. Stop it with Ctrl+C.
- **On your phone:** `node tools/preview/serve.js --host 0.0.0.0`, then open `http://<computer's address>:4173/` on the
  same Wi-Fi.
- **In a Claude Code cloud session:** run `node tools/preview/serve.js --port 4173` in the background, then call
  `report_preview_port` with 4173. Sam opens it from the Claude app, on a phone too, while the session is up.
- **From a PR, on a phone:** add the `preview` label to the PR (or run Actions, Preview, Run workflow on its branch).
  The Preview workflow deploys it to Cloudflare Pages and puts the link, `https://pr-<n>.<project>.pages.dev`, in a PR
  comment, kept up to date on each push while the label stays (no Timmy Time episodes, which play the live site's copy).
- **From a PR, on a computer:** the same Preview run attaches `preview-site`. Download it, unzip, and
  `node tools/preview/serve.js --dir preview-site`.
- **A static copy** for a host: `node tools/preview/build.js --out _preview` (`_preview/` is gitignored), checked with
  `node tools/preview/build.js --check _preview`.

You need only Node. Hub narration plays from your checkout (`serve.js`) or from the live site's public mp3s (a build
that didn't change them).

## Use it

The **Preview** button, bottom left, opens the controls:

- **Test account:** new, returning (the default), high-XP, missed-question, archived-hub, admin
  ([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), section 5). Switching starts that account fresh. Same with a link:
  `?persona=missed` on any page. `?xp=180000` stands the account anywhere on the rank ladder (the redesign's
  journeys: `?xp=124999` and one answer plays the hand-off to the ModuPro).
- **Pretend it's:** time travel (exam morning, the night a hub archives, a holiday). Or `?now=2026-11-19T21:00`;
  `?now=real` resets it.
- **Class data:** Normal, Slow (2 seconds a request: loading states) or Unreachable (what students see when Supabase
  is down).
- **What this site tried to save:** every write the page made, newest first. Copy it into a bug report.
- The admin page is `review/`. As the admin account it opens by itself; otherwise its secret is `preview-admin`.
  Never type the real admin secret into a preview.
- **The database before a migration** (no button: for a scripted test): `missing` in the preview's settings
  (`localStorage.sh_preview_ui`, e.g. `{"missing": ["admin_timmy_"]}`) makes every function whose name starts with one of
  those answer "Could not find the function", as the live database does before its migration. `tools/release/admin-ui.js`
  uses it to see the admin page's Ask Timmy tab as it is until the redesign's release.

If the button turns red, something tried to reach production: that's an S1 bug, report it (the write log says what).

## Show Sam

Sam looks at a substantial change before approving it and doesn't test it
([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), section 10). Make that one easy look:

- **When Sam asked for a preview, its link on its own line, first** (Sam, 2026-11-04): `Preview: https://pr-<n>.<project>.pages.dev`,
  copied from the PR's preview comment (or the Preview run's page), then the page and test account to open
  (`hubs/occlusion/?persona=missed`). Never send a session's own link instead: a cloud session's preview has no address
  outside it. If the PR has no link yet (the run hasn't finished, or the host isn't connected), say so.
- **Screenshots** of what changed on a phone (390 px) and a laptop (1280 px), dark mode too when colors changed, at
  `deviceScaleFactor: 2`. Send them in the chat (`SendUserFile` in Claude Code) and say what each one shows.
- **A short recording** when it moves or takes several steps (Playwright's `recordVideo`), cut to the part that matters.

Sam says yes, or what to change; a new round gets new screenshots.

## What a preview can't show

Realtime (who's online, nukes, bosses: it shows 1 online); real class numbers (they're made up per question); the
server's own rules for XP, streaks and leaderboards (approximated). Those need a staging database, not set up for
now (Sam, 2026-11-04; [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), section 13). Real Safari needs a real
iPhone, iPad or Mac.

## Before the PR

`node tools/release/run.js` runs every automated suite and writes a summary for the test report
([template](../templates/release-test-report.md)). It needs Playwright and axe-core (`npm i --no-save playwright
axe-core`) and PostgreSQL's server binaries; suites it can't run say "blocked", never "pass".

Related: [verify-before-pushing](verify-before-pushing.md) · [uat-checklist](../release/uat-checklist.md) ·
[preview-and-release-test](../rules/preview-and-release-test.md)
