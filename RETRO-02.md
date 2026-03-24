## Sprint 1 Wave Execution Retrospective — 2026-03-24

### What went well

- **3 waves, 15 issues closed, zero regressions** — all 13 smoke tests pass throughout. Each wave built on the previous cleanly.
- **renderInnerPage() discovery was the session's biggest win** — unlocked the P1 content fix (empty social/links pages) without upstream DomStack changes. Approach D (async page functions) was cleaner than all alternatives.
- **Review agents caught real bugs** — Wave 3 code-reviewer found skip-link position:absolute (should be fixed) and unnecessary try/catch masking errors. Both fixed before closing the wave.
- **Atomic commits maintained** — each fix got its own commit with clear message. Wave 3 had 6 atomic commits vs Wave 1-2's batched commits.
- **File-disjoint constraint worked naturally** — SSG files (pages, layouts, templates, CSS, tests) map cleanly to separate agents. Zero merge conflicts across 3 waves.
- **Post-wave gate discipline improved** — Wave 3 included review agents (skipped in Waves 1-2). Memory note saved to maintain this discipline.

### What could improve

- **Waves 1-2 skipped review agents** — caught the gap mid-sprint. Added review agents in Wave 3 and found 2 real bugs. Should have followed the checklist from the start.
- **No background research agent per wave** — the checklist calls for one per wave to feed the backlog. Skipped all 3 waves. Should add in future sprints.
- **Labels not applied to issues** — 60 issues with no labels. The checklist says "categorize immediately after creating." Need to batch-add domain labels.
- **FOWT script broken by htm encoding** — should have verified inline script output immediately after writing it, not discovered it via Playwright later. Test inline scripts by checking rendered HTML.
- **Agent permission blocks waste time** — 4 enrichment agents blocked by MCP permissions. Known issue from BM notes but still burned agent launches. Run external research from orchestrator.

### Upstream observations

- **@domstack/static**: HTML builder doesn't strip YAML frontmatter (confirmed, worked around with page.vars.js). pageUrl not available in layouts (P0, needs upstream fix). 14 issue drafts enriched and ready to file.
- **webmention.herokuapp.com**: cutting-edge.js renders [object Object] for some webmentions. Third-party bug — can't fix locally.
- **async-htm-to-string**: html tagged template entity-encodes inside <script> tags. Documented as gotcha in BM note.

### Lessons learned

- **Review agents are non-negotiable** — they find CSS/HTML bugs that pass lint, tsc, and all automated tests. The skip-link position:absolute bug would have shipped without review.
- **Inline scripts need rawHtml()** — htm's auto-escaping is a feature for HTML but a bug for JavaScript. Always use rawHtml() for <script> content in async-htm-to-string.
- **page.vars.js is the HTML page escape hatch** — when DomStack's HTML builder doesn't support frontmatter, create a page.vars.js alongside the page.html. Clean separation of content and metadata.
- **Shared helpers prevent drift immediately** — extracting filterAndSortPosts() in Wave 3 prevents the next person from changing the filter in one place and forgetting the other. Do this as soon as duplication is spotted, not later.
- **Microformat placement matters** — h-feed on <html> is technically non-standard. Microformat parsers are forgiving but the correct placement is on a body container element.
