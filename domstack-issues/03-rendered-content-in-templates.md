# Provide rendered HTML content in `global.data.js` and document `renderInnerPage()` API

`Labels: enhancement, documentation, dx`

---

## Problem

DomStack users frequently need access to **rendered HTML content** from other pages -- for RSS/Atom feeds, search indexes, archive previews, and more. The `renderInnerPage()` method on `PageData` objects provides this capability in templates, but it is undocumented and unavailable in `global.data.js`.

This creates a two-tier experience:
- **Templates** can call `page.renderInnerPage({ pages })` to get rendered HTML (works today, undocumented)
- **`global.data.js`** has no way to access rendered content at all, because it runs before the rendering stage of the build pipeline

Users who need rendered content in page functions (e.g., for archive pages that show post excerpts) must work around this by duplicating rendering logic or restructuring their data flow.

---

## Current behavior

### In templates: `renderInnerPage()` works but is undocumented

The `PageData` class exposes `renderInnerPage()` as a public method:

```typescript
// From @domstack/static/lib/build-pages/page-data.d.ts
class PageData<T, U, V> {
  renderInnerPage({ pages }: { pages: PageData<T, U, V>[] }): Promise<string>;
  renderFullPage({ pages }: { pages: PageData<T, U, V>[] }): Promise<any>;
  // ...
}
```

The implementation (from `page-data.js`) shows it invokes the page's builder and layout function:

```js
async renderInnerPage ({ pages }) {
  if (!this.#initialized) throw new Error('Must be initialized before rendering inner pages')
  const { pageInfo, styles, scripts, vars, builderOptions, workers } = this
  if (!pageInfo) throw new Error('A page is required to render')
  const builder = pageBuilders[pageInfo.type]
  const { pageLayout } = await builder({ pageInfo, options: builderOptions })
  const results = await pageLayout({ vars, styles, scripts, pages, page: pageInfo, workers })
  return results
}
```

This codebase uses it successfully in `src/feeds.template.js` to render post content for Atom feeds:

<details>
<summary>Working renderInnerPage() usage from src/feeds.template.js</summary>

```js
export default async function * feedsTemplate ({ pages, vars }) {
  const siteUrl = vars.siteUrl;
  // ...

  // Build page index for O(1) lookup
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Pre-render all unique feed posts in parallel
  const allFeedPosts = [...new Map(
    [...recentPosts, ...recentEnglishPosts, ...recentLinks]
      .map(p => [p.path, p])
  ).values()];

  const renderCache = new Map();
  await Promise.all(allFeedPosts.map(async (post) => {
    const page = pagesByPath.get(post.path);
    const html = page ? await page.renderInnerPage({ pages }) : '';
    renderCache.set(post.path, html);
  }));

  // Use cached rendered HTML in feed entries
  function buildFeed ({ posts, selfUrl, subtitle }) {
    const entries = posts.map(post => {
      const html = renderCache.get(post.path) || '';
      return renderRssEntry({ content: html, post, siteUrl });
    });
    // ...
  }

  yield { outputName: 'all.xml', content: await buildFeed({ /* ... */ }) };
  yield { outputName: 'english.xml', content: await buildFeed({ /* ... */ }) };
  yield { outputName: 'links/all.xml', content: await buildFeed({ /* ... */ }) };
}
```

</details>

This pattern works well, but the user must discover `renderInnerPage()` by reading the type definitions or source code. There is no documentation explaining:
- That the method exists
- That it requires passing the full `pages` array
- That it returns the inner page content (without the layout wrapper)
- That `renderFullPage()` also exists (returns content with layout applied)
- Performance considerations (parallel rendering, caching)
- That it only works in templates, not in `global.data.js`

---

### In `global.data.js`: no access to rendered content

`global.data.js` runs during the `resolveGlobalData()` phase, which occurs **before** page rendering. At this point, `PageData` objects are initialized but their `renderInnerPage()` method depends on the build pipeline state that may not be fully ready.

This means that code like the following -- which would be the natural approach -- does not work:

```js
// src/global.data.js -- THIS DOES NOT WORK
export default async function globalData ({ pages }) {
  const posts = pages.filter(p => {
    try { return p.vars.layout === 'article'; }
    catch { return false; }
  });

  // Cannot reliably call renderInnerPage() here -- we're in the wrong pipeline stage
  for (const post of posts) {
    const html = await post.renderInnerPage({ pages }); // May fail or produce incomplete results
  }
}
```

As a result, `global.data.js` can only access `vars.content`, which for markdown pages is the **raw markdown source**, not rendered HTML. Pages that need rendered content (archive pages showing excerpts, search indexes) must either:
1. Move their logic into a template (which has access to `renderInnerPage()`)
2. Bring their own markdown renderer as a dependency

---

## Expected behavior

1. `renderInnerPage()` should be **documented** as the official API for accessing rendered content in templates.
2. There should be a **documented path** for accessing rendered content in `global.data.js`, or clear documentation explaining why it is not possible and what the recommended architecture is.

---

## Workaround

The current workaround has two parts:

**For templates (feeds, standalone generated pages):** Use `renderInnerPage()` directly, as shown in `src/feeds.template.js` above. This works today but requires reading source code to discover.

**For page functions (archives, indexes):** Accept raw markdown from `vars.content` and either render it client-side or accept unrendered content. This codebase's `src/archive/page.js` and `src/page.js` use the raw `content` field from `global.data.js`:

```js
// src/page.js -- uses raw content from global.data.js
export default function homePage ({ vars: pageVars }) {
  const recentPosts = pageVars.recentPosts || [];
  const postListItems = recentPosts.map(post =>
    renderPost({
      post,
      content: post.content || '',  // This is raw markdown for .md pages
      // ...
    })
  ).join('\n    ');
  // ...
}
```

---

## Proposed solution

### Part 1: Document `renderInnerPage()` (immediate, no code changes)

Add a "Rendered Content" section to the docs:

```markdown
## Accessing rendered page content

### In templates

Templates can render any page's inner content using `renderInnerPage()`:

\`\`\`js
export default async function * feedTemplate ({ pages, vars }) {
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  for (const post of recentPosts) {
    const page = pagesByPath.get(post.path);
    const html = page ? await page.renderInnerPage({ pages }) : '';
    yield { outputName: `feed/${post.path}.html`, content: html };
  }
}
\`\`\`

**Key points:**
- `renderInnerPage({ pages })` returns the page content rendered by its builder
  (e.g., markdown-to-HTML), **without** the layout wrapper.
- `renderFullPage({ pages })` returns the complete page with layout applied.
- Both methods are async and return Promises.
- You must pass the full `pages` array as a parameter.
- For performance, render in parallel with `Promise.all()` and cache results
  when multiple feeds or outputs need the same rendered content.

### In global.data.js

`global.data.js` runs before the rendering stage. Rendered HTML is **not available**
in this context. Use `vars.content` for raw source content, or move rendering
logic to a template.

### Architecture recommendation

If you need rendered content in multiple outputs (feeds + archive + search):
1. Use a **template** (async generator) to generate all outputs that need rendered HTML.
2. Use `global.data.js` for metadata aggregation (titles, dates, paths, tags)
   that doesn't require rendered content.
```

### Part 2: Consider making `renderInnerPage()` available in `global.data.js` (future enhancement)

Three possible approaches, in order of feasibility:

| Approach | Description | Trade-offs |
|----------|-------------|------------|
| **Lazy `renderedContent` property** | Add a `get renderedContent()` getter to `PageData` that lazily renders and caches the result | Simplest API; risk of circular dependencies if global data affects rendering |
| **Two-pass `global.data.js`** | Run `global.data.js` twice: once before rendering (metadata), once after (with rendered content) | Complex; ordering semantics unclear |
| **Document the architecture** | Officially document that rendered content belongs in templates, not global data | No code changes; may disappoint users wanting rendered content in page functions |

The third option (documentation) is the pragmatic immediate fix. The first option (lazy getter) would be the best long-term DX improvement if the pipeline ordering can be resolved.

---

## Real-world impact

This codebase demonstrates the split perfectly:

| File | Needs rendered HTML? | Current approach |
|------|---------------------|------------------|
| `src/feeds.template.js` | Yes (Atom feed entries) | Uses `renderInnerPage()` -- works |
| `src/page.js` (homepage) | Ideally yes (post previews) | Uses raw `content` from global.data |
| `src/archive/page.js` | Ideally yes (archive entries) | Uses raw `content` from global.data |
| `src/links/page.js` | Ideally yes (link descriptions) | Uses raw `content` from global.data |
| `src/social/page.js` | Ideally yes (social posts) | Uses raw `content` from global.data |
| `src/sitemap.xml.template.js` | No (URLs only) | N/A |

Five out of six consumer files would benefit from rendered HTML access. Currently only the feeds template has it, because it is the only template that discovered the undocumented `renderInnerPage()` API.

---

## Related issues

- **#01** -- Exporting `PageData` types would make `renderInnerPage()` discoverable via autocompletion.
- **#02** -- The `global.data.js` documentation should cross-reference this issue's caveat about `vars.content` being raw source.
- **#05** -- Template return type documentation should include examples using `renderInnerPage()` since that is a primary template use case.
