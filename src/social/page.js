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

  let html = '<h2>Social</h2>\n\n';
  let isLikeList = false;

  for (const post of recentSocial) {
    if (post['mf-like-of']) {
      if (!isLikeList) {
        isLikeList = true;
        html += '<article class="likelist">\n';
      }

      const likes = /** @type {string[]} */ (post['mf-like-of']);
      const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
      const isoDate = dateObj.toISOString();
      const shortDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      const likeLinks = likes.map((like, i) => {
        const truncated = like.length > 50 ? like.slice(0, 50) + '...' : like;
        const isSecondToLast = i === likes.length - 2;
        const isLast = i === likes.length - 1;
        const suffix = isSecondToLast ? ' and ' : (!isLast ? ', ' : '');
        return `<a class="u-like-of" href="${like}">${truncated}</a>${suffix}`;
      }).join('');

      html += `<p class="h-entry">
  <span class="p-name">
    Liked
    ${likeLinks}
  </span>
  <time class="dt-published" datetime="${isoDate}" pubdate>
    <a class="u-url u-uid" href="${post.pageUrl || ''}">${shortDate}</a>
  </time>
</p>\n`;
    } else {
      if (isLikeList) {
        isLikeList = false;
        html += '</article>\n';
      }
      html += renderPost({
        post,
        content: /** @type {string} */ (post.content) || '',
        authorName: /** @type {string} */ (pageVars.authorName),
        siteUrl: /** @type {string} */ (pageVars.siteUrl),
      }) + '\n';
    }
  }

  if (isLikeList) {
    html += '</article>\n';
  }

  return html;
}
