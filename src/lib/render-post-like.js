/** @import { PostVars } from './render-post.js' */

import { html, renderToStringSync } from 'async-htm-to-string';

import { PostFooter } from './render-post-footer.js';
import { safePostUrl } from './safe-url.js';
import { extractFullDomain, parseDateSafe } from './utils.js';

/**
 * @param {object} options
 * @param {PostVars} options.post
 * @param {string} options.authorName
 * @param {boolean} [options.compact] - When true, renders compact <p> for social stream; false renders full <article>
 * @returns {string}
 */
export function renderPostLike ({ authorName, compact, post }) {
  const likes = /** @type {string[]} */ (post['mf-like-of']) || [];

  const likeLinks = likes.map((like, i) => {
    const isSecondToLast = i === likes.length - 2;
    const isLast = i === likes.length - 1;
    const suffix = isSecondToLast ? ' and ' : (!isLast ? ', ' : '');
    return html`<a class="u-like-of" href=${safePostUrl(like)}>${extractFullDomain(like)}</a>${suffix}`;
  });

  if (compact) {
    const dateObj = parseDateSafe(post.date);
    const isoDate = dateObj.toISOString();
    const shortDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const pageUrl = post.pageUrl || '';

    return renderToStringSync(html`
      <p class="h-entry">
        <span class="p-name">Liked${' '}${likeLinks}</span>${' \u2014 '}
        <time class="dt-published" datetime=${isoDate}>
          <a class="u-url u-uid" href=${safePostUrl(pageUrl)}>${shortDate}</a>
        </time>
      </p>
    `);
  }

  return renderToStringSync(html`
    <article class="h-entry">
      <p class="p-name">Liked${' '}${likeLinks}</p>
      ${PostFooter({ authorName, nonenglish: false, post })}
    </article>
  `);
}
