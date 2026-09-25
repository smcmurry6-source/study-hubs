/* study-hubs handpiece ranks: the art, tier names and trophy definitions, shared by the hub widget
   (widget/v3.js loads this file) and the dashboard. XP and tiers are computed on the server
   (migration_v15: sh_visitor_xp, get_rank_profile, get_rank_board); this file only draws them.

   shRanks.art(tier, px, { animate }) -> inline SVG string of that tier's handpiece
   shRanks.mini(tier)                 -> small icon for next to a name on a leaderboard
   shRanks.TIERS[tier]                -> { name, at, accent }                                   */
(function(){
  "use strict";
  if (window.shRanks) return;

  var TIERS = [
    { key: "antique", name: "Antique",     at: 0,     accent: "#8A5A32" },
    { key: "stone",   name: "Stone",       at: 300,   accent: "#6F6A63" },
    { key: "bronze",  name: "Bronze",      at: 1500,  accent: "#B0672B" },
    { key: "silver",  name: "Silver",      at: 5000,  accent: "#7D8792" },
    { key: "gold",    name: "Gold",        at: 12000, accent: "#B8860B" },
    { key: "diamond", name: "Diamond",     at: 25000, accent: "#2F9FD6" },
    { key: "dark",    name: "Dark Matter", at: 50000, accent: "#7A3CFF" }
  ];
  /* each tier has three levels (I, II, III); the server computes them too (sh_step, migration_v16) */
  var ROMAN = ["I", "II", "III"];
  function rankName(t, level){ return TIERS[t].name + (level ? " " + ROMAN[Math.max(1, Math.min(3, level)) - 1] : ""); }

  var uid = 0;

  /* cylinder shading stops, top edge -> bottom edge, per material */
  var METAL = {
    bronze:  ["#4A230D", "#9A5427", "#E09A5E", "#FFE0BE", "#C47A3E", "#7A3C16", "#3A1A08", "#B8703A"],
    silver:  ["#3A4047", "#8E98A3", "#E4E9EE", "#FFFFFF", "#B6BEC7", "#6A727C", "#2E343A", "#A7B0BA"],
    gold:    ["#5A3905", "#B58309", "#F6CD55", "#FFF6CF", "#E0A92A", "#946A08", "#4A2F04", "#D9A933"],
    stone:   ["#4A4640", "#8C867C", "#BDB6AB", "#DCD6CC", "#A7A095", "#767067", "#3E3A35", "#9A9489"],
    diamond: ["#5AA9DC", "#BDEBFF", "#F4FDFF", "#FFFFFF", "#CBEFFF", "#86CDEF", "#4E9BCF", "#E0F7FF"],
    dark:    ["#020008", "#12062B", "#2A0F5C", "#5B2BC0", "#1D0A40", "#0B0320", "#010005", "#3C1A86"],
    brass:   ["#3E2A0C", "#7C5A22", "#C69A4A", "#EBD39A", "#A8813C", "#6A4B1A", "#33230A", "#9C7836"],
    iron:    ["#1E1D1C", "#4A4745", "#7C7874", "#9E9A95", "#66625E", "#3A3836", "#191817", "#5C5956"]
  };
  function cyl(id, s){
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + s[0] + '"/><stop offset=".14" stop-color="' + s[1] + '"/>' +
      '<stop offset=".3" stop-color="' + s[2] + '"/><stop offset=".38" stop-color="' + s[3] + '"/>' +
      '<stop offset=".5" stop-color="' + s[4] + '"/><stop offset=".78" stop-color="' + s[5] + '"/>' +
      '<stop offset=".93" stop-color="' + s[6] + '"/><stop offset="1" stop-color="' + s[7] + '"/></linearGradient>';
  }

  /* ---------- the shape: a contra-angle high-speed handpiece, drawn along +x, centred on y=0 ---------- */
  function modernParts(p, rich){
    var F = 'url(#' + p + 'g)', FD = 'url(#' + p + 'gd)';
    var s = '';
    // bur
    s += '<path d="M9.5 9 L12.5 9 L12.2 24 L11 28 L9.8 24 Z" fill="url(#' + p + 'bur)"/>';
    if (rich) s += '<path d="M10 13 L12 14.5 M10 16.5 L12 18 M10 20 L12 21.5" stroke="rgba(0,0,0,.35)" stroke-width=".7"/>';
    // head
    s += '<rect x="0" y="-13" width="22" height="23" rx="8" fill="' + F + '"/>';
    s += '<rect x="2" y="-14.5" width="18" height="4.5" rx="2.2" fill="' + FD + '"/>';
    // neck
    s += '<path d="M19 -7 C28 -6 38 -3 47 -1 L47 14 C38 12 28 9 19 6 Z" fill="' + F + '"/>';
    // body
    s += '<rect x="44" y="-3" width="84" height="19" rx="9.5" fill="' + F + '"/>';
    // grip rings
    for (var i = 0; i < 6; i++) s += '<rect x="' + (54 + i * 3.6) + '" y="-3" width="1.5" height="19" fill="rgba(0,0,0,.28)"/>';
    s += '<rect x="84" y="-3.5" width="3" height="20" rx="1.2" fill="' + FD + '"/>';
    // coupling + hose
    s += '<rect x="125" y="0" width="13" height="13" rx="3" fill="' + FD + '"/>';
    s += '<rect x="137" y="2" width="9" height="9" rx="2" fill="' + F + '"/>';
    return s;
  }
  function modernMask(){
    return '<rect x="0" y="-14.5" width="22" height="24.5" rx="8"/>' +
      '<path d="M19 -7 C28 -6 38 -3 47 -1 L47 14 C38 12 28 9 19 6 Z"/>' +
      '<rect x="44" y="-3.5" width="94" height="20" rx="9.5"/><rect x="137" y="2" width="9" height="9" rx="2"/>' +
      '<path d="M9.5 9 L12.5 9 L12.2 24 L11 28 L9.8 24 Z"/>';
  }

  /* ---------- the antique: a straight handpiece with a turned wooden grip and a belt pulley ---------- */
  function antiqueParts(p, rich){
    var s = '';
    s += '<path d="M-6 3.5 L6 2.4 L6 6.6 Z" fill="url(#' + p + 'iron)"/>';                      // bur
    s += '<path d="M5 0 L24 -4 L24 13 L5 9 Z" fill="url(#' + p + 'brass)"/>';                   // nose cone
    s += '<rect x="23" y="-6" width="7" height="21" rx="2" fill="url(#' + p + 'brass)"/>';        // collar
    s += '<path d="M29 -5 C50 -9 84 -9 104 -5 L104 14 C84 18 50 18 29 14 Z" fill="url(#' + p + 'wood)"/>'; // grip
    if (rich) {
      s += '<path d="M29 -5 C50 -9 84 -9 104 -5 L104 14 C84 18 50 18 29 14 Z" fill="url(#' + p + 'g)" opacity=".55" style="mix-blend-mode:multiply"/>';
      for (var i = 0; i < 3; i++) s += '<rect x="' + (40 + i * 22) + '" y="-7" width="2.4" height="23" rx="1" fill="rgba(40,20,5,.45)"/>';
    }
    s += '<rect x="103" y="-5" width="8" height="19" rx="2" fill="url(#' + p + 'brass)"/>';       // ferrule
    s += '<rect x="110" y="1" width="16" height="7" rx="2" fill="url(#' + p + 'iron)"/>';        // shaft
    // pulley wheel with spokes
    s += '<circle cx="134" cy="4.5" r="12" fill="url(#' + p + 'iron)"/>';
    s += '<circle cx="134" cy="4.5" r="8.5" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.2"/>';
    s += '<path d="M134 -7.5 V16.5 M122 4.5 H146 M125.5 -4 L142.5 13 M142.5 -4 L125.5 13" stroke="rgba(0,0,0,.4)" stroke-width="1.3"/>';
    s += '<circle cx="134" cy="4.5" r="2.6" fill="url(#' + p + 'brass)"/>';
    if (rich) s += '<path d="M146 -6 C152 -10 158 -14 162 -20" stroke="#5a4630" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>';
    return s;
  }
  function antiqueMask(){
    return '<path d="M-6 3.5 L6 2.4 L6 6.6 Z"/><path d="M5 0 L24 -4 L24 13 L5 9 Z"/><rect x="23" y="-6" width="7" height="21" rx="2"/>' +
      '<path d="M29 -5 C50 -9 84 -9 104 -5 L104 14 C84 18 50 18 29 14 Z"/><rect x="103" y="-5" width="8" height="19" rx="2"/>' +
      '<rect x="110" y="1" width="16" height="7" rx="2"/><circle cx="134" cy="4.5" r="12"/>';
  }

  /* ---------- textures (filters) ---------- */
  function filters(p, t, rich){
    if (!rich) return '';
    var light = '<feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="b"/>' +
      '<feSpecularLighting in="b" surfaceScale="3.2" specularConstant="1.05" specularExponent="22" lighting-color="#fff" result="sp">' +
      '<fePointLight x="10" y="-80" z="70"/></feSpecularLighting>' +
      '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>';
    var f = '';
    if (t === "bronze" || t === "silver" || t === "gold") {
      f = '<filter id="' + p + 'tex" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves="2" seed="4" result="n"/>' +
        '<feColorMatrix in="n" type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.45" result="streak"/>' +
        '<feComposite in="streak" in2="SourceAlpha" operator="in" result="st"/>' +
        '<feBlend in="SourceGraphic" in2="st" mode="overlay" result="brushed"/>' +
        (t === "bronze" ? '<feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="3" seed="9" result="pn"/>' +
          '<feColorMatrix in="pn" type="matrix" values="0 0 0 0 .3  0 0 0 0 .52  0 0 0 0 .44  0 0 0 24 -16.6" result="pat"/>' +
          '<feComposite in="pat" in2="SourceAlpha" operator="in" result="pati"/>' +
          '<feComposite in="pati" in2="brushed" operator="over" result="brushed2"/>' : '') +
        light +
        '<feComposite in="' + (t === "bronze" ? "brushed2" : "brushed") + '" in2="spi" operator="arithmetic" k1="0" k2="1" k3="' + (t === "silver" ? ".75" : ".6") + '" k4="0"/>' +
        '</filter>';
    } else if (t === "stone") {
      f = '<filter id="' + p + 'tex" x="-8%" y="-30%" width="116%" height="160%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="d"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="d" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="rough"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="7" result="g"/>' +
        '<feColorMatrix in="g" type="matrix" values="0 0 0 0 .14  0 0 0 0 .13  0 0 0 0 .12  0 0 0 16 -9.4" result="dark"/>' +
        '<feColorMatrix in="g" type="matrix" values="0 0 0 0 .9  0 0 0 0 .88  0 0 0 0 .84  0 0 0 -22 6.6" result="lite"/>' +
        '<feMerge result="spk"><feMergeNode in="dark"/><feMergeNode in="lite"/></feMerge>' +
        '<feComposite in="spk" in2="rough" operator="in" result="spki"/>' +
        '<feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="4" seed="11" result="v"/>' +
        '<feColorMatrix in="v" type="matrix" values="0 0 0 0 .16  0 0 0 0 .14  0 0 0 0 .12  0 0 0 -18 3.2" result="veins"/>' +
        '<feComposite in="veins" in2="rough" operator="in" result="veini"/>' +
        '<feMerge result="stone"><feMergeNode in="rough"/><feMergeNode in="veini"/><feMergeNode in="spki"/></feMerge>' +
        '<feGaussianBlur in="rough" stdDeviation="1.4" result="rb"/>' +
        '<feDiffuseLighting in="rb" surfaceScale="2.4" diffuseConstant="1.1" lighting-color="#fff" result="dl"><feDistantLight azimuth="235" elevation="48"/></feDiffuseLighting>' +
        '<feComposite in="stone" in2="dl" operator="arithmetic" k1="1.25" k2="0" k3="0" k4=".04" result="lit"/>' +
        '<feComposite in="lit" in2="rough" operator="in"/>' +
        '</filter>';
    } else if (t === "antique") {
      f = '<filter id="' + p + 'tex" x="-8%" y="-40%" width="116%" height="180%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.01 0.42" numOctaves="3" seed="2" result="grain"/>' +
        '<feColorMatrix in="grain" type="matrix" values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .03  0 0 0 2.6 -1.1" result="gr"/>' +
        '<feComposite in="gr" in2="SourceAlpha" operator="in" result="gri"/>' +
        '<feBlend in="SourceGraphic" in2="gri" mode="multiply" result="aged"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="15" result="rn"/>' +
        '<feColorMatrix in="rn" type="matrix" values="0 0 0 0 .42  0 0 0 0 .2  0 0 0 0 .07  0 0 0 20 -12.6" result="rust"/>' +
        '<feComposite in="rust" in2="SourceAlpha" operator="in" result="rusti"/>' +
        '<feMerge result="worn"><feMergeNode in="aged"/><feMergeNode in="rusti"/></feMerge>' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="b"/>' +
        '<feSpecularLighting in="b" surfaceScale="2.4" specularConstant=".55" specularExponent="12" lighting-color="#ffe7b8" result="sp"><fePointLight x="20" y="-70" z="60"/></feSpecularLighting>' +
        '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spi"/>' +
        '<feComposite in="worn" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".45" k4="0" result="lit"/>' +
        '<feColorMatrix in="lit" type="matrix" values=".9 .12 .03 0 0  .07 .86 .05 0 0  .05 .1 .7 0 0  0 0 0 1 0"/>' +
        '</filter>';
    } else if (t === "diamond") {
      f = '<filter id="' + p + 'tex" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB">' +
        light + '<feComposite in="SourceGraphic" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".9" k4="0"/></filter>';
    } else if (t === "dark") {
      f = '<filter id="' + p + 'tex" x="-5%" y="-30%" width="110%" height="160%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="4" seed="21" result="neb">' +
        (rich === "anim" ? '<animate attributeName="baseFrequency" dur="18s" values="0.035 0.06;0.045 0.05;0.035 0.06" repeatCount="indefinite"/>' : '') +
        '</feTurbulence>' +
        '<feColorMatrix in="neb" type="matrix" values="1.9 0 .4 0 -.55  0 .6 .9 0 -.35  .6 .2 2.1 0 -.35  1.6 0 1 0 -.95" result="nc"/>' +
        '<feComposite in="nc" in2="SourceAlpha" operator="in" result="nci"/>' +
        '<feBlend in="nci" in2="SourceGraphic" mode="screen" result="nebula"/>' +
        light +
        '<feComposite in="nebula" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0"/>' +
        '</filter>' +
        '<filter id="' + p + 'glow" x="-30%" y="-80%" width="160%" height="260%">' +
        '<feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feColorMatrix type="matrix" values="0 0 0 0 .55  0 0 0 0 .25  0 0 0 0 1  0 0 0 .9 0"/></filter>';
    }
    return f;
  }

  /* diamond: a faceted pattern laid over the body */
  function facets(p){
    var s = '<pattern id="' + p + 'fac" patternUnits="userSpaceOnUse" width="14" height="12" patternTransform="skewX(-18)">';
    s += '<path d="M0 0 L7 6 L0 12 Z" fill="#FFFFFF" opacity=".55"/><path d="M0 0 L14 0 L7 6 Z" fill="#7CCBFA" opacity=".6"/>';
    s += '<path d="M14 0 L14 12 L7 6 Z" fill="#3E98D6" opacity=".55"/><path d="M0 12 L7 6 L14 12 Z" fill="#E6FAFF" opacity=".6"/>';
    s += '<path d="M0 0 L14 12 M14 0 L0 12" stroke="#FFFFFF" stroke-width=".35" opacity=".9"/></pattern>';
    s += '<linearGradient id="' + p + 'rb" x1="0" y1="0" x2="1" y2="0">' +
      ['#FF7AD9', '#FFD36B', '#8CFFB0', '#6BD6FF', '#B28CFF', '#FF7AD9'].map(function(c, i){ return '<stop offset="' + (i / 5) + '" stop-color="' + c + '"/>'; }).join("") + '</linearGradient>';
    return s;
  }
  function sparkle(x, y, r, d, anim){
    var star = '<path d="M0 ' + (-r) + ' L' + (r * .22) + ' ' + (-r * .22) + ' L' + r + ' 0 L' + (r * .22) + ' ' + (r * .22) + ' L0 ' + r + ' L' + (-r * .22) + ' ' + (r * .22) + ' L' + (-r) + ' 0 L' + (-r * .22) + ' ' + (-r * .22) + ' Z" fill="#fff"/>';
    return '<g transform="translate(' + x + ' ' + y + ')"><g>' + star +
      (anim ? '<animateTransform attributeName="transform" type="scale" values="0;1;0;0" keyTimes="0;.12;.3;1" dur="3.2s" begin="' + d + 's" repeatCount="indefinite"/>' : '') +
      '</g></g>';
  }

  function art(tier, px, opt){
    opt = opt || {};
    tier = Math.max(0, Math.min(6, tier | 0));
    var t = TIERS[tier].key, p = "shr" + (++uid) + "-";
    var rich = px >= 40 ? (opt.animate ? "anim" : true) : false;
    var anim = rich === "anim";
    var mat = t === "antique" ? METAL.brass : METAL[t];
    var defs = cyl(p + "g", mat) + cyl(p + "gd", mat.map(function(c){ return shade(c, -0.22); }));
    defs += cyl(p + "bur", ["#606468", "#9aa0a6", "#e6e9ec", "#ffffff", "#b9bec3", "#80858a", "#4a4e52", "#9ca1a6"]);
    if (t === "antique") {
      defs += cyl(p + "brass", METAL.brass) + cyl(p + "iron", METAL.iron) +
        cyl(p + "wood", ["#2A1406", "#5C2F12", "#8A4B22", "#B4713C", "#7A4019", "#4E260C", "#231003", "#6A3816"]);
    }
    if (t === "diamond") defs += facets(p);
    defs += filters(p, t, rich);
    defs += '<clipPath id="' + p + 'clip">' + (t === "antique" ? antiqueMask() : modernMask()) + '</clipPath>';
    defs += '<linearGradient id="' + p + 'sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset=".5" stop-color="#fff" stop-opacity="' + (t === "diamond" ? ".95" : ".75") + '"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>';

    var parts = t === "antique" ? antiqueParts(p, rich) : modernParts(p, rich);
    var body = '<g' + (rich ? ' filter="url(#' + p + 'tex)"' : '') + '>' + parts + '</g>';
    var over = '';
    if (t === "diamond") {
      over += '<g clip-path="url(#' + p + 'clip)"><rect x="-10" y="-20" width="170" height="50" fill="url(#' + p + 'fac)"/>' +
        '<rect x="-10" y="-20" width="170" height="50" fill="url(#' + p + 'rb)" opacity=".22" style="mix-blend-mode:color"/></g>';
    }
    if (t === "dark" && rich) {
      var stars = "", seed = 7;
      for (var i = 0; i < 26; i++){ seed = (seed * 9301 + 49297) % 233280; var sx = (seed / 233280) * 150 - 4; seed = (seed * 9301 + 49297) % 233280; var sy = (seed / 233280) * 34 - 15;
        stars += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="' + (i % 5 === 0 ? .9 : .45) + '" fill="#fff" opacity="' + (i % 3 ? .75 : 1) + '">' +
          (anim && i % 4 === 0 ? '<animate attributeName="opacity" values="1;.2;1" dur="' + (2 + i % 3) + 's" repeatCount="indefinite"/>' : '') + '</circle>'; }
      over += '<g clip-path="url(#' + p + 'clip)">' + stars + '</g>';
    }
    // rim light: a thin bright line along the top of the body
    if (rich && t !== "antique" && t !== "stone") over += '<path d="M50 -1.6 H122" stroke="#fff" stroke-opacity="' + (t === "dark" ? ".35" : ".55") + '" stroke-width=".8" stroke-linecap="round"/>';
    // moving glint (metals, diamond, dark matter)
    if (anim && tier >= 2) {
      over += '<g clip-path="url(#' + p + 'clip)"><rect x="-40" y="-30" width="26" height="70" fill="url(#' + p + 'sheen)" transform="skewX(-22)" opacity="' + (t === "dark" ? ".5" : ".9") + '">' +
        '<animate attributeName="x" values="-60;190;190" keyTimes="0;.35;1" dur="' + (t === "diamond" || t === "dark" ? "3.6" : "4.6") + 's" repeatCount="indefinite"/></rect></g>';
    }
    if (t === "diamond" && rich) over += sparkle(18, -12, 5, 0, anim) + sparkle(98, -2, 4, 1.1, anim) + sparkle(64, 13, 3.2, 2.2, anim);
    if (t === "dark" && rich) over += sparkle(20, -12, 4, .4, anim) + sparkle(110, 10, 3, 1.7, anim);

    var under = t === "dark" && rich ? '<g filter="url(#' + p + 'glow)" opacity=".85">' + (t === "antique" ? antiqueMask() : modernMask()) +
      (anim ? '<animate attributeName="opacity" values=".55;.95;.55" dur="3s" repeatCount="indefinite"/>' : '') + '</g>' : '';
    // shadow under the tool
    var shadow = rich ? '<ellipse cx="72" cy="27" rx="64" ry="5" fill="#000" opacity=".35"/>' : '';

    var D = DISC[t], ring = t === "antique" ? METAL.brass : mat;
    defs += cyl(p + "ring", ring.map(function(c){ return shade(c, t === "dark" ? .08 : 0); }));
    defs += '<radialGradient id="' + p + 'disc" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="' + D[0] + '"/><stop offset=".55" stop-color="' + D[1] + '"/><stop offset="1" stop-color="' + D[2] + '"/></radialGradient>';
    defs += '<radialGradient id="' + p + 'spot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + D[3] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + D[3] + '" stop-opacity="0"/></radialGradient>';
    var disc = '<circle cx="64" cy="64" r="60" fill="url(#' + p + 'ring)"/>' +
      '<circle cx="64" cy="64" r="60" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/>' +
      '<circle cx="64" cy="64" r="' + (rich ? 53 : 50) + '" fill="url(#' + p + 'disc)"/>' +
      '<circle cx="64" cy="64" r="' + (rich ? 53 : 50) + '" fill="none" stroke="rgba(0,0,0,.5)" stroke-width="1.4"/>';
    if (rich) {
      disc += '<circle cx="64" cy="64" r="49" fill="none" stroke="' + D[3] + '" stroke-opacity=".28" stroke-width=".8" stroke-dasharray="1.2 2.4"/>' +
        '<ellipse cx="64" cy="60" rx="44" ry="30" fill="url(#' + p + 'spot)"/>';
      if (t === "dark") disc += '<g clip-path="url(#' + p + 'dclip)">' + discStars(34) + '</g>';
      defs += '<clipPath id="' + p + 'dclip"><circle cx="64" cy="64" r="53"/></clipPath>';
      // light on the ring
      disc += '<path d="M18 40 A52 52 0 0 1 56 8" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>';
    }
    /* level numeral: an engraved plaque on the rim (large), or a corner tag (small icons) */
    var over2 = '';
    if (opt.level) {
      var num = ROMAN[Math.max(1, Math.min(3, opt.level)) - 1];
      if (rich) {
        var pw = 14 + num.length * 8;
        disc += '<g transform="translate(64 113)"><rect x="' + (-pw / 2) + '" y="-11" width="' + pw + '" height="22" rx="6" fill="url(#' + p + 'ring)" stroke="rgba(0,0,0,.55)" stroke-width="1.2"/>' +
          '<rect x="' + (-pw / 2 + 2) + '" y="-9" width="' + (pw - 4) + '" height="18" rx="4.5" fill="' + D[2] + '" opacity=".88"/>' +
          '<text x="0" y="5.2" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="15" letter-spacing="1" fill="' + D[3] + '" stroke="rgba(0,0,0,.35)" stroke-width=".4">' + num + '</text></g>';
      }
    }
    var g = '<g clip-path="url(#' + p + 'dclip2)"><g transform="translate(' + (t === "antique" ? 22 : 19) + ' 84) rotate(-30) scale(' + (t === "antique" ? .66 : .7) + ')">' + shadow + under + body + over + '</g></g>';
    defs += '<clipPath id="' + p + 'dclip2"><circle cx="64" cy="64" r="' + (rich ? 60 : 58) + '"/></clipPath>';
    return '<svg class="sh-rank-art sh-rank-' + t + '" width="' + px + '" height="' + px + '" viewBox="0 0 128 128" role="img" aria-label="' +
      TIERS[tier].name + ' handpiece' + (opt.level ? ' ' + ROMAN[Math.max(1, Math.min(3, opt.level)) - 1] : '') + '"><defs>' + defs + '</defs>' + disc + g + over2 + '</svg>';
  }

  /* medallion interior: centre, mid, edge, spotlight colour */
  var DISC = {
    antique: ["#6B4A26", "#3A2511", "#1A0F05", "#F0C98A"],
    stone:   ["#5C5851", "#34312D", "#171614", "#E8E2D6"],
    bronze:  ["#5A2E14", "#2E1508", "#140802", "#FFB77A"],
    silver:  ["#46515E", "#222A33", "#0C1015", "#DDEBFA"],
    gold:    ["#5C400A", "#2D1E03", "#130C01", "#FFE08A"],
    diamond: ["#0F4A73", "#08263F", "#030E1A", "#9EE6FF"],
    dark:    ["#1C0B3D", "#090318", "#010006", "#B57BFF"]
  };
  function discStars(n){
    var s = "", seed = 3;
    for (var i = 0; i < n; i++){
      seed = (seed * 9301 + 49297) % 233280; var x = 12 + (seed / 233280) * 104;
      seed = (seed * 9301 + 49297) % 233280; var y = 12 + (seed / 233280) * 104;
      s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i % 6 === 0 ? .9 : .45) + '" fill="#fff" opacity="' + (i % 3 ? .55 : .9) + '"/>';
    }
    return s;
  }
  function shade(hex, amt){
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(c){ return Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))); }
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  /* trophies: key -> label, how to earn, icon; secret ones stay "???" until earned */
  var TROPHIES = [
    { k: "answers-100",  n: "First Hundred",        d: "Answer 100 questions",                 ic: "M5 12l4 4 10-10" },
    { k: "answers-1000", n: "Thousand Club",        d: "Answer 1,000 questions",               ic: "M4 17l4-9 4 6 3-4 5 7z" },
    { k: "days-7",       n: "Full Week",            d: "Study 7 days in a row",                ic: "M4 6h16v14H4zM4 10h16M9 3v5M15 3v5" },
    { k: "days-30",      n: "Iron Routine",         d: "Study 30 days in a row",               ic: "M12 3l2.6 5.5 6 .8-4.4 4.2 1 6-5.2-2.9-5.2 2.9 1-6L3.4 9.3l6-.8z" },
    { k: "run-25",       n: "Sharp Explorer",       d: "25 right answers in a row",            ic: "M4 20L14 10M14 10l3-6 3 3-6 3" },
    { k: "run-100",      n: "Tactical",             d: "100 right answers in a row",           ic: "M12 3v6M12 15v6M3 12h6M15 12h6M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" },
    { k: "mock90",       n: "Mock Ace",             d: "90%+ on a mock exam of 20+ questions", ic: "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16zM12 8v4l3 2" },
    { k: "arcade-25",    n: "Arcade Regular",       d: "Play 25 arcade games",                 ic: "M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3zM8 11v4M6 13h4M15 12h.01M17 14h.01" },
    { k: "golden",       n: "Golden Probe",         d: "Find the day's golden question first", ic: "M3 21l9-9M12 12l3-3c1-1 1-3 3-4l2-1", secret: true, clue: "One question in every hub turns gold each day. Be the first to get it right." },
    { k: "fairy",        n: "Tooth Fairy",          d: "Catch the Tooth Fairy",                ic: "M7 5c-2 0-3 1.5-3 3.5 0 2.5 1.2 3.5 1.6 5.5.4 2.5.8 5 2 5s1.5-2.4 1.8-4c.2-.8.5-1.2 1.6-1.2s1.4.4 1.6 1.2c.3 1.6.6 4 1.8 4s1.6-2.5 2-5c.4-2 1.6-3 1.6-5.5C20 6.5 19 5 17 5c-1.6 0-2.4.8-5 .8S8.6 5 7 5z", secret: true, clue: "Keep answering questions. Something small with wings is out there." },
    { k: "fairy-5",      n: "Fairy Collector",      d: "Catch the Tooth Fairy 5 times",        ic: "M12 3l2 4 4 .6-3 3 .8 4.4L12 13l-3.8 2 .8-4.4-3-3 4-.6z", secret: true, clue: "She comes back. Be quick, five times over." },
    { k: "boss",         n: "Final Blow",           d: "Land the last hit on a Plaque Boss",   ic: "M12 3c4 0 7 2.5 7 7 0 3-2 4-2 6H7c0-2-2-3-2-6 0-4.5 3-7 7-7zM9 11h.01M15 11h.01M9 20h6", secret: true, clue: "Wait until five or more classmates are online at once, then answer fast." },
    { k: "owl",          n: "Night Owl",            d: "Answer a question between 2 and 4 am", ic: "M5 4l3 3h8l3-3v9a7 7 0 0 1-14 0zM9.5 11a1.5 1.5 0 1 0 .01 0M14.5 11a1.5 1.5 0 1 0 .01 0", secret: true, clue: "Study while the rest of the class is asleep." },
    { k: "konami",       n: "Cheat Code",           d: "Enter the Konami code",                ic: "M12 4v16M12 4l-5 5M12 4l5 5", secret: true, clue: "Old-school gamers know it: ↑ ↑ ↓ ↓ ← → ← → B A. On a phone, swipe it and tap twice." },
    { k: "floss",        n: "Floss Boss",           d: "Type the magic word",                  ic: "M4 18c4-10 12-10 16 0M8 8l-2-4M16 8l2-4", secret: true, clue: "Type the one thing your hygienist always asks whether you have been doing." },
    { k: "prof",         n: "Office Hours",         d: "Get a professor to quote themselves",  ic: "M4 5h16v11H9l-5 4zM8 10h8", secret: true, clue: "Professors repeat themselves. Tap one's name, a few times, quickly." },
    { k: "rootcanal",    n: "Through the Root Canal", d: "10 misses, then 10 right in a row",  ic: "M9 4v6l-3 10M15 4v6l3 10M9 10h6", secret: true, clue: "Go all the way down, then all the way back up. Ten each way." }
  ];
  var MASTERY = [
    { k: "mastery-bronze", n: "Bronze", pct: .5 }, { k: "mastery-silver", n: "Silver", pct: .75 },
    { k: "mastery-gold", n: "Gold", pct: .9 }, { k: "mastery-crown", n: "Crown", pct: 1 }
  ];

  /* ---------- unlockable accent colours (cosmetic; each needs that tier or higher) ---------- */
  var ACCENTS = {
    bronze:  { tier: 2, L: ["#A5602A", "#85491B", "#F3E1D0"], D: ["#E09A5E", "#F2BE8F", "#3A2415"] },
    silver:  { tier: 3, L: ["#5F6B78", "#4A5561", "#E3E7EB"], D: ["#B7C1CC", "#D6DDE4", "#262C33"] },
    gold:    { tier: 4, L: ["#A67808", "#7F5B04", "#F6EAC6"], D: ["#E8BE45", "#F5D77E", "#3A2E0E"] },
    diamond: { tier: 5, L: ["#1F8FC7", "#16719F", "#D9F0FB"], D: ["#7FD3F7", "#B3E7FC", "#10303F"] },
    dark:    { tier: 6, L: ["#6A35E0", "#5426B8", "#E7DDFB"], D: ["#A77BFF", "#C6A8FF", "#251540"] }
  };
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function applyAccent(key){
    var el = document.getElementById("sh-rank-accent");
    var a = ACCENTS[key], known = +(ls("sh_rank_tier") || 0);
    if (!a || known < a.tier) { if (el) el.remove(); return; }
    function v(c){ return "--accent:" + c[0] + ";--accent-ink:" + c[1] + ";--accent-soft:" + c[2] + ";"; }
    var css = 'html:root{' + v(a.L) + '}@media (prefers-color-scheme: dark){html:root:not([data-theme="light"]){' + v(a.D) + '}}html:root[data-theme="dark"]{' + v(a.D) + '}';
    if (!el) { el = document.createElement("style"); el.id = "sh-rank-accent"; document.head.appendChild(el); }
    el.textContent = css;
  }

  function svgDataUri(svg){ return 'url("data:image/svg+xml,' + encodeURIComponent(svg.replace(/ class="[^"]*"/, ' xmlns="http://www.w3.org/2000/svg"')) + '")'; }
  function fmt(n){ return Math.round(n || 0).toLocaleString(); }

  /* ---------- the hub widget: rank card, hub mastery, trophy case, link devices, accent unlocks ---------- */
  function mount(H){
    if (!H || window.__shRanksMounted) return;
    window.__shRanksMounted = true;
    var SB = H.supabase, esc = H.esc;
    applyAccent(ls("sh_pref_accent"));
    if (!SB) return;
    function rpc(name, args){ return SB.rpc(name, args).then(function(r){ return r && !r.error ? r.data : null; }, function(){ return null; }); }
    var profile = null, mastery = null;

    var panel = H.statsPanel();
    var sec = document.createElement("div");
    sec.className = "shstat-sec sh-rank-sec"; sec.id = "sh-rank-sec";
    sec.innerHTML = '<div class="shstat-empty">Loading your rank…</div>';
    if (panel) { var first = panel.querySelector(".shstat-sec"); panel.insertBefore(sec, first || null); }

    /* Settings: accent colours */
    var settings = document.getElementById("shstat-settingspanel");
    var accRow = document.createElement("div");
    accRow.className = "shset-row sh-accent-row";
    if (settings) { var eggsRow = settings.querySelector('[data-pref="eggs"]'); settings.insertBefore(accRow, eggsRow ? eggsRow.closest(".shset-row") : null); }
    function drawAccents(){
      var have = profile ? profile.tier : +(ls("sh_rank_tier") || 0), cur = ls("sh_pref_accent") || "default";
      accRow.innerHTML = '<label>Accent colour</label><div class="sh-accent-swatches">' +
        '<button type="button" data-acc="default" aria-pressed="' + (cur === "default") + '" title="The hub\'s own colour"><span class="sh-acc-dot sh-acc-default"></span>Hub</button>' +
        Object.keys(ACCENTS).map(function(k){
          var a = ACCENTS[k], locked = have < a.tier;
          return '<button type="button" data-acc="' + k + '" aria-pressed="' + (cur === k) + '"' + (locked ? ' disabled title="Unlocks at ' + TIERS[a.tier].name + '"' : '') + '>' +
            '<span class="sh-acc-dot" style="background:' + a.L[0] + '"></span>' + TIERS[a.tier].name + (locked ? ' <svg class="sh-acc-lock" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' : '') + '</button>';
        }).join("") + '</div><div class="shset-hint">Unlocked by your handpiece rank. Changes the highlight colour in every hub.</div>';
    }
    accRow.addEventListener("click", function(e){
      var b = e.target.closest("[data-acc]"); if (!b || b.disabled) return;
      var k = b.getAttribute("data-acc"); ls("sh_pref_accent", k === "default" ? null : k); applyAccent(k); drawAccents();
    });
    drawAccents();

    /* the little handpiece next to your name */
    function badgeIcon(t){
      var uri = svgDataUri(art(t, 20));
      ["sh-ribbon-name", "shname-badge"].forEach(function(id){
        var el = document.getElementById(id); if (!el) return;
        el.classList.add("sh-has-rank"); el.style.setProperty("--sh-rank-img", uri); el.setAttribute("data-rank", TIERS[t].name);
        if (profile && profile.level) el.setAttribute("data-rank-lv", ROMAN[profile.level - 1]);
      });
    }

    function masteryFor(){
      var bank = ((window.SH_EXPORT || {}).questions || []).length;
      var row = (mastery || []).filter(function(r){ return r.hub === H.hub; })[0];
      var got = row ? row.latest_correct : 0, pct = bank ? got / bank : 0, lvl = -1;
      MASTERY.forEach(function(m, i){ if (bank && pct >= m.pct) lvl = i; });
      return { bank: bank, got: got, pct: pct, lvl: lvl };
    }
    function trophyHTML(tr, earned){
      var hidden = tr.secret && !earned;
      return '<button type="button" class="sh-trophy' + (earned ? " is-earned" : "") + '" data-trophy="' + tr.k + '" title="' + esc(hidden ? "Secret: tap for a clue" : tr.d) + '">' +
        '<span class="sh-trophy-medal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        (hidden ? '<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5h.01"/>' : '<path d="' + tr.ic + '"/>') + '</svg></span>' +
        '<span class="sh-trophy-name">' + esc(hidden ? "???" : tr.n) + '</span></button>';
    }
    function render(){
      if (!profile) return;
      var t = profile.tier || 0, xp = profile.xp || 0, next = profile.next_at, at = profile.step_at != null ? profile.step_at : (profile.tier_at || 0);
      var lvl = profile.level || 1, step = profile.step != null ? profile.step : t * 3;
      var pct = next ? Math.max(0, Math.min(1, (xp - at) / (next - at))) : 1;
      var m = masteryFor(), badges = profile.badges || [];
      var h = '<div class="sh-rank-card sh-tier-' + TIERS[t].key + '">' +
        '<div class="sh-rank-art-wrap">' + art(t, 108, { animate: true, level: lvl }) + '</div>' +
        '<div class="sh-rank-info"><div class="sh-rank-eyebrow">Your handpiece</div>' +
        '<div class="sh-rank-name">' + rankName(t, lvl) + '</div>' +
        '<div class="sh-rank-xp"><b>' + fmt(xp) + '</b> XP' + (profile.position ? ' · #' + profile.position + ' of ' + profile.of : '') + '</div>' +
        '<div class="sh-rank-bar"><i style="width:' + (pct * 100).toFixed(1) + '%"></i></div>' +
        '<div class="sh-rank-next">' + (next ? fmt(next - xp) + ' XP to ' + rankName(Math.floor((step + 1) / 3), (step + 1) % 3 + 1) : 'The highest rank there is.') + '</div></div></div>';
      if (m.bank) {
        h += '<div class="sh-mastery"><div class="sh-mastery-top"><span>Mastery in this hub</span><b>' + Math.round(m.pct * 100) + '%' + (m.lvl >= 0 ? ' · ' + MASTERY[m.lvl].n : '') + '</b></div>' +
          '<div class="sh-mastery-bar"><i style="width:' + (m.pct * 100).toFixed(1) + '%"></i>' +
          MASTERY.map(function(x, i){ return '<span class="sh-mastery-tick' + (m.lvl >= i ? ' is-hit' : '') + '" style="left:' + (x.pct * 100) + '%" title="' + x.n + ' at ' + Math.round(x.pct * 100) + '%"></span>'; }).join("") +
          '</div><div class="sh-mastery-note">' + fmt(m.got) + ' of ' + fmt(m.bank) + ' questions right on your latest try. Bronze 50% · Silver 75% · Gold 90% · Crown 100%.</div></div>';
      }
      var earned = {}; badges.forEach(function(b){ earned[b.split(":")[0]] = true; });
      h += '<div class="sh-trophies-h"><span>Trophy case</span><b>' + TROPHIES.filter(function(x){ return earned[x.k]; }).length + ' / ' + TROPHIES.length + '</b></div>' +
        '<div class="sh-trophies">' + TROPHIES.map(function(x){ return trophyHTML(x, earned[x.k]); }).join("") + '</div>' +
        '<p class="sh-trophy-detail" aria-live="polite">' + psst(earned) + '</p>' +
        '<details class="sh-rank-how"><summary>How XP works</summary><p>10 XP the first time you get a question right, 2 for any other right answer, 1 for a miss (effort counts), and 20 for every day you study. Answer XP is capped at 600 a day, so steady studying beats cramming. Each rank has three levels (I, II, III). Ranks start at: ' +
        TIERS.map(function(x){ return x.name + ' ' + fmt(x.at); }).join(" · ") + ' XP.</p></details>' +
        '<div class="sh-link"><button type="button" class="sh-link-toggle" aria-expanded="false">Link my devices</button><div class="sh-link-body" hidden></div></div>';
      sec.innerHTML = h;
      // hub mastery tiers become trophies on the server once reached
      for (var i = 0; i <= m.lvl; i++) {
        var key = MASTERY[i].k;
        if (badges.indexOf(key + ":" + H.hub) < 0) rpc("record_achievement", { p_visitor: H.visitor, p_kind: key, p_hub: H.hub });
      }
    }

    function levelToast(t, lvl){
      if (H.prefGet("sh_pref_eggs", "on") === "off") return;
      var d = document.createElement("div");
      d.className = "sh-egg sh-egg-toast is-gold"; d.setAttribute("role", "status");
      d.innerHTML = '<span class="sh-egg-ic" style="width:44px;height:44px">' + art(t, 44, { level: lvl }) + '</span><span><b>' + rankName(t, lvl) + '</b><small>Level up. Keep going.</small></span>';
      document.body.appendChild(d);
      requestAnimationFrame(function(){ d.classList.add("is-shown"); });
      setTimeout(function(){ d.classList.remove("is-shown"); setTimeout(function(){ d.remove(); }, 350); }, 4200);
    }
    /* a clue for one secret you haven't found yet, different on each open */
    function psst(earned){
      var left = TROPHIES.filter(function(x){ return x.secret && !earned[x.k]; });
      if (!left.length) return "You've found every secret. Tap a trophy to see what it's for.";
      var x = left[Math.floor(Math.random() * left.length)];
      return '<b>Psst.</b> ' + esc(x.clue) + ' <span class="sh-trophy-hint">Tap any trophy for more.</span>';
    }
    sec.addEventListener("click", function(e){
      var b = e.target.closest("[data-trophy]"); if (!b || !profile) return;
      var tr = TROPHIES.filter(function(x){ return x.k === b.getAttribute("data-trophy"); })[0]; if (!tr) return;
      var got = (profile.badges || []).some(function(k){ return k.split(":")[0] === tr.k; });
      sec.querySelectorAll("[data-trophy]").forEach(function(x){ x.classList.toggle("is-sel", x === b); });
      sec.querySelector(".sh-trophy-detail").innerHTML = got ? '<b>' + esc(tr.n) + '.</b> ' + esc(tr.d) + '. Earned.'
        : tr.secret ? '<b>Secret.</b> ' + esc(tr.clue) : '<b>' + esc(tr.n) + '.</b> ' + esc(tr.d) + '.';
    });
    function celebrate(t){
      if (H.prefGet("sh_pref_eggs", "on") === "off") return;
      var d = document.createElement("div");
      d.className = "sh-egg sh-rankup"; d.setAttribute("role", "status");
      d.innerHTML = '<div class="sh-rankup-card sh-tier-' + TIERS[t].key + '">' + art(t, 150, { animate: true }) + '<div class="sh-rank-eyebrow">New rank</div><div class="sh-rank-name">' +
        TIERS[t].name + ' I</div><p>' + (ACCENTS[TIERS[t].key] ? "You also unlocked the " + TIERS[t].name + " accent colour in Settings." : "Keep going.") + '</p><button type="button">Nice</button></div>';
      document.body.appendChild(d);
      requestAnimationFrame(function(){ d.classList.add("is-shown"); });
      H.confetti(); setTimeout(H.confetti, 400);
      d.addEventListener("click", function(e){ if (e.target === d || e.target.closest("button")) { d.classList.remove("is-shown"); setTimeout(function(){ d.remove(); }, 300); } });
    }

    var loading = false;
    function load(){
      if (loading) return; loading = true;
      Promise.all([rpc("get_rank_profile", { p_visitor: H.visitor }), rpc("get_hub_mastery", { p_visitor: H.visitor })]).then(function(r){
        loading = false;
        if (!r[0]) { if (!profile) sec.innerHTML = '<div class="shstat-empty">Ranks load when you are online.</div>'; return; }
        profile = r[0]; mastery = r[1] || [];
        var prev = ls("sh_rank_tier"), prevStep = ls("sh_rank_step"), stepNow = profile.step != null ? profile.step : (profile.tier || 0) * 3;
        ls("sh_rank_tier", String(profile.tier || 0)); ls("sh_rank_step", String(stepNow));
        if (prev !== null && (profile.tier || 0) > +prev) celebrate(profile.tier);
        else if (prevStep !== null && stepNow > +prevStep) levelToast(profile.tier || 0, profile.level || 1);
        badgeIcon(profile.tier || 0); render(); drawAccents();
      });
    }
    load();
    var sinceLoad = 0;
    document.addEventListener(H.answeredEvent, function(){ if (++sinceLoad >= 10) { sinceLoad = 0; setTimeout(load, 1500); } });
    document.addEventListener("click", function(e){
      if (e.target.closest && e.target.closest("#shstat-stats-pill")) setTimeout(load, 50);
    });
    document.addEventListener("sh:mock-done", function(e){
      var d = e.detail || {};
      if (d.total >= 20 && d.correct / d.total >= 0.9) rpc("record_achievement", { p_visitor: H.visitor, p_kind: "mock90", p_hub: H.hub }).then(function(){ setTimeout(load, 800); });
    });

    /* link my devices */
    sec.addEventListener("click", function(e){
      var tg = e.target.closest(".sh-link-toggle");
      var body = sec.querySelector(".sh-link-body");
      if (tg) {
        var open = body.hidden; body.hidden = !open; tg.setAttribute("aria-expanded", String(open));
        if (open) body.innerHTML = '<p>Use one rank, streak and trophy case on your phone and laptop. Your in-hub progress bars stay per device.</p>' +
          '<div class="sh-link-step"><b>1. On the device you use most</b><button type="button" class="sh-link-make">Get a code</button><div class="sh-link-code" aria-live="polite"></div></div>' +
          '<div class="sh-link-step"><b>2. On your other device</b><div class="sh-link-enter"><input type="text" maxlength="7" autocomplete="one-time-code" autocapitalize="characters" placeholder="Code" aria-label="Link code"><button type="button" class="sh-link-go">Link</button></div>' +
          '<div class="sh-link-msg" aria-live="polite"></div></div>';
        return;
      }
      if (e.target.closest(".sh-link-make")) {
        var out = sec.querySelector(".sh-link-code"); out.textContent = "…";
        rpc("create_link_code", { p_visitor: H.visitor }).then(function(c){
          out.innerHTML = c ? '<span class="sh-link-big">' + esc(c.slice(0, 3) + " " + c.slice(3)) + '</span><small>Enter it on your other device in the next 10 minutes.</small>' : "Couldn’t make a code. Are you online?";
        });
        return;
      }
      if (e.target.closest(".sh-link-go")) {
        var inp = sec.querySelector(".sh-link-enter input"), msg = sec.querySelector(".sh-link-msg");
        var code = (inp.value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (code.length !== 6) { msg.textContent = "Codes are 6 letters and numbers."; return; }
        msg.textContent = "Linking…";
        rpc("redeem_link_code", { p_code: code, p_visitor: H.visitor }).then(function(id){
          if (!id) { msg.textContent = "That code didn’t work. Codes last 10 minutes; make a fresh one and try again."; return; }
          if (id === H.visitor) { msg.textContent = "This device already uses that code’s account."; return; }
          ls("sh_visitor_id", id); ls("sh_display_name", null); ls("sh_rank_tier", null);
          rpc("get_display_name", { p_visitor: id }).then(function(n){
            if (n) ls("sh_display_name", n);
            msg.textContent = "Linked! Reloading…";
            setTimeout(function(){ location.reload(); }, 900);
          });
        });
      }
    });
  }

  var miniCache = {};
  window.shRanks = {
    TIERS: TIERS, TROPHIES: TROPHIES, MASTERY: MASTERY,
    art: art,
    mini: function(tier, level){
      tier = Math.max(0, Math.min(6, tier | 0)); level = level ? Math.max(1, Math.min(3, level | 0)) : 0;
      var k = tier + ":" + level;
      return miniCache[k] || (miniCache[k] = '<span class="sh-rank-mini" title="' + rankName(tier, level) + '">' + art(tier, 20) +
        (level ? '<b class="sh-rank-lv sh-lv-' + TIERS[tier].key + '">' + ROMAN[level - 1] + '</b>' : '') + '</span>');
    },
    mount: mount, applyAccent: applyAccent, svgDataUri: svgDataUri, rankName: rankName,
    tierFor: function(xp){ var t = 0; TIERS.forEach(function(x, i){ if (xp >= x.at) t = i; }); return t; },
    levelFor: function(xp){ var t = this.tierFor(xp), lo = TIERS[t].at, hi = t < 6 ? TIERS[t + 1].at : 125000; return Math.min(3, 1 + Math.floor((xp - lo) * 3 / (hi - lo))); },
    shade: shade
  };
})();
