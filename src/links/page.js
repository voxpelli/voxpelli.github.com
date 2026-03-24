/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Links',
  category: 'links',
  hfeed: true,
}));

/**
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown>, renderInnerPage: (opts: { pages: unknown[] }) => Promise<string> }> }} options
 * @returns {Promise<string>}
 */
export default async function linksPage ({ pages, vars: pageVars }) {
  const linkPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.linkPosts) || [];
  const recentLinks = linkPosts.slice(0, 5);

  // Build page index for O(1) lookup
  /** @type {Map<string, typeof pages[0]>} */
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Pre-render all link posts in parallel
  /** @type {Map<string, string>} */
  const renderCache = new Map();
  await Promise.all(recentLinks.map(async (post) => {
    const page = pagesByPath.get(/** @type {string} */ (post.path));
    const html = page ? /** @type {string} */ (await page.renderInnerPage({ pages })) : '';
    renderCache.set(/** @type {string} */ (post.path), html);
  }));

  const postsHtml = recentLinks.map(post =>
    renderPost({
      post,
      content: renderCache.get(/** @type {string} */ (post.path)) || /** @type {string} */ (post.content) || '',
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n');

  return `<div class="content-header">
  <h2>Links // Recommendations</h2>
</div>

${postsHtml}

${linkPosts.length > 5
? `<ul class="posts-extras">
  <li><a href="/archive/full/">Full Archive</a></li>
</ul>`
: ''}

<script defer src="https://webmention.herokuapp.com/js/cutting-edge.js"></script>`;
}
