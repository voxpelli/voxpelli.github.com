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
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * @param {[number, number, number]} rgb
 * @returns {number}
 */
function relativeLuminance (rgb) {
  const [r, g, b] = rgb.map(channel => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
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
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)) {
    if (name && value) tokens[name] = value;
  }
  return tokens;
}

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

  test(`--color-cloudberry-text meets WCAG AA as code-syntax text (${themeName})`, () => {
    // .hljs-symbol renders on the code-block background, not the page canvas.
    const text = tokens['--color-cloudberry-text'];
    const hlBg = tokens['--hl-bg'];
    assert.ok(text && hlBg, `${themeName} must define --color-cloudberry-text and --hl-bg`);

    const ratio = contrastRatio(parseHex(text), parseHex(hlBg));
    assert.ok(
      ratio >= AA_NORMAL_TEXT,
      `${themeName}: --color-cloudberry-text ${text} on --hl-bg ${hlBg} is ` +
      `${ratio.toFixed(2)}:1, below WCAG AA ${AA_NORMAL_TEXT}:1.`
    );
  });
}
