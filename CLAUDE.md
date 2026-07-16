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
- `npm run test:e2e` — the CI-gated Playwright run: desktop chromium ONLY (requires prior build)
- `npm run e2e` — both Playwright projects: chromium + Pixel 5 mobile. The mobile project carries a known red baseline (~12 failures — sidebar-resident controls live in the closed drawer at mobile width; tracked in beads) and is NOT run in CI, so local red under `[mobile]` is expected until the baseline is burned down
- `npm run build-drafts` / `npm run dev-drafts` — production build / watch mode including `.draft.*` pages
- `npm run check:knip` — dead-code + unused-dep detection (runs in `check`)

**Tooling dep rule:** if a config file names a tool (e.g. `knip.json` references `knip`), that tool IS a `devDependencies` entry. Don't rely on `npx`-auto-install — it masks the dependency and `npm ci` won't reproduce the toolchain. Add config → add dep.

**Commit staging rule:** stage wave commits by explicit path, not `git add -A`. The repo root routinely accumulates untracked research notes and audit screenshots that aren't covered by `.gitignore` patterns. `-A` has swept a research artifact into a wave commit before — recovery via stash + `reset --soft HEAD~N` + recommit + stash-pop worked, but never-shipped beats recovered. Name the files at commit time.

**npm script naming rule:** reserve `:` for genuine sub-tasks that can be glob-matched by `npm-run-all2` (e.g. `run-p check:*` runs `check:lint`, `check:tsc`, `check:knip` concurrently). Use flat kebab-case for flag variants of a single command (`build-drafts` not `build:drafts`). Tell: would `run-p foo:*` ever make sense? If no, use kebab.

**Bead filing rule:** every `bd create` call should include `--acceptance="..."` (and `--description="..."`) up front. `bd lint` flags task/bug/feature issues missing `## Acceptance Criteria`; backfilling via `bd update` is more friction than getting it right at creation. Applies to manual single-bead filings AND batch heredoc'd scripts. Tell: did you pass `--acceptance`? If not, the bead is incomplete — fix it now while context is fresh.

## Code Style

- ESM only (`"type": "module"`), JSDoc types, neostandard style via `@voxpelli/eslint-config`
- TypeScript checks JS via `tsc --noEmit` (never compiles) — extends `@voxpelli/tsconfig/node20.json`
- Type coverage enforced at 95%+ with `--strict`
- Node.js `^24.0.0 || >=26` (latest-LTS-only floor — this is an app, not a library; Node 20's test runner had no glob support and silently ran zero tests)
- `n/no-sync` rule disabled (sync file reads acceptable in this SSG context)
- `src/global.client.js` checked by separate `tsconfig.browser.json` (DOM lib, no Node types)

## Content Policy (notbyai.fyi)

This site carries the [notbyai.fyi](https://notbyai.fyi/) "Written by Human, Not by AI" badge in the sidebar footer. That is a commitment, not just a graphic.

- **AI does not draft prose for publication.** No blog posts, TIL entries, about-page copy, microcopy, or feed metadata strings written by an agent should ship to production.
- **AI may write**: code, tests, JSDoc, CSS, build scripts, template logic, regex patterns, commit messages, PR descriptions, and explicitly-marked placeholder content.
- **Placeholder content must be marked and excluded from prod.** If an agent must produce prose-shaped output during development (e.g. to prove a page-shape or build pipeline works):
  1. Name the file `page.draft.md` (DomStack's filename-based draft convention excludes it from `npm run build`).
  2. Add a prominent in-body disclaimer block at the top naming it as an AI-generated placeholder.
  3. Add `ai-placeholder` to the `tags` frontmatter array.
  4. Human author rewrites before the file ships, at which point the disclaimer, tag, and `.draft.` filename are all removed together.
- **PESOS re-imports** (lifting human-authored content from elsewhere into this site) are ambiguous: the body is human, but titles, framing, tags, and citation footers are often AI-assembled. Treat them as placeholders under the same rules above until a human review pass lands.
- **`AI-INELIGIBLE` beads flag.** Issues that require human authorship (prose microcopy, design-intent decisions, content strategy) must carry the flag as the leading line of the description: `AI-INELIGIBLE: <one-line reason>`. Wave planners filter on this flag to keep human-decision items out of autonomous execution. Reasons like `AI-INELIGIBLE: human microcopy` or `AI-INELIGIBLE-UNTIL-HUMAN-DRAFTS: implementation trivial after human copy lands` are both valid — the prefix is what the planner matches on.

## URL Safety

- **URL interpolation into `href` attributes**: always pass frontmatter URL values through `safePostUrl(url)` from `src/lib/safe-url.js` when using the `html` tagged template, or `safeHref(url)` for raw string concatenation. `encodeURI` alone is not safe — it does not encode `:`, so `javascript:` schemes pass through.

## Architecture

DomStack (`@domstack/static` v11) static site generator with convention-based file routing.

### DomStack File Conventions

- **Layouts**: `src/*.layout.js` — receive `{ children, page, vars, scripts, styles }`, return HTML string. `page.path` provides the page's URL path.
- **Pages**: `src/**/page.{js,md,html}` — JS pages export default function returning HTML via `async-htm-to-string`
- **Templates**: `src/*.template.js` — non-HTML output (feeds, sitemap, robots.txt). Return string or `[{ content, outputName }]` array
- **Variables**: `global.vars.js` (site-wide) < `page.vars.js` (per-page) < frontmatter (highest priority)
- **Global data**: `src/global.data.js` — receives all pages, returns aggregated collections (`allPosts`, `blogPosts`, `recentPosts`, `postsByYear`, etc.)
- **Settings overrides**: `src/esbuild.settings.js` or `src/markdown-it.settings.js` for build tool config

### DomStack Gotchas

- **Template data access**: Templates receive `{ vars, pages }` where `vars` is `global.vars.js` only. Access `global.data.js` output via `pages[0].vars` (the `PageData.vars` getter includes `globalDataVars`)
- **`PageData.vars` is a getter**: Creates a fresh merged object each call — setting `page.vars.x = y` writes to a temporary object. Mutate `post.content` on array items from `global.data.js` instead
- **Code blocks render as bare `<pre><code class="hljs">`**: `markdown-it-highlightjs` does NOT wrap in `.highlight` — CSS targeting `.highlight` won't match built output
- **Drafts are filename-based, not frontmatter**: `page.draft.md` / `page.draft.html` / `page.draft.js` excludes from default build; `npm run build-drafts` includes them. Frontmatter `draft: true` has zero effect. Source: `@domstack/static/lib/identify-pages.js:29-30`
- **`--copy images` flattens the top-level directory**: `images/foo.png` → `public/foo.png` (not `public/images/foo.png`). Anything you want at `public/<subdir>/` should be named `<subdir>/` at the top of your copied tree, e.g. `images/badges/x.svg` → `public/badges/x.svg`

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

Smoke tests require a clean production build, NOT a dev build. The regex `/global-[A-Z0-9]+\.css/i` expects hashed asset names which `npm run dev` does not produce. If smoke tests fail with "did not match regex", run `rm -f public/global-*.css public/global.client-*.js && npm run build` first. `public/` accumulates dozens of stale hashed files over a dev session — periodic cleanup is fine.

E2E tests in `e2e/smoke.test.js` use Playwright (`@playwright/test`). They run against the built site served on port 3456. Two projects: chromium desktop + Pixel 5 mobile. `@axe-core/playwright` available for accessibility testing. Run separately from `npm test` — CI gates on `npm run test:e2e` (chromium only); `npm run e2e` adds the mobile project, which has a known red baseline (see Build Commands above). A real mobile regression must be judged against that baseline SET, not against "is anything red".

**Mobile overflow testing**: Never trust visual inspection alone. Use `document.body.scrollWidth > document.documentElement.clientWidth` to detect horizontal overflow programmatically. Test at 375px viewport width against articles with code blocks, YouTube iframes, and the archive page.

**Playwright media emulation goes through `contextOptions`.** `reducedMotion`, `forcedColors` and `contrast` are `BrowserContextOptions`, NOT test options (only `colorScheme` is one). `test.use({ forcedColors: 'active' })` is accepted and **silently dropped** — the suite goes green having emulated nothing. Use `test.use({ contextOptions: { forcedColors: 'active' } })`, as Playwright's own docs for that option show. Guard every emulated suite with a `matchMedia(...).matches` test — **and make sure each remaining assertion would actually fail if its fix were removed.** A guard proves you emulated something; it does not prove you checked it. (`e2e/forced-colors.test.js` once had 6 assertions that passed with the emulation off.) Two traps when writing those assertions: compare rgb with rgb (a computed `"rgb(44, 42, 40)"` vs a raw `"#2c2a28"` token is a string mismatch that passes in every mode), and remember forced-colors reverts `background-color` to a *background* system colour — `background-color: currentColor` on a masked glyph becomes Canvas-on-Canvas, i.e. invisible.

**axe-core (4.12) has no forced-colors awareness.** Under `forced-colors: active` it reads an *unforced* foreground against a *forced* background, so its contrast numbers there describe a rendering that does not exist (it invented a 1.12:1 "failure" on colours the browser never painted). `.disableRules(['color-contrast'])` for those scans and assert the computed system colours directly. Chromium's emulation itself is accurate — it forces both properties correctly. Upstream: `dequelabs/axe-core#3978`.

**`e2e/` is NOT type-checked** — `tsconfig.json` covers `src/`, `tools/`, `test/` only, so unknown `test.use()` keys and other type errors in e2e never surface. `npm run check` does not validate e2e code.

**Playwright prints `✘` for `test.fail()` expected-failures but counts them as passed** — read the summary line, not the glyphs. `e2e/drawer-focus.test.js` has three (the drawer has no focus trap yet).

## Deployment (GitHub Pages cutover)

- Deploys run via `actions/deploy-pages` from `gh-pages.yml` on push to `master`. **The repo's Pages source must be "GitHub Actions"** (Settings → Pages) — while it is "Deploy from a branch", merging this migration would make GitHub legacy-Jekyll-build the repo root and break the live site.
- The custom domain (`voxpelli.com`) lives in **Settings → Pages**, not in a `CNAME` file (the migration deleted it — artifact-based deploys don't read one). The deploy job's post-deploy step fails loudly if `page_url` is not the custom domain, so a lost domain config cannot ship silently.
- A push to `master` IS a production deploy. Never push without an explicit go-ahead.

## Design Context

**Brand personality**: Thoughtful, Technical, Warm.

**"Sovereign Warmth" theme** (current foundation, open to evolution):
- Palette: warm parchment canvas (`#f4f1eb`), deep ink (`#2c2a28`), falu red accent (`#8c2121`), cloudberry orange (`#d97714`), stone borders. **Cloudberry is a display accent only** — small text must use `--color-cloudberry-text` (`#984200`), which is the AA-safe variant; the raw accent is 2.6:1 and fails WCAG AA. Enforced by `test/token-contrast.spec.js`
- Typography: Newsreader (serif, headings/article body), Public Sans (sans, UI), JetBrains Mono (mono, metadata/nav/code). Fluid `clamp()` sizing
- Layout: Two-column sidebar (340px) + content area on desktop, stacked mobile. **The sidebar must NEVER scroll** — it's a landmark, not a scroll region. It is sticky only above a `min-height: 860px` guard (its content is 781–833px); below that it goes static and scrolls with the page, so its footer stays reachable. If content outgrows the guard, trim it or raise the guard — never add `overflow-y: auto`. `e2e/sidebar.test.js` fails loudly if the content stops fitting
- Mobile: hamburger menu via `<button aria-expanded>` + `.js/.no-js` class toggle (NOT `<details>/<summary>` — accessibility issues). Nav drawer is a fixed overlay with z-index stacking managed via `:has()` on `.sidebar`
- Dark mode: Full support via CSS custom properties + `<theme-toggle>` web component. Text targets ~10:1 contrast (not symmetric 12:1) — bright-on-dark reads louder. Sidebar uses warm falu-red accent border in dark mode
- Theme semantics: JS writes `[data-theme="dark"]` or `[data-theme="light"]` for explicit choices, but OMITS the attribute when mode is `'system'` — CSS `@media (prefers-color-scheme: dark) :root:not([data-theme])` handles OS flips natively. Don't regress to always-writing `data-theme` or you'll break live OS auto-switch.

**Design principles**:
1. **Content sovereignty** — design serves readability, never competes. Article text: serif, 65ch max-width
2. **Warm technical** — engineering precision (mono metadata, grid background, structured borders) with warmth (parchment tones, serif type, organic colors)
3. **IndieWeb native** — microformats (h-card, h-entry, h-feed) are structural. Webmentions and feeds are first-class. (Micropub was removed — the endpoint is no longer hosted; see `f09ef14`)
4. **Progressive layers** — works without JS, without custom fonts, in dark mode. Each layer enhances without breaking lower layers
5. **Restrained motion** — subtle transforms and opacity transitions only. Respect `prefers-reduced-motion`. The universal `* { transition-duration: 0.01ms !important; scroll-behavior: auto !important }` block in `global.css` is load-bearing for ~10 motion sources BUT cannot reach `@view-transition { navigation: auto }` (navigation rule, not CSS property — gate with `@media (prefers-reduced-motion: no-preference)`) or Shadow DOM `<style>` blocks (isolated from outer `@media` — `<theme-toggle>` has its own inner `@media (prefers-reduced-motion: reduce)` rule in `TOGGLE_STYLES`). Any new motion in those contexts needs local gating.

**Full design context** lives in two root files (both read by the `impeccable` skill before any design work):
- `PRODUCT.md` — strategy: register (`brand`), users, purpose, brand personality, **anti-references**, design principles, accessibility bar (WCAG 2.1 AA enforced; article text aims at AAA).
- `DESIGN.md` — the visual system: tokens, the "Field Notebook" north star, and the named rules (**The Displacement Rule** — shadows are hard offsets, never blurred; **The Two Cloudberries Rule**; **The Earned Warmth Rule**; **The 65ch Rule**). Machine-readable extensions in `.impeccable/design.json`.
