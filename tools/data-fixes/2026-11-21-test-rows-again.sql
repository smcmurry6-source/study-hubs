-- BUG-192's re-run of 2026-11-21: tools/data-fixes/2026-11-19-test-runs.sql and 2026-11-20-quiet-test-rows.sql once more, as one
-- file so the After merge workflow runs it (Sam's "merge" is the OK; Sam, 2026-11-20: "Lets do all the remaining items").
-- Why a new file: both are safe to run twice, but the session doing the re-run couldn't answer the connector's "are you sure?"
-- (its Supabase tools are named by id, which .claude/hooks/supabase-confirm.js misses: the inbox), and the workflow runs only
-- a data fix a PR adds. The bodies are the two files' own, unchanged, in one transaction, each statement under 5 s.
-- Counted first, 2026-11-21 morning, each query alone: the test-runs selection finds 1 visitor (Heme & Endo Exam 3, dated
-- 11-19, exactly the smoke check's 9 click targets and 22 feature-event rows; none on 11-20 or 11-21), and there are 22 `pq-`
-- rows in question_events, all Review of Systems, ctx mock, 11 visitors, 2026-11-20 5:22 pm to 10:06 pm Central: today's
-- tools/ci/quiet.js still leaks (BUG-197), so more may have come by the time this runs; the delete takes whatever is there.
-- Safe to run again: both parts select what is still there.
begin;
set local statement_timeout = '5s';
create temp table sh_test_runs on commit drop as
select r.day, r.hub, r.visitor_id
from ui_click_reach r
where r.day >= '2026-11-19' and r.target = 'Walk away with $#'
  and not exists (select 1 from ui_click_reach o where o.visitor_id = r.visitor_id and o.day = r.day and o.hub = r.hub
                  and o.target not in ('pod=play', 'game=sort', 'game=smile', 'ARCADE', 'START', 'LET''S PLAY', 'ms=#', 'PLAY AGAIN', 'Walk away with $#'))
  and not exists (select 1 from activity_hourly a where a.visitor_id = r.visitor_id)
  and not exists (select 1 from personal_answers p where p.visitor_id = r.visitor_id);

with n as (select day, hub, count(*) n from sh_test_runs group by 1, 2),
     per(section, target, k) as (values
       ('arcade/lobby', 'game=smile', 1), ('arcade/lobby', 'game=sort', 1),
       ('arcade/smile', 'ARCADE', 1), ('arcade/smile', 'LET''S PLAY', 1), ('arcade/smile', 'ms=#', 2),
       ('arcade/smile', 'PLAY AGAIN', 1), ('arcade/smile', 'Walk away with $#', 1),
       ('arcade/sort', 'ARCADE', 1), ('arcade/sort', 'START', 1),
       ('more/timmy', 'pod=play', 1))
update ui_clicks c set clicks = greatest(c.clicks - per.k * n.n, 0)
from n, per
where c.day = n.day and c.hub = n.hub and c.section = per.section and c.target = per.target;
delete from ui_clicks c
using (select distinct day, hub from sh_test_runs) d
where c.day = d.day and c.hub = d.hub and c.clicks <= 0;

delete from question_events where visitor_id in (select visitor_id from sh_test_runs);
delete from feature_events where visitor_id in (select visitor_id from sh_test_runs);
delete from ui_click_reach where visitor_id in (select visitor_id from sh_test_runs);

select count(distinct visitor_id) test_visitors_removed from sh_test_runs;

select count(*) quiet_test_rows from question_events where qid like 'pq-%';
delete from question_events where qid like 'pq-%';
commit;
