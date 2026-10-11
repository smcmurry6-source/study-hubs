# Verifier benchmark, run 1 (2026-10-11)

The go/no-go test from `PLAN_V2.md` item 8, run in interim (Claude-only) mode: before scaling question writing to
three units, check that an independent checker catches planted defects without crying wolf.

## Setup

- **20 items** written from the fact records (`src/boards/facts/`), deliberately hard: 4 factual, 4 pharmacology,
  4 clinical decisions, a 4-item case set (medically complex perio patient), 2 calculations, 2 ambiguity-prone.
  16 high-risk, 4 medium-risk (from the facts they cite). All pass `tools/boards/lint-items.mjs`.
- **20 seeded copies**, one planted defect each, made by `tools/boards/bench.mjs` from `run1/seeds.js`: wrong key 4,
  defensible distractor 4, outdated guideline 3, missing qualifier 3, rationale contradicts key 3, length cue 3.
- **Two batches** (`run1/batch-A.md`, `batch-B.md`): each holds the clean version of half the items and the seeded
  version of the other half, shuffled, with option order shuffled and ids anonymized, so no checker sees both versions
  of an item. Each item carries only the fact records it cites (claim + verbatim quotes).
- **Checker:** a fresh Claude Sonnet subagent per batch, with the adversarial prompt (assume defective; disprove the key,
  defend each distractor, find missing qualifiers, cueing, rationale/key mismatch, outdated content, unsafe wording),
  no web, no repo access. **Independence caveat:** the writer (Claude) and checker (Claude) are the same model family,
  which the plan says shares blind spots. No `OPENROUTER_API_KEY` was available, so no non-Anthropic checker was
  tested yet. Also, the same writer planted the defects, so they may be easier to spot than natural ones.

## Results

| Measure | Result |
|---|---|
| Seeded copies flagged | **20 / 20** |
| Seeded copies caught for the planted defect | **19 / 20 (95%)**: wrong key 4/4, defensible distractor 4/4, missing qualifier 3/3, rationale contradicts key 3/3, length cue 3/3, outdated 2/3 |
| The one miss | A06: the 1.8-mL / 36-mg lidocaine cartridge convention (US dental cartridges are 1.7 mL / 34 mg). The checker flagged an arithmetic side effect of the seed instead. **The code check catches it** (`calc` recomputed from LA-1's data), so code + model together caught 20/20. |
| Code checks alone (zero tokens) | 4 / 20 seeds: the 3 length cues (warnings) and the outdated calculation (error) |
| Clean items passed (first-pass acceptance) | **14 / 20 (70%)** |
| Flags on clean items | 6, **all real defects** in my items; **0 false alarms** |
| Defects in clean items, all sources | 9 of 20 items: the 6 above plus 3 that the checker raised only on an item's seeded twin (a key in an odd format, a box that left open whether a 4-mm site bled, and a threshold from an archived NIDCR guide). So the clean-item pass missed a third of the natural defects it could find, and true first-pass quality was 11/20 (55%). |
| Cost | 343,623 subagent tokens for 40 item checks (174k + 169k), about 8.6k per item, ~5 minutes per batch. No dollars on the subscription; most of it is the batch file re-read on each tool call, so a scripted one-call-per-item checker should cost far less per item. |

The 9 real defects: 8 fixed in `items.js` (re-verification pending): an explanation that named a stage IV trap that
can't reach stage IV; a "why" line that used MRONJ's 8-week rule against an osteoradionecrosis case (now 4 months);
a stem that didn't name the ADA guide although the fact record says it must; antibiotics added after incision and
drainage, which the ADA guideline advises against; a misstated older drug-holiday rule; absolute-sounding distractors
around a hedged key; a key whose format was the odd one out; and a patient box that left open whether a 4-mm site
already bled. The ninth, `b-medcx-0008` keying a platelet cutoff from an archived NIDCR guide that other sources put lower, stays open until a current source is found. Most were writer errors the fact records already guarded against, which is the argument for the pipeline.

## Verdict: go, with conditions

1. **Keep the layers:** code checks first (they caught the one model miss), then the model checker on every item.
2. **Natural defects are harder than planted ones.** One checker pass found about two thirds of the real defects.
   For high-risk items, run two independent checker passes and take the union of flags, then human review per the
   risk tiers. Re-check every repaired item (stage 4b).
3. **Run this same benchmark on a non-Anthropic checker** as soon as an OpenRouter key exists (`run1/` reproduces byte
   for byte with `--rng 11`), and compare catch rate, false alarms and cost before trusting cross-family checking.
4. **Lint additions suggested by the misses:** a fact field that requires the stem to name its guideline (BP-4,
   CH-2), and a wider absolutes/hedging check.

Files: `items.js` (repaired), `run1/items.js` (as checked), `run1/seeds.js`, `run1/batch-*.md`, `run1/key.json`,
`run1/verdicts-*.json`, `run1/adjudication.json`. Score again with
`node tools/boards/bench.mjs score --out docs/boards/bench/run1 --label sonnet`.
