---
type: task
status: blocked
hub: site
created: 2026-11-06
requested-by: Sam
due: 
waiting-on: the new versions from phases 1 to 4, then Sam liking the whole redesign on the preview
agent: 
pr: 
---

# Redesign release: one PR switches the site to the new design

## Goal

Sam wants the whole redesign built and tweaked until Sam likes it before any of it reaches the class (2026-11-06,
[decisions](../decisions.md)). Phases 1 to 4 build it on `main` beside the live site, in files no student sees. This
task is the one PR that then switches the site over. If something goes wrong, reverting that PR brings the old site back.

## Context

- How the new versions are built and kept in step with the live hubs: [phase 1](2026-11-05-redesign-phase-1-hub-engine.md)
  (Context). The other phases: [2](2026-11-05-redesign-phase-2-live-hubs.md), [3](2026-11-05-redesign-phase-3-dashboard.md),
  [4](2026-11-05-redesign-phase-4-game-layer.md); [5](2026-11-05-redesign-phase-5-backend.md) ships as it's ready.
- The plan: [the redesign audit and plan](done/2026-11-05-redesign-audit-and-plan.md), section 4.
- Rules that matter most here: [preview-and-release-test](../rules/preview-and-release-test.md) (tier 3: the release
  suites, UAT, Sam ticks "Sam approved this release"), [about-page](../rules/about-page.md),
  [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md), [question-ids-are-permanent](../rules/question-ids-are-permanent.md),
  [roll-back-a-release](../how-to/roll-back-a-release.md).
- Only the hubs that are still live get switched. A hub whose exam passed before the release keeps its old page, like the
  archived hubs.

## Done when

- [ ] Sam has used the whole redesign on the preview and says it's ready
- [ ] One PR: the dashboard and each live hub's address serve the new versions (the new pages take the old ones' place,
      same addresses, so bookmarks and the home-screen app keep working)
- [ ] The content JSON becomes where content is edited: the step that copied it from the old hub files is retired, and
      `narrate.py`, the figure builds, the CI lint, `tools/question-ids/` and the preview transform read the JSON
- [ ] Same hub and question ids, so everyone's answers, XP, ranks, pins and question health carry over (checked on the
      preview with the test accounts)
- [ ] The rules edited from the drafts below: [hub-home-page](../rules/hub-home-page.md), [arcade-skins](../rules/arcade-skins.md),
      [question-bank-filter-panel](../rules/question-bank-filter-panel.md); [build-a-hub](../how-to/build-a-hub.md) rewritten
- [ ] The About page rewritten for everything students will see change, counts true
- [ ] `sw.js` version bumped, so phones drop the old cached pages; perf budgets lowered to the new sizes
- [ ] CI and the release suites pass on the switch PR, and the UAT is done on its own preview; reverting it there brings
      the old site back
- [ ] After merge: `node tools/release/postcheck.js`, `DEPLOY_NOTES.md` and the site changelog; a notice to the class only
      if Sam wants one

## Drafts for the release

Each phase writes here the rule, About page and how-to changes it needs, so they all land together.

## Log

- 2026-11-06: written after Sam chose to build the whole redesign side by side and release it at once.

## Outcome
