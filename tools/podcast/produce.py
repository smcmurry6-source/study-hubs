"""Mix the voice stems from render_podcast.py into a finished episode.

  python produce.py stems/ timmy-time.mp3 --script script.md   (also writes timmy-time.mp3.json: duration + chapters)

What it adds:
- Voice chain (ffmpeg): rumble cut, a little warmth and presence, de-essing, gentle compression.
- Music, all synthesized here (no samples, nothing to license): a lo-fi theme in D major at 78 bpm with
  electric piano (FM), sine bass, brushed drums and vinyl hiss.
  Intro: two bars of theme, the voice comes in on bar three and the music ducks under it, then fades.
  Between segments: a one-bar stinger that resolves to D.
  Lightning round: the groove plays low underneath, and a soft bell rings as each answer is revealed.
  Outro: the theme comes back under the sign-off and plays out.
- Ducking follows the voice, so music never fights the words.
- Mastering: two-pass EBU R128 loudness to -16 LUFS (podcast standard), true peak -1.5 dB, 44.1 kHz stereo mp3
  (96 kbps by default) + ID3 tags.
Needs numpy, scipy, soundfile, ffmpeg.
"""
import argparse, glob, json, os, subprocess, sys, tempfile
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, lfilter

SR = 44100
BPM = 78
BEAT = 60 / BPM
BAR = 4 * BEAT
RNG = np.random.default_rng(7)
MUSIC_LEVEL = 0.8  # music alone sits a few dB under the voice; ducked it is ~19 dB under

VOICE_CHAIN = ",".join([
    "highpass=f=75",
    "equalizer=f=140:t=q:w=1.0:g=2.5",      # chest / warmth
    "equalizer=f=380:t=q:w=1.4:g=-2",       # less boxiness
    "equalizer=f=3300:t=q:w=1.6:g=1.5",     # presence
    "equalizer=f=11000:t=h:w=0.7:g=-1.5",   # tame the synthetic top end
    "deesser=i=0.35:m=0.5:f=0.5",
    "acompressor=threshold=-21dB:ratio=2.5:attack=8:release=160:makeup=2.5:knee=4",
    f"aresample={SR}",
])


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x, axis=0)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x, axis=0)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


def place(buf, sig, t, pan=0.0, gain=1.0):
    """Add a mono signal into a stereo buffer at time t (s), constant-power pan -1..1."""
    i = int(t * SR)
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i] * gain
    a = (pan + 1) * np.pi / 4
    buf[i:i + len(sig), 0] += sig * np.cos(a)
    buf[i:i + len(sig), 1] += sig * np.sin(a)


# ---------- instruments ----------

def epiano(note, dur, vel=0.5):
    """FM electric piano: 1:1 body, a short bright 'tine', soft attack, long decay."""
    f = midi(note)
    n = int((dur + 1.2) * SR)
    t = np.arange(n) / SR
    index = 1.6 * np.exp(-t * 4) + 0.25
    body = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * t))
    tine = 0.18 * np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 14)
    env = np.minimum(t / 0.006, 1) * np.exp(-t * (1.1 + note / 90))
    rel = np.clip((dur + 0.35 - t) / 0.35, 0, 1)  # let go at the end of the note
    return (body + tine) * env * rel * vel


def bell(note, vel=0.4):
    f = midi(note)
    t = np.arange(int(2.2 * SR)) / SR
    index = 2.2 * np.exp(-t * 3)
    sig = np.sin(2 * np.pi * f * t + index * np.sin(2 * np.pi * f * 3.5 * t))
    return sig * np.minimum(t / 0.003, 1) * np.exp(-t * 2.6) * vel


def bass(note, dur, vel=0.6):
    f = midi(note)
    t = np.arange(int((dur + 0.3) * SR)) / SR
    sig = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6)
    env = np.minimum(t / 0.01, 1) * np.exp(-t * 1.6) * np.clip((dur + 0.08 - t) / 0.08, 0, 1)
    return lp(sig * env * vel, 900)


def kick(vel=0.8):
    t = np.arange(int(0.45 * SR)) / SR
    freq = 48 + 70 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 9) * vel


def brush(vel=0.35):
    t = np.arange(int(0.25 * SR)) / SR
    return bp(RNG.standard_normal(len(t)), 1200, 6000) * np.exp(-t * 16) * np.minimum(t / 0.004, 1) * vel


def hat(vel=0.12):
    t = np.arange(int(0.08 * SR)) / SR
    return hp(RNG.standard_normal(len(t)), 7000) * np.exp(-t * 60) * vel


def swell(dur=1.6, vel=0.18):
    """Reverse-cymbal style noise rise into a downbeat."""
    t = np.arange(int(dur * SR)) / SR
    return hp(RNG.standard_normal(len(t)), 3000) * (t / dur) ** 3 * vel


def vinyl(dur):
    n = int(dur * SR)
    hiss = lp(hp(RNG.standard_normal(n), 2000), 9000) * 0.004
    pops = np.zeros(n)
    idx = RNG.integers(0, n, size=max(1, int(dur * 2.5)))
    pops[idx] = RNG.uniform(0.02, 0.07, size=len(idx)) * RNG.choice([-1, 1], size=len(idx))
    pops = bp(pops, 900, 5000)
    return np.stack([hiss + pops, np.roll(hiss, 997) + pops * 0.8], axis=1)


# ---------- the music ----------

# IV - iii - ii - V in D: Gmaj9, F#m7, Em9, A13, and the stinger's resolution, Dmaj9
CHORDS = [
    (43, [54, 57, 59, 62]),
    (42, [52, 57, 61, 64]),
    (40, [55, 59, 62, 66]),
    (45, [55, 61, 66, 71]),
]
RESOLVE = (38, [54, 57, 61, 64, 69])
MELODY = [  # (bar, beat, note, beats)
    (0, 0, 78, 1.5), (0, 1.5, 76, 0.5), (0, 2, 74, 2),
    (1, 0, 73, 2), (1, 2, 69, 2),
    (2, 0, 71, 1), (2, 1, 74, 1), (2, 2, 78, 2),
    (3, 0, 76, 2.5), (3, 2.5, 73, 1.5),
]


def swing(beat_pos):
    """Swing the off-beat eighths a little (lazy, lo-fi feel)."""
    whole, frac = divmod(beat_pos, 1)
    return (whole + (0.6 if abs(frac - 0.5) < 1e-6 else frac)) * BEAT


def groove(bars, drums=True, melody=False, start_bar=0):
    buf = np.zeros((int((bars * BAR + 2.5) * SR), 2))
    for b in range(bars):
        t0 = b * BAR
        root, voicing = CHORDS[(start_bar + b) % 4]
        # electric piano: chord on 1, a softer push on the "and" of 2
        for k, note in enumerate(voicing):
            place(buf, epiano(note, BAR * 0.62, 0.16), t0 + k * 0.012, pan=-0.35 + 0.23 * k)
            place(buf, epiano(note, BAR * 0.3, 0.07), t0 + swing(1.5) + k * 0.01, pan=0.3 - 0.2 * k)
        place(buf, bass(root, BEAT * 1.8), t0, gain=0.55)
        place(buf, bass(root + 7, BEAT * 0.9), t0 + swing(2.5), gain=0.4)
        if drums:
            place(buf, kick(), t0, gain=0.55)
            place(buf, kick(0.6), t0 + swing(1.5), gain=0.45)
            place(buf, kick(0.5), t0 + swing(2.5), gain=0.3)
            for beat in (1, 3):
                place(buf, brush(), t0 + beat * BEAT, pan=0.1)
            for e in range(8):
                place(buf, hat(0.1 if e % 2 else 0.14), t0 + swing(e / 2), pan=0.35)
        if melody:
            for bar, beat, note, length in MELODY:
                if bar == (start_bar + b) % 4:
                    place(buf, epiano(note, length * BEAT, 0.2), t0 + swing(beat), pan=0.15)
    # Rhodes-style autopan tremolo and a warm, slightly dark top
    t = np.arange(len(buf)) / SR
    trem = 0.12 * np.sin(2 * np.pi * 3.2 * t)
    buf[:, 0] *= 1 + trem
    buf[:, 1] *= 1 - trem
    buf = lp(buf, 6500)
    return buf + vinyl(len(buf) / SR)


def stinger():
    """One bar on A13 that rises into Dmaj9: the segment change."""
    buf = np.zeros((int((2 * BAR + 1) * SR), 2))
    root, voicing = CHORDS[3]
    for k, note in enumerate(voicing):
        place(buf, epiano(note, BAR * 0.8, 0.12), k * BEAT * 0.25, pan=-0.3 + 0.2 * k)
    place(buf, bass(root, BAR * 0.8), 0, gain=0.45)
    place(buf, swell(BAR * 0.9), BAR * 0.1, pan=0)
    root, voicing = RESOLVE
    for k, note in enumerate(voicing):
        place(buf, epiano(note, BAR * 1.2, 0.15), BAR + k * 0.07, pan=-0.4 + 0.2 * k)
    place(buf, bass(root, BAR * 1.2), BAR, gain=0.5)
    place(buf, kick(0.6), BAR, gain=0.4)
    place(buf, bell(81, 0.08), BAR + 0.36, pan=0.3)
    buf = lp(buf, 6500)
    return buf + vinyl(len(buf) / SR), BAR  # (audio, time of the downbeat)


def quiz_chime():
    sig = bell(86, 0.07)
    sig[int(0.11 * SR):] += bell(93, 0.06)[: len(sig) - int(0.11 * SR)]
    return sig


# ---------- mixing ----------

def fade(x, fin=0.0, fout=0.0):
    n = len(x)
    g = np.ones(n)
    if fin:
        k = min(n, int(fin * SR)); g[:k] = np.linspace(0, 1, k) ** 2
    if fout:
        k = min(n, int(fout * SR)); g[-k:] *= np.linspace(1, 0, k) ** 2
    return x * g[:, None] if x.ndim == 2 else x * g


def duck_curve(voice, under=0.12, alone=1.0, attack=0.08, release=0.9):
    """Music gain that dips under speech and recovers in the gaps."""
    env = np.abs(voice)
    win = int(0.05 * SR)
    env = np.maximum.reduceat(env, np.arange(0, len(env), win))
    env = (env > 0.02).astype(float)
    a_up, a_dn = np.exp(-win / SR / attack), np.exp(-win / SR / release)
    out, y = np.empty_like(env), 0.0
    for i, v in enumerate(env):
        y = (a_up * y + (1 - a_up) * v) if v > y else (a_dn * y + (1 - a_dn) * v)
        out[i] = y
    curve = np.repeat(alone - (alone - under) * out, win)[: len(voice)]
    return curve


def process_voice(path):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        tmp = f.name
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", VOICE_CHAIN, "-ac", "1", tmp], check=True)
    v, _ = sf.read(tmp)
    os.remove(tmp)
    return v.astype(np.float64)


def mix(stem_dir):
    segs = sorted(glob.glob(os.path.join(stem_dir, "seg*.wav")))
    voices = [process_voice(p) for p in segs]
    cues = []
    for p in segs:
        meta = p[:-4] + ".json"
        cues.append(json.load(open(meta))["cues"] if os.path.exists(meta) else [])
    print(f"{len(segs)} segments, voice {sum(map(len, voices)) / SR / 60:.1f} min", file=sys.stderr)

    # timeline: (start time, voice array, segment index)
    intro_bars = 2
    t = intro_bars * BAR
    placed = []
    sting, downbeat = stinger()
    sting_at = []
    for i, v in enumerate(voices):
        if i > 0:
            sting_at.append(t + 0.5)
            t += 0.5 + downbeat + 1.3  # voice enters as the resolve chord rings
        placed.append((t, v, i))
        t += len(v) / SR
    outro_tail = 3 * BAR
    total = t + outro_tail + 3
    n = int(total * SR)

    voice_bus = np.zeros(n)
    for start, v, _ in placed:
        i = int(start * SR)
        voice_bus[i:i + len(v)] += v
    music = np.zeros((n, 2))

    # intro: theme with melody, drums from bar 3, under segment 1 then fade before the first stinger
    s1_start, s1_voice, _ = placed[0]
    s1_end = s1_start + len(s1_voice) / SR
    bars = int(np.ceil((s1_end + 1) / BAR))
    intro = groove(bars, drums=True, melody=True)
    intro[: int(intro_bars * BAR * SR)] *= 1.0
    k = int(intro_bars * BAR * SR)
    intro_nodrum = groove(intro_bars, drums=False, melody=True)
    intro[:k] = intro_nodrum[:k]
    intro = intro[: int((s1_end + 0.5) * SR)]
    intro = fade(intro, fin=0.6, fout=6.0)
    music[: len(intro)] += intro

    # stingers between segments
    for at in sting_at:
        i = int(at * SR)
        m = sting[: n - i]
        music[i:i + len(m)] += m * 0.9

    # lightning round bed + chimes (segment 7, or whichever segment has quiz cues)
    for (start, v, idx) in placed:
        if cues[idx]:
            end = start + len(v) / SR
            bed = groove(int(np.ceil((end - start) / BAR)) + 1, drums=True, melody=False)
            bed = fade(bed[: int((end - start + 1.5) * SR)], fin=2.0, fout=2.5) * 0.55
            i = int(start * SR)
            music[i:i + len(bed)] += bed[: n - i]
            for c in cues[idx]:
                place(music, quiz_chime(), start + c - 0.32, pan=0.2, gain=1.0)

    # outro: theme fades in under the sign-off and plays out
    last_start, last_v, _ = placed[-1]
    last_end = last_start + len(last_v) / SR
    o_start = max(last_start - 0.5, last_end - 40)
    bars = int(np.ceil((total - o_start) / BAR))
    outro = groove(bars, drums=True, melody=True)[: int((total - o_start) * SR)]
    tail_from = last_end - o_start + 1.0
    outro = fade(outro, fin=5.0)
    g = np.ones(len(outro))
    j = int((tail_from + outro_tail - 4) * SR)
    g[j:] = np.linspace(1, 0, len(g) - j) ** 2
    outro *= g[:, None]
    i = int(o_start * SR)
    music[i:i + len(outro)] += outro[: n - i]

    # duck everything musical under the voice (chimes included, so they sit just under the answers)
    curve = duck_curve(voice_bus)
    music *= curve[:, None] * MUSIC_LEVEL

    out = music + voice_bus[:, None]
    peak = np.max(np.abs(out))
    chapters = [0.0] + [round(at, 2) for at in sting_at]
    return out / max(peak, 1e-9) * 0.89, chapters


def master(wav, out_mp3, bitrate="96k", title="Timmy Time"):
    tmp = out_mp3 + ".mix.wav"
    sf.write(tmp, wav.astype(np.float32), SR, subtype="FLOAT")
    target = "I=-16:TP=-1.5:LRA=11"
    probe = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", f"loudnorm={target}:print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex("{"):probe.rindex("}") + 1])
    ln = (f"loudnorm={target}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
          f"offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp,
                    "-af", f"{ln},alimiter=limit=0.84:level=false,aresample={SR}",
                    "-c:a", "libmp3lame", "-b:a", bitrate,
                    "-metadata", f"title={title}",
                    "-metadata", "artist=Timmy Tooth",
                    "-metadata", "album=Timmy Time",
                    "-metadata", "genre=Podcast", out_mp3], check=True)
    os.remove(tmp)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("stems")
    ap.add_argument("out")
    ap.add_argument("--script", help="script.md, to name the chapters")
    ap.add_argument("--title", default="Timmy Time", help="ID3 title")
    ap.add_argument("--bitrate", default="96k", help="mp3 bitrate (96k keeps a 40-minute episode near 30 MB for phones)")
    a = ap.parse_args()
    wav, starts = mix(a.stems)
    print(f"episode {len(wav) / SR / 60:.1f} min", file=sys.stderr)
    master(wav, a.out, a.bitrate, a.title)
    titles = []
    if a.script:
        import re
        titles = re.findall(r"^## (?:\d+\.\s*)?(.+)$", open(a.script, encoding="utf-8").read(), flags=re.M)
    chapters = [{"t": t, "title": titles[i] if i < len(titles) else f"Part {i + 1}"} for i, t in enumerate(starts)]
    json.dump({"duration": round(len(wav) / SR, 1), "chapters": chapters}, open(a.out + ".json", "w"), indent=1)
    print(a.out)


if __name__ == "__main__":
    main()
