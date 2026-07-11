# v11 ships `.d.ts` files that fail `tsc` (breaks `skipLibCheck: false` consumers)

`Labels: bug, types, dx`

---

## Summary

Every published `@domstack/static@11.x` (checked `11.0.0`, `11.0.1`, `11.0.2`, `11.0.3`) ships
generated `.d.ts` files that do not type-check. Any consumer with `skipLibCheck: false` — the default
in `@voxpelli/tsconfig`, and deliberately so — fails `tsc` the moment it imports a type from the
package.

This is not a TypeScript-version regression: the same errors reproduce under **TS 5.9 and TS 6.0**,
so it is not caused by a compiler bump on the consumer side.

## Reproduce

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": false,   // the default in @voxpelli/tsconfig
    "moduleResolution": "node16",
    "module": "nodenext"
  }
}
```

```js
// any source file
/** @import { TemplateOutputOverride } from '@domstack/static' */
```

```
npx tsc --noEmit
```

## Errors

**1. Self-aliased re-exports collide with their own imports** — `index.d.ts`

The file emits, for ten exported types:

```ts
export type BuildOptions = BuildOptions;                  // line 15
export type TemplateOutputOverride = TemplateOutputOverride;
// ...
import type { BuildOptions } from 'esbuild';              // line 27
import type { TemplateOutputOverride } from './lib/build-pages/page-builders/template-builder.js';
```

The `export type X = X` alias is self-referential and collides with the `import type { X }` of the
same name:

```
node_modules/@domstack/static/index.d.ts(27,15): error TS2440: Import declaration conflicts with local declaration of 'BuildOptions'.
node_modules/@domstack/static/index.d.ts(28,15): error TS2440: ... 'LayoutFunction'.
node_modules/@domstack/static/index.d.ts(29,15): error TS2440: ... 'AsyncLayoutFunction'.
node_modules/@domstack/static/index.d.ts(30,15): error TS2440: ... 'GlobalDataFunction'.
node_modules/@domstack/static/index.d.ts(31,15): error TS2440: ... 'AsyncGlobalDataFunction'.
node_modules/@domstack/static/index.d.ts(32,15): error TS2440: ... 'PageFunction'.
node_modules/@domstack/static/index.d.ts(33,15): error TS2440: ... 'AsyncPageFunction'.
node_modules/@domstack/static/index.d.ts(34,15): error TS2440: ... 'TemplateFunction'.
node_modules/@domstack/static/index.d.ts(35,15): error TS2440: ... 'TemplateAsyncIterator'.
node_modules/@domstack/static/index.d.ts(36,15): error TS2440: ... 'TemplateOutputOverride'.
```

The same pattern appears in `lib/build-pages/page-builders/page-writer.d.ts` for `PageData`.

**2. Generic parameters referenced but never declared** — the page builders

```
lib/build-pages/page-builders/html/index.d.ts(4,59): error TS2304: Cannot find name 'T'.
lib/build-pages/page-builders/js/index.d.ts(4,59):   error TS2304: Cannot find name 'T'.
lib/build-pages/page-builders/js/index.d.ts(4,62):   error TS2304: Cannot find name 'U'.
lib/build-pages/page-builders/md/index.d.ts(4,59):   error TS2304: Cannot find name 'T'.
```

The emitted signatures reference `PageBuilderResult<T, string>` without a generic parameter list on
the function.

**3. Constraint violation** — `template-builder.d.ts`

```
lib/build-pages/page-builders/template-builder.d.ts(18,72): error TS2344: Type 'T' does not satisfy the constraint 'Record<string, any>'.
```

## Why it matters

`skipLibCheck: false` is a deliberate posture, not an oversight — it is what catches dependency type
problems before they become runtime surprises. Right now, adopting DomStack's own exported types
forces a consumer to turn that safety off across their **entire** dependency tree, not just for
DomStack.

The workaround we shipped is `skipLibCheck: true` in the consumer's `tsconfig.json`, with a comment
to revert once this is fixed. The alternative — hand-maintaining local stubs for DomStack's public
types — is what we were doing before, and it is exactly what importing the real types was meant to
replace.

## Suggested fix

The errors look like `.d.ts` **generation** artefacts rather than authoring mistakes — a
self-referential `export type X = X` serves no purpose and is unlikely to be intentional. Worth
checking the declaration-emit step: whether `tsc` is being run over the JSDoc sources in a
configuration that produces these aliases, and whether the page-builder functions are losing their
generic parameter lists on emit.

A quick guard: run `tsc --noEmit` over the published `.d.ts` files with `skipLibCheck: false` as part
of the release pipeline. That would have caught all three classes here.

## Environment

- `@domstack/static` 11.0.0 – 11.0.3 (all published v11 releases checked)
- TypeScript 5.9 and 6.0 (identical errors under both)
- `moduleResolution: node16`, `module: nodenext`
