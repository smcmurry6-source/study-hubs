// Shared pieces for the Periodontology anima figures: the kit's frame and CSS, mapped onto the hub's palette.
// Built offline (node tools/figures/perio/build.mjs) and pasted into hubs/perio/index.html;
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

// The kit's tokens on the perio hub's palette (rose ink on warm paper). Figure colors (--pd-*): gingiva and inflamed
// mucosa, bone, titanium, blood, pus, plaque bacteria, antibiotic and enzyme. The hub sets data-theme on <html>, so the
// dark values follow the same selectors as the hub's own :root blocks.
const LIGHT = `--anatomy-shade-0:#ece2de;--anatomy-shade-1:#f1e9e5;--anatomy-shade-2:#f6f0ed;--anatomy-shade-3:#fbf7f5;
  --anatomy-face:#fffcfa;--anatomy-top:#ffffff;--anatomy-hi:#241a1f;--anatomy-mid:#7a6870;--anatomy-lo:#cfbdb7;--anatomy-faint:#e4d7d2;
  --anatomy-dot:#241a1f;--pd-gum:#f2b8c2;--pd-gum-line:#b9566c;--pd-red:#e0566b;--pd-red-line:#a12a40;--pd-bone:#efe4cf;--pd-bone-line:#a8916a;
  --pd-ti:#b9c2cc;--pd-ti-line:#5d6b78;--pd-crown:#fbf8f2;--pd-crown-line:#a99f8c;--pd-blood:#c62a3c;--pd-pus:#e3b23c;
  --pd-bug:#2f8f6b;--pd-bug-dead:#b8b0ab;--pd-film:#cfe9dc;--pd-film-line:#3f8f6c;--pd-drug:#2e62a0;--pd-enz:#c97a14;--pd-xray:#1d2228;--pd-xbone:#8b939b;--pd-xti:#f4f6f8;`;
const DARK = `--anatomy-shade-0:#1b1417;--anatomy-shade-1:#20181b;--anatomy-shade-2:#251d21;--anatomy-shade-3:#2b2226;
  --anatomy-face:#2b2226;--anatomy-top:#33292e;--anatomy-hi:#f3eaed;--anatomy-mid:#a8979e;--anatomy-lo:#5a4b51;--anatomy-faint:#3a2e33;
  --anatomy-dot:#f3eaed;--pd-gum:#7a3a49;--pd-gum-line:#e48ea2;--pd-red:#c0384f;--pd-red-line:#f08a9a;--pd-bone:#4f4639;--pd-bone-line:#c8b48a;
  --pd-ti:#6d7884;--pd-ti-line:#c3ccd5;--pd-crown:#3a3433;--pd-crown-line:#bfb5a3;--pd-blood:#ff6b78;--pd-pus:#f0c25a;
  --pd-bug:#6fd0a4;--pd-bug-dead:#6c6367;--pd-film:#1f3a2f;--pd-film-line:#6fc79c;--pd-drug:#8ab2e6;--pd-enz:#f0a74a;--pd-xray:#0d1014;--pd-xbone:#7d858d;--pd-xti:#eef1f4;`;
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
@media (max-width:560px){.anima .iso-plate-corner[data-corner="title"]{display:none}.anima .iso-plate{padding:36px 6px 54px}.anima .iso-plate-corner[data-corner="hint"]{bottom:16px}.anima .iso-plate-corner[data-corner="readout"]{white-space:normal;text-align:right;max-width:58%}}
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
