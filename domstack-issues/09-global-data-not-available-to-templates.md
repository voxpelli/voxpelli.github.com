# Templates should receive `global.data.js` output in vars, not just `global.vars.js`

`Labels: bug, enhancement, templates`

---

## Problem

Templates receive `{ vars, pages, template }` where `vars` contains **only** the output from `global.vars.js`. The aggregated data computed by `global.data.js` is **not** included. This forces every template to re-implement the same filtering, sorting, and categorization logic that `global.data.js` already performs.

**Expected:** Template `vars` includes both `global.vars.js` output and `global.data.js` output, matching how page `vars` work (where `globalDataVars` are merged in via `PageData.vars`).

**Actual:** Template `vars` is set to the bare `globalVars` object, which only contains the static key-value pairs from `global.vars.js`. The `globalDataVars` computed by `global.data.js` are stamped onto `PageData` instances but never passed to the template builder.

---

## Current behavior

### How pages get `globalDataVars` (works correctly)

In `buildPagesDirect()`, after `global.data.js` runs, its output is stamped onto every `PageData` instance:

```js
// node_modules/@domstack/static/lib/build-pages/index.js (lines 229-239)
const globalDataVars = await resolveGlobalData({
  globalDataPath: siteData.globalData?.filepath,
  pages,
})

if (Object.keys(globalDataVars).length > 0) {
  for (const page of pages) {
    page.globalDataVars = globalDataVars
  }
}
```

And when pages access `this.vars`, the getter merges everything:

```js
// node_modules/@domstack/static/lib/build-pages/page-data.js (lines 139-149)
get vars () {
  // ...
  return {
    ...globalVars,
    ...globalDataVars,  // <-- includes global.data.js output
    ...pageVars,
    ...builderVars,
  }
}
```

So a page like `src/page.js` (the homepage) can access `pageVars.recentPosts` directly:

```js
// src/page.js (lines 15-16)
export default function homePage ({ vars: pageVars }) {
  const recentPosts = pageVars.recentPosts || [];
```

### How templates do NOT get `globalDataVars` (the bug)

The template builder receives only `globalVars`, not the merged `globalVars + globalDataVars`:

```js
// node_modules/@domstack/static/lib/build-pages/index.js (lines 274-282)
pMap(templatesToRender, async (template) => {
  try {
    const buildResult = await templateBuilder({
      src,
      dest,
      globalVars,          // <-- bare globalVars, no globalDataVars merged
      template,
      pages,
    })
```

Inside the template builder, this becomes the `vars` parameter:

```js
// node_modules/@domstack/static/lib/build-pages/page-builders/template-builder.js (lines 73-77)
const finalVars = {
  vars: globalVars,    // <-- only global.vars.js output
  pages,
  template,
}

const templateResults = await renderTemplate(finalVars)
```

The `TemplateFunction` type signature confirms this:

```ts
// template-builder.d.ts
callback TemplateFunction
  @param {object} params
  @param {T} params.vars - All of the site globalVars.   // <-- "globalVars" only
  @param {TemplateInfo} params.template
  @param {PageData<T, any, string>[]} params.pages
```

---

## Reproduction

```js
// src/global.data.js — computes recentPosts, blogPosts, postsByYear, etc.
export default function globalData ({ pages }) {
  const allPosts = pages.filter(p => { /* ... */ }).sort(/* ... */);
  const recentPosts = allPosts.slice(0, 10);
  return { allPosts, recentPosts, /* ... */ };
}

// src/feeds.template.js — CANNOT access recentPosts from vars
export default async function * feedsTemplate ({ pages, vars }) {
  // vars.recentPosts === undefined
  // vars.allPosts === undefined
  // Must re-derive everything from pages[]
}
```

---

## Workaround

Every template must duplicate the entire filtering, sorting, and categorization pipeline from `global.data.js`. In this project, `src/feeds.template.js` (124 lines) contains a near-identical copy of the logic in `src/global.data.js` (72 lines):

<details>
<summary><strong>Side-by-side: duplicated logic in <code>global.data.js</code> vs <code>feeds.template.js</code></strong></summary>

**`src/global.data.js` (lines 10-47):**
```js
const allPosts = pages
  .filter(p => {
    try {
      return p.vars && p.vars.layout === 'article' && p.vars.date;
    } catch {
      return false;
    }
  })
  .map(p => {
    const vars = p.vars;
    const pagePath = p.pageInfo.path;
    const pageUrl = pagePath ? '/' + pagePath + '/' : '/';
    return {
      title: vars.title || '',
      date: vars.date,
      lang: vars.lang,
      category: vars.category,
      // ...
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const blogPosts = allPosts.filter(p => !p.category);
const recentPosts = blogPosts.slice(0, 10);
const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
const recentLinks = allPosts.filter(p => p.category === 'links').slice(0, 10);
```

**`src/feeds.template.js` (lines 21-47):**
```js
const allPosts = pages
  .filter(p => {
    try {
      return p.vars && p.vars.layout === 'article' && p.vars.date;
    } catch {
      return false;
    }
  })
  .map(p => {
    const pageVars = p.vars;
    const pagePath = p.pageInfo.path;
    const pageUrl = pagePath ? '/' + pagePath + '/' : '/';
    return {
      title: pageVars.title || '',
      date: pageVars.date,
      lang: pageVars.lang,
      category: pageVars.category,
      // ...
    };
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const blogPosts = allPosts.filter(p => !p.category);
const recentPosts = blogPosts.slice(0, 10);
const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
const recentLinks = allPosts.filter(p => p.category === 'links').slice(0, 10);
```

</details>

These two blocks are functionally identical. Any change to post categorization logic must be made in both places, which is error-prone and violates DRY.

---

## Proposed solution

Merge `globalDataVars` into the `globalVars` object passed to `templateBuilder`. The fix is a one-line change in `buildPagesDirect()`:

```js
// In node_modules/@domstack/static/lib/build-pages/index.js, around line 276:
const buildResult = await templateBuilder({
  src,
  dest,
  globalVars: { ...globalVars, ...globalDataVars },  // Include global.data output
  template,
  pages,
});
```

This makes template `vars` include both `global.vars.js` output and `global.data.js` output, which is consistent with how page `vars` already work via the `PageData.vars` getter.

After this fix, `src/feeds.template.js` could be simplified to:

```js
export default async function * feedsTemplate ({ pages, vars }) {
  const siteUrl = vars.siteUrl;
  const blogName = vars.blogName;
  // ...

  // These are now available directly from vars, computed by global.data.js:
  const recentPosts = vars.recentPosts;
  const recentEnglishPosts = vars.recentEnglishPosts;
  const recentLinks = vars.recentLinks;

  // No more re-filtering, re-sorting, or re-categorizing!
  // ...
}
```

---

## Alternatives considered

| Approach | Pros | Cons |
|---|---|---|
| **Merge `globalDataVars` into template `vars`** | One-line fix, consistent with pages | Could cause namespace collisions if `global.data.js` keys overlap with `global.vars.js` keys |
| **Pass `globalDataVars` as a separate `data` param** | No collision risk, explicit | New API surface; every template signature changes |
| **Document the workaround pattern** | Zero code change | Perpetuates code duplication in every project |
| **Allow templates to import `global.data.js` directly** | No framework change needed | Templates would need to re-run the function, losing the memoized result |

The first approach (merge into `vars`) is recommended because it matches the existing page behavior exactly. The `PageData.vars` getter already merges `globalDataVars` with `globalVars` — templates should behave the same way.

Namespace collision risk is minimal: `global.vars.js` typically exports static configuration (`siteUrl`, `blogName`, etc.) while `global.data.js` exports computed aggregates (`allPosts`, `recentPosts`, etc.). If a collision does occur, `global.data.js` should win (matching the page vars merge order where `globalDataVars` overrides `globalVars`).

---

## Real-world impact

This project has **5 template files**:

| Template | Needs `globalDataVars`? | Currently duplicates logic? |
|---|---|---|
| `src/feeds.template.js` | Yes — needs `recentPosts`, `recentEnglishPosts`, `recentLinks` | Yes — 25+ lines duplicated from `global.data.js` |
| `src/sitemap.xml.template.js` | No — only uses `vars.siteUrl` and `pages` | No |
| `src/redirects.template.js` | No — hardcoded redirect list | No |
| `src/manifest.json.template.js` | No — static content | No |
| `src/robots.txt.template.js` | No — static content | No |

The feeds template is the critical case. It generates 3 Atom feeds (`all.xml`, `english.xml`, `links/all.xml`) and currently contains a full copy of the post aggregation pipeline. With this fix, ~30 lines of duplicated code could be removed.

Additionally, any future template that needs aggregated data (e.g., a JSON feed, an archive page generated via template, a tag index) would benefit immediately.

---

## Related issues

- **#07 — Improve `PageData.vars` getter error messages**: The duplicated try/catch wrappers in `feeds.template.js` exist partly because templates must iterate `pages` themselves. If templates received pre-aggregated data, they would not need to access individual page `.vars` at all.
- **#08 — Programmatic API for testing**: Template build errors go through the same worker-boundary serialization. Fixing the template vars issue reduces the surface area where errors can occur during template rendering.

---

## External Research

### DeepWiki confirmation
DeepWiki explicitly states: "Templates receive the `vars` object, which contains variables from `global.vars.ts`." It also confirms templates receive an array of `PageData` instances. There is **no mention** of `global.data.js` output being available in template `vars` — confirming this issue's core claim.

### Workaround pattern used in this codebase
`src/feeds.template.js` works around this by re-deriving all post data from the `pages` array — duplicating the filtering/sorting logic from `global.data.js`. This is the only viable pattern currently, but it leads to logic duplication and inconsistency risk.

### GitHub issues
No existing upstream issues specifically about template vars scope. This appears to be an undocumented architectural decision rather than a known bug.
