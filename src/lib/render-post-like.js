import { renderPostFooter } from './render-post-footer.js';

/**
 * @param {object} options
 * @param {Record<string, unknown>} options.post
 * @param {string} options.authorName
 * @returns {string}
 */
export function renderPostLike ({ post, authorName }) {
  const likes = /** @type {string[]} */ (post['mf-like-of']) || [];

  const likeLinks = likes.map((like, i) => {
    const isSecondToLast = i === likes.length - 2;
    const isLast = i === likes.length - 1;
    const suffix = isSecondToLast ? ' and ' : (!isLast ? ', ' : '');
    return `<a class="u-like-of" href="${like}">${like}</a>${suffix}`;
  }).join('');

  return `<article class="h-entry">
  <p class="p-name">
    Liked
    ${likeLinks}
  </p>

  ${renderPostFooter({ post, indieactions: false, authorName, nonenglish: false })}
</article>`;
}
