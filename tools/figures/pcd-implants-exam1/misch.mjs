// Fig: Misch's bone density classes D1-D4 and where they usually are (L3 Biomechanics, Dr. Chavali). The two arches in
// occlusal view, each split into anterior (canine to canine) and posterior segments with their usual class, and a block
// of the selected class in section: cortical plates (thickest in D1, almost none in D4) around trabecular bone whose
// marrow spaces grow and whose trabeculae thin from D2 to D4. Density, strength, compressive strength and elastic
// modulus all fall from D1 to D4. A generalization, not true in every patient. Schematic.
import { makeFig, f1, T, L, HOT } from "./shared.mjs";

/* a repeatable 0..1 noise, so the marrow spaces scatter without lining up */
function miHash(i, j) { var v = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return v - Math.floor(v); }
function miRender(st, D) {
  var o = "", sel = st.d, R = D.ROWS, k;
  /* the arches in occlusal view: maxilla (incisors up) and mandible (incisors down), anterior = canine to canine */
  function arch(cy, dir, ant, post, name, ly) {
    var s = "", segs = [[-1, -0.42, post], [-0.42, 0.42, ant], [0.42, 1, post]];
    segs.forEach(function (sg) {
      var d = sg[2], on = sel === d, outer = [], inner = [], t;
      for (t = sg[0]; t <= sg[1] + 1e-6; t += (sg[1] - sg[0]) / 12) {
        var x = 150 + 112 * t, y = cy + dir * 84 * t * t, nx = -dir * 168 * t, ny = 112, nl = Math.sqrt(nx * nx + ny * ny); nx /= nl; ny /= nl;
        var hw = 13 + 5 * Math.abs(t);
        outer.push([x - nx * hw * dir, y - ny * hw * dir]); inner.push([x + nx * hw * dir, y + ny * hw * dir]);
      }
      var path = "M" + outer.map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + "L" + inner.reverse().map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + "Z";
      var mt = (sg[0] + sg[1]) / 2, lx = 150 + 112 * mt, lyy = cy + dir * 84 * mt * mt + 5;
      s += HOT(R[d - 1][0] + " (" + name + ", " + (sg[2] === ant ? "anterior" : "posterior") + "): " + R[d - 1][1].toLowerCase() + ". Usually the " + R[d - 1][2].toLowerCase() + ".", '<path d="' + path + '" fill="' + (on ? "var(--im-hot-soft)" : "var(--anatomy-shade-2)") + '" stroke="' + (on ? "var(--im-hot)" : "var(--anatomy-mid)") + '" stroke-width="' + (on ? 2.4 : 1) + '"/>' + T(lx, lyy, "D" + d, on ? "hot-t" : "s", "middle"));
    });
    return s + T(150, ly, name, "s mut", "middle");
  }
  o += arch(40, 1, 3, 4, "maxilla", 100) + arch(318, -1, 1, 2, "mandible", 268);
  o += T(150, 180, "both arches in occlusal view", "s mut", "middle");
  /* the selected class as a block of bone in section */
  var c = R[sel - 1], X = 330, Y = 60, W = 280, H = 210, ct = c[3], cell = c[4], wall = c[5], pitch = cell + wall;
  o += HOT("Cortical plates: thickest in D1, thinnest in D4.", '<rect x="' + X + '" y="' + Y + '" width="' + W + '" height="' + H + '" rx="8" class="cort"/>');
  o += HOT("Trabecular bone: the trabeculae (bone) with marrow spaces between them. Coarse in D2, finer in D3, fine with large marrow spaces in D4; almost none in D1.", '<rect x="' + X + '" y="' + (Y + ct) + '" width="' + W + '" height="' + (H - 2 * ct) + '" class="trab"/>');
  var cells = "", i, j, y0 = Y + ct + wall / 2 + cell / 2, y1 = Y + H - ct - wall / 2 - cell / 2 + 0.01;
  for (j = 0; y0 + j * pitch * 0.87 <= y1; j++) for (i = 0; X + wall + cell / 2 + i * pitch + (j % 2) * pitch / 2 <= X + W - wall - cell / 2 + 0.01; i++) {
    var h1 = D.miHash(i + sel * 31, j), h2 = D.miHash(j + 7, i + sel * 17), cxx = X + wall + cell / 2 + i * pitch + (j % 2) * pitch / 2 + (h1 - 0.5) * wall * 0.8, cyy = y0 + j * pitch * 0.87 + (h2 - 0.5) * wall * 0.8;
    cells += '<ellipse cx="' + f1(cxx) + '" cy="' + f1(cyy) + '" rx="' + f1(cell / 2 * (0.75 + 0.35 * h2)) + '" ry="' + f1(cell / 2 * (0.6 + 0.35 * h1)) + '" transform="rotate(' + f1((h1 - 0.5) * 70) + " " + f1(cxx) + " " + f1(cyy) + ')"/>';
  }
  o += '<g fill="var(--im-marrow)" stroke="var(--im-cort-line)" stroke-width=".5">' + cells + "</g>";
  o += T(X + W / 2, Y - 10, c[0] + " · " + c[2].replace(/ \(.*\)/, "").toLowerCase(), "b", "middle");
  /* density bar: order only */
  o += T(X, 312, "density, strength, stiffness", "s mut") + '<rect x="' + X + '" y="320" width="' + W + '" height="10" rx="5" fill="var(--anatomy-shade-1)"/><rect x="' + X + '" y="320" width="' + f1(W * (1.15 - sel * 0.22)) + '" height="10" rx="5" fill="var(--im-hot)"/>';
  return o;
}
function miSay(st, D) { var r = D.ROWS[st.d - 1]; return [r[0] + ": " + r[1] + ". Usually the " + r[2].toLowerCase() + ". Density, strength, compressive strength and elastic modulus all fall from D1 to D4; it's a generalization, not true in every patient, and an experienced surgeon can feel the bone type while drilling.", r[0] + " · " + r[2].replace(/ \(.*\)/, "").toLowerCase()]; }
export function misch() {
  return makeFig({ id: "misch", lec: "biomech", fig: "Fig 1", short: "Misch D1-D4", hint: "pick a class · hover a region",
    title: "Misch's bone classes D1 to D4",
    caption: "From dense anterior mandible to soft posterior maxilla: each class's bone in section and where it usually is.",
    W: 640, H: 350, label: "The upper and lower arches divided into anterior and posterior regions labeled D1 to D4, and a block of bone for the selected class.",
    D: { INIT: { d: 1 }, ROWS: [["D1", "Thick dense cortical bone, hardly any trabecular bone", "Anterior mandible", 78, 7, 7], ["D2", "Thick cortical plates with coarse trabeculae", "Posterior mandible (sometimes anterior mandible)", 34, 15, 7], ["D3", "Thin cortical plates, finer trabeculae", "Anterior maxilla", 12, 17, 3.5], ["D4", "Fine trabecular bone, very little cortical bone, more marrow", "Posterior maxilla", 4, 21, 1.8]] }, render: miRender, say: miSay, helpers: [miHash],
    controls: `<div class="am-controls" role="group" aria-label="Bone class"><button type="button" class="am-btn" data-amk="d" data-amv="1">D1</button><button type="button" class="am-btn" data-amk="d" data-amv="2">D2</button><button type="button" class="am-btn" data-amk="d" data-amv="3">D3</button><button type="button" class="am-btn" data-amk="d" data-amv="4">D4</button></div>`,
    sources: ["From the L3 notes (Dr. Chavali), the Misch bone classification table: each class's description and usual location, and that density, strength, compressive strength and elastic modulus all fall from D1 to D4; a generalization, not true in every patient.", "The arches, the bone blocks and their marrow spaces are schematic (the cortical thickness and trabecular pattern only show the order from D1 to D4), and so is the density bar."] });
}
