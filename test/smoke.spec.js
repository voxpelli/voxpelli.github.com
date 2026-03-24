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
