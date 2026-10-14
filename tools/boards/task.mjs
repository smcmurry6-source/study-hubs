#!/usr/bin/env node
// Start or finish one boards task from its brief.
//
//   node tools/boards/task.mjs T-06 [--base claude/boards-hub] [--dry-run]
//   node tools/boards/task.mjs T-06 [--base claude/boards-hub] --finish [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_BASE = 'claude/boards-hub';

export function slugifyTitle(title) {
  return title.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function assertSafeWorkspace({ branch, dirty }) {
  if (!branch) throw new Error('Refusing to run from a detached HEAD; switch to a named task branch first.');
  if (branch === 'main') throw new Error('Refusing to run on main.');
  if (dirty) throw new Error('Refusing to run with a dirty working tree. Commit or stash your changes first.');
}

function formatCommand(command, args) {
  const quote = value => /^[A-Za-z0-9_./:=+-]+$/.test(value) ? value : JSON.stringify(value);
  return [command, ...args.map(quote)].join(' ');
}

function run(command, args, { capture = false, allowedExitCodes = [0] } = {}) {
  console.log(`$ ${formatCommand(command, args)}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    windowsHide: true,
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw new Error(`Could not run ${command}: ${result.error.message}`);
  if (!allowedExitCodes.includes(result.status)) {
    const detail = capture ? `${result.stdout || ''}${result.stderr || ''}`.trim() : '';
    throw new Error(`${formatCommand(command, args)} exited with code ${result.status}${detail ? `: ${detail}` : ''}`);
  }
  return capture ? (result.stdout || '').trim() : '';
}

function parseArgs(argv) {
  const options = { base: DEFAULT_BASE, dryRun: false, finish: false, task: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--base') {
      if (!argv[i + 1]) throw new Error('--base needs a branch name.');
      options.base = argv[++i];
    } else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--finish') options.finish = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else if (options.task) throw new Error(`Unexpected extra argument: ${arg}`);
    else options.task = arg;
  }
  if (!options.help && !options.task) throw new Error('Usage: node tools/boards/task.mjs T-NN [--base <branch>] [--dry-run] [--finish]');
  return options;
}

function readBrief(task) {
  if (!/^T-\d{2}$/.test(task)) throw new Error(`Invalid task ID: ${task}. Use T-NN, such as T-06.`);
  const briefPath = `docs/boards/tasks/${task}.md`;
  const absolutePath = path.join(ROOT, briefPath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Brief not found: ${briefPath}`);
  const brief = fs.readFileSync(absolutePath, 'utf8');
  const heading = brief.match(/^#\s+(.+?)\s*#*\s*$/m);
  if (!heading) throw new Error(`The brief needs a level-one title: ${briefPath}`);
  const title = heading[1].trim();
  const slug = slugifyTitle(title);
  if (!slug) throw new Error(`Could not make a branch slug from the title in ${briefPath}`);
  return { briefPath, title, branch: `codex/boards-${slug}` };
}

function preflight(base) {
  run('git', ['check-ref-format', '--branch', base]);
  const dirty = Boolean(run('git', ['status', '--porcelain'], { capture: true }));
  const branch = run('git', ['branch', '--show-current'], { capture: true });
  assertSafeWorkspace({ branch, dirty });
  if (base === 'main') throw new Error('Refusing to target main for boards hub work.');
  return branch;
}

function promptFor(briefPath, base) {
  return `Read AGENTS.md first. Complete the task in ${briefPath}. Open a draft PR into ${base}.`;
}

function startTask({ briefPath, branch, base, dryRun }) {
  const existingBranch = run('git', ['branch', '--list', branch], { capture: true });
  if (existingBranch) throw new Error(`Branch already exists: ${branch}`);

  const commands = [
    ['git', ['fetch', 'origin', base]],
    ['git', ['switch', '--create', branch, 'FETCH_HEAD']],
  ];
  if (dryRun) {
    console.log('Would run:');
    for (const [command, args] of commands) console.log(`  ${formatCommand(command, args)}`);
  } else {
    for (const [command, args] of commands) run(command, args);
  }
  console.log('\nPrompt to paste into Codex:');
  console.log(promptFor(briefPath, base));
}

function finishTask({ title, branch, currentBranch, base, dryRun }) {
  if (currentBranch !== branch) throw new Error(`Refusing to finish ${branch} from ${currentBranch || 'detached HEAD'}.`);
  const commitBody = run('git', ['log', '-1', '--format=%b'], { capture: true });
  if (!commitBody) throw new Error('The last commit has no body to use as the PR self-report.');
  const prBody = `## What changed\n\n${title}\n\n## Self-report\n\n${commitBody}`;
  const checks = [
    ['node', ['tools/build-boards.js', '--check']],
    ['node', ['tools/ci/syntax.js']],
    ['node', ['tools/boards/lint-items.mjs']],
  ];
  const publish = [
    ['git', ['push', '--set-upstream', 'origin', branch]],
    ['gh', ['pr', 'create', '--draft', '--base', base, '--head', branch, '--title', title, '--body', prBody]],
  ];
  if (dryRun) {
    console.log('Would run:');
    for (const [command, args] of [...checks, ...publish]) console.log(`  ${formatCommand(command, args)}`);
    return;
  }
  for (const [command, args] of checks) run(command, args);
  for (const [command, args] of publish) run(command, args);
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log('Usage: node tools/boards/task.mjs T-NN [--base <branch>] [--dry-run] [--finish]');
    return;
  }
  const { briefPath, title, branch } = readBrief(options.task);
  const currentBranch = preflight(options.base);
  if (options.finish) finishTask({ title, branch, currentBranch, base: options.base, dryRun: options.dryRun });
  else startTask({ briefPath, branch, base: options.base, dryRun: options.dryRun });
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  try {
    main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
