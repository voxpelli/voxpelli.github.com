Tracks `@playwright/test`, the e2e runner.

## Feature Requests

- **`test.use()` silently swallows unknown option keys** (2026-07-11) — Passing a key that is not a registered fixture option is accepted without error, without warning, and without effect. This is the root cause of the entry below, and it is the more general defect: the failure mode is a suite that goes **permanently green while testing nothing**, which no amount of care at the call site can detect. Nothing surfaces it — not the runner, not the reporter, and not TypeScript when the e2e directory sits outside `tsconfig.include`, as it commonly does. An error (or even a warning) naming the unrecognised key would have turned hours of misdiagnosis into one line of output. Rejecting unknown keys would be a breaking change; a warning would not.
  Ownership: upstream · Workaround: partial — open every emulation-dependent suite with a guard test asserting `matchMedia(...).matches`, which converts the silent no-op into a loud failure. It only works if you remember to write it, which is exactly the property a runtime warning would not have

- **`reducedMotion` / `forcedColors` / `contrast` are not top-level test options, but `colorScheme` is** (2026-07-11) — All four are media emulations of the same shape, yet only `colorScheme` is registered as a `TestOptions` property. The other three are `BrowserContextOptions` and must be routed through `contextOptions`, which is documented (the `contextOptions` docs use `reducedMotion` as their worked example) but easy to get wrong precisely *because* of the asymmetry: `test.use({ colorScheme: 'dark' })` works, so `test.use({ forcedColors: 'active' })` looks like it should. It does not — it is silently dropped (see above). Promoting the three to top-level options would remove the trap and the asymmetry. Verified identical in 1.59.1, 1.60.0 and 1.61.1, so this is longstanding, not a regression. Related: microsoft/playwright#3320 implemented reduced-motion as a context-option-only feature and it was never promoted.
  Ownership: upstream · Workaround: full — `test.use({ contextOptions: { reducedMotion: 'reduce', forcedColors: 'active' } })`

- **`forced-colors` emulation exposes only one canned theme** (2026-07-11) [minor] — Chromium's emulation is accurate in *what* it forces (both `color` and `background-color` are reverted correctly), but the palette is fixed. A real high-contrast user picks their own, including the Windows 11 contrast themes, so there is no way to exercise palette variety — a site can pass the emulated pass and still fail a user's actual theme. Being able to select the emulated palette would make forced-colors testing meaningfully complete.
  Ownership: upstream · Workaround: none — the emulated pass is a floor, not a substitute for real high-contrast testing

## Bugs

_No entries yet._

## Upstream Opportunities

_No entries yet._
