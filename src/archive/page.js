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
  const years = Object.keys(postsByYear).toSorted((a, b) => Number(b) - Number(a));

  let result = '<div class="content-header">\n  <p class="content-title">Archive // All Writings</p>\n</div>\n\n';

  result += '<nav class="year-nav" aria-label="Jump to year">\n';
  for (const year of years) {
    result += `  <a href="#year-${year}">${year}</a>\n`;
  }
  result += '</nav>\n\n<div class="post-list">\n';

  for (const year of years) {
    const posts = postsByYear[year] || [];
    result += `  <div class="content-header" id="year-${year}"><h2>${year}</h2></div>\n`;

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
