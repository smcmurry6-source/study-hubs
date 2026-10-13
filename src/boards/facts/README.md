# Boards hub fact records

The single authority for what a boards question may treat as true (`docs/boards/PLAN_V2.md`, item 2). Questions cite
fact ids in `refs`; a checker gets only the records an item cites, never a whole unit. Converted on 2026-10-11 from
`docs/boards/research/facts-medical.md` (sections 1-8) and `facts-dental.md` (sections 1-2), which are now background
notes: **edit the JSON, not the markdown**.

## Files

- `sources.json`: every source, keyed (`ada-anticoag`, `dm-septocaine`...): `title`, `org`, `url` (what a reader
  opens), `fetch` (machine-readable copy the checker reads: DailyMed SPL XML, Europe PMC full text), `kind`
  (`html`, `xml`, `spl`, `pdf`), `date` (publication, last update or label effective date), `citation`, `blocked`.
- `<unit>.json`: facts homed in that unit (`pharm`, `medcx`, `anes`, `perio`, `endo`). `units` lists every unit that
  may cite the fact.

## Perio prefixes (`perio.json`)

`PH` health and gingivitis, `BF` biofilm, calculus and modifying factors, `FM` furcation and mobility, `RAD`
radiographs, `PS` staging and grading, `PA` acute lesions, `MG` mucogingival, `PI` peri-implant, `PR` prognosis, `PT`
therapy steps and adjuncts (EFP S3), `SX` surgery, `LD` local-delivery labels, `PSY` perio and systemic health, `GE`
drug-influenced enlargement. Pharmacokinetics basics are `PK-3` onward in `pharm.json` (`PK-1`/`PK-2` are CYP3A).

## A fact

| Field | Meaning |
|---|---|
| `id` | Stable forever (`IE-5`). Topic prefix + number; never reuse a retired id. |
| `status` | `verified` (the quotes support the claim), `partial` (only part is verified: read `conditions`), `unverified` (never key an item on it), `proposal` (an author's proposed term, not the official one), `convention` (a teaching frame, never the reason a key is right). |
| `risk` | `low` (stable basic facts), `medium` (diagnosis, treatment), `high` (doses, emergencies, contraindications, prophylaxis, medically complex). Sets how hard items citing it are checked (PLAN_V2 item 5). |
| `claim` | The fact in our own words: the exact statement items may rely on. |
| `conditions` | Qualifiers, exceptions, what not to key, gaps in the sourcing. |
| `stem_names` | Names a stem must mention when an item cites this fact (`["ADA"]`): for facts whose numbers differ between sources. The lint fails an item that doesn't name one. |
| `data` | Numbers in structured form, for calculation items (`lint-items.mjs` recomputes an item's `calc` from them). |
| `cites` | `[{src, loc, quote}]`. `quote` is a short verbatim excerpt from the source (`null` when the source blocks scripts). |
| `see` | Related fact ids. |
| `units`, `topic`, `exam` | Tags. |
| `errata` | Corrections made after recording, with the date. |
| `recorded` | Date first recorded. |

## Rules

- **Quotes are exact.** Copy them from the source text (`node tools/boards/check-quotes.mjs --grep <src> '<regex>'`
  prints matches in context; `--propose` suggests sentences for cites without one). Keep each one short (one clause
  to two sentences) and pick the words that carry the fact's numbers and qualifiers.
- **Run `node tools/boards/check-quotes.mjs` after any change.** It fetches each source (cached 7 days in `.cache/`,
  not committed) and confirms every quote is there. Exit code 1 = a quote is missing.
- **Changing a fact:** update the record first (and add an `errata` line if the old claim was wrong), rerun the quote
  check, then grep `src/boards` for the id and send every item citing it back through verification.
- **Blocked sources** (`blocked` set, e.g. the AHA 2021 statement on ahajournals.org): save the PDF from a browser as
  `.cache/boards-sources/<key>.local.pdf`; the checker reads that copy. Until then those cites carry `quote: null`
  and the fact's `conditions` say what rests on them alone.
  Some blocked sources keep their quotes because a saved copy works: `ada-fda-radiographs-2012` (fda.gov answers
  Node's fetch with HTTP 401 but serves curl), so `curl -L -o .cache/boards-sources/ada-fda-radiographs-2012.local.pdf
  https://www.fda.gov/media/84818/download` once before the quote check.
- **Never** cite a prep company, a forum, a released exam item or a textbook we can't link. Items never reuse 8 or
  more consecutive words from a quote (the copy guard in `tools/boards/lint-items.mjs`).
