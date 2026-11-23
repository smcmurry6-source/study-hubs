---
type: reference
tags: [widget, performance, animation, dashboard, place, shop, redesign]
---

# What moving pictures cost

Sam, 2026-11-14, on the release's preview: "scrolling and things are kind of sluggish and jittery" (BUG-147 in
[the bug log](../release/bug-log.md)). This note is what the measuring found and the rules that came out of it. Read it
before adding anything that moves by itself to the dashboard, a hub, Timmy's place or the shop.

## What was wrong

- **Every moving shape inside a drawing is a layer.** A browser gives each animated element inside an inline SVG its
  own composited layer, and whatever is drawn over it gets one too. The dashboard had about 130 endless animations
  inside its drawings (the stage's confetti and lights, every Timmy's blink and sparkles, the road, the board) and
  **310 layers**. Each frame of any of them redrew its drawing and rebuilt the page's layer list, wherever the page was
  scrolled, on screen or off.
- **A paused animation keeps its layer.** `animation-play-state: paused` stops the work each frame but not the layers
  (and their memory on a phone). Taking the animation away (`animation: none`) frees them.
- **An image that moves inside is the most expensive kind.** An `<img>` whose SVG has its own animations is drawn
  again whole on every frame, and nothing outside it can pause it. The picture of Timmy's place on the "you" card (55
  animations) and every rarity frame were this.
- **One animation of the wrong property is enough.** A crown medal's glint animated `filter`, and the rank bar's shine
  animated `left`: each forced a redraw every frame from anywhere on the page, and kept every other animation ticking.

Under a 4x slower processor (about a mid-range phone), scrolling the dashboard took 59 ms a frame on a phone-size screen
and 81 ms on a laptop-size one (16.7 is smooth), and the page worked about 950 ms of every second standing still.
After the fixes of 2026-11-14: 17 and 19 ms a frame, about 10 ms a second at rest, 23 layers at rest.

## Nothing you can see pauses (2026-11-22)

Those fixes made the drawings rest: each part moved for 8 s, then froze, froze again whenever a scroll or a touch
started, and the shop's frames moved for 6 s at a time. Sam, 2026-11-22: "I also hate that animations pause"
([decisions](../decisions.md)). Measuring again found that the resting itself was most of the jitter that was left: every
rest and wake put a class on a drawing that a rule like `.is-rest svg *` read, so the browser restyled every shape in it
(up to 3,700 in the road) each time, 40 to 150 ms on a slowed phone, as a part came on or went off the screen or a scroll
started or stopped. Now nothing on screen stops, and the motion is made cheap instead:

- **The leaderboard's stage** is two stills (its backdrop, then the floor, curtains, blocks and winners) with what moves
  drawn between them (the beams, one `<svg>` that pulses, and each sparkle in its own box) and over them (the crown and
  each piece of confetti in its own box): `stageSvg` and `stageFx` in `widget/dash.js`, `fx()` and `stage({ part })` in
  `tools/figures/site/stage.mjs`. The stills are drawn once.
- **The shop's frames, storefront and mystery box** are drawn in the page (`live()` in `widget/shop.js`), not as moving
  images: a drawing in the page redraws only what moves (on a slowed phone the shelves' frames took about half the main
  thread as images and a quarter in the page). With reduced motion they are stills, as before.
- **The place card's moving picture** is its own layer (`will-change: transform` on `.tpc-live`, `widget/place.css`), which
  halves its cost, and **an empty group that moves costs as much as a full one**: the hot-air balloon carried one
  (`<g class="tp-float"></g>`, drawing nothing) that redrew the page around it on every frame, more than everything else
  on the card together. `node tools/figures/site/build.mjs` now fails on any empty group with a moving class.
- **Timmy's place's stage keeps moving** while its window scrolls and in Customize.

Under the same 4x slower processor, scrolling the dashboard while everything keeps moving now takes about what it took
on `main` with everything frozen during the scroll (a second scroll: 20 ms a frame on a phone-size screen, 24 on a
laptop-size one; `main` 19 and 20), with fewer long tasks on the phone.

## The rules

1. **Free motion can run all the time.** Free means a `transform` or `opacity` animation on an HTML box (or a whole
   `<svg>` element, or an `<img>` that is a still): the browser's compositor moves it without drawing anything again.
   The Timmy Time card, the rays behind the rank, the rank bar's shine, the stage's sparkles and confetti, the place
   window's marquee.
2. **Motion inside a drawing costs every frame**, so keep it to what matters, and **lift what moves out of a big drawing**
   when you can: draw the drawing as stills and put each moving piece over it in its own box (the stage is the pattern).
   An animated shape inside an inline `<svg>` makes the browser restyle, lay out and redraw it on the main thread, and
   in WebKit (every iPhone) always. A piece behind something in the drawing goes between two stills, so the order stays
   the drawing's own.
3. **Nothing on screen pauses or rests.** Not after a few seconds, not while the page or a window scrolls, not under or
   away from a mouse (Sam, 2026-11-22).
4. **Off the screen, it stops** (nobody sees it). On the dashboard `lifeWatch` in `widget/dash.js` puts `.is-away` on each
   drawn part (`#hubs`, `#you`, `#now`, `#board` and its stage's `.dx-setbox` on its own, `#ideas`, `#past`) once it is 120 px off the screen,
   and on all of them behind a window that covers the whole screen (a phone's shop or Timmy's place; one that opens after it
   loads is noticed by its `open` attribute). `widget/dash.css`'s `.is-away :is(...)` rule **names the classes that move**:
   never write `.is-away *` or `.is-away svg *`, which restyles every shape in the part. A new moving class on the
   dashboard joins that list; a new drawn part joins `lifeWatch`'s. The shop does the same for its drawings (`watch()` in
   `widget/shop.js`), and the place card's moving layer isn't drawn off the screen.
5. **No image that moves inside.** An `<img>` whose SVG animates is drawn again whole on every frame: draw it in the page
   instead (the shop), or as a still with a moving layer over it (the place card).
6. **Small things don't move.** The little Timmys in the classroom and on the stage don't blink or sparkle, and the stars
   on the place card hold still.
7. **Never animate `filter`, `left`, `top`, `width`, `height` or a `box-shadow`** on something that loops. Move an
   overlay's `opacity` or `transform` instead (the crown's glint in `widget/ranks.js` is the pattern).
8. **No empty group with a moving class**, and no animation on something that draws nothing.

## How to measure

No suite catches this: the performance budgets count requests and bytes, and a headless browser on a build machine is
fast. Measure in a scripted browser on the preview (`node tools/preview/serve.js`), with the processor slowed
(`Emulation.setCPUThrottlingRate`, rate 4, over a CDP session):

- **Scrolling:** move the page 28 px a frame from top to bottom and record the time between frames. Under 20 ms on
  average and no long tasks is the bar.
- **Standing still:** trace two seconds (`browser.startTracing` with `devtools.timeline`) with one part on screen and
  total the main thread's time by event. `Paint` and `Layerize` every frame mean something inside a drawing is moving;
  at rest the total should be near nothing.
- **Layers:** `LayerTree.enable` and count `layerTreeDidChange`'s layers, by the element that owns each
  (`DOM.describeNode`). Dozens named after one class is that class's animation.
- **What moves:** `document.getAnimations()` (and each shadow root's) lists CSS animations and what they animate, but
  not what moves inside an image: look for `<img>` whose SVG source has `animation:` in it.

- **In a Claude Code cloud session the browser draws without a graphics card** (`chrome://gpu`: "Software only"), so the
  compositor can't run animations and even free motion shows up as main-thread work. Compare two versions with the
  free animations switched off in both (a stylesheet with `animation: none` on the HTML boxes that move: the stage's
  `.dx-setfx i` and `.dx-setlights`, the rank bar's shine, the hero's rays, the shop's keeper and showpiece), so what is
  left is the motion inside drawings, which costs on a real phone too. Pick the renderer's main thread by name
  (`thread_name` `CrRendererMain`), not the busiest thread.
- **Where a frame's time goes:** a trace's events by self time. `Layerize` that grows with one picture means something
  moving inside it rebuilds the page's layer list every frame (the balloon's empty group did); switch a class off inside
  its shadow root to find which.

Check a real phone when one is at hand: every number above comes from a slowed desktop browser.

Related: [shared-infrastructure](shared-infrastructure.md) · [bundles](bundles.md) ·
[verify-before-pushing](../how-to/verify-before-pushing.md) · [the release](../tasks/done/2026-11-06-redesign-release.md) ·
[decisions](../decisions.md)
