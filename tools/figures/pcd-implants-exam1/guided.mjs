// Fig: freehand vs pilot-guided vs fully guided vs dynamic (L9 Guided Surgery, Dr. Chen; L8, Dr. Geisinger's
// accuracy numbers). The planned implant (dashed, prosthetically driven) between two teeth; each method's drill path.
// Pilot-guided: the template guides only the pilot drill, then the surgeon goes freehand to fit the bone. Fully guided:
// sleeves, a stop key and a drilling protocol control depth, angle and position. Dynamic: no guide, a screen tracks the
// handpiece. Deviation is drawn schematically; the numbers in the text are the ones from the L8 notes.
import { makeFig, f1, T, L, HOT, SCREW } from "./shared.mjs";

function guRender(st, D) {
  var o = "", m = st.m, s = st.step, cx = 320, B = 200, top = 120;
  o += HOT("Bone. Freehand surgery tends to follow where the bone is: surgically driven.", '<path class="cort" d="M10 ' + B + "Q320 " + (B - 14) + ' 630 ' + B + 'V370H10Z"/>');
  o += '<path class="gum" d="M10 ' + (B - 30) + "Q320 " + (B - 44) + " 630 " + (B - 30) + "V" + B + "Q320 " + (B - 14) + ' 10 ' + B + 'Z"/>';
  [[150, "neighbor"], [490, "neighbor"]].forEach(function (p) { o += '<path class="dentin" d="M' + (p[0] - 40) + " " + (B - 34) + "H" + (p[0] + 40) + "L" + (p[0] + 28) + " 360H" + (p[0] - 28) + 'Z"/><path class="enamel" d="M' + (p[0] - 46) + " " + (B - 34) + "L" + (p[0] - 42) + " 70Q" + p[0] + " 54 " + (p[0] + 42) + " 70L" + (p[0] + 46) + " " + (B - 34) + 'Z"/>'; });
  o += HOT("The plan: the implant in the best prosthetic position (posterior: the middle of the wax-up, mesiodistally and buccolingually, along the long axis).", '<path d="M' + (cx - 24) + " " + (B - 10) + "H" + (cx + 24) + "V" + (B + 120) + "Q" + cx + " " + (B + 132) + " " + (cx - 24) + " " + (B + 120) + 'Z" fill="none" stroke="var(--im-ok)" stroke-width="2" stroke-dasharray="6 4"/>') + L(560, B + 150, "the plan", cx + 24, B + 100, "end", "ok");
  /* deviation by method and step */
  var dev = { free: [10, 14], pilot: [0, 8], full: [0, 2], dyn: [0, 2] }[m], ang = (s === 0 ? 0 : dev[1]) * (m === "free" ? 1 : 0.5) * Math.PI / 180 * 2, off = s === 0 ? dev[0] : dev[0] + dev[1] * 0.6;
  /* guide */
  if (m === "pilot" || m === "full") o += HOT(m === "full" ? "Fully guided: a printed, tooth-supported guide (the most accurate support) with sleeves that fit the stop key and an inspection window to confirm it's seated." : "Pilot-guided (semi-guided): a surgical template from the wax-up, a suck-down and a tube. It doesn't know the bone; it shows where the best position is, and guides only the pilot drill.", '<path d="M90 60H550V' + top + 'H90Z" fill="var(--im-light)" opacity=".25" stroke="var(--im-light)"/><rect x="' + (cx - 14) + '" y="60" width="28" height="' + (top - 60) + '" fill="var(--anatomy-shade-0)" stroke="var(--anatomy-hi)"/>') + L(80, 54, m === "full" ? "guide + sleeve" : "template + tube", 120, 70, "start");
  if (m === "dyn") o += HOT("Dynamic: no static guide. The clinician watches and adjusts on a screen as the implant is placed (X-Guide tracks the handpiece optically; Yomi's robotic arm physically guides it).", '<rect x="470" y="20" width="150" height="90" rx="8" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-hi)"/><path d="M520 80V40M530 80V40" stroke="var(--im-ok)" stroke-dasharray="3 2"/><path d="M' + (525 + off * 0.3) + ' 80L' + (525 + off * 0.3) + ' 44" stroke="var(--im-hot)" stroke-width="2"/>') + T(545, 104, "navigation screen", "s", "middle");
  /* the drill / implant */
  var px = cx + off, py = B - 10, len = s === 2 ? 130 : s === 1 ? 128 : 110, ex = px + Math.sin(ang) * len, ey = py + Math.cos(ang) * len;
  if (s < 2) o += HOT(s === 0 ? "The first (pilot) drill: end-cutting, with a deep bevel." : "The later drills widen the osteotomy; they are side-cutting.", '<path d="M' + f1(px) + " 30L" + f1(px) + " " + py + "L" + f1(ex) + " " + f1(ey) + '" stroke="var(--im-ti-line)" stroke-width="' + (s === 0 ? 6 : 12) + '" stroke-linecap="round" fill="none"/>');
  else o += '<g transform="rotate(' + f1(-ang * 180 / Math.PI) + " " + f1(px) + " " + py + ')">' + HOT("The implant where this method put it.", SCREW(px, py, 48, 126, 8)) + "</g>";
  return o;
}
function guSay(st) {
  var m = st.m, s = st.step, step = ["Pilot drill", "Wider drills", "The implant"][s];
  var t = { free: "Freehand: no guide, the surgeon's experience and a CBCT. Cheap, but surgically driven and with a higher risk of error in depth, angulation and position. Verify the axis often (a guide pin or the drill in the channel, then a PA).", pilot: "Pilot-guided (what the UAB student clinic does most of the time): the template guides only the pilot drill; after that the surgeon can alter the axis or depth to fit the bone, freehand.", full: "Fully guided: axis and depth designed in software from the CBCT (DICOM) and the surface scan (STL); sleeves, a stop key and a drilling protocol control every drill. High accuracy if seated correctly, but 'blind surgery' if you over-trust it.", dyn: "Dynamic: no guide; computer navigation controls placement in real time as you watch a screen." }[m];
  if (s === 2 && m !== "free") t += " Static and dynamic both deviate significantly less from the plan than freehand: about 1.0-1.2 mm at the platform, 1.3 mm at the apex and 3.5 degrees.";
  return [step + ". " + t, { free: "freehand", pilot: "pilot-guided", full: "fully guided", dyn: "dynamic" }[m]];
}
export function guided() {
  return makeFig({ id: "guided", lec: "guided", fig: "Fig 1", short: "Guided vs freehand", hint: "pick a method · step the drills",
    title: "Freehand, pilot-guided, fully guided, dynamic",
    caption: "Who controls the drill, and how far the implant ends up from the plan. Pick a method and step from the pilot drill to the implant.",
    W: 640, H: 380, label: "An implant site between two teeth with the planned implant and the drill path for each surgical method.",
    D: { INIT: { m: "pilot", step: 0 }, STEPKEY: "step", STEPMAX: 2 }, render: guRender, say: guSay,
    controls: `<div class="am-controls" role="group" aria-label="Method"><button type="button" class="am-btn" data-amk="m" data-amv="free">Freehand</button><button type="button" class="am-btn" data-amk="m" data-amv="pilot">Pilot-guided</button><button type="button" class="am-btn" data-amk="m" data-amv="full">Fully guided</button><button type="button" class="am-btn" data-amk="m" data-amv="dyn">Dynamic</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: ["From the L9 notes (Dr. Chen): freehand vs semi-guided (pilot) vs fully guided vs dynamic, what each controls, sleeves, stop key and drilling protocol, tooth-supported guides as the most accurate, X-Guide and Yomi. From the L8 notes (Dr. Geisinger): the pilot drill is end-cutting, the rest side-cutting; static and dynamic deviations about 1.0-1.2 mm, 1.3 mm and 3.5 degrees.", "How far each method lands from the plan is drawn schematically (freehand most, then pilot, then guided); the lectures gave no freehand number."] });
}
