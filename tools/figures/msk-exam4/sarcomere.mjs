// Fig: one sarcomere sliding (MSK Exam 4, L31 Skeletal Muscle). Filament lengths in proportion to the notes
// (thin ~1 µm, thick ~1.6 µm); the sarcomere lengths themselves are schematic (relaxed 2.5, fully contracted 2.0,
// where the thin filaments meet in the middle and the H band disappears, as the notes' table says).
import { fitProjection, iso, figureSvg, plateHtml, f1, esc } from "./shared.mjs";

const W = 640, H = 196;
const U = 140;                 // world units per µm (schematic scale, one scale across the figure)
const THIN = 1.0, THICK = 1.6, BARE = 0.18, SL0 = 2.5, SL1 = 2.0;
const ROWS_THICK = [-30, 0, 30];
const ROWS_THIN = [-45, -15, 15, 45];
const ZH = 58;                 // half-height of the Z discs
const SPAN = 1.95;             // drawn half-width, µm

const P = fitProjection([[-SPAN * U - 30, 0, -100], [SPAN * U + 30, 0, 80]], W, H, { pad: 4, azimuth: 90, elevation: 12 });
const S = (x, z) => iso([x, 0, z], P).map(f1);
const KX = S(1, 0)[0] - S(0, 0)[0];
const X = (um) => um * U;      // µm → world x

const rect = (x0, z0, x1, z1, cls, extra = "") => { const [a, b] = [S(x0, Math.max(z0, z1)), S(x1, Math.min(z0, z1))]; return `<rect class="${cls}" x="${Math.min(a[0], b[0])}" y="${a[1]}" width="${f1(Math.abs(b[0] - a[0]))}" height="${f1(b[1] - a[1])}"${extra}/>`; };
const line = (x0, z0, x1, z1, cls) => { const [a, b] = [S(x0, z0), S(x1, z1)]; return `<path class="${cls}" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}"/>`; };

// Repeating parts as patterns and shared shapes (a few hundred beads and heads as elements would weigh ~130 KB).
// Screen units: the camera is side-on (azimuth 90), so world x and z map linearly onto screen x and y.
const BEAD = 6.2;                         // world spacing of G-actin beads along a strand
const KZA = Math.abs(S(0, 1)[1] - S(0, 0)[1]);
const tileW = f1(2 * BEAD * KX), tnW = f1(7 * BEAD * KX);
const DEFS = `<pattern id="sc-actin-p" patternUnits="userSpaceOnUse" width="${tileW}" height="12" y="-6"><circle cx="${f1(tileW * 0.25)}" cy="${f1(6 - 1.7 * KZA)}" r="2.6"/><circle cx="${f1(tileW * 0.75)}" cy="${f1(6 + 1.7 * KZA)}" r="2.6"/></pattern>`
  + `<pattern id="sc-tn-p" patternUnits="userSpaceOnUse" width="${tnW}" height="8" y="-${f1(4.6 * KZA + 4)}"><circle class="sc-tnt" cx="${f1(tnW * 0.55 - 2.2)}" cy="4.2" r="1.7"/><circle class="sc-tnc" cx="${f1(tnW * 0.55)}" cy="2.6" r="1.9"/><circle class="sc-tni" cx="${f1(tnW * 0.55 + 2.2)}" cy="4.2" r="1.7"/></pattern>`
  + `<g id="sc-hr"><path class="sc-neck" d="M0 0L${f1(3.5 * KX)} ${f1(-4.1 * KZA)}"/><circle class="sc-s1" cx="${f1(3.5 * KX)}" cy="${f1(-4.1 * KZA)}" r="2"/></g>`
  + `<g id="sc-ha"><path class="sc-neck" d="M0 0L${f1(1.8 * KX)} ${f1(-7.6 * KZA)}"/><circle class="sc-s1 sc-s1-att" cx="${f1(1.8 * KX)}" cy="${f1(-7.6 * KZA)}" r="2"/></g>`;

// Thin filament from a Z disc at xz toward dir (+1 right, -1 left), length THIN: F-actin (two bead strands),
// tropomyosin along it, troponin every 7 beads.
function thin(xz, dir, z) {
  const o = S(xz, z), L = f1(THIN * U * KX - 4);
  const x0 = dir > 0 ? 2 : -L - 2;
  return `<g class="sc-thin" transform="translate(${o[0]} ${o[1]})"><rect class="sc-actin" x="${x0}" y="-6" width="${L}" height="12" fill="url(#sc-actin-p)"/><path class="sc-tm" d="M${x0} ${f1(-3.2 * KZA)}h${L}"/><rect class="sc-tn" x="${x0}" y="-${f1(4.6 * KZA + 4)}" width="${L}" height="8" fill="url(#sc-tn-p)"/></g>`;
}
// Thick filament centred at xc (µm): a myosin II rod, bare in the middle, heads on both halves pointing away from M.
// `reach` limits the heads to what can come into view (the neighbours are mostly cropped).
function thick(xc, z, reach = Infinity) {
  const x0 = X(xc - THICK / 2), x1 = X(xc + THICK / 2);
  let heads = "";
  const step = 11;
  const keep = (x) => Math.abs(x) <= reach * U;
  for (let x = X(xc + BARE / 2) + 4; x < x1 - 3; x += step) if (keep(x)) for (const side of [1, -1]) heads += head(x, z, side, 1);
  for (let x = X(xc - BARE / 2) - 4; x > x0 + 3; x -= step) if (keep(x)) for (const side of [1, -1]) heads += head(x, z, side, -1);
  return `<g class="sc-thick">${rect(x0, z - 3.4, x1, z + 3.4, "sc-rod", ' rx="3"')}${line(x0 + 2, z + 1.6, x1 - 2, z + 1.6, "sc-rod-hi")}${heads}</g>`;
}
// A myosin head: one shared shape, mirrored for its side and direction; the live code swaps rest (#sc-hr) and
// attached (#sc-ha) when Ca2+ is on troponin C and the head sits in the overlap.
function head(x, z, side, dir) {
  const b = S(x, z + side * 3.4);
  return `<use class="sc-head" data-x="${f1(x / U)}" href="#sc-hr" transform="translate(${b[0]} ${b[1]})${dir < 0 || side < 0 ? ` scale(${dir} ${side})` : ""}"/>`;
}
function zDisc(x) {
  const pts = [];
  for (let z = -ZH, i = 0; z <= ZH; z += 7.25, i++) pts.push(S(x + (i % 2 ? 2.4 : -2.4), z));
  return `<path class="sc-z" d="M${pts.map((p) => p.join(" ")).join("L")}"/>`;
}

const LZ = X(-SL0 / 2), RZ = X(SL0 / 2);
// groups that move: left Z (+ its thin filaments both ways), right Z, neighbour thick filaments
const leftZ = `<g class="sc-move" data-move="lz">${ROWS_THIN.map((z) => thin(LZ, 1, z) + thin(LZ, -1, z)).join("")}${zDisc(LZ)}</g>`;
const rightZ = `<g class="sc-move" data-move="rz">${ROWS_THIN.map((z) => thin(RZ, -1, z) + thin(RZ, 1, z)).join("")}${zDisc(RZ)}</g>`;
const nbL = `<g class="sc-move sc-nb" data-move="ln">${ROWS_THICK.map((z) => thick(-SL0, z, 2.5)).join("")}</g>`;
const nbR = `<g class="sc-move sc-nb" data-move="rn">${ROWS_THICK.map((z) => thick(SL0, z, 2.5)).join("")}</g>`;
const mid = `<g class="sc-mid">${ROWS_THICK.map((z) => thick(0, z)).join("")}${line(0, -40, 0, 40, "sc-m")}</g>`;

// Band strip under the drawing (the pattern you see in a micrograph). geomAt(c) lays it out for a contraction c
// (0 relaxed, 1 fully contracted); the build bakes c = 0 into the SVG and the live code calls the same function.
const STRIP = { z0: -76, z1: -90 };
const DATA = { kx: KX, U, THIN, THICK, BARE, SL0, SL1, SPAN,
  wide: `0 0 ${W} ${H}`, narrow: (() => { const [a, b] = [S(-1.45 * U, 82), S(1.45 * U, -102)]; return `${a[0]} ${a[1]} ${f1(b[0] - a[0])} ${f1(b[1] - a[1])}`; })(),
  zs: { strip: STRIP, top: 70 },
  pt: (() => { const o = S(0, 0); return { ox: o[0], oy: o[1], kz: S(0, 1)[1] - o[1] }; })() };
function geomAt(c, DATA) {
  var pt = DATA.pt, U = DATA.U, st = DATA.zs.strip;
  var sx = function(um){ return +(pt.ox + um * U * DATA.kx).toFixed(1); };
  var sz = function(z){ return +(pt.oy + z * pt.kz).toFixed(1); };
  var SL = DATA.SL0 - (DATA.SL0 - DATA.SL1) * c, a = DATA.THICK / 2, zl = -SL / 2, zr = SL / 2, h = Math.max(0, SL / 2 - DATA.THIN);
  var box = function(x0, x1, z0, z1){ var l = sx(Math.min(x0, x1)), r = sx(Math.max(x0, x1)); return { x: l, width: +Math.max(0, r - l).toFixed(1), y: sz(z0), height: +(sz(z1) - sz(z0)).toFixed(1) }; };
  var ty = +(sz((st.z0 + st.z1) / 2) + 4.2).toFixed(1), yb = +(sz(st.z1) + 15).toFixed(1), ys = sz(DATA.zs.top);
  var A = {};
  A['[data-band-bg="A"]'] = box(-a, a, DATA.zs.top - 6, st.z0 + 8);
  A['[data-band-bg="H"]'] = box(-h, h, DATA.zs.top - 6, st.z0 + 8);
  A['[data-band="A"]'] = box(-a, a, st.z0, st.z1);
  A['[data-band="H"]'] = box(-h, h, st.z0 + 2.5, st.z1 - 2.5);
  A['[data-band="Il"]'] = box(-(SL - a), -a, st.z0, st.z1);
  A['[data-band="Ir"]'] = box(a, SL - a, st.z0, st.z1);
  A['[data-band="Anl"]'] = box(-DATA.SPAN, -(SL - a), st.z0, st.z1);
  A['[data-band="Anr"]'] = box(SL - a, DATA.SPAN, st.z0, st.z1);
  A['[data-band-bg="Anl"]'] = box(-DATA.SPAN, -(SL - a), DATA.zs.top - 6, st.z0 + 8);
  A['[data-band-bg="Anr"]'] = box(SL - a, DATA.SPAN, DATA.zs.top - 6, st.z0 + 8);
  A['[data-bt="0"]'] = { x: sx((zl - a) / 2), y: ty };
  A['[data-bt="1"]'] = { x: sx(-a + 0.13), y: ty };
  A['[data-bt="2"]'] = { x: sx(0), y: ty, opacity: h > 0.07 ? 1 : 0 };
  A['[data-bt="3"]'] = { x: sx((zr + a) / 2), y: ty };
  var tick = function(um, through){ var x = sx(um); return { d: "M" + x + " " + (through ? sz(st.z0) : sz(st.z1)) + "V" + (sz(st.z1) + 5) }; };
  A[".sc-tz-l"] = tick(zl, true); A[".sc-tz-r"] = tick(zr, true); A[".sc-tm-m"] = tick(0, false);
  A['[data-tt="zl"]'] = { x: sx(zl), y: yb }; A['[data-tt="zr"]'] = { x: sx(zr), y: yb }; A['[data-tt="m"]'] = { x: sx(0), y: yb };
  A[".sc-sarc-line"] = { d: "M" + sx(zl) + " " + ys + "H" + sx(zr) };
  A[".sc-sarc-l"] = { d: "M" + sx(zl) + " " + (ys - 4) + "V" + (ys + 4) };
  A[".sc-sarc-r"] = { d: "M" + sx(zr) + " " + (ys - 4) + "V" + (ys + 4) };
  A[".sc-sarc-t"] = { x: sx(0), y: +(ys - 7).toFixed(1) };
  return { SL: SL, attrs: A };
}
const G0 = geomAt(0, DATA);
const at = (sel) => Object.entries(G0.attrs[sel]).map(([k, v]) => ` ${k}="${v}"`).join("");
const clip = `<clipPath id="sc-clip"><path d="${(() => { const [a, b] = [S(-SPAN * U, 70), S(SPAN * U, -100)]; return `M${a[0]} ${a[1]}H${b[0]}V${b[1]}H${a[0]}Z`; })()}"/></clipPath>`;
const stripBase = rect(-SPAN * U, STRIP.z0, SPAN * U, STRIP.z1, "sc-strip-base");
const bandEls = ["Anl", "Anr", "Il", "A", "H", "Ir"].map((k) => `<rect class="sc-band" data-band="${k}"${at(`[data-band="${k}"]`)}/>`).join("");
const bandText = ["I", "A", "H", "I"].map((k, i) => `<text class="sc-band-t${i === 1 ? " sc-band-t-a" : ""}" data-bt="${i}"${at(`[data-bt="${i}"]`)}>${k}</text>`).join("");
const tick = (cls) => `<path class="sc-tick ${cls}"${at("." + cls)}/>`;
const sarcBar = `<g class="sc-sarc"><path class="sc-sarc-line"${at(".sc-sarc-line")}/><path class="sc-sarc-end sc-sarc-l"${at(".sc-sarc-l")}/><path class="sc-sarc-end sc-sarc-r"${at(".sc-sarc-r")}/><text class="sc-sarc-t"${at(".sc-sarc-t")}>one sarcomere (Z to Z)</text></g>`;

const INFO = {
  thin: "Thin filament (~1 µm × 8 nm), anchored at the Z line: F-actin (two strands of G-actin), tropomyosin covering the myosin-binding sites, and troponin: TnT attaches to tropomyosin, TnC binds Ca2+, TnI inhibits the actin-myosin interaction.",
  thick: "Thick filament (~1.6 µm × 15 nm): myosin II. The S1 heads carry the ATPase (motor) and the actin-binding site; they stick out on both halves, pointing away from the M line.",
  z: "Z line: anchors the thin filaments. A sarcomere runs from one Z line to the next, and the Z line crosses the middle of each I band.",
  m: "M line: holds the thick filaments in register, in the middle of the A band.",
  strip: "Bands: A = the whole length of the thick filaments (stays the same); I = thin filaments only (shortens); H = thick filaments only, in the middle of A (shortens, gone at full contraction).",
};
const hot = (key, inner) => `<g class="hot" tabindex="0" data-part="${key}" data-info="${esc(INFO[key])}">${inner}</g>`;

const body = [
  `<defs>${clip}${DEFS}</defs>`,
  `<g clip-path="url(#sc-clip)">`,
  `<rect class="sc-aband-bg" data-band-bg="Anl"${at('[data-band-bg="Anl"]')}/><rect class="sc-aband-bg" data-band-bg="Anr"${at('[data-band-bg="Anr"]')}/><rect class="sc-aband-bg" data-band-bg="A"${at('[data-band-bg="A"]')}/><rect class="sc-hband-bg" data-band-bg="H"${at('[data-band-bg="H"]')}/>`,
  hot("thick", nbL + nbR + mid),
  hot("thin", leftZ + rightZ),
  `</g>`,
  hot("m", `<g>${line(0, -44, 0, 44, "sc-m-hit")}</g>`),
  hot("strip", `<g class="sc-strip">${stripBase}${bandEls}${bandText}${tick("sc-tz-l")}${tick("sc-tz-r")}${tick("sc-tm-m")}<text class="sc-tick-t" data-tt="zl"${at('[data-tt="zl"]')}>Z</text><text class="sc-tick-t" data-tt="m"${at('[data-tt="m"]')}>M</text><text class="sc-tick-t" data-tt="zr"${at('[data-tt="zr"]')}>Z</text></g>`),
  sarcBar,
].join("");

const svgFig = figureSvg({ width: W, height: H, className: "sc-fig",
  label: "Schematic longitudinal section of one skeletal muscle sarcomere between two Z lines: thin actin filaments with tropomyosin and troponin anchored at each Z line, thick myosin II filaments with heads held at the M line in the middle, and a band strip below showing the I, A and H bands. A slider shortens the sarcomere: the thin filaments slide toward the M line, the I and H bands shorten and the A band stays the same.",
  body });

const plate = plateHtml({ fig: "Fig 1", title: "The sliding sarcomere", hint: "drag the slider", readout: "relaxed", body: `<div class="am-svg">${svgFig}</div>` });

const controls = `<div class="am-controls sc-controls"><label class="sc-slider"><span>Relaxed</span><input type="range" min="0" max="100" value="0" aria-label="Contraction, from relaxed to fully contracted"><span>Fully contracted</span></label><button type="button" class="am-btn sc-play" aria-pressed="false">Play</button></div>
<div class="sc-bands" aria-live="polite"><span><b>A band</b> <em data-r="A"></em></span><span><b>I band</b> <em data-r="I"></em></span><span><b>H band</b> <em data-r="H"></em></span><span><b>Z to Z</b> <em data-r="S"></em></span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap or hover a filament, a line or the band strip for what it is.</p>`;

const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Drawn from the hub's L31 (Skeletal Muscle, Dr. Latimer) notes: the sarcomere from Z to Z, the A, I and H bands and what happens to each on contraction, the thin filament's actin, tropomyosin and troponin, and myosin II's S1 heads.</li>
<li>Filament lengths are in proportion to the notes (thin ~1 µm, thick ~1.6 µm). The sarcomere lengths (2.5 relaxed, 2.0 fully contracted) are schematic, chosen so the H band just disappears at full contraction as the notes' table says; widths, the number of filaments and the spacing of heads and troponin are not to scale.</li>
<li>A real sarcomere is a lattice (each thick filament in a hexagon of thin filaments); this is one longitudinal slice.</li></ul></details>`;

function sarcLive(root, DATA) {
  var svg = root.querySelector(".sc-fig");
  var slider = root.querySelector('input[type="range"]');
  var playBtn = root.querySelector(".sc-play");
  var readout = root.querySelector("[data-readout]");
  var summary = root.querySelector(".am-summary");
  var infoEl = root.querySelector(".am-info");
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var moves = {}; Array.prototype.forEach.call(svg.querySelectorAll("[data-move]"), function(g){ moves[g.getAttribute("data-move")] = g; });
  var heads = Array.prototype.slice.call(svg.querySelectorAll(".sc-head"));
  var rs = {}; Array.prototype.forEach.call(root.querySelectorAll("[data-r]"), function(e){ rs[e.getAttribute("data-r")] = e; });
  var U = DATA.U, geomAt = DATA.geomAt;
  var c = 0, target = 0, prev = 0, playing = false, tourT = 0, frame = 0, last = 0, visible = true;
  function draw(){
    var g = geomAt(c, DATA), SL = g.SL, dz = (DATA.SL0 - SL) / 2;
    var px = function(um){ return (um * U * DATA.kx).toFixed(2); };
    moves.lz.setAttribute("transform", "translate(" + px(dz) + " 0)");
    moves.rz.setAttribute("transform", "translate(" + px(-dz) + " 0)");
    moves.ln.setAttribute("transform", "translate(" + px(2 * dz) + " 0)");
    moves.rn.setAttribute("transform", "translate(" + px(-2 * dz) + " 0)");
    Object.keys(g.attrs).forEach(function(sel){ var el = svg.querySelector(sel); if(!el) return; var at = g.attrs[sel]; for(var k in at) el.setAttribute(k, at[k]); });
    // cross-bridges: Ca2+ on troponin C moves tropomyosin off the sites; heads in the overlap attach while the sarcomere is held or shortening
    var ca = c > 0.01 || target > 0.01;
    svg.dataset.ca = ca ? "1" : "";
    var tip = SL / 2 - DATA.THIN;
    heads.forEach(function(h){ var x = Math.abs(parseFloat(h.getAttribute("data-x"))), href = ca && x >= tip && x <= tip + DATA.THIN ? "#sc-ha" : "#sc-hr"; if(h.getAttribute("href") !== href) h.setAttribute("href", href); });
    var I = SL - DATA.THICK, Hh = Math.max(0, SL - 2 * DATA.THIN);
    var I0 = DATA.SL0 - DATA.THICK, H0 = DATA.SL0 - 2 * DATA.THIN;
    rs.A.textContent = "same";
    rs.I.textContent = c < 0.02 ? "full length" : Math.round(100 * I / I0) + "% of relaxed";
    rs.H.textContent = Hh < 0.005 ? "gone" : c < 0.02 ? "full length" : Math.round(100 * Hh / H0) + "% of relaxed";
    rs.S.textContent = c < 0.02 ? "relaxed" : Math.round(100 * SL / DATA.SL0) + "% of relaxed";
    var state = c < 0.02 ? (ca ? "Ca2+ on troponin C" : "relaxed") : c > 0.98 ? "fully contracted" : (c > prev + 1e-4 ? "shortening" : c < prev - 1e-4 ? "relaxing" : "held");
    if(readout.textContent !== state) readout.textContent = state;
    var text = c < 0.02 && !ca ? "Relaxed: tropomyosin covers the myosin-binding sites on actin, so the heads can't attach. The I and H bands are at full length." :
      c > 0.98 ? "Fully contracted: the thin filaments have slid to the middle, so the H band is gone and the I band is short. The A band, the length of the thick filaments, never changed: the filaments slide past each other; neither one shortens." :
      "Ca2+ released from the SR binds troponin C; troponin-tropomyosin shift off the binding sites and the myosin heads in the overlap form cross-bridges. Each cycle (ATP binds and the head releases, ATP is hydrolyzed and the head cocks, weak binding, Pi release, power stroke, ADP release) pulls the thin filaments toward the M line. The Z lines come closer; the I and H bands shorten; the A band stays the same. To relax, SERCA pumps Ca2+ back into the SR.";
    if(summary.textContent !== text) summary.textContent = text;
    prev = c;
  }
  function step(dt){
    if(playing){ tourT += dt; var u = (tourT % 6) / 6; target = u < 0.15 ? 0 : u < 0.5 ? (u - 0.15) / 0.35 : u < 0.65 ? 1 : u < 0.95 ? 1 - (u - 0.65) / 0.3 : 0; target = target * target * (3 - 2 * target); slider.value = Math.round(target * 100); }
    c += (target - c) * (1 - Math.exp(-dt / 0.18));
    if(Math.abs(target - c) < 0.0005) c = target;
  }
  function tick(now){
    frame = 0;
    if(!root.isConnected || !visible) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    step(dt); draw();
    if(playing || Math.abs(target - c) > 0.0005) frame = requestAnimationFrame(tick);
  }
  function kick(){ if(!frame && visible){ last = 0; frame = requestAnimationFrame(tick); } }
  slider.addEventListener("input", function(){ if(playing) setPlaying(false); target = slider.value / 100; if(reduce.matches){ c = target; draw(); } else kick(); });
  function setPlaying(v){ playing = v; playBtn.textContent = v ? "Pause" : "Play"; playBtn.setAttribute("aria-pressed", String(v)); if(v){ tourT = target * 3; kick(); } }
  playBtn.addEventListener("click", function(){ setPlaying(!playing); });
  var idle = infoEl.textContent;
  Array.prototype.forEach.call(svg.querySelectorAll(".hot"), function(el){
    var on = function(){ infoEl.textContent = el.getAttribute("data-info"); el.classList.add("is-hot"); };
    var off = function(){ el.classList.remove("is-hot"); };
    el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off);
    el.addEventListener("focus", on); el.addEventListener("blur", off); el.addEventListener("click", on);
  });
  if("IntersectionObserver" in window) new IntersectionObserver(function(en){ visible = en[0].isIntersecting; if(visible) kick(); }).observe(svg);
  var mq = window.matchMedia ? window.matchMedia("(max-width:560px)") : null;
  var fit = function(){ svg.setAttribute("viewBox", mq && mq.matches ? DATA.narrow : DATA.wide); };
  if(mq){ fit(); if(mq.addEventListener) mq.addEventListener("change", fit); }
  draw();
  root.__anima = { set: function(v){ target = c = prev = v; slider.value = Math.round(v * 100); draw(); } };
}

const CSS = `
.anima .sc-aband-bg{fill:var(--anatomy-shade-1);opacity:.9}
.anima .sc-hband-bg{fill:var(--anatomy-card)}
.anima #sc-actin-p circle{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.7}
.anima .sc-s1-att{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.anima .sc-tm{fill:none;stroke:var(--anatomy-mid);stroke-width:1.3;stroke-linecap:round;transition:transform .3s}
.anima .sc-fig[data-ca="1"] .sc-tm{transform:translateY(-1.6px)}
.anima #sc-tn-p circle{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.7}
.anima .sc-fig[data-ca="1"] .sc-tnc{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.anima .sc-nb{opacity:.45}
.anima .sc-rod{fill:var(--anatomy-shade-0);stroke:var(--anatomy-hi);stroke-width:1}
.anima .sc-rod-hi{fill:none;stroke:var(--anatomy-top);stroke-width:1.1;stroke-linecap:round;opacity:.9}
.anima .sc-neck{fill:none;stroke:var(--anatomy-hi);stroke-width:.9;stroke-linecap:round}
.anima .sc-s1{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.8}
.anima .sc-z{fill:none;stroke:var(--anatomy-hi);stroke-width:2.2;stroke-linejoin:round}
.anima .sc-m{fill:none;stroke:var(--anatomy-hi);stroke-width:1.6}
.anima .sc-m-hit{stroke:transparent;stroke-width:8;fill:none}
.anima .sc-strip-base{fill:var(--anatomy-shade-3);stroke:var(--anatomy-mid);stroke-width:.8}
.anima .sc-band[data-band="Anl"],.anima .sc-band[data-band="Anr"]{fill:var(--anatomy-shade-0);stroke:var(--anatomy-mid);stroke-width:.8;opacity:.7}
.anima .sc-band[data-band="A"]{fill:var(--anatomy-shade-0);stroke:var(--anatomy-hi);stroke-width:.8}
.anima .sc-band[data-band="H"]{fill:var(--anatomy-shade-2);stroke:none}
.anima .sc-band[data-band="Il"],.anima .sc-band[data-band="Ir"]{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:.8}
.anima .sc-band-t{fill:var(--anatomy-strong);font:600 12px var(--anatomy-mono);text-anchor:middle}
.anima .sc-band-t-a{text-anchor:start}
.anima .sc-tick{fill:none;stroke:var(--anatomy-hi);stroke-width:1.2}
.anima .sc-tick-t{fill:var(--anatomy-text);font:11px var(--anatomy-mono);text-anchor:middle}
.anima .sc-sarc-line,.anima .sc-sarc-end{fill:none;stroke:var(--anatomy-lit);stroke-width:1.4}
.anima .sc-sarc-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono);text-anchor:middle}
.anima .sc-controls{gap:10px 16px}
.anima .sc-slider{display:flex;align-items:center;gap:10px;flex:1 1 300px;font:.78rem var(--font-mono);color:var(--ink-soft)}
.anima .sc-slider input{flex:1;accent-color:var(--accent);min-width:120px}
.anima .sc-bands{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px 14px;margin:6px 0 2px;font:.8rem var(--font-mono);color:var(--ink-soft)}
.anima .sc-bands b{color:var(--ink);font-weight:600}
.anima .sc-bands em{font-style:normal}
@media (prefers-reduced-motion:reduce){.anima #sc-actin-p circle{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:.7}
.anima .sc-s1-att{fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.anima .sc-tm{transition:none}}
`;

export function sarcomere() {
  return {
    id: "sarcomere",
    title: "The sliding sarcomere",
    caption: "Drag the slider to contract it. Schematic; filament lengths in proportion to the L31 notes.",
    html: `<div class="anima" data-anima="sarcomere">${plate}${controls}${SOURCES}</div>`,
    css: CSS,
    live: sarcLive.toString(),
    helpers: { geomAt: geomAt.toString() },
    data: DATA,
    still: { svg: svgFig },
  };
}
