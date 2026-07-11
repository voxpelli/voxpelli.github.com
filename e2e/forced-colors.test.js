import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Windows High Contrast Mode (`forced-colors: active`).
 *
 * The user agent replaces the page's colours with a user-chosen system palette.
 * Per MDN, it forces `color`, `background-color`, `border-color`, `outline-color`,
 * SVG `fill`/`stroke` — and, crucially:
 *
 *   - `box-shadow` and `text-shadow` are forced to `none`
 *   - `background-image` is forced to `none` for values that are NOT url-based
 *   - a url() `background-image` is NOT forced, so it keeps its authored colour
 *
 * Two of those bite a site built like this one: the entire depth vocabulary is
 * `box-shadow: 4px 4px 0` (it simply disappears), and the grid ground is a
 * gradient (also dropped). Neither is a defect — buttons keep their 2px borders,
 * and the grid is decorative. What WOULD be a defect is anything whose meaning
 * survives only through colour, or an icon that keeps a colour nobody can see.
 *
 * These tests pin the non-colour cues that carry meaning when colour is taken away.
 */

// `forcedColors` is a BrowserContextOption, NOT a test option — Playwright never
// registers a `forcedColors` fixture, so `test.use({ forcedColors: 'active' })` is
// accepted and silently dropped. It has to travel via `contextOptions`, exactly as
// Playwright's own docs for that option show. Same for `reducedMotion` and `contrast`.
test.use({ contextOptions: { forcedColors: 'active' } });

test.describe('forced-colors: meaning survives without colour', () => {
  test('forced-colors is actually emulated', async ({ page }) => {
    // Guard the premise. Every other assertion in this file happens to hold in
    // ordinary rendering too (a mask is a mask, an outline is an outline), so if
    // the emulation silently stops applying, the suite goes green having tested
    // nothing. It did exactly that until this guard was added.
    await page.goto('/');
    const active = await page.evaluate(() => matchMedia('(forced-colors: active)').matches);
    expect(active, 'this whole file is vacuous unless forced-colors is emulated').toBe(true);
  });

  test('the webmention glyph is painted with a forced colour, not a baked-in one', async ({ page }) => {
    // The widget REPLACES `<a class="u-responses">` with its own markup once the
    // mentions arrive, so this test is racing the element it asserts on: it passes
    // only while the fetch is still in flight. Block the script — the subject here
    // is OUR ::before glyph on OUR element, not the widget.
    await page.route('**/js/cutting-edge.js', route => route.abort());
    await page.goto('/2019/10/use-type-script-3-7-to-generate/');

    // The glyph is a ::before on the no-JS webmention link. It must be drawn by
    // masking `background-color` (which forced-colors overrides) — NOT by a url()
    // background-image, which forced-colors leaves alone and which would keep its
    // black fill on a dark high-contrast theme.
    const glyph = await page.evaluate(() => {
      const el = document.querySelector('.u-responses');
      if (!el) return;
      const style = getComputedStyle(el, '::before');
      return {
        backgroundImage: style.backgroundImage,
        maskImage: style.maskImage || style.webkitMaskImage,
        backgroundColor: style.backgroundColor,
      };
    });

    expect(glyph, '.u-responses should exist on an article').toBeTruthy();
    expect(glyph.maskImage, 'the glyph must be a mask, so its colour is forced').toContain('url(');
    expect(glyph.backgroundImage, 'a url() background-image is NOT forced — it would stay black').toBe('none');
  });

  test('focus indicators stay visible (outline, not box-shadow)', async ({ page }) => {
    await page.goto('/');

    // box-shadow is forced to `none`, so a shadow-based focus ring would simply
    // vanish. Outline survives, because outline-color is forced to a system colour.
    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return;
      const style = getComputedStyle(el);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });

    expect(focused, 'Tab should move focus to a real element').toBeTruthy();
    expect(focused.outlineStyle, 'focus must not rely on box-shadow').not.toBe('none');
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);
  });

  test('the active theme-toggle button is distinguishable without colour', async ({ page }) => {
    await page.goto('/');

    // Its selected state must not rest on colour alone: aria-pressed carries the
    // semantics, and a thicker border carries the visual cue. Border WIDTH is not
    // forced (only border-colour is), so it survives.
    const toggle = await page.evaluate(() => {
      const host = document.querySelector('theme-toggle');
      const pressed = host?.shadowRoot?.querySelector('button[aria-pressed="true"]');
      const unpressed = host?.shadowRoot?.querySelector('button[aria-pressed="false"]');
      if (!pressed || !unpressed) return;
      return {
        pressedBorder: Number.parseFloat(getComputedStyle(pressed).borderTopWidth),
        unpressedBorder: Number.parseFloat(getComputedStyle(unpressed).borderTopWidth),
      };
    });

    expect(toggle, 'theme-toggle should render pressed + unpressed buttons').toBeTruthy();
    expect(
      toggle.pressedBorder,
      'the selected theme must be marked by something other than colour (a thicker border)'
    ).toBeGreaterThan(toggle.unpressedBorder);
  });

  test('post-type badges still say what they are', async ({ page }) => {
    await page.goto('/links/');

    // The badges are colour-coded (cloudberry = link, falu red = release). Forced
    // colours flatten that entirely — so the label has to carry the meaning.
    const badge = page.locator('.post-type-badge').first();
    await expect(badge).toBeVisible();
    await expect(badge).not.toBeEmpty();
  });

  test('the active nav item is marked semantically, not just visually', async ({ page }) => {
    await page.goto('/');

    // aria-current survives any colour treatment the user forces on us.
    await expect(page.locator('a.nav-item[aria-current="page"]')).toHaveCount(1);
  });

  test('no critical/serious axe violations in forced-colors mode', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(serious).toEqual([]);
  });
});
