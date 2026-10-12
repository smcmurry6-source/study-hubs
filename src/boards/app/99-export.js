/* ====================================================================
   WIDGET HOOKS: SH_SECTION (activity_pings read as "notes/medcx/core", "bank/practice"...), SH_GOTO (search
   results, "Read: <section>"), SH_DRILL (only once there are questions) and SH_EXPORT, which must stay the LAST
   statement of the script: tools/ci/smoke.js injects its lint hook just before the SH_EXPORT assignment.
   ==================================================================== */
window.SH_SECTION = function(){
  var m = STATE.ui.mode;
  if(m === 'home') return 'home/' + (STATE.ui.sub.home || 'today');
  if(m === 'notes') return 'notes/' + (notesUnits().length ? STATE.ui.unit || notesUnits()[0].id : 'none') + '/' + (STATE.ui.level === 'deep' ? 'deep' : 'core');
  if(m === 'bank') return 'bank/' + (STATE.ui.sub.bank || 'practice');
  if(m === 'mock') return 'mock/' + (STATE.ui.sub.mock || 'setup');
  if(m === 'arcade') return 'arcade/lobby';
  return m;
};

function flashIn(find){
  setTimeout(function(){ var el = find(); if(!el) return; el.scrollIntoView({ block:'start' }); if(window.shFlash) window.shFlash(el); }, 60);
}
/* go: {unit, sec} (notes), {qid} (one question), or the widget search's {v:'bank', q} */
window.SH_GOTO = function(go){
  if(!go) return;
  if(go.qid && QUESTION_BY_ID[go.qid]){
    var q = QUESTION_BY_ID[go.qid];
    STATE.ui.bankUnit = q.lec; STATE.ui.bankSec = null; STATE.ui.sub.bank = 'practice'; bankSearch = '';
    STATE.ui.bankAt = Math.max(0, bankPool().indexOf(q)); saveState(); setMode('bank');
  } else if(go.v === 'bank'){
    bankSearch = go.q || ''; STATE.ui.bankUnit = 'all'; STATE.ui.bankSec = null; STATE.ui.bankAt = 0; STATE.ui.sub.bank = 'practice'; saveState(); setMode('bank');
  } else if(go.unit && READINGS[go.unit]){
    STATE.ui.unit = go.unit; saveState(); setMode('notes');
    if(go.sec) flashIn(function(){ return document.getElementById(go.sec); });
  }
};

if(QUESTIONS.length){
  window.SH_DRILL = {
    size: CONFIG.budget.daily,
    scope: 'all',
    pool: function(){
      return QUESTIONS.filter(function(q){ return !q.case; }).map(function(q){ var a = STATE.answered[q.id]; return { id:q.id, lec:q.lec, last: a ? !!a.lastCorrect : null, hy: q.hy || '' }; });
    },
    render: function(el, qid){ var q = QUESTION_BY_ID[qid]; if(!q || q.case) return false; el.innerHTML = cardHTML(q, { ctx:'drill' }); wireCards(el); return true; }
  };
}

window.SH_EXPORT = {
  lectures: LECTURES.map(function(l){ return { id:l.id, title:l.title, status:l.status }; }),
  questions: QUESTIONS.map(function(q){ return { id:q.id, lec:q.lec, text:q.stem, hint:q.choices[q.answer] + (q.ex ? ' — ' + q.ex : ''), choices:q.choices, answer:q.answer }; }),
  cases: CASES.map(function(c){ return { id:c.id, units:c.units, items:c.items }; }),
  sections: SECTIONS,
  hints: [],
  exams: []
};
