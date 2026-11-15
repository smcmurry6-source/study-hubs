---
type: task
status: done
hub: perio
created: 2026-11-15
requested-by: Sam
due: 2026-11-19
waiting-on:
agent: Claude Code
pr:
---

# Perio: audit the question bank for the final

## Goal

Sam, 2026-11-15: "Lets audit perios question bank to see if we can make it higher yield and also to make sure we have
high quality questions that are accurate, with good answer options and sufficient explanations. Make sure the exam
hints are utilized as best as possible." The final is Thu Nov 19, cumulative.

## Context

- Hub note: [perio](../../hubs/perio.md) (the final's format, the Nov 12 review's know and skip lists, "Kept as taught")
- Rules: [every-choice-gets-a-why](../../rules/every-choice-gets-a-why.md),
  [high-likelihood-topics](../../rules/high-likelihood-topics.md),
  [dont-ask-what-professors-skip](../../rules/dont-ask-what-professors-skip.md),
  [question-ids-are-permanent](../../rules/question-ids-are-permanent.md),
  [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md)
- The bar for "higher yield" is Sam's own, from Occlusion (2026-11-10, [decisions](../../decisions.md)): "it is okay to
  test the same concept multiple ways. just not for every single question and not more than twice", applied to every
  bank. Heme & Endo Exam 2 went further on Sam's word for that hub ("803 is way too many"); this audit didn't.

## Done when

- [x] Every question checked against its session's notes: keys, statements, why lines, explanations
- [x] Answer choices: no giveaways (key the longest, a lone parenthesis, a stem word only the key echoes), no throwaways,
      no second defensible answer
- [x] No fact asked more than twice, across sessions too; low-yield trivia with no exam signal out
- [x] Every emphasize hint tested on its own point; no key depends on a deemphasize hint; likely topics re-fitted
- [x] High yield rebuilt and its narration recorded again for all nine sessions
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Vault written back (hub note, this note's Outcome, the to-dos in the inbox)
- [ ] After the merge: load the answer keys (`node tools/xp/keys.js perio --load`) and log the changelog line

## Log

- 2026-11-15: an automated pass over all 750 questions (format, giveaway patterns, near-duplicate pairs, hint-to-question
  matches, the class's question-health numbers), then one reviewer per session read every question against that
  session's notes, hints, review tables and cram lines and proposed changes as data; the main session checked each
  proposal against the notes, changed a few, and applied them with one script.

## Outcome

**750 questions → 670.** 263 edited (same ids), 103 retired, 23 new (`q<n>-F01`...). S1-S4 went from 288 to 229
questions (the final takes about 15% from them); 460 are now tagged High likelihood (was 424). The right answer is the
longest choice in 15% of the multiple-choice items (was 24%); two-statement keys run 7-13 per choice, true/false is 16 of
31 True. The notes, hints and review tables were not changed, so As taught, Plain English and Timmy Time are still
accurate; High yield changed in all nine sessions (it's built from the questions) and was recorded again.

**What was wrong.** No key contradicted the notes, but 30 edits fixed an inaccurate explanation, why line or choice,
for example: S8 `q8-03` had ciprofloxacin as a second right answer (the notes give it the same 1-hour-before /
2-hours-after rule) and a why line saying the opposite; S9 `q9-07` gave Type 1B altered passive eruption an apically
positioned flap (the notes: a flap with osseous surgery; only Type 2 gets the apically positioned flap); S9 `q9-02` said
a flap over a CTG makes it keratinize; S6 `q6-L07` called a circumferential defect "well contained"; S3 `q3-35` said
20-30% don't respond to therapy (the notes: 20-25%); S4 `q4-43` called the Nabers probe unmarked; S7 `pc-f1` and
`pc-f2` gave numbers that didn't match the drawn case or the success criteria. The bigger problems were repetition (the
smoking modifier was the key of 8 S1 questions, the Stage 3/4 triggers 7, the SRP goals 5, "deep, narrow, 3-wall" 5)
and giveaways (152 items where the key was the longest choice, 49 with parentheses in the choices).

Edits by session and kind:

| Session | Accuracy | Answer choices | Explanations | Clarity | Format | Total |
|---|---|---|---|---|---|---|
| S1 | 1 | 10 | 2 | 2 | 0 | 15 |
| S2 | 1 | 8 | 1 | 5 | 1 | 16 |
| S3 | 4 | 15 | 8 | 2 | 1 | 30 |
| S4 | 6 | 18 | 16 | 2 | 4 | 46 |
| S5 | 0 | 24 | 0 | 2 | 1 | 27 |
| S6 | 4 | 12 | 8 | 1 | 2 | 27 |
| S7 | 6 | 7 | 18 | 1 | 0 | 32 |
| S8 | 1 | 10 | 25 | 2 | 4 | 42 |
| S9 | 7 | 9 | 7 | 5 | 0 | 28 |
| **All** | 30 | 113 | 85 | 22 | 13 | 263 |

**The exam hints.** Every emphasize hint now has at least one question on its own point; 23 new questions fill the gaps
the hints left, most of them in the final's formats (8 select-all, 5 matching). Examples: the Becker tooth-loss data
(S1 hint, `q1-F01`), which findings set the stage and which the grade (`q1-F02`, `q1-F03`), "partial thickness = split
thickness", the word the final uses (`q2-14`), vertical incisions at the line angle and a base wider than the free edge
(`q2-F02`, `q2-F03`), the 11/12 and 15/16 for posterior mesials (`q4-F01`), mobility from occlusion that SRP won't fix
(`q4-F04`, a new topic), ultrasonic → hand → ultrasonic (`q4-F05`), one deep site in a stable mouth (`q5-F01`), Dr.
Kaur's three diagnoses as a matching item and a case select-all (`q7-F01`, `q7-F02`), the late colonizers and the
vicious cycle (`q8-F01`, `q8-F02`), and a gummy smile's causes matched to their treatments (`q9-F01`). No question left
has a key that depends on a skipped point (suture techniques and pictures, Miller & McEntire, entrance widths, doses).
Two topics were added (S4: mobility from occlusion; look at the radiographs first); none was removed or renamed.

**Calls made across sessions** (no fact more than twice in the bank): S9 owns recession treatment, so `q1-07` (RT3)
and `q9-L10` (RT1 = full coverage, text) came out and the chart readings `pc-c1`, `pc-c2`, `q9-P02`, `q9-P04` stay;
`q2-29` (a CTG is lamina propria) came out for S9's two; `q4-27` (re-evaluation at 4-6 weeks) is the same question as
`q5-R02`; `q5-L28` (Glickman Class II from the probe) came out for `q4-L14` and `pc-d1`; `q1-28` (maintenance vs a
prophy) for `q4-E03` and `q1-E05`; `q1-S05` for the four "3-wall is best" items. A recall card was retired wherever it
repeated a fact asked in a scored format (the final has no recall items).

**Retired questions** (76 repeats, 27 low-yield; each id is `retired` in `tools/question-ids/perio.txt`). Any of them can
come back with its id (`git show <commit before the merge>:hubs/perio/content/questions.json`):

| Session | Id | Why | The question | Reason | Still tested by |
|---|---|---|---|---|---|
| S1 | q1-05 | redundant | Name the two findings that must both be present for a bleeding 5 mm probing depth to… | Recall card on hint 0's point, also tested by pc-b1 (the drawn gingivitis case), q1-E01, q1-P04 and q1-S04; keep the case and the except item, which are closer to the… | pc-b1, q1-E01 |
| S1 | q1-06 | redundant | A tooth has 1 mm of mesial and 1 mm of distal recession (some interproximal attachment… | Text version of pc-c1 (RT2 read from the #24 chart); q1-08's matching also defines RT2. The chart item fits the final's images better. | q1-08, pc-c1 |
| S1 | q1-11 | low-yield | A patient on a calcium channel blocker has gingival overgrowth. Does the medication… | Not in the S1 notes and no S1 hint; drug-influenced enlargement is taught and tested in S4 (q4-L05) and S9 (q9-06). Recall format. | q4-L05, q9-06 |
| S1 | q1-14 | low-yield | What distinguishes necrotizing periodontal disease from typical gingivitis or… | Not in the S1 notes, no hint, likely topic or review item; necrotizing disease appears only as a distractor elsewhere. |  |
| S1 | q1-15 | redundant | A patient has a vertical bone defect measuring 4 mm. What does this make the case… | The automatic Stage 3/4 triggers are also tested by q1-P05 (select-all, all three), q1-E01, q1-S01, q1-P03, q1-P06 and pc-d2; keep the select-all and the except item. | q1-P05, q1-E01 |
| S1 | q1-19 | redundant | Case B, a 41-year-old, has bone loss confined to #2 and #15, with a bone-loss/age ratio… | The smoking modifier was the key in seven S1 items (q1-19, q1-P02, q1-M01, q1-S02, q1-S08, pc-a3, pc-d2) plus q1-A08; keep the select-all and one drawn case. | q1-M01, pc-d2 |
| S1 | q1-24 | low-yield | Why are the coronal/middle/apical thirds of the root measured from where bone should be… | Not in the S1 notes, no hint, review item or likely topic; recall card. |  |
| S1 | q1-30 | low-yield | Under which CDT code does periodontal charting/screening fall, as part of a new-patient… | Billing code: the kind of clinic-policy item the brief lists as low-yield; no hint or likely topic. |  |
| S1 | q1-O01 | low-yield | Put the grades in order, slowest to fastest (by % bone loss ÷ age at the worst tooth). | A trivial ordering (A, B, C in alphabetical and numeric order); the ratio cutoffs are tested by q1-17 and q1-18 and applied in q1-P01 and pc-a2. q1-21 stays as S1's… | q1-17, q1-18 |
| S1 | q1-P02 | redundant | Which stage and grade fit this patient? | Same smoking-to-Grade-C point as q1-M01 and pc-d2; Stage 2 from CAL 3-4 mm is kept in q1-P01 and the new q1-F03. | q1-M01, pc-d2 |
| S1 | q1-P03 | redundant | What stage and grade should be assigned? | pc-d2 is the same case shape (CAL says Stage 2, a Class II furcation forces Stage 3) and q1-P05 tests the trigger; the HbA1c-under-7% point stays in q1-20 and q1-M01. | q1-P05, pc-d2 |
| S1 | q1-P04 | redundant | What is the diagnosis? | Same case and answer as pc-b1 (gingivitis with 4s and 5s), which adds the chart and radiograph the final's images resemble. | pc-b1, q1-E01 |
| S1 | q1-P06 | redundant | Which of these findings, on its own, places this case in Stage 3 or 4? | Same Patient Box as q1-P05, asked as a single answer; q1-P05 asks for all three triggers. | q1-P05, pc-d2 |
| S1 | q1-M04 | redundant | Which recession types predict at least partial root coverage? Select all that apply. | Coverage by recession type is also tested by q1-07 and pc-c2 (and widely in S9); this select-all has only 3 choices. | q1-07, pc-c2 |
| S1 | q1-S01 | redundant | Read the two statements. / 1. Stage 3 and Stage 4 are told apart by how much more… | Statement 1 repeats q1-31 and q1-S09; statement 2 repeats q1-P05 and q1-E01. | q1-31, q1-S09 |
| S1 | q1-S02 | redundant | Read the two statements. / 1. Smoking 10 or more cigarettes a day moves a case to Grade… | Both statements are tested elsewhere: smoking in q1-M01 and pc-d2, no downgrade in q1-E02 (and q1-M01's non-smoker choice). | q1-M01, q1-E02 |
| S1 | q1-S04 | redundant | Read the two statements. / 1. A bone-loss/age ratio between 0.25 and 1.0 suggests Grade… | Statement 1 repeats the ratio cutoffs (q1-17, q1-18); statement 2 repeats hint 0's point (pc-b1, q1-E01). | q1-17, pc-b1 |
| S1 | q1-S06 | redundant | Read the two statements. / 1. Fewer than 20 remaining teeth (10 opposing pairs) is a… | q1-A01 (bite collapse) and q1-A02 (fewer than 20 teeth, masticatory dysfunction, mobility 2) already test the Stage 4 list. | q1-A01, q1-A02 |
| S1 | q1-S08 | redundant | Read the two statements. / 1. In a patient with diabetes, an HbA1c below 7% falls in the… | HbA1c is tested by q1-20 and q1-M01; smoking by q1-M01 and pc-d2. | q1-20, q1-M01 |
| S1 | q1-A08 | redundant | A patient smokes 5 cigarettes a day. Which grade row does smoking fall in? | Third angle on the 10-a-day smoking cutoff after q1-M01 and pc-d2. | q1-M01, pc-d2 |
| S1 | pc-a3 | redundant | Which one change would move him to Grade C? | Same smoking-to-Grade-C point as q1-M01 and pc-d2; the first-visit case keeps pc-a1 and pc-a2. | q1-M01, pc-d2 |
| S1 | q1-07 | redundant | Which recession type is not treated with a root-coverage attempt, because it will not… | Third test hub-wide once S9 refocused q9-L11 and q9-S02 on RT3 (hint 92); S9 owns recession treatment, and S1 keeps the RT definitions (q1-08) and the chart readings… | q9-L11, q9-S02 |
| S1 | q1-S05 | redundant | Read the two statements. / 1. A 3-wall defect has the best prognosis for regeneration. /… | "3-wall is best for regeneration" was asked four times hub-wide (q1-22, q1-S05, q6-02, q6-L29) and the crater is q1-23. | q1-22, q6-02, q1-23 |
| S1 | q1-28 | redundant | How does periodontal maintenance differ from a routine prophylaxis? | A self-graded recall card (not a final format) on the point q4-E03 and q1-E05 test. | q4-E03, q1-E05 |
| S2 | q2-07 | low-yield | What does a reverse cutting needle do differently from a standard cutting needle? | Needle geometry: one passing paragraph in the notes, and no hint, review table, cram line, likely topic or the 'For the final' note points to it (the final is the… |  |
| S2 | q2-08 | low-yield | A larger needle-curvature arc produces what kind of bite? | Needle geometry, same as q2-07: mentioned in passing, no exam signal. |  |
| S2 | q2-15 | low-yield | Flap designs are classified along three axes. Which of these is NOT one of them? | A list of classification axes no hint points to; the keyed choice ('suture material') is a different category from the other three, so it gives itself away. It sat in… |  |
| S2 | q2-16 | redundant | List the 5 surgical principles for incisions and flap design given in this lecture. | Recall item listing the same five principles q2-M02 asks as a select-all (the final's format); line angle is tested by q2-M02 and q2-F02, base width by q2-17 and… | q2-M02, q2-17 |
| S2 | q2-23 | redundant | Match each suture material family to an example the lecture named. | Resorbable vs not is already tested by the six-material select-all and the EXCEPT item; this match has only three pairs (below the four-pair minimum) and leans on brand… | q2-M01, q2-E03 |
| S2 | q2-26 | redundant | An implant is being placed with simultaneous bone grafting. What flap thickness should… | Full thickness for implants and bone augmentation is tested by q2-M03 (select-all of procedures) and q2-P01 (the ridge-augmentation case, which alone also tests… | q2-M03, q2-P01 |
| S2 | q2-29 | redundant | Of the palate's three tissue layers (epithelium, connective tissue/lamina propria,… | Session 9 owns the palate's layers (its likely topic 'The palate: its layers...') and tests CTG = lamina propria in q9-L15 and FGG vs CTG in q9-S01 (near-duplicate… | q9-L15, q9-S01 |
| S2 | q2-D14 | redundant | Which suture material on the course chart is braided and non-resorbable? | Silk's construction is in q2-06 (and q2-05's stem) and its non-resorbability in q2-M01 (and q2-05); this was a third and fourth test. It also carries the strand… | q2-06, q2-M01 |
| S2 | q2-E01 | redundant | All of the following are true of silk sutures EXCEPT: | Every statement in it is tested elsewhere: non-resorbable and braided (q2-M01, q2-06, q2-05), handling (q2-04), 7 days (q2-05, q2-F01). Not tagged to a topic. | q2-05, q2-04 |
| S2 | q2-S03 | redundant | Read the two statements. / 1. Chromic gut handles very well. / 2. Chromic gut is a… | Both statements restate q2-01's stem (natural, monofilament, fastest, handles very poorly); construction is also in q2-06 and resorbability in q2-M01 and q2-E03. | q2-01, q2-06 |
| S2 | q2-P02 | redundant | Which flap and suture fit this surgery? | Same case and same facts as q2-P01 (near-duplicate 0.84); P01 is the select-all, the final's format. Line angle is tested by q2-M02 and q2-F02. | q2-P01, q2-M03 |
| S3 | q3-02 | redundant | Which system assesses the likelihood of achieving periodontal stability for the whole… | Each of its three facts is tested elsewhere: stability (q3-34, q3-M02), whole dentition (q3-08), therapeutic only (q3-M02, q3-01). Stability was tested four times. | q3-34, q3-M02, q3-08 |
| S3 | q3-07 | redundant | How is McGuire & Nunn different from Kwok & Caton in terms of when it can be used? | Recall item with no explanation; q3-01 now asks the poll's diagnostic question and q3-M02 has 'therapeutic only', so this was the third test. | q3-01, q3-M02 |
| S3 | q3-29 | redundant | Which statement about the accuracy of McGuire & Nunn prognoses is correct? | Its key is 'All of these statements are correct'. q3-F01 asks the same poll as a select-all (the final's multiple-answer format). | q3-F01, q3-30 |
| S3 | q3-S01 | redundant | Read the two statements. / 1. UniFe scores bleeding on probing (BOP %), not the plaque… | UniFe's inputs and plaque-not-BOP were tested four times (q3-16, q3-M01, q3-S01, q3-E01) with no hint or final signal; kept the select-all and the identification item. | q3-M01, q3-16 |
| S3 | q3-E01 | redundant | UniFe scores all of the following EXCEPT: | Same fact as q3-M01's plaque-index distractor and q3-S01; third and fourth test of UniFe's inputs. | q3-M01, q3-16 |
| S3 | q3-14 | low-yield | In the COPD trial discussed in lecture, how did actual subgingival (SRP) therapy compare… | A single trial result in passing; not in the cram, review tables, hints or likely topics, and the final's S3 guidance is the prognosis systems. |  |
| S3 | q3-15 | low-yield | In the 12-month diabetes trial comparing intensive periodontal therapy to… | Exact trial numbers mentioned in passing, with no hint, cram line, review table or likely topic. |  |
| S3 | q3-24 | low-yield | On average, how much did patients report they would pay per tooth to avoid losing it,… | A dollar figure in passing; the cram point (trust, not cost) is q3-23, whose why for cost now carries this. | q3-23 |
| S4 | q4-09 | redundant | What is the key difference between how Gracey curettes and the Columbia curette are used? | Third test of the same fact, as a self-graded recall card with no explanation. | q4-05, q4-08 |
| S4 | q4-11 | redundant | Probing depth is 7 mm and recession is 0. What is the CAL? | With zero recession it only asks 7 + 0; the formula is tested by q4-10 (positive recession) and q4-L06 (negative). | q4-10, q4-L06 |
| S4 | q4-P01 | redundant | What is the clinical attachment level at #8 mesial? | Same numbers and same computation as q4-L06; a Patient Box item kept only if it's the best, and the final has few or none. | q4-L06, q4-10 |
| S4 | q4-20 | redundant | The Phase I case in the deck (a non-periodontitis patient with a reduced periodontium… | Tests the diagnosis (q4-L32) and the D4346 code (q4-19, pc-b2) at once, framed as 'the case in the deck'. | q4-L32, q4-19, pc-b2 |
| S4 | q4-P03 | redundant | Which procedure fits this patient? | Fourth D4346 item; its scenario repeats q4-L32's case, and its key was much the longest choice. | q4-19, pc-b2 |
| S4 | q4-22 | redundant | Which microbial shift is one goal of Phase I therapy? | The goal is tested five times (q4-22, q4-L25, q4-M02, q4-S01, q4-E01); keep the select-all and the two-statement. | q4-M02, q4-S01 |
| S4 | q4-L25 | redundant | Which is NOT a goal of scaling and root planing? | Same goal list as q4-M02 and q4-S01; 'doesn't reverse the damage' stays in q4-M02 and q4-M03. | q4-M02, q4-M03 |
| S4 | q4-E01 | redundant | All of the following are goals of scaling and root planing EXCEPT: | Near-copy of q4-S01 (0.84) and q4-M02 (0.78). | q4-M02, q4-S01 |
| S4 | q4-L26 | redundant | After SRP, inflammation resolves and the gingiva loses volume. How is that recorded… | Tested by q4-28 and q4-M03 (and was in q4-L41 and q4-E05 too). | q4-28, q4-M03 |
| S4 | q4-L41 | redundant | Explain the two ways probing depth decreases after SRP. | Recall card with no explanation; q4-M03 tests both mechanisms as a select-all. | q4-M03, q4-28 |
| S4 | q4-E05 | redundant | All of the following reduce probing depth after SRP EXCEPT: | Same content as q4-M03 in EXCEPT form. | q4-M03, q4-28 |
| S4 | q4-27 | redundant | When is the Phase I re-evaluation done? | Word-for-word the same question as S5's q5-R02; q4-L28 tests the reason (no more reduction after 4-6 weeks), which is hint 29's point. | q4-L28, q5-R02 |
| S4 | q4-L40 | redundant | List the limitations of scaling and root planing discussed in class. | Recall list with no explanation; the limitations are tested by q4-M05 and q4-S04. | q4-M05, q4-S04 |
| S4 | q4-E02 | redundant | All of the following are limitations of SRP discussed in class EXCEPT: | Third test of the blinded/motile-bacteria limits and of hand vs. ultrasonic. | q4-M05, q4-S04, q4-24, q4-E04 |
| S4 | q4-P02 | redundant | What is the appropriate first appointment? | Third test of the indication (q4-L12, q4-M04) and of the later exam (q4-18, q4-M04); Patient Box kept only if best. | q4-L12, q4-M04 |
| S4 | q4-P06 | redundant | What best explains how his tissue looks? | Same patient box and same fact as q4-P05 (0.67); q4-L04 tests it plainly. | q4-L04, q4-P05 |
| S4 | q4-O01 | redundant | Put the Glickman furcation classes in order, least to most severe. | Restates q4-L14's match as an ordering whose steps can be put in order from the wording alone (catch, cul-de-sac, through, visible); LESSONS: trivial orderings get… | q4-L14, pc-d1 |
| S4 | q4-O02 | low-yield | Put the Miller mobility classes in order, 0 to 3. | The steps order themselves from their wording (normal, slightly more, moderately more, severe); the classes are tested by q4-15 and q4-16. | q4-15, q4-16 |
| S4 | q4-L35 | low-yield | Put Dr. Kaur's instrumentation sequence in order. | A 3-step ordering (below the 4-5 step format) whose ultrasonic steps name their own place; the new q4-F05 asks for the reasoning instead. | q4-L34, q4-F05 |
| S4 | q4-36 | low-yield | Which Gracey has more bends in its shank than the 11/12 and uses a pull stroke… | Instrument anatomy, not what the instrument is for or where (the final's ask); 13/14 for posterior distals is already tested twice. Its ex also overstated 'the most… | q4-03, q4-08 |
| S4 | q4-35 | low-yield | What is the working angle of the H6/7 anterior sickle and the S204SD9 posterior sickle… | A technique number no hint, cram line or final note points to; the final asks what each instrument is for and on which surfaces. |  |
| S4 | q4-42 | low-yield | How are implant probes calibrated? | Brand-style marking detail mentioned in passing; LESSONS: brand numbers with no exam signal get reported. |  |
| S4 | q4-45 | low-yield | What can a rubber cup with pumice do to the gingiva in 2 minutes? | A deck-only number (polishing wasn't covered in class) with no hint or cram line; polishing stays tested by q4-44, q4-46 and q4-47. |  |
| S4 | q4-49 | low-yield | After chewing a disclosing tablet, why does the patient rinse only briefly with water… | Already reported by a student as 'not a super helpful question' (LESSONS); the reason isn't even in the notes. |  |
| S4 | q4-50 | low-yield | List the occlusal findings the deck links to periodontal disease. | A recall list with no explanation; hint 27's point (occlusion, not the pocket, drives the mobility) is tested by q4-L20, q4-L21 and the new q4-F04. |  |
| S4 | q4-51 | low-yield | Which instrument does the deck call the most important one in the periodontal exam? | Asks what the deck calls something rather than about the subject, and only the key echoed the stem. |  |
| S4 | q4-L11 | low-yield | What is passive eruption? | Background the notes give in passing; altered passive eruption is tested here by q4-L10 and q4-M01 and taught in depth in S9. | q4-L10, q4-M01 |
| S4 | q4-48 | redundant | The mucogingival part of the exam records which two things? | Only the key echoed the stem's 'mucogingival' (a giveaway); q4-L18 tests the same exam step without it. | q4-L18 |
| S5 | q5-R09 | redundant | In positive osseous architecture, the interproximal crest is: | Same question as q5-09 (cosine 0.57), which has the fuller why lines; q5-08 tests the mirror (reverse architecture). The architecture definitions were tested four times… | q5-09, q5-08 |
| S5 | q5-10 | redundant | Why is reverse (negative) bone architecture a target for resective recontouring? | A free-recall item (not a final format) on the definition q5-08 tests and the rationale q5-R01 tests (bone must follow the gingiva). | q5-08, q5-R01 |
| S5 | q5-S02 | redundant | Read the two statements. / 1. New attachment will not form on enamel. / 2. Every… | Both statements are tested twice elsewhere: no attachment to enamel (q5-L17, q5-E04) and observe a CEP without loss, remove it with loss (q5-L22, q5-P01). It is also… | q5-L17, q5-E04, q5-L22, q5-P01 |
| S5 | q5-S03 | redundant | Read the two statements. / 1. The Glickman and Hamp classifications describe horizontal… | Tarnow and Fletcher's vertical subclass was tested three times (q5-L31, q5-X01, q5-S03) and Hamp's horizontal degrees three times (q5-L30, q5-X01, q5-S03); the MCQs and… | q5-L31, q5-X01, q5-L30 |
| S5 | q5-P03 | redundant | Why is #19 a poor candidate for furcation regeneration right now? | Near-identical to pc-d3 (a smoker's buccal Class II on #19, in a likely topic, on a drawn case) and covered by the select-all q5-M02; three tests of one fact. | q5-M02, pc-d3 |
| S5 | q5-L28 | redundant | The Nabers probe enters the buccal furcation of #30 and catches when you pull it… | Third test of the Class II definition hub-wide (q4-L14 match, pc-d1 on the drawn case, q5-L28). | pc-d1, q4-L14 |
| S6 | q6-L05 | redundant | Which radiographic findings were reported as most amenable to conventional GTR? | Same fact and stem as q6-01 (tagged, exam-review); q6-01 now uses this item's depth-by-angle grid, so nothing is lost. | q6-01, q6-M02 |
| S6 | q6-L14 | redundant | In the deck's bone-graft case, what does DFDBA stand for? | Spelling out the acronym is the low-yield half; q6-L15 and the q6-X01 match test that DFDBA is an allograft from another human. | q6-L15, q6-X01 |
| S6 | q6-E02 | redundant | All of the following favor a regenerative outcome in an intrabony defect EXCEPT: | The EXCEPT mirror of q6-06 (same four ideas, same key); the thin-biotype fact was in five items. | q6-06, q6-L08 |
| S6 | q6-P03 | redundant | Which outcome is this patient at higher risk for after regenerative surgery on #24? | Same finding as q6-L08, which has better distractors (this one's were paresthesia and root resorption); the final has few or no Patient Box cases. | q6-L08, q6-06 |
| S6 | q6-E04 | redundant | The AAP decision tree says to address all of the following first, before assessing the… | The EXCEPT mirror of q6-L27 (tagged); the same patient factors are also tested for furcation regeneration in S5 (q5-M02, q5-P03). | q6-L27, q5-P03 |
| S6 | q6-P02 | redundant | What should happen before any regenerative surgery on #8? | Third S6 test of the tree's first step (with q6-L27 and q6-E04), and S5's q5-P03 is the same case logic (smoker, poor hygiene, not a candidate yet); the final has few… | q6-L27, q5-P03 |
| S6 | q6-P01 | redundant | What is the best treatment for the #19 mesial defect? | An easy restatement of the best-candidate facts (q6-01, q6-02, q6-M02) and of q6-L30's branch; S1's pc-e3 asks the same of the drawn #19 case. | q6-L30, pc-e3 |
| S6 | pc-e2 | redundant | Which feature of this defect most favors regeneration? | The answer doesn't need the film, so it is a third test of the depth-and-angle threshold; q6-01 (tagged, exam-review) and the q6-M02 select-all keep it, and pc-e1 keeps… | q6-01, q6-M02 |
| S6 | q6-08 | redundant | List the three biologic modifications discussed for periodontal regeneration and one… | A self-graded recall item, not a format on the final; q6-03, q6-04 and q6-05 test each biologic and the new matching item q6-F01 tests telling them apart. | q6-03, q6-04, q6-05, q6-F01 |
| S7 | q7-T02 | redundant | True or false: Peri-implant mucositis includes bone loss beyond the initial crestal… | Third recall item on the same point (q7-L06 single-best, q7-N01 statements 2 and 4); the point is also applied in pc-i1 and the new q7-F01/F02. True/false stays at 7… | q7-L06, q7-N01 |
| S7 | pc-h4 | redundant | Which one new finding would make #5 peri-implantitis? | Same question as pc-i1 ('which finding makes #14 peri-implantitis rather than mucositis', same distractors: suppuration, deeper probing, bleeding) and q7-L06 (cosine… | q7-L06, pc-i1 |
| S7 | q7-09 | redundant | A diabetic patient with optimal glycemic control is considering an implant. What should… | Third item on control-not-duration (q7-L31 key, q7-S04 statement 1); q7-05 keeps 'poorly controlled = contraindicated'. Its 'doubles the failure risk' distractor isn't… | q7-L31, q7-S04 |
| S7 | q7-L34 | low-yield | Roughly when is a two-stage implant uncovered? | A timing detail from a background paragraph; no hint, review table, cram line, likely topic or 'For the final' note points to two-stage timing. q7-L33 keeps the… | q7-L33 |
| S7 | q7-L37 | low-yield | Distraction osteogenesis is on the slide as a way to: | One item of a slide list the notes mention in passing; no hint, review, cram line or topic points to it, and Dr. Kaur's part of the final is the three peri-implant… |  |
| S8 | q8-L23 | redundant | Avoid clindamycin in a patient with a history of: | Third test of the clindamycin-colitis link (q8-05 asks it directly, q8-P02 applies it in the allergy ladder); q8-L23 is untagged and had duplicate why lines. | q8-05, q8-P02 |
| S8 | q8-L33 | redundant | Why is ciprofloxacin usually given with metronidazole? | q8-L32 tests ciprofloxacin's anaerobe gap and the reworked q8-L31 tests the cipro + metronidazole pairing; metronidazole's anaerobe coverage is already q8-10 and… | q8-L32, q8-L31 |
| S8 | q8-L46 | redundant | Why isn't bacterial resistance a concern with Periostat? | Same fact as q8-T12 (no resistance, so long-term use), with q8-N06 statement 1 (it doesn't kill bacteria) and q8-14 (collagenase, not an antibiotic effect) also on it.… | q8-T12, q8-N06 |
| S8 | q8-L04 | low-yield | Which appointment does Dr. Litz call arguably the most important in his periodontal… | A 'who said' item on a passing remark: no hint, likely topic, review table, cram line or 'For the final' note points to it. |  |
| S8 | q8-L40 | low-yield | How is Atridox prepared? | Brand-specific preparation detail (syringes, cycles); no hint or cram line points to it. What Atridox is (10% doxycycline in a polymer, biodegradable) stays in q8-11,… | q8-11, q8-T08 |
| S8 | q8-T03 | low-yield | True or false: Cephalosporins may be given with food. | A one-line slide detail with no hint, cram or likely-topic signal; the cephalosporin points the hints stress (cross-reactivity) are q8-L19, q8-L20 and q8-P02.… |  |
| S9 | q9-S04 | redundant | Read the two statements. / 1. An acellular dermal matrix can be left exposed to heal,… | Both statements are tested twice elsewhere: covered by q9-L20 and q9-N02, many teeth by q9-L19 (an application) and q9-M02 (select-all). S9 keeps 5 two-statement items. | q9-L20, q9-N02, q9-L19, q9-M02 |
| S9 | q9-S05 | redundant | Read the two statements. / 1. Type 2 altered passive eruption has a wide band of… | Type 1 vs 2 is tested by q9-08 and q9-N03, the B types' osseous surgery by q9-07 and q9-N03. Its statement 2 also gave 1B an apically positioned flap, which the notes… | q9-08, q9-N03, q9-07 |
| S9 | q9-T13 | redundant | True or false: Phenytoin is the drug-induced gingival enlargement you'll meet most often… | Third test of the same point; q9-L37 (multiple choice) and q9-N05 (numbered) keep it. S9 keeps 13 true/false items. | q9-L37, q9-N05 |
| S9 | q9-10 | redundant | A hypermobile upper lip that exposes excess gingiva on smiling is best managed with: | q9-L30 tests it from the findings (11 mm of lip travel) and the new matching item q9-F01 maps every cause to its treatment. | q9-L30, q9-F01 |
| S9 | q9-L27 | low-yield | After a free gingival graft held only by sutures, which instruction did he give the… | A post-op instruction the notes mention in passing; no hint, review table, cram line or likely topic points to it. |  |
| S9 | q9-L10 | redundant | A canine has 4 mm of facial recession, and the interproximal CEJ can't be found on… | Third test hub-wide of RT1 = full coverage; the two chart readings (q9-P04, pc-c2) keep it in the radiograph-and-chart form the final uses. | q9-P04, pc-c2 |

**New questions:**

| Session | Id | Format | The question | Hint |
|---|---|---|---|---|
| S1 | q1-F01 | multi | Which conclusions does the Becker et al. tooth-loss data cited in lecture support? Select all that apply. | 4 |
| S1 | q1-F02 | multi | Which findings are used to set the stage of periodontitis, rather than the grade? Select all that apply. | 103 |
| S1 | q1-F03 | match | Match each finding to the stage or grade it points to. | 103 |
| S2 | q2-F01 | match | Match each suture material to the use the course chart gives it. | 105 |
| S2 | q2-F02 | mcq | A vertical releasing incision is carried through the middle of the papilla between #8 and #9 instead of at a line angle. What is… | 10 |
| S2 | q2-F03 | mcq | A trapezoidal flap is outlined for a large ridge augmentation. How should its two vertical releasing incisions run? | 11 |
| S3 | q3-F01 | multi | Which statements about how accurate McGuire & Nunn prognoses turn out to be are true? Select all that apply. | 13 |
| S4 | q4-F01 | multi | You are root planing subgingival calculus on the mesial root surface of #19. Which instruments are designed for that surface?… | 109 |
| S4 | q4-F02 | mcq | You are scaling the maxillary right molars and rest your ring finger on the mandibular right premolars. Which finger rest is this? | 17 |
| S4 | q4-F03 | multi | Which statements about Glickman furcation classes are true? Select all that apply. | 25 |
| S4 | q4-F04 | mcq | A mandibular first premolar has a 5 mm pocket and grade 2 mobility, and it is fremitus-positive. The patient has no molars on… | 27 |
| S4 | q4-F05 | mcq | Which plan makes the best use of the clinic's piezoelectric ultrasonic during SRP? | 33 |
| S5 | q5-F01 | multi | A periodontally stable patient probes 2-3 mm everywhere except one 7 mm site on #19, a root-canal-treated molar with a crown.… | 53 |
| S5 | q5-F02 | mcq | Dr. Litz repeated one goal for almost every periodontal patient, for Phase I and surgery alike. What is it? | 48 |
| S5 | q5-F03 | mcq | In one patient, #19 and #20 each have 5 mm of attachment loss on the buccal. On #19 the loss reaches the furcation (Glickman… | 37 |
| S5 | q5-F04 | mcq | A mandibular first molar probes 5 mm at the mid-buccal. As taught, what does that suggest? | 38 |
| S6 | q6-F01 | match | Match each regenerative approach to what it does. |  |
| S7 | q7-F01 | match | Match each 2017 diagnosis to the findings that fit it. Each implant is read against its own baseline from the crown seating. | 67 |
| S7 | q7-F02 | multi | An implant's crown was seated 3 years ago. At the seating it probed 4 mm with no bleeding, and the film showed the bone 1 mm… | 58 |
| S8 | q8-F01 | mcq | After a prophylaxis, why do the orange- and red-complex bacteria colonize only after the early colonizers? | 85 |
| S8 | q8-F02 | mcq | Left untreated, why does a deepening periodontal pocket tend to keep getting worse? | 84 |
| S9 | q9-F01 | match | Match each cause of gingival excess or a gummy smile to its treatment. | 123 |
| S9 | q9-F02 | multi | A lower incisor with an RT2 recession is sensitive and hard to clean, and its margin sits in alveolar mucosa with no keratinized… | 98 |


**For Sam: things in the notes the reviewers flagged** (not changed, because a notes edit means narrating that session
again; no question turns on any of them now): see [the inbox](../inbox.md) line for this audit.

1. S1: the notes say heavy smoking is "more than 10" cigarettes a day; the review table and the questions say "10 or
   more". `q1-09` (the 2018 merger of chronic and aggressive periodontitis) isn't in the S1 notes, and S8's notes still
   say "aggressive periodontitis".
2. S2: the notes disagree on chromic gut (the first suture paragraph gives plain gut as the fastest, 7-10 days, and
   chromic 10-14; the course chart and the Review table give chromic gut 7-10 days, the fastest). The questions follow
   the chart. The Review table's split-thickness row says "used when apical repositioning is needed", which reads
   against full thickness for crown lengthening and osseous surgery.
3. S3: the 13-year-old's pockets are "on first molars and #14", but #14 is a first molar (an incisor meant?).
4. S4: hint 110's takeaway says Phase I heals "by a long junctional epithelium"; the S4 notes never say it. Polishing
   (`q4-44`, `q4-46`, `q4-47`) is from the deck only and the final's note doesn't name it: kept.
5. S5: the cram line "Resective osseous surgery (in class, not yet lectured)" is out of date (taught Oct 15).
6. S6: the notes' risk assessment calls a defect involving 1 or 2 sides of the root "contained" and 3 or more
   "non-contained", which reads against the decision tree ranking a circumferential defect next to a 3-wall one. The
   reviewer's question on it was replaced; worth a look when S6 goes taught.
7. S7: the notes and `q7-02` use "B. forsythus" (now *Tannerella forsythia*). The `implant-30` drawn case has its bone
   only 0.5-1.5 mm past the remodeling; 1-2 mm deeper would read more clearly.
8. S8: "a patient allergic to cephalosporins is allergic to penicillin 100% of the time" is the slide's, not current
   pharmacology; kept as taught (`q8-L19`, `q8-L20`, `q8-P02` rest on it). Hint 87's quote is a dose (20 mg twice a day),
   though doses are off the final.

**Soft calls Sam may reverse:** the 27 low-yield retirements above (the softest: `q4-L11` passive eruption, `q4-48`,
`q4-42`, `q4-45`, `q8-L04` "the most important appointment", `q3-14`/`q3-15` trial numbers, `q3-24` the $633.63 a
tooth); S6's three text Patient Box items and `pc-e2` (the final has few or none); kept but low-signal: `q9-L04`,
`q9-T10`, `q2-20`, `q2-09`, `q5-L43`, `q8-12`, `q8-L38`, `q8-T11`.

Related: [perio](../../hubs/perio.md) · [decisions](../../decisions.md) · [LESSONS](../../../LESSONS.md)
