# Native async-htm-to-string support as a first-class templating option

`Labels: enhancement, feature-request, templating, dx`

---

## Problem

DomStack's default layout uses `htm/preact` combined with `preact-render-to-string` for server-side HTML generation. This works well for Preact users, but introduces a Preact dependency that is unnecessary for sites that only need server-side HTML rendering and have no client-side component model.

The [`async-htm-to-string`](https://github.com/nicferrier/async-htm-to-string) package provides a lightweight alternative: it uses the same `htm` tagged template syntax but renders directly to HTML strings without a virtual DOM layer. Users wanting this Preact-free approach must currently discover and wire up `async-htm-to-string` entirely on their own, with no guidance from DomStack documentation or tooling.

---

## Current behavior

### Default Preact-based rendering

DomStack's default layout system uses Preact for HTML generation:

```js
// Typical DomStack page.js using htm/preact
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';

export default function ({ vars }) {
  return renderToString(html`
    <h1>${vars.title}</h1>
    <p className="intro">${vars.description}</p>
  `);
}
```

Key characteristics of the Preact approach:
- Uses **React-style attribute names**: `className`, `htmlFor`, `onClick`
- Returns a Preact VNode that must be passed through `renderToString()`
- Pulls in `preact` and `preact-render-to-string` as dependencies
- Supports components and component composition

### What async-htm-to-string offers

`async-htm-to-string` provides a `html` tagged template literal that renders directly to an HTML string:

```js
import { html } from 'async-htm-to-string';

export default async function ({ vars }) {
  return await html`
    <h1>${vars.title}</h1>
    <p class="intro">${vars.description}</p>
  `;
}
```

Key differences from the Preact approach:
- Uses **standard HTML attributes**: `class`, `for`, `tabindex` (not `className`, `htmlFor`, `tabIndex`)
- Returns a string (wrapped in a promise) directly -- no separate render step
- No virtual DOM, no Preact dependency
- Supports async interpolations and nested `html` calls for composition

---

## Gotchas and failure modes

### 1. Standard HTML attributes, not React aliases

`async-htm-to-string` uses real HTML attribute names. This is the most common source of confusion for developers coming from the Preact/React side of DomStack:

| Preact (`htm/preact`) | async-htm-to-string | HTML output |
|---|---|---|
| `className="foo"` | `class="foo"` | `class="foo"` |
| `htmlFor="email"` | `for="email"` | `for="email"` |
| `tabIndex={0}` | `tabindex="0"` | `tabindex="0"` |
| `onClick={fn}` | N/A (no client JS) | N/A |

Using `className` with `async-htm-to-string` produces `className="foo"` literally in the HTML output -- an invalid attribute that browsers ignore silently. There is no warning or error.

### 2. `rawHtml()` XSS risk

`async-htm-to-string` provides a `rawHtml()` function (sometimes aliased as `unsafeHtml()`) for injecting pre-rendered HTML strings without escaping:

```js
import { html, rawHtml } from 'async-htm-to-string';

// SAFE: html escapes interpolated values automatically
const safe = html`<p>${userInput}</p>`;

// DANGEROUS: rawHtml bypasses all escaping
const dangerous = html`<div>${rawHtml(userInput)}</div>`;
```

**This is a direct XSS vector.** Any user-controlled content passed through `rawHtml()` will be injected into the page without sanitization. Common scenarios where `rawHtml()` is needed -- and where the risk is real:

- **Rendered markdown**: `rawHtml(renderedMarkdownHtml)` -- typically safe if the markdown renderer sanitizes output, but the chain of trust must be verified
- **Embedding pre-rendered partials**: `rawHtml(headerHtml)` -- safe only if the partial is trusted
- **Dynamic content from external sources**: `rawHtml(apiResponse.html)` -- **never safe without sanitization**

**Guideline:** Treat `rawHtml()` like `innerHTML` assignment. Use it only for content you control or have explicitly sanitized. Document every usage with a comment explaining why the content is trusted.

### 3. Silent `[object Object]` failure

The `html` function in `async-htm-to-string` returns an `HtmlMethodResult` object, not a plain string. If you return this object without `await`ing it (or without calling `.toString()` / letting the template system resolve it), downstream code that expects a string will produce `[object Object]` in the output:

```js
import { html } from 'async-htm-to-string';

// BUG: Missing await -- returns HtmlMethodResult object
export default function ({ vars }) {
  return html`<h1>${vars.title}</h1>`;
  // DomStack receives an object, not a string
  // Output: "[object Object]" literally in the HTML
}

// CORRECT: await the result
export default async function ({ vars }) {
  return await html`<h1>${vars.title}</h1>`;
  // DomStack receives a resolved string
}
```

This failure is completely silent -- no error, no warning, just broken output. It is especially easy to miss when refactoring from Preact (where `renderToString()` returns a synchronous string) to `async-htm-to-string` (where `html` returns a thenable).

---

## Proposed solution

### Option A (minimum): Document async-htm-to-string as recommended Preact-free alternative

Add a section to DomStack documentation (or a cookbook/recipes page) that:

1. **Explains when to use it**: Sites that only do server-side rendering and do not need Preact components on the client
2. **Shows the migration path** from `htm/preact` + `preact-render-to-string`:

```js
// Before (Preact)
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';

export default function ({ vars }) {
  return renderToString(html`<div className="wrapper">${vars.title}</div>`);
}

// After (async-htm-to-string)
import { html } from 'async-htm-to-string';

export default async function ({ vars }) {
  return await html`<div class="wrapper">${vars.title}</div>`;
}
```

3. **Documents the three gotchas** listed above (attribute names, `rawHtml()` XSS, silent `[object Object]`)
4. **Provides a helper pattern** for composing partials:

```js
import { html, rawHtml } from 'async-htm-to-string';

function header (title) {
  return html`<header><h1>${title}</h1></header>`;
}

export default async function ({ vars }) {
  return await html`
    <!DOCTYPE html>
    <html lang="${vars.lang}">
    <head><title>${vars.title}</title></head>
    <body>
      ${header(vars.title)}
      <main>${rawHtml(vars.content)}</main>
    </body>
    </html>
  `;
}
```

This option requires no code changes to DomStack itself.

### Option B (follow-on): Built-in `page.htm.js` page type with auto-renderToString wrapping

Add a new page builder that recognizes `*.page.htm.js` files and automatically wraps the exported function's return value with the `async-htm-to-string` render step:

```js
// src/posts/hello.page.htm.js
// DomStack auto-imports html from async-htm-to-string
// and auto-awaits the return value

export default function ({ vars }) {
  // No import needed, no await needed -- DomStack handles it
  return html`
    <article>
      <h1>${vars.title}</h1>
      <div class="content">${rawHtml(vars.content)}</div>
    </article>
  `;
}
```

The page builder would:

1. Detect the `.page.htm.js` extension
2. Provide `html` and `rawHtml` as implicit globals (or inject them via the page function params)
3. Automatically `await` the return value if it is thenable
4. Apply the site layout (if any) to the resulting HTML string

This eliminates the `[object Object]` failure mode entirely and reduces per-page boilerplate to zero imports.

**Implementation sketch:**

```js
// lib/build-pages/page-builders/htm-builder.js
import { html, rawHtml } from 'async-htm-to-string';

export async function htmBuilder ({ pageFn, vars, template, pages }) {
  const result = pageFn({ vars, template, pages, html, rawHtml });
  // Await the HtmlMethodResult to get the string
  const rendered = await result;
  if (typeof rendered !== 'string') {
    throw new TypeError(
      `page.htm.js must return an html\`...\` template result, got ${typeof rendered}`
    );
  }
  return rendered;
}
```

Option B depends on DomStack's page builder plugin architecture and should be proposed upstream only after Option A validates demand.

---

## Alternatives considered

| Approach | Pros | Cons |
|---|---|---|
| **A: Document as alternative** | Zero code changes, ships immediately, validates demand | Users still wire it up manually |
| **B: Built-in page.htm.js builder** | Zero-boilerplate DX, eliminates [object Object] trap | New page builder to maintain, upstream buy-in needed |
| **Keep Preact-only** | No work, no new surface area | Forces Preact dependency on SSR-only sites |
| **Support both via config flag** | User chooses per-project | Configuration complexity, two code paths to document |

---

## Related issues

- **#01 -- Export PageData types**: Type exports would help `async-htm-to-string` users type-check their page functions without importing from Preact.
- **#05 -- Document template return types**: The `[object Object]` failure mode is related to the broader question of what DomStack expects templates to return.
- **#06 -- Layout composition docs**: Layout composition patterns differ between Preact (component nesting) and `async-htm-to-string` (string concatenation with `rawHtml`).
- **#09 -- global.data not available to templates**: Affects both Preact and `async-htm-to-string` templates equally -- the templating engine is orthogonal to the data availability gap.
