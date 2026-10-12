/* ====================================================================
   TODAY (minimal): exam note, units grid with how much you've seen, a start button. int-notes-home adds
   Today's shift / Today's 12 (dailyPlan), Continue notes, readiness ("Likely right") and practice days.
   ==================================================================== */
function unitSeen(unit){
  var list = unitItems(unit), seen = 0;
  list.forEach(function(q){ if(STATE.answered[q.id]) seen++; });
  return { seen:seen, total:list.length };
}

function unitCardHTML(l){
  if(l.status !== 'taught' && !CONFIG.drafts) return '<div class="unit-card is-preview"><h4>' + esc(l.title) + '</h4><p class="faint">Coming soon</p></div>';
  var s = unitSeen(l.id);
  return '<div class="unit-card"><h4>' + esc(l.title) + '</h4><p class="faint">Seen ' + s.seen + ' of ' + s.total + '</p>' +
    '<span class="bar"><i style="width:' + pct(s.seen, s.total) + '%"></i></span>' +
    '<div class="btn-row" style="margin-top:6px"><button type="button" class="btn" data-home-practice="' + esc(l.id) + '">Practice</button>' +
    (READINGS[l.id] ? '<button type="button" class="btn" data-home-notes="' + esc(l.id) + '">Notes</button>' : '') + '</div></div>';
}

function renderHome(){
  var el = document.getElementById('panel-home'), sub = STATE.ui.sub.home || 'today';
  var taught = taughtUnits(), days = Object.keys(STATE.activeDates).length;
  var head = '<div class="panel-head"><div><h2>Today</h2><p>' + esc(CONFIG.examNote) + '. A little every day keeps two years of material in rotation.</p></div></div>';
  var html = head + subtabsHTML('home', sub);
  if(!taught.length){
    html += emptyHTML('The first units are coming soon', [
      'This hub is being built for the INBDE and ADEX, one unit at a time: notes, board-style questions that cite their sources, timed exam blocks, and Chairside, a clinic game that runs on the same questions.',
      'Medically complex patients and pharmacology come first, then periodontics.',
      'Your progress here will count toward the dashboard and the daily drill as soon as the first unit opens.'
    ], 'seed');
    if(LECTURES.length) html += '<div class="grid" style="margin-top:14px">' + LECTURES.map(unitCardHTML).join('') + '</div>';
  } else if(sub === 'readiness'){
    html += '<div class="box"><h3>Readiness by unit</h3><p class="muted">How much of each unit you have tried. "Likely right" estimates arrive with the daily plan.</p></div>' +
      '<div class="grid" style="margin-top:14px">' + LECTURES.map(unitCardHTML).join('') + '</div>';
  } else {
    html += '<div class="box"><h3>Start here</h3><p class="muted">' + plural(QUESTIONS.length, 'question') + ' in ' + plural(taught.length, 'unit') + ' so far' + (days ? '; you have practiced on ' + plural(days, 'day') : '') + '.</p>' +
      '<div class="btn-row"><button type="button" class="btn primary" data-home-practice="all">Practice questions</button>' +
      (notesUnits().length ? '<button type="button" class="btn" data-home-notes="">Read the notes</button>' : '') + '</div></div>' +
      '<div class="grid" style="margin-top:14px">' + LECTURES.map(unitCardHTML).join('') + '</div>';
  }
  el.innerHTML = html;
}

function wireHome(){
  var el = document.getElementById('panel-home');
  el.addEventListener('click', function(e){
    var p = e.target.closest('[data-home-practice]');
    if(p){ STATE.ui.bankUnit = p.getAttribute('data-home-practice'); STATE.ui.bankSec = null; STATE.ui.bankAt = 0; STATE.ui.sub.bank = 'practice'; saveState(); setMode('bank'); return; }
    var n = e.target.closest('[data-home-notes]');
    if(n){ if(n.getAttribute('data-home-notes')) STATE.ui.unit = n.getAttribute('data-home-notes'); saveState(); setMode('notes'); }
  });
}
