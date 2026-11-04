---
type: how-to
tags: [shipping, testing]
---

# Preview a change

A preview is the site from your branch, in a real browser, on made-up data: use it like a student before Sam does.
Why and the safety layers: [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md) (sections 3-5).

## Open one

- **On your computer:** `node tools/preview/serve.js`, then open `http://127.0.0.1:4173/`. It serves the checkout as it
  is, so edit, reload, look. Stop it with Ctrl+C.
- **On your phone:** `node tools/preview/serve.js --host 0.0.0.0`, then open `http://<computer's address>:4173/` on the
  same Wi-Fi.
- **In a Claude Code cloud session:** run `node tools/preview/serve.js --port 4173` in the background, then call
  `report_preview_port` with 4173. Sam opens it from the Claude app, on a phone too, while the session is up.
- **From a PR:** the "Release tests" run attaches `preview-site`. Download it, unzip, and
  `node tools/preview/serve.js --dir preview-site`.
- **A static copy** for a host: `node tools/preview/build.js --out _preview` (`_preview/` is gitignored), checked with
  `node tools/preview/build.js --check _preview`.

You need only Node. Hub narration plays from your checkout (`serve.js`) or from the live site's public mp3s (a build
that didn't change them).

## Use it

The **Preview** button, bottom left, opens the controls:

- **Test account:** new, returning (the default), high-XP, missed-question, archived-hub, admin
  ([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), section 5). Switching starts that account fresh. Same with a link:
  `?persona=missed` on any page.
- **Pretend it's:** time travel (exam morning, the night a hub archives, a holiday). Or `?now=2026-11-19T21:00`;
  `?now=real` resets it.
- **Class data:** Normal, Slow (2 seconds a request: loading states) or Unreachable (what students see when Supabase
  is down).
- **What this site tried to save:** every write the page made, newest first. Copy it into a bug report.
- The admin page is `review/`. As the admin account it opens by itself; otherwise its secret is `preview-admin`.
  Never type the real admin secret into a preview.

If the button turns red, something tried to reach production: that's an S1 bug, report it (the write log says what).

## Show Sam

Sam looks at a substantial change before approving it and doesn't test it
([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), section 10). Make that one easy look:

- **Screenshots, first and every time,** of what changed on a phone (390 px) and a laptop (1280 px), dark mode too when
  colors changed, at `deviceScaleFactor: 2`. Send them in the chat (`SendUserFile` in Claude Code) and say what each one
  shows. They are what Sam sees: a cloud session's preview has no address outside the session, so there is no link Sam
  can tap (2026-11-04: Sam asked for one; that needs a hosted preview, [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md)
  section 13). Never send the session's own link as if it opened the preview.
- **A short recording** when it moves or takes several steps (Playwright's `recordVideo`), cut to the part that matters.
- **The live preview, as a bonus:** keep `serve.js` running in the cloud session and call `report_preview_port`; where
  the Claude app shows a preview panel, Sam can tap through it there. Say which page and test account to open (`?persona=missed`), and keep the session up
  until Sam has looked.

Sam says yes, or what to change; a new round gets new screenshots.

## What a preview can't show

Realtime (who's online, nukes, bosses: it shows 1 online); real class numbers (they're made up per question); the
server's own rules for XP, streaks and leaderboards (approximated). Those need a staging database, not set up for
now (Sam, 2026-11-04; [task](../tasks/done/2026-11-04-preview-hosting-and-staging.md)). Real Safari needs a real
iPhone, iPad or Mac.

## Before the PR

`node tools/release/run.js` runs every automated suite and writes a summary for the test report
([template](../templates/release-test-report.md)). It needs Playwright and axe-core (`npm i --no-save playwright
axe-core`) and PostgreSQL's server binaries; suites it can't run say "blocked", never "pass".

Related: [verify-before-pushing](verify-before-pushing.md) · [uat-checklist](../release/uat-checklist.md) ·
[preview-and-release-test](../rules/preview-and-release-test.md)
