# Strengthen layout composition documentation with pitfall warnings

`Labels: documentation, dx`

---

## Problem

The DomStack README has a "Nested layouts" section that documents the core layout composition pattern: importing a base layout, wrapping content, and delegating via rest spread. It includes a full example of `blog.layout.ts` extending `root.layout.ts`.

However, the documentation does not cover several practical pitfalls that users encounter when composing layouts:

1. **What breaks when `scripts`/`styles` are not forwarded** — the README shows them being forwarded via rest spread, but does not explain that forgetting to forward them causes silent failure (pages render without CSS/JS bundles, no error).
2. **Modifying `vars` before forwarding** — the README example uses rest spread to forward everything, but does not show the pattern of adding or overriding vars (e.g., adding `author: true`, `hfeed: true`) before delegating.
3. **Forwarding `page`, `pages`, and `workers`** — the README's layout function signature documents these params, but the nested layout example does not show forwarding them. Layouts that need page introspection (e.g., breadcrumbs, related posts) must know to forward these explicitly.
4. **Layout-specific CSS/JS with nested layouts** — the README has a dedicated "Nested layout TS/JS bundles and styles" section explaining that composed layouts must manually `@import` / `import` parent layout assets. This is documented, but easy to miss.

---

## What the README already covers

The README's "Nested layouts" section documents:

- **Core pattern**: Importing and calling another layout function (with a full `blog.layout.ts` example)
- **Rest spread forwarding**: `const { children: innerChildren, ...rest } = layoutVars` and `return defaultRootLayout(rootArgs)`
- **Layout function signature**: All params (`vars`, `scripts`, `styles`, `children`, `pages`, `page`, `workers`) are documented in the default root layout section
- **Layout CSS/JS inheritance**: A dedicated "Nested layout TS/JS bundles and styles" sub-section explains that `@import "./root.layout.css"` and `import './root.layout.client.ts'` are needed for composed layouts
- **LayoutFunction type**: `LayoutFunction<T, U, V>` with three type parameters is documented

---

## What's missing

### 1. Warning about the silent failure mode

If `scripts` and `styles` are not forwarded to the base layout, the page renders without CSS or JS bundles. There is no error message — the page simply appears unstyled and without client-side functionality. This is the most common layout composition mistake and should be explicitly warned about.

```js
// WRONG -- scripts and styles are silently lost
return rootLayout({ children: wrappedContent, vars });

// CORRECT -- scripts and styles are forwarded
return rootLayout({ children: wrappedContent, vars, scripts, styles });
```

### 2. Pattern for modifying vars before forwarding

The README's example uses rest spread, which forwards vars unchanged. A common need is to add layout-specific flags:

```js
const layoutVars = {
  ...vars,
  author: true,
  hfeed: true,
  webmentionable: true,
};
return rootLayout({ children: wrappedContent, vars: layoutVars, scripts, styles });
```

This pattern is used in this codebase's `src/article.layout.js` and is a natural extension of the documented pattern, but not shown in the README.

### 3. Explicit param forwarding list

When layouts use `page`, `pages`, or `workers`, these must also be forwarded. A checklist of "params to forward" would help:

```js
export default function articleLayout ({ children, vars, scripts, styles, page, pages, workers }) {
  return rootLayout({
    children: wrappedContent,
    vars: layoutVars,
    scripts,    // Hash-busted CSS/JS paths — MUST forward
    styles,     // Hash-busted CSS/JS paths — MUST forward
    page,       // Forward if base layout uses page introspection
    pages,      // Forward if base layout uses page listing
    workers,    // Forward if base layout uses web workers
  });
}
```

---

## Proposed solution

Add a "Layout composition pitfalls" subsection to the existing "Nested layouts" documentation:

1. A warning box about the silent failure when `scripts`/`styles` are not forwarded
2. An example showing `vars` modification before forwarding
3. A quick-reference list of params that should be forwarded and why

This is a small addition to existing documentation, not a new section.

---

## Real-world impact

This codebase demonstrates the correct pattern in `src/article.layout.js`:

```js
export default function articleLayout ({ children, scripts = [], styles = [], vars }) {
  // Wrap content
  const articleHtml = renderPostContent({ /* ... */ });
  const webmentionForm = renderToStringSync(html`...`);

  // Modify vars before forwarding
  const layoutVars = { ...vars, author: true, hfeed: true, webmentionable: true };

  // Forward scripts and styles correctly
  return rootLayout({
    children: articleHtml + '\n' + webmentionForm,
    scripts,
    styles,
    vars: layoutVars,
  });
}
```

This pattern works correctly, but was discovered through experimentation rather than documentation. Documenting the pitfalls would help other DomStack users avoid the silent failure mode.

---

## Related issues

- **#01** -- Exporting `LayoutFunctionParams` would let users type their layout functions precisely, especially the `page`, `pages`, and `workers` params that are easy to forget.
- **#02** -- The variable merge order documented in issue #02 explains why `vars` in a layout contains `global.data.js` output (which affects what data layouts can access).
