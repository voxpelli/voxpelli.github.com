# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run dev` — watch mode with live reload (browser-sync)
- `npm run build` — production build to `public/`
- `npm test` — full pipeline: lint + tsc + type-coverage + build + smoke tests (also runs on pre-push via husky)
- `npm run check` — lint + tsc + type-coverage in parallel (no build)
- `npm run check:lint` — ESLint only
- `npm run check:tsc` — TypeScript type checking only
- `npm run test:build` — smoke tests only (requires prior build): `node --test 'test/**/*.spec.js'`
- `npm run build:drafts` — include `.draft.*` pages

## Code Style

- ESM only (`"type": "module"`), JSDoc types, neostandard style via `@voxpelli/eslint-config`
- TypeScript checks JS via `tsc --noEmit` (never compiles) — extends `@voxpelli/tsconfig/node20.json`
- Type coverage enforced at 95%+ with `--strict`
- Node.js `^20.19.0 || ^22.13.0 || >=24`
- `n/no-sync` rule disabled (sync file reads acceptable in this SSG context)
- `src/global.client.js` excluded from tsc (browser-only code)

## Architecture

DomStack (`@domstack/static` v11) static site generator with convention-based file routing.

### DomStack File Conventions

- **Layouts**: `src/*.layout.js` — receive `{ children, vars, scripts, styles }`, return HTML string
- **Pages**: `src/**/page.{js,md,html}` — JS pages export default function returning HTML via `async-htm-to-string`
- **Templates**: `src/*.template.js` — non-HTML output (feeds, sitemap, robots.txt). Return string or `[{ content, outputName }]` array
- **Variables**: `global.vars.js` (site-wide) < `page.vars.js` (per-page) < frontmatter (highest priority)
- **Global data**: `src/global.data.js` — receives all pages, returns aggregated collections (`allPosts`, `blogPosts`, `recentPosts`, `postsByYear`, etc.)
- **Settings overrides**: `src/esbuild.settings.js` or `src/markdown-it.settings.js` for build tool config

### Rendering Pipeline

`root.layout.js` wraps all pages. `article.layout.js` extends root for blog posts (adds webmention forms, microformat markup). Both use `async-htm-to-string` for HTML generation — `html` tagged templates for safe rendering, `rawHtml()` only for pre-escaped content (XSS risk).

### Shared Components

`src/lib/` contains render helpers used by pages and templates:
- `render-post.js` — smart dispatcher for blog summaries vs full content vs likes
- `render-post-content.js`, `render-post-footer.js`, `render-post-like.js` — post rendering
- `components/post-header.js`, `components/post-metadata.js`, `components/post-media.js` — post components
- `render-rss-entry.js` — Atom feed entry XML
- `escape.js` — XML escaping for feeds
- `utils.js` — domain/name extraction, string helpers

### Content Structure

- Blog posts: `src/YYYY/MM/slug/page.md` with YAML frontmatter (`date`, `title`, `lang`, `category`, `tags`)
- Social posts: `src/social/YYYY/MM/ID/page.md`
- Link posts: `src/links/YYYY/MM/slug/page.md`
- Static assets: `images/` and `media/` copied via `--copy` flag (not in `src/`)
- `domstack-issues/` — upstream feature proposals for DomStack (not site content)

### Testing

Smoke tests in `test/smoke.spec.js` use `node:test`. They read build output from `public/` and validate: homepage structure, Atom feed content, webmention forms, redirects, sitemap, service worker, and absence of defunct services.
