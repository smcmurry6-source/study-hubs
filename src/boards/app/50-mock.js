/* ====================================================================
   EXAM BLOCKS: timed standalone and case blocks. Cards stay silent until a block is submitted.
   Keep this mode id starting with "mock" so the widget suppresses eggs, Timmy and the nuke.
   ==================================================================== */
var MOCK_LENGTHS = [5, 10, 20, 40, 60];
var mockTimer = null, mockCards = {}, mockWired = false;

function mockUnits(){ return LECTURES.filter(function(l){ return l.status === 'taught'; }); }

function mockSetup(){
  var s = STATE.ui.mockSetup, units = mockUnits(), valid = {};
  units.forEach(function(l){ valid[l.id] = true; });
  if(!s || typeof s !== 'object' || Array.isArray(s)) s = STATE.ui.mockSetup = { kind:'standalone', length:5, units:null };
  if(s.kind !== 'case' && s.kind !== 'standalone') s.kind = 'standalone';
  if(!Number.isInteger(+s.length) || +s.length < 1) s.length = 5;
  s.length = +s.length;
  if(!Array.isArray(s.units)) s.units = units.map(function(l){ return l.id; });
  else s.units = s.units.filter(function(id, i, all){ return valid[id] && all.indexOf(id) === i; });
  return s;
}

function mockUnitMap(unitIds){
  var out = {};
  (unitIds || []).forEach(function(id){ out[id] = true; });
  return out;
}

function mockCasesForUnits(unitMap){
  return CASES.filter(function(c){
    return (c.items || []).length && c.items.every(function(id){ var q = QUESTION_BY_ID[id]; return q && unitMap[q.lec]; });
  });
}

function mockEligibleCount(kind, unitIds){
  var unitMap = mockUnitMap(unitIds);
  if(kind === 'case') return mockCasesForUnits(unitMap).reduce(function(n, c){ return n + c.items.length; }, 0);
  return QUESTIONS.filter(function(q){ return !q.case && unitMap[q.lec]; }).length;
}

function mockLengthChoices(count){ return MOCK_LENGTHS.filter(function(n){ return n <= count; }); }

function mockEmptyHTML(){
  return emptyHTML('Exam blocks open once the first units are in', [
    'Standalone blocks give about ' + CONFIG.mock.standaloneSec + ' seconds a question and case blocks about ' + CONFIG.mock.caseSec + ' seconds, the pace of the real exam.',
    'They need enough checked questions to be worth timing, so they unlock with the first released units.'
  ], 'clock');
}

function mockTime(seconds){
  seconds = Math.max(0, Math.floor(+seconds || 0));
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

function mockBlockDate(block){
  var at = new Date(block.submittedAt || block.startedAt || Date.now());
  return at.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function mockBlockLabel(block){
  return (block.kind === 'case' ? 'Case block' : 'Standalone block') + ' · ' + plural((block.questions || []).length, 'question');
}

function mockUnitNames(unitIds){
  return (unitIds || []).map(function(id){ var l = LECTURE_BY_ID[id]; return l && (l.short || l.title); }).filter(Boolean).join(', ');
}

function mockSetupHTML(){
  var units = mockUnits(), s = mockSetup();
  if(!units.length) return mockEmptyHTML();
  var count = mockEligibleCount(s.kind, s.units), lengths = mockLengthChoices(count);
  if(lengths.indexOf(s.length) === -1 && lengths.length){
    var smaller = lengths.filter(function(n){ return n <= s.length; });
    s.length = smaller.length ? smaller[smaller.length - 1] : lengths[0];
  }
  var kindText = s.kind === 'case' ? 'questions in complete cases' : 'standalone questions';
  var lengthOptions = lengths.map(function(n){
    var estimate = n * CONFIG.mock[s.kind + 'Sec'];
    return '<option value="' + n + '"' + (s.length === n ? ' selected' : '') + '>' + n + ' questions · about ' + mockTime(estimate) + '</option>';
  }).join('');
  var unitsHTML = units.map(function(l){
    return '<label class="mock-unit-check"><input type="checkbox" data-mock-unit value="' + esc(l.id) + '"' + (s.units.indexOf(l.id) !== -1 ? ' checked' : '') + '><span>' + esc(l.title) + '</span></label>';
  }).join('');
  var html = '<div class="mock-setup-layout">' +
    '<section class="box mock-setup-card"><h3>Choose a block</h3><p class="muted">Set the block type and length. Your answers are recorded when you submit.</p>' +
    '<div class="mock-kind-switch" role="group" aria-label="Block type">' +
      '<button type="button" class="btn' + (s.kind === 'standalone' ? ' is-selected' : '') + '" data-mock-kind="standalone" aria-pressed="' + (s.kind === 'standalone') + '">Standalone</button>' +
      '<button type="button" class="btn' + (s.kind === 'case' ? ' is-selected' : '') + '" data-mock-kind="case" aria-pressed="' + (s.kind === 'case') + '">Cases</button>' +
    '</div>' +
    '<label class="field mock-length-field">Block length<select data-mock-length' + (!lengths.length ? ' disabled' : '') + '>' +
      (lengthOptions || '<option value="">No available lengths</option>') + '</select></label>' +
    '<p class="mock-availability-count">' + count + ' ' + kindText + ' available' + (s.kind === 'case' ? ' · complete cases stay together' : '') + '</p>' +
    '<button type="button" class="btn primary" data-mock-start' + (!lengths.length ? ' disabled' : '') + '>Start ' + (s.kind === 'case' ? 'case' : 'standalone') + ' block</button></section>' +
    '<section class="box mock-unit-card"><h3>Units</h3><p class="muted">Choose from published units.</p><div class="mock-unit-list">' + unitsHTML + '</div></section>' +
    '</div>';
  if(!lengths.length) html += '<div class="mock-unavailable">' + mockEmptyHTML() + '</div>';
  return html;
}

function mockCasePlan(unitIds, wanted){
  var cases = shuffled(mockCasesForUnits(mockUnitMap(unitIds))), chosen = [], qids = [], at = 0;
  while(qids.length < wanted && at < cases.length){
    var c = cases[at++]; chosen.push(c); qids = qids.concat(c.items);
  }
  return { cases:chosen, questions:qids };
}

function startMockBlock(){
  var s = mockSetup(), count = mockEligibleCount(s.kind, s.units), lengths = mockLengthChoices(count);
  if(!lengths.length || lengths.indexOf(s.length) === -1) return;
  var qids, cases = [];
  if(s.kind === 'case'){
    var plan = mockCasePlan(s.units, s.length); qids = plan.questions; cases = plan.cases.map(function(c){ return c.id; });
  } else {
    qids = shuffled(QUESTIONS.filter(function(q){ return !q.case && s.units.indexOf(q.lec) !== -1; })).slice(0, s.length).map(function(q){ return q.id; });
  }
  if(!qids || qids.length < s.length) return;
  var startedAt = Date.now(), secondsPerItem = CONFIG.mock[s.kind + 'Sec'];
  STATE.ui.mockActive = {
    id:'mock-' + startedAt + '-' + Math.random().toString(36).slice(2, 8),
    kind:s.kind, length:s.length, units:s.units.slice(), cases:cases, questions:qids,
    answers:{}, flags:{}, index:0, startedAt:startedAt, secondsPerItem:secondsPerItem,
    timeLimit:qids.length * secondsPerItem
  };
  STATE.ui.mockReviewId = null; STATE.ui.sub.mock = 'setup'; saveState(); renderMock();
}

function mockActiveHTML(active){
  var count = active.questions.length, at = Math.max(0, Math.min(count - 1, +active.index || 0));
  active.index = at;
  var nav = active.questions.map(function(qid, i){
    var q = QUESTION_BY_ID[qid], answered = typeof active.answers[qid] === 'number', flagged = !!active.flags[qid];
    return '<button type="button" class="mock-question-link' + (answered ? ' is-answered' : '') + (flagged ? ' is-flagged' : '') + '" data-mock-jump="' + i + '" aria-label="Question ' + (i + 1) + (answered ? ', answered' : ', not answered') + (flagged ? ', flagged for review' : '') + '"' + (i === at ? ' aria-current="step"' : '') + '>' + (i + 1) + '</button>';
  }).join('');
  var screens = active.questions.map(function(qid, i){
    var q = QUESTION_BY_ID[qid], c = active.kind === 'case' ? mockCaseForQuestion(qid, active) : null;
    return '<section class="mock-question-screen" data-mock-screen="' + i + '"' + (i === at ? '' : ' hidden') + '>' +
      '<div class="mock-question-meta"><span>Question ' + (i + 1) + ' of ' + count + '</span>' + (c ? '<span class="chip">' + esc(c.box && c.box.patient || c.id) + '</span>' : '') + '</div>' +
      (c ? '<div class="case-layout">' + caseChartHTML(c) + '<div class="case-content">' : '') +
      '<div data-mock-card-host="' + esc(qid) + '"></div>' +
      '<div class="mock-question-actions"><button type="button" class="btn mock-flag-button' + (active.flags[qid] ? ' is-flagged' : '') + '" data-mock-flag="' + esc(qid) + '" aria-pressed="' + (!!active.flags[qid]) + '">' + (active.flags[qid] ? 'Flagged for review' : 'Flag for review') + '</button></div>' +
      (c ? '</div></div>' : '') + '</section>';
  }).join('');
  return '<section class="mock-active" aria-label="Timed exam block">' +
    '<div class="mock-toolbar"><div><span class="chip accent">' + (active.kind === 'case' ? 'Case block' : 'Standalone block') + '</span><span class="mock-block-units">' + esc(mockUnitNames(active.units)) + '</span></div>' +
      '<div class="mock-countdown"><span>Time left</span><strong data-mock-countdown aria-live="off">' + mockTime(active.timeLimit) + '</strong></div></div>' +
    '<p class="mock-instructions">Choose one answer for each question. Answers and feedback stay hidden until you submit the block.</p>' +
    '<nav class="mock-navigator" aria-label="Question navigator">' + nav + '</nav>' +
    '<div class="mock-question-stack">' + screens + '</div>' +
    '<div class="mock-submit-row"><span class="muted">' + count + ' questions · ' + mockTime(active.timeLimit) + ' total</span><button type="button" class="btn primary" data-mock-submit>Submit block</button></div>' +
    '</section>';
}

function mockCaseForQuestion(qid, block){
  var q = QUESTION_BY_ID[qid], c = q && q.case && CASE_BY_ID[q.case];
  if(c) return c;
  for(var i = 0; i < (block.cases || []).length; i++){
    var byId = CASE_BY_ID[block.cases[i]];
    if(byId && (byId.items || []).indexOf(qid) !== -1) return byId;
  }
  return null;
}

function mockRenderActive(el, active){
  mockCards = {};
  active.questions.forEach(function(qid){
    var host = $('[data-mock-card-host="' + qid + '"]', el), q = QUESTION_BY_ID[qid];
    if(!host || !q) return;
    mockCards[qid] = renderItem(host, qid, {
      ctx:'mock', lockIn:true, deferFeedback:true, caseView:active.kind === 'case',
      initialPick:typeof active.answers[qid] === 'number' ? active.answers[qid] : null
    });
  });
  var current = $('[data-mock-screen="' + active.index + '"] .case-chart', el);
  if(current && window.matchMedia && window.matchMedia('(max-width: 639px)').matches) current.open = false;
  mockSyncNavigator(); mockUpdateCountdown();
}

function mockSyncNavigator(){
  var active = STATE.ui.mockActive; if(!active) return;
  $$('#panel-mock [data-mock-jump]').forEach(function(b){
    var i = +b.getAttribute('data-mock-jump'), qid = active.questions[i], answered = typeof active.answers[qid] === 'number', flagged = !!active.flags[qid];
    b.classList.toggle('is-answered', answered); b.classList.toggle('is-flagged', flagged);
    b.setAttribute('aria-label', 'Question ' + (i + 1) + (answered ? ', answered' : ', not answered') + (flagged ? ', flagged for review' : ''));
    if(i === active.index) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
}

function mockUpdateCountdown(){
  var active = STATE.ui.mockActive; if(!active) return;
  var remaining = Math.max(0, active.startedAt + active.timeLimit * 1000 - Date.now());
  var node = $('#panel-mock [data-mock-countdown]'); if(node) node.textContent = mockTime(Math.ceil(remaining / 1000));
  if(remaining <= 0) submitMockBlock(true);
}

function mockStopTimer(){ if(mockTimer){ clearInterval(mockTimer); mockTimer = null; } }
function mockStartTimer(){ mockStopTimer(); if(STATE.ui.mockActive) mockTimer = setInterval(mockUpdateCountdown, 250); }

function submitMockBlock(expired){
  var active = STATE.ui.mockActive; if(!active || active.submitting) return;
  active.submitting = true; mockStopTimer();
  var submittedAt = Date.now(), correct = 0, answers = {};
  active.questions.forEach(function(qid){
    var q = QUESTION_BY_ID[qid], picked = typeof active.answers[qid] === 'number' ? active.answers[qid] : null;
    answers[qid] = picked;
    if(!q) return;
    if(picked === q.answer) correct++;
  });
  var timeUsed = Math.min(active.timeLimit, Math.max(0, Math.floor((submittedAt - active.startedAt) / 1000)));
  var block = {
    id:active.id, kind:active.kind, length:active.length, units:active.units.slice(), cases:active.cases.slice(),
    questions:active.questions.slice(), answers:answers, flags:Object.assign({}, active.flags),
    correct:correct, total:active.questions.length, startedAt:active.startedAt, submittedAt:submittedAt,
    timeLimit:active.timeLimit, timeUsed:timeUsed, expired:!!expired
  };
  /* Clear the active block before the cards record, so a second submit cannot record the same picks again. */
  STATE.ui.mockActive = null; saveState();
  active.questions.forEach(function(qid){
    if(answers[qid] === null) return;
    var card = mockCards[qid], q = QUESTION_BY_ID[qid];
    if(card) card.submit();
    else if(q) recordAnswer(q, answers[qid] === q.answer, answers[qid], 'mock');
  });
  STATE.mockBlocks.unshift(block); if(STATE.mockBlocks.length > 25) STATE.mockBlocks.length = 25;
  STATE.ui.mockReviewId = block.id; STATE.ui.mockFilter = 'all'; STATE.ui.sub.mock = 'review'; saveState();
  document.dispatchEvent(new CustomEvent('sh:mock-done', { detail:{ correct:correct, total:block.total } }));
  renderMock();
}

function mockReviewFilterItems(block){
  var filter = STATE.ui.mockFilter || 'all';
  return (block.questions || []).filter(function(qid){
    var q = QUESTION_BY_ID[qid], answer = block.answers && block.answers[qid], missed = !q || answer !== q.answer, flagged = !!(block.flags && block.flags[qid]);
    if(filter === 'missed') return missed;
    if(filter === 'flagged') return flagged;
    if(filter === 'missed-flagged') return missed || flagged;
    return true;
  });
}

function mockReviewItemHTML(block, qid, i){
  var q = QUESTION_BY_ID[qid]; if(!q) return '';
  var answer = block.answers && Object.prototype.hasOwnProperty.call(block.answers, qid) ? block.answers[qid] : null;
  var missed = answer !== q.answer, flagged = !!(block.flags && block.flags[qid]);
  return '<article class="mock-review-item' + (missed ? ' is-missed' : ' is-correct') + (flagged ? ' is-flagged' : '') + '">' +
    '<div class="mock-review-item-head"><h4>Question ' + i + '</h4><span class="chip' + (missed ? '' : ' accent') + '">' + (missed ? (answer === null ? 'Unanswered' : 'Missed') : 'Correct') + '</span>' +
    (flagged ? '<span class="chip mock-flag-chip">Flagged for review</span>' : '') + '</div>' +
    '<div data-mock-review-host="' + esc(qid) + '"></div></article>';
}

function mockReviewGroups(block, ids){
  if(block.kind !== 'case') return [{ case:null, ids:ids }];
  var groups = [], byId = {};
  ids.forEach(function(qid){
    var c = mockCaseForQuestion(qid, block), key = c ? c.id : '_other';
    if(!byId[key]){ byId[key] = { case:c, ids:[] }; groups.push(byId[key]); }
    byId[key].ids.push(qid);
  });
  return groups;
}

function mockReviewDetailHTML(block){
  var ids = mockReviewFilterItems(block), total = block.total || (block.questions || []).length;
  var filter = STATE.ui.mockFilter || 'all', groups = mockReviewGroups(block, ids), index = {};
  (block.questions || []).forEach(function(qid, i){ index[qid] = i + 1; });
  var items = groups.map(function(group){
    var cards = group.ids.map(function(qid){ return mockReviewItemHTML(block, qid, index[qid] || 1); }).join('');
    return group.case ? '<section class="mock-review-case"><div class="case-layout">' + caseChartHTML(group.case) + '<div class="case-content">' + cards + '</div></div></section>' : '<div class="mock-review-list">' + cards + '</div>';
  }).join('');
  if(!ids.length) items = emptyHTML('No questions match this filter', ['Choose another review filter to see more of this block.'], 'clock');
  var unitNames = mockUnitNames(block.units);
  return '<section class="mock-review-detail"><div class="mock-review-summary">' +
    '<div><span class="chip accent">' + (block.kind === 'case' ? 'Case block' : 'Standalone block') + '</span><h3>' + (block.correct || 0) + ' of ' + total + ' correct</h3><p class="muted">' + pct(block.correct || 0, total) + '% · ' + (block.expired ? 'Time expired' : 'Submitted') + ' · ' + mockBlockDate(block) + '</p>' +
    (unitNames ? '<p class="faint">' + esc(unitNames) + '</p>' : '') + '</div>' +
    '<dl class="mock-review-metrics"><div><dt>Time used</dt><dd>' + mockTime(block.timeUsed || 0) + '</dd></div><div><dt>Block time</dt><dd>' + mockTime(block.timeLimit || 0) + '</dd></div></dl></div>' +
    '<div class="filters mock-review-filters"><label class="field">Show<select data-mock-filter><option value="all"' + (filter === 'all' ? ' selected' : '') + '>All questions</option><option value="missed"' + (filter === 'missed' ? ' selected' : '') + '>Missed</option><option value="flagged"' + (filter === 'flagged' ? ' selected' : '') + '>Flagged</option><option value="missed-flagged"' + (filter === 'missed-flagged' ? ' selected' : '') + '>Missed or flagged</option></select></label></div>' +
    '<div class="mock-review-items">' + items + '</div></section>';
}

function mockReviewHTML(){
  var blocks = STATE.mockBlocks || [], selected = null;
  for(var i = 0; i < blocks.length; i++) if(blocks[i].id === STATE.ui.mockReviewId){ selected = blocks[i]; break; }
  if(!selected && blocks.length){ selected = blocks[0]; STATE.ui.mockReviewId = selected.id; }
  var active = STATE.ui.mockActive ? '<div class="mock-active-notice"><span>Block in progress · <b data-mock-countdown>' + mockTime(Math.max(0, Math.ceil((STATE.ui.mockActive.startedAt + STATE.ui.mockActive.timeLimit * 1000 - Date.now()) / 1000))) + '</b> left</span><button type="button" class="btn" data-mock-return>Return to block</button></div>' : '';
  if(!blocks.length) return active + emptyHTML('No blocks taken yet', ['Your finished blocks and their reviews will be listed here.'], 'clock');
  var nav = blocks.map(function(b){
    var current = selected && selected.id === b.id;
    return '<button type="button" class="mock-history-item' + (current ? ' is-active' : '') + '" data-mock-review="' + esc(b.id) + '"' + (current ? ' aria-current="true"' : '') + '><span>' + esc(mockBlockDate(b)) + '</span><b>' + esc(mockBlockLabel(b)) + '</b><span>' + (b.correct || 0) + ' / ' + (b.total || b.questions.length) + ' correct</span></button>';
  }).join('');
  return active + '<div class="mock-review-layout"><aside class="mock-history"><h3>Past blocks</h3><div class="mock-history-list">' + nav + '</div></aside>' + mockReviewDetailHTML(selected) + '</div>';
}

function mockRenderReviewCards(el, block){
  if(!block) return;
  $$('[data-mock-review-host]', el).forEach(function(host){
    var qid = host.getAttribute('data-mock-review-host'), q = QUESTION_BY_ID[qid];
    if(!q) return;
    var answer = block.answers && Object.prototype.hasOwnProperty.call(block.answers, qid) ? block.answers[qid] : null;
    renderItem(host, qid, { ctx:'mock', review:true, caseView:block.kind === 'case', reviewChoice:answer });
  });
}

function renderMock(){
  var el = document.getElementById('panel-mock'), sub = STATE.ui.sub.mock || 'setup';
  mockStopTimer();
  if(!mockWired) wireMock(el);
  var head = '<div class="panel-head"><div><h2>Exam blocks</h2><p>Timed INBDE-style blocks with a full review after you submit.</p></div></div>';
  var prefix = head + subtabsHTML('mock', sub);
  if(sub === 'review'){
    el.innerHTML = prefix + mockReviewHTML();
    var selected = (STATE.mockBlocks || []).filter(function(b){ return b.id === STATE.ui.mockReviewId; })[0] || (STATE.mockBlocks || [])[0];
    mockRenderReviewCards(el, selected);
    if(STATE.ui.mockActive) mockStartTimer();
    return;
  }
  if(STATE.ui.mockActive){
    el.innerHTML = prefix + mockActiveHTML(STATE.ui.mockActive);
    mockRenderActive(el, STATE.ui.mockActive); mockStartTimer();
    return;
  }
  el.innerHTML = prefix + mockSetupHTML();
}

function wireMock(el){
  if(!el) return; mockWired = true;
  el.addEventListener('click', function(e){
    var active = STATE.ui.mockActive;
    var kind = e.target.closest('[data-mock-kind]');
    if(kind){ var s = mockSetup(); s.kind = kind.getAttribute('data-mock-kind'); saveState(); renderMock(); return; }
    var start = e.target.closest('[data-mock-start]'); if(start){ startMockBlock(); return; }
    var jump = e.target.closest('[data-mock-jump]');
    if(jump && active){ active.index = +jump.getAttribute('data-mock-jump'); saveState(); renderMock(); return; }
    var flag = e.target.closest('[data-mock-flag]');
    if(flag && active){
      var qid = flag.getAttribute('data-mock-flag'); active.flags[qid] = !active.flags[qid]; saveState();
      flag.classList.toggle('is-flagged', !!active.flags[qid]); flag.setAttribute('aria-pressed', String(!!active.flags[qid]));
      flag.textContent = active.flags[qid] ? 'Flagged for review' : 'Flag for review'; mockSyncNavigator(); return;
    }
    if(e.target.closest('[data-mock-submit]')){ submitMockBlock(false); return; }
    if(e.target.closest('[data-mock-return]')){ STATE.ui.sub.mock = 'setup'; saveState(); renderMock(); return; }
    var review = e.target.closest('[data-mock-review]');
    if(review){ STATE.ui.mockReviewId = review.getAttribute('data-mock-review'); STATE.ui.mockFilter = 'all'; saveState(); renderMock(); return; }
    var choice = e.target.closest('.qchoice');
    if(choice && active){
      var card = choice.closest('.qcard'), selectedQid = card && card.getAttribute('data-qid'), controller = selectedQid && mockCards[selectedQid];
      if(controller){ active.answers[selectedQid] = controller.picked(); saveState(); mockSyncNavigator(); }
    }
  });
  el.addEventListener('change', function(e){
    var target = e.target, s = mockSetup();
    if(target.matches('[data-mock-length]')) s.length = +target.value;
    else if(target.matches('[data-mock-unit]')){
      if(target.checked && s.units.indexOf(target.value) === -1) s.units.push(target.value);
      if(!target.checked) s.units = s.units.filter(function(id){ return id !== target.value; });
    } else if(target.matches('[data-mock-filter]')) STATE.ui.mockFilter = target.value;
    else return;
    saveState(); renderMock();
  });
}
