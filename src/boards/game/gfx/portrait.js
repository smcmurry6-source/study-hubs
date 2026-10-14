/* Seeded geometric patient portraits. Options: age, skinTone (1-10), hairStyle (0-5), hairTone (1-8), glasses, shirtTone (1-6). */
(function () {
  'use strict';
  function clamp(v, a, b) { v = Number(v); return Number.isFinite(v) ? Math.max(a, Math.min(b, Math.round(v))) : a; }
  function seedValue(seed) {
    if (typeof seed === 'number' && Number.isFinite(seed)) return Math.floor(seed) >>> 0;
    var s = String(seed == null ? 0 : seed), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seedValue(seed);
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(rand, n) { return Math.floor(rand() * n); }
  function hairShape(style, fill, rand) {
    var paths = [
      '<path d="M38 67c-4-19 2-35 15-40 13-6 30-3 38 7 7 8 8 18 4 34l-8-9-3-12c-8 7-22 11-43 11z"/>',
      '<path d="M38 66c-4-20 2-35 16-41 15-7 34-2 41 12 4 8 3 19 1 29l-9-11c-9 1-18-5-21-13-5 13-15 18-28 24z"/>',
      '<path d="M39 66c-5-18 1-34 15-41 14-7 31-4 40 7 8 10 7 24 4 34l-9-9-3-12c-10 9-25 11-40 11z"/>',
      '<path d="M38 66c-5-19 1-35 15-42 15-8 34-2 42 12 5 9 3 21 1 34l-5 23-8 7V58c-9 3-24 3-37-3v46l-8-7z"/>',
      '<path d="M38 66c-5-19 0-34 14-42 16-9 35-3 44 12 5 8 3 20 1 34l-8-11-3-12c-9 8-22 10-40 9v36l-8-8z"/>',
      '<path d="M39 63c-4-16 1-30 13-37 13-8 31-6 40 5 7 8 8 19 5 32l-8-8-3-11c-10 7-26 9-39 7z"/>'
    ];
    var html = '<g fill="' + fill + '">' + paths[style];
    if (style === 2 || style === 4) {
      for (var i = 0; i < 7; i++) html += '<circle cx="' + (43 + i * 7) + '" cy="' + (39 - Math.round(rand() * 4)) + '" r="' + (5 + Math.round(rand() * 2)) + '"/>';
    }
    if (style === 3) html += '<path d="M42 82c5 9 12 13 22 13s17-4 22-13v17H42z"/>';
    return html + '</g>';
  }
  function portraitSvg(seed, options) {
    options = options && typeof options === 'object' ? options : {};
    var rand = rng(seed);
    var age = options.age == null ? 19 + pick(rand, 62) : clamp(options.age, 18, 85);
    var skinTone = options.skinTone == null ? 1 + pick(rand, 10) : clamp(options.skinTone, 1, 10);
    var hairStyle = options.hairStyle == null ? pick(rand, 6) : clamp(options.hairStyle, 0, 5);
    var hairTone = options.hairTone == null ? 1 + pick(rand, 8) : clamp(options.hairTone, 1, 8);
    var glasses = options.glasses == null ? rand() < 0.28 : !!options.glasses;
    var shirtTone = options.shirtTone == null ? 1 + pick(rand, 6) : clamp(options.shirtTone, 1, 6);
    if (options.hairTone == null && age >= 58 && rand() < 0.58) hairTone = 7 + pick(rand, 2);
    else if (options.hairTone == null && age >= 42 && rand() < 0.17) hairTone = 7;
    var skin = 'var(--cs-skin-' + skinTone + ', var(--cs-card))';
    var hair = 'var(--cs-hair-' + hairTone + ', var(--cs-ink))';
    var shirt = 'var(--cs-shirt-' + shirtTone + ', var(--cs-flow))';
    var width = 24 + Math.round(rand() * 4), height = 31 + Math.round(rand() * 4);
    var wrinkles = age >= 68 ? '.56' : (age >= 48 ? '.32' : '0');
    var out = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 152" role="img" aria-label="Generated patient portrait" data-age="' + age + '" data-skin-tone="' + skinTone + '" data-hair-style="' + hairStyle + '" data-glasses="' + glasses + '">',
      '<title>Patient portrait, age ' + age + '</title><desc>A friendly, non-clinical geometric portrait generated from a seed.</desc>',
      '<rect x="3" y="3" width="122" height="146" rx="13" fill="var(--cs-card)"/>',
      '<path d="M15 149c2-21 18-33 49-33s47 12 49 33" fill="' + shirt + '"/>',
      '<path d="M51 99v22c4 7 22 7 26 0V99" fill="' + skin + '"/>',
      hairShape(hairStyle, hair, rand),
      '<path d="M39 61c-6-2-10 2-9 8 1 6 5 9 10 8m48-16c6-2 10 2 9 8-1 6-5 9-10 8" fill="' + skin + '" stroke="var(--cs-ink)" stroke-width=".8" stroke-opacity=".18"/>',
      '<ellipse cx="64" cy="66" rx="' + width + '" ry="' + height + '" fill="' + skin + '" stroke="var(--cs-ink)" stroke-width=".8" stroke-opacity=".18"/>',
      '<path d="M42 58c7-4 13-4 19-1m6 0c7-3 13-3 19 1" fill="none" stroke="' + hair + '" stroke-width="3" stroke-linecap="round"/>',
      '<ellipse cx="52" cy="69" rx="2" ry="2.8" fill="var(--cs-ink)"/><ellipse cx="76" cy="69" rx="2" ry="2.8" fill="var(--cs-ink)"/>',
      '<path d="M64 70c-1 7-4 12-2 14 2 2 5 2 7 0m-12 8c4 3 10 3 14 0" fill="none" stroke="var(--cs-ink)" stroke-opacity=".58" stroke-width="1.3" stroke-linecap="round"/>',
      '<path d="M46 80q5 3 10 0m16 0q5 3 10 0" fill="none" stroke="var(--cs-line)" stroke-width="1" stroke-linecap="round" opacity="' + wrinkles + '"/>'
    ];
    if (hairStyle === 3 || hairStyle === 4) out.push('<path d="M39 58v36c1 7 5 11 10 13V65m40-7v36c-1 7-5 11-10 13V65" fill="' + hair + '"/>');
    if (glasses) out.push('<g fill="none" stroke="var(--cs-ink)" stroke-width="1.7" stroke-opacity=".82"><rect x="43" y="62" width="19" height="14" rx="' + (hairStyle % 2 ? '5' : '3') + '"/><rect x="66" y="62" width="19" height="14" rx="' + (hairStyle % 2 ? '5' : '3') + '"/><path d="M62 67h4m-24-1-4-2m47 2 4-2"/></g>');
    out.push('<path d="M51 119l13 11 13-11" fill="none" stroke="var(--cs-card)" stroke-width="3" opacity=".9"/>', '</svg>');
    return out.join('');
  }
  var api = { portraitSvg:portraitSvg };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.BoardsGamePortrait = api;
}());
