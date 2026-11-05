---
type: test-report
tags: [testing, release]
---

# Release test: top bars that fit their content (2026-11-04)

- **Change:** the hubs' top bar arranges itself around what's in it, so no mode tab (Arcade above all) is ever cut off
  or pushed past the screen's edge. The dashboard's top bar and its Arcade high scores rows, and Perio's arcade leaderboard
  tabs, wrap instead of overflowing. PR: [smcmurry6-source/study-hubs#235](https://github.com/smcmurry6-source/study-hubs/pull/235).
- **Tier:** 2 (shared widget, every hub, the dashboard).
- **Preview:** https://pr-235.study-hubs-preview.pages.dev (Cloudflare Pages, made-up data). Locally:
  `node tools/preview/serve.js` on the branch, and `main` served beside it on another port for the before shots. Sam was
  sent before/after screenshot sheets (phones; tablet and laptop).
- **Data:** fixtures only. Nothing was written to the class's data.

## Root cause

Each hub chose its top-bar layout from a stack of screen-width breakpoints (380, 520, 560, 760 and 860 px in each hub, plus
the 561-1000 px patch in `widget/v3.css` from 2026-10-28). Whether the bar fits depends on its **content**: the hub's name
("Perio D2" vs "PCD Implants Exam 1"), your name and rank, the countdown's wording, the streak, tour and Inbox buttons,
the font, and the **text-size setting**, which zooms `<html>` up to 1.45× where media queries can't see it. When the
guess was wrong, `#modeSwitch` (`min-width:0; overflow-x:auto` with its scrollbar hidden) shrank and clipped the last
tabs with nothing to show they were there, or the tabs ran past the edge and the page scrolled sideways. Under 760 px
some hubs set tab labels to `display:none`, leaving icon-only tabs with no spoken name, and hid the hub's `h1` on
phones. The dashboard's bar was one row that couldn't wrap, and its arcade rows were hidden-overflow scrollers.

## The responsive pattern chosen

**Measure, don't guess.** `widget/v3.js` lays the bar out each way, in order, and keeps the first that fits (re-measured on
width changes, when names and pills fill in, and when fonts load); `widget/v3.css` draws them, scoped to
`header.hub-header[data-sh-head]` so they outrank each hub's breakpoints:

| `data-sh-head` | When | Layout |
|---|---|---|
| `row` | everything fits at full size | title, tabs, pills and buttons on one line |
| `stack` | the one line doesn't fit | title and pills on top, the four tabs on a full-width row below |
| `stack3` | the pills don't fit beside the title either (phones, large text) | title with the Inbox and theme buttons; then your name (shortens with "…") and the pills; then the tabs |

| `data-sh-tabs` | When | Tabs |
|---|---|---|
| `inline` | labels fit beside icons | icon and label side by side |
| `tall` | they don't | icon over label |
| `grid` | that doesn't either | two rows of two |

Nothing important is hidden to make a row fit: every tab always shows its label; the tour button, already in the
More sheet on phones, is the only control left out of `stack3`. The dashboard uses plain CSS wrapping: its five buttons
are one group (`.tb-actions`) that moves onto its own row, and wraps within itself at the largest text on a 320 px
phone; the arcade rows wrap. Touch screens get 40 px tall tabs and 32 px round buttons and name button.

## Automated

| Check | Result |
|---|---|
| `node tools/ci/syntax.js` | pass |
| `node tools/ci/vault.js` | pass |
| `node tools/ci/smoke.js` | pass (every hub, every mode, desktop and phone, plus the new top-bar check) |
| New smoke check on `main` (before the fix) | **fails, 68 problems**: Arcade past the edge at 320 px (4 hubs), Arcade cut off inside `#modeSwitch` at 1001 px (6 hubs), the dashboard's theme button and Settings past the edge, its arcade buttons cut off: the check catches the bug it guards |
| "Check hubs" and "Release tests" on the PR | see the PR's checks |

The new smoke check opens the dashboard and every hub at **320 px, 1001 px and 390 px with the largest text** and fails if
the page scrolls sideways, if any top-bar control, mode tab or dashboard arcade button is past the edge or clipped inside
a scroller, or if a mode tab hides its label.

## Viewport results (Chromium, scripted, measured and screenshots looked at)

All ten pages (dashboard, About, the four live hubs, the four archived hubs) at each width. "Before" is `main` at
`8491d9f`.

| Width | Before | After (layout picked) |
|---|---|---|
| 320 | Arcade past the edge, page scrolls sideways in Occlusion, PCD Implants, SPC, Heme & Endo; dashboard theme button off screen (30 px sideways scroll) | no sideways scroll, nothing clipped; hubs `stack3`, tabs `tall` in the live hubs (`inline` in the archived ones) |
| 375, 390, 430 | fit, but three cramped rows with the back button alone on top and the hub's name hidden | `stack3`/`inline`: hub name with Inbox and theme, then name and countdown, then four labeled tabs |
| 768 | fit | `stack`/`inline` (PCD Implants and SPC, longer names: `stack3`) |
| 1000 | fit (the 561-1000 patch) | `stack`, or `row` where it fits (MSK 3, MSK 4, PCD 3) |
| 1001 | **Arcade clipped** in Occlusion, PCD Implants (Review too), SPC, Perio, Heme & Endo, PCD 3 | `stack` in those six, `row` in MSK 3 and 4 |
| 1280 | **Arcade clipped** in Occlusion, PCD Implants, SPC | `row` in Perio, Heme & Endo, PCD 3, MSKs; `stack` where the line doesn't fit (Occlusion, PCD Implants, SPC) |
| 390, largest text (1.45×) | **Arcade missing** from the bar (Occlusion and others) | `stack3`/`tall`, all four tabs labeled |
| 320, largest text | tabs and buttons past the edge | `stack3`/`grid`; dashboard buttons wrap within their group |

Dashboard arcade rows: before, most hub and game buttons sat past the panel's edge at every width; after, all wrap
into view at every width.

- **Portrait and landscape** (Playwright device profiles): iPhone 13 portrait (`stack3`) and landscape (`stack`), Pixel 7,
  iPad Mini landscape: no sideways scroll; every top-bar control at least 32 px on touch (the name button was 27-28 px, now 32).
- **Browser zoom:** zoom shrinks the layout width in CSS pixels, so 200% on a 1280 px window lays out like 640 px and 400%
  like 320 px, both in the table above; the text-size setting (the zoom a media query can't see) is covered by the
  largest-text rows.
- **Keyboard:** Tab through the bar at 320, 390, 1001 and 1280 px: every stop on screen with a visible focus ring;
  Enter on Arcade opens it; tabs are named Home, Compendium, Review, Arcade.
- **Screen readers:** tab labels are never `display:none` now, so every mode tab keeps its name; the hub's `h1` stays in
  the page on phones (it was `display:none`, which also removed it from screen readers). The dashboard's game row is a
  group of `aria-pressed` buttons instead of a tablist without arrow-key support.
- **Reduced motion:** nothing animates in the change; the layouts switch instantly.
- **Largest text, page content:** the largest text exposed two more rows wider than a phone, fixed here: Home's "Where to
  next" (shared guard in `widget/v3.css`, 5 hubs) and Perio's course-map titles (`overflow-wrap`).

## CI ("Release tests")

- Accessibility: one new finding from this PR, fixed (BUG-014: Perio's Review sidebar was sticky at a fixed 70 px and slid under
  the two-row bar). One finding that `main` already had (Perio Review, `#ref-antibiotics > .table-wrap` not keyboard-scrollable;
  also on PR 237's run) is left for its own change.
- Devices (`matrix.js`): `main` fails 51 problems in WebKit and Firefox (PR 237's run), mostly pages scrolling 11-67 px sideways
  on phones and tablets. This PR clears all of them except one that `main` already had: Perio's Arcade scrolls 6 px sideways on
  WebKit and Firefox phones (not Chromium, which this session has; not reproduced here).

## Bugs

BUG-010 (S2), BUG-011 (S3), BUG-012 (S3): fixed here. BUG-013 (S4): found at the largest text, not fixed here
(see the bug log).

## Not covered, limitations

- **Real Safari / iPhone** and Firefox, WebKit: not run in this session (CI's "Release tests" runs WebKit and Firefox).
- **Focus order in `stack3`:** the keyboard goes back button, tabs, name, Inbox, theme (the order in the page), while on
  a phone the tabs are drawn last. Reordering the markup in every hub was left out to keep the change shared.
- **Taller bar on some wide screens:** where one line doesn't fit (Occlusion at 1280 px with a long name and a streak),
  the bar takes two rows (86 px instead of 50) instead of clipping a tab. On phones the bar is 123-135 px (it was 121-127
  with Arcade off the edge or labels hidden).
- The Settings sheet's button rows and Timmy's speech bubble on the dashboard are wider than a phone at the largest text
  (BUG-013); outside the top bars.

## Release

- [ ] Sam approved this release (Sam ticks it).
- [ ] Merged; `node tools/release/postcheck.js` passed:
- [ ] Monitored at 1 h / 24 h / 48 h (`tools/release/monitor.sql`), Inbox and logs:
- [x] `DEPLOY_NOTES.md` updated; site changelog after merge.
