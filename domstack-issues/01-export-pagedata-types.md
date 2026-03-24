# Export `PageData`, `PageInfo`, and param types from package entry point

`Labels: enhancement, types, dx`

---

## Problem

The main `@domstack/static` package exports function types (`LayoutFunction`, `TemplateFunction`, `GlobalDataFunction`, `PageFunction`, etc.) but does **not** export the data types those functions receive: `PageData`, `PageInfo`, `TemplateInfo`, or any of the `*Params` types.

Every user-authored customization point in DomStack -- layouts, templates, `global.data.js`, page functions -- receives `PageData` objects. The function types are exported, but the objects they operate on are not, leaving a critical gap in the type surface. Users who want full type safety and IDE autocompletion for params, properties, and nested objects like `pageInfo` have no first-class path to get it.

---

## Current behavior

The entry point at `index.d.ts` re-exports only function types and the `DomStack` class:

```typescript
// What @domstack/static currently exports (from index.d.ts):
export class DomStack<CurrentOpts extends DomStackOpts = DomStackOpts> { /* ... */ }
export type LayoutFunction<Vars, PageReturn, LayoutReturn> = /* ... */;
export type AsyncLayoutFunction<Vars, PageReturn, LayoutReturn> = /* ... */;
export type GlobalDataFunction<T> = /* ... */;
export type AsyncGlobalDataFunction<T> = /* ... */;
export type PageFunction<Vars, PageReturn> = /* ... */;
export type AsyncPageFunction<Vars, PageReturn> = /* ... */;
export type TemplateFunction<Vars> = /* ... */;
export type TemplateAsyncIterator<Vars> = /* ... */;
export type TemplateOutputOverride = /* ... */;

// NOT exported:
//   PageData       (lib/build-pages/page-data.d.ts)
//   PageInfo       (lib/identify-pages.d.ts)
//   TemplateInfo   (lib/identify-pages.d.ts)
//   LayoutFunctionParams    (lib/build-pages/page-data.d.ts)
//   GlobalDataFunctionParams (lib/build-pages/index.d.ts)
//   PageFunctionParams       (lib/build-pages/page-builders/page-writer.d.ts)
//   TemplateFunctionParams   (lib/build-pages/page-builders/template-builder.d.ts)
```

---

## Expected behavior

All types that appear in user-authored function signatures should be importable from the package entry point, so users get full autocompletion and type checking without reaching into internal paths.

---

## Workaround

Users must write verbose, fragile, hand-rolled JSDoc types. This is exactly what the real `global.data.js` in this codebase does today:

```js
// src/global.data.js (actual code from this site)
/**
 * @param {{ pages: Array<{ pageInfo: { path: string, outputRelname: string }, vars: Record<string, unknown> }> }} options
 * @returns {Record<string, unknown>}
 */
export default function globalData ({ pages }) {
  // ...
}
```

This inline type annotation is incomplete -- it misses `pageInfo.type`, `pageInfo.draft`, `pageInfo.outputName`, `pageInfo.pageFile`, `pageInfo.pageStyle`, `pageInfo.clientBundle`, `pageInfo.workers`, and more. It also provides no autocompletion for the `vars` getter's merged output. The same problem repeats in every other customization point:

<details>
<summary>More examples of fragile inline types across this codebase</summary>

```js
// src/feeds.template.js
/**
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string },
 *   vars: Record<string, unknown>,
 *   renderInnerPage: (opts: { pages: unknown[] }) => Promise<string> }> }} options
 */
export default async function * feedsTemplate ({ pages, vars }) { /* ... */ }
```

```js
// src/sitemap.xml.template.js
/**
 * @param {{ vars: Record<string, unknown>,
 *   pages: Array<{ pageInfo: { path: string, outputRelname: string } }> }} options
 */
export default function sitemapTemplate ({ pages, vars }) { /* ... */ }
```

```js
// src/root.layout.js
/**
 * @param {{ children: string, vars: Record<string, unknown>,
 *   scripts?: string[], styles?: string[] }} options
 */
export default function rootLayout ({ children, scripts = [], styles = [], vars }) { /* ... */ }
```

Each of these duplicates a partial, inconsistent slice of the actual types defined inside the package.

</details>

---

## Proposed solution

Add re-exports to `index.d.ts` (or the corresponding `index.js` with JSDoc):

```typescript
// Data types users interact with
export type { PageData } from './lib/build-pages/page-data.js';
export type { PageInfo, TemplateInfo } from './lib/identify-pages.js';

// Param types for user-authored functions
export type { GlobalDataFunctionParams } from './lib/build-pages/index.js';
export type { LayoutFunctionParams } from './lib/build-pages/page-data.js';
export type { PageFunctionParams } from './lib/build-pages/page-builders/page-writer.js';
export type { TemplateFunctionParams } from './lib/build-pages/page-builders/template-builder.js';
```

This unlocks clean, complete typing for every customization point:

**For JSDoc users (the common case):**

```js
/** @type {import('@domstack/static').GlobalDataFunction} */
export default function globalData ({ pages }) {
  // pages[0].pageInfo.path  -- autocompletes with all PageInfo properties
  // pages[0].pageInfo.type  -- "js" | "md" | "html"
  // pages[0].pageInfo.draft -- boolean
  // pages[0].vars           -- fully typed merged vars
  // pages[0].renderInnerPage({ pages }) -- discovered via autocomplete
}
```

**For TypeScript users:**

```ts
import type { GlobalDataFunction, PageData, PageInfo } from '@domstack/static';

const globalData: GlobalDataFunction = ({ pages }) => {
  const post: PageData<Record<string, any>> = pages[0];
  const info: PageInfo = post.pageInfo;
  // Full type safety and autocompletion
  return { posts: pages.map(p => p.vars.title) };
};
export default globalData;
```

**Typing a layout with full params:**

```ts
import type { LayoutFunctionParams } from '@domstack/static';

export default function rootLayout ({
  children, vars, scripts, styles, page, pages, workers
}: LayoutFunctionParams<Record<string, any>>) {
  // Every param fully typed
  return `<!DOCTYPE html>...`;
}
```

---

## Alternatives considered

| Approach | Pros | Cons |
|----------|------|------|
| **Re-export from index (proposed)** | Zero breaking changes, immediate DX win | Slightly larger public API surface |
| **Document deep import paths** | No code changes | Fragile -- internal paths may change between versions |
| **Generate a standalone `.d.ts` barrel** | Clean separation | Extra build step, maintenance overhead |

Re-exporting is the standard approach used by most typed packages and carries no runtime cost since these are type-only exports.

---

## Real-world impact

This codebase (`voxpelli.github.com`) has **10 files** that would benefit immediately:

| File | Receives | Currently typed as |
|------|----------|--------------------|
| `src/global.data.js` | `{ pages: PageData[] }` | Partial inline JSDoc |
| `src/feeds.template.js` | `{ vars, pages: PageData[] }` | Partial inline JSDoc |
| `src/sitemap.xml.template.js` | `{ vars, pages }` | Partial inline JSDoc |
| `src/root.layout.js` | `{ children, vars, scripts, styles }` | Partial inline JSDoc |
| `src/article.layout.js` | `{ children, vars, scripts, styles }` | Partial inline JSDoc |
| `src/page.js` | `{ vars }` | Partial inline JSDoc |
| `src/archive/page.js` | `{ vars }` | Partial inline JSDoc |
| `src/links/page.js` | `{ vars }` | Partial inline JSDoc |
| `src/social/page.js` | `{ vars }` | Partial inline JSDoc |
| `src/redirects.template.js` | `(no params used)` | N/A |

Every DomStack user writing custom layouts, templates, `global.data.js`, or page functions benefits. These are the most common customization points.

---

## Related issues

- **#02** -- Documenting `global.data.js` also requires users to understand `PageData` properties; exported types would make the docs linkable to real type definitions.
- **#05** -- Documenting template return types references `TemplateOutputOverride` and `TemplateFunctionParams`, both of which should be importable.
- **#06** -- Layout composition patterns need `LayoutFunctionParams` to show how to properly forward `scripts`, `styles`, `page`, `pages`, and `workers`.

---

## External Research

*Researched 2026-03-24 against `@domstack/static@11.0.3`.*

### Verified: current exports vs. missing types

**`index.d.ts` exports exactly 9 function/class types** (confirmed by reading the installed package):

- `DomStack` (class)
- `LayoutFunction`, `AsyncLayoutFunction`
- `GlobalDataFunction`, `AsyncGlobalDataFunction`
- `PageFunction`, `AsyncPageFunction`
- `TemplateFunction`, `TemplateAsyncIterator`
- `TemplateOutputOverride`
- `BuildOptions` (re-exported from esbuild)

**Not exported from entry point** (confirmed -- these exist in internal `.d.ts` files but are not re-exported):

| Type | Defined in | Notes |
|------|-----------|-------|
| `PageData` (class) | `lib/build-pages/page-data.d.ts` | Generic class with `<T, U, V>` params; has `vars` getter, `pageInfo`, `renderInnerPage()`, `renderFullPage()` |
| `PageInfo` | `lib/identify-pages.d.ts` | Object type with `pageFile`, `type` (`"js" \| "md" \| "html"`), `path`, `outputName`, `outputRelname`, `draft`, `pageStyle?`, `clientBundle?`, `pageVars?`, `workers?` |
| `TemplateInfo` | `lib/identify-pages.d.ts` | Object type with `templateFile`, `path`, `outputName` |
| `LayoutFunctionParams` | `lib/build-pages/page-data.d.ts` | `{ vars, scripts?, styles?, children, page, pages, workers? }` |
| `GlobalDataFunctionParams` | `lib/build-pages/index.d.ts` | `{ pages: PageData<any, any, any>[] }` |
| `PageFunctionParams` | `lib/build-pages/page-builders/page-writer.d.ts` | `{ vars, scripts?, styles?, page, pages, workers? }` |
| `TemplateFunctionParams` | `lib/build-pages/page-builders/template-builder.d.ts` | Extracted from `Parameters<TemplateFunction<T>>` -- resolves to `{ vars, template, pages }` |

### `index.js` imports but does not re-export

The `index.js` entry point uses `@import` JSDoc to bring in `PageInfo`, `TemplateInfo`, and other internal types (line 12: `@import { PageInfo, TemplateInfo } from './lib/identify-pages.js'`), but these are only used internally for the `DomStack` class implementation -- they are not re-exported via `@typedef`.

### DeepWiki findings

DeepWiki confirms that `PageData`, `PageInfo`, and `TemplateInfo` are "not directly exported from the package entry point for external use." The README lists only the function types (`LayoutFunction`, `PageFunction`, etc.) as importable from `@domstack/static`. DeepWiki notes that `PageData` is "a class used internally" and `PageInfo`/`TemplateInfo` are "internal typedefs."

### Upstream issues and PRs

- **No existing issues found** on `bcomnes/domstack` related to type exports, `PageData`, or `PageInfo`. (DeepWiki cannot access the issue tracker; GitHub search was unavailable during research. The `top-bun` repository -- the predecessor -- is not indexed on DeepWiki.)
- This appears to be a novel request with no prior upstream discussion.

### Raindrop and Basic Memory

- **Raindrop**: No bookmarks related to domstack types or DX found in the 13k+ library.
- **Basic Memory**: An `npm:@domstack/static` note exists but does not cover type export gaps. No prior research on this topic.
