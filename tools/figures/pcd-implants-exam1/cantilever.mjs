// Fig: cantilevers are force magnifiers (L3 Biomechanics, Dr. Chavali). A bridge on two implants with a cantilevered
// pontic: the implant next to the pontic is the fulcrum. With the load at a distance c beyond it and the other implant
// d away, the fulcrum implant carries F(1 + c/d) and the far one F(c/d) (pulled the other way). At c = 2d a 25 lb bite
// becomes 75 lb and 50 lb, the notes' example. Toggle the fix: an implant under the pontic. Statics are exact; the
// drawing is schematic.
import { makeFig, f1, T, L, HOT, SCREW } from "./shared.mjs";

function caArrow(x, y0, y1, cls, w) { var dir = y1 > y0 ? 1 : -1; return '<path d="M' + f1(x) + " " + f1(y0) + "L" + f1(x) + " " + f1(y1 - dir * 10) + '" stroke="var(' + cls + ')" stroke-width="' + f1(w) + '" fill="none"/><path d="M' + f1(x - 8) + " " + f1(y1 - dir * 12) + "L" + f1(x) + " " + f1(y1) + "L" + f1(x + 8) + " " + f1(y1 - dir * 12) + 'Z" fill="var(' + cls + ')"/>'; }
function caRender(st, D) {
  var o = "", F = 25, B = 196, xb = 150, xa = 290, d = xa - xb, r = st.r, xp = xa + r * d, fixd = st.fix;
  var fa = fixd ? 0 : F * (1 + r), fb = fixd ? 0 : F * r;
  o += HOT("Bone. Bone tolerates compression best and shear worst.", '<path class="cort" d="M10 ' + B + 'H630V330H10Z"/><path class="trab" d="M22 ' + (B + 12) + 'H618V330H22Z"/>');
  o += '<path class="gum" d="M10 ' + (B - 22) + 'H630V' + B + 'H10Z"/>';
  o += HOT("The far implant: it is pulled the other way (tension), a load bone and the screw tolerate poorly.", SCREW(xb, B, 50, 100, 6));
  o += HOT("The implant next to the pontic is the fulcrum: it carries the bite plus the leverage.", SCREW(xa, B, 50, 100, 6));
  if (fixd) o += HOT("The fix: another implant under the pontic (three implants for five units), or two separate bridges.", SCREW(xp, B, 50, 100, 6));
  /* the bridge, unit by unit: crowns over the implants, pontics between and beyond, joined at the connectors */
  var n = Math.max(3, Math.round((xp - xb) / 70) + 1), uw = (xp - xb) / (n - 1), top = B - 92, bot = B - 26, i, d1 = "M" + f1(xb - uw / 2 + 4) + " " + (bot - 8);
  for (i = 0; i < n; i++) { var l = xb + (i - 0.5) * uw, rr = xb + (i + 0.5) * uw, c0 = xb + i * uw; d1 += (i ? "Q" + f1(l) + " " + (top + 16) + " " + f1(l + 6) + " " + (top + 8) : "L" + f1(l) + " " + (top + 14) + "Q" + f1(l) + " " + top + " " + f1(l + 12) + " " + top) + "Q" + f1(c0 - uw * 0.2) + " " + (top - 6) + " " + f1(c0) + " " + (top + 4) + "Q" + f1(c0 + uw * 0.2) + " " + (top - 6) + " " + f1(rr - (i === n - 1 ? 12 : 6)) + " " + (top + (i === n - 1 ? 0 : 8)); }
  d1 += "Q" + f1(xp + uw / 2) + " " + top + " " + f1(xp + uw / 2) + " " + (top + 14) + "L" + f1(xp + uw / 2 - 4) + " " + (bot - 8);
  for (i = n - 1; i >= 0; i--) { var l2 = xb + (i - 0.5) * uw, c2 = xb + i * uw; d1 += "Q" + f1(c2 + uw * 0.3) + " " + (bot + 2) + " " + f1(c2) + " " + bot + "Q" + f1(c2 - uw * 0.3) + " " + (bot + 2) + " " + f1(i ? l2 : l2 + 4) + " " + (i ? bot - 22 : bot - 8); }
  o += HOT("The bridge: crowns on the two implants, a pontic between them and cantilevered pontics beyond the last one.", '<path class="crown" d="' + d1 + 'Z"/>');
  [xb, xa].concat(fixd ? [xp] : []).forEach(function (x) { o += '<path class="ti-hi" d="M' + (x - 14) + " " + B + "L" + (x + 14) + " " + B + "L" + (x + 18) + " " + (B - 26) + "L" + (x - 18) + " " + (B - 26) + 'Z"/>'; });
  /* the bite */
  o += caArrow(xp, B - 170, B - 96, "--im-hot", 4) + T(xp, B - 176, "bite " + F + " lb", "hot-t", "middle");
  if (!fixd) {
    var la = Math.min(70, fa * 0.8), lb = Math.min(70, fb * 0.8);
    o += caArrow(xa + 46, B + 14, B + 14 + la, "--im-bad", 2 + fa / 14) + T(xa + 58, B + 30, f1(fa) + " lb", "bad", "start") + T(xa + 58, B + 46, "fulcrum, pushed in", "s mut", "start");
    if (fb > 0) o += caArrow(xb - 46, B + 14 + lb, B + 14, "--im-ti-line", 2 + fb / 14) + T(xb - 58, B + 30, f1(fb) + " lb", "b", "end") + T(xb - 58, B + 46, "pulled out", "s mut", "end");
    o += '<path class="dim" d="M' + xb + " " + (B - 120) + "H" + xa + '"/>' + T((xa + xb) / 2, B - 126, "d", "hot-t s", "middle");
    if (r > 0) o += '<path class="dim" d="M' + xa + " " + (B - 120) + "H" + f1(xp) + '"/>' + T((xa + xp) / 2, B - 126, "c = " + r + " d", "hot-t s", "middle");
  } else o += T(xp - 40, B + 120, "no lever: the bite goes straight down", "ok s", "end");
  return o;
}
function caSay(st) {
  if (st.fix) return ["With an implant under the pontic there's no cantilever: the bite goes down the implant under it and there's no lever. Always avoid cantilevering an implant prosthesis (the one exception Dr. Chavali allowed: an opposing denture).", "no cantilever"];
  var F = 25, fa = F * (1 + st.r), fb = F * st.r;
  if (st.r === 0) return ["With the bite right over the last implant there's no cantilever: that implant carries the " + F + " lb and the other one nothing. Slide the pontic out and the load on both grows: moment of force = force x distance.", F + " lb, no lever"];
  return ["Moment of force = force x distance. With the pontic " + st.r + " times the implant spacing beyond the last implant, a " + F + " lb bite puts " + fa + " lb on the fulcrum implant and " + fb + " lb on the other one, pulling it the other way." + (st.r === 2 ? " That's the lecture's example: 25 lb becomes 75 lb and 50 lb." : ""), f1(fa) + " lb on the fulcrum"];
}
export function cantilever() {
  return makeFig({ id: "cantilever", lec: "biomech", fig: "Fig 3", short: "Cantilever", hint: "drag the pontic · try the fix",
    title: "A cantilever multiplies the force",
    caption: "Moment = force x distance. Slide the pontic farther out and watch a 25 lb bite grow on the implants; then add an implant under it.",
    W: 640, H: 380, label: "A bridge on two implants with a cantilevered pontic, and the forces on each implant.",
    D: { INIT: { r: 2, fix: false } }, render: caRender, say: caSay, helpers: [caArrow],
    controls: `<div class="am-controls"><label class="am-slider"><span>no cantilever</span><input type="range" min="0" max="2" step="0.25" value="2" data-amk="r" aria-label="Cantilever length as a multiple of the implant spacing"><span>2 x spacing</span></label><button type="button" class="am-btn" data-amt="fix">Add an implant under the pontic</button></div>`,
    sources: ["From the L3 notes (Dr. Chavali): cantilevers are force magnifiers, moment of force = force x distance; 25 lb on a cantilevered pontic became 75 lb on the fulcrum implant and 50 lb on the other; the fix is another implant under the pontic or two separate bridges; the exception is an opposing denture.", "The forces come from simple statics (a rigid bridge on two supports), which gives the lecture's numbers at a cantilever twice the implant spacing. The drawing's lengths are schematic."] });
}
