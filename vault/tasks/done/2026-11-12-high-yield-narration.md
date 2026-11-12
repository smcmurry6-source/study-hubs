---
type: task
status: done
hub: widget
created: 2026-11-12
requested-by: Sam
due: 
waiting-on:
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/331
---

# Kokoro narration for the notes' High yield level (the redesign)

## Goal

The redesign's notes have a third reading level, **High yield** (2026-11-12, `tools/hub-next/high-yield.mjs`, built into
each redesigned hub's `notes.json` as `hy`). Until it has its own narration, Listen reads it in the device's voice. Sam:
"dont worry about generating kokoro for it right this minute. add that as a to do for later", then "you can generate the
kokoro", then, told the size, **"Hold the narration"**. This task records the narration so Listen plays Kokoro (with
Follow along) on High yield like the other two levels.

## Why it was held: the site was near GitHub Pages' 1 GB cap

**Room was made on 2026-11-12:** Sam had the five archived hubs' audio taken off and every hub's at its archiving
([rule](../../rules/archived-hubs-drop-their-audio.md)): the site went from 958 to 589 MB, so High yield's ~135 MB at the
usual 64 kbps fits (Sam kept 64 kbps). `node tools/ci/size.js` shows the size. What follows is how it stood before.

- On 2026-11-12 the published site (the repo without `.git`) was **960 MB**; GitHub Pages caps a published site at 1 GB.
  The narration is most of it: Heme & Endo Exam 2 173 MB, Perio 161, Occlusion 154, and the archived hubs' 430 MB
  (Heme & Endo Exam 1 124, PCD Implants 102, MSK Exam 4 68, Special Patient Care 58, MSK Exam 3 43, PCD Fixed Pros Exam 3 34).
- High yield for the 21 lectures that have it (Heme & Endo Exam 2's 8, Occlusion's 4 final lectures, Perio's 9) is about
  266,000 characters: about 5 hours of speech, **about 135 MB at the usual 64 kbps** (70 MB at 32 kbps). Either puts the
  site over the cap, and git keeps every mp3 forever.
- The options Sam was shown (2026-11-12): make room first (for example, take down the narration of the hubs whose cards
  are gone: MSK Exam 3 and 4 and PCD Fixed Pros Exam 3, about 145 MB, so their pages fall back to the device voice), render
  at 32 kbps, render at 64 kbps anyway, or hold. Sam picked hold. Removing anything is Sam's call.
- The slow and failed publishes on 11-06 and 11-10 ([shared-infrastructure](../../reference/shared-infrastructure.md)) may be
  related to the size; nobody has checked.

## How to do it, once there's room

- `tools/narrate.py` reads a live hub's `READINGS` / `READINGS_PLAIN`. High yield exists only in
  `hubs/<hub>/next/content/notes.json` (`hy`), so give it a way to read that, the way `tools/narration_words.py` already
  reads `notes.json` (for example `--notes hubs/<hub>/next/content/notes.json --level hy`), writing
  `hubs/<hub>/audio/<lecture>-hy.mp3` and its `.words.json`. Its HTML is the notes' own paragraphs, lists and tables plus
  `h3.hy-t` headings, `p.hy-why` lines and `div.hy-know` boxes, all of which `Spoken` already reads (check with `--text`).
- In `widget/hub.js` (`drawNotes`), `mp3` is empty for High yield: set it to `audio/<lecture>-hy.mp3` when the file exists
  (a flag in `notes.json` from the build, so a page never requests a missing file), and Follow along then works as is.
- The smoke lint's words-file check (`tools/ci/smoke.js`) loops over `full` and `plain`: add `hy`.
- **Text and audio never drift** ([rule](../../rules/text-and-audio-never-drift.md)): High yield is rebuilt by
  `tools/hub-next/build.mjs` whenever a hub's notes, predicted topics, hints or questions change, so its narration must be
  regenerated in the same PR whenever `notes.json`'s `hy` for that lecture changes. Add that to the rule and to
  [narrate-with-kokoro](../../how-to/narrate-with-kokoro.md) when this lands, and a lint that names a lecture whose `hy`
  changed since its mp3 (for example its text's hash in the words file).
- Narrate only the hubs still on the redesign's list when this runs (a hub whose exam has passed doesn't need it).

## Done when

- [x] Sam has said how to make room (or that the site may go over 1 GB): the archived hubs' audio came off (2026-11-12)
- [x] `<lecture>-hy.mp3` and its words file for every lecture with High yield, in the hubs still live (all three, Heme &
      Endo Exam 2 included: Sam, "Narrate it too")
- [x] The engine plays them, Follow along works on them, and the smoke lint checks them
- [x] The drift rule and the narration how-to cover High yield
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Vault written back (decisions, this note's Outcome, the release note's About draft: "Listen reads High yield too")

## Log

- 2026-11-12: written when High yield was built (redesign only); Sam asked for the narration later, then said to generate
  it, then, shown the size against the 1 GB cap, chose to hold it.
- 2026-11-12: unblocked: the archived hubs' audio came off (958 → 589 MB). Render at 64 kbps.
- 2026-11-12: Sam: "do the high yield narration for the redesign"; asked whether to skip Heme & Endo Exam 2 (archived Nov 13,
  before the redesign is likely out), "Narrate it too". Rendered, wired and tested in
  [#331](https://github.com/smcmurry6-source/study-hubs/pull/331); Sam: "merge when ready".

## Outcome

Done in [#331](https://github.com/smcmurry6-source/study-hubs/pull/331), 2026-11-12. Nothing students see changes until the
redesign's release.

- **The recordings:** `hubs/<hub>/audio/<lecture>-hy.mp3` and its words file for all 21 lectures with High yield: Heme &
  Endo Exam 2's 8 (HEME_MB), Occlusion's 4 final lectures (33 MB) and Perio's 9 (57 MB), TOTAL_MB at 64 kbps, the same voice
  as the other levels. The site went from 589 to SITE_MB (`node tools/ci/size.js`). Rendering took about RENDER_MIN minutes
  with all 4 cores (`--jobs 4`).
- **How:** `tools/narrate.py` reads `hubs/<hub>/next/content/notes.json` (`--level hy`), reads a topic's number as
  "Topic 2." and High yield's "·" as a pause, and writes `"h"` (which text it was spoken from) into each words file;
  `--jobs` hands out lectures longest first. `tools/hub-next/build.mjs` lists the lectures whose recording matches
  today's High yield in `notes.json`'s `hyAudio`, and `widget/hub.js` gives only those the recording; the rest read in the
  device's voice. `tools/narration_words.py` keeps `"h"` when it remakes a words file for the same mp3.
- **Checks:** `tools/ci/smoke.js` fails on a High yield recording spoken from another version of its text, names any lecture
  without one (allowed), and checks that each page offers the recording exactly where `hyAudio` says. In a browser, with
  the class's data stubbed: Listen plays each lecture's recording, and at 5 points through Occlusion L9 and Perio S8 the
  highlighted word was the one the words file named; for every recorded lecture, 100% of the narrated words map to a word
  on the page (the only page words never read are table headers, which narration skips).
- **The rule:** [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md) covers High yield. It changes
  whenever a lecture's notes, predicted topics, hints or questions change, so an edit there on these hubs can mean
  recording that lecture's High yield again in the same PR (the rule has the two commands).
- **Left:** Heme & Endo Exam 2's audio, High yield included, comes off at its archiving on Nov 13
  ([to-do](../2026-11-12-audio-off-at-archiving.md)); for a hub on the engine, the release's audio-off box comes first.

Related: [the redesign release](../2026-11-06-redesign-release.md) · [narrate-with-kokoro](../../how-to/narrate-with-kokoro.md) ·
[text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md) · [shared-infrastructure](../../reference/shared-infrastructure.md)
