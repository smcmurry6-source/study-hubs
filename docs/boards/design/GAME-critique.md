# Chairside: critique of GAME.md

Status: review, 2026-10-06. Reviews `docs/boards/design/GAME.md` (the 2026-10-06 complete design) from three lenses:
the player, engineering, and learning science. Claims about the repo were checked against `widget/v3.js`,
`widget/drill.js`, `widget/ranks.js`, `tools/ci/smoke.js` and `docs/boards/research/architecture.md`; usage claims
against `lessons-for-new-hub.md`; exam facts against `inbde.md` and `adex.md`.

Contents

1. Steelman
2. Lens 1: the player
3. Lens 2: engineering
4. Lens 3: learning science
5. Must-fix (with a concrete fix each)
6. Should-fix
7. Cut or defer (scope)
8. The 5 biggest risks and mitigations
9. Recommended release 1 slice (about 5,600 lines)

---

## 1. Steelman

The design gets the hard part right: it starts from the data instead of from a game genre.

- **The core verb is answering bank items.** Past side games got 1.4-1.7% of study time; what was replayed was fast
  and bank-built. Making "the game" the Daily Drill dressed as a clinic means time in the game is study time, and a
  student who ignores the world still gets a good drill.
- **One choke point for answers.** Every recorded answer goes through the hub card and `recordAnswer`, with the
  authored choice index, once per encounter. Class stats, `question_choices`, SRS, XP, ranks and Weak Spots all stay
  honest, and the existing bank lint covers every item the game shows.
- **Speed never scores.** No clock, no time tie-breaks, raids pace only the reveal. That is right for an exam with
  about 63-105 s per item where rushing is the classic failure.
- **Confidence lock-in is a real learning tool.** Asking "how sure are you?" before feedback builds metacognition,
  and high-confidence errors followed by feedback are the errors most likely to be corrected (hypercorrection). The
  calibration line at the end of a shift is exam self-knowledge students rarely get.
- **The patient visit mirrors the INBDE case set.** The four-part box, 2-6 linked items, realistic irrelevant data and
  no highlighting of "relevant" lines train exactly the skill that ~40% of the exam tests.
- **Kind by design.** Weekly practice days with automatic rest weeks, no loss-framed countdowns, no notifications,
  no named comparisons without opt-in, "Welcome back" without guilt, and "Keep it" after course exams aimed squarely
  at the day-after drop seen in perio and MSK.
- **Engineering hygiene.** Lazy-loaded classic-script bundles (architecture option 2), a pure-function state machine,
  a seeded selector testable in plain Node, DOM-rendered items for accessibility with a decorative canvas, budgets
  for bundle size and CPU, and release gates that stop work the data doesn't support.
- **Lab Bench is a clever, honest use of ADEX.** The game cannot train hand skill, so it trains the examiner's eye on
  to-scale parametric drawings with cited thresholds (`adex.md` has numeric criteria, e.g. isthmus over half the
  intercuspal width is critical, taper over 16 degrees is critical), frozen at build time into reviewable items.

The critique below is about where the design undercuts these strengths, and about how much of it to build first.

## 2. Lens 1: the player

Persona: a D2 at UAB, about 1 hour of study a day, mostly on a phone between classes, two years before boards,
with course exams every few weeks that feel far more urgent than the INBDE.

**Would they open it daily for months?** Possibly, but only because Today's shift *is* their drill, and only if the
drill is the thing they already want. The data says the drill was asked for in writing but used mostly in exam week
(MSK: 231 of 356 drill minutes were on the eve; 8 people on 2+ days per hub). A clinic around it won't change that
on its own. What will is (a) the hub's main button and the dashboard card leading straight into Today's shift,
(b) items that line up with the course they are taking this month, and (c) a short session that clearly ends.

**Is it fun on its own?** Honestly: it is a well-dressed question drill, not a game you'd play for fun. The fun that
exists is the case stories, the attending's case, the "bet" of Sure vs Unsure, and seeing wings light up. That is
fine (the data says action games don't get played), but the design should stop promising roguelite depth. With 3-5
patients per shift, a protocol draft after every patient is a decision every 3-4 minutes that isn't about dentistry;
roguelite perks pay off over long runs, not 10-minute ones.

**Does it obviously help their score?** Not yet. "Readiness" is a composite of coverage, recency and weights that a
student can't interpret, and it falls whenever new items are added to a unit (unattempted items count as 0). A
D2 wants two answers: "am I ready for Tuesday's pharm exam?" and "how likely am I to get a random board question
in this area right?" The design should show those, in those words (see M7).

**Confusing.** The phone HUD carries Care, Flow, Composure ("Calm"), shift position and the chart toggle, on top of
the site's own XP, handpiece rank, mastery, drill streak, Timmy's HP and now weeks-kept and rest weeks. That is about
ten progress systems. A student should need to learn two new words, not five. The career chapters, wings, mentors,
seasons and Gauntlet are explained nowhere in play (no tutorial by design), so most of it will be invisible.

**Grindy or slow.** Per-item overhead is capped at ~1.5 s of animation, but decision screens are not capped: patient
intro, day-sheet choice, protocol draft, outcome card, boss intro, summary. In a 10-minute Half shift with ~10 items,
that can be 1.5-2 minutes of non-study. Each item also costs two taps (pick, then lock-in), which is fine only if the
lock-in buttons *are* the submit button.

**Embarrassing in class.** Sound on by default (`settings.sfx: true` in the save sketch), a heartbeat bass in Code
Blue, and WebAudio on iPhones that may ignore the ringer switch. Generated patient names and faces tied to diseases
can read as stereotypes (a named Black patient who always has sickle cell, for example). A leaderboard of Care, which
grows with volume, quietly ranks people by hours played.

**Would they tell classmates?** Release 1 has nothing to share: Board Day, ghosts and the census are all R2+. The
one cheap social proof (a dashboard line such as "31 classmates did today's shift") would help the north-star metric
more than anything in the map or audio.

## 3. Lens 2: engineering

Claims checked against the repo:

| GAME.md claim | What the repo actually does | Consequence |
|---|---|---|
| "One opt-in addition to `widget/drill.js`: `window.shDrill = { today(hub), done(hub, qid) }`" (Section 15) | `window.shDrill` already exists (`drill.js:322`, guarded at `:30`) with `mount/open/close/isOpen/status`. | Must extend the existing object, never reassign it, or every hub's drill breaks. |
| "Finishing it completes the drill ... no double work" (8.1) | `onAnswered` returns early unless the drill dialog is open (`drill.js:288-290`); the set is built only when the dialog opens (`loadSet` returns null before). | Game answers would not mark the drill. drill.js needs an `ensureSet()` and must mark any answer to a drill item today, open or not. |
| Today's shift serves the drill set, and "a case is the unit of practice: all its items come with it" (4.6) | The drill picks single items (`pick()`, max 3 per lecture, shuffled). | One due item from a 6-item case drags in the whole case: a 12-item drill can become 30+ items. Recall of a case item must be servable alone with its box. |
| `window.SH_SRS` long steps (Section 15) | Not built: `SRS_STEPS = [1, 2, 4, 7]` is hard-coded (`v3.js:553`); the exam-eve cap and a one-time `_v` migration pass (`:584-596`) would both need guarding. | The ~10-line opt-in from `architecture.md` 8 is a prerequisite for R1, with perio/MSK smoke runs as regression. |
| Spaced review and history drive the selector and readiness | SRS is `localStorage` only (`sh_srs_<hub>`), as is the hub's `STATE.answered`; "Link my devices" moves server rows only. | Over 22 months on phones (Safari deletes script-written storage for sites not visited in 7 days of browser use, unless installed to the home screen; phones get replaced), the core inputs vanish. `game_saves` saves the game but not SRS. |
| "`smoke.js` enters the arcade, clicks Start, waits for `data-ready`, answers one item by keyboard, opens the chart" (16.6) | `smoke.js:95-99` clicks each tile, `[data-start]`, waits 400 ms, clicks `[data-back]`. Nothing waits for `data-ready` or answers. | A boards-specific Playwright step must be written; budget it. |
| "The game owns the readiness formula in a small shared function the hub also calls" (7.2) | The game bundle is lazy-loaded on Start, so the hub home cannot call into it. | The readiness function must live inline in the hub (or a tiny always-loaded file), with the game reading it from the adapter. |
| Refer records `api.answer(qid, false, null)` | `record_choice` fires only when `choice` is a number (`v3.js:1165`). | Consistent, but every Refer is a wrong answer with no pick: `question_choices` loses exactly the data that drives "name the favorite wrong answer". |
| Three new site trophies | `TROPHIES` in `ranks.js:297`; About page counts ("All 24 trophies") must change in the same PR. | Fine; note it in the PR checklist. |

**Buildability by parallel agents.** The module split is good for the logic layers (selector, scoring, readiness,
FSM, store), each testable in Node with fixtures. It is poor for the presentation layers: the 2.5D isometric
three-floor map, generated portraits, lighting, motion and adaptive music are where "premium" lives, and they need a
human looking at screenshots; agents working in parallel will produce visually inconsistent pieces. The cross-cutting
widget edits (`v3.js`, `drill.js`, `pet.js`, `ranks.js`) touch live hubs and should be one small PR by one agent,
before the game agents start.

**Risk concentration.** R1 is said to be ~6,000 of 12,700 lines, but its "In" list includes the map, portraits,
particles, synth audio, 12 protocols, 3 bosses, readiness, habit tracking, Welcome back, Keep it, Cram Clinic, server
saves with a Care event-log merge (for a shop that isn't in R1), full accessibility and instrumentation. That is
closer to 8,000-9,000 lines. Section 9 below trims it.

**Phone performance.** The budgets are right. The risk is the canvas map: offscreen caches per floor, bloom, pan and
lighting changes on a 2019-era Android is where frames and battery go. A static SVG facade with lit windows gives
the same feedback at near-zero cost.

**Playwright testability.** Good bones (seeded RNG, `data-ready`, stable `data-cs` ids). Missing: a test seam to set
the seed and the date (`?cs-seed=`, Playwright's `page.clock`), a way to answer deterministically (read the key from
`SH_EXPORT` in the test, not from the game), and a canvas-free path so assertions are on DOM only. The scoring "proof
as a test" (EV of a blind guess per item at each Flow tier) is not enough: Flow and Composure make the game a Markov
decision process, so the test must simulate whole shifts under a policy (see M1).

**Maintainability over 22 months.** Content grows from ~0 to 1,000-1,500 items and an unknown number of cases. The
design's boss table hard-codes case constraints (">= 8 history lines", "case spanning ages", ">= 2 images") that the
bank may never satisfy for some wings; each needs a fallback to a generic attending's case. Twelve bespoke boss
gimmicks plus 40 protocols plus seasons is a large surface to keep correct as the item schema evolves. Inline bank
size (items + cases + boxes) also grows the hub page; `architecture.md` 13 already flags it.

## 4. Lens 3: learning science

**Retrieval practice.** Strong: every action is a retrieval attempt with feedback. Two weaknesses. (1) Refer lets the
student skip the attempt entirely, and Flow makes skipping the rational play (M1); a wrong guess followed by feedback
teaches more than no attempt. (2) Multiple choice leans on recognition; an optional "cover the options" setting
(stem first, options on tap) adds generation at no data cost.

**Spacing.** The right intervals for 22 months (1/3/7/14/30/60/120), but no load model. At 10 minutes on 4 days a week
(~25-35 items a week) a student can't keep 7 reviews per item going across a 1,000-1,500 item bank: introducing even
2 new items a day yields ~15-20 reviews a day at steady state, plus misses that reset to day 1. The promised "4-12
due a day" only holds with a governor on new items and a daily cap with priority (M5). After a three-week break the
backlog can be in the hundreds; Welcome back hides the count but not the problem.

**Interleaving.** Good: mixed wings by default, max 3 consecutive patients per wing, case sets that cross units.
The Cram Clinic single-wing shift is blocked practice, which is fine on an exam eve.

**Feedback quality.** Excellent content (explanation, the favorite wrong answer, the mentor cue on a miss). Three
problems: (1) inside a case, the explanation and verdict for item 1 can give away item 2, which both teaches
answer-chaining and inflates `question_stats` for later items (M3); (2) the class split is noise with few attempts
and should appear only from ~8 attempts; (3) high-confidence errors deserve more, not the same, feedback.

**Case integration like the INBDE.** Yes in structure. But recall patients return with the same face, name and box
(8.4, "memory palace"), and SRS repeats the identical item up to 7 times. That trains item recognition ("the
bleeding-gums lady, answer C") rather than transfer, and inflates readiness. Encoding with a vivid cue helps only if
the cue is present at test; on the INBDE it won't be (M8).

**Guessing and speed.** Speed: clean. Guessing: the per-item EV proof is correct but incomplete. The real INBDE has
**no penalty for guessing** (`inbde.md`, CG p. 18), so the right exam habit is "always answer". A game that rewards
opting out (Refer keeps Flow; Unsure-wrong resets it) trains the opposite habit and teaches calibration at the cost
of exam strategy (M1).

**Does time convert into learning?** Mostly, if the non-item screens stay small. Make it measurable: the share of
game time spent on item and feedback screens (from `arcade/chairside/<area>` sections) should be at least 85%, and it
belongs in the release gate next to second-day return.

## 5. Must-fix (with a concrete fix each)

**M1. Refer and Flow reward skipping the retrieval attempt, against the INBDE's no-guessing-penalty rule.**
Refer scores 0 and keeps Flow; Unsure-wrong resets Flow to 0. At Flow tier 4 (x3), with a plausible value of 10-15
Care for staying at tier 4, Unsure beats Refer only when the student is more than about 80% sure
(`3(1.5p - 0.5) > (1 - p) * V`). The rational player Refers anything uncertain: no attempt, no pick in
`question_choices`, and a habit that costs points on an exam where a blank is always wrong.
*Fix:* every item requires a pick. The lock-in buttons are the submit: **Sure / Unsure / Guess**. Sure +3 / -3,
Unsure +1 / -0.5, Guess 0 / 0, and the pick is always recorded. Flow rises on Sure-correct, resets only on
Sure-wrong, and multiplies only Sure outcomes; Unsure and Guess hold it. Teach once: "On the real exam, always answer.
Guess when you'd guess." Replace the CI "EV per item" test with a policy simulation: for simulated students with true
accuracy p in 0.25-0.95 and k = 3-5, play 10,000 seeded shifts through the real scoring and FSM code and assert that
no policy beats the honest one (Sure when p is above the shown threshold, Unsure in the middle, Guess below) and that
always-Sure or always-Guess never tops a leaderboard.

**M2. Composure at 0 turns the rest of the shift into a dead run.** Care stops accruing but the shift goes on, so
the student quits mid-shift and Today's shift (the drill) goes unfinished.
*Fix:* cut Composure from R1. Sure-wrong already costs Care and Flow, which is enough calibration pressure. If it
returns later, make 0 Composure end the bonus round (e.g. no boss bonus), never the Care for remaining items.

**M3. Feedback inside a case set leaks into later items.** The explanation (and even the verdict) of the `clear` item
can key the `fu` item; `ifMissed` beats announce a miss. Later items then score higher in the game than on the exam,
and `question_stats` for them are inflated for everyone.
*Fix:* within a visit, lock-in shows only "Recorded" (no verdict, no explanation); the visit ends with a **Rounds**
review of all its items, verdicts, explanations and cues together, with the box beside them. This matches the exam
(no feedback within a case), keeps stats honest, and a short delay before feedback does not hurt learning. Walk-ins
keep immediate feedback. Add a bank lint that warns when an earlier item's explanation contains a later item's key
text.

**M4. The drill integration is specified against an API that doesn't exist.** `window.shDrill` already exists
(`drill.js:322`); drill answers are counted only while the drill dialog is open (`:288-290`); the set is built only on
open; drill items are single items, not cases.
*Fix:* one widget PR before game work: extend `shDrill` with `ensureSet()` (build and freeze today's set without
opening the dialog), `set()` (read it) and count any `boards:answered` for a drill item today whether or not the
dialog is open; `SH_DRILL.size` opt-in (`hook().size || 10`). In the game, a due item that belongs to a case is served
**alone with its patient box** as a "follow-up visit" (each INBDE case item is answerable from the box); whole cases
are served only as Booked patients with new items. Regression: perio and MSK smoke plus a manual drill run.

**M5. No spaced-review load model.** The bank (1,000-1,500 items) and 7 review steps don't fit 10 minutes on 4 days a
week, and breaks create backlogs of hundreds.
*Fix:* (a) a daily review budget (default 12 items in Today's shift) filled by priority: overdue items weighted by
how overdue, the unit's exam proximity and class difficulty; the rest roll over with small random fuzz so they don't
return as a wall; (b) a governor that offers new items only when the projected due load for the next 7 days is under
budget; (c) items at the last step (120 days) whose last 3 answers were Sure-correct retire to a monthly sample;
(d) put the arithmetic in the About entry ("10 minutes a day keeps about N items alive").

**M6. Every long-term input lives in one browser's storage.** SRS (`sh_srs_boards`), the hub's `STATE.answered`, and
the drill set are per device, and Safari deletes script-written storage after 7 days of browser use without a visit
(unless the site is on the home screen). A two-week break or a new phone resets two years of spacing.
*Fix:* in migration v33, not "later": `srs_state(visitor_id, hub, qid, b, due, t)` with `get_my_srs(p_hub)` and a
batched `upsert_srs`, merged into `localStorage` at boot (latest `t` wins), and included in `redeem_link_code`; build
latest-result-per-item for the selector from `personal_answers` (one RPC, `get_my_latest(p_hub)`). Keep v3.js as the
writer behind the `SH_SRS` opt-in so other hubs are untouched.

**M7. Readiness is opaque, drops when content is added, and lives in a lazy bundle the hub can't call.**
*Fix:* define readiness per unit in two plain numbers: **"Likely right: 64%"** (the probability of answering an
average released item in the unit right, from the unit's Elo ability against item difficulties, decayed by time since
last practice) and **"Seen: 120 of 180"** (coverage). New items raise the "of 180" without lowering "likely right".
Bands key off "likely right" with a minimum coverage per band. Put the function inline in the hub (about 120 lines,
shared by the home view, the drill and the game through the adapter). Never call it a predicted score.

**M8. Identical repeats train recognition of the item, not the concept.** Recall patients keep the same face, name
and box, and SRS re-asks the same stem with the same option order up to 7 times; readiness then measures memory of
items.
*Fix:* (a) shuffle option order on every re-ask (the card maps back to the authored index for `record_choice`; a
`pin` flag keeps options like "All criteria acceptable" last); (b) each item carries a `concept` tag and the bank
plans **sibling items** (same concept, different stem or box) for high-yield concepts, with SRS scheduling the concept
and rotating siblings; (c) recall patients get a fresh wrapper, the continuity line ("back for recall") is enough
narrative; (d) readiness weights first attempts and sibling answers above repeats of the same item.

## 6. Should-fix

1. **Cap non-item time.** Today's shift auto-routes (one "Continue" tap per patient; the day sheet is shown, not
   chosen). Protocol drafts only in Full shifts and at most twice. Gate R2 on item+feedback screens being at least 85%
   of game time.
2. **Fewer words to learn.** R1 introduces two terms (Care and Readiness) and shows Flow as music and light, not a
   HUD meter. Use the site's XP and handpiece ranks rather than parallel progressions.
3. **Make high-confidence errors stand out.** Sure-wrong expands the explanation by default, shows the mentor cue,
   and brings the item back as a callback next day regardless of the 20 h block (hypercorrection).
4. **"Cover the options" setting.** Stem and box first; options on tap. Off by default, praised in the summary.
5. **Class split only from 8 attempts**, and the "Referral: class finds this hard" tag only with real data; for
   months most items will have under 8 attempts, so the referral pool and Elo difficulties will rest on the
   cognitive-level prior. Say so in the design and test the empty-pool path.
6. **Leaderboards that don't rank volume.** The `chairside` best-shift board rewards Full shifts. Post Care per item
   (x100) or keep boards only for fixed-length runs (Board Day).
7. **Loupes leaks.** Showing "your last result on this item" before answering lets a student who remembers their old
   pick eliminate it. Show only "last seen 12 days ago" before lock-in; the result after.
8. **Quiet by default.** Sound off until turned on; set `navigator.audioSession.type = 'ambient'` where supported
   so iPhones respect the ringer switch; no heartbeat or alarms without sound on.
9. **Portrait and name generator rules.** Names and faces are generated independently of conditions; a case author
   writes demographics only when clinically relevant; review the name list once.
10. **Test seams.** `?cs-seed=`, a date override honored only on `file://` or with a test flag, `window.__cs.state()`
    for assertions, and a separate `tools/ci/game-smoke.js` that plays one Today's shift on desktop and phone sizes,
    answering from `SH_EXPORT`, resuming after a reload, and checking that each answer fired exactly one
    `boards:answered`.
11. **Widget changes first, in one PR.** `SH_SRS` opt-in, `shDrill` extensions, `data-sh-fullscreen` in `pet.js`,
    each a no-op for perio and MSK, merged and smoke-tested before any game module depends on them.
12. **Boss fallbacks.** Every wing's boss falls back to "the attending's case" (the hardest eligible case in the wing)
    when the bank can't meet the gimmick's constraints; the gimmick is a skin on top, never a requirement.
13. **Device class in pings.** "Mostly on a phone" is an assumption: the only data point is the drill chip (18
    desktop tappers vs 7 phone). Add a coarse phone/tablet/desktop field to activity pings in R1.
14. **One-line social proof in R1.** A dashboard and home line, "N classmates did today's shift", from existing pings.
15. **Server saves without a shop.** Drop the Care spend event log and its merge rule until decor exists; R1 saves
    habit, stats, unlocked protocols and the run in progress with "newest wins, counters take the max".

## 7. Cut or defer (scope)

| Item | Recommendation | Why |
|---|---|---|
| Grand Rounds live raid | Cut (revisit only if Board Day thrives) | Needs 3+ people online at once in a 22-month hub whose concurrency outside exam eves is near zero; realtime edge cases (leavers, timers) for little learning gain. |
| INBDE simulation blocks inside the Gauntlet | Move to the hub's Mock mode | One timed-exam implementation, not two; the Gauntlet keeps ADEX stations. |
| 2.5D isometric three-floor canvas map, WebGL layer | Replace with a static SVG clinic facade (wing windows lit by readiness) | Same feedback, a fraction of the code, cost and visual risk; parallel agents can't judge "premium" without human review. |
| Adaptive music layers 2-3 | Defer indefinitely | Most phone study is silent. |
| 12 bespoke boss gimmicks | Build 3-4 (Code Blue, Brown Bag, Shadow Play, Phantom Pain); the rest use the generic attending's case | Each gimmick needs case content the bank may not have. |
| 40 protocols, seasons, decor shop, mentor story lines per level, career chapters story, post-licensure museum | Defer to the gates; cap protocols at ~15 | Content and testing surface with no evidence they bring anyone back. |
| Ghosts walking the day sheet | R2: show the class median and the item split only | Simpler, no per-person exposure. |
| Class census RPC and plaques | R2 as a single progress line | Low cost, but not before R1 proves return. |
| Lab Bench and the spot generator | Keep for R4 as planned | Valuable and honest, but ADEX criteria change yearly; build close to the class's ADEX season. |

## 8. The 5 biggest risks and mitigations

1. **Content starvation.** The game's heart (case sets with phase tags, beats, images, sibling items, ADEX drawings)
   is the slowest thing to write, and every bespoke mechanic multiplies the authoring cost. *Mitigation:* R1 must feel
   complete with standalone items plus 20 cases; a case template and per-unit case quota in the build; sibling items
   only for the top concepts; no mechanic ships before the content it needs exists.
2. **Nobody comes back (again).** Past games got one or two days from almost everyone. *Mitigation:* Today's shift is
   the drill and the default action on the hub and dashboard; non-item time capped (S1); the north-star (second day
   within 14 days) and the 85% item-time share measured from pings in R1, not from a later `game_runs` table; stop at
   the R1 gate if it fails, as the design already says.
3. **Mechanics that distort learning and data.** Refer opt-outs, case-feedback leakage and repeated identical items
   would inflate `question_stats` and readiness and teach the wrong exam habits. *Mitigation:* M1, M3 and M8, plus the
   policy-simulation test in CI and a monthly check of game-vs-bank accuracy on the same items.
4. **Losing state over 22 months.** Device storage eviction and phone changes reset SRS and history. *Mitigation:*
   M6 in v33; "Link my devices" carries SRS and saves; an About-page note on installing the hub to the home screen.
5. **Scope and maintainability with parallel agents.** 12,700 planned lines, a shared widget under live hubs, and art
   no agent can judge alone. *Mitigation:* the slim R1 below; widget changes first in one guarded PR; logic modules
   behind Node tests with fixtures; Sam reviews screenshots of each visual piece before merge; game code and content
   only in `src/boards/game/`, never patched into built files.

## 9. Recommended release 1 slice (about 5,600 lines of game code)

Goal unchanged: prove a second day. Everything below is needed for that; everything else waits for the gate.

| Module | What it does in R1 | Est. lines |
|---|---|---|
| `core/boot.js`, `core/fsm.js`, `core/rng.js`, `core/bus.js` | Mount/stop, adapter checks, pure transitions (HOME, SETUP, VISIT, ITEM, LOCKED, ROUNDS, SUMMARY, PAUSED, RESUME), seeded streams | 650 |
| `core/store.js` | Local save + `save_game`/`load_game`, schema version, newest-wins merge, resume mid-visit | 300 |
| `sched/selector.js` | Pools (due, callback, new, referral when data exists), daily budget and new-item governor (M5), spacing and interleaving rules, case-aware follow-up visits (M4), seeded | 550 |
| `sched/ability.js` | Elo per unit, difficulty shrinkage; calls the hub's inline readiness function | 200 |
| Hub inline `readiness()` (counted here, lives in the hub) | "Likely right" + "Seen N of M" per unit (M7) | 120 |
| `run/shift.js` | Today's shift (auto-routed from the drill set), Quick visit, Half shift; one attending's case per shift (generic, hardest eligible case) | 450 |
| `run/scoring.js` | Sure/Unsure/Guess, Flow on Sure only, skim guard, calibration summary (M1) | 200 |
| `run/perks.js` | 6 protocols, Full shift only, with the no-key-before-lock validator | 250 |
| `ui/item.js` | Item host via `api.renderItem(..., {lockIn})`, three lock-in buttons as submit, option shuffle mapping (M8), Rounds review after a case (M3) | 650 |
| `ui/chart.js`, `ui/viewer.js` | Patient box in exam layout (desktop column, phone sheet), image viewer with zoom, `spot` reads on images | 550 |
| `ui/home.js`, `gfx/facade.js` | Static SVG clinic facade with lit windows per unit, Today's shift button, week of practice days, Welcome back, Keep it line | 650 |
| `gfx/portrait.js` | Geometric SVG portraits from a seed, independent of conditions | 200 |
| `audio/sfx.js` | A handful of synthesized cues, off by default, `audioSession` ambient | 150 |
| `tools/ci/game-tests.js` | Selector determinism, no repeats, due always present, budget/governor, policy simulation (M1), readiness fixtures, save migration | 500 |
| `tools/ci/game-smoke.js` | Playwright: one Today's shift on desktop and phone, answers from `SH_EXPORT`, one event per answer, reload and resume, keyboard path | 200 |
| **Game total** | | **~5,620** |

Prerequisite widget PR (outside the count, ~150 lines): `SH_SRS` opt-in in `v3.js`; `shDrill.ensureSet/set`, counting
answers with the dialog closed and `SH_DRILL.size` in `drill.js`; `data-sh-fullscreen` in `pet.js`; 1-2 trophies in
`ranks.js` with About rows. Migration v33: `submit_arcade_score` and `record_achievement` patterns for boards,
`game_saves`, `srs_state` + `get_my_srs`/`upsert_srs`, `get_my_latest`, `get_question_stats_lite`, all added to
`redeem_link_code` where they hold per-visitor rows.

Out of R1: Composure, the canvas/WebGL map, music, Board Day, ghosts, census, raids, decor shop, seasons, boss
gimmicks, Lab Bench, Gauntlet, mentors beyond the authored `cue`.

R1 exit gate (4 weeks outside exam eves): at least 25% of hub visitors start a shift; at least 30% of players play
on a second day within 14 days; item and feedback screens at least 85% of game time; game-vs-bank accuracy on the
same items within 5 points (a check that the game isn't leaking or inflating).
