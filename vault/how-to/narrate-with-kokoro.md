---
type: how-to
tags: [audio]
---

# Narrate with Kokoro

Why this matters: [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md).

**Check first:** `python3 -c "import kokoro_onnx"` and `ls "${KOKORO_DIR:-/tmp/kokoro}"`. A cloud environment's setup
script may already have installed it; then skip to the Python below. This is the setup script for the repo's own cloud
environment (Sam, 2026-11-06): paste it under the environment's Setup script in Settings, with the variable
`KOKORO_DIR=/opt/kokoro`. It runs once per new container (about 70 s; a second run skips what's there) and never stops a
session from starting:

```bash
# study-hubs: Kokoro TTS for lecture narration and Timmy Time (vault/how-to/narrate-with-kokoro.md)
python3 -m pip install -q kokoro-onnx soundfile || echo "setup: pip install of Kokoro failed"
U=https://github.com/smcmurry6-source/study-hubs/releases/download/kokoro-model-v1.0
mkdir -p /opt/kokoro
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "/opt/kokoro/$f" ] && continue
  if curl -fsSL --retry 3 -o "/opt/kokoro/$f.part" "$U/$f"; then mv "/opt/kokoro/$f.part" "/opt/kokoro/$f"
  else echo "setup: download of $f failed"; fi
done
ln -sfn /opt/kokoro /tmp/kokoro
exit 0
```

Kokoro TTS setup (cloud sessions can only download GitHub release files from
repos attached to the session, so the model is re-hosted on this repo):

```bash
pip install kokoro-onnx soundfile
mkdir -p /tmp/kokoro && cd /tmp/kokoro
gh release download kokoro-model-v1.0 -R smcmurry6-source/study-hubs \
  || for f in kokoro-v1.0.onnx voices-v1.0.bin; do
       curl -fL -o "$f" "https://github.com/smcmurry6-source/study-hubs/releases/download/kokoro-model-v1.0/$f"; done
```

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
