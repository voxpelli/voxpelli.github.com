import { expect, test } from '@playwright/test';

// Per CLAUDE.md: detect horizontal overflow via scrollWidth > clientWidth
// at 375px viewport. Fixtures chosen for high overflow risk: YouTube iframes
// (16:9 at 560px native), long inline-code lines (no soft-wrap), prose with
// unbroken URLs, archive listings (sticky year-nav), TIL card metadata rail.
// Existing CSS guards (min-width: 0 on .content-area, overflow-x: auto on
// pre/iframe/table-wrapper, overflow-wrap: anywhere on prose links) should
// keep all fixtures within bounds — this test is a regression catch.
test.describe('Mobile horizontal overflow @ 375px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  /** @type {Array<{ path: string, label: string }>} */
  const fixtures = [
    { path: '/2016/01/2015-in-review/', label: 'YouTube iframes' },
    { path: '/2016/03/my-2015-in-indieweb/', label: 'YouTube + long URLs' },
    { path: '/2016/07/better-handle-npm-modules/', label: 'long inline code' },
    { path: '/2012/10/tent-ostatus-historielektionen/', label: 'unbroken URLs in prose' },
    { path: '/archive/', label: 'sticky year-nav' },
    { path: '/archive/full/', label: 'full archive listing' },
    { path: '/', label: 'TIL card footer rail' },
  ];

  for (const { label, path } of fixtures) {
    test(`no horizontal scroll @ ${path} (${label})`, async ({ page }) => {
      // Status guard: a 404 trivially passes scrollWidth <= clientWidth, so
      // a moved/renamed fixture would silently report green. Assert the page
      // actually loaded before measuring overflow.
      const response = await page.goto(path);
      expect(
        response?.status(),
        `${path} returned HTTP ${String(response?.status())} — fixture path may have moved`
      ).toBe(200);

      const overflow = await page.evaluate(() => ({
        scroll: document.body.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(
        overflow.scroll,
        `${path} overflows: body.scrollWidth=${overflow.scroll}, html.clientWidth=${overflow.client}`
      ).toBeLessThanOrEqual(overflow.client);
    });
  }
});
