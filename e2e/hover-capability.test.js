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

  // Both card types: the `.post-card` fade swap used to sit OUTSIDE
  // `@media (hover: hover)` while the card's own background sat inside it, so on a
  // touch device the fade swapped and the card did not — a band, the same defect as
  // the `.til-card` bug but arriving from the opposite direction.
  for (const card of ['.post-card', '.til-card']) {
    test(`tapping a ${card} does not leave its excerpt fade stuck on the hover surface`, async ({ page }) => {
      await page.goto('/');

      const target = page.locator(`${card}:has(.post-excerpt-fade)`).first();
      const resting = await effectiveSurface(target);

      await target.hover();
      await settle(target);

      expect(
        await fadeTargetColour(target),
        `${card}'s fade must not swap to the hover surface on a device that cannot hover`
      ).toBe(resting);
    });
  }
});

/**
 * The colour a `.post-excerpt-fade` inside `card` actually dissolves into.
 *
 * The computed `background-image` is a resolved gradient, e.g.
 * `linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(233, 229, 222) 100%)` — so the final
 * `rgb(...)` stop IS the colour the excerpt fades out to. Comparing it against the
 * surface the card is actually painting (see effectiveSurface — NOT the card's own
 * `background-color`, which is transparent at rest) is the whole invariant: a fade
 * that dissolves into a colour its card is not showing draws a visible band.
 *
 * @param {import('@playwright/test').Locator} card
 * @returns {Promise<string>} the gradient's final colour stop, as `rgb(r, g, b)`
 */
async function fadeTargetColour (card) {
  const gradient = await card.locator('.post-excerpt-fade')
    .evaluate(el => getComputedStyle(el).backgroundImage);

  const stops = gradient.match(/rgba?\([^)]*\)/g);
  if (!stops?.length) throw new Error(`no colour stops in background-image: ${gradient}`);

  return /** @type {string} */ (stops.at(-1));
}

/**
 * The colour actually painted behind `card`.
 *
 * NOT the same as the card's own `background-color`: at rest the cards paint
 * nothing (`rgba(0, 0, 0, 0)`) and the parchment the reader sees comes from
 * `.layout-wrapper` underneath. Only on hover does a card paint its own surface.
 * So the comparison the fade has to satisfy is against the *effective* surface —
 * walk up until something is actually opaque.
 *
 * @param {import('@playwright/test').Locator} card
 * @returns {Promise<string>} the painted colour, as `rgb(r, g, b)`
 */
async function effectiveSurface (card) {
  return card.evaluate((el) => {
    for (let node = /** @type {Element | null} */ (el); node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    }
    throw new Error('nothing in the ancestor chain paints a background');
  });
}

/**
 * Wait for the card's background-color transition to finish, so the comparison
 * reads a settled colour rather than an interpolated one that exists in no state.
 *
 * @param {import('@playwright/test').Locator} card
 */
async function settle (card) {
  await card.evaluate(el => Promise.all(
    el.getAnimations()
      .filter(a => a instanceof globalThis.CSSTransition)
      .map(a => a.finished)
  ));
}

/**
 * The excerpt fade is a gradient painted ON TOP of its card, dissolving the text
 * into the card's own surface. So its end colour is not free: it must equal
 * whatever the card is painting right now, in every state and on every card type.
 *
 * This used to be asserted twice — once by the card, once by a
 * `.post-card:hover .post-excerpt-fade` override — and the two drifted the moment
 * a second card type existed. `.til-card` hovered to canvas-alt while its fade
 * still dissolved into canvas, banding the excerpt. The card now owns the colour
 * as `--card-surface` and the fade only reads it; these tests pin that.
 */
test.describe('the excerpt fade dissolves into its card', () => {
  for (const card of ['.post-card', '.til-card']) {
    test(`${card}: at rest`, async ({ page }) => {
      await page.goto('/');

      const target = page.locator(`${card}:has(.post-excerpt-fade)`).first();
      const surface = await effectiveSurface(target);

      expect(await fadeTargetColour(target), `${card}'s resting fade must match its resting surface`)
        .toBe(surface);
    });

    test(`${card}: on hover`, async ({ page }) => {
      await page.goto('/');

      // The surface only swaps where hovering exists — the swap is inside
      // `@media (hover: hover)` on purpose, so that a tap does not leave a card
      // stuck on its hover surface. On a touch device there is nothing to assert;
      // the touch-device suite above covers what must NOT happen there.
      const canHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
      test.skip(!canHover, 'no hover surface exists on a device that cannot hover');

      const target = page.locator(`${card}:has(.post-excerpt-fade)`).first();
      const resting = await effectiveSurface(target);

      await target.hover();
      await settle(target);

      const hovered = await effectiveSurface(target);

      // Guard: if the card never actually changed surface, the assertion below
      // would pass for free and prove nothing.
      expect(hovered, `${card} must actually take a hover surface, or this test is vacuous`)
        .not.toBe(resting);

      expect(await fadeTargetColour(target), `${card}'s fade must follow its card onto the hover surface`)
        .toBe(hovered);
    });
  }
});
