// Shared pieces for the MSK Exam 4 anima figures: the kit, the hub-scoped theme tokens and small SVG helpers.
// The figures are built offline (node tools/figures/msk-exam4/build.mjs) and pasted into hubs/msk-exam4/index.html;
// nothing here is loaded at runtime.
import { ISO_CSS, fitProjection, iso, figureSvg, plateHtml } from "../../../.claude/skills/anima/kit/iso-kit.mjs";
import { BIO_CSS, blobOf, blobSvg, membraneOf, membraneSvg } from "../../../.claude/skills/anima/kit/blob.mjs";

export { fitProjection, iso, figureSvg, plateHtml, blobOf, blobSvg, membraneOf, membraneSvg };

export const f1 = (v) => +v.toFixed(1);
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The kit's tokens, mapped onto the hub's palette. The hub sets data-theme on <html> (light by default, dark from the
// system or the toggle), so the dark values follow the same selectors the hub's own :root blocks use.
const LIGHT = `--anatomy-shade-0:#e6d9d3;--anatomy-shade-1:#ede2dd;--anatomy-shade-2:#f3eae6;--anatomy-shade-3:#f8f2ef;
  --anatomy-face:#fffefd;--anatomy-top:#ffffff;--anatomy-lit-top:#ffffff;--anatomy-lit-shade:#f3eae6;
  --anatomy-hi:#3a2a2f;--anatomy-mid:#8c777d;--anatomy-lo:#bda89f;--anatomy-faint:#e3d3cb;
  --anatomy-halo:#8a6a60;--anatomy-halo-opacity:.26;--anatomy-dot:#3a2a2e;`;
const DARK = `--anatomy-shade-0:#191215;--anatomy-shade-1:#1d1619;--anatomy-shade-2:#21191d;--anatomy-shade-3:#271e22;
  --anatomy-face:#2c2226;--anatomy-top:#2f2529;--anatomy-lit-top:#3a2d32;--anatomy-lit-shade:#2c2226;
  --anatomy-hi:#e3d4d8;--anatomy-mid:#8f7b81;--anatomy-lo:#5b474e;--anatomy-faint:#3e3035;
  --anatomy-halo:#060304;--anatomy-halo-opacity:.8;--anatomy-dot:#f3e9eb;`;
const TOKENS = `
.anima{--anatomy-page:var(--bg);--anatomy-card:var(--surface);--anatomy-paper:var(--surface);
  --anatomy-text:var(--ink-soft);--anatomy-strong:var(--ink);--anatomy-muted:var(--ink-faint);
  --anatomy-lit:var(--accent);--anatomy-red:var(--tag-red);--anatomy-green:var(--tag-green);--anatomy-blue:var(--tag-blue);
  --anatomy-weight:.6px;--anatomy-ease:cubic-bezier(.32,.72,0,1);--anatomy-mono:var(--font-mono);
  ${LIGHT}}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]) .anima{${DARK}} }
:root[data-theme="dark"] .anima{${DARK}}
`;

// ISO_CSS without its own theme blocks (.iso{…} and .iso[data-theme="light"]{…}); every other rule is a class
// prefixed iso- or tb-, which the hub doesn't use.
function kitRules() {
  const css = ISO_CSS.replace(/\.iso\{[^}]*\}/, "").replace(/\.iso\[data-theme="light"\]\{[^}]*\}/, "");
  if (/\.iso\{|\.iso\[data-theme/.test(css)) throw new Error("ISO_CSS theme blocks not stripped");
  return css;
}

const HUB = `
.anima{color:var(--anatomy-text)}
.anima .iso-figure{margin:0}
.anima .iso-plate{border-radius:var(--radius);box-shadow:0 0 0 1px var(--line);padding:40px 12px 40px}
.anima .iso-plate-corners{inset:14px 16px}
.anima .iso-plate-corner{font-size:10.5px}
@media (max-width:560px){.anima .iso-plate{padding:36px 6px 54px}.anima .iso-plate-corner[data-corner="hint"]{bottom:16px}.anima .iso-plate-corner[data-corner="readout"]{white-space:normal;text-align:right;max-width:58%}}
.anima .am-svg svg{display:block;width:100%;height:auto}
.anima .am-label{fill:var(--anatomy-text);font:12px var(--anatomy-mono)}
.anima .am-leader{fill:none;stroke:var(--anatomy-mid);stroke-width:.8}
.anima .am-dot{fill:var(--anatomy-dot)}
@media (max-width:560px){.anima .am-callout{display:none}}
.anima .hot{cursor:help;outline:none}
.anima .hot.is-hot{filter:drop-shadow(0 0 3px var(--anatomy-lit))}
.anima .hot:focus-visible{outline:2px solid var(--anatomy-lit);outline-offset:3px}
.anima .am-controls{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:12px 0 6px;font:13px var(--font-body);color:var(--ink)}
.anima .am-controls fieldset{display:flex;flex-wrap:wrap;gap:6px 8px;border:0;padding:0;margin:0}
.anima .am-controls legend{font:600 .72rem var(--font-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);padding:0;margin:0 0 6px}
.anima .am-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line-strong);border-radius:999px;padding:5px 11px;cursor:pointer;background:var(--surface);color:var(--ink);font:500 .82rem var(--font-body)}
.anima .am-chip input{position:absolute;opacity:0;pointer-events:none}
.anima .am-chip:has(input:checked){background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}
.anima .am-chip:has(input:focus-visible){outline:2px solid var(--accent);outline-offset:2px}
.anima .am-btn{border:1px solid var(--line-strong);border-radius:8px;background:transparent;color:var(--ink-soft);font:500 .8rem var(--font-body);padding:5px 10px;cursor:pointer}
.anima .am-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.anima .am-summary{font-size:.92rem;line-height:1.55;color:var(--ink);margin:8px 0;min-height:4.6em}
.anima .am-info{font-size:.86rem;line-height:1.5;color:var(--ink-soft);margin:6px 0;border-left:2px solid var(--line-strong);padding-left:10px;min-height:3em}
.anima .am-sources{font-size:.82rem;line-height:1.55;color:var(--ink-soft);margin:8px 0 0}
.anima .am-sources summary{cursor:pointer;font-weight:600;color:var(--ink-soft)}
.anima .am-sources ul{padding-left:18px;margin:6px 0}
.anima .am-sources li{margin:4px 0}
`;

export function baseCss() { return TOKENS + kitRules() + BIO_CSS + HUB; }

// A label with a leader that ends on a dot placed on the part (anima: lines end on something).
export function callout(S, lines, at, textAt, anchor) {
  const p = S(...at);
  const t = S(...textAt);
  const arr = Array.isArray(lines) ? lines : [lines];
  const ex = t[0] + (anchor === "end" ? 4 : -4);
  const ey = t[1] - 4;
  const text = arr.map((s, i) => `<tspan x="${t[0]}" dy="${i ? 14 : 0}">${s}</tspan>`).join("");
  return `<g class="am-callout"><path class="am-leader" d="M${p[0]} ${p[1]}L${f1(ex)} ${f1(ey)}"/><circle class="am-dot" cx="${p[0]}" cy="${p[1]}" r="2"/><text class="am-label" x="${t[0]}" y="${t[1]}" text-anchor="${anchor}">${text}</text></g>`;
}

export const ring = (cx, cz, rx, rz, n = 24) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, 0, cz + Math.sin((i / n) * Math.PI * 2) * rz]);
