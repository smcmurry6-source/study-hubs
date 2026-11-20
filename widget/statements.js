/* Statement items in a new order on a later try (Sam, 2026-11-18: "yes to the two ideas"; Perio reports #55 and #56: "when
   4 statement questions are re asked, the order of the statements as well as the order of the question answers should
   change so you dont just remember the answer was 1, 2, and 4").

   A numbered-statement item ("Which ... are true?" over 3-5 numbered statements, answered "1 and 3 only", "1, 2 and 4") or
   a two-statement item comes back with its statements shuffled and renumbered, and each choice relabeled to the same
   statements. Choice k still means what it meant, so the key, the server's grading, XP, the class's picks per choice and
   question health don't change. The choices stay in canonical order (sorted by their numbers; a two-statement item's four
   in their fixed order), so the right one moves too. Every "Statement 3", "statements 1 and 2", "It includes 3" and "It
   leaves out 3" in the explanation and the why lines is renumbered with them. An item whose words this can't follow (a
   stem with lines after its statements, a choice that isn't a plain combination, "the first statement", "(2)", or any
   other lone number that could name a statement) is left as it is.

   window.shStatements.reorder(q, o) returns a copy of q with its stem, choices, why and ex renumbered, plus
     _perm  the order shown: shown statement j is the item's statement _perm[j - 1]
     _ord   the choices' display order (choice indexes)
   or q itself (not a statement item, nothing it can follow, or the order drawn was the item's own).
   o.fresh: never the item's own order (the first try after the first); o.perm: this order (tests); o.rnd: a random source.
   widget/hub-bank.js calls it for a card on a later try (not in the mock); tools/ci/statements.js runs it on every
   statement item of every hub, every version, every order, and checks that the why lines still agree with the key. */
(function(){
  "use strict";
  var LIST = "\\d(?:\\s*,\\s*\\d)*(?:,?\\s+(?:and|or)\\s+\\d)?";
  /* the ways the whys and explanations name a statement: "Statement 3", "statements 1 and 2"; "It includes 3", "It leaves
     out 2", "It takes in 4"; and a bare "1 and 2 are true" / "so 3 is false" at the start of a sentence or after "so" */
  var REF = new RegExp("\\b([Ss]tatements?\\s+)(" + LIST + ")\\b", "g");
  var VERB = new RegExp("\\b([Ii]t\\s+(?:also\\s+)?(?:includes|leaves out|misses|takes in|adds|drops|omits|skips|keeps)\\s+)(" + LIST + ")(?=[,:;.\\s]|$)", "g");
  var BARE = new RegExp("(^|[.;:!?]\\s+|\\b(?:Right|Wrong|Yes|No):\\s+|\\bso\\s+)(" + LIST + ")(?=\\s+(?:is|are)\\s+(?:true|false|right|wrong)\\b)", "g");
  var TWO = ["Both statements are true", "Both statements are false", "Statement 1 is true; statement 2 is false", "Statement 1 is false; statement 2 is true"];
  var TWO_T = [[1, 1], [0, 0], [1, 0], [0, 1]];
  /* words a renumbering can't follow: an item that has them keeps its own order */
  var RISK = /\b(?:first|second|third|fourth|fifth|last|other) statement\b|\b(?:goals?|items?|numbers?|points?|lines?|options?)\s+\d\b|#\s?\d\b|\(\d\)/i;
  /* numbers that are content, not a statement: "1.5", "30%", "2-3", "10", "HbA1c", "1-wall", "2B"; "Stage 3", "Class 2",
     "of 4"; "1 of 4 visits", "2 mm", "1 year" */
  var CONTENT = [/\d+(?:[.,:/×x-]\d+)+|\d+\s*[%°⁹]|[#×]\s*\d+|\d{2,}|[A-Za-zµ]+-?\d+[A-Za-z]*|\b\d+-?[A-Za-z]+/g,
    new RegExp("\\b(?:Stages?|Class(?:es)?|Grades?|Types?|Phases?|Sessions?|Lectures?|Divisions?|Figures?|Tables?|Steps?|Levels?|Tiers?|Zones?|Generations?|Visits?|Weeks?|Days?|Years?|Months?|Hours?|Lines?|Roots?|Walls?|Teeth|Molars?|Premolars?|of|out of)\\s+" + LIST, "gi"),
    new RegExp(LIST + "\\s*(?:mm|µm|um|cm|m|ml|mL|mg|g|kg|lb|lbs|inches|in|feet|ft|%|percent|weeks?|days?|months?|years?|yrs?|hours?|hrs?|minutes?|min|seconds?|sec|s|times|x|×|of|to|out of|per|walls?|roots?|teeth|surfaces?|sites?|visits?|people|patients?|doses?|units?|cases?|canals?|bid|tid|qd)\\b", "gi")];
  function digits(s){ return (String(s).match(/\d/g) || []).map(Number); }
  function list(a, or){ return a.length === 1 ? String(a[0]) : a.slice(0, -1).join(", ") + (or ? " or " : " and ") + a[a.length - 1]; }
  /* a numbered item's choice, as Occlusion's numLabel() writes it */
  function label(a){ return a.length === 1 ? a[0] + " only" : a.length === 2 ? a[0] + " and " + a[1] + " only" : list(a); }
  function cmp(a, b){ for (var i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; }
  function up(a){ return a.slice().sort(function(x, y){ return x - y; }); }

  /* the stem's lead and its statements (as stemHTML in widget/hub-bank.js reads them), or null */
  function parse(stem){
    var lines = String(stem || "").split("\n"), lead = [], st = [];
    for (var i = 0; i < lines.length; i++) {
      var m = /^\s*(\d+)\.\s+(.*)$/.exec(lines[i]);
      if (m) { if (+m[1] !== st.length + 1) return null; st.push(m[2]); }
      else if (st.length) return null;            /* a line after the statements: it would move with the last one */
      else lead.push(lines[i]);
    }
    return st.length >= 2 && st.length <= 5 ? { lead: lead, st: st } : null;
  }
  /* can every text of this item be renumbered? Every statement number in it must be in a form above; a lone number 1 to n
     left over once those and the content numbers are set aside could be a statement named some other way, so the item
     keeps its own order */
  function followable(q, n){
    var ok = true;
    [q.ex || ""].concat(q.why || []).forEach(function(t){
      t = String(t);
      if (!ok || RISK.test(t)) { ok = false; return; }
      /* the named statements, blanked (same length, so positions hold); one past n means the words aren't this item's */
      var blank = function(m, a, l){ if (digits(l).some(function(d){ return d < 1 || d > n; })) ok = false; return m.replace(/[^]/g, " "); };
      var u = t.replace(REF, blank).replace(VERB, blank).replace(BARE, blank), cover = [];
      /* every content number, each rule on the same text, so "4 of 4" is covered from both sides */
      CONTENT.forEach(function(re){ re.lastIndex = 0; var m; while ((m = re.exec(u))) { for (var i = m.index; i < m.index + m[0].length; i++) cover[i] = 1; if (!m[0].length) re.lastIndex++; } });
      for (var i = 0; i < u.length; i++) { var d = u.charCodeAt(i) - 48; if (d >= 1 && d <= n && !cover[i]) ok = false; }
    });
    return ok;
  }
  function renumber(t, inv){
    var f = function(m, a, l){ return a + list(up(digits(l).map(function(d){ return inv[d]; })), /\bor\b/.test(l)); };
    return String(t).replace(REF, f).replace(VERB, f).replace(BARE, f);
  }
  function shuffle(n, rnd){
    var p = []; for (var i = 1; i <= n; i++) p.push(i);
    for (var j = n - 1; j > 0; j--) { var k = Math.floor(rnd() * (j + 1)), x = p[j]; p[j] = p[k]; p[k] = x; }
    return p;
  }
  function same(p){ return p.every(function(v, i){ return v === i + 1; }); }

  function reorder(q, o){
    o = o || {};
    if (!q || q.type !== "mcq" || (q.fmt !== "numbered" && q.fmt !== "2stmt") || !Array.isArray(q.choices)) return q;
    var P = parse(q.stem); if (!P) return q;
    var n = P.st.length, two = q.fmt === "2stmt";
    if (two ? n !== 2 || q.choices.length !== 4 || q.choices.some(function(c, i){ return c !== TWO[i]; })
            : q.choices.some(function(c){ var d = digits(c); return !d.length || label(d) !== c || d.some(function(x, i){ return x < 1 || x > n || (i && x <= d[i - 1]); }); })) return q;
    if (!followable(q, n)) return q;
    var rnd = o.rnd || Math.random, perm = o.perm, key = two ? null : digits(q.choices[q.answer]);
    if (!perm) {
      /* a new order; on the first try after the first never the item's own, and where it can, one that renames the key */
      for (var t = 0; t < 12; t++) {
        perm = shuffle(n, rnd);
        if (o.fresh && same(perm)) continue;
        if (!two && t < 11 && label(up(key.map(function(d){ return perm.indexOf(d) + 1; }))) === q.choices[q.answer] && !same(perm)) continue;
        break;
      }
      if (o.fresh && same(perm)) perm = shuffle(n, function(){ return 0; });   /* [2, 3, ..., 1]: anything but the own order */
    }
    if (!perm || perm.length !== n || same(perm)) return q;
    var inv = {}; perm.forEach(function(s, j){ inv[s] = j + 1; });
    var c = {}; for (var k in q) c[k] = q[k];
    c.stem = P.lead.concat(perm.map(function(s, j){ return (j + 1) + ". " + P.st[s - 1]; })).join("\n");
    if (two) {
      c.choices = q.choices.map(function(x, i){ var tv = TWO_T[i], nv = [tv[perm[0] - 1], tv[perm[1] - 1]];
        for (var m = 0; m < 4; m++) if (TWO_T[m][0] === nv[0] && TWO_T[m][1] === nv[1]) return TWO[m]; return x; });
      c._ord = c.choices.map(function(x, i){ return i; }).sort(function(a, b){ return TWO.indexOf(c.choices[a]) - TWO.indexOf(c.choices[b]); });
    } else {
      var sets = q.choices.map(function(x){ return up(digits(x).map(function(d){ return inv[d]; })); });
      c.choices = sets.map(label);
      c._ord = sets.map(function(x, i){ return i; }).sort(function(a, b){ return cmp(sets[a], sets[b]); });
    }
    if (q.why) c.why = q.why.map(function(w){ return renumber(w, inv); });
    if (q.ex) c.ex = renumber(q.ex, inv);
    c._perm = perm;
    return c;
  }
  window.shStatements = { reorder: reorder, parse: parse, label: label };
})();
