/**
 * Smoke tests that verify the build output in public/.
 * Run after `npm run build` — the test script runs build first.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

import { escapeXml } from '../src/lib/escape.js';
import { safePostUrl } from '../src/lib/render-post.js';
import { redirects } from '../src/redirects.template.js';

test('homepage has h-feed and DomStack assets', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.match(html, /h-feed/);
  assert.match(html, /global-[A-Z0-9]+\.css/i);
  assert.match(html, /global\.client-[A-Z0-9]+\.js/i);
  assert.doesNotMatch(html, /\[object Object\]/, 'homepage must not contain stringified objects');
});

test('homepage post cards have non-empty u-url hrefs', async () => {
  const html = await readFile('public/index.html', 'utf8');
  const hrefPattern = /class="[^"]*u-url[^"]*"[^>]*href="([^"]*)"/g;
  const hrefs = [...html.matchAll(hrefPattern)].map(m => m[1]);

  assert.ok(hrefs.length > 0, 'homepage should have at least one u-url link');

  for (const href of hrefs) {
    assert.ok(href && href.length > 0, 'u-url href must not be empty');
  }
});

test('Atom feed has entries with rendered HTML content', async () => {
  const xml = await readFile('public/all.xml', 'utf8');
  assert.match(xml, /<entry>/);
  assert.match(xml, /<content type="html">/);
  assert.doesNotMatch(xml, /\[object Object\]/, 'feed must not contain stringified objects');
});

test('feed entries have non-empty titles', async () => {
  const xml = await readFile('public/all.xml', 'utf8');
  const titlePattern = /<title>([^<]*)<\/title>/g;
  const titles = [...xml.matchAll(titlePattern)].map(m => m[1]);

  assert.ok(titles.length > 1, 'feed should have multiple title elements');

  for (const title of titles) {
    assert.ok(title && title.trim().length > 0, 'feed <title> must not be empty');
  }
});

test('feed entries have valid ISO datetime in <updated>', async () => {
  const xml = await readFile('public/all.xml', 'utf8');
  const updatedPattern = /<updated>([^<]*)<\/updated>/g;
  const dates = [...xml.matchAll(updatedPattern)].map(m => m[1]);

  assert.ok(dates.length > 0, 'feed should have at least one <updated> element');

  const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

  for (const date of dates) {
    assert.ok(date && date.length > 0, '<updated> must not be empty');
    assert.match(date, isoPattern, `<updated> value "${date}" must be a valid ISO datetime`);
  }
});

test('feed has top-level <id> and entry <id> tags', async () => {
  const xml = await readFile('public/all.xml', 'utf8');

  // Top-level feed <id>
  const feedIdPattern = /<feed[^>]*>[\s\S]*?<id>([^<]*)<\/id>/;
  const feedIdMatch = xml.match(feedIdPattern);
  assert.ok(feedIdMatch, 'feed should have a top-level <id> element');
  assert.ok(feedIdMatch && feedIdMatch[1] && feedIdMatch[1].length > 0, 'top-level <id> must not be empty');

  // Entry <id> tags
  const entryIdPattern = /<entry>[\s\S]*?<id>([^<]*)<\/id>/g;
  const entryIds = [...xml.matchAll(entryIdPattern)].map(m => m[1]);
  assert.ok(entryIds.length > 0, 'feed entries should have <id> elements');

  for (const id of entryIds) {
    assert.ok(id && id.length > 0, 'entry <id> must not be empty');
  }
});

test('feed entry <id>s are unique across the feed', async () => {
  // Regression: <id>${siteUrl}${post.pageUrl || ''}</id> collapsed to the
  // bare siteUrl whenever pageUrl was falsy, causing readers to dedupe all
  // such entries into one. Every entry <id> must be distinct.
  for (const feedPath of ['public/all.xml', 'public/english.xml']) {
    const xml = await readFile(feedPath, 'utf8');
    const entryIdPattern = /<entry>[\s\S]*?<id>([^<]*)<\/id>/g;
    const ids = [...xml.matchAll(entryIdPattern)].map(m => m[1]);
    const unique = new Set(ids);
    assert.equal(
      unique.size,
      ids.length,
      `${feedPath} entry <id>s must be unique (got ${ids.length} entries, ${unique.size} unique)`
    );
  }
});

test('feed entries emit both <published> and <updated>', async () => {
  // Regression: entries used to omit <published>, leaving readers unable to
  // distinguish first-publish from last-edit timestamps.
  const xml = await readFile('public/all.xml', 'utf8');
  const entryPattern = /<entry>[\s\S]*?<\/entry>/g;
  const entries = xml.match(entryPattern) || [];
  assert.ok(entries.length > 0, 'feed should contain at least one <entry>');

  const isoPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  for (const entry of entries) {
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
    assert.ok(publishedMatch, 'each entry must have a <published> element');
    assert.ok(updatedMatch, 'each entry must have an <updated> element');
    const publishedValue = publishedMatch && publishedMatch[1] ? publishedMatch[1] : '';
    const updatedValue = updatedMatch && updatedMatch[1] ? updatedMatch[1] : '';
    assert.match(publishedValue, isoPattern, `<published> "${publishedValue}" must be ISO datetime`);
    assert.match(updatedValue, isoPattern, `<updated> "${updatedValue}" must be ISO datetime`);
  }
});

test('TIL Atom feed exists with valid structure', async () => {
  await access('public/til/feed.atom');
  const xml = await readFile('public/til/feed.atom', 'utf8');

  // Valid Atom root
  assert.match(xml, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/, 'must have <feed> root element');

  // Self-link points at /til/feed.atom
  assert.match(xml, /href="[^"]*\/til\/feed\.atom"[^>]*rel="self"/, 'must have self link to /til/feed.atom');

  // Valid ISO datetime in top-level <updated>
  const feedUpdatedMatch = xml.match(/<feed[^>]*>[\s\S]*?<updated>([^<]+)<\/updated>/);
  assert.ok(feedUpdatedMatch, 'TIL feed must have top-level <updated>');
  const feedUpdated = feedUpdatedMatch && feedUpdatedMatch[1] ? feedUpdatedMatch[1] : '';
  assert.match(feedUpdated, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, '<updated> must be ISO datetime');

  // Entries (if any) must all be TIL posts — <id> should include /til/ path
  const entryPattern = /<entry>[\s\S]*?<\/entry>/g;
  const entries = xml.match(entryPattern) || [];
  for (const entry of entries) {
    const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
    const idMatch = entry.match(/<id>([^<]+)<\/id>/);
    const href = linkMatch && linkMatch[1] ? linkMatch[1] : '';
    const entryId = idMatch && idMatch[1] ? idMatch[1] : '';
    assert.ok(
      href.includes('/til/') || entryId.includes('/til/'),
      `TIL feed entry must be a TIL post (href=${href}, id=${entryId})`
    );
  }
});

test('article page has webmention form', async () => {
  const html = await readFile('public/2019/10/use-type-script-3-7-to-generate/index.html', 'utf8');
  assert.match(html, /webmention/);
  assert.match(html, /<form/);
});

test('article page has non-empty e-content', async () => {
  const html = await readFile('public/2019/10/use-type-script-3-7-to-generate/index.html', 'utf8');
  const eContentMatch = html.match(/<div[^>]*class="e-content"[^>]*>([\s\S]*?)<\/div>/);

  assert.ok(eContentMatch, 'article page should have an e-content div');
  assert.ok(eContentMatch && eContentMatch[1] && eContentMatch[1].trim().length > 0, 'e-content div must not be empty');
  assert.doesNotMatch(html, /\[object Object\]/, 'article page must not contain stringified objects');
});

test('redirect pages generated from template', async () => {
  await access('public/2008/12/ny blogg/index.html');
  const html = await readFile('public/2008/12/ny blogg/index.html', 'utf8');
  assert.match(html, /http-equiv="refresh"/);
  assert.match(html, /url=\/2008\/12\/ny-blogg\//);
});

test('sitemap has URLs', async () => {
  const xml = await readFile('public/sitemap.xml', 'utf8');
  assert.match(xml, /<urlset/);
  assert.match(xml, /<url>/);
});

test('sitemap excludes redirect stubs, feeds, and the 404 page', async () => {
  const xml = await readFile('public/sitemap.xml', 'utf8');
  const locPattern = /<loc>([^<]+)<\/loc>/g;
  const locs = [...xml.matchAll(locPattern)].map(m => m[1] || '');

  assert.ok(locs.length > 0, 'sitemap should have at least one <loc>');

  for (const loc of locs) {
    // Strip siteUrl to get the path (plus trailing slash)
    const path = loc.replace(/^https?:\/\/[^/]+/, '');
    assert.notEqual(path, '/404/', 'sitemap must not list the 404 page');
    assert.doesNotMatch(loc, /\.xml(\/)?$/, `sitemap must not list feed/XML files: ${loc}`);
  }

  for (const { from } of redirects) {
    // Redirect stubs live at `/${from}/` — ensure none appear in the sitemap.
    const redirectUrl = `/${from}/`;
    const encoded = `/${encodeURI(from)}/`;
    for (const loc of locs) {
      const path = loc.replace(/^https?:\/\/[^/]+/, '');
      assert.notEqual(path, redirectUrl, `sitemap must not list redirect path: ${redirectUrl}`);
      assert.notEqual(path, encoded, `sitemap must not list encoded redirect path: ${encoded}`);
    }
  }
});

test('service worker exists', async () => {
  await access('public/sw.js');
});

test('homepage post cards have reading time badges', async () => {
  const html = await readFile('public/index.html', 'utf8');
  const badgePattern = /<span class="badge">\d+ MIN READ<\/span>/g;
  const badges = [...html.matchAll(badgePattern)];

  assert.ok(badges.length > 0, 'homepage should have at least one reading time badge');
});

test('no defunct service references in homepage', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.doesNotMatch(html, /flattr/i);
});

test('homepage has Superfeedr WebSub hub link', async () => {
  const html = await readFile('public/index.html', 'utf8');
  assert.match(html, /rel="hub"/);
  assert.match(html, /voxpelli\.superfeedr\.com/);
});

test('social page has posts with content', async () => {
  const html = await readFile('public/social/index.html', 'utf8');
  assert.match(html, /h-entry/, 'social page should contain h-entry elements');

  const eContentMatch = html.match(/<div[^>]*class="e-content"[^>]*>([\s\S]*?)<\/div>/);
  const likelistMatch = html.match(/likelist/);

  assert.ok(
    (eContentMatch && eContentMatch[1] && eContentMatch[1].trim().length > 0) || likelistMatch,
    'social page should have at least one non-empty e-content div or a likelist'
  );
});

test('links page has bookmark posts', async () => {
  const html = await readFile('public/links/index.html', 'utf8');
  assert.match(html, /u-bookmark-of/, 'links page should contain u-bookmark-of links');
});

test('archive page has year headings', async () => {
  const html = await readFile('public/archive/index.html', 'utf8');
  assert.match(html, /<h2>20\d{2}<\/h2>/, 'archive page should contain year headings');

  const yearPattern = /<h2>(20\d{2})<\/h2>/g;
  const years = [...html.matchAll(yearPattern)].map(m => m[1]);

  assert.ok(years.length >= 2, 'archive page should have at least two year headings');
});

test('offline page renders without frontmatter', async () => {
  const html = await readFile('public/offline/index.html', 'utf8');
  assert.doesNotMatch(html, /^---$/m, 'offline page must not contain frontmatter delimiters');
  assert.doesNotMatch(html, /layout:/, 'offline page must not contain layout: as visible text');
});

test('404 page exists', async () => {
  await access('public/404.html');
});

test('XSS: escapeXml neutralizes <script>-bearing tag names', () => {
  // Regression: tags.template.js interpolates tag names into the page body and
  // into vars.title — a tag containing <script>alert(1)</script> must be escaped.
  const malicious = '<script>alert(1)</script>';
  const escaped = escapeXml(malicious);
  assert.ok(!escaped.includes('<script'), 'escaped tag must not contain raw <script');
  assert.ok(!escaped.includes('</script'), 'escaped tag must not contain raw </script');
  assert.match(escaped, /&lt;script&gt;/);
  assert.match(escaped, /&lt;\/script&gt;/);

  // Also guard the common attribute-breaker chars.
  assert.equal(escapeXml('"\'&<>'), '&quot;&apos;&amp;&lt;&gt;');
});

test('XSS: tags page source escapes tag names before interpolation', async () => {
  // Source-level regression: ensure tags.template.js routes tag names through
  // escapeXml before writing into HTML bodies and <title>.
  const src = await readFile('src/tags.template.js', 'utf8');
  assert.match(src, /escapeXml/, 'tags.template.js must import/use escapeXml');
  // The raw `${tag}` interpolation inside HTML content must be gone.
  assert.doesNotMatch(src, /content-title">Tag: \$\{tag\}</);
  assert.doesNotMatch(src, /title: `Tag: \$\{tag\}`/);
});

test('XSS: safePostUrl allowlists safe schemes for href interpolation', async () => {
  // Regression: encodeURI alone does NOT encode `:` or `<`/`>`, so a
  // `javascript:alert(1)` payload would survive. safePostUrl restricts
  // postUrl to same-origin paths and http(s) URLs; anything else -> ''.

  // Source-level: the old encodeURI(postUrl) guard is gone and safePostUrl is used.
  const src = await readFile('src/lib/render-post.js', 'utf8');
  assert.match(src, /safePostUrl/, 'renderExcerpt must use safePostUrl');
  assert.doesNotMatch(src, /href="\$\{postUrl\}"/);

  // Same-origin absolute path — returned (with URI encoding of special chars).
  assert.equal(safePostUrl('/2024/01/post/'), '/2024/01/post/');
  assert.equal(safePostUrl('/path with space/'), '/path%20with%20space/');

  // https: URL — returned encoded.
  assert.equal(safePostUrl('https://example.com/foo'), 'https://example.com/foo');

  // http: URL — returned encoded (allowlisted).
  assert.equal(safePostUrl('http://example.com/foo'), 'http://example.com/foo');

  // javascript: URL — rejected (empty string).
  assert.equal(safePostUrl('javascript:alert(1)'), '');
  assert.equal(safePostUrl('javascript:alert("x")<script>'), '');

  // data: URL — rejected.
  assert.equal(safePostUrl('data:text/html,<script>'), '');

  // Other hostile schemes.
  assert.equal(safePostUrl('vbscript:msgbox(1)'), '');
  assert.equal(safePostUrl('file:///etc/passwd'), '');

  // Empty / nullish — empty string.
  assert.equal(safePostUrl(''), '');
  /** @type {string | undefined} */
  const undef = undefined;
  assert.equal(safePostUrl(undef), '');

  // Bare string that isn't a URL — rejected (new URL throws).
  assert.equal(safePostUrl('not a url'), '');
});
