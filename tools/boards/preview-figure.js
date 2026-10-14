#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function sampleTeeth(kind) {
  return Array.from({ length: 32 }, (_, index) => {
    const n = index + 1;
    const pd = [2, 3, 2, 2, 3, 2];
    const rec = [0, 0, 0, 0, 0, 0];
    const bop = [false, false, false, false, false, false];
    const supp = [false, false, false, false, false, false];
    const tooth = { n, pd: [...pd], rec: [...rec], bop: [...bop], supp: [...supp], mob: 0 };

    if (kind === 'stage3' && [3, 4, 5, 12, 13].includes(n)) {
      tooth.pd = [5, 6, 5, 4, 5, 4];
      tooth.rec = [2, 2, 1, 0, 1, 0];
      tooth.bop = [true, true, false, false, true, false];
    }

    if (kind === 'stage4') {
      tooth.pd = [6, 7, 6, 5, 7, 6];
      tooth.rec = [2, 4, 2, 1, 3, 1];
      tooth.bop = [true, true, false, true, true, false];
      tooth.supp = [false, false, false, true, false, false];
      if ([3, 14, 19, 30].includes(n)) tooth.mob = n === 14 || n === 30 ? 3 : 2;
      if (n === 3) tooth.furc = { b: 'II', l: 'I' };
      if (n === 14 || n === 30) tooth.furc = { b: 'III' };
      if (n === 19) tooth.furc = { l: 'II' };
      if ([1, 16, 17, 32].includes(n)) {
        tooth.missing = true;
        delete tooth.pd;
        delete tooth.rec;
        delete tooth.bop;
        delete tooth.supp;
        delete tooth.mob;
        delete tooth.furc;
      }
      if ([4, 29].includes(n)) tooth.implant = true;
    }
    return tooth;
  });
}

function sampleMarkup(figure) {
  const samples = [
    { title: 'Healthy sample', data: { arch: 'both', teeth: sampleTeeth('healthy'), show: { cal: true } } },
    { title: 'Stage III localized sample', data: { arch: 'max', teeth: sampleTeeth('stage3'), show: { cal: true } } },
    { title: 'Stage IV generalized sample', data: { arch: 'both', teeth: sampleTeeth('stage4'), show: { cal: true } } }
  ];
  return samples.map(sample => `<section class="sample">
    <h2>${sample.title}</h2>
    <div class="figure-scroll">${figure.svg(sample.data)}</div>
  </section>`).join('\n');
}

function main(argv) {
  const key = argv[0];
  let outFile = null;
  if (!key || !/^[a-z0-9-]+$/.test(key)) {
    console.error('Usage: node tools/boards/preview-figure.js <key> [--out <file>]');
    process.exit(2);
  }
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) outFile = path.resolve(argv[++i]);
    else {
      console.error(`Unknown argument: ${argv[i]}`);
      process.exit(2);
    }
  }

  const figureFile = path.join(ROOT, 'src', 'boards', 'figures', `${key}.js`);
  if (!fs.existsSync(figureFile)) {
    console.error(`No figure module found for "${key}": ${figureFile}`);
    process.exit(1);
  }
  delete require.cache[require.resolve(figureFile)];
  const figure = require(figureFile);
  if (figure.key !== key || typeof figure.svg !== 'function') {
    console.error(`${figureFile} must export { key: "${key}", alt, svg(opts) }`);
    process.exit(1);
  }

  const tokens = fs.readFileSync(path.join(ROOT, 'src', 'boards', 'css', 'tokens.css'), 'utf8');
  const html = `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${figure.key} figure preview</title>
<style>
${tokens}
*{box-sizing:border-box}
html,body{margin:0;max-width:100%;overflow-x:hidden}
body{background:var(--bg);color:var(--ink);font:16px/1.45 var(--font-body)}
main{width:min(1160px,calc(100% - 28px));margin:24px auto 48px}
.page-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 20px}
h1{font:700 24px/1.2 var(--font-display);margin:0}
.theme-toggle{border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink);padding:9px 13px;font:600 14px var(--font-body);cursor:pointer}
.sample{margin:18px 0;padding:18px 0 20px;border-top:1px solid var(--line)}
h2{font:700 19px/1.25 var(--font-display);margin:0 0 12px}
.figure-scroll{max-width:100%;overflow-x:auto;overflow-y:hidden;border:1px solid var(--line);border-radius:8px;background:var(--surface);overscroll-behavior-inline:contain}
.figure-scroll svg{display:block;max-width:none}
.note{font-size:13px;color:var(--ink-soft);margin:4px 0 20px}
@media(max-width:600px){main{width:calc(100% - 20px);margin-top:14px}.page-head{align-items:flex-start}h1{font-size:21px}.sample{padding-top:14px}.figure-scroll{border-radius:6px}}
</style>
</head>
<body>
<main>
  <header class="page-head"><h1>${figure.key} · figure preview</h1><button class="theme-toggle" type="button" id="theme-toggle" aria-pressed="false">Switch to dark mode</button></header>
  <p class="note">All values shown are sample data. Scroll inside each chart to view the full arch.</p>
  ${sampleMarkup(figure)}
</main>
<script>
document.getElementById('theme-toggle').addEventListener('click', function () {
  var dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  this.setAttribute('aria-pressed', String(dark));
  this.textContent = dark ? 'Switch to light mode' : 'Switch to dark mode';
});
</script>
</body>
</html>
`;
  if (!outFile) outFile = path.join(os.tmpdir(), 'study-hubs-figure-previews', `${key}-preview.html`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`Wrote standalone preview: ${outFile}`);
}

main(process.argv.slice(2));
