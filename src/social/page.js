/** @import { PageVars } from '../page.js' */

import { renderPostLike } from '../lib/render-post-like.js';
import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Social',
  category: 'social',
  hfeed: true,
}));

/**
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown>, renderInnerPage: (opts: { pages: unknown[] }) => Promise<string> }> }} options
 * @returns {Promise<string>}
 */
export default async function socialPage ({ pages, vars: pageVars }) {
  const socialPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.socialPosts) || [];
  const recentSocial = socialPosts.slice(0, 10);

  // Build page index for O(1) lookup
  /** @type {Map<string, typeof pages[0]>} */
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Pre-render non-like posts in parallel (likes work from frontmatter alone)
  /** @type {Map<string, string>} */
  const renderCache = new Map();
  const nonLikePosts = recentSocial.filter(post => !post['mf-like-of']);
  await Promise.all(nonLikePosts.map(async (post) => {
    const page = pagesByPath.get(/** @type {string} */ (post.path));
    const html = page ? /** @type {string} */ (await page.renderInnerPage({ pages })) : '';
    renderCache.set(/** @type {string} */ (post.path), html);
  }));

  const authorName = String(pageVars.authorName || '');
  let result = '<div class="content-header">\n  <h2>Social // Interactions</h2>\n</div>\n\n';
  let isLikeList = false;

  for (const post of recentSocial) {
    if (post['mf-like-of']) {
      if (!isLikeList) {
        isLikeList = true;
        result += '<section class="likelist">\n';
      }

      result += renderPostLike({ authorName, compact: true, post }) + '\n';
    } else {
      if (isLikeList) {
        isLikeList = false;
        result += '</section>\n';
      }
      result += renderPost({
        authorName,
        content: renderCache.get(/** @type {string} */ (post.path)) || String(post.content || ''),
        post,
        siteUrl: String(pageVars.siteUrl || ''),
      }) + '\n';
    }
  }

  if (isLikeList) {
    result += '</section>\n';
  }

  if (socialPosts.length > 10) {
    result += '<p class="posts-extras">\n  <a href="/archive/full/">Full Archive</a>\n</p>\n';
  }

  return result;
}
