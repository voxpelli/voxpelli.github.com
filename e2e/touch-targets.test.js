import { expect, test } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
/** A touchscreen laptop: coarse pointer, but a full desktop-width layout. */
const TOUCH_DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MIN_TARGET_SIZE = 44;

test.describe('touch target compliance (44px minimum)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
  });

  test('navigation items meet 44x44px minimum', async ({ page }) => {
    const navLinks = page.locator('a.nav-item');
    const count = await navLinks.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();

      expect(box, `nav link ${i} should have a bounding box`).not.toBeNull();
      // @ts-ignore -- box is guaranteed non-null by the assertion above
      expect(box.width, `nav link ${i} width`).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
      // @ts-ignore
      expect(box.height, `nav link ${i} height`).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
    }
  });

  test('theme toggle buttons meet 44x44px minimum', async ({ page }) => {
    const toggleButtons = page.locator('theme-toggle').getByRole('button');
    const count = await toggleButtons.count();

    if (count === 0) {
      test.skip();
      return;
    }

    for (let i = 0; i < count; i++) {
      const button = toggleButtons.nth(i);
      const box = await button.boundingBox();

      expect(box, `theme toggle button ${i} should have a bounding box`).not.toBeNull();
      // @ts-ignore -- box is guaranteed non-null by the assertion above
      expect(box.width, `theme toggle button ${i} width`).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
      // @ts-ignore
      expect(box.height, `theme toggle button ${i} height`).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
    }
  });

  test('subscribe button meets 44x44px minimum', async ({ page }) => {
    const subscribeButton = page.locator('[data-subtome]');
    const count = await subscribeButton.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const box = await subscribeButton.boundingBox();

    expect(box, 'subscribe button should have a bounding box').not.toBeNull();
    // @ts-ignore -- box is guaranteed non-null by the assertion above
    expect(box.width, 'subscribe button width').toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
    // @ts-ignore
    expect(box.height, 'subscribe button height').toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
  });
});

/**
 * The sizing rules key off viewport WIDTH, not input type — but width is only a
 * proxy for "is this a finger?". A touchscreen laptop has a coarse pointer at a
 * full desktop width, and gets the desktop layout with desktop paddings.
 *
 * We deliberately do NOT ship `@media (pointer: coarse)` sizing rules, because
 * they would be a no-op: the desktop paddings already clear 44px on their own.
 *
 * That is a claim, not a law — and it is a fragile one. The desktop nav padding
 * was trimmed once already (0.875rem -> 0.6875rem, to make the sidebar fit its
 * own viewport), and another trim like that would quietly drop these targets
 * under 44px for every touchscreen-laptop user, with the 375px suite above still
 * passing happily.
 *
 * So the claim is tested rather than asserted in a comment: if the desktop
 * layout ever stops being touch-compliant on its own, this fails — and THAT is
 * the moment to add `@media (pointer: coarse)` rules, not before.
 */
test.describe('touch target compliance on a coarse pointer at desktop width', () => {
  test.use({ hasTouch: true, contextOptions: { hasTouch: true, isMobile: false } });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(TOUCH_DESKTOP_VIEWPORT);
    await page.goto('/');
  });

  test('the browser really does report a coarse pointer here', async ({ page }) => {
    // Guard the premise: if the emulation stops reporting a coarse pointer, the
    // tests below would be silently re-testing an ordinary mouse desktop.
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    expect(coarse, 'this suite is meaningless unless the pointer is coarse').toBe(true);
  });

  test('desktop nav items still meet 44x44px for a finger', async ({ page }) => {
    const navLinks = page.locator('a.nav-item');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await navLinks.nth(i).boundingBox();
      expect(box).toBeTruthy();
      expect(
        box?.height ?? 0,
        'desktop nav padding no longer clears 44px — either restore it, or add ' +
        '@media (pointer: coarse) sizing, which until now has been unnecessary'
      ).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
    }
  });

  test('desktop theme-toggle buttons still meet 44x44px for a finger', async ({ page }) => {
    const buttons = await page.evaluate(() => {
      const host = document.querySelector('theme-toggle');
      const found = host?.shadowRoot?.querySelectorAll('button') ?? [];
      return [...found].map((el) => {
        const rect = el.getBoundingClientRect();
        return { height: rect.height, width: rect.width };
      });
    });

    expect(buttons.length).toBeGreaterThan(0);
    for (const box of buttons) {
      expect(box.height).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
      expect(box.width).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
    }
  });
});
