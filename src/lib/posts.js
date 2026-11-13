import { parseDateSafe } from './utils.js';

/**
 * Shared post-filtering and sorting logic for indexes, feeds, and archives.
 *
 * This projection is an ALLOWLIST: a frontmatter field a renderer consumes
 * must be carried through here (or added in global.data.js enrichment) or it
 * silently reads as undefined everywhere downstream — which is how the
 * via-badge and feed <updated> support both shipped as dead code.
 *
 * String-typed fields are narrowed at this boundary with typeof guards, so
 * untrusted frontmatter exits as real types instead of `unknown`
 * (required-but-maybe-undefined properties, which play nicer with
 * exactOptionalPropertyTypes than optional ones).
 *
 * @typedef {object} BasePost
 * @property {string} title
 * @property {unknown} date
 * @property {unknown} lang
 * @property {string | undefined} category
 * @property {string} path
 * @property {string} pageUrl
 * @property {string | undefined} via
 * @property {string | undefined} updated
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
        category: typeof vars.category === 'string' ? vars.category : undefined,
        path: pagePath,
        pageUrl,
        // `via` (jvns-style soft-citation badge on listing cards,
        // render-til.js) and `updated` (feed <updated> distinct from
        // <published>, render-rss-entry.js) are consumed downstream —
        // omitting them from the projection made both features dead code
        // and let a hostile `via:` URL bypass the URL_FIELDS build canary.
        via: typeof vars.via === 'string' ? vars.via : undefined,
        updated: typeof vars.updated === 'string' ? vars.updated : undefined,
        topic: vars.topic,
        // Preserve all mf-* fields
        ...Object.fromEntries(
          Object.entries(vars).filter(([k]) => k.startsWith('mf-'))
        ),
      };
    })
    .toSorted((a, b) => parseDateSafe(b.date).getTime() - parseDateSafe(a.date).getTime());
}
