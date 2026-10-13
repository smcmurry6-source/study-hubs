# Boards Hub (INBDE + ADEX): plan and situation, for independent review

Written 2026-10-06 by the Claude Code session that planned this hub, so another AI (or person) can review the plan.
Please be critical: what is wrong, risky, missing, or could be done better or cheaper without losing quality.

## 1. Context

- **Who:** Sam, a D2 dental student at UAB, runs **study-hubs**, a free, public GitHub Pages site of study hubs used by
  roughly 120 classmates: https://smcmurry6-source.github.io/study-hubs/ (repo: github.com/smcmurry6-source/study-hubs).
- **How it's built:** static HTML/vanilla JS, one hub per exam (lecture notes + question bank + extras), plus a shared
  widget (class-wide accuracy per question, spaced review, a Daily Drill, XP/ranks/trophies, leaderboards) backed by
  Supabase. Hubs are built by Claude sessions; Sam merges pull requests to publish. CI checks every PR (syntax, a
  headless click-through of every hub, and a question-bank lint).
- **What the usage data says** (from Supabase, all past hubs): notes + question bank are 70-80% of study time; the
  separate arcade games got only 1.4-1.7% of time, and only 3 people ever came back to the same game on a second day;
  students cram (44% of all time in one hub was the night before its exam) and stop using a hub the day after the exam.

## 2. Goal

A long-lived hub for the **INBDE** and **ADEX** licensure exams (roughly August 2028; dates not confirmed), used for
about 22 months and grown in stages: study notes, about **1,200 original board-style questions**, and one deep game
built around the questions. Constraints:

- **Public repo:** nothing copyrighted (no prep-company questions, released exam items, textbook text). Questions are
  original, written to the official outlines, and fact-checked against public sources (CDC, FDA labels, ADA, AHA,
  AAP/EFP, AAE, AAOMS, AAPD...).
- No AI-generated art or audio (no budget for it): art drawn in code, sound synthesized in the browser.
- Runs entirely in the browser inside the hub, phone-first, no install, no build step on the server.

## 3. What is done (planning only; nothing on the live site has changed)

All of this is on branch `claude/boards-hub`, draft PR https://github.com/smcmurry6-source/study-hubs/pull/70, under
`docs/boards/`:

- `research/inbde.md`: INBDE format and the full official outline (10 foundation knowledge areas, 56 clinical content
  areas, component weights 36.2/42.0/21.8%), how patient boxes and case sets work, and 19 proposed study units.
- `research/adex.md`: the 2026-27 ADEX exam series and self-check criteria for each clinical section.
- `research/facts-medical.md` (complete) and `research/facts-dental.md` (2 of 10 sections): "facts of record" with
  sources that every question must match (prophylaxis, anesthetic doses, emergencies, perio staging, endo diagnosis...).
- `research/architecture.md`: exactly how a new hub plugs into this repo; `research/lessons-for-new-hub.md`: usage data.
- `design/GAME.md` + `design/GAME-critique.md`: the game design and an independent critique (8 must-fixes, all applied).
- `BUILD_SPEC.md`: the build plan (curriculum, question schema and style rules, notes format, game, per-unit quality
  pipeline, release plan, work breakdown).
- **Caveat:** the research files cite primary sources page by page, but the planned independent re-check of each file
  never ran (usage limits); the plan is to verify facts when each unit's questions are written.

## 4. Key findings that shaped the plan

- **INBDE format:** 500 single-best-answer questions over 2 days, usually 4 options; no select-all, matching or
  ordering; never "all/none of the above"; EXCEPT/NOT in capitals; about 40% of questions are in case sets that share
  one patient box (Patient; Chief Complaint; Background/History; Current Findings) with 2-6 questions each. Pass/fail on
  a 49-99 scale (75 passes). A stricter standard started June 2024; first-time failure for accredited-school students
  went 0.4% (2023) to 4.8% (2024) to 7.2% (2025) per JCNDE reports (as summarized in our research notes).
- **ADEX:** its computer-based exam (DSE OSCE) is being replaced by the JCNDE's DLOSCE for anyone registering after
  6/1/2026; the clinical exams (restorative, endo, fixed pros, perio) remain.

## 5. The game: "Chairside"

Short clinic shifts (4-15 minutes, phone-first) where every patient is a question from the hub's own bank:

- Booked patients = INBDE-style case sets (patient box + linked questions in visit order: medical clearance,
  diagnosis, plan, complication); walk-ins = single questions; recall patients = spaced-review items that are due;
  callbacks = recent misses; the attending's case = the hardest case at the end.
- Answers are locked in as **Sure / Unsure / Guess** (Sure +3/-3, Unsure +1/-0.5, Guess 0), so blind guessing never
  pays and confidence calibration is trained; speed never scores. In a case, feedback comes after the last question so
  earlier answers don't give away later ones; options are shuffled when an item returns.
- **Today's shift is the Daily Drill**, so playing is the spaced review. Every answer is recorded exactly like a bank
  answer (class stats, XP, ranks). Spaced review uses long gaps (1/3/7/14/30/60/120 days) stored server-side so a new
  phone can't wipe two years of scheduling.
- Two-year frame: a clinic whose wings light up with readiness per unit; a habit goal of 4 of 7 days a week with rest
  weeks; no notifications or guilt mechanics. Later: a weekly shared class run, boss cases, and an ADEX "Lab Bench"
  (spot the critical error on drawn preparations).
- Release-1 slice: about 5,500 lines of JS; full version about 12,700. Release gates: at least 25% of hub visitors start
  a shift, 30% return on a second day within 14 days, 85% of game time on questions.

## 6. The problem: usage limits and cost

Sam uses a Claude subscription with 5-hour and weekly usage limits. Phase 1 (research + design, done with multi-agent
Claude Code workflows) hit the 5-hour limit twice and the weekly limit once, after roughly 4 million agent tokens.
Agent sessions re-read their whole growing context on every step, which is efficient for coding but very wasteful
for bulk writing. The original plan for release 1 (hub + 3 units + game slice) needed about 6.6M agent tokens
(about 1.5 weeks of allowance); the whole hub would take many weeks of allowance.

## 7. Proposed new approach (not yet approved by Sam)

**a. Content via a script that calls the Claude API directly** (pay-as-you-go API key, separate from the subscription,
with a monthly spend cap; stored as `BOARDS_API_KEY`, deliberately not `ANTHROPIC_API_KEY` so Claude Code itself keeps
using the subscription):

1. Facts sheet per unit, from primary sources, with exact quotes and URLs (existing research covers most of release 1).
2. Drafting with Claude Opus 5.5 against that facts sheet, via the Batch API (50% off), prompt caching (shared rules +
   facts billed at about a tenth), and structured outputs (every item in the exact schema).
3. Independent verification of every item by Claude Fable 5.1 (the most capable model): key correct, every distractor
   definitely wrong, current guideline, no giveaway or ambiguity, citation supports the key, no copied text.
4. Fixes and re-verification of changed items.

Published API prices used (per million tokens, input/output): Opus 5.5 $4/$20, Fable 5.1 $10/$50, Sonnet 5.5 $2/$10;
Batch API 50% off; cache reads about $0.20-0.25. Estimate: about **$100-200 for the entire bank and all notes**, about
$15-30 for release 1's content.

**b. Free deterministic checks:** the repo's question lint, answer-position balance, duplicate detection, a script that
confirms each cited quote really appears on its source page, and calculation questions (anesthetic doses, eruption
ages, biostatistics) generated by code from verified tables.

**c. Post-launch quality control from real use:** the existing Report button, plus an automatic "suspicious question"
list from class data (questions that strong students miss more often than weak students usually have a wrong key or an
ambiguous stem), added to the existing lessons audit.

**d. Code:** Claude Code (the architect) writes the architecture, tests and risky parts (scoring, review scheduling, the
database migration, shared widget changes) and reviews everything. Optional: Qwen3-Coder (via opencode + OpenRouter,
about $0.22/$0.95 per million tokens) writes boilerplate modules. Game screens mocked up in Figma (already connected)
for Sam's approval before code; proven free libraries for animation and sound instead of hand-written ones.

**e. Overhead:** trim `DEPLOY_NOTES.md` (about 17k tokens, loaded into every Claude session and agent in the repo) by
archiving old entries; run each release in a fresh, short session with state kept in the repo.

**Estimated effect:** release 1 uses about 1-1.5M subscription tokens (pipeline, hub, game, integration) instead of
6.6M, plus about $15-30 of API charges; a 20-question trial runs first to measure draft quality before any big run.

## 8. Release plan (proposed)

- **Release 1:** the hub itself + three units chosen for INBDE weight and overlap with ADEX: medically complex patients
  and emergencies, pharmacology, periodontics (60 questions each, about 24 case sets), then Chairside's first slice.
- **Later:** 3-4 units every 6-10 weeks through spring 2028 (19 units, about 1,200 questions), ordered to match the
  class's course calendar, with a yearly re-check of the official outlines.

## 9. Open decisions for Sam

Release-1 units and drops; server-side storage of review schedules and game saves (a new Supabase migration, keyed to
the site's anonymous visitor id); code-drawn figures only vs. also openly licensed real radiographs and photos; names
("Chairside", "Boards Hub: INBDE + ADEX"); his review role (approve game screens; spot-check 10 random questions per
unit); the course calendar; whether to set up the API key (and optionally the OpenRouter key).

## 10. Known risks and uncertainties

- **Accuracy of ~1,200 medical questions** is the central risk. Mitigations: grounding in a cited facts sheet,
  independent verification by a stronger model, deterministic quote checks, a trial batch first, Sam's spot checks,
  and post-launch reports and item statistics. Not yet tested in practice.
- **Estimates are rough:** token and dollar figures are ±30-40%; the usage meter's exact accounting is not visible.
- **Engagement:** past data says games get little use and students cram; the design bets that making the game *be*
  the daily review fixes this. Release gates decide whether to invest further.
- **Outlines can change before 2028:** every item records the outline version it was written against.
- **Shared infrastructure:** widget and database changes affect the other live hubs and must stay opt-in.

## 11. Questions for the reviewer

1. Is the API-pipeline approach to content sound, and is anything cheaper or more reliable for verifying medical
   questions at this scale?
2. Is Fable-verifies-Opus enough independence, or should a model from another company check too?
3. Will the game design actually produce steady daily use over two years? What would you cut or add?
4. Is release 1 scoped right (three units + game slice), and are those the right three units?
5. What is missing: copyright, privacy of visitor data, accessibility, maintenance after Sam graduates, anything else?
