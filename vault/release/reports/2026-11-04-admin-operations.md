---
type: test-report
tags: [testing, release, admin]
---

# Release test: the admin page (redesign, who's studying now, archive overrides, newest-first check-ins)

Run in a Claude Code cloud session (Linux, Node 22, Playwright 1.56 with Chromium, PostgreSQL 16, axe-core 4.10) on
branch `claude/clever-wright-ftcdnm`, with `main` at `0b80306` (PR #237 merged in). Nothing was deployed and nothing was
written to the class's data: every page ran on the preview's fixtures, the database tests ran on throwaway PostgreSQL
copies of `supabase/schema.sql`, and the live project was only read through its system catalogs (names and function
signatures, no student rows). [How it works](../../reference/admin-operations.md) ·
[task](../../tasks/2026-11-04-admin-operations.md)

- **Change:** the admin page is redesigned (a sidebar of views, a header per view, data loaded per view, an Overview of
  what's waiting, check-ins and searches in their own views, a Menu on phones; #237's Insights tab is a view in it) and
  gains a Live view (who's studying now, by leaderboard name) and a Hubs view (set a hub live, archived or hidden by hand,
  with an audit log); check-ins and surveys read newest first. Students see a hub card or a hub page follow Sam's choice
  (no About page entry: Sam keeps admin information off it).
- **Tier:** 3: a migration (`migration_v50.sql`, new tables and functions) and a change to what the dashboard shows.
  Sam approved it in writing on 2026-11-05 ("Merge when ready"); the migration was applied first, then the PR merged.
- **Preview:** the PR's Cloudflare Pages link (the bot's comment on the PR), or `node tools/preview/serve.js` on the
  branch. Sam was shown screenshots (laptop light, phone dark). Every run ended with no request reaching production.

## Automated

Run locally after merging `main` (`node tools/release/run.js`, Chromium; CI's "Release tests" adds WebKit and Firefox):

RESULTS

Also run by hand on the redesigned page: **axe (WCAG 2.0-2.2 A and AA) on every signed-in admin view**, light and dark,
1280 and 390 px wide (`a11y.js` only covers the sign-in screen): no violations, after fixing three it found (a hub row's
`aria-expanded="null"`, wide tables that scrolled without a keyboard stop, the Insights "note" pill's contrast). The
taste-skill's checks: `lint.mjs --app` 0 FAIL (one WARN: zero-padding for a date input, which is right); `inspect.mjs
--app` at 1440, 768 and 390 px: two FAILs, both from the preview's own "⚠ Preview · Admin" badge (an emoji and a button
shadow), which only previews have.

**CI's "Release tests" on this PR** fails on two things that aren't this PR's: the same failures are on #237's run (now in
`main`) and on the other open PRs: Perio's Review table (`#ref-antibiotics > .table-wrap`) has no keyboard access (axe,
`hubs/perio/`), and in WebKit and Firefox the dashboard and some hubs scroll sideways on a small phone and an iPad Mini
(Chromium passes). Neither file is touched here. Explained on the PR; they need their own fix.

## Exercised in the preview (scripted browser, screenshots looked at)

Test accounts **admin** (secret `preview-admin`), **returning** and **new**; time travel to Tue Nov 10, 12:00 pm.

- **Every view** opens with its title, no error and its own address (`#inbox`...); the back button returns to the view
  before. On sign-in the Overview asks only for its own data (no clicks, searches, surveys, features or nukes) and reuses
  the sign-in check's reports.
- **Overview:** "2 reports waiting for a reply · 5 people studying now · 73 hr studied"; Waiting on you links to Inbox,
  Exam check-ins and Live.
- **Exam check-ins:** the fixture check-ins arrive out of order; the groups show Heme & Endo (newest 1 h ago), PCD
  Implants (5 h), Occlusion (2 days), Perio (20 days), and each group's rows newest first. **Surveys:** newest first.
- **Live:** 5 people; Occlusion 3, Perio 2, PCD Implants 1, names A to Z; someone in two hubs counts once. No visitor id,
  email or section anywhere in the page or its requests. It asks again every 30 s only while the view is open and the
  page visible (checked by counting calls with the page hidden and on another view).
- **Hubs:** Occlusion set to Archived with a note: confirmation first, then "Saved", the log row, the dashboard shows its
  greyed card with no Open button ("archived for now"), and the hub page says it's archived. Back to automatic undid all
  three. Heme & Endo (gone by its dates) set Live until 6 pm: an end time in the past was refused first; then its card
  was open at noon and gone again at 7 pm (time travel). A second tab with a stale copy was refused and reloaded instead
  of overwriting. A hub with no page can't be set to Live. Escape closes the form and puts focus back on Change.
- **Insights:** the fixture numbers render with their orange flags and decision lists; Past hubs adds the archived ones.
- **Phone (390 px, dark):** the Menu opens a full-screen list with focus in it, Escape closes it and returns focus; the
  top bar's buttons are 44 px; no sideways scroll on any view (wide tables scroll inside their card); tap targets in the
  Hubs form at least 40 px.

## UAT

[UAT checklist](../uat-checklist.md) sections used: the admin page, the dashboard (hub cards), a hub page, phone layout,
keyboard, dark mode, reduced motion (the only motion is the menu sliding in, off under reduced motion), privacy.

| Device | Browser | Accounts | Result |
|---|---|---|---|
| Laptop 1440 × 900 and 1280 × 860, light | Chromium | admin, returning | pass |
| Tablet 768 px | Chromium | admin | pass (inspector screenshots) |
| Phone 390 × 844, dark, touch | Chromium (mobile emulation) | admin | pass |
| The device matrix (7 sizes) | Chromium | every account `matrix.js` uses | see Automated |

## Bugs

- BUG-010 (S3): the check-in groups sorted by hub name in reverse. Fixed here, retested in the preview and on a throwaway
  database; retest on the live page after the release.
- Found and fixed while building (not shipped, so not logged): a lone Cancel above the confirmation box; the stale-tab
  test opening without the admin secret; the three axe findings above; a menu Close button showing on a laptop; two
  half-width cards side by side on a phone; a check-in table widening the phone page.

## Not covered

- The functions' behavior on the live database is checked read-only only: after the migration, the tables have RLS on
  and no visitor access, a wrong passphrase is refused, `get_hub_overrides()` returns nothing (no override set), and the
  live permission audit has no findings. Before it, the catalog showed the new names were free, everything they depend
  on existed, and the two replaced functions kept their exact signatures and return types.
- Real devices, WebKit and Firefox: not installed in this session (CI's "Release tests" runs WebKit and Firefox).
- Realtime presence (the students' green pill) is unchanged and not simulated.
- Load: `admin_live_presence` reads a few minutes of pings through an index; not measured against the live table.
- The redesigned views against real data: the preview's numbers are made up (each view has its own fixture, so they
  don't add up across views). The first look on the live page after the release is part of the checks below.

## Release

- [x] Sam approved this release: in the session, 2026-11-05, "Merge when ready" (the PR's box is Sam's to tick).
- [x] `migration_v50.sql` applied (connector `apply_migration`, 2026-11-05; live audit clean), then merged.
- [ ] `node tools/release/postcheck.js` passed:
- [ ] The live admin page: every view loads, Live and Hubs work, check-ins newest first (BUG-010 retested):
- [ ] Monitored at 1 h / 24 h / 48 h (`tools/release/monitor.sql`), Inbox and logs:
- [ ] `DEPLOY_NOTES.md` and the site changelog updated.

Related: [admin-operations](../../reference/admin-operations.md) · [bug log](../bug-log.md) ·
[RELEASE_TEST_PLAN.md](../../../RELEASE_TEST_PLAN.md)
