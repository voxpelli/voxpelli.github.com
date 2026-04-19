// @ts-check
import { test, expect } from '@playwright/test';

// Enable JS discovery — the hamburger only activates when the <html class="no-js">
// has been replaced with `.js` by global.client.js. We rely on that happening
// during page load; no special setup required.

test.describe('Mobile hamburger menu — 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking hamburger opens drawer and sets aria-expanded=true', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    const drawer = page.locator('#nav-drawer');

    await hamburger.click();

    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveClass(/is-open/);
  });

  test('body scroll is locked when drawer is open on mobile', async ({ page }) => {
    await page.goto('/');

    // Before opening: body overflow should not be "hidden"
    const overflowBefore = await page.evaluate(() => document.body.style.overflow);
    expect(overflowBefore).not.toBe('hidden');

    await page.locator('.hamburger-btn').click();

    const overflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(overflowAfter).toBe('hidden');
  });

  test('Escape key closes the drawer and restores focus to hamburger', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-drawer')).not.toHaveClass(/is-open/);

    // Focus restored to hamburger trigger
    const focusedIsHamburger = await page.evaluate(() =>
      document.activeElement?.classList.contains('hamburger-btn') ?? false);
    expect(focusedIsHamburger).toBe(true);

    // Scroll lock released
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).not.toBe('hidden');
  });

  test('clicking outside the drawer closes it', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Click on main content (outside sidebar/drawer/hamburger)
    await page.locator('#main-content').click({ position: { x: 20, y: 20 } });

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-drawer')).not.toHaveClass(/is-open/);
  });

  test('clicking a nav link navigates to a new page', async ({ page }) => {
    await page.goto('/');
    const startUrl = page.url();

    await page.locator('.hamburger-btn').click();
    await expect(page.locator('#nav-drawer')).toHaveClass(/is-open/);

    // Pick a non-current nav link inside the drawer (first link is "Blog Posts"
    // pointing at "/" which is the current page — would produce same URL after click).
    const navLink = page.locator('#nav-drawer .nav-menu a[href="/about/"]').first();
    await expect(navLink).toBeVisible();

    await navLink.click();
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).not.toBe(startUrl);
  });
});

test.describe('Hamburger menu — desktop viewport', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('hamburger is hidden on desktop (drawer always shown)', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');

    // CSS hides the button at >=768px; Playwright treats display:none as not visible
    await expect(hamburger).toBeHidden();

    // Drawer contents (nav menu) should be visible
    await expect(page.locator('#nav-drawer .nav-menu')).toBeVisible();
  });
});

test.describe('Hamburger drawer auto-closes on resize to desktop', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('resizing from mobile to desktop closes an open drawer', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Resize to desktop width — matchMedia('change') listener should close the drawer
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-drawer')).not.toHaveClass(/is-open/);

    // Scroll lock released
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).not.toBe('hidden');
  });
});
