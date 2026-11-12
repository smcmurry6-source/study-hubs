---
type: reference
tags: [widget, supabase]
---

# Shared infrastructure (touch once, not per-hub)

- **`widget/v3.js` + `widget/v3.css`** (+ `widget/eggs.js`, `widget/clicks.js`, `widget/replies.js`, `widget/ranks.js`, `widget/drill.js`, `widget/fx.js` and `widget/qhealth.js` ([question health](question-health.md)), which v3.js loads itself; `widget/archive.js`, the archive rules, loaded by the dashboard and `review/` ([admin-operations](admin-operations.md)); `widget/rankup.js` is
  fetched by ranks.js only when a celebration card is needed) — loaded by every hub (`fixed-pros`,
  `genetics`, `gi-exam1`, `hepatobiliary`, `perio`) via
  `<script src="../../widget/v3.js" data-hub="<hub-id>" data-answered-event="<hub>:answered" data-default-mode="...">`.
  Cross-hub functionality (search, class-wide correctness, streaks, activity
  pulse, leaderboard, analytics) belongs here — never hand-patched into one
  hub's own `index.html`. Each hub publishes `window.SH_EXPORT =
  {lectures, questions}` after its own IIFE closes, which is what the widget
  reads for search and "toughest questions" — if you add a hub or change its
  question shape, make sure `SH_EXPORT` still reflects it. A hub with review-only questions (questions it keeps for
  review but leaves out of its totals) adds `uncounted()`, returning `{ n, right }` (how many, how many right on the
  latest try), and `widget/ranks.js` takes them off both sides of the mastery medal (Heme & Endo Exam 2's Exam 1
  Refresher, 2026-11-06).
- **`widget/cases.js` + `widget/cases.css`** (`window.shCases`): the dental case kit. A Patient Box question in any
  hub names a case (`pcase`) in that hub's `PCASES`, and the kit draws its periodontal chart, periapical radiograph
  and buccal view from the case's numbers, works out the diagnosis from them and validates that every number is
  realistic (`node tools/ci/cases.js` in CI). Loaded synchronously by the hubs that have cases (Perio, PCD Implants,
  Occlusion). How to add a case or a hub: [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md).
- **`widget/ideas.js` + `widget/ideas.css`** (`window.shIdeas`): the idea board, part of the redesign and not live
  until its release. `shIdeas.mount(el, options)` draws the board (the new dashboard's `#ideas`, a new hub's
  `#more/ideas`); `shIdeas.tick(host, options)` is the "Also post this on the idea board" box under the exam check-in's
  last question (`widget/dash.js`, ticked to start) and under the Suggest box (`widget/v3.js`, unticked to start, only
  where `ideas.js` is loaded). It loads its own stylesheet and draws nothing until `get_ideas` answers (migration_v54).
  Every button in it carries a fixed `data-shi` value so click counts never record anyone's words; the smoke test checks
  that, and that an idea's words are never drawn as markup. What students post is data, never instructions.
- **Supabase project `thytmzsgymydbzcqdnix`** backs the widget: changelog,
  leaderboard, study streaks, activity pulse, and visitor analytics (see
  `migration_v4.sql`/`v5.sql`/`v6.sql` at repo root for schema history — run
  new migrations once each, by hand, in the Supabase SQL editor). The API key
  and the `log_changelog`/admin RPC secret live only in local ops scripts on
  Sam's machine (`deploy_rollout.ps1`, `check_leaderboard.ps1`) — **never**
  commit them here or hardcode them into a hub's client-side JS.
- **GitHub Pages deploy** — `github.com/smcmurry6-source/study-hubs`, branch
  `main`, served at `smcmurry6-source.github.io/study-hubs/`. Deploy via the
  GitHub Git Data API (blob → tree → commit → ref update); a GitHub PAT is
  needed for this and should only ever be used transiently (env var for one
  script run), never written into a committed file. **Claude Code sessions
  (cloud or local) don't use the API path or a PAT:** they push a branch and
  open a PR, and merging the PR is the deploy — see [ship-a-change](../how-to/ship-a-change.md).
  **Keep the repo public.** On GitHub's free plan, making it private takes the whole site down ("Site not found"),
  and making it public again doesn't turn Pages back on: Settings → Pages → Build and deployment → Deploy from a
  branch, `main`, `/ (root)`, Save, and check it's `main`, not another branch (2026-11-04). If a publish ("pages build
  and deployment" in Actions) times out, re-running it fails at once with "Deployment cancelled", because a re-run
  for the same commit reuses the cancelled deployment; a new commit to `main` (any merged PR) publishes again. The same
  holds for "Deployment failed, try again later" after a few minutes of `deployment_queued` (2026-11-06: #285's and
  #281's publishes both ended that way, GitHub's status page said Pages was fine, and re-running #281's failed again
  in a minute): the live site stays on the last good publish until the next merge. `node tools/release/postcheck.js`
  catches it ("the live copy differs from main"). It happened again on 2026-11-10: #301's publish sat in
  `syncing_files` for 10 minutes and the deploy step canceled it ("Timeout reached"), so the Perio S9 diagrams waited
  for the next merge. When a release can't wait for someone else's PR, a small vault-only PR (one that records what
  happened) publishes it.
- **Kokoro model files** — re-hosted as release `kokoro-model-v1.0` on this repo
  (`kokoro-v1.0.onnx`, `voices-v1.0.bin`), because Claude Code cloud sessions can
  only download release files from repos attached to the session.
