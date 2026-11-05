-- Analytics data quality and cross-hub insights (Supabase connector, execute_sql, read-only).
-- What each check means and what to do about it: vault/reference/analytics-data-quality.md.
-- The cards that use these: vault/reference/insights-dashboard.md (admin page review/ -> Insights).
-- Results are about the class: only totals over 5+ people go into the repo (vault/rules/learner-data-privacy.md).

-- 1. Data quality: tracking alive, test rows, unmapped sections, new or quiet event families, double-counted time,
--    linked devices, answers with no recorded pick, class counters vs personal rows, storage against 500 MB.
select sh_data_quality();

-- 2. Every hub side by side. Pass each hub's most recent exam date from HUBS / ARCHIVED_HUBS in index.html
--    (the "last 3 days" share needs it). Example from 2026-11-04:
select sh_insights('{"hepatobiliary":"2026-09-18","perio":"2026-10-01","msk-exam3":"2026-10-02","pcd-exam3":"2026-10-15",
  "msk-exam4":"2026-10-16","occlusion":"2026-10-21","heme-endo-exam1":"2026-10-30","pcd-implants-exam1":"2026-11-06",
  "special-patient-care":"2026-11-13"}');
-- one compact row per hub from it:
with i as (select sh_insights('{}') j)
select x->>'hub' hub, (x->>'people')::int people,
  round(100.0 * (x->>'answerers')::int / (x->>'people')::int) answered_pct,
  round(100.0 * (x->>'under_5')::int / (x->>'people')::int) under_5_pct,
  round(100.0 * (x->>'three_days')::int / (x->>'people')::int) three_days_pct,
  x->>'median_mins' median_mins, x->>'median_answers' median_answers, x->>'last3_pct' last3_pct
from i, jsonb_array_elements(i.j->'hubs') x order by (x->>'total_mins')::numeric desc;

-- 3. Re-answers by the time since the person's previous try (spacing), and per hub first-try accuracy.
select sh_insight_retries();

-- 4. Sections as each hub names them, next to the canonical surface sh_surface() gives them.
select section, sh_surface(section) surface, string_agg(distinct hub, ', ') hubs, sum(n) * 25 / 60 mins
from activity_hourly group by 1 order by 4 desc;

-- 5. Checks that need the hubs' banks (not in the database). Locally:
--      node tools/dump-banks.js /tmp/banks
--      fetch question_stats (public read) or save the lessons-audit "stats" query, then
--      python3 tools/lessons-join.py /tmp/banks stats.json [hub ...]
--    prints accuracy by lecture, type, format (tf, 2stmt, numbered, except, mcq, multi, match, sequence) and source, and the
--    stats rows whose question id is no longer in the bank (renamed or removed questions).

-- 6. Index use on the big tables (an index nobody reads is storage the free plan pays for).
select relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) size
from pg_stat_user_indexes where relname in ('activity_pings', 'personal_answers', 'xp_seen', 'ui_click_reach', 'feature_events')
order by pg_relation_size(indexrelid) desc;

-- 7. Retention (migration_v52, vault/reference/analytics-retention.md): the weekly job's schedule and its last runs
--    (what each removed, the database size then), and what a run would remove now (counts only, nothing is deleted).
select sh_retention_status();
select sh_retention_run();
