/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Releases',
  category: 'release',
  hfeed: true,
}));

/**
 * @param {{ vars: Record<string, unknown>, pages: import('../global-types.d.ts').PageData[] }} options
 * @returns {Promise<string>}
 */
export default async function releasesPage ({ pages, vars: pageVars }) {
  const releasePosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.releasePosts) || [];
  const recentReleases = releasePosts.slice(0, 20);

  /** @type {Map<string, import('../global-types.d.ts').PageData>} */
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  /** @type {Map<string, string>} */
  const renderCache = new Map();
  await Promise.all(recentReleases.map(async (post) => {
    const page = pagesByPath.get(/** @type {string} */ (post.path));
    const html = page?.renderInnerPage
      ? /** @type {string} */ (await page.renderInnerPage({ pages }))
      : '';
    renderCache.set(/** @type {string} */ (post.path), html);
  }));

  const postsHtml = recentReleases.map(post =>
    renderPost({
      post,
      content: renderCache.get(/** @type {string} */ (post.path)) || /** @type {string} */ (post.content) || '',
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n');

  const emptyState = '<p class="posts-extras"><em>No releases yet.</em></p>';

  return `<div class="content-header">
  <h2>Releases</h2>
</div>

${recentReleases.length > 0 ? postsHtml : emptyState}

${releasePosts.length > 20
? `<p class="posts-extras">
  <a href="/archive/full/">Full Archive</a>
</p>`
: ''}
`;
}
