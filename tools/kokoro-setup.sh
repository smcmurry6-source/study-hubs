#!/usr/bin/env bash
# Installs Kokoro TTS and its voice model for lecture narration (tools/narrate.py) and Timmy Time
# (tools/podcast/render_podcast.py). Both run this by themselves the first time they find Kokoro missing, so a session
# that never narrates never downloads it (Sam, 2026-11-06). Safe to run again: it skips what's already there.
#   bash tools/kokoro-setup.sh          the model goes in $KOKORO_DIR, default /tmp/kokoro
# How-to: vault/how-to/narrate-with-kokoro.md. The model is re-hosted on this repo's release kokoro-model-v1.0, because
# cloud sessions can only download release files from repos attached to the session.
set -euo pipefail
DIR="${KOKORO_DIR:-/tmp/kokoro}"
U=https://github.com/smcmurry6-source/study-hubs/releases/download/kokoro-model-v1.0
python3 -c "import kokoro_onnx, soundfile" 2>/dev/null || python3 -m pip install -q kokoro-onnx soundfile
mkdir -p "$DIR"
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "$DIR/$f" ] && continue
  echo "kokoro-setup: downloading $f to $DIR" >&2
  curl -fsSL --retry 3 -o "$DIR/$f.part" "$U/$f"
  mv "$DIR/$f.part" "$DIR/$f"
done
echo "kokoro-setup: ready ($DIR)" >&2
