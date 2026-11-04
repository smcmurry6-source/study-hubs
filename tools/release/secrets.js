// Public-repo guard (vault/rules/secrets.md, vault/rules/graded-coursework.md): CI runs it on every PR.
// Fails if a tracked file holds something that looks like a secret, or a file type that is course material
// (slides, PDFs, recordings, transcripts, spreadsheets of student data). Reports where, never the value.
//   node tools/release/secrets.js
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');

/* the Supabase publishable key is meant to be public (it's in every page); the preview fixture key is a dummy */
const ALLOW = [/sb_publishable_[A-Za-z0-9_-]+/g, /sb_preview_fixture_not_a_key/g, /<ADMIN_SECRET>/g];
const PATTERNS = [
  ['a Supabase secret key', /sb_secret_[A-Za-z0-9_-]{16,}/],
  ['a Supabase service-role or other JWT', /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  ['a private key', /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/],
  ['a GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['an Anthropic API key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['an OpenAI-style API key', /\bsk-(proj-)?[A-Za-z0-9]{32,}\b/],
  ['a Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['an AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['a Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['a Cloudflare API key or token', /\bcf[a-z]{1,3}_[A-Za-z0-9]{30,}\b|\b(CLOUDFLARE_API_(TOKEN|KEY)|CF_API_(TOKEN|KEY))\s*[:=]\s*["']?(?!\$)[A-Za-z0-9_-]{30,}/],
  ['a Cloudflare or other bearer token in a header', /Authorization:\s*Bearer\s+(?!["'+]|\$|SB_KEY|key\b)[A-Za-z0-9._-]{30,}/],
  ['a database URL with a password', /postgres(ql)?:\/\/[^:\s/]+:[^@\s<]{4,}@(?!localhost|127\.0\.0\.1)/],
  ['the admin secret written out', /\b(ADMIN_SECRET|p_secret)\s*[:=]\s*["'](?!<|\$|preview-admin|rls-test-secret|not-the-secret)[^"'\s]{8,}["']/]
];
/* course material and student data never live here; the site's own media are narration, sound effects and short clips */
const BANNED_EXT = /\.(pdf|pptx?|key|docx?|vtt|srt|m4a|mov|wav|aiff?|zip|csv|tsv|xlsx?|numbers|sqlite|db|dump)$/i;
const MEDIA_OK = /^(hubs\/[^/]+\/audio|widget\/(audio|sfx|vid))\/[^/]+\.(mp3|mp4|webm)$/;
const BANNED_DIRS = /^(question-banks|exports|recordings|lectures|transcripts)\//;

const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT }).toString().split('\0').filter(Boolean);
const problems = [];
let scanned = 0;
for (const f of files) {
  if (BANNED_DIRS.test(f)) problems.push(`${f}: this folder is kept off the public repo`);
  if (BANNED_EXT.test(f)) problems.push(`${f}: course material or data files (${path.extname(f)}) never go in the public repo`);
  if (/\.(mp3|mp4|webm|m4v)$/i.test(f) && !MEDIA_OK.test(f)) problems.push(`${f}: media outside the narration and widget folders (a recording?)`);
  if (/\.(png|jpe?g|webp|gif|ico|mp3|mp4|webm|woff2?|ttf|onnx|bin)$/i.test(f)) continue;
  let text;
  try { const st = fs.statSync(path.join(ROOT, f)); if (st.size > 8 * 1048576) continue; text = fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { continue; }
  scanned++;
  let t = text; ALLOW.forEach(a => { t = t.replace(a, '[allowed]'); });
  if (f === 'tools/release/secrets.js') continue;   /* its own patterns */
  for (const [what, re] of PATTERNS) {
    const m = re.exec(t);
    if (m) problems.push(`${f}:${t.slice(0, m.index).split('\n').length}: looks like ${what}`);
  }
}
if (problems.length) {
  console.error(`✗ public-repo check: ${problems.length} problem(s). Remove the value (and rotate it if it was a real secret: it is in git history):\n` + problems.map(p => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`✓ public-repo check: ${files.length} tracked files, ${scanned} scanned; no secrets, course material or data files`);
