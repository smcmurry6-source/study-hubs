// Fig 2: the insulin preparations' time-action curves and a basal-bolus day (L11 Pharmacology of Diabetes,
// Dr. Fasinu, recording and slides). Five classes as on his slide: rapid (lispro, aspart, glulisine; Afrezza inhaled, very rapid),
// short (regular), intermediate (NPH), long (glargine, detemir), ultra-long (degludec; glargine as Toujeo). Only his numbers
// are labeled: rapid onset 5-15 minutes and about 4 hours in all; regular peaks around 3 hours and is gone by about 8;
// NPH onset 2-4 hours; glargine lasts more than 24 hours; degludec more than 42. The rest of each curve (rapid's peak,
// regular's onset, NPH's peak and end, the long-acting onsets, detemir's shape) is drawn as a typical shape only, with
// no number on it. Heights are schematic (relative effect, not doses). The day view is his basal-bolus regimen:
// long-acting once at night, rapid-acting before each meal, skip the meal and skip the shot.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* relative effect of one preparation h hours after the injection: a right-skewed bump (or a plateau for the
   long-acting ones) that has fallen to zero by its end */
function inF(c, h) {
  if (h <= c.on || h >= c.end) return 0;
  var taper = Math.min(1, (c.end - h) / c.tp), sm = taper * taper * (3 - 2 * taper);
  if (c.flat) { var r = Math.min(1, (h - c.on) / c.rise); return c.H * r * r * (3 - 2 * r) * sm; }
  var x = (h - c.on) / (c.pk - c.on);
  return c.H * Math.pow(x, c.a) * Math.exp(c.a * (1 - x)) * sm;
}
function inPath(c, x0, sx, y1, sy, hr) {
  var d = "", n = 240, i, h;
  for (i = 0; i <= n; i++) { h = hr * i / n; d += (i ? "L" : "M") + f1(x0 + h * sx) + " " + f1(y1 - inF(c, h) * sy); }
  return d;
}
function inClock(h) { var c = (6 + h) % 24, hh = Math.floor(c), mm = Math.round((c - hh) * 60); if (mm === 60) { hh = (hh + 1) % 24; mm = 0; } var ap = hh < 12 ? "am" : "pm", h12 = hh % 12 === 0 ? 12 : hh % 12; return h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + ap; }

function inRender(st, D) {
  var o = "", t = st.t || 0, X0 = 58, X1 = 462, Y0 = 52, Y1 = 286, i;
  /* frame: the y axis is relative effect (no numbers), the x axis hours */
  o += '<path class="axis" d="M' + X0 + " " + Y0 + "V" + Y1 + "H" + X1 + '"/>';
  o += '<text class="t s mut" transform="rotate(-90 22 ' + ((Y0 + Y1) / 2) + ')" x="22" y="' + ((Y0 + Y1) / 2) + '" text-anchor="middle">insulin effect (relative)</text>';
  if (st.mode === "day") {
    var SY = 230, sx = (X1 - X0) / 24, meals = st.nolunch ? [[1, "breakfast"], [12, "dinner"]] : [[1, "breakfast"], [6, "lunch"], [12, "dinner"]];
    for (i = 0; i <= 24; i += 3) { var gx = X0 + i * sx; o += '<path class="grid" d="M' + f1(gx) + " " + Y0 + "V" + Y1 + '"/>' + (i % 6 === 0 ? T(gx, Y1 + 18, inClock(i).replace(":00", ""), "s", "middle") : '<path class="axis" d="M' + f1(gx) + " " + Y1 + "v4" + '"/>'); }
    o += T((X0 + X1) / 2, Y1 + 40, "time of day (6 am to 6 am)", "s mut", "middle");
    var B = D.BASAL, R = D.CL.r, bol = meals.map(function (m) { return m[0] - 0.25; });
    var bolus = function (h) { var s = 0; bol.forEach(function (b) { s += inF(R, h - b) * D.BOLUS; }); return s; };
    var own = function (h) { var s = D.OWN0; meals.forEach(function (m) { var x = h - m[0]; if (x > 0) s += D.OWNP * Math.pow(x / 0.8, 1.6) * Math.exp(1.6 * (1 - x / 0.8)); }); return s; };
    /* basal band, bolus areas stacked on it, the body's own insulin (dashed) for comparison */
    var top = "", base = "", ownd = "", n = 288;
    for (i = 0; i <= n; i++) { var h = 24 * i / n, x = X0 + h * sx; base += (i ? "L" : "M") + f1(x) + " " + f1(Y1 - B * SY); top += (i ? "L" : "M") + f1(x) + " " + f1(Y1 - (B + bolus(h)) * SY); ownd += (i ? "L" : "M") + f1(x) + " " + f1(Y1 - own(h) * SY); }
    o += HOT("Basal: a long-acting insulin such as glargine, injected once a day at night whatever you eat. It lasts more than 24 hours, so the level stays flat and stands in for the background insulin your own pancreas makes all day.", '<path class="in-fill-l" d="' + base + "L" + X1 + " " + Y1 + "L" + X0 + " " + Y1 + 'Z"/><path class="in-l" d="' + base + '"/>');
    o += HOT("Bolus: a rapid-acting insulin (lispro, aspart, glulisine) injected just before each meal to cover the after-meal glucose spike: onset 5-15 minutes, about 4 hours in all. It's taken as needed (PRN): no meal, no bolus.", '<path class="in-fill-r" d="' + top + "L" + X1 + " " + f1(Y1 - B * SY) + "L" + X0 + " " + f1(Y1 - B * SY) + 'Z"/><path class="in-r" d="' + top + '"/>');
    o += HOT("Your own pancreas, for comparison (schematic): a steady background and a burst of insulin with each meal. Basal-bolus copies that pattern.", '<path class="in-own" d="' + ownd + '"/>');
    /* meals with their bolus shots (pointing up from the axis), and the basal shot at night */
    meals.forEach(function (m) { var mx = X0 + m[0] * sx; o += HOT("A meal: the rapid-acting bolus goes in just before it.", '<circle class="in-meal" cx="' + f1(mx) + '" cy="' + (Y0 - 14) + '" r="7"/><path class="in-fork" d="M' + f1(mx - 2) + " " + (Y0 - 18) + "V" + (Y0 - 10) + "M" + f1(mx + 2) + " " + (Y0 - 18) + "V" + (Y0 - 10) + '"/>') + T(mx, Y0 - 26, m[1], "s", "middle"); });
    bol.forEach(function (b) { var bx = X0 + b * sx; o += '<path class="in-shot in-shot-r" d="M' + f1(bx) + " " + (Y1 - 9) + "l-4.5 9h9z" + '"/>'; });
    if (st.nolunch) o += T(X0 + 6 * sx, Y0 - 26, "no lunch,", "s mut", "middle") + T(X0 + 6 * sx, Y0 - 12, "no shot", "s b bad", "middle");
    var nx = X0 + 16 * sx;
    o += HOT("The basal shot: glargine once a day, at night.", '<path class="in-shot in-shot-l" d="M' + f1(nx) + " " + (Y1 - 9) + "l-4.5 9h9z" + '"/>') + T(nx, Y1 - 15, "glargine at night", "s b in-tl", "middle");
    o += T(X0 + 4, Y1 - B * SY + 15, "basal", "s b in-tl", "start");
    o += L(X0 + 3.1 * sx, Y0 + 14, "rapid-acting bolus", X0 + 2.5 * sx, Y1 - (B + bolus(2.5)) * SY, "start", "s b in-tr");
    o += L(X0 + 15.2 * sx, Y0 + 58, "your own pancreas", X0 + 13.3 * sx, Y1 - own(13.3) * SY, "start", "s in-towt");
    /* a time cursor sweeps the day */
    if (t) {
      var hc = (t / 16000 % 1) * 24, cx = X0 + hc * sx, eff = B + bolus(hc), on = bolus(hc) > 0.03;
      o += '<path class="in-cur" d="M' + f1(cx) + " " + Y0 + "V" + Y1 + '"/><circle class="in-curdot" cx="' + f1(cx) + '" cy="' + f1(Y1 - eff * SY) + '" r="4"/>';
      o += T(X1, 14, inClock(hc) + (on ? " · bolus + basal" : " · basal only"), "s b", "end");
    }
    return o;
  }
  /* curves mode: curves stay below a label lane at the top of the plot, where his numbers go */
  var SY2 = 186, R1 = Y0 + 16, R2 = Y0 + 32, hr2 = +st.hr, sx2 = (X1 - X0) / hr2, step = hr2 <= 12 ? 1 : hr2 <= 24 ? 2 : 6;
  var fit = function (x, s, a) { var w = s.length * 7.3; if (a === "start" && x + w > X1 + 8) return [x - 8, "end"]; if (a === "end" && x - w < X0 + 4) return [x + 8, "start"]; if (a === "middle" && x + w / 2 > X1 + 8) return [X1 + 8, "end"]; return [x, a]; };
  for (i = 0; i <= hr2; i += step) { var gx2 = X0 + i * sx2; o += '<path class="grid" d="M' + f1(gx2) + " " + (Y0 + 40) + "V" + Y1 + '"/>' + T(gx2, Y1 + 18, String(i), "s", "middle"); }
  o += T((X0 + X1) / 2, Y1 + 40, "hours after the injection", "s mut", "middle");
  var keys = ["u", "l", "n", "s", "r"], foc = st.cl;
  keys.forEach(function (k) {
    var C = D.CL[k], on = foc === "all" || foc === k, cls = "in-" + k + (on ? "" : " in-dim");
    var parts = [C].concat(C.alt ? [C.alt] : []), body = "";
    parts.forEach(function (c, j) { var d = inPath(c, X0, sx2, Y1, SY2, hr2); if (foc === k && j === 0) body += '<path class="in-fill-' + k + '" d="' + d + "L" + X1 + " " + Y1 + "L" + X0 + " " + Y1 + 'Z"/>'; body += '<path class="' + cls + (j ? " in-alt" : "") + '" d="' + d + '"/><path class="in-hit" d="' + d + '"/>'; });
    o += HOT(C.info, body);
  });
  /* names on the curves */
  keys.forEach(function (k) {
    var C = D.CL[k], lb = C.lab, on = foc === "all" || foc === k, p = fit(X0 + Math.min(lb[0], hr2) * sx2, C.short, lb[0] >= hr2 ? "end" : lb[2]);
    o += T(p[0], Y1 - lb[1] * SY2, C.short, "s b in-t" + k + (on ? "" : " in-dimt"), p[1]);
    if (C.alt && foc === k && C.alt.lab[0] < hr2) { var q = fit(X0 + C.alt.lab[0] * sx2, C.alt.short, "start"); o += T(q[0], Y1 - C.alt.lab[1] * SY2, C.alt.short, "s in-t" + k, q[1]); }
  });
  /* his numbers on the focused class: a band or a line on the curve, a leader up to the label lane */
  if (foc !== "all") D.NUMS[foc].forEach(function (m) {
    var C = D.CL[foc]; if (m[0] > hr2) return;
    var mx = X0 + m[0] * sx2, mx2 = X0 + Math.min(hr2, m[1]) * sx2, ry = m[2] === 1 ? R1 : R2, lx = m[1] !== m[0] ? (mx + mx2) / 2 : mx;
    if (m[1] !== m[0]) o += '<path class="in-band in-b' + foc + '" d="M' + f1(mx) + " " + (Y1 - 7) + "H" + f1(Math.max(mx2, mx + 3)) + "V" + Y1 + "H" + f1(mx) + 'Z"/>';
    o += '<path class="in-lead in-d' + foc + '" d="M' + f1(lx) + " " + (Y1 - (m[1] !== m[0] ? 7 : 0)) + "V" + (ry + 4) + '"/>';
    var p2 = fit(lx + (m[3] === "end" ? -5 : 5), m[4], m[3]);
    o += T(p2[0], ry, m[4], "s b in-t" + foc, p2[1]);
    if (m[1] === m[0]) o += '<circle class="in-curdot in-d' + foc + '" cx="' + f1(mx) + '" cy="' + f1(Y1 - inF(C, m[0] - 0.001) * SY2) + '" r="3"/>';
  });
  /* a time cursor: which preparations are still acting at this hour */
  if (t) {
    var hc2 = (t / 14000 % 1) * hr2, cx2 = X0 + hc2 * sx2, act = [];
    o += '<path class="in-cur" d="M' + f1(cx2) + " " + (Y0 + 40) + "V" + Y1 + '"/>';
    keys.forEach(function (k) { var C = D.CL[k], v = inF(C, hc2); if ((foc === "all" || foc === k) && v > 0.01) { act.unshift(C.short); o += '<circle class="in-curdot in-d' + k + '" cx="' + f1(cx2) + '" cy="' + f1(Y1 - v * SY2) + '" r="3.6"/>'; } });
    o += T(X1, 22, "hour " + (Math.round(hc2 * 10) / 10) + ": " + (act.length ? act.join(", ") : "none acting"), "s b", "end");
  }
  return o;
}
function inSay(st, D) {
  if (st.mode === "day") return [st.nolunch ? "Skip lunch, skip the lunch shot: the bolus is as needed (PRN), only when you eat. The basal insulin from last night still covers the background all day, so you aren't left without insulin." : "Basal-bolus, as Dr. Fasinu teaches it: a long-acting basal insulin such as glargine once at night, whatever you eat, to mimic your own background insulin through the whole day (it lasts more than 24 hours); then a rapid-acting bolus before breakfast, lunch and dinner for each after-meal spike. Questions often ask which insulin to take before a big meal: the fast one.", st.nolunch ? "basal-bolus · no lunch" : "basal-bolus day"];
  var C = st.cl === "all" ? null : D.CL[st.cl];
  return [C ? C.sum : "Five speeds of insulin, as on his slide: rapid-acting (lispro, aspart, glulisine; Afrezza, inhaled, is the very rapid one), short-acting (regular), intermediate (NPH), long-acting (glargine, detemir) and ultra-long (degludec; glargine as Toujeo). Onset, peak and duration decide which one is the basal and which one is given as needed (PRN) for meals. Pick one to see the numbers he gave.", C ? C.ro : "all five"];
}
function inSet(st, k) { if (k === "cl") st.hr = { all: 24, r: 12, s: 12, n: 24, l: 48, u: 48 }[st.cl]; }

const D = {
  ANIM: true, ONSET: "inSet", INIT: { mode: "curves", cl: "all", hr: 24, nolunch: false },
  BASAL: 0.3, BOLUS: 0.55, OWN0: 0.3, OWNP: 0.42,
  CL: {
    r: { on: 0.15, pk: 1.25, end: 4, tp: 2, a: 1.85, H: 1, short: "rapid", lab: [1.4, 1.03, "start"],
      info: "Rapid-acting: lispro (Humalog), aspart (Novolog), glulisine (Apidra), modified to be absorbed and act faster than regular insulin. Onset 5-15 minutes and about 4 hours in all: the shortest duration of any insulin. Inhaled Afrezza, the very rapid one, acts within 1 to 2 minutes (not drawn).",
      sum: "Rapid-acting insulin: lispro (Humalog), aspart (Novolog), glulisine (Apidra); inhaled Afrezza, the very rapid one, acts within 1 to 2 minutes (its curve isn't drawn). Onset 5-15 minutes, about 4 hours in all: the shortest duration, so it's the one to inject just before a meal for the after-meal (postprandial) spike.", ro: "onset 5-15 min · ~4 h" },
    s: { on: 0.5, pk: 3, end: 8, tp: 3, a: 2.5, H: 0.8, short: "regular", lab: [3.3, 0.84, "start"],
      info: "Short-acting: regular insulin (Humulin R, Novolin R), human insulin, the oldest. It peaks around 3 hours and by 8 hours the effect is technically gone. Regular and NPH are sold without a prescription (from the pharmacist).",
      sum: "Short-acting: regular insulin (Humulin R, Novolin R), plain human insulin, the R on the box. It kind of peaks around 3 hours, and by 8 hours the effect is technically gone. Of the choices regular, NPH and glargine, regular is the one for a big meal. Regular and NPH can be bought without a prescription.", ro: "peak ~3 h · gone ~8 h" },
    n: { on: 2, pk: 7, end: 16, tp: 5, a: 2.6, H: 0.6, short: "NPH", lab: [7.4, 0.62, "start"],
      info: "Intermediate-acting: NPH (Humulin N, Novolin N), neutral protamine Hagedorn: protamine mixed with insulin slows its absorption from the injection site, which stretches its action. Onset 2-4 hours: far too slow to cover a meal.",
      sum: "Intermediate-acting: NPH (Humulin N, Novolin N), neutral protamine Hagedorn: a protein, protamine, mixed with the insulin slows its absorption and stretches its action. Its onset is 2-4 hours, so it can't cover a meal you're about to eat. Like regular, it's sold without a prescription.", ro: "onset 2-4 h" },
    l: { on: 1.5, rise: 3, flat: 1, end: 28, tp: 3.5, H: 0.36, short: "glargine", lab: [12, 0.42, "middle"],
      alt: { on: 1.5, rise: 4, flat: 1, end: 22, tp: 6, H: 0.27, short: "detemir", lab: [18, 0.08] },
      info: "Long-acting: glargine (Lantus, Basaglar) and detemir (Levemir), released slowly with no real peak. Glargine lasts more than 24 hours: one shot a day, at night, as the basal insulin.",
      sum: "Long-acting: glargine (Lantus, Basaglar) and detemir (Levemir). Released slowly, without a real peak, so the profile looks as if it goes on forever: glargine lasts more than 24 hours, one shot a day, at night. That's the basal insulin of a basal-bolus regimen. (Detemir is drawn shorter than glargine as a typical shape; he gave no number for it.)", ro: "glargine: > 24 h" },
    u: { on: 1, rise: 4, flat: 1, end: 46, tp: 4, H: 0.3, short: "degludec", lab: [33, 0.24, "middle"],
      info: "Ultra-long-acting: degludec (Tresiba), and glargine as Toujeo. Degludec may last more than 42 hours.",
      sum: "Ultra-long-acting: degludec (Tresiba) and glargine as Toujeo. Degludec may last more than 42 hours, the longest of all. Compare rapid-acting insulin's 4 hours: those duration numbers are what decide which insulin is the basal and which is taken as needed.", ro: "degludec: > 42 h" },
  },
  /* [from h, to h, label row, anchor, text]: only the numbers he gave */
  NUMS: {
    r: [[0.083, 0.25, 1, "start", "onset 5-15 min"], [4, 4, 2, "start", "about 4 h in all"]],
    s: [[3, 3, 1, "start", "peaks around 3 h"], [8, 8, 2, "start", "gone by about 8 h"]],
    n: [[2, 4, 1, "start", "onset 2-4 h"]],
    l: [[24, 24, 1, "end", "glargine: more than 24 h"]],
    u: [[42, 42, 1, "end", "degludec: more than 42 h"]],
  },
};

const CSS = `
.anima .insulins-svg .t{font-size:13px}
.anima .insulins-svg .t.s{font-size:12.5px}
.anima .insulins-svg .in-r,.anima .insulins-svg .in-s,.anima .insulins-svg .in-n,.anima .insulins-svg .in-l,.anima .insulins-svg .in-u{fill:none;stroke-width:2.6;stroke-linejoin:round}
.anima .insulins-svg .in-r{stroke:var(--bx-hot)}
.anima .insulins-svg .in-s{stroke:var(--bx-blue)}
.anima .insulins-svg .in-n{stroke:var(--bx-violet)}
.anima .insulins-svg .in-l{stroke:var(--bx-ins)}
.anima .insulins-svg .in-u{stroke:var(--bx-gold)}
.anima .insulins-svg .in-alt{stroke-width:1.6;stroke-dasharray:5 3}
.anima .insulins-svg .in-dim{opacity:.2}
.anima .insulins-svg .t.in-dimt{opacity:.35}
.anima .insulins-svg .in-hit{fill:none;stroke:transparent;stroke-width:12}
.anima .insulins-svg .in-fill-r{fill:var(--bx-hot);opacity:.16}
.anima .insulins-svg .in-fill-s{fill:var(--bx-blue);opacity:.14}
.anima .insulins-svg .in-fill-n{fill:var(--bx-violet);opacity:.14}
.anima .insulins-svg .in-fill-l{fill:var(--bx-ins);opacity:.16}
.anima .insulins-svg .in-fill-u{fill:var(--bx-gold);opacity:.18}
.anima .insulins-svg .t.in-tr{fill:var(--bx-hot)}
.anima .insulins-svg .t.in-ts{fill:var(--bx-blue)}
.anima .insulins-svg .t.in-tn{fill:var(--bx-violet)}
.anima .insulins-svg .t.in-tl{fill:var(--bx-ins)}
.anima .insulins-svg .t.in-tu{fill:var(--bx-gold)}
.anima .insulins-svg .t.in-towt{fill:var(--anatomy-muted)}
.anima .insulins-svg .in-own{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4;stroke-dasharray:4 4}
.anima .insulins-svg .in-band{opacity:.55}
.anima .insulins-svg .in-br{fill:var(--bx-hot)}.anima .insulins-svg .in-bs{fill:var(--bx-blue)}.anima .insulins-svg .in-bn{fill:var(--bx-violet)}.anima .insulins-svg .in-bl{fill:var(--bx-ins)}.anima .insulins-svg .in-bu{fill:var(--bx-gold)}
.anima .insulins-svg .in-lead{fill:none;stroke-width:1;stroke-dasharray:3 3}
.anima .insulins-svg .in-cur{stroke:var(--anatomy-mid);stroke-width:1;stroke-dasharray:2 3}
.anima .insulins-svg .in-curdot{fill:var(--surface);stroke:var(--anatomy-hi);stroke-width:1.6}
.anima .insulins-svg .in-dr{stroke:var(--bx-hot)}.anima .insulins-svg .in-ds{stroke:var(--bx-blue)}.anima .insulins-svg .in-dn{stroke:var(--bx-violet)}.anima .insulins-svg .in-dl{stroke:var(--bx-ins)}.anima .insulins-svg .in-du{stroke:var(--bx-gold)}
.anima .insulins-svg .in-meal{fill:var(--bx-glu-soft);stroke:var(--bx-glu);stroke-width:1.2}
.anima .insulins-svg .in-fork{stroke:var(--bx-glu);stroke-width:1.4;stroke-linecap:round}
.anima .insulins-svg .in-shot-r{fill:var(--bx-hot)}
.anima .insulins-svg .in-shot-l{fill:var(--bx-ins)}
.anima[data-anima="insulins"] .am-svg{max-width:560px}
.anima[data-anima="insulins"] .in-lbl{font:600 12px var(--font-mono);color:var(--ink-faint)}
.anima[data-anima="insulins"] .in-dayrow{display:none}
.anima[data-anima="insulins"]:has([data-amk="mode"][data-amv="day"][aria-pressed="true"]) .in-dayrow{display:flex}
.anima[data-anima="insulins"]:has([data-amk="mode"][data-amv="day"][aria-pressed="true"]) .in-currow{display:none}
`;

export default function () {
  return makeFig({ id: "insulins", lec: "dmpharm", fig: "Fig 2", short: "Insulin time-action", hint: "pick an insulin",
    title: "Insulin preparations: onset, peak and duration",
    caption: "The five speeds of insulin on Dr. Fasinu's slide, as relative effect over hours: pick one for the numbers he gave, or switch to a basal-bolus day with meals.",
    W: 480, H: 340, label: "Time-action curves of rapid, regular, NPH, long-acting and ultra-long-acting insulin over hours after the injection, or a day of basal and bolus insulin with meals.",
    D, render: inRender, say: inSay, helpers: [inF, inPath, inClock, inSet], css: CSS,
    controls: `<div class="am-controls" role="group" aria-label="View"><button type="button" class="am-btn" data-amk="mode" data-amv="curves">Time-action curves</button><button type="button" class="am-btn" data-amk="mode" data-amv="day">A basal-bolus day</button></div>
<div class="am-controls in-currow" role="group" aria-label="Insulin"><button type="button" class="am-btn" data-amk="cl" data-amv="all">All five</button><button type="button" class="am-btn" data-amk="cl" data-amv="r">Rapid</button><button type="button" class="am-btn" data-amk="cl" data-amv="s">Short (regular)</button><button type="button" class="am-btn" data-amk="cl" data-amv="n">Intermediate (NPH)</button><button type="button" class="am-btn" data-amk="cl" data-amv="l">Long</button><button type="button" class="am-btn" data-amk="cl" data-amv="u">Ultra-long</button></div>
<div class="am-controls in-currow" role="group" aria-label="Time axis"><span class="in-lbl">Hours shown:</span><button type="button" class="am-btn" data-amk="hr" data-amv="12">12</button><button type="button" class="am-btn" data-amk="hr" data-amv="24">24</button><button type="button" class="am-btn" data-amk="hr" data-amv="48">48</button></div>
<div class="am-controls in-dayrow" role="group" aria-label="Meals"><button type="button" class="am-btn" data-amt="nolunch" aria-pressed="false">Skip lunch</button></div>`,
    sources: [
      "From the L11 recording and slides (Dr. Fasinu): the five classes and their names (his insulin slide); rapid-acting onset 5-15 minutes and about 4 hours in all; regular peaking around 3 hours and gone by about 8; NPH onset 2-4 hours; glargine lasting more than 24 hours, once at night; degludec more than 42 hours; protamine slowing NPH's absorption; regular and NPH sold without a prescription; and the basal-bolus regimen (basal regardless of meals, a bolus as needed before each meal).",
      "Only his numbers are labeled. The unlabeled parts of each curve (rapid-acting's peak, regular's onset, NPH's peak and end, the long-acting onsets, detemir's shape) follow typical values in standard pharmacology references and are drawn as shapes only. Heights are relative effect, not doses, and the 'own pancreas' line and the day's timing are schematic. Educational, not medical advice.",
    ] });
}
