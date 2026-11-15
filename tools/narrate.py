"""Narrate a hub's lecture notes with Kokoro: audio/<lecture>-full.mp3 (As taught), audio/<lecture>-plain.mp3 (Plain English)
and, on a hub on the engine, audio/<lecture>-hy.mp3 (High yield).

The rule (vault/rules/text-and-audio-never-drift.md): change a lecture's notes at any level and regenerate that
level's mp3 in the same PR. High yield is rebuilt from the notes, predicted topics, hints and questions
(tools/hub-next/high-yield.mjs), so it changes when they do: the smoke lint names a lecture whose High yield changed since
its mp3, and tools/hub-next/build.mjs offers the recording to the page only while it matches. Kokoro installs itself the first time it's missing (tools/kokoro-setup.sh: kokoro-onnx,
soundfile and the model files in /tmp/kokoro, or $KOKORO_DIR; vault/how-to/narrate-with-kokoro.md). Hard words use tools/podcast/lexicon.json, the same lexicon as Timmy Time.

A hub on the engine (its notes are hubs/<hub>/content/notes.json: full, plain and hy; name the hub, or the file):
  python3 tools/narrate.py <hub>                                       every lecture, all three levels (skips existing files)
  python3 tools/narrate.py <hub> --lec dmpharm --level full --force
  python3 tools/narrate.py <hub> --text --lec dmpharm                  print the spoken text, no audio
  python3 tools/narrate.py <hub> --jobs 4                              lectures in parallel processes
  python3 tools/narrate.py <hub> --level hy --lec dmpharm --force      High yield again, after it changed;
                                                                      then node tools/hub-next/build.mjs --hub <hub>
An old single-file hub (its notes are in its page): the same, with hubs/<hub>/index.html in place of <hub>.

It reads notes.json (full, plain and hy), or an old hub's `var READINGS = {...};` and `var READINGS_PLAIN = {...};`
lines (one JSON object each) or READINGS['<id>'] = `...`; template-literal blocks, turns the HTML
into spoken text (the "What's tested" box, headings with a pause, paragraphs, list items, and each table row read as
"first cell: header, cell; ..."), and writes a 24 kHz mono 64 kbps mp3 like the hubs' existing narration, and beside it
<lecture>-<level>.words.json, when each word of the notes is spoken (Kokoro's own timings), for the redesign's Follow along
(tools/narration_words.py makes the same file for an mp3 made any other way), with "h", which text it was made from
(text_hash()).
"""
import argparse, hashlib, html, json, os, re, subprocess, sys, tempfile
from html.parser import HTMLParser

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "podcast"))
SR = 24000

# symbols and shorthand read aloud (applied before phonemizing; whole tokens where it matters)
SAY = [
    (r"→", " leads to "), (r"←", " comes from "), (r"↑", " up "), (r"↓", " down "), (r"↔", " versus "),
    (r"≥", " at least "), (r"≤", " at most "), (r">=", " at least "), (r"<=", " at most "),
    (r"(?<=\d)\s*-\s*(?=\d)", " to "), (r"(?<=\d)\s*–\s*(?=\d)", " to "), (r"±", " plus or minus "),
    (r"×", " times "), (r"~\s*(?=\d)", "about "), (r"≈", " about "), (r"(?<=\d)\s*%", " percent"),
    (r"\bmg/dL\b", "milligrams per deciliter"), (r"\bmmol/L\b", "millimoles per liter"), (r"\bmEq/L\b", "milliequivalents per liter"),
    (r"\bmIU/L\b", "milli-international units per liter"), (r"\bpg/mL\b", "picograms per milliliter"), (r"\bng/dL\b", "nanograms per deciliter"),
    (r"\bvs\.?(?=\s)", "versus"), (r"\be\.g\.", "for example"), (r"\bi\.e\.", "that is"), (r"\betc\.", "and so on"),
    (r"\bHbA1c\b", "H b A one c"), (r"\bA1c\b", "A one c"), (r"\bCa2\+", "calcium"), (r"\bK\+", "potassium"), (r"\bNa\+", "sodium"),
    (r"\bT3\b", "T three"), (r"\bT4\b", "T four"), (r"\bGLP-1\b", "G L P one"), (r"\bDPP-4\b", "D P P four"), (r"\bSGLT2\b", "S G L T two"),
    (r"\bGLUT2\b", "glute two"), (r"\bGLUT4\b", "glute four"), (r"\bIGF-1\b", "I G F one"), (r"\bMEN ?1\b", "men one"), (r"\bMEN ?2A?\b", "men two"),
    (r"\b5-alpha\b", "five alpha"), (r"\b5α\b", "five alpha"), (r"α", "alpha "), (r"β", "beta "), (r"γ", "gamma "), (r"δ", "delta "),
    (r"&", " and "), (r"\s/\s", " or "), (r"\+/-", " plus or minus "), (r"\s·\s", ", "),
    # rating marks in tables (+++ / ++ / + / −) when they stand alone, not "Ca2+" or a negative number
    (r"(?<![\w+])\+\+\+(?![\w+])", " three plus "), (r"(?<![\w+])\+\+(?![\w+])", " two plus "),
    (r"(?<![\w+])\+(?![\w+])", " plus "), (r"(?<![\w−])−(?![\w−])", " minus "),
    # prescription shorthand (espeak reads "qid" as "kid", "IL-1" as "ill one")
    (r"\b1\s*mg\b", "1 milligram"), (r"(?<=\d)\s*mg\b", " milligrams"), (r"\bq(\d+)h\b", r"every \1 hours"),
    (r"\bpo\b", "P O"), (r"\bqd\b", "Q D"), (r"\bbid\b", "B I D"), (r"\btid\b", "T I D"), (r"\bqid\b", "Q I D"),
    (r"\bIL-1\b", "I L one"),
]


class Spoken(HTMLParser):
    """HTML notes -> a list of ('text', s) and ('pause', seconds) items."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items, self.buf, self.stack = [], [], []
        self.sbuf = []    # the same text as the page shows it, where it's read differently (High yield's topic numbers)
        self.table, self.row, self.cell, self.head = None, None, None, []
        self.in_tested = False
        self.shown = []   # for each "text" item, the words as the page shows them (tools/narration_words.py)

    def flush(self, pause=0.45):
        t = " ".join("".join(self.buf).split())
        s = " ".join("".join(self.sbuf).split())
        self.buf, self.sbuf = [], []
        if t:
            self.shown.append(s)
            if t[-1] not in ".?!:;": t += "."
            self.items.append(("text", t))
            self.items.append(("pause", pause))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "div" and "tested" in (a.get("class") or ""): self.in_tested = True
        if tag in ("p", "li", "h4", "h3", "h5", "blockquote") and self.table is None: self.flush()
        if tag == "table": self.flush(); self.table, self.head = [], []
        elif tag == "tr" and self.table is not None: self.row = []
        elif tag in ("td", "th") and self.table is not None: self.cell = []
        elif tag == "br": self.buf.append(" "); self.sbuf.append(" ")
        self.stack.append(tag if not (tag == "span" and "hy-n" in (a.get("class") or "")) else "hy-n")

    def handle_endtag(self, tag):
        if self.stack and (self.stack[-1] == tag or (tag == "span" and self.stack[-1] == "hy-n")): self.stack.pop()
        if self.table is not None:
            if tag in ("td", "th") and self.cell is not None:
                self.row.append(" ".join("".join(self.cell).split())); self.cell = None
            elif tag == "tr" and self.row is not None:
                if not self.head and ("th" in self.stack or self._row_is_head): self.head = self.row
                else: self.table.append(self.row)
                self.row = None; self._row_is_head = False
            elif tag == "table":
                for r in self.table:
                    if not r: continue
                    parts = [r[0]]
                    for i, c in enumerate(r[1:], 1):
                        if not c: continue
                        h = self.head[i] if i < len(self.head) else ""
                        parts.append((h + ", " + c) if h else c)
                    t = parts[0] + ": " + "; ".join(parts[1:]) if len(parts) > 1 else parts[0]
                    self.shown.append(" ".join(c for c in r if c))
                    self.items.append(("text", t.rstrip(".") + "."))
                    self.items.append(("pause", 0.35))
                self.table = None
            return
        if tag in ("h4", "h3", "h5"): self.flush(0.7)
        elif tag in ("p", "li", "blockquote"): self.flush()
        elif tag == "b" and self.in_tested and not self.items: self.flush(0.3)
        elif tag == "div" and self.in_tested: self.flush(0.8); self.in_tested = False

    _row_is_head = False

    def handle_data(self, d):
        if self.table is not None:
            if self.cell is not None: self.cell.append(d)
            if self.stack and self.stack[-1] == "th": self._row_is_head = True
            return
        # High yield's topic number (<span class="hy-n">2</span>): "Topic 2." aloud, the number alone on the page
        self.buf.append("Topic " + d.strip() + ". " if self.stack and self.stack[-1] == "hy-n" and d.strip() else d)
        self.sbuf.append(d)


def spoken(html_text, shown=False):
    """The notes as ('text', s) and ('pause', seconds) items; with shown=True each text item is ('text', s, words on the page)."""
    p = Spoken(); p.feed(html_text); p.flush()
    out, k = [], 0
    for kind, v in p.items:
        if kind == "text":
            for pat, rep in SAY: v = re.sub(pat, rep, v)
            v = re.sub(r"\(\s*\)", "", " ".join(v.split()))
            if shown: out.append((kind, v, p.shown[k])); k += 1; continue
        out.append((kind, v))
    return out


def text_hash(html_text):
    """Which text a recording was made from: the first 12 hex digits of the SHA-1 of the notes' HTML (UTF-8), as
    tools/hub-next/build.mjs and tools/ci/smoke.js compute it for High yield."""
    return hashlib.sha1(html_text.encode("utf-8")).hexdigest()[:12]


def load(path):
    """({level: {lecture: html}}, the audio folder) from a hub on the engine (hubs/<hub>/content/notes.json: full, plain
    and hy; named by its hub id, its folder, its page or the file itself) or an old single-file hub's index.html (full, plain)."""
    root = os.path.dirname(HERE)
    if not os.path.isfile(path) and os.path.isfile(os.path.join(root, "hubs", path, "content", "notes.json")):
        path = os.path.join(root, "hubs", path, "content", "notes.json")            # a hub id
    elif os.path.isdir(path) and os.path.isfile(os.path.join(path, "content", "notes.json")):
        path = os.path.join(path, "content", "notes.json")                          # the hub's folder
    elif path.endswith(".html") and os.path.isfile(os.path.join(os.path.dirname(os.path.abspath(path)), "content", "notes.json")):
        path = os.path.join(os.path.dirname(os.path.abspath(path)), "content", "notes.json")   # the engine hub's page
    if path.endswith(".json"):
        notes = json.load(open(path, encoding="utf-8"))
        hub_dir = os.path.dirname(os.path.dirname(os.path.abspath(path)))
        return {lv: notes[lv] for lv in ("full", "plain", "hy") if isinstance(notes.get(lv), dict)}, os.path.join(hub_dir, "audio")
    return readings(open(path, encoding="utf-8").read()), os.path.join(os.path.dirname(os.path.abspath(path)), "audio")


def readings(hub_html):
    def grab(name):
        m = re.search(r"^var " + name + r" = (\{.*\});$", hub_html, re.M)
        if m and json.loads(m.group(1)): return json.loads(m.group(1))
        # perio's layout: `var NAME = {};`, then one template literal per lecture, NAME['<id>'] = `...`; closed by a `; line
        out = {}
        for lec, body in re.findall(r"^" + name + r"\['([^']+)'\] = `\n?(.*?)\n?`;$", hub_html, re.M | re.S):
            if "${" in body or "\\" in body: sys.exit(name + "['" + lec + "'] uses ${...} or a backslash escape: not supported")
            out[lec] = body
        if not out: sys.exit("no `var " + name + " = {...};` line and no " + name + "['<id>'] = `...`; blocks in the hub")
        return out
    return {"full": grab("READINGS"), "plain": grab("READINGS_PLAIN")}


def render(items, out_mp3, voice, speed, h=None):
    """items: spoken(html, shown=True). Writes out_mp3 and, beside it, its words file (tools/narration_words.py) from
    Kokoro's own timings: when each word of the notes is spoken, for the redesign's Follow along highlight; h: text_hash()
    of the notes it was made from."""
    from kokoro_ready import ensure
    kdir = ensure()   # installs Kokoro the first time it's missing (tools/kokoro-setup.sh)
    import soundfile as sf
    import narration_words as nw
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(kdir, "kokoro-v1.0.onnx"), os.path.join(kdir, "voices-v1.0.bin"))
    audio, timed = nw.render_items(nw.Phonemes(k), items, voice, speed)
    wav = tempfile.mktemp(suffix=".wav")
    sf.write(wav, audio, SR)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", str(SR), "-b:a", "64k", out_mp3], check=True)
    os.remove(wav)
    nw.write_file(out_mp3, timed, len(audio) / SR, h)


def split_ph(ph, n=400):
    if len(ph) <= n: return [ph]
    out, cur = [], ""
    for part in re.split(r"(?<=[.!?;:,])\s+", ph):
        if len(cur) + len(part) + 1 > n and cur: out.append(cur); cur = part
        else: cur = (cur + " " + part).strip()
    if cur: out.append(cur)
    final = []
    for c in out:
        while len(c) > n:
            i = c.rfind(" ", 0, n); i = i if i > 0 else n
            final.append(c[:i]); c = c[i:].strip()
        final.append(c)
    return final


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("hub")
    ap.add_argument("--lec", action="append")
    ap.add_argument("--level", choices=["full", "plain", "hy"], action="append")
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--text", action="store_true")
    ap.add_argument("--jobs", type=int, default=1)
    a = ap.parse_args()
    R, audio_dir = load(a.hub)
    os.makedirs(audio_dir, exist_ok=True)
    jobs = []
    for level in (a.level or list(R)):
        if level not in R: sys.exit("no %s level in %s" % (level, a.hub))
        for lec in R[level]:
            if a.lec and lec not in a.lec: continue
            out = os.path.join(audio_dir, "%s-%s.mp3" % (lec, level))
            if a.text:
                print("=== %s %s" % (lec, level)); print("\n".join(v for k, v in spoken(R[level][lec]) if k == "text")); continue
            if os.path.exists(out) and not a.force: print("skip", out); continue
            jobs.append((lec, level, out))
    if a.text or not jobs: return
    from kokoro_ready import ensure
    ensure()   # once, before any parallel workers start, so they don't all install it at the same time
    if a.jobs > 1 and len(jobs) > 1:
        # longest lecture first, each to the worker with the least text so far, so they all finish about together
        loads = [[0, []] for _ in range(a.jobs)]
        for job in sorted(jobs, key=lambda j: -len(R[j[1]][j[0]])):
            w = min(loads, key=lambda x: x[0]); w[0] += len(R[job[1]][job[0]]); w[1].append(job)
        procs = []
        for _, mine in loads:
            if not mine: continue
            args = [sys.executable, os.path.abspath(__file__), a.hub, "--voice", a.voice, "--speed", str(a.speed), "--force"]
            for lec, level, _ in mine: args += ["--only", lec + ":" + level]
            procs.append(subprocess.Popen(args, env=dict(os.environ, OMP_NUM_THREADS="1")))
        sys.exit(max(p.wait() for p in procs))
    for lec, level, out in jobs:
        render(spoken(R[level][lec], shown=True), out, a.voice, a.speed, text_hash(R[level][lec])); print("wrote", out, flush=True)


if __name__ == "__main__":
    if "--only" in sys.argv:
        # internal: a worker process for --jobs
        i = sys.argv.index("--only"); pairs = []
        argv = sys.argv[1:]
        while "--only" in argv:
            j = argv.index("--only"); pairs.append(argv[j + 1]); del argv[j:j + 2]
        hub = argv[0]; voice = argv[argv.index("--voice") + 1]; speed = float(argv[argv.index("--speed") + 1])
        R, audio_dir = load(hub)
        for p in pairs:
            lec, level = p.split(":")
            out = os.path.join(audio_dir, "%s-%s.mp3" % (lec, level))
            render(spoken(R[level][lec], shown=True), out, voice, speed, text_hash(R[level][lec])); print("wrote", out, flush=True)
    else:
        main()
