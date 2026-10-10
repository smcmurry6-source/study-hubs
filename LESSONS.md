# Lessons from archived hubs

Sam's standing rule (2026-09-29): **every time a hub is archived, use all the data gathered on it to improve the
next hubs.** This file is where that lands. It is shared by every session (Claude Code, Cowork, each hub's Claude
Project): read it before building or restructuring a hub, and add to it whenever one is archived.

**Last refreshed: 2026-10-10** (seventh refresh, full `/lessons-audit`, Saturday 5 pm Central; includes the MSK Exam 3
retrospective). Sam runs
the lessons refresh by hand (`tools/lessons-refresh.md`): it updates this file from all tracked data, reports and
suggestions and ships small fixes to the live hubs. **Before building a new hub, if this date isn't today, run steps 1-3 of
`tools/lessons-refresh.md` first.**

## When a hub is archived: the retrospective

Do this in the same session that archives the hub (while its page is still up, so `tools/dump-banks.js` can read the bank
locally; banks are no longer committed), and tell Sam
what you found.

1. **Pull everything.** Run the queries in `tools/retro.sql` with the Supabase connector (read-only) for that hub
   and its exam date. Use all of it, not just question accuracy:
   - **Time by section** (`activity_pings`, 25 s per ping): which modes and sub-views people actually studied in,
     and how that shifted as the exam got closer.
   - **Clicks and reach** (`ui_clicks`, `ui_click_reach`): which buttons, tabs and widget tools people used and how
     many people found each one. Pair with time: lots of time + few clicks = being read; a feature with under 3
     people = hard to find or not wanted.
   - **Engagement**: people, study days per person, bounces (< 5 min), answers per person, who came back,
     Daily Drill (`drill/daily`), mock scores (`mock_scores`), arcade plays.
   - **Questions**: accuracy by lecture, type and source (join `question_stats` to the saved bank locally),
     the hardest items, the most-picked wrong answers (`question_choices`), questions nobody reached.
   - **Student voice**: exam check-ins (`exam_debriefs`: readiness, how it went, hub vs exam, what the hub missed,
     each next to that person's time and answers), searches with 0 results (`search_terms`), reports
     (`question_flags`, `hub_suggestions`) and survey answers.
   - Perio and MSK Exam 3 are the first hubs with full data (clicks from 2026-09-25, per-section time, the
     15-minute idle rule, Daily Drill, mock scores); GI Exam 2 had no section data and no clicks.
2. **Decide what changes.** Turn findings into concrete changes for the live and next hubs, split into
   *cross-hub* (widget, dashboard, the hub template) and *content/authoring* (question style, which lectures need
   more, what the exam asked that the hub didn't). Things that are clearly bugs or small fixes: fix them (branch +
   PR as usual). Bigger ones: list them for Sam.
   Then turn it into **better questions and better lecture summaries** (see "Using the data for questions and
   notes" below): the retro is only done when the findings are written as authoring guidance, not just numbers.
3. **Write it down here**: a new section under "Hub retrospectives" (numbers + what they mean + what to do), and
   fold anything durable into "Standing lessons" below so the next build sees it without reading every retro.
4. Add a line to `DEPLOY_NOTES.md` "Recent major changes" pointing here.

If the data contradicts a standing lesson, update the lesson; don't keep both.

## Using the data for questions and notes

What each signal tells an author, and what to do with it in the next hub (and in live hubs of the same course):

**Writing questions**
- **Most-picked wrong answer** (`question_choices`): that choice is the class's real misconception. Keep it as a
  distractor (it works), make the explanation say why it's wrong in one sentence, and write a second question that
  tests the same distinction from another angle.
- **Correct 90%+ with many attempts**: the question is too easy or gives itself away (check the length/label
  giveaways fixed on 2026-09-29). Rewrite the distractors to be same-category and length-matched, or drop it.
- **Under ~30% with 20+ attempts**: first rule out a bug, a wrong key or an ambiguous stem (read the reports for
  that id). If it is fair, the concept is hard: add it to exam hints / the cram sheet and to the Daily Drill's
  high-yield pool, and cover it more clearly in the notes.
- **By type**: matching and sequence items score far lower (see below); use them sparingly and grade per pair.
- **By source**: what the professor put in class quizzes and polls is what students practise most and what exams
  echo. Mine those first; tag `src`.
- **Exam check-ins** ("Hub was harder/easier", "Exam asked different things", and what it missed): calibrate
  difficulty and question style to the exam, and add the missed topics to the next hub for the same course/professor.
- **Searches with 0 results**: terms students expected to find. Each is a missing fact, synonym or abbreviation;
  add it to the notes (and a question if it's testable).

**Writing lecture summaries**
- **Time and lecture picks in notes** (`compendium/notes`, `lec=` / `goto-lecture=` clicks): the lectures people
  open most are the ones they find hardest or most tested; give them the most careful summaries, tables and
  mind maps. Lectures nobody opens may be too long to start; lead them with a short "what's tested" list.
- **Plain English vs As taught** (`level=plain` / `level=full`) and **Listen** (`#sh-tts-btn`): if Plain English
  gets used a lot, write it for every lecture from the start; if Listen is used, keep narration current.
- **Low accuracy on a lecture's questions** after people read its notes: the summary isn't landing. Rewrite the
  weakest sections around the misconceptions above (name the trap, then the right answer), add a comparison table
  for look-alikes (e.g. Crohn vs UC), and move exam hints into the relevant paragraph.
- **What the exam asked that the hub missed** (check-ins): add those topics to that lecture's summary, and note the
  professor's emphasis for the next course they teach.

## Live signals (rewritten by each refresh)

Refreshed 2026-10-10, 5 pm Central; "since" = 10-03 (the last refresh that pulled full data). Live hubs: **PCD Fixed
Pros Exam 3 (Thu Oct 15)**, **MSK Exam 4 (Fri Oct 16)**, **Occlusion midterm (Wed Oct 21, final Nov 19)**, perio
(final Nov 19). MSK Exam 3 is archived (retrospective below; its recap went on the dashboard 10-09). No new reports or
suggestions since 10-03, none open; no new survey answers; no searches since 10-01.

**Did the last fixes work?** The 10-04 and 10-07 runs shipped no hub fixes, so there is nothing new to measure; the
10-01 fixes were measured on 10-04 (above-the-line MCQ explanation fixes worked, the matching item didn't). What can be
checked is whether the three hubs built 10-07 follow the standing lessons: every ordering is 5 steps or fewer, every
select-all has 5 options, all three have EXCEPT and Patient Box items, and PCD's and Occlusion's diagram questions answer
the "image labeling" asks. First reads, tiny n: PCD orderings 85% (5 items, ~13 tries each), MSK 4 orderings 50%.

**Dashboard bug fixed in this run:** the 10-08 PCD date fix also changed **MSK Exam 4's** dashboard date to Oct 15
(the hub, its ribbon and the notes say Fri Oct 16). The dashboard would have archived the MSK 4 card, with no Open
button, at 10 pm on exam eve, the night that carries ~40% of a hub's study time, and opened check-ins a day early.
Back to 2026-10-16. Lesson: when a date fix touches the `HUBS` array, diff every entry it changed.

**PCD Fixed Pros Exam 3** (5 days out): 6 people, 9 h, 690 answers from 5 people, **79%**. Bank 454 min of 537 (one or
two heavy users), notes 57 min (all 6 people), drill 12 min (3). By lecture: Cement & Cementation 72% and Bonding
Ceramics 73% lowest; Removing a Crown 95%. Matching 62%, select-all 60%, MCQ 80%. No item has more than 4 tries, so no
question-level fixes yet. Watch Cementation (the biggest lecture, 68 items) after the weekend.

**MSK Exam 4** (6 days out): 10 people, 4 h; 236 answers from 4 people, **59%** (MSK 3 ran ~75% at the same point).
Bank 139 min (5 people), notes 102 min (all 10). 4 of 10 visitors left within 5 minutes. **The 29 Clinical Application
(`CA`) items have no answers yet**, and 38 of 223 items are untried: expected this early. Skin histology layer items
(`sk-granulosum`, `sk-spinosum`, `sk-thin-clue`) are 1 of 4 each; too few tries to act on, check in the next run.

**Occlusion midterm** (11 days out): 2 people, 41 min, 10 answers. Nothing to read yet.

**Perio**: still idle after the midterm (1-2 people a day, under 25 minutes in a week) with the final 6 weeks out.
S5-S9 still have only exam-review-guide items; add them as each session is taught.

**What to expect next week:** two exams on consecutive days (PCD Thu, MSK 4 Fri) split the eve crowd. Expect PCD's eve
on Wed 10-14 and MSK 4's on Thu 10-15, with people doing both on Wednesday. Run the next audit Monday or Tuesday, when
the items have 12+ tries, so explanation fixes land before the eve.

## Standing lessons (read before building a hub)

- **Almost all studying happens in the last 3-4 days.** GI Exam 2: 35% of all time was the day before the exam
  (53 of 78 people); days 5+ out were small. Perio midterm: 42% of all perio time was the day before (57 people, 91 h). MSK Exam 3: 44% (61 of 87 people, 89 h),
  and 26 of those 61 opened the hub for the first time that evening; over half of all MSK answers came on the eve and
  exam morning. Have every lecture's questions in the hub by ~4 days before the exam,
  and put the quickest high-yield review (Daily Drill, cram sheet, exam hints) where the night-before crowd lands.
- **Lecture notes and the question bank are the hub.** In perio and MSK (per-section data, 2026-09-23 on) notes +
  bank are ~80% of time; the first survey's "most helpful" answers were Question bank 4, Lecture notes 1. Arcade,
  review tables, mock exams and Atlas-style extras each get a few people. Build and polish notes + bank first. Final numbers: MSK bank 99 h + notes 62 h of
  204 h; perio bank 98 h + notes 51 h of 217 h. **Both arcades together got 1.4-1.7% of hub time** (MSK 19 people, 3 h;
  perio 30 people, 4 h), and the people who played most were heavy studiers anyway (top 5 arcade players: 31-61 arcade
  minutes each inside 191-631 total). Of 18 arcade games, the most-played had 9 people and 50 runs (MSK Sort Storm);
  only 3 people saved a score in the same game on two different days.
- **Matching and sequence questions score ~30 points lower than MCQ** (GI2: 53% vs 84% MCQ, 74% recall) and are
  over-practised because people retry them. Grade them per pair/step (perio does since 2026-09-26), keep them short
  (4-5 pairs), and check any item under ~15% with 20+ attempts for a grading or wording bug before assuming it is
  just hard (GI2 `gp26`/`mt10`, Crohn vs UC matching, 5-7% over 39 and 67 attempts). **Ordering questions longer than 4-5 steps
  barely work:** MSK's six-step sequences sat at 16-23% over 17-30 attempts each (09-30) even with per-step feedback,
  because one misplaced step makes the whole item wrong. Final MSK numbers: 7 of the 11 items under 50% (15+ tries) were
  orderings, 17-48% over 48-68 tries each, and they dragged Bone Development to the lowest lecture (71%). **Select-all questions with many options are the same trap**
  (perio `q3-M01`, 5 of 7 options correct: 20%); keep them to 4-5 options, and name every option in the explanation. Patient Box select-alls are the worst of all under exam pressure (perio `q1-P05` 3 of 15 right, `q2-P01`
  11 of 34 on midterm eve), and until 2026-10-01 their per-option picks weren't recorded. From then on `question_choices` has one row per ticked
  option (`record_choices`), and the three 7-option perio items are down to 5 options, 3 correct: compare after the final. **Never give two left items
  the same right-hand answer** unless grading compares text: perio `q4-L27` had "4-6 weeks" twice, and picking
  the other copy was marked wrong (20% correct; grading compares text since 2026-09-29).
- **The last lectures before the exam get the least practice and score lowest.** GI2's GI Pharm and GI Path were
  answered ~17 times per question vs ~30 for the early lectures, at 71-73% vs 81-84%. The Daily Drill and mock
  exams should lean toward late-added lectures; say on Course Home when new questions land.
- **Questions from class quizzes/polls are practised most.** GI2's exam-2 quiz and PollEv items averaged 32-38
  attempts per question vs 22 for hub-written ones. Tag the source (`src`) and label them.
- **Look-alike conditions need a side-by-side table, not just paragraphs.** GI2's two Crohn vs UC matching items
  were the hardest in the bank (5-7%) and its GIST/interstitial-cell items were all under 35%. Notes for any
  lecture with paired look-alikes should have a comparison table and a question per distinguishing feature.
- **Many visitors bounce.** All time, 26-40% of each hub's visitors spent under 5 minutes in it (GI2 31 of 78, MSK 23
  of 87, perio 46 of 120), and about half came on one day only (37 of 78, 40 of 87, 65 of 120). Bounces are lowest on
  the exam eve (perio 3 of 57, MSK 5 of 61) and highest on exam morning (MSK 15 of 47). The landing view should get someone to a question or the notes in one tap.
  Perio (2026-09-29): 47 of 58 people saw Course Home, ~30 reached notes or the bank, 23 left within 5 minutes.
  Perio now opens with a one-tap row (Practice questions, Daily drill, Lecture notes); check next refresh whether
  the under-5-minute share drops and which button gets used (`practice=midterm`, `sh-drill=quick`). First read
  (09-30, midterm eve): 6 of 36 under 5 minutes, and "Practice questions" is the button people use.
- **Write questions in the exam's formats, not just its content.** The perio midterm used two-statement items
  (two numbered statements; choices: both true / both false / 1 true 2 false / 1 false 2 true), "all of the following
  EXCEPT" and "which is NOT true", and suture pictures; the hub had none of them, and 6 of 14 check-ins said it went
  worse than expected despite everyone feeling ready (4-5 of 5), heavy users included. Final perio count, n = 24 check-ins: Hub was easier 9, Exam asked different
  things 4, About right 11; MSK Exam 3's check-ins (n = 8: About right 4, harder 2, easier 1, different 1) asked for EXCEPT items, image labeling and Patient Box items that test mechanisms. Every hub gets a share of
  two-statement and EXCEPT/NOT items from the start (render two-statement choices in that fixed order:
  `fmt:'2stmt'` in perio), and asks Sam early whether the professor uses images. When a class table simplifies a
  published standard (staging/grading), put the full standard beside it and say where they differ.
- **The exam is harder than the hub, and case questions matter.** GI Exam 2 check-ins: 2 of 4 said the hub was
  easier than the exam, and one said it missed "patient box style questions". Every new hub gets case-based
  (Patient Box) questions from the start and some harder two-step items, not only one-fact recall.

- **Dates live in two places; check both.** A hub's own `EXAM_DATE` / `SH_EXPORT.exams` and its dashboard `HUBS` entry
  must agree: the dashboard entry drives the auto-archive (10 pm on the last exam day) and check-ins. On 10-08 a PCD
  date fix moved MSK Exam 4's dashboard date a day early by mistake, which would have archived its card on exam eve
  (caught in the 10-10 audit). After any `HUBS` date edit, compare each hub's two dates.
- **Use stops the day after the exam, even when the next exam is weeks away.** Perio had 63 people on midterm day, then
  2 on 10-02 and 1 on 10-03, with a cumulative final 7 weeks out. Nothing in these hubs pulls people back between exams
  (the Daily Drill reached 17-20 people per hub, 8 of them on 2+ days, all in exam week). A hub meant for steady use
  needs its own reason to return (a short daily set, new content announced, a goal per week), and should expect to be
  measured by exam-week use regardless.
- **Explanation fixes that name the favorite wrong answer work; for matching items they don't.** 10-01 fixes on MSK:
  five MCQs went from 35-52% to 67-82% within a day (`h-nut-vitA-epith`, `h-tu-gct-demo`, `h-ai-mikulicz`, `qz-rickets`,
  `sl-calcitriol`), while the matching item `h-tu-match` went from 46% to 34%. Fix matching items by shortening them or
  splitting them into MCQs, not by rewriting the explanation.

## What student reports and surveys have taught (keep adding)

Reports come in through each question's Report button (`question_flags`, with the question id and section), the
suggestion box (`hub_suggestions`) and dashboard surveys (`survey_responses`). Read all of them in every retro;
each one is usually a pattern, not a one-off, so fix the pattern across the bank and write it down here.

- **Every question type needs obvious right/wrong feedback.** Two of the first four real reports were about this:
  self-graded recall cards looked unchanged after tapping "I got it" (perio, fixed 2026-09-28), and ordering
  questions didn't say clearly whether the order was right (perio `q4-49`, fixed 2026-09-29 in #19: finished
  sequences turn green/red, show where each misplaced step belongs and a verdict line; the "picked" style had been
  overriding the result colours). Before shipping a new question type, answer one right
  and one wrong on a phone and check the result is unmistakable.
- **Answer choices must not give the answer away.** Perio `q2-02` labelled the wrong choices "(… monofilament)"
  while the stem asked for the braided suture. An audit then found 24 more giveaways (labels that rule a choice out,
  stem words echoed only by the answer, throwaway distractors). Write distractors that are the same category,
  length and form as the answer, and keep qualifiers in the explanation, not the choices.
- **Every explanation should name the class's favourite wrong answer and say why it's wrong.** The most-picked
  wrong choices (`question_choices`) on the hardest items were ones the explanation didn't mention: perio `q2-03`
  (silk), `q4-15` (Class 1), MSK `sl-calcitriol` (cholecalciferol). Fixed 2026-09-29; write explanations this way
  from the start: key fact, then one sentence per tempting distractor. It works: `q2-03` went from 30% to 61% right after its
  explanation named silk (09-30).
- **A case question's explanation may only use facts in the case.** Perio `q3-P02` (report #10, midterm morning)
  explained Grade C by "bone loss this young", but the Patient Box gave pockets only. Put every finding the answer
  rests on in the box (radiographs included), then walk the stage, extent and grade from it.
- **Explanations must agree with the key and show the number.** Perio `q3-47`'s explanation didn't match its answer
  and mixed up two slide figures. When a question tests a figure, the explanation states it and names which figure
  it is, and separates it from look-alike numbers.
- **Low-value questions get reported.** "Not a super helpful question" (`q4-49`, disclosing-plaque order). Trivial
  procedural orderings aren't worth a slot; test the decision or the reason instead.
- **Students asked for spaced, missed-question review.** The first survey's only written answer asked for a daily
  drill of missed and high-yield questions, which became the Daily Drill (2026-09-28). The same survey: Question
  bank most helpful (5 of 8 answers by 10-03; Lecture notes 2, Review tables 1), usefulness 4.9/5 average.
- **Students ask for ways to remember, not just to be told.** Suggestion #2 (MSK, exam eve): "when you missed a
  question, the explanation gave you a way to remember it... a mnemonic or cue" (memory cues shipped 10-02 for perio and
  MSK). Suggestion #3: an undo / start-over button for ordering questions (shipped 10-02). Build both in from the start.
- **What check-ins say the hub missed lines up with the weakest data.** MSK's check-ins asked for "location of bone
  formation and differentiation", the lowest lecture (Bone Development 71%, its orderings 18-48%); perio's asked for
  staging/grading and EXCEPT items, the formats the bank lacked. Read the check-ins next to accuracy by lecture.

## Hub retrospectives

### MSK Exam 3 (`msk-exam3`), exam 2026-10-02, archived 2026-10-02 (written 2026-10-10)

Data: 87 people, ~203 h (12,182 min); 39 came on one day only, 32 on 3+ days, median 52 min each, 23 under 5 min.
**17,008 answers from 68 people** (median 189 each, most 1,095; 35 answered on 2+ days), 81% overall. Night before
(10-01): 5,342 min from 61 people (44% of all time), 26 of them first-time visitors; exam morning 1,582 min from 47.
14 people studied after midnight. 25 mocks from 15 people, 86% average (20 of them on the eve). Recap published to the
dashboard 2026-10-09.

| Section | Minutes | People |
|---|---|---|
| Question bank | 5,953 | 61 |
| Lecture notes | 3,707 | 80 |
| Mock exam | 458 | 23 |
| Weak Spots | 419 | 22 |
| Cram sheet | 385 | 38 |
| Daily Drill | 356 | 17 |
| Review tables (all) | ~570 | 28 (drugs) |
| Exam hints | 186 | 25 |
| Arcade (all) | ~160 | 16 |

Notes: lecture picks were even (68-107 opens each; Cartilage, Joints and Bone most), Plain English 61 vs As taught 48,
mind map 54, Listen 44 clicks. Arcade: Sort Storm 50 runs from 9 people, every other game 1-5 runs.

| By lecture (current bank, `rv-*` items removed) | Accuracy | Tries per question |
|---|---|---|
| Bone Development, Remodeling & Homeostasis | 75% | 57 |
| Tumors of Bone & Soft Tissue | 76% | 44 |
| Drugs Affecting Bone Mineral Homeostasis | 77% | 46 |
| Cartilage | 77% | 64 |
| Bone: Composition & Cells | 80% | 60 |
| Nutritional Diseases | 81% | 60 |
| Joint Diseases | 81% | 56 |
| Hereditary & Acquired; Bone Repair | 82% | 53 |
| Autoimmune Diseases | 84% | 50 |

By type: MCQ 81%, matching 73%, **sequence 36%** (9 items). By source: hub-written 76%, class quiz 79%, lecture quiz 81%,
Slido 86%, definition-to-term 87% (PollEv review set 91% before it was removed). Hardest: six orderings
(`h-jt-ra-seq` 17%, `h-bd-endo-seq` 18%, `h-ca-collagen-seq` 25%, `h-he-fx-seq` 30%, `h-bd-remodel` 30%,
`h-bd-oc-diff` 40%, over 48-68 tries), the tumor-location matching item `h-tu-match` 38%, then EXCEPT items `ex-zinc`
43% (night blindness picked 11 times: it is a vitamin A sign) and `ex-osteosarc` 48% (the age peak picked as the false
one). Every question got 23+ tries.

Check-ins, **n = 8** (later ones go into the next audit): hub vs exam About right 4, Hub was harder 2, Hub was easier 1,
Exam asked different things 1; went better than expected 4, as expected 3, worse 1; readiness 3-5. Against each
person's use: the one "Exam asked different things" was the heaviest user (853 min, 1,095 answers, 71%); the two "Hub
was harder" were among the most accurate (84-87%, 277-476 min); the one "Hub was easier" studied 560 min at 77%. Unlike
GI Exam 2, calling the hub easier didn't go with less study. Missed (as topics): Patient Box questions that test how
structures and diseases work (twice), where bone forms and how cells differentiate, EXCEPT items, image labeling, RA.

What changes because of it: (1) orderings capped at 5 steps (already in the MSK 4, PCD and Occlusion builds: all their
orderings are 3-5 steps); (2) Patient Box, EXCEPT and diagram questions from the start (all three new hubs have them);
(3) the night-before landing matters most: 26 of 61 eve visitors were new, so the quick-start row and Daily Drill stay
at the top of Course Home; (4) arcades stay a small reskin, not new work (under 2% of time again). Cleanup still to do
by hand: remove `hubs/msk-exam3/` (its card leaves the dashboard 10-12) and optionally move its entry into
`ARCHIVED_HUBS`.

### GI Exam 2 (`hepatobiliary`), exam 2026-09-18, archived 2026-09-23 (written 2026-09-29, after the fact)

Data: 78 people, ~170 h (10,197 min in the recap, capped at 3 h per sitting); 37 came on one day only, 26 on 3+
days, median 32 min each, 31 under 5 min; 9,974 answers from 53 people, all 404 questions answered at least once.
Night before: 3,588 min from 53 people; 14 people studied after midnight. No section, click, mock or search data
(section tracking only started working for this hub after it was archived).

| By lecture | Accuracy | Attempts per question |
|---|---|---|
| GI Pharmacology | 71% | 17 |
| GI Pathology | 73% | 17 |
| Liver Physiology | 73% | 26 |
| Liver & Biliary Pathology | 75% | 20 |
| Clinical Applications for Dentistry | 75% | 21 |
| Fluid & Electrolytes | 76% | 30 |
| Liver & GB Histology | 79% | 24 |
| Digestion & Absorption | 81% | 30 |
| Intestine Histology | 82% | 26 |
| Pancreatic & Biliary Secretion | 84% | 34 |

By type: MCQ 84%, recall 74%, matching 53%, sequence 53%. Hardest: `gp26` and `mt10` (Crohn vs UC matching,
5% and 7%), `hb89` (hepatic iron-transport glycoprotein, 23%), `fl13` (vomiting reflex sequence, 28%), `hb19`
(methotrexate, 30%), `gp31` (GIST KIT mutation, 30%). Mode opens: Compendium 426, Game 59, Atlas 32, Quest 27.

What changed because of it: the standing lessons above (per-pair grading and the late-lecture gap feed the Daily
Drill and future banks). Check-ins (n = 6 by 10-01, against each person's own time in the hub): the three "About right" studied 631-980 min
(598-813 answers) and felt ready (4, 4, 5); the two "Hub was easier" studied 166-176 min (187-260 answers), readiness
4 and 2, one "worse than expected"; one "Hub was harder" studied 85 min (290 answers), readiness 3, "better than
expected". Small numbers, but who calls the hub easier isn't who used it most. Missed: "patient box style questions".
A seventh (10-01): About right, readiness 3, better than expected. An eighth (10-01 evening): About right,
readiness 4, as expected, 37 min in the hub. Later check-ins go into the next refresh.

Exam check-ins and search-term tracking were added so the next retro can answer what this
one couldn't: did the hub match the exam, and what were people looking for that wasn't there.
