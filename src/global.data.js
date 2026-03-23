/**
 * Aggregate page data for indexes, feeds, and archives.
 * Pages are DomStack PageData objects with .pageInfo and .vars properties.
 *
 * @param {{ pages: Array<{ pageInfo: { path: string, outputRelname: string }, vars: Record<string, unknown> }> }} options
 * @returns {Record<string, unknown>}
 */
export default function globalData ({ pages }) {
  // Filter pages that are blog posts (have a date and article layout)
  const allPosts = pages
    .filter(p => {
      try {
        return p.vars && p.vars.layout === 'article' && p.vars.date;
      } catch {
        return false;
      }
    })
    .map(p => {
      const vars = p.vars;
      const pagePath = p.pageInfo.path;
      // DomStack pageInfo.path is the directory path (e.g., "2015/01/pubsub-with-postgres-and-node-js")
      const pageUrl = pagePath ? '/' + pagePath + '/' : '/';

      return {
        title: vars.title || '',
        date: vars.date,
        lang: vars.lang,
        category: vars.category,
        content: vars.content || '',
        path: pagePath,
        pageUrl,
        // Preserve all mf-* fields
        ...Object.fromEntries(
          Object.entries(vars).filter(([k]) => k.startsWith('mf-'))
        ),
        tags: vars.tags,
        persontags: vars.persontags,
        submitto: vars.submitto,
      };
    })
    .sort((a, b) => new Date(/** @type {string} */ (b.date)).getTime() - new Date(/** @type {string} */ (a.date)).getTime());

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
