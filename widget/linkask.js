/* study-hubs "Is this your other device?" When the name someone saves is already used by another device that isn't
   linked to theirs (name_shared, migration_v41), they keep the name, and a card asks whether that other device is
   theirs and offers to link the two right there (create_link_code / redeem_link_code, the same as Stats → Link my
   devices). A device whose saved name is shared is also asked once a day on page load, so people who set the same name
   on two devices before this existed get asked too.
   "No, that's someone else" is remembered per name (sh_link_ask_no); "Not now" waits 3 days for the load check
   (sh_link_ask_later; saving the name again still asks). Never in automated browsers, during a mock or the tour.
   Used by widget/v3.js (hubs) and the dashboard:
     shLinkAsk.start({ sb: supabaseClient, hub: "perio" | "dashboard", section: fn })   // the once-a-day check
     shLinkAsk.check(name)                                                              // right after a name is saved */
(function(){
  "use strict";
  if (window.shLinkAsk) return;
  var NO_KEY = "sh_link_ask_no", LATER_KEY = "sh_link_ask_later", DAY_KEY = "sh_link_ask_day";
  var C = { sb: null, hub: "", section: function(){ return ""; } }, card = null;

  function ls(k, v){
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function track(k){ try { if (window.shTrack) window.shTrack("link-ask:" + k); } catch (e) {} }
  function today(){ var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function visitor(){ return ls("sh_visitor_id") || ""; }
  function norm(n){ return String(n || "").trim().toLowerCase(); }
  function noList(){ try { return JSON.parse(ls(NO_KEY) || "[]") || []; } catch (e) { return []; } }
  function rpc(fn, args){
    if (!C.sb) return Promise.resolve(null);
    try { return C.sb.rpc(fn, args).then(function(r){ return r && !r.error ? r.data : null; }, function(){ return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  function blocked(){
    return !!(window.shAutomated || navigator.webdriver) || /mock/.test(String(C.section() || "")) ||
      document.documentElement.classList.contains("sh-touring");
  }

  var CSS =
    ".sh-la{position:fixed;inset:0;z-index:10003;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,14,18,.45);" +
    "font-family:var(--font-body,var(--sans,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif));font-size:14.5px;line-height:1.45;" +
    "--la-bg:var(--surface,#fff);--la-ink:var(--ink,#15202A);--la-ink2:var(--ink-soft,var(--ink-2,#4A5864));--la-line:var(--line,rgba(0,0,0,.12));" +
    "--la-bg2:var(--surface-2,rgba(127,127,127,.08));--la-accent:var(--accent,var(--focus,#2F6FD6));color:var(--la-ink);animation:shLaFade .2s ease-out;}" +
    "@keyframes shLaFade{from{opacity:0;}to{opacity:1;}}" +
    ".sh-la *{box-sizing:border-box;}" +
    ".sh-la-card{position:relative;width:min(440px,100%);max-height:100%;overflow:auto;padding:20px 20px 16px;border-radius:18px;background:var(--la-bg);" +
    "border:1px solid var(--la-line);box-shadow:0 18px 50px -12px rgba(0,0,0,.45);}" +
    ".sh-la-card h3{margin:0 30px 8px 0;font-size:18px;font-weight:700;font-family:inherit;color:var(--la-ink);}" +
    ".sh-la-card p{margin:0 0 12px;}" +
    ".sh-la-x{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:transparent;color:var(--la-ink2);font-size:22px;line-height:1;cursor:pointer;}" +
    ".sh-la-x:hover{background:var(--la-bg2);}" +
    ".sh-la-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;}" +
    ".sh-la-btn{border:1px solid var(--la-line);border-radius:999px;padding:9px 16px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;background:transparent;color:var(--la-ink);}" +
    ".sh-la-btn.is-main{border-color:transparent;background:var(--la-ink);color:var(--la-bg);}" +
    ".sh-la-later{display:block;margin:10px 0 0;border:0;background:none;padding:0;font:inherit;font-size:13px;color:var(--la-ink2);text-decoration:underline;cursor:pointer;}" +
    ".sh-la-step{border-top:1px solid var(--la-line);padding:12px 0 4px;}" +
    ".sh-la-step b{display:block;margin-bottom:6px;}" +
    ".sh-la-step small{display:block;color:var(--la-ink2);font-size:13px;margin-top:6px;}" +
    ".sh-la-code{margin-top:8px;}" +
    ".sh-la-big{display:block;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:26px;font-weight:700;letter-spacing:.12em;}" +
    ".sh-la-enter{display:flex;gap:8px;}" +
    ".sh-la-enter input{flex:1;min-width:0;padding:9px 12px;border:1px solid var(--la-line);border-radius:10px;font:inherit;font-size:16px;" +
    "text-transform:uppercase;letter-spacing:.08em;background:var(--la-bg);color:var(--la-ink);}" +
    ".sh-la-msg{min-height:1.4em;margin-top:6px;font-size:13.5px;color:var(--la-ink2);}";
  function css(){
    if (document.getElementById("sh-la-css")) return;
    var st = document.createElement("style"); st.id = "sh-la-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  function close(){ if (card) { card.remove(); card = null; } }
  function open(name){
    if (card) return;
    css(); track("shown");
    card = document.createElement("div");
    card.className = "sh-la";
    card.innerHTML = '<div class="sh-la-card" role="dialog" aria-modal="true" aria-labelledby="sh-la-h">' +
      '<button class="sh-la-x" type="button" aria-label="Close">&times;</button>' +
      '<h3 id="sh-la-h">Is this your other device?</h3>' +
      '<div class="sh-la-body">' +
      '<p>Another device here already goes by <b>' + esc(name) + '</b>. If that one is yours too (your phone, tablet or laptop), link them so they share one rank, streak, trophy case and question progress.</p>' +
      '<div class="sh-la-row"><button type="button" class="sh-la-btn is-main" data-la="yes">Yes, link them</button>' +
      '<button type="button" class="sh-la-btn" data-la="no">No, that’s someone else</button></div>' +
      '<button type="button" class="sh-la-later" data-la="later">Not now</button></div></div>';
    document.body.appendChild(card);
    var body = card.querySelector(".sh-la-body");
    card.addEventListener("keydown", function(e){ if (e.key === "Escape") { ls(LATER_KEY, String(Date.now())); close(); } });
    card.addEventListener("click", function(e){
      var b = e.target.closest("[data-la]"), a = b && b.getAttribute("data-la");
      if (e.target === card || e.target.closest(".sh-la-x") || a === "later") { ls(LATER_KEY, String(Date.now())); track("later"); close(); return; }
      if (a === "no") {
        var l = noList(); if (l.indexOf(norm(name)) < 0) l.push(norm(name));
        ls(NO_KEY, JSON.stringify(l.slice(-20))); track("no");
        body.innerHTML = '<p>Got it. You both show as <b>' + esc(name) + '</b> on the leaderboards; you can pick a different name any time by tapping your name.</p>' +
          '<div class="sh-la-row"><button type="button" class="sh-la-btn is-main" data-la="done">OK</button></div>';
        return;
      }
      if (a === "done") { close(); return; }
      if (a === "yes") {
        track("yes");
        body.innerHTML = '<p>Do one of these here; the other device does the opposite. On a hub, it’s under <b>Stats → Link my devices</b>.</p>' +
          '<div class="sh-la-step"><b>Make a code on this device</b><button type="button" class="sh-la-btn" data-la="make">Get a code</button><div class="sh-la-code" aria-live="polite"></div></div>' +
          '<div class="sh-la-step"><b>Or enter the code from your other device</b><div class="sh-la-enter"><input type="text" maxlength="7" autocomplete="one-time-code" autocapitalize="characters" placeholder="Code" aria-label="Link code">' +
          '<button type="button" class="sh-la-btn is-main" data-la="go">Link</button></div><div class="sh-la-msg" aria-live="polite"></div></div>';
        return;
      }
      if (a === "make") {
        var out = card.querySelector(".sh-la-code"); out.textContent = "…";
        rpc("create_link_code", { p_visitor: visitor() }).then(function(c){
          out.innerHTML = c ? '<span class="sh-la-big">' + esc(c.slice(0, 3) + " " + c.slice(3)) + '</span><small>On your other device, open any hub, tap Stats, then Link my devices, and enter this in the next 10 minutes.</small>' : "Couldn’t make a code. Are you online?";
          if (c) track("code");
        });
        return;
      }
      if (a === "go") {
        var inp = card.querySelector(".sh-la-enter input"), msg = card.querySelector(".sh-la-msg");
        var code = (inp.value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (code.length !== 6) { msg.textContent = "Codes are 6 letters and numbers."; return; }
        msg.textContent = "Linking…";
        rpc("redeem_link_code", { p_code: code, p_visitor: visitor() }).then(function(id){
          if (!id) { track("fail"); msg.textContent = "That code didn’t work. Codes last 10 minutes; make a fresh one and try again."; return; }
          if (id === visitor()) { msg.textContent = "This device already uses that code’s account."; return; }
          track("linked");
          try { if (window.shClicks && window.shClicks.flush) window.shClicks.flush(); } catch (e) {}
          /* same as Stats → Link my devices (widget/ranks.js) */
          ls("sh_visitor_id", id); ls("sh_display_name", null); ls("sh_rank_tier", null); ls("sh_trophy_seen", null);
          rpc("get_display_name", { p_visitor: id }).then(function(n){
            if (n) ls("sh_display_name", n);
            msg.textContent = "Linked! Reloading…";
            setTimeout(function(){ location.reload(); }, 900);
          });
        });
      }
    });
  }

  /* fromSave: the person just picked this name, so ask even inside the "Not now" wait */
  function check(name, fromSave){
    name = String(name || "").trim();
    var v = visitor();
    if (!name || !v || !C.sb || card || blocked()) return;
    if (noList().indexOf(norm(name)) >= 0) return;
    if (!fromSave) {
      if (Date.now() - (+ls(LATER_KEY) || 0) < 3 * 864e5) return;
      /* a survey, check-in or the Inbox is up: try again in a while instead of stacking on top */
      if (document.querySelector(".survey, .sh-inbox, .sh-name-dlg, .name-dlg, #sh-drill:not([hidden])")) { setTimeout(function(){ check(name, false); }, 30000); return; }
      ls(DAY_KEY, today());
    }
    /* a save reaches the server first; give it a moment so the check sees the new name */
    setTimeout(function(){
      rpc("name_shared", { p_visitor: v, p_name: name }).then(function(shared){
        if (!shared || blocked()) return;
        if (window.shTour && window.shTour.whenIdle) window.shTour.whenIdle(function(){ open(name); }); else open(name);
      });
    }, fromSave ? 1200 : 0);
  }

  window.shLinkAsk = {
    start: function(opts){
      C.sb = opts.sb || null; C.hub = opts.hub || "";
      if (typeof opts.section === "function") C.section = opts.section;
      if (ls(DAY_KEY) === today()) return;
      setTimeout(function(){
        var n = ls("sh_display_name");
        if (n) check(n, false);
      }, 6000);
    },
    check: function(name){ check(name, true); },
    open: open
  };
})();
