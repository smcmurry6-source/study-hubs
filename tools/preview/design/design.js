/* The design system preview (phase 0 of the redesign). Renders every piece from window.SH_ART (art.js, built by
   tools/figures/site/build.mjs) and the sample questions below. Reads no class data; saves only the preview's own
   typeface, theme and hub choice in localStorage. */
(function(){
  "use strict";
  var A = window.SH_ART || {};
  var root = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, el){ return (el || document).querySelector(s); }
  function $$(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function h(html){ var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function fmt(n){ return Number(n).toLocaleString("en-US"); }
  function save(){ try { localStorage.setItem("sh_design_prefs", JSON.stringify({ face: root.dataset.face, theme: root.dataset.theme, hub: root.dataset.hub })); } catch (e) {} }

  /* ---------- drawing helpers ---------- */
  function icon(k, px, cls){
    var b = A.icons && A.icons[k] ? A.icons[k].body : "";
    return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" width="' + (px || 20) + '" height="' + (px || 20) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + "</svg>";
  }
  function art(inner, vb, cls, label){
    return '<svg class="' + (cls || "") + '" viewBox="' + vb + '" ' + (label ? 'role="img" aria-label="' + esc(label) + '"' : 'aria-hidden="true"') + ' focusable="false">' + inner + "</svg>";
  }
  /* Timmy, the house and the handpieces come from the live code with ids inside; give every copy on the page its own */
  var uq = 0;
  function uniq(s){
    var n = ++uq, map = {};
    s = s.replace(/\sid="([^"]+)"/g, function(m, id){ map[id] = id + "-c" + n; return ' id="' + map[id] + '"'; });
    return s.replace(/url\(#([^)]+)\)/g, function(m, id){ return "url(#" + (map[id] || id) + ")"; });
  }
  /* a static drawing goes on the page as an image (it's a picture, not a chart or text): its own document, so ids never collide */
  function img(svgStr, alt, cls, vb){
    if (vb) svgStr = '<svg viewBox="' + vb + '">' + svgStr + "</svg>";
    if (!/xmlns=/.test(svgStr)) svgStr = svgStr.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    return '<img class="' + (cls || "") + '" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr) + '" alt="' + esc(alt || "") + '" decoding="async">';
  }
  function emblemDisc(hub, cls){
    var t = A.tints[hub] || A.tints.generic, e = A.emblems[hub] || A.emblems.generic;
    return img('<circle cx="32" cy="32" r="31" fill="' + t.light + '"/>' + '<g transform="translate(6.4 6.4) scale(.8)">' + e.body + "</g>", e.label, cls, "0 0 64 64");
  }
  function flame(level, cls){ return art(A.flame[level], "0 0 40 48", "flame " + (cls || ""), level === 3 ? "A blazing streak" : level === 2 ? "A streak" : "A new streak"); }
  function xpSpark(){ return art(A.xp, "0 0 24 24", ""); }
  function ring(done, of, cls){
    var r = 15, c = 2 * Math.PI * r, off = c * (1 - Math.min(1, done / of));
    return '<svg class="ring ' + (cls || "") + '" viewBox="0 0 36 36" role="img" aria-label="' + done + " of " + of + ' questions today"><circle class="tr" cx="18" cy="18" r="' + r + '"/>' +
      '<circle class="pr" cx="18" cy="18" r="' + r + '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '"/></svg>';
  }
  function timmy(k){ return uniq(A.timmy.bar[k] || A.timmy.bar.happy); }

  /* the drawn answer marks: a hand-drawn ring or box that fills when picked, and a blob with a tick or a cross once
     answered (marks like articulating paper leaves on a cusp) */
  var RING = "M14 4.2C19.6 4 24 8.4 23.9 14c-.1 5.7-4.4 10-9.9 9.9C8.4 23.8 4.1 19.6 4.2 14 4.3 8.5 8.5 4.4 14 4.2Z";
  var DOT = "M14 9.4c2.7-.1 4.7 2 4.6 4.6-.1 2.7-2 4.7-4.6 4.6-2.7-.1-4.6-2-4.6-4.6.1-2.6 2-4.5 4.6-4.6Z";
  var BOX = "M7.5 4.6c4.3-.3 8.9-.3 13.1 0 1.8.1 2.8 1.1 2.9 2.9.2 4.3.2 8.7 0 13-.1 1.8-1.2 2.8-3 2.9-4.3.3-8.7.3-13 0-1.8-.1-2.8-1.1-2.9-2.9-.3-4.3-.3-8.7 0-13 .1-1.8 1.1-2.8 2.9-2.9Z";
  var BLOB = "M14 3.6c6-.2 10.6 4.4 10.4 10.6-.2 6-4.6 10.4-10.6 10.2-6-.2-10.4-4.6-10.2-10.6.2-5.9 4.5-10 10.4-10.2Z";
  function mark(kind, state){
    var o = '<svg class="mark" viewBox="0 0 28 28" aria-hidden="true">';
    if (state === "right") return o + '<path d="' + BLOB + '" fill="currentColor"/><path d="M9.2 14.4l3.4 3.4 6.4-7.4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (state === "wrong") return o + '<path d="' + BLOB + '" fill="currentColor"/><path d="M10.2 10.2l7.6 7.6M17.8 10.2l-7.6 7.6" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>';
    if (state === "missed") return o + '<path d="' + (kind === "box" ? BOX : RING) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/><path d="M9.2 14.4l3.4 3.4 6.4-7.4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (kind === "box") return o + '<path d="' + BOX + '" fill="none" stroke="currentColor" stroke-width="2"/><path class="on" d="M9 14.6l3.6 3.6 7-8.4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return o + '<path d="' + RING + '" fill="none" stroke="currentColor" stroke-width="2"/><path class="on" d="' + DOT + '" fill="currentColor"/></svg>';
  }

  /* ---------- the hubs (dates from the dashboard's HUBS) ---------- */
  var HUBS = {
    "occlusion":            { name: "Occlusion", exam: "Occlusion final", date: "2026-11-16", when: "Mon, Nov 16 · L6, L7 and L8", next: [["L7 Malocclusion and Dysfunction", 5], ["L6 Occlusal Instrumentation", 3]] },
    "perio":                { name: "Perio", exam: "Perio final", date: "2026-11-19", when: "Thu, Nov 19 · Sessions 6 to 9", next: [["S8 Pharmacotherapy: Antibiotics & Host Modulation", 5], ["S7 Implants for Periodontally Compromised Patients", 3]] },
    "pcd-implants-exam1":   { name: "PCD Implants", exam: "PCD Implants Exam 1", date: "2026-11-06", when: "Fri, Nov 6 · L1 to L9", next: [["L7 CBCT 101: Basic Science", 5], ["L3 Biomechanics in Implant Dentistry", 3]] },
    "heme-endo-exam2":      { name: "Heme & Endo 2", exam: "Heme & Endo Exam 2", date: "2026-11-13", when: "Fri, Nov 13 · L11 to L18 and Lecture A", next: [["L12a Endocrine Pathology, Part 1", 5], ["L11 Pharmacology of Diabetes Mellitus", 3]] },
    "special-patient-care": { name: "Special Patient Care", exam: "Special Patient Care exam", date: "2026-11-13", when: "Due Fri, Nov 13 · all eight lectures", next: [["L5 Syndromes and Oral Manifestations", 5], ["L2 Behavior Guidance and Protective Stabilization", 3]] },
    "generic":              { name: "A new hub", exam: "The next exam", date: "", when: "The date goes here once it's announced", next: [["L2, the second lecture", 5], ["L1, the first lecture", 3]] }
  };
  function daysTo(iso){
    if (!iso) return null;
    var p = iso.split("-"), t = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date(); n = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((t - n) / 864e5);
  }

  /* ---------- sample questions: Occlusion's own items, with their whys (as the hub has them) ---------- */
  var TWO_CHOICES = ["Both statements are true", "Both statements are false", "Statement 1 is true; statement 2 is false", "Statement 1 is false; statement 2 is true"];
  function two(o){
    var claims = [[true, true], [false, false], [true, false], [false, true]], tv = function(b){ return b ? "true" : "false"; };
    o.why = claims.map(function(c){
      if (c[0] === o.t1 && c[1] === o.t2) return "Statement 1 is " + tv(o.t1) + ": " + o.r1 + " Statement 2 is " + tv(o.t2) + ": " + o.r2;
      var out = [];
      if (c[0] !== o.t1) out.push("Statement 1 is " + tv(o.t1) + ", not " + tv(c[0]) + ": " + o.r1);
      if (c[1] !== o.t2) out.push("Statement 2 is " + tv(o.t2) + ", not " + tv(c[1]) + ": " + o.r2);
      return out.join(" ");
    });
    o.choices = TWO_CHOICES.slice(); o.answer = claims.findIndex(function(c){ return c[0] === o.t1 && c[1] === o.t2; });
    return o;
  }
  function numList(set){ return set.length === 1 ? String(set[0]) : set.slice(0, -1).join(", ") + " and " + set[set.length - 1]; }
  function numLabel(set){ return set.length === 1 ? set[0] + " only" : set.length === 2 ? set[0] + " and " + set[1] + " only" : numList(set); }
  function nums(o){
    var right = [], falses = [];
    o.truth.forEach(function(t, i){ (t ? right : falses).push(i + 1); });
    var sets = [right].concat(o.wrong).sort(function(a, b){ for (var i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; });
    o.why = sets.map(function(set){
      if (set === right) return (right.length === 1 ? "Only statement " + right[0] + " is true. " : "Statements " + numList(right) + " are true. ") +
        falses.map(function(k){ return "Statement " + k + " is false: " + o.reasons[k - 1]; }).join(" ");
      var out = [];
      set.forEach(function(k){ if (!o.truth[k - 1]) out.push("It includes " + k + ", which is false: " + o.reasons[k - 1]); });
      right.forEach(function(k){ if (set.indexOf(k) < 0) out.push("It leaves out " + k + ", which is true: " + o.reasons[k - 1]); });
      return out.join(" ");
    });
    o.choices = sets.map(numLabel); o.answer = sets.indexOf(right);
    return o;
  }
  /* "picks": made-up shares of the class's picks per choice (they add to 100), the way the live widget shows question_choices */
  var Q = [
    { id: "rv-embrasure", fmt: "single", name: "Single answer", lec: "L1 · Review of Basic Occlusion", likely: true,
      stem: "Posterior proximal contacts sit buccal to the central fossa line. What does that do for chewing?",
      choices: ["Lingual embrasures are larger, so food is preferentially returned toward the tongue", "Buccal embrasures are larger, so food is pushed out into the vestibule for the cheek to clear", "It keeps the marginal ridges level for cusp-fossa contact", "It lets the non-centric cusps carry the vertical dimension"],
      answer: 0, picks: [61, 24, 9, 6], preset: 0,
      ex: "Because contacts are buccal to the CF line, lingual embrasures are larger than buccal ones. Food falls back toward the tongue, “where you want it to go.” The tongue sweeps food that goes buccal back onto the table, working with the buccinator.",
      why: ["Contacts sit buccal to the central fossa line, so lingual embrasures are larger and food returns toward the tongue.", "The buccal embrasures are the smaller ones, because the contacts sit buccal to the central fossa line.", "Embrasure size affects where food goes, not the level of the marginal ridges.", "Vertical dimension is held by the centric cusps, and this has nothing to do with embrasure size."] },
    { id: "ex-noncentric", fmt: "except", name: "All except", lec: "L1 · Review of Basic Occlusion",
      stem: "All of the following describe non-centric cusps EXCEPT:",
      choices: ["They maintain the vertical dimension of occlusion", "They are relatively sharp, about 1/6 of the buccolingual width", "They help keep the bolus on the occlusal table", "They minimize cheek and tongue impingement"],
      answer: 0, picks: [54, 21, 15, 10], preset: 1,
      ex: "Maintaining VDO is the job of the CENTRIC cusps. Non-centric (shearing or guiding) cusps are sharp, near-contact by design, shear food, minimize tissue impingement and hold the bolus on the table.",
      why: ["This is the false statement: maintaining the vertical dimension of occlusion is the job of the centric cusps.", "Non-centric cusps are relatively sharp and about 1/6 of the buccolingual width, about half the size of centric cusps.", "Non-centric cusps do help hold the bolus on the occlusal table.", "Non-centric cusps do minimize cheek and tongue impingement."] },
    { id: "rv-goals", fmt: "multi", name: "Select all", lec: "L1 · Review of Basic Occlusion",
      stem: "Select every item on Dr. Givan's list of goals for ideal (modern) occlusion.",
      choices: ["Equal, simultaneous, stable centric contacts", "Occlusal forces directed down the long axes", "Elimination of balancing (mediotrusive) contacts", "Bilateral posterior contacts in all excursions", "Posterior contacts in protrusion to share load"],
      correct: [0, 1, 2], picks: [88, 81, 52, 30, 12], preset: [0, 1, 3],
      ex: "The goals: stable simultaneous centric contacts, force along the long axis, no balancing contacts, canine disclusion or anterior group function, i.e. mutually protected occlusion. Bilateral excursive contact is denture (balanced) occlusion; posterior protrusive contacts are what we try to eliminate.",
      why: ["Equal, simultaneous, stable centric contacts are on the list of goals for ideal occlusion.", "Directing occlusal forces down the long axes of the teeth is one of the goals.", "Eliminating balancing (mediotrusive) contacts is one of the goals.", "Bilateral posterior contacts in all excursions is balanced occlusion for dentures, not the modern goal for natural teeth.", "Posterior contacts in protrusion are what the modern scheme tries to eliminate; anterior teeth should disclude them."] },
    two({ id: "rv-2s-curves", fmt: "two", name: "Two statements", lec: "L1 · Review of Basic Occlusion",
      s1: "The curve of Spee is seen in the sagittal plane.", s2: "The curve of Wilson is seen in the frontal plane.", t1: true, t2: true,
      picks: [64, 7, 12, 17], preset: 3,
      ex: "Both are true. Spee is the anteroposterior curve (side view), from the mandibular canine cusp tip back to the front of the condyle. Wilson is the mediolateral curve (front view): concave in the mandibular arch, convex in the maxillary.",
      r1: "it runs from the mandibular canine cusp tip along the buccal cusp tips to the condyle, seen from the side.", r2: "it is the mediolateral curve of the posterior cusps, seen from the front." }),
    { id: "rv-tf-embrasure", fmt: "tf", name: "True or false", lec: "L1 · Review of Basic Occlusion",
      stem: "Because posterior contacts sit buccal to the central fossa line, the buccal embrasures are larger than the lingual ones.",
      choices: ["True", "False"], answer: 1, picks: [38, 62], preset: 1,
      ex: "False. With the contacts buccal to the central fossa line, the LINGUAL embrasures are larger, which returns food toward the tongue.",
      why: ["Contacts buccal to the fossa line make the lingual embrasures larger, not the buccal ones.", "The lingual embrasures are the larger ones, so food falls back toward the tongue."] },
    nums({ id: "an-num-1", fmt: "numbered", name: "Numbered statements", lec: "L2 · Functional TMJ Anatomy",
      lead: "Which statements about the TMJ and its disc are true?",
      stmts: ["Rotation happens in the lower compartment, between the disc and the condyle.", "The intermediate zone is the thickest part of the disc.", "The disc is slightly thicker medially than laterally.", "The retrodiscal tissues have no vessels or nerves, so loading them is painless."],
      truth: [true, false, true, false], wrong: [[1, 3, 4], [2, 3], [3, 4]], picks: [47, 22, 19, 12], preset: 2,
      ex: "Rotation happens in the lower compartment (disc to condyle), translation in the upper. The disc is biconcave: a thick anterior border, a thinner avascular intermediate zone where the condyle sits, and an even thicker posterior border; it is slightly thicker medially. The retrodiscal tissues are loaded with vessels and nerves.",
      reasons: ["the lower compartment (disc to condyle) is where rotation happens; translation is in the upper.", "the intermediate zone is the thin part where the condyle sits; the posterior border is the thickest.", "it is slightly thicker medially, so a disc that slips tends to go forward or medially.", "the retrodiscal tissues are loaded with vessels and nerves, and functioning on them causes substantial pain."] }),
    { id: "demo-cusp-30", fmt: "picture", name: "Picture", lec: "L1 · Review of Basic Occlusion",
      stem: "Which cusp of #30 is shaded in this occlusal view?",
      choices: ["Distobuccal", "Mesiobuccal", "Distal", "Distolingual"], answer: 0, picks: [58, 17, 16, 9], preset: 0,
      ex: "A mandibular first molar has three buccal cusps (mesiobuccal, distobuccal, distal) and two lingual ones (mesiolingual, distolingual). The shaded one is the middle of the three buccal cusps: the distobuccal.",
      why: ["It is the middle of the three buccal cusps, between the mesiobuccal and the small distal cusp.", "The mesiobuccal is the first buccal cusp, at the mesial end of the buccal side.", "The distal cusp is the smallest, at the distal end of the buccal side.", "The distolingual is on the lingual side, across from the shaded cusp."] },
    { id: "cs-mo-mob-type", fmt: "case", name: "Patient Box", lec: "L7 · Malocclusion and Dysfunction",
      pbox: [["Patient", "58-year-old man"], ["Teeth", "#24 and #25"], ["Mobility", "Miller 2 at last year's recall; Miller 2 today"], ["Perio", "Probing depths 2-3 mm, no bleeding; stable bone levels on radiographs"], ["Symptoms", "None; chews normally"]],
      stem: "How should his mobility be classified?",
      choices: ["Adapted mobility", "Traumatic mobility", "Physiologic mobility under 150 µm", "Implant-level mobility"], answer: 0, picks: [51, 33, 12, 4], preset: 1,
      ex: "Miller 2 a year ago and Miller 2 today, without progression: adapted mobility, self-limiting and possibly present for years. Traumatic mobility increases over time. Class 2 is beyond the physiologic limit.",
      why: ["Stable over a year: adapted mobility.", "Traumatic mobility increases over time.", "Miller 2 is beyond the 150 µm physiologic limit.", "Implants barely move; these are natural teeth."] },
    { id: "recall-curves", fmt: "recall", name: "Recall card", lec: "L1 · Review of Basic Occlusion",
      front: "Name the two curves of occlusion and the plane each one is seen in.",
      back: "The curve of Spee: the sagittal plane (seen from the side). The curve of Wilson: the frontal plane (seen from the front)." }
  ];
  var LIVE = Q[0];

  /* the picture question's figure: #30 from the occlusal side, mesial to the left, buccal at the bottom, drawn in ink */
  function cuspFigure(){
    var I = A.ink || "#3B2E3A";
    return '<svg viewBox="0 0 280 190" role="img" aria-label="The occlusal outline of tooth 30 with five cusps; the middle buccal cusp is shaded.">' +
      '<path d="M40 60 C46 30 92 22 140 24 C190 22 236 30 242 64 C250 96 248 132 238 152 C228 172 190 176 140 175 C90 176 52 172 42 150 C32 126 34 88 40 60 Z" fill="#FFFDF6" stroke="' + I + '" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M58 92 C78 98 104 100 122 96 C146 104 170 104 190 98 C206 102 220 100 230 96" fill="none" stroke="' + I + '" stroke-width="2" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M120 96 C118 74 124 52 130 34 M190 98 C192 120 186 146 178 168 M104 100 C100 124 96 148 92 168" fill="none" stroke="' + I + '" stroke-width="2" stroke-linecap="round" opacity=".55"/>' +
      '<path class="hl" d="M106 104 C122 104 160 106 186 102 C190 124 184 150 176 166 C152 172 122 172 96 168 C98 146 100 124 106 104 Z" fill="var(--hub-mid)" opacity=".85"/>' +
      [[82, 136, 15], [140, 138, 14], [208, 132, 11], [86, 58, 17], [190, 58, 17]].map(function(c){ return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="none" stroke="' + I + '" stroke-width="2.2"/>'; }).join("") +
      '<path d="M70 50 C74 44 80 41 86 40" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" opacity=".7"/></svg>';
  }

  /* ---------- the question card ---------- */
  var state = { xp: 6240, goal: 19, of: 20, streak: 6, session: 24, right: 18, xpToday: 131, hp: 82, tried: {} };

  function card(q, opt){
    opt = opt || {};
    var multi = q.fmt === "multi", tf = q.fmt === "tf";
    var el = h('<article class="qc" data-fmt="' + q.fmt + '" aria-label="' + esc(q.name) + ' question"></article>');
    var head = '<header class="qc-head"><span>' + esc(q.lec) + "</span>" + (q.likely ? '<span class="likely">' + icon("hints", 14) + "High likelihood</span>" : "") +
      '<span class="grow"></span><span class="qc-tools"><button class="btn btn-icon" type="button" aria-label="Pin this question">' + icon("pin", 18) + "</button>" +
      '<button class="btn btn-icon" type="button" aria-label="Report a problem with this question">' + icon("report", 18) + "</button></span></header>";
    if (q.fmt === "recall") {
      el.innerHTML = head + '<p class="qc-stem">Say it to yourself, then check.</p><div class="recall-face"><p>' + esc(q.front) + '</p><p class="recall-back" hidden><b>Answer.</b> ' + esc(q.back) + "</p></div>" +
        '<div class="qc-go"><button class="btn btn-primary" type="button" data-reveal>Show the answer</button></div>' +
        '<div class="qc-go" data-grade hidden><button class="btn" type="button" data-g="1">' + icon("check", 18) + 'Got it</button><button class="btn" type="button" data-g="0">' + icon("retry", 18) + "Not yet</button></div>";
      $("[data-reveal]", el).addEventListener("click", function(){ $(".recall-back", el).hidden = false; this.parentNode.hidden = true; $("[data-grade]", el).hidden = false; });
      $$("[data-g]", el).forEach(function(b){ b.addEventListener("click", function(){
        var g = $("[data-grade]", el); g.innerHTML = '<p class="note">' + (b.dataset.g === "1" ? "Marked as known. It comes back in a few days." : "It comes back at the end of this set.") + '</p><button class="btn btn-text" type="button">' + icon("retry", 18) + "Again</button>";
        $("button", g).addEventListener("click", function(){ var n = card(q, opt); el.replaceWith(n); });
      }); });
      if (opt.preset != null) { $("[data-reveal]", el).click(); }
      return el;
    }
    var stem = "";
    if (q.fmt === "two") stem = '<p class="qc-stem">Read the two statements.</p><ol class="qc-stmts"><li><b>1</b><span>' + esc(q.s1) + "</span></li><li><b>2</b><span>" + esc(q.s2) + "</span></li></ol>";
    else if (q.fmt === "numbered") stem = '<p class="qc-stem">' + esc(q.lead) + '</p><ol class="qc-stmts">' + q.stmts.map(function(s, i){ return "<li><b>" + (i + 1) + "</b><span>" + esc(s) + "</span></li>"; }).join("") + "</ol>";
    else if (q.fmt === "tf") stem = '<p class="qc-stem">True or false: ' + esc(q.stem) + "</p>";
    else stem = '<p class="qc-stem">' + esc(q.stem) + "</p>";
    if (q.fmt === "case") stem = '<dl class="pbox">' + q.pbox.map(function(r){ return "<div><dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl>" + stem;
    if (q.fmt === "picture") stem = '<figure class="qfig">' + cuspFigure() + "<figcaption>Occlusal view of #30: mesial to the left, buccal at the bottom</figcaption></figure>" + stem;
    var choices = '<ul class="qc-choices' + (tf ? " qc-tf" : "") + '">' + q.choices.map(function(c, i){
      return '<li><button class="ch" type="button" data-i="' + i + '" aria-pressed="false">' + mark(multi ? "box" : "ring") + '<span class="txt">' + esc(c) + '</span><span class="pct num" aria-hidden="true"></span><span class="share" aria-hidden="true"></span></button></li>';
    }).join("") + "</ul>";
    el.innerHTML = head + stem + choices + (multi ? '<div class="qc-go"><button class="btn btn-primary" type="button" data-check disabled>Check my answer</button><span class="note" data-hint>Select every right answer, then check.</span></div>' : "") +
      '<section class="qc-result" hidden aria-live="polite"></section>';

    var picked = [];
    $$(".ch", el).forEach(function(b){
      b.addEventListener("click", function(){
        if (el.classList.contains("answered")) return;
        var i = +b.dataset.i;
        if (multi) {
          var k = picked.indexOf(i); if (k > -1) picked.splice(k, 1); else picked.push(i);
          b.setAttribute("aria-pressed", k > -1 ? "false" : "true");
          $("[data-check]", el).disabled = !picked.length;
          return;
        }
        picked = [i]; b.setAttribute("aria-pressed", "true");
        answer(b);
      });
    });
    if (multi) $("[data-check]", el).addEventListener("click", function(){ if (picked.length) answer(this); });

    function answer(from){
      el.classList.add("answered");
      var good = multi ? q.correct : [q.answer];
      var hits = picked.filter(function(i){ return good.indexOf(i) > -1; }).length;
      var score = multi ? Math.max(0, (hits - (picked.length - hits)) / good.length) : (hits ? 1 : 0);
      var right = score === 1;
      $$(".ch", el).forEach(function(b){
        var i = +b.dataset.i, isGood = good.indexOf(i) > -1, isPick = picked.indexOf(i) > -1;
        var st = isGood && isPick ? "right" : isPick ? "wrong" : isGood ? (multi ? "missed" : "right") : "";
        if (st === "right") b.classList.add("is-right"); else if (st === "wrong") b.classList.add("is-wrong"); else if (st === "missed") b.classList.add("is-missed");
        if (st) b.querySelector(".mark").outerHTML = mark(multi ? "box" : "ring", st);
        /* the state and the class's share are read out from text inside the button, so its name keeps its visible words */
        var said = st === "right" ? (isPick ? "right, your pick" : "right") : st === "wrong" ? "your pick, wrong" : st === "missed" ? "right, not picked" : "";
        b.querySelector(".txt").insertAdjacentHTML("beforeend", said ? '<span class="sr">, ' + said + "</span>" : "");
        var pc = b.querySelector(".pct"); pc.innerHTML = q.picks[i] + '%<span class="sr"> of the class picked it</span>'; pc.removeAttribute("aria-hidden");
        var sh = b.querySelector(".share"); requestAnimationFrame(function(){ sh.style.width = q.picks[i] + "%"; });
      });
      var go = $(".qc-go", el); if (go) go.hidden = true;
      var first = !state.tried[q.id + (opt.live ? ":live" : opt.key || "")];
      state.tried[q.id + (opt.live ? ":live" : opt.key || "")] = 1;
      var xp = right ? (first ? 10 : 2) : 1;
      var verdict = right ? '<p class="verdict ok">' + icon("check", 26) + 'Right<span class="xp num">+' + xp + " XP</span></p>"
        : multi && score > 0 ? '<p class="verdict part">' + icon("goal", 26) + "Partly right: " + hits + " of " + good.length + '<span class="xp num">+' + xp + " XP</span></p>"
        : '<p class="verdict no">' + icon("cross", 26) + 'Not quite<span class="xp num">+' + xp + " XP</span></p>";
      var open = {};
      $$(".ch", el).forEach(function(b){ if (b.classList.contains("is-wrong") || b.classList.contains("is-missed")) open[b.dataset.i] = 1; });
      if (!Object.keys(open).length) open[picked[0]] = 1;
      var whys = '<div class="why"><h4>Why each choice</h4>' + q.choices.map(function(c, i){
        var b = $('.ch[data-i="' + i + '"]', el), tag = b.classList.contains("is-wrong") ? "Your pick" : b.classList.contains("is-right") && picked.indexOf(i) > -1 ? "Your pick" : b.classList.contains("is-missed") ? "You missed this one" : "";
        var st = b.classList.contains("is-right") ? "right" : b.classList.contains("is-wrong") ? "wrong" : b.classList.contains("is-missed") ? "missed" : "";
        return "<details" + (open[i] ? " open" : "") + '><summary><span class="tick" style="color:' + (st === "wrong" ? "var(--wrong)" : st ? "var(--right)" : "var(--muted)") + '">' + (st ? mark(multi ? "box" : "ring", st) : mark(multi ? "box" : "ring")) + "</span><span>" + esc(c) +
          (tag ? ' <span class="tag">· ' + tag + "</span>" : "") + '</span><span class="chev">' + icon("chevron", 16) + "</span></summary><p>" + esc(q.why[i]) + "</p></details>";
      }).join("") + "</div>";
      var res = $(".qc-result", el);
      res.innerHTML = verdict + '<p class="qc-ex">' + esc(q.ex) + ' <a href="#formats">Find this in the notes</a></p>' + whys +
        '<div class="qc-after"><button class="btn" type="button" data-again>' + icon("retry", 18) + 'Try it again</button><span class="grow"></span>' +
        '<span class="thumbs">Good question?<button class="btn btn-icon" type="button" aria-label="Good question">' + icon("thumbup", 18) + '</button><button class="btn btn-icon" type="button" aria-label="Not a good question">' + icon("thumbdown", 18) + "</button></span></div>";
      res.hidden = false;
      $("[data-again]", res).addEventListener("click", function(){ var n = card(q, opt); el.replaceWith(n); if (opt.live) n.querySelector(".ch").focus(); });
      if (opt.live && !opt.silent) reward(from, right, xp);
    }
    if (opt.preset != null) {
      var pre = [].concat(opt.preset);
      if (multi) { pre.forEach(function(i){ $('.ch[data-i="' + i + '"]', el).click(); }); $("[data-check]", el).click(); }
      else $('.ch[data-i="' + pre[0] + '"]', el).click();
    }
    return el;
  }

  /* ---------- the rewards on a live answer ---------- */
  function visible(el){ return el && el.offsetParent !== null && el.getBoundingClientRect().width > 0; }
  function reward(from, right, xp){
    var target = [$("#rankPill"), $("#phoneXp")].filter(visible)[0];
    flyXp(from, target, xp, function(){
      state.xp += xp; state.xpToday += xp;
      $$("[data-xp]").forEach(function(n){ countUp(n, state.xp - xp, state.xp); });
      $$("[data-xptoday]").forEach(function(n){ n.textContent = "+" + fmt(state.xpToday) + " XP"; });
      if (target) { target.classList.remove("bump"); void target.offsetWidth; target.classList.add("bump"); }
    });
    react(right, right ? "Nice one! +" + xp + " XP" : "So close. Read why each choice is what it is.");
    state.session++; if (right) state.right++;
    setTimeout(function(){
      if (state.goal < state.of) {
        state.goal++;
        $$("[data-ring]").forEach(function(r){ r.outerHTML = ring(state.goal, state.of, r.getAttribute("class").replace("ring", "").trim()).replace("<svg ", '<svg data-ring="1" '); });
        $$("[data-goaltext]").forEach(function(n){ n.textContent = state.goal + " of " + state.of; });
        if (state.goal === state.of) {
          state.streak++;
          setTimeout(function(){
            $$("[data-streak]").forEach(function(n){ n.textContent = state.streak + " days"; });
            $$("[data-flame]").forEach(function(f){ var lvl = state.streak >= 7 ? 3 : state.streak >= 3 ? 2 : 1; var n = h(flame(lvl, "grow-in")); n.setAttribute("data-flame", "1"); f.replaceWith(n); });
            $$("[data-goalcap]").forEach(function(n){ n.textContent = "Goal met. Your streak grows to " + state.streak + " days."; });
            react(true, "Goal met! " + state.streak + " days in a row.");
          }, 900);
        }
      }
      if (state.session === 25) showRecap();
      $$("[data-togo]").forEach(function(n){ var left = 25 - state.session; n.textContent = left > 0 ? left + " to go" : "done"; });
      $$("[data-session]").forEach(function(n){ n.textContent = state.session + " answered · " + state.right + " right"; });
    }, reduced ? 0 : 700);
  }
  function flyXp(from, to, xp, done){
    if (!from || !to || reduced) { done(); return; }
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    var n = h('<span class="xpfly" aria-hidden="true">' + xpSpark() + "+" + xp + "</span>");
    document.body.appendChild(n);
    var w = n.offsetWidth, hh = n.offsetHeight;
    var x0 = a.left + Math.min(a.width - w - 12, 64), y0 = a.top + a.height / 2 - hh / 2, x1 = b.left + b.width / 2 - w / 2, y1 = b.top + b.height / 2 - hh / 2;
    var mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 80;
    var anim = n.animate([
      { transform: "translate(" + x0 + "px," + y0 + "px) scale(.6)", opacity: 0 },
      { transform: "translate(" + x0 + "px," + (y0 - 18) + "px) scale(1.1)", opacity: 1, offset: .18 },
      { transform: "translate(" + mx + "px," + my + "px) scale(1)", opacity: 1, offset: .6 },
      { transform: "translate(" + x1 + "px," + y1 + "px) scale(.5)", opacity: .2 }
    ], { duration: 950, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });
    anim.onfinish = function(){ n.remove(); done(); };
  }
  function countUp(n, a, b){
    if (reduced) { n.textContent = fmt(b); return; }
    var t0 = performance.now(), d = 450;
    (function step(t){ var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); n.textContent = fmt(Math.round(a + (b - a) * e)); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  var reactTimer;
  function react(right, say){
    var btn = $("#barTimmy"), bub = $("#bubble");
    if (!btn) return;
    clearTimeout(reactTimer);
    btn.innerHTML = timmy(right ? "happy" : "scared");
    btn.classList.remove("cheer", "flinch"); void btn.offsetWidth; btn.classList.add(right ? "cheer" : "flinch");
    bub.textContent = say; bub.classList.add("on");
    reactTimer = setTimeout(function(){ bub.classList.remove("on"); btn.classList.remove("cheer", "flinch"); btn.innerHTML = timmy("happy"); }, 2600);
  }
  function recapHTML(cls, hub){
    var nx = (HUBS[hub] || HUBS.occlusion).next, right = hub ? state.right : 19, xp = hub ? state.xpToday : 141;
    return '<div class="recap ' + (cls || "") + '"><h3>That was 25 questions</h3><div class="figs">' +
      '<div><b class="num" data-count="' + right + '">' + right + '</b><span>right of 25</span></div><div><b class="num" data-count="' + xp + '">+' + xp + '</b><span>XP this session</span></div>' +
      '<div><b class="num">+6</b><span>Timmy’s HP, now 88</span></div><div><b class="num">7 days</b><span>streak</span></div></div>' +
      '<div class="next">Look at these next<ul>' + nx.map(function(n){ return "<li>" + esc(n[0]) + " <span>" + n[1] + " missed</span></li>"; }).join("") + '</ul></div>' +
      '<div class="qc-go"><button class="btn btn-primary" type="button">Keep going</button><button class="btn" type="button">Practice the misses</button></div></div>';
  }
  function showRecap(){
    var slot = $("#recapSlot"); if (!slot) return;
    slot.innerHTML = recapHTML("enter", root.dataset.hub);
    state.hp = 88; $$("[data-hp]").forEach(function(n){ n.textContent = state.hp + " HP"; });
    $$("[data-count]", slot).forEach(function(n){ var to = +n.dataset.count, plus = n.textContent.charAt(0) === "+"; if (reduced) return; var t0 = performance.now();
      (function step(t){ var k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); n.textContent = (plus ? "+" : "") + Math.round(to * e); if (k < 1) requestAnimationFrame(step); })(t0); });
  }

  /* ---------- the hub frame ---------- */
  function buildHub(){
    var hub = root.dataset.hub, H = HUBS[hub] || HUBS.generic, d = daysTo(H.date), M = A.mastheads[hub] || A.mastheads.generic;
    var hp = A.handpieces[3];
    var lvl = state.streak >= 7 ? 3 : state.streak >= 3 ? 2 : 1;
    var count = d == null ? '<b>Soon</b><span>a countdown once the date is set</span>' : d > 1 ? '<b class="num">' + d + '</b><span>days to go</span>' : d === 1 ? '<b>Tomorrow</b><span>one more evening</span>' : d === 0 ? '<b>Today</b><span>good luck</span>' : '<b>Done</b><span>this exam has passed</span>';
    var frame = '<div class="hubframe">' +
      '<nav class="hubbar" aria-label="' + esc(H.name) + ' hub">' +
        '<span class="hubname">' + emblemDisc(hub, "emb-disc") + "<span>" + esc(H.name) + "</span></span>" +
        '<span class="tabs">' + [["home", "Home", 1], ["notes", "Notes"], ["questions", "Questions"], ["more", "More"]].map(function(t){
          return '<button class="tab" type="button"' + (t[2] ? ' aria-current="page"' : "") + ">" + icon(t[0], 20) + "<span>" + t[1] + "</span></button>"; }).join("") + "</span>" +
        '<span class="spacer"></span>' +
        '<span class="meters">' +
          '<span class="meter" title="Your streak">' + flame(lvl).replace("<svg ", '<svg data-flame="1" ') + '<span class="num" data-streak>' + state.streak + ' days</span></span>' +
          '<span class="meter" title="Today\'s goal">' + ring(state.goal, state.of).replace("<svg ", '<svg data-ring="1" ') + '<span class="num lbl" data-goaltext>' + state.goal + " of " + state.of + "</span></span>" +
          '<span class="rankpill" id="rankPill"><span class="hp">' + uniq(hp.svg) + '</span><b>Silver II</b><span class="xpn num"><span data-xp>' + fmt(state.xp) + "</span> XP</span></span>" +
        "</span>" +
        '<span class="barTimmy"><span class="bubble" id="bubble" role="status"></span><button class="timmy-btn" id="barTimmy" type="button" aria-label="Timmy, your tooth buddy: 82 HP">' + timmy("happy") + "</button></span>" +
      "</nav>" +
      '<div class="phonemeters" aria-label="Today">' +
        '<span class="meter">' + flame(lvl).replace("<svg ", '<svg data-flame="1" ') + '<span class="num" data-streak>' + state.streak + " days</span></span>" +
        '<span class="meter">' + ring(state.goal, state.of).replace("<svg ", '<svg data-ring="1" ') + '<span class="num" data-goaltext>' + state.goal + " of " + state.of + "</span></span>" +
        '<span class="grow"></span><span class="meter" id="phoneXp">' + xpSpark().replace("<svg ", '<svg width="20" height="20" ') + '<span class="num"><span data-xp>' + fmt(state.xp) + "</span> XP</span></span>" +
      "</div>" +
      '<div class="hubbody">' +
        '<figure class="mast">' + img(M.body, M.label, "", "0 0 600 200") + "</figure>" +
        '<div class="examcard"><p class="exam-when">' + esc(H.when) + '</p><h3 class="exam-title">' + esc(H.exam) + '</h3><p class="count">' + count + "</p>" +
          '<div class="quick"><button class="btn btn-primary" type="button">' + icon("questions", 20) + "Practice questions</button>" +
          '<button class="btn" type="button">' + icon("drill", 20) + 'Daily drill</button><button class="btn" type="button">' + icon("notes", 20) + "Notes</button>" +
          '<button class="btn" type="button">' + icon("mock", 20) + 'Mock exam</button><button class="btn" type="button">' + icon("podcast", 20) + "Timmy Time</button></div></div>" +
        '<div class="qstrip" role="group" aria-label="Question sets"><h3>Questions</h3>' +
          [["All", 412, 1], ["High likelihood", 38], ["Yesterday’s misses", 6], ["Daily drill", 15], ["Weak spots", 22], ["Mock", 50]].map(function(c){
            return '<button class="chip" type="button" aria-pressed="' + (c[2] ? "true" : "false") + '">' + c[0] + ' <span class="n num">' + c[1] + "</span></button>"; }).join("") + "</div>" +
        '<div class="livecard" id="liveCard"></div>' +
        '<aside class="today" aria-label="Today">' +
          '<div class="panel"><h3>Today</h3><div class="panel-body big-ring">' + ring(state.goal, state.of, "").replace("<svg ", '<svg data-ring="1" ') +
            '<div><p class="ring-num num" data-goaltext>' + state.goal + " of " + state.of + '</p><p class="ring-cap" data-goalcap>One more right or wrong answer meets today’s goal.</p></div></div>' +
            '<dl class="kv"><div><dt>' + icon("flame", 18) + 'Streak</dt><dd class="num" data-streak>' + state.streak + " days</dd></div>" +
            "<div><dt>" + icon("xp", 18) + 'XP today</dt><dd class="num" data-xptoday>+' + state.xpToday + " XP</dd></div>" +
            "<div><dt>" + icon("questions", 18) + 'This session</dt><dd class="num" data-session>' + state.session + " answered · " + state.right + " right</dd></div>" +
            "<div><dt>" + icon("tooth", 18) + 'Timmy</dt><dd class="num" data-hp>' + state.hp + " HP</dd></div></dl></div>" +
          '<div id="recapSlot"><div class="panel soon"><h3>Session recap</h3><p>It opens here after 25 answers: <span class="num" data-togo>1 to go</span>.</p></div></div>' +
        "</aside>" +
      "</div></div>";
    var wrap = $("#hubDemo"); wrap.innerHTML = frame;
    var live = LIVE_BY_HUB[hub] || LIVE;
    $("#liveCard").appendChild(card(live, { live: true }));
  }
  /* each hub's own question for the live card (its id, stem, choices and whys as the hub ships them) */
  /* copied from each hub's bank (same id, stem, explanation and whys; the choices in a different order, as the hubs
     shuffle them); the class's picks are made up */
  var LIVE_BY_HUB = {
    "perio": { id: "q1-02", fmt: "single", name: "Single answer", lec: "S1 · Overview of Diagnosis, Classification & Treatment Planning",
      stem: "Probing depth is 7 mm, and the CEJ is felt 4 mm apical to the gingival margin (no visible recession). What is the clinical attachment level?",
      choices: ["7 mm", "11 mm", "3 mm", "4 mm"], answer: 2, picks: [22, 9, 58, 11],
      ex: "CAL = PD + GR using signed GR. Here GR = -4 (CEJ is subgingival), so CAL = 7 + (-4) = 3 mm of attachment loss.",
      why: ["7 mm is the probing depth; it ignores the 4 mm of pocket that sits above the CEJ on enamel.", "11 mm adds the 4 mm instead of subtracting it; a subgingival CEJ makes GR negative.", "With the CEJ 4 mm below the margin, GR is -4, so CAL = 7 + (-4) = 3 mm.", "4 mm is the CEJ-to-margin distance (the negative recession), not the attachment loss."] },
    "pcd-implants-exam1": { id: "ev-gold", fmt: "single", name: "Single answer", lec: "L1 · Evolution of Dental Implants",
      stem: "Why did the gold roots used in 1809 fail to integrate with bone?",
      choices: ["Gold is toxic and killed the surrounding bone", "Gold forms very little surface oxide for bone to bond to", "Gold was too brittle and fractured under normal chewing forces", "Gold corroded quickly in saliva"], answer: 1, picks: [14, 63, 9, 14],
      ex: "Today's titanium implants carry a titanium oxide layer, a ceramic, and the bone integrates with that oxide. Gold has very little oxide, so it never osseointegrated.",
      why: ["Lead was the toxic one; gold resists corrosion.", "Bone integrates with a metal's oxide layer, and gold has almost none.", "Porcelain was the one that broke; gold is soft and ductile.", "Gold resists corrosion; its problem was the missing oxide."] },
    "heme-endo-exam2": { id: "dm-ins-shortest", fmt: "single", name: "Single answer", lec: "L11 · Pharmacology of Diabetes Mellitus",
      stem: "Of these insulins, which one's effect wears off soonest?",
      choices: ["Regular insulin", "NPH insulin", "Insulin detemir", "Insulin lispro"], answer: 3, picks: [27, 6, 4, 63],
      ex: "Shortest to longest: rapid analogs (lispro, aspart, glulisine), then regular, then NPH, then the long-acting glargine and detemir, then ultra-long degludec. These time profiles decide which insulin is basal and which is used as needed with meals.",
      why: ["Regular (short-acting) insulin peaks around 3 hours and is gone by about 8 hours, longer than the rapid analogs.", "NPH is intermediate-acting: protamine slows its absorption so it lasts longer than regular insulin.", "Detemir is a long-acting basal insulin.", "Lispro is rapid-acting: onset in 5 to 15 minutes and a total duration of about 4 hours, the shortest here."] },
    "special-patient-care": { id: "in-rosa", fmt: "single", name: "Single answer", lec: "L1 · Introduction to Special Patient Care",
      stem: "What did Rosa's Law (2010) do?",
      choices: ["Required public schools to provide special education", "Added disability to the ADA Code of Ethics", "Removed the term “mental retardation” from U.S. federal documents", "Required dental schools to teach management of special needs patients"], answer: 2, picks: [12, 8, 71, 9],
      ex: "By 2010, Rosa's Law eliminated “mental retardation” from federal documents; the DSM-5 made the same change in 2013, using intellectual disability.",
      why: ["That came from national laws by 1978.", "That was the ADA's own revision in 2018.", "It replaced it with intellectual disability in federal documents.", "That was CODA's 2019 change to Standard 2."] }
  };

  /* ---------- page sections ---------- */
  function tiles(){
    var trophies = Object.keys(A.trophies || {}), secret = trophies.filter(function(k){ return A.trophies[k].secret; }).length;
    var T = [
      ["#icons", "Icons", Object.keys(A.icons || {}).length, "Drawn by hand on a 24 grid"],
      ["#hubart", "Hub emblems and scenes", (A.hubs || []).length * 2, (A.hubs || []).length + " emblems and " + (A.hubs || []).length + " masthead scenes"],
      ["#medals", "Mastery medals", (A.hubs || []).length * 4, "Bronze to Crown in each hub’s colors"],
      ["#medals", "Trophies", trophies.length, secret + " of them secret until won"]
    ];
    $("#tiles").innerHTML = T.map(function(t){ return '<a class="tile s3" href="' + t[0] + '"><p class="tile-label">' + t[1] + '</p><p class="tile-value num">' + t[2] + '</p><p class="tile-cap">' + t[3] + "</p></a>"; }).join("");
  }

  function pairs(){
    var out = $("#pairs");
    Q.forEach(function(q){
      var g = h('<div class="grid pair"><div class="pair-head"><h3>' + esc(q.name) + "</h3><p>" + esc(FORMAT_NOTE[q.fmt] || "") + '</p></div><div class="s6"><p class="state">Waiting for an answer</p></div><div class="s6"><p class="state">Answered</p></div></div>');
      out.appendChild(g);
      var cols = $$(".s6", g);
      cols[0].appendChild(card(q, { key: ":a" }));
      cols[1].appendChild(card(q, { key: ":b", preset: q.fmt === "recall" ? 1 : q.preset }));
    });
  }
  var FORMAT_NOTE = {
    single: "Tap a choice to answer; the High likelihood tag shows on the topics most likely to be on the exam.",
    except: "The same card; the stem carries the EXCEPT.",
    multi: "Tick boxes, then Check. Right picks, wrong picks and the ones you missed each get their own mark.",
    two: "The statements are numbered and the four choices never shuffle.",
    tf: "Two big choices, side by side.",
    numbered: "The statements are numbered; the combinations stay in their fixed order.",
    picture: "The drawing sits above the stem only when the question needs it.",
    case: "The Patient Box sits above the stem.",
    recall: "Say it, check it, and mark it known or not yet. No XP, no class picks."
  };

  function rewards(){
    var g = $("#rewardGrid");
    var flight = '<div class="flight" aria-hidden="true"><div class="from"><button class="ch is-right" type="button" tabindex="-1">' + mark("ring", "right") + '<span class="txt">Lingual embrasures are larger</span><span class="pct num" style="opacity:1">61%</span><span class="share" style="width:61%"></span></button></div>' +
      '<svg class="path" viewBox="0 0 500 150" preserveAspectRatio="none"><path d="M262 84 C 292 30, 330 14, 352 18"/></svg>' +
      '<span class="mid">' + xpSpark() + '</span><span class="to rankpill" id="demoPill"><span class="hp">' + uniq(A.handpieces[3].svg) + '</span><b>Silver II</b><span class="xpn num">6,250 XP</span></span></div>';
    g.innerHTML =
      '<div class="panel s6"><h3>The XP spark</h3><p>It lifts off the choice you picked and lands on your rank, which counts up: 10 XP the first time you get one right, 2 after that, 1 for a miss.</p><div class="panel-body">' + flight + '</div><div class="qc-go"><button class="btn" type="button" id="playFly">' + icon("play", 18) + "Play it</button></div></div>" +
      '<div class="panel s6"><h3>Timmy reacts</h3><p>On the bar, never over the question: a hop and a cheer for a right answer, a flinch for a miss, a few words in his bubble.</p><div class="panel-body react">' +
        '<figure><span class="tim" id="cheerTim">' + timmy("happy") + '</span><figcaption><span class="say">Nice one! +10 XP</span></figcaption></figure>' +
        '<figure><span class="tim" id="flinchTim">' + timmy("scared") + '</span><figcaption><span class="say">So close. Read why.</span></figcaption></figure></div>' +
        '<div class="qc-go"><button class="btn" type="button" id="playTim">' + icon("play", 18) + "Play it</button></div></div>" +
      '<div class="s6 stack">' +
        '<div class="panel"><h3>The streak flame</h3><p>A day counts when you meet your goal. The flame grows at 3 days and blazes at 7.</p><div class="panel-body flames">' +
          [[1, "1 day"], [2, "4 days"], [3, "7 days and up"]].map(function(f){ return "<figure>" + flame(f[0]) + "<figcaption>" + f[1] + "</figcaption></figure>"; }).join("") + "</div></div>" +
        '<div class="panel"><h3>The daily goal</h3><p>20 questions a day unless you change it; Timmy cheers when the ring closes.</p><div class="panel-body rings">' +
          [[0, "Not started"], [12, "12 of 20"], [20, "Done"]].map(function(r){ return "<figure>" + ring(r[0], 20) + "<figcaption>" + r[1] + "</figcaption></figure>"; }).join("") + "</div></div>" +
      "</div>" +
      '<div class="panel s6"><h3>The session recap</h3><p>After 25 answers, or when you leave the bank: what you did, what Timmy got out of it and the two lectures to look at next.</p><div class="panel-body">' + recapHTML("") + "</div></div>";
    $("#playFly").addEventListener("click", function(){ var from = $(".flight .ch"), to = $("#demoPill"); flyXp(from, to, 10, function(){ to.classList.remove("bump"); void to.offsetWidth; to.classList.add("bump"); }); });
    $("#playTim").addEventListener("click", function(){
      [["#cheerTim", "cheer"], ["#flinchTim", "flinch"]].forEach(function(p){ var t = $(p[0]); t.classList.add("timmy-btn"); t.classList.remove("cheer", "flinch"); void t.offsetWidth; t.classList.add(p[1]); });
    });
  }

  function faces(){
    var f = [
      ["nunito", "Nunito Sans", "face-nunito", "A humanist sans with rounded ends: friendly at 13 px on a phone, and its figures are all one width, so counters and timers don’t jitter.", ["Regular 400", 400], ["Bold 700", 700], ["Extra bold 800", 800]],
      ["fraunces", "Fraunces", "face-fraunces", "A soft text serif with a lot of character at large sizes. Its figures are proportional (the font has no tabular set), so a number that counts up shifts as it changes.", ["Regular 400", 400], ["Semibold 600", 600], ["Bold 700", 700]]
    ];
    $("#faces").innerHTML = f.map(function(x){
      return '<div class="panel s6 ' + x[2] + '"><h3>' + x[1] + "</h3><p>" + esc(x[3]) + '</p><div class="panel-body face-spec">' +
        '<p class="aa">Aa Bb Gg 0123</p><p class="line">Centric cusps hold the vertical dimension; non-centric cusps shear, guide and keep the cheek clear.</p>' +
        '<p class="weights">' + [x[4], x[5], x[6]].map(function(w){ return '<span style="font-weight:' + w[1] + '">' + w[0] + "</span>"; }).join("") + "</p>" +
        '<table class="counter"><caption class="sr">XP figures in a column</caption><tbody><tr><td>Your XP</td><td class="num">6,240</td></tr><tr><td>The class leader</td><td class="num">11,118</td></tr><tr><td>A first week</td><td class="num">1,111</td></tr></tbody></table>' +
        '<div class="qc-go"><button class="btn" type="button" data-setface="' + x[0] + '">Set the page in ' + x[1] + "</button></div></div></div>";
    }).join("");
    $$("[data-setface]").forEach(function(b){ b.addEventListener("click", function(){ setFace(b.dataset.setface); window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); }); });
  }

  var TOKENS = [
    ["Ground", "--ground", "#FFFFFF", "#111111", "The page"],
    ["Panel", "--panel", "#F7F3F6", "#1C1B1C", "A tone step off the ground"],
    ["Row", "--row", "#FFFFFF", "#262426", "Choices, rows, inner cards"],
    ["Border", "--border", "#E8E0E6", "#353135", "A row's edge"],
    ["Ink", "--text", "#3B2E3A", "#F5F2F4", "Text and Timmy's outline"],
    ["Muted", "--muted", "#685C66", "#B8B0B6", "Secondary text, 4.5:1 or more"],
    ["Primary", "--primary", "#3B2E3A", "#F5F2F4", "The one filled button"],
    ["Gold", "--gold", "#E2A72E", "#F2C14E", "The accent: XP, the goal ring"],
    ["Gold text", "--gold-ink", "#8A5D00", "#F2C14E", "Gold as words"],
    ["Right", "--right", "#247B50", "#4CC38A", "Right answers"],
    ["Wrong", "--wrong", "#C4242A", "#F0727A", "Misses"],
    ["Flame", "--flame", "#F59A1E", "#F7A83C", "The streak"]
  ];
  function tokens(){
    var dark = root.dataset.theme === "dark";
    var sw = TOKENS.map(function(t){ return '<div class="sw"><i style="background:var(' + t[1] + ')"></i><div><b>' + t[0] + "</b><span>" + t[4] + '</span><span class="num">' + (dark ? t[3] + " (dark)" : t[2] + " · dark " + t[3]) + "</span></div></div>"; }).join("");
    var tints = (A.hubs || []).map(function(k){ var t = A.tints[k]; return '<div class="tint"><span class="steps"><i style="background:' + t.ink + '"></i><i style="background:' + t.mid + '"></i><i style="background:' + t.light + '"></i></span><div><b>' + esc(t.name) + '</b><span class="num">' + t.ink + " · " + t.mid + " · " + t.light + "</span></div></div>"; }).join("");
    var scale = [["Title", "28 / " + (root.dataset.face === "fraunces" ? 700 : 800), "font-size:28px;font-weight:var(--w-title);line-height:1.15", "Occlusion final"],
      ["Section", "20 / heading", "font-size:20px;font-weight:var(--w-head)", "Every question format"],
      ["Question stem", "18 / strong", "font-size:18px;font-weight:var(--w-strong)", "Which cusp of #30 is shaded?"],
      ["Body", "16 / 400", "font-size:16px", "Contacts sit buccal to the central fossa line."],
      ["Label", "14 / strong", "font-size:14px;font-weight:var(--w-strong)", "Practice questions"],
      ["Meta", "13 / 400", "font-size:13px;color:var(--muted)", "L1 · Review of Basic Occlusion"],
      ["Figure", "32 / title", "font-size:32px;font-weight:var(--w-title);line-height:1", "11 days"]];
    var motion = [["Press", "140 ms · ease-out", "var(--t-press)", "var(--ease-out)"], ["Hover", "180 ms · ease-out", "var(--t-hover)", "var(--ease-out)"],
      ["Interface", "240 ms · ease-out", "var(--t-ui)", "var(--ease-out)"], ["Reveal", "800 ms · expo", "var(--t-reveal)", "var(--ease-expo)"]];
    $("#tokenGrid").innerHTML =
      '<div class="panel s12"><h3>Color</h3><p>Light and dark are designed, not inverted: dark mode is a true neutral with the same roles.</p><div class="panel-body swatches">' + sw + "</div></div>" +
      '<div class="panel s12"><h3>Hub tints</h3><p>The tint marks a hub’s strip, active tab, picked choice and emblem; the rest of the hub is the shared ground and ink.</p><div class="panel-body tints">' + tints + "</div></div>" +
      '<div class="panel s6 typescale"><h3>Type scale</h3><p>Seven sizes, each with one job, set in the typeface picked at the top.</p><dl class="panel-body scale">' + scale.map(function(s){ return "<div><dt>" + s[0] + " · " + s[1] + '</dt><dd style="' + s[2] + '">' + s[3] + "</dd></div>"; }).join("") + "</dl></div>" +
      '<div class="s6" style="display:grid;gap:16px;align-content:start">' +
        '<div class="panel"><h3>Radius and space</h3><p>16 for panels, 14 for rows inside them, round for buttons and chips. Space on a 4 px step; one 16 px gutter.</p><div class="panel-body radii">' +
          '<figure><i style="border-radius:16px"></i>Panel 16</figure><figure><i style="border-radius:14px"></i>Row 14</figure><figure><i style="border-radius:999px"></i>Pill</figure></div></div>' +
        '<div class="panel" id="motionPanel"><h3>Motion</h3><p>Transform and opacity only; reduced motion keeps the result and drops the travel.</p><dl class="panel-body motion">' +
          motion.map(function(m){ return "<div><dt>" + m[0] + " · " + m[1] + '</dt><dd class="lane"><span class="dot" style="transition:transform ' + m[2] + " " + m[3] + '"></span></dd></div>'; }).join("") +
          '</dl><div class="qc-go"><button class="btn" type="button" id="runMotion">' + icon("play", 18) + "Run</button></div></div>" +
      "</div>";
    $("#runMotion").addEventListener("click", function(){
      var p = $("#motionPanel .motion"), lane = $(".lane", p).getBoundingClientRect().width;
      p.style.setProperty("--lane", lane + "px"); p.classList.toggle("run");
    });
  }

  function icons(){
    var keys = Object.keys(A.icons || {});
    $("#iconPanel").innerHTML = '<div class="icons">' + keys.map(function(k){ return "<figure>" + icon(k, 24) + "<figcaption>" + esc(A.icons[k].label) + "</figcaption></figure>"; }).join("") + "</div>" +
      '<div class="icon-sizes">' + [16, 20, 24, 32].map(function(px){ return "<figure>" + icon("notes", px) + "<span>" + px + " px</span></figure>"; }).join("") +
      [16, 20, 24, 32].map(function(px){ return "<figure>" + icon("questions", px) + "<span>" + px + " px</span></figure>"; }).join("") + "</div>";
  }

  function hubart(){
    $("#emblemPanel").innerHTML = '<div class="emblems">' + (A.hubs || []).map(function(k){
      var t = A.tints[k];
      return '<figure data-hub="' + k + '">' + emblemDisc(k, "big") + "<b>" + esc(t.name) + '</b><span class="small">' + emblemDisc(k, "") + "On its tab</span></figure>";
    }).join("") + "</div>";
    $("#masts").innerHTML = (A.hubs || []).map(function(k){
      var M = A.mastheads[k];
      return '<figure><div class="m">' + img(M.body, M.label, "", "0 0 600 200") + "</div><figcaption><b>" + esc(A.tints[k].name) + ".</b> <span>" + esc(M.label) + "</span></figcaption></figure>";
    }).join("");
  }

  function medals(){
    var hubs = A.hubs || [], levels = A.medalLevels || ["Bronze", "Silver", "Gold", "Crown"];
    var short = { "pcd-implants-exam1": "PCD Implants", "heme-endo-exam2": "Heme & Endo 2", "special-patient-care": "Special Patient Care", "generic": "A new hub" };
    var table = '<table class="medals"><caption class="sr">Mastery medals by hub and level</caption><thead><tr><th scope="col">Level</th>' + hubs.map(function(k){ return '<th scope="col">' + esc(short[k] || A.tints[k].name) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      levels.map(function(l, i){ return '<tr><th scope="row" style="text-align:left;font-size:var(--fs-label);font-weight:var(--w-strong);color:var(--text);padding:8px 0;border-top:1px solid var(--rule)">' + esc(l) + "</th>" +
        hubs.map(function(k){ return "<td>" + img(A.medals[k][i], A.tints[k].name + ", " + l + " mastery", "", "0 0 64 64") + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
    var keys = Object.keys(A.trophies || {});
    var trophy = keys.map(function(k){ var t = A.trophies[k];
      return '<div class="trophy">' + img(t.body, "", "", "0 0 64 64") + "<div><b>" + esc(t.name) + "</b><span>" + esc(t.desc) + (t.secret ? " · secret" : "") + "</span></div></div>"; }).join("");
    var locked = keys.filter(function(k){ return A.trophies[k].secret; }).slice(0, 4).map(function(k){ var t = A.trophies[k];
      return '<div class="trophy locked">' + img(t.sil.replace(/currentColor/g, "#B9ADB6"), "", "", "0 0 64 64") + "<div><b>Secret trophy</b><span>" + esc(t.clue) + "</span></div></div>"; }).join("");
    var ranks = A.handpieces.map(function(r){ return "<figure>" + img(r.svg, r.name + " handpiece") + "<b>" + esc(r.name) + '</b><span class="num">' + fmt(r.at) + " XP</span></figure>"; }).join("");
    $("#medalGrid").innerHTML =
      '<div class="panel s12"><h3>Mastery medals</h3><p>Bronze at 50% right on your latest try, Silver at 75%, Gold at 90%, the Crown at every question.</p><div class="panel-body">' + table + "</div></div>" +
      '<div class="panel s12"><h3>Trophies</h3><p>Every trophy, as it looks once you’ve won it.</p><div class="panel-body trophies">' + trophy + "</div></div>" +
      '<div class="panel s12"><h3>Before a secret trophy is won</h3><p>A shape and its riddle, in place of a grid of question marks.</p><div class="panel-body trophies">' + locked + "</div></div>" +
      '<div class="panel s12"><h3>Ranks: the handpieces</h3><p>Stone to Dark Matter, levels I to III, as drawn today; the rank name becomes plain type in place of the gradient.</p><div class="panel-body ranks">' + ranks + "</div></div>";
  }

  function timmys(){
    var moodName = { happy: "Happy", ok: "Okay", sad: "Sad", sick: "Sick", sleep: "Asleep", scared: "Startled" };
    var condName = { sparkle: "Sparkling", plaque: "Plaque", stain: "Stains", gingivitis: "Gingivitis", caries: "Caries", perio: "Periodontitis", fracture: "Fracture", zero: "Needs treatment" };
    var hp = A.timmy.hp.map(function(t){ var c = t.conditions.filter(function(x){ return x !== "zero" || t.hp === 0; }); var last = c.length ? condName[c[c.length - 1]] : "Healthy";
      return '<figure><span class="t">' + img(t.svg, "Timmy at " + t.hp + " HP") + '</span><b class="num">' + t.hp + " HP</b><span>" + esc(last) + "</span></figure>"; }).join("");
    var moods = A.timmy.moods.map(function(t){ return '<figure><span class="t">' + img(t.svg, "Timmy, " + moodName[t.k]) + "</span><b>" + moodName[t.k] + "</b><span>Mood</span></figure>"; }).join("");
    var outfits = A.timmy.outfits.map(function(t){ return '<figure><span class="t">' + img(t.svg, "Timmy in an outfit") + "</span><b>" + (t.k === "winter" ? "Christmas" : t.k.charAt(0).toUpperCase() + t.k.slice(1)) + "</b><span>Outfit</span></figure>"; }).join("");
    var houses = A.houses.map(function(x){ return '<figure><div class="scene">' + img(x.svg, "Timmy's house at " + x.k) + '<span class="spot">' + img(x.timmy, "") + "</span></div><figcaption><b>" + esc(x.k) + "</b><span>" + esc(x.note) + "</span></figcaption></figure>"; }).join("");
    $("#timmyGrid").innerHTML =
      '<div class="panel s12"><h3>As his HP drops</h3><p>What shows at each level, worst last.</p><div class="panel-body timmys">' + hp + "</div></div>" +
      '<div class="panel s12"><h3>Moods and holiday outfits</h3><p>The moods his reactions use, and three of the outfits he wears around a holiday.</p><div class="panel-body timmys" style="grid-template-columns:repeat(auto-fill,minmax(104px,1fr))">' + moods + outfits + "</div></div>" +
      '<div class="panel s12"><h3>His house</h3><p>It grows with your rank: a fence, a mailbox, gold trim, a night sky, and a pennant for every hub you master.</p><div class="panel-body houses">' + houses + "</div></div>";
  }

  /* ---------- Timmy's place (redesign phase 4, part C): place.js, built from tools/figures/site/place.mjs ----------
     The builder draws the live kit (SH_PLACE.render) inline, so its motion runs; the galleries are still pictures,
     drawn when they scroll near. Timmy is the live drawing (art.js), laid over the scene at a spot. */
  var TP = window.SH_PLACE;
  var TIER_NAMES = ["Stone", "Antique", "Bronze", "Silver", "Gold", "Diamond", "Dark Matter"];
  var TIER_DECO = ["Nothing yet", "A picket fence", "A mailbox", "A lamppost", "Gold trim and a gold door", "Diamond windows", "Dark Matter stars over his place"];
  var HOLS = [["", "No holiday"], ["halloween", "Halloween"], ["thanksgiving", "Thanksgiving"], ["winter", "Christmas"], ["newyear", "New Year's"], ["valentine", "Valentine's Day"], ["dentist", "Dentist's Day"], ["stpatrick", "St. Patrick's Day"], ["easter", "Easter"]];
  var SEASONS = [["", "Summer"], ["spring", "Spring"], ["fall", "Fall"]];
  var FLAIRS = [[], [{ hub: "perio", lvl: 2 }], [{ hub: "occlusion", lvl: 3 }, { hub: "perio", lvl: 2 }, { hub: "heme-endo-exam2", lvl: 1 }], [{ hub: "occlusion", lvl: 4 }, { hub: "perio", lvl: 3 }, { hub: "heme-endo-exam2", lvl: 2 }, { hub: "pcd-implants-exam1", lvl: 1 }]];
  var FLAIR_NAMES = ["No pennants", "One pennant (Silver)", "Three pennants", "Four, one crowned"];
  var RARITY = { Common: "#8E98A3", Uncommon: "#3E8E45", Rare: "#2378B0", Epic: "#7A3CFF", Legendary: "#C9971C" };
  var PS = { home: "cottage", scene: "hill", time: "clock", yard: { left: "garden", front: "pool", side: "lane", right: "doghouse" }, up: {}, paint: "cream",
    tier: 3, flair: 1, holiday: "", season: "", timmy: "happy", pick: "home", still: false };
  function byK(list, k){ for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i]; return null; }
  function clockNight(){ var hr = new Date().getHours(); return hr < 7 || hr >= 19; }
  function tpOpts(o){
    return Object.assign({ home: PS.home, scene: PS.scene, night: PS.time === "night" || (PS.time === "clock" && clockNight()), yard: PS.yard, up: PS.up, paint: PS.paint,
      tier: PS.tier, flair: FLAIRS[PS.flair], holiday: PS.holiday, season: PS.season }, o || {});
  }
  function timmyArt(k){
    var t = A.timmy, m = (t.moods || []).filter(function(x){ return x.k === k; })[0];
    if (m) return m.svg;
    var hp = (t.hp || []).filter(function(x){ return "hp" + x.hp === k; })[0];
    return (hp || t.moods[0]).svg;
  }
  /* a still picture of a place, with Timmy at a spot (vb: the crop, from the kit's own viewBox) */
  function placeFig(o, cap, sub, timmySpot, cls){
    var vb = o.viewBox || TP.VIEWBOX, r = TP.render(o), t = "";
    var sp = timmySpot && r.spots[timmySpot];
    if (sp) t = '<span class="tp-timmy" style="left:' + ((sp[0] - vb[0]) / vb[2] * 100).toFixed(2) + "%;top:" + ((sp[1] - vb[1]) / vb[3] * 100).toFixed(2) + "%;width:" + (36 / vb[2] * 100).toFixed(2) + '%">' + img(A.timmy.moods[0].svg, "") + "</span>";
    var pic = img(r.svg, cap).replace("<img ", '<img width="' + vb[2] + '" height="' + vb[3] + '" ');
    return '<figure class="tp-fig ' + (cls || "") + '"><div class="tp-pic' + (o.night ? " is-night" : "") + '">' + pic + t + "</div>" + (cap ? "<figcaption><b>" + esc(cap) + "</b>" + (sub ? "<span>" + esc(sub) + "</span>" : "") + "</figcaption>" : "") + "</figure>";
  }
  /* the builder's scene goes on the page as a picture too (it's an illustration, not a chart), with the kit's motion
     inside it; still (reduced motion, or the preview's "still" box) leaves the motion out */
  function sceneImg(svgStr, alt, still){
    if (!still) svgStr = svgStr.replace(/(<svg[^>]*>)/, function(m){ return m + "<style>" + TP.CSS.replace(/\.tp-still[^\n]*/, "") + "</style>"; });
    return img(svgStr, alt, "tp-sceneimg");
  }
  function sceneAlt(){
    var h = byK(TP.HOMES, PS.home), sc = byK(TP.SCENES, PS.scene), items = TP.SLOTS.map(function(s){ return PS.yard[s.k]; }).filter(Boolean).map(function(k){ return byK(TP.YARD, k).n.replace(/^A /, "a "); });
    return "Timmy's place: " + h.n.replace(/^The /, "the ") + " on " + sc.n.replace(/^The /, "the ") + (items.length ? ", with " + (items.length > 1 ? items.slice(0, -1).join(", ") + " and " + items[items.length - 1] : items[0]) : "");
  }
  function crop(pts, pad){
    var xs = [], ys = [];
    pts.forEach(function(p){ var q = TP.project(p[0], p[1], p[2]); xs.push(q[0]); ys.push(q[1]); });
    var x0 = Math.min.apply(null, xs) - pad, y0 = Math.min.apply(null, ys) - pad, x1 = Math.max.apply(null, xs) + pad, y1 = Math.max.apply(null, ys) + pad;
    return [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)];
  }
  function cube(x0, y0, x1, y1, z){ return [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]; }
  var HOME_CROP = function(){ return crop(cube(1.6, 1.8, 9.6, 10.4, 9.6), 6); };
  function slotCrop(k, wide){ var s = TP.SLOT_AT[k]; return crop(cube(s.x - .4, s.y - .4, s.x + TP.S + .4, s.y + (wide ? 7.5 : TP.S) + .4, 3), 8); }

  function place(){
    if (!TP) { $("#placeGrid").innerHTML = '<p class="note">place.js is missing: run node tools/figures/site/build.mjs</p>'; return; }
    if (!$("#tpCss")) document.head.insertAdjacentHTML("beforeend", '<style id="tpCss">' + TP.CSS + "</style>");
    $("#placeGrid").innerHTML =
      '<div class="panel s12"><h3>Build it</h3><p>Tap a spot in the yard, or the house, to change it; tap the scene button for the world around it. Timmy walks between the spots; drag across it (or tilt your phone) and it leans a little. Reduced motion: all still.</p>' +
        '<div class="panel-body tp-build"><div class="tp-stage-wrap"><div class="tp-stage" id="tpStage"></div></div><div class="tp-side" id="tpSide"></div></div></div>' +
      '<div class="panel s6"><h3>On the “you” card</h3><p>The small size, on the dashboard and in a hub’s More. It shows what the builder shows, cropped to the plot.</p><div class="panel-body"><div class="tp-card" id="tpCard"></div></div></div>' +
      '<div class="panel s6"><h3>How it’s built</h3><p>Slots, not free placement, so every combination looks right and nothing overlaps.</p><div class="panel-body tp-how">' +
        "<ul>" +
        "<li><b>The home</b> stands on the back of the plot, its door always where the path starts. The cottage is free and stays every Timmy's first home; the castle, the giant mushroom and the treehouse come from the shop.</li>" +
        "<li><b>Five yard spots</b> along the front: by the path on each side, the front corner, the side yard and the back corner. The bowling lane is long, so it takes the side yard and the front corner together.</li>" +
        "<li><b>Fixed spots</b> for what you earn and the seasons: the fence on the back edges, the mailbox and lamppost at the end of the path, the tree out front, the flagpole for your pennants, the toothbrush by the door, the snowman, the holiday props by the door.</li>" +
        "<li><b>The scene</b> sets the sky, the ground and what holds the plot up: the hill (free), the beach, the forest, the snowy mountain or the night sky.</li>" +
        "<li><b>Day and night</b> follow your clock (7 pm to 7 am is night); every home has its own night lights. Light and dark mode change the page around it, not the scene.</li>" +
        "<li><b>Light to load</b>: one drawing kit draws every combination (about 90 KB before compression), and it loads only when his place is on screen.</li>" +
        "</ul></div></div>" +
      galleryPanel("tpHomes", "The homes", "The cottage redrawn, then the three shop homes. Each has its own spots for Timmy and its own night lights.") +
      galleryPanel("tpNights", "At night", "Each home’s own lights: windows, a porch lamp, torches at the castle gate, fireflies round the mushroom, lanterns on the treehouse deck.") +
      galleryPanel("tpScenes", "The scenes", "What the plot stands on: the hill (free, with number thirty-one’s place on the next hill and the rabbit down the hill), the beach, the forest, the snowy mountain and the night sky with the Dark Matter stars.") +
      galleryPanel("tpYard", "The yard", "Six things for the yard spots, each drawn to fit a spot. The mailbox stays your Bronze rank’s, at the end of the path, so a mint fountain takes its place in the list.") +
      galleryPanel("tpUps", "Upgrades of the home itself", "Each home with every upgrade it takes: windows, a porch, a chimney, a flag. Plain versions are under The homes.") +
      galleryPanel("tpPaint", "Paint", "Six colors for the cottage’s walls; the same six set the mushroom’s cap, the castle’s roofs and banners and the treehouse cabin.") +
      galleryPanel("tpRanks", "What you’ve earned still shows: your rank", "The handpiece journey’s decorations, one per rank, on any home and scene (the ModuPro on the porch and Timmy in loupes come with the journeys’ art).") +
      galleryPanel("tpSeasons", "The seasons and holidays", "The yard follows the seasons and the holidays on any home and scene: the tree turns in the fall and blossoms in spring, snow and a snowman at Christmas, a prop by the door for each holiday.");
    buildPlace();
    lazyGalleries();
  }
  function galleryPanel(id, h, p){ return '<div class="panel s12"><h3>' + h + "</h3><p>" + p + '</p><div class="panel-body tp-gal" id="' + id + '" data-lazy="1"></div></div>'; }
  var GALLERIES = {
    tpHomes: function(){ return TP.HOMES.map(function(h){ return placeFig({ home: h.k, scene: "hill", tier: 1, yard: {} }, h.n, (h.rarity ? h.rarity + " · " : "") + h.note.replace(/^(Free|Legendary): /, ""), "door"); }).join(""); },
    tpNights: function(){ return TP.HOMES.map(function(h){ return placeFig({ home: h.k, scene: "hill", tier: 3, night: true, up: { porch: true }, yard: { front: "pool" } }, h.n + " at night", "", "door"); }).join(""); },
    tpScenes: function(){ return TP.SCENES.map(function(s){ return placeFig({ home: "cottage", scene: s.k, tier: 1, yard: { left: "garden", corner: "hammock" } }, s.n, s.note, "door"); }).join(""); },
    tpYard: function(){
      var where = { garden: "left", pool: "front", hammock: "left", fountain: "front", doghouse: "right", lane: "side" };
      return TP.YARD.map(function(y){ var k = where[y.k], yd = {}; yd[k] = y.k;
        return placeFig({ home: "cottage", scene: "hill", tier: 0, bare: true, yard: yd, viewBox: slotCrop(k, y.wide) }, y.n, y.rarity + " · " + y.note, "", "tp-yardfig"); }).join("");
    },
    tpUps: function(){ return TP.HOMES.map(function(h){ var up = {}; h.ups.forEach(function(k){ if (k !== "paint") up[k] = true; });
      return placeFig({ home: h.k, scene: "hill", tier: 0, up: up, yard: {}, viewBox: HOME_CROP() }, h.n, h.ups.filter(function(k){ return k !== "paint"; }).map(function(k){ return h.upn[k]; }).join(", ")); }).join(""); },
    tpPaint: function(){ return TP.PAINTS.map(function(p){ return placeFig({ home: "cottage", scene: "hill", tier: 0, paint: p.k, yard: {}, viewBox: HOME_CROP() }, p.n, ""); }).join("") +
      TP.PAINTS.map(function(p){ return placeFig({ home: "mushroom", scene: "hill", tier: 0, paint: p.k, yard: {}, viewBox: HOME_CROP() }, p.boldName + " cap", ""); }).join(""); },
    tpRanks: function(){ return TIER_NAMES.map(function(n, i){ return placeFig({ home: "cottage", scene: "hill", tier: i, yard: { front: "pool" } }, n, TIER_DECO[i], "", "tp-small"); }).join("") +
      placeFig({ home: "cottage", scene: "hill", tier: 2, flair: FLAIRS[3], yard: {} }, "Mastery pennants", "One per hub mastered, in its medal’s color; a Crown puts a crown on the roof", "", "tp-small"); },
    tpSeasons: function(){
      var list = [["", "fall", "Fall"], ["", "spring", "Spring"], ["winter", "", "Christmas"], ["halloween", "fall", "Halloween"], ["thanksgiving", "fall", "Thanksgiving"], ["newyear", "", "New Year's"], ["valentine", "", "Valentine's Day"], ["stpatrick", "spring", "St. Patrick's Day"], ["easter", "spring", "Easter"], ["dentist", "", "Dentist's Day"]];
      return list.map(function(x, i){ return placeFig({ home: TP.HOMES[i % 4].k, scene: "hill", tier: 2, holiday: x[0], season: x[1], yard: { front: "garden" } }, x[2], "", "", "tp-small"); }).join("");
    }
  };
  function lazyGalleries(){
    /* drawn up front (a few milliseconds each); the pictures themselves load as they scroll near */
    $$(".tp-gal[data-lazy]").forEach(function(el){ delete el.dataset.lazy; el.innerHTML = GALLERIES[el.id]().replace(/<img /g, '<img loading="lazy" '); });
  }

  /* the builder: the scene inline, tap targets over the slots and the home, Timmy walking, the side panel */
  var walkTimer = null, walkAt = 0;
  function buildPlace(){
    var o = tpOpts({ marks: true }), r = TP.render(o), vb = TP.VIEWBOX, stage = $("#tpStage");
    var hits = Object.keys(r.slots).map(function(k){ var it = PS.yard[k], name = byK(TP.SLOTS, k).n;
      return '<path class="tp-hitarea' + (PS.pick === k ? " on" : "") + '" data-pick="' + k + '" d="' + r.slots[k] + '" tabindex="0" role="button" aria-label="' + esc(name + ": " + (it ? byK(TP.YARD, it).n : "empty") + ". Change it") + '"/>'; }).join("") +
      '<path class="tp-hitarea tp-hithome' + (PS.pick === "home" ? " on" : "") + '" data-pick="home" d="' + r.homeHit + '" tabindex="0" role="button" aria-label="' + esc(byK(TP.HOMES, PS.home).n + ". Change it") + '"/>';
    stage.classList.toggle("is-night", !!o.night);
    stage.classList.toggle("tp-still", PS.still || reduced);
    stage.innerHTML = '<div class="tp-tilt">' + sceneImg(r.svg, sceneAlt(), PS.still || reduced) + '<svg class="tp-hit" viewBox="' + vb.join(" ") + '" aria-label="Spots you can change">' + hits + "</svg>" +
      '<span class="tp-timmy tp-walker" id="tpTimmy" style="width:' + (36 / vb[2] * 100).toFixed(2) + '%">' + img(timmyArt(PS.timmy), "Timmy") + "</span></div>";
    stage.dataset.spots = JSON.stringify(r.spots);
    $$(".tp-hitarea", stage).forEach(function(p){
      p.addEventListener("click", function(){ PS.pick = p.dataset.pick; buildPlace(); });
      p.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); PS.pick = p.dataset.pick; buildPlace(); var n = $('.tp-hitarea[data-pick="' + PS.pick + '"]'); if (n) n.focus(); } });
    });
    walkTo(walkAt, true);
    if (!walkTimer && !(PS.still || reduced)) walkTimer = setInterval(function(){ walkTo(walkAt + 1); }, 3600);
    if ((PS.still || reduced) && walkTimer) { clearInterval(walkTimer); walkTimer = null; }
    side();
    placeCard(r);
    tilt(stage);
  }
  function spotOrder(spots){
    /* the door first, then the home's own spots and the lawn, then each yard spot that has something in it */
    var keys = ["door"].concat(Object.keys(spots).filter(function(k){ return k !== "door" && k !== "lawn" && !TP.SLOTS.some(function(s){ return s.k === k; }); }), ["lawn"]);
    TP.SLOTS.forEach(function(s){ if (spots[s.k]) keys.push(s.k); });
    return keys;
  }
  function walkTo(i, jump){
    var stage = $("#tpStage"), t = $("#tpTimmy"); if (!stage || !t) return;
    var spots = JSON.parse(stage.dataset.spots || "{}"), keys = (PS.still || reduced) ? ["door"] : spotOrder(spots), vb = TP.VIEWBOX;
    walkAt = ((i % keys.length) + keys.length) % keys.length;
    var sp = spots[keys[walkAt]] || spots.door;
    if (jump) t.classList.add("no-anim");
    t.style.left = ((sp[0] - vb[0]) / vb[2] * 100).toFixed(2) + "%"; t.style.top = ((sp[1] - vb[1]) / vb[3] * 100).toFixed(2) + "%";
    if (jump) { void t.offsetWidth; t.classList.remove("no-anim"); return; }
    t.classList.remove("walking"); void t.offsetWidth; t.classList.add("walking");
  }
  function tilt(stage){
    var el = $(".tp-tilt", stage);
    if (PS.still || reduced) { el.style.transform = ""; return; }
    if (stage._tilt) return; stage._tilt = 1;
    stage.addEventListener("pointermove", function(e){
      if (PS.still || reduced) return;
      var b = stage.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      $(".tp-tilt", stage).style.transform = "perspective(900px) rotateX(" + (-y * 5).toFixed(2) + "deg) rotateY(" + (x * 7).toFixed(2) + "deg)";
    });
    stage.addEventListener("pointerleave", function(){ var t = $(".tp-tilt", stage); if (t) t.style.transform = ""; });
    var base = null;
    window.addEventListener("deviceorientation", function(e){
      if (PS.still || reduced || e.gamma == null) return;
      if (!base) base = [e.beta, e.gamma];
      var rx = Math.max(-5, Math.min(5, (e.beta - base[0]) * .25)), ry = Math.max(-7, Math.min(7, (e.gamma - base[1]) * .3)), t = $(".tp-tilt", stage);
      if (t) t.style.transform = "perspective(900px) rotateX(" + (-rx).toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
    });
    stage.addEventListener("click", function(){ if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission && !stage._asked){ stage._asked = 1; DeviceOrientationEvent.requestPermission().catch(function(){}); } }, { once: true });
  }
  function chip(label, on, data, extra){ return '<button type="button" class="tp-chip' + (on ? " on" : "") + '" aria-pressed="' + (on ? "true" : "false") + '" ' + data + ">" + (extra || "") + esc(label) + "</button>"; }
  function rarityTag(r){ return r ? '<i class="tp-rar" style="--rar:' + RARITY[r] + '">' + esc(r) + "</i>" : '<i class="tp-rar free">Free</i>'; }
  function side(){
    var el = $("#tpSide"), pick = PS.pick, h = byK(TP.HOMES, PS.home), body = "";
    var tabs = [["home", "Home"], ["scene", "Scene"]].concat(TP.SLOTS.filter(function(s){ return !(s.k === "corner" && PS.yard.side === "lane"); }).map(function(s){ return [s.k, s.n]; }));
    var head = '<div class="tp-tabs" role="group" aria-label="What to change">' + tabs.map(function(t){ return chip(t[1], pick === t[0], 'data-pick="' + t[0] + '"'); }).join("") + "</div>";
    if (pick === "home") {
      body = "<h4>" + esc(h.n) + "</h4>" + '<div class="tp-opts">' + TP.HOMES.map(function(x){ return chip(x.n, x.k === PS.home, 'data-home="' + x.k + '"', rarityTag(x.rarity)); }).join("") + "</div>" +
        "<h4>Upgrades</h4>" + '<div class="tp-opts">' + h.ups.filter(function(k){ return k !== "paint"; }).map(function(k){ return chip(h.upn[k], !!PS.up[k], 'data-up="' + k + '"'); }).join("") + "</div>" +
        "<h4>" + esc(h.upn.paint) + '</h4><div class="tp-opts tp-paints">' + TP.PAINTS.map(function(p){ var c = PS.home === "mushroom" || PS.home === "castle" ? p.bold : p.c;
          return '<button type="button" class="tp-swatch' + (PS.paint === p.k ? " on" : "") + '" data-paint="' + p.k + '" aria-pressed="' + (PS.paint === p.k) + '" aria-label="' + esc(PS.home === "mushroom" || PS.home === "castle" ? p.boldName : p.n) + '" style="--sw:' + c + '"></button>'; }).join("") + "</div>";
    } else if (pick === "scene") {
      body = "<h4>The scene</h4>" + '<div class="tp-opts">' + TP.SCENES.map(function(s){ return chip(s.n, s.k === PS.scene, 'data-scene="' + s.k + '"', rarityTag(s.rarity)); }).join("") + "</div>";
    } else {
      var sl = byK(TP.SLOTS, pick), cur = PS.yard[pick];
      body = "<h4>" + esc(sl.n) + "</h4>" + '<div class="tp-opts">' + chip("Nothing here", !cur, 'data-item=""') +
        TP.YARD.filter(function(y){ return !y.wide || pick === "side" || pick === "corner"; }).map(function(y){ return chip(y.n, cur === y.k, 'data-item="' + y.k + '"', rarityTag(y.rarity)); }).join("") + "</div>" +
        (pick === "side" || pick === "corner" ? '<p class="tp-note">The bowling lane is long: it takes the side yard and the front corner together.</p>' : "");
    }
    body += '<div class="tp-shop"><button type="button" class="btn" disabled>Get more in the shop</button><span class="tp-note">The shop is part B: here everything is yours to try.</span></div>';
    var prev = '<details class="tp-prev"' + (side.open ? " open" : "") + "><summary>Preview only: time, rank, season, Timmy</summary>" +
      '<div class="tp-ctl"><span>Time</span><div class="seg" role="group" aria-label="Time of day">' + [["clock", "Your clock"], ["day", "Day"], ["night", "Night"]].map(function(t){ return '<button type="button" data-time="' + t[0] + '" aria-pressed="' + (PS.time === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div></div>" +
      selRow("Rank", "tier", TIER_NAMES.map(function(n, i){ return [i, n + ": " + TIER_DECO[i]]; }), PS.tier) +
      selRow("Pennants", "flair", FLAIR_NAMES.map(function(n, i){ return [i, n]; }), PS.flair) +
      selRow("Season", "season", SEASONS, PS.season) + selRow("Holiday", "holiday", HOLS, PS.holiday) +
      selRow("Timmy", "timmy", [["happy", "Happy"], ["ok", "Okay"], ["sad", "Sad"], ["sick", "Sick"], ["sleep", "Asleep"], ["scared", "Startled"]].concat((A.timmy.hp || []).map(function(x){ return ["hp" + x.hp, x.hp + " HP"]; })), PS.timmy) +
      '<label class="tp-ctl tp-check"><input type="checkbox" data-still="1"' + (PS.still ? " checked" : "") + "> Show it as reduced motion does (still)</label></div></details>";
    el.innerHTML = head + '<div class="tp-pick">' + body + "</div>" + prev;
    $("details", el).addEventListener("toggle", function(e){ side.open = e.target.open; });
    $$("[data-pick]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.pick = b.dataset.pick; buildPlace(); }); });
    $$("[data-home]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.home = b.dataset.home; buildPlace(); }); });
    $$("[data-up]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.up[b.dataset.up] = !PS.up[b.dataset.up]; buildPlace(); }); });
    $$("[data-paint]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.paint = b.dataset.paint; buildPlace(); }); });
    $$("[data-scene]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.scene = b.dataset.scene; buildPlace(); }); });
    $$("[data-item]", el).forEach(function(b){ b.addEventListener("click", function(){
      var k = PS.pick, it = b.dataset.item;
      if (it === "lane") { delete PS.yard.corner; PS.yard.side = "lane"; PS.pick = "side"; }
      else if (it) PS.yard[k] = it; else delete PS.yard[k];
      buildPlace(); }); });
    $$("[data-time]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.time = b.dataset.time; buildPlace(); }); });
    $$("select[data-k]", el).forEach(function(s){ s.addEventListener("change", function(){ var k = s.dataset.k; PS[k] = k === "tier" || k === "flair" ? +s.value : s.value; buildPlace(); }); });
    $("[data-still]", el).addEventListener("change", function(e){ PS.still = e.target.checked; buildPlace(); });
  }
  function selRow(label, k, opts, cur){
    return '<label class="tp-ctl"><span>' + label + '</span><span class="select-wrap"><select class="select" data-k="' + k + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>" + icon("chevron", 18) + "</span></label>";
  }
  function placeCard(r){
    var o = tpOpts({ viewBox: TP.CARD }), rr = TP.render(o), vb = TP.CARD, h = byK(TP.HOMES, PS.home), s = byK(TP.SCENES, PS.scene), sp = rr.spots.door;
    $("#tpCard").innerHTML = '<div class="tp-pic tp-cardpic' + (o.night ? " is-night" : "") + '">' + sceneImg(rr.svg, sceneAlt(), PS.still || reduced) +
      '<span class="tp-timmy" style="left:' + ((sp[0] - vb[0]) / vb[2] * 100).toFixed(2) + "%;top:" + ((sp[1] - vb[1]) / vb[3] * 100).toFixed(2) + "%;width:" + (36 / vb[2] * 100).toFixed(2) + '%">' + img(timmyArt(PS.timmy), "Timmy") + "</span></div>" +
      '<div class="tp-cardfoot"><div><b>Timmy’s place</b><span>' + esc(h.n) + " · " + esc(s.n.replace(/^The /, "the ")) + '</span></div><a class="btn" href="#place">Change it</a></div>';
  }


  /* ---------- the bowling egg (phase 4, part D): eight clips on the alley's screen ---------- */
  var BW = window.SH_BOWL, BS = { k: null, all: false, still: false, n: 0, timer: 0, next: 0 };
  function bwClip(k){ return BW.CLIPS.filter(function(c){ return c.k === k; })[0]; }
  /* a clip as a picture, with its motion inside it; a new number each time, so it starts again from the top */
  function bwImg(k, still){
    var c = bwClip(k), svg = BW.render(k, { still: still }).replace(/^(<svg[^>]*)>/, function(m, a){ return a + ' data-n="' + (++BS.n) + '"><style>' + BW.css(k) + "</style>"; });
    return img(svg, c.alt + (still ? " (the last frame)" : ""), "bw-img");
  }
  function bwScreen(k, still){
    var c = bwClip(k);
    return bwImg(k, still) + '<span class="bw-word' + (still ? " is-still" : "") + '" data-w="' + esc(c.word) + '" style="animation-delay:' + c.wordAt + "s;left:" + c.wordPos[0] + "%;top:" + c.wordPos[1] + '%" aria-hidden="true">' + esc(c.word) + "</span>";
  }
  function bwPlay(k, still){
    clearTimeout(BS.timer); clearTimeout(BS.next);
    var c = bwClip(k), scr = $("#bwScreen");
    BS.k = k; still = !!(still || BS.still || reduced);
    scr.innerHTML = bwScreen(k, still);
    scr.classList.toggle("is-playing", !still);
    scr.setAttribute("aria-label", still ? c.n + ": the last frame. Tap to play it." : "Playing " + c.n + ". Tap to skip to the end.");
    $$("#bwChips .tp-chip").forEach(function(b){ var on = b.dataset.bw === k; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    $("#bwNow").innerHTML = "<b>" + esc(c.n) + " <span class=\"bw-len\">" + c.D + " s</span></b><span>" + esc(c.note) + "</span>";
    if (!still) BS.timer = setTimeout(function(){ scr.classList.remove("is-playing"); scr.setAttribute("aria-label", c.n + ": the last frame. Tap to play it again."); if (BS.all) bwNext(); }, c.D * 1000 + 700);
    else if (BS.all) BS.next = setTimeout(bwNext, 1500);
  }
  function bwNext(){
    var i = BW.CLIPS.map(function(c){ return c.k; }).indexOf(BS.k);
    if (i < BW.CLIPS.length - 1) BS.next = setTimeout(function(){ bwPlay(BW.CLIPS[i + 1].k); }, 500);
    else { BS.all = false; bwAllBtn(); }
  }
  function bwAllBtn(){ var b = $("#bwAll"); if (b) { b.textContent = BS.all ? "Stop" : "Play all eight"; b.setAttribute("aria-pressed", BS.all ? "true" : "false"); } }
  function bowling(){
    if (!BW) { $("#bowlGrid").innerHTML = '<p class="note">bowling.js is missing: run node tools/figures/site/build.mjs</p>'; return; }
    var chips = BW.CLIPS.map(function(c, i){ return '<button type="button" class="tp-chip" aria-pressed="false" data-bw="' + c.k + '"><i class="bw-num">' + (i + 1) + "</i>" + esc(c.n) + "</button>"; }).join("");
    var cast = BW.CREW.map(function(c, i){ return '<figure class="bw-castfig">' + img(BW.part(c.k), "A bowling pin drawn as " + c.n, "bw-pin") + "<figcaption>" + esc(c.n) + (i === 0 ? "<span>the head pin</span>" : "") + "</figcaption></figure>"; }).join("") +
      '<figure class="bw-castfig">' + img(BW.part("mint"), "A giant sugar-free mint, white with a pinwheel of mint green", "bw-pin bw-round") + "<figcaption>The ball<span>a sugar-free mint</span></figcaption></figure>";
    var guests = [["thirtyOne", "Number thirty-one", "the neighbor, with his thermometer", "Number thirty-one, a nervous molar with a thermometer in his mouth"],
      ["brush", "The toothbrush", "from Timmy's front door", "The toothbrush from Timmy's front door, bristles down to sweep"],
      ["turkey", "The turkey", "in Timmy's pilgrim hat", "A turkey wearing Timmy's pilgrim hat"],
      ["handpiece", "The handpiece", "the ball, in disguise", "A high-speed handpiece standing on its back end"]].map(function(g){
        return '<figure class="bw-castfig">' + img(BW.part(g[0]), g[3], "bw-pin") + "<figcaption>" + esc(g[1]) + "<span>" + esc(g[2]) + "</span></figcaption></figure>"; }).join("");
    $("#bowlGrid").innerHTML =
      '<div class="panel s12"><h3>On the alley’s screen</h3><p>Pick a clip, or play all eight. Tap the screen to skip to the end, the way a student skips one on the bar. With reduced motion (or “Still”), each is its last frame and its word.</p>' +
        '<div class="panel-body bw-play"><div class="bw-tv"><button type="button" class="bw-screen" id="bwScreen"></button></div>' +
        '<div class="bw-side"><div class="tp-opts" id="bwChips" role="group" aria-label="The clips">' + chips + '</div><p class="bw-now" id="bwNow" aria-live="polite"></p>' +
        '<div class="bw-btns"><button type="button" class="btn btn-primary" id="bwAgain">Play it again</button><button type="button" class="btn" id="bwAll" aria-pressed="false">Play all eight</button></div>' +
        '<label class="tp-ctl tp-check"><input type="checkbox" id="bwStill"' + (reduced ? " checked disabled" : "") + "> <span>Still (as with reduced motion)" + (reduced ? ": your device asks for it" : "") + "</span></label></div></div></div>" +
      '<div class="panel s12"><h3>The still versions</h3><p>What a student who asked for reduced motion sees instead: the last frame and the word, held until they tap it away.</p><div class="panel-body bw-gal">' +
        BW.CLIPS.map(function(c){ return '<figure class="bw-fig"><div class="bw-mini">' + bwScreen(c.k, true) + "</div><figcaption>" + esc(c.n) + "<span>" + esc(c.note) + "</span></figcaption></figure>"; }).join("") + "</div></div>" +
      '<div class="panel s12"><h3>The cast</h3><p>The pins are the Plaque crew from the boss egg, in their colors, never teeth. Each wears what sets it apart: Tartar’s cracks, Biofilm’s drips, the Mutans chain, Cavity Creep’s hole, the Goblin’s ears, the Haze, the Red Complex’s tails.</p>' +
        '<div class="panel-body"><div class="bw-cast">' + cast + guests + "</div></div></div>" +
      '<div class="panel s12"><h3>How it’s found</h3><p>From the task note; the triggers are built in phase 4, after these are approved.</p><div class="panel-body tp-how bw-how"><ul>' +
        "<li><b>In the bank</b>: every 50 first-try right answers in a row plays a strike clip (at 50 and 100); the third, 150 in a row, plays the turkey. Not in the mock.</li>" +
        "<li><b>On the bar, after the verdict</b>, never over a question waiting for an answer. A tap skips it; each lasts 3 to 5 seconds.</li>" +
        "<li><b>At Timmy’s place</b>: tap the bowling lane in the yard for a random clip.</li>" +
        "<li><b>The egg log</b> keeps the first sighting of each; seeing all eight is a secret trophy.</li>" +
        "<li><b>Off</b> with the eggs switch in Settings, like every egg. Tracked as <code>egg:bowling=&lt;clip&gt;</code>.</li>" +
        "<li><b>Light to load</b>: one kit draws all eight (about 56 KB before compression), fetched only when a clip is due.</li>" +
        "</ul></div></div>";
    $$("#bwChips .tp-chip").forEach(function(b){ b.addEventListener("click", function(){ BS.all = false; bwAllBtn(); bwPlay(b.dataset.bw); }); });
    $("#bwScreen").addEventListener("click", function(){ bwPlay(BS.k, $("#bwScreen").classList.contains("is-playing")); });
    $("#bwAgain").addEventListener("click", function(){ bwPlay(BS.k); });
    $("#bwAll").addEventListener("click", function(){ BS.all = !BS.all; bwAllBtn(); if (BS.all) bwPlay(BW.CLIPS[0].k); else { clearTimeout(BS.next); } });
    $("#bwStill").addEventListener("change", function(e){ BS.still = e.target.checked; bwPlay(BS.k); });
    /* the screen starts on the first clip's last frame; it plays when it scrolls into view the first time */
    bwPlay(BW.CLIPS[0].k, true);
    if (!reduced && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting) { io.disconnect(); if (!BS.still) bwPlay(BS.k); } }, { threshold: .6 });
      io.observe($("#bwScreen"));
    }
  }

  /* ---------- controls ---------- */
  function setFace(f){ root.dataset.face = f; $$(".seg [data-face]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.face === f ? "true" : "false"); }); save(); tokens(); }
  function setTheme(t){ root.dataset.theme = t; $$(".seg [data-theme]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.theme === t ? "true" : "false"); }); save(); tokens(); }
  function setHub(k){ root.dataset.hub = k; $("#hubPick").value = k; save(); buildHub(); }

  function init(){
    if (!A.icons) { document.body.insertAdjacentHTML("afterbegin", '<p class="note" style="padding:16px">art.js is missing: run node tools/figures/site/build.mjs</p>'); return; }
    $("#brandMark").innerHTML = timmy("happy");
    var pick = $("#hubPick");
    pick.innerHTML = A.hubs.map(function(k){ return '<option value="' + k + '">' + esc(A.tints[k].name) + "</option>"; }).join("");
    pick.value = root.dataset.hub;
    $("#hubChev").outerHTML = icon("chevron", 18);
    $$(".seg [data-face]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.face === root.dataset.face ? "true" : "false"); b.addEventListener("click", function(){ setFace(b.dataset.face); }); });
    $$(".seg [data-theme]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.theme === root.dataset.theme ? "true" : "false"); b.addEventListener("click", function(){ setTheme(b.dataset.theme); }); });
    pick.addEventListener("change", function(){ setHub(pick.value); });
    tiles(); buildHub(); pairs(); rewards(); faces(); tokens(); icons(); hubart(); medals(); timmys(); place(); bowling();
  }
  window.SH_DESIGN = { LIVE_BY_HUB: LIVE_BY_HUB, rebuild: buildHub, place: PS, rebuildPlace: function(){ buildPlace(); }, bowl: BS, playBowl: function(k, still){ bwPlay(k, still); } };
  init();
})();
