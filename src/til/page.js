/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Today I Learned',
  category: 'til',
  hfeed: true,
  dataDeps: ['tilPosts'],
}));

/**
 * @param {{ data: Record<string, unknown>, vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function tilPage ({ data, vars: pageVars }) {
  const tilPosts = /** @type {Array<Record<string, unknown>>} */ (data.tilPosts) || [];
  const recentTils = tilPosts.slice(0, 20);

  const postsHtml = recentTils.map(post =>
    renderPost({
      post,
      content: /** @type {string} */ (post.content) || '',
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
