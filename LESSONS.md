# Lessons from archived hubs

Sam's standing rule (2026-09-29): **every time a hub is archived, use all the data gathered on it to improve the
next hubs.** This file is where that lands. It is shared by every session (Claude Code, Cowork, each hub's Claude
Project): read it before building or restructuring a hub, and add to it whenever one is archived.

**Last refreshed: 2026-10-01** (fourth refresh, 4 pm Central, after the perio midterm; all data to date). Sam runs
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

Refreshed 2026-10-01 at 4 pm Central, using all data to date; "since" = since the morning refresh's fixes merged
(5:50 am Central), from `personal_answers`, so mostly the perio midterm morning (exam 10 am) and the MSK Exam 3 eve.
Live hubs: perio (midterm done; **comprehensive final Nov 19, all 9 sessions**) and MSK Exam 3 (Fri Oct 2).

**Did the morning's fixes work?** Small numbers, one exam morning:
- Perio `q3-P02` (report #10; case box now lists the radiographs): 13 of 14 since (79% before).
- 7-option select-alls cut to 5: `q1-M03` 12 of 12 (68% before), `q2-P01` 14 of 21, 67% (42%). **`q3-M01` (UniFe)
  got worse: 5 of 23, 22% (30%).** Per-option ticks (new today) show why: "Plaque index" ticked 13 times against 15-17
  for each right input. Its explanation now says why plaque index tempts; a two-statement and an EXCEPT item test it too.
- `q4-M05` (SRP limitations, 5 of 6 correct): 6 of 19 since (44% before). Ticks: "Motile bacteria invade the pocket
  lining" 8, every other right option 11-16. Explanation now covers it.
- No change: `q4-L11` passive eruption 9 of 16 (54% before), `q1-M02` 7 of 12 (55%), `q1-P05` 8 of 17 (38%).
- MSK: `qz-rickets` 9 of 15 since (50% before), `sl-calcitriol` 5 of 7, `h-dr-hypoCa` 3 of 6, `h-ai-mikulicz` 2 of 2.

**Perio midterm check-ins (n = 14 by 4 pm, all on exam day; later ones go into the next refresh).** Everyone felt
ready (4 or 5 of 5), yet 6 of 14 said it went worse than expected and 1 better. Hub vs exam: About right 9, Hub was
easier 3, Exam asked different things 2. **Unlike GI Exam 2, the people who called the hub easier or different were
not light users:** 168-616 min in the hub (median ~250) vs 70-309 min (median ~130) for "About right". What the exam
had that the hub didn't:
- **Pictures of sutures** (5 of 14): identifying suture types/techniques from images, and tissue response by material.
  The hub has no images (Atlas was retired for inaccurate diagrams), so this is for Sam.
- **Two-statement questions** (2; "statement 1 true, statement 2 false…") and **"all of the following EXCEPT" / "which is
  NOT true"** (1, "lots of" them). The bank had none of either. Added in this run: 20 two-statement and 21 EXCEPT/NOT
  items (bank filter "Two-statement" / "EXCEPT / NOT").
- **Staging/grading details beyond the class charts** (3): severity vs complexity components, Stage III vs IV. Added
  the full 2018 AAP/EFP tables as a review table (complexity factors, extent, direct evidence, phenotype, modifier
  rows) and 12 questions tagged "2018 AAP/EFP tables". The tables say ≥10 cigarettes a day for Grade C; the class said
  "more than 10", so both are named.
- More patient-scenario / case questions (2).

**Perio** (117 people, ~215 h, 15,106 answers, 83% correct). 10-01: 59 people, 47 h (morning before the exam and after
it), 6 under 5 minutes. Since the morning: bank 1,020 min (39 people), notes 417 (24), review tables ~650, mock exam 267
(16; 15 mocks from 10 people at 91%), cram sheet 168 (20), drill 81 (8). Midterm-only settings are removed (scope
filters, "Not on midterm" chips, mock-exam scope, the midterm card); S5-S9 still have only exam-review-guide items
(2-3 tries each, 53-91%), so they need lecture content as each session is taught.

**MSK Exam 3** (62 people, ~106 h, 7,561 answers, 78% correct). 10-01 (exam eve): 39 people, 19 h, **13 of 39 left
within 5 minutes** (11 of 30 on 09-30); still no quick-start row. Bank 640 min (23 people), notes 350 (30), cram 38, drill
26 (5). Only 3 mocks ever (2 people). By lecture: Bone Development 71% (its 6-step orderings at 13-27%), Drugs 74%,
the rest 78-83%. By source: professor quiz 71%, hub 75%, PollEv review 92%.
- Favourite wrong answers fixed today: `h-tu-mdm2` (7 of 14 picked rhabdomyosarcoma), `h-nut-vitA-epith` (zinc's rash),
  `h-tu-gct-demo` (males under 25 = osteochondroma/osteoid osteoma), `h-tu-match` (explanation was "From the tumor
  tables"). 15 EXCEPT/NOT items added from the hub's own tables (the professor quizzes use the format).

**Site-wide**: `search_terms` is still empty: nobody has run a widget search. GI Exam 2 check-ins now 7 (see the retro).

## Standing lessons (read before building a hub)

- **Almost all studying happens in the last 3-4 days.** GI Exam 2: 35% of all time was the day before the exam
  (53 of 78 people); days 5+ out were small. Perio midterm: 52% of all perio time was the day before (57 of 108 people, 91 h). Have every lecture's questions in the hub by ~4 days before the exam,
  and put the quickest high-yield review (Daily Drill, cram sheet, exam hints) where the night-before crowd lands.
- **Lecture notes and the question bank are the hub.** In perio and MSK (per-section data, 2026-09-23 on) notes +
  bank are ~80% of time; the first survey's "most helpful" answers were Question bank 4, Lecture notes 1. Arcade,
  review tables, mock exams and Atlas-style extras each get a few people. Build and polish notes + bank first.
- **Matching and sequence questions score ~30 points lower than MCQ** (GI2: 53% vs 84% MCQ, 74% recall) and are
  over-practised because people retry them. Grade them per pair/step (perio does since 2026-09-26), keep them short
  (4-5 pairs), and check any item under ~15% with 20+ attempts for a grading or wording bug before assuming it is
  just hard (GI2 `gp26`/`mt10`, Crohn vs UC matching, 5-7% over 39 and 67 attempts). **Ordering questions longer than 4-5 steps
  barely work:** MSK's six-step sequences sat at 16-23% over 17-30 attempts each (09-30) even with per-step feedback,
  because one misplaced step makes the whole item wrong. **Select-all questions with many options are the same trap**
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
- **Many visitors bounce.** 40-60% of each hub's visitors spend under 5 minutes in it (GI2 40%, MSK 40%, perio
  61%), and half or more only come on one day. The landing view should get someone to a question or the notes in one tap.
  Perio (2026-09-29): 47 of 58 people saw Course Home, ~30 reached notes or the bank, 23 left within 5 minutes.
  Perio now opens with a one-tap row (Practice questions, Daily drill, Lecture notes); check next refresh whether
  the under-5-minute share drops and which button gets used (`practice=midterm`, `sh-drill=quick`). First read
  (09-30, midterm eve): 6 of 36 under 5 minutes, and "Practice questions" is the button people use.
- **Write questions in the exam's formats, not just its content.** The perio midterm used two-statement items
  (two numbered statements; choices: both true / both false / 1 true 2 false / 1 false 2 true), "all of the following
  EXCEPT" and "which is NOT true", and suture pictures; the hub had none of them, and 6 of 14 check-ins said it went
  worse than expected despite everyone feeling ready (4-5 of 5), heavy users included. Every hub gets a share of
  two-statement and EXCEPT/NOT items from the start (render two-statement choices in that fixed order:
  `fmt:'2stmt'` in perio), and asks Sam early whether the professor uses images. When a class table simplifies a
  published standard (staging/grading), put the full standard beside it and say where they differ.
- **The exam is harder than the hub, and case questions matter.** GI Exam 2 check-ins: 2 of 4 said the hub was
  easier than the exam, and one said it missed "patient box style questions". Every new hub gets case-based
  (Patient Box) questions from the start and some harder two-step items, not only one-fact recall.

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
  bank most helpful (4 of 5 answers), usefulness 4.8/5 average.

## Hub retrospectives

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
A seventh (10-01): About right, readiness 3, better than expected. Later check-ins go into the next refresh.

Exam check-ins and search-term tracking were added so the next retro can answer what this
one couldn't: did the hub match the exam, and what were people looking for that wasn't there.
