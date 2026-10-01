#!/usr/bin/env python3
"""Join class question stats with the hubs' banks for a lessons audit.

  python3 tools/lessons-join.py <banks-dir> <stats.json> [hub ...]

<banks-dir> comes from `node tools/dump-banks.js <dir>`. <stats.json> is the saved result of the "stats" query in
.claude/skills/lessons-audit/SKILL.md: {"q": [{hub, qid, attempts, correct}], "choices": [{hub, qid, choice, picks}]}
(the raw connector output also works; the JSON is found inside it). Prints accuracy by lecture, type and source, and the
hardest questions with their most-picked wrong answer. Choice indexes are the bank's own (record_choice for MCQs; record_choices, one row per ticked option, for select-alls).
"""
import json, sys, os
from collections import defaultdict

banks_dir, stats_path = sys.argv[1], sys.argv[2]
want = set(sys.argv[3:])
def load_stats(raw):
    """Plain {"q":..,"choices":..} JSON, or the Supabase connector's saved output wrapping it."""
    try:
        d = json.loads(raw)
    except ValueError:
        d = None
    if isinstance(d, dict) and 'q' in d:
        return d
    text = d.get('result', raw) if isinstance(d, dict) else raw
    rows = json.loads(text[text.index('[{'):text.rindex('}]') + 2])
    inner = next(iter(rows[0].values()))
    return inner if isinstance(inner, dict) and 'q' in inner else rows[0]

d = load_stats(open(stats_path).read())
stats = {(r['hub'], r['qid']): (r['attempts'] or 0, r['correct'] or 0) for r in d['q']}
picks = defaultdict(dict)
for r in d.get('choices') or []:
    picks[(r['hub'], r['qid'])][r['choice']] = r['picks']

for f in sorted(os.listdir(banks_dir)):
    hub = f[:-5]
    if not f.endswith('.json') or (want and hub not in want):
        continue
    B = json.load(open(os.path.join(banks_dir, f)))
    Q, L = B['Q'], {l['id']: l for l in B['L']}
    tot_a = sum(stats.get((hub, q['id']), (0, 0))[0] for q in Q)
    if not tot_a:
        continue
    print(f'\n===== {hub}: {len(Q)} questions, {tot_a} attempts')
    for label, key in (('lecture', lambda q: q['lec']), ('type', lambda q: q['type']), ('source', lambda q: q.get('src', '?'))):
        agg = defaultdict(lambda: [0, 0, 0])
        for q in Q:
            a, c = stats.get((hub, q['id']), (0, 0)); g = agg[key(q)]; g[0] += a; g[1] += c; g[2] += 1
        print(f'  by {label}:')
        for k, (a, c, n) in sorted(agg.items(), key=lambda kv: kv[1][1] / max(kv[1][0], 1)):
            name = L.get(k, {}).get('title', k) if label == 'lecture' else k
            print(f'    {round(100 * c / max(a, 1)):3d}%  {a / n:5.1f} tries/q  n={n:<3d} {name}')
    hard = sorted(((stats[(hub, q['id'])], q) for q in Q if stats.get((hub, q['id']), (0, 0))[0] >= 12),
                  key=lambda t: t[0][1] / t[0][0])[:15]
    print('  hardest (12+ tries):')
    for (a, c), q in hard:
        line = f"    {round(100 * c / a):3d}% ({c}/{a}) {q['id']} [{q['type']}] {q['stem'][:90]}"
        p = picks.get((hub, q['id']), {})
        if q['type'] == 'mcq' and p:
            wrong = sorted(((n, i) for i, n in p.items() if i != q['answer']), reverse=True)
            if wrong:
                line += f"\n         favourite wrong: {q['choices'][wrong[0][1]][:70]!r} x{wrong[0][0]}  (key: {q['choices'][q['answer']][:50]!r})"
        elif q['type'] == 'multi' and p:
            # select-all rows count ticks per option (record_choices, from 2026-10-01)
            ticks = ', '.join(f"{'+' if i in q['correct'] else '-'}{q['choices'][i][:30]!r} x{n}"
                              for n, i in sorted(((n, i) for i, n in p.items() if i < len(q['choices'])), reverse=True))
            line += f"\n         ticks (+ key, - wrong): {ticks}"
        print(line)
