---
type: task
status: done
hub: site
created: 2026-11-04
requested-by: Sam
due:
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/233
---

# Connect the preview host (Cloudflare Pages)

## Goal

Give every PR a preview link that opens on a phone, without touching the class's data
([RELEASE_TEST_PLAN.md](../../../RELEASE_TEST_PLAN.md), sections 3 and 13).

## Context

- Sam's call, 2026-11-04: Cloudflare Pages (option A) for a link per PR; staging stays fixtures-only for now. Timmy Time
  episodes are left out of the Cloudflare copy (Sam; they're over its 25 MB a file and play the live site's copy).
- The deploy is built: the `preview` job in `.github/workflows/release.yml` builds with `--no-podcast`, creates the Pages
  project `study-hubs-preview` if it's missing, deploys the PR to the `pr-<n>` branch and keeps one PR comment with the
  link. It needs only a token with "Cloudflare Pages: Edit". **Never the Global API Key**: it controls the whole
  Cloudflare account, and any workflow on a branch in this repo could read the secret.
- Cloudflare Access (private previews, $0 up to 50 users) isn't set up: the previews hold only made-up data, but anyone
  with a link can open one. Sam's call if that should change.
- Not an option: a second GitHub Pages repo (same origin as the live site: shared storage and service worker).

## What Sam does (about 5 minutes)

1. Cloudflare dashboard, profile icon at the top right, **My Profile**, **API Tokens**, **Create Token**, **Create Custom
   Token**: name it `study-hubs previews`; Permissions: **Account**, **Cloudflare Pages**, **Edit**; Account Resources:
   Include, your account. **Continue to summary**, **Create Token**, and copy it.
2. GitHub, this repo, **Settings**, **Secrets and variables**, **Actions**: **New repository secret** named
   `CLOUDFLARE_API_TOKEN` with the token; then the **Variables** tab, **New repository variable** named
   `CLOUDFLARE_ACCOUNT_ID` with the account id (the long code after `dash.cloudflare.com/` in the address bar).
   Paste the token only into GitHub, never into a chat.

## Done when

- [x] Sam picked a host (Cloudflare Pages) and a staging option (fixtures for now).
- [x] The Release tests workflow deploys each site-changing PR to `pr-<n>` with only the repo's secrets and puts the link
      on the PR.
- [x] The secret and variable are in GitHub, and a run posts a working link (the dashboard and one hub load,
      the Preview button says no request reached production).
- [x] `RELEASE_TEST_PLAN.md` section 13 says what was chosen; `vault/decisions.md` has the line.
- [ ] CI passes.

## Log

- 2026-11-04: written by the session that built the release process; waiting on Sam.
- 2026-11-04: Sam first chose neither, then Cloudflare Pages the same day ("lets try the cloudflare thing"); the
  `preview` job was added in PR #233. Waiting for the token and account id in GitHub.
- 2026-11-04: Sam added them. The first two tries failed: the token had no Cloudflare Pages access (403); the new
  "Check the Cloudflare token" step said so. After Sam fixed the token's permission, the deploy went through.

## Outcome

Connected, 2026-11-04 (PR #233). The first deploy (21:01 UTC, 104 files) was opened on an emulated iPhone 13: the
dashboard as the high-XP account and Occlusion as the missed-question account loaded (200, no page errors),
`X-Robots-Tag: noindex…` and `robots.txt` `Disallow: /` were served, the Preview panel said "No request has reached
production", and no request left the browser for Supabase. A new project's address took about 30 seconds to get its
certificate. Staging stays fixtures-only (Sam); Cloudflare Access isn't set up.
