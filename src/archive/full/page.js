import { renderPost } from '../../lib/render-post.js';

/**
 * Full archive — all post types (blog, social, links) in chronological order.
 *
 * @param {{ data: Record<string, unknown>, vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function fullArchivePage ({ data, vars: pageVars }) {
  const allPosts = /** @type {Array<Record<string, unknown>>} */ (data.allPosts) || [];

  // Group by year
  /** @type {Record<string, typeof allPosts>} */
  const postsByYear = {};
  for (const post of allPosts) {
    const year = new Date(/** @type {string} */ (post.date)).getFullYear().toString();
    if (!postsByYear[year]) postsByYear[year] = [];
    postsByYear[year].push(post);
  }

  const years = Object.keys(postsByYear).toSorted((a, b) => Number(b) - Number(a));

  let result = '<div class="content-header">\n  <h2>Full Archive // All Content</h2>\n</div>\n\n';

  for (const year of years) {
    const posts = postsByYear[year] || [];
    result += `<div class="content-header"><h3>${year}</h3></div>\n`;

    for (const post of posts) {
      result += renderPost({
        authorName: String(pageVars.authorName || ''),
        content: String(post.content || ''),
        post,
        siteUrl: String(pageVars.siteUrl || ''),
      }) + '\n';
    }
  }

  return result;
}
