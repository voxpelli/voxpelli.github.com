# Document all template return types (string, object, array, async iterator)

`Labels: documentation, dx`

---

## Problem

The DomStack template builder supports **four distinct return types**, but documentation primarily shows (or only shows) the async iterator pattern. Users who want to generate a simple file like `robots.txt` or `manifest.json` end up using an async generator because they do not know that simpler return formats work.

The type definitions clearly enumerate all four return types:

```typescript
// From @domstack/static/lib/build-pages/page-builders/template-builder.d.ts
export type TemplateFunction<T> = (params: {
  vars: T;
  template: TemplateInfo;
  pages: PageData<T, any, string>[];
}) => Promise<string | TemplateOutputOverride | TemplateOutputOverride[]>;

export type TemplateAsyncIterator<T> = (
  params: TemplateFunctionParams<T>[0]
) => AsyncIterable<TemplateOutputOverride>;

export type TemplateReport = {
  templateInfo: TemplateInfo;
  outputs: string[];
  type?: "content" | "object" | "array" | "async-iterator";
};
```

The `TemplateReport.type` field confirms the builder detects and handles all four:
1. `"content"` -- plain string return
2. `"object"` -- single `TemplateOutputOverride` return
3. `"array"` -- array of `TemplateOutputOverride` returns
4. `"async-iterator"` -- async generator yielding `TemplateOutputOverride` values

But without documentation, users default to the most complex pattern even when a simpler one would suffice.

---

## Current behavior

A user wanting to generate `robots.txt` might write this because docs only show the generator pattern:

```js
// Over-engineered -- user doesn't know simpler options exist
export default async function* robotsTemplate ({ vars }) {
  yield {
    outputName: 'robots.txt',
    content: `User-Agent: *\nDisallow: /private/`,
  };
}
```

Or they might use the array pattern because they saw it in an example, even for a single output:

```js
// Unnecessary array wrapper for single output
export default function robotsTemplate ({ vars }) {
  return [{
    outputName: 'robots.txt',
    content: `User-Agent: *\nDisallow: /private/`,
  }];
}
```

When the simplest correct version is:

```js
// Simplest -- but user doesn't know this works
export default function robotsTemplate ({ vars }) {
  return `User-Agent: *\nDisallow: /private/`;
}
```

---

## Expected behavior

Documentation should present all four return types with clear guidance on when to use each, ordered from simplest to most flexible.

---

## Workaround

Users read the TypeScript definitions or study example codebases. This codebase contains templates using three of the four return types, providing a natural reference -- but only if users know to look:

<details>
<summary>All template files in this codebase and their return types</summary>

**Array return** -- `src/robots.txt.template.js`:
```js
export default function robotsTemplate (_options) {
  return [{
    outputName: 'robots.txt',
    content: `User-agent: *
Disallow: /webpage-kodfabrik-se/
Disallow: /webpage-svpt-nu/
`,
  }];
}
```

**Array return** -- `src/manifest.json.template.js`:
```js
export default function manifestTemplate (_options) {
  return [{
    outputName: 'manifest.json',
    content: JSON.stringify({
      short_name: 'Pelle Wessman',
      name: "Pelle Wessman's Blog",
      icons: [{ src: 'images/launcher-icon.png', sizes: '192x192', type: 'image/png' }],
      // ...
    }, undefined, 2) + '\n',
  }];
}
```

**Array return** -- `src/sitemap.xml.template.js`:
```js
export default function sitemapTemplate ({ pages, vars }) {
  const siteUrl = vars.siteUrl;
  const urls = pages.map(p => {
    const url = p.pageInfo?.path ? '/' + p.pageInfo.path + '/' : '/';
    return `  <url><loc>${escapeXml(siteUrl + url)}</loc></url>`;
  }).join('\n');

  return [{
    outputName: 'sitemap.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
  }];
}
```

**Array return** -- `src/redirects.template.js` (generates multiple redirect pages):
```js
export default function redirectsTemplate () {
  return redirects.map(({ from, to }) => ({
    outputName: `${from}/index.html`,
    content: `<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${escapeXml(to)}" /></head>
<body><p>Redirecting to <a href="${escapeXml(to)}">${escapeXml(to)}</a></p></body>
</html>`,
  }));
}
```

**Async iterator return** -- `src/feeds.template.js`:
```js
export default async function * feedsTemplate ({ pages, vars }) {
  // ...pre-render posts with renderInnerPage()...

  yield { outputName: 'all.xml', content: await buildFeed({ /* ... */ }) };
  yield { outputName: 'english.xml', content: await buildFeed({ /* ... */ }) };
  yield { outputName: 'links/all.xml', content: await buildFeed({ /* ... */ }) };
}
```

Note: `robots.txt.template.js`, `manifest.json.template.js`, and `sitemap.xml.template.js` all use the array return for a single output. They could use the simpler string or object return if they knew those existed.

</details>

---

## Proposed solution

Add a "Template Return Types" section to the documentation with all four formats, ordered from simplest to most flexible.

### Proposed documentation content

```markdown
## Template Return Types

Templates (`.template.js` / `.template.ts` files) support four return formats.
Use the simplest one that fits your needs.

### 1. String -- Single output, default filename

**Best for:** Simple generated files where the template filename determines the output.

The output filename is derived from the template filename by removing the
`.template.js` suffix: `robots.txt.template.js` produces `robots.txt`.

\`\`\`js
// src/robots.txt.template.js
export default function ({ vars }) {
  return `User-Agent: *
Disallow: /private/`;
}
\`\`\`

**Output:** `robots.txt`

### 2. Object -- Single output with custom filename

**Best for:** Single files where you need to control the output path or filename.

Return an object with `outputName` (the output path relative to the site root)
and `content` (the file content as a string).

\`\`\`js
// src/config.template.js
export default function ({ vars }) {
  return {
    outputName: 'config.json',
    content: JSON.stringify({ siteUrl: vars.siteUrl }, null, 2),
  };
}
\`\`\`

**Output:** `config.json`

### 3. Array -- Multiple outputs from one template

**Best for:** Generating several related files from a single data source.

Return an array of `{ outputName, content }` objects. Each element produces
one output file.

\`\`\`js
// src/feeds.template.js
export default function ({ vars, pages }) {
  return [
    { outputName: 'feed.xml', content: buildAtomFeed(vars, pages) },
    { outputName: 'feed.json', content: buildJsonFeed(vars, pages) },
    { outputName: 'sitemap.xml', content: buildSitemap(vars, pages) },
  ];
}
\`\`\`

**Output:** `feed.xml`, `feed.json`, `sitemap.xml`

This is also the natural pattern for generating redirect pages or other
file-per-item outputs:

\`\`\`js
// src/redirects.template.js
export default function () {
  return redirects.map(({ from, to }) => ({
    outputName: `${from}/index.html`,
    content: `<meta http-equiv="refresh" content="0;url=${to}" />`,
  }));
}
\`\`\`

### 4. Async Iterator -- Streaming multiple outputs

**Best for:** Outputs that require async operations (rendering other pages,
network requests) or large numbers of generated files.

Use an async generator function (`async function*`) and `yield` each output.

\`\`\`js
// src/feeds.template.js
export default async function* ({ pages, vars }) {
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  for (const post of recentPosts) {
    const page = pagesByPath.get(post.path);
    const html = page ? await page.renderInnerPage({ pages }) : '';

    yield {
      outputName: `rendered/${post.path}/index.html`,
      content: html,
    };
  }
}
\`\`\`

**Output:** One file per post, generated incrementally.

This pattern is required when using `renderInnerPage()` because it is async.
It is also useful when generating hundreds of files, as it avoids holding all
output strings in memory simultaneously.

### Template function parameters

All four formats receive the same parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `vars` | `T` | Merged global variables (`global.vars.js` only -- not `global.data.js` output) |
| `template` | `TemplateInfo` | Metadata about the template file (path, outputName) |
| `pages` | `PageData<T>[]` | Array of all resolved page objects |

**Important:** Template `vars` come from `global.vars.js` only. They do not
include `global.data.js` output. To access data computed by `global.data.js`,
iterate `pages` and read their `vars` (which do include global data).

### When to use which

| Return type | Sync? | Custom filename? | Multiple outputs? | Async operations? |
|-------------|-------|-------------------|--------------------|--------------------|
| String | Yes | No (derived from template name) | No | No |
| Object | Yes | Yes | No | No |
| Array | Yes | Yes | Yes | No |
| Async Iterator | No | Yes | Yes | Yes |
```

---

## Alternatives considered

| Approach | Pros | Cons |
|----------|------|------|
| **Docs section (proposed)** | Complete reference, guides users to simplest option | Requires maintenance as API evolves |
| **Starter template scaffolds** | Hands-on, immediate | Only helps new projects; does not help existing users |
| **Console hint on first template build** | Discoverable at point of use | Adds noise to build output |

---

## Real-world impact

This codebase has **5 template files**. All of them use either the array or async iterator pattern. At least three (`robots.txt.template.js`, `manifest.json.template.js`, `sitemap.xml.template.js`) could be simplified:

| Template | Current return type | Simplest sufficient type | Lines saved |
|----------|--------------------|-----------------------|-------------|
| `src/robots.txt.template.js` | Array (1 element) | String | ~4 lines |
| `src/manifest.json.template.js` | Array (1 element) | Object | ~2 lines |
| `src/sitemap.xml.template.js` | Array (1 element) | Object | ~2 lines |
| `src/redirects.template.js` | Array (N elements) | Array (correct) | 0 |
| `src/feeds.template.js` | Async iterator | Async iterator (correct) | 0 |

Beyond this codebase, every DomStack user writing templates benefits from knowing the full range of return types. The string return type in particular is a significant simplification for common generated files.

---

## Related issues

- **#01** -- Exporting `TemplateOutputOverride`, `TemplateFunctionParams`, and `TemplateInfo` types would make the documented API importable for type checking.
- **#02** -- The distinction between `vars` in templates (global.vars only) vs `vars` in page functions (includes global.data) should be cross-referenced.
- **#03** -- The async iterator pattern is the primary way to use `renderInnerPage()`, which is documented in issue #03.
