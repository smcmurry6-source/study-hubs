/* ====================================================================
   NOTES (minimal reader): unit list, Core / Deep dive (same section ids, so the toggle keeps the place),
   "Practice this section" buttons. int-notes-home adds recall tables, source chips and Listen.
   ==================================================================== */
function notesUnits(){ return taughtUnits().filter(function(l){ return READINGS[l.id]; }); }

function renderNotes(){
  var el = document.getElementById('panel-notes'), level = STATE.ui.level === 'deep' ? 'deep' : 'core';
  var list = notesUnits();
  var head = '<div class="panel-head"><div><h2>Notes</h2><p>Core is what the exam asks, in plain words. Deep dive adds the mechanisms and the evidence behind each rule.</p></div></div>';
  if(!list.length){
    el.innerHTML = head + subtabsHTML('notes', level) + emptyHTML('Notes for the first units are on the way', [
      'Each unit gets Core notes, a Deep dive with the same sections, and review tables for the look-alikes.',
      'The hub grows unit by unit; nothing to catch up on yet.'
    ], 'notes');
    return;
  }
  var unit = LECTURE_BY_ID[STATE.ui.unit] && READINGS[STATE.ui.unit] ? STATE.ui.unit : list[0].id;
  STATE.ui.unit = unit;
  var body = level === 'deep' && READINGS_DEEP[unit] ? READINGS_DEEP[unit] : READINGS[unit];
  el.innerHTML = head + subtabsHTML('notes', level) +
    '<div class="notes-layout"><nav class="unit-nav" aria-label="Units">' + list.map(function(l){
      return '<button type="button" data-unit="' + esc(l.id) + '" class="' + (l.id === unit ? 'is-active' : '') + '">' + esc(l.title) + '</button>';
    }).join('') + '</nav><article class="reading">' +
    (level === 'deep' && !READINGS_DEEP[unit] ? '<p class="faint">The Deep dive for this unit is still being written; here are the Core notes.</p>' : '') +
    body + '</article></div>';
  $$('figure[data-fig]', el).forEach(function(f){ var k = f.getAttribute('data-fig'); if(FIGURES[k]){ f.innerHTML = FIGURES[k].svg; f.setAttribute('role', 'img'); f.setAttribute('aria-label', FIGURES[k].alt); } });
}

function wireNotes(){
  var el = document.getElementById('panel-notes');
  el.addEventListener('click', function(e){
    var u = e.target.closest('[data-unit]');
    if(u){ STATE.ui.unit = u.getAttribute('data-unit'); saveState(); renderNotes(); window.scrollTo(0, 0); return; }
    var p = e.target.closest('[data-practice]');
    if(p){
      var v = p.getAttribute('data-practice');
      if(v.indexOf('sec:') === 0){ STATE.ui.bankSec = v.slice(4); STATE.ui.bankUnit = 'all'; }
      else if(v.indexOf('unit:') === 0){ STATE.ui.bankSec = null; STATE.ui.bankUnit = v.slice(5); }
      STATE.ui.bankAt = 0; STATE.ui.sub.bank = 'practice'; saveState(); setMode('bank');
    }
  });
}
