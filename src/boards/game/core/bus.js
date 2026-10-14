(function(root, factory){
  var api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root){ root.BoardsGameCore = root.BoardsGameCore || {}; root.BoardsGameCore.bus = api; }
}(typeof window !== 'undefined' ? window : this, function(){
  function create(){
    var listeners = {};
    function on(type, fn){
      if(typeof fn !== 'function') throw new TypeError('listener must be a function');
      (listeners[type] || (listeners[type] = [])).push(fn);
      return function(){ off(type, fn); };
    }
    function off(type, fn){
      var list = listeners[type] || [], i;
      for(i = list.length - 1; i >= 0; i--) if(list[i] === fn) list.splice(i, 1);
      if(!list.length) delete listeners[type];
    }
    function emit(type, value){
      var list = (listeners[type] || []).slice(), i;
      for(i = 0; i < list.length; i++) list[i](value);
    }
    return { on:on, off:off, emit:emit };
  }
  return { create:create };
}));
