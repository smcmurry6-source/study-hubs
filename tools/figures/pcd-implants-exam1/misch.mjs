// Fig: Misch's bone density classes D1-D4 and where they usually are (L3 Biomechanics, Dr. Chavali). Each class drawn
// as a block of bone (cortical plate thickness, trabeculae, marrow) and its usual location on the jaws. Density,
// strength, compressive strength and elastic modulus all fall from D1 to D4. A generalization, not true in every
// patient. Schematic.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

function miRender(st, D) {
  var o = "", sel = st.d, R = D.ROWS;
  /* jaws, front view: maxilla on top, mandible below, each split anterior / posterior */
  function region(d, path, lx, ly, s) { var on = sel === d; return HOT(R[d - 1][1] + ": usually the " + R[d - 1][2].toLowerCase() + ".", '<path d="' + path + '" fill="' + (on ? "var(--im-hot-soft)" : "var(--anatomy-shade-2)") + '" stroke="' + (on ? "var(--im-hot)" : "var(--anatomy-mid)") + '" stroke-width="' + (on ? 2.4 : 1) + '"/>' + T(lx, ly, s, on ? "hot-t" : "s", "middle")); }
  o += T(150, 26, "maxilla", "s mut", "middle") + T(150, 334, "mandible", "s mut", "middle");
  o += region(3, "M100 50Q150 36 200 50L196 140L104 140Z", 150, 100, "D3");
  o += region(4, "M20 70Q50 52 100 50L104 140L30 150Z", 64, 105, "D4") + region(4, "M200 50Q250 52 280 70L270 150L196 140Z", 236, 105, "D4");
  o += region(1, "M104 190L196 190L200 290Q150 310 100 290Z", 150, 250, "D1");
  o += region(2, "M30 180L104 190L100 290Q50 280 26 260Z", 64, 245, "D2") + region(2, "M196 190L270 180L274 260Q250 280 200 290Z", 236, 245, "D2");
  /* the selected class as a block of bone */
  var c = R[sel - 1], X = 330, Y = 60, W = 280, H = 210, ct = c[3];
  o += HOT("Cortical plates: thickest in D1, thinnest in D4.", '<rect x="' + X + '" y="' + Y + '" width="' + W + '" height="' + H + '" rx="8" class="cort"/>');
  o += HOT("Trabecular bone with marrow between the trabeculae: coarse in D2, fine in D3 and D4, almost absent in D1.", '<rect x="' + X + '" y="' + (Y + ct) + '" width="' + W + '" height="' + (H - 2 * ct) + '" class="trab"/>');
  /* trabecular struts: thick and coarse in D2, thinner and finer toward D4 */
  var th = c[6], step = c[7], sd = "";
  for (var sx = X + 8; sx < X + W - 8; sx += step) for (var sy = Y + ct + 6; sy < Y + H - ct - 6; sy += step) { var j = ((sx * 7 + sy * 13) % 11) / 11; sd += "M" + f1(sx) + " " + f1(sy) + "l" + f1(step * 0.8) + " " + f1((j - 0.5) * step); }
  if (sd) o += '<path d="' + sd + '" stroke="var(--im-cort-line)" stroke-width="' + th + '" stroke-linecap="round" fill="none" opacity=".7"/>';
  var n = c[4];
  for (var i = 0; i < n; i++) { var x = X + 14 + ((i * 53) % (W - 28)), y = Y + ct + 10 + ((i * 37) % Math.max(10, H - 2 * ct - 20)); o += '<ellipse class="marrow" cx="' + x + '" cy="' + y + '" rx="' + c[5] + '" ry="' + f1(c[5] * 0.7) + '"/>'; }
  o += T(X + W / 2, Y - 10, c[0] + " · " + c[2].replace(/ \(.*\)/, "").toLowerCase(), "b", "middle");
  /* density bar */
  o += T(X, 312, "density, strength, stiffness", "s mut") + '<rect x="' + X + '" y="320" width="' + W + '" height="10" rx="5" fill="var(--anatomy-shade-1)"/><rect x="' + X + '" y="320" width="' + f1(W * (1.15 - sel * 0.22)) + '" height="10" rx="5" fill="var(--im-hot)"/>';
  return o;
}
function miSay(st, D) { var r = D.ROWS[st.d - 1]; return [r[0] + ": " + r[1] + ". Usually the " + r[2].toLowerCase() + ". Density, strength, compressive strength and elastic modulus all fall from D1 to D4; it's a generalization, not true in every patient, and an experienced surgeon can feel the bone type while drilling.", r[0] + " · " + r[2].toLowerCase()]; }
export function misch() {
  return makeFig({ id: "misch", lec: "biomech", fig: "Fig 1", short: "Misch D1-D4", hint: "pick a class · hover a region",
    title: "Misch's bone classes D1 to D4",
    caption: "From dense anterior mandible to soft posterior maxilla: each class's bone and where it usually is.",
    W: 640, H: 350, label: "The jaws divided into regions labeled D1 to D4, and a block of bone for the selected class.",
    D: { INIT: { d: 1 }, ROWS: [["D1", "Thick dense cortical bone, hardly any trabecular bone", "Anterior mandible", 88, 2, 4, 3, 16], ["D2", "Thick cortical plates with coarse trabeculae", "Posterior mandible (sometimes anterior mandible)", 40, 8, 8, 3.4, 26], ["D3", "Thin cortical plates, finer trabeculae", "Anterior maxilla", 16, 14, 9, 1.6, 20], ["D4", "Fine trabecular bone, very little cortical bone, more marrow", "Posterior maxilla", 6, 26, 13, 0.9, 22]] }, render: miRender, say: miSay,
    controls: `<div class="am-controls" role="group" aria-label="Bone class"><button type="button" class="am-btn" data-amk="d" data-amv="1">D1</button><button type="button" class="am-btn" data-amk="d" data-amv="2">D2</button><button type="button" class="am-btn" data-amk="d" data-amv="3">D3</button><button type="button" class="am-btn" data-amk="d" data-amv="4">D4</button></div>`,
    sources: ["From the L3 notes (Dr. Chavali), the Misch bone classification table: each class's description and usual location, and that density, strength, compressive strength and elastic modulus all fall from D1 to D4.", "The bone blocks and the jaw map are schematic; the density bar only shows the order, not values."] });
}
