/* ====================================================================
   QUESTIONS (minimal): Practice (one standalone at a time, filtered by unit or notes section), Cases and
   Missed. int-cards replaces this with the full bank (filters, case sets in exam layout with Rounds).
   ==================================================================== */
var bankSearch = '';

function bankPool(){
  var sec = STATE.ui.bankSec, unit = STATE.ui.bankUnit, q = bankSearch.toLowerCase().split(/\s+/).filter(Boolean);
  return QUESTIONS.filter(function(x){
    if(x.case) return false;
    if(sec && x.sec !== sec) return false;
    if(!sec && unit && unit !== 'all' && x.lec !== unit) return false;
    if(q.length){ var t = (x.stem + ' ' + x.choices.join(' ')).toLowerCase(); if(!q.every(function(w){ return t.indexOf(w) !== -1; })) return false; }
    return true;
  });
}

function renderBank(){
  var el = document.getElementById('panel-bank'), sub = STATE.ui.sub.bank || 'practice';
  var head = '<div class="panel-head"><div><h2>Questions</h2><p>Board-style single-best-answer questions. Options are shuffled every time, so learn the reason, not the letter.</p></div></div>';
  if(!QUESTIONS.length){
    el.innerHTML = head + subtabsHTML('bank', sub) + emptyHTML('The first questions are being written and checked', [
      'Every question is written for this hub from a checked fact with a public primary source, then verified by a second model and, for the risky ones, by a person.',
      'Practice, case sets and your missed questions will live here.'
    ], 'bank');
    return;
  }
  var html = head + subtabsHTML('bank', sub);
  if(sub === 'cases'){
    html += CASES.length ? '<div class="box"><h3>' + plural(CASES.length, 'case set') + '</h3><p class="muted">Case sets in the exam layout, with every answer shown after the last question, arrive with the full bank.</p></div>'
      : emptyHTML('No case sets yet', ['Case sets (one patient, 2-6 questions) arrive with the first units.'], 'bank');
  } else if(sub === 'missed'){
    var missed = QUESTIONS.filter(function(x){ var a = STATE.answered[x.id]; return a && !a.lastCorrect && !x.case; });
    html += missed.length ? '<div class="qlist">' + missed.map(function(x){ return cardHTML(x, { ctx:'bank' }); }).join('') + '</div>'
      : emptyHTML('Nothing missed', ['Questions you get wrong come back here until you get them right.'], 'bank');
  } else {
    var pool = bankPool(), at = Math.min(STATE.ui.bankAt || 0, Math.max(0, pool.length - 1));
    var units = taughtUnits().filter(function(l){ return unitItems(l.id).length; });
    html += '<div class="filters"><label class="field">Unit<select data-bank-unit><option value="all">All units</option>' + units.map(function(l){
      return '<option value="' + esc(l.id) + '"' + (STATE.ui.bankUnit === l.id && !STATE.ui.bankSec ? ' selected' : '') + '>' + esc(l.title) + '</option>';
    }).join('') + '</select></label>' + (STATE.ui.bankSec ? '<button type="button" class="btn" data-bank-clear>Section: ' + esc(sectionTitle(STATE.ui.bankSec.split('-')[0], STATE.ui.bankSec) || STATE.ui.bankSec) + ' &times;</button>' : '') +
      (bankSearch ? '<button type="button" class="btn" data-bank-unsearch>Search: ' + esc(bankSearch) + ' &times;</button>' : '') + '</div>';
    html += pool.length ? cardHTML(pool[at], { ctx:'bank' }) +
      '<div class="qnav"><span class="faint">' + (at + 1) + ' of ' + pool.length + '</span><span class="btn-row" style="margin:0">' +
      '<button type="button" class="btn" data-bank-step="-1"' + (at ? '' : ' disabled') + '>Previous</button>' +
      '<button type="button" class="btn primary" data-bank-step="1"' + (at < pool.length - 1 ? '' : ' disabled') + '>Next</button></span></div>'
      : emptyHTML('No questions match', ['Try another unit or clear the filter.'], 'bank');
  }
  el.innerHTML = html;
  wireCards(el);
}

function wireBank(){
  var el = document.getElementById('panel-bank');
  el.addEventListener('click', function(e){
    var s = e.target.closest('[data-bank-step]');
    if(s){ STATE.ui.bankAt = Math.max(0, (STATE.ui.bankAt || 0) + +s.getAttribute('data-bank-step')); saveState(); renderBank(); return; }
    if(e.target.closest('[data-bank-clear]')){ STATE.ui.bankSec = null; STATE.ui.bankAt = 0; saveState(); renderBank(); return; }
    if(e.target.closest('[data-bank-unsearch]')){ bankSearch = ''; STATE.ui.bankAt = 0; renderBank(); }
  });
  el.addEventListener('change', function(e){
    var s = e.target.closest('[data-bank-unit]');
    if(s){ STATE.ui.bankUnit = s.value; STATE.ui.bankSec = null; STATE.ui.bankAt = 0; saveState(); renderBank(); }
  });
}
