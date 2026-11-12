/* The three equipment journeys' objects (redesign phase 4, part A; vault/tasks/2026-11-06-redesign-progression-journeys.md).
   The rank ladder is three journeys of the same seven materials, Stone to Dark Matter: the Handpiece (drawn by
   widget/ranks.js, as it is today), then the Acadental ModuPro, then Dental Loupes. This kit holds the two new objects
   as shapes that shRanks.art(tier, px, { shape }) draws in a medallion exactly as it draws the handpiece: the same disc,
   the same metals, textures, stars and glints. One drawing per object, plus its antique (tier 1), as the handpiece has.

   Drawn anew from what these sources say (never from their artwork):
   - Acadental, "ModuPRO One" brochure (acadental.com/pdfs/Restorative/MP One Brochure.pdf): a 32-tooth typodont, a
     maxillary and a mandibular soft-gum base that take the teeth, a version with an adjustable articulator, and an arch
     that locks into the manikin's carrier tray. Settled: 8 teeth a quadrant in side view (2 incisors, a canine, 2
     premolars, 3 molars), two gum bases on two plates, a hinge post at the back, a stud on top.
   - Loupe makers' fitting guides (Lumadent, "TTL vs flip-up"; Dimensions of Dental Hygiene on declination angles):
     through-the-lens loupes have the telescopes set into the carrier lenses, angled down and toward each other. Settled:
     two short flared barrels low and nasal in the lenses, a browline frame, a headlight at the bridge.
   - The antiques are period pieces, schematic: a plaster cast on a brass hinge ("barn door") articulator on a wooden
     base, the kind used through the 1800s; and brass telescopic pince-nez with a spring bridge, as binocular loupes
     looked around 1900.

   A shape: { name, modern(p, rich), mask(), antique(p, rich), antiqueMask(), defs(p, t, cyl), top(p, rich, old), box,
   place, rim, sparks, shadow }. p is the id prefix of the medallion's gradients (p + "g" the metal, "gd" its shade, "brass", "iron" and
   "wood" for the antique); rich is true from 40px up. No ids of its own except through defs(). */
export function journeyKit(){
  "use strict";
  var JOURNEYS = [
    { k: "handpiece", n: "Handpiece", at: 0 },
    { k: "modupro", n: "ModuPro", at: 125000 },
    { k: "loupes", n: "Loupes", at: 250000 }
  ];
  /* a part: [element without its brackets, fill key, transform]. Fill keys: F the metal, D its shade, B brass, I iron,
     W wood, P plaster, or a color. mask() is the same parts without their fills (a clipPath can't hold a <g>). */
  function fillOf(k, p){
    return k === "F" ? "url(#" + p + "g)" : k === "D" ? "url(#" + p + "gd)" : k === "B" ? "url(#" + p + "brass)" : k === "I" ? "url(#" + p + "iron)" :
      k === "W" ? "url(#" + p + "wood)" : k === "P" ? "url(#" + p + "pl)" : k;
  }
  function draw(parts, p){
    return parts.map(function(e){ return "<" + e[0] + (e[2] ? ' transform="' + e[2] + '"' : "") + ' fill="' + fillOf(e[1], p) + '"' + (e[3] || "") + "/>"; }).join("");
  }
  function maskOf(parts){
    return parts.filter(function(e){ return !e[4]; }).map(function(e){ return "<" + e[0] + (e[2] ? ' transform="' + e[2] + '"' : "") + (/clip-rule/.test(e[3] || "") ? ' clip-rule="evenodd"' : "") + "/>"; }).join("");
  }
  function path(d){ return 'path d="' + d + '"'; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function mirror(d, w){
    /* a path of absolute M, L, C, H and V commands and Z, flipped left to right in a box w wide */
    return d.replace(/([MLCH])([^MLCHVZ]*)/g, function(m, c, nums){
      var v = nums.trim().split(/[\s,]+/).map(Number);
      if (c === "H") return "H" + (w - v[0]);
      for (var i = 0; i < v.length; i += 2) v[i] = Math.round((w - v[i]) * 10) / 10;
      return c + v.join(" ");
    });
  }

  /* ================= the ModuPro: a typodont from the side, facing left, the lower jaw open on its hinge ================= */
  /* one crown: from its neck line n, len long, pointing down (d = 1, an upper) or up (d = -1, a lower) */
  function tooth(kind, x0, x1, n, len, d){
    var xm = (x0 + x1) / 2, y = function(k){ return r1(n + d * k); };
    if (kind === "i") return "M" + x0 + " " + n + " L" + x1 + " " + n + " L" + r1(x1 - .2) + " " + y(len - 3.4) + " C" + r1(x1 - .5) + " " + y(len + .4) + " " + r1(x0 + .5) + " " + y(len + .4) + " " + r1(x0 + .2) + " " + y(len - 3.4) + " Z";
    if (kind === "c") return "M" + x0 + " " + n + " L" + x1 + " " + n + " L" + r1(x1 - .2) + " " + y(len * .56) + " L" + r1(xm) + " " + y(len) + " L" + r1(x0 + .2) + " " + y(len * .56) + " Z";
    if (kind === "p") return "M" + x0 + " " + n + " L" + x1 + " " + n + " L" + x1 + " " + y(len - 4.2) + " C" + x1 + " " + y(len + 1.2) + " " + x0 + " " + y(len + 1.2) + " " + x0 + " " + y(len - 4.2) + " Z";
    return "M" + x0 + " " + n + " L" + x1 + " " + n + " L" + x1 + " " + y(len - 3.4) + " C" + x1 + " " + y(len + 1) + " " + r1(xm + 2) + " " + y(len + .8) + " " + r1(xm) + " " + y(len - 2.6) +
      " C" + r1(xm - 2) + " " + y(len + .8) + " " + x0 + " " + y(len + 1) + " " + x0 + " " + y(len - 3.4) + " Z";
  }
  /* a quadrant of the 32: two incisors, a canine, two premolars, three molars, front (left) to back */
  function quadrant(x, n, d, widths, lens){
    var kinds = ["i", "i", "c", "p", "p", "m", "m", "m"], out = [];
    widths.forEach(function(w, i){ out.push(tooth(kinds[i], r1(x), r1(x + w), n, lens[i], d)); x += w + 1; });
    return out;
  }
  var UPPER_TEETH = quadrant(8, 21.6, 1, [7.2, 6.4, 8, 8, 8, 11.4, 10.4, 8], [15.4, 13.6, 16.4, 12.6, 12.6, 12.2, 11.6, 10]);
  var LOWER_TEETH = quadrant(11.4, 56.4, -1, [5.6, 6, 7.6, 8, 8, 11.4, 10.4, 8], [12.2, 12.2, 14.8, 12, 12, 11.6, 11, 9.6]);
  var UPPER_GUM = "M7 10 H83 V20.4 C70 22.6 28 22.6 12 23.6 C7.6 21 6 15.6 7 10 Z";
  var LOWER_GUM = "M10.6 55.4 C26 56.6 70 56.6 83 55.8 V67.4 H11.6 C8 64 8 59.4 10.6 55.4 Z";
  var OPEN = "rotate(-9 87 45)";
  var MODU = [].concat(
    [['rect x="82.4" y="4" width="9.2" height="46" rx="3.6"', "D"],                   // the articulator's post
     ['rect x="82.4" y="39" width="9.2" height="34.6" rx="3.6"', "D", OPEN],          // and the lower member's arm
     ['rect x="34" y="-3" width="17" height="9" rx="2.6"', "D"],                      // the stud that locks into the carrier tray
     ['rect x="4" y="3.6" width="84" height="7" rx="3"', "F"],                        // the upper plate
     [path(UPPER_GUM), "D"]],                                                         // the maxillary soft-gum base
    UPPER_TEETH.map(function(d){ return [path(d), "F"]; }),
    [[path(LOWER_GUM), "D", OPEN],                                                    // the mandibular soft-gum base
     ['rect x="7" y="66.8" width="81" height="7" rx="3"', "F", OPEN]],                // the lower plate
    LOWER_TEETH.map(function(d){ return [path(d), "F", OPEN]; }),
    [['rect x="92.6" y="41.4" width="9.6" height="7.2" rx="2.2"', "D"],               // the hinge's thumbscrew
     ['circle cx="87" cy="45" r="7.8"', "F"]]                                         // the hinge
  );
  function moduModern(p, rich){
    var s = draw(MODU, p);
    s += '<circle cx="87" cy="45" r="3.1" fill="url(#' + p + 'gd)"/>';
    if (rich) {
      /* two screws in each plate, the thumbscrew's knurling */
      s += '<circle cx="13" cy="7.1" r="1.4" fill="rgba(0,0,0,.32)"/><circle cx="74" cy="7.1" r="1.4" fill="rgba(0,0,0,.32)"/>' +
        '<g transform="' + OPEN + '"><circle cx="16" cy="70.3" r="1.4" fill="rgba(0,0,0,.32)"/><circle cx="74" cy="70.3" r="1.4" fill="rgba(0,0,0,.32)"/></g>' +
        '<path d="M94.8 43 V47 M97.4 43 V47 M100 43 V47" stroke="rgba(0,0,0,.3)" stroke-width=".8"/>';
    }
    return s;
  }
  /* its antique: plaster casts on a brass hinge articulator, on a wooden base; here the upper member swings up */
  var LIFT = "rotate(8 88 44)";
  var MODU_OLD = [].concat(
    [['rect x="2" y="77" width="98" height="9" rx="2"', "W"],                         // the base board
     ['rect x="96.4" y="16" width="3.2" height="62" rx="1.6"', "I"],                  // the set screw at the back
     [path("M91 13.4 L98 16.6 L105 13.4 L105 18.8 L98 20.8 L91 18.8 Z"), "I"],        // and its wing nut
     ['rect x="84.4" y="41" width="7.2" height="36" rx="2"', "B"],                    // the hinge's lower leaf
     ['rect x="8" y="71" width="83" height="6" rx="1.6"', "B"],                       // the lower strap
     [path("M10.6 55.4 C26 56.6 70 56.6 83 55.8 V71.2 H10.6 Z"), "P"]],               // the lower cast
    LOWER_TEETH.map(function(d){ return [path(d), "P"]; }),
    [['rect x="84.4" y="3" width="7.2" height="43" rx="2"', "B", LIFT],               // the upper leaf
     ['rect x="8" y="3" width="83" height="6" rx="1.6"', "B", LIFT],                  // the upper strap
     [path("M8 8.8 H83 V20.4 C70 22.6 28 22.6 12 23.6 C9 21.6 8 15 8 8.8 Z"), "P", LIFT]],   // the upper cast
    UPPER_TEETH.map(function(d){ return [path(d), "P", LIFT]; }),
    [['circle cx="88" cy="44" r="7.4"', "B"]]                                         // the knuckle
  );
  function moduAntique(p, rich){
    var s = draw(MODU_OLD, p);
    s += '<circle cx="88" cy="44" r="2.8" fill="url(#' + p + 'iron)"/>';
    if (rich) {
      s += '<circle cx="16" cy="74" r="1.3" fill="rgba(0,0,0,.4)"/><circle cx="72" cy="74" r="1.3" fill="rgba(0,0,0,.4)"/>' +
        '<g transform="' + LIFT + '"><circle cx="16" cy="6" r="1.3" fill="rgba(0,0,0,.4)"/><circle cx="72" cy="6" r="1.3" fill="rgba(0,0,0,.4)"/></g>' +
        '<path d="M8 81.5 H94" stroke="rgba(40,20,5,.4)" stroke-width=".8"/>';
    }
    return s;
  }

  /* ================= the loupes: through-the-lens loupes from the front and a little above ================= */
  var GLASS = "rgba(9,15,24,.36)", OPTIC = "#0B1119";
  var L_TEMPLE = "M10 10 L2 12.4 L-0.6 32 C-0.8 34.6 3.6 35 4 32.4 L6.8 19 L10 17.6 Z";
  var L_LENS = "M13 14 L55.5 14 C57.5 31 52.5 48.5 39 51 C24.5 53 13.5 42 13 14 Z";
  var L_HULL = "M22.8 29 L23.4 41 L50.6 41.6 L43.2 27 Z";
  /* a part's 4th entry is extra attributes (a function of p when it needs the metal); a 5th leaves it out of the mask,
     so the glass stays glass under the diamond's facets and the Dark Matter stars */
  var LOUPE = [
    [path(L_TEMPLE), "D"], [path(mirror(L_TEMPLE, 120)), "D"],
    [path(L_LENS), GLASS, "", "RIM", 1], [path(mirror(L_LENS, 120)), GLASS, "", "RIM", 1],
    ['ellipse cx="53.6" cy="36" rx="2.6" ry="4.6"', "D", "rotate(-18 53.6 36)"], ['ellipse cx="66.4" cy="36" rx="2.6" ry="4.6"', "D", "rotate(18 66.4 36)"],   // nose pads
    [path("M8 9 C28 4.6 50 5.8 60 9.6 C70 5.8 92 4.6 112 9 L112 17.6 C92 13.4 70 14.2 60 18.4 C50 14.2 28 13.4 8 17.6 Z"), "F"],                         // the browline
    ['rect x="58.2" y="5" width="3.6" height="6.5" rx="1"', "D"], ['rect x="53" y="-4.4" width="14" height="10.6" rx="3.4"', "D"],                            // the headlight
    ['circle cx="33" cy="28" r="10.6"', "D"], [path(L_HULL), "D"], ['circle cx="37" cy="38.5" r="14"', "F"],                                                  // the left telescope
    ['circle cx="87" cy="28" r="10.6"', "D"], [path(mirror(L_HULL, 120)), "D"], ['circle cx="83" cy="38.5" r="14"', "F"]                                      // the right
  ];
  function drawL(parts, p){
    return draw(parts.map(function(e){ return e[3] === "RIM" ? [e[0], e[1], e[2], ' stroke="url(#' + p + 'g)" stroke-width="3"'] : e; }), p);
  }
  function optic(cx, cy, r, ringFill, rich){
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1(r + 1.8) + '" fill="' + ringFill + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + OPTIC + '" opacity=".93"/>' +
      '<path d="M' + r1(cx - r * .68) + " " + r1(cy - r * .3) + " A" + r1(r * .78) + " " + r1(r * .78) + " 0 0 1 " + r1(cx - r * .1) + " " + r1(cy - r * .76) + '" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>' +
      (rich ? '<circle cx="' + r1(cx + r * .34) + '" cy="' + r1(cy + r * .38) + '" r="' + r1(r * .14) + '" fill="#fff" opacity=".42"/>' : "");
  }
  function loupeModern(p, rich){
    var s = drawL(LOUPE, p);
    if (rich) s += '<path d="M24 33.4 A14 14 0 0 1 28.6 27.4 M96 33.4 A14 14 0 0 0 91.4 27.4" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1"/>' +
      '<circle cx="12" cy="13" r="1.2" fill="rgba(0,0,0,.35)"/><circle cx="108" cy="13" r="1.2" fill="rgba(0,0,0,.35)"/>';
    return s;
  }
  /* what stays on top of the facets, stars and glints: the telescopes' glass and the lamp */
  function loupeTop(p, rich, old){
    if (old) return optic(35, 37.6, 7.6, "url(#" + p + "iron)", rich) + optic(85, 37.6, 7.6, "url(#" + p + "iron)", rich);
    return optic(37, 38.5, 9.8, "url(#" + p + "gd)", rich) + optic(83, 38.5, 9.8, "url(#" + p + "gd)", rich) + '<circle cx="60" cy="1" r="3.4" fill="#FFF3C4" opacity=".94"/>';
  }
  /* their antique: brass telescopic pince-nez, a spring bridge, riding-bow temples of wire */
  var O_TEMPLE = "M16.4 21.4 C7 18 0.4 21.6 -0.4 30.4 C-1 37.4 4.2 42 8.2 39.6 C5 38.4 3.6 34.6 4 31 C4.6 25.6 9.2 24.4 15.4 26.2 Z";
  var O_HULL = "M23.4 30 L23.8 39 L46.4 39.4 L40.6 28 Z";
  function ring(cx, cy, ro, ri){
    return "M" + r1(cx - ro) + " " + cy + " a" + ro + " " + ro + " 0 1 0 " + (2 * ro) + " 0 a" + ro + " " + ro + " 0 1 0 " + (-2 * ro) + " 0 Z M" + r1(cx - ri) + " " + cy + " a" + ri + " " + ri + " 0 1 1 " + (2 * ri) + " 0 a" + ri + " " + ri + " 0 1 1 " + (-2 * ri) + " 0 Z";
  }
  var LOUPE_OLD = [
    [path(O_TEMPLE), "I"], [path(mirror(O_TEMPLE, 120)), "I"],
    ['circle cx="32" cy="30" r="13.2"', "rgba(30,20,8,.3)", "", "", 1], ['circle cx="88" cy="30" r="13.2"', "rgba(30,20,8,.3)", "", "", 1],
    [path(ring(32, 30, 17.6, 12.8)), "B", "", ' fill-rule="evenodd" clip-rule="evenodd"'], [path(ring(88, 30, 17.6, 12.8)), "B", "", ' fill-rule="evenodd" clip-rule="evenodd"'],
    [path("M45.6 24.6 C50.6 9.6 69.4 9.6 74.4 24.6 L70.4 26.2 C66.6 14.6 53.4 14.6 49.6 26.2 Z"), "I"],                            // the spring bridge
    ['ellipse cx="50.4" cy="34" rx="2.5" ry="4.2"', "W", "rotate(-16 50.4 34)"], ['ellipse cx="69.6" cy="34" rx="2.5" ry="4.2"', "W", "rotate(16 69.6 34)"],
    ['circle cx="32" cy="29" r="9"', "B"], [path(O_HULL), "B"], ['circle cx="35" cy="37.6" r="11.8"', "B"],
    ['circle cx="88" cy="29" r="9"', "B"], [path(mirror(O_HULL, 120)), "B"], ['circle cx="85" cy="37.6" r="11.8"', "B"]
  ];
  function loupeAntique(p, rich){
    var s = draw(LOUPE_OLD, p);
    if (rich) s += '<path d="M105.4 33 C112 40 114.6 49 110.4 57" stroke="#5a4630" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<circle cx="46.8" cy="25.6" r="1.3" fill="rgba(0,0,0,.45)"/><circle cx="73.2" cy="25.6" r="1.3" fill="rgba(0,0,0,.45)"/>';
    return s;
  }

  var PLASTER = ["#4E4436", "#857660", "#B9A98C", "#DCCFB4", "#A8977C", "#766751", "#463C2F", "#948369"];
  var SHAPES = [null, {
    name: "ModuPro", modern: moduModern, mask: function(){ return maskOf(MODU); }, antique: moduAntique, antiqueMask: function(){ return maskOf(MODU_OLD); },
    defs: function(p, t, cyl){ return t === "antique" ? cyl(p + "pl", PLASTER) : ""; },
    box: [-2, -10, 112, 102], place: ["translate(64 60) scale(.84) translate(-53 -42)", "translate(64 61) scale(.8) translate(-53 -40)"],
    rim: "M9 4.8 H84", sparks: [[16, -2, 4.6], [98, 62, 3.6], [48, 46, 3.2]], shadow: [50, 88, 44, 4.4]
  }, {
    name: "loupes", modern: loupeModern, mask: function(){ return maskOf(LOUPE); }, antique: loupeAntique, antiqueMask: function(){ return maskOf(LOUPE_OLD); },
    top: loupeTop,
    box: [-6, -10, 132, 70], place: ["translate(64 62) rotate(-8) scale(.8) translate(-60 -25)", "translate(64 61) rotate(-8) scale(.8) translate(-60 -31)"],
    rim: "M13 8.2 C30 4.8 48 5.6 58 8.8", sparks: [[16, 0, 4.6], [106, 48, 3.6], [60, 30, 3]], shadow: [60, 57, 52, 4]
  }];

  /* a journey's trophy (the server's journey-0, journey-1, journey-2), drawn in medals.mjs */
  var TROPHIES = [
    { k: "journey-0", n: "Handpiece finished", d: "Reach 125,000 XP: Dark Matter III on the Handpiece." },
    { k: "journey-1", n: "ModuPro finished", d: "Reach 250,000 XP: Dark Matter III on the ModuPro." },
    { k: "journey-2", n: "Loupes finished", d: "Reach 375,000 XP: Dark Matter III on the Loupes." }
  ];
  var HAND = [0, 300, 1500, 5000, 12000, 25000, 50000];
  return {
    JOURNEYS: JOURNEYS, TROPHIES: TROPHIES,
    /* the XP a journey's tier starts at, as the server's sh_rank has it (migration_v54): the Handpiece's own floors,
       then seven even tiers in each 125,000 */
    floor: function(j, t){ return j ? Math.floor(125000 * j + t * 125000 / 7) : HAND[t]; },
    /* the shape shRanks.art draws for a journey (null for the Handpiece, which ranks.js draws itself) */
    shape: function(j){ return SHAPES[j] || null; }
  };
}
