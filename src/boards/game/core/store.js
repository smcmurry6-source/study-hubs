(function(root, factory){
  var api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root){ root.BoardsGameCore = root.BoardsGameCore || {}; root.BoardsGameCore.store = api; }
}(typeof window !== 'undefined' ? window : this, function(){
  var VERSION = 1, THROTTLE_MS = 5000;
  function copy(value){
    if(value == null) return value;
    try{ return JSON.parse(JSON.stringify(value)); }catch(e){ return value; }
  }
  function migrate(value){
    if(!value || typeof value !== 'object' || Array.isArray(value)) return null;
    var out = copy(value), version = Number(out.v || 0);
    if(!isFinite(version) || version < 0) version = 0;
    if(version > VERSION) return null;
    if(version < 1){ out.v = 1; version = 1; }
    out.v = version;
    if(typeof out.updated_at !== 'string' && typeof out.updated_at !== 'number') out.updated_at = null;
    return out;
  }
  function timeValue(value){
    if(typeof value === 'number') return value;
    if(value == null) return -Infinity;
    var n = Date.parse(value);
    return isNaN(n) ? -Infinity : n;
  }
  function merge(local, remote){
    var a = migrate(local), b = migrate(remote);
    if(!a) return b;
    if(!b) return a;
    return timeValue(b.updated_at) > timeValue(a.updated_at) ? b : a;
  }
  function create(options){
    options = options || {};
    var key = options.key || 'boards-chairside-save-v1',
      clock = typeof options.clock === 'function' ? options.clock : function(){ return Date.now(); },
      storage = options.storage, saveGame = options.save_game, loadGame = options.load_game,
      visitor = options.visitor || null, hub = options.hub || 'boards', slot = options.slot || 'chairside',
      setTimer = options.setTimeout || (typeof setTimeout === 'function' ? setTimeout : null),
      clearTimer = options.clearTimeout || (typeof clearTimeout === 'function' ? clearTimeout : null),
      data = null, dirty = false, lastWrite = -Infinity, timer = null, revision = 0, waiters = [];
    function now(){ var n = clock(); return n instanceof Date ? n.getTime() : Number(n); }
    function stamp(){ return new Date(now()).toISOString(); }
    function defaultSave(){ return { v:VERSION, updated_at:stamp() }; }
    function getStorage(){
      if(storage !== undefined) return storage;
      try{ return typeof window !== 'undefined' ? window.localStorage : null; }catch(e){ return null; }
    }
    function readLocal(){
      try{
        var s = getStorage(), raw = s && s.getItem(key);
        return raw ? migrate(JSON.parse(raw)) : null;
      }catch(e){ return null; }
    }
    function writeLocal(value){
      try{ var s = getStorage(); if(s) s.setItem(key, JSON.stringify(value)); return !!s; }catch(e){ return false; }
    }
    function load(){ data = readLocal() || data || defaultSave(); return copy(data); }
    function set(value){
      var next = migrate(value) || defaultSave();
      next.v = VERSION;
      if(!next.updated_at) next.updated_at = stamp();
      data = next; revision++; dirty = true; writeLocal(data); return copy(data);
    }
    function patch(value){
      var current = load(), k;
      if(value && typeof value === 'object') for(k in value) if(Object.prototype.hasOwnProperty.call(value, k)) current[k] = copy(value[k]);
      current.v = VERSION; current.updated_at = stamp();
      data = current; revision++; dirty = true; writeLocal(data); return copy(data);
    }
    function settle(ok, value){
      var pending = waiters.slice(), i; waiters = [];
      for(i = 0; i < pending.length; i++) pending[i](ok, value);
    }
    function invokeSave(){
      var snapshot = copy(data), writtenRevision = revision, result;
      timer = null; lastWrite = now();
      if(typeof saveGame !== 'function'){ dirty = false; settle(true, snapshot); return; }
      try{ result = saveGame(visitor, hub, slot, snapshot); }
      catch(e){ settle(false, e); return; }
      Promise.resolve(result).then(function(response){
        if(response && response.error) throw response.error;
        if(revision === writtenRevision) dirty = false;
        settle(true, copy(snapshot));
      }, function(error){ settle(false, error); });
    }
    function flush(){
      if(!dirty) return Promise.resolve(copy(data || load()));
      return new Promise(function(resolve, reject){
        waiters.push(function(ok, value){ if(ok) resolve(value); else reject(value); });
        var remaining = THROTTLE_MS - (now() - lastWrite);
        if(remaining <= 0){
          if(timer !== null && clearTimer) clearTimer(timer);
          timer = null; invokeSave();
        }
        else if(timer === null && setTimer) timer = setTimer(invokeSave, remaining);
      });
    }
    function remoteGet(){
      var local = load();
      if(typeof loadGame !== 'function') return Promise.resolve(local);
      var result;
      try{ result = loadGame(visitor, hub, slot); }catch(e){ return Promise.reject(e); }
      return Promise.resolve(result).then(function(response){
        if(response && response.error && !Object.prototype.hasOwnProperty.call(response, 'v')) throw response.error;
        var value = response;
        if(response && Object.prototype.hasOwnProperty.call(response, 'data') && !Object.prototype.hasOwnProperty.call(response, 'v') && !Object.prototype.hasOwnProperty.call(response, 'updated_at')) value = response.data;
        var remote = migrate(value);
        data = merge(local, remote) || local;
        writeLocal(data); return copy(data);
      });
    }
    function remoteSet(value){ if(value) set(value); return flush(); }
    function stop(){ if(timer !== null && clearTimer) clearTimer(timer); timer = null; settle(false, new Error('store stopped')); }
    return {
      load:load, get:load, set:set, patch:patch, flush:flush,
      remote:{ get:remoteGet, set:remoteSet }, stop:stop,
      merge:merge, migrate:migrate, version:VERSION
    };
  }
  return { create:create, migrate:migrate, merge:merge, version:VERSION, throttleMs:THROTTLE_MS };
}));
