---
type: rule
load: on-demand
tags: [questions, hub-ui]
---

# Question Bank: the filter panel, lecture picker, order and pins

Sam's rules, 2026-10-30, 2026-11-03 ("refine the filtering ... people don't know how to use it") and 2026-11-06, for every live and future hub
(not `heme-endo-exam1`: Sam said leave it as it is). The bank's filters are **one labeled panel** (`.qbar`), never a row of unlabeled
dropdowns. Since the redesign's release (2026-11) **the engine draws it for every hub** (`widget/hub-bank.js`); a hub never copies
it, and adds only its own toggles (`SH_HUB.bank.only`). The single-file hubs archived before then keep the panel they shipped with
(the names below are theirs and the engine's alike):
- **Lectures** (Perio: Sessions): a **tick-box list** (`lecPickHTML()` / `wireLecPick()`, every lecture ticked by default, All lectures /
  Untick all) where **every row has an "Only" button** (one tap for one lecture; it closes the list). Beside it, the search box.
- **Show**: chips for `STATE.ui.qstatus` (`BANK_SHOW`: All, Not answered yet, Missed last time, Pinned), one at a time, each with
  the number of questions it would give under the other filters (`bankFiltered(search, {st})`).
- **Only**: the **High likelihood** toggle (`STATE.ui.qlikely`, `BANK_LIKELY`; Perio `QBANK_FILTER.likely`), a tick-box chip on its own
  line under Show that works **on top of any Show chip** (Sam, 2026-11-06: "filter by both high likelihood and not answered yet or
  missed last time or pinned"): High likelihood + Missed last time, + Not answered yet, + Pinned, or + All for every High likelihood
  question. Tapping it again turns it off; its count follows the Show chip (`bankFiltered(search, {lk})`), and on a phone "Only" stays
  on the toggle's row. A saved Show chip `likely` from before (`bankNormShow()`, Perio `qbankNorm()`) becomes the toggle. A hub may add a
  toggle for its own case, one on at a time (Heme & Endo Exam 2: **Exam 1 High likelihood**, `likely1`, the Exam 1 Refresher's
  predicted-topic questions; Sam, 2026-11-06). Exam Hints' "Practice these" opens the bank with the toggle on and Show on All; Home's
  buttons into the bank start with it off.
- **Sets**: a row under Show: Daily drill, Yesterday's misses, Weak spots, Mock exam (`#questions/<set>`). A set replaces the list
  until it's closed; the filters stay as they were. Above the panel, **Study as** picks how the chosen questions are asked:
  Questions, Learn or Flashcards (`widget/study-modes.js`; the mock is always questions).
- **Order**: **In order / Random** only (`STATE.ui.qorder`; In order = by lecture, then bank order; Random shuffles once and keeps that
  order until Random is tapped again). **No "Likely first"** (Sam, 2026-11-03): High likelihood is a filter, either those questions or the whole bank.
- **More filters** (folded, with a "n on" badge): question type (`STATE.ui.qfmt`, only the formats the bank has, each with its count) and
  where it's from (`STATE.ui.qsrc`).
- Under the panel, `.qsum` says "Showing n of N questions" with a **removable tag for every filter that's on** and **Clear all**; when
  nothing matches it names the filter in the way and offers "Show all N questions". The bank opens with the filters and order used last
  time (saved in `STATE.ui`; Perio `STATE.ui.qbank`), which is why the tags matter: a saved filter is never hidden.
- Filter changes are tracked (`bank:show=` for a Show chip or a toggle turned on, `bank:show=<toggle>-off`, `bank:lec-only`, `bank:type=`, `bank:src=`, `bank:tag-off=`, `bank:clear`, `bank:more`,
  `bank:search`, `bank:order=`), since `widget/clicks.js` doesn't see `<select>` changes.
- **The card**: Report and Pin sit in each card's head (`.qc-tools`), right of the lecture and status. After an answer, one row:
  **Try it again** (Retry on a phone), the shared widget's **Find this in the notes** (on a miss), **Ask Timmy** and **Good question?**
  at its end. No "Notes for <lecture>" link (Sam, 2026-11-06: Find this in the notes does that job). On a laptop a Today column (the
  goal ring, streak, XP, this session) sits beside the questions.
- **Pinned questions**: the hub sets `window.SH_PINS = true`, the shared widget then adds a Pin button beside Report on every card
  (`window.shPins`, saved in `sh_pins_<hub>` and synced across devices by `set_pins` / `get_my_pins` (migration_v46), `sh:pins` event,
  which refreshes the chip counts). `STATE.ui.qlec` may be `'all'`, one id or an array of ids.
