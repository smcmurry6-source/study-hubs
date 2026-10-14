(function(root, factory){
  var api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root){ root.BoardsGameCore = root.BoardsGameCore || {}; root.BoardsGameCore.fsm = api; }
}(typeof window !== 'undefined' ? window : this, function(){
  var sections = {
    HOME:'home', SETUP:'setup', SHEET:'sheet', VISIT:'visit', ITEM:'item', LOCKED:'locked',
    ROUNDS:'rounds', FEEDBACK:'feedback', ATTENDING:'attending', SUMMARY:'summary',
    PAUSED:'paused', RESUME:'resume'
  };
  var edges = {
    HOME:{ START:'SETUP', RESUME:'RESUME' },
    SETUP:{ READY:'SHEET', BACK:'HOME' },
    SHEET:{ PICK:'VISIT', BACK:'SETUP' },
    VISIT:{ OPEN_ITEM:'ITEM', OPEN_ROUNDS:'ROUNDS', PAUSE:'PAUSED' },
    ITEM:{ LOCK:'LOCKED', PAUSE:'PAUSED' },
    LOCKED:{ RECORDED:'FEEDBACK', PAUSE:'PAUSED' },
    ROUNDS:{ NEXT:'VISIT', ATTENDING:'ATTENDING', FINISH:'SUMMARY', PAUSE:'PAUSED' },
    FEEDBACK:{ NEXT:'VISIT', ATTENDING:'ATTENDING', FINISH:'SUMMARY', PAUSE:'PAUSED' },
    ATTENDING:{ START_CASE:'ITEM', FINISH:'SUMMARY', PAUSE:'PAUSED' },
    SUMMARY:{ DONE:'HOME' },
    PAUSED:{ RESUME:'RESUME' },
    RESUME:{ CONTINUE:'RESUME', BACK:'HOME' }
  };
  function transition(state, event, ctx){
    var from = typeof state === 'string' ? state : state && state.state;
    var to, resume;
    ctx = ctx || {};
    if(!edges[from]) throw new Error('Unknown game state: ' + from);
    to = edges[from][event];
    if(!to) throw new Error('Illegal game transition: ' + from + ' -> ' + event);
    if(from === 'LOCKED' && event === 'RECORDED'){
      to = ctx.booked ? (ctx.patientComplete ? 'ROUNDS' : 'ITEM') : 'FEEDBACK';
    }
    if(from === 'RESUME' && event === 'CONTINUE'){
      resume = ctx.resumeState;
      if(!sections[resume] || resume === 'HOME' || resume === 'PAUSED' || resume === 'RESUME' || resume === 'SUMMARY')
        throw new Error('Resume requires an active saved state');
      to = resume;
    }
    return { state:to, effects:[{ type:'enter', state:to, section:sections[to] }] };
  }
  return { states:sections, sections:sections, transition:transition };
}));
