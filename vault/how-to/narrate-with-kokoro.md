---
type: how-to
tags: [audio]
---

# Narrate with Kokoro

Why this matters: [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md).

**Kokoro installs itself.** `tools/narrate.py` and `tools/podcast/render_podcast.py` run `tools/kokoro-setup.sh`
the first time they find it missing: `pip install kokoro-onnx soundfile`, then the model files into `/tmp/kokoro`
(or `$KOKORO_DIR`), about a minute, once per machine. Sessions don't install it at start (Sam, 2026-11-06: most never
narrate, and a setup script made every one of them wait for the download). To install it by hand, or before your own
Python: `bash tools/kokoro-setup.sh`. The model is re-hosted on this repo's release `kokoro-model-v1.0`, because cloud
sessions can only download GitHub release files from repos attached to the session.

```python
from kokoro_onnx import Kokoro
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin")
samples, sr = k.create(text, voice="af_heart", speed=1.0, lang="en-us")
```

Encode to mp3 (ffmpeg or lameenc). ~20–30 chars/sec on one CPU — for many
lectures, shard the job and skip files that already exist. Keep the job in the
foreground/polled; an idle cloud VM is reclaimed and background work is lost.

**`tools/narrate.py`** does the whole job for a hub whose notes sit in one-line `var READINGS = {...};` and
`var READINGS_PLAIN = {...};` objects (heme-endo-exam2 and hubs built after it), or in perio's one template literal per
lecture (`READINGS['<id>'] = ` then the notes in backticks, since 2026-11-05): it turns each lecture's notes into
spoken text (the "What's tested" box, headings with a pause, tables read row by row, symbols, units and prescription
shorthand spelled out: mg, po, qd/bid/tid/qid, q6h),
uses Timmy Time's pronunciation lexicon (`tools/podcast/lexicon.json`) and writes both mp3s.

```bash
python3 tools/narrate.py hubs/heme-endo-exam2/index.html --lec dmpharm --force
```

`--text` prints what it would say (check a new hub's hard words with it first), `--level full|plain` picks one level,
`--jobs 4` runs lectures in parallel, and without `--force` it skips files that exist.

**High yield** (the redesign's third reading level, since 2026-11-12) exists only in the redesign's
`hubs/<hub>/next/content/notes.json` (`hy`), so give `narrate.py` that file instead of the hub's page:

```bash
python3 tools/narrate.py hubs/occlusion/next/content/notes.json --level hy --jobs 4             # every lecture with High yield
python3 tools/narrate.py hubs/occlusion/next/content/notes.json --level hy --lec nccl --force   # one, again
node tools/hub-next/build.mjs --hub occlusion                                                   # then always this
```

It writes `audio/<lecture>-hy.mp3` and its words file, which records which text it was spoken from (`"h"`, the first 12
hex digits of the SHA-1 of the lecture's High yield HTML). The build lists the lectures whose recording matches today's
High yield in `notes.json`'s `hyAudio`, and only those get the recording (and Follow along) on the page; the rest read in
the device's voice. A topic number is read "Topic 2." and the "·" in "A professor's hint · 4 questions in the bank" as a
pause. High yield changes whenever the lecture's notes, predicted topics, hints or questions do, so record it again then
([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)); the smoke lint names a lecture whose recording no
longer matches. One lecture on a 4-core machine speaks about 50 characters a second (10,000 characters in about 3
minutes); `--jobs 4` manages about 40 a second in all, and the 21 lectures of 2026-11-12 (270,000 characters, 148 MB) took
106 minutes.

**Word timings for Follow along** (since 2026-11-12). The redesign highlights each word as Listen reads it
(`widget/hub.js`), from a `<lecture>-<level>.words.json` beside each mp3: the words as the page shows them and when each is
spoken. `narrate.py` writes it with every mp3 it renders, from Kokoro's own timings (`create_timed`, kokoro-onnx 0.6.1 or
later, which `tools/kokoro-setup.sh` installs). For an mp3 made any other way, or before this, make it from the recording:

```bash
python3 tools/narration_words.py heme-endo-exam2 --lec dmpharm --level full   # one file; without --lec, every narrated lecture
python3 tools/narration_words.py heme-endo-exam2 --check                       # which are missing or stale (no Kokoro needed)
```

It reads the notes from `hubs/<hub>/next/content/notes.json`, predicts where each sound falls with Kokoro's duration model
(cut down to that output, about 20 times faster than speaking; it needs the `onnx` package, also installed by the setup
script), and aligns that to the mp3's loudness; nothing is re-spoken. A minute or two for a 35-minute lecture. Checked against
exact timings: median error 20-40 ms, 96-100% of words within 0.2 s (its docstring has the numbers). Each file it makes
prints how many words start on speech (about 99.5% when they line up); under 97% it says so. Then run it again with
`--render`: it speaks the notes afresh (about a fifth of the lecture's length) and lines the two recordings' spectra up,
which is exact wherever they say the same words, and it names any minutes of the recording that **don't** say today's notes.
Those minutes mean the notes changed after the narration was made: regenerate it with `narrate.py`
([text-and-audio-never-drift](../rules/text-and-audio-never-drift.md)). That is how Perio Session 5's drift was found
(2026-11-12). The smoke test's lint
fails when a redesigned hub's narration has no words file or one made from another recording of it, so a regenerated mp3
needs its words file in the same PR; `narrate.py` already did it.
