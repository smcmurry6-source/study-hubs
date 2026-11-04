---
type: rule
tags: [hub-ui]
---

# Every hub opens on its own Home page

Sam's rule, 2026-10-27: every hub has a **Home** mode, first in the mode switch and the default (`data-default-mode="home"`,
`STATE.ui.mode` defaults to `home`), logged as `home/dashboard`. Copy `renderHome()` and its CSS from `heme-endo-exam1` (or
`occlusion`, which has it for a final with no time yet) and fill it from the hub's own data. At least:
- the exam(s): a live countdown and the format facts (`examCardHTML`), and an alert for anything graded coming due (a quiz closing);
- a quick-start row (practice questions, Daily drill, the notes you were on, the mock) and readiness (questions right on the latest try);
- **Where to next** (weakest lecture, questions missed, a lecture not started), progress by lecture with Notes / Questions buttons;
- the course timeline (`COURSE_DATES`: lectures, reviews, quizzes and exams, only dates that were announced), the last 14 days;
- links to the hub's other parts (hints, cram sheet, Review, Arcade, a podcast).
The quick-start row and the exam card live on Home, not on Compendium. Home redraws itself when `SH_SYNC` merges another device's
answers. A one-time flag that moves returning visitors (`STATE.ui.homeOn`) must **not** be in `defaultState()`: `loadState()` merges
the defaults into saved state, so a flag there is always set and the move never runs. `widget/tour.js` already has the Home steps.
