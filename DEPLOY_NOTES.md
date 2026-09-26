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

## Shared infrastructure (touch once, not per-hub)

- **`widget/v3.js` + `widget/v3.css`** (+ `widget/eggs.js`, `widget/clicks.js` and `widget/ranks.js`, which v3.js loads itself) — loaded by every hub (`fixed-pros`,
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

## Recent major changes (newest first — add a line when you ship something)

- **2026-09-26 (hub recap, dashboard rank + settings, Claude Code)** — **Recap tab** on `review/`: pick a hub (live or
  archived) and it draws a 1080x1640 shareable image (`review/recap.js`, canvas; Download PNG, or Share on phones) with
  hours studied, classmates, answers, class accuracy, hours per day up to the exam, the day before the exam, peak hour,
  people studying after midnight, regulars (3+ days), the hardest multiple-choice question with its answer, and a hall of
  fame (most answers, longest correct streak). Data from `get_hub_recap(p_secret, p_hub, p_exam)` (`migration_v20.sql`,
  admin-gated via `sh_admin_ok`, applied via the connector). Pings before 2026-09-25 count only the first 3 h of each
  visit (no idle rule back then). Question text: `ARCHIVE_BANK` → `question-banks/*.json` for archived hubs, `SH_EXPORT`
  for live ones. **Dashboard**: a "your rank" card under the greeting (handpiece, XP, animated bar to the next level,
  `get_rank_profile`); a Settings sheet (gear in the top bar) that edits the same localStorage keys as the hub widget's
  Settings (theme, font, size, accent, music, surprises, nuke alerts; font/size also apply on the dashboard). "Add exams
  to my calendar" removed (everyone has them already). `widget/ranks.js` exposes `ACCENTS` and re-applies the chosen
  accent once the rank loads.
- **2026-09-26 (easier name change, Claude Code)** — The hub top-bar name badge now always shows (your custom name, or
  the random class name like "Gleaming Molar") with a pencil; tapping it opens a small editor (`window.shEditName()` in
  `widget/v3.js`) that explains where the name shows, saves on Enter, and offers "Go back to a random name"
  (`clear_display_name`, `migration_v19.sql`, applied via the connector). The rank card in Stats has a "Shown as NAME ·
  change" link and the dashboard greeting a "Pick your name / Change name" button. One save path (`saveName`/`resetName`)
  keeps the Settings and Stats name boxes in sync and fires `sh:name`. Before this only 1 of 77 visitors had set a name.
- **2026-09-26 (home-screen icon, Claude Code)** — App icons are now the Gold handpiece medallion (rendered from
  `widget/ranks.js`) on a solid dark ground: `assets/apple-touch-icon.png` (180), `icon-192/512.png`, `icon-maskable-512.png`
  (extra safe-zone margin), `favicon-32/64.png`. All opaque; the old ones had transparent corners, and iPhones were
  showing a generic "S" tile. Every page links them with `?v=2` (bump it when the art changes, phones cache icons hard) and
  sets `apple-mobile-web-app-title` = "Study Hubs". `assets/icon.svg` (the old bars) is no longer linked.
- **2026-09-25 (nuke countdown key fix, Claude Code, #5)** — `runNukeCountdownKeyCanvas` in `widget/v3.js` now keys each
  frame against its own background (sampled at the crop's four corners; falls back to the fixed green if they disagree)
  instead of one fixed green. The countdown clip whites out on its own from ~12.25 s, so the fixed key left a pale green
  square around the icon until the 13 s blast; now the icon swells into a soft white disc as the clip whitens. Timing
  and `nuke-countdown.mp3` unchanged (its build-up peaks ~12-12.5 s, which is why the blast stays at 13 s).
- **2026-09-26 (perio: midterm format, Perio Project/Cowork)** — From Dr. Abou-Arraj's midterm email (Oct 1,
  10:00 am, rooms 220/222, ~40 questions: mostly MCQ, a few Patient Box cases, a few multiple-answer with
  partial credit, matching, no essays). `hubs/perio` gains a `pbox` question field (case table rendered
  above the stem) and a `multi` type (`correct:[...]`, Canvas-style partial credit: +1/n per right pick,
  −1/n per wrong pick, floor 0). 29 new items (13 Patient Box, 19 multiple-answer, some overlap). Mock Exam
  gets a 40-question exam-format option (5 Patient Box, 5 multi, 3 matching, rest MCQ, spread across
  sessions); matching is scored per pair; `sh:mock-done` counts full-credit items. Course Home has a
  "Midterm day" card. Arcade bank games skip `pbox` items. Three-way merged onto the 28 commits since
  6f97c09 (explanations, Report button, CLASS_ROW, choice tracking); CI smoke + lint pass locally.
  No reading text changed, so no narration was regenerated.

- **2026-09-25 (rank order + phone panel, Claude Code)** — Stone is now the first rank (0 XP) and Antique the second
  (300 XP): only the order of the first two `TIERS` entries in `widget/ranks.js` changed; server tier numbers are the same.
  Dashboard ranks panel fits phones (grid columns `minmax(0,1fr)`).
- **2026-09-25 (rank numerals, Claude Code)** — Every handpiece icon shows its level: large medallions get an engraved
  I/II/III plaque on the rim (replacing the pips), small ones a text tag in the corner (`shRanks.mini(tier, level)`,
  `.sh-rank-lv`), and the name badge appends the numeral. `migration_v18.sql` (applied via the connector) adds `level`
  to `get_leaderboard`, `get_correct_streak_stats` and `get_arcade_leaderboard`.
- **2026-09-25 (easter-egg clues, Claude Code)** — Hints for the hidden extras live in the trophy case: three new secret
  trophies (`konami` Cheat Code, `floss` Floss Boss, `prof` Office Hours; `migration_v17.sql` adds them to
  `record_achievement`'s whitelist, applied via the connector), every secret `TROPHIES` entry in `widget/ranks.js` has a
  `clue`, trophies are buttons (tap to read; a secret shows its clue), and a "Psst" line under the grid shows a random
  clue for a secret you haven't found. 17 trophies total. The Surprises setting points at the clues.
- **2026-09-25 (idle rule for study time, Claude Code)** — `widget/v3.js` activity tracking now stops banking time after
  15 minutes without input (pointerdown/keydown/wheel/touchstart/scroll/mousemove; `IDLE_MS`), unless
  `shTTS.listening()` is true (narration or browser TTS playing). Before this, any visible tab counted, so time from a hub
  left open on a desk inflated `activity_pings`. Minutes before 2026-09-25 were recorded under the old rule; compare trends
  across that date with care.
- **2026-09-25 (rank scale, nuke audio, card edge, Claude Code)** — **Ranks rescaled** (`migration_v16.sql`, applied via
  the connector): tier floors 0 / 300 / 1,500 / 5,000 / 12,000 / 25,000 / 50,000, each split into levels I-III
  (`sh_step`, `sh_step_floor`; Dark Matter I-III at 50k/75k/100k). v15's scale let a daily studier pass Dark Matter in
  ~5 weeks. `get_rank_profile` adds `level`/`step`/`step_at` (next_at is now the next level); `get_rank_board` adds
  `level`. The medallions show 1-3 pips on the rim; a level-up is a toast, a new tier keeps the full celebration.
  **Nuke countdown audio**: the countdown video's soundtrack only existed in its muted .mp4 (the .webm Chrome plays has
  no audio), so it's now `widget/sfx/nuke-countdown.mp3` (first 13 s of that track), played by `shNukeSfx` with the
  countdown and stopped at the blast. **Dashboard hub cards**: the colour stripe is now a full-card `::before` with
  `border-radius:inherit` painting only the left 7px, so it follows the card's corners.
- **2026-09-25 (handpiece ranks, trophies, link devices, Claude Code)** — `widget/ranks.js` (loaded by v3.js and the
  dashboard) draws seven tiers of handpiece medallions in inline SVG (Antique, Stone, Bronze, Silver, Gold, Diamond,
  Dark Matter; textures are SVG filters, the glint/sparkles animate only at large sizes) and mounts the rank card,
  per-hub mastery bar (Bronze 50 / Silver 75 / Gold 90 / Crown 100% of the bank right on the latest try), a 14-trophy
  case (6 secret ones read "???" until earned), unlockable accent colours in Settings (`sh_pref_accent`; injects
  `--accent/--accent-ink/--accent-soft` for light + dark) and **Link my devices** into the hub widget. XP is computed
  on the server from `personal_answers` (`sh_visitor_xp`, private): 10 first-time right, 2 repeat right, 1 miss, 600/day
  cap on answer XP, +20 per study day; tiers at 150/600/1500/3000/6000/12000 (`sh_tier`). Public RPCs:
  `get_rank_profile`, `get_rank_board`, `get_hub_mastery`, `record_achievement` (whitelisted kinds: boss, owl,
  rootcanal, mock90, mastery-*), `create_link_code`/`redeem_link_code` (6-char, 10 min, 10 tries/hour; redeeming moves
  the device's rows onto the code maker's id, `visitor_links` records it). `get_leaderboard`,
  `get_correct_streak_stats` and `get_arcade_leaderboard` gained a `tier` column (dropped + recreated). Hubs fire
  `sh:mock-done {correct,total}` when a mock is submitted. Dashboard: "Handpiece ranks" panel (top 10 + ladder) and tier
  icons on every board. `migration_v15.sql` **applied 2026-09-25 via the connector**. First dashboard survey
  ("Help shape the hubs") published live the same day.
- **2026-09-25 (Atlas retired; clicks + surveys, Claude Code)** — **Perio Atlas mode removed** at Sam's request (the
  diagrams were inaccurate; it had ~2 minutes of use from 5 people in two weeks). Removed from `hubs/perio/index.html`
  (tab, panel, `ATLAS_VIEWS`, `ATLAS_RENDERERS`, CSS) and the dashboard card. **Perio Project: drop Atlas from the split
  sources too, or the next single-file build brings it back.** Click analytics: `widget/clicks.js` (loaded by v3.js and
  the dashboard) batches clicks as `{section, target, count}` into `record_clicks` → `ui_clicks`/`ui_click_reach`;
  targets are named from `id`, the first `data-*` attribute (question-level ones skipped, numbers collapsed) or the
  label, and answer choices are grouped by class. Dashboard survey card: `get_active_survey`/`submit_survey`, one survey
  live at a time, shown once per visitor (answer or "No thanks" both count, plus `sh_survey_done_<id>` locally).
  Admin page gained **Clicks** and **Surveys** tabs (results, on/off, publish form). `migration_v14.sql` **applied
  2026-09-25 via the connector**; its admin functions call `sh_admin_ok()`, which copies the secret check from
  `get_nuke_summary` at migration time, so no secret is in the repo.
- **2026-09-25 (audit batch 2 + easter eggs, Claude Code)** — Widget: new launcher/menu (desktop) and a 3-item bottom
  bar with a "More" sheet (phones), redrawn icons, **full-content search** over each hub's `SH_EXPORT.sections` (notes
  paragraphs, review rows, hints, cram lines) that jumps to the spot via the hub's `window.SH_GOTO(go)`; a **Report**
  button on every question (`window.shOpenFlag(qid)`); `record_choice` stores which option was picked
  (`question_choices`, migration_v12, applied) and `review/` shows question text + the most-picked wrong answer (it
  reads each hub's `SH_EXPORT` through a hidden `?sh_export=1` iframe). Listen player: seek, ±15 s, speed, resume,
  lock-screen controls. Spaced review (`sh_srs_<hub>`, `window.shSrsDue()`) feeds a "due today" drill in both hubs'
  Weak Spots tab (new in MSK). Dashboard "Add exams to my calendar" (.ics). PWA: `manifest.webmanifest`, `sw.js`
  (network-first; bump `VERSION` when you change what it precaches), icons/OG images in `assets/`. 136 explanations
  added and distractors rebalanced in both banks. CI: `.github/workflows/check.yml`. `supabase/schema.sql` is a full
  schema snapshot (admin secret as a `<ADMIN_SECRET>` placeholder) — refresh it with every migration.
  **Easter eggs** live in `widget/eggs.js` (loaded by v3.js, which hands it `window.shEggHooks`): Golden Probe (one
  taught question per hub per Central-time day; `claim_golden_probe`/`get_golden_today`, shown on the dashboard),
  Tooth Fairy (`record_fairy`/`get_fairy_board`, board in the Stats panel) — both in `migration_v13.sql`, **applied
  2026-09-25 via the connector**; Plaque Boss (5+ online, shared HP over the `presence:<hub>` channel's `egg`
  broadcast), exam luck wall (evening before / morning of each date in `SH_EXPORT.exams`), professor quotes (tap a
  name 5x; `SH_EXPORT.lectures[].who` + `SH_EXPORT.hints`), Night Owl, Through the Root Canal, Konami 8-bit mode (phones: swipe ↑↑↓↓←→←→ then tap twice),
  "floss". Off via Settings → Surprises (`sh_pref_eggs`) and never during a mock exam (section matching `mock`). A new
  hub gets them for free if its `SH_EXPORT` carries `who`/`status` on lectures, `hints` and `exams`.
- **2026-09-25 (exam-week fixes, Claude Code)** — Dashboard `HUBS` entries now take `exams:[{name,label,date,code}]`
  (several per hub; perio has midterm + final) instead of `examDate`/`examName`; the hero lists every exam in the next
  14 days and has a real "no exams" state. Perio accuracy on the dashboard uses each question's latest try (perio's
  `totalCorrect` counts unique questions). supabase-js is **self-hosted and pinned** at
  `widget/vendor/supabase-2.117.2.js`, loaded with `defer` everywhere (no jsdelivr dependency); hubs call `boot()`
  directly instead of waiting for DOMContentLoaded, and the class-stats wiring runs on DOMContentLoaded. The widget no
  longer returns early without Supabase (search, settings, mind maps keep working) and exposes `window.shSupabase`,
  which the arcades reuse. Light/dark is one shared key, `sh_theme` (old per-page keys still read). Phones: mode tabs
  get their own labeled row in both hubs; MSK lecture chips wrap. Perio's class % now sits inside the explanation
  (hidden until answered). MSK mock exam is exam-style (pick all, submit, review; `STATE.mock.picks/order/submitted`).
  The dashboard no longer groups hubs by term (`TERMS` and each class's `term` field are gone); every class with a
  live hub shows in one grid, since old exams get archived.
- **2026-09-25** — Added `CLAUDE.md` (imports this file) so Claude Code sessions
  start with the repo rules; Claude Code deploys go through branches + PRs.
  Kokoro model re-hosted as release `kokoro-model-v1.0`. No site changes.
- **2026-09-25 (perio: midterm date + Session 4 lectured)** — Midterm set to **Thu Oct 1** (sessions 1-4):
  `MIDTERM_DATE = '2026-10-01'` in the perio hub (ribbon countdown, course home, course map) and
  `examDate:"2026-10-01"` on the dashboard's perio HUBS entry (it now leads the next-exam hero, a day
  before MSK Exam 3). Session 4 (Phase I) flipped from `preview` to `taught` from the class recording:
  both reading levels rewritten, 42 lecture questions (`q4-L01`-`q4-L42`), 17 verbatim exam hints, 6
  new review tables (Glickman furcations, CAL/Salud trap, tissue modifiers, prophy vs D4346 vs SRP vs
  maintenance vs debridement, healing timeline, radiograph reads + SRP limits), new cram sheet and mind
  map, 8 arcade terms and 3 Quadrants groups. Both `phase1-therapy` narration files regenerated.
  Midterm scope from Dr. Kaur's email (no instruments/ultrasonics/polishing; slides up to failure of
  therapy): 31 S4 questions carry `mid:false` (a "Not on midterm" chip; excluded from the midterm mock
  exam and from the new "Midterm scope" question-bank filter), and the matching notes sections, review
  tables, cram lines, mind-map branch and Atlas diagram are labeled.

- **2026-09-24 (perio revamp + Pocket Arcade)** — `hubs/perio/index.html` rebuilt (Perio Project) to
  match the revamped site: compact one-row ribbon (back, title, icon mode pills, countdown, progress,
  theme toggle), inline-SVG icon set (no emoji), Instrument Serif/Sans + IBM Plex Mono. Modes are now
  **Compendium · Review · Atlas · Arcade**; the Understory game + cutscenes were retired at Sam's
  request (replaced by the Arcade). Reference tables moved to a Review mode (data-driven `REF_SECTIONS`,
  search + hide-answers). New content: Session 4 (Phase I, Dr. Kaur slide deck, status `preview`) and
  the Session 3 in-class case review; bank 150 → 216. **Pocket Arcade**: nine new games (flappy,
  crusher, probe, quadrants, perdle, planer, smile, sweeper, cross) posting to `arcade_scores` with
  `p_hub='perio'`; `migration_v11.sql` (whitelists those ids) **was applied 2026-09-24 via the
  connector**. Bank-based games call `recordAnswer`, so they fire `perio:answered`. The state key and
  `answered/totalSeen/activeDates` shape are unchanged (dashboard `readProgress` still works); new
  `STATE.ui`/`STATE.arcade` sub-objects. The hub is now built from split sources in the Perio Project
  session; the deployed `index.html` is the single-file build. Lecture Notes now have an **As taught / Plain English** toggle (`READINGS_PLAIN`, `STATE.ui.level`); each level has
  its own narration file, `audio/<id>-full.mp3` and `audio/<id>-plain.mp3` (all 9 plain files new; full regenerated for
  `phase1-therapy` and `risk-assessment`) — **edit either level's text and you must regenerate that file**. The Listen
  button is re-skinned with hub tokens in `hubs/perio` (the widget's `var(--card,#fff)` fallback made it white-on-white
  in dark mode; any hub without a `--card` token has the same issue). Dashboard: perio `HUBS` entry updated, and the arcade
  high-score panel is now data-driven by an `ARCADES` array (Bone Zone + Pocket Arcade, hub switcher).
- **2026-09-24** — msk-exam3: Listen button on Lecture Notes (shared `window.shTTS`, same
  markup as perio) plus Kokoro narration `hubs/msk-exam3/audio/<lec>-full.mp3` for all 9
  lectures (af_heart). **msk-exam3 now has pre-generated audio: any READINGS text edit must
  regenerate that lecture's mp3** (text-and-audio-must-not-drift rule).
- **2026-09-24 (later)** — msk-exam3: As Taught / Plain English toggle on Lecture Notes
  (`READINGS_PLAIN`, `STATE.ui.level`), each level with its own narration
  (`audio/<lec>-full.mp3`, `audio/<lec>-plain.mp3`). Edits to either text need that level's mp3 remade.
- **2026-09-23 (dashboard revamp)** — `index.html` rebuilt (hub index Project). Hub cards
  are now rendered from a `HUBS` array (+ `CLASSES`, `TERMS`) near the top of the script:
  **to add or archive a hub on the dashboard, edit that array, not markup.** Each entry's
  `examDate` drives the hero countdown and card "Exam in N days"; `stateKey` is the hub's own
  localStorage key, read-only, used to show personal progress (supports the msk-style
  `seen/totalAnswered/days` and perio-style `answered/totalSeen/activeDates` shapes; if a
  hub changes its state shape or key, update `readProgress()`). New: next-exam hero, personal
  14-day activity strip (`get_personal_stats` across live hubs), greeting via
  `sh_display_name`/`get_display_name`, light/dark/system toggle (`sh_dash_theme`), arcade
  high-score panel (`get_arcade_leaderboard`, hub `msk-exam3`), changelog as a timeline.
  Hub links now open in the same tab (hubs have their own back button). Fonts: Instrument
  Sans/Serif. Kept: presence count, busiest hours, streak boards, update-available prompt,
  changelog-driven "Updated" labels, class easter eggs, collapse state keys.
- **2026-09-23 (latest)** — msk-exam3: arcade grows to nine games (Clast Blaster shooter,
  Bone Search word search, Whack-a-Clast). `migration_v10.sql` updated in place to accept the
  new game ids (`blaster`, `search`, `whack`). **migration_v10 was applied to Supabase on
  2026-09-23 via the Supabase connector**; arcade leaderboards are live for all nine games.
- **2026-09-23 (later)** — msk-exam3: 40-question Mock Exam; emoji replaced by a
  hub-local inline-SVG icon set (`ICON_PATHS`/`icon()`); compact one-row
  ribbon; Arcade grew to six games (added Marrow Match, Bone to Pick, Fact or
  Fracture) with a fullscreen toggle and an easier Snake. **Class-wide arcade
  leaderboards** via `migration_v10.sql` (`arcade_scores` table,
  `submit_arcade_score`, `get_arcade_leaderboard`): run it once in the Supabase
  SQL editor. Until then the hub shows "leaderboard warming up" and keeps
  working. Other hubs can reuse the same two RPCs with their own `p_hub`.

- **2026-09-23** — Archived GI Exam 2 (`hubs/hepatobiliary/`, incl. its
  narration audio) off the live site after the exam, same pattern as GI
  Exam 1: the full 404-question bank + lecture list was saved first to
  `question-banks/gi2-question-bank.json` (hub's own field names; see
  `question-banks/README.md`, regenerate with `extract_gi2.js`). Dashboard
  card removed; `hepatobiliary` stays in `HUB_LABEL` so old changelog/stats
  rows still label correctly. **Widget time tracking is now per section:**
  `record_activity_ping`'s `p_section` is `"<mode>/<sub-view>"` (e.g.
  `compendium/bank`, `review/drugs`, `compendium/exam-hints`) instead of
  only the top-level mode. Mode detection accepts `aria-selected="true"` OR
  an `is-active`/`active` class (hepatobiliary only set the class, so all of
  its ~12k minutes had logged as `(unspecified)`); sub-view = first visible
  active element outside `#modeSwitch` carrying `data-view|sub|ctab|gtab|
  dtab|tab|group|section|pane|panel`. A hub can override with
  `window.SH_SECTION = () => "mode/sub"`. Time is banked per section each
  second and a ping only fires once a section has earned a full 25s, so
  switching mid-interval no longer credits the wrong section. No schema
  change. `review/` rebuilt as a tabbed admin (Overview / Time by section /
  Questions / Engagement / Inbox) with a 7/30/90-day range, an "include
  archived hubs" toggle (archived list is `ARCHIVED` in `review/index.html`
  — add a hub there when you archive it), and "active time per visit"
  (total ping minutes ÷ visits) replacing the old span-based average, which
  counted hours of backgrounded tabs.

- **2026-09-23** — New hub: `hubs/msk-exam3/` ("Musculoskeletal Exam 3 Hub", widget
  `data-hub="msk-exam3"`, event `msk3:answered`, localStorage `msk3-state-v1`),
  built from the GI 3 Claude Project (L19-L27; L26 drugs and L27 tumors are
  slides-only until their recordings are uploaded). Modes: Compendium, Review
  (grouped reference: drugs, hormones, cells, matrix, genes, diseases, tumors,
  processes, superlatives; with a recall/blur toggle), and an Arcade that
  REPLACES the illustrated-scene game pattern at Sam's request: three
  cool-math-games-style mini games (Sort Storm, Osteo Snake, Stack Attack).
  Osteo Snake answers go through the normal answered event, so they count in
  class stats. Hub source is built from split files (css/js) in that Project's
  session; the deployed `index.html` is the single-file build. Added the hub to
  the dashboard GI group, `HUB_LABEL`/`ALL_HUBS`, and `review/` `HUB_LABEL`.

- **2026-09-18** — Tactical nuke: raised the streak requirement from 50 to
  100 correct answers in a row, per request. Also replaced the generic
  "Someone has called in a tactical strike" banner with the visitor's
  actual resolved name — the same deterministic name (e.g. "Gleaming
  Molar") the leaderboard and nuke/streak analytics already fall back to
  when a visitor hasn't set a custom display name, instead of a generic
  placeholder word. Added `get_display_name(p_visitor)` (`migration_v9.sql`,
  public, no secret) so the client can resolve it once on load; degrades
  gracefully back to "Someone" if the RPC isn't reachable.

- **2026-09-18** — Wired up analytics that had been silently no-op-ing:
  `widget/v3.js` was already calling `record_nuke_launch` on every tactical-
  nuke strike (since the feature shipped 2026-09-17), but the backing
  Supabase table/function never existed, so every call failed silently and
  the review page showed nothing. `migration_v8.sql` adds `nuke_launches` +
  `record_nuke_launch`/`get_nuke_summary`/`get_nuke_by_hub`/`get_nuke_recent`,
  and a new "Tactical nuke" section on the review page (launches, unique
  launchers, by hub, recent activity). Also added persisted correct-answer
  streak tracking (`correct_streaks` table + `record_correct_streak`, called
  from the same answered-question handler as `record_answer` — separate from
  the in-page-only counter that gates the nuke badge, which still resets on
  reload by design) and `get_correct_streak_stats()` (public, no secret,
  same pattern as `get_leaderboard`) showing the longest streak currently
  still standing and the all-time record. Shown in two places per request:
  a "Correct-answer streaks" section on the review page, and a matching
  card on the public dashboard (`index.html`) next to Study Streaks.

- **2026-09-16** — Perio: Session 3 (Risk Assessment, Dr. Geisinger) ingested
  from its lecture recording transcript + slide deck — flipped from
  exam-review-guide-only to fully lectured (new reading, 2 reference tables,
  17 new lecture-sourced questions, rewritten cram-sheet entry and mind map).
  Session 2 (Incisions/Flaps/Sutures) enriched with a supplementary in-class
  Q&A transcript (sub-marginal incisions, flap-thickness-by-procedure,
  palatal graft harvesting) — 9 new questions, 1 new incision type, 1 new
  reference table, 3 new exam hints. Question bank grew from 124 to 150.
  Regenerated Kokoro narration (`audio/risk-assessment-full.mp3`,
  `audio/incisions-flaps-sutures-full.mp3`) to match, per the
  text-and-audio-must-not-drift rule above. Also fixed two pre-existing bugs
  surfaced by testing against the larger bank (neither introduced by this
  content work — both date from the earlier Game-mode/gameplay-progress-split
  change, and both are general fixes in the shared `qCardHTML`/
  `wireQuestionContainer` pattern, not perio-specific): `recordGameAnswer`
  never dispatched the event the cutscene-trigger listener watches for, so
  clearing a lecture by actually playing through Understory never played its
  reward cutscene; and `SEQ_STATE`/`MATCH_STATE` (sequence/match
  click-tracking) were keyed globally by question id instead of per-render,
  so a sequence or match question could only ever be completed once per page
  load, in whichever mode/view reached it first — re-encountering the same
  question in a second context (Question Bank, then a Game encounter)
  silently could never be completed there. Worth checking other hubs that
  share this rendering pattern for the same two issues.

- **2026-09-16** — Added data-driven lecture mind maps: a new shared
  `window.shMindMap.render()` renderer in `widget/v3.js` (generic
  hierarchical tree layout, inline SVG, horizontally scrollable) plus a
  `MINDMAPS` data object per hub (10 hepatobiliary lectures, 9 perio
  sessions, content grounded in each hub's own lecture notes/reading
  text). A "Show mind map" toggle now appears under the lecture-notes
  reading pane in both hubs, following the same shared-renderer/
  hub-local-data pattern as `shGetClassStats`/`qCardHTML` — a future hub
  only needs its own `MINDMAPS` object, not new rendering code. Also
  fixed a spacing bug in the renderer itself: `layout()` was assigning
  leaf rows a fixed height while `nodeBoxHTML()` sized each box to its
  actual wrapped-line count, so any 2-3-line label produced a box taller
  than its row and visually spilled into the node below it. **Follow-up
  fix, same day:** the first deploy of this feature shipped
  `widget/v3.js` and both hub HTML files but forgot `widget/v3.css` —
  the mind maps went live as unstyled black SVG silhouettes (no fill/
  stroke/font rules) until a second deploy an hour later added the
  missing CSS file. Lesson: when a change touches both `widget/v3.js`
  and `widget/v3.css`, double-check FILES in `deploy_rollout.py`
  includes both before running it — it's easy to edit both files and
  only remember to list one.

- **2026-09-16** — Hub index: integrated the universal back button into each
  live hub's own sticky ribbon instead of a separate fixed bar above it
  (perio, hepatobiliary); removed a redundant duplicate background-music
  system inside Hepatobiliary's own Lounge panel; converted all 60
  originally free-recall questions in the archived GI Exam 1 question bank
  (question-banks/gi1-question-bank.json) to multiple-choice with curated
  distractors, so all 89 GI1 questions are now MCQ, and expanded
  Hepatobiliary Mock Exam's embedded EXAM1_REVIEW_POOL from a 27-question
  curated subset to the full 89.


- **2026-09-15** — Hepatobiliary: GI Pharmacology + Clinical Applications for
  Dentistry lecture transcripts mined into Lecture Notes/Exam Hints/Questions
  (now 10/10 lectures, 363 questions), reconciled via 3-way merge with a
  parallel session's Active Recall tab + `widget/v3.js` integration work,
  republished to the Claude Artifact and deployed to GitHub Pages.
- **2026-09-12** *(approx, from widget history)* — Active Recall flashcard
  mode added (hide-and-reveal cards pulled from Cram Sheet/reference content,
  deliberately excluding direct-quote Exam Hints cards since a raw quote makes
  a weak recall prompt); `widget/v3.js` v3 rollout across all 5 hubs.
- **2026-09-09** *(approx, from Supabase changelog)* — Study streaks, live
  class activity pulse, opt-in leaderboard, question flag/suggest-fix; search
  across every hub; class-wide correctness shown automatically; Listen
  (text-to-speech) button with word-by-word highlighting; mobile redesign.

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
