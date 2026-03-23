# Programmatic API needs better support for testing / dry-run builds

## Problem

The `DomStack` class provides a programmatic `build()` method, but it's difficult to use for testing because:

1. **`--copy` paths must be absolute** — The CLI does `resolve(cwd, p)` but the constructor doesn't. Passing relative paths silently fails or produces unexpected results.

2. **Build errors are opaque** — `build()` throws "Prebuild finished but there were errors" without details about which page or template failed. The error object has an `errors` array but each error's `cause` is serialized (for worker thread compatibility), losing stack trace quality.

3. **No built-in temp directory support** — Testing requires manually creating temp dirs, building to them, and cleaning up. A `build({ dryRun: true })` or `build({ dest: 'auto-temp' })` would simplify testing.

## Current workaround

Run the CLI via `npm run build` as a test prerequisite, then verify `public/` output with file system assertions. This works but means tests depend on a pre-existing build and can't run in isolation.

## Suggested improvements

### Option A: Document the programmatic API for testing

Add a "Testing" section to the README showing the pattern:

```js
import { DomStack } from '@domstack/static';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dest = await mkdtemp(path.join(tmpdir(), 'test-'));
const ds = new DomStack('src', dest, {
  copy: [path.resolve('images'), path.resolve('media')],  // Must be absolute!
});
await ds.build();
// ... verify output ...
await rm(dest, { recursive: true, force: true });
```

### Option B: Add a test helper

```js
import { testBuild } from '@domstack/static/test';

const { dest, cleanup } = await testBuild('src', {
  copy: ['images', 'media'],  // Resolves relative to cwd automatically
});
// ... verify output ...
await cleanup();
```

### Option C: Improve error reporting

Make build errors include the page path and a readable stack trace:

```
Error: Failed to build page "2015/01/my-post"
  Cause: Cannot read properties of undefined (reading 'title')
    at renderPostContent (src/lib/render-post-content.js:30:15)
```

## Impact

Every DomStack project that wants to add build verification tests hits this. The blog example doesn't include tests, so there's no reference implementation for testing.
