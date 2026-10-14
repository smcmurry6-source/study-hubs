'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'src/boards/app/45-readiness-plan.js'), 'utf8');
const sandbox = {};
vm.runInNewContext(source, sandbox, { filename:'45-readiness-plan.js' });
const plan = sandbox.BoardsPlan;
const baseBudget = {
  daily:12,
  newPerDay:0,
  governor:0.8,
  retireStep:120,
  retireStreak:3,
  retiredSamplePerMonth:4
};
let checks = 0;

function check(name, fn){
  fn();
  checks++;
}
function copy(value){ return JSON.parse(JSON.stringify(value)); }
function makeCtx(overrides){
  const ctx = {
    day:'2026-10-13',
    seed:'test-seed',
    items:[],
    cases:[],
    history:{},
    srs:{},
    stats:{},
    retired:{},
    finalReview:{},
    lastPlanMonth:'',
    sureWrong:{},
    budget:copy(baseBudget),
    size:12
  };
  Object.keys(overrides || {}).forEach((key) => { ctx[key] = overrides[key]; });
  return ctx;
}
function ids(result){ return Array.prototype.slice.call(result.plan); }

check('fixture plan matches its reviewed expected order', function(){
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/boards/plan-priority.json'), 'utf8'));
  const result = plan.dailyPlan(fixture);
  assert.deepStrictEqual(ids(result), fixture.expectedPlan);
});

check('difficulty uses the cog prior and ability weights first attempts, siblings, and repeats', function(){
  const baseline = plan.difficulty(null, 2);
  const observed = plan.difficulty([8, 6], 2);
  assert.strictEqual(baseline.acc, 0.62);
  assert(Math.abs(observed.acc - ((6 + 2 * 0.62) / 10)) < 1e-12);
  const byId = { q:{ cog:2 } };
  const first = plan.ability([{ qid:'q', correct:true, day:'2026-10-13', first:true, sibling:false }], byId, {});
  const sibling = plan.ability([{ qid:'q', correct:true, day:'2026-10-13', first:true, sibling:true }], byId, {});
  const repeat = plan.ability([{ qid:'q', correct:true, day:'2026-10-13', first:false, sibling:false }], byId, {});
  assert(first > sibling);
  assert(sibling > repeat);

  const item = [{ id:'q', lec:'medcx', cog:2 }];
  const firstRight = plan.readiness('medcx', makeCtx({
    items:item,
    history:{ q:{ n:2, first:true, lastCorrect:true, t:'2026-10-13' } }
  }));
  const firstWrong = plan.readiness('medcx', makeCtx({
    items:item,
    history:{ q:{ n:2, first:false, lastCorrect:true, t:'2026-10-13' } }
  }));
  assert(firstRight.likely > firstWrong.likely);
});

check('same input is repeatable and a seed only reorders equal-priority due items', function(){
  const items = [{ id:'top', lec:'medcx', cog:2 }];
  const srs = { top:{ b:1, due:'2026-10-01', t:'2026-09-30' } };
  for(let i = 0; i < 6; i++){
    const id = 'tie-' + i;
    items.push({ id:id, lec:'medcx', cog:2 });
    srs[id] = { b:1, due:'2026-10-13', t:'2026-10-12' };
  }
  const ctx = makeCtx({ items:items, srs:srs, size:2 });
  ctx.budget.newPerDay = 0;
  const first = ids(plan.dailyPlan(ctx));
  assert.deepStrictEqual(ids(plan.dailyPlan(ctx)), first);
  assert.strictEqual(first[0], 'top');
  let changed = null;
  ['seed-b', 'seed-c', 'seed-d', 'seed-e', 'seed-f'].some((seed) => {
    const result = ids(plan.dailyPlan(Object.assign({}, ctx, { seed:seed })));
    if(result[0] === 'top' && result[1] !== first[1]) { changed = result; return true; }
    return false;
  });
  assert(changed, 'at least one seed should select a different member of the equal-priority tie');
  assert.strictEqual(changed[0], 'top');
  assert(/^tie-/.test(changed[1]));
});

check('daily plans respect the size, duplicate, retirement, and release limits', function(){
  const items = [
    { id:'due-a', lec:'medcx', cog:1 },
    { id:'due-b', lec:'medcx', cog:1 },
    { id:'retired', lec:'medcx', cog:1 },
    { id:'unreleased', lec:'medcx', cog:1, released:false }
  ];
  const ctx = makeCtx({
    items:items,
    size:2,
    retired:{ retired:'2026-10-01' },
    srs:{
      'due-a':{ b:1, due:'2026-10-12' },
      'due-b':{ b:1, due:'2026-10-12' },
      retired:{ b:1, due:'2026-10-12' },
      unreleased:{ b:1, due:'2026-10-12' }
    }
  });
  const result = plan.dailyPlan(ctx);
  const resultIds = ids(result);
  assert(resultIds.length <= 2);
  assert.strictEqual(new Set(resultIds).size, resultIds.length);
  assert(!resultIds.includes('retired'));
  assert(!resultIds.includes('unreleased'));
});

check('overdue and Sure-wrong reviews outrank today-due reviews', function(){
  const ctx = makeCtx({
    items:[
      { id:'overdue-sure', lec:'medcx', cog:3 },
      { id:'overdue', lec:'medcx', cog:2 },
      { id:'today', lec:'pharm', cog:1 }
    ],
    size:2,
    sureWrong:{ 'overdue-sure':true },
    srs:{
      'overdue-sure':{ b:2, due:'2026-10-05' },
      overdue:{ b:1, due:'2026-10-10' },
      today:{ b:1, due:'2026-10-13' }
    }
  });
  ctx.budget.newPerDay = 0;
  const result = ids(plan.dailyPlan(ctx));
  assert.strictEqual(result[0], 'overdue-sure');
  assert(result.includes('overdue'));
  assert(!result.includes('today'));
});

check('the governor blocks new items under a heavy forecast and allows the empty-history cap', function(){
  const heavyItems = [], heavySrs = {};
  for(let i = 0; i < 10; i++){
    const id = 'review-' + i;
    heavyItems.push({ id:id, lec:'medcx', cog:2 });
    heavySrs[id] = { b:1, due:'2026-10-14' };
  }
  for(let i = 0; i < 5; i++) heavyItems.push({ id:'new-' + i, lec:'pharm', cog:1 });
  const heavy = makeCtx({ items:heavyItems, srs:heavySrs, size:12 });
  heavy.budget.newPerDay = 4;
  assert.strictEqual(ids(plan.dailyPlan(heavy)).length, 0);

  const empty = makeCtx({
    items:Array.from({ length:8 }, (_, i) => ({ id:'fresh-' + i, lec:i % 2 ? 'pharm' : 'medcx', cog:2 })),
    size:3
  });
  empty.budget.newPerDay = 4;
  assert.strictEqual(ids(plan.dailyPlan(empty)).length, Math.min(empty.budget.newPerDay, empty.size));
});

check('the last review is planned before retirement and monthly samples return on the first plan of the month', function(){
  const mature = makeCtx({
    items:[{ id:'mature', lec:'medcx', cog:1 }],
    srs:{ mature:{ b:7, due:'2026-10-13', t:'2026-06-15' } },
    history:{ mature:{ lastCorrect:true, n:7, t:'2026-06-15' } }
  });
  const finalReview = plan.dailyPlan(mature);
  assert.deepStrictEqual(ids(finalReview), ['mature']);
  assert.deepStrictEqual(Array.prototype.slice.call(finalReview.finalDue), ['mature']);
  assert.deepStrictEqual(Array.prototype.slice.call(finalReview.retire), []);

  const answered = makeCtx({
    day:'2026-10-14',
    items:mature.items,
    srs:{ mature:{ b:7, due:'2027-02-10', t:'2026-10-13' } },
    finalReview:{ mature:'2026-10-13' },
    history:{ mature:{ lastCorrect:true, n:8, t:'2026-10-13' } }
  });
  const retired = plan.dailyPlan(answered);
  assert.deepStrictEqual(Array.prototype.slice.call(retired.retire), ['mature']);
  assert(!ids(retired).includes('mature'));
  const answeredWrong = Object.assign({}, answered, {
    history:{ mature:{ lastCorrect:false, n:8, t:'2026-10-13' } }
  });
  assert.deepStrictEqual(Array.prototype.slice.call(plan.dailyPlan(answeredWrong).retire), []);

  const missedFinal = makeCtx({
    day:'2027-06-10',
    items:[{ id:'q', lec:'medcx', cog:1 }],
    srs:{ q:{ b:0, due:'2027-10-07', t:'2027-06-09' } },
    history:{ q:{ lastCorrect:true, n:8, t:'2027-06-09' } },
    finalReview:{ q:'2027-01-05' }
  });
  const clearedFinal = plan.dailyPlan(missedFinal);
  assert.deepStrictEqual(Array.prototype.slice.call(clearedFinal.retire), []);
  assert.deepStrictEqual(Array.prototype.slice.call(clearedFinal.finalClear), ['q']);

  const sampleItems = Array.from({ length:6 }, (_, i) => ({ id:'old-' + i, lec:'medcx', cog:2 }));
  const sampleCtx = makeCtx({
    day:'2026-11-03',
    lastPlanMonth:'2026-10',
    items:sampleItems,
    retired:Object.fromEntries(sampleItems.map((q) => [q.id, '2026-10-01'])),
    size:8
  });
  sampleCtx.budget.newPerDay = 0;
  const sampled = plan.dailyPlan(sampleCtx);
  assert.strictEqual(ids(sampled).length, 4);
  assert(ids(sampled).every((id) => sampleCtx.retired[id]));
});

check('case plans never include more than three items from one case', function(){
  const items = [];
  const srs = {};
  for(let i = 0; i < 5; i++){
    const id = 'case-' + i;
    items.push({ id:id, lec:'medcx', cog:2, case:'c1' });
    srs[id] = { b:1, due:'2026-10-13' };
  }
  for(let i = 0; i < 4; i++){
    const id = 'single-' + i;
    items.push({ id:id, lec:'pharm', cog:1 });
    srs[id] = { b:1, due:'2026-10-13' };
  }
  const ctx = makeCtx({ items:items, srs:srs, size:9 });
  ctx.budget.newPerDay = 0;
  const result = ids(plan.dailyPlan(ctx));
  assert(result.filter((id) => /^case-/.test(id)).length <= 3);
});

check('new-item picks contain standalones only', function(){
  const items = [
    { id:'case-new-a', lec:'medcx', cog:2, case:'c1' },
    { id:'case-new-b', lec:'medcx', cog:2, case:'c1' },
    { id:'case-new-c', lec:'medcx', cog:2, case:'c1' },
    { id:'standalone-a', lec:'pharm', cog:1 },
    { id:'standalone-b', lec:'medcx', cog:2 },
    { id:'standalone-c', lec:'pharm', cog:1 }
  ];
  const ctx = makeCtx({ items:items, size:3 });
  ctx.budget.newPerDay = 3;
  const result = ids(plan.dailyPlan(ctx));
  assert.strictEqual(result.length, 3);
  assert(result.every((id) => /^standalone-/.test(id)));
});

check('readiness uses the four coverage bands and unseen additions do not lower likely', function(){
  const items = Array.from({ length:10 }, (_, i) => ({
    id:'q' + i,
    lec:'medcx',
    cog:1,
    case:i < 4 ? 'c1' : undefined
  }));
  const cases = [{ id:'c1', items:['q0', 'q1', 'q2', 'q3'] }];
  const stats = Object.fromEntries(items.map((q) => [q.id, [100, 100]]));
  function readinessFor(count){
    const history = {};
    for(let i = 0; i < count; i++) history['q' + i] = { n:1, lastCorrect:true, t:'2026-10-13' };
    return plan.readiness('medcx', makeCtx({ items:items, cases:cases, stats:stats, history:history }));
  }
  assert.strictEqual(readinessFor(0).band, null);
  assert.strictEqual(readinessFor(1).band, 'Started');
  assert.strictEqual(readinessFor(3).band, 'Practicing');
  assert.strictEqual(readinessFor(5).band, 'Solid');
  assert.strictEqual(readinessFor(7).band, 'Board-ready');

  const oneSeen = makeCtx({
    items:items,
    cases:cases,
    stats:stats,
    history:{ q0:{ n:1, lastCorrect:true, t:'2026-10-13' } }
  });
  const before = plan.readiness('medcx', oneSeen);
  const expanded = copy(oneSeen);
  expanded.items.push({ id:'new-hard-a', lec:'medcx', cog:3 }, { id:'new-hard-b', lec:'medcx', cog:3 });
  expanded.stats['new-hard-a'] = [0, 100];
  expanded.stats['new-hard-b'] = [0, 100];
  const after = plan.readiness('medcx', expanded);
  assert.strictEqual(after.total, before.total + 2);
  assert.strictEqual(after.likely, before.likely);
});

check('a unit unpracticed for 120 days drifts toward its cog prior', function(){
  const items = [{ id:'practice', lec:'medcx', cog:1 }];
  const history = { practice:{ n:1, lastCorrect:true, t:'2026-10-13' } };
  const fresh = plan.readiness('medcx', makeCtx({ items:items, history:history, day:'2026-10-13' }));
  const stale = plan.readiness('medcx', makeCtx({ items:items, history:history, day:'2027-02-10' }));
  const prior = plan.difficulty(null, 1).acc;
  assert(Math.abs(stale.likely - prior) < Math.abs(fresh.likely - prior));
});

check('hub wrapper stores final-review and month state and freezes same-day plans', function(){
  const state = {
    answered:{ mature:{ n:7, first:true, lastCorrect:true, t:'2026-06-15' } },
    retired:{},
    ui:{ finalReview:{}, planMonth:'2026-09' }
  };
  const srs = { mature:{ b:7, due:'2026-10-13', t:'2026-06-15' } };
  let statsCallback = null;
  let saveCount = 0;
  const wrapper = {
    STATE:state,
    QUESTIONS:[{ id:'mature', lec:'medcx', cog:1 }],
    CASES:[],
    CONFIG:{ budget:Object.assign(copy(baseBudget), { steps:[1,3,7,14,30,60,120] }) },
    todayKey:function(){ return '2026-10-13'; },
    saveState:function(){ saveCount++; },
    localStorage:{ getItem:function(){ return JSON.stringify(srs); } },
    window:{ shGetClassStats:function(qids, callback){ statsCallback = callback; } }
  };
  vm.runInNewContext(source, wrapper, { filename:'45-readiness-plan-wrapper.js' });
  const first = Array.prototype.slice.call(wrapper.dailyPlan({ day:'2026-10-13', size:1 }));
  assert.deepStrictEqual(first, ['mature']);
  assert.strictEqual(state.ui.finalReview.mature, '2026-10-13');
  assert.strictEqual(state.ui.planMonth, '2026-10');
  assert.strictEqual(state.ui.plan.day, '2026-10-13');
  assert.strictEqual(state.ui.plan.size, 1);
  assert.strictEqual(typeof statsCallback, 'function');

  statsCallback({ mature:{ total:100, correct:0 } });
  wrapper.QUESTIONS.push({ id:'new-due', lec:'pharm', cog:1 });
  srs['new-due'] = { b:1, due:'2026-10-13', t:'2026-10-12' };
  assert.deepStrictEqual(Array.prototype.slice.call(wrapper.dailyPlan({ day:'2026-10-13', size:1 })), first);

  srs.mature = { b:7, due:'2027-02-10', t:'2026-10-13' };
  assert.deepStrictEqual(Array.prototype.slice.call(wrapper.dailyPlan({ day:'2026-10-14', size:1 })), ['new-due']);
  assert.strictEqual(state.retired.mature, '2026-10-14');

  delete state.retired.mature;
  state.ui.finalReview.mature = '2026-10-13';
  srs.mature = { b:0, due:'2027-02-10', t:'2026-10-14' };
  wrapper.dailyPlan({ day:'2026-10-15', size:1 });
  assert.strictEqual(state.ui.finalReview.mature, undefined);

  assert(saveCount >= 2);
});

console.log('✓ boards plan: ' + checks + ' checks passed');
