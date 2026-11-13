// Ask Timmy: the Supabase Edge Function `timmy` (vault/reference/ask-timmy.md). A thin wrapper: everything it decides is
// in core.js, which the tests run under Node. This file only connects it to the world:
//   - the model: Anthropic's API, with ANTHROPIC_API_KEY from the function's secrets (Sam saves it in the Supabase
//     dashboard, Edge Functions > Secrets; never in the repo or a chat);
//   - the database: timmy_begin and timmy_finish (migration_v55), called with the service-role key the runtime provides;
//   - the content: each hub's published content JSON, fetched from the site and kept in memory for 10 minutes;
//   - the site help: site.json beside this file (tools/timmy/build.mjs builds it from the About page).
// Deploy with JWT verification off (the site's publishable key isn't a JWT); the function checks its own input, answers
// only the site's own origin, and the database keeps the limits.
// Settings (all optional): TIMMY_CONTENT_BASE (where the content is: "{hub}" is replaced by the hub's id; the default
// is the live site's hubs/<id>/content/, so it only needs setting to read another copy), TIMMY_ORIGINS (comma separated),
// ANTHROPIC_WORKSPACE_ID (only for a key made outside a workspace: the API refuses such a key without it).
import Anthropic from "npm:@anthropic-ai/sdk@1.3.0";
import site from "./site.json" with { type: "json" };
import { serve } from "./core.js";

const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const BASE = Deno.env.get("TIMMY_CONTENT_BASE") ?? "https://smcmurry6-source.github.io/study-hubs/hubs/{hub}/content/";
const ORIGINS = (Deno.env.get("TIMMY_ORIGINS") ?? "https://smcmurry6-source.github.io").split(",").map((s) => s.trim()).filter(Boolean);
const HUB_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const TTL = 10 * 60 * 1000;

// a key made outside a workspace needs the workspace's id with every call (ANTHROPIC_WORKSPACE_ID, optional)
const WORKSPACE = Deno.env.get("ANTHROPIC_WORKSPACE_ID") ?? "";
const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY"), maxRetries: 1, timeout: 120_000,
  defaultHeaders: WORKSPACE ? { "anthropic-workspace-id": WORKSPACE } : undefined });

async function rpc(name: string, args: Record<string, unknown>) {
  const headers: Record<string, string> = { "content-type": "application/json", apikey: SB_KEY };
  if (SB_KEY.startsWith("eyJ")) headers.authorization = `Bearer ${SB_KEY}`;   // a legacy JWT key; new secret keys go in apikey only
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`${name}: ${r.status} ${(await r.text()).slice(0, 200)}`);
  return await r.json();
}

/* the published content, kept 10 minutes; a failed fetch keeps serving what was there */
const cache = new Map<string, { at: number; data: unknown }>();
async function cached(key: string, load: () => Promise<unknown>) {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.data;
  try { const data = await load(); cache.set(key, { at: Date.now(), data }); return data; }
  catch (e) { if (c) return c.data; throw e; }
}
async function getJson(url: string) {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return await r.json();
}
const at = (hub: string, file: string) => BASE.replace("{hub}", hub) + file;
async function loadHub(hub: string) {
  if (!HUB_RE.test(hub)) return null;
  return await cached("hub:" + hub, async () => {
    const [core, notes, study] = await Promise.all(["core.json", "notes.json", "study.json"].map((f) => getJson(at(hub, f))));
    return core && notes ? { core, notes, study: study || {} } : null;
  });
}
async function loadQuestions(hub: string) {
  if (!HUB_RE.test(hub)) return null;
  return await cached("q:" + hub, async () => { const q = await getJson(at(hub, "questions.json")); return Array.isArray(q) ? q : q && q.questions; });
}

const deps = {
  db: { begin: (a: Record<string, unknown>) => rpc("timmy_begin", a), finish: (a: Record<string, unknown>) => rpc("timmy_finish", a) },
  // deno-lint-ignore no-explicit-any
  model: (params: any) => client.beta.messages.create(params),
  loadHub, loadQuestions, site, origins: ORIGINS,
  now: () => Date.now(),
  log: (event: string, data: unknown) => console.log(JSON.stringify({ event, ...(data as object) }))
};

Deno.serve((req: Request) => serve(req, deps));
