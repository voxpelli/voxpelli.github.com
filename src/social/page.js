import { html as h, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { renderPost } from '../lib/render-post.js';

export const vars = {
  layout: 'root',
  title: 'Social',
  category: 'social',
  hfeed: true,
};

/**
 * @param {{ vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function socialPage ({ vars: pageVars }) {
  const socialPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.socialPosts) || [];
  const recentSocial = socialPosts.slice(0, 10);

  let result = '<div class="content-header">\n  <h2>Social // Interactions</h2>\n</div>\n\n';
  let isLikeList = false;

  for (const post of recentSocial) {
    if (post['mf-like-of']) {
      if (!isLikeList) {
        isLikeList = true;
        result += '<article class="likelist">\n';
      }

      const likes = /** @type {string[]} */ (post['mf-like-of']);
      const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
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
        result += '</article>\n';
      }
      result += renderPost({
        authorName: String(pageVars.authorName || ''),
        content: String(post.content || ''),
        post,
        siteUrl: String(pageVars.siteUrl || ''),
      }) + '\n';
    }
  }

  if (isLikeList) {
    result += '</article>\n';
  }

  return result;
}
