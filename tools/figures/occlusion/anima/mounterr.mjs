// Fig: where a facebow (mounting) error shows (Occlusion L6, "Hinge axis and facebow"). Left, a semi-adjustable
// articulator from the side with the maxillary cast where the facebow would put it (dashed) or mounted wrong: too far
// back, too high, too far forward or too low. Right, the same patient's teeth in the mouth during a protrusive or
// lateral movement, with the teeth that meet early or hard lit, as the slides give the rule: too posterior or too
// superior loads the most anterior teeth; too anterior or too inferior loads the most posterior teeth. The rule is the
// notes'; the drawing is schematic and the offsets are exaggerated so they can be seen.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 300;
const D = {
  W, H,
  OFF: { ok: [0, 0], back: [16, 0], high: [0, -14], fwd: [-16, 0], low: [0, 14] },
  HIT: { ok: "none", back: "ant", high: "ant", fwd: "post", low: "post" },
  NAME: { ok: "facebow position", back: "mounted too far back", high: "mounted too high", fwd: "mounted too far forward", low: "mounted too low" },
};

function meSvg(st, D) {
  var f = function (n) { return Math.round(n * 10) / 10; }, o = "", off = D.OFF[st.pos], hit = D.HIT[st.pos], u = st.u;
  function tx(x, y, t, cls, a) { return '<text class="me-t' + (cls ? " " + cls : "") + '" x="' + f(x) + '" y="' + f(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + t + "</text>"; }
  function lab(t, x, y, px, py, a) { return '<g class="am-callout"><path class="am-leader" d="M' + f(a === "end" ? x + 3 : x - 3) + " " + f(y - 4) + "L" + f(px) + " " + f(py) + '"/><circle class="am-dot" cx="' + f(px) + '" cy="' + f(py) + '" r="1.8"/>' + tx(x, y, t, "", a) + "</g>"; }
  function teeth(x0, y0, dir, cls, shift, k) {
    /* a row of 8 teeth from the central incisor (left) to the second molar (right); dir -1 = upper (crowns point down) */
    k = k || 1; var w = [12, 11, 13, 14, 14, 20, 20, 19].map(function (v) { return v * k; }), s = "", x = x0 + (shift || 0);
    for (var i = 0; i < 8; i++) {
      var h = (i < 3 ? 26 : 20) * Math.min(k, 1.2), tip = i === 2 ? 6 : i < 2 ? 2 : 4, y1 = y0, y2 = y0 + dir * h;
      s += '<path class="' + cls + '" d="M' + f(x) + " " + f(y1) + "L" + f(x) + " " + f(y2 - dir * tip) + "L" + f(x + w[i] / 2) + " " + f(y2) + "L" + f(x + w[i]) + " " + f(y2 - dir * tip) + "L" + f(x + w[i]) + " " + f(y1) + 'Z"/>';
      x += w[i] + 1.5;
    }
    return s;
  }
  /* ---- left: the articulator ---- */
  o += tx(14, 18, "on the articulator", "me-head", "start") + tx(14, 34, "← anterior", "me-cap", "start");
  o += '<path class="me-art hot" data-info="Upper member of the articulator, carrying the fossa (condylar housing) and the maxillary mounting plate." d="M30 52H222V66H208V74H44V66H30Z"/>';
  o += '<path class="me-art" d="M206 66H236V96H206Z"/>';
  o += '<circle class="me-condyle hot" data-info="The condylar element, on the lower member (arcon). The articulator\'s hinge axis runs through it." cx="221" cy="104" r="9"/>';
  o += '<path class="me-art hot" data-info="Lower member, carrying the condylar elements and the mandibular mounting plate." d="M30 238H222V252H30ZM212 112H230V238H212Z"/>';
  o += '<path class="me-pin" d="M38 74V238"/>';
  /* the mandibular cast is mounted on the lower member; the maxillary cast hangs from the upper plate */
  o += '<path class="me-stone" d="M56 200H196V230H56Z"/>' + teeth(62, 200, -1, "me-tooth", 0);
  o += '<path class="me-ghost" d="M56 82H196V112H56Z"/>' + teeth(62, 112, 1, "me-tooth-ghost", 0);
  o += '<g transform="translate(' + off[0] + " " + off[1] + ')"><path class="me-stone" d="M56 82H196V112H56Z"/><path class="me-plaster" d="M70 74H182V82H70Z"/>' + teeth(62, 112, 1, "me-tooth", 0) + "</g>";
  o += tx(126, 262, "dashed: where the facebow puts it", "me-cap", "middle");
  o += tx(126, 280, D.NAME[st.pos], "me-res me-" + (hit === "none" ? "ok" : "bad"), "middle");
  /* ---- right: in the mouth ---- */
  var X0 = 296, Y0 = 150, K = 1.6, mv = u * 6, W8 = [12, 11, 13, 14, 14, 20, 20, 19].map(function (v) { return v * K; });
  var cen = [], cx = X0; W8.forEach(function (w) { cen.push(cx + w / 2); cx += w + 1.5; });
  o += tx(X0, 18, "in the mouth, " + (st.mv === "lat" ? "laterotrusion" : "protrusion"), "me-head", "start");
  o += '<path class="me-gum" d="M' + (X0 - 6) + " " + (Y0 - 64) + "H" + f(cx + 6) + "V" + (Y0 - 30) + "H" + (X0 - 6) + 'Z"/>';
  o += teeth(X0, Y0 - 30, 1, "me-tooth", 0, K);
  o += '<path class="me-gum" d="M' + f(X0 - 6 - mv) + " " + f(Y0 + 32 + mv * 0.4) + "H" + f(cx + 6 - mv) + "V" + f(Y0 + 66 + mv * 0.4) + "H" + f(X0 - 6 - mv) + 'Z"/>';
  o += teeth(X0 + 6, Y0 + 32 + mv * 0.4, -1, "me-tooth", -mv, K);
  if (u > 0.3 && hit !== "none") {
    var idx = hit === "ant" ? [0, 1, 2] : [5, 6, 7];
    idx.forEach(function (i) { o += '<circle class="me-hit" cx="' + f(cen[i]) + '" cy="' + f(Y0 + 1) + '" r="' + f(6 + u * 3) + '"/>'; });
    o += tx(hit === "ant" ? X0 : cx, Y0 + 96, hit === "ant" ? "the most anterior teeth hit" : "the most posterior teeth hit", "me-res me-bad", hit === "ant" ? "start" : "end");
  } else if (u > 0.3) o += tx((X0 + cx) / 2, Y0 + 96, "moves like the patient", "me-res me-ok", "middle");
  o += tx(X0, Y0 + 118, "incisors", "me-cap", "start") + tx(cx, Y0 + 118, "molars", "me-cap", "end");
  return o;
}

const TEXT = {
  ok: "The facebow orients the maxillary cast to the articulator's hinge axis the way the patient's maxilla sits relative to their joints, so the casts move along paths close to the patient's and the restoration needs little adjustment.",
  back: "Mounted too far posterior: in protrusion and laterotrusion the work built on the articulator gives premature or heavy contacts on the most anterior teeth.",
  high: "Mounted too superior (high): premature or heavy contacts on the most anterior teeth in protrusion and laterotrusion, the same as too far back.",
  fwd: "Mounted too far anterior: premature or heavy contacts on the most posterior teeth in protrusion and laterotrusion.",
  low: "Mounted too inferior (low): premature or heavy contacts on the most posterior teeth, the same as too far forward.",
};

const svg = figureSvg({ width: W, height: H, className: "me-svg", label: "Left, an articulator with the maxillary cast at the facebow position or mounted wrong; right, the teeth in the mouth with the early contacts lit.", body: meSvg({ pos: "back", u: 1, mv: "prot" }, D) });
const plate = plateHtml({ fig: "Fig", title: "Where a mounting error shows", hint: "mount the cast · move the jaw", readout: "", body: `<div class="am-svg me-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Maxillary cast"><button type="button" class="am-btn" data-mepos="ok" aria-pressed="false">Facebow position</button><button type="button" class="am-btn" data-mepos="back" aria-pressed="true">Too far back</button><button type="button" class="am-btn" data-mepos="high" aria-pressed="false">Too high</button><button type="button" class="am-btn" data-mepos="fwd" aria-pressed="false">Too far forward</button><button type="button" class="am-btn" data-mepos="low" aria-pressed="false">Too low</button></div>
<div class="am-controls" role="group" aria-label="Movement"><button type="button" class="am-btn" data-memv="prot" aria-pressed="true">Protrude</button><button type="button" class="am-btn" data-memv="lat" aria-pressed="false">Move to the side</button></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Hover or tap the parts of the articulator.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>From the L6 notes (Dr. Givan's Occ Lec4 slide "Hinge axis and facebow" and its four mounting pictures): errors show in protrusion and laterotrusion; too posterior or too superior gives premature and/or heavy contacts on the most anterior teeth, too anterior or too inferior on the most posterior teeth.</li>
<li>Schematic: the articulator, casts and teeth are simplified, the offsets are exaggerated so they show, and the lit teeth illustrate the slide's rule rather than a measured simulation. Educational, not clinical guidance.</li></ul></details>`;

function meLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".me-svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var st = { pos: "back", u: 1, mv: "prot" }, raf = 0;
  function draw() { svg.innerHTML = D.meSvg(st, D); sum.textContent = D.TEXT[st.pos]; if (readout) readout.textContent = D.HIT[st.pos] === "ant" ? "anterior teeth hit" : D.HIT[st.pos] === "post" ? "posterior teeth hit" : "no error"; }
  function move() {
    cancelAnimationFrame(raf);
    if (reduce.matches) { st.u = 1; draw(); return; }
    var t0 = performance.now();
    function step(now) { st.u = Math.min(1, (now - t0) / 1200); draw(); if (st.u < 1) raf = requestAnimationFrame(step); }
    st.u = 0; raf = requestAnimationFrame(step);
  }
  root.querySelectorAll("[data-mepos]").forEach(function (b) { b.addEventListener("click", function () { st.pos = b.getAttribute("data-mepos"); root.querySelectorAll("[data-mepos]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); move(); }); });
  root.querySelectorAll("[data-memv]").forEach(function (b) { b.addEventListener("click", function () { st.mv = b.getAttribute("data-memv"); root.querySelectorAll("[data-memv]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); move(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  draw();
}

const CSS = `
.anima .me-box{max-width:580px;margin:0 auto}
.anima .me-svg .me-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima .me-svg .me-head{fill:var(--anatomy-strong);font-weight:700;stroke:none}
.anima .me-svg .me-cap{fill:var(--anatomy-muted);font-size:10.5px;stroke:none}
.anima .me-svg .me-res{font-size:12px;font-weight:700}
.anima .me-svg .me-ok{fill:#2f8a5b}
.anima .me-svg .me-bad{fill:var(--tm-vessel)}
.anima .me-svg .me-art{fill:var(--anatomy-shade-1);stroke:var(--anatomy-hi);stroke-width:1.2;stroke-linejoin:round}
.anima .me-svg .me-condyle{fill:var(--tm-bone-in);stroke:var(--anatomy-hi);stroke-width:1.4}
.anima .me-svg .me-pin{stroke:var(--anatomy-mid);stroke-width:2}
.anima .me-svg .me-stone{fill:var(--tm-bone);stroke:var(--anatomy-lo);stroke-width:1}
.anima .me-svg .me-plaster{fill:var(--tm-bone-in);stroke:var(--anatomy-lo);stroke-width:1}
.anima .me-svg .me-ghost{fill:none;stroke:var(--anatomy-lit);stroke-width:1.2;stroke-dasharray:4 3}
.anima .me-svg .me-tooth{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:1;stroke-linejoin:round}
.anima .me-svg .me-tooth-ghost{fill:none;stroke:var(--anatomy-lit);stroke-width:.8;stroke-dasharray:3 2}
.anima .me-svg .me-gum{fill:var(--tm-retro);opacity:.55}
.anima .me-svg .me-hit{fill:none;stroke:var(--tm-vessel);stroke-width:2.4}
`;

export function mounterr() {
  return {
    id: "mounterr", lec: "instruments",
    title: "Where a mounting error shows",
    caption: "Mount the maxillary cast where the facebow puts it, or too far back, too high, too far forward or too low, then move the jaw and see which teeth meet early in the mouth.",
    html: `<div class="anima" data-anima="mounterr">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: meLive.toString(),
    helpers: [meSvg],
    data: Object.assign({ TEXT }, D),
  };
}
