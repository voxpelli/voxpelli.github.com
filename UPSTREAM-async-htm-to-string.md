## Feature Requests

_No entries yet._

## Bugs

- **Whitespace collapsed between text nodes and interpolations** (2026-03-24) [degraded] — The `html` tagged template collapses whitespace between static text and interpolated values. `html\`Liked ${link}\`` renders as "Likedexample.com" with no space. Requires explicit `$\{' '}` workaround: `html\`Liked${' '}${link}\``. This is likely inherited from htm's HTML-mode whitespace normalization, but surprising for text content where whitespace is meaningful.
  Severity: degraded · Ownership: us · Workaround: full — use explicit `${' '}` between text and interpolations

## Upstream Opportunities

_No entries yet._
