// Fig: where each antibiotic acts on the bacterium (Periodontology S8, Dr. Litz's recorded lecture and slides). A
// schematic bacterial cell with its cell wall, a ribosome (50S and 30S subunits), its DNA and DNA gyrase. Pick a drug to
// light its target, with its kill type and the point the lecture made about it. Mechanisms and kill types are the
// slides'; the cell is a schematic, not to scale.
import { figureSvg, plateHtml } from "./shared.mjs";

const W = 540, H = 300;
const D = {
  DR: [
    { k: "amox", n: "Amoxicillin / Augmentin", tg: "wall", kill: "bactericidal", t: "Penicillins inhibit cell wall synthesis: bactericidal. Amoxicillin's beta-lactam ring is destroyed by beta-lactamase; Augmentin adds clavulanic acid to block it. 500 mg po tid × 7 days." },
    { k: "ceph", n: "Cephalosporins", tg: "wall", kill: "bactericidal", t: "Beta-lactams like the penicillins: inhibit cell wall synthesis, bactericidal. Later generations: more gram-negative coverage and beta-lactamase resistance. About 10% cross-reactivity with penicillin allergy." },
    { k: "clinda", n: "Clindamycin", tg: "s50", kill: "usually bactericidal", t: "Reversibly binds the 50S ribosomal subunit, inhibiting protein synthesis; usually bactericidal (bacteriostatic by concentration, site and organism). First choice with a true penicillin allergy; avoid with a history of colitis (C. diff)." },
    { k: "macro", n: "Macrolides", tg: "s50", kill: "bacteriostatic", t: "Erythromycin, azithromycin and clarithromycin bind the 50S subunit (like clindamycin): bacteriostatic, narrow spectrum. Erythromycin isn't recommended for perio (resistance). Macrolides can raise digoxin levels." },
    { k: "tcn", n: "Tetracyclines", tg: "s30", kill: "bacteriostatic", t: "Reversibly bind the 30S ribosomal subunit, inhibiting protein synthesis: bacteriostatic, broad spectrum. For A. actinomycetemcomitans; no dairy or antacids; not in pregnancy or under 8." },
    { k: "metro", n: "Metronidazole", tg: "dna", kill: "bactericidal", t: "Reacts with bacterial DNA, inhibiting replication: almost always bactericidal, and only against obligate anaerobes (spirochetes). Often paired with amoxicillin, since both are bactericidal." },
    { k: "cipro", n: "Ciprofloxacin", tg: "gyr", kill: "bactericidal", t: "A fluoroquinolone that inhibits DNA gyrase: bactericidal, extended spectrum, but anaerobes are largely resistant, so it's given with metronidazole." },
  ],
};
function tgDraw(D, k) {
  var d = D.DR.filter(function (x) { return x.k === k; })[0], tg = d ? d.tg : "", o = "";
  function on(x) { return tg === x ? " is-on" : ""; }
  o += '<g class="hot' + on("wall") + '" data-info="Cell wall: the target of the beta-lactams (penicillins, cephalosporins), which inhibit its synthesis and kill growing bacteria."><rect class="tg-wall" x="40" y="40" width="460" height="220" rx="110"/><rect class="tg-mem" x="54" y="54" width="432" height="192" rx="96"/></g>';
  o += '<text class="tg-t tg-lab" x="270" y="32" text-anchor="middle">cell wall</text>';
  /* DNA loop and gyrase */
  o += '<g class="hot' + on("dna") + '" data-info="Bacterial DNA: metronidazole reacts with it and stops replication."><path class="tg-dna" d="M330 150C330 96 440 96 440 150C440 204 330 204 330 150Z"/><path class="tg-dna2" d="M336 150C336 104 434 104 434 150C434 196 336 196 336 150Z"/></g>';
  o += '<text class="tg-t tg-lab" x="385" y="215" text-anchor="middle">DNA</text>';
  o += '<g class="hot' + on("gyr") + '" data-info="DNA gyrase, the enzyme that unwinds DNA for copying: ciprofloxacin inhibits it."><rect class="tg-gyr" x="420" y="128" width="36" height="22" rx="6"/><text class="tg-t tg-in" x="438" y="143" text-anchor="middle">gyrase</text></g>';
  /* ribosome: 50S large, 30S small, with mRNA */
  o += '<path class="tg-mrna" d="M110 176Q170 168 230 176"/>';
  o += '<g class="hot' + on("s50") + '" data-info="50S ribosomal subunit: clindamycin and the macrolides bind it and stop protein synthesis."><ellipse class="tg-s50" cx="170" cy="134" rx="54" ry="38"/><text class="tg-t tg-in" x="170" y="139" text-anchor="middle">50S</text></g>';
  o += '<g class="hot' + on("s30") + '" data-info="30S ribosomal subunit: the tetracyclines bind it and stop protein synthesis."><ellipse class="tg-s30" cx="170" cy="190" rx="40" ry="18"/><text class="tg-t tg-in" x="170" y="195" text-anchor="middle">30S</text></g>';
  o += '<text class="tg-t tg-lab" x="170" y="226" text-anchor="middle">ribosome</text>';
  if (d) o += '<rect class="tg-chip ' + (d.kill.indexOf("static") > -1 ? "is-static" : "is-cidal") + '" x="190" y="268" width="160" height="24" rx="12"/><text class="tg-t tg-ct" x="270" y="284" text-anchor="middle">' + d.kill + "</text>";
  return o;
}
const svg = figureSvg({ width: W, height: H, className: "tg-svg", label: "A bacterial cell with its cell wall, a ribosome with 50S and 30S subunits, its DNA and DNA gyrase; the chosen antibiotic's target is highlighted.", body: '<g class="tg-dyn">' + tgDraw(D, "amox") + "</g>" });
const plate = plateHtml({ fig: "S8 · Fig 2", title: "Where each antibiotic acts", hint: "pick a drug · tap a part", readout: "cell wall", body: `<div class="am-svg tg-box">${svg}</div>` });
const controls = `<div class="am-controls" role="group" aria-label="Antibiotic">${D.DR.map((d, i) => `<button type="button" class="am-btn" data-tgk="${d.k}" aria-pressed="${i === 0}">${d.n}</button>`).join("")}</div>
<p class="am-summary" aria-live="polite"></p>
<p class="am-info">Tap the cell wall, a ribosome subunit, the DNA or gyrase.</p>`;
const SOURCES = `<details class="am-sources"><summary>What this shows, and what's simplified</summary><ul>
<li>Mechanisms and kill types from Dr. Litz's slides and recording. Two bactericidal drugs (or two bacteriostatic ones) can be given together; one of each can't.</li>
<li>Schematic cell, not to scale: a real bacterium has thousands of ribosomes and a circular chromosome. Educational, not medical advice.</li></ul></details>`;
function tgLive(root, D) {
  var svg = root.querySelector(".tg-svg"), dyn = svg.querySelector(".tg-dyn"), sum = root.querySelector(".am-summary"), infoEl = root.querySelector(".am-info"), readout = root.querySelector("[data-readout]");
  var NAME = { wall: "cell wall", s50: "50S subunit", s30: "30S subunit", dna: "DNA", gyr: "DNA gyrase" };
  function set(k) { var d = D.DR.filter(function (x) { return x.k === k; })[0]; dyn.innerHTML = D.tgDraw(D, k); sum.textContent = d.t; if (readout) readout.textContent = NAME[d.tg];
    root.querySelectorAll("[data-tgk]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tgk") === k)); }); }
  root.querySelectorAll("[data-tgk]").forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-tgk")); }); });
  function hot(e) { var el = e.target.closest && e.target.closest(".hot"); if (el && svg.contains(el)) infoEl.textContent = el.getAttribute("data-info"); }
  svg.addEventListener("pointerover", hot); svg.addEventListener("click", hot);
  set("amox");
}
const CSS = `
.anima .tg-box{max-width:580px;margin:0 auto}
.anima .tg-svg .tg-t{fill:var(--anatomy-text);font:11.5px var(--anatomy-mono)}
.anima .tg-svg .tg-lab{fill:var(--anatomy-muted);font-size:10.5px}
.anima .tg-svg .tg-in{font-weight:700;fill:var(--anatomy-strong)}
.anima .tg-svg .tg-wall{fill:var(--pd-film);stroke:var(--pd-film-line);stroke-width:8}
.anima .tg-svg .tg-mem{fill:var(--surface);stroke:var(--pd-film-line);stroke-width:1.2;opacity:.9}
.anima .tg-svg .tg-dna{fill:none;stroke:var(--pd-drug);stroke-width:2}
.anima .tg-svg .tg-dna2{fill:none;stroke:var(--pd-drug);stroke-width:1.2;stroke-dasharray:3 3;opacity:.7}
.anima .tg-svg .tg-gyr{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .tg-svg .tg-gyr + .tg-in{font-size:9.5px}
.anima .tg-svg .tg-mrna{fill:none;stroke:var(--anatomy-mid);stroke-width:1.6;stroke-dasharray:2 3}
.anima .tg-svg .tg-s50{fill:var(--anatomy-shade-1);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .tg-svg .tg-s30{fill:var(--anatomy-shade-2);stroke:var(--anatomy-mid);stroke-width:1.2}
.anima .tg-svg .is-on .tg-wall{stroke:var(--pd-red)}
.anima .tg-svg .is-on .tg-s50,.anima .tg-svg .is-on .tg-s30,.anima .tg-svg .is-on .tg-gyr{fill:var(--pd-red);stroke:var(--pd-red-line);stroke-width:2.4}
.anima .tg-svg .is-on .tg-dna,.anima .tg-svg .is-on .tg-dna2{stroke:var(--pd-red);stroke-width:3.4}
.anima .tg-svg .is-on .tg-in{fill:#fff}
.anima .tg-svg .tg-chip{stroke-width:1.6}
.anima .tg-svg .tg-chip.is-cidal{fill:var(--pd-red);stroke:var(--pd-red-line)}
.anima .tg-svg .tg-chip.is-static{fill:var(--pd-drug);stroke:var(--pd-drug)}
.anima .tg-svg .tg-ct{font-weight:700;fill:#fff}
.anima [data-anima="targets"] .am-controls{gap:6px 8px}
`;
export function targets() {
  return { id: "targets", lec: "antibiotics-host-mod", title: "Where each antibiotic acts",
    caption: "Each drug class's target on the bacterium, and whether it kills (bactericidal) or stops growth (bacteriostatic).",
    html: `<div class="anima" data-anima="targets">${plate}${controls}${SOURCES}</div>`, css: CSS, live: tgLive.toString(), helpers: [tgDraw], data: D };
}
