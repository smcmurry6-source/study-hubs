// Fig: the emergency contraception window (L18 Estrogens and Androgens, Dr. Fasinu, "Anti-progestins and emergency
// contraception"). A timeline from intercourse to 5 days, with two options drawn as bars: Plan B (a high dose of
// levonorgestrel, a progestin, no prescription) open to 72 hours, and ulipristal (Ella, a progestin receptor
// antagonist, prescription only) open to 120 hours (5 days). Drag the marker (or tap a preset hour) along the timeline
// to see which option is still open and whether it needs a prescription; the summary changes with it. The two
// differences he called "probably more important": the window and the prescription. Numbers are his.
import { makeFig, f1, T, HOT } from "./shared.mjs";

const W = 462, H = 290;
const X0 = 52, X1 = 432, HMAX = 120;          // the time axis: 0 to 120 hours
const PB = 86, UL = 166, AXY = 240;           // the two bar rows and the axis
function xOf(hr) { return 52 + hr / 120 * (432 - 52); }   // self-contained: X0 52, X1 432, HMAX 120

/* ---------- page helpers (serialized) ---------- */
/* a rounded bar segment */
function ecSeg(x0, x1, y, h, cls) { return '<rect class="' + cls + '" x="' + f1(x0) + '" y="' + f1(y) + '" width="' + f1(x1 - x0) + '" height="' + h + '" rx="' + (h / 2) + '"/>'; }
/* a small pill badge with text */
function ecBadge(x, y, s, cls) { var w = s.length * 6.4 + 14; return '<rect class="ec-badge ' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="18" rx="9"/>' + T(x + w / 2, y + 13, s, "ec-badget " + cls, "middle"); }
/* a check or cross token on a lane at the cursor */
function ecMark(x, y, ok) {
  if (ok) return '<circle class="ec-okc" cx="' + f1(x) + '" cy="' + f1(y) + '" r="9"/><path class="ec-okm" d="M' + f1(x - 4) + " " + f1(y) + "L" + f1(x - 1) + " " + f1(y + 3.2) + "L" + f1(x + 4.2) + " " + f1(y - 3.2) + '"/>';
  return '<circle class="ec-noc" cx="' + f1(x) + '" cy="' + f1(y) + '" r="9"/><path class="ec-nom" d="M' + f1(x - 3.4) + " " + f1(y - 3.4) + "L" + f1(x + 3.4) + " " + f1(y + 3.4) + "M" + f1(x + 3.4) + " " + f1(y - 3.4) + "L" + f1(x - 3.4) + " " + f1(y + 3.4) + '"/>';
}

function ecBadgeR(x1, y, s, cls) { var w = s.length * 6.4 + 14; return ecBadge(x1 - w, y, s, cls); }
function ecRender(st, D) {
  var h = Math.round(st.h), o = "", xc = D.xOf(h), X0 = D.X0, X1 = D.X1, X72 = D.xOf(72), bh = 26;
  var pbOpen = h <= 72, ulOpen = h <= 120;
  /* ---- the cursor line (behind the bars) ---- */
  o += '<path class="ec-cursor" d="M' + f1(xc) + " 30V" + (D.AXY + 2) + '"/>';
  /* ---- Plan B lane ---- */
  o += T(X0, D.PB - 30, "Plan B", "ec-name", "start") + ecBadgeR(X1, D.PB - 42, "no prescription", "ec-otc");
  o += T(X0, D.PB - 16, "high-dose levonorgestrel, a progestin", "ec-sub", "start");
  o += HOT("Plan B is a high dose of levonorgestrel, a progestin. It must be used within 72 hours of intercourse, and it is sold without a prescription (over the counter).",
    ecSeg(X0, X72, D.PB, bh, "ec-open") + ecSeg(X72, X1, D.PB, bh, "ec-closed") +
    '<path class="ec-limit" d="M' + f1(X72) + " " + (D.PB - 4) + "V" + (D.PB + bh + 4) + '"/>' + T(X72 - 4, D.PB + bh + 16, "within 72 h", "ec-lim", "end"));
  /* ---- ulipristal lane ---- */
  o += T(X0, D.UL - 30, "Ulipristal (Ella)", "ec-name", "start") + ecBadgeR(X1, D.UL - 42, "prescription only", "ec-rx");
  o += T(X0, D.UL - 16, "a progestin receptor antagonist", "ec-sub", "start");
  o += HOT("Ulipristal (Ella) is a progestin receptor antagonist, an anti-progestin. It can be used up to 120 hours (5 days) after intercourse, and it is prescription only.",
    ecSeg(X0, X1, D.UL, bh, "ec-open") +
    '<path class="ec-limit" d="M' + f1(X1) + " " + (D.UL - 4) + "V" + (D.UL + bh + 4) + '"/>' + T(X1, D.UL + bh + 16, "up to 120 h (5 days)", "ec-lim", "end"));
  /* ---- the time axis ---- */
  o += '<path class="ec-axis" d="M' + X0 + " " + D.AXY + "H" + X1 + '"/>';
  [0, 24, 48, 72, 96, 120].forEach(function (hr) { var x = D.xOf(hr); o += '<path class="ec-tick" d="M' + f1(x) + " " + D.AXY + "V" + (D.AXY + 5) + '"/>' + T(x, D.AXY + 18, hr + "", "ec-tk", "middle"); });
  o += T(X0, D.AXY + 33, "intercourse", "ec-tk ec-mut", "start") + T(X1, D.AXY + 33, "5 days", "ec-tk ec-mut", "end");
  /* ---- open/closed marks on each lane at the cursor ---- */
  o += ecMark(xc, D.PB + bh / 2, pbOpen);
  o += ecMark(xc, D.UL + bh / 2, ulOpen);
  /* ---- the draggable handle, at the top ---- */
  o += HOT("Drag the marker (or tap an hour) to a time after intercourse. The two options show whether each is still open.",
    '<rect class="ec-handle" x="' + f1(xc - 22) + '" y="8" width="44" height="18" rx="9"/>' + T(xc, 21, h + " h", "ec-handt", "middle"));
  return o;
}
function ecSay(st) {
  var h = Math.round(st.h);
  if (h <= 72) return ["At " + h + " hours, both options are open. Plan B (a high dose of levonorgestrel, no prescription) must be used within 72 hours; ulipristal (Ella, prescription) works up to 120 hours (5 days). Both are emergency contraceptives; the differences are the window and the prescription.", h + " h after · both open"];
  return ["At " + h + " hours, Plan B's 72-hour window has closed. Ulipristal (Ella), a progestin receptor antagonist, is prescription only and works up to 120 hours (5 days), so it is still an option.", h + " h after · ulipristal only"];
}

export default function ecwindow() {
  return makeFig({ id: "ecwindow", lec: "sexster", fig: "Fig 12", short: "Emergency contraception window", hint: "drag the marker",
    title: "The emergency contraception window",
    caption: "Dr. Fasinu's two emergency contraceptives on one timeline. Plan B (levonorgestrel, no prescription) works within 72 hours; ulipristal (Ella, a progestin receptor antagonist, prescription only) works up to 120 hours (5 days). Drag the marker to see which is still open.",
    W, H, label: "A timeline from intercourse to 5 days with two bars: Plan B open to 72 hours, ulipristal open to 120 hours, and a draggable marker showing which option is still open at a given time.",
    D: { INIT: { h: 36 }, ANIM: false, X0, X1, PB, UL, AXY, xOf },
    render: ecRender, say: ecSay, helpers: [ecSeg, ecBadge, ecBadgeR, ecMark, xOf],
    controls: `<div class="am-controls"><label class="am-slider">Hours after intercourse<input type="range" min="0" max="120" step="2" data-amk="h" aria-label="Hours after intercourse"></label></div><div class="am-controls" role="group" aria-label="Jump to an hour">${[["24", "24 h"], ["72", "72 h"], ["96", "96 h"], ["120", "120 h"]].map((b) => `<button type="button" class="am-btn" data-amk="h" data-amv="${b[0]}">${b[1]}</button>`).join("")}</div>`,
    sources: [
      "From the L18 notes, slides and recording (Dr. Fasinu): Plan B is a high dose of levonorgestrel, a progestin, used within 72 hours and sold without a prescription; ulipristal (Ella) is a progestin receptor antagonist (an anti-progestin), used up to 120 hours (5 days) and prescription only. He called the window and the prescription difference the \"probably more important\" points. Both share the indication, post-coital (emergency) contraception; what is labeled follows the lecture.",
      "The 72-hour and 120-hour windows and the over-the-counter versus prescription status match the FDA labels for Plan B One-Step (levonorgestrel) and Ella (ulipristal acetate), which settled the exact hours and the prescription status drawn on the axis. The mechanism labels (levonorgestrel a progestin, ulipristal a progesterone-receptor modulator or antagonist) follow the labels and standard pharmacology texts.",
      "Schematic: the bars show each window on a linear time axis, not an effectiveness curve (effectiveness falls across the window; that is not drawn). The figure is about the timing and prescription difference the lecture stressed, not dosing. Educational, not medical advice."],
    css: `
.anima[data-anima="ecwindow"] .am-svg{max-width:520px}
.anima .ecwindow-svg .ec-h{font:600 11px var(--anatomy-mono);letter-spacing:.06em;fill:var(--anatomy-muted)}
.anima .ecwindow-svg .ec-name{font:700 13px var(--anatomy-mono);fill:var(--anatomy-strong)}
.anima .ecwindow-svg .ec-sub{font:11.5px var(--anatomy-mono);fill:var(--anatomy-text)}
.anima .ecwindow-svg .ec-open{fill:var(--bx-stim);opacity:.9}
.anima .ecwindow-svg .ec-closed{fill:var(--anatomy-faint);stroke:var(--anatomy-lo);stroke-width:1}
.anima .ecwindow-svg .ec-limit{stroke:var(--anatomy-hi);stroke-width:1.4;stroke-dasharray:2 2}
.anima .ecwindow-svg .ec-lim{font:600 11px var(--anatomy-mono);fill:var(--anatomy-strong)}
.anima .ecwindow-svg .ec-badge{stroke-width:1.2}
.anima .ecwindow-svg .ec-badge.ec-otc{fill:var(--bx-ins-soft);stroke:var(--bx-ins)}
.anima .ecwindow-svg .ec-badge.ec-rx{fill:var(--bx-gold-soft);stroke:var(--bx-gold)}
.anima .ecwindow-svg .ec-badget{font:700 11px var(--anatomy-mono)}
.anima .ecwindow-svg .ec-badget.ec-otc{fill:var(--bx-ins)} .anima .ecwindow-svg .ec-badget.ec-rx{fill:var(--bx-glu)}
.anima .ecwindow-svg .ec-axis{fill:none;stroke:var(--anatomy-mid);stroke-width:1.4}
.anima .ecwindow-svg .ec-tick{fill:none;stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .ecwindow-svg .ec-tk{font:600 11px var(--anatomy-mono);fill:var(--anatomy-text)}
.anima .ecwindow-svg .ec-tk.ec-mut{fill:var(--anatomy-muted);font-weight:600}
.anima .ecwindow-svg .ec-cursor{stroke:var(--accent);stroke-width:1.6}
.anima .ecwindow-svg .ec-handle{fill:var(--accent);stroke:none}
.anima .ecwindow-svg .ec-handt{font:700 11.5px var(--anatomy-mono);fill:var(--accent-ink,#fff);stroke:none}
.anima .ecwindow-svg .ec-okc{fill:var(--surface);stroke:var(--bx-stim);stroke-width:2}
.anima .ecwindow-svg .ec-okm{fill:none;stroke:var(--bx-stim);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.anima .ecwindow-svg .ec-noc{fill:var(--surface);stroke:var(--bx-inhib);stroke-width:2}
.anima .ecwindow-svg .ec-nom{fill:none;stroke:var(--bx-inhib);stroke-width:2.2;stroke-linecap:round}
.anima .ecwindow-svg .am-callout .t{font-size:11.5px}
@media (max-width:560px){.anima .ecwindow-svg .ec-name{font-size:13.5px}.anima .ecwindow-svg .ec-sub,.anima .ecwindow-svg .ec-tk,.anima .ecwindow-svg .ec-lim,.anima .ecwindow-svg .ec-ontext,.anima .ecwindow-svg .ec-h,.anima .ecwindow-svg .ec-badget,.anima .ecwindow-svg .ec-handt{font-size:12px}}
`,
  });
}
