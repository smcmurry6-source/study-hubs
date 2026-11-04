// Fig: why a biofilm beats antibiotics (Periodontology S8, Dr. Litz's recorded lecture and slides). A root surface with a
// subgingival biofilm; antibiotic molecules arrive from a capillary in the pocket wall (by way of the GCF). Three steps
// show his three mechanisms: (1) the biofilm is a physical barrier, (2) it is saturated with beta-lactamase, which
// inactivates beta-lactam drugs that get in, (3) it slows the bacteria's growth, and bactericidal drugs kill only
// dividing cells. "After SRP" shows the biofilm broken up by mechanical debridement, so the drug reaches the bacteria.
// Qualitative: counts, sizes and speeds are illustrative.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 320;
const BUGS = [];
(function () { var s = 7; function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
  for (var i = 0; i < 34; i++) { var y = 46 + r() * 236, x = 112 + r() * 118 * (0.55 + 0.45 * Math.sin((y - 40) / 260 * Math.PI)); BUGS.push([Math.round(x), Math.round(y), Math.round(r() * 180), r() < .2 ? 1 : 0]); } })();
const D = {
  W, H, BUGS,
  SC: {
    barrier: { name: "1 · physical barrier", film: 1, enz: 0, slow: 0, srp: 0,
      text: "The biofilm is a physical barrier that makes antibiotic penetration difficult. A systemic drug spreads evenly through the body (\"not a heat-seeking missile\"), reaches the pocket in the GCF, and most of it can't get through the biofilm's wall." },
    enz: { name: "2 · β-lactamase", film: 1, enz: 1, slow: 0, srp: 0,
      text: "The drug that does get in meets bacteria churning out beta-lactamase. \"-ase\" means it destroys: beta-lactamase breaks the beta-lactam ring of our strongest antibiotics (amoxicillin, the cephalosporins). Augmentin's clavulanic acid exists to block it." },
    slow: { name: "3 · slowed growth", film: 1, enz: 0, slow: 1, srp: 0,
      text: "Living in a biofilm slows the bacteria's growth. Bactericidal drugs kill only bacteria that are actively dividing, so slower growth shrinks their window. Only the few dividing cells (pinched in the middle) are killed. It's also why a bacteriostatic and a bactericidal drug are never given together." },
    srp: { name: "after scaling and root planing", film: 0, enz: 0, slow: 0, srp: 1,
      text: "Mechanical debridement first: like a soaked pot, the biofilm has to be scrubbed off. With the biofilm broken up, the antibiotic reaches the remaining bacteria. That's why antibiotics are never a monotherapy and are given after SRP." },
  },
};

function bfDraw(v, t, D) {
  var o = "", f = function (n) { return Math.round(n * 10) / 10; };
  /* root (cementum) on the left, pocket epithelium and capillary on the right */
  o += '<g class="hot" data-info="Root surface (cementum), where the subgingival biofilm sticks. Biofilms are insoluble: rinses, water irrigation and chlorhexidine leave them in place."><path class="bf-root" d="M0 20H92Q98 170 92 300H0Z"/><text class="bf-t" x="44" y="170" text-anchor="middle" transform="rotate(-90 44 170)">root surface</text></g>';
  o += '<g class="hot" data-info="Pocket wall with a capillary. A systemic antibiotic arrives through the bloodstream and the gingival crevicular fluid (GCF), but its concentration there is inadequate to kill bacteria in an intact biofilm."><path class="bf-wall" d="M430 20H540V300H430Q446 160 430 20Z"/><path class="bf-cap" d="M478 30Q462 160 478 290"/><text class="bf-t" x="500" y="170" text-anchor="middle" transform="rotate(90 500 170)">pocket wall · capillary</text></g>';
  /* biofilm matrix (or its fragments after SRP) */
  var film = v.film;
  if (film > .02) o += '<g class="hot" data-info="The biofilm: many species living together in a protective matrix (a subdivision, not a single house). Some biofilm organisms survive antibiotic levels 500-1000 times what systemic delivery can reach."><path class="bf-film" opacity="' + f(film) + '" d="M92 30C170 30 250 60 258 120C266 170 250 240 200 296L92 300Z"/></g>';
  if (v.srp > .02) for (var k = 0; k < 6; k++) { var fx = 118 + k * 36 + v.srp * 40, fy = 60 + (k * 53) % 220; o += '<ellipse class="bf-film" opacity="' + f(.5 * v.srp) + '" cx="' + f(fx) + '" cy="' + fy + '" rx="12" ry="8"/>'; }
  /* bacteria: killed ones fade */
  D.BUGS.forEach(function (b, i) {
    var killed = 0;
    if (v.srp > .5) killed = Math.min(1, Math.max(0, (t / 2600) - (i % 8) * .08)) * v.srp;
    if (v.slow > .5 && b[3]) killed = Math.min(1, Math.max(0, (t / 2000) - .3));
    var dividing = b[3] && (v.slow > .5 || v.srp > .5), x = b[0] + (v.srp > .02 ? v.srp * 30 * Math.sin(i) : 0), y = b[1];
    var cls = "bf-bug" + (killed > .5 ? " is-dead" : "");
    o += '<g transform="translate(' + f(x) + " " + f(y) + ") rotate(" + b[2] + ')" opacity="' + f(1 - .55 * killed) + '"><rect class="' + cls + '" x="-7" y="-3.2" width="14" height="6.4" rx="3.2"/>' + (dividing ? '<path class="bf-div" d="M0 -3.4V3.4"/>' : "") + "</g>";
  });
  /* beta-lactamase enzymes */
  if (v.enz > .02) for (var e = 0; e < 9; e++) { var ex = 150 + (e * 37) % 100, ey = 70 + (e * 61) % 200; o += '<g class="hot" data-info="Beta-lactamase, made by many periodontal pathogens: it inactivates beta-lactam antibiotics (penicillins, cephalosporins)." opacity="' + f(v.enz) + '"><path class="bf-enz" d="M' + (ex - 5) + " " + (ey - 5) + "L" + (ex + 5) + " " + (ey + 5) + "M" + (ex + 5) + " " + (ey - 5) + "L" + (ex - 5) + " " + (ey + 5) + '"/><circle class="bf-enzc" cx="' + ex + '" cy="' + ey + '" r="2.4"/></g>'; }
  /* antibiotic molecules: from the capillary toward the root */
  for (var m = 0; m < 14; m++) {
    var u = ((t / 3400) + m / 14) % 1, y0 = 40 + (m * 97) % 240, x = 470 - u * 360, alive = 1, cls = "bf-drug";
    var edge = 262 - 30 * Math.abs((y0 - 160) / 140);
    if (v.film > .5 && v.enz <= .5 && x < edge) { if (m % 4) { x = edge + (edge - x) * .4; alive = Math.max(0, 1 - (edge - (470 - u * 360)) / 50); } }
    if (v.enz > .5 && x < edge) { if (m % 4) { x = edge + (edge - x) * .4; alive = Math.max(0, 1 - (edge - (470 - u * 360)) / 50); } else { cls = "bf-drug is-dead"; } }
    if (x < 100) alive = 0;
    if (alive > .02) o += '<circle class="' + cls + '" cx="' + f(x) + '" cy="' + f(y0 + Math.sin(u * 9 + m) * 6) + '" r="3.4" opacity="' + f(alive * Math.min(1, (1 - u) * 6, u * 10)) + '"/>';
  }
  return o;
}

const svg = figureSvg({ width: W, height: H, className: "bf-svg", label: "A root surface covered by a biofilm of bacteria, with antibiotic molecules coming from a capillary in the pocket wall.", body: '<g class="bf-dyn">' + bfDraw({ film: 1, enz: 0, slow: 0, srp: 0 }, 0, D) + "</g>" });
const plate = plateHtml({ fig: "S8 · Fig 1", title: "Why a biofilm beats antibiotics", hint: "step through · tap a part", readout: "1 · physical barrier", body: `<div class="am-svg bf-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Mechanism"><button type="button" class="am-btn" data-bfk="barrier" aria-pressed="true">1 · Barrier</button><button type="button" class="am-btn" data-bfk="enz" aria-pressed="false">2 · β-lactamase</button><button type="button" class="am-btn" data-bfk="slow" aria-pressed="false">3 · Slowed growth</button><button type="button" class="am-btn" data-bfk="srp" aria-pressed="false">After SRP</button></div>
<div class="bf-key"><span><i class="bf-k-bug"></i>bacterium</span><span><i class="bf-k-drug"></i>antibiotic</span><span><i class="bf-k-enz"></i>β-lactamase</span></div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the root, the biofilm, the pocket wall or an enzyme.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>The three mechanisms, the 500-1000× figure, bactericidal agents needing dividing cells, and debridement before antibiotics are from Dr. Litz's recorded lecture and slides.</li>
<li>Qualitative: the numbers of bacteria and molecules, their sizes and speeds are illustrative, and the biofilm's many species are drawn as one kind of rod. Educational, not medical advice.</li></ul></details>`;

function bfLive(root, D) {
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var svg = root.querySelector(".bf-svg"), dyn = svg.querySelector(".bf-dyn"), sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var key = "barrier", v = { film: 1, enz: 0, slow: 0, srp: 0 }, frame = 0, visible = true, t0 = performance.now(), last = t0;
  function step(now) { var k = 1 - Math.exp(-(now - last) / 260); last = now; ["film", "enz", "slow", "srp"].forEach(function (n) { v[n] += (D.SC[key][n] - v[n]) * (reduce.matches ? 1 : k); }); dyn.innerHTML = D.bfDraw(v, reduce.matches ? 3000 : now - t0, D); }
  function loop(now) { step(now); frame = visible && !reduce.matches ? requestAnimationFrame(loop) : 0; }
  function kick() { last = performance.now(); if (!frame && visible && !reduce.matches) frame = requestAnimationFrame(loop); else if (reduce.matches) step(performance.now()); }
  function set(k) { key = k; t0 = performance.now(); sum.textContent = D.SC[k].text; if (readout) readout.textContent = D.SC[k].name;
    root.querySelectorAll("[data-bfk]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-bfk") === k)); }); kick(); }
  root.querySelectorAll("[data-bfk]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-bfk")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "80px" }).observe(svg);
  set("barrier");
}

const CSS = `
.anima .bf-box{max-width:600px;margin:0 auto}
.anima .bf-key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:2px 0 6px;font:12px var(--anatomy-mono);color:var(--anatomy-muted)}
.anima .bf-key span{display:inline-flex;align-items:center;gap:5px}
.anima .bf-key i{width:10px;height:10px;border-radius:50%;display:inline-block}
.anima .bf-k-bug{background:var(--pd-bug);border-radius:4px!important;width:14px!important;height:7px!important}.anima .bf-k-drug{background:var(--pd-drug)}.anima .bf-k-enz{background:var(--pd-enz)}
.anima .bf-svg .bf-t{fill:var(--anatomy-muted);font:11px var(--anatomy-mono)}
.anima .bf-svg .bf-root{fill:var(--pd-bone);stroke:var(--pd-bone-line);stroke-width:1.2}
.anima .bf-svg .bf-wall{fill:var(--pd-gum);stroke:var(--pd-gum-line);stroke-width:1.2}
.anima .bf-svg .bf-cap{fill:none;stroke:var(--pd-blood);stroke-width:7;stroke-linecap:round;opacity:.6}
.anima .bf-svg .bf-film{fill:var(--pd-film);stroke:var(--pd-film-line);stroke-width:1.4;stroke-dasharray:6 3}
.anima .bf-svg .bf-bug{fill:var(--pd-bug)}
.anima .bf-svg .bf-bug.is-dead{fill:var(--pd-bug-dead)}
.anima .bf-svg .bf-div{stroke:var(--surface);stroke-width:1.6}
.anima .bf-svg .bf-drug{fill:var(--pd-drug)}
.anima .bf-svg .bf-drug.is-dead{fill:var(--pd-bug-dead)}
.anima .bf-svg .bf-enz{stroke:var(--pd-enz);stroke-width:2;stroke-linecap:round}
.anima .bf-svg .bf-enzc{fill:var(--pd-enz)}
`;
export function biofilm() {
  return { id: "biofilm", lec: "antibiotics-host-mod", title: "Why a biofilm beats antibiotics",
    caption: "Dr. Litz's three ways a biofilm protects its bacteria from an antibiotic, and what changes once scaling and root planing breaks it up.",
    html: `<div class="anima" data-anima="biofilm">${plate}${controls}${SOURCES}</div>`, css: CSS, live: bfLive.toString(), helpers: [bfDraw], data: D };
}
