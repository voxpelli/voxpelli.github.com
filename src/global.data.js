import { CATEGORIES } from './lib/categories.js';
import { filterAndSortPosts } from './lib/posts.js';
import { safePostUrl } from './lib/safe-url.js';

// URL-bearing frontmatter fields scanned by the parse-time warning layer.
// Listed once so the warning loop and any future schema docs share a source.
const URL_FIELDS = [
  'mf-bookmark-of', 'mf-in-reply-to', 'mf-like-of', 'mf-repost-of',
  'mf-photo', 'mf-video', 'mf-syndication',
  'via', 'persontags', 'submitto',
];

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

  // Parse-time URL safety warning layer — non-mutating. Calls safePostUrl
  // on every URL-bearing frontmatter field; if the result is '' for a
  // non-empty input, the URL was rejected (hostile scheme, malformed) and
  // we surface the post path + field. Render code remains the source of
  // truth for context-aware encoding (HTML attrs vs XML feeds vs JS forms),
  // so we don't mutate the post — the warning is just a build-time canary.
  for (const post of allPosts) {
    const record = /** @type {Record<string, unknown>} */ (post);
    for (const field of URL_FIELDS) {
      const value = record[field];
      if (!value) continue;
      const urls = Array.isArray(value) ? value : [value];
      for (const url of urls) {
        if (typeof url !== 'string' || !url) continue;
        if (safePostUrl(url) === '') {
          // eslint-disable-next-line no-console -- Build-time warning to stderr.
          console.warn(
            `URL safety: ${String(post.path)} field "${field}" contains a rejected URL: ${JSON.stringify(url)} — render layer will emit empty href`
          );
        }
      }
    }
  }

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

  // Categorize posts. tilPosts is a SUPERSET including link posts AND release
  // posts — TIL is the user-facing "short-form" section and absorbs bookmark-
  // style link posts + release announcements in listings and feeds. linkPosts
  // and releasePosts stay as strict subsets so /links/ and /releases/ render
  // their bookmark-only / release-only views. Individual post pages keep
  // their URL paths (src/links/... vs src/til/... vs src/releases/...) and
  // their distinct frontmatter (`mf-bookmark-of` for bookmarks and releases,
  // `via:` for jvns-style soft citations — TIL author picks per post).
  const blogPosts = allPosts.filter(p => !p.category);
  const socialPosts = allPosts.filter(p => p.category === 'social');
  const linkPosts = allPosts.filter(p => p.category === 'links');
  const releasePosts = allPosts.filter(p => p.category === 'release');
  const tilPosts = allPosts.filter(p =>
    p.category === 'til' || p.category === 'links' || p.category === 'release'
  );

  // Recent posts for feeds
  const recentPosts = blogPosts.slice(0, 10);
  const recentEnglishPosts = blogPosts.filter(p => p.lang === 'en').slice(0, 10);
  const recentLinks = linkPosts.slice(0, 10);
  const recentTils = tilPosts.slice(0, 10);
  const recentReleases = releasePosts.slice(0, 10);

  // Lifestream — the "everything except social" firehose (homepage + /stream.xml).
  // Weighted slot selection: blog posts count as 2 slots (they carry more visual
  // presence per entry), short-form posts (TIL/links/releases) count as 1. Fill
  // up to 20 slots total. Result is a mixed chronological stream that feels
  // visually balanced rather than dominated by whichever type posts fastest.
  const lifestreamCandidates = allPosts.filter(p => p.category !== 'social');
  /** @type {typeof allPosts} */
  const lifestreamPosts = [];
  let lifestreamWeight = 0;
  const LIFESTREAM_WEIGHT_CAP = 20;
  for (const post of lifestreamCandidates) {
    const slots = post.category === undefined ? 2 : 1;
    if (lifestreamWeight + slots > LIFESTREAM_WEIGHT_CAP) break;
    lifestreamPosts.push(post);
    lifestreamWeight += slots;
  }

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
    .toSorted((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return {
    allPosts,
    blogPosts,
    socialPosts,
    linkPosts,
    releasePosts,
    tilPosts,
    lifestreamPosts,
    recentPosts,
    recentEnglishPosts,
    recentLinks,
    recentTils,
    recentReleases,
    postsByYear,
    allTags,
    tagCounts,
  };
}
