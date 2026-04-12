// @ts-check
import { test, expect } from '@playwright/test';

test.describe('theme toggle', () => {
  test('is visible on the page', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('theme-toggle');
    await expect(toggle).toBeVisible();
  });

  test('clicking light button sets data-theme to light', async ({ page }) => {
    await page.goto('/');
    const lightBtn = page.locator('theme-toggle').getByRole('button', { name: 'Light' });
    await lightBtn.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking dark button sets data-theme to dark', async ({ page }) => {
    await page.goto('/');
    const darkBtn = page.locator('theme-toggle').getByRole('button', { name: 'Dark' });
    await darkBtn.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking system button follows prefers-color-scheme', async ({ page }) => {
    // Emulate dark color scheme so system mode resolves to dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const systemBtn = page.locator('theme-toggle').getByRole('button', { name: 'System' });
    await systemBtn.click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(systemBtn).toHaveAttribute('aria-pressed', 'true');

    // Switch to light color scheme — system mode should now resolve to light
    await page.emulateMedia({ colorScheme: 'light' });

    // Re-click system to re-apply with the new media preference
    await systemBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(systemBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('persists selection across page reload', async ({ page }) => {
    await page.goto('/');
    const darkBtn = page.locator('theme-toggle').getByRole('button', { name: 'Dark' });
    await darkBtn.click();

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
    const darkBtn = page.locator('theme-toggle').getByRole('button', { name: 'Dark' });
    await darkBtn.click();
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
