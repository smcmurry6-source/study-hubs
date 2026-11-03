// Fig: primary, secondary and total stability over the first weeks (L4 Terminology, Dr. Chen; L2, Dr. Chavali).
// Schematic curves: the notes give the shape (primary falls from about day 7 as osteoclasts resorb the bone edges,
// secondary rises as woven bone forms, the sum dips weeks after placement, secondary osseointegration from about 4-6
// weeks) and no numbers, so the y axis has none. A thread inset shows the bone-implant interface at the same moment.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

function stPrim(w) { return w <= 1 ? 1 : Math.exp(-(w - 1) / 2.2); }
function stSec(w) { return 1 / (1 + Math.exp(-(w - 4.6) / 1.05)) - 1 / (1 + Math.exp(4.6 / 1.05)); }
function stRender(st, D) {
  var o = "", X0 = 60, X1 = 420, Y0 = 300, Y1 = 60, wmax = 12;
  function X(w) { return X0 + (X1 - X0) * w / wmax; } function Y(v) { return Y0 - (Y0 - Y1) * v / 1.25; }
  o += '<path class="axis" d="M' + X0 + " " + Y1 + "V" + Y0 + "H" + X1 + '"/>';
  for (var w = 0; w <= 12; w += 2) o += '<path class="grid" d="M' + f1(X(w)) + " " + Y1 + "V" + Y0 + '"/>' + T(X(w), Y0 + 16, String(w), "s mut", "middle");
  o += T((X0 + X1) / 2, Y0 + 32, "weeks after placement", "s", "middle") + T(X0, Y1 - 10, "stability", "s mut", "start");
  function path(fn) { var d = ""; for (var w2 = 0; w2 <= wmax + 1e-6; w2 += 0.1) d += (d ? "L" : "M") + f1(X(w2)) + " " + f1(Y(fn(w2))); return d; }
  o += HOT("Primary stability: the mechanical lock of an implant slightly wider than the last drill, measured as insertion torque (Ncm). It falls as the bone at the osteotomy edges is resorbed.", '<path d="' + path(D.stPrim) + '" fill="none" stroke="var(--im-ti-line)" stroke-width="2.2" stroke-dasharray="6 4"/>');
  o += HOT("Secondary stability: new (woven, then lamellar) bone laid down on the implant. This is osseointegration proper.", '<path d="' + path(D.stSec) + '" fill="none" stroke="var(--im-ok)" stroke-width="2.2"/>');
  o += HOT("Total stability = primary + secondary. The dip comes weeks after placement; exactly when depends on the brand and its surface treatment.", '<path d="' + path(function (x) { return D.stPrim(x) + D.stSec(x); }) + '" fill="none" stroke="var(--im-hot)" stroke-width="3"/>');
  o += T(X(0.3), Y(1.06) - 6, "total", "hot-t s") + T(X(9.3), Y(D.stSec(9.3)) + 16, "secondary", "ok s") + T(X(5.4), Y(D.stPrim(5.4)) + 14, "primary", "s");
  var wk = st.wk, p = D.stPrim(wk), s = D.stSec(wk);
  o += '<path class="lead" d="M' + f1(X(wk)) + " " + Y1 + "V" + Y0 + '"/><circle cx="' + f1(X(wk)) + '" cy="' + f1(Y(p + s)) + '" r="5" fill="var(--im-hot)"/><circle cx="' + f1(X(wk)) + '" cy="' + f1(Y(p)) + '" r="4" fill="var(--im-ti-line)"/><circle cx="' + f1(X(wk)) + '" cy="' + f1(Y(s)) + '" r="4" fill="var(--im-ok)"/>';
  /* inset: one thread against the bone */
  var ix = 450, iy = 70, iw = 170, ih = 200, gap = (1 - p) * (1 - Math.min(1, s * 1.2)) * 18, wov = Math.min(1, s * 1.1);
  o += '<rect x="' + ix + '" y="' + iy + '" width="' + iw + '" height="' + ih + '" rx="10" fill="var(--anatomy-shade-3)" stroke="var(--line)"/>';
  o += T(ix + iw / 2, iy - 8, "the interface, magnified", "s mut", "middle");
  var tx = ix + 58, d = "M" + ix + " " + iy;
  for (var k = 0; k < 5; k++) { var y = iy + 10 + k * 38; d += "L" + (ix) + " " + y + "L" + tx + " " + (y + 8) + "L" + tx + " " + (y + 22) + "L" + ix + " " + (y + 30); }
  d += "L" + ix + " " + (iy + ih) + "Z";
  o += HOT("Titanium threads (schematic). The implant is slightly wider than the last drill, so at placement the threads press into the bone.", '<path class="ti" d="' + d + '"/>');
  var bd = "M" + (ix + iw) + " " + iy + "L" + f1(ix + gap) + " " + iy;
  for (var k2 = 0; k2 < 5; k2++) { var y2 = iy + 10 + k2 * 38; bd += "L" + f1(ix + gap) + " " + y2 + "L" + f1(tx + gap) + " " + (y2 + 8) + "L" + f1(tx + gap) + " " + (y2 + 22) + "L" + f1(ix + gap) + " " + (y2 + 30); }
  bd += "L" + f1(ix + gap) + " " + (iy + ih) + "L" + (ix + iw) + " " + (iy + ih) + "Z";
  o += HOT("Bone at the osteotomy. From about day 7 osteoclasts resorb its edges (primary stability drops) while woven bone forms on the implant (secondary rises).", '<path class="trab" d="' + bd + '"/>');
  if (wov > 0.05) { for (var k3 = 0; k3 < 5; k3++) { var y3 = iy + 14 + k3 * 38; o += '<path d="M' + f1(tx + 3) + " " + (y3 + 4) + "L" + f1(tx + 3 + gap * wov) + " " + (y3 + 4) + "L" + f1(tx + 3 + gap * wov) + " " + (y3 + 22) + "L" + f1(tx + 3) + " " + (y3 + 22) + 'Z" fill="var(--im-ok)" opacity="' + f1(0.25 + 0.5 * wov) + '"/>'; } }
  return o;
}
function stSay(st) {
  var w = st.wk, s;
  if (w < 1) s = "Placement: the implant is slightly wider than the last drill and bone is a little elastic, so it locks in mechanically, like a screw in a wall. That is primary stability, measured as insertion torque in Ncm.";
  else if (w < 4) s = "From about day 7, osteoclasts resorb the bone edges and primary stability drops, while woven bone forms on the implant and secondary stability rises. Their sum dips: the stability dip, weeks after placement (exactly when depends on the brand and surface).";
  else if (w < 6.5) s = "Secondary osseointegration, the bone remodeling phase, starts about 4-6 weeks after initial healing and is the critical factor for long-term success. Be cautious about touching the implant until total stability recovers.";
  else s = "New bone now holds the implant, and remodeling continues after it is loaded. Dr. Chen said he is comfortable at about 6-8 weeks but follows the surgeon, who may say 3 months; the clinic's traditional wait is about 4 months in the mandible and 6 in the maxilla.";
  return [s, "week " + w];
}
export function stability() {
  return makeFig({ id: "stability", lec: "terms", fig: "Fig 4", short: "The stability dip", hint: "drag the weeks · hover a curve",
    title: "Primary, secondary and total stability",
    caption: "Why an implant is least stable a few weeks after it goes in: primary stability falls as secondary rises. Drag through the weeks and watch the interface.",
    W: 640, H: 340, label: "Curves of primary, secondary and total implant stability over 12 weeks, with an inset of the thread-bone interface.",
    D: { INIT: { wk: 0 } }, render: stRender, say: stSay, helpers: [stPrim, stSec],
    controls: `<div class="am-controls"><label class="am-slider"><span>week 0</span><input type="range" min="0" max="12" step="0.5" value="0" data-amk="wk" aria-label="Weeks after placement"><span>week 12</span></label></div>`,
    sources: ["From the L4 notes (Dr. Chen): primary + secondary = total stability, the dip weeks after placement depending on brand and surface, 6-8 weeks vs the surgeon's call. From the L2 notes (Dr. Chavali): day 7, osteoclasts and woven bone; secondary osseointegration from about 4-6 weeks; 4 and 6 months as the clinic's traditional wait.", "The curves are schematic: the lectures gave their shape, not values, so the axis has no numbers."] });
}
