/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Blog Post Archive',
  hfeed: true,
}));

/**
 * @param {{ vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function archivePage ({ vars: pageVars }) {
  const postsByYear = /** @type {Record<string, Array<Record<string, unknown>>>} */ (pageVars.postsByYear) || {};
  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  let result = '<div class="content-header">\n  <h2>Archive // All Writings</h2>\n</div>\n\n<div class="post-list">\n';

  for (const year of years) {
    const posts = postsByYear[year] || [];
    result += `  <div class="content-header"><h3>${year}</h3></div>\n`;

    for (const post of posts) {
      result += '    ' + renderPost({
        post,
        content: /** @type {string} */ (post.content) || '',
        container: 'article',
        authorName: /** @type {string} */ (pageVars.authorName),
        siteUrl: /** @type {string} */ (pageVars.siteUrl),
      }) + '\n';
    }
  }

  result += '</div>';
  return result;
}
