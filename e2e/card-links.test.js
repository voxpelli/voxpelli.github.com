import { expect, test } from '@playwright/test';

/**
 * Whole-card click targets.
 *
 * Each card's TITLE anchor stretches over the whole card via an absolutely-
 * positioned pseudo-element, so body text is clickable and no second link enters
 * the accessibility tree. The card therefore goes where its title goes — for a
 * LINK card, off-site to the source it bookmarks. "Read full note →", the type
 * pill, and the footer links are escape hatches that stay clickable through the
 * cover.
 *
 * Two things made this silently not work, and both are pinned below:
 *
 * 1. The cover must OUT-RANK positioned content, not merely be positioned.
 *    `.post-excerpt` is `position: relative` (it holds the absolutely-positioned
 *    fade), so it painted over a cover left at `z-index: auto` and ate every
 *    click on the excerpt body.
 *
 * 2. The element hosting the cover must not be positioned itself, or `inset: 0`
 *    resolves against IT and the cover is trapped in its own box.
 *
 * And one trap for whoever changes this next: WHICH pseudo hosts the cover is not
 * free. `a[lang="sv"]::before` paints the Swedish flag on post titles, and
 * bookmark titles spend `::after` on the ↗ glyph. An element has one ::before, so
 * a cover on the wrong pseudo silently merges with the decoration and collapses to
 * its size. That is what `flag survives` and `glyph survives` below exist to catch.
 */

/** Probe rows down the card's centre line. Enough to catch a partial cover. */
const ROWS = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92];

/**
 * Freeze the scroll-driven `card-fade-up` animation. Mid-animation the cards are
 * translated and semi-transparent, which makes hit-testing race the scroll.
 *
 * @param {import('@playwright/test').Page} page
 */
async function freezeCards (page) {
  await page.addStyleTag({
    content: '.post-card, .til-card { animation: none !important; opacity: 1 !important; transform: none !important; }',
  });
}

/**
 * The href a click at a probe point on the card would follow, or undefined if
 * the point is dead. ONE in-page probe serves both addressing modes — by
 * relative position on the card, or by the centre of a child element — so the
 * viewport guard cannot be dropped from one of them (it was: an early
 * `throughCover` re-implemented the hit-test without the guard).
 *
 * Throws rather than returning undefined when the point lies outside the
 * viewport: `elementFromPoint` finds nothing there either, so an unscrolled
 * card would be indistinguishable from an unclickable one and the test would
 * report a defect that isn't there (it did, while this file was being written).
 *
 * @param {import('@playwright/test').Locator} card
 * @param {{ rx: number, ry: number } | { selector: string }} target
 * @returns {Promise<string | undefined>}
 */
function probeHref (card, target) {
  return card.evaluate((el, target) => {
    let x, y;
    if ('selector' in target) {
      const child = el.querySelector(target.selector);
      if (!child) throw new Error(`no ${target.selector} on this card`);
      const r = child.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    } else {
      const r = el.getBoundingClientRect();
      x = r.left + r.width * target.rx;
      y = r.top + r.height * target.ry;
    }

    if (y < 0 || y > globalThis.innerHeight || x < 0 || x > globalThis.innerWidth) {
      throw new Error(`probe ${JSON.stringify(target)} is outside the viewport — scroll the card into view first`);
    }

    const hit = document.elementFromPoint(x, y);
    return hit?.closest('a')?.getAttribute('href') ?? undefined;
  }, target);
}

/**
 * @param {import('@playwright/test').Locator} card
 * @param {number} rx horizontal position within the card, 0–1
 * @param {number} ry vertical position within the card, 0–1
 * @returns {Promise<string | undefined>}
 */
function hrefAt (card, rx, ry) {
  return probeHref(card, { rx, ry });
}

/**
 * @param {import('@playwright/test').Locator} card
 * @param {string} selector child element whose centre to probe
 * @returns {Promise<string | undefined>}
 */
function hrefAtElement (card, selector) {
  return probeHref(card, { selector });
}

// Every test in this file probes the homepage with the entrance animation
// frozen — and a future test that forgot freezeCards would silently
// reintroduce the hit-testing race its JSDoc documents.
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await freezeCards(page);
});

test.describe('cards are clickable across their whole surface', () => {
  test('no card on the homepage has a dead zone', async ({ page }) => {
    const cards = page.locator('.post-card, .til-card');
    const count = await cards.count();
    expect(count, 'the homepage must actually have cards, or this test is vacuous').toBeGreaterThan(5);

    /** @type {string[]} */
    const dead = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      await card.scrollIntoViewIfNeeded();

      const heading = await card.locator('.post-title').textContent();
      const title = (heading ?? '').trim().slice(0, 40);
      for (const ry of ROWS) {
        if (await hrefAt(card, 0.5, ry) === undefined) dead.push(`${title} @ y=${ry}`);
      }
    }

    expect(dead, `every point on every card must follow a link:\n${dead.join('\n')}`).toEqual([]);
  });
});

test.describe('a card goes where its title goes', () => {
  test('a post card leads to the post', async ({ page }) => {
    const card = page.locator('.post-card').first();
    const title = await card.locator('.post-title a').getAttribute('href');

    expect(await hrefAt(card, 0.5, 0.5), 'the body of a post card must lead to the post').toBe(title);
  });

  test('a link card leads off-site, to the source it bookmarks', async ({ page }) => {
    const card = page.locator('.til-card--bookmark').first();
    await card.scrollIntoViewIfNeeded();
    const source = await card.locator('.post-title a.u-bookmark-of').getAttribute('href');

    expect(source, 'a bookmark title must point off-site').toMatch(/^https?:\/\//);
    expect(await hrefAt(card, 0.5, 0.5), 'the body of a link card must lead to the source').toBe(source);
  });

  test('the escape hatches keep their own destinations', async ({ page }) => {
    // A bookmark card that still offers a route back to the note itself.
    const card = page.locator('.til-card--bookmark:has(.post-read-more)').first();
    await card.scrollIntoViewIfNeeded();

    const permalink = await card.locator('.post-read-more').getAttribute('href');

    expect(await hrefAtElement(card, '.post-read-more'), '"Read full note" must still reach the note, not the source')
      .toBe(permalink);
    expect(await hrefAtElement(card, '.post-type-badge'), 'the LINK pill must still reach /links/')
      .toBe('/links/');
  });
});

test.describe('the cover does not eat the decorations it shares a pseudo-element with', () => {
  test('flag survives: a Swedish post title still renders its inline flag', async ({ page }) => {
    const anchor = page.locator('.post-card .post-title a[lang="sv"]').first();
    await expect(anchor, 'the homepage must have a Swedish post, or this test is vacuous').toBeVisible();

    const flag = await anchor.evaluate((el) => {
      const cs = getComputedStyle(el, '::before');
      return { display: cs.display, position: cs.position, width: cs.width, hasImage: cs.backgroundImage !== 'none' };
    });

    // If the cover were put on ::before it would merge with this rule and the flag
    // would be yanked out of flow and collapsed — taking the card's cover with it.
    expect(flag.hasImage, 'the flag image must still be painted').toBe(true);
    expect(flag.display, 'the flag must stay in the text flow').toBe('inline-block');
    expect(flag.position, 'the flag must NOT be absolutely positioned — that means the cover merged into it').toBe('static');

    // And the card must still be covered, on the other pseudo.
    const card = page.locator('.post-card:has(.post-title a[lang="sv"])').first();
    await card.scrollIntoViewIfNeeded();
    expect(await hrefAt(card, 0.5, 0.5), 'a Swedish card must still be clickable through its body')
      .toBe(await anchor.getAttribute('href'));
  });

  test('glyph survives: a bookmark title still renders its trailing ↗', async ({ page }) => {
    const anchor = page.locator('.til-card--bookmark .post-title a.u-bookmark-of').first();
    await anchor.scrollIntoViewIfNeeded();

    const glyph = await anchor.evaluate((el) => {
      const cs = getComputedStyle(el, '::after');
      return { content: cs.content, position: cs.position };
    });

    expect(glyph.content, 'the off-site glyph must still be there').toContain('↗');
    expect(glyph.position, 'the glyph must stay in flow — if it is absolute, the cover overwrote it').toBe('static');
  });
});
