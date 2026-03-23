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
});

test('Atom feed has entries with rendered HTML content', async () => {
  const xml = await readFile('public/all.xml', 'utf8');
  assert.match(xml, /<entry>/);
  assert.match(xml, /<content type="html">/);
});

test('article page has webmention form', async () => {
  const html = await readFile('public/2019/10/use-type-script-3-7-to-generate/index.html', 'utf8');
  assert.match(html, /webmention/);
  assert.match(html, /<form/);
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
  assert.doesNotMatch(html, /superfeedr/i);
});
