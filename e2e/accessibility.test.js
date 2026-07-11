import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Flipping data-theme mid-page starts CSS colour transitions (cards, nav items and
// buttons transition `color` over 0.2s, while the page background is not
// transitioned and snaps immediately). axe reads *computed* colours, so a scan that
// lands inside that window sees the OLD theme's foreground on the NEW theme's
// background — e.g. light ink #2c2a28 on dark canvas #1e1d1b, 1.17:1. That pairing
// exists in no settled state, since each dark block defines every token at once.
// Emulating reduced motion engages the stylesheet's own
// `@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms } }`
// block, so the switch is instant and axe always samples settled colours. Contrast
// rules describe the resting state, not a frame of a fade.
//
// It MUST go through `contextOptions`: `reducedMotion` is a BrowserContextOption,
// not a test option, so `test.use({ reducedMotion: 'reduce' })` is accepted and
// silently discarded. It was written that way, emulated nothing, and the suite
// passed locally purely because a fast machine settled the transition before axe
// looked. CI, being slower, caught the mid-fade frame and went red.
//
// This is only sound while that block neuters *motion* and nothing else (today:
// animation-duration, animation-iteration-count, transition-duration,
// scroll-behavior). If it ever changes a colour, size, or visibility, this
// emulation stops being a no-op and the suite would validate a rendering most
// users never see.
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
 * Flip the theme, then wait until the colour transitions it starts have finished.
 *
 * Reduced motion is NOT sufficient on its own. It shrinks each transition to
 * 0.01ms but does not stop one being *created*: flipping data-theme spawns ~330
 * CSSTransitions, and getComputedStyle reports each property's START value until
 * a frame advances. Measured immediately after the flip, `body` still computes
 * rgb(44,42,40) — the light ink — while --color-ink already reads #cecbc7. axe
 * scanning in that window sees the old theme's foreground on the new theme's
 * background (1.17:1) and reports contrast failures against colour pairs that
 * exist in no theme. Waiting for the transitions to drain is what makes the scan
 * describe the resting state, which is what the contrast rules are about.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} theme
 */
async function setTheme (page, theme) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t;
  }, theme);

  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState !== 'running')
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
