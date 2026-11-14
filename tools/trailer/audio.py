#!/usr/bin/env python3
"""The trailer's sound and its timeline: Timmy's lines laid end to end, a new music cue under them, one mastered wav.

    python3 tools/trailer/audio.py [out_dir]         default: tools/trailer/out   (after voice.py)

Writes out/audio.wav (48 kHz stereo, -14 LUFS, the level phones and group chats play video at) and out/timeline.json:
  { fps, dur, bpm, drop,
    cues:  [{ shot, shown, t0, t1 }]   each caption and when it is spoken,
    shots: [{ id, t0, t1 }]            when each shot of shots.mjs is on screen,
    mouth: [0..1 per frame]            how loud Timmy is, which opens his mouth and moves the studio's meters }
Everything on screen is cut to this file (compose.mjs, record.mjs, cut.mjs), so the picture can't drift from the voice.

The voice goes through the show's own chain (tools/podcast/produce.py), so it is the Timmy Time voice. The music is new
(Sam, 2026-11-14: "New music"): the show's instruments (FM electric piano, sine bass, kick, brush, hats, bell, all
synthesized there, nothing to license) in the show's key, D, but faster and straight instead of the theme's lazy swing:
keys alone in the studio, a riser into the first feature shot where the drums come in, a break for the sign-off, and a
last D chord that rings out. The tempo is set so the drums land on the cut to the dashboard.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "podcast"))
import numpy as np
import soundfile as sf
import produce as pp

SR = pp.SR
FPS = 30
LEAD = 1.9          # music and the studio before he speaks
GAP = 0.32          # between two captions of a shot
SHOT_GAP = 0.6      # between shots: the picture changes in this gap
TAIL = 3.4          # after his last word: the last chord, the lamp goes off


def lay_out(cues):
    """-> cue times, shot windows, the length."""
    t, out, shots = LEAD, [], []
    for i, c in enumerate(cues):
        new = i == 0 or c["shot"] != cues[i - 1]["shot"]
        if i:
            t += SHOT_GAP if new else GAP
        t += c["pause"]
        if new:
            shots.append({"id": c["shot"], "t0": 0.0 if i == 0 else round(t - SHOT_GAP / 2 - c["pause"], 3)})
        out.append({"shot": c["shot"], "shown": c["shown"], "file": c["file"], "t0": round(t, 3), "t1": round(t + c["dur"], 3)})
        t += c["dur"]
    dur = round(t + TAIL, 3)
    for i, s in enumerate(shots):
        s["t1"] = shots[i + 1]["t0"] if i + 1 < len(shots) else dur
    return out, shots, dur


# ---------- the cue ----------

# I - vi - IV - V in D, voiced above the bass: (bass note, chord notes)
CHORDS = [(38, [57, 62, 66, 69]), (35, [57, 59, 62, 66]), (43, [59, 62, 66, 71]), (45, [57, 61, 64, 69])]
LAST = (38, [57, 62, 66, 69, 73, 78])
# the hook, on bells: (bar of four, beat, note, beats). It answers itself every four bars.
HOOK = [(0, 0, 81, 1), (0, 1, 78, .5), (0, 1.5, 81, .5), (0, 2.5, 83, 1.5),
        (1, 0, 78, 1), (1, 1.5, 74, .5), (1, 2, 78, 2),
        (2, 0, 83, 1), (2, 1, 81, .5), (2, 1.5, 78, .5), (2, 2.5, 74, 1.5),
        (3, 0, 76, 1.5), (3, 1.5, 78, .5), (3, 2, 81, 1), (3, 3, 85, 1)]


def clap(vel=0.3):
    t = np.arange(int(0.22 * SR)) / SR
    env = np.exp(-t * 26) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012) + 0.5 * np.exp(-np.maximum(t - 0.026, 0) * 22) * (t > 0.026)
    return pp.bp(pp.RNG.standard_normal(len(t)), 900, 4200) * env * vel


def music(dur, drop, close, end, bpm):
    """drop: the drums come in; close: they stop for the sign-off; end: the last chord."""
    beat = 60 / bpm
    bar = 4 * beat
    buf = np.zeros((int((dur + 4) * SR), 2))
    nbars = int(end / bar) + 1
    for b in range(nbars):
        t0 = b * bar
        if t0 >= end - 0.05:
            break
        root, voicing = CHORDS[b % 4]
        full = drop - 0.01 <= t0 < close - 0.01
        soft = 0.75 if not full else 1.0
        # keys: held chord on one in the studio and the sign-off, pushed off-beat stabs once the drums are in
        if full:
            for at, length, vel in ((0, .9, .15), (1.5, .4, .1), (2.5, .4, .12), (3.5, .3, .08)):
                for k, note in enumerate(voicing):
                    pp.place(buf, pp.epiano(note, length * beat, vel), t0 + at * beat + k * 0.006, pan=-0.4 + 0.27 * k)
        else:
            for k, note in enumerate(voicing):
                pp.place(buf, pp.epiano(note, bar * 0.8, 0.15 * soft), t0 + k * 0.03, pan=-0.4 + 0.27 * k)
            for k, note in enumerate(voicing):   # a rising arpeggio through the second half of the bar
                pp.place(buf, pp.bell(note + 12, 0.045), t0 + (2 + k * .5) * beat, pan=0.5 - 0.3 * k)
        # bass: whole notes before the drums, eighths after
        if full:
            for e in range(8):
                n = root + (12 if e in (3, 6) else 7 if e == 7 else 0)
                pp.place(buf, pp.bass(n, beat * 0.42, 0.55 if e % 2 == 0 else 0.42), t0 + e * beat / 2, gain=0.5)
        else:
            pp.place(buf, pp.bass(root, beat * 3.2), t0, gain=0.42)
        if full:
            for at in (0, 2, 2.5):
                pp.place(buf, pp.kick(0.8 if at != 2.5 else 0.55), t0 + at * beat, gain=0.5)
            for at in (1, 3):
                pp.place(buf, clap(), t0 + at * beat, pan=0.08)
                pp.place(buf, pp.brush(0.2), t0 + at * beat, pan=-0.1)
            for e in range(8):
                pp.place(buf, pp.hat(0.13 if e % 2 == 0 else 0.09), t0 + e * beat / 2, pan=0.35)
            for hb, at, note, length in HOOK:
                if hb == b % 4:
                    pp.place(buf, pp.bell(note, 0.05), t0 + at * beat, pan=-0.2)
    # the riser into the drums, and a fill of claps on the last beat before them
    pp.place(buf, pp.swell(bar * 0.9, 0.2), drop - bar * 0.9)
    for k in range(4):
        pp.place(buf, clap(0.12 + 0.05 * k), drop - beat + k * beat / 4, pan=-0.3 + 0.2 * k)
    # into the sign-off: one more swell, then the last chord rings
    pp.place(buf, pp.swell(beat * 2, 0.12), end - beat * 2)
    root, voicing = LAST
    for k, note in enumerate(voicing):
        pp.place(buf, pp.epiano(note, 3.0, 0.17), end + k * 0.05, pan=-0.45 + 0.18 * k)
    pp.place(buf, pp.bass(root, 2.6), end, gain=0.55)
    pp.place(buf, pp.kick(0.7), end, gain=0.45)
    pp.place(buf, pp.bell(86, 0.07), end + 0.3, pan=0.3)
    pp.place(buf, pp.bell(93, 0.05), end + 0.45, pan=-0.3)
    buf = pp.lp(buf, 9000)
    return buf[: int(dur * SR)]


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out")
    vdir = os.path.join(out, "voice")
    cues, shots, dur = lay_out(json.load(open(os.path.join(vdir, "cues.json"))))
    n = int(dur * SR)
    voice = np.zeros(n)
    for c in cues:
        v = pp.process_voice(os.path.join(vdir, c["file"]))
        i = int(c["t0"] * SR)
        voice[i:i + len(v)] += v[: n - i]

    # the drums come in on the cut to the first feature shot: pick the tempo (near 106) that puts a bar line there
    drop = shots[1]["t0"]
    bars = max(1, round(drop / (240 / 106)))
    bpm = 240 * bars / drop
    bar = 240 / bpm
    close = next(s["t0"] for s in shots if s["id"] == "close")
    close = round(close / bar) * bar                     # the break starts on a bar line
    end = cues[-1]["t1"] + 0.35                          # the last chord, just after "tap everything"
    m = music(dur, drop, close, end, bpm)
    duck = pp.duck_curve(voice, under=0.16, alone=0.95, attack=0.06, release=0.5)
    m = pp.fade(m * duck[:, None] * pp.MUSIC_LEVEL, fin=0.25, fout=1.6)
    mix = np.stack([voice, voice], axis=1) * 0.92 + m

    tmp = os.path.join(out, "audio.mix.wav")
    sf.write(tmp, mix.astype(np.float32), SR, subtype="FLOAT")
    target = "I=-14:TP=-1.5:LRA=11"
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    j = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
    ln = (f"loudnorm={target}:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:"
          f"measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-af", f"{ln},alimiter=limit=0.84:level=false,aresample=48000",
                    "-c:a", "pcm_s16le", os.path.join(out, "audio.wav")], check=True)
    os.remove(tmp)

    # how open his mouth is, per frame: the voice's loudness over the frame, eased so it doesn't flicker
    hop = SR // FPS
    frames = int(np.ceil(dur * FPS))
    pad = np.concatenate([np.abs(voice), np.zeros(frames * hop - n if frames * hop > n else 0)])
    rms = np.sqrt((pad[: frames * hop].reshape(frames, hop) ** 2).mean(axis=1))
    lvl = np.clip(rms / (np.percentile(rms[rms > 0.01], 90) if (rms > 0.01).any() else 1), 0, 1) ** 0.7
    mouth, y = [], 0.0
    for v in lvl:
        y = v if v > y else y * 0.55 + v * 0.45
        mouth.append(round(float(y), 3))

    for c in cues:
        del c["file"]
    json.dump({"fps": FPS, "dur": dur, "bpm": round(bpm, 2), "drop": drop, "cues": cues, "shots": shots, "mouth": mouth},
              open(os.path.join(out, "timeline.json"), "w"), indent=1)
    print(f"{dur:.1f} s, {bpm:.1f} bpm, drums in at {drop:.2f} s", file=sys.stderr)
    for s in shots:
        print(f"  {s['t0']:6.2f} - {s['t1']:6.2f}  {s['id']}", file=sys.stderr)


if __name__ == "__main__":
    main()
