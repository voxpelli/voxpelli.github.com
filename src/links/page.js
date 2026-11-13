/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Links',
  category: 'links',
  hfeed: true,
  dataDeps: ['linkPosts'],
}));

/**
 * @param {{ data: Record<string, unknown>, vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function linksPage ({ data, vars: pageVars }) {
  const linkPosts = /** @type {Array<Record<string, unknown>>} */ (data.linkPosts) || [];
  const recentLinks = linkPosts.slice(0, 5);

  const postsHtml = recentLinks.map(post =>
    renderPost({
      post,
      content: /** @type {string} */ (post.content) || '',
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n');

  return `<div class="content-header">
  <h2>Links // Recommendations</h2>
</div>

${postsHtml}

${linkPosts.length > 5
? `<p class="posts-extras">
  <a href="/archive/full/">Full Archive</a>
</p>`
: ''}
`;
}
