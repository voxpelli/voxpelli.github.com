// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Mobile hamburger drawer — focus management & keyboard interaction.
 *
 * Complements e2e/hamburger.test.js (open/close, scroll lock, click-outside)
 * and e2e/accessibility.test.js (axe scans) with a regression fence for:
 *
 *   1. Enter/Space on hamburger opens the drawer (keyboard parity with click).
 *   2. Escape closes the drawer AND restores focus to the hamburger button.
 *   3. When drawer is open, Tab / Shift+Tab cycle within drawer content —
 *      focus does not leak to the main content behind the fixed overlay.
 *      NOTE: src/global.client.js does NOT currently implement a focus trap
 *      (only keydown-on-Escape and click-outside-to-close). Tab cycling is
 *      marked `test.fail()` so when a trap IS implemented the test flips
 *      green and the `test.fail()` wrapper must be removed.
 *   4. Clicking a drawer link navigates to a new page (covered by
 *      hamburger.test.js — we additionally assert aria-expanded on the
 *      destination page starts fresh at false).
 */
test.describe('Mobile hamburger drawer — focus & keyboard', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Enter on hamburger opens drawer', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    const drawer = page.locator('#nav-drawer');

    await hamburger.focus();
    await expect(hamburger).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveClass(/is-open/);
  });

  test('Space on hamburger opens drawer', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    const drawer = page.locator('#nav-drawer');

    await hamburger.focus();
    await page.keyboard.press(' ');

    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveClass(/is-open/);
  });

  test('Escape closes drawer and restores focus to hamburger', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Move focus somewhere inside the drawer to prove restore works from
    // a non-hamburger starting point.
    const firstLink = page.locator('#nav-drawer .nav-menu a').first();
    await firstLink.focus();
    await expect(firstLink).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-drawer')).not.toHaveClass(/is-open/);
    await expect(hamburger).toBeFocused();
  });

  // Document EXPECTED focus-trap behavior. src/global.client.js currently
  // has no trap — these assertions stay red until one is added. When the
  // trap lands the tests flip green and must be un-failed.
  test.fail('Tab from last drawer element wraps to first (focus trap)', async ({ page }) => {
    await page.goto('/');

    await page.locator('.hamburger-btn').click();
    await expect(page.locator('#nav-drawer')).toHaveClass(/is-open/);

    // Count tabbable elements inside the drawer and tab that many times
    // starting from the last one — a correctly trapped drawer should land
    // back inside the drawer rather than on <body> or a main-content link.
    const drawerSelector = '#nav-drawer';
    const tabbables = await page.locator(
      `${drawerSelector} a[href], ${drawerSelector} button:not([disabled]), ${drawerSelector} [tabindex]:not([tabindex="-1"])`
    ).all();
    expect(tabbables.length).toBeGreaterThan(0);

    // Focus the last tabbable element in the drawer
    await tabbables.at(-1)?.focus();
    await page.keyboard.press('Tab');

    const focusedInDrawer = await page.evaluate(() =>
      !!document.activeElement?.closest('#nav-drawer'));
    expect(focusedInDrawer).toBe(true);
  });

  test.fail('Shift+Tab from first drawer element wraps to last (focus trap)', async ({ page }) => {
    await page.goto('/');

    await page.locator('.hamburger-btn').click();
    await expect(page.locator('#nav-drawer')).toHaveClass(/is-open/);

    const firstLink = page.locator('#nav-drawer .nav-menu a').first();
    await firstLink.focus();
    await page.keyboard.press('Shift+Tab');

    const focusedInDrawer = await page.evaluate(() =>
      !!document.activeElement?.closest('#nav-drawer'));
    expect(focusedInDrawer).toBe(true);
  });

  test.fail('Focus does not leak to main content while drawer is open', async ({ page }) => {
    await page.goto('/');

    await page.locator('.hamburger-btn').click();
    await expect(page.locator('#nav-drawer')).toHaveClass(/is-open/);

    // Tab 30 times and ensure focus never escapes the drawer region
    // (hamburger button is acceptable — it's the trigger; main content is not).
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const leaked = await page.evaluate(() => {
        const active = document.activeElement;
        if (!active || active === document.body) return false;
        if (active.closest('#nav-drawer')) return false;
        if (active.classList.contains('hamburger-btn')) return false;
        return !!active.closest('#main-content');
      });
      expect(leaked, `Focus leaked to main content on Tab #${i + 1}`).toBe(false);
    }
  });

  test('Drawer survives within-mobile viewport resize (375 → 400 → 375)', async ({ page }) => {
    // SWARM-11 H13: existing resize tests cover mobile → desktop (drawer
    // auto-closes). NOT covered: within-mobile resize while drawer is open.
    // matchMedia('change') listener should only fire when the media query
    // boundary (768px) is crossed — resizing 375 → 400 → 375 must leave
    // drawer state (aria-expanded + body overflow lock) untouched.
    //
    // Regression fence: if the drawer close-handler ever listens to a
    // resize/orientationchange event instead of matchMedia, intermediate
    // viewport changes would leak the body scroll lock.
    await page.goto('/');

    const hamburger = page.locator('.hamburger-btn');
    const drawer = page.locator('#nav-drawer');

    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveClass(/is-open/);
    const overflowOpen = await page.evaluate(() => document.body.style.overflow);
    expect(overflowOpen).toBe('hidden');

    // Resize to a slightly wider mobile viewport — still under 768px.
    await page.setViewportSize({ width: 400, height: 812 });

    // Drawer state must be preserved.
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveClass(/is-open/);
    const overflowMid = await page.evaluate(() => document.body.style.overflow);
    expect(overflowMid, 'body overflow lock must survive within-mobile resize').toBe('hidden');

    // Resize back.
    await page.setViewportSize({ width: 375, height: 812 });

    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveClass(/is-open/);
    const overflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(overflowAfter, 'body overflow lock must survive round-trip resize').toBe('hidden');
  });

  test('Drawer link navigation closes drawer on destination page', async ({ page }) => {
    await page.goto('/');

    // Open the drawer first so we're actually testing the open -> navigate -> closed
    // transition, not the trivially-closed initial state on page load.
    const hamburger = page.locator('.hamburger-btn');
    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#nav-drawer')).toHaveClass(/is-open/);

    // Click a drawer link and wait for the destination to fully load.
    await Promise.all([
      page.waitForURL('**/about/'),
      page.locator('#nav-drawer .nav-menu a[href="/about/"]').first().click(),
    ]);
    await page.waitForLoadState('domcontentloaded');

    // On the fresh destination page the drawer should be closed (default state
    // after nav, since drawer is DOM-local and not persisted across loads).
    await expect(page.locator('.hamburger-btn')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#nav-drawer')).not.toHaveClass(/is-open/);
  });
});
