## Feature Requests

_No entries yet._

## Bugs

- **Sub-tag parser captures whitespace-preceded `#word` from prose and strips it from the stored message** (2026-07-16) [minor] — a TODO comment whose *message text* contains an issue reference like `PR #241 (merged …)` or `— #3978 is milestoned …` has that token parsed as the `#area` sub-tag and REMOVED from the persisted comment: the register stored `"PR (merged 2026-05-24, unreleased) exports PageData…"` (the `#241` gone, now living in `sub_tags.area: "241"`). Reproduced on 0.6.0 against this repo's first real posting — 4 of 8 entries lost an issue number from their message this way. The parser's own source comment (`lib/core/scanner/sub-tag-pattern.js`) already flags "narrowing those is the separate prefix-dialect matter under brand review"; this is concrete field evidence for that narrowing: issue-reference `#digits` (and probably any `#word` followed by more prose rather than end-of-comment) is far likelier to be prose than an area tag. Suggested narrowing: only capture sub-tags in trailing position, or exclude all-digit captures.
  Severity: minor · Ownership: upstream · Workaround: partial — write issue refs unprefixed ("PR 241") or accept the sub-tag capture; the original text survives in the source file either way

## Upstream Opportunities

_No entries yet._
