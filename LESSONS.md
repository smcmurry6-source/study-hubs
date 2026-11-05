# Lessons from archived hubs

Sam's standing rule (2026-09-29): **every time a hub is archived, use all the data gathered on it to improve the
next hubs.** This file is where that lands. It is shared by every session (Claude Code, Cowork, each hub's Claude
Project): read it before building or restructuring a hub, and add to it whenever one is archived.

**Last refreshed: 2026-11-04** (full audit, evening; PCD Implants' exam is Friday). Sam runs
the lessons refresh by hand (`tools/lessons-refresh.md`): it updates this file from all tracked data, reports and
suggestions and ships small fixes to the live hubs. **Before building a new hub, if this date isn't today, run steps 1-3 of
`tools/lessons-refresh.md` first.**

## When a hub is archived: the retrospective

Do this in the same session that archives the hub (while its page is still up, so `tools/dump-banks.js` can read the bank
locally; banks are no longer committed), and tell Sam
what you found.

1. **Pull everything.** Run the queries in `tools/retro.sql` with the Supabase connector (read-only) for that hub
   and its exam date. Use all of it, not just question accuracy:
   - **Time by section** (`activity_hourly`, n pings of 25 s per hour; raw pings are kept 30 days): which modes and sub-views people actually studied in,
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

**2026-11-04 evening (full audit, 9:45 pm Central).** "Since" = this morning's audit, whose fixes went live at 9 am. Live hubs: **PCD
Implants Exam 1** (Fri 11-6 on Canvas, 7 am-8 pm: tomorrow is the eve), Special Patient Care (Canvas window 11-6 to 11-13), Occlusion
and perio (finals 11-19). Nothing newly archived.

**Student voice since this morning:** suggestion #14 (PCD Implants, 8:40 pm), "a lot of the statement questions seem to all have the
same answer... the select all being options 1,2,4 a lot." **Right**: 36 of 46 two-statement keys were "Statement 1 is true; statement 2
is false", statement 1 was true in all 30 numbered items (28 included statement 2: "1, 2 and 4" 17 times, "1, 2 and 3" 11), and the
second choice was the key in 23 of 30. Special Patient Care, on the same engine, had statement 1 true in all 24 of its numbered items.
Accuracy didn't show anyone using the pattern yet (items keyed "1 true, 2 false" 81%, the others 86-92%), but the practice was teaching
a habit the exam won't reward. **Fixed in both hubs** (below), and CI now fails a hub whose statement keys form a pattern. One more
Occlusion midterm check-in (n = 17: About right 8, Exam asked different things 7, Hub was easier 2). Four survey skips, no answers.
**Search** (`search_terms`): 2 searches in the widget since 10-16 and one person searching inside a bank. Not broken (`record_search`
is granted and called), just unused.

**Did the last refresh work?** ("since" = answers after 9 am)
- `bm-goodacre` (#37, the percentages taken out of its choices): 9/9 before, 9/14 since. The giveaway was real.
- Explanations that now name the favorite wrong answer: `ev-misch` 12/24 then 12/19 since, `bm-moment` 10/18 then 10/16, `ev-blade`
  14/23 then 11/18. Flat to slightly up, on small numbers.
- **Select-all ticks arrive now** (`question_choices` rows for `tm-mm-*`, `gs-mm-1` and the rest). `tm-mm-2` (platform switching, 4 of
  5 options right) is missed by leaving out the definition itself ("Abutment narrower than the implant", the least-ticked right
  option); `tm-mm-1` (screw-retained advantages, 2 of 5) by adding a cement-retained advantage. Since 9 am: `tm-mm-1` 8/12, `tm-mm-2`
  6/12, `tm-mm-3` 6/12.
- **"Practiced least" on Home** (10:15 am): practice did move to the last four lectures (Imaging, CBCT, Surgery, Guided: 18% of all
  answers before, 31% after; 10-15 answerers each instead of 7-9; L1-L2 from 43% to 24%), **but not through the new row: nobody
  tapped it.** "Where to next" got 2 taps in two days (Weak, Missed). People got there through the bank in order, the lecture picker (up
  to 9 people per lecture) and "Not answered yet" (12). On Home, the quick-start row is what gets tapped ("Practice questions" 7
  people today, the notes button 8).

**Per hub:**
- **PCD Implants** (the eve is tomorrow): 66 people, 133 h (11-03: 51 people, 60 h; 11-04: 58 people, 72 h, 15 of them new); 43 came on
  2+ days, 6 stayed under 5 min. 9,185 answers from 45 people (median 125), 88%. Since 9 am: notes 2,107 min (43 people), bank 1,657
  (38), Home 65 (26), Timmy Time 55 and the mock 49 (a few people each), Daily Drill 22. By format: true/false 91%, MCQ 89%, numbered
  87%, matching 86%, two-statement 83%, select-all 70% (11 items). By lecture 84-92%, Evolution lowest (84%) with the most practice.
  Hardest (12+ tries): `tm-mm-2` 48%, `tm-mm-1` 50%, `ev-misch` 55%, `tm-mm-3` 56%, `bm-moment` 59%, `im-template-vdo` 60% (6 of 15 picked
  "to make room for the drill and the guide sleeves": **fixed**, the explanation says the template is worn for the scan and sleeves
  belong to the surgical guide). Question health: five "stronger students miss it more" flags (`in-num-3`, `bm-order`, `bm-occ-goals`,
  `ev-frialit`, `tm-depth`; 8-13 people per half). Each key checked against the notes and right: for Sam's list, not a change.
  **Statement keys, fixed tonight:** two-statement keys are now 12 / 11 / 11 / 12 over the four choices (7 items swapped their two
  statements; 8 had the false statement made true and 10 the true one made false by one taught detail, every fact from the item's
  own explanation and the notes). Numbered keys are 7 / 8 / 8 / 7 by position, the false statement sits at every number (statement 1
  true in 22 of 30), three are keyed "1, 2, 3 and 4" and two have two true. Next: on the eve, two-statement accuracy should dip now
  that the pattern is gone; that is the point, not a regression.
- **Special Patient Care** (window opens Fri): 12 people, 6 h all time, 2 today. Numbered statements reordered (the false one at every
  number), four two-statement items swapped and two made "both false" (keys 12 / 6 / 10 / 12).
- **Occlusion**: 4 people today, 16 min. **Perio**: 11 people today, 328 min, its most since the midterm (final 11-19).

**Feature use, Heme & Endo (10-27 to 10-30):** "Try it again" reached 63 of its 67 answerers (4,258 retries shown, 79% right); **High
likelihood** order 23 people and "High likelihood only" 21, and the likely-tagged questions took 40% of all its tries (10,133 of 25,399) at the
bank's average 82%. Pins: 1 person (Occlusion). Device links: 4 made from Stats (`link:linked`), 1 "Yes" from the prompt.

**Feature use, all hubs, to 10-19** (asked by Sam; from clicks, pings and achievements):
- **Timmy Time podcast** (MSK 4, live from 4:30 pm on the eve): 21 people pressed play, 20 logged listening, 287 min in
  all; 15 on the eve (of 58 MSK 4 visitors that day), 7 on exam morning. 10 listened under 5 min, 5 for 5-15, 2 for 15-30
  and **3 for 40+ min** (the whole 42-minute episode). Speed button 16 people, chapters 13.
- **Timmy Tooth**: **35 adopted** (15 on launch day, 10-01; 28 with the Adopt button, 7 by closing the introduction, which
  also adopts). 33 of them studied in the last week, 25 tapped him since 10-13, 16 earned the perfect-health trophy, 3
  brought him back from 0 HP. **Turned off after adopting: 2** used "Turn off Timmy"; 3 more pressed an "Off" in Settings,
  which may have been his or another setting. **"No thanks" in his introduction: at most 1 person** (every other dashboard
  "No thanks" matches a survey skip that day). So the ~50 dashboard users who haven't adopted him never opened his
  introduction: he is still perched on their name on the dashboard (he only follows you into hubs once adopted). Sam (10-20): he stays there and keeps asking to be tapped.
- **Listen**: 23 people have ever pressed it (MSK 3 11, perio 9, Occlusion 7, PCD 6, MSK 4 6); ~4 used the floating dock.
  **Mind maps**: 36 people (MSK 3 23, PCD 14, perio 11, Occlusion 4, MSK 4 2). **Highlighter** (10-15): 12 people (Occlusion 5
  with 133 highlights, MSK 4 6, PCD 1).
- **Names**: 12 people have a name of their own (2 set today); 47 have opened the name editor.
- **MSK 4 interactive diagrams**: 18 of 71 visitors used them (10 the junction's drug picker, 14 the sarcomere slider or
  Play); its 8 picture questions got 19-45 tries each, 62-89% right.
- **Typing TIMMY**: never recorded (the count lived only on each device), so unknown before 10-20.

**New tracking from 10-20** (`migration_v37`, table `feature_events`, `window.shTrack` in `widget/clicks.js`): page loads
on every page (dashboard and About included), a once-a-day snapshot of each visitor's settings (Timmy Tooth on, dashboard
only or off; adopted; surprises, theme, font, size, music, accent, own name), settings changes, every easter egg (TIMMY
summons as `egg:timmy-start`), how Timmy Tooth's introduction ends (Adopt, closed, No thanks, at which step), podcast play,
seconds heard and 25/50/75/95% of the episode heard, Listen starts by level and lecture, minutes heard and finishes,
diagrams on screen, moved or tapped, mind maps opened, names set or reset. Read it in `review/` -> Clicks -> Features, or
`select hub, kind, count(distinct visitor_id), sum(n) from feature_events group by 1, 2`. (Three test rows under hub
`zz-test` can be deleted.)

## Standing lessons (read before building a hub)

- **Almost all studying happens in the last 3-4 days.** GI Exam 2: 35% of all time was the day before the exam
  (53 of 78 people); days 5+ out were small. Perio midterm: 42% of all perio time was the day before (57 people, 91 h). MSK Exam 3: 44% (61 of 87 people, 89 h),
  and 26 of those 61 opened the hub for the first time that evening; over half of all MSK answers came on the eve and
  exam morning. Have every lecture's questions in the hub by ~4 days before the exam,
  and put the quickest high-yield review (Daily Drill, cram sheet, exam hints) where the night-before crowd lands.
- **Lecture notes and the question bank are the hub.** In perio and MSK (per-section data, 2026-09-23 on) notes +
  bank are ~80% of time; the first survey's "most helpful" answers were Question bank 4, Lecture notes 1. Arcade,
  review tables, mock exams and Atlas-style extras each get a few people. Build and polish notes + bank first. Final numbers: MSK bank 99 h + notes 62 h of
  204 h; perio bank 98 h + notes 51 h of 217 h; PCD 3 bank 106 h + notes 77 h of 212 h; MSK 4 bank 60 h + notes 45 h of 131 h.
  **The extras each reach a minority**: across all hubs to 10-19, Listen 23 people ever, mind maps 36, the highlighter 12,
  MSK 4's interactive diagrams 18 of 71, the Timmy Time podcast 20 (a third of the MSK 4 eve crowd; 3 heard it all). **Both arcades together got 1.4-1.7% of hub time** (MSK 19 people, 3 h;
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
  option (`record_choices`), and the three 7-option perio items are down to 5 options, 3 correct: compare after the final. **But only perio's
  engine sent them**: the Occlusion engine and every hub copied from it (Heme & Endo, Special Patient Care, PCD Implants) recorded no
  select-all ticks until 2026-11-04, so PCD Implants' 39% `tm-mm-1` couldn't be diagnosed. A hub's answered event carries `picks` for a
  select-all (its `recordAnswer`); after adding a question type, check that a `question_choices` row lands for it. **Never give two left items
  the same right-hand answer** unless grading compares text: perio `q4-L27` had "4-6 weeks" twice, and picking
  the other copy was marked wrong (20% correct; grading compares text since 2026-09-29).
- **The last lectures before the exam get the least practice and score lowest.** GI2's GI Pharm and GI Path were
  answered ~17 times per question vs ~30 for the early lectures, at 71-73% vs 81-84%. Still true: MSK 4's last lecture
  (NMJ) got 26 tries per question vs 38-45, and Occlusion's Applying Occlusion 7.7 vs 25.5 for Lecture 1 on its eve-1. The Daily Drill and mock
  exams should lean toward late-added lectures; say on Course Home when new questions land. **It is bank order too, not only arrival:**
  PCD Implants had all nine lectures from its first day, and two days out practice still fell lecture by lecture (23 of 31 answerers on
  L1-L2, 6-7 on each of the last four, 1.5-5 tries per question vs 18), because the bank opens "In order" and people start at lecture 1.
  Point Home's "Where to next", the drill and the mock at the lectures with the fewest answers, whenever they were added.
  **But steer through what people already tap:** Home's "Practiced least" row (11-04) got no taps on its first day while practice
  moved to the late lectures anyway (bank order, the lecture picker, "Not answered yet"); "Where to next" got 2 taps in two days. The
  quick-start row and the bank's own filters are where a nudge lands.
- **Questions from class quizzes/polls are practised most.** GI2's exam-2 quiz and PollEv items averaged 32-38
  attempts per question vs 22 for hub-written ones. Tag the source (`src`) and label them. The same goes for the
  professors' own hints: PCD 3's `hint` items (from the course's exam-hint email) got 49 tries per question vs 35-40, and
  a check-in said "the exam followed the hints a lot". When a course sends hints, build the blueprint and questions on them.
- **Look-alike conditions need a side-by-side table, not just paragraphs.** GI2's two Crohn vs UC matching items
  were the hardest in the bank (5-7%) and its GIST/interstitial-cell items were all under 35%. Notes for any
  lecture with paired look-alikes should have a comparison table and a question per distinguishing feature.
  Students ask for them too (survey round 2: "comparative summary charts of related material to help recognize
  patterns"), so every hub's Review gets a **Side by side** group of comparison charts built from its hardest items
  (Occlusion has the first, 2026-10-20), and every Review group is labeled with its lecture ("Review section should
  match lecture titles"): name a group after its lecture when it covers one lecture.
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
  worse than expected despite everyone feeling ready (4-5 of 5), heavy users included. Final perio count, n = 25 check-ins: Hub was easier 10, Exam asked different
  things 4, About right 11; MSK Exam 3's check-ins (n = 8: About right 4, harder 2, easier 1, different 1) asked for EXCEPT items, image labeling and Patient Box items that test mechanisms. A late perio check-in (n = 27) asked for "cases with pictures, charts and radiographs":
  Patient Box items should show the chart or radiograph finding, not only describe it. Every hub gets a share of
  two-statement and EXCEPT/NOT items from the start (render two-statement choices in that fixed order:
  `fmt:'2stmt'` in perio), and asks Sam early whether the professor uses images. When a class table simplifies a
  published standard (staging/grading), put the full standard beside it and say where they differ.
- **Two-statement items weren't enough on their own: add numbered-statement items and the professor's wording.** Occlusion
  midterm check-ins (n = 14, 7 "worse than expected"): the exam had two-statement true/false, "pick the numbers" items (four to
  seven numbered statements, choices are combinations) and "tricky wording". Every hub from Heme/Endo Exam 1 on gets a few
  numbered-statement items per lecture besides the two-statement and true/false rule, and stems phrased the way that
  professor asks (NOT/EXCEPT, "most likely", "best explains"), drawn from how they word their own slide questions. **A standing
  rule since 2026-10-28** (`vault/rules/numbered-statements.md`: at least 2 per taught lecture, CI-checked); Occlusion got
  16 (`nums()`), and the final will show whether they close the "Exam asked different things" gap. **First read, Heme & Endo Exam 1**
  (the first hub built with numbered items, the professors' focus lists and an in-class review set from the start): of 10 people who
  checked in, 8 said "About right", 1 "Hub was harder", **none "Exam asked different things"** (13 by 11-04: 10 About right, 2 harder). The
  same people moved: of the 7 who said the Occlusion midterm "asked different things", 5 checked in after Heme & Endo too, and 4 said About
  right, 1 Hub was harder (two courses and professors, so a pointer, not proof). Statement formats are the hardest in its
  bank (two-statement 73%, numbered 75%, true/false 84%, plain MCQ 83%): keep them, they are where the practice is.
- **The exam is harder than the hub, and case questions matter.** GI Exam 2 check-ins: 2 of 4 said the hub was
  easier than the exam, and one said it missed "patient box style questions". Every new hub gets case-based
  (Patient Box) questions from the start and some harder two-step items, not only one-fact recall.

- **Draw a figure the way the professor's slide draws it.** A view can be correct and still the opposite of the slide:
  Occlusion's horizontal envelope had anterior at the top (true from above), Dr. Givan's slide has it at the bottom, and on exam
  day a student wrote that it was confusing because "he's more likely to ask questions from his version" (suggestion #11).
  Before a figure ships, put it next to the slide: same orientation, same sides, same numbering where possible, and say in the
  caption which way it faces. Fix figures in their build source, never only in the built hub.
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
  splitting them into MCQs, not by rewriting the explanation. **The same goes for two-statement and true/false items**: Heme & Endo's
  10-29 fixes lifted MCQs and numbered items 10-28 points (`pa-num-1` 52% -> 80%, `gr-ghrelin` 50% -> 71%, `td-num-2` 42% -> 62%) while
  `ca-2s-4` stayed at 41% and `pa-tf-3` at 53-55%. When a statement item stays low, make the false detail plainer (one taught number or
  name) or add a plain MCQ on the same fact; don't expect the explanation to fix it.

- **A report that says the key contradicts the case moves accuracy more than an added sentence.** 10-13 evening: the two
  keys rewritten from reports went 47% -> 14/14 (`ce-isolation`) and 48% -> 70% (`ve-pbox-3`); of five explanations that
  only added a line about the favorite wrong answer, two rose 20 points and three stayed flat while the bank rose 5. And the
  matching item `ce-cure-match` (52%) did better as two MCQs (72-75%), as the 10-01 MSK data predicted.
- **The heaviest users are the ones who say "Exam asked different things"; read their "missed" first.** MSK 3: the one
  such check-in was the heaviest user. MSK 4: all three (215-450 min, 504-653 answers, 77-87%). PCD 3: the person with the
  most answers (933 at 91%). What they ask for is consistent: **application questions** (PCD: "what cement for what type of
  crown"; Occlusion suggestion #7; perio "more diagnostic questions"; MSK 3 and GI 2 Patient Box items that test how
  things work) and the lecture's emphasis over its details (MSK 4: "more specific definitions, pathways", "the hub asked
  more low-yield questions"). Write fewer product-trivia items and more decision items (this patient, this restoration,
  which material or drug and why).
- **A miss re-asked soon is almost always right; a day later, a fifth to a third are missed again.** Every answer after a miss,
  by the gap (10-27): within 30 minutes 88-96% right (Heme/Endo 96% of 305, Occlusion 91% of 568, PCD 3 94%, MSK 4 88%), 30
  minutes to 12 hours 79-85%, **12 hours or more 69-80%** (Occlusion 80% of 963, PCD 3 80% of 459, MSK 4 69% of 373). "Try it again"
  (95% right) and Weak Spots in the same sitting show the explanation was read, not that it stuck. The next-day re-ask is what
  catches the rest: in exam week, put yesterday's misses first in the Daily Drill and on Home, and say so ("you missed these
  yesterday"), rather than adding more same-session retries.
- **Track the last step of a flow, and send it before the page moves on.** The "Is this your other device?" prompt (10-21) logged
  its shown / yes / code clicks but its `linked` event fired just before a reload, so it never arrived, and Stats → Link my devices
  logged nothing: a week later we could not tell whether any link came from it (none did, by `visitor_links`). Any feature that
  ends in a reload or a page change calls `shClicks.flush()` after its last `shTrack`, and every path to the same outcome tracks it.
  A prompt that needs two devices and a code completes rarely (0 of 2 "Yes" in a week); if it matters, make the second device's
  step shorter rather than asking more often.
- **Exclude automated visitors before counting people.** Browser sessions that test or screenshot the live site make a new
  visitor id per page and log one 25 s ping each (24 in ten minutes on MSK 4, 10-14). They inflate people and bounce rates;
  the widget ignores automated browsers from 2026-10-15; drop bursts of one-ping visitors in data before that.
- **Check-ins and surveys speak for the heavy users.** Every check-in group so far studied several times its hub's median
  (GI 2: respondents' median 177 minutes against 29 for everyone), and 169 of 190 people shown a survey said "No thanks"
  (to 11-04). Read "About right" next to the use data, never as the class's verdict; the people who bounced aren't in it.
- **People decline a tour offered on arrival, but finish one they choose.** Dashboard tour: 12 of 97 shown the prompt
  started it, 8 finished; hub tours 11 of 118, 9 finished (10-21 to 11-04). Teach a feature where it's used (a one-line
  tip), and keep the full tour in the menu.
- **Cross-hub numbers go through the governance notes.** Sections are named differently per hub (`sh_surface()`), a
  "person" is a browser, `question_stats` counts retries, and coverage starts on different dates:
  [analytics-data-quality](vault/reference/analytics-data-quality.md). The admin page's Insights tab puts every hub side by
  side ([insights-dashboard](vault/reference/insights-dashboard.md), first reading 2026-11-04: cramming rose to 83-90% of
  pre-exam time in the last 3 days for MSK 4, Occlusion and Heme & Endo, from 65-76% before).

## What student reports and surveys have taught (keep adding)

Reports come in through each question's Report button (`question_flags`, with the question id and section), the
suggestion box (`hub_suggestions`) and dashboard surveys (`survey_responses`). Read all of them in every retro;
each one is usually a pattern, not a one-off, so fix the pattern across the bank and write it down here.

- **Every question type needs obvious right/wrong feedback.** Two of the first four real reports were about this:
  self-graded recall cards looked unchanged after tapping "I got it" (perio, fixed 2026-09-28), and ordering
  questions didn't say clearly whether the order was right (perio `q4-49`, fixed 2026-09-29 in #19: finished
  sequences turn green/red, show where each misplaced step belongs and a verdict line; the "picked" style had been
  overriding the result colours). Before shipping a new question type, answer one right
  and one wrong on a phone and check the result is unmistakable. The same goes for the state **before** grading: PCD report #14 (select-all `ce-reqs`)
  said it wasn't clear which options were picked (only a thin accent border); select-all options now show a tick box
  that fills when picked (PCD, MSK 4, Occlusion, 2026-10-13).
- **A multi-step item must say which step missed.** Occlusion report #28 (exam morning): the cusp game's Movements round
  scores only when both the movement and the cusp are right, so a right cusp after a wrong movement lit green under "Not
  quite." and the explanation named the cusp the student had picked, which read as being marked wrong. Any item with
  steps (two-part rounds, orderings, case sets) gets a verdict per step, and the final line says what counted.
- **A stem must state the assumption its key depends on.** Occlusion `fp-post` ("which cusp makes the posterior contact on
  the maxillary first molar?") left out "cusp-fossa", which its siblings say; under the cusp-marginal ridge reading the fence
  post suggests, the favorite wrong answer (21 of 50) is defensible, and a student reported it as confusing (#27, exam eve).
  When a question's answer rests on a convention (Class I, cusp-fossa, the patient's right side), put it in the stem.
- **A short stem with a coined term reads as unclear.** PCD `co-afterimage` ("The color opponent afterimage is:") was
  reported as hard to understand (#13); stems now say where the idea comes up ("During shade matching, what is...").
- **Answer choices must not give the answer away.** Perio `q2-02` labelled the wrong choices "(… monofilament)"
  while the stem asked for the braided suture. An audit then found 24 more giveaways (labels that rule a choice out,
  stem words echoed only by the answer, throwaway distractors). Write distractors that are the same category,
  length and form as the answer, and keep qualifiers in the explanation, not the choices. It still happens in new
  hubs: PCD `on-crack-types` asked which crack type is non-treatable with a choice labeled "Cracked tooth (treatable)"
  (report #18, 2026-10-13). Before shipping, grep the choices for parentheses. Numbers do it too: PCD Implants `bm-goodacre` asked which
  complication was most common and printed each one's percentage in its choice (report #37, 2026-11-04: 9/9 right before the fix, 9/14 after); put the numbers in the why lines. The reverse also happens: **a choice that names the key's own category is a second right answer.**
  Perio `q4-06` keyed the S204SD9 over "Sickle scaler", but the hub's notes call the S204SD9 the posterior sickle (7 of 17 picked
  "Sickle scaler"; fixed 10-27 to "H6/7 sickle scaler"). Check each wrong choice against the notes: is the key a kind of it?
- **The key's position can give the answer away too.** PCD Implants suggestion #14 (2026-11-04, two days out): 36 of 46 two-statement
  keys were "1 true, 2 false" and statement 1 was true in all 30 numbered items, because the author wrote the true statements first;
  Special Patient Care, on the same engine, had the same numbered habit. In fixed-order formats, decide where the key goes after
  writing the statements, and check the spread before shipping: CI fails it since 2026-11-04 (each two-statement choice keyed in
  10-40% of items, no numbered key position over 45%, no statement number true in over 90%). Give the key a size another choice shares
  ("1, 3 and 4" next to "2, 3 and 4", not next to two pairs and "1, 2, 3 and 4"), and key some items "all four" or "two".
- **Every explanation should name the class's favourite wrong answer and say why it's wrong.** The most-picked
  wrong choices (`question_choices`) on the hardest items were ones the explanation didn't mention: perio `q2-03`
  (silk), `q4-15` (Class 1), MSK `sl-calcitriol` (cholecalciferol). Fixed 2026-09-29; write explanations this way
  from the start: key fact, then one sentence per tempting distractor. It works: `q2-03` went from 30% to 61% right after its
  explanation named silk (09-30).
- **The key must fit the case and not contradict its own words.** PCD `ve-pbox-3`'s key said "Bleach first" while the
  Patient Box said bleaching had been tried (report #15); `ce-isolation`'s key said "RMGI: resin needs isolation" about a
  resin-modified cement, and accuracy fell from 58% to 1 of 5 once the explanation drew attention to it (report #16).
  Read the key choice on its own against the stem and the box; put the reasoning in the explanation, not the choice.
- **A case question's explanation may only use facts in the case.** Perio `q3-P02` (report #10, midterm morning)
  explained Grade C by "bone loss this young", but the Patient Box gave pockets only. Put every finding the answer
  rests on in the box (radiographs included), then walk the stage, extent and grade from it.
- **Explanations must agree with the key and show the number.** Perio `q3-47`'s explanation didn't match its answer
  and mixed up two slide figures. When a question tests a figure, the explanation states it and names which figure
  it is, and separates it from look-alike numbers.
- **Brand and admin details with no exam signal get reported as "too much detail".** PCD Implants #35/#36 on its first day (CONELOG's
  taper, Straumann RC's grooves). Before shipping a bank, check every brand-specific number or part and every billing or clinic-policy
  item for a hint, focus list or "this will be on the exam"; without one, leave it in the notes, not the bank.
- **Low-value questions get reported.** "Not a super helpful question" (`q4-49`, disclosing-plaque order). Trivial
  procedural orderings aren't worth a slot; test the decision or the reason instead. Questions about what the professor said rather than about the subject
  get reported too: Heme/Endo `h1-mag` ("Dr. Herr said he would NOT expect you to be able to:") drew two reports on its first
  afternoon ("not an exam-style question"). A lecturer's "you won't need this" belongs in the notes or Exam Hints, never in the
  bank; and a stem that quotes the lecture ("the pairing he said ties into the pancreas lecture") can cue a wrong choice
  (`gr-muscle`: 4 of 12 picked the insulin/glucagon distractor). Ask about the content; credit the professor in the explanation.
- **Students asked for spaced, missed-question review.** The first survey's only written answer asked for a daily
  drill of missed and high-yield questions, which became the Daily Drill (2026-09-28). The same survey: Question
  bank most helpful (5 of 8 answers by 10-03; Lecture notes 2, Review tables 1), usefulness 4.9/5 average.
- **Students ask for ways to remember, not just to be told.** Suggestion #2 (MSK, exam eve): "when you missed a
  question, the explanation gave you a way to remember it... a mnemonic or cue" (memory cues shipped 10-02 for perio and
  MSK). Suggestion #3: an undo / start-over button for ordering questions (shipped 10-02). Build both in from the start.
- **A diagram with letters or numbers needs a key somewhere you study.** Occlusion suggestion #6 asked for a key to the
  cusp-pathway arrows; the picture questions must hide it, but the copies under the notes and in Review now fold one out
  ("Show the key", 2026-10-20). Draw new lettered figures with a key from the start.
- **Test the formula, not only a piece of it.** Occlusion report #26: a stem that gives Thielmann's formula and asks what
  CC stands for "would be better if it asked us what the formula is". When the lecture teaches a formula or a rule, ask for
  the whole thing too.
- **Survey round 2** (live 10-15, n = 9 answers by 10-19): question formats: "good the way they are" 6, Quizlet flashcards
  or Learn 3, Anki 1, one loves the lecture notes most; a guided tutorial: yes 3, no 2. Asks: a place to ask questions about
  confusing topics, comparative summary charts, highlight colors, drills longer than 10 (the drill's "10 more" exists:
  make it easier to find), Review titles that match the lecture titles, no recall/flashcard items when the exam is all
  MCQ, cloze (fill-in-the-blank), and on games: filter by lecture or missed questions, quiz-based games, or get rid of
  them. Sam opened separate work for highlight colors, the tutorial, Patient Box questions, games and a place to ask
  questions (10-20). Done the same day: the Daily Drill takes 10, 20 or 30 questions; Review groups carry their lecture
  number and title; Occlusion's Review has a Side by side group of comparison charts. Cloze items: not now (Sam).
- **Interruptions get dismissed, not switched off.** Of the people who met a Plaque Boss from 10-20 on, Occlusion 53 of 89 (and 61
  people all time) and Heme/Endo 10 of 30 on its first day closed it with "Hide the boss"; every older hub had 28-41 people do the
  same. Yet none of 67 people with a settings snapshot since 10-22 has turned bosses off in Settings -> Extras. A survey answer:
  "a lot of features which are fun but sometimes distracting. Features like the tactical nuke should be an opt-in thing". When most
  people close something, offer the switch right there, or keep it out of the way in exam week. Sam (2026-10-28): it blocked
  questions, so the boss now docks as a slim strip in the hub's sticky top bar. **It worked**: on the first day docked, 4 of 55
  Heme/Endo people who met one hid it (10 of 30 the day before). Move an interruption out of the way before adding an off switch.
- **What check-ins say the hub missed lines up with the weakest data.** MSK's check-ins asked for "location of bone
  formation and differentiation", the lowest lecture (Bone Development 71%, its orderings 18-48%); perio's asked for
  staging/grading and EXCEPT items, the formats the bank lacked. Read the check-ins next to accuracy by lecture.

## Hub retrospectives

### Heme & Endo Exam 1 (`heme-endo-exam1`), exam 2026-10-30, reopened for a late exam, archives 2026-11-03 (written 2026-11-03)

Data: 92 people, 341 h, the most of any hub so far; 22 came on one day only, **50 on 3+ days**, median **183 min** each (also the most),
12 under 5 min. **25,399 answers from 67 people** (median 302, most 1,541; 52 answered on 2+ days), 82%. The hub went up 10-27, three days
out: 10-27 2,204 min (39 people), 10-28 5,874 (61), **night before 9,875 min from 73 (48% of all time)**, only 12 of them first-time
visitors; exam morning 2,350 (58), 18 studied after midnight. 20 mocks from 14 people, 75%. Daily Drill 10 people. Arcade: Feedback Sort
34 runs from 6 people, the other games 1 each. Timmy Time 9 people, 212 min heard, 2 heard 95%. Recap on the dashboard since 10-30
(keep it: Sam reopened the hub for a late exam, 11-03).

| Section | Minutes | People |
|---|---|---|
| Question bank | 11,483 | 67 |
| Lecture notes | 6,655 | 66 |
| Mock exam | 514 | 16 |
| Home | 325 | 92 |
| Exam hints | 232 | 28 |
| Daily Drill | 200 | 10 |
| Cram sheet | 199 | 32 |
| Review (all) | ~620 | 23 (histology 1) |
| Weak Spots | 122 | 17 |
| Timmy Time | 117 | 8 |
| Arcade (all) | ~55 | 8 |

| By lecture | Accuracy | Tries per question |
|---|---|---|
| Endocrine Pancreas | 79% | 42.8 |
| Corticosteroids | 80% | 30.8 |
| Adrenal Gland | 80% | 39.9 |
| Growth | 81% | 42.1 |
| Thyroid Physiology | 81% | 42.9 |
| Calcium and Phosphate | 82% | 32.5 |
| Thyroid Drugs | 83% | 31.7 |
| Hypothalamus and Pituitary | 83% | 49.3 |
| Histology 2 (adrenal, pancreas) | 84% | 28.8 |
| Histology 1 (pituitary, thyroid, parathyroid) | 85% | 63.6 |

By format: plain MCQ 83% (427), EXCEPT 82% (15), true/false 84% (101), **numbered 75% (25), two-statement 73% (60)**, ordering 67% (3).
By source: recordings 80%, slides 82%, in-class review 83% (51 tries each, the most), focus lists 85%, the professors' class cases 90%.
Hardest: `ca-2s-4` 41% (calcitonin; "1 true, 2 false" x13), `cs-2s-3` 44%, `gr-r-plate` 47% (growth-plate ordering), `pa-2s-2` 48%,
`td-inducers` 48% (methimazole/PTU x11), `h2-r-2s-1` 50%, `ca-r-vdr` 50% (Gq receptor x14), `pa-insulin-fat` 51% (lipoprotein lipase x26),
`cs-mitotane` 51%, `h2-islet-origin` 52% (neural crest x14), and the true/false `h1-tf-5` 54% (follicle size; "True" x32) and `pa-tf-3`
54% (islet blood flow; "True" x27). Late lectures were not the weakest this time: the pancreas lecture was (79%), the calcium and drug
lectures got the fewest tries (31-33 per question vs 43-64).

Check-ins, **n = 13 people** (14 rows by 11-04; later ones go into the next audit): **About right 10**, Hub was harder 2 (93-94% accurate,
83-295 min), one left it blank, none "Exam asked different things"; went better than expected 8, as expected 4, worse 1; readiness 3-5 (median
4). The three after the late exam (11-03): About right twice (520-783 min, 75-79%), Hub was harder once. Against use: the one
"worse than expected" answered the most of anyone (1,541 at 84%, 732 min) and still called the hub about right; the two lowest-accuracy
people (67% and 77%) both went better or as expected. Written: "can we single out the high yield questions (not just first in the line
up) and fully shuffle them? it was a nice review before taking the exam" (the bank then had a sort menu with "High likelihood only";
the newer engine's status filter + Random does exactly this), and "this hub was very accurate for the exam, it just had a lot of
questions". Reports: 4 (`h1-mag` twice, `th-r-nis`, `h2-r-origin`), all fixed and answered within a day; one suggestion (counts per
lecture and predicted topics), which became High Likelihood Exam Questions (now a standing rule).

What changes because of it: (1) **the recipe worked**: recordings + the professors' focus lists + the in-class review set + the
official counts per lecture as the mock blueprint and `LIKELY_TOPICS` gave the best check-ins yet; build every hub this way, and ask Sam
early for counts and focus lists; (2) High Likelihood got used (23 people ordered by it, 21 filtered to it, 40% of all tries): make
"High likelihood only" + Random one obvious path in the bank; (3) statement formats are the hardest and the least helped by explanation
fixes (standing lesson above); (4) "a lot of questions": 631 for 55 exam questions was more than people finished (median 302 answers);
High Likelihood is the answer to that, not a smaller bank; (5) three days of hub was enough for 50 people to use it on 3+ days, but the
calcium and drug lectures, added or finished last, got the fewest tries again. Cleanup still to do by hand, after the late exam: remove
`hubs/heme-endo-exam1/` and optionally move its entry into `ARCHIVED_HUBS`.

### MSK Exam 4 (`msk-exam4`), exam 2026-10-16, archived 2026-10-16 (written 2026-10-20)

Data (28 automated one-ping visitors from 10-14 dropped): 71 people, 131 h; 26 came on one day only, 25 on 3+ days, median 59
min each, 13 under 5 min. **8,969 answers from 43 people** (median 180, most 653; 26 answered on 2+ days), 78% overall.
Night before (10-15): 3,795 min from 58 people (**48% of all time**), **31 of them first-time visitors**; exam morning
1,926 min from 47; 13 studied after midnight. 17 mocks from 12 people, 80% average. Daily Drill 11 people. Arcade 14 runs
from ~5 people. Recap on the dashboard since 10-16.

| Section | Minutes | People |
|---|---|---|
| Question bank | 3,583 | 42 |
| Lecture notes | 2,689 | 71 |
| Timmy Time podcast | 287 | 20 |
| Cram sheet | 220 | 25 |
| Daily Drill | 191 | 11 |
| Review: drugs | 186 | 13 |
| Weak Spots | 183 | 11 |
| Mock exam | 174 | 13 |
| Exam hints | 103 | 14 |
| Review: rest | ~170 | 9 (skin) |

Notes: lecture picks Derm Pharm 119, Dermpath 100, Muscle 97, NMJ 83, Skin 82 opens; Plain English 17 vs As taught 16;
Listen 6 people, mind map 2, highlighter 6. Interactive diagrams 18 people (above).

| By lecture | Accuracy | Tries per question |
|---|---|---|
| Dermatological Pharmacology | 69% | 37.5 |
| Pathology of the Skin | 77% | 37.8 |
| Pharmacology of the NMJ | 78% | 26.1 |
| Skeletal Muscle | 81% | 40.5 |
| Histology of Skin | 83% | 44.7 |

By type: MCQ 80%, matching 69% (8), sequence 57% (7, all 3-5 steps), select-all 43% (2, both Patient Box drug picks). By
source: lecture self-checks 72%, hub-written 76%, recording 78%, classmate's deck 84%, in-class review 90%. Hardest:
`dp-ecto-malathion` 34% (ivermectin lotion picked 12 times), `pa-blister-match` 40%, `dp-clinda` 40% (cell wall 13),
`dp-toenail` 41% and `dp-impetigo` 44% (select-alls), `mu-hierarchy` 43% (ordering), `dp-contact-urticaria` 44% (allergic
contact dermatitis 21), `sk-lamellar` 45% (Langerhans cells 21).

Check-ins, **n = 8** (later ones go into the next audit): About right 5, Exam asked different things 3; went as expected 5,
better 1, worse 2; readiness 3-5 (average 3.9). Against each person's use: the three "different things" were heavy users
(215-450 min, 504-653 answers, 77-87%); the two "worse than expected" called the hub about right and had the lowest hub
accuracy of the eight (68-70%; 83 and 526 min). Missed (as topics): "more specific definitions, pathways"; "the hub tended
to ask more low-yield questions based on the lectures; it was good to read over".

What changes because of it: (1) in drug lectures, fewer product details (how each lice product is applied, which ointment
goes in the nose) and more mechanism, pathway and definition items, weighted by what the lecture stresses (standing lesson
above); (2) the last lecture again got the least practice: put late lectures first in the Daily Drill and mock; (3) the
podcast reached a third of the eve crowd: repeat it only when there's a session to spare for it; (4) select-all Patient Box
drug picks stay the weakest format: keep them few, 5 options, 3 correct. Cleanup still to do by hand: remove
`hubs/msk-exam4/` (its card leaves the dashboard 10-26) and optionally move its entry into `ARCHIVED_HUBS`.

### PCD Fixed Pros Exam 3 (`pcd-exam3`), exam 2026-10-15 (Canvas, 8 am-8 pm), archived 2026-10-15 (written 2026-10-20)

Data (12 automated one-ping visitors from 10-13 dropped): 79 people, 212 h; 26 came on one day only, **37 on 3+ days**,
median 95 min each, 10 under 5 min. **14,092 answers from 72 people** (median 117, most 933; 36 answered on 2+ days), 84%.
Studying started earlier than in other hubs: 25 people and 32 h three days out (10-12), 40 people two days out. Night
before (10-14): 3,648 min from 55 (29% of all time), 15 of them first-time visitors; exam day 3,097 min from 62 (24%: the
Canvas exam was open all day); 9 studied after midnight. 16 mocks from 14 people, 79%. **Daily Drill 24 people on 42
person-days**, the most of any hub. Arcade ~24 runs from ~7 people. Recap on the dashboard since the evening of 10-15.

| Section | Minutes | People |
|---|---|---|
| Question bank | 6,377 | 59 |
| Lecture notes | 4,598 | 77 |
| Daily Drill | 411 | 24 |
| Cram sheet | 398 | 28 |
| Weak Spots | 329 | 16 |
| Mock exam | 297 | 16 |
| Review (all) | ~160 | 16 (cements) |
| Exam hints | 78 | 27 |

Notes: Plain English 26 clicks (15 people) vs As taught 19 (13); mind map 14 people; Listen 6 people (57 clicks).

| By lecture | Accuracy | Tries per question |
|---|---|---|
| Cement & Cementation | 80% | 47.0 |
| Bonding Dental Ceramics | 82% | 42.4 |
| Glaze & add contacts (video) | 83% | 35.3 |
| Color | 85% | 42.2 |
| Onlays | 86% | 40.9 |
| Laminate Veneers | 88% | 39.4 |
| Removing a Crown | 92% | 40.2 |

By type: MCQ 85%, matching 85% (8 items of 4 pairs), select-all 83% (5 options, 3 correct, with tick boxes), sequence 76%
(3-5 steps). By source: slides 82%, recordings 82%, **hint email 87% with the most practice (49 tries per question)**.
Hardest: `on-telio` 48% (bis-acryl 13), `bo-zprime` 50% (eugenol 14), `ce-irm` 51% (RMGI 13), `on-materials-list` 51%,
`bo-adh-thick` 52%, `co-uranium` 53% (cobalt 10), `ce-sbu` 57%.

Check-ins, **n = 7** (two more on 10-20, n = 9: one About right, 325 min at 83%, went better; one Hub was easier, 384 min at 88%, as expected): About
right 4, Hub was harder 2, Exam asked different things 1; went better 3, as expected 3, worse 1; readiness 3-5 (average 3.9). Against use: the one "different things" had the most answers of anyone (933 at 91%, 377 min)
and asked for application ("what cement for what type of crown"); both "Hub was harder" were 91-93% accurate (64-245 min);
the one "worse than expected" studied the most (682 min, 86%) and still called the hub about right. One wrote that the
exam "followed the hints a lot so the questions around those were very helpful."

What changes because of it: (1) for Fixed Pros, build again from the course's hint email (blueprint, `hint` source, Exam
Hints tab): it matched the exam; (2) add decision items (which cement for this crown and situation, which material for this
onlay), the most common ask across courses (standing lesson above); (3) short select-alls with tick boxes worked (83%), as
did 4-pair matching; (4) a Canvas exam open all day puts a quarter of the time on exam day, so keep fixes and the Daily
Drill fresh through that day. Cleanup still to do by hand: remove `hubs/pcd-exam3/` (its card leaves the dashboard 10-25)
and optionally move its entry into `ARCHIVED_HUBS`.

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
