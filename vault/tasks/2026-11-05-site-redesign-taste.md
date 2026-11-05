---
type: task
status: in-progress
hub: site
created: 2026-11-05
requested-by: Sam
due: 2026-11-19
waiting-on: Sam's call on the visual direction (see Decisions for Sam) and Sam's release approval
agent: Claude Code
pr:
---

# Full-site redesign with the Taste skill (visual, usability, accessibility, learning experience)

## Goal

Redesign the dashboard, the hubs, the About page, the shared widgets and the admin page with the Taste skill in full,
led by the class's own evidence, without changing the architecture (static single-file hubs), the content, the study
modes, the analytics or anyone's progress. Phased: the first PR ships the shared house style, the live hubs' Home,
bank and notes, the dashboard and the About page, plus the open accessibility bugs; later phases follow below.

## Context

- Evidence: [the evidence brief](../release/reports/2026-11-05-redesign-evidence-brief.md) (every design decision
  points at a row of its section 5).
- Design: [the design notes](../release/reports/2026-11-05-redesign-design-notes.md) (directions dealt, idea, live
  thing, copy, departures from the dealt sheets, before and after critiques).
- Rules that matter most: [preview-and-release-test](../rules/preview-and-release-test.md) (tier 2: Sam approves),
  [about-page](../rules/about-page.md), [arcade-skins](../rules/arcade-skins.md) (the arcade keeps its own look),
  [learner-data-privacy](../rules/learner-data-privacy.md), [hub-home-page](../rules/hub-home-page.md),
  [question-bank-filter-panel](../rules/question-bank-filter-panel.md), [secrets](../rules/secrets.md).
- The Taste skill: `.claude/skills/taste-skill/SKILL.md`, `references/app-screens.md` (dashboard and admin),
  decision of 2026-11-04 (used in full when Sam asks for a redesign). Scripts run from the repo root with
  `CHROME_PATH=tools/chrome-no-sandbox.sh`.
- Hub notes: [occlusion](../hubs/occlusion.md), [perio](../hubs/perio.md),
  [pcd-implants-exam1](../hubs/pcd-implants-exam1.md), [special-patient-care](../hubs/special-patient-care.md).

## Findings (short)

1. **The bank and the notes are the product** (70-96% of time); the type, contrast and spacing work goes there first.
2. **The night before, on a phone, in the dark** is the hub's real use (83-90% of time in the last 3 days, 20-26% of it
   after 10 pm); Home must put a question one tap away and dark mode must be designed, not derived.
3. **Prompts are closed, settings stay default**: the design can't lean on tours, tips or a student changing text size.
4. **Before state (Taste inspector):** the dashboard fails 8 app checks (emoji, a dotted gradient, button and panel
   shadows, a terracotta accent, 11 icon chips, 8 px text, no h1); the hub Home fails 16 page checks (an eyebrow, mono
   labels, a gradient card, 12 shadows, hairlines, outlined boxes, an icon-card row, 14.7 px body, no focal point); About
   fails 12 (9 eyebrows, 150 micro-labels, 69 hairlines, 14.5 px body, a 696 px blank at the end on a phone); the admin
   page fails only on the preview badge. Open accessibility bugs: BUG-002 to BUG-009.
5. **Each hub has its own four typefaces and palette**; the widget's own parts (stats, settings, podcast, drill) use mono
   and 11 px tracked capitals everywhere. Students tell hubs apart by color (the dashboard's rings), which is worth keeping.

## File map (what changes where)

| File | Change |
|---|---|
| `widget/house.css` (new) | The shared house style for hubs: tokens (one serif, five type steps, one radius, no shadows), the header, mode switch, Home, bank card, filter panel, notes, Review chrome. Pasted into each hub between `/* sh-house:start */` and `/* sh-house:end */` by `tools/house/build.mjs` (hubs stay single files, no extra request); `--check` fails when a hub's copy is stale. Per-hub ink and dark ground in `tools/house/hubs.json`. |
| `widget/v3.css` | The widget's own parts follow the house: no mono, no 11 px capitals, no shadows at rest, no gradient text, the top bar without blur. |
| `widget/v3.js` | `window.shBlueprint(rows, opts)`: the exam blueprint strip for Home (shared, drawn from each hub's lecture progress). |
| `hubs/<live>/index.html` | Font link, the house block, `renderHome` uses the blueprint and the new Home sections; `window.SH_EXPORT = {` stays last. Archived hubs: phase 2. |
| `index.html` (dashboard) | App screen on the dealt style: greeting as h1 with the next exam, count tiles, 12-column rows, tonal panels, hub cards tinted by class, no shadows or icon chips. |
| `about/index.html` | Same type system as the dashboard; eyebrows, hairlines and micro-labels gone; keyboard focus and the seasons table (BUG-006, BUG-007); the end-of-page blank. |
| `review/index.html` | Token alignment only (already an app screen, approved 11-05); the check-mark glyph. |
| `sw.js` | `VERSION` bump (precached widget files change). |
| `vault/` | This note, the brief, the design notes, the test report, hub notes, decisions, About entry, `DEPLOY_NOTES.md`. |

## Risks and how they're held

- **Breaking a live hub the week of its exam** (PCD Implants 11-06, Special Patient Care 11-13, Occlusion 11-19): every
  change is CSS and Home-only JS behind the same ids and classes; `node tools/ci/smoke.js` clicks every mode; the release
  suites and the device matrix run; rollback is one revert ([roll-back-a-release](../how-to/roll-back-a-release.md)).
- **Cascade surprises** (a hub's own rule beating the house): the house block is pasted at the end of each hub's style,
  with the same selectors the hubs share; per-hub exceptions are listed in the design notes.
- **Performance budgets** (`tools/release/budgets.json`): one font family replaces three or four; no photographs; the
  house block adds about 15 KB per hub; `perf.js` checks it.
- **A direction Sam doesn't want**: tokens live in one place per page, so a different palette or face is a token change;
  the structural and accessibility fixes stand on their own.
- **Privacy:** no new tracking; nothing per-person in notes or screenshots (previews use fixtures).

## Phases

1. **This PR:** house style, the four live hubs (Home, header, bank, notes, Review chrome), the widget, the dashboard,
   About, admin tokens, BUG-002 to BUG-007 and BUG-009, About entry, vault.
2. **Next:** the archived hubs' pages (token pass only), the arcade lobby chrome (not the games), Timmy Time card,
   Review tables' type, the mock's sheet, the question-health admin tab's density.
3. **Later, each its own task:** the delayed-win readiness (Sam's decision), format quotas in the drill, chapters in
   Timmy Time, tours on request (all from [insights-dashboard](../reference/insights-dashboard.md)).

## Decisions for Sam

Options with a recommendation; the preview shows the recommended one.

1. **Type across the site.** (a) **Recommended:** one serif (Erode, Fontshare) for the hubs, display and text, as the
   dealt sheet says; the dashboard, About and admin keep Instrument Sans with Instrument Serif for the greeting (the dealt
   app style). (b) Keep each hub's own four typefaces and apply only sizes, contrast and spacing. (c) One sans
   everywhere.
2. **Color across the hubs.** (a) **Recommended:** one bone paper for every hub, each hub printed in its own single ink
   (navy for Occlusion, wine for Perio, steel for Implants, teal for Special Patient Care), dark mode as the inverse
   (bone on the ink). (b) The dealt olive on bone for every hub, identical. (c) Each hub keeps its palette.
3. **Pictures.** (a) **Recommended:** none added; the subject is drawn in code (the blueprint, the sheet, Timmy). (b) Add
   public-domain dental plates from the open collections to Home (adds weight; needs the perf budgets raised).

## Done when

- [x] Evidence brief, design notes and this plan written
- [x] House style built; the four live hubs, the widget, the dashboard, About and admin on it
- [x] Taste gate: `inspect.mjs` passes for the dashboard (app) and admin; a hub (page) and About pass everything but
      `few-pictures` (decision 3) and the preview badge's `covered-text`; critique rounds written
- [ ] BUG-002 to BUG-007 and BUG-009 fixed and retested
- [x] About page entry; `DEPLOY_NOTES.md`; hub notes; decisions
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`); `node tools/release/run.js`
- [ ] UAT in the preview as new, returning, missed and admin on a 390 px phone and a laptop, light and dark; bug log rows
- [ ] Test report in the PR with the preview link, before/after screenshots and a ready/not-ready call
- [ ] Sam's written approval, then merge (Sam)

## Log

- 2026-11-05: written. Evidence pulled (read-only), before state captured, directions dealt (hub page:
  page-is-the-object; dashboard app: editorial-greeting), build started.
- 2026-11-05, later: phase 1 built (the house style in `tools/house/`, `widget/blueprint.js`, the four live hubs, the
  widget, the dashboard, About, admin tokens). The Taste gate: the dashboard and admin inspect with no FAIL; the hub
  pages and About keep two FAILs by decision (no photographs: decision 3 below) and by the preview's own badge
  (`covered-text` under `#shpv-pill`, preview runtime only); the static lint is 0 FAIL on the app files, the house
  stylesheet, About and the blueprint. Three critique rounds are in the design notes (section 8); what each round fixed:
  Perio's Home labels, rules and small text; the Timmy Time card folded on phones and under the subtabs; Review's chips
  wrapping; About's scroll entrance removed; the stats sheet's toggle ring; the dashboard panel title. Bugs found and
  fixed in the preview: BUG-021 to BUG-024. The accessibility suite found two regressions in the first run (the
  blueprint rows' spoken name, the dark "Send luck" button) and both are fixed. The test report:
  [2026-11-05-site-redesign](../release/reports/2026-11-05-site-redesign.md).

## Outcome

