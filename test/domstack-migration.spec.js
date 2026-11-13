/* eslint-disable security/detect-non-literal-fs-filename */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import {
  access, cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile,
} from 'node:fs/promises';

import { DomStack } from '@domstack/static';
import { fingerprint } from '@domstack/static/lib/build-pages/global-data/fingerprint.js';

import globalData from '../src/global.data.js';

const execFileAsync = promisify(execFile);

/**
 * @param {Record<string, unknown>} vars
 * @param {string} content
 * @returns {import('../src/global-types.d.ts').PageData}
 */
function postPage (vars, content) {
  return /** @type {import('../src/global-types.d.ts').PageData} */ (/** @type {unknown} */ ({
    pageInfo: { path: 'example' },
    vars: { layout: 'article', date: '2020-01-01', ...vars },
    renderInnerPage: async () => content,
  }));
}

test('ordinary post collections have stable, content-sensitive watch fingerprints', async () => {
  const vars = { title: 'Example', lang: 'en', tags: ['example'], 'mf-photo': ['https://example.com/a.png'] };
  const first = await globalData({ pages: [postPage(vars, '<p>First</p>')] });
  const same = await globalData({ pages: [postPage(vars, '<p>First</p>')] });
  const changedContent = await globalData({ pages: [postPage(vars, '<p>Second</p>')] });
  const changedDate = await globalData({ pages: [postPage({ ...vars, date: '2020-01-02' }, '<p>First</p>')] });

  for (const key of ['allPosts', 'blogPosts', 'lifestreamPosts', 'recentPosts', 'postsByYear', 'allTags']) {
    const original = fingerprint(first[key]);
    assert.ok(original, `${key} must have a usable fingerprint`);
    assert.equal(fingerprint(same[key]), original);
    assert.notEqual(fingerprint(changedContent[key]), original);
    assert.notEqual(fingerprint(changedDate[key]), original);
  }
  const posts = /** @type {Array<Record<string, unknown>>} */ (first.allPosts);
  assert.equal(posts[0]?.category, undefined);
  assert.deepEqual(posts[0]?.tags, ['example']);
  assert.deepEqual(posts[0]?.['mf-photo'], ['https://example.com/a.png']);

  const date = new Date('2020-01-01T00:00:00Z');
  const opaque = await globalData({ pages: [postPage({ ...vars, date }, '<p>First</p>')] });
  const opaquePosts = /** @type {Array<Record<string, unknown>>} */ (opaque.allPosts);
  assert.equal(opaquePosts[0]?.date, date);
  // eslint-disable-next-line unicorn/no-null -- DomStack uses null for an un-fingerprintable value.
  assert.equal(fingerprint(opaque.allPosts), null, 'opaque values must retain conservative invalidation');
});

test('post rendering preserves intentionally empty content and reports failures', async () => {
  const empty = await globalData({ pages: [postPage({}, '')] });
  const posts = /** @type {Array<Record<string, unknown>>} */ (empty.allPosts);
  assert.equal(posts[0]?.content, '');
  const fallback = await globalData({ pages: [postPage({ content: 'fallback' }, '')] });
  const fallbackPosts = /** @type {Array<Record<string, unknown>>} */ (fallback.allPosts);
  assert.equal(fallbackPosts[0]?.content, 'fallback');

  const failure = new Error('render failed');
  const page = postPage({}, '');
  page.renderInnerPage = async () => { throw failure; };
  await assert.rejects(globalData({ pages: [page] }), (err) => {
    assert.ok(err instanceof Error);
    assert.match(err.message, /Cannot render post "example" while resolving global data/);
    assert.equal(err.cause, failure);
    return true;
  });
});

test('a data-dependent post fails the build instead of silently losing content', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'site-domstack-render-'));
  try {
    const src = path.join(dir, 'src');
    await mkdir(path.join(src, 'post'), { recursive: true });
    await writeFile(path.join(dir, 'package.json'), '{"type":"module"}');
    await writeFile(path.join(src, 'global.data.js'), `export { default } from ${JSON.stringify(new URL('../src/global.data.js', import.meta.url).href)};`);
    await writeFile(path.join(src, 'article.layout.js'), 'export default ({ children }) => children;');
    await writeFile(path.join(src, 'page.js'), "export const vars = { dataDeps: ['socialPosts'] }; export default ({ data }) => data.socialPosts[0].content;");
    const post = path.join(src, 'post/page.js');
    const postVars = "layout: 'article', date: '2020-01-01', category: 'social'";
    await writeFile(post, `export const vars = { ${postVars}, dataDeps: ['blogPosts'] }; export default ({ data }) => String(data.blogPosts.length);`);

    await assert.rejects(new DomStack(src, path.join(dir, 'public')).build(), (err) => {
      assert.ok(err instanceof AggregateError);
      const failures = /** @type {unknown[]} */ (err.errors);
      const failure = failures.find(item => item instanceof Error && item.message.includes('Cannot render post "post"'));
      assert.ok(failure instanceof Error);
      assert.ok(failure.cause instanceof Error);
      assert.match(failure.cause.message, /Global data is not available/);
      return true;
    });

    await writeFile(post, `export const vars = { ${postVars} }; export default () => '<p>rendered post</p>';`);
    await new DomStack(src, path.join(dir, 'public')).build();
    assert.match(await readFile(path.join(dir, 'public/index.html'), 'utf8'), /rendered post/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a production build removes outputs left by a draft build', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'site-domstack-build-'));
  try {
    await Promise.all(['src', 'images', 'media'].map(name => cp(name, path.join(dir, name), { recursive: true })));
    await Promise.all(['package.json', 'sw.js'].map(name => cp(name, path.join(dir, name))));
    await symlink(path.resolve('node_modules'), path.join(dir, 'node_modules'), 'dir');
    const { stdout } = await execFileAsync('git', ['rev-parse', '--absolute-git-dir']);
    // eslint-disable-next-line n/no-process-env -- Preserve PATH and npm's environment in the isolated build.
    const options = { cwd: dir, env: { ...process.env, GIT_DIR: stdout.trim() } };
    const draft = path.join(dir, 'public/stress/index.html');
    await execFileAsync('npm', ['run', 'build-drafts'], options);
    await access(draft);
    const sitemap = await readFile(path.join(dir, 'public/sitemap.xml'), 'utf8');
    assert.match(sitemap, /<loc>https:\/\/voxpelli\.com\/til\/topics\/css\/<\/loc>/);
    await access(path.join(dir, 'public/til/topics/css/index.html'));
    await execFileAsync('npm', ['run', 'build'], options);
    await assert.rejects(access(draft), { code: 'ENOENT' });
    await access(path.join(dir, 'public/index.html'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
