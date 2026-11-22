#!/usr/bin/env node
// Answers the Supabase connector's own "are you sure?" questions (MCP elicitation) with yes, so a session can apply a
// migration or run a write without a prompt the Claude app may never show (2026-11-18: in a cloud session the question
// never reached Sam's screen, and apply_migration timed out twice). Sam, 2026-11-18: "i want to give you permission to
// always be able to do these kinds of supabase actions. whatever you need." (vault/decisions.md)
//
// Wired in .claude/settings.json as an Elicitation hook on the Supabase server, matched by its name ("Supabase") or, in
// the cloud sessions where the connector is named by its id, by that id (c63257eb-1d94-419c-8868-716ff71ffcf6; Sam,
// 2026-11-22, vault/decisions.md). A session that finds the connector under another id adds it to the matcher and the
// permissions the same way, never a pattern that would match other servers. It accepts only a plain confirmation:
// a form whose fields are all yes/no or a choice with an approving option (yes, approve, confirm, allow, accept, run,
// proceed, continue, ok). A question that wants typed text, a login link (URL mode), or anything it can't read is left
// to the person (it prints nothing, so the dialog shows as before). The vault's rules still decide what an agent may run:
// read-only SQL to read class data, and no deleting or rewriting student rows without Sam's OK for that kind of delete
// (vault/rules/learner-data-privacy.md). Claude Code's own "ask" rules (pausing the project, creating a project or a
// branch) are a separate prompt and still ask.
'use strict';
const fs = require('fs'), os = require('os'), path = require('path');

const YES = /^(yes|y|true|approve|approved|confirm|confirmed|allow|accept|accepted|run|run it|proceed|continue|ok|okay)$/i;

function answer(input){
  if (!input || input.mode === 'url') return null;
  const schema = input.requested_schema || {};
  const props = schema.properties || {};
  const content = {};
  for (const [key, p] of Object.entries(props)) {
    const kinds = [].concat(p.type || []);
    if (kinds.includes('boolean')) { content[key] = true; continue; }
    const options = p.enum || (p.oneOf || p.anyOf || []).map(o => o && o.const).filter(v => v !== undefined);
    const yes = options.find(v => typeof v === 'string' && YES.test(v.trim()));
    if (yes !== undefined) { content[key] = yes; continue; }
    const labelled = (p.oneOf || p.anyOf || []).find(o => o && typeof o.title === 'string' && YES.test(o.title.trim()));
    if (labelled && labelled.const !== undefined) { content[key] = labelled.const; continue; }
    return null;   // a field that wants typed text or has no approving option: leave it to the person
  }
  return content;
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', () => {
  let input = null;
  try { input = JSON.parse(raw); } catch (e) { process.exit(0); }
  const content = answer(input);
  // a line per question, outside the repo, so a session can see what was answered (and the form's shape)
  try {
    fs.appendFileSync(path.join(os.tmpdir(), 'supabase-elicitation.log'), JSON.stringify({
      at: new Date().toISOString(), server: input.mcp_server_name, mode: input.mode || 'form',
      message: String(input.message || '').slice(0, 400), schema: input.requested_schema || null,
      answered: content ? 'accept' : 'left to the person'
    }) + '\n');
  } catch (e) {}
  if (!content) process.exit(0);
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'Elicitation', action: 'accept', content } }));
});
