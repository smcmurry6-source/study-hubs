// Fig: the neuromuscular junction and the L32 drugs (MSK Exam 4, L31 end plate + L32 NMJ pharmacology).
// Everything drawn and said comes from the hub's own L31/L32 notes; see SOURCES below.
import { fitProjection, iso, figureSvg, plateHtml, blobOf, blobSvg, membraneOf, membraneSvg, f1, esc, callout, ring } from "./shared.mjs";

const W = 640, H = 380;
const ZPRE = 34;          // underside of the nerve terminal (cleft top)
const MEM = 2.6;          // membrane thickness
const TERM = { a: 96, top: 112, p: 0.6 };
const FOLDS = [-66, -22, 22, 66];               // junctional folds (troughs)
const FOLD_W = 6, FOLD_D = 30;
const RECX = [-94, -82, -50, -38, -6, 6, 38, 50, 82, 94];   // postjunctional nicotinic receptors, on the fold crests
const NAX = [-150, -128, 128, 150];                          // perijunctional voltage-gated Na+ channels
const PREX = [-78, 78];                                      // prejunctional nicotinic receptors
const ACHEX = [-88, -60, -30, 0, 30, 60, 88];                // acetylcholinesterase in the cleft
const ACHE_Z = 15;
const VR = 8;
const VES = [
  { x: -44, z: ZPRE + MEM + VR + 0.6, dock: true }, { x: 0, z: ZPRE + MEM + VR + 0.6, dock: true }, { x: 44, z: ZPRE + MEM + VR + 0.6, dock: true },
  { x: -66, z: 62 }, { x: -22, z: 64 }, { x: 22, z: 63 }, { x: 64, z: 60 }, { x: -2, z: 82 }, { x: -40, z: 84 }, { x: 40, z: 80 },
];
const MITO = [{ x: -48, z: 98, rx: 20, rz: 8.5 }, { x: 34, z: 100, rx: 22, rz: 8.5 }];
const FIBER = { x0: -172, x1: 172, z1: -112 };
const STRIA = { z0: -42, z1: -112, period: 24, a: 14 };

const bounds = [[-250, 0, -116], [250, 0, 170]];
const P = fitProjection(bounds, W, H, { pad: 8, azimuth: 90, elevation: 12 });
const S = (x, z) => iso([x, 0, z], P).map(f1);
const KX = S(1, 0)[0] - S(0, 0)[0];
const KZ = S(0, 1)[1] - S(0, 0)[1];

const termRing = (inset, n = 40) => {
  const zb = ZPRE + inset, zt = TERM.top - inset, a = TERM.a - inset, zc = zb + 6;
  const sg = (v) => Math.sign(v) * Math.abs(v) ** TERM.p;
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    return [a * sg(c), 0, s >= 0 ? zc + (zt - zc) * sg(s) : zc - 6 * Math.abs(s) ** TERM.p];
  });
};
// Schwann cell cap: a crescent over the top of the terminal, from one shoulder to the other.
const capRing = () => {
  const inner = termRing(-0.6, 44).filter(([, , z]) => z > 70).sort((p, q) => q[0] - p[0]);
  const outer = termRing(-15, 44).filter(([, , z]) => z > 66).sort((p, q) => p[0] - q[0]);
  return [...inner, ...outer];
};
// Sarcolemma: flat between folds, each fold a narrow trough; points run left → right along the top.
const sarcoTop = (inset) => {
  const pts = [[FIBER.x0, 0, -inset]];
  let x = FIBER.x0 + 30;
  for (const fx of FOLDS) {
    for (; x < fx - 12; x += 14) pts.push([x, 0, -inset]);
    const w = FOLD_W - inset;
    pts.push([fx - w - 5, 0, -inset], [fx - w, 0, -5 - inset], [fx - w, 0, -FOLD_D + 5], [fx - w + 1.5, 0, -FOLD_D - inset * 0.4], [fx + w - 1.5, 0, -FOLD_D - inset * 0.4], [fx + w, 0, -FOLD_D + 5], [fx + w, 0, -5 - inset], [fx + w + 5, 0, -inset]);
    x = fx + 12;
  }
  for (; x < FIBER.x1 - 20; x += 14) pts.push([x, 0, -inset]);
  pts.push([FIBER.x1, 0, -inset]);
  return pts;
};
const pathOf = (pts, close = false) => pts.map((p, i) => { const s = S(p[0], p[2]); return `${i ? "L" : "M"}${s[0]} ${s[1]}`; }).join("") + (close ? "Z" : "");

// ---- static art ----
const term = blobOf(termRing(MEM), P, { tone: "hi", highlight: 0.86, shade: 0.93 });
const termMem = membraneOf(termRing(0), termRing(MEM), P, { tone: "hi" });
const cap = blobOf(capRing(), P, { tone: "mid", highlight: 0.94, shade: 0.97 });
const axon = blobOf([[-11, 0, 104], [-10, 0, 150], [-9, 0, 172], [9, 0, 172], [10, 0, 150], [11, 0, 104]], P, { tone: "hi", highlight: 0.8, shade: 0.9 });

const fiberTop = sarcoTop(0);
// the fiber runs on past the frame: its cut ends are drawn as a break (zigzag), not as a flat side
const breakEdge = (x, down) => { const pts = []; for (let i = 1; i <= 7; i++) pts.push([x + (i % 2 ? 3.5 : -3.5), 0, -(FIBER.z1 * -1) * (down ? i / 8 : 1 - i / 8)]); return pts; };
const fiberBody = pathOf([...fiberTop, ...breakEdge(FIBER.x1, true), [FIBER.x1, 0, FIBER.z1], [FIBER.x0, 0, FIBER.z1], ...breakEdge(FIBER.x0, false)], true);
const sarcoD = pathOf(fiberTop);
const sarcoIn = pathOf(sarcoTop(MEM));

const vesicleSvg = (v) => { const c = S(v.x, v.z), r = f1(VR * KX); return `<g class="bio-blob" data-tone="lit"><circle class="bio-blob-base" cx="${c[0]}" cy="${c[1]}" r="${r}"/><circle class="bio-blob-shade" cx="${c[0]}" cy="${c[1]}" r="${f1(r * 0.88)}"/><circle class="bio-blob-highlight" cx="${c[0]}" cy="${c[1]}" r="${f1(r * 0.74)}"/><circle class="iso-line bio-blob-edge" data-tone="lit" cx="${c[0]}" cy="${c[1]}" r="${r}"/></g>`; };
const vesDots = (v) => [[-3.2, 1.4], [3, 2.2], [0, -3.4], [-1.5, 4.4], [3.8, -2]].map((o) => {
  const [x, y] = S(v.x + o[0], v.z + o[1] * 0.9);
  return `<circle class="nm-vdot" cx="${x}" cy="${y}" r="1.9"/>`;
}).join("");
const snare = (v) => {
  const a = S(v.x - 3, v.z - VR + 0.4), b = S(v.x - 3.4, ZPRE + MEM), c = S(v.x + 3, v.z - VR + 0.4), d = S(v.x + 3.4, ZPRE + MEM);
  const cut = S(v.x, (v.z - VR + ZPRE + MEM) / 2);
  return `<g class="nm-snare"><path class="nm-snare-line" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}M${c[0]} ${c[1]}L${d[0]} ${d[1]}"/><path class="nm-cut" d="M${cut[0] - 5} ${cut[1] - 4}L${cut[0] + 5} ${cut[1] + 4}M${cut[0] + 5} ${cut[1] - 4}L${cut[0] - 5} ${cut[1] + 4}"/></g>`;
};
const mito = (m) => {
  const b = blobOf(ring(m.x, m.z, m.rx, m.rz, 14), P, { tone: "mid", highlight: 0.8, shade: 0.9 });
  const cr = [-0.6, -0.2, 0.2, 0.6].map((t, i) => {
    const x = m.x + t * m.rx, z0 = i % 2 ? m.z + m.rz * 0.75 : m.z - m.rz * 0.75, z1 = m.z + (i % 2 ? -1 : 1) * m.rz * 0.1;
    const a = S(x, z0), c = S(x, z1);
    return `M${a[0]} ${a[1]}L${c[0]} ${c[1]}`;
  }).join("");
  return `${blobSvg(b)}<path class="nm-crista" d="${cr}"/>`;
};

// Receptor: two halves spanning a membrane, the pore between them; `up` = binding sites face +z (prejunctional faces −z).
const receptor = (x, zBase, h, cls, i, up = true) => {
  const z0 = up ? zBase - 1.2 : zBase + 1.2, z1 = up ? zBase + h : zBase - h;
  const half = (xa, xb) => { const [a, b] = [S(xa, Math.max(z0, z1)), S(xb, Math.min(z0, z1))]; return `<rect class="nm-rec-half" x="${a[0]}" y="${a[1]}" width="${f1(b[0] - a[0])}" height="${f1(b[1] - a[1])}" rx="2.4"/>`; };
  const pore = (() => { const [a, b] = [S(x - 1.1, Math.max(z0, z1) - 1), S(x + 1.1, Math.min(z0, z1) + 1)]; return `<rect class="nm-pore" x="${a[0]}" y="${a[1]}" width="${f1(b[0] - a[0])}" height="${f1(b[1] - a[1])}" rx="1"/>`; })();
  const site = S(x, up ? z1 + 2.2 : z1 - 2.2);
  return `<g class="${cls}" data-i="${i}">${pore}${half(x - 4.6, x - 1.1)}${half(x + 1.1, x + 4.6)}<circle class="nm-site" cx="${site[0]}" cy="${site[1]}" r="2.2"/></g>`;
};
// Voltage-gated Na+ channel with its inactivation gate (a ball on a tether, inside the fiber).
const naChannel = (x, i) => {
  const [a, b] = [S(x - 4.4, 2), S(x - 1.2, -MEM - 4)], [c, d] = [S(x + 1.2, 2), S(x + 4.4, -MEM - 4)];
  const [p0, p1] = [S(x - 1.2, 1), S(x + 1.2, -MEM - 3)];
  const anchor = S(x + 4.4, -MEM - 3), rest = S(x + 8, -MEM - 9), plug = S(x, -MEM - 6);
  return `<g class="nm-na" data-i="${i}"><rect class="nm-na-pore" x="${p0[0]}" y="${p0[1]}" width="${f1(p1[0] - p0[0])}" height="${f1(p1[1] - p0[1])}"/><rect class="nm-na-half" x="${a[0]}" y="${a[1]}" width="${f1(b[0] - a[0])}" height="${f1(b[1] - a[1])}" rx="1.6"/><rect class="nm-na-half" x="${c[0]}" y="${c[1]}" width="${f1(d[0] - c[0])}" height="${f1(d[1] - c[1])}" rx="1.6"/><path class="nm-tether" d="M${anchor[0]} ${anchor[1]}Q${rest[0]} ${anchor[1]} ${rest[0]} ${rest[1]}"/><path class="nm-tether nm-tether-in" d="M${anchor[0]} ${anchor[1]}Q${plug[0] + 3} ${anchor[1] + 4} ${plug[0]} ${plug[1]}"/><circle class="nm-ball nm-ball-out" cx="${rest[0]}" cy="${rest[1]}" r="2.6"/><circle class="nm-ball nm-ball-in" cx="${plug[0]}" cy="${plug[1]}" r="2.6"/></g>`;
};
const ache = (x, i) => {
  const c = S(x, ACHE_Z);
  // an enzyme glyph: a disc with a cleft (active site) on the side that faces the receptors
  return `<g class="nm-ache" data-i="${i}" transform="translate(${c[0]} ${c[1]})"><path class="nm-ache-body" d="M0 -6.2A6.2 6.2 0 1 0 5.4 3L1.6 0.6 0.4 6.2Z"/><path class="nm-neo" d="M-1 -12.6L4.6 -4.8H-6.6Z"/></g>`;
};

const striations = (() => {
  let d = "", z = "";
  for (let x = FIBER.x0 - STRIA.period * 2; x < FIBER.x1 + STRIA.period * 2; x += STRIA.period) {
    const [a, b] = [S(x, STRIA.z0), S(x + STRIA.a, STRIA.z1)];
    d += `M${a[0]} ${a[1]}H${b[0]}V${b[1]}H${a[0]}Z`;
    const zx = x + STRIA.a + (STRIA.period - STRIA.a) / 2;
    const [p, q] = [S(zx, STRIA.z0), S(zx, STRIA.z1)];
    z += `M${p[0]} ${p[1]}V${q[1]}`;
  }
  return { a: d, z };
})();
const nucleus = blobOf(ring(126, -24, 22, 7.5, 14), P, { tone: "mid", highlight: 0.8, shade: 0.9 });

const INFO = {
  axon: "Motor axon from an alpha motor neuron (cell body in the spinal cord's ventral horn). Its action potential arrives at the terminal and triggers ACh release.",
  cap: "Schwann cell: caps the nerve terminal.",
  term: "Motor nerve terminal: holds mitochondria and synaptic vesicles full of acetylcholine (ACh).",
  ves: "Synaptic vesicles hold ACh. The docked ones sit on the membrane, tethered by SNARE proteins, and fuse to release ACh when an impulse arrives. Botulinum toxin cleaves the SNARE docking protein, so there is no ACh release.",
  mito: "Mitochondria in the nerve terminal.",
  pre: "Prejunctional nicotinic receptors on the nerve terminal normally boost ACh mobilization during repeated firing. Nondepolarizers block these too, which is why their train-of-four responses fade.",
  cleft: "Synaptic cleft (gap drawn much wider than real). ACh crosses it to reach the receptors.",
  ache: "Acetylcholinesterase (AChE) in the cleft breaks ACh down and ends the signal. It does not break down succinylcholine, which plasma pseudocholinesterase clears instead. Neostigmine inhibits AChE.",
  rec: "Nicotinic ACh receptors on the junctional folds of the end plate. ACh opens them (Na+ in, K+ out) and the sarcolemma depolarizes. Succinylcholine opens them too (agonist); rocuronium, vecuronium and cisatracurium block them (competitive antagonists).",
  na: "Perijunctional voltage-gated Na+ channels: once the end plate depolarizes they fire the muscle action potential (under 5 ms). In a lasting depolarization (succinylcholine) their inactivation gates stay shut, so no new action potential can fire.",
  fiber: "Skeletal muscle fiber: a multinucleated syncytium, striated because actin and myosin lie in register. The action potential runs down the T tubules and calcium release makes it contract.",
  nucleus: "Nuclei sit at the edge of the fiber, under the sarcolemma.",
  folds: "Junctional folds: the sarcolemma under the terminal is thrown into folds that hold the nicotinic receptors.",
};

const MODEL = {
  none: { label: "No drug", readout: "end plate: brief EPP · muscle: twitches", tof: [1, 1, 1, 1], tofNote: "no fade",
    summary: "Each nerve impulse releases ACh, which opens nicotinic receptors on the junctional folds. The end plate depolarizes, the perijunctional Na+ channels fire a muscle action potential and the fiber twitches. AChE in the cleft breaks ACh down within milliseconds, so the end plate repolarizes and is ready for the next impulse." },
  sux: { label: "Succinylcholine", readout: "end plate: stays depolarized · muscle: flaccid", tof: [0.35, 0.35, 0.35, 0.35], tofNote: "weak, no fade (phase I)",
    summary: "Succinylcholine is a nicotinic agonist: it opens the receptors like ACh, the Na+ channels fire and the muscle fasciculates. But AChE doesn't break it down (plasma pseudocholinesterase clears it), so the end plate stays depolarized, the Na+ channels' inactivation gates stay shut and the muscle goes flaccid. Neostigmine would make this block worse." },
  roc: { label: "Rocuronium", readout: "end plate: no EPP · muscle: flaccid", tof: [0.62, 0.42, 0.26, 0.13], tofNote: "fade",
    summary: "Rocuronium (like vecuronium and cisatracurium) is a competitive nicotinic antagonist: it sits on the receptors, so the ACh that is still released can't open them. No fasciculations, just paralysis. It also blocks the prejunctional receptors that boost ACh mobilization during repeated firing, so train-of-four responses fade." },
  neo: { label: "Roc + neostigmine", readout: "AChE: inhibited · ACh outcompetes roc", tof: [0.95, 0.93, 0.91, 0.89], tofNote: "fade going",
    summary: "Neostigmine inhibits AChE, so released ACh builds up in the cleft and outcompetes rocuronium for the receptors: transmission comes back. An antimuscarinic (atropine or glycopyrrolate) is given first to block the extra ACh's bradycardia and bronchospasm (not drawn). Not used for succinylcholine: more ACh would deepen that block." },
  sug: { label: "Roc + sugammadex", readout: "roc: encapsulated · receptors free", tof: [1, 0.98, 0.97, 0.96], tofNote: "no fade",
    summary: "Sugammadex, a modified γ-cyclodextrin, binds (encapsulates) rocuronium or vecuronium molecules so they can't reach the receptors, and transmission returns without raising ACh. It can interfere with hormonal contraceptives. It doesn't reverse succinylcholine." },
  botox: { label: "Botulinum toxin", readout: "no ACh release · muscle: flaccid", tof: null, tofNote: "",
    summary: "Botulinum toxin A cleaves the SNARE docking protein, so vesicles can't fuse and no ACh is released: the nerve still fires, but the muscle stays relaxed. Injected for dystonia, blepharospasm, hyperhidrosis, migraine and refractory bruxism (temporalis/masseter), among others. (Its real onset takes days; here it is instant.)" },
};

const hot = (key, inner) => `<g class="hot" tabindex="0" data-part="${key}" data-info="${esc(INFO[key])}">${inner}</g>`;
const body = [
  `<ellipse class="nm-halo" cx="${S(0, -116)[0]}" cy="${S(0, -116)[1]}" rx="${f1(170 * KX)}" ry="10"/>`,
  `<defs><clipPath id="nm-fclip"><path d="${fiberBody}"/></clipPath><linearGradient id="nm-cleft-g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" style="stop-color:var(--anatomy-shade-1);stop-opacity:0"/><stop offset=".16" style="stop-color:var(--anatomy-shade-1);stop-opacity:1"/><stop offset=".84" style="stop-color:var(--anatomy-shade-1);stop-opacity:1"/><stop offset="1" style="stop-color:var(--anatomy-shade-1);stop-opacity:0"/></linearGradient></defs>`,
  hot("fiber", `<path class="nm-fiber" d="${fiberBody}"/><g clip-path="url(#nm-fclip)"><g class="nm-stria" data-scale><path class="nm-aband" d="${striations.a}"/><path class="nm-zline" d="${striations.z}"/></g></g><path class="nm-fiber-edge" d="${fiberBody}"/>`),
  hot("nucleus", blobSvg(nucleus)),
  `<path class="nm-epp" d="${sarcoD}"/>`,
  hot("folds", `<path class="nm-sarco" d="${sarcoD}"/><path class="nm-sarco-in" d="${sarcoIn}"/>`),
  `<path class="nm-ap nm-ap-l" d="${pathOf(sarcoTop(-1.2).filter((p) => p[0] <= -100).reverse())}"/><path class="nm-ap nm-ap-r" d="${pathOf(sarcoTop(-1.2).filter((p) => p[0] >= 100))}"/>`,
  hot("rec", RECX.map((x, i) => receptor(x, 0, 7.5, "nm-rec", i)).join("")),
  hot("na", NAX.map(naChannel).join("")),
  hot("cleft", `<path class="nm-cleft" d="${(() => { const [a, b] = [S(-124, ZPRE - 0.4), S(124, 1)]; return `M${a[0]} ${a[1]}H${b[0]}V${b[1]}H${a[0]}Z`; })()}"/>`),
  hot("ache", ACHEX.map(ache).join("")),
  hot("axon", blobSvg(axon) + `<circle class="nm-nap" cx="${S(0, 168)[0]}" cy="${S(0, 168)[1]}" r="4.2"/>`),
  hot("cap", blobSvg(cap)),
  hot("term", `${blobSvg(term)}${membraneSvg(termMem)}`),
  hot("mito", MITO.map(mito).join("")),
  hot("ves", VES.map((v, i) => `<g class="nm-ves${v.dock ? " nm-dock" : ""}" data-i="${i}">${vesicleSvg(v)}${vesDots(v)}</g>`).join("") + VES.filter((v) => v.dock).map(snare).join("") + VES.filter((v) => v.dock).map((v) => { const p = S(v.x, ZPRE + MEM * 0.5); return `<ellipse class="nm-fuse" cx="${p[0]}" cy="${p[1]}" rx="6" ry="3"/>`; }).join("")),
  hot("pre", PREX.map((x, i) => receptor(x, ZPRE + 1.2, 5.5, "nm-pre", i, false)).join("")),
  `<g class="nm-particles"></g>`,
  callout(S, ["motor axon"], [9, 150], [40, 160], "start"),
  callout(S, ["Schwann cell"], [-70, 116], [-112, 130], "end"),
  callout(S, ["mitochondrion"], [52, 101], [120, 112], "start"),
  callout(S, ["ACh vesicles"], [-66 - VR, 62], [-120, 82], "end"),
  callout(S, ["prejunctional", "nicotinic receptor"], [-78 - 4.6, ZPRE - 2], [-128, 52], "end"),
  callout(S, ["AChE", "in the cleft"], [88 + 6, ACHE_Z], [172, 38], "start"),
  callout(S, ["nicotinic", "receptors"], [94 + 4.6, 5], [172, 10], "start"),
  callout(S, ["junctional", "folds"], [-66 - FOLD_W, -18], [-178, -26], "end"),
  callout(S, ["voltage-gated", "Na+ channels"], [-154.4, -MEM - 2], [-160, 24], "end"),
  callout(S, ["muscle fiber"], [-150, -80], [-178, -70], "end"),
].join("");

const svgFig = figureSvg({ width: W, height: H, className: "nm-fig",
  label: "Schematic cutaway of a neuromuscular junction: a motor nerve terminal capped by a Schwann cell, with mitochondria, ACh vesicles and prejunctional nicotinic receptors; the synaptic cleft with acetylcholinesterase; and the muscle fiber's end plate, its sarcolemma folded into junctional folds that carry nicotinic receptors, with perijunctional voltage-gated sodium channels beside it. A selector shows no drug, succinylcholine, rocuronium, rocuronium reversed by neostigmine or by sugammadex, and botulinum toxin.",
  body });

const plate = plateHtml({ fig: "Fig 1", title: "The NMJ and its drugs", hint: "tap a part", readout: MODEL.none.readout, body: `<div class="am-svg">${svgFig}</div>` });

const KEYS = Object.keys(MODEL);
const controls = `<div class="am-controls"><fieldset><legend>Drug at the junction</legend>${KEYS.map((k, i) => `<label class="am-chip"><input type="radio" name="nm-drug" value="${k}"${i ? "" : " checked"}>${esc(MODEL[k].label)}</label>`).join("")}</fieldset><button type="button" class="am-btn nm-pause" aria-pressed="false">Pause</button></div>
<div class="nm-tof" aria-live="polite"><span class="nm-tof-k">Train of four</span><span class="nm-tof-bars">${[0, 1, 2, 3].map(() => `<i><b></b></i>`).join("")}</span><span class="nm-tof-note"></span></div>
<div class="nm-key"><span><svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3.6" class="nm-k-ach"/></svg>ACh</span><span><svg viewBox="0 0 16 12" aria-hidden="true"><circle cx="4.5" cy="6" r="3.2" class="nm-k-ach"/><circle cx="11.5" cy="6" r="3.2" class="nm-k-ach"/><path d="M7.5 6H8.5" class="nm-k-bond"/></svg>succinylcholine</span><span><svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="2" width="8" height="8" class="nm-k-roc"/></svg>rocuronium</span><span><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.5L10.5 9.5H1.5Z" class="nm-k-neo"/></svg>neostigmine</span><span><svg viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5" class="nm-k-sug"/></svg>sugammadex</span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover a part of the drawing for what it does.</p>`;

const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Drawn from the hub's L31 (Skeletal Muscle, Dr. Latimer) and L32 (Pharmacology of the Neuromuscular Junction, Dr. Wilborn) notes: the terminal, Schwann cell, vesicles, junctional folds with nicotinic receptors, AChE, the perijunctional Na+ channels and each drug's action.</li>
<li>Schematic, not to scale: the cleft is drawn far wider than real, and the numbers of vesicles, receptors, channels and molecules, every speed and every timing are illustrative.</li>
<li>Train-of-four bars are qualitative (fade vs no fade), not measured values. The notes give TOF 0.15–0.25 for surgical paralysis and above 0.9 to extubate as FYI.</li>
<li>Off the drawing: plasma pseudocholinesterase (clears succinylcholine), the antimuscarinic given with neostigmine, malignant hyperthermia (ryanodine receptor, dantrolene) and hyperkalemia.</li>
<li>Educational only, not medical advice; no doses are shown.</li></ul></details>`;

const DATA = {
  map: { ox: S(0, 0)[0], oy: S(0, 0)[1], kx: KX, kz: KZ },
  zpre: ZPRE, mem: MEM, recx: RECX, prex: PREX, achex: ACHEX, achez: ACHE_Z, nax: NAX,
  dock: VES.filter((v) => v.dock).map((v) => v.x), model: MODEL, strCx: S(0, 0)[0],
  wide: `0 0 ${W} ${H}`, narrow: (() => { const [a, b] = [S(-184, 178), S(184, -126)]; return `${a[0]} ${a[1]} ${f1(b[0] - a[0])} ${f1(b[1] - a[1])}`; })(),
};

// ---- live behavior (serialized into the hub; runs per mounted figure) ----
function nmjLive(root, DATA) {
  var NS = "http://www.w3.org/2000/svg";
  var svg = root.querySelector(".nm-fig");
  var gP = svg.querySelector(".nm-particles");
  var readout = root.querySelector("[data-readout]");
  var summary = root.querySelector(".am-summary");
  var infoEl = root.querySelector(".am-info");
  var pauseBtn = root.querySelector(".nm-pause");
  var radios = Array.prototype.slice.call(root.querySelectorAll('input[type="radio"]'));
  var recs = Array.prototype.slice.call(svg.querySelectorAll(".nm-rec"));
  var pres = Array.prototype.slice.call(svg.querySelectorAll(".nm-pre"));
  var nas = Array.prototype.slice.call(svg.querySelectorAll(".nm-na"));
  var aches = Array.prototype.slice.call(svg.querySelectorAll(".nm-ache"));
  var fuses = Array.prototype.slice.call(svg.querySelectorAll(".nm-fuse"));
  var nap = svg.querySelector(".nm-nap");
  var stria = svg.querySelector("[data-scale]");
  var tofBars = Array.prototype.slice.call(root.querySelectorAll(".nm-tof-bars b"));
  var tofNote = root.querySelector(".nm-tof-note");
  var tofBox = root.querySelector(".nm-tof");
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var M0 = DATA.map, sx = function(x){ return M0.ox + x * M0.kx; }, sz = function(z){ return M0.oy + z * M0.kz; };
  var CYCLE = 2.4, NREC = DATA.recx.length;
  var seed = 7, rnd = function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var randn = function(){ return Math.sqrt(-2 * Math.log(1 - rnd() * 0.999999)) * Math.cos(2 * Math.PI * rnd()); };
  var drug = "none", t = 0, nerveT = 0.6, apT = -1, playing = !reduce.matches, visible = true, frame = 0, last = 0;
  var rec = [], pre = [], na = [], parts = [], free = [], twitch = 0, twitchV = 0, depol = 0, fuseA = [0, 0, 0], apWave = 0, napT = -1;

  function slot(){
    var g = document.createElementNS(NS, "g"); g.setAttribute("class", "nm-p");
    var a = document.createElementNS(NS, "circle"); a.setAttribute("r", "3.2"); a.setAttribute("class", "nm-k-ach");
    var s = document.createElementNS(NS, "g");
    var s1 = document.createElementNS(NS, "circle"); s1.setAttribute("r", "3"); s1.setAttribute("cx", "-3.4"); s1.setAttribute("class", "nm-k-ach");
    var s2 = document.createElementNS(NS, "circle"); s2.setAttribute("r", "3"); s2.setAttribute("cx", "3.4"); s2.setAttribute("class", "nm-k-ach");
    s.appendChild(s1); s.appendChild(s2);
    var r = document.createElementNS(NS, "rect"); r.setAttribute("x", "-3.6"); r.setAttribute("y", "-3.6"); r.setAttribute("width", "7.2"); r.setAttribute("height", "7.2"); r.setAttribute("class", "nm-k-roc");
    var u = document.createElementNS(NS, "circle"); u.setAttribute("r", "7"); u.setAttribute("class", "nm-k-sug");
    g.appendChild(a); g.appendChild(s); g.appendChild(r); g.appendChild(u); gP.appendChild(g);
    return { g: g, a: a, s: s, r: r, u: u };
  }
  function spawn(kind, x, z, extra){
    if(parts.length > 90) return null;
    var el = free.pop() || slot();
    var p = { el: el, kind: kind, x: x, z: z, vx: 0, vz: 0, age: 0, st: "free", alpha: 1 };
    if(extra) for(var k in extra) p[k] = extra[k];
    el.a.style.display = kind === "ach" ? "" : "none";
    el.s.style.display = kind === "sux" ? "" : "none";
    el.r.style.display = kind === "roc" || kind === "cplx" ? "" : "none";
    el.u.style.display = kind === "sug" || kind === "cplx" ? "" : "none";
    el.g.style.display = "";
    parts.push(p); return p;
  }
  function kill(i){ var p = parts[i]; p.el.g.style.display = "none"; free.push(p.el); parts.splice(i, 1); }
  function wander(p, dt, sigma, tau, bx, bz){
    var k = Math.sqrt(2 / tau) * sigma * Math.sqrt(dt);
    p.vx += (-p.vx / tau) * dt + k * randn() + (bx || 0) * dt;
    p.vz += (-p.vz / tau) * dt + k * randn() + (bz || 0) * dt;
    p.x += p.vx * dt; p.z += p.vz * dt;
    if(p.z > DATA.zpre - 3){ p.z = DATA.zpre - 3; p.vz = -Math.abs(p.vz); }
    if(p.z < 9){ p.z = 9; p.vz = Math.abs(p.vz); }
  }
  function nearestFree(x, kind){
    var best = -1, bd = 1e9;
    for(var i = 0; i < NREC; i++){ if(rec[i].occ) continue; var d = Math.abs(DATA.recx[i] - x); if(d < bd){ bd = d; best = i; } }
    return best;
  }
  function reset(){
    while(parts.length) kill(parts.length - 1);
    seed = 7; t = 0; nerveT = 0.5; apT = -1; twitch = 0; twitchV = 0; depol = 0; apWave = 0; napT = -1; fuseA = [0, 0, 0];
    rec = DATA.recx.map(function(){ return { occ: null, open: 0, hold: 0 }; });
    pre = DATA.prex.map(function(){ return { occ: null }; });
    na = DATA.nax.map(function(){ return { st: "rest", t: 0 }; });
    var startsBlocked = drug === "roc" || drug === "neo" || drug === "sug";
    if(startsBlocked){
      for(var i = 0; i < NREC; i++){ rec[i].occ = "roc"; spawn("roc", DATA.recx[i], 9.4, { st: "bound", rec: i }); }
      for(var j = 0; j < pre.length; j++){ pre[j].occ = "roc"; spawn("roc", DATA.prex[j], DATA.zpre - 6.2, { st: "boundpre", rec: j }); }
      for(var r = 0; r < 4; r++) spawn("roc", -90 + rnd() * 180, 14 + rnd() * 14);
    }
    if(drug === "sug") for(var s = 0; s < 7; s++) spawn("sug", (s % 2 ? 1 : -1) * (112 + rnd() * 20), 12 + rnd() * 16, { st: "seek" });
    if(drug === "sux") for(var q = 0; q < 10; q++) spawn("sux", (q % 2 ? 1 : -1) * (110 + rnd() * 30), 12 + rnd() * 16, { st: "seek", delay: q * 0.12 });
  }
  function nerveImpulse(){
    napT = 0;
  }
  function release(){
    if(drug === "botox") return;
    var preBlocked = pre.some(function(p){ return p.occ === "roc"; });
    var per = preBlocked ? 2 : 4;
    DATA.dock.forEach(function(x, k){
      fuseA[k] = 1;
      for(var n = 0; n < per; n++) spawn("ach", x + (rnd() - 0.5) * 6, DATA.zpre - 4, { vz: -18 - rnd() * 10, vx: (rnd() - 0.5) * 14 });
    });
  }
  function aheInhibited(){ return drug === "neo" && t > 0.6; }
  function step(dt){
    t += dt;
    // the motor nerve fires every CYCLE seconds
    nerveT -= dt;
    if(nerveT <= 0){ nerveT = CYCLE; nerveImpulse(); }
    if(napT >= 0){ napT += dt; if(napT > 0.32){ napT = -1; release(); } }
    for(var f = 0; f < fuseA.length; f++) fuseA[f] = Math.max(0, fuseA[f] - dt / 0.5);
    var inhib = aheInhibited();
    for(var i = parts.length - 1; i >= 0; i--){
      var p = parts[i]; p.age += dt;
      if(p.st === "fade"){ p.alpha -= dt / 0.35; if(p.alpha <= 0){ kill(i); } continue; }
      if(p.kind === "ach"){
        if(p.st === "free"){
          var j = nearestFree(p.x);
          var bx = j >= 0 ? (DATA.recx[j] - p.x) * 0.8 : 0;
          wander(p, dt, 22, 0.35, bx, -9);
          if(Math.abs(p.x) > 118){ p.st = "fade"; continue; }
          // AChE cleaves ACh that comes close (unless neostigmine inhibits it)
          if(!inhib){ for(var e = 0; e < DATA.achex.length; e++){ if(Math.abs(p.x - DATA.achex[e]) < 6 && Math.abs(p.z - DATA.achez) < 5 && rnd() < dt * 9){ p.st = "fade"; break; } } if(p.st === "fade") continue; }
          if(p.z < 11){
            for(var r = 0; r < NREC; r++){ if(!rec[r].occ && Math.abs(p.x - DATA.recx[r]) < 4){ rec[r].occ = "ach"; rec[r].hold = 0.32; p.st = "bound"; p.rec = r; p.x = DATA.recx[r]; p.z = 10.2; break; } }
          }
          if(p.age > (inhib ? 9 : 3.2)){ p.st = "fade"; }
        } else if(p.st === "bound"){
          rec[p.rec].hold -= dt;
          if(rec[p.rec].hold <= 0){ rec[p.rec].occ = null; p.st = "free"; p.vz = 10; p.age = Math.min(p.age, 1.5); }
        }
      } else if(p.kind === "sux"){
        if(p.st === "seek"){
          if(p.delay > 0){ p.delay -= dt; continue; }
          var k = nearestFree(p.x);
          if(k < 0){ wander(p, dt, 10, 0.4, 0, 0); continue; }
          wander(p, dt, 12, 0.4, (DATA.recx[k] - p.x) * 2.2, -16);
          if(p.z < 11.5 && Math.abs(p.x - DATA.recx[k]) < 4){ rec[k].occ = "sux"; p.st = "bound"; p.rec = k; p.x = DATA.recx[k]; p.z = 10.4; }
        }
      } else if(p.kind === "roc"){
        if(p.st === "bound"){
          // sugammadex pulls roc off the receptors fast; under neostigmine the extra ACh wins the receptor when roc lets go
          var off = drug === "sug" ? 0.9 : drug === "neo" && t > 0.6 ? 0.45 : 0;
          if(off && rnd() < dt * off){ rec[p.rec].occ = null; p.st = "free"; p.vz = 14; p.age = 0; }
          else { p.x = DATA.recx[p.rec] + Math.sin(p.age * 3 + p.rec) * 0.3; p.z = 9.6; }
        } else if(p.st === "boundpre"){
          var offp = drug === "sug" ? 0.9 : drug === "neo" && t > 0.6 ? 0.45 : 0;
          if(offp && rnd() < dt * offp){ pre[p.rec].occ = null; p.st = "free"; p.vz = -14; p.age = 0; }
        } else if(p.st === "free"){
          wander(p, dt, 14, 0.4, 0, 0);
          if(drug === "neo" && p.age > 4){ p.st = "fade"; continue; }
          // a free roc drifts back onto an empty receptor, unless ACh or sugammadex gets there first
          if(drug === "roc" && p.z < 12){ var rr = nearestFree(p.x); if(rr >= 0 && Math.abs(DATA.recx[rr] - p.x) < 4){ rec[rr].occ = "roc"; p.st = "bound"; p.rec = rr; } }
        }
      } else if(p.kind === "sug"){
        if(p.st === "seek"){
          var tgt = null, td = 1e9;
          for(var q = 0; q < parts.length; q++){ var o = parts[q]; if(o.kind === "roc" && o.st === "free"){ var dd = Math.hypot(o.x - p.x, o.z - p.z); if(dd < td){ td = dd; tgt = o; } } }
          if(tgt){ wander(p, dt, 8, 0.4, (tgt.x - p.x) * 1.6, (tgt.z - p.z) * 1.6); if(td < 4){ tgt.st = "fade"; tgt.alpha = 0; p.kind = "cplx"; p.el.r.style.display = ""; p.st = "leave"; p.age = 0; } }
          else wander(p, dt, 10, 0.5, 0, 0);
        }
      } else if(p.kind === "cplx"){
        wander(p, dt, 8, 0.5, (p.x < 0 ? -1 : 1) * 30, 0);
        if(p.age > 2.2 || Math.abs(p.x) > 120) p.st = "fade";
      }
    }
    // receptors: open while an agonist sits on them
    var opened = 0;
    for(var a = 0; a < NREC; a++){ var on = rec[a].occ === "ach" || rec[a].occ === "sux" ? 1 : 0; rec[a].open += (on - rec[a].open) * (1 - Math.exp(-dt / 0.06)); opened += rec[a].open; }
    var target = Math.min(1, opened / 3.2);
    depol += (target - depol) * (1 - Math.exp(-dt / 0.08));
    // Na+ channels: fire once the end plate depolarizes past threshold; inactivated after, recovering only once it repolarizes
    var fireNow = false;
    if(drug === "sux"){
      if(t > 0.9 && t < 2.6){ if(rnd() < dt * 4.5) fireNow = true; }
    } else if(depol > 0.4 && na.every(function(c){ return c.st === "rest"; })) fireNow = true;
    if(fireNow){ na.forEach(function(c){ c.st = "open"; c.t = 0; }); twitchV += drug === "sux" ? 0.55 : 1; apWave = 1; }
    na.forEach(function(c){
      c.t += dt;
      if(c.st === "open" && c.t > 0.18){ c.st = "inact"; c.t = 0; }
      else if(c.st === "inact" && c.t > 0.35 && (depol < 0.3 || (drug === "sux" && t < 2.6))){ c.st = "rest"; c.t = 0; }
    });
    if(drug === "sux" && t >= 2.6) na.forEach(function(c){ if(c.st !== "open") c.st = "inact"; });
    apWave = Math.max(0, apWave - dt / 0.5);
    // twitch: a quick contraction and a slower relaxation
    twitch += twitchV * dt * 9; twitchV = Math.max(0, twitchV - dt * 5); twitch = Math.max(0, twitch - dt * 1.8 * (0.4 + twitch)); twitch = Math.min(1, twitch);
  }
  function draw(){
    for(var i = 0; i < parts.length; i++){
      var p = parts[i];
      p.el.g.setAttribute("transform", "translate(" + sx(p.x).toFixed(1) + " " + sz(p.z).toFixed(1) + ")");
      p.el.g.style.opacity = (p.st === "fade" ? Math.max(0, p.alpha) : Math.min(1, p.age / 0.15 + 0.2)).toFixed(2);
    }
    recs.forEach(function(r, i){ r.style.setProperty("--on", rec[i].open.toFixed(2)); r.dataset.occ = rec[i].occ || ""; });
    pres.forEach(function(r, i){ r.dataset.occ = pre[i].occ || ""; });
    nas.forEach(function(n, i){ n.dataset.st = na[i].st; });
    aches.forEach(function(a){ a.dataset.inhib = aheInhibited() ? "1" : ""; });
    fuses.forEach(function(f, k){ f.style.opacity = fuseA[k].toFixed(2); });
    svg.style.setProperty("--depol", depol.toFixed(2));
    svg.style.setProperty("--wave", apWave.toFixed(2));
    svg.dataset.drug = drug;
    if(nap){ nap.style.opacity = napT >= 0 ? "1" : "0"; if(napT >= 0) nap.setAttribute("cy", (sz(168 - (168 - 110) * Math.min(1, napT / 0.32))).toFixed(1)); }
    var s = 1 - 0.07 * twitch;
    stria.setAttribute("transform", "translate(" + (DATA.strCx * (1 - s)).toFixed(2) + " 0) scale(" + s.toFixed(4) + " 1)");
    var st = drug === "sux" ? (t < 0.9 ? "succinylcholine binding · muscle: at rest" : t < 2.6 ? "end plate depolarizing · muscle: fasciculations" : DATA.model.sux.readout) : DATA.model[drug].readout;
    if(drug === "neo" && t < 3) st = "AChE: inhibited · ACh building up";
    if(drug === "sug" && t < 2) st = "sugammadex: capturing rocuronium";
    if(readout.textContent !== st) readout.textContent = st;
  }
  function apply(){
    var m = DATA.model[drug];
    summary.textContent = m.summary;
    if(m.tof){ tofBox.hidden = false; tofBars.forEach(function(b, i){ b.style.height = Math.round(m.tof[i] * 100) + "%"; }); tofNote.textContent = m.tofNote; }
    else { tofBox.hidden = true; }
  }
  function warm(sec){ var n = Math.round(sec * 30); for(var i = 0; i < n; i++) step(1 / 30); draw(); }
  function setDrug(d){ drug = d; reset(); apply(); if(!playing) warm(drug === "sux" ? 3.2 : drug === "neo" ? 8 : 4); else draw(); }
  function tick(now){
    frame = 0;
    if(!root.isConnected){ return; }
    if(!playing || !visible) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    step(dt); draw();
    frame = requestAnimationFrame(tick);
  }
  function start(){ if(playing && visible && !frame){ last = 0; frame = requestAnimationFrame(tick); } }
  function stop(){ if(frame) cancelAnimationFrame(frame); frame = 0; }
  function setPlaying(v){ playing = v; pauseBtn.textContent = v ? "Pause" : "Play"; pauseBtn.setAttribute("aria-pressed", String(!v)); if(v) start(); else stop(); }
  radios.forEach(function(r){ r.addEventListener("change", function(){ if(r.checked) setDrug(r.value); }); });
  pauseBtn.addEventListener("click", function(){ setPlaying(!playing); });
  var idle = infoEl.textContent;
  Array.prototype.forEach.call(svg.querySelectorAll(".hot"), function(el){
    var on = function(){ infoEl.textContent = el.getAttribute("data-info"); el.classList.add("is-hot"); };
    var off = function(){ el.classList.remove("is-hot"); };
    el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
    el.addEventListener("focus", on); el.addEventListener("blur", off);
    el.addEventListener("click", on);
  });
  if("IntersectionObserver" in window) new IntersectionObserver(function(en){ visible = en[0].isIntersecting; if(visible) start(); else stop(); }).observe(svg);
  if(reduce.matches) setPlaying(false);
  reset(); apply(); if(!playing) warm(4); else draw();
  start();
  // phones: the callouts are hidden (CSS, same breakpoint), so crop the view to the drawing itself
  var mq = window.matchMedia ? window.matchMedia("(max-width:560px)") : null;
  var fit = function(){ svg.setAttribute("viewBox", mq && mq.matches ? DATA.narrow : DATA.wide); };
  if(mq){ fit(); if(mq.addEventListener) mq.addEventListener("change", fit); }
  root.__anima = { setDrug: function(d){ radios.forEach(function(r){ r.checked = r.value === d; }); setDrug(d); }, warm: warm, pause: function(){ setPlaying(false); } };
}

const CSS = `
.anima .nm-fig{--depol:0;--wave:0}
.anima .nm-halo{fill:var(--anatomy-halo);opacity:var(--anatomy-halo-opacity);filter:blur(10px)}
.anima .nm-fiber{fill:var(--anatomy-shade-2);stroke:none}
.anima .nm-aband{fill:var(--anatomy-shade-0);opacity:.85}
.anima .nm-zline{fill:none;stroke:var(--anatomy-lo);stroke-width:.9}
.anima .nm-sarco{fill:none;stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .nm-sarco-in{fill:none;stroke:var(--anatomy-mid);stroke-width:.7;stroke-linejoin:round}
.anima .nm-epp{fill:none;stroke:var(--anatomy-lit);stroke-width:5;stroke-linejoin:round;opacity:calc(var(--depol) * .55)}
.anima .nm-ap{fill:none;stroke:var(--anatomy-lit);stroke-width:3.4;stroke-linecap:round;opacity:var(--wave)}
.anima .nm-cleft{fill:url(#nm-cleft-g);opacity:.8}
.anima .nm-fiber-edge{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;stroke-linejoin:round}
.anima .nm-rec-half{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1}
.anima .nm-pore{fill:var(--anatomy-lit);opacity:calc(var(--on,0) * .9)}
.anima .nm-site{fill:var(--anatomy-paper);stroke:var(--anatomy-mid);stroke-width:.8}
.anima .nm-rec[data-occ="roc"] .nm-site,.anima .nm-pre[data-occ="roc"] .nm-site{stroke:var(--anatomy-red)}
.anima .nm-pre .nm-rec-half{fill:var(--anatomy-face)}
.anima .nm-na-half{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1}
.anima .nm-na-pore{fill:var(--anatomy-lit);opacity:0;transition:opacity .08s}
.anima .nm-na[data-st="open"] .nm-na-pore{opacity:.95}
.anima .nm-tether{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .nm-ball{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1}
.anima .nm-tether-in,.anima .nm-ball-in{opacity:0}
.anima .nm-na[data-st="inact"] .nm-tether-in,.anima .nm-na[data-st="inact"] .nm-ball-in{opacity:1}
.anima .nm-na[data-st="inact"] .nm-tether:not(.nm-tether-in),.anima .nm-na[data-st="inact"] .nm-ball-out{opacity:0}
.anima .nm-fig[data-drug="sux"] .nm-na[data-st="inact"] .nm-ball-in{fill:var(--anatomy-red);stroke:var(--anatomy-red)}
.anima .nm-ache-body{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1}
.anima .nm-neo{fill:var(--anatomy-blue);opacity:0;transition:opacity .4s}
.anima .nm-ache[data-inhib="1"] .nm-neo{opacity:1}
.anima .nm-ache[data-inhib="1"] .nm-ache-body{stroke:var(--anatomy-blue)}
.anima .nm-vdot{fill:var(--anatomy-lit);opacity:.85}
.anima .nm-ves .bio-blob-base{fill:var(--anatomy-face)}
.anima .nm-crista{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;stroke-linecap:round}
.anima .nm-snare-line{fill:none;stroke:var(--anatomy-mid);stroke-width:1.3;stroke-linecap:round}
.anima .nm-cut{fill:none;stroke:var(--anatomy-red);stroke-width:1.8;stroke-linecap:round;opacity:0;transition:opacity .3s}
.anima .nm-fig[data-drug="botox"] .nm-cut{opacity:1}
.anima .nm-fig[data-drug="botox"] .nm-snare-line{stroke-dasharray:2 2.2}
.anima .nm-fuse{fill:var(--anatomy-lit);opacity:0}
.anima .nm-nap{fill:var(--anatomy-lit);opacity:0}
.anima .nm-p{pointer-events:none}
.anima .nm-k-ach{fill:var(--anatomy-lit);stroke:var(--anatomy-paper);stroke-width:1}
.anima .nm-k-bond{stroke:var(--anatomy-lit);stroke-width:1.6}
.anima .nm-k-roc{fill:var(--anatomy-red);stroke:var(--anatomy-paper);stroke-width:1}
.anima .nm-k-neo{fill:var(--anatomy-blue)}
.anima .nm-k-sug{fill:none;stroke:var(--anatomy-green);stroke-width:2.6}
.anima .nm-tof{display:flex;align-items:flex-end;gap:12px;margin:8px 0 2px;font:.78rem var(--font-mono);color:var(--ink-soft)}
.anima .nm-tof[hidden]{display:none}
.anima .nm-tof-k{text-transform:uppercase;letter-spacing:.06em;color:var(--ink-faint);font-size:.7rem}
.anima .nm-tof-bars{display:inline-flex;align-items:flex-end;gap:4px;height:26px;border-bottom:1px solid var(--line-strong);padding:0 2px}
.anima .nm-tof-bars i{display:flex;align-items:flex-end;width:9px;height:100%}
.anima .nm-tof-bars b{display:block;width:100%;background:var(--accent);border-radius:2px 2px 0 0;transition:height .5s var(--anatomy-ease)}
.anima .nm-key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:6px 0 0;font:.76rem var(--font-mono);color:var(--ink-soft)}
.anima .nm-key span{display:inline-flex;align-items:center;gap:5px}
.anima .nm-key svg{width:14px;height:12px;overflow:visible}
@media (prefers-reduced-motion:reduce){.anima .nm-na-pore,.anima .nm-neo,.anima .nm-cut,.anima .nm-tof-bars b{transition:none}}
`;

export function nmj() {
  return {
    id: "nmj",
    title: "The neuromuscular junction and its drugs",
    caption: "Pick a drug to see where it acts. Schematic, not to scale; drawn from the L31/L32 notes.",
    html: `<div class="anima" data-anima="nmj">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: nmjLive.toString(),
    data: DATA,
    still: { svg: svgFig, drugState: null },
  };
}
