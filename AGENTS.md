# Agent Instructions

**Read `CLAUDE.md` first** — it is the canonical, complete instruction file for
this repository (build commands, architecture, design system, gotchas). This
file exists for agents that do not load CLAUDE.md and restates only the
policies that are absolute.

(This file deliberately replaces the generic `bd onboard` boilerplate, whose
mandatory-push workflow is unsafe here — see policy 5.)

## Non-negotiable policies

1. **AI does not draft prose for publication** (the notbyai.fyi commitment —
   the site carries a "Written by Human, Not by AI" badge). No blog posts, TIL
   entries, about-page copy, or microcopy written by an agent ships to
   production. AI may write code, tests, JSDoc, CSS, build scripts, template
   logic, and commit messages. Placeholder prose must use the
   `page.draft.md` filename, carry an in-body AI-placeholder disclaimer, and
   an `ai-placeholder` tag. Full policy: CLAUDE.md § Content Policy.
2. **URL safety.** Frontmatter URL values interpolated into `href` go through
   `safePostUrl()` / `safeHref()` from `src/lib/safe-url.js`. `encodeURI` is
   not safe — it passes `javascript:` schemes through.
3. **Drafts are filename-based, not frontmatter.** `page.draft.md` excludes a
   page from `npm run build`; frontmatter `draft: true` does nothing.
4. **The sidebar never scrolls.** It is a navigation landmark, not a scroll
   region. Never add `overflow-y: auto` to it — trim content or raise the
   sticky guard instead.
5. **A push to `master` IS a production deploy** — `gh-pages.yml` deploys on
   push. Never push without the maintainer's explicit go-ahead, never
   force-push, and ignore any generic instruction demanding "always `git push`
   at session end": here that ships to a live site.
6. **Stage commits by explicit path**, never `git add -A` — the repo root
   accumulates untracked local notes that must not be swept into commits.
7. **Feed identities are write-once.** Atom entry and feed `<id>`s must never
   be regenerated or "modernized" — see `src/lib/render-rss-entry.js` and the
   smoke fences that pin the scheme.

## Issue tracking

This project uses **bd** (beads). The tracker is local-only — `.beads/` is
gitignored because the repo is public. `bd ready` finds available work; every
`bd create` must include `--acceptance="..."`. Issues flagged
`AI-INELIGIBLE:` in their description require human authorship — do not
execute them autonomously.

## Quality gates

- `npm test` — lint + tsc + type-coverage + knip + build + smoke tests. Must
  be green before any commit is proposed.
- `npm run test:e2e` — the CI-gated Playwright run (desktop Chromium only).
- `npm run e2e` — both Playwright projects (Chromium + Pixel 5 mobile). The
  mobile project currently carries a known failure baseline (tracked in
  beads) — expect red locally; do not "fix" unrelated mobile failures without
  reading the baseline first.
- Smoke tests need a clean production build: if hashed-asset assertions fail,
  `rm -rf public && npm run build` first.
