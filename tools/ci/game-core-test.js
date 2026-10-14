'use strict';
var assert = require('assert');
var rngModule = require('../../src/boards/game/core/rng');
var fsm = require('../../src/boards/game/core/fsm');
var busModule = require('../../src/boards/game/core/bus');
var storeModule = require('../../src/boards/game/core/store');
var boot = require('../../src/boards/game/core/boot');

function memoryStorage(){
  var values = {};
  return {
    getItem:function(key){ return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null; },
    setItem:function(key, value){ values[key] = String(value); },
    removeItem:function(key){ delete values[key]; }
  };
}
function testRng(){
  var a = rngModule.rng('same-seed'), b = rngModule.rng('same-seed'), i;
  assert.strictEqual(a.next(), 0.42831624625250697);
  a = rngModule.rng('same-seed');
  for(i = 0; i < 100; i++) assert.strictEqual(a.next(), b.next());
  assert.deepStrictEqual(rngModule.rng(8).shuffle([1, 2, 3, 4]), rngModule.rng(8).shuffle([1, 2, 3, 4]));
  assert.strictEqual(rngModule.rng('x').int(4, 4), 4);
  assert.strictEqual(rngModule.rng('x').pick([]), undefined);
  assert.notStrictEqual(rngModule.stream('s', 'a')(), rngModule.stream('s', 'b')());
}
function testFsm(){
  assert.strictEqual(fsm.transition('HOME', 'START').state, 'SETUP');
  assert.strictEqual(fsm.transition('LOCKED', 'RECORDED', { booked:true, patientComplete:false }).state, 'ITEM');
  assert.strictEqual(fsm.transition('LOCKED', 'RECORDED', { booked:true, patientComplete:true }).state, 'ROUNDS');
  assert.throws(function(){ fsm.transition('HOME', 'LOCK'); }, /Illegal game transition/);
  assert.strictEqual(fsm.transition('PAUSED', 'RESUME').state, 'RESUME');
  assert.strictEqual(fsm.transition('RESUME', 'CONTINUE', { resumeState:'ITEM' }).state, 'ITEM');
  assert.throws(function(){ fsm.transition('RESUME', 'CONTINUE'); }, /Resume requires/);
}
function testBus(){
  var bus = busModule.create(), value = 0, off = bus.on('tick', function(n){ value += n; });
  bus.emit('tick', 2); off(); bus.emit('tick', 3); assert.strictEqual(value, 2);
}
async function testStore(){
  var now = 1000, storage = memoryStorage(), local = storeModule.create({ storage:storage, clock:function(){ return now; } });
  local.patch({ visits:2 });
  var loaded = storeModule.create({ storage:storage, clock:function(){ return now; } }).load();
  assert.strictEqual(loaded.v, 1); assert.strictEqual(loaded.visits, 2);
  var blocked = storeModule.create({ storage:{ getItem:function(){ throw Error('blocked'); }, setItem:function(){ throw Error('blocked'); } }, clock:function(){ return now; } });
  blocked.patch({ safe:true }); assert.strictEqual(blocked.load().safe, true);
  assert.strictEqual(storeModule.migrate({ oldField:'kept' }).v, 1);
  assert.strictEqual(storeModule.migrate({ oldField:'kept' }).oldField, 'kept');

  var callbacks = [], writes = [], game = storeModule.create({
    storage:memoryStorage(), clock:function(){ return now; },
    setTimeout:function(fn, delay){ var entry = { fn:fn, delay:delay }; callbacks.push(entry); return entry; },
    clearTimeout:function(entry){ callbacks = callbacks.filter(function(x){ return x !== entry; }); },
    save_game:function(visitor, hub, slot, data){ writes.push({ visitor:visitor, hub:hub, slot:slot, data:data }); }
  });
  await game.remote.set({ count:1 });
  now += 1000;
  var delayed = game.remote.set({ count:2 });
  assert.strictEqual(writes.length, 1); assert.strictEqual(callbacks[0].delay, 4000);
  now += 4000; var retry = game.flush(); await Promise.all([delayed, retry]);
  assert.strictEqual(writes.length, 2); assert.strictEqual(writes[1].data.count, 2);
  assert.strictEqual(callbacks.length, 0);
  assert.strictEqual(writes[1].hub, 'boards');

  var sync = storeModule.create({
    storage:memoryStorage(), clock:function(){ return now; },
    load_game:function(){ return { data:{ v:1, updated_at:new Date(now + 1000).toISOString(), remoteOnly:'newer', data:{ kept:true } }, error:null }; }
  });
  sync.set({ v:1, updated_at:new Date(now).toISOString(), localOnly:'older' });
  var merged = await sync.remote.get(); assert.strictEqual(merged.remoteOnly, 'newer'); assert.strictEqual(merged.localOnly, undefined);
  assert.deepStrictEqual(merged.data, { kept:true });
}
function testBoot(){
  var core = boot.create({ rngSeed:'boot', clock:function(){ return 0; }, storage:memoryStorage() });
  assert.strictEqual(core.rng.next(), rngModule.rng('boot').next());
  assert.strictEqual(core.fsm, fsm); assert.ok(core.bus && core.store); core.stop();
}
async function main(){
  testRng(); testFsm(); testBus(); await testStore(); testBoot();
  process.stdout.write('game core tests passed\n');
}
main().catch(function(error){ process.stderr.write(String(error.stack || error) + '\n'); process.exitCode = 1; });
