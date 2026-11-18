#!/usr/bin/env node
// Deploy Ask Timmy's Edge Function (supabase/functions/timmy: index.ts, core.js, site.json) to the live project, byte
// for byte, with JWT verification off (vault/reference/ask-timmy.md, "At the release", step 3). Run it after a merge
// that changed supabase/functions/timmy/ (site.json changes whenever the About page does).
//   node tools/timmy/deploy.mjs
// It goes through Supabase's management API with the access token in the environment (SUPABASE_ACCESS_TOKEN, never
// printed and never in a file: vault/rules/secrets.md). The Supabase connector's deploy_edge_function does the same
// when the files are pasted into it, which is 145 KB to copy by hand; this sends the files as they are.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const REF = "thytmzsgymydbzcqdnix";
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/functions/timmy");
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) { console.error("✗ SUPABASE_ACCESS_TOKEN isn't set in the environment"); process.exit(2); }

const form = new FormData();
form.append("metadata", JSON.stringify({ name: "timmy", entrypoint_path: "index.ts", verify_jwt: false }));
for (const [name, type] of [["index.ts", "application/typescript"], ["core.js", "application/javascript"], ["site.json", "application/json"]]) {
  const buf = fs.readFileSync(path.join(DIR, name));
  console.log(`  ${name}: ${buf.length} bytes, sha256 ${crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16)}`);
  form.append("file", new Blob([buf], { type }), name);
}
const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/functions/deploy?slug=timmy`, { method: "POST", headers: { Authorization: "Bearer " + token }, body: form });
const text = await r.text();
let d = null; try { d = JSON.parse(text); } catch (e) {}
if (!r.ok || !d) { console.error(`✗ the deploy answered ${r.status}: ${text.slice(0, 400)}`); process.exit(1); }
console.log(`✓ timmy deployed: version ${d.version}, ${d.status}, JWT verification ${d.verify_jwt ? "ON (it must be off: the site's key isn't a JWT)" : "off"}`);
if (d.verify_jwt) process.exit(1);
