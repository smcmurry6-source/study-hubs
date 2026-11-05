import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSafeWorkspace, slugifyTitle } from './task.mjs';

test('slugifies a brief title for a branch name', () => {
  assert.equal(slugifyTitle('T-06: Task helper & dry-run'), 't-06-task-helper-and-dry-run');
});

test('refuses to run on main', () => {
  assert.throws(() => assertSafeWorkspace({ branch: 'main', dirty: false }), /on main/);
});

test('refuses to run with a dirty working tree', () => {
  assert.throws(() => assertSafeWorkspace({ branch: 'claude/boards-hub', dirty: true }), /dirty working tree/);
});

test('refuses a detached HEAD', () => {
  assert.throws(() => assertSafeWorkspace({ branch: '', dirty: false }), /detached HEAD/);
});
