---
type: reference
tags: [analytics, dashboard, admin]
---

# Insights dashboard: aggregate behavior turned into decisions

The **Insights** tab of the admin page (`review/`, behind the admin secret) puts every hub, live and archived, side by side
and pairs each number with the decision it drives. A number past its threshold turns orange and the card lists what to do.
Part of [analytics governance](analytics-governance.md).

- **Data**: `get_insights(p_secret, p_exams)`, `get_insight_retries(p_secret)`, `get_data_quality(p_secret)`
  (`migration_v49.sql`). Agents on the Supabase connector call the same logic without the secret:
  `select sh_insights('{"<hub>":"YYYY-MM-DD", ...}')`, `select sh_insight_retries()`, `select sh_data_quality()`.
- **Exam dates and live/archived status** come from `HUBS` / `ARCHIVED_HUBS` in `index.html`, read by the admin page at
  load (the one place they live); `p_exams` is each hub's most recent exam.
- **Thresholds** are `INSIGHT_RULES` in `review/index.html`. The table below explains them: change both together.
- **In a preview** ([preview-a-change](../how-to/preview-a-change.md)) the tab shows made-up numbers from `synthInsights()` in
  `tools/preview/runtime/preview.js`, shaped like the real responses; when the functions' output changes, change it too.
- **Small hubs are left out**: a hub or page with fewer than 5 people (`minPeople`) is dropped from every card and named
  once under the scorecard (Genetics and GI Exam 1 were removed early with 1-2 people each); their percentages are
  noise, and 5 is the [privacy](../rules/learner-data-privacy.md) floor. A hub's share of retries of right answers is
  flagged only past 20 retries (`minRetries`).
- All time, per hub. Time reads `activity_hourly` (one ping = 25 s), answers read `personal_answers`; caveats in
  [analytics-data-quality](analytics-data-quality.md).

## The cards

| Card | Metric (per hub) | Flag when | Decision it drives |
|---|---|---|---|
| Scorecard: Answered | people who answered at least one question ÷ people | under 60% | Put a question one tap from where people land (Home's quick-start row); check the hub opens on Home |
| Scorecard: Under 5 min | people with under 5 minutes in the hub ÷ people | over 30% | The landing view gets someone to a question or the notes in one tap |
| Scorecard: 3+ days | people who studied on 3 or more days ÷ people (once the exam has passed) | under 30% | Have every lecture in the hub about 4 days out; bring people back with the Daily Drill and "Where to next" |
| Scorecard: Last 3 days | minutes on exam day and the 2 days before ÷ minutes up to the exam | over 75% | The night-before tools (cram sheet, hints, mock, Timmy Time) carry the hub: check them first, ship content early |
| Scorecard: Median answers | median answers per person (once the exam has passed) | under 25 | People read without practicing: put practice inside the notes and on Home |
| Scorecard: First try, Took a mock | first-try accuracy; mock takers ÷ answerers | (context) | Hard hubs need more explanation work; mock reach shows whether the mock is worth its build time |
| Where time goes | each surface's share of a hub's minutes (`sh_surface()`), and its reach | reach under 15% in every hub that has it (3+ hubs) | Make it easier to find, fold it into notes or bank, or stop building it for new hubs; check [decisions](../decisions.md) first (Search stays by Sam's call) |
| Spacing | accuracy of re-answers by time since the person's previous try, after a miss and after a right answer | a miss retried within 10 min beats one retried a day later by over 10 points | Count a miss as fixed only when it's right on a later day; put yesterday's misses first in the drill and on Home |
| Spacing: retries of right answers | re-answers of questions the person already had right ÷ all re-answers | over 50% | Point the bank's default view and the drill at unanswered and missed questions |
| Features | per page: tour started ÷ shown (the card's total counts a person once per page, so someone asked on two pages counts twice); podcast 95% heard ÷ played; Listen, figures, highlighter, pins, Find in notes, mind maps, Timmy Tooth off (2026-10-20 on) | tour under 20%; podcast under 40% | Tour: stop asking on arrival, offer it from the menu. Podcast: chapters by lecture, highest-yield first |
| Student voice | reports open, replied, median hours to resolve; check-ins ÷ the hub's people; respondents' median minutes ÷ the hub's | any open; check-ins under 20% of people; respondents over 2× the median | Answer open reports; read check-ins as heavy users' view, next to the use data |
| Data quality | the checks in [analytics-data-quality](analytics-data-quality.md), storage against the 500 MB free plan | database over 350 MB or under 12 weeks of growth left | Fix the tracking, or run the [retention](analytics-retention.md) schedule once Sam approves it |

## First reading: all hubs, 2026-11-04

Totals over every hub with tracked data (all groups are 12 people or more). PCD Implants' exam is Nov 6 and Special Patient
Care's window opens Nov 6, so their return and cramming numbers aren't in yet.

| Hub (exam) | People | Answered | Under 5 min | 3+ days | Median time | Median answers | Last 3 days | First try | Retries of right answers | Miss retried <10 min / 1+ day |
|---|---|---|---|---|---|---|---|---|---|---|
| GI 2 `hepatobiliary` (09-18) | 77 | 68% | 40% | 35% | 29 min | 50 | 71% | 78% | 62% | 45% / 78% |
| Perio midterm `perio` (10-01) | 126 | 61% | 40% | 32% | 33 min | 21 | 76% | 79% | 71% | 69% / 73% |
| MSK 3 (10-02) | 86 | 78% | 27% | 40% | 57 min | 58 | 65% | 76% | 70% | 87% / 67% |
| PCD 3 (10-15) | 90 | 80% | 24% | 42% | 80 min | 50 | 76% | 81% | 68% | 94% / 80% |
| MSK 4 (10-16) | 99 | 43% | 41% | 26% | 15 min | 0 | 83% | 74% | 55% | 88% / 67% |
| Occlusion midterm (10-21) | 110 | 76% | 13% | 50% | 143 min | 109 | 90% | 80% | 54% | 90% / 79% |
| Heme & Endo 1 (10-30) | 92 | 73% | 13% | 54% | 183 min | 129 | 89% | 78% | 40% | 94% / 77% |
| PCD Implants 1 (11-06, live) | 59 | 63% | 14% | (live) | 57 min | 20 | (live) | 86% | 29% | 96% / (too few) |
| Special Patient Care (11-13, live) | 12 | 25% | 67% | (live) | 2 min | 0 | (live) | (too few) | | |

What it says, across hubs:
1. **The newer hubs hold people far better.** Under-5-minute visitors fell from 24-41% (to MSK 4) to 13-14% (Occlusion,
   Heme & Endo, PCD Implants), median time rose from 15-80 to 143-183 minutes, and 50-54% studied on 3+ days, against 26-42%.
   Many things changed at once (bigger banks, Home pages from 10-27, a class that knows the site), so don't credit one
   feature; and part of the older bounce is automated browsers before 10-15 ([data quality](analytics-data-quality.md)
   caveat 3).
2. **Cramming is getting stronger, not weaker**: 65-76% of pre-exam time came in the last 3 days for the hubs up to PCD 3,
   83-90% for the last three archived. More of the hub's value lands on the eve, so its last-minute tools matter most.
3. **A retry soon after a miss says little.** Across hubs a miss re-asked within 10 minutes is right 87% of the time, 1-3
   days later 75%, 3+ days later 69% (LESSONS has the same finding from 10-27). Readiness and mastery that count the quick
   retry overstate what stuck.
4. **Less practice is wasted on questions already known**: re-answers of questions already right fell from 62-71% of all
   retries (GI 2, perio, MSK 3) to 40% (Heme & Endo) and 29% (PCD Implants) as "Missed last time", Weak Spots and "Try it
   again" arrived. Keep pointing practice at misses.
5. **Formats** (8 hubs' banks against all attempts, retries included): ordering 58%, select-all 67%, two-statement 74%,
   matching 77%, numbered 78%, EXCEPT 81%, plain MCQ 83%, true/false 86%, recall 93%. Fewer of the newer formats have been
   tried at all (53-60% of two-statement, true/false and numbered items vs 83% of plain MCQs), partly because many were
   added recently.
6. **Onboarding prompts are declined**: of 97 people shown the dashboard tour and 118 shown a hub tour, 12 and 11 started
   (12% and 9%); 8 and 9 finished. People who start it finish it.
7. **Timmy Time is heard in part**: Occlusion's episode was played by 19 people and heard to 95% by 6 (32%); Heme & Endo's
   by 9 and 2.
8. **Extras stay niche**: Listen 12 people in all, highlighter 21, mind maps 12, pins 9 (since 11-02), while bank + notes are
   70-96% of every hub's time. The mock reached 3-39% of answerers where mocks were recorded.
9. **The check-in voice is the heavy users' voice**: respondents' median time is several times the hub's (GI 2: 177 vs 29
   minutes); surveys: 169 of 190 people shown one said "No thanks".
10. **Storage is the nearest hard limit**: 217 of 500 MB, about 7 exam weeks of growth left ([retention](analytics-retention.md)).

## Proposed decisions for Sam (from the first reading)

None of these is shipped; each needs Sam's call, then becomes a task note.
- **Readiness counts delayed wins.** Home's readiness, Weak Spots and mastery treat a missed question as fixed only when
  it's answered right on a later day (insight 3).
- **Tours on request.** Stop the arrival prompt for the dashboard and hub tours; keep them in the menu, add one-line tips
  where a feature is first used (insight 6).
- **Chapters in Timmy Time**, one per lecture, so people can jump (insight 7).
- **Practice the hard formats**: the Daily Drill and the mock take a fixed share of two-statement, select-all and
  ordering items when the exam uses them (insight 5).
- **Retention schedule and the two quick wins** in [analytics-retention](analytics-retention.md) (insight 10).

Related: [analytics-governance](analytics-governance.md) · [event-taxonomy](event-taxonomy.md) ·
[read-usage-data](../how-to/read-usage-data.md) · `LESSONS.md`
