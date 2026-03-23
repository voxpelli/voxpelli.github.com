# Formally document `renderInnerPage()` API and rendered content architecture

`Labels: enhancement, documentation, dx`

---

## Problem

The `renderInnerPage()` method on `PageData` objects is the primary mechanism for accessing **rendered HTML content** from other pages — essential for RSS/Atom feeds, search indexes, and archive previews. The method is demonstrated in the README's "RSS Feed Template Example" but lacks formal dedicated documentation explaining its behavior, parameters, return value, and limitations.

This creates a discoverability gap: users who read the template documentation linearly may encounter `renderInnerPage()` in the RSS example, but there is no reference section explaining:
- What the method does (renders inner page content without layout wrapper)
- That `renderFullPage()` also exists (renders with layout applied)
- That both methods require passing the full `pages` array
- Performance considerations (parallel rendering, caching)
- That these methods are designed for templates, not `global.data.js`

---

## What the README already covers

The README's "RSS Feed Template Example" shows a working usage of `renderInnerPage()`:

```typescript
items: await pMap(blogPosts, async (page) => {
  return {
    date_published: page.vars['publishDate'],
    title: page.vars['title'],
    url: `${homePageUrl}/${page.pageInfo.path}/`,
    id: `${homePageUrl}/${page.pageInfo.path}/#${page.vars['publishDate']}`,
    content_html: await page.renderInnerPage({ pages })
  }
}, { concurrency: 4 })
```

This demonstrates the method signature and shows it being called with `{ pages }` and used in a concurrency-limited parallel context. The `global.data.js` section also documents that it "runs once per build, after all pages are initialized and **before rendering begins**" — implicitly explaining why `renderInnerPage()` is a template-stage API.

---

## What's missing

### 1. Formal API reference for `renderInnerPage()` and `renderFullPage()`

A brief reference section documenting:

```typescript
// Available on PageData objects in templates
page.renderInnerPage({ pages }): Promise<string>   // Content without layout
page.renderFullPage({ pages }): Promise<any>        // Content with layout applied
```

### 2. Architecture explanation: when rendered content is available

The build pipeline has a clear ordering that determines when rendered content can be accessed:

| Build stage | `renderInnerPage()` available? | Why |
|---|---|---|
| `global.data.js` | No | Runs before rendering stage |
| Page functions (`page.js`) | No | Pages receive vars, not other pages' rendered output |
| Templates (`.template.js`) | Yes | Run after page initialization and global data |
| Layouts | No | Receive already-rendered `children` for their own page |

### 3. Performance guidance

For feeds and other outputs that render multiple pages:
- Use `Promise.all()` for parallel rendering
- Cache results in a `Map` when the same page appears in multiple outputs
- Use `new Map(pages.map(p => [p.pageInfo.path, p]))` for O(1) page lookup

---

## Workaround

This codebase's `src/feeds.template.js` demonstrates the complete pattern — page lookup index, parallel rendering with caching, and cache reuse across multiple feed outputs:

```js
// Build page index for O(1) lookup
const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

// Pre-render all unique feed posts in parallel, with cache
const renderCache = new Map();
await Promise.all(allFeedPosts.map(async (post) => {
  const page = pagesByPath.get(post.path);
  const html = page ? await page.renderInnerPage({ pages }) : '';
  renderCache.set(post.path, html);
}));

// Use cached rendered HTML in feed entries
function buildFeed ({ posts }) {
  return posts.map(post => {
    const html = renderCache.get(post.path) || '';
    return renderRssEntry({ content: html, post, siteUrl });
  });
}
```

This pattern works well but was assembled through source-code reading and experimentation.

---

## Proposed solution

### Part 1: Add a "Rendered Content" reference to the docs

Add a brief section near the Templates documentation:

```markdown
### Accessing rendered page content

Templates can render any page's inner content using `renderInnerPage()`:

    const html = await page.renderInnerPage({ pages });

- `renderInnerPage({ pages })` returns the page content rendered by its builder
  (e.g., markdown-to-HTML), **without** the layout wrapper.
- `renderFullPage({ pages })` returns the complete page with layout applied.
- Both methods are async and require passing the full `pages` array.
- For performance, render in parallel with `Promise.all()` and cache results
  when multiple outputs need the same rendered content.

**Note:** `renderInnerPage()` is available in templates only. `global.data.js`
runs before the rendering stage and cannot access rendered content. Use
`vars.content` for raw source content, or move rendering logic to a template.
```

### Part 2: Consider making `renderInnerPage()` available in `global.data.js` (future)

Three possible approaches, in order of feasibility:

| Approach | Description | Trade-offs |
|----------|-------------|------------|
| **Lazy `renderedContent` getter** | Lazily renders and caches on first access | Simplest API; risk of circular dependencies |
| **Two-pass global.data** | Run once for metadata, once after rendering | Complex ordering semantics |
| **Document the architecture** | Officially document that rendered content belongs in templates | No code changes; may not satisfy all use cases |

The documentation approach (Part 1) is the pragmatic immediate fix.

---

## Real-world impact

This codebase demonstrates the split:

| File | Needs rendered HTML? | Current approach |
|------|---------------------|------------------|
| `src/feeds.template.js` | Yes (Atom feed entries) | Uses `renderInnerPage()` — works |
| `src/page.js` (homepage) | Ideally yes (post previews) | Uses raw `content` from global.data |
| `src/archive/page.js` | Ideally yes (archive entries) | Uses raw `content` from global.data |
| `src/links/page.js` | Ideally yes (link descriptions) | Uses raw `content` from global.data |
| `src/social/page.js` | Ideally yes (social posts) | Uses raw `content` from global.data |
| `src/sitemap.xml.template.js` | No (URLs only) | N/A |

The feeds template is the only consumer with access to rendered HTML because it is the only template that uses `renderInnerPage()`. The other consumers receive raw markdown from `global.data.js`, which is a design trade-off rather than a bug.

---

## Related issues

- **#01** -- Exporting `PageData` types would make `renderInnerPage()` discoverable via autocompletion.
- **#02** -- The `global.data.js` caveats documentation should cross-reference this issue's explanation of why rendered content is unavailable there.
- **#09** -- Template `vars` not including `global.data.js` output means templates must re-derive post data even when using `renderInnerPage()`, compounding the complexity.
