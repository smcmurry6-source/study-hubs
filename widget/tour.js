/* study-hubs dashboard tour: a guided walk through everything on the dashboard and inside every hub.
   Loaded by index.html only.

   The first time someone opens the dashboard a card asks whether they want the tour ("Show me around" / "No thanks").
   Either answer is remembered (sh_tour = "done" | "skipped" | "no") so it never asks again, and the Tour button in the
   top bar (#tourBtn) starts it any time. Dashboard steps put a spotlight on the real part of the page; steps whose part
   isn't on screen for this visitor (no recaps yet, Timmy turned off) are left out. The "inside every hub" steps are
   plain cards.

   shTour.start()        // run it now (the Tour button)
   shTour.maybePrompt()  // ask once, on a first visit
   shTour.whenIdle(fn)   // run fn once neither the question nor the tour is on screen (surveys, check-ins, replies wait) */
(function(){
  "use strict";
  if (window.shTour) return;

  var KEY = "sh_tour";
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function track(what){ if (window.shTrack) window.shTrack("tour:" + what); }
  var reduced = false;
  try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var CSS = [
    ".sh-tour-block{position:fixed; inset:0; z-index:9000; background:transparent;}",
    "html.sh-touring .survey, html.sh-touring .sh-reply{visibility:hidden;}",     /* an open survey or reply card steps aside */
    ".sh-tour-block.is-dim{background:rgba(8,14,18,.55);}",
    ".sh-tour-spot{position:fixed; z-index:9001; border-radius:14px; pointer-events:none; box-shadow:0 0 0 2px var(--focus,#2F6FD6), 0 0 0 9999px rgba(8,14,18,.55);",
    "  transition:left .3s ease, top .3s ease, width .3s ease, height .3s ease, opacity .2s;}",
    ".sh-tour-spot[hidden]{display:block; opacity:0;}",
    ".sh-tour{position:fixed; z-index:9002; width:min(380px, calc(100vw - 32px)); background:var(--surface,#fff); color:var(--ink,#15202A);",
    "  border:1px solid var(--line,#D3DADF); border-radius:16px; box-shadow:0 2px 4px rgba(0,0,0,.08), 0 24px 48px -16px rgba(0,0,0,.5); padding:20px 20px 16px;",
    "  max-height:calc(100vh - 32px); max-height:calc(100dvh - 32px); overflow:auto; transition:left .3s ease, top .3s ease, opacity .2s;}",
    ".sh-tour.is-center{left:50% !important; top:50% !important; transform:translate(-50%,-50%); width:min(440px, calc(100vw - 32px));}",
    ".sh-tour-x{position:absolute; top:10px; right:10px; width:32px; height:32px; border:0; border-radius:50%; background:transparent; color:var(--ink-3,#6B7A86); font-size:22px; line-height:1; cursor:pointer;}",
    ".sh-tour-x:hover{background:var(--surface-2,#F3F6F8); color:var(--ink,#15202A);}",
    ".sh-tour-eyebrow{font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-3,#6B7A86);}",
    ".sh-tour h3{font-family:var(--serif, Georgia, serif); font-weight:400; font-size:25px; line-height:1.15; margin:4px 32px 8px 0;}",
    ".sh-tour-body{font-size:14.5px; line-height:1.5; color:var(--ink-2,#3E4C57);}",
    ".sh-tour-body p{margin:0 0 8px;} .sh-tour-body b{color:var(--ink,#15202A);}",
    ".sh-tour-body ul{margin:4px 0 8px; padding-left:18px;} .sh-tour-body li{margin:0 0 5px;}",
    ".sh-tour-bar{height:3px; border-radius:3px; background:var(--line,#D3DADF); margin:12px 0 0; overflow:hidden;}",
    ".sh-tour-bar i{display:block; height:100%; background:var(--ink,#15202A); border-radius:3px; transition:width .3s ease;}",
    ".sh-tour-foot{display:flex; align-items:center; gap:8px; margin-top:14px;}",
    ".sh-tour-foot .sh-tour-skip{margin-right:auto; font:inherit; font-size:13.5px; border:0; background:none; color:var(--ink-3,#6B7A86); cursor:pointer; text-decoration:underline; text-underline-offset:3px; padding:6px 2px;}",
    ".sh-tour-foot .btn{padding:9px 16px; font-size:14px; text-decoration:none;}",
    ".sh-tour-toast{position:fixed; z-index:60; width:min(280px, calc(100vw - 32px)); background:var(--ink,#15202A); color:var(--on-ink,#F4F7F8); border-radius:12px;",
    "  padding:10px 14px; font-size:14px; line-height:1.4; box-shadow:0 12px 30px -12px rgba(0,0,0,.5); opacity:0; transform:translateY(-4px); transition:opacity .25s, transform .25s;}",
    ".sh-tour-toast.is-shown{opacity:1; transform:none;}",
    ".sh-tour-toast::before{content:''; position:absolute; top:-6px; right:var(--arrow,20px); width:12px; height:12px; background:inherit; transform:rotate(45deg); border-radius:2px;}",
    "@media (max-width:640px){",
    "  .sh-tour:not(.is-center){left:8px !important; right:8px; top:auto !important; bottom:calc(8px + env(safe-area-inset-bottom, 0px)); width:auto; max-height:52vh; padding:16px 16px 14px;}",
    "  .sh-tour h3{font-size:22px;} .sh-tour-body{font-size:14px;}",
    "}",
    "@media (prefers-reduced-motion: reduce){ .sh-tour, .sh-tour-spot, .sh-tour-bar i, .sh-tour-toast{transition:none;} }"
  ].join("\n");

  function visible(el){
    if (!el || el.closest("[hidden]")) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function $(sel){ return document.querySelector(sel); }
  function timmyOn(){ return (ls("sh_pref_pet") || "on") !== "off"; }

  /* ---------- the steps (dashboard parts first, top to bottom, then what's inside a hub) ---------- */
  function steps(){
    var S = [];
    S.push({ title: "Welcome to Study Hubs",
      body: "<p>This tour shows you everything on this page and inside every hub. It takes about two minutes.</p>" +
        "<p>Use <b>Next</b> and <b>Back</b> (or the arrow keys). You can leave any time, and start it again from the <b>Tour</b> button at the top.</p>" });
    S.push({ el: ".live-pill", title: "Studying now",
      body: "<p>The green dot counts classmates who have a hub open right now, live.</p>" });
    S.push({ el: "#inboxBtn", title: "Inbox",
      body: "<p>Report a mistake or send a suggestion from any hub, and the reply lands here once it's dealt with. Notices to the whole class and the occasional short survey come here too.</p><p>A number on it means something new.</p>" });
    S.push({ el: "#setBtn", title: "Settings",
      body: "<p>Font, text size, background sounds (rain, ocean, coffee shop, lo-fi, piano), accent colors you unlock by rank, surprises on or off, Timmy Tooth, nuke alerts and your name.</p><p>Set them once here and they apply in every hub.</p>" });
    S.push({ el: "#themeBtn", title: "Light or dark",
      body: "<p>Switch between light, dark, or whatever your device uses.</p>" });
    S.push({ el: "#aboutBtn", title: "About the hubs",
      body: "<p>The full manual: every feature, all the arcade games, all 24 trophies, and, if you tick <b>Show spoilers</b>, how to find every easter egg.</p>" });
    S.push({ el: "#greeting", title: "Your name",
      body: "<p>Everyone starts with a random class name like “Gleaming Molar”. It's the name classmates see on the leaderboards.</p><p>Tap <b>Pick your name</b> to choose your own, or keep the random one to stay anonymous.</p>" });
    S.push({ el: "#meRank", title: "Your handpiece rank",
      body: "<p>You earn XP in every hub: <b>10</b> for a new question right, <b>2</b> for a repeat, <b>1</b> for trying, and <b>20</b> for each day you study.</p>" +
        "<p>XP moves you up seven handpiece ranks, from Stone to Dark Matter, each with levels I, II and III. Each rank unlocks its metal as an accent in Settings.</p>" });
    if (timmyOn()) {
      if (visible($("#petHome"))) S.push({ el: "#petHome", title: "Timmy Tooth's house",
        body: "<p>Your tooth buddy. His health comes from your answers in every hub: study and he stays healthy; skip days and he picks up plaque, then a cavity. He can't die.</p>" +
          "<p>Tap him for a joke, <b>Checkup</b> for his chart, and <b>Secret tip</b> for hints about the easter eggs. Settings turns him off.</p>" });
      else S.push({ el: ".shpet-perch", title: "Meet Timmy Tooth",
        body: "<p>The little tooth sitting on your name is Timmy, an optional tooth buddy. Tap him after the tour to meet him.</p>" +
          "<p>His health comes from how much you study, he tells jokes, and he drops hints about the easter eggs. Don't want him? Settings turns him off.</p>" });
    }
    S.push({ el: "#hero", title: "Your next exam",
      body: "<p>A countdown to the next exam, with <b>Start studying</b> and <b>Daily drill</b> buttons. Other exams in the next two weeks are listed underneath.</p>" +
        "<p>Beside it: your progress in that hub and your last two weeks of study days, with your streak and accuracy. The day before an exam, you can send classmates luck here.</p>" });
    S.push({ el: "#hubs", title: "The hubs",
      body: "<p>One card per exam, grouped by class: what it covers, its modes, your progress, and a Daily drill row. <b>Open</b> takes you in.</p>" +
        "<p>After the exam, a <b>Check in</b> button asks how it went; your answers shape the next hubs. A hub archives itself the night of its last exam.</p>" });
    S.push({ el: function(){ var h = $("#pulseHead"); return h && h.closest("section"); }, title: "The class",
      body: "<p>Live boards for everyone using the hubs: handpiece ranks, study streaks, right answers in a row, the busiest study hours, and arcade high scores.</p>" +
        "<p>Medals next to a name show which hubs that person has mastered.</p>" });
    S.push({ el: "#recaps", title: "Hub recaps",
      body: "<p>After an exam, a recap of how the class used that hub: hours studied, accuracy, the hardest question and more. <b>Save image</b> keeps one.</p>" });
    S.push({ el: "#changelog", title: "What's new",
      body: "<p>Every update to the hubs, newest first. Updates go live at this same link, so bookmark this page rather than a single hub.</p>" });

    var IN = "Inside every hub";
    S.push({ eyebrow: IN, title: "Three modes",
      body: "<p>Every hub has three modes in its top bar:</p><ul>" +
        "<li><b>Compendium</b>: Course Home, Lecture Notes, Question Bank, Mock Exam, Weak Spots, Active Recall flashcards, Cram Sheet and Exam Hints (the professors' own words).</li>" +
        "<li><b>Review</b>: every reference table in one searchable place, with a <b>hide answers</b> switch to quiz yourself.</li>" +
        "<li><b>Arcade</b>: nine games built on the material, each with a class high-score board.</li></ul><p>Tabs vary a little from hub to hub.</p>" });
    S.push({ eyebrow: IN, title: "Lecture Notes",
      body: "<ul><li><b>As taught / Plain English</b>: the professor's wording, or a plain rewrite.</li>" +
        "<li><b>Listen</b>: recorded narration of every lecture at both levels, with speed control. It remembers where you stopped, and a small player follows you as you scroll.</li>" +
        "<li><b>Highlighter</b>: select any text, tap Highlight, pick a color. Highlights stay on that device.</li>" +
        "<li><b>Mind maps</b> and drawn <b>diagrams</b>, some you can play with.</li>" +
        "<li><b>Timmy Time</b>: in some hubs, a podcast review episode for the night before the exam.</li></ul>" });
    S.push({ eyebrow: IN, title: "Practice that adapts to you",
      body: "<ul><li><b>Daily drill</b>: 10, 20 or 30 questions a day, picked from what's due, what you missed and what the class finds hard.</li>" +
        "<li><b>Spaced review</b>: questions you get right come back after 1, 2, 4 and 7 days; misses come back sooner.</li>" +
        "<li><b>Weak Spots</b>: your misses and what's due, in one place.</li>" +
        "<li><b>Mock Exam</b>: timed and exam-length, with a results card that shows your score by lecture.</li></ul>" +
        "<p>After every answer you see what percent of the class got it right, and why each choice is right or wrong.</p>" });
    S.push({ eyebrow: IN, title: "The launcher",
      body: "<p>On a computer it's the button in the bottom-right corner of a hub; on a phone it's the bottom bar (Search, Drill, Stats, More).</p><ul>" +
        "<li><b>Search</b> finds any word in the notes, review tables, hints and questions, and jumps right to it.</li>" +
        "<li><b>Stats</b>: your mastery, the trophy case, and <b>Link my devices</b>, so your phone and laptop count as one you.</li>" +
        "<li><b>Report</b> a mistake on any question, or <b>Suggest</b> an idea. Replies come to your Inbox.</li></ul>" });
    S.push({ eyebrow: IN, title: "Trophies and surprises",
      body: "<p>There are 24 trophies to earn, plus 9 in every hub, and many of them are secret. The hubs also hide easter eggs, a daily Golden Probe question, and bosses the whole class fights together when five or more of you are online.</p>" +
        "<p>Timmy's <b>Secret tip</b> gives hints. Rather study in peace? <b>Settings → Surprises</b> turns them off.</p>" +
        "<p>Tip: use <b>Add to Home Screen</b> on your phone to open the hubs like an app.</p>" });
    S.push({ el: "#tourBtn", title: "That's the tour", last: true,
      body: "<p>Start it again any time from this <b>Tour</b> button. For every detail, open <b>About</b>.</p><p>Happy studying!</p>" });
    return S.filter(function(s){
      if (!s.el) return true;
      var el = typeof s.el === "function" ? s.el() : $(s.el);
      if (!visible(el)) return false;
      s.node = el; return true;
    });
  }

  /* ---------- whenIdle: other pop-ups wait for the question and the tour ---------- */
  var busy = false, waiting = [];
  function idle(wait){ busy = false; var w = waiting; waiting = []; w.forEach(function(fn){ setTimeout(fn, wait || 600); }); }
  function whenIdle(fn){ if (busy) waiting.push(fn); else fn(); }

  function ensureCss(){
    if (document.getElementById("sh-tour-css")) return;
    var st = document.createElement("style"); st.id = "sh-tour-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ---------- the tour ---------- */
  var T = null;
  function start(){
    if (T) return;
    ensureCss(); busy = true;
    document.documentElement.classList.add("sh-touring");
    var list = steps(), back = document.activeElement;
    var block = document.createElement("div"); block.className = "sh-tour-block";
    var spot = document.createElement("div"); spot.className = "sh-tour-spot"; spot.hidden = true;
    var card = document.createElement("section"); card.className = "sh-tour";
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "shTourH");
    document.body.appendChild(block); document.body.appendChild(spot); document.body.appendChild(card);
    T = { list: list, i: 0, block: block, spot: spot, card: card, back: back, raf: 0 };
    track("start");

    function onMove(){ if (T && !T.raf) T.raf = requestAnimationFrame(function(){ if (T) { T.raf = 0; place(); } }); }
    T.onMove = onMove;
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    card.addEventListener("click", function(e){
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.getAttribute("data-act");
      if (a === "next") go(T.i + 1);
      else if (a === "back") go(T.i - 1);
      else if (a === "about") { finish("done"); }
      else finish(T.i === T.list.length - 1 ? "done" : "skipped");
    });
    card.addEventListener("keydown", trapTab);
    document.addEventListener("keydown", onKey, true);
    go(0);
  }
  function onKey(e){
    if (!T) return;
    if (e.key === "Escape") { e.preventDefault(); finish(T.i === T.list.length - 1 ? "done" : "skipped"); }
    else if (e.key === "ArrowRight" && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); e.stopPropagation(); go(T.i + 1); }
    else if (e.key === "ArrowLeft" && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); e.stopPropagation(); go(T.i - 1); }
  }
  function trapTab(e){
    if (e.key !== "Tab") return;
    var f = [].slice.call(e.currentTarget.querySelectorAll("button, a[href]"));
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function go(i){
    if (!T) return;
    if (i >= T.list.length) { finish("done"); return; }
    if (i < 0) return;
    T.i = i;
    var s = T.list[i], n = T.list.length, last = i === n - 1;
    T.card.innerHTML = '<button type="button" class="sh-tour-x" data-act="close" aria-label="End the tour">×</button>' +
      '<div class="sh-tour-eyebrow">' + (s.eyebrow ? s.eyebrow + " · " : "Tour · ") + (i + 1) + " of " + n + '</div>' +
      '<h3 id="shTourH">' + s.title + '</h3><div class="sh-tour-body" aria-live="polite">' + s.body + '</div>' +
      '<div class="sh-tour-bar" aria-hidden="true"><i style="width:' + Math.round((i + 1) / n * 100) + '%"></i></div>' +
      '<div class="sh-tour-foot">' + (last ? '<span class="sh-tour-skip" aria-hidden="true" style="visibility:hidden">.</span>' : '<button type="button" class="sh-tour-skip" data-act="close">End tour</button>') +
      (i ? '<button type="button" class="btn btn-quiet" data-act="back">Back</button>' : '') +
      (last ? '<a class="btn btn-quiet" href="about/" data-act="about">Open About</a><button type="button" class="btn btn-primary" data-act="next">Done</button>'
            : '<button type="button" class="btn btn-primary" data-act="next">' + (i ? "Next" : "Let's go") + '</button>') + '</div>';
    T.card.scrollTop = 0;
    if (s.node) {
      var r = s.node.getBoundingClientRect();
      var y = Math.max(0, r.top + window.pageYOffset - (window.innerWidth <= 640 ? 64 : 96));
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    }
    place();
    var nx = T.card.querySelector('[data-act="next"]');
    try { nx.focus({ preventScroll: true }); } catch (e) { nx.focus(); }
  }
  function place(){
    var s = T.list[T.i], card = T.card, spot = T.spot;
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!s.node) {
      spot.hidden = true; T.block.classList.add("is-dim");
      card.classList.add("is-center"); card.style.left = card.style.top = "";
      return;
    }
    T.block.classList.remove("is-dim"); card.classList.remove("is-center");
    var r = s.node.getBoundingClientRect(), pad = 8;
    var top = Math.max(r.top - pad, 6), bottom = Math.min(r.bottom + pad, vh - 6);
    var left = Math.max(r.left - pad, 6), right = Math.min(r.right + pad, vw - 6);
    spot.hidden = false;
    spot.style.left = left + "px"; spot.style.top = top + "px";
    spot.style.width = Math.max(0, right - left) + "px"; spot.style.height = Math.max(0, bottom - top) + "px";
    if (vw <= 640) return;                      /* phones: the card sits at the bottom (CSS) */
    var cw = card.offsetWidth, ch = card.offsetHeight, gap = 14, y, x = Math.min(Math.max(16, r.left), vw - cw - 16);
    if (vh - bottom >= ch + gap + 16) y = bottom + gap;
    else if (top >= ch + gap + 16) y = top - gap - ch;
    else { y = vh - ch - 16; x = vw - cw - 16; }     /* no room either side: bottom-right corner, over the part */
    card.style.left = x + "px"; card.style.top = Math.max(16, y) + "px";
  }
  function finish(how){
    if (!T) return;
    var t = T; T = null;
    track(how === "done" ? "done" : "quit@" + (t.i + 1));
    if (how === "done" || !ls(KEY)) ls(KEY, how);
    window.removeEventListener("scroll", t.onMove); window.removeEventListener("resize", t.onMove);
    document.removeEventListener("keydown", onKey, true);
    if (t.raf) cancelAnimationFrame(t.raf);
    t.block.remove(); t.spot.remove(); t.card.remove();
    document.documentElement.classList.remove("sh-touring");
    var tb = document.getElementById("tourBtn");
    try { (tb || t.back).focus({ preventScroll: true }); } catch (e) {}
    idle();
  }

  /* ---------- the first-visit question ---------- */
  function maybePrompt(){
    if (ls(KEY) || T || document.querySelector(".sh-tour")) return;
    if (ls(KEY) === null && !testStorage()) return;      /* no storage: it would ask on every visit */
    ensureCss(); busy = true;
    var returning = !!(ls("sh_visitor_id") || ls("sh_rank_tier"));
    var block = document.createElement("div"); block.className = "sh-tour-block is-dim";
    var card = document.createElement("section"); card.className = "sh-tour is-center";
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "shTourAskH");
    card.innerHTML = '<div class="sh-tour-eyebrow">' + (returning ? "New: a quick tour" : "Welcome") + '</div>' +
      '<h3 id="shTourAskH">Want a quick tour?</h3><div class="sh-tour-body">' +
      (returning ? "<p>There's more in the hubs than most people find: daily drills, narration, a highlighter, spaced review, linked devices, trophies and more.</p>"
                 : "<p>The hubs pack in a lot: notes you can listen to, question banks, mock exams, daily drills, games and class leaderboards.</p>") +
      "<p>A two-minute tour shows you where everything is. You can always take it later from the <b>Tour</b> button at the top.</p></div>" +
      '<div class="sh-tour-foot"><span style="margin-right:auto"></span><button type="button" class="btn btn-quiet" data-act="no">No thanks</button>' +
      '<button type="button" class="btn btn-primary" data-act="yes">Show me around</button></div>';
    document.body.appendChild(block); document.body.appendChild(card);
    track("prompt");
    function close(yes){
      block.remove(); card.remove(); document.removeEventListener("keydown", esc, true);
      if (yes) { busy = false; start(); return; }
      ls(KEY, "no"); track("decline"); pointAtButton(); idle(5000);   /* after the note under the Tour button fades */
    }
    function esc(e){ if (e.key === "Escape") { e.preventDefault(); close(false); } }
    document.addEventListener("keydown", esc, true);
    card.addEventListener("keydown", trapTab);
    card.addEventListener("click", function(e){ var b = e.target.closest("[data-act]"); if (b) close(b.getAttribute("data-act") === "yes"); });
    setTimeout(function(){ var y = card.querySelector('[data-act="yes"]'); try { y.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }
  function testStorage(){ try { localStorage.setItem("sh_tour_t", "1"); localStorage.removeItem("sh_tour_t"); return true; } catch (e) { return false; } }
  /* after "No thanks": a small note under the Tour button so they know where it lives */
  function pointAtButton(){
    var b = document.getElementById("tourBtn"); if (!visible(b)) return;
    var r = b.getBoundingClientRect(), t = document.createElement("div");
    t.className = "sh-tour-toast"; t.setAttribute("role", "status");
    t.textContent = "No problem. The tour is right here whenever you want it.";
    document.body.appendChild(t);
    var w = t.offsetWidth, x = Math.min(Math.max(16, r.left + r.width / 2 - w + 26), window.innerWidth - w - 16);
    t.style.left = x + "px"; t.style.top = (r.bottom + window.pageYOffset + 10) + "px"; t.style.position = "absolute";
    t.style.setProperty("--arrow", Math.max(10, Math.min(w - 22, r.left + r.width / 2 - x - 6)) + "px");
    requestAnimationFrame(function(){ t.classList.add("is-shown"); });
    setTimeout(function(){ t.classList.remove("is-shown"); setTimeout(function(){ t.remove(); }, 300); }, 4500);
  }

  window.shTour = { start: start, maybePrompt: maybePrompt, whenIdle: whenIdle };
})();
