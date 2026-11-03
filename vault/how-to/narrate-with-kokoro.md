---
type: how-to
tags: [audio]
---

# Narrate with Kokoro

Why this matters: [text-and-audio-never-drift](../rules/text-and-audio-never-drift.md).

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
