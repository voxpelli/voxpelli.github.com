// @ts-check
import { test, expect } from '@playwright/test';

test.describe('microformats', () => {
  test('h-feed on homepage contains h-entry children', async ({ page }) => {
    await page.goto('/');
    const hfeed = page.locator('.h-feed');
    await expect(hfeed).toBeVisible();
    const entries = hfeed.locator('.h-entry');
    await expect(entries.first()).toBeVisible();
    expect(await entries.count()).toBeGreaterThan(0);
  });

  test('h-entry on homepage has dt-published and u-url', async ({ page }) => {
    await page.goto('/');
    const entry = page.locator('.h-feed .h-entry').first();
    await expect(entry).toBeVisible();

    const published = entry.locator('.dt-published');
    await expect(published).toBeVisible();
    await expect(published.locator('time[datetime]')).toHaveCount(1);

    const url = entry.locator('a.u-url');
    await expect(url).toBeVisible();
    await expect(url).toHaveAttribute('href', /^\//);
  });

  test('h-card on about page has p-name, u-photo, and p-note', async ({ page }) => {
    await page.goto('/about/');
    const hcard = page.locator('.h-card');
    await expect(hcard.first()).toBeVisible();

    await expect(page.locator('.h-card .p-name').first()).toBeVisible();
    await expect(page.locator('.h-card .u-photo')).toHaveAttribute('src', /.+/);
    await expect(page.locator('.h-card .p-note').first()).toBeVisible();
  });

  test('sidebar h-card has p-name and u-url', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('.sidebar, aside, [role="complementary"]').first();
    await expect(sidebar).toBeVisible();

    const hcard = sidebar.locator('.h-card');
    await expect(hcard).toBeVisible();
    await expect(hcard.locator('.p-name')).toBeVisible();
    await expect(hcard.locator('.u-url').first()).toBeVisible();
  });

  test('article page has webmention endpoint', async ({ page }) => {
    await page.goto('/2019/10/use-type-script-3-7-to-generate/');
    const webmention = page.locator('link[rel="webmention"]');
    await expect(webmention).toHaveCount(1);
    await expect(webmention).toHaveAttribute('href', /.+/);
  });

  test('article page has micropub endpoint', async ({ page }) => {
    await page.goto('/2019/10/use-type-script-3-7-to-generate/');
    const micropub = page.locator('link[rel="micropub"]');
    await expect(micropub).toHaveCount(1);
    await expect(micropub).toHaveAttribute('href', /.+/);
  });

  test('homepage has WebSub hub link', async ({ page }) => {
    await page.goto('/');
    const hub = page.locator('link[rel="hub"]');
    await expect(hub).toHaveCount(1);
    await expect(hub).toHaveAttribute('href', /.+/);
  });

  test('about page has rel=me links', async ({ page }) => {
    await page.goto('/about/');
    const relMe = page.locator('a[rel~="me"]');
    await expect(relMe.first()).toBeVisible();
    expect(await relMe.count()).toBeGreaterThan(0);
  });
});
