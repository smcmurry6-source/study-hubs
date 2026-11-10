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
  function flame(level, cls){ return art(A.flame[level], "0 0 40 48", "flame " + (cls || ""), ["", "A new streak", "A streak", "A blazing streak", "A blue-hot streak", "A Dark Matter streak"][level]); }
  /* the flame for a streak: it grows at 3 days, blazes at 7, burns blue at 10 and turns Dark Matter at 30 (Sam, 2026-11-10) */
  function flameLevel(days){ return days >= 30 ? 5 : days >= 10 ? 4 : days >= 7 ? 3 : days >= 3 ? 2 : 1; }
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
      /* folded until the student taps it, as widget/hub.js draws it (Sam, 2026-11-06 and 2026-11-10) */
      var whys = '<details class="why"><summary class="why-bar"><span>Why each choice</span><span class="chev">' + icon("chevron", 16) + "</span></summary>" + q.choices.map(function(c, i){
        var b = $('.ch[data-i="' + i + '"]', el), tag = b.classList.contains("is-wrong") ? "Your pick" : b.classList.contains("is-right") && picked.indexOf(i) > -1 ? "Your pick" : b.classList.contains("is-missed") ? "You missed this one" : "";
        var st = b.classList.contains("is-right") ? "right" : b.classList.contains("is-wrong") ? "wrong" : b.classList.contains("is-missed") ? "missed" : "";
        return "<details" + (open[i] ? " open" : "") + '><summary><span class="tick" style="color:' + (st === "wrong" ? "var(--wrong)" : st ? "var(--right)" : "var(--muted)") + '">' + (st ? mark(multi ? "box" : "ring", st) : mark(multi ? "box" : "ring")) + "</span><span>" + esc(c) +
          (tag ? ' <span class="tag">· ' + tag + "</span>" : "") + '</span><span class="chev">' + icon("chevron", 16) + "</span></summary><p>" + esc(q.why[i]) + "</p></details>";
      }).join("") + "</details>";
      var res = $(".qc-result", el);
      res.innerHTML = verdict + '<p class="qc-ex">' + esc(q.ex) + ' <a href="#formats">Find this in the notes</a></p>' + whys +
        '<div class="qc-after"><button class="btn" type="button" data-again>' + icon("retry", 18) + 'Try it again</button><span class="grow"></span>' +
        '<span class="thumbs"><span class="thumbs-q" aria-live="polite">Good question?</span><button class="btn btn-icon" type="button" data-thumb="up" aria-pressed="false" aria-label="Good question">' + icon("thumbup", 18) + '</button><button class="btn btn-icon" type="button" data-thumb="down" aria-pressed="false" aria-label="Not a good question">' + icon("thumbdown", 18) + "</button></span></div>";
      res.hidden = false;
      /* the thumbs: the one you tap pops and fills (up: with a few sparks; down: a small dip), and the line thanks you */
      $$("[data-thumb]", res).forEach(function(b){ b.addEventListener("click", function(){
        var on = b.getAttribute("aria-pressed") !== "true", up = b.dataset.thumb === "up";
        $$("[data-thumb]", res).forEach(function(o){ o.setAttribute("aria-pressed", "false"); o.classList.remove("pop"); $$(".thumb-spark", o).forEach(function(x){ o.removeChild(x); }); });
        $(".thumbs-q", res).textContent = !on ? "Good question?" : up ? "Thanks! Glad it helped." : "Thanks. We'll take a look.";
        if (!on) return;
        b.setAttribute("aria-pressed", "true"); void b.offsetWidth; b.classList.add("pop");
        if (up && !reduced) for (var i = 0; i < 5; i++) { var sp = document.createElement("i"); sp.className = "thumb-spark"; sp.style.setProperty("--a", (-150 + i * 30) + "deg"); sp.style.animationDelay = (i * 18) + "ms"; b.appendChild(sp); }
      }); });
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
            $$("[data-flame]").forEach(function(f){ var lvl = flameLevel(state.streak); var n = h(flame(lvl, "grow-in")); n.setAttribute("data-flame", "1"); f.replaceWith(n); });
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
    var lvl = flameLevel(state.streak);
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
        '<div class="panel"><h3>The streak flame</h3><p>A day counts when you meet your goal. The flame grows at 3 days, blazes at 7, burns blue at 10 and turns Dark Matter at 30.</p><div class="panel-body flames">' +
          [[1, "1 day"], [2, "3 days"], [3, "7 days"], [4, "10 days: blue"], [5, "30 days: Dark Matter"]].map(function(f){ return "<figure>" + flame(f[0]) + "<figcaption>" + f[1] + "</figcaption></figure>"; }).join("") + "</div></div>" +
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
     The stage draws the live kit (SH_PLACE.render) inline, in a shadow root so its CSS stays with it: Timmy hops between
     spots on the ground (SH_PLACE.route), drawn in the scene's depth order, and tapping things plays their easter eggs.
     The pickers are rarity cards; the galleries are still pictures, drawn as they scroll near. */
  var TP = window.SH_PLACE;
  var TIER_NAMES = ["Stone", "Antique", "Bronze", "Silver", "Gold", "Diamond", "Dark Matter"];
  var LEVELS = ["I", "II", "III"];
  var HOLS = [["", "No holiday"], ["halloween", "Halloween"], ["thanksgiving", "Thanksgiving"], ["winter", "Christmas"], ["newyear", "New Year's"], ["valentine", "Valentine's Day"], ["dentist", "Dentist's Day"], ["stpatrick", "St. Patrick's Day"], ["easter", "Easter"]];
  var SEASONS = [["", "Summer"], ["spring", "Spring"], ["fall", "Fall"]];
  var FLAIR_HUBS = ["occlusion", "perio", "heme-endo-exam2", "pcd-implants-exam1", "special-patient-care", "generic"];
  /* a made-up student's hub medals: the live hubs' tints first, then more hues for the hubs still to come */
  var MORE_TINTS = ["#C2417A", "#2E9E6B", "#8A4FD0", "#E08A1E", "#1FA3A8", "#D9483B", "#5B6FD6", "#7A8F2E", "#B5651D", "#3F8FBF", "#A04FA8", "#4F9A52", "#D46A6A", "#6B7A8F"];
  function flairOf(lvls){ return lvls.map(function(l, i){ var h = FLAIR_HUBS[i] || "hub-" + (i + 1), t = A.tints && A.tints[h]; return { hub: h, lvl: l, tint: t ? t.ink || t.light : MORE_TINTS[(i - FLAIR_HUBS.length + MORE_TINTS.length * 2) % MORE_TINTS.length] }; }); }
  var FLAIRS = [[], flairOf([2]), flairOf([3, 2, 1]), flairOf([4, 4, 3, 3, 2, 1]), flairOf([4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 1, 1]), flairOf([4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 1, 1, 1, 1])];
  var FLAIR_NAMES = ["No hubs mastered yet", "One hub (Silver)", "Three hubs", "Six hubs, two crowned", "Twelve hubs", "Twenty hubs"];
  var MASTERY = [["case", "Trophy case"], ["plaque", "Gem plaque"]];
  var builtIn = function(x){ return !x.set; }, inSets = function(x){ return x.set && x.set !== "rank"; }, byRank = function(x){ return x.set === "rank"; };
  var PS = { home: "cottage", scene: "hill", time: "clock", yard: { left: "garden", front: "mailbox", corner: "doghouse", right: "fountain" }, up: { chimney: true }, paint: "cream",
    tier: 3, level: 2, flair: 3, mastery: "case", holiday: "", season: "", timmy: "happy", outfit: "", mode: "play", pick: "home", still: false, found: {} };
  function byK(list, k){ for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i]; return null; }
  function clockNight(){ var hr = new Date().getHours(); return hr < 7 || hr >= 19; }
  function isStill(){ return PS.still || reduced; }
  function tpOpts(o){
    return Object.assign({ home: PS.home, scene: PS.scene, night: PS.time === "night" || (PS.time === "clock" && clockNight()), yard: PS.yard, up: PS.up, paint: PS.paint,
      tier: PS.tier, level: PS.level, flair: FLAIRS[PS.flair], mastery: PS.mastery, holiday: PS.holiday, season: PS.season }, o || {});
  }
  function timmyArt(k){
    var t = A.timmy, m = (t.moods || []).filter(function(x){ return x.k === k; })[0];
    if (m) return m.svg;
    var hp = (t.hp || []).filter(function(x){ return "hp" + x.hp === k; })[0];
    return (hp || t.moods[0]).svg;
  }
  function timmySvg(mood, outfit){ var s = timmyArt(mood || "happy"); return outfit ? TP.dress(s, outfit) : s; }
  /* Timmy inside a scene: his drawing at 36 wide, its feet (pet.js's shadow, y 226) on the spot */
  function timmyG(svg){ return '<g class="tp-tface"><svg x="-18" y="-46.1" width="36" height="47.2" viewBox="0 -30 200 262" overflow="visible">' + svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "") + "</svg></g>"; }
  function fmtPrice(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  var COIN = null;
  function price(n){ if (!COIN) COIN = img(TP.coin(), "Shiny Gold Crowns", "tp-coin", "0 0 24 24"); return n ? '<span class="tp-price">' + COIN + fmtPrice(n) + "</span>" : '<span class="tp-price free">Default</span>'; }
  function rarTag(r){ return '<i class="tp-rar r-' + (r || "free") + '">' + esc(r || "Default") + "</i>"; }
  /* a piece's rarity and price for a caption: free things just say so */
  function isGift(x){ var se = x.set && TP.SETS && TP.SETS.seasons.filter(function(q){ return q.k === x.set; })[0]; return !!(se && se.gift); }
  function priceOf(x){ return x.rank ? '<span class="tp-price free">' + esc(x.rankName) + " rank</span>" : isGift(x) ? '<span class="tp-price free">Yours</span>' : price(x.price || 0); }
  function tagLine(x){ return x.rarity ? rarTag(x.rarity) + " " + priceOf(x) : rarTag(""); }
  function sentence(t){ t = String(t || "").replace(/^(Free|Default|Uncommon|Rare|Epic|Legendary): /, ""); return t.charAt(0).toUpperCase() + t.slice(1); }
  function lowerFirst(t){ return /^[A-Z][a-z]/.test(t) && !/^Timmy/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  /* a still picture of a place, Timmy at a spot when asked (vb: the crop, from the kit's own viewBox) */
  function placeFig(o, cap, sub, timmySpot, cls, outfit){
    if (timmySpot) o = Object.assign({}, o, { timmy: { g: timmyG(timmySvg("happy", outfit)), at: timmySpot } });
    var vb = o.viewBox || TP.VIEWBOX, r = TP.render(o);
    var pic = img(r.svg, cap).replace("<img ", '<img width="' + vb[2] + '" height="' + vb[3] + '" ');
    return '<figure class="tp-fig ' + (cls || "") + '"><div class="tp-pic' + (o.night ? " is-night" : "") + '">' + pic + "</div>" + (cap ? "<figcaption><b>" + esc(cap) + "</b>" + (sub ? "<span>" + sub + "</span>" : "") + "</figcaption>" : "") + "</figure>";
  }
  /* the card's scene goes on the page as a picture, with the kit's motion inside unless it's still */
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
  var HOME_CROP = function(){ return crop(cube(1.2, 1.6, 10, 10.6, 11.6), 6); };
  function slotCrop(k, wide){ var s = TP.SLOT_AT[k]; return crop(cube(s.x - .6, s.y - .6, s.x + TP.S + .6, s.y + (wide ? 7.5 : TP.S) + .6, 3.4), 8); }
  function statueCrop(){ return crop(cube(1.9, 8.1, 4.2, 10.5, 3.6), 10); }

  /* each rarity's card art, from the kit (frame()), as a picture with its own motion inside */
  var FRAME_IMG = {};
  function frameImg(r){
    var k = r || "Common", key = k + (isStill() ? "-still" : "");
    if (!FRAME_IMG[key]) {
      var css = TP.CSS.split("\n").filter(function(l){ return /tp-r-|@keyframes tp-spin|prefers-reduced/.test(l); }).join("\n");
      var s = TP.frame(k); if (!isStill()) s = s.replace(/(<svg[^>]*>)/, "$1<style>" + css + "</style>");
      FRAME_IMG[key] = img(s, "", "tp-rframe");
    }
    return FRAME_IMG[key];
  }
  var THUMBS = {};
  function thumbImg(kind, k, o){
    var key = kind + ":" + k + ":" + JSON.stringify(o || {});
    if (!THUMBS[key]) THUMBS[key] = kind === "outfit" ? img(timmySvg("happy", k), "") : img(TP.thumb(kind, k, o), "");
    return THUMBS[key];
  }
  function cardName(n){ n = n.replace(/^(The|A|An) /, ""); return n.charAt(0).toUpperCase() + n.slice(1); }
  /* a shop card: the rarity's art behind the thing itself, its name, rarity and price */
  function rcard(x, thumb, on, data){
    var r = x.rarity || "";
    return '<button type="button" class="tp-rcard r-' + (r || "free") + (on ? " on" : "") + '" aria-pressed="' + (on ? "true" : "false") + '" ' + data + ">" + frameImg(r || "Common") +
      (r ? '<span class="tp-rprice">' + priceOf(x) + "</span>" : "") +
      '<span class="tp-rthumb">' + thumb + '</span><span class="tp-rtext"><span class="tp-rname">' + esc(cardName(x.n)) + '</span><span class="tp-rmeta">' + rarTag(r) + "</span></span></button>";
  }

  /* the same card where it's only shown, not picked (a shelf, a set) */
  function scard(x, thumb, extra){ return rcard(x, thumb, false, "").replace('<button type="button" class="', '<span class="tp-static ').replace(/ aria-pressed="false"\s*>/, ">").replace(/<\/button>$/, (extra || "") + "</span>"); }
  function kindOf(x){ return TP.HOMES.indexOf(x) >= 0 ? "home" : TP.SCENES.indexOf(x) >= 0 ? "scene" : TP.YARD.indexOf(x) >= 0 ? "yard" : "outfit"; }
  function place(){
    if (!TP) { $("#placeGrid").innerHTML = '<p class="note">place.js is missing: run node tools/figures/site/build.mjs</p>'; return; }
    if (!$("#tpCss")) document.head.insertAdjacentHTML("beforeend", '<style id="tpCss">' + TP.CSS + "</style>");
    $("#placeGrid").innerHTML =
      '<div class="panel s12"><h3>Build it</h3><p>Play: tap things in the picture (the sun, the house, whatever’s in the yard) and Timmy hops over to see. Customize: tap a spot or the house to change it, or pick from the cards. Reduced motion: all still.</p>' +
        '<div class="panel-body tp-build"><div class="tp-stage-wrap"><div class="tp-modebar"><div class="seg" role="group" aria-label="What tapping does">' +
          '<button type="button" data-mode="play">Play</button><button type="button" data-mode="customize">Customize</button></div><span class="tp-found" id="tpFound" aria-live="polite"></span></div>' +
          '<div class="tp-stage" id="tpStage"></div></div><div class="tp-side" id="tpSide"></div></div></div>' +
      '<div class="panel s6"><h3>On the “you” card</h3><p>The small size, on the dashboard and in a hub’s More: what the builder shows, cropped close.</p><div class="panel-body"><div class="tp-card" id="tpCard"></div></div></div>' +
      '<div class="panel s6 tp-short"><h3>How it’s built</h3><p>Slots, not free placement, so every combination looks right and nothing overlaps.</p><div class="panel-body tp-how"><ul>' +
        "<li><b>No plot square:</b> each scene’s ground fills the picture, and the yard is its flat middle.</li>" +
        "<li><b>Homes sit in their scene:</b> a soft shadow, the scene’s own ground round the walls, its path, tree and lamp.</li>" +
        "<li><b>Five yard spots</b> along the front; the bowling lane takes two.</li>" +
        "<li><b>What you’ve earned is part of it:</b> your rank is the statue by the door, and every hub you master goes in the display beside the house.</li>" +
        "<li><b>Timmy hops on the ground</b> round the house and the yard things, never over them.</li>" +
        "<li><b>Day and night</b> follow your clock (7 pm to 7 am).</li>" +
        "<li><b>Light to load:</b> one kit draws every combination (about " + Math.round(TP.CSS.length / 1024 + 180) + " KB before compression), loaded only when his place is on screen.</li>" +
        "</ul></div></div>" +
      galleryPanel("tpThemes", "Themes", "Six sets of things that belong together, a scene, its homes, yard things and an outfit for Timmy, and the classics, which go anywhere. Every piece is sold on its own; a theme is just what matches.") +
      galleryPanel("tpHomes", "The homes", "The cottage is free and stays every Timmy’s first home. Seven more from the shop, each shown in its own theme’s scene.") +
      galleryPanel("tpNights", "At night", "Each home’s own lights: windows, a porch lamp, torches at the castle gate, fireflies round the mushroom, the lighthouse’s turning beam, the igloo’s glow, the observatory’s open slit.") +
      galleryPanel("tpScenes", "The scenes", "Each with its own ground, path, tree and lamp, and something to find: number thirty-one’s house on the next hill and the rabbit down it, a whale and a crab, an owl in the pines, a yeti behind a rock, a friend in a crater, a hot-air balloon.") +
      galleryPanel("tpYard", "The yard", "Twelve things for the yard spots, each drawn to fit one. Tap one in the builder for its egg.") +
      galleryPanel("tpUps", "Upgrades of the home itself", "Fancy windows, a porch, a chimney and a Timmy flag: four shop items that every home draws its own way.") +
      galleryPanel("tpPaint", "Paint", "Six colors: a home’s walls, or the mushroom’s cap, the castle’s roofs and banners, the lighthouse’s stripes, the igloo’s ice and the observatory’s dome.") +
      galleryPanel("tpRanks", "Your rank", "The handpiece statue in each rank’s material, and its steps for the level.") +
      galleryPanel("tpMastery", "Hub mastery: two options to pick from", "The pennants are gone. Every hub you master shows beside the house, in a trophy case (a cup per hub) or on a plaque (a gem per hub). The metal is the medal (Bronze, Silver, Gold; a Crown sparkles), the color is the hub’s own, and both grow as you master more, up to twenty. Tap it in the builder and Timmy counts them. Try either one under “Preview only”.") +
      galleryPanel("tpRankSets", "Rank sets: earned, never sold", "Every full rank-up (not the I, II, III levels) gives Timmy an outfit and the yard a decoration in that rank’s material. These are the Handpiece’s six; the later journeys get theirs before anyone reaches them.") +
      galleryPanel("tpSets", "The seasonal sets", "Every season and holiday has a full set: a home and a scene (both Legendary), and a Rare, an Epic and a Legendary outfit and yard piece. A set is on sale only in its season (a short holiday for the seven days ending on its last day). Halloween’s is everyone’s from the start.") +
      '<div class="panel s12"><h3>The shop’s shelves</h3><p>Daily picks, weekly picks, a seasonal shelf while a season is on, and on two days a month a “Back for today” shelf of three out-of-season pieces at their usual price. A design of the shelves: the shop itself is part B.</p><div class="panel-body" id="tpShop"></div></div>' +
      '<div class="panel s12"><h3>Visiting</h3><p>On by default: anyone on the boards can be visited from their name there, and one switch turns it off. A visitor sees the place under the board name and nothing else.</p><div class="panel-body tp-visiting" id="tpVisit"></div></div>' +
      galleryPanel("tpFrames", "Rarity card art", "Every rarity has its own card in the shop and the customizer, and its own burst when you place something. Tap a card to see its burst.") +
      galleryPanel("tpOutfits", "Outfits for Timmy", "One for each theme, drawn on the live Timmy the way his holiday outfits are.") +
      galleryPanel("tpSeasons", "The seasons and holidays", "The yard follows the seasons and the holidays on any home and scene: the tree turns in the fall and blossoms in spring, snow and a snowman at Christmas, a prop by the door for each holiday.") +
      '<div class="panel s12"><h3>Every easter egg</h3><p>What tapping each thing does, and what Timmy says. Spoilers, so it’s folded.</p><div class="panel-body"><details class="tp-eggs"><summary>Show all ' + Object.keys(TP.EGGS).length + "</summary><ul>" +
        Object.keys(TP.EGGS).map(function(k){ var e = TP.EGGS[k]; return "<li><b>" + esc(e.n) + "</b> " + esc(e.does) + (e.say ? ": <q>" + esc(e.say) + "</q>" : "") + "</li>"; }).join("") + "</ul></details></div></div>";
    $$(".tp-modebar [data-mode]").forEach(function(b){ b.addEventListener("click", function(){ PS.mode = b.dataset.mode; buildPlace(); }); });
    buildPlace();
    shopMock(); visitMock();
    lazyGalleries();
  }
  function galleryPanel(id, h, p){ return '<div class="panel s12"><h3>' + h + "</h3><p>" + p + '</p><div class="panel-body tp-gal" id="' + id + '" data-lazy="1"></div></div>'; }
  function listN(names){ return names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0] || ""; }
  function themeFill(t){
    var y = {}, order = ["left", "front", "right", "corner", "side"];
    t.yard.forEach(function(k, i){ var it = byK(TP.YARD, k); if (it.wide) y.side = k; else y[order[i]] = k; });
    return y;
  }
  var THEME_HOME = { hilltop: "cottage", seaside: "lighthouse", woodland: "treehouse", snowy: "igloo", starlight: "observatory", clouds: "castle" };
  var GALLERIES = {
    tpThemes: function(){
      return TP.THEMES.map(function(t){
        var home = THEME_HOME[t.k] || "cottage", scene = t.scene || "hill", out = t.outfits[0] || "";
        var pieces = [].concat(t.scene ? [byK(TP.SCENES, t.scene)] : [], t.homes.map(function(k){ return byK(TP.HOMES, k); }), t.yard.map(function(k){ return byK(TP.YARD, k); }), t.outfits.map(function(k){ return byK(TP.OUTFITS, k); }));
        var list = '<span class="tp-pieces">' + pieces.map(function(x){ return '<span class="tp-piece">' + esc(cardName(x.n)) + " " + tagLine(x) + "</span>"; }).join("") + "</span>";
        var o = { home: home, scene: scene, tier: 3, level: 2, yard: themeFill(t), up: { chimney: true, flag: true }, flair: FLAIRS[2] };
        return placeFig(o, t.n, esc(t.note) + list + '<button type="button" class="btn tp-try" data-theme-try="' + t.k + '">Try it in the builder</button>', "lawn", "tp-theme", out);
      }).join("");
    },
    tpHomes: function(){ return TP.HOMES.filter(builtIn).map(function(h){ var t = byK(TP.THEMES, h.theme) || {}; return placeFig({ home: h.k, scene: (t.scene) || "hill", tier: 1, yard: {} }, h.n, tagLine(h) + " " + esc(sentence(h.note)), "door"); }).join(""); },
    tpNights: function(){ return TP.HOMES.filter(builtIn).map(function(h){ var up = {}; h.ups.forEach(function(k){ up[k] = true; }); return placeFig({ home: h.k, scene: "hill", tier: 3, night: true, up: up, yard: { front: "campfire" } }, h.n + " at night", "", "door"); }).join(""); },
    tpScenes: function(){ return TP.SCENES.filter(builtIn).map(function(s){ return placeFig({ home: "cottage", scene: s.k, tier: 1, yard: {} }, s.n, tagLine(s) + " " + esc(sentence(s.note)), "door"); }).join(""); },
    tpYard: function(){
      return TP.YARD.filter(builtIn).map(function(y){ var t = byK(TP.THEMES, y.theme), sc = t && t.scene || "hill", k = y.wide ? "side" : "front", yd = {}; yd[k] = y.k;
        return placeFig({ home: "cottage", scene: sc, tier: 0, bare: true, yard: yd, viewBox: slotCrop(k, y.wide) }, y.n, tagLine(y) + " " + esc(y.note), "", "tp-yardfig"); }).join("");
    },
    tpUps: function(){ return TP.HOMES.filter(builtIn).map(function(h){ var up = {}; h.ups.forEach(function(k){ if (k !== "paint") up[k] = true; });
      return placeFig({ home: h.k, scene: "hill", tier: 0, up: up, yard: {}, viewBox: HOME_CROP() }, h.n, esc(h.ups.filter(function(k){ return k !== "paint"; }).map(function(k, i){ return i ? lowerFirst(h.upn[k]) : h.upn[k]; }).join(", "))); }).join("") +
      '<div class="tp-upcards">' + TP.UPGRADES.map(function(u){ return '<span class="tp-piece">' + esc(cardName(u.n)) + " " + tagLine(u) + "</span>"; }).join("") + "</div>"; },
    tpPaint: function(){ return TP.PAINTS.map(function(p){ return placeFig({ home: "cottage", scene: "hill", tier: 0, paint: p.k, yard: {}, viewBox: HOME_CROP() }, p.n, tagLine(p), "", "tp-small"); }).join("") +
      TP.PAINTS.map(function(p){ return placeFig({ home: "lighthouse", scene: "hill", tier: 0, paint: p.k, yard: {}, viewBox: HOME_CROP() }, p.boldName + " stripes", "", "", "tp-small"); }).join(""); },
    tpRanks: function(){
      return TIER_NAMES.map(function(n, i){ return placeFig({ home: "cottage", scene: "hill", tier: i, level: 3, yard: {}, viewBox: statueCrop(), night: i === 6 }, n, i === 6 ? "It glows, and its stars come out" : "", "", "tp-small"); }).join("") +
        LEVELS.map(function(l, i){ return placeFig({ home: "cottage", scene: "hill", tier: 4, level: i + 1, yard: {}, viewBox: statueCrop() }, "Gold " + l, (i + 1) + (i ? " steps" : " step"), "", "tp-small"); }).join("");
    },
    /* the two mastery displays, side by side at each size, then each on a whole place */
    tpMastery: function(){
      var vb = [185, 116, 70, 78], out = "";
      MASTERY.forEach(function(m, i){ out += placeFig({ home: i ? "castle" : "cottage", scene: i ? "clouds" : "hill", tier: 4, level: 2, flair: FLAIRS[4], mastery: m[0], yard: { left: "garden", right: "hammock" } }, m[1] + ", on a whole place", "Twelve hubs", "door", "tp-wide"); });
      FLAIRS.slice(1).forEach(function(fl, i){ MASTERY.forEach(function(m){
        out += placeFig({ home: "cottage", scene: "hill", tier: 0, flair: fl, mastery: m[0], yard: {}, viewBox: vb }, m[1] + ": " + FLAIR_NAMES[i + 1].toLowerCase(), "", "", "tp-small"); }); });
      return out;
    },
    tpRankSets: function(){
      if (!TP.SETS) return "";
      return TP.SETS.ranks.map(function(r){
        var o = byK(TP.OUTFITS, r.outfit[0]), y = byK(TP.YARD, r.yard[0]);
        if (!o || !y) return '<figure class="tp-fig"><figcaption><b>' + esc(r.rank) + "</b><span>Not drawn yet</span></figcaption></figure>";
        return '<div class="tp-rankset"><div class="tp-sethead"><b>' + esc(r.rank) + '</b><span>Reach ' + esc(r.rank) + " I</span></div>" + '<div class="tp-rcards">' +
          scard(o, thumbImg("outfit", o.k)) + scard(y, thumbImg("yard", y.k, {})) + "</div></div>"; }).join("");
    },
    tpSets: function(){
      if (!TP.SETS) return "";
      return TP.SETS.seasons.map(function(se){
        var of = function(list){ return list.filter(function(x){ return x.set === se.k; }); }, homes = of(TP.HOMES), scenes = of(TP.SCENES), yard = of(TP.YARD), outfits = of(TP.OUTFITS);
        var head = '<div class="tp-sethead"><b>' + esc(se.n) + "</b><span>" + esc(se.when) + (se.gift ? " · everyone’s from the start" : "") + "</span></div>";
        if (!homes.length || !scenes.length) return '<div class="tp-set">' + head + '<p class="tp-note">Not drawn yet.</p></div>';
        var yd = {}; yard.forEach(function(y, i){ yd[["left", "front", "right"][i]] = y.k; });
        var pic = placeFig({ home: homes[0].k, scene: scenes[0].k, tier: 3, level: 2, yard: yd, up: { flag: true } }, "", "", "door", "tp-setpic", outfits.length ? outfits[outfits.length - 1].k : "");
        var cards = homes.map(function(x){ return rcard(x, thumbImg("home", x.k, { scene: scenes[0].k }), false, 'data-set-try="' + se.k + '"'); })
          .concat(scenes.map(function(x){ return rcard(x, thumbImg("scene", x.k), false, 'data-set-try="' + se.k + '"'); }),
            outfits.map(function(x){ return rcard(x, thumbImg("outfit", x.k), false, 'data-set-try="' + se.k + '" data-set-outfit="' + x.k + '"'); }),
            yard.map(function(x){ return rcard(x, thumbImg("yard", x.k, { scene: scenes[0].k }), false, 'data-set-try="' + se.k + '"'); }));
        return '<div class="tp-set">' + head + '<div class="tp-setbody">' + pic + '<div class="tp-rcards">' + cards.join("") + "</div></div></div>";
      }).join("");
    },
    tpFrames: function(){
      var sample = { Common: ["yard", "mailbox"], Uncommon: ["yard", "campfire"], Rare: ["yard", "telescope"], Epic: ["home", "igloo"], Legendary: ["home", "lighthouse"] };
      return TP.RARITIES.map(function(r){ var s = sample[r.k], x = s[0] === "home" ? byK(TP.HOMES, s[1]) : byK(TP.YARD, s[1]);
        return '<div class="tp-framefig">' + rcard(x, thumbImg(s[0], s[1], {}), false, 'data-burst="' + r.k + '"') + "<p><b>" + esc(r.k) + "</b> " + fmtPrice(r.band[0]) + " to " + fmtPrice(r.band[1]) + "</p></div>"; }).join("");
    },
    tpOutfits: function(){
      return TP.OUTFITS.filter(builtIn).map(function(o){ var t = byK(TP.THEMES, o.theme);
        return '<figure class="tp-fig tp-outfig"><div class="tp-pic tp-outpic">' + thumbImg("outfit", o.k) + "</div><figcaption><b>" + esc(o.n) + "</b><span>" + tagLine(o) + " " + esc(t ? t.n : "") + "</span><span><q>" + esc(o.say[0]) + "</q></span></figcaption></figure>"; }).join("");
    },
    tpSeasons: function(){
      var list = [["", "fall", "Fall"], ["", "spring", "Spring"], ["winter", "", "Christmas"], ["halloween", "fall", "Halloween"], ["thanksgiving", "fall", "Thanksgiving"], ["newyear", "", "New Year's"], ["valentine", "", "Valentine's Day"], ["stpatrick", "spring", "St. Patrick's Day"], ["easter", "spring", "Easter"], ["dentist", "", "Dentist's Day"]];
      var homes = TP.HOMES.filter(builtIn);
      return list.map(function(x, i){ return placeFig({ home: homes[i % homes.length].k, scene: i === 2 ? "forest" : "hill", tier: 2, holiday: x[0], season: x[1], yard: { front: "garden" } }, x[2], "", "", "tp-small"); }).join("");
    }
  };
  function lazyGalleries(){
    var draw = function(el){ if (!el.dataset.lazy) return; delete el.dataset.lazy; el.innerHTML = GALLERIES[el.id]().replace(/<img /g, '<img loading="lazy" '); wireGallery(el); };
    var els = $$(".tp-gal[data-lazy]");
    if (!("IntersectionObserver" in window)) { els.forEach(draw); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { io.unobserve(e.target); draw(e.target); } }); }, { rootMargin: "900px 0px" });
    els.forEach(function(el){ io.observe(el); });
    lazyGalleries.all = function(){ els.forEach(function(el){ io.unobserve(el); draw(el); }); };
  }
  function wireGallery(el){
    $$("[data-theme-try]", el).forEach(function(b){ b.addEventListener("click", function(){
      var t = byK(TP.THEMES, b.dataset.themeTry);
      PS.scene = t.scene || PS.scene; PS.home = THEME_HOME[t.k] || PS.home; PS.yard = themeFill(t); PS.outfit = t.outfits[0] || ""; PS.paint = "cream";
      buildPlace({ burst: "home" }); $("#place").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); }); });
    $$("[data-set-try]", el).forEach(function(b){ b.addEventListener("click", function(){
      var k = b.dataset.setTry, of = function(list){ return list.filter(function(x){ return x.set === k; }); }, yd = {};
      of(TP.YARD).forEach(function(y, i){ yd[["left", "front", "right"][i]] = y.k; });
      PS.home = of(TP.HOMES)[0].k; PS.scene = of(TP.SCENES)[0].k; PS.yard = yd; PS.paint = "cream"; PS.outfit = b.dataset.setOutfit || (of(TP.OUTFITS)[2] || {}).k || "";
      buildPlace({ burst: "home" }); $("#place").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); }); });
    $$("[data-burst]", el).forEach(function(b){ b.addEventListener("click", function(){
      if (isStill()) return;
      var old = $(".tp-cardburst", b); if (old) old.remove();
      b.insertAdjacentHTML("beforeend", '<span class="tp-cardburst">' + TP.burst(b.dataset.burst) + "</span>");
      setTimeout(function(){ var n = $(".tp-cardburst", b); if (n) n.remove(); }, 1600); }); });
  }

  /* ---------- the stage: the scene inline (a shadow root), Timmy hopping, eggs, the customize targets ---------- */
  var STAGE_CSS = [
    ":host{display:block}.tp-box{position:relative;line-height:0}.tp-box>svg.tp-scene{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}",
    ".tp-egg{outline:none}.tp-egg:focus-visible{filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 2px #fff)}.tp-timmy{cursor:pointer}",
    ".tp-hit{position:absolute;inset:0;width:100%;height:100%}.tp-hitarea{fill:transparent;stroke:transparent;stroke-width:2;cursor:pointer;outline:none;transition:fill .15s}",
    ".tp-hitarea:hover,.tp-hitarea:focus-visible{fill:rgba(255,255,255,.2);stroke:#fff;stroke-dasharray:4 4}.tp-hitarea.on{stroke:#fff;stroke-width:2.6;stroke-dasharray:5 4;fill:rgba(255,255,255,.16)}",
    ".tp-hithome.on,.tp-hithome:hover,.tp-hithome:focus-visible{fill:rgba(255,255,255,.08)}",
    /* the speech bubble comes from Timmy: it sits over his head, its tail points at him, and it follows him as he hops */
    ".tp-bubble{position:absolute;left:0;top:0;width:max-content;max-width:min(72%,300px);transform:translateY(5px) scale(.96);transform-origin:var(--tail,50%) 100%;background:#fff;color:#3B2E3A;border:2px solid #3B2E3A;border-radius:14px;",
    "padding:6px 11px;font:inherit;font-size:13.5px;font-weight:650;line-height:1.35;opacity:0;transition:opacity .18s,transform .18s;pointer-events:none;text-align:center;z-index:2}",
    ".tp-bubble.on{opacity:1;transform:none}",
    ".tp-bubble::before,.tp-bubble::after{content:'';position:absolute;left:var(--tail,50%);top:100%;transform:translateX(-50%);border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #3B2E3A}",
    ".tp-bubble::after{border-left-width:5px;border-right-width:5px;border-top:7px solid #fff;margin-top:-.5px}",
    ".tp-bubble.below{transform-origin:var(--tail,50%) 0}.tp-bubble.below::before,.tp-bubble.below::after{top:auto;bottom:100%;border-top:0;border-bottom:9px solid #3B2E3A}.tp-bubble.below::after{border-bottom:7px solid #fff;margin:0 0 -.5px}.tp-bubble.small{font-size:12px;padding:5px 9px;max-width:min(66%,220px)}",
    ".tp-burstpos{position:absolute;width:26%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;line-height:0}",
    /* Timmy waves with his right arm (the same move as the pet's do-wave) */
    ".tp-timmy .shpet-arm-r{transform-box:fill-box;transform-origin:0% 40%}.tp-timmy.do-wave .shpet-arm-r{animation:tp-wave .38s ease-in-out 6 alternate}@keyframes tp-wave{from{transform:rotate(0)}to{transform:rotate(-58deg)}}",
    "@media (prefers-reduced-motion: reduce){.tp-bubble{transition:none}.tp-timmy.do-wave .shpet-arm-r{animation:none}}"
  ].join("\n");
  var ST = { at: "door", pos: null, dir: 1, busy: false, next: null, raf: 0, tg: null, tw: null, face: null, depth: null, sr: null, wander: 0, lastTap: 0, layout: null, visible: true };
  function buildPlace(opt){
    opt = opt || {};
    var host = $("#tpStage"); if (!host.shadowRoot) host.attachShadow({ mode: "open" });
    var sr = host.shadowRoot, still = isStill(), o = tpOpts({ marks: PS.mode === "customize" }), L = TP.layout(o), vb = TP.VIEWBOX;
    cancelAnimationFrame(ST.raf); ST.busy = false; ST.next = null; ST.bub = null;
    if (!L.spots[ST.at]) ST.at = "door";
    o.timmy = { g: timmyG(timmySvg(PS.timmy, PS.outfit)), at: ST.at };
    var r = TP.render(o);
    var hits = PS.mode !== "customize" ? "" : '<svg class="tp-hit" viewBox="' + vb.join(" ") + '" aria-label="Spots you can change">' +
      Object.keys(r.slots).map(function(k){ var it = PS.yard[k], name = byK(TP.SLOTS, k).n;
        return '<path class="tp-hitarea' + (PS.pick === k ? " on" : "") + '" data-pick="' + k + '" d="' + r.slots[k] + '" tabindex="0" role="button" aria-label="' + esc(name + ": " + (it ? byK(TP.YARD, it).n : "empty") + ". Change it") + '"/>'; }).join("") +
      '<path class="tp-hitarea tp-hithome' + (PS.pick === "home" ? " on" : "") + '" data-pick="home" d="' + r.homeHit + '" tabindex="0" role="button" aria-label="' + esc(byK(TP.HOMES, PS.home).n + ". Change it") + '"/></svg>';
    host.classList.toggle("is-night", !!(o.night || byK(TP.SCENES, PS.scene).alwaysNight));
    sr.innerHTML = "<style>" + TP.CSS + "\n" + STAGE_CSS + "</style>" + '<div class="tp-box' + (still ? " tp-still" : "") + '">' +
      r.svg.replace(' aria-hidden="true" focusable="false"', ' role="group" aria-label="' + esc(sceneAlt()) + '"') + hits + '<div class="tp-bubble" role="status" aria-live="polite"></div></div>';
    ST.sr = sr; ST.layout = L; ST.depth = $(".tp-depth", sr); ST.tg = $(".tp-timmy", sr); ST.tw = ST.tg && ST.tg.parentNode; ST.face = ST.tg && $(".tp-tface", ST.tg);
    ST.pos = L.spots[ST.at].slice(); setTimmy(ST.pos, 0, 1, 1);
    if (ST.tg) { ST.tg.setAttribute("role", "button"); ST.tg.setAttribute("tabindex", "0"); ST.tg.setAttribute("aria-label", "Timmy");
      ST.tg.addEventListener("click", function(e){ e.stopPropagation(); tapTimmy(); }); keyed(ST.tg, tapTimmy); }
    $$(".tp-egg", sr).forEach(function(g){
      var k = g.dataset.egg, e = TP.EGGS[k] || TP.EGGS.home;
      g.setAttribute("role", "button"); g.setAttribute("tabindex", "0"); g.setAttribute("aria-label", e.n + ": " + e.does);
      g.addEventListener("click", function(ev){ ev.stopPropagation(); playEgg(g); });
      keyed(g, function(){ playEgg(g); });
    });
    $$(".tp-hitarea", sr).forEach(function(p){
      var go = function(){ PS.pick = p.dataset.pick; buildPlace(); var n = ST.sr && $('.tp-hitarea[data-pick="' + PS.pick + '"]', ST.sr); if (n) n.focus(); };
      p.addEventListener("click", function(e){ e.stopPropagation(); go(); }); keyed(p, go);
    });
    $$(".tp-modebar [data-mode]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.mode === PS.mode ? "true" : "false"); });
    found();
    if (opt.burst && !still) burstAt(opt.burst);
    if (opt.burst && opt.burst !== "home" && L.spots[opt.burst]) setTimeout(function(){ goTo(opt.burst); }, still ? 0 : 450);
    if (opt.say) say(opt.say);
    wanderOn();
    side();
    placeCard();
  }
  function keyed(el, fn){ el.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); e.stopPropagation(); fn(); } }); }
  function found(){
    var eggs = ST.sr ? $$(".tp-egg", ST.sr).map(function(g){ return g.dataset.egg; }) : [], seen = {};
    eggs.forEach(function(k){ seen[k] = 1; });
    var n = Object.keys(seen).length, got = Object.keys(seen).filter(function(k){ return PS.found[k]; }).length;
    $("#tpFound").textContent = PS.mode === "play" ? (got ? got + " of " + n + " surprises found here" : n + " things here do something when tapped") : "Tap a dashed spot or the house";
  }
  function say(text){
    var b = ST.sr && $(".tp-bubble", ST.sr); if (!b || !text) return;
    b.textContent = text; b.classList.toggle("small", b.parentNode.clientWidth < 440); ST.bub = { el: b, w: b.offsetWidth, h: b.offsetHeight }; bubbleAt();
    b.classList.add("on"); clearTimeout(say.t); say.t = setTimeout(function(){ b.classList.remove("on"); ST.bub = null; }, 3200);
  }
  /* put the bubble over Timmy's head (under him when there's no room above), kept inside the picture, its tail on him */
  function bubbleAt(){
    var u = ST.bub; if (!u || !ST.pos) return;
    var box = u.el.parentNode, W = box.clientWidth, H = box.clientHeight, vb = TP.VIEWBOX, q = TP.project(ST.pos[0], ST.pos[1], ST.pos[2] || 0);
    var x = (q[0] - vb[0]) / vb[2] * W, head = (q[1] - (PS.outfit ? 60 : 50) - vb[1]) / vb[3] * H, feet = (q[1] + 4 - vb[1]) / vb[3] * H;
    var left = Math.max(6, Math.min(W - u.w - 6, x - u.w / 2)), below = head - u.h - 11 < 4, top = below ? feet + 11 : head - u.h - 11;
    u.el.style.left = left.toFixed(1) + "px"; u.el.style.top = top.toFixed(1) + "px"; u.el.style.setProperty("--tail", Math.max(16, Math.min(u.w - 16, x - left)).toFixed(1) + "px"); u.el.classList.toggle("below", below);
  }
  function rankLine(){ return "Your rank, " + TIER_NAMES[PS.tier] + " " + LEVELS[PS.level - 1] + (PS.level < 3 ? ". One more step at the next level." : PS.tier < 6 ? ". The next rank changes what it's made of." : ". Made of Dark Matter, and it glows."); }
  function masteryLine(){
    var fl = FLAIRS[PS.flair], n = [0, 0, 0, 0, 0]; fl.forEach(function(x){ n[x.lvl]++; });
    var parts = [[4, "Crown"], [3, "Gold"], [2, "Silver"], [1, "Bronze"]].filter(function(q){ return n[q[0]]; }).map(function(q){ return n[q[0]] + " " + q[1]; });
    return fl.length + (fl.length === 1 ? " hub" : " hubs") + " mastered: " + listN(parts) + ".";
  }
  function playEgg(g){
    var k = g.dataset.egg, e = TP.EGGS[k] || {};
    g.classList.remove("tp-on"); void g.getBoundingClientRect(); g.classList.add("tp-on");
    clearTimeout(g._t); g._t = setTimeout(function(){ g.classList.remove("tp-on"); }, 2600);
    PS.found[k] = 1; found();
    say(k === "statue" ? rankLine() : k === "mastery" ? masteryLine() : e.say);
    ST.lastTap = Date.now();
    if (isStill()) return;
    var target = spotFor(g);
    if (target) goTo(target); else hopInPlace();
  }
  /* where Timmy goes to see a thing: its yard spot, the door for the home and what's by it, else the nearest spot when
     it stands on the ground in the yard; things in the sky or far off, he hops where he is */
  function spotFor(g){
    var it = g.closest(".tp-item"), k = g.dataset.egg, sp = ST.layout.spots;
    if (it && sp[it.dataset.slot]) return it.dataset.slot;
    if (k === "home" || k === "statue" || k === "brush" || k === "mastery") return sp.deck && Math.random() < .4 ? "deck" : "door";
    var b; try { b = g.getBBox(); } catch (x) { return null; }
    var q = TP.unproject(b.x + b.width / 2, b.y + b.height);
    if (!(q[0] > -2 && q[1] > -2 && q[0] < 16.5 && q[1] < 16.5)) return null;
    var best = null, bd = 1e9; Object.keys(sp).forEach(function(s){ var p = sp[s], d = (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]); if (d < bd) { bd = d; best = s; } });
    return best;
  }
  function setTimmy(p, arc, kx, ky){
    if (!ST.tg) return;
    var q = TP.project(p[0], p[1], p[2] || 0);
    ST.tg.setAttribute("transform", "translate(" + q[0].toFixed(1) + " " + (q[1] - arc).toFixed(1) + ")");
    ST.face.setAttribute("transform", "scale(" + (ST.dir * kx).toFixed(3) + " " + ky.toFixed(3) + ")");
    /* drawn in the scene's depth order: in front of what's behind him, behind what's in front */
    var z = p[0] + p[1] + .3, c = ST.depth.firstChild;
    while (c && (c === ST.tw || +c.getAttribute("data-z") <= z)) c = c.nextSibling;
    if (c !== ST.tw.nextSibling) ST.depth.insertBefore(ST.tw, c);
    if (ST.bub) { var keep = ST.pos; ST.pos = p; bubbleAt(); ST.pos = keep; }
  }
  function lerp(a, b, t){ return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t]; }
  function goTo(spot){
    if (!ST.layout || !ST.layout.spots[spot]) return;
    if (isStill()) { ST.at = spot; ST.pos = ST.layout.spots[spot].slice(); setTimmy(ST.pos, 0, 1, 1); return; }
    if (ST.busy) { ST.next = spot; return; }
    if (spot === ST.at) { hopInPlace(); return; }
    var path = TP.route(tpOpts(), ST.at, spot); ST.at = spot;
    hops(path);
  }
  function hops(path){
    var list = [];
    for (var i = 1; i < path.length; i++){
      var a = path[i - 1], b = path[i], dz = (b[2] || 0) - (a[2] || 0), d = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]) + dz * dz * 1.4);
      var n = Math.max(1, Math.ceil(d / 1.15));
      for (var j = 0; j < n; j++) list.push([lerp(a, b, j / n), lerp(a, b, (j + 1) / n), Math.abs(dz) > .3]);
    }
    if (!list.length) return;
    ST.busy = true;
    var hi = 0, t0 = performance.now(), AIR = 260, LAND = 90;
    var start = function(h){ var p = TP.project(h[0][0], h[0][1], h[0][2]), q = TP.project(h[1][0], h[1][1], h[1][2]); if (Math.abs(q[0] - p[0]) > .5) ST.dir = q[0] < p[0] ? -1 : 1; };
    start(list[0]);
    var frame = function(now){
      if (!ST.tg) { ST.busy = false; return; }
      var h = list[hi], t = now - t0;
      if (t < AIR) { var u = t / AIR, e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; setTimmy(lerp(h[0], h[1], e), Math.sin(Math.PI * u) * (h[2] ? 3 : 6), 1 - .04 * Math.sin(Math.PI * u), 1 + .07 * Math.sin(Math.PI * u)); }
      else if (t < AIR + LAND) { var v = Math.sin(Math.PI * (t - AIR) / LAND); setTimmy(h[1], 0, 1 + .1 * v, 1 - .13 * v); }
      else {
        hi++; t0 = now;
        if (hi >= list.length) { ST.busy = false; ST.pos = h[1]; setTimmy(h[1], 0, 1, 1); if (ST.next) { var n = ST.next; ST.next = null; goTo(n); } return; }
        start(list[hi]);
      }
      ST.raf = requestAnimationFrame(frame);
    };
    ST.raf = requestAnimationFrame(frame);
  }
  function hopInPlace(){ if (isStill() || ST.busy || !ST.pos) return; hops([ST.pos, ST.pos.slice(0, 2).concat([(ST.pos[2] || 0) + .01]), ST.pos]); }
  /* Timmy waves hello when he's tapped (and now and then by himself); tap him again while he's waving and he flips */
  var HELLOS = ["Hi! Good to see you.", "Hello! Come on in.", "Hey there! Nice day for it.", "Oh, hi! I was just thinking about flossing."];
  function wave(quiet){
    if (!ST.tg) return;
    if (quiet !== true) { PS.found.timmy = 1; found(); say(HELLOS[(wave.n = (wave.n || 0) + 1) % HELLOS.length]); }
    if (isStill()) return;
    ST.tg.classList.remove("do-wave"); void ST.tg.getBoundingClientRect(); ST.tg.classList.add("do-wave"); ST.waveAt = Date.now();
    clearTimeout(wave.t); wave.t = setTimeout(function(){ if (ST.tg) ST.tg.classList.remove("do-wave"); }, 2400);
  }
  function tapTimmy(){ ST.lastTap = Date.now(); if (Date.now() - (ST.waveAt || 0) < 2400 && !isStill()) { ST.waveAt = 0; if (ST.tg) ST.tg.classList.remove("do-wave"); flip(); } else wave(); }
  function flip(quiet){
    if (quiet !== true) { PS.found.timmy = 1; found(); say(TP.EGGS.timmy.say); }
    if (isStill() || ST.busy || !ST.pos) return;
    ST.busy = true; var t0 = performance.now(), D = 620, p = ST.pos;
    var frame = function(now){
      if (!ST.tg) { ST.busy = false; return; }
      var u = Math.min(1, (now - t0) / D);
      setTimmy(p, Math.sin(Math.PI * u) * 16, Math.cos(u * Math.PI * 2), 1);
      if (u < 1) ST.raf = requestAnimationFrame(frame); else { setTimmy(p, 0, 1, 1); ST.busy = false; }
    };
    ST.raf = requestAnimationFrame(frame);
  }
  /* while it's on screen and nobody's tapping, he wanders to a spot now and then */
  function wanderOn(){
    if (ST.wander) return;
    var host = $("#tpStage");
    if ("IntersectionObserver" in window) new IntersectionObserver(function(es){ ST.visible = es[0].isIntersecting; }).observe(host);
    ST.wander = setInterval(function(){
      if (isStill() || PS.mode !== "play" || ST.busy || !ST.visible || document.hidden || Date.now() - ST.lastTap < 6000 || !ST.layout) return;
      if (Math.random() < .34) { wave(true); return; }
      var keys = Object.keys(ST.layout.spots).filter(function(k){ return k !== ST.at; });
      if (keys.length) goTo(keys[Math.floor(Math.random() * keys.length)]);
    }, 5200);
  }
  function burstAt(where){
    var it = where === "home" ? null : PS.yard[where], x = it ? byK(TP.YARD, it) : byK(TP.HOMES, PS.home), r = x && x.rarity || "Common", vb = TP.VIEWBOX, q;
    if (where === "home") q = TP.project(5.5, 5.5, 4);
    else { var s = TP.SLOT_AT[where]; q = TP.project(s.x + TP.S / 2, s.y + (x && x.wide ? 3.75 : TP.S / 2), 1); }
    var box = ST.sr && $(".tp-box", ST.sr); if (!box) return;
    box.insertAdjacentHTML("beforeend", '<div class="tp-burstpos" style="left:' + ((q[0] - vb[0]) / vb[2] * 100).toFixed(2) + "%;top:" + ((q[1] - vb[1]) / vb[3] * 100).toFixed(2) + '%">' + TP.burst(r) + "</div>");
    setTimeout(function(){ var b = ST.sr && $(".tp-burstpos", ST.sr); if (b) b.remove(); }, 1700);
  }

  /* ---------- the side panel: what to change, as rarity cards ---------- */
  function chip(label, on, data, extra){ return '<button type="button" class="tp-chip' + (on ? " on" : "") + '" aria-pressed="' + (on ? "true" : "false") + '" ' + data + ">" + (extra || "") + esc(label) + "</button>"; }
  function side(){
    var el = $("#tpSide"), pick = PS.pick, h = byK(TP.HOMES, PS.home), body = "", lane = PS.yard.side === "lane";
    var tabs = [["home", "Home"], ["scene", "Scene"]].concat(TP.SLOTS.filter(function(s){ return !(s.k === "corner" && lane); }).map(function(s){ return [s.k, s.n]; }), [["timmy", "Timmy"]]);
    if (pick === "corner" && lane) pick = PS.pick = "side";
    var head = '<div class="tp-tabs" role="group" aria-label="What to change">' + tabs.map(function(t){ return chip(t[1], pick === t[0], 'data-pick="' + t[0] + '"'); }).join("") + "</div>";
    var cards = function(list){ return '<div class="tp-rcards">' + list.join("") + "</div>"; };
    if (pick === "home") {
      var homeCard = function(x){ return rcard(x, thumbImg("home", x.k, { scene: PS.scene }), x.k === PS.home, 'data-home="' + x.k + '"'); };
      body = "<h4>Home</h4>" + cards(TP.HOMES.filter(builtIn).map(homeCard)) + more("From the seasonal sets", TP.HOMES.filter(inSets).map(homeCard), inSets(h)) +
        "<h4>Upgrades for " + esc(h.n.replace(/^The /, "the ")) + "</h4>" + '<div class="tp-opts">' + TP.UPGRADES.filter(function(u){ return h.ups.indexOf(u.k) >= 0; }).map(function(u){
          var on = !!PS.up[u.k], own = h.upn[u.k], same = cardName(own).toLowerCase() === cardName(u.n).toLowerCase();
          return '<button type="button" class="tp-upg' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-up="' + u.k + '">' + rarTag(u.rarity) +
            '<span class="tp-upn"><b>' + esc(cardName(u.n)) + "</b><small>" + esc(same ? "" : own) + "</small></span>" + price(u.price) + "</button>"; }).join("") + "</div>" +
        (h.ups.indexOf("paint") < 0 ? "" : "<h4>" + esc(h.upn.paint) + '</h4><div class="tp-opts tp-paints">' + TP.PAINTS.map(function(p){ var bold = /mushroom|castle|lighthouse/.test(PS.home) || !!h.set, c = h.set && p.k === "cream" ? "#F4EFE6" : bold ? p.bold : p.c;
          return '<button type="button" class="tp-swatch' + (PS.paint === p.k ? " on" : "") + '" data-paint="' + p.k + '" aria-pressed="' + (PS.paint === p.k) + '" aria-label="' + esc(bold ? p.boldName : p.n) + '" title="' + esc((bold ? p.boldName : p.n) + (p.price ? ", " + p.price + " gold crowns" : ", free")) + '" style="--sw:' + c + '"></button>'; }).join("") + "</div>");
    } else if (pick === "scene") {
      var sceneCard = function(x){ return rcard(x, thumbImg("scene", x.k), x.k === PS.scene, 'data-scene="' + x.k + '"'); };
      body = "<h4>The scene</h4>" + cards(TP.SCENES.filter(builtIn).map(sceneCard)) + more("From the seasonal sets", TP.SCENES.filter(inSets).map(sceneCard), inSets(byK(TP.SCENES, PS.scene)));
    } else if (pick === "timmy") {
      var outCard = function(o){ return rcard(o, thumbImg("outfit", o.k), PS.outfit === o.k, 'data-outfit="' + o.k + '"'); }, cur0 = byK(TP.OUTFITS, PS.outfit) || {};
      body = "<h4>What Timmy wears</h4>" + cards([rcard({ n: "Just Timmy", rarity: "", price: 0 }, thumbImg("outfit", ""), !PS.outfit, 'data-outfit=""')].concat(TP.OUTFITS.filter(builtIn).map(outCard))) +
        more("Earned by rank", TP.OUTFITS.filter(byRank).map(outCard), byRank(cur0)) + more("From the seasonal sets", TP.OUTFITS.filter(inSets).map(outCard), inSets(cur0));
    } else {
      var sl = byK(TP.SLOTS, pick), cur = PS.yard[pick];
      var yardCard = function(y){ return rcard(y, thumbImg("yard", y.k, { scene: PS.scene }), cur === y.k, 'data-item="' + y.k + '"'); }, curY = byK(TP.YARD, cur) || {};
      body = "<h4>" + esc(sl.n) + "</h4>" + cards([rcard({ n: "Nothing here", rarity: "", price: 0 }, "", !cur, 'data-item=""')].concat(TP.YARD.filter(builtIn).filter(function(y){ return !y.wide || pick === "side" || pick === "corner"; }).map(yardCard))) +
        more("Earned by rank", TP.YARD.filter(byRank).map(yardCard), byRank(curY)) + more("From the seasonal sets", TP.YARD.filter(inSets).map(yardCard), inSets(curY)) +
        (pick === "side" || pick === "corner" ? '<p class="tp-note">The bowling lane is long: it takes the side yard and the front corner together.</p>' : "");
    }
    body += '<div class="tp-shop"><button type="button" class="btn" disabled>Get more in the shop</button><span class="tp-note">The shop is part B: here everything is yours to try. Prices are in Shiny Gold Crowns.</span></div>';
    var prev = '<details class="tp-prev"' + (side.open ? " open" : "") + "><summary>Preview only: time, rank, season, Timmy</summary>" +
      '<div class="tp-ctl"><span>Time</span><div class="seg" role="group" aria-label="Time of day">' + [["clock", "Your clock"], ["day", "Day"], ["night", "Night"]].map(function(t){ return '<button type="button" data-time="' + t[0] + '" aria-pressed="' + (PS.time === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div></div>" +
      selRow("Rank", "tier", TIER_NAMES.map(function(n, i){ return [i, n]; }), PS.tier) +
      selRow("Level", "level", LEVELS.map(function(n, i){ return [i + 1, n]; }), PS.level) +
      selRow("Mastery", "flair", FLAIR_NAMES.map(function(n, i){ return [i, n]; }), PS.flair) + selRow("Mastery display", "mastery", MASTERY, PS.mastery) +
      selRow("Season", "season", SEASONS, PS.season) + selRow("Holiday", "holiday", HOLS, PS.holiday) +
      selRow("Timmy", "timmy", [["happy", "Happy"], ["ok", "Okay"], ["sad", "Sad"], ["sick", "Sick"], ["sleep", "Asleep"], ["scared", "Startled"]].concat((A.timmy.hp || []).map(function(x){ return ["hp" + x.hp, x.hp + " HP"]; })), PS.timmy) +
      '<label class="tp-ctl tp-check"><input type="checkbox" data-still="1"' + (PS.still ? " checked" : "") + "> Show it as reduced motion does (still)</label></div></details>";
    el.innerHTML = head + '<div class="tp-pick">' + body + "</div>" + prev;
    $(".tp-prev", el).addEventListener("toggle", function(e){ side.open = e.target.open; });
    $$(".tp-more", el).forEach(function(d){ d.addEventListener("toggle", function(){ side.more[d.dataset.more] = d.open; }); });
    $$("[data-pick]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.pick = b.dataset.pick; if (PS.mode === "play" && PS.pick !== "timmy" && PS.pick !== "scene") PS.mode = "customize"; buildPlace(); }); });
    $$("[data-home]", el).forEach(function(b){ b.addEventListener("click", function(){ if (PS.home === b.dataset.home) return; PS.home = b.dataset.home; buildPlace({ burst: "home", say: byK(TP.HOMES, PS.home).n + ". Home sweet home." }); }); });
    $$("[data-up]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.up[b.dataset.up] = !PS.up[b.dataset.up]; buildPlace(PS.up[b.dataset.up] ? { burst: "home" } : {}); }); });
    $$("[data-paint]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.paint = b.dataset.paint; buildPlace(); }); });
    $$("[data-scene]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.scene = b.dataset.scene; buildPlace({ say: byK(TP.SCENES, PS.scene).n + ". Let's look around." }); }); });
    $$("[data-outfit]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.outfit = b.dataset.outfit; var o = byK(TP.OUTFITS, PS.outfit); buildPlace({ say: o ? o.say[0] : "Back to just me." }); if (!isStill()) setTimeout(function(){ flip(true); }, 120); }); });
    $$("[data-item]", el).forEach(function(b){ b.addEventListener("click", function(){
      var k = PS.pick, it = b.dataset.item;
      if (it === "lane") { delete PS.yard.corner; PS.yard.side = "lane"; k = PS.pick = "side"; }
      else if (it) { if (k === "side" && PS.yard.side === "lane" && it !== "lane") delete PS.yard.side; PS.yard[k] = it; }
      else delete PS.yard[k];
      buildPlace(it ? { burst: k, say: "New: " + byK(TP.YARD, it).n.replace(/^A /, "a ") + "." } : {}); }); });
    $$("[data-time]", el).forEach(function(b){ b.addEventListener("click", function(){ PS.time = b.dataset.time; buildPlace(); }); });
    $$("select[data-k]", el).forEach(function(s){ s.addEventListener("change", function(){ var k = s.dataset.k; PS[k] = k === "tier" || k === "flair" || k === "level" ? +s.value : s.value; buildPlace(); }); });
    $("[data-still]", el).addEventListener("change", function(e){ PS.still = e.target.checked; buildPlace(); });
  }
  /* a folded group of cards in the customizer (the sets are many): open when the piece in use is in it, or once opened */
  side.more = {};
  function more(title, cards, has){
    if (!cards.length) return "";
    return '<details class="tp-more" data-more="' + esc(title) + '"' + (has || side.more[title] ? " open" : "") + "><summary>" + esc(title) + ' <span class="num">' + cards.length + '</span></summary><div class="tp-rcards">' + cards.join("") + "</div></details>";
  }
  function selRow(label, k, opts, cur){
    return '<label class="tp-ctl"><span>' + label + '</span><span class="select-wrap"><select class="select" data-k="' + k + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>" + icon("chevron", 18) + "</span></label>";
  }
  function placeCard(){
    var o = tpOpts({ viewBox: TP.CARD, timmy: { g: timmyG(timmySvg(PS.timmy, PS.outfit)), at: "door" } }), rr = TP.render(o), h = byK(TP.HOMES, PS.home), s = byK(TP.SCENES, PS.scene);
    $("#tpCard").innerHTML = '<div class="tp-pic tp-cardpic' + (o.night ? " is-night" : "") + '">' + sceneImg(rr.svg, sceneAlt(), isStill()) + "</div>" +
      '<div class="tp-cardfoot"><div><b>Timmy’s place</b><span>' + esc(h.n) + " · " + esc(s.n.replace(/^The /, "the ")) + '</span></div><a class="btn" href="#place">Change it</a></div>';
  }

  /* ---------- the shop's shelves (a design of what get_my_shop returns: today, this week, the season, a throwback) ---------- */
  function anyCard(x, extra){ var kind = kindOf(x); return scard(x, thumbImg(kind, x.k, kind === "scene" || kind === "outfit" ? undefined : {}), extra); }
  function shopMock(){
    var el = $("#tpShop"); if (!el) return;
    var pick = function(list, ks){ return ks.map(function(k){ return byK(list, k); }).filter(Boolean); };
    var shelf = function(title, when, note, cards, cls){ return '<section class="tp-shelf ' + (cls || "") + '"><header><h4>' + esc(title) + '</h4><span class="tp-when">' + esc(when) + "</span>" + (note ? '<p class="tp-note">' + esc(note) + "</p>" : "") + '</header><div class="tp-rcards">' + cards.join("") + "</div></section>"; };
    var season = TP.SETS && TP.SETS.seasons.filter(function(q){ return q.k === "thanksgiving"; })[0], of = function(list, k){ return list.filter(function(x){ return x.set === k; }); };
    var seasonal = season ? of(TP.HOMES, season.k).concat(of(TP.SCENES, season.k), of(TP.OUTFITS, season.k), of(TP.YARD, season.k)) : [];
    var back = [].concat(of(TP.YARD, "spring").slice(1, 2), of(TP.OUTFITS, "valentine").slice(0, 1), of(TP.HOMES, "summer").slice(0, 1));
    var ribbon = '<span class="tp-ribbon">Back for today</span>';
    el.innerHTML =
      shelf("Today’s picks", "New picks in 6 h 12 min", "Four pieces, the same for everyone, new every day.", pick(TP.YARD, ["mailbox", "campfire"]).concat(pick(TP.OUTFITS, ["sunhat"]), pick(TP.YARD, ["telescope"])).map(function(x){ return anyCard(x); })) +
      shelf("This week", "5 days left", "Three bigger pieces that stay all week.", pick(TP.HOMES, ["igloo"]).concat(pick(TP.SCENES, ["beach"]), pick(TP.YARD, ["pool"])).map(function(x){ return anyCard(x); })) +
      (seasonal.length ? shelf(season.n, "On sale until November 27", "The season’s set, only while the season lasts. Two seasons at once (fall is on too) get a shelf each.", seasonal.map(function(x){ return anyCard(x); }), "tp-shelf-season") : "") +
      (back.length ? shelf("Back for today", "A throwback day: two a month", "Three pieces from seasons that have passed, at their usual price, today only.", back.map(function(x){ return anyCard(x, ribbon); }), "tp-shelf-back") : "") +
      '<p class="tp-note">Halloween’s set is already in everyone’s inventory, and rank sets are never on a shelf: you earn them.</p>';
  }

  /* ---------- visiting: from a name on the boards to that person's place (made-up names and places) ---------- */
  var VISIT = [
    { name: "Molar Maverick", xp: "48,210", tier: 5, o: { home: "castle", scene: "clouds", yard: { left: "fountain", front: "garden", side: "lane" }, up: { flag: true }, flair: 4, mastery: "plaque" }, outfit: "aviator" },
    { name: "Floss Boss", xp: "41,775", tier: 4, o: { home: "harvest-barn", scene: "harvest-fields", yard: { left: "hay-bales", front: "harvest-table", right: "turkey-balloon" }, up: { flag: true }, flair: 3, mastery: "case" }, outfit: "parade-marshal" },
    { name: "Captain Cuspid", xp: "39,020", tier: 4, o: { home: "lighthouse", scene: "beach", yard: { left: "umbrella", front: "sandcastle", right: "pool" }, up: { porch: true }, flair: 3, mastery: "case" }, outfit: "captain" },
    { name: "Enamel Ninja", xp: "33,480", tier: 3, off: true },
    { name: "You", xp: "29,150", tier: 3, me: true }
  ];
  var VS = { at: 0, on: true };
  function visitMock(){
    var el = $("#tpVisit"); if (!el) return;
    var v = VISIT[VS.at], rows = VISIT.map(function(r, i){
      var act = r.me ? '<span class="tp-vnote">Your place</span>' : r.off ? '<span class="tp-vnote">Visits off</span>' : '<button type="button" class="btn tp-vbtn" data-visit="' + i + '" aria-pressed="' + (i === VS.at) + '">' + (i === VS.at ? "Visiting" : "Visit") + "</button>";
      return '<li class="tp-vrow' + (r.me ? " me" : "") + '"><span class="num">' + (i + 1) + '</span><span class="tp-vname">' + esc(r.name) + "<small>" + esc(TIER_NAMES[r.tier]) + '</small></span><span class="num xp-gold">' + r.xp + " XP</span>" + act + "</li>"; }).join("");
    var o = Object.assign({ tier: v.tier, level: 2, timmy: { g: timmyG(timmySvg("happy", v.outfit)), at: "door" } }, v.o, { flair: FLAIRS[v.o.flair] });
    ["home", "scene"].forEach(function(k){ if (!byK(k === "home" ? TP.HOMES : TP.SCENES, o[k])) o[k] = k === "home" ? "cottage" : "hill"; });
    Object.keys(o.yard).forEach(function(k){ if (!byK(TP.YARD, o.yard[k])) delete o.yard[k]; });
    el.innerHTML = '<div class="tp-vboard"><h4>The rank board</h4><ol>' + rows + "</ol>" +
        '<label class="tp-vswitch"><input type="checkbox" role="switch" id="tpVisitOn"' + (VS.on ? " checked" : "") + '><span><b>Let classmates visit my place</b><small>' + (VS.on ? "On. They see your place under your board name, nothing else." : "Off. Your name on the boards has no Visit button.") + "</small></span></label></div>" +
      '<div class="tp-vplace"><div class="tp-vhead"><b>' + esc(v.name) + "’s place</b><span>Visiting · look, don’t touch</span>" + '<button type="button" class="btn" disabled>Back to mine</button></div>' +
        '<div class="tp-pic">' + sceneImg(TP.render(o).svg, v.name + "'s place", isStill()) + "</div></div>";
    $$("[data-visit]", el).forEach(function(b){ b.addEventListener("click", function(){ VS.at = +b.dataset.visit; visitMock(); }); });
    $("#tpVisitOn", el).addEventListener("change", function(e){ VS.on = e.target.checked; visitMock(); });
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
    tiles(); buildHub(); pairs(); rewards(); faces(); tokens(); icons(); hubart(); medals(); timmys(); place();
  }
  window.SH_DESIGN = { LIVE_BY_HUB: LIVE_BY_HUB, rebuild: buildHub, place: PS, rebuildPlace: function(o){ buildPlace(o); }, drawGalleries: function(){ if (lazyGalleries.all) lazyGalleries.all(); }, placeStage: ST };
  init();
})();
