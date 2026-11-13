/**
 * Category registry — single source of truth for post-category metadata.
 *
 * Each category (`blog` default, `social`, `links`, `til`) has its own
 * collection in `global.data.js`, its own index page URL, and its own feed
 * URL. Consumers that previously hand-rolled if/else ladders over these
 * four categories now consult this registry instead. Adding a new category
 * becomes a single-file edit here plus a corresponding filter in
 * `global.data.js` — not a six-file hunt.
 *
 * The `undefined` key represents the default blog category, matching the
 * `!p.category` filter in global.data.js exactly. No magic string needed.
 *
 * @typedef {'social' | 'links' | 'til' | 'release'} PostCategory
 * @typedef {object} CategoryDescriptor
 * @property {string} collectionKey  Key in global.data output (e.g. 'tilPosts').
 * @property {string} feedUrl        Self URL for the Atom feed ('' if none).
 * @property {string} indexUrl       HTML section index page URL.
 * @property {string} feedSubtitle   Subtitle shown in feed metadata.
 */

/** @type {Map<PostCategory | undefined, CategoryDescriptor>} */
export const CATEGORIES = new Map([
  [undefined, { collectionKey: 'blogPosts', feedUrl: '/all.xml', indexUrl: '/', feedSubtitle: '' }],
  ['social', { collectionKey: 'socialPosts', feedUrl: '', indexUrl: '/social/', feedSubtitle: 'Social' }],
  // 'links' points at tilPosts (the superset) so prev/next on a links
  // article walks the full merged stream — consistent with /til/ being
  // the user-facing aggregation. The strict linkPosts subset still backs
  // /links/ index + /links/all.xml for the archive-style view.
  ['links', { collectionKey: 'tilPosts', feedUrl: '/links/all.xml', indexUrl: '/links/', feedSubtitle: 'Links' }],
  ['til', { collectionKey: 'tilPosts', feedUrl: '/til/feed.atom', indexUrl: '/til/', feedSubtitle: 'TIL' }],
  // Release posts: dedicated feed + index, absorbs into the /til/ superset too.
  ['release', { collectionKey: 'releasePosts', feedUrl: '/releases/feed.atom', indexUrl: '/releases/', feedSubtitle: 'Releases' }],
]);

/**
 * Membership of the /til/ superset — the user-facing short-form aggregation
 * absorbs bookmark-style link posts and release announcements.
 *
 * ONE executable definition: global.data.js (the tilPosts collection),
 * feeds.template.js (via that collection) and root.layout.js (nav
 * highlighting, via tilSupersetIndexUrls below) all consult this. The rule
 * previously existed as three hand-copied filter expressions "kept in sync
 * by convention" — only one of which the category drift-guard protected.
 *
 * @param {unknown} category
 * @returns {boolean}
 */
export function isTilSupersetCategory (category) {
  return category === 'til' || category === 'links' || category === 'release';
}

/**
 * Membership of the lifestream/firehose — everything except social posts.
 * Backs the homepage lifestream selection and the /stream.xml feed's
 * unweighted recentStream collection.
 *
 * @param {unknown} category
 * @returns {boolean}
 */
export function isLifestreamCategory (category) {
  return category !== 'social';
}

/**
 * URL prefixes the /til/ nav item claims, derived from the superset
 * categories' own index URLs — so nav highlighting cannot drift from the
 * registry when a category joins or leaves the superset.
 *
 * @returns {string[]}
 */
export function tilSupersetIndexUrls () {
  return [...CATEGORIES.entries()]
    .filter(([category]) => isTilSupersetCategory(category))
    .map(([, descriptor]) => descriptor.indexUrl);
}

/**
 * Lookup the post collection for a given category, falling back to blogPosts
 * when the category is unregistered. Returns an empty array rather than
 * undefined so callers can freely chain `.findIndex` / `.map` without guards.
 *
 * @param {string | undefined} category
 * @param {Record<string, unknown>} vars
 * @returns {Array<Record<string, unknown>>}
 */
export function getCategoryCollection (category, vars) {
  // Widened read-only view: callers pass arbitrary strings; the Map itself
  // stays keyed by the PostCategory literal union.
  /** @type {ReadonlyMap<string | undefined, CategoryDescriptor>} */
  const byAnyKey = CATEGORIES;
  // eslint-disable-next-line unicorn/no-useless-undefined -- Map.get requires 1 arg per tsc (TS2554)
  const descriptor = byAnyKey.get(category) ?? byAnyKey.get(undefined);
  const key = descriptor?.collectionKey ?? 'blogPosts';
  const collection = vars[key];
  return Array.isArray(collection)
    ? /** @type {Array<Record<string, unknown>>} */ (collection)
    : [];
}
