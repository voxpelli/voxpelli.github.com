/** @import { PageVars } from '../page.js' */

import { renderPostLike } from '../lib/render-post-like.js';
import { renderPost } from '../lib/render-post.js';

export const vars = /** @satisfies {PageVars} */ (/** @type {const} */ ({
  layout: 'root',
  title: 'Social',
  category: 'social',
  hfeed: true,
  dataDeps: ['socialPosts'],
}));

/**
 * @param {{ data: Record<string, unknown>, vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function socialPage ({ data, vars: pageVars }) {
  const socialPosts = /** @type {Array<Record<string, unknown>>} */ (data.socialPosts) || [];
  const recentSocial = socialPosts.slice(0, 10);

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
        content: String(post.content || ''),
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
