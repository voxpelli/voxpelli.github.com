import { renderRssEntry } from './lib/render-rss-entry.js';

/**
 * Generate multiple Atom feeds
 *
 * @param {{ vars: Record<string, unknown> }} options
 * @returns {Array<{ outputName: string, content: string }>}
 */
export default function feedsTemplate ({ vars }) {
  const siteUrl = /** @type {string} */ (vars.siteUrl);
  const blogName = /** @type {string} */ (vars.blogName);
  const authorName = /** @type {string} */ (vars.authorName);
  const authorEmail = /** @type {string} */ (vars.authorEmail);
  const pushHub = /** @type {string} */ (vars.pushHub);
  const now = new Date().toISOString();

  const recentPosts = /** @type {Array<Record<string, unknown>>} */ (vars.recentPosts) || [];
  const recentEnglishPosts = /** @type {Array<Record<string, unknown>>} */ (vars.recentEnglishPosts) || [];
  const recentLinks = /** @type {Array<Record<string, unknown>>} */ (vars.recentLinks) || [];

  /**
   * @param {object} options
   * @param {string} options.selfUrl
   * @param {string} [options.htmlUrl]
   * @param {string} [options.subtitle]
   * @param {Array<Record<string, unknown>>} options.posts
   * @returns {string}
   */
  function buildFeed ({ selfUrl, htmlUrl, subtitle, posts }) {
    const entries = posts
      .map(post => renderRssEntry({ post, content: /** @type {string} */ (post.content) || '', siteUrl }))
      .join('\n');

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

${entries}

</feed>`;
  }

  return [
    {
      outputName: 'all.xml',
      content: buildFeed({
        selfUrl: '/all.xml',
        htmlUrl: '/',
        posts: recentPosts,
      }),
    },
    {
      outputName: 'english.xml',
      content: buildFeed({
        selfUrl: '/english.xml',
        htmlUrl: '/',
        subtitle: 'English posts',
        posts: recentEnglishPosts,
      }),
    },
    {
      outputName: 'links/all.xml',
      content: buildFeed({
        selfUrl: '/links/all.xml',
        htmlUrl: '/links/',
        subtitle: 'Links',
        posts: recentLinks,
      }),
    },
  ];
}

/** @param {string} str */
function escapeXml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
