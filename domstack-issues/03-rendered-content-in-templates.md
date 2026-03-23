# Provide rendered HTML content in global.data.js and templates

## Problem

When building Atom/RSS feeds, sitemaps with content snippets, or any template that needs the rendered HTML of a page, there's no API to get it. `page.vars.content` for markdown pages contains **raw markdown**, not rendered HTML.

This means feed entries either:
1. Contain raw markdown (broken for RSS readers)
2. Require users to bring their own markdown-it instance and manually render content

This is a very common use case — nearly every blog needs an RSS/Atom feed with rendered HTML content.

## Reproduction

```js
// src/feeds.template.js
export default function feedsTemplate ({ vars, pages }) {
  const posts = vars.recentPosts || [];

  for (const post of posts) {
    // post.content is raw markdown like "# Hello\n\nThis is **bold**"
    // We need "<h1>Hello</h1>\n<p>This is <strong>bold</strong></p>"
    console.log(typeof post.content); // string (raw markdown)
  }
}
```

## Current workaround

Install markdown-it separately and render manually:

```js
import markdownIt from 'markdown-it';
const md = markdownIt();

export default function feedsTemplate ({ vars }) {
  const posts = vars.recentPosts || [];
  return posts.map(post => ({
    outputName: 'feed.xml',
    content: `<entry><content>${md.render(post.content)}</content></entry>`,
  }));
}
```

This has problems:
- Duplicates DomStack's markdown-it configuration
- Any markdown-it plugins configured via `markdown-it.settings.js` are not applied
- Users must install markdown-it as a separate dependency

## Suggested fix

### Option A: Add `renderContent()` method to PageData (preferred)

```typescript
class PageData {
  /** Render the inner page content (markdown → HTML, js page → return value) */
  async renderContent(): Promise<string> {
    return this.renderInnerPage({ pages: [] });
  }
}
```

Usage in templates:
```js
export default async function feedsTemplate ({ vars, pages }) {
  const recentPages = pages.filter(p => /* ... */);
  for (const page of recentPages) {
    const html = await page.renderContent();
    // Use html in feed entry
  }
}
```

### Option B: Pre-render content and include in vars

Make `vars.renderedContent` available alongside `vars.content`:
```typescript
// In the page builder, after rendering:
builderVars.renderedContent = renderedHtml;
builderVars.content = rawSource; // keep raw source too
```

### Option C: Expose the configured markdown-it instance

```typescript
// In global.data.js or template params:
export default function feedsTemplate ({ vars, pages, md }) {
  // md is the configured markdown-it instance with all plugins applied
  const html = md.render(post.content);
}
```

## Impact

Every DomStack site with an RSS/Atom feed using markdown content hits this. The blog example in the DomStack repo (bret.io) also renders feeds. This is a core use case for any blog or content site.
