import { expect, test } from '@playwright/test';

/**
 * Sticky hover on touch.
 *
 * On a touch device `:hover` is applied on tap and then PERSISTS until the user
 * taps somewhere else. Any hover rule that changes state visibly therefore leaves
 * the element stuck: tap "Subscribe to RSS" and the button stays falu-red and
 * pressed; tap a card and it stays in its hover surface.
 *
 * The fix is `@media (hover: hover)`, so the affordance only exists where hovering
 * does. Keyboard users are unaffected — they are served by `:focus-visible`.
 *
 * Note the sizing side of this is deliberately NOT covered here: touch targets are
 * already 49px (nav) and 44px (theme toggle) even on a wide coarse-pointer device,
 * so `pointer: coarse` sizing rules would be a no-op.
 */

/** The falu-red fill the button takes ON HOVER. */
const HOVER_FILL = 'rgb(140, 33, 33)';

test.describe('hover affordances on a mouse device', () => {
  test('the subscribe button takes its hover state', async ({ page }) => {
    await page.goto('/');

    const btn = page.locator('.btn').first();
    await btn.hover();

    // Sanity: the affordance must still exist where hovering is possible,
    // otherwise the media query would just be deleting the design.
    await expect(btn).toHaveCSS('background-color', HOVER_FILL);
  });
});

test.describe('hover affordances on a touch device', () => {
  test.use({ hasTouch: true, contextOptions: { hasTouch: true, isMobile: false } });

  test('(hover: none) is what a touch device reports', async ({ page }) => {
    await page.goto('/');

    const capability = await page.evaluate(() => ({
      hoverNone: matchMedia('(hover: none)').matches,
      pointerCoarse: matchMedia('(pointer: coarse)').matches,
    }));

    expect(capability.hoverNone, 'the emulation must actually report a touch device').toBe(true);
    expect(capability.pointerCoarse).toBe(true);
  });

  test('tapping the subscribe button does not leave it stuck in hover', async ({ page }) => {
    await page.goto('/');

    const btn = page.locator('.btn').first();
    const resting = await btn.evaluate(el => getComputedStyle(el).backgroundColor);

    // Playwright's .hover() dispatches the same pointer state a tap leaves behind
    // on a touch device. With the rule scoped to (hover: hover), it must be inert.
    await btn.hover();

    await expect(
      btn,
      'the button must not stay falu-red after a tap on a touch device'
    ).toHaveCSS('background-color', resting);
  });

  test('tapping a post card does not leave it stuck on the hover surface', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('.post-card').first();
    const resting = await card.evaluate(el => getComputedStyle(el).backgroundColor);

    await card.hover();

    await expect(card, 'the card must not stay on its hover surface').toHaveCSS('background-color', resting);
  });
});
