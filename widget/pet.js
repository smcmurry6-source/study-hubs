/* study-hubs tooth buddy: an optional cartoon tooth that lives on the dashboard (perched on your name) and in the
   bottom-left corner of every hub. Loaded by widget/v3.js (hubs) and index.html (dashboard).

   Health (0-100 HP) is worked out from your answers, one row per Central-time day across every hub
   (get_pet_days, migration_v31), merged with this device's own tally (sh_pet_log) so it updates live and offline:
     - a study day heals: 0.8 HP per right answer (up to 30 a day) plus a streak bonus of 2 per day in a row (up to 10),
       minus a little for misses
     - a day with no answers hurts, more the longer you're away: 8, 12, 16, then 20 a day
     - it can never die, but once it hits 0 it needs a "treatment plan": healing runs at half speed until it's back to 50
   What goes wrong as HP drops, in order: plaque, stains + gingivitis, a cavity, periodontitis (recession, calculus),
   a fracture, and at 0 a bandage.

   His name is Timmy Tooth. Before you meet him he perches on your name on the dashboard; once adopted he lives in his
   own little home card there (index.html #petHome) and in the bottom-left corner of every hub.

   Settings: sh_pref_pet = "on" (default) | "dash" (dashboard only) | "off".  sh_pet_born = the day you adopted him.
   Neither Timmy nor his HP is ever shown to anyone else.

   shPet.mount({ where: "dashboard", sb, visitor, name: fn, perch: fn })   // dashboard
   shPet.mount({ where: "hub", H: window.shEggHooks })                      // hubs (v3.js does this)
   shPet.refresh()                                                          // after a setting changes
   shPet.art(state, px)                                                     // just the drawing */
(function(){
  "use strict";
  if (window.shPet) return;

  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* days roll over on Central time, the same as the server */
  function centralDay(d){
    var f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" });
    var p = {}; f.formatToParts(d || new Date()).forEach(function(x){ p[x.type] = x.value; });
    return p.year + "-" + p.month + "-" + p.day;
  }
  function addDays(day, n){ var p = day.split("-"), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)); return d.toISOString().slice(0, 10); }
  function dayDiff(a, b){ var pa = a.split("-"), pb = b.split("-"); return Math.round((Date.UTC(+pb[0], +pb[1] - 1, +pb[2]) - Date.UTC(+pa[0], +pa[1] - 1, +pa[2])) / 864e5); }

  /* ================= holiday hats (dates kept in step with HOLIDAYS in widget/eggs.js) ================= */
  function holidayId(){
    if (window.shHoliday && window.shHoliday.id) return window.shHoliday.id;
    var forced = ls("sh_egg_holiday_test"); if (forced) return forced;
    var p = centralDay().split("-"), y = +p[0], m = +p[1], d = +p[2], x = m * 100 + d;
    function nthThu(y){ var f = new Date(y, 10, 1), first = 1 + ((4 - f.getDay() + 7) % 7); return new Date(y, 10, first + 21); }
    function easter(y){ var a = y % 19, b = Math.floor(y / 100), c = y % 100, dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - dd - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, mm = Math.floor((a + 11 * h + 22 * l) / 451);
      return new Date(y, Math.floor((h + l - 7 * mm + 114) / 31) - 1, ((h + l - 7 * mm + 114) % 31) + 1); }
    var today = new Date(y, m - 1, d).getTime();
    function near(at, b, a){ var t = at.getTime(); return today >= t - b * 864e5 && today <= t + a * 864e5; }
    if (x >= 1024 && x <= 1031) return "halloween";
    if (near(nthThu(y), 6, 1)) return "thanksgiving";
    if (x >= 1210 && x <= 1230) return "winter";
    if (x === 1231 || x <= 102) return "newyear";
    if (x >= 210 && x <= 214) return "valentine";
    if (x === 306) return "dentist";
    if (x >= 314 && x <= 317) return "stpatrick";
    if (near(easter(y), 6, 1)) return "easter";
    return "";
  }

  /* ================= the art =================
     One cartoon molar in a 200 x 260 frame (y from -30 so hats fit): stubby arms, a gum "cushion" it sits in, and
     every problem drawn on top. state = { hp, mood: "happy"|"ok"|"sad"|"sick"|"sleep", hat: holiday id }        */
  var OUT = "#3B2E3A";
  var TOOTH = "M48 86 C42 56 56 34 78 34 C90 34 94 44 100 44 C106 44 110 34 122 34 C144 34 158 56 152 86 " +
    "C149 106 146 122 144 140 C142 166 138 192 130 210 C126 218 116 218 114 208 C111 190 108 172 100 168 " +
    "C92 172 89 190 86 208 C84 218 74 218 70 210 C62 192 58 166 56 140 C54 122 51 106 48 86 Z";
  /* the gum: a soft mound whose papillae rise up both sides of the tooth and whose margin scallops across its face.
     B = where the mound's base sits (fixed), T = the gingival margin (drops when it recedes) */
  function gumPath(T){
    var B = 226, k = function(n){ return (T + n).toFixed(1); };
    return "M12 " + (B - 24) + " C10 " + (B - 58) + " 28 " + k(-4) + " 48 " + k(-13) +
      " C56 " + k(-17) + " 63 " + k(-9) + " 66 " + k(0) +
      " C77 " + k(10) + " 89 " + k(13) + " 100 " + k(13) + " C111 " + k(13) + " 123 " + k(10) + " 134 " + k(0) +
      " C137 " + k(-9) + " 144 " + k(-17) + " 152 " + k(-13) +
      " C172 " + k(-4) + " 190 " + (B - 58) + " 188 " + (B - 24) +
      " C187 " + (B - 6) + " 160 " + B + " 100 " + B + " C40 " + B + " 13 " + (B - 6) + " 12 " + (B - 24) + " Z";
  }
  /* what's wrong at a given HP, worst last */
  function conditions(hp){
    var c = [];
    if (hp >= 90) c.push("sparkle");
    if (hp < 70) c.push("plaque");
    if (hp < 55) { c.push("stain"); c.push("gingivitis"); }
    if (hp < 40) c.push("caries");
    if (hp < 25) c.push("perio");
    if (hp < 12) c.push("fracture");
    if (hp <= 0) c.push("zero");
    return c;
  }
  function moodFor(hp){ return hp >= 70 ? "happy" : hp >= 40 ? "ok" : hp >= 12 ? "sad" : "sick"; }
  var CONDITION_INFO = {
    plaque: ["Plaque", "A soft yellow film along my gumline. Right answers brush it off."],
    stain: ["Stains", "Brown extrinsic stains. A couple of good study days polish them away."],
    gingivitis: ["Gingivitis", "Puffy, red gums that bleed a little. Still reversible!"],
    caries: ["Caries", "An actual cavity. Keep a streak going and we'll get it restored."],
    perio: ["Periodontitis", "Recession, calculus on my roots, and I'm a bit loose. Please study."],
    fracture: ["Fracture", "I cracked a cusp. I need a real treatment plan."],
    zero: ["Needs treatment", "0 HP. I can't die, but I heal at half speed until I'm back to 50."]
  };

  var uid = 0;
  function art(state, px){
    state = state || {};
    var hp = state.hp == null ? 80 : state.hp, c = conditions(hp), has = {};
    c.forEach(function(k){ has[k] = 1; });
    var mood = state.mood || moodFor(hp), p = "shpt" + (++uid) + "-";
    var T = has.perio ? 176 : 146;                       // gum line: lower when it has receded
    var gumC = has.perio ? ["#F07A8E", "#D2405A", "#A82540"] : has.gingivitis ? ["#FF95A6", "#EE5A75", "#C93A56"] : ["#FFC0CD", "#F78FA8", "#E07090"];
    var d = '<defs>' +
      '<linearGradient id="' + p + 'en" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#FBF7EE"/><stop offset="1" stop-color="#E6DCC8"/></linearGradient>' +
      '<radialGradient id="' + p + 'hi" cx=".33" cy=".25" r=".45"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + p + 'de" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E6BE"/><stop offset="1" stop-color="#DDBB7E"/></linearGradient>' +
      '<linearGradient id="' + p + 'gum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + gumC[0] + '"/><stop offset=".45" stop-color="' + gumC[1] + '"/><stop offset="1" stop-color="' + gumC[2] + '"/></linearGradient>' +
      '<radialGradient id="' + p + 'pl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E4CF5C" stop-opacity=".85"/><stop offset=".7" stop-color="#E9D97A" stop-opacity=".55"/><stop offset="1" stop-color="#EEE09A" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'st" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8A5527" stop-opacity=".55"/><stop offset="1" stop-color="#9B6634" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + p + 'ca" cx=".45" cy=".42" r=".55"><stop offset="0" stop-color="#140B06"/><stop offset=".55" stop-color="#3A2010"/><stop offset=".8" stop-color="#6E4219"/><stop offset="1" stop-color="#9A6A33" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + p + 'cl"><path d="' + TOOTH + '"/></clipPath>' +
      '<clipPath id="' + p + 'root"><path d="M0 154 C60 166 140 166 200 154 L200 260 L0 260 Z"/></clipPath>' +
      (has.fracture ? '<mask id="' + p + 'chip"><rect x="-20" y="-40" width="240" height="300" fill="#fff"/><path d="M30 30 L66 30 L62 37 L52 41 L56 50 L44 62 L30 66 Z" fill="#000"/></mask>' : '') +
      '</defs>';

    var s = '<ellipse cx="100" cy="226" rx="78" ry="7" fill="#000" opacity=".13"/>';
    /* arms first, so they tuck behind the body */
    s += '<g class="shpet-arm shpet-arm-l"><path d="M56 104 C44 101 33 106 29 115 C26 122 31 128 38 125 C43 122 48 118 56 118" fill="url(#' + p + 'en)" stroke="' + OUT + '" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/></g>';
    s += '<g class="shpet-arm shpet-arm-r"><path d="M144 104 C156 101 167 106 171 115 C174 122 169 128 162 125 C157 122 152 118 144 118" fill="url(#' + p + 'en)" stroke="' + OUT + '" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/></g>';

    /* the tooth */
    var body = '<path d="' + TOOTH + '" fill="url(#' + p + 'en)"/>';
    body += '<g clip-path="url(#' + p + 'cl)">' +
      '<path d="' + TOOTH + '" fill="url(#' + p + 'de)" clip-path="url(#' + p + 'root)"/>' +                            // roots are dentin
      '<path d="M50 155 C80 164 120 164 150 155" fill="none" stroke="#C9A86A" stroke-width="1.6" opacity=".7"/>' +          // CEJ
      '<ellipse cx="160" cy="96" rx="40" ry="70" fill="#B7A68A" opacity=".2"/>' +                                            // form shadow
      '<ellipse cx="100" cy="46" rx="14" ry="5" fill="#C9B998" opacity=".35"/>' +                                            // central fossa
      '<rect x="20" y="20" width="160" height="130" fill="url(#' + p + 'hi)"/>';
    if (has.plaque) {
      body += '<g class="shpet-plaque">' +
        '<ellipse cx="72" cy="134" rx="22" ry="11" fill="url(#' + p + 'pl)"/><ellipse cx="102" cy="138" rx="26" ry="10" fill="url(#' + p + 'pl)"/>' +
        '<ellipse cx="132" cy="133" rx="20" ry="11" fill="url(#' + p + 'pl)"/><ellipse cx="100" cy="46" rx="12" ry="6" fill="url(#' + p + 'pl)"/>' +
        '<g fill="#D9C04A" opacity=".7"><circle cx="64" cy="131" r="1.4"/><circle cx="78" cy="137" r="1.1"/><circle cx="96" cy="134" r="1.3"/><circle cx="114" cy="139" r="1"/><circle cx="128" cy="130" r="1.4"/><circle cx="138" cy="136" r="1"/></g></g>';
    }
    if (has.stain) {
      body += '<g class="shpet-stain"><ellipse cx="62" cy="70" rx="10" ry="14" fill="url(#' + p + 'st)" transform="rotate(-18 62 70)"/>' +
        '<ellipse cx="141" cy="112" rx="9" ry="13" fill="url(#' + p + 'st)" transform="rotate(14 141 112)"/>' +
        '<path d="M70 126 Q100 120 132 126" stroke="#7A4A20" stroke-width="3" fill="none" opacity=".28" stroke-linecap="round"/>' +
        '<circle cx="118" cy="62" r="2.4" fill="#7A4A20" opacity=".35"/><circle cx="84" cy="122" r="1.8" fill="#7A4A20" opacity=".35"/></g>';
    }
    if (has.caries) {
      body += '<g class="shpet-caries"><ellipse cx="128" cy="50" rx="13" ry="9" fill="url(#' + p + 'ca)"/>' +
        '<path d="M120 49 C121 44 127 42 132 44 C137 46 137 52 133 55 C128 57 121 55 120 49 Z" fill="#1A0E07" opacity=".9"/>' +
        '<path d="M123 47 C125 45.5 128 45 130 46" stroke="#5A3418" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>';
      if (has.perio) body += '<g class="shpet-caries"><ellipse cx="64" cy="118" rx="9" ry="7" fill="url(#' + p + 'ca)"/><path d="M59 117 C60 113 66 112 69 115 C71 118 68 121 64 121 C61 121 59 120 59 117 Z" fill="#1A0E07" opacity=".85"/></g>';
    }
    if (has.fracture) {
      body += '<g class="shpet-crack"><path d="M116 34 L109 50 L117 58 L105 76 L111 84 L101 100" fill="none" stroke="' + OUT + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="M118 35 L111 50 L119 58 L107 76 L113 84" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round" opacity=".9"/></g>';
    }
    body += '</g>';
    body += '<path d="' + TOOTH + '" fill="none" stroke="' + OUT + '" stroke-width="4.5" stroke-linejoin="round"/>';
    if (has.fracture) body += '<path d="M44 62 L56 50 L52 41 L62 37 L66 31" fill="none" stroke="' + OUT + '" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>';
    /* shine */
    body += '<path d="M60 60 C61 50 68 43 77 42" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".95"/><circle cx="58" cy="70" r="3" fill="#fff" opacity=".95"/>';

    /* face */
    var f = '<g class="shpet-face">';
    var cheek = mood === "sick" ? "#A9D18E" : "#FF8FA3";
    f += '<ellipse cx="66" cy="101" rx="8.5" ry="4.8" fill="' + cheek + '" opacity="' + (mood === "sick" ? ".45" : ".55") + '"/><ellipse cx="134" cy="101" rx="8.5" ry="4.8" fill="' + cheek + '" opacity="' + (mood === "sick" ? ".45" : ".55") + '"/>';
    if (mood === "sleep") {
      f += '<path d="M72 85 Q80 91 88 85 M112 85 Q120 91 128 85" stroke="' + OUT + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="100" cy="107" rx="4" ry="3" fill="#6B2B3A"/>';
    } else {
      f += '<g class="shpet-eyes"><g class="shpet-eye"><ellipse cx="80" cy="84" rx="7.6" ry="10" fill="#2B2230"/><circle cx="82.6" cy="79.6" r="3.1" fill="#fff"/><circle cx="77.6" cy="89" r="1.4" fill="#fff" opacity=".9"/></g>' +
        '<g class="shpet-eye"><ellipse cx="120" cy="84" rx="7.6" ry="10" fill="#2B2230"/><circle cx="122.6" cy="79.6" r="3.1" fill="#fff"/><circle cx="117.6" cy="89" r="1.4" fill="#fff" opacity=".9"/></g></g>';
      if (mood === "sick") f += '<path d="M70 79 Q80 74 90 79 L90 72 L70 72 Z M110 79 Q120 74 130 79 L130 72 L110 72 Z" fill="#F4EFE4"/><path d="M70 79 Q80 75.5 90 79 M110 79 Q120 75.5 130 79" stroke="' + OUT + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
      if (mood === "sad" || mood === "sick") f += '<path d="M71 70 L87 65 M129 70 L113 65" stroke="' + OUT + '" stroke-width="3" stroke-linecap="round"/>';
      if (mood === "happy") f += '<path d="M86 101 Q100 121 114 101 Z" fill="#6B2B3A" stroke="' + OUT + '" stroke-width="3" stroke-linejoin="round"/><path d="M93 111 Q100 106 107 111 Q104 116 100 116 Q96 116 93 111 Z" fill="#FF7A8E"/>';
      else if (mood === "ok") f += '<path d="M89 104 Q100 113 111 104" stroke="' + OUT + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
      else if (mood === "sad") f += '<path d="M90 111 Q100 102 110 111" stroke="' + OUT + '" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
      else f += '<ellipse cx="100" cy="108" rx="4.6" ry="5.6" fill="#6B2B3A" stroke="' + OUT + '" stroke-width="2.6"/>';
    }
    if (mood === "sick") f += '<path class="shpet-sweat" d="M146 62 C146 62 140 70 140 74 A6 6 0 0 0 152 74 C152 70 146 62 146 62 Z" fill="#9ED8F5" stroke="#4A9BC4" stroke-width="1.6"/>';
    f += '</g>';

    var bodyG = '<g' + (has.fracture ? ' mask="url(#' + p + 'chip)"' : '') + '>' + body + '</g>' + f;

    /* gum cushion, then the gum's own problems */
    var g = '<path d="' + gumPath(T) + '" fill="url(#' + p + 'gum)" stroke="#A8384F" stroke-width="4" stroke-linejoin="round"/>';
    g += '<path d="M24 196 C24 ' + (T + 16) + ' 32 ' + (T + 2) + ' 44 ' + (T - 7) + '" stroke="#fff" stroke-width="3.4" fill="none" opacity=".5" stroke-linecap="round"/>';
    g += '<path d="M40 214 C70 222 130 222 160 214" stroke="#000" stroke-width="5" fill="none" opacity=".08" stroke-linecap="round"/>';
    g += '<g fill="#fff" opacity=".25"><circle cx="36" cy="196" r="1.6"/><circle cx="52" cy="208" r="1.3"/><circle cx="148" cy="200" r="1.6"/><circle cx="164" cy="190" r="1.3"/><circle cx="100" cy="212" r="1.4"/><circle cx="76" cy="200" r="1.2"/><circle cx="126" cy="206" r="1.2"/></g>';
    if (has.gingivitis) {
      g += '<ellipse cx="51" cy="' + (T - 9) + '" rx="9" ry="8" fill="' + gumC[1] + '" stroke="#A8384F" stroke-width="3"/><ellipse cx="149" cy="' + (T - 9) + '" rx="9" ry="8" fill="' + gumC[1] + '" stroke="#A8384F" stroke-width="3"/>' +
        '<path d="M66 ' + (T + 3) + ' C77 ' + (T + 13) + ' 89 ' + (T + 16) + ' 100 ' + (T + 16) + ' C111 ' + (T + 16) + ' 123 ' + (T + 13) + ' 134 ' + (T + 3) + '" stroke="#C02C4A" stroke-width="3.4" fill="none" opacity=".6" stroke-linecap="round"/>' +
        '<path class="shpet-drop" d="M80 ' + (T + 12) + ' C80 ' + (T + 12) + ' 76 ' + (T + 18) + ' 76 ' + (T + 21) + ' A4 4 0 0 0 84 ' + (T + 21) + ' C84 ' + (T + 18) + ' 80 ' + (T + 12) + ' 80 ' + (T + 12) + ' Z" fill="#D61F3C"/>' +
        '<path class="shpet-drop shpet-drop2" d="M124 ' + (T + 12) + ' C124 ' + (T + 12) + ' 121 ' + (T + 17) + ' 121 ' + (T + 19) + ' A3 3 0 0 0 127 ' + (T + 19) + ' C127 ' + (T + 17) + ' 124 ' + (T + 12) + ' 124 ' + (T + 12) + ' Z" fill="#D61F3C"/>';
    }
    /* calculus on the exposed roots */
    var calc = has.perio ? '<g class="shpet-calc"><path d="M58 160 C62 154 70 155 72 160 C76 162 74 170 68 170 C63 172 57 168 58 160 Z" fill="#D9CA8A" stroke="#8E7C3E" stroke-width="2"/>' +
      '<path d="M124 164 C128 158 136 159 138 165 C141 170 136 175 131 174 C126 175 121 170 124 164 Z" fill="#D9CA8A" stroke="#8E7C3E" stroke-width="2"/>' +
      '<g fill="#A89650"><circle cx="64" cy="163" r="1.2"/><circle cx="68" cy="166" r="1"/><circle cx="130" cy="166" r="1.2"/><circle cx="134" cy="169" r="1"/></g></g>' : '';

    /* extras on top */
    var x = '';
    if (has.zero) {
      x += '<g transform="translate(100 50) scale(.9)"><g transform="rotate(38)"><rect x="-19" y="-6" width="38" height="12" rx="5" fill="#F3C89B" stroke="#B98552" stroke-width="2"/></g>' +
        '<g transform="rotate(-38)"><rect x="-19" y="-6" width="38" height="12" rx="5" fill="#F3C89B" stroke="#B98552" stroke-width="2"/><rect x="-6" y="-5" width="12" height="10" rx="2" fill="#FBE5CC"/></g>' +
        '<g fill="#C99A68"><circle cx="-12" cy="-8" r=".9"/><circle cx="12" cy="-8" r=".9"/><circle cx="-12" cy="8" r=".9"/><circle cx="12" cy="8" r=".9"/></g></g>';
    }
    if (has.sparkle) {
      x += '<g class="shpet-sparkles" fill="#fff" stroke="#E8C45A" stroke-width="1.4" stroke-linejoin="round">' +
        '<path class="shpet-sp shpet-sp1" d="M36 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z"/><path class="shpet-sp shpet-sp2" d="M168 58 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z"/>' +
        '<path class="shpet-sp shpet-sp3" d="M152 18 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2z"/></g>';
    }
    if (mood === "sleep") x += '<g class="shpet-zz" fill="' + OUT + '" font-family="Georgia,serif" font-weight="700"><text x="150" y="40" font-size="20">z</text><text x="164" y="22" font-size="15">z</text></g>';
    x += hat(state.hat === undefined ? holidayId() : state.hat);

    var cls = "shpet-art" + (has.perio ? " is-loose" : "") + (mood === "sick" ? " is-sick" : "");
    return '<svg class="' + cls + '" viewBox="0 -30 200 262" width="' + (px || 100) + '" height="' + Math.round((px || 100) * 1.31) + '" aria-hidden="true">' + d +
      '<g class="shpet-bob"><g class="shpet-wobble">' + s + bodyG + calc + '</g>' + g + x + '</g></svg>';
  }

  function hat(id){
    if (!id) return '';
    var h = '<g class="shpet-hat">';
    if (id === "halloween") {
      h += '<path d="M64 40 Q84 30 98 0 Q104 -16 120 -22 Q112 -10 114 2 Q118 24 136 40 Z" fill="#4A2D6B" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M74 31 Q100 24 128 31 L131 38 Q100 31 71 38 Z" fill="#F59A1E" stroke="' + OUT + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<ellipse cx="100" cy="41" rx="50" ry="8.5" fill="#3A2350" stroke="' + OUT + '" stroke-width="4"/><path d="M118 -20 l2 3" stroke="#B08CFF" stroke-width="2"/>';
    } else if (id === "thanksgiving") {
      h += '<ellipse cx="100" cy="40" rx="48" ry="8.5" fill="#2E2A28" stroke="' + OUT + '" stroke-width="4"/><path d="M72 39 L78 -2 L122 -2 L128 39 Z" fill="#3A3532" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M75 19 L125 19 L127 31 L73 31 Z" fill="#8C6B3E"/><rect x="91" y="18" width="18" height="14" rx="1.5" fill="none" stroke="#F6CD55" stroke-width="3"/>';
    } else if (id === "winter") {
      h += '<path d="M66 36 C70 6 104 -10 136 2 C146 6 154 18 160 30 L150 36 Z" fill="#D6363C" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<circle cx="160" cy="32" r="9" fill="#fff" stroke="' + OUT + '" stroke-width="3"/><rect x="58" y="28" width="90" height="16" rx="8" fill="#fff" stroke="' + OUT + '" stroke-width="3.4"/>';
    } else if (id === "newyear") {
      h += '<g transform="rotate(-12 100 38)"><path d="M80 40 L100 -20 L120 40 Z" fill="#B08CFF" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M89 13 L111 13 M84 28 L116 28" stroke="#F6CD55" stroke-width="5"/><circle cx="100" cy="-22" r="7" fill="#F6CD55" stroke="' + OUT + '" stroke-width="3"/></g>';
    } else if (id === "valentine") {
      h += '<path d="M62 42 Q100 22 138 42" stroke="#E0457B" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M80 32 q-6 -6 0 -12 q6 -6 0 -12 M120 32 q6 -6 0 -12 q-6 -6 0 -12" stroke="#888" stroke-width="2" fill="none"/>' +
        '<path d="M80 9 c-6-4-9-8-9-11 a4.5 4.5 0 0 1 9-2 a4.5 4.5 0 0 1 9 2 c0 3-3 7-9 11z M120 9 c-6-4-9-8-9-11 a4.5 4.5 0 0 1 9-2 a4.5 4.5 0 0 1 9 2 c0 3-3 7-9 11z" fill="#E0457B" stroke="' + OUT + '" stroke-width="2.4"/>';
    } else if (id === "dentist") {
      h += '<path d="M56 50 Q100 22 144 50" stroke="#59616B" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<circle cx="100" cy="20" r="16" fill="#DCE3EA" stroke="' + OUT + '" stroke-width="3.6"/><circle cx="100" cy="20" r="11" fill="#F7FBFF"/><circle cx="100" cy="20" r="3" fill="#59616B"/><path d="M92 14 Q95 10 100 10" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    } else if (id === "stpatrick") {
      h += '<ellipse cx="100" cy="40" rx="48" ry="8.5" fill="#1B6E2E" stroke="' + OUT + '" stroke-width="4"/><path d="M72 39 L76 -6 L124 -6 L128 39 Z" fill="#2F9E44" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M74 21 L126 21 L127 31 L73 31 Z" fill="#2B2B2B"/><path d="M112 13 c-3 -5 3 -8 5 -4 c2 -4 8 -1 5 4 c5 1 4 7 -1 6 c1 5 -5 6 -6 1 c-3 3 -7 -1 -3 -7z" fill="#69DB7C" stroke="' + OUT + '" stroke-width="1.6"/>';
    } else if (id === "easter") {
      h += '<path d="M76 42 C62 8 66 -24 78 -26 C90 -28 94 6 90 38" fill="#fff" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/><path d="M78 30 C72 6 74 -14 79 -16 C84 -16 86 8 84 30" fill="#FFB3C7"/>' +
        '<path d="M124 42 C138 8 134 -24 122 -26 C110 -28 106 6 110 38" fill="#fff" stroke="' + OUT + '" stroke-width="4" stroke-linejoin="round"/><path d="M122 30 C128 6 126 -14 121 -16 C116 -16 114 8 116 30" fill="#FFB3C7"/>';
    } else return '';
    return h + '</g>';
  }

  /* Timmy's house on the dashboard: a little cottage on a hill, with a toothbrush for a signpost. Timmy himself is a
     separate button placed over the empty spot on the right (.shpet-spot). */
  function houseSvg(){
    var p = "shph" + (++uid) + "-";
    return '<svg class="shpet-housesvg" viewBox="0 0 240 150" aria-hidden="true"><defs>' +
      '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE5FA"/><stop offset="1" stop-color="#EEF8FD"/></linearGradient>' +
      '<linearGradient id="' + p + 'gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A7DE93"/><stop offset="1" stop-color="#6CBB68"/></linearGradient>' +
      '<linearGradient id="' + p + 'roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7A3BA"/><stop offset="1" stop-color="#E5779A"/></linearGradient>' +
      '<clipPath id="' + p + 'c"><rect width="240" height="150" rx="16"/></clipPath></defs>' +
      '<g clip-path="url(#' + p + 'c)">' +
      '<rect width="240" height="150" fill="url(#' + p + 'sky)"/>' +
      '<g class="shpet-sun"><circle cx="30" cy="26" r="11" fill="#FFE27A"/><g stroke="#FFD24A" stroke-width="2.4" stroke-linecap="round"><path d="M30 8v-4M30 48v-4M12 26H8M52 26h-4M17 13l-3-3M46 42l-3-3M17 39l-3 3M46 10l-3 3"/></g></g>' +
      '<g class="shpet-cloud" fill="#fff" opacity=".9"><ellipse cx="188" cy="24" rx="16" ry="7"/><ellipse cx="200" cy="19" rx="10" ry="8"/><ellipse cx="178" cy="21" rx="8" ry="6"/></g>' +
      '<path d="M0 116 Q60 98 124 110 T240 104 L240 150 L0 150 Z" fill="url(#' + p + 'gr)"/>' +
      '<path d="M0 132 Q70 122 140 130 T240 126 L240 150 L0 150 Z" fill="#5FAE5C" opacity=".45"/>' +
      '<path d="M54 121 Q62 132 52 150 L70 150 Q76 132 66 121 Z" fill="#F3E3C4" opacity=".9"/>' +
      /* chimney + smoke, behind the roof */
      '<rect x="80" y="36" width="11" height="22" fill="#D96C8C" stroke="' + OUT + '" stroke-width="2.6"/>' +
      '<g class="shpet-smoke" fill="#fff" opacity=".85"><circle cx="86" cy="28" r="4"/><circle cx="91" cy="20" r="5"/><circle cx="98" cy="11" r="6"/></g>' +
      /* the house */
      '<rect x="24" y="64" width="72" height="58" rx="3" fill="#FFF7EC" stroke="' + OUT + '" stroke-width="3"/>' +
      '<path d="M14 70 L60 30 L106 70 Z" fill="url(#' + p + 'roof)" stroke="' + OUT + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M24 66 L60 36" stroke="#fff" stroke-width="2.4" opacity=".55" stroke-linecap="round"/>' +
      '<circle cx="60" cy="55" r="8" fill="#fff" stroke="' + OUT + '" stroke-width="2.2"/>' +
      '<path d="M56.8 51.4c-1.4 0-2.3 1-2.3 2.5 0 1.6.9 2.4 1.2 3.7.3 1.6.5 3.4 1.3 3.4s1-1.6 1.2-2.6c.1-.5.4-.8 1.8-.8s1.7.3 1.8.8c.2 1 .5 2.6 1.2 2.6s1-1.8 1.3-3.4c.3-1.3 1.2-2.1 1.2-3.7 0-1.5-.9-2.5-2.3-2.5-1.1 0-1.7.6-3.2.6s-2.1-.6-3.2-.6z" fill="#F7F1E4" stroke="' + OUT + '" stroke-width="1"/>' +
      '<rect x="30" y="78" width="16" height="15" rx="2" fill="#FFE9A8" stroke="' + OUT + '" stroke-width="2.4"/><path d="M38 78v15M30 85.5h16" stroke="' + OUT + '" stroke-width="1.6"/>' +
      '<path d="M30 78 q4 6 0 11 M46 78 q-4 6 0 11" fill="#F7A3BA" opacity=".8"/>' +
      '<rect x="70" y="78" width="16" height="15" rx="2" fill="#FFE9A8" stroke="' + OUT + '" stroke-width="2.4"/><path d="M78 78v15M70 85.5h16" stroke="' + OUT + '" stroke-width="1.6"/>' +
      '<path d="M50 122 V102 a10 10 0 0 1 20 0 V122 Z" fill="#8FD3F5" stroke="' + OUT + '" stroke-width="2.6"/><circle cx="65" cy="112" r="1.6" fill="' + OUT + '"/>' +
      '<g transform="translate(60 97)"><rect x="-15" y="-11" width="30" height="9" rx="2" fill="#fff" stroke="' + OUT + '" stroke-width="1.6"/><text x="0" y="-4.4" text-anchor="middle" font-family="Georgia,serif" font-size="6.4" font-weight="700" fill="' + OUT + '">TIMMY</text></g>' +
      /* flower boxes and flowers */
      '<rect x="28" y="93" width="20" height="5" rx="1.5" fill="#B9845A" stroke="' + OUT + '" stroke-width="1.6"/><rect x="68" y="93" width="20" height="5" rx="1.5" fill="#B9845A" stroke="' + OUT + '" stroke-width="1.6"/>' +
      '<g><circle cx="33" cy="91" r="2.2" fill="#FF8FB1"/><circle cx="39" cy="90.4" r="2.2" fill="#FFE27A"/><circle cx="44" cy="91" r="2.2" fill="#B08CFF"/><circle cx="73" cy="91" r="2.2" fill="#FFE27A"/><circle cx="79" cy="90.4" r="2.2" fill="#FF8FB1"/><circle cx="84" cy="91" r="2.2" fill="#8FD3F5"/></g>' +
      /* toothbrush signpost */
      '<g transform="rotate(-6 116 112)"><rect x="113" y="82" width="6" height="40" rx="3" fill="#8FD3F5" stroke="' + OUT + '" stroke-width="2.2"/>' +
      '<rect x="109" y="70" width="14" height="14" rx="3" fill="#fff" stroke="' + OUT + '" stroke-width="2.2"/>' +
      '<path d="M111 70v-6M114 70v-7M117 70v-7M120 70v-7M122.6 70v-6" stroke="#3ECF7E" stroke-width="2" stroke-linecap="round"/></g>' +
      '<g fill="#FF8FB1"><circle cx="14" cy="128" r="2.4"/><circle cx="104" cy="132" r="2.4"/><circle cx="226" cy="124" r="2.4"/></g>' +
      '<g fill="#FFE27A"><circle cx="20" cy="136" r="2"/><circle cx="214" cy="134" r="2"/></g>' +
      '</g></svg>';
  }

  /* ================= health ================= */
  function readLog(){ try { return JSON.parse(ls("sh_pet_log") || "{}") || {}; } catch (e) { return {}; } }
  function bumpLog(correct){
    var log = readLog(), d = centralDay(), r = log[d] || [0, 0];
    r[0]++; if (correct) r[1]++; log[d] = r;
    var keep = addDays(d, -70); Object.keys(log).forEach(function(k){ if (k < keep) delete log[k]; });
    ls("sh_pet_log", JSON.stringify(log));
  }
  /* server rows + this device's tally -> HP. Deterministic for the same history, so phone and laptop agree. */
  function simulate(serverRows){
    var today = centralDay(), born = ls("sh_pet_born") || today, log = readLog(), by = {};
    (serverRows || []).forEach(function(r){ var k = String(r.d).slice(0, 10); by[k] = [r.attempts | 0, r.correct | 0]; });
    Object.keys(log).forEach(function(k){ var a = log[k], b = by[k] || [0, 0]; by[k] = [Math.max(a[0], b[0]), Math.max(a[1], b[1])]; });
    var start = born, earliest = addDays(today, -60);
    if (start < earliest) start = earliest;
    var hp = 70, streak = 0, miss = 0, treat = false, everZero = false, revived = false;
    for (var day = start, i = 0; day <= today && i < 400; day = addDays(day, 1), i++) {
      var r = by[day] || [0, 0], a = r[0], c = r[1];
      if (a > 0) {
        streak++; miss = 0;
        var gain = Math.min(30, c * 0.8) + Math.min(10, (streak - 1) * 2);
        if (treat) gain *= 0.5;
        hp += gain - Math.min(8, (a - c) * 0.2);
      } else if (day < today) {
        streak = 0; miss++;
        hp -= Math.min(20, 8 + 4 * (miss - 1));
      }
      if (hp <= 0) { hp = 0; treat = true; everZero = true; }
      if (treat && hp >= 50) treat = false;
      if (hp > 100) hp = 100;
      if (everZero && hp >= 100) revived = true;
    }
    var t = by[today] || [0, 0];
    return { hp: Math.round(hp), streak: streak, missedYesterday: !(by[addDays(today, -1)] || [0])[0] && born < today,
      treat: treat, everZero: everZero, revived: revived, today: { a: t[0], c: t[1] }, born: born };
  }

  /* ================= words ================= */
  var JOKES = [
    "What time do you go to the dentist? Tooth-hurty.",
    "Why did the king go to the dentist? To get his teeth crowned.",
    "What did the dentist get for being the best in town? A little plaque.",
    "What do you call a bear with no teeth? A gummy bear.",
    "Why did the gingiva go to therapy? Attachment issues.",
    "Why did the smartphone need a dentist? Bluetooth.",
    "What's a dentist's favourite movie? Plaque to the Future.",
    "Why did the cookie go to the dentist? It lost its filling.",
    "What did the dentist say to the computer? This won't hurt a byte.",
    "My dentist says I need a crown. Finally, someone who gets me.",
    "Why do dentists never lose an argument? They know the drill.",
    "What did the tooth say to the dentist leaving town? Fill me in when you get back.",
    "Why did the tree go to the dentist? It needed a root canal.",
    "Why are molars so chill? They know how to grind through it.",
    "What did the dentist say to the golfer? You've got a hole in one.",
    "Why did the incisor break up with the molar? It needed some space.",
    "Periodontists are great listeners. They hear you out, then probe a little deeper.",
    "I asked my dentist how to whiten my teeth. They said wear a brown shirt.",
    "What does a dentist call an X-ray? A tooth-pic.",
    "What's a tooth's favourite dance? The floss. Obviously.",
    "Why was the enamel so confident? It's the hardest thing in the body.",
    "What do you call a dentist who doesn't like tea? Denis.",
    "Do you swear to tell the tooth, the whole tooth, and nothing but the tooth?",
    "Why did the dentist seem calm all day? Lots of patients.",
    "What did the tooth fairy use to fix her wand? Toothpaste.",
    "How do you fix a broken tooth? With toothpaste. (Please don't. See a prosthodontist.)",
    "Why don't teeth keep secrets? They're always chattering.",
    "What did one canine say to the other? Long time no see. We should meet in the middle sometime.",
    "Why did the wisdom tooth skip class? It already knew everything. (It did not. It was impacted.)",
    "What does a molar wear to a party? A crown, and a little bridge-work.",
    "My dentist is great at pep talks. Always tells me to brace myself.",
    "Why was the cavity so lonely? Nobody wanted to fill the void."
  ];
  var CHEER = {
    3: ["Three in a row!", "Hat trick! Three straight."],
    5: ["Five in a row! My enamel is glowing.", "Five straight. I can feel myself remineralizing."],
    10: ["TEN in a row. I'm getting so shiny.", "Ten straight! You're unstoppable."],
    15: ["Fifteen! Is this even legal?", "Fifteen in a row. Somebody check your answers. Actually don't, they're right."],
    20: ["Twenty in a row! I'm sparkling over here.", "TWENTY. I need sunglasses."],
    25: ["25 straight! That's a Sharp Explorer run.", "Twenty-five! Professors fear you."],
    30: ["Thirty in a row. Thirty! That's almost a whole arch."],
    40: ["Forty! I don't even have words. I have teeth."],
    50: ["FIFTY in a row. I'm legally blinding.", "Fifty straight! I'm telling everyone about you."],
    75: ["75 in a row! You're almost nuke-ready."],
    100: ["100 IN A ROW. Go call in that nuke!", "One hundred. Straight. I'm crying fluoride."]
  };
  var RIGHT = ["Nailed it!", "That's the stuff.", "Correct! Fluoride for the brain.", "Yes! I felt that one.", "Clean answer. Polished, even.",
    "Mmm, that one tasted minty.", "Right on. +HP for me.", "Look at you go.", "Textbook.", "Ooh, smart.", "That's a keeper."];
  var WRONG = ["Ouch, close one.", "Plaque happens. Next one.", "No worries, read the explanation and it'll stick.", "Missed it. That's how you learn it though.",
    "Even the professor had to learn this once.", "Eh, that one was sneaky.", "Shake it off. Literally, I'm shaking."];
  var WRONG3 = ["Rough patch. Want to peek at the notes for a sec?", "Deep breath. You've got this.", "Three misses. Totally normal on a hard topic. Slow down a little?"];
  var SECTION = [
    [/arcade/, ["Arcade time! I'll hold your stuff.", "Games count too. Every right answer heals me."]],
    [/drill/, ["Daily drill! Quick reps, big gains.", "Drill time. I'll cheer, you answer."]],
    [/(bank|question)/, ["Question bank! Every right answer heals me.", "Let's do some reps."]],
    [/cram/, ["The cram sheet? Exam must be close.", "Cram sheet. Highlights of the highlights."]],
    [/hint/, ["Exam hints: the professor literally told us. Pay attention!"]],
    [/(mind|map)/, ["Ooh, a mind map. Very organized of you."]],
    [/review/, ["Review tables. My favourite kind of furniture."]],
    [/(notes|reading|lecture|compendium)/, ["Reading time. I'll be quiet. Mostly.", "Notes! Tap the Listen button if your eyes are tired."]]
  ];
  var EGG_LINES = {
    golden: ["GOLDEN PROBE! I'm so proud I could crack. (I won't.)"],
    fairy: ["You caught the Tooth Fairy! Did she leave a coin?", "She's real! I told you!"],
    boss: ["Plaque Boss is DOWN. That thing was my mortal enemy."],
    rootcanal: ["You went through the root canal and came out the other side. Respect."],
    owl: ["It's the middle of the night. I'm a tooth and even I'm tired."],
    floss: ["Did somebody say floss?", "That's my favourite word."],
    flosschain: ["A FLOSS CHAIN. This is the best day of my life."],
    mirror: ["Everything's backwards. Is my good side still my good side?"],
    fullarch: ["A full arch! All 32 of my cousins, together at last."],
    cavity: ["You filled a cavity! Show-off. (I love it.)"],
    prof: ["Quoting the professor? Very on brand."],
    konami: ["Whoa. Am I... pixels?"],
    holiday: ["Happy holidays from your favourite tooth!"]
  };
  var HOLIDAY_HELLO = {
    halloween: "Happy Halloween! Do you like my hat? Don't eat too much candy.",
    thanksgiving: "Happy Thanksgiving! I'm thankful for you. And for fluoride.",
    winter: "Happy holidays! Finals first, cookies after.",
    newyear: "Happy New Year! Resolution: floss. Every day. I mean it.",
    valentine: "Happy Valentine's! You're my favourite human.",
    dentist: "It's National Dentist's Day! That's you soon.",
    stpatrick: "Happy St. Patrick's! Lucky to have you.",
    easter: "Happy Easter! Go easy on the chocolate eggs."
  };
  function statusLine(st, name){
    var hp = st.hp, n = name ? name + ". " : "";
    if (hp <= 0) return "0 HP. I'm in rough shape. I won't die, but getting me back takes a few solid study days, and I heal at half speed until 50.";
    if (st.treat) return hp + " HP and on a treatment plan. Healing's slow until I'm back to 50, but I'm getting there.";
    if (hp < 12) return hp + " HP. I cracked a cusp. I need a real treatment plan: questions, today and tomorrow.";
    if (hp < 25) return hp + " HP. My gums are receding and there's calculus on my roots. Periodontitis is no joke.";
    if (hp < 40) return hp + " HP. That's a cavity. Please. Questions. Now.";
    if (hp < 55) return hp + " HP. I've got stains and puffy gums. A study streak would fix me right up.";
    if (hp < 70) return hp + " HP. A little plaque at my gumline. Some right answers would brush it off.";
    if (hp < 90) return "Feeling good: " + hp + " HP. A few questions a day keeps the plaque away.";
    return n + "Sparkling! " + hp + " HP. Keep this up and I'll need sunglasses.";
  }

  /* ================= styles (self-contained: the dashboard doesn't load v3.css) ================= */
  function css(){
    if (document.getElementById("shpet-css")) return;
    var st = document.createElement("style"); st.id = "shpet-css";
    st.textContent = [
      ".shpet{--pet-bg:var(--shw-bg, var(--surface, #fff));--pet-ink:var(--shw-ink, var(--ink, #15202A));--pet-ink2:var(--shw-ink2, var(--ink-2, #555));--pet-line:var(--shw-line, var(--line, rgba(0,0,0,.12)));--pet-shadow:var(--shw-shadow, 0 10px 30px rgba(0,0,0,.16));--pet-accent:var(--accent, #2E9E5B);",
      "  font-family:var(--shw-font, var(--sans, system-ui, sans-serif)); color:var(--pet-ink);}",
      ".shpet-btn{display:block; padding:0; margin:0; border:0; background:transparent; cursor:pointer; -webkit-tap-highlight-color:transparent; position:relative;}",
      ".shpet-btn:focus-visible{outline:3px solid var(--pet-accent); outline-offset:4px; border-radius:16px;}",
      ".shpet-art{display:block; overflow:visible; filter:drop-shadow(0 2px 2px rgba(0,0,0,.12));}",
      ".shpet-btn > .shpet-art{width:100%; height:auto;}",
      ".shpet-btn:hover .shpet-art{filter:drop-shadow(0 3px 5px rgba(0,0,0,.2));}",
      /* idle life */
      ".shpet-art .shpet-bob{transform-origin:100px 224px; animation:shpet-breathe 3.2s ease-in-out infinite;}",
      ".shpet-art.is-loose .shpet-wobble{transform-origin:100px 200px; animation:shpet-loose 2.4s ease-in-out infinite;}",
      ".shpet-art.is-sick .shpet-bob{animation:shpet-shiver 1.6s ease-in-out infinite;}",
      ".shpet-eye{transform-box:fill-box; transform-origin:center; animation:shpet-blink 5.5s infinite;}",
      ".shpet-eye + .shpet-eye{animation-delay:.04s;}",
      ".shpet-drop{animation:shpet-drip 2.6s ease-in infinite;} .shpet-drop2{animation-delay:1.3s;}",
      ".shpet-sp{transform-box:fill-box; transform-origin:center; animation:shpet-twinkle 2.4s ease-in-out infinite;} .shpet-sp2{animation-delay:.8s;} .shpet-sp3{animation-delay:1.6s;}",
      ".shpet-zz{animation:shpet-zz 2.4s ease-in-out infinite;}",
      ".shpet-sweat{animation:shpet-drip 3s ease-in infinite;}",
      ".shpet-arm-r{transform-box:fill-box; transform-origin:0% 40%;} .shpet-arm-l{transform-box:fill-box; transform-origin:100% 40%;}",
      ".shpet-hat{transform-origin:100px 40px;}",
      /* one-off moves, toggled by class on the button */
      ".shpet-btn.do-wave .shpet-arm-r{animation:shpet-wave .45s ease-in-out 3 alternate;}",
      ".shpet-btn.do-hop .shpet-art{animation:shpet-hop .7s cubic-bezier(.3,1.6,.5,1);}",
      ".shpet-btn.do-wiggle .shpet-art{animation:shpet-wiggle .6s ease-in-out;}",
      ".shpet-btn.do-look .shpet-eyes{animation:shpet-look 1.6s ease-in-out;}",
      ".shpet-btn.do-spin .shpet-art{animation:shpet-spin .9s cubic-bezier(.4,0,.2,1);}",
      ".shpet-btn.do-flinch .shpet-art{animation:shpet-flinch .45s ease-in-out;}",
      ".shpet-btn.do-cheer .shpet-arm-r, .shpet-btn.do-cheer .shpet-arm-l{animation:shpet-cheer .3s ease-in-out 4 alternate;}",
      ".shpet-btn.do-cheer .shpet-art{animation:shpet-hop .6s cubic-bezier(.3,1.6,.5,1) 2;}",
      ".shpet-btn.do-hat .shpet-hat{animation:shpet-tip .9s ease-in-out;}",
      "@keyframes shpet-breathe{0%,100%{transform:scale(1,1);} 50%{transform:scale(1.015,.985);}}",
      "@keyframes shpet-loose{0%,100%{transform:rotate(0);} 25%{transform:rotate(-2.4deg);} 75%{transform:rotate(2.4deg);}}",
      "@keyframes shpet-shiver{0%,100%{transform:translateX(0);} 10%,30%{transform:translateX(-1.5px);} 20%,40%{transform:translateX(1.5px);} 50%{transform:translateX(0);}}",
      "@keyframes shpet-blink{0%,92%,100%{transform:scaleY(1);} 95%{transform:scaleY(.08);}}",
      "@keyframes shpet-drip{0%{transform:translateY(0); opacity:0;} 15%{opacity:1;} 80%{transform:translateY(10px); opacity:1;} 100%{transform:translateY(14px); opacity:0;}}",
      "@keyframes shpet-twinkle{0%,100%{transform:scale(.3) rotate(0); opacity:.2;} 50%{transform:scale(1.1) rotate(45deg); opacity:1;}}",
      "@keyframes shpet-zz{0%,100%{transform:translateY(0); opacity:.4;} 50%{transform:translateY(-6px); opacity:1;}}",
      "@keyframes shpet-wave{from{transform:rotate(0);} to{transform:rotate(-38deg);}}",
      "@keyframes shpet-cheer{from{transform:rotate(0);} to{transform:rotate(-50deg);}}",
      "@keyframes shpet-hop{0%,100%{transform:translateY(0);} 40%{transform:translateY(-14%) scale(1.03,.97);} 70%{transform:translateY(0) scale(1.04,.94);}}",
      "@keyframes shpet-wiggle{0%,100%{transform:rotate(0);} 25%{transform:rotate(-7deg);} 75%{transform:rotate(7deg);}}",
      "@keyframes shpet-look{0%,100%{transform:translateX(0);} 25%,40%{transform:translateX(-5px);} 60%,80%{transform:translateX(5px);}}",
      "@keyframes shpet-spin{from{transform:rotateY(0);} to{transform:rotateY(360deg);}}",
      "@keyframes shpet-flinch{0%,100%{transform:translateX(0);} 20%{transform:translateX(-6px) rotate(-4deg);} 60%{transform:translateX(4px) rotate(3deg);}}",
      "@keyframes shpet-tip{0%,100%{transform:translateY(0) rotate(0);} 40%{transform:translateY(-10px) rotate(-10deg);}}",
      /* HP chip under the tooth */
      ".shpet-hp{display:block; height:5px; margin:3px auto 0; width:70%; border-radius:99px; background:color-mix(in srgb, var(--pet-ink) 12%, transparent); overflow:hidden;}",
      ".shpet-hp i{display:block; height:100%; border-radius:99px; transition:width .6s cubic-bezier(.2,.8,.3,1), background .6s;}",
      /* speech bubble */
      ".shpet-say{position:absolute; z-index:3; left:calc(100% + 8px); bottom:38%; width:max-content; max-width:min(196px, calc(100vw - 110px)); padding:7px 10px;",
      "  border-radius:13px 13px 13px 4px; background:var(--pet-bg); color:var(--pet-ink); border:1px solid var(--pet-line); box-shadow:var(--pet-shadow);",
      "  font-size:12.5px; line-height:1.35; text-align:left; opacity:0; transform:translateY(6px) scale(.96); transform-origin:0 100%; pointer-events:none; transition:opacity .25s, transform .25s cubic-bezier(.2,.8,.3,1);}",
      ".shpet-say.is-on{opacity:1; transform:none; pointer-events:auto;}",
      ".shpet-say b{font-weight:700;}",
      ".shpet-say .shpet-more{display:inline-block; margin-top:6px; padding:0; border:0; background:none; color:var(--pet-accent); font:inherit; font-size:12.5px; font-weight:700; cursor:pointer; text-decoration:underline; text-underline-offset:2px;}",
      /* where it lives */
      ".shpet-home{position:fixed; z-index:9989; left:14px; bottom:12px; width:64px; transition:opacity .3s, transform .3s;}",
      ".shpet-home.is-away{opacity:0; transform:translateY(30px); pointer-events:none;}",
      "@media (max-width:760px){ .shpet-home{left:8px; width:50px; bottom:calc(var(--sh-tabbar-h, 60px) + 8px + env(safe-area-inset-bottom,0px));} .shpet-say{font-size:12px; max-width:min(180px, calc(100vw - 80px));} }",
      /* Timmy's house: a card on the dashboard */
      ".shpet-house{display:grid; grid-template-columns:minmax(0,250px) minmax(0,1fr); gap:20px; align-items:center; margin:0 0 18px; padding:12px 18px 12px 12px;",
      "  border-radius:16px; background:var(--pet-bg); border:1px solid var(--pet-line); box-shadow:var(--shadow, 0 1px 2px rgba(0,0,0,.05));}",
      ".shpet-scene{position:relative;} .shpet-housesvg{display:block; width:100%; height:auto; border-radius:16px;}",
      ".shpet-spot{position:absolute; left:56%; bottom:4%; width:28%;}",
      ".shpet-house .shpet-hp{width:100%; height:8px; margin:8px 0;}",
      ".shpet-house .shpet-say{left:auto; right:30%; bottom:calc(100% - 8px); transform-origin:100% 100%; border-radius:13px 13px 4px 13px; max-width:min(190px, 70vw);}",
      ".shpet-title{display:flex; align-items:baseline; justify-content:space-between; gap:10px;}",
      ".shpet-title b{font-family:var(--serif, var(--font-display, Georgia, serif)); font-weight:400; font-size:24px; line-height:1.1;}",
      ".shpet-hpnum{font-size:13.5px; font-weight:700; color:var(--pet-ink2); font-variant-numeric:tabular-nums;}",
      ".shpet-status{margin:0 0 10px; font-size:14px; line-height:1.45; color:var(--pet-ink2);}",
      ".shpet-actions{display:flex; gap:8px; flex-wrap:wrap;}",
      ".shpet-smoke circle{animation:shpet-smoke 4s ease-in-out infinite;} .shpet-smoke circle:nth-child(2){animation-delay:.6s;} .shpet-smoke circle:nth-child(3){animation-delay:1.2s;}",
      ".shpet-cloud{animation:shpet-drift 14s ease-in-out infinite alternate;}",
      "@keyframes shpet-smoke{0%,100%{opacity:.85; transform:translateY(0);} 50%{opacity:.4; transform:translateY(-3px);}}",
      "@keyframes shpet-drift{from{transform:translateX(0);} to{transform:translateX(-26px);}}",
      "@media (max-width:600px){ .shpet-house{grid-template-columns:1fr; gap:12px; padding:10px;} .shpet-housesvg{max-height:190px;} }",
      ".shpet-perch{position:absolute; z-index:5; width:66px; transition:opacity .3s;}",
      ".shpet-perch .shpet-say{bottom:46%;}",
      "@media (max-width:600px){ .shpet-perch{width:56px;} }",
      /* dialogs */
      ".shpet-dlg{position:fixed; inset:0; z-index:10060; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(10,8,14,.5); animation:shpet-fade .25s ease;}",
      ".shpet-card{position:relative; width:100%; max-width:440px; max-height:calc(100vh - 32px); overflow:auto; padding:22px 22px 18px; border-radius:22px; background:var(--pet-bg); color:var(--pet-ink); box-shadow:0 30px 80px rgba(0,0,0,.35); animation:shpet-rise .35s cubic-bezier(.2,.8,.3,1);}",
      ".shpet-card h3{margin:0 0 6px; font-family:var(--font-display, var(--serif, Georgia, serif)); font-weight:400; font-size:26px; line-height:1.15;}",
      ".shpet-card p{margin:0 0 10px; font-size:14.5px; line-height:1.5; color:var(--pet-ink2);}",
      ".shpet-card p b{color:var(--pet-ink);}",
      ".shpet-hero{display:flex; justify-content:center; margin:-4px 0 8px;}",
      ".shpet-hero .shpet-btn{width:120px; cursor:default;}",
      ".shpet-dots{display:flex; gap:6px; justify-content:center; margin:12px 0 4px;} .shpet-dots i{width:7px; height:7px; border-radius:50%; background:var(--pet-line);} .shpet-dots i.is-on{background:var(--pet-ink);}",
      ".shpet-row{display:flex; gap:8px; justify-content:space-between; align-items:center; margin-top:14px; flex-wrap:wrap;}",
      ".shpet-go{font:inherit; font-size:14.5px; font-weight:700; padding:10px 18px; border-radius:99px; border:0; background:var(--pet-ink); color:var(--pet-bg); cursor:pointer;}",
      ".shpet-ghost{font:inherit; font-size:13.5px; font-weight:600; padding:8px 12px; border-radius:99px; border:1px solid var(--pet-line); background:transparent; color:var(--pet-ink2); cursor:pointer;}",
      ".shpet-x{position:absolute; top:10px; right:10px; width:34px; height:34px; border:0; border-radius:50%; background:transparent; color:var(--pet-ink2); font-size:22px; line-height:1; cursor:pointer;}",
      ".shpet-x:hover{background:color-mix(in srgb, var(--pet-ink) 8%, transparent);}",
      ".shpet-stages{display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin:8px 0 6px; text-align:center; font-size:11.5px; color:var(--pet-ink2);}",
      ".shpet-stages svg{width:100%; height:auto; max-width:72px; margin:0 auto 2px;}",
      ".shpet-name{display:flex; gap:8px; margin-top:6px;} .shpet-name input{flex:1; min-width:0; font:inherit; font-size:15px; padding:10px 12px; border-radius:12px; border:1px solid var(--pet-line); background:transparent; color:var(--pet-ink);}",
      ".shpet-bar{height:10px; border-radius:99px; background:color-mix(in srgb, var(--pet-ink) 10%, transparent); overflow:hidden; margin:4px 0 2px;} .shpet-bar i{display:block; height:100%; border-radius:99px;}",
      ".shpet-hpline{display:flex; justify-content:space-between; font-size:13px; color:var(--pet-ink2);} .shpet-hpline b{font-size:15px; color:var(--pet-ink);}",
      ".shpet-conds{list-style:none; margin:10px 0 0; padding:0; display:grid; gap:6px;} .shpet-conds li{display:flex; gap:10px; align-items:flex-start; font-size:13.5px; line-height:1.4; padding:8px 10px; border-radius:12px; background:color-mix(in srgb, var(--pet-ink) 5%, transparent);}",
      ".shpet-conds li i{flex:none; width:10px; height:10px; border-radius:50%; margin-top:4px;}",
      ".shpet-seg{display:inline-flex; gap:2px; padding:3px; border-radius:99px; border:1px solid var(--pet-line);} .shpet-seg button{font:inherit; font-size:13px; font-weight:600; padding:5px 11px; border-radius:99px; border:0; background:transparent; color:var(--pet-ink2); cursor:pointer;} .shpet-seg button[aria-pressed=true]{background:var(--pet-ink); color:var(--pet-bg);}",
      "@keyframes shpet-fade{from{opacity:0;}} @keyframes shpet-rise{from{opacity:0; transform:translateY(16px) scale(.97);}}",
      "html.sh-mock-on .shpet-home{display:none;}",
      "@media (prefers-reduced-motion: reduce){ .shpet *, .shpet-dlg *{animation:none !important;} }"
    ].join("\n");
    (document.head || document.documentElement).appendChild(st);
  }
  function hpColor(hp){ return hp >= 70 ? "#3ECF7E" : hp >= 40 ? "#E8C15A" : hp >= 12 ? "#F0806B" : "#D6363C"; }

  /* ================= the buddy ================= */
  var M = null;   // the mounted instance
  function pref(){ return ls("sh_pref_pet") || "on"; }
  function adopted(){ return !!ls("sh_pet_born"); }
  function petName(){ return "Timmy Tooth"; }

  function mount(opt){
    if (M || !opt) return M;
    css();
    var H = opt.H || null, where = opt.where || (H ? "hub" : "dashboard");
    M = {
      where: where, H: H, sb: opt.sb || (H && H.supabase) || null, visitor: opt.visitor || (H && H.visitor) || ls("sh_visitor_id"),
      name: opt.name || (H ? H.name : function(){ return ls("sh_display_name") || ""; }), perch: opt.perch || null, home: opt.home || null,
      el: null, btn: null, say: null, st: simulate(null), rows: null, sayT: null, run: 0, wrongRun: 0, lastSection: "", lastInput: Date.now(),
      sessionStart: Date.now(), longNudges: 0, idleSaid: false, taps: 0, tapT: 0, lastHp: null, lastTalk: 0
    };
    load();
    render();
    if (where === "hub") wireHub(); else wireDashboard();
    setInterval(idleLife, 4200);
    setInterval(load, 5 * 60 * 1000);
    window.addEventListener("resize", place);
    document.addEventListener("sh:pref", function(e){ if (e.detail && /^sh_pref_(pet|eggs)$/.test(e.detail.key)) refresh(); });
    return M;
  }
  function visible(){
    var p = pref();
    if (p === "off") return false;
    if (M.where === "hub") return adopted() && p !== "dash";
    return true;      // dashboard: before adoption it waits on your name to be noticed
  }
  function load(){
    if (!M || !M.sb || !M.visitor) return;
    M.sb.rpc("get_pet_days", { p_visitor: M.visitor }).then(function(r){
      if (r && !r.error && Array.isArray(r.data)) { M.rows = r.data; update(true); }
    }, function(){});
  }
  function update(quiet){
    var prev = M.st ? M.st.hp : null;
    M.st = simulate(M.rows);
    draw();
    if (!adopted()) return;
    var hp = M.st.hp;
    /* trophies, recorded once */
    if (hp >= 100 && !ls("sh_pet_perfect")) { ls("sh_pet_perfect", "1"); award("pet-perfect"); if (!quiet) talk("100 HP! Pearly whites, baby. You earned a trophy for this.", "do-cheer"); }
    if (M.st.revived && !ls("sh_pet_revived")) { ls("sh_pet_revived", "1"); award("pet-revive"); talk("From 0 to 100. You brought me back. I'll never forget it.", "do-cheer"); }
    if (!quiet && prev != null) {
      var a = conditions(prev), b = conditions(hp);
      a.forEach(function(k){ if (b.indexOf(k) < 0 && CONDITION_INFO[k]) talk("My " + CONDITION_INFO[k][0].toLowerCase() + " is gone! Thank you!", "do-hop"); });
    }
  }
  function award(kind){
    if (!M.sb || !M.visitor) return;
    M.sb.rpc("record_achievement", { p_visitor: M.visitor, p_kind: kind, p_hub: "" }).then(function(){}, function(){});
  }
  function render(){
    var home = M.where === "dashboard" && M.home ? M.home() : null;
    if (M.el) { if (M.el === home) { home.innerHTML = ""; home.hidden = true; } else M.el.remove(); M.el = null; M.btn = null; M.say = null; }
    document.documentElement.classList.toggle("sh-pet-on", M.where === "hub" && visible());
    perchSpace(false);
    if (!visible()) return;
    var el;
    if (home && adopted()) {
      /* adopted: Timmy lives in his own little house on the dashboard */
      el = home; el.hidden = false; el.className = "shpet shpet-house";
      el.innerHTML = '<div class="shpet-scene">' + houseSvg() + '<div class="shpet-spot"><button type="button" class="shpet-btn"></button><div class="shpet-say" role="status" aria-live="polite"></div></div></div>' +
        '<div class="shpet-info"><div class="shpet-title"><b>' + petName() + '</b><span class="shpet-hpnum"></span></div>' +
        '<span class="shpet-hp" aria-hidden="true"><i></i></span><p class="shpet-status"></p>' +
        '<div class="shpet-actions"><button type="button" class="shpet-ghost" data-joke>Tell me a joke</button><button type="button" class="shpet-ghost" data-check>Checkup</button></div></div>';
      if (!el.__shpet) { el.__shpet = true; el.addEventListener("click", homeClick); }
    } else {
      el = document.createElement("div");
      el.className = "shpet " + (M.where === "hub" ? "shpet-home" : "shpet-perch");
      el.innerHTML = '<button type="button" class="shpet-btn"></button><span class="shpet-hp" aria-hidden="true"><i></i></span><div class="shpet-say" role="status" aria-live="polite"></div>';
      document.body.appendChild(el);
      if (M.where === "dashboard") perchSpace(true);
    }
    M.el = el; M.btn = el.querySelector(".shpet-btn"); M.say = el.querySelector(".shpet-say");
    M.btn.addEventListener("click", onTap);
    M.say.addEventListener("click", function(e){ if (e.target.closest(".shpet-more")) { hush(); checkup(); } });
    draw(); place();
    if (!adopted()) setTimeout(function(){ talk("Psst. Up here. Tap me!", "do-wave", 9000); }, 1400);
    else setTimeout(hello, 900);
  }
  function homeClick(e){
    if (e.target.closest("[data-joke]")) { M.jokes = 0; talk(pick(JOKES), pick(["do-hop", "do-wiggle", "do-wave"]), 8500); }
    else if (e.target.closest("[data-check]")) { hush(); checkup(); }
  }
  function draw(){
    if (!M || !M.btn) return;
    var hp = adopted() ? M.st.hp : 85, mood = adopted() ? moodFor(hp) : "happy";
    if (M.sleeping) mood = "sleep";
    M.btn.innerHTML = art({ hp: hp, mood: mood }, 100);
    M.btn.setAttribute("aria-label", adopted() ? petName() + ", your tooth buddy, " + hp + " HP. Tap for a joke." : "Timmy Tooth. Tap to meet him.");
    var bar = M.el.querySelector(".shpet-hp");
    bar.style.display = adopted() ? "" : "none";
    bar.querySelector("i").style.width = hp + "%"; bar.querySelector("i").style.background = hpColor(hp);
    var num = M.el.querySelector(".shpet-hpnum"), stat = M.el.querySelector(".shpet-status");
    if (num) num.textContent = hp + " HP";
    if (stat) stat.textContent = statusLine(M.st);
  }
  /* dashboard: sit right on top of your name */
  function perchSpace(on){ var g = document.getElementById("greeting"); if (g) g.classList.toggle("has-pet", !!on); }
  function place(){
    if (!M || !M.el || M.where !== "dashboard" || !M.el.classList.contains("shpet-perch")) return;
    var target = M.perch ? M.perch() : null; if (!target) return;
    var r = target.getBoundingClientRect(), w = M.el.offsetWidth || 66;
    /* no name yet: sit on the greeting's own words, not the middle of the whole row */
    if (!target.firstElementChild || target.tagName !== "B") {
      var tn = target.firstChild;
      if (tn && tn.nodeType === 3 && tn.nodeValue.trim()) { try { var rg = document.createRange(); rg.selectNodeContents(tn); r = rg.getBoundingClientRect(); } catch (e) {} }
    }
    var x = r.left + r.width / 2 - w / 2 + window.scrollX, y = r.top + window.scrollY - (M.el.offsetHeight || 92) - 12;
    x = Math.max(8, Math.min(x, document.documentElement.clientWidth - w - 8));
    M.el.style.left = x + "px"; M.el.style.top = y + "px";
    /* keep the bubble on screen: flip it to the left when there's no room on the right */
    var room = document.documentElement.clientWidth - (x - window.scrollX + w);
    M.say.style.left = room < 200 ? "auto" : ""; M.say.style.right = room < 200 ? "calc(100% + 10px)" : "";
    M.say.style.borderRadius = room < 200 ? "16px 16px 4px 16px" : "";
  }

  /* ---------- talking ---------- */
  function talk(html, move, ms, raw){
    if (!M || !M.say || !visible()) return;
    clearTimeout(M.sayT);
    M.say.innerHTML = raw ? html : esc(html);
    M.say.classList.add("is-on");
    M.lastTalk = Date.now();
    if (move) act(move);
    M.sayT = setTimeout(hush, ms || Math.max(4200, Math.min(9000, String(html).length * 70)));
  }
  function hush(){ if (M && M.say) M.say.classList.remove("is-on"); }
  function busy(){ return M && M.say && M.say.classList.contains("is-on") && Date.now() - M.lastTalk < 2500; }
  function act(move){
    if (!M || !M.btn || reduced) return;
    var b = M.btn; b.classList.remove(b.dataset.move || "x"); void b.offsetWidth; b.classList.add(move); b.dataset.move = move;
    clearTimeout(M.actT); M.actT = setTimeout(function(){ b.classList.remove(move); }, 1900);
  }
  function idleLife(){
    if (!M || !M.btn || !visible() || document.hidden) return;
    if (M.where === "hub") {
      var quiet = Date.now() - M.lastInput;
      if (quiet > 180000 && !M.sleeping) { M.sleeping = true; draw(); if (!M.idleSaid) { M.idleSaid = true; talk("Still there? I'll just rest my enamel for a sec.", null, 5000); } return; }
      if (quiet < 180000 && M.sleeping) { M.sleeping = false; draw(); talk(pick(["Oh! You're back.", "I wasn't sleeping. I was resting my eyes.", "Welcome back!"]), "do-hop"); }
    }
    if (M.sleeping) return;
    if (Math.random() < 0.55) act(pick(["do-wave", "do-hop", "do-look", "do-wiggle", "do-look", "do-hat"]));
  }
  function hello(){
    if (!adopted()) return;
    if (M.skipHello) { M.skipHello = false; return; }
    var st = M.st, nm = (M.name && M.name()) || "";
    var h = new Date().getHours(), part = h < 5 ? "Up late" : h < 12 ? "Morning" : h < 17 ? "Hey" : "Evening";
    var hol = holidayId();
    var lines = [];
    if (M.where === "dashboard") {
      lines.push(part + (nm ? ", " + nm : "") + "!");
      if (hol && HOLIDAY_HELLO[hol]) lines.push(HOLIDAY_HELLO[hol]);
      else if (st.missedYesterday && st.hp < 80) lines.push("You didn't visit yesterday. I missed you (and I'm a little plaquey).");
      else if (st.hp < 40) lines.push("I'm not feeling great. Can we study today?");
      else lines.push(pick(["Welcome home.", "Come in, come in.", "I was just tidying up.", "Ready to study?", "Good to see you."]));
      talk(lines.join(" "), "do-wave", 9000);
    } else {
      var ex = examSoon();
      if (ex) talk(ex, "do-cheer", 8000);
      else if (h < 5) talk("It's late. Sleep is good for memory AND teeth. A few more, then bed?", "do-wave", 7000);
      else if (st.hp < 40) talk(statusLine(st), "do-flinch", 8000);
      else talk(pick([part + "! Let's study.", "Ready when you are.", "Let's get some right answers. I could use the HP.", "I'll be down here cheering."]), "do-wave", 5000);
    }
  }
  function examSoon(){
    var ex = ((window.SH_EXPORT || {}).exams) || [], today = centralDay(), out = "";
    ex.forEach(function(x){
      if (!x || !x.date || out) return;
      var d = dayDiff(today, String(x.date).slice(0, 10));
      if (d === 0) out = (x.label || "Exam") + " day! Deep breath. You know more than you think.";
      else if (d === 1) out = (x.label || "Exam") + " tomorrow! You've got this. Get some sleep tonight.";
    });
    return out;
  }
  function onTap(){
    if (!adopted()) { intro(); return; }
    var now = Date.now();
    M.taps = now - M.tapT < 1200 ? M.taps + 1 : 1; M.tapT = now;
    if (M.sleeping) { M.sleeping = false; M.lastInput = now; draw(); talk("Huh? Oh! I'm up.", "do-hop"); return; }
    if (M.taps >= 5) { M.taps = 0; talk(pick(["Hey! That tickles.", "Okay okay, I'm awake!", "Careful, I'm load-bearing."]), "do-spin"); return; }
    M.jokes = (M.jokes || 0) + 1;
    if (M.jokes % 4 === 0) talk(esc(statusLine(M.st)) + '<br><button type="button" class="shpet-more">Open my checkup</button>', "do-wave", 9000, true);
    else talk(esc(pick(JOKES)) + '<br><button type="button" class="shpet-more">Checkup</button>', pick(["do-hop", "do-wiggle", "do-wave"]), 8500, true);
  }

  /* ---------- hub reactions ---------- */
  function wireHub(){
    var H = M.H;
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function(t){ document.addEventListener(t, function(){ M.lastInput = Date.now(); }, { passive: true, capture: true }); });
    document.addEventListener(H.answeredEvent, function(e){
      var d = (e && e.detail) || {}, ok = !!d.correct;
      bumpLog(ok);
      M.lastInput = Date.now();
      if (M.sleeping) { M.sleeping = false; }
      update(false);
      if (!visible()) return;
      if (ok) {
        M.run++; M.wrongRun = 0;
        if (CHEER[M.run]) talk(pick(CHEER[M.run]), "do-cheer", 5000);
        else if (Math.random() < 0.16 && !busy()) talk(pick(RIGHT), "do-hop", 3200);
        else act("do-hop");
      } else {
        var was = M.run; M.run = 0; M.wrongRun++;
        if (was >= 10) talk("Streak's over, but " + was + " in a row was incredible.", "do-flinch", 5000);
        else if (M.wrongRun === 3) talk(pick(WRONG3), "do-flinch", 6000);
        else if (Math.random() < 0.25 && !busy()) talk(pick(WRONG), "do-flinch", 3600);
        else act("do-flinch");
      }
    });
    document.addEventListener("sh:egg-local", function(e){
      var d = e.detail || {}, l = EGG_LINES[d.t]; if (!l) return;
      setTimeout(function(){ talk(d.t === "holiday" && HOLIDAY_HELLO[d.id] ? HOLIDAY_HELLO[d.id] : pick(l), d.t === "floss" || d.t === "flosschain" ? "do-wiggle" : "do-cheer", 5500); }, 1200);
    });
    /* moving around the hub; hide during a mock exam */
    setInterval(function(){
      var sec = ""; try { sec = String(H.section() || "").toLowerCase(); } catch (e) {}
      var mock = /(^|\/)mock/.test(sec);
      if (M.el) M.el.classList.toggle("is-away", mock);
      if (sec === M.lastSection) return;
      var first = !M.lastSection; M.lastSection = sec;
      if (first || mock || Math.random() > 0.45 || busy()) return;
      for (var i = 0; i < SECTION.length; i++) if (SECTION[i][0].test(sec)) { talk(pick(SECTION[i][1]), "do-look", 4200); break; }
      if (/mock/.test(sec)) hush();
    }, 2500);
    /* long sessions */
    setInterval(function(){
      var mins = Math.round((Date.now() - M.sessionStart) / 60000);
      if (mins >= 50 * (M.longNudges + 1) && Date.now() - M.lastInput < 120000) {
        M.longNudges++;
        talk("You've been at it " + mins + " minutes. Stretch, drink some water, then come back. I'll wait.", "do-wave", 8000);
      }
    }, 60000);
  }
  function wireDashboard(){
    if (window.MutationObserver) {
      var g = document.getElementById("greeting");
      if (g) new MutationObserver(function(){ setTimeout(place, 0); }).observe(g, { childList: true, subtree: true, characterData: true });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    window.addEventListener("load", place);
    setTimeout(place, 600); setTimeout(place, 2000);
  }

  /* ---------- the introduction ---------- */
  function dialog(html, cls){
    var d = document.createElement("div");
    d.className = "shpet shpet-dlg" + (cls ? " " + cls : "");
    d.innerHTML = '<div class="shpet-card" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(d);
    d.addEventListener("keydown", function(e){ if (e.key === "Escape") d.remove(); });
    d.addEventListener("click", function(e){ if (e.target === d || e.target.closest(".shpet-x")) d.remove(); });
    setTimeout(function(){ var f = d.querySelector("input, .shpet-go"); if (f) try { f.focus(); } catch (e) {} }, 40);
    return d;
  }
  function intro(){
    hush();
    var step = 0;
    var stages = '<div class="shpet-stages">' + [[90, "Healthy"], [60, "Plaque"], [33, "Caries"], [8, "Fractured"]].map(function(x){
      return '<div>' + art({ hp: x[0], hat: "" }, 72) + x[1] + '</div>'; }).join("") + '</div>';
    var STEPS = [
      '<h3>Hi! I\'m Timmy Tooth.</h3><p>I\'m going to hang out with you while you study: in my little home here on the dashboard, and in the bottom corner of every hub.</p><p><b>Keeping me healthy is your job now.</b> No pressure.</p>',
      '<h3>How you take care of me</h3><p>Every question you get <b>right</b> heals me a little, and studying on <b>back-to-back days</b> adds a streak bonus.</p><p>Skip days and I start to slip: plaque first, then stains and puffy gums, then cavities, periodontitis, and eventually fractures.</p>' + stages,
      '<h3>The fine print</h3><p>I <b>can\'t die</b>. But if you let me hit 0 HP, I need a real treatment plan: I heal at half speed until I\'m back to 50.</p><p>Tap me any time for a dental joke or a checkup, and I\'ll cheer you on during streaks.</p><p>Don\'t want me around? <b>Settings → Timmy Tooth</b> turns me off, or keeps me on the dashboard only. It\'s also the "No thanks" button below.</p>',
      '<h3>Can I move in?</h3><p>I\'ve got a little house all picked out on your dashboard. I\'ll be there whenever you stop by, and I\'ll come along into the hubs to cheer you on.</p><div class="shpet-hero">' + houseSvg() + '</div>'
    ];
    var d = dialog('<button class="shpet-x" type="button" aria-label="Close">&times;</button><div class="shpet-hero"><span class="shpet-btn do-wave"></span></div><div class="shpet-step"></div>' +
      '<div class="shpet-dots">' + STEPS.map(function(){ return '<i></i>'; }).join("") + '</div>' +
      '<div class="shpet-row"><button type="button" class="shpet-ghost" data-no>No thanks</button><span><button type="button" class="shpet-ghost" data-back>Back</button> <button type="button" class="shpet-go" data-next>Next</button></span></div>');
    var hero = d.querySelector(".shpet-hero .shpet-btn");
    function show(){
      d.querySelector(".shpet-step").innerHTML = STEPS[step];
      hero.innerHTML = art({ hp: 92, mood: "happy" }, 120);
      hero.classList.remove("do-wave", "do-hop"); void hero.offsetWidth; hero.classList.add(step % 2 ? "do-hop" : "do-wave");
      d.querySelectorAll(".shpet-dots i").forEach(function(x, i){ x.classList.toggle("is-on", i === step); });
      d.querySelector("[data-back]").style.visibility = step ? "visible" : "hidden";
      d.querySelector("[data-next]").textContent = step === STEPS.length - 1 ? "Adopt Timmy" : "Next";
    }
    function finish(){
      ls("sh_pet_born", centralDay());
      M.skipHello = true;
      d.remove();
      update(true); render();
      setTimeout(function(){ talk("I'm home! Go answer some questions and I'll feel great.", "do-cheer", 7000); }, 700);
    }
    d.addEventListener("click", function(e){
      if (e.target.closest("[data-next]")) { if (step === STEPS.length - 1) finish(); else { step++; show(); } }
      else if (e.target.closest("[data-back]")) { if (step) { step--; show(); } }
      else if (e.target.closest("[data-no]")) { setPref("off"); d.remove(); }
    });
    show();
  }

  /* ---------- the checkup card ---------- */
  function checkup(){
    var st = M.st, hp = st.hp, cs = conditions(hp).filter(function(k){ return CONDITION_INFO[k]; });
    var colors = { plaque: "#E4CF5C", stain: "#9B6634", gingivitis: "#EE5A75", caries: "#3A2010", perio: "#A82540", fracture: "#3B2E3A", zero: "#D6363C" };
    var p = pref();
    var d = dialog('<button class="shpet-x" type="button" aria-label="Close">&times;</button>' +
      '<div class="shpet-hero"><span class="shpet-btn do-wave">' + art({ hp: hp }, 120) + '</span></div>' +
      '<h3>' + esc(petName()) + '\'s checkup</h3>' +
      '<div class="shpet-hpline"><span>Health</span><b>' + hp + ' / 100 HP</b></div><div class="shpet-bar"><i style="width:' + hp + '%;background:' + hpColor(hp) + '"></i></div>' +
      '<div class="shpet-hpline"><span>Today: ' + st.today.a + ' answered, ' + st.today.c + ' right</span><span>' + st.streak + '-day streak</span></div>' +
      (cs.length ? '<ul class="shpet-conds">' + cs.map(function(k){ return '<li><i style="background:' + colors[k] + '"></i><span><b>' + CONDITION_INFO[k][0] + '.</b> ' + CONDITION_INFO[k][1] + '</span></li>'; }).join("") + '</ul>'
        : '<ul class="shpet-conds"><li><i style="background:#3ECF7E"></i><span><b>All clear.</b> No plaque, no stains, no cavities. Chef\'s kiss.</span></li></ul>') +
      '<p style="margin-top:12px">Each right answer heals me a little (up to 30 HP a day), and studying on back-to-back days adds a bonus. Each day you skip, I slip, faster the longer you\'re gone. At 0 HP I can\'t die, but I heal at half speed until I\'m back to 50.</p>' +
      '<div class="shpet-row"><span>Show me <span class="shpet-seg" role="group" aria-label="Where to show your tooth buddy">' +
      '<button type="button" data-p="on" aria-pressed="' + (p === "on") + '">Everywhere</button><button type="button" data-p="dash" aria-pressed="' + (p === "dash") + '">Dashboard only</button></span></span></div>' +
      '<div class="shpet-row"><span></span><button type="button" class="shpet-ghost" data-off>Turn off Timmy</button></div>');
    d.addEventListener("click", function(e){
      var b = e.target.closest("[data-p]");
      if (b) { setPref(b.getAttribute("data-p")); d.querySelectorAll("[data-p]").forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); return; }
      if (e.target.closest("[data-off]")) { d.remove(); setPref("off"); return; }
    });
  }
  function setPref(v){
    ls("sh_pref_pet", v);
    try { document.dispatchEvent(new CustomEvent("sh:pref", { detail: { key: "sh_pref_pet", val: v } })); } catch (e) {}
    refresh();
    if (v === "off") toastOff();
  }
  function toastOff(){
    var t = document.createElement("div");
    t.className = "shpet"; t.setAttribute("role", "status");
    t.style.cssText = "position:fixed;z-index:10061;left:50%;bottom:24px;transform:translateX(-50%);padding:10px 16px;border-radius:99px;background:var(--pet-ink);color:var(--pet-bg);font-size:14px;font-weight:600;box-shadow:var(--pet-shadow)";
    t.textContent = "Timmy is off. Bring him back any time in Settings.";
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 4200);
  }
  function refresh(){ if (!M) return; hush(); render(); }

  window.shPet = { mount: mount, refresh: refresh, art: art, conditions: conditions, simulate: simulate, holidayId: holidayId, _jokes: JOKES };
})();
