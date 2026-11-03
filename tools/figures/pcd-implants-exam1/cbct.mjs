// Fig: how a cone beam CT captures a volume (L7 CBCT 101, Dr. Givan; L6, medical CT vs CBCT). Beam view: the source
// and flat panel detector on a rotating gantry around the patient's head, a cone-shaped beam through the region of
// interest, one 180 or 360 degree rotation capturing several hundred planar images; compare a medical CT's fan beam,
// which rotates very rapidly. Detector view: an indirect flat panel, x-ray photon -> scintillator (thallium-doped cesium
// iodide) -> visible light -> photodiode in the thin-film transistor layer -> electric signal -> pixel. Schematic.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

function cbRender(st, D) {
  var o = "", t = st.t || 0;
  if (st.tab === "beam") {
    var cx = 230, cy = 200, R = 140, ct = st.ct, ang = ((t / (ct ? 900 : 6000)) * Math.PI * 2) % (Math.PI * 2);
    var sx = cx + R * Math.cos(ang), sy = cy + R * Math.sin(ang), dx = cx - R * Math.cos(ang), dy = cy - R * Math.sin(ang), nx = -Math.sin(ang), ny = Math.cos(ang);
    o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>';
    o += HOT("The patient, seen from above, in the axis of rotation. In tomography the source and detector rotate around the patient, who can be supine, sitting or standing.", '<ellipse cx="' + cx + '" cy="' + cy + '" rx="62" ry="74" fill="var(--im-gum)" stroke="var(--im-gum-line)"/><ellipse cx="' + cx + '" cy="' + (cy - 30) + '" rx="40" ry="26" fill="var(--im-cort)" stroke="var(--im-cort-line)"/>');
    var spread = ct ? 26 : 74, pw = ct ? 70 : 80;
    o += '<path d="M' + f1(sx) + " " + f1(sy) + "L" + f1(dx + nx * spread) + " " + f1(dy + ny * spread) + "L" + f1(dx - nx * spread) + " " + f1(dy - ny * spread) + 'Z" fill="var(--im-ray)" opacity=".22"/>';
    o += HOT("X-ray source: generates x-rays (a heated cathode filament emits electrons that hit a tungsten target).", '<circle cx="' + f1(sx) + '" cy="' + f1(sy) + '" r="13" fill="var(--im-ray)" stroke="var(--anatomy-hi)"/>');
    if (!ct) o += HOT("Flat panel detector: receives what's left after the patient attenuates the beam and converts it to a digital signal.", '<path d="M' + f1(dx + nx * pw) + " " + f1(dy + ny * pw) + "L" + f1(dx - nx * pw) + " " + f1(dy - ny * pw) + '" stroke="var(--im-sig)" stroke-width="10"/>');
    else { var dd = ""; for (var i = -5; i <= 5; i++) { var a2 = ang + Math.PI + i * 0.05; dd += "M" + f1(cx + (R + 6) * Math.cos(a2)) + " " + f1(cy + (R + 6) * Math.sin(a2)) + "L" + f1(cx + (R + 16) * Math.cos(a2)) + " " + f1(cy + (R + 16) * Math.sin(a2)); }
      o += HOT("Medical CT: a fan beam onto an arc of detectors, rotating very rapidly; a slice at a time.", '<path d="' + dd + '" stroke="var(--im-sig)" stroke-width="5"/>'); }
    o += T(cx, 30, ct ? "medical CT: fan beam, rotating very rapidly" : "CBCT: cone beam to a flat panel", "b", "middle");
    /* the stack of planar images builds up */
    var n = ct ? 0 : Math.floor((ang / (Math.PI * 2)) * 12);
    if (!ct) { for (var k = 0; k < 12; k++) o += '<rect x="' + (470 + k * 4) + '" y="' + (110 + k * 6) + '" width="70" height="56" rx="3" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-mid)" opacity="' + (k <= n ? 1 : 0.15) + '"/>';
      o += T(510, 98, "planar images", "s", "middle") + T(510, 222, "→ combined into a volume", "s", "middle"); }
  } else {
    var X0 = 120, layers = [["scintillator", 120, "Outer layer, the scintillator: a material such as thallium-doped cesium iodide converts each x-ray photon into visible light, in proportion to its intensity.", "--im-light"], ["photodiodes (thin-film transistor layer)", 190, "Middle layer, the thin-film transistor layer: an array of photodiodes, each a pixel, that generate an electric signal in proportion to the light reaching them.", "--im-sig"], ["signal out", 260, "The signal is read out and digitized: each photodiode becomes one pixel of the planar image.", "--anatomy-mid"]];
    layers.forEach(function (Ly, i) { o += HOT(Ly[2], '<rect x="' + X0 + '" y="' + Ly[1] + '" width="400" height="48" rx="6" fill="var(--anatomy-shade-' + (i + 1) + ')" stroke="var(' + Ly[3] + ')" stroke-width="2"/>' + T(X0 + 410, Ly[1] + 30, Ly[0], "s", "start")); });
    for (var p = 0; p < 6; p++) o += '<rect x="' + (X0 + 10 + p * 65) + '" y="196" width="56" height="36" rx="3" fill="none" stroke="var(--im-sig)" opacity=".7"/>';
    for (var q = 0; q < 4; q++) {
      var u = ((t / 2600 + q / 4) % 1), x = X0 + 60 + q * 95, y;
      if (u < 0.35) { y = 40 + u / 0.35 * 100; o += '<path d="M' + x + " " + f1(y - 16) + "l4 5l-8 5l8 5l-4 5" + '" stroke="var(--im-ray)" stroke-width="2.4" fill="none"/>'; }
      else if (u < 0.65) { y = 144 + (u - 0.35) / 0.3 * 56; o += '<circle cx="' + x + '" cy="' + f1(y) + '" r="' + f1(5 + 3 * Math.sin(u * 30)) + '" fill="var(--im-light)" opacity=".8"/>'; }
      else { y = 214 + (u - 0.65) / 0.35 * 70; o += '<path d="M' + x + " " + f1(y) + "h12" + '" stroke="var(--im-sig)" stroke-width="3"/><circle cx="' + (x + 14) + '" cy="' + f1(y) + '" r="3" fill="var(--im-sig)"/>'; }
    }
    o += T(X0 + 200, 30, "x-ray photons from the patient", "s mut", "middle");
    o += T(X0 + 200, 340, "indirect detection: x-rays → visible light → electric signal", "b", "middle");
  }
  return o;
}
function cbSay(st) {
  if (st.tab === "beam") return [st.ct ? "A medical CT uses a fan beam that rotates very rapidly onto a row of detectors, building the volume slice by slice." : "In a CBCT the source and detector sit on a rotating gantry with the patient in the axis of rotation. A cone (or pyramid) shaped beam goes through the region of interest, and in a single 180 or 360 degree rotation several hundred sequential planar images are captured, then combined by algorithms into a volume.", st.ct ? "fan beam" : "cone beam"];
  return ["The flat panel detector most CBCTs use is indirect: the scintillator turns each x-ray photon into visible light in proportion to its intensity, and the photodiodes of the thin-film transistor layer turn that light into an electric signal, one pixel each.", "x-ray → light → signal"];
}
export function cbct() {
  return makeFig({ id: "cbct", lec: "cbct", fig: "Fig 1", short: "Cone beam CT", hint: "switch views · hover a part",
    title: "How a cone beam CT captures a volume",
    caption: "The rotating gantry, the cone-shaped beam and the flat panel detector, layer by layer. Compare a medical CT's fan beam.",
    W: 640, H: 380, label: "A CBCT gantry rotating around a head from above, and the layers of an indirect flat panel detector.",
    D: { ANIM: true, INIT: { tab: "beam", ct: false } }, render: cbRender, say: cbSay,
    controls: `<div class="am-controls" role="group" aria-label="View"><button type="button" class="am-btn" data-amk="tab" data-amv="beam">The scan</button><button type="button" class="am-btn" data-amk="tab" data-amv="det">The detector</button><button type="button" class="am-btn" data-amt="ct">Compare: medical CT</button></div>`,
    sources: ["From the L7 notes (Dr. Givan): the rotating gantry, cone- or pyramid-shaped beam through the ROI, one 180 or 360 degree rotation, several hundred planar images combined into a volume; the scintillator (thallium-doped cesium iodide) and the photodiode (thin-film transistor) layers. From the L6 notes: a medical CT's fan beam rotates very rapidly.", "Schematic and not to scale; the rotation speeds are only relative. The motion stops under reduced motion."] });
}
