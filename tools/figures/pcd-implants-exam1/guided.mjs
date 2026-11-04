// Fig: freehand vs pilot-guided vs fully guided vs dynamic (L9 Guided Surgery, Dr. Chen; L8, Dr. Geisinger's
// accuracy numbers). The planned implant (dashed, prosthetically driven) between two teeth; each method's drill path.
// Pilot-guided: the template guides only the pilot drill, then the surgeon goes freehand to fit the bone. Fully guided:
// sleeves, a stop key and a drilling protocol control depth, angle and position. Dynamic: no guide, a screen tracks the
// handpiece. Deviation is drawn schematically; the numbers in the text are the ones from the L8 notes.
import { makeFig, f1, T, L, HOT, SCREW } from "./shared.mjs";

/* each method's implant relative to the plan, in mm at 12 px per mm: [platform, apex] lateral offsets, and whether the
   pilot drill follows the plan (a static guide) or the method's own axis */
function guDev(m) { return { free: [1.5, 3], pilot: [0.6, 2], full: [1.1, 1.3], dyn: [1.1, 1.3] }[m]; }
function guRender(st, D) {
  var o = "", m = st.m, s = st.step, cx = 320, B = 200, mm = 12, len = 10 * mm, py = B - 10;
  o += HOT("Bone. Freehand surgery tends to follow where the bone is: surgically driven.", '<path class="trab" d="M10 ' + B + "Q320 " + (B - 14) + ' 630 ' + B + 'V370H10Z"/>');
  o += '<path class="gum" d="M10 ' + (B - 30) + "Q320 " + (B - 44) + " 630 " + (B - 30) + "V" + B + "Q320 " + (B - 14) + ' 10 ' + B + 'Z"/>';
  [150, 490].forEach(function (x) { o += HOT("Neighboring tooth. A tooth-supported guide sits on these: the most accurate support.", '<path class="dentin" d="M' + (x - 40) + " " + (B - 34) + "H" + (x + 40) + "L" + (x + 26) + " 360Q" + x + " 372 " + (x - 26) + ' 360Z"/><path class="enamel" d="M' + (x - 46) + " " + (B - 34) + "L" + (x - 46) + " 86Q" + (x - 40) + " 62 " + (x - 18) + " 66Q" + x + " 58 " + (x + 18) + " 66Q" + (x + 40) + " 62 " + (x + 46) + " 86L" + (x + 46) + " " + (B - 34) + 'Z"/>'); });
  o += HOT("The plan: the implant in the best prosthetic position (posterior: the middle of the wax-up, mesiodistally and buccolingually, along the long axis).", '<path d="M' + (cx - 24) + " " + py + "H" + (cx + 24) + "V" + (py + len) + "Q" + cx + " " + (py + len + 12) + " " + (cx - 24) + " " + (py + len) + 'Z" fill="none" stroke="var(--im-ok)" stroke-width="2" stroke-dasharray="6 4"/>') + T(cx, py + len + 34, "dashed: the plan", "ok s", "middle");
  /* the method's final axis: platform and apex offsets from the plan */
  var dv = D.guDev(m), x0 = cx + dv[0] * mm, x1 = cx + dv[1] * mm, ang = Math.atan2(x1 - x0, len), deg = ang * 180 / Math.PI;
  var guided = m === "pilot" || m === "full";
  if (m === "dyn") o += HOT("Dynamic: no static guide. The clinician watches and adjusts on a screen as the implant is placed (X-Guide tracks the handpiece optically; Yomi's robotic arm physically guides it).", '<rect x="548" y="14" width="80" height="62" rx="6" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-hi)"/><path d="M584 66V24M592 66V24" stroke="var(--im-ok)" stroke-dasharray="3 2"/><path d="M' + f1(588 + (s ? dv[0] * 3 : 0)) + ' 66L' + f1(588 + (s ? dv[1] * 3 : 0)) + ' 26" stroke="var(--im-hot)" stroke-width="2"/>') + T(588, 92, "screen", "s", "middle");
  /* the drill or the implant */
  var pilotOnPlan = guided, dx = s === 0 && pilotOnPlan ? cx : x0, da = s === 0 && pilotOnPlan ? 0 : ang;
  var ex = dx + Math.sin(da) * (len + 6), ey = py + Math.cos(da) * (len + 6), topX = dx - Math.sin(da) * (py - 24);
  if (s < 2) o += HOT(s === 0 ? "The first (pilot) drill: end-cutting, with a deep bevel." : "The later drills widen the osteotomy; they are side-cutting.", '<path d="M' + f1(topX) + " 24L" + f1(ex) + " " + f1(ey) + '" stroke="var(--im-ti-line)" stroke-width="' + (s === 0 ? 6 : 16) + '" stroke-linecap="round" fill="none"/>');
  else o += '<g transform="rotate(' + f1(-deg) + " " + f1(x0) + " " + py + ')">' + HOT("The implant where this method put it.", SCREW(x0, py, 48, len, 8)) + "</g>";
  /* the guide goes on last, so the drill passes inside its sleeve; the pilot template comes off after the pilot drill */
  if (m === "full" || (m === "pilot" && s === 0)) o += HOT(m === "full" ? "Fully guided: a printed, tooth-supported guide (the most accurate support) with sleeves that fit the stop key and an inspection window to confirm it's seated." : "Pilot-guided (semi-guided): a surgical template from the wax-up, a suck-down and a tube. It doesn't know the bone; it shows where the best position is, and guides only the pilot drill. Then it comes off and the surgeon goes on freehand.", '<path d="M96 52H544V96H96Z" fill="var(--im-light)" opacity=".28" stroke="var(--im-light)"/><rect x="' + (cx - 13) + '" y="40" width="26" height="' + (m === "full" ? 112 : 64) + '" rx="2" fill="var(--anatomy-shade-0)" stroke="var(--anatomy-hi)"/>') + L(156, 30, m === "full" ? "guide + sleeve" : "template + tube", 150, 56, "start");
  return o;
}
function guSay(st) {
  var m = st.m, s = st.step, step = ["Pilot drill", "Wider drills", "The implant"][s];
  var t = { free: "Freehand: no guide, the surgeon's experience and a CBCT. Cheap, but surgically driven and with a higher risk of error in depth, angulation and position. Verify the axis often (a guide pin or the drill in the channel, then a PA).", pilot: "Pilot-guided (what the UAB student clinic does most of the time): the template guides only the pilot drill; after that the surgeon can alter the axis or depth to fit the bone, freehand.", full: "Fully guided: axis and depth designed in software from the CBCT (DICOM) and the surface scan (STL); sleeves, a stop key and a drilling protocol control every drill. High accuracy if seated correctly, but 'blind surgery' if you over-trust it.", dyn: "Dynamic: no guide; computer navigation controls placement in real time as you watch a screen." }[m];
  if (s === 2 && m !== "free") t += " Static and dynamic both deviate significantly less from the plan than freehand: about 1.0-1.2 mm at the platform, 1.3 mm at the apex and 3.5 degrees.";
  if (s === 2 && m === "free") t += " How far freehand lands from the plan is drawn only as an illustration: the lectures gave no number for it.";
  return [step + ". " + t, { free: "freehand", pilot: "pilot-guided", full: "fully guided", dyn: "dynamic" }[m] + (s === 2 && (m === "full" || m === "dyn") ? " · ~1.1 mm off" : "")];
}
export function guided() {
  return makeFig({ id: "guided", lec: "guided", fig: "Fig 1", short: "Guided vs freehand", hint: "pick a method · step the drills",
    title: "Freehand, pilot-guided, fully guided, dynamic",
    caption: "Who controls the drill, and how far the implant ends up from the plan. Pick a method and step from the pilot drill to the implant.",
    W: 640, H: 380, label: "An implant site between two teeth with the planned implant and the drill path for each surgical method.",
    D: { INIT: { m: "pilot", step: 0 }, STEPKEY: "step", STEPMAX: 2 }, render: guRender, say: guSay, helpers: [guDev],
    controls: `<div class="am-controls" role="group" aria-label="Method"><button type="button" class="am-btn" data-amk="m" data-amv="free">Freehand</button><button type="button" class="am-btn" data-amk="m" data-amv="pilot">Pilot-guided</button><button type="button" class="am-btn" data-amk="m" data-amv="full">Fully guided</button><button type="button" class="am-btn" data-amk="m" data-amv="dyn">Dynamic</button></div>
<div class="am-controls"><button type="button" class="am-btn" data-amstep="-1">Back</button><button type="button" class="am-btn" data-amstep="1">Next</button><button type="button" class="am-btn" data-amplay aria-pressed="false">Play</button></div>`,
    sources: ["From the L9 notes (Dr. Chen): freehand vs semi-guided (pilot) vs fully guided vs dynamic, what each controls, sleeves, stop key and drilling protocol, tooth-supported guides as the most accurate, X-Guide and Yomi. From the L8 notes (Dr. Geisinger): the pilot drill is end-cutting, the rest side-cutting; static and dynamic deviations about 1.0-1.2 mm, 1.3 mm and 3.5 degrees.", "The implant is drawn at 12 px per mm. Fully guided and dynamic land 1.1 mm off the plan at the platform and 1.3 mm at the apex, the L8 averages; freehand (1.5 and 3 mm) and pilot-guided (0.6 and 2 mm) are illustrations only, since the lectures gave no number for them. The teeth and guide are schematic."] });
}
