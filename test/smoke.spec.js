/* eslint-disable security/detect-non-literal-fs-filename */

/**
 * Smoke tests that verify the build output in public/.
 * Run after `npm run build` — the test script runs build first.
 */

import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { escapeXml } from '../src/lib/escape.js';
import { safePostUrl } from '../src/lib/render-post.js';
import { safeHref } from '../src/lib/safe-url.js';
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

test('feed entry <id>s keep the legacy uid scheme — a write-once contract', async () => {
  // Atom entry ids are permanent identifiers, not links. The live feeds have
  // served `http://voxpelli.com` + slash-less path since the Jekyll era
  // (site.uid_base + post.id). Regenerating them — https scheme, trailing
  // slash, anything — re-floods every subscriber with duplicates,
  // irreversibly. This pins the derivation for every feed.
  for (const feedPath of ['public/all.xml', 'public/english.xml', 'public/links/all.xml', 'public/til/feed.atom', 'public/releases/feed.atom', 'public/stream.xml']) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- literal list above
    const xml = await readFile(feedPath, 'utf8');
    const entryIdPattern = /<entry>[\s\S]*?<id>([^<]*)<\/id>/g;
    const ids = [...xml.matchAll(entryIdPattern)].map(m => m[1] || '');
    for (const id of ids) {
      assert.match(id, /^http:\/\/voxpelli\.com\//, `${feedPath}: entry id "${id}" must use the legacy uid base (http://, not the canonical https:// link)`);
      assert.doesNotMatch(id, /\/$/, `${feedPath}: entry id "${id}" must not carry a trailing slash (Jekyll post.id never did)`);
    }
  }
});

test('feed-level <id>s are unique across all feeds', async () => {
  // Regression: deriving the feed id from htmlUrl collided all.xml,
  // english.xml and stream.xml on `https://voxpelli.com/` — readers that
  // key or dedupe subscriptions by feed id conflate them (RFC 4287 requires
  // universally unique ids). all.xml keeps its historical `/` id; every
  // other feed must identify as itself.
  /** @type {Map<string, string>} */
  const seen = new Map();
  for (const feedPath of ['public/all.xml', 'public/english.xml', 'public/links/all.xml', 'public/til/feed.atom', 'public/releases/feed.atom', 'public/stream.xml']) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- literal list above
    const xml = await readFile(feedPath, 'utf8');
    const feedIdMatch = xml.match(/<feed[^>]*>[\s\S]*?<id>([^<]*)<\/id>/);
    const feedId = feedIdMatch && feedIdMatch[1] ? feedIdMatch[1] : '';
    assert.ok(feedId, `${feedPath} must have a feed-level <id>`);
    const holder = seen.get(feedId);
    assert.equal(holder, undefined, `${feedPath} shares feed <id> "${feedId}" with ${holder}`);
    seen.set(feedId, feedPath);
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

  // Entries must all be short-form posts: TIL (/til/), bookmark-style links
  // (/links/), or release (/releases/). SWARM-12 merged links into the TIL
  // superset; SWARM-13 extends the superset to include releases. Reject
  // entries pointing anywhere else (/social/, bare blog post URLs, etc.) —
  // those belong in /all.xml or /stream.xml, not the TIL feed.
  const entryPattern = /<entry>[\s\S]*?<\/entry>/g;
  const entries = xml.match(entryPattern) || [];
  for (const entry of entries) {
    const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
    const idMatch = entry.match(/<id>([^<]+)<\/id>/);
    const href = linkMatch && linkMatch[1] ? linkMatch[1] : '';
    const entryId = idMatch && idMatch[1] ? idMatch[1] : '';
    const isShortForm = /\/(?:til|links|releases)\//.test(href) || /\/(?:til|links|releases)\//.test(entryId);
    assert.ok(
      isShortForm,
      `TIL feed entry must be a TIL / links / release post (href=${href}, id=${entryId})`
    );
  }
});

test('TIL feed is the SWARM-12 superset — includes /links/ entries', async () => {
  // Regression fence: /til/feed.atom absorbs link posts. /links/all.xml stays
  // strict. This test documents the merge shape — if a future revert removes
  // the superset aggregation, this test catches it.
  const tilFeed = await readFile('public/til/feed.atom', 'utf8');
  const linkEntries = (tilFeed.match(/<entry>[\s\S]*?\/links\/[\s\S]*?<\/entry>/g) || []).length;
  assert.ok(linkEntries > 0, 'TIL feed must include at least one /links/ entry after SWARM-12 merge');

  // Companion assertion: /links/all.xml stays strict. It must NOT contain
  // any /til/ entries (the subset-view is unchanged; TIL entries belong
  // in the superset feed, not the other way around).
  const linksFeed = await readFile('public/links/all.xml', 'utf8');
  const tilEntriesInLinks = (linksFeed.match(/<entry>[\s\S]*?\/til\/[\s\S]*?<\/entry>/g) || []).length;
  assert.equal(tilEntriesInLinks, 0, '/links/all.xml must not contain /til/ entries — subset is strict');
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

test('code blocks are keyboard-focusable (a11y)', async () => {
  // CSS makes `pre:has(> code.hljs)` a horizontal scroll container, and a scroll
  // region that can't be focused is unreachable by keyboard (WCAG 2.1.1). The
  // tabindex is injected by wrapFence() in src/markdown-it.settings.js.
  //
  // This guard lives in smoke, not e2e, on purpose: `npm run e2e` is NOT part of
  // `npm test`, so the axe check never runs on pre-push. axe is also
  // content-dependent here — `scrollable-region-focusable` only fires when a
  // block actually overflows, so a shorter code sample could hide a regression.
  const html = await readFile('public/2019/10/use-type-script-3-7-to-generate/index.html', 'utf8');
  const pres = html.match(/<pre\b[^>]*>/g) ?? [];

  assert.ok(pres.length > 0, 'article should contain code blocks to check');
  for (const pre of pres) {
    assert.match(pre, /tabindex="0"/, `every <pre> must be keyboard-focusable, got: ${pre}`);
  }
});

test('link pill uses the AA-safe cloudberry text token (a11y)', async () => {
  // Guards the WCAG AA fix: reverting .post-type-badge--link to the raw
  // --color-cloudberry accent drops it to ~2.6:1. test/token-contrast.spec.js
  // proves the token's VALUE is AA-safe; this proves the badge still USES it.
  const css = await readFile('src/global.css', 'utf8');
  const rule = css.match(/\.post-type-badge--link\s*\{[^}]*\}/);

  assert.ok(rule, 'expected a .post-type-badge--link rule');
  assert.match(
    rule[0],
    /color:\s*var\(--color-cloudberry-text\)/,
    '.post-type-badge--link must use --color-cloudberry-text (the raw accent fails WCAG AA as small text)'
  );
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

test('TIL topic pages built with matching topic content', async () => {
  // topics.template.js groups TIL posts by frontmatter `topic` and renders
  // per-topic index pages at /til/topics/<slug>/. Seed TIL posts are currently
  // `.draft.md` (AI-packaged PESOS placeholders — see notbyai.fyi policy), so
  // they only render under `npm run build-drafts`. In that mode we verify the
  // topic page content; in the default prod build we just verify the template
  // didn't crash by confirming the TIL index and feed exist.
  try {
    await access('public/til/topics/css/index.html');
  } catch {
    // Drafts excluded (prod build): nothing more to check here.
    await access('public/til/index.html');
    await access('public/til/feed.atom');
    return;
  }
  const html = await readFile('public/til/topics/css/index.html', 'utf8');

  assert.match(html, /TILs(: | tagged with: )css/, 'topic page title must name the topic');
  assert.match(html, /h-entry/, 'topic page must list at least one h-entry card');
  assert.match(html, /til-card/, 'topic page must render TIL cards via renderTil');
  assert.match(html, /\/til\/2026\/02\/hex-color-short-form-explained\//, 'css topic page should link the hex-color TIL');
});

test('TIL standalone page renders post-nav (prev/next)', async () => {
  // SWARM-10 R2-1: TIL standalone pages previously fell through the
  // article.layout.js category ladder to blogPosts, where findIndex
  // returned -1 (tilPosts are filter-excluded from blogPosts), so
  // prev/next silently suppressed. Wave B routes through getCategoryCollection
  // so TIL posts now consult tilPosts. Verify the nav actually renders.
  // All current TIL posts are .draft.md and only exist under build-drafts.
  const tilIndexHtml = await readFile('public/til/index.html', 'utf8').catch(() => '');
  if (!tilIndexHtml) return; // TIL index missing entirely — prod build edge
  const firstTilHref = tilIndexHtml.match(/href="(\/til\/\d{4}\/[^"]+\/)"/);
  if (!firstTilHref) return; // All TIL posts are drafts in prod build — skip
  const tilPagePath = `public${firstTilHref[1]}index.html`;
  const tilPageHtml = await readFile(tilPagePath, 'utf8').catch(() => '');
  if (!tilPageHtml) return;
  // post-nav only renders when at least one of prev/next exists. If this is
  // the only TIL post, neither side has a neighbour and the widget is absent
  // by design; skip in that case rather than asserting.
  const hasNav = /class="post-nav"/.test(tilPageHtml);
  const hasNeighbours = tilIndexHtml.match(/href="\/til\/\d{4}\//g);
  if (hasNeighbours && hasNeighbours.length >= 2) {
    assert.ok(hasNav, 'TIL standalone page with ≥2 siblings must render post-nav');
  }
});

test('all 5 metadata linklist components render somewhere in the build', async () => {
  // SWARM-11 H7: post-metadata.js exposes 5 linklist variants (replies,
  // elsewhere, persons, submitted-to, tags). The stress audit flagged that
  // current content only exercises 2/5. If any component has zero rendered
  // instances across the entire build, the component has rotted to unused.
  //
  // The archive/full page aggregates everything so it's the easiest place to
  // hit all 5 — but we scan the whole build in case archive/full is ever
  // trimmed or paginated.
  const components = [
    { className: 'replies linklist', label: 'PostReply' },
    { className: 'elsewhere linklist', label: 'PostSyndication' },
    { className: 'persons linklist', label: 'PostPersonTags' },
    { className: 'submitted-to linklist', label: 'PostSubmitTo' },
    { className: 'tags linklist', label: 'PostTags' },
  ];

  /** @type {Record<string, number>} */
  const counts = Object.fromEntries(components.map(c => [c.className, 0]));

  // Recursively collect every *.html file under public/ — readdir's
  // recursive option lands in Node 20.1+ which the engines field allows.
  const entries = await readdir('public', { recursive: true, withFileTypes: true });
  const htmlFiles = entries
    .filter(e => e.isFile() && e.name.endsWith('.html'))
    .map(e => `${e.parentPath}/${e.name}`);

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    for (const { className } of components) {
      if (html.includes(`class="${className}"`)) {
        counts[className] = (counts[className] || 0) + 1;
      }
    }
  }

  for (const { className, label } of components) {
    assert.ok(
      (counts[className] || 0) > 0,
      `${label} (".${className.replace(' ', '.')}") has ZERO rendered instances across the build — component may have rotted`
    );
  }
});

test('metadata linklist renders correct microformat children', async () => {
  // SWARM-11 H7 cont'd: beyond "does it render anywhere", assert the expected
  // microformat class appears inside each linklist variant. archive/full
  // aggregates enough content to exercise several components in one file.
  const html = await readFile('public/archive/full/index.html', 'utf8');

  // PostReply → u-in-reply-to
  if (html.includes('class="replies linklist"')) {
    assert.match(html, /class="replies linklist"[\s\S]*?class="u-in-reply-to"/, 'replies linklist must contain u-in-reply-to link');
  }
  // PostSyndication → u-syndication
  if (html.includes('class="elsewhere linklist"')) {
    assert.match(html, /class="elsewhere linklist"[\s\S]*?class="u-syndication"/, 'elsewhere linklist must contain u-syndication link');
  }
  // PostPersonTags → u-category h-card
  if (html.includes('class="persons linklist"')) {
    assert.match(html, /class="persons linklist"[\s\S]*?class="u-category h-card"/, 'persons linklist must contain u-category h-card link');
  }
});

test('bilingual localized heading pattern is alive in output', async () => {
  // SWARM-11 H7: post-metadata.js uses LocalizedHeading to render both English
  // ("In reply to:") and Swedish ("Svar på:") strong labels depending on post
  // language. Verify BOTH strings appear somewhere in the build — confirms the
  // bilingual micropattern is exercised by real content, not just shadowed by
  // one language only.
  //
  // NOTE: The `<strong lang="en">` attribute only renders when a post has
  // `lang: 'de'` / `lang: 'fr'` / etc. (non-English AND non-Swedish). No
  // current content exercises that path, so we assert the English/Swedish
  // label strings directly rather than the `lang=` attribute.
  const archive = await readFile('public/archive/full/index.html', 'utf8');
  assert.match(archive, /<strong[^>]*>In reply to:<\/strong>/, 'English "In reply to:" localized heading must appear');
  assert.match(archive, /<strong[^>]*>Svar på:<\/strong>/, 'Swedish "Svar på:" localized heading must appear');
});

test('TIL card subcomponents (til-topic link + relative-time)', async () => {
  // SWARM-11 H9: TIL cards carry three subcomponents — the topic-badge link,
  // optional "via" citation, and a <relative-time> wrapping the datetime.
  // All TIL posts are currently draft-only, so prod build may skip this
  // entirely. When cards exist, assert the structural subcomponents.
  const tilIndexHtml = await readFile('public/til/index.html', 'utf8').catch(() => '');
  if (!tilIndexHtml) return; // TIL index missing — nothing to check

  const hasCard = tilIndexHtml.includes('til-card');
  if (!hasCard) return; // Prod build with drafts excluded — no cards to check

  // til-topic link pattern — <a class="til-topic" href="/til/topics/<slug>/">.
  // Only present on TIL-proper cards (not .til-card--bookmark variants —
  // links posts use .domain-badge instead of .til-topic). If no til-topic
  // is rendered at all (e.g. prod build where TIL drafts excluded and only
  // bookmark-style links cards remain), skip the assertion rather than
  // false-fail on a valid mixed listing.
  if (tilIndexHtml.includes('class="til-topic"')) {
    assert.match(
      tilIndexHtml,
      /<a class="til-topic" href="\/til\/topics\/[^"/]+\/"/,
      'TIL card .til-topic link must target /til/topics/<slug>/'
    );
  }

  // <relative-time> wraps the <time class="dt-published">
  assert.match(
    tilIndexHtml,
    /<relative-time><time class="dt-published"/,
    'TIL card must wrap dt-published inside <relative-time>'
  );

  // til-via (source citation) — only on standalone TIL pages, not cards
  const firstTilHref = tilIndexHtml.match(/href="(\/til\/\d{4}\/[^"]+\/)"/);
  if (firstTilHref && firstTilHref[1]) {
    const standalonePath = `public${firstTilHref[1]}index.html`;
    const standalone = await readFile(standalonePath, 'utf8').catch(() => '');
    if (standalone && standalone.includes('til-via')) {
      assert.match(
        standalone,
        /<p class="til-via">via <a class="u-bookmark-of"/,
        'til-via citation must wrap a u-bookmark-of link'
      );
    }
  }
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

  // Protocol-relative URL — rejected. //evil.com starts with `/` but resolves
  // to an external origin under the page's scheme, so it is NOT same-origin.
  assert.equal(safePostUrl('//evil.com/path'), '');
  assert.equal(safePostUrl('//cdn.example.com/x.js'), '');

  // Empty / nullish — empty string.
  assert.equal(safePostUrl(''), '');
  /** @type {string | undefined} */
  const undef = undefined;
  assert.equal(safePostUrl(undef), '');

  // Bare string that isn't a URL — rejected (new URL throws).
  assert.equal(safePostUrl('not a url'), '');
});

test('XSS: post-metadata component wraps all href interpolations through safePostUrl', async () => {
  // Source-level regression: every href=${...} interpolation in post-metadata.js
  // must go through safePostUrl() (except the encoded-path PostTags case, which
  // is safe-by-construction — encodeURIComponent on a slug string).
  const src = await readFile('src/lib/components/post-metadata.js', 'utf8');
  assert.match(src, /from '\.\.\/safe-url\.js'/, 'post-metadata.js must import from safe-url.js');
  assert.match(src, /safePostUrl/, 'post-metadata.js must use safePostUrl');

  // Strip the one permitted safe-by-construction path (PostTags encodeURIComponent slug)
  // from the source before scanning for bare href interpolations.
  const scanSrc = src.replaceAll(/href=\$\{`\/tags\/\$\{encodeURIComponent\([^`]+`\}/g, 'href=SAFE_SLUG');

  // Find every `href=${...}` interpolation and ensure the argument begins with `safePostUrl(`.
  const hrefPattern = /href=\$\{([^}]+)\}/g;
  const matches = [...scanSrc.matchAll(hrefPattern)];
  assert.ok(matches.length >= 5, `expected at least 5 href interpolations, found ${matches.length}`);
  for (const m of matches) {
    const expr = m[1] || '';
    assert.ok(
      expr.startsWith('safePostUrl('),
      `href interpolation not wrapped in safePostUrl: href=\${${expr}}`
    );
  }
});

test('XSS: safeHref combines scheme guard with attribute escape', () => {
  // javascript: scheme — rejected (safePostUrl returns '', escapeXml of '' is '').
  assert.equal(safeHref('javascript:alert(1)'), '');

  // Same-origin path with a `"` — encoded through encodeURI + escapeXml.
  // encodeURI does NOT encode `"`, so escapeXml must.
  const out = safeHref('/path/with"quote');
  assert.ok(!out.includes('"'), `safeHref output contains literal quote: ${out}`);
  assert.ok(out.includes('&quot;') || out.includes('%22'), `expected encoded quote in ${out}`);

  // https URL — intact (encoded) and non-empty.
  const httpsOut = safeHref('https://example.com/');
  assert.ok(httpsOut.length > 0, 'https URL must not be emptied');
  assert.equal(httpsOut, 'https://example.com/');

  // Nullish — empty.
  assert.equal(safeHref(''), '');
  /** @type {string | undefined} */
  const undef = undefined;
  assert.equal(safeHref(undef), '');

  // Whitespace-padded URLs (copy-paste from frontmatter) must be trimmed,
  // not silently dropped. `new URL(' https://x.com ')` throws strict-parse;
  // without trim this would produce '' and hide legitimate URLs.
  assert.equal(safeHref('  https://example.com/  '), 'https://example.com/');
  assert.equal(safeHref('  /path/here  '), '/path/here');
  assert.equal(safeHref('   '), ''); // all-whitespace → empty
  // Whitespace-prefixed hostile scheme still rejected.
  assert.equal(safeHref('  javascript:alert(1)  '), '');
});

test('SWARM-13 /articles/ page renders post-cards, no til-cards, ≤10 entries', async () => {
  // New /articles/ listing page (SWARM-13 Wave 1 Agent A1). Long-form article
  // summaries only — must not render TIL/bookmark/release cards (those live
  // in /til/, /links/, /releases/).
  const html = await readFile('public/articles/index.html', 'utf8').catch(() => '');
  if (!html) return; // Not built yet (pre-A1) — graceful skip
  assert.match(html, /class="post-card[\s"]/, '/articles/ must contain at least one .post-card');
  assert.doesNotMatch(html, /class="til-card[\s"]/, '/articles/ must not render TIL cards');
  const postCardCount = (html.match(/class="post-card[\s"]/g) || []).length;
  assert.ok(
    postCardCount <= 10,
    `/articles/ must render at most 10 post-card entries, got ${postCardCount}`
  );
});

// NOTE: /feeds/ listing page is gated out for release (src/feeds/page.draft.js)
// pending a human-authored rewrite of its descriptions (notbyai policy). Restore
// this test alongside src/feeds/page.js when the prose lands.

test('SWARM-13 homepage emits rel=alternate → /stream.xml', async () => {
  // Agent A3 rewires root.layout.js per-category rel=alternate routing. The
  // homepage (the full-stream view) must point readers at /stream.xml.
  const html = await readFile('public/index.html', 'utf8');
  assert.match(
    html,
    /<link[^>]+rel="alternate"[^>]+href="\/stream\.xml"|<link[^>]+href="\/stream\.xml"[^>]+rel="alternate"/,
    'homepage must emit <link rel="alternate" href="/stream.xml">'
  );
});

test('SWARM-13 active-nav regression fence — correct nav item marked per path', async () => {
  // Agent A3 adds a navActive(itemHref, currentPath) helper. Each page in the
  // site should mark exactly the nav item matching its path as active. We
  // detect active-state via `aria-current="page"` on the nav link whose href
  // matches the expected target. `/links/` and `/releases/` live under the
  // TIL-superset nav item (per plan), so they activate "TIL".
  /** @type {Array<{ file: string, activeHref: string, label: string }>} */
  const cases = [
    { file: 'public/index.html', activeHref: '/', label: 'Home' },
    { file: 'public/articles/index.html', activeHref: '/articles/', label: 'Articles' },
    { file: 'public/til/index.html', activeHref: '/til/', label: 'TIL' },
    { file: 'public/links/index.html', activeHref: '/til/', label: 'TIL (via /links/)' },
    { file: 'public/releases/index.html', activeHref: '/til/', label: 'TIL (via /releases/)' },
  ];

  for (const { activeHref, file, label } of cases) {
    const html = await readFile(file, 'utf8').catch(() => '');
    if (!html) continue; // Page not built (e.g. drafts-only /releases/) — graceful skip
    // Match an <a> nav-item whose href matches the expected target and which
    // carries aria-current="page" (attribute order-agnostic).
    const escaped = activeHref.replaceAll('/', '\\/');
    // eslint-disable-next-line security/detect-non-literal-regexp
    const ariaCurrentFirst = new RegExp(`<a[^>]*aria-current="page"[^>]*href="${escaped}"`);
    // eslint-disable-next-line security/detect-non-literal-regexp
    const hrefFirst = new RegExp(`<a[^>]*href="${escaped}"[^>]*aria-current="page"`);
    assert.ok(
      ariaCurrentFirst.test(html) || hrefFirst.test(html),
      `${file}: expected nav item ${label} (href="${activeHref}") to carry aria-current="page"`
    );
  }
});

test('SWARM-13 /releases/ renders til-card--release + My full release notes label', async () => {
  const html = await readFile('public/releases/index.html', 'utf8').catch(() => '');
  if (!html) return; // Not built or only drafts exist — graceful skip
  // Only a real release (non-draft) would trigger the modifier class — if the
  // page was built but contains no visible release cards, skip too.
  if (!html.includes('til-card--release')) return;
  assert.match(html, /til-card--release/, '/releases/ must render .til-card--release when a release is present');
  assert.match(html, /My full release notes/, '/releases/ card must use release-specific read-more label');
});

test('SWARM-13 TIL card pill badge links back to /til/', async () => {
  // Agent C1: TIL cards carry a .post-type-badge.post-type-badge--til anchor
  // that links to the TIL index. Attribute order in the built output is not
  // guaranteed, so accept either class-first or href-first ordering.
  const html = await readFile('public/til/index.html', 'utf8').catch(() => '');
  if (!html) return; // TIL index not built — graceful skip
  // Cascade-skip when /til/ currently has no real TIL-category posts (only
  // drafts) — the superset page may be rendering only /links/ or /releases/
  // entries, which carry --link / --release badges, not --til.
  if (!html.includes('post-type-badge--til')) return;
  const classFirst = /<a[^>]*class="[^"]*post-type-badge post-type-badge--til[^"]*"[^>]*href="\/til\/"[^>]*>TIL<\/a>/;
  const hrefFirst = /<a[^>]*href="\/til\/"[^>]*class="[^"]*post-type-badge post-type-badge--til[^"]*"[^>]*>TIL<\/a>/;
  assert.ok(
    classFirst.test(html) || hrefFirst.test(html),
    '/til/ must render a <a class="post-type-badge post-type-badge--til" href="/til/">TIL</a> pill'
  );
});

test('SWARM-13 bookmark card pill badge links back to /links/', async () => {
  // Agent C2: bookmark cards carry a .post-type-badge.post-type-badge--link
  // anchor that links to /links/. Attribute order-agnostic.
  const html = await readFile('public/links/index.html', 'utf8').catch(() => '');
  if (!html) return; // /links/ index not built — graceful skip
  const classFirst = /<a[^>]*class="[^"]*post-type-badge post-type-badge--link[^"]*"[^>]*href="\/links\/"/;
  const hrefFirst = /<a[^>]*href="\/links\/"[^>]*class="[^"]*post-type-badge post-type-badge--link[^"]*"/;
  assert.ok(
    classFirst.test(html) || hrefFirst.test(html),
    '/links/ must render a .post-type-badge.post-type-badge--link anchor pointing at /links/'
  );
});

test('XSS: built output contains no javascript:/data:/vbscript: URLs in href/src attrs', async () => {
  // End-to-end backstop for the URL safety convention: walk every built HTML
  // and feed file under public/ and assert that no hostile URL scheme survived
  // attribute-position rendering. async-htm-to-string's html`` tag escapes
  // <>"'& but NOT URL schemes, so this is the only smoke test that catches a
  // bypass-safePostUrl regression in the full render pipeline. Pairs with the
  // local/no-unsafe-url-interpolation ESLint rule (write-time prevention).
  // Cover the same URL attribute set as the local/no-unsafe-url-interpolation
  // ESLint rule (eslint.config.js URL_ATTR_RE) so write-time and built-output
  // gates protect the same surface. Adds `action` (webmention forms), plus
  // formaction/poster/cite/manifest for completeness.
  const HOSTILE_RE = /(?:href|src|action|formaction|poster|cite|manifest)="\s*(?:javascript|data|vbscript|file):/i;
  const entries = await readdir('public', { recursive: true, withFileTypes: true });
  const files = entries
    .filter(e => e.isFile() && /\.(?:html|xml|atom)$/.test(e.name))
    .map(e => `${e.parentPath}/${e.name}`);

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const m = HOSTILE_RE.exec(content);
    assert.ok(!m, `${file} contains hostile URL scheme: ${m && m[0]}`);
  }
});

test('SWARM-13 release card pill badge links back to /releases/', async () => {
  // Agent C3: release cards carry a .post-type-badge.post-type-badge--release
  // anchor that links to /releases/. Cascade-skip when the page has no
  // non-draft releases — the substring won't appear at all in that case.
  const html = await readFile('public/releases/index.html', 'utf8').catch(() => '');
  if (!html) return; // /releases/ index not built — graceful skip
  if (!html.includes('post-type-badge--release')) return; // No non-draft releases — cascade skip
  const classFirst = /<a[^>]*class="[^"]*post-type-badge post-type-badge--release[^"]*"[^>]*href="\/releases\/"/;
  const hrefFirst = /<a[^>]*href="\/releases\/"[^>]*class="[^"]*post-type-badge post-type-badge--release[^"]*"/;
  assert.ok(
    classFirst.test(html) || hrefFirst.test(html),
    '/releases/ must render a .post-type-badge.post-type-badge--release anchor pointing at /releases/'
  );
});
