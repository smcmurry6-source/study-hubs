# Boards hub: plan v2 after external review (2026-10-08)

**Status: proposed, waiting for Sam's go-ahead.** Supersedes the content-pipeline and tooling parts of
`BUILD_SPEC.md` (sections 7-9) and the cost notes in `REVIEW_BRIEF.md`. Everything else in BUILD_SPEC stands.

Inputs: two independent reviews of `REVIEW_BRIEF.md` (one from GPT, one from Gemini, PDFs kept by Sam), and Sam's
new resources: **$100 of Codex credits** (OpenAI) and **$10 of OpenRouter credits**, plus the existing Claude
subscription. No Anthropic API key for now.

## What the reviews changed

Accepted:

1. **The checker must come from a different company** (both reviews). Same-family models share blind spots. The
   verifier runs through OpenRouter on a non-Anthropic model chosen by benchmark (below). Fable is dropped from the
   plan (it exists, but it's another Anthropic model and costs more).
2. **Structured fact database as the single authority.** Each fact becomes a record: `id`, exact claim, source URL,
   exact quote, source date, conditions/exceptions, tags (INBDE/ADEX, unit, risk tier). Questions cite fact ids. Only
   the facts a question needs are sent to the model, never a whole unit.
3. **Three layers of source checking:** (1) the quote exists on the page (script), (2) the source really makes the
   claim, (3) the claim really supports this answer for this patient (verifier model; escalate disagreements).
4. **Adversarial verifier prompt:** assume the item is defective; try to disprove the key, defend each distractor, find
   missing qualifiers and contraindications, cueing, rationale/key mismatch, unsafe wording.
5. **Risk tiers.** Low (stable basic facts): code checks + verifier. Medium (pharm, diagnosis, treatment): + escalate
   disagreements. High (doses, emergencies, contraindications, prophylaxis, medically complex cases): + human review.
6. **Human review targets escalations, not just a random sample:** every verifier flag, every high-risk item, every
   material disagreement, whole case sets read as cases, plus ~10 random items per unit. A small review page (item and
   its cited quotes side by side, approve/flag) keeps this to minutes per item.
7. **Question families:** build verified patient scenarios first, then several linked questions from each (matches
   INBDE case sets and reuses checked facts).
8. **The 20-question benchmark is a hard test, not a sample:** 4 factual, 4 pharmacology, 4 clinical decisions, 4
   case-set items, 2 calculations, 2 deliberately ambiguity-prone. Added here: **seeded errors**. Copies of the items
   get planted defects (wrong key, a defensible distractor, an outdated guideline value, a missing qualifier, a
   rationale that contradicts the key, a length cue). Each candidate verifier runs on clean + seeded items; we measure
   catch rate, false alarms and cost, and pick the verifier (or pair) from the numbers. Also measured: first-pass
   acceptance, repair rate, human-found defects, tokens and dollars.
9. **Expanded code checks** (zero model tokens): schema, forbidden formats (all/none of the above, select-all),
   EXCEPT/NOT capitals, answer-position balance, longest-option rule, duplicate items and options, length limits,
   case-set sizes, quote existence, calculations recomputed from tables, source dates, outline-version tags.
10. **Item-health system after launch:** accuracy, discrimination (strong vs weak students), option spread, reports,
    repeat performance, verifier history, source age; states Healthy / Watch / Review / Retire. Added to the lessons
    audit.
11. **Chairside stays an experiment tied to spaced review:** zero friction (no unskippable animation or waits), a
    **Cram mode** that suspends the schedule before exams (the schedule never locks anything), and gates measured on
    study behavior (due reviews completed, return days, questions answered), not just game starts. Bosses, class runs
    and the ADEX Lab Bench wait until the loop proves useful.
12. **Real images:** radiographs, clinical photos and histology come from openly licensed sources (Wikimedia Commons,
    NLM Open-i, CC BY figures), with a license and attribution record per image; code-drawn figures only for
    schematic diagrams.
13. **Provenance per item:** fact ids, source URLs and dates, outline version, generating model, verifier model and
    verdict, repair history. Plus a privacy note (what the anonymous visitor id stores) and a maintenance guide for
    after graduation.

Modified:

- **Storage (Gemini: IndexedDB only + export/import).** Local-only is not safe for a 22-month schedule: Safari deletes
  a site's stored data after 7 days without a visit (unless installed to the home screen). Plan: **local-first**
  (works fully offline and without Supabase), with the server as backup. The site already keeps each visitor's answer
  history, so the review schedule can likely be rebuilt from it instead of adding a new table; JSON export/import as
  an extra. If Supabase ever goes away, the hub degrades to a fully static, offline study bank.
- **Copyscape plagiarism API (Gemini).** Optional, not default: prep-company questions are mostly behind paywalls, so
  a web-plagiarism API sees little of them, and our items are written from fact records rather than recalled
  questions. Instead: a hard rule never to reproduce known questions, and a quoted-phrase web search on a sample of
  items per unit.
- **Model names in the Gemini review (GPT-4o, Gemini 1.5 Pro) are outdated;** the benchmark picks among current models
  on OpenRouter.

## Who does what (resources Sam has)

| Role | Tool | Budget |
|---|---|---|
| Architect, specs, briefs, risky code (scoring, review scheduling, migration, shared widget), final review and merge | Claude Code (subscription) | ~1.5-2M tokens for release 1 |
| Question and notes writer (from fact records, compact single-agent runs, not multi-agent research) | Claude Code (subscription) | included above |
| Independent adversarial checker | OpenRouter, non-Anthropic model picked by benchmark | ~$3-6 for release 1 |
| Implementer of well-specified code: build tool, hub screens, game modules, the human review page, fact-record conversion | Codex ($100 credits), pull requests into `claude/boards-hub` | a fraction of $100 (to be measured) |
| Cheap mechanical tasks (optional) | Qwen via OpenRouter | pennies |
| High-risk and escalated items | Sam (and a D4 or faculty reviewer if one is willing) | a few hours per release |

Coordination is through GitHub: `AGENTS.md` (rules Codex reads, pointing to CLAUDE.md and this plan), one task brief
per Codex job, each landing as a PR that CI checks and Claude reviews.

## Release 1, in order

0. Housekeeping: trim `DEPLOY_NOTES.md` (archive old entries; ~17k tokens loaded into every session), add `AGENTS.md`.
1. Fact records for medcx, pharm and perio (convert existing research; quote-existence script).
2. **Benchmark** (20 hard items + seeded copies, 2-3 candidate verifiers). Report to Sam; go/no-go on scaling.
3. In parallel, Codex builds the build tool and hub shell from briefs; Claude reviews.
4. The three units (60 items each, case families first), checked per the tiers; Sam reviews escalations.
5. Chairside slice (Codex implements modules; Claude writes the scoring and scheduling core and the tests).
6. Integration, About page, dashboard card, DEPLOY_NOTES line, PR #70 out of draft.

## Decisions needed from Sam

1. Go-ahead for plan v2.
2. Add the OpenRouter key as an environment variable `OPENROUTER_API_KEY` (environment settings), then start a fresh
   session for the build.
3. Are the $100 Codex credits usable only inside Codex, or as general OpenAI API credit? (If general, GPT can also be a
   verifier candidate directly.)
4. Real openly licensed images: yes? Server backup of the review schedule (local-first): yes?
5. Is there a D4 or faculty member who might glance at the high-risk items?
6. Still open from before: unit order vs. course calendar, names ("Chairside", "Boards Hub: INBDE + ADEX").
