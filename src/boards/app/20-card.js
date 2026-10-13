/* ====================================================================
   ITEM CARD (minimal): one standalone MCQ. Options are shuffled on every render unless `fixed`, with `pin`
   indexes kept last; each button carries its AUTHORED index (data-i), which is what gets recorded.
   Feedback at once for standalones: verdict, ex, then the picked option's why line, then the others, the cue
   after a miss, source chips and "Read: <section>". int-cards replaces this with the full card (cases with
   Rounds, cover the options, Report, class row, lockIn API).
   ==================================================================== */
var LETTERS = 'ABCDEFGHIJ';

function choiceOrder(q){
  var n = (q.choices || []).length, all = [], pins = (q.pin || []).filter(function(i){ return i >= 0 && i < n; });
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
  var html = READINGS[unit] || '', m = html.match(new RegExp('<section[^>]*id="' + sec.replace(/[^a-z0-9-]/g, '') + '"[^>]*>[\\s\\S]*?<h2[^>]*>([\\s\\S]*?)</h2>'));
  return m ? m[1].replace(/<[^>]*>/g, '') : '';
}

function cardHTML(q, opts){
  opts = opts || {};
  var order = choiceOrder(q), u = LECTURE_BY_ID[q.lec];
  return '<article class="qcard" data-qid="' + esc(q.id) + '" data-ctx="' + esc(opts.ctx || 'bank') + '">' +
    '<div class="qcard-top"><span class="chip accent">' + esc(u ? u.short : q.lec) + '</span>' + (q.exam || []).map(function(e){ return '<span class="chip">' + esc(e.toUpperCase()) + '</span>'; }).join('') + '</div>' +
    pboxHTML(q.pbox) + (q.img ? figureHTML(q.img) : '') +
    '<p class="qcard-stem">' + esc(q.stem) + '</p>' +
    '<div class="qcard-choices">' + order.map(function(i, k){
      return '<button type="button" class="qchoice" data-i="' + i + '"><span class="lt">' + LETTERS[k] + '</span><span>' + esc(q.choices[i]) + '</span></button>';
    }).join('') + '</div><div class="qx" hidden></div></article>';
}

function explainHTML(q, picked){
  var right = picked === q.answer, rest = [];
  for(var i = 0; i < q.choices.length; i++) if(i !== picked) rest.push(i);
  var lines = [picked].concat(rest).map(function(i){
    return '<li class="' + (i === picked ? 'is-picked ' : '') + (i === q.answer ? 'is-key' : '') + '"><b>' + esc(q.choices[i]) + ':</b> ' + esc((q.why || [])[i] || '') + '</li>';
  }).join('');
  var title = q.sec ? sectionTitle(q.lec, q.sec) : '';
  return '<p class="qx-verdict ' + (right ? 'right' : 'wrong') + '">' + (right ? 'Correct.' : 'Not this time. The answer is ' + esc(q.choices[q.answer]) + '.') + '</p>' +
    '<p>' + esc(q.ex || '') + '</p><ul class="qx-why">' + lines + '</ul>' +
    (!right && q.cue ? '<p class="qx-cue"><b>Remember it:</b> ' + esc(q.cue) + '</p>' : '') +
    refChipsHTML(q) +
    (title ? '<div class="btn-row"><button type="button" class="btn" data-goto-sec="' + esc(q.sec) + '" data-goto-unit="' + esc(q.lec) + '">Read: ' + esc(title) + '</button></div>' : '');
}

/* wire every card inside `root`; onDone(q, correct) after an answer is recorded */
function wireCards(root, onDone){
  $$('.qcard', root).forEach(function(card){
    if(card.getAttribute('data-wired')) return; card.setAttribute('data-wired', '1');
    var q = QUESTION_BY_ID[card.getAttribute('data-qid')]; if(!q) return;
    card.addEventListener('click', function(e){
      var go = e.target.closest('[data-goto-sec]');
      if(go){ window.SH_GOTO({ unit:go.getAttribute('data-goto-unit'), sec:go.getAttribute('data-goto-sec') }); return; }
      var b = e.target.closest('.qchoice'); if(!b || card.getAttribute('data-done')) return;
      card.setAttribute('data-done', '1');
      var picked = +b.getAttribute('data-i'), right = picked === q.answer;
      $$('.qchoice', card).forEach(function(x){
        var i = +x.getAttribute('data-i'); x.disabled = true;
        if(i === q.answer) x.setAttribute('data-state', 'right'); else if(i === picked) x.setAttribute('data-state', 'wrong');
      });
      var qx = $('.qx', card); qx.innerHTML = explainHTML(q, picked); qx.hidden = false;
      recordAnswer(q, right, picked, card.getAttribute('data-ctx') || 'bank');
      if(onDone) onDone(q, right);
    });
  });
}
