Tracks `plugin:impeccable`, the frontend-design skill (installed as a Claude Code plugin, not an npm dependency).

## Feature Requests

_No entries yet._

## Bugs

- **`critique` mandates parallel sub-agents AND browser use, and they fight over the shared browser — "open your own tab" is not isolation** (2026-07-11) [degraded] — `reference/critique.md` issues two instructions that collide: it *requires* Assessment A and Assessment B to run as isolated parallel sub-agents ("Running them inline is NOT permitted; it is a degraded run"), and it tells each to drive the browser, guarding the collision with only "each assessment creates its own new tab. Never reuse an existing tab." A new tab is not isolation, and the two agents contend for the same page.

  **This is not a Playwright bug.** `critique.md` is tool-agnostic ("browser inspection when available"), and Playwright MCP was merely the browser this harness happened to expose. The flaw is that the skill's isolation story assumes *tabs isolate* — which is false for any shared-singleton browser tool, i.e. essentially every MCP browser (Playwright MCP, Chrome DevTools MCP, Puppeteer MCP). Swap the browser and the race persists.

  Worse, `critique.md:71` actively steers agents *into* the collision: "Prefer the harness's **native**/browser-canvas screenshot path before hand-rolling a Playwright/Puppeteer script; **only fall back to a custom script when no native browser tool is exposed**." That instruction pushes both assessments onto the one shared instance and discourages the isolated scripted browser — which is precisely the workaround that fixes this. The skill's own guidance forbids its own cure.

  Evidence, observed on Claude Code with the bundled Playwright MCP:
  - **Directly observed.** Running `/impeccable critique` per the reference, with A and B both on the MCP browser, the two agents were watched fighting over the browser in real time, navigating the page out from under one another.
  - **The browser is session-global, not agent-scoped.** From the *parent* conversation, `browser_tabs list` returns the tabs a *sub-agent* opened, complete with a single global `(current)` marker.
  - **The tools cannot address a tab.** `browser_navigate` takes `{url}`; `browser_evaluate` takes `{function, target}`. Neither accepts a tab, so both act on an implicit current tab that any concurrent caller can move.

  The failure is **silent**: no error, just a real screenshot of a real page that is not the page you think you are on — and every contrast ratio, overflow check, and computed style in the critique is then quietly attributed to the wrong URL. A critique that reports confident measurements of the wrong page is worse than no critique at all.

  Suggested fix: stop depending on tab isolation. Assign the shared browser exclusively to **one** assessment (A, which needs to *see*: screenshots, visual judgment) and direct the other to drive its own out-of-band instance (B needs *numbers*, and scripting them is both isolated and faster). That requires relaxing the `:71` preference for the native tool when assessments run concurrently. At minimum, stop presenting "create your own new tab" as sufficient isolation, because it is not.

  Severity: degraded · Ownership: upstream · Workaround: full — give one agent the shared browser and have the other launch its own headless instance via a script

- **Every documented script path assumes a vendored install; plugin installs have no `.claude/skills/impeccable/scripts/`** (2026-07-11) [minor] — The skill body and every command reference invoke helpers as `node .claude/skills/impeccable/scripts/<name>.mjs` (`context.mjs`, `context-signals.mjs`, `detect.mjs`, `critique-storage.mjs`, `live-server.mjs`, `palette.mjs`, `pin.mjs`). When impeccable is installed as a *plugin*, that path does not exist in the project — the scripts live under `~/.claude/plugins/cache/impeccable/impeccable/<version>/skills/impeccable/scripts/`. The setup step then reports "The project has no local impeccable scripts", which reads as a project misconfiguration and invites the wrong fix (we were asked whether impeccable should be added as a devDependency; it should not — it is not an npm package). Everything works once you substitute the plugin-cache path, but that path is version-pinned, so it silently rots on plugin upgrade. Suggested fix: resolve helpers relative to the skill's own base directory (the plugin runtime already provides it) rather than hard-coding a project-relative path, or document the plugin-install path alongside the vendored one.
  Severity: minor · Ownership: upstream · Workaround: full — substitute the plugin-cache path in every documented command

## Upstream Opportunities

_No entries yet._
