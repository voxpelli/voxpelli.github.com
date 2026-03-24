import { html as h, rawHtml, renderToStringSync } from 'async-htm-to-string';

/** @import { PageVars } from '../page.js' */

import { renderPost } from '../lib/render-post.js';
import { parseDateSafe } from '../lib/utils.js';

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

  let result = '<div class="content-header">\n  <h2>Social // Interactions</h2>\n</div>\n\n';
  let isLikeList = false;

  for (const post of recentSocial) {
    if (post['mf-like-of']) {
      if (!isLikeList) {
        isLikeList = true;
        result += '<section class="likelist">\n';
      }

      const likes = /** @type {string[]} */ (post['mf-like-of']);
      const dateObj = parseDateSafe(post.date);
      const isoDate = dateObj.toISOString();
      const shortDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const pageUrl = String(post.pageUrl || '');

      const likeLinks = likes.map((like, i) => {
        const truncated = like.length > 50 ? like.slice(0, 50) + '...' : like;
        const isSecondToLast = i === likes.length - 2;
        const isLast = i === likes.length - 1;
        const suffix = isSecondToLast ? ' and ' : (!isLast ? ', ' : '');
        return h`<a class="u-like-of" href=${like}>${truncated}</a>${rawHtml(suffix)}`;
      });

      result += renderToStringSync(h`
        <p class="h-entry">
          <span class="p-name">
            Liked
            ${likeLinks}
          </span>
          <time class="dt-published" datetime=${isoDate}>
            <a class="u-url u-uid" href=${pageUrl}>${shortDate}</a>
          </time>
        </p>
      `) + '\n';
    } else {
      if (isLikeList) {
        isLikeList = false;
        result += '</section>\n';
      }
      result += renderPost({
        authorName: String(pageVars.authorName || ''),
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
    result += '<ul class="posts-extras">\n  <li><a href="/archive/full/">Full Archive</a></li>\n</ul>\n';
  }

  return result;
}
