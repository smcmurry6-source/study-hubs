// Shared pieces for the Heme & Endo Exam 1 anima figures: the kit's frame and CSS, mapped onto the hub's palette.
// Built offline (node tools/figures/heme-endo-exam1/build.mjs) and pasted into hubs/heme-endo-exam1/index.html;
// nothing here loads at runtime.
import { ISO_CSS, figureSvg, plateHtml } from "../../../.claude/skills/anima/kit/iso-kit.mjs";

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

// The kit's tokens on the hub's palette ("H&E": eosin-blush paper, hematoxylin-purple ink). Cell figures use the
// stain colors of a slide (--he-*): eosin pink cytoplasm, hematoxylin purple nuclei, pale colloid, red blood.
// The hub sets data-theme on <html>, so the dark values follow the same selectors as the hub's own :root blocks.
const LIGHT = `--anatomy-shade-0:#e6dce4;--anatomy-shade-1:#ece4ea;--anatomy-shade-2:#f2ebf0;--anatomy-shade-3:#f8f3f6;
  --anatomy-face:#fffcfd;--anatomy-top:#ffffff;--anatomy-hi:#241d2e;--anatomy-mid:#75697f;--anatomy-lo:#bcaeba;--anatomy-faint:#e3d7e0;
  --anatomy-dot:#241d2e;--he-cyto:#f6d3e3;--he-cyto-line:#c76b97;--he-nuc:#6b4fa8;--he-nuc-line:#46337a;--he-colloid:#fbe6ef;
  --he-blood:#f3c4c4;--he-blood-line:#b8484a;--he-rbc:#d9534f;--he-mem:#9a5b86;--he-mito:#f0b98c;--he-mito-line:#b0703c;
  --he-gran:#8d6bc9;--he-gold:#c9a227;--he-k:#3a8f6b;--he-ca:#c26a1b;--he-glu:#2f62a8;--he-hormone:#b9436a;--he-bone:#efe6d3;--he-bone-line:#a08b62;`;
const DARK = `--anatomy-shade-0:#1b1722;--anatomy-shade-1:#201b28;--anatomy-shade-2:#25202e;--anatomy-shade-3:#2b2535;
  --anatomy-face:#2b2535;--anatomy-top:#342d40;--anatomy-hi:#efeaf4;--anatomy-mid:#a399b0;--anatomy-lo:#5d5469;--anatomy-faint:#3b3447;
  --anatomy-dot:#efeaf4;--he-cyto:#5a2f45;--he-cyto-line:#d98cb0;--he-nuc:#8d74cf;--he-nuc-line:#c3b2f2;--he-colloid:#47283a;
  --he-blood:#5a2a2c;--he-blood-line:#e07a70;--he-rbc:#e8736b;--he-mem:#d39ac0;--he-mito:#8a5a33;--he-mito-line:#e8a874;
  --he-gran:#b39cf0;--he-gold:#e8c45a;--he-k:#6fc29d;--he-ca:#f0a15a;--he-glu:#7fa9e0;--he-hormone:#ec86a6;--he-bone:#5a5446;--he-bone-line:#c8b48a;`;
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
