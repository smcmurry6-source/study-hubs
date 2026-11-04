// Fig: one-stage vs two-stage surgery (L2 Introduction and L5 Prefabricated abutments, Dr. Chavali). Two-stage
// (Brånemark, 1985): cover screw, flap closed, submerged 3-6 months, then a second surgery for a healing abutment.
// One-stage (Schroeder, 1996): a healing abutment at placement, transmucosal healing for 3-4 months, no second surgery.
// Either way the soft tissue needs at least 3 weeks around the healing abutment before the final impression.
import { makeFig, f1, T, L, HOT, SCREW } from "./shared.mjs";

function sgRender(st, D) {
  var o = "", two = st.mode === "two", s = st.step, cx = 320, B = 220, P = B - 9, G = B - 46, i;
  o += HOT("Bone of the ridge.", '<path class="trab" d="M10 ' + B + 'Q320 ' + (B - 16) + ' 630 ' + B + 'V370H10Z"/><path d="M10 ' + B + 'Q320 ' + (B - 16) + ' 630 ' + B + '" fill="none" stroke="var(--im-cort-line)" stroke-width="5" opacity=".55"/>');
  /* what goes through the mucosa: nothing (cover screw), a healing abutment, or the final abutment and crown */
  var cover = two && s <= 1, heal = (two && s === 2) || (!two && s <= 2), final = s === 3;
  var tm = heal ? [[22, P], [27, G - 16]] : final ? [[20, P], [25, G + 8], [33, G - 2]] : null;
  var open = s === 0, closed = cover && s === 1;
  if (open) {
    /* a full-thickness flap reflected on each side: lifted off the bone, its edge turned back */
    [-1, 1].forEach(function (sg) {
      var e = cx + sg * 70, far = sg < 0 ? 10 : 630;
      o += HOT("The flap, reflected (lifted off the bone) to reach the ridge.", '<path class="gum" d="M' + far + " " + G + "Q" + f1((far + e) / 2) + " " + (G - 8) + " " + f1(e + sg * 14) + " " + (G - 30) + "Q" + f1(e - sg * 4) + " " + (G - 40) + " " + f1(e - sg * 6) + " " + (G - 26) + "Q" + f1(e + sg * 10) + " " + (G + 4) + " " + f1(e + sg * 46) + " " + (B - 6) + "Q" + f1((far + e) / 2) + " " + (B - 2) + " " + far + " " + B + 'Z"/>');
    });
  } else if (closed) {
    o += HOT("The flap closed over the implant (primary closure): it is submerged, isolated from the mouth.", '<path class="gum" d="M10 ' + G + "Q320 " + (G - 18) + " 630 " + G + "V" + B + "Q320 " + (B - 16) + ' 10 ' + B + 'Z"/>');
    o += '<path d="M' + cx + " " + (G - 9) + "V" + (B - 10) + '" stroke="var(--im-gum-line)" stroke-width="1.2" stroke-dasharray="3 2"/><path d="M' + (cx - 14) + " " + (G + 2) + "Q" + cx + " " + (G - 22) + " " + (cx + 14) + " " + (G + 2) + '" fill="none" stroke="var(--anatomy-hi)" stroke-width="1.6"/><circle cx="' + cx + '" cy="' + (G - 10) + '" r="2.4" fill="var(--anatomy-hi)"/>' + L(470, G - 40, "sutures", cx + 8, G - 12, "start");
  } else {
    /* the mucosa closed around whatever passes through it, hugging its walls */
    [-1, 1].forEach(function (sg) {
      var far = sg < 0 ? 10 : 630, top = tm[tm.length - 1], d = "M" + far + " " + G + "Q" + f1((far + cx) / 2) + " " + (G - 8) + " " + f1(cx + sg * (top[0] + 2)) + " " + f1(top[1] > G ? top[1] : G - 2);
      for (i = tm.length - 1; i >= 0; i--) if (tm[i][1] >= G - 2) d += "L" + f1(cx + sg * tm[i][0]) + " " + f1(tm[i][1]);
      if (heal) d = "M" + far + " " + G + "Q" + f1((far + cx) / 2) + " " + (G - 8) + " " + f1(cx + sg * 26) + " " + (G - 4) + "L" + f1(cx + sg * 22) + " " + P;
      d += "L" + f1(cx + sg * 30) + " " + (B - 8) + "Q" + f1((far + cx) / 2) + " " + (B - 2) + " " + far + " " + B + "Z";
      o += HOT(heal ? "The mucosa closed around the healing abutment, which stays open (patent) to the mouth." : "The soft tissue, healed around the final abutment; the crown's margin sits just under its edge.", '<path class="gum" d="' + d + '"/>');
    });
  }
  o += HOT("The implant in its osteotomy, its platform at the crest.", SCREW(cx, P, 54, 150, 8));
  if (cover) o += HOT("Cover screw: short and hidden under the soft tissue, used at the first stage of two-stage surgery, for example when the implant isn't stable enough to be exposed to the tongue and food.", '<path class="ti-hi" d="M' + (cx - 26) + " " + P + "H" + (cx + 26) + "V" + (P - 6) + "Q" + cx + " " + (P - 12) + " " + (cx - 26) + " " + (P - 6) + 'Z"/>') + L(470, s === 0 ? G - 70 : B + 40, "cover screw", cx + 22, P - 6, "start");
  if (heal) o += HOT("Healing abutment: taller and not covered by tissue; it comes in different heights and widths and shapes the tissue for the crown.", '<path class="ti-hi" d="M' + (cx - 22) + " " + P + "L" + (cx - 27) + " " + (G - 12) + "Q" + cx + " " + (G - 22) + " " + (cx + 27) + " " + (G - 12) + "L" + (cx + 22) + " " + P + 'Z"/>') + L(470, G - 50, "healing abutment", cx + 26, G - 14, "start");
  if (final) o += HOT("Final abutment and crown, after the soft tissue has healed for at least 3 weeks around the healing abutment and the final impression is made.", '<path class="ti-hi" d="M' + (cx - 20) + " " + P + "L" + (cx - 25) + " " + (G + 8) + "H" + (cx + 25) + "L" + (cx + 20) + " " + P + 'Z"/><path class="crown" d="M' + (cx - 25) + " " + (G + 8) + "L" + (cx - 33) + " " + (G - 2) + "Q" + (cx - 52) + " " + (G - 30) + " " + (cx - 50) + " 96Q" + (cx - 46) + " 64 " + cx + " 66Q" + (cx + 46) + " 64 " + (cx + 50) + " 96Q" + (cx + 52) + " " + (G - 30) + " " + (cx + 33) + " " + (G - 2) + "L" + (cx + 25) + " " + (G + 8) + 'Z"/>') + L(470, 96, "final crown", cx + 50, 100, "start") + L(470, B + 40, "final abutment", cx + 20, G + 30, "start");
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
    D: { INIT: { mode: "two", step: 0 }, STEPKEY: "step", STEPMAX: 3 }, render: sgRender, say: sgSay,
    controls: `<div class="am-controls" role="group" aria-label="Technique"><button type="button" class="am-btn" data-amk="mode" data-amv="two">Two-stage</button><button type="button" class="am-btn" data-amk="mode" data-amv="one">One-stage</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: ["From the L2 notes (Dr. Chavali): two-stage (Brånemark 1985, cover screw, submerged 3-6 months, second surgery) and one-stage (Schroeder 1996, healing abutment at placement, 3-4 months, no second surgery), at least 3 weeks of soft tissue healing before the final impression, and when to choose each. From the L4 and L5 notes: what a cover screw and a healing abutment are.", "Schematic: the implant, abutment and crown shapes are not to scale."] });
}
