import { filterAndSortPosts } from './lib/posts.js';

/**
 * Aggregate page data for indexes, feeds, and archives.
 * Pages are DomStack PageData objects with .pageInfo and .vars properties.
 *
 * @param {{ pages: Array<{ pageInfo: { path: string, outputRelname: string }, vars: Record<string, unknown> }> }} options
 * @returns {Record<string, unknown>}
 */
export default function globalData ({ pages }) {
  // Build page index for enriching base posts with extra fields
  /** @type {Map<string, Record<string, unknown>>} */
  const varsByPath = new Map(pages.map(p => [p.pageInfo.path, p.vars]));

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
