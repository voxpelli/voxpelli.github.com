Tracks `axe-core` (and its `@axe-core/playwright` wrapper), used for the
automated WCAG gate in `e2e/`.

## Feature Requests

_No entries yet._

## Bugs

- **`color-contrast` is unusable under `forced-colors: active`** (2026-07-11) [degraded] — axe has no forced-colors awareness at all (`grep forced` in axe-core 4.12.1 returns nothing). It reads the foreground from `-webkit-text-fill-color`, which forced-colors mode does **not** update, and the background from `background-color`, which it **does** — so it compares two colours drawn from two different renderings and reports contrast failures on pairs the browser never painted. Measured here: axe claimed `#f4f1eb` on `#ffffff` (1.12:1) for a nav item Chromium was actually painting `rgb(0,0,159)` on white (~8.6:1). The browser is not at fault — Chromium's emulation forces both properties correctly. The damage is worse than a false positive: the bogus reading was the *only* thing gating our forced-colors nav fix, so a no-op fix passed it green, and an eventual upstream fix would silently disarm the gate. Any real forced-colors contrast check has to assert computed system colours (`CanvasText`, `LinkText`, `Highlight`…) directly. [upstream: dequelabs/axe-core#3978, dequelabs/axe-core-npm#1067 — both already open, no action needed from us beyond watching]
  Severity: degraded · Ownership: upstream · Workaround: full — `.disableRules(['color-contrast'])` on forced-colors scans, and assert the computed system colours directly (`e2e/forced-colors.test.js`)

## Upstream Opportunities

_No entries yet._
