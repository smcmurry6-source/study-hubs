"""Word timings for a hub's lecture narration, so the redesigned hub can highlight each word as Listen reads it.

  python3 tools/narration_words.py <hub>                  every lecture and level that has an mp3
  python3 tools/narration_words.py <hub> --lec dmpharm --level full
  python3 tools/narration_words.py <hub> --check          say which files are missing or older than their mp3 (no Kokoro needed)
  python3 tools/narration_words.py <hub> --stale          make only those
  python3 tools/narration_words.py <hub> --lec X --level full --render    the exact way, for a file that fits badly

Writes hubs/<hub>/audio/<lecture>-<level>.words.json beside each <lecture>-<level>.mp3, for the redesign's Follow along
(widget/hub.js). The words come from the notes as the redesign shows them (hubs/<hub>/next/content/notes.json, the live
hub's READINGS) and are read the way tools/narrate.py reads them; the times come from the mp3 itself: Kokoro's duration
predictor (the model cut down to its duration output, about 20 times faster than speaking) says where each sound falls in
a fresh rendering, and an alignment of that timeline's speech and pauses to the mp3's loudness (place()) moves every word
onto the real recording, so narration made with other pauses or an older lexicon still lines up. Nothing is re-spoken and
the mp3 is never touched. tools/narrate.py writes the file itself, from Kokoro's exact timings, whenever it renders an mp3.

The file: {"v": 1, "bytes": <mp3 size>, "dur": <seconds>, "w": "word word ...", "t": [start, end, start, end, ...]}, times in
hundredths of a second, one pair per word of "w" (split on spaces), the words as the page shows them, in reading order.
vault/how-to/narrate-with-kokoro.md.
"""
import argparse, bisect, difflib, json, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "podcast"))
import narrate  # noqa: E402

FRAME = 0.04          # the coarse alignment's step, seconds
BAND = 20.0           # how far (seconds) the recording may drift from the prediction at any point, in the coarse alignment
STEP = 0.3            # the coarse alignment's cost of a step that stretches one side, against 0-1 per frame of misfit
FINE = 0.01           # the stretch search's and last alignment's step
SEARCH = 0.6          # how far (seconds) the stretch search looks either side of the coarse alignment
JUMP = 60.0           # the stretch search's cost per second that a pause grew or shrank, against 0-1 per FINE step of misfit
LONGEST = 0.06        # the most of one sound's predicted duration that counts as speech
FINE_BAND = 0.8       # how far (seconds) the last alignment lets a word move from where its stretch put it
FINE_STEP = 0.6       # the last alignment's cost of a stretching step
SR = 16000            # the mp3 is decoded at this rate, for its loudness (and, with --render, its spectrum)
FIT_OK = 0.97         # below this share of word starts on speech, the tool says to try --render
DRIFT = 0.4           # --render: a minute of the recording whose spectrum differs from today's notes by more than this
UNIT = 600 / 24000    # one step of Kokoro's duration output, seconds
SENT, CLAUSE = ".!?", ",;:"


def words_path(hub, lec, level): return os.path.join(ROOT, "hubs", hub, "audio", "%s-%s.words.json" % (lec, level))
def mp3_path(hub, lec, level): return os.path.join(ROOT, "hubs", hub, "audio", "%s-%s.mp3" % (lec, level))


def norm(w): return re.sub(r"[^0-9a-z]", "", w.lower())


class Phonemes:
    """Text to Kokoro's phonemes, the way tools/narrate.py renders it (the Timmy Time lexicon first, then espeak)."""
    def __init__(self, k):
        from kokoro_onnx.tokenizer import Tokenizer
        from render_podcast import load_lexicon, to_phonemes
        self.k, self.to_ph, self.cache = k, to_phonemes, {}
        self.tok = Tokenizer(); self.lex, self.pat = load_lexicon(os.path.join(HERE, "podcast", "lexicon.json"))

    def phonemes(self, text):
        if text not in self.cache: self.cache[text] = self.to_ph(text, self.tok, self.lex, self.pat)
        return self.cache[text]


class Predictor(Phonemes):
    """Where each phoneme falls if Kokoro spoke the text now: durations only, from the model cut down to its duration
    output (made the first time, beside the model; it needs the onnx package, which tools/kokoro-setup.sh installs)."""
    def __init__(self, voice="af_heart", speed=1.0):
        from kokoro_ready import ensure
        kdir = ensure()
        import onnxruntime as ort
        from kokoro_onnx import Kokoro
        from kokoro_onnx.chunker import split_phonemes, pause_after
        cut = os.path.join(kdir, "kokoro-duration.onnx")
        if not os.path.exists(cut):
            import onnx
            from onnx.utils import Extractor
            onnx.save(Extractor(onnx.load(os.path.join(kdir, "kokoro-v1.0.onnx"))).extract_model(["input_ids", "style", "speed"], ["duration"]), cut + ".part")
            os.replace(cut + ".part", cut)
        Phonemes.__init__(self, Kokoro(os.path.join(kdir, "kokoro-v1.0.onnx"), os.path.join(kdir, "voices-v1.0.bin")))
        self.dur = ort.InferenceSession(cut, providers=["CPUExecutionProvider"])
        self.voice, self.speed = self.k.get_voice_style(voice), speed
        self.split, self.pause_after = split_phonemes, pause_after

    def batch(self, ph):
        """[(char, start, end)] for one model call, relative to its start, the pads trimmed as Kokoro trims them."""
        known = self.k.tokenizer.known(ph)
        tokens = self.k.tokenizer.tokenize(ph)
        if not tokens: return []
        ids = np.array([[0, *tokens, 0]], dtype=np.int64)
        style = np.asarray(self.k._style_for(self.voice, len(tokens)), dtype=np.float32)
        d = self.dur.run(None, {"input_ids": ids, "style": style, "speed": np.array([self.speed], dtype=np.float32)})[0].ravel()
        out, t = [], 0.0
        for ch, n in zip(known, d[1:-1]):
            e = t + float(n) * UNIT
            out.append((ch, t, e)); t = e
        return out

    def item(self, text, sentence_pause=0.3, clause_pause=0.1):
        """One narrate.py text item as tools/narrate.py renders it (each chunk its own create() call; the gap after a mark
        topped up to the pause asked for, as kokoro_onnx does): [(char, start, end)] over its phonemes, its length, and
        where each stretch of speech starts (after a mark or at a new model call: inside one, the timing is the model's own)."""
        out, t, breaks = [], 0.0, []
        for chunk in narrate.split_ph(self.phonemes(text)):
            parts = self.split(" ".join(chunk.split()))
            for i, b in enumerate(parts):
                breaks.append(t)
                for ch, s, e in self.batch(b):
                    out.append((ch, t + s, t + e))
                    want = sentence_pause if ch in SENT else clause_pause if ch in CLAUSE else 0.0
                    if want: t += max(0.0, want - (e - s)); breaks.append(t + e)
                if out: t = out[-1][2]
                if i < len(parts) - 1: t += self.pause_after(b, sentence_pause, clause_pause)
        return out, t, breaks


MARKS = SENT + CLAUSE + "—–-\"'“”()… "


def spoken_times(pred, sw, chars, t0):
    """[start, end] of each spoken word: each word is phonemized on its own and matched, phoneme by phoneme, against the
    phonemes Kokoro actually spoke (espeak runs "of the" together and splits "L2" in two, so spaces can't be counted)."""
    own, seq = [], []
    for k, w in enumerate(sw):
        for ch in pred.k.tokenizer.known(pred.phonemes(w)):
            if ch not in MARKS: own.append(k); seq.append(ch)
    said = [(ch, s, e) for ch, s, e in chars if ch not in MARKS]
    span = [None] * len(sw)
    sm = difflib.SequenceMatcher(None, "".join(seq), "".join(c for c, _, _ in said), autojunk=False)
    for i, j, n in sm.get_matching_blocks():
        for d in range(n):
            k, (_, s, e) = own[i + d], said[j + d]
            span[k] = (min(span[k][0], s), max(span[k][1], e)) if span[k] else (s, e)
    # a word with no matched phoneme (a symbol, a word espeak spelled another way) fills the gap between its neighbors
    k = 0
    while k < len(sw):
        if span[k]: k += 1; continue
        j = k
        while j < len(sw) and not span[j]: j += 1
        lo = span[k - 1][1] if k else (said[0][1] if said else 0.0)
        hi = span[j][0] if j < len(sw) else (said[-1][2] if said else lo)
        hi = max(lo, hi)
        for m in range(k, j): span[m] = (lo + (hi - lo) * (m - k) / (j - k), lo + (hi - lo) * (m - k + 1) / (j - k))
        k = j
    return [(t0 + s, t0 + e) for s, e in span]


def item_words(pred, say, shown, chars, t0):
    """The page's words of one item with [start, end], via the spoken words (narrate.py says "L2" as "L 2", "~" as "about")."""
    sw = say.split()
    spoken_t = spoken_times(pred, sw, chars, t0) if sw else []
    dw = shown.split()
    out = [None] * len(dw)
    sm = difflib.SequenceMatcher(None, [norm(w) for w in dw], [norm(w) for w in sw], autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1): out[i1 + k] = spoken_t[j1 + k]
        elif op == "replace":
            s, e = spoken_t[j1][0], spoken_t[j2 - 1][1]
            w = [len(x) for x in dw[i1:i2]]; tw, c = float(sum(w)), 0
            for k, L in enumerate(w):
                out[i1 + k] = (s + (e - s) * c / tw, s + (e - s) * (c + L) / tw); c += L
    prev = (t0, t0)
    for k in range(len(out)):   # page words nobody says (a symbol, a dash) sit at the end of the word before
        if out[k] is None: out[k] = (prev[1], prev[1])
        prev = out[k]
    return list(zip(dw, out))


def predict(pred, html):
    """Predicted timeline: the page's words with times, the spans of speech, where each stretch of speech starts, and the
    length."""
    t, words, spans, breaks = 0.0, [], [], []
    for it in narrate.spoken(html, shown=True):
        if it[0] == "pause": t += it[1]; continue
        _, say, shown = it
        chars, length, br = pred.item(say)
        words += item_words(pred, say, shown, chars, t)
        # spaces count as speech (words run together); a sound longer than LONGEST is speech only for its first LONGEST:
        # the model puts the pause before a mark into the last sound's duration, not the mark's
        spans += [(t + s, t + min(e, s + LONGEST)) for ch, s, e in chars if ch not in SENT + CLAUSE]
        breaks += [t + x for x in br]
        t += length
    return [(w, se) for w, se in words if w.strip()], spans, sorted(set(breaks)), t


def mask(spans, n, frame):
    m = np.zeros(n, dtype=np.float32)
    for s, e in spans:
        a = int(s / frame); m[a:min(n, max(a + 1, int(e / frame)))] = 1.0
    return m


def loudness(mp3):
    """The recording's loudness every FINE seconds, 0 (quiet) to 1 (speech), and its length."""
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    a = np.frombuffer(pcm, dtype=np.float32)
    f = int(SR * FINE); n = len(a) // f
    rms = np.sqrt((a[:n * f].reshape(n, f) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms / rms.max())
    return np.clip((db + 45) / 25, 0, 1).astype(np.float32), len(a) / SR


def align(actual, pred, lo, hi, step, path=False):
    """DTW of the real recording's frames (rows) against the predicted ones (columns) inside a band (row i may meet columns
    lo[i] to hi[i] - 1), a step that stretches one side costing `step`: for each predicted frame, the real frame it meets
    first (with path=True, also the path's cost at each real frame). Frames are numbers (loudness against the speech mask)
    or rows of numbers (spectra, compared by their RMS difference). Each row is one vector pass (the horizontal moves as a
    prefix minimum)."""
    N, M = len(actual), len(pred)
    INF = np.float32(1e9)
    prev = np.full(M + 1, INF, dtype=np.float32)   # prev[j + 1] = D[i - 1, j]; prev[0] = D[i - 1, -1]
    prev[0] = 0
    ptr = []
    for i in range(N):
        a, b = lo[i], hi[i]
        c = np.abs(actual[i] - pred[a:b]) if actual.ndim == 1 else np.sqrt(((actual[i][None, :] - pred[a:b]) ** 2).mean(1))
        diag = prev[a:b]                   # D[i-1, j-1]
        vert = prev[a + 1:b + 1] + step    # D[i-1, j]
        B = c + np.minimum(diag, vert)
        S = np.cumsum(c + step)
        best = np.minimum.accumulate(B - S)
        D = S + best
        horiz = (B - S) > best + 1e-6
        ptr.append(np.where(horiz, 2, np.where(vert < diag, 1, 0)).astype(np.int8))
        prev = np.full(M + 1, INF, dtype=np.float32); prev[a + 1:b + 1] = D
        if i == 0: prev[0] = INF
    if not prev[M] < INF: return None      # the band left no way through
    i, j = N - 1, M - 1                    # walk back from the corner
    first = np.full(M, -1, dtype=np.int64); here = np.zeros(N, dtype=np.float32)
    while i >= 0 and j >= 0:
        first[j] = i
        if path: here[i] = abs(actual[i] - pred[j]) if actual.ndim == 1 else np.sqrt(((actual[i] - pred[j]) ** 2).mean())
        p = ptr[i][j - lo[i]] if lo[i] <= j < hi[i] else 0
        if p == 0: i -= 1; j -= 1
        elif p == 1: i -= 1
        else: j -= 1
    for j in range(M):
        if first[j] < 0: first[j] = first[j - 1] if j else 0
    return (first, here) if path else first


def band(center, M, W):
    """Columns center[i] - W to center[i] + W for each row, kept non-decreasing so a path can always go on, the corners included."""
    lo = np.clip(np.asarray(center, dtype=np.int64) - W, 0, M - 1); hi = np.clip(np.asarray(center, dtype=np.int64) + W + 1, 1, M)
    lo = np.minimum.accumulate(lo[::-1])[::-1]; hi = np.maximum.accumulate(hi)
    lo[0] = 0; hi[-1] = M
    return lo, hi


def place(words, spans, breaks, loud, alen):
    """Move the predicted words onto the recording. Inside one stretch of speech (between marks, within one model call) the
    model's own timing is exact, so only where each stretch starts has to be found: a coarse alignment of the whole
    timeline's speech and silences to the recording's loudness (banded DTW, FRAME steps) says roughly where each stretch
    went, and a search over FINE steps near there, best fit of the stretch's speech to the loudness with a small cost for
    a pause that grew or shrank, picks the exact shift (Viterbi over the stretches). Narration made before today's lexicon
    was spoken a little differently inside a stretch too, so a last DTW at FINE steps, in a narrow band around that
    placement, lets each word move a little on its own; if it wanders off, the stretches' placement stands.

    Checked 2026-11-12 against Kokoro's exact timings (a fresh rendering of three lectures, one per hub): median error
    25 ms, 96-97% of words within 0.1 s, all within 0.2 s. On the committed mp3s (made 11-05 to 11-10), against a
    spectral alignment of the fresh rendering: median 20-40 ms, 84-98% within 0.1 s, 96-100% within 0.2 s."""
    if not words or not breaks: return []
    plen = max([e for _, e in spans] + [0.0]) + 1.0
    r = int(round(FRAME / FINE))
    coarse = loud[:len(loud) // r * r].reshape(-1, r).mean(1)
    fm = mask(spans, int(plen / FINE) + 2, FINE)
    cm = mask(spans, int(plen / FRAME) + 2, FRAME)
    mapf = align(coarse, cm, *band(np.arange(len(coarse)) * len(cm) / max(1, len(coarse)), len(cm), int(BAND / FRAME)), STEP)
    shift = mapf * FRAME - np.arange(len(mapf)) * FRAME
    edges = [int(round(b / FINE)) for b in breaks] + [len(fm)]
    R = int(SEARCH / FINE); cand = np.arange(-R, R + 1)
    costs, base = [], []
    for k in range(len(breaks)):
        a, b = edges[k], max(edges[k] + 1, edges[k + 1])
        sp = np.nonzero(fm[a:b] > 0)[0] + a
        cf = sp // r; cf = cf[cf < len(shift)]
        c0 = int(round((np.median(shift[cf]) if len(cf) else shift[min(a // r, len(shift) - 1)]) / FINE))
        base.append(c0)
        seg = fm[a:b]
        row = np.empty(len(cand), dtype=np.float32)
        for i, o in enumerate(cand):
            lo = a + c0 + o
            got = loud[max(0, lo):max(0, lo + len(seg))]
            if lo < 0 or len(got) < len(seg): got = np.concatenate([np.zeros(max(0, -lo), np.float32), got])[:len(seg)]; got = np.pad(got, (0, len(seg) - len(got)))
            row[i] = np.abs(got - seg).sum()
        costs.append(row)
    # Viterbi: the shift of each stretch, a cost of JUMP per second that it differs from the stretch before
    n = len(costs); back = []
    acc = costs[0].copy() if n else np.zeros(0)
    for k in range(1, n):
        o_prev = base[k - 1] + cand; o_now = base[k] + cand
        trans = acc[None, :] + JUMP * FINE * np.abs(o_now[:, None] - o_prev[None, :])
        j = trans.argmin(1); back.append(j)
        acc = costs[k] + trans[np.arange(len(cand)), j]
    pick = [0] * n
    if n:
        pick[-1] = int(acc.argmin())
        for k in range(n - 1, 0, -1): pick[k - 1] = int(back[k - 1][pick[k]])
    off = [(base[k] + cand[pick[k]]) * FINE for k in range(n)]
    ks = [max(0, bisect.bisect_right(breaks, s + 1e-6) - 1) for w, (s, e) in words]
    v1 = np.array([s + off[k] for (w, (s, e)), k in zip(words, ks)])
    v1e = np.array([e + off[k] for (w, (s, e)), k in zip(words, ks)])
    # the last DTW, in a band FINE_BAND either side of the stretches' placement
    starts = np.array([s for w, (s, e) in words]); ends = np.array([e for w, (s, e) in words])
    v, ve = v1, v1e
    if len(words) > 1:
        offs = np.interp(np.arange(len(fm)) * FINE, starts, v1 - starts)
        real = np.maximum.accumulate(np.arange(len(fm)) + offs / FINE)        # predicted frame -> real frame, never back
        center = np.interp(np.arange(len(loud)), real, np.arange(len(fm)))
        f = align(loud, fm, *band(center, len(fm), int(FINE_BAND / FINE)), FINE_STEP)
        if f is not None:
            at = lambda t: f[np.clip((t / FINE).astype(np.int64), 0, len(f) - 1)] * FINE
            v2, v2e = at(starts), at(ends)
            if np.median(np.abs(v2 - v1)) < 0.1: v, ve = v2, v2e   # else keep the stretches' placement
    out, last = [], 0.0
    for (w, _), a, b in zip(words, v, ve):
        a = min(alen, max(last, float(a))); b = min(alen, max(a, float(b)))
        out.append((w, a, b)); last = a
    return out


def render_items(ph, items, voice="af_heart", speed=1.0):
    """Speak narrate.spoken(html, shown=True) items as tools/narrate.py does: the audio (24 kHz) and the page's words with
    Kokoro's own timings. ph: a Phonemes (or Predictor)."""
    audio, n, timed = [], 0, []
    for it in items:
        if it[0] == "pause": audio.append(np.zeros(int(24000 * it[1]), dtype=np.float32)); n += len(audio[-1]); continue
        _, v, shown = it
        chars = []
        # Kokoro takes at most ~510 phoneme tokens per call: split long text at sentence or clause ends
        for chunk in narrate.split_ph(ph.phonemes(v)):
            a, _, spoken_at = ph.k.create_timed(chunk, voice=voice, speed=speed, is_phonemes=True, sentence_pause=0.3, clause_pause=0.1)
            t0 = n / 24000
            chars += [(x.phoneme, t0 + x.start, t0 + x.end) for x in spoken_at]
            audio.append(a.astype(np.float32)); n += len(a)
        timed += [(w, s, e) for w, (s, e) in item_words(ph, v, shown, chars, 0.0) if w.strip()]
    return (np.concatenate(audio) if audio else np.zeros(0, np.float32)), timed


def spectrum(pcm, sr, hop=0.02):
    """32 log-spaced bands, 60 Hz to 7 kHz, every hop seconds, each band normalized over the recording."""
    h, w = int(sr * hop), int(sr * 0.032); n = max(0, (len(pcm) - w) // h)
    fr = np.lib.stride_tricks.as_strided(pcm, (n, w), (pcm.strides[0] * h, pcm.strides[0])) * np.hanning(w)
    P = np.abs(np.fft.rfft(fr, axis=1)) ** 2; bins = np.fft.rfftfreq(w, 1 / sr); edges = np.geomspace(60, 7000, 33)
    L = np.log(np.stack([P[:, (bins >= edges[i]) & (bins < edges[i + 1])].sum(1) for i in range(32)], 1) + 1e-8)
    return ((L - L.mean(0)) / (L.std(0) + 1e-6)).astype(np.float32)


def rerender(hub, lec, level, pred, html=None):
    """The slow, exact way, for a recording the loudness alignment fits badly: speak the notes again (Kokoro's own word
    times, about a fifth of the lecture's length) and align the two recordings' spectra (same voice, so they line up
    closely wherever they say the same words). Returns the words placed on the recording, its length, and the minutes
    of the recording that don't sound like today's notes (the text changed after it was made: regenerate it with
    tools/narrate.py, text-and-audio-never-drift)."""
    if html is None: html = json.load(open(os.path.join(ROOT, "hubs", hub, "next", "content", "notes.json")))[level][lec]
    audio, timed = render_items(pred, narrate.spoken(html, shown=True))
    fresh = np.interp(np.arange(int(len(audio) * SR / 24000)) * 24000 / SR, np.arange(len(audio)), audio).astype(np.float32)
    pcm = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", mp3_path(hub, lec, level), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], check=True, capture_output=True).stdout, dtype=np.float32)
    A, B, HOP = spectrum(pcm, SR), spectrum(fresh, SR), 0.02
    first, cost = align(A, B, *band(np.arange(len(A)) * len(B) / max(1, len(A)), len(B), int(60 / HOP)), 0.15, path=True)
    at = lambda t: first[min(len(first) - 1, int(t / HOP))] * HOP
    out, last = [], 0.0
    for w, s, e in timed:
        a = max(last, at(s)); out.append((w, a, max(a, at(e)))); last = a
    mins = [m for m in range(int(len(A) * HOP / 60) + 1) if cost[int(m * 60 / HOP):int((m + 1) * 60 / HOP)].mean() > DRIFT]
    return out, len(pcm) / SR, mins


def fit(timed, loud):
    """Share of words whose start the recording is speaking at (within 60 ms): about 99.5% or more when they line up."""
    sp = loud > 0.5
    return float(np.mean([sp[int(a / FINE):int(a / FINE) + 6].any() for _, a, _ in timed])) if timed else 1.0


def build(hub, lec, level, pred=None, html=None):
    mp3 = mp3_path(hub, lec, level)
    if html is None:
        html = (json.load(open(os.path.join(ROOT, "hubs", hub, "next", "content", "notes.json"))).get(level) or {}).get(lec)
    if not html: raise SystemExit("no %s notes for %s in %s" % (level, lec, hub))
    pred = pred or Predictor()
    words, spans, breaks, plen = predict(pred, html)
    loud, alen = loudness(mp3)
    timed = place(words, spans, breaks, loud, alen)
    return write(hub, lec, level, timed, alen), plen, alen, fit(timed, loud)


def write(hub, lec, level, timed, alen):
    return write_file(mp3_path(hub, lec, level), timed, alen)


def write_file(mp3, timed, alen):
    """timed: [(word, start, end)] in seconds, in reading order; written beside the mp3 as <name>.words.json."""
    ws, ts = [], []
    for w, a, b in timed:
        ws.append(w); ts += [int(round(a * 100)), int(round(max(a, b) * 100))]
    out = {"v": 1, "bytes": os.path.getsize(mp3), "dur": round(alen, 2), "w": " ".join(ws), "t": ts}
    with open(re.sub(r"\.mp3$", ".words.json", mp3), "w") as f: json.dump(out, f, separators=(",", ":"))
    return len(ws)


def files(hub, lecs=None, levels=None):
    notes = json.load(open(os.path.join(ROOT, "hubs", hub, "next", "content", "notes.json")))
    out = []
    for level in levels or ["full", "plain"]:
        for lec in (notes.get(level) or {}):
            if lecs and lec not in lecs: continue
            if os.path.exists(mp3_path(hub, lec, level)): out.append((lec, level))
    return out


def stale(hub):
    """[(lec, level, why)] for every narration whose words file is missing or was made from another mp3."""
    bad = []
    for lec, level in files(hub):
        p = words_path(hub, lec, level)
        if not os.path.exists(p): bad.append((lec, level, "no words file")); continue
        try: d = json.load(open(p))
        except ValueError: bad.append((lec, level, "unreadable")); continue
        if d.get("bytes") != os.path.getsize(mp3_path(hub, lec, level)): bad.append((lec, level, "made from another mp3"))
        elif len(d.get("t", [])) != 2 * len(d.get("w", "").split()): bad.append((lec, level, "words and times differ in count"))
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("hub")
    ap.add_argument("--lec", action="append")
    ap.add_argument("--level", choices=["full", "plain"], action="append")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--stale", action="store_true", help="only the files --check lists")
    ap.add_argument("--render", action="store_true", help="the exact way: speak the notes again and align the recordings (slow)")
    a = ap.parse_args()
    if a.check:
        bad = stale(a.hub)
        for lec, level, why in bad: print("%s %s-%s: %s" % (a.hub, lec, level, why))
        sys.exit(1 if bad else 0)
    todo = files(a.hub, a.lec, a.level)
    if a.stale: todo = [x for x in todo if x in {(lec, level) for lec, level, _ in stale(a.hub)}]
    if not todo: print("%s: nothing to do" % a.hub); return
    pred = Predictor()
    for lec, level in todo:
        if a.render:
            timed, alen, drift = rerender(a.hub, lec, level, pred)
            n = write(a.hub, lec, level, timed, alen)
            print("%s %s-%s: %d words from a fresh rendering, recording %.1f s%s" % (a.hub, lec, level, n, alen, "; minutes %s of the recording don't match today's notes: regenerate it with tools/narrate.py" % drift if drift else ""), flush=True)
            continue
        n, plen, alen, f = build(a.hub, lec, level, pred)
        print("%s %s-%s: %d words, predicted %.1f s, recording %.1f s, %.1f%% of words start on speech%s" % (a.hub, lec, level, n, plen, alen, 100 * f, "" if f >= FIT_OK else ": a poor fit, try --render (it also says whether the notes changed after the recording)"), flush=True)


if __name__ == "__main__":
    main()
