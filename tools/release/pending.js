// Migrations written and tested but not yet applied to the live project (supabase/pending-migrations.txt). The
// database tests build their throwaway copy from supabase/schema.sql (the live database) and then apply these, so a
// migration waiting for its release is tested with everything else, and today's functions are tested with it in place.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const LIST = path.join(ROOT, 'supabase', 'pending-migrations.txt');

/* [{ file, text }] in the order they're applied; <ADMIN_SECRET> replaced with the test secret */
function pending(secret){
  if (!fs.existsSync(LIST)) return [];
  return fs.readFileSync(LIST, 'utf8').split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean).map(file => {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) throw new Error(`supabase/pending-migrations.txt lists ${file}, which doesn't exist`);
    return { file, text: fs.readFileSync(p, 'utf8').split('<ADMIN_SECRET>').join(secret || '<ADMIN_SECRET>') };
  });
}

module.exports = { pending };
