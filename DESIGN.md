---
name: voxpelli.com
description: A personal blog built as a technical record kept by hand — grid paper, mono margins, serif prose.
colors:
  canvas: "#f4f1eb"
  canvas-alt: "#e9e5de"
  ink: "#2c2a28"
  ink-light: "#555250"
  falu-red: "#8c2121"
  cloudberry: "#d97714"
  cloudberry-text: "#984200"
  stone: "#d1ccc5"
  stone-light: "#e0dcd5"
  grid: "#e0dcd5"
  canvas-dark: "#1e1d1b"
  canvas-alt-dark: "#2a2826"
  ink-dark: "#cecbc7"
  ink-light-dark: "#bab5ae"
  falu-red-dark: "#e56b6b"
  cloudberry-dark: "#e8941f"
  stone-dark: "#857f78"
typography:
  display:
    fontFamily: "Newsreader, serif"
    fontSize: "clamp(3rem, 2.545rem + 2.273vw, 4.25rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Newsreader, serif"
    fontSize: "clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Newsreader, serif"
    fontSize: "clamp(1.5rem, 1.364rem + 0.682vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Newsreader, serif"
    fontSize: "clamp(1.05rem, 0.98rem + 0.35vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.8rem"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  hairline: "1px"
  chip: "2px"
  control: "4px"
  avatar: "6px"
spacing:
  xs: "clamp(0.5rem, 0.455rem + 0.227vw, 0.75rem)"
  sm: "clamp(0.75rem, 0.682rem + 0.341vw, 1.125rem)"
  md: "clamp(1.125rem, 1.023rem + 0.511vw, 1.6875rem)"
  lg: "clamp(1.5rem, 1.364rem + 0.682vw, 2.25rem)"
  xl: "clamp(2.25rem, 2.045rem + 1.023vw, 3.375rem)"
components:
  button-primary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "0.875rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.falu-red}"
    textColor: "{colors.canvas}"
  input-url:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "{spacing.xs}"
  nav-item:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1rem"
  badge-link:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.cloudberry-text}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "0.1em 0.4em"
---

# Design System: voxpelli.com

## 1. Overview

**Creative North Star: "The Field Notebook"**

A technical record, kept by hand, and warmed by the paper it's kept on. The page is ruled like
engineering grid paper. The margins are annotated in monospace — dates, tags, reply-verbs, syndication
links — while the prose itself is set in a serif and left alone to be read. The mono is the
*annotation layer*; the serif is the *record*. Keeping those two voices distinct is the whole system.

This is not a terminal and not a document viewer. Every technical signal — the grid, the mono
metadata, the 2px structural rules, the hard-edged controls — is held against warmth that comes from
*material and culture*, not from a beige background: falu red is the pigment on Swedish barns,
cloudberry is a Nordic berry. That specificity is what keeps the system out of the cream-and-serif
lane it would otherwise fall into.

It explicitly rejects the four lanes named in PRODUCT.md: the **siloed blog platform** (rented chrome,
interstitials, signup modals over the content), the **corporate dev-marketing blog** (gradient CTA,
stock hero, "Book a demo"), the **AI-slop content farm** (SEO filler and generated prose), and — the
near miss, the one it has to work hardest to avoid — the **brutalist/terminal dev blog**, which shares
the standards-seriousness but throws away every ounce of the warmth.

**Key Characteristics:**
- Grid-paper ground; monospace margins; serif prose. Three voices, never blurred.
- Near-square geometry (1–6px radii). Structure is carried by **borders**, never by soft shadows.
- Depth is *physical*: hard, unblurred offsets that you press an element into.
- Fluid everything — type and spacing scale with the viewport via `clamp()`.
- Two full themes. Dark is designed, not inverted.

## 2. Colors

A warm-neutral ground with two Nordic pigments used sparingly, and a strict ink ramp doing nearly all
the work.

### Primary
- **Falu Red** (`#8c2121`; dark `#e56b6b`): The site's one true accent — the pigment on Swedish barns
  and cottages. It appears on link hover, on release badges, and as the sidebar's border in dark mode.
  It is *never* a background fill for large areas. Its rarity is what makes it read as deliberate.

### Secondary
- **Cloudberry** (`#d97714`; dark `#e8941f`): The Nordic berry. A *display* accent — borders, the
  left-edge card rule, the external-link glyph, code-syntax symbols. It carries emphasis where falu red
  would be too loud.
- **Cloudberry Text** (`#984200`; dark `#e8941f`): The AA-safe sibling of the above, and the only one
  permitted for small text. Raw cloudberry is a display colour: at 12.8px it reaches just 2.6:1 on the
  canvas and fails AA outright. See The Two Cloudberries Rule.

### Neutral
- **Canvas** (`#f4f1eb`; dark `#1e1d1b`): The ground. A warm-neutral paper tone — and a *ground only*
  (see The Earned Warmth Rule).
- **Canvas Alt** (`#e9e5de`; dark `#2a2826`): The raised surface — hovered cards, code blocks.
- **Ink** (`#2c2a28`; dark `#cecbc7`): Body text and the 2px structural border. Sits at 12.7:1 (light)
  and 10.4:1 (dark) — comfortably AAA.
- **Ink Light** (`#555250`; dark `#bab5ae`): Secondary and metadata text.
- **Stone / Stone Light** (`#d1ccc5` / `#e0dcd5`; dark `#857f78` / `#6e6862`): Hairline borders,
  dividers, underlines, and the cast shadow.
- **Grid** (`#e0dcd5`; dark `#2a2826`): The ruled paper background itself. The quietest line in the
  system, and the one that names it.

### Named Rules

**The Earned Warmth Rule.** The canvas tint carries *no warmth on its own* — it is a ground, nothing
more. Warmth is earned by falu red, by cloudberry, and by the serif. Audit test: mentally strip the
accents and the serif. If the page still reads as "warm and editorial", the warmth was coming from the
beige, and the beige is generic. Fix the accents, never deepen the background.

**The Two Cloudberries Rule.** `--color-cloudberry` is for **borders and display**;
`--color-cloudberry-text` is for **small text**. Never use the display colour on text — it fails WCAG AA
below ~18px. This is not advisory: `test/token-contrast.spec.js` fails the build if the text variant
drops below 4.5:1 against every surface it renders on (including the hover surface, which axe cannot
reach).

**The One Accent Rule.** Falu red is the only accent that gets to be loud, and it stays under ~10% of
any view. Two competing loud accents is how this becomes the corporate dev blog.

**The System Colour Rule.** In `forced-colors: active` the user's palette replaces ours, and it replaces
it *by role*: `color` becomes a text colour, `background-color` becomes a **background** colour. So a
property inherits the meaning of the property, not the meaning you intended — `background-color:
currentColor` on a masked glyph does not become the text colour, it becomes **Canvas**, and the glyph
paints white-on-white and disappears. Whenever a colour has to survive, **name the role you mean**:
`CanvasText` for text, `LinkText` inside a link, `Highlight` / `HighlightText` for a selected item.
Never re-name our own tokens there — they would simply be reverted again. Two properties are *never*
forced and are therefore the only reliable non-colour cues: **`opacity`** and **`border-width`**.
(Corollary: a decorative `opacity: 0.7` survives into a palette chosen for maximum contrast and quietly
eats it — take it back to `1`.) Audit test: if a rule inside `@media (forced-colors: active)` mentions a
`--color-*` token, it is wrong. Enforced by `e2e/forced-colors.test.js`, where every assertion is
checked by mutation: delete the rule it guards and the test must go red.

## 3. Typography

**Display Font:** Newsreader (serif) — also the *body* font, unusually
**Body Font:** Newsreader (serif), with Public Sans (sans) for UI chrome
**Label/Mono Font:** JetBrains Mono

**Character:** Three voices on a genuine contrast axis, each with a job. The **serif is the record** —
headings and article prose, the thing you came to read. The **sans is the chrome** — nav labels,
buttons, profile text; it stays out of the way. The **mono is the margin** — dates, tags, badges,
reply verbs, code. Blurring these (mono body copy, serif buttons) collapses the notebook metaphor
instantly.

### Hierarchy
- **Display** (700, `clamp(3rem → 4.25rem)`, lh 0.9, ls -0.04em): The brand wordmark in the sidebar and
  the global h1. Tight leading and negative tracking; it's a masthead, not a heading.
- **Headline** (700, `clamp(1.75rem → 2.5rem)`): Article `h1`, about-page title.
- **Title** (600, `clamp(1.5rem → 1.875rem)`): Post titles in index listings.
- **Body** (400, `clamp(1.05rem → 1.2rem)`, lh 1.6): Article prose. Serif. **Capped at 65ch** — the
  measure is not negotiable, it is the reason the layout exists.
- **Label** (400, 0.8rem, ls 0.08em, uppercase): Mono metadata — dates, tags, badges, "READ FULL NOTE".

### Named Rules

**The Three Voices Rule.** Serif = the record. Sans = the chrome. Mono = the margin. A voice used for
the wrong job is a bug, not a style choice.

**The 65ch Rule.** Article text never exceeds a 65ch measure, at any viewport. Reading is the product;
everything else in the layout is negotiable, this is not.

## 4. Elevation

**There is no soft elevation in this system, and there never will be.** Structure is carried entirely
by **borders** — 2px ink for structural edges, 1px stone for decorative ones — and by the grid ground.
Nothing floats, nothing glows, nothing is frosted.

The one shadow in the vocabulary is not an elevation at all: it is a **physical offset**, and its
purpose is to be pressed.

### Shadow Vocabulary
- **Rest** (`box-shadow: 4px 4px 0 var(--color-btn-shadow)`): A hard offset. No blur radius. No alpha.
  The element sits *above* the paper, casting a solid block, the way a physical key does.
- **Hover** (`box-shadow: 2px 2px 0` + `transform: translate(2px, 2px)`): The element travels *into*
  its own shadow. It has moved, not brightened.
- **Active** (`box-shadow: 0 0 0` + `transform: translate(4px, 4px)`): Fully pressed. The shadow is
  gone because the element is now flat on the paper.

Applied to buttons and to the webmention form's submit control. Easing is `--ease-spring`
(`cubic-bezier(0.175, 0.885, 0.32, 1.1)`), which gives the press a little mechanical overshoot.

### Named Rules

**The Displacement Rule.** Depth is communicated by **displacement, never diffusion**. Shadows are hard
offsets — never blurred, never translucent — and interactive depth is expressed by *movement*: press an
element and it travels into its own shadow. Soft, ambient, or glowing shadows are **forbidden**. Audit
test: if a `box-shadow` contains a blur radius or an `rgba()`, it does not belong in this system.

**The Shadow Is Not Load-Bearing Rule.** In Windows High Contrast (`forced-colors: active`),
`box-shadow` is forced to `none` — so the entire depth vocabulary above simply *disappears*. That is
acceptable, but only because nothing depends on it: every control that casts a shadow also carries a
**2px border**, and the press is also a `transform`. Never let a shadow be the *only* thing that makes
an element perceivable, bounded, or focused. (This is why focus rings use `outline` — `outline-color`
is forced and survives; a `box-shadow` focus ring would vanish.) Enforced by `e2e/forced-colors.test.js`.

## 5. Components

The governing character is **restrained and editorial**: components recede so the writing leads. Chrome
is quiet, interaction is *felt* rather than announced. Nothing on this site should look like it wants
to be clicked more than the prose wants to be read.

### Buttons
- **Shape:** Effectively square — a 1px hairline only (`--rounded.hairline`). No pill shapes, ever.
- **Primary:** Canvas background, ink text, a heavy 2px ink border, sans at 600 weight,
  `0.875rem 1.5rem` padding. Reads as a *key* to be pressed, not a call-to-action to be sold.
- **Hover / Focus:** Fills with falu red, text flips to canvas, and the element translates 2px into its
  own shadow (see Elevation). Focus-visible gets a real, visible ring — never `outline: none`.

### Chips
Used for post-type badges (LINK / TIL / RELEASE).
- **Style:** A 2px-radius outline chip whose border *is* `currentColor`, with a background of
  `color-mix(in oklab, currentColor 10%, transparent)` — so the chip tints itself from its own text
  colour. Mono, uppercase, 0.08em tracking.
- **State:** Colour encodes the type — cloudberry-text for links, falu red for releases, ink/stone for
  TIL. Because the fill derives from the text colour, **changing the text colour changes the backdrop**;
  contrast must be solved against that composite, not against the canvas.

### Cards / Containers
- **Corner Style:** Square. Cards are delimited by rules, not radii.
- **Background:** Canvas at rest; **Canvas Alt** on hover (this hover surface is a real contrast
  surface — see The Two Cloudberries Rule).
- **Shadow Strategy:** None. See Elevation. A card that floats is a bug.
- **Border:** 1px stone dividers; a 3px inset cloudberry rule on the left edge marks bookmark cards.
- **Internal Padding:** `--space-md` → `--space-lg`.

### Inputs / Fields
- **Style:** 1px stone stroke, canvas background, **mono** type (it is data being entered, not prose),
  `--space-xs` padding, capped at `min(100%, 30rem)`.
- **Focus:** A visible focus ring. Never suppressed.

### Navigation
- **Style:** Mono, `0.75rem 1rem` padding, 4px radius — the softest geometry in the system, because
  these are the only things you *aim* at. Minimum 44×44px touch target, enforced by e2e test.
- **States:** Active item carries `aria-current="page"` and a falu-red marker; hover nudges on the
  x-axis. The mobile drawer is a full-viewport overlay driven by `aria-expanded` — never
  `<details>/<summary>`.
- **Active item, in forced colours:** the active item is an *inverted chip* (ink ground, canvas text),
  and forced colours revert **both** properties — so the inversion evaporates and the selected item
  renders identically to every unselected one. It is restored with the system pair for a selected item,
  `background-color: Highlight; color: HighlightText`. Three redundant signals carry "current page":
  the colour inversion, the `.nav-arrow` (revealed by `opacity`, which is never forced), and
  `aria-current`. *(The System Colour Rule.)*

### Signature Component: the sidebar
A full-height column carrying the wordmark, an h-card, the nav, subscribe, and the notbyai badge.
**It is a landmark, and it must never scroll.** If its content outgrows the viewport, the fix is to
*reduce the content* or let the page scroll it — an inner scrollbar is forbidden, and above a
height guard it sticks; below it, it goes static. Enforced by `e2e/sidebar.test.js`.

## 6. Do's and Don'ts

### Do:
- **Do** keep the three voices separate: serif for prose, sans for chrome, mono for the margin.
- **Do** cap article measure at **65ch**. Reading is the product.
- **Do** express depth as **displacement** — hard `4px 4px 0` offsets and a real press.
- **Do** use `--color-cloudberry-text` (`#984200`) for any cloudberry **text**, and plain
  `--color-cloudberry` only for borders and display.
- **Do** give links inside prose a **non-colour cue** (an underline). Colour alone is never the carrier.
- **Do** design dark mode as its own theme. It is not an inversion.
- **Do** let structure be carried by **borders** — 2px ink, 1px stone.
- **Do** name the **role** in forced colours — `CanvasText`, `LinkText`, `Highlight` / `HighlightText` —
  never one of our own tokens, which would just be reverted again. *(The System Colour Rule.)*
- **Do** treat any state carried by an inversion (light text on a dark chip) as **lost** in forced
  colours, and give it a second cue that isn't colour — `opacity` and `border-width` are the only two
  properties the user's palette never touches.

### Don't:
- **Don't** add a blurred or translucent `box-shadow`. If it has a blur radius or an `rgba()`, it is
  not this system. *(The Displacement Rule.)*
- **Don't** let a `box-shadow` be the only thing bounding, elevating, or focusing an element — it is
  forced to `none` in high-contrast mode. *(The Shadow Is Not Load-Bearing Rule.)*
- **Don't** paint an icon with a `url()` `background-image`. Those are the one thing forced-colors does
  NOT override, so the icon keeps a colour nobody can see. Mask the shape and colour it with
  `background-color: currentColor`, which adapts to dark mode for free.
- **Don't** then assume that masked icon survives forced colours, because it does not.
  `background-color` **is** reverted — but *to a background colour* (`Canvas`), not to the text colour —
  so the glyph paints white-on-white and disappears entirely. Add a `@media (forced-colors: active)`
  block naming a **text** system colour (`LinkText` inside a link, otherwise `CanvasText`), and reset any
  decorative `opacity` to `1`. *(The System Colour Rule.)* This exact bug shipped once and was invisible
  until the forced-colors tests were made honest.
- **Don't** ship a `:hover` rule that changes state without gating it on `@media (hover: hover)`. On
  touch, `:hover` sticks after a tap — the button stays pressed, the card stays lit. *(The press is
  the signature; a press that won't let go is a bug.)* Keyboard users are served by `:focus-visible`,
  never by `:hover`.
- **Don't** reach for `@media (pointer: coarse)` sizing. It's a no-op here — the paddings already clear
  44px at every width — and `e2e/touch-targets.test.js` measures that on a coarse pointer at desktop
  width. Add it the day that test goes red, not before.
- **Don't** deepen the background to make the page feel warmer. The beige earns nothing — warmth comes
  from falu red, cloudberry, and the serif. *(The Earned Warmth Rule.)*
- **Don't** put raw `--color-cloudberry` on small text. It fails WCAG AA and the build will fail with it.
- **Don't** give the sidebar an inner scrollbar. Ever.
- **Don't** reach for pills, `rounded-lg`, gradient CTAs, stock hero illustration, or "Book a demo" —
  that is the **corporate dev-marketing blog**, an explicit anti-reference.
- **Don't** add signup modals, interstitials, or "clap"-style affordances over the content — that is the
  **siloed blog platform** this site exists to be the opposite of.
- **Don't** go monospace-everything and black-on-white. That is the **brutalist/terminal dev blog** —
  the near miss. It keeps the rigour and throws away the warmth, and warmth is the differentiator.
- **Don't** ship generated prose, SEO filler, or stock imagery. That is the **AI-slop content farm**,
  and the notbyai badge in the sidebar is a standing promise against it.
