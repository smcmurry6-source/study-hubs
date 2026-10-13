/* ====================================================================
   STATE: key boards-state-v1, perio's shape (answered / totalSeen / activeDates as a 'YYYY-MM-DD' -> true map),
   so the dashboard's readProgress reads it unchanged (BUILD_SPEC 1.1). Keep these field names stable.
   ==================================================================== */
var STATE_KEY = CONFIG.stateKey;
function defaultState(){
  return {
    answered:{},          // qid -> {lastCorrect:bool, n:int, t:'YYYY-MM-DD', first:bool}
    totalSeen:0, totalCorrect:0,
    activeDates:{},       // 'YYYY-MM-DD' -> true
    lastActiveDate:null,
    retired:{},           // qid -> 'YYYY-MM-DD' (dailyPlan, BUILD_SPEC 1.5)
    ui:{ mode:'home', sub:{}, level:'core', coverOptions:false, unit:null, bankUnit:'all', bankSec:null, bankExam:'all', bankNewOnly:false, bankHardOnly:false, bankAt:0, caseProgress:{}, caseId:null, caseReview:false }
  };
}
function loadState(){
  var d = defaultState(), base = defaultState();
  try{
    var raw = localStorage.getItem(STATE_KEY);
    if(raw){ var saved = JSON.parse(raw); if(saved && typeof saved === 'object') for(var k in saved) if(Object.prototype.hasOwnProperty.call(saved, k)) d[k] = saved[k]; }
  }catch(e){}
  if(!d.ui || typeof d.ui !== 'object') d.ui = base.ui;
  for(var kk in base.ui) if(!(kk in d.ui)) d.ui[kk] = base.ui[kk];
  if(!d.ui.sub || typeof d.ui.sub !== 'object') d.ui.sub = {};
  if(!d.ui.caseProgress || typeof d.ui.caseProgress !== 'object' || Array.isArray(d.ui.caseProgress)) d.ui.caseProgress = {};
  ['answered', 'activeDates', 'retired'].forEach(function(k){ if(!d[k] || typeof d[k] !== 'object' || Array.isArray(d[k])) d[k] = {}; });
  return d;
}
function saveState(){ try{ localStorage.setItem(STATE_KEY, JSON.stringify(STATE)); }catch(e){} }
var STATE = loadState();

function touchActiveDay(){ var k = todayKey(); STATE.activeDates[k] = true; STATE.lastActiveDate = k; }

/* One recorded answer. `choice` is the AUTHORED index of the option picked (the card maps the shuffled position
   back), so question_choices rows mean the same thing whatever order a student saw. ctx: bank | case | mock | drill | game. */
function recordAnswer(q, correct, choice, ctx, conf){
  var a = STATE.answered[q.id], t = todayKey();
  if(!a) a = STATE.answered[q.id] = { lastCorrect:false, n:0, t:t, first:!!correct };
  a.lastCorrect = !!correct; a.n++; a.t = t;
  if(typeof choice === 'number' && choice >= 0) a.choice = choice;
  STATE.totalSeen++; if(correct) STATE.totalCorrect++;
  touchActiveDay(); saveState();
  var detail = { qid:q.id, lec:q.lec, correct:!!correct, choice:choice, ctx:ctx || 'bank' };
  if(conf) detail.conf = conf;
  try{ document.dispatchEvent(new CustomEvent('boards:answered', { detail:detail })); }catch(e){}
}
