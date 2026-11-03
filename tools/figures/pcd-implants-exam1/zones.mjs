// Fig: the emergence profile and its E, B and C zones (L4 Terminology, Dr. Chen). One side of an implant restoration
// from the platform up to the soft tissue margin: C zone, the first 1-1.5 mm, straight; B zone, concave preferred (the
// "running room"); E zone at the margin, the critical contour, convex most of the time. Make the E zone more concave
// and the margin creeps coronally; more convex and it moves apically. Drawn at 18 px per mm; how far the margin moves is
// schematic.
import { makeFig, f1, T, L, DIM, HOT, SCREW } from "./shared.mjs";

const MM = 18;
function zoRender(st, D) {
  var o = "", mm = D.MM, P = 300, cx = 320, hw = 2 * mm, c = st.e; /* c: -1 concave .. +1 convex */
  var cTop = P - 1.25 * mm, bTop = P - 2.6 * mm, eTop = P - 3.8 * mm, margin = eTop + c * 12, bulge = c * 16;
  var xC = hw, xB = hw + 0.9 * mm, xE = hw + 2.6 * mm;
  /* one side's contour from the platform edge up to the margin, as offsets from the center; the other side mirrors it */
  function side(sg) { return "L" + f1(cx + sg * xC) + " " + f1(cTop) + "Q" + f1(cx + sg * (xC + 2)) + " " + f1(bTop + 6) + " " + f1(cx + sg * xB) + " " + f1(bTop) + "Q" + f1(cx + sg * ((xB + xE) / 2 + bulge)) + " " + f1((bTop + eTop) / 2 - bulge * 0.5) + " " + f1(cx + sg * xE) + " " + f1(eTop - 6); }
  function back(sg) { return "L" + f1(cx + sg * xE) + " " + f1(eTop - 6) + "Q" + f1(cx + sg * ((xB + xE) / 2 + bulge)) + " " + f1((bTop + eTop) / 2 - bulge * 0.5) + " " + f1(cx + sg * xB) + " " + f1(bTop) + "Q" + f1(cx + sg * (xC + 2)) + " " + f1(bTop + 6) + " " + f1(cx + sg * xC) + " " + f1(cTop) + "L" + f1(cx + sg * xC) + " " + P; }
  o += HOT("Bone around the implant.", '<path class="cort" d="M10 ' + (P + 4) + 'H630V380H10Z"/>');
  o += HOT("The implant; its platform is where the emergence profile starts.", SCREW(cx, P, 2 * hw, 76, 6));
  /* soft tissue on both sides, its edge following the restoration and its top at the margin */
  [-1, 1].forEach(function (sg) {
    var outer = sg > 0 ? 630 : 10;
    o += HOT("Peri-implant soft tissue. Its margin follows the E zone: more concave, it creeps coronally; more convex, it is pushed apically.", '<path class="gum" d="M' + outer + " " + f1(margin - 6) + "Q" + f1(cx + sg * (xE + 40)) + " " + f1(margin - 6) + " " + f1(cx + sg * (xE + 1)) + " " + f1(margin) + back(sg) + "L" + outer + " " + P + 'Z"/>');
  });
  o += HOT("The restoration (abutment and crown) shapes the soft tissue between the platform and the margin: that contour is the emergence profile.", '<path class="crown" d="M' + f1(cx - xC) + " " + P + "L" + f1(cx + xC) + " " + P + side(1) + "L" + f1(cx + xE + 8) + " 70L" + f1(cx - xE - 8) + " 70" + back(-1) + 'Z"/>');
  /* zone brackets on the left */
  var bx = 120;
  function zb(y0, y1, s, info) { return HOT(info, '<path class="hotline" d="M' + bx + " " + f1(y0) + "L" + (bx - 6) + " " + f1(y0) + "L" + (bx - 6) + " " + f1(y1) + "L" + bx + " " + f1(y1) + '"/>' + T(bx - 12, (y0 + y1) / 2 + 4, s, "hot-t", "end") + '<path class="lead" d="M' + (bx + 2) + " " + f1(y0) + "H" + f1(cx - xE - 10) + '" stroke-dasharray="2 4" opacity=".5"/>'); }
  o += zb(cTop, P, "C zone", "C zone: the first 1-1.5 mm from the platform, kept straight, for the connective tissue's blood supply and for bone remodeling. Set by the abutment.");
  o += zb(bTop, cTop, "B zone", "B zone: between C and E; variable, but concave is preferred, to keep tissue volume. The 'running room'.");
  o += zb(eTop - 6, bTop, "E zone", "E zone: at the soft tissue margin, the critical contour, convex most of the time. Other authors call B and C together the subcritical contour (straight to concave).");
  o += '<path class="lead" d="M' + f1(cx + xE + 2) + " " + f1(margin) + "H630" + '" stroke-dasharray="4 3"/>' + T(620, margin - 12, "soft tissue margin", "s", "end");
  o += L(560, P + 40, "platform", cx + xC, P, "end");
  return o;
}
function zoSay(st) {
  var c = st.e, s = "Starting at the platform: C zone straight, B zone concave, E zone at the margin. ";
  if (c < -0.2) s += "A more concave E zone (and even B zone) lets the margin creep down (coronally): use it to gain tissue, or when the implant is placed more buccally.";
  else if (c > 0.2) s += "A more convex E zone pushes the margin up (apically): use it when the margin is too low, or when the implant is more lingual.";
  else s += "This E zone is near neutral; drag it toward concave or convex to see the margin move.";
  return [s, c < -0.2 ? "margin moves coronally" : c > 0.2 ? "margin moves apically" : "neutral"];
}
export function zones() {
  return makeFig({ id: "zones", lec: "terms", fig: "Fig 5", short: "Emergence profile", hint: "shape the E zone · hover a zone",
    title: "The emergence profile: E, B and C zones",
    caption: "The contour between the implant platform and the soft tissue margin, zone by zone. Make the E zone concave or convex and watch the margin move.",
    W: 640, H: 380, label: "One side of an implant restoration with the C, B and E zones marked and the soft tissue margin.",
    D: { MM, INIT: { e: 0.6 } }, render: zoRender, say: zoSay,
    controls: `<div class="am-controls"><label class="am-slider"><span>concave</span><input type="range" min="-1" max="1" step="0.1" value="0.6" data-amk="e" aria-label="E zone contour, concave to convex"><span>convex</span></label></div>`,
    sources: ["From the L4 notes (Dr. Chen), 'Emergence profile and the E, B and C zones': C zone first 1-1.5 mm, straight; B zone concave preferred; E zone the critical contour, convex most of the time; concave moves the margin coronally (or for a buccal implant), convex apically (or for a lingual implant).", "One side of the restoration, at 18 px per mm for the zone heights; how far the margin moves is schematic. In the drawing coronal is up."] });
}
