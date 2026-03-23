# Improve `PageData.vars` getter error messages and resilience

`Labels: bug, dx, error-handling`

---

## Problem

The `.vars` getter on `PageData` can throw if the underlying page module has errors (syntax errors, missing dependencies, runtime exceptions during `init()`). When iterating all pages inside `global.data.js`, **one broken page crashes the entire build** with an opaque error that does not identify which page failed.

**Expected:** The error message tells you _which_ page caused the failure, _what_ went wrong, and _where_ in the resolution chain the error occurred (page vars, builder vars, or layout resolution).

**Actual:** You get a generic `"Error resolving page vars"` with a serialized `cause` object whose stack trace has been stripped by the worker thread boundary. In `global.data.js`, the error surfaces as an unhandled exception with no page path context at all.

---

## Current behavior

The `PageData.vars` getter in `page-data.js` performs a shallow merge of `globalVars`, `globalDataVars`, `pageVars`, and `builderVars` with no error boundary:

```js
// node_modules/@domstack/static/lib/build-pages/page-data.js (lines 139-149)
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

Meanwhile, `buildPagesDirect()` in `index.js` catches `init()` errors but wraps them in a way that loses fidelity across the worker boundary:

```js
// node_modules/@domstack/static/lib/build-pages/index.js (lines 215-224)
try {
  await pageData.init({ layouts: resolvedLayouts })
} catch (err) {
  if (!(err instanceof Error)) throw new Error('Non-error thrown while resolving vars', { cause: err })
  const variableResolveError = new Error('Error resolving page vars', {
    cause: { message: err.message, stack: err.stack }
  })
  // I can't put stuff on the error, the worker swallows it for some reason.
  result.errors.push({ error: variableResolveError, errorData: { page: pageInfo } })
}
```

The comment _"I can't put stuff on the error, the worker swallows it for some reason"_ confirms this is a known pain point.

When `global.data.js` iterates pages whose `init()` succeeded but whose vars modules throw at access time, the error has no page context whatsoever:

```js
// src/global.data.js (lines 11-17) — defensive try/catch that hides actual errors
const allPosts = pages
  .filter(p => {
    try {
      return p.vars && p.vars.layout === 'article' && p.vars.date;
    } catch {
      return false;  // Silently swallows which page failed and why
    }
  })
```

This defensive pattern exists because without it, one broken page would crash the entire `global.data.js` execution with no indication of which page is at fault.

---

## Reproduction

1. Introduce a runtime error in any page's vars resolution (e.g., reference an undefined variable in a markdown frontmatter callback, or break a dependency imported by a `page.js` module).

2. Run the build:

```bash
npm run build
# Error: Prebuild finished but there were errors
# (no mention of which page)
```

3. With many pages (this site has posts from 2008 through 2019 across `src/2008/`, `src/2009/`, ..., `src/2019/`, `src/social/`, `src/links/`, etc.), manually bisecting to find the broken page is extremely tedious.

---

## Workaround

Users must wrap every `.vars` access in try/catch and log the page path manually, exactly as `src/global.data.js` and `src/feeds.template.js` both do today:

```js
// src/global.data.js
const allPosts = pages
  .filter(p => {
    try {
      return p.vars && p.vars.layout === 'article' && p.vars.date;
    } catch {
      return false;
    }
  })
```

```js
// src/feeds.template.js (lines 22-28) — identical defensive pattern
const allPosts = pages
  .filter(p => {
    try {
      return p.vars && p.vars.layout === 'article' && p.vars.date;
    } catch {
      return false;
    }
  })
```

This has two problems: (1) it silently drops broken pages instead of surfacing the error, and (2) every consumer of `pages` must independently add the same boilerplate.

---

## Proposed solution

### Option A: Better error wrapping in the getter (recommended)

Wrap the vars getter so any access-time error includes the page path:

```js
// In page-data.js
get vars () {
  if (!this.#initialized) throw new Error('Initialize PageData before accessing vars')
  try {
    const { globalVars, globalDataVars, pageVars, builderVars } = this
    return {
      ...globalVars,
      ...globalDataVars,
      ...pageVars,
      ...builderVars,
    }
  } catch (err) {
    throw new Error(
      `Failed to resolve vars for page "${this.pageInfo.path}": ${err.message}`,
      { cause: err }
    )
  }
}
```

This preserves the original error as `.cause` while adding the page path for debugging. It is the smallest possible change and fully backward compatible.

### Option B: Add a `safeForeach` or `filterPages` helper on the pages array

Provide a utility that wraps iteration with error collection, so consumers do not need their own try/catch:

```js
// In global.data.js — proposed ergonomic API
export default function globalData ({ pages }) {
  const { matched: allPosts, errors } = pages.filterSafe(
    p => p.vars.layout === 'article' && p.vars.date
  );
  // errors: Array<{ page: PageData, error: Error }>
  if (errors.length) console.warn(`${errors.length} pages skipped due to errors`);
}
```

### Option C: Validate eagerly during `init()` and surface errors early

Check that `page.vars` resolves successfully during `PageData.init()` by doing a trial access. Surface errors early with clear messages _before_ `global.data.js` is called. This would turn a runtime error during iteration into a build-time error with full context during the init phase.

Additionally, improve the worker-boundary serialization so that `errorData.page` (which already contains `pageInfo`) is surfaced in the CLI output rather than lost.

---

## Alternatives considered

| Approach | Pros | Cons |
|---|---|---|
| **A: Wrap getter** | Minimal change, backward compatible | Only helps at access time, not init time |
| **B: `filterSafe` helper** | Ergonomic for consumers | New API surface; doesn't fix the root cause |
| **C: Eager validation** | Catches errors earliest | More invasive; may slow init for large sites |
| **Do nothing** | Zero risk | Every consumer writes defensive try/catch forever |

Option A is the highest-value, lowest-risk improvement. Options B and C could follow later.

---

## Real-world impact

This site has **6 template files** and pages spanning **12 years** of content across directories like `src/2008/` through `src/2019/`, plus `src/social/` and `src/links/`. Both `src/global.data.js` (72 lines of aggregation logic) and `src/feeds.template.js` (124 lines) already contain identical defensive try/catch wrappers around `.vars` access — code that exists solely because the framework does not provide useful error messages.

The homepage (`src/page.js`) and archive page (`src/archive/page.js`) both consume `globalDataVars` like `recentPosts` and `postsByYear`. If any page's vars resolution fails silently, these pages render with missing data and no warning.

---

## Related issues

- **#09 — Templates should receive `global.data` output in vars**: Templates currently re-iterate all pages (duplicating try/catch boilerplate) because they do not receive `globalDataVars`. If templates received aggregated data, they would not need to access `.vars` on individual pages at all, reducing the blast radius of this bug.
- **#08 — Programmatic API for testing**: Better error messages from the `build()` API would make test failures actionable. Currently the `DomStackAggregateError` loses page context across the worker boundary.
