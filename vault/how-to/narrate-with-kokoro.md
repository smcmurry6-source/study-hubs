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
