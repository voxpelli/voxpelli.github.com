import { renderPost } from '../../lib/render-post.js';

/**
 * Full archive — all post types (blog, social, links) in chronological order.
 *
 * @param {{ pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown>, renderInnerPage: (opts: { pages: unknown[] }) => Promise<string> }>, vars: Record<string, unknown> }} options
 * @returns {Promise<string>}
 */
export default async function fullArchivePage ({ pages, vars: pageVars }) {
  const allPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.allPosts) || [];

  // Build page index for content rendering
  /** @type {Map<string, typeof pages[0]>} */
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Pre-render all posts in parallel
  /** @type {Map<string, string>} */
  const renderCache = new Map();
  await Promise.all(allPosts.map(async (post) => {
    const page = pagesByPath.get(/** @type {string} */ (post.path));
    if (page) {
      renderCache.set(/** @type {string} */ (post.path), await page.renderInnerPage({ pages }));
    }
  }));

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
      const content = renderCache.get(/** @type {string} */ (post.path)) || '';
      result += renderPost({
        authorName: String(pageVars.authorName || ''),
        content,
        post,
        siteUrl: String(pageVars.siteUrl || ''),
      }) + '\n';
    }
  }

  return result;
}
