/**
 * Shared post-filtering and sorting logic for indexes, feeds, and archives.
 *
 * @typedef {object} BasePost
 * @property {string} title
 * @property {unknown} date
 * @property {unknown} lang
 * @property {unknown} category
 * @property {string} path
 * @property {string} pageUrl
 */

/**
 * Filter pages for blog posts (layout === 'article' with a truthy date),
 * map to a minimal post object, and sort descending by date.
 *
 * @param {Array<{ pageInfo: { path: string }, vars: Record<string, unknown> }>} pages
 * @returns {BasePost[]}
 */
export function filterAndSortPosts (pages) {
  return pages
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
        title: /** @type {string} */ (vars.title) || '',
        date: vars.date,
        lang: vars.lang,
        category: vars.category,
        path: pagePath,
        pageUrl,
        // Preserve all mf-* fields
        ...Object.fromEntries(
          Object.entries(vars).filter(([k]) => k.startsWith('mf-'))
        ),
      };
    })
    .sort((a, b) => new Date(/** @type {string} */ (b.date)).getTime() - new Date(/** @type {string} */ (a.date)).getTime());
}
