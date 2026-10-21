/* study-hubs easter eggs. Loaded by widget/v3.js, which hands over window.shEggHooks.
   Everything here is optional fun: it switches off with Settings → Surprises, never shows
   during a mock exam, and every network call is best-effort.

   - Golden Probe: one taught question per hub per day is secretly golden; first right answer claims it
   - Tooth Fairy: rare flutter across the screen after an answer; tap to catch (collectors board in Stats)
   - Plaque Boss: with 5+ classmates online, correct answers chip away at a shared boss
   - Professor soundboard: tap a professor's name 5 times for one of their exam-hint quotes
   - Night Owl (answering 2-4 am), Through the Root Canal (10 wrong, then 10 right)
   - Konami code → 8-bit mode (keyboard, or on a phone: swipe up up down down left right left right, tap tap);
     type "floss" for a dancing tooth (three classmates flossing in the same hub within a minute make a Floss Chain)
   - type "mirror": the hub flips left-to-right, the way the mouth looks in a dental mirror
   - Full Arch: every right answer grows a tooth in a little arch, every miss knocks one out; fill all 32
   - Cavity Search: each week a tiny cavity hides in one paragraph of each hub's Lecture Notes; the first five to tap it fill it
   - Holidays (Halloween, Thanksgiving, winter break, New Year, Valentine's, Dentist's Day, St Patrick's, Easter): themed
     confetti and Plaque Boss, plus a magic word per holiday
   Magic words also work typed into the hub's Search box, which is how they work on a phone.
   Everything announces itself as a "sh:egg-local" event so the tooth buddy (widget/pet.js) can react. */
(function(){
  "use strict";
  var H = window.shEggHooks;
  if (!H || window.__shEggs) return;
  window.__shEggs = true;

  var SB = H.supabase, HUB = H.hub, VISITOR = H.visitor;
  var esc = H.esc;
  function on(){ return H.prefGet("sh_pref_eggs", "on") !== "off"; }
  function inMock(){ try { return /(^|\/)mock/.test(String(H.section() || "")); } catch (e) { return false; } }
  function ok(){ return on() && !inMock(); }
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function rpc(name, args){
    if (!SB) return Promise.resolve(null);
    return SB.rpc(name, args).then(function(r){ return r && !r.error ? r.data : null; }, function(){ return null; });
  }
  function exp(){ return window.SH_EXPORT || {}; }
  /* the class is in Birmingham; days roll over on Central time, same as the server */
  function centralParts(){
    var f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
    var p = {}; f.formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
    return { day: p.year + "-" + p.month + "-" + p.day, hour: +p.hour };
  }
  function hash(s){ var h = 2166136261; for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /* tell the tooth buddy (widget/pet.js) and anything else listening */
  function announce(t, extra){
    var d = { t: t }; if (extra) for (var k in extra) d[k] = extra[k];
    try { document.dispatchEvent(new CustomEvent("sh:egg-local", { detail: d })); } catch (e) {}
  }

  var IC = {
    get probe(){ return probeArt(); },
    tooth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 3 1 6.5 2.5 6.5s1.8-3 2.2-5c.2-1 .6-1.5 2.3-1.5s2.1.5 2.3 1.5c.4 2 .7 5 2.2 5s2-3.5 2.5-6.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/></svg>',
    wing: '<svg viewBox="0 0 48 40"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path class="egg-wl" d="M18 16C10 4 1 6 2 14c1 6 9 7 16 4"/><path class="egg-wr" d="M30 16C38 4 47 6 46 14c-1 6-9 7-16 4"/><path fill="var(--egg-fairy-fill,#fff)" d="M17 9c-2 0-3.5 1.5-3.5 3.5 0 2 1 3 1.4 4.8.4 2.2.7 4.7 1.8 4.7s1.3-2.2 1.6-3.6c.1-.7.4-1.1 1.7-1.1s1.6.4 1.7 1.1c.3 1.4.5 3.6 1.6 3.6s1.4-2.5 1.8-4.7c.4-1.8 1.4-2.8 1.4-4.8C30 10.5 28.5 9 26.5 9c-1.5 0-2.2.7-3.6.7S18.5 9 17 9z" transform="translate(2 8)"/></g><g fill="currentColor"><circle cx="8" cy="30" r="1"/><circle cx="41" cy="33" r="1.2"/><circle cx="24" cy="4" r="1"/></g></svg>',
    blob: '<svg viewBox="0 0 40 40"><path fill="currentColor" d="M20 4c6 0 8 4 12 5s5 6 4 10 2 8-2 12-9 2-14 4-9-1-12-5-4-8-3-12 2-9 6-11 5-3 9-3z"/><circle cx="14" cy="17" r="3" fill="var(--egg-boss-eye,#fff)"/><circle cx="26" cy="17" r="3" fill="var(--egg-boss-eye,#fff)"/><circle cx="14.6" cy="17.6" r="1.4"/><circle cx="26.6" cy="17.6" r="1.4"/><path d="M13 27c3-2.5 11-2.5 14 0" stroke="var(--egg-boss-eye,#fff)" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    owl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 4l3 3h8l3-3v9a7 7 0 0 1-14 0z"/><circle cx="9.5" cy="11" r="2"/><circle cx="14.5" cy="11" r="2"/><path d="M11 14.5l1 1.2 1-1.2"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18v-5c0-4 2-7 6-8l.7 1.6C8.3 7.6 7.5 9.3 7.5 11H10v7zm10 0v-5c0-4 2-7 6-8l.7 1.6c-2.4 1-3.2 2.7-3.2 4.4H20v7z"/></svg>',
    mirror: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="9" r="5.5"/><path d="M6.5 7.2a3 3 0 0 1 2.6-1.6"/><path d="M13 13l8 8"/></svg>',
    arch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 17C3.5 9 7 4 12 4s8.5 5 8.5 13"/><path d="M6 16.4v-2.6M9 15.2v-3M12 15v-3.4M15 15.2v-3M18 16.4v-2.6"/></svg>',
    cavity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 3 1 6.5 2.5 6.5s1.8-3 2.2-5c.2-1 .6-1.5 2.3-1.5s2.1.5 2.3 1.5c.4 2 .7 5 2.2 5s2-3.5 2.5-6.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/><path d="M12.6 7.4c1.4-.2 2.4.8 2 2-.5 1.2-2.2 1.4-2.8.4-.5-.8-.2-2.2.8-2.4z" fill="currentColor"/></svg>',
    root: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7 .5 3 1 6.5 2.5 6.5s1.8-3 2.2-5c.2-1 .6-1.5 2.3-1.5s2.1.5 2.3 1.5c.4 2 .7 5 2.2 5s2-3.5 2.5-6.5c.5-2.5 2-4 2-7C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/><path d="M9.5 8.5l1 8M14.5 8.5l-1 8"/></svg>'
  };

  /* ---------- drawn art (2026-10-20): the Golden Probe, the Tooth Fairy and the boss lineup ----------
     Each copy gets its own gradient ids (uid), because a toast that defined them can leave the page. */
  var UID = 0;
  function uid(p){ return p + (++UID).toString(36); }
  function sparkle(x, y, r, fill){ return '<path d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="' + fill + '"/>'; }
  /* a gold periodontal probe: knurled handle, ferrule, a bent shank and a tip banded at the millimeter marks */
  function probeArt(){
    var g = uid("gp"), h = uid("gh");
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><defs>' +
      '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".35" stop-color="#F5C842"/><stop offset=".7" stop-color="#C08A12"/><stop offset="1" stop-color="#8A5E06"/></linearGradient>' +
      '<radialGradient id="' + h + '" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE68A" stop-opacity=".75"/><stop offset="1" stop-color="#FFE68A" stop-opacity="0"/></radialGradient></defs>' +
      '<circle cx="24" cy="24" r="22" fill="url(#' + h + ')"/>' +
      '<g transform="rotate(-42 24 24)">' +
        '<rect x="1" y="20.6" width="23" height="6.8" rx="3.4" fill="url(#' + g + ')" stroke="#7A5205" stroke-width=".8"/>' +
        '<path d="M5 21.2v5.6M8 21v6M11 21v6M14 21v6M17 21v6M20 21.2v5.6" stroke="#8A5E06" stroke-width=".9" opacity=".55"/>' +
        '<path d="M3 22.4h19" stroke="#FFF8D6" stroke-width="1" stroke-linecap="round" opacity=".8"/>' +
        '<rect x="23.4" y="21.8" width="3.6" height="4.4" rx="1" fill="url(#' + g + ')" stroke="#7A5205" stroke-width=".7"/>' +
        '<path d="M27 24H36.5Q40 24 41.6 27.2L44.6 33.4" fill="none" stroke="#7A5205" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M27 24H36.5Q40 24 41.6 27.2L44.6 33.4" fill="none" stroke="url(#' + g + ')" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M42.3 28.7l.7 1.4M43.2 30.5l.5 1M44 32.1l.5 1" stroke="#3A2A05" stroke-width="1.7" stroke-linecap="butt"/>' +
      '</g>' +
      sparkle(37, 8, 4.2, "#FFE36B") + sparkle(43.5, 17, 2.6, "#FFF3B0") + sparkle(9, 9, 2.8, "#FFE36B") + sparkle(30, 41, 2.2, "#FFF3B0") +
      '</svg>';
  }
  /* the Tooth Fairy: a little tooth with a face, veined wings, a wand and a crown; v = her look for this flight */
  var FAIRY_LOOKS = [
    { id: "rose",  wing: "#FFB8D9", vein: "#E0609E", cheek: "#FF8FB1", crown: "tiara" },
    { id: "lilac", wing: "#D9C2FF", vein: "#8E62D9", cheek: "#FF9EC4", crown: "flowers" },
    { id: "mint",  wing: "#BFF3DC", vein: "#2FA77A", cheek: "#FF9EB0", crown: "bow" },
    { id: "sky",   wing: "#BFE3FF", vein: "#3F8FD9", cheek: "#FFA3B5", crown: "tiara" },
    { id: "peach", wing: "#FFD6B0", vein: "#E07A2F", cheek: "#FF8F8F", crown: "flowers" },
    { id: "gold",  wing: "#FFE68A", vein: "#C08A12", cheek: "#FFB070", crown: "tiara", rare: true }
  ];
  function fairyArt(v){
    var w = uid("fw"), b = uid("fb");
    var crown = v.crown === "tiara" ? '<path d="M27.5 13.2l1.4-3.6 1.8 2.4 1.3-3.4 1.3 3.4 1.8-2.4 1.4 3.6z" fill="#F6CD55" stroke="#B8860B" stroke-width=".6" stroke-linejoin="round"/><circle cx="32" cy="8.6" r=".9" fill="#FF5FAE"/>'
      : v.crown === "flowers" ? '<g stroke="none"><circle cx="27.8" cy="12.6" r="1.6" fill="#FF8FB1"/><circle cx="31" cy="11.4" r="1.7" fill="#FFE36B"/><circle cx="34.4" cy="11.6" r="1.6" fill="#B08CFF"/><circle cx="37" cy="13" r="1.4" fill="#8FD3F5"/></g>'
      : '<path d="M29 12.4l-3-2v4zM35 12.4l3-2v4z" fill="' + v.vein + '"/><circle cx="32" cy="12.4" r="1.3" fill="' + v.vein + '"/>';
    return '<svg viewBox="0 0 64 54" aria-hidden="true"><defs>' +
      '<linearGradient id="' + w + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="' + v.wing + '" stop-opacity=".85"/></linearGradient>' +
      '<linearGradient id="' + b + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="' + (v.rare ? "#FFE9A8" : "#EEF2F6") + '"/></linearGradient></defs>' +
      '<g class="egg-wl"><path d="M26 22C17 6 4 6 4 15c0 7 11 10 22 8z" fill="url(#' + w + ')" stroke="' + v.vein + '" stroke-width="1"/><path d="M25 21.5C17 12 10 11 8 14M25 22.4C16 19 11 18 8.4 19" stroke="' + v.vein + '" stroke-width=".7" fill="none" opacity=".7"/>' +
        '<path d="M26 25C19 30 11 35 9 30c-1.5-4 8-6 17-5z" fill="url(#' + w + ')" stroke="' + v.vein + '" stroke-width=".9"/></g>' +
      '<g class="egg-wr"><path d="M38 22C47 6 60 6 60 15c0 7-11 10-22 8z" fill="url(#' + w + ')" stroke="' + v.vein + '" stroke-width="1"/><path d="M39 21.5C47 12 54 11 56 14M39 22.4C48 19 53 18 55.6 19" stroke="' + v.vein + '" stroke-width=".7" fill="none" opacity=".7"/>' +
        '<path d="M38 25C45 30 53 35 55 30c1.5-4-8-6-17-5z" fill="url(#' + w + ')" stroke="' + v.vein + '" stroke-width=".9"/></g>' +
      '<path d="M25.6 14c-3 0-4.6 2.2-4.6 5 0 3.4 1.7 5 2.3 7.8.6 3.2 1 7.4 2.7 7.4s2-3.2 2.4-5.3c.2-1.1.6-1.6 3.6-1.6s3.4.5 3.6 1.6c.4 2.1.7 5.3 2.4 5.3s2.1-4.2 2.7-7.4c.6-2.8 2.3-4.4 2.3-7.8 0-2.8-1.6-5-4.6-5-2.3 0-3.2 1-6.4 1s-4.1-1-6.4-1z" fill="url(#' + b + ')" stroke="#6B7C8C" stroke-width="1.1" stroke-linejoin="round"/>' +
      crown +
      '<circle cx="28.6" cy="20.4" r="1.25" fill="#2B2B33"/><circle cx="35.4" cy="20.4" r="1.25" fill="#2B2B33"/><circle cx="29" cy="20" r=".4" fill="#fff"/><circle cx="35.8" cy="20" r=".4" fill="#fff"/>' +
      '<ellipse cx="26.4" cy="23" rx="1.6" ry="1" fill="' + v.cheek + '" opacity=".7"/><ellipse cx="37.6" cy="23" rx="1.6" ry="1" fill="' + v.cheek + '" opacity=".7"/>' +
      '<path d="M29.8 23.4q2.2 2 4.4 0" stroke="#2B2B33" stroke-width="1" fill="none" stroke-linecap="round"/>' +
      '<path d="M40.4 24.6l7.6-6.4" stroke="#8A5E06" stroke-width="1.2" stroke-linecap="round"/>' + sparkle(48.6, 17.6, 3.6, "#FFE36B") +
      '<g class="egg-fx-dust">' + sparkle(53, 26, 1.6, "#fff") + sparkle(45, 10, 1.3, "#FFF3B0") + '</g>' +
      '</svg>';
  }

  /* ================= Holidays =================
     A holiday week dresses the hubs up: themed confetti (window.shConfettiTheme, read by v3.js), a costumed Plaque Boss,
     a hat on the tooth buddy (window.shHoliday, read by pet.js) and a magic word that sets off a little parade. */
  var HSHAPE = {
    candy: '<svg viewBox="0 0 24 24"><path d="M12 2.5 L20.5 20 Q12 23 3.5 20 Z" fill="#F7F3E8"/><path d="M6.6 13.6 L17.4 13.6 L20.5 20 Q12 23 3.5 20 Z" fill="#F59A1E"/><path d="M3.5 20 Q12 23 20.5 20 L19.2 17.4 Q12 19.6 4.8 17.4 Z" fill="#F5D21E"/><path d="M12 2.5 L20.5 20 Q12 23 3.5 20 Z" fill="none" stroke="#7A4A12" stroke-width="1.1" stroke-linejoin="round"/></svg>',
    bat: '<svg viewBox="0 0 32 18"><path d="M16 5 C17 3 18 3 18.6 4.6 L19.6 3.4 L19.8 6.2 C22 5 25 3 31 3.6 C28.4 5.4 28 8 28.8 10.8 C26.4 9.6 24 10 22.8 12.4 C21.4 11 19.8 11.4 18.6 13.6 C17.6 12.6 16.8 12.8 16 15 C15.2 12.8 14.4 12.6 13.4 13.6 C12.2 11.4 10.6 11 9.2 12.4 C8 10 5.6 9.6 3.2 10.8 C4 8 3.6 5.4 1 3.6 C7 3 10 5 12.2 6.2 L12.4 3.4 L13.4 4.6 C14 3 15 3 16 5 Z" fill="#2B1B3D"/><circle cx="14.6" cy="6.6" r=".7" fill="#FFD84A"/><circle cx="17.4" cy="6.6" r=".7" fill="#FFD84A"/></svg>',
    leaf: '<svg viewBox="0 0 24 24"><path d="M12 2 L13.6 6.6 L17.6 4.4 L16.6 9 L21.4 9.4 L17.8 12.6 L20 16.4 L15 15.6 L13 20 L12 16.8 L11 20 L9 15.6 L4 16.4 L6.2 12.6 L2.6 9.4 L7.4 9 L6.4 4.4 L10.4 6.6 Z" fill="currentColor" stroke="rgba(60,25,0,.55)" stroke-width=".8" stroke-linejoin="round"/><path d="M12 9 V22" stroke="rgba(60,25,0,.6)" stroke-width="1.1" stroke-linecap="round"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/><path d="M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5M3.8 10.2l3.4-.9-.9-3.4M20.2 13.8l-3.4.9.9 3.4M3.8 13.8l3.4.9-.9 3.4M20.2 10.2l-3.4-.9.9-3.4"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z" fill="currentColor" stroke="rgba(0,0,0,.25)" stroke-width=".8" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-8.5-5.3-8.5-11.4A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8.5 2.8C20.5 15.7 12 21 12 21z" fill="currentColor" stroke="rgba(90,0,30,.35)" stroke-width=".9"/><ellipse cx="8" cy="9.5" rx="1.6" ry="1" fill="#fff" opacity=".55" transform="rotate(-35 8 9.5)"/></svg>',
    clover: '<svg viewBox="0 0 24 24"><g fill="currentColor" stroke="rgba(0,50,10,.4)" stroke-width=".8"><path d="M12 11C9 11 6.4 9.4 6.4 7 6.4 5 8 3.8 9.6 4.2 10.2 2.8 11.6 2.6 12 4 12.4 2.6 13.8 2.8 14.4 4.2 16 3.8 17.6 5 17.6 7 17.6 9.4 15 11 12 11Z"/><path d="M12 11C12 14 10.4 16.6 8 16.6 6 16.6 4.8 15 5.2 13.4 3.8 12.8 3.6 11.4 5 11 3.6 10.6 3.8 9.2 5.2 8.6"/><path d="M12 11C12 14 13.6 16.6 16 16.6 18 16.6 19.2 15 18.8 13.4 20.2 12.8 20.4 11.4 19 11 20.4 10.6 20.2 9.2 18.8 8.6"/></g><path d="M12 11 Q13 17 11 22" stroke="#2F7A3A" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
    egg: '<svg viewBox="0 0 24 24"><path d="M12 2C7.6 2 4.6 9 4.6 14a7.4 7.4 0 0 0 14.8 0C19.4 9 16.4 2 12 2z" fill="currentColor" stroke="rgba(0,0,0,.25)" stroke-width=".9"/><path d="M5.2 11.4 Q8.6 9.4 12 11.4 T18.8 11.4" stroke="#fff" stroke-width="1.6" fill="none" opacity=".85"/><path d="M4.8 15.6 Q8.4 13.6 12 15.6 T19.2 15.6" stroke="rgba(255,255,255,.7)" stroke-width="1.3" fill="none" stroke-dasharray="1.4 1.8"/></svg>',
    brush: '<svg viewBox="0 0 24 24"><rect x="2" y="13.5" width="14" height="3.6" rx="1.8" fill="currentColor" stroke="rgba(0,0,0,.3)" stroke-width=".7" transform="rotate(-30 9 15)"/><g transform="rotate(-30 9 15)"><rect x="15" y="12.2" width="7" height="2" rx=".6" fill="#E9F1F6" stroke="rgba(0,0,0,.25)" stroke-width=".5"/><path d="M15.6 12.2V8.6M17 12.2V8.2M18.4 12.2V8.2M19.8 12.2V8.2M21.2 12.2V8.6" stroke="#8FD3F5" stroke-width="1" stroke-linecap="round"/></g></svg>'
  };
  /* each holiday: when, a name, its magic word, confetti, a costume for the boss, and what the word sets off */
  function nthWeekday(y, m, wd, n){ var d = new Date(y, m, 1), first = 1 + ((wd - d.getDay() + 7) % 7); return new Date(y, m, first + (n - 1) * 7); }
  function easter(y){ var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); }
  function around(at, before, after){ return function(d){ var t = d.getTime(), a = at(d.getFullYear()).getTime(); return t >= a - before * 864e5 && t <= a + after * 864e5; }; }
  function md(m1, d1, m2, d2){ return function(d){ var x = (d.getMonth() + 1) * 100 + d.getDate(), a = m1 * 100 + d1, b = m2 * 100 + d2; return a <= b ? x >= a && x <= b : x >= a || x <= b; }; }
  var HOLIDAYS = [
    { id: "halloween", name: "Halloween", on: md(10, 1, 10, 31), word: "fangs", shape: "bat", boss: "Count Plaqula",
      colors: ["#F59A1E", "#7A3CC2", "#2B1B3D", "#9BE15D", "#F5D21E"], confetti: "candy",
      line: "A bat colony just flew through your notes. Happy Halloween!" },
    { id: "thanksgiving", name: "Thanksgiving", on: around(function(y){ return nthWeekday(y, 10, 4, 4); }, 6, 1), word: "gobble", shape: "leaf", boss: "Pilgrim Plaque",
      colors: ["#C2410C", "#E58E26", "#B45309", "#8C2F0B", "#D9A441"], confetti: "leaf",
      line: "Grateful for you. Also for gravy. Happy Thanksgiving!" },
    { id: "winter", name: "Winter break", on: md(12, 10, 12, 30), word: "jingle", shape: "snow", boss: "Plaque Claus",
      colors: ["#FFFFFF", "#BFE6FF", "#D6363C", "#2F8F4E", "#E6F5FF"], confetti: "snow",
      line: "Let it snow. Happy holidays, and good luck with finals!" },
    { id: "newyear", name: "New Year", on: md(12, 31, 1, 2), word: "cheers", shape: "star", boss: "Party Plaque",
      colors: ["#F6CD55", "#FFFFFF", "#E0457B", "#3FA7E0", "#B08CFF"], confetti: "star",
      line: "New year, same 32 teeth. Happy New Year!" },
    { id: "valentine", name: "Valentine's Day", on: md(2, 10, 2, 14), word: "smile", shape: "heart", boss: "Plaque-entine",
      colors: ["#E0457B", "#FF8FB1", "#C21E56", "#FFD1DF", "#FFFFFF"], confetti: "heart",
      line: "You make my heart (and my gingiva) flutter. Happy Valentine's!" },
    { id: "dentist", name: "National Dentist's Day", on: md(3, 6, 3, 6), word: "dentist", shape: "brush", boss: "Plaque Boss (very nervous)",
      colors: ["#3FA7E0", "#8FD3F5", "#FFFFFF", "#3ECF7E", "#E9F1F6"], confetti: "brush",
      line: "Happy National Dentist's Day, future doctor!" },
    { id: "stpatrick", name: "St. Patrick's Day", on: md(3, 14, 3, 17), word: "lucky", shape: "clover", boss: "Plaquerechaun",
      colors: ["#2F9E44", "#69DB7C", "#F6CD55", "#1B6E2E", "#FFFFFF"], confetti: "clover",
      line: "Four-leaf clover found. Good luck on everything!" },
    { id: "easter", name: "Easter", on: around(easter, 6, 1), word: "hop", shape: "egg", boss: "Plaque Bunny",
      colors: ["#FFB3C7", "#B5E3FF", "#FFE58F", "#C3F0CA", "#D9C2FF"], confetti: "egg",
      line: "Egg hunt complete. Happy Easter!" }
  ];
  function holidayNow(){
    var p = centralParts().day.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    var forced = ls("sh_egg_holiday_test");   // for trying the themes out: localStorage.sh_egg_holiday_test = "halloween"
    for (var i = 0; i < HOLIDAYS.length; i++) if (forced ? HOLIDAYS[i].id === forced : HOLIDAYS[i].on(d)) return HOLIDAYS[i];
    return null;
  }
  var HOLIDAY = holidayNow();
  function applyHoliday(){
    if (HOLIDAY && on()) {
      window.shHoliday = { id: HOLIDAY.id, name: HOLIDAY.name };
      window.shConfettiTheme = { colors: HOLIDAY.colors, svg: HSHAPE[HOLIDAY.confetti] };
      document.documentElement.setAttribute("data-sh-holiday", HOLIDAY.id);
    } else {
      window.shHoliday = null; window.shConfettiTheme = null;
      document.documentElement.removeAttribute("data-sh-holiday");
    }
  }
  applyHoliday();
  document.addEventListener("sh:pref", applyHoliday);
  /* the boss lineup (2026-10-20): each 2-hour window brings one of these, picked from the window's id, so classmates
     online together all fight the same one. Every body is drawn in the blob's 40x40 frame with its head near the top,
     so the holiday hats still fit. HP differs; lines change as it weakens (said[0] full, [1] under 60%, [2] under 25%). */
  function eyes(y, mad){ return '<circle cx="14" cy="' + y + '" r="3" fill="var(--egg-boss-eye,#fff)"/><circle cx="26" cy="' + y + '" r="3" fill="var(--egg-boss-eye,#fff)"/><circle cx="14.6" cy="' + (y + .6) + '" r="1.4"/><circle cx="26.6" cy="' + (y + .6) + '" r="1.4"/>' +
    (mad ? '<path d="M10 ' + (y - 5) + 'l7 2.4M30 ' + (y - 5) + 'l-7 2.4" stroke="#2B2B33" stroke-width="1.8" stroke-linecap="round"/>' : ''); }
  var BOSSES = [
    { id: "plaque", name: "Plaque Boss", hp: 40, color: "#B8A04A", svg: null,
      said: ["Every correct answer from anyone here hits it", "It's getting sticky in here. Keep answering!", "It's crumbling. Finish it off!"] },
    { id: "tartar", name: "Tartar Titan", hp: 50, color: "#A8946A",
      svg: '<path fill="currentColor" stroke="rgba(0,0,0,.35)" stroke-width="1" stroke-linejoin="round" d="M8 9l7-5 6 3 7-3 6 6 2 9-3 6 2 7-7 5-6-2-6 3-7-4-3-8 2-6z"/><path d="M13 30l3-4 3 3M24 7l-2 5 3 3M31 25l-3 2" stroke="rgba(0,0,0,.35)" stroke-width="1.2" fill="none"/>' + eyes(17, true) + '<path d="M13 28h14" stroke="var(--egg-boss-eye,#fff)" stroke-width="2.2" stroke-linecap="round"/>',
      said: ["Calcified and proud. It takes a scaler, or a lot of right answers.", "Chips are flying. Keep scaling!", "One more pass and it's root planed."] },
    { id: "biofilm", name: "Biofilm Blob", hp: 40, color: "#6DBE5B",
      svg: '<path fill="currentColor" d="M20 5c7 0 12 4 13 10 1 4 3 8 1 12-1 2 0 6-2 6s-2-3-3-3-1 5-3 5-2-4-4-4-2 6-4 6-2-5-4-5-1 3-3 3-2-4-2-7c-2-4-1-8 0-12C10 9 13 5 20 5z"/><circle cx="29" cy="11" r="2" fill="#fff" opacity=".5"/><circle cx="11" cy="24" r="1.4" fill="#fff" opacity=".45"/>' + eyes(17) + '<path d="M14 26q6 4 12 0" stroke="var(--egg-boss-eye,#fff)" stroke-width="2" fill="none" stroke-linecap="round"/>',
      said: ["A whole slimy city of bacteria. Disrupt it with right answers.", "The matrix is breaking up!", "Almost disrupted. Don't stop now."] },
    { id: "mutans", name: "Strep Mutans Swarm", hp: 36, color: "#9B6BD6",
      svg: '<g fill="currentColor" stroke="rgba(0,0,0,.3)" stroke-width=".8"><circle cx="20" cy="18" r="11"/><circle cx="6" cy="28" r="4"/><circle cx="12" cy="33" r="4"/><circle cx="20" cy="35" r="4"/><circle cx="28" cy="33" r="4"/><circle cx="34" cy="28" r="4"/><circle cx="35" cy="9" r="3"/><circle cx="5" cy="10" r="3"/></g>' + eyes(16, true) + '<path d="M15 23q5-3 10 0" stroke="var(--egg-boss-eye,#fff)" stroke-width="2" fill="none" stroke-linecap="round"/>',
      said: ["They turn sugar into acid. Starve them with right answers.", "The chain is breaking!", "Only a few cocci left!"] },
    { id: "caries", name: "Cavity Creep", hp: 40, color: "#8C5A3C",
      svg: '<path fill="currentColor" d="M20 4c6 0 8 4 12 5s5 6 4 10 2 8-2 12-9 2-14 4-9-1-12-5-4-8-3-12 2-9 6-11 5-3 9-3z"/><path d="M27 25c3-1 5 1 4 4-1 2-4 3-6 1-1-2 0-4 2-5z" fill="#2B1A10"/><circle cx="10" cy="9" r="1.2" fill="#2B1A10"/>' + eyes(16, true) + '<path d="M12 25l3-2 3 2 3-2 3 2" stroke="var(--egg-boss-eye,#fff)" stroke-width="1.8" fill="none" stroke-linejoin="round"/>',
      said: ["It's digging into enamel. Every right answer is a restoration.", "It hears the handpiece. Keep going!", "Prep it out. One more push!"] },
    { id: "gingivitis", name: "Gingivitis Goblin", hp: 44, color: "#D9534F",
      svg: '<path fill="currentColor" d="M4 10l7 4c2-5 5-8 9-8s7 3 9 8l7-4-3 9c1 2 1 4 1 6 0 7-7 11-14 11S6 32 6 25c0-2 0-4 1-6z"/><path d="M9 31q11 6 22 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-dasharray="1.6 1.6" opacity=".7"/>' + eyes(19, true) + '<path d="M15 26q5 3 10 0" stroke="var(--egg-boss-eye,#fff)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M17 27.4l1 2 1-2M21 27.4l1 2 1-2" fill="#fff"/>',
      said: ["Red, puffy and it bleeds on probing. Calm it down with right answers.", "The swelling's going down!", "Nearly reversible. Finish it!"] },
    { id: "halitosis", name: "Halitosis Haze", hp: 34, color: "#8FA37A",
      svg: '<path fill="currentColor" d="M10 32c-5 0-8-3-8-7s3-6 6-6c0-6 5-10 11-10 4 0 8 2 10 6 1-1 2-1 3-1 4 0 7 3 7 7 0 6-4 11-9 11z"/><path d="M8 7q2-3 0-5M20 5q2-3 0-5M32 8q2-3 0-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>' + eyes(21) + '<ellipse cx="20" cy="28" rx="3.4" ry="2.2" fill="var(--egg-boss-eye,#fff)"/>',
      said: ["Volatile sulfur compounds, mostly. Clear the air with right answers.", "It's thinning out!", "Just a whiff left!"] },
    { id: "redcomplex", name: "The Red Complex", hp: 48, color: "#A3263A",
      svg: '<g fill="currentColor" stroke="rgba(0,0,0,.35)" stroke-width=".8"><rect x="8" y="8" width="24" height="26" rx="12"/><path d="M33 16c4-2 5 2 7 0M33 26c4 2 5-2 7 0M7 16c-4-2-5 2-7 0M7 26c-4 2-5-2-7 0" fill="none" stroke="currentColor" stroke-width="1.4"/></g>' + eyes(18, true) + '<path d="M14 27q6-3 12 0" stroke="var(--egg-boss-eye,#fff)" stroke-width="2" fill="none" stroke-linecap="round"/>',
      said: ["P. gingivalis, T. forsythia and T. denticola walked in together. Break them up.", "The complex is falling apart!", "Last of the red complex. Get it!"] }
  ];
  function bossKind(id){ return BOSSES[hash(String(id || bossId())) % BOSSES.length]; }
  /* every boss has a regular version and a seasonal one: during a holiday it wears that holiday's costume (bossIcon)
     and goes by its seasonal name, with an opening line for the season */
  var SEASONAL = {
    halloween:    { plaque: "Count Plaqula", tartar: "Tartar-stein", biofilm: "The Biofilm Ghoul", mutans: "Strep Mummy-tans",
                    caries: "The Crypt Cavity", gingivitis: "The Gingi-witch", halitosis: "The Halitosis Haunt", redcomplex: "The Red Complex Coven",
                    line: "Trick or treat. Mostly treats, which is exactly the problem." },
    thanksgiving: { plaque: "Pilgrim Plaque", tartar: "Tartar Turkey", biofilm: "Gravy Biofilm", mutans: "The Stuffing Swarm",
                    caries: "Cranberry Cavity", gingivitis: "The Gingi-gobbler", halitosis: "Green Bean Halitosis", redcomplex: "The Red Complex Cornucopia",
                    line: "Back for seconds, and thirds. Answer it back to the kids' table." },
    winter:       { plaque: "Plaque Claus", tartar: "Tartar the Snowman", biofilm: "Biofilm Frost", mutans: "The Mutans Elves",
                    caries: "Candy Cane Cavity", gingivitis: "The Grinch-ivitis", halitosis: "The Halitosis Blizzard", redcomplex: "The Red-Nosed Complex",
                    line: "It's been naughty all year. Right answers go on the nice list." },
    newyear:      { plaque: "Party Plaque", tartar: "Auld Lang Tartar", biofilm: "Bubbly Biofilm", mutans: "The Confetti Swarm",
                    caries: "Midnight Cavity", gingivitis: "Gingivitis Hangover", halitosis: "New Year's Halitosis", redcomplex: "The Red Complex Ball Drop",
                    line: "Its resolution was to stick around. Make yours to knock it out." },
    valentine:    { plaque: "Plaque-entine", tartar: "Tartar Sweetheart", biofilm: "Biofilm, Be Mine", mutans: "The Mutans Cupids",
                    caries: "Candy Heart Cavity", gingivitis: "Gingi-love-itis", halitosis: "The Halitosis Kiss", redcomplex: "The Red Rose Complex",
                    line: "It has a crush on your enamel. Let it down with right answers." },
    dentist:      { plaque: "Plaque Boss (very nervous)", tartar: "Tartar Titan (dreading the scaler)", biofilm: "Biofilm Blob (hiding from the floss)",
                    mutans: "Strep Mutans Swarm (out of sugar)", caries: "Cavity Creep (hears the drill)", gingivitis: "Gingivitis Goblin (bleeding nervously)",
                    halitosis: "Halitosis Haze (mouthwash panic)", redcomplex: "The Red Complex (on probation)",
                    line: "It knows what day it is. Happy National Dentist's Day." },
    stpatrick:    { plaque: "Plaquerechaun", tartar: "Tartar o' Gold", biofilm: "Shamrock Biofilm", mutans: "The Clover Swarm",
                    caries: "Cavity at the End of the Rainbow", gingivitis: "Gingi-green-itis", halitosis: "Halitosis O'Haze", redcomplex: "The Green Complex (in disguise)",
                    line: "It's hiding its pot of gold in a deep pocket. Go get it." },
    easter:       { plaque: "Plaque Bunny", tartar: "Tartar Egg", biofilm: "Biofilm Basket", mutans: "The Mutans Peeps",
                    caries: "Chocolate Bunny Cavity", gingivitis: "Gingivitis Hare", halitosis: "Jellybean Halitosis", redcomplex: "The Red Complex Egg Hunt",
                    line: "It hid in the grass with the jellybeans. Hunt it down." }
  };
  function season(){ return HOLIDAY && on() ? SEASONAL[HOLIDAY.id] : null; }
  function bossName(k){ k = k || bossKind(); var se = season(); return se && se[k.id] ? se[k.id] : k.name; }
  /* the boss in costume (2026-10-21): every boss dresses as its seasonal name, so Strep Mummy-tans is wrapped in bandages
     and Tartar the Snowman gets a top hat and a carrot. COSTUMES[holiday][boss](fit) returns [under, over]: drawn behind
     and in front of the body, in the blob's 40x40 frame with room above for hats. FIT is where each body's head, eyes
     and mouth are: t nudges hats down onto a lower head, e is the eye line, m the mouth line. */
  var FIT = { plaque: { t: 0, e: 17, m: 27 }, tartar: { t: 0, e: 17, m: 28 }, biofilm: { t: 0, e: 17, m: 27 }, mutans: { t: 0, e: 16, m: 22 },
    caries: { t: 0, e: 16, m: 25 }, gingivitis: { t: 2, e: 19, m: 26 }, halitosis: { t: 3, e: 21, m: 29 }, redcomplex: { t: 1, e: 18, m: 27 } };
  function place(x, y, s, r){ return '<g transform="translate(' + x + ' ' + y + ')' + (r ? ' rotate(' + r + ')' : '') + (s ? ' scale(' + s + ')' : '') + '">'; }
  function hat(f, svg){ return place(0, f.t) + svg + '</g>'; }
  function heart(x, y, s, fill, r){ return place(x, y, s, r) + '<path d="M0 3C-4 0-5-3-2.6-4.4-1.4-5 0-4 0-3 0-4 1.4-5 2.6-4.4 5-3 4 0 0 3Z" fill="' + fill + '"/></g>'; }
  function shamrock(x, y, s){ return place(x, y, s) + '<path d="M0 0q1 4 3 6" stroke="#1B6E2E" stroke-width="1" fill="none"/>' +
    heart(0, -2.6, .6, "#2F9E44", 180) + heart(-2.4, .6, .6, "#2F9E44", 60) + heart(2.4, .6, .6, "#2F9E44", -60) + '</g>'; }
  function flake(x, y, s){ return place(x, y, s) + '<path d="M0-3v6M-2.6-1.5l5.2 3M-2.6 1.5l5.2-3" stroke="#fff" stroke-width=".9" stroke-linecap="round"/></g>'; }
  function star(x, y, R, fill, stroke){ var p = []; for (var i = 0; i < 10; i++) { var a = Math.PI / 5 * i - Math.PI / 2, d = i % 2 ? R * .45 : R; p.push((x + d * Math.cos(a)).toFixed(1) + " " + (y + d * Math.sin(a)).toFixed(1)); }
    return '<path d="M' + p.join("L") + 'Z" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.4"' : '') + '/>'; }
  function egg(x, y, s, fill, band){ return place(x, y, s) + '<ellipse rx="3" ry="4" fill="' + fill + '"/><path d="M-2.9-.6q1.5 1.4 2.9 0t2.9 0" stroke="' + band + '" stroke-width="1" fill="none"/></g>'; }
  function bean(x, y, r, fill){ return place(x, y, 0, r) + '<rect x="-2.6" y="-1.5" width="5.2" height="3" rx="1.5" fill="' + fill + '"/><rect x="-1.6" y="-1" width="1.8" height=".7" rx=".35" fill="#fff" opacity=".6"/></g>'; }
  function sweat(x, y){ return '<path d="M' + x + ' ' + y + 'c-1.6 2.4-1.6 4 0 4s1.6-1.6 0-4z" fill="#8FD3F5"/>'; }
  function blush(f, dx){ dx = dx || 10; return '<ellipse cx="' + (20 - dx) + '" cy="' + (f.e + 5) + '" rx="2.6" ry="1.4" fill="#FF8FB1" opacity=".75"/><ellipse cx="' + (20 + dx) + '" cy="' + (f.e + 5) + '" rx="2.6" ry="1.4" fill="#FF8FB1" opacity=".75"/>'; }
  /* the shared hats: each draws its brim around y 8 to 11, on top of a head near y 4 (hat() lowers it for the others) */
  var HAT = {
    witch: function(c, band){ return '<path d="M12 9L19-6Q21-11 28-9 23-8 22-4L28 9Z" fill="' + c + '"/><ellipse cx="20" cy="9" rx="16" ry="2.6" fill="' + c + '"/><path d="M14.4 4.6h11.4l.9 2.6H13.5z" fill="' + band + '"/>'; },
    top: function(c, band){ return '<rect x="11" y="-7" width="18" height="14" rx="1" fill="' + c + '"/><rect x="6" y="6" width="28" height="3" rx="1.4" fill="' + c + '"/><rect x="11" y="2.6" width="18" height="2.8" fill="' + band + '"/>'; },
    bowler: function(c, band){ return '<path d="M10 9C10-1 30-1 30 9Z" fill="' + c + '"/><ellipse cx="20" cy="9" rx="14" ry="2.2" fill="' + c + '"/><rect x="10.4" y="5.6" width="19.2" height="2.2" fill="' + band + '"/>'; },
    pilgrim: '<path d="M9 9L11-2H29L31 9Z" fill="#2B2B2B"/><rect x="5" y="7.6" width="30" height="3.4" rx="1.6" fill="#2B2B2B"/><rect x="10.4" y="3" width="19.2" height="3" fill="#8C6B3E"/><rect x="17" y="2.4" width="6" height="4.2" rx=".6" fill="none" stroke="#F6CD55" stroke-width="1.3"/>',
    santa: '<path d="M8 10C10 1 22-3 32 3 30 5 30 8 31 10Z" fill="#D6363C"/><path d="M31 3C35 4 37 8 36 12" stroke="#D6363C" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="13" r="3" fill="#fff"/><rect x="6" y="8.6" width="28" height="4.4" rx="2.2" fill="#fff"/>',
    party: '<path d="M13 9L20-6 27 9Z" fill="#B08CFF"/><path d="M15.6 3.4H24.4M14.2 6.6H25.8" stroke="#F6CD55" stroke-width="1.6"/><circle cx="20" cy="-6" r="2.4" fill="#F6CD55"/>',
    leprechaun: '<path d="M10 9L12-3H28L30 9Z" fill="#2F9E44"/><rect x="5" y="7.4" width="30" height="3.4" rx="1.6" fill="#1B6E2E"/><rect x="11.4" y="3.2" width="17.2" height="2.8" fill="#2B2B2B"/><rect x="17.4" y="2.6" width="5.2" height="4" rx=".6" fill="none" stroke="#F6CD55" stroke-width="1.2"/>',
    ears: function(fur, inner, line){ return '<path d="M13 9C9-4 11-10 14-10 17-10 18-2 17 8" fill="' + fur + '" stroke="' + line + '" stroke-width="1"/><path d="M13.6 5C12.6-2 13-6 14-6 15-6 15.6-1 15.4 5" fill="' + inner + '"/>' +
      '<path d="M27 9C31-4 29-10 26-10 23-10 22-2 23 8" fill="' + fur + '" stroke="' + line + '" stroke-width="1"/><path d="M26.4 5C27.4-2 27-6 26-6 25-6 24.4-1 24.6 5" fill="' + inner + '"/>'; }
  };
  var COSTUMES = {
    halloween: {
      plaque: function(f){ return ['<path d="M5 14C1 22 2 33 7 38L12 31 16 37 20 31 24 37 28 31 33 38C38 33 39 22 35 14Z" fill="#4A1A6B"/><path d="M5 14C1 22 2 33 7 38" stroke="#C21E56" stroke-width="1.4" fill="none"/>',
        '<path d="M16.6 27.4L18 31 19.2 27.6M20.8 27.6L22 31 23.4 27.4" fill="#fff" stroke="#fff" stroke-width=".8" stroke-linejoin="round"/><path d="M8 9L13 3 20 7 27 3 32 9" fill="none" stroke="#2B1B3D" stroke-width="2.2" stroke-linejoin="round"/>']; },
      tartar: function(f){ return ['', '<path d="M7 9V1H33V9L29 6 25 9 20 6 15 9 11 6Z" fill="#1E2A1E"/><rect x="0" y="20" width="6" height="3.4" rx="1" fill="#8A8F98"/><rect x="34" y="20" width="6" height="3.4" rx="1" fill="#8A8F98"/>' +
        '<path d="M25 33l7-4M26.6 30.2l1.4 2.4M28.8 29l1.4 2.4" stroke="#2B2B2B" stroke-width="1" stroke-linecap="round"/>']; },
      biofilm: function(f){ return ['<path d="M6 12C0 20 1 32 3 38L8 34 11 39 15 35 20 39 25 35 29 39 32 34 37 38C39 32 40 20 34 12Z" fill="#3A3F4A"/>',
        '<path d="M5 17C5 4 12-1 20-1S35 4 35 17C32 9 27 5 20 5S8 9 5 17Z" fill="#3A3F4A"/><path d="M4 4q2-3 0-5M36 3q-2-3 0-5" stroke="#9BE58A" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>']; },
      mutans: function(f){ return ['', '<g stroke="#EFE7D2" stroke-linecap="round" fill="none"><path d="M13.4 9.6L26.6 7.6M10.4 26.4L29.6 24.6" stroke-width="2.6"/><path d="M9.6 13.4l2.2 5M30.4 13.4l-2.2 5" stroke-width="2"/>' +
        '<path d="M3 26l6 3.6M9 31.6l6 2.4M17 33l6 3.6M25 31.6l6 2.4M31 30l6-3.6M33 7l4 3.6M3 11l4-3" stroke-width="2"/><path d="M37 26.4q2.6 3 0 6t1 6" stroke-width="1.6"/></g>' +
        '<path d="M13.4 9.6L26.6 7.6M10.4 26.4L29.6 24.6" stroke="#B9AE91" stroke-width=".5" stroke-dasharray="1.4 2.2"/>']; },
      caries: function(f){ return ['<path d="M9 38V2C9-11 31-11 31 2V38Z" fill="#8A8F98" stroke="#5E636B" stroke-width="1"/><text x="20" y="1" font-size="5.4" font-weight="700" text-anchor="middle" fill="#4A4E55" font-family="serif">RIP</text>',
        '<path d="M1 40C3 34 9 32 14 34 20 31 28 32 32 35 36 33 39 36 39 40Z" fill="#5A3E26"/><path d="M5 34l-1-3M8 33l.6-3M32 34l1.4-3M35 35l2-2.4" stroke="#4E8C3A" stroke-width="1.2" stroke-linecap="round"/>']; },
      gingivitis: function(f){ return ['<path d="M30 30L39 39M33 37l4-4M34 39l5-5" stroke="#8C6B3E" stroke-width="1.6" stroke-linecap="round"/>', hat(f, HAT.witch("#2B1B3D", "#8E44AD"))]; },
      halitosis: function(f){ return ['<path d="M3 26C1 12 9 2 20 2S39 12 37 26C37 32 38 36 39 39L35 36 31 39 27 36 23 39 19 36 15 39 11 36 7 39 3 36 1 39C2 35 3 31 3 26Z" fill="#F4F4F8" opacity=".9"/>',
        '<g fill="none" stroke="#6B6F78" stroke-width="1.2"><ellipse cx="6" cy="35" rx="2" ry="1.3"/><ellipse cx="9.4" cy="36.6" rx="2" ry="1.3"/><ellipse cx="12.8" cy="37.6" rx="2" ry="1.3"/></g><circle cx="17" cy="38" r="2.4" fill="#4A4E55"/>']; },
      redcomplex: function(f){ return ['', hat(f, HAT.witch("#1E3A2B", "#9BE58A")) + '<path d="M9 31h22c0 6-4 8-11 8S9 37 9 31Z" fill="#2B2B2B"/><rect x="8" y="29.6" width="24" height="2.6" rx="1.3" fill="#3A3A3A"/>' +
        '<circle cx="15" cy="29" r="1.4" fill="#9BE58A"/><circle cx="23" cy="28.4" r="1" fill="#9BE58A"/><circle cx="27" cy="29.2" r="1.2" fill="#9BE58A"/>']; }
    },
    thanksgiving: {
      plaque: function(f){ return ['', HAT.pilgrim + '<path d="M10 32Q20 29 30 32L27 38 20 34.6 13 38Z" fill="#fff" stroke="#D9D9D9" stroke-width=".6"/>']; },
      tartar: function(f){ return ['<g transform="rotate(-40 6 12)"><ellipse cx="6" cy="12" rx="4.4" ry="6" fill="#B5651D"/><rect x="5" y="-1" width="2" height="8" fill="#F3E9D2"/><circle cx="5" cy="-1.4" r="1.6" fill="#F3E9D2"/><circle cx="7" cy="-1.4" r="1.6" fill="#F3E9D2"/></g>' +
        '<g transform="rotate(40 34 12)"><ellipse cx="34" cy="12" rx="4.4" ry="6" fill="#B5651D"/><rect x="33" y="-1" width="2" height="8" fill="#F3E9D2"/><circle cx="33" cy="-1.4" r="1.6" fill="#F3E9D2"/><circle cx="35" cy="-1.4" r="1.6" fill="#F3E9D2"/></g>',
        '<ellipse cx="20" cy="38" rx="19" ry="2.6" fill="#DDE3EA" stroke="#AEB6C0" stroke-width=".6"/><path d="M4 36q2-3 4 0M32 36q2-3 4 0" fill="#4E9A2E"/>']; },
      biofilm: function(f){ return ['', '<path d="M8 9C10 3 15 2 20 2S31 4 33 9C33 12 31 12.4 31 10 31 13 28 13 28 10.4 26 10 25 10.6 24 9.6 22 9.6 21 12.4 19 9.6 17 9.6 15 11 13 10 12 13 9 13 9.6 10Z" fill="#7A4B22"/><path d="M13 5q4-2 8-1" stroke="#C08A52" stroke-width="1" fill="none" stroke-linecap="round"/>' +
        '<path d="M28 33h9l-1 3c-1 2-6 2-7 0z" fill="#F3E9D2" stroke="#AEB6C0" stroke-width=".6"/><path d="M37 33.6q2.4 0 2 2" stroke="#AEB6C0" stroke-width=".8" fill="none"/>']; },
      mutans: function(f){ return ['', '<path d="M20 7.4q-5-4-2-8 4 3 2 8z" fill="#7FA36B"/><path d="M20 7q3-5 6-5-1 4-6 5z" fill="#93B97E"/>' +
        '<g fill="#D9A55B" stroke="#A9773A" stroke-width=".4"><rect x="4" y="25" width="2.6" height="2.6" transform="rotate(15 5 26)"/><rect x="18.6" y="32.6" width="2.6" height="2.6"/><rect x="32" y="25.4" width="2.6" height="2.6" transform="rotate(-20 33 26)"/>' +
        '<rect x="10.6" y="31" width="2.4" height="2.4" transform="rotate(30 12 32)"/><rect x="27" y="31.6" width="2.4" height="2.4"/><rect x="34" y="7.8" width="2" height="2"/><rect x="4" y="8.8" width="2" height="2"/></g>']; },
      caries: function(f){ return ['', '<rect x="11" y="-6" width="18" height="14" rx="2" fill="#A3123A"/><path d="M11-2h18M11 2h18" stroke="#7A0E2B" stroke-width="1"/><ellipse cx="20" cy="-6" rx="9" ry="1.8" fill="#C2185B"/>' +
        '<circle cx="3" cy="36" r="2" fill="#C2185B"/><circle cx="37" cy="35" r="2" fill="#C2185B"/><circle cx="34" cy="38" r="1.6" fill="#A3123A"/>']; },
      gingivitis: function(f){ var fan = ""; ["#8C5A2B", "#D35400", "#E6A23C", "#B5651D", "#E6A23C", "#D35400", "#8C5A2B"].forEach(function(c, i){ fan += '<ellipse cx="20" cy="8" rx="4.2" ry="14" fill="' + c + '" transform="rotate(' + (i * 22 - 66) + ' 20 24)"/>'; });
        return [fan, '<path d="M18.2 21.4L21.8 21.4 20 24.6Z" fill="#F39C12"/><path d="M21 23.6q2.4 2.4.6 5.4-1.8-2 -.6-5.4z" fill="#8B0000"/>']; },
      halitosis: function(f){ return ['', hat(f, '<g fill="none" stroke="#4E9A2E" stroke-width="2.4" stroke-linecap="round"><path d="M7 9q6-5 12-2"/><path d="M17 7q7-4 14 1"/><path d="M12 6q5-6 10-4"/></g><g fill="none" stroke="#C9934A" stroke-width="1"><ellipse cx="11" cy="6.4" rx="1.6" ry="1"/><ellipse cx="22" cy="4.4" rx="1.6" ry="1"/><ellipse cx="28" cy="6" rx="1.6" ry="1"/><ellipse cx="16" cy="3.6" rx="1.4" ry=".9"/></g>') +
        '<path d="M5 33h30l-2 6H7z" fill="#E8E1D6" stroke="#B9AE91" stroke-width=".6"/><path d="M8 35.6h24" stroke="#4E9A2E" stroke-width="1.2" stroke-dasharray="3 1.6"/>']; },
      redcomplex: function(f){ return ['', hat(f, '<path d="M2 4Q4-9 22-7L27 7Q12 1 2 4Z" fill="#C8963E" stroke="#8C6B3E" stroke-width=".8"/><path d="M2 4q-3-2-1-5" stroke="#8C6B3E" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M7-1l3 5M13-4l2 6M18-6l2 7" stroke="#8C6B3E" stroke-width=".6"/>' +
        '<g fill="#7D3C98"><circle cx="27" cy="-4" r="1.6"/><circle cx="29.6" cy="-4" r="1.6"/><circle cx="28.3" cy="-1.6" r="1.6"/></g><circle cx="33" cy="1" r="3" fill="#D35400"/><path d="M33-2v-1.6" stroke="#4E9A2E" stroke-width="1"/><circle cx="26.6" cy="2.6" r="2.4" fill="#C0392B"/><ellipse cx="36.4" cy="5.6" rx="2.6" ry="1.8" fill="#F1C40F"/>')]; }
    },
    winter: {
      plaque: function(f){ return ['', HAT.santa + '<rect x="6" y="31" width="28" height="3.4" fill="#2B2B2B"/><rect x="17.4" y="30.4" width="5.2" height="4.6" fill="none" stroke="#F6CD55" stroke-width="1.2"/>']; },
      tartar: function(f){ return ['', HAT.top("#1E1E24", "#C0392B") + '<path d="M19 20.6L29 22.6 19 24.2Z" fill="#F39C12"/><path d="M7 31Q20 36 33 31V34.6Q20 39 7 34.6Z" fill="#2E86C1"/><path d="M26 34.4l2 5.6 3.2-1-2-5.2z" fill="#2E86C1"/>']; },
      biofilm: function(f){ return ['', '<path d="M9 9L11 0 14 6 17-3 20 5 23-3 26 6 29 0 31 9Z" fill="#BFE9FF" stroke="#7FC8F0" stroke-width=".8" stroke-linejoin="round"/>' +
        '<g opacity=".95">' + flake(4, 8, 1.2) + flake(36, 12, 1) + flake(3, 30, 1) + flake(37, 32, 1.2) + '</g><path d="M10 31v4M15 33v3M26 34v3" stroke="#BFE9FF" stroke-width="1.4" stroke-linecap="round"/>']; },
      mutans: function(f){ return ['<path d="M9.6 15L3 11.6 9.8 20.4ZM30.4 15L37 11.6 30.2 20.4Z" fill="currentColor" stroke="rgba(0,0,0,.3)" stroke-width=".8"/>',
        '<path d="M9 10C10 2 18-4 30-6 25-2 29 4 31 10Z" fill="#2E9E4F"/><rect x="8" y="7.6" width="24" height="3.4" rx="1.6" fill="#D6363C"/><circle cx="30.4" cy="-6" r="2.2" fill="#F6CD55"/>' +
        '<path d="M32 7L35.6 1 38 7Z" fill="#2E9E4F"/><path d="M2 8L4.6 2 8 8Z" fill="#2E9E4F"/><circle cx="35.6" cy="1" r="1" fill="#F6CD55"/><circle cx="4.6" cy="2" r="1" fill="#F6CD55"/>']; },
      caries: function(f){ return ['', '<path d="M35 39V2a5 5 0 0 0-10 0" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M35 39V2a5 5 0 0 0-10 0" stroke="#D6363C" stroke-width="3.2" fill="none" stroke-dasharray="2 2.4"/>' +
        '<path d="M5 30Q18 35 31 30V33.6Q18 38 5 33.6Z" fill="#fff"/><path d="M8 30.6v4.4M14 31.8v4.6M20 32v4.6M26 31.4v4.4" stroke="#D6363C" stroke-width="2"/>']; },
      gingivitis: function(f){ return ['<path d="M1 18C-1 26 1 34 8 36 4 30 4 24 6 18Z" fill="#B08A5A"/><path d="M1 18q3-3 5 0" stroke="#8C6B3E" stroke-width="1.2" fill="none"/>',
        hat(f, '<path d="M8 10C8 0 20-6 29 1 34 6 36 14 33 21L30 19C32 12 29 6 22 6 16 6 12 8 12 10Z" fill="#D6363C"/><circle cx="32" cy="22" r="3" fill="#fff"/><rect x="6" y="8.6" width="28" height="4" rx="2" fill="#fff"/>') +
        '<path d="M13 15.6l5 1.6M27 15.6l-5 1.6" stroke="#2E9E4F" stroke-width="1.4" stroke-linecap="round"/>']; },
      halitosis: function(f){ return ['', '<path d="M6 14C8 8 14 7 18 9 21 6 28 6 31 10 34 9 37 12 35 15 30 13 26 14 22 12 18 14 12 12 6 14Z" fill="#fff"/>' +
        flake(4, 4, 1.1) + flake(36, 3, 1.3) + flake(1, 16, .9) + flake(39, 22, 1) + flake(6, 38, 1) + flake(33, 37, 1.1) + '<path d="M26 1h8M28 -2h6M0 10h5" stroke="#BFE9FF" stroke-width="1" stroke-linecap="round"/>']; },
      redcomplex: function(f){ return ['', hat(f, '<g stroke="#8B5A2B" stroke-width="2" stroke-linecap="round" fill="none"><path d="M12 9L8-3M9.6 1.6L4 0M10.6 4.6L5 6M28 9L32-3M30.4 1.6L36 0M29.4 4.6L35 6"/></g>') +
        '<circle cx="20" cy="' + (f.e + 4.4) + '" r="4.6" fill="#FF6B6B" opacity=".35"/><circle cx="20" cy="' + (f.e + 4.4) + '" r="2.8" fill="#FF2D2D" stroke="#7A0E1E" stroke-width=".6"/><circle cx="19" cy="' + (f.e + 3.4) + '" r=".8" fill="#fff"/>']; }
    },
    newyear: {
      plaque: function(f){ return ['', HAT.party + '<path d="M26 27L33 24" stroke="#F6CD55" stroke-width="2.4" stroke-linecap="round"/><path d="M33 24c3-1 5 1 3 3-2 1-1 4 2 3" stroke="#B08CFF" stroke-width="2" fill="none" stroke-linecap="round"/>']; },
      tartar: function(f){ return ['', place(0, 0, 0, -8) + HAT.top("#1E1E24", "#F6CD55") + '</g><circle cx="26" cy="17" r="4.6" fill="none" stroke="#F6CD55" stroke-width="1.2"/><path d="M30.4 18.4q3 6 1 12" stroke="#F6CD55" stroke-width=".7" fill="none"/>' +
        '<path d="M14.6 31L20 33.6 14.6 36.2ZM25.4 31L20 33.6 25.4 36.2Z" fill="#1E1E24"/><circle cx="20" cy="33.6" r="1.3" fill="#1E1E24"/>']; },
      biofilm: function(f){ return ['', '<path d="M32 17h7l-2 8q-1.5 2-3 0z" fill="#F6CD55" opacity=".85" stroke="#E8E8E8" stroke-width=".8"/><path d="M35.5 26v8M32.6 34h5.8" stroke="#E8E8E8" stroke-width="1.2" stroke-linecap="round"/>' +
        '<g fill="none" stroke="#F6CD55" stroke-width=".8"><circle cx="35" cy="13" r="1.2"/><circle cx="37" cy="9" r=".9"/><circle cx="14" cy="1" r="1.4"/><circle cx="20" cy="-4" r="1.8"/><circle cx="26" cy="0" r="1.2"/><circle cx="17" cy="-9" r="1"/><circle cx="24" cy="-8" r="1.4"/></g>']; },
      mutans: function(f){ var bits = "", cs = ["#F6CD55", "#B08CFF", "#FF8FB1", "#5BC0EB", "#6DBE5B"];
        [[8, -2, 20], [14, -8, -30], [22, -4, 45], [30, -9, 10], [34, -2, -40], [2, 2, 60], [26, 3, -15], [38, 18, 30], [1, 20, -50]].forEach(function(p, i){ bits += '<rect x="' + p[0] + '" y="' + p[1] + '" width="2.2" height="1.2" fill="' + cs[i % 5] + '" transform="rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')"/>'; });
        return ['', bits + '<path d="M1 31q4-4 8 0t8 0 8 0 8 0 6 0" stroke="#FF8FB1" stroke-width="1.4" fill="none"/><path d="M2 26q4 3 8 0" stroke="#5BC0EB" stroke-width="1.2" fill="none"/>']; },
      caries: function(f){ return ['', '<circle cx="13" cy="-7" r="3" fill="#C0392B"/><circle cx="27" cy="-7" r="3" fill="#C0392B"/><circle cx="20" cy="-1" r="7" fill="#fff" stroke="#2B2B33" stroke-width="1.4"/>' +
        '<path d="M20-1V-6.4M20-1v-4" stroke="#2B2B33" stroke-width="1.2" stroke-linecap="round"/><path d="M20-7v1M20 4.6v1M13.6-1h1M25.4-1h1" stroke="#2B2B33" stroke-width=".8"/><path d="M15 6l-1 2M25 6l1 2" stroke="#2B2B33" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M4 4a4 4 0 1 0 4-4 3.2 3.2 0 1 1-4 4z" fill="#F6CD55"/>' + star(35, 5, 2, "#F6CD55")]; },
      gingivitis: function(f){ return ['', hat(f, '<path d="M9 7C10-1 30-1 31 7 26 9.6 14 9.6 9 7Z" fill="#7FB3E6" stroke="#4A7FB3" stroke-width=".8"/><rect x="18" y="-3.4" width="4" height="3.4" rx=".6" fill="#4A7FB3"/><path d="M14 3l2 2M24 2l2 2M19 5l2 2" stroke="#fff" stroke-width=".7" opacity=".7"/>') +
        star(4, 4, 1.8, "#F6CD55") + star(36, 6, 1.6, "#F6CD55") + star(37, 0, 1.2, "#F6CD55") + '<path d="M2 -2q3-3 6 0" stroke="#F6CD55" stroke-width=".8" fill="none"/>']; },
      halitosis: function(f){ return ['', star(14, f.e, 6, "rgba(246,205,85,.18)", "#F6CD55") + star(26, f.e, 6, "rgba(246,205,85,.18)", "#F6CD55") + '<path d="M8.6 ' + (f.e - 1) + 'L3 ' + (f.e - 3) + 'M31.4 ' + (f.e - 1) + 'L37 ' + (f.e - 3) + '" stroke="#F6CD55" stroke-width="1.4"/>' +
        '<path d="M6 11Q20 4 34 11" stroke="#F6CD55" stroke-width="2" fill="none"/><text x="20" y="7" font-size="3.4" font-weight="700" text-anchor="middle" fill="#F6CD55" font-family="sans-serif">HAPPY NEW YEAR</text>']; },
      redcomplex: function(f){ return ['', hat(f, '<path d="M20-12V-6" stroke="#8A8F98" stroke-width="1.2"/><circle cx="20" cy="0" r="6.4" fill="#C9D1DA" stroke="#8A8F98" stroke-width=".8"/><path d="M13.8 0h12.4M14.6-3.2h10.8M14.6 3.2h10.8M20-6.4v12.8M16.4-5.4q-2 5.4 0 10.8M23.6-5.4q2 5.4 0 10.8" stroke="#8A8F98" stroke-width=".5" fill="none"/>' +
        '<path d="M8-4l-3-1M8 1H4M32-4l3-1M32 1h4" stroke="#F6CD55" stroke-width="1" stroke-linecap="round"/><circle cx="17.6" cy="-2.6" r="1" fill="#fff"/>')]; }
    },
    valentine: {
      plaque: function(f){ return ['', '<path d="M7 22c-1.6-1-2.6-2.2-2.6-3.4a1.6 1.6 0 0 1 2.6-1 1.6 1.6 0 0 1 2.6 1c0 1.2-1 2.4-2.6 3.4zM33 22c-1.6-1-2.6-2.2-2.6-3.4a1.6 1.6 0 0 1 2.6-1 1.6 1.6 0 0 1 2.6 1c0 1.2-1 2.4-2.6 3.4z" fill="#FF8FB1"/>' +
        '<path d="M14 6Q12 1 10-2M26 6Q28 1 30-2" stroke="#2B2B2B" stroke-width="1.1" fill="none"/>' + heart(10, -2.4, .9, "#E0245E") + heart(30, -2.4, .9, "#E0245E")]; },
      tartar: function(f){ return ['', heart(14, f.e - .6, 1.5, "rgba(255,92,138,.55)") + heart(26, f.e - .6, 1.5, "rgba(255,92,138,.55)") + '<path d="M17.6 ' + (f.e - 2) + 'q2.4-1.4 4.8 0M8 ' + (f.e - 2) + 'L5 ' + (f.e - 3.4) + 'M32 ' + (f.e - 2) + 'L35 ' + (f.e - 3.4) + '" stroke="#E0245E" stroke-width="1.1" fill="none"/>' +
        heart(20, 0, 1, "#E0245E")]; },
      biofilm: function(f){ return ['', heart(32, 29, 1.9, "#FFC1D6") + '<text x="32" y="27.6" font-size="2.6" font-weight="700" text-anchor="middle" fill="#C2185B" font-family="sans-serif">BE</text><text x="32" y="30.6" font-size="2.6" font-weight="700" text-anchor="middle" fill="#C2185B" font-family="sans-serif">MINE</text>' + blush(f, 9)]; },
      mutans: function(f){ return ['<path d="M10 14C4 8-2 10 0 16 2 20 7 20 10 18ZM30 14C36 8 42 10 40 16 38 20 33 20 30 18Z" fill="#fff" stroke="#E7B9C8" stroke-width=".8"/>',
        '<ellipse cx="20" cy="4" rx="7" ry="1.6" fill="none" stroke="#F6CD55" stroke-width="1.2"/><path d="M2 38L36 22" stroke="#8C6B3E" stroke-width="1.2"/>' + heart(37, 21.4, .8, "#E0245E", -115) + '<path d="M2 38l-1 -3M2 38l3 0" stroke="#FF8FB1" stroke-width="1.2"/>']; },
      caries: function(f){ return ['', heart(5, 3, 1, "#FFC1D6", -15) + heart(35, 3, 1, "#C9F0D6", 15) + heart(20, -2, 1.1, "#FFF3B0") + heart(3, 34, 1, "#D7C9F5", -10) + heart(37, 34, 1, "#FFD8B5", 10) + heart(31, 25, .8, "#FFC1D6") +
        '<path d="M18.4-2.6h3.2M3.4 33.6h3.2" stroke="#C2185B" stroke-width=".5"/>']; },
      gingivitis: function(f){ return ['', heart(8, 2, .9, "#FF5C8A", -20) + heart(20, -3, 1.1, "#E0245E") + heart(32, 2, .9, "#FF5C8A", 20) + heart(14, -6, .6, "#FF8FB1") + heart(27, -6, .6, "#FF8FB1") + blush(f, 9)]; },
      halitosis: function(f){ return ['', place(31, 23, 1.1, -15) + '<path d="M-5 0Q-2.5-3 0-1 2.5-3 5 0 2.5 3.6 0 3.2-2.5 3.6-5 0Z" fill="#E0245E"/><path d="M-5 0Q0 1 5 0" stroke="#9E1040" stroke-width=".7" fill="none"/></g>' +
        '<text x="33" y="7" font-size="5" font-weight="800" text-anchor="middle" fill="#E0245E" font-family="sans-serif">XO</text>']; },
      redcomplex: function(f){ return ['', '<path d="M11 ' + (f.m + .4) + 'L33 ' + (f.m - .6) + '" stroke="#2E7D32" stroke-width="1.6" stroke-linecap="round"/><path d="M24 ' + (f.m - .2) + 'q3-4 6-2-3 3-6 2zM17 ' + f.m + 'q2 4 5 3-2-4-5-3z" fill="#43A047"/>' +
        '<circle cx="8" cy="' + (f.m - .6) + '" r="4.6" fill="#E0103A" stroke="#7A0E1E" stroke-width=".7"/><path d="M8 ' + (f.m - .6) + 'm-2 0a2 2 0 1 1 2 2 3 3 0 1 1-2.6-3.6" stroke="#7A0E1E" stroke-width=".7" fill="none"/>']; }
    },
    dentist: {
      plaque: function(f){ return ['', '<path d="M30 30c2 2 4 2 5 0" stroke="#8FD3F5" stroke-width="1.6" fill="none"/>' + sweat(34, 21) + sweat(6, 12)]; },
      tartar: function(f){ return ['', '<path d="M0-10L13 2" stroke="#9AA5B1" stroke-width="2.6" stroke-linecap="round"/><path d="M1-9l2-2M4-6.2l2-2M7-3.4l2-2" stroke="#6B7580" stroke-width=".8"/><path d="M13 2q4 2 2 6.4" stroke="#9AA5B1" stroke-width="1.2" fill="none" stroke-linecap="round"/>' + sweat(35, 12) + sweat(33, 22)]; },
      biofilm: function(f){ return ['', '<path d="M-1 9Q20 1 41 9" stroke="#fff" stroke-width=".9" fill="none"/><rect x="33" y="3" width="6" height="7" rx="1.4" fill="#5BC0EB" stroke="#2E86C1" stroke-width=".6"/><path d="M1 34Q20 40 39 32" stroke="#fff" stroke-width=".9" fill="none"/>' + sweat(6, 14)]; },
      mutans: function(f){ return ['', place(33, 1, 0, 160) + '<rect x="-4" y="-3" width="8" height="6" fill="#fff" stroke="#AEB6C0" stroke-width=".6"/><text x="0" y="1" font-size="2.2" font-weight="700" text-anchor="middle" fill="#C0392B" font-family="sans-serif">SUGAR</text></g>' +
        '<circle cx="31" cy="6" r=".5" fill="#fff"/><circle cx="32.4" cy="7.4" r=".4" fill="#fff"/>' + sweat(9, 8) + sweat(31, 12)]; },
      caries: function(f){ return ['', place(30, 2, 0, -35) + '<rect x="-2" y="-12" width="4" height="12" rx="1.6" fill="#D5DBE1" stroke="#8A8F98" stroke-width=".6"/><rect x="-2.6" y="0" width="5.2" height="3.6" rx="1" fill="#8A8F98"/><path d="M0 3.6v3" stroke="#6B7580" stroke-width=".8"/></g>' +
        '<path d="M36 6q2 1 1 3M38 4q3 2 1.4 5.4" stroke="#8A8F98" stroke-width=".8" fill="none"/><text x="5" y="3" font-size="4" font-weight="700" fill="#8A8F98" font-family="sans-serif">bzz</text>' + sweat(6, 12)]; },
      gingivitis: function(f){ return ['', '<path d="M25 ' + (f.m + .6) + 'c-1.4 2.2-1.4 3.6 0 3.6s1.4-1.4 0-3.6z" fill="#8B0000"/>' + sweat(35, 18) + sweat(5, 20) + sweat(30, 8)]; },
      halitosis: function(f){ return ['', '<rect x="31" y="22" width="8" height="13" rx="2" fill="#3FC1C9" stroke="#2A8F96" stroke-width=".6"/><rect x="32.6" y="18.6" width="4.8" height="3.6" rx=".6" fill="#fff"/><rect x="32" y="26" width="6" height="4" fill="#fff" opacity=".7"/>' + sweat(4, 14) + sweat(24, 4)]; },
      redcomplex: function(f){ return ['', '<path d="M32-6L37 30" stroke="#9AA5B1" stroke-width="1.6" stroke-linecap="round"/><path d="M36 22.6l.4 1.6M36.6 26.4l.4 1.6" stroke="#2B2B33" stroke-width="1.8"/>' + sweat(4, 10) + sweat(27, 3)]; }
    },
    stpatrick: {
      plaque: function(f){ return ['', HAT.leprechaun + '<path d="M6 29Q7 39 20 40 33 39 34 29 28 33 20 33 12 33 6 29Z" fill="#E67E22"/>']; },
      tartar: function(f){ return ['', shamrock(30, 4, 1.4) + '<path d="M24 32h15c0 5-3 7-7.5 7S24 37 24 32Z" fill="#2B2B2B"/><rect x="23" y="30.4" width="17" height="2.4" rx="1.2" fill="#3A3A3A"/>' +
        '<g fill="#F6CD55" stroke="#C99A1E" stroke-width=".5"><ellipse cx="27" cy="29.6" rx="2" ry="1"/><ellipse cx="31" cy="29" rx="2" ry="1"/><ellipse cx="35" cy="29.6" rx="2" ry="1"/><ellipse cx="29" cy="28" rx="2" ry="1"/><ellipse cx="33" cy="27.6" rx="2" ry="1"/></g>']; },
      biofilm: function(f){ return ['', '<path d="M13 6Q11 1 8-2M27 6Q29 1 32-2" stroke="#1B6E2E" stroke-width="1.1" fill="none"/>' + shamrock(8, -2, 1.4) + shamrock(32, -2, 1.4) + shamrock(4, 30, 1) + shamrock(36, 30, 1)]; },
      mutans: function(f){ return ['', HAT.bowler("#2F9E44", "#1B6E2E") + shamrock(6, 28, .9) + shamrock(12, 33, .9) + shamrock(20, 35, .9) + shamrock(28, 33, .9) + shamrock(34, 28, .9)]; },
      caries: function(f){ var bow = ""; ["#E74C3C", "#F39C12", "#F1C40F", "#2ECC71", "#3498DB", "#9B59B6"].forEach(function(c, i){ bow += '<path d="M' + (1 + i * 1.6) + ' 16A' + (19 - i * 1.6) + ' 19 0 0 1 ' + (39 - i * 1.6) + ' 16" stroke="' + c + '" stroke-width="1.6" fill="none"/>'; });
        return [bow, '<path d="M28 33h11c0 4-2 6-5.5 6S28 37 28 33Z" fill="#2B2B2B"/><rect x="27.4" y="31.6" width="12.2" height="2" rx="1" fill="#3A3A3A"/><g fill="#F6CD55"><circle cx="30.6" cy="31" r="1.2"/><circle cx="33.4" cy="30.4" r="1.2"/><circle cx="36.2" cy="31" r="1.2"/></g>']; },
      gingivitis: function(f){ return ['', hat(f, HAT.top("#2F9E44", "#F6CD55")) + shamrock(30, f.e + 5, .9) + '<path d="M14.6 31.4L20 33.6 14.6 35.8ZM25.4 31.4L20 33.6 25.4 35.8Z" fill="#2F9E44"/><circle cx="20" cy="33.6" r="1.2" fill="#1B6E2E"/>']; },
      halitosis: function(f){ return ['', hat(f, HAT.bowler("#2F9E44", "#F6CD55")) + '<path d="M23 ' + (f.m + .4) + 'L31 ' + (f.m + 1.4) + '" stroke="#5A3E26" stroke-width="1.4" stroke-linecap="round"/><path d="M30 ' + (f.m - 2) + 'h4v3.4q0 1.4-1.4 1.4h-1.2q-1.4 0-1.4-1.4z" fill="#8C5A2B"/>' +
        '<path d="M32 ' + (f.m - 3) + 'q-1.4-2 0-4t0-4" stroke="#C9CDD3" stroke-width="1" fill="none"/>']; },
      redcomplex: function(f){ var e = f.e; return ['', hat(f, HAT.bowler("#2F9E44", "#1B6E2E")) + '<g fill="none" stroke="#1E1E24" stroke-width="1.4"><circle cx="14" cy="' + e + '" r="4"/><circle cx="26" cy="' + e + '" r="4"/><path d="M18 ' + e + 'h4M10 ' + (e - 1) + 'L7 ' + (e - 2) + 'M30 ' + (e - 1) + 'L33 ' + (e - 2) + '"/></g>' +
        '<path d="M14 ' + (e - 5.4) + 'q-3 1-3 3M26 ' + (e - 5.4) + 'q3 1 3 3" stroke="#1E1E24" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="' + (e + 4) + '" rx="2.4" ry="2.8" fill="#F2B8A0"/>' +
        '<path d="M13 ' + (e + 7.6) + 'q3.6-2.4 7-1 3.4-1.4 7 1-3.6 1.4-7 0-3.4 1.4-7 0z" fill="#2F9E44"/>']; }
    },
    easter: {
      plaque: function(f){ return ['', HAT.ears("#fff", "#FFB3C7", "#E7B9C8") + '<ellipse cx="20" cy="22" rx="1.8" ry="1.3" fill="#FFB3C7"/><path d="M17 22.6l-7-1M17 23.6l-7 1.4M23 22.6l7-1M23 23.6l7 1.4" stroke="#fff" stroke-width=".6" opacity=".9"/>']; },
      tartar: function(f){ return ['', '<path d="M11 6C12-4 28-4 29 6L26 3.6 23 6.6 20 3.4 17 6.6 14 3.6Z" fill="#BDE3FF" stroke="#7FB8E0" stroke-width=".6"/><path d="M15-1q5 2 10 0" stroke="#FF8FB1" stroke-width="1" fill="none"/>' +
        '<path d="M3 32L7 30 11 32.6 15 30 19 32.6 23 30 27 32.6 31 30 35 32.6 37 31.6C37 37 31 40 20 40S3 37 3 32Z" fill="#FFF3C4" stroke="#E0C77A" stroke-width=".6"/><path d="M5 36q4-2 7 0t7 0 7 0 7 0 3 0" stroke="#B08CFF" stroke-width="1" fill="none"/>']; },
      biofilm: function(f){ return ['<path d="M4 33C4-12 36-12 36 33" stroke="#A9773A" stroke-width="2.4" fill="none"/>',
        '<path d="M2 32h36l-3 8H5Z" fill="#C8963E"/><path d="M3 35h34M4 37.6h32M9 32l1 8M15 32l.6 8M21 32v8M27 32l-.6 8M33 32l-1 8" stroke="#A9773A" stroke-width=".7"/>' +
        '<path d="M2 32l1-3 1.4 3 1.4-3.4L7 32l1.6-3 1 3M30 32l1.4-3.4 1 3.4 1.4-3 1 3 1.4-3.4.8 3.4" stroke="#6DBE5B" stroke-width="1" fill="none"/>' + egg(9, 31, .7, "#FFB3C7", "#fff") + egg(32, 31, .7, "#BDE3FF", "#fff")]; },
      mutans: function(f){ return ['<path d="M10 20C4 18 2 24 6 26 9 26 10 24 11 23ZM30 20C36 18 38 24 34 26 31 26 30 24 29 23Z" fill="currentColor" stroke="rgba(0,0,0,.3)" stroke-width=".8"/>',
        '<path d="M18 7.4q0-4 2-5 0 3 1 5M20 7.4q1-3 3-3.4-1 2-1.4 3.6" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M18.4 18.8h3.2L20 21Z" fill="#F39C12"/>' +
        '<g fill="#fff" opacity=".8"><circle cx="12" cy="11" r=".5"/><circle cx="28" cy="12" r=".5"/><circle cx="24" cy="26" r=".5"/><circle cx="15" cy="25" r=".5"/><circle cx="6" cy="27" r=".4"/><circle cx="34" cy="29" r=".4"/><circle cx="20" cy="34" r=".4"/></g>']; },
      caries: function(f){ return ['', '<path d="M13 9C9-4 10-8 12-9L13-6 14.6-8.4 16-5.6 17 8" fill="#5D3A1A" stroke="#3E2510" stroke-width=".8"/>' +
        '<path d="M27 9C31-4 29-10 26-10 23-10 22-2 23 8" fill="#5D3A1A" stroke="#3E2510" stroke-width=".8"/><path d="M26.4 5C27.4-2 27-6 26-6" stroke="#8C5A2B" stroke-width="1" fill="none"/>' +
        '<path d="M20 31l-6-3v6ZM20 31l6-3v6Z" fill="#F6CD55" stroke="#C99A1E" stroke-width=".5"/><circle cx="20" cy="31" r="1.4" fill="#C0392B"/>']; },
      gingivitis: function(f){ return ['', hat(f, place(0, 0, 0, -6) + HAT.ears("#B08A6A", "#F2B8A0", "#8C6B4E") + '</g>') + '<path d="M17 ' + (f.e + 4.4) + 'l-8-1.4M17 ' + (f.e + 5.4) + 'l-8 1.6M23 ' + (f.e + 4.4) + 'l8-1.4M23 ' + (f.e + 5.4) + 'l8 1.6" stroke="#fff" stroke-width=".6"/>' +
        '<ellipse cx="20" cy="' + (f.e + 4.6) + '" rx="1.6" ry="1.1" fill="#FFB3C7"/>']; },
      halitosis: function(f){ return ['', bean(5, 6, 30, "#E74C3C") + bean(12, 2, -20, "#F1C40F") + bean(28, 3, 15, "#2ECC71") + bean(36, 8, -35, "#9B59B6") + bean(3, 36, 10, "#F39C12") + bean(37, 36, -15, "#FF8FB1") + bean(20, 36, 40, "#3498DB") + bean(1, 18, 70, "#2ECC71") + bean(39, 22, -60, "#E74C3C")]; },
      redcomplex: function(f){ return ['', hat(f, '<path d="M9 9C9-3 31-3 31 9Z" fill="#C9B27C"/><ellipse cx="20" cy="9" rx="15" ry="2.4" fill="#B39A62"/><rect x="9.4" y="5.4" width="21.2" height="2" fill="#8C6B3E"/><circle cx="20" cy="-1.6" r="1" fill="#B39A62"/>') +
        '<circle cx="33" cy="27" r="4" fill="rgba(191,233,255,.35)" stroke="#5A3E26" stroke-width="1.4"/><path d="M35.8 29.8L39.4 33.4" stroke="#5A3E26" stroke-width="2" stroke-linecap="round"/>' + egg(4, 34, .9, "#FFB3C7", "#fff") + egg(11, 36, .8, "#C9F0D6", "#B08CFF")]; }
    }
  };
  function bossIcon(k, hid){
    k = k || bossKind();
    var base = k.svg ? '<svg viewBox="0 0 40 40">' + k.svg + '</svg>' : IC.blob;
    var id = hid || (HOLIDAY && on() ? HOLIDAY.id : ""), dress = COSTUMES[id] && COSTUMES[id][k.id];
    if (!dress) return base;
    var c = dress(FIT[k.id]);
    return base.replace('<svg viewBox="0 0 40 40">', '<svg viewBox="0 -12 40 52" style="overflow:visible">' + c[0]).replace(/<\/svg>$/, c[1] + '</svg>');
  }
  /* the magic word's parade: a burst of the holiday's shape across the screen */
  function parade(h){
    var n = window.innerWidth < 600 ? 14 : 22, shape = HSHAPE[h.shape];
    var rising = h.shape === "heart" || h.shape === "star" || h.shape === "bat";
    for (var i = 0; i < n; i++) (function(i){
      var p = document.createElement("span");
      p.className = "sh-egg sh-egg-parade"; p.setAttribute("aria-hidden", "true");
      var size = (h.shape === "bat" ? 34 : 20) + Math.random() * 16;
      p.style.width = size + "px"; p.style.height = size + "px";
      p.style.color = h.colors[i % h.colors.length];
      p.style.left = (Math.random() * 100) + "vw";
      p.style[rising ? "bottom" : "top"] = "-50px";
      p.innerHTML = shape;
      document.body.appendChild(p);
      var dy = (rising ? -1 : 1) * (window.innerHeight + 100), dx = (Math.random() - 0.5) * 220;
      if (!p.animate) { setTimeout(function(){ p.remove(); }, 4000); return; }
      p.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 0 },
        { opacity: 1, offset: .12 },
        { transform: "translate(" + (dx * .5) + "px," + (dy * .5) + "px) rotate(" + (Math.random() * 90 - 45) + "deg)", offset: .5 },
        { transform: "translate(" + dx + "px," + dy + "px) rotate(" + (Math.random() * 360 - 180) + "deg)", opacity: .9 }
      ], { duration: 3200 + Math.random() * 1800, delay: i * 90, easing: "cubic-bezier(.3,.1,.5,1)", fill: "backwards" }).onfinish = function(){ p.remove(); };
    })(i);
  }
  function holidayWord(){
    if (!HOLIDAY || !ok()) return;
    parade(HOLIDAY); H.confetti();
    rpc("record_achievement", { p_visitor: VISITOR, p_kind: "holiday", p_hub: HOLIDAY.id });
    toast(row('<span class="sh-egg-hshape">' + HSHAPE[HOLIDAY.shape] + '</span>', "Holiday Spirit", esc(HOLIDAY.line)), 5200, "is-gold");
    announce("holiday", { id: HOLIDAY.id });
  }

  /* ---------- a toast that stays long enough to read, and a floating bubble ---------- */
  function toast(html, ms, cls){
    var t = document.createElement("div");
    t.className = "sh-egg sh-egg-toast" + (cls ? " " + cls : "");
    t.setAttribute("role", "status");
    t.innerHTML = html;
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add("is-shown"); });
    var kill = function(){ t.classList.remove("is-shown"); setTimeout(function(){ t.remove(); }, 350); };
    t.addEventListener("click", kill);
    setTimeout(kill, ms || 4200);
    return t;
  }
  function row(icon, title, sub){
    return '<span class="sh-egg-ic">' + icon + '</span><span><b>' + title + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>';
  }

  /* ================= Golden Probe ================= */
  function goldenQid(){
    var ex = exp(), taught = {};
    (ex.lectures || []).forEach(function(l){ if (!l.status || l.status === "taught") taught[l.id] = 1; });
    var qs = (ex.questions || []).filter(function(q){ return taught[q.lec]; });
    if (!qs.length) return null;
    return qs[hash(HUB + "|" + centralParts().day) % qs.length].id;
  }
  function checkGolden(qid){
    var day = centralParts().day;
    if (qid !== goldenQid() || ls("sh_egg_golden_" + HUB) === day) return;
    ls("sh_egg_golden_" + HUB, day);
    rpc("claim_golden_probe", { p_hub: HUB, p_visitor: VISITOR, p_qid: qid }).then(function(won){
      if (won === true) {
        H.confetti(); setTimeout(H.confetti, 450);
        toast(row(IC.probe, "You found today's Golden Probe!", "First in the class to answer it right. Your name is on the dashboard until midnight."), 7000, "is-gold");
        H.send({ t: "golden", name: H.name() });
        announce("golden");
      } else if (won === false) {
        rpc("get_golden_today", {}).then(function(rows){
          var r = (rows || []).filter(function(x){ return x.hub === HUB; })[0];
          toast(row(IC.probe, "That was today's Golden Probe", r ? esc(r.display_name) + " got to it first." : "Someone got to it first."), 5000, "is-gold");
        });
      }
    });
  }

  /* ================= Tooth Fairy ================= */
  function maybeFairy(test){
    if (!test) {
      if (Math.random() >= 1 / 400) return;
      var last = +(ls("sh_egg_fairy_t") || 0);
      if (Date.now() - last < 10 * 60 * 1000) return;
      ls("sh_egg_fairy_t", String(Date.now()));
    }
    /* her look and her flight path change every visit; one flight in ten she is the Golden Fairy */
    var looks = FAIRY_LOOKS.filter(function(v){ return !v.rare; });
    var v = test && test.look != null ? FAIRY_LOOKS[test.look % FAIRY_LOOKS.length] : Math.random() < .1 ? FAIRY_LOOKS[FAIRY_LOOKS.length - 1] : looks[Math.floor(Math.random() * looks.length)];
    var path = test && test.path || ["wave", "loop", "zigzag", "swoop", "back"][Math.floor(Math.random() * 5)];
    var f = document.createElement("button");
    f.type = "button";
    f.className = "sh-egg sh-egg-fairy is-" + path + (v.rare ? " is-golden" : "");
    f.setAttribute("aria-label", v.rare ? "Catch the Golden Tooth Fairy" : "Catch the Tooth Fairy");
    f.style.top = (18 + Math.random() * 45) + "vh";
    f.innerHTML = fairyArt(v);
    document.body.appendChild(f);
    /* a sparkle trail behind her */
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var trail = reduce ? 0 : setInterval(function(){
      if (!f.isConnected) { clearInterval(trail); return; }
      var r = f.getBoundingClientRect(), d = document.createElement("span");
      d.className = "sh-egg sh-egg-dust"; d.setAttribute("aria-hidden", "true");
      d.style.left = (r.left + r.width / 2 + (Math.random() - .5) * 16) + "px"; d.style.top = (r.top + r.height * .6 + (Math.random() - .5) * 12) + "px";
      d.style.background = Math.random() < .5 ? v.wing : "#FFE36B";
      document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 900);
    }, 110);
    var gone = setTimeout(function(){ clearInterval(trail); f.remove(); }, 7600);
    var CAUGHT = v.rare ? ["She left a gold crown behind. Lucky you.", "The rarest flight of all, and you caught it."]
      : ["She dropped a coin and flew off giggling.", "She says your enamel looks fantastic.", "She's off to find a loose tooth somewhere.", "She tried to take your notes. You said no."];
    f.addEventListener("click", function(){
      clearTimeout(gone); clearInterval(trail);
      f.classList.add("is-caught");
      setTimeout(function(){ f.remove(); }, 500);
      if (v.rare) { H.confetti(); }
      announce("fairy", { look: v.id });
      if (test) { toast(row(fairyArt(v), "Preview: Tooth Fairy caught", v.id + " · " + path), 4000); return; }
      rpc("record_fairy", { p_hub: HUB, p_visitor: VISITOR }).then(function(n){
        var line = CAUGHT[Math.floor(Math.random() * CAUGHT.length)];
        toast(row(fairyArt(v), v.rare ? "You caught the Golden Tooth Fairy!" : "You caught the Tooth Fairy!", line + (n ? " That's " + n + " caught so far. Collectors are listed under Stats." : "")), 5600, v.rare ? "is-gold" : "");
      });
    });
  }

  /* ================= Plaque Boss ================= */
  var boss = null, bossHidden = false, lastHitSend = 0;
  function bossId(){ var c = centralParts(); return HUB + "|" + c.day + "|" + Math.floor(c.hour / 2); }
  function bossDown(id){ return ls("sh_egg_boss_down") === id; }
  function spawnBoss(hp, test){
    var id = bossId();
    if (!test && boss && boss.id === id) return;
    if (!test && bossDown(id)) return;
    if (boss) boss.el.remove();
    var k = test ? test.k : bossKind(id);
    var el = document.createElement("div");
    el.className = "sh-egg sh-egg-boss sh-egg-boss-" + k.id;
    el.innerHTML = '<span class="sh-egg-boss-face" style="color:' + k.color + '">' + bossIcon(k) + '</span>' +
      '<span class="sh-egg-boss-body"><b>' + bossName(k) + '</b><small>Every correct answer from anyone in the hub hits it</small>' +
      '<span class="sh-egg-boss-bar"><i></i></span></span>' +
      '<button type="button" class="sh-egg-x" aria-label="Hide the boss">×</button>';
    document.body.appendChild(el);
    el.querySelector(".sh-egg-x").addEventListener("click", function(){ bossHidden = true; el.classList.remove("is-shown"); });
    boss = { id: id, k: k, max: k.hp, hp: Math.min(k.hp, hp || k.hp), el: el, test: !!test };
    drawBoss();
    requestAnimationFrame(function(){ if (!bossHidden && ok()) el.classList.add("is-shown"); });
  }
  function drawBoss(){
    if (!boss) return;
    var f = boss.hp / boss.max, said = boss.k.said;
    boss.el.querySelector(".sh-egg-boss-bar i").style.width = (100 * f) + "%";
    var se = season(), first = se && boss.hp === boss.max ? se.line : said[0];
    boss.el.querySelector("small").textContent = boss.hp + " / " + boss.max + " HP · " + (f > .6 ? first : f > .25 ? said[1] : said[2]);
    boss.el.classList.toggle("is-low", f <= .25);
    boss.el.classList.toggle("is-shown", !bossHidden && ok());
  }
  function defeatBoss(by){
    if (!boss) return;
    ls("sh_egg_boss_down", boss.id);
    var el = boss.el, k = boss.k; boss = null;
    el.classList.add("is-dead");
    setTimeout(function(){ el.remove(); }, 900);
    if (!on()) return;
    H.confetti(); setTimeout(H.confetti, 350); setTimeout(H.confetti, 700);
    toast(row('<span style="color:' + k.color + ';display:block;width:100%;height:100%">' + bossIcon(k) + '</span>', bossName(k) + " defeated!", "Final blow: " + esc(by || "someone") + ". Nice teamwork."), 6000, "is-gold");
    announce("boss", { kind: k.id });
  }
  /* every 5th right answer in a row lands a critical hit for 2 */
  function hitBoss(streak){
    if (!boss || boss.id !== bossId()) return;
    var crit = streak > 0 && streak % 5 === 0, dmg = crit ? 2 : 1;
    boss.hp = Math.max(0, boss.hp - dmg);
    boss.el.classList.remove("is-hit"); void boss.el.offsetWidth; boss.el.classList.add("is-hit");
    var pop = document.createElement("span"); pop.className = "sh-egg-boss-dmg" + (crit ? " is-crit" : ""); pop.textContent = crit ? "CRIT -2" : "-1";
    pop.style.left = (14 + Math.random() * 16) + "px";
    boss.el.appendChild(pop); setTimeout(function(){ pop.remove(); }, 900);
    drawBoss();
    if (boss.hp === 0 && boss.test) { defeatBoss("you (preview)"); return; }
    if (boss.hp === 0) {
      var me = H.name();
      H.send({ t: "boss-down", id: boss.id, by: me });
      rpc("record_achievement", { p_visitor: VISITOR, p_kind: "boss", p_hub: HUB });
      defeatBoss(me);
    } else if (!boss.test && Date.now() - lastHitSend > 600) {
      lastHitSend = Date.now();
      H.send({ t: "hit", id: boss.id, hp: boss.hp });
    }
  }
  setInterval(function(){
    if (boss && boss.id !== bossId()) { boss.el.remove(); boss = null; }
    if (!boss && on() && H.online() >= 5) spawnBoss();
    drawBoss();
  }, 15000);

  /* ================= broadcasts from classmates ================= */
  document.addEventListener("sh:egg", function(e){
    var d = e.detail || {};
    if (d.t === "hit" && d.id === bossId()) {
      if (!boss) spawnBoss(d.hp);
      if (boss && typeof d.hp === "number" && d.hp < boss.hp) { boss.hp = Math.max(0, d.hp); drawBoss(); }
      if (boss && boss.hp === 0) defeatBoss("a classmate");
    } else if (d.t === "boss-down" && d.id === bossId()) {
      if (!boss) { ls("sh_egg_boss_down", d.id); return; }
      defeatBoss(String(d.by || "a classmate").slice(0, 40));
    } else if (d.t === "golden" && ok()) {
      toast(row(IC.probe, esc(String(d.name || "A classmate").slice(0, 40)) + " just found today's Golden Probe", "One question here is golden each day. Tomorrow it could be you."), 5000, "is-gold");
    }
  });

  /* ================= answer-driven eggs ================= */
  var wrongRun = 0, rightAfter = 0, rightRun = 0;
  document.addEventListener(H.answeredEvent, function(e){
    var d = (e && e.detail) || {};
    if (!ok()) return;
    var correct = !!d.correct;
    rightRun = correct ? rightRun + 1 : 0;
    if (correct) { checkGolden(String(d.qid || "")); hitBoss(rightRun); if (sh8bit) blip(); }
    archAnswer(correct);
    /* Through the Root Canal: 10 misses in a row, then 10 right in a row */
    if (!correct) { if (rightAfter) { wrongRun = 0; rightAfter = 0; } wrongRun++; }
    else if (wrongRun >= 10) {
      rightAfter++;
      if (rightAfter === 10) {
        wrongRun = 0; rightAfter = 0;
        H.confetti();
        rpc("record_achievement", { p_visitor: VISITOR, p_kind: "rootcanal", p_hub: HUB });
        toast(row(IC.root, "Through the Root Canal", "Ten misses, then ten straight right. That's the whole procedure."), 6000, "is-gold");
        announce("rootcanal");
      }
    } else wrongRun = 0;
    /* Night Owl: once a night, 2-4 am local */
    var h = new Date().getHours();
    if (h >= 2 && h < 4) {
      var night = new Date().toDateString();
      if (ls("sh_egg_owl") !== night) {
        ls("sh_egg_owl", night);
        rpc("record_achievement", { p_visitor: VISITOR, p_kind: "owl", p_hub: HUB });
        toast(row(IC.owl, "Night Owl", "Studying at " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ". Respect. Now go to sleep."), 6000);
        announce("owl");
      }
    }
    maybeFairy();
  });

  /* ================= Professor soundboard: tap a name 5 times ================= */
  var profTaps = { who: "", n: 0, t: 0 };
  document.addEventListener("click", function(e){
    if (!ok()) return;
    var lecs = exp().lectures || [];
    if (!lecs.length) return;
    var el = e.target, who = null;
    for (var i = 0; i < 3 && el && el !== document.body && !who; i++, el = el.parentElement) {
      var txt = (el.textContent || "").trim();
      if (txt.length > 70) break;
      lecs.forEach(function(l){ if (!who && l.who && txt.indexOf(l.who) === 0) who = l.who; });
    }
    if (!who) return;
    var now = Date.now();
    if (profTaps.who !== who || now - profTaps.t > 2500) profTaps = { who: who, n: 0, t: now };
    profTaps.n++; profTaps.t = now;
    if (profTaps.n < 5) return;
    profTaps.n = 0;
    var ids = {}; lecs.forEach(function(l){ if (l.who === who) ids[l.id] = 1; });
    var pool = (exp().hints || []).filter(function(x){ return ids[x.lec] && x.quote; });
    if (!pool.length) return;
    var q = pool[Math.floor(Math.random() * pool.length)].quote.replace(/\s+/g, " ").trim();
    if (q.length > 240) q = q.slice(0, 240).replace(/\s+\S*$/, "") + "…";
    rpc("record_achievement", { p_visitor: VISITOR, p_kind: "prof", p_hub: HUB });
    toast('<span class="sh-egg-ic">' + IC.quote + '</span><span><span class="sh-egg-quote">' + esc(q) + '</span><small>— ' + esc(who) + '</small></span>', 9000, "is-quote");
    announce("prof", { who: who });
  }, true);

  /* ================= keyboard: Konami → 8-bit; magic words: "floss", "mirror", the holiday's word ================= */
  var KONAMI = "ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a";
  var keys = [], typed = "", sh8bit = false, audioCtx = null;
  function magicWords(){
    var w = { floss: floss, mirror: toggleMirror };
    if (HOLIDAY) w[HOLIDAY.word] = holidayWord;
    return w;
  }
  function trySpell(s){
    if (!ok()) return false;
    var w = magicWords();
    for (var k in w) if (s.slice(-k.length) === k) { w[k](); return true; }
    return false;
  }
  document.addEventListener("keydown", function(e){
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    keys.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (keys.length > 10) keys.shift();
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) typed = (typed + e.key.toLowerCase()).slice(-12);
    if (!on()) return;
    if (keys.join(" ") === KONAMI) { keys = []; toggle8bit(); }
    else if (trySpell(typed)) { keys = []; typed = ""; }
  });
  /* the same words typed into the hub's Search box (phones have no stray keyboard) */
  var spelled = "";
  document.addEventListener("input", function(e){
    var t = e.target;
    if (!t || t.id !== "shstat-search-input") return;
    var v = String(t.value || "").trim().toLowerCase();
    if (v === spelled) return;
    spelled = v;
    if (magicWords()[v]) trySpell(v);
  }, true);

  /* ================= "mirror": indirect vision ================= */
  /* flips the hub's own page blocks (the in-flow children of <body>), not the floating widget, toasts or tooth buddy:
     a transform on <html> or <body> would knock every position:fixed thing out of the viewport */
  function toggleMirror(){
    var now = document.documentElement.classList.toggle("sh-mirror");
    Array.prototype.forEach.call(document.body.children, function(el){
      if (/^(SCRIPT|STYLE|LINK)$/.test(el.tagName)) return;
      if (!now) { el.classList.remove("sh-mirror-flip"); return; }
      var pos = getComputedStyle(el).position;
      if (pos !== "fixed" && pos !== "absolute" && !/^(shstat|sh-|shpet)/.test(el.id || "") && !el.classList.contains("sh-egg") && !el.classList.contains("shpet"))
        el.classList.add("sh-mirror-flip");
    });
    if (now) {
      rpc("record_achievement", { p_visitor: VISITOR, p_kind: "mirror", p_hub: HUB });
      announce("mirror");
    }
    toast(row(IC.mirror, now ? "Indirect vision" : "Direct vision again", now ? "Everything's backwards, just like the maxillary arch in your mirror. Type mirror again to flip back." : ""), 4200);
  }
  /* phones: the same code as swipes (up up down down left right left right) then two taps;
     each gesture must follow the last within 1.5 s, so ordinary scrolling never completes it */
  var swipes = [], touch0 = null, lastGesture = 0, SWIPE_CODE = "U U D D L R L R T T";
  document.addEventListener("touchstart", function(e){
    if (e.touches.length !== 1) { touch0 = null; return; }
    touch0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  document.addEventListener("touchend", function(e){
    if (!touch0 || !on()) return;
    var t = e.changedTouches[0], dx = t.clientX - touch0.x, dy = t.clientY - touch0.y, g;
    touch0 = null;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) g = "T";
    else if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) g = dx < 0 ? "L" : "R";
    else if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.5) g = dy < 0 ? "U" : "D";
    else return;
    var now = Date.now();
    if (now - lastGesture > 1500) swipes = [];
    lastGesture = now;
    swipes.push(g);
    if (swipes.length > 10) swipes.shift();
    if (swipes.join(" ") === SWIPE_CODE) { swipes = []; toggle8bit(); }
  }, { passive: true });
  function toggle8bit(){
    sh8bit = !sh8bit;
    if (sh8bit && !document.getElementById("sh-egg-8bit-font")) {
      var l = document.createElement("link");
      l.id = "sh-egg-8bit-font"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=VT323&display=swap";
      document.head.appendChild(l);
    }
    document.documentElement.classList.toggle("sh-8bit", sh8bit);
    if (sh8bit) rpc("record_achievement", { p_visitor: VISITOR, p_kind: "konami", p_hub: HUB });
    toast(row(IC.tooth, sh8bit ? "8-bit mode" : "Back to 2026", sh8bit ? "Correct answers go blip. Do the code again to leave." : ""), 3200);
    if (sh8bit) blip(true);
  }
  function blip(up){
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime;
      o.type = "square";
      o.frequency.setValueAtTime(up ? 523 : 880, t0);
      o.frequency.setValueAtTime(up ? 784 : 1320, t0 + 0.07);
      g.gain.setValueAtTime(0.06, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
      o.connect(g); g.connect(audioCtx.destination); o.start(t0); o.stop(t0 + 0.2);
    } catch (e) {}
  }
  var FLOSS_TOOTH = '<g class="egg-fl-body"><path fill="var(--egg-fairy-fill,#fff)" stroke="currentColor" stroke-width="3" stroke-linejoin="round" d="M26 12c-7 0-11 5-11 12 0 8 4 12 5 19 1 8 3 17 7 17s5-8 6-13c.5-3 1.5-4 7-4s6.5 1 7 4c1 5 2 13 6 13s6-9 7-17c1-7 5-11 5-19 0-7-4-12-11-12-5 0-8 2-14 2s-9-2-14-2z"/>' +
    '<circle cx="32" cy="30" r="2.6" fill="currentColor"/><circle cx="48" cy="30" r="2.6" fill="currentColor"/><path d="M33 38c4 4 10 4 14 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></g>';
  function floss(){
    if (inMock()) return;
    flossers.__me = Date.now();
    H.send({ t: "floss", name: H.name() });
    rpc("record_achievement", { p_visitor: VISITOR, p_kind: "floss", p_hub: HUB });
    announce("floss");
    if (checkChain()) return;
    if (document.querySelector(".sh-egg-floss")) return;
    var d = document.createElement("div");
    d.className = "sh-egg sh-egg-floss";
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = '<svg viewBox="0 0 80 90"><g class="egg-fl-arms" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 40l-12 10"/><path d="M62 40l12 10"/></g>' +
      '<path class="egg-fl-string" d="M4 52C30 70 50 70 76 52" fill="none" stroke="var(--egg-floss,#3ecf7e)" stroke-width="2"/>' + FLOSS_TOOTH + '</svg>';
    document.body.appendChild(d);
    setTimeout(function(){ d.remove(); }, 4600);
  }

  /* ================= Floss Chain: three or more people in this hub floss within a minute ================= */
  var flossers = {}, chainAt = 0, inviteAt = 0, CHAIN_WINDOW = 60000;
  function recentFlossers(){
    var now = Date.now(), out = [];
    for (var k in flossers) if (now - flossers[k] < CHAIN_WINDOW) out.push(k);
    return out;
  }
  function checkChain(){
    var who = recentFlossers();
    if (who.indexOf("__me") < 0 || who.length < 3 || Date.now() - chainAt < 120000 || !ok()) return false;
    chainAt = Date.now();
    showChain(who.map(function(k){ return k === "__me" ? "You" : k; }));
    rpc("record_achievement", { p_visitor: VISITOR, p_kind: "flosschain", p_hub: HUB });
    announce("flosschain", { n: who.length });
    return true;
  }
  function showChain(names){
    var old = document.querySelector(".sh-egg-chain"); if (old) old.remove();
    names = names.slice(0, 8);
    var W = Math.max(320, Math.min(window.innerWidth, 1100)), n = names.length, gap = W / n, Hh = 150;
    var teeth = "", pts = [];
    names.forEach(function(nm, i){
      var cx = gap * (i + .5);
      pts.push([cx - 34, 70], [cx + 34, 70]);   // the hands, in the tooth's own frame (it's drawn 22px down)
      teeth += '<g transform="translate(' + (cx - 40) + ' 22)"><g class="egg-chain-t" style="animation-delay:' + (i * -0.12).toFixed(2) + 's">' +
        '<g class="egg-fl-arms" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 40l-12 30"/><path d="M62 40l12 30"/></g>' + FLOSS_TOOTH + '</g>' +
        '<text x="40" y="118" text-anchor="middle" class="egg-chain-name">' + esc(String(nm).slice(0, 18)) + '</text></g>';
    });
    var d = "M0 " + (70 + 22);
    pts.forEach(function(p, i){ d += (i % 2 ? " L" : " Q" + (p[0] - gap * .25) + " " + (118 + 22) + " ") + p[0] + " " + (p[1] + 22); });
    d += " Q" + (W - 10) + " " + (118 + 22) + " " + W + " " + (70 + 22);
    var el = document.createElement("div");
    el.className = "sh-egg sh-egg-chain"; el.setAttribute("role", "status");
    el.innerHTML = '<div class="sh-egg-chain-h">Floss Chain! ' + n + ' of you, flossing together.</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + (Hh + 22) + '" preserveAspectRatio="xMidYMax meet"><path class="egg-chain-string" d="' + d + '"/>' + teeth + '</svg>';
    document.body.appendChild(el);
    H.confetti();
    setTimeout(function(){ el.classList.add("is-out"); setTimeout(function(){ el.remove(); }, 500); }, 7000);
  }
  document.addEventListener("sh:egg", function(e){
    var d = e.detail || {};
    if (d.t !== "floss") return;
    var name = String(d.name || "A classmate").slice(0, 40);
    flossers[name] = Date.now();
    if (checkChain()) return;
    /* someone else is flossing: invite everyone who hasn't yet */
    if (ok() && Date.now() - (flossers.__me || 0) > CHAIN_WINDOW && Date.now() - inviteAt > 60000) {
      inviteAt = Date.now();
      var n = recentFlossers().length;
      toast(row(IC.tooth, esc(name) + " is flossing", "Type floss (or search it) to join in. " + (n >= 2 ? "One more makes a Floss Chain!" : "Three at once makes a Floss Chain.")), 6000);
    }
  });

  /* ================= Full Arch: once per hub. Right answers grow teeth, misses knock them out; fill all 32 ================= */
  var ARCH_KEY = "sh_egg_arch_" + HUB, ARCH_DONE = "sh_egg_arch_done_" + HUB, archEl = null, archHide = null;
  var archN = Math.max(0, Math.min(31, +(ls(ARCH_KEY) || 0)));
  function archDone(){ return ls(ARCH_DONE) === "1"; }
  /* drawn as a little dental chart: maxillary teeth #1-16 on top (roots up), mandibular #32-17 below (roots down),
     patient's right on the viewer's left, the way a chart reads */
  var ARCH_TYPE = "MMMPPCIIIICPPMMM";
  var ARCH_SHAPE = {
    M: "M0.6 9 L0.3 2 Q0.5 0 1.5 .6 L2.7 7 L4.7 7 L5.9 .6 Q6.9 0 7.1 2 L6.8 9 Q7.4 15 5.9 17 Q3.7 18.3 1.5 17 Q0 15 .6 9 Z",
    P: "M1.4 9 L2.5 1 Q3.5 -.4 4.5 1 L5.6 9 Q6.8 14 5.4 16.6 Q3.5 18 1.6 16.6 Q.2 14 1.4 9 Z",
    C: "M1.5 8 L2.6 -.6 Q3.5 -1.6 4.4 -.6 L5.5 8 Q6.7 13 3.5 18 Q.3 13 1.5 8 Z",
    I: "M1.7 9 L2.6 .6 Q3.5 -.4 4.4 .6 L5.3 9 Q6.1 14 5.5 17.4 L1.5 17.4 Q.9 14 1.7 9 Z"
  };
  function archSvg(){
    var s = '<svg viewBox="0 0 136 44" aria-hidden="true">';
    for (var k = 1; k <= 32; k++) {
      var upper = k <= 16, i = upper ? k - 1 : 32 - k, t = ARCH_TYPE.charAt(i);
      var x = 2.2 + i * 8.25 + (t === "M" ? 0 : .5);
      /* the position (and the lower arch's flip) lives on a wrapper group: the pop animation's CSS transform on the
         path itself would otherwise replace it, and fill-box origins would shift the flipped lower teeth */
      s += '<g transform="translate(' + x.toFixed(2) + (upper ? ' 2)' : ' 42) scale(1 -1)') + '"><path class="egg-arch-t" data-k="' + k + '" d="' + ARCH_SHAPE[t] + '"/></g>';
    }
    return s + '<path d="M2 22 H134" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 2" opacity=".35"/></svg>';
  }
  function archDraw(pop){
    if (!archEl) return;
    archEl.querySelectorAll(".egg-arch-t").forEach(function(t){
      var k = +t.getAttribute("data-k");
      t.classList.toggle("is-in", k <= archN);
      if (k === pop) { t.classList.remove("is-pop"); void t.getBoundingClientRect(); t.classList.add("is-pop"); }
    });
    archEl.querySelector(".sh-egg-arch-n").textContent = archN + " / 32";
  }
  function archShow(){
    if (!archEl) {
      archEl = document.createElement("div");
      archEl.className = "sh-egg sh-egg-arch";
      archEl.setAttribute("role", "img");
      archEl.title = "Full Arch: every right answer grows a tooth, every miss knocks one out. Fill all 32.";
      archEl.innerHTML = archSvg() + '<div class="sh-egg-arch-cap"><b>Full Arch</b><span class="sh-egg-arch-n"></span></div>';
      document.body.appendChild(archEl);
    }
    archEl.setAttribute("aria-label", "Full Arch, " + archN + " of 32 teeth");
    requestAnimationFrame(function(){ archEl.classList.add("is-shown"); });
    clearTimeout(archHide);
    archHide = setTimeout(function(){ if (archEl) archEl.classList.remove("is-shown"); }, 5500);
  }
  function knockOut(k){
    if (!archEl) return;
    var t = archEl.querySelector('.egg-arch-t[data-k="' + k + '"]'); if (!t || !t.getBoundingClientRect) return;
    var r = t.getBoundingClientRect(), f = document.createElement("span");
    f.className = "sh-egg sh-egg-arch-fly"; f.setAttribute("aria-hidden", "true");
    f.style.left = r.left + "px"; f.style.top = r.top + "px";
    f.innerHTML = IC.tooth;
    document.body.appendChild(f);
    setTimeout(function(){ f.remove(); }, 900);
  }
  function archAnswer(correct){
    if (archDone() || !ok()) return;
    if (!archEl) archShow();
    if (correct) { archN++; archShow(); archDraw(archN); }
    else if (archN > 0) { archShow(); knockOut(archN); archN--; archDraw(0); }
    else return;
    ls(ARCH_KEY, String(archN));
    if (archN >= 32) {
      ls(ARCH_DONE, "1"); ls(ARCH_KEY, null);
      archEl.classList.add("is-full");
      H.confetti(); setTimeout(H.confetti, 350); setTimeout(H.confetti, 700);
      rpc("record_achievement", { p_visitor: VISITOR, p_kind: "fullarch", p_hub: HUB });
      toast(row(IC.arch, "Full Arch!", "All 32 teeth, fully erupted. That's the whole adult dentition for this hub. It's on your trophy shelf now."), 7000, "is-gold");
      announce("fullarch");
      clearTimeout(archHide);
      setTimeout(archRetire, 4000);
    }
  }
  function archRetire(){ if (!archEl) return; var el = archEl; archEl = null; el.classList.remove("is-shown"); setTimeout(function(){ el.remove(); }, 400); }
  /* ranks.js knows from the server whether this hub's arch is already done (another device, cleared storage) */
  document.addEventListener("sh:arch-done", function(e){ if (e.detail === HUB) { ls(ARCH_DONE, "1"); archRetire(); } });

  /* ================= Cavity Search: a weekly cavity hidden in one paragraph of the Lecture Notes ================= */
  function isoWeek(){
    var p = centralParts().day.split("-"), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    var day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)), wk = Math.ceil(((d - y0) / 864e5 + 1) / 7);
    return d.getUTCFullYear() + "-W" + (wk < 10 ? "0" : "") + wk;
  }
  var CAV_WEEK = isoWeek(), CAV_KEY = "sh_egg_cavity_" + HUB, cavTarget = undefined, cavFull = false, cavObs = null;
  function squash(s){ return String(s || "").replace(/\s+/g, " ").trim(); }
  function cavityTarget(){
    if (cavTarget !== undefined) return cavTarget;
    var ex = exp(), taught = {};
    (ex.lectures || []).forEach(function(l){ if (!l.status || l.status === "taught") taught[l.id] = 1; });
    var pool = (ex.sections || []).filter(function(s){ return /^notes$/i.test(s.kind || "") && taught[s.lec] && squash(s.text).length >= 140; });
    cavTarget = pool.length ? pool[hash(HUB + "|cavity|" + CAV_WEEK) % pool.length] : null;
    return cavTarget;
  }
  function placeCavity(){
    if (!ok() || cavFull || ls(CAV_KEY) === CAV_WEEK || document.querySelector(".sh-egg-cavity")) return;
    var tg = cavityTarget(); if (!tg) return;
    var head = squash(tg.text).slice(0, 60), els = document.querySelectorAll(".reading-prose p, .reading-prose li");
    for (var i = 0; i < els.length; i++) {
      if (squash(els[i].textContent).slice(0, 60) !== head) continue;
      /* tuck it after a word about two-thirds of the way through the paragraph */
      var walker = document.createTreeWalker(els[i], NodeFilter.SHOW_TEXT), nodes = [], node, total = 0;
      while ((node = walker.nextNode())) { nodes.push(node); total += node.nodeValue.length; }
      var goal = Math.floor(total * (0.45 + (hash(CAV_WEEK + HUB) % 30) / 100)), acc = 0;
      for (var j = 0; j < nodes.length; j++) {
        var nv = nodes[j].nodeValue;
        if (acc + nv.length < goal) { acc += nv.length; continue; }
        var at = nv.indexOf(" ", Math.max(0, goal - acc));
        if (at < 0) { acc += nv.length; continue; }
        var after = nodes[j].splitText(at);
        var b = document.createElement("button");
        b.type = "button"; b.className = "sh-egg sh-egg-cavity";
        b.setAttribute("aria-label", "A tiny cavity. Tap to restore it");
        b.title = "Hmm, is that a cavity?";
        after.parentNode.insertBefore(b, after);
        b.addEventListener("click", fillCavity);
        return;
      }
    }
  }
  function fillCavity(e){
    var b = e.currentTarget; e.preventDefault(); e.stopPropagation();
    if (b.classList.contains("is-filled")) return;
    b.classList.add("is-filled");
    ls(CAV_KEY, CAV_WEEK);
    rpc("claim_cavity", { p_hub: HUB, p_visitor: VISITOR, p_week: CAV_WEEK }).then(function(n){
      if (n === 0) {
        cavFull = true;
        toast(row(IC.cavity, "Already restored", "Five classmates beat you to this week's cavity. A new one hides somewhere next week."), 5200);
        setTimeout(function(){ b.remove(); }, 1200);
        return;
      }
      H.confetti();
      toast(row(IC.cavity, "Cavity restored!", n ? "You're #" + n + " of 5 this week. A new one hides somewhere in the notes next Monday." : "Nice catch. A new one hides somewhere in the notes next Monday."), 6000, "is-gold");
      announce("cavity", { n: n });
      setTimeout(function(){ b.classList.add("is-gone"); setTimeout(function(){ b.remove(); }, 900); }, 2600);
    });
  }
  function startCavity(){
    if (cavObs || !document.body) return;
    if (ls(CAV_KEY) === CAV_WEEK || !cavityTarget()) return;
    rpc("get_cavity_week", { p_hub: HUB, p_week: CAV_WEEK }).then(function(rows){ if (rows && rows.length >= 5) { cavFull = true; var b = document.querySelector(".sh-egg-cavity:not(.is-filled)"); if (b) b.remove(); } });
    var queued = false;
    cavObs = new MutationObserver(function(){ if (queued) return; queued = true; setTimeout(function(){ queued = false; placeCavity(); }, 250); });
    cavObs.observe(document.body, { childList: true, subtree: true });
    placeCavity();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startCavity); else startCavity();

  /* ================= Stats panel: today's Golden Probe + Tooth Fairy collectors ================= */
  var boardAt = 0;
  document.addEventListener("click", function(){
    setTimeout(function(){
      var p = H.statsPanel();
      if (!p || !p.classList.contains("is-open") || !on()) return;
      var box = p.querySelector(".sh-egg-board");
      if (box && Date.now() - boardAt < 30000) return;
      boardAt = Date.now();
      if (!box) { box = document.createElement("div"); box.className = "sh-egg-board"; p.appendChild(box); }
      Promise.all([rpc("get_golden_today", {}), rpc("get_fairy_board", { p_limit: 5 }),
                   cavityTarget() ? rpc("get_cavity_week", { p_hub: HUB, p_week: CAV_WEEK }) : Promise.resolve(null)]).then(function(r){
        var g = (r[0] || []).filter(function(x){ return x.hub === HUB; })[0];
        var fairies = r[1] || [], cav = r[2];
        var fl = window.shRanks && window.shRanks.flair ? window.shRanks.flair : function(){ return ""; };
        box.innerHTML = '<div class="sh-egg-board-h">' + IC.probe + '<span>Golden Probe</span></div>' +
          '<p>' + (g ? "Today's was found by <b>" + esc(g.display_name) + "</b>. A new one hides here tomorrow."
                    : "One question in this hub is golden today. The first classmate to answer it right claims it.") + '</p>' +
          (cav ? '<div class="sh-egg-board-h">' + IC.cavity + '<span>Cavity Search</span></div><p>' +
            (cav.length ? "This week's cavity was restored by <b>" + cav.map(function(c){ return esc(c.display_name); }).join("</b>, <b>") + "</b>." +
              (cav.length < 5 ? " " + (5 - cav.length) + " more can still fill it." : " All five fillings are done. A new one hides next week.")
              : "A tiny cavity is hiding somewhere in this hub's Lecture Notes this week. The first five to tap it restore it.") + '</p>' : "") +
          (fairies.length ? '<div class="sh-egg-board-h"><span class="sh-egg-board-fairy">' + fairyArt(FAIRY_LOOKS[0]) + '</span><span>Tooth Fairy collectors</span></div><ol>' +
            fairies.map(function(f){ return '<li><span>' + esc(f.display_name) + fl(f.flair) + '</span><b>' + f.catches + '</b></li>'; }).join("") + '</ol>' : "");
      });
    }, 60);
  });
  /* try them from the console: shEggs.preview("fairy", 5, "loop") (look 0-5, 5 = golden), shEggs.preview("boss", 3) (0-7),
     shEggs.preview("golden"). Previews record nothing and never broadcast. Seasonal versions: set
     localStorage.sh_egg_holiday_test = "winter" (any holiday id, or "none" for the regular ones) and reload. */
  window.shEggs = { BOSSES: BOSSES, FAIRY_LOOKS: FAIRY_LOOKS, preview: function(kind, a, b){
    if (kind === "fairy") maybeFairy({ look: a, path: b });
    else if (kind === "boss") { bossHidden = false; spawnBoss(0, { k: BOSSES[(a | 0) % BOSSES.length] }); }
    else if (kind === "golden") toast(row(IC.probe, "You found today's Golden Probe!", "Preview. First in the class to answer it right gets their name on the dashboard."), 7000, "is-gold");
  } };
})();
