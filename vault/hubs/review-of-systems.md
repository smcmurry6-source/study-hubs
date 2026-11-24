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
  device's voice. **No figures** (Sam: "i dont think we do any figures"), so no diagram review. **No arcade** (Sam, 2026-11-20:
  "No arcade", [decisions](../decisions.md)): More hides its tile while `SH_HUB.arcade` has no games. No Timmy Time. In `sw.js`
  it is in `HUBS` and in `TEXT_ONLY` (no figures or arcade files to keep for offline).
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
  **From 2026-11-22 the professors' slides** (and, for Renal, Dr. Herr's recordings' transcripts), which Sam uploaded then:
  each part checked against them is listed in [the slides task](../tasks/done/2026-11-22-review-of-systems-from-the-slides.md),
  and its `from` in `core.json` names the decks. Where a slide disagrees with a standard reference the hub keeps the
  standard fact and the PR lists the slide's version for Sam. A deck over 10 MB that the Drive connector returns empty
  needs a PDF or smaller copy: Sam gave three as PDFs in the session (2026-11-23: the heart anatomy deck and Dr. Herr's
  foregut and abdominal wall decks; not in Drive in that form, so ask Sam for them again). F1's Introduction to
  Endocrinology and Histology 4 were checked against this site's Heme & Endo and MSK hubs instead (Sam: "check previous
  hubs"), and the other unreadable decks are left to the study guides (Sam: "dont worry about the rest").
  **Sam's calls on the conflicts** (2026-11-23, "use outside sources to decide the content calls"): one fact taught in
  every course, from current references, listed in [decisions](../decisions.md): elective care after an MI, warfarin
  extractions, antibiotics in liver disease, Pseudomonas and the rest.
- **Graded work, "topic check only"** (Sam, 2026-11-19; [decisions](../decisions.md)): the earlier courses' quizzes,
  crosswords and exams were read only to check that every topic they test is covered by the hub's own questions. No question
  was copied or reworded from one, and nothing in the hub says a topic was on one. **This course's own 8 quizzes are never
  used**, not even as context, while they are open ([graded-coursework](../rules/graded-coursework.md)).
- **Questions:** mostly board-style (Sam: "Mostly board-style"): single best answer, patient boxes written as text, EXCEPT
  items, with the special formats. Ids are `<part id>-NN` and permanent (`tools/question-ids/review-of-systems.txt`).
  High likelihood is about 40% of each part's questions: each topic keeps its most direct questions.
- **Scope:** only the intro deck's list (Sam: "None: stick to the list"): no oral histology, dental anesthesia or operative.
- **Not exam hints, High yield** (Sam, 2026-11-20, [decisions](../decisions.md)): the quotes and the topics come from the courses this hub reviews, said
  about those courses' own exams, so they mark high-yield content and never predict the mocks. `core.json`'s `hintsFrom: "courses"` makes the engine
  say **High-yield points** for Exam hints (Home, More, search) and **High yield** for High likelihood (the bank's toggle, the card's tag and its why,
  High yield's intro), and Ask Timmy say the same (`supabase/functions/timmy/core.js`). Words that predict the mocks stay out of this hub's text.
- **The quotes (High-yield points):** 169, every one what a professor said to know, in the professor's words: Medical
  Emergencies' 18 from its recordings, and since the slides (2026-11-22) the rest from the decks, their speaker notes and
  Dr. Herr's Renal recordings. What a professor said not to learn (ECG patterns, airway adjunct sizing, the steroid chart,
  "FOR REFERENCE ONLY! DO NOT MEMORIZE!", the CKD lecture's reference ranges and the like) is left out of the notes and the
  questions, and **nothing says it was left out**: no "don't memorize" point (Sam, 2026-11-23: "dont include a note saying
  'dont memorize'"; [dont-ask-what-professors-skip](../rules/dont-ask-what-professors-skip.md)).
- **Not High likelihood on purpose:** CKD (`rn-disease-01` to `-05`): a classmate's Renal Exam 1 objectives head it "NO EXAM
  Qs on this". The questions stay, since that was about the Renal course's own exam and CKD's dental care is board material;
  Sam kept it so (2026-11-20, [decisions](../decisions.md)). The merge script that built the content keeps it out.
- **Size:** the biggest bank on the site, about 1.2 MB over the wire on a first visit (200 KB before the page has drawn: the
  content JSON loads behind it), against Heme & Endo Exam 3's 780 KB, and about 850 ms of blocking time on the performance
  suite's slowed phone (Heme & Endo Exam 3: 300-370 ms), nearly all of it the background work after Home has drawn (parsing the
  JSON, the search index of every part's notes). Its budget in `tools/release/budgets.json` is set from that (2026-11-20),
  and raised from 1,500 to 1,800 KB on 2026-11-22, when the professors' slides took it to about 1.6 MB (Sam: "I dont
  want to sacrifice the quality of the material", then "a budget raise is fine"; the page still draws by about 2.5 s, the rest loading behind it);
  chunking the search index is on the [inbox](../tasks/inbox.md). Ask Timmy's content
  for it was about 170-200k tokens by length, which is why Timmy moved to Haiku 5.5 ([decisions](../decisions.md),
  [ask-timmy](../reference/ask-timmy.md)). Checked against the professors' slides and recordings (2026-11-22) it passed
  200k, and Sam put the material first ("I dont want to sacrifice the quality of the material just so we can have ask
  timmy"): **Timmy reads the course the student is in** (Sam: "have Timmy only read the course the student is in"), one
  course's notes, tables, cram sheet and High yield, about 36-87k tokens a question (every course's cram sheet when no
  course is known), and the whole hub only when that isn't enough ([ask-timmy](../reference/ask-timmy.md), "Limits and money"). `tools/timmy/test.mjs` fails a course whose prompt
  reaches 95,000 tokens (Haiku 5.5 costs five times as much past a 100k prompt): a course that grows past it needs its
  notes looked at, or the check moved, with Sam.

- **One-page sheets** (2026-11-22, every hub on the engine: `widget/sheet.js`): every part has one, on screen; it says
  High-yield topics and High-yield points here. It shipped with a Print or save as PDF button (all 70 fit one Letter page),
  which Sam took out the same day ([decisions](../decisions.md)).
- **Its tint on the page** ([BUG-198](../release/bug-log.md), 2026-11-22): until then the hub drew in the engine's default
  grey-purple; one line in `widget/hub.css` (`:root[data-hx-hub="review-of-systems"]`) gives it its violet, the four values
  from `tools/figures/site/style.mjs`. A new hub on the engine needs the same line, or it draws in the default too.

- **Its keys were read in full on 2026-11-24** (the lessons audit, after ten "keyed wrong" reports in a day): 51 of Head & Neck's 68 single-answer items and `f1-biomol-03` pointed one choice past the right answer, from the build; fixed, with `tools/data-fixes/2026-11-24-review-of-systems-keys.sql` recounting their class numbers. Every other course and every fixed-order format was right. A new batch of drafted questions gets the same read before it ships ([build-a-hub](../how-to/build-a-hub.md)'s Check, Sam, 2026-11-24). The same audit settled two facts from standard references (Sam: "fix 5"): Gold's agar is 20% sucrose (`om-viral-01`, the Oral Micro notes' media table), and B cells finish maturing in the spleen (`f1-innate-12`, as `f1-hyper-10` and the notes say). After the merge (#552) the class's numbers on the fixed questions needed a second pass ([BUG-200](../release/bug-log.md): the new keys had set their picks aside), and reports #69-#79 got their replies; #68 (Listen) waits for [BUG-199](../release/bug-log.md). The single-answer choices are shuffled on the card, so where a key sits in `choices` gives nothing away.

- **The exam-eve boss** (2026-11-22, idea board #4, migration_v97: [game-server](../reference/game-server.md)): the Midnight
  Plaque comes up 3 pm to midnight on Wed Dec 2 and Wed Dec 9, the eves of the two mocks, at 3,000 HP each (Sam can set
  either with `eveBoss` on its exam in `hubs.js`), on Home, in the band and, on a wide screen, under Today in the Question Bank. Read how the first went the morning after (inbox).

## Pending

Open items for this hub are lines in [the inbox](../tasks/inbox.md) tagged Review of Systems, and
`vault/tasks/` notes with `hub: review-of-systems`.

## History

Grep the change log (`DEPLOY_NOTES*.md`, its monthly archives included) for `review-of-systems`. Built:
[the task](../tasks/done/2026-11-19-review-of-systems-hub.md). Retrospective (once archived): `LESSONS.md`.

Related: [home](../home.md) · [build-a-hub](../how-to/build-a-hub.md) · [heme-endo-exam3](heme-endo-exam3.md)
