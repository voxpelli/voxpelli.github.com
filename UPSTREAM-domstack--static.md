## Feature Requests

- **pageUrl not available to layouts** (2026-03-24) — **FIXED in v12:** [PR #250](https://github.com/bcomnes/domstack/pull/250) added `PageInfo.url`; both layouts now prefer it. The path/`vars.pageUrl` fallback remains useful for manually rendered template pages without a `page` object. See `domstack-issues/12-pageurl-not-available-in-layouts.md`.
  Ownership: upstream fixed; site adopted · Workaround: fallback only

- **Export PageData, PageInfo types from package entry** (2026-03-24) — **FIXED in v12:** [PR #241](https://github.com/bcomnes/domstack/pull/241) shipped public types; v12 exposes type-only exports from `@domstack/static/types.js`, with `PageData` also exported at the root. The site uses the public `PageData` and `TemplateOutputOverride` types; broader inline parameter typing is optional. See `domstack-issues/01-export-pagedata-types.md`.
  Ownership: upstream fixed; site adopted

- **Templates should receive global.data.js output** (2026-03-24) — **FIXED with a changed API in v12:** [PR #240](https://github.com/bcomnes/domstack/pull/240) was superseded by explicit `dataDeps` and a separate `data` argument, not global-data keys in `vars`. Feeds, tags and topics subscribe directly; `pages[0]` in `global.data.js` is now used for assets, not collection access. See `domstack-issues/09-global-data-not-available-to-templates.md` and the [v12 migration guide](https://github.com/bcomnes/domstack/blob/v12.0.0/docs/migrations/v12-migration.md#global-data-subscriptions-and-page-introspection).
  Ownership: upstream fixed; site adopted

- **PageData.vars getter creates fresh objects on each access** (2026-04-13) — **FIXED/changed in v12:** [PR #242](https://github.com/bcomnes/domstack/pull/242) improved errors and [PR #243](https://github.com/bcomnes/domstack/pull/243) caches the shallow-frozen vars cascade. Write-through is still unsupported; strict-mode assignment throws rather than silently mutating a discarded object. Global data is separate from vars.
  Ownership: upstream fixed; site enriches separate returned records

- **`--copy` for individual files** (2026-03-24) — **DECLINED:** [PR #252](https://github.com/bcomnes/domstack/pull/252) was closed unmerged and [issue #236](https://github.com/bcomnes/domstack/issues/236) is closed as not planned. `--copy` remains directory-only. v12 also offers a native service-worker convention at `/service-worker.js`, but adopting it is a separate decision from this site's `/sw.js` and build-version substitution. See `domstack-issues/10-service-worker-management.md`.
  Ownership: us · Workaround: keep the current build substitution and watch-start copy unless a service-worker migration is deliberately evaluated

- **`--copy <dir>` silently strips the top-level directory — wants a prefix-preserving mode or a loud docs warning** (2026-07-16) — `--copy images` becomes the glob `images/**` handed to cpx2 (`lib/build-copy/index.js`), so files land relative to the glob base: `images/2015-03-15/iosbug.gif` → `public/2015-03-15/iosbug.gif`, never `public/images/…`. Nothing in the docs says the top-level segment is dropped, and on a migration the effect is destructive at a distance: every historical in-content URL under `/images/` and `/media/` on this site 404'd in the built output while the build stayed green (confirmed as a review major, invisible to the pipeline). Given the #252 rejection rationale ("set up the copy dir and whatever structure you want in it"), the flattening is presumably by design — so the ask is either an opt-in prefix-preserving form (e.g. `--copy images:images`) or a prominent docs warning that `--copy` copies *contents*, not the directory.
  **v12 update:** [assets documentation](https://github.com/bcomnes/domstack/blob/v12.0.0/docs/assets/README.md#--copy-directories) now illustrates destination-relative contents, but no prefix-preserving option or explicit flattening warning was found. Ownership: shared · Workaround: double-nest legacy assets and keep the smoke fence

## Bugs

- **Published `.d.ts` files fail `tsc` — every v11 release** (2026-07-11) [degraded] — **Public-entry failures fixed in v12.0.1:** [PR #300](https://github.com/bcomnes/domstack/pull/300) repaired the v12 declarations. Clean packed consumers of both public entries passed TS 6 and TS 7.1 beta with `skipLibCheck: false`; see [PR #32 verification](https://github.com/voxpelli/voxpelli.github.com/pull/32#issuecomment-6841180944). The v11 report remains historical in `domstack-issues/15-broken-dts-under-skiplibcheck.md`.
  **Remaining upstream limitations:** checking every declaration still reports missing `HandlebarsTemplateDelegate` and `@11ty/dependency-tree` types; deep HTML/Markdown builder signatures reject explicit `options: undefined` under `exactOptionalPropertyTypes`. These were not reached by the clean public-entry checks. [PR #331](https://github.com/bcomnes/domstack/pull/331) later removed the packed-consumer matrix. The site's `skipLibCheck` now remains enabled for a different dependency, not DomStack.

- **markdown-it-highlightjs renders bare `<pre><code>` without `.highlight` wrapper** (2026-04-13) [degraded] — **FIXED for v12 defaults:** DomStack's default CSS now imports matching highlight.js light/dark themes, with `pre` overflow supplied by mine.css. The markup remains bare `pre > code.hljs`; the site's custom accessible theme and overflow rules are still intentional.
  Ownership: upstream fixed; site keeps its custom styling

- **HTML builder doesn't strip YAML frontmatter** (2026-03-24) [degraded] — **Still present in v12.0.1:** HTML files render frontmatter as text; current docs describe adjacent vars files. Whether upstream considers HTML frontmatter a supported feature is unverified.
  Severity: degraded · Ownership: upstream · Workaround: full — use `page.vars.js` alongside `page.html`

## Upstream Opportunities

- **Native async-htm-to-string support** (2026-03-24) — **Documentation fixed in v12:** [PR #247](https://github.com/bcomnes/domstack/pull/247) documented the alternative. The bundled v12 default is now `fragtml`, not htm/preact; this site's custom layout still uses async-htm-to-string. See `domstack-issues/14-native-async-htm-to-string-support.md`.
  Source: src/root.layout.js, src/article.layout.js, src/lib/ · Merge readiness: needs-redesign
  Ownership: us · Workaround: full — manual import in each file, permanently

- **Shared filterAndSortPosts helper pattern** (2026-03-24) — Extracted shared post-filtering logic that both `global.data.js` and templates need. DomStack could provide a built-in collection/query API.
  Source: src/lib/posts.js · Merge readiness: proof-of-concept
  Ownership: us · Workaround: full — shared helper in consumer project · [upstream: not yet filed]

## Cross-Vendor Inconsistencies

_No entries yet._

## Trend Reviews

### Review — 2026-11-13

- **v12.0.1 is installed.** The previous release gate and adoption sequence are superseded. The site has adopted public types, `PageInfo.url` and the v12 subscription API.
- **Migration follow-up:** data-dependent posts cannot be pre-rendered while `global.data.js` is resolving; the site now fails the build with the post path and original cause instead of publishing incomplete listings. Supporting those posts requires a different rendering/data design.
- **Watch and output ownership:** ordinary post collections can now be fingerprinted without dropping defined values. DomStack 12.0.1 still leaves obsolete template-owned tag/topic pages in a reused watch output directory; generated-page ownership is a separate possible migration. Production and draft builds clean `public/` first.
- **Declarations:** public-entry checks pass, but the all-declarations and strict optional-property limitations above remain. Keep those distinct from the fixed public-entry failures.

### Review — 2026-07-11

_Historical snapshot; superseded by the v12 review above._

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

Status against `@domstack/static@12.0.1`; historical proposals may have changed shape before release.

| PR | Tracker | v12.0.1 status | Site action |
|---|---|---|---|
| #240 | #235 | **Fixed, API changed** | Adopted `dataDeps`/`data`; do not move collections into `vars`. |
| #241 | #227 | **Fixed** | Public `PageData` and `TemplateOutputOverride` types adopted via `types.js`; broader parameter typing is optional. |
| #250 | #238 | **Fixed** | Both layouts prefer `page.url`; preserve fallbacks for template-created pages. |
| #252 | #236 | **Rejected**, issue closed | Keep the `/sw.js` substitution; evaluate native service-worker support separately. |
| #242 | #233 | **Fixed** | Error context shipped; write-through remains unsupported. |
| #243 | #228 | **Fixed, semantics changed** | Vars are cached and shallow-frozen; keep enrichment in returned data. |
| #244–#246 | #229, #231, #232 | **Fixed** | Rendering, template return types and layout composition documented; v12 no longer passes source `pages` to consumers. |
| #247 | #239 | **Fixed, docs** | Keep custom async-htm-to-string imports; the v12 default is `fragtml`. |
| #249 | #230 | **Fixed** | Default asset loaders shipped; no local `src/esbuild.settings.js` to remove. |
| #251 | #234 | **Fixed** | `testBuild()` and copy path resolution shipped; adoption is optional. |
| #253 | #237 | **Fixed, scope changed** | Generated pages and redirect recipe shipped; the existing redirect template can remain. |

The old release-gated beads `2vy`, `6pz` and `ung` need reconciliation against the work already adopted, not blind execution. The `bpz` copy-file request was rejected.
