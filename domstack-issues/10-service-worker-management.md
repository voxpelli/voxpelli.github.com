# Allow `--copy` to handle individual files, not just directories

`Labels: enhancement, cli, build-pipeline`

---

## Problem

The `--copy` flag only accepts **directories**. Individual root-level files that need to end up in the build output require a manual post-build shell command. Any file that lives outside `src/` but must appear in the output directory — service workers, Netlify `_redirects`, `_headers`, `.well-known/*` files, etc. — cannot be handled by the DomStack build pipeline alone.

These files cannot live inside `src/` because DomStack treats `.js` files there as page modules, layout modules, or template modules based on naming conventions. A `sw.js` placed in `src/` would be interpreted as a page builder, not a static asset.

**Expected:** `--copy sw.js` copies a single file into the output root, just as `--copy images` copies a directory.

**Actual:** `--copy` calls `getCopyDirs()` which unconditionally appends `/**` to every path, treating all arguments as directories. A file path like `sw.js` becomes the glob `sw.js/**`, which matches nothing.

---

## Current behavior

### The `--copy` flag is directory-only by design

The `getCopyDirs` function in `build-copy/index.js` appends a recursive glob to every copy argument:

```js
// node_modules/@domstack/static/lib/build-copy/index.js (lines 20-23)
export function getCopyDirs (copy = []) {
  const copyGlobs = copy?.map((dir) => join(dir, '**'))
  return copyGlobs
}
```

The `buildCopy` function then passes these globs to `cpx2.copy()`:

```js
// node_modules/@domstack/static/lib/build-copy/index.js (lines 30-58)
export async function buildCopy (_src, dest, _siteData, opts) {
  const copyDirs = getCopyDirs(opts?.copy)
  const copyTasks = copyDirs.map((copyDir) => {
    return copy(copyDir, dest)
  })
  // ...
}
```

For a directory like `images`, the glob `images/**` correctly matches all files within it. For a file like `sw.js`, the glob `sw.js/**` matches nothing — `cpx2` silently produces no output.

### This project's build script uses a manual `cp` workaround

```json
// package.json
"build": "domstack --copy images --copy media && cp sw.js public/sw.js",
"dev": "domstack --watch --copy images --copy media"
```

Note that the `dev` (watch) script does **not** include the `cp sw.js` step. This means:
- In production builds, `sw.js` is copied correctly (via shell `cp`).
- In development watch mode, `sw.js` is **never copied** — the service worker is stale or missing during local development.

### The service worker is registered by the client bundle

```js
// src/global.client.js (lines 1-3)
document.documentElement.className = document.documentElement.className.replace(/\bno-js\b/, 'js');
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }
```

And the smoke test verifies its presence:

```js
// test/smoke.spec.js (lines 42-44)
test('service worker exists', async () => {
  await access('public/sw.js');
});
```

If the `cp` command is forgotten or the build script changes, the service worker silently disappears from the output, and the site degrades (no offline support, broken caching).

---

## Reproduction

```bash
# Attempt to copy a single file via --copy
domstack --copy images --copy sw.js

# Result: images/ contents are copied, but sw.js is silently ignored.
# The glob "sw.js/**" matches nothing.
```

---

## Workaround

Append a manual `cp` (or equivalent) to the build script:

```json
"build": "domstack --copy images --copy media && cp sw.js public/sw.js"
```

This workaround has several drawbacks:
1. **Not cross-platform** — `cp` is a Unix command; Windows users need `copy` or a Node script.
2. **Not integrated with watch mode** — changes to `sw.js` during `domstack --watch` are not detected or copied.
3. **Easy to forget** — adding a new root-level file (e.g., `_redirects` for Netlify) requires remembering to update the build script.
4. **Not available to programmatic API users** — the `DomStack` class has no way to express "also copy this file."

---

## Proposed solution

### Option A: Let `--copy` accept both files and directories (recommended)

Detect whether the argument is a file or directory and handle accordingly:

```js
// In build-copy/index.js
import { stat } from 'node:fs/promises';
import { join, basename } from 'node:path';

export async function getCopyGlobs (copy = []) {
  const globs = await Promise.all(copy.map(async (entry) => {
    try {
      const stats = await stat(entry);
      if (stats.isDirectory()) {
        return { glob: join(entry, '**'), destSubdir: '' };
      } else if (stats.isFile()) {
        return { glob: entry, destSubdir: '' };
      }
    } catch {
      // Path doesn't exist yet — treat as glob pattern
    }
    return { glob: entry, destSubdir: '' };
  }));
  return globs;
}
```

Usage would be unchanged:

```bash
domstack --copy images --copy media --copy sw.js --copy _redirects
```

```json
"build": "domstack --copy images --copy media --copy sw.js"
```

### Option B: Add a `--copy-file` flag for explicit semantics

```bash
domstack --copy images --copy media --copy-file sw.js --copy-file _redirects
```

```js
// bin.js CLI options addition
'copy-file': {
  type: 'string',
  help: 'path to individual files to copy into dist; can be used multiple times',
  multiple: true
},
```

This keeps the semantics explicit but adds a second flag users must learn.

### Option C: Support a `static/` directory convention

A `static/` directory at the project root whose contents are copied verbatim to the output root, similar to Astro's `public/`, Vite's `public/`, or Next.js's `public/`:

```
project/
  src/           # DomStack source pages
  static/        # Copied verbatim to output root
    sw.js
    _redirects
    .well-known/
      webfinger
  images/        # Existing --copy directory
  public/        # Build output
```

This convention eliminates the need for `--copy` entirely for static assets and makes the project layout self-documenting.

---

## Alternatives considered

| Approach | Pros | Cons |
|---|---|---|
| **A: `--copy` accepts files** | No new flags, backward compatible, minimal change | Slightly changes semantics of existing flag |
| **B: `--copy-file` flag** | Explicit, no ambiguity | Two flags to learn; more CLI surface |
| **C: `static/` convention** | Zero CLI flags, self-documenting | Requires directory restructuring; opinionated |
| **Do nothing** | Zero risk | Manual `cp` forever; broken watch mode for files |

Option A is recommended as the smallest useful change. Option C could be added later as a complementary feature.

---

## Real-world impact

This project has exactly one file affected: `sw.js` (85 lines, a service worker inspired by Jeremy Keith's work). But the pattern applies broadly:

**Files in this project that live outside `src/` and need to be in the output:**

| File | Current handling | Would benefit from `--copy` file support |
|---|---|---|
| `sw.js` | Manual `cp sw.js public/sw.js` in build script | Yes |
| `images/` | `--copy images` | Already works (directory) |
| `media/` | `--copy media` | Already works (directory) |

**Common files in other DomStack projects that would benefit:**

- `_redirects` (Netlify)
- `_headers` (Netlify / Cloudflare Pages)
- `.well-known/webfinger` (Fediverse discovery)
- `browserconfig.xml` (Windows tiles)
- `ads.txt` (ad verification)
- `security.txt` (security contact)

Each of these requires a manual post-build copy step today.

The watch mode gap is particularly painful: during `domstack --watch`, changes to `sw.js` are invisible because the manual `cp` only runs at build time. Developers must manually restart the build to pick up service worker changes.

---

## Related issues

- **#08 — Programmatic API for testing**: The test helper would also need to handle individual file copying, compounding the workaround complexity.
- **#11 — Native redirect support**: If `_redirects` could be copied via `--copy`, it would provide a lightweight alternative to the template-based redirect approach for platforms that support it natively.

---

## External Research

### DeepWiki confirmation
The `--copy` flag copies entire directories only. It preserves internal structure and copies everything (JS, CSS, HTML, MD) without DomStack processing. Copy directories must reside outside `dest` but can be within `src` (in which case they're gitignore-style excluded from DomStack's build).

### Upstream issue
- Issue [#34](https://github.com/bcomnes/domstack/issues/34) (open): "Service worker support" — directly relevant. This is an active upstream issue about how to handle service workers in DomStack sites.
- Issue [#19](https://github.com/bcomnes/domstack/issues/19) (closed): "Harden static copying to not include any page assets" — about the boundary between static copying and page asset processing.

### Current workaround in this codebase
`package.json` uses `cp sw.js public/sw.js` appended to the build command. This works but is fragile — it runs after DomStack's build, so the file isn't watched during dev mode and isn't part of the build pipeline.
