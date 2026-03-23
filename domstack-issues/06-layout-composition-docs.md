# Document layout composition / inheritance pattern

## Problem

DomStack supports multiple layouts (e.g., `root.layout.js`, `article.layout.js`, `blog-index.layout.js`), but there's no documented pattern for how layouts can extend or compose with each other.

In practice, most sites have a base layout (full HTML document) and specialized layouts (article, archive, etc.) that wrap content and delegate to the base layout. Users figure this out by reading examples or trial-and-error.

## Current approach (works but undocumented)

```js
// src/article.layout.js
import rootLayout from './root.layout.js';

export default function articleLayout ({ children, vars }) {
  const articleHtml = `<article class="h-entry">
    <h2>${vars.title}</h2>
    ${children}
  </article>`;

  return rootLayout({
    children: articleHtml,
    vars: { ...vars, author: true },
  });
}
```

Pages use `layout: 'article'` in their vars, and DomStack calls `articleLayout()` which internally delegates to `rootLayout()`.

## Questions users have

1. Is manually importing and calling another layout the intended pattern?
2. Should the extending layout pass through `scripts` and `styles`?
3. Can layouts be nested more than one level deep?
4. What happens to the `page` and `pages` params — should they be forwarded?

## Suggested documentation

```markdown
## Layout Composition

Layouts are plain functions, so they naturally compose via imports.
A common pattern is having a base layout for the HTML document shell
and specialized layouts for different content types.

### Base layout

\`\`\`js
// src/root.layout.js — Full HTML document
export default function rootLayout ({ children, vars, scripts, styles }) {
  return \`<!DOCTYPE html>
<html>
<head>
  <title>\${vars.title}</title>
  \${styles.map(s => \`<link rel="stylesheet" href="\${s}">\`).join('\\n  ')}
</head>
<body>
  \${children}
  \${scripts.map(s => \`<script type="module" src="\${s}"></script>\`).join('\\n  ')}
</body>
</html>\`;
}
\`\`\`

### Extended layout

\`\`\`js
// src/article.layout.js — Wraps content, delegates to root
import rootLayout from './root.layout.js';

export default function articleLayout ({ children, vars, scripts, styles }) {
  const articleHtml = \`<article>
    <h1>\${vars.title}</h1>
    \${children}
    <footer>Published \${vars.date}</footer>
  </article>\`;

  // Forward scripts and styles to the base layout
  return rootLayout({ children: articleHtml, vars, scripts, styles });
}
\`\`\`

### Usage

Set \`layout: 'article'\` in page vars:
\`\`\`yaml
---
layout: article
title: My Post
---
\`\`\`

### Tips

- Always forward \`scripts\` and \`styles\` to the base layout so
  DomStack's CSS/JS injection works correctly.
- You can modify \`vars\` before forwarding
  (e.g., \`{ ...vars, showSidebar: true }\`).
- Layouts can nest any number of levels deep.
- Since layouts are just functions, you can use any JavaScript
  pattern — conditionals, shared helpers, etc.
```

## Impact

Layout composition is used by every non-trivial DomStack site. Documenting the pattern prevents users from reinventing it and ensures they forward `scripts`/`styles` correctly (a subtle but important detail for hash-busted asset injection).
