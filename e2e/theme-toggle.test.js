import { expect, test } from '@playwright/test';

/**
 * Workaround for a Playwright auto-scroll geometry quirk: at 1280×720 the
 * sticky sidebar (position: sticky; height: 100vh) fills the viewport, and
 * theme-toggle sits as the 5th flex child below the fold. Playwright's
 * _retryPointerAction cycles block: end/center/start scroll alignments to
 * lift sticky-covered targets into view, but when the sticky host IS the
 * container, no alignment satisfies the in-viewport check (issue #3105).
 *
 * `force: true` does NOT bypass the viewport check (only non-essential
 * actionability checks). `scrollIntoViewIfNeeded` runs the same pipeline
 * `click()` already tries internally. Programmatic HTMLElement.click()
 * dispatches a synthetic `click` event ONLY (per DOM Living Standard — not
 * `mousedown`/`mouseup`/`pointerdown`). That's sufficient here because the
 * theme-toggle handler attaches to `click` via shadow.addEventListener at
 * src/global.client.js:131. If a future component listens for pointer or
 * mouse events instead, this helper won't fire those — use a real click()
 * with explicit scroll setup for that case. We keep toBeVisible() before
 * each call as the regression catch for "button vanished".
 *
 * Revival trigger: if Playwright fixes #3105 (sticky-host scroll geometry),
 * replace these helper calls with direct locator.click().
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} hostSelector
 * @param {string} shadowButtonSelector
 */
async function clickShadowButton (page, hostSelector, shadowButtonSelector) {
  await expect(page.locator(hostSelector)).toBeVisible();
  await page.evaluate(
    ([h, b]) => {
      const host = /** @type {HTMLElement | null} */ (document.querySelector(/** @type {string} */ (h)));
      const btn = /** @type {HTMLElement | undefined} */ (host?.shadowRoot?.querySelector(/** @type {string} */ (b)) ?? undefined);
      btn?.click();
    },
    [hostSelector, shadowButtonSelector]
  );
}

test.describe('theme toggle', () => {
  test('is visible on the page', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('theme-toggle');
    await expect(toggle).toBeVisible();
  });

  test('clicking light button sets data-theme to light', async ({ page }) => {
    await page.goto('/');
    await clickShadowButton(page, 'theme-toggle', 'button[data-theme="light"]');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const lightBtn = page.locator('theme-toggle').getByRole('button', { name: 'Light' });
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking dark button sets data-theme to dark', async ({ page }) => {
    await page.goto('/');
    await clickShadowButton(page, 'theme-toggle', 'button[data-theme="dark"]');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const darkBtn = page.locator('theme-toggle').getByRole('button', { name: 'Dark' });
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking system button clears data-theme and follows prefers-color-scheme', async ({ page }) => {
    // applyTheme('system') in src/global.client.js DELETES the data-theme attribute
    // so `:root:not([data-theme])` + `@media (prefers-color-scheme: dark)` handle
    // OS flips natively. The previous test asserted data-theme="dark"|"light"
    // after System click, contradicting the documented contract — this rewrite
    // asserts (a) attribute absent, (b) computed style differs across emulated
    // OS modes (token-agnostic — no hardcoded color values that drift with theme).
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await clickShadowButton(page, 'theme-toggle', 'button[data-theme="system"]');

    // (a) data-theme attribute is ABSENT in system mode — assert via dataset
    // (read symmetric to applyTheme's `delete dataset.theme` write)
    const dataThemeAfterClick = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(dataThemeAfterClick).toBeUndefined();
    const systemBtn = page.locator('theme-toggle').getByRole('button', { name: 'System' });
    await expect(systemBtn).toHaveAttribute('aria-pressed', 'true');

    // (b) computed style follows OS — capture body bg under emulated dark scheme
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    // Flip to light: @media (prefers-color-scheme) re-resolves natively, no JS needed
    await page.emulateMedia({ colorScheme: 'light' });
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    // Asserting inequality is token-agnostic — survives palette redesigns as long
    // as the dark and light themes retain distinct background colors
    expect(darkBg).not.toBe(lightBg);

    // Attribute remains absent — the OS flip didn't trigger a JS write
    const dataThemeAfterFlip = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(dataThemeAfterFlip).toBeUndefined();
  });

  test('persists selection across page reload', async ({ page }) => {
    await page.goto('/');
    await clickShadowButton(page, 'theme-toggle', 'button[data-theme="dark"]');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Reload and verify persistence
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // The dark button should still be pressed after reload
    const darkBtnAfter = page.locator('theme-toggle').getByRole('button', { name: 'Dark' });
    await expect(darkBtnAfter).toHaveAttribute('aria-pressed', 'true');
  });

  test('FOWT prevention: localStorage is applied before paint', async ({ page }) => {
    // Set localStorage to dark theme BEFORE any navigation via addInitScript.
    // The inline <script> in <head> reads localStorage and sets data-theme
    // synchronously, so there should be no flash of the wrong theme.
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
    });

    await page.goto('/');

    // The data-theme should be "dark" immediately — the inline script
    // in <head> applies it before the page renders.
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Verify the toggle also reflects the persisted state
    const darkBtn = page.locator('theme-toggle').getByRole('button', { name: 'Dark' });
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('FOWT prevention: light theme from localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('theme', 'light');
    });

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('cross-tab sync via storage event', async ({ context, page }) => {
    await page.goto('/');
    const page2 = await context.newPage();
    await page2.goto('/');

    // Verify both pages start with same default state
    await expect(page.locator('theme-toggle')).toBeVisible();
    await expect(page2.locator('theme-toggle')).toBeVisible();

    // Toggle to dark on page1
    await clickShadowButton(page, 'theme-toggle', 'button[data-theme="dark"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Simulate the storage event on page2 (cross-tab sync).
    // In a real browser, changing localStorage in one tab fires
    // a 'storage' event in other tabs. Playwright tabs share the
    // same origin, but the storage event only fires in OTHER tabs,
    // so we dispatch it manually.
    await page2.evaluate(() => {
      globalThis.dispatchEvent(new StorageEvent('storage', {
        key: 'theme',
        newValue: 'dark',

        storageArea: localStorage,
      }));
    });

    await expect(page2.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page2.close();
  });
});
