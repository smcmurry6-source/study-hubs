---
type: hub
tags: [hub, live]
hub: pcd-implants-exam1
status: live
---

# PCD Implants Exam 1

Nine lectures (Dr. Mueninghoff, Dr. Chavali, Dr. Chen, Dr. Givan, Dr. Geisinger). The exam is on Canvas, Fri Nov 6,
7:00 am-8:00 pm: 40 questions in one hour (3 multiple-answer, 3 matching, the rest MCQ). Dates and check-in hours (the
window closes at 8 pm, so `checkinHour:20`): `HUBS` in `index.html`.

## Before you work on it

- **Source:** `hubs/pcd-implants-exam1/index.html`; edit it directly, except the figures.
- **Built on** the Special Patient Care engine; palette "Anodized" (Sora / Manrope / Red Hat Mono). Adds `mm()` for
  multiple-answer items (one `[choice, isCorrect, why]` per option).
- **Sources** (Drive, PCD Implants): the recordings (transcribed in-session; L2's is an earlier year's run), slides,
  handouts and the course's hint list. A prior class's answers to the hint list and a diagram-aids doc were used only as a
  checklist against the lectures. No graded quiz or previous years' exam content.
- **Mock:** 40 questions / 60 minutes, MCQ only; `MOCK_BLUEPRINT` is the hub's own (no official counts per lecture).
- **Figures:** eleven anima figures from `tools/figures/pcd-implants-exam1/` (one generic live controller, `amLive`, in
  `shared.mjs`); edit them there and rerun `build.mjs` (`--check`, `--preview`). All eleven were checked against the notes
  and fixed on 2026-11-04 (change log): `attach` draws its soft tissue layers to scale from Gargiulo 1961 and Cochran
  1997 (the averages behind 2.04 and 3.08 mm); `zones` is an upper incisor, so coronal is down as in the notes' "creep
  down (coronally)"; `position` measures every distance at the crest, to scale. A figure that wants to react when a
  slider or button sets a key names a helper in `D.ONSET` (`position` switches views that way). anima's line check has
  nothing to test here (these figures draw no `.iso-line`), so review them by eye in both themes and at 390 px.
- **The seven implant types** (L1, `FIGS` `ty-*`, drawings A-G in the lecture's order) are built from
  `tools/figures/pcd-implants-exam1/types.mjs` by the same `build.mjs` (it rewrites the hub's `var FIGS = {...};` line;
  never edit that line by hand). Each is a main view (`.ty-main`: panoramic or periapical radiograph, or the denture's
  tissue side) and a section (`.ty-sec`) showing where it sits; above a question the section is hidden by CSS until the
  question is answered, and the numbered parts are explained by the figure's `key`. Redrawn 2026-11-04 (Sam: "could be
  better and more accurate"), checked against Linkow's texts, Bosker's TMI patent and the intramucosal insert patents
  (sources in the file's header), with keys that name only what L1 teaches
  ([figures-teach-the-lecture](../rules/figures-teach-the-lecture.md)). Every type has a picture question (`ev-pic-*`).
- **Arcade:** the Osseo Arcade, skin `IMPL_SKIN`.
- **Timmy Time:** an episode (`hubs/pcd-implants-exam1/audio/timmy-time.mp3`, script `tools/podcast/pcd-implants-exam1/script.md`),
  card on Home under the quick-start row, `#timmy` opens Home. `SH_PODCAST.fans` holds its three lore comments
  ([podcast-reactions](../rules/podcast-reactions.md)). **A notes change means fixing the script and rebuilding the episode**
  ([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)). The script keeps CDT codes, clinic credits and
  brand details with no exam signal out, like the bank.
- **Brand and admin details** (Sam, 2026-11-03, reports #35/#36): keep a system's details only with an exam signal
  (a hint, a focus list, "on my exam", an example question). Kept: each system's surface, alloy and torques, conical vs
  non-conical, `pf-systems`.
- **Select-all ticks** reach `question_choices` only from 2026-11-04 (`picks` in `impl:answered`, set in `recordAnswer`); older
  `mm()` items have no per-option rows. Choices must not carry their own numbers when the stem asks which is most common (report #37).
- **Practice follows bank order** (lessons audit, 11-04): two days out the last four lectures had 6-7 answerers each vs 23 on L1-L2.
  So Home's "Where to next" has a **Practiced least** row (`homeNextHTML`, `homeGo('least:<ids>')`; Sam, 2026-11-04): it
  replaces "Not started" once you've answered anything. Its clicks log as `home=least:<ids>`. Nobody tapped that row, while the
  quick-start row gets the taps, so since 2026-11-05 (Sam: "fix both of the optional suggestions") the quick-start **Practice
  questions** button goes to the same lectures (`lecsBehind(rows)` feeds both; it lists them by number, "Practiced least: L1, L2,
  L5, L6 · 129 to try"), and to every unanswered question when none is behind. Its clicks log as `qs=practice-least` and
  `qs=practice` (`data-qs`), apart from the row's `home=least:<ids>`.
- **`tm-mm-2`** (platform switching) is 3 right of 5 since 2026-11-05: "Decreases soft tissue volume" replaced "Increases soft
  tissue volume" (the notes: it increases), same id. Its old class picks and accuracy were cleared once it went live (Sam's OK, 2026-11-05), so its numbers start at 0.
- **Question health, 2026-11-05** (Sam: "review and fix all questions flagged"): all 14 flagged items were checked
  against the notes and every key matched; most flags came from the 8-10 people counted since 11-04, whose numbers
  differ from the all-time ones. Rewritten (new versions): `in-bh` (stem: "the three implant systems the school's clinic
  uses"), `bm-25lb` (the explanation does the lever: 25 lb bite + 50 lb on the other implant = 75 lb on the fulcrum),
  `bm-occ-two` (pull-through is the single-implant check in MI; implant against implant drags in forceful biting) and
  `im-process` (the guide comes first because it's worn during the scan). Why lines only (same versions): `ev-blade`,
  `ev-hader`, `ev-frialit`. The subperiosteal drawing (`ty-sub`, `ev-pic-sub`) now has its lattice on the crest; it
  sat 12 px into the bone and half the recent tries picked "Blade". `tm-mm-2` was already fixed (#252).
- **Question health, 2026-11-06** (the 19 flagged after that review, the night before the exam): every key matched the notes.
  New wording: `in-3weeks` (asks the soft tissue's wait, since "after the healing abutment" also fits a one-stage case where
  the bone needs months), `tm-mm-3` ("which go into the 7 mm": the subgingival margin subtracts) and `tm-early-place`
  ("after an extraction": placement counts from the extraction, loading from placement). Explanations and why lines:
  `im-tf-3`, `im-flapless`, `im-software`, `cb-num-3`, `su-def-bran`; why lines only: `bm-moment`, `su-edent`. Looks fine:
  `in-collagen`, `im-num-2`, `im-medct`, `tm-2s-1`, `cb-num-2`. **`su-def-bran` follows the surgery lecture**, which gives
  "light microscopic" to Brånemark (1969) and "structural and functional connection" to Albrektsson and Sennerby (1991);
  many textbooks credit that second wording to Brånemark, which is why most recent tries picked it. Keep the lecture's
  attribution unless Sam says otherwise. **Exam day, 2026-11-06** (Sam: "review implants question health, fix the issues, mark
  them in the admin page, and merge"): 10 more flagged, every key matched the notes. New wording: `ev-tmi-bone` (the key says
  "behind the plate", the notes' words, not "distal to"), `bm-goodacre` (the stem names Goodacre's review; resin, not porcelain,
  was the veneer that fractured often). New explanations and why lines: `im-crest`, `su-esth-span` (a wide single space is low
  risk), `su-bar`, `su-mm-1` (malpositioning is surgical-related), `su-match` (a matching card shows only its explanation after
  answering, not the pairs, so the explanation now lists them; do the same for any matching item). Looks fine: `bm-moment`
  (the lecture leans on "stress is force per unit area", so force / area is a real mix-up), `im-pa-follow` (21 of 23 right; the
  top-vs-bottom flag is noise on an easy item), `tm-2s-6` (picks spread over all four choices: guessing, not a pull to one
  wrong answer). **A question's version here includes its explanation** (`SH_EXPORT`'s `hint` is the
  key plus the explanation), so an explanation edit starts fresh numbers and a why-line edit doesn't. Ids removed on Sam's
  11-03 call (`tm-code-6010`, `tm-code-6058`, `tm-conelog`, `tm-rc-grooves`, `gs-credit`) are retired in
  `tools/question-ids/pcd-implants-exam1.txt`; the admin page lists the ones with class data as "gone".
- **Statement keys were a pattern until 2026-11-04** (suggestion #14): 36 of 46 two-statement keys were "1 true, 2 false",
  statement 1 was true in all 30 numbered items and the second choice was the key in 23. The evening audit swapped,
  reordered and rewrote them (12 / 11 / 11 / 12 over the four two-statement choices; numbered keys 7 / 8 / 8 / 7 by
  position, the false statement at every number, three "all four" and two "two true" keys); `tools/ci/smoke.js` now fails
  a hub whose statement keys form a pattern. Put new items wherever keeps that spread: don't put the true ones first.

- **Drawn Patient Box cases** (2026-11-05): the four L8 Patient Box items (`su-pb-1` to `su-pb-4`) name a case in
  `PCASES` (mucositis at #19, peri-implantitis under a cement-retained crown at #30, a new patient with no baseline, an
  early failure at #14 under a cover screw) and show its chart, film and drawn view from `widget/cases.js`, with "In the
  notes" buttons (`REF_SURG_*`, `REF_REV_*`). Write any new Patient Box item the same way:
  [draw-a-patient-box-case](../how-to/draw-a-patient-box-case.md); CI checks the numbers (`node tools/ci/cases.js`).
- **Exam check-in** (Sam, 2026-11-06: "see how the class feels about changes in this hub like the improved patient
  boxes"): the exam's `extraQs` in `HUBS` (`index.html`) ask four more questions, eight steps in all: `pbox_img` (the drawn
  Patient Box cases, 1-5) and `diagrams` (the diagrams and the seven implant-type drawings, 1-5), the ids the Occlusion
  midterm used (there: Patient Box 3.9, diagrams 4.6, n = 17), each with a "didn't use them" button saved as `"none"`; `helped` (tick any: how the
  class answered each choice, Why each choice, Practice questions by least practiced, High likelihood, Pinned, Timmy Time, None
  of these); `changes` (keep improving up to the exam / hardly noticed / rather it held still). About half the people who
  answered anything reached a Patient Box case (34 of 65 on exam morning), which is why the "didn't use" button is there. The
  admin page's Check-ins view tallies all four. Read them in the retrospective next to each person's use of that feature.

History: grep `PCD Implants` in "Recent major changes" (`DEPLOY_NOTES.md`).

Related: [home](../home.md) · [special-patient-care](special-patient-care.md) (its engine)
