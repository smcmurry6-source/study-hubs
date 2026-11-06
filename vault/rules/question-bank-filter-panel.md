---
type: rule
tags: [questions, hub-ui]
---

# Question Bank: the filter panel, lecture picker, order and pins

Sam's rules, 2026-10-30 and 2026-11-03 ("refine the filtering ... people don't know how to use it"), for every live and future hub
(not `heme-endo-exam1`: Sam said leave it as it is). The bank's filters are **one labeled panel** (`.qbar`), never a row of unlabeled
dropdowns. Copy it from `special-patient-care` (or `occlusion`, which adds final/midterm presets; Perio has its own engine's copy):
- **Lectures** (Perio: Sessions): a **tick-box list** (`lecPickHTML()` / `wireLecPick()`, every lecture ticked by default, All lectures /
  Untick all) where **every row has an "Only" button** (one tap for one lecture; it closes the list). Beside it, the search box.
- **Show**: chips for `STATE.ui.qstatus` (`BANK_SHOW`: All, **High likelihood**, Not answered yet, Missed last time, Pinned), each with
  the number of questions it would give under the other filters (`bankFiltered(search, {st})`). A hub may add one for its own case
  (Heme & Endo Exam 2: **Exam 1 High likelihood**, the Exam 1 Refresher's predicted-topic questions; Sam, 2026-11-06).
- **Order**: **In order / Random** only (`STATE.ui.qorder`; In order = by lecture, then bank order; Random shuffles once and keeps that
  order until Random is tapped again). **No "Likely first"** (Sam, 2026-11-03): High likelihood is a filter, either those questions or the whole bank.
- **More filters** (folded, with a "n on" badge): question type (`STATE.ui.qfmt`, only the formats the bank has, each with its count) and
  where it's from (`STATE.ui.qsrc`).
- Under the panel, `.qsum` says "Showing n of N questions" with a **removable tag for every filter that's on** and **Clear all**; when
  nothing matches it names the filter in the way and offers "Show all N questions". The bank opens with the filters and order used last
  time (saved in `STATE.ui`; Perio `STATE.ui.qbank`), which is why the tags matter: a saved filter is never hidden.
- Filter changes are tracked (`bank:show=`, `bank:lec-only`, `bank:type=`, `bank:src=`, `bank:tag-off=`, `bank:clear`, `bank:more`,
  `bank:search`, `bank:order=`), since `widget/clicks.js` doesn't see `<select>` changes.
- **Pinned questions**: the hub sets `window.SH_PINS = true`, the shared widget then adds a Pin button beside Report on every card
  (`window.shPins`, saved in `sh_pins_<hub>` and synced across devices by `set_pins` / `get_my_pins` (migration_v46), `sh:pins` event,
  which refreshes the chip counts). `STATE.ui.qlec` may be `'all'`, one id or an array of ids.
