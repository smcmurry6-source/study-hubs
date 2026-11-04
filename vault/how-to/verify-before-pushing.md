---
type: how-to
tags: [shipping, ci]
---

# Verify before pushing

GitHub Actions runs `.github/workflows/check.yml` on every PR: `node tools/ci/syntax.js`
(every inline script parses, no conflict markers), `node tools/ci/vault.js` (vault links resolve, task notes and
rule notes in order; see [repo-is-the-vault](../rules/repo-is-the-vault.md)) and `node tools/ci/smoke.js` (headless click-through
of the dashboard and every hub on desktop and phone, plus a question-bank lint: duplicate ids, answer
ranges, missing explanations, a missing "why" for any choice, missing narration files, and the correct answer being the longest choice
in more than 40% of MCQs). Run all three locally before pushing; the smoke test needs Playwright
(`PLAYWRIGHT_PATH`/`CHROMIUM_PATH` env vars point it at a preinstalled copy). The lint reads a hub's
data by injecting a hook just before `window.SH_EXPORT = {`, so keep that line at the end of each hub script.

- `node --check` on each hub's extracted `<script>` block(s) and on `widget/v3.js` / `widget/eggs.js` / `widget/clicks.js` / `widget/replies.js` / `widget/ranks.js` / `widget/rankup.js` / `widget/drill.js` / `widget/fx.js` / `widget/podcast.js`.
- Question / lecture counts match what you expect; no duplicate ids.
- Grep that the feature you added (and anything from a merged-in branch) is present.
- Conflict markers: search line-anchored (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) —
  the hubs' CSS uses long `====` comment dividers.
- If both `widget/v3.js` and `widget/v3.css` changed, make sure both are committed.
- Smoke test with Playwright against the file (`file://.../hubs/<id>/index.html`),
  clicking through each mode tab. The Supabase-backed widget parts only work live.
