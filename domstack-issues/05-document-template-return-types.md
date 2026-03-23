# Add "when to use which" guidance for template return types

`Labels: documentation, dx`

---

## Problem

The DomStack README documents all four template return types (string, object, array, async iterator) with full TypeScript examples and type annotations. However, it presents them as equal options without guidance on **when to use which**. Users who encounter the array or async iterator examples first may default to more complex patterns even for trivial single-file templates.

The type definitions enumerate the four return types:

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

The README documents all four with examples, but does not provide a comparison table or decision guide.

---

## What the README already covers

The README's "Templates" section documents each return type with a complete example:

1. **Simple string template** -- returns a string, output name derived from template filename
2. **Object template** -- returns `{ content, outputName }` for custom output paths
3. **Object array template** -- returns an array of `{ content, outputName }` objects
4. **AsyncIterator template** -- async generator yielding `{ content, outputName }` values

Each includes TypeScript type annotations (`TemplateFunction<T>`, `TemplateAsyncIterator<T>`).

---

## What's missing

A **decision guide** or comparison table that helps users choose the simplest pattern for their needs. The README presents all four types sequentially without explicitly recommending that users prefer the simplest sufficient pattern. Adding something like a "When to use which" table would complete the documentation:

| Return type | Sync? | Custom filename? | Multiple outputs? | Async operations? |
|-------------|-------|-------------------|--------------------|--------------------|
| String | Yes | No (derived from template name) | No | No |
| Object | Yes | Yes | No | No |
| Array | Yes | Yes | Yes | No |
| Async Iterator | No | Yes | Yes | Yes |

---

## Real-world impact

This codebase demonstrates the problem: **three templates** use array returns for single outputs when simpler patterns would suffice. This happened because the templates were written before the simpler patterns were well-known:

| Template | Current return type | Simplest sufficient type | Lines saved |
|----------|--------------------|-----------------------|-------------|
| `src/robots.txt.template.js` | Array (1 element) | String | ~4 lines |
| `src/manifest.json.template.js` | Array (1 element) | Object | ~2 lines |
| `src/sitemap.xml.template.js` | Array (1 element) | Object | ~2 lines |
| `src/redirects.template.js` | Array (N elements) | Array (correct) | 0 |
| `src/feeds.template.js` | Async iterator | Async iterator (correct) | 0 |

These templates have been simplified as part of this review to use the appropriate return types.

---

## Proposed solution

Add a brief "When to use which" comparison table to the existing Templates documentation section, after the four return type examples. This is a small addition -- no new section is needed, just a summary that ties the existing examples together.

---

## Related issues

- **#01** -- Exporting `TemplateOutputOverride`, `TemplateFunctionParams`, and `TemplateInfo` types would make the documented API importable for type checking.
- **#02** -- The distinction between `vars` in templates (global.vars only) vs `vars` in page functions (includes global.data) should be cross-referenced.
- **#03** -- The async iterator pattern is the primary way to use `renderInnerPage()`, which is documented in issue #03.
- **#09** -- Template `vars` not including `global.data.js` output is the reason templates must re-derive data from the `pages` array.
