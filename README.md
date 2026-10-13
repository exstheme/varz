# VARZ

**Classless CSS micro framework** — write responsive styles using CSS variables directly in HTML `style` attributes.

- Extremely small (≈ 3.7–8 kB gzipped)
- No classes needed
- Works alongside any other CSS
- Responsive with simple suffixes
- Visual builder included

**Website:** [https://varz.dev](https://varz.dev)  
**Visual Builder:** [https://varz.dev/builder](https://varz.dev/builder)  
**Demo video:** [YouTube](https://www.youtube.com/watch?v=WPttOopbYxg)

## Quick Start
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/exstheme/varz@main/css/min/varz.css">
<!-- display:grid; grid-template-columns:1fr 1fr; gap: 40px; gap (>992px screens): 20px; grid-template-columns (>992px screens): 1fr; -->
<div style="
  --d: grid;
  --gtc: 1fr 1fr;
  --g: 40px;
  --g-l: 20px;
  --gtc-l: 1fr;
">
  <h1 style="--fs: 2.5rem; --c: #111;">Hello VARZ</h1>
  <p style="--c: #555;">Write responsive CSS directly in the style attribute.</p>
</div>
```
## Breakpoints

### Full version (`varz.css`)

| Suffix | Max width |
|--------|-----------|
| (none) | All sizes |
| `-g`   | ≤ 1400px  |
| `-x`   | ≤ 1200px  |
| `-l`   | ≤ 992px   |
| `-m`   | ≤ 768px   |
| `-s`   | ≤ 576px   |

### Slim version (`varz-slim.css`)

| Suffix | Max width |
|--------|-----------|
| (none) | All sizes |
| `-x`   | ≤ 1200px  |
| `-m`   | ≤ 768px   |
| `-s`   | ≤ 576px   |

## Available Builds

### Standard

| File | Description |
|------|-------------|
| `varz.css` | Full version (recommended) |
| `varz-slim.css` | Slim version (3 breakpoints) |
| `varz-no-reset.css` | Without micro reset |
| `varz-no-reset-no-states.css` | Without reset + states |
| `varz-no-reset-no-states-no-active.css` | Minimal version |
| `varz-slim-no-reset.css` | Slim + no reset |
| `varz-slim-no-reset-no-states.css` | Slim + no reset + no states |
| `varz-slim-no-reset-no-states-no-active.css` | Slim minimal |

### Prefixed (`--vz-`)

| File | Description |
|------|-------------|
| `varz-prefixed.css` | Full + prefixed |
| `varz-prefixed-slim.css` | Slim + prefixed |
| `varz-prefixed-no-reset.css` | Prefixed + no reset |
| `varz-prefixed-no-reset-no-states.css` | Prefixed + no reset + no states |
| `varz-prefixed-no-reset-no-states-no-active.css` | Prefixed minimal |
| `varz-prefixed-slim-no-reset.css` | Prefixed slim + no reset |
| `varz-prefixed-slim-no-reset-no-states.css` | Prefixed slim + no reset + no states |
| `varz-prefixed-slim-no-reset-no-states-no-active.css` | Prefixed slim minimal |

### For IDE / Autocomplete

| File | Description |
|------|-------------|
| `varz-root.css` | Full list of CSS variables |
| `varz-prefixed-root.css` | Prefixed list of CSS variables |

### Add-on

| File | Description |
|------|-------------|
| `varz-tokens.css` | Optional design tokens (spacing, radius, buttons, fields ...) for any variant - markup keeps working without it thanks to fallbacks |

Every file is in `css/` (readable) and `css/min/` (minified).

## JavaScript (optional)

No dependencies, no build step, no classes: everything is set up from `data-*` attributes and styled with
VARZ inline variables. Load only what you use - the components need `varz.js` loaded first.

| File | Size (min / gzip) | What it does | Example |
|------|-------------------|--------------|---------|
| `varz.js` | 13.7 / 4.5 kB | The `.vz` class from data attributes: tabs, accordions, dropdowns, modals, drawers - with ARIA states, focus handling, scroll events, keyboard and element sizes | |
| `varz-slider.js` | 11.7 / 3.8 kB | Accessible carousel on CSS scroll-snap: arrows, dots, autoplay, loop, drag, keyboard | [slider.html](examples/slider.html) |
| `varz-lightbox.js` | 6.8 / 2.6 kB | Image and video viewer on the native `<dialog>`: galleries, swipe, keyboard | [lightbox.html](examples/lightbox.html) |
| `varz-video.js` | 2.0 / 0.8 kB | Click-to-play facade for YouTube, Vimeo and video files - the player loads only on click | [video.html](examples/video.html) |

`js/` holds the minified files, `js/src/` the readable sources - the header comment of each source file is
its complete reference. To try the examples, clone the repository and open `examples/` through any local server.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/exstheme/varz@main/css/min/varz.css">
<script src="https://cdn.jsdelivr.net/gh/exstheme/varz@main/js/varz.js" defer></script>
<!-- only the components you use, after varz.js -->
<script src="https://cdn.jsdelivr.net/gh/exstheme/varz@main/js/varz-slider.js" defer></script>
<script src="https://cdn.jsdelivr.net/gh/exstheme/varz@main/js/varz-lightbox.js" defer></script>
<script src="https://cdn.jsdelivr.net/gh/exstheme/varz@main/js/varz-video.js" defer></script>
```

Elements added to the page later (Ajax, frameworks) are set up by themselves. Users who prefer reduced
motion get no smooth scrolling, sliding or autoplay.

---

### varz.js

#### Toggling the `.vz` class

An element with `data-varz` is a trigger. On click it adds, removes or toggles the class `vz` on other
elements - style the active state with VARZ state variables (`--vz-d:block`, `--p-vz-o:1` ...).

| Attribute | Value |
|-----------|-------|
| `data-vz-toggle` / `data-vz-activate` / `data-vz-deactivate` | what gets / loses the class, comma separated: `self`, `parent`, `grandparent`, `child`, `prev`, `next`, `children`, `siblings`, `parentSiblings`, `siblingsChildren`, `parentSiblingsChildren`, `selector`, `selectorSiblings` |
| `data-vz-selector` | CSS selector for `selector` / `selectorSiblings` |
| `data-vz-deactivate-on` | `click` (outside), `esc`, `scroll`, `resize` (viewport width change) - comma separated |
| `data-vz-self-deactivation` | no activation when the trigger (or its parent) is already active (accordions) |
| `data-vz-prevent` | no default action - a link that opens a popup still works without JavaScript |

```html
<button type="button" data-varz data-vz-toggle="next" data-vz-deactivate-on="click,esc"
        aria-expanded="false" aria-controls="menu">Menu</button>
<ul id="menu" style="--d:none;--vz-d:block;">...</ul>
```

#### Accessibility

ARIA states follow the class - only attributes present in the markup are updated, nothing is added:

- `aria-expanded` on buttons with `aria-controls` pointing at the element, and on the trigger
- `aria-selected` / `aria-pressed` on the element itself (tabs, toggle buttons); tabs get roving `tabindex`

Opt-in attributes on the element that opens:

| Attribute | Effect |
|-----------|--------|
| `data-vz-focus` | focus moves in when it opens (value: a selector inside; empty: the first form field, else the first focusable element) and returns to the trigger when it closes |
| `data-vz-trap` | Tab / Shift+Tab stay inside while open (dialogs, panels) |
| `data-vz-lock` | no page scroll while open |

`Esc` closes only the last element opened.

#### Scroll events

| Attribute | `.vz` class |
|-----------|-------------|
| `data-vz-event="inview"` | while the element is in the viewport - `data-vz-once` keeps it, `data-vz-threshold` (0-1, default 0.15) |
| `data-vz-event="scrolled"` | once the page is scrolled more than `data-vz-offset` px (default 100) - back to top buttons, shrinking headers |
| `data-vz-event="spy"` | on a navigation: on the link of the current section; `data-vz-offset` = distance from the top (default 100); `aria-current` is updated |

`data-vz-activate` + `data-vz-selector` put the class on other elements instead.

```html
<a href="#top" data-vz-event="scrolled" data-vz-offset="600"
   style="--pos:fixed;--r:20px;--b:20px;--o:0;--v:hidden;--vz-o:1;--vz-v:visible;">Back to top</a>
```

#### Keyboard

Arrow keys, `Home` and `End` work automatically in `role="tablist"` (moving selects the tab, only the selected
tab is in the Tab order). `data-vz-keys` gives any other group (toolbars, segmented buttons) arrow-key focus
moves - its value can be a selector of the items.

#### Element sizes

`data-vz-size="--name"` writes the element's height to a CSS variable on `<html>` and keeps it up to date
(ResizeObserver; transforms do not change it). `data-vz-size="--name width"` stores the width.

```html
<header data-vz-size="--header-h" style="--pos:sticky;--t:0;">...</header>
<section style="--mbs:calc(-1 * var(--header-h, 72px));">...</section>
```

#### Events and API

- `varz-activated` / `varz-deactivated` on every element whose class changes (they do not bubble - listen on
  the element or on `document` in the capture phase).
- `varz.className` - the active class (`vz`).
- `varz.activator.toggle( trigger, 'next', 'activate' )` - the same as a click, from code;
  `varz.activator.close( 'esc' )` closes the groups that close on that event.
- `varz.util` and `varz.media` are shared helpers used by the components.

---

### varz-slider.js

Without JavaScript the track is a native horizontal scroller with snap points. The script adds controls,
autoplay, drag, keyboard, loop, the `.vz` class on the slides in view and accessible labels; slides out of
view are `inert`.

```html
<div data-varz-slider data-vz-autoplay="5000" data-vz-loop data-vz-controls="arrows,dots,play" aria-label="Featured">
  <div data-varz-track style="--d:flex;--ox:auto;--sst:x mandatory;--sbw:none;">
    <div style="--fls:0;--w:100%;--ssa:start;">Slide 1</div>
    <div style="--fls:0;--w:100%;--ssa:start;">Slide 2</div>
  </div>
</div>
```

| Attribute | Value |
|-----------|-------|
| `data-vz-controls` | controls to add: `arrows`, `dots`, `play` |
| `data-vz-dots` | dots look: `pill` (default), `round`, `square`, `line`, `ring`, `number` |
| `data-vz-arrows` | arrows look: `round` (default), `square`, `outline`, `plain`; add `bar` to place them next to the dots |
| `data-vz-autoplay` | autoplay interval in ms (holds while a video in the slider plays) |
| `data-vz-loop` | the last slide continues with the first |

Own controls instead: `[data-varz-prev]`, `[data-varz-next]`, `[data-varz-dots]` (with an optional
`[data-varz-dot]` template), `[data-varz-play]`.

Events: `varz-slide` on the slider (`detail: { index, count }`), `varz-activated` / `varz-deactivated` on slides.
API: `varz.slider.go( slider, index )`, `.next( slider )`, `.prev( slider )`, `.init( root )`. Texts: `varz.slider.i18n`.

---

### varz-lightbox.js

Links to the full size files are the triggers - without JavaScript they simply open the image.

```html
<a href="large-1.jpg" data-varz-lightbox="trip" data-vz-caption="Day one"><img src="thumb-1.jpg" alt="Mountains"></a>
<a href="large-2.jpg" data-varz-lightbox="trip"><img src="thumb-2.jpg" alt="Ocean coast"></a>
<a href="https://www.youtube.com/watch?v=ID" data-varz-lightbox="trip"><img src="poster.jpg" alt="Video"></a>
```

Links with the same value form a gallery (an empty value is a single item). YouTube, Vimeo and video file
links play in the viewer. `data-vz-caption` (else the image alt), `data-vz-srcset` for the full image sizes.
Modal `<dialog>`: focus stays inside, `Esc` closes, focus returns to the link, arrow keys, swipe, page
scroll locked. API: `varz.lightbox.open( link )`, `.show( index )`, `.close()`.
Texts: `varz.lightbox.i18n`, looks: `varz.lightbox.styles` (change before the first use).

---

### varz-video.js

A poster link instead of the player - a YouTube or Vimeo embed loads 0.5-1 MB before anyone presses play.
Without JavaScript the link opens the video page.

```html
<a href="https://www.youtube.com/watch?v=ID" data-varz-video style="--pos:relative;--d:block;--ar:16/9;">
  <img src="poster.jpg" alt="Video: How it works" style="--w:100%;--h:100%;--obf:cover;">
</a>
```

Supported: YouTube (played from youtube-nocookie.com, `?t=` start time), Vimeo, video files (`.mp4`, `.webm`,
`.ogv`, `.mov`). Video files: `data-vz-captions="captions.vtt"` (+ `data-vz-captions-lang`,
`data-vz-captions-label`). `data-vz-title` sets the player title (else the image alt).

A playing video stops when its slide, tab or accordion item is deactivated. `data-vz-autoplay` starts it muted
when its container is activated - wrap it in `data-vz-event="inview"` to play it in view.
Events: `varz-video-play`, `varz-video-stop` (bubbling). API: `varz.video.play( link )`, `varz.video.stop( box )`.
Texts: `varz.video.i18n`.


## Features

- Classless – styles live directly in the `style` attribute
- Responsive via simple suffixes (`-g`, `-x`, `-l`, `-m`, `-s`)
- Support for hover, focus and active states
- Extremely low specificity (easy to override)
- Easy theming with CSS variables
- Tiny optional JS: tabs, modals, accordions, dropdowns (`varz.js`) + slider, lightbox and video components
- Multiple build variants for different needs
- No build step required

## Documentation

Full documentation, complete variables list and live examples:  
→ [https://varz.dev](https://varz.dev)

## License

MIT - see [LICENSE](LICENSE).
