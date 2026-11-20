---
type: rule
load: on-demand
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
- **On a later try they come back in a new order** (Sam, 2026-11-18, "yes to the two ideas", Perio reports #55/#56: "so you
  dont just remember the answer was 1, 2, and 4"): `widget/statements.js` shuffles and renumbers the statements, relabels each
  choice to the same statements (choice k keeps its meaning, so the key, grading and the class's picks hold), shows the choices
  in canonical order again, and renumbers "Statement 3", "Statements 1 and 2", "It includes 3" and "It leaves out 3" in the
  whys and the explanation. So refer to statements only those ways (as `nums()` writes them), never "the first statement" or
  "goal 3", and put nothing in the stem after the statements: an item it can't follow keeps its own order. The mock keeps the
  original order. `node tools/ci/statements.js` (in CI) runs every item of every hub, in every order and version, and checks
  that what each why says about each statement still agrees with the key.
- Make each wrong combination differ from the key by one or two statements, so every statement has to be judged. Spread the
  key over all four positions (the sort decides the position: pick the wrong combinations to move it), put the false
  statements at different numbers (not always last), and give the key a size another choice shares. CI, since
  2026-11-04: no key position over 45% of a hub's items, no statement number true in over 90%.
- False statements follow the true/false rule: change one taught detail, never a trick of wording. Draw them from the hub's notes.

Related: [two-statement-and-true-false](two-statement-and-true-false.md) · [every-choice-gets-a-why](every-choice-gets-a-why.md)
