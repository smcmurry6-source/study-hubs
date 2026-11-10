---
type: reference
tags: [analytics, supabase, data-quality]
---

# Analytics data quality: what to trust, what to correct for

The known problems in the tracked data, how big each one is, and what to do about it when you read a number. Part of
[analytics governance](analytics-governance.md); the tables and names are in [event-taxonomy](event-taxonomy.md).
Numbers are from the first full audit, 2026-11-04 (all current and archived hubs). **Rerun the checks rather than
trusting these figures**: `select sh_data_quality();` on the Supabase connector, or the Data quality card in the admin
page's Insights tab (`review/`); the local checks are in `tools/analytics-quality.sql`.

## Checks that run every time (the Insights tab, `sh_data_quality()`)

| Check | What it catches | 2026-11-04 | If it fires |
|---|---|---|---|
| Tracking alive | answers, clicks or events stopped while pings keep arriving: writes fail silently by design | all writing today | Find the widget code or grant that broke; nothing tells a student |
| Test data | rows from hubs starting `zz-` or with no hub | 3 rows in `feature_events` (`zz-test`, 10-20) | Already left out of every read; the weekly retention job deletes them (the 3 went on 2026-11-05) |
| Sections `sh_surface()` can't place | a new mode or sub-view, or a hub that sends no section | historical only: `hepatobiliary` 28,775 pings and `gi-exam1` 7 with none, `compendium` with no sub-view (perio, MSK 3, genetics) | Recent ones: add the name to `sh_surface()` in a migration |
| New event families | an `shTrack` family nobody documented | none new | Add its row to [event-taxonomy](event-taxonomy.md) |
| Families gone quiet | a family that stopped firing | (watch after a feature changes) | Retired feature, or tracking that broke |
| Time counted twice | over 60 min of pings from one id in one hour (two hubs visible side by side) | 9 visitor-hours, 34 extra minutes of ~2,000 h | Negligible; subtract if a hub looks inflated |
| Devices and people | ids vs linked ids; writes from an id after it was linked | 285 ids, 18 linked, 0 late writes | "People" means devices everywhere |
| Answers with no recorded pick | questions answered 20+ times with no `question_choices` rows | `hepatobiliary` 238 of 238 (before `record_choice`), perio 22, PCD 3 20, MSK 4 17, MSK 3 14, live hubs 2-3 each | On a live hub: the question type isn't sending `choice`/`picks` |
| Class counters vs personal rows | `question_stats` and `personal_answers` disagree | agree within 3 per hub | One of the two answer calls is failing |
| Storage | database size and weekly growth against the free plan's 500 MB | 217 MB; ~39 MB a week in exam weeks; ~7 weeks of headroom (200 MB after the first retention run, 2026-11-05) | [analytics-retention](analytics-retention.md). Growth comes from the last two retention runs' sizes once there are two; before that it's last week's writes, an upper bound now that old raw pings are deleted weekly |
| Retention | the weekly job's last run, what it removed, its schedule (`sh_retention_status()`) | (from 2026-11-05) | Flagged when the job is missing or skipped a week: check `cron.job_run_details`, run `select sh_retention_run(true);` by hand |

## Standing caveats (read before quoting a number)

1. **A person is a browser.** Phone + laptop = two people unless linked, so reach is overstated and minutes or answers
   per person are understated. Treat "people" as an upper bound.
2. **Study time before 2026-09-25 has no idle rule**: a tab left open counted. Affects `hepatobiliary`, `genetics`,
   `gi-exam1` and perio's first two weeks; compare their minutes with later hubs only loosely. The recap used to count
   only the first 3 hours of each such visit; that needed raw pings, which the retention job deleted on 2026-11-05. Only
   Hepatobiliary had longer visits (14 of them, 1,792 minutes): its published recap keeps 10,198 minutes, while a recap
   made now and the Insights tab say 11,990. Don't republish its recap.
3. **Automated browsers counted before 2026-10-15** (screenshot and test sessions against the live site): extra one-visit
   "people" who bounce. Bounce rates for hubs before that date are inflated.
4. **Coverage starts at different dates.** Answers 09-08, pings 09-12, sections 09-23 (perio, MSK 3 on), clicks 09-25,
   reports with a visitor id 09-29, search terms 09-29, feature events 10-20. A hub archived before a source started has
   none of it: MSK 3, GI 2 and perio's midterm have no feature events, and PCD 3 and MSK 4 have almost none (archived 10-15
   and 10-16). The Insights tab prints each page's "since".
5. **Section names differ by hub.** Never compare raw sections across hubs; use `sh_surface(section)`.
6. **`question_stats` counts every try, retries included.** Class accuracy there is higher than first-try accuracy
   (Heme & Endo 78% first try vs 82% overall), and a question people retry a lot looks easier than it is. For "how hard is
   it", use first tries (`sh_insight_retries()`, `by_hub.first_ok / first_tries`).
7. **A re-answer within minutes is not learning.** After a miss, a retry under 10 minutes is right 87% of the time, a day
   or more later 69-75%. Readiness and mastery that count same-session retries overstate what stuck (see
   [insights-dashboard](insights-dashboard.md)).
8. **Choice indexes are the authored order**, 0 = the key, not what the student saw (choices shuffle). Changing a
   question's choices makes its old `question_choices` rows point at the wrong options: say so in the PR.
9. **Question ids must stay stable.** Stats live under the id; a renamed id starts from zero and the old row becomes an
   orphan. 2026-11-04: MSK 4 has 31 orphan rows (the removed clinical-application cases, `ca-*`, removed on purpose),
   MSK 3 23, PCD 3 4, PCD Implants 2, Heme & Endo 1. `tools/lessons-join.py` lists them per hub.
10. **Check-ins come from heavy users.** Every hub's respondents studied several times the hub's median (GI 2: 177 vs 29
    minutes); 92 check-ins over 7 exams. Read "About right" as the view of people who used the hub a lot, never as the
    class's verdict; the light users who bounced are not in it.
11. **Surveys are mostly declined**: 169 of 190 responses were "No thanks". A survey result is a handful of people.
12. **Search terms are thin**: 8 rows ever. Only the widget's Search logs terms; the Question Bank search box (`bank:search`)
    and "Find this in the notes" (`notes-jump:*`) count use but not what was typed, so missing content mostly surfaces
    through reports and check-ins instead.
13. **`mode_stats` has no dates** (an all-time counter), and `search_terms.hits` keeps only the last result count.
14. **Duplicate answer events are rare**: 11 pairs of the same answer within 2 seconds in 120k answers. Ignore.
15. **Days are Central time** in `day` columns and in every query here; `*_at` columns are UTC.
16. **A mock ended early counts as a full one.** `record_mock_score` stores the mock's full total, so finishing after a few
    questions saves, say, 3 of 40. PCD Implants' four exam-day mocks of 1-5 out of 40 took its stored average from about 86% to 75%
    (lessons audit, 2026-11-10). Drop the ones far below the person's other scores before quoting a mock average.
17. **Cleared class counters make `question_stats` run behind `personal_answers`.** When Sam OKs clearing a changed question's
    class numbers (a rewritten statement, a re-keyed select-all), its `question_stats` row restarts and the personal rows stay, so
    the "class counters vs personal rows" check fires: PCD Implants was 480 behind on 2026-11-10, all on the items rewritten
    11-04 and `tm-mm-2` (11-05). Check the per-question gap before calling it a tracking fault.

## Fixed or handled

- Test hub rows and blank hubs: excluded in `sh_insights()`, `sh_insight_retries()` and `sh_data_quality()` (v49).
- The admin page's own list of archived hubs had fallen behind (it showed MSK 3, MSK 4, PCD 3 and Heme & Endo as live):
  it now reads hub status and exam dates from `HUBS` / `ARCHIVED_HUBS` in `index.html` (2026-11-04).
- Automated browsers (10-15), the idle rule (09-25), select-all picks for Occlusion-engine hubs (11-04): see the change log.

Related: [analytics-governance](analytics-governance.md) · [event-taxonomy](event-taxonomy.md) ·
[insights-dashboard](insights-dashboard.md) · [analytics-retention](analytics-retention.md)
