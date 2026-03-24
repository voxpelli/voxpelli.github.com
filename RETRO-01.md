## Sprint 1 Retrospective — 2026-03-24

### What went well

- **Branch reconciliation executed cleanly** — 4 progressive claude branches combined into `domstack-migration` with one cherry-pick and zero conflicts. The progressive chain discovery (not independent alternatives) saved significant time.
- **DomStack deep dive yielded critical correction** — discovered `renderInnerPage()` IS available in `global.data.js`, contradicting DeepWiki. Verified against source code and DomStack's own test suite. This unblocks the P1 content fix without upstream changes.
- **Parallel agent research at scale** — 20+ agents launched across the session for enrichment, auditing, design research, and live site comparison. The wave pattern (file-disjoint agents with post-wave gates) worked well even in a research-heavy session.
- **57 lint-clean beads issues** with acceptance criteria, organized into 5 sprint phases. The backlog is comprehensive and actionable.
- **basis-vibe dark mode adaptation** — FOWT prevention, cross-tab sync, and the three-button toggle preference all documented and partially implemented.
- **Comprehensive audit** — 17 initial issues found via manual CSS review, expanded to 57 via Playwright walkthrough + 4 parallel research agents (content, DX, design, live comparison).
- **All 8 smoke tests pass** throughout — no regressions from hardening/dark mode changes.

### What could improve

- **FOWT script broken by htm escaping** — the inline `<script>` added for flash prevention gets HTML-entity-encoded by `async-htm-to-string`. Should have tested immediately after implementation rather than discovering via the Playwright walkthrough later. Lesson: always verify inline scripts render correctly.
- **Agent permission blocks** — 4 of 6 enrichment agents were blocked by MCP tool permissions (Bash, DeepWiki, Tavily denied in subagent context). Had to run those queries from the orchestrator. Known gotcha from Basic Memory but still caused wasted agent launches.
- **DeepWiki reliability** — DeepWiki conflated `global.data.js` with `global.vars.js` and incorrectly stated rendering was unavailable during global data aggregation. Always verify build pipeline claims against actual source code. Filed as a gotcha in the `npm:@domstack/static` BM note.
- **Beads prefix issue** — `bd init` auto-detected `voxpelli.github.com` as the database name, but Dolt doesn't allow dots in database names. Required manual fix to `metadata.json` and `config.yaml`. The `bd init --prefix` flag didn't override the database name.
- **Large uncommitted changeset** — accumulated many changes (hardening, dark mode, CSS, issue enrichment) without committing. Should commit more frequently, especially before launching agents that might self-commit.
- **No upstream tracking files yet** — DomStack friction is documented in `domstack-issues/` but not in UPSTREAM-*.md format. Should set up upstream tracking for `@domstack/static`.

### Upstream observations

No `UPSTREAM-*.md` files exist yet. Key upstream friction points discovered:

- **@domstack/static**: 14 issue drafts in `domstack-issues/` covering: missing type exports (#01), undocumented `global.data.js` (#02), `renderInnerPage` docs (#03), CSS loaders (#04), template return types (#05), layout composition (#06), vars getter resilience (#07), programmatic API (#08), template vars scope (#09), `--copy` for files (#10), redirects (#11), `pageUrl` in layouts (#12), reading time content (#13), async-htm-to-string support (#14)
- **DeepWiki MCP**: Produces structurally incorrect answers about build pipelines — conflates different files, invents constraints that don't exist in source code
- **Beads**: `bd init` database naming from directory names with dots causes Dolt errors

### Lessons learned

- **Verify DeepWiki against source code for internal APIs** — DeepWiki is good for high-level architecture but unreliable for build pipeline ordering and method availability. The `renderInnerPage()` discovery saved the entire content fix approach.
- **Progressive branch chains are common in AI-assisted development** — when multiple Claude sessions build on each other's work, they naturally form chains, not independent alternatives. Check merge bases before assuming conflict.
- **`:has()` on microformat classes is a powerful CSS pattern** — the semantic HTML from IndieWeb markup becomes the styling API directly (`.h-entry:has(.u-in-reply-to)` for replies, `.h-entry:has(.u-bookmark-of)` for bookmarks). No extra CSS classes needed.
- **FOWT prevention needs raw string embedding** — inline `<script>` content must bypass template HTML escaping. Use `rawHtml()` or string concatenation, not `html` tagged templates.
- **Research agents need orchestrator-level MCP access** — subagents often can't access DeepWiki, Tavily, Raindrop due to permission scoping. Run external research from the orchestrator and pass findings to agents.
- **`@satisfies` + `@type {const}` adds real value for page configuration objects** — preserves literal types (`'root'` not `string`) that drive strict equality checks in DomStack's filtering logic.
