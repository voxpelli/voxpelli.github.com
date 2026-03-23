import { renderIndieActions } from './render-indie-actions.js';

/**
 * @param {object} options
 * @param {Record<string, unknown>} options.post - Post frontmatter/vars
 * @param {boolean} [options.nonenglish]
 * @param {boolean} [options.indieactions]
 * @param {string} options.authorName
 * @returns {string}
 */
export function renderPostFooter ({ authorName, indieactions, nonenglish, post }) {
  const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
  const isoDate = dateObj.toISOString();
  const longDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<footer${nonenglish ? ' lang="en"' : ''}>
  <time class="dt-published" datetime="${isoDate}" pubdate>
    <a class="u-url u-uid" href="${/** @type {string} */ (post.pageUrl) || ''}">${longDate}</a>
  </time>
    by
  <a class="p-author h-card" href="/"><img class="u-photo" src="/avatar.jpg" alt="" width="20" height="20" /> ${escapeHtml(authorName)}</a>

  ${indieactions ? renderIndieActions(/** @type {string} */ (post.pageUrl) || '') : ''}
</footer>`;
}

/** @param {string} str */
function escapeHtml (str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
