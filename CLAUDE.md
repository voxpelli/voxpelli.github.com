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
- `npm run e2e` — Playwright e2e tests (requires prior build): chromium + mobile viewports
- `npm run build:drafts` — include `.draft.*` pages

## Code Style

- ESM only (`"type": "module"`), JSDoc types, neostandard style via `@voxpelli/eslint-config`
- TypeScript checks JS via `tsc --noEmit` (never compiles) — extends `@voxpelli/tsconfig/node20.json`
- Type coverage enforced at 95%+ with `--strict`
- Node.js `^20.19.0 || ^22.13.0 || >=24`
- `n/no-sync` rule disabled (sync file reads acceptable in this SSG context)
- `src/global.client.js` checked by separate `tsconfig.browser.json` (DOM lib, no Node types)

## Architecture

DomStack (`@domstack/static` v11) static site generator with convention-based file routing.

### DomStack File Conventions

- **Layouts**: `src/*.layout.js` — receive `{ children, page, vars, scripts, styles }`, return HTML string. `page.path` provides the page's URL path.
- **Pages**: `src/**/page.{js,md,html}` — JS pages export default function returning HTML via `async-htm-to-string`
- **Templates**: `src/*.template.js` — non-HTML output (feeds, sitemap, robots.txt). Return string or `[{ content, outputName }]` array
- **Variables**: `global.vars.js` (site-wide) < `page.vars.js` (per-page) < frontmatter (highest priority)
- **Global data**: `src/global.data.js` — receives all pages, returns aggregated collections (`allPosts`, `blogPosts`, `recentPosts`, `postsByYear`, etc.)
- **Settings overrides**: `src/esbuild.settings.js` or `src/markdown-it.settings.js` for build tool config

### Rendering Pipeline

`root.layout.js` wraps all pages. `article.layout.js` extends root for blog posts (adds webmention forms, microformat markup). Both use `async-htm-to-string` for HTML generation — `html` tagged templates for safe rendering, `rawHtml()` only for pre-escaped content (XSS risk).

### Shared Components

`src/lib/` contains render helpers used by pages and templates:
- `render-post.js` — smart dispatcher for blog summaries vs full content vs likes. Defines `PostVars` typedef (`PostVarsBase & Record<string, unknown>`) used by all render functions
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

E2E tests in `e2e/smoke.test.js` use Playwright (`@playwright/test`). They run against the built site served on port 3456. Two projects: chromium desktop + Pixel 5 mobile. `@axe-core/playwright` available for accessibility testing. Run separately from `npm test` via `npm run e2e`.

## Design Context

**Brand personality**: Thoughtful, Technical, Warm.

**"Sovereign Warmth" theme** (current foundation, open to evolution):
- Palette: warm parchment canvas (`#f4f1eb`), deep ink (`#2c2a28`), falu red accent (`#8c2121`), cloudberry orange (`#d97714`), stone borders
- Typography: Newsreader (serif, headings/article body), Public Sans (sans, UI), JetBrains Mono (mono, metadata/nav/code). Fluid `clamp()` sizing
- Layout: Two-column sidebar (340px sticky) + content area on desktop, stacked mobile
- Dark mode: Full support via CSS custom properties + `<theme-toggle>` web component

**Design principles**:
1. **Content sovereignty** — design serves readability, never competes. Article text: serif, 65ch max-width
2. **Warm technical** — engineering precision (mono metadata, grid background, structured borders) with warmth (parchment tones, serif type, organic colors)
3. **IndieWeb native** — microformats (h-card, h-entry, h-feed) are structural. Webmentions, feeds, micropub are first-class
4. **Progressive layers** — works without JS, without custom fonts, in dark mode. Each layer enhances without breaking lower layers
5. **Restrained motion** — subtle transforms and opacity transitions only. Respect `prefers-reduced-motion`

See `.impeccable.md` for full design context with references and detailed guidelines.
