#!/usr/bin/env node
// Which questions' choices have changed since a hub's content first shipped, from git (migration_v65). Their class picks
// recorded before the picks had versions mix the old choices with the new, so the migration sets those picks aside
// instead of keeping them as the current choices' (question_choices.v = 'before', moved to question_choices_past when
// the keys are loaded with their versions). A question counts as changed when its choice version (tools/xp/keys.js
// choiceVersion: its choices and its key) differs between any two commits of hubs/<hub>/content/questions.json, or between
// one and the working tree.
//   node tools/xp/choice-history.js                  every hub with content: a count and the ids per hub
//   node tools/xp/choice-history.js --sql            the (hub, qid) pairs as SQL values, for the migration
//   node tools/xp/choice-history.js --hub perio      one hub
// History only goes back to the content JSON (the redesign's release for Occlusion and Perio): an edit made on an old
// single-file page before then can't be seen here.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { choiceVersion } = require('./keys');
const ROOT = path.resolve(__dirname, '../..');
const git = args => execFileSync('git', args, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();

function changed(hub){
  const file = `hubs/${hub}/content/questions.json`;
  const seen = new Map();   // qid -> Set of choice versions
  const add = list => list.forEach(q => { const cv = choiceVersion(q); if (!cv) return; if (!seen.has(q.id)) seen.set(q.id, new Set()); seen.get(q.id).add(cv); });
  git(['log', '--format=%H', '--', file]).split('\n').filter(Boolean).forEach(sha => {
    let list; try { list = JSON.parse(git(['show', `${sha}:${file}`])); } catch (e) { return; }   // a commit that deleted it
    add(list);
  });
  if (fs.existsSync(path.join(ROOT, file))) add(JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')));
  return [...seen].filter(([, s]) => s.size > 1).map(([id]) => id).sort();
}

if (require.main === module) {
  const a = process.argv.slice(2), hi = a.indexOf('--hub');
  const hubs = hi >= 0 ? [a[hi + 1]] : fs.readdirSync(path.join(ROOT, 'hubs')).filter(h => fs.existsSync(path.join(ROOT, 'hubs', h, 'content', 'questions.json'))).sort();
  const out = hubs.map(hub => [hub, changed(hub)]);
  if (a.includes('--sql')) console.log(out.flatMap(([hub, ids]) => ids.map(id => `('${hub}', '${id.replace(/'/g, "''")}')`)).join(',\n'));
  else out.forEach(([hub, ids]) => console.log(`${hub}: ${ids.length} question${ids.length === 1 ? '' : 's'} with changed choices${ids.length ? ' (' + ids.join(', ') + ')' : ''}`));
}

module.exports = { changed };
