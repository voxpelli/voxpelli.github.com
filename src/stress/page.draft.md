---
title: Responsive stress test
date: 2026-04-19
lang: en
category: blog
tags: [stress-test, ai-placeholder]
---

> ⚠️ **Developer-only stress-test page (draft).**
> Not for publication. File is named `page.draft.md` — excluded from the default
> `npm run build`. Include with `npm run build-drafts` for local inspection only.
> Verifies overflow, hyphenation, fluid type, responsive iframes, and print rules.

## Contents

- [Swedish hyphenation check](#swedish-hyphenation-check)
- [Code block with wide line](#code-block-with-wide-line)
- [YouTube iframe (16:9 responsive)](#youtube-iframe-responsive)
- [Wide markdown table](#wide-markdown-table)
- [Figure with caption](#figure-with-caption)
- [Blockquote](#blockquote)
- [Nested lists (3 levels)](#nested-lists)
- [Links](#links)
- [Microformat spot-check](#microformat-spot-check)
- [Dark-mode reminder](#dark-mode-reminder)

This page exercises every known responsive-risk element on the site so that
resizing the viewport catches regressions. <span class="p-category">stress-test</span>
published <time class="dt-published" datetime="2026-04-19">2026-04-19</time>.

**Reviewer reminder:** toggle the theme with the `<theme-toggle>` control in the
sidebar and verify each section below in both light and dark mode. Also test at
375px viewport width and confirm no horizontal overflow via
`document.body.scrollWidth === document.documentElement.clientWidth`.

## H2 — Swedish hyphenation check {#swedish-hyphenation-check}

<!-- tests: [lang="sv"] { hyphens: auto } in src/global.css; pass: Swedish compound words break across lines at 375px without horizontal overflow -->

<section data-stress="typography" data-stress-viewport="mobile">

> **What this tests:** Swedish hyphenation and mixed-script inline runs with heading hierarchy (H2/H3/H4), unbreakable URLs, and inline code.
> **Pass condition:** Swedish compound words hyphenate via `[lang="sv"]` rule; long URLs wrap via `overflow-wrap`; H2/H3/H4 sizes are visibly distinct; no horizontal overflow at 375px.

<p lang="sv">Startupvärldens delningsekonomi och realtidssynkroniseringsprotokoll
kräver järnvägsstationsbyggnader fulla av användarvänlighetsutvärderingar.
Detta är en extremt lång svensk mening med sammansatta ord som testar
`[lang="sv"] hyphens: auto`-regeln på riktigt små skärmar.</p>

### H3 — Unbreakable string / URL

A pathological URL that must wrap via `overflow-wrap`:

https://example.com/a/very/long/path/that/goes/on/and/on/without/natural/break/points/and/should/still/overflow-wrap/even/on/mobile/viewports/at/375px/wide

Inline long token: `supercalifragilisticexpialidocious-and-then-some-more-characters-to-really-force-the-issue`

#### H4 — Inline code and emphasis

Inline `code.with.dots()` inside a sentence, plus *emphasis*, **strong**, and
a mixed-language run: the Swedish term <span lang="sv">användargränssnittsdesign</span>
should hyphenate inline.

</section>

## Code block with wide line {#code-block-with-wide-line}

<!-- tests: pre { overflow-x: auto } in src/global.css; pass: code block scrolls horizontally on narrow viewports without pushing <main> wider than the viewport -->

<section data-stress="content" data-stress-viewport="mobile">

> **What this tests:** Wide `<pre>` blocks and long single-line source code.
> **Pass condition:** `<pre>` scrolls horizontally internally; page itself does not overflow at 375px.

```javascript
// This line is intentionally very long to force horizontal scroll inside the <pre> element without causing overflow on <main>.
const exampleConfigurationObject = { key: 'value', anotherKey: 'another-value', yetAnother: 'and-still-more-content-here-to-exceed-mobile-width' };
function stressTestFunctionWithAVeryLongNameThatShouldNotWrap(firstArgument, secondArgument, thirdArgument) {
  return firstArgument + secondArgument + thirdArgument;
}
```

</section>

## YouTube iframe (16:9 responsive) {#youtube-iframe-responsive}

<!-- tests: .video-embed responsive wrapper in src/global.css; pass: iframe scales to container width and maintains 16:9 aspect ratio at all viewports -->

<section data-stress="content" data-stress-viewport="all">

> **What this tests:** Responsive iframe embedding with aspect-ratio preservation.
> **Pass condition:** iframe fills available width, maintains 16:9, no horizontal overflow on mobile.

<iframe
  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
  title="YouTube embed stress test"
  width="560"
  height="315"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen></iframe>

</section>

## Wide markdown table {#wide-markdown-table}

<!-- tests: .table-wrapper { overflow-x: auto } in src/global.css; pass: 8-column table scrolls horizontally within its wrapper; page does not overflow -->

<section data-stress="content" data-stress-viewport="mobile">

> **What this tests:** Wide tables exceeding viewport width.
> **Pass condition:** Table scrolls horizontally inside its wrapper; page layout unaffected.

| Col A | Col B | Col C | Col D | Col E | Col F | Col G | Col H |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| alpha | beta  | gamma | delta | epsilon | zeta | eta | theta |
| one   | two   | three | four  | five    | six  | seven | eight |
| long-value-alpha | long-value-beta | long-value-gamma | long-value-delta | long-value-epsilon | long-value-zeta | long-value-eta | long-value-theta |

</section>

## Figure with caption {#figure-with-caption}

<!-- tests: figure/figcaption typography and max-width/aspect-ratio image handling; pass: image scales fluidly and caption typography matches design -->

<section data-stress="content" data-stress-viewport="all">

> **What this tests:** `<figure>`/`<figcaption>` typography and fluid image sizing.
> **Pass condition:** Image respects `max-width: 100%`, caption is visually distinct and legible.

<figure>
  <img src="/avatar.jpg" alt="Avatar stress image" style="max-width:100%;height:auto;" />
  <figcaption>A tall image placeholder — verifies <code>max-width</code> /
  <code>aspect-ratio</code> behaviour and caption typography.</figcaption>
</figure>

</section>

## Blockquote {#blockquote}

<!-- tests: blockquote border-left, indent, and spacing in src/global.css; pass: left border visible, spacing consistent in light and dark mode -->

<section data-stress="typography" data-stress-viewport="all">

> **What this tests:** Blockquote chrome (border, indent, spacing) across themes.
> **Pass condition:** Left accent border visible; legible in light and dark mode.

> "The best way to predict the future is to invent it." — a quote used purely to
> validate the blockquote border, indentation, and spacing on both light and
> dark backgrounds.

</section>

## Nested lists (3 levels) {#nested-lists}

<!-- tests: ul ul, ol ol indent and marker styling in src/global.css; pass: 3 levels of nesting are visually distinct with correct indent and markers -->

<section data-stress="typography" data-stress-viewport="all">

> **What this tests:** Nested list indentation and marker styling (ul + ol, 3 levels deep).
> **Pass condition:** Each nesting level is visually distinct; markers render correctly; no overflow.

- Level 1 unordered
  - Level 2 unordered
    - Level 3 unordered — deepest indent
  - Back to level 2
- Another level 1

1. Level 1 ordered
   1. Level 2 ordered
      1. Level 3 ordered — deepest indent
   2. Back to level 2
2. Another level 1

</section>

## Links {#links}

<!-- tests: a::after print rule scope (external gets (href) suffix, in-page anchors do not); pass: print preview shows href only for external links -->

<section data-stress="typography" data-stress-viewport="print">

> **What this tests:** Print stylesheet scoping of `a::after { content: " (" attr(href) ")" }` to external links only.
> **Pass condition:** In print preview, external links gain the `(href)` suffix, in-page anchors do not.

External link with `http(s)://` prefix (print stylesheet should append `(href)`):
visit [the IndieWeb wiki](https://indieweb.org/) for context.

In-page anchor (print stylesheet should NOT append href):
jump to [top of page](#responsive-stress-test) or the
[Swedish section](#swedish-hyphenation-check).

</section>

## Microformat spot-check {#microformat-spot-check}

<!-- tests: microformat consistency — p-category chip styling and dt-published time rendering in src/lib/components/post-metadata.js; pass: category chips styled as tags, dt-published renders as readable timestamp -->

<section data-stress="post-chrome" data-stress-viewport="all">

> **What this tests:** Microformat span/time rendering (`p-category`, `dt-published`) and tag-chip styling.
> **Pass condition:** `.p-category` spans render as styled chips; `<time class="dt-published">` is visually consistent with site metadata conventions.

Tag chips: <span class="p-category">stress-test</span>
<span class="p-category">ai-placeholder</span> published at
<time class="dt-published" datetime="2026-04-19T12:00:00Z">12:00 UTC on 2026-04-19</time>.

</section>

## Dark-mode reminder {#dark-mode-reminder}

<!-- tests: visual check — cannot be automated; pass: reviewer toggles theme and verifies all listed chrome elements remain legible in both modes -->

<section data-stress="layout-motion" data-stress-viewport="all">

> **What this tests:** Manual reviewer checklist for dark-mode parity across chrome elements. Also covers reduced-motion: toggle `prefers-reduced-motion` and verify theme-toggle Shadow DOM animation respects it.
> **Pass condition:** Reviewer confirms each listed surface (background, borders, links, chips, captions) is legible and visually consistent in both light and dark mode; reduced-motion suppresses theme-toggle transitions.

Toggle the theme and verify: background contrast, border colors on
`<blockquote>` / `<pre>` / `<table>`, link color, code-block hljs palette,
`p-category` chip background, and figure caption legibility.

</section>
