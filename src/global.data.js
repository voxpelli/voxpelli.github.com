import { filterAndSortPosts } from './lib/posts.js';

/**
 * @typedef {object} PageData
 * @property {{ path: string, outputRelname: string }} pageInfo
 * @property {Record<string, unknown>} vars
 * @property {(opts: { pages: PageData[] }) => Promise<string>} [renderInnerPage]
 */

/**
 * Aggregate page data for indexes, feeds, and archives.
 * Pages are DomStack PageData objects with .pageInfo and .vars properties.
 *
 * @param {{ pages: PageData[] }} options
 * @returns {Promise<Record<string, unknown>>}
 */
export default async function globalData ({ pages }) {
  // Build page index for enriching base posts with extra fields
  /** @type {Map<string, Record<string, unknown>>} */
  const varsByPath = new Map(pages.map(p => [p.pageInfo.path, p.vars]));
  /** @type {Map<string, PageData>} */
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Filter and sort posts using shared helper, then enrich with extra fields
  const allPosts = filterAndSortPosts(pages).map(post => {
    const vars = varsByPath.get(post.path);
    return {
      ...post,
      content: vars?.content || '',
      tags: vars?.tags,
      persontags: vars?.persontags,
      submitto: vars?.submitto,
    };
  });

  // Categorize posts
  const blogPosts = allPosts.filter(p => !p.category);
  const socialPosts = allPosts.filter(p => p.category === 'social');
  const linkPosts = allPosts.filter(p => p.category === 'links');

  // Recent posts for feeds
  const recentPosts = blogPosts.slice(0, 10);
  const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
  const recentLinks = linkPosts.slice(0, 10);

  // Render recent blog posts to get content for reading time calculation.
  // Only the 10 most recent are rendered (shown on homepage) for performance.
  await Promise.all(recentPosts.map(async (post) => {
    const page = pagesByPath.get(post.path);
    if (!page || typeof page.renderInnerPage !== 'function') return;
    try {
      const renderedHtml = await page.renderInnerPage({ pages });
      if (typeof renderedHtml === 'string' && renderedHtml) {
        post.content = renderedHtml;
      }
    } catch {
      // Silently skip failed renders — reading time is non-critical
    }
  }));

  // Posts by year for archive
  /** @type {Record<string, typeof blogPosts>} */
  const postsByYear = {};
  for (const post of blogPosts) {
    const year = new Date(/** @type {string} */ (post.date)).getFullYear().toString();
    if (!postsByYear[year]) postsByYear[year] = [];
    postsByYear[year].push(post);
  }

  return {
    allPosts,
    blogPosts,
    socialPosts,
    linkPosts,
    recentPosts,
    recentEnglishPosts,
    recentLinks,
    postsByYear,
  };
}
