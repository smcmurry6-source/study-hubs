// Fig: screw-retained or cement-retained? (L5 Prefabricated abutments, Dr. Chavali; L4 Terminology for the 7 mm
// count). Drag the interocclusal clearance checked on the mounted casts: 5 mm or less, screw-retained is the only
// choice; above 5 mm either works, unless the implant emerges so far facially that the access hole would show, and then
// cement-retained. Drawn at 14 px per mm; the crown and abutment shapes are schematic.
import { makeFig, f1, T, L, DIM, HOT, SCREW } from "./shared.mjs";

const MM = 14;
function reRender(st, D) {
  var o = "", mm = D.MM, sp = st.sp, fac = st.fac, cx = 300, P = 250, G = P - 3 * mm, opp = G - sp * mm;
  var screw = sp <= 5 || !fac ? (sp <= 5 ? "must" : "either") : "cement";
  o += HOT("Bone.", '<path class="cort" d="M10 ' + (P + 6) + 'H630V380H10Z"/>');
  o += '<path class="gum" d="M10 ' + G + 'H630V' + (P + 6) + 'H10Z"/>';
  o += '<g transform="rotate(' + (fac ? -14 : 0) + " " + cx + " " + (P + 60) + ')">' + HOT(fac ? "The implant emerges toward the facial: a screw channel would exit through the facial or buccal and show." : "The implant along the long axis: a screw channel would exit through the occlusal surface.", SCREW(cx, P, 56, 110, 8)) + (screw !== "cement" ? '<path d="M' + cx + " " + P + "V" + f1(opp + 4) + '" stroke="var(--im-hot)" stroke-width="3" stroke-dasharray="5 3"/>' : "") + "</g>";
  /* restoration between the tissue and the opposing tooth */
  var ch = opp + 4;
  o += HOT(screw === "cement" ? "Cement-retained: screw in the abutment, cement the crown. Often more esthetic when the implant emerges facially, but cement left behind raises the peri-implantitis risk." : "Screw-retained: abutment and crown are one unit, screwed in through a hole in the crown. No cement, so no cement-related peri-implantitis risk.", '<path class="crown" d="M' + (cx - 30) + " " + G + "L" + (cx - 52) + " " + f1(ch + 10) + "Q" + cx + " " + f1(ch - 4) + " " + (cx + 52) + " " + f1(ch + 10) + "L" + (cx + 30) + " " + G + 'Z"/>');
  o += HOT("The opposing tooth.", '<path class="enamel" d="M' + (cx - 60) + " 20L" + (cx - 60) + " " + f1(opp - 6) + "Q" + cx + " " + f1(opp + 6) + " " + (cx + 60) + " " + f1(opp - 6) + "L" + (cx + 60) + ' 20Z"/>');
  o += DIM(cx + 110, opp, cx + 110, G, sp + " mm", cx + 118, (opp + G) / 2 + 4, "start");
  o += T(cx + 118, (opp + G) / 2 + 20, "clearance on the casts", "s mut", "start");
  var verdict = screw === "must" ? ["Screw-retained: you have no choice", "bad"] : screw === "cement" ? ["Cement-retained: the hole would show", "hot-t"] : ["Either: screw or cement", "ok"];
  o += T(560, 40, verdict[0], verdict[1], "end");
  return o;
}
function reSay(st) {
  var sp = st.sp;
  if (sp <= 5) return ["'This is an exam question': with " + sp + " mm of interocclusal space (5 mm or less) you must do screw-retained; a cement-retained crown needs a minimum of 5 mm of clearance.", "screw-retained"];
  if (st.fac) return ["Above 5 mm either would fit, but this implant emerges so far facially that a screw access hole would come through the facial or buccal and show, so you must use cement-retained (on an angled or custom abutment).", "cement-retained"];
  return ["Above 5 mm you can do either. Screw-retained has no cement, so no cement-related peri-implantitis risk; cement-retained is often more esthetic. (The terminology lecture's 7 mm counts from the bone, including about 3 mm of biologic width; Dr. Chavali's 5 mm is checked on the mounted casts.)", "either"];
}
export function retention() {
  return makeFig({ id: "retention", lec: "prefab", fig: "Fig 1", short: "Screw or cement?", hint: "drag the clearance · tilt the implant",
    title: "Screw-retained or cement-retained?",
    caption: "Dr. Chavali's exam rule in one drawing: drag the interocclusal clearance, then tilt the implant toward the facial.",
    W: 640, H: 380, label: "An implant crown under an opposing tooth with the interocclusal clearance marked.",
    D: { MM, INIT: { sp: 4, fac: false } }, render: reRender, say: reSay,
    controls: `<div class="am-controls"><label class="am-slider"><span>3 mm</span><input type="range" min="3" max="10" step="0.5" value="4" data-amk="sp" aria-label="Interocclusal clearance in mm"><span>10 mm</span></label><button type="button" class="am-btn" data-amt="fac">Implant emerges facially</button></div>`,
    sources: ["From the L5 notes (Dr. Chavali): 5 mm or less, screw-retained, 'you have no choice'; above 5 mm either, unless the access hole would show, then cement-retained; peri-implantitis risk much higher with cement; a cement-retained crown needs at least 5 mm. From the L4 notes: the 7 mm count from the bone.", "Drawn at 14 px per mm for the clearance; the crown and implant are schematic."] });
}
