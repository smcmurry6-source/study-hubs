---
type: hub
tags: [hub, live]
hub: review-of-systems
status: live
---

# Review of Systems

DENT 2165 Review of Systems (November 16 to December 11, 2026; self-study with no review sessions; pass/fail): **two
200-question Canvas mock board exams**, Thu Dec 3 and Thu Dec 10, 8:00 am to noon CST, 200 minutes once started, remote
with Respondus LockDown Browser and Monitor, INBDE style "with images & patient boxes". To pass: the course's 8 quizzes and
55% or better over both mocks together (220 of 400). The course's intro deck lists what the mocks cover; "the systems
courses" are Cardio & Respiratory, Renal, Heme & Endo and MSK & GI (Sam, 2026-11-19). The syllabus in the same Drive
folder still has an earlier year's dates (Mon Nov 24 and Wed Dec 3): the intro deck's are this year's. Exam dates and
check-in hours: its entry in `hubs.js`.

## Before you work on it

- **Source of truth:** `hubs/review-of-systems/content/` (edit the JSON, then `node tools/hub-next/build.mjs --hub
  review-of-systems`), and `index.html`'s `SH_HUB` for the hub's own words (Home, hints, the mock). On the engine from the
  start ([build-a-hub](../how-to/build-a-hub.md)).
- **A hub of courses, the first** (the engine's course groups, 2026-11-19; Sam: "a section for each course tested and then sub
  sections to make it more manageable", then "Course, then subsection pages"): `core.json`'s `groups` are the 14 courses (`id`,
  `title`, `code`), and each lecture is one **part** of a course, with its `group`, labeled `<code>-<n>` (HN-1, F2-3). The notes'
  list, Home's progress and the Question Bank's lecture picker (with an **Only** button per course) list the parts under their
  course, and each course has one color. On a hub with `groups` the smoke test counts the two-statement, true/false, numbered
  and which-statement minimums **per course**, not per part (Sam: the special formats per course).
- **Two mocks, one countdown:** `core.json`'s `exams` are `mock1` and `mock2`. The engine counts down to the first that
  hasn't closed (noon), so Home moves to Mock 2 on the afternoon of December 3; `SH_HUB.home.byExam.mock2` gives Home its title
  and time for the second. The dashboard's check-in shows from noon on each mock day (`checkinHour` 12), and the hub archives
  itself at 10 pm on December 10.
- **The mock:** 200 questions in 200 minutes (`mock.limit` 12000), drawn by course: `mock.blueprint` has one count per course
  and `mock.groups` lists each course's parts. **The spread is this hub's guess** (by the size of each course): the course
  announced no per-course counts. `likelyShare` 0.5.
- **No narration** (`"audio": "off"`; Sam: "if we need to we can cut the lecture reading for this hub"): Listen reads in the
  device's voice. **No figures** (Sam: "i dont think we do any figures"), so no diagram review. **No arcade yet:** More hides
  its tile while `SH_HUB.arcade` has no games ([inbox](../tasks/inbox.md)). No Timmy Time. In `sw.js` it is in `HUBS` and in
  `TEXT_ONLY` (no figures or arcade files to keep for offline): give it an arcade and take it out of `TEXT_ONLY`.
- **Art, its own** ([every-hub-gets-its-own-art](../rules/every-hub-gets-its-own-art.md)), in `tools/figures/site/`: violet
  (`#6b46a8`, a hue no other hub has); the emblem is a checklist on a clipboard with a molar in front; the masthead is a desk
  with a heart chart and a lungs chart on the wall, a lightbox holding a periapical film, books, a molar model, a stethoscope,
  a pill bottle, an hourglass and a pencil; the medal glyph is the clipboard (`widget/ranks.js` `HUB_MEDAL`).
- **Sources** (Sam's Drive: the Review of Systems folder, with the intro deck and syllabus, and one folder per course): Sam
  said "please use everything from those folders": this class's and the class above's study guides, notes, answered
  objectives, practice tests, drug lists and transcripts, and this site's earlier hubs for the same courses. Most courses
  have no professor slides there, so the notes rest on classmates' guides checked against standard references; where
  sources disagreed and how it was settled, per course: [the task](../tasks/done/2026-11-19-review-of-systems-hub.md). Not read: Anki decks (`.apkg`) and HEIC photos. Commercial review material
  (DAT Bootcamp, Dental Decks and the like) was never copied.
- **Graded work, "topic check only"** (Sam, 2026-11-19; [decisions](../decisions.md)): the earlier courses' quizzes,
  crosswords and exams were read only to check that every topic they test is covered by the hub's own questions. No question
  was copied or reworded from one, and nothing in the hub says a topic was on one. **This course's own 8 quizzes are never
  used**, not even as context, while they are open ([graded-coursework](../rules/graded-coursework.md)).
- **Questions:** mostly board-style (Sam: "Mostly board-style"): single best answer, patient boxes written as text, EXCEPT
  items, with the special formats. Ids are `<part id>-NN` and permanent (`tools/question-ids/review-of-systems.txt`).
  High likelihood is about 40% of each part's questions: each topic keeps its most direct questions.
- **Scope:** only the intro deck's list (Sam: "None: stick to the list"): no oral histology, dental anesthesia or operative.

## Pending

Open items for this hub are lines in [the inbox](../tasks/inbox.md) tagged Review of Systems, and
`vault/tasks/` notes with `hub: review-of-systems`.

## History

Grep "Recent major changes" in `DEPLOY_NOTES.md` for `review-of-systems`. Built:
[the task](../tasks/done/2026-11-19-review-of-systems-hub.md). Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [build-a-hub](../how-to/build-a-hub.md) · [heme-endo-exam3](heme-endo-exam3.md)
