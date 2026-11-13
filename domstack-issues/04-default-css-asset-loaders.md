# Add default esbuild loaders for common asset types referenced in CSS

`Labels: enhancement, dx, first-run-experience`

---

## Problem

When CSS references an image or font file (e.g., `background-image: url(./img/loader.gif)`), the DomStack build crashes with an opaque esbuild error because no loader is configured for that file extension. This is a **first-run experience problem** -- a user's very first build fails if their CSS references any non-CSS, non-JS asset, and the error message provides no guidance on how to fix it.

DomStack uses esbuild to bundle CSS and JS assets (via `lib/build-esbuild/index.js`). The default esbuild configuration assembled in `assembleBuildOpts()` does not include any `loader` entries for common asset types. Esbuild's own defaults only handle `.js`, `.ts`, `.css`, `.json`, and a few other code formats -- not images or fonts.

---

## Reproduction

**Step 1:** Create a CSS file that references an image:

```css
/* src/global.css */
.loading {
  background-image: url(./img/loader.gif);
}
```

**Step 2:** Place the image at `src/img/loader.gif`.

**Step 3:** Run `domstack` -- the build fails with an error like:

```
Error building JS+CSS with esbuild
  No loader is configured for ".gif" files: src/img/loader.gif
```

This also applies to `.png`, `.jpg`, `.svg`, `.webp`, `.woff2`, `.ttf`, and any other asset type referenced from CSS.

**Note:** This codebase's `src/global.css` already contains inline data URIs for SVG icons (embedded directly in the CSS as `url('data:image/svg+xml,...')`), likely as a workaround for this exact limitation:

```css
/* From src/global.css -- SVG inlined as data URI to avoid the loader problem */
a[lang="sv"]:before {
  background: url('data:image/svg+xml,%3Csvg xmlns=...');
}
```

If these were external `.svg` files instead of inline data URIs, the build would fail.

---

## Current behavior

The esbuild configuration in `lib/build-esbuild/index.js` builds entry points for styles and scripts but provides no default loaders for assets:

```js
// From @domstack/static/lib/build-esbuild/index.js (assembleBuildOpts function)
const buildOpts = {
  entryPoints,
  logLevel: 'silent',
  bundle: true,
  write: true,
  format: 'esm',
  splitting: true,
  sourcemap: true,
  outdir: dest,
  outbase: src,
  target,
  define,
  metafile: true,
  entryNames: watch ? '[dir]/[name]' : '[dir]/[name]-[hash]',
  chunkNames: 'chunks/[ext]/[name]-[hash]',
  jsx: 'automatic',
  jsxImportSource: 'preact',
  // No `loader` property -- asset types not configured
};
```

The `esbuild.settings.js` extension mechanism exists but is invoked after the defaults, and there is no error handling that suggests using it:

```js
const esbuildSettingsExtends = siteData.esbuildSettings
  ? (await import(siteData.esbuildSettings.filepath)).default
  : (esbuildOpts) => esbuildOpts;

const extendedBuildOpts = await esbuildSettingsExtends(buildOpts);
```

---

## Expected behavior

Common asset types referenced in CSS should work out of the box. A user should be able to write `background-image: url(./img/logo.png)` or `@font-face { src: url(./fonts/body.woff2) }` without any additional configuration, just as they would in Vite, Next.js, Astro, or any other modern build tool.

---

## Workaround

Create `src/esbuild.settings.js` and manually configure loaders for every file extension:

```js
// src/esbuild.settings.js
export default function (opts) {
  return {
    ...opts,
    loader: {
      ...opts.loader,
      '.gif': 'dataurl',
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.svg': 'dataurl',
      '.webp': 'dataurl',
      '.woff': 'file',
      '.woff2': 'file',
    },
  };
}
```

This workaround has several problems:
1. The user must **know** that `esbuild.settings.js` exists (it is not well-documented)
2. The user must **know** esbuild's loader concept and available loader types (`dataurl`, `file`, `empty`, `copy`, `text`, `base64`)
3. Each file extension must be added individually -- miss one and the build breaks again
4. There is no this-codebase-level signal that tells the user this file is needed until the build crashes

---

## Proposed solution

### Option A (recommended): Ship default loaders for common asset types

Add sensible defaults to the `buildOpts` object in `assembleBuildOpts()`:

```js
const defaultLoaders = {
  // Images -- inline as data URLs (appropriate for CSS background images,
  // icons, and other small assets; esbuild has no size-based splitting,
  // so dataurl is the safest default for CSS-referenced assets)
  '.png': 'dataurl',
  '.jpg': 'dataurl',
  '.jpeg': 'dataurl',
  '.gif': 'dataurl',
  '.svg': 'dataurl',
  '.webp': 'dataurl',
  '.avif': 'dataurl',
  '.ico': 'file',

  // Fonts -- output as separate hashed files (fonts are typically large
  // and benefit from caching as standalone files)
  '.woff': 'file',
  '.woff2': 'file',
  '.ttf': 'file',
  '.eot': 'file',
  '.otf': 'file',
};

const buildOpts = {
  // ...existing options...
  loader: defaultLoaders,
};
```

Users who want different behavior can override via `esbuild.settings.js`:

```js
// src/esbuild.settings.js -- override images to use file loader instead
export default function (opts) {
  return {
    ...opts,
    loader: {
      ...opts.loader,
      '.png': 'file',   // Override: output as separate file instead of inlining
      '.jpg': 'file',
    },
  };
}
```

This is fully backwards-compatible because:
- Sites without `esbuild.settings.js` get the defaults (currently they get nothing)
- Sites with `esbuild.settings.js` already spread `...opts.loader`, so they inherit defaults and can override

### Option B: Use `file` as a catch-all for unknown extensions in CSS context

Instead of enumerating extensions, configure esbuild to use the `file` loader as a fallback for any unknown extension referenced from CSS. This prevents crashes while keeping behavior predictable.

However, esbuild does not natively support a "fallback loader" concept, so this would require wrapping the esbuild build call with error detection and retry, which adds complexity.

### Option C: Better error messages (minimum viable improvement)

At minimum, catch the esbuild error for unknown file types and produce an actionable error message:

```
Error: No loader configured for ".gif" files.

DomStack uses esbuild to bundle CSS and JS. To handle .gif files referenced
in your CSS, create src/esbuild.settings.js:

  export default function (opts) {
    return {
      ...opts,
      loader: { ...opts.loader, '.gif': 'dataurl' },
    };
  }

Available esbuild loaders:
  'dataurl'  -- Inline file as base64 data URL (good for small images/icons)
  'file'     -- Copy file to output directory with content hash (good for fonts, large images)
  'empty'    -- Replace with empty string
  'copy'     -- Copy file without processing
```

This requires detecting the specific esbuild error pattern in the catch block of `buildEsbuild()`:

```js
// In lib/build-esbuild/index.js, buildEsbuild() catch block
} catch (err) {
  const noLoaderMatch = err.message?.match(/No loader is configured for "(\.[^"]+)" files/);
  if (noLoaderMatch) {
    const ext = noLoaderMatch[1];
    return {
      type: 'esbuild',
      errors: [
        new Error(
          `No loader configured for "${ext}" files.\n\n` +
          `To handle ${ext} files referenced in CSS, create src/esbuild.settings.js:\n\n` +
          `  export default function (opts) {\n` +
          `    return { ...opts, loader: { ...opts.loader, '${ext}': 'dataurl' } };\n` +
          `  }\n\n` +
          `Available loaders: 'dataurl' (inline), 'file' (copy to output), 'empty', 'copy'`
        ),
      ],
      warnings: [],
      report: {},
    };
  }
  // ...existing generic error handling
}
```

---

## Recommendation

**Option A** is strongly recommended. It matches user expectations from other build tools, requires zero configuration for the common case, and remains fully overridable. Options B and C are fallbacks if Option A is rejected for philosophical reasons (e.g., "DomStack should not make assumptions about asset handling").

Ideally, Option A and Option C are implemented together -- defaults for the common case, plus an actionable error message for any extension that still falls through.

---

## Alternatives considered

| Approach | Pros | Cons |
|----------|------|------|
| **Default loaders (Option A)** | Zero-config, matches other tools, overridable | Opinionated about dataurl vs file for images |
| **Fallback loader (Option B)** | Handles all extensions automatically | esbuild does not support this natively; adds complexity |
| **Better error (Option C)** | Minimal code change, educational | User still must create a config file; poor first-run experience persists |
| **Document esbuild.settings.js** | No code change | Does not prevent the initial crash; docs are discovered after the problem |

---

## Real-world impact

This affects every DomStack site whose CSS references images or fonts -- which is the majority of real-world websites. Common patterns that trigger this:

- `background-image: url(./img/hero.jpg)` -- background images
- `@font-face { src: url(./fonts/inter.woff2) }` -- custom fonts
- `cursor: url(./img/pointer.png), auto` -- custom cursors
- `list-style-image: url(./img/bullet.svg)` -- custom list markers
- `content: url(./img/icon.svg)` -- CSS-generated content

This codebase avoids the issue by inlining SVGs as data URIs directly in the CSS source, which is itself a workaround for the missing loader defaults:

```css
/* src/global.css -- manual data URI embedding */
background: url('data:image/svg+xml,%3Csvg xmlns=...') no-repeat 0 0;
```

---

## Related issues

This issue is independent of the other issues in this set, which focus on types, documentation, and API design. However, it shares the theme of improving first-run and new-user experience with DomStack.
