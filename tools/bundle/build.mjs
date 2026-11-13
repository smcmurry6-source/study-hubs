#!/usr/bin/env node
// The redesign's bundles (redesign phase 5, part 2: vault/tasks/done/2026-11-05-redesign-phase-5-backend.md).
//
// The live pages load each widget file by itself (a hub, about 17 of them). The redesign's pages load these instead,
// written next to their sources in widget/ so every address a file works out from its own stays right:
//   widget/hub.bundle.js       a hub's engine, with the page
//   widget/dash.bundle.js      the dashboard's engine, with the page
//   widget/rest.bundle.js      the widgets both share and the database client, once the page is drawn
//   widget/hub-rest.bundle.js  a hub's own widget layer (widget/v3.js, its styles and what it loads), after rest.bundle.js
//   widget/site.bundle.css     the one stylesheet every redesigned page links
// What goes in each is tools/bundle/bundles.json. Nothing here changes a source file, and no live page loads a bundle.
//
// A bundle is its sources end to end with the comments, indentation and blank lines taken out, and nothing else: no
// renaming, no rewriting. Comments are found with a real parser (acorn, vendored beside this file) and every file's
// tokens are compared before and after, so the build fails rather than change a single token of code.
// A 'hold' file is wrapped in a function the page runs when it wants that file (window.SH_BUNDLE.run(name), below),
// and inside it `document.currentScript` reads a stand-in whose src is the address the file would have had by itself.
//
//   node tools/bundle/build.mjs            write the bundles
//   node tools/bundle/build.mjs --check    fail if a bundle on disk is not what the sources build (CI)
//   node tools/bundle/build.mjs --sizes    print each bundle's size, raw and gzipped
// Run it after changing any file listed in bundles.json: CI's --check fails until the bundles are current.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../.."), WIDGET = path.join(ROOT, "widget");
const acorn = createRequire(import.meta.url)("./vendor/acorn.cjs");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(HERE, "bundles.json"), "utf8"));
const CHECK = process.argv.includes("--check"), SIZES = process.argv.includes("--sizes");
const STAND_IN = "__sh_script";
const read = f => {
  const t = fs.readFileSync(path.join(WIDGET, f), "utf8");
  if (t.includes("\r")) throw new Error(`widget/${f} has carriage returns (CRLF line ends): save it with LF`);
  return t;
};

/* What a page with 'hold' files needs: one small object, made by whichever bundle arrives first. */
const RUNTIME = `(function(){
var B = window.SH_BUNDLE;
if (!B) {
var held = {}, ran = {};
B = window.SH_BUNDLE = {
dir: "",
hold: function(name, fn){ if (!ran[name]) held[name] = fn; },
has: function(name){ return !!(held[name] || ran[name]); },
run: function(name){
if (ran[name]) return true;
var fn = held[name]; if (!fn) return false;
ran[name] = true; delete held[name];
fn({ src: B.dir + name });
return true;
}
};
}
if (!B.dir) try { B.dir = document.currentScript.src.replace(/[^\\/]*(\\?.*)?$/, ""); } catch (e) {}
})();`;

/* ---------- JavaScript: comments, indentation and blank lines out; every token kept ---------- */
function tokens(src, file){
  const out = [];
  try {
    for (const t of acorn.tokenizer(src, { ecmaVersion: "latest", sourceType: "script" })) {
      const v = t.type.label === "regexp" ? t.value.pattern + "/" + t.value.flags : t.type.label === "template" ? src.slice(t.start, t.end) : t.value;
      out.push(t.type.label + "\u0001" + (v === undefined ? "" : String(v)));
    }
  } catch (e) { throw new Error(`widget/${file}: ${e.message}`); }
  return out;
}
function stripJs(src, file, standIn){
  const comments = [], toks = [];
  let ast;
  try { ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "script", onComment: comments, onToken: toks }); }
  catch (e) { throw new Error(`widget/${file} does not parse: ${e.message}`); }
  /* one script made of several must not start with a directive ("use strict" at the top would reach the next file) */
  if (ast.body.some(n => n.directive)) throw new Error(`widget/${file} starts with a "${ast.body.find(n => n.directive).directive}" directive outside a function: in a bundle it would apply to the files after it`);
  /* 0 code, 1 kept as it is (a string, template or regular expression: its line ends and spaces are part of it),
     2 a comment on one line, 3 a comment that holds a line end (it counts as one, so a line end is left) */
  const kind = new Uint8Array(src.length);
  for (const t of toks) if (/^(string|template|regexp)$/.test(t.type.label)) kind.fill(1, t.start, t.end);
  for (const c of comments) kind.fill(/\n/.test(src.slice(c.start, c.end)) ? 3 : 2, c.start, c.end);
  /* `document.currentScript` in a held file: the stand-in the bundle hands it */
  const swap = new Map();
  if (standIn) {
    for (let i = 0; i + 2 < toks.length; i++) {
      const [a, b, c] = [toks[i], toks[i + 1], toks[i + 2]];
      if (a.type.label === "name" && a.value === "document" && b.type.label === "." && c.type.label === "name" && c.value === "currentScript") swap.set(a.start, c.end);
    }
    if (toks.some(t => t.type.label === "name" && t.value === "currentScript" && ![...swap.values()].includes(t.end)))
      throw new Error(`widget/${file} reads currentScript some other way than \`document.currentScript\`: the bundle can only stand in for that spelling`);
  }
  let out = "", lineStart = true, keep = 0;   /* keep: out's length after the last character that must stay */
  const endLine = () => {
    while (out.length > keep && /[ \t]/.test(out[out.length - 1])) out = out.slice(0, -1);
    if (out.length && out[out.length - 1] !== "\n") out += "\n";
    lineStart = true;
  };
  for (let i = 0; i < src.length; i++) {
    const k = kind[i], ch = src[i];
    if (swap.has(i)) { out += STAND_IN; i = swap.get(i) - 1; lineStart = false; continue; }
    if (k === 1) { out += ch; keep = out.length; lineStart = false; continue; }
    if (k === 2 || k === 3) {
      let j = i; while (j < src.length && kind[j] === k) j++;
      if (k === 3) endLine(); else if (!lineStart) out += " ";
      i = j - 1; continue;
    }
    if (ch === "\n") { endLine(); continue; }
    if ((ch === " " || ch === "\t") && lineStart) continue;
    out += ch; lineStart = false;
  }
  out = out.replace(/[ \t\n]+$/, "");
  /* proof: the same tokens, in the same order (the stand-in swapped back) */
  const before = tokens(src, file), after = tokens(out, file + " (stripped)");
  if (standIn) for (let i = 0; i < after.length; i++) if (after[i] === "name\u0001" + STAND_IN) after.splice(i, 1, "name\u0001document", ".\u0001", "name\u0001currentScript");
  if (before.length !== after.length || before.some((t, i) => t !== after[i])) {
    const at = before.findIndex((t, i) => t !== after[i]);
    throw new Error(`widget/${file}: taking the comments out changed the code at token ${at} (${String(before[at]).replace("\u0001", " ")} became ${String(after[at]).replace("\u0001", " ")}); tools/bundle/build.mjs is wrong for this file`);
  }
  return { code: out, usesScript: toks.some(t => t.type.label === "name" && t.value === "currentScript") };
}

/* ---------- CSS: comments, indentation and blank lines out ----------
   A comment goes only when a space or a line end is beside it (or it starts or ends the file): then taking it out
   cannot join or split two tokens. One wedged between two tokens stays as it is. Strings and url(...) are kept whole. */
function stripCss(src, file){
  let out = "", i = 0, lineStart = true, keep = 0, depth = 0;
  const n = src.length, ws = c => c === " " || c === "\t" || c === "\n" || c === undefined;
  const endLine = () => {
    while (out.length > keep && /[ \t]/.test(out[out.length - 1])) out = out.slice(0, -1);
    if (out.length && out[out.length - 1] !== "\n") out += "\n";
    lineStart = true;
  };
  while (i < n) {
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1; while (j < n && src[j] !== ch) j += src[j] === "\\" ? 2 : 1;
      if (j >= n) throw new Error(`widget/${file}: a string is never closed (from character ${i})`);
      out += src.slice(i, j + 1); keep = out.length; lineStart = false; i = j + 1; continue;
    }
    if (/^url\(/i.test(src.slice(i, i + 4)) && !/[\w-]/.test(src[i - 1] || "")) {
      let j = i + 4; while (j < n && ws(src[j])) j++;
      if (src[j] !== '"' && src[j] !== "'") {   /* an unquoted address: whole, to its bracket */
        while (j < n && src[j] !== ")") j += src[j] === "\\" ? 2 : 1;
        out += src.slice(i, j + 1); keep = out.length; lineStart = false; i = j + 1; continue;
      }
    }
    if (ch === "/" && src[i + 1] === "*") {
      const j = src.indexOf("*/", i + 2);
      if (j < 0) throw new Error(`widget/${file}: a comment is never closed (from character ${i})`);
      if (ws(src[i - 1]) || ws(src[j + 2]) || lineStart) { i = j + 2; continue; }
      out += src.slice(i, j + 2); keep = out.length; lineStart = false; i = j + 2; continue;
    }
    if (ch === "\n") { endLine(); i++; continue; }
    if ((ch === " " || ch === "\t") && lineStart) { i++; continue; }
    if (ch === "{") depth++; else if (ch === "}") depth--;
    if (depth < 0) throw new Error(`widget/${file}: a "}" with no "{" before it (character ${i})`);
    out += ch; lineStart = false; i++;
  }
  if (depth) throw new Error(`widget/${file}: ${depth} "{" never closed`);
  if (/@(import|charset|namespace)\b/i.test(out)) throw new Error(`widget/${file} has an @import, @charset or @namespace rule: those only work at the top of a stylesheet, not inside a bundle`);
  return out.replace(/[ \t\n]+$/, "");
}

/* ---------- the bundles ---------- */
const head = (out, what, files) => `/* GENERATED by tools/bundle/build.mjs (${what}). Do not edit: change the files it is made of and run the build.\n   widget/${out} = ${files.map(f => "widget/" + f).join(" + ")} */\n`;
/* a stylesheet that comes inside a script bundle: a <style> ahead of the page's one stylesheet, so that sheet still wins
   (where widget/hub.js used to put the link to widget/v3.css). It has no address of its own, so it can hold none. */
function styleTag(f){
  const css = stripCss(read(f), f);
  if (/url\(/i.test(css)) throw new Error(`widget/${f} has a url(): inside a script bundle it would be read from the page's address, not the stylesheet's`);
  const id = "sh-css-" + f.replace(/\.css$/, "").replace(/\W+/g, "-");
  return `/* ---- widget/${f} ---- */\n(function(){\nif (document.getElementById(${JSON.stringify(id)})) return;\nvar s = document.createElement("style"); s.id = ${JSON.stringify(id)};\ns.textContent = ${JSON.stringify(css)};\n` +
    `var at = document.querySelector('link[rel="stylesheet"][href*="site.bundle.css"]');\nif (at) at.parentNode.insertBefore(s, at); else document.head.appendChild(s);\n})();\n`;
}
function script(out, spec){
  const run = spec.run || [], hold = spec.hold || [], css = spec.css || [];
  let body = head(out, spec.what, [...css, ...run, ...hold]);
  if (hold.length) body += RUNTIME + "\n";
  for (const f of css) body += styleTag(f);
  /* held files first: a file that runs as the bundle loads (widget/v3.js) may ask for one of them right away */
  for (const f of hold) {
    const s = stripJs(read(f), f, true);
    /* the function is in brackets on purpose: a browser compiles a bracketed function as the file arrives, off the
       main thread, as it did when this was a file of its own; without them it would compile when first run, on it */
    body += `/* ---- widget/${f} ---- */\nSH_BUNDLE.hold(${JSON.stringify(f)}, (function(${STAND_IN}){\n${s.code}\n}));\n`;
  }
  for (const f of run) {
    const raw = f.startsWith("vendor/");
    const s = raw ? { code: read(f).replace(/\s+$/, "") } : stripJs(read(f), f, false);
    /* a file that runs as the bundle loads sees the bundle's own <script>: fine for an address beside it (the bundles
       sit in widget/ for that), wrong for one that looks for its own file name */
    if (s.usesScript && f !== "v3.js") throw new Error(`widget/${f} reads document.currentScript and runs as ${out} loads, where that is the bundle's tag: list it under "hold", or check it only takes addresses beside itself and add it here`);
    body += `/* ---- widget/${f} ---- */\n${s.code}\n;\n`;
  }
  /* the whole thing still parses as one script */
  try { acorn.parse(body, { ecmaVersion: "latest", sourceType: "script" }); } catch (e) { throw new Error(`widget/${out} does not parse: ${e.message}`); }
  return body;
}
function style(out, parts){
  return head(out, "the redesign's one stylesheet", parts) + parts.map(f => `/* ---- widget/${f} ---- */\n${stripCss(read(f), f)}\n`).join("");
}

const built = {};
try {
  const seen = {};
  for (const [out, spec] of Object.entries(MANIFEST.scripts)) {
    for (const f of spec.hold || []) { if (seen[f]) throw new Error(`widget/${f} is held by both ${seen[f]} and ${out}: a page that loads both would have it twice`); seen[f] = out; }
    built[out] = script(out, spec);
  }
  for (const [out, parts] of Object.entries(MANIFEST.styles)) built[out] = style(out, parts);
} catch (e) { console.error("✗ bundles: " + e.message); process.exit(1); }

const gz = s => zlib.gzipSync(Buffer.from(s), { level: 9 }).length, kb = n => (n / 1024).toFixed(1).padStart(6) + " KB";
if (SIZES) {
  for (const [out, text] of Object.entries(built)) {
    const spec = MANIFEST.scripts[out], files = spec ? [...(spec.css || []), ...(spec.run || []), ...(spec.hold || [])] : MANIFEST.styles[out];
    const src = files.map(read);
    console.log(`widget/${out.padEnd(20)} ${kb(text.length)} (${kb(gz(text))} gzipped)   its ${files.length} sources: ${kb(src.reduce((a, s) => a + s.length, 0))} (${kb(src.reduce((a, s) => a + gz(s), 0))} gzipped, each by itself)`);
  }
  process.exit(0);
}
const stale = Object.keys(built).filter(out => { try { return fs.readFileSync(path.join(WIDGET, out), "utf8") !== built[out]; } catch (e) { return true; } });
if (CHECK) {
  if (stale.length) { console.error(`✗ bundles: ${stale.map(f => "widget/" + f).join(", ")} ${stale.length === 1 ? "is" : "are"} not what the sources build. Run: node tools/bundle/build.mjs (and commit the result)`); process.exit(1); }
  console.log(`✓ bundles: ${Object.keys(built).length} files in widget/ are what their sources build`);
} else {
  for (const out of stale) fs.writeFileSync(path.join(WIDGET, out), built[out]);
  console.log(`✓ bundles: ${stale.length ? "wrote " + stale.map(f => "widget/" + f).join(", ") : "nothing to write, all current"}`);
}
