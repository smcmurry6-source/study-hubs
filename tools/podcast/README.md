# Timmy Time: podcast episodes for the hubs

A hub's audio review episode, hosted by Timmy Tooth: a script, a Kokoro voice, synthesized music and mastering.
In the site it's played by `widget/podcast.js` (a hub opts in with `window.SH_PODCAST` and a `<div data-sh-podcast>` slot).

```
tools/podcast/
  render_podcast.py   script -> per-segment voice stems (kokoro-onnx), with lexicon.json for hard words
  produce.py          stems -> finished mp3: voice chain, music, ducking, stingers, loudness; writes <out>.json (chapters)
  lexicon.json        exact Kokoro phonemes for drug/anatomy words espeak gets wrong
  <hub>/script.md     one episode's script
```

## Build an episode

```bash
pip install kokoro-onnx soundfile scipy         # plus ffmpeg on PATH
# Kokoro model in /tmp/kokoro (see CLAUDE.md, "Text and audio must never drift")
python tools/podcast/render_podcast.py tools/podcast/msk-exam4/script.md --check        # read the phonemes first
python tools/podcast/render_podcast.py tools/podcast/msk-exam4/script.md /tmp/stems     # ~10 min on 4 CPUs
python tools/podcast/produce.py /tmp/stems hubs/msk-exam4/audio/timmy-time.mp3 \
  --script tools/podcast/msk-exam4/script.md --title "Timmy Time: MSK Exam 4"
```

Then copy `duration` and `chapters` from `timmy-time.mp3.json` into the hub's `window.SH_PODCAST` (don't commit the json).
Stems are cached: after editing one segment, re-render it with `--only N --force` and run `produce.py` again.

## The sound

- **Voice**: `am_michael:0.6,am_onyx:0.4` (a deep, smooth blend), speed 0.95. Chain: 75 Hz high-pass, warmth at 140 Hz,
  less box at 380 Hz, presence at 3.3 kHz, a softer top, de-esser, 2.5:1 compression.
- **Music** (all synthesized in `produce.py`, nothing to license): a lo-fi theme in D, 78 bpm, FM electric piano,
  sine bass, brushed drums, vinyl hiss. Intro theme, one-bar stingers between segments, a low groove under the lightning
  round with a bell as each answer is revealed, and the theme again under the sign-off. Music ducks about 19 dB under speech.
- **Master**: -16 LUFS integrated, -1.5 dB true peak, 44.1 kHz stereo, 96 kbps.

## Writing a script for Kokoro

- `##` headings are segments (chapters). `<!-- -->` and `#` lines are not spoken. `[pause N]` is N seconds of silence;
  inline pauses mid-paragraph (the lightning round) also cue the answer bell.
- Write letters that are read as letters with hyphens and in capitals: `A-band`, `I-G-G`, `A-T-P`, `type two-B`.
  A plain "A band" reads "uh band", and "ay" reads "eye".
- Spell out numbers, units and symbols; avoid parentheses, slashes and abbreviations.
- Watch heteronyms ("live" was read as the adjective).
- New hard word: add it to `lexicon.json`, run `--check`, read its phonemes.
- Content follows the hub's own notes and exam hints. Graded-course-work rules in `CLAUDE.md` apply here too.
