# Session 6 reviews (2026-10-13): fix prompts sent to Codex

Claude's reviews of Codex's PRs #83 (T-02), #81 (T-04), #80 (T-05) and #87 (T-03, at the end). The next session checks
the revised PRs against these lists. Method: #83 as in Session 4 (every cited sentence of Core and Deep read beside
its fact; the T-02 acceptance scripts, run on the branch merged with current `claude/boards-hub`); #81 and #80 checked
out, merged with `claude/boards-hub`, built, tested, and #81 walked through in Playwright on the fixture build
(desktop 1280 px, phone 390 px). All three merged together build cleanly and pass `--check`, `syntax.js`, the plan
tests and the full `smoke.js`; the only conflict is the generated `hubs/boards/index.html`, which is rebuilt, never
merged by hand.

What passed: #83's scripted checks (blueprint `total 60 cases 27`, no copy or stem-name lines, build valid) and no
wrong facts; #81's shuffle with authored-index recording, deferred case feedback, Rounds, resume after leaving,
one `boards:answered` per case item, Cover options; #80's 10 tests, a pure core (no `Math.random`/`Date.now`), the CI
step.

## #83 (T-02 pharm notes + blueprint)

```text
Revise PR #83 (T-02, pharm notes + blueprint) on branch codex/boards-pharm-t02. Claude reviewed every cited sentence against its fact; no fact is wrong, but these need fixing. Touch only src/boards/units/pharm/*.

0. First merge claude/boards-hub into the branch (it adds facts PK-3 to PK-6 and EM-11).

1. Pharmacokinetics now has facts. Core, pharm-interactions: add one short paragraph before CYP3A on half-life (about five half-lives to clear), bioavailability and first pass, free (unbound) drug and protein binding, and liver metabolism / kidney elimination [PK-3][PK-4][PK-5][PK-6]. Deep: replace the opening sentence "Use CYP3A as a practical interaction screen, not as a prompt to learn broad pharmacokinetics..." with two or three paragraphs (a small table is fine) on the same facts, including lidocaine's 1.5-2 h IV half-life, prolonged two-fold or more in liver dysfunction. Respect their conditions: no zero-order or steady-state teaching, no bioavailability numbers for named drugs, lipid solubility (not low protein binding) is why a drug crosses the blood-brain barrier, never say kidney disease prolongs lidocaine's half-life, never call albumin lidocaine's binding protein, no dental lidocaine dose reduction for liver disease.

2. Author-facing sentences, rewrite for students:
- Deep antivirals: "The fact supports this regimen for adults and children 12 and older" -> "The regimen is for adults and children 12 and older".
- Deep transplant: "this record does not establish acetaminophen as the preferred drug for every transplant patient" -> "the labels don't name a preferred pain reliever, so choose it with the transplant team".
- Deep prophylaxis: delete "These intervals rest on the AHA statement, so preserve the source attribution."; replace "ADA material confirms the listed drug choices, while pediatric doses require the AHA weight-based amounts" with "The doses are the AHA's; children's doses are by weight."
- Deep buprenorphine: delete "The label and the ADA handout contain a conflicting rinse interval in different places, so use the label-consistent wording rather than the handout's shorter bullet."
- Deep cirrhosis: "so avoid presenting 3 g as a generally safe cirrhosis ceiling" -> "so 3 g a day is not a safe ceiling in cirrhosis".
- Core vasoconstrictors: "Keep this drug-interaction discussion with the vasoconstrictor material in the anesthesia unit." -> "Anesthetic doses and limits are in the Local anesthesia unit." Deep: delete "Dental epinephrine interactions are a narrow drug-specific part of pharmacology." and "This is the pharmacology overlap with local-anesthesia teaching."
- Core "the caplet directions cited here" and Deep "The directions on the cited OTC caplets" -> "one common OTC caplet label limits adults to 3,000 mg a day unless a doctor directs otherwise".
- Deep MRONJ: "the cited schedule places surgery" -> "the 2022 position paper places surgery". Deep dry mouth: "The two FDA-approved oral sialogogues named here" -> "The FDA has approved two oral sialogogues for dry mouth".

3. Pull these back inside their facts:
a. Core high-yield item 4 merges CKD and cirrhosis: the reduced acetaminophen dose is for cirrhosis only (LIV-5); in CKD acetaminophen is the preferred alternative to routine NSAIDs (CKD-3). Split it.
b. Core drugs-change-care: "Aspirin and other antiplatelet medicines should not be stopped for dental procedures without the cardiologist when a coronary stent is involved" implies they may be stopped otherwise. AC-4: they are not stopped for dental procedures; with a coronary stent, any change goes through the cardiologist.
c. END-11 covers procedures under local anesthesia, not all routine dental care: fix the Core table row ("includes routine dental procedures") and the Deep sentence ("treats routine dental care as minor stress").
d. Core END paragraph: "the recommendation is weak and evidence quality is very low" belongs to the no-taper advice in END-10, not to the 40 mg stress dose; END-11's caveat is "practice varies and robust evidence is lacking". Deep END-10 paragraph: attach "weak recommendation" to the no-taper suggestion for courses under 3-4 weeks, not to the risk thresholds.
e. Core tranexamic acid row: hematuria and hemophilia B with prothrombin complex concentrates are contraindications (BLD-5), not "cautions".
f. Deep opioids + benzodiazepines: "The CDC does not say that medication for opioid use disorder should be withheld..." -> "The CDC says buprenorphine or methadone for opioid use disorder should not be withheld from patients taking benzodiazepines" (OPI-6).
g. Deep CDC evidence: "judged NSAIDs more effective than opioids" -> "found opioids probably less effective than NSAIDs" (keep "probably", OPI-1).
h. Deep fluconazole: "It can also add QT-prolongation risk, including with erythromycin" -> "...; avoid combining it with erythromycin" (DI-2).
i. Deep prophylaxis table row "Penicillin or ampicillin allergy; no severe immediate reaction" -> "no anaphylaxis, angioedema or hives" (IE-7's criteria).
j. Methamphetamine (Core and Deep): don't tell students to avoid the term "meth mouth" (SU-1 uses it and the boards do): "rampant caries, often called meth mouth". The respectful-conversation advice can stay.
k. Core high-yield item 8 ("For a prophylaxis regimen, use the drug and allergy guidance...") teaches nothing: replace with the AHA regimen (amoxicillin 2 g 30-60 minutes before; no cephalosporin after anaphylaxis, angioedema or hives with penicillin) [IE-5][IE-7].
l. Deep pharm-interactions second paragraph: the grapefruit sentence cites PK-2 but is PK-1; the codeine/tramadol sentence needs OPI-22.
m. Core table caption "Adult dental prophylaxis regimens" -> "AHA adult prophylaxis regimens" (the doses rest on the AHA table). Core: write out "medication-related osteonecrosis of the jaw (MRONJ)" at first use.

4. Deep gaps (Deep has room: 4,965 of 7,000 words):
- Codeine and tramadol in children: contraindicated under 12 and under 18 after tonsillectomy or adenoidectomy; not recommended at 12-18 with obesity, obstructive sleep apnea or severe lung disease; not while breastfeeding [OPI-19][OPI-20][RX-6].
- AB-5 doses: azithromycin 500 mg on day 1, then 250 mg daily for 4 more days; clindamycin 300 mg four times a day for 3-7 days; about 10% report a penicillin allergy, under 1% are truly allergic.
- VC-5: SSRIs, trazodone, mirtazapine and bupropion have no significant epinephrine interaction; levonordefrin acts mostly on alpha receptors; amphetamines and atomoxetine share the TCA concern. VC-3: phenothiazines may reduce or reverse epinephrine's pressor effect.
- MR-3: the contrast only (cancer under 5% vs osteoporosis under 0.05%), no single table cell.
- OPI-13: when opioids are needed on methadone maintenance, somewhat higher or more frequent doses are often needed.

5. Blueprint:
a. tetracycline-tooth-discoloration (oral effects) and tetracycline-during-tooth-development (pregnancy) are one concept (both PG-7 only): merge them.
b. Add concepts the notes teach and FK8 tests, taking slots from prosthetic-joint-prophylaxis-shared-decision, inhaled-steroid-related-candidiasis and tobacco-cessation-medicines-and-support (2 -> 1 each) and the merged tetracycline concept: pk-basics (PK-3 to PK-6, pharm-interactions, cog 1-2); mme-calculation (OPI-7, pharm-opioids, a calc item from OPI-7's data, name CDC 2022); codeine-tramadol-cyp2d6-children (OPI-19, OPI-20, RX-6); antiresorptive-mronj-risk (MR-3, MR-5, MR-6, pharm-drugs-change-care) if a slot is left.
c. c-pharm-0001: metronidazole "started yesterday by another clinician" has no stated reason and overlaps the abscess decision, and with a hives allergy the AB-3 drugs are out, so an AB-3 item keyed on its drug list would be wrong for her. Change that hx line to "Fluconazole started yesterday by her physician for vaginal candidiasis", key the interaction item on DI-2, make the AB-3 item about whether to prescribe (definitive care is not until tomorrow) and leave the drug to the AB-5 item.
d. c-pharm-0002: pregnant with hives and lip swelling to amoxicillin, the AHA alternatives are azithromycin/clarithromycin or doxycycline; doxycycline is a tetracycline (PG-7) and azithromycin isn't on the ADA pregnancy list (PG-4), so the key would rest on facts we don't have. Change the allergy to "Amoxicillin: itchy rash, no hives, swelling or breathing trouble (2019)" so cephalexin 2 g is the key (IE-5, IE-7, and cephalosporins are on PG-4's list). Chief complaint should fit scheduled scaling and root planing (e.g. "My gums bleed when I brush." (3 months)).
e. c-pharm-0004: the XE-1 item has no dry-mouth finding (add "Reports a dry mouth; mucosa dry and tacky"); the RX-3 opioid item has nothing about which analgesics were tried: replace it with nsaid-sensitivity-and-asthma (add "Wheezing and hives after aspirin (2018)" to hx); the AB-3 and AB-6 items conflict (no adjunct once definitive care is done vs add metronidazole when first-line fails): keep AB-6, move the AB-3 use elsewhere.
f. c-pharm-0006: two prosthetic-joint items in one case give each other away: keep one.
g. c-pharm-0007: at 26 weeks an ADA dose-ceiling item can't be keyed (PG-4: ask the obstetrician about pain relievers; PG-6 limits NSAIDs from 20 weeks). Replace it with a pregnancy item (PG-5 radiographs and shielding, or PG-6's 48-hour rule); move the dose-ceiling concept to a standalone or a non-pregnant case.
h. c-pharm-0005: say in the outline that the TX-6 item keys the NSAID kidney risk, not acetaminophen as "the" choice (TX-6 conditions).
Keep 60 items, 27 in 6-8 cases, 35-45 concepts, 8-12 hy.

6. Rerun T-02 acceptance 1-6 (all six) and paste the last lines; list in the PR what changed for each numbered point above.
```

## #81 (T-04 cards, cases, Questions mode)

```text
Revise PR #81 (T-04) on branch codex/boards-t04-int-cards. Claude walked the fixture build through in Playwright (desktop 1280 px, phone 390 px). Shuffle, authored-index recording, deferred case feedback, Rounds, resume and one event per item all work. Fix these:

0. Merge claude/boards-hub into the branch first. If #80 has merged by then, hubs/boards/index.html will conflict: never resolve it by hand, take either side and rerun node tools/build-boards.js.

1. Practice jumps into Cases and then can't get back. renderBank() switches to the Cases sub-view whenever pool[at] is a case item, so tapping Next onto one leaves Practice, and after that tapping Practice bounces straight back into the case because STATE.ui.bankAt still points at it. Practice should hold standalones only (add !x.case in bankPoolBase); case items are reached from Cases, Missed and SH_GOTO.

2. New only skips questions. After you answer, the item leaves the pool, so Next (bankAt + 1) skips the next new one (fixture: answered b-medcx-0001 "1 of 15", Next showed b-medcx-0003 "2 of 14"). When the current item has just dropped out of the pool, Next keeps the same index.

3. Missed is read-only. Missed standalones render with review:true, so they can't be retried, though the empty state says they come back "until you get them right". Show them as live cards (lockIn:false, ctx 'bank'), one at a time with Previous / Next like Practice, with the same index fix as point 2; a missed case still opens in review.

4. A finished case can never be done again, and a first attempt can skip items. renderCase() skips any item that has an entry in STATE.answered (so an item answered in the drill or the game is skipped in the case) and opens Rounds once all have one; the list only offers "Review case". Track progress with STATE.ui.caseProgress[id].next only, and give a Done case two buttons: "Review" (Rounds) and "Do it again" (resets next to 0).

5. Phone: the chart is open by default and in the fixture is about 1,300 px tall, so question 1 starts below the second screen. Under 640 px, open the chart for the first item only; from item 2 and in Rounds start it collapsed (its summary shows the patient line, e.g. "Chart: Male, 58 years old"), and scroll the current question into view after "Next question".

6. Small: review-mode options are divs with role="listitem" but .qcard-choices has no role="list"; add it (or drop the role).

Then: node tools/build-boards.js, node tools/build-boards.js --check, node tools/ci/syntax.js, and redo the T-04 walk-through (add: Practice never leaves the Practice tab; New only reaches every new item; a missed standalone can be answered from Missed; "Do it again" restarts a done case at question 1; phone screenshot of question 2 with the chart collapsed). Paste results in the PR.
```

## #80 (T-05 readiness and daily plan)

```text
Revise PR #80 (T-05) on branch codex/t05-readiness-plan. Tests pass and the core is pure; these are logic fixes. Touch only src/boards/app/45-readiness-plan.js, tools/ci/boards-plan.test.js, fixtures, and the regenerated page.

0. Merge claude/boards-hub into the branch first.

1. Retirement skips the last review. dailyPlan retires an item the moment its 120-day review comes due, so that review is never asked; BUILD_SPEC 1.5 counts it ("one item costs 7 reviews over about 235 days"). Plan the 120-day review like any due item and retire only after it was answered right at that step. The srs map can't tell "just reached the last step" from "answered at it", so: the core also returns finalDue (ids planned while due at the last step), the wrapper stores the day in STATE.ui.finalReview[qid], ctx carries it back, and an item retires when finalReview[qid] is set, srs b === steps.length, its srs t is on or after that day and history lastCorrect is true (b only reaches the last step after an unbroken run of right answers, so that covers the 3-right streak). Update the retirement test.

2. New case items are picked one by one, so a new case's item 3 can be planned before items 1-2 and outside its case (no Rounds). New-item picks take standalones only (no item with a case); Today will offer a whole new case separately later (int-notes-home). Due case items stay as now (alone, at most 3 per case per day). Add a test.

3. The monthly sample only happens on the 1st (dateDay === '01'), so someone who doesn't study that day never gets retired items back. Add ctx.lastPlanMonth ('YYYY-MM'); sample on the first plan of a new month; the wrapper stores it in STATE.ui.planMonth. Test a plan on the 3rd with no plan yet that month.

4. Readiness with almost nothing seen: band defaults to 'Started' even when seen is 0; BUILD_SPEC 6.4 needs seen >= 10% for Started. Return band null below 10% and test it. likely is averaged over practiced items only, which is how "adding items never lowers likely" holds; keep that, say so in a code comment and in the PR text (Claude will update BUILD_SPEC 6.4 to match).

5. Ability throws away the first try: each answered item is replayed once, from lastCorrect, at weight 0.3 when n > 1. STATE.answered also keeps first (was the first try right?): replay the first try at weight 1 (0.8 for a sibling), then, when n > 1, the latest result at 0.3, in that order (both on day t). Test: same n and lastCorrect, first:true gives a higher theta than first:false.

6. Same-day plans can disagree: the wrapper fetches class stats asynchronously, so the first plan of a session uses empty stats and a later one the same day can differ (Today and the drill would show different sets). Freeze the day's plan in the wrapper: STATE.ui.plan = {day, size, ids}, returned as-is while day and size match.

7. ES5 style: the wrapper's function declarations sit inside if(typeof STATE !== 'undefined'){...}; make them function expressions (var boardsPlanStats = function(){...}).

Then rerun the T-05 acceptance (test pass line with the new count, --check, syntax, the grep for Math.random / Date.now / new Date() in the core) and paste it in the PR, with one line per numbered point saying what changed.
```

## #87 (T-03 perio notes + blueprint)

Arrived during the session. Same method as #83 (`node tools/boards/notes-sheet.js perio`); branched from current
`claude/boards-hub`, so no merge needed. Scripted checks pass (build valid, `total 60 cases 30`, no copy or stem-name
lines, Core 3,409 / Deep 5,423 words). The notes are careful with qualifiers; one statement is wrong.

```text
Revise PR #87 (T-03, perio notes + blueprint) on branch codex/boards-perio-t03. Claude read every cited sentence against its fact; the notes are careful, but fix these. Touch only src/boards/units/perio/*.

1. One wrong statement. Core (mucogingival, after the Cairo paragraph) and Deep (the last mucogingival paragraph) say the classification "does not ... predict root coverage". Cairo's recession types were introduced partly to predict root coverage (RT1 best, RT3 worst), so this is wrong. Delete the sentence in both files; don't replace it (no fact covers root coverage yet).

2. Author-facing or source-talk sentences, rewrite or delete:
- Core exam: delete "A complete probing sequence and an arithmetic method for deriving CAL ... are not detailed here." Deep: delete "A complete probe path and site-by-site technique sequence are not detailed here." and "Probe angulation, walking strokes and a formula deriving CAL ... are not detailed here."
- Mobility (Core and Deep): drop the talk about conflicting descriptions and "the available mobility review has a limitation". Write only: Miller grade 3 is the one with vertical (depressible) movement; the 2017 staging chart counts mobility of degree 2 or more as a stage IV complexity factor [FM-4][PS-5].
- Deep biofilm: "The record cautions against using menstrual-cycle changes or current low-dose contraceptives..." -> "Menstrual cycle-associated gingivitis was dropped from the classification because its signs are rarely visible, and today's low-dose oral contraceptives don't cause the changes reported with the old high-dose pills" [BF-2]. Core: same idea in place of "should not be used as stand-alone diagnoses of visible gingivitis".
- Deep biofilm: "Keep the age group, diabetes type and uncertainty attached to that observation. Do not extend it into a general rule..." -> "This applies to children with poorly controlled type 1 diabetes."
- Deep radiographs: delete "while remembering that the chart source has a limitation in how its table was extracted"; "Therefore, avoid saying that a two-dimensional image always underestimates bone loss or assigning a fixed correction in millimeters" -> "so a 2D image can err in either direction, and there is no fixed correction in millimeters".
- Deep grading: delete "Use the stated cutoffs without adding precision beyond those values."
- Deep prognosis: "Teach the asymmetry:" -> "In short:"; "Because these are cohort observations rather than a universal guideline, use them to avoid deterministic language, not to promise..." -> "These are cohort findings: they argue against writing a tooth off, not for promising it will survive." Also "fewer than one-third were extracted for periodontal reasons" -> "most of the teeth extracted in one maintenance cohort were lost to fracture, caries or endodontic problems rather than periodontitis" (PR-7: teach the principle, not the number).
- Deep therapy: "These recommendation categories should not be rewritten as proof of harm..." -> "A recommendation against is not proof of harm or a contraindication." Deep surgery: "so translate 'adequate' into the clinical care context rather than inventing a percentage" -> "The guideline sets no plaque-score cutoff for 'adequate'."
- Deep therapy: "The calculus review specifically cautions that calculus is not itself the primary cause of periodontitis" is not something the source says (it is a note in the fact's conditions). Write instead: calculus matters as a rough, plaque-retentive surface; the disease is driven by the host response to the plaque biofilm [BF-5][PSY-1]. Core biofilm: replace "whose presence and host response matter more than calculus as a material" with the same idea.
- Deep maintenance: drop "and potential additional improvement" (not in PT-11).
- Core table: "localize at 10–30%" -> "localized at 10-30%". Core adjuncts table: "benefit is not a required standard" -> "a weak recommendation, not a standard of care" [PT-9]; "advises against" -> "suggests not using" for lasers, probiotics and sub-antimicrobial-dose doxycycline (PT-6's wording).
- Deep PerioChip: say the label does not recommend it in an acute periodontal abscess (not studied) [LD-2].

3. Blueprint concepts overlap (siblings in disguise): PH-5 carries three concepts (treated-periodontitis-status, health-on-reduced-periodontium, treated-periodontitis-stability), MG-1 two (recession-description, gingival-phenotype), PA-1 to PA-3 three (acute-lesion-features plus the abscess/necrotizing and endo-perio concepts), and BF-2/BF-3 two (gingivitis-modifying-factors, risk-modifiers-smoking-diabetes). Merge each group to one or two concepts and give the freed slots to the brief's priorities: peri-implant disease (4 items now, 6 facts) and staging/grading or therapy. Keep 60 items, 30 in 7-9 cases, 35-45 concepts, 8-12 hy.

4. Case outlines:
a. c-perio-0005: tooth 30 is a mandibular molar with a residual 6 mm pocket and Class II furcation, so EFP recommends regenerative surgery there (SX-1, PR-6), and a therapy-sequence item keyed on access flap surgery (PT-4) would have two defensible answers. Either put the residual 6 mm pocket on a tooth without a furcation or intrabony defect for the PT-4 item, or key the item on regeneration (regenerative-surgery-indications). The supportive-care item needs a stem that moves the story past step 3.
b. c-perio-0008: "multiple Class II furcation sites" on tooth 18 (a mandibular molar) falls under both SX-1 (regeneration recommended) and SX-2 (several options may be considered, none the single answer). Make it a maxillary molar (e.g. tooth 3 with buccal and mesial Class II) and key the item on PR-6 (furcation is not a reason to extract; treat the tooth), never on one surgical technique (SX-2 conditions).
c. c-perio-0003: the box has a periodontal abscess at tooth 19 and necrotic papillae in the same quadrant, so the acute item has two diagnoses. Keep the abscess and remove the necrotizing line (or split it into its own case with what PA-2 needs).
d. c-perio-0004 (gingivitis, no periodontitis): the second item must not apply the EFP periodontitis steps (PT-1, PT-2: step 2 is subgingival instrumentation for periodontitis). Key it on BF-1 (gingivitis resolves when the inflammation is treated) or BF-5 (calculus as a plaque-retentive surface).
e. c-perio-0006: give the baseline bone level so the bone loss beyond remodeling is explicit ("bone level 3 mm more apical than on the baseline radiograph"). The RAD-1 item clashes with "selected bitewing and periapical images are available": drop that line or replace the item. The two peri-implant items (site 19 and site 30) must test different decisions; the health one is nearly free once the first is answered, so consider moving it to a standalone.
f. c-perio-0009: the chief complaint mentions enlarged gums but the findings don't describe any: add one ("Firm gingival enlargement of the anterior papillae, more than the plaque level would explain").
g. c-perio-0001: interdental CAL 5 mm (stage III) with RBL 28% "in the coronal third" (stage II) is internally inconsistent. Make them agree (e.g. RBL 35% reaching the middle third), unless the item is meant to test that CAL outranks RBL, in which case say so in the outline. The RAD-1 item needs a stem that fits a box where bone loss is already measured.

5. Rerun the T-03 / T-02 acceptance checks and paste the last lines; list in the PR what changed for each numbered point.
```
