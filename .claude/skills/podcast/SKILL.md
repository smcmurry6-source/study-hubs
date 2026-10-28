---
name: podcast
description: Make a Timmy Time episode for a study hub, end to end. Timmy Tooth hosts a last-minute audio review of the hub's exam, written from the hub's own notes, exam hints, cram sheet and review items, with a few new bits of Timmy lore. The skill writes the script, fixes pronunciations, renders the Kokoro voice, mixes the music, wires the episode into the hub, dashboard and About page, verifies everything and ships a PR. Use when Sam says "podcast", "Timmy Time", "/podcast", "make an episode" or "a podcast for <hub>".
---

# Timmy Time: make an episode

Read first: `CLAUDE.md` (the graded-coursework rules apply to scripts too), `tools/podcast/README.md` (how the tooling
works and how to write for Kokoro), `tools/podcast/LORE.md` (the canon), and the most recent `tools/podcast/*/script.md`
as the model for voice and pacing. The argument, if any, names the hub (`/podcast heme-endo-exam1`); otherwise take the
live hub with the next exam from `HUBS` in `index.html`, and say which.

## 0. Set up and ask

- `git fetch origin main` and branch from `origin/main`.
- Ask Sam (one AskUserQuestion call, before writing anything):
  - **Length.** Default about 45-50 minutes, never an hour or more. Rough size, music and lightning-round pauses
    included: 145 words of script per finished minute for plain prose (Occlusion), nearer 125 when the material is full
    of spelled-out letters like T-S-H and A-C-T-H (Heme & Endo: 6,600 words, 53 minutes).
  - **Lore** (multiSelect): offer 3-4 short tidbits that tie Timmy to this hub's material (a disease his neighbor thinks
    he has, a fact about teeth that fits a lecture, the current holiday) and continue `LORE.md`. Never contradict it,
    and never contradict what `widget/pet.js` shows (outfits, the house, the scared face after TIMMY).
- Start the Kokoro setup in the background now (`CLAUDE.md`, "Text and audio must never drift": pip install, then
  `gh release download` or the curl fallback into `/tmp/kokoro`); ffmpeg is preinstalled.

## 1. Gather the material

```bash
node tools/podcast/extract_hub.js hubs/<hub>/index.html <scratch>/src
```

That writes each lecture's As taught notes (with its exam count), `exam.txt` (`EXAM_INFO`, counts, course dates),
`hints.txt` (the professors' quotes, emphasize and deemphasize), `cram.txt` and `likely.txt`. Read all of it. Also read
the hub's in-class review items if it has them (`grep -n 'mcq("rv-' hubs/<hub>/index.html` or its `src:'review'`
questions) and `LESSONS.md`'s live signals for the hub (what the class misses).

Never use graded quiz, take-home or exam content, or anything still open (Canvas quizzes): same rule as the hub.

## 2. Write `tools/podcast/<hub>/script.md`

Copy the header comment from the last script and update it (sources, the exam, the lore added). Structure:

1. **Cold open** (~2-3 min): the greeting, a lore beat, then the exam facts from `EXAM_INFO` (day, time, format, count per
   lecture, where Patient Box items come from), logistics (LockDown Browser, open quizzes due) and how the episode is
   ordered.
2. **One segment per lecture or per gland/topic** (`## N. Title`, these become the chapters), 3-6 minutes each, with
   time roughly in proportion to the exam counts. Each one: what the professor said to know (quote `hints.txt` word for
   word and say it's a quote), the facts behind every `likely.txt` topic, the review items' answers explained, the
   look-alikes the class mixes up, and what was de-emphasized ("you don't need..."). Hooks and mnemonics from the notes.
3. **Lightning round**: 25-35 one-line questions, `Question? [pause 2.5] Answer.` on one paragraph each (the inline pause
   cues the bell). Cover every lecture.
4. **Sign-off**: the plan for the night before and the morning of, a lore callback, the exam time again, and
   "This has been Timmy Time. I'm Timmy. Brush, floss, and ..." with a new ending.

Writing for Kokoro (more in the README): letters read as letters are hyphenated capitals (`T-S-H`, `A-C-T-H`, `G-S`,
`I-G-F one`, never a plain `TSH`); spell out numbers, units, symbols and subscripts (`T-four`, `one alpha hydroxylase`,
`five prime deiodinase`); no parentheses, slashes or abbreviations; short sentences. A hyphenated compound
(`prolactin-releasing`) hides its words from the lexicon, so drop the hyphen or add the whole compound.

Content follows the hub's own notes. Where two sources in the notes disagree (slides vs recording), say both or leave
the detail out; don't pick one. Lore lines must be true too (a tooth fact Timmy says about himself gets checked like any
other fact).

## 3. Pronunciation

```bash
python tools/podcast/render_podcast.py tools/podcast/<hub>/script.md --words
```

It lists every hard word the lexicon doesn't cover with espeak's phonemes, then every sentence holding a heteronym
(close, live, read, use, wound, bow...) with its phonemes in context. For each wrong one, add the exact phonemes to
`tools/podcast/lexicon.json` (copy the style of the entries there: espeak symbols, `ˈ`/`ˌ` stress) or reword the
sentence (`close` the verb read as the adjective: "shut", "have closed"; `use` the verb read as the noun: "bind",
"burn"). Watch drug and hormone names, eponyms (`Chvostek's`, `Trousseau's`), letters that come out as "uh" (`D-H-E-A`
needs a lexicon entry), and words like `GLUT`, `JAK`, `zona` that espeak spells or links. Run it again until clean.

## 4. Fact check, then render

Read the whole script once against the notes: every number, every count, every quote, every lightning-round answer, the
exam facts. Fix before rendering; a re-render costs minutes.

```bash
python tools/podcast/render_podcast.py tools/podcast/<hub>/script.md <scratch>/stems     # ~2.5x faster than real time on 4 CPUs
python tools/podcast/produce.py <scratch>/stems hubs/<hub>/audio/timmy-time.mp3 \
  --script tools/podcast/<hub>/script.md --title "Timmy Time: <exam>"
```

Run the render with `run_in_background` and keep working (wiring, About page); it reads the script once at the start,
so after any later edit re-render just that segment with `--only N --force`, then run `produce.py` again. Check the
result: `ffprobe` duration under the limit Sam gave, `<mp3>.json` chapters in order. Don't commit the json.

## 5. Wire it in

- **Hub**: `window.SH_PODCAST = { id, show:'Timmy Time', title, src:'audio/timmy-time.mp3', duration, blurb, chapters }`
  right before `window.SH_EXPORT = {` (copy `duration` and `chapters` from the json; chapter titles are the `##` titles
  without numbers). A `<div data-sh-podcast></div>` slot where students will see it: on **Home** in hubs that have it
  (under the quick-start row), else at the top of Compendium. `#timmy` must open that mode (boot: `if(location.hash ===
  '#timmy') m = '<mode>'`). In Home's "Also here" list, a `data-sh-podcast-open` link. `widget/podcast.js` does the
  rest (player, dock, menu item, resume, tracking).
- **Dashboard** (`index.html` `HUBS` entry): `podcast:{ name:"Timmy Time", sub:"The last-minute review, NN min" }`
  and "Timmy Time" in `modes`.
- **About page** (`about/index.html`, the Timmy Time entry): where the card sits and the episode list with lengths.
- **`tools/podcast/LORE.md`**: the new tidbits and a row in "Episodes so far". **`DEPLOY_NOTES.md`**: a "Recent major
  changes" line (what, length, sources, lexicon words added, where the card is).
- If the hub has narration, nothing else changes; the podcast is separate from Listen.

## 6. Verify

- `node tools/ci/syntax.js` and the smoke test (`node tools/ci/smoke.js`, Playwright preinstalled: set
  `PLAYWRIGHT_PATH` to the global module) both pass.
- In Playwright on `file://.../hubs/<hub>/index.html#timmy`: the hub opens on the slot's mode, the episode card shows
  the title, length and chapters, the "Timmy Time" link scrolls to it, and pressing play loads the mp3 (check
  `audio.duration`). Screenshot it at 390 px and desktop for the PR.
- Grep that the old episode list on the About page and the dashboard `sub` text match the real length.

## 7. Ship

Commit the script, lexicon, mp3 (tens of MB is fine; never commit stems or the json), hub, dashboard, About page,
LORE.md and DEPLOY_NOTES.md. Push, open a draft PR (student-facing summary, the length, the chapters, the lore added,
the pronunciation fixes), subscribe to it, and fix CI until green. Merge only if Sam said to; otherwise Sam merges.
After merge, log it to the site changelog if `ADMIN_SECRET` is set (`log_changelog`), or tell Sam.
