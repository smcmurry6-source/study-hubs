# Deploy Notes — the change log

This repo is edited from several different Claude Projects (one per hub, plus a
"hub index" / overarching project for cross-hub UI and shared functionality),
from Claude Code sessions and from other agents (Codex and others).
They don't share context with each other — a session in one Project has no idea
what a session in another Project just changed. **This file is the one place every
session can check for what shipped.** Add an entry whenever you make a non-trivial
change, and read the recent entries before you deploy.

## Start at AGENTS.md: the rules are notes in vault/ (2026-11-03)

Since 2026-11-03 the repo is a vault ([vault/rules/repo-is-the-vault.md](vault/rules/repo-is-the-vault.md)): start at
[`AGENTS.md`](AGENTS.md), then [vault/home.md](vault/home.md). The rules that used to open this file, and the sections of
`CLAUDE.md`, are notes now, one per rule, with the same titles. **Hub Projects and Cowork sessions: fetch and read them
the way you read this file; they are the rules.** Where they went:

| Was | Now |
|---|---|
| The core rule: GitHub is the source of truth | [vault/rules/github-is-the-source-of-truth.md](vault/rules/github-is-the-source-of-truth.md) |
| The About page lists everything | [vault/rules/about-page.md](vault/rules/about-page.md) |
| Shared infrastructure | [vault/reference/shared-infrastructure.md](vault/reference/shared-infrastructure.md) |
| Perio: the single file is the source | [vault/hubs/perio.md](vault/hubs/perio.md) |
| Archiving a hub = retrospective | [vault/rules/archiving-is-a-retrospective.md](vault/rules/archiving-is-a-retrospective.md) |
| Building a hub = diagram review | [vault/rules/diagram-review.md](vault/rules/diagram-review.md) |
| Ship it now; Home page; two-statement and true/false; numbered statements; High Likelihood; the Question Bank panel | their notes in `vault/rules/` (listed in [vault/home.md](vault/home.md)) |
| `CLAUDE.md` → "<section>" (in older entries below) | the note with that title in `vault/rules/`, `vault/how-to/` or `vault/reference/` |

Hub-specific knowledge (sources, build steps, quirks, what's pending) is in `vault/hubs/<hub-id>.md`; Sam's calls are in
[vault/decisions.md](vault/decisions.md); open work is in `vault/tasks/`. This file keeps the change log below.


## Recent major changes (newest first — add a line when you ship something)

- **2026-11-26 (Lessons refresh, Claude Code)** — Read 6 to 8 pm Central (Thanksgiving), a week before Review of Systems'
  Mock 1. **The last audit's 52 fixed keys worked**: their first tries went 17% → 64% (154), level with the rest of the bank,
  and the "keyed wrong" reports stopped. Every hard item and question-health flag was read against the notes: all keys hold.
  **Review of Systems: one fix.** `hn-neck-10` (the great auricular nerve after a facelift) was 1 of 12 on first tries, half
  picking the auriculotemporal, because the notes gave the auricle to the auriculotemporal and only the angle of the jaw to the
  great auricular; the Head & Neck notes (As taught, Plain English, the cram line; High yield rebuilt) now say the great
  auricular covers the lower ear and earlobe and the auriculotemporal the upper front of the ear, and `hn-neck-10`'s explanation
  and why and `hn-neck-09`'s explanation name the favorite wrong answer. No choice moved, so the class's picks stay right; the
  hub has no recordings, so nothing to narrate again. `LESSONS.md`: Live signals rewritten (use, the course spread, check-ins,
  the economy); two standing points (the key fix's outcome; a clue in the stem must be in the key's notes). A line for the audit
  after Mock 1 is on [the inbox](vault/tasks/inbox.md).
- **2026-11-26 (the study-music loops deleted, #572, Claude Code)** — Sam: "Delete study music loops". The five loops in
  `widget/audio/` (cafe, lo-fi, piano, rain and waves, 9.7 MB) are gone from the site: only the old Settings panel's
  background music played them, and that came out of `widget/v3.js` in #568, so nothing students see changes (no changelog
  line). The public-repo check (`tools/release/secrets.js`) no longer allows media in `widget/audio/`; the nuke egg's
  `widget/sfx/` and `widget/vid/` (2.7 MB) stay ([no-narration-in-the-repo](vault/rules/no-narration-in-the-repo.md), fixed
  to say so). Git keeps them: `git checkout f5daf2d0 -- widget/audio`, and put `audio` back in `MEDIA_OK`. Left on the
  inbox: `widget/clicks.js`'s daily settings snapshot still records the music setting.
- **2026-11-25 (migration_v101 and v103 applied, Claude Code)** — At 2:10 and 2:13 am Central, through the connector in one
  call each, with the class asleep. **v101** (#545: the year-spanning readers read the totals; `insight_cards_kept`,
  `sh_insights`, `get_hub_recap`, `sh_retention_run`): nothing changes until the first collapse (about 2027-09-13); the three
  bodies md5-checked before and after, the new table admin-only; `sh_insights` 4.95 s cold, 1.0 s warm (the admin cache job
  gives it 10 s). **v103** (#563: the boards keep a tie in one order; Link my devices rebuilds XP once): all nine bodies
  md5-checked before and the eight replaced after, `get_rank_board_v2` PL/pgSQL, the five boards answered as anon. Timed
  live the same night ([game-server](vault/reference/game-server.md)): v103 halves the work (one XP rebuild instead of two),
  but the heaviest visitor's one rebuild still ran past 5 s after it (rolled back), so Link my devices can still time out
  for the very heaviest; the time is in the rebuild's other statements, not the replay (0.35-0.57 s), and the next cut is a
  new inbox line. The students' changelog line says only the boards' tie order until that's fixed. `supabase/schema.sql` has both
  files, `supabase/pending-migrations.txt` lists none, and `redeem_link_code`'s numbers at the apply are in the week-after
  inbox line.
- **2026-11-25 (Timmy's place: a quicker Customize, #567, Claude Code)** — Sam: "I also want a better way to do the customization
  for Timmys place. Its clunky and inefficient". Customize is one panel now: four tabs (Timmy, Home, Scene, Yard, with the
  yard's five spots as a row under its tab) over one list of what you own of that kind, grouped New since you last looked,
  Classics, each collection and season, Rank rewards (locked ones say what unlocks them). It opens on the newest piece you
  haven't seen, else where you were last (`sh_place_cz`), the Yard tab on the first empty spot; tapping the house, the
  yard or Timmy on the stage opens that tab; Surprise me, Shop and Done stay at the panel's foot on a phone too. Every tap
  marks the card at once and the stage follows after the frame (an outfit swaps only Timmy); each kind's list is kept;
  Customize no longer waits for every set's file. At 4x slowdown a piece answers in 88-168 ms (was 240-600), a tab in
  96-152 (was 176-304); numbers and the new rules in [motion-cost](vault/reference/motion-cost.md). Saving is unchanged
  (`equip_item` on each pick, no migration), every button keeps a fixed `data-tp`. The About page's Customize paragraph is
  rewritten; `sw.js` is `sh-v82`. Left for later: [the inbox](vault/tasks/inbox.md).
- **2026-11-25 (the old pages' parts out of `widget/v3.js`, #568, Claude Code)** — The package "Take the old pages' parts
  out of `widget/v3.js`" (the inbox line; Sam, 2026-11-24: "The cleanup sounds good"). v3.js no longer builds what only the
  old single-file hub pages (down since 2026-11-19) drew or what a hub on the engine always hid: the desktop launcher and
  its menu, the phone bar and its More sheet, the name badge, the inbox ribbon and its tour button, the old Settings panel
  (with its background music and the study-music player, `window.shMusic`), and its old-page paths: the fixed top bar
  (`#sh-topbar`, `reserveTopClearance`), the top-bar fitter for `header.hub-header` (`--sh-head-h`, always 0 on the
  engine: `widget/v3.css`'s two rules that used it now read the same without it), the class picks' paint (`.sh-cp`; the
  engine draws its own), the lecture pager, and the dark streak pill and update banner for a page without `shToast`.
  `widget/drill.js` keeps only the picking (`shDrill.set/more/mark/streak`: the Daily Drill is a set of the Question Bank,
  `#questions/drill`), not its dialog; `widget/fx.js` loses its marks on the old choices (`.qcard-choice`) and the
  countdown pill. `widget/hub.js` opens Search, Class stats and Suggest with `window.shWidgetPanel()` instead of clicking
  the hidden launcher's pills (so `widget/clicks.js` no longer counts those clicks as `widget:#shstat-*-pill` too), and
  `widget/ranks-hub.js` reads the rank on `sh:stats-open`; `widget/hub.css` loses the rules that hid the parts that are
  gone. v3.js 4,076 to 3,406 lines, drill.js 437 to 146, fx.js 335 to 229; `widget/hub-rest.bundle.js` 448 to 396 KB
  (125 to 110 KB gzipped). Fixed on the way (BUG-202): a mock's results card's "See what I missed" looked for the old
  pages' list and did nothing; it now turns on the mock's "Show only the misses". Computed styles of every element on the
  dashboard and Review of Systems' Home, Notes, Questions, an answered question, the drill, More, Settings, Stats, Search,
  Suggest, Report and the boards, laptop and phone, light, dark and the device's dark (78 states; `main` twice, with a
  fixed random seed and every animation held at its start): the dashboard is identical, and nothing drawn on the hub
  differs except what the two runs of `main` differ by (Timmy's bubble, a meter's bump, the drill's two sets), the
  inherited `--sh-head-h` (0px) that is gone, and the rank pictures' gradient ids, one lower since the name badge no
  longer draws one first. The first comparison caught one slip of this work, fixed before the PR: the Report and Pin
  buttons had moved out of the question card's tools (`.qcard-top`), which the engine draws too. Bundles rebuilt,
  `sw.js` sh-v81; the smoke test's largest-text Settings check reads the hub's own Settings page (`#more/settings`).
  Left, in [the inbox](vault/tasks/inbox.md): the same cleanup in `widget/tour.js`, `widget/linkask.js`,
  `widget/clicks.js` and `widget/eggs.js`, and Sam's call on the study-music loops (`widget/audio/`), which nothing plays now.
- **2026-11-25 (The medals' last SMIL, the scrollbar's room, the progress ring on a new device, Claude Code, #564)** —
  Three inbox lines, measured at 4x CPU as [motion-cost](vault/reference/motion-cost.md) does. **The Diamond and Dark
  Matter medals:** their sparkles, Dark Matter's twinkling stars and its glow were SMIL in `art()` (`widget/ranks.js`), which
  made the browser draw the page on every frame wherever an animated medal was; they are CSS `transform` and `opacity` now,
  same values and timing, keyframes inside the drawing, and the Dark Matter nebula holds still. Frozen frame by frame they
  match main, except that each sparkle starts mid-cycle and the nebula is the still medal's. A hub's Stats 94-95% busy →
  5-13%; Timmy's place 90-97% → 69-85%, what a Gold account's place measures (the rest is the place's own pieces in the
  cloud's software drawing). No looping SMIL is left in `widget/`. **The scrollbar:** keeping a hidden scrollbar's room
  (`scrollbar-gutter: stable`, the shop's `tsh-gut`) turned out to cost more than it saves: changing the root's gutter
  restyles the whole page behind, 30-230 ms each way on a slowed laptop, while laying the page out again 15 px wider takes
  1-40 ms. So Timmy's place and the figure zoom (the line's "Focus mode": `hx-fz-open`) stay as they were, and the shop's
  `tsh-gut` came out (about 260 ms less style work on opening and closing it). **The progress ring:** on a device that holds
  nothing of the open tab's hub (a new or linked device, cleared storage, the preview), the dashboard's one bootstrap asks
  for that hub, and the ring and its button are drawn from the account's answers (`ringAsk()`, `serverFill()` in
  `widget/dash.js`): the same numbers the hub keeps once it is opened there; another tab's hub uses the mastery that comes
  with it. The check-in pop-up, the streak and the week still read only this device.
- **2026-11-25 (the boards' tie order and Link my devices' timing, Claude Code)** — two lines of the to-do list, one
  migration (`migration_v103.sql`, applied after the merge at 1-5 am Central). **The boards**: people tied on a place on
  the Ranks, streaks, right-in-a-row, arcade and fairy boards came back in whatever order the database read them, so they
  could swap between loads (and at a board's limit, who showed could change); now a tie is by the name shown, case aside,
  then the id, as the Crowns board already was (`get_rank_board_v2` is PL/pgSQL now). **Link my devices** ran out of
  anon's 3 s for people with many answers: the Postgres logs held 24 timed-out links from 2026-11-18 (19 of them that
  overloaded day), and the 7 that finished took 2.0 s on average, up to 2.7 s. It rebuilt XP twice (the answers' update
  trigger, then its own rebuild); now once (`sh.linking`, which `sh_xp_on_update` skips on), and the rebuild's replay looks
  a boost up inline instead of a PL/pgSQL call per answer: 770 → 350 ms on a throwaway copy with a 10,000-answer visitor,
  every total, award and day the same. `tools/release/xp.js` section 21; section 16 compares the boards in the order they
  come back. Left on the to-do list: the page's "That code didn't work" after a timeout, and reading the link times a week
  after the apply ([game-server](vault/reference/game-server.md)).
- **2026-11-24 (Listen in the device's voice: BUG-199, #561, Claude Code)** — A hub without recordings (every hub since 11-22) read a whole part as one `SpeechSynthesisUtterance` (Review of Systems' As taught: about 27,000 characters) at a fixed rate, with no speed control (report #68: "won't play or give options to speed up or slow down"). Now `widget/v3.js` speaks a heading, sentence or list item at a time, one after another (never over 200 characters: Chrome's network voices stop or fail on a long one), with the recording player's 1x to 2x select beside the voice picker (`utterance.rate`, the same saved speed); Pause and Resume cancel and speak again from the word reached; a tapped word starts there; an error retries on a local voice, then moves on, and stops with a toast after three or a voice that never starts. New events `tts:voice-error=<code>`, and `tts:secs` / `tts:end` for the device voice ([event-taxonomy](vault/reference/event-taxonomy.md)). The Listen button now says "Pause" while it reads (`widget/hub.css` looked for a class nobody set). About page and Ask Timmy's site help updated. Tested on a stubbed `speechSynthesis`; real iPhone, Windows and Android Chrome still to retest ([bug log](vault/release/bug-log.md)). Report #68 was resolved with its reply on 2026-11-25 (03:36 UTC), after #561's After merge run passed (Sam: "Send the replies when fixed").
- **2026-11-24 (Review of Systems: every question vetted, Claude Code)** — Sam: "Vet all questions, the answer key, and
  explanations in review of systems for accuracy, clarity, effectiveness, completeness. Make any necessary changes." All
  1,369 questions were read in 19 slices (a course or part of one each): answered cold, then the key, the explanation and
  every choice's why checked against the hub's notes, standard references and Sam's 2026-11-23/24 calls; each proposed
  change was then read again before it went in. **No key was wrong** (the 52 of #552 hold). 71 questions changed: false
  facts in a why or an explanation (HLA-A5, which doesn't exist; Merkel cell polyomavirus as IARC "Group 1", it is 2A;
  marasmus as "over 60% weight loss", it is weight below 60% of normal; kallikrein activating factor XI; NMS "1-3 days
  after starting"; the subclavian vessels skipping the superior thoracic aperture; mcg and q.a.d. on the do-not-use list),
  one second right answer (`rd-physics-13`: a longer source distance also cuts photons), stems that argued against their
  key or gave it away (`ns-anat-08` a stroke keyed as a nerve lesion, `hn-neck-02`, `cr-bp-04`, `he-heme-02`,
  `rn-dental-06`), statements false only by wording or answered by their neighbor (`ns-sens-15`, `om-caries-15`,
  `om-viral-05`, `rd-anatomy-10`, `f2-pkpd-22`), impossible distractors, and a dozen explanations that never said why
  the key is right. **Choking follows the AHA's 2025 guideline everywhere** (5 back blows, then 5 abdominal thrusts; the
  hub's EM-1 notes already said so, EM-2 and two questions said thrusts alone). `et-pro-15`'s choices changed so its
  fourth statement is judged (key 3 → 2; the server starts a changed question's per-choice picks again by itself), and
  `da-tmj-12` lost a wrong `which` label. The same errors came out of the notes (27 lines in `notes.json`, `study.json`
  and one topic title in `core.json`; High yield rebuilt), with one "the lecture called ... low yield" sentence
  ([dont-ask-what-professors-skip](vault/rules/dont-ask-what-professors-skip.md)). No id changed, none retired. Calls
  left for Sam: [the inbox](vault/tasks/inbox.md). Reports #80-#84 (five Head & Neck keys #552 had already fixed, sent
  from pages still showing the old copy) were resolved with their replies.
- **2026-11-24 (After #552: the fixed keys' picks put back, BUG-200, Claude Code)** — After merge loaded Review of Systems' new keys, which set the 31 answered fixed questions' picks aside (`question_choices_past`: the choices' version includes the key), and then #552's recount found no picks and set them to 0% right. Within 3 minutes the picks went back under each question's current choice version and the recount ran again, by hand through the connector: 52 right of 105 tries. Recorded as `tools/data-fixes/2026-11-24-review-of-systems-picks.sql` (After merge runs it again on this merge: a no-op move and the same recount), tested on a throwaway copy in After merge's order; the gotcha is in [after-a-merge](vault/how-to/after-a-merge.md). Reports #69-#79 resolved with their replies (Sam: "Send the replies when fixed"); #68 waits for BUG-199. The class notice went out on Sam's word ("You can send the notice"): `site_notices` #8, "Fixed: 52 answer keys in Review of Systems", 20:13 UTC.
- **2026-11-24 (the "Good question?" thumbs' words hidden again, Claude Code)** — #548 cut `.sh-cp-sr` from
  `widget/v3.css` with the old class picks, but `widget/qhealth.js` labels the "Good question?" thumbs with it, so on
  every answered question the words "Yes, a good question" and "No, something is off" showed in full beside the thumbs,
  overlapping at phone width (BUG-201). #548's check compared every page's styles without answering a question, which is
  when the thumbs appear. The rule is back, by the thumbs' block; `widget/hub-rest.bundle.js` rebuilt, `sw.js` sh-v80.
  Found while drawing a sample Patient Box case for Sam, which also found that a hub without `content/figures.js` never
  draws a case question ([the task](vault/tasks/2026-11-20-patient-box-v2-next-steps.md) has the box).
- **2026-11-24 (Peri-implantitis by the 2017 consensus; a saved font no longer applies, Claude Code)** — Two of Sam's calls. (1) "Go with outside sources for 553": with no earlier records, the Patient Box kit's `derive()` calls an implant peri-implantitis only with all three of the 2017 consensus's findings together (bleeding or suppuration, probing 6 mm or more, bone 3 mm or more below the platform), not the lecture's either-one, and `validate()` (`implantCheck()`) refuses a record without records that has bleeding and only one of the other two, since the two readings would differ. Every example and the tests' records read the same as before; `tools/ci/cases.js` gains the two refusals. No live hub has cases. (2) "For font, stop applying": `applyFontPref()` in `widget/v3.js` clears a font saved in the old Settings (`sh_pref_font`, cut 2026-11-05) and leaves `--font-body` to the page, as #548 did the accent metal; the font is out of the daily settings snapshot (`widget/clicks.js`); bundles rebuilt, `sw.js` sh-v79.
- **2026-11-24 (Patient Box v2.4: a front space's labial flange, Claude Code)** — #554's two open calls, at Sam's word ("No to
  canine cingulum rest, use outside sources to answer #2"): a mandibular canine keeps taking no cingulum rest, and a partial
  denture's front bounded space (incisors and canines with teeth on both sides) gets its `flange`, from Faigenblum 2023 (Prim
  Dent J) and Dental Update: `none`, the teeth gum-fitted on a ridge that has barely resorbed (up to 1.5 mm) and drawn standing in
  the gum as a bridge's pontics are, with their own margins and papillae; `partial`, a collar 1 mm past the ridge's crest (up to
  3 mm); `full`, a labial flange into the sulcus with its root eminences carved. It is chosen from `ridge` by default and refused
  past those (the millimeters are the kit's reading); a front base also fills the cervical embrasure beside each abutment. On
  every view, the ridge over a gap is now measured from the neighbors' mid-facial margins (it was from their CEJs, so gaps sat
  about 2 mm too deep: the root tips, complete overdenture and both partial examples moved a little). Example
  `v24-front-flanges`, question `v24-ex-28`, 9 `validate()` records in `tools/ci/cases.js`; the how-to has `flange`. `sw.js`
  `sh-v78`.
- **2026-11-24 (Lessons refresh: 52 answer keys in Review of Systems, Claude Code)** — Ten "keyed wrong" reports in a day led to a read of all 1,369 keys against their explanations and why lines (seven agents, a course or two each): 51 of Head & Neck's 68 single-answer items and `f1-biomol-03` pointed one choice past the right answer, wrong since the build (#480), every one by exactly one place; fixed in `hubs/review-of-systems/content/questions.json`. `tools/data-fixes/2026-11-24-review-of-systems-keys.sql` recounts their `question_stats` from `question_choices` after the merge (tested twice on a throwaway copy); After merge loads the new keys. Also: when troponin reaches the blood (`f2-genpath-20`, its notes and cram line), the panoramic chin-down error (`rd-anatomy-07` and its notes), and small slips in seven why lines and explanations. Listen with the device voice: BUG-199. `LESSONS.md` refreshed (Live signals, the game economy, a standing lesson on reading keys before a drafted bank ships). Then Sam's four calls ("Send the replies when fixed, adding the answer key step is good, prices are good for now, fix 5", [decisions](vault/decisions.md)): the key read is a step of [build-a-hub](vault/how-to/build-a-hub.md)'s Check; the shop's prices stay; Gold's agar is 20% sucrose (`om-viral-01` and its notes) and B cells finish maturing in the spleen (`f1-innate-12`), from standard references; reports #69-#79 are resolved with their replies once the fix is live, and #68's waits for BUG-199.
- **2026-11-24 (Patient Box v2.4, Claude Code)** — the case kit (`widget/cases.js`, `widget/cases.css`) gets **removable partial
  and complete dentures**, **overdenture abutments**, and **cantilever, resin-bonded and provisional bridges**, on every view
  ([the task](vault/tasks/2026-11-20-patient-box-v2-next-steps.md), step 5), each clinical call settled from outside sources and
  cited in `cases.js`'s header (Sam, 2026-11-21: "Use outside sources to determine answers"). `{ m:'denture', type:'partial' }`
  takes its `connector` (a lingual bar only with 8 mm to the floor of the mouth, else a plate), `clasps` (circumferential or RPI)
  and `rests` (occlusal, cingulum, incisal; a clasp's own rest worked out), `ridge` and `years`; `validate()` keeps an RPI to a
  free-end abutment with its rest mesial, clasps on both sides, none on mobility 2, no cingulum rest on a mandibular canine, an
  indirect retainer on a Class I or II, and every missing tooth replaced (McCracken's; Kratochvil 1963; Krol 1973). `derive()`
  works out the arch's Kennedy class by Applegate's rules (`kennedy`); the box never states it. `type:'complete'` takes the
  whole arch with its `abutments`: root-filled roots cut to a dome and sealed (amalgam, composite or glass ionomer), at least half
  their bone (Zarb's; Crum and Rooney 1978; Ettinger and Qian 2004). The bridge module gets `cantilever` (a maxillary lateral
  from the canine, a premolar from two splinted abutments, hung mesially; never a canine), `type: "resin-bonded"` (metal or
  zirconia wings on unrestored lingual enamel, one pontic, the single-retainer design for an incisor: Kern) and
  `material: "provisional"`. Drawn: films taken with the denture out (and said so), the resorbed ridge, a dome and its seal, a
  wing over its abutment's crown, a cantilever's joins; the view with the denture in (its base, teeth, clasp arms, the RPI's plate
  and I-bar, rests) or `out: true` (the ridge, the domes); the chart's dome; the odontogram's denture teeth on their base, clasps,
  I-bars, rests, domes and wings, each in the key. The box gets a row for each denture and the floor of the mouth.
  `rests: ["denture"]` and `["kennedy"]` say what a question can rest on (a cingulum rest only on the odontogram, a wing only on a
  film or the odontogram). Five examples and ten questions in `tools/cases/examples.json`; `tools/ci/cases.js` adds 41 records for
  `validate()`, 14 for `answerable()` and 6 for the Kennedy class; the how-to has the module. Also, on every drawn view (Sam: "The way the gingiva is handled needs to
  be better"): the gum over a missing tooth is one smooth ridge from the neighbors' margins, about 1.2 mm below their CEJs (Tan
  2012), instead of a stepped pink block; past the gum, the embrasures between crowns and the space past the last tooth are the
  dark of the mouth (they were pink down to the incisal edges); the pink strip under the upper incisal edges is gone; an
  overdenture abutment stands on a broad mound; a denture base over a bounded space is a rounded collar just past the ridge, and
  its papillae are no taller than a natural one; the stipple stays off the gaps. Then (Sam: "The interdental papillae look
  terrible and unnatural"; "the metal portions of the dentures dont look good"): each tooth's margin is one smooth U from papilla
  to papilla through its mid-facial margin, the papilla tall in front and lower behind (Becker 1997, Tarnow 1992), short of the
  contact, rounder on back teeth and when swollen; and the framework is tapered, round-ended metal with a highlight, following
  each crown's outline: rests over the marginal ridge's corner, arms level from the shoulder and dipping into the undercut,
  connectors and the proximal plate hidden in the base, the I-bar out from under the base 3.5 mm below the margin. No live hub has dental cases, so students see nothing yet; `sw.js` to `sh-v77` for the changed kit.
- **2026-11-24 (Patient Box v2.3, Claude Code)** — the case kit (`widget/cases.js`, `widget/cases.css`) gets the
  **`implant` module** and an **implant-supported bridge**, on every view ([the task](vault/tasks/2026-11-20-patient-box-v2-next-steps.md),
  steps 4 and 5), each clinical call settled from outside sources and the PCD Implants lectures and cited in `cases.js`'s header
  (Sam, 2026-11-21: "Use outside sources to determine answers"). `{ m:'implant', tooth, state }` writes an implant's numbers from its
  state (health, mucositis, peri-implantitis, failed, healing under its cover screw): the mucosa about 3.5 mm over the crest, the
  probe short of the bone in health and near it in disease (Lang 1994), the delivery film's bone (1.5 mm by default, or `false`:
  no records), `loss`, facial `rec`, `swell`, bleeding and suppuration; widths by site (3.3, 4.1, 4.8) and lengths; the crown's
  material and `retention` cement or screw, and `cement: true`, excess cement (Wilson 2009). `derive()` adds the lecture's failure
  rule (more than half the implant's length of bone, or any mobility) and the healing state; `validate()` keeps an implant 1.5 mm
  from a root and 3 mm from another implant (Tarnow 2000), its pocket base against its bone, a cover screw with nothing of a
  crown's, and refuses a bridge joining an implant to a tooth or more than one pontic on two implants. Drawn: the film's crown by
  material (a metal-ceramic coping, lithium disilicate showing the abutment), a screw-retained crown's access channel (composite
  over PTFE tape), a failed implant's radiolucent line along its taper (v1 drew a box); the view's abutment and threads where the
  mucosa has receded; the chart's submerged implant and its key line; the odontogram's cover screw and key entry. The box gets an
  implant row (crown, retention, years, the delivery film's bone). A full-mouth view's tooth count leaves implants out, as
  `validate()` does. `rests: ["impl"]` wants the film, and the chart or a bleeding row. Three examples and six questions in
  `tools/cases/examples.json`; `tools/ci/cases.js` adds 34 records for `validate()`, 10 for `answerable()` and 9 for `derive()`;
  the how-to has the module. No live hub has dental cases, so students see nothing yet; `sw.js` to `sh-v76` for the changed kit.
- **2026-11-24 (`widget/v3.css` cut to what a hub on the engine draws, #548, Claude Code)** — The package "Trim
  widget/v3.css to what the engine draws" (the inbox line). v3.css loses the rules for what only the old single-file hub
  pages drew (down since 2026-11-19) or what a hub on the engine always hides (`widget/hub.css`'s `display:none
  !important`): the desktop launcher and its menu, the phone bottom bar and its More sheet, the old Settings panel, the
  name badge, the fallback top bar and the old pages' top-bar layouts, the update banner and streak toast (the engine
  has `shToast`), the Daily Drill dialog, the inbox ribbon, the countdown pill, the accent swatches and the old pages'
  accent targets, the docked boss, the rank glyph on an old ribbon, the lecture pager and `.notes-layout`, the class
  picks, `.home-next` and fx.js's answer marks. 107 to 71 KB, 826 to 541 style rules (928 to 614 selectors), 46 to 31
  `@keyframes`; every one left is still used. Nothing new on `:root` (#525's lesson). Putting the sheet in on the slow
  phone (CPU 4x, median of 8 alternating loads): about 22 to about 15 ms. Computed styles of every element on Home,
  Notes, Questions and More (and the panels and dialogs they open), laptop and phone, light and both darks (78 states;
  130 with a pair meant to add an accent metal, which never turned it on: the stubbed data has no rank, so the metal was
  refused), about 2.67 million styles: nothing drawn differs except what two copies of `main` also differ by, and two
  races of the test itself; the rest is inside what the engine always hides. `widget/hub-rest.bundle.js` rebuilt. Sam's
  call the same day ("Accent metal should stop being applied", [decisions](vault/decisions.md)): the accent metal a
  student picked before Settings lost it (2026-11-05) is no longer applied, and a hub clears the saved one
  (`sh_pref_accent`); `widget/ranks.js`'s metals and `applyAccent`, their textures (`assets/tex/`),
  `tools/make-accent-tex.js`, the old Settings panel's swatches, v3.css's accent rules and the metal in the daily
  settings snapshot came out (`rest.bundle.js` 4.9 KB smaller). Left, in [the inbox](vault/tasks/inbox.md): the cleanup
  of the old parts `widget/v3.js` still builds and `widget/hub.css` hides (Sam: "The cleanup sounds good"), and Sam's
  call on a saved font choice, which still applies the same way.
- **2026-11-24 (Patient Box v2.2, Claude Code)** — the case kit (`widget/cases.js`, `widget/cases.css`, `widget/teeth.js`)
  draws and checks what v2.1 left ([the task](vault/tasks/2026-11-20-patient-box-v2-next-steps.md)), each clinical call settled
  from outside sources and cited in `cases.js`'s header (Sam, 2026-11-21: "Use outside sources to determine answers"):
  **proximal root caries** (`root: true` on M or D: a saucer-shaped notch on a film between the CEJ and the crest, only on a
  root bared by interdental attachment and bone loss; not on the view; an arrested one needs the exam in a row); the
  **`roottip`** module (a retained root broken off about a millimeter above the CEJ, or a root tip in a healed socket under a
  ridge that dips over it); **`resorption`** (internal, external cervical by Heithersay's class with its pink spot on the view,
  external apical, replacement with the ankylosed tooth immobile and metallic on percussion); **`sealant`** (O, a mandibular
  molar's buccal pit, a maxillary molar's or incisor's lingual; on the view and the odontogram, never a film); **temporary
  fillings** (`material: "temporary"`, `temp` IRM or Cavit, bright with voids over a cotton pellet) and the **provisional
  crown**; and the record's **`tests`** (bite test, transillumination, percussion), each a Patient Box row, so a crack's finding
  is in the case, not a question's `pbox`. `rests` gains `roottip`, `resorption` and `sealant`; `tools/ci/cases.js` holds a
  record for every rule (53 for `validate()`, 21 for `answerable()`); five examples and six questions in
  `tools/cases/examples.json`; the how-to has the modules. Also fixed: a crowned tooth on the drawn chart looked natural in
  the dark theme. No live hub has dental cases, so students see nothing yet; `sw.js` to `sh-v75` for the changed kit.
- **2026-11-24 (Learn's typed answer and Flashcards' Undo, migration_v102, Claude Code)** — Sam: "Do typed answers in
  learn and undo in flashcards too" (the two inbox lines). **Learn:** a question's second, mastering step is typed when its
  right answer is short (six words or fewer, not "all of the above" or the like, distinct from every other choice: 163 of
  Review of Systems' questions); a longer one is still asked without its choices, or with them. A forgiving match
  (`SH_STUDY.match` in `widget/study-modes.js`: case, spaces, punctuation, accents, articles, a plural s, number words,
  word order, and one typo in a word of 7 letters or more, never in its first two) marks a clear match right by itself;
  otherwise the right answer shows and the student taps "I had it" or "I missed it" (Sam's call). A match pays as an
  answer (10, then 2), a self-mark like a recall card (a flat 2), and a typed answer counts in your own answers but not
  in the class's numbers: `sh_answer` takes the new context `typed` (migration_v102, applied live at about 6:55 pm Central
  on 2026-11-23, md5-checked before and after; `tools/release/xp.js` section 20). The typed words never leave the page.
  `tools/ci/typed.js` (in "Check hubs") checks the match on every live hub's typed questions. **Flashcards:** a rating is
  held for 5 seconds under the next card with an Undo (or U, or Ctrl+Z), which puts the card back, flipped, with its
  schedule as it was; it is saved at the next rating, Close, or when the page is hidden or closed, and one still queued is
  sent by the hub's next page, paid once (its request id). `tools/ci/smoke.js` walks both.
  [The task](vault/tasks/done/2026-11-06-redesign-learn-and-flashcards.md).
- **2026-11-24 (A faster shop and a lighter Timmy's place, Claude Code)** — Two inbox lines, measured at 4x CPU as
  [motion-cost](vault/reference/motion-cost.md) does. **The shop's opening:** of the three suspects none was most of it:
  `mount()` in `widget/shop.js` drew every shelf twice on each first open (the cached shop, then the server's, which always
  differed because the mystery box is never cached; about 600 ms). Now the server is asked while the files load and the
  shelves wait for it up to 1.2 s; the sets' files are fetched beside the shop's art, not after it. The dashboard's
  `drawWallet` (`widget/dash.js`) no longer focuses the Shop button behind the open shop (about 200 ms of layout) and draws
  the row again only when it changes. The page keeps its scrollbar's room while the shop is open (`tsh-gut`,
  `scrollbar-gutter: stable`; about 250 ms on a desktop with classic scrollbars). Long tasks 1.4 s → 0.9 s on a phone-size
  screen, 1.8 s → 1.0 s on a laptop with scrollbars. **The place at night:** the stars were 2-3% of the busy main thread
  (three twinkling groups cost more, so they stay as they were); the rest was the rank medal's shine in the place's panel,
  a SMIL `<animate>` that drew the page every frame. It is a CSS transform now (`art()` in `widget/ranks.js`, its keyframes
  inside the drawing), same path and timing: 95-97% busy → 11% (phone size), 87-90% → 33-38% (laptop size). It shines the
  same in a hub's Stats, the trophy case and the cards. Rule 9 in motion-cost: no looping SMIL. Left on the to-do list:
  the Diamond and Dark Matter medals' other SMIL, Timmy's place's and Focus mode's scrollbar, what's left of the shop's
  opening, an iPhone look at the stars.
- **2026-11-24 (The typodont and the arcade's tooth tiles drawn from the tooth library, Claude Code)** — the package "The
  typodont and the arcade's tooth tiles drawn from the tooth library" ([the task](vault/tasks/2026-11-20-patient-box-v2-next-steps.md)).
  `widget/journeys.js`'s typodont (the ModuPro hand-off) dropped its own copy of Wheeler's table, the crown outline, the
  grooves and the curve smoothing and reads `widget/teeth.js`, which `handoff()` now fetches beside the journey art (`typo()`
  is null until it arrives); every one of the 13,498 numbers it draws is the same as before. The library gained
  `buccalGroovesMM()` (the typodont's molar grooves) and an incisor's proximal view (`LL`, Wheeler's labiolingual sizes and
  curvatures; `proxCrownMM`, `mkProxRoot`, `proxOutlineMM`; schematic between his landmarks). In
  `tools/figures/site/arcade.mjs`: Pocket Showdown's molars (`boardTooth()`, a lower second molar), Occlusion's Cross-Section
  (`sectionMolar()`, a lower first molar in its bone, ligament and gum) and Perio's Cross-Section (`sectionIncisor()`, a lower
  central incisor from the side with its probe) are drawn from the library; built into `tools/preview/design/art.js` only,
  since neither hub's page is up. Nothing students see changes.
- **2026-11-24 (The year-spanning readers read the totals, migration_v101, Claude Code)** — The to-do "Before the first
  collapse (about 2027-09-13), point the year-spanning readers at the totals". From the night a day turns a year old, the
  nightly job collapses its per-person hours into `activity_daily` (migration_v93), and the Insights tab (`sh_insights`), the
  recap (`get_hub_recap`), `tools/retro.sql` and `tools/lessons-daily.sql` read `activity_hourly` only: a hub's oldest days
  would have dropped out, and a hub older than a year out of Insights altogether (its people falling under 5). Now all four
  add the collapsed days' minutes from `activity_daily`, worked out from pings so a day gives the same numbers before and
  after. What totals can't give (a hub's people, one day / 3+ days, median and p90 minutes, median answers, a surface's
  people, the check-ins' median) the job keeps per hub in `insight_cards_kept` the night its first day is collapsed, and
  Insights reads it from then on ("per person as of <day>" on the hub's row); the recap's hours of the day, regulars and
  awards count the kept days, and its image says so. Nothing has been collapsed yet, so nothing needed filling in.
  `tools/release/retention.js` checks a partly collapsed hub's Insights line, surfaces, check-ins and recap are the same
  before and after. **Applied after the merge**, 1-5 am Central (in `supabase/pending-migrations.txt` until then). How:
  [insights-dashboard](vault/reference/insights-dashboard.md), [analytics-retention](vault/reference/analytics-retention.md).
- **2026-11-24 (The preview's two small bugs, BUG-107 and BUG-039, Claude Code)** — Preview only, nothing on the live
  site changes. (1) The preview's dashboard drew Timmy at 0 HP for the returning, missed and high-XP test accounts until a
  hub had been opened, because the made-up answer history was built from the hub page's own question list: the preview's
  build now puts every engine hub's question ids and exam dates into the runtime (`hubFixtures()` in
  `tools/preview/transform.js`), so any page makes the same history (the dashboard first: 100 HP). (2) On a small phone the
  Preview button covered the exam check-in's buttons: while one of the page's dialogs is open it now moves to the corner or
  edge that covers least of it (`dodge()` in `tools/preview/runtime/preview.js`), and stays put otherwise.
- **2026-11-24 (Housekeeping: BUG-197's last rows, four retests, the inbox, Claude Code, #544)** — Nothing students see.
  **BUG-197:** counted read-only, 2 `pq-` rows in question health (Review of Systems, ctx mock, 1 made-up visitor), from
  12 minutes before #524 merged, none since: the guard proxy holds. `tools/data-fixes/2026-11-24-bug-197-last-rows.sql` (the
  2026-11-20 fix's body) takes them after the merge. **Retested:** BUG-197; BUG-198 on the live site (Review of Systems'
  `--hub` is `#6b46a8` on Home and Notes, light and dark, with every request off the site blocked); BUG-195 and BUG-194
  (no recurrence in any of the 147 Check hubs and 111 Release tests runs since #506, logs searched). **Inbox:** its 16 ticked and struck lines cleared (each is in its PR, `decisions.md` or the bug log); the
  boards PRs' line and the boards hub note rewritten to section 6 of `docs/boards/ENGINE_PLAN.md` (#81, #97, #100, #102
  closed as replaced; #95, #101 through T-16 and T-17; ten finished as they are). **The sustainability task's** `due` moves
  from 2026-12-02 (packages 1 and 2, done) to 2026-12-31, its next open box (the compaction after the December packs).
- **2026-11-23 (Crowns given by hand, migration_v100, Claude Code)** — Sam: "Give [one account, by its leaderboard name]
  50,000 crowns". Every way to crowns until now pays XP too (a prize pays as many crowns as XP) or is worked out from XP and
  rank, so a new kind: `crown_gifts`, one row a gift, which `sh_wallet` adds to what was earned (`gifts` in its answer) and
  nothing else reads; `sh_gift_crowns(visitor, key, crowns, note)` gives one once per key, to the id that remains when
  devices are linked, and updates the Crowns board row at once; a trigger moves a linked device's gifts. Closed to visitors:
  only an agent (through the connector, when Sam asks) or Sam (the SQL editor) gives one. Applied live at about 7:03 pm
  Central on 2026-11-22 (md5-checked before and after), then the 50,000 given: the balance went up 50,000, XP and rank
  stayed. `tools/economy.sql` E3 leaves gifts out of the share spent. `tools/release/xp.js` section 19 tests it. How:
  [game-server](vault/reference/game-server.md).
- **2026-11-22 (Smoother scrolling, and nothing you can see pauses, Claude Code)** — Sam: "Is there a way that we can make the
  performance better for the dashboard when scrolling and in timmys shop and such?", then "I also hate that animations
  pause". The 2026-11-14 fix (BUG-147) made the drawings rest: 8 s of motion, frozen while scrolling or touching, the shop's
  frames 6 s at a time, the place's stage holding while its window scrolled. Measured on a slowed browser, the resting
  was most of the jitter left: each rest and wake restyled every shape in a drawing (`.is-rest svg *`, up to 3,700 shapes,
  40-150 ms each time). Now **nothing on screen pauses**; only a part off the screen, or behind a window that covers it,
  stops, through a rule that names the moving classes (`.is-away :is(...)` in `widget/dash.css`; `lifeWatch` in
  `widget/dash.js`, which now also notices a window that opens after it loads). The **stage** is two stills with its
  beams and sparkles between them and its crown and confetti over them, each in a box the compositor moves (`fx()` and
  `stage({ part })` in `tools/figures/site/stage.mjs`; `stageSvg`/`stageFx` in `widget/dash.js`). The **shop's** frames,
  storefront and mystery box are drawn in the page, not as moving images (`live()`/`watch()` in `widget/shop.js`; `shopLife` is
  gone). The **place card's** moving picture is its own layer (`widget/place.css`), the place's stage no longer holds
  (`stageLife` is gone), and the hot-air balloon lost an empty moving group that redrew the page on every frame
  (`tools/figures/site/place.mjs`; the art build now fails on one). Under a 4x slower processor a second scroll of the
  dashboard with everything moving takes about what `main` took with everything frozen (20/24 ms a frame on phone/laptop,
  `main` 19/20). This cloud browser has no graphics card, so the compositor's share couldn't be measured: check on a real
  phone. [motion-cost](vault/reference/motion-cost.md), [decisions](vault/decisions.md).
- **2026-11-22 (Review of Systems against the professors' slides and recordings; Ask Timmy reads one course, Claude Code)** —
  Sam uploaded the courses' slides and some recordings' transcripts. One reviewer per part checked it and wrote a proposal
  (exact edits, new questions, hints, retirements, calls for Sam), merged in order, slides before recordings:
  Cardio & Respiratory (CR-1 to CR-5), Renal (RN-1 to RN-5, with Dr. Herr's recordings), MSK & GI's GI parts (MG-1 to MG-3),
  Fundamentals I (F1-1 to F1-9) and Fundamentals II (F2-1 to F2-8) ([the task](vault/tasks/done/2026-11-22-review-of-systems-from-the-slides.md);
  ten decks were too big or too old to read: on 2026-11-23 Sam gave three as PDFs (the heart anatomy deck, Dr. Herr's
  foregut and abdominal wall decks), F1's endocrinology and Histology 4 were checked against the Heme & Endo and MSK hubs,
  and the rest are left to the study guides). 1,126 questions to 1,369, High-yield points 18 to 169 (all what a professor
  said to know), High yield topics 316 to 383, 554 questions now on the slides.
  Errors fixed against the slides, gaps filled at both note levels with cram lines, new questions with every choice's why,
  the professors' "know this" as High-yield points with their words, what they said to skip left out with nothing saying so
  (Sam, 2026-11-23: "dont include a note saying 'dont memorize'"; the 50 deemphasize points the reviewers wrote came out and
  [the rule](vault/rules/dont-ask-what-professors-skip.md) changed), the twelve conflicts settled from current references
  (Sam: "use outside sources to decide the content calls": [decisions](vault/decisions.md)), sources
  named in each part's `from` and questions' `src`. Questions only added, none retired (ids in
  `tools/question-ids/review-of-systems.txt`). Content grew to about 245k tokens for Ask Timmy, past his 200k limit; Sam: "I
  dont want to sacrifice the quality of the material just so we can have ask timmy", then "have Timmy only read the course
  the student is in". **Ask Timmy's course mode** (`supabase/functions/timmy/core.js`): on a hub with `groups`, every
  question gets one course's notes, tables, cram sheet, High-yield points and topics (`COURSE_NOTE`,
  `part(lecs, { scoped: true })`; no course known, every course's cram sheet, `CRAM_NOTE`), about 36-87k tokens with the rules and site help (under the 100k prompt where Haiku 5.5's
  price goes up fivefold), cached an hour per course, the whole content only on "not covered". The course is the answered
  question's, the lecture on screen's, or what the page names (`context.course`, `askCourse()` in `widget/hub-timmy.js`:
  the Question Bank's course when one is picked, else the notes last opened). `tools/timmy/test.mjs` checks each course's
  prompt under 95,000 and the mode itself; the smoke test checks the chat names the course; the eval has 8 `rs-` cases.
  Deploys itself after the merge (After merge: Ask Timmy's function changed). The page's download budget
  (`tools/release/budgets.json`) went from 1,500 to 1,800 KB (Sam: "a budget raise is fine"): about 1,605 KB with the slides, drawn by about 2.7 s. The
  real-model eval wasn't run (Sam: "dont worry about the eval, its a waste").
- **2026-11-22 (The exam-eve boss, the Midnight Plaque, idea board #4, Claude Code)** — Sam set the idea Planned ("This could
  be fun. Maybe have an xp + gold crowns reward"), then, on the PR's numbers: "open it from 3pm to midntight, hp is good, pay
  is good, he can also have a card below the today card on the question bank". The night before every exam in `hubs.js`, 3 pm to midnight Central, one
  boss per hub with 3,000 HP: every right answer anyone gives in the hub is a hit; if it falls before midnight, everyone who
  landed a hit gets 250 + 25 a hit, up to 1,000, XP and crowns (one `xp_awards` row, key `eve:<hub>:<day>`, src `boss`).
  **`migration_v97.sql`** (applied by the merging session on 2026-11-22 at about 11:46 am Central; **replaces no function**): the table `eve_bosses`
  (closed to anon), `get_eve_boss`, the count (`sh_eve_count`: the answers `record_answer_v2` already writes, from an id
  found by a binary search on the primary key, at most once every 20 s, under a try-lock: no hot row and nothing new in the
  answer save) and pg_cron's `sh-eve-boss` every 10 minutes, which settles it after midnight. Seeded with Review of
  Systems' Dec 2 and Dec 9; after that the After merge workflow's new **`eves`** step writes each exam's eve on every push
  that changes `hubs.js` (`eveBoss: false` skips one, `eveBoss: <hp>` sets its HP). The page (`widget/eggs.js`): asks only
  on an eve (and the exam's morning, for the result), every 30-38 s while it's up and in view, never in a mock, with the
  boss switch off (Focus mode) or in a quiet spell; a band under the bar (the regular boss stays away that night), a card on
  Home (`[data-eveslot]`, `widget/hub.js`) and a smaller one under Today in the Question Bank's side column
  (`[data-eveslot="side"]`, `widget/hub-bank.js`; the column now scrolls on its own when it's taller than the window), the win's confetti and reward card (`sh:prize` src `eve`) or the loss's toast; a
  line on the dashboard's hub panel from the dates alone (`widget/dash.js`). New art: `tools/figures/site/eveboss.mjs` (six
  states, the Santa hat; `eveboss-sheet.mjs` draws its contact sheet) built into `widget/hub-art/eveboss.js`, fetched on
  first use. About page, the Extras switch's line, [game-server](vault/reference/game-server.md),
  [after-a-merge](vault/how-to/after-a-merge.md), the hub note and two inbox lines (check the rows once applied; read the
  first eve's result on Dec 3). `tools/release/xp.js` section 14f, `rls.js` and `tools/after-merge/test.js` cover it.
- **2026-11-22 (The weekly pennant: idea board #6, `migration_v98.sql`, applied, Claude Code)** — Answer 100 questions from
  Monday to Sunday (Central), in any hub and any part of it (xp_days.n: practice, drill, mock, arcade, Learn; not
  flashcards), and Timmy gets that week's pennant, with `week` 500 XP and as many crowns (Sam: "lets do 100, the rest looks good"; the idea said 50). Server:
  `week_pennants` (a row per person per week, made once), `claim_week_v2` (the page asks after the 100th answer's reply; the
  server counts again), `get_my_week_v2` (this week, the class count from 5, the pennants earned), `sh_week_sweep` (pg_cron
  `sh-week-pennants`, Mondays 1:17 am Central: the ones the page didn't claim), a `visitor_links` trigger; `sh_prizes`,
  `sh_is_prize` and the `xp_awards` src check gain `week`. Nothing in the answer path changes. Page: the count is
  `shPet.week()` in `widget/pet.js` (Timmy's days, so no request), the server read at most every 30 minutes (`sh_week` on
  the device); Home's Today card (`weekRow`, `widget/hub-rewards.js`), the dashboard's You card (`pennantStat`, asked only
  after the first scroll or tap), the reward card's pennant badge, and Timmy's place (`widget/place.js`): the newest flies
  from the lamp post (own place only, never a visit), a Pennants view, a panel row. Art: `tools/figures/site/pennant.mjs`
  (`window.SH_PENNANT` in `widget/hub-art.js`: the month's felt and badge, the week of the month as stars, the school year's
  sleeve; 209 Mondays checked by the build; `pennant-sheet.mjs` draws a contact sheet), the lamp's pennant in `place.mjs`.
  Linked devices are one person: the claim, the read and the sweep count and pay under the main id. Every function is
  PL/pgSQL. Tested: `tools/release/xp.js` 14g, `rls.js`. About page entry. The merging session applied the migration on 2026-11-22 at about 11:15 am Central.
- **2026-11-22 (No printing on the one-page sheet, Sam, Claude Code)** — Sam: "lets take away the print/pdf download option".
  `widget/sheet.js` draws the sheet on screen only: the Print or save as PDF button, its "Fits on one sheet of paper" line, the
  printed copy (`body > .shp`, `fit()`, `sheet:print`) and `widget/sheet.css`'s `@page` and print rules are gone; Practice is
  now the sheet's main button, the toolbar's One-page sheet button has the cram sheet's icon (the `print` icon is out of
  `tools/figures/site/icons.mjs`), and More's wording no longer says "to print". `tools/ci/smoke.js` checks every sheet's cram
  lines on screen and fails if printing comes back. About page and Ask Timmy's site help, event taxonomy, retention, repo
  map, hub note and [decisions](vault/decisions.md). Same PR as Review of Systems' violet (#537).
- **2026-11-22 (Review of Systems in its own violet, BUG-198, Claude Code)** — the hub had drawn in the engine's default
  grey-purple (`--hub: #6b5a68`) since it was built: `widget/hub.css` never had its tint line, and #523 had taken out the
  archived hubs' lines. One line adds it (ink `#6b46a8`, mid `#a58ad6`, light `#e8e0f5`, dark `#b9a2ec`, as in
  `tools/figures/site/style.mjs`): buttons, the active tab, the countdown, icons, course headings and the one-page sheet's
  accent are violet, as its emblem, masthead and dashboard card already were. Contrast: ink 5.35:1 on its light, dark 7.72:1
  on the dark panel. `widget/site.bundle.css` rebuilt; no `sw.js` bump (styles are network-first). Found while building #536;
  shown to Sam before and after (Home, Notes, a sheet, light and dark). [build-a-hub](vault/how-to/build-a-hub.md) and the hub note say a new engine hub needs
  its own line.
- **2026-11-22 (a mystery box in Timmy's shop, Studying now to visit, and the Crowns board, idea board #9, Claude Code)** — From the idea board's "Drip for Timmy", which Sam set Planned. **The box** (`migration_v99.sql`, applied live by the merging session at about 16:45 UTC that day and appended to `supabase/schema.sql`): `get_mystery_box` and `open_mystery_box` (one call, idempotent on its request id, under the per-visitor lock); 750 crowns for a random piece you don't have from the everyday rotation, up to 3 a Central day, the odds by rarity on the box before you open it (40/30/18/9/3, a finished rarity's share shared out over the rest), nothing charged when nothing is left. It writes a `pet_purchases` row of kind `box`, so the wallet is unchanged. `widget/shop.js` draws it above Today's picks with its odds, a sheet with the odds table, and the opening (the box shakes, the lid comes off, the piece and its rarity's burst); new art in `tools/figures/site/shop.mjs` (contact sheet from `shop-sheets.mjs`). **Studying now**: `get_studying_now` (a ping in the last 3 minutes, any hub; only people who picked their own name for the boards; name, visit key, rank and medals; a count of the rest; about 2 ms a call) behind a third leaderboard tab on the dashboard (refreshed every minute while shown) and a list under Timmy's place in a hub's More; a visit from either goes through the list with the place's arrows. **The Crowns board** (Sam: "Replace study streaks with crowns balance"): the dashboard leaderboard's Study streaks tab is now Crowns, the top 10 by Shiny Gold Crowns on hand; `get_crowns_board_v2` reads a new cache, `crowns_board`, filled by the pg_cron job `sh-crowns-board` (every 2 minutes, `sh_crowns_refresh(8)`, at most 2 s a run; the whole class in about 45 minutes after the migration), and works out the caller's own balance live. No function replaced. Smoke checks for all three, `tools/release/xp.js` section 18, the preview's fake server, the About page, the event taxonomy (`shop:box:<rarity>`, `dash:board=now|crowns`) and [game-server](vault/reference/game-server.md). Sam approved the price, the odds, the limit, the tail and who shows as built.
- **2026-11-22 (A one-page sheet for every lecture, idea board #5, #536, Claude Code)** — Sam's note on the idea ("do you actually
  want to print this or just have the cram sheet and likely topics/hints all together?") is answered with one thing that does
  both. **`#notes/<lecture>/sheet`** on every hub on the engine: the lecture's cram lines, its High likelihood topics
  (strongest evidence first, with each `basis`) and its Exam hints (a "You can skip" part for `deemphasize` ones), word for
  word from `study.json`'s `cram` and `hints` and `core.json`'s `likelyTopics`; on a hub of courses (`hintsFrom: "courses"`,
  Review of Systems) High-yield topics, High-yield points and "Said not needed". **Print or save as PDF** calls the browser's
  own print window: the printed copy is its own block (`body > .shp`), Letter in two columns with half-inch margins, and
  `fit()` sets its type from 10.5 pt down to 7 pt until it measures one page against a 10-inch ruler inside it (so the text
  size setting's zoom doesn't change the answer), at draw time, once the fonts are in and on `beforeprint`; the print rules
  hide the rest of the page and force light colors in dark mode. All 70 Review of Systems sheets fit at 10.5 pt; a made-up
  lecture with 48 cram lines fits at 8.25 pt, and 72 goes to two pages at 7 pt, each matching a Letter PDF's page count.
  **Not High yield:** High yield is the notes' third reading level, the paragraphs that teach each topic (about 6,000
  characters a lecture, two printed pages or more); the sheet is the list that fits one page, and links to High yield for the
  why. New files `widget/sheet.js` + `widget/sheet.css`, fetched the first time a sheet opens (precached in `sw.js`, `VERSION`
  sh-v73); `widget/hub.js` keeps the route, the button in the notes' toolbar and under each lecture on More → Cram sheet (its
  tile's line too), and `section()` sends `compendium/cram/sheet` (`sh_surface` → `cram`; no migration); time on a sheet
  doesn't count toward the notes' "read it through" timer for Notes done. A printer icon in `tools/figures/site/icons.mjs`.
  Events `sheet:open`, `sheet:print` (on `beforeprint`, so the browser's own Print counts too) and `sheet:hy`. Search is
  unchanged: every line on a sheet was already in it. `tools/ci/smoke.js` checks every lecture's sheet on the laptop (its
  cram lines all on the printed copy, no sideways scroll, gone after leaving) and prints the one with the smallest type to a
  Letter PDF, which must be one page; a sheet that needs two even at 7 pt is a note. About page, Ask Timmy's site help.
  Found on the way: Review of Systems' violet tint was never added to `widget/hub.css` (BUG-198, not fixed here).
- **2026-11-22 (no new recordings; the change log split by month, Claude Code)** — Package 5 of
  [the sustainability task](vault/tasks/2026-11-22-sustainable-for-years.md). `tools/release/secrets.js` (CI's public-repo
  check) now fails any tracked file under `hubs/<hub>/audio/` or named `timmy-time.mp3`, and `.gitignore` leaves both out
  ([no-narration-in-the-repo](vault/rules/no-narration-in-the-repo.md)); the widget's own sounds (`widget/audio/`,
  `widget/sfx/`) are still allowed. This file now keeps a week: `node tools/deploy-notes/trim.mjs` moved the 309 entries
  dated before 2026-11-15, unchanged and in order, to `DEPLOY_NOTES-2026-11.md`, `DEPLOY_NOTES-2026-10.md` and
  `DEPLOY_NOTES-2026-09.md` (593 KB → 192 KB here). Grep `DEPLOY_NOTES*.md` for the whole log; every note that said to grep
  this file says so now. The lessons audit runs the trim again.
- **2026-11-22 (An archived hub's answers packed away, `migration_v96.sql`, Claude Code)** — Package 2 of
  [the plan for years](vault/tasks/2026-11-22-sustainable-for-years.md) (Sam's D). 30 days after a hub's page comes down
  (`hubs_down`), the nightly retention job (`sh_pack_answers`, about 20,000 answers a night, oldest hub first) replaces each
  person's `personal_answers`, `answer_xp`, per-answer `xp_awards` and `xp_seen` rows for it with one `answers_packed` row
  (answers, right, questions, first tries right, latest right, days, first and last answer, medal, XP and crowns, each
  day's share, the retries report's counts) and one award row `pack:<hub>:<id>` with the same XP. A person's answers on a
  hub go together, once the newest is over 30 days old. Nobody's XP, crowns, rank, trophies, medals or board place moves:
  `sh_xp_rebuild` adds the packed days and keeps the pack rows and their days' 20th-answer awards; `first_seen` (the class
  name), `get_hub_mastery` and the admin page's Insights, retries, drift check and check-ins read the summary; Link my
  devices moves it (a trigger on `visitor_links`). Tested in `tools/release/xp.js` section 16 (every made-up visitor
  before and after, a rebuild, a second run, a link) and `retention.js`. About page: what is kept. Applied 2026-11-22 (8:20 pm
  Central on 2026-11-21, Sam's call), md5-checked, with trials on the live data first; Genetics (1,907 answers) and
  Hepatobiliary (9,974) packed, then compacted: the database 293 MB, `personal_answers` 84 → 69 MB, `xp_awards` 27 → 19 MB
  (the task's Log). Most hubs come due about 2026-12-19; their compaction is a box in the task.
- **2026-11-22 (Shorter windows for the analytics, `migration_v95.sql`, Claude Code)** — Package 1 of
  [the plan for years](vault/tasks/2026-11-22-sustainable-for-years.md) (Sam: "Okay all that is good to me"). `hubs_down`
  (hub, the Central day its page came down) is written by the After merge workflow's `down` step (`tools/after-merge/run.js`;
  a page added back takes its row out) and filled in for the 12 hubs already down. The nightly retention job now rolls a
  down hub's question health into `question_events_daily` (`sh_retention_hub_down`, a hub at a time), keeps who tapped what
  30 days (90 before) with a daily roll-up first (`ui_click_reach_daily`, people, no ids), and rolls feature events up at 60
  days (180 before). `tools/retro.sql` and `tools/lessons-daily.sql` read the roll-ups; `tools/release/retention.js` checks
  every step (XP and crowns the same before and after); the About page's "How long it's kept" says the new windows. Applied
  2026-11-22 at 01:03 UTC (7 pm Central, Sam's call with nobody studying) by the session handling the merging: its first
  run rolled up 129,939 question-health rows and 19,358 click rows, then the tables were compacted (360 MB → 319 MB).
- **2026-11-21 (Patient Box: decay seen from the buccal, Claude Code)** — Sam's "Yes" to the drawn cheek-side view showing
  fillings and decay ([decisions](vault/decisions.md)). `widget/cases.js` draws a buccal lesion where the chart puts the gingival
  margin: a cervical crescent (a chalky white spot, or a brown cavity in a chalky rim), arrested lesions brown and rimless, root
  caries on a root exposed by recession, recurrent caries at a Class V's, veneer's or crown's buccal margin, and an incisor's
  proximal lesion as a gray shadow through the labial enamel (sources: Fejerskov's Dental Caries, ICDAS II, Nyvad and Fejerskov
  1982, Banting, Sturdevant's, Mjor 2000). New caries fields `stage`, `arrested`, `root` and buccal `recurrent`, with validate
  rules (root caries needs recession, a white spot is enamel, nothing primary on a veneered surface); `rests: ["caries"]`; the
  view's restorations rechecked (a Class II box now shows as a sliver at the outline; a lingual surface no longer draws a
  labial Class V). Old cases validate and their films draw as before. CI's records in `tools/ci/cases.js`; example
  `v21-buccal-decay` with `v21-ex-5`; `sw.js` sh-v72. No live hub has dental cases, so students see nothing yet.
- **2026-11-21 (A hub's restyle when the widget's stylesheet goes in, about 40 ms shorter, Claude Code, #525)** — The hub bundle puts `widget/v3.css` in as a `<style>` once the page is drawn, and the browser restyled every element for it: one rule set the class-picks fill color (`--sh-cp-fill`) on `:root`, and a custom property new to the root changes what every element inherits. It is set on `.sh-cp` now, the one element that reads it. On `perf.js`'s slow phone putting the sheet in went from about 58 to about 21 ms; Review of Systems' blocking time, about 237 to about 156 ms (medians of 10 alternating runs; budgets unchanged). Nothing looks different (every element's computed style compared, light and dark). `tools/release/perf.js` no longer has Chromium keep a copy of every response for DevTools (`Network.enable` with no buffers; Sam: "Yes if you think so"); it moved no page's numbers past their run-to-run spread, so the budgets stay. Also: Perio's five screens out of the a11y baseline, and `a11y.js`'s usage line names `review-of-systems`. Left: the inbox line "Cut `widget/v3.css` to the rules a hub on the engine draws".
- **2026-11-21 (Back to a random name on a linked device; the game layer's last fallbacks out, #523, Claude Code)** —
  BUG-196's follow-up: `migration_v94` (applied live 2026-11-21, 8:09 am Central, md5-checked) adds `name_custom` to
  `get_widget_bootstrap_v2` (true when `visitor_names` has the id's row), and `nameFromServer` in `widget/v3.js` and `widget/dash.js` drops the device's copy when it's false, so "Go
  back to a random name" on one linked device reaches the other (before, the other kept the random name as one it had
  picked). The fallbacks for a database without the game layer came out: `widget/v3.js` always asks for
  `get_widget_bootstrap_v2` and never switches to the old answer calls (`GAME.want` is gone, `GAME.on` is never false);
  `widget/ranks-hub.js` reads only `get_rank_profile_v2`, `widget/ranks.js` only `get_trophy_stats_v2`, `widget/replies.js`
  only `submit_survey_v2`; the preview (`tools/preview/runtime/preview.js`) no longer answers the old names. The five
  archived hubs' tint lines left `widget/hub.css` (and Perio's darker ink), and `widget/eggs.js`'s VT323 fetch for pages
  without `shx`. The `shx` class stays (the preview's pill and the figure builds select it). Nothing students see, except the
  random name now following. `tools/release/xp.js` checks the flag; `tools/ci/quiet.js` passed.
- **2026-11-21 (Patient Box v2.1's clinical calls settled from outside sources, Claude Code)** — Sam: "Use outside sources to
  determine answers" to the questions v2.1's review left. Radiopacity on a film now follows mm-Al studies (Pekkan 2011, Atala
  2019, Erzurumlu 2021, Hitij and Fidler 2013, Balci 2023): zirconia nearly as bright as metal, composite about enamel's or a
  little more, lithium disilicate between dentin and enamel (nearer dentin), feldspathic porcelain (a PFM's, a ceramic inlay's)
  about dentin's, a veneer a faint extra layer (`widget/cases.css`). A molar's access cavity flares to the occlusal instead of
  narrowing, and an incisor's `L` composite on a root-filled tooth is drawn as its access, not a Class V. `validate()`: a
  root-filled tooth needs its access restored (a crown, or a restoration with O on a posterior tooth or L on an anterior one; a
  veneer alone fails: Ray and Trope 1995); a stainless steel crown only on a molar (AAPD 2026); a vertical root fracture on an
  untreated, unrestored tooth only on a molar marked `vital: true` (Liao 2017, 2021). A gold onlay's cusps are reduced 1.5 mm,
  a ceramic one's 1.8 (`widget/teeth.js`). The odontogram's pontic: its root crossed out with a full-length X, and a key entry
  for it (and, on a phone, room between a lower quadrant's name and a bridge's bar). Kept, with sources: short fill > 2 mm, 4-5 mm of gutta-percha under a post, calculus's size, the box floor, no
  horizontal root fracture on the view. `tools/ci/cases.js` checks the new rules; the four examples and Perio's eleven old cases
  still pass. Sources in `widget/cases.js`'s header and [draw-a-patient-box-case](vault/how-to/draw-a-patient-box-case.md).
  `sw.js` VERSION sh-v71.
- **2026-11-21 (No test run can reach the class's data, BUG-197, Claude Code)** — `tools/ci/quiet.js`'s mock check still wrote
  two question-health rows per run into Review of Systems (22 on the evening of 11-20). Found behind a recording proxy: a
  request still waiting in a Playwright route when its page closes is sent on to the network, and the check closes its page
  right after acting out a hidden one (whose keepalive `record_qh` flush was sometimes still in its route on a busy runner).
  `tools/ci/no-leaks.js` now also launches the test browser behind a proxy that refuses everything off 127.0.0.1;
  `quiet.js` and `smoke.js` use it. Test code only; nothing students see.
- **2026-11-21 (A name changed on one linked device shows on the other, BUG-196, Claude Code)** — Sam: "When you change
  your name on one device it doesnt change on the other linked device. Its still saying 'welcome count plaqula'". Linked
  devices share one id, so the server already had the new name, but each device kept its own copy (`sh_display_name`) and
  showed that first, forever. Now the dashboard (`widget/dash.js`) and a hub (`widget/v3.js`) take the bootstrap's
  `display_name` when the device has a name of its own that differs (`nameFromServer`), except when that device's own rename
  hasn't reached the server: a name saved there is marked `sh_name_unsaved` until the server answers, and a page that loads
  with the mark set sends it again instead of taking the server's older one; nor when the rename was made after the bootstrap
  was asked. A device with no name of its own keeps showing the server's as before. The hub's "Good to see you" and Timmy's
  hello (`widget/pet.js`) wait for the bootstrap, at most 3 s, so they say the new name. No migration. Checked with a scripted
  browser on stubbed data: on `main` the second device still said "Good to see you, Count Plaqula."; with the fix, the new
  name, and an unsaved rename is sent again rather than lost. About page (Link my devices), `site.json`, bundles. Left on the
  inbox: going back to a random name on one device shows that random name on the other, which then treats it as picked.
- **2026-11-21 (Patient Box v2.1: crown materials, endodontics, fractures, bridges; cleaner fillings and calculus, Claude Code)** —
  Sam: "more possibilities like endodontically treated teeth, fractured teeth, and different crown materials... when theres a
  filling, the lines dont look clean and accurate. Also calculus looks bad." `widget/teeth.js` draws restorations from the
  crown's own outline (`restoParts`, `prepMM`, `recurMM`, `ponticMM`, `PREP`): smooth walls, rounded line angles, flat
  floors 2.8 mm under the contact, a softer edge for composite and ceramic. `widget/cases.js` adds crowns by material (gold,
  PFM, zirconia, lithium disilicate, SSC), inlays, onlays and veneers, overhangs and open margins, recurrent caries, posts and
  cores, fill quality, a separated instrument, a missed canal, a widened PDL, the `fracture` module (crown, cusp, crack,
  vertical and horizontal root) and the `bridge` module, on the film, bitewing, full-mouth series, chart, view and
  odontogram, with their checks (a VRF on a vital unrestored tooth is an error) and three new `rests` (`endo`, `fracture`,
  `resto`; a crack never rests on a film). Calculus is redrawn: a small irregular spur on each proximal root surface on
  films, a tan band on the view's cervical third that tapers off up the papillae. An art and code review on the same branch:
  an uncrowned root-filled tooth shows its access cavity (filled with its restoration's material) and gutta-percha wall to wall,
  the palatal root's too; the overhang, open margin and recurrent caries (by depth, and on the root under a crown) redrawn;
  the cusps over an occlusal restoration enamel to the outline; a ceramic inlay's cement line; zirconia brighter than enamel
  and lithium disilicate about enamel's; the bridge materials checked (no SSC bridge), class names built from data
  whitelisted. v1 records draw as before except for v1's amalgam (now the O outline, its cusps enamel) and calculus. Two new examples (`v21-bridge-post`,
  `v21-trauma`) in `tools/cases/examples.json`; `sw.js` `sh-v70`. No live hub has cases, so students see nothing yet.
  How: [draw-a-patient-box-case](vault/how-to/draw-a-patient-box-case.md); what's left:
  [the next steps](vault/tasks/2026-11-20-patient-box-v2-next-steps.md).
- **2026-11-21 (the old analytics compacted, Claude Code)** — The last part of the retention schedule: `migration_v93.sql`
  (pending until applied after the merge). The nightly job collapses `activity_hourly`, `activity_visits` and `question_events`
  older than the school year (365 Central days, a day a night, the first about 2027-09-13) into `activity_daily`,
  `activity_visits_daily` and `question_events_daily` (people counts, no ids). What the collapsed hours paid in time crowns is kept
  per visitor first (`activity_time_kept`, capped pings), and `sh_time_crowns` adds it, so no balance moves; linking devices moves it.
  `question_feedback` goes when a hub's page comes down: the After merge workflow's new `down` step, and a data fix for the five
  hubs already down. Sam's answers on the two question-health rows are in `vault/decisions.md`. `tools/release/retention.js` checks it.
- **2026-11-20 (The ModuPro's and the Loupes' rank sets, Claude Code)** — Every full rank-up of the later two journeys now gives an outfit and a yard piece, as the Handpiece's do: 28 drawings in `tools/figures/site/packs/ranks.mjs` (listed in `sets.mjs` `RANKS`, gtier 7-20, Stone to Dark Matter in each journey), 28 catalog rows in `migration_v91.sql` (applied through the connector at the merge, 2026-11-20), the outfits in a new `widget/hub-art/outfits/journeys.js` so `outfits.js` stays its size, and a locked one reads "Reach ModuPro Gold" (`RANKS` in `widget/place.js`). The ModuPro's are the sim lab's (a half-carved stone molar, a brass articulator, a casting machine, an instrument tray, a golden dental chair, a giant diamond bur, a nebula in a bell jar); the Loupes' are things to see by (a sundial, a brass telescope, an armillary sphere, a microscope, a lighthouse, a prism, an observatory), their outfits clear of the loupes and headlight. `tools/release/xp.js` checks forty rank rows and every later tier; `pack-preview.mjs ranks:modupro|loupes` draws one journey's sheet. [Task](vault/tasks/2026-11-12-redesign-later-journeys-rank-sets.md).
- **2026-11-20 (Patient Box v2.0: the tooth library, modules, new views and checks, Claude Code)** — The Patient Box v2
  package ([task](vault/tasks/done/2026-11-06-patient-box-v2-modular-cases.md)). `widget/teeth.js` is the tooth library
  (`window.SH_TEETH`, `require()` in Node): the Wheeler table and outlines moved out of `widget/cases.js`, plus a catalogue
  entry for all 32 teeth (surfaces, named roots, furcation entrances, trunk, sites, landmarks, films). The kit reads it;
  `widget/hub.js` loads it before `cases.js` (hub bundle rebuilt), `sw.js` precaches it (`sh-v69`). Cases can be built
  from modules (`missing`, `restoration`, `caries`, `endo`, `bone`, `bop`/`pus`/`plaque`, `recession`) with `full: true`
  for a whole mouth; new views `odontogram`, `bitewing`, `fmx`; films draw caries, composites and periapical lesions; a
  case without a `box` gets its rows from the record (`hub-bank.js` shows them). New checks: impossible combinations,
  `checkFigs()`, answerable-from-what's-shown (`rests`) and quoted numbers (`says`), all in `node tools/ci/cases.js`, which
  also checks the library and `tools/cases/examples.json`. The arcade's Stage & Grade tile draws its molar from the library
  (it goes into `widget/hub-art/perio.js` if Perio's page returns; #512 stopped building art for pages that are down). Perio's eleven old cases still draw identically. No live hub has dental cases today,
  so students see no change; what's left: [next steps](vault/tasks/2026-11-20-patient-box-v2-next-steps.md). Then an art review (a second agent): restorations drawn by their surfaces (Class I-V outlines), composite a shade under enamel, caries along the DEJ, a periapical lesion as a widened PDL with the lamina dura gone, bitewings in Class I occlusion, a full-mouth series at true film sizes, an odontogram one row per quadrant on a phone with color-blind-safe marks, and the library's enamel and pulp (`dejPts`, `pulpPts`) in every film and the arcade tile; a calculus-mirroring bug fixed on films, and a root-filled tooth may be restored with any restoration.
- **2026-11-20 (The arcade on a small phone, and visiting from its board, Claude Code, [#508](https://github.com/smcmurry6-source/study-hubs/pull/508))** — No live hub has an arcade, so Heme & Endo Exam 3's six games (git, `b0057d1`) were opened and started on today's widget at 320 px with XX-Large text. Fixed in `widget/games.css`: the dark panel bled past the page's 16 px gutter (every game scrolled sideways 6 px); Lab Sort's bins split `1fr 1fr`, so "Hypothyroidism" pushed one off the screen; the crossword sized its cells from `100vw` (too wide under the text size's zoom) and its clue column from 200 px; The Yellow Body's marquee cut its title and its long intro hid Play below the fold; and in `widget/games.js` Showdown's column headers show only the lecture's tag on a small phone (the full name as their title). `tools/ci/smoke.js`: the 320 px check starts every game of a hub with an arcade, and `visitCheck` taps a name on Smile's game-over board (a visit opens, Escape gives focus back, a dead key says so); both skip while no live hub has an arcade. The hubs' own lobby in `content/arcade.js` is unreachable on the engine: [build-a-hub](vault/how-to/build-a-hub.md) says to leave it out of the next one.
- **2026-11-20 (A hub's last long tasks after Home, Claude Code, [#513](https://github.com/smcmurry6-source/study-hubs/pull/513))** — On `perf.js`'s slow phone: `widget/v3.js`'s notes-layout fitter (`fit()`, `scan()`) starts in the next frame instead of inside the script that loads the widget, where it forced the whole page's layout right after v3.css went in; the synced answers (`SH_SYNC.merge`) redraw only the parts of Home whose markup changed (`refreshHome()` in `widget/hub.js`: the quick starts, Where to next, the progress line and each lecture's row carry a `data-hp`, their markup from the last draw is kept and compared as text, and the redraw runs in its own task), and `paintMeters()` (`widget/hub-rewards.js`) writes a meter or the Today panel only when its markup changed; `notes.json`, `questions.json` and `variants.json` are parsed a few lines at a time (`parseSteps()`, about 15 ms a step, falling back to `JSON.parse` for a file laid out another way; `tools/ci/syntax.js` checks every engine hub's files against `JSON.parse`). Review of Systems' blocking time: about 475 to about 415 ms (`tbt` budget 700 to 650). Left on the to-do list: the restyle after v3.css goes in, and `perf.js` counting DevTools' response buffering.
- **2026-11-20 (Zoom for the anima figures on a phone, Claude Code)** — Their in-drawing labels shrank to 6-8 px at 390 px. `widget/hub.js` now wraps the figures kit's `ANIMA.mount()` once (`figZoomWrap()` in `needFigures()`), so every figure the engine draws (notes, the bank, Learn, Flashcards, Review) gets a Zoom button under its drawing when it is shown at less than 85% of its viewBox width; it opens a full-screen view (`.hx-figzoom`, styles in `widget/hub.css`) with the figure's own `.anima` element moved in and back, at its drawn width (+ to 1.5x and 2x, Fit), the drawing scrolling sideways in its plate. Checked on Heme & Endo Exam 3's L17 figures from git (labels about 7 px before, 12-13.5 px zoomed; steps and tap-a-part still work; Esc returns focus; nothing on a laptop). Counted as `fig-zoom:<figure>`. No live hub has anima figures today, so it waits for the next ones. About page and [diagrams-anima](vault/rules/diagrams-anima.md) updated.
- **2026-11-20 (More ways to earn crowns, Claude Code, `migration_v92.sql`)** — Sam: "yes want more ways to earn crowns", then "Yes and backpay" to the list in study days. Seven prizes, each one `xp_awards` row with a key that pays once and as many crowns as XP: the first Tooth Fairy 250, the first Golden Tooth Fairy 500, a Golden Probe won 300, a perfect mock (20+, all right) 750 once per hub, yesterday's misses all right 100 a day, an idea shipped 500, the first answer after a week away 200. New calls `claim_fairy_v2`, `claim_golden_probe_v2`, `claim_misses_v2`; `sh_session_finish`, `sh_streak_step` and `admin_set_idea` pay the rest; the old egg calls pay too. Back pay in the migration: first fairy catches, every Golden Probe won, each hub's first perfect mock. `widget/eggs.js`, `hub-bank.js`, `v3.js` (`PRIZES`, the names), the About page, `tools/release/xp.js` section 14e ([game-server](vault/reference/game-server.md)). Applied live 2026-11-20 at about 6:45 pm Central, md5-checked: back pay went to 42 first fairy catches, 58 Golden Probe wins (29 people) and 8 perfect mocks (7 people), 33,900 XP and crowns in all.
- **2026-11-20 (CI's two flaky failures, Claude Code, #506)** — BUG-195: the smoke test's `petFrom()` tries its `route.fetch()` twice and reports a reset as a problem line instead of crashing the half. BUG-194: the dashboard's What's new "More" (`.dx .dx-wn-more`) is 28 px tall at least, so it never measures under 24 on a small phone; bundles rebuilt. Review of Systems' a11y baseline entries were already in (#503): ticked.
- **2026-11-20 (What the old pages' cleanup left, Claude Code, #512)** — Follow-up to #496; nothing students see changes. (1) `tools/figures/site/build.mjs` writes `widget/hub-art/<hub>.js` only for a hub whose page is up (`hubs/<hub>/index.html`) and `generic` (the dashboard's masthead for a hub with no art), and deletes the rest (`--check` fails on one left): the six files for Occlusion, Perio, PCD Implants, Heme & Endo 2 and 3 and Special Patient Care are gone; their tints and emblems stay in `hub-art/dash.js`. (2) The stylesheets' `html.shx` prefix (`hub.css`, `dash.css`, `study-modes.css`, `trophies.css`, `shop.css`, and the CSS in `prize.js` and `tour.js`) is now `:root`, so no rule waits on the class any more. Stripping it bare was tried first and changed the pages (the rank name lost its metal, Timmy's bubble and the question pin buttons restyled): the prefix is what lets the design system win over the shared widget's own styles, so it stays as `:root` (shared-infrastructure says so). Checked by every element's computed style on the dashboard and 13 hub views, light and dark, laptop and phone, against `main`: no difference. (3) `widget/pet.js` always reads `get_pet_days_v2` and `widget/replies.js` always `get_my_inbox_v2`: their `live` and `v2` options and the fallbacks to the calls from before the game layer are out, and so are the preview's answers to `get_pet_days` and `get_my_inbox`. (4) The tools' old-page branches: `tools/release/a11y.js` (an old hub's modes), `lib.js`'s `isEngine()` (with its use in `tools/ci/syntax.js`), `tools/ci/cases.js`'s `pcases` block in a page, `tools/ci/preview.js`'s three old answer calls, and the `window.SH_EXPORT = {` line in `AGENTS.md` and verify-before-pushing.
- **2026-11-20 (The cleanup the old single-file pages held up, Claude Code, #496)** — Sam: "lets go ahead and take down all old pages". With the last of them down (2026-11-19), the shared code stops carrying them: `widget/ranks.js`, `ranks-hub.js` and `rankup.js` lose the `NEW` (`html.shx`) gates, so there is one trophy list (27) and one look for the cards (the old cards, `unlocks()`, the old rarity line, `HOUSE` and the old trophy-stats read are gone); `widget/pet.js` loses the old house picture (`houseSvg`, `houseDeco`, the `sh:rank` redraw, `shPet.house`, its use of `sh_rank_tier`): the "you" card draws a blank frame the size of the picture until Timmy's place has drawn over it, as before; `widget/dash.js` calls the game layer's `_v2` functions with no fallback (`rpc2` is one line, `sendForm` has no old call, `V2` and `missing()` are gone); `hubs.js` loses `legacy` and every hub's unused `modes`, and its readers: `dash.js`'s `LEGACY`, and `widget/trophies.js`'s shelves, which are now the hub you're in, the live hubs and any hub you've won in; an idea from an old hub's exam check-in, which `post_idea` refuses for a hub with no answer keys, is sent again as an idea for all hubs (`widget/ideas.js`). `tools/ci/smoke.js` loses the old-hub walk, the `OLD` hub's checks (bowling, the shop, Timmy, 23 trophies and the old cards' markup, `LIVE_CARDS`), the "without the game layer" dashboard check and the lint's exemption sets (`WHY_EXEMPT`, `FORMAT_EXEMPT`, `WHICH_EXEMPT`, `LIKELY_EXEMPT` and the grandfathered lectures, all for hubs whose pages are gone); its BUG-116 check (a card after a level-up still plays) moved to the engine hub. `tools/figures/site/build.mjs` and the design page drop the old houses. No widget file was found that no page loads (`review/` keeps the full client; the per-hub art left over is on the inbox's to-do). Bundles rebuilt.
- **2026-11-20 (Lessons refresh: the Heme & Endo Exam 3 retrospective, its recap, its audio off and its page down, Claude Code)** — Sam, the morning of the exam: "Hematology is over. You can do what you need to do". The audit wrote Exam 3's retrospective in `LESSONS.md` (88 people, 169 h, half Exam 2's: the hub got one evening, the afternoon of the Perio final, 74% of its time; first tries 67%, the lowest of any hub; Dr. Herr's study guide page 38 people and its On the study guide filter 34; two two-statement items near zero on first tries, a word-swap trap the plain MCQ on the same fact doesn't have), published its recap to the dashboard (`tools/publish-recap.js`, Sam's standing OK; featured `ll-num-bsx`), and took its narration, the study guide's recording and Timmy Time off the site ([archived-hubs-drop-their-audio](vault/rules/archived-hubs-drop-their-audio.md)): 23 mp3s and 22 words files (283 MB; the site 327 → 44 MB, no audio left on it), `"audio": "off"` in `hubs/heme-endo-exam3/content/core.json` (the build emptied `hyAudio` and set `guideAudio` false), and Listen, Timmy Time and the `podcast` out of its `hubs.js` entry. Then its page (Sam: "Yes come down. Merge"): `hubs/heme-endo-exam3/` removed (in git at `b0057d1`), `hubs.js` archives it at 9 am on 2026-11-20 (`archiveOn`) with its check-in still from 10 am, `sw.js` `sh-v68` with Review of Systems alone, CI's figure check for it dropped, the About page's Exam 3 entries rewritten without it (the arcade table now names the six games, not one hub's) and Ask Timmy's site help rebuilt; the tests that ran on its page run on Review of Systems (`tools/ci/quiet.js`, `tools/release/admin-ui.js`, the a11y baselines, Ask Timmy's dashboard questions), and the smoke test's game-layer wiring check waits for the next hub with an arcade (the inbox). Found reading question health: `tools/ci/quiet.js`'s mock checks, run from branches older than `tools/ci/no-leaks.js`, wrote two `pq-` rows each into the class's question health (13 made-up visitors, 6 rows in Perio); today's `quiet.js` sends nothing past its routes (checked behind a proxy that refuses every request), and `tools/data-fixes/2026-11-20-quiet-test-rows.sql` takes them out after the merge (BUG-192). Also: the Perio final's later check-ins (29: About right 23), Live signals and the game economy rewritten (median study day about 950 crowns in exam week, the median wallet 11,140, 12% of crowns spent; Sam's "prices are good for now" stands), the data-quality report read (the inbox), `vault/home.md`'s hub list brought up to date.
- **2026-11-20 (The gold card over the report-reply pop-up, and the large-text retests, Claude Code, [#497](https://github.com/smcmurry6-source/study-hubs/pull/497))** — On a phone a report-reply pop-up (`.sh-reply`, z-index 10001, at the top under the bar) covered the gold reward card (`.hx-prizes`, 45) so only its first line showed; on a laptop from about 870 to 1,250 px the pop-up (bottom right) covered the card's right end. `widget/prize.js` lifts the card to 10004 for its few seconds (under a phone's toasts, 10005, which drop in under it). Bundles rebuilt. Retested on `main` (a28cb13) with the preview's made-up data: BUG-190 (Timmy's Shop, an item's sheet and Ask Timmy at X-Large and XX-Large) and BUG-191 (Home's Timmy Time card at about 900 px), on the dashboard, Review of Systems and Heme & Endo Exam 3 (the Timmy Time card on Heme & Endo Exam 3 only: Review of Systems has none): both retested (done).
- **2026-11-20 (A hub's work after Home in smaller pieces, Claude Code, [#498](https://github.com/smcmurry6-source/study-hubs/pull/498))** — On `perf.js`'s slow phone, `exportSections()` in `widget/hub.js` builds the search index a lecture or chart group at a time (`exportSections(pace)`, steps of about 25 ms; without a pace it runs at once, as `tools/timmy/test.mjs` calls it), `widget/fx.js`'s `fillBars` measures every bar before animating any, once a frame (an animation started between two measurements laid the page out again for each of Home's bars), `widget/v3.js`'s `fit()` reads before it writes and skips unchanged values, `widget/hub-rewards.js` fits the rank pill once a frame, and `fmt()` keeps one `Intl.NumberFormat`. Review of Systems' blocking time went from about 920 to about 490 ms (`tbt` budget 900 to 700), Heme & Endo Exam 3's from about 430 to about 230. What is left: the inbox line "A hub's three remaining long tasks after Home".
- **2026-11-20 (The ModuPro hand-off: the typodont eats the Handpiece, Claude Code)** — Sam, after the Loupes one: "I think instead I want the modupro to basically eat the handpiece and then replace it". `modupro()` in `widget/journeys.js` is a new scene, about 9.5 seconds to its button (timeline `MP` above it): the Dark Matter III Handpiece in its purple space; the screen darkens and rumbles; the typodont (the same Wheeler crowns, gum and plates) comes in from above and below with its jaws wide open around the Handpiece (`labFx.jaw(m)`, sized by `jawK()` so its mouth is wider than the medallion: on a phone its back teeth go off the sides); its mouth glows purple and dust and stars stream in (`labFx.pull`, `labFx.suck`, particles that end at the mouth); the Handpiece shivers and is sucked in (`shj-suck`), then the canvas draws it inside the mouth behind the teeth (`labFx.swallow`, the medallion as an image from `shRanks.artOf`); the jaws snap shut (`close()`: a flash along the bite, a ring, the canvas shakes, 90 metal shards and Dark Matter sparks spray from the corners of the mouth); two chews with crumbs (`chew()`), a gulp (`gulp()`), and it folds into the ModuPro medallion (`morph()`) as the sim lab's light comes on. The reward box is unchanged (+20,000 crowns, the Handpiece's trophy, "Collect 20,000 crowns"); Skip, Esc and reduced motion as before. Gone with the old version: the spin-up to 400,000 RPM (the counter and the whirl), the lunge and the rush of light, the teeth flying into place, and their styles and code. About page, the design page's caption, Ask Timmy's site help, the site changelog line.
- **2026-11-20 (The Loupes hand-off: the headlight's sunbeam, Claude Code)** — Sam: "a unique one for reaching loops [the Loupes] ... turning on the light of the loupes acts like some kind of sunbeam and like destroys the Maju Pro [the ModuPro], and then the loupes take its place". Finishing the ModuPro now plays its own scene in `widget/journeys.js` (`loupes()`, `lpHTML()`, `.shj-lp`), about 9 seconds to its button, in place of the shared hand-off (`handoffHTML` and `placeFly` are gone, with their styles): the Dark Matter III ModuPro under its nebula; the loupes, drawn big from the kit's own drawing (`lpSvg()`, `SH_JOURNEY_ART.shape(2)`, in polished metal), come down over it; the headlight clicks on and flickers, the lenses catch it; a thin beam (`.shj-sun`, a child of the loupes so it moves with them) grows into a sunbeam with rays in it while the screen dims around it and dust turns in the light (`labFx.motes`); the ModuPro trembles, goes white-hot (`.shj-heat`), cracks (`crackSvg()`) and throws embers (`labFx.embers`), then burns away (`labFx.burn`: embers drawn as sparks and dark ash with glowing edges, pulled up into the light; a warm flash, shock waves, the screen shakes) and the ModuPro's nebula gives way to the Loupes' sky; the loupes come down into its place, turned and sized as the medallion draws them, and the Loupes medallion forms around them, a glint across each lens. Until it rises the stage is scaled up to fill the screen (`--zoom`, at most 1.6; the caption keeps its own size), and nothing scrolls while the waves and the beam reach past the screen (the sky's slow zoom is clipped in `.shj-bg`). Then the reward box as before: +30,000 crowns, the "ModuPro finished" trophy, "Collect 30,000 crowns"; Skip goes to the last frame, Esc closes, reduced motion gets the last frame. The canvas is in front of the scene until the words start, then behind them, so the coins fall behind the text as in the other scenes. The Dark Matter unlock already played on every journey (`trackJourney` in `widget/ranks.js`, once per journey, `dark_seen`); unchanged. About page, the design page's caption, Ask Timmy's site help, the site changelog.
- **2026-11-20 (The ModuPro hand-off redrawn, and crowns for reaching a journey, Claude Code)** — Sam, of the first cut below: "the modupro animation with the pink gingiva and all looks bad. the model is inaccurate. the teeth are not anatomic, the molars look like they are spiky and not cusps. i also dont like the screen shatter", then "10,000 crowns for reaching modupro", then "we can upp modupro to 20,000 and then loupes to 30,000". In `widget/journeys.js`: no more crack and shatter: at `--imp` the handpiece lunges at the screen, the space behind it zooms away and `labFx.rush()` throws streaks of light out from the middle, faster and faster, and at `--arr` the sim lab comes in (`is-lab`, its light after it). The typodont is `TYPO`: Wheeler's crown sizes and facial outlines (copied from `widget/cases.js`'s `crownMM`, the Patient Box kit), each tooth set between its contact points on an average maxillary or mandibular arch and projected from 26 cm in front, so the back teeth turn away and narrow as in a frontal photograph; a turned-away tooth's cusps are flattened in proportion (`face`), which is what made the first cut's molars spikes; 32 teeth, a Class I bite with 2.5 mm of overbite in front and the curve of Spee; the gum follows each cervical line with a papilla in every embrasure, root bulges over the front teeth and shadowed ends, on two plates. Before they land, every tooth's outline glows on the empty gum like a blueprint (`slot`), then the teeth fly in, the bite, the fold into the medallion as before. The reward: `paying()` gives both hand-offs (the ModuPro's and the Loupes', which keeps its scene) the Dark Matter unlock's reward box, the crowns counted up with a fountain and a rain of coins and the finished journey's trophy, and a gold "Collect 20,000 crowns" / "Collect 30,000 crowns"; Skip on the Loupes' hand-off now goes to its last frame too. On a 568 px-tall phone the line and the trophy's row make room so the frame fits. `migration_v89.sql` (**applied live 2026-11-20 at about 7 am Central**, before the merge, through the connector in one call, md5-checked before and after; `supabase/schema.sql` has it) adds `sh_prizes()`'s `modupro` 20,000 and `loupes` 30,000 and the wallet's terms (gtier 7 and 14, once each, crowns only, back pay), `widget/v3.js`'s PRIZES, and `tools/release/xp.js` checks both. About page, the design page's caption, Ask Timmy's site help.
- **2026-11-20 (The hand-off to the ModuPro, its own scene, Claude Code)** — Sam, after the new Dark Matter unlock: "looks good. now we just need something absolutely bananas when you rank up to modupro. completely unique and epic". `widget/journeys.js`'s `handoff()` plays `modupro()` for `to: 1` (the Loupes keep the hand-off of 2026-11-12), about 9 s to its button: the Dark Matter III Handpiece spins up (an RPM counter 0 to 400,000, a whirl faster and faster, grinding sparks off its head, a growing tremble), lunges at the screen, the glass cracks from where it hit (`--imp`) and shatters into falling shards (`--brk`), revealing the sim lab under its overhead light; the typodont's base and gums slide in, its 28 teeth (front view, incisors to second molars, drawn from four crown shapes) fly in from everywhere and snap into their arches, the jaws bite down (`--chomp`: a flare along the bite, sparks, a quake), and the typodont folds into the ModuPro medallion (`--slam`), which rises to its place (`--rise`); then the road, "The ModuPro is yours." word by word, the seven new ranks and the trophy, as before. The moving parts are one canvas (`labFx`). Skip jumps to the last frame; Esc closes; reduced motion gets the last frame; `still("handoff", { to: 1 })` (the design page) is the new one. About page and the design page's caption updated.
- **2026-11-20 (The Dark Matter unlock, redrawn, and 5,000 crowns for reaching it, Claude Code)** — Sam, after watching the old scene: "these feel too similar to any other rank. lets make it significantly more epic and rewarding feeling. also reaching dark matter gets you 5000 crowns. be sure to put that on the rank up screen". `widget/journeys.js`'s Dark Matter unlock is a new scene, about 8.5 s to its button: dust streams into the Diamond III medallion and a disk spins up around it, rings close in, it trembles harder and collapses into a point, a beat of dark, then a detonation (flash, three shock waves, a quake, the journey's sky, rays, the Dark Matter medallion slamming in and rising from the middle of the screen to its place, a slow ring of light around it), "Dark Matter" letter by letter with one sheen, and the reward: **+5,000 Shiny Gold Crowns** counted up with a fountain and a rain of coins, the Handpiece's two Legendary pieces for Timmy's place, the class position when the profile has it (`widget/ranks.js` passes it), and "Collect 5,000 crowns" (the coin flies up as it closes). The moving light is one canvas (`cosmos()`), the rest transform and opacity. Skip now jumps to the last frame (the reward stays); Esc still closes; reduced motion gets the last frame. Fixed with it: in the still frame the rays and glow painted over the medallion (it lost its transform; now positioned). **`migration_v89.sql`** (applied live 2026-11-20, see above): `sh_wallet` adds 5,000 for each journey's Dark Matter reached (gtier 6, 13, 20), from the first XP, so it is back pay for anyone already there; `sh_prizes()` has `dark` and `widget/v3.js`'s `PRIZES` its copy; `tools/release/xp.js` tests it. About page, the design page's caption and Ask Timmy's site help updated.
- **2026-11-20 (CI upkeep: After merge's canceled runs, Node 24 actions, the About page's a11y, Claude Code)** — **After merge** no longer drops a push whose run was canceled while waiting (three merges close together): a push run starts where the last push run that wasn't canceled ended (`--since-last-run`, `coverFrom()` in `tools/after-merge/run.js`, `actions: read`; 10 new cases in `tools/after-merge/test.js`; checked on the real history, run 97 would have covered #467's canceled run 96) ([after-a-merge](vault/how-to/after-a-merge.md), "Merges close together"). Every workflow's actions moved off Node 20: `actions/checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `github-script@v9` (their scripts use only `github.rest` and `github.paginate`, which v9 keeps). `tools/release/a11y.js` checks the About page in dark mode and at 390 px with the spoilers shown (axe, the keyboard, motion), both at 0 in the baseline. Nothing students see.
- **2026-11-20 (The admin page's first read of a new key no longer times out, Claude Code)** — the inbox's "An admin read
  the kept copies don't have yet still times out" ([#495](https://github.com/smcmurry6-source/study-hubs/pull/495)). `migration_v90.sql` (**applied live 2026-11-20 at about 6:35 am Central** through the connector, md5-checked before and after; `supabase/schema.sql` has it; v89 is #492's):
  `sh_admin_cached` no longer works a read out inline when `admin_cache` has no row for it (live, insights 4.1 s, Perio's
  question health 3.6 s, over a visitor's 3 s, and the error rolled the new row back so the job never saw it): it inserts
  the row empty for `sh-admin-cache`, the admin functions answer `{"pending": true}` (or no rows) and
  `get_admin_cache_status` says `pending`. `review/index.html` says "Being worked out" under the view's title (Insights and
  Question health in the view too) and redraws when it has come. `tools/release/admin-ops.js` checks it (a first read slower
  than the limit answers at once); the preview gets a `pending` setting ([preview-a-change](vault/how-to/preview-a-change.md)).
- **2026-11-20 (No more plain dark toasts: every message is a sticker, Claude Code)** — Sam: "it still seems like there are a lot of boring black plain toasts. lets fix all the remaining ones". **`widget/toast.js`** (`window.shToast(msg, kind | { kind, title, icon, ms, sticky, action })`, run first in `hub.bundle.js` and `dash.bundle.js`, after `hub-art.js`) draws every short message as a sticker in the gold reward card's family (`widget/prize.js`): a white card with the ink outline and drop, a round badge with the kind's icon and color, a small heading, the words, and a bar that runs down while it stays (longer for longer words, 3.2-7 s); a tap closes it, a mouse over it holds it, the same words tapped twice restart the one already up, at most three at once. Kinds: tip, wait ("One moment"), err ("Oops"), sync, ok, notes, focus, achv ("Achievement unlocked") and streak ("On a roll", with a sunburst and shine), nuke, egg, hi ("Welcome back"), timmy, update (stays, with a Reload button), info; a message without one is guessed from its words (a hub's `arcade.js` passes none). On a laptop the toasts move up above a reward card that's up, on a phone down under it (`--hxt-lift`), still under the bar on a phone (BUG-126). Still with reduced motion or Answer animations off (`hx-still`): a fade, no bar. Styles: `.hx-toast` in `widget/hub.css`, dark mode included. **Moved onto it:** every `toast()` in `widget/hub.js`, `widget/dash.js`, `widget/hub-rewards.js` (an achievement), `widget/guide.js` and `widget/hub-timmy.js`, each with its kind; `widget/v3.js`'s `showStreakToast` (the 5-in-a-row cheer, Tactical nuke ready, Welcome back, now "Good to see you, Sam.") and its "This hub has been updated." bar; the dashboard's "A newer version of the hubs is live." pill (`.dx-update` gone from `widget/dash.css`); `widget/pet.js`'s "Timmy is off". The dark pill and bar stay in `v3.css` and `pet.js` only for a page without `toast.js`. **Also:** the XP flight after an answer (`.xpfly`) is a white sticker chip now, not a dark pill, and the tour's "No problem, the tour is right here" note (`widget/tour.js`) is a sticker with the tour icon. Untouched: the easter eggs' toasts (`widget/eggs.js`, already white cards with their own art) and the gold reward card. `node tools/release/perf.js --page index.html`: the dashboard 338 → 342 KB of its 346.
- **2026-11-20 (A survey asks each person once, not each device, Claude Code)** — Sam: "Surveys are asking once per device", then "Once per person". `migration_v88.sql` (**applied live 2026-11-20 at about 5 am Central**, right after the merge, as v88a-d through the connector, one statement each; the live bodies md5-checked against the file. After it, a new device is still asked, none of survey 4's 65 respondents is, and none of the 38 ids left behind by Link my devices is: before it, all 38 would have been, though none is still in use): `get_active_survey` (the pop-up, the bootstrap's `survey_popup`) and `get_my_survey` (the Inbox, `survey`) look across the person (the id that remains in `visitor_links` and every id linked to it) instead of the one id asking, in PL/pgSQL. Link my devices already moved a device's rows and gave it the remaining id, so the gap was a device still on an id linked away from, and rows written under one. Devices never linked are still two people to the server, so the dashboard's survey pop-up has a line under Send: "Already answered it on another device? Link this device and it won't ask again" (`widget/dash.js`, `.survey-link` in `widget/dash.css`): it closes the window without recording anything and opens Link my devices (`link:open=survey`). On survey 4, read 2026-11-20 at 4 am: 65 rows (30 answers, 35 Laters), none of them two rows for one linked person. `tools/release/xp.js` 14c: 14 checks (a new device asked, a linked device on the old id not, an answer or a Later under an alias id, the Inbox until an answer). About page (Surveys), event taxonomy.
- **2026-11-20 (Review of Systems: High yield, not exam hints, Claude Code)** — Sam: "exam hints for old exams are not exam hints for review of systems", "they do indicate higher yield content, however", then "Everything" when asked how far. A hub whose quotes and predicted topics come from the courses it reviews sets `"hintsFrom": "courses"` in `core.json` (Review of Systems does): `widget/hub.js` (`courses()`, `hintsName()`, `likelyName()`) says **High-yield points** for Exam hints (Home's link, More's tile and page title, the search group) and **Highest-yield topics** for Most likely questions; `widget/hub-bank.js` says **High yield** for High likelihood (the Only toggle, filter tags, the card's tag and its why: "it tests a topic its course stressed", "What it rests on, in its course"); High yield's intro says "Only what the courses stressed most"; `widget/ask.js`'s starter asks "What's highest yield here?"; and Ask Timmy's server labels them the same and is told they don't predict the mocks (`supabase/functions/timmy/core.js`). The hub's `SH_HUB.hints` words and banner say where they come from. Other hubs are unchanged. `exportSections()` keeps "Exam hints" and the caller renames it, because `tools/timmy/test.mjs` runs that function alone.
- **2026-11-20 (The database pass's phase 3 applied live, and its readout, Claude Code)** — `migration_v84.sql` (the bootstrap and the sync send only the answers the device doesn't have; Timmy's days read one day) applied at about 2:40 am Central through the connector, md5-checked before and after, the API answering as before; `supabase/schema.sql` has it. The readout of Heme & Endo Exam 3's eve (6-10 pm Central): 21,648 requests, the answer save 31% of the database's time at 45 ms a call (55% at 106 ms before the pass), 3 failed saves of 4,706, all in one minute of a CPU stall; the database 353 MB, `xp_seen` 33 MB. The optimization pass is done: [its note](vault/tasks/done/2026-11-18-database-optimization-pass.md).
- **2026-11-20 (migration_v83 applied live: the admin page's heavy reads worked out ahead, Claude Code, [#487](https://github.com/smcmurry6-source/study-hubs/pull/487))** — #456's migration went in at 1:35 to 1:47 am Central, one statement a call through the connector, with the class quiet and no failed request; all 24 functions it writes match a throwaway copy (md5), pg_cron's `sh-admin-cache` runs every minute, and a visitor can't reach the table, the helpers or the tick. 15 reads kept (Insights' three, question health for Heme & Endo Exam 3 and Perio, visitors, clicks and features for 7, 30 and 90 days, check-ins). Live, working them out takes several times what the copy said (insights 4.1 s, Perio's question health 3.6 s, clicks up to 3.2 s), so the kept copies matter more than measured; a read the table doesn't have yet still times out (inbox). `supabase/schema.sql` has v83; v84 went in after it the same night (#488). Notes: `vault/tasks/done/2026-11-18-database-load.md` (Log), `vault/reference/admin-operations.md`, `tools/lessons-refresh.md`.
- **2026-11-20 (The study guide folds too, Claude Code)** — Sam: "yes make the study guide fold too". Heme & Endo Exam 3's study guide page (`#notes/guide`, `widget/guide.js`) folds each item, the "Also stressed in class" ones and Key terms, under its lecture, with Collapse all in its toolbar (kept as `guide/<lecture>` in `sh_fold:<hub>`). `widget/hub.js`'s fold is now `foldParts(parts, el, stop)`, shared through `HX` (`foldBtn`, `foldParts`); a topic's body stops at the guide's Practice buttons (`.gd-acts`). Its readable text is unchanged, so `guide.mp3` still matches. Fixed with it: search's Key terms results jumped to the first "Also stressed in class" heading (`exportSections` counted only the items before Key terms); `SH_GOTO` now opens the item it lands on.
- **2026-11-20 (Topics in the notes fold, Claude Code)** — Sam: "make the individual topics collapsible in the notes". In every hub on the engine, each top-level heading of a lecture's notes (As taught's and Plain English's `h4`s, High yield's numbered `h3`s with their why line) gets a button laid over it that folds its topic, down to the next heading, and the toolbar's **Collapse all** / **Expand all** turns the lecture into a list of its topics (`foldTopics()` in `widget/hub.js`, styles in `widget/hub.css`; a lecture with fewer than two topics doesn't fold). The heading's words stay put and the button has none (`data-sh-noread`), so highlights (keyed on the notes' text, checked unchanged), Follow along and the device's voice read the same words. A folded body is `hidden="until-found"` (find-in-page opens it where the browser has it; `hub.css`'s `.hx [hidden]` rule is lifted for it only there, `.nt-find`); `SH_GOTO` (search, Ask Timmy, Open this in the notes) opens the topic it lands in, Follow along opens one when the reader is following or seeks into it, and the device's voice opens it as it reads (`widget/v3.js` sends `sh:reveal`). `placeFigs()` looks inside topics. What's folded is kept on the device (`sh_fold:<hub>`, by lecture and heading, so As taught and Plain English share it); only the buttons save. Events `notes:fold`, `notes:unfold`, `notes:fold-all`, `notes:unfold-all` ([event-taxonomy](vault/reference/event-taxonomy.md)); About page's Notes entry. The study guide page (`widget/guide.js`) doesn't fold.
- **2026-11-20 (Rule: nothing a professor said you don't need, in the notes either, Claude Code)** — Sam: "dont include anything that was deemphasized or we were told not to worry about", then "make it a rule for every hub". `vault/rules/dont-ask-what-professors-skip.md` now covers the notes as well as the questions: no level, cram line, table or High likelihood topic teaches a point the professor said to skip, and it isn't used as a wrong choice or in a why. The `deemphasize` Exam Hint ("skip this, know that") stays (Sam: "Keep the hints"). A classmate's or an earlier class's "not on the test" is a lead to ask Sam about. From 2026-11-20 on: Heme & Endo Exam 3 keeps its marked asides until it archives (Sam: "Rule from now on"); Review of Systems was built to it. `CLAUDE.md`'s feature-rule line, `hubs/CLAUDE.md`, home and the podcast skill point at it ([decisions](vault/decisions.md)).
- **2026-11-20 (The Review of Systems hub, and Ask Timmy on the smaller model, Claude Code)** — Sam: "please go through all materials ... keep notes very high yield with a section for each course tested and then sub sections to make it more manageable". `hubs/review-of-systems/` is a new hub on the engine for DENT 2165's two 200-question mock boards (Thu Dec 3 and Thu Dec 10): 14 courses in 70 parts, 1,126 board-style questions (every choice with its why, the special formats per course), 316 High likelihood topics, notes As taught and in Plain English, a cram list and review tables per course; no narration, figures or arcade ([the task](vault/tasks/done/2026-11-19-review-of-systems-hub.md), [hub note](vault/hubs/review-of-systems.md)). **Engine:** `core.json` `groups` puts a hub's parts under their courses (notes list, Home's progress, the bank's lecture picker, whose course row picks all its parts); Home counts down two exams in turn (`SH_HUB.home.byExam`); lecture badges widen for labels like HN-1 (`widget/hub.css`). **Ask Timmy runs on Haiku** (Sam: "we can switch timmy to run on haiku"): this hub's content is about 180k tokens, so `supabase/functions/timmy/core.js` `MODEL` changed, `withModel()` leaves out the fallback and betas Haiku doesn't take, `PRICES` has its rates and the test's size guard is 200k; Sam: "dont worry about testing haiku, just switch timmy to it". Sam's calls from the build (2026-11-20): everything kept but the order of the teeth most often missing after third molars, and nothing the professors de-emphasized in the notes ([decisions](vault/decisions.md)). Its perf budget is set from its size (about 2.5 times a usual hub's questions).
- **2026-11-20 (Heme & Endo Exam 3: the study guide filter without the repeats, Claude Code)** — Sam: "theres still a ton of questions in the study guide high likelihood questions. can we make it higher yield with less redundant questions". Each of the 57 study guide topics in `hubs/heme-endo-exam3/content/core.json` gets `picks`, the questions that ask each point it names once (a numbered, which-statement or EXCEPT item where it covers several; a true/false, case or second wording of a point already asked comes out), and the bank's **On the study guide** toggle and the study guide page's Practice buttons use them: 209 → 115 (L17 15, L18 22, L19 22, L20 27, L21 14, L22 15). `lkBasis()` in `widget/hub-bank.js` reads `t.picks || t.ids`; `tools/hub-next/build.mjs` fails a pick outside its topic's ids and leaves `picks` out of each question's `likely`, so `questions.json`, High likelihood (284) and High yield (and its narration) don't change. Bundles rebuilt.
- **2026-11-20 (Heme & Endo Exam 3: an "On the study guide" filter, Claude Code)** — Sam: "make a filter for heme and endo exam 3 questions that is only the high likelihood questions from the study guide". The Question Bank's **Only** row has a second toggle, **On the study guide**: the questions listed in a `likelyTopics` entry whose `basis` names "study guide" (209 questions, L17 28, L18 42, L19 39, L20 43, L21 30, L22 27; Lecture A has none). The engine's hub toggles (`SH_HUB.bank.only`, `[key, label, spec]`) take a new spec, `{ basis: "..." }`, worked out from `core.json`'s topics on the page (`lkBasis()` in `widget/hub-bank.js`, also `HX.lkBasis`), so no question JSON changed and no answer keys need loading. The study guide page (`widget/guide.js`) gets a **Practice all 209 study guide questions** button under its lecture chips, and each lecture's Practice button there now opens that lecture's study guide questions (`data-lqlk="<toggle>"`, read by `wireLecLinks()` in `widget/hub.js`; tracked `notes:practice-guide`, `notes:practice-guide-all`, `bank:show=guide`). Bundles rebuilt.

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

Since 2026-11-03 the same fix covers knowledge, not just code: rules, decisions, hub notes and tasks live in
`vault/` as linked notes any agent can read and write back to (`vault/rules/repo-is-the-vault.md`).
