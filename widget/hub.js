'use strict';

/* Shared engine extracted mechanically from the four live hubs. The hub IIFE
 * binds its local configuration and content through shHubBind before invoking
 * any of these functions, so the legacy execution and rendering order remain
 * unchanged. */
window.shHubBind = function(scope){
  Object.keys(scope).forEach(function(key){
    var prior = Object.getOwnPropertyDescriptor(window, key);
    if (prior && !prior.configurable) return;
    Object.defineProperty(window, key, {
      configurable: true,
      enumerable: false,
      get: function(){ return scope[key]; },
      set: function(value){ scope[key] = value; }
    });
  });
};

/* The four extracted hubs keep their legacy variables inside an IIFE. shHubBind
 * exposes those bindings above, and this loader assigns parsed JSON back through
 * those accessors. Other hubs never call configure(), so this is inert for them.
 * JSON is the HTTP source of truth. Tiny JSONP companions are used only for a
 * local file:// copy, where Chromium blocks fetch() for file URLs. */
(function(){
  if(window.shHubContent) return;
  var st = { configured:false, base:'', manifest:null, manifestPromise:null, ready:null, promises:{}, loaded:{}, values:{}, receivers:{}, listeners:[] };
  var DATASETS = ['core','questions','whys','notes','review','study','cases','figures'];

  function own(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }
  function list(args){
    var out = [];
    Array.prototype.forEach.call(args, function(x){
      if(Array.isArray(x)) x.forEach(function(y){ if(y && out.indexOf(y) < 0) out.push(y); });
      else if(x && out.indexOf(x) < 0) out.push(x);
    });
    return out;
  }
  function url(file){ return new URL(file, st.base || document.baseURI).href; }
  function fallback(file, key){
    var m = st.manifest && st.manifest.fileFallbacks;
    if(m && m[key]) return url(m[key]);
    return url(String(file).replace(/\.json(?:[?#].*)?$/, '.js'));
  }
  function fetchJSON(file){
    return window.fetch(file, { credentials:'same-origin' }).then(function(res){
      if(!res || !res.ok) throw new Error('Could not load ' + file + ' (' + (res ? res.status : 'network error') + ')');
      return res.json();
    });
  }
  function scriptJSON(key, file){
    return new Promise(function(resolve, reject){
      var done = false, s = document.createElement('script');
      st.receivers[key] = function(value){ if(done) return; done = true; delete st.receivers[key]; resolve(value); };
      s.async = true; s.src = file;
      s.onload = function(){ if(!done){ done = true; delete st.receivers[key]; reject(new Error('Local fallback did not publish ' + key)); } };
      s.onerror = function(){ if(!done){ done = true; delete st.receivers[key]; reject(new Error('Could not load local fallback ' + file)); } };
      (document.head || document.documentElement).appendChild(s);
    });
  }
  function readJSON(key, file){
    if(location.protocol === 'file:') return scriptJSON(key, fallback(file, key));
    return fetchJSON(file);
  }
  function put(name, value){ window[name] = value; }
  function get(name, fallbackValue){
    try { return typeof window[name] === 'undefined' ? fallbackValue : window[name]; }
    catch(e){ return fallbackValue; }
  }
  function refreshIndexes(){
    var lectures = Array.isArray(get('LECTURES', [])) ? get('LECTURES', []) : [];
    var questions = Array.isArray(get('QUESTIONS', [])) ? get('QUESTIONS', []) : [];
    var why = get('QUESTION_WHY', {}) || {}, byLec = {}, byId = {}, byLecture = {};
    lectures.forEach(function(l){ if(l && l.id){ byLec[l.id] = l; byLecture[l.id] = []; } });
    questions.forEach(function(q){
      if(!q || !q.id) return;
      if(why[q.id]) q.why = why[q.id];
      byId[q.id] = q; (byLecture[q.lec] = byLecture[q.lec] || []).push(q);
    });
    put('LECTURE_BY_ID', byLec); put('QUESTIONS_BY_ID', byId); put('QUESTIONS_BY_LECTURE', byLecture);
  }
  function applyLikely(){
    var questions = Array.isArray(get('QUESTIONS', [])) ? get('QUESTIONS', []) : [];
    var topics = Array.isArray(get('LIKELY_TOPICS', [])) ? get('LIKELY_TOPICS', []) : [], byId = {};
    questions.forEach(function(q){ if(q && q.id){ delete q.likely; byId[q.id] = q; } });
    topics.forEach(function(topic){ (topic.ids || []).forEach(function(id){ if(byId[id]) byId[id].likely = topic; }); });
  }
  function notify(name, value){ st.listeners.slice().forEach(function(fn){ try { fn(name, value); }catch(e){} }); }
  function hydrate(name, data){
    data = data || {};
    if(name === 'core'){
      put('LECTURES', data.lectures || []); put('EXAM_INFO', data.examInfo || []); put('COURSE_DATES', data.courseDates || []);
      put('MOCK_BLUEPRINT', data.mockBlueprint || {}); put('MOCK_MULTI', data.mockMulti == null ? null : data.mockMulti);
      put('MOCK_LIMIT', data.mockLimit == null ? null : data.mockLimit); put('EXAM_COUNTS', data.examCounts || {});
      put('SRC_LABEL', data.sourceLabels || {}); put('DRILL_HY', data.drillHighYield || {});
      /* Home needs progress counts and the drill needs id/lecture/source, not stems or choices. */
      put('QUESTIONS', data.questionIndex || []); refreshIndexes(); applyLikely();
    } else if(name === 'questions'){
      put('QUESTIONS', data.questions || []); refreshIndexes(); applyLikely();
    } else if(name === 'whys'){
      put('QUESTION_WHY', data.questionWhy || {}); refreshIndexes();
    } else if(name === 'notes'){
      put('READINGS', data.readings || {}); put('READINGS_PLAIN', data.readingsPlain || {}); put('NOTE_TABLES', data.noteTables || {});
    } else if(name === 'review'){
      put('REVIEW', data.review || []); put('SEQUENCES', data.sequences || []); put('SORT_SETS', data.sortSets || []); put('CASE_SETS', data.caseSets || {});
    } else if(name === 'study'){
      put('HINTS', data.hints || []); put('CRAM', data.cram || {}); put('LIKELY_TOPICS', data.likelyTopics || []); applyLikely();
    } else if(name === 'cases'){
      put('CASES', data.cases || {}); put('PCASES', data.patientCases || {});
    } else if(name === 'figures'){
      put('FIGS', data.FIGS || {}); put('FIG_PLACE', data.FIG_PLACE || {}); put('FIG_BY_LEC', data.FIG_BY_LEC || {}); put('CASE_IMG', data.CASE_IMG || {});
    }
  }
  function asset(a){
    if(typeof a === 'string') a = { src:a };
    if(!a || !(a.src || a.href)) return Promise.resolve();
    return new Promise(function(resolve, reject){
      var src = a.src || a.href, type = a.type || (/\.css(?:[?#]|$)/i.test(src) ? 'style' : 'script');
      var tag = document.createElement(type === 'style' ? 'link' : 'script');
      if(type === 'style'){ tag.rel = 'stylesheet'; tag.href = url(src); }
      else { tag.src = url(src); tag.async = false; }
      tag.onload = function(){ resolve(); }; tag.onerror = function(){ reject(new Error('Could not load figure asset ' + src)); };
      (document.head || document.documentElement).appendChild(tag);
    });
  }
  function figureAssets(){ return Promise.all(((st.manifest && st.manifest.figureAssets) || []).map(asset)); }
  function load(name){
    if(!DATASETS.includes(name)) return Promise.reject(new Error('Unknown hub content set: ' + name));
    if(own(st.loaded, name)) return Promise.resolve(st.values[name]);
    if(st.promises[name]) return st.promises[name];
    st.promises[name] = st.manifestPromise.then(function(manifest){
      var file = manifest.files && manifest.files[name];
      if(!file) throw new Error('Content manifest has no file for ' + name);
      return readJSON(name, url(file)).then(function(data){
        hydrate(name, data);
        return name === 'figures' ? figureAssets().then(function(){ return data; }) : data;
      });
    }).then(function(data){
      st.loaded[name] = true; st.values[name] = data; notify(name, data); return data;
    });
    return st.promises[name];
  }
  function modeSets(mode){
    var ui = (get('STATE', {}) || {}).ui || {}, sub = ui.sub || 'notes';
    if(mode === 'compendium'){
      if(sub === 'notes') return ['notes','figures'];
      if(sub === 'bank') return ['questions','whys','cases','figures','review','study'];
      if(sub === 'mock') return ['questions','whys','cases','figures','review','study'];
      if(sub === 'weak') return ['questions','whys','cases','figures','review','study'];
      if(sub === 'hints' || sub === 'cram') return ['study'];
      return ['study'];
    }
    if(mode === 'review') return ['review','figures'];
    if(mode === 'arcade') return ['questions','whys','review','cases','figures','notes'];
    return [];
  }
  function modeReady(mode){ return modeSets(mode).every(function(name){ return !!st.loaded[name]; }); }
  function ensureForMode(mode){ return api.ensure(modeSets(mode)); }
  function guard(name, mode){
    var original = get(name, null);
    if(typeof original !== 'function' || original.__shContentGuard) return;
    function wrapped(){
      var self = this, args = arguments;
      if(!modeReady(mode)){
        ensureForMode(mode).then(function(){ wrapped.apply(self, args); }, api.report);
        return;
      }
      return original.apply(self, args);
    }
    wrapped.__shContentGuard = true;
    put(name, wrapped);
  }
  function configure(options){
    if(st.configured) return st.ready;
    options = options || {}; st.configured = true; st.base = new URL(options.base || 'content/', document.baseURI).href;
    var manifestFile = options.manifest || 'manifest.json';
    st.manifestPromise = readJSON('@manifest', url(manifestFile)).then(function(manifest){
      if(!manifest || manifest.format !== 1 || !manifest.files) throw new Error('Invalid hub content manifest');
      st.manifest = manifest; return manifest;
    });
    st.ready = st.manifestPromise.then(function(){ return load('core'); });
    window.SH_CONTENT_READY = st.ready;
    /* review/ loads ?sh_export=1 in a hidden frame. That frame has no user
       view to keep lean, but its established export contract includes full
       question text and choices, so make its readiness explicit. */
    window.SH_EXPORT_READY = /(?:^|[?&])sh_export=1(?:[&#]|$)/.test(location.search)
      ? st.ready.then(function(){ return api.ensure('questions'); })
      : st.ready;
    return st.ready;
  }
  var api = window.shHubContent = {
    configure: configure,
    ensure: function(){ var names = list(arguments); return Promise.all(names.map(load)); },
    loaded: function(name){ return !!st.loaded[name]; },
    modeReady: modeReady, ensureForMode: ensureForMode,
    guardViews: function(){ guard('renderCompendium', 'compendium'); guard('renderReview', 'review'); },
    on: function(fn){ if(typeof fn === 'function') st.listeners.push(fn); return fn; },
    receive: function(name, value){ var done = st.receivers[name]; if(done) done(value); },
    report: function(error){ if(window.console && window.console.error) window.console.error('Hub content failed to load', error); }
  };
  /* A drill card needs a complete question, not the compact Home index. Returning
   * true keeps the drill open while the real card replaces this short loader. */
  api.renderQuestion = function(el, draw){
    if(api.loaded('questions') && api.loaded('whys') && api.loaded('cases') && api.loaded('review') && api.loaded('study') && api.loaded('figures')) return draw();
    if(el) el.innerHTML = '<p class="rv-empty">Loading question…</p>';
    api.ensure('questions', 'whys', 'cases', 'review', 'study', 'figures').then(function(){ if(el && el.isConnected) draw(); }, api.report);
    return true;
  };
  /* v3 registers its input handler later. Capture it here so a first search
   * waits for its complete, locally searchable content instead of returning a
   * misleading empty result while a JSON fetch is still in flight. */
  var pendingSearch = null;
  document.addEventListener('input', function(e){
    var input = e.target;
    if(!input || input.id !== 'shstat-search-input' || !st.configured || pendingSearch || (api.loaded('questions') && api.loaded('notes') && api.loaded('review') && api.loaded('study'))) return;
    e.stopImmediatePropagation(); pendingSearch = input;
    api.ensure('questions','whys','notes','review','study','cases','figures').then(function(){
      var replay = pendingSearch; pendingSearch = null;
      if(replay && replay.isConnected) replay.dispatchEvent(new Event('input', { bubbles:true }));
    }, function(error){ pendingSearch = null; api.report(error); });
  }, true);
})();

/* sh:engine-start */
function icon(name, cls){
  var p = ICON_PATHS[name]; if(!p) return '';
  return '<svg class="ic'+(cls?' '+cls:'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
}

function pixelHeart(){
  var rows = ['0110110','1111111','1111111','0111110','0011100','0001000'], r = '';
  rows.forEach(function(row, y){ for(var x=0;x<7;x++) if(row[x]==='1') r += '<rect x="'+x+'" y="'+y+'" width="1" height="1"/>'; });
  return '<svg class="ic px-heart" viewBox="0 0 7 6" aria-hidden="true" fill="currentColor" shape-rendering="crispEdges">'+r+'</svg>';
}

function mcq(id, lec, src, stem, choices, ex, extra){ var q = { id:id, lec:lec, type:'mcq', stem:stem, choices:choices, answer:0, ex:ex||'', src:src }; if(extra) Object.keys(extra).forEach(function(k){ q[k] = extra[k]; }); QUESTIONS.push(q); }

function seq(id, lec, src, stem, steps, ex, extra){ var q = { id:id, lec:lec, type:'sequence', stem:stem, steps:steps, ex:ex||'', src:src }; if(extra) Object.keys(extra).forEach(function(k){ q[k] = extra[k]; }); QUESTIONS.push(q); }

function match(id, lec, src, stem, pairs, ex, extra){ var q = { id:id, lec:lec, type:'match', stem:stem, pairs:pairs, ex:ex||'', src:src }; if(extra) Object.keys(extra).forEach(function(k){ q[k] = extra[k]; }); QUESTIONS.push(q); }

function multi(id, lec, src, stem, choices, correct, ex, extra){ var q = { id:id, lec:lec, type:'multi', stem:stem, choices:choices, correct:correct, ex:ex||'', src:src }; if(extra) Object.keys(extra).forEach(function(k){ q[k] = extra[k]; }); QUESTIONS.push(q); }

function two(id, lec, src, s1, s2, t1, t2, ex, r1, r2, extra){
  var claims = [[true,true],[false,false],[true,false],[false,true]], tv = function(b){ return b ? 'true' : 'false'; };
  var why = claims.map(function(c){
    if(c[0] === t1 && c[1] === t2) return 'Statement 1 is ' + tv(t1) + ': ' + r1 + ' Statement 2 is ' + tv(t2) + ': ' + r2;
    var out = [];
    if(c[0] !== t1) out.push('Statement 1 is ' + tv(t1) + ', not ' + tv(c[0]) + ': ' + r1);
    if(c[1] !== t2) out.push('Statement 2 is ' + tv(t2) + ', not ' + tv(c[1]) + ': ' + r2);
    return out.join(' ');
  });
  mcq(id, lec, src, 'Read the two statements.\n1. ' + s1 + '\n2. ' + s2, TWO_CHOICES.slice(), ex, extra);
  var q = QUESTIONS[QUESTIONS.length - 1]; q.fmt = '2stmt'; q.answer = claims.findIndex(function(c){ return c[0] === t1 && c[1] === t2; }); q.why = why;
}

function tf(id, lec, src, statement, isTrue, ex, whyTrue, whyFalse, extra){
  mcq(id, lec, src, 'True or false: ' + statement, ['True','False'], ex, extra);
  var q = QUESTIONS[QUESTIONS.length - 1]; q.fmt = 'tf'; q.answer = isTrue ? 0 : 1; q.why = [whyTrue, whyFalse];
}

function numList(set){ return set.length === 1 ? String(set[0]) : set.slice(0, -1).join(', ') + ' and ' + set[set.length - 1]; }

function numLabel(set){ return set.length === 1 ? set[0] + ' only' : set.length === 2 ? set[0] + ' and ' + set[1] + ' only' : numList(set); }

function nums(id, lec, src, lead, stmts, truth, wrong, ex, reasons, extra){
  var right = [], falses = [];
  truth.forEach(function(t, i){ (t ? right : falses).push(i + 1); });
  var sets = [right].concat(wrong).sort(function(a, b){
    for(var i = 0; i < Math.min(a.length, b.length); i++) if(a[i] !== b[i]) return a[i] - b[i];
    return a.length - b.length;
  });
  var why = sets.map(function(set){
    if(set === right) return (falses.length ? (right.length === 1 ? 'Only statement ' + right[0] + ' is true. ' : 'Statements ' + numList(right) + ' are true. ') +
      falses.map(function(k){ return 'Statement ' + k + ' is false: ' + reasons[k - 1]; }).join(' ') : 'All ' + truth.length + ' statements are true.');
    var out = [];
    set.forEach(function(k){ if(!truth[k - 1]) out.push('It includes ' + k + ', which is false: ' + reasons[k - 1]); });
    right.forEach(function(k){ if(set.indexOf(k) < 0) out.push('It leaves out ' + k + ', which is true: ' + reasons[k - 1]); });
    return out.join(' ');
  });
  mcq(id, lec, src, lead + '\n' + stmts.map(function(t, i){ return (i + 1) + '. ' + t; }).join('\n'), sets.map(numLabel), ex, extra);
  var q = QUESTIONS[QUESTIONS.length - 1]; q.fmt = 'numbered'; q.answer = sets.indexOf(right); q.why = why;
}

function lecLabel(l){ return l.label || ('L' + l.num); }

function choiceOrder(q){ var idx = q.choices.map(function(c,i){ return i; }); return q.fmt === '2stmt' || q.fmt === 'tf' || q.fmt === 'numbered' ? idx : shuffled(idx); }

function shuffled(arr){ var a = arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

function tagOf(lecId){ var l = LECTURE_BY_ID[lecId]; return l ? l.tag : 'blue'; }

function lecChip(lecId){ var l = LECTURE_BY_ID[lecId]; if(!l) return ''; return '<span class="lec-chip tag-'+l.tag+'">'+lecLabel(l)+' · '+escHtml(l.title.split(':')[0].split(',')[0])+'</span>'; }

function todayStr(){ var d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

function toast(msg, ic){ var host = document.getElementById('toastHost'); if(!host) return; var t = document.createElement('div'); t.className='toast'; t.innerHTML = (ic ? icon(ic) : '') + '<span>' + escHtml(msg) + '</span>'; host.appendChild(t); setTimeout(function(){ t.remove(); }, 2600); }

function loadState(){
  var base = defaultState();
  try{
    var raw = localStorage.getItem(STATE_KEY);
    if(raw){
      var s = JSON.parse(raw);
      Object.keys(s).forEach(function(k){
        if(s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])){
          Object.keys(s[k]).forEach(function(k2){
            if(s[k][k2] && typeof s[k][k2]==='object' && !Array.isArray(s[k][k2]) && base[k][k2] && typeof base[k][k2]==='object') base[k][k2] = Object.assign(base[k][k2], s[k][k2]);
            else base[k][k2] = s[k][k2];
          });
        } else base[k] = s[k];
      });
    }
  }catch(e){ /* storage unavailable */ }
  return base;
}

function saveState(){ try{ localStorage.setItem(STATE_KEY, JSON.stringify(STATE)); }catch(e){ /* storage unavailable */ } }

function checkAchievements(){
  ACHIEVEMENTS.forEach(function(a){
    if(STATE.ach[a.id]) return;
    var c = a.cond, ok = false;
    if(c.type === 'totalCorrect') ok = STATE.totalCorrect >= c.n;
    else if(c.type === 'streak') ok = STATE.streak >= c.n;
    else if(c.type === 'lecPct'){ var st = STATE.lecStats[c.lec]; ok = !!(st && st.a >= c.min && (st.c / st.a) * 100 >= c.pct); }
    else if(c.type === 'allSeen') ok = QUESTIONS.every(function(q){ return STATE.seen[q.id]; });
    if(ok){ STATE.ach[a.id] = todayStr(); toast('Achievement: ' + a.name, a.icon); }
  });
}

function dayStreak(){
  var set = {}; STATE.days.forEach(function(d){ set[d] = 1; });
  var n = 0, d = new Date();
  var k0 = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(!set[k0]) d.setDate(d.getDate()-1); /* not studied yet today: the streak is still alive from yesterday */
  for(;;){ var k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); if(set[k]){ n++; d.setDate(d.getDate()-1); } else break; }
  return n;
}

function calDays(now, ymd){ return Math.round((new Date(ymd + 'T00:00:00') - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5); }

function likelyChip(q){ return q.likely ? '<span class="likely-chip" title="Predicted topic: '+escHtml(q.likely.t)+' ('+escHtml(q.likely.basis)+')">'+icon('target')+'High Likelihood Exam Question</span>' : ''; }

function figHTML(q){ var f = q.img && !q.imgAfter && FIGS[q.img]; return f ? '<figure class="qcard-figure" aria-label="'+escHtml(f.title)+'">'+f.svg+'</figure>' : ''; }

function figKeyHTML(f, open){ return f.key ? '<details class="fig-key"'+(open?' open':'')+'><summary>'+(open?'Key':'Show the key')+'</summary><dl>' + f.key.map(function(k){ return '<dt>'+escHtml(k[0])+'</dt><dd>'+escHtml(k[1])+'</dd>'; }).join('') + '</dl></details>' : ''; }

function figAfterHTML(q){ var f = q.img && FIGS[q.img]; return f && (q.imgAfter || f.key) ? '<figure class="qcard-figure qcard-figure-after" aria-label="'+escHtml(f.title)+'">'+f.svg+figKeyHTML(f, true)+'</figure>' : ''; }

function figCardHTML(key){ if(key === 'cuspMap') return cuspMapHTML(1); if(ANIMA.meta(key)) return '<div class="fig-anima">' + ANIMA.html(key) + '</div>'; var f = FIGS[key]; return f ? '<figure class="fig-card"><h4>'+escHtml(f.title)+'</h4>'+f.svg+'<p>'+escHtml(f.caption)+'</p>'+figKeyHTML(f)+'</figure>' : ''; }

function caseSet(key){
  if(!CASE_SETS){ CASE_SETS = {}; QUESTIONS.forEach(function(q){ if(q.pcase) (CASE_SETS[q.pcase] = CASE_SETS[q.pcase] || []).push(q.id); }); }
  return CASE_SETS[key] || [];
}

function multiScore(q, picks){ var hit = picks.filter(function(i){ return q.correct.indexOf(i) > -1; }).length; return Math.max(0, (hit - (picks.length - hit)) / q.correct.length); }

function whyHTML(q, picks){
  if(!q.why || !q.choices) return '';
  var ok = function(i){ return q.type === 'multi' ? q.correct.indexOf(i) > -1 : i === q.answer; };
  var idx = q.choices.map(function(c,i){ return i; }).sort(function(a,b){ return (ok(b)?1:0) - (ok(a)?1:0) || a - b; });
  return '<details class="qx-why" open><summary>Why each choice</summary><ul>' + idx.map(function(i){
    var p = picks && picks.indexOf(i) > -1;
    return '<li class="'+(ok(i)?'is-right':'is-wrong')+(p?' is-picked':'')+'" data-why-idx="'+i+'"><span class="qx-why-mark" aria-hidden="true">'+(ok(i)?'✓':'✗')+'</span><span><b>'+escHtml(q.choices[i])+'</b>'+(p?'<em class="qx-why-you"> your pick</em>':'')+'<br>'+escHtml(q.why[i])+'</span></li>';
  }).join('') + '</ul></details>';
}

function cueHTML(q){ return q.cue ? '<div class="qx-cue" data-role="cue">'+icon('bulb')+'<b>Remember it:</b> '+escHtml(q.cue)+'</div>' : ''; }

function finishCard(card, correct){
  card.classList.add('is-answered'); if(!correct) card.classList.add('is-missed');
  var v = card.querySelector('.qcard-verdict'); if(v){ v.textContent = correct ? 'Correct.' : 'Not quite.'; v.className = 'qcard-verdict ' + (correct ? 'ok' : 'bad'); }
  var q = QUESTIONS_BY_ID[card.getAttribute('data-qid')];
  var pk = card.getAttribute('data-pick'), pks = card.getAttribute('data-picks');
  if(q) recordAnswer(q.id, q.lec, correct, card.getAttribute('data-ctx') || 'bank', pk === null ? null : +pk, pks ? pks.split(',').map(Number) : null);
  if(card.classList.contains('is-retry') && window.shTrack) window.shTrack('bank:retry-' + (correct ? 'right' : 'missed'));
  var host = card.parentNode; if(q && !correct && host && host.__retry) host.__retry(card, q);
}

function wireQuestionContainer(container){
  if(container.__wired) return; container.__wired = true;
  container.addEventListener('click', function(e){
    var btn = e.target.closest('button[data-act]'); if(!btn || btn.disabled) return;
    var card = btn.closest('.qcard'); if(!card || card.classList.contains('is-answered')) return;
    var q = QUESTIONS_BY_ID[card.getAttribute('data-qid')]; if(!q) return;
    var rid = card.getAttribute('data-rid');
    var act = btn.getAttribute('data-act');
    if(act === 'mcq'){
      var ok = btn.getAttribute('data-answer') === '1';
      card.querySelectorAll('.qcard-choice').forEach(function(b){ b.disabled = true; if(b.getAttribute('data-answer') === '1') b.classList.add('is-correct'); });
      if(!ok) btn.classList.add('is-wrong');
      card.setAttribute('data-pick', btn.getAttribute('data-idx'));
      finishCard(card, ok);
    } else if(act === 'multi'){
      var mst = MULTI_STATE[rid]; if(!mst) return;
      var mi = +btn.getAttribute('data-multi-idx'), at = mst.picks.indexOf(mi);
      if(at > -1){ mst.picks.splice(at, 1); btn.classList.remove('is-selected'); btn.setAttribute('aria-pressed','false'); }
      else { mst.picks.push(mi); btn.classList.add('is-selected'); btn.setAttribute('aria-pressed','true'); }
    } else if(act === 'multi-check'){
      var mc = MULTI_STATE[rid]; if(!mc) return;
      if(!mc.picks.length){ btn.textContent = 'Pick at least one'; return; }
      var sc = multiScore(q, mc.picks);
      card.querySelectorAll('[data-act="multi"]').forEach(function(b){
        b.disabled = true; b.classList.remove('is-selected');
        var bi = +b.getAttribute('data-multi-idx'), isC = q.correct.indexOf(bi) > -1, was = mc.picks.indexOf(bi) > -1;
        if(isC && was) b.classList.add('is-correct'); else if(isC) b.classList.add('is-missed-right'); else if(was) b.classList.add('is-wrong');
      });
      var wrapC = card.querySelector('[data-role="multi-check"]'); if(wrapC) wrapC.innerHTML = '<span class="multi-score">Partial credit: '+Math.round(sc*100)+'%. Dashed = a right answer you missed.</span>';
      card.setAttribute('data-picks', mc.picks.join(','));
      finishCard(card, sc === 1);
    } else if(act === 'seq-undo' || act === 'seq-clear'){
      var us = SEQ_STATE[rid]; if(!us) return;
      var drop = act === 'seq-clear' ? us.picks.splice(0) : us.picks.splice(-1);
      drop.forEach(function(i){ var b = card.querySelector('[data-act="seq"][data-step-idx="'+i+'"]'); if(!b) return; b.disabled = false; b.classList.remove('is-picked'); var o = b.querySelector('.ord'); if(o) o.remove(); });
      var ut = card.querySelector('[data-role="seq-tools"]'); if(ut) ut.hidden = !us.picks.length;
    } else if(act === 'seq'){
      var st = SEQ_STATE[rid]; if(!st) return;
      st.picks.push(+btn.getAttribute('data-step-idx'));
      btn.disabled = true; btn.classList.add('is-picked');
      btn.insertAdjacentHTML('afterbegin', '<span class="ord">'+st.picks.length+'</span>');
      var tools = card.querySelector('[data-role="seq-tools"]'); if(tools) tools.hidden = false;
      if(st.picks.length === q.steps.length){
        var good = st.picks.every(function(v,i){ return v === i; }), inPlace = st.picks.filter(function(v,i){ return v === i; }).length;
        card.querySelectorAll('[data-act="seq"]').forEach(function(b){ var i = +b.getAttribute('data-step-idx'); var pos = st.picks.indexOf(i); b.classList.remove('is-picked'); b.classList.add(pos === i ? 'is-correct' : 'is-wrong'); });
        finishCard(card, good);
        var sv = card.querySelector('.qcard-verdict'); if(sv && !good) sv.textContent = 'Not quite: ' + inPlace + ' of ' + q.steps.length + ' in the right spot.';
      }
    } else if(act === 'match'){
      var ms = MATCH_STATE[rid]; if(!ms || btn.classList.contains('is-matched')) return;
      var side = btn.getAttribute('data-side');
      if(side === 'left'){ card.querySelectorAll('.qcard-match-item[data-side="left"]').forEach(function(b){ b.classList.remove('is-selected'); }); btn.classList.add('is-selected'); ms.sel = +btn.getAttribute('data-pair-idx'); return; }
      if(ms.sel === null) return;
      var r = +btn.getAttribute('data-pair-idx');
      var leftBtn = card.querySelector('.qcard-match-item[data-side="left"][data-pair-idx="'+ms.sel+'"]');
      if(r === ms.sel){
        btn.classList.add('is-matched'); leftBtn.classList.add('is-matched'); leftBtn.classList.remove('is-selected'); btn.disabled = true; leftBtn.disabled = true;
        ms.matched++; ms.sel = null;
        if(ms.matched === q.pairs.length) finishCard(card, ms.errors === 0);
      } else {
        ms.errors++; btn.classList.remove('is-wrong'); void btn.offsetWidth; btn.classList.add('is-wrong');
      }
    }
  });
}

var SH_MODE_REQUEST = 0;
function setMode(mode){
  var request = ++SH_MODE_REQUEST;
  /* Extracted hubs keep Home on a compact question index. Do not reveal a
   * content-dependent view until its deferred data is ready; legacy hubs have
   * no configured loader and continue straight through. */
  var content = window.shHubContent;
  if(content && typeof content.modeReady === 'function' && !content.modeReady(mode)){
    content.ensureForMode(mode).then(function(){ if(request === SH_MODE_REQUEST) setMode(mode); }, content.report);
    return;
  }
  if(window.shTTS) window.shTTS.stop();
  STATE.ui.mode = mode; saveState();
  document.querySelectorAll('#modeSwitch [data-mode]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-mode') === mode ? 'true' : 'false'); });
  document.querySelectorAll('[data-mode-panel]').forEach(function(p){ p.hidden = p.getAttribute('data-mode-panel') !== mode; });
  if(mode !== 'arcade' && typeof ARCADE !== 'undefined') ARCADE.stopAll();
  if(mode !== 'home') clearInterval(homeTimer);
  if(mode === 'home') renderHome();
  else if(mode === 'compendium') renderCompendium();
  else if(mode === 'review') renderReview();
  else if(mode === 'arcade') ARCADE.renderLobby();
  window.scrollTo(0,0);
}

function lecProgress(l){
  var qs = QUESTIONS_BY_LECTURE[l.id] || [], tried = 0, right = 0, missed = 0;
  qs.forEach(function(q){ var s = STATE.seen[q.id]; if(s){ tried++; if(s.last) right++; else missed++; } });
  var st = STATE.lecStats[l.id] || { a:0, c:0 };
  return { l:l, total:qs.length, tried:tried, right:right, missed:missed, a:st.a, pct: st.a ? Math.round(st.c / st.a * 100) : null };
}

function ringSVG(pct){
  var r = 34, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return '<svg class="hh-ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="' + r + '" class="hh-ring-bg"/><circle cx="42" cy="42" r="' + r + '" class="hh-ring-fg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/><text x="42" y="47" text-anchor="middle">' + pct + '%</text></svg>';
}

function homeTimelineHTML(){
  var today = todayStr();
  return '<div class="home-card"><h3>' + icon('calendar') + 'Course timeline</h3><ol class="home-tl">' + COURSE_DATES.map(function(e){
    var when = e.date < today ? 'past' : e.date === today ? 'today' : 'future';
    var d = new Date(e.date + 'T12:00:00'), lab = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
    return '<li class="tl-' + when + (e.kind ? ' tl-' + e.kind : '') + '"><span class="tl-date">' + lab + (when === 'today' ? ' · today' : '') + '</span><span class="tl-what">' + escHtml(e.label) + '</span></li>';
  }).join('') + '</ol></div>';
}

function homeDaysHTML(){
  var set = {}; STATE.days.forEach(function(d){ set[d] = 1; });
  var cells = '', d = new Date(); d.setDate(d.getDate() - 13);
  for(var i = 0; i < 14; i++){
    var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    cells += '<span class="hd-day' + (set[k] ? ' on' : '') + (i === 13 ? ' today' : '') + '" title="' + d.toLocaleDateString('en-US', { month:'short', day:'numeric' }) + (set[k] ? ': studied' : '') + '"></span>';
    d.setDate(d.getDate() + 1);
  }
  var n = dayStreak();
  return '<div class="home-card"><h3>' + icon('clock') + 'Your last two weeks</h3><div class="home-days" aria-label="Days you answered questions in this hub, the last 14 days">' + cells + '</div>' +
    '<p class="hc-note">' + (n > 1 ? '<b>' + n + '-day streak.</b> ' : '') + STATE.totalAnswered + ' answers so far, ' + STATE.bestStreak + ' right in a row at best.</p></div>';
}

function examInfoHTML(){ return '<dl class="exam-info">' + EXAM_INFO.map(function(r){ return '<dt>'+r[0]+'</dt><dd>'+escHtml(r[1])+'</dd>'; }).join('') + '</dl>'; }

function mindMapFor(lec){
  var d = document.createElement('div'); d.innerHTML = READINGS[lec.id] || '';
  var branches = [], cur = { label:null, children:[] }, seen = {}; /* the intro paragraph before the first heading is left out */
  Array.prototype.forEach.call(d.children, function(el){
    if(/^H[34]$/.test(el.tagName)){ if(cur.label && cur.children.length) branches.push(cur); cur = { label:el.textContent.trim(), children:[] }; return; }
    if(!cur.label) return;
    Array.prototype.forEach.call(el.querySelectorAll('b, strong'), function(x){
      var t = x.textContent.trim(), k = t.toLowerCase();
      if(t.length < 2 || t.length > 38 || seen[k] || cur.children.length >= 6) return;
      seen[k] = 1; cur.children.push({ label:t });
    });
  });
  if(cur.label && cur.children.length) branches.push(cur);
  return { label:lecLabel(lec) + ' ' + lec.title, children:branches };
}

function renderWeak(body){
  if(WEAK_DRILL){
    var lecs = WEAK_DRILL === 'all' ? LECTURES.map(function(l){ return l.id; }) : [WEAK_DRILL];
    var missed = [], fresh = [];
    lecs.forEach(function(id){ (QUESTIONS_BY_LECTURE[id] || []).forEach(function(q){ var s = STATE.seen[q.id]; if(s && s.last === false) missed.push(q); else if(!s && WEAK_DRILL !== 'all') fresh.push(q); }); });
    var list = shuffled(missed).concat(shuffled(fresh)).slice(0, 20);
    var l = LECTURE_BY_ID[WEAK_DRILL];
    body.innerHTML = '<div class="qfilters" style="padding:4px 0"><button type="button" class="btn" id="weakBack">'+icon('back')+'All lectures</button><span class="pill">'+(l ? ''+lecLabel(l)+' '+escHtml(l.title) : 'Everything you missed')+'</span><span class="pill">'+missed.length+' missed last time'+(fresh.length ? ' · '+fresh.length+' not tried' : '')+'</span></div>' +
      (list.length ? '<div class="qlist" id="weakList">' + list.map(function(q){ return qCardHTML(q, { ctx:'weak' }); }).join('') + '</div>' : '<div class="rv-empty">Nothing to drill here: no misses and nothing untried. Nice.</div>');
    var wl = document.getElementById('weakList'); if(wl) wireQuestionContainer(wl);
    document.getElementById('weakBack').onclick = function(){ WEAK_DRILL = null; renderWeak(body); window.scrollTo(0,0); };
    return;
  }
  var rows = LECTURES.map(function(l){
    var qs = QUESTIONS_BY_LECTURE[l.id] || [], tried = 0, missed = 0;
    qs.forEach(function(q){ var s = STATE.seen[q.id]; if(s){ tried++; if(s.last === false) missed++; } });
    var st = STATE.lecStats[l.id] || { a:0, c:0 };
    return { l:l, total:qs.length, tried:tried, missed:missed, a:st.a, pct: st.a ? Math.round(st.c / st.a * 100) : null };
  });
  var started = rows.filter(function(r){ return r.a >= 3; }).sort(function(a, b){ return a.pct - b.pct; });
  var notYet = rows.filter(function(r){ return r.a < 3; });
  var totalMissed = rows.reduce(function(n, r){ return n + r.missed; }, 0);
  function row(r){
    return '<div class="weak-row tag-'+r.l.tag+'"><span class="lec-num">'+lecLabel(r.l)+'</span><div class="weak-main"><b>'+escHtml(r.l.title)+'</b><span>'+(r.pct === null ? r.tried+' of '+r.total+' tried' : r.pct+'% correct · '+r.tried+' of '+r.total+' tried'+(r.missed ? ' · '+r.missed+' missed last time' : ''))+'</span>' +
      (r.pct !== null ? '<span class="weak-meter"><i style="width:'+r.pct+'%"></i></span>' : '') + '</div><button type="button" class="btn'+(r.missed ? ' primary' : '')+'" data-drill="'+r.l.id+'">Drill</button></div>';
  }
  body.innerHTML = '<div class="reading" style="max-width:860px"><h2>Weak spots</h2><p>Lectures ranked by your accuracy on this device (3+ answers needed). Drill a lecture to get the questions you missed last time, then the ones you haven\'t tried.</p>' +
    '<div class="reading-actions" style="margin:6px 0 14px"><button type="button" class="btn primary" data-sh-drill="weak">'+icon('bolt')+'Daily drill</button>' + (totalMissed ? '<button type="button" class="btn" data-drill="all">Drill everything I missed ('+totalMissed+')</button>' : '') + '</div>' +
    (started.length ? '<div class="weak-list">' + started.map(row).join('') + '</div>' : '<p class="rv-empty">Answer a few questions in the bank or mock exam and your weak spots show up here.</p>') +
    (notYet.length ? '<h3 style="margin-top:22px">Not started yet</h3><div class="weak-list">' + notYet.map(row).join('') + '</div>' : '') + '</div>';
  body.querySelectorAll('[data-drill]').forEach(function(b){ b.onclick = function(){ WEAK_DRILL = b.getAttribute('data-drill'); renderWeak(body); window.scrollTo(0,0); }; });
}

function placeLectureFigs(prose, lecId, level, rest){
  if(!prose) return;
  var placed = {}, kids = Array.prototype.slice.call(prose.children);
  function norm(t){ return String(t || '').replace(/\s+/g, ' ').trim(); }
  (FIG_PLACE[lecId] || []).forEach(function(pl){
    var at = pl[level] || pl.full, el = null, i;
    for(i = 0; i < kids.length; i++){ if(norm(kids[i].textContent).indexOf(at) === 0){ el = kids[i]; break; } }
    if(!el) return;
    if(pl.end || /^H[1-6]$/.test(el.tagName)){ var j = kids.indexOf(el) + 1; while(j < kids.length && !/^H[1-6]$/.test(kids[j].tagName)) j++; el = kids[j - 1]; }
    var keys = pl.widget ? [pl.widget] : pl.figs, box = document.createElement('div');
    box.className = 'lec-fig-inline'; box.setAttribute('data-sh-noread', '');
    box.innerHTML = keys.every(function(k){ return ANIMA.meta(k); }) ? keys.map(figCardHTML).join('') : '<div class="fig-grid">' + keys.map(figCardHTML).join('') + '</div>';
    /* several figures after the same paragraph keep their order */
    var after = el; while(after.nextElementSibling && after.nextElementSibling.classList.contains('lec-fig-inline')) after = after.nextElementSibling;
    after.parentNode.insertBefore(box, after.nextSibling);
    keys.forEach(function(k){ placed[k] = 1; });
  });
  var left = (FIG_BY_LEC[lecId] || []).filter(function(k){ return !placed[k] && !(k === 'fence' && placed.cuspMap); });
  if(rest && left.length){ rest.hidden = false; rest.querySelector('.fig-grid').innerHTML = left.map(figCardHTML).join(''); }
  ANIMA.mount(prose.parentNode);
}

function bankIsFmt(q, fm){ return fm === 'pbox' ? !!q.pbox : fm === 'img' ? !!q.img : (fm === 'multi' || fm === 'match' || fm === 'sequence') ? q.type === fm : q.fmt === fm; }

function bankLabelOf(list, k){ for(var i = 0; i < list.length; i++) if(list[i][0] === k) return list[i][1]; return k; }

function lecPickSummary(ids){
  if(ids.length === LECTURES.length) return 'All ' + LECTURES.length + ' lectures';
  if(!ids.length) return 'No lectures picked';
  if(ids.length === 1){ var l = LECTURE_BY_ID[ids[0]]; return lecLabel(l) + ' · ' + l.title; }
  return ids.length + ' lectures: ' + LECTURES.filter(function(l){ return ids.indexOf(l.id) !== -1; }).map(lecLabel).join(', ');
}

function bankFiltered(search, o){
  o = o || {};
  var s = (search||'').toLowerCase().trim(), lecOn = {}, pins = {};
  var st = o.st || STATE.ui.qstatus || 'all', fm = o.fm || STATE.ui.qfmt || 'all', src = o.src || STATE.ui.qsrc || 'all';
  bankLecIds().forEach(function(id){ lecOn[id] = 1; });
  if(st === 'pinned') pinnedIds().forEach(function(id){ pins[id] = 1; });
  return QUESTIONS.filter(function(q){
    if(!lecOn[q.lec]) return false;
    if(st === 'pinned' && !pins[q.id]) return false;
    if(st === 'likely' && !q.likely) return false;
    if(src !== 'all' && q.src !== src) return false;
    if(fm !== 'all' && !bankIsFmt(q, fm)) return false;
    var seen = STATE.seen[q.id];
    if(st === 'unseen' && seen) return false;
    if(st === 'missed' && !(seen && seen.last === false)) return false;
    if(s){ var hay = (q.stem + ' ' + (q.choices||q.steps||[]).join(' ') + ' ' + (q.pairs ? q.pairs.map(function(p){return p.join(' ');}).join(' ') : '') + ' ' + q.ex + ' ' + (q.pbox ? q.pbox.map(function(r){ return r.join(' '); }).join(' ') : '')).toLowerCase(); if(hay.indexOf(s) === -1) return false; }
    return true;
  });
}

function bankResetFilters(){ STATE.ui.qlec = 'all'; STATE.ui.qstatus = 'all'; STATE.ui.qfmt = 'all'; STATE.ui.qsrc = 'all'; bankSearch = ''; bankShown = BANK_PAGE; saveState(); }

function renderCram(body){
  body.innerHTML = '<div class="cram-grid">' + LECTURES.map(function(l){
    return '<div class="cram-card tag-'+l.tag+'" id="cram-'+l.id+'"><h3><span class="lec-num">'+lecLabel(l)+'</span>'+escHtml(l.title)+'</h3><ul>'+(CRAM[l.id]||[]).map(function(b){ return '<li>'+escHtml(b)+'</li>'; }).join('')+'</ul></div>';
  }).join('') + '</div>';
}

function sectionCount(sec){
  if(sec.type === 'cards' || sec.type === 'list') return sec.items.length;
  if(sec.type === 'table') return sec.rows.length;
  if(sec.type === 'flows') return seqsOf(sec).length;
  if(sec.type === 'figs') return sec.figs.length;
  return 0;
}

function seqsOf(sec){ return SEQUENCES.filter(function(s){ return !sec.lec || s.lec === sec.lec; }); }

function groupCount(g){ return g.sections.reduce(function(n, s){ return n + sectionCount(s); }, 0); }

function hl(text, term){
  var safe = escHtml(text);
  if(!term) return safe;
  var re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
  return safe.replace(re, '<mark>$1</mark>');
}

function cardHTML(c, term){
  return '<div class="rv-card tag-'+tagOf(c.lec)+'"><h4>'+hl(c.name, term)+'</h4>'+(c.sub?'<div class="sub">'+hl(c.sub, term)+'</div>':'')+
    '<dl>'+c.facts.map(function(f){ return '<dt>'+escHtml(f[0])+'</dt><dd>'+hl(f[1], term)+'</dd>'; }).join('')+'</dl>'+
    (c.tip?'<div class="rv-tip">'+icon('bulb')+escHtml(c.tip)+'</div>':'')+
    '<div>'+lecChip(c.lec)+'</div></div>';
}

function tableHTML(sec, rows, term){
  return '<div class="rv-table-wrap"><table class="rv-table"><thead><tr>'+sec.head.map(function(h){ return '<th>'+escHtml(h)+'</th>'; }).join('')+'</tr></thead><tbody>'+
    rows.map(function(r){ return '<tr>'+r.map(function(cell, i){
      if(sec.head[i] === 'Lecture' && LECTURE_BY_ID[cell]) return '<td>'+lecChip(cell)+'</td>';
      return '<td>'+hl(cell, term)+'</td>'; }).join('')+'</tr>'; }).join('')+
  '</tbody></table></div>';
}

function flowsHTML(seqs, term){
  return '<div class="flows">' + seqs.map(function(s){
    return '<div class="flow tag-'+tagOf(s.lec)+'"><h4>'+hl(s.title, term)+' '+lecChip(s.lec)+'</h4><ol>'+s.steps.map(function(st, i){ return '<li><span class="st"><b>'+(i+1)+'</b><span>'+hl(st, term)+'</span></span></li>'; }).join('')+'</ol></div>';
  }).join('') + '</div>';
}

function sectionHTML(sec, term){
  var t = term ? term.toLowerCase() : '';
  function m(s){ return !t || String(s).toLowerCase().indexOf(t) !== -1; }
  var inner = '';
  if(sec.type === 'cards'){
    var items = sec.items.filter(function(c){ return m(c.name) || m(c.sub) || c.facts.some(function(f){ return m(f[0]) || m(f[1]); }) || m(c.tip); });
    if(!items.length) return '';
    inner = '<div class="rv-cards">' + items.map(function(c){ return cardHTML(c, term); }).join('') + '</div>';
  } else if(sec.type === 'table'){
    var rows = sec.rows.filter(function(r){ return r.some(m); });
    if(!rows.length) return '';
    inner = tableHTML(sec, rows, term);
  } else if(sec.type === 'list'){
    var li = sec.items.filter(m); if(!li.length) return '';
    inner = '<ul class="rv-list">' + li.map(function(x){ return '<li>'+hl(x, term)+'</li>'; }).join('') + '</ul>';
  } else if(sec.type === 'figs'){
    var fk = sec.figs.filter(function(k){ var am = ANIMA.meta(k); return k === 'cuspMap' ? m('What cusp hits where: fence post, contacts, Class I II III') : am ? m(am.title) || m(am.caption) : m(FIGS[k].title) || m(FIGS[k].caption); }); if(!fk.length) return '';
    var fa = fk.filter(function(k){ return ANIMA.meta(k); }), fs = fk.filter(function(k){ return !ANIMA.meta(k); });
    inner = fa.map(figCardHTML).join('') + (fs.length ? '<div class="fig-grid">' + fs.map(figCardHTML).join('') + '</div>' : '');
  } else if(sec.type === 'flows'){
    var seqs = seqsOf(sec).filter(function(s){ return m(s.title) || s.steps.some(m); }); if(!seqs.length) return '';
    inner = flowsHTML(seqs, term);
  }
  return '<section class="rv-section">' + (sec.title ? '<h3>'+escHtml(sec.title)+'</h3>' : '') + inner + '</section>';
}

function groupLecTag(lecId){ var l = LECTURE_BY_ID[lecId]; return l ? '<span class="gc-lec tag-'+l.tag+'">'+lecLabel(l)+'</span>' : ''; }

function partNavHTML(g){
  var parts = []; g.sections.forEach(function(sec, i){ if(sec.part) parts.push('<button type="button" class="rv-part-link" data-part="'+i+'">'+escHtml(sec.part)+'</button>'); });
  return parts.length > 1 ? '<nav class="rv-parts" aria-label="Parts of this tab">' + parts.join('') + '</nav>' : '';
}

function mockTotal(){ return Object.keys(MOCK_BLUEPRINT).reduce(function(n,k){ return n + MOCK_BLUEPRINT[k]; }, 0); }

function applyTheme(t){
  if(t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
  var b = document.getElementById('themeBtn'); if(b) b.innerHTML = icon(t === 'dark' ? 'moon' : t === 'light' ? 'sun' : 'auto');
}

function shSearchSections(){
  var out = [];
  function frag(html){ var d = document.createElement('div'); d.innerHTML = html || ''; return d; }
  function clean(t){ return String(t || '').replace(/\s+/g, ' ').trim(); }
  LECTURES.forEach(function(l){
    var where = lecLabel(l) + ' ' + l.title;
    Array.prototype.forEach.call(frag(READINGS[l.id]).querySelectorAll('p, li, h3, h4'), function(el, k){
      var t = clean(el.textContent); if(t.length > 2) out.push({ kind:'Notes', where:where, text:t, lec:l.id, go:{ v:'notes', lec:l.id, k:k } });
    });
    (CRAM[l.id] || []).forEach(function(b){ out.push({ kind:'Cram sheet', where:where, text:b, lec:l.id, go:{ v:'cram', lec:l.id } }); });
  });
  HINTS.forEach(function(x){ var l = LECTURE_BY_ID[x.lec]; out.push({ kind:'Exam hints', where:l ? ''+lecLabel(l)+' '+l.title : '', text:clean(x.quote + ' ' + x.take), lec:x.lec, go:{ v:'hints', lec:x.lec } }); });
  REVIEW.forEach(function(g){
    g.sections.forEach(function(sec){
      if(sec.type === 'cards') sec.items.forEach(function(c){ out.push({ kind:'Review', where:g.title, title:c.name, text:clean(c.name + ' ' + c.sub + ' ' + c.facts.map(function(f){ return f[0] + ': ' + f[1]; }).join('; ') + ' ' + c.tip), go:{ v:'review', q:c.name } }); });
      else if(sec.type === 'table') sec.rows.forEach(function(r){ out.push({ kind:'Review', where:g.title + (sec.title ? ' · ' + sec.title : ''), title:r[0], text:clean(r.join(' · ')), go:{ v:'review', q:r[0] } }); });
      else if(sec.type === 'list') sec.items.forEach(function(it){ out.push({ kind:'Review', where:g.title, text:clean(it), go:{ v:'review', q:clean(it).split(' ').slice(0, 4).join(' ') } }); });
    });
  });
  SEQUENCES.forEach(function(sq){ var sg = REVIEW.filter(function(x){ return x.lec === sq.lec; })[0]; out.push({ kind:'Review', where:(sg ? sg.title + ' · ' : '') + 'Processes', title:sq.title, text:clean(sq.title + ': ' + sq.steps.join(' → ')), go:{ v:'review', q:sq.title } }); });
  return out;
}

function shFlashIn(sel){ setTimeout(function(){ var el = typeof sel === 'string' ? document.querySelector(sel) : sel(); if(el && window.shFlash) window.shFlash(el); }, 60); }
/* sh:engine-end */
