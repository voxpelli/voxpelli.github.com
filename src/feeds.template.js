import { escapeXml } from './lib/escape.js';
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
  const pushHub = /** @type {string} */ (vars.pushHub);
  const now = new Date().toISOString();

  // Extract and sort posts from pages (same logic as global.data.js)
  const allPosts = pages
    .filter(p => {
      try {
        return p.vars && p.vars.layout === 'article' && p.vars.date;
      } catch {
        return false;
      }
    })
    .map(p => {
      const pageVars = p.vars;
      const pagePath = p.pageInfo.path;
      const pageUrl = pagePath ? '/' + pagePath + '/' : '/';
      return {
        title: pageVars.title || '',
        date: pageVars.date,
        lang: pageVars.lang,
        category: pageVars.category,
        path: pagePath,
        pageUrl,
      };
    })
    .sort((a, b) => new Date(/** @type {string} */ (b.date)).getTime() - new Date(/** @type {string} */ (a.date)).getTime());

  const blogPosts = allPosts.filter(p => !p.category);
  const recentPosts = blogPosts.slice(0, 10);
  const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
  const recentLinks = allPosts.filter(p => p.category === 'links').slice(0, 10);

  /**
   * @param {object} options
   * @param {string} options.selfUrl
   * @param {string} [options.htmlUrl]
   * @param {string} [options.subtitle]
   * @param {Array<Record<string, unknown>>} options.posts
   * @returns {Promise<string>}
   */
  async function buildFeed ({ htmlUrl, posts, selfUrl, subtitle }) {
    const entries = [];
    for (const post of posts) {
      // Find the matching PageData object to get rendered HTML via renderInnerPage
      const page = pages.find(p => p.pageInfo.path === post.path);
      const html = page ? await page.renderInnerPage({ pages }) : '';
      entries.push(renderRssEntry({ post, content: /** @type {string} */ (html), siteUrl }));
    }

    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">

 <title>${escapeXml(blogName)}${subtitle ? ` \u2013 ${escapeXml(subtitle)}` : ''}</title>
 <link href="${escapeXml(siteUrl + selfUrl)}" rel="self" type="application/atom+xml" />
 <link href="${escapeXml(pushHub)}" rel="hub" />
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
    content: await buildFeed({
      selfUrl: '/all.xml',
      htmlUrl: '/',
      posts: recentPosts,
    }),
  };

  yield {
    outputName: 'english.xml',
    content: await buildFeed({
      selfUrl: '/english.xml',
      htmlUrl: '/',
      subtitle: 'English posts',
      posts: recentEnglishPosts,
    }),
  };

  yield {
    outputName: 'links/all.xml',
    content: await buildFeed({
      selfUrl: '/links/all.xml',
      htmlUrl: '/links/',
      subtitle: 'Links',
      posts: recentLinks,
    }),
  };
}
