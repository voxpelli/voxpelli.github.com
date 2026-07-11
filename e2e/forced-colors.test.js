import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { WEBMENTION_INJECTED_IMAGES } from './third-party.js';

/**
 * Windows High Contrast Mode (`forced-colors: active`).
 *
 * The user agent replaces the page's colours with a user-chosen system palette.
 * It reverts `color`, `background-color`, `border-color`, `outline-color`, SVG
 * `fill`/`stroke`, `box-shadow`/`text-shadow` (to none) and non-url
 * `background-image` (to none). It does NOT touch `opacity`, `border-width`, or
 * content — those are the cues that survive, and the ones to lean on.
 *
 * EVERY TEST HERE MUST FAIL IF ITS FIX IS REMOVED. That is the discipline of this
 * file, and it was learned the hard way: an earlier version asserted things like
 * "the focus ring is an outline" and "the badge has a text label" — equally true
 * in ordinary rendering. Six of its seven tests passed with forced-colors switched
 * OFF entirely. The suite emulated nothing and proved nothing.
 *
 * Note the bar is MUTATION, not "fails with the emulation off". A defect-gate like
 * the nav test below rightly passes with forced-colors off, because with the user's
 * palette absent there is no defect to catch. What makes it real is that deleting
 * the forced-colors rule it guards turns it red. Each gate here has been checked
 * that way. Beware the cheap version of this mistake: comparing a computed colour
 * ("rgb(44, 42, 40)") against a raw token ("#2c2a28") — different strings, so a
 * `.not.toBe()` passes in every mode and asserts nothing. That bug was written
 * here, in the commit that was supposed to remove exactly this class of bug.
 *
 * `forcedColors` is a BrowserContextOption, NOT a test option — Playwright never
 * registers a `forcedColors` fixture, so `test.use({ forcedColors: 'active' })` is
 * accepted and silently dropped. It must travel via `contextOptions`, exactly as
 * Playwright's own docs for that option show. Same for `reducedMotion` and
 * `contrast`.
 */
test.use({ contextOptions: { forcedColors: 'active' } });

/**
 * Chromium's emulated forced palette. It is a single canned theme (a real Windows
 * user picks their own), so these are exact and deterministic here — and naming
 * them is what makes the assertions below actually about forced colours rather
 * than about string formatting.
 */
const CANVAS_TEXT = 'rgb(0, 0, 0)';
const LINK_TEXT = 'rgb(0, 0, 159)';

/** `--color-ink`, as the browser computes it. Compare rgb with rgb, never with the raw token. */
const OUR_INK = 'rgb(44, 42, 40)';

test.describe('forced-colors: meaning survives without colour', () => {
  test('forced-colors is actually emulated', async ({ page }) => {
    await page.goto('/');
    const active = await page.evaluate(() => matchMedia('(forced-colors: active)').matches);
    expect(active, 'every assertion in this file is vacuous unless forced-colors is on').toBe(true);
  });

  test('the active nav item stays visually distinct from the inactive ones', async ({ page }) => {
    await page.goto('/');

    // THE test for the forced-colors block on .nav-item.active. Without it, the
    // active item is an inverted chip (ink ground, canvas text) — and forced
    // colours revert BOTH properties, so it renders identically to every
    // inactive item and the selected state simply vanishes.
    //
    // Do not replace this with an axe contrast check. axe has no forced-colors
    // awareness (it reads an UNFORCED foreground against a FORCED background),
    // so it passes a nav that has lost its selected state entirely.
    const { active, inactive } = await page.evaluate(() => ({
      active: getComputedStyle(document.querySelector('.nav-item.active')).color,
      inactive: getComputedStyle(document.querySelector('.nav-item:not(.active)')).color,
    }));

    expect(
      active,
      'the selected nav item must not render identically to the unselected ones'
    ).not.toBe(inactive);
  });

  test('the UA really has overridden our palette', async ({ page }) => {
    await page.goto('/');

    // Proves the premise the rest of the file rests on: our authored colours are
    // NOT what gets painted. With the emulation off this is rgb(44, 42, 40) — our
    // ink — so the assertion is genuinely about forced colours.
    const painted = await page.evaluate(() => getComputedStyle(document.body).color);

    expect(painted, 'forced colours must replace our ink with CanvasText').toBe(CANVAS_TEXT);
  });

  test('the webmention glyph is painted with a forced colour, not a baked-in one', async ({ page }) => {
    // The widget replaces `<a class="u-responses">` with its own markup once the
    // mentions arrive, so block the script: the subject here is OUR ::before
    // glyph on OUR element, not the widget's DOM.
    await page.route('**/js/cutting-edge.js', route => route.abort());
    await page.goto('/2019/10/use-type-script-3-7-to-generate/');

    // The glyph must be drawn by masking `background-color` (which forced-colors
    // overrides) — NOT by a url() background-image, which forced-colors leaves
    // alone and which would keep its baked-in fill on a dark high-contrast theme.
    const glyph = await page.evaluate(() => {
      const el = document.querySelector('.u-responses');
      if (!el) return;
      const style = getComputedStyle(el, '::before');
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        maskImage: style.maskImage || style.webkitMaskImage,
        ownColor: getComputedStyle(el).color,
      };
    });

    expect(glyph, '.u-responses should exist on an article').toBeTruthy();
    expect(glyph.maskImage, 'the glyph must be a mask, so its colour is forced').toContain('url(');
    expect(glyph.backgroundImage, 'a url() background-image is NOT forced — it would stay black').toBe('none');

    // The gate. `background-color: currentColor` is NOT enough: forced colours
    // revert background-color to a BACKGROUND system colour (Canvas), so the
    // masked glyph paints white-on-white and vanishes. Delete the
    // `@media (forced-colors: active)` block on .u-responses::before and this
    // goes back to rgb(255, 255, 255) — which is how the bug was found.
    expect(glyph.backgroundColor, 'the glyph must paint in a TEXT colour, not on Canvas').toBe(LINK_TEXT);
    expect(glyph.backgroundColor, 'the glyph must match its link').toBe(glyph.ownColor);
  });

  test('the focus ring survives, and is not our own colour', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    // box-shadow is forced to `none`, so a shadow-based focus ring would vanish.
    // An outline survives — and its colour is forced, which is the half that
    // fails with the emulation off.
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return;
      const style = getComputedStyle(el);
      return {
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });

    expect(focused, 'Tab should move focus to a real element').toBeTruthy();
    expect(focused.outlineStyle, 'focus must not rely on box-shadow').not.toBe('none');
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0);
    // The ring is authored `2px solid var(--color-ink)`. Under forced colours the
    // UA must have replaced that: measured rgb(44,42,40) unforced vs
    // rgba(5,0,73,0.8) forced. Compare rgb with rgb — comparing a computed colour
    // against the raw "#2c2a28" token compares string formats and always passes.
    expect(focused.outlineColor, 'the focus ring must take the forced colour, not our ink').not.toBe(OUR_INK);
  });

  test('the selected theme is marked by border WIDTH, because colour no longer marks it', async ({ page }) => {
    await page.goto('/');

    const toggle = await page.evaluate(() => {
      const host = document.querySelector('theme-toggle');
      const pressed = host?.shadowRoot?.querySelector('button[aria-pressed="true"]');
      const unpressed = host?.shadowRoot?.querySelector('button[aria-pressed="false"]');
      if (!pressed || !unpressed) return;
      const a = getComputedStyle(pressed);
      const b = getComputedStyle(unpressed);
      return {
        pressedBg: a.backgroundColor,
        pressedBorder: Number.parseFloat(a.borderTopWidth),
        unpressedBg: b.backgroundColor,
        unpressedBorder: Number.parseFloat(b.borderTopWidth),
      };
    });

    expect(toggle, 'theme-toggle should render pressed + unpressed buttons').toBeTruthy();
    // Forced colours flatten both buttons onto the same ground, so background
    // cannot say which is selected. (This holds in our own palette too — the
    // buttons never differed by background — so it is an invariant, not a gate.)
    expect(
      toggle.pressedBg,
      'background does not distinguish the selected theme, so something else must'
    ).toBe(toggle.unpressedBg);
    // Which is why the border WIDTH has to: width is never forced. Drop it and a
    // high-contrast user cannot see which theme is active.
    expect(
      toggle.pressedBorder,
      'with colour flattened, only the thicker border marks the selected theme'
    ).toBeGreaterThan(toggle.unpressedBorder);
  });

  test('no critical/serious axe violations in forced-colors mode', async ({ page }) => {
    await page.goto('/');

    // color-contrast is DISABLED here, and must stay disabled: axe-core (4.12)
    // has no forced-colors awareness at all. It reads the foreground from
    // -webkit-text-fill-color, which forced colours do NOT update, and the
    // background from background-color, which they DO — so it compares an
    // unforced foreground against a forced background and reports ratios for a
    // rendering that does not exist. It invented a 1.12:1 "failure" here on
    // colours the browser never painted.
    // Upstream: dequelabs/axe-core#3978, dequelabs/axe-core-npm#1067.
    const results = await new AxeBuilder({ page })
      .exclude(WEBMENTION_INJECTED_IMAGES)
      .disableRules(['color-contrast'])
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(serious).toEqual([]);
  });
});
