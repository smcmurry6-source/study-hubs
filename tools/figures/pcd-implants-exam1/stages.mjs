// Fig: one-stage vs two-stage surgery (L2 Introduction and L5 Prefabricated abutments, Dr. Chavali). Two-stage
// (Brånemark, 1985): cover screw, flap closed, submerged 3-6 months, then a second surgery for a healing abutment.
// One-stage (Schroeder, 1996): a healing abutment at placement, transmucosal healing for 3-4 months, no second surgery.
// Either way the soft tissue needs at least 3 weeks around the healing abutment before the final impression.
import { makeFig, f1, T, L, HOT, SCREW } from "./shared.mjs";

function sgRender(st, D) {
  var o = "", two = st.mode === "two", s = st.step, cx = 320, B = 220, G = B - 46;
  o += HOT("Bone of the ridge.", '<path class="cort" d="M10 ' + B + 'Q320 ' + (B - 16) + ' 630 ' + B + 'V370H10Z"/><path class="trab" d="M24 ' + (B + 14) + 'Q320 ' + (B - 2) + ' 616 ' + (B + 14) + 'V370H24Z"/>');
  var open = two ? s === 0 || s === 2 : s === 0;
  /* mucosa: split as a flap when open */
  if (open) o += HOT("The flap is reflected to reach the bone.", '<path class="gum" d="M10 ' + G + "Q150 " + (G - 6) + " 262 " + (G + 4) + "L250 " + (B - 10) + "Q150 " + (B - 4) + " 10 " + B + 'Z"/><path class="gum" d="M630 ' + G + "Q490 " + (G - 6) + " 378 " + (G + 4) + "L390 " + (B - 10) + "Q490 " + (B - 4) + " 630 " + B + 'Z"/>');
  else {
    var hole = !(two && s === 1);
    o += HOT(hole ? "The mucosa heals around the healing abutment (transmucosal): the implant is open to the mouth." : "The flap is closed over the implant: it is submerged, isolated from the mouth.", '<path class="gum" d="M10 ' + G + "Q320 " + (G - 18) + " 630 " + G + "V" + B + "Q320 " + (B - 16) + " 10 " + B + 'Z"/>' + (hole ? '<path d="M' + (cx - 26) + " " + (G - 14) + "H" + (cx + 26) + "V" + (B - 14) + "H" + (cx - 26) + 'Z" fill="var(--surface)"/>' : ""));
    if (!hole) o += '<path d="M' + (cx - 40) + " " + (G - 12) + "l10 -6M" + (cx - 10) + " " + (G - 14) + "l10 -6M" + (cx + 20) + " " + (G - 14) + 'l10 -6" stroke="var(--anatomy-mid)" stroke-width="1.4"/>' + T(cx + 60, G - 24, "sutured", "s mut");
  }
  o += HOT("The implant in its osteotomy.", SCREW(cx, B - 14, 54, 140, 8));
  var cover = two && s <= 1, heal = (two && s === 2) || (!two && s <= 2), final = s === 3;
  if (cover) o += HOT("Cover screw: short and hidden under the soft tissue, used at the first stage of two-stage surgery, for example when the implant isn't stable enough to be exposed to the tongue and food.", '<path class="ti-hi" d="M' + (cx - 26) + " " + (B - 14) + "H" + (cx + 26) + "V" + (B - 22) + "Q" + cx + " " + (B - 28) + " " + (cx - 26) + " " + (B - 22) + 'Z"/>') + L(470, B - 58, "cover screw", cx + 24, B - 20, "start");
  if (heal) o += HOT("Healing abutment: taller and not covered by tissue; it comes in different heights and widths.", '<path class="ti-hi" d="M' + (cx - 22) + " " + (B - 14) + "L" + (cx - 26) + " " + (G - 18) + "H" + (cx + 26) + "L" + (cx + 22) + " " + (B - 14) + 'Z"/>') + L(470, G - 40, "healing abutment", cx + 26, G - 14, "start");
  if (final) o += HOT("Final abutment and crown, after the soft tissue has healed for at least 3 weeks around the healing abutment and the final impression is made.", '<path class="ti-hi" d="M' + (cx - 20) + " " + (B - 14) + "L" + (cx - 24) + " " + (G - 4) + "H" + (cx + 24) + "L" + (cx + 20) + " " + (B - 14) + 'Z"/><path class="crown" d="M' + (cx - 48) + " " + (G - 4) + "L" + (cx - 54) + " 70Q" + cx + " 50 " + (cx + 54) + " 70L" + (cx + 48) + " " + (G - 4) + 'Z"/>') + L(470, 90, "final crown", cx + 50, 90, "start");
  var lab = two ? ["Surgery 1: place the implant, cover screw", "Submerged 3-6 months", "Surgery 2: uncover, healing abutment", "Restore"][s] : ["Surgery: implant + healing abutment", "Transmucosal healing 3-4 months", "No second surgery", "Restore"][s];
  o += T(cx, 30, lab, "b", "middle");
  return o;
}
function sgSay(st) {
  var two = st.mode === "two", s = st.step;
  var A = ["Two-stage (Brånemark, 1985): open a flap, place the implant, put on a cover screw and close everything.", "The implant is submerged, isolated from the mouth, for 3-6 months. Choose two-stage when healing is a concern (a diabetic patient: close it and let it heal in a sterile environment).", "A second surgery reopens the flap, removes the cover screw and places a healing abutment; the tissue is sutured around it, so the implant is now open (patent) to the mouth.", "The soft tissue needs at least 3 weeks to heal around the healing abutment before the final impression, then the final abutment and crown."];
  var B = ["One-stage (Schroeder, 1996): non-submerged; a healing abutment goes on at placement, so the implant sticks out into the mouth from day one.", "Transmucosal healing, with a shorter healing period of 3-4 months.", "No second surgery. One-stage suits a young, healthy patient with good hygiene, good primary stability and good keratinized mucosa.", "The soft tissue needs at least 3 weeks around the healing abutment before the final impression, then the final abutment and crown."];
  return [(two ? A : B)[s], (two ? "two-stage" : "one-stage") + " · " + (s + 1) + "/4"];
}
export function stages() {
  return makeFig({ id: "stages", lec: "intro", fig: "Fig 2", short: "One vs two stage", hint: "step through · switch",
    title: "One-stage vs two-stage surgery",
    caption: "Cover screw or healing abutment, submerged or open to the mouth, one surgery or two. Step through each technique.",
    W: 640, H: 380, label: "An implant in the ridge through the stages of one-stage and two-stage surgery.",
    D: { INIT: { mode: "two", step: 0 }, STEPKEY: "step", STEPMAX: 3, onSet: null }, render: sgRender, say: sgSay,
    controls: `<div class="am-controls" role="group" aria-label="Technique"><button type="button" class="am-btn" data-amk="mode" data-amv="two">Two-stage</button><button type="button" class="am-btn" data-amk="mode" data-amv="one">One-stage</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: ["From the L2 notes (Dr. Chavali): two-stage (Brånemark 1985, cover screw, submerged 3-6 months, second surgery) and one-stage (Schroeder 1996, healing abutment at placement, 3-4 months, no second surgery), at least 3 weeks of soft tissue healing before the final impression, and when to choose each. From the L4 and L5 notes: what a cover screw and a healing abutment are.", "Schematic: the implant, abutment and crown shapes are not to scale."] });
}
