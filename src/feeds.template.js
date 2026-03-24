import { escapeXml } from './lib/escape.js';
import { filterAndSortPosts } from './lib/posts.js';
import { renderRssEntry } from './lib/render-rss-entry.js';

/**
 * Generate multiple Atom feeds using async generator pattern.
 *
 * Templates receive { vars, pages } where vars is global.vars only (not global.data).
 * Pages are full PageData objects with renderInnerPage() available for getting rendered HTML.
 *
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown>, renderInnerPage: (opts: { pages: unknown[] }) => Promise<string> }> }} options
 */
export default async function * feedsTemplate ({ pages, vars }) {
  const siteUrl = /** @type {string} */ (vars.siteUrl);
  const blogName = /** @type {string} */ (vars.blogName);
  const authorName = /** @type {string} */ (vars.authorName);
  const authorEmail = /** @type {string} */ (vars.authorEmail);
  const pushHub = /** @type {string} */ (vars.pushHub) || '';
  const now = new Date().toISOString();

  // Filter and sort posts using shared helper
  const allPosts = filterAndSortPosts(pages);

  const blogPosts = allPosts.filter(p => !p.category);
  const recentPosts = blogPosts.slice(0, 10);
  const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
  const recentLinks = allPosts.filter(p => p.category === 'links').slice(0, 10);

  // Build page index for O(1) lookup instead of O(n) pages.find() per post
  /** @type {Map<string, typeof pages[0]>} */
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Pre-render all unique feed posts in parallel, with cache to avoid duplicates
  const allFeedPosts = [...new Map([...recentPosts, ...recentEnglishPosts, ...recentLinks].map(p => [p.path, p])).values()];
  /** @type {Map<string, string>} */
  const renderCache = new Map();
  await Promise.all(allFeedPosts.map(async (post) => {
    const page = pagesByPath.get(/** @type {string} */ (post.path));
    const html = page ? /** @type {string} */ (await page.renderInnerPage({ pages })) : '';
    renderCache.set(/** @type {string} */ (post.path), html);
  }));

  /**
   * @param {object} options
   * @param {string} options.selfUrl
   * @param {string} [options.htmlUrl]
   * @param {string} [options.subtitle]
   * @param {Array<Record<string, unknown>>} options.posts
   * @returns {string}
   */
  function buildFeed ({ htmlUrl, posts, selfUrl, subtitle }) {
    const entries = posts.map(post => {
      const html = renderCache.get(/** @type {string} */ (post.path)) || '';
      return renderRssEntry({ content: html, post, siteUrl });
    });

    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">

 <title>${escapeXml(blogName)}${subtitle ? ` \u2013 ${escapeXml(subtitle)}` : ''}</title>
 <link href="${escapeXml(siteUrl + selfUrl)}" rel="self" type="application/atom+xml" />
 ${pushHub ? `<link href="${escapeXml(pushHub)}" rel="hub" />` : ''}
 ${htmlUrl ? `<link href="${escapeXml(siteUrl + htmlUrl)}" type="text/html" />` : ''}
 <updated>${now}</updated>
 <id>${escapeXml(siteUrl + (htmlUrl || selfUrl))}</id>
 <author>
   <name>${escapeXml(authorName)}</name>
   <email>${escapeXml(authorEmail)}</email>
 </author>

${entries.join('\n')}

</feed>`;
  }

  yield {
    outputName: 'all.xml',
    content: buildFeed({
      selfUrl: '/all.xml',
      htmlUrl: '/',
      posts: recentPosts,
    }),
  };

  yield {
    outputName: 'english.xml',
    content: buildFeed({
      selfUrl: '/english.xml',
      htmlUrl: '/',
      subtitle: 'English posts',
      posts: recentEnglishPosts,
    }),
  };

  yield {
    outputName: 'links/all.xml',
    content: buildFeed({
      selfUrl: '/links/all.xml',
      htmlUrl: '/links/',
      subtitle: 'Links',
      posts: recentLinks,
    }),
  };
}
