'use strict';

const LABEL_W = 126;
const TOOTH_W = 96;
const SITES = {
  facial: ['MB', 'B', 'DB'],
  lingual: ['ML', 'L', 'DL']
};
const ROWS = [
  { metric: 'pd', surface: 'facial', label: 'PD / FACIAL', y: 154 },
  { metric: 'pd', surface: 'lingual', label: 'PD / LINGUAL', y: 176 },
  { metric: 'bop', surface: 'facial', label: 'BOP / FACIAL', y: 205 },
  { metric: 'bop', surface: 'lingual', label: 'BOP / LINGUAL', y: 226 },
  { metric: 'supp', surface: 'facial', label: 'SUPP / FACIAL', y: 255 },
  { metric: 'supp', surface: 'lingual', label: 'SUPP / LINGUAL', y: 276 },
  { metric: 'rec', surface: 'facial', label: 'REC / FACIAL', y: 315 },
  { metric: 'rec', surface: 'lingual', label: 'REC / LINGUAL', y: 337 },
  { metric: 'cal', surface: 'facial', label: 'CAL / FACIAL', y: 376 },
  { metric: 'cal', surface: 'lingual', label: 'CAL / LINGUAL', y: 398 }
];
const SITE_INDEX = {
  facial: [0, 1, 2],
  lingual: [3, 4, 5]
};

function xml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[ch]);
}

function formatNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}

function values(tooth, key) {
  const source = Array.isArray(tooth && tooth[key]) ? tooth[key] : [];
  return Array.from({ length: 6 }, (_, i) => {
    const value = source[i];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  });
}

function toothMap(opts, arch) {
  const teeth = Array.isArray(opts.teeth) ? opts.teeth : [];
  const range = arch === 'max' ? [1, 16] : arch === 'mand' ? [17, 32] : [1, 32];
  const byNumber = new Map();
  for (const tooth of teeth) {
    if (!tooth || !Number.isInteger(tooth.n) || tooth.n < range[0] || tooth.n > range[1]) continue;
    byNumber.set(tooth.n, tooth);
  }
  return { range, byNumber };
}

function describe(arch, charted) {
  const teeth = [...charted.values()].filter(tooth => tooth && !tooth.missing);
  const pd = teeth.flatMap(tooth => values(tooth, 'pd')).filter(value => value !== null);
  const bop = teeth.flatMap(tooth => Array.isArray(tooth.bop) ? tooth.bop.slice(0, 6) : []).filter(value => typeof value === 'boolean');
  const supp = teeth.flatMap(tooth => Array.isArray(tooth.supp) ? tooth.supp.slice(0, 6) : []).filter(value => typeof value === 'boolean');
  const archName = arch === 'max' ? 'Maxillary' : arch === 'mand' ? 'Mandibular' : 'Maxillary and mandibular';
  const parts = [`${archName} periodontal chart with ${teeth.length} recorded ${teeth.length === 1 ? 'tooth' : 'teeth'}.`];
  const deep = pd.filter(value => value > 5).length;
  parts.push(pd.length
    ? `${deep} of ${pd.length} recorded probing depths are over 5 mm.`
    : 'No probing depths are recorded.');
  const positives = bop.filter(Boolean).length;
  parts.push(bop.length
    ? `BOP is positive at ${positives} of ${bop.length} recorded sites (${Math.round(positives / bop.length * 100)}%).`
    : 'No BOP sites are recorded.');
  const suppPositive = supp.filter(Boolean).length;
  parts.push(supp.length
    ? `Suppuration is marked at ${suppPositive} of ${supp.length} recorded sites.`
    : 'No suppuration sites are recorded.');

  const mobility = teeth.filter(tooth => Number.isInteger(tooth.mob) && tooth.mob >= 0 && tooth.mob <= 3);
  if (mobility.length) {
    const grades = [...new Set(mobility.map(tooth => tooth.mob))].sort((a, b) => a - b);
    parts.push(`Mobility grades recorded: ${grades.map(grade => `${grade} at ${mobility.filter(tooth => tooth.mob === grade).length} ${mobility.filter(tooth => tooth.mob === grade).length === 1 ? 'tooth' : 'teeth'}`).join(', ')}.`);
  }

  const furcations = teeth.flatMap(tooth => Object.values(tooth.furc || {}).filter(value => ['I', 'II', 'III'].includes(value)));
  if (furcations.length) {
    const classes = ['I', 'II', 'III'].filter(grade => furcations.includes(grade));
    parts.push(`Furcation marks recorded: ${classes.map(grade => `class ${grade} at ${furcations.filter(value => value === grade).length} ${furcations.filter(value => value === grade).length === 1 ? 'site' : 'sites'}`).join(', ')}.`);
  }
  const missing = [...charted.values()].filter(tooth => tooth && tooth.missing).length;
  const implants = teeth.filter(tooth => tooth.implant).length;
  if (missing) parts.push(`${missing} tooth${missing === 1 ? ' is' : 's are'} marked missing.`);
  if (implants) parts.push(`${implants} implant${implants === 1 ? ' is' : 's are'} marked.`);
  return parts.join(' ');
}

function svg(opts = {}) {
  const arch = opts.arch == null ? 'both' : opts.arch;
  if (!['max', 'mand', 'both'].includes(arch)) throw new TypeError('arch must be max, mand, or both');
  const { range, byNumber } = toothMap(opts, arch);
  const toothNumbers = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i);
  const charted = new Map(toothNumbers.filter(n => byNumber.has(n)).map(n => [n, byNumber.get(n)]));
  const calVisible = !!(opts.show && opts.show.cal === true);
  const rows = ROWS.filter(row => row.metric !== 'cal' || calVisible);
  const width = LABEL_W + toothNumbers.length * TOOTH_W;
  const height = 514;
  const bottom = 459;
  const alt = describe(arch, charted);
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${xml(alt)}">`,
    '<style>',
    'text{font-family:var(--font-mono);fill:var(--ink)}',
    '.label{font-size:11px;fill:var(--ink-soft)}.small{font-size:10px;fill:var(--ink-faint)}.site{font-size:9px;fill:var(--ink-soft)}',
    '.number{font-size:12px;font-weight:600}.value{font-size:12px}.tag{font-size:9px;fill:var(--accent-ink)}',
    '.rule{stroke:var(--line);stroke-width:1}.strong{stroke:var(--line-strong);stroke-width:1.4}',
    '.bop{fill:var(--bad)}.supp{fill:var(--caution)}.missing{stroke:var(--bad);stroke-width:2.5;opacity:.55}',
    '</style>',
    `<text class="number" x="10" y="25">Periodontal chart</text>`
  ];

  if (arch === 'both') {
    out.push(`<text class="label" text-anchor="middle" x="${LABEL_W + 8 * TOOTH_W}" y="51">Maxillary</text>`);
    out.push(`<text class="label" text-anchor="middle" x="${LABEL_W + 24 * TOOTH_W}" y="51">Mandibular</text>`);
  } else {
    out.push(`<text class="label" x="10" y="51">${arch === 'max' ? 'Maxillary' : 'Mandibular'}</text>`);
  }
  out.push(`<text class="small" x="10" y="76">TOOTH</text>`);

  for (let i = 0; i < toothNumbers.length; i++) {
    const n = toothNumbers[i];
    const x = LABEL_W + i * TOOTH_W;
    const center = x + TOOTH_W / 2;
    const tooth = byNumber.get(n);
    out.push(`<text class="number" text-anchor="middle" x="${center}" y="77">${n}</text>`);
    if (tooth && tooth.missing) {
      out.push(`<text class="tag" text-anchor="middle" x="${center}" y="93">MISSING</text>`);
    } else if (tooth && tooth.implant) {
      out.push(`<text class="tag" text-anchor="middle" x="${center}" y="93">IMPLANT</text>`);
    }
    for (const surface of ['facial', 'lingual']) {
      const siteY = surface === 'facial' ? 110 : 126;
      for (let site = 0; site < 3; site++) {
        const cx = x + (site + 0.5) * TOOTH_W / 3;
        out.push(`<text class="site" text-anchor="middle" x="${cx}" y="${siteY}">${SITES[surface][site]}</text>`);
      }
    }
  }

  // Column rules mark each tooth, with a stronger divider between the arches.
  for (let i = 0; i <= toothNumbers.length; i++) {
    const x = LABEL_W + i * TOOTH_W;
    const archDivider = arch === 'both' && i === 16;
    out.push(`<line class="${archDivider ? 'strong' : 'rule'}" x1="${x}" y1="61" x2="${x}" y2="${bottom}"/>`);
  }
  out.push(`<line class="strong" x1="0" y1="137" x2="${width}" y2="137"/>`);

  const separators = calVisible ? [188, 237, 287, 348, 409] : [188, 237, 287];
  for (const y of separators) out.push(`<line class="rule" x1="0" y1="${y}" x2="${width}" y2="${y}"/>`);
  out.push(`<line class="strong" x1="0" y1="${bottom}" x2="${width}" y2="${bottom}"/>`);

  for (const row of rows) {
    out.push(`<text class="label" x="10" y="${row.y}">${row.label}</text>`);
    for (let i = 0; i < toothNumbers.length; i++) {
      const n = toothNumbers[i], x = LABEL_W + i * TOOTH_W;
      const tooth = byNumber.get(n);
      if (tooth && tooth.missing) continue;
      const indices = SITE_INDEX[row.surface];
      const sourceKey = row.metric === 'supp' ? 'supp' : row.metric;
      const numbers = sourceKey === 'cal' ? null : values(tooth, sourceKey);
      const pd = row.metric === 'cal' ? values(tooth, 'pd') : null;
      const rec = row.metric === 'cal' ? values(tooth, 'rec') : null;
      for (let j = 0; j < 3; j++) {
        const siteIndex = indices[j];
        const cx = x + (j + 0.5) * TOOTH_W / 3;
        const siteName = SITES[row.surface][j];
        if (row.metric === 'bop' || row.metric === 'supp') {
          const marks = tooth && Array.isArray(tooth[sourceKey]) ? tooth[sourceKey] : [];
          if (marks[siteIndex] === true) {
            const cls = row.metric === 'bop' ? 'bop' : 'supp';
            out.push(`<circle class="${cls}" cx="${cx}" cy="${row.y - 4}" r="4.5"/>`);
          }
          continue;
        }
        let value = numbers ? numbers[siteIndex] : null;
        if (row.metric === 'cal') value = pd[siteIndex] === null || rec[siteIndex] === null ? null : pd[siteIndex] + rec[siteIndex];
        const label = value === null ? '—' : formatNumber(value);
        const data = value === null ? '' : ` data-value="${xml(formatNumber(value))}"`;
        out.push(`<text class="value" data-metric="${row.metric}" data-tooth="${n}" data-surface="${row.surface}" data-site="${siteName}"${data} text-anchor="middle" x="${cx}" y="${row.y}">${xml(label)}</text>`);
      }
    }
  }

  // Mobility and furcation fields are shown as charted marks, without deriving a diagnosis.
  out.push('<text class="label" x="10" y="430">MOBILITY</text>');
  out.push('<text class="label" x="10" y="450">FURCATION</text>');
  for (let i = 0; i < toothNumbers.length; i++) {
    const n = toothNumbers[i], tooth = byNumber.get(n);
    if (!tooth || tooth.missing) continue;
    const x = LABEL_W + i * TOOTH_W, center = x + TOOTH_W / 2;
    if (Number.isInteger(tooth.mob) && tooth.mob >= 0 && tooth.mob <= 3) {
      out.push(`<text class="value" text-anchor="middle" x="${center}" y="430">${`M${tooth.mob}`}</text>`);
    }
    const marks = [];
    for (const [surface, value] of Object.entries(tooth.furc || {})) {
      if (!['I', 'II', 'III'].includes(value)) continue;
      const side = surface === 'b' ? 'B' : surface === 'l' ? 'L' : null;
      if (side) marks.push(`${side} ${value}`);
    }
    if (marks.length) out.push(`<text class="small" text-anchor="middle" x="${center}" y="450">${xml(marks.join(' · '))}</text>`);
  }

  // A missing tooth is crossed through its chart column and has no measurements rendered.
  for (let i = 0; i < toothNumbers.length; i++) {
    const n = toothNumbers[i], tooth = byNumber.get(n);
    if (!tooth || !tooth.missing) continue;
    const x = LABEL_W + i * TOOTH_W + 7, right = x + TOOTH_W - 14;
    out.push(`<line class="missing" x1="${x}" y1="141" x2="${right}" y2="${bottom - 4}"/>`);
    out.push(`<line class="missing" x1="${right}" y1="141" x2="${x}" y2="${bottom - 4}"/>`);
  }

  const legendY = 498;
  out.push(`<circle class="bop" cx="14" cy="${legendY - 4}" r="4.5"/>`);
  out.push(`<text class="small" x="24" y="${legendY}">BOP positive</text>`);
  out.push(`<circle class="supp" cx="126" cy="${legendY - 4}" r="4.5"/>`);
  out.push(`<text class="small" x="136" y="${legendY}">Suppuration</text>`);
  out.push(`<text class="small" x="244" y="${legendY}">PD probing depth · REC recession · CAL = PD + REC (mm)</text>`);
  out.push('</svg>');
  return out.join('\n');
}

module.exports = {
  key: 'perio-chart',
  alt: 'Six-site periodontal chart showing facial and lingual probing depths, recession, computed CAL, BOP and suppuration marks, mobility, furcation, implants, and missing teeth. The SVG label summarizes the supplied data.',
  svg
};
