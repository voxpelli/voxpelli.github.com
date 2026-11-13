# `pageUrl` not available to layouts for directly-rendered pages

`Labels: bug, layouts, dx`

---

## Problem

Layouts receive page variables via the `vars` object, but `pageUrl` (the URL path of the current page) is not included for pages rendered directly from markdown or HTML sources. This means layouts cannot construct canonical URLs, Open Graph URLs, or any other URL-dependent metadata without manual workarounds.

The `global.data.js` aggregation step manually constructs `pageUrl` from `pageInfo.path`:

```javascript
const pagePath = p.pageInfo.path;
const pageUrl = pagePath ? '/' + pagePath + '/' : '/';
```

But this only makes `pageUrl` available for posts that flow through global data (index pages, feeds). Pages rendered directly by DomStack (markdown articles, HTML pages) never get `pageUrl` in their `vars`.

---

## Current behavior

```javascript
// In a layout function:
export default function rootLayout ({ children, vars }) {
  console.log(vars.pageUrl); // undefined for article pages
  // Must fall back to '/'
  const pageUrl = String(vars.pageUrl || '') || '/';
  const canonicalUrl = `${siteUrl}${pageUrl}`; // Always https://example.com/
}
```

Every page on the site gets `<link rel="canonical" href="https://voxpelli.com/" />` regardless of the actual page URL. This harms SEO and breaks IndieWeb URL discovery.

---

## Expected behavior

DomStack should automatically inject `pageUrl` (derived from `pageInfo.path`) into the `vars` object before passing it to layouts. For a page at `src/2015/01/my-post/page.md`, the layout should receive:

```javascript
vars.pageUrl === '/2015/01/my-post/'
```

---

## Workaround

Currently the only workaround is to set `pageUrl` manually in each page's frontmatter or `page.vars.js`, which is error-prone and defeats the convention-based routing.

---

## Suggested fix

In the page rendering pipeline, after resolving `pageInfo` and before calling the layout function, inject `pageUrl` into the merged vars:

```javascript
const mergedVars = {
  ...globalVars,
  ...pageVars,
  ...frontmatterVars,
  pageUrl: '/' + pageInfo.path + '/',  // Auto-derived from filesystem path
};
```

This is consistent with how `global.data.js` already constructs URLs and would eliminate the need for manual `pageUrl` construction in every consuming site.

---

## External Research

### DomStack upstream — source code analysis

**No existing issues or PRs** related to `pageUrl` or canonical URLs were found in either `bcomnes/domstack` or `bcomnes/top-bun` repositories. The top-bun repo is not indexed by DeepWiki (it returned "Repository not found"), which is expected since top-bun was renamed to domstack.

**DeepWiki analysis** (bcomnes/domstack) confirms the core problem:
- `pageUrl` is **not a built-in variable** in DomStack. It is not injected into the `vars` object automatically.
- Layouts receive the `page` object (which is the `PageInfo` struct) as a **separate parameter** alongside `vars`, not merged into it.
- To construct a page URL, layouts must use `page.path` or `page.outputRelname` from the `PageInfo` object — but this requires every layout to manually derive the URL.

**Local source code confirms** (from `node_modules/@domstack/static`):

The `PageInfo` type (`lib/identify-pages.d.ts`) exposes:
- `path: string` — the directory path for the page
- `outputName: string` — the output filename
- `outputRelname: string` — the relative output path
- `type: PageTypes` — `"js" | "md" | "html"`
- `draft: boolean`

The `PageData.vars` getter (`lib/build-pages/page-data.js`, line 139-148) merges:
```
{ ...globalVars, ...globalDataVars, ...pageVars, ...builderVars }
```
Notably, **no `pageInfo` properties are injected into this merge**. The `page` object (containing `pageInfo`) is passed as a separate `page` parameter to the layout function (`renderFullPage` at line 253-264):
```js
await layout.render({ vars, styles, scripts, page: pageInfo, pages, children, workers })
```

This means layouts can access `page.path` to construct URLs, but:
1. It requires every layout to manually compute `pageUrl` from `page.path`
2. The `vars` object (where site-specific config like `siteUrl` lives) does not contain `pageUrl`, so constructing a canonical URL requires reaching into two separate parameters
3. There is no convention or documentation suggesting layouts should do `'/' + page.path + '/'`

### The actual workaround available today

Layouts already receive `page` (the full `PageInfo` object) as a parameter. A layout can construct the URL:

```js
export default function rootLayout ({ children, vars, page }) {
  const pageUrl = page.path ? '/' + page.path + '/' : '/'
  const canonicalUrl = `${vars.siteUrl}${pageUrl}`
  // ...
}
```

This works but is fragile — every layout must remember to do this, and there is no guarantee the path-to-URL convention (`'/' + path + '/'`) matches what `global.data.js` uses.

### Upstream example layouts confirm the pattern

The DomStack example `year-index.layout.ts` accesses `p.pageInfo.path` to build links:
```ts
html`<a href="/${p.pageInfo.path}/">${p.vars.title}</a>`
```
This confirms that constructing URLs from `pageInfo.path` is the intended (but undocumented) pattern, and that the path-to-URL convention `/${path}/` is standard.

### Key takeaway

The fix is straightforward: inject `pageUrl` (derived from `pageInfo.path`) into the merged `vars` object inside `PageData.vars` or during `renderFullPage`. This would be a non-breaking change since no existing `pageVars` or `globalVars` would use the `pageUrl` key. The suggested fix in this issue aligns exactly with how DomStack's own examples and `global.data.js` convention already derive URLs from `pageInfo.path`.
