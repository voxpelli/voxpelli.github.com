/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Releases',
  category: 'release',
  hfeed: true,
  dataDeps: ['releasePosts'],
}));

/**
 * @param {{ data: Record<string, unknown>, vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function releasesPage ({ data, vars: pageVars }) {
  const releasePosts = /** @type {Array<Record<string, unknown>>} */ (data.releasePosts) || [];
  const recentReleases = releasePosts.slice(0, 20);

  const postsHtml = recentReleases.map(post =>
    renderPost({
      post,
      content: /** @type {string} */ (post.content) || '',
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
