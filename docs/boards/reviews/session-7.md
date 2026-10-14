# Session 7 reviews (2026-10-14): re-reviews and the first medcx item check

Claude's re-reviews of Codex's revised #80 (T-05), #81 (T-04), #83 (T-02) and #87 (T-03) against
`session-6.md`, and the first independent check of #91 (T-06, 60 medcx items). Fix prompts below, verbatim, for Sam to
send to Codex. Next session checks the revised PRs against them.

## Verdicts

| PR | Session 6 list | New problems | Verdict |
| --- | --- | --- | --- |
| #80 T-05 plan | all 7 points done; 12 tests pass, `--check`, syntax, core still pure | 1 bug: a stale final-review mark retires an item early (reproduced) | one small fix, then ready |
| #81 T-04 cards | all 6 points done; Codex's extended walk-through passes 10/10 (desktop + 390 px) and Claude's extra phone step passes (question 2 opens with the chart collapsed, summary "Chart: Male, 58 years old", question at y=260) | Practice and Missed share one position (`STATE.ui.bankAt`), so opening Missed loses your Practice place | one small fix, then ready |
| #83 T-02 pharm | all of 0-5 done except 3j in Deep and 5h; acceptance: valid, `total 60 cases 27`, no COPY/STEM lines, Core 3,096 / Deep 5,313 words; the new PK paragraphs stay inside PK-3 to PK-6 | none | **ready to merge**; Claude carries the two leftovers (below) |
| #87 T-03 perio | all of 1-4 done; acceptance: valid, `total 60 cases 30`, no COPY/STEM lines, Core 3,332 / Deep 5,267 words, 35 concepts, 10 hy, peri-implant now 6 slots | c-perio-0005's box now says "After regenerative surgery (step 3)", which gives away its own regeneration item; Deep's diabetes paragraph lost its subject | one small fix, then ready |
| #91 T-06 medcx items | code checks pass: lint 0 errors (47 warnings, all older-source notices), build valid, `--check`, syntax, count check `items 60 in-cases 30 cases 8 negatives 7 key-index 15/16/14/9` (one EXTRA-REF, EM-11 on 0129, which is fine) | checker: 16 clean on both passes, 44 need fixes, 7 with a high flag | fix round, then stage 4b |

Merged on 2026-10-14: #80 (before its fix, which now goes in a follow-up PR) and #83. Next: #81 (Codex merges
`claude/boards-hub` and reruns the build, never resolving `hubs/boards/index.html` by hand), then #87 after its fix.

**#83 leftovers:** the Deep methamphetamine line now reads "rampant caries, often called meth mouth" (done in this
PR); 5h (the TX-6 outline note) has no field in the
blueprint schema, so it goes into the T-07 brief instead: "c-pharm-0005's TX-6 item keys the NSAID kidney risk, not
acetaminophen as the choice".

## #91 checker run (stage 4a)

Method: `bench.mjs render` in 6 batches of 10 (cases whole, `docs/boards/verify/medcx-r1/batch-b*.md`), one fresh
Sonnet agent per batch per pass with `checker-prompt.md`, two passes on every batch (55 of 60 items cite a high-risk
fact, so all got two), union of flags (`verdicts-b*-p*.json`; ids map through `key-b*.json`). First cross-family check
(Codex wrote, Claude checked). Claude adjudicated every medium/high flag: almost all are real; the ones dropped are
noted in the prompt. The biggest pattern is one the brief already forbids (T-06 rule 6): in about 30 items the
distractors are throwaways (absolutes only in the wrong options, unsafe or absurd actions, "without consulting"),
so the item is answerable by test-wiseness alone. Agents hit the usage limit just after writing their files; all 12
files are complete.

## Fix prompts

### #80 (T-05)

```text
#80 (T-05) is already merged into claude/boards-hub, but one bug remains. Fix it on a new branch from the current claude/boards-hub (e.g. codex/t05-final-review-fix) and open a PR into claude/boards-hub.

A stale final-review mark retires an item without its 120-day review. STATE.ui.finalReview[qid] is only cleared on retire or unretire. If the item is missed at its final review (b resets to 0), the old mark stays; when the item climbs back to the last step, t is already on or after the old day and lastCorrect is true, so the next plan retires it at once. Reproduced with the core: srs {b:7, t:'2027-06-09', due:'2027-10-07'}, history {lastCorrect:true}, finalReview {q:'2027-01-05'}, day '2027-06-10' -> retire ['q'].

Fix: in the core, ignore a finalReview mark when srs b < steps.length and return those ids as finalClear; the wrapper deletes them from STATE.ui.finalReview. Add that scenario as a test (expect no retirement and q in finalClear). Touch only src/boards/app/45-readiness-plan.js, tools/ci/boards-plan.test.js and the regenerated page (rebuild it with node tools/build-boards.js, never edit it by hand). Then run the plan tests, node tools/build-boards.js --check and node tools/ci/syntax.js, and paste the lines in the PR.
```

### #81 (T-04)

```text
Revise PR #81 (T-04) on branch codex/boards-t04-int-cards. All six Session 6 points are done; the walk-through passes. One small fix:

Practice and Missed share STATE.ui.bankAt, so opening Missed clamps it to the missed list and going back to Practice lands on the wrong question (Practice at item 12, open Missed with 2 items, back to Practice: item 2). Give Missed its own index (STATE.ui.missedAt), with the same keep-index-when-the-item-left-the-pool rule on Next. Add a walk-through step: Practice to item 3, open Missed, back to Practice, still item 3.

Then merge claude/boards-hub (#80 has landed, so hubs/boards/index.html will conflict: take either side and rerun node tools/build-boards.js, never resolve it by hand), node tools/build-boards.js --check, node tools/ci/syntax.js, the walk-through, and paste the results.
```

### #87 (T-03)

```text
Revise PR #87 (T-03) on branch codex/boards-perio-t03. Every Session 6 point is done. Two small fixes, touch only src/boards/units/perio/*:

1. c-perio-0005: the box's last finding, "After regenerative surgery (step 3), later reevaluation finds no bleeding pocket deeper than 4 mm...", tells the student the answer to the regenerative-surgery-indications item. Remove it from the box and say in the outline that the supportive-care item's stem carries it ("Three months after regenerative surgery, ...").
2. Deep biofilm: "One diabetes observation has a narrow population: in this group, gingivitis is consistently seen..." lost its subject. Write: "In children with poorly controlled type 1 diabetes, gingivitis is consistently seen, and glycemic control may matter more to its severity than plaque quality." and drop the following "This applies to..." sentence [BF-3].

Rerun the T-03 acceptance checks and paste the last lines.
```

### #91 (T-06)

```text
Revise PR #91 (T-06, medcx items) on branch codex/boards-medcx-t06. Code checks pass. An independent checker (two passes per item, Claude) read all 60; 16 are clean, 44 need fixes. Keep ids, case order and the answer letters' spread (re-run the count check). Touch only src/boards/units/medcx/items.js.

A. Distractors (about 30 items; this is T-06 rule 6). Too many wrong options are throwaways: absolute words only in distractors ("every", "all", "solely", "automatically", "Ignore", "without consulting"), unsafe actions nobody would choose (give juice to someone who can't swallow, resume the restoration during a stroke), or a key that is the only hedged, longest, "coordinate with the physician" option. Rewrite each flagged distractor as a specific error a prepared student could make: an older guideline or number, the right action at the wrong time, the right drug at the wrong dose, a neighboring condition's rule. Keep options parallel and similar in length; hedge some distractors and state some keys plainly. Items: 0101, 0103, 0107, 0108, 0111 (A, D), 0112, 0116, 0118, 0119, 0120, 0123, 0126, 0130, 0131, 0132, 0138, 0139, 0141, 0142, 0143, 0145, 0148, 0152, 0154, 0155, 0156, 0158.

B. Item problems (fix each; ids are b-medcx-0NNN):
- 0101: the explanation says "her controlled hypertension"; the box reads 166/96 on repeat. Fix the explanation.
- 0102: the chief complaint is chewing pain but the stem calls the extraction elective; under BP-3 pain-driven BP of 160-180 takes the emergency pathway, so B and C are both defensible. Either make the visit clearly elective (no pain; scheduled extraction of an asymptomatic tooth) or key the emergency pathway.
- 0103: the distractors are non-cardiac lines from the box. Use real confounders from IE-2/IE-3 (coronary stent, pacemaker, mitral valve prolapse or another native valve disease).
- 0105: "What A1C threshold meets the criterion" is met by 6.5, 7.0 and 8.0. Ask for the lowest A1C that meets the diagnostic criterion.
- 0106, 0107, 0108: the c-medcx-0002 patient is male; stems and explanations say "she/her". Also 0106's box line "After initial treatment becomes less responsive" leaks 0107: move it into 0107's stem. 0108: 0107's stem already has help being called, so "Call EMS" in 0108's key is not a new action; key the repeat-dose rule itself.
- 0111: option D's "removable-appliance adjustment" is not in IE-4 (placing removable appliances, adjusting orthodontic appliances); option A (checking blood pressure) is not a dental procedure. Tie the stem to the case's patient.
- 0112: "no prior joint infection" doesn't rule out PJ-2's exception (complications from the joint surgery). Write "no complications after the joint replacement".
- 0114, 0115: clopidogrel plus apixaban is not dual antiplatelet therapy; 0115's stem says it is and 0114's explanation implies it. Fix both. 0115's stem ("avoid an uncoordinated interruption") and 0116's ("while her antithrombotic medicines are continued") give away 0114 and 0115: reword so a later stem doesn't state an earlier answer. 0116: "local approach" in the stem rules out A by wording alone.
- 0117: each distractor attributes a made-up threshold to the archived guide ("the guide's fever threshold", an eGFR "chemotherapy threshold"). Distractors may be wrong numbers, not false claims about what a source says.
- 0120, 0121: the c-medcx-0006 box is an anaphylaxis in progress (hives, hoarse voice, lip swelling, BP 88/54), but 0120 asks which question decides whether elective care should proceed, and 0121 is a hypothetical future bronchospasm. Order the case so the emergency items come first and the later items move the story on explicitly ("Two weeks later, at a follow-up visit, ..."), or rewrite these two around the emergency. 0120's key is the only option phrased as an instruction: make all four the same form.
- 0124: at 24 weeks she is in the second trimester, so "Schedule it for the second trimester" is also right. Replace C with a real error (e.g. "Wait until after delivery"). The box line "Routine restorative treatment can be completed" states the key: delete it.
- 0126: the box has the faint during this visit's injection but the stem plans the restoration "before" it; make the timing consistent.
- 0127: the stem names P-C-A-B-D and the options spell it out letter by letter; ask about a step's content, not its letter.
- 0128: "lost consciousness with arm jerks" makes seizure (B) defensible; either say "a few brief jerks lasting seconds, awake within a minute, no confusion afterward" and explain convulsive syncope, or drop the jerks. Fix the D and C why lines ("not the pattern asked about here" explains nothing).
- 0131: all three distractors are throwaways and the cited ASA facts aren't tested. Rewrite the item to test an ASA class decision from the box (e.g. which class), or reject and write a new one for the same concept.
- 0132: diastolic 104 and 102 are in the 101-109 band BP-3's conditions say to avoid (the ADA table contradicts itself there). Use diastolics under 100 (e.g. 168/94 and 166/92). The stem sentence "Urgent pain needs treatment" hands over the pathway: delete it; the box already has the pain.
- 0133: C "Neither" is a disguised none-of-the-above and A (aspirin) is not a cardiac history. Use four cardiac histories. "Routine prophylaxis and cleaning" reads as antibiotic prophylaxis: say "a routine dental cleaning".
- 0134: the explanation calls clindamycin "the tempting wrong answer", but clindamycin is the key. Fix the explanation.
- 0138: the NOT-item explanation calls the keyed option the "tempting wrong answer"; the "one-year delay" in C is in no fact (use one idea per option).
- 0139: INR 3.4 is above the ADA's "3.0 or less" and only inside a 3.5 rule the stem doesn't name. Use an INR inside 2-3 (e.g. 2.6) so every cited source agrees.
- 0140: the box says "INR 3.7 measured today", which is the keyed option, and the key rests on the same disputed 3.5 cutoff. Remove the INR from the box and key a value no source calls safe without consulting (e.g. above 4.0, using the fact's "some experts up to 4.0" wording), or rewrite the item on a different decision.
- 0144: the item hinges on 70 vs 72 mg/dL, and 70 is "recovered" in several US sources. Test a step of the 15-15 rule instead (how much carbohydrate, how long to wait, what to do if still low), and note the CKD juice point if you use juice.
- 0152: the box gives the last denosumab injection as 2 months ago, which invites the 3-4 month timing (MR-5) the key doesn't use. Either key the timing or remove the date.
- 0154: the box says tooth 19 is nonrestorable, so option C ("consider a restorative or endodontic alternative") is also not appropriate for this patient: two answers to the NOT stem. Make C fit the box.
- 0155: B is off the stem (about dental care, not ibuprofen); the stem says "FDA guidance" but cites the label: name the label.
- 0156: "within 72 hours" frames 72 h as the target; write "as soon as possible, ideally within hours (no later than 72 hours)" and keep the evaluating-clinician step.
- 0157: "at least 6 weeks" and "at least 3 months" are nested (both true at 4 months). Use non-nested options; the explanation's "longer waiting period used for HCT" (100 days) is barely longer: rewrite it.
- 0159: the box says "Carries a 0.15 mg epinephrine auto-injector", which is the key. Remove it (give the weight only).
- 0160: "Arrange prompt medical attention" is EM-2's label wording but reads vague in a dental office: write "Call 911 (activate EMS)" and keep the explanation on EM-2 (pain that persists after 3 tablets in 15 minutes, or differs from usual).

C. Not changed (checker flags Claude dropped): 0144's citation flag is moot once the item is rewritten; the "convulsive syncope is common" point in 0128 is a fix, not a reject.

Then rerun T-06 acceptance 1-3, list in the PR what changed per item, and mark every changed item so Claude can run stage 4b (two fresh checker passes) on exactly those.
```
