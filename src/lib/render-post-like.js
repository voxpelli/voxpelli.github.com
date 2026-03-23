import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { renderPostFooter } from './render-post-footer.js';

/**
 * @param {object} options
 * @param {Record<string, unknown>} options.post
 * @param {string} options.authorName
 * @returns {string}
 */
export function renderPostLike ({ authorName, post }) {
  const likes = /** @type {string[]} */ (post['mf-like-of']) || [];

  const likeLinks = likes.map((like, i) => {
    const isSecondToLast = i === likes.length - 2;
    const isLast = i === likes.length - 1;
    const suffix = isSecondToLast ? ' and ' : (!isLast ? ', ' : '');
    return html`<a class="u-like-of" href=${like}>${like}</a>${rawHtml(suffix)}`;
  });

  return renderToStringSync(html`
    <article class="h-entry">
      <p class="p-name">
        Liked
        ${likeLinks}
      </p>

      ${rawHtml(renderPostFooter({ authorName, nonenglish: false, post }))}
    </article>
  `);
}
