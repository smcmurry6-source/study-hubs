---
type: rule
tags: [questions]
---

# Numbered-statement questions

Sam's rule, 2026-10-28: **every lecture's questions also include numbered-statement items**: "Which ... are true?" over 4-5
numbered statements, answered with a combination ("1 and 3 only", "1, 2 and 4"), the format Dr. Givan's Occlusion midterm used
and the check-ins asked for. Aim for about 3-5 per lecture; CI fails a taught lecture with fewer than 2 (`FORMAT_MIN.numbered` in
`tools/ci/smoke.js`; archived hubs and perio S1-S5 are exempt, as for the other formats).
- Build them with Occlusion's `nums(id, lec, src, lead, stmts, truth, wrong, ex, reasons)` (copy `numList()`, `numLabel()` and
  `nums()` into a hub that lacks them; Heme & Endo's were written by hand with `mcq()` and `{fmt:'numbered'}`). `truth` says which
  statements are true, `wrong` gives three wrong combinations, and `reasons` one line per statement, written to read after
  "which is true:" / "which is false:". It builds the stem, the choices in canonical order (sorted by their numbers), the key and
  every "why each choice" line ("It includes 2, which is false: ...", "It leaves out 4, which is true: ...").
- `choiceOrder()` never shuffles them, the arcade skips them (`arcadeQ`), and the Question Bank's format filter has "Numbered
  statements". CI checks the stem's "1. "/"2. "/"3. " lines, the choice wording and the canonical order.
- Make each wrong combination differ from the key by one or two statements, so every statement has to be judged. Spread the
  key over all four positions (the sort decides the position: pick the wrong combinations to move it), put the false
  statements at different numbers (not always last), and give the key a size another choice shares. CI, since
  2026-11-04: no key position over 45% of a hub's items, no statement number true in over 90%.
- False statements follow the true/false rule: change one taught detail, never a trick of wording. Draw them from the hub's notes.

Related: [two-statement-and-true-false](two-statement-and-true-false.md) · [every-choice-gets-a-why](every-choice-gets-a-why.md)
