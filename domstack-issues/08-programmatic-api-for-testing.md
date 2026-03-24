# Programmatic API needs better support for testing and dry-run builds

`Labels: enhancement, dx, testing`

---

## Problem

The `DomStack` class exports a programmatic `build()` method, but it is difficult to use for **isolated, repeatable tests** because of three compounding issues:

1. **`--copy` paths must be absolute** — The CLI resolves paths with `resolve(cwd, p)`, but the `DomStack` constructor does not. Passing relative paths like `'images'` silently fails or produces unexpected copy behavior. The constructor stores them as-is and later calls `resolve(copyDir)` without a base, which resolves relative to the _process_ cwd rather than the project root.

2. **Build errors are opaque across the worker boundary** — `build()` throws a `DomStackAggregateError` with `"Prebuild finished but there were errors"` but each inner error's `cause` is serialized to a plain object (for structured-clone compatibility with the worker thread), losing the original stack trace and error class identity. The `errorData` property containing the page path is attached to the error object but not printed by the default formatter.

3. **No built-in temp directory or dry-run support** — Testing requires manually creating temp directories, building into them, asserting on the output, and cleaning up. There is no `build({ dryRun: true })` or `build({ dest: 'auto-temp' })` convenience.

**Expected:** A first-class testing story where you can spin up a build in an isolated temp directory, get actionable error messages on failure, and clean up afterward — all without depending on the CLI or a pre-existing build artifact.

**Actual:** The only documented test pattern is running the full CLI as a build prerequisite and then asserting on the `public/` output directory.

---

## Current behavior

### The constructor does not resolve `copy` paths

```js
// node_modules/@domstack/static/index.js (lines 155-173)
constructor (src, dest, opts = {}) {
  // ...
  this.#src = src
  this.#dest = dest

  const copyDirs = opts?.copy ?? []

  this.opts = {
    ...opts,
    ignore: [
      ...DEFAULT_IGNORES,
      basename(dest),
      ...copyDirs.map(dir => basename(dir)),  // Only uses basename, not resolve
      ...makeArray(opts.ignore),
    ],
  }
  // ...
}
```

The CLI resolves paths before passing them to the constructor, but programmatic users must know to do this themselves.

### Error serialization loses fidelity

```js
// node_modules/@domstack/static/lib/build-pages/index.js (lines 218-223)
const variableResolveError = new Error('Error resolving page vars', {
  cause: { message: err.message, stack: err.stack }
})
// I can't put stuff on the error, the worker swallows it for some reason.
result.errors.push({ error: variableResolveError, errorData: { page: pageInfo } })
```

The `cause` becomes a plain `{ message, stack }` object instead of an `Error` instance. When the `DomStackAggregateError` is thrown to the caller, `error.cause.stack` is a string that no longer connects to the original throw site.

### This site's test suite depends on a pre-existing build

```js
// test/smoke.spec.js (lines 1-6)
/**
 * Smoke tests that verify the build output in public/.
 * Run after `npm run build` — the test script runs build first.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
```

The `package.json` confirms the dependency chain:

```json
"test:build": "node --test 'test/**/*.spec.js'",
"test": "run-s check build test:build"
```

Tests cannot run in isolation — they require `npm run build` to have completed first, writing output to `public/`. This means tests are slow (full rebuild), stateful (depend on `public/` from a prior step), and cannot run in parallel.

---

## Reproduction

Attempt to use the programmatic API for an isolated test:

```js
import { DomStack } from '@domstack/static';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('homepage renders correctly', async () => {
  const dest = await mkdtemp(path.join(tmpdir(), 'domstack-test-'));
  try {
    const ds = new DomStack('src', dest, {
      copy: ['images', 'media'],  // BUG: relative paths not resolved
    });
    await ds.build();
    // If a page has a vars error, this throws:
    //   DomStackAggregateError: Prebuild finished but there were errors
    //   (no indication which page, no usable stack trace)

    const html = await readFile(path.join(dest, 'index.html'), 'utf8');
    assert.match(html, /h-feed/);
  } finally {
    await rm(dest, { recursive: true, force: true });
  }
});
```

Issues encountered:
- `copy: ['images', 'media']` silently fails because paths are not resolved to absolute.
- On build failure, the error message is `"Prebuild finished but there were errors"` with no page-level detail.
- Every test must duplicate the mkdtemp/rm boilerplate.

---

## Workaround

Run the CLI as a prerequisite step and assert on the `public/` directory, as this project does today:

```json
"test": "run-s check build test:build"
```

```js
// test/smoke.spec.js
test('homepage has h-feed and DomStack assets', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.match(html, /h-feed/);
  assert.match(html, /global-[A-Z0-9]+\.css/i);
  assert.match(html, /global\.client-[A-Z0-9]+\.js/i);
});
```

This works but means: tests depend on a pre-existing build, cannot run in isolation, and build errors are only visible in the CLI output (not programmatically inspectable).

---

## Proposed solution

### 1. Resolve `copy` paths in the constructor (bug fix)

The constructor should resolve relative `copy` paths against the project root (the directory containing `src`), matching what the CLI does:

```js
constructor (src, dest, opts = {}) {
  // ...
  const basedir = dirname(resolve(src))
  const copyDirs = (opts?.copy ?? []).map(dir => resolve(basedir, dir))
  // ...
}
```

### 2. Improve error reporting across the worker boundary

Re-hydrate the serialized `cause` into a proper `Error` object with the page path included in the message:

```js
// In buildPages() where worker results are processed (index.js lines 118-127)
buildReport.errors = workerReport.errors.map(({ error, errorData = {} }) => {
  const pagePath = errorData.page?.path || errorData.template?.path || 'unknown';
  const richError = new Error(
    `${error.message} (page: "${pagePath}")`,
    { cause: error.cause }
  );
  // Attach structured data for programmatic consumers
  richError.pageInfo = errorData.page;
  richError.templateInfo = errorData.template;
  return richError;
});
```

### 3. Add a test helper module

Export a lightweight test helper from `@domstack/static/test` (or `@domstack/static/testing`):

```js
// @domstack/static/test
import { DomStack } from '@domstack/static';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

/**
 * Run a DomStack build into an isolated temp directory.
 * @param {string} src - Source directory (resolved relative to cwd)
 * @param {import('@domstack/static').DomStackOpts} [opts]
 * @returns {Promise<{ dest: string, results: Results, readOutput: (path: string) => Promise<string>, cleanup: () => Promise<void> }>}
 */
export async function testBuild(src, opts = {}) {
  const dest = await mkdtemp(join(tmpdir(), 'domstack-test-'));
  const ds = new DomStack(resolve(src), dest, {
    ...opts,
    copy: (opts.copy ?? []).map(p => resolve(p)),
  });
  const results = await ds.build();
  return {
    dest,
    results,
    readOutput: (path) => readFile(join(dest, path), 'utf8'),
    cleanup: () => rm(dest, { recursive: true, force: true }),
  };
}
```

Usage in a test file:

```js
import { testBuild } from '@domstack/static/test';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('homepage renders with h-feed', async () => {
  const { readOutput, cleanup } = await testBuild('src', {
    copy: ['images', 'media'],
  });
  try {
    const html = await readOutput('index.html');
    assert.match(html, /h-feed/);
  } finally {
    await cleanup();
  }
});
```

---

## Alternatives considered

| Approach | Pros | Cons |
|---|---|---|
| **Document the manual pattern** | Zero framework changes | Every project reinvents the same boilerplate |
| **Test helper module** | Ergonomic, handles temp dirs and path resolution | New public API surface to maintain |
| **`build({ dryRun: true })` returning virtual FS** | Most powerful for assertions | Large implementation effort; unclear demand |
| **Fix copy path resolution only** | Smallest change | Does not address error quality or boilerplate |

The recommended path is: fix copy path resolution (item 1) and improve error reporting (item 2) as bug fixes, then ship the test helper (item 3) as an enhancement.

---

## Real-world impact

This project's test suite (`test/smoke.spec.js`) contains 7 smoke tests that all read from `public/` after a full CLI build. The test script in `package.json` enforces the order with `run-s check build test:build`. This means:

- **No isolated test runs** — you cannot run `node --test test/smoke.spec.js` without first running `npm run build`.
- **Full rebuild on every test cycle** — even if you only changed one test assertion, you pay for a complete site build.
- **No CI-friendly parallelism** — tests that share mutable state (`public/`) cannot run concurrently.
- **The `sw.js` copy step is a manual shell command** — `"build": "domstack --copy images --copy media && cp sw.js public/sw.js"` — which would need to be replicated in any programmatic test setup.

A test helper with proper path resolution would let this project (and every DomStack project) write isolated, fast, parallelizable build verification tests.

---

## Related issues

- **#07 — Improve `PageData.vars` getter error messages**: The opaque error reporting described here is the same root cause. Better error wrapping in the vars getter would directly improve the programmatic API experience.
- **#10 — Service worker management**: The `sw.js` file requires a manual `cp` command because `--copy` only handles directories. A test helper would need to account for this workaround too.
- **#09 — Templates should receive `global.data` output**: Template build errors are also serialized through the worker boundary with the same fidelity loss.

---

## External Research

### DeepWiki findings (bcomnes/domstack)

The `DomStack` class constructor accepts `(src, dest, opts)` where `opts` includes `copy` (array of directory paths), `ignore` (array of ignore patterns), and other options. The constructor stores `src` and `dest` as-is and processes `copy` paths only to:
1. Add their `basename()` to the ignore list (so copied dirs are not processed as pages)
2. Validate that no copy dir is inside the `dest` directory (via `resolve()` + `relative()`)

Crucially, `resolve(copyDir)` in the validation step resolves relative to `process.cwd()`, not relative to the project root or `src` directory. The CLI resolves paths before passing them to the constructor, but programmatic callers must do this themselves.

The `build()` method delegates to `builder(src, dest, { static: true, ...opts })` and returns a `Promise<Results>` containing:
- `siteData`: identified pages, layouts, templates
- `esbuildResults`: bundling output
- `staticResults`: static file copy results
- `copyResults`: additional directory copy results
- `pageBuildResults`: page rendering results (including `errors` and `warnings` arrays)

Errors from page building are collected in a `DomStackAggregateError` (extends `AggregateError`) with a `.results` property containing partial build output. This allows watch mode to continue even when some pages fail.

### Existing test infrastructure in domstack

DomStack uses Node.js's built-in `node:test` runner. Test cases are organized in `test-cases/` subdirectories, each containing a `src/` directory and an `index.test.js` that programmatically instantiates `DomStack` and calls `build()`. Key test directories:

- `test-cases/general-features/` -- page types, asset bundling, layouts, web workers, static files
- `test-cases/build-errors/` -- asset build failures and error aggregation
- `test-cases/page-build-errors/` -- page rendering failures and page-level error handling
- `test-cases/conflict-pages/` -- conflicting page detection
- `test-cases/drafts/` -- draft page handling

Unit tests also exist alongside source files (e.g., `lib/build-pages/resolve-vars.test.js`, `lib/identify-pages.test.js`).

The `page-build-errors` test demonstrates the exact pattern proposed in this issue: programmatic `DomStack` instantiation, `build()` call, and assertion on `DomStackAggregateError` contents. This confirms the programmatic API *works* for testing but requires boilerplate and has the error fidelity issues described.

### Source code analysis (installed @domstack/static)

**Constructor (`index.js` lines 155-186)**: The constructor does `this.#src = src; this.#dest = dest` with no path resolution. Copy dirs are validated with `resolve(copyDir)` (relative to cwd) but not stored in resolved form -- `this.opts` stores them as passed. The `basename(dir)` call in the ignore list means only the directory name is ignored, not the full path.

**`build()` method (`index.js` line 192-194)**: Simply calls `builder(this.#src, this.#dest, { static: true, ...this.opts })`. No temp directory support, no dry-run mode.

**Worker boundary (`build-pages/index.js` lines 100-135)**: The `buildPages()` function spawns a `Worker` thread and returns a Promise. On the main thread side, `workerReport.errors` are processed by copying `errorData` properties onto each error object via `for (const [key, val] of Object.entries(errorData)) { error[key] = val }`. The structured-clone serialization means `cause` arrives as a plain `{ message, stack }` object, not an `Error` instance.

**`DomStackAggregateError` (`lib/helpers/domstack-aggregate-error.js`)**: Extends `AggregateError` with a `.results` property. The `bin.js` CLI uses `inspect()` to log these errors, but the page path (available as `error.page.path`) is not surfaced in the default output format.

### top-bun predecessor

The `bcomnes/top-bun` repository is not indexed on DeepWiki, suggesting it was likely renamed or archived when the project became DomStack. The `resolvePostVars()` function in the current codebase throws explicitly: `"postVars is no longer supported... Move data aggregation to a global.data.js file instead."` -- indicating a migration from the top-bun-era API.

### GitHub issues

Unable to search GitHub issues directly (tool access restricted). No existing upstream issues about programmatic API, testing support, or copy path resolution were found through available channels.

### Raindrop / Basic Memory

No relevant bookmarks found about DomStack testing patterns. Basic Memory contains a package note for `npm:@domstack/static` but no testing-specific content.
