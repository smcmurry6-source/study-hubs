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
After: 17 and 19 ms a frame, about 10 ms a second at rest, 23 layers at rest.

## The rules

1. **Free motion can run all the time; anything else moves in bursts.** Free means a `transform` or `opacity`
   animation on an HTML box (or a whole `<svg>` element, or an `<img>`): the Timmy Time card, the rays behind the rank,
   the rank bar's shine, the place window's marquee. Anything animated *inside* a drawing is not free.
2. **A drawn picture is alive when you arrive, then rests.** On the dashboard, `lifeWatch` in `widget/dash.js` watches
   each drawn part (`#you`, `#now`, the stage's `.dx-set`, `#road`, `#ideas`, `#past`): alive for `LIFE` (8 s) when it
   comes on screen, when a scroll ends on it and under a mouse; `.is-rest` at once when a scroll or a touch starts,
   behind an open window and off screen. `widget/dash.css` takes the animations of everything inside a resting
   drawing away. A new drawn part of the dashboard is added to that list.
3. **Off screen, nothing moves** (`.is-away`, set by the same observer).
4. **No image that moves inside, unless it has a still under it that can take over.** The place card is a still
   `<img>` with the moving picture drawn over it in a shadow root (`.tpc-live`, taken away by `.is-rest`:
   `widget/place.js`, `widget/place.css`). The shop's frames and storefront are a still with the moving image over it
   (`.tsh-live`), shown for 6 s at a time (`shopLife` in `widget/shop.js`). The customizer's frames are stills.
5. **In a window, the picture holds while its list scrolls.** Timmy's place's stage rests while anything in the window
   scrolls, and in Customize 5 s after the last change (`stageLife` in `widget/place.js`). In Visit it is the show and
   keeps moving.
6. **Small things don't move.** The little Timmys in the classroom and on the stage don't blink or sparkle (63 layers
   nobody could see), and the stars on the place card hold still.
7. **Never animate `filter`, `left`, `top`, `width`, `height` or a `box-shadow`** on something that loops. Move an
   overlay's `opacity` or `transform` instead (the crown's glint in `widget/ranks.js` is the pattern).

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

Check a real phone when one is at hand: the numbers above come from a slowed desktop browser.

Related: [shared-infrastructure](shared-infrastructure.md) · [bundles](bundles.md) ·
[verify-before-pushing](../how-to/verify-before-pushing.md) · [the release](../tasks/2026-11-06-redesign-release.md) ·
[decisions](../decisions.md)
