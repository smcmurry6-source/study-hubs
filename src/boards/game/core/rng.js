(function(root, factory){
  var api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root){ root.BoardsGameCore = root.BoardsGameCore || {}; root.BoardsGameCore.rng = api; }
}(typeof window !== 'undefined' ? window : this, function(){
  function imul(a, b){
    if(Math.imul) return Math.imul(a, b);
    var ah = (a >>> 16) & 65535, al = a & 65535, bh = (b >>> 16) & 65535, bl = b & 65535;
    return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0;
  }
  function xmur3(text){
    var h = 1779033703 ^ text.length, i;
    for(i = 0; i < text.length; i++){ h = imul(h ^ text.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function(){
      h = imul(h ^ (h >>> 16), 2246822507);
      h = imul(h ^ (h >>> 13), 3266489909);
      return (h ^ (h >>> 16)) >>> 0;
    };
  }
  function mulberry32(seed){
    var a = seed >>> 0;
    return function(){
      var t = a = (a + 0x6D2B79F5) >>> 0;
      t = imul(t ^ (t >>> 15), t | 1);
      t ^= t + imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed){
    var hash = xmur3(String(seed)), next = mulberry32(hash());
    return {
      next: next,
      int: function(min, max){
        if(min % 1 || max % 1 || max < min) throw new RangeError('int expects an inclusive integer range');
        return min + Math.floor(next() * (max - min + 1));
      },
      pick: function(items){ return items && items.length ? items[this.int(0, items.length - 1)] : undefined; },
      shuffle: function(items){
        var out = items.slice(), i, j, tmp;
        for(i = out.length - 1; i > 0; i--){ j = this.int(0, i); tmp = out[i]; out[i] = out[j]; out[j] = tmp; }
        return out;
      }
    };
  }
  function stream(seed, name){ return mulberry32(xmur3(String(seed) + ':' + String(name))()); }
  return { rng:rng, stream:stream, xmur3:xmur3, mulberry32:mulberry32 };
}));
