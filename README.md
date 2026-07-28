# VARZ

**Classless CSS micro framework** — write responsive styles using CSS variables directly in HTML `style` attributes.

- Extremely small (≈ 2.7–5.5 kB gzipped)
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

JavaScript (optional):
```html
<script src="https://cdn.jsdelivr.net/gh/exstheme/varz@main/js/varz.js"></script>
```
## Features

- Classless – styles live directly in the `style` attribute
- Responsive via simple suffixes (`-g`, `-x`, `-l`, `-m`, `-s`)
- Support for hover, focus and active states
- Extremely low specificity (easy to override)
- Easy theming with CSS variables
- Tiny optional JS for interactive components (tabs, modals, accordions, etc.)
- Multiple build variants for different needs
- No build step required

## Documentation

Full documentation, complete variables list and live examples:  
→ [https://varz.dev](https://varz.dev)

## License