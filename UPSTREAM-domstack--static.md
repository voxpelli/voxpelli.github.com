## Feature Requests

- **pageUrl not available to layouts** (2026-03-24) — Layouts receive `vars` but `pageUrl` is never injected. Every page's canonical URL and webmention target resolve to `/`. See `domstack-issues/12-pageurl-not-available-in-layouts.md`. [upstream: not yet filed]
  Ownership: upstream · Workaround: none

- **Export PageData, PageInfo types from package entry** (2026-03-24) — DomStack exports function types but not the data types those functions receive. Users wanting full type safety must manually define PageData/PageInfo. See `domstack-issues/01-export-pagedata-types.md`.
  Ownership: upstream · Workaround: partial — manual JSDoc typedefs

- **Templates should receive global.data.js output in vars** (2026-03-24) — Templates get only `global.vars.js` in `vars`, not the aggregated `global.data.js` output. Forces templates to re-derive post data from raw pages array. See `domstack-issues/09-global-data-not-available-to-templates.md`.
  Ownership: upstream · Workaround: full — duplicate filter logic in templates

- **--copy for individual files** (2026-03-24) — The `--copy` flag only handles directories. Service workers and other root-level files require a manual `cp` in the build script. See `domstack-issues/10-service-worker-management.md`.
  Ownership: upstream · Workaround: full — `cp sw.js public/sw.js` in build script

## Bugs

- **HTML builder doesn't strip YAML frontmatter** (2026-03-24) [degraded] — Only the markdown builder strips frontmatter. HTML pages (`page.html`) with frontmatter render it as visible text.
  Severity: degraded · Ownership: upstream · Workaround: full — use `page.vars.js` alongside `page.html`

## Upstream Opportunities

- **Native async-htm-to-string support** (2026-03-24) — DomStack's default layout ships with htm/preact but async-htm-to-string is a zero-dependency alternative with auto-escaping. This project demonstrates full integration across layouts, pages, and components. See `domstack-issues/14-native-async-htm-to-string-support.md`.
  Source: src/root.layout.js, src/article.layout.js, src/lib/ · Merge readiness: needs-redesign
  Ownership: us · Workaround: full — manual import in each file

- **Shared filterAndSortPosts helper pattern** (2026-03-24) — Extracted shared post-filtering logic that both `global.data.js` and templates need. DomStack could provide a built-in collection/query API.
  Source: src/lib/posts.js · Merge readiness: proof-of-concept
  Ownership: us · Workaround: full — shared helper in consumer project

## Cross-Vendor Inconsistencies

_No entries yet._

## Trend Reviews

_No entries yet._
