# Document `global.data.js` PageData API and `.vars` getter behavior

`Labels: documentation, dx`

---

## Problem

The `global.data.js` file is one of the most powerful features in DomStack -- it aggregates page data to build feeds, archives, tag indexes, search data, and more. Yet its documentation is minimal to nonexistent. Users must read the internal source code (`lib/build-pages/page-data.js`, `lib/build-pages/resolve-vars.js`) to understand:

1. What properties are available on the `pages` array elements (`PageData` instances)
2. That `.vars` is a **computed getter** that merges four variable sources on every access
3. That `.vars` can **throw** if a page module has errors (e.g., syntax errors in `page.vars.js`)
4. That `.vars.content` for markdown pages is **raw markdown**, not rendered HTML
5. The variable merge order and its precedence rules
6. That the return value is merged into every page's `vars` (meaning `global.data.js` output is available in layouts, page functions, and templates)

Without documentation, every DomStack user writing a `global.data.js` must discover these behaviors through trial, error, and source diving.

---

## Current behavior

A user creates `src/global.data.js` and receives a `{ pages }` param with no guidance on what `pages` contains:

```js
// src/global.data.js -- what a new user writes
export default function globalData ({ pages }) {
  // What properties does pages[0] have?
  // What is pages[0].pageInfo? What fields does it contain?
  // What is pages[0].vars? Is it a plain object or something else?
  // Is pages[0].vars.content rendered HTML or raw markdown?
  // Can pages[0].vars throw? Under what conditions?
  // What does the return value do? Where does it end up?
}
```

The user must read `lib/build-pages/page-data.js` to find the `vars` getter implementation:

```js
// From @domstack/static/lib/build-pages/page-data.js (actual source)
get vars () {
  if (!this.#initialized) throw new Error('Initialize PageData before accessing vars')
  const { globalVars, globalDataVars, pageVars, builderVars } = this
  return {
    ...globalVars,
    ...globalDataVars,
    ...pageVars,
    ...builderVars,
  }
}
```

This reveals critical information that should be in the docs: `vars` performs a fresh object spread on every access, combining four separate sources.

---

## Expected behavior

A dedicated "Global Data" section in the documentation should explain the full API surface, including caveats, with enough detail that users never need to read the source.

---

## Workaround

Users read the source code, copy patterns from example sites, and discover caveats the hard way. This codebase's `src/global.data.js` demonstrates several learned-the-hard-way patterns:

<details>
<summary>Full src/global.data.js from this codebase (73 lines)</summary>

```js
/**
 * Aggregate page data for indexes, feeds, and archives.
 * Pages are DomStack PageData objects with .pageInfo and .vars properties.
 *
 * @param {{ pages: Array<{ pageInfo: { path: string, outputRelname: string },
 *           vars: Record<string, unknown> }> }} options
 * @returns {Record<string, unknown>}
 */
export default function globalData ({ pages }) {
  // Filter pages that are blog posts (have a date and article layout)
  const allPosts = pages
    .filter(p => {
      try {
        return p.vars && p.vars.layout === 'article' && p.vars.date;
      } catch {
        return false;
      }
    })
    .map(p => {
      const vars = p.vars;  // Cache the getter result
      const pagePath = p.pageInfo.path;
      const pageUrl = pagePath ? '/' + pagePath + '/' : '/';

      return {
        title: vars.title || '',
        date: vars.date,
        lang: vars.lang,
        category: vars.category,
        content: vars.content || '',
        path: pagePath,
        pageUrl,
        ...Object.fromEntries(
          Object.entries(vars).filter(([k]) => k.startsWith('mf-'))
        ),
        tags: vars.tags,
        persontags: vars.persontags,
        submitto: vars.submitto,
      };
    })
    .sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const blogPosts = allPosts.filter(p => !p.category);
  const socialPosts = allPosts.filter(p => p.category === 'social');
  const linkPosts = allPosts.filter(p => p.category === 'links');

  const recentPosts = blogPosts.slice(0, 10);
  const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
  const recentLinks = linkPosts.slice(0, 10);

  const postsByYear = {};
  for (const post of blogPosts) {
    const year = new Date(post.date).getFullYear().toString();
    if (!postsByYear[year]) postsByYear[year] = [];
    postsByYear[year].push(post);
  }

  return {
    allPosts, blogPosts, socialPosts, linkPosts,
    recentPosts, recentEnglishPosts, recentLinks, postsByYear,
  };
}
```

</details>

Note three patterns this code had to discover without documentation:

1. **`try/catch` around `p.vars`** -- because the getter can throw if a page module is broken
2. **`const vars = p.vars`** -- caching the getter result to avoid redundant merges
3. **`vars.content` used as raw text** -- because it is raw markdown, not rendered HTML

---

## Proposed solution

Add a "Global Data" section to the DomStack documentation covering the following content.

### Section 1: Overview and function signature

```markdown
## global.data.js / global.data.ts

The optional `global.data.js` file in your `src/` directory exports a default function
that receives all resolved pages and returns an object of additional variables. These
variables are merged onto **every page's** `vars` object, making them available in
layouts, page functions, and templates.

This is the primary mechanism for building:
- Blog post indexes and archives
- RSS/Atom feed data
- Tag clouds and category pages
- Site-wide navigation data
- Search indexes

### Function signature

The default export receives a single object:

| Parameter | Type | Description |
|-----------|------|-------------|
| `pages`   | `PageData[]` | Array of all resolved page objects in the site |

The return value (sync or async) is an object whose keys become available on
every page's `vars`:

| Return | Type | Description |
|--------|------|-------------|
| (return value) | `Record<string, any>` | Merged into `vars` at position 2 in the merge order |
```

### Section 2: PageData properties reference

```markdown
### PageData properties

Each element in the `pages` array is a `PageData` instance with these properties:

| Property | Type | Description |
|----------|------|-------------|
| `pageInfo` | `PageInfo` | Static metadata about the page file |
| `pageInfo.path` | `string` | URL path segment, e.g., `"2015/01/my-post"` |
| `pageInfo.type` | `"js" \| "md" \| "html"` | Page builder type |
| `pageInfo.draft` | `boolean` | Whether this is a draft page |
| `pageInfo.outputName` | `string` | Output filename, usually `"index.html"` |
| `pageInfo.outputRelname` | `string` | Relative output path, e.g., `"2015/01/my-post/index.html"` |
| `pageInfo.pageFile` | `PageFile` | File system info (root, filepath, relname, basename, parentName) |
| `pageInfo.pageStyle` | `PageFileAsset \| undefined` | Associated `style.css` if present |
| `pageInfo.clientBundle` | `PageFileAsset \| undefined` | Associated client JS bundle if present |
| `pageInfo.pageVars` | `PageFileAsset \| undefined` | Associated `page.vars.js` if present |
| `pageInfo.workers` | `Record<string, PageFileAsset> \| undefined` | Web worker files |
| `vars` | `object` (getter) | Merged page variables -- see caveats below |
| `styles` | `string[]` | Stylesheet paths for this page (global + page-specific) |
| `scripts` | `string[]` | Script paths for this page (global + page-specific) |
| `renderInnerPage({ pages })` | `Promise<string>` | Render this page's inner content (available in templates, not global.data) |
```

### Section 3: Caveats (critical)

```markdown
### Caveats

#### 1. `page.vars` is a computed getter

The `.vars` property is **not a plain object**. It is a getter that performs a fresh
`{ ...globalVars, ...globalDataVars, ...pageVars, ...builderVars }` spread on every
access. This means:

- **Cache the result** if you need multiple properties from the same page:

  ```js
  // GOOD -- single getter invocation, destructure from the cached result
  const vars = page.vars;
  const { title, date, lang, category } = vars;

  // AVOID -- triggers a fresh 4-way merge on each property access
  const title = page.vars.title;
  const date = page.vars.date;
  const lang = page.vars.lang;
  ```

- For large sites with hundreds of pages, caching can noticeably reduce build time.

#### 2. `page.vars` may throw

If the underlying `page.vars.js` module has a syntax error, missing import, or
runtime exception, accessing `.vars` will throw. When iterating all pages,
**always wrap in try/catch** for resilience:

  ```js
  const posts = pages.filter(p => {
    try {
      return p.vars.layout === 'article' && p.vars.date;
    } catch {
      return false;  // Skip broken pages gracefully
    }
  });
  ```

This is not a theoretical concern -- it happens during development when pages are
work-in-progress.

#### 3. `page.vars.content` is raw source, not rendered HTML

For markdown pages, `vars.content` is the **raw markdown string** as read from the
`.md` file. It is not rendered HTML. To get rendered HTML, use `renderInnerPage()`
in a template (see issue #03), or render it yourself with a markdown library.

#### 4. `renderInnerPage()` is not available in global.data.js

The `renderInnerPage()` method exists on `PageData` objects, but it is designed for
use in templates, which run after global data resolution. Calling it in `global.data.js`
may not work as expected because the build pipeline has not yet reached the rendering
stage.
```

### Section 4: Variable merge order

```markdown
### Variable merge order (later wins)

When `page.vars` is accessed, four sources are merged via object spread. Later
sources override earlier ones for the same key:

| Priority | Source | Set by | Example |
|----------|--------|--------|---------|
| 1 (lowest) | `global.vars.js` | Site-wide defaults | `{ siteUrl: '...', blogName: '...' }` |
| 2 | `global.data.js` return | Computed global data (this file) | `{ recentPosts: [...], postsByYear: {...} }` |
| 3 | `page.vars.js` / `export const vars` | Per-page overrides | `{ layout: 'article', title: 'My Post' }` |
| 4 (highest) | Builder vars | Page builder (md, js, html) | `{ content: '...' }` for markdown pages |

This means a page's `title` set in `page.vars.js` overrides anything in `global.vars.js`,
and `content` set by the markdown builder overrides everything.
```

### Section 5: Practical example

```markdown
### Complete example

  ```js
  // src/global.data.js
  /** @type {import('@domstack/static').GlobalDataFunction} */
  export default function globalData ({ pages }) {
    const posts = pages
      .filter(p => {
        try { return p.vars.layout === 'article' && p.vars.date; }
        catch { return false; }
      })
      .map(p => {
        const vars = p.vars;
        return {
          title: vars.title,
          date: vars.date,
          path: p.pageInfo.path,
          pageUrl: '/' + p.pageInfo.path + '/',
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      recentPosts: posts.slice(0, 10),
      postsByYear: Object.groupBy(posts, p =>
        new Date(p.date).getFullYear().toString()
      ),
    };
  }
  ```

These returned properties (`recentPosts`, `postsByYear`) are then available in
every page function, layout, and template via `vars.recentPosts`,
`vars.postsByYear`, etc.
```

---

## Alternatives considered

| Approach | Pros | Cons |
|----------|------|------|
| **Docs section (proposed)** | Covers all caveats, easily discoverable | Requires ongoing maintenance as API evolves |
| **JSDoc on the `PageData` class only** | Closer to source of truth | Users still must find and read source; misses caveats like try/catch and merge order |
| **Guided example in project scaffold** | Immediate on-boarding | Doesn't help users who add `global.data.js` later |

A docs section is the best first step; once issue #01 lands (type exports), the docs can link directly to importable types.

---

## Real-world impact

In this codebase, `global.data.js` produces the data consumed by **6 different files**:

| Consumer | Data used from `global.data.js` |
|----------|-------------------------------|
| `src/page.js` (homepage) | `vars.recentPosts` |
| `src/archive/page.js` | `vars.postsByYear` |
| `src/links/page.js` | `vars.linkPosts` |
| `src/social/page.js` | `vars.socialPosts` |
| `src/feeds.template.js` | Re-derives post data (because templates receive `vars` from `global.vars` only, not `global.data`) |
| `src/sitemap.xml.template.js` | Iterates `pages` directly for URL generation |

The fact that `feeds.template.js` must re-derive post filtering and sorting logic that already exists in `global.data.js` hints at a documentation gap -- users may not understand which vars are available where.

---

## Related issues

- **#01** -- Exporting `PageData` and `PageInfo` types would let the docs reference importable types and give users autocompletion for the properties documented here.
- **#03** -- Rendered content availability is a key caveat of `global.data.js`; that issue covers the `renderInnerPage()` API in detail.
- **#05** -- Template return types documentation should cross-reference global data, since templates receive `pages` and `vars` but with different merge semantics.
