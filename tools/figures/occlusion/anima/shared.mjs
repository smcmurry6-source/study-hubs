// Shared pieces for the Occlusion anima figures: the kit's frame and CSS, mapped onto the hub's palette.
// Built offline (node tools/figures/occlusion/build.mjs) and pasted into hubs/occlusion/index.html; nothing here loads at runtime.
import { ISO_CSS, figureSvg, plateHtml } from "../../../../.claude/skills/anima/kit/iso-kit.mjs";

export { figureSvg, plateHtml };
export const f1 = (v) => +(+v).toFixed(1);
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* smooth path through points (Catmull-Rom as cubic Bezier), same as the hub's OD.smooth */
export function smooth(pts, closed) {
  const n = pts.length; let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`; const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    let p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (closed ? "Z" : "");
}

// The kit's tokens on the hub's palette ("articulating paper": warm paper, navy ink, blue accent). The hub sets
// data-theme on <html>, so the dark values follow the same selectors as the hub's own :root blocks.
const LIGHT = `--anatomy-shade-0:#e3dccd;--anatomy-shade-1:#ebe5d8;--anatomy-shade-2:#f2ede3;--anatomy-shade-3:#f8f5ee;
  --anatomy-face:#fffdf8;--anatomy-top:#ffffff;--anatomy-hi:#1d2230;--anatomy-mid:#6f7486;--anatomy-lo:#b3ad9f;--anatomy-faint:#e1d9c8;
  --anatomy-dot:#1d2230;--tm-bone:#e9e1cf;--tm-bone-in:#f3ecdc;--tm-trab:#d8ccb2;--tm-cart:#cfe0ea;--tm-disc:#c9d6e8;--tm-disc-mid:#e3eaf4;
  --tm-retro:#f1c9c4;--tm-vessel:#c0544c;--tm-muscle:#d98e86;--tm-muscle-fib:#b5655d;--tm-lig:#b98a2e;--tm-air:#3b3f4c;`;
const DARK = `--anatomy-shade-0:#1a1e2a;--anatomy-shade-1:#1f2431;--anatomy-shade-2:#242a38;--anatomy-shade-3:#2a3040;
  --anatomy-face:#2a3040;--anatomy-top:#323a4d;--anatomy-hi:#eceef4;--anatomy-mid:#9aa0b3;--anatomy-lo:#596075;--anatomy-faint:#3a4256;
  --anatomy-dot:#eceef4;--tm-bone:#5a5446;--tm-bone-in:#6a6352;--tm-trab:#4c4739;--tm-cart:#5f7a8a;--tm-disc:#6d82a3;--tm-disc-mid:#8fa3c2;
  --tm-retro:#8a4f4a;--tm-vessel:#e07a70;--tm-muscle:#a8605a;--tm-muscle-fib:#d48a82;--tm-lig:#e2b056;--tm-air:#0e1016;`;
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
.anima .am-svg svg{display:block;width:100%;height:auto;overflow:hidden}
.anima .am-label{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono)}
.anima .am-label.strong{fill:var(--anatomy-strong);font-weight:600}
.anima .am-leader{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .am-dot{fill:var(--anatomy-dot)}
@media (max-width:560px){.anima .am-callout{display:none}}
.anima .hot{cursor:help;outline:none}
.anima .hot.is-hot{filter:drop-shadow(0 0 3px var(--anatomy-lit))}
.anima .hot:focus-visible{outline:2px solid var(--anatomy-lit);outline-offset:3px}
.anima .am-controls{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:12px 0 6px;font:13px var(--font-body);color:var(--ink)}
.anima .am-slider{display:flex;align-items:center;gap:10px;flex:1 1 300px;font:.78rem var(--font-mono);color:var(--ink-soft)}
.anima .am-slider input{flex:1;accent-color:var(--accent);min-width:120px}
.anima .am-btn{border:1px solid var(--line-strong);border-radius:8px;background:transparent;color:var(--ink-soft);font:500 .8rem var(--font-body);padding:5px 10px;cursor:pointer}
.anima .am-btn[aria-pressed="true"]{background:var(--accent-soft);color:var(--accent-ink);border-color:var(--accent)}
.anima .am-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.anima .am-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px 14px;margin:6px 0 2px;font:.8rem var(--font-mono);color:var(--ink-soft)}
.anima .am-stats b{color:var(--ink);font-weight:600}
.anima .am-stats em{font-style:normal}
.anima .am-summary{font-size:.92rem;line-height:1.55;color:var(--ink);margin:8px 0;min-height:4.6em}
.anima .am-info{font-size:.86rem;line-height:1.5;color:var(--ink-soft);margin:6px 0;border-left:2px solid var(--line-strong);padding-left:10px;min-height:3em}
.anima .am-sources{font-size:.82rem;line-height:1.55;color:var(--ink-soft);margin:8px 0 0}
.anima .am-sources summary{cursor:pointer;font-weight:600;color:var(--ink-soft)}
.anima .am-sources ul{padding-left:18px;margin:6px 0}
.anima .am-sources li{margin:4px 0}
.lec-fig{margin:0}
.lec-fig > h4{margin:0 0 4px;font-size:1rem}
.lec-fig > .lec-fig-cap{margin:0 0 10px;font-size:.86rem;color:var(--ink-soft)}
`;
export function baseCss() { return TOKENS + kitRules() + HUB; }

/* a label whose leader ends on a dot on the part (anima: every line ends on something) */
export function callout(p, lines, t, anchor = "start", cls = "") {
  const arr = Array.isArray(lines) ? lines : [lines];
  const ex = t[0] + (anchor === "end" ? 4 : -4), ey = t[1] - 4;
  const text = arr.map((s, i) => `<tspan x="${f1(t[0])}" dy="${i ? 13 : 0}">${s}</tspan>`).join("");
  return `<g class="am-callout"><path class="am-leader" d="M${f1(p[0])} ${f1(p[1])}L${f1(ex)} ${f1(ey)}"/><circle class="am-dot" cx="${f1(p[0])}" cy="${f1(p[1])}" r="2"/><text class="am-label ${cls}" x="${f1(t[0])}" y="${f1(t[1])}" text-anchor="${anchor}">${text}</text></g>`;
}
