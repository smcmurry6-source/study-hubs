/* Pure readiness and daily-plan logic. Keep this section free of hub and browser globals so Node can replay it. */
var BoardsPlan = (function(){
  var DEFAULT_STEPS = [1, 3, 7, 14, 30, 60, 120];
  var COG_PRIOR = { '1':0.75, '2':0.62, '3':0.50, L1:0.75, L2:0.62, L3:0.50 };

  function own(obj, key){ return !!obj && Object.prototype.hasOwnProperty.call(obj, key); }
  function objectMap(value){ return value && typeof value === 'object' ? value : {}; }
  function itemList(value){ return Array.isArray(value) ? value : []; }
  function finite(n){ return typeof n === 'number' && isFinite(n); }

  function priorFor(cog){ return own(COG_PRIOR, String(cog)) ? COG_PRIOR[String(cog)] : 0.62; }
  function difficulty(stat, cog){
    var prior = priorFor(cog), attempts = 0, correct = 0, acc;
    if(Array.isArray(stat)){
      attempts = Number(stat[0]) || 0;
      correct = Number(stat[1]) || 0;
    } else if(stat && typeof stat === 'object'){
      attempts = Number(stat.attempts != null ? stat.attempts : stat.total) || 0;
      correct = Number(stat.correct) || 0;
    }
    attempts = Math.max(0, attempts);
    correct = Math.max(0, Math.min(attempts, correct));
    acc = (correct + 2 * prior) / (attempts + 2);
    acc = Math.max(0.01, Math.min(0.99, acc));
    return { acc:acc, b:Math.log((1 - acc) / acc) };
  }

  function sigmoid(x){
    if(x > 35) return 1;
    if(x < -35) return 0;
    return 1 / (1 + Math.exp(-x));
  }

  function statFor(stats, qid){ return own(stats, qid) ? stats[qid] : null; }
  function itemFor(itemsById, qid){ return objectMap(itemsById)[qid] || {}; }
  function ability(events, itemsById, stats){
    var rows = itemList(events), theta = 0, i, event, q, diff, observed, weight, k;
    for(i = 0; i < rows.length; i++){
      event = rows[i] || {};
      q = itemFor(itemsById, event.qid);
      diff = difficulty(statFor(stats, event.qid), q.cog);
      observed = event.correct ? 1 : 0;
      weight = event.first ? (event.sibling ? 0.8 : 1) : 0.3;
      k = i < 40 ? 0.4 - (0.25 * i / 40) : 0.15;
      theta += k * weight * (observed - sigmoid(theta - diff.b));
    }
    return theta;
  }

  function dayOrdinal(value){
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    var year, month, day, y, before, monthDays, i, leap;
    if(!m) return null;
    year = Number(m[1]); month = Number(m[2]); day = Number(m[3]);
    if(month < 1 || month > 12 || day < 1 || day > 31) return null;
    y = year - 1;
    before = 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
    leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    for(i = 0; i < month - 1; i++) before += monthDays[i];
    if(day > monthDays[month - 1]) return null;
    return before + day - 1;
  }
  function daysBetween(later, earlier){
    var a = dayOrdinal(later), b = dayOrdinal(earlier);
    return a == null || b == null ? null : a - b;
  }

  function listItems(ctx){
    var all = itemList(ctx && ctx.items), released = [], seen = {};
    all.forEach(function(q){
      if(!q || !q.id || q.released === false || q.status === 'unreleased' || seen[q.id]) return;
      seen[q.id] = true;
      released.push(q);
    });
    return released;
  }
  function itemsById(items){
    var map = {};
    items.forEach(function(q){ map[q.id] = q; });
    return map;
  }
  function siblings(items){
    var first = {}, rank = {};
    items.forEach(function(q){
      var concept = q.concept ? String(q.lec || '') + '|' + String(q.concept) : '';
      if(!concept) { rank[q.id] = 0; return; }
      if(!own(first, concept)) first[concept] = q.id;
      rank[q.id] = first[concept] === q.id ? 0 : 1;
    });
    return rank;
  }
  function historyEvents(items, history, siblingRank){
    var rows = [], map = objectMap(history), order = 0;
    items.forEach(function(q){
      var h = map[q.id];
      if(!h) return;
      if(Array.isArray(h)){
        h.forEach(function(e){
          rows.push({ qid:q.id, correct:!!(e && e.correct), day:(e && (e.day || e.t)) || '', first:!!(e && e.first), sibling:!!siblingRank[q.id], order:order++ });
        });
      } else {
        var n = Number(h.n) || 1, day = h.day || h.t || '';
        var firstCorrect = h.first != null ? !!h.first : !!(h.correct != null ? h.correct : h.lastCorrect);
        var latestCorrect = h.lastCorrect != null ? !!h.lastCorrect : !!h.correct;
        rows.push({ qid:q.id, correct:firstCorrect, day:day, first:true, sibling:!!siblingRank[q.id], order:order++ });
        if(n > 1) rows.push({ qid:q.id, correct:latestCorrect, day:day, first:false, sibling:!!siblingRank[q.id], order:order++ });
      }
    });
    rows.sort(function(a, b){
      if(a.day < b.day) return -1;
      if(a.day > b.day) return 1;
      if(a.qid < b.qid) return -1;
      if(a.qid > b.qid) return 1;
      return a.order - b.order;
    });
    return rows;
  }
  function countSeen(items, history){
    var map = objectMap(history), count = 0;
    items.forEach(function(q){ if(own(map, q.id)) count++; });
    return count;
  }
  function caseSeen(items, cases, history){
    var caseIds = {}, seen = objectMap(history), total = 0, attempted = 0;
    itemList(cases).forEach(function(c){
      itemList(c && c.items).forEach(function(qid){ caseIds[qid] = true; });
    });
    items.forEach(function(q){
      if(q.case || caseIds[q.id]){
        total++;
        if(own(seen, q.id)) attempted++;
      }
    });
    return { total:total, seen:attempted };
  }

  function readiness(unit, ctx){
    ctx = ctx || {};
    var items = listItems(ctx), unitItems = items.filter(function(q){ return q.lec === unit; });
    var history = objectMap(ctx.history), stats = objectMap(ctx.stats), siblingRank = siblings(unitItems);
    var byId = itemsById(items), events = historyEvents(unitItems, history, siblingRank);
    var theta = ability(events, byId, stats), lastDay = '', i, eventDay, gap, thetaEff;
    var seen = countSeen(unitItems, history), likelyItems, total = unitItems.length, probabilities = [];
    var casesSeen, likely, coverage, band = null, caseThreshold;
    events.forEach(function(e){
      if(e.day && (!lastDay || e.day > lastDay)) lastDay = e.day;
    });
    gap = lastDay && ctx.day ? daysBetween(ctx.day, lastDay) : 0;
    if(gap == null || gap < 0) gap = 0;
    thetaEff = theta * Math.exp(-gap / 120);

    /* Average practiced items only: unseen additions change coverage, not likely. */
    likelyItems = unitItems.filter(function(q){ return own(history, q.id); });
    if(!likelyItems.length) likelyItems = unitItems;
    for(i = 0; i < likelyItems.length; i++){
      eventDay = difficulty(statFor(stats, likelyItems[i].id), likelyItems[i].cog);
      probabilities.push(sigmoid(thetaEff - eventDay.b));
    }
    likely = probabilities.length ? probabilities.reduce(function(sum, value){ return sum + value; }, 0) / probabilities.length : 0;
    coverage = seen / Math.max(1, total);
    if(coverage >= 0.10) band = 'Started';
    casesSeen = caseSeen(unitItems, ctx.cases, history);
    caseThreshold = Math.ceil(casesSeen.total / 2);
    if(coverage >= 0.70 && likely >= 0.75 && casesSeen.seen >= caseThreshold) band = 'Board-ready';
    else if(coverage >= 0.50 && likely >= 0.65) band = 'Solid';
    else if(coverage >= 0.25 && likely >= 0.55) band = 'Practicing';
    return { likely:likely, seen:seen, total:total, band:band };
  }

  function hash(value){
    var h = 2166136261, s = String(value), i;
    for(i = 0; i < s.length; i++){
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function tieRank(seed, id){ return hash(String(seed) + '|' + String(id)); }
  function sortSeeded(rows, seed, score){
    return rows.slice().sort(function(a, b){
      var av = score(a), bv = score(b);
      if(av !== bv) return bv - av;
      var ar = tieRank(seed, a.id), br = tieRank(seed, b.id);
      return ar === br ? (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0)) : ar - br;
    });
  }
  function isDue(entry, day){
    return !!(entry && entry.due && day && String(entry.due) <= String(day));
  }
  function srsSteps(budget){
    var raw = budget && Array.isArray(budget.steps) ? budget.steps : DEFAULT_STEPS;
    return raw.length ? raw : DEFAULT_STEPS;
  }
  function priority(q, entry, ctx){
    var due = daysBetween(ctx.day, entry.due), overdue = Math.max(0, due == null ? 0 : due);
    var diff = difficulty(statFor(ctx.stats, q.id), q.cog);
    var sure = objectMap(ctx.sureWrong)[q.id] ? 1 : 0;
    var classDifficulty = 1 - diff.acc;
    return (1 + Math.log(1 + overdue) / Math.LN2) * (1 + classDifficulty) * (1 + 0.5 * sure);
  }
  function stepDueOffset(entry, day){
    var diff = daysBetween(entry && entry.due, day);
    return diff == null ? null : Math.max(0, diff);
  }
  function nextStepInterval(b, steps){
    var ix = Math.max(0, Number(b) || 0);
    return steps[Math.min(ix, steps.length - 1)];
  }
  function projectExisting(srs, retired, day, steps){
    var loads = [0, 0, 0, 0, 0, 0, 0, 0], map = objectMap(srs);
    Object.keys(map).forEach(function(qid){
      var entry = map[qid], offset, b, next;
      if(objectMap(retired)[qid] || !entry || !entry.due) return;
      offset = stepDueOffset(entry, day);
      if(offset == null || offset > 7) return;
      b = Number(entry.b) || 0;
      while(offset <= 7){
        loads[offset]++;
        next = nextStepInterval(b, steps);
        offset += next;
        b = Math.min(steps.length, b + 1);
      }
    });
    return loads;
  }
  function projectedUnderGovernor(loads, budget, governor){
    var threshold = governor * budget, i;
    for(i = 0; i <= 7; i++) if(loads[i] >= threshold) return false;
    return true;
  }
  function appendPlan(q, plan, selected, caseCounts, limit){
    var caseId = q.case || '', current = caseId ? (caseCounts[caseId] || 0) : 0;
    if(selected[q.id] || plan.length >= limit || (caseId && current >= 3)) return false;
    selected[q.id] = true;
    plan.push(q.id);
    if(caseId) caseCounts[caseId] = current + 1;
    return true;
  }
  function dailyPlan(ctx){
    ctx = ctx || {};
    var items = listItems(ctx), srs = objectMap(ctx.srs), history = objectMap(ctx.history);
    var retired = objectMap(ctx.retired), finalReview = objectMap(ctx.finalReview), budget = objectMap(ctx.budget), steps = srsSteps(budget);
    var size = finite(Number(ctx.size)) ? Math.max(0, Math.floor(Number(ctx.size))) : (Number(budget.daily) || 12);
    var newPerDay = Number(budget.newPerDay);
    var governor = finite(Number(budget.governor)) ? Number(budget.governor) : 0.8;
    var sampleLimit = Math.max(0, Number(budget.retiredSamplePerMonth) || 0);
    var seed = ctx.seed == null ? ctx.day : ctx.seed;
    var retire = [], finalDue = [], finalClear = [], plan = [], selected = {}, caseCounts = {}, dueRows = [], loads, i, q;
    var candidate, sampleRows, samplesUsed = 0, newRows, newCounts = {}, conceptRank = siblings(items);
    var maxNew, projection, month;

    if(!ctx.day || !size) return { plan:plan, retire:retire, finalDue:finalDue, finalClear:finalClear };
    if(!finite(newPerDay) || newPerDay < 0) newPerDay = Number(budget.daily) || 12;

    items.forEach(function(item){
      var sr = srs[item.id], hist = history[item.id], days;
      if(finalReview[item.id] && sr && Number(sr.b) < steps.length) finalClear.push(item.id);
      if(retired[item.id]) return;
      if(finalReview[item.id] && Number(sr && sr.b) === steps.length && sr.t &&
         String(sr.t) >= String(finalReview[item.id]) && hist && hist.lastCorrect){
        retire.push(item.id);
        return;
      }
      if(!isDue(sr, ctx.day)) return;
      days = daysBetween(ctx.day, sr.due);
      dueRows.push({ id:item.id, q:item, entry:sr, days:Math.max(0, days || 0) });
    });
    dueRows = sortSeeded(dueRows, seed, function(row){ return priority(row.q, row.entry, ctx); });
    dueRows.forEach(function(row){
      if(appendPlan(row.q, plan, selected, caseCounts, size) && Number(row.entry.b) === steps.length) finalDue.push(row.id);
    });

    /* Sample retired items on the first plan of a new month, whichever date that is. */
    month = String(ctx.day).slice(0, 7);
    if(month && ctx.lastPlanMonth !== month && sampleLimit && plan.length < size){
      sampleRows = sortSeeded(items.filter(function(item){ return !!retired[item.id]; }).map(function(item){ return { id:item.id, q:item }; }), seed, function(){ return 0; });
      for(i = 0; i < sampleRows.length && samplesUsed < sampleLimit && plan.length < size; i++){
        candidate = sampleRows[i].q;
        if(appendPlan(candidate, plan, selected, caseCounts, size)) samplesUsed++;
      }
    }

    loads = projectExisting(srs, retired, ctx.day, steps);
    projection = loads.slice();
    /* A new question's first correct review is due tomorrow, then three days later. */
    maxNew = Math.min(Math.floor(newPerDay), size - plan.length);
    newRows = items.filter(function(item){
      return !item.case && !selected[item.id] && !retired[item.id] && !srs[item.id] && !history[item.id];
    });
    for(i = 0; i < maxNew && plan.length < size; i++){
      var eligible = sortSeeded(newRows, seed, function(row){
        var unitCount = newCounts[row.lec] || 0;
        return -unitCount * 10 - (conceptRank[row.id] || 0);
      });
      candidate = null;
      for(var j = 0; j < eligible.length; j++){
        q = eligible[j];
        var testLoads = projection.slice();
        testLoads[1]++; testLoads[4]++;
        if(projectedUnderGovernor(testLoads, Number(budget.daily) || size, governor)){
          candidate = q;
          projection = testLoads;
          break;
        }
      }
      if(!candidate) break;
      appendPlan(candidate, plan, selected, caseCounts, size);
      newCounts[candidate.lec] = (newCounts[candidate.lec] || 0) + 1;
      newRows = newRows.filter(function(row){ return row.id !== candidate.id; });
    }

    return { plan:plan, retire:retire, finalDue:finalDue, finalClear:finalClear };
  }

  return {
    difficulty:difficulty,
    ability:ability,
    readiness:readiness,
    dailyPlan:dailyPlan
  };
})();

/* Hub adapters: these are deliberately thin; all ranking and estimates stay in BoardsPlan above. */
var readiness, dailyPlan;
if(typeof STATE !== 'undefined'){
  var BOARDS_PLAN_CLASS_CACHE = {};
  var BOARDS_PLAN_CLASS_REQUESTED = {};

  var boardsPlanStats = function(){
    var out = {}, qids = [];
    Object.keys(BOARDS_PLAN_CLASS_CACHE).forEach(function(qid){
      var stat = BOARDS_PLAN_CLASS_CACHE[qid];
      out[qid] = [Number(stat.total) || 0, Number(stat.correct) || 0];
    });
    if(typeof window !== 'undefined' && typeof window.shGetClassStats === 'function'){
      QUESTIONS.forEach(function(q){
        if(!BOARDS_PLAN_CLASS_REQUESTED[q.id]){
          BOARDS_PLAN_CLASS_REQUESTED[q.id] = true;
          qids.push(q.id);
        }
      });
      if(qids.length){
        window.shGetClassStats(qids, function(byQid){
          Object.keys(byQid || {}).forEach(function(qid){
            if(byQid[qid]) BOARDS_PLAN_CLASS_CACHE[qid] = byQid[qid];
          });
        });
      }
    }
    return out;
  };

  var boardsPlanSrs = function(){
    try{
      if(typeof localStorage !== 'undefined') return JSON.parse(localStorage.getItem('sh_srs_boards') || '{}') || {};
    }catch(e){}
    return {};
  };

  var boardsPlanContext = function(opts){
    opts = opts || {};
    var day = opts.day || todayKey();
    var ui = STATE.ui || {};
    return {
      day:day,
      seed:day,
      items:QUESTIONS,
      cases:CASES,
      history:STATE.answered,
      srs:boardsPlanSrs(),
      stats:boardsPlanStats(),
      retired:STATE.retired,
      finalReview:ui.finalReview || {},
      lastPlanMonth:ui.planMonth || '',
      sureWrong:{},
      budget:CONFIG.budget,
      size:opts.size == null ? CONFIG.budget.daily : opts.size
    };
  };

  readiness = function(unit){
    return BoardsPlan.readiness(unit, boardsPlanContext({}));
  };

  dailyPlan = function(opts){
    opts = opts || {};
    var day = opts.day || todayKey();
    var size = opts.size == null ? CONFIG.budget.daily : Number(opts.size);
    var ui = STATE.ui = STATE.ui || {};
    var frozen = ui.plan;
    var ctx, result;
    if(frozen && frozen.day === day && frozen.size === size && Array.isArray(frozen.ids)) return frozen.ids;
    ctx = boardsPlanContext({ day:day, size:size });
    result = BoardsPlan.dailyPlan(ctx);
    ui.finalReview = ui.finalReview || {};
    result.plan.forEach(function(qid){
      if(STATE.retired[qid]) {
        delete STATE.retired[qid];
        delete ui.finalReview[qid];
      }
    });
    result.retire.forEach(function(qid){
      STATE.retired[qid] = ctx.day;
      delete ui.finalReview[qid];
    });
    result.finalClear.forEach(function(qid){
      delete ui.finalReview[qid];
    });
    result.finalDue.forEach(function(qid){
      if(!ui.finalReview[qid]) ui.finalReview[qid] = ctx.day;
    });
    ui.planMonth = String(ctx.day).slice(0, 7);
    ui.plan = { day:ctx.day, size:ctx.size, ids:result.plan.slice() };
    saveState();
    return ui.plan.ids;
  };
}
