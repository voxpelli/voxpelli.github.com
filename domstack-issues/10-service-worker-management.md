# Allow `--copy` to handle individual files, not just directories

## Problem

The `--copy` flag only accepts directories. Individual root-level files that need to end up in the output directory require a manual post-build step:

```json
"build": "domstack --copy images --copy media && cp sw.js public/sw.js"
```

This affects any file that lives outside `src/` but needs to be in the build output — service workers, `_redirects` (Netlify), `_headers`, `.well-known/*` files, etc. These can't live in `src/` because `.js` files there are treated as page modules.

## Impact

The manual `cp` step is fragile (easy to forget), doesn't integrate with watch mode, and means these files can't participate in any build pipeline processing.

## Suggested improvements

### Option A: Let `--copy` accept files too
```bash
domstack --copy images --copy media --copy sw.js --copy _redirects
```
Detect whether the argument is a file or directory and handle accordingly.

### Option B: Add a separate `--copy-file` flag
```bash
domstack --copy images --copy-file sw.js --copy-file _redirects
```
Keeps the semantics explicit.

### Option C: Support a static files convention
A `static/` or `public/` directory whose contents are copied verbatim to the output root, similar to Astro's `public/` or Vite's `public/`.
