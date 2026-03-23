# Document `global.data.js` PageData API and `.vars` getter behavior

## Problem

The `global.data.js` file is a powerful feature for aggregating page data (building feeds, archives, tag indexes, etc.), but its documentation is minimal. Users have to read the source code to understand:

1. What properties are available on the `pages` array elements
2. That `.vars` is a computed getter that merges multiple variable sources
3. That `.vars` can throw if a page module has errors
4. That `.vars.content` for markdown pages is **raw markdown**, not rendered HTML
5. The variable merge order (global vars -> global data -> page vars -> builder vars)

## Reproduction

Create a `global.data.js` that tries to use `pages`:

```js
export default function globalData ({ pages }) {
  // What properties does pages[0] have?
  // What's in pages[0].pageInfo?
  // What's in pages[0].vars?
  // Is pages[0].vars.content rendered HTML or raw markdown?
  // Can pages[0].vars throw?
}
```

Without documentation, the user must read `lib/build-pages/page-data.js` source to answer these questions.

## Suggested documentation addition

Add a "Global Data" section to the docs:

```markdown
## global.data.js / global.data.ts

The optional `global.data.js` file exports a default function that receives all resolved pages
and returns additional variables merged onto every page's vars.

### Function signature

The function receives a single object with a `pages` property:

| Property | Type | Description |
|----------|------|-------------|
| `pages` | `PageData[]` | Array of all resolved page objects |

### PageData properties

| Property | Type | Description |
|----------|------|-------------|
| `pageInfo.path` | `string` | URL path segment (e.g., `"2015/01/my-post"`) |
| `pageInfo.type` | `"js" \| "md" \| "html"` | Page builder type |
| `pageInfo.draft` | `boolean` | Whether this is a draft page |
| `pageInfo.outputName` | `string` | Output filename (usually `index.html`) |
| `pageInfo.outputRelname` | `string` | Relative output path |
| `vars` | `object` | Merged page variables (see caveats below) |
| `styles` | `string[]` | Stylesheet paths for this page |
| `scripts` | `string[]` | Script paths for this page |

### Caveats

- **`page.vars` is a computed getter.** It merges variables from global.vars, global.data,
  page.vars, and builder vars each time it's accessed. Cache the result if you need
  multiple properties:
  ```js
  // Good - single access
  const vars = page.vars;
  const { title, date, lang } = vars;

  // Avoid - triggers merge on each access
  const title = page.vars.title;
  const date = page.vars.date;
  ```

- **`page.vars` may throw** if the underlying page.vars.js module has errors.
  Wrap in try/catch when iterating all pages for resilience:
  ```js
  const posts = pages.filter(p => {
    try { return p.vars.layout === 'article'; }
    catch { return false; }
  });
  ```

- **`page.vars.content` is raw source**, not rendered HTML. For markdown pages,
  this is the raw markdown string. To get rendered HTML, you need to render it
  yourself (e.g., with markdown-it) or use the page's rendered output.

### Variable merge order (later overrides earlier)

1. `global.vars.js` — Site-wide defaults
2. `global.data.js` return value — Computed global data (what you're writing)
3. `page.vars.js` — Per-page overrides
4. Builder vars — Variables set by the page builder (e.g., `content` for markdown)
```

## Impact

This is one of the most important customization points in DomStack. Every site with feeds, archives, or indexes uses `global.data.js`. Better documentation prevents confusion and reduces time-to-productivity for new users.
