# Service workers are not managed by the build system

## Problem

Service workers (`sw.js`) live at the site root and aren't processed by DomStack because `.js` files in `src/` are treated as potential page files. Users must manually copy sw.js in a post-build step:

```json
"build": "domstack --copy images --copy media && cp sw.js public/sw.js"
```

The sw.js is also excluded from linting and type-checking configs since it uses browser globals (`self`, `caches`, `fetch`, `Response`).

## Impact

Any static site with PWA/offline support needs a service worker. The manual copy is fragile (easy to forget), doesn't integrate with watch mode, and means the SW can't benefit from DomStack's asset pipeline (e.g., cache-busting, content hashing).

## Suggested improvements

### Option A: Recognize sw.js as a special static file
If `sw.js` exists at project root, automatically copy it to the output directory.

### Option B: Add a `--static-copy` flag for individual files
```bash
domstack --copy images --static-copy sw.js
```

### Option C: Document the recommended pattern
Add a "Service Workers" section to the docs showing the `cp sw.js public/sw.js` pattern and explaining why sw.js can't live in `src/`.
