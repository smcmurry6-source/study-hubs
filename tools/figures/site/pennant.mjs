/* The weekly pennants (the weekly class challenge, idea board #6; migration_v98.sql): answer 50 questions from Monday to
   Sunday (Central time) and Timmy gets that week's pennant. A new one every week, so they collect, and the look of each
   comes from its week's Monday alone (the server keeps only the Monday):
     - the felt's color and the badge on it are the month's (MONTHS: January's snowflake to December's pine);
     - the stars toward the tip count which Monday of the month it is (the 1st to the 5th);
     - the sleeve at the hoist is the school year's color (August to July), four in turn, one for each year of dental
       school: gold (2026-27, the first year of pennants), silver, rose, mint.
   So no two weeks of a school year share a pennant, a month's four or five make a set, and the dates people read are
   written beside the drawing by the page, never in it.

   pennantKit(INK, C) returns:
     design(monday)      { k, month 1-12, nth 1-5, year (the school year's first year), name, badge, felt, sleeve } or null
     flag(monday)        the flag alone as markup: its hoist on x 0 from y 0 to 36, flying right to its tip at 60 18
                         (Timmy's place hangs it on the pole by the path, widget/place.js through the place kit)
     svg(monday, px, o)  a standalone <svg> of the pennant on a short dowel with a gold knob (the Pennants view, Home's
                         Today, the dashboard's "you" card); o.dim draws it as a faded outline (a week still to earn)
   build.mjs pastes this function into widget/hub-art.js (window.SH_PENNANT), so it comes with both pages' bundles and
   costs no request, after drawing every Monday of four school years and checking each.
   Drawn in Timmy's ink (style.mjs): flat fills, ink outlines, no ids, gradients, filters, <text> or <style>. Nothing
   sugary on any of them (an apple is fine: it's September's).                                                       */
export function pennantKit(INK, C){
  "use strict";
  var SW = 1.6, SI = 1;
  function f(n){ return Math.round(n * 10) / 10; }
  function P(d, fill, sw){ return '<path d="' + d + '" fill="' + (fill || "none") + '" stroke="' + INK + '" stroke-width="' + (sw || SW) + '" stroke-linejoin="round" stroke-linecap="round"/>'; }
  function F(d, fill, op){ return '<path d="' + d + '" fill="' + fill + '"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function L(d, sw, col, op){ return '<path d="' + d + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (sw || SI) + '" stroke-linecap="round" stroke-linejoin="round"' + (op != null ? ' opacity="' + op + '"' : "") + "/>"; }
  function circ(x, y, r, fill, sw){ return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : "") + "/>"; }
  var WHITE = C.enamel, HIW = "#FFFFFF";

  /* ---- the twelve months: the felt and the badge (drawn round 0 0, about 13 across, cream on the felt unless noted) ---- */
  function snowflake(){
    var s = "", d = "", i;
    for (i = 0; i < 6; i++){
      var a = i * Math.PI / 3, c = Math.cos(a), sn = Math.sin(a), x = c * 6.2, y = sn * 6.2, bx = c * 3.6, by = sn * 3.6;
      d += "M0 0 L" + f(x) + " " + f(y) + " M" + f(bx) + " " + f(by) + " L" + f(bx + Math.cos(a + .9) * 2.2) + " " + f(by + Math.sin(a + .9) * 2.2) +
        " M" + f(bx) + " " + f(by) + " L" + f(bx + Math.cos(a - .9) * 2.2) + " " + f(by + Math.sin(a - .9) * 2.2);
    }
    s += L(d, 3.2) + L(d, 1.5, WHITE) + circ(0, 0, 1.4, WHITE, .8);
    return s;
  }
  function tooth(){
    var d = "M-5.4 -2.6C-6 -6.6 -3.8 -7.6 -2 -6.8C-.9 -6.3 .9 -6.3 2 -6.8C3.8 -7.6 6 -6.6 5.4 -2.6C5.1 0 4.3 2.2 3.5 5.6C3 7.6 1.6 8 1.1 5.9L.5 3C.2 2.3 -.2 2.3 -.5 3L-1.1 5.9C-1.6 8 -3 7.6 -3.5 5.6C-4.3 2.2 -5.1 0 -5.4 -2.6Z";
    return P(d, WHITE, 1.3) + L("M-3.4 -4.8C-3 -5.8 -2 -6.1 -1.2 -5.8", 1, HIW, .9) + circ(-1.9, -1.4, .7, INK) + circ(1.9, -1.4, .7, INK) + L("M-1.3 .6 Q0 1.6 1.3 .6", .9);
  }
  function clover(){
    var leaf = function(a){ var x = Math.cos(a) * 3.1, y = Math.sin(a) * 3.1 - 1.4; return circ(x, y, 3, WHITE, 1.2); };
    return L("M0 1 Q.6 4.6 2.6 6.8", 2.6) + L("M0 1 Q.6 4.6 2.6 6.8", 1.2, WHITE) + leaf(-Math.PI / 2) + leaf(Math.PI / 6) + leaf(5 * Math.PI / 6) + circ(0, -1.2, 1.3, WHITE);
  }
  function raindrop(){
    return P("M0 -7C2.6 -3.4 5 -.6 5 2.4C5 5.4 2.8 7.2 0 7.2C-2.8 7.2 -5 5.4 -5 2.4C-5 -.6 -2.6 -3.4 0 -7Z", WHITE, 1.3) + L("M-2.6 2.2C-2.6 3.8 -1.6 4.8 -.4 5", 1.1, "#8FD3F5");
  }
  function daisy(){
    var s = "", i; for (i = 0; i < 8; i++){ var a = i * Math.PI / 4, x = Math.cos(a) * 4.3, y = Math.sin(a) * 4.3; s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="2.6" ry="1.6" transform="rotate(' + f(a * 180 / Math.PI) + " " + f(x) + " " + f(y) + ')" fill="' + WHITE + '" stroke="' + INK + '" stroke-width="1"/>'; }
    return s + circ(0, 0, 2.4, C.yellow, 1.1);
  }
  function sun(){
    var d = "", i; for (i = 0; i < 8; i++){ var a = i * Math.PI / 4 + Math.PI / 8; d += "M" + f(Math.cos(a) * 4.6) + " " + f(Math.sin(a) * 4.6) + " L" + f(Math.cos(a) * 7) + " " + f(Math.sin(a) * 7) + " "; }
    return L(d, 3) + L(d, 1.4, C.yellow) + circ(0, 0, 3.8, C.yellow, 1.3) + L("M-2 -1.6 A2.6 2.6 0 0 1 -.4 -2.6", 1, HIW, .9);
  }
  function burst(){
    var d = "", s = "", i; for (i = 0; i < 8; i++){ var a = i * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a); d += "M" + f(c * 1.8) + " " + f(sn * 1.8) + " L" + f(c * 5.2) + " " + f(sn * 5.2) + " "; s += circ(c * 6.6, sn * 6.6, 1.05, i % 2 ? C.yellow : WHITE, .7); }
    return L(d, 2.8) + L(d, 1.3, WHITE) + s + circ(0, 0, 1.5, C.yellow, .8);
  }
  function pencil(){
    return '<g transform="rotate(-40)">' + P("M-7 -2.2 H3.4 L7.6 0 L3.4 2.2 H-7 Z", C.yellow, 1.2) + P("M3.4 -2.2 L7.6 0 L3.4 2.2 Z", "#F2D8B2", 1) +
      F("M6.4 -.6 L7.6 0 L6.4 .6 Z", INK) + P("M-7 -2.2 H-9.2 Q-10 0 -9.2 2.2 H-7 Z", C.gumLight, 1) + L("M-7 0 H2.6", .8, "#C9971C") + "</g>";
  }
  function apple(){
    return P("M0 -3.2C-2.2 -5.2 -6 -4.4 -6 -.4C-6 3.6 -3.4 7 -1.4 6.6C-.6 6.4 .6 6.4 1.4 6.6C3.4 7 6 3.6 6 -.4C6 -4.4 2.2 -5.2 0 -3.2Z", C.red, 1.3) +
      L("M0 -3.2 Q.2 -5.4 1.4 -6.6", 1.3) + P("M.9 -4.6C1.8 -6.4 4 -6.8 4.8 -6.2C4 -4.6 2.2 -4 .9 -4.6Z", C.green, 1) + L("M-3.8 -1.6 Q-3.4 -3 -2.2 -3.2", 1.1, HIW, .85);
  }
  function moon(){
    return P("M2.6 -6.6C-1.6 -6.6 -5.4 -3.4 -5.4 .6C-5.4 4.6 -2.2 7.2 1.6 7.2C3.6 7.2 5.2 6.4 6.2 5.2C2 5.6 -1 2.6 -1 -.6C-1 -3.4 .6 -5.6 2.6 -6.6Z", "#FFF3C4", 1.3) +
      '<path d="M5 -4.6 L5.5 -3.2 L6.9 -2.7 L5.5 -2.2 L5 -.8 L4.5 -2.2 L3.1 -2.7 L4.5 -3.2 Z" fill="' + WHITE + '" stroke="' + INK + '" stroke-width=".7"/>';
  }
  function leaf(){
    return P("M-6 5.6C-6.4 -.6 -2.4 -5.8 5.8 -6.4C6.4 1.8 1.6 6.4 -6 5.6Z", C.gold, 1.3) + L("M-6 5.6 L3.2 -3.6 M-2.4 2 L-2.6 -1.6 M-.2 -.2 L2.4 .2", 1) + L("M-7.6 7.2 L-5.4 5", 1.4);
  }
  function pine(){
    return P("M0 -7.4 L4 -2.6 H2 L5.2 1.4 H2.6 L6 5.4 H-6 L-2.6 1.4 H-5.2 L-2 -2.6 H-4 Z", "#4FAE6A", 1.2) + P("M-1.2 5.4 H1.2 V7.6 H-1.2 Z", C.wood, 1) +
      L("M-2.6 -2.2 L1.2 -3 M-3.6 1.8 L2.4 .8", 1.1, WHITE) + '<path d="M0 -9.6 L.5 -8.4 L1.7 -8.2 L.8 -7.4 L1 -6.2 L0 -6.8 L-1 -6.2 L-.8 -7.4 L-1.7 -8.2 L-.5 -8.4 Z" fill="' + C.yellow + '" stroke="' + INK + '" stroke-width=".7"/>';
  }
  var MONTHS = [
    { name: "January",   badge: "a snowflake",    felt: "#5B8DEF", shade: "#3F6CC8", draw: snowflake },
    { name: "February",  badge: "a tooth",        felt: "#E26A9A", shade: "#B84874", draw: tooth },     // Children's Dental Health Month
    { name: "March",     badge: "a clover",       felt: "#2FA866", shade: "#1F7F4A", draw: clover },
    { name: "April",     badge: "a raindrop",     felt: "#3FA7E0", shade: "#2A82B8", draw: raindrop },
    { name: "May",       badge: "a daisy",        felt: "#9B7BE0", shade: "#7458BC", draw: daisy },
    { name: "June",      badge: "the sun",        felt: "#F2A93B", shade: "#C9821C", draw: sun },
    { name: "July",      badge: "a firework",     felt: "#E5484D", shade: "#B8323A", draw: burst },
    { name: "August",    badge: "a pencil",       felt: "#2FA8A8", shade: "#1F7F80", draw: pencil },    // the school year starts
    { name: "September", badge: "an apple",       felt: "#7A9A2E", shade: "#5A7620", draw: apple },
    { name: "October",   badge: "a crescent moon", felt: "#E8833D", shade: "#C0612A", draw: moon },
    { name: "November",  badge: "an oak leaf",    felt: "#9A6A3A", shade: "#74502A", draw: leaf },
    { name: "December",  badge: "a pine",         felt: "#2E4A7D", shade: "#20365E", draw: pine }
  ];
  /* the sleeve, by school year (August to July): the first year of each class's four is gold, then silver, rose, mint */
  var SLEEVES = [["#F2C94C", "#C9971C"], ["#D9DFE5", "#8E98A3"], ["#F7A3BA", "#D9758F"], ["#A7DE93", "#6CBB68"]];

  /* a Monday's design. The date is a Monday's YYYY-MM-DD (any other day still draws: its own day of the month says the nth) */
  function design(monday){
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(monday || "")); if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var M = MONTHS[mo - 1], school = mo >= 8 ? y : y - 1, sl = SLEEVES[(((school - 2026) % 4) + 4) % 4];
    return { k: m[1] + "-" + m[2] + "-" + m[3], month: mo, nth: Math.min(5, Math.ceil(d / 7)), year: school, name: M.name, badge: M.badge,
      felt: M.felt, shade: M.shade, sleeve: sl[0], sleeveShade: sl[1] };
  }
  function star(x, y, r, fill){
    var d = "", i; for (i = 0; i < 10; i++){ var a = Math.PI / 5 * i - Math.PI / 2, q = i % 2 ? r * .46 : r; d += (i ? " L" : "M") + f(x + q * Math.cos(a)) + " " + f(y + q * Math.sin(a)); }
    return '<path d="' + d + ' Z" fill="' + fill + '" stroke="' + INK + '" stroke-width=".75" stroke-linejoin="round"/>';
  }
  /* the felt: a long pennant with a gentle wave in it, hoist at x 0 (the sleeve, 0-7), the tip at 60 18 */
  var FELT = "M6 .8 C20 -1.4 34 8 60 18 C36 25 22 38.4 6 35.2 Z";
  var FELT_SHADE = "M6 24 C22 26 38 21.4 60 18 C36 25 22 38.4 6 35.2 Z";
  function flag(monday){
    var g = design(monday); if (!g) return "";
    var M = MONTHS[g.month - 1], s = "";
    s += F(FELT, g.felt) + F(FELT_SHADE, g.shade) + P(FELT, "none", SW);
    s += L("M9.4 4.2 C19 3 27 6.4 36 10.2", 1.4, HIW, .55);
    /* the badge, on a round patch of the felt's shade so it reads on any felt */
    s += circ(18, 17.6, 9.2, g.shade, 1.1) + '<g transform="translate(18 17.6)">' + M.draw() + "</g>";
    /* the nth Monday, as stars toward the tip */
    for (var i = 0; i < g.nth; i++) s += star(31.6 + i * 4.7, 17.4 + (i % 2 ? .4 : -.4), i === g.nth - 1 ? 2.3 : 2, i === g.nth - 1 ? C.yellow : WHITE);
    /* the sleeve round the pole, in the school year's color, and its stitches */
    s += P("M0 -.6 H7 C7.6 12 7.6 24 7 36.6 H0 C.6 24 .6 12 0 -.6 Z", g.sleeve, SW) + F("M4.2 -.6 H7 C7.6 12 7.6 24 7 36.6 H4.2 C4.8 24 4.8 12 4.2 -.6 Z", g.sleeveShade, .55) +
      L("M3.5 3 V7 M3.5 11 V15 M3.5 19 V23 M3.5 27 V31", .8, INK, .5);
    return s;
  }
  function svg(monday, px, o){
    o = o || {};
    var inner = flag(monday); if (!inner) return "";
    var pole = P("M1.4 -6 H5.6 V42 H1.4 Z", C.wood, 1.3) + F("M4 -6 H5.6 V42 H4 Z", C.woodShade, .6) + circ(3.5, -7.4, 3.2, C.gold, 1.3) + L("M2.2 -8.6 A1.8 1.8 0 0 1 3.4 -9.6", .9, HIW, .9);
    var body = '<g transform="translate(2 0)">' + inner + "</g>";
    var all = o.dim ? '<g opacity=".28">' + pole + body + "</g>" : pole + body;
    return '<svg class="shpn" viewBox="-2 -12 66 56"' + (px ? ' width="' + f(px) + '" height="' + f(px * 56 / 66) + '"' : "") +
      ' xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + all + "</svg>";
  }
  /* the Mondays from one to another, oldest first (for a page laying out a school year, and for the build's check) */
  function mondays(from, to){
    var out = [], t = Date.parse(String(from).slice(0, 10) + "T12:00:00Z"), end = Date.parse(String(to).slice(0, 10) + "T12:00:00Z");
    if (isNaN(t) || isNaN(end)) return out;
    while (new Date(t).getUTCDay() !== 1) t += 864e5;
    for (; t <= end && out.length < 400; t += 7 * 864e5) out.push(new Date(t).toISOString().slice(0, 10));
    return out;
  }
  return { design: design, flag: flag, svg: svg, mondays: mondays, MONTHS: MONTHS.map(function(m){ return { name: m.name, badge: m.badge, felt: m.felt }; }), GOAL: 50 };
}
