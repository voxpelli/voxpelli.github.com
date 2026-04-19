/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Today I Learned',
  category: 'til',
  hfeed: true,
}));

/**
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown>, renderInnerPage: (opts: { pages: unknown[] }) => Promise<string> }> }} options
 * @returns {Promise<string>}
 */
export default async function tilPage ({ pages, vars: pageVars }) {
  const tilPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.tilPosts) || [];
  const recentTils = tilPosts.slice(0, 20);

  // Build page index for O(1) lookup
  /** @type {Map<string, typeof pages[0]>} */
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Pre-render all TIL posts in parallel
  /** @type {Map<string, string>} */
  const renderCache = new Map();
  await Promise.all(recentTils.map(async (post) => {
    const page = pagesByPath.get(/** @type {string} */ (post.path));
    const html = page ? /** @type {string} */ (await page.renderInnerPage({ pages })) : '';
    renderCache.set(/** @type {string} */ (post.path), html);
  }));

  const postsHtml = recentTils.map(post =>
    renderPost({
      post,
      content: renderCache.get(/** @type {string} */ (post.path)) || /** @type {string} */ (post.content) || '',
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n');

  const emptyState = '<p class="posts-extras"><em>No TILs yet — check back soon.</em></p>';

  return `<div class="content-header">
  <h2>Today I Learned</h2>
  <p>Short notes on things I&rsquo;ve picked up along the way &mdash; bite-sized, date-stamped, and occasionally corrected later.</p>
</div>

${recentTils.length > 0 ? postsHtml : emptyState}

${tilPosts.length > 20
? `<p class="posts-extras">
  <a href="/archive/full/">Full Archive</a>
</p>`
: ''}
`;
}
