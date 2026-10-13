# Deploy Notes — read this before touching the repo

This repo is edited from several different Claude Projects (one per hub, plus a
"hub index" / overarching project for cross-hub UI and shared functionality).
Those Projects don't share context with each other or with plain Claude Code
sessions — a session in one Project has no idea what a session in another
Project just changed. **This file is the one place every session, regardless
of which Project spawned it, can check.** Update it whenever you make a
non-trivial change, and read it before you deploy.

## The core rule: GitHub is the source of truth

Never trust a locally-cached or previously-read copy of a hub file across
sessions. Before editing or publishing anything in `hubs/*/index.html` or
`widget/`:

1. Fetch the file fresh from `main` (raw GitHub content, not a cached Read/Artifact
   snapshot from an earlier turn) and diff it against whatever you were about to
   publish over it.
2. If it changed since your working copy's common ancestor, don't blind-overwrite.
   Do a real three-way merge (`git merge-file -p <mine> <ancestor> <theirs>`),
   then check the result for conflict markers with a line-anchored pattern
   (`^<<<<<<<`, `^=======$`, `^>>>>>>>`) — this file's own CSS uses long `====`
   dividers as comments, which false-positive on a naive substring search.
3. After merging, verify before publishing: `node --check` on the extracted
   `<script>` block, structural counts (question/lecture/drug counts match what
   you expect), a duplicate-id check, a check that the feature you were adding
   is actually present, and ideally a live smoke test (Playwright or the browser
   pane) before it goes out.
4. Check the entries below **and** the site's own changelog (Supabase
   `changelog` table, shown on the dashboard) for anything recent before you
   deploy — if someone else's change isn't reflected in your working copy yet,
   that's your signal to go back to step 1.

## The About page lists everything (standing rule)

`about/index.html` (the dashboard's "About" button) is the students' guide to every feature, easter egg, trophy,
holiday and setting. **Every Project and session that ships something students can see adds it to that page in the
same change** (or updates/removes the entry when a feature changes or goes away). Secrets go inside a `spoil` element
so they stay hidden until someone ticks "Show spoilers". Hub-only content (new questions, notes, review tables) doesn't
need an entry; a new hub mode, tab, game or question type does.

## Shared infrastructure (touch once, not per-hub)

- **`widget/v3.js` + `widget/v3.css`** (+ `widget/eggs.js`, `widget/clicks.js`, `widget/replies.js`, `widget/ranks.js` and `widget/drill.js`, which v3.js loads itself) — loaded by every hub (`fixed-pros`,
  `genetics`, `gi-exam1`, `hepatobiliary`, `perio`) via
  `<script src="../../widget/v3.js" data-hub="<hub-id>" data-answered-event="<hub>:answered" data-default-mode="...">`.
  Cross-hub functionality (search, class-wide correctness, streaks, activity
  pulse, leaderboard, analytics) belongs here — never hand-patched into one
  hub's own `index.html`. Each hub publishes `window.SH_EXPORT =
  {lectures, questions}` after its own IIFE closes, which is what the widget
  reads for search and "toughest questions" — if you add a hub or change its
  question shape, make sure `SH_EXPORT` still reflects it.
- **Supabase project `thytmzsgymydbzcqdnix`** backs the widget: changelog,
  leaderboard, study streaks, activity pulse, and visitor analytics (see
  `migration_v4.sql`/`v5.sql`/`v6.sql` at repo root for schema history — run
  new migrations once each, by hand, in the Supabase SQL editor). The API key
  and the `log_changelog`/admin RPC secret live only in local ops scripts on
  Sam's machine (`deploy_rollout.ps1`, `check_leaderboard.ps1`) — **never**
  commit them here or hardcode them into a hub's client-side JS.
- **GitHub Pages deploy** — `github.com/smcmurry6-source/study-hubs`, branch
  `main`, served at `smcmurry6-source.github.io/study-hubs/`. Deploy via the
  GitHub Git Data API (blob → tree → commit → ref update); a GitHub PAT is
  needed for this and should only ever be used transiently (env var for one
  script run), never written into a committed file. **Claude Code sessions
  (cloud or local) don't use the API path or a PAT:** they push a branch and
  open a PR, and merging the PR is the deploy — see `CLAUDE.md`.
- **Kokoro model files** — re-hosted as release `kokoro-model-v1.0` on this repo
  (`kokoro-v1.0.onnx`, `voices-v1.0.bin`), because Claude Code cloud sessions can
  only download release files from repos attached to the session.

## Archiving a hub = retrospective (standing rule)

Every time a hub is archived, all the data gathered on it (time by section, clicks, engagement, questions, exam
check-ins, search terms, reports, surveys) is used to improve the next hubs: run `tools/retro.sql`, then record the
findings and resulting changes in `LESSONS.md`. **Any session building or restructuring a hub reads `LESSONS.md`
first** (hub Projects included: it holds what the class actually used and where they struggled).

It is also refreshed between archivings, by hand when Sam asks a Claude Code session to "run the lessons refresh"
(`tools/lessons-refresh.md`; no scheduled routine): it reads all tracked data, student reports and suggestions since the last run
(`tools/lessons-daily.sql`), rewrites the "Live signals" section, and opens a PR with small, data-backed fixes to the
live hubs. **Before building a new hub** (any session, hub Projects included), if `LESSONS.md`'s "Last refreshed"
date isn't today, do steps 1-3 of that runbook first so the new hub is built from current data.

## Recent major changes (newest first — add a line when you ship something)

- **2026-10-13 (lessons audit, Claude Code)** — Two days before PCD Exam 3. **Select-all options now show a tick box**
  that fills when picked and stays after grading (green right, red wrong), in `pcd-exam3`, `msk-exam4` and `occlusion`
  (CSS only, `.qcard-choice[data-act="multi"]`), from PCD report #14 ("not very clear what options you have selected";
  the picked state was only a thin accent border). PCD `co-afterimage` stem reworded (report #13; same answer and
  choices). Explanations now name the favorite wrong answer on PCD `ce-irm` (TempBond NE), `ve-pbox-3` (light try-in
  paste), `ce-contact-open`, `ce-burnish`, `ce-isolation` and MSK 4 `sk-lamellar` (Langerhans), `dp-clinda`
  (bacitracin). No reading text changed, so no narration regenerated. `LESSONS.md` refreshed.

- **2026-10-10 (lessons audit + MSK Exam 4 dashboard date, Claude Code)** — The 10-08 PCD date fix (9d3463d) also moved
  **MSK Exam 4's** `HUBS` date to 2026-10-15; the hub itself says Fri Oct 16. Back to `2026-10-16` in `index.html`, so
  the card no longer auto-archives (no Open button) at 10 pm on MSK 4's exam eve and check-ins open on the real exam
  day. `LESSONS.md` refreshed: MSK Exam 3 retrospective written (its recap was already on the dashboard since 10-09),
  Live signals for PCD Exam 3 / MSK Exam 4 / Occlusion, new standing lesson on keeping a hub's two exam dates in step.
  **Cleanup still manual:** `hubs/msk-exam3/` (card leaves the dashboard 10-12).

- **2026-10-09 (graded course work rule, Claude Code)** — Standing rule in `CLAUDE.md` → "Content from lecture
  materials": graded quiz, crossword, take-home and exam questions are never copied into a hub; once closed they are
  used as context so every topic they test is covered by hub-written questions; nothing still open is used at all;
  previous years' graded quiz, take-home or exam content is never used, even as context;
  and Sam is asked before any content is removed or excluded for these reasons. MSK Exam 4 already works this way.
  MSK Exam 3 is unchanged (its exam has passed). No site change.

- **2026-10-07 (new hub: PCD Fixed Pros Exam 3, Claude Code)** — `hubs/pcd-exam3/` for the D2 PCD Fixed Pros didactic Exam 3
  (Thu Oct 15, Canvas 8 am-8 pm, 40 questions: 1 multiple answer, 4 matching, the rest MCQ). Built from the Drive folder
  PCD Fixed Pros/Hubs/Exam 3: L1 Cement & Cementation (Dr. Fu; 2026 lecture capture + 2021 recording, which adds crown
  try-in/delivery), L2 Bonding Dental Ceramics (Dr. Lawson), L3 Removing a Crown (Dr. Fu, 2026 capture), L4 Onlays
  (Dr. Robles), L5 Laminate Veneers (Dr. Fu), L6 Color (Dr. Givan) and James Bradley's glaze/add-contact video (labeled `V`),
  plus the course's Exam 3 hint email, which drives src `hint`, the mock blueprint (8/7/3/6/7/7/2) and the Exam Hints tab
  (new hint kind `list`, shown as "exam list"). Built on the Occlusion engine with a new palette/type ("porcelain &
  cement"; DM Serif Display / Figtree / DM Mono). 329 questions (src `slides` / `rec` / `hint`): 309 MCQ, 10 matching
  (4 pairs, unique answers), 5 select-all (5 options, 3 correct), 5 orderings (3-5 steps), 12 EXCEPT, 6 Patient Box,
  9 diagram questions, 40 memory cues; correct answer longest in 33% of MCQs. No two-statement items. 8 drawn figures
  (Munsell solid, additive vs subtractive, specular vs diffuse, veneer prep designs, dog leg, papilla rule, PFM vs zirconia
  cut paths, the bonding "Lego" chain) under the notes and in Review. As taught + Plain English notes with Kokoro
  narration for all 7, review tables, cram sheet, and the arcade reskinned as the Bond Street Arcade (same nine game
  ids, `p_hub:'pcd-exam3'`). Dashboard: new `fixedpros` class on the `pros` ring, `HUBS` + `ARCADES`; `review/` labels,
  `tools/publish-recap.js`, `sw.js` (VERSION sh-v13), About page (arcade table, Diagrams), `assets/og-pcd-exam3.png`.
  Where the 2021 and 2026 recordings disagree (whether to cure the adhesive before seating; whether the patient bites to
  seat), the notes give both and no question turns on it. No schema change.

- **2026-10-07 (new hub: Occlusion Midterm, Claude Code)** — `hubs/occlusion/` for the D2 Occlusion midterm (Wed Oct 21):
  Dr. Givan's five lectures (L1 Review of Basic Occlusion with his "What cusp hits where?" help sheet, L2 TMJ anatomy and
  muscles, L3 mastication/deglutition/speech, L4 occlusal concepts, L5 applying occlusion), built on the MSK Exam 4
  engine with a new palette/type ("articulating paper"; Bricolage Grotesque / Public Sans / JetBrains Mono). 296
  questions (src `handout` / `hub` / `help`), including 20 **drawn diagram questions** (`img:'<FIGS key>'`, rendered by
  `figHTML()` in the bank card and the mock; arcade pools skip them) on the envelope of motion in three planes, cusp
  pathways on a maxillary and a mandibular molar, which inclines collide, and the fence post; 9 Patient Box and 15
  EXCEPT items; no two-statement items. Every figure also sits under its lecture's notes (`FIG_BY_LEC`, outside the
  narrated `.reading-prose`) and in Review (new section type `figs`). Board-exam items in last year's class deck were
  not reproduced. As taught + Plain English notes with Kokoro narration, exam hints quoted from the 9/17, 9/24 and 10/1
  recordings, a 40-question mock (12/8/7/7/6), review tables, and the arcade reskinned as the Freeway Space Arcade (same
  nine game ids, `p_hub:'occlusion'`). Dashboard: new `occlusion` class on the unused `pros` ring, `HUBS` + `ARCADES`;
  `review/` labels, `tools/publish-recap.js`, `sw.js` (VERSION sh-v12) and the About page (arcade table, Diagrams)
  updated. No schema change. **Two exams** (midterm Oct 21, final Thu Nov 19, both in `HUBS.exams` and the hub's
  `SH_EXPORT.exams`), so the hub archives itself the night of the final, not the midterm; the ribbon counts down to
  the midterm, then to the final (`FINAL_DATE`). The final is not cumulative; its new lectures aren't in this hub yet.

- **2026-10-07 (new hub: MSK Exam 4, Claude Code)** — `hubs/msk-exam4/` for GI & MSK Exam 4 (Fri Oct 16): L28 skin
  histology (Herr), L29 derm pharm (Fasinu), L30 dermpath (Dababneh), L31 skeletal muscle (Latimer), L32 NMJ pharm
  (Wilborn) and Dr. Taylor's MSK & skin clinical application (labeled `CA` via a new `label` field and `lecLabel()`).
  Built on the MSK Exam 3 engine with a new palette/type ("dermis & myoglobin"; Newsreader / Instrument Sans / IBM Plex
  Mono). 223 questions: 11 lecture self-checks, 44 rewritten from a classmate's study deck, 168 hub-written, including
  13 EXCEPT, 7 Patient Box (`pbox`) and 2 select-all (`type:'multi'`, perio-style partial credit) items, ported into this
  engine (qCardHTML, the mock exam; arcade pools skip `pbox` items). **No two-statement items in this hub** (Sam, 10-07).
  **Last year's graded Canvas quiz screenshots in the Exam 4 study deck were deliberately left out** (syllabus rule, as in
  #64); their concepts are covered by new questions. As taught + Plain English notes for all six lectures with Kokoro
  narration, a "what's tested" box and comparison tables per lecture, a one-tap quick-start row on Compendium, 35 exam
  hints quoted from the 9/25 recordings, a 40-question mock (7/7/8/7/7/4), review tables, and the arcade reskinned as the
  Skin Deep Arcade (same nine game ids, `p_hub:'msk-exam4'`). Dashboard `HUBS` + `ARCADES`, `review/` labels,
  `tools/publish-recap.js`, `sw.js` precache (VERSION sh-v11) and the About page's arcade table updated. Also fixed in
  this hub only: the bank's search debounce threw after leaving the tab (same bug is in `msk-exam3`, now archived).

- **2026-10-04 (Timmy Tooth is scared of TIMMY, Claude Code)** — After the TIMMY show (`sh:egg-local` `t:"timmy"`),
  `widget/pet.js` sets `sh_pet_scared_until` (now + 5 min, so it carries across the dashboard and hubs) and draws mood
  `scared`: wide eyes with darting pupils, worried brows, a wavy mouth, pale cheeks, a sweat drop and a constant tremble
  (`.is-scared`, off under reduced motion). While it lasts his hellos and most joke taps are `SCARED` lines and he glances
  around when idle; when it ends he says a `CALM` line. The dashboard pet now reacts to TIMMY too (hubs already did).

- **2026-10-04 (TIMMY curses instead of blessing, Claude Code)** — The TIMMY show ended with "TIMMY HAS BLESSED THIS STUDY
  SESSION", which contradicted the setup (the whisper "you shouldn't have said his name", Timmy Tooth's "do NOT type my
  name"). It now reads "TIMMY HAS CURSED THIS STUDY SESSION" with one of six harmless curses (`CURSES` in
  `widget/timmy.js`, picked by the device's summon count, so each summon gets the next one) and "He will return."; the
  closing chord now descends. Timmy Tooth's `EGG_LINES.timmy` gains two lines about it. About page reworded.

- **2026-10-03 (nuke unlocks tracked, Claude Code)** — `widget/v3.js` now calls `record_nuke_unlock` when the nuke badge
  appears (100 right in a row on one page load); before this only launches were saved, so "unlocked but never used"
  could only be guessed. `migration_v33.sql` (**applied 2026-10-03 via the connector**): `nuke_unlocks`, public
  `record_nuke_unlock` (one per person per hub per 5 min), admin `get_nuke_unlocks` (per hub: unlocks, never used =
  no launch before their next unlock, people). `review/` → Engagement shows a "Nukes unlocked" tile and Unlocked /
  Never used columns in Nukes by hub. Not student-visible.

- **2026-10-02 (Timmy Tooth holiday talk, Claude Code, #63)** — `HOLIDAY_TALK` in `widget/pet.js` replaces the single
  `HOLIDAY_HELLO` line per holiday: greetings, right/wrong-answer quips and jokes for each holiday, plus a `fall` pool for
  autumn weeks without one (`isFall()`). `deal(key, arr)` hands lines out from a shuffled deck per pool
  (`sh_pet_deck_<pool>` in localStorage): every line before a repeat, never twice in a row; the regular jokes use it too.
  Seasonal greetings now show in hubs (40% of hub hellos in a holiday, 15% in fall), 75% of dashboard hellos in a
  holiday; 40% of answer quips and 50% of jokes are seasonal in a holiday. About page updated.

- **2026-10-02 (Timmy Tooth "do NOT type my name", Claude Code, #61)** — Reverse-psychology hint for the TIMMY egg:
  `DONT_SAY` lines in `widget/pet.js`, used in ~20% of dashboard hellos (when no holiday/HP line takes the slot) and ~12%
  of hub hellos, plus the last entry of `TIPS`. Never with Surprises off (`eggsOn()`).

- **2026-10-02 (archived banks and the MSK PollEv set off the public site, Claude Code)** — `question-banks/` (GI Exam 1
  and 2 banks plus their extract scripts) deleted and gitignored, so past banks aren't publicly downloadable by later
  classes; `review/`'s `ARCHIVE_BANK` is gone (an archived hub's recap there has no question text; publish with
  `tools/publish-recap.js --bank <local file>` before the page comes down). The 23 MSK PollEv exam-review items
  (`rv-*`, `src:'review'`) removed after Exam 3; the bank's "Exam review set" callout hides itself when empty, and the
  source filter lists only sources that have questions. **To recover them** (they stay in git history):
  `git checkout 1e6b580 -- question-banks` restores the folder; `git show 1e6b580:hubs/msk-exam3/index.html` has the
  `rv-*` items (the block after "Exam review (PollEv review session"). Copy them somewhere private first if this repo
  is ever recreated with fresh history. **MSK Project: drop the
  `rv-*` items from the split sources too.**

- **2026-10-02 (check-ins ask for topics, not exam questions, Claude Code)** — The exam check-in's last question is now
  "Any topics or question formats the hub missed or barely covered?" with a note asking people not to write out exam
  questions or answers (the honor code keeps exam content private; the DENT 2155 syllabus bans copying any part of an
  exam). Answer key `missed` unchanged, so `review/` and the audit queries still read it. `/lessons-audit` now says to
  use a check-in only as a topic or format, never to rebuild an exam question from one. About page entry updated.

- **2026-10-02 (TIMMY easter egg, Claude Code, #59)** — `widget/timmy.js`: typing TIMMY (outside a text field, or into a
  hub's Search box) runs a 15-second overlay show (dark fade, page crumbles, crowned Timmy with cursor-tracking eyes,
  letters slam in, mini-Timmy rain, "blessed this study session" banner, page restored). Esc / corner button ends it;
  reduced-motion skips crumble, starfield and rain. Separate from Timmy Tooth (`pet.js`), who gets an `EGG_LINES.timmy`
  reaction via `sh:egg-local` when the show ends. Off with Surprises (`sh_pref_eggs`), never during a mock. Loaded by
  `v3.js` in every hub and by `<script>` on the dashboard and review page. Per-device counter in `sh_timmy_count`.
  On the About page (Part 7, behind spoilers; added in #60). No trophy.

- **2026-10-02 (MSK `nq-folate-case` explanation, Claude Code)** — Report #12: "is trouble concentrating not a neurologic
  symptom?" The stem lists trouble concentrating while the explanation said "without neurologic symptoms". Answer and
  stem unchanged; the explanation now says the concentrating trouble comes from the anemia (like the fatigue) and names
  the B12 signs that do separate it (numbness/tingling, lost vibration/position sense, gait: subacute combined
  degeneration). **MSK Project: carry this into the split sources.**

- **2026-10-02 (undo on ordering questions, Claude Code)** — From suggestion #3 (MSK). Ordering (sequence) cards gain
  **Undo last step** and **Start over** under the steps, shown once a step is tapped and hidden once graded (the last
  step is forced, so it still grades on the final tap). MSK: `data-act="seq-undo"/"seq-clear"` in
  `wireQuestionContainer`, `[data-role="seq-tools"]`; perio: `.qcard-seq-tools [data-seq-tool]`, which restores each
  step's text. About page entry added. **Perio and MSK Projects: carry this into the split sources.**

- **2026-10-02 (memory cues on missed questions, Claude Code)** — From a student suggestion ("when you miss a question, give
  a way to remember it"). A perio question can carry `cue:"..."`, a mnemonic or hook drawn inside the explanation as
  **Remember it:** (`cueHTML(q)`, `.qx-cue`), shown only after a miss: a wrong MCQ pick, a partly wrong select-all, a
  sequence or matching with a mistake, or "I missed it" on a recall card (`markMissed()` adds `.missed` to the
  explanation). Works in the bank, the daily drill and the mock's missed-question review, which all use `qCardHTML`.
  80 cues written for every perio item under 80% class accuracy with 8+ attempts (plus q5-01/q5-06). **MSK** too: its
  88 cues (items under 75%, 8+ attempts) live in one `QUESTION_CUES` map applied to `QUESTIONS` (its bank is built by
  `mcq()`/`seq()` calls); `finishCard()` adds `.is-missed`, and the submitted mock marks missed cards the same way.
  No reading text changed, so no narration regenerated. **Perio and MSK Projects: carry the cues, `cueHTML` and the
  CSS into the split sources. A new hub gets cues by rendering `q.cue` the same way.**

- **2026-10-02 (Timmy + trophy follow-ups, Claude Code)** — `migration_v32.sql` (**applied 2026-10-02 via the connector**):
  `get_trophy_stats()` (public: people per trophy out of everyone who has answered, same rules as `get_rank_profile`),
  shown as a % pill under each trophy in the trophy case and in its detail line; `record_achievement` accepts
  `pet-adopt` (hub = the adoption day), so **adopting Timmy follows you to your other devices** (`shPet.syncBadges`,
  called from the dashboard's `loadMyRank` and `widget/ranks.js`; existing adopters are backfilled once,
  `sh_pet_adopt_sent`). Closing his introduction any way but "No thanks" now adopts him (he could stay stuck on your
  name). **Secret tips**: a "Secret tip" button on his house, every 4th tap, and some hub greetings walk through how to
  find each egg (`TIPS` in `widget/pet.js`; the current holiday's word first). **House**: mastery pennants fly from a
  flagpole in the yard (were strung across the sky from nothing), the TIMMY nameplate is a plaque above the door,
  winter covers the whole yard in snow with a snowman, and **fall** (Sep 22 - Nov 30, `isFall()`) adds a tree with
  turning leaves (try `localStorage.sh_egg_holiday_test = "fall"`). **Full Arch fix**: the teeth after #16 drew below
  the chart (the pop animation's CSS transform replaced each tooth's flip); each tooth now sits in a positioned group.
  **About the hubs** (`about/index.html`, linked from an "About" button in the dashboard top bar and the footer): every
  feature, easter egg, holiday and trophy with how to find it. Easter-egg walkthroughs and secret trophy names sit behind a
  "Show spoilers" switch (`sh_about_spoilers`); trophy rates load live from `get_trophy_stats`. **When you add a feature,
  egg or trophy, add it to this page too.** On phones under 430 px the dashboard wordmark shows only its rings so the top
  bar fits on one line. `tools/ci/syntax.js` now checks `about/index.html`.

- **2026-10-01 (mastery flair, new eggs, Timmy Tooth, Claude Code)** — `migration_v31.sql` (**applied 2026-10-01 via the connector**):
  the leaderboards (`get_leaderboard`, `get_correct_streak_stats`, `get_arcade_leaderboard`, `get_rank_board`, `get_fairy_board`) gain a
  `flair` column ("perio:3,msk-exam3:1"; 1 bronze … 4 crown, from the mastery-* achievements via `sh_mastery_flair`), drawn as
  medals by `shRanks.flair()` next to names on every dashboard board, both hub arcade boards and the rank cards; a new mastery tier
  gets a toast. New eggs in `widget/eggs.js` (all announce a `sh:egg-local` event): **mirror** (type it; flips the in-flow body
  children, `.sh-mirror-flip`), **Full Arch** (a 32-tooth chart bottom-left; right answers add a tooth, misses knock one out;
  **once per hub**, `sh_egg_arch_done_<hub>`, and ranks.js retires it when the server badge `fullarch:<hub>` exists),
  **Floss Chain** (3+ people type floss in the same hub within 60 s, over the presence `egg` broadcast), **Cavity Search**
  (weekly, one paragraph of each hub's Lecture Notes picked from `SH_EXPORT.sections` kind Notes; first 5 to tap it,
  `claim_cavity`/`get_cavity_week`, shown in the Stats egg board), **holidays** (Halloween, Thanksgiving, winter, New Year,
  Valentine's, Dentist's Day, St Patrick's, Easter: themed confetti via `window.shConfettiTheme`, a costumed Plaque Boss and a
  magic word each; Halloween runs all of October (Oct 1-31; the others keep their short windows); try one with `localStorage.sh_egg_holiday_test = "halloween"`). Magic words also work typed into the hub Search
  box (phones). 7 new secret trophies (24 total). **Timmy Tooth** (`widget/pet.js`, loaded by v3.js and the dashboard): an
  optional cartoon tooth (Settings → Timmy Tooth: Everywhere / Dashboard only / Off, `sh_pref_pet`). Before adoption he perches
  on your name; tapping opens the intro; afterwards he lives in his house card (`#petHome`) and in each hub's bottom-left corner
  (hidden during mock exams). HP comes from `get_pet_days` merged with the device tally `sh_pet_log` (heal per right answer +
  streak bonus, decay per missed day, half-speed healing after 0 until 50); ailments drawn by HP: plaque, stains + gingivitis,
  caries, periodontitis, fracture, bandage. `prefSet` in v3.js now fires `sh:pref`. **His house** (`houseSvg`) is decorated
  by what you earn (`UPGRADES`: one item per handpiece tier from `sh_rank_tier`; a pennant per mastered hub and a roof crown
  from `sh_rank_flair`, which ranks.js and the dashboard write and announce with `sh:rank`) and by the holiday calendar.

- **2026-10-01 (MSK `ex-mets` fix, Claude Code, #51)** — Report #11: the bone-metastasis EXCEPT question keyed
  "Colon", but the notes list colon as a source ("BLT with a Kosher Pickle, plus colon"). The exception is now "Brain"
  (same position); explanation updated. Earlier `question_choices` rows for it refer to "Colon". Report resolved with a
  reply. **MSK Project: carry this into the split sources.**

- **2026-10-01 (suture-diagram questions, Claude Code)** — 14 perio picture questions (`q2-D01`-`q2-D14`): a question
  with `img:'<SUTURE_DIAGRAMS key>'` draws that diagram above the stem (`figHTML()`, in the bank card and the mock exam;
  "Diagram" chip; bank type filter "Suture diagrams"; arcade games skip them). Labels that would give the answer away
  carry `class="sd-hint"` and are hidden inside `.qcard-figure` (still shown in Review). `SUTURE_DEFS` (gradients) is
  now added to the page once in `boot()`. Bank 343 → 357. **Perio Project: carry these into the split sources.**

- **2026-10-01 (suture diagrams, Claude Code)** — Perio Review → Incisions, Flaps & Sutures gains **Suture diagrams**:
  illustrated inline-SVG figures (`SUTURE_DIAGRAMS`, shared gradients in `SUTURE_DEFS`, fixed illustration colours on a
  light plate, captioned): simple loop and figure-of-eight as interdental cross-sections, sling and criss-cross as
  occlusal views, mattress sutures as surface + section, continuous/locking on a ridge, periosteal anchorage in
  section, plus monofilament vs braided, because 5 of 14 midterm check-ins said the exam showed suture
  pictures. Drawn for the hub, not from the slides; Sam reviewed them before merge. **Perio Project: carry these into
  the split sources.**

- **2026-10-01 (fourth lessons refresh: exam formats, midterm settings out, Claude Code)** — From the perio midterm
  check-ins (n = 14): the exam used two-statement and "all EXCEPT / NOT" questions, suture pictures and staging details
  the class charts left out. **Perio**: 20 two-statement items (`fmt:'2stmt'`, `q1-S01`-`q4-S04`; choices always in
  the fixed order both true / both false / 1 true 2 false / 1 false 2 true, via `choiceOrder()` in the card and the
  mock exam; arcade games skip them) and 21 EXCEPT/NOT items (`fmt:'except'`, `q1-E01`-`q4-E06`, plus `q1-A02`); a
  **"Staging and grading: the full 2018 AAP/EFP tables"** review table (`AAP_STAGING`, `AAP_GRADING`) and 12 items with
  the new source `aap` ("2018 AAP/EFP tables", `q1-A01`-`q1-A08`, `q1-S06`-`q1-S09`); bank type filter gains
  "Two-statement" and "EXCEPT / NOT"; `.qcard-stem` keeps line breaks (`white-space:pre-line`). Bank 296 → 343.
  **Midterm-only settings removed** (Sam: the final is cumulative): "Not on midterm" chips, the bank's Midterm-scope
  option, the mock exam's scope toggle (always all 9 sessions), the Course Home midterm card/stat/milestone, the
  notes nav "Midterm" divider, arcade "Midterm · S1-4" scopes, the drill's midterm scope and the ribbon's midterm
  countdown; `MIDTERM_INFO` deleted. Kept: `MIDTERM_DATE` (SH_EXPORT exams, dashboard check-ins), the `mid:false`
  fields (now unused) and the notes' "(not on the midterm)" headings, which are narrated reading text (edit them only
  with new narration). Explanations: perio `q3-M01` (plaque index), `q4-M05` (motile bacteria); MSK `h-tu-mdm2`,
  `h-nut-vitA-epith`, `h-tu-gct-demo`, `h-tu-match`. **MSK**: 15 EXCEPT/NOT items (`ex-*`), bank 287 → 302. No reading
  text changed, so no narration regenerated. **Perio and MSK Projects: carry these into the split sources.**

- **2026-10-01 (recaps no longer time out + Perio Midterm recap, Claude Code)** — `get_hub_recap` timed out for perio
  (the API stops anon calls at 3 s): it counted each person's answers and days by re-scanning all pings/answers once per
  person, and ran the slow `anon_name()` (~15 ms) for all 118 people when the recap names 3. `migration_v30.sql` (applied
  via the connector) aggregates once and names only the people shown: same output, perio ~1.6 s, MSK 1.1 s. **Perio
  Midterm** recap published (`tools/publish-recap.js perio --exam 2026-10-01 --title "Perio Midterm"`, names on,
  featured question limited to midterm scope by passing a bank without `mid:false` items). `hub_recaps` holds one recap
  per hub, so publishing the perio final's recap will replace this one.

- **2026-10-01 (exam check-ins save on exam day, Claude Code, #46)** — `submit_exam_debrief` refused any exam dated
  today, but the dashboard opens check-ins on exam day (button from 8 am, perio midterm pop-up from 10 am), so the 2
  perio midterm check-ins sent that morning were dropped (answers not recoverable; the request logs hold no bodies).
  `migration_v29.sql` (applied via the connector) accepts exam day, never a future date. The dashboard's check-in
  pop-up now waits for the save and says "That didn't save" instead of always thanking.

- **2026-10-01 (nuke stays local on exam day, Claude Code)** — On the day of any of a hub's exams
  (`SH_EXPORT.exams`, local date), a tactical nuke plays only for the person who launched it: `launchNuke` in
  `widget/v3.js` skips the `nuke` broadcast and the receiver ignores one too (`isExamDay()`), so stale clients can't
  interrupt classmates either. The launch is still recorded (`record_nuke_launch`). No schema change.

- **2026-10-01 (select-all picks + shorter select-alls, Claude Code)** — **Select-all questions now record which options
  were ticked**: perio's `recordAnswer` passes the ticked indexes (practice and mock exam) as `detail.picks`, and
  `widget/v3.js` sends them in one call to `record_choices` (`migration_v28.sql`, applied via the connector), one
  `question_choices` row per option. For a multi item a row's `picks` = times that option was ticked (none before
  today). Perio's `SH_EXPORT` questions carry `correct` for multi items; `review/` shows a select-all's key and its
  most-ticked wrong option; `tools/lessons-join.py` lists ticks per option (+ key, - wrong). **Any hub with select-alls:
  pass the ticked array as the 4th argument of its answer call.** The three 7-option select-alls are now 5 options with
  3 correct (standing lesson): perio `q3-M01` (UniFe), `q2-P01` (augmentation flap), `q1-M03` (Phase I); ids kept, so
  their `question_stats` mix both versions from today. `sw.js` → `sh-v10`. **Perio Project: carry these into the split
  sources.**

- **2026-10-01 (third lessons refresh, Claude Code)** — Midterm-morning refresh. Perio `q3-P02` (report #10): the Patient
  Box now lists the radiographs ("Deep, narrow vertical bone defects on those teeth", as the notes describe the case) and
  the explanation walks stage, extent and grade from the box. Explanations now name the tempting wrong option on perio
  `q4-L11` (tooth extruding after losing its antagonist), `q1-M02`, `q4-M05`, `q2-P01` (split-thickness) and MSK
  `h-ai-mikulicz` (sicca), `qz-rickets` (unmineralized osteoid goes up). No reading text changed, so no narration
  regenerated. `LESSONS.md` refreshed. **Perio and MSK Projects: carry these into the split sources.**

- **2026-10-01 (lessons-audit skill, Claude Code)** — `/lessons-audit` (`.claude/skills/lessons-audit/SKILL.md`) runs the
  lessons refresh on demand in a Claude Code session: all data plus "since last time", a check of whether the last
  refresh's fixes worked, reading every hard question, safe explanation edits, `LESSONS.md`, a draft PR and draft replies
  to reports. Helpers: `tools/dump-banks.js <dir>` (each live hub's QUESTIONS/LECTURES as JSON, the CI lint's hook) and
  `tools/lessons-join.py` (accuracy by lecture/type/source and the hardest items with their favourite wrong answer).
  The audit also reads **check-ins against each person's study time**, and when a hub's last exam has passed it writes
  that hub's full retrospective and **publishes its recap to the dashboard** without asking (Sam, 2026-10-01) via
  `tools/publish-recap.js <hub> --bank <file> [--dry-run]` (same snapshot as `review/` → Recap; needs `SB_KEY` +
  `ADMIN_SECRET`; exam date from `index.html`, since `get_hub_recap` can time out without one). **CI lint**: a matching
  item that repeats an answer now fails (`SAME_ANSWER_OK` lists perio `q4-L27`, which perio grades by text), and 6+
  step orderings / 7+ option select-alls are listed as a heads-up. No site change.

- **2026-09-30 (bronze without patina, Claude Code)** — The green patina specks are gone from the Bronze handpiece
  medallion too (`filters()` in `widget/ranks.js`); Sam found them ugly. Accent tiles were already clean.

- **2026-09-30 (accent textures fixed + Stone/Antique, Claude Code)** — The metal accents are now **pre-rendered PNGs**
  (`assets/tex/<key>.png`, made by `tools/make-accent-tex.js` from `shRanks.accentSvg()`; bump `TEX_V` in
  `widget/ranks.js` when you regenerate): the SVG-filter data URIs didn't show up for students (Safari/phones). Bronze
  lost its green patina specks; new **Stone** (everyone) and **Antique** accents with quieter grain than the medallions.
  The texture also covers the ribbon's exam countdown pill, and the **dashboard** now applies the accent to its primary
  buttons (it never applied it before).

- **2026-09-30 (luck moves to the dashboard + metal accents, Claude Code)** — The hubs' exam "luck wall" pop-up
  (`widget/eggs.js`) is gone (#35: it got in the way of last-minute studying). The dashboard's next-exam card now has a
  **Send luck** row the day before and the morning (before 2 pm) of the exam: one per person per exam, with the class
  count and the latest names (`exam_luck`, `get_exam_luck`, `send_exam_luck`; `migration_v27.sql`, applied via the
  connector). **Unlocked accents are now metals**: `widget/ranks.js` `accentTex(key)` draws the medallions' own
  gradient + texture filter on a stretchable SVG tile, and `applyAccent` sets `data-sh-accent` and `--sh-tex` on
  `<html>`; `widget/v3.css` paints it on primary buttons, switches, multi-answer boxes, untagged progress bars and the
  drill badge (text/borders keep the flat `--accent`). Settings swatches (hub widget and dashboard) show the metal.
  **A new hub gets the textures if its primary buttons use `.btn.primary` / `.qs-btn.primary` and its bars `.bar i`.**

- **2026-09-30 (second lessons refresh, Claude Code)** — `LESSONS.md` refreshed with all data to date (last refresh's
  fixes checked: `q2-03` 30% → 61%, `q4-L27` 20% → 44%, perio under-5-minute visits 40% → 17% on midterm eve). New
  standing lesson: ordering questions over 4-5 steps and select-all questions with many options barely work.
  Explanations now name the favourite wrong answer on MSK `h-dr-hypoCa` (hyporeflexia), `h-tu-gct-arthritis`
  (osteochondroma), `h-ai-sle-ab` (anti-Ro/La) and perio `q3-M01` (UniFe inputs). No reading text changed, so no
  narration regenerated. **Perio and MSK Projects: carry these into the split sources.**

- **2026-09-29 (first lessons refresh, Claude Code)** — `LESSONS.md` refreshed from all data since 09-25 (Live signals
  written; new lessons on duplicate matching answers, explanations that name the favourite wrong answer, exam harder
  than hub + Patient Box questions). Perio: matching questions now grade by answer text in practice and mock
  (`q4-L27` listed "4-6 weeks" twice, so the other copy was marked wrong); `q2-03` and `q4-15` explanations cover the
  most-picked wrong answer. MSK: `sl-calcitriol` explanation covers cholecalciferol; a wrong ordering question now
  says "Not quite: k of n in the right spot". Perio Course Home gets a **quick-start row** at the very top (`.quick-start`:
  Practice questions (midterm scope until the midterm, with an untried count), Daily drill, Lecture notes), because
  23 of 58 visitors left within 5 minutes of landing there; clicks show as `practice=`, `sh-drill=quick`. Widget Search
  stays (Sam, 2026-09-29) though nobody has opened it yet. No reading text changed, so no narration regenerated.
  **Perio and MSK Projects: carry these into the split sources, or the next single-file build reverts them.**

- **2026-09-30 (one inbox, Claude Code)** — The Inbox is now the same on every hub and the dashboard: notices are no
  longer filtered by hub (`site_notices.hub` only labels which hub a notice is about), and pop-ups go out on whichever
  page someone opens first. Read state was already shared (server for replies, `sh_notice_seen` for notices).
  An **Inbox button now sits in each hub's top bar** beside the name (`.sh-ribbon-inbox`, added by `widget/v3.js`
  before `#themeBtn`), so it's reachable from every page. **Text size fix:** the size setting zooms `<html>`, and
  `vh`/`vw` inside a zoomed page overshoot the screen, so the inbox now sizes inside its fixed `inset:0` layer and the
  pop-up measures the real viewport (`fitViewport`); only the pop-up's message scrolls, so its buttons stay visible.
  `sw.js` → `sh-v9`. **Any new fixed overlay: don't size it with `vh`/`vw`.**

- **2026-09-29 (student inbox, Claude Code)** — Replies to your reports/suggestions (90 days) and notices to everyone
  (60 days) now stay in an **Inbox**: an item in the hub widget menu (unread count; a dot on the desktop launcher and the
  phone More tab) and an inbox button in the dashboard top bar (`[data-sh-inbox]` opens it, `.sh-inbox-badge` shows
  unread). Opening it marks everything read. The one-time pop-up moved from top-center to the **bottom-right** (above
  the phone bar). `get_my_inbox` (`migration_v26.sql`, applied via the connector). Admin Inbox: "Tell everyone" now has
  its own title + message box, started from the reply so it can be reworded for the class. `sw.js` → `sh-v8`.

- **2026-09-29 (replies to reports + notices to everyone, Claude Code, #29)** — Reports and suggestions now store the
  sender's `visitor_id`, and resolving one can carry a `reply`. `widget/replies.js` (loaded by v3.js and the dashboard)
  shows it to the sender once on their next visit (`get_my_replies`, `mark_reply_seen`). **Always write the reply when
  resolving** (for a question report: what was wrong and what changed). Admin Inbox: reply box, "Resolve & notify", and
  "Tell everyone", which posts a **notice** every visitor sees once (`site_notices`, `get_notices`, `admin_post_notice`;
  hub null = every page, 14 days; seen per device in `sh_notice_seen`). The student insert policies now refuse a
  reply/resolved row. Rows from before today have no sender, so only a notice reaches them. `migration_v25.sql` (applied
  via the connector). First notice: the `cw-osteosarcoma` fix (report #7; its stem now says "Malignant", Osteoma →
  Ewing sarcoma). `sw.js` → `sh-v7`. **MSK Project: carry the `cw-osteosarcoma` change into the split sources.**

- **2026-09-29 (daily lessons refresh, Claude Code)** — New routine "Daily lessons refresh" (fresh cloud session
  each day) runs `tools/lessons-refresh.md`: queries in `tools/lessons-daily.sql` (every report, suggestion, check-in,
  survey answer and zero-result search since the last run, use per hub, hardest/easiest questions, popular wrong
  answers, mocks, drill), rewrites `LESSONS.md`'s new "Live signals" section and "Last refreshed" date, and opens a
  draft PR with small data-backed fixes to live hubs (bigger ideas go to Sam in the PR). New hubs: refresh first if
  the date isn't today. No site change by itself.

- **2026-09-29 (automatic archiving, Claude Code)** — The dashboard (`index.html`) archives a hub by itself at 10 pm on
  the day of its last exam (`ARCHIVE_HOUR`) and removes the archived card 10 days later (`CARD_DAYS`; `hideCardOn`
  overrides; GI Exam 2's goes 2026-10-06). "Check in" buttons show from 8 am on exam day (`CHECKIN_HOUR`); the pop-up
  goes out from 10 pm, or an exam's `promptHour` (perio midterm: 10 am), and still reaches first visits up to
  `DEBRIEF_DAYS` (60) after. `widget/v3.js` shows an "This hub is archived" notice once per visit on a hub page opened
  after that time (from `SH_EXPORT.exams`). Retrospective and removing the hub folder are still manual.

- **2026-09-29 (MSK exam review set, Claude Code)** — The 23 PollEv exam-review questions (Sam: the professor said six
  are verbatim on Exam 3 and the rest very similar) added to `hubs/msk-exam3` as `rv-*` with a new source `review`
  ("Exam review (PollEv)"), stems/choices as given (typos fixed only). Question Bank has an "Exam review set" callout
  with a one-tap filter; the Daily Drill counts them as high-yield (`DRILL_HY.review`). They overlap older `sl-*` Slido
  items on purpose (the wording matters). Bank 264 → 287. No reading text changed, so no narration regenerated.
  **MSK Project: carry these into the split sources, or the next single-file build drops them.**

- **2026-09-29 (Anki deck vetting, Claude Code)** — Vetted the class Anki decks (Drive: 7 "MSK & GI Exam 3" decks + last
  year's Exam 3 practice deck; the D2 Perio Midterm and Practice Questions decks) card by card against each bank and the
  lecture notes; only real gaps were added, nothing imported wholesale. MSK +5 (`h-jt-oa-case`, `h-nut-vitA-epith`,
  `h-nut-iron-us`, `h-ai-sjogren-lymph`, `h-dr-teri-limit`), perio +2 (`q1-31` Stage 3 vs 4, `q1-32` grading vs staging).
  PerioChip corrected from 1.5 mg to **2.5 mg** chlorhexidine (review table, `q8-11`, arcade clue). The D2 Perio Final
  Exam deck (S5-S9) is on hold until those sessions are taught. No reading text changed, so no narration regenerated.
  **MSK and Perio Projects: carry these into the split sources, or the next single-file build reverts them.**

- **2026-09-29 (retrospectives + new tracking, Claude Code)** — New standing rule: archiving a hub includes a
  retrospective from all its data; `LESSONS.md` (standing lessons + a GI Exam 2 retro written from its data) and
  `tools/retro.sql` (the queries). Two new data sources (`migration_v23.sql`, applied via the connector):
  **exam check-ins** (how ready they felt, how it went, hub vs exam, what the hub missed, with a line saying answers
  go to the AI that builds the hubs), stored in `exam_debriefs` via `submit_exam_debrief`. Pop-up once on a person's
  first dashboard visit after an exam they studied for, however late (`sh_debrief_<hub>_<date>` = shown; replaces that
  visit's survey). Every hub card with an exam in the last 60 days (`DEBRIEF_DAYS`) has a **Check in** button, and
  people can send several (up to 10 per exam, `migration_v24.sql`, applied). **Archived hubs** now go into
  `ARCHIVED_HUBS` in `index.html` (move the `HUBS` entry, keep `exams` + `stateKey`): a greyed "Archived" card with
  the check-in button, shown for 60 days after its last exam. GI Exam 2 is the first one. **Search terms** — the widget's Search sends the term (lowercased, 3-60 chars, 1.5 s
  after typing stops, once per term per page load) and its result count to `record_search` → `search_terms`.
  Admin page Surveys tab shows both (`get_exam_debriefs`, `get_search_terms`, admin only).

- **2026-09-29 (perio: ordering-question feedback + q4-49, Claude Code)** — From student report #6. Finished sequence
  questions never showed right/wrong: `.qcard-seq-steps .qcard-choice[data-picked]` out-ranked the `data-state` colours.
  Now the steps re-sort into the tapped order, turn green/red, wrong ones say "Belongs in step N", and a verdict line
  ("Correct" / "Not quite: k of n in the right spot") sits under them. `q4-49` (a trivial 4-step disclosing-tablet order)
  is now an MCQ on why the rinse is brief (same id, so its old `question_stats` rows were a sequence). **Perio Project:
  carry both into the split sources, or the next single-file build reverts them.**

- **2026-09-29 (MSK mock exam blueprint, Claude Code, #21)** — `MOCK_BLUEPRINT` in `hubs/msk-exam3` now uses the official
  Exam 3 question counts per lecture: L19 4, L20 4, L21 6, L22 4, L23 4, L24 5, L25 4, L26 5, L27 4 (40). Intro text updated.
  **MSK Project: carry this into the split sources, or the next single-file build reverts it.**

- **2026-09-29 (answer choices that gave the answer away, Claude Code)** — From a student report on perio `q2-02` (wrong
  choices were labeled "(… monofilament)" while the stem asked for the braided suture). Audited all 499 MCQ/multi items in
  both hubs for the same kind of giveaway: labels on choices that rule themselves out, stem wording echoed only by the
  answer, and wrong choices nobody would pick. Fixed 16 perio items (`q1-12`, `q1-14`, `q1-19` (stem reworded), `q1-27`,
  `q2-02`, `q2-21`, `q2-22`, `q7-01`, `q7-04`, `q7-06`, `q7-09`, `q8-01`, `q8-07`, `q8-10`, `q9-02`, `q9-04`) and 8 MSK
  items (`dq-ckd`, `h-jt-gout-chronic`, `h-ca-stickler`, `h-bo-oi-ar`, `h-bd-ccd`, `h-tu-alveolar`, `h-he-paget-tx`,
  `h-jt-reactive-time`). Where a label was removed, the explanation now says it instead. Answer positions are unchanged;
  `question_choices` rows recorded before today for these ids refer to the old wording. **Perio and MSK Projects: carry
  these into the split sources, or the next single-file build reverts them.**

- **2026-09-28 (Daily Drill, Claude Code)** — From a survey answer ("a daily drill of questions I missed + high-yield so
  they stay fresh"); the old "Due today" list in Weak Spots had 1 click per hub. `widget/drill.js` (loaded by v3.js) picks
  10 questions a day per hub, frozen for the day in `sh_drill_<hub>`: spaced-review items due (`sh_srs_<hub>`, up to 6),
  older misses (latest try wrong, up to 8 with those), then high-yield ones from lectures you've studied (lowest class
  accuracy in `question_stats` with 5+ attempts, plus the hub's own flag), max 3 per lecture; shortfalls filled from the
  rest. **Spaced review gaps shortened** (hubs are live ~a week before the exam): right answers come back after 1, 2, 4,
  then 7 days (was 1/3/7/14/30), never later than the day before the hub's next exam (`SH_EXPORT.exams`), and only the
  first right answer of a day moves a question along (`t` = last day); a one-time pass (`sh_srs_<hub>_v` = 2) pulls in
  reviews scheduled under the old gaps. One question at a time in a full-screen sheet with a reason tag ("You missed this last time", "High-yield: the class
  gets this right 41%..."), a done screen with results, **10 more**, and a drill streak (`sh_drill_days`, any hub). Hubs
  provide `window.SH_DRILL = { pool(), render(el, qid), scope }` (just before `SH_EXPORT`); answers go through the hub's own
  handler, so class stats, SRS, XP and Weak Spots update as usual. Entry points: a Drill tab in the phone bar (badge = due
  count or progress), a desktop chip beside the launcher (hidden once done), `[data-sh-drill]` buttons (perio Course Home
  and both Weak Spots tabs, where it replaces "Due today"), and `hubs/<id>/#drill`, which the dashboard's new drill row on
  each hub card and the hero's "Daily drill" button link to. Time in it logs as `drill/daily`. Perio stays in midterm scope
  until Oct 1 and flags `exam-review` questions; MSK flags `quiz`/`lecture-quiz`/`slido`. Perio's `markExplain` now reveals
  the answered card's own explanation (the same question can be on screen twice). `sw.js` → `sh-v6`. No schema change.
  **A new hub gets the drill by defining `SH_DRILL`. Perio and MSK Projects: carry the `SH_DRILL` block, the Daily drill
  buttons, the `bolt` icon (MSK) and `explainOf` (perio) into the split sources, or the next single-file build drops them.**

- **2026-09-28 (perio: two student reports fixed, Claude Code, #15)** — Self-graded cards (recall questions via
  `qCardHTML`, and Active Recall) now keep the tapped grade button highlighted (`data-picked`, `--good-soft`/`--bad-soft`),
  dim the other and add a "Saved as right / missed" note (`markGraded()`). The grade was always saved, but the buttons
  looked unchanged, so it read as broken (report #3). `q3-47`'s explanation now states the 10% "resistant" figure and
  separates it from the slide's 10-15% / 20-25% numbers; unused choice "About 35%" → "About 25%" (report #4). Both reports
  marked resolved. **Perio Project: carry these into the split sources, or the next single-file build reverts them.**

- **2026-09-28 (hub recap slideshow, Claude Code)** — Published recaps play on the dashboard in a **Hub recaps** section
  (after Hubs; hidden until one is published): image on the left, title/summary, prev/next, Save image, and a list whose
  active item's bar times the 8 s autoplay (pauses on hover/focus/hidden tab; swipe and arrow keys; slide + fade
  transition, opacity-only under reduced motion). The Recap tab's **Publish to dashboard** stores a snapshot
  (`shRecap.snapshot`: only the fields `draw()` reads, names dropped when unticked) via `admin_publish_recap`;
  `admin_unpublish_recap` removes it; the dashboard reads `get_published_recaps()` (public) and draws each with the same
  renderer, lazily loading it plus Fraunces/Work Sans only when there's something to show. `migration_v22.sql` (table
  `hub_recaps`, applied via the connector). **`review/recap.js` moved to `widget/recap.js`.** GI Exam 2 published
  2026-09-28 (names on).

- **2026-09-28 (recap awards + saved mock scores, Claude Code)** — The Recap image gains an **Awards** panel: Question
  machine (most answers), Unbreakable (longest correct streak), Bookworm (most time in lecture notes: sections ending in
  `notes`/`lecture-notes`), Arcade champion (most time in `arcade/*`) and Mock exam ace (best score on a 20+ question mock,
  up to the exam day). Each only shows when the data exists; the image height grows with the number of awards
  (~1,970 px with all five). New `mock_scores` table + public `record_mock_score` (validated, one per person per hub per
  minute), called from `widget/ranks.js` on `sh:mock-done`, so mock scores are saved from 2026-09-28 on (none before).
  `migration_v21.sql` (applied via the connector) also replaces `get_hub_recap` to return `awards` and `mocks_taken`.

Older entries are in [`DEPLOY_HISTORY.md`](./DEPLOY_HISTORY.md) (grep it for a feature, file or date; don't read
it whole). Move entries there once they are about two weeks old, so this file stays short: every session loads it.

This list is intentionally short — it's an orientation aid, not a full
changelog (that's the Supabase `changelog` table / dashboard "What's New"
box) or a per-hub history (that's each hub's own manifest doc, kept in its
Claude Project).

## Why this file exists

Sam runs one Claude Project per hub plus a separate "hub index" Project for
cross-hub/UI work. A change made in the index Project (e.g. adding the Active
Recall tab and the shared widget) can silently collide with a change made the
same week in a single hub's own Project (e.g. mining a new lecture transcript
into Hepatobiliary), because neither session has any way to know the other
ran. There's no mechanism to make Claude Projects "talk to each other" — the
fix is procedural: treat this repo as the single source of truth, always
re-pull before you push, and put anything cross-hub here or in `widget/`
instead of copy-pasted into individual hubs.
