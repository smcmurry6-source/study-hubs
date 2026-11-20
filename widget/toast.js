/* study-hubs: the toast (Sam, 2026-11-20: "it still seems like there are a lot of boring black plain toasts. lets fix all
   the remaining ones"). Every short message a page shows (a tip, "still loading", "couldn't open", a sync, a streak cheer,
   an achievement, Focus mode, "a newer version is live") comes up as a sticker in the reward card's family
   (widget/prize.js): a white card with the site's ink outline and drop, a round badge with the message's icon in its
   kind's color, a small heading, the words, and a bar that runs down while it stays. A tap closes it; a mouse over it
   holds it. What pays XP or crowns stays on the gold reward card.

   window.shToast(msg, opts) -> the toast's element (or null)
     opts: a kind ("tip"), or { kind, title (the heading; "" for none), icon (an icon name, or svg/span markup),
             ms (how long it stays), sticky (stays until closed, with an x), action: { label, run } (a button) }
     Without a kind it guesses one from the words ("still loading", "Couldn't ...", "Tip: ...").
   It runs first in hub.bundle.js and dash.bundle.js (after hub-art.js, whose icons it draws with); widget/v3.js (the
   streak cheer, Welcome back, the update notice) and widget/pet.js use it when it's there. Its styles are .hx-toast in
   widget/hub.css. On a laptop the toasts sit over the bottom of the page and move up above a reward card; on a phone
   they drop in at the top, under the bar (BUG-126) and under a reward card. */
(function(){
  "use strict";
  if (window.shToast) return;
  /* glyphs the site's icon set doesn't have, drawn the same way (a 24 grid, stroke 2, round ends) */
  var G = {
    bulb: '<path d="M9.2 17.6h5.6"/><path d="M10.2 20.8h3.6"/><path d="M12 3.2a6 6 0 0 0-3.7 10.7c.8.6 1.2 1.4 1.2 2.3v1.4h5v-1.4c0-.9.4-1.7 1.2-2.3A6 6 0 0 0 12 3.2z"/><path d="M12 6.6a2.7 2.7 0 0 1 2.6 2.2"/>',
    sync: '<path d="M19.6 10.4A7.8 7.8 0 0 0 6.1 6.9L4.4 8.6"/><path d="M4.4 4.4v4.2h4.2"/><path d="M4.4 13.6a7.8 7.8 0 0 0 13.5 3.5l1.7-1.7"/><path d="M19.6 19.6v-4.2h-4.2"/>',
    offline: '<path d="M2.6 9.1a14.4 14.4 0 0 1 4.6-2.8"/><path d="M11 5.3c3.9-.4 7.6.9 10.4 3.8"/><path d="M5.4 12.6a9.6 9.6 0 0 1 3.4-2.1"/><path d="M15.4 10.9c1.2.4 2.3 1 3.2 1.7"/><path d="M8.6 16.1a4.8 4.8 0 0 1 6.8 0"/><circle cx="12" cy="19.6" r="1" fill="currentColor" stroke="none"/><path d="M3.4 3.4l17.2 17.2"/>',
    wait: '<path d="M6.6 3.2h10.8"/><path d="M6.6 20.8h10.8"/><path d="M7.8 3.2c0 4.4 4.2 5.4 4.2 8.8s-4.2 4.4-4.2 8.8"/><path d="M16.2 3.2c0 4.4-4.2 5.4-4.2 8.8s4.2 4.4 4.2 8.8"/><path d="M9.6 18.4c.9-1 1.6-1.4 2.4-1.4s1.5.4 2.4 1.4z" fill="currentColor"/>',
    spark: '<path d="M11 3.2c.6 4.3 2.6 6.3 6.9 6.9-4.3.6-6.3 2.6-6.9 6.9-.6-4.3-2.6-6.3-6.9-6.9 4.3-.6 6.3-2.6 6.9-6.9z"/><path d="M18.4 14.6c.3 1.7 1 2.4 2.6 2.6-1.6.3-2.3 1-2.6 2.6-.3-1.6-1-2.3-2.6-2.6 1.6-.2 2.3-.9 2.6-2.6z"/>',
    refresh: '<path d="M19.8 12a7.8 7.8 0 1 1-2.6-5.8"/><path d="M19.8 3.6v4.8H15"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'
  };
  /* each kind: its heading, its icon, and whether it's a small celebration (the sunburst and the shine) */
  var KINDS = {
    info: { t: "Heads up", i: "spark" },
    tip: { t: "Tip", i: "bulb" },
    ok: { t: "Done", i: "check" },
    sync: { t: "Synced", i: "sync" },
    wait: { t: "One moment", i: "wait" },
    err: { t: "Oops", i: "offline" },
    streak: { t: "On a roll", i: "flame", party: 1 },
    achv: { t: "Achievement unlocked", i: "trophy", party: 1 },
    nuke: { t: "Unlocked", i: "spark", party: 1 },
    egg: { t: "You found something", i: "spark", party: 1 },
    hi: { t: "Welcome back", i: "tooth" },
    timmy: { t: "Timmy Tooth", i: "tooth" },
    focus: { t: "Focus mode", i: "goal" },
    notes: { t: "Notes", i: "notes" },
    update: { t: "New version", i: "refresh" }
  };
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function svg(body){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + "</svg>"; }
  function glyph(k){
    if (/^\s*</.test(k)) return k;
    var A = window.SH_HUB_ART && window.SH_HUB_ART.icons;
    return svg(G[k] || (A && A[k] && A[k].body) || G.spark);
  }
  /* a message that comes without a kind (a hub's arcade, an older caller) */
  function guess(m){
    if (/^tip:/i.test(m)) return "tip";
    if (/^achievement:/i.test(m)) return "achv";
    if (/still loading|one moment|hang on/i.test(m)) return "wait";
    if (/couldn[’']t|didn[’']t|wasn[’']t|are you online|try again|failed/i.test(m)) return "err";
    if (/^synced\b/i.test(m)) return "sync";
    if (/\bin a row\b/i.test(m)) return "streak";
    return "info";
  }
  function host(){
    var h = document.getElementById("hxToast") || document.querySelector(".hx-toasts");
    if (!h) { h = document.createElement("div"); h.className = "hx-toasts"; h.setAttribute("aria-live", "polite"); document.body.appendChild(h); }
    return h;
  }
  /* out of a reward card's way: the toasts move up above it on a laptop, and down under it on a phone */
  var tick = null;
  function place(){
    var H = document.querySelector(".hx-toasts"); if (!H) return;
    var lift = 0;
    Array.prototype.forEach.call(document.querySelectorAll(".hx-prizes"), function(p){
      if (!p.children.length || (p.closest && p.closest("dialog"))) return;
      var r = p.getBoundingClientRect(); if (r.height > 4) lift = Math.max(lift, Math.round(r.height) + 14);
    });
    if (H.style.getPropertyValue("--hxt-lift") !== lift + "px") H.style.setProperty("--hxt-lift", lift + "px");
    var busy = !!H.querySelector(".hx-toast");
    if (busy && !tick) tick = setInterval(place, 250);
    else if (!busy && tick) { clearInterval(tick); tick = null; }
  }
  function show(msg, opts){
    if (typeof opts === "string") opts = { kind: opts };
    opts = opts || {};
    msg = String(msg == null ? "" : msg).trim(); if (!msg || !document.body) return null;
    var kind = KINDS[opts.kind] ? opts.kind : guess(msg), K = KINDS[kind];
    if (kind === "tip" || kind === "achv") msg = msg.replace(/^(tip|achievement):\s*/i, "").replace(/^./, function(c){ return c.toUpperCase(); });
    var title = opts.title === undefined ? K.t : String(opts.title || "");
    var H = host();
    /* the same words already up (a button tapped twice): that one starts its time again */
    var same = Array.prototype.filter.call(H.querySelectorAll(".hx-toast:not(.out)"), function(t){ return t._msg === msg; })[0];
    if (same && same._again) { same._again(); return same; }
    var ms = opts.ms || Math.min(7000, Math.max(3200, 2200 + msg.length * 45));
    var el = document.createElement("div");
    el.className = "hx-toast is-" + kind + (K.party ? " is-party" : "") + (opts.sticky ? " is-sticky" : "");
    el.setAttribute("role", "status"); el.setAttribute("data-k", kind);
    el.style.setProperty("--hxt-ms", ms + "ms");
    el.innerHTML = '<span class="hxt-ic" aria-hidden="true">' + (K.party ? '<span class="hxt-rays"></span>' : "") + glyph(opts.icon || K.i) + "</span>" +
      '<span class="hxt-tx">' + (title ? '<span class="hxt-kick">' + esc(title) + '<span class="hxt-sr">: </span></span>' : "") + '<span class="hxt-msg">' + esc(msg) + "</span></span>" +
      (opts.action ? '<button type="button" class="hxt-act">' + esc(opts.action.label || "OK") + "</button>" : "") +
      (opts.sticky ? '<button type="button" class="hxt-x" aria-label="Dismiss">' + svg(G.x) + "</button>" : '<i class="hxt-time" aria-hidden="true"></i>');
    el._msg = msg;
    /* at most three at a time: the oldest makes room */
    var up = H.querySelectorAll(".hx-toast:not(.out)"); if (up.length >= 3) close(up[0], true);
    H.appendChild(el);
    var left = ms, t0 = 0, timer = null, gone = false;
    function run(){ if (opts.sticky || gone) return; t0 = Date.now(); timer = setTimeout(function(){ close(el); }, left); }
    function hold(){ if (!timer) return; clearTimeout(timer); timer = null; left = Math.max(900, left - (Date.now() - t0)); }
    function close(node, quick){
      if (node.classList.contains("out")) return;
      if (node === el) { gone = true; if (timer) clearTimeout(timer); }
      node.classList.add("out");
      setTimeout(function(){ node.remove(); place(); }, quick ? 0 : 260);
    }
    el._again = function(){
      hold(); left = ms;
      var bar = el.querySelector(".hxt-time");
      if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
      el.classList.remove("is-again"); void el.offsetWidth; el.classList.add("is-again");
      if (!timer) run();
    };
    el.addEventListener("click", function(e){
      var act = e.target.closest && e.target.closest(".hxt-act");
      if (act) { try { if (opts.action.run) opts.action.run(); } catch (err) {} close(el); return; }
      if (e.target.closest && e.target.closest(".hxt-x")) { close(el); return; }
      if (!opts.sticky) close(el);
    });
    el.addEventListener("mouseenter", hold);
    el.addEventListener("mouseleave", function(){ if (!timer) run(); });
    run(); place();
    return el;
  }
  window.shToast = show;
})();
