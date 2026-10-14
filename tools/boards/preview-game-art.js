#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const { facadeSvg } = require('../../src/boards/game/gfx/facade.js');
const { portraitSvg } = require('../../src/boards/game/gfx/portrait.js');
const sfxPath = path.join(root, 'src/boards/game/audio/sfx.js');
const sfxSource = fs.readFileSync(sfxPath, 'utf8');
const units = [
  { id:'diagnosis', title:'Diagnosis', status:'taught' },
  { id:'perio', title:'Periodontics', status:'taught' },
  { id:'pharm', title:'Pharmacology', status:'taught' },
  { id:'endo', title:'Endodontics', status:'taught' },
  { id:'operative', title:'Operative', status:'taught' }
];
const levels = [0, 25, 50, 75, 100];
const facades = levels.map((value) => `
  <article class="facade-card">
    <div class="facade-heading"><strong>${value}% readiness</strong><span>${value === 0 ? 'Lights off' : value === 100 ? 'All lit' : 'Windows warming'}</span></div>
    ${facadeSvg(units, value)}
  </article>`).join('');
const portraits = Array.from({ length:24 }, (_, index) => {
  const seed = index + 1;
  return `<article class="portrait-card">${portraitSvg(seed)}<span>Seed ${seed}</span></article>`;
}).join('');

const html = `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>Chairside game art preview</title>
  <script>if (new URLSearchParams(location.search).get('theme') === 'dark') document.documentElement.setAttribute('data-theme', 'dark');</script>
  <style>
    :root {
      color-scheme: light;
      --cs-ink:#14232B; --cs-paper:#F5F2EC; --cs-card:#FFFDF8; --cs-line:#D9D3C7;
      --cs-night:#0B1E2A; --cs-lamp:#FFC56B; --cs-good:#0072B2; --cs-flow:#009E73;
      --cs-facade-wall:#E9E4DA; --cs-facade-roof:#D9D3C7; --cs-facade-glass:#B8CDD5;
      --cs-facade-door:#C9C3B8; --cs-shirt-1:#0072B2; --cs-shirt-2:#009E73;
      --cs-shirt-3:#CC79A7; --cs-shirt-4:#D55E00; --cs-shirt-5:#4A6982; --cs-shirt-6:#8B6F47;
      --cs-skin-1:#613D32; --cs-skin-2:#79503D; --cs-skin-3:#925C43; --cs-skin-4:#A96D4F; --cs-skin-5:#BC8060;
      --cs-skin-6:#CC9471; --cs-skin-7:#D8A685; --cs-skin-8:#E2B894; --cs-skin-9:#EDC9A6; --cs-skin-10:#F2D5B7;
      --cs-hair-1:#251F20; --cs-hair-2:#46302A; --cs-hair-3:#644334; --cs-hair-4:#865A40;
      --cs-hair-5:#A67B4E; --cs-hair-6:#B49A76; --cs-hair-7:#74777A; --cs-hair-8:#C5C1B7;
    }
    html[data-theme="dark"] {
      color-scheme: dark;
      --cs-ink:#E9EEF0; --cs-paper:#0F1A20; --cs-card:#16242C; --cs-line:#2A3A43;
      --cs-good:#56B4E9; --cs-flow:#56B4E9; --cs-facade-wall:#20343C; --cs-facade-roof:#2A3A43;
      --cs-facade-glass:#304D5A; --cs-facade-door:#2A3A43;
    }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--cs-paper); color:var(--cs-ink); font:15px/1.45 system-ui,sans-serif; }
    main { width:min(1440px,100%); margin:0 auto; padding:24px; }
    h1,h2,p { margin:0; }
    h1 { font-size:clamp(1.65rem,3vw,2.25rem); line-height:1.15; }
    h2 { font-size:1.25rem; margin-bottom:5px; }
    .intro { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:24px; }
    .lede { max-width:700px; margin-top:8px; color:var(--cs-ink); opacity:.78; }
    .toolbar,.sound-buttons { display:flex; flex-wrap:wrap; gap:8px; }
    button { border:1px solid var(--cs-line); border-radius:10px; padding:9px 12px; background:var(--cs-card); color:var(--cs-ink); font:600 13px/1.2 system-ui,sans-serif; cursor:pointer; transition:transform 120ms ease, border-color 120ms ease; }
    button:hover { transform:translateY(-1px); border-color:var(--cs-good); }
    button:focus-visible { outline:3px solid var(--cs-good); outline-offset:2px; }
    .section { margin-top:24px; }
    .section-head { display:flex; justify-content:space-between; gap:16px; align-items:baseline; margin-bottom:10px; }
    .section-head p { opacity:.72; font-size:13px; }
    .facade-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; }
    .facade-card,.portrait-card,.sound-panel { min-width:0; background:var(--cs-card); border:1px solid var(--cs-line); border-radius:14px; overflow:hidden; }
    .facade-card { padding:8px; }
    .facade-heading { display:flex; justify-content:space-between; gap:4px; align-items:baseline; padding:2px 3px 7px; font-size:12px; }
    .facade-heading span { opacity:.68; font-size:10px; }
    .facade-card svg { width:100%; max-width:100%; min-width:0; height:auto; display:block; }
    .portrait-grid { display:grid; grid-template-columns:repeat(8,minmax(0,1fr)); gap:10px; }
    .portrait-card { padding:6px; text-align:center; }
    .portrait-card svg { display:block; width:100%; max-width:100%; min-width:0; height:auto; }
    .portrait-card span { display:block; margin-top:4px; font-size:11px; opacity:.72; }
    .sound-panel { padding:16px; }
    .sound-panel p { margin:5px 0 12px; opacity:.75; font-size:13px; }
    #sound-status { min-height:1.4em; margin-top:10px; }
    @media (max-width:1000px) { .facade-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } .portrait-grid { grid-template-columns:repeat(6,minmax(0,1fr)); } }
    @media (max-width:620px) { main { padding:16px; } .intro { display:block; } .toolbar { margin-top:14px; } .facade-grid { grid-template-columns:1fr; } .portrait-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; } .section-head { display:block; } }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; } }
  </style>
</head>
<body>
  <main>
    <header class="intro">
      <div><h1>Chairside game art</h1><p class="lede">Standalone review preview: a calm clinic facade, repeatable patient portraits, and optional synthesized interface sounds.</p></div>
      <div class="toolbar"><button id="theme-toggle" type="button" aria-pressed="false">Use dark theme</button><button id="sound-toggle" type="button" aria-pressed="false">Enable sounds</button></div>
    </header>
    <section aria-labelledby="facade-title">
      <div class="section-head"><div><h2 id="facade-title">Clinic readiness</h2><p>One lit window per released unit. Brightness follows readiness.</p></div><p>Same facade at five readiness levels</p></div>
      <div class="facade-grid">${facades}
      </div>
    </section>
    <section class="section" aria-labelledby="portrait-title">
      <div class="section-head"><div><h2 id="portrait-title">Generated patients</h2><p>Seeds 1-24. A seed always produces the same face.</p></div><p>Age, skin tone, hairstyle, and glasses vary.</p></div>
      <div class="portrait-grid">${portraits}</div>
    </section>
    <section class="section" aria-labelledby="sound-title">
      <div class="section-head"><div><h2 id="sound-title">Synthesized UI sounds</h2><p>WebAudio only. Sound starts off and requires the Enable sounds button.</p></div></div>
      <div class="sound-panel">
        <div class="sound-buttons">
          <button type="button" data-sound="tap">Tap / select</button>
          <button type="button" data-sound="lock">Lock in</button>
          <button type="button" data-sound="correct">Correct</button>
          <button type="button" data-sound="wrong">Not quite</button>
          <button type="button" data-sound="flow" data-tier="3">Flow up</button>
          <button type="button" data-sound="window">Window light</button>
        </div>
        <p id="sound-status" role="status" aria-live="polite">Sound is off. Enable it to audition the cues.</p>
      </div>
    </section>
  </main>
  <script>${sfxSource}</script>
  <script>
    (function () {
      var theme = document.getElementById('theme-toggle');
      var sound = document.getElementById('sound-toggle');
      var status = document.getElementById('sound-status');
      var api = window.BoardsGameSfx;
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      theme.setAttribute('aria-pressed', String(dark));
      theme.textContent = dark ? 'Use light theme' : 'Use dark theme';
      theme.addEventListener('click', function () {
        var dark = document.documentElement.getAttribute('data-theme') !== 'dark';
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        theme.setAttribute('aria-pressed', String(dark));
        theme.textContent = dark ? 'Use light theme' : 'Use dark theme';
      });
      sound.addEventListener('click', function () {
        var enabling = sound.getAttribute('aria-pressed') !== 'true';
        var ready = api.enable(enabling);
        var on = enabling && ready;
        sound.setAttribute('aria-pressed', String(on));
        sound.textContent = on ? 'Turn sounds off' : 'Enable sounds';
        status.textContent = on ? 'Sound is on at a low volume.' : 'Sound is off or unavailable in this browser.';
      });
      document.querySelectorAll('[data-sound]').forEach(function (button) {
        button.addEventListener('click', function () {
          if (!api.enabled) { status.textContent = 'Sound is off. Enable it to audition the cues.'; return; }
          var played = api.play(button.getAttribute('data-sound'), { tier:Number(button.getAttribute('data-tier')) || 0 });
          status.textContent = played ? 'Playing: ' + button.textContent + '.' : 'This cue is unavailable.';
        });
      });
    }());
  </script>
</body>
</html>
`;

const output = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, 'game-art-preview.html');
fs.mkdirSync(path.dirname(output), { recursive:true });
fs.writeFileSync(output, html, 'utf8');
process.stdout.write(`Wrote ${path.relative(root, output)}\n`);
