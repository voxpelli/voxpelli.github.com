import { renderPost } from './lib/render-post.js';

/**
 * @typedef {{
 *   layout: 'root' | 'article',
 *   title?: string,
 *   category?: 'social' | 'links' | 'til' | 'release',
 *   frontpage?: boolean,
 *   hfeed?: boolean,
 *   webmentionable?: boolean,
 * }} PageVars
 */

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Pelle Wessman',
  frontpage: true,
  webmentionable: true,
  hfeed: true,
}));

/**
 * @param {{ vars: Record<string, unknown> & import('./global-types.d.ts').SiteVars }} options
 * @returns {string}
 */
export default function homePage ({ vars: pageVars }) {
  // Homepage renders the lifestream — blog posts + TIL + links + releases
  // in one chronological stream. Weight-capped at 20 slots in global.data.js
  // (blog = 2 slots, others = 1). Social posts excluded.
  const lifestreamPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.lifestreamPosts) || [];

  const postListItems = lifestreamPosts.map(post =>
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
  <h2>Index // Recent Writings</h2>
</div>

<div class="post-list">
    ${postListItems}
</div>

<p class="posts-extras">
  <a href="/archive/">Browse the archive</a>
</p>`;
}
