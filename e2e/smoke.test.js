import { expect, test } from '@playwright/test';

test('homepage loads and has h-feed', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/VoxPelli/);
  const hfeed = page.locator('.h-feed');
  await expect(hfeed).toBeVisible();
});

test('homepage has post cards with links', async ({ page }) => {
  await page.goto('/');
  const postCards = page.locator('.post-card');
  await expect(postCards.first()).toBeVisible();
  const firstLink = postCards.first().locator('a.u-url');
  await expect(firstLink).toHaveAttribute('href', /^\//);
});

test('navigation highlights active page', async ({ page }) => {
  await page.goto('/');
  const activeNav = page.locator('.nav-item.active');
  await expect(activeNav).toHaveText(/Home/);
});

test('theme toggle is interactive', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('theme-toggle');
  await expect(toggle).toBeVisible();
});

test('article page has prev/next navigation', async ({ page }) => {
  await page.goto('/2019/10/use-type-script-3-7-to-generate/');
  const postNav = page.locator('.post-nav');
  await expect(postNav).toBeVisible();
});
