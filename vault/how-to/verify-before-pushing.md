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
in more than 40% of MCQs). Since 2026-11-04 it also runs `node tools/release/secrets.js` (no keys, course material or
data files), `node tools/release/rls.js` (database permissions on a throwaway copy of `supabase/schema.sql`; needs
PostgreSQL's server binaries) and `node tools/ci/preview.js` (the preview never reaches production; needs Playwright), `node tools/ci/cases.js` (every drawn
Patient Box case has realistic numbers that agree with its key, [how-to](draw-a-patient-box-case.md)), and
a second workflow, "Release tests", runs accessibility, performance and the device matrix on site changes
([RELEASE_TEST_PLAN.md](../../RELEASE_TEST_PLAN.md); `node tools/release/run.js` runs everything). Run them locally before pushing; the smoke test needs Playwright
(`PLAYWRIGHT_PATH`/`CHROMIUM_PATH` env vars point it at a preinstalled copy). The lint reads a hub's
data by injecting a hook just before `window.SH_EXPORT = {`, so keep that line at the end of each hub script.

- `node --check` on each hub's extracted `<script>` block(s) and on `widget/v3.js` / `widget/eggs.js` / `widget/clicks.js` / `widget/replies.js` / `widget/ranks.js` / `widget/rankup.js` / `widget/drill.js` / `widget/fx.js` / `widget/podcast.js` / `widget/cases.js`.
- Question / lecture counts match what you expect; no duplicate ids.
- Grep that the feature you added (and anything from a merged-in branch) is present.
- Conflict markers: search line-anchored (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) —
  the hubs' CSS uses long `====` comment dividers.
- If both `widget/v3.js` and `widget/v3.css` changed, make sure both are committed.
- Smoke test with Playwright against the file (`file://.../hubs/<id>/index.html`),
  clicking through each mode tab. The Supabase-backed widget parts only work live.
