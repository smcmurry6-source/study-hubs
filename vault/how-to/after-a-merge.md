---
type: how-to
tags: [shipping, automation]
---

# After a merge (automatic)

Sam, 2026-11-15: "for the after the merge, lets make all of that automatic." Every push to `main` runs the **After
merge** workflow (`.github/workflows/after-merge.yml`), which runs `tools/after-merge/run.js`. The script works out from
git what the push changed and does only the steps that change needs. **Nobody does these by hand any more**: an agent's
job is to put the right files in its PR and, after the merge, read the workflow's result.

| When the push... | It does | Put in your PR |
|---|---|---|
| changes a hub's `content/questions.json` (or `tools/question-ids/<hub>.txt`) | loads that hub's answer keys (`node tools/xp/keys.js <hub> --load`) | nothing more |
| changes `supabase/functions/timmy/` (the About page changes `site.json`) | deploys Ask Timmy (`node tools/timmy/deploy.mjs`), then, when its code changed (`core.js`, `index.ts`), asks it one real question on the live hub with the soonest exam and fails on a nap ([ask-timmy](../reference/ask-timmy.md), step 4); when only `site.json` changed, a free check that calls no model (since 2026-11-18: a real question cost about $0.60 every time) | nothing more |
| changes a hub's Timmy Time episode (`podcast` in `content/core.json`: a new id or length) | registers it (`admin_set_podcast_episode`), so listening earns XP | nothing more |
| changes `hubs.js` | sets the server's closed check-ins (`exam_checkins_closed`, `migration_v86.sql`) to every exam with `checkinClosed: true` there, so a closed check-in can't be sent and a reopened one can (`--only checkins` runs it by hand) | nothing more: closing or reopening a check-in is only `checkinClosed` in `hubs.js` |
| changes `hubs.js` | writes each live hub's exams' eves into `eve_bosses` (migration_v97, the exam-eve boss: [game-server](../reference/game-server.md)): new eves go in, a moved exam moves its eve, a removed one comes out; a boss that has started or ended is left alone (`--only eves` runs it by hand) | nothing more: an exam's `eveBoss: false` skips its eve, `eveBoss: <hp>` sets its HP |
| deletes a hub's page (`hubs/<hub>/index.html`) | records the day in `hubs_down` (migration_v95: that night the retention job rolls the hub's question health into daily totals) and deletes that hub's "Good question?" thumbs (`question_feedback`; Sam, 2026-11-21: "Delete with the hub"; 2026-11-22, [analytics-retention](../reference/analytics-retention.md)) | nothing more: taking the page down is the signal |
| adds a hub's page (`hubs/<hub>/index.html`: a new hub, or one brought back) | deletes its `hubs_down` row, if it has one, so its rows are kept as a live hub's | nothing |
| changes any site file | waits until GitHub Pages serves it (up to 15 minutes), then runs `node tools/release/postcheck.js` on it | nothing more |
| adds a file to `tools/data-fixes/` | runs it once on the live database, after the pages are live | the fix, **safe to run twice** (a recount, not an increment), its header saying why |
| adds a line to `tools/after-merge/changelog.txt` | `log_changelog` for that hub (the dashboard's "Updated" label) | `<hub> \| <one student-facing sentence>` when students would notice the change |

A step whose secret is missing shows as **blocked**, and a step that fails shows as **failed**. Either way the run goes
red on `main`'s commit, GitHub emails Sam, and its summary page has a table of every step.

## The secrets

They live in the repository's **`after-merge` environment** (GitHub → Settings → Environments → `after-merge` →
Environment secrets), with **Deployment branches** set to `main` only. So a pull request's workflows, from any branch, can never
read them:

- `SB_KEY`: the Supabase publishable key (the site's own).
- `ADMIN_SECRET`: the admin secret (keys, episodes, the changelog).
- `SUPABASE_ACCESS_TOKEN`: a Supabase access token (Ask Timmy's deploy, the closed check-ins and the data fixes through the management API).

Never put them anywhere else ([secrets](../rules/secrets.md)). The workflow's logs are public, so the script prints no
secret and no row of the class's data: a data fix's final `select` stays in the database
([learner-data-privacy](../rules/learner-data-privacy.md)).

## When a step fails or was blocked

Fix the cause, then **Actions → After merge → Run workflow** on `main`. Leave "from" empty to do the latest push again,
or give the commit before the push you mean. Give "fix" the path of a data fix to run one that didn't (or one added before
this workflow existed). A cloud session can do the same by hand: `node tools/after-merge/run.js --from <sha> --to <sha>`
(`--dry` prints the plan and sends nothing; `--only keys,changelog` limits the steps; `--fix tools/data-fixes/<file>.sql`).
Running it again is safe: keys and episodes are upserts, the deploy sends the same files, and a data fix is a recount.
The one thing that repeats is a changelog line, so leave `changelog` out (`--only`) when you run a push again.

## Merges close together

GitHub keeps one After merge run going and one waiting; when a third push comes, the waiting run is **canceled**
(2026-11-19: #467's, behind #469's, when #472 merged). Nothing is lost since 2026-11-20: a run for a push starts where the
last push run that wasn't canceled ended (`--since-last-run`, `coverFrom()` in `run.js`, read from GitHub's API), so it
does the canceled push's steps with its own, and its summary says which runs it covered. A failed run doesn't count as
canceled (it went red, and is run again by hand as above). **Don't redo a canceled run by hand**: the next push's run
already does, and redoing it repeats its changelog lines. A manual run (Run workflow) covers only the range it's given,
so one that canceled a waiting push run leaves it to the next push's run.

## What it doesn't do

- **Migrations** (`migration_v*.sql`) are still applied by hand, through the Supabase connector or the SQL editor, and
  `supabase/schema.sql` is refreshed in the same PR ([repo map](../reference/repo-map.md)); one with a backfill goes in
  late at night or in small batches ([run-sql-on-the-live-database](run-sql-on-the-live-database.md)). A data fix runs
  at the merge, whatever the hour, so it stays small.
- It doesn't decide whether a data fix is right: that's the PR's review, like any change. A fix that writes to the
  class's data is reviewed in its PR and runs once, after the merge.
- **A changed answer key restarts that question's picks before any data fix runs** (2026-11-24, [BUG-200](../release/bug-log.md)).
  The keys step comes first, and the key loader (`admin_load_question_keys`) moves a question's picks to
  `question_choices_past` when its choices' version changes, a fingerprint of its choices *and its key*
  (`choiceVersion()` in `tools/xp/keys.js`). So a fix that recounts a key change from `question_choices` finds nothing
  there: Review of Systems' 52 fixed keys read 0% right for a few minutes, until
  `tools/data-fixes/2026-11-24-review-of-systems-picks.sql` moved the picks back. When only the key moved (the same choices
  in the same places), the fix moves that load's picks back first, as that file does. Test a data fix on a throwaway copy
  in the order After merge runs it: load the old keys, add picks, load the new keys, then the fix.

Related: [ship-a-change](ship-a-change.md) · [build-a-hub](build-a-hub.md) · [ask-timmy](../reference/ask-timmy.md) ·
[secrets](../rules/secrets.md) · [roll-back-a-release](roll-back-a-release.md)
