# Export `PageData`, `PageInfo`, and param types from package entry point

## Problem

The main `@domstack/static` package exports function types (`LayoutFunction`, `TemplateFunction`, `GlobalDataFunction`, `PageFunction`, etc.) but does **not** export `PageData`, `PageInfo`, or the various `*Params` types.

Users writing `global.data.js`, layouts, templates, or page functions need to type their parameters but can't import these types from the package. They exist internally in `lib/build-pages/page-data.d.ts` and `lib/identify-pages.d.ts`, but aren't re-exported from `index.d.ts`.

## Current workaround

Users must write verbose inline JSDoc types that are fragile and incomplete:

```js
/**
 * @param {{ pages: Array<{ pageInfo: { path: string, outputRelname: string }, vars: Record<string, unknown> }> }} options
 */
export default function globalData ({ pages }) {
  // ...
}
```

This misses many properties and provides no IDE autocompletion for `pageInfo` fields like `.type`, `.draft`, `.outputName`, etc.

## Suggested fix

Add these re-exports to `index.d.ts` (or `index.js` with JSDoc):

```typescript
// Types for the objects users interact with
export type { PageData } from './lib/build-pages/page-data.js';
export type { PageInfo, TemplateInfo } from './lib/identify-pages.js';

// Param types for user-authored functions
export type { GlobalDataFunctionParams } from './lib/build-pages/index.js';
export type { LayoutFunctionParams } from './lib/build-pages/page-data.js';
export type { PageFunctionParams } from './lib/build-pages/page-builders/page-writer.js';
export type { TemplateFunctionParams } from './lib/build-pages/page-builders/template-builder.js';
```

This would let users write:

```js
/** @type {import('@domstack/static').GlobalDataFunction} */
export default function globalData ({ pages }) {
  // pages[0].pageInfo.path — autocompletes!
  // pages[0].vars — autocompletes!
}
```

Or for TypeScript users:

```ts
import type { GlobalDataFunction, PageData } from '@domstack/static';

const globalData: GlobalDataFunction = ({ pages }) => {
  const post: PageData = pages[0];
  // Full type safety
};
export default globalData;
```

## Impact

Every DomStack user writing custom layouts, templates, global.data, or page functions benefits. These are the most common customization points and they all receive `PageData` objects.

Currently the `LayoutFunction` and `TemplateFunction` types *are* exported, but the objects they receive (`PageData`, `PageInfo`) are not — making the exported function types less useful since you can't drill into the param types.
