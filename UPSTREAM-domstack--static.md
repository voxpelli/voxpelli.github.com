## Feature Requests

- **pageUrl not available to layouts** (2026-03-24) — Layouts receive `vars` but `pageUrl` is never injected. Every page's canonical URL and webmention target resolve to `/`. See `domstack-issues/12-pageurl-not-available-in-layouts.md`. [upstream: bcomnes/domstack#238 → PR #250 OPEN · MERGEABLE · 5 review cycles · CI ✅]
  Ownership: upstream · Workaround: none

- **Export PageData, PageInfo types from package entry** (2026-03-24) — DomStack exports function types but not the data types those functions receive. Users wanting full type safety must manually define PageData/PageInfo. See `domstack-issues/01-export-pagedata-types.md`. [upstream: bcomnes/domstack#227 → PR #241 OPEN · MERGEABLE · 4 review cycles · CI ✅]
  Ownership: upstream · Workaround: partial — manual JSDoc typedefs

- **Templates should receive global.data.js output in vars** (2026-03-24) — Templates get only `global.vars.js` in `vars`, not the aggregated `global.data.js` output. See `domstack-issues/09-global-data-not-available-to-templates.md`. [upstream: bcomnes/domstack#235 → PR #240 OPEN · MERGEABLE · 6 review cycles · CI ✅]
  Ownership: upstream · Workaround: full — access via `pages[0].vars` (PageData getter includes globalDataVars)

- **--copy for individual files** (2026-03-24) — The `--copy` flag only handles directories. Service workers and other root-level files require a manual `cp` in the build script. See `domstack-issues/10-service-worker-management.md`. [upstream: bcomnes/domstack#236 → PR #252 OPEN · MERGEABLE · 5 review cycles · CI ✅]
  Ownership: upstream · Workaround: full — `cp sw.js public/sw.js` in build script

- **PageData.vars getter creates fresh objects on each access** (2026-04-13) — `PageData.vars` is a getter that merges globalVars + globalDataVars + pageVars + builderVars into a new object each call. Setting `page.vars.x = y` writes to a temporary object that is immediately garbage-collected. Breaks write-through patterns where global.data.js tries to enrich page vars. [upstream: bcomnes/domstack#233 → PR #242 OPEN · MERGEABLE · 4 review cycles · CI ✅ — note: PR scope is error-message resilience, not getter-semantics change; the fresh-object behavior may persist]
  Ownership: upstream · Workaround: full — mutate array items from global.data.js return value, not the getter result

## Bugs

- **markdown-it-highlightjs renders bare `<pre><code>` without `.highlight` wrapper** (2026-04-13) [degraded] — DomStack's default markdown-it config uses `markdown-it-highlightjs@4.1.0` which renders code blocks as `<pre><code class="hljs">` without a wrapping `<div class="highlight">`. The default ejected CSS targets `.highlight { overflow: auto }` and 28+ token color rules (`.highlight .c`, `.highlight .k`, etc.) — ALL are dead CSS that never matches the actual built output. The token classes are Jekyll/Rouge conventions (`c`, `k`, `err`), not highlight.js conventions (`hljs-attr`, `hljs-string`, `hljs-keyword`). Both the overflow handling and the entire syntax theme are broken by default.
  Severity: degraded · Ownership: upstream · Workaround: full — add `.e-content pre { overflow-x: auto }` for overflow; retarget theme rules to `.hljs` classes for token colors

- **HTML builder doesn't strip YAML frontmatter** (2026-03-24) [degraded] — Only the markdown builder strips frontmatter. HTML pages (`page.html`) with frontmatter render it as visible text.
  Severity: degraded · Ownership: upstream · Workaround: full — use `page.vars.js` alongside `page.html`

## Upstream Opportunities

- **Native async-htm-to-string support** (2026-03-24) — DomStack's default layout ships with htm/preact but async-htm-to-string is a zero-dependency alternative with auto-escaping. This project demonstrates full integration across layouts, pages, and components. See `domstack-issues/14-native-async-htm-to-string-support.md`. [upstream: bcomnes/domstack#239 → PR #247 OPEN · MERGEABLE · 6 review cycles · CI ✅ — docs-first resolution (async-htm-to-string documented as first-class option; runtime remains htm/preact by default)]
  Source: src/root.layout.js, src/article.layout.js, src/lib/ · Merge readiness: needs-redesign
  Ownership: us · Workaround: full — manual import in each file

- **Shared filterAndSortPosts helper pattern** (2026-03-24) — Extracted shared post-filtering logic that both `global.data.js` and templates need. DomStack could provide a built-in collection/query API.
  Source: src/lib/posts.js · Merge readiness: proof-of-concept
  Ownership: us · Workaround: full — shared helper in consumer project · [upstream: not yet filed]

## Cross-Vendor Inconsistencies

_No entries yet._

## Trend Reviews

- **13 DomStack proposals filed and merge-ready** (2026-04-19) — `voxpelli/voxpelli.github.com#32` (Convert from Jekyll to DomStack) surfaced 13 distinct friction points captured as `domstack-issues/01-14-*.md`. Maintainer bcomnes took the initiative between ~2026-04-18 and -19 to file 13 individual tracking issues (bcomnes/domstack#227-#239) and open 13 matching PRs (#240-#253), each through 3-6 review cycles, all OPEN · MERGEABLE · CI green · review applied, indexed by tracking issue #248.

  **Resolution shape varied by proposal**: API changes (#240, #241, #242, #249, #250, #251, #252) got behavior/code PRs. Documentation-request proposals (#243, #244, #245, #246, #247, #253) got docs-only PRs, including some where the original ask was broader (e.g. #237 "native redirect support" landed as #253 "document the template pattern" — workaround stays, scope narrowed). #242 addresses error messages around the `PageData.vars` getter but does not change its fresh-object semantics — the write-through footgun likely persists.

  **Next steps**: monitor merges + DomStack release cadence. On any merge, voxpelli.com can drop the workaround for that specific item (e.g. PR #240 lands → remove `pages[0].vars` indirection in `src/feeds.template.js`; PR #250 lands → remove any hand-rolled canonical URL fallback; PR #252 lands → drop `cp sw.js` from build script). Leave markdown-it-highlightjs bug (above) and HTML frontmatter bug unresolved — neither is in this batch.
