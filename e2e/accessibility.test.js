import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { WEBMENTION_INJECTED_IMAGES } from './third-party.js';

// Emulate reduced motion, so the colour transitions a theme flip starts settle in
// 0.01ms instead of 200ms — the stylesheet's own
// `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms } }`
// block does the work. It is sound only while that block neuters *motion* and
// nothing else (today: animation-duration, animation-iteration-count,
// transition-duration, scroll-behavior). If it ever changes a colour, size or
// visibility, this stops being a no-op and the suite would validate a rendering
// most users never see.
//
// This is NOT what makes the scans correct — setTheme() is. See there.
//
// It MUST go through `contextOptions`: `reducedMotion` is a BrowserContextOption,
// not a test option, so `test.use({ reducedMotion: 'reduce' })` is accepted and
// silently discarded. It was written that way and emulated nothing.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('reduced motion is actually emulated', async ({ page }) => {
  // Guard the premise: without it, the emulation can silently stop applying and
  // every scan below quietly goes back to racing a 0.2s fade.
  await page.goto('/');
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(reduced, 'the axe scans below race a colour fade unless motion is reduced').toBe(true);
});

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
 * Flip the theme, then wait until the transitions it starts have drained.
 *
 * This wait is the load-bearing part of the whole file, and it guards against two
 * different failures depending on whether motion is reduced. `getComputedStyle`
 * returns the LIVE interpolated value, which equals each property's start value
 * until a frame has actually rendered — so scanning straight after a flip reads
 * pre-flip colours.
 *
 * Without reduced motion (what CI was doing): the page background snaps instantly
 * — nothing transitions it — while ~49 elements are still easing `color`. axe then
 * composites the OLD theme's foreground onto the NEW theme's background: light ink
 * #2c2a28 on dark canvas #1e1d1b, 1.17:1. That pairing exists in no settled state,
 * since each dark block defines every token at once. Hence the phantom failures.
 *
 * WITH reduced motion, the failure is quieter and worse: every element gets a
 * transition from the universal `transition-duration: 0.01ms` rule, so ALL of them
 * read stale together and the page is self-consistently LIGHT right after a flip to
 * dark. axe would scan light-mode colours, find them fine, and pass — and the
 * "dark mode" suite would silently be a second light-mode suite. Green, and worth
 * nothing.
 *
 * Filtered to CSSTransition on purpose: a CSSAnimation driven by a scroll/view
 * timeline (card-fade-up, reading-progress) need never reach a non-running
 * playState, and any future `animation: … infinite` would hang the wait outright.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function setTheme (page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, theme);

  await page.waitForFunction(
    // globalThis.CSSTransition, not the bare global: this closure is serialised
    // into the page, where it exists — but ESLint lints it as Node, where it does not.
    () => document.getAnimations()
      .filter((a) => a instanceof globalThis.CSSTransition)
      .every((a) => a.playState !== 'running'),
    undefined,
    { timeout: 5000 }
  );
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
        .exclude(WEBMENTION_INJECTED_IMAGES)
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
        .exclude(WEBMENTION_INJECTED_IMAGES)
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
        .exclude(WEBMENTION_INJECTED_IMAGES)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(criticalOrSerious(results.violations)).toEqual([]);
    });
  }
});
