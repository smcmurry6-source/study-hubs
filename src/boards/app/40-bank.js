/* ====================================================================
   QUESTIONS: filtered one-at-a-time practice, case sets with Rounds, and missed-item review.
   ==================================================================== */
var bankSearch = '';
var bankClassStats = {};
var bankClassStatsSeen = {};
var bankRenderToken = 0;

function bankPoolBase(){
  var sec = STATE.ui.bankSec, unit = STATE.ui.bankUnit, exam = STATE.ui.bankExam || 'all';
  var words = bankSearch.toLowerCase().split(/\s+/).filter(Boolean);
  return QUESTIONS.filter(function(x){
    if(sec && x.sec !== sec) return false;
    if(!sec && unit && unit !== 'all' && x.lec !== unit) return false;
    if(exam !== 'all' && (x.exam || []).indexOf(exam) === -1) return false;
    if(STATE.ui.bankNewOnly && STATE.answered[x.id]) return false;
    if(words.length){ var t = (x.stem + ' ' + x.choices.join(' ')).toLowerCase(); if(!words.every(function(w){ return t.indexOf(w) !== -1; })) return false; }
    return true;
  });
}

function bankPool(){
  var list = bankPoolBase();
  if(STATE.ui.bankHardOnly) list = list.filter(function(x){ var s = bankClassStats[x.id]; return s && s.total >= 8 && (s.correct / s.total) < 0.5; });
  return list;
}

function ensureBankStats(ids, done){
  var missing = ids.filter(function(id){ return !bankClassStatsSeen[id]; });
  if(!missing.length) return true;
  if(typeof window.shGetClassStats !== 'function'){
    missing.forEach(function(id){ bankClassStatsSeen[id] = true; }); return true;
  }
  window.shGetClassStats(missing, function(byQid){
    missing.forEach(function(id){ bankClassStatsSeen[id] = true; });
    Object.keys(byQid || {}).forEach(function(id){ bankClassStats[id] = byQid[id]; });
    done();
  });
  return false;
}

function bankSections(){
  var out = [];
  Object.keys(READINGS).forEach(function(unit){
    var html = READINGS[unit] || '', re = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi, m;
    while((m = re.exec(html))){
      var id = (m[1].match(/\bid="([^"]+)"/) || [])[1], title = (m[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1];
      if(id && title) out.push({ id:id, unit:unit, title:title.replace(/<[^>]*>/g, '') });
    }
  });
  return out;
}

function caseState(c){
  var p = STATE.ui.caseProgress[c.id], n = c.items.length;
  if((p && +p.next >= n) || caseHasAllAnswers(c)) return 'Done';
  if((p && +p.next > 0) || c.items.some(function(id){ return !!STATE.answered[id]; })) return 'In progress';
  return 'New';
}

function renderCaseList(){
  if(!CASES.length) return emptyHTML('No case sets yet', ['Case sets will appear here when the first unit opens.'], 'bank');
  return '<div class="case-list">' + CASES.map(function(c){
    var state = caseState(c), box = c.box || {};
    return '<article class="case-list-card"><div><span class="chip">' + esc(state) + '</span><h3>' + esc(box.patient || c.id) + '</h3>' +
      '<p>' + esc(box.cc || '') + '</p><p class="faint">' + plural(c.items.length, 'question') + ' · ' + (c.units || []).map(esc).join(' / ') + '</p></div>' +
      '<button type="button" class="btn primary" data-case-open="' + esc(c.id) + '">' + (state === 'Done' ? 'Review case' : 'Open case') + '</button></article>';
  }).join('') + '</div>';
}

function renderMissed(){
  var standalones = QUESTIONS.filter(function(q){ return !q.case && STATE.answered[q.id] && !STATE.answered[q.id].lastCorrect; });
  var missedCases = CASES.filter(function(c){ return c.items.some(function(id){ var a = STATE.answered[id]; return a && !a.lastCorrect; }); });
  if(!standalones.length && !missedCases.length) return emptyHTML('Nothing missed', ['Questions you get wrong come back here until you get them right.'], 'bank');
  var html = '';
  if(standalones.length){
    html += '<h3 class="bank-section-title">Missed questions</h3><div class="qlist">' + standalones.map(function(q){
      return '<div class="missed-item" data-missed-item="' + esc(q.id) + '"></div>';
    }).join('') + '</div>';
  }
  if(missedCases.length){
    html += '<h3 class="bank-section-title">Missed case items</h3><div class="missed-case-list">' + missedCases.map(function(c){
      var count = c.items.filter(function(id){ var a = STATE.answered[id]; return a && !a.lastCorrect; }).length;
      return '<article class="missed-case"><div><h4>' + esc(c.box && c.box.patient || c.id) + '</h4><p>' + count + ' missed ' + (count === 1 ? 'item' : 'items') + ' · ' + plural(c.items.length, 'question') + '</p></div>' +
        '<button type="button" class="btn" data-case-missed="' + esc(c.id) + '">Review case</button></article>';
    }).join('') + '</div>';
  }
  return html;
}

function renderBank(){
  var el = document.getElementById('panel-bank'), sub = STATE.ui.sub.bank || 'practice';
  var head = '<div class="panel-head"><div><h2>Questions</h2><p>Practice one question at a time, review complete case visits, and revisit questions you missed.</p></div></div>';
  var prefix = head + subtabsHTML('bank', sub);
  if(!QUESTIONS.length){
    el.innerHTML = prefix + emptyHTML('The first questions are being written and checked', [
      'Every question is written for this hub from a checked fact with a public primary source, then verified by a second model and, for the risky ones, by a person.',
      'Practice, case sets and your missed questions will live here.'
    ], 'bank');
    return;
  }
  if(sub === 'cases' && STATE.ui.caseId && CASE_BY_ID[STATE.ui.caseId]){
    renderCase(el, STATE.ui.caseId, { ctx:'case', review:!!STATE.ui.caseReview, prefix:prefix, backLabel:'Back to cases' });
    return;
  }
  if(sub === 'missed' && STATE.ui.caseId && STATE.ui.caseReview){
    renderCase(el, STATE.ui.caseId, { ctx:'case', review:true, prefix:prefix, backLabel:'Back to missed' });
    return;
  }
  if(sub === 'cases'){
    el.innerHTML = prefix + renderCaseList();
    return;
  }
  if(sub === 'missed'){
    el.innerHTML = prefix + renderMissed();
    $$('.missed-item', el).forEach(function(host){ renderItem(host, host.getAttribute('data-missed-item'), { ctx:'bank', review:true }); });
    return;
  }

  var base = bankPoolBase(), token = ++bankRenderToken;
  if(STATE.ui.bankHardOnly && !ensureBankStats(base.map(function(q){ return q.id; }), function(){ if(token === bankRenderToken) renderBank(); })){
    el.innerHTML = prefix + bankFiltersHTML() + emptyHTML('Checking class accuracy', ['Hard only shows questions answered correctly by fewer than half of at least 8 classmates.'], 'bank');
    return;
  }
  var pool = bankPool(), at = Math.min(Math.max(0, +STATE.ui.bankAt || 0), Math.max(0, pool.length - 1));
  if(pool[at] && pool[at].case){
    STATE.ui.caseId = pool[at].case; STATE.ui.caseReview = false; STATE.ui.sub.bank = 'cases'; saveState(); renderBank(); return;
  }
  var html = prefix + bankFiltersHTML();
  html += pool.length ? '<div class="bank-practice">' +
    '<div class="bank-card-host" data-bank-qid="' + esc(pool[at].id) + '"></div>' +
    '<div class="qnav"><span class="faint">' + (at + 1) + ' of ' + pool.length + '</span><span class="btn-row" style="margin:0">' +
    '<button type="button" class="btn" data-bank-step="-1"' + (at ? '' : ' disabled') + '>Previous</button>' +
    '<button type="button" class="btn primary" data-bank-step="1"' + (at < pool.length - 1 ? '' : ' disabled') + '>Next</button></span></div></div>'
    : emptyHTML('No questions match', ['Try another unit or clear a filter.'], 'bank');
  el.innerHTML = html;
  if(pool.length) renderItem($('.bank-card-host', el), pool[at].id, { ctx:'bank' });
}

function bankFiltersHTML(){
  var units = taughtUnits().filter(function(l){ return unitItems(l.id).length; }), sections = bankSections();
  var sectionUnits = STATE.ui.bankUnit && STATE.ui.bankUnit !== 'all' ? STATE.ui.bankUnit : null;
  if(sectionUnits) sections = sections.filter(function(s){ return s.unit === sectionUnits; });
  var selectedSection = STATE.ui.bankSec || '';
  return '<div class="filters bank-filters">' +
    '<label class="field">Unit<select data-bank-unit><option value="all"' + ((!STATE.ui.bankUnit || STATE.ui.bankUnit === 'all') ? ' selected' : '') + '>All units</option>' + units.map(function(l){
      return '<option value="' + esc(l.id) + '"' + (STATE.ui.bankUnit === l.id && !STATE.ui.bankSec ? ' selected' : '') + '>' + esc(l.title) + '</option>';
    }).join('') + '</select></label>' +
    '<label class="field">Notes section<select data-bank-section><option value="">All sections</option>' + sections.map(function(s){
      return '<option value="' + esc(s.id) + '"' + (selectedSection === s.id ? ' selected' : '') + '>' + esc(s.unit + ' · ' + s.title) + '</option>';
    }).join('') + '</select></label>' +
    '<label class="field">Exam<select data-bank-exam><option value="all"' + ((STATE.ui.bankExam || 'all') === 'all' ? ' selected' : '') + '>INBDE + ADEX</option><option value="inbde"' + (STATE.ui.bankExam === 'inbde' ? ' selected' : '') + '>INBDE</option><option value="adex"' + (STATE.ui.bankExam === 'adex' ? ' selected' : '') + '>ADEX</option></select></label>' +
    '<label class="bank-check"><input type="checkbox" data-bank-new' + (STATE.ui.bankNewOnly ? ' checked' : '') + '> New only</label>' +
    '<label class="bank-check"><input type="checkbox" data-bank-hard' + (STATE.ui.bankHardOnly ? ' checked' : '') + '> Hard only</label>' +
    '<label class="bank-check"><input type="checkbox" data-bank-cover' + (STATE.ui.coverOptions ? ' checked' : '') + '> Cover options</label>' +
    (bankSearch ? '<button type="button" class="btn" data-bank-unsearch>Search: ' + esc(bankSearch) + ' &times;</button>' : '') +
    '</div>';
}

function wireBank(){
  var el = document.getElementById('panel-bank');
  /* Clear an open case before the boot handler renders a different bank sub-view. */
  el.addEventListener('click', function(e){
    if(e.target.closest('.subtabs [data-sub]')){ STATE.ui.caseId = null; STATE.ui.caseReview = false; }
  }, true);
  el.addEventListener('click', function(e){
    var step = e.target.closest('[data-bank-step]');
    if(step){ STATE.ui.bankAt = Math.max(0, (+STATE.ui.bankAt || 0) + +step.getAttribute('data-bank-step')); saveState(); renderBank(); return; }
    if(e.target.closest('[data-bank-unsearch]')){ bankSearch = ''; STATE.ui.bankAt = 0; saveState(); renderBank(); return; }
    var open = e.target.closest('[data-case-open]');
    if(open){ STATE.ui.caseId = open.getAttribute('data-case-open'); STATE.ui.caseReview = false; saveState(); renderBank(); return; }
    var missedCase = e.target.closest('[data-case-missed]');
    if(missedCase){ STATE.ui.caseId = missedCase.getAttribute('data-case-missed'); STATE.ui.caseReview = true; saveState(); renderBank(); return; }
    if(e.target.closest('[data-case-back]')){ STATE.ui.caseId = null; STATE.ui.caseReview = false; saveState(); renderBank(); return; }
    if(e.target.closest('[data-case-next]')){
      var p = STATE.ui.caseProgress[STATE.ui.caseId]; if(p) delete p.pending;
      saveState(); renderBank(); return;
    }
  });
  el.addEventListener('change', function(e){
    var t = e.target;
    if(t.closest('[data-bank-unit]')){ STATE.ui.bankUnit = t.value; STATE.ui.bankSec = null; STATE.ui.bankAt = 0; }
    else if(t.closest('[data-bank-section]')){ STATE.ui.bankSec = t.value || null; STATE.ui.bankUnit = 'all'; STATE.ui.bankAt = 0; }
    else if(t.closest('[data-bank-exam]')){ STATE.ui.bankExam = t.value; STATE.ui.bankAt = 0; }
    else if(t.closest('[data-bank-new]')){ STATE.ui.bankNewOnly = t.checked; STATE.ui.bankAt = 0; }
    else if(t.closest('[data-bank-hard]')){ STATE.ui.bankHardOnly = t.checked; STATE.ui.bankAt = 0; }
    else if(t.closest('[data-bank-cover]')){ STATE.ui.coverOptions = t.checked; }
    else return;
    saveState(); renderBank();
  });
  /* The generated export script defines SH_GOTO after this file. Wrap it once DOM parsing is complete so
     searches and notes can land on a standalone or open a case in its case-set view. */
  document.addEventListener('DOMContentLoaded', function(){
    var original = window.SH_GOTO; if(typeof original !== 'function' || original._bankWrapped) return;
    var wrapped = function(go){
      if(go && go.qid && QUESTION_BY_ID[go.qid]){
        var q = QUESTION_BY_ID[go.qid]; bankSearch = '';
        STATE.ui.bankExam = 'all'; STATE.ui.bankNewOnly = false; STATE.ui.bankHardOnly = false; STATE.ui.bankAt = 0;
        if(q.case){ STATE.ui.caseId = q.case; STATE.ui.caseReview = false; STATE.ui.sub.bank = 'cases'; saveState(); setMode('bank'); return; }
        STATE.ui.caseId = null; STATE.ui.caseReview = false; STATE.ui.sub.bank = 'practice'; STATE.ui.bankUnit = q.lec; STATE.ui.bankSec = null;
        var pool = bankPool(); STATE.ui.bankAt = Math.max(0, pool.indexOf(q)); saveState(); setMode('bank'); return;
      }
      return original(go);
    };
    wrapped._bankWrapped = true; window.SH_GOTO = wrapped;
  });
}
