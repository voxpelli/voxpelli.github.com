# Templates should receive global.data output in vars, not just global.vars

## Problem

Templates receive `{ vars, pages, template }` where `vars` only contains the output from `global.vars.js` — NOT the aggregated data from `global.data.js`. This forces templates to duplicate the filtering/sorting logic that `global.data.js` already performs.

## Reproduction

```js
// src/global.data.js — aggregates all posts
export default function ({ pages }) {
  const recentPosts = pages.filter(...).sort(...).slice(0, 10);
  return { recentPosts };
}

// src/feeds.template.js — can't access recentPosts!
export default function ({ vars, pages }) {
  // vars.recentPosts is undefined — global.data output not included
  // Must re-filter and re-sort pages from scratch
  const recentPosts = pages.filter(...).sort(...).slice(0, 10);
}
```

## Current workaround

Templates duplicate the entire filtering/sorting logic from `global.data.js`. In our case, `feeds.template.js` has 25 lines of code identical to `global.data.js` for extracting and categorizing posts.

## Suggested fix

Merge `globalDataVars` into the `globalVars` object passed to `templateBuilder`:

```js
// In lib/build-pages/index.js, around line 276:
const buildResult = await templateBuilder({
  src,
  dest,
  globalVars: { ...globalVars, ...globalDataVars },  // Include global.data output
  template,
  pages,
});
```

This would make template `vars` include both `global.vars.js` output AND `global.data.js` output, matching how page vars work.

## Impact

Every DomStack site with both `global.data.js` and templates (feeds, sitemaps) hits this. It's the most common template use case — generating feeds from aggregated post data.
