---
type: rule
tags: [hub-ui]
---

# Every hub opens on its own Home page

Sam's rule, 2026-10-27, as the engine draws it since the redesign's release (2026-11): every hub has four views,
**Home, Notes, Questions and More**, as hash routes (`#home`, `#notes/<lecture>`, `#questions[/drill|misses|weak|mock]`,
`#more[/<page>]`). Home is the default and logs as `home/dashboard` (`SH_SECTION`).

- **Home is drawn by the engine** (`widget/hub.js`) from the hub's `SH_HUB.home` and its content (`content/core.json`); a
  hub never writes its own. It shows the hub's masthead, the exam card (a live countdown and the announced facts; the
  format line says when it isn't announced), and the quick links on the first phone screen (practice questions, Daily
  drill, the notes you were on, the mock and the rest), with **Timmy Time** among them when the hub has an episode (Sam,
  2026-11-06: "animated and visible without scrolling down"): the hub's color, Timmy in headphones bobbing to the music,
  still when motion is off.
- Then **Where to next** (at most three rows: yesterday's misses in exam week, the weakest lecture, a lecture not
  started), **Today** (the goal as a ring of 20 teeth that fill in as you answer, the streak, XP today, right today,
  Timmy's HP; **no "last 14 days"**, Sam, 2026-11-06), progress by lecture (Notes / Questions per row) and the course
  timeline (`courseDates` in `core.json`: lectures, reviews, quizzes and exams, only dates that were announced).
- Under the countdown, the live count: "n studying <hub> right now, you included". The bar shows it on every page (a
  green dot and the number): the shared widget's presence count for this hub (`sh:online`, sent by `widget/v3.js`), a
  total with nothing about who.
- Drill, Yesterday's misses, Weak spots and the mock are **sets of the Question Bank** (`#questions/<set>`), not modes.
- Home redraws itself when `SH_SYNC` merges another device's answers.
- A one-time flag that moves returning visitors must **not** be in `defaultState()`: `loadState()` merges the defaults
  into saved state, so a flag there is always set and the move never runs.

The single-file hubs archived before the release keep the Home they shipped with (`renderHome()` in their own page).

Related: [build-a-hub](../how-to/build-a-hub.md) · [question-bank-filter-panel](question-bank-filter-panel.md) ·
[repo map](../reference/repo-map.md)
