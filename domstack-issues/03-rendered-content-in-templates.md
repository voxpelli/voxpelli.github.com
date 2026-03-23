# Provide rendered HTML content in global.data.js

## Status: PARTIALLY RESOLVED

Templates CAN access rendered HTML via `page.renderInnerPage({ pages })` — this works and we use it successfully in our Atom feeds. However, `global.data.js` still cannot access rendered content.

## Working pattern (templates)

```js
// In feeds.template.js — this WORKS:
const page = pagesByPath.get(post.path);
const html = page ? await page.renderInnerPage({ pages }) : '';
```

## Remaining problem (global.data.js)

In `global.data.js`, there's no way to get rendered HTML. The `renderInnerPage()` method may not be available at the global.data.js execution stage (it runs before page rendering).

This means pages that need to display rendered content from other posts (archives, tag pages, search indexes) can't get it without workarounds.

## Suggested improvement

Document `renderInnerPage()` as the official API for getting rendered content in templates. For `global.data.js`, consider either:
1. Making `renderInnerPage()` available during global data aggregation
2. Adding a `page.renderedContent` property that's lazily computed
3. Documenting that rendered content should be accessed in templates, not global.data
