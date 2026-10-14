const assert = require('node:assert/strict');

async function main() {
  const { parseVerdicts } = await import('../boards/check-items.mjs');
  const canned = [{
    id: 'Q01',
    verdict: 'fix',
    issues: [{
      check: 'key',
      severity: 'high',
      detail: 'Option C is wrong [as written] and includes a quoted "absolute".',
      suggestion: 'Correct the keyed option.',
    }],
  }];
  const reply = '```json\n' + JSON.stringify(canned) + '\n```';
  assert.deepEqual(parseVerdicts(reply, ['Q01']), canned);
  assert.throws(() => parseVerdicts('not JSON', ['Q01']), /no JSON array/);
  console.log('Boards checker parser passed');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
