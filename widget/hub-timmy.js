/* ============ THE HUB ENGINE, part: Timmy (widget/hub-timmy.js) ============
   One of the engine's four files (widget/hub.js is the core and says how they fit together). This one holds what the
   engine asks of Timmy Tooth (widget/pet.js, window.shPet): a line for him to say, his HP, his cheer or flinch on the
   bar at each answer, and loading him when he was adopted on another device; and Timmy's place, the page in More
   (widget/place.js draws it, fetched the first time that page is opened). Timmy Time, the podcast's page, is in the
   core (More).
   And Ask Timmy (vault/tasks/2026-11-12-redesign-ask-timmy.md, part 2): the chat is widget/ask.js (window.shAsk), loaded
   with the shared widget; this part mounts it with what it needs from the engine (where the student is in the notes, the
   links, the saved state for "What should I study tonight?", whether the hub is archived) and opens it from a question
   card's "Ask Timmy" (widget/hub-bank.js puts the button there once the question is answered).

   The names it takes from the core are listed first; what the other files call from here is put on HX at the end.
   ============ */
(window.SH_HUB_PARTS = window.SH_HUB_PARTS || {}).timmy = function(HX){
  "use strict";
  /* from the core (widget/hub.js), under the names they have there */
  var reduced = HX.reduced, $ = HX.$, C = HX.C, HUB = HX.HUB, WIDGET = HX.WIDGET, STATE = HX.STATE, ls = HX.ls, docEl = HX.docEl,
    loadScript = HX.loadScript, whenWidget = HX.whenWidget;

  /* ---------- Timmy (widget/pet.js, window.shPet): what the engine asks of him. He is on the bar once adopted ---------- */
  function say(t, move){ try { if (window.shPet && window.shPet.say) window.shPet.say(t, move, 5000); } catch (e) {} }
  function petHp(){ try { return window.shPet && window.shPet.hp ? window.shPet.hp() : null; } catch (e) { return null; } }
  /* he cheers a right answer and flinches at a miss */
  var reactT = 0;
  function timmyReact(right){
    var tim = $(".shpet-home .shpet-btn");
    if (tim && !reduced) { clearTimeout(reactT); tim.classList.remove("hx-cheer", "hx-flinch"); void tim.offsetWidth; tim.classList.add(right ? "hx-cheer" : "hx-flinch"); reactT = setTimeout(function(){ tim.classList.remove("hx-cheer", "hx-flinch"); }, 1500); }
  }
  /* Timmy loads only once he's adopted (widget/v3.js): adopted on another device shows up in the rank profile as a badge */
  function petFromBadges(b){
    if (!window.shPet && window.shLoadPet && b.some(function(x){ return String(x).split(":")[0] === "pet-adopt"; }))
      window.shLoadPet(function(){ if (window.shPet && window.shPet.syncBadges) window.shPet.syncBadges(b); });
  }

  /* ---------- Timmy's place (redesign phase 4, part C): its page in More. The card, and the full view from it, are
     widget/place.js (window.shPlace), with the kit of drawings it fetches; none of it loads with the page. What Timmy
     owns and where it stands come in the page's bootstrap once the database has the game layer (migration_v54);
     without it the place shows the defaults with your rank and medals. He has a place once he's adopted. ---------- */
  function hasTimmy(){ return !!ls("sh_pet_born"); }
  function morePlace(body){
    var shut = function(){ if (body.isConnected) body.innerHTML = '<p class="note">Timmy’s place couldn’t be opened just now. Try again in a moment.</p>'; };
    if (!hasTimmy()) { body.innerHTML = '<p class="note">Timmy hasn’t moved in yet. Adopt him on the dashboard and his place opens here.</p>'; return; }
    loadScript(WIDGET + "place.js").then(function(){
      whenWidget("shSupabase", function(sb){
        var go = function(){
          var P = window.shPlace, boot = window.shBootstrap;
          if (!body.isConnected || HX.view !== "more") return;
          if (!P) { shut(); return; }
          var draw = function(d){
            if (!body.isConnected) return;
            P.setup({ sb: sb, visitor: ls("sh_visitor_id"), shop: d && d.shop, profile: HX.RANK.p });
            body.innerHTML = '<div class="place-card"></div><p class="note">Tap the picture to step in. Timmy hops over to what you tap, and his health shows in how he moves.</p>';
            P.card(body.firstChild, { onFail: shut });
          };
          if (boot && boot.ready && boot.ready.then) boot.ready.then(draw, function(){ draw(null); }); else draw(boot && boot.data);
        };
        /* his drawing is widget/pet.js's: it is on the page once he's adopted, a moment after the widget */
        if (window.shPet) go(); else { if (window.shLoadPet) window.shLoadPet(); whenWidget("shPet", function(){ go(); }); }
      });
    }, shut);
  }

  /* ---------- Ask Timmy (widget/ask.js, window.shAsk) ---------- */
  var askLoad = null, askMounted = false;
  function askReady(){
    if (!askLoad) askLoad = HX.loadScript(WIDGET + "ask.js").then(function(){ askMount(); return window.shAsk || null; });
    return askLoad;
  }
  function askMount(){
    if (askMounted || !window.shAsk) return; askMounted = true;
    window.shAsk.mount({ where: "hub", hub: HUB, name: C.name || HUB, exam: C.exam || null, about: C.about || "../../../about/",
      answeredEvent: HX.EVT, section: function(){ return HX.section(); }, place: askPlace,
      lecName: function(lec){ var l = HX.LBY[lec]; return l ? HX.lecLabel(l) + " " + HX.shortTitle(l) : ""; },
      core: function(){ return HX.CORE; }, state: function(){ return STATE; },
      go: askGo, archived: askArchived, sb: function(){ return window.shSupabase || null; } });
  }
  /* the chat comes with the shared widget (the core's startWidget), not with the first screen */
  function askStart(){ askReady().catch(function(){}); }
  /* where the student is in the notes: the lecture, and (in the notes as taught) the paragraph at the top of the screen,
     counted the way exportSections and SH_GOTO count them, so it is the same address the server's quotes use */
  function askPlace(){
    if (HX.view !== "notes") return null;
    var lec = HX.LBY[HX.sub] ? HX.sub : STATE.ui.lec; if (!HX.LBY[lec]) return null;
    var out = { lec: lec };
    if ((STATE.ui.level || "full") !== "full") return out;
    var prose = $(".reading-prose"); if (!prose || !prose.closest("#lec-" + lec)) return out;
    var top = Math.max(0, ($("#hxBar") || {}).offsetHeight || 0, ($("#hxStrip") || {}).offsetHeight || 0) + 8;
    var els = Array.prototype.filter.call(prose.querySelectorAll("p, li, h3, h4"), function(e){ return !e.closest("[data-sh-noread]"); });
    for (var i = 0; i < els.length; i++) { if (els[i].getBoundingClientRect().bottom > top) { out.k = i; break; } }
    return out;
  }
  /* a link from the chat: the engine's own router (SH_GOTO) for the notes, review tables, cram and hints; here for the rest */
  function askGo(g){
    if (!g) return;
    if (g.v === "practice" && HX.LBY[g.lec]) { HX.bankReset(); STATE.ui.qlec = HX.lecValue([g.lec]); HX.bankSearch = ""; HX.saveState(); HX.go("questions"); return; }
    if (g.v === "drill") { HX.go("questions/drill"); return; }
    if (g.v === "home") { HX.go("home"); return; }
    if (g.v === "notes" && !HX.LBY[g.lec]) { HX.go("notes"); return; }
    if (g.v === "notes" && g.k == null) { HX.go("notes/" + g.lec); return; }
    if (window.SH_GOTO) window.SH_GOTO(g);
  }
  /* Timmy isn't on an archived hub: the admin page's override while it's in force (the copy the widget keeps), else the
     dates (10 pm on the last exam's day, as widget/v3.js's notice decides it) */
  function askArchived(){
    try { if (sessionStorage.getItem("sh_archived_seen_" + HUB)) return true; } catch (e) {}
    try {
      var c = JSON.parse(ls("sh_hub_overrides") || "null"), o = null;
      if (c && Array.isArray(c.rows)) c.rows.forEach(function(r){ if (r && r.hub === HUB && ["live", "archived", "hidden"].indexOf(r.state) > -1 && !(r.until && new Date() >= new Date(r.until))) o = r; });
      if (o) return o.state !== "live";
    } catch (e) {}
    var last = null;
    ((HX.CORE && HX.CORE.exams) || []).forEach(function(x){
      var p = String((x && x.date) || "").split("-").map(Number); if (p.length !== 3 || !p[0]) return;
      var d = new Date(p[0], p[1] - 1, p[2], x.archiveHour != null ? x.archiveHour : 22); if (!last || d > last) last = d;
    });
    return !!(last && new Date() >= last);
  }
  function askOn(){ return !askArchived(); }
  /* the card's button says who answers: Timmy when he's on this page, the hub when he isn't */
  function askLabel(){ return docEl.classList.contains("sh-pet-on") ? "Ask Timmy" : "Ask the hub"; }
  /* "Ask Timmy" on an answered question: the chat opens with the question attached and "Why is it ...?" in the box */
  function askAbout(q, right, picks){
    var short = function(t){ t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > 90 ? t.slice(0, 88) + "…" : t; };
    var text = q.type === "mcq" && q.choices && q.choices[q.answer] != null ? "Why is it “" + short(q.choices[q.answer]) + "”?"
      : q.type === "multi" ? "Why are those the right ones?" : q.type === "sequence" ? "Why does it go in that order?"
      : q.type === "match" ? "Can you explain these matches?" : "Can you explain this one?";
    var ask = { qid: q.id, right: q.type === "recall" ? null : !!right, picks: q.type === "mcq" || q.type === "multi" ? (picks || []).slice() : [],
      label: String(q.stem || "").replace(/\s+/g, " ").trim() };
    askReady().then(function(A){ if (A) A.open({ from: "card", text: text, ask: ask }); else HX.toast("The chat didn't load. Try again in a moment."); },
      function(){ HX.toast("The chat didn't load. Check your connection and try again."); });
  }

  /* what the other files call from here */
  HX.say = say; HX.petHp = petHp; HX.timmyReact = timmyReact; HX.petFromBadges = petFromBadges; HX.hasTimmy = hasTimmy; HX.morePlace = morePlace;
  HX.askStart = askStart; HX.askOn = askOn; HX.askLabel = askLabel; HX.askAbout = askAbout;
};
