/* study-hubs click analytics: counts clicks on buttons, tabs and links, and sends the counts
   once a minute (and when the tab is hidden) to record_clicks. Anonymous: it sends the visitor id
   the rest of the widget already uses, the section (e.g. "compendium/notes") and a short target
   name, never what anyone typed. Used by widget/v3.js (hubs) and the dashboard:
     shClicks.start({ sb: supabaseClient, hub: "perio", visitor: "...", section: function(){ return "..."; } })
   It also counts feature events that a click can't show (migration_v37): window.shTrack(kind, n) adds n (default 1)
   to a per-page counter for that kind, sent with the clicks to record_events. Kinds are short lowercase names
   ("egg:timmy-start", "pet:no-thanks", "pod:<id>:q2", "tts:secs"). Some are counted here for every page: "view" per
   page load, "pref:<setting>=<value>" when a setting changes, "egg:<name>" when an easter egg announces itself,
   "fig:<figure>" for a diagram's controls and parts, "fig-seen:<figure>" once a diagram has been on screen, and a
   once-a-day "state:<setting>=<value>" snapshot of the visitor's settings. */
(function(){
  "use strict";
  if (window.shClicks) return;
  /* attributes that identify one question/choice rather than a feature; their values would
     explode the list, so they're skipped when naming a target */
  var SKIP = /^data-(qid|q|idx|i|pick|choice|choice-idx|answer|opt|n|key|k|id|flag|sh-flag|seq|match|pair|step|card|lec-q)$/;
  function clean(t){ return String(t || "").replace(/\s+/g, " ").trim().slice(0, 48); }
  function nameOf(el){
    var root = el.closest("#shstat-root, .sh-egg, #shstat-panel, #shstat-searchpanel, #shstat-settingspanel, #shstat-flagpanel, #shstat-suggestpanel");
    var prefix = root ? "widget:" : "";
    if (el.id && !/\d{3,}/.test(el.id)) return prefix + "#" + el.id;
    for (var i = 0; i < el.attributes.length; i++){
      var a = el.attributes[i];
      if (a.name.indexOf("data-") !== 0 || SKIP.test(a.name) || !a.value || a.value.length > 40) continue;
      /* keep names (modes, lecture ids); collapse numbers and question-like ids */
      var v = /^\d+$/.test(a.value) || /^[a-z]{0,3}\d+[-_]/i.test(a.value) ? "#" : a.value;
      return prefix + a.name.slice(5) + "=" + v;
    }
    var cls = (el.className && typeof el.className === "string") ? el.className.split(/\s+/)[0] : "";
    if (cls && /choice|opt|ans|cell|tile|hole|card/.test(cls)) return prefix + "." + cls;
    var label = clean(el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent);
    if (!label) return "";
    return prefix + label.replace(/\d+/g, "#");
  }
  /* feature events: counted from page load, sent once start() has a client */
  var evPending = {}, evCount = 0, evSend = null;
  function kindOf(k){ return String(k || "").toLowerCase().replace(/[^a-z0-9:=_.+-]+/g, "-").replace(/^[^a-z0-9]+/, "").slice(0, 64); }
  window.shTrack = function(kind, n){
    var k = kindOf(kind); if (!k) return;
    var v = +n; if (!isFinite(v) || v <= 0) v = 1;
    if (!(k in evPending)) evCount++;
    evPending[k] = (evPending[k] || 0) + v;
    if (evSend && evCount >= 30) evSend();
  };
  function track(k, n){ window.shTrack(k, n); }
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function slug(t){ return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }
  function figKey(el){
    var a = el.closest("[data-anima]");
    if (a) return a.getAttribute("data-anima");
    var f = el.closest("figure"), h = f && f.querySelector("h4, figcaption, [data-corner=title]");
    return h ? slug(h.textContent) : "";
  }
  /* settings people actually have, once a day per page (e.g. how many studying today have Timmy Tooth off) */
  function snapshot(hub){
    var day = new Date().toISOString().slice(0, 10), key = "sh_state_sent_" + hub;
    if (ls(key) === day) return;
    try { localStorage.setItem(key, day); } catch (e) {}
    var S = { theme: ls("sh_theme") || "auto", pet: ls("sh_pref_pet") || "on", eggs: ls("sh_pref_eggs") || "on", music: ls("sh_pref_music") || "off",
      font: ls("sh_pref_font") || "default", size: ls("sh_pref_size") || "default", accent: ls("sh_pref_accent") || "default",
      nuke: ls("sh_pref_nuke_alerts") || "on", "pet-adopted": ls("sh_pet_born") ? "yes" : "no", "own-name": ls("sh_display_name") ? "yes" : "no" };
    Object.keys(S).forEach(function(k){ track("state:" + k + "=" + slug(S[k])); });
  }
  function watchFigures(){
    if (typeof IntersectionObserver === "undefined" || typeof MutationObserver === "undefined") return;
    var seen = {}, io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var k = figKey(e.target);
        if (k && !seen[k]) { seen[k] = 1; track("fig-seen:" + k); }
      });
    }, { threshold: 0.5 });
    var t = null;
    function scan(){ t = null; document.querySelectorAll("[data-anima], figure.fig-card").forEach(function(f){ if (!f.__shSeen) { f.__shSeen = 1; io.observe(f); } }); }
    new MutationObserver(function(){ if (!t) t = setTimeout(scan, 900); }).observe(document.body, { childList: true, subtree: true });
    scan();
  }

  window.shClicks = {
    start: function(o){
      if (!o || !o.sb || !o.hub) return;
      try { if (navigator.webdriver) return; } catch (e) {} /* automated browsers are not counted */
      var pending = {}, count = 0;
      evSend = function(){
        var items = Object.keys(evPending).map(function(k){ return { k: k, n: Math.round(evPending[k]) }; }).filter(function(x){ return x.n > 0; }).slice(0, 40);
        evPending = {}; evCount = 0;
        if (items.length && o.visitor) try { o.sb.rpc("record_events", { p_hub: o.hub, p_visitor: o.visitor, p_items: items }).then(function(){}, function(){}); } catch (e) {}
      };
      function flush(){
        if (evCount) evSend();
        if (!count) return;
        var items = Object.keys(pending).slice(0, 80).map(function(k){ var p = k.split("\u0001"); return { s: p[0], t: p[1], n: pending[k] }; });
        pending = {}; count = 0;
        try { o.sb.rpc("record_clicks", { p_hub: o.hub, p_visitor: o.visitor || null, p_items: items }).then(function(){}, function(){}); } catch (e) {}
      }
      document.addEventListener("click", function(e){
        var el = e.target && e.target.closest && e.target.closest('button, a[href], [role="tab"], [role="button"], summary, label, [data-mode], [data-view]');
        if (!el) return;
        var t = nameOf(el);
        if (!t) return;
        var s = ""; try { s = String((o.section && o.section()) || "").slice(0, 80); } catch (err) {}
        var k = s + "\u0001" + t;
        pending[k] = (pending[k] || 0) + 1; count++;
        if (count >= 60) flush();
      }, true);
      /* a diagram's sliders and pickers (input) and tappable parts ([data-info]); per figure, per person, per day */
      document.addEventListener("change", function(e){
        var el = e.target; if (!el || !el.closest) return;
        var k = el.closest("[data-anima], figure") ? figKey(el) : "";
        if (k) track("fig:" + k);
      }, true);
      document.addEventListener("click", function(e){
        var el = e.target && e.target.closest && e.target.closest("[data-anima] [data-info], [data-anima] [data-part]");
        if (el) track("fig-part:" + figKey(el));
      }, true);
      /* only real settings: never the display name (sh_display_name also goes through prefSet), and not the volume slider */
      document.addEventListener("sh:pref", function(e){
        var d = e.detail || {}, k = String(d.key || "");
        if (!/^sh_pref_[a-z_]+$/.test(k) && k !== "sh_theme" || k === "sh_pref_volume") return;
        track("pref:" + k.replace(/^sh_pref_/, "").replace(/^sh_/, "") + "=" + slug(d.val));
      });
      document.addEventListener("sh:egg-local", function(e){ var d = e.detail || {}; if (d.t) track("egg:" + d.t); });
      track("view");
      snapshot(o.hub);
      try { watchFigures(); } catch (e) {}
      setInterval(flush, 60000);
      document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") flush(); });
      window.addEventListener("pagehide", flush);
    }
  };
})();
