---
type: test-report
tags: [testing, release, redesign]
---

# Release test: site redesign (phase 1)

- **Change:** every live hub, the dashboard, About and the shared widget redrawn on one house style, from the class's
  own numbers and the Taste skill ([task](../../tasks/2026-11-05-site-redesign-taste.md), [evidence
  brief](2026-11-05-redesign-evidence-brief.md), [design notes](2026-11-05-redesign-design-notes.md)). Same hubs, modes,
  questions, notes, settings and progress. PR: [smcmurry6-source/study-hubs#247](https://github.com/smcmurry6-source/study-hubs/pull/247).
- **Tier:** 2, substantial: the look of four live hubs the week of two exams, `widget/`, the dashboard and About. CSS
  and Home-only JS behind the same ids and classes; rollback is one revert.
- **Preview:** the PR's Cloudflare Pages preview (`https://pr-247.study-hubs-preview.pages.dev`, on the PR), or the cloud
  session's `node tools/preview/serve.js --port 4173`; branch `claude/wizardly-gauss-z6krbb`. Sam was shown the preview
  link and phone and laptop screenshots (light and dark) of the dashboard, a hub's Home, Compendium and bank card, About
  and the admin page, in the session and on the PR.
- **Data:** fixtures (the six test accounts in `tools/preview/fixtures/personas.json`). No request reached production:
  the Preview button read "No request has reached production" at the end of every page of the UAT pass (checked by the
  script on every screen) and `tools/ci/preview.js` passed.

## The Taste gate

`inspect.mjs` (real browser, 1440 and 390 px) on the preview, after the build:

| Page | Rules | FAIL | Of which defended | WARN |
|---|---|---|---|---|
| Dashboard | app | 0 | | ragged-row, below-fold, panel-void (fixture data), app-title-size (the sheet keeps the 48 px h1) |
| Admin | app | 0 | | |
| Occlusion Home | page | 2 | `few-pictures` (no photographs: decision 3 for Sam); `covered-text` at 390 is the preview's own badge over "Where you stand" (preview runtime only) | size-count, side-scroll (the moments row, deliberate), small-title and name-only-title (the top bar's h1 is app chrome; the sheet's title is the page's) |
| Perio Home | page | 1 | `few-pictures` | outlined-box (2), size-count, grey-body (6.5:1), still-page, small-title, name-only-title |
| About | page | 2 | `few-pictures`; `covered-text` at 390 is the preview badge over "The dashboard" | card-rows, side-scroll (the chip row), measure (96 characters in one entry), off-centre (194 vs 215 px) |

Before the build the same pages had 12-15 FAILs each (eyebrows, mono labels, shadows, hairlines, outlined boxes,
micro-labels, 14.5 px body, no focal point, emoji): design notes section 7.

`lint.mjs` (static): 0 FAIL on `index.html`, `review/index.html`, `widget/v3.css` (app rules) and on `about/index.html`,
`tools/house/house.css`, `widget/blueprint.js` (page rules). The hubs' own stylesheets still carry their original rules
under the house block (JetBrains Mono tokens, hairlines, shadows the block overrides), so a static lint of a hub file
shows residue that the rendered inspection does not; the house block's state rings and resets carry
`taste-skill-ignore` with the reason.

Three critique rounds, scored and capped as `references/critique.md` says: design notes section 8. Final: dashboard
7.5, admin 7.4; the hub pages and About 6.0 by the cap (a FAIL still on the sheet), 6.9-7.3 without it.

## Automated

First full run, `node tools/release/run.js` at 13:48 UTC on the working tree at `1a5462d` (before the merge of
`origin/main`), summary in the session's scratch folder:

| Suite | Result | Time | Summary |
|---|---|---|---|
| Syntax (`tools/ci/syntax.js`) | pass | 2 s | 11 pages and the widget scripts parse |
| Vault (`tools/ci/vault.js`) | pass | 0 s | 82 notes, links resolve, tasks and rules in order |
| Archive state (`tools/ci/archive.js`) | pass | 0 s | 26,186 checks |
| Public-repo check (`tools/release/secrets.js`) | pass | 1 s | 600 tracked files, 401 scanned; no secrets, course material or data files |
| Smoke and question lint (`tools/ci/smoke.js`) | pass | 228 s | every hub, desktop and phone, largest text; the id registry unchanged |
| Preview safety (`tools/ci/preview.js`) | pass | 48 s | no request left the browser for Supabase |
| Database permissions (`tools/release/rls.js`) | pass | 3 s | unchanged schema |
| Admin page in a preview (`tools/release/admin-ui.js`) | pass | 125 s | Live, Hubs, order, phone layout |
| Admin operations (`tools/release/admin-ops.js`) | pass | 2 s | 62 checks |
| Accessibility (`tools/release/a11y.js`) | **fail** | 43 s | 24 screens; better than the baseline on color-contrast on 17 screens, on label-content-name-mismatch on 13, on svg-img-alt and scrollable-region-focusable where BUG-005 and BUG-006 were; **two regressions**, both fixed in the tree below: the blueprint rows' `aria-label` did not contain their visible text (7-11 nodes per hub Home: the name is hidden text after the visible label now), and the dark-mode "Send luck" button was white on light green (dark text now) |
| Performance (`tools/release/perf.js`) | **fail** | 81 s | PCD Implants TBT 850 ms against a 500 ms budget (1.5x); warnings: Occlusion TBT 1340 (budget 1000), Perio FCP 1580 (1500), Special Patient Care TBT 641 (500). The run overlapped the session's own screenshot browsers; see the rerun |
| Devices and resilience (`tools/release/matrix.js`) | pass | 229 s | 7 sizes, refresh, history, offline, slow and unreachable class data, slow 3G; 4 controls under 24x24 px on the iPhone 13 and Pixel 7 sizes (BUG-009, open; one of them is the cavity easter egg, 9x7 px by design) |

Rerun on the final tree (after the merge of `origin/main` at `e2e68ba` and the two accessibility fixes):

RERUN_PLACEHOLDER

## Manual (UAT)

Core pass of the [UAT checklist](../uat-checklist.md), with the scripted browser (Chromium, Playwright) on emulated
devices; every screen's screenshot was looked at by the agent (`uat/` in the session's scratch folder; the ones Sam was
shown are on the PR).

| Device | Browser | Accounts | Result |
|---|---|---|---|
| 390x844 phone (touch) | Chromium | returning, new (reduced motion), missed (dark), returning at XX-Large text | UAT_PHONE |
| 1280x800 laptop | Chromium | returning, missed (dark) | UAT_LAPTOP |

- [x] The preview's button says "No request has reached production" at the end (read on every screen by the script).
- [x] As returning on a phone: the dashboard, then every live hub; Home, Compendium (and Review at the largest text);
      nothing scrolls sideways (the script measures `scrollWidth` on every screen); readable at XX-Large.
- [x] The change does what the PR says, as a student would find it: from the dashboard's card into a hub's Home, the
      sheet, the bars, Practice questions, the bank card, the folded Timmy Time card.
- [x] As new: the first-visit tour and the empty states (zero counts, "Your progress shows here once you answer one")
      still make sense; reduced motion: no entrance, no bob.
- [x] Reload in the middle, Back and Forward, the hub's back button: `matrix.js` (refresh, history) on a phone and a laptop.
- [x] Class data Slow, then Unreachable: `matrix.js`, every mode of every live hub.
- [x] Keyboard only: `a11y.js`'s 30-Tab pass on every page (every stop visible; About's links have a 3 px ring now);
      the lecture picker, the filter panel, the bank card's choices and the folded card's More button by hand in the
      preview.
- [x] Dark mode (missed, phone and laptop) and reduced motion (new): readable, nothing flashes.
- [x] American English; the About page lists the new look, the four counts, the greeting and the folded card.
- [x] Sam was shown the change: the preview link first on its own line on the PR, screenshots phone and laptop.

## Bugs

Added and fixed in this preview (retested): BUG-021 (hub Home scrolled sideways at 320 px, largest text), BUG-022
(About's entrance hid cards in a full-page render), BUG-023 (Review's chips made the page 560 px wide on a phone),
BUG-024 (the Timmy Time card filled Compendium's first phone screen). From the 11-04 log: BUG-003, BUG-004, BUG-005,
BUG-006, BUG-007 fixed and retested by `a11y.js` (better than the baseline on those rules); BUG-002 (contrast) better on
every screen, not closed (the baseline is updated to the new counts, which are not zero everywhere: see Not covered);
BUG-009 open.

## Not covered

- No real iPhone or Android, no Safari or Firefox here (GitHub's "Release tests" run WebKit and Firefox on the PR).
- No screen reader; axe and the keyboard pass only.
- The arcade games, the mock exam's sheet, Perio's Home on the shared sheet, the archived hubs' pages and the arcade
  lobby chrome: phase 2 (task note), unchanged here beyond the widget's type floor.
- The Fontshare font (Erode) is loaded from its CDN by the four live hubs; offline, the hubs fall back to Iowan Old
  Style, Georgia or serif (checked by `matrix.js` offline).
- Perf: the TBT numbers are the hubs' own script parse on a 4x-throttled CPU; the house block adds about 15 KB of CSS
  per hub and `widget/blueprint.js` 9 KB. If the rerun still shows PCD Implants over 1.5x, the budget question goes to
  Sam with the numbers; nothing in this change is deferred or removed for it.

## Release

- [ ] Sam approved this release (Sam ticks it).
- [ ] Merged; `node tools/release/postcheck.js` passed:
- [ ] `DEPLOY_NOTES.md` and the site changelog updated.
