import { expect, test } from '@playwright/test';

/**
 * The sidebar's contract, in priority order:
 *
 *   1. It NEVER scrolls itself. It's a fixed navigation landmark, not a scroll
 *      region — an inner scrollbar is not an acceptable fix for overflow.
 *   2. Its content is ALWAYS reachable. It used to be `position: sticky` with
 *      `height: 100vh` and `overflow: visible`, so anything past 100vh painted
 *      outside a *pinned* box: page-scrolling could never reach it, and the
 *      notbyai badge was stranded off-screen on every desktop viewport.
 *   3. It sticks WHEN IT FITS. Above the height guard the sidebar is sticky;
 *      below it, it goes static and simply scrolls with the page.
 *
 * (3) is subordinate to (2): stickiness is a nicety, reachability is not.
 */

/** Must match the `min-height` guard in global.css. */
const STICKY_GUARD = 860;

/** Below the guard -> sidebar must be static. */
const SHORT = { width: 1280, height: 720 };
/** Above the guard, and taller than the sidebar's content -> sticky. */
const TALL = { width: 1280, height: 1000 };

/**
 * The worst case: a viewport exactly as tall as the guard (so sticky *just*
 * engages and the sidebar is pinned to exactly 100vh), at the widths where the
 * sidebar's content is tallest. The content is fluid — its height grows with
 * viewport width — so the widest layouts are the ones that overflow first.
 */
const BOUNDARY_CASES = [
  { width: 1023, height: STICKY_GUARD }, // tallest of the narrow (260px) column
  { width: 1440, height: STICKY_GUARD },
  { width: 2560, height: STICKY_GUARD }, // widest = tallest content
];

/** Viewports where the badge used to be stranded. */
const REACHABILITY_CASES = [
  { width: 1280, height: 900 },
  { width: 1280, height: 760 },
  { width: 1280, height: 650 },
  { width: 1440, height: 600 },
  { width: 768, height: 700 },
];

/**
 * @param {import('@playwright/test').Page} page
 */
async function sidebarMetrics (page) {
  return page.evaluate(() => {
    const el = document.querySelector('.sidebar');
    if (!el) throw new Error('.sidebar not found');
    const style = getComputedStyle(el);
    return {
      position: style.position,
      overflowY: style.overflowY,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
  });
}

test.describe('Sidebar — never scrolls itself', () => {
  for (const viewport of [SHORT, TALL, ...REACHABILITY_CASES]) {
    test(`no inner scrollbar at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const { overflowY, scrollHeight, clientHeight } = await sidebarMetrics(page);

      // The standing rule: the sidebar is a landmark, not a scroll container.
      expect(overflowY).not.toBe('auto');
      expect(overflowY).not.toBe('scroll');
      // And it must not be silently clipping its own content either.
      expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
    });
  }
});

test.describe('Sidebar — content stays reachable', () => {
  for (const viewport of REACHABILITY_CASES) {
    test(`footer badge is reachable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);

      const badge = page.locator('.notbyai-badge--sidebar');
      await expect(badge).toBeVisible();

      // "Reachable" means the page can bring it into view — NOT that it sits at
      // any particular place. Below the guard the sidebar is static, so the badge
      // rides the normal page scroll; above it, the sidebar is a sticky 100vh box
      // and the badge is already on screen. Scrolling it into view covers both,
      // and would fail for the original bug (a pinned box that page-scrolling
      // simply cannot reach).
      await badge.scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);

      // toBeVisible() alone is not enough: an element can be "visible" per CSS
      // while sitting outside the viewport. Assert it is actually on screen.
      const onScreen = await badge.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= globalThis.innerHeight + 1;
      });

      expect(onScreen, 'the notbyai badge must be scrollable into view').toBe(true);
    });
  }
});

test.describe('Sidebar — the content must still fit the guard', () => {
  // This is the invariant that keeps the whole fix honest. The CSS only turns
  // sticky on above a fixed pixel guard, but the *content* is fluid — so the
  // guard is a number that can silently go stale the moment anyone adds a nav
  // item, lengthens the subtitle, or ships a translation. These tests measure
  // the sidebar at exactly that boundary, at the widths where its content is
  // tallest. If the content outgrows the guard, they fail loudly here rather
  // than stranding the footer off-screen on somebody's laptop.
  for (const viewport of BOUNDARY_CASES) {
    test(`content fits at the sticky boundary — ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);

      const { position, scrollHeight, clientHeight } = await sidebarMetrics(page);

      // Sticky must actually be engaged at the guard, or we're testing nothing.
      expect(position, 'sticky should engage at the guard height').toBe('sticky');

      expect(
        scrollHeight,
        `The sidebar's content (${scrollHeight}px) no longer fits its ${clientHeight}px sticky box. ` +
        'Something was added to the sidebar. Trim it, or raise the min-height guard in global.css ' +
        '— do NOT give the sidebar an inner scrollbar.'
      ).toBeLessThanOrEqual(clientHeight + 1);

      // And the footer badge must be on screen without scrolling at all.
      const onScreen = await page.locator('.notbyai-badge--sidebar').evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.bottom <= globalThis.innerHeight + 1;
      });
      expect(onScreen, 'the notbyai badge must be visible when the sidebar is sticky').toBe(true);
    });
  }
});

test.describe('Sidebar — sticky only when it fits', () => {
  test('sticky on a tall viewport', async ({ page }) => {
    await page.setViewportSize(TALL);
    await page.goto('/');

    const { position } = await sidebarMetrics(page);
    expect(position).toBe('sticky');
  });

  test('static on a short viewport, so the page can scroll it into view', async ({ page }) => {
    await page.setViewportSize(SHORT);
    await page.goto('/');

    const { position } = await sidebarMetrics(page);
    expect(position).not.toBe('sticky');
  });
});

test.describe('Sidebar — mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('sidebar is NOT sticky at mobile viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();

    const { position } = await sidebarMetrics(page);
    expect(position).not.toBe('sticky');
  });
});
