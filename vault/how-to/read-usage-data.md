---
type: how-to
tags: [data]
---

# Read usage data and run surveys

Start with the admin page's **Insights** tab, or the same on the connector: `select sh_data_quality();` (is the data
sound?), `select sh_insights('{"<hub>":"<last exam date>"}');` and `select sh_insight_retries();` (every hub side by side,
with the decision each number drives: [insights-dashboard](../reference/insights-dashboard.md)). What every table and event
means: [event-taxonomy](../reference/event-taxonomy.md); what to correct for: [analytics-data-quality](../reference/analytics-data-quality.md);
what may be written down: [learner-data-privacy](../rules/learner-data-privacy.md) (totals over 5+ people, no visitor ids).

To decide what to improve or cut, read the data before guessing (Supabase connector, read-only SQL):
`activity_pings` (time per `<mode>/<sub-view>`, 25 s per ping), `ui_clicks` + `ui_click_reach` (clicks per
button/tab and distinct people, per day), `question_stats` / `question_choices` (accuracy, popular wrong answers),
`mode_stats`, `exam_debriefs` (post-exam check-ins), `search_terms` (what people searched for, with result
counts), `podcast_reactions` / `podcast_comments` (Timmy Time likes, dislikes and comments, migration_v47) and `feature_events` (from 2026-10-20: page loads, a daily settings snapshot, easter eggs, Timmy Tooth's intro,
podcast and Listen minutes and progress, diagrams; per day, page, kind and person). When you ship something a click
can't measure, add a `window.shTrack("<area>:<what>")` call for it. The admin page (`review/`) shows the same under Time by section, Clicks and Questions.
Surveys: one live at a time on the dashboard, shown once per visitor. Publish from `review/` → Surveys, or
`admin_upsert_survey(p_secret, p_slug, p_title, p_questions, p_active)` with 1-3 questions
(`kind`: choice | multi | scale | text). Results: `get_survey_results(p_secret)`. Ask Sam before a survey goes live.
