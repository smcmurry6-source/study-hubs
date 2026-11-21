// Shared pieces for the Heme & Endo Exam 2 anima figures: the kit's frame and CSS mapped onto the hub's palette
// ("Luteal": aubergine ink, berry accent, corpus-luteum gold), plus one generic live controller every figure uses
// (copied from tools/figures/pcd-implants-exam1). Built offline (node tools/figures/heme-endo-exam2/build.mjs) and
// pasted into hubs/heme-endo-exam2/index.html; nothing here loads at runtime.
import { ISO_CSS, figureSvg, plateHtml } from "../../../.claude/skills/anima/kit/iso-kit.mjs";
export { figureSvg, plateHtml };

// Material colors for the drawings: H&E stains (hematoxylin purple nuclei, eosin pink cytoplasm and matrix), membranes,
// blood, lumens, steroid gold, insulin teal, glucose amber, and the signal colors (stimulate, inhibit, hot). The hub sets
// data-theme on <html>, so dark values follow the hub's own selectors.
const LIGHT = `--anatomy-shade-0:#ece2e6;--anatomy-shade-1:#f1e8eb;--anatomy-shade-2:#f5eef0;--anatomy-shade-3:#f9f4f5;
  --anatomy-face:#fdfafb;--anatomy-top:#ffffff;--anatomy-hi:#2a1c27;--anatomy-mid:#7a6574;--anatomy-lo:#c3b2bc;--anatomy-faint:#e9dde2;
  --anatomy-dot:#2a1c27;--bx-nuc:#5b3f8f;--bx-nuc-line:#3d2866;--bx-cyto:#f6cfdf;--bx-cyto-line:#c0638c;--bx-eosin:#ee9fbf;--bx-matrix:#fbe3ec;
  --bx-memb:#8c2f5a;--bx-lumen:#fffaf3;--bx-blood:#c8333b;--bx-blood-soft:#f6d3d0;--bx-fat:#fffdf7;--bx-fat-line:#d9c7b5;
  --bx-gold:#e2a82b;--bx-gold-soft:#fbecc4;--bx-ins:#1f7f78;--bx-ins-soft:#d5ecea;--bx-glu:#d0812b;--bx-glu-soft:#f7e2c6;
  --bx-blue:#2f62a8;--bx-blue-soft:#dce6f4;--bx-violet:#6a4fa5;--bx-violet-soft:#e7e0f3;--bx-sperm:#3d4fa8;
  --bx-stim:#2f7a4f;--bx-inhib:#b8322f;--bx-hot:#d0642b;--bx-hot-soft:#f7dccb;`;
const DARK = `--anatomy-shade-0:#1b1419;--anatomy-shade-1:#21191f;--anatomy-shade-2:#271e25;--anatomy-shade-3:#2e242c;
  --anatomy-face:#2e242c;--anatomy-top:#372c35;--anatomy-hi:#f3e9ef;--anatomy-mid:#b39fac;--anatomy-lo:#66535f;--anatomy-faint:#3a2e37;
  --anatomy-dot:#f3e9ef;--bx-nuc:#b9a2ee;--bx-nuc-line:#d9cbfb;--bx-cyto:#5a2f43;--bx-cyto-line:#e48fb4;--bx-eosin:#a8577a;--bx-matrix:#3c2430;
  --bx-memb:#ec9ac0;--bx-lumen:#1f1a1d;--bx-blood:#ef7a7f;--bx-blood-soft:#4a2224;--bx-fat:#2a2524;--bx-fat-line:#6b5d50;
  --bx-gold:#f0c457;--bx-gold-soft:#4a3816;--bx-ins:#5cc2bb;--bx-ins-soft:#15312f;--bx-glu:#f0a55a;--bx-glu-soft:#46301a;
  --bx-blue:#7fa9e0;--bx-blue-soft:#1b2a3c;--bx-violet:#ad95e0;--bx-violet-soft:#2a2240;--bx-sperm:#8d9cf0;
  --bx-stim:#6fc28d;--bx-inhib:#ef8a78;--bx-hot:#f0955a;--bx-hot-soft:#4a2b18;`;
const TOKENS = `
.anima{--anatomy-page:var(--bg);--anatomy-card:var(--surface);--anatomy-paper:var(--surface);
  --anatomy-text:var(--ink-soft);--anatomy-strong:var(--ink);--anatomy-muted:var(--ink-faint);
  --anatomy-lit:var(--accent);--anatomy-weight:.6px;--anatomy-mono:var(--font-mono);
  ${LIGHT}}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima{${DARK}} }
:root[data-theme="dark"] .anima{${DARK}}
`;
function kitRules() {
  const css = ISO_CSS.replace(/\.iso\{[^}]*\}/, "").replace(/\.iso\[data-theme="light"\]\{[^}]*\}/, "");
  if (/\.iso\{|\.iso\[data-theme/.test(css)) throw new Error("ISO_CSS theme blocks not stripped");
  return css;
}
const HUB = `
.anima{color:var(--anatomy-text)}
.anima .iso-figure{margin:0}
.anima .iso-plate{border-radius:var(--radius);box-shadow:0 0 0 1px var(--line);padding:40px 12px 40px;background:var(--surface)}
.anima .iso-plate-corners{inset:14px 16px}
.anima .iso-plate-corner{font-size:10.5px}
@media (max-width:560px){.anima .iso-plate{padding:36px 6px 54px}.anima .iso-plate-corner[data-corner="hint"]{bottom:16px}.anima .iso-plate-corner[data-corner="readout"]{white-space:normal;text-align:right;max-width:58%}}
.anima .am-svg{max-width:660px;margin:0 auto}
.anima .am-svg svg{display:block;width:100%;height:auto;overflow:hidden}
.anima .am-svg svg *{vector-effect:none}
.anima .hot{cursor:help;outline:none}
.anima .hot:hover{filter:drop-shadow(0 0 3px var(--anatomy-lit))}
.anima .am-controls{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:12px 0 6px;font:13px var(--font-body);color:var(--ink)}
.anima .am-slider{display:flex;align-items:center;gap:10px;flex:1 1 300px;font:.78rem var(--font-mono);color:var(--ink-soft)}
.anima .am-slider input{flex:1;accent-color:var(--accent);min-width:120px}
.anima .am-btn{border:1px solid var(--line-strong);border-radius:8px;background:transparent;color:var(--ink-soft);font:500 .8rem var(--font-body);padding:5px 10px;cursor:pointer}
.anima .am-btn[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-ink);border-color:var(--accent)}
.anima .am-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.anima .am-summary{font-size:.92rem;line-height:1.55;color:var(--ink);margin:8px 0;min-height:3.2em}
.anima .am-info{font-size:.86rem;line-height:1.5;color:var(--ink-soft);margin:6px 0;border-left:2px solid var(--line-strong);padding-left:10px;min-height:2.4em}
.anima .am-sources{font-size:.82rem;line-height:1.55;color:var(--ink-soft);margin:8px 0 0}
.anima .am-sources summary{cursor:pointer;font-weight:600;color:var(--ink-soft)}
.anima .am-sources ul{padding-left:18px;margin:6px 0}
.anima .am-sources li{margin:4px 0}
.anima svg .t{fill:var(--anatomy-text);font:13.5px var(--anatomy-mono);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.anima svg .t.s{font-size:12px}
.anima svg .t.b{fill:var(--anatomy-strong);font-weight:600}
.anima svg .t.hot-t{fill:var(--bx-hot);font-weight:600}
.anima svg .t.ok{fill:var(--bx-stim);font-weight:600}
.anima svg .t.bad{fill:var(--bx-inhib);font-weight:600}
.anima svg .t.mut{fill:var(--anatomy-muted)}
.anima svg .lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima svg .dot{fill:var(--anatomy-dot)}
.anima svg .dim{fill:none;stroke:var(--bx-hot);stroke-width:1.3}
.anima svg .nuc{fill:var(--bx-nuc);stroke:var(--bx-nuc-line);stroke-width:1}
.anima svg .cyto{fill:var(--bx-cyto);stroke:var(--bx-cyto-line);stroke-width:1.2}
.anima svg .eosin{fill:var(--bx-eosin)}
.anima svg .matrix{fill:var(--bx-matrix)}
.anima svg .memb{fill:none;stroke:var(--bx-memb);stroke-width:2}
.anima svg .lumen{fill:var(--bx-lumen);stroke:var(--bx-cyto-line);stroke-width:1}
.anima svg .blood{fill:var(--bx-blood)}
.anima svg .vessel{fill:var(--bx-blood-soft);stroke:var(--bx-blood);stroke-width:1.2}
.anima svg .fat{fill:var(--bx-fat);stroke:var(--bx-fat-line);stroke-width:1}
.anima svg .gold{fill:var(--bx-gold-soft);stroke:var(--bx-gold);stroke-width:1.4}
.anima svg .ins{fill:var(--bx-ins)}
.anima svg .glu{fill:var(--bx-glu)}
.anima svg .box{fill:var(--anatomy-face);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima svg .stim{fill:none;stroke:var(--bx-stim);stroke-width:2}
.anima svg .inhib{fill:none;stroke:var(--bx-inhib);stroke-width:2;stroke-dasharray:5 3}
.anima svg .hotline{fill:none;stroke:var(--bx-hot);stroke-width:2}
.anima svg .badfill{fill:var(--bx-inhib);opacity:.16}
.anima svg .grid{fill:none;stroke:var(--anatomy-faint);stroke-width:1}
.anima svg .axis{fill:none;stroke:var(--anatomy-mid);stroke-width:1}
.lec-fig{margin:0}
.lec-fig > h4{margin:0 0 4px;font-size:1rem}
.lec-fig > .lec-fig-cap{margin:0 0 10px;font-size:.86rem;color:var(--ink-soft)}
`;
export function baseCss() { return TOKENS + kitRules() + HUB; }

/* drawing helpers shared by every figure; they run in the page too (helpers are serialized with each figure) */
export function f1(n) { return Math.round(n * 10) / 10; }
export function T(x, y, s, cls, a) { return '<text class="t' + (cls ? " " + cls : "") + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (a ? ' text-anchor="' + a + '"' : "") + ">" + s + "</text>"; }
export function L(x, y, s, px, py, a, cls) { return '<g class="am-callout"><path class="lead" d="M' + f1(a === "end" ? x + 3 : x - 3) + " " + f1(y - 4) + "L" + f1(px) + " " + f1(py) + '"/><circle class="dot" cx="' + f1(px) + '" cy="' + f1(py) + '" r="1.8"/>' + T(x, y, s, cls, a) + "</g>"; }
export function DIM(x1, y1, x2, y2, s, tx, ty, a) { var o = '<path class="dim" d="M' + f1(x1) + " " + f1(y1) + "L" + f1(x2) + " " + f1(y2) + '"/>'; var v = x1 === x2; o += '<path class="dim" d="M' + f1(v ? x1 - 4 : x1) + " " + f1(v ? y1 : y1 - 4) + "L" + f1(v ? x1 + 4 : x1) + " " + f1(v ? y1 : y1 + 4) + "M" + f1(v ? x2 - 4 : x2) + " " + f1(v ? y2 : y2 - 4) + "L" + f1(v ? x2 + 4 : x2) + " " + f1(v ? y2 : y2 + 4) + '"/>'; return o + T(tx, ty, s, "hot-t s", a); }
export function HOT(info, inner) { return '<g class="hot" data-info="' + String(info).replace(/"/g, "&quot;") + '">' + inner + "</g>"; }
/* one live controller for every figure: buttons [data-amk][data-amv] set a state key, [data-amt] toggles one,
   range inputs [data-amk] set a number (either one then calls D[D.ONSET](st, key, D) if the figure names a helper there), [data-amstep] steps D.STEPKEY, [data-amplay] plays it; D[D.RENDER](st, D)
   redraws the SVG and D[D.SAY](st, D) returns [summary, readout]. Hover or tap a .hot part to read its data-info. */
export function amLive(root, D) {
  var st = JSON.parse(JSON.stringify(D.INIT)), svg = root.querySelector(".am-svg svg"), sum = root.querySelector(".am-summary"), info = root.querySelector(".am-info"), ro = root.querySelector("[data-readout]"), timer = 0;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false }, raf = 0, t0 = performance.now(), visible = true;
  function sync() { Array.prototype.forEach.call(root.querySelectorAll("[data-amk]"), function (b) { var k = b.getAttribute("data-amk"); if (b.tagName === "INPUT") b.value = st[k]; else b.setAttribute("aria-pressed", String(String(st[k]) === b.getAttribute("data-amv"))); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-amt]"), function (b) { b.setAttribute("aria-pressed", String(!!st[b.getAttribute("data-amt")])); }); }
  function draw(now) { st.t = D.ANIM && !reduce.matches ? (now || performance.now()) - t0 : 0; svg.innerHTML = D[D.RENDER](st, D); }
  function update() { draw(); var r = D[D.SAY](st, D); if (sum.textContent !== r[0]) sum.textContent = r[0]; if (ro) ro.textContent = r[1]; sync(); }
  function loop(now) { draw(now); raf = visible && D.ANIM && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!raf && visible && D.ANIM && !reduce.matches) raf = requestAnimationFrame(loop); }
  function stop() { clearInterval(timer); timer = 0; var p = root.querySelector("[data-amplay]"); if (p) { p.setAttribute("aria-pressed", "false"); p.textContent = "Play"; } }
  function stepTo(v) { st[D.STEPKEY] = Math.max(0, Math.min(D.STEPMAX, v)); update(); }
  root.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button"); if (!b || !root.contains(b)) return;
    if (b.hasAttribute("data-amk")) { var v = b.getAttribute("data-amv"); st[b.getAttribute("data-amk")] = isNaN(+v) ? v : +v; if (D.ONSET) D[D.ONSET](st, b.getAttribute("data-amk"), D); stop(); update(); }
    else if (b.hasAttribute("data-amt")) { var k = b.getAttribute("data-amt"); st[k] = !st[k]; update(); }
    else if (b.hasAttribute("data-amstep")) { stop(); stepTo(st[D.STEPKEY] + +b.getAttribute("data-amstep")); }
    else if (b.hasAttribute("data-amplay")) { if (timer) { stop(); return; } b.setAttribute("aria-pressed", "true"); b.textContent = "Pause"; if (st[D.STEPKEY] >= D.STEPMAX) stepTo(0);
      timer = setInterval(function () { if (st[D.STEPKEY] >= D.STEPMAX) { stop(); return; } stepTo(st[D.STEPKEY] + (D.PLAYSTEP || 1)); }, D.PLAYMS || 2400); }
  });
  Array.prototype.forEach.call(root.querySelectorAll('input[type="range"][data-amk]'), function (inp) { inp.addEventListener("input", function () { stop(); st[inp.getAttribute("data-amk")] = +inp.value; if (D.ONSET) D[D.ONSET](st, inp.getAttribute("data-amk"), D); update(); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) info.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  update(); kick();
}

export const HELPERS = [f1, T, L, DIM, HOT];

/* assemble one figure's record for build.mjs */
export function makeFig({ id, lec, title, caption, fig, short, hint, W, H, label, D, render, say, helpers = [], controls, sources, css = "" }) {
  const all = HELPERS.concat(helpers);
  const env = {}; all.forEach((fn) => { env[fn.name] = fn; });
  D = Object.assign({ RENDER: render.name, SAY: say.name }, D);
  const D0 = Object.assign({ [render.name]: render, [say.name]: say }, env, D);
  // the static copy: render the starting state once (the page redraws it on mount)
  const body = render(Object.assign({ t: 0 }, D.INIT), D0);
  const svg = figureSvg({ width: W, height: H, className: id + "-svg", label, body });
  const plate = plateHtml({ fig, title: short, hint, readout: say(Object.assign({ t: 0 }, D.INIT), D0)[1], body: `<div class="am-svg">${svg}</div>` });
  const src = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>${sources.map((s) => `<li>${s}</li>`).join("")}</ul></details>`;
  return { id, lec, title, caption, css, live: amLive.toString(), helpers: all.concat([render, say]), data: D,
    html: `<div class="anima" data-anima="${id}">${plate}${controls}<p class="am-summary" aria-live="polite"></p><p class="am-info">Hover or tap a part of the drawing to read about it.</p>${src}</div>` };
}

/* the material colors, for the static drawn figures (FIGS) that sit outside .anima */
export { LIGHT, DARK };
