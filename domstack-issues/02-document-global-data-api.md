# Document `global.data.js` caveats: vars getter, error handling, and raw content

`Labels: documentation, dx`

---

## Problem

The DomStack README has a dedicated `global.data.js` section that documents the feature's purpose, function signature, type annotations (`GlobalDataFunction<T>`, `AsyncGlobalDataFunction<T>`), and a working example. The key properties are also listed:

> - Receives fully resolved `PageData[]`
> - Runs inside the worker process
> - Skipped entirely if no `global.data.*` file exists
> - Changes to `global.data.*` trigger a full page rebuild

However, several important **runtime caveats** are not covered. Users must discover these through source diving or trial and error:

1. That `.vars` is a **computed getter** that performs a fresh 4-way merge on every access
2. That `.vars` can **throw** if a page module has errors (syntax errors, missing dependencies)
3. That `.vars.content` for markdown pages is **raw markdown**, not rendered HTML
4. That `renderInnerPage()` is not available in `global.data.js` (it runs before the rendering stage)

These caveats have real consequences for build reliability and performance.

---

## What the README already covers

The README's `global.data.js` section documents:

- **Purpose**: "runs once per build, after all pages are initialized and before rendering begins"
- **Input**: "receives a fully resolved `PageData[]` array"
- **Output**: "returns an object that is stamped onto every page's vars"
- **Types**: `GlobalDataFunction<T>` and `AsyncGlobalDataFunction<T>`
- **Example**: A complete example showing page filtering, sorting, and computed output
- **Variable merge order**: The Variables section documents that `vars` is a merge of "global.vars + global.data + page.vars + builder vars" (with later sources taking precedence)

---

## What's missing: runtime caveats

### 1. `page.vars` is a computed getter

The `.vars` property is not a plain object. It performs a fresh `{ ...globalVars, ...globalDataVars, ...pageVars, ...builderVars }` spread on every access. This means:

- **Cache the result** when reading multiple properties:

  ```js
  // GOOD -- single getter invocation
  const vars = page.vars;
  const { title, date, lang, category } = vars;

  // AVOID -- triggers a fresh 4-way merge on each access
  const title = page.vars.title;
  const date = page.vars.date;
  const lang = page.vars.lang;
  ```

- For large sites with hundreds of pages, caching can noticeably reduce build time.

### 2. `page.vars` may throw

If the underlying `page.vars.js` module has a syntax error, missing import, or runtime exception, accessing `.vars` will throw. When iterating all pages, **always wrap in try/catch**:

  ```js
  const posts = pages.filter(p => {
    try {
      return p.vars.layout === 'article' && p.vars.date;
    } catch {
      return false;  // Skip broken pages gracefully
    }
  });
  ```

This is not theoretical -- it happens during development when pages are work-in-progress.

### 3. `page.vars.content` is raw source, not rendered HTML

For markdown pages, `vars.content` is the **raw markdown string** as read from the `.md` file. To get rendered HTML, use `renderInnerPage()` in a template (see issue #03).

### 4. `renderInnerPage()` is not available in `global.data.js`

`global.data.js` runs before the rendering stage. The `renderInnerPage()` method on `PageData` objects is designed for templates, which run after global data resolution.

---

## Workaround

Users discover these patterns through source diving. This codebase's `src/global.data.js` demonstrates all three defensive patterns:

```js
export default function globalData ({ pages }) {
  const allPosts = pages
    .filter(p => {
      try {                                    // Caveat 2: vars can throw
        return p.vars && p.vars.layout === 'article' && p.vars.date;
      } catch {
        return false;
      }
    })
    .map(p => {
      const vars = p.vars;                     // Caveat 1: cache the getter
      return {
        title: vars.title || '',
        content: vars.content || '',           // Caveat 3: raw markdown
        // ...
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // ...
}
```

---

## Proposed solution

Add a "Caveats" or "Important notes" subsection to the existing `global.data.js` documentation covering:

1. Vars getter behavior (cache the result)
2. Error handling (wrap in try/catch)
3. Raw content (markdown pages provide raw source, not rendered HTML)
4. Rendering availability (renderInnerPage is for templates, not global.data)

This is a small addition to the existing documentation section -- not a new section from scratch.

---

## Real-world impact

In this codebase, `global.data.js` produces the data consumed by **6 different files**:

| Consumer | Data used from `global.data.js` |
|----------|-------------------------------|
| `src/page.js` (homepage) | `vars.recentPosts` |
| `src/archive/page.js` | `vars.postsByYear` |
| `src/links/page.js` | `vars.linkPosts` |
| `src/social/page.js` | `vars.socialPosts` |
| `src/feeds.template.js` | Re-derives post data (because templates receive `vars` from `global.vars` only, not `global.data` -- see issue #09) |
| `src/sitemap.xml.template.js` | Iterates `pages` directly for URL generation |

---

## Related issues

- **#01** -- Exporting `PageData` and `PageInfo` types would let the docs reference importable types and give users autocompletion for the properties documented here.
- **#03** -- Rendered content availability is a key caveat of `global.data.js`; that issue covers the `renderInnerPage()` API in detail.
- **#07** -- The vars getter error behavior described here is the same issue addressed by #07's proposal to wrap the getter with better error messages.
- **#09** -- Templates not receiving `global.data.js` output forces `feeds.template.js` to re-derive all the data that `global.data.js` already computes.
