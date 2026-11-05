---
type: reference
tags: [analytics, governance, supabase, privacy]
---

# Analytics governance

How the study hubs' usage data is collected, named, checked, kept, protected and turned into decisions. Start here
before adding tracking, reading class data or changing what the admin page shows. Set up 2026-11-04 from all current and
archived hub data.

## Why we measure

To decide what to build, fix, cut and when to ship it, for the class as a whole: which parts of a hub get used, where
people get stuck, which questions mislead, whether a change worked. **Never** to judge, grade or single out a student
([learner-data-privacy](../rules/learner-data-privacy.md)).

## The layers

1. **Collection** (in the browser): `widget/v3.js` (time pings, answers, picks, search, modes), `widget/clicks.js` (clicks
   and `window.shTrack` feature events), `index.html` (check-ins, surveys, dashboard events), and the other widget files
   for their own features. Automated browsers send nothing; writes fail silently so a student never sees an error.
2. **Write functions**: `record_*` and friends in Supabase, `security definer`, with size limits on every argument. Tables
   have row-level security; per-person tables have no public read.
3. **Storage**: raw tables plus rollups kept by triggers (`activity_hourly`, `activity_visits`, `xp_*`). What each table
   holds and how names are built: [event-taxonomy](event-taxonomy.md).
4. **Read side**: admin functions behind `sh_admin_ok(p_secret)` (`get_*`) for the admin page; the same logic as `sh_*`
   functions for agents on the Supabase connector (no secret there, revoked from the public roles). The cross-hub ones are
   in `migration_v49.sql`: `sh_surface()`, `sh_insights()`, `sh_insight_retries()`, `sh_data_quality()`.
5. **Dashboards**: the admin page `review/` (Sam only). Its **Insights** tab is the decision layer:
   [insights-dashboard](insights-dashboard.md). The other tabs (Time by section, Questions, Clicks, Engagement, Surveys,
   Recap, Inbox) are the detail behind it.
6. **Decisions and memory**: what the data taught goes in `LESSONS.md` (lessons audit, retrospectives); what Sam decided goes
   in [decisions](../decisions.md); work it leads to becomes a task note.

## The notes

| Note | Holds |
|---|---|
| [event-taxonomy](event-taxonomy.md) | every table and event family, its grain, emitter and start date; naming rules for sections, click targets and event kinds; how to add tracking |
| [analytics-data-quality](analytics-data-quality.md) | the automatic checks, the standing caveats (people are browsers, coverage dates, retries in accuracy, check-in bias), what's been fixed |
| [analytics-retention](analytics-retention.md) | what's kept and for how long (in force since 2026-11-05: a weekly job), how to check it, storage against the free plan |
| [learner-data-privacy](../rules/learner-data-privacy.md) | the rule: per-person data stays in the database, groups of 5+, no new identifiers, read-only by default |
| [insights-dashboard](insights-dashboard.md) | the Insights tab's cards, thresholds and decisions, and the first cross-hub reading |
| [read-usage-data](../how-to/read-usage-data.md) | how to query it (tables, admin page, surveys) |

## Who does what

- **Sam** owns the data and the admin secret, approves surveys, notices, deletions and any new kind of tracking that
  students wouldn't expect, and makes the calls the Insights tab proposes.
- **Agents** read through the Supabase connector with read-only SQL (`sh_*` functions, `tools/*.sql`), write findings to
  `LESSONS.md` and the vault, and ship schema changes only as a migration in a PR (`apply_migration` is pre-approved for
  Claude Code; read-only functions may be applied before merge, anything that changes or deletes rows waits for Sam).
- **Students** are the data subjects: the About page's "What the hubs record" tells them what's kept.

## Routines

- **Every lessons audit** (`/lessons-audit`, `tools/lessons-refresh.md`): run `select sh_data_quality();` first and act
  on anything flagged; read the Insights tab's numbers for the live hubs.
- **Every hub archive** (`tools/retro.sql`): add the hub's scorecard line from `sh_insights()` to its retrospective.
- **Every new tracked thing**: the checklist at the end of [event-taxonomy](event-taxonomy.md).
- **Every schema change**: refresh `supabase/schema.sql`, and keep each admin function under the API's 3-second limit for
  the anon role (measure with `explain analyze` on the connector; the first call after a quiet spell is slower).

Related: [shared-infrastructure](shared-infrastructure.md) · [repo-map](repo-map.md) · [secrets](../rules/secrets.md)
