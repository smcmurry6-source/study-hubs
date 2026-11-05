---
type: test-report
tags: [testing, release, admin]
---

# Release test: admin operations (who's studying now, archive overrides, newest-first check-ins)

Run in a Claude Code cloud session (Linux, Node 22, Playwright 1.56 with Chromium, PostgreSQL 16, axe-core 4.14) on
branch `claude/clever-wright-ftcdnm`, on top of `main` at `8491d9f` (PR #233 merged). Nothing was deployed and nothing
was written to the class's data: every page ran on the preview's fixtures, the database tests ran on throwaway
PostgreSQL copies of `supabase/schema.sql`, and the live project was only read through its system catalogs (names and
function signatures, no student rows). [How it works](../../reference/admin-operations.md) ·
[task](../../tasks/2026-11-04-admin-operations.md)

- **Change:** the admin page gets a Live tab (who's studying now, by leaderboard name) and a Hubs tab (set a hub live,
  archived or hidden by hand, with an audit log); check-ins and surveys read newest first. Students see a hub card or a
  hub page follow Sam's choice (no About page entry: Sam keeps admin information off it).
- **Tier:** 3: a migration (`migration_v50.sql`, new tables and functions) and a change to what the dashboard shows.
  Waits for Sam's written approval; the migration is applied only after it.
- **Preview:** `node tools/preview/serve.js` on the branch (the PR's Cloudflare Pages link when its preview job runs).
  Sam was shown nine screenshots (laptop light, phone dark). Every run ended with no request reaching production.

## Automated

RESULTS

## Exercised in the preview (scripted browser, screenshots looked at)

Test accounts **admin** (secret `preview-admin`), **returning** and **new**; time travel to Tue Nov 10, 12:00 pm.

- **Surveys tab:** the fixture check-ins arrive out of order; the groups show Heme & Endo (newest 1 h ago), PCD Implants
  (5 h), Occlusion (2 days), Perio (20 days), and each group's rows newest first. Survey answers newest first.
- **Live tab:** 5 people; Occlusion 3, Perio 2, PCD Implants 1, names A to Z; someone in two hubs counts once. No visitor
  id, email or section anywhere in the page or its requests. It asks again every 30 s only while the tab is open and the
  page visible (checked by counting calls with the tab hidden and on another tab).
- **Hubs tab:** Occlusion set to Archived with a note: confirmation first, then "Saved", the log row, the dashboard shows
  its greyed card with no Open button ("archived for now"), and the hub page says it's archived. Back to automatic undid
  all three. Heme & Endo (gone by its dates) set Live until 6 pm: an end time in the past was refused first; then
  its card was open at noon and gone again at 7 pm (time travel). A second tab with a stale
  copy was refused and reloaded instead of overwriting. A hub with no page can't be set Live. Escape closes the form and
  puts focus back on Change.
- **Phone (390 px, dark):** no sideways scroll on Live or Hubs, tap targets at least 40 px, the confirmation readable.

## UAT

[UAT checklist](../uat-checklist.md) sections used: the admin page, the dashboard (hub cards), a hub page, phone layout,
keyboard, dark mode, reduced motion (no new animation), privacy.

| Device | Browser | Accounts | Result |
|---|---|---|---|
| Laptop 1280 × 860, light | Chromium | admin, returning | pass |
| Phone 390 × 844, dark, touch | Chromium (mobile emulation) | admin | pass |
| The device matrix (7 sizes) | Chromium | every account `matrix.js` uses | see Automated |

## Bugs

- BUG-010 (S3): the check-in groups sorted by hub name in reverse. Fixed here, retested in the preview and on a throwaway
  database; retest on the live page after the release.
- Found and fixed while building (not shipped, so not logged): a lone Cancel above the confirmation box; the stale-tab
  test opening without the admin secret.

## Not covered

- The live database with the migration applied: not until Sam approves. The functions were tested on throwaway copies
  of the schema; the live project's catalog shows the new names are free, everything they depend on exists, and the
  two replaced functions keep their exact signatures.
- Real devices, WebKit and Firefox: not installed in this session (CI's "Release tests" runs WebKit and Firefox).
- Realtime presence (the students' green pill) is unchanged and not simulated.
- Load: `admin_live_presence` reads a few minutes of pings through an index; not measured against the live table.

## Release

- [ ] Sam approved this release (Sam ticks it in the PR).
- [ ] `migration_v50.sql` applied (connector `apply_migration`), then merged; `node tools/release/postcheck.js` passed:
- [ ] The live admin page: Live and Hubs tabs load, check-ins newest first (BUG-010 retested):
- [ ] Monitored at 1 h / 24 h / 48 h (`tools/release/monitor.sql`), Inbox and logs:
- [ ] `DEPLOY_NOTES.md` and the site changelog updated.

Related: [admin-operations](../../reference/admin-operations.md) · [bug log](../bug-log.md) ·
[RELEASE_TEST_PLAN.md](../../../RELEASE_TEST_PLAN.md)
