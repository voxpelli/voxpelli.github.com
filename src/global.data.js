import { CATEGORIES } from './lib/categories.js';
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

  // Runtime drift guard — fail build if a post carries an unregistered
  // category. Prevents silent "new category added, registry not updated"
  // regressions where prev/next navigation and feed emission would drop
  // the category through. See src/lib/categories.js for the registry.
  const knownCategories = new Set(CATEGORIES.keys());
  for (const post of allPosts) {
    const cat = post.category;
    if (cat !== undefined && !knownCategories.has(/** @type {string} */ (cat))) {
      throw new Error(
        `Unknown post category "${String(cat)}" at ${String(post.path)} — ` +
        'register it in src/lib/categories.js'
      );
    }
  }

  // Categorize posts. tilPosts is a SUPERSET including link posts — TIL is
  // the user-facing "short-form" section and absorbs bookmark-style link
  // posts in listings and feeds. linkPosts stays as the strict subset so
  // /links/ can still render a bookmark-only view. Individual post pages
  // keep their URL paths (src/links/... vs src/til/...) and their distinct
  // frontmatter (`mf-bookmark-of` for bookmarks, `via:` for jvns-style
  // soft citations — TIL author picks per post).
  const blogPosts = allPosts.filter(p => !p.category);
  const socialPosts = allPosts.filter(p => p.category === 'social');
  const linkPosts = allPosts.filter(p => p.category === 'links');
  const tilPosts = allPosts.filter(p => p.category === 'til' || p.category === 'links');

  // Recent posts for feeds
  const recentPosts = blogPosts.slice(0, 10);
  const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
  const recentLinks = linkPosts.slice(0, 10);
  const recentTils = tilPosts.slice(0, 10);

  // Render all blog posts to get content for excerpts and reading time.
  await Promise.all(blogPosts.map(async (post) => {
    const page = pagesByPath.get(post.path);
    if (!page || typeof page.renderInnerPage !== 'function') return;
    try {
      const renderedHtml = await page.renderInnerPage({ pages });
      if (typeof renderedHtml === 'string' && renderedHtml) {
        post.content = renderedHtml;
      }
    } catch {
      // Silently skip failed renders — excerpts are non-critical
    }
  }));

  // Also pre-render TIL posts so topic-index pages (src/til/topics.template.js)
  // can surface excerpts on compact cards. Same pattern as blogPosts above.
  await Promise.all(tilPosts.map(async (post) => {
    const page = pagesByPath.get(post.path);
    if (!page || typeof page.renderInnerPage !== 'function') return;
    try {
      const renderedHtml = await page.renderInnerPage({ pages });
      if (typeof renderedHtml === 'string' && renderedHtml) {
        post.content = renderedHtml;
      }
    } catch {
      // Silently skip failed renders — excerpts are non-critical
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

  // Tags index — built from blogPosts only (social/link posts have different tag semantics)
  /** @type {Record<string, typeof blogPosts>} */
  const allTags = {};
  for (const post of blogPosts) {
    const postTags = /** @type {string[]|undefined} */ (post.tags);
    if (!postTags) continue;
    for (const tag of postTags) {
      const normalizedTag = String(tag).toLowerCase();
      if (!allTags[normalizedTag]) allTags[normalizedTag] = [];
      allTags[normalizedTag].push(post);
    }
  }

  const tagCounts = Object.entries(allTags)
    .map(([tag, posts]) => ({ tag, count: posts.length }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return {
    allPosts,
    blogPosts,
    socialPosts,
    linkPosts,
    tilPosts,
    recentPosts,
    recentEnglishPosts,
    recentLinks,
    recentTils,
    postsByYear,
    allTags,
    tagCounts,
  };
}
