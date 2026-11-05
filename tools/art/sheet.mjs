// node tools/art/sheet.mjs [prefix] [--size=84] [--extra=<file.js>] — renders the art kit's motifs to a contact sheet, light and dark.
// --extra loads another file of shArt.register() calls after the kit (a group drawn in a scratch file before it's merged in).
// The whole kit: tools/art/sheet-light.png and sheet-dark.png. A group (a name prefix such as "trophy-"): sheet-<prefix>.png.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const args = process.argv.slice(2);
const prefix = args.find(a => !a.startsWith('--')) || '';
const size = parseInt((args.find(a => a.startsWith('--size=')) || '--size=84').slice(7), 10);
const extra = (args.find(a => a.startsWith('--extra=')) || '').slice(8);

const art = fs.readFileSync(path.join(root, 'widget', 'art.js'), 'utf8') + (extra ? '\n' + fs.readFileSync(path.resolve(extra), 'utf8') : '');
const page = (dark) => `<!doctype html><html lang="en"${dark ? ' data-theme="dark"' : ''}><head><meta charset="utf-8">
<style>
  body{margin:0; padding:24px; background:${dark ? '#131412' : '#F4F1EA'}; color:${dark ? '#F1F0EC' : '#1F201D'}; font:14px/1.3 system-ui, sans-serif}
  .grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(${size * 3 + 36}px, 1fr)); gap:18px 10px}
  figure{margin:0; text-align:center} figcaption{font-size:11px; margin-top:4px; opacity:.8; word-break:break-all}
  h1{font:500 20px/1.2 Georgia, serif; margin:0 0 16px}
</style></head><body><h1>${prefix ? 'Group: ' + prefix : 'The art kit'} (${dark ? 'dark' : 'light'})</h1><div class="grid" id="g"></div>
<script>${art}</script>
<script>
  var names = shArt.names().filter(function(n){ return n.indexOf(${JSON.stringify(prefix)}) === 0; });
  document.getElementById('g').innerHTML = names.map(function(n){ return '<figure>' + shArt.svg(n, { size: ${size} }) + ' ' + shArt.svg(n, { size: 36 }) + '<figcaption>' + n + '</figcaption></figure>'; }).join('');
  document.title = names.length + ' motifs';
</script></body></html>`;

const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const dark of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.setContent(page(dark), { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const n = await p.title();
  const out = path.join(here, prefix ? `sheet-${prefix.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '')}${dark ? '-dark' : ''}.png` : `sheet-${dark ? 'dark' : 'light'}.png`);
  await p.screenshot({ path: out, fullPage: true, type: 'png' });
  console.log(`${n}: ${path.relative(root, out)}`);
  await ctx.close();
}
await b.close();
