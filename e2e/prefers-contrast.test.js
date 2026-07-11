import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { WEBMENTION_INJECTED_REGION } from './third-party.js';

/**
 * macOS/iOS "Increase Contrast" — `@media (prefers-contrast: more)`.
 *
 * This is the Apple-platform counterpart to `forced-colors`. Per WebKit, there is
 * no forced-colors mode on iOS, iPadOS, macOS or visionOS at all, so an Apple user
 * asking for more contrast lands here instead. Different mechanism, same intent:
 * the difference is that forced-colors REPLACES the palette, while prefers-contrast
 * asks us to strengthen our own.
 *
 * The site's defaults are deliberately restrained. This suite pins the promise that
 * a user who asks for more actually gets more.
 */

/** Ratios the increased-contrast palette must hit. */
const AAA_TEXT = 7;
const NON_TEXT = 3;

/**
 * Custom properties come back as AUTHORED — i.e. `#53504e`, not `rgb(...)` —
 * because a var() is only resolved to a colour when it's used in a colour
 * property. Accept both, so this works whether we read a token or a real
 * computed style.
 *
 * @param {string} css
 * @returns {[number, number, number]}
 */
function parseRgb (css) {
  const value = css.trim();

  if (value.startsWith('#')) {
    let body = value.slice(1);
    if (body.length === 3) body = [...body].map(char => char + char).join('');
    const n = Number.parseInt(body, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const parts = value.match(/\d+(?:\.\d+)?/g);
  if (!parts || parts.length < 3) throw new Error(`cannot parse colour: ${css}`);
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

/**
 * @param {[number, number, number]} rgb
 * @returns {number}
 */
function luminance (rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function contrast (a, b) {
  const la = luminance(parseRgb(a));
  const lb = luminance(parseRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ canvas: string, inkLight: string, stone: string }>}
 */
function readTokens (page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      canvas: style.getPropertyValue('--color-canvas').trim(),
      inkLight: style.getPropertyValue('--color-ink-light').trim(),
      stone: style.getPropertyValue('--color-stone').trim(),
    };
  });
}

test.describe('prefers-contrast: more (macOS/iOS "Increase Contrast")', () => {
  // NB: `contrast` is a BrowserContext option, NOT a Playwright test option — and
  // neither are `forcedColors` and `reducedMotion` (only `colorScheme` is). Passing
  // any of them to `test.use()` directly is accepted and then SILENTLY IGNORED: the
  // emulation never happens and the test passes while asserting nothing. All three
  // must be routed through `contextOptions`, which IS a real test option. Playwright
  // documents exactly this, using `reducedMotion` as its worked example.
  test.use({ contextOptions: { contrast: 'more' } });

  test('muted text reaches AAA when the user asks for more contrast', async ({ page }) => {
    await page.goto('/');

    const { canvas, inkLight } = await readTokens(page);
    const ratio = contrast(inkLight, canvas);

    expect(
      ratio,
      `--color-ink-light must reach AAA under increased contrast, got ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(AAA_TEXT);
  });

  test('the link underline becomes a perceivable cue', async ({ page }) => {
    await page.goto('/');

    // The default stone underline is only 1.42:1 against the canvas — a valid
    // non-colour cue for WCAG, but barely visible. Under increased contrast it has
    // to clear the 3:1 bar that non-text cues are actually held to.
    const { canvas, stone } = await readTokens(page);
    const ratio = contrast(stone, canvas);

    expect(
      ratio,
      `--color-stone must clear ${NON_TEXT}:1 under increased contrast, got ${ratio.toFixed(2)}:1`
    ).toBeGreaterThanOrEqual(NON_TEXT);
  });

  test('no critical/serious axe violations under increased contrast', async ({ page }) => {
    await page.goto('/2019/10/use-type-script-3-7-to-generate/');

    const results = await new AxeBuilder({ page })
      .exclude(WEBMENTION_INJECTED_REGION)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(serious).toEqual([]);
  });
});

test.describe('prefers-contrast: more must not leak into dark mode', () => {
  test.use({ contextOptions: { contrast: 'more', colorScheme: 'dark' } });

  test('dark keeps its own tokens (the light override must not win the cascade)', async ({ page }) => {
    await page.goto('/');

    // The increased-contrast block redefines :root, so it MUST sit above the
    // dark-mode blocks or it would hand dark users light-mode values. Dark already
    // clears AAA on its own (ink-light is 8.27:1), so it should be untouched.
    const { canvas, inkLight } = await readTokens(page);

    expect(inkLight.toLowerCase(), 'dark must keep its own muted tone').not.toBe('#53504e');
    expect(contrast(inkLight, canvas)).toBeGreaterThanOrEqual(AAA_TEXT);
  });
});
