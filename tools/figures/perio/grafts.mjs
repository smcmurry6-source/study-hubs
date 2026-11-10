// Fig: covered vs. exposed graft (Periodontology S9, Dr. Abou-Arraj's recorded lecture and his two cases).
// A labiolingual section through the facial of a mandibular incisor with 3 mm of facial recession, drawn to one scale
// (15 px = 1 mm), stepped through two procedures:
//   root coverage: a connective tissue graft (CTG) placed over the root and the flap advanced coronally, tension free,
//     to cover it completely; healed, the root is covered and the tissue is thick ("by definition would resist much
//     better" further recession);
//   keratinized gingiva: no KG at the site (the margin is alveolar mucosa); the flap is positioned apically, a free
//     gingival graft (FGG), with its epithelium, is sutured on the bed and left exposed; healed, a band of KG, with
//     some root coverage as a bonus.
// The rule it teaches: covered by a flap = connective tissue only (epithelium against the flap's inner side won't
// heal); left exposed = an FGG, which brings its own keratinization. Layer thicknesses and depths are illustrative.
import { figureSvg, plateHtml } from "./shared.mjs";

const S = 15, W = 420, H = 424, CX = 300, PY = 196, CREST = 5.5, BOT = 15.2;

/* the labial root surface and the outer surface of the facial bone plate: x (mm, facial -) at depth y (mm, apical +) */
function grRoot(y) { return -2.98 + .0168 * y * y + .02 * y; }
function grBone(y) { return grRoot(y) - (.75 + .03 * y) * Math.pow(Math.min(1, Math.max(0, (y - 5.5) / 2.2)), .6); }
/* the surface the soft tissue lies on: the root above the bone crest, the bone below it */
function grIn(y) { return (y < 5.5 ? grRoot(y) : grBone(y)) - .04; }
/* a layer's thickness, and how far it sits out from that surface (over a graft, or a flap held off) */
function grCtg(y) { var u = Math.max(0, Math.min(1, (y - .1) / 6.0)); return .25 + 1.25 * Math.sin(u * Math.PI); }
function grTh(k, y) {
  if (typeof k === "number") return k;
  if (k === "thin") return y < 3.6 ? .75 + .25 * (y - 3) : 1.0 + .03 * (y - 3.6);
  if (k === "ctg") return grCtg(y);
  if (k === "fgg") return 1.25;
  if (k === "thick") return y < 4 ? 2.1 : 2.1 - 1.1 * Math.min(1, (y - 4) / 3.5);
  if (k === "fh") return y < 6.5 ? 1.25 : Math.max(1.0, 1.25 - .25 * (y - 6.5));
  return 1.0;
}
function grOff(k, y) {
  if (k === "lift") return 2.6 * Math.max(0, 1 - (y - 3) / 8.5);
  if (k === "onCtg") return y < .1 ? 0 : y > 6.1 ? Math.max(0, .25 - (y - 6.1) * .6) : grCtg(y);
  if (k === "onBed") return .2;
  return 0;
}
function grP(D, pts, close) { var o = ""; for (var i = 0; i < pts.length; i++) o += (i ? "L" : "M") + Math.round((D.CX + pts[i][0] * D.S) * 10) / 10 + " " + Math.round((D.PY + pts[i][1] * D.S) * 10) / 10; return o + (close ? "Z" : ""); }
/* a band of tissue from y0 to y1, rounded at its coronal end (the margin) */
function grBand(L) {
  var a = [], b = [], n = Math.max(8, Math.round((L.y1 - L.y0) * 3));
  for (var i = 0; i <= n; i++) { var y = L.y0 + (L.y1 - L.y0) * i / n, x = grIn(y) - grOff(L.off, y); a.push([x, y]); b.push([x - grTh(L.th, y), y]); }
  var t = grTh(L.th, L.y0), r = Math.min(.45, t * .45);
  return b.slice().reverse().concat(L.j ? [] : [[b[0][0] + t * .15, L.y0 - r * .75], [(a[0][0] + b[0][0]) / 2, L.y0 - r], [a[0][0] - t * .12, L.y0 - r * .5]], a);
}
/* where a label points: "root", "bone", a layer's middle (its index), its outer surface ("o" + index) or the healed graft ("ghost") */
function grAt(P, tg, y) {
  if (tg === "root") return grRoot(y) + .45;
  if (tg === "bone") return grBone(y) + .5;
  if (tg === "ghost") return grIn(y) - grCtg(y) / 2;
  var outer = typeof tg === "string" && tg.charAt(0) === "o", L = P.layers[outer ? +tg.slice(1) : tg], x = grIn(y) - grOff(L.off, y);
  return outer ? x - grTh(L.th, y) : x - grTh(L.th, y) / 2;
}
function grDyn(st, D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (mm) { return f(D.PY + mm * D.S); };
  var P = D.ST[st.m][st.s];
  /* the tissue layers of this step, inside out */
  P.layers.forEach(function (L) {
    o += '<g class="hot" data-info="' + D.HOT[L.k] + '"><path class="gr-' + L.k + '" d="' + grP(D, grBand(L), true) + '"/>';
    if (L.ker) { var e = []; for (var i = 0; i <= 24; i++) { var yy = L.ker[0] + (L.ker[1] - L.ker[0]) * i / 24; e.push([grIn(yy) - grOff(L.off, yy) - grTh(L.th, yy) + .1, yy]); } o += '<path class="gr-ker" d="' + grP(D, e, false) + '"/>'; }
    o += "</g>";
  });
  if (P.ghost) o += '<path class="gr-ghost" d="' + grP(D, grBand({ y0: .1, y1: 6.1, th: "ctg" }), true) + '"/>';
  /* sutures: a stitch through the layers at each depth */
  (P.sut || []).forEach(function (s) { var x0 = grIn(s) + .1, x1 = Math.min(grAt(P, "o" + (P.layers.length - 1), s), grAt(P, "o" + (P.layers.length > 1 ? P.layers.length - 2 : 0), s)); o += '<path class="gr-sut" d="M' + X(x1) + " " + Y(s) + "L" + X(x0) + " " + Y(s + .15) + "M" + X(x1) + " " + Y(s) + "q" + f(-.45 * D.S) + " " + f(-.5 * D.S) + " " + f(-.95 * D.S) + " " + f(-.3 * D.S) + "M" + X(x1) + " " + Y(s) + "q" + f(-.4 * D.S) + " " + f(.45 * D.S) + " " + f(-.85 * D.S) + " " + f(.5 * D.S) + '"/><circle class="gr-knot" cx="' + X(x1) + '" cy="' + Y(s) + '" r="2.4"/>'; });
  /* the MGJ, where the gingiva meets the mucosa (the end of the keratinized layer) */
  if (P.mgj != null) { var K = P.layers[P.kgi], mx = grIn(P.mgj) - grOff(K.off, P.mgj), mt = grTh(K.th, P.mgj); o += '<path class="gr-mgj" d="M' + X(mx - mt - .55) + " " + Y(P.mgj) + "H" + X(mx - .05) + '"/><text class="gr-t gr-small gr-halo" x="' + X(mx - mt - .7) + '" y="' + Y(P.mgj + .28) + '" text-anchor="end">MGJ</text>'; }
  /* labels, in a column on the facial side */
  P.lab.forEach(function (l) {
    var ax = grAt(P, l[1], l[2]), lines = l[0].split("|"), ty = l[3] - (lines.length - 1) * .42;
    o += '<path class="gr-lead" d="M' + X(ax) + " " + Y(l[2]) + "L" + X(-7.35) + " " + Y(l[3]) + '"/><circle class="gr-dot" cx="' + X(ax) + '" cy="' + Y(l[2]) + '" r="2.2"/>';
    o += '<text class="gr-t gr-lab' + (l[4] ? " " + l[4] : "") + '" x="' + X(-7.6) + '" y="' + Y(ty + .25) + '" text-anchor="end">' + lines.map(function (s, i) { return '<tspan x="' + X(-7.6) + '" dy="' + (i ? "1.15em" : "0") + '">' + s + "</tspan>"; }).join("") + "</text>";
  });
  return o;
}

/* the incisor in section, the bone and the lingual gingiva (the same at every step) */
function staticSvg(D) {
  const tooth = [[-1.0, -9.6], [-2.2, -7.2], [-2.85, -4.2], [-3.1, -1.6], [-3.0, 0]];
  for (let y = .5; y <= 12.5; y += .5) tooth.push([grRoot(y), y]);
  tooth.push([.1, 13.05], [.5, 13.3], [.95, 12.95], [1.6, 11.5], [2.4, 8], [2.85, 4], [2.95, 0], [3.15, -1.6], [2.8, -3.6], [1.9, -6.4], [.9, -8.6], [.25, -9.7]);
  const enamel = [[-1.0, -9.6], [-2.2, -7.2], [-2.85, -4.2], [-3.1, -1.6], [-3.0, 0], [-2.55, -1.2], [-2.3, -4.3], [-1.75, -7.0], [-.75, -8.9], [.05, -9.1], [.75, -8.2], [1.6, -6.1], [2.4, -3.6], [2.65, -1.6], [2.95, 0], [3.15, -1.6], [2.8, -3.6], [1.9, -6.4], [.9, -8.6], [.25, -9.7]];
  const pulp = [[-.3, -5.8], [-1.0, -2.5], [-1.1, 1.5], [-.55, 6], [-.05, 10], [.35, 12.6], [.55, 12.6], [.8, 10], [.95, 6], [1.0, 1.5], [.85, -2.5], [.2, -5.8]];
  const bone = [[grRoot(CREST) + .02, CREST]]; for (let y = CREST; y <= BOT + .01; y += .5) bone.push([grBone(y), y]);
  bone.push([5.8, BOT], [5.8, 2.4], [3.55, 1.8], [2.92, 1.95], [2.0, 6], [-1.5, 6.5]);
  const lingual = [[2.95, -.6], [3.5, -.95], [4.4, -.25], [5.8, .85], [5.8, 2.4], [3.55, 1.8], [2.93, 1.6]];
  const X = (mm) => Math.round((CX + mm * S) * 10) / 10, Y = (mm) => Math.round((PY + mm * S) * 10) / 10;
  return `<g class="hot" data-info="${D.HOT.bone}"><path class="gr-bone" d="${grP(D, bone, true)}"/></g><path class="gr-kg" d="${grP(D, lingual, true)}"/><path class="gr-ker" d="${grP(D, [[2.95, -.62], [3.5, -.97], [4.4, -.27], [5.8, .83]], false)}"/>`
    + `<g class="hot" data-info="${D.HOT.tooth}"><path class="gr-dent" d="${grP(D, tooth, true)}"/><path class="gr-enam" d="${grP(D, enamel, true)}"/><path class="gr-pulp" d="${grP(D, pulp, true)}"/></g>`
    + `<path class="gr-cej" d="M${X(-3.25)} ${Y(0)}H${X(-2.45)}"/><text class="gr-t gr-on" x="${X(-2.3)}" y="${Y(.3)}">CEJ</text>`;
}

const D = {
  W, H, S, CX, PY,
  ST: {
    ctg: [
      { layers: [{ k: "kg", y0: 3, y1: 6, th: "thin", ker: [3, 6] }, { k: "muc", y0: 6, y1: BOT, th: "thin", j: 1 }], mgj: 6, kgi: 0,
        lab: [["exposed root", "root", 1.6, -1.6], ["keratinized|gingiva", 0, 4.4, 3.2], ["alveolar mucosa", 1, 10, 9], ["bone", "bone", 9.5, 12.4]],
        text: "Before: 3 mm of facial recession over a thin phenotype, with a band of keratinized gingiva below the margin. The patient has an esthetic concern and sensitivity, and the goal is root coverage." },
      { layers: [{ k: "ctg", y0: .1, y1: 6.1, th: "ctg" }, { k: "kg", y0: 3, y1: 6, th: 1.0, off: "lift", ker: [3, 6] }, { k: "muc", y0: 6, y1: BOT, th: 1.0, off: "lift", j: 1 }], mgj: 6, kgi: 1,
        lab: [["CTG", 0, 2.6, -1.6], ["flap, raised", 1, 4.4, 3.2], ["bone", "bone", 9.5, 12.4]],
        text: "A flap is raised (partial thickness, keeping some periosteum) to expose the root, and a CTG from the palate, its epithelium removed, is sutured over the root. It is connective tissue only, because it is going to be covered." },
      { layers: [{ k: "ctg", y0: .1, y1: 6.1, th: "ctg" }, { k: "kg", y0: -.6, y1: 2.4, th: 1.0, off: "onCtg", ker: [-.6, 2.4] }, { k: "muc", y0: 2.4, y1: BOT, th: 1.0, off: "onCtg", j: 1 }], mgj: 2.4, kgi: 1, sut: [.5],
        lab: [["flap, coronally|advanced", 1, .9, -1.2], ["CTG, covered", 0, 4.2, 5.2], ["bone", "bone", 9.5, 12.4]],
        text: "The flap is advanced coronally over the graft, tension free, so it holds its position, covering the recession and the graft completely. “We always do a coronally advanced flap if we're trying to cover the graft.”" },
      { layers: [{ k: "kg", y0: 0, y1: 3, th: "thick", ker: [0, 3] }, { k: "muc", y0: 3, y1: BOT, th: "thick", j: 1 }], mgj: 3, kgi: 0, ghost: 1,
        lab: [["root covered", 0, .3, -1.6], ["thick tissue", 0, 2.0, 1.3], ["the graft, now|part of it", "ghost", 4.6, 5.6, "gr-faint"], ["bone", "bone", 9.5, 12.4]],
        text: "Healed (his case at about four weeks): the root is covered, and the profile shows the other gain, much thicker tissue over the roots: a thick phenotype, which by definition resists further recession much better." },
    ],
    fgg: [
      { layers: [{ k: "muc", y0: 3, y1: BOT, th: 1.0 }], mgj: null,
        lab: [["exposed root", "root", 1.6, -1.6], ["margin is mucosa:|no keratinized gingiva", 0, 3.6, 3.2], ["bone", "bone", 9.5, 12.4]],
        text: "Before: an RT2 recession on a sensitive tooth with no keratinized gingiva: the margin is alveolar mucosa, a plaque trap that keeps irritating it. The goal is to change the quality of the tissue, a band of keratinized gingiva; root coverage would be a bonus." },
      { layers: [{ k: "bed", y0: 3, y1: 8, th: .22 }, { k: "muc", y0: 8, y1: BOT, th: 1.0 }], mgj: null, sut: [8.4],
        lab: [["recipient bed", 0, 5.5, 3.2], ["flap, apically|positioned", 1, 9.6, 8.2], ["bone", "bone", 11, 12.6]],
        text: "A trapezoidal flap (a horizontal incision and two vertical ones) is moved apically and sutured there, leaving a recipient bed of connective tissue where the new gingiva will be." },
      { layers: [{ k: "bed", y0: 3, y1: 8, th: .22 }, { k: "fgg", y0: 2.8, y1: 7.8, th: "fgg", off: "onBed", ker: [2.8, 7.8] }, { k: "muc", y0: 8, y1: BOT, th: 1.0 }], mgj: null, sut: [3.2, 7.5],
        lab: [["its own epithelium", "o1", 4.9, 1.6], ["FGG, left exposed", 1, 6.3, 5.2], ["flap", 2, 10.5, 9], ["bone", "bone", 11, 12.6]],
        text: "An FGG from the palate, with its epithelium, is sutured on the bed and left exposed, so it heals into keratinized gingiva: it brings its own determination to keratinize. Covering it with the flap would deny it that. The palate heals by secondary intention." },
      { layers: [{ k: "kg", y0: 2.5, y1: 7.5, th: "fh", ker: [2.5, 7.5] }, { k: "muc", y0: 7.5, y1: BOT, th: "fh", j: 1 }], mgj: 7.5, kgi: 0,
        lab: [["some root coverage", 0, 2.6, -.8], ["a band of|keratinized gingiva", 0, 5, 3.4], ["alveolar mucosa", 1, 10.5, 9.4], ["bone", "bone", 11, 12.6]],
        text: "Healed (his case at three months): a good band of keratinized gingiva where there was none, blending with the neighboring tissue, and partial root coverage, as expected for RT2. The patient was told not to pull the lip down to look, to keep a soft diet and not to brush the area while it healed." },
    ],
  },
  MODE: { ctg: ["root coverage", "a CTG (connective tissue only)", "covered by the flap"], fgg: ["keratinized gingiva", "an FGG (epithelium and connective tissue)", "left exposed"] },
  HOT: {
    tooth: "A mandibular incisor in section. The root below the CEJ is exposed where the tissue has receded.",
    bone: "The facial bone plate, thin over the root, its crest apical to the recession.",
    kg: "Keratinized gingiva: firm, attached and keratinized on its surface (the darker line).",
    muc: "Alveolar mucosa: loose, mobile and not keratinized. Mucosa doesn't become keratinized just because it covers a graft.",
    ctg: "A connective tissue graft: the palate's connective tissue without its epithelium. It goes under the flap, because epithelium placed against the flap's inner side, which is connective tissue, “just would not heal properly.”",
    fgg: "A free gingival graft: the palate's epithelium and connective tissue in one piece, left exposed. The palate's tissue carries the information to keratinize with it.",
    bed: "The recipient bed: connective tissue left over the bone once the flap has been moved apically.",
  },
};
D.STATIC = staticSvg(D);

const scale = `<path class="gr-scale" d="M16 ${H - 14}h${5 * S}M16 ${H - 18}v8M${16 + 5 * S} ${H - 18}v8"/><text class="gr-t gr-small" x="${16 + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const tags = `<text class="gr-t gr-tag" x="${CX - 5.6 * S}" y="${PY - 9.0 * S}" text-anchor="middle">FACIAL</text><text class="gr-t gr-tag" x="${CX + 5.0 * S}" y="${PY - 9.0 * S}" text-anchor="middle">LINGUAL</text>`;
const svg = figureSvg({ width: W, height: H, className: "gr-svg", label: "A section through the facial of a mandibular incisor with facial recession: the root, the facial bone plate and the soft tissue at each step of the chosen procedure, with the graft, the flap, the keratinized gingiva and the mucosa labeled.",
  body: `${D.STATIC}<g class="gr-dyn">${grDyn({ m: "ctg", s: 0 }, D)}</g>${tags}${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 3", title: "Covered or exposed: which graft", hint: "pick a goal · step through", readout: "CTG under a flap · 1 of 4", body: `<div class="am-svg gr-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Goal"><button type="button" class="am-btn" data-grm="ctg" aria-pressed="true">Root coverage: CTG + coronally advanced flap</button><button type="button" class="am-btn" data-grm="fgg" aria-pressed="false">Keratinized gingiva: FGG + apically positioned flap</button></div>
<div class="am-controls" role="group" aria-label="Step"><button type="button" class="am-btn" data-grs="0" aria-pressed="true">1 Before</button><button type="button" class="am-btn" data-grs="1" aria-pressed="false">2</button><button type="button" class="am-btn" data-grs="2" aria-pressed="false">3</button><button type="button" class="am-btn" data-grs="3" aria-pressed="false">4 Healed</button><button type="button" class="am-btn" data-grnext>Next step</button></div>
<div class="am-stats"><span>Goal <b data-gr="0"></b></span><span>Graft <b data-gr="1"></b></span><span>The graft is <b data-gr="2"></b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the graft, the flap, the gingiva, the mucosa or the bone.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's recorded lecture: the rule (covered by a flap = connective tissue only; left exposed = an FGG), his CTG + coronally advanced flap case (the root covered, the tissue thicker) and his FGG + apically positioned flap case (no KG and an RT2 recession; a band of KG and partial coverage at three months).</li>
<li>Outside sources: the coronally advanced flap over a subepithelial connective tissue graft follows Langer and Langer (J Periodontol 1985;56:715-20); the free gingival graft left exposed on a periosteal bed, and its healing into keratinized tissue because the graft's connective tissue decides what its epithelium becomes, follow Sullivan and Atkins (Periodontics 1968;6:121-9) and Karring, Ostergaard and Löe (J Periodontal Res 1971;6:282-93). They settled where each layer sits at each step.</li>
<li>Drawn to one scale (the 5 mm bar) as a schematic: one tooth for both procedures; the layer thicknesses, depths and the amount of coverage are illustrative. Educational, not medical advice.</li></ul></details>`;

function grLive(root, D) {
  var svg = root.querySelector(".gr-svg"), dyn = svg.querySelector(".gr-dyn"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { m: "ctg", s: 0 }, NM = { ctg: "CTG under a flap", fgg: "FGG left exposed" };
  function draw() {
    dyn.innerHTML = D.grDyn(st, D);
    sum.textContent = D.ST[st.m][st.s].text; if (readout) readout.textContent = NM[st.m] + " · " + (st.s + 1) + " of 4";
    D.MODE[st.m].forEach(function (s, i) { var el = root.querySelector('[data-gr="' + i + '"]'); if (el) el.textContent = s; });
    root.querySelectorAll("[data-grm]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-grm") === st.m)); });
    root.querySelectorAll("[data-grs]").forEach(function (b) { b.setAttribute("aria-pressed", String(+b.getAttribute("data-grs") === st.s)); });
  }
  root.querySelectorAll("[data-grm]").forEach(function (b) { b.addEventListener("click", function () { st.m = b.getAttribute("data-grm"); st.s = 0; draw(); }); });
  root.querySelectorAll("[data-grs]").forEach(function (b) { b.addEventListener("click", function () { st.s = +b.getAttribute("data-grs"); draw(); }); });
  root.querySelector("[data-grnext]").addEventListener("click", function () { st.s = (st.s + 1) % 4; draw(); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .gr-box{max-width:520px;margin:0 auto}
.anima .gr-svg .gr-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .gr-svg .gr-lab{fill:var(--anatomy-strong);font-weight:600}
.anima .gr-svg .gr-faint{fill:var(--anatomy-muted);font-weight:400}
.anima .gr-svg .gr-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .gr-svg .gr-on{font-size:10.5px;font-weight:600;fill:var(--gr-ink);paint-order:stroke;stroke:var(--gr-dentin);stroke-width:3px}
.anima .gr-svg .gr-halo{paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .gr-svg .gr-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .gr-svg .gr-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .gr-svg .gr-dot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .gr-svg .gr-bone{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-linejoin:round}
.anima .gr-svg .gr-dent{fill:var(--gr-dentin);stroke:var(--gr-line);stroke-width:1}
.anima .gr-svg .gr-enam{fill:var(--gr-enamel);stroke:var(--gr-line);stroke-width:1}
.anima .gr-svg .gr-pulp{fill:color-mix(in srgb, var(--pd-red) 45%, var(--gr-dentin));stroke:var(--pd-red-line);stroke-width:.6}
.anima .gr-svg .gr-kg{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1;stroke-linejoin:round}
.anima .gr-svg .gr-muc{fill:var(--gr-muc);stroke:var(--pd-red-line);stroke-width:1;stroke-linejoin:round}
.anima .gr-svg .gr-ctg,.anima .gr-svg .gr-fgg{fill:var(--gr-graft);stroke:var(--pd-enz);stroke-width:1.3;stroke-linejoin:round}
.anima .gr-svg .gr-bed{fill:color-mix(in srgb, var(--pd-red) 35%, var(--pd-bone));stroke:var(--pd-red-line);stroke-width:.6}
.anima .gr-svg .gr-ker{fill:none;stroke:var(--pd-gum-line);stroke-width:2.4;stroke-linecap:round}
.anima .gr-svg .gr-fgg + .gr-ker{stroke:var(--pd-enz)}
.anima .gr-svg .gr-ghost{fill:none;stroke:var(--pd-enz);stroke-width:1.1;stroke-dasharray:3 3}
.anima .gr-svg .gr-sut{fill:none;stroke:var(--pd-drug);stroke-width:1.5;stroke-linecap:round}
.anima .gr-svg .gr-knot{fill:var(--pd-drug)}
.anima .gr-svg .gr-mgj{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3;stroke-dasharray:3 2}
.anima .gr-svg .gr-cej{fill:none;stroke:var(--anatomy-strong);stroke-width:1.4}
.anima .gr-svg .gr-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima[data-anima="grafts"]{--gr-enamel:#fbf8f2;--gr-dentin:#dcc6a1;--gr-line:#a8916a;--gr-graft:#f3d9a8;--gr-ink:#4a3b22;--gr-muc:color-mix(in srgb, var(--pd-red) 45%, var(--pd-gum))}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="grafts"]{--gr-enamel:#e4ddd0;--gr-dentin:#b9a27c;--gr-line:#8a7552;--gr-graft:#d8b57a;--gr-ink:#2e2414;--gr-muc:#b8344b} }
:root[data-theme="dark"] .anima[data-anima="grafts"]{--gr-enamel:#e4ddd0;--gr-dentin:#b9a27c;--gr-line:#8a7552;--gr-graft:#d8b57a;--gr-ink:#2e2414;--gr-muc:#b8344b}
`;

export function grafts() {
  return { id: "grafts", lec: "perio-plastic-esthetics", title: "Covered or exposed: which graft",
    caption: "The same recession, two goals: for root coverage a CTG goes under a coronally advanced flap; for keratinized gingiva an FGG is left exposed above an apically positioned flap. Step through each.",
    html: `<div class="anima" data-anima="grafts">${plate}${controls}${SOURCES}</div>`, css: CSS, live: grLive.toString(), helpers: [grRoot, grBone, grIn, grCtg, grTh, grOff, grP, grBand, grAt, grDyn], data: D };
}
