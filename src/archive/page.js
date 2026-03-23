import { renderPost } from '../lib/render-post.js';

export const vars = {
  layout: 'root',
  title: 'Blog Post Archive',
  hfeed: true,
};

/**
 * @param {{ vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function archivePage ({ vars: pageVars }) {
  const postsByYear = /** @type {Record<string, Array<Record<string, unknown>>>} */ (pageVars.postsByYear) || {};
  const years = Object.keys(postsByYear).sort((a, b) => Number(b) - Number(a));

  let html = '<nav>\n  <h2>Blog posts written over the years</h2>\n\n';

  for (const year of years) {
    const posts = postsByYear[year] || [];
    html += `  <h3>${year}</h3>\n  <ul class="past">\n`;

    for (const post of posts) {
      html += '    ' + renderPost({
        post,
        content: /** @type {string} */ (post.content) || '',
        container: 'li',
        authorName: /** @type {string} */ (pageVars.authorName),
        siteUrl: /** @type {string} */ (pageVars.siteUrl),
      }) + '\n';
    }

    html += '  </ul>\n';
  }

  html += '</nav>';
  return html;
}
