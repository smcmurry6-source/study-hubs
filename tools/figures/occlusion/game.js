/* ---------- "WHAT CUSP HITS WHERE?" (mini game at the top of the Question Bank, 2026-10-20) ----------
   Two modes, 10 rounds each, built on the help sheet's rules (OD.CONTACTS):
   - Contacts: a cusp on one arch is lit; tap the fossa it lands in on the other arch. Class I most often, II and III too,
     right and left sides. After each tap the lower row slides into its class position and the contact lines appear.
   - Movements: "What is the cusp and motion in this picture?" One tooth, one arrow from its MIP contact (the base of
     the arrow): name the movement first, then the cusp that made it (the help sheet's two-step method).
   Rounds are generated, not bank questions, so they don't count in class stats; the best score is kept in STATE.cusp. */
var CUSP_GAME = (function(){
  var R = 10, st = null, host = null;
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }
  function cname(arch, t, c, side){ return OD.CUSP_NAME[c] + ' cusp of #' + OD.NUMS[arch][side][t]; }
  function fname(arch, t, f, side){ return OD.FOSSA_NAME[f] + ' of #' + OD.NUMS[arch][side][t]; }
  function best(){ if(!STATE.cusp) STATE.cusp = { best:{ contacts:0, moves:0 }, plays:0 }; return STATE.cusp; }
  function classPick(){ var r = Math.random(); return r < .5 ? 1 : r < .75 ? 2 : 3; }
  /* ---- contacts ---- */
  function newContact(){
    var cls = classPick(), side = Math.random() < .6 ? 'R' : 'L', list = OD.CONTACTS[cls], c;
    do { c = pick(list); } while(st.last && st.last === cls + c.join());
    st.last = cls + c.join();
    return { mode:'contacts', cls:cls, side:side, c:c, done:false };
  }
  function contactSVG(rd, reveal){
    var q = OD.quad(rd.cls, rd.side, { x0:40, k:8.2, yMax:72, yMand:214, W:480 }), c = rd.c, from = c[0], to = from === 'mand' ? 'max' : 'mand';
    var src = q[from].teeth[c[1]].pt[c[2]], s = '';
    /* before answering the rows are lined up at the canines (no hint); the reveal slides the lower row to its class position */
    var dx = q.dx, shiftAll = rd.side === 'R' ? Math.max(0, -(40 + dx - 6)) : -Math.max(0, dx - 34);
    /* reveal: drawn at the canine-aligned start, then slid into place (CUSP_GAME.draw sets the target transform) */
    s += '<g class="cg-all" data-to="' + OD.f1(reveal ? shiftAll : 0) + '" style="transform:translateX(0px)">' + q.max.svg + OD.numLabels(q.max, 0, false);
    s += '<g class="cg-low" data-to="' + OD.f1(reveal ? dx : 0) + '" style="transform:translateX(0px)">' + q.mand.svg + OD.numLabels(q.mand, 0, true);
    var mandTargets = '', maxTargets = '';
    ['max', 'mand'].forEach(function(a){
      OD.ORDER.forEach(function(t){ if(t === 'C') return; var tt = q[a].teeth[t];
        Object.keys(OD.SPEC[(a === 'max' ? 'max' : 'man') + t].fossae).forEach(function(f){
          var p = tt.pt[f], ok = to === a && t === c[3] && (f === c[4] || f === c[5]), chosen = rd.tap && rd.tap.t === t && rd.tap.f === f && rd.tap.a === a;
          var cls = 'cg-hot' + (rd.done ? (ok ? ' ok' : chosen ? ' bad' : '') : '') + (to !== a ? ' off' : '');
          var g = '<circle class="' + cls + '" data-cg-hot="' + a + ':' + t + ':' + f + '" cx="' + OD.f1(p[0]) + '" cy="' + OD.f1(p[1]) + '" r="12.5" tabindex="' + (to === a && !rd.done ? 0 : -1) + '" role="button" aria-label="' + escHtml(fname(a, t, f, rd.side)) + '"/>';
          if(a === 'mand') mandTargets += g; else maxTargets += g;
        });
      });
    });
    s += mandTargets;
    var sp = src, srcMark = '<circle class="cg-src" cx="' + OD.f1(sp[0]) + '" cy="' + OD.f1(sp[1]) + '" r="9"/><circle class="cg-src-ring" cx="' + OD.f1(sp[0]) + '" cy="' + OD.f1(sp[1]) + '" r="15"/>';
    if(from === 'mand') s += srcMark;
    s += '</g>' + maxTargets + (from === 'max' ? srcMark : '');
    if(reveal){ var hl = OD.CONTACTS[rd.cls].indexOf(c); s += '<g class="cg-lines">' + OD.contactLines(q, rd.cls, { hl:hl }) + '</g>'; }
    s += '</g>';
    s += OD.txt(6, 76, 'Upper', 'fg-t sm') + OD.txt(6, 218, 'Lower', 'fg-t sm');
    return '<svg class="cg-svg" viewBox="0 0 480 280" role="img" aria-label="Upper and lower posterior teeth, occlusal views">' + s + '</svg>';
  }
  function contactExplain(rd){
    var c = rd.c, cls = rd.cls, from = c[0], to = from === 'mand' ? 'max' : 'mand';
    var right = fname(to, c[3], c[4], rd.side) + (c[5] ? ' (or as far back as the ' + OD.FOSSA_NAME[c[5]] + ': the help sheet calls this posterior contact "highly variable")' : '');
    var why = '';
    if(c[3].indexOf('PM') === 0) why = cls === 2 ? 'Class II flips the premolar rule: upper premolars take contacts in their DISTAL fossae, lower premolars in their MESIAL fossae.' : 'Class I and III premolars: upper contacts in the MESIAL fossae, lower contacts in the DISTAL fossae.';
    else why = 'Molars have an anterior and a posterior opposing contact. ' + (cls === 1 ? 'Anchor on the first molar\'s posterior contact (the DB cusp of #30 on #3) and step from there.' : cls === 2 ? 'In Class II everything steps back one post from Class I.' : 'In Class III everything comes forward one post from Class I.');
    return 'The <b>' + escHtml(cname(from, c[1], c[2], rd.side)) + '</b> lands in the <b>' + escHtml(right) + '</b>. ' + why + ' The fence post only shows which cusp comes closest; the anatomy (cusp-fossa) names the spot.';
  }
  /* ---- movements ---- */
  var MOVES = [['P','Protrusive'],['W','Working (laterotrusive)'],['NW','Non-working (mediotrusive)'],['R','Retrusive']];
  function newMove(){
    var arch = Math.random() < .5 ? 'max' : 'mand', side = Math.random() < .6 ? 'R' : 'L';
    /* a Class I contact landing on this arch */
    var list = OD.CONTACTS[1].filter(function(c){ return (c[0] === 'mand') === (arch === 'max') && c[3].indexOf('M') === 0; });
    var c = pick(list), mv = pick(['P','W','NW','R','P','W','NW']);
    return { mode:'moves', arch:arch, side:side, c:c, mv:mv, step:1, done:false };
  }
  function moveVec(arch, mv){
    /* tooth-relative unit vector [mesial+, buccal+] for the opposing cusp's path */
    var s15 = Math.sin(15 * Math.PI / 180), c15 = Math.cos(15 * Math.PI / 180), r = Math.SQRT1_2;
    if(arch === 'max') return { P:[1,0], W:[s15,c15], NW:[r,-r], R:[-.42,0] }[mv];
    return { P:[-1,0], W:[-s15,-c15], NW:[-r,r], R:[.42,0] }[mv];
  }
  function moveSVG(rd){
    var arch = rd.arch, key = (arch === 'max' ? 'max' : 'man') + rd.c[3], mirror = rd.side === 'L';
    var t = OD.tooth(key, { x:110, y:60, k:16, flip:arch === 'mand', mirror:mirror }), b = t.pt[rd.c[4]];
    var v = moveVec(arch, rd.mv), mx = mirror ? 1 : -1, by = arch === 'max' ? -1 : 1, L = 96;
    var e = [b[0] + v[0] * mx * L, b[1] + v[1] * by * L];
    var s = t.svg + '<circle class="od-ghost" cx="' + OD.f1(b[0]) + '" cy="' + OD.f1(b[1]) + '" r="11"/>' + OD.arrow(b[0], b[1], e[0], e[1], 'fg-acc', 12) + '<circle class="fg-dot" cx="' + OD.f1(b[0]) + '" cy="' + OD.f1(b[1]) + '" r="5"/>';
    var top = arch === 'max' ? 'BUCCAL' : 'LINGUAL', bot = arch === 'max' ? 'PALATAL' : 'BUCCAL';
    s += OD.txt(t.cx, 34, top, 'fg-t', 'middle') + OD.txt(t.cx, 60 + t.h + 26, bot, 'fg-t', 'middle');
    s += OD.txt(mirror ? t.x + t.w + 14 : 8, t.cy + 4, 'MESIAL', 'fg-t sm') + OD.txt(mirror ? 8 : t.x + t.w + 14, t.cy + 4, 'DISTAL', 'fg-t sm');
    s += OD.txt(t.cx, 16, '#' + OD.NUMS[arch][rd.side][rd.c[3]] + ' (' + (arch === 'max' ? 'maxillary ' : 'mandibular ') + (rd.side === 'R' ? 'right ' : 'left ') + OD.TOOTH_NAME[rd.c[3]] + '), occlusal view', 'fg-t sm', 'middle');
    return '<svg class="cg-svg" viewBox="0 0 420 ' + OD.f1(60 + t.h + 40) + '" role="img" aria-label="Occlusal view of one tooth with a cusp pathway arrow">' + s + '</svg>';
  }
  function cuspChoices(rd){
    var c = rd.c, from = c[0], side = rd.side, right = cname(from, c[1], c[2], side);
    var pool = [];
    OD.CONTACTS[1].forEach(function(x){ if(x[0] === from && x.join() !== c.join()) pool.push(cname(from, x[1], x[2], side)); });
    /* a non-centric cusp of the same opposing tooth is the classic trap */
    var nonCentric = from === 'mand' ? (c[1].indexOf('M') === 0 ? 'ML' : 'L') : (c[1].indexOf('M') === 0 ? 'MB' : 'B');
    var opts = [right, cname(from, c[1], nonCentric, side)];
    pool = shuffled(pool.filter(function(p){ return opts.indexOf(p) === -1; }));
    while(opts.length < 4 && pool.length) opts.push(pool.shift());
    return { right:right, opts:shuffled(opts) };
  }
  function moveExplain(rd){
    var nm = MOVES.filter(function(m){ return m[0] === rd.mv; })[0][1];
    var rule = rd.arch === 'max' ? 'On an UPPER tooth you watch a lower cusp: protrusive runs mesial, working toward buccal (leaning a little mesial), non-working mesiopalatal, retrusive a short way distal.'
                                 : 'On a LOWER tooth you watch an upper cusp, so it all reverses: protrusive runs distal, working toward lingual (leaning a little distal), non-working distobuccal, retrusive a short way mesial.';
    return '<b>' + nm + '</b>, made by the <b>' + escHtml(cname(rd.c[0], rd.c[1], rd.c[2], rd.side)) + '</b> (in MIP it sits in the ' + escHtml(fname(rd.arch, rd.c[3], rd.c[4], rd.side)) + ', the base of the arrow). ' + rule;
  }
  /* ---- shell ---- */
  function start(mode){ st = { mode:mode, n:0, score:0, streak:0, rd:null, last:null }; next(); }
  function next(){ st.n++; st.rd = st.mode === 'contacts' ? newContact() : newMove(); if(st.rd.mode === 'moves') st.rd.choices = cuspChoices(st.rd); draw(); }
  function finish(){
    var b = best(); b.plays = (b.plays || 0) + 1; var isBest = st.score > (b.best[st.mode] || 0); if(isBest) b.best[st.mode] = st.score; saveState();
    host.innerHTML = '<div class="cg-card cg-end"><div class="cg-head"><b>What cusp hits where?</b><button type="button" class="cg-x" data-cg="close" aria-label="Close the game">' + '&times;' + '</button></div>' +
      '<p class="cg-big">' + st.score + ' / ' + R + '</p><p>' + (isBest ? 'New best for ' + (st.mode === 'contacts' ? 'Contacts' : 'Movements') + '.' : 'Best: ' + b.best[st.mode] + ' / ' + R + '.') + ' ' +
      (st.score >= 9 ? 'Board-ready.' : st.score >= 6 ? 'Solid. One more round locks it in.' : 'Open the fence post in the L1 notes, then try again.') + '</p>' +
      '<div class="cg-btns"><button type="button" class="btn primary" data-cg="again">Play again</button><button type="button" class="btn" data-cg="' + (st.mode === 'contacts' ? 'moves' : 'contacts') + '">Try ' + (st.mode === 'contacts' ? 'Movements' : 'Contacts') + '</button></div></div>';
  }
  function draw(){
    var rd = st.rd, h = '<div class="cg-card" data-cg-mode="' + st.mode + '"><div class="cg-head"><b>What cusp hits where?</b><span class="cg-meta">Round ' + st.n + ' / ' + R + ' · ' + st.score + ' right' + (st.streak >= 3 ? ' · ' + st.streak + ' in a row' : '') + '</span><button type="button" class="cg-x" data-cg="close" aria-label="Close the game">' + '&times;' + '</button></div>';
    if(rd.mode === 'contacts'){
      var c = rd.c;
      h += '<p class="cg-q"><span class="cg-tag">Class ' + OD.ROMAN[rd.cls] + ' · cusp-fossa</span> Where does the <b>' + escHtml(cname(c[0], c[1], c[2], rd.side)) + '</b> land? <span class="cg-sub">Tap the fossa on the ' + (c[0] === 'mand' ? 'upper' : 'lower') + ' teeth.</span></p>';
      h += '<div class="cg-stage">' + contactSVG(rd, rd.done) + '</div>';
      if(!rd.done) h += '<div class="cg-btns"><button type="button" class="btn" data-cg="hint" aria-expanded="' + (!!rd.hint) + '">' + (rd.hint ? 'Hide' : 'Show') + ' the Class ' + OD.ROMAN[rd.cls] + ' fence post</button></div>' + (rd.hint ? '<div class="cg-fp">' + OD.fencePostSVG(rd.cls, { u:40, x0:60 }) + '</div>' : '');
      else h += '<div class="cg-fb ' + (rd.ok ? 'ok' : 'bad') + '"><b>' + (rd.ok ? 'Right.' : 'Not quite.') + '</b> ' + contactExplain(rd) + '</div><div class="cg-fp">' + OD.fencePostSVG(rd.cls, { u:40, x0:60, hl:{ mand:c[0] === 'mand' ? fpUnit(c[1], c[2]) : null }, hlMax:c[0] === 'max' ? [fpUnit(c[1], c[2])] : [] }) + '</div>';
    } else {
      h += '<p class="cg-q"><span class="cg-tag">' + (rd.step === 1 ? 'Step 1 of 2' : 'Step 2 of 2') + '</span> ' + (rd.step === 1 ? 'Which movement does this arrow show?' : 'Which cusp makes this path?') + ' <span class="cg-sub">Class I. The MIP contact is at the base of the arrow.</span></p>';
      h += '<div class="cg-stage">' + moveSVG(rd) + '</div><div class="cg-opts">';
      if(rd.step === 1) h += MOVES.map(function(m){ var cls = rd.mvPick ? (m[0] === rd.mv ? ' ok' : m[0] === rd.mvPick ? ' bad' : '') : ''; return '<button type="button" class="qcard-choice' + cls + '" data-cg-mv="' + m[0] + '"' + (rd.mvPick ? ' disabled' : '') + '>' + m[1] + '</button>'; }).join('');
      else h += rd.choices.opts.map(function(o){ var cls = rd.cPick ? (o === rd.choices.right ? ' ok' : o === rd.cPick ? ' bad' : '') : ''; return '<button type="button" class="qcard-choice' + cls + '" data-cg-cusp="' + escHtml(o) + '"' + (rd.cPick ? ' disabled' : '') + '>' + escHtml(o) + '</button>'; }).join('');
      h += '</div>';
      if(rd.step === 1 && rd.mvPick) h += '<div class="cg-fb ' + (rd.mvPick === rd.mv ? 'ok' : 'bad') + '"><b>' + (rd.mvPick === rd.mv ? 'Right movement.' : 'Not that one.') + '</b> Now the cusp.</div>';
      if(rd.done){
        /* the round needs both steps; say which one missed, so a right cusp after a wrong movement doesn't read as marked wrong (report #28) */
        var mvOk = rd.mvPick === rd.mv, cOk = rd.cPick === rd.choices.right, mvName = function(k){ return MOVES.filter(function(m){ return m[0] === k; })[0][1]; };
        var verdict = rd.ok ? 'Both right.' : cOk ? 'Right cusp, but step 1 missed.' : mvOk ? 'Right movement, wrong cusp.' : 'Both missed.';
        var why = !mvOk ? ' The arrow shows <b>' + mvName(rd.mv) + '</b>, not ' + mvName(rd.mvPick) + '; a round counts when both steps are right.' : '';
        h += '<div class="cg-fb ' + (rd.ok ? 'ok' : 'bad') + '"><b>' + verdict + '</b>' + why + ' ' + moveExplain(rd) + '</div>';
      }
    }
    if(rd.done || (rd.mode === 'moves' && rd.step === 1 && rd.mvPick)) h += '<div class="cg-btns"><button type="button" class="btn primary" data-cg="' + (rd.mode === 'moves' && !rd.done ? 'step2' : 'next') + '">' + (rd.mode === 'moves' && !rd.done ? 'Next: the cusp' : st.n >= R ? 'See my score' : 'Next round') + '</button></div>';
    h += '</div>';
    host.innerHTML = h;
    var moving = host.querySelectorAll('.cg-svg [data-to]');
    if(moving.length) requestAnimationFrame(function(){ requestAnimationFrame(function(){ moving.forEach(function(g){ g.style.transform = 'translateX(' + g.getAttribute('data-to') + 'px)'; }); }); });
    var f = host.querySelector(rd.done ? '[data-cg="next"]' : rd.mode === 'contacts' ? '.cg-hot:not(.off)' : 'button:not([disabled])');
    if(f && st.focus){ try{ f.focus({ preventScroll:true }); }catch(e){} }
  }
  function fpUnit(t, c){ if(t === 'PM1') return 'P1'; if(t === 'PM2') return 'P2'; return (c === 'MB' || c === 'ML' ? 'm-' : 'd-') + t; }
  function grade(ok){ if(ok){ st.score++; st.streak++; } else st.streak = 0; }
  function onClick(e){
    var hot = e.target.closest('[data-cg-hot]'), btn = e.target.closest('[data-cg],[data-cg-mv],[data-cg-cusp]');
    if(!st && !btn) return;
    st && (st.focus = e.detail === 0);
    if(hot && st && st.rd.mode === 'contacts' && !st.rd.done && !hot.classList.contains('off')){
      var p = hot.getAttribute('data-cg-hot').split(':'), c = st.rd.c, to = c[0] === 'mand' ? 'max' : 'mand';
      st.rd.tap = { a:p[0], t:p[1], f:p[2] }; st.rd.ok = p[0] === to && p[1] === c[3] && (p[2] === c[4] || p[2] === c[5]); st.rd.done = true; grade(st.rd.ok); draw(); return;
    }
    if(!btn) return;
    var a = btn.getAttribute('data-cg');
    if(a === 'contacts' || a === 'moves'){ open(a); return; }
    if(a === 'close'){ st = null; renderLauncher(); return; }
    if(a === 'again'){ start(st.mode); return; }
    if(a === 'hint'){ st.rd.hint = !st.rd.hint; draw(); return; }
    if(a === 'next'){ if(st.n >= R) finish(); else next(); return; }
    if(a === 'step2'){ st.rd.step = 2; draw(); return; }
    if(btn.hasAttribute('data-cg-mv') && !st.rd.mvPick){ st.rd.mvPick = btn.getAttribute('data-cg-mv'); draw(); return; }
    if(btn.hasAttribute('data-cg-cusp') && !st.rd.cPick){ st.rd.cPick = btn.getAttribute('data-cg-cusp'); st.rd.ok = st.rd.mvPick === st.rd.mv && st.rd.cPick === st.rd.choices.right; st.rd.done = true; grade(st.rd.ok); draw(); }
  }
  function onKey(e){ var hot = e.target.closest && e.target.closest('[data-cg-hot]'); if(hot && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); hot.dispatchEvent(new MouseEvent('click', { bubbles:true })); } }
  function renderLauncher(){
    if(!host) return; var b = best();
    host.innerHTML = '<div class="cg-launch"><div class="cg-launch-t"><b>What cusp hits where?</b><span>Dr. Givan\'s help-sheet questions as a quick game: tap where a cusp lands (Class I, II and III), or name the movement and cusp in a pathway picture. 10 rounds.' +
      ((b.best.contacts || b.best.moves) ? ' Your best: Contacts ' + (b.best.contacts || 0) + '/10, Movements ' + (b.best.moves || 0) + '/10.' : '') + '</span></div>' +
      '<div class="cg-btns"><button type="button" class="btn primary" data-cg="contacts">Play: Contacts</button><button type="button" class="btn" data-cg="moves">Play: Movements</button></div></div>';
  }
  function open(mode){ start(mode); if(host) host.scrollIntoView({ block:'nearest' }); }
  function mount(el){ host = el; if(!el.__cg){ el.__cg = true; el.addEventListener('click', onClick); el.addEventListener('keydown', onKey); } if(st) draw(); else renderLauncher(); }
  return { mount:mount, open:open };
})();
