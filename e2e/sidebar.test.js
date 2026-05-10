import { expect, test } from '@playwright/test';

test.describe('Sidebar sticky behavior — desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('sidebar has position sticky', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    const position = await page.evaluate(() => {
      const el = document.querySelector('.sidebar');
      // eslint-disable-next-line unicorn/no-null -- browser context
      return el ? getComputedStyle(el).position : null;
    });

    expect(position).toBe('sticky');
  });

  test('sidebar has appropriate height', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    const box = await sidebar.boundingBox();

    expect(box).toBeTruthy();
    expect(/** @type {NonNullable<typeof box>} */ (box).height).toBeGreaterThan(100);
  });

  test('sidebar remains visible after scrolling', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 1000));

    // Wait for scroll to settle
    await page.waitForTimeout(200);

    const box = await sidebar.boundingBox();

    expect(box).toBeTruthy();
    expect(/** @type {NonNullable<typeof box>} */ (box).y).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Sidebar sticky behavior — mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('sidebar is NOT sticky at mobile viewport', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    const position = await page.evaluate(() => {
      const el = document.querySelector('.sidebar');
      // eslint-disable-next-line unicorn/no-null -- browser context
      return el ? getComputedStyle(el).position : null;
    });

    expect(position).not.toBe('sticky');
  });
});
