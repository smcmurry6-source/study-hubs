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
    probe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l9-9"/><path d="M12 12l3-3c1-1 1-3 3-4l2-1"/><path d="M14 16l1.5 1.5M16 14l1.5 1.5M18 12l1.5 1.5"/></svg>',
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
  function bossName(){ return HOLIDAY && on() ? HOLIDAY.boss : "Plaque Boss"; }
  /* the boss blob in costume: drawn into the same 40x40 frame as IC.blob */
  function bossIcon(){
    var id = HOLIDAY && on() ? HOLIDAY.id : "", under = "", over = "";
    if (id === "halloween") {
      under = '<path d="M5 14 C1 22 2 33 7 38 L12 31 L16 37 L20 31 L24 37 L28 31 L33 38 C38 33 39 22 35 14 Z" fill="#4A1A6B"/><path d="M5 14 C1 22 2 33 7 38" stroke="#C21E56" stroke-width="1.4" fill="none"/>';
      over = '<path d="M16.6 27.4 L18 31 L19.2 27.6 M20.8 27.6 L22 31 L23.4 27.4" fill="#fff" stroke="#fff" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M8 9 L13 3 L20 7 L27 3 L32 9" fill="none" stroke="#2B1B3D" stroke-width="2.2" stroke-linejoin="round"/>';
    } else if (id === "thanksgiving") {
      over = '<path d="M9 9 L11 -2 L29 -2 L31 9 Z" fill="#2B2B2B"/><rect x="5" y="7.6" width="30" height="3.4" rx="1.6" fill="#2B2B2B"/><rect x="10.4" y="3" width="19.2" height="3" fill="#8C6B3E"/><rect x="17" y="2.4" width="6" height="4.2" rx=".6" fill="none" stroke="#F6CD55" stroke-width="1.3"/>';
    } else if (id === "winter") {
      over = '<path d="M8 10 C10 1 22 -3 32 3 C30 5 30 8 31 10 Z" fill="#D6363C"/><path d="M31 3 C35 4 37 8 36 12" stroke="#D6363C" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="13" r="3" fill="#fff"/><rect x="6" y="8.6" width="28" height="4.4" rx="2.2" fill="#fff"/>';
    } else if (id === "newyear") {
      over = '<path d="M13 9 L20 -6 L27 9 Z" fill="#B08CFF"/><path d="M15.6 3.4 L24.4 3.4 M14.2 6.6 L25.8 6.6" stroke="#F6CD55" stroke-width="1.6"/><circle cx="20" cy="-6" r="2.4" fill="#F6CD55"/>';
    } else if (id === "valentine") {
      over = '<path d="M7 22 c-1.6-1-2.6-2.2-2.6-3.4 a1.6 1.6 0 0 1 2.6-1 a1.6 1.6 0 0 1 2.6 1 c0 1.2-1 2.4-2.6 3.4z M33 22 c-1.6-1-2.6-2.2-2.6-3.4 a1.6 1.6 0 0 1 2.6-1 a1.6 1.6 0 0 1 2.6 1 c0 1.2-1 2.4-2.6 3.4z" fill="#FF8FB1"/>';
    } else if (id === "dentist") {
      over = '<path d="M30 30 c2 2 4 2 5 0" stroke="#8FD3F5" stroke-width="1.6" fill="none"/><circle cx="34" cy="24" r="1.4" fill="#8FD3F5"/>';
    } else if (id === "stpatrick") {
      over = '<path d="M10 9 L12 -3 L28 -3 L30 9 Z" fill="#2F9E44"/><rect x="5" y="7.4" width="30" height="3.4" rx="1.6" fill="#1B6E2E"/><rect x="11.4" y="3.2" width="17.2" height="2.8" fill="#2B2B2B"/><rect x="17.4" y="2.6" width="5.2" height="4" rx=".6" fill="none" stroke="#F6CD55" stroke-width="1.2"/>';
    } else if (id === "easter") {
      over = '<path d="M13 9 C9 -4 11 -10 14 -10 C17 -10 18 -2 17 8" fill="#fff" stroke="#E7B9C8" stroke-width="1"/><path d="M13.6 5 C12.6 -2 13 -6 14 -6 C15 -6 15.6 -1 15.4 5" fill="#FFB3C7"/>' +
        '<path d="M27 9 C31 -4 29 -10 26 -10 C23 -10 22 -2 23 8" fill="#fff" stroke="#E7B9C8" stroke-width="1"/><path d="M26.4 5 C27.4 -2 27 -6 26 -6 C25 -6 24.4 -1 24.6 5" fill="#FFB3C7"/>';
    }
    if (!id) return IC.blob;
    return IC.blob.replace('<svg viewBox="0 0 40 40">', '<svg viewBox="0 -12 40 52" style="overflow:visible">' + under).replace(/<\/svg>$/, over + '</svg>');
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
  function maybeFairy(){
    if (Math.random() >= 1 / 400) return;
    var last = +(ls("sh_egg_fairy_t") || 0);
    if (Date.now() - last < 10 * 60 * 1000) return;
    ls("sh_egg_fairy_t", String(Date.now()));
    var f = document.createElement("button");
    f.type = "button";
    f.className = "sh-egg sh-egg-fairy";
    f.setAttribute("aria-label", "Catch the Tooth Fairy");
    f.style.top = (18 + Math.random() * 45) + "vh";
    f.innerHTML = IC.wing;
    document.body.appendChild(f);
    var gone = setTimeout(function(){ f.remove(); }, 7600);
    f.addEventListener("click", function(){
      clearTimeout(gone);
      f.classList.add("is-caught");
      setTimeout(function(){ f.remove(); }, 500);
      announce("fairy");
      rpc("record_fairy", { p_hub: HUB, p_visitor: VISITOR }).then(function(n){
        toast(row(IC.tooth, "You caught the Tooth Fairy!", n ? "That's " + n + " caught so far. Collectors are listed under Stats." : "She'll be back."), 5000);
      });
    });
  }

  /* ================= Plaque Boss ================= */
  var BOSS_HP = 40, boss = null, bossHidden = false, lastHitSend = 0;
  function bossId(){ var c = centralParts(); return HUB + "|" + c.day + "|" + Math.floor(c.hour / 2); }
  function bossDown(id){ return ls("sh_egg_boss_down") === id; }
  function spawnBoss(hp){
    var id = bossId();
    if (boss && boss.id === id) return;
    if (bossDown(id)) return;
    if (boss) boss.el.remove();
    var el = document.createElement("div");
    el.className = "sh-egg sh-egg-boss";
    el.innerHTML = '<span class="sh-egg-boss-face">' + bossIcon() + '</span>' +
      '<span class="sh-egg-boss-body"><b>' + bossName() + '</b><small>Every correct answer from anyone in the hub hits it</small>' +
      '<span class="sh-egg-boss-bar"><i></i></span></span>' +
      '<button type="button" class="sh-egg-x" aria-label="Hide the boss">×</button>';
    document.body.appendChild(el);
    el.querySelector(".sh-egg-x").addEventListener("click", function(){ bossHidden = true; el.classList.remove("is-shown"); });
    boss = { id: id, hp: Math.min(BOSS_HP, hp || BOSS_HP), el: el };
    drawBoss();
    requestAnimationFrame(function(){ if (!bossHidden && ok()) el.classList.add("is-shown"); });
  }
  function drawBoss(){
    if (!boss) return;
    boss.el.querySelector(".sh-egg-boss-bar i").style.width = (100 * boss.hp / BOSS_HP) + "%";
    boss.el.querySelector("small").textContent = boss.hp + " / " + BOSS_HP + " HP · every correct answer from anyone here hits it";
    boss.el.classList.toggle("is-shown", !bossHidden && ok());
  }
  function defeatBoss(by){
    if (!boss) return;
    ls("sh_egg_boss_down", boss.id);
    var el = boss.el; boss = null;
    el.classList.add("is-dead");
    setTimeout(function(){ el.remove(); }, 900);
    if (!on()) return;
    H.confetti(); setTimeout(H.confetti, 350); setTimeout(H.confetti, 700);
    toast(row(bossIcon(), bossName() + " defeated!", "Final blow: " + esc(by || "someone") + ". Nice teamwork."), 6000, "is-gold");
    announce("boss");
  }
  function hitBoss(){
    if (!boss || boss.id !== bossId()) return;
    boss.hp = Math.max(0, boss.hp - 1);
    boss.el.classList.remove("is-hit"); void boss.el.offsetWidth; boss.el.classList.add("is-hit");
    drawBoss();
    if (boss.hp === 0) {
      var me = H.name();
      H.send({ t: "boss-down", id: boss.id, by: me });
      rpc("record_achievement", { p_visitor: VISITOR, p_kind: "boss", p_hub: HUB });
      defeatBoss(me);
    } else if (Date.now() - lastHitSend > 600) {
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
  var wrongRun = 0, rightAfter = 0;
  document.addEventListener(H.answeredEvent, function(e){
    var d = (e && e.detail) || {};
    if (!ok()) return;
    var correct = !!d.correct;
    if (correct) { checkGolden(String(d.qid || "")); hitBoss(); if (sh8bit) blip(); }
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
      s += '<path class="egg-arch-t" data-k="' + k + '" d="' + ARCH_SHAPE[t] + '" transform="translate(' + x.toFixed(2) + (upper ? ' 2)' : ' 42) scale(1 -1)') + '"/>';
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
          (fairies.length ? '<div class="sh-egg-board-h">' + IC.tooth + '<span>Tooth Fairy collectors</span></div><ol>' +
            fairies.map(function(f){ return '<li><span>' + esc(f.display_name) + fl(f.flair) + '</span><b>' + f.catches + '</b></li>'; }).join("") + '</ol>' : "");
      });
    }, 60);
  });
})();
