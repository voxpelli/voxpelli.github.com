# Document layout composition and inheritance pattern

`Labels: documentation, dx`

---

## Problem

DomStack supports multiple layouts (e.g., `root.layout.js`, `article.layout.js`, `blog-index.layout.js`), and layouts are plain functions that can compose by importing and calling each other. This is a powerful, flexible pattern -- but it is entirely undocumented.

In practice, most sites have a **base layout** (the full HTML document shell) and one or more **specialized layouts** (article, archive, landing page) that wrap their content and delegate to the base. Users must figure this out by reading example codebases or through trial and error. Key questions go unanswered:

1. Is manually importing and calling another layout the **intended** pattern, or a hack?
2. Which parameters (`scripts`, `styles`, `page`, `pages`, `workers`) must be forwarded to the base layout, and what breaks if they are not?
3. Can layouts nest more than two levels deep?
4. Can the extending layout modify `vars` before forwarding?
5. What is the relationship between layout CSS/JS files and composed layouts?

---

## Current behavior

Layout composition works today -- this codebase uses it -- but the pattern must be reverse-engineered from examples. Here is the actual composition in this site:

### Base layout: `src/root.layout.js`

```js
import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

export default function rootLayout ({ children, scripts = [], styles = [], vars }) {
  const blogName = String(vars.blogName || '');
  const siteUrl = String(vars.siteUrl || '');
  const title = vars.frontpage
    ? blogName
    : (vars.title ? `${vars.title} – ${blogName}` : blogName);

  const headContent = renderToStringSync(html`
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${styles.map(href => html`<link rel="stylesheet" href=${href} />`)}
    <!-- ...feeds, canonical, meta tags... -->
  `);

  const bodyContent = renderToStringSync(html`
    <div class="page">
      <header><h1><a href="/">${blogName}</a></h1></header>
      ${rawHtml(children)}
    </div>
    ${scripts.map(src => html`<script type="module" src=${src}></script>`)}
  `);

  return `<!DOCTYPE html>
<html lang="en">
<head>${headContent}</head>
<body>${bodyContent}</body>
</html>`;
}
```

### Extending layout: `src/article.layout.js`

```js
import { html, renderToStringSync } from 'async-htm-to-string';
import { renderPostContent } from './lib/render-post-content.js';
import rootLayout from './root.layout.js';

export default function articleLayout ({ children, scripts = [], styles = [], vars }) {
  const articleHtml = renderPostContent({
    authorName: vars.authorName,
    content: children,
    post: { ...vars, pageUrl: vars.pageUrl || '' },
    siteUrl: vars.siteUrl,
    standalone: true,
    // ...
  });

  const webmentionForm = renderToStringSync(html`
    <div>
      Have you written a response to this? Let me know the URL:
      <form action=${`${vars.webmentionEndpoint}/api/webmention`} method="post">
        <!-- ...form fields... -->
      </form>
    </div>
  `);

  // Modify vars before forwarding to base layout
  const layoutVars = {
    ...vars,
    author: true,
    hfeed: true,
    webmentionable: true,
  };

  // Delegate to root layout, forwarding scripts and styles
  return rootLayout({
    children: articleHtml + '\n' + webmentionForm,
    scripts,
    styles,
    vars: layoutVars,
  });
}
```

### How pages select a layout

Pages declare their layout in their exported `vars`:

```js
// src/page.js (homepage) -- uses root layout
export const vars = {
  layout: 'root',
  title: 'Pelle Wessman',
  frontpage: true,
};

// A markdown post -- uses article layout (via frontmatter or page.vars.js)
// vars: { layout: 'article', title: 'My Post', date: '2024-01-15' }
```

DomStack matches `layout: 'article'` to `article.layout.js` by filename convention. The article layout then internally composes with `root.layout.js`.

---

## Expected behavior

A documentation section should explain:
1. That layout composition via imports is the **intended and recommended** pattern
2. The complete layout function signature (all parameters)
3. Which parameters must be forwarded and why
4. How to modify vars before forwarding
5. Multi-level nesting
6. How layout-specific CSS and JS files interact with composition

---

## Workaround

Users study existing codebases or experiment. The most common failure mode is **forgetting to forward `scripts` and `styles`** to the base layout, which causes DomStack's hash-busted CSS and JS bundles to silently disappear from the rendered page. This is a subtle bug because the page renders without styles/scripts but produces no error.

---

## Proposed solution

Add a "Layout Composition" section to the DomStack documentation.

### Proposed documentation content

```markdown
## Layout Composition

Layouts are plain JavaScript functions, so they compose naturally via imports.
The recommended pattern is a **base layout** for the HTML document shell and
**specialized layouts** for different content types.

### Layout function signature

Every layout function receives a single object with these properties:

| Parameter | Type | Description |
|-----------|------|-------------|
| `children` | `string` (or custom type) | The rendered inner page content |
| `vars` | `Record<string, any>` | Merged page variables (global.vars + global.data + page.vars + builder vars) |
| `scripts` | `string[]` | Script paths for this page (global + page-specific + layout-specific) |
| `styles` | `string[]` | Stylesheet paths for this page (global + page-specific + layout-specific) |
| `page` | `PageInfo` | Static metadata about the current page |
| `pages` | `PageData[]` | Array of all resolved page objects |
| `workers` | `Record<string, string>` | Web worker file paths for this page |

### Base layout

The base layout renders the full HTML document. It is responsible for
injecting stylesheets and scripts into the appropriate locations.

\`\`\`js
// src/root.layout.js
export default function rootLayout ({ children, vars, scripts = [], styles = [] }) {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>\${vars.title || 'My Site'}</title>
  \${styles.map(s => \`<link rel="stylesheet" href="\${s}">\`).join('\\n  ')}
</head>
<body>
  <header><h1><a href="/">\${vars.siteName}</a></h1></header>
  \${children}
  \${scripts.map(s => \`<script type="module" src="\${s}"></script>\`).join('\\n  ')}
</body>
</html>\`;
}
\`\`\`

### Extending a layout

An extending layout imports the base, wraps the content, and delegates:

\`\`\`js
// src/article.layout.js
import rootLayout from './root.layout.js';

export default function articleLayout ({ children, vars, scripts, styles }) {
  const articleHtml = \`<article>
    <h1>\${vars.title}</h1>
    <time>\${vars.date}</time>
    \${children}
  </article>\`;

  // Modify vars for the base layout
  const baseVars = { ...vars, showAuthorCard: true };

  // IMPORTANT: forward scripts and styles to the base layout
  return rootLayout({
    children: articleHtml,
    vars: baseVars,
    scripts,
    styles,
  });
}
\`\`\`

### Critical: forwarding scripts and styles

**Always forward `scripts` and `styles` to the base layout.** These arrays
contain the hash-busted paths to your CSS and JS bundles (e.g.,
\`/global-A1B2C3D4.css\`). If you do not forward them, the base layout has
no way to inject \`<link>\` and \`<script>\` tags, and your page will render
without styles or client-side JavaScript.

\`\`\`js
// WRONG -- scripts and styles are lost
return rootLayout({ children: wrappedContent, vars });

// CORRECT -- scripts and styles are forwarded
return rootLayout({ children: wrappedContent, vars, scripts, styles });
\`\`\`

This is the most common layout composition mistake because it produces no error --
the page simply renders without its assets.

### Multi-level nesting

Layouts can nest any number of levels. Each level wraps the content and
delegates upward:

\`\`\`js
// src/blog-index.layout.js
import rootLayout from './root.layout.js';

export default function blogIndexLayout ({ children, vars, scripts, styles }) {
  const navHtml = \`<nav>...</nav>\`;
  return rootLayout({
    children: navHtml + children,
    vars: { ...vars, hfeed: true },
    scripts,
    styles,
  });
}

// src/blog-post.layout.js
import blogIndexLayout from './blog-index.layout.js';

export default function blogPostLayout ({ children, vars, scripts, styles }) {
  const postHtml = \`<article>\${children}</article>\`;
  return blogIndexLayout({
    children: postHtml,
    vars: { ...vars, showAuthorCard: true },
    scripts,
    styles,
  });
}
\`\`\`

Chain: page content -> blogPostLayout -> blogIndexLayout -> rootLayout

### Forwarding additional params

If your layouts use \`page\`, \`pages\`, or \`workers\`, forward those as well:

\`\`\`js
export default function articleLayout ({ children, vars, scripts, styles, page, pages, workers }) {
  // Use page.path for breadcrumbs, pages for related posts, etc.
  const breadcrumb = \`<nav>Home > \${page.path}</nav>\`;

  return rootLayout({
    children: breadcrumb + children,
    vars,
    scripts,
    styles,
    page,
    pages,
    workers,
  });
}
\`\`\`

### Modifying vars

You can add, override, or remove vars before forwarding. This is the
recommended way to pass layout-specific signals to the base layout:

\`\`\`js
// The article layout adds 'author' and 'webmentionable' flags
// that the root layout uses to render author cards and webmention links
const layoutVars = {
  ...vars,
  author: true,
  hfeed: true,
  webmentionable: true,
};
return rootLayout({ children: wrappedContent, vars: layoutVars, scripts, styles });
\`\`\`

### Layout-specific CSS and JS

Each layout can have an associated CSS and/or JS file:

- \`article.layout.css\` -- Styles specific to the article layout
- \`article.layout.client.js\` -- Client JS specific to the article layout

These are automatically bundled by esbuild and their hash-busted paths are
included in the \`styles\` and \`scripts\` arrays passed to the layout function.
When composing layouts, forwarding \`styles\` and \`scripts\` ensures that
layout-specific assets from child layouts reach the base layout's \`<head>\`
and \`<body>\` injection points.

### Tips

- Layouts are just functions -- use any JavaScript pattern: conditionals,
  shared helper functions, template literals, JSX, or tagged template libraries.
- Since layouts receive all pages via \`pages\`, you can build navigation,
  related posts, or other cross-page features directly in a layout.
- The \`page\` param provides \`page.type\` (\`"js" | "md" | "html"\`), which
  lets a layout render differently based on the page builder type.
```

---

## Alternatives considered

| Approach | Pros | Cons |
|----------|------|------|
| **Docs section (proposed)** | Comprehensive, covers pitfalls, includes real examples | Requires maintenance |
| **Built-in layout extends mechanism** | Would formalize the pattern (e.g., `export const extends = 'root'`) | Adds API surface; plain function composition is more flexible and idiomatic |
| **Starter template with composition example** | Hands-on learning | Only helps new projects; does not help existing users |

Plain function composition is the right design -- it is maximally flexible and requires no framework-specific concepts. The gap is purely documentation.

---

## Real-world impact

This codebase demonstrates the pattern with two layouts:

| Layout | Role | Composes with |
|--------|------|---------------|
| `src/root.layout.js` | Base HTML document (79 lines) | N/A (top-level) |
| `src/article.layout.js` | Article/post wrapper with webmention form (60 lines) | Imports and calls `root.layout.js` |

Pages using each layout:

| Layout | Used by |
|--------|---------|
| `root` | `src/page.js`, `src/archive/page.js`, `src/links/page.js`, `src/social/page.js` |
| `article` | All markdown blog posts (80+ posts across `src/2008/` through `src/2019/`) |

The article layout correctly forwards `scripts` and `styles` and modifies `vars` to add `author: true`, `hfeed: true`, and `webmentionable: true` -- all patterns that should be documented so every DomStack user does the same.

---

## Related issues

- **#01** -- Exporting `LayoutFunctionParams` would let users type their layout functions precisely, especially the `page`, `pages`, and `workers` params that are easy to forget.
- **#02** -- The variable merge order documented in issue #02 explains why `vars` in a layout contains `global.data.js` output (which affects what data layouts can access).
- **#05** -- Template return types are a related customization point; templates and layouts are the two primary "output-shaping" mechanisms in DomStack.
