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
| changes `supabase/functions/timmy/` (the About page changes `site.json`) | deploys Ask Timmy (`node tools/timmy/deploy.mjs`), then asks it one real question and fails on a nap ([ask-timmy](../reference/ask-timmy.md), step 4) | nothing more |
| changes a hub's Timmy Time episode (`podcast` in `content/core.json`: a new id or length) | registers it (`admin_set_podcast_episode`), so listening earns XP | nothing more |
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
- `SUPABASE_ACCESS_TOKEN`: a Supabase access token (Ask Timmy's deploy and the data fixes through the management API).

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

## What it doesn't do

- **Migrations** (`migration_v*.sql`) are still applied by hand, through the Supabase connector or the SQL editor, and
  `supabase/schema.sql` is refreshed in the same PR ([repo map](../reference/repo-map.md)).
- It doesn't decide whether a data fix is right: that's the PR's review, like any change. A fix that writes to the
  class's data is reviewed in its PR and runs once, after the merge.

Related: [ship-a-change](ship-a-change.md) · [build-a-hub](build-a-hub.md) · [ask-timmy](../reference/ask-timmy.md) ·
[secrets](../rules/secrets.md) · [roll-back-a-release](roll-back-a-release.md)
