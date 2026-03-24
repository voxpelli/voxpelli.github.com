/**
 * Smoke tests that verify the build output in public/.
 * Run after `npm run build` — the test script runs build first.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

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

test('service worker exists', async () => {
  await access('public/sw.js');
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
  assert.match(html, /<h3>20\d{2}<\/h3>/, 'archive page should contain year headings');

  const yearPattern = /<h3>(20\d{2})<\/h3>/g;
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
