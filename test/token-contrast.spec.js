/**
 * Token contrast test.
 *
 * `--color-cloudberry-text` exists for exactly one reason: cloudberry is a
 * display accent that fails WCAG AA as small text. That reason lived only in a
 * CSS comment, and a comment does not fail CI — a value solved against the
 * resting canvas silently missed AA on the hover surface by 0.01.
 *
 * axe cannot cover this: it never exercises `:hover` (so it never sees
 * `--color-canvas-alt`), and it returns "incomplete" rather than pass/fail when a
 * background is semi-transparent — which is precisely `.post-type-badge`, whose
 * fill is `color-mix(in oklab, currentColor 10%, transparent)`.
 *
 * So assert it statically: parse the tokens out of global.css and check the real
 * (foreground, background) pairs the token renders on, in both themes.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const AA_NORMAL_TEXT = 4.5;

/** The badge fills its own backdrop with 10% of its text colour. */
const BADGE_TINT_ALPHA = 0.1;

/**
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function parseHex (hex) {
  let body = hex.slice(1);
  // Expand shorthand (#d14 -> #dd1144). The stylesheet uses both forms, and a
  // parser that silently skips one of them would quietly stop guarding tokens.
  if (body.length === 3) {
    body = [...body].map(char => char + char).join('');
  }
  const n = Number.parseInt(body, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * @param {[number, number, number]} rgb
 * @returns {number}
 */
function relativeLuminance (rgb) {
  const [r, g, b] = rgb.map(channel => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/**
 * @param {[number, number, number]} fg
 * @param {[number, number, number]} bg
 * @returns {number}
 */
function contrastRatio (fg, bg) {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Composite a semi-transparent colour over an opaque surface.
 *
 * @param {[number, number, number]} colour
 * @param {number} alpha
 * @param {[number, number, number]} surface
 * @returns {[number, number, number]}
 */
function composite (colour, alpha, surface) {
  return /** @type {[number, number, number]} */ (
    colour.map((c, i) => alpha * c + (1 - alpha) * (surface[i] ?? 0))
  );
}

/**
 * Pull `--token: #hex;` declarations out of a CSS block.
 *
 * @param {string} css
 * @param {string} selector - literal text that opens the block
 * @returns {Record<string, string>}
 */
function tokensIn (css, selector) {
  const start = css.indexOf(selector);
  assert.ok(start !== -1, `Could not find "${selector}" in global.css`);

  const open = css.indexOf('{', start);
  const end = css.indexOf('}', open);
  const body = css.slice(open, end);

  /** @type {Record<string, string>} */
  const tokens = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*(#(?:[0-9a-f]{3}|[0-9a-f]{6}))\s*;/gi)) {
    if (name && value) tokens[name] = value;
  }
  return tokens;
}

// eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed path to our own stylesheet, resolved from import.meta.url; no user input
const css = await readFile(new URL('../src/global.css', import.meta.url), 'utf8');

const themes = {
  light: tokensIn(css, ':root {'),
  dark: tokensIn(css, '[data-theme="dark"] {'),
};

for (const [themeName, tokens] of Object.entries(themes)) {
  test(`--color-cloudberry-text meets WCAG AA on every surface it renders on (${themeName})`, () => {
    const text = tokens['--color-cloudberry-text'];
    assert.ok(text, `${themeName} must define --color-cloudberry-text`);

    const fg = parseHex(text);

    // Surfaces the token actually renders on. .post-type-badge--link sits inside
    // .til-card, which swaps canvas -> canvas-alt on hover, so BOTH must pass.
    const surfaces = [
      ['--color-canvas', tokens['--color-canvas']],
      ['--color-canvas-alt (.til-card:hover)', tokens['--color-canvas-alt']],
    ];

    for (const [label, surfaceHex] of surfaces) {
      assert.ok(surfaceHex, `${themeName} must define the surface for ${label}`);
      const surface = parseHex(surfaceHex);

      // The pill tints its own backdrop with 10% of its text colour, so the
      // effective background depends on the foreground. Check the composite.
      const backdrop = composite(fg, BADGE_TINT_ALPHA, surface);
      const ratio = contrastRatio(fg, backdrop);

      assert.ok(
        ratio >= AA_NORMAL_TEXT,
        `${themeName}: --color-cloudberry-text ${text} on the badge tint over ${label} ` +
        `is ${ratio.toFixed(2)}:1, below WCAG AA ${AA_NORMAL_TEXT}:1. ` +
        'Darken the token — do not relax this threshold.'
      );
    }
  });

  test(`the syntax-highlight palette meets WCAG AA (${themeName})`, () => {
    // Code is text, and it is held to the same 4.5:1 as prose. This was NOT
    // true: in light mode --hl-comment was 2.66:1, --hl-number 3.21:1 and
    // --hl-name 4.39:1. It surfaced as an intermittent axe failure on the one
    // tested page with code blocks — intermittent because axe reports
    // "incomplete" rather than "violation" when it cannot resolve a background,
    // so a real violation flickered in and out of detection and read as flake.
    const hlBg = tokens['--hl-bg'];
    assert.ok(hlBg, `${themeName} must define --hl-bg`);

    const syntaxTokens = [
      '--hl-comment',
      '--hl-string',
      '--hl-number',
      '--hl-name',
      // .hljs-symbol renders on the code background, not the page canvas.
      '--color-cloudberry-text',
    ];

    for (const name of syntaxTokens) {
      const value = tokens[name];
      assert.ok(value, `${themeName} must define ${name}`);

      const ratio = contrastRatio(parseHex(value), parseHex(hlBg));
      assert.ok(
        ratio >= AA_NORMAL_TEXT,
        `${themeName}: ${name} ${value} on --hl-bg ${hlBg} is ${ratio.toFixed(2)}:1, ` +
        `below WCAG AA ${AA_NORMAL_TEXT}:1. Code is text — darken the token.`
      );
    }
  });
}
