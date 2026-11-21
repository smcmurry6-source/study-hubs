/* The site's database client (widget/vendor/supabase-lite-<version>.js, built from this file by build.mjs).
   The pages use three things of supabase-js: rpc(), from() and realtime channels (presence and broadcast). This is
   those three from Supabase's own packages (@supabase/postgrest-js and @supabase/realtime-js, the versions inside the
   full client the live pages load), wired the way supabase-js wires them for a visitor who is never signed in, and
   nothing else: no sign-in (gotrue), storage or functions clients. About a third of the full client's size.
   The global is still `supabase`, with createClient(url, key), so a page reads either build the same way. */
import { PostgrestClient } from "@supabase/postgrest-js";
import { RealtimeClient } from "@supabase/realtime-js";

export function createClient(url, key){
  if (!url) throw new Error("supabaseUrl is required.");
  if (!key) throw new Error("supabaseKey is required.");
  const base = new URL(/\/$/.test(url) ? url : url + "/");
  /* every request carries the publishable key both ways, as supabase-js sends it when nobody is signed in */
  const authed = (input, init) => {
    const headers = new Headers(init && init.headers);
    if (!headers.has("apikey")) headers.set("apikey", key);
    if (!headers.has("Authorization")) headers.set("Authorization", "Bearer " + key);
    return fetch(input, Object.assign({}, init, { headers }));
  };
  const realtimeUrl = new URL("realtime/v1", base);
  realtimeUrl.protocol = realtimeUrl.protocol.replace("http", "ws");
  const realtime = new RealtimeClient(realtimeUrl.href, { accessToken: async () => key, fetch: authed, params: { apikey: key } });
  const rest = new PostgrestClient(new URL("rest/v1", base).href, { fetch: authed });
  return {
    supabaseUrl: url, supabaseKey: key, functionsUrl: new URL("functions/v1", base),   /* widget/ask.js reads these */
    rest, realtime,
    from: table => rest.from(table),
    rpc: (fn, args, options) => rest.rpc(fn, args, options),
    channel: (name, opts) => realtime.channel(name, opts || { config: {} }),
    getChannels: () => realtime.getChannels(),
    removeChannel: channel => realtime.removeChannel(channel),
    removeAllChannels: () => realtime.removeAllChannels()
  };
}
