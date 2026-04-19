## Feature Requests

- **Per-attribute sanitization hook** (2026-04-19) — Allow consumers to register validators keyed on attribute name (`href`, `src`, `action`, `formaction`) that run before interpolation, rejecting or rewriting unsafe values. Rationale: defense-in-depth against call-site forgetfulness. This project currently requires every `href=${...}` site to remember `safePostUrl(url)` (a scheme-allowlist helper). The default `html` tagged template attribute-escapes `<>`, but does NOT block `javascript:` / `data:` / `vbscript:` schemes — `encodeURI` passes `:` through unchanged. A hook could let the consumer register `{ href: safePostUrl, src: safeSrcUrl }` once and get safe-by-default href interpolation everywhere. See also beads `voxpelli.github.com-dor` (research task quantifying href interpolation exposure in this project).
  Ownership: us · Workaround: full — per-site `safePostUrl(url)` wrapping at every `href=${...}` position in `html` templates

## Bugs

- **Whitespace collapsed between text nodes and interpolations** (2026-03-24) [degraded] — The `html` tagged template collapses whitespace between static text and interpolated values. `html\`Liked ${link}\`` renders as "Likedexample.com" with no space. Requires explicit `$\{' '}` workaround: `html\`Liked${' '}${link}\``. This is likely inherited from htm's HTML-mode whitespace normalization, but surprising for text content where whitespace is meaningful.
  Severity: degraded · Ownership: us · Workaround: full — use explicit `${' '}` between text and interpolations

## Upstream Opportunities

_No entries yet._
