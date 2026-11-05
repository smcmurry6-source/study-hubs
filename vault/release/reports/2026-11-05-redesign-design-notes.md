---
type: reference
tags: [redesign, taste, design]
---

# Design notes for the 2026-11 site redesign

The Taste skill's working notes, kept in the vault so the next agent can continue from them. Evidence:
[the evidence brief](2026-11-05-redesign-evidence-brief.md). Task:
[2026-11-05-site-redesign-taste](../../tasks/2026-11-05-site-redesign-taste.md). Directions were dealt with
`draw.mjs` (seeds in `.taste-skill/*/direction.json`, which is not committed; this note keeps what matters).

## 1. Inventory (what only this site has)

- One hub per exam, built from the professor's own lectures, with the exam's announced format (`EXAM_INFO`,
  `EXAM_COUNTS`, `LIKELY_TOPICS`), a question bank with a why for every choice, notes at two levels with narration,
  drawn figures and Patient Box cases, a mock, a Daily Drill, an arcade with its own skin, Timmy Time.
- Timmy Tooth (a drawn character with lore), handpiece ranks and levels, study streaks, class pulse, hub recaps.
- The class: 59-126 people per hub, studying on phones the night before, 8-9 pm peak, a fifth of it after 10 pm.
- Numbers that are the site's own: days to the exam, questions per lecture, questions right on the latest try, the
  streak, people studying now.
- The constraint: single-file hubs, no framework, perf budgets, a public repo, no photographs of the course.

## 2. The argument of a hub page

A student opens the hub the night before. The page must answer, in order: which exam and when; what it covers and how
much of it I have; where to start right now (one tap); then, if there is time, everything else (notes, drill, mock,
hints, cram, Review, arcade, Timmy Time). Home is the door; the bank and the notes are the rooms; the footer is the
back of the sheet.

## 3. Directions dealt and chosen

**Hub (page workflow):** dealt `borrowed-category`, `one-motif`, `page-is-the-object`. Chosen: **The page is the
object.** Reason: a dental exam already has a printed artefact, the professor's exam sheet (which lectures, how many
questions each, when), and the hubs already keep those facts; building the page as that sheet makes Home the exam
itself rather than a dashboard about it. The other two would have borrowed another category's manners (an airline, a
record label) or leaned on one motif, which the arcade skins already do per hub.

- Sheet: type **Erode** (display 500, text 400/600, italic for titles), color **olive on bone**
  (`--bg:#ecebe7 --surface:#e1dfd9 --ink:#38450f`), hero **striped card beside the room**, sections stats (column
  aligned on the decimal) → list (filled bar rows) → how-it-works (drag row of moments) → footer (the back of the card),
  motion **slow crossfade**, photographs from the "City at night" set.

**Dashboard (app workflow, kind workspace):** dealt `achromatic-ledger`, `editorial-greeting`. Chosen:
**Editorial greeting.** Reason: the dashboard's one question is "what should I study right now, and how is the class
doing?", which a greeting that names today's one fact answers in its first line; the ledger style sets every number in
a mono column, which the house rules and the bank's reading comfort argue against. Face: the greeting names the next
exam from the data ("Evening, Ava. PCD Implants is tomorrow."); hub cards carry their class's hue as a pale tint;
the panel surface is the hubs' bone paper instead of the kit's #f9f9f9, with the page white kept.

**Admin page:** already an app screen on the Taste app run (approved 2026-11-05); only tokens and type align, no redeal.

**About page:** the dashboard's type system; treated as a guide, not a landing page (no imagery floor).

## 4. The idea sentence and the live thing

"On this page, **the professor's exam sheet** (which lectures, how many questions each, when) becomes **the frame**:
the hub's Home is that sheet filled in with what you've got right, and the next question is one tap from any row."

The nearest competitor (a commercial question bank) could not write this sentence: it has no professor's sheet and no
lecture-by-lecture blueprint of a specific exam.

**The live thing:** the blueprint strip. One bar per lecture, its width proportional to the lecture's share of the exam
(`EXAM_COUNTS` where announced, otherwise its share of the bank), filled to the questions you have right on your
latest try, hatched for tried-and-missed, empty for untried. It changes every visit and after every answer (it redraws
on `SH_SYNC`). Tapping a bar opens the bank on that lecture's unanswered questions (missed ones first when there are
any). It replaces the readiness ring.

## 5. Copy deck (hub Home)

- h1: the exam, as the sheet names it: "Occlusion final", "PCD Implants exam 1", "Special Patient Care exam".
- Under it, one line: the day and what's known of the format ("Thursday, November 19. Not comprehensive: the lectures
  from October 22 on.").
- The one action: "Practice questions" (with the count you haven't tried); second: "Daily drill".
- The blueprint's heading: "The exam, lecture by lecture" and a caption "Filled to what you have right on your latest try".
- Stats (the ledger): "Where you stand" over four figures: questions right / questions tried / days to go / your
  accuracy, units in the captions.
- List: "Lectures" as filled bars, each opening to its progress with Notes and Questions.
- Row of moments: "The course so far" (lectures, reviews, quizzes, the exam, only announced dates).
- Footer (the back of the sheet): "Also in this hub" with the links (Exam hints, Cram sheet, Review, Arcade, Timmy Time)
  and the sign-off "Built by Sam for the D2 class".
- No eyebrows, no "Welcome back", no "unlock", no "Read more".

## 6. Departures from the dealt sheets, and why

| Sheet says | Done instead | Why |
|---|---|---|
| Olive on bone for every page | Bone paper shared; each hub printed in its own single ink (Occlusion navy, Perio wine, Implants steel, Special Patient Care teal); dark mode is the inverse | Eight hubs in one site; students tell them apart by color (the dashboard rings); one ink per hub keeps the two-color print idea and the identity |
| Photographs: "City at night", at least four real pictures | None; the subject is drawn in code (the blueprint, the sheet's stripe, Timmy) | The brief asks for site-specific drawn ideas; perf budgets of 850-1050 KB per hub; night streets are not the subject |
| Hero: a photograph of "the room" as the right half | The blueprint strip is the right half, sticky on a laptop | The live thing is the picture; it is the subject |
| Slow crossfade of photographs | The blueprint fills on arrival (1.6 s), the countdown flap, entrances per section; still under reduced motion | No photographs to fade |
| Giant one-word heading at 46cqw | The head step (32-48 px) | The type system sets tight capitals at 32-40 px at most; a study tool, not a poster |
| Erode as the only face everywhere | Erode in the hubs; the arcade keeps its skin's face | Sam's rule: each hub's arcade keeps its own look ([arcade-skins](../../rules/arcade-skins.md)) |
| App body 14 px, small 12 px (dashboard) | Body 15 px, small 13 px | Accessibility and the evidence that explanations are read; the house floor of 13 px |
| 12 px imprint line in the footer | 13 px | House floor |
| One ink for every word | Right/wrong feedback keeps its green and red (with a mark, not color alone) | Functional, not decorative; the bank's feedback is the product |

## 7. Before critique (round 0, 2026-11-05, from the captured screenshots)

**Dashboard (app rules).** One second: a serif "1 day to go" in a white card; five seconds: the next exam and a button,
yes, but no h1 and the class panels below are a bento of outlined cards. Fails: emoji (preview badge), the dotted
gradient behind the progress column, shadows on buttons and 13 panels, a terracotta accent, 11 icon chips in four
colors, 8 px ladder text "III", no h1. Warns: "Archived" and "Quick survey · 3 questions" micro-labels, "Send luck" at
3.4:1, four panel radii, ragged rows (75 vs 376 px), 394 px of empty panel under "Correct in a row". Scores (juror):
design 5, usability 7, creativity 5, content 7 → 5.8 (capped 6.0 by the fails).
Top three: (1) no greeting and no h1: the first line is "Welcome back." in 15 px; (2) the hub cards are chip rows and
clamp text with a "Read more" and a shadow, so the hubs look like a store; (3) the class section's five panels are the
same outlined card five times.

**Hub Home, Occlusion (page rules).** One second: a cream card with a mono kicker "OCCLUSION · DR. GIVAN" and "The
final"; the countdown tiles read as the thing. Fails: eyebrow, mono labels (JetBrains), 9 micro-labels, emoji, the
radial-gradient card, 12 shadows at rest, 10 hairlines, 9 outlined boxes, an icon-card row, 14.7 px body, 0 pictures,
23 blocks under 13 px, no focal point (38 px max), 6 moving elements, gradient text at 390 px. Warns: cream palette,
three typefaces, ten sizes, 132-character measure, h1 "Occlusion Final" at 18 px, the exam card has no heading, two
glass panels at 390 px. Scores: design 5, usability 7, creativity 5, content 8 → 5.7 (capped). Top three: (1) nothing
leads: the kicker, the h2, the tiles and the ring are all medium; (2) the first screen on a phone is the header, the
podcast card and the subtab row before any question; (3) the readiness ring says "72 of 242" without saying which
lectures.

**Bank card (Occlusion, answered).** Works: the choices are full-width, the right one marked, "Why each choice" under
the explanation. Problems: four chip rows above the stem (lecture, source, last result, pin/report) in 11-12 px mono;
the choice bars are outlined with a percentage in mono; the reply pop-up covers the fourth choice on a laptop and the
whole explanation on a phone; the filter panel's labels ("LECTURES", "SHOW", "ORDER") are tracked capitals.

**Notes (Occlusion).** The podcast card sits above the subtabs on every visit to Compendium; "WHAT'S TESTED" is a mono
label; lecture rows in the sidebar are outlined cards with shadows; the prose is 15.5 px.

**About (page rules).** Fails: 9 "Part n" eyebrows, 150 micro-labels (tags), 69 hairlines, 10 outlined boxes, 14.5 px
body, 22 small texts, no focal point, still, a 696 px blank at the end on a phone. Scores: design 5, usability 6,
creativity 5, content 8 → 5.5. Top three: (1) the "Part n" eyebrows and the tag chips; (2) the links have no visible
focus and the seasons table can't be reached by keyboard (BUG-006, BUG-007); (3) the blank at the end on a phone.

**Admin (app rules).** Fails only the preview badge's emoji and shadow (fixture chrome). Scores: design 7, usability 8,
creativity 6, content 8 → 7.2. Kept; tokens align.

## 8. After critiques

Three rounds on the preview's screenshots (`.taste-skill/after/<page>/`, the inspector's sheets, and the scratch shots
listed in the [test report](2026-11-05-site-redesign.md)), each followed by the fixes it names. Scores follow
`references/critique.md`; the caps are applied as written, including the one that no page can beat while the
inspector still reports a FAIL.

```
ROUND 1  (the first after-inspection, before the fixes below)
Seen in one second: dashboard: "Afternoon, <name>." in serif over four bone tiles. Hub Home: a navy band of teeth over
  "The Occlusion final" and a 104 px "14". About: "Everything in the hubs" at 76 px. Perio Home: a hero card with a
  mono-looking kicker over "Periodontology D2" and three outlined stat boxes.
Idea (one sentence): a hub's Home is the exam sheet itself (the band, the countdown, the blueprint bars); the
  dashboard greets you with the one fact that matters today.
Live thing: the countdown (hours and minutes under a day) and the blueprint bars filled from your own answers.
Layout words by section: dashboard: greeting / rank / 4 tiles / 9-3 / class rows / hub cards. Hub Home: sheet 7 +
  blueprint 5 / ledger / moments. About: title / chips / cards in one column.
Scores: dashboard design 7 · usability 8 · creativity 6 · content 8 → 7.3. Hub Home 6.5 · 7 · 7 · 8 → 6.0 (capped).
  About 6.5 · 6 · 6 · 8.5 → 6.0 (capped). Perio Home 5.5 · 6.5 · 5 · 8 → 6.0 (capped). Admin 7.5 · 8 · 6 · 8 → 7.4.
Caps applied: the inspector still failed About (blank-gap: the scroll entrance left cards at opacity 0 in a full-page
  render; untitled-section), Perio (eyebrow ×4, hairline ×3, small-text ×15, focal-point, untitled-section, button-fx)
  and Occlusion (covered-text at 390, button-fx), so those three sit at 6.0; fewer than four pictures caps design at
  6.5 on every page.
Top three problems:
1. Perio's Home is the old hero: four labels above their numbers ("Final · Nov 19" over "14", "Your progress" over
   "239"), dashed rules between the grade rows, 15 blocks of 11-13 px text, and nothing leads (48 px is the largest).
   Fix: label under number (CSS order), rows separated by tone, 13-14 px floors, the "14" at 80 px, the card labels
   as real h3s (inspector sheet perio/desktop-fold).
2. On a phone, Compendium opens on the Timmy Time card: art, title, blurb, five controls, seek bar, likes and two
   comments fill the first screen before any subtab (scratch shot occl-notes-390). Fix: the subtabs first, the card
   folded (art, title, Play, More) until tapped or played.
3. Review's lecture chips wrap now but each chip keeps `white-space:nowrap`, so at 390 px the row is 560 px wide and
   the page scrolls sideways (scratch shot occl-review-390 is shifted 100 px). Fix: chips wrap their text.
Also fixed from this round: About's entrance removed (a reference must be all there at once: scrolled fast, printed,
  searched); the stats sheet's Hub/Class toggle ring replaced by a filled pressed state; the About headings never
  animate; Occlusion's "Where you stand" under the sticky top bar at 390 (only the mode row stays stuck on phones).

ROUND 2  (after the round-1 fixes; inspector: dashboard 0 FAIL, admin 0 FAIL, Perio 1 FAIL, Occlusion 2, About 2)
Seen in one second: Perio: "Periodontology D2" over its facts, the "14" at 80 px now leads the right column.
  Compendium on a phone: six subtab chips, then Timmy's folded card, then the lecture cards.
Idea: unchanged. Live thing: unchanged.
Layout words: Perio Home: quick-start 3 / hero 7-5 / next + two weeks / course map. Compendium: subtabs / folded card /
  lectures 3 + notes 9.
Scores: dashboard 7.5 · 8 · 6.5 · 8 → 7.5. Hub Home 6.5 · 7.5 · 7 · 8 → 6.0 (capped; 7.3 uncapped). About 6.5 · 7.5 ·
  6 · 8.5 → 6.0 (capped; 7.1 uncapped). Perio Home 6.5 · 7 · 6 · 8 → 6.0 (capped; 6.9 uncapped). Admin 7.4.
Caps applied: `few-pictures` on every page (decision 3 in the task note: no photographs; the subject is drawn), and
  `covered-text` at 390 on About ("The dashboard") and Occlusion ("Where you stand"): both are under the preview's
  own badge (`#shpv-pill`, bottom left, preview runtime only), not under anything students see. So the hub pages and
  About stay at 6.0 by the letter of the cap; their uncapped scores are given beside.
Top three problems:
1. Dashboard, 1440: the 3-column panel's title "Your last two weeks, every hub" breaks to three lines and the
   reply pop-up covers it (inspector sheet dashboard/desktop-fold). Fix: "Your last two weeks" (the panel's note
   already says it counts every hub).
2. The hub header's h1 is the hub's name at 26 px ("Occlusion Final") and the inspector reads it as a bare name; the
   sheet's title ("The Occlusion final", 42-56 px) is the page's real title 160 px lower. Defended: the top bar is
   app chrome (back, name, countdown, menu), the page rule's h1 is the sheet title; left as it is.
3. The rank bar (Bronze I, the medallion, the XP bar) is the third thing on the dashboard, above the four counts, on
   a phone too (inspector sheet dashboard/mobile-fold). It is the progression feature Sam asked for (the handpiece
   ranks) and students look at it (evidence brief, section 5); left where it is, noted for the next pass.
Fixed from this round: problem 1.

ROUND 3  (final)
Seen in one second: as round 2. Idea and live thing: as round 1.
Scores: dashboard design 7.5 · usability 8 · creativity 6.5 · content 8 → 7.5 (no caps). Hub Home (Occlusion) 6.5 · 7.5
  · 7 · 8 → 6.0 by the cap, 7.3 without it. About 6.5 · 7.5 · 6 · 8.5 → 6.0 by the cap, 7.1 without. Perio Home 6.5 ·
  7 · 6 · 8 → 6.0 by the cap, 6.9 without. Admin 7.5 · 8 · 6 · 8 → 7.4.
Caps applied: `few-pictures` (decision 3, Sam's call) and the preview badge's `covered-text` (preview chrome). Nothing
  else: no eyebrow, mono label, shadow at rest, decorative hairline, three-line headline or blank band remains on the
  inspected pages.
Top three problems left (for phase 2 and Sam):
1. No pictures on any page: if Sam picks option (b) of decision 3, Home gets one public-domain plate per hub and the
   design cap lifts; the perf budgets need raising for it.
2. Perio's Home is still its own engine (hero card and stat boxes, not the shared sheet, band and blueprint);
   phase 2 moves it onto `widget/blueprint.js` like the other three hubs.
3. The archived hubs and the arcade lobby chrome keep their old type and shadows (phase 2, token pass only); the
   static lint still sees the hubs' original CSS under the house block (listed in the test report as residue).
```

Where the scores come from: the dashboard clears every app-screen check and reads as one page; the hubs' type,
spacing and contrast are now the house's, but a page with no photograph cannot score above 6.5 on design under the
skill's rule, and the preview badge keeps one FAIL on the sheet that production never has.
