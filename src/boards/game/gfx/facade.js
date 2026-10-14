/* Seed-free SVG clinic facade. Readiness is a percentage, or {likely: 0..1}. */
(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function clamp(v, a, b) { v = Number(v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a; }
  function unitOf(v, i) {
    if (typeof v === 'string') return { id:'unit-' + (i + 1), title:v };
    if (!v || typeof v !== 'object') return null;
    var status = String(v.status || '').toLowerCase();
    if (status && ['taught', 'released', 'active'].indexOf(status) < 0) return null;
    var id = String(v.id || v.title || ('unit-' + (i + 1)));
    return { id:id, title:String(v.title || v.name || id) };
  }
  function unitPercent(input, unit, i) {
    var v = input;
    if (Array.isArray(input)) v = input[i];
    else if (input && typeof input === 'object') {
      var values = input.units && typeof input.units === 'object' ? input.units : input;
      v = values[unit.id];
      if (v == null) v = values[i];
      if (v == null && Number.isFinite(Number(input.likely))) v = input;
    }
    if (v && typeof v === 'object') {
      if (Number.isFinite(Number(v.percent))) v = v.percent;
      else if (Number.isFinite(Number(v.readiness))) v = v.readiness;
      else if (Number.isFinite(Number(v.likely))) v = Number(v.likely) <= 1 ? Number(v.likely) * 100 : v.likely;
    }
    return Math.round(clamp(v, 0, 100));
  }
  function label(text) { return text.length > 13 ? text.slice(0, 11) + '...' : text; }

  function facadeSvg(units, readiness) {
    var list = (Array.isArray(units) ? units : []).map(unitOf).filter(Boolean);
    var cols = Math.min(4, Math.max(1, list.length));
    var rows = Math.max(1, Math.ceil(list.length / cols));
    var top = 84, gap = 78;
    var bottom = top + (rows - 1) * gap + 43 + 102;
    var height = bottom + 22, out = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 ' + height + '" role="img" aria-label="Chairside clinic facade">',
      '<title>Chairside clinic readiness facade</title>',
      '<desc>Each released unit has a window whose warm light reflects readiness from zero to one hundred percent.</desc>',
      '<style>.csf-light{transition:opacity 240ms ease-out}@media (prefers-reduced-motion:reduce){.csf-light{transition:none}}</style>',
      '<rect width="640" height="' + height + '" rx="18" fill="var(--cs-night, var(--cs-card))"/>',
      '<circle cx="79" cy="49" r="2" fill="var(--cs-paper)" opacity=".72"/><circle cx="552" cy="61" r="1.5" fill="var(--cs-paper)" opacity=".6"/>',
      '<path d="M0 ' + (height - 27) + 'H640V' + height + 'H0z" fill="var(--cs-line)"/>',
      '<rect x="28" y="37" width="584" height="' + (bottom - 37) + '" rx="14" fill="var(--cs-facade-wall, var(--cs-card))" stroke="var(--cs-line)" stroke-width="2"/>',
      '<path d="M28 61V51a14 14 0 0 1 14-14h556a14 14 0 0 1 14 14v10z" fill="var(--cs-facade-roof, var(--cs-line))"/>',
      '<rect x="228" y="45" width="184" height="28" rx="5" fill="var(--cs-card)"/>',
      '<text x="320" y="64" text-anchor="middle" fill="var(--cs-ink)" font-family="system-ui,sans-serif" font-size="12" font-weight="700" letter-spacing="1.2">CHAIRSIDE CLINIC</text>'
    ];
    for (var r = 0; r < rows; r++) {
      var first = r * cols, count = Math.min(cols, Math.max(0, list.length - first));
      var cell = 132, center = 320 - (count * cell) / 2 + cell / 2, y = top + r * gap;
      out.push('<path d="M48 ' + (y + 70) + 'H592" stroke="var(--cs-line)" stroke-width="2" opacity=".75"/>');
      for (var c = 0; c < count; c++) {
        var unit = list[first + c], pct = unitPercent(readiness, unit, first + c);
        var x = center + c * cell - 32;
        out.push(
          '<g role="img" aria-label="' + esc(unit.title) + ', readiness ' + pct + ' percent"><title>' + esc(unit.title) + ': ' + pct + '% readiness</title>' +
          '<rect x="' + x + '" y="' + y + '" width="64" height="45" rx="6" fill="var(--cs-line)"/>' +
          '<rect x="' + (x + 4) + '" y="' + (y + 4) + '" width="56" height="37" rx="3" fill="var(--cs-facade-glass, var(--cs-paper))"/>' +
          '<rect class="csf-light" x="' + (x + 5) + '" y="' + (y + 5) + '" width="54" height="35" rx="2" fill="var(--cs-lamp)" opacity="' + (pct / 100).toFixed(2) + '"/>' +
          '<path d="M' + (x + 32) + ' ' + (y + 5) + 'v35M' + (x + 5) + ' ' + (y + 23) + 'h54" stroke="var(--cs-line)" stroke-width="2" opacity=".88"/>' +
          '<text x="' + (x + 32) + '" y="' + (y + 60) + '" text-anchor="middle" fill="var(--cs-ink)" font-family="system-ui,sans-serif" font-size="10" font-weight="600">' + esc(label(unit.title)) + '</text></g>'
        );
      }
    }
    var door = bottom - 76;
    out.push(
      '<rect x="278" y="' + door + '" width="84" height="77" rx="7" fill="var(--cs-facade-door, var(--cs-line))"/>' +
      '<rect x="289" y="' + (door + 10) + '" width="62" height="42" rx="3" fill="var(--cs-facade-glass, var(--cs-paper))"/>' +
      '<path d="M320 ' + (door + 10) + 'v42M289 ' + (door + 31) + 'h62" stroke="var(--cs-line)" stroke-width="2"/>' +
      '<circle cx="348" cy="' + (door + 64) + '" r="2" fill="var(--cs-lamp)"/>' +
      '<path d="M32 ' + (bottom - 1) + 'H608" stroke="var(--cs-ink)" stroke-width="3" opacity=".18"/></svg>'
    );
    return out.join('');
  }
  var api = { facadeSvg:facadeSvg };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.BoardsGameFacade = api;
}());
