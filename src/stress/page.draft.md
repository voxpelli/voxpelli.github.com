---
title: Responsive stress test
date: 2026-04-19
lang: en
category: blog
tags: [stress-test, ai-placeholder]
---

> ⚠️ **Developer-only stress-test page (draft).**
> Not for publication. File is named `page.draft.md` — excluded from the default
> `npm run build`. Include with `npm run build:drafts` for local inspection only.
> Verifies overflow, hyphenation, fluid type, responsive iframes, and print rules.

This page exercises every known responsive-risk element on the site so that
resizing the viewport catches regressions. <span class="p-category">stress-test</span>
published <time class="dt-published" datetime="2026-04-19">2026-04-19</time>.

**Reviewer reminder:** toggle the theme with the `<theme-toggle>` control in the
sidebar and verify each section below in both light and dark mode. Also test at
375px viewport width and confirm no horizontal overflow via
`document.body.scrollWidth === document.documentElement.clientWidth`.

## H2 — Swedish hyphenation check

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

## Code block with wide line

```javascript
// This line is intentionally very long to force horizontal scroll inside the <pre> element without causing overflow on <main>.
const exampleConfigurationObject = { key: 'value', anotherKey: 'another-value', yetAnother: 'and-still-more-content-here-to-exceed-mobile-width' };
function stressTestFunctionWithAVeryLongNameThatShouldNotWrap(firstArgument, secondArgument, thirdArgument) {
  return firstArgument + secondArgument + thirdArgument;
}
```

## YouTube iframe (16:9 responsive)

<iframe
  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
  title="YouTube embed stress test"
  width="560"
  height="315"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen></iframe>

## Wide markdown table

| Col A | Col B | Col C | Col D | Col E | Col F | Col G | Col H |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| alpha | beta  | gamma | delta | epsilon | zeta | eta | theta |
| one   | two   | three | four  | five    | six  | seven | eight |
| long-value-alpha | long-value-beta | long-value-gamma | long-value-delta | long-value-epsilon | long-value-zeta | long-value-eta | long-value-theta |

## Figure with caption

<figure>
  <img src="/avatar.jpg" alt="Avatar stress image" style="max-width:100%;height:auto;" />
  <figcaption>A tall image placeholder — verifies <code>max-width</code> /
  <code>aspect-ratio</code> behaviour and caption typography.</figcaption>
</figure>

## Blockquote

> "The best way to predict the future is to invent it." — a quote used purely to
> validate the blockquote border, indentation, and spacing on both light and
> dark backgrounds.

## Nested lists (3 levels)

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

## Links

External link with `http(s)://` prefix (print stylesheet should append `(href)`):
visit [the IndieWeb wiki](https://indieweb.org/) for context.

In-page anchor (print stylesheet should NOT append href):
jump to [top of page](#responsive-stress-test) or the
[Swedish section](#h2-swedish-hyphenation-check).

## Microformat spot-check

Tag chips: <span class="p-category">stress-test</span>
<span class="p-category">ai-placeholder</span> published at
<time class="dt-published" datetime="2026-04-19T12:00:00Z">12:00 UTC on 2026-04-19</time>.

## Dark-mode reminder

Toggle the theme and verify: background contrast, border colors on
`<blockquote>` / `<pre>` / `<table>`, link color, code-block hljs palette,
`p-category` chip background, and figure caption legibility.
