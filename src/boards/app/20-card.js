/* ====================================================================
   ITEM CARD: one rendering and recording path for Questions, cases, the drill and the game adapter.
   Choice buttons always carry their authored index, even when their displayed order is shuffled.
   ==================================================================== */
var LETTERS = 'ABCDEFGHIJ';

function choiceOrder(q){
  var n = (q.choices || []).length, pins = [], all = [];
  (q.pin || []).forEach(function(i){ if(i >= 0 && i < n && pins.indexOf(i) === -1) pins.push(i); });
  for(var i = 0; i < n; i++) if(pins.indexOf(i) === -1) all.push(i);
  return (q.fixed ? all : shuffled(all)).concat(pins);
}

function pboxHTML(b){
  if(!b) return '';
  function list(a){ return a && a.length ? '<ul>' + a.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; }
  return '<div class="pbox"><dl>' +
    '<dt>Patient</dt><dd>' + esc(b.patient || '') + '</dd>' +
    '<dt>Chief Complaint</dt><dd>' + esc(b.cc || '') + '</dd>' +
    '<dt>Background and/or Patient History</dt><dd>' + list(b.hx) + '</dd>' +
    '<dt>Current Findings</dt><dd>' + list(b.findings) + '</dd>' +
    '</dl></div>';
}

function figureHTML(key){
  var f = FIGURES[key]; if(!f) return '';
  return '<figure class="qfig" role="img" aria-label="' + esc(f.alt) + '">' + f.svg + '</figure>';
}

function refChipsHTML(q){
  return '<div class="qx-refs">' + (q.refs || []).map(function(r){
    if(/^https:/.test(r)) return '<a class="chip" href="' + esc(r) + '" target="_blank" rel="noopener">Source</a>';
    var f = REFS[r], s = f && f.src && f.src[0];
    return s && s.u ? '<a class="chip" href="' + esc(s.u) + '" target="_blank" rel="noopener" title="' + esc(s.t || '') + '">' + esc(r) + '</a>' : '<span class="chip">' + esc(r) + '</span>';
  }).join('') + '</div>';
}

function sectionTitle(unit, sec){
  var html = READINGS[unit] || '', safe = sec.replace(/[^a-z0-9-]/gi, ''), re = new RegExp('<section[^>]*id="' + safe + '"[^>]*>[\\s\\S]*?<h2[^>]*>([\\s\\S]*?)</h2>', 'i');
  var m = html.match(re);
  return m ? m[1].replace(/<[^>]*>/g, '') : '';
}

function cardHTML(q, opts, order){
  opts = opts || {}; order = order || choiceOrder(q);
  var u = LECTURE_BY_ID[q.lec], covered = !!STATE.ui.coverOptions && !opts.review;
  var tag = opts.review ? 'div' : 'button';
  return '<article class="qcard" data-qid="' + esc(q.id) + '" data-ctx="' + esc(opts.ctx || 'bank') + '" data-lock-in="' + (!!opts.lockIn) + '">' +
    '<div class="qcard-top"><span class="chip accent">' + esc(u ? u.short : q.lec) + '</span>' + (q.exam || []).map(function(e){ return '<span class="chip">' + esc(e.toUpperCase()) + '</span>'; }).join('') + '</div>' +
    (!opts.caseView ? pboxHTML(q.pbox) : '') + (q.img ? figureHTML(q.img) : '') +
    '<p class="qcard-stem">' + esc(q.stem) + '</p>' +
    (covered ? '<button type="button" class="btn qcard-show-options" data-show-options>Show options</button>' : '') +
    '<div class="qcard-choices"' + (covered ? ' hidden' : '') + '>' + order.map(function(i, k){
      var key = tag === 'button' ? ' type="button"' : ' role="listitem"';
      return '<' + tag + key + ' class="qchoice" data-i="' + i + '"><span class="lt">' + LETTERS[k] + '</span><span>' + esc(q.choices[i]) + '</span></' + tag + '>';
    }).join('') + '</div><div class="qx" hidden></div></article>';
}

function explainHTML(q, picked){
  var hasPick = typeof picked === 'number' && picked >= 0 && picked < q.choices.length;
  var right = hasPick && picked === q.answer, rest = [];
  for(var i = 0; i < q.choices.length; i++) if(i !== picked) rest.push(i);
  var order = hasPick ? [picked].concat(rest) : [q.answer].concat(rest.filter(function(x){ return x !== q.answer; }));
  var lines = order.map(function(i){
    return '<li class="' + (i === picked ? 'is-picked ' : '') + (i === q.answer ? 'is-key' : '') + '"><b>' + esc(q.choices[i]) + ':</b> ' + esc((q.why || [])[i] || '') + '</li>';
  }).join('');
  var title = q.sec ? sectionTitle(q.lec, q.sec) : '';
  var verdict = hasPick ? (right ? 'Correct.' : 'Not this time. The answer is ' + esc(q.choices[q.answer]) + '.') : 'Answer: ' + esc(q.choices[q.answer]) + '.';
  return '<p class="qx-verdict ' + (hasPick ? (right ? 'right' : 'wrong') : 'review') + '">' + verdict + '</p>' +
    '<p>' + esc(q.ex || '') + '</p><ul class="qx-why">' + lines + '</ul>' +
    (hasPick && !right && q.cue ? '<p class="qx-cue"><b>Remember it:</b> ' + esc(q.cue) + '</p>' : '') +
    refChipsHTML(q) +
    (title ? '<div class="btn-row"><button type="button" class="btn" data-goto-sec="' + esc(q.sec) + '" data-goto-unit="' + esc(q.lec) + '">Read: ' + esc(title) + '</button></div>' : '') +
    (typeof window.shOpenFlag === 'function' ? '<div class="btn-row"><button type="button" class="btn qx-report" data-report>Report</button></div>' : '');
}

function setChoiceStates(card, q, picked){
  $$('.qchoice', card).forEach(function(b){
    var i = +b.getAttribute('data-i');
    if(i === q.answer) b.setAttribute('data-state', 'right');
    else if(i === picked) b.setAttribute('data-state', 'wrong');
    if(b.tagName === 'BUTTON') b.disabled = true;
  });
}

function showClassStats(card, q){
  if(typeof window.shGetClassStats !== 'function') return;
  window.shGetClassStats([q.id], function(byQid){
    if(!card.parentNode) return;
    var stat = byQid && byQid[q.id]; if(!stat || stat.total < 8) return;
    var qx = $('.qx', card); if(!qx || $('[data-class-stats]', qx)) return;
    var row = document.createElement('p'); row.className = 'qx-class'; row.setAttribute('data-class-stats', '1');
    row.textContent = 'Class: ' + pct(stat.correct, stat.total) + '% right (' + stat.total + ' answers)'; qx.appendChild(row);
  });
}

function wireCard(card, q, opts, onDone){
  opts = opts || {};
  var picked = null, recorded = false, dead = false;
  var old = STATE.answered[q.id];
  if(opts.review){
    picked = old && typeof old.choice === 'number' ? old.choice : null;
    setChoiceStates(card, q, picked);
    var qx = $('.qx', card); qx.innerHTML = explainHTML(q, picked); qx.hidden = false;
    showClassStats(card, q);
  }
  function feedback(){
    var qx = $('.qx', card); qx.innerHTML = explainHTML(q, picked); qx.hidden = false;
    setChoiceStates(card, q, picked); showClassStats(card, q);
  }
  function submit(conf){
    if(dead || opts.review || recorded || picked == null) return false;
    recorded = true; card.setAttribute('data-recorded', '1');
    var right = picked === q.answer;
    recordAnswer(q, right, picked, opts.ctx || card.getAttribute('data-ctx') || 'bank', conf);
    if(opts.deferFeedback){ var qx = $('.qx', card); qx.textContent = 'Recorded'; qx.hidden = false; }
    else feedback();
    if(onDone) onDone(q, right);
    return true;
  }
  function click(e){
    var go = e.target.closest('[data-goto-sec]');
    if(go){ window.SH_GOTO({ unit:go.getAttribute('data-goto-unit'), sec:go.getAttribute('data-goto-sec') }); return; }
    var report = e.target.closest('[data-report]');
    if(report){ if(typeof window.shOpenFlag === 'function') window.shOpenFlag(q.id); return; }
    var reveal = e.target.closest('[data-show-options]');
    if(reveal){ var list = $('.qcard-choices', card); if(list) list.hidden = false; reveal.hidden = true; return; }
    var b = e.target.closest('.qchoice'); if(!b || opts.review || recorded || !card.contains(b)) return;
    picked = +b.getAttribute('data-i');
    $$('.qchoice', card).forEach(function(x){ x.removeAttribute('data-state'); });
    b.setAttribute('data-state', 'selected');
    if(!opts.lockIn) submit();
  }
  card.addEventListener('click', click);
  return {
    picked:function(){ return picked; },
    submit:submit,
    destroy:function(){ dead = true; card.removeEventListener('click', click); }
  };
}

function renderItem(el, qid, opts){
  opts = opts || {};
  var q = QUESTION_BY_ID[qid];
  if(!q){ el.innerHTML = ''; return { picked:function(){ return null; }, submit:function(){ return false; }, destroy:function(){} }; }
  var order = choiceOrder(q); el.innerHTML = cardHTML(q, opts, order);
  return wireCard($('.qcard', el), q, opts, opts.onDone);
}

/* Compatibility for the daily drill, which supplies its own host around cardHTML. */
function wireCards(root, onDone){
  $$('.qcard', root).forEach(function(card){
    if(card.getAttribute('data-wired')) return;
    card.setAttribute('data-wired', '1');
    var q = QUESTION_BY_ID[card.getAttribute('data-qid')]; if(!q) return;
    wireCard(card, q, { ctx:card.getAttribute('data-ctx') || 'bank' }, onDone);
  });
}
