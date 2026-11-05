---
type: reference
tags: [admin, dashboard, supabase, privacy, archive]
---

# Admin operations: the admin page, who's studying now, hub archive overrides, newest-first check-ins

The admin page (`review/`, opened with the admin passphrase) and three parts of it added on 2026-11-04 by
`migration_v50.sql`, with Sam's calls in [decisions](../decisions.md). The functions are in `supabase/schema.sql`; the code
is `review/index.html`, `widget/archive.js` (the archive rules, shared by the dashboard, the hubs and the admin page),
`index.html` (the dashboard) and `widget/v3.js` (a hub's "This hub is archived" notice). The Insights view has its own
note: [insights-dashboard](insights-dashboard.md).

## The page

Redesigned on 2026-11-04 when Sam asked for "a full optimization of the admin page" (it was clunky: ten tabs in a strip
that scrolled sideways on a phone, 18 queries fired at once on every load, check-ins, searches and surveys mixed in one
tab). Built with the taste-skill's app-screen run (its "framed sheet" style, kept to the dashboard's face: Instrument Sans,
its ink and blue-grey, each hub's class color as a dot).

- **Views, in a sidebar:** Overview, Live, Inbox; *Study data*: Insights, Time by section, Questions, Clicks and
  features, Searches, Engagement; *Feedback*: Exam check-ins, Surveys; *Manage*: Hubs on the dashboard, Recap. Each is a
  link (`#overview`, `#inbox`...), so the back button and bookmarks work, and the last one opens next time.
- **One header per view:** its title, one line that says what matters (for example "2 reports waiting for a reply · 5
  people studying now"), and only the controls that apply there: the 7 / 30 / 90 day range on views that use it, the
  **Past hubs** switch on views that list hubs, when the numbers were loaded, and Refresh (which reloads that view only).
- **Each view loads only its own data, once per range**, when it first opens (`VIEWS[...].needs` and `SRC` in the page).
  The sign-in check's `get_reports` fills the Inbox count. Overview asks Live once if its copy is over 2 minutes old.
- **Overview** answers two questions: is anything waiting on Sam (reports to answer, podcast comments reported,
  check-ins this week, studying now; each links to its view) and is the class studying (time, people, visits, per hub,
  busiest sections, hardest questions).
- **Past hubs** follow the dashboard: a hub is past when the dashboard doesn't show it live (`widget/archive.js` on the
  dashboard's own `HUBS`, overrides included). The page's own `ARCHIVED` list is only a fallback until that loads.
- **Phone:** the sidebar folds into a Menu button that opens a full-screen list (Escape closes it and returns focus);
  the Inbox stays one tap away in the top bar; buttons are 44 px; wide tables scroll inside their card and get a
  keyboard stop only when they do. Dark mode follows the device. No new animation.

## Live: who's studying now

- **"Live" means at least one study ping in the last 3 minutes** (`admin_live_presence(p_secret, p_minutes)`, default 3,
  clamped to 1-15). A hub sends a ping (`record_activity_ping`) for every 25 s it is on screen and in use; it stops when
  the tab is hidden and after 15 minutes with no input, so a forgotten tab drops off within 3 minutes. Three minutes
  leaves room for someone moving between sections and for a lost ping. The dashboard and the About page send no pings,
  so this counts people in a hub.
- **Names are the leaderboard name** (Sam, 2026-11-04): the name a student picked, otherwise their random class name
  (`get_display_name`/`anon_name`). The function returns only `{minutes, as_of, total, hubs: [{hub, people, names}]}`:
  never a visitor id, an email, a section or a time per person. Two devices linked to one person (`visitor_links`) count
  once; someone with two hubs open shows under both and once in the total. The About page doesn't mention the admin
  page (Sam, 2026-11-04: [decisions](../decisions.md)).
- **Cost:** one query over a few minutes of `activity_pings` through `activity_pings_time_idx`. The page asks every 30 s
  only while the Live view is open and the browser tab is visible, stops when either changes, and backs off (1, 2, 4,
  5 minutes) after an error. The Overview's "Studying now" reuses that answer, or asks once if it is over 2 minutes old.
  The sidebar shows no count for Live: counts there are kept for things waiting on Sam (the Inbox).
- The green "studying now" pill students see is a different thing (Supabase Realtime presence on random keys, no names):
  it counts open hub tabs, idle ones too, so it can read higher.

## Hubs: archive overrides

Each hub's dashboard state is **live** (card with Open), **archived** (greyed card, no Open button) or **hidden** (no
card). Precedence, highest first (`shArchive.resolve` in `widget/archive.js`; the database stores only the override):

1. **An override that is in force** (`hub_archive_overrides`): set on the Hubs view to Live, Archived or Hidden. It lasts
   until Sam sets the hub back to **Automatic**, or until its optional end time; after that the dates decide again
   (Sam, 2026-11-04). The end time must be in the future and at most 400 days away.
2. **The dates in `HUBS`** in `index.html`: `archiveOn` and `hideCardOn` if a hub has them.
3. **The exam dates**: archived at `ARCHIVE_HOUR` (10 pm) on the last exam day, hidden `CARD_DAYS` (10) days later. A hub
   listed in `ARCHIVED_HUBS` starts archived.

An override changes only what the dashboard shows and whether a hub's page says it's archived. **It never deletes or moves
anything:** the hub's folder, its direct link, its questions, analytics, everyone's progress and streaks stay; check-ins
still follow the exam dates. A hub whose folder was removed can't be set to Live (the Hubs view checks the page first).

- **Who reads it:** the dashboard and every hub call public `get_hub_overrides()` (hub, state, end time of the overrides
  in force; no notes) and keep a copy in `localStorage` (`sh_hub_overrides`, 7 days), so an offline visit keeps the last
  state. If the call fails (before the migration, or offline) they fall back to that copy, then to the dates.
- **Who writes it:** only `admin_set_hub_archive(p_secret, p_hub, p_state, p_until, p_note, p_expect)`, behind the
  passphrase. The tables have RLS on, no policies and no grants to `anon`/`authenticated`.
- **Confirmation:** every change (Back to automatic included) shows what will change and what stays, and waits for
  Confirm. Escape or Go back cancels.
- **Audit trail:** every change writes a `hub_archive_log` row in the same transaction (old and new state and end time,
  the note, when); the Hubs view lists it newest first (`admin_hub_archive_log`). The passphrase is shared, so the log
  can't say who; the note can.
- **Two tabs at once:** the page sends back the version it saw (`p_expect`); if the override changed since, the server
  refuses (SQLSTATE 40001) and the page reloads and says so, instead of overwriting.

## Check-ins and surveys: newest first

`get_exam_debriefs` and `get_survey_results` return rows by `created_at` descending with `id` as the tie-breaker. The
Exam check-ins view sorts its groups (one per hub and exam) by their newest check-in, never by hub name, and the rows in
each group newest first; the Surveys view lists surveys newest first. `get_exam_debriefs` keeps the `activity_hourly` version applied on 2026-10-30 (PR #205's change,
which never merged; `supabase/schema.sql` now matches the live function).

## Testing it

- `node tools/release/admin-ops.js`: the functions on a throwaway PostgreSQL built from `supabase/schema.sql`
  (`tools/release/pg.js`): passphrase checks, no ids in the live view, linked devices, the clamps, table access denied,
  validation, end times, reversal, the version conflict, the log and the sort orders with ties. Runs in CI.
- `node tools/ci/archive.js`: `widget/archive.js` against a frozen copy of the dashboard's old date rules, hour by hour
  for every hub, plus the override cases. Runs in CI.
- `node tools/release/admin-ui.js`: the whole page in the preview as the admin test account (fixtures for every view in
  `tools/preview/runtime/preview.js`): every view opens with its title, no error and its own address, the Overview loads
  only its own data, the back button, check-ins and surveys newest first, Live's polling, the Hubs flows with the
  dashboard and a hub page checked after each change, and on a 390 px phone in dark mode the menu (focus, Escape, 44 px)
  and no sideways scroll. `node tools/release/run.js` runs it as `adminui`.

## Deploying

The migration is tier 3 ([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md)): it is applied to the live project only
after Sam approves the release in writing. Either order is safe: before the migration, the dashboard and hubs keep using
the dates, and the Live and Hubs views say they need migration_v50. (It was numbered v49 until #237's analytics layer
took that number on main.)

Related: [shared-infrastructure](shared-infrastructure.md) · [repo-map](repo-map.md) ·
[read-usage-data](../how-to/read-usage-data.md) · [archiving-is-a-retrospective](../rules/archiving-is-a-retrospective.md) ·
[decisions](../decisions.md)
