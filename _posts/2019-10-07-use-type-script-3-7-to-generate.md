---
layout: micropubpost
date: '2019-10-07T15:42:27.043Z'
title: How to use TypeScript 3.7 to generate declarations from JSDoc
slug: use-type-script-3-7-to-generate
lang: en
---

## Background

While TypeScript for long has supported validating the types in ones javascript files, even reading ones JSDoc-comments, it hasn’t really worked that well for those who in turn wanted to use ones code.

By default TypeScript doesn’t read the JSDoc of any dependencies. One have had to set `maxNodeModuleJsDepth` to a higher value, which hasn’t been without some issues.

Issues range from having the required depth change over time due to nested modules in `node\_modules`, making it hard to guarantee that types has been read, and picking up weird JSDoc comments from other packages – JSDoc comments that has never been tested for correctness.

So, what about [TypeScript 3.7](https://devblogs.microsoft.com/typescript/announcing-typescript-3-7-beta/)? It [introduces a way](https://github.com/microsoft/TypeScript/pull/32372) to create a type definition file from your JSDoc definitions. I decided to try it out on a project.

## How-to

This is how I added it to a project which publishes a single `index.js` file ([bunyan-adaptor](https://github.com/voxpelli/node-bunyan-adaptor)):

### 1. Create a new tsconfig file

Add a new `tsconfig.json` with the sole purpose of generating your declaration. This way you can avoid getting declarations generated for tests and such.

I added a `declaration.tsconfig.json` containing:

```
{
  "extends": "./tsconfig",
  "exclude": [
    "test/**/*.js"
  ],
  "compilerOptions": {
    "declaration": true,
    "noEmit": false,
    "emitDeclarationOnly": true
  }
}
```

### 2. Add a npm script for generating the declaration

```
"declaration:build": "rm -f index.d.ts && tsc -p declaration.tsconfig.json",
```

### 3. (optional) Add a npm script for ensuring your declaration has been committed

```
"declaration:check": "git diff --exit-code -- index.d.ts",
```

### 4. (optional) Add a prepublishOnly npm script

```
"prepublishOnly": "npm run --silent declaration:build && npm run --silent declaration:check",
```

Or simpler, with the use of [npm-run-all](https://github.com/mysticatea/npm-run-all):

```
"prepublishOnly": "run-s declaration:*",
```

### 5. Profit / Party / 🦄 / 🤳

However you want to celebrate: This is the moment.

Run `npm run declaration:build`, commit the resulting `index.d.ts` and publish your module!

**Note:** Visual Studio Code could/will complain about your generated type declaration unless you tell it to use TypeScript 3.7.

Tell it by running the `TypeScript: Select TypeScript Version...` command when in eg. the type declaration file.
