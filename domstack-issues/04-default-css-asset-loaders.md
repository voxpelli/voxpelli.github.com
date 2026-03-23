# Add default esbuild loaders for common asset types referenced in CSS

## Problem

When CSS references an image file (e.g., `background-image: url(./img/loader.gif)`), the build crashes because esbuild doesn't know how to handle `.gif` (or `.png`, `.jpg`, `.svg`, `.woff2`, etc.) files.

This is a first-run experience issue — a user's very first build fails if their CSS references any image, and the error message doesn't suggest the solution.

## Reproduction

1. Create a CSS file with an image reference:
```css
/* src/global.css */
.loading { background-image: url(./img/loader.gif); }
```

2. Place the image at `src/img/loader.gif`

3. Run `domstack` — build fails with an esbuild error about unknown file type `.gif`

## Current workaround

Create `src/esbuild.settings.js`:

```js
export default function (opts) {
  return {
    ...opts,
    loader: {
      ...opts.loader,
      '.gif': 'dataurl',
    },
  };
}
```

This must be done for each file extension individually, and the user must know about `esbuild.settings.js` and esbuild's loader concept.

## Suggested fix

### Option A: Ship default loaders for common asset types

In DomStack's default esbuild configuration, include sensible defaults:

```js
const defaultLoaders = {
  // Images (inline as data URLs for small files, common in CSS)
  '.png': 'dataurl',
  '.jpg': 'dataurl',
  '.jpeg': 'dataurl',
  '.gif': 'dataurl',
  '.svg': 'dataurl',
  '.webp': 'dataurl',
  '.avif': 'dataurl',
  '.ico': 'file',

  // Fonts (output as separate files)
  '.woff': 'file',
  '.woff2': 'file',
  '.ttf': 'file',
  '.eot': 'file',
  '.otf': 'file',
};
```

These would be overridable via `esbuild.settings.js` for users who want different behavior (e.g., `'file'` instead of `'dataurl'` for images).

### Option B: Use `'file'` as catch-all for unknown extensions in CSS context

Instead of enumerating extensions, configure esbuild to use `'file'` loader as a fallback for any unknown extension referenced from CSS. This prevents crashes while keeping behavior predictable.

### Option C: Better error message

At minimum, catch the esbuild error for unknown file types and suggest creating `esbuild.settings.js`:

```
Error: No loader configured for ".gif" files.

DomStack uses esbuild to bundle CSS. To handle .gif files referenced
in CSS, create src/esbuild.settings.js:

  export default function (opts) {
    return {
      ...opts,
      loader: { ...opts.loader, '.gif': 'dataurl' },
    };
  }

Available loaders: 'dataurl' (inline as base64), 'file' (copy to output),
'empty' (replace with empty string)
```

## Impact

This affects every DomStack user whose CSS references images or fonts — which is most real-world websites. The current experience is a confusing esbuild error on first build with no guidance on how to fix it.

Option A is the most user-friendly — it "just works" for the common case while remaining overridable.
