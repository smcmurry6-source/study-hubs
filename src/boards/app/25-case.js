/* ====================================================================
   CASE SETS: one patient chart, visit-order questions with no verdicts, then a full review in Rounds.
   Progress lives under STATE.ui so it does not change the shared top-level state contract.
   ==================================================================== */
function caseChartHTML(c){
  return '<details class="case-chart" open><summary>Chart</summary><div class="case-chart-body"><h3>Patient chart</h3>' +
    pboxHTML(c.box) + (c.stim || []).map(figureHTML).join('') + '</div></details>';
}

function caseHasAllAnswers(c){
  return c.items.every(function(qid){ return !!STATE.answered[qid]; });
}

function caseProgress(c){
  if(!STATE.ui.caseProgress[c.id]) STATE.ui.caseProgress[c.id] = { next:0 };
  return STATE.ui.caseProgress[c.id];
}

function renderCase(el, caseId, opts){
  opts = opts || {};
  var c = CASE_BY_ID[caseId];
  if(!c){ el.innerHTML = (opts.prefix || '') + emptyHTML('Case set unavailable', ['Choose another case set.'], 'bank'); return; }
  var p = caseProgress(c), itemIds = c.items || [], next = Math.max(0, Math.min(itemIds.length, +p.next || 0));
  while(next < itemIds.length && STATE.answered[itemIds[next]]) next++;
  var rounds = !!opts.review || next >= itemIds.length || caseHasAllAnswers(c);
  var title = '<div class="case-title"><div><h3>' + esc(c.box && c.box.patient || c.id) + '</h3><p class="faint">' + plural(itemIds.length, 'question') + ' · ' + (rounds ? 'Rounds' : 'Question ' + (next + 1) + ' of ' + itemIds.length) + '</p></div>' +
    '<button type="button" class="btn" data-case-back>' + (opts.backLabel || 'Back to cases') + '</button></div>';
  var body = '';
  if(rounds){
    body = '<section class="case-rounds"><h3>Rounds</h3><p class="muted">Review the answers, reasons and cues from the whole visit.</p><div class="case-round-items">' + itemIds.map(function(qid, i){
      return '<div class="case-round-item"><h4>Question ' + (i + 1) + '</h4><div data-case-review-item="' + esc(qid) + '"></div></div>';
    }).join('') + '</div></section>';
  } else {
    var qid = itemIds[next];
    body = '<section class="case-current"><div class="case-stage-head"><span class="chip accent">Question ' + (next + 1) + ' of ' + itemIds.length + '</span><span class="faint">Lock in your answer to continue.</span></div>' +
      '<div data-case-current="' + esc(qid) + '"></div><div class="btn-row case-controls">' +
      '<button type="button" class="btn primary" data-case-lock disabled>Lock answer</button>' +
      '<button type="button" class="btn primary" data-case-next hidden>' + (next === itemIds.length - 1 ? 'See Rounds' : 'Next question') + '</button></div></section>';
  }
  el.innerHTML = (opts.prefix || '') + '<div class="case-view" data-case-id="' + esc(c.id) + '">' + title +
    '<div class="case-layout">' + caseChartHTML(c) + '<div class="case-content">' + body + '</div></div></div>';
  if(rounds){
    itemIds.forEach(function(id){ var host = $('[data-case-review-item="' + id + '"]', el); if(host) renderItem(host, id, { ctx:opts.ctx || 'case', review:true, caseView:true }); });
    return;
  }
  var current = $('[data-case-current]', el), card = renderItem(current, qid, { ctx:opts.ctx || 'case', lockIn:true, deferFeedback:true, caseView:true });
  var lock = $('[data-case-lock]', el), advance = $('[data-case-next]', el);
  current.addEventListener('click', function(){ lock.disabled = card.picked() == null; });
  lock.addEventListener('click', function(){
    if(!card.submit()) return;
    p.next = next + 1; p.pending = true; saveState();
    lock.hidden = true; advance.hidden = false;
  });
}
