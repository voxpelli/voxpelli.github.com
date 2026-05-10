import { expect, test } from '@playwright/test';

test.describe('layout breakpoint at 1024px', () => {
  test('below mobile breakpoint (767px) — single-column stacked layout', async ({ page }) => {
    await page.setViewportSize({ width: 767, height: 768 });
    await page.goto('/');

    const sidebarBox = await page.locator('.sidebar').boundingBox();
    const contentBox = await page.locator('.content-area').boundingBox();

    expect(sidebarBox).toBeTruthy();
    expect(contentBox).toBeTruthy();

    // Stacked: sidebar should be fully above the content area
    // @ts-ignore -- truthy asserted above
    expect(sidebarBox.y + sidebarBox.height).toBeLessThanOrEqual(contentBox.y + 1);
  });

  test('tablet breakpoint (768px) — two-column with narrow sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 768 });
    await page.goto('/');

    const sidebarBox = await page.locator('.sidebar').boundingBox();
    const contentBox = await page.locator('.content-area').boundingBox();

    expect(sidebarBox).toBeTruthy();
    expect(contentBox).toBeTruthy();

    // Side-by-side: sidebar right edge at or before content left edge
    // @ts-ignore -- truthy asserted above
    expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(contentBox.x + 1);

    // Tablet sidebar: approximately 260px (not yet full 340px)
    // @ts-ignore -- truthy asserted above
    expect(sidebarBox.width).toBeGreaterThan(240);
    // @ts-ignore -- truthy asserted above
    expect(sidebarBox.width).toBeLessThan(280);
  });

  test('desktop breakpoint (1024px) — two-column with full-width sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    const sidebarBox = await page.locator('.sidebar').boundingBox();
    const contentBox = await page.locator('.content-area').boundingBox();

    expect(sidebarBox).toBeTruthy();
    expect(contentBox).toBeTruthy();

    // Side-by-side: sidebar right edge at or before content left edge
    // @ts-ignore -- truthy asserted above
    expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(contentBox.x + 1);

    // Desktop sidebar: approximately 340px (design spec)
    // @ts-ignore -- truthy asserted above
    expect(sidebarBox.width).toBeGreaterThan(320);
    // @ts-ignore -- truthy asserted above
    expect(sidebarBox.width).toBeLessThan(360);
  });

  test('sidebar border transitions across breakpoints', async ({ page }) => {
    // Below 768px: sidebar has border-bottom, no border-right (stacked)
    await page.setViewportSize({ width: 767, height: 768 });
    await page.goto('/');

    const bordersMobile = await page.evaluate(() => {
      const el = document.querySelector('.sidebar');
      // eslint-disable-next-line unicorn/no-null -- browser context
      if (!el) return null;

      const styles = getComputedStyle(el);
      return {
        borderBottom: styles.borderBottomWidth,
        borderRight: styles.borderRightWidth,
      };
    });

    expect(bordersMobile).toBeTruthy();
    // @ts-ignore -- truthy asserted above
    expect(Number.parseFloat(bordersMobile.borderBottom)).toBeGreaterThan(0);
    // @ts-ignore -- truthy asserted above
    expect(Number.parseFloat(bordersMobile.borderRight)).toBe(0);

    // At 1024px+: sidebar has border-right, no border-bottom (side-by-side)
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    const bordersDesktop = await page.evaluate(() => {
      const el = document.querySelector('.sidebar');
      // eslint-disable-next-line unicorn/no-null -- browser context
      if (!el) return null;

      const styles = getComputedStyle(el);
      return {
        borderBottom: styles.borderBottomWidth,
        borderRight: styles.borderRightWidth,
      };
    });

    expect(bordersDesktop).toBeTruthy();
    // @ts-ignore -- truthy asserted above
    expect(Number.parseFloat(bordersDesktop.borderBottom)).toBe(0);
    // @ts-ignore -- truthy asserted above
    expect(Number.parseFloat(bordersDesktop.borderRight)).toBeGreaterThan(0);
  });
});
