// Fig: gingival excess, the pseudopocket and drug-induced enlargement (Periodontology S9, from Dr. Abou-Arraj's Nov 12
// live class). The same labiolingual section through a maxillary central incisor as Fig 4 (ape.mjs, 13 px = 1 mm), with
// the bone crest in its normal range and the attachment at the CEJ, in three states:
//   healthy: the margin on the enamel, a probing depth of about 1 mm;
//   gingivitis (a pseudopocket): swollen, edematous, bleeding gingiva; the margin has moved coronally, the CEJ hasn't:
//     it probes 4 mm with no attachment loss and no bone loss; better oral hygiene and scaling resolve it;
//   drug-induced enlargement (phenytoin, calcium channel blockers, cyclosporine): fibrotic tissue, extra collagen laid
//     down in response to the drug; hygiene and scaling come first but won't resolve it, so it is resected
//     (a gingivectomy), and the physician may be asked about switching the drug.
// Positions in mm are illustrative; the 4 mm reading is the lecture's ("may probe 4 or 5 mm").
import { figureSvg, plateHtml } from "./shared.mjs";
import { apLerp, apF, apL, apBO, apIn, apTh, apP, apBone, staticSvg } from "./ape.mjs";

const S = 13, W = 416, H = 392, CX = 279, PY = 223.5, TOP = 15.6;

/* soft tissue thickness: the normal gingiva and mucosa (apTh) plus a swelling that peaks at the margin */
function exTh(d, g, P) { var u = Math.max(0, Math.min(1, (d - P.m) / (P.c + 1.2 - P.m))); return apTh(d, g) + P.sw * Math.pow(1 - u, 1.3); }
function exBand(lo, hi, P, cap) {
  var a = [], b = [], n = Math.max(8, Math.round((hi - lo) * 3)), i;
  for (i = 0; i <= n; i++) { var d = lo + (hi - lo) * i / n, x = apIn(d, P.c); a.push([x, d]); b.push([x - exTh(d, P.g, P), d]); }
  if (!cap) return b.slice().reverse().concat(a);
  var t = exTh(lo, P.g, P), r = .3 + .22 * t, cx = (a[0][0] + b[0][0]) / 2, arc = [];
  for (i = 1; i < 8; i++) { var q = Math.PI * i / 8; arc.push([cx - Math.cos(q) * t / 2, lo - Math.sin(q) * r]); }
  return b.slice().reverse().concat(arc, a);
}
function exDyn(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, X = function (mm) { return f(D.CX + mm * D.S); }, Y = function (d) { return f(D.PY - d * D.S); };
  var P = D.ST[st.k][st.tx], o = "", lab = [], g = P.g, c = P.c, m = P.m;
  o += '<g class="hot" data-info="' + D.HOT.muc + '"><path class="ex-muc" d="' + apP(D, exBand(g, D.TOP, P, false), true) + '"/></g>';
  o += '<g class="hot" data-info="' + D.HOT[P.kind] + '"><path class="ex-kg ex-' + P.kind + '" d="' + apP(D, exBand(m, g, P, true), true) + '"/>';
  var e = [], i;
  for (i = 0; i <= 30; i++) { var d = m + (g - m) * i / 30; e.push([apIn(d, c) - exTh(d, g, P) + .1, d]); }
  o += '<path class="ex-ker" d="' + apP(D, e, false) + '"/></g>';
  /* where it was before treatment */
  if (P.was != null) { var W0 = D.ST[st.k][0]; o += '<g class="hot" data-info="' + D.HOT.was + '"><path class="ex-was" d="' + apP(D, exBand(W0.m, g - .2, W0, true), true) + '"/></g>'; lab.push([D.TXT.was, apIn(W0.m + .6, c) - exTh(W0.m + .6, g, W0) + .05, W0.m + .6]); }
  /* bleeding at the margin */
  if (P.bleed) for (i = 0; i < 4; i++) { var bd = m - .15 + i * .5, bx = apIn(bd, c) - exTh(bd, g, P) - .12 - (i % 2) * .1; o += '<circle class="ex-blood" cx="' + X(bx) + '" cy="' + Y(bd) + '" r="' + (2.6 - i * .35) + '"/>'; }
  /* the MGJ */
  var mi = apIn(g, c), mo = mi - exTh(g, g, P);
  o += '<path class="ex-mgj" d="M' + X(mo - .45) + " " + Y(g) + "H" + X(mi - .05) + '"/>';
  /* the attachment at the CEJ: a mark on the tooth where the probe stops */
  o += '<g class="hot" data-info="' + D.HOT.att + '"><path class="ex-att" d="M' + X(apF(0) - .55) + " " + Y(0) + "H" + X(apF(0) + .02) + '"/><circle class="ex-attdot" cx="' + X(apF(0) + .02) + '" cy="' + Y(0) + '" r="2.4"/></g>';
  /* the probe, in the sulcus from the margin to the attachment: a 0.4 mm shaft with 1 mm marks */
  var tip = D.TIP, top = Math.min(m - 2.2, tip - 6.2), L = [], R = [], j;
  for (j = 0; j <= 24; j++) { var dp = top + (tip - top) * j / 24, xc = apF(dp) - .26; L.push([xc - .2, dp]); R.push([xc + .2, dp]); }
  o += '<g class="hot" data-info="' + D.HOT.probe + '"><path class="ex-probe" d="' + apP(D, L.concat([[apF(tip) - .26, tip + .2]], R.reverse()), true) + '"/>';
  for (j = 1; j <= 6; j++) { var dt = tip - j, xt = apF(dt) - .26; if (dt > top + .2) o += '<path class="ex-tick" d="M' + X(xt - .2) + " " + Y(dt) + "L" + X(xt + .2) + " " + Y(dt) + '"/>'; }
  o += "</g>";
  /* labels: sorted from apical to coronal, one slot each, so no leaders cross */
  lab.push([D.TXT.muc, apIn(11.5, c) - apTh(11.5, g) / 2, 11.5]);
  lab.push([D.TXT.mgj, mo - .1, g]);
  lab.push([D.TXT.crest, apF(c) - .2, c + .2]);
  lab.push([D.TXT.att, apF(0) - .55, 0]);
  lab.push([D.TXT[P.kind], apIn((m + g) / 2 - .6, c) - exTh((m + g) / 2 - .6, g, P) / 2, (m + g) / 2 - .6]);
  lab.push([D.TXT.probe[P.kind === "edema" ? 1 : P.kind === "fibro" ? 2 : 0].replace("#", P.pd), apF(tip - 1.5) - .46, tip - 1.5]);
  lab.push([D.TXT.margin, apIn(m - .2, c) - exTh(m, g, P) / 2, m - .25]);
  lab.sort(function (p, q) { return q[2] - p[2]; });
  lab.forEach(function (l, n) {
    var sy = 13.6 - n * 2.75, lines = l[0].split("|"), ty = sy + (lines.length - 1) * .42;
    o += '<path class="ex-lead" d="M' + X(l[1]) + " " + Y(l[2]) + "L" + X(-6.35) + " " + Y(sy) + '"/><circle class="ex-dot" cx="' + X(l[1]) + '" cy="' + Y(l[2]) + '" r="2.2"/>';
    o += '<text class="ex-t ex-lab" x="' + X(-6.6) + '" y="' + Y(ty - .3) + '" text-anchor="end">' + lines.map(function (s, q) { return '<tspan x="' + X(-6.6) + '" dy="' + (q ? "1.15em" : "0") + '">' + s + "</tspan>"; }).join("") + "</text>";
  });
  return o;
}

/* the states: k = 0 healthy, 1 gingivitis (pseudopocket), 2 drug enlargement; tx = 0 as found, 1 after hygiene and
   scaling, 2 after a gingivectomy. m: the margin (mm from the CEJ, coronal -); sw: swelling at the margin (mm). */
const C = 1.75, G = 3.6, HEALTHY = { m: -1.3, sw: 0, c: C, g: G, kind: "kg", pd: 1 };
const D = {
  W, H, S, CX, PY, TOP, BX: [7.2, 8.95], TIP: -.3,
  ST: [
    [HEALTHY, HEALTHY, HEALTHY],
    [{ m: -4.3, sw: 1.1, c: C, g: G, kind: "edema", pd: 4, bleed: true }, Object.assign({ was: 1 }, HEALTHY), null],
    [{ m: -5.3, sw: 1.9, c: C, g: G, kind: "fibro", pd: 5 }, { m: -5.1, sw: 1.8, c: C, g: G, kind: "fibro", pd: 5 }, Object.assign({ was: 1 }, HEALTHY)],
  ],
  NAME: ["Healthy", "Gingivitis: a pseudopocket", "Drug-induced enlargement"],
  TXN: ["as found", "after hygiene and scaling", "after a gingivectomy"],
  TXT: {
    muc: "alveolar mucosa", mgj: "MGJ", crest: "bone crest, 1.5-2 mm|from the CEJ: no bone loss", att: "attachment at|the CEJ: no loss",
    kg: "gingiva, healthy", edema: "gingiva, swollen|(edematous), bleeding", fibro: "gingiva, enlarged|and fibrotic",
    probe: ["probe, # mm", "probe, # mm:|a pseudopocket", "probe, # mm:|enlarged tissue"], margin: "gingival margin", was: "where the|margin was",
  },
  SUM: [
    ["Healthy gingiva: the margin sits on the enamel, the attachment at the CEJ, the bone crest in its normal range. The probe goes in about 1 mm.", "Healthy gingiva: nothing to treat.", ""],
    ["Gingivitis: the gingiva is swollen and edematous and bleeds, so the margin has moved coronally while the CEJ hasn't. The probe reads 4 mm, but there is no attachment loss and no bone loss on the radiograph: a pseudopocket.", "Better oral hygiene, and scaling where there is calculus: the swelling resolves and the margin goes back to where it was. Gingivitis is reversible.", ""],
    ["Drug-induced enlargement (anticonvulsants such as phenytoin, calcium channel blockers, immunosuppressants such as cyclosporine). Plaque is still the primary factor, but the drug lays down extra collagen: the tissue is fibrotic. It probes 5 mm here, again with no attachment or bone loss.", "Hygiene and scaling come first, but they won't resolve it: fibrotic tissue doesn't shrink the way edema does.", "The fibrotic tissue is resected with a gingivectomy (a bur, a blade or a laser). If it keeps coming back, you may ask the physician about switching the drug. Calcium channel blockers are the class you'll meet most."],
  ],
  HOT: {
    tooth: "A maxillary central incisor in section. The CEJ marks where the enamel ends.",
    kg: "Healthy keratinized gingiva, from the margin to the MGJ.",
    edema: "Gingivitis: inflamed, edematous gingiva that bleeds on probing. It has swollen coronally over the enamel; nothing has been lost underneath.",
    fibro: "Drug-induced enlargement: fibrotic gingiva, with extra collagen fibers laid down in response to the drug. Plaque-induced gingivitis is still the primary factor.",
    muc: "Alveolar mucosa, beyond the MGJ.",
    bone: "The facial bone, its crest in the normal range, 1.5-2 mm from the CEJ: no bone loss.",
    att: "The attachment, at the CEJ: where the probe stops. It hasn't moved, so there is no attachment loss, whatever the probe reads.",
    probe: "The periodontal probe, from the margin to the attachment. Its reading grows with the swelling, not with any loss.",
    was: "Where the margin was before treatment.",
  },
};
D.STATIC = staticSvg(D);
function exBoneSvg(st, D) { return '<g class="hot" data-info="' + D.HOT.bone + '"><path class="ex-bone" d="' + apP(D, apBone(D, D.ST[0][0].c), true) + '"/></g>'; }

const scale = `<path class="ex-scale" d="M16 ${H - 14}h${5 * S}M16 ${H - 18}v8M${16 + 5 * S} ${H - 18}v8"/><text class="ex-t ex-small" x="${16 + 2.5 * S}" y="${H - 21}" text-anchor="middle">5 mm</text>`;
const tags = `<text class="ex-t ex-tag" x="${CX - 4.6 * S}" y="${PY + 10.4 * S}" text-anchor="middle">FACIAL</text><text class="ex-t ex-tag" x="${CX + 4.4 * S}" y="${PY + 10.4 * S}" text-anchor="middle">PALATAL</text>`;
const st0 = { k: 1, tx: 0 };
const svg = figureSvg({ width: W, height: H, className: "ex-svg", label: "A section through a maxillary central incisor: healthy gingiva, the swollen gingiva of a pseudopocket, or drug-induced enlargement, with a probe in the sulcus, the attachment at the CEJ and the bone crest in its normal range, before and after treatment.",
  body: `<g class="ex-bonel">${exBoneSvg(st0, D)}</g>${D.STATIC}<g class="ex-dyn">${exDyn(st0, D)}</g>${tags}${scale}` });
const plate = plateHtml({ fig: "S9 · Fig 6", title: "Pseudopocket or enlargement", hint: "pick, then treat", readout: "Gingivitis · as found", body: `<div class="am-svg ex-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Condition">${D.NAME.map((n, i) => `<button type="button" class="am-btn" data-exk="${i}" aria-pressed="${i === 1}">${n}</button>`).join("")}</div>
<div class="am-controls" role="group" aria-label="Treatment">${["As found", "Hygiene and scaling", "Gingivectomy"].map((n, i) => `<button type="button" class="am-btn" data-ext="${i}" aria-pressed="${i === 0}">${n}</button>`).join("")}</div>
<div class="am-stats"><span>Probing depth <b data-ex="0"></b></span><span>Attachment loss <b>none</b></span><span>Bone loss <b>none</b></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the gingiva, the probe, the attachment or the bone.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From Dr. Abou-Arraj's Nov 12 live class: the pseudopocket of gingivitis (it "may probe 4 or 5 mm and bleed", with no attachment loss and no bone loss, and resolves with better hygiene and scaling), and drug-induced enlargement (phenytoin, calcium channel blockers, cyclosporine; fibrotic, so a gingivectomy; maybe a talk with the physician about the drug).</li>
<li>Outside sources: drug-influenced gingival enlargement as plaque-induced gingivitis modified by a medication, with fibrotic overgrowth that persists after plaque control, follows the 2017 World Workshop's classification (Murakami et al., J Periodontol 2018;89 Suppl 1:S17-27) and Trackman and Kantarci (Crit Rev Oral Biol Med 2004;15:165-75). The tooth is Fig 4's (Wheeler's Dental Anatomy proportions), with a healthy probing depth of about 1 mm mid-facial as in the notes.</li>
<li>A schematic, drawn to one scale (the 5 mm bar): how far the margin swells, the 5 mm reading for the enlargement and the small change after hygiene alone are illustrative. Real enlargement is often worse interproximally. Educational, not medical advice.</li></ul></details>`;

function exLive(root, D) {
  var svg = root.querySelector(".ex-svg"), dyn = svg.querySelector(".ex-dyn"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { k: 1, tx: 0 };
  function draw() {
    if (!D.ST[st.k][st.tx]) st.tx = 1;
    if (st.k === 0) st.tx = 0;
    dyn.innerHTML = D.exDyn(st, D);
    sum.textContent = D.SUM[st.k][st.tx];
    if (readout) readout.textContent = ["Healthy", "Gingivitis", "Enlargement"][st.k] + " · " + ["as found", "scaled", "gingivectomy"][st.tx];
    root.querySelector('[data-ex="0"]').textContent = D.ST[st.k][st.tx].pd + " mm";
    root.querySelectorAll("[data-exk]").forEach(function (x) { x.setAttribute("aria-pressed", String(+x.getAttribute("data-exk") === st.k)); });
    root.querySelectorAll("[data-ext]").forEach(function (x) { var t = +x.getAttribute("data-ext"); x.setAttribute("aria-pressed", String(t === st.tx)); x.disabled = !D.ST[st.k][t] || (st.k === 0 && t > 0); });
  }
  root.querySelectorAll("[data-exk]").forEach(function (x) { x.addEventListener("click", function () { st.k = +x.getAttribute("data-exk"); st.tx = 0; draw(); }); });
  root.querySelectorAll("[data-ext]").forEach(function (x) { x.addEventListener("click", function () { st.tx = +x.getAttribute("data-ext"); draw(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .ex-box{max-width:520px;margin:0 auto}
.anima .ex-svg .ex-t,.anima .ex-svg .ap-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono)}
.anima .ex-svg .ex-lab{fill:var(--anatomy-strong);font-weight:600}
.anima .ex-svg .ap-rot{fill:var(--anatomy-strong);font-weight:600;font-size:10.5px}
.anima .ex-svg .ex-small{font-size:10.5px;fill:var(--anatomy-muted)}
.anima .ex-svg .ex-tag{font-size:9.5px;letter-spacing:.1em;fill:var(--anatomy-muted)}
.anima .ex-svg .ap-on{font-size:10.5px;font-weight:600;fill:var(--ap-ink);paint-order:stroke;stroke:var(--ap-dentin);stroke-width:3px}
.anima .ex-svg .ap-dent{fill:var(--ap-dentin);stroke:var(--ap-line);stroke-width:1}
.anima .ex-svg .ap-enam{fill:var(--ap-enamel);stroke:var(--ap-line);stroke-width:.9;stroke-linejoin:round}
.anima .ex-svg .ap-pulp{fill:color-mix(in srgb, var(--pd-red) 45%, var(--ap-dentin));stroke:var(--pd-red-line);stroke-width:.6}
.anima .ex-svg .ap-kg,.anima .ex-svg .ex-kg{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1;stroke-linejoin:round}
.anima .ex-svg .ex-kg.ex-edema{fill:color-mix(in srgb, var(--pd-red) 55%, var(--pd-gum));stroke:var(--pd-red-line)}
.anima .ex-svg .ex-kg.ex-fibro{fill:var(--ex-fibro);stroke:var(--pd-gum-line);stroke-width:1.3}
.anima .ex-svg .ap-ker,.anima .ex-svg .ex-ker{fill:none;stroke:var(--pd-gum-line);stroke-width:2.4;stroke-linecap:round}
.anima .ex-svg .ap-guide{fill:none;stroke:var(--anatomy-mid);stroke-width:.9;stroke-dasharray:2 3}
.anima .ex-svg .ap-brk{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3}
.anima .ex-svg .ex-lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .ex-svg .ex-dot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .ex-svg .ex-bone{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.1;stroke-linejoin:round}
.anima .ex-svg .ex-muc{fill:var(--ap-muc);stroke:var(--pd-red-line);stroke-width:1;stroke-linejoin:round}
.anima .ex-svg .ex-was{fill:none;stroke:var(--pd-gum-line);stroke-width:1.2;stroke-dasharray:3 3}
.anima .ex-svg .ex-mgj{fill:none;stroke:var(--anatomy-strong);stroke-width:1.3;stroke-dasharray:3 2}
.anima .ex-svg .ex-att{fill:none;stroke:var(--anatomy-strong);stroke-width:1.4}
.anima .ex-svg .ex-attdot{fill:var(--anatomy-strong);stroke:var(--surface);stroke-width:1}
.anima .ex-svg .ex-blood{fill:var(--pd-blood)}
.anima .ex-svg .ex-probe{fill:var(--ex-steel);stroke:var(--ex-steel-line);stroke-width:.8;stroke-linejoin:round}
.anima .ex-svg .ex-tick{fill:none;stroke:var(--ex-steel-line);stroke-width:1}
.anima .ex-svg .ex-scale{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima[data-anima="excess"] .am-btn:disabled{opacity:.45;cursor:default}
.anima[data-anima="excess"]{--ap-enamel:#fbf8f2;--ap-dentin:#dcc6a1;--ap-line:#a8916a;--ap-ink:#4a3b22;--ap-muc:color-mix(in srgb, var(--pd-red) 45%, var(--pd-gum));--ex-fibro:#e9a9b4;--ex-steel:#c9d0d6;--ex-steel-line:#4d5964}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima[data-anima="excess"]{--ap-enamel:#e4ddd0;--ap-dentin:#b9a27c;--ap-line:#8a7552;--ap-ink:#2e2414;--ap-muc:#b8344b;--ex-fibro:#9a5463;--ex-steel:#9aa5af;--ex-steel-line:#e3e8ec} }
:root[data-theme="dark"] .anima[data-anima="excess"]{--ap-enamel:#e4ddd0;--ap-dentin:#b9a27c;--ap-line:#8a7552;--ap-ink:#2e2414;--ap-muc:#b8344b;--ex-fibro:#9a5463;--ex-steel:#9aa5af;--ex-steel-line:#e3e8ec}
`;

export function excess() {
  return { id: "excess", lec: "perio-plastic-esthetics", title: "Pseudopocket or enlargement",
    caption: "Two kinds of gingival excess with no attachment or bone loss: the swollen gingiva of gingivitis (a pseudopocket), which hygiene and scaling resolve, and fibrotic drug-induced enlargement, which needs a gingivectomy. From the Nov 12 live class.",
    html: `<div class="anima" data-anima="excess">${plate}${controls}${SOURCES}</div>`, css: CSS, live: exLive.toString(), helpers: [apLerp, apF, apL, apBO, apIn, apTh, apP, exTh, exBand, exDyn], data: D };
}
