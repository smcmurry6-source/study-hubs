// CI fixture (not published): this unit's benchmark items and cases, re-exported so the build's item and case
// pipeline can be tested without putting benchmark items in the hub. Source: docs/boards/bench/items.js.
const bench = require('../../../../../../docs/boards/bench/items.js');
module.exports = { items: bench.items.filter(i => i.lec === 'medcx'), cases: bench.cases.filter(c => c.id.startsWith('c-medcx-')) };
