---
type: task
status: blocked
hub: widget
created: 2026-11-12
requested-by: Sam
due: 
waiting-on: room on the site (Sam's call on what to make room with) before about 135 MB of new narration
agent: 
pr: 
---

# Kokoro narration for the notes' High yield level (the redesign)

## Goal

The redesign's notes have a third reading level, **High yield** (2026-11-12, `tools/hub-next/high-yield.mjs`, built into
each redesigned hub's `notes.json` as `hy`). Until it has its own narration, Listen reads it in the device's voice. Sam:
"dont worry about generating kokoro for it right this minute. add that as a to do for later", then "you can generate the
kokoro", then, told the size, **"Hold the narration"**. This task records the narration so Listen plays Kokoro (with
Follow along) on High yield like the other two levels.

## Why it's held: the site is near GitHub Pages' 1 GB cap

- On 2026-11-12 the published site (the repo without `.git`) was **960 MB**; GitHub Pages caps a published site at 1 GB.
  The narration is most of it: Heme & Endo Exam 2 173 MB, Perio 161, Occlusion 154, and the archived hubs' 430 MB
  (Heme & Endo Exam 1 124, PCD Implants 102, MSK Exam 4 68, Special Patient Care 58, MSK Exam 3 43, PCD Fixed Pros Exam 3 34).
- High yield for the 21 lectures that have it (Heme & Endo Exam 2's 8, Occlusion's 4 final lectures, Perio's 9) is about
  266,000 characters: about 5 hours of speech, **about 135 MB at the usual 64 kbps** (70 MB at 32 kbps). Either puts the
  site over the cap, and git keeps every mp3 forever.
- The options Sam was shown (2026-11-12): make room first (for example, take down the narration of the hubs whose cards
  are gone: MSK Exam 3 and 4 and PCD Fixed Pros Exam 3, about 145 MB, so their pages fall back to the device voice), render
  at 32 kbps, render at 64 kbps anyway, or hold. Sam picked hold. Removing anything is Sam's call.
- The slow and failed publishes on 11-06 and 11-10 ([shared-infrastructure](../reference/shared-infrastructure.md)) may be
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
- **Text and audio never drift** ([rule](../rules/text-and-audio-never-drift.md)): High yield is rebuilt by
  `tools/hub-next/build.mjs` whenever a hub's notes, predicted topics, hints or questions change, so its narration must be
  regenerated in the same PR whenever `notes.json`'s `hy` for that lecture changes. Add that to the rule and to
  [narrate-with-kokoro](../how-to/narrate-with-kokoro.md) when this lands, and a lint that names a lecture whose `hy`
  changed since its mp3 (for example its text's hash in the words file).
- Narrate only the hubs still on the redesign's list when this runs (a hub whose exam has passed doesn't need it).

## Done when

- [ ] Sam has said how to make room (or that the site may go over 1 GB)
- [ ] `<lecture>-hy.mp3` and its words file for every lecture with High yield, in the hubs still live
- [ ] The engine plays them, Follow along works on them, and the smoke lint checks them
- [ ] The drift rule and the narration how-to cover High yield
- [ ] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [ ] Vault written back (decisions, this note's Outcome, the release note's About draft: "Listen reads High yield too")

## Log

- 2026-11-12: written when High yield was built (redesign only); Sam asked for the narration later, then said to generate
  it, then, shown the size against the 1 GB cap, chose to hold it.

## Outcome

Related: [the redesign release](2026-11-06-redesign-release.md) · [narrate-with-kokoro](../how-to/narrate-with-kokoro.md) ·
[text-and-audio-never-drift](../rules/text-and-audio-never-drift.md) · [shared-infrastructure](../reference/shared-infrastructure.md)
