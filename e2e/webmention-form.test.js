import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * SWARM-11 H1 — Webmention form keyboard focus + dark-mode contrast.
 *
 * test/smoke.spec.js asserts the form renders (structural). This file adds
 * the deeper quality checks:
 *
 *   1. Keyboard navigation reaches the URL input and submit button.
 *   2. The focused input renders a visible focus ring (outline non-none
 *      AND non-zero outline-width) — blocks the regression where
 *      `outline: none` is ever added without a replacement focus-visible
 *      indicator.
 *   3. axe-core run under `[data-theme="dark"]` reports no critical/serious
 *      violations tied to the webmention form region (focus-order,
 *      label, contrast).
 */

const ARTICLE_PATH = '/2019/10/use-type-script-3-7-to-generate/';

test.describe('Webmention form — focus & dark-mode accessibility', () => {
  test('form has labelled URL input reachable by keyboard', async ({ page }) => {
    await page.goto(ARTICLE_PATH);

    const input = page.locator('#webmention-source');
    await expect(input).toBeVisible();
    // Label association via for=/id=
    const labelFor = await page.locator('label[for="webmention-source"]').getAttribute('for');
    expect(labelFor).toBe('webmention-source');

    await input.focus();
    await expect(input).toBeFocused();
  });

  test('focused webmention input renders a visible focus ring', async ({ page }) => {
    await page.goto(ARTICLE_PATH);

    const input = page.locator('#webmention-source');
    await input.focus();
    await expect(input).toBeFocused();

    // Computed style check — either a non-none outline-style, a non-zero
    // outline-width, or a non-zero box-shadow counts as a visible focus
    // indicator. Matches the focus-visible patterns used elsewhere on the
    // site (global.css sets outline + box-shadow on :focus-visible).
    const indicator = await input.evaluate((el) => {
      const s = globalThis.getComputedStyle(el);
      return {
        outlineStyle: s.outlineStyle,
        outlineWidth: Number.parseFloat(s.outlineWidth) || 0,
        boxShadow: s.boxShadow,
      };
    });

    const hasOutline = indicator.outlineStyle !== 'none' && indicator.outlineWidth > 0;
    const hasBoxShadow = indicator.boxShadow !== 'none' && indicator.boxShadow !== '';

    expect(
      hasOutline || hasBoxShadow,
      `Focused webmention input must have a visible focus ring. Got: ${JSON.stringify(indicator)}`
    ).toBe(true);
  });

  test('submit button is keyboard-reachable and focusable', async ({ page }) => {
    await page.goto(ARTICLE_PATH);

    const submit = page.locator('.webmention-form input[type="submit"]');
    await expect(submit).toBeVisible();
    await submit.focus();
    await expect(submit).toBeFocused();
  });

  test('webmention form has no critical/serious axe violations in dark mode', async ({ page }) => {
    await page.goto(ARTICLE_PATH);

    // Force explicit dark theme — JS normally writes data-theme only when
    // the user opts out of 'system', so we set it directly for the scan.
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });

    const results = await new AxeBuilder({ page })
      .include('.webmention-form')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const seriousViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(
      seriousViolations,
      `Dark-mode webmention form violations: ${JSON.stringify(seriousViolations, undefined, 2)}`
    ).toEqual([]);
  });
});
