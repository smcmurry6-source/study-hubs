"""Render script.md to per-segment voice stems with kokoro-onnx, using lexicon.json for hard words.

Usage:
  python render_podcast.py script.md stems/ [--voice am_michael:0.6,am_onyx:0.4] [--speed 0.95]
  then: python produce.py stems/ out.mp3 --script script.md   (music, voice processing, loudness, chapters)
  python render_podcast.py script.md --check     # print the phonemes of every paragraph, no audio
  python render_podcast.py script.md stems/ --only 5 --force   # re-render just segment 5

Needs: pip install kokoro-onnx soundfile ;
model files in $KOKORO_DIR (default /tmp/kokoro): kokoro-v1.0.onnx, voices-v1.0.bin.
"""
import argparse, json, os, re, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 24000
PARA_GAP = 0.6


def load_lexicon(path):
    lex = {k: v for k, v in json.load(open(path, encoding="utf-8")).items() if not k.startswith("_")}
    keys = sorted(lex, key=len, reverse=True)
    pat = re.compile(r"(?<![\w-])(" + "|".join(re.escape(k) for k in keys) + r")(?![\w-])", re.I)
    return {k.lower(): v for k, v in lex.items()}, pat


def parse(script):
    """-> list of segments; each segment is a list of items: ('text', str) or ('pause', seconds)."""
    script = re.sub(r"<!--.*?-->", "", script, flags=re.S)
    segments, cur = [], None
    for block in re.split(r"\n\s*\n", script):
        block = block.strip()
        if not block:
            continue
        if block.startswith("## "):
            cur = []
            segments.append(cur)
            continue
        if block.startswith("#") or cur is None:
            continue
        for part in re.split(r"(\[pause [\d.]+\])", " ".join(block.split())):
            m = re.fullmatch(r"\[pause ([\d.]+)\]", part.strip())
            if m:
                cur.append(("pause", float(m.group(1))))
            elif part.strip():
                cur.append(("text", part.strip()))
        cur.append(("pause", PARA_GAP))
    return segments


def _ph(tok, chunk):
    # Phonemize with a dummy word after the chunk, so a chunk-final word keeps its
    # sentence context (a lone "a" before a lexicon word would otherwise read "AY").
    ph = tok.phonemize(chunk.rstrip() + " cat", "en-us").split(" ")
    return " ".join(ph[:-1]) if ph and "kˈæt" in ph[-1] else " ".join(ph)


def to_phonemes(text, tok, lex, pat):
    out, pos = [], 0
    for m in pat.finditer(text):
        chunk = text[pos:m.start()]
        if chunk.strip():
            out.append(_ph(tok, chunk))
        out.append(lex[m.group(1).lower()])
        pos = m.end()
    if text[pos:].strip():
        out.append(_ph(tok, text[pos:]))
    return " ".join(p for p in out if p).replace(" ,", ",").replace(" .", ".").replace(" ?", "?")


def voice_style(kokoro, spec):
    style = None
    for part in spec.split(","):
        name, _, w = part.partition(":")
        s = kokoro.get_voice_style(name.strip()) * float(w or 1)
        style = s if style is None else style + s
    return style


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--voice", default="am_michael:0.6,am_onyx:0.4")
    ap.add_argument("--speed", type=float, default=0.95)
    ap.add_argument("--only", type=int, help="render only this segment (1-based)")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--force", action="store_true", help="re-render segments that already exist")
    ap.add_argument("--lexicon", default=os.path.join(HERE, "lexicon.json"))
    a = ap.parse_args()

    from kokoro_onnx.tokenizer import Tokenizer
    tok = Tokenizer()
    lex, pat = load_lexicon(a.lexicon)
    segments = parse(open(a.script, encoding="utf-8").read())
    if a.only:
        segments = [segments[a.only - 1]]

    if a.check:
        for i, seg in enumerate(segments, 1):
            for kind, val in seg:
                if kind == "text":
                    print(f"[{i}] {val}\n    {to_phonemes(val, tok, lex, pat)}")
        return

    from kokoro_onnx import Kokoro
    import soundfile as sf
    kdir = os.environ.get("KOKORO_DIR", "/tmp/kokoro")
    k = Kokoro(os.path.join(kdir, "kokoro-v1.0.onnx"), os.path.join(kdir, "voices-v1.0.bin"))
    style = voice_style(k, a.voice)
    stems = a.out or "stems"
    os.makedirs(stems, exist_ok=True)
    first = a.only or 1
    for i, seg in enumerate(segments, first):
        path = os.path.join(stems, f"seg{i:02d}.wav")
        if os.path.exists(path) and not a.force:
            print(f"segment {i}: cached", file=sys.stderr)
            continue
        print(f"segment {i}", file=sys.stderr, flush=True)
        while seg and seg[-1][0] == "pause":
            seg = seg[:-1]  # the gap after a segment is the producer's job
        audio, cues, n = [], [], 0
        for j, (kind, val) in enumerate(seg):
            if kind == "pause":
                # an inline pause followed by more text in the same paragraph = a quiz beat
                if j + 1 < len(seg) and seg[j + 1][0] == "text" and val != PARA_GAP:
                    cues.append(round((n + int(SR * val)) / SR, 3))
                chunk = np.zeros(int(SR * val), dtype=np.float32)
            else:
                ph = to_phonemes(val, tok, lex, pat)
                chunk, _ = k.create(ph, voice=style, speed=a.speed, is_phonemes=True,
                                    sentence_pause=0.35, clause_pause=0.12)
                chunk = chunk.astype(np.float32)
            audio.append(chunk)
            n += len(chunk)
        sf.write(path, np.concatenate(audio), SR)
        json.dump({"cues": cues}, open(path[:-4] + ".json", "w"))
    print(stems)


if __name__ == "__main__":
    main()
