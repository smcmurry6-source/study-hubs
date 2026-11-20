// Fig: the palate as a donor site (Periodontology S9, Dr. Abou-Arraj's recorded lecture + slides, the exam-review guide).
// A frontal section through a maxillary second premolar and the palate beside it, to the midline, drawn to one scale
// (12 px = 1 mm). The palatal mucosa in its layers, from the surface in: the epithelium (0.3-0.6 mm), the lamina propria
// (1.25-3.0 mm, usually the thickest, what a CTG is made of), the submucosa (fat and glands), then bone. The greater
// palatine artery and nerve run in the submucosa against the bone, about 7 mm from the CEJ in a shallow palate, 12 mm in
// an average one and 17 mm in a high one (the slide's numbers): a high, deep vault gives the most room to harvest.
// The switch changes the vault; the graft buttons outline what an FGG (epithelium + lamina propria) and a CTG (lamina
// propria only, from under the epithelium) take. The vault shapes and layer profiles are schematic; the 7/12/17 mm
// distances are the lecture's, measured straight from the palatal CEJ.
import { figureSvg, plateHtml } from "./shared.mjs";

const S = 12, W = 404, H = 436, CX = 150, PY = 316;

/* the oral surface of the palatal mucosa, from the palatal gingival margin to the midline. Near the tooth the palatal
   gingiva bulges out over the palatal bone (about 4 mm from the root at the crest); from there the vault rises as a
   quarter ellipse to its height h (mm above the CEJ plane) at the midline. Resampled evenly, n points. */
function plSurf(h, n) {
  var mx = 14.2, raw = [[.4, .9], [1.3, .1], [2.4, -1.1], [3.25, -2.3]];
  for (var i = 1; i <= 24; i++) { var a = i / 24 * Math.PI / 2; raw.push([mx - (mx - 3.25) * Math.pow(Math.cos(a), 1.25), -2.3 - (h - 2.3) * Math.pow(Math.sin(a), .85)]); }
  var len = [0]; for (var j = 1; j < raw.length; j++) len.push(len[j - 1] + Math.hypot(raw[j][0] - raw[j - 1][0], raw[j][1] - raw[j - 1][1]));
  var o = [], k = 1, T = len[len.length - 1];
  for (var q = 0; q <= n; q++) { var s = q / n * T; while (k < raw.length - 1 && len[k] < s) k++; var u = (s - len[k - 1]) / ((len[k] - len[k - 1]) || 1);
    o.push([raw[k - 1][0] + (raw[k][0] - raw[k - 1][0]) * u, raw[k - 1][1] + (raw[k][1] - raw[k - 1][1]) * u]); }
  return o;
}
/* unit normal pointing into the tissue (up and out, away from the mouth) at each point */
function plNorm(p) { var o = []; for (var i = 0; i < p.length; i++) { var a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; o.push([dy / L, -dx / L]); } return o; }
function plOff(p, nr, t) { var o = []; for (var i = 0; i < p.length; i++) { var d = typeof t === "function" ? t(i / (p.length - 1), i) : t; o.push([p[i][0] + nr[i][0] * d, p[i][1] + nr[i][1] * d]); } return o; }
function plPath(D, p, close) { var o = ""; for (var i = 0; i < p.length; i++) o += (i ? "L" : "M") + Math.round((D.CX + p[i][0] * D.S) * 10) / 10 + " " + Math.round((D.PY + p[i][1] * D.S) * 10) / 10; return o + (close ? "Z" : ""); }
/* the whole model for a vault height h and a bundle distance d: surface, layer boundaries, bundle, harvest room */
function plModel(h, d) {
  var N = 90, sf = plSurf(h, N), nr = plNorm(sf), epi = .45;
  /* where the bundle sits: on a provisional bone line 3.2 mm in, the first point at straight distance d from the CEJ */
  var prov = plOff(sf, nr, 3.2), kb = N - 1;
  for (var i = 0; i <= N; i++) if (Math.hypot(prov[i][0], prov[i][1]) >= d) { kb = i; break; }
  var sb = kb / N;
  function lp(s) { return 2.2 - .8 * s; }
  function sm(s) { var e = s < .14 ? 0 : Math.min(1, (s - .14) / .1); var m = s > .82 ? Math.max(0, 1 - (s - .82) / .14) : 1; return (.8 + 2.0 * Math.exp(-Math.pow((s - sb) / .16, 2))) * e * m; }
  var e1 = plOff(sf, nr, epi), e2 = plOff(sf, nr, function (s) { return epi + lp(s); }), bone = plOff(sf, nr, function (s) { return epi + lp(s) + sm(s); });
  var nb = nr[kb], bpt = bone[kb], art = [bpt[0] - nb[0] * 1.05 - nb[1] * .55, bpt[1] - nb[1] * 1.05 + nb[0] * .55], nrv = [bpt[0] - nb[0] * .85 + nb[1] * .75, bpt[1] - nb[1] * .85 - nb[0] * .75];
  /* room to harvest: along the surface from a little past the margin to a little short of the bundle */
  var k0 = 0; for (var j = 0; j <= N; j++) if (Math.hypot(sf[j][0] - sf[0][0], sf[j][1] - sf[0][1]) >= 2.2) { k0 = j; break; }
  var k1 = kb; for (var j2 = kb; j2 > k0; j2--) if (Math.hypot(sf[j2][0] - art[0], sf[j2][1] - art[1]) >= 2.6 + 0 && Math.hypot(sf[j2][0], sf[j2][1]) <= d - 1.8) { k1 = j2; break; }
  return { sf: sf, e1: e1, e2: e2, bone: bone, art: art, nrv: nrv, kb: kb, k0: k0, k1: Math.max(k0 + 2, k1), N: N };
}
function plDyn(v, D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (mm) { return f(D.PY + mm * D.S); };
  var M = plModel(v.h, v.d), sf = M.sf, bone = M.bone;
  /* bone: the alveolar process around the root, rising to the cut at the top, and the palatal process, whose nasal
     floor runs flat about 3 mm above the vault's midline */
  var nf = -(v.h + .9 + 3.2), top = Math.min(nf - 3.4, -17.2), last = bone[bone.length - 1];
  /* the section's upper edge is a break line: the slice is cut there */
  var brk = []; for (var bi = 0; bi <= 10; bi++) { var bx = -10.0 + bi * 1.44; brk.push([bx, top + .45 * Math.sin(bi * 1.7)]); }
  var lw = [[4.6, top + .2], [4.8, nf + 2.2], [5.7, nf + .6], [7.4, nf]];
  var boneP = [[-7.9, -1.6], [-8.5, -6], [-9.3, -12], [-10.0, top]].concat(brk, lw, [[14.2, nf], [14.2, last[1]]], bone.slice().reverse(), [[.2, -1.7], [-.3, -1.4], [-7.6, -1.4]]);
  o += '<g class="hot" data-info="' + D.HOT.bone + '"><path class="pl-bone" d="' + plPath(D, boneP, true) + '"/></g>';
  /* the soft tissue in its layers: submucosa (bone to lamina propria), lamina propria, epithelium */
  var gum0 = [[.2, -1.7], [.05, -.6]];
  o += '<g class="hot" data-info="' + D.HOT.sm + '"><path class="pl-sm" d="' + plPath(D, M.e2.concat(bone.slice().reverse()), true) + '"/></g>';
  o += '<g class="hot" data-info="' + D.HOT.lp + '"><path class="pl-lp" d="' + plPath(D, gum0.concat(M.e1, M.e2.slice().reverse()), true) + '"/></g>';
  o += '<g class="hot" data-info="' + D.HOT.epi + '"><path class="pl-epi" d="' + plPath(D, sf.concat(M.e1.slice().reverse()), true) + '"/></g>';
  /* fat lobules and glands in the submucosa (a few, where it is thick) */
  for (var g = 6; g < M.N - 6; g += 5) { var a = M.e2[g], b = bone[g], th = Math.hypot(b[0] - a[0], b[1] - a[1]); if (th < 1.1) continue;
    var cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2; o += '<ellipse class="pl-fat" cx="' + X(cx) + '" cy="' + Y(cy) + '" rx="' + f(th * .32 * D.S) + '" ry="' + f(th * .24 * D.S) + '"/>'; }
  /* room to harvest: a ruler along the surface, just inside the mouth, from near the margin to short of the bundle */
  var rul = plOff(sf.slice(M.k0, M.k1 + 1), plNorm(sf).slice(M.k0, M.k1 + 1), -.9), r0 = rul[0], r1 = rul[rul.length - 1];
  o += '<g class="hot" data-info="' + D.HOT.room + '"><path class="pl-room" d="' + plPath(D, rul, false) + '"/><circle class="pl-rdot" cx="' + X(r0[0]) + '" cy="' + Y(r0[1]) + '" r="2.6"/><circle class="pl-rdot" cx="' + X(r1[0]) + '" cy="' + Y(r1[1]) + '" r="2.6"/>';
  o += '<text class="pl-t pl-rt" x="' + X(r0[0] + 1.0) + '" y="' + Y(r0[1] + 1.9) + '">room to harvest</text></g>';
  /* the graft outline */
  if (v.g > 0) {
    var a0 = M.k0 + 1, a1 = Math.min(M.k1 - 1, a0 + Math.round((M.k1 - M.k0) * .85)), gp;
    if (v.g === 1) gp = sf.slice(a0, a1 + 1).concat(plOff(sf, plNorm(sf), function (s) { return .45 + 1.0; }).slice(a0, a1 + 1).reverse());
    else gp = M.e1.slice(a0, a1 + 1).concat(plOff(sf, plNorm(sf), function (s) { return .45 + 1.25; }).slice(a0, a1 + 1).reverse());
    o += '<g class="hot" data-info="' + (v.g === 1 ? D.HOT.fgg : D.HOT.ctg) + '"><path class="pl-graft" d="' + plPath(D, gp, true) + '"/></g>';
  }
  /* the greater palatine artery and nerve */
  o += '<g class="hot" data-info="' + D.HOT.nv + '"><circle class="pl-art" cx="' + X(M.art[0]) + '" cy="' + Y(M.art[1]) + '" r="' + f(.62 * D.S) + '"/><circle class="pl-nrv" cx="' + X(M.nrv[0]) + '" cy="' + Y(M.nrv[1]) + '" r="' + f(.42 * D.S) + '"/></g>';
  /* the distance from the CEJ */
  var A = M.art, L = Math.hypot(A[0], A[1]), ux = A[0] / L, uy = A[1] / L, e = [A[0] - ux * .75, A[1] - uy * .75];
  o += '<path class="pl-dim" d="M' + X(0) + " " + Y(0) + "L" + X(e[0]) + " " + Y(e[1]) + '"/><circle class="pl-dot" cx="' + X(0) + '" cy="' + Y(0) + '" r="2.6"/>';
  var sk = sf[M.kb], nk = plNorm(sf)[M.kb], lx = sk[0] - nk[0] * 1.5, ly = sk[1] - nk[1] * 1.5;
  o += '<text class="pl-t pl-num" x="' + X(lx) + '" y="' + Y(ly) + '">\u2248' + Math.round(v.d) + ' mm</text><text class="pl-t pl-small" x="' + X(lx) + '" y="' + f(D.PY + ly * D.S + 13) + '">from the CEJ</text>';
  /* surface labels that follow the layers */
  var q = M.sf[Math.round(M.N * .97)];
  o += '<path class="pl-mid" d="M' + X(14.2) + " " + Y(-24.6) + "V" + Y(q[1] + 1.8) + '"/><text class="pl-t pl-small" x="' + X(14.0) + '" y="' + Y(-23.6) + '" text-anchor="end">midline</text>';
  return o;
}

/* the premolar in section, crown down: enamel, dentin, pulp; and the buccal soft tissue (fixed) */
function toothSvg(D) {
  const X = (mm) => (D.CX + mm * D.S).toFixed(1), Y = (mm) => (D.PY + mm * D.S).toFixed(1), P = (pts) => pts.map((p, i) => (i ? "L" : "M") + X(p[0]) + " " + Y(p[1])).join("") + "Z";
  const root = [[-7.4, 0], [-7.1, -4], [-6.4, -8.5], [-5.4, -12.4], [-4.3, -14.3], [-3.3, -14.6], [-2.3, -14.0], [-1.2, -11.8], [-.5, -8], [-.1, -4], [0, 0]];
  const crown = [[-7.4, 0], [-8.15, 1.6], [-8.4, 3.0], [-8.1, 4.8], [-7.3, 6.4], [-6.1, 7.6], [-5.2, 7.7], [-4.4, 6.9], [-3.7, 6.0], [-3.0, 6.7], [-2.1, 7.3], [-1.0, 7.0], [-.2, 5.9], [.35, 4.3], [.5, 2.6], [.3, 1.1], [0, 0]];
  const dentin = [[-7.0, -.3], [-7.5, 1.4], [-7.6, 3.2], [-7.2, 4.8], [-6.3, 6.2], [-5.3, 6.7], [-4.4, 6.0], [-3.7, 5.3], [-3.0, 5.8], [-2.0, 6.2], [-1.1, 5.9], [-.6, 4.9], [-.4, 3.0], [-.4, 1.2], [-.5, -.3]];
  const pulp = [[-5.3, -.8], [-5.9, 1.4], [-5.5, 3.6], [-4.6, 4.3], [-3.8, 3.4], [-2.9, 4.0], [-2.1, 3.4], [-1.8, 1.4], [-2.3, -.8], [-2.9, -6], [-3.3, -12.6], [-3.8, -6]];
  const buccal = [[-10.6, -13], [-9.9, -8], [-9.3, -3], [-8.7, .3], [-8.1, 1.0], [-7.6, .6], [-7.7, -1.5], [-8.4, -6], [-9.2, -12], [-9.5, -13]];
  return `<g class="hot" data-info="${D.HOT.tooth}"><path class="pl-cem" d="${P(root)}"/><path class="pl-enam" d="${P(crown)}"/><path class="pl-dent" d="${P(dentin)}"/><path class="pl-pulp" d="${P(pulp)}"/></g>`
    + `<g class="hot" data-info="${D.HOT.buccal}"><path class="pl-bgum" d="${P(buccal)}"/></g>`
    + `<path class="pl-cej" d="M${X(-7.4)} ${Y(0)}h-4M${X(0)} ${Y(0)}"/>`;
}

const D = {
  W, H, S, CX, PY,
  SC: {
    low: { h: 7.2, d: 7, name: "shallow palate · ≈7 mm", room: "least",
      text: "A shallow palate: the greater palatine artery and nerve run about 7 mm from the CEJ. There is little palate between the gingival margin and the bundle, so the least room to harvest and the least room for error." },
    avg: { h: 12.2, d: 12, name: "average palate · ≈12 mm", room: "average",
      text: "An average palate: the bundle runs about 12 mm from the CEJ. There are guidelines for which area to harvest from (premolar, molar) and how far up the palate to go." },
    high: { h: 17.4, d: 17, name: "high palate · ≈17 mm", room: "most",
      text: "A high, deep palatal vault: the bundle runs about 17 mm from the CEJ, so it gives the most room for error when harvesting (the exam-review guide's point)." },
  },
  GRAFT: ["Tap FGG or CTG to see which layers each graft takes.",
    "A free gingival graft (FGG): the epithelium together with the lamina propria under it, in one piece. It is left exposed at the recipient site and heals into keratinized gingiva; the palate heals by secondary intention.",
    "A connective tissue graft (CTG, SCTG): the lamina propria without the epithelium, taken from under it through a trap door, or harvested like an FGG and de-epithelialized. Always covered by the flap at the recipient site."],
  HOT: {
    epi: "Epithelium, 0.3-0.6 mm, thin. The palate is orthokeratinized, and its tissue carries that information of keratinization with it to the recipient site.",
    lp: "Lamina propria, the connective tissue, 1.25-3.0 mm, usually the thickest layer. A CTG is lamina propria only; palatal connective tissue induces epithelial differentiation and keratinization.",
    sm: "Submucosa: adipose and glandular tissue. A thick graft brings much of this fat layer with it, and it is usually removed so it doesn't slow the healing.",
    bone: "Bone: the alveolar process around the root and the palatal process of the maxilla.",
    nv: "The greater palatine artery and nerve, the neurovascular bundle, in the submucosa against the bone. Stay away from it: about 7 mm from the CEJ in a shallow palate, 12 mm in an average one, 17 mm in a high one.",
    room: "Room to harvest, between the gingival margin and the bundle: widest in a high, deep vault.",
    fgg: "FGG: epithelium + lamina propria, in one piece.",
    ctg: "CTG: lamina propria only, from under the epithelium.",
    tooth: "A maxillary second premolar in section, crown down: the palate is beside the premolars and molars, where grafts are harvested. The distances run from its palatal CEJ.",
    buccal: "Buccal gingiva and the buccal plate, on the other side of the tooth.",
  },
};
D.TOOTH = toothSvg(D);

const START = { h: D.SC.avg.h, d: 12, g: 0 };
const SX = W - 16 - 5 * S, scale = `<path class="pl-scale" d="M${SX} ${H - 14}h${5 * S}M${SX} ${H - 18}v8M${SX + 5 * S} ${H - 18}v8"/><text class="pl-t pl-small" x="${SX + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const tags = `<text class="pl-t pl-tag" x="${CX - 8.8 * S}" y="${PY + 9.6 * S}">BUCCAL</text><text class="pl-t pl-tag" x="${CX + 3 * S}" y="${PY + 9.6 * S}">PALATAL</text>`;
const svg = figureSvg({ width: W, height: H, className: "pl-svg", label: "A frontal section through a maxillary premolar and the palate beside it, to the midline: the palatal mucosa's epithelium, lamina propria and submucosa over the bone, the greater palatine artery and nerve in the submucosa, and a line giving their distance from the palatal CEJ.",
  body: `<g class="pl-dyn">${plDyn(START, D)}</g>${D.TOOTH}${tags}${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 2", title: "The palate as a donor site", hint: "pick a vault · pick a graft", readout: D.SC.avg.name, body: `<div class="am-svg pl-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Palatal vault"><button type="button" class="am-btn" data-plv="low" aria-pressed="false">Shallow</button><button type="button" class="am-btn" data-plv="avg" aria-pressed="true">Average</button><button type="button" class="am-btn" data-plv="high" aria-pressed="false">High</button><span class="pl-gap"></span><button type="button" class="am-btn" data-plg="1" aria-pressed="false">FGG</button><button type="button" class="am-btn" data-plg="2" aria-pressed="false">CTG</button></div>
<div class="am-stats"><span>Bundle from the CEJ <b data-pl="d"></b></span><span>Room to harvest <b data-pl="room"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info pl-graftinfo"></p>
<div class="pl-key"><span><i class="pl-k pl-k-epi"></i>epithelium 0.3-0.6 mm</span><span><i class="pl-k pl-k-lp"></i>lamina propria 1.25-3.0 mm</span><span><i class="pl-k pl-k-sm"></i>submucosa (fat, glands)</span><span><i class="pl-k pl-k-bone"></i>bone</span><span><i class="pl-k pl-k-nv"></i>greater palatine artery and nerve</span></div>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's recorded lecture and slides: the layers and their thicknesses, what an FGG and a CTG take, the bundle at about 7, 12 and 17 mm from the CEJ in a shallow, average and high palate, and (the exam-review guide) a high, deep vault giving the most room for error.</li>
<li>Outside sources: the 7, 12 and 17 mm are Reiser and colleagues' measurements from the CEJ of the maxillary premolars and molars to the bundle (Int J Periodontics Restorative Dent 1996;16:130-7). The submucosa thickening where the bundle runs and thinning toward the midline raphe, and the masticatory mucosa's total thickness of about 3-4 mm at the premolars, follow Studer and colleagues (J Periodontol 1997;68:145-51) and Song and colleagues (J Periodontol 2008;79:406-12).</li>
<li>Drawn to one scale (the 5 mm bar). The vault shapes, the layer profiles and the harvest room are schematic; the distance line runs straight from the palatal CEJ to the artery. Educational, not medical advice.</li></ul></details>`;

function plLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".pl-svg"), dyn = svg.querySelector(".pl-dyn"), sum = root.querySelector(".am-summary"), ginfo = root.querySelector(".pl-graftinfo"), readout = root.querySelector("[data-readout]");
  var key = "avg", g = 0, v = { h: D.SC.avg.h, d: 12, g: 0 }, frame = 0, last = 0;
  function draw() { v.g = g; dyn.innerHTML = D.plDyn(v, D); }
  function loop(now) { var k = 1 - Math.exp(-Math.max(0, now - (last || now)) / 240); last = now; var t = D.SC[key];
    v.h += (t.h - v.h) * k; v.d += (t.d - v.d) * k; draw(); frame = Math.abs(t.h - v.h) + Math.abs(t.d - v.d) > .01 ? requestAnimationFrame(loop) : 0; }
  function kick() { if (reduce.matches) { v.h = D.SC[key].h; v.d = D.SC[key].d; draw(); return; } last = 0; if (!frame) frame = requestAnimationFrame(loop); }
  function setV(k) { key = k; var t = D.SC[k]; sum.textContent = t.text; if (readout) readout.textContent = t.name;
    root.querySelector('[data-pl="d"]').textContent = "≈" + t.d + " mm"; root.querySelector('[data-pl="room"]').textContent = t.room;
    root.querySelectorAll("[data-plv]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-plv") === k)); }); kick(); }
  function setG(n) { g = g === n ? 0 : n; ginfo.textContent = D.GRAFT[g]; root.querySelectorAll("[data-plg]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-plg") === g)); }); draw(); }
  root.querySelectorAll("[data-plv]").forEach(function (b) { b.addEventListener("click", function () { setV(b.getAttribute("data-plv")); }); });
  root.querySelectorAll("[data-plg]").forEach(function (b) { b.addEventListener("click", function () { setG(+b.getAttribute("data-plg")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) ginfo.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  ginfo.textContent = D.GRAFT[0]; setV("avg");
}

const CSS = `
.anima .pl-box{max-width:420px;margin:0 auto}
.anima .pl-svg .pl-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .pl-svg .pl-num{font-weight:700;font-size:12.5px;fill:var(--anatomy-strong);paint-order:stroke;stroke:var(--surface);stroke-width:3.5px}
.anima .pl-svg .pl-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .pl-svg .pl-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .pl-svg .pl-bone{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-linejoin:round}
.anima .pl-svg .pl-sm{fill:color-mix(in srgb, var(--pd-pus) 32%, var(--pd-gum));stroke:none}
.anima .pl-svg .pl-fat{fill:color-mix(in srgb, var(--pd-pus) 55%, var(--pd-crown));stroke:color-mix(in srgb, var(--pd-enz) 50%, var(--pd-gum));stroke-width:.6}
.anima .pl-svg .pl-lp{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:.8}
.anima .pl-svg .pl-epi{fill:color-mix(in srgb, var(--pd-gum-line) 70%, var(--surface));stroke:var(--pd-gum-line);stroke-width:.8}
.anima .pl-svg .pl-room{fill:none;stroke:var(--pd-bug);stroke-width:3;stroke-linecap:round}
.anima .pl-svg .pl-rdot{fill:var(--pd-bug);stroke:var(--surface);stroke-width:1.2}
.anima .pl-svg .pl-rt{fill:var(--pd-bug);font-weight:700;font-size:10.5px;paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.anima .pl-svg .pl-graft{fill:none;stroke:var(--anatomy-strong);stroke-width:2;stroke-dasharray:5 3;stroke-linejoin:round}
.anima .pl-svg .pl-art{fill:var(--pd-blood);stroke:var(--surface);stroke-width:1.2}
.anima .pl-svg .pl-nrv{fill:var(--pd-pus);stroke:var(--pd-enz);stroke-width:1}
.anima .pl-svg .pl-dim{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3;stroke-dasharray:4 3}
.anima .pl-svg .pl-dot{fill:var(--anatomy-strong)}
.anima .pl-svg .pl-mid{fill:none;stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:2 4}
.anima .pl-svg .pl-enam{fill:var(--pd-crown);stroke:var(--pd-crown-line);stroke-width:1.1;stroke-linejoin:round}
.anima .pl-svg .pl-cem{fill:color-mix(in srgb, var(--pd-crown) 62%, var(--pd-bone));stroke:var(--pd-bone-line);stroke-width:1}
.anima .pl-svg .pl-dent{fill:color-mix(in srgb, var(--pd-crown) 60%, var(--pd-bone));stroke:none}
.anima .pl-svg .pl-pulp{fill:color-mix(in srgb, var(--pd-red) 45%, var(--pd-gum));stroke:var(--pd-gum-line);stroke-width:.7}
.anima .pl-svg .pl-bgum{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:.9}
.anima .pl-svg .pl-cej{fill:none;stroke:none}
.anima .pl-svg .pl-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .pl-gap{flex:0 0 6px}
.anima .pl-key{display:flex;flex-wrap:wrap;gap:4px 14px;font:.78rem var(--font-mono);color:var(--ink-soft);margin:4px 0}
.anima .pl-key span{display:inline-flex;align-items:center;gap:6px}
.anima .pl-k{display:inline-block;width:14px;height:10px;border-radius:3px;border:1px solid var(--line-strong)}
.anima .pl-k-epi{background:color-mix(in srgb, var(--pd-gum-line) 70%, var(--surface))}
.anima .pl-k-lp{background:var(--pd-gum)}
.anima .pl-k-sm{background:color-mix(in srgb, var(--pd-pus) 32%, var(--pd-gum))}
.anima .pl-k-bone{background:var(--pd-bone)}
.anima .pl-k-nv{background:var(--pd-blood);border-radius:50%;width:10px}
`;

export function palate() {
  return { id: "palate", lec: "perio-plastic-esthetics", title: "The palate as a donor site",
    caption: "A section through a premolar and the palate beside it: the layers a graft is cut from, and the greater palatine artery and nerve, nearer the CEJ in a shallow palate and farther in a high one.",
    html: `<div class="anima" data-anima="palate">${plate}${controls}${SOURCES}</div>`, css: CSS, live: plLive.toString(), helpers: [plSurf, plNorm, plOff, plPath, plModel, plDyn], data: D };
}
