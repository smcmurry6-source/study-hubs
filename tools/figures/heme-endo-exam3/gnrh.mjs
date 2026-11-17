// Fig: pulsed versus continuous GnRH, and where each anti-androgen acts (L18 Estrogens and Androgens, Dr. Fasinu: the
// GnRH paradox and the three anti-androgen classes). The axis down the left: hypothalamus, a GnRH monitor (pulses or the
// flat continuous line of a long-acting analog), the anterior pituitary (LH) and the testis (Leydig cell, testosterone),
// then a big target cell on the right where testosterone is reduced to DHT by 5-alpha-reductase and DHT binds the
// androgen receptor. Pick a class: a GnRH analog (goserelin) switches the pituitary off, so LH and testosterone fall; a
// 5-alpha-reductase inhibitor (finasteride, dutasteride) blocks the conversion to DHT; a receptor antagonist (flutamide,
// bicalutamide) blocks the receptor. Each lights up its own site, and the androgen effect at the bottom changes.
// Schematic: the organs and the cell are drawn to show the sites, not to scale; levels are qualitative.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

const W = 440, H = 596;

/* ---------- build-time geometry (strings stored in D) ---------- */
function blob(cx, cy, rx, ry, seed) {
  let r = seed, p = [];
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, k = 1 + (rnd() - 0.5) * 0.14; p.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]); }
  const n = p.length; let d = "M" + f1(p[0][0]) + " " + f1(p[0][1]);
  for (let i = 0; i < n; i++) { const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n], e = p[(i + 2) % n];
    d += "C" + f1(b[0] + (c[0] - a[0]) / 6) + " " + f1(b[1] + (c[1] - a[1]) / 6) + " " + f1(c[0] - (e[0] - b[0]) / 6) + " " + f1(c[1] - (e[1] - b[1]) / 6) + " " + f1(c[0]) + " " + f1(c[1]); }
  return d + "Z";
}
/* the hypothalamus: a small brain base */
function hypo(cx, cy) {
  return '<path class="gn-org" d="' + blob(cx, cy, 30, 20, 7) + '"/><path class="gn-gyr" d="M' + (cx - 24) + " " + (cy - 4) + "C" + (cx - 12) + " " + (cy - 12) + " " + (cx + 8) + " " + (cy - 10) + " " + (cx + 22) + " " + (cy - 3) + "M" + (cx - 22) + " " + (cy + 5) + "C" + (cx - 10) + " " + (cy - 1) + " " + (cx + 10) + " " + (cy + 1) + " " + (cx + 24) + " " + (cy + 4) + '"/>';
}
/* the anterior pituitary: an oval gland */
function pit(cx, cy) { return '<ellipse class="gn-org" cx="' + cx + '" cy="' + cy + '" rx="27" ry="19"/><path class="gn-gyr" d="M' + (cx - 20) + " " + cy + "C" + (cx - 8) + " " + (cy - 7) + " " + (cx + 8) + " " + (cy + 7) + " " + (cx + 20) + " " + cy + '"/>'; }
/* the testis: a circle with three Leydig cells in the interstitium */
function testis(cx, cy) {
  let o = '<circle class="gn-org" cx="' + cx + '" cy="' + cy + '" r="30"/>';
  o += '<circle class="gn-tub" cx="' + (cx - 9) + '" cy="' + (cy - 7) + '" r="12"/><circle class="gn-tub" cx="' + (cx + 11) + '" cy="' + (cy + 9) + '" r="11"/>';
  [[cx + 12, cy - 11], [cx - 13, cy + 11], [cx + 1, cy + 1]].forEach((c) => { o += '<circle class="gn-ley" cx="' + c[0] + '" cy="' + c[1] + '" r="4.6"/><circle class="gn-leyn" cx="' + c[0] + '" cy="' + c[1] + '" r="2.1"/>'; });
  return o;
}
/* the target cell: membrane, cytoplasm, a nucleus with DNA */
function cell(x0, y0, x1, y1) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let o = '<path class="gn-mem" d="' + blob(cx, cy, (x1 - x0) / 2 - 3, (y1 - y0) / 2 - 3, 31) + '"/>';
  const nx = x0 + 84, ny = y1 - 46;
  o += '<ellipse class="gn-nuc" cx="' + nx + '" cy="' + ny + '" rx="62" ry="38"/>';
  o += '<path class="gn-dna" d="M' + (nx - 40) + " " + (ny - 20) + "q10 -12 20 0t20 0t20 0M" + (nx - 40) + " " + (ny - 15) + 'q10 -12 20 0t20 0t20 0"/>';
  return { svg: o, nx: nx, ny: ny };
}

/* layout */
const AX = 80;                      // the axis column x
const HY = [AX, 64], PT = [AX, 170], TS = [AX, 272];
const CELL = [196, 320, 420, 574];
const CY = cell(CELL[0], CELL[1], CELL[2], CELL[3]);
const MON = [160, 12, 428, 108];    // the monitor screen
const Tpos = [CELL[0] + 54, CELL[1] + 52], AR = [CELL[0] + 144, CELL[1] + 130], DHT = [CELL[0] + 54, CELL[1] + 130];

/* ---------- page helpers (serialized) ---------- */
/* the GnRH monitor trace: pulses scroll left; "cont" is a flat raised line */
function gnTrace(mode, t, x0, x1, b) {
  var o = "", x, y, sc = t ? t * 0.03 : 0, P = 58, A = 42;
  for (x = x0; x <= x1; x += 2) {
    if (mode === "cont") y = b - 40 - Math.sin((x + sc) / 8) * 0.6;
    else { var q = (((x + sc) % P) + P) % P - P / 2; y = b - A * Math.exp(-(q * q) / 26); }
    o += (x === x0 ? "M" : "L") + f1(x) + " " + f1(y);
  }
  return o;
}
/* dots along a straight segment; n and speed by level ("u" high, "n" normal, "d" low, "ng" none) */
function gnFlow(x1, y1, x2, y2, lv, t, cls, ph) {
  if (lv === "ng") return "";
  var n = lv === "d" ? 1 : lv === "u" ? 4 : 3, sp = lv === "d" ? 0.02 : lv === "u" ? 0.06 : 0.04, o = "", k;
  for (k = 0; k < n; k++) {
    var u = t ? ((t * sp / 60 + k / n + (ph || 0)) % 1) : (k + 0.5) / n, op = Math.min(1, u / 0.12, (1 - u) / 0.12);
    o += '<circle class="' + cls + '" cx="' + f1(x1 + (x2 - x1) * u) + '" cy="' + f1(y1 + (y2 - y1) * u) + '" r="2.7" opacity="' + f1(op) + '"/>';
  }
  return o;
}
/* a horizontal gauge: label above, a filled bar, the word at the right */
function gnGauge(x, y, w, label, lv, word, cls) {
  var fill = lv === "u" ? w : lv === "d" ? w * 0.22 : w * 0.6;
  return T(x, y - 4, label, "gn-gl", "start") +
    '<rect class="gn-gt" x="' + x + '" y="' + y + '" width="' + w + '" height="11" rx="5.5"/>' +
    '<rect class="gn-gf ' + cls + '" x="' + x + '" y="' + y + '" width="' + f1(fill) + '" height="11" rx="5.5"/>' +
    T(x + w + 6, y + 9.5, word, "gn-gv " + cls, "start");
}
/* a drug stop: an octagon on the site it blocks */
function gnStop(x, y) {
  var p = "", i; for (i = 0; i < 8; i++) { var a = (i + 0.5) / 8 * Math.PI * 2; p += (i ? "L" : "M") + f1(x + 9 * Math.cos(a)) + " " + f1(y + 9 * Math.sin(a)); }
  return '<path class="gn-stop" d="' + p + 'Z"/><rect class="gn-stopb" x="' + f1(x - 5) + '" y="' + f1(y - 1.5) + '" width="10" height="3" rx="1"/>';
}
/* an arrow */
function gnArr(x1, y1, x2, y2, cls, dash) {
  var dx = x2 - x1, dy = y2 - y1, n = Math.sqrt(dx * dx + dy * dy), ux = dx / n, uy = dy / n, hx = x2 - ux * 7, hy = y2 - uy * 7;
  return '<path class="gn-arl ' + cls + (dash ? " gn-dash" : "") + '" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(hx) + " " + f1(hy) + '"/><path class="gn-arh ' + cls + '" d="M' + f1(x2) + " " + f1(y2) + "L" + f1(hx - uy * 4) + " " + f1(hy + ux * 4) + "L" + f1(hx + uy * 4) + " " + f1(hy - ux * 4) + 'Z"/>';
}

function gnRender(st, D) {
  var t = st.t || 0, v = st.v, o = "";
  var cont = v === "gose", lowLH = cont, lowT = cont, noDHT = v === "fin", blkR = v === "flu";
  var HY = D.HY, PT = D.PT, TS = D.TS, C = D.CELL, Tp = D.Tp, ARp = D.AR, Dp = D.DHT, M = D.MON;
  /* ---- the monitor ---- */
  o += '<rect class="gn-screen" x="' + M[0] + '" y="' + M[1] + '" width="' + (M[2] - M[0]) + '" height="' + (M[3] - M[1]) + '" rx="10"/>';
  o += '<path class="gn-grid" d="M' + (M[0] + 10) + " " + (M[1] + 40) + "H" + (M[2] - 10) + "M" + (M[0] + 10) + " " + (M[1] + 68) + "H" + (M[2] - 10) + '"/>';
  o += '<path class="gn-base" d="M' + (M[0] + 10) + " " + (M[3] - 12) + "H" + (M[2] - 10) + '"/>';
  o += HOT("GnRH release over time. Normally it comes in pulses: a short burst, then a long pause. A long-acting analog (goserelin) stimulates without a pause: continuous.",
    '<path class="gn-trace' + (cont ? " gn-cont" : "") + '" d="' + gnTrace(cont ? "cont" : "pulse", t, M[0] + 10, M[2] - 10, M[3] - 12) + '"/>' +
    T(M[0] + 10, M[1] + 16, "GnRH over time", "gn-mt", "start") + T(M[2] - 10, M[1] + 16, cont ? "continuous" : "pulses", "gn-mv " + (cont ? "gn-bad" : "gn-ok"), "end"));
  o += '<path class="gn-probe gn-dash" d="M' + (HY[0] + 26) + " " + (HY[1] - 8) + "L" + (M[0]) + " " + (M[3] - 24) + '"/>';
  /* ---- hypothalamus ---- */
  o += HOT("Hypothalamus: releases GnRH (gonadotropin-releasing hormone) in pulses to the anterior pituitary.", D.HYPO);
  o += T(HY[0], HY[1] + 34, "hypothalamus", "gn-lb b", "middle");
  o += gnFlow(HY[0], HY[1] + 22, PT[0], PT[1] - 20, cont ? "u" : "n", t, "gn-gnrh", 0);
  o += T(HY[0] - 8, (HY[1] + PT[1]) / 2 + 2, "GnRH", "gn-sm gn-gnrht", "end");
  /* ---- pituitary ---- */
  o += HOT("Anterior pituitary: GnRH makes it release LH (and FSH), which drive the testis." + (cont ? " Here, continuous stimulation has switched it off." : ""),
    '<g class="' + (cont ? "gn-off" : "") + '">' + D.PIT + "</g>");
  o += T(PT[0], PT[1] + 34, "pituitary", "gn-lb b", "middle");
  o += gnGauge(PT[0] + 40, PT[1] - 6, 86, "LH", lowLH ? "d" : "u", lowLH ? "low" : "high", lowLH ? "gn-dn" : "gn-up");
  if (cont) { o += gnStop(PT[0] + 24, PT[1] - 14); o += T(PT[0] + 40, PT[1] + 20, "pituitary switched off", "gn-sm gn-badt", "start"); }
  o += gnFlow(PT[0], PT[1] + 20, TS[0], TS[1] - 22, lowLH ? "d" : "n", t, "gn-lh", 0.3);
  o += T(PT[0] - 8, (PT[1] + TS[1]) / 2 + 2, "LH", "gn-sm gn-lht", "end");
  /* ---- testis ---- */
  o += HOT("Testis: the Leydig cells (the LH target) make testosterone." + (lowT ? " Here, with LH suppressed, little testosterone is made." : ""),
    '<g class="' + (lowT ? "gn-off" : "") + '">' + D.TESTIS + "</g>");
  o += T(TS[0], TS[1] + 44, "testis", "gn-lb b", "middle") + T(TS[0], TS[1] + 58, "(Leydig cells)", "gn-sm mut", "middle");
  o += gnGauge(TS[0] + 40, TS[1] - 6, 86, "testosterone", lowT ? "d" : "u", lowT ? "low" : "high", lowT ? "gn-dn" : "gn-up");
  /* testosterone flows to the target cell */
  o += gnFlow(TS[0] + 26, TS[1] + 6, Tp[0], Tp[1] - 12, lowT ? "d" : "n", t, "gn-t", 0);
  o += T((TS[0] + 26 + Tp[0]) / 2 + 4, TS[1] + 30, "testosterone", "gn-sm gn-tt", "middle");
  /* ---- the target cell ---- */
  o += HOT("A target cell (for example in the prostate or scalp). Testosterone enters, is reduced to DHT, and DHT binds the androgen receptor, which changes gene expression.", D.CELLSVG);
  o += T(C[0] + 10, C[1] + 18, "target cell", "gn-lb mut", "start");
  /* testosterone token */
  o += HOT("Free testosterone enters the cell.", '<g class="' + (lowT ? "gn-faint" : "") + '"><circle class="gn-tok gn-ttok" cx="' + Tp[0] + '" cy="' + Tp[1] + '" r="12"/>' + T(Tp[0], Tp[1] + 4, "T", "gn-tokt", "middle") + "</g>");
  /* 5-alpha-reductase: the enzyme turning T into DHT */
  var ex = (Tp[0] + Dp[0]) / 2, ey = (Tp[1] + Dp[1]) / 2;
  o += gnArr(Tp[0], Tp[1] + 13, Dp[0], Dp[1] - 13, noDHT ? "gn-mid" : "gn-and", noDHT);
  o += HOT("5-alpha-reductase reduces testosterone to DHT, the active androgen. The 5-alpha-reductase inhibitors finasteride (Proscar, Propecia) and dutasteride (Avodart) block it." + (noDHT ? " Blocked here: no DHT is made." : ""),
    '<rect class="gn-enz' + (noDHT ? " gn-site" : "") + '" x="' + (ex - 38) + '" y="' + (ey - 13) + '" width="76" height="26" rx="7"/>' + T(ex, ey + 4, "5α-reductase", "gn-enzt", "middle"));
  if (noDHT) o += gnStop(ex + 48, ey);
  /* DHT token */
  var dimDHT = noDHT || lowT;
  o += HOT("DHT (dihydrotestosterone), the active androgen that binds the receptor." + (noDHT ? " Here it is not made." : lowT ? " Here little is made." : ""),
    '<g class="' + (dimDHT ? "gn-faint" : "") + '"><circle class="gn-tok gn-dtok" cx="' + Dp[0] + '" cy="' + Dp[1] + '" r="13"/>' + T(Dp[0], Dp[1] + 4, "DHT", "gn-tokt gn-tokt-l", "middle") + "</g>");
  if (noDHT) o += T(Dp[0], Dp[1] + 26, "DHT ✕", "gn-sm gn-badt", "middle");
  /* the androgen receptor */
  o += gnArr(Dp[0] + 14, Dp[1] - 4, ARp[0] - 16, ARp[1] + 2, dimDHT ? "gn-mid gn-dash" : "gn-and");
  o += HOT("The androgen receptor. DHT (and testosterone) binds it, and the complex goes to the nucleus to change gene expression. The receptor antagonists flutamide (Eulexin) and bicalutamide (Casodex) compete here and block it." + (blkR ? " Blocked here: the hormone can't bind." : ""),
    '<g class="' + (blkR ? "gn-site" : "") + '"><path class="gn-rec" d="M' + (ARp[0] - 16) + " " + (ARp[1] - 16) + 'a16 16 0 0 0 0 32l6 0a10 10 0 0 1 0 -20l-6 0a4 4 0 0 1 0 -8l6 0a10 10 0 0 0 0 -4Z"/></g>');
  o += T(ARp[0] + 18, ARp[1] - 2, "androgen", "gn-sm b", "start") + T(ARp[0] + 18, ARp[1] + 11, "receptor", "gn-sm b", "start");
  if (blkR) { o += gnStop(ARp[0] - 18, ARp[1]); o += T(ARp[0] - 4, ARp[1] + 30, "receptor blocked", "gn-sm gn-badt", "middle"); }
  /* the androgen-effect readout at the nucleus */
  var eff = blkR ? "blocked" : (lowT || noDHT) ? "low" : "on", ec = eff === "on" ? "gn-ok" : "gn-bad", bound = eff === "on";
  /* receptor complex to the nucleus */
  o += gnArr(ARp[0] - 4, ARp[1] + 16, D.CY.nx + 28, D.CY.ny - 34, bound ? "gn-and" : "gn-mid", !bound);
  o += T(D.CY.nx, D.CY.ny + 6, "gene expression", "gn-sm b", "middle");
  o += T(D.CY.nx, D.CY.ny + 22, "androgen effect: " + eff, "gn-eff " + ec, "middle");
  return o;
}
function gnSay(st) {
  var v = st.v;
  if (v === "gose") return ["Goserelin (Zoladex) is a long-acting GnRH analog, so it stimulates the pituitary without a pause instead of in pulses. The cells switch off: LH (and FSH) fall, and so does testosterone. That is why a GnRH analog works as an anti-androgen. Uses: prostate cancer, BPH, precocious puberty, chemical castration.", "continuous GnRH · pituitary off · testosterone low"];
  if (v === "fin") return ["Finasteride (Proscar, Propecia) and dutasteride (Avodart) inhibit 5-alpha-reductase in the target cell, so testosterone isn't reduced to DHT, the active androgen. LH and testosterone stay normal; it is DHT that falls. Uses: BPH (higher strength) and alopecia (lower strength). Side effects: gynecomastia, sexual dysfunction.", "5α-reductase blocked · DHT ✕"];
  if (v === "flu") return ["Flutamide (Eulexin) and bicalutamide (Casodex) compete with testosterone and DHT at the androgen receptor, so the hormone can't act even though it is still made. Uses: prostate cancer, and excess androgens in women. Side effects: GI disturbance (least with bicalutamide), gynecomastia, hepatotoxicity.", "androgen receptor blocked"];
  return ["Natural GnRH comes in pulses, so the pituitary keeps releasing LH, the testis makes testosterone, and in the target cell 5-alpha-reductase makes DHT, which binds the androgen receptor. Pick an anti-androgen to see where it acts.", "GnRH in pulses · testosterone high"];
}

export default function gnrh() {
  return makeFig({ id: "gnrh", lec: "sexster", fig: "Fig 9", short: "Anti-androgens: three sites", hint: "pick a class · hover",
    title: "Pulsed vs continuous GnRH, and where each anti-androgen acts",
    caption: "Dr. Fasinu's three anti-androgen classes on one axis. Natural GnRH comes in pulses; a long-acting analog (goserelin) gives a continuous signal that switches the pituitary off. The other two act in the target cell. Pick a class to light up its site and see LH, testosterone and the androgen effect change.",
    W, H, label: "The hypothalamus, a GnRH monitor, the pituitary and the testis down one axis, with a target cell where 5-alpha-reductase makes DHT and DHT binds the androgen receptor, and the three anti-androgen classes marked at the pituitary, the enzyme and the receptor.",
    D: { INIT: { v: "pulse" }, ANIM: true, HY, PT, TS, CELL, MON, Tp: Tpos, AR, DHT, CY,
      HYPO: hypo(HY[0], HY[1]), PIT: pit(PT[0], PT[1]), TESTIS: testis(TS[0], TS[1]), CELLSVG: CY.svg },
    render: gnRender, say: gnSay, helpers: [gnTrace, gnFlow, gnGauge, gnStop, gnArr],
    controls: `<div class="am-controls" role="group" aria-label="Pick a class">${[["pulse", "Natural pulses"], ["gose", "Goserelin (GnRH analog)"], ["fin", "Finasteride (5α-reductase)"], ["flu", "Flutamide (receptor)"]].map((b) => `<button type="button" class="am-btn" data-amk="v" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From the L18 notes, slides and recording (Dr. Fasinu): GnRH released in pulses (a short burst, then a long pause); a long-acting analog stimulating continuously so the pituitary cells switch off, suppressing FSH, LH and testosterone (the paradox he took time over); the three anti-androgen classes and their highlighted drugs (goserelin; finasteride and dutasteride; flutamide and bicalutamide), each with its mechanism, uses and side effects; 5-alpha-reductase reducing testosterone to DHT, the active androgen, in the target tissues. What is labeled and asked follows the lecture.",
      "For how the mechanism behaves, the receptor-desensitization account of continuous GnRH (downregulation of pituitary GnRH receptors on sustained agonist exposure, after an initial flare) follows Conn and Crowley (N Engl J Med 1991;324:93) and standard pharmacology texts (Katzung, Basic and Clinical Pharmacology); the flare is not drawn, to keep the one taught point clear. The androgen receptor acting as a nuclear receptor that alters gene transcription, with DHT the higher-affinity ligand, follows Goodman and Gilman.",
      "Schematic: the organs and the cell are drawn to show the three sites, not to scale or true shape; LH and testosterone are shown as qualitative high or low, not values; FSH is mentioned in the notes but left off the gauges to keep the figure on the anti-androgen points. Educational, not medical advice."],
    css: `
.anima[data-anima="gnrh"] .am-svg{max-width:500px}
.anima .gnrh-svg .gn-org{fill:var(--bx-matrix);stroke:var(--bx-memb);stroke-width:1.4}
.anima .gnrh-svg .gn-gyr{fill:none;stroke:var(--bx-memb);stroke-width:1;opacity:.7}
.anima .gnrh-svg .gn-tub{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1}
.anima .gnrh-svg .gn-ley{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1}
.anima .gnrh-svg .gn-leyn{fill:var(--bx-nuc)}
.anima .gnrh-svg .gn-off{opacity:.4}
.anima .gnrh-svg .gn-faint{opacity:.28}
.anima .gnrh-svg .gn-mem{fill:var(--bx-matrix);stroke:var(--bx-cyto-line);stroke-width:1.6}
.anima .gnrh-svg .gn-nuc{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima .gnrh-svg .gn-dna{fill:none;stroke:var(--bx-nuc);stroke-width:1.4}
.anima .gnrh-svg .gn-screen{fill:var(--anatomy-shade-0);stroke:var(--anatomy-faint);stroke-width:1.2}
.anima .gnrh-svg .gn-grid{fill:none;stroke:var(--anatomy-faint);stroke-width:1}
.anima .gnrh-svg .gn-base{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .gnrh-svg .gn-trace{fill:none;stroke:var(--bx-stim);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round}
.anima .gnrh-svg .gn-trace.gn-cont{stroke:var(--bx-inhib)}
.anima .gnrh-svg .gn-mt{font:600 11px var(--anatomy-mono);fill:var(--anatomy-muted)}
.anima .gnrh-svg .gn-mv{font:600 11px var(--anatomy-mono)}
.anima .gnrh-svg .gn-mv.gn-ok{fill:var(--bx-stim)} .anima .gnrh-svg .gn-mv.gn-bad{fill:var(--bx-inhib)}
.anima .gnrh-svg .gn-probe{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.anima .gnrh-svg .gn-lb{font:600 12.5px var(--anatomy-mono);fill:var(--anatomy-text);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .gnrh-svg .gn-lb.b{fill:var(--anatomy-strong)} .anima .gnrh-svg .gn-lb.mut{fill:var(--anatomy-muted);font-weight:600}
.anima .gnrh-svg .gn-sm{font:11.5px var(--anatomy-mono);fill:var(--anatomy-text);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .gnrh-svg .gn-sm.b{fill:var(--anatomy-strong);font-weight:600} .anima .gnrh-svg .gn-sm.mut{fill:var(--anatomy-muted)}
.anima .gnrh-svg .gn-gnrht{fill:var(--bx-violet);font-weight:600} .anima .gnrh-svg .gn-lht{fill:var(--bx-blue);font-weight:600} .anima .gnrh-svg .gn-tt{fill:var(--bx-blue);font-weight:600}
.anima .gnrh-svg .gn-badt{fill:var(--bx-inhib);font-weight:700}
.anima .gnrh-svg .gn-gnrh{fill:var(--bx-violet)} .anima .gnrh-svg .gn-lh{fill:var(--bx-blue)} .anima .gnrh-svg .gn-t{fill:var(--bx-blue)}
.anima .gnrh-svg .gn-gl{font:600 11px var(--anatomy-mono);fill:var(--anatomy-muted)}
.anima .gnrh-svg .gn-gt{fill:var(--anatomy-shade-0);stroke:var(--anatomy-faint);stroke-width:1}
.anima .gnrh-svg .gn-gf.gn-up{fill:var(--bx-stim)} .anima .gnrh-svg .gn-gf.gn-dn{fill:var(--bx-inhib)}
.anima .gnrh-svg .gn-gv{font:600 11.5px var(--anatomy-mono)}
.anima .gnrh-svg .gn-gv.gn-up{fill:var(--bx-stim)} .anima .gnrh-svg .gn-gv.gn-dn{fill:var(--bx-inhib)}
.anima .gnrh-svg .gn-stop{fill:var(--bx-inhib);stroke:var(--surface);stroke-width:1.4}
.anima .gnrh-svg .gn-stopb{fill:var(--surface)}
.anima .gnrh-svg .gn-arl{fill:none;stroke-width:2}
.anima .gnrh-svg .gn-arl.gn-and{stroke:var(--bx-blue)} .anima .gnrh-svg .gn-arh.gn-and{fill:var(--bx-blue)}
.anima .gnrh-svg .gn-arl.gn-mid{stroke:var(--anatomy-mid);stroke-width:1.6} .anima .gnrh-svg .gn-arh.gn-mid{fill:var(--anatomy-mid)}
.anima .gnrh-svg .gn-dash{stroke-dasharray:3 3}
.anima .gnrh-svg .gn-arh{stroke:none}
.anima .gnrh-svg .gn-tok{stroke-width:1.2}
.anima .gnrh-svg .gn-ttok{fill:var(--bx-blue-soft);stroke:var(--bx-blue)}
.anima .gnrh-svg .gn-dtok{fill:var(--bx-blue);stroke:var(--bx-nuc-line)}
.anima .gnrh-svg .gn-tokt{font:600 11.5px var(--anatomy-mono);fill:var(--anatomy-strong)}
.anima .gnrh-svg .gn-tokt-l{fill:var(--bx-lumen);stroke:none}
.anima .gnrh-svg .gn-enz{fill:var(--anatomy-shade-1);stroke:var(--anatomy-lo);stroke-width:1.2}
.anima .gnrh-svg .gn-enz.gn-site{fill:var(--bx-hot-soft);stroke:var(--bx-inhib);stroke-width:1.6}
.anima .gnrh-svg .gn-enzt{font:600 11.5px var(--anatomy-mono);fill:var(--anatomy-strong)}
.anima .gnrh-svg .gn-rec{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.6}
.anima .gnrh-svg .gn-site .gn-rec{fill:var(--bx-hot-soft);stroke:var(--bx-inhib);stroke-width:1.8}
.anima .gnrh-svg .gn-eff{font:600 12px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .gnrh-svg .gn-eff.gn-ok{fill:var(--bx-stim)} .anima .gnrh-svg .gn-eff.gn-bad{fill:var(--bx-inhib)}
.anima .gnrh-svg .am-callout .t{font-size:11.5px}
@media (max-width:560px){.anima .gnrh-svg .gn-lb{font-size:13px}.anima .gnrh-svg .gn-sm,.anima .gnrh-svg .gn-gv,.anima .gnrh-svg .gn-tokt,.anima .gnrh-svg .gn-enzt,.anima .gnrh-svg .gn-mt,.anima .gnrh-svg .gn-mv,.anima .gnrh-svg .gn-gl{font-size:12px}.anima .gnrh-svg .gn-eff{font-size:12.5px}}
`,
  });
}
