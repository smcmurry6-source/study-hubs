// Shared pieces for the PCD Implants Exam 1 anima figures: the kit's frame and CSS mapped onto the hub's palette
// ("Anodized": titanium blue-gray), plus one generic live controller every figure uses. Built offline
// (node tools/figures/pcd-implants-exam1/build.mjs) and pasted into hubs/pcd-implants-exam1/index.html; nothing here
// loads at runtime.
import { ISO_CSS, figureSvg, plateHtml } from "../../../.claude/skills/anima/kit/iso-kit.mjs";
export { figureSvg, plateHtml };

// Material colors for the drawings: titanium, porcelain crown, enamel/dentin, cortical and trabecular bone, gingiva,
// epithelium, PDL. The hub sets data-theme on <html>, so dark values follow the hub's own selectors.
const LIGHT = `--anatomy-shade-0:#dfe4ea;--anatomy-shade-1:#e7ebf0;--anatomy-shade-2:#eef1f5;--anatomy-shade-3:#f5f7f9;
  --anatomy-face:#fbfcfd;--anatomy-top:#ffffff;--anatomy-hi:#1b2430;--anatomy-mid:#6b7686;--anatomy-lo:#b4bcc7;--anatomy-faint:#dde2e8;
  --anatomy-dot:#1b2430;--im-ti:#aab6c4;--im-ti-line:#4f5d6e;--im-ti-hi:#d8dfe7;--im-crown:#f4efe4;--im-crown-line:#a79b80;
  --im-enamel:#f7f3ea;--im-dentin:#ecdcb8;--im-dentin-line:#b39a63;--im-cort:#e9dcc0;--im-cort-line:#a58c5b;--im-trab:#f3ead6;
  --im-marrow:#f0d2c4;--im-gum:#f2c4c9;--im-gum-line:#c26b78;--im-epi:#e59aa6;--im-pdl:#d9758a;--im-fiber:#9a3f55;
  --im-hot:#d0642b;--im-hot-soft:#f7dccb;--im-ok:#2f7a4f;--im-bad:#b8322f;--im-ray:#d9a21b;--im-light:#58a9d8;--im-sig:#6a4fa5;`;
const DARK = `--anatomy-shade-0:#151b22;--anatomy-shade-1:#1a212a;--anatomy-shade-2:#1f2731;--anatomy-shade-3:#252e39;
  --anatomy-face:#252e39;--anatomy-top:#2d3744;--anatomy-hi:#e8edf3;--anatomy-mid:#9aa6b6;--anatomy-lo:#56616f;--anatomy-faint:#323c48;
  --anatomy-dot:#e8edf3;--im-ti:#6b7a8c;--im-ti-line:#c6d1de;--im-ti-hi:#8c9aab;--im-crown:#4a4538;--im-crown-line:#cbbd9b;
  --im-enamel:#4e4a40;--im-dentin:#5c5032;--im-dentin-line:#cdb57e;--im-cort:#5a4f38;--im-cort-line:#c9b07c;--im-trab:#3e3729;
  --im-marrow:#53352d;--im-gum:#5e3036;--im-gum-line:#e4909c;--im-epi:#a85a69;--im-pdl:#c46a7e;--im-fiber:#f0a3b4;
  --im-hot:#f0955a;--im-hot-soft:#4a2b18;--im-ok:#6fc28d;--im-bad:#ef8a78;--im-ray:#f0c457;--im-light:#7cc4ec;--im-sig:#ad95e0;`;
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
.anima svg .t.hot-t{fill:var(--im-hot);font-weight:600}
.anima svg .t.ok{fill:var(--im-ok);font-weight:600}
.anima svg .t.bad{fill:var(--im-bad);font-weight:600}
.anima svg .t.mut{fill:var(--anatomy-muted)}
.anima svg .lead{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima svg .dot{fill:var(--anatomy-dot)}
.anima svg .dim{fill:none;stroke:var(--im-hot);stroke-width:1.3}
.anima svg .ti{fill:var(--im-ti);stroke:var(--im-ti-line);stroke-width:1.2}
.anima svg .ti-hi{fill:var(--im-ti-hi);stroke:var(--im-ti-line);stroke-width:1}
.anima svg .crown{fill:var(--im-crown);stroke:var(--im-crown-line);stroke-width:1.2}
.anima svg .enamel{fill:var(--im-enamel);stroke:var(--im-dentin-line);stroke-width:1}
.anima svg .dentin{fill:var(--im-dentin);stroke:var(--im-dentin-line);stroke-width:1.2}
.anima svg .cort{fill:var(--im-cort);stroke:var(--im-cort-line);stroke-width:1.2}
.anima svg .trab{fill:var(--im-trab);stroke:var(--im-cort-line);stroke-width:.8}
.anima svg .marrow{fill:var(--im-marrow);opacity:.55}
.anima svg .gum{fill:var(--im-gum);stroke:var(--im-gum-line);stroke-width:1.2}
.anima svg .epi{fill:var(--im-epi);opacity:.85}
.anima svg .pdl{fill:none;stroke:var(--im-pdl);stroke-width:3}
.anima svg .fib{fill:none;stroke:var(--im-fiber);stroke-width:1.1}
.anima svg .hotline{fill:none;stroke:var(--im-hot);stroke-width:2}
.anima svg .okline{fill:none;stroke:var(--im-ok);stroke-width:2}
.anima svg .badfill{fill:var(--im-bad);opacity:.18}
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
/* a threaded implant body, centered at x, platform at y0, length h, width w (screw threads as a zigzag) */
export function SCREW(x, y0, w, h, taper) { var o = "", n = Math.max(4, Math.round(h / 11)), hw = w / 2, tp = taper || 0, pts = [], i;
  for (i = 0; i <= n; i++) { var y = y0 + (h * i) / n, k = hw - tp * (i / n); pts.push([x - k - (i % 2 ? 3 : 0), y]); }
  var r = pts.map(function (p) { return [2 * x - p[0], p[1]]; }).reverse();
  var d = "M" + pts.map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + "Q" + f1(x) + " " + f1(y0 + h + 8) + " " + f1(r[0][0]) + " " + f1(r[0][1]) + "L" + r.map(function (p) { return f1(p[0]) + " " + f1(p[1]); }).join("L") + "Z";
  o += '<path class="ti" d="' + d + '"/>'; return o; }

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

export const HELPERS = [f1, T, L, DIM, HOT, SCREW];

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
