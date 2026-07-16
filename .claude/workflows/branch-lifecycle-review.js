export const meta = {
  name: 'branch-lifecycle-review',
  description: 'Adaptive full-branch lifecycle review: architecture review, novelty validation, intel, best-practice grounding, SWOT, expiring-TODO debt horizon, and knowledge-persistence proposals',
  whenToUse: 'Run on any feature branch in any of the user’s projects before merge. Required args: {today: "YYYY-MM-DD"}. Optional args: {base: "master"|"main"|..., size: "s"|"m"|"l" (default "m"), writeIntel: boolean (default true; people-intel is ALWAYS proposal-only), notes: string (session context appended to review prompts), seed: {novelty?: string[], people?: string[], sources?: object[], intelNote?: string}}. Produces a BRANCH-REVIEW-<date>.md report, a BRANCH-REVIEW-latest.html dashboard (stable filename → stable Artifact URL per repo; the ORCHESTRATOR publishes it via the Artifact tool after loading artifact-design — the workflow only generates the file), and a structured proposal bundle; never writes code, trackers, or non-intel BM notes.',
  phases: [
    { title: 'Orient', detail: 'profile the repo + mechanical inventories' },
    { title: 'Review', detail: 'architecture-altitude review per diff cluster' },
    { title: 'Verify', detail: 'adversarial refutation, three-state verdicts' },
    { title: 'Novelty', detail: 'mine + research the branch’s contestable techniques' },
    { title: 'Intel', detail: 'package/tool/people intel for uncovered targets' },
    { title: 'Grounding', detail: 'current best practices per area' },
    { title: 'SWOT', detail: 'evidence-linked synthesis' },
    { title: 'Debt horizon', detail: 'expiring-TODO proposals (liggare/unicorn DSL)' },
    { title: 'Persistence', detail: 'BM / upstream / synergy / retro proposals' },
    { title: 'Synthesis', detail: 'final report + proposal bundle' },
    { title: 'Artifact', detail: 'self-contained HTML dashboard of the report' },
  ],
}

// ─── Field notes from run 1 (2026-07-16, voxpelli.github.com, size l) ─────────
//
// 55 agents, 0 errors, 14 confirmed / 0 refuted findings incl. two
// irreversible-after-cutover production regressions no line-level review had
// caught. The structural lesson: VERIFICATION stages (refutation-framed) were
// calibrated; GENERATION stages (research-and-report-framed) were credulous —
// every correction the run's output later needed (a single-sourced stat, a
// role claim the commit history contradicted, a retro contradicting its own
// bundle, a latent break inside a proposed CI remedy) came from a stage that
// was never told to attack its own claims.
//
// NOTE: 0-refuted across a whole run is ambiguous — precise finders OR
// under-attacking verifiers. Watch it; if it stays 0 across projects, the
// refuters are re-deriving instead of attacking.
// NOTE: the embedded constants (methodology, DSL, skill contracts) are
// snapshots — regenerate this script when the source notes/skills change;
// nothing detects their drift.
// FIXME(workflow) [review:2026-09-16]: add refutation framing to the GENERATION prompts (novelty researchers, intel, persistence drafters) — "assume your own summary is wrong; verify each load-bearing claim against a primary source before returning it" — and give *validated* novelty verdicts the same recheck that refuted/nuanced ones get. Run-1 evidence above. !p1 #workflow
// TODO(workflow) [review:2026-09-16]: the run cannot re-review its own remedies — a proposed CI fix contained a latent break only a post-hoc advisor pass caught. Add a final re-review phase over the debt/persistence proposals ("fixes are new surface"), or document that the orchestrator must do it. #workflow
// TODO(workflow) [review:2026-12-16]: sizes s and m are unexercised — first small-branch run should sanity-check their caps before trusting them. #workflow

// The harness may deliver args as a JSON-encoded string — normalize before reading.
const ARGS = typeof args === 'string' ? JSON.parse(args) : (args || {})
if (typeof ARGS.today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ARGS.today)) {
  throw new Error('args.today is required as "YYYY-MM-DD" — workflow scripts cannot read the clock, so the caller must supply the date')
}
const TODAY = ARGS.today
const SIZE = (ARGS.size || 'm').toLowerCase()
const WRITE_INTEL = ARGS.writeIntel !== false
const NOTES = ARGS.notes ? `\n## Session context from the invoker\n${ARGS.notes}\n` : ''
const SEED = ARGS.seed || {}

const SIZES = {
  s: { clusters: 3, verifyCap: 0, escalate: false, noveltyRounds: 1, noveltyCap: 4, noveltyRecheck: 0, intelCap: 0, peopleCap: 0, groundingCap: 2, critic: false },
  m: { clusters: 4, verifyCap: 10, escalate: false, noveltyRounds: 1, noveltyCap: 6, noveltyRecheck: 2, intelCap: 3, peopleCap: 1, groundingCap: 3, critic: false },
  l: { clusters: 6, verifyCap: 14, escalate: true, noveltyRounds: 2, noveltyCap: 10, noveltyRecheck: 4, intelCap: 8, peopleCap: 3, groundingCap: 4, critic: true },
}
const CFG = SIZES[SIZE]
if (!CFG) throw new Error(`args.size must be "s", "m" or "l" — got ${SIZE}`)

// ─── embedded constants (stable methodology; refresh by regenerating the script) ──

const GUARD = `
You are one agent inside a multi-agent review workflow. Hard rules:
- Do NOT call advisor(). Do NOT spawn subagents.
- Do NOT edit, create, or delete any file unless your task explicitly says you may.
- Never create, comment on, or modify GitHub issues/PRs, Raindrop bookmarks, or Readwise documents.
- Load any MCP tool you need via ToolSearch (e.g. query "select:mcp__basic-memory__search_notes").
- Your final output is machine-consumed: return it via the structured output tool only.`

const REFUTE = `
Your job is to REFUTE, not to confirm. Default to skepticism: assume each claim is FALSE or
overstated until you have personally reproduced it. Reproduce or reject: every verdict must come
with the exact command you ran (or file:line you read) and what it showed. A green test is not
evidence — where feasible, mutate the code and confirm the test goes red. Report claims you could
NOT refute too, saying what you tried, so a corroboration means something.
Use a THREE-STATE verdict, never a boolean: "contradicted" (you found positive evidence the claim
is wrong), "corroborated" (you positively reproduced/confirmed it), "no-evidence-found" (you could
neither reproduce nor contradict — this is NOT a confirmation).`

const TODO_DSL = `
## Expiring-TODO comment DSL (liggare superset of unicorn/expiring-todo-comments)
Marker terms: TODO, FIXME, XXX. Condition bracket immediately follows the term (or its (scope)).
Conditions (comma-joined allowed):
- [YYYY-MM-DD]              calendar date (max one per comment)
- [review:YYYY-MM-DD]       liggare-only: re-evaluate on date (semantic: review, not drop)
- [never]                   liggare-only: keep indefinitely, never due (documents a decision)
- [+pkg] / [-pkg]           fires when dependency is added / removed
- [pkg@>=1.2.3]             fires when dependency reaches version (scoped @scope/name OK)
- [engine:node@>=24]        fires when engines.node floor reaches range (singular "engine:")
- [>1.0.0]                  fires when THIS package's own version satisfies range (max one)
Optional message decorations (liggare-only, harmless to unicorn): TODO(scope) adjacent scope,
and sub-tags @assignee !priority #area (max one each, whitespace-preceded), e.g.
  TODO(auth) [axe-core@>=4.13]: drop the color-contrast disable — upstream fix shipped !p2 #a11y   (example shown without comment slashes so TODO scanners do not index this script)
SEMANTIC FORK: comma-joined conditions are OR in unicorn (any one fires) but AND in liggare (all
must fire). So: PREFER a single condition per comment. Only comma-join when early firing under
unicorn is acceptable.
AUTHORING RULES: prefer EVENT-BOUND conditions (dep version, dep add/remove, engine) over calendar
dates — bind each debt to the event that retires it. Use [review:] for genuine re-evaluations,
bare dates only for pure calendar rot, [never] for load-bearing decisions worth indexing. No
whitespace inside the bracket. If the repo has neither unicorn nor liggare, the grammar still
costs nothing and becomes machine-readable the day either arrives.`

const BM_RULES = `
## Basic Memory writing rules (non-negotiable)
- Three layers: frontmatter (packages: [name] metadata, snake_case type e.g. npm_package,
  brew_formula), "## Observations" ("- [category] text"; categories: pattern, rule, convention,
  bug, solution, workaround, limitation, gotcha, tip, decision, lesson, evidence, version...),
  "## Relations" (verb-prefixed wiki-links: depends_on [[npm-x]], relates_to [[Title]] — never
  inline in Observations).
- One package per npm/tool note — split and interlink, never combine.
- Directories: npm/, crates/, go/, pypi/, gems/, brew/, casks/, actions/, docker/, vscode/,
  plugins/, people/; cross-package architecture notes go in engineering/.
- FOURTH-WALL RULES (subject-domain notes): every sentence must be about the subject, never about
  the knowledge graph, coverage, Raindrop/Readwise presence, or this session. No "Connection to
  the Knowledge Graph" sections. Lede states what the subject IS. Export test: the paragraph must
  make sense to someone who never heard of Basic Memory.
- VERIFY BEFORE PERSIST: the bar for a note is HIGHER than for a code fix — a wrong note compounds
  via citation. Non-trivial mechanism/attribution/version claims need a primary-source read this
  session; otherwise hedge ("appears to") — never persist the literal word "unverified".
- Memory taxonomy: cross-project reusable knowledge → Basic Memory; project-specific stable
  context → MEMORY.md; context-loss recovery one-liners → bd remember. Never duplicate across.`

const SKILL_CONTRACTS = `
## Proposal contracts (emit EXACTLY these shapes so the orchestrator can apply them via each skill)
UPSTREAM entry (file UPSTREAM-<name>.md; npm scoped: drop @, / becomes --; tools prefixed
brew--/action--/plugin-- etc; sections: Feature Requests | Bugs | Upstream Opportunities):
  Bug:     "- **Title** (YYYY-MM-DD) [blocking|degraded|minor] — what/repro/expected."
           + "  Severity: ... · Ownership: upstream|us|shared · Workaround: none|partial|full — desc"
  Feature: "- **Title** (YYYY-MM-DD) — desired behavior + why it matters here."
  Opportunity: "- **Title** (YYYY-MM-DD) — what was built, upstream value."
           + "  Source: <file|branch> · Merge readiness: direct|needs-redesign|proof-of-concept"
SYNERGY entry (file SYNERGY-<sibling>.md; sections: Shared Patterns | Divergences | Extraction
  Candidates | They Have / We Don't; each entry "- **Title** (YYYY-MM-DD) — desc" + fields like
  "Status: aligned|drifting", "Convergence path: ...", "Readiness: ...", "Priority: adopt-soon|consider|deferred").
SESSION-REFLECT capture: grouped by target note {note_title, is_new, observations:
  [{category ∈ decision|lesson|gotcha|pattern|limitation|breaking, text}]} — text scope-leak-scrubbed
  (no absolute paths, no project file paths in cross-project notes), hedged where unverified.
RETRO draft: sections "### What went well", "### What could improve", "### Upstream observations",
  "### Synergy observations" (omit if no SYNERGY files), "### Lessons learned".
PEOPLE-INTEL proposal: {full_name, descriptor (3-8 words), target_note: "people/<Name> - <Descriptor>",
  key_observations: [{category, text, provenance}] incl [controversy] for contested claims,
  relations_to_add: [{verb, target}]} — anti-hagiography: search criticism, not just bio.`

// ─── schemas ──────────────────────────────────────────────────────────────────

const PROFILE_SCHEMA = {
  type: 'object',
  required: ['repoRoot', 'projectName', 'kind', 'ecosystems', 'baseBranch', 'diffSummary', 'conventions', 'reviewClusters', 'groundingAreas', 'intelTargets'],
  properties: {
    repoRoot: { type: 'string' },
    projectName: { type: 'string' },
    kind: { type: 'string', description: 'e.g. published npm library | app | static site | MCP server | Claude plugin | CLI tool | client project' },
    ecosystems: { type: 'array', items: { type: 'string' }, description: 'npm, cargo, claude-plugin, shell, ...' },
    baseBranch: { type: 'string' },
    branch: { type: 'string' },
    diffSummary: { type: 'string', description: 'files/insertions/deletions + one-line shape of the change' },
    commitCount: { type: 'integer' },
    conventions: {
      type: 'object',
      properties: {
        beads: { type: 'boolean' },
        upstreamFiles: { type: 'array', items: { type: 'string' } },
        synergyFiles: { type: 'array', items: { type: 'string' } },
        retroCount: { type: 'integer' },
        designDocs: { type: 'array', items: { type: 'string' } },
        claudeMdHighlights: { type: 'string', description: 'the 5-10 project rules from CLAUDE.md most relevant to reviewing this branch' },
        unicornActive: { type: 'boolean' },
        liggareAvailable: { type: 'boolean' },
        testCommands: { type: 'array', items: { type: 'string' } },
      },
    },
    reviewClusters: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'paths', 'focus'],
        properties: { name: { type: 'string' }, paths: { type: 'string' }, focus: { type: 'string' } },
      },
      description: 'diff partitioned into review clusters, largest-risk first; ALWAYS include a docs-vs-reality cluster when docs exist',
    },
    groundingAreas: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'question'],
        properties: { name: { type: 'string' }, question: { type: 'string' } },
      },
      description: 'the practice areas this branch most depends on, each with the concrete question to ground',
    },
    intelTargets: {
      type: 'object',
      properties: {
        uncovered: { type: 'array', items: { type: 'object', properties: { target: { type: 'string' }, kind: { type: 'string' }, why: { type: 'string' } } } },
        stale: { type: 'array', items: { type: 'string' } },
        people: { type: 'array', items: { type: 'string' } },
      },
    },
  },
}

const INVENTORY_SCHEMA = {
  type: 'object',
  required: ['todos', 'liggareState'],
  properties: {
    todos: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, line: { type: 'integer' }, text: { type: 'string' }, hasCondition: { type: 'boolean' } } } },
    liggareState: { type: 'string' },
    dueNow: { type: 'array', items: { type: 'string' } },
  },
}

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'title', 'description', 'severity'],
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string', description: 'defect + concrete failure scenario or cost + suggested remedy' },
          severity: { type: 'string', enum: ['critical', 'major', 'minor', 'nit'] },
        },
      },
    },
  },
}

const VERDICT3_SCHEMA = {
  type: 'object',
  required: ['state', 'reasoning'],
  properties: {
    state: { type: 'string', enum: ['contradicted', 'corroborated', 'no-evidence-found'] },
    reasoning: { type: 'string', description: 'what you ran/read and why the claim stands or falls' },
    downgrade: { type: 'string', description: 'optional corrected severity if real but overweighted' },
  },
}

const NOVELTY_SCHEMA = {
  type: 'object',
  required: ['aspects'],
  properties: {
    aspects: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'where', 'claim'],
        properties: {
          name: { type: 'string' },
          where: { type: 'string' },
          claim: { type: 'string', description: 'falsifiable statement external research could confirm or refute' },
        },
      },
    },
  },
}

const RESEARCH_SCHEMA = {
  type: 'object',
  required: ['verdict', 'summary', 'sources'],
  properties: {
    verdict: { type: 'string', enum: ['validated', 'refuted', 'nuanced', 'no-prior-art'] },
    summary: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string', description: 'what, if anything, the branch should change' },
  },
}

const GROUNDING_SCHEMA = {
  type: 'object',
  required: ['area', 'grade', 'assessment'],
  properties: {
    area: { type: 'string' },
    grade: { type: 'string', enum: ['ahead', 'current', 'acceptable', 'lagging'] },
    assessment: { type: 'string' },
    modernizations: { type: 'array', items: { type: 'string' } },
    sources: { type: 'array', items: { type: 'string' } },
  },
}

const SWOT_SCHEMA = {
  type: 'object',
  required: ['strengths', 'weaknesses', 'opportunities', 'threats', 'verdict'],
  properties: {
    strengths: { type: 'array', items: { type: 'string', description: 'each item evidence-linked: claim — evidence (file/finding/source)' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    opportunities: { type: 'array', items: { type: 'string' } },
    threats: { type: 'array', items: { type: 'string' } },
    verdict: { type: 'string', description: 'the one-paragraph merge-readiness judgment' },
  },
}

const TODOS_SCHEMA = {
  type: 'object',
  required: ['proposals'],
  properties: {
    proposals: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'afterLine', 'comment', 'rationale'],
        properties: {
          file: { type: 'string' },
          afterLine: { type: 'integer', description: 'insert the comment after this 1-indexed line' },
          comment: { type: 'string', description: 'the FULL comment line(s), exact DSL grammar, correct comment syntax for the file type' },
          rationale: { type: 'string' },
          condition_kind: { type: 'string', description: 'date|review|never|dep-version|dep-add|dep-remove|engine|package-version' },
        },
      },
    },
  },
}

const PERSIST_SCHEMA = {
  type: 'object',
  required: ['proposals'],
  properties: {
    proposals: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, target: { type: 'string' }, content: { type: 'string' }, fields: { type: 'string' } }, required: ['kind', 'target', 'content'] } },
    skipped: { type: 'string' },
  },
}

const INTEL_SCHEMA = {
  type: 'object',
  required: ['target', 'outcome', 'summary'],
  properties: {
    target: { type: 'string' },
    outcome: { type: 'string', enum: ['note-written', 'note-updated', 'draft-only', 'skipped'] },
    summary: { type: 'string' },
    noteTitle: { type: 'string' },
  },
}

// ─── Phase 0: Orient ─────────────────────────────────────────────────────────

phase('Orient')

// TODO(workflow) [review:2026-09-16]: Orient should also (a) reconcile against the project's issue tracker when one exists (run-1 critic: findings duplicated existing beads with disagreeing counts, and confirmed majors had no bead) and (b) run a supply-chain pass (Socket depscore) over deps the branch adds — both were coverage gaps the critic flagged. #workflow

const baseHint = ARGS.base ? `The caller says the base branch is "${ARGS.base}" — use it.` : 'Detect the base branch: `git symbolic-ref refs/remotes/origin/HEAD` first, then whichever of main/master exists. State which you picked.'

const [profile, inventory] = await parallel([
  () => agent(`Profile the git repository at the current working directory (confirm with \`git rev-parse --show-toplevel\`) so a multi-agent branch review can adapt to it. ${baseHint}
Determine, from evidence (files, package manifests, configs — not guesses):
1. What kind of project this is (published npm library? app? static site? MCP server? Claude plugin/skill collection? Rust crate? client work?) and its ecosystems. A repo can have several.
2. The current branch and the full diff vs the base branch: \`git diff <base>...HEAD --stat\` and the commit list. Summarize the change's shape.
3. Conventions present: .beads/ dir; UPSTREAM-*.md, SYNERGY-*.md, RETRO-*.md files; DESIGN.md/PRODUCT.md; CLAUDE.md (extract the 5-10 rules most relevant to reviewing THIS branch); MEMORY.md. Test/lint commands from package.json scripts / Cargo.toml / Makefile / justfile.
4. Expiring-TODO readiness: is eslint-plugin-unicorn active (check \`npm ls eslint-plugin-unicorn\` or the eslint config chain)? Is the liggare MCP server available (ToolSearch for mcp__liggare__summary)?
5. Partition the diff into at most ${CFG.clusters} REVIEW CLUSTERS, largest-risk first — each {name, paths (glob or list), focus (what an architecture-level reviewer should interrogate there)}. ALWAYS include a docs-vs-reality cluster (README/CLAUDE.md/design docs claims vs code) when docs exist. Never leave changed files out of every cluster; if you must drop some, say so in diffSummary.
6. Propose at most ${CFG.groundingCap} GROUNDING AREAS — the practice domains this branch most depends on (e.g. for an npm library: API design/semver/typed-JS; for a site: CSS architecture/a11y/perf; for an MCP server: protocol conformance/security), each with the concrete question worth grounding against current best practice.
7. INTEL TARGETS: list deps added/changed on this branch plus the project's core toolchain; check each against Basic Memory (mcp__basic-memory__search_notes) → uncovered / stale (note predates a major in use) / covered. Suggest up to ${CFG.peopleCap} people-intel targets (maintainers of load-bearing deps). NEVER suggest the user themselves (git config user.name) as a people target.${SEED.intelNote ? `\nSeed from a prior recon: ${SEED.intelNote}` : ''}${NOTES}${GUARD}`,
    { label: 'orient:profile', phase: 'Orient', model: 'sonnet', effort: 'medium', schema: PROFILE_SCHEMA }),
  () => agent(`Mechanical inventory of deferred-work markers in the repo at the current working directory.
1. Grep for TODO/FIXME/XXX comments across tracked source files (\`git grep -nE "(TODO|FIXME|XXX)"\` — exclude vendored/node_modules). For each: file, line, text (trimmed), and whether it already carries a bracketed condition (\`[...]\` right after the marker).
2. If the liggare MCP server is available (ToolSearch "select:mcp__liggare__scan,mcp__liggare__summary,mcp__liggare__due_todos"): run scan (refresh the index), then summary, then due_todos; report the register state and anything currently due. If unavailable, say so in liggareState.
This is a fixed-pattern sweep whose output feeds a downstream cross-check — do not editorialize.${GUARD}`,
    { label: 'orient:todo-inventory', phase: 'Orient', model: 'haiku', effort: 'low', schema: INVENTORY_SCHEMA }),
])

if (!profile) throw new Error('orientation failed — no profile returned')
log(`profile: ${profile.projectName} (${profile.kind}) — ${profile.diffSummary}`)

const conv = profile.conventions || {}
const PROFILE_BLOCK = `
## Project profile (adapt to THIS, do not assume the previous project)
${JSON.stringify({ projectName: profile.projectName, kind: profile.kind, ecosystems: profile.ecosystems, baseBranch: profile.baseBranch, branch: profile.branch, diffSummary: profile.diffSummary, conventions: conv }, undefined, 1)}
Diff range for all review work: ${profile.baseBranch}...HEAD (run git yourself for the actual content).`

// ─── Phases 1-5 run as parallel flows (independent inputs) ────────────────────

async function reviewFlow () {
  const clusters = (profile.reviewClusters || []).slice(0, CFG.clusters)
  if (!clusters.length) { log('review: no clusters — empty diff?'); return { confirmed: [], refuted: [], unverified: [] } }

  const reviews = await parallel(clusters.map(c => () =>
    agent(`Architecture-altitude review of one cluster of the branch diff (${profile.baseBranch}...HEAD).
Cluster: ${c.name} — paths: ${c.paths}
Focus: ${c.focus}
Review the full branch diff for these paths WITH surrounding-file context. Architecture altitude means: design coherence, cross-file consistency, doc-vs-code drift, dead or unreachable additions, contracts and invariants, security, and violations of the project's own stated rules — NOT style nits the linter would catch. High-confidence findings only; each needs a concrete failure scenario or cost.${NOTES}${PROFILE_BLOCK}${GUARD}`,
      { label: `review:${c.name}`, phase: 'Review', model: 'opus', effort: 'high', schema: FINDINGS_SCHEMA })
      .then(r => (r?.findings ?? []).map(f => ({ ...f, cluster: c.name })))
  ))

  const all = reviews.filter(Boolean).flat()
  log(`review: ${all.length} raw findings across ${clusters.length} clusters`)

  // Dedup across clusters (same file, ~same lines), then verify under the cap.
  const byKey = new Map()
  for (const f of all) {
    const key = `${f.file}#${f.line == null ? f.title.toLowerCase().slice(0, 40) : Math.round(f.line / 5)}`
    if (!byKey.has(key)) byKey.set(key, f)
  }
  const deduped = [...byKey.values()]
  const rank = { critical: 0, major: 1, minor: 2, nit: 3 }
  const sorted = deduped.sort((a, b) => (rank[a.severity] ?? 4) - (rank[b.severity] ?? 4))
  const toVerify = CFG.verifyCap ? sorted.filter(f => f.severity !== 'nit').slice(0, CFG.verifyCap) : []
  const unverified = sorted.filter(f => !toVerify.includes(f))
  if (unverified.length) log(`review: ${unverified.length} findings pass through UNVERIFIED (nits/cap) — labeled as such`)

  phase('Verify')
  const verified = await parallel(toVerify.map(f => () =>
    agent(`Adversarially verify one code-review finding against the repo at the current working directory (branch ${profile.branch}).${REFUTE}
Finding [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ''} — ${f.title}
${f.description}${PROFILE_BLOCK}${GUARD}`,
      { label: `verify:${f.title.slice(0, 34)}`, phase: 'Verify', model: 'opus', effort: 'high', schema: VERDICT3_SCHEMA })
      .then(v => ({ ...f, verdict: v }))
  ))

  // Escalate-on-disagreement: a contradicted/no-evidence verdict on a critical/major
  // finding is a split between two capable agents — route it to a fresh judge.
  let judged = verified.filter(Boolean)
  if (CFG.escalate) {
    const splits = judged.filter(f => f.verdict.state !== 'corroborated' && (rank[f.severity] ?? 4) <= 1).slice(0, 4)
    if (splits.length) {
      log(`verify: ${splits.length} finder/refuter splits on major+ findings — escalating to judges`)
      const rulings = await parallel(splits.map(f => () =>
        agent(`Two agents disagree about a code-review finding; adjudicate on PREMISE VALIDITY — read the code yourself, do not average their confidence.
FINDER claims [${f.severity}]: ${f.file}${f.line ? `:${f.line}` : ''} — ${f.title}: ${f.description}
REFUTER says (${f.verdict.state}): ${f.verdict.reasoning}
Decide which premise fails, with the exact evidence.${PROFILE_BLOCK}${GUARD}`,
          { label: `judge:${f.title.slice(0, 34)}`, phase: 'Verify', model: 'opus', effort: 'xhigh', schema: VERDICT3_SCHEMA })
          .then(v => ({ key: f.title, ruling: v }))
      ))
      const byTitle = new Map(rulings.filter(Boolean).map(r => [r.key, r.ruling]))
      judged = judged.map(f => byTitle.has(f.title) ? { ...f, verdict: { ...byTitle.get(f.title), escalated: true } } : f)
    }
  }

  return {
    confirmed: judged.filter(f => f.verdict.state === 'corroborated'),
    refuted: judged.filter(f => f.verdict.state === 'contradicted'),
    inconclusive: judged.filter(f => f.verdict.state === 'no-evidence-found'),
    unverified,
  }
}

async function noveltyFlow () {
  // FIXME(workflow) [review:2026-09-16]: seeding round 1 anchors the miner — run-1's round 2 came back dry against 13 seeds, indistinguishable from "seeds complete" vs "seeds anchored the search". Hold SEED.novelty back from round 1 (mine blind), then use the seeds only as a round-2 coverage check. #workflow
  const seedNote = SEED.novelty?.length ? `\nSeed candidates from a prior recon (verify these still apply, then EXTEND beyond them): ${SEED.novelty.join('; ')}` : ''
  let aspects = []
  for (let round = 1; round <= CFG.noveltyRounds; round++) {
    const found = await agent(`Round ${round}: inventory the NOVEL, unusual, or contestable techniques this branch (${profile.baseBranch}...HEAD) introduces relative to mainstream current practice — things a thoughtful outside reviewer would either steal or challenge. Read the diff, the project's design/docs files, and test suites. Each aspect: {name, where (file), claim (a falsifiable statement external research could confirm or refute)}.${round > 1 ? `\nAlready found (dig for what these MISS — different files, different layers): ${aspects.map(a => a.name).join('; ')}` : seedNote}${NOTES}${PROFILE_BLOCK}${GUARD}`,
      { label: `novelty:mine-r${round}`, phase: 'Novelty', model: 'opus', effort: 'medium', schema: NOVELTY_SCHEMA })
    const fresh = (found?.aspects ?? []).filter(a => !aspects.some(b => b.name.toLowerCase() === a.name.toLowerCase()))
    if (!fresh.length) { log(`novelty: round ${round} dry`); break }
    aspects.push(...fresh)
  }
  aspects = aspects.slice(0, CFG.noveltyCap)
  if (aspects.length < (SEED.novelty?.length ?? 0)) log(`novelty: capped at ${CFG.noveltyCap} — extras dropped, listed in report inputs`)

  const researched = await parallel(aspects.map(a => () =>
    agent(`Research one technique against current external practice and prior art. Technique: "${a.name}" (${a.where}). Claim to validate or refute: ${a.claim}
Source order: (1) offline Dash docsets via mcp__hyper-mcp__dash-search_documentation; (2) DeepWiki/Context7 for the involved libraries; (3) the user's OWN prior reading — mcp__raindrop__find_bookmarks and mcp__readwise__reader_search_documents; (4) mcp__tavily__tavily_search for current (last ~18 months) authoritative sources. Verdict: validated (matches or beats current practice) / refuted (current practice contradicts it — say what to do instead) / nuanced / no-prior-art (genuinely novel — describe the nearest neighbors).${GUARD}`,
      { label: `novelty:research:${a.name.slice(0, 28)}`, phase: 'Novelty', model: 'sonnet', effort: 'medium', schema: RESEARCH_SCHEMA })
      .then(r => ({ ...a, research: r }))
  ))

  // Re-check the change-driving verdicts (refuted/nuanced) — those spend fix cycles if wrong.
  let results = researched.filter(Boolean)
  const recheck = results.filter(r => r.research && (r.research.verdict === 'refuted' || r.research.verdict === 'nuanced')).slice(0, CFG.noveltyRecheck)
  if (recheck.length) {
    const rechecked = await parallel(recheck.map(r => () =>
      agent(`A researcher judged the technique "${r.name}" (${r.where}) as "${r.research.verdict}": ${r.research.summary} — recommending: ${r.research.recommendation || 'n/a'}. Sources cited: ${(r.research.sources || []).join(' | ')}
${REFUTE}\nCheck the sources actually say what is claimed, and that the recommendation fits THIS project's constraints (read the project's own docs/design rules before agreeing).${PROFILE_BLOCK}${GUARD}`,
        { label: `novelty:recheck:${r.name.slice(0, 26)}`, phase: 'Novelty', model: 'opus', effort: 'high', schema: VERDICT3_SCHEMA })
        .then(v => ({ key: r.name, check: v }))
    ))
    const byName = new Map(rechecked.filter(Boolean).map(x => [x.key, x.check]))
    results = results.map(r => byName.has(r.name) ? { ...r, recheck: byName.get(r.name) } : r)
  }
  return results
}

async function intelFlow () {
  const targets = profile.intelTargets || {}
  const uncovered = (targets.uncovered || []).slice(0, CFG.intelCap)
  const stale = (targets.stale || []).slice(0, Math.max(0, CFG.intelCap - uncovered.length))
  const people = (SEED.people?.length ? SEED.people : (targets.people || [])).slice(0, CFG.peopleCap)
  if (!uncovered.length && !stale.length && !people.length) { log('intel: nothing uncovered or stale — skipping (coverage is complete, not unchecked)'); return [] }
  log(`intel: ${uncovered.length} uncovered, ${stale.length} stale, ${people.length} people (writeIntel=${WRITE_INTEL})`)

  const pkgJobs = [...uncovered.map(u => ({ ...u, mode: 'new' })), ...stale.map(s => ({ target: s, kind: 'unknown', mode: 'refresh' }))]
  const writeClause = WRITE_INTEL
    ? 'You MAY write/update the Basic Memory note directly (mcp__basic-memory__write_note / edit_note) following the rules below — that is your deliverable. Search for an existing note FIRST; update beats duplicate.'
    : 'Do NOT write to Basic Memory — return the complete note draft in your summary instead.'

  return parallel([
    ...pkgJobs.map(j => () =>
      agent(`Package/tool intel for "${j.target}" (${j.kind}, ${j.mode === 'refresh' ? 'existing note is STALE — refresh it' : 'no note exists'}). Research it properly: registry metadata + docs (Dash docsets → DeepWiki → Context7), changelog since the version this project uses, maintenance signals, security posture (mcp__socket-mcp__depscore for npm), and the gotchas THIS project's usage would hit. ${writeClause}${BM_RULES}${GUARD}`,
        { label: `intel:${j.target}`, phase: 'Intel', model: 'sonnet', effort: 'medium', schema: INTEL_SCHEMA })),
    ...people.map(p => () =>
      agent(`People-intel research for: ${p}. Research via DeepWiki (their repos), Tavily, and the user's Raindrop/Readwise libraries. PROPOSAL ONLY — do NOT write to Basic Memory (person notes always get a human check first). Return the proposed note per the people-intel contract below, in the summary field as structured markdown.${SKILL_CONTRACTS}${BM_RULES}${GUARD}`,
        { label: `intel:person:${p.slice(0, 24)}`, phase: 'Intel', model: 'sonnet', effort: 'medium', schema: INTEL_SCHEMA })),
  ])
}

async function groundingFlow () {
  const areas = (profile.groundingAreas || []).slice(0, CFG.groundingCap)
  if (!areas.length) { log('grounding: profiler proposed no areas'); return [] }
  return parallel(areas.map(a => () =>
    agent(`Ground one practice area of this branch in CURRENT best practice (research first, judge second).
Area: ${a.name}. Question: ${a.question}
First read how the branch actually does it (diff ${profile.baseBranch}...HEAD + relevant files). Then research current practice: the user's own Raindrop/Readwise prior reading FIRST, then Dash docsets/DeepWiki/Context7, then Tavily for the current state of the art. Grade the branch: ahead / current / acceptable / lagging — and list concrete modernizations ONLY where they'd pay for themselves in this project (respect its stated constraints and progressive-enhancement style; a fashionable technique the project deliberately rejected is not "lagging" — check design docs before grading).${PROFILE_BLOCK}${GUARD}`,
      { label: `ground:${a.name.slice(0, 28)}`, phase: 'Grounding', model: 'sonnet', effort: 'medium', schema: GROUNDING_SCHEMA })
  ))
}

const [review, novelty, intel, grounding] = await parallel([reviewFlow, noveltyFlow, intelFlow, groundingFlow])

// ─── compact evidence bundle for the synthesis stages ────────────────────────

const EVIDENCE = `
## Evidence bundle (verified this run)
CONFIRMED FINDINGS (${review.confirmed.length}): ${JSON.stringify(review.confirmed.map(f => ({ file: f.file, line: f.line, sev: f.verdict?.downgrade || f.severity, title: f.title })))}
REFUTED (${review.refuted.length}): ${JSON.stringify(review.refuted.map(f => f.title))}
INCONCLUSIVE (${review.inconclusive?.length || 0}) + UNVERIFIED (${review.unverified.length}) — treat as leads, not facts: ${JSON.stringify([...(review.inconclusive || []), ...review.unverified].map(f => ({ file: f.file, sev: f.severity, title: f.title })))}
NOVELTY VERDICTS: ${JSON.stringify((novelty || []).map(n => ({ name: n.name, verdict: n.recheck && n.recheck.state === 'contradicted' ? `${n.research?.verdict} (RECHECK CONTRADICTED: treat cautiously)` : n.research?.verdict, rec: n.research?.recommendation })))}
GROUNDING GRADES: ${JSON.stringify((grounding || []).filter(Boolean).map(g => ({ area: g.area, grade: g.grade, modernizations: g.modernizations })))}
INTEL OUTCOMES: ${JSON.stringify((intel || []).filter(Boolean).map(i => ({ target: i.target, outcome: i.outcome })))}
EXISTING TODOS: ${JSON.stringify((inventory?.todos || []).slice(0, 40))}${inventory?.todos?.length > 40 ? ` (+${inventory.todos.length - 40} more)` : ''}
LIGGARE: ${inventory?.liggareState || 'unknown'}${inventory?.dueNow?.length ? ` — DUE NOW: ${JSON.stringify(inventory.dueNow)}` : ''}`

// ─── SWOT + Debt horizon (parallel — both consume the evidence bundle) ────────

const [swot, debt] = await parallel([
  () => {
    phase('SWOT')
    return agent(`Produce a full SWOT of this feature branch as a merge decision input. Every single item must be evidence-linked — cite a confirmed finding, a novelty verdict, a grounding grade, a file, or an external source; an unlinked assertion is not allowed. Strengths/Weaknesses = internal to the branch as it stands; Opportunities/Threats = external and forward-looking (ecosystem shifts, upstream dependencies' trajectories, maintenance load, rot vectors). Weigh INCONCLUSIVE/UNVERIFIED items as risks-of-unknown, never as facts. End with a one-paragraph merge-readiness verdict.${NOTES}${PROFILE_BLOCK}${EVIDENCE}${GUARD}`,
      { label: 'swot', phase: 'SWOT', model: 'opus', effort: 'xhigh', schema: SWOT_SCHEMA })
  },
  () => {
    phase('Debt horizon')
    return agent(`Forward-looking rot analysis: propose expiring-TODO comments that convert this branch's KNOWN future work into machine-readable tripwires. Today is ${TODAY}.
Sources of debt to bind (read the evidence bundle, then verify each in the code yourself): workarounds waiting on an upstream release; version-pinned decisions; deferred major bumps; expected-failure tests; baseline exceptions; anything the docs call temporary; existing BARE TODOs worth upgrading with a condition (propose the upgraded text; do not count that as new debt).
Grammar readiness in this repo: unicornActive=${conv.unicornActive ?? 'unknown'}, liggareAvailable=${conv.liggareAvailable ?? 'unknown'}.${TODO_DSL}
Each proposal: exact file, afterLine (verify the line exists and the anchor is the right code site), the full comment in the file's comment syntax, rationale, condition_kind. PROPOSE ONLY — never edit files. Prefer few, load-bearing tripwires over blanket coverage; each must name the event or date that genuinely retires the debt.${PROFILE_BLOCK}${EVIDENCE}${GUARD}`,
      { label: 'debt-horizon', phase: 'Debt horizon', model: 'opus', effort: 'high', schema: TODOS_SCHEMA })
      .then(async d => {
        const proposals = d?.proposals ?? []
        if (!proposals.length) return { proposals: [] }
        const check = await agent(`Mechanically validate these proposed TODO comments against the repo and the DSL spec. For EACH: (1) file exists and afterLine is within it and anchors the code the rationale names; (2) the bracket condition parses under the grammar below (flag whitespace-in-bracket, second date, plural "engines:", unknown forms); (3) any named package appears in the manifest for dep-conditions. Return the same list with a "valid": true/false and "problem" field added — change nothing else.${TODO_DSL}
Proposals: ${JSON.stringify(proposals)}${GUARD}`,
          { label: 'debt:validate', phase: 'Debt horizon', model: 'sonnet', effort: 'low', schema: { type: 'object', required: ['proposals'], properties: { proposals: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, afterLine: { type: 'integer' }, comment: { type: 'string' }, rationale: { type: 'string' }, condition_kind: { type: 'string' }, valid: { type: 'boolean' }, problem: { type: 'string' } }, required: ['file', 'comment', 'valid'] } } } } })
        return { proposals: check?.proposals ?? proposals }
      })
  },
])

// ─── Persistence proposals (need everything incl. SWOT) ──────────────────────

phase('Persistence')

const persistJobs = [
  {
    key: 'session-reflect',
    run: true,
    prompt: `Draft the SESSION-REFLECT capture proposal from this branch review: which durable, CROSS-PROJECT insights (decisions, lessons, gotchas, patterns) deserve Basic Memory persistence — as extensions, additions, corrections, or refutations of EXISTING notes. For each candidate: search BM (mcp__basic-memory__search_notes, build_context on candidates) for the most specific existing target note; prefer extending a neighbor over creating new. Scrub scope-leaks (no absolute paths / project file paths), hedge anything not primary-source-verified this run. Emit per the session-reflect contract: kind="bm-capture", target=note title (mark NEW if none fits), content="- [category] text" lines. 3 high-quality observations beat 10 mediocre ones. PROPOSAL ONLY — write nothing.`,
  },
  {
    key: 'upstream',
    run: true,
    prompt: `Draft UPSTREAM-tracker entries from this review: concrete bugs, missing features, or contribution opportunities in third-party packages/tools that this branch's work surfaced (read the evidence bundle; verify each against the code). Check existing UPSTREAM-*.md files first — never duplicate an existing entry. Emit per the upstream contract: kind="upstream-entry", target=exact filename per naming convention, content=the formatted entry line(s) dated ${TODAY}, fields=Severity/Ownership/Workaround. PROPOSAL ONLY.`,
  },
  {
    key: 'synergy',
    run: (conv.synergyFiles?.length ?? 0) > 0,
    prompt: `Draft SYNERGY-tracker entries: cross-project patterns from this branch that sibling projects (see the repo's SYNERGY-*.md files and .claude/synergy-registry.json) should know about — shared patterns worth reciprocating, divergences, extraction candidates. Read the existing SYNERGY files to avoid duplicates and to use the registered sibling names. Emit kind="synergy-entry", target=SYNERGY-<sibling>.md, content=formatted entry dated ${TODAY}, fields=section + status fields. PROPOSAL ONLY.`,
  },
  {
    key: 'retro',
    run: conv.beads === true || (conv.retroCount ?? 0) > 0,
    prompt: `Draft the branch retrospective per the RETRO template (What went well / What could improve / Upstream observations / Synergy observations (omit if no SYNERGY files) / Lessons learned) — synthesized from the evidence bundle and SWOT, written as the project's own retro voice, concrete over generic. Emit one proposal: kind="retro-draft", target=RETRO-<next-number>.md (count existing RETRO-*.md files), content=the full draft. PROPOSAL ONLY.`,
  },
]

// TODO(workflow) [review:2026-09-16]: add a bundle-internal consistency check after these drafters — run-1's retro draft claimed "no new upstream/synergy entries this retro" while the same bundle proposed 13 of them (the drafters run in parallel and never see each other's output). One cheap agent diffing the retro's claims against the sibling proposals catches the class. #workflow
const persistence = await parallel(persistJobs.map(j => () => {
  if (!j.run) { log(`persistence: ${j.key} skipped — convention not present in this repo`); return Promise.resolve({ proposals: [], skipped: j.key }) }
  return agent(`${j.prompt}${SKILL_CONTRACTS}${BM_RULES}${NOTES}${PROFILE_BLOCK}${EVIDENCE}\nSWOT verdict for context: ${swot?.verdict || 'n/a'}${GUARD}`,
    { label: `persist:${j.key}`, phase: 'Persistence', model: 'opus', effort: 'medium', schema: PERSIST_SCHEMA })
}))

// ─── Completeness critic (L only) ─────────────────────────────────────────────

let criticGaps = []
if (CFG.critic) {
  const critic = await agent(`Completeness critic for this branch review. Inputs below. Ask: what is MISSING — a changed area no review cluster covered, a grounding area not run, a novelty claim researched from a single source, an intel target skipped, a debt item with no tripwire, a persistence-worthy insight not proposed, an inconclusive verdict silently treated as settled? Also flag any claim in the bundle that rests on "no evidence found" being read as confirmation. Return a plain list of gaps, most consequential first — findings about coverage, not new object-level review.
Clusters run: ${JSON.stringify((profile.reviewClusters || []).map(c => c.name))}. Grounding run: ${JSON.stringify((grounding || []).filter(Boolean).map(g => g.area))}. Persistence skips: ${JSON.stringify(persistence.filter(p => p?.skipped).map(p => p.skipped))}.${PROFILE_BLOCK}${EVIDENCE}${GUARD}`,
    { label: 'critic', phase: 'Synthesis', model: 'opus', effort: 'high', schema: { type: 'object', required: ['gaps'], properties: { gaps: { type: 'array', items: { type: 'string' } } } } })
  criticGaps = critic?.gaps ?? []
}

// ─── Synthesis ────────────────────────────────────────────────────────────────

phase('Synthesis')

const reportPath = `${profile.repoRoot}/BRANCH-REVIEW-${TODAY}.md`
const synthesis = await agent(`Write the final branch-lifecycle review report to ${reportPath} (you MAY write this one file — it is the run's deliverable; a local working document like RETRO-*.md, not site content and not for publication). Structure:
1. Header: project, branch vs base, date ${TODAY}, run size "${SIZE}", one-paragraph executive summary leading with the merge-readiness verdict.
2. Confirmed findings table (severity, file:line, title) then detail; refuted + inconclusive + unverified in clearly-labeled separate sections (three-state discipline: no-evidence-found is NOT confirmation).
3. Novelty verdicts — validated / refuted / nuanced / no-prior-art, with sources.
4. Best-practice grounding grades + worthwhile modernizations.
5. SWOT (verbatim from input).
6. Debt horizon: the validated TODO proposals as ready-to-paste diff-style blocks, flagged valid/invalid.
7. Knowledge persistence proposals grouped by kind (bm-capture / upstream-entry / synergy-entry / retro-draft) formatted so the user can approve per item.
8. Intel outcomes. ${criticGaps.length ? '9. Coverage gaps (critic): what this run did NOT establish.' : ''}
Be faithful to the inputs — do not invent findings, do not soften refutations, keep every evidence link. End with a short "Suggested next actions" list ordered by leverage.
FULL INPUTS:${PROFILE_BLOCK}${EVIDENCE}
SWOT: ${JSON.stringify(swot)}
DEBT PROPOSALS: ${JSON.stringify(debt?.proposals ?? [])}
PERSISTENCE PROPOSALS: ${JSON.stringify(persistence.filter(Boolean))}
INTEL: ${JSON.stringify((intel || []).filter(Boolean))}
NOVELTY (full): ${JSON.stringify((novelty || []).map(n => ({ name: n.name, where: n.where, verdict: n.research?.verdict, summary: n.research?.summary, recommendation: n.research?.recommendation, sources: n.research?.sources, recheck: n.recheck?.state })))}
GROUNDING (full): ${JSON.stringify((grounding || []).filter(Boolean))}
CRITIC GAPS: ${JSON.stringify(criticGaps)}
Return {reportPath, headline (2-3 sentences), counts (one line)}.${GUARD.replace('Do NOT edit, create, or delete any file unless your task explicitly says you may.', 'You may write ONLY the report file named above.')}`,
  { label: 'synthesis', phase: 'Synthesis', model: 'opus', effort: 'high', schema: { type: 'object', required: ['reportPath', 'headline', 'counts'], properties: { reportPath: { type: 'string' }, headline: { type: 'string' }, counts: { type: 'string' } } } })

// ─── Artifact dashboard (workflow GENERATES the file; the orchestrator publishes
// it via the Artifact tool after loading artifact-design — never from in here) ──

phase('Artifact')

const artifactPath = `${profile.repoRoot}/BRANCH-REVIEW-latest.html`
const artifact = await agent(`Build a self-contained HTML dashboard of this branch review and write it to ${artifactPath} — the ONLY file you may write. It will be published as a default-private web page under a strict CSP: no external requests of any kind — inline all CSS/JS, no webfont URLs (system font stack or data-URI fonts only), no remote images.
Content source: read the markdown report at ${synthesis?.reportPath || reportPath}, plus the structured inputs below.
This is a UI to be scanned, not a document: lead with the merge-readiness verdict and headline counts; severity chips on the findings table; a 2x2 SWOT grid; grounding grades as labeled state (ahead/current/acceptable/lagging); debt tripwires as copyable code blocks; persistence proposals as a checklist grouped by kind; refuted / inconclusive / unverified findings in clearly-labeled separate sections (no-evidence-found is NOT confirmation).
Build rules: set a concise <title> ("Branch review: ${profile.projectName} @ ${TODAY}"); do NOT emit <!DOCTYPE>/<html>/<head>/<body> wrappers (the publisher adds the skeleton) — page content with inline <title> and <style> only; define the palette as custom properties on :root and restyle ONLY via tokens — redefine them under @media (prefers-color-scheme: dark) AND under :root[data-theme="dark"] / :root[data-theme="light"] so the viewer's theme toggle wins in both directions; wide tables/code sit in their own overflow-x:auto containers (the body never scrolls horizontally); font-variant-numeric: tabular-nums where digits align; semantic status colors (good/warn/critical) kept separate from the single accent; visible keyboard focus states; respect prefers-reduced-motion. Avoid the AI-slop defaults: no gradient text, no glassmorphism, no cream-parchment-with-serif reflex, no eyebrow kickers, no hero metrics — dense, quiet, information-first.
Return {path, title}.
STRUCTURED INPUTS: profile ${JSON.stringify({ projectName: profile.projectName, kind: profile.kind, branch: profile.branch, base: profile.baseBranch, diff: profile.diffSummary })}; SWOT ${JSON.stringify(swot)}; confirmed ${JSON.stringify(review.confirmed.map(f => ({ file: f.file, line: f.line, sev: f.verdict?.downgrade || f.severity, title: f.title })))}; refuted ${JSON.stringify(review.refuted.map(f => f.title))}; inconclusive ${JSON.stringify((review.inconclusive || []).map(f => f.title))}; unverified ${JSON.stringify(review.unverified.map(f => ({ sev: f.severity, title: f.title })))}; novelty ${JSON.stringify((novelty || []).map(n => ({ name: n.name, verdict: n.research?.verdict, recheck: n.recheck?.state })))}; grounding ${JSON.stringify((grounding || []).filter(Boolean).map(g => ({ area: g.area, grade: g.grade, modernizations: g.modernizations })))}; debt ${JSON.stringify(debt?.proposals ?? [])}; intel ${JSON.stringify((intel || []).filter(Boolean).map(i => ({ target: i.target, outcome: i.outcome })))}; criticGaps ${JSON.stringify(criticGaps)}${GUARD.replace('Do NOT edit, create, or delete any file unless your task explicitly says you may.', `You may write ONLY ${artifactPath}.`)}`,
  { label: 'artifact', phase: 'Artifact', model: 'opus', effort: 'medium', schema: { type: 'object', required: ['path', 'title'], properties: { path: { type: 'string' }, title: { type: 'string' } } } })

return {
  report: synthesis,
  artifact,
  profile: { projectName: profile.projectName, kind: profile.kind, branch: profile.branch, base: profile.baseBranch, diff: profile.diffSummary },
  confirmed: review.confirmed.map(f => ({ file: f.file, line: f.line, severity: f.verdict?.downgrade || f.severity, title: f.title, description: f.description, verifier: f.verdict?.reasoning })),
  refuted: review.refuted.map(f => ({ title: f.title, why: f.verdict?.reasoning })),
  inconclusive: (review.inconclusive || []).map(f => ({ title: f.title, note: 'no-evidence-found — a lead, not a fact' })),
  unverified: review.unverified.map(f => ({ file: f.file, severity: f.severity, title: f.title })),
  novelty: (novelty || []).map(n => ({ name: n.name, verdict: n.research?.verdict, recommendation: n.research?.recommendation, recheck: n.recheck?.state })),
  grounding: (grounding || []).filter(Boolean),
  swot,
  todoProposals: debt?.proposals ?? [],
  persistenceProposals: persistence.filter(Boolean),
  intel: (intel || []).filter(Boolean),
  criticGaps,
}
