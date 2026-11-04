---
type: task
status: blocked
hub: site
created: 2026-11-04
requested-by: Sam
due:
waiting-on: Sam's choice of a preview host and a staging database (accounts, tokens and costs are Sam's call)
agent: Claude Code
pr:
---

# Choose and connect a preview host and a staging database

## Goal

Give every PR a preview link that opens on a phone, and give migrations and server-side logic a database to be tested
on, without touching the class's data. The rest of the release process is already in place
([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md)); these two need an account, so they wait for Sam.

## Context

- The options, costs and exactly what Sam would do for each: [RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md), section 13.
- Recommended: Cloudflare Pages deployed from the Release tests workflow, with Cloudflare Access ($0), and a second free
  Supabase project for staging ($0; the account has one active project, the Free plan allows two).
- Not an option: a second GitHub Pages repo (same origin as the live site: shared storage and service worker).
- Builds are ready: `node tools/preview/build.js --out _preview` (noindex, `_headers`, robots.txt, fixture data);
  `serve.js --data staging` reads `SH_STAGING_URL` / `SH_STAGING_KEY`.

## Done when

- [ ] Sam picked a host (or "keep the current ways"), and a staging option.
- [ ] Host: the Release tests workflow deploys `_preview` to it per PR (`pr-<n>`), only with the repo's secrets, and the
      PR's run page links it; previews are private if Sam wants them private.
- [ ] Staging: the project exists with its own admin secret, `supabase/schema.sql` loaded, made-up seed data; the repo has
      `SH_STAGING_URL` and `SH_STAGING_KEY` as variables; `serve.js --data staging` works against it and
      `tools/release/rls-audit.sql` there returns no findings.
- [ ] `RELEASE_TEST_PLAN.md` section 13 says what was chosen; `vault/decisions.md` has the line.
- [ ] CI passes.

## Log

- 2026-11-04: written by the session that built the release process; waiting on Sam.

## Outcome
