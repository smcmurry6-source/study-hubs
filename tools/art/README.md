# The art kit: one hand for the whole site

Sam's call, 2026-11-05 ([decisions](../../vault/decisions.md)): every picture on the site is **drawn in code in one
hand, the ink plate**: a fine ink line, cross-hatching for shade, one spot color (the hub's warm companion) and one
cool fill on bone paper. Nothing stock, nothing generated. Every pop-up, empty state, hub
card and About part gets **its own drawing**; a drawing is never reused for a different meaning.

The kit is `widget/art.js` (`window.shArt`), which injects its own styles (the dashboard and About load no `v3.css`), and this folder holds
the contact-sheet renderer (`sheet.mjs`) that every change is looked at with. Timmy Tooth's own sprite (`widget/pet.js`,
the pet in the bottom-left corner) stays as it is: the kit draws him in ink as decoration and matches the cast to him.

## The hand (follow all of it)

- **Canvas:** a 100 x 100 viewBox. Leave 6-8 units of air at the edges; the subject fills the middle 80.
- **Line:** class `s`: no fill, the ink, width 1.7, round caps and joins. One weight everywhere. No second, thinner
  line except hatching. A line can be broken (a gap where it turns) the way a pen lifts; keep it rare.
- **Shade:** class `hatch` (the shared 45-degree hatch pattern) on the dark side of a round thing and under things.
  Never a gradient, never a drop shadow, never opacity ramps.
- **Fills:** `b` is the body (the paper itself, so a drawing sits in the page); `sp` is the spot color (warm: the one
  thing the drawing is about, at most a quarter of the drawing); `sp2` is the cool fill (a ground, a shadow side, metal).
  Nothing else gets a color. White (`shine`) only for a glint in an eye or on glass.
- **Timmy in a drawing is decoration** (Sam, 2026-11-05): an ink drawing of him from `shArt.timmy(ox, oy, k, mood)`,
  a molar at that offset and scale with his face (moods `o`, `worried`, `sleep`, or his smile). **The real Timmy, the
  pet in the bottom-left corner (`widget/pet.js`), is never changed**: not his sprite, outfits, cottage or moods.
- **Faces** (Timmy, number thirty-one, the rabbit): dot eyes (`eye`, r 2.6-3.2) with one `shine` dot
  up-left, a single smile stroke, two small `sp` blush marks at 70% opacity. No eyebrows unless the character is
  worried (thirty-one).
- **No filter on the lines** (Sam, 2026-11-05: the joints have to meet). The hand is in the drawing itself: clean
  paths whose ends meet, one weight. Check every joint on the contact sheet; a gap where two strokes should meet is a
  bug.
- **Dark mode:** a drawing keeps its ink and cream in both themes, the way Timmy's sprite does; only the page behind it
  changes. So a ground line or a shadow under a thing uses `g` (a line in the cool color), never the ink, and nothing
  relies on the page's color. Don't bake a color into a path.
- **Size:** a drawing has to read at 36 px (a toast) and at 200 px (a celebration). No detail thinner than 1 unit, no
  text inside a drawing except a single number or letter (a "31", an "A").
- **Meaning first:** draw what the thing is about (a trophy for "Night Owl" is an owl holding a tooth, not a generic
  cup). A caption never explains a drawing; the drawing explains the caption.
- American English in names and comments. No course material, no real people, no logos.

## The contract (`widget/art.js`)

```js
window.shArt.register("night-owl", function(){ return '<path class="b" d="..."/><path class="s" d="..."/>'; });
window.shArt.svg("night-owl", { size: 84, title: "Night Owl" });   // '<svg class="sh-art is-big" ...>'
window.shArt.svg("timmy", { size: 36 });                           // aria-hidden when no title
window.shArt.svg("reply", { size: 72, ink: true });                // draws itself on (skipped under reduced motion and Answer animations off)
window.shArt.svg("toast-cheer", { size: 36, wiggle: true });       // a toast's nod, gated the same way
window.shArt.register("band-perio", fn, { w: 300, h: 60 });        // a wide drawing (a frieze); size is then its width
window.shArt.defs();                                               // the shared filter and hatch, once per page
```

A motif function returns the inner markup only (no `<svg>`). It may take `o` (the options) for a variant (a tier, a
number) and must return the same drawing for the same input. Register names in `kebab-case`; the kit lists them with
`shArt.names()`. Options the kit understands: `size` (px, square), `title` (gives the svg a `role="img"` and an
`aria-label`; without it the svg is `aria-hidden`), `cls` (extra classes), `spot` and `cool` (override the two colors), `ink`
(the drawing inks itself on) and `wiggle` (a toast's nod); the last two are dropped under reduced motion and when the
Answer animations setting is off (`shArt.still()`).

Where a drawing lives: `widget/art.js` holds the cast and the shared motifs; the groups drawn for a feature live in the
same file under their heading (trophies, ranks, pop-ups, empty states, classes, About parts, hub achievements), so one
file is the whole hand and `sheet.mjs` can render it all.

## Look at it before you ship it

```bash
node tools/art/sheet.mjs                 # every motif, 84 px, light and dark, to tools/art/sheet-light.png and -dark.png
node tools/art/sheet.mjs empty-          # one group (a name prefix), to tools/art/sheet-empty.png and -dark.png
node tools/art/sheet.mjs about- --extra=/path/to/motifs-about.js   # a group drawn in its own file, before it's merged into art.js
```

Open the PNG and judge it against the hand above and against Timmy. A drawing that needs its caption, a line that is
thicker than the rest, a color outside the three, a motif that could be any site's icon: redraw it. The before state
and the sample sheets Sam chose from are described in the design notes
([2026-11-05-redesign-design-notes](../../vault/release/reports/2026-11-05-redesign-design-notes.md), section 9).

## Who gets a drawing

Sam's second call (2026-11-05, [decisions](../../vault/decisions.md)): **the rank medallions, the 30 trophy icons, each
hub's achievement badges and the animated rank-up, level-up and trophy cards stay as they are** (the medallions and
trophy icons may be touched up within their own style; nothing in the kit replaces them). The hand goes on everything
that announces or frames them, and on the rest of the site:

| Where | Motifs (names in `art.js`) |
|---|---|
| The cast | `timmy`, `timmy-cheer`, `timmy-think`, `timmy-sleep`, `timmy-study`, `thirty-one`, `rabbit`, `brush` |
| Pop-ups and toasts | `toast-cheer` (an achievement toast, beside the hub's own badge), `reply` (a report answered), `notice` (a notice to everyone), `survey`, `tour`, `drill`, `drill-done`, `mock` (the frame of the mock results card; its animation stays) |
| Empty states | `empty-misses` (nothing missed), `empty-pins`, `empty-first` (a fresh hub), `empty-drill` (no drill today), `empty-search` (nothing matches) |
| Hub Home friezes | `band-occlusion`, `band-perio`, `band-pcd-implants-exam1`, `band-special-patient-care` (a wide drawing, 300 x 60, for that course) |
| Dashboard classes (`CLASSES` in `index.html`) | `class-implants`, `class-spc`, `class-hemeendo`, `class-gi`, `class-fixedpros`, `class-occlusion`, `class-perio` |
| About parts | `about-dashboard`, `about-widget`, `about-modes`, `about-arcade`, `about-progress`, `about-timmy`, `about-eggs`, `about-seasons`, `about-trophies` |
| Feedback (`widget/fx.js`) | `spark` (a right answer), `flame` (the streak), `stamp` (a lecture all right) |
| Shared objects (used inside the above) | `tools`, `trophy`, `handpiece`, `articulator`, `implant` |

Not drawn here, by that call: the trophies (`TROPHIES` art in `widget/ranks.js`), the rank medallions (`R.art`), the
hub `ACHIEVEMENTS` badges (each hub's `icon()`), and the celebration cards' own art (`widget/rankup.js`).

Related: [diagrams-anima](../../vault/rules/diagrams-anima.md) (figures that teach are a different kit) ·
[arcade-skins](../../vault/rules/arcade-skins.md) (the arcade keeps its own art).
