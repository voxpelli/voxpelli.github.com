# Improve `PageData.vars` getter error messages and resilience

## Problem

The `.vars` getter on `PageData` can throw if the underlying `page.vars.js` module has errors (syntax errors, missing dependencies, runtime exceptions). When iterating all pages in `global.data.js`, one broken page crashes the entire build with an opaque error that doesn't identify which page failed.

## Reproduction

1. Create a page with a broken `page.vars.js`:
```js
// src/broken-page/page.vars.js
export default {
  title: undefinedVariable, // ReferenceError
};
```

2. Create a `global.data.js` that iterates pages:
```js
export default function ({ pages }) {
  const posts = pages.filter(p => p.vars.layout === 'article');
  // ^ Crashes with "undefinedVariable is not defined"
  // No indication that the error is in src/broken-page/page.vars.js
}
```

3. Run `domstack` — the error doesn't mention which page caused the failure.

## Current workaround

Users must wrap `.vars` access in try/catch and debug manually:

```js
export default function ({ pages }) {
  const posts = pages.filter(p => {
    try {
      return p.vars.layout === 'article';
    } catch (err) {
      console.error('Failed to read vars for', p.pageInfo.path, err);
      return false;
    }
  });
}
```

## Suggested fix

### Option A: Better error wrapping in the getter

```js
// In page-data.js
get vars() {
  try {
    return this._mergeVars();
  } catch (err) {
    throw new DomStackError(
      `Failed to resolve vars for page "${this.pageInfo.path}": ${err.message}`,
      { cause: err }
    );
  }
}
```

This preserves the original error as `.cause` while adding the page path for debugging.

### Option B: Lazy error collection

Instead of throwing, collect errors and return a partial result:

```js
get vars() {
  try {
    return this._mergeVars();
  } catch (err) {
    this._errors.push(new DomStackWarning(
      `Could not resolve vars for "${this.pageInfo.path}": ${err.message}`
    ));
    // Return what we can (global vars without page-specific vars)
    return { ...this.globalVars, ...this.globalDataVars };
  }
}
```

### Option C: Validate eagerly during init()

Check that `page.vars` resolves successfully during `PageData.init()` and surface errors early with clear messages, before `global.data.js` is called.

## Impact

This affects anyone with a large site where one page has a vars error. The current behavior makes it hard to identify which of potentially hundreds of pages is broken. Option A is the simplest improvement — just wrap with a better error message.
