// @ts-check
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'article', path: '/2019/10/use-type-script-3-7-to-generate/' },
  { name: 'social', path: '/social/' },
  { name: 'links', path: '/links/' },
  { name: 'archive', path: '/archive/' },
  { name: 'about', path: '/about/' },
];

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function setTheme (page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, theme);
}

/**
 * @param {import('axe-core').Result[]} violations
 * @returns {import('axe-core').Result[]}
 */
function criticalOrSerious (violations) {
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
}

test.describe('accessibility: light mode', () => {
  for (const { name, path } of pages) {
    test(`${name} has no critical/serious WCAG 2.1 AA violations`, async ({ page }) => {
      await page.goto(path);
      await setTheme(page, 'light');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(criticalOrSerious(results.violations)).toEqual([]);
    });
  }
});

test.describe('accessibility: dark mode', () => {
  for (const { name, path } of pages) {
    test(`${name} has no critical/serious WCAG 2.1 AA violations`, async ({ page }) => {
      await page.goto(path);
      await setTheme(page, 'dark');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(criticalOrSerious(results.violations)).toEqual([]);
    });
  }
});
