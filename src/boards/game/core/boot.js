(function(root, factory){
  var api = factory(
    typeof module === 'object' && module.exports ? require('./rng') : root && root.BoardsGameCore && root.BoardsGameCore.rng,
    typeof module === 'object' && module.exports ? require('./fsm') : root && root.BoardsGameCore && root.BoardsGameCore.fsm,
    typeof module === 'object' && module.exports ? require('./bus') : root && root.BoardsGameCore && root.BoardsGameCore.bus,
    typeof module === 'object' && module.exports ? require('./store') : null,
    root
  );
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root){ root.BoardsGameCore = root.BoardsGameCore || {}; root.BoardsGameCore.boot = api; }
}(typeof window !== 'undefined' ? window : this, function(rngModule, fsm, bus, storeModule, root){
  function create(options){
    options = options || {};
    var core = root && root.BoardsGameCore || {};
    var rngs = rngModule || core.rng, machine = fsm || core.fsm, events = bus || core.bus,
      saves = storeModule || core.store;
    var store = saves.create({
      clock:options.clock, storage:options.storage, save_game:options.save_game,
      load_game:options.load_game, visitor:options.visitor, hub:options.hub,
      slot:options.slot, setTimeout:options.setTimeout, clearTimeout:options.clearTimeout
    });
    return {
      rng:rngs.rng(options.rngSeed == null ? 'chairside' : options.rngSeed),
      fsm:machine, bus:events.create(), store:store,
      stop:function(){ store.stop(); }
    };
  }
  return { create:create };
}));
