# Document all template return types (string, object, array, async iterator)

## Problem

The template builder supports **4 different return types**, but the documentation primarily shows the async iterator pattern. The type definitions reveal all 4 options, but users reading the docs don't discover that simpler return formats work.

From `template-builder.d.ts`:
```typescript
export type TemplateFunction<T> = (params: {
  vars: T;
  template: TemplateInfo;
  pages: PageData<T>[];
}) => Promise<string | TemplateOutputOverride | TemplateOutputOverride[]>;

export type TemplateAsyncIterator<T> = (params: TemplateFunctionParams<T>[0]) => AsyncIterable<TemplateOutputOverride>;
```

And the report type confirms all 4 are handled:
```typescript
export type TemplateReport = {
  type?: "content" | "object" | "array" | "async-iterator";
};
```

## Current experience

A user wanting to generate a simple `robots.txt` might think they need to use an async generator:

```js
// Over-engineered because docs only show this pattern:
export default async function* robotsTemplate ({ vars }) {
  yield {
    outputName: 'robots.txt',
    content: `User-Agent: *\nDisallow: /private/`,
  };
}
```

When they could simply write:

```js
// Much simpler — but user doesn't know this works:
export default function robotsTemplate ({ vars }) {
  return `User-Agent: *\nDisallow: /private/`;
}
```

## Suggested documentation

Add a clear section showing all 4 return formats with when to use each:

```markdown
## Template Return Types

Templates support multiple return formats, from simple to flexible:

### String — Single output, default filename
Best for: simple generated files like robots.txt

The output filename is derived from the template filename
(e.g., `robots.txt.template.js` → `robots.txt`).

\`\`\`js
// src/robots.txt.template.js
export default function ({ vars }) {
  return `User-Agent: *\nDisallow: /private/`;
}
\`\`\`

### Object — Single output with custom filename
Best for: single files where you want to control the output path

\`\`\`js
// src/config.template.js
export default function ({ vars }) {
  return { outputName: 'config.json', content: JSON.stringify(vars) };
}
\`\`\`

### Array — Multiple outputs
Best for: generating several related files (feeds, sitemaps)

\`\`\`js
// src/feeds.template.js
export default function ({ vars }) {
  return [
    { outputName: 'feed.xml', content: buildAtomFeed(vars) },
    { outputName: 'feed.json', content: buildJsonFeed(vars) },
  ];
}
\`\`\`

### Async Iterator — Streaming multiple outputs
Best for: large or async-dependent outputs where you want incremental processing

\`\`\`js
// src/feeds.template.js
export default async function* ({ vars, pages }) {
  for (const page of pages) {
    const content = await renderPage(page);
    yield { outputName: `pages/${page.path}.html`, content };
  }
}
\`\`\`
```

## Impact

This is a documentation-only change that significantly improves DX. Users currently over-engineer templates because they don't know simpler return types work. The array return type in particular is very useful for feeds (generating feed.xml + feed.json from one template) but isn't documented.
