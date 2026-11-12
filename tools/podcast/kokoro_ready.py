"""Make sure Kokoro is installed before narration or a Timmy Time episode renders.

Sessions don't install Kokoro at start (Sam, 2026-11-06: most never narrate), so tools/narrate.py and render_podcast.py
call ensure() first: when kokoro-onnx (0.6.1 or later), soundfile, onnx or (with model=True) a model file is missing, it runs
tools/kokoro-setup.sh once (about a minute) and carries on. How-to: vault/how-to/narrate-with-kokoro.md.
"""
import importlib, importlib.util, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_FILES = ("kokoro-v1.0.onnx", "voices-v1.0.bin")


def kokoro_dir():
    return os.environ.get("KOKORO_DIR", "/tmp/kokoro")


def _missing(model):
    gone = [p for p in ("kokoro_onnx", "soundfile", "onnx") if importlib.util.find_spec(p) is None]
    if "kokoro_onnx" not in gone:
        try:
            from kokoro_onnx import Kokoro
            if not hasattr(Kokoro, "create_timed"): gone.append("kokoro-onnx 0.6.1 (word timings)")
        except Exception: gone.append("a working kokoro_onnx")
    if model:
        d = kokoro_dir()
        gone += [f for f in MODEL_FILES if not (os.path.isfile(os.path.join(d, f)) and os.path.getsize(os.path.join(d, f)) > 0)]
    return gone


def ensure(model=True):
    """Return the model folder, installing Kokoro first if anything is missing."""
    gone = _missing(model)
    if gone:
        print("Kokoro isn't set up here yet (missing: " + ", ".join(gone) + "): running tools/kokoro-setup.sh, about a minute",
              file=sys.stderr, flush=True)
        r = subprocess.run(["bash", os.path.join(ROOT, "tools", "kokoro-setup.sh")], env={**os.environ, "KOKORO_DIR": kokoro_dir()})
        importlib.invalidate_caches()
        if r.returncode or _missing(model):
            sys.exit("tools/kokoro-setup.sh didn't finish the install; see vault/how-to/narrate-with-kokoro.md")
    return kokoro_dir()
