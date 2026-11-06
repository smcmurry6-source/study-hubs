// A throwaway PostgreSQL for the database tests (tools/release/admin-ops.js, xp.js): initdb in a temp folder, Supabase's
// roles and default grants, then supabase/schema.sql with a test admin secret, then the migrations waiting for their
// release (supabase/pending-migrations.txt; { pending: false } leaves them for applyPending()). Never the live database.
// (tools/release/rls.js and retention.js have their own copy of the same setup.)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync, spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const { pending } = require('./pending');

function pgBin(){
  if (process.env.PG_BIN) return process.env.PG_BIN;
  try { return execFileSync('pg_config', ['--bindir'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) {}
  const base = '/usr/lib/postgresql';
  if (fs.existsSync(base)) { const v = fs.readdirSync(base).sort((a, b) => Number(b) - Number(a))[0]; if (v && fs.existsSync(path.join(base, v, 'bin', 'initdb'))) return path.join(base, v, 'bin'); }
  return null;
}

function throwaway(secret, opts){
  opts = opts || {};
  const BIN = pgBin();
  if (!BIN || !fs.existsSync(path.join(BIN, 'initdb'))) { console.error('✗ no PostgreSQL server binaries (set PG_BIN, or install postgresql)'); process.exit(2); }
  const asRoot = process.getuid && process.getuid() === 0;
  const run = (cmd, args) => asRoot ? execFileSync('runuser', ['-u', 'postgres', '--', path.join(BIN, cmd), ...args], { stdio: 'pipe' })
                                   : execFileSync(path.join(BIN, cmd), args, { stdio: 'pipe' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-pg-'));
  if (asRoot) execFileSync('chown', ['postgres', dir]);
  const PORT = String(57000 + Math.floor(Math.random() * 900));
  let started = false;
  function stop(){ if (started) { try { run('pg_ctl', ['-D', path.join(dir, 'data'), '-m', 'immediate', 'stop']); } catch (e) {} started = false; } try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
  process.on('exit', stop);
  /* rows as arrays of strings; throws with the server's message (and SQLSTATE in e.code) on an error */
  function sql(text, db){
    const r = spawnSync(path.join(BIN, 'psql'), ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-tA', '-F', '\x1f', '-R', '\x1e', '-h', dir, '-p', PORT, '-U', 'postgres', '-d', db || 'ops'], { input: '\\set VERBOSITY verbose\n' + text, encoding: 'utf8' });
    if (r.status !== 0) {
      const msg = (r.stderr || '').replace(/^psql:[^:]*:\d+: /gm, '').trim(), m = /ERROR:\s+([0-9A-Z]{5}):/.exec(msg);
      const e = new Error(msg); e.code = m ? m[1] : null; throw e;
    }
    return r.stdout.split('\x1e').map(l => l.replace(/^\n+|\n+$/g, '')).filter(l => l.length).map(l => l.split('\x1f'));   /* rows end in \x1e: a value may hold newlines */
  }
  run('initdb', ['-D', path.join(dir, 'data'), '-U', 'postgres', '-A', 'trust', '--no-sync']);
  run('pg_ctl', ['-D', path.join(dir, 'data'), '-o', `-k ${dir} -p ${PORT} -c listen_addresses='' -c fsync=off`, '-l', path.join(dir, 'log'), '-w', 'start']);
  started = true;
  sql('create database ops', 'postgres');
  sql(`create role anon nologin noinherit; create role authenticated nologin noinherit; create role service_role nologin noinherit bypassrls;
       grant usage on schema public to anon, authenticated, service_role;
       alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
       alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
       alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
  const schema = fs.readFileSync(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8').split('<ADMIN_SECRET>').join(secret);
  sql('begin;\n' + schema + '\ncommit;');
  const waiting = pending(secret);
  function applyPending(){ waiting.forEach(m => { try { sql('begin;\n' + m.text + '\ncommit;'); } catch (e) { e.message = `${m.file}: ${e.message}`; throw e; } }); return waiting.map(m => m.file); }
  if (opts.pending !== false) applyPending();
  return { sql, stop, applyPending, pending: waiting.map(m => m.file), q: s => "'" + String(s).replace(/'/g, "''") + "'" };
}

module.exports = { throwaway, pgBin };
