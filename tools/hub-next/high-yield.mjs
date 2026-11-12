/*
 * The notes' third reading level, **High yield** (Sam, 2026-11-12: "a toggle in the lecture notes that only explains the
 * high likelihood/high yield points that are hinted to be tested"; for the redesign first). Beside As taught and Plain
 * English, it shows a lecture's predicted exam topics (LIKELY_TOPICS, strongest evidence first) and, under each, the
 * paragraphs of the As taught notes that teach it, with the professor's own takeaways from the Exam Hints. Nothing in it
 * is written by hand: every word comes from the notes, the topics or the hints, so it can't say anything the notes don't.
 *
 * How a topic finds its paragraphs: the same BM25 match "Find this in the notes" uses (widget/v3.js, njBest), run for each
 * of the topic's questions (the right answer counting most, then the explanation, then the stem) and for the topic's own
 * words. Each question votes for its best paragraph, weak matches don't vote, and the topic keeps its two best (a third
 * when two or more questions agree on it), in the order the notes give them. A paragraph shown under an earlier topic isn't
 * repeated unless the topic would have nothing else. A hint goes under the topic whose paragraphs it matches; the rest are
 * listed after the topics ("Also flagged in class"), and what a professor said not to bother with ("You can skip") last.
 *
 * tools/hub-next/build.mjs writes the result into notes.json (`hy`, one HTML string per lecture that has topics), so it
 * is rebuilt whenever the notes, topics, hints or questions change, and CI's --check fails when it's stale.
 *
 *   node tools/hub-next/high-yield.mjs <hub> [<lecture>]   list what each topic matched (for checking the picks)
 */
import { readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

/* the words "Find this in the notes" ignores (widget/v3.js, NJ_STOP), and its stemmer */
const STOP = new Set(("a about above after again against all also an and any are as at be because been before being below between both but by can " +
  "could did do does doing down during each either few for from further had has have having here how if in into is it its itself " +
  "just more most much must no nor not now of off on once only or other our out over own same should so some such than that the " +
  "their them then there these they this those through to too under until up very was we were what when where which while who whom " +
  "why will with within without would you your one two three four five first second third true false statement statements read " +
  "following choice choices answer answers correct incorrect best least likely except none neither option options question " +
  "describes described describe given called known used uses using may might often usually typically commonly etc").split(" "));
function stem(w){
  if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + "y";
  if (w.length > 5 && /(sses|xes|zes|ches|shes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && /[^s]s$/.test(w)) return w.slice(0, -1);
  if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
  if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
  if (w.length > 4 && /ly$/.test(w)) return w.slice(0, -2);
  return w;
}
function tokens(t){
  const out = [];
  for (const w of String(t || "").toLowerCase().match(/[a-z0-9]+/g) || []) {
    if (STOP.has(w) || (w.length < 3 && !/\d/.test(w))) continue;
    out.push(stem(w));
  }
  return out;
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", minus: "−", times: "×", deg: "°", micro: "µ", beta: "β", alpha: "α", gamma: "γ" };
function textOf(html){
  return String(html).replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENT[e.toLowerCase()] ?? m))
    .replace(/\s+/g, " ").trim();
}
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

/* the top-level elements of an HTML fragment: [{ tag, cls, html, inner }] */
const VOID = /^(br|hr|img|wbr|input|meta|link|source|col|area|embed|param|track)$/;
function children(html){
  const out = [], re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  let depth = 0, start = -1, inner = -1, open = null, m;
  while ((m = re.exec(html))) {
    const close = m[1] === "/", tag = m[2].toLowerCase(), self = m[3] === "/" || VOID.test(tag);
    if (!close) {
      if (depth === 0 && !self) { start = m.index; inner = m.index + m[0].length; open = { tag, cls: (m[0].match(/\sclass="([^"]*)"/) || [])[1] || "" }; }
      if (!self) depth++;
    } else if (depth > 0) {
      depth--;
      if (depth === 0 && open) { out.push({ tag: open.tag, cls: open.cls, html: html.slice(start, m.index + m[0].length), inner: html.slice(inner, m.index) }); open = null; }
    }
  }
  return out;
}
/* the notes as the units High yield picks from: each paragraph, table or box, and each item of a list (a cram list's
   points are picked one by one), with the heading it sits under. A list item keeps its list (`list`), so the items picked
   from one list are shown as one list again. */
export function blocks(html){
  const out = []; let head = "", list = 0;
  for (const c of children(html || "")) {
    const text = textOf(c.html);
    if (/^h[1-6]$/.test(c.tag)) { head = text; continue; }
    if ((c.tag === "ul" || c.tag === "ol") && !c.cls) {
      list++;
      for (const li of children(c.inner)) if (li.tag === "li") out.push({ i: out.length, tag: "li", cls: li.cls, html: li.html, text: textOf(li.html), head, list, ltag: c.tag });
      continue;
    }
    out.push({ i: out.length, tag: c.tag, cls: c.cls, html: c.html, text, head });
  }
  return out;
}

/* BM25 over a lecture's paragraphs, as njBest does it (k1 1.2, b 0.75; numbers count a third) */
function index(docs){
  const ix = docs.map((d) => { const tf = {}; let n = 0; for (const t of tokens(d.head + " " + d.text)) { tf[t] = (tf[t] || 0) + 1; n++; } return { d, tf, n }; });
  const df = {}; let total = 0;
  for (const x of ix) { total += x.n; for (const t of Object.keys(x.tf)) df[t] = (df[t] || 0) + 1; }
  return { ix, df, N: ix.length, avg: ix.length ? total / ix.length : 1 };
}
function weights(parts){
  const qw = {};
  for (const [text, w] of parts) for (const t of tokens(text)) { const x = /^\d+$/.test(t) ? w / 3 : w; qw[t] = Math.max(qw[t] || 0, x); }
  return qw;
}
function best(I, qw){
  let top = null;
  for (const x of I.ix) {
    let sc = 0;
    for (const t of Object.keys(qw)) {
      const f = x.tf[t]; if (!f) continue;
      const idf = Math.log(1 + (I.N - I.df[t] + 0.5) / (I.df[t] + 0.5));
      sc += qw[t] * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * x.n / I.avg));
    }
    if (!top || sc > top.score) top = { score: sc, d: x.d };
  }
  return top;
}

/* thresholds: a question's best paragraph must score as well as "Find this in the notes" asks (NJ_MIN_SCORE); the topic's
   own words, being short, a little less; a hint as a question (a weaker one is listed after the topics instead) */
const Q_MIN = 14, T_MIN = 10, H_MIN = 14;
/* how much a topic shows: its best match, then more only where two signals agree on a paragraph (any vote for a list
   item, which is short), up to two paragraphs' worth (a list item counts half) */
const ROOM = 2, weight = (d) => (d.tag === "li" ? 0.5 : 1), enough = (d, v) => (d.tag === "li" ? v >= 1 : v >= 2);

/* what a right answer says, for each kind of question in the banks */
function answerText(q){
  if (!q) return "";
  if (typeof q.answer === "string") return q.answer;   // a recall card's answer
  if (Array.isArray(q.pairs)) return q.pairs.map((p) => p.join(" ")).join(" ");
  if (Array.isArray(q.steps)) return q.steps.join(" ");
  if (Array.isArray(q.choices)) {
    const keys = Array.isArray(q.correct) ? q.correct : Array.isArray(q.answer) ? q.answer : [q.answer];
    return keys.map((k) => q.choices[k]).filter((x) => x != null).join(" ");
  }
  return "";
}

/* where each topic's place on the list comes from, in the students' words */
const BASIS = { hint: "A professor's hint", recording: "Flagged in the recording", slides: "Core of the slides", lecture: "Core of the lecture" };
function basisLabel(b){ const s = String(b || "").trim(); return BASIS[s.toLowerCase()] || (s ? s[0].toUpperCase() + s.slice(1) : ""); }

/* one lecture: the topics and what matched, before it becomes HTML (the report below prints this) */
export function pick({ html, topics, hints, questions }){
  const all = blocks(html || "");
  const tested = all.find((b) => b.tag === "div" && /\btested\b/.test(b.cls)) || null;
  const docs = all.filter((b) => b !== tested && b.text.length >= (b.tag === "li" ? 20 : 50));
  const I = index(docs), QB = questions || {};
  const used = new Set();
  const out = (topics || []).map((t) => {
    const votes = new Map(), ids = (t.ids || []).filter((id) => QB[id]);
    for (const id of ids) {
      const q = QB[id];
      const b = best(I, weights([[answerText(q), 2], [q.ex || "", 1.5], [q.stem || q.front || "", 1], [t.t, 1]]));
      if (b && b.score >= Q_MIN) votes.set(b.d, (votes.get(b.d) || 0) + 1 + b.score / 100);
    }
    const own = best(I, weights([[t.t, 2]]));
    if (own && own.score >= T_MIN) votes.set(own.d, (votes.get(own.d) || 0) + 1.5 + own.score / 100);
    const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1] || a[0].i - b[0].i);
    const keep = []; let room = 0;
    for (const [d, v] of ranked) {
      if (used.has(d)) continue;
      if (keep.length && (!enough(d, v) || room + weight(d) > ROOM)) continue;
      keep.push([d, v]); room += weight(d);
    }
    keep.forEach(([d]) => used.add(d));
    /* everything it matched is already shown under an earlier topic: point there instead of repeating it */
    const see = !keep.length && ranked.length ? ranked[0][0] : null;
    return { t, ids, see, votes: keep.map(([d, v]) => ({ d, v })), paras: keep.map(([d]) => d).sort((a, b) => a.i - b.i), know: [] };
  });
  out.forEach((x) => { if (x.see) x.see = out.findIndex((y) => y.paras.includes(x.see)); else x.see = -1; });
  const shownIn = new Map();
  out.forEach((x) => x.paras.forEach((d) => { if (!shownIn.has(d)) shownIn.set(d, x); }));
  const more = [], skip = [];
  for (const h of hints || []) {
    if (!h || !h.take) continue;
    if (h.kind === "deemphasize") { skip.push(h); continue; }
    const b = best(I, weights([[h.take, 2], [h.quote || "", 1]]));
    const home = b && b.score >= H_MIN ? shownIn.get(b.d) : null;
    if (home) home.know.push(h); else more.push(h);
  }
  return { tested, topics: out, more, skip };
}

/* the High yield HTML for one lecture, or "" when it has no predicted topics */
export function lectureHTML(args){
  if (!(args.topics || []).length) return "";
  const P = pick(args), parts = [];
  if (P.tested) parts.push(P.tested.html);
  P.topics.forEach((x, k) => {
    const n = x.ids.length;
    parts.push('<h3 class="hy-t"><span class="hy-n">' + (k + 1) + "</span> " + esc(x.t.t) + "</h3>");
    parts.push('<p class="hy-why">' + esc([basisLabel(x.t.basis), n ? n + (n === 1 ? " question" : " questions") + " in the bank" : ""].filter(Boolean).join(" · ")) + "</p>");
    if (x.know.length) parts.push('<div class="hy-know"><b>Know this</b><ul>' + x.know.map((h) => "<li>" + esc(h.take) + "</li>").join("") + "</ul></div>");
    /* the picks in the notes' order; list items picked from one list are one list again */
    for (let i = 0; i < x.paras.length; i++) {
      const d = x.paras[i];
      if (d.tag !== "li") { parts.push(d.html); continue; }
      let j = i; while (j + 1 < x.paras.length && x.paras[j + 1].tag === "li" && x.paras[j + 1].list === d.list) j++;
      parts.push("<" + d.ltag + ">" + x.paras.slice(i, j + 1).map((y) => y.html).join("") + "</" + d.ltag + ">");
      i = j;
    }
    if (!x.paras.length && x.see >= 0) parts.push('<p class="hy-see">Explained under ' + (x.see + 1) + " above: " + esc(P.topics[x.see].t.t) + "</p>");
    else if (!x.paras.length && !x.know.length) parts.push('<p class="hy-none">The notes cover this across several places: As taught has it in full.</p>');
  });
  if (P.more.length) parts.push('<h3 class="hy-t hy-more">Also flagged in class</h3><ul class="hy-list">' + P.more.map((h) => "<li>" + esc(h.take) + "</li>").join("") + "</ul>");
  if (P.skip.length) parts.push('<h3 class="hy-t hy-skip">You can skip</h3><ul class="hy-list">' + P.skip.map((h) => "<li>" + esc(h.take) + "</li>").join("") + "</ul>");
  return parts.join("");
}

/* every lecture with predicted topics: { <lecture id>: html } */
export function highYield({ notes, topics, hints, questions }){
  const QB = {}; (questions || []).forEach((q) => { if (q && q.id) QB[q.id] = q; });
  const out = {};
  for (const lec of Object.keys(notes || {})) {
    const ts = (topics || []).filter((t) => t && t.lec === lec);
    const html = lectureHTML({ html: notes[lec], topics: ts, hints: (hints || []).filter((h) => h && h.lec === lec), questions: QB });
    if (html) out[lec] = html;
  }
  return out;
}

/* the report: what each topic matched, from a hub's built content (hubs/<hub>/next/content/) */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [hub, only] = process.argv.slice(2);
  if (!hub) { console.error("usage: node tools/hub-next/high-yield.mjs <hub> [<lecture>]"); process.exit(2); }
  const dir = join(resolve(dirname(fileURLToPath(import.meta.url)), "../.."), "hubs", hub, "next", "content");
  const read = (f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
  const core = read("core.json"), notes = read("notes.json"), study = read("study.json"), qs = read("questions.json");
  const QB = {}; qs.forEach((q) => { QB[q.id] = q; });
  for (const lec of Object.keys(notes.full)) {
    if (only && lec !== only) continue;
    const ts = (core.likelyTopics || []).filter((t) => t.lec === lec); if (!ts.length) continue;
    const P = pick({ html: notes.full[lec], topics: ts, hints: (study.hints || []).filter((h) => h.lec === lec), questions: QB });
    const full = textOf(notes.full[lec]).length, hy = textOf(lectureHTML({ html: notes.full[lec], topics: ts, hints: (study.hints || []).filter((h) => h.lec === lec), questions: QB })).length;
    console.log(`\n## ${lec}: ${ts.length} topics, ${Math.round(hy / full * 100)}% of the As taught notes' length`);
    for (const x of P.topics) {
      console.log(`* ${x.t.t} [${x.t.basis}, ${x.ids.length} questions]`);
      for (const k of x.know) console.log(`    know: ${k.take.slice(0, 110)}`);
      for (const v of x.votes) console.log(`    ${v.v.toFixed(2)}  ${v.d.tag} ${v.d.head.slice(0, 32)} | ${v.d.text.slice(0, 110)}`);
      if (!x.votes.length) console.log(x.see >= 0 ? `    (already shown under ${x.see + 1})` : "    (nothing matched)");
    }
    if (P.more.length) console.log(`  also flagged: ${P.more.length}`); if (P.skip.length) console.log(`  you can skip: ${P.skip.length}`);
  }
}
