/* ============ DAILY DRILL (loaded by widget/v3.js) ============
   A short set of questions each day, per hub, so what you've studied doesn't fade:
     1. questions due for spaced review (sh_srs_<hub>, kept by v3.js: a miss comes back the next
        day, a right answer after 1, 2, 4, then 7 days, never after the day before the exam), up to 6 of the 10;
     2. questions you missed before spaced review existed (your latest try on this device was wrong),
        up to 8 of the 10 together with (1);
     3. high-yield questions from lectures you've already studied: the ones the class gets wrong
        most (question_stats, 5+ attempts) and the ones the hub marks as high-yield (class quiz,
        exam-review guide...). No more than 3 from one lecture in this pass.
   Any shortfall is filled from what's left. The set is picked once a day and saved, so it doesn't
   change under you; "10 more" picks another set that skips everything already seen today.
   Length (survey round 2, 2026-10-20): 10, 20 or 30 questions; the day's first set is 10, or the length last picked in
   the old drill dialog (sh_drill_size), and the caps above scale with it (spaced review up to 60% of the set, misses 80%,
   30% per lecture). "More" offers another set in any of the three lengths.

   The hub supplies the questions and shows the set as a set of its Question Bank (#questions/drill, widget/hub-bank.js;
   the dashboard and #drill link there):
     window.SH_DRILL = {
       pool(): [{ id, lec, last: true | false | null (your latest try on this device),
                  hy: "" or why it's high-yield, e.g. "On the class quiz" }]
     }
     shDrill.set(cb): today's set, picked once and saved; shDrill.more(n, cb): n more that skip today's;
     shDrill.mark(qid, correct): an answer to one of its questions (widget/hub-rewards.js); shDrill.streak().

   This device only: sh_drill_<hub> = { day, items:[{id, why, note}], res:{qid: 1 | 0 | "s"},
   start (first item of the current set), done (the day's first set is finished) };
   sh_drill_days = { "YYYY-MM-DD": 1 } for the drill streak (a finished set in any hub counts). ============ */
(function(){
  if (window.shDrill) return;
  var SIZES = [10, 20, 30];
  function size(){ var n = 10; try { n = +localStorage.getItem("sh_drill_size") || 10; } catch (e) {} return SIZES.indexOf(n) >= 0 ? n : 10; }
  var H = null, HUB = "", KEY = "", DAYS_KEY = "sh_drill_days";
  var stats = null;

  function hook(){ var d = window.SH_DRILL; return d && typeof d.pool === "function" ? d : null; }
  function today(){ return H.day(0); }
  function lsGet(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function loadSet(){ var s = lsGet(KEY); return s && s.day === today() && Array.isArray(s.items) && s.items.length ? s : null; }
  function saveSet(s){ lsSet(KEY, s); }
  function pool(){ try { var p = hook().pool(); return Array.isArray(p) ? p.filter(function(x){ return x && x.id; }) : []; } catch (e) { return []; } }
  function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* the current set, minus any question that has left the bank since it was picked (res "x") */
  function round(s){ return s.items.slice(s.start || 0).filter(function(it){ return s.res[it.id] !== "x"; }); }
  function has(s, id){ var r = s.res[id]; return r === 1 || r === 0 || r === "s" || r === "x"; }
  function firstOpen(s){ for (var i = s.start || 0; i < s.items.length; i++) if (!has(s, s.items[i].id)) return i; return -1; }

  /* ---------- streak: consecutive days with a finished set, in any hub ---------- */
  function markDay(){
    var d = lsGet(DAYS_KEY) || {}; d[today()] = 1;
    var keys = Object.keys(d).sort(); while (keys.length > 120) delete d[keys.shift()];
    lsSet(DAYS_KEY, d);
  }
  function streak(){ var d = lsGet(DAYS_KEY) || {}, n = 0, off = d[today()] ? 0 : -1; while (d[H.day(off)]) { n++; off--; } return n; }

  /* ---------- class accuracy per question (anonymous totals, read once per page) ---------- */
  function loadStats(cb){
    if (stats || !H.supabase) { cb(); return; }
    var fired = false;
    function fin(){ if (!fired) { fired = true; cb(); } }
    setTimeout(fin, 2500);
    try {
      H.supabase.from("question_stats").select("qid,attempts,correct").eq("hub", HUB).then(function(res){
        var m = {}; ((res && res.data) || []).forEach(function(r){ m[r.qid] = r; });
        stats = m; fin();
      }, fin);
    } catch (e) { fin(); }
  }
  function acc(id){ var r = stats && stats[id]; return r && r.attempts >= 5 ? r.correct / r.attempts : null; }

  /* ---------- picking a set ---------- */
  function pick(n, skip){
    var P = pool(), srs = H.srs() || {}, t = today(), byId = {}, studied = {}, any = false;
    P.forEach(function(p){ byId[p.id] = p; if (p.last === true || p.last === false) { studied[p.lec] = 1; any = true; } });
    var due = Object.keys(srs).filter(function(id){ var r = srs[id]; return byId[id] && !skip[id] && r && r.due && r.due <= t; })
      .sort(function(a, b){ var x = srs[a], y = srs[b]; return x.due < y.due ? -1 : x.due > y.due ? 1 : (x.b || 0) - (y.b || 0); })
      .map(function(id){
        var b = srs[id].b || 0;
        return b ? { id: id, why: "due", note: "Spaced review: you got it right " + (b === 1 ? "last time" : "the last " + b + " times") }
                 : { id: id, why: "missed", note: "You missed this last time" };
      });
    var missed = shuffle(P.filter(function(p){ return p.last === false && !srs[p.id] && !skip[p.id]; }))
      .map(function(p){ return { id: p.id, why: "missed", note: "You missed this last time" }; });
    function hyItem(p){
      var a = acc(p.id);
      if (a !== null && a < .7) return { id: p.id, why: "hy", note: "High-yield: the class gets this right " + Math.round(a * 100) + "% of the time" };
      if (p.hy) return { id: p.id, why: "hy", note: "High-yield: " + p.hy };
      if (p.last === true) return { id: p.id, why: "fresh", note: "Keep it fresh: you got this right before" };
      return { id: p.id, why: "fresh", note: studied[p.lec] ? "Not tried yet, from a lecture you've studied" : "Not tried yet" };
    }
    function ranked(list){
      return list.map(function(p){ var a = acc(p.id); return { p: p, s: (a === null ? .22 : 1 - a) + (p.hy ? .2 : 0) + Math.random() * .15 }; })
        .sort(function(x, y){ return y.s - x.s; }).map(function(x){ return x.p; });
    }
    /* never in spaced review yet (those are either due above or scheduled for later) and not a known miss */
    var rest = P.filter(function(p){ return !skip[p.id] && !srs[p.id] && p.last !== false; });
    var near = ranked(rest.filter(function(p){ return !any || studied[p.lec]; }));
    var far = any ? ranked(rest.filter(function(p){ return !studied[p.lec]; })) : [];
    var perLec = {}, lecCap = Math.max(3, Math.round(n * .3)), spread = near.filter(function(p){ perLec[p.lec] = (perLec[p.lec] || 0) + 1; return perLec[p.lec] <= lecCap; });
    var out = [], used = {};
    function take(list, max){ for (var i = 0; i < list.length && out.length < max; i++) if (!used[list[i].id]) { used[list[i].id] = 1; out.push(list[i]); } }
    take(due, Math.round(n * .6));
    take(missed, Math.round(n * .8));
    take(spread.map(hyItem), n);
    take(due, n); take(missed, n); take(near.map(hyItem), n); take(far.map(hyItem), n);
    return shuffle(out);
  }

  /* the day's set is finished: count the day for the drill streak (once) */
  function finishCheck(s){
    if (firstOpen(s) >= 0) return;
    if (!s.done) { s.done = true; markDay(); }
  }
  window.shDrill = {
    set: function(cb){
      if (!H || !hook()) { cb(null); return; }
      var s = loadSet(); if (s) { cb(s); return; }
      loadStats(function(){
        var s2 = loadSet();
        if (!s2) { var items = pick(size(), {}); if (items.length) { s2 = { day: today(), items: items, res: {}, start: 0 }; saveSet(s2); } }
        cb(s2 || null);
      });
    },
    more: function(n, cb){
      if (!H || !hook()) { cb(null); return; }
      var s = loadSet(), skip = {}; if (!s) { this.set(cb); return; }
      s.items.forEach(function(it){ skip[it.id] = 1; });
      var items = pick(SIZES.indexOf(n) >= 0 ? n : size(), skip);
      if (!items.length) { cb(s); return; }
      s.start = s.items.length; s.items = s.items.concat(items); s.done = false; saveSet(s);
      try { if (window.shTrack) window.shTrack("drill:more=" + n); } catch (e) {}
      cb(s);
    },
    mark: function(qid, correct){
      var s = loadSet(); if (!s) return;
      var it = round(s).filter(function(x){ return x.id === String(qid); })[0];
      if (!it || s.res[it.id] === 1 || s.res[it.id] === 0) return;
      s.res[it.id] = correct ? 1 : 0; finishCheck(s); saveSet(s);
    },
    streak: function(){ return H ? streak() : 0; },
    mount: function(hooks){
      if (H || !hooks) return;
      H = hooks; HUB = hooks.hub; KEY = "sh_drill_" + HUB;
    }
  };
})();
