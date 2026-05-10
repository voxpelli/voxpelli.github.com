/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Articles',
  hfeed: true,
}));

/**
 * @param {{ vars: Record<string, unknown> & import('../global-types.d.ts').SiteVars }} options
 * @returns {string}
 */
export default function articlesPage ({ vars: pageVars }) {
  const blogPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.blogPosts) || [];
  const recentArticles = blogPosts.slice(0, 10);

  const postListItems = recentArticles.map(post =>
    renderPost({
      post,
      content: /** @type {string} */ (post.content) || '',
      excerpt: true,
      container: 'article',
      authorName: /** @type {string} */ (pageVars.authorName),
      siteUrl: /** @type {string} */ (pageVars.siteUrl),
    })
  ).join('\n    ');

  return `<div class="content-header">
  <h2>Articles</h2>
</div>

<div class="post-list">
    ${postListItems}
</div>

<p class="posts-extras">
  <a href="/archive/">Browse the full archive</a>
</p>`;
}
