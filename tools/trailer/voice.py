#!/usr/bin/env python3
"""The trailer's narration: every caption of script.md spoken as its own file, in Timmy Time's voice.

    python3 tools/trailer/voice.py [out_dir]        default: tools/trailer/out/voice

Same voice and pronunciation lexicon as an episode (tools/podcast/render_podcast.py, whose parser, phonemes and
voice blend this imports), so the trailer sounds like the show. One wav per caption (cNN.wav) and cues.json:
[{ shot, text (as spoken), shown (as captioned), file, dur, pause (silence asked for before it) }].
audio.py lays them on the timeline; the captions are these same lines, so they match the voice word for word.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "podcast"))
import numpy as np
import render_podcast as rp

VOICE, SPEED = "am_michael:0.6,am_onyx:0.4", 0.98   # the show reads at 0.95; a trailer a touch brisker
SHOWN = [("X-P", "XP")]          # spoken spelling -> what the caption shows


def shots(script):
    """-> [(shot id, [("text", str) | ("pause", s)])], from the "## n. id" headings."""
    script = re.sub(r"<!--.*?-->", "", script, flags=re.S)
    ids = re.findall(r"^## *\d+\. *(\S+)", script, flags=re.M)
    return list(zip(ids, rp.parse(script)))


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out", "voice")
    os.makedirs(out, exist_ok=True)
    from kokoro_ready import ensure
    kdir = ensure()
    from kokoro_onnx import Kokoro
    from kokoro_onnx.tokenizer import Tokenizer
    import soundfile as sf
    tok = Tokenizer()
    lex, pat = rp.load_lexicon(os.path.join(HERE, "..", "podcast", "lexicon.json"))
    k = Kokoro(os.path.join(kdir, "kokoro-v1.0.onnx"), os.path.join(kdir, "voices-v1.0.bin"))
    style = rp.voice_style(k, VOICE)
    cues, n = [], 0
    for shot, items in shots(open(os.path.join(HERE, "script.md"), encoding="utf-8").read()):
        pause = 0.0
        for kind, val in items:
            if kind == "pause":
                if val != rp.PARA_GAP:
                    pause += val
                continue
            n += 1
            name = f"c{n:02d}.wav"
            audio, _ = k.create(rp.to_phonemes(val, tok, lex, pat), voice=style, speed=SPEED, is_phonemes=True,
                                sentence_pause=0.35, clause_pause=0.12)
            audio = np.trim_zeros(audio.astype(np.float32))
            sf.write(os.path.join(out, name), audio, rp.SR)
            shown = val
            for a, b in SHOWN:
                shown = shown.replace(a, b)
            cues.append({"shot": shot, "text": val, "shown": shown, "file": name,
                         "dur": round(len(audio) / rp.SR, 3), "pause": pause})
            pause = 0.0
            print(f"{name} {cues[-1]['dur']:5.2f}s  {val}", file=sys.stderr, flush=True)
    json.dump(cues, open(os.path.join(out, "cues.json"), "w"), indent=1)
    print(f"{len(cues)} captions, {sum(c['dur'] for c in cues):.1f} s of speech -> {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
