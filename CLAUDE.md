# study-hubs — instructions for Claude Code sessions

Interactive study hubs for UAB dental school exams, served by GitHub Pages at
https://smcmurry6-source.github.io/study-hubs/ from branch `main`.
Pushing to `main` IS deploying — classmates see it within a minute or two.

@DEPLOY_NOTES.md

The notes above are shared with Cowork/Claude Project sessions. Everything in
them applies here too, except where this file says how a Claude Code session
does it differently.

## Repo map

- `index.html` — dashboard. Hub cards come from the `HUBS` / `CLASSES`
  arrays near the top of the script; add or archive a hub there, not in markup.
- `hubs/<hub-id>/index.html` — one single-file hub each. `hubs/<hub-id>/audio/` holds
  its Kokoro narration (`<lecture>-full.mp3`, `<lecture>-plain.mp3`).
- `widget/v3.js` + `widget/v3.css` (+ `widget/eggs.js`, the easter eggs, `widget/clicks.js`, click analytics and feature events (`window.shTrack`), `widget/replies.js`, report replies and notices, `widget/ranks.js`, handpiece ranks, `widget/rankup.js`, the rank-up, level-up, trophy and mock-results cards, `widget/drill.js`, the Daily Drill, and `widget/fx.js`, the motion layer: answer feedback, the streak flame, bar fills, tab fades, and `widget/podcast.js`, the Timmy Time player; `widget/tour.js`, the guided tours of the dashboard and of a hub, loaded by `index.html` and v3.js) — shared cross-hub layer (search, class stats,
  streaks, leaderboard, analytics, `shTTS`, `shMindMap`). Cross-hub features go
  here, never hand-patched into one hub.
- `review/` — admin analytics page. Its **Recap** tab makes the shareable end-of-hub image (drawn by
  `widget/recap.js`) and **publishes** it to the dashboard's "Hub recaps" slideshow. When a hub is archived, publish its
  recap (`tools/publish-recap.js --bank <file>`; Sam's standing OK since 2026-10-01, `/lessons-audit` does it) **before**
  the hub page comes down, while `tools/dump-banks.js` can still read its bank.
  **Archived hubs' question banks are not kept in this public repo** (`question-banks/` is gitignored, removed
  2026-10-02): the syllabus keeps quiz and exam content from later classes. Keep a dump locally if you need one.
- `tools/podcast/` — Timmy Time, a hub's audio review episode hosted by Timmy Tooth: the script (`<hub>/script.md`),
  Kokoro voice with a pronunciation lexicon, synthesized music and mastering (its `README.md`). The mp3 goes in
  `hubs/<hub-id>/audio/timmy-time.mp3`; the hub defines `window.SH_PODCAST` and a `<div data-sh-podcast>` slot.
  Like narration, the episode must not drift from the notes: fix both in the same PR.
- `LESSONS.md` — what archived hubs taught us. Read it before building or restructuring a hub; **before building a new
  hub, if its "Last refreshed" date isn't today, run steps 1-3 of `tools/lessons-refresh.md` first**. Sam runs the whole
  runbook by hand whenever Sam asks for a lessons refresh, usually as `/lessons-audit` (the skill in
  `.claude/skills/lessons-audit/`; there is no scheduled routine): it refreshes `LESSONS.md` from all data, reports and suggestions
  (`tools/lessons-daily.sql`) and opens a PR with small data-backed fixes to the live hubs. **Archiving a hub
  always includes a retrospective** (Sam's standing rule): run `tools/retro.sql` for that hub (time by section,
  clicks and reach, engagement, questions, exam check-ins, search terms, reports), write the findings and the
  resulting changes into `LESSONS.md`, fix what's small, and tell Sam the rest. The dashboard archives a hub **by itself** at 10 pm on the day of
  its last exam (`ARCHIVE_HOUR`): its card turns into an archived card with no Open button, which disappears 10 days
  later (`CARD_DAYS`; `hideCardOn` overrides). "Check in" buttons show from 8 am on exam day; the pop-up only goes out
  from 10 pm and still reaches first visits up to 60 days after (`DEBRIEF_DAYS`). The hub's page itself stays up until
  someone removes it, so the retrospective and cleanup are still manual; moving the entry into `ARCHIVED_HUBS` then is optional. Read the check-ins as late as you can.
- `migration_v*.sql` — Supabase schema history (project `thytmzsgymydbzcqdnix`).
  New migrations are run once, by hand, in the Supabase SQL editor, or by a Claude Code session through the
  Supabase connector (`apply_migration` is pre-approved in `.claude/settings.json`). Commit the `.sql` file and
  refresh `supabase/schema.sql` either way.
- `deploy_rollout.py` / `.ps1` — the Cowork-era API deploy scripts. A Claude Code
  session doesn't need them: use git.

## How to ship a change (Claude Code)

1. Start from a fresh `main` (`git fetch && git rebase origin/main` before pushing if
   the session has run a while — other Claude Projects push here too).
2. Make the change on your branch. Cloud sessions can only push their own
   `claude/...` branch; that's fine — open a PR and Sam merges it to publish.
   In a local session, still prefer a branch + PR over pushing `main` directly.
3. Verify before pushing (see below).
4. In the PR description, write what changed in plain, student-facing language.
   **American English everywhere** (Sam's standing rule, 2026-10-02): color, favorite, center, millimeter,
   labeled, organize — in site text, changelog entries, notices, replies and code comments alike.
5. **Any student-visible feature, easter egg, trophy, holiday or setting goes on the About page
   (`about/index.html`) in the same PR** (Sam's standing rule, 2026-10-02): add or update its entry in the
   right part (with a "new" tag), keep counts like "All 24 trophies" true, and put anything that gives away a
   secret inside a `spoil` element (secret trophy rows carry `data-k` and the `spoil`/`spoil-ph` pair). Removed
   or changed features come off or get rewritten there too.
6. After merge, add a line to "Recent major changes" in `DEPLOY_NOTES.md` for
   anything non-trivial, and log it to the site changelog (below) if students
   would notice it.

Never force-push `main`. If a PR conflicts, rebase and resolve deliberately —
don't take one side wholesale; the other side is usually another session's work.

## Ship it now, never "after the exam" (standing rule)

Sam's rule, 2026-10-28, for every hub ever: **never hold a change until after an exam.** A hub is archived the night of its
last exam, so a change made after it reaches no one; every improvement helps most before the exam, the night before
included. Ship fixes, content, art and features to a live hub as soon as they're ready and verified. The only reasons to wait
are the ones already written down (a graded quiz still open, Sam's say-so).

## Verify before pushing

GitHub Actions runs `.github/workflows/check.yml` on every PR: `node tools/ci/syntax.js`
(every inline script parses, no conflict markers) and `node tools/ci/smoke.js` (headless click-through
of the dashboard and every hub on desktop and phone, plus a question-bank lint: duplicate ids, answer
ranges, missing explanations, a missing "why" for any choice, missing narration files, and the correct answer being the longest choice
in more than 40% of MCQs). Run both locally before pushing; the smoke test needs Playwright
(`PLAYWRIGHT_PATH`/`CHROMIUM_PATH` env vars point it at a preinstalled copy). The lint reads a hub's
data by injecting a hook just before `window.SH_EXPORT = {`, so keep that line at the end of each hub script.

- `node --check` on each hub's extracted `<script>` block(s) and on `widget/v3.js` / `widget/eggs.js` / `widget/clicks.js` / `widget/replies.js` / `widget/ranks.js` / `widget/rankup.js` / `widget/drill.js` / `widget/fx.js` / `widget/podcast.js`.
- Question / lecture counts match what you expect; no duplicate ids.
- Grep that the feature you added (and anything from a merged-in branch) is present.
- Conflict markers: search line-anchored (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) —
  the hubs' CSS uses long `====` comment dividers.
- If both `widget/v3.js` and `widget/v3.css` changed, make sure both are committed.
- Smoke test with Playwright against the file (`file://.../hubs/<id>/index.html`),
  clicking through each mode tab. The Supabase-backed widget parts only work live.

## Every choice gets a why (standing rule)

Every multiple-choice and select-all question explains **each** of its choices, not only the right one (Sam's standing
rule, 2026-10-20): a `QUESTION_WHY` row per question (`id: [one line per choice]`, same order as `choices`), drawn as
"Why each choice" under the explanation once the student answers (`whyHTML`). For the right choice say why it's right;
for each wrong one say what it actually is or what it's confused with. Don't start with "Correct"/"Wrong" (the list
draws its own marks) or refer to letters or positions (choices are shuffled). Draw it from the hub's own notes. **Any
question you write or edit gets its row in the same change**; the CI lint fails without it. Hubs archived before the
rule (`WHY_EXEMPT` in `tools/ci/smoke.js`) are exempt; a new hub copies `whyHTML` from `occlusion` and is not.

## Two-statement and true/false questions (standing rule)

Sam's rule, 2026-10-22: **every lecture's questions include two-statement and true/false items**, for every new hub, every
lecture added to a hub and every lecture that goes from slides-only to taught. Aim for about 5 two-statement and 8
true/false per lecture (Occlusion has 27 and 42 over its five lectures). CI fails a taught lecture with fewer than 3 and 5
(`FORMAT_MIN` in `tools/ci/smoke.js`; archived hubs and perio S1-S5, taught before the rule, are exempt).
- Build them with Occlusion's helpers (copy `two()`, `tf()`, `TWO_CHOICES` and `choiceOrder()` into a hub that lacks them):
  `two(id, lec, src, s1, s2, t1, t2, ex, r1, r2)` writes the stem "Read the two statements." with each statement on a line
  starting "1. " / "2. ", the four fixed choices and the key; `tf(id, lec, src, statement, isTrue, ex, whyTrue, whyFalse)`
  writes "True or false: …" with the choices True, False. Their choices never shuffle (bank, drill, Weak Spots, mock),
  `.qcard-stem` keeps line breaks, and the arcade skips both (`arcadeQ`).
- Spread two-statement keys over all four choices and keep true/false keys near half True (CI: 35-65% per hub).
- A false statement changes one detail that was taught (a number, a side, a swapped pair, who said it); never make it
  false through a trick of wording. Write each statement so it stands alone.
- Every choice still gets its why: `two()` builds the four lines from one reason per statement (write each reason so it
  reads after "Statement 1 is true:"), `tf()` takes one line for True and one for False. Draw them from the hub's notes.
- The graded-coursework rules below apply as to any question. Perio: its engine has two-statement items but no true/false
  yet, so add `tf()` (from `occlusion`) before Session 6 or any later session is marked taught.

## Numbered-statement questions (standing rule)

Sam's rule, 2026-10-28: **every lecture's questions also include numbered-statement items**: "Which ... are true?" over 4-5
numbered statements, answered with a combination ("1 and 3 only", "1, 2 and 4"), the format Dr. Givan's Occlusion midterm used
and the check-ins asked for. Aim for about 3-5 per lecture; CI fails a taught lecture with fewer than 2 (`FORMAT_MIN.numbered` in
`tools/ci/smoke.js`; archived hubs and perio S1-S5 are exempt, as for the other formats).
- Build them with Occlusion's `nums(id, lec, src, lead, stmts, truth, wrong, ex, reasons)` (copy `numList()`, `numLabel()` and
  `nums()` into a hub that lacks them; Heme & Endo's were written by hand with `mcq()` and `{fmt:'numbered'}`). `truth` says which
  statements are true, `wrong` gives three wrong combinations, and `reasons` one line per statement, written to read after
  "which is true:" / "which is false:". It builds the stem, the choices in canonical order (sorted by their numbers), the key and
  every "why each choice" line ("It includes 2, which is false: ...", "It leaves out 4, which is true: ...").
- `choiceOrder()` never shuffles them, the arcade skips them (`arcadeQ`), and the Question Bank's format filter has "Numbered
  statements". CI checks the stem's "1. "/"2. "/"3. " lines, the choice wording and the canonical order.
- Make each wrong combination differ from the key by one or two statements, so every statement has to be judged. Spread the
  key over all four positions (the sort decides the position: pick the wrong combinations to move it).
- False statements follow the true/false rule: change one taught detail, never a trick of wording. Draw them from the hub's notes.
- Perio: its engine has no numbered items yet; add `nums()` (from `occlusion`) before Session 6 or any later session is taught.

## Question Bank: lecture picker, order and pins (standing rule)

Sam's rule, 2026-10-30, for every live and future hub: the Question Bank's lecture filter is a **tick-box list** (`lecPickHTML()` /
`wireLecPick()`, every lecture ticked by default, Select all / Clear), with an **In order / Random** toggle (`STATE.ui.qorder`; In order =
by lecture, then bank order; Random shuffles once and keeps that order until Random is tapped again), and **pinned questions**: the hub
sets `window.SH_PINS = true`, the shared widget then adds a Pin button beside Report on every card (`window.shPins`, saved in `sh_pins_<hub>`
and synced across devices by `set_pins` / `get_my_pins` (migration_v46), `sh:pins` event), and the bank filters by it (a **Pinned (n)** button and "Pinned" in the status menu). `STATE.ui.qlec`
may be `'all'`, one id or an array of ids. The bank opens with the filters and order used last time (saved in `STATE.ui`; Perio `STATE.ui.qbank`). Copy it all from `special-patient-care` (or `occlusion`, which adds final/midterm presets).

**High Likelihood Exam Questions** (Sam's rule, 2026-10-30, every live and future hub; first in `heme-endo-exam1`): `LIKELY_TOPICS`
(`{lec, t, basis, ids}`) lists each lecture's predicted exam topics, strongest evidence first: what a professor flagged in a recording
(`hint`), an in-class review or focus list, the class exam-review guide, what check-ins said the exam asked, then the core of the
slides / lecture / module / reading. When the exam's count per lecture is announced, put it in `EXAM_COUNTS` and give each lecture that
many topics. The listed questions get `q.likely`: `likelyChip()` tags them in the bank and the drill (not the mock); the bank has a
**Likely first** order and a **High likelihood only** status; Exam Hints opens with `likelyHTML()` ("Most likely questions", a
Practice these button per lecture). Never base a topic on a graded quiz or a previous year's exam (graded-coursework rule below).
Building a hub or adding a lecture includes its topics; when new hints, reviews or focus lists arrive, re-rank them.

## Every hub opens on its own Home page (standing rule)

Sam's rule, 2026-10-27: every hub has a **Home** mode, first in the mode switch and the default (`data-default-mode="home"`,
`STATE.ui.mode` defaults to `home`), logged as `home/dashboard`. Copy `renderHome()` and its CSS from `heme-endo-exam1` (or
`occlusion`, which has it for a final with no time yet) and fill it from the hub's own data. At least:
- the exam(s): a live countdown and the format facts (`examCardHTML`), and an alert for anything graded coming due (a quiz closing);
- a quick-start row (practice questions, Daily drill, the notes you were on, the mock) and readiness (questions right on the latest try);
- **Where to next** (weakest lecture, questions missed, a lecture not started), progress by lecture with Notes / Questions buttons;
- the course timeline (`COURSE_DATES`: lectures, reviews, quizzes and exams, only dates that were announced), the last 14 days;
- links to the hub's other parts (hints, cram sheet, Review, Arcade, a podcast).
The quick-start row and the exam card live on Home, not on Compendium. Home redraws itself when `SH_SYNC` merges another device's
answers. A one-time flag that moves returning visitors (`STATE.ui.homeOn`) must **not** be in `defaultState()`: `loadState()` merges
the defaults into saved state, so a flag there is always set and the move never runs. `widget/tour.js` already has the Home steps.

## Every hub's arcade looks like that hub (standing rule)

Sam's rule, 2026-10-21: arcade games are never copied and pasted from one hub to the next. The rules of a game live once in
`widget/games.js` (Showdown, Mind the Gap, the escape room, Smile, Cross-Section; contract at the top of the file); each hub
gives them **its own look and story** through `skin` in the context its arcade passes to `shGames.make` (Occlusion: `OCCL_SKIN`, Perio:
`PERIO_SKIN`):
- **Escape room**: its own room and props drawn for that course (`escape.scene(api)` for a whole room, or `escape.parts` to swap
  single parts), its own spot labels and flavor text, and its own key item and reveal (Occlusion: articulating paper on the
  mounted casts; Perio: disclosing tablets on a typodont). Every hotspot goes through `api.spot()`, the clock hand through `api.hand()`.
  A room can be a painted backdrop (`hubs/<hub>/img/*.webp`, Sam generates them from prompts) with the hotspots measured onto it
  (Occlusion's `lab-escape.webp`); keep the overlays that show a lock's state (dark screen until solved, the digit badges).
- **Board, Mind the Gap**: names for the wager rounds (`board.dd`, `board.final`), intros and button labels, and CSS keyed on
  `[data-sg-skin="<hub>"]` in the hub's own stylesheet (Occlusion: articulating-paper strips; Perio: a perio chart whose teeth bleed,
  a probe-ruler clock).
- Game names in the hub's `GAMES` list, lobby thumbnails and the dashboard's `ARCADES` entry are the hub's own too.
A new hub builds its skin from its own material before it ships; reuse the mechanics, never another hub's art or wording. Game
ideas Sam wants considered for future hubs: quiz games, typing games, point-and-click and escape rooms.

## Text and audio must never drift

Hubs with pre-generated narration (see `hubs/*/audio/`): editing a lecture's
text at either level (As taught / Plain English) means regenerating that
level's mp3 in the same PR.

Kokoro TTS setup (cloud sessions can only download GitHub release files from
repos attached to the session, so the model is re-hosted on this repo):

```bash
pip install kokoro-onnx soundfile
mkdir -p /tmp/kokoro && cd /tmp/kokoro
gh release download kokoro-model-v1.0 -R smcmurry6-source/study-hubs \
  || for f in kokoro-v1.0.onnx voices-v1.0.bin; do
       curl -fL -o "$f" "https://github.com/smcmurry6-source/study-hubs/releases/download/kokoro-model-v1.0/$f"; done
```

```python
from kokoro_onnx import Kokoro
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin")
samples, sr = k.create(text, voice="af_heart", speed=1.0, lang="en-us")
```

Encode to mp3 (ffmpeg or lameenc). ~20–30 chars/sec on one CPU — for many
lectures, shard the job and skip files that already exist. Keep the job in the
foreground/polled; an idle cloud VM is reclaimed and background work is lost.

## Diagrams (the anima skill)

`.claude/skills/anima/` (vendored from Garinmckayl/anima, see its `UPSTREAM.md`) draws accurate isometric SVG
figures of anatomy, cells, receptors and drug mechanisms. Use it for hub diagrams, with these house rules:

- **Building a hub, or adding lectures to one, includes a diagram review** (`DEPLOY_NOTES.md` → "Building a hub =
  diagram review"; Sam's standing rule, 2026-10-13). Once the notes are written, list the candidates, ranked by what
  the questions test and where the class struggles (`question_stats` for a live hub). Ask Sam about **each one
  separately** with AskUserQuestion: one question per candidate, with the options Build / Skip / Change it, up to 4
  per call. Draw only what Sam approves.

- Hubs are single files, so a figure is built offline and pasted in: keep its Node build script in
  `tools/figures/<hub>/` (importing `.claude/skills/anima/kit/`) and put the static SVG and the CSS it needs into the
  hub, the way the existing drawn figures are (`FIGS`/`figHTML()`, `FIG_BY_LEC` in `occlusion` and `pcd-exam3`).
  Never load anything from `.claude/` at runtime.
- The kit's CSS switches themes on `.iso[data-theme="light"]`; hubs set `data-theme` on `<html>`, so scope it to that.
- The first ones are in MSK Exam 4: copy `tools/figures/msk-exam4/` (`shared.mjs` maps the kit's tokens onto the hub's
  palette; `build.mjs` rewrites the hub's `anima:css`/`anima:js` blocks, `--preview` writes standalone pages for anima's
  checks, `--check` fails if the blocks are stale). As root, anima's Chrome scripts need a `--no-sandbox` wrapper as `CHROME_PATH`.
  Every copy a page draws gets its own SVG ids (`uniq()` in the build), because hidden mode panels stay in the page and
  `url(#id)` would point into the first copy: give new ids the figure's prefix (`nm-`, `sc-`), and in live code or CSS
  never hard-code one (read it from the markup, or match `[id^="sc-actin-p"]`). In Review a figure goes in the group it
  belongs to, as a section of type `figs` (MSK 4: the NMJ under Drugs, the sarcomere under Muscle).
- Under a lecture's notes, figures go outside `.reading-prose` (the narrated text), so the narration doesn't drift, or
  inside the notes next to the paragraph they explain, inserted at render time in a wrapper with `data-sh-noread`
  (Occlusion's `FIG_PLACE`, 2026-10-20): the browser voice, the highlighter and note-search jumps skip it, and the
  READINGS text itself never changes. Never paste a figure into the READINGS strings.
- Occlusion's figures, case images (drawn perio charts, radiographs, intraoral views) and the "What cusp hits where?"
  game come from one plain-JS kit in `tools/figures/occlusion/` (`build.mjs` pastes it between the hub's `od:kit` /
  `od:css` markers, and the anima figures from `anima/` between the `anima:js` / `anima:css` markers; `--check` fails if
  any block is stale; `--preview` writes standalone pages for anima's checks). Contacts per Angle class are read off the help sheet's own
  pictures (`CONTACTS`). A figure's `key` is folded under the notes/Review copy (`figKeyHTML`) and opens in the explanation
  after answering (`figAfterHTML`); in-picture labels with class `fg-hint` hide while the figure sits above a question stem.
- **Picture questions never give the answer away** (Sam's standing rule, 2026-10-14). The diagram sits above the stem only
  when the question can't be answered without it (name the highlighted part, read arrow B, which suture is shown).
  Otherwise write a stem that stands on its own and set `imgAfter:true`: the diagram then opens with the explanation,
  after answering (`figAfterHTML` in `msk-exam4`/`pcd-exam3`, `figAfter` in `perio`). Also check that a diagram shown
  first doesn't draw or label the answer.
- Draw from the hub's own lecture notes: labels and numbers match what was taught, and the caption names the lecture.
  Anything beyond the lecture needs an authoritative source (anima's sourcing rule).
- Run anima's own checks, look at it at 390 px wide and in both themes, and give Sam the screenshots in the PR:
  drawn figures get Sam's look before merge, as the suture diagrams did. A new kind of figure goes on the About page.

## Usage data and surveys

To decide what to improve or cut, read the data before guessing (Supabase connector, read-only SQL):
`activity_pings` (time per `<mode>/<sub-view>`, 25 s per ping), `ui_clicks` + `ui_click_reach` (clicks per
button/tab and distinct people, per day), `question_stats` / `question_choices` (accuracy, popular wrong answers),
`mode_stats`, `exam_debriefs` (post-exam check-ins), `search_terms` (what people searched for, with result
counts) and `feature_events` (from 2026-10-20: page loads, a daily settings snapshot, easter eggs, Timmy Tooth's intro,
podcast and Listen minutes and progress, diagrams; per day, page, kind and person). When you ship something a click
can't measure, add a `window.shTrack("<area>:<what>")` call for it. The admin page (`review/`) shows the same under Time by section, Clicks and Questions.
Surveys: one live at a time on the dashboard, shown once per visitor. Publish from `review/` → Surveys, or
`admin_upsert_survey(p_secret, p_slug, p_title, p_questions, p_active)` with 1-3 questions
(`kind`: choice | multi | scale | text). Results: `get_survey_results(p_secret)`. Ask Sam before a survey goes live.

## Student reports and suggestions

Reports (`question_flags`) and suggestions (`hub_suggestions`) carry the sender's `visitor_id` (from 2026-09-29).
**Resolving one tells the sender** the next time they open a hub or the dashboard (`widget/replies.js`: a pop-up once,
then kept in their Inbox, in the hub menu and the dashboard's top bar), so always
write the reply: for a question report, what was wrong and what changed, in plain words. Use the admin page's Inbox,
or SQL through the connector: `update question_flags set resolved = true, resolved_at = now(), reply = '...' where id = N`
(`set_report_resolved(p_secret, p_kind, p_id, true, p_reply)` does the same). For a fix the whole class should hear
about, post a notice everyone sees once (and keeps in their Inbox): Inbox → "Tell everyone" (its own title and message,
written for the whole class, not the sender), or `insert into site_notices (hub, title, message)`
(`hub` only labels it, e.g. which hub was fixed; it shows everywhere, pops up for 14 days and stays in the Inbox 60). Ask Sam before sending one to everyone.

## Secrets

This repo is public. Never commit keys or tokens, and never put the admin
secret in client-side JS. In cloud sessions they come from the environment:

- `SB_KEY` — Supabase publishable key (also fine as an API credential on
  `thytmzsgymydbzcqdnix.supabase.co`, which opens network access to it).
- `ADMIN_SECRET` — for gated RPCs such as `log_changelog(p_secret, p_hub, p_message)`.

If they're missing, skip the changelog step and tell Sam rather than hunting
for them. Check Supabase reachability first:
`curl -sS -o /dev/null -w "%{http_code}" https://thytmzsgymydbzcqdnix.supabase.co/rest/v1/`
(401 = reachable, no key).

## Content from lecture materials

Lecture slides, PDFs and recordings are NOT in this repo and must not be
committed (public repo, course material). If a task needs them, ask Sam to
run it as a local session or provide the text.

**Graded course work** (Canvas quizzes, crosswords, the take-home, exams; Sam's standing rule, 2026-10-09). The
DENT 2155 syllabus keeps quiz and take-home questions and answers confidential and bans sharing them with later
classes, and open quizzes allow no AI or collaboration. So:
- Never copy a graded quiz, crossword, take-home or exam question into a hub, word for word or lightly reworded.
- Once it has **closed** for the class, use it as **context**: check that every topic it tests is covered by
  questions the hub writes itself, in new wording. Never leave a topic out because it appeared on a quiz.
- Never use a quiz, crossword or take-home that is **still open**, even as context.
- Never use **previous years'** graded quiz, take-home or exam content at all, not even as context (e.g. screenshots
  of last year's Canvas quizzes in a passed-down class deck, or recalled exam questions): sharing it with a later class
  is what the syllabus forbids. Cover those topics from the lectures instead.
- **Ask Sam before removing or excluding any content** from a hub for these reasons.
