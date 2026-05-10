import { parseDateSafe } from './utils.js';

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
 * @property {unknown} [topic]
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
    .filter(p => p.vars && p.vars.layout === 'article' && p.vars.date)
    .map(p => {
      const { vars } = p;
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
        topic: vars.topic,
        // Preserve all mf-* fields
        ...Object.fromEntries(
          Object.entries(vars).filter(([k]) => k.startsWith('mf-'))
        ),
      };
    })
    .toSorted((a, b) => parseDateSafe(b.date).getTime() - parseDateSafe(a.date).getTime());
}
