import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Flipping data-theme mid-page starts CSS colour transitions (.btn transitions
// color/background-color over 0.2s). axe reads *computed* colours, so scanning
// mid-transition reports blended intermediates belonging to no theme — phantom
// contrast failures against colours that exist nowhere in global.css. Emulating
// reduced motion engages the stylesheet's own
// `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms } }`
// block, so the theme switch is instant and axe always samples settled colours.
// Contrast rules describe the resting state, not a frame of a fade.
//
// This is only sound while that block neuters *motion* and nothing else (today:
// animation-duration, animation-iteration-count, transition-duration,
// scroll-behavior). If it ever changes a colour, size, or visibility, this
// emulation stops being a no-op and the suite would validate a rendering most
// users never see.
test.use({ reducedMotion: 'reduce' });

const pages = [
  { name: 'homepage', path: '/' },
  { name: 'article', path: '/2019/10/use-type-script-3-7-to-generate/' },
  { name: 'social', path: '/social/' },
  { name: 'links', path: '/links/' },
  { name: 'archive', path: '/archive/' },
  { name: 'about', path: '/about/' },
  { name: 'til-index', path: '/til/' },
  { name: 'til-topic', path: '/til/topics/css/' },
  { name: 'articles', path: '/articles/' },
  // { name: 'feeds', path: '/feeds/' }, // gated out for release (page.draft.js)
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

// The two describes above both drive dark mode through `[data-theme="dark"]`.
// But that is only one of the stylesheet's two dark branches: a first-time
// visitor with a dark OS and no stored preference gets NO data-theme attribute
// at all, and is styled by `@media (prefers-color-scheme: dark) :root:not([data-theme])`.
// dark-mode-sync.spec.js proves the two blocks declare the same VALUES, but
// nothing proved the media branch actually applies. Drive it with a dark OS and
// no setTheme() call, so the branch real users land on is the one axe scans.
test.describe('accessibility: OS dark (prefers-color-scheme, no data-theme)', () => {
  test.use({ colorScheme: 'dark' });

  for (const { name, path } of pages) {
    test(`${name} has no critical/serious WCAG 2.1 AA violations`, async ({ page }) => {
      await page.goto(path);

      // Guard the premise: if anything ever writes data-theme on first visit,
      // this suite would silently be re-testing the attribute branch instead.
      const attr = await page.locator('html').getAttribute('data-theme');
      expect(attr, 'first visit must not set data-theme — the media query styles it').toBeNull();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(criticalOrSerious(results.violations)).toEqual([]);
    });
  }
});
