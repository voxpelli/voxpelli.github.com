## Feature Requests

- **pageUrl not available to layouts** (2026-03-24) — Layouts receive `vars` but `pageUrl` is never injected. Every page's canonical URL and webmention target resolve to `/`. See `domstack-issues/12-pageurl-not-available-in-layouts.md`. [upstream: bcomnes/domstack#238 → PR #250 **MERGED 2026-05-24**, landed as a `url` field on `PageInfo` — **unreleased**]
  Ownership: upstream · Workaround: full — construct from `page.path` in the layouts. Cannot be removed until a release ships

- **Export PageData, PageInfo types from package entry** (2026-03-24) — DomStack exports function types but not the data types those functions receive. Users wanting full type safety must manually define PageData/PageInfo. See `domstack-issues/01-export-pagedata-types.md`. [upstream: bcomnes/domstack#227 → PR #241 **MERGED 2026-05-24** — **unreleased**]
  Ownership: upstream · Workaround: partial — manual JSDoc typedefs

- **Templates should receive global.data.js output in vars** (2026-03-24) — Templates get only `global.vars.js` in `vars`, not the aggregated `global.data.js` output. See `domstack-issues/09-global-data-not-available-to-templates.md`. [upstream: bcomnes/domstack#235 → PR #240 **MERGED 2026-04-20** — **unreleased**]
  Ownership: upstream · Workaround: full — access via `pages[0].vars` (PageData getter includes globalDataVars)

- **PageData.vars getter creates fresh objects on each access** (2026-04-13) — `PageData.vars` is a getter that merges globalVars + globalDataVars + pageVars + builderVars into a new object each call. Setting `page.vars.x = y` writes to a temporary object that is immediately garbage-collected. Breaks write-through patterns where global.data.js tries to enrich page vars. [upstream: bcomnes/domstack#233 → PR #242 **MERGED 2026-05-24** — but the PR only improved the *error messages* around the getter; the fresh-object semantics are unchanged, so the write-through footgun persists even after release. PR #243 (**MERGED 2026-06-26**) additionally caches page vars, which may or may not change this — re-check on release]
  Ownership: upstream · Workaround: full — mutate array items from the `global.data.js` return value, never assign through the getter

- **`--copy` for individual files** (2026-03-24) — The `--copy` flag only handles directories, so a root-level `sw.js` needs a manual `cp` in the build script. **DECLINED upstream.** PR #252 was closed unmerged on 2026-06-26: *"Rejecting this idea because you should just: a) put the files in the src directory, or b) set up the copy dir and whatever structure you want in it and point the copy flag at it."* The tracking issue stays open only for a possible warning when a non-directory path is passed. See `domstack-issues/10-service-worker-management.md`. [upstream: bcomnes/domstack#236 OPEN → PR #252 **CLOSED, rejected**]
  Ownership: us · Workaround: full and **permanent** — `cp sw.js public/sw.js` stays in the build script. It carries a `sed` substitution for `__BUILD_VERSION__` anyway, which `--copy` could never have replaced. Do not wait on this; there is nothing coming

## Bugs

- **Published `.d.ts` files fail `tsc` — every v11 release** (2026-07-11) [degraded] — The type declarations shipped in the package do not type-check: self-aliased re-exports (`export type X = X` colliding with an `import type { X }`) and generics referenced but never declared (`Cannot find name 'T'/'U'`). Any consumer with `skipLibCheck: false` gets ~19 errors originating entirely inside `node_modules`, with nothing wrong in their own code — which reads as a broken toolchain and sends you hunting the wrong thing (it cost a full TypeScript-downgrade investigation here before the cause was found). Reproduced against every published v11, and independent of the consumer's TypeScript version. Draft report ready at `domstack-issues/15-broken-dts-under-skiplibcheck.md`, not filed.
  Severity: degraded · Ownership: upstream · Workaround: full — `skipLibCheck: true` in `tsconfig.json`, which silences the package's broken types along with everyone else's

- **markdown-it-highlightjs renders bare `<pre><code>` without `.highlight` wrapper** (2026-04-13) [degraded] — DomStack's default markdown-it config uses `markdown-it-highlightjs@4.1.0`, which renders code blocks as `<pre><code class="hljs">` with no wrapping `<div class="highlight">`. The default ejected CSS targets `.highlight { overflow: auto }` and 28+ token colour rules (`.highlight .c`, `.highlight .k`, …) — **all** dead CSS that never matches the built output. Those token classes are Jekyll/Rouge conventions (`c`, `k`, `err`), not highlight.js ones (`hljs-attr`, `hljs-string`, `hljs-keyword`). Both the overflow handling and the entire syntax theme are broken out of the box.
  Severity: degraded · Ownership: upstream · Workaround: full — add `.e-content pre { overflow-x: auto }` for overflow; retarget theme rules to `.hljs` classes for token colours

- **HTML builder doesn't strip YAML frontmatter** (2026-03-24) [degraded] — Only the markdown builder strips frontmatter. HTML pages (`page.html`) with frontmatter render it as visible text.
  Severity: degraded · Ownership: upstream · Workaround: full — use `page.vars.js` alongside `page.html`

## Upstream Opportunities

- **Native async-htm-to-string support** (2026-03-24) — DomStack's default layout ships with htm/preact; async-htm-to-string is a zero-dependency alternative with auto-escaping, and this project demonstrates full integration across layouts, pages and components. Resolved docs-first: async-htm-to-string is now documented as a first-class option, but the default runtime remains htm/preact, so our manual import stays load-bearing. See `domstack-issues/14-native-async-htm-to-string-support.md`. [upstream: bcomnes/domstack#239 → PR #247 **MERGED 2026-06-27** (docs only) — **unreleased**]
  Source: src/root.layout.js, src/article.layout.js, src/lib/ · Merge readiness: needs-redesign
  Ownership: us · Workaround: full — manual import in each file, permanently

- **Shared filterAndSortPosts helper pattern** (2026-03-24) — Extracted shared post-filtering logic that both `global.data.js` and templates need. DomStack could provide a built-in collection/query API.
  Source: src/lib/posts.js · Merge readiness: proof-of-concept
  Ownership: us · Workaround: full — shared helper in consumer project · [upstream: not yet filed]

## Cross-Vendor Inconsistencies

_No entries yet._

## Trend Reviews

### Review — 2026-07-11

- **The batch landed; none of it shipped.** Of the 13 PRs (#240–#253), **11 are MERGED** (#240 Apr 20; #241, #242, #250 May 24; #243–#246 Jun 26; #247, #249, #251 Jun 27), **#252 was CLOSED unmerged** (rejected — see the `--copy` entry), and **#253 is still OPEN** (redirect-pattern docs). The 2026-04-19 review recorded all 13 as "OPEN · MERGEABLE"; that is three months stale and was wrong in both directions.
- **The external gate is the whole story.** The latest published release is **v11.0.3 (2026-02-21)**, which predates *every* merge above. `@domstack/static@11.0.3` is what we build against, so **not one workaround can be removed yet**, no matter how many PRs merged. The adoption checklist below is entirely release-gated; the merge dates are noise until bcomnes cuts a release.
- **One item is permanently ours.** `--copy` for individual files was rejected on design grounds, not deferred. The beads issue to remove the `cp sw.js` workaround is invalid and should be dropped — there is nothing to wait for. Our build needs the `sed`/`__BUILD_VERSION__` substitution regardless, so `--copy` would not have helped even if it had landed.
- **Escalate:** the broken `.d.ts` bug (new above) is the only item still worth filing — it affects every consumer with `skipLibCheck: false` and has no upstream issue. Draft is ready and unfiled.
- **Still valid, unfiled:** the markdown-it-highlightjs dead-CSS bug and the HTML-frontmatter bug. Neither was in the #227–#239 batch and neither has an upstream issue.
- **Next review trigger:** a new `@domstack/static` release on npm. Watch the tag, not the PRs.

### Review — 2026-04-19

- **13 DomStack proposals filed and merge-ready** — `voxpelli/voxpelli.github.com#32` surfaced 13 friction points captured as `domstack-issues/01-14-*.md`. Maintainer bcomnes filed 13 tracking issues (#227–#239) and opened 13 matching PRs (#240–#253), each through 3–6 review cycles, indexed by #248. Resolution shape varied: API changes got behaviour PRs; documentation-request proposals got docs-only PRs, sometimes with the original ask narrowed (#237 "native redirect support" became #253 "document the template pattern").
- *(Superseded by the 2026-07-11 review above: the "all OPEN · MERGEABLE" status no longer holds.)*

## Adoption Checklist (post-merge)

**Nothing here is actionable yet.** Every row is gated on a `@domstack/static` release that includes the merged PRs, and no such release exists — latest is v11.0.3 (2026-02-21), which predates all of them. Watch the npm tag / GitHub releases, not the PR list.

| PR | Tracker | Status | What lands | Workaround to remove | Files to edit | Beads |
|------|---------|--------|-------------|-----------------------|----------------|-------|
| #240 | #235 | MERGED, unreleased | `global.data.js` keys exposed on `vars` in templates | `pages[0].vars` indirection + duplicated `filterAndSortPosts` pipeline | `src/feeds.template.js` (drop import + re-derivation); `src/tags.template.js` (`pages[0]?.vars.*` → `vars.*`) | `2vy` |
| #241 | #227 | MERGED, unreleased | `PageData` / `PageInfo` / `*FunctionParams` type exports | Local `PageData` typedef + inline `@param {{...}}` blocks | `src/global.data.js`, `src/feeds.template.js`, `src/tags.template.js`, `src/links/page.js`, `src/social/page.js`, `src/archive/full/page.js`, `src/root.layout.js`, `src/article.layout.js` → `GlobalDataFunction` / `TemplateFunctionParams` / `PageFunctionParams` / `LayoutFunctionParams`. Do NOT touch site-local `PageVars` (`src/page.js`) or `PostVars` (`src/lib/render-post.js`) | `6pz` |
| #250 | #238 | MERGED, unreleased | `url` field on `PageInfo` for canonical URLs in layouts | Manual `'/' + page.path + '/'` construction. **The tag-template manual spread stays** — #250 covers `page.js` pages, not synthetic pages emitted by templates | `src/root.layout.js:22`, `src/article.layout.js:15`. Keep the `{ ...vars, pageUrl: '/tags/...' }` spread at `src/tags.template.js:45,73` | `ung` |
| #252 | #236 | **CLOSED — rejected** | *(nothing)* | **None. Do not remove the workaround.** `cp sw.js public/sw.js` is permanent; the build's `sed`/`__BUILD_VERSION__` step needs it regardless | — | **`bpz` — invalid, drop it** |
| #242 | #233 | MERGED, unreleased | Better error messages around the `PageData.vars` getter | **None** — fresh-object semantics unchanged; the write-through footgun persists. Mental-model fix only | — | — |
| #243 | #228 | MERGED, unreleased | Caches page vars + adds a markdown content helper | **None**, but re-check whether the caching changes the `PageData.vars` fresh-object behaviour above | — | — |
| #244–#246 | #229–#231 | MERGED, unreleased | Docs: `renderInnerPage`/`renderFullPage`, template return types, layout composition pitfalls | **None** — consume for `pages` + `workers` destructuring awareness in layout params | — | — |
| #247 | #239 | MERGED, unreleased | Docs: async-htm-to-string as a first-class option | **None** — runtime stays htm/preact; our manual import remains load-bearing | — | — |
| #249 | #232 | MERGED, unreleased | Default asset loaders in the esbuild config | **Re-audit on release** — may overlap `src/esbuild.settings.js` | — | — |
| #251 | #234 | MERGED, unreleased | Programmatic build-testing support (+ copy path-resolution fix) | **Re-audit on release** — could simplify the smoke-test setup | — | — |
| #253 | #237 | **OPEN** | Docs: redirect-pages template pattern | **None** — `src/redirects.template.js` stays; docs will endorse it as the official approach | — | — |

**Summary**: 3 PRs carry concrete file-removal actions on release (#240, #241, #250 → beads `2vy`, `6pz`, `ung` under epic `9v8`). `bpz` is **dead** — #252 was rejected. 2 need a re-audit on release (#249, #251). The rest are docs or behaviour clarifications with nothing to remove.

**Sequencing** (unchanged): `2vy` and `6pz` share files (`feeds.template.js`, `tags.template.js`) and must ship in one commit. `ung` depends on both (it touches `root.layout.js` / `article.layout.js`, which `6pz` also edits) and adds canonical-URL e2e assertions in the same commit.
