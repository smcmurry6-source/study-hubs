-- The test runs that reached the class's analytics (2026-11-19, found by the lessons audit that evening). Run once after
-- the PR that adds tools/ci/no-leaks.js merges (the After merge workflow does it; Sam's "merge" is the OK).
-- Why: tools/ci/smoke.js's game-layer check (Million-Dollar Smile played twice, one right answer and Walk away, then Play
-- again and one wrong answer; the Sort game opened; Timmy Time played from More) hides navigator.webdriver so the widget
-- records, and answers every request while the page is open. Since the database pass of that morning (#459), a closing
-- page sends its held clicks, feature events and question-health rows with keepalive, and a request sent as a page goes
-- away skips Playwright's routing, so every CI run and every local run of the smoke test wrote that check into Heme & Endo
-- Exam 3's live data: 67 made-up visitors by 4:40 pm Central (10:25 am to 4:39 pm), each with exactly the check's 9 click
-- targets, the settings snapshot and the arcade and podcast events, and two answers in question_events (one right, one
-- wrong, at most 4 on any one question), and nothing else: no study time, no answers saved, no XP. Every arcade click in
-- that hub that day was theirs, and 67 of Timmy Time's 69 plays from More.
-- How: a test visitor is one with a "Walk away with $#" click from 2026-11-19 on whose clicks that day are only the check's,
-- with no activity_hourly row and no personal_answers row anywhere (a student who played a game has study time). Their
-- rows in ui_click_reach, feature_events and question_events go; ui_clicks (per day, no visitor) loses what each made:
-- one click on each of the check's targets, two on a Smile answer (ms=#). question_versions' last_seen is left.
-- Safe to run twice: the counts come from the visitors still there, and the second run finds none.
-- Small (about 70 visitors, a few thousand rows at most), so it runs at any hour.
begin;
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
commit;
