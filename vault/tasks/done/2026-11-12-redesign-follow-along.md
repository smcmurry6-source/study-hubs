---
type: task
status: done
hub: widget
created: 2026-11-12
requested-by: Sam
due: 
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/323
---

# Follow along: highlight the word being read while Listen plays (the redesign)

## Goal

A survey answer asked to "highlight the words being read when listening to the lecture notes voiceover". Sam, on the
2026-11-11 lessons refresh's For Sam list: "Add the highlight feature to the hub redesign ... Merge when ready"
([decisions](../../decisions.md)). So the redesign's engine highlights each word of the notes as the narration reads it.

## Context

- The engine: `widget/hub.js` / `hub.css`, the redesigned hubs in `hubs/<id>/next/` (Occlusion, Heme & Endo Exam 2, Perio);
  they reach the class at the [redesign release](../2026-11-06-redesign-release.md), which holds the About page text.
- Listen plays pre-recorded Kokoro narration (`hubs/<hub>/audio/<lecture>-<level>.mp3`, [narrate-with-kokoro](../../how-to/narrate-with-kokoro.md))
  through `shTTS` in `widget/v3.js`. Its browser-voice fallback already highlighted words (it speaks them one by one); the
  narration files had no timings.
- Rules: [text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md) (the timings must follow the audio too),
  [preview-and-release-test](../../rules/preview-and-release-test.md) (a `widget/` change: tier 2),
  [learner-data-privacy](../../rules/learner-data-privacy.md) (one new feature event, in the taxonomy).

## Done when

- [x] Word timings for every narration of the three redesigned hubs, without re-speaking them
- [x] The engine highlights the word and its sentence while Listen plays, keeps it in view, and has an off switch
- [x] New narration gets its timings automatically, and CI catches a missing or stale timings file
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`) and the release suites
- [x] Vault written back (how-to, decisions, event taxonomy, the release note's About draft, this note's Outcome)

## Log

- 2026-11-11: Sam approved it ("Add the highlight feature to the hub redesign").
- 2026-11-12: built, measured against Kokoro's exact timings, checked in a browser on a laptop and a phone.
- 2026-11-12: the timings' fit check found Perio Session 5's narration had drifted from its notes; regenerated.

## Outcome

**Timings** (`tools/narration_words.py`): for each narrated lecture and level, a `<lecture>-<level>.words.json` beside the
mp3 lists the words as the page shows them and when each is spoken (hundredths of a second), plus the mp3's size, so a
re-rendered mp3 can't keep old timings. They come from the recording: Kokoro's duration predictor (the model cut to its
duration output with `onnx`, about 20 times faster than speaking) gives where each sound falls in a fresh rendering; each
stretch of speech between punctuation is placed on the mp3's loudness (a coarse DTW, then a Viterbi search per stretch),
then a narrow fine DTW lets words move a little on their own, because the committed narration (11-05 to 11-10) was spoken
with slightly different pauses and pronunciations than today's lexicon gives (a fresh Perio rendering runs 13 s longer).
Measured: against exact timings on fresh renderings of one lecture per hub, median 25 ms, 96-97% of words within 0.1 s, all
within 0.2 s; on the committed mp3s, against a spectral alignment of the fresh rendering, median 20-40 ms, 84-98% within
0.1 s, 96-100% within 0.2 s. All 52 files were made (Heme & Endo Exam 2, Occlusion, Perio, both levels). `tools/narrate.py`
now writes the file from Kokoro's own timings (`create_timed`) whenever it renders an mp3, and the smoke lint fails a
redesigned hub whose narration lacks one or has one from another recording.

**A drift it found.** Scoring every file (the share of words that start where the recording is speaking: 98-100% for all
but three) flagged Perio Session 5 at both levels and Session 3 As taught. Speaking each afresh and comparing the two
recordings' spectra minute by minute: Session 5's middle (minutes 5-9 of Plain English, 6-15 of As taught) didn't say what
the notes say any more, so the notes had changed after its 10-21 narration, against
[text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md). Both were regenerated with `narrate.py` (with exact
timings): the live Perio hub's Session 5 narration now reads the current notes (2 minutes longer in Plain English, 2.7 As taught). Session 3
matched its notes (only its pauses differ), so its mp3 stays and its timings come from the exact way (`--render`: the fresh
rendering's word times moved onto the recording by the spectra; 98.9% of words start on speech, up from 95.4%). The tool
now prints that score for every file and points to `--render` under 97%, which also names any drifted minutes.

**The page** (`widget/hub.js`, "Follow along"): when Listen starts a narration file (`sh:tts-audio` from `widget/v3.js`),
the engine loads the words file, matches its words to the notes' text in order (inline tags don't split a word, block
edges do, figures placed in the notes are skipped), and on every animation frame highlights the word whose time has come,
and its sentence more softly, with CSS Custom Highlights (no change to the notes' DOM, so the student's own highlights and
the narration's resume are untouched). It scrolls to keep the word about a third down the screen while it was on screen,
not for 6 s after the reader scrolls, never to pull them back from elsewhere, and jumps to it after a seek. A **Follow
along** button beside Listen (shown once timings load) turns it off or on (`sh_pref_follow`, tracked as
`notes:follow=on|off`). A words file whose length is more than 2 s off the mp3's is never shown; a browser without
CSS Highlights plays as before. Checked in headless Chromium on a laptop and a phone viewport with the class's data
stubbed: at 2:00 and 10:00 into L11 the highlighted word is the one the file gives, the sentence is shaded, the toggle and
Stop clear it, no page errors.

**Also**: the Listen dock's title no longer repeats a lecture badge hidden from screen readers ("L11L11 · ..."), in every
hub. Left for later: tapping a word to start the narration there.
