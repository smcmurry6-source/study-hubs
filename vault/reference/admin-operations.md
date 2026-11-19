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

- **Views, in a sidebar:** Overview, Live, Inbox; *Study data*: Insights, Time by section, Questions, Question health
  ([question-health](question-health.md)), A/B versions (the same note), Clicks and features, Searches, Engagement; *Feedback*: Exam check-ins, Surveys; *Manage*: Hubs on the dashboard, Recap. Each is a
  link (`#overview`, `#inbox`...), so the back button and bookmarks work, and the last one opens next time.
- **One header per view:** its title, one line that says what matters (for example "2 reports waiting for a reply · 5
  people studying now"), and only the controls that apply there: the 7 / 30 / 90 day range on views that use it, the
  **Past hubs** switch on views that list hubs, when the numbers were loaded, and Refresh (which reloads that view only).
- **Each view loads only its own data, once per range**, when it first opens (`VIEWS[...].needs` and `SRC` in the page).
  The sign-in check's `get_reports` fills the Inbox count. Overview asks Live once if its copy is over 2 minutes old.
- **One read at a time** (2026-11-18): every read goes through one lane (`queued()` in the page), so the database runs one
  admin query at once and the class's answer saves keep the other core. Before, the Overview sent nine reads at once and
  Insights three, each 1 to 2 s, and students' saves timed out while the page loaded
  ([shared-infrastructure](shared-infrastructure.md), the database's size). A read the database stopped for time (anon's 3 s
  limit) is tried once more 5 s later, and its error says the database was busy, not that a migration is missing. Writes
  don't wait in the lane.
- **The heavy reads are worked out ahead** (2026-11-19, `migration_v79.sql`): Insights' three reads, Question health, the
  visitor totals (Overview, Time by section), the check-ins and Clicks and features (without a hub) come from
  `admin_cache`, one row a read (`insights`, `retries`, `quality`, `qh:<hub>`, `visitors:<days>`, `debriefs`,
  `clicks:<days>`, `features:<days>`), closed to anon. The admin functions keep their arguments, results and shape; a read
  the table doesn't have yet is worked out at once and kept. pg_cron's `sh-admin-cache` runs `sh_admin_cache_tick()` every
  minute (10 s limit): a read asked with new arguments (an edited question's fingerprint, new exam dates) or by Refresh
  at once; a read the page used in the last 2 hours every 15 minutes, **every hour while 20 or more people are studying**
  (a ping in the last 5 minutes); any read used in the last week once a night (1 to 5 am Central) if over 12 hours old.
  One read a minute while the class is busy, up to three (2 s) otherwise; a failed or timed-out one waits 10, 20, 40
  minutes... (6 hours at most); rows nobody read in 30 days are deleted, and the job's run log is kept 2 days. With nobody
  on the admin page it does nothing but the nightly refresh for a week. Question health lays the reviews and the reports'
  state over the kept copy at every read (`sh_qh_overlay`), so a review shows at once; `get_data_quality`'s retention part
  is read fresh. The page's "Updated" is when the copy was worked out (`get_admin_cache_status`); Refresh asks for new
  copies (not one under 2 minutes old), the header says "newer numbers on the way", and the page looks again every 30 s
  and redraws when they've come. Two lookups also got cheaper (`sh_surface` once a section, not once an hourly row).
  On a throwaway copy at the live size: insights 1.05 → 0.43 s to work out, data quality 0.98 → 0.37 s; read from the
  table, each read under 3 ms, question health 42 ms (the overlay) against 0.5 s.
  **To read a kept copy through the connector** (cheap at any hour): `select computed_at, body from admin_cache where key =
  'quality';`; Question health with today's reviews: `select r->>'qid' qid, r->>'state' state, (r->>'score')::int score,
  r->'flags' flags from admin_cache c, jsonb_array_elements(sh_qh_overlay('<hub>', c.body)) r where c.key = 'qh:<hub>' and
  r->>'state' in ('new', 'changed') order by score desc;`. `select key, computed_at, took_ms, fails, error from
  admin_cache order by key;` shows what's kept and how long each took.
- **Overview** answers two questions: is anything waiting on Sam (reports to answer, podcast comments reported,
  check-ins this week, studying now; each links to its view) and is the class studying (time, people, visits, per hub,
  busiest sections, hardest questions).
- **Past hubs** follow the dashboard: a hub is past when the dashboard doesn't show it live (`widget/archive.js` on the
  dashboard's own `HUBS`, overrides included). The page's own `ARCHIVED` list is only a fallback until that loads.
- **Phone:** the sidebar folds into a Menu button that opens a full-screen list (Escape closes it and returns focus);
  the Inbox stays one tap away in the top bar; buttons are 44 px; wide tables scroll inside their card and get a
  keyboard stop only when they do. **Always light**, even on a device in dark mode (Sam, 2026-11-06: dark was hard
  to read; `color-scheme: only light`, no dark styles). No new animation.

## Live: who's studying now

- **"Live" means at least one study ping in the last 3 minutes** (`admin_live_presence(p_secret, p_minutes)`, default 3,
  clamped to 1-15). A hub counts a ping for every 25 s it is on screen and in use and, since 2026-11-19, sends what it
  has counted once a minute in one call (`record_activity_pings`, each ping saved at the time it was counted; a visit's
  first ping goes at once); it stops when the tab is hidden and after 15 minutes with no input, so a forgotten tab drops
  off within 3 minutes. Three minutes leaves room for someone moving between sections, for the minute between calls and
  for a lost one; a 1-minute window would miss people between calls. The dashboard and the About page send no pings,
  so this counts people in a hub.
- **Names are the leaderboard name** (Sam, 2026-11-04): the name a student picked, otherwise their random class name
  (`get_display_name`/`anon_name`). The function returns only `{minutes, as_of, total, hubs: [{hub, people, names}]}`:
  never a visitor id, an email, a section or a time per person. Two devices linked to one person (`visitor_links`) count
  once; someone with two hubs open shows under both and once in the total. The About page doesn't mention the admin
  page (Sam, 2026-11-04: [decisions](../decisions.md)).
- **Cost:** one query over a few minutes of `activity_pings` through `activity_pings_time_idx`. The page asks every 30 s
  only while the Live view is open and the browser tab is visible, stops when either changes, and backs off (1, 2, 4,
  5 minutes) after an error. The Overview's "Studying now" reuses that answer, or asks once if it is over 2 minutes old.
  The sidebar shows no count for Live: counts there are kept for things waiting on Sam (the Inbox; Question health's "to review" for the hub last opened there).
- The green "studying now" pill students see is a different thing (Supabase Realtime presence on random keys, no names):
  it counts open hub tabs, idle ones too, so it can read higher.

## Hubs: archive overrides

Each hub's dashboard state is **live** (a tab with Start studying), **archived** or **hidden**. Since the redesign's
release an archived hub has no card (Sam, 2026-11-14: the closed hubs' cards "dont seem to be for anything"), so
archived and hidden look the same on the dashboard: no tab and no way in; the hub's open exam check-in is in the
**Exam check-ins** panel and its recap under Past hubs either way. Precedence, highest first (`shArchive.resolve` in `widget/archive.js`; the database stores only the override):

1. **An override that is in force** (`hub_archive_overrides`): set on the Hubs view to Live, Archived or Hidden. It lasts
   until Sam sets the hub back to **Automatic**, or until its optional end time; after that the dates decide again
   (Sam, 2026-11-04). The end time must be in the future and at most 400 days away.
2. **The dates in `hubs.js`** (the dashboard's hub list): `archiveOn` and `hideCardOn` if a hub has them.
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
  dashboard and a hub page checked after each change, and on a 390 px phone in dark mode the page staying light, the menu
  (focus, Escape, 44 px) and no sideways scroll. `node tools/release/run.js` runs it as `adminui`.

## Deploying

The migration was applied to the live project on
2026-11-05 after Sam approved the release in writing. Either order was safe: before the migration, the dashboard and hubs keep using
the dates, and the Live and Hubs views say they need migration_v50. (It was numbered v49 until #237's analytics layer
took that number on main.)

Related: [shared-infrastructure](shared-infrastructure.md) · [repo-map](repo-map.md) ·
[read-usage-data](../how-to/read-usage-data.md) · [archiving-is-a-retrospective](../rules/archiving-is-a-retrospective.md) ·
[decisions](../decisions.md)
