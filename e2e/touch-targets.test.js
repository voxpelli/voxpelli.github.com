// @ts-check
import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const MIN_TARGET_SIZE = 44;

test.describe('touch target compliance (44px minimum)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
  });

  test('navigation items meet 44x44px minimum', async ({ page }) => {
    const navLinks = page.locator('.nav-item a');
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
