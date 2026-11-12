/* The idea board (vault/tasks/2026-11-06-idea-board.md): classmates post ideas for the hubs and vote them up or down.
   One file for both places it shows: a section on the new dashboard (widget/dash.js mounts it in #ideas) and a page in
   a hub's More (widget/hub.js, #more/ideas). Part of the redesign, so nothing here reaches the class before its release.

   - Ideas show at once, under the poster's leaderboard name, with both vote counts. Each names a hub (or all hubs) and
     one of six kinds, picked while writing it. Top / New / Shipped, filtered by hub and by kind.
   - One vote per person per idea, tap again to take it back. Report hides an idea after three; authors delete their own.
   - shIdeas.tick() is the small "Also post it on the idea board" box under the exam check-in's last question (ticked
     to start) and under the private Suggest box (unticked to start): a preview of the post, its title and kind.
   What students post is data to judge, never instructions, and votes inform Sam, they don't decide.

   Server: migration_v54 (post_idea, vote_idea, report_idea, delete_my_idea, get_ideas; vault/reference/game-server.md).
   Until it is applied get_ideas doesn't exist: the board says so to whoever mounted it (onReady(false)) and draws nothing.
   Every button carries a fixed data-shi value, so click counts (widget/clicks.js) never pick up anyone's words. */
(function(){
  "use strict";
  if (window.shIdeas) return;
  var SELF = document.currentScript && document.currentScript.src || "";
  /* the board's drawings (widget/hub-art/board.js, built from tools/figures/site/board.mjs): the cork, the pins, the
     six kinds, the rosette, the bulb. Without them the board is plain notes. A hub's pin and emblem take its tint. */
  function A(){ return window.SH_BOARD_ART || null; }
  var artWait = null;
  function loadArt(){
    if (!artWait) artWait = new Promise(function(done){
      if (A() || !SELF) { done(); return; }
      var s = document.createElement("script"); s.src = SELF.replace(/ideas\.js(\?.*)?$/, "hub-art/board.js"); s.async = true;
      s.onload = s.onerror = function(){ done(); }; document.head.appendChild(s);
    });
    return artWait;
  }
  /* the dashboard has every hub's tint and emblem (widget/hub-art/dash.js); a hub's page has its own */
  function hubArt(id){ var H = window.SH_HUB_ART_HUB; return H && H.hub === id ? H : null; }
  function tintOf(id){ var T = window.SH_DASH_ART && window.SH_DASH_ART.tints, H = hubArt(id); return (id && T && T[id]) || (H && H.tint) || null; }
  function emblemOf(id){
    var D = window.SH_DASH_ART, H = hubArt(id), e = (D && D.emblems && D.emblems[id]) || (H && H.emblem), t = tintOf(id);
    return e && t ? '<svg class="shi-emb" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="31" fill="' + t.light + '"/><g transform="translate(6.4 6.4) scale(.8)">' + e.body + "</g></svg>" : "";
  }
  var CATS = [
    ["feature", "New feature", "Something the hubs don't do yet"],
    ["better", "Make something work better", "How something that's already there works"],
    ["content", "Questions and notes", "More questions, notes, figures or cases"],
    ["fun", "Games and fun", "The arcade, Timmy, trophies, ranks, easter eggs"],
    ["look", "Look and feel", "Design, layout, colors"],
    ["other", "Something else", "Anything that doesn't fit the others"]
  ];
  var CAT_NAME = {}; CATS.forEach(function(c){ CAT_NAME[c[0]] = c[1]; });
  var STATUS = { considering: "Under consideration", planned: "Planned", shipped: "Shipped", "not-doing": "Not doing" };
  var TABS = [["top", "Top"], ["new", "New"], ["shipped", "Shipped"]];
  var RULES = "No quiz or exam questions or answers, and nothing about a classmate.";
  var ERR = {
    name: "Pick a name first: ideas show under it.",
    title: "Give it a title of 3 to 80 characters.",
    "long": "Keep the details to 280 characters.",
    hub: "That hub can't take ideas yet. Pick All hubs.",
    category: "Pick what kind of idea it is.",
    slow: "One idea every 20 seconds. Try again in a moment.",
    limit: "That's three ideas today. More tomorrow.",
    dup: "That one is already posted.",
    bad: "That didn't post. Reload the page and try again."
  };
  var OFFLINE = "Couldn't reach the idea board just now. Try again in a moment.";

  /* ---------- helpers ---------- */
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ls(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }
  function track(k){ try { if (window.shTrack) window.shTrack(k); } catch (e) {} }
  function icon(k, px){
    var A = window.SH_HUB_ART, b = A && A.icons && A.icons[k] ? A.icons[k].body : ""; px = px || 20;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + "</svg>";
  }
  function ago(iso){
    var t = Date.parse(iso); if (!isFinite(t)) return "";
    var s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 90) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) { var h = Math.floor(s / 3600); return h + (h === 1 ? " hour ago" : " hours ago"); }
    var d = Math.floor(s / 86400); return d === 1 ? "yesterday" : d < 30 ? d + " days ago" : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function visitor(){
    var v = ls("sh_visitor_id"); if (v) return v;
    try {
      v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("v-" + Date.now() + "-" + Math.random().toString(16).slice(2));
      localStorage.setItem("sh_visitor_id", v);
    } catch (e) {}
    return v || "";
  }
  function requestId(){
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
  }
  function tidy(s){ return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }
  /* a title from an answer's first words: its first sentence, cut at a word to 60 characters */
  function titleFrom(text){
    var t = tidy(text), m = t.match(/^(.{3,}?)[.!?](\s|$)/); if (m) t = m[1];
    if (t.length > 60) { t = t.slice(0, 61); var sp = t.lastIndexOf(" "); t = t.slice(0, sp > 24 ? sp : 60); }
    return t.replace(/[\s,;:.!?-]+$/, "");
  }
  function hubLabel(id, o){
    var n = "";
    try { n = o && typeof o.name === "function" ? o.name(id) : ""; } catch (e) {}
    if (!n && window.SH_HUB && window.SH_HUB.hub === id) n = window.SH_HUB.name;
    if (!n) { var T = window.SH_DASH_ART && window.SH_DASH_ART.tints; n = T && T[id] && T[id].name; }
    return n || String(id).split("-").map(function(w){ return /^exam\d+$/.test(w) ? "Exam " + w.slice(4) : w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }
  function css(){
    if (document.querySelector('link[href*="widget/ideas.css"], link[href$="ideas.css"]')) return;
    var l = document.createElement("link"); l.rel = "stylesheet"; l.href = SELF ? SELF.replace(/ideas\.js(\?.*)?$/, "ideas.css") : "ideas.css";
    document.head.appendChild(l);
  }

  /* ---------- the server ---------- */
  function call(sb, fn, args){
    if (!sb) return Promise.resolve({ fail: true });
    try {
      return sb.rpc(fn, args).then(function(r){ return r && !r.error ? { data: r.data } : { fail: true, error: r && r.error }; }, function(){ return { fail: true }; });
    } catch (e) { return Promise.resolve({ fail: true }); }
  }
  function isBoard(d){ return !!d && typeof d === "object" && !Array.isArray(d) && Array.isArray(d.ideas); }
  /* is the board up? (one small get_ideas, remembered for the page) */
  var upAsked = null;
  function up(sb){
    if (!upAsked) upAsked = call(sb || window.shSupabase, "get_ideas", { p_visitor: visitor() || null, p_tab: "new", p_hub: null, p_category: null, p_limit: 1 }).then(function(r){ return isBoard(r.data); });
    return upAsked;
  }
  /* the leaderboard name an idea shows under: only one the person picked (post_idea refuses a random one). Someone
     who hasn't picked one in this browser is asked first, the box starting on the name the boards show for them now
     (nameHint: a random one, or one picked on another device), theirs to keep or change. */
  function nameNow(){ return tidy(ls("sh_display_name") || "").slice(0, 24); }
  function nameHint(o){
    var n = "";
    try { n = o && typeof o.nameHint === "function" ? o.nameHint() : window.shNameNow ? window.shNameNow() : ""; } catch (e) {}
    return tidy(n).slice(0, 24);
  }
  function saveName(sb, name){
    name = tidy(name).slice(0, 24);
    return call(sb, "set_display_name", { p_visitor: visitor(), p_name: name }).then(function(r){
      if (r.fail) return false;
      try { localStorage.setItem("sh_display_name", name); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent("sh:name", { detail: { name: name } })); } catch (e) {}
      try { if (window.shLinkAsk) window.shLinkAsk.check(name); } catch (e) {}
      return true;
    });
  }
  /* one post: { ok, id, name } or { ok: false, msg } */
  function send(sb, p){
    var go = function(){
      return call(sb, "post_idea", { p_visitor: visitor(), p_title: p.title, p_body: p.body || "", p_hub: p.hub || null, p_category: p.category, p_source: p.source || "board", p_request: p.request || requestId() }).then(function(r){
        var d = r.data;
        if (r.fail || !d || typeof d !== "object") return { ok: false, msg: OFFLINE };
        if (!d.ok) return { ok: false, error: d.error, msg: ERR[d.error] || ERR.bad };
        track("ideas:post=" + (p.source || "board"));
        return { ok: true, id: d.id, name: d.name };
      });
    };
    if (p.newName) return saveName(sb, p.newName).then(function(ok){ return ok ? go() : { ok: false, msg: OFFLINE }; });
    return go();
  }
  function kindOptions(cur){ return (cur ? "" : '<option value="" selected>Pick a kind</option>') + CATS.map(function(c){ return '<option value="' + c[0] + '"' + (c[0] === cur ? " selected" : "") + ">" + esc(c[1]) + "</option>"; }).join(""); }

  /* ====================================================================
     THE BOARD
     el: where it draws. o: { sb, hub (the hub this board is in, or none on the dashboard), hubs() (the live hubs an idea
     can be for: [{ id, name }]), name(id) (any hub's short name), tint(id) (a hub's colors as CSS variables),
     heading (false when the page already has the title), level (the cards' heading level), page (cards per "Show more"),
     editName() (opens the name editor), nameHint() (the name the boards show for this person now), onReady(ok) }
     ==================================================================== */
  var boards = [], UID = 0;
  function mount(el, o){
    if (!el) return null;
    o = o || {}; css();
    var sb = o.sb || window.shSupabase || null, here = o.hub || null, uid = "shi" + (++UID);
    var PAGE = o.page || 6, HN = o.level || "h3";
    var S = { tab: "top", hub: here || "*", cat: "", data: null, shown: PAGE, form: false, busy: false, ready: false, focus: null };
    function liveHubs(){ var a = []; try { a = (typeof o.hubs === "function" ? o.hubs() : o.hubs) || []; } catch (e) {} return a.filter(function(h){ return h && h.id; }); }
    function label(id){ var m = liveHubs().filter(function(h){ return h.id === id; })[0]; return (m && m.name) || hubLabel(id, o); }

    el.classList.add("shi");
    el.innerHTML =
      '<div class="shi-head">' + (o.heading === false ? '<p class="shi-lede">' : '<h2 id="' + uid + 'H">Idea board</h2><p class="note shi-lede">') +
        "Ideas for the hubs, from the class. Vote for the ones you'd use: the votes show Sam what the class wants most.</p>" +
        '<button type="button" class="btn btn-primary shi-new" data-shi="new" aria-expanded="false" aria-controls="' + uid + 'F">Post an idea</button></div>' +
      '<form class="shi-form" id="' + uid + 'F" novalidate hidden></form>' +
      '<p class="shi-say" role="status" aria-live="polite"></p>' +
      '<div class="shi-bar">' +
        '<span class="seg" role="group" aria-label="Which ideas">' + TABS.map(function(t){ return '<button type="button" data-shi-tab="' + t[0] + '" aria-pressed="' + (t[0] === S.tab) + '">' + t[1] + "</button>"; }).join("") + "</span>" +
        '<label class="shi-pick"><span class="sr">Show ideas for</span><select data-shi-filter="hub"></select></label>' +
        '<label class="shi-pick"><span class="sr">Kind of idea</span><select data-shi-filter="cat"></select></label>' +
      "</div>" +
      '<div class="shi-wall"><div class="shi-peek" aria-hidden="true"></div><div class="shi-frame"><div class="shi-cork">' +
        '<ul class="shi-list"></ul>' +
        '<p class="shi-empty" hidden></p>' +
        '<button type="button" class="btn shi-more" data-shi="more" hidden>Show more ideas</button>' +
      "</div></div></div>";
    if (o.heading !== false) el.setAttribute("aria-labelledby", uid + "H"); else el.setAttribute("aria-label", "Idea board");
    var $ = function(s){ return el.querySelector(s); };
    var form = $(".shi-form"), list = $(".shi-list"), say = $(".shi-say");
    /* the drawn parts: the cork and the pad's binding as backgrounds, Timmy looking over the frame with an idea */
    function decorate(){
      var a = A(); if (!a || el.classList.contains("has-art")) return;
      el.classList.add("has-art");
      el.style.setProperty("--shi-cork", 'url("data:image/svg+xml,' + encodeURIComponent(a.cork()) + '")');
      el.style.setProperty("--shi-ring", 'url("data:image/svg+xml,' + encodeURIComponent(a.ring()) + '")');
      var t = ""; try { if (window.shPet && window.shPet.art) t = String(window.shPet.art({ hp: 100, mood: "happy", hat: "" }, 200)); } catch (e) {}
      if (t) $(".shi-peek").innerHTML = '<span class="shi-bulb">' + a.bulb(38) + '</span><span class="shi-timmy">' + t + "</span>";
    }
    /* the drawings are fetched when the board is about to come into view, not with the page: on the dashboard it is
       several screens down, and a page's first load has a request budget (tools/release/budgets.json) */
    function wantArt(){ loadArt().then(function(){ if (A() && el.isConnected) { decorate(); if (S.data) paint(); } }); }
    if (A()) decorate();
    else if (window.IntersectionObserver) {
      var artIO = new IntersectionObserver(function(es){
        if (es.some(function(e){ return e.isIntersecting; })) { artIO.disconnect(); wantArt(); }
      }, { rootMargin: "900px 0px" });
      artIO.observe(el);
    } else wantArt();
    function tell(msg){ say.textContent = msg || ""; }
    function find(id){ return S.data ? S.data.ideas.filter(function(i){ return String(i.id) === String(id); })[0] : null; }

    /* ----- the list ----- */
    function tagsHTML(it){
      var t = "", a = A(), em = it.hub ? emblemOf(it.hub) : "";
      if (it.hub) t += '<span class="shi-tag is-hub' + (em ? " has-emb" : o.tint ? ' has-dot" style="' + esc(o.tint(it.hub)) : "") + '">' + em + esc(label(it.hub)) + "</span>";
      else t += '<span class="shi-tag is-hub">All hubs</span>';
      t += '<span class="shi-tag">' + esc(CAT_NAME[it.category] || "Something else") + "</span>";
      if (it.source === "starter") t += '<span class="shi-tag is-src">Starter idea</span>';
      else if (it.source === "checkin") t += '<span class="shi-tag is-src">From a check-in</span>';
      if (STATUS[it.status]) t += '<span class="shi-stamp is-' + esc(it.status) + '">' + (a && it.status === "shipped" ? a.check(14) : "") + esc(STATUS[it.status]) + "</span>";
      return t;
    }
    function voteLabel(it, up){ var n = up ? it.up : it.down; return (up ? "Vote up" : "Vote down") + ", " + n + (up ? " up" : " down") + (n === 1 ? " vote" : " votes") + (it.mine === (up ? 1 : -1) ? ", yours" : ""); }
    /* a note on the board: its pin in its hub's color (red for all hubs), the picture of its kind, and on the Top tab
       with nothing filtered the first idea wears the rosette */
    function cardHTML(it, i){
      var a = A(), cat = CAT_NAME[it.category] ? it.category : "other";
      var top = i === 0 && S.tab === "top" && S.hub === (here || "*") && !S.cat && (+it.up || 0) - (+it.down || 0) > 0;
      return '<li class="shi-card is-k-' + cat + (it.own ? " is-own" : "") + (top ? " is-top" : "") + '" data-idea="' + esc(it.id) + '" style="--i:' + Math.min(i || 0, 9) + '">' +
        (a ? '<span class="shi-pin" aria-hidden="true">' + a.pin(tintOf(it.hub), 26) + "</span>" : "") +
        (a && top ? '<span class="shi-rosette" aria-hidden="true">' + a.rosette(42) + "</span>" : "") +
        '<div class="shi-top">' + (a ? '<span class="shi-kindart" aria-hidden="true">' + a.kind(cat, 40) + "</span>" : "") +
          '<div class="shi-text"><' + HN + ' class="shi-title">' + (top ? '<span class="sr">Top idea: </span>' : "") + esc(it.title) + "</" + HN + ">" +
          (it.body ? '<p class="shi-body">' + esc(it.body) + "</p>" : "") + "</div></div>" +
        '<p class="shi-tags">' + tagsHTML(it) + "</p>" +
        (STATUS[it.status] && it.note ? '<p class="shi-why"><b>Sam:</b> ' + esc(it.note) + "</p>" : "") +
        '<div class="shi-foot">' +
          '<div class="shi-votes" role="group" aria-label="Vote on this idea">' +
            '<button type="button" class="shi-vote is-up" data-shi="up" aria-pressed="' + (it.mine === 1) + '" aria-label="' + esc(voteLabel(it, true)) + '">' + icon("thumbup", 18) + '<span class="num">' + (+it.up || 0) + "</span></button>" +
            '<button type="button" class="shi-vote is-down" data-shi="down" aria-pressed="' + (it.mine === -1) + '" aria-label="' + esc(voteLabel(it, false)) + '">' + icon("thumbdown", 18) + '<span class="num">' + (+it.down || 0) + "</span></button>" +
          "</div>" +
          '<p class="shi-meta"><span><b>' + esc(it.name) + "</b> · " + esc(ago(it.at)) + (it.own ? " · you" : "") + "</span>" +
            (it.own ? '<button type="button" class="shi-act" data-shi="delete">Delete</button>'
              : it.source === "starter" ? ""
              : '<button type="button" class="shi-act" data-shi="report"' + (it.reported ? " disabled" : "") + ">" + (it.reported ? "Reported" : "Report") + "</button>") +
          "</p></div></li>";
    }
    function syncVotes(li, it){
      [["up", true], ["down", false]].forEach(function(v){
        var b = li.querySelector('[data-shi="' + v[0] + '"]'); if (!b) return;
        b.setAttribute("aria-pressed", String(it.mine === (v[1] ? 1 : -1)));
        b.setAttribute("aria-label", voteLabel(it, v[1]));
        b.querySelector(".num").textContent = v[1] ? it.up : it.down;
      });
    }
    function options(sel, rows, cur){
      sel.innerHTML = rows.map(function(r){ return '<option value="' + esc(r[0]) + '"' + (r[0] === cur ? " selected" : "") + ">" + esc(r[1]) + " (" + r[2] + ")</option>"; }).join("");
    }
    function paintFilters(){
      var d = S.data, by = d.hubs || {}, all = +by[""] || 0, every = 0, rows;
      Object.keys(by).forEach(function(k){ every += +by[k] || 0; });
      if (here) rows = [[here, "This hub and all hubs", (+by[here] || 0) + all], ["*", "Every hub's ideas", every]];
      else {
        var ids = liveHubs().map(function(h){ return h.id; });
        Object.keys(by).forEach(function(k){ if (k && ids.indexOf(k) < 0) ids.push(k); });
        rows = [["*", "Every idea", every], ["", "For all hubs", all]].concat(ids.map(function(id){ return [id, label(id), (+by[id] || 0) + all]; }));
      }
      options($('[data-shi-filter="hub"]'), rows, S.hub);
      var cats = d.categories || {}, any = 0; Object.keys(cats).forEach(function(k){ any += +cats[k] || 0; });
      options($('[data-shi-filter="cat"]'), [["", "Any kind", any]].concat(CATS.map(function(c){ return [c[0], c[1], +cats[c[0]] || 0]; })), S.cat);
    }
    function paint(){
      var d = S.data; if (!d) return;
      paintFilters();
      var rows = d.ideas.slice(0, S.shown), empty = $(".shi-empty"), more = $(".shi-more");
      list.innerHTML = rows.map(cardHTML).join("");
      /* the notes are pinned up one after another when the board first shows or a tab or filter changes it, not on a vote */
      var key = S.tab + "|" + S.hub + "|" + S.cat;
      if (key !== S.painted) { S.painted = key; list.classList.remove("is-fresh"); void list.offsetWidth; list.classList.add("is-fresh"); }
      else list.classList.remove("is-fresh");
      empty.hidden = !!rows.length;
      empty.textContent = S.tab === "shipped" ? "Nothing here yet. When an idea gets built, it moves to this tab."
        : (S.hub !== "*" || S.cat) ? "No ideas match these filters yet." : "No ideas yet. Post the first one.";
      more.hidden = d.ideas.length <= S.shown;
      if (S.focus != null) {
        var li = list.querySelector('[data-idea="' + S.focus + '"]'); S.focus = null;
        if (li) { li.classList.add("is-new"); try { li.scrollIntoView({ block: "nearest" }); } catch (e) {} }
      }
    }
    function load(){
      return call(sb, "get_ideas", { p_visitor: visitor() || null, p_tab: S.tab, p_hub: S.hub === "*" ? null : S.hub, p_category: S.cat || null, p_limit: 100 }).then(function(r){
        var ok = isBoard(r.data);
        if (ok) { S.data = r.data; paint(); }
        else if (S.ready) tell(OFFLINE);
        if (!S.ready) { S.ready = true; el.classList.toggle("is-off", !ok); if (ok) upAsked = Promise.resolve(true); try { if (o.onReady) o.onReady(ok); } catch (e) {} }
        return ok;
      });
    }

    /* ----- the form ----- */
    function formHTML(){
      var name = nameNow(), hubs = liveHubs();
      if (here && !hubs.some(function(h){ return h.id === here; })) hubs = [{ id: here, name: label(here) }].concat(hubs);
      return "<" + HN + ' class="shi-formh">Post an idea</' + HN + ">" +
        '<p class="note">It shows to the class right away, under your name. ' + RULES + "</p>" +
        (name ? '<p class="shi-as">Posting as <b>' + esc(name) + "</b>" + (o.editName ? ' · <button type="button" class="shi-act" data-shi="rename">change</button>' : "") + "</p>"
          : '<label class="shi-f"><span>Your name</span><input type="text" data-shi-f="name" maxlength="24" autocomplete="nickname" placeholder="Pick a name" value="' + esc(nameHint(o)) + '"><small>Ideas show under your leaderboard name, the one classmates see on the boards. Keep it or change it.</small></label>') +
        '<label class="shi-f"><span>Title</span><input type="text" data-shi-f="title" maxlength="80" placeholder="The idea in a few words" required></label>' +
        '<label class="shi-f"><span>Details <i>(optional)</i></span><textarea data-shi-f="body" maxlength="280" rows="3" placeholder="What it would do, and why it would help"></textarea><small class="shi-left num" aria-live="polite"></small></label>' +
        '<label class="shi-f"><span>For</span><select data-shi-f="hub">' +
          '<option value=""' + (here ? "" : " selected") + ">All hubs</option>" +
          hubs.map(function(h){ return '<option value="' + esc(h.id) + '"' + (h.id === here ? " selected" : "") + ">" + esc(h.name || label(h.id)) + "</option>"; }).join("") + "</select></label>" +
        '<fieldset class="shi-kinds"><legend>What kind of idea</legend>' + CATS.map(function(c){
          return '<label class="shi-kind" data-shi-kind="' + c[0] + '"><input type="radio" name="' + uid + 'cat" value="' + c[0] + '">' + (A() ? '<span class="shi-kindart" aria-hidden="true">' + A().kind(c[0], 34) + "</span>" : "") + '<span class="shi-kindtxt"><b>' + esc(c[1]) + "</b><small>" + esc(c[2]) + "</small></span></label>";
        }).join("") + "</fieldset>" +
        '<p class="shi-msg" role="alert"></p>' +
        '<div class="shi-actions"><button type="button" class="btn btn-text" data-shi="cancel">Cancel</button><button type="submit" class="btn btn-primary" data-shi="post">Post idea</button></div>';
    }
    function openForm(on){
      S.form = on; form.hidden = !on;
      var b = $(".shi-new"); b.setAttribute("aria-expanded", String(on)); b.hidden = on;
      if (on) { form.innerHTML = formHTML(); tell(""); try { (form.querySelector('[data-shi-f="name"]') || form.querySelector('[data-shi-f="title"]')).focus(); } catch (e) {} }
      else { form.innerHTML = ""; try { b.focus(); } catch (e) {} }
    }
    function submit(){
      if (S.busy) return;
      var f = function(k){ return form.querySelector('[data-shi-f="' + k + '"]'); }, msg = form.querySelector(".shi-msg");
      var nameEl = f("name"), newName = nameEl ? tidy(nameEl.value).slice(0, 24) : "", title = tidy(f("title").value), body = tidy(f("body").value);
      var cat = form.querySelector('input[type="radio"]:checked'), bad = "", at = null;
      if (nameEl && !newName) { bad = ERR.name; at = nameEl; }
      else if (!nameEl && !nameNow()) { openForm(true); return; }
      else if (title.length < 3 || title.length > 80) { bad = ERR.title; at = f("title"); }
      else if (body.length > 280) { bad = ERR["long"]; at = f("body"); }
      else if (!cat) { bad = ERR.category; at = form.querySelector('input[type="radio"]'); }
      if (bad) { msg.textContent = bad; try { at.focus(); } catch (e) {} return; }
      S.busy = true; msg.textContent = ""; var btn = form.querySelector('[data-shi="post"]'); btn.disabled = true;
      var hub = f("hub").value || null;
      send(sb, { title: title, body: body, hub: hub, category: cat.value, source: "board", newName: newName }).then(function(r){
        S.busy = false; btn.disabled = false;
        if (!r.ok) {
          /* the server has no name for this browser (picked on another device, or cleared): ask for one */
          if (r.error === "name" && !form.querySelector('[data-shi-f="name"]')) { try { localStorage.removeItem("sh_display_name"); } catch (e) {} var keep = { t: f("title").value, b: f("body").value, h: f("hub").value, c: cat.value }; form.innerHTML = formHTML(); f("title").value = keep.t; f("body").value = keep.b; f("hub").value = keep.h; var rc = form.querySelector('input[value="' + keep.c + '"]'); if (rc) rc.checked = true; msg = form.querySelector(".shi-msg"); }
          msg.textContent = r.msg; return;
        }
        openForm(false);
        /* show it: the New tab, with filters that include it */
        S.tab = "new"; S.cat = ""; if (!(S.hub === "*" || hub === null || S.hub === hub)) S.hub = "*";
        S.shown = PAGE; S.focus = r.id; paintTabs();
        load().then(function(){ tell("Posted. Your idea is on the board as " + (r.name || "you") + "."); });
        boards.forEach(function(b){ if (b.el !== el) b.reload(); });
      });
    }
    function paintTabs(){ [].forEach.call(el.querySelectorAll("[data-shi-tab]"), function(b){ b.setAttribute("aria-pressed", String(b.getAttribute("data-shi-tab") === S.tab)); }); }

    /* ----- what gets tapped ----- */
    function vote(li, it, val){
      if (it.busy) return;
      var next = it.mine === val ? 0 : val, old = { up: it.up, down: it.down, mine: it.mine };
      if (it.mine === 1) it.up--; if (it.mine === -1) it.down--;
      if (next === 1) it.up++; if (next === -1) it.down++;
      it.mine = next; it.busy = true; syncVotes(li, it); tell(""); track("ideas:vote");
      call(sb, "vote_idea", { p_visitor: visitor(), p_id: it.id, p_val: next }).then(function(r){
        it.busy = false;
        var d = r.data;
        if (!r.fail && d && typeof d === "object") { it.up = +d.up || 0; it.down = +d.down || 0; it.mine = +d.mine || 0; }
        else { it.up = old.up; it.down = old.down; it.mine = old.mine; tell(r.fail ? "That vote didn't save. Try again in a moment." : "That idea isn't on the board any more."); }
        if (li.isConnected) syncVotes(li, it);
      });
    }
    el.addEventListener("click", function(e){
      var tab = e.target.closest("[data-shi-tab]");
      if (tab) { var t = tab.getAttribute("data-shi-tab"); if (t === S.tab) return; S.tab = t; S.shown = PAGE; paintTabs(); tell(""); track("ideas:tab=" + t); load(); return; }
      var b = e.target.closest("[data-shi]"); if (!b || b.disabled) return;
      var a = b.getAttribute("data-shi"), li = b.closest("[data-idea]"), it = li ? find(li.getAttribute("data-idea")) : null;
      if (a === "new") openForm(true);
      else if (a === "cancel") openForm(false);
      else if (a === "rename") { try { o.editName(); } catch (err) {} }
      else if (a === "more") { S.shown += PAGE; var n = list.children.length; paint(); var nx = list.children[n]; if (nx) { var fb = nx.querySelector("button"); try { fb.focus(); } catch (err) {} } }
      else if (!it) return;
      else if (a === "up" || a === "down") vote(li, it, a === "up" ? 1 : -1);
      else if (a === "report") {
        b.disabled = true; b.textContent = "Reported"; it.reported = true; track("ideas:report");
        call(sb, "report_idea", { p_visitor: visitor(), p_id: it.id }).then(function(){ tell("Reported. Three reports hide an idea until Sam looks at it."); });
      }
      else if (a === "delete") {
        if (!window.confirm("Delete your idea? Its votes go with it.")) return;
        b.disabled = true;
        call(sb, "delete_my_idea", { p_visitor: visitor(), p_id: it.id }).then(function(r){
          if (r.fail || r.data !== true) { b.disabled = false; tell("That didn't delete. Try again in a moment."); return; }
          track("ideas:delete"); load().then(function(){ tell("Your idea was deleted."); });
          boards.forEach(function(x){ if (x.el !== el) x.reload(); });
        });
      }
    });
    el.addEventListener("change", function(e){
      var s = e.target.closest("[data-shi-filter]"); if (!s) return;
      var k = s.getAttribute("data-shi-filter");
      if (k === "hub") { S.hub = s.value; track("ideas:filter=hub:" + (s.value === "*" ? "every" : s.value || "all")); }
      else { S.cat = s.value; track("ideas:filter=cat:" + (s.value || "any")); }
      S.shown = PAGE; tell(""); load();
    });
    form.addEventListener("submit", function(e){ e.preventDefault(); submit(); });
    form.addEventListener("input", function(e){
      if (!e.target.matches('[data-shi-f="body"]')) return;
      var left = 280 - e.target.value.length, c = form.querySelector(".shi-left"); c.textContent = left <= 60 ? left + " left" : "";
    });
    function onName(){ if (S.form && form.querySelector(".shi-as, [data-shi-f=name]")) { var keep = {}; ["title", "body", "hub"].forEach(function(k){ var x = form.querySelector('[data-shi-f="' + k + '"]'); keep[k] = x ? x.value : ""; }); var c = form.querySelector('input[type="radio"]:checked'); form.innerHTML = formHTML(); ["title", "body", "hub"].forEach(function(k){ var x = form.querySelector('[data-shi-f="' + k + '"]'); if (x) x.value = keep[k]; }); if (c) { var rc = form.querySelector('input[value="' + c.value + '"]'); if (rc) rc.checked = true; } } }
    document.addEventListener("sh:name", onName);

    var api = { el: el, reload: function(){ return S.ready && S.data ? load() : Promise.resolve(false); }, state: function(){ return { tab: S.tab, hub: S.hub, cat: S.cat }; } };
    boards = boards.filter(function(b){ return b.el.isConnected && b.el !== el; }); boards.push(api);
    load();
    return api;
  }

  /* ====================================================================
     THE TICK: "Also post this on the idea board", under the exam check-in's last question and the Suggest box.
     host: an empty element. o: { sb, hub, hubName, nameHint(), source ("checkin" | "suggest"), checked (how the tick starts),
     category (the kind it starts on; none means the person picks), state (an object the caller keeps, so the tick survives a redraw) }.
     Returns { on(), sync(text), check(), post() }: sync() is called as the person types their answer; check() gives
     what's missing as a sentence, or ""; post() resolves { ok } or { ok: false, msg }. Draws nothing until the board is up.
     ==================================================================== */
  function tick(host, o){
    o = o || {}; css();
    var sb = o.sb || window.shSupabase || null, uid = "shit" + (++UID);
    var T = o.state || {};
    if (T.on == null) T.on = o.checked !== false;
    if (T.cat == null) T.cat = o.category || "";
    if (T.name == null) T.name = nameHint(o);
    var text = T.text || "", drawn = false, hubName = o.hub ? (o.hubName || hubLabel(o.hub, o)) : "All hubs";
    function f(k){ return host.querySelector('[data-shi-f="' + k + '"]'); }
    function fill(){
      if (!T.dirtyT) T.title = titleFrom(text);
      /* the details: what comes after the title's sentence, or the whole answer when the title is a cut of it */
      if (!T.dirtyB) {
        var b = tidy(text), n = T.title.length;
        if (b === T.title) b = "";
        else if (n && b.indexOf(T.title) === 0 && /[.!?]/.test(b.charAt(n))) b = b.slice(n).replace(/^[.!?\s]+/, "");
        T.body = b.slice(0, 280);
      }
    }
    function draw(){
      var name = nameNow(), show = T.on && !!tidy(text);
      host.className = "shi-tick";
      host.innerHTML =
        '<label class="shi-tickrow" data-shi-tick="' + esc(o.source || "suggest") + '"><input type="checkbox" data-shi-f="on"' + (T.on ? " checked" : "") + "><span>Also post this on the idea board" + (name ? " as <b>" + esc(name) + "</b>" : "") + "</span></label>" +
        '<div class="shi-prev"' + (show ? "" : " hidden") + ">" +
          '<p class="shi-prevnote">The class sees this right away, under your name. ' + RULES + "</p>" +
          (name ? "" : '<label class="shi-f"><span>Your name</span><input type="text" data-shi-f="name" maxlength="24" autocomplete="nickname" placeholder="Pick a name" value="' + esc(T.name || "") + '"><small>Ideas show under your leaderboard name: keep it or change it. Or untick the box to keep this private.</small></label>') +
          '<label class="shi-f"><span>Title on the board</span><input type="text" data-shi-f="title" maxlength="80" value="' + esc(T.title || "") + '"></label>' +
          '<label class="shi-f"><span>Details on the board <i>(optional)</i></span><textarea data-shi-f="body" maxlength="280" rows="3">' + esc(T.body || "") + "</textarea></label>" +
          '<div class="shi-prevrow"><span class="shi-tag">For ' + esc(hubName) + '</span><label class="shi-pick"><span class="sr">Kind of idea</span><select data-shi-f="cat" aria-describedby="' + uid + 'k">' + kindOptions(T.cat) + "</select></label></div>" +
          '<p class="shi-prevnote" id="' + uid + 'k"></p>' +
        "</div>";
      hint(); drawn = true;
    }
    function hint(){ var k = host.querySelector("#" + uid + "k"), c = CATS.filter(function(x){ return x[0] === T.cat; })[0]; if (k) k.textContent = c ? c[2] + "." : ""; }
    function showPrev(){ var p = host.querySelector(".shi-prev"); if (p) p.hidden = !(T.on && !!tidy(text)); }
    host.addEventListener("change", function(e){
      if (e.target.matches('[data-shi-f="on"]')) { T.on = e.target.checked; showPrev(); }
      else if (e.target.matches('[data-shi-f="cat"]')) { T.cat = e.target.value; hint(); }
    });
    host.addEventListener("input", function(e){
      var k = e.target.getAttribute && e.target.getAttribute("data-shi-f");
      if (k === "title") { T.title = e.target.value; T.dirtyT = true; }
      else if (k === "body") { T.body = e.target.value; T.dirtyB = true; }
      else if (k === "name") T.name = e.target.value;
    });
    var api = {
      shown: function(){ return drawn; },
      on: function(){ return drawn && T.on && !!tidy(text); },
      sync: function(t){
        text = T.text = String(t || ""); fill();
        if (!drawn) return;
        var ti = f("title"), bo = f("body");
        if (ti && !T.dirtyT) ti.value = T.title; if (bo && !T.dirtyB) bo.value = T.body;
        showPrev();
      },
      check: function(){
        if (!api.on()) return "";
        if (!nameNow() && !tidy(T.name)) return "Pick a name to post it on the idea board, or untick the box.";
        var t = tidy(T.title);
        if (t.length < 3 || t.length > 80) return "Give the idea a title of 3 to 80 characters, or untick the box.";
        if (tidy(T.body).length > 280) return ERR["long"];
        if (!T.cat) return "Pick what kind of idea it is, or untick the box.";
        return "";
      },
      post: function(){
        if (!api.on()) return Promise.resolve({ ok: false, skipped: true });
        T.request = T.request || requestId();
        return send(sb, { title: tidy(T.title), body: tidy(T.body), hub: o.hub || null, category: T.cat, source: o.source || "suggest", newName: nameNow() ? "" : tidy(T.name), request: T.request }).then(function(r){
          if (r.ok) { T.request = null; T.dirtyT = T.dirtyB = false; boards.forEach(function(b){ b.reload(); }); }
          return r;
        });
      }
    };
    fill();
    up(sb).then(function(ok){ if (ok && host.isConnected) { draw(); } });
    return api;
  }

  /* one idea posted from somewhere else (Ask Timmy's drafted idea, widget/ask.js, which posts it as "board": the pending
     post_idea takes only board, suggest and checkin, and isn't changed; Sam, 2026-11-12): p { sb, title, body, hub, category,
     source, newName (a name to save first, for someone who hasn't picked one), request }; resolves { ok, id, name } or
     { ok: false, msg }. Every board on the page shows it. */
  function post(p){
    p = p || {};
    return send(p.sb || window.shSupabase || null, { title: tidy(p.title), body: tidy(p.body || ""), hub: p.hub || null, category: p.category, source: p.source || "board", newName: nameNow() ? "" : tidy(p.newName || ""), request: p.request || requestId() }).then(function(r){
      if (r.ok) boards.forEach(function(b){ b.reload(); });
      return r;
    });
  }

  window.shIdeas = { mount: mount, tick: tick, up: up, post: post, cats: CATS.map(function(c){ return { id: c[0], name: c[1], hint: c[2] }; }), statuses: STATUS };
})();
