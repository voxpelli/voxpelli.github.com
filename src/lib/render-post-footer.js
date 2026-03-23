import { html, renderToStringSync } from 'async-htm-to-string';

/**
 * @param {object} options
 * @param {Record<string, unknown>} options.post - Post frontmatter/vars
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @returns {string}
 */
export function renderPostFooter ({ authorName, nonenglish, post }) {
  const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
  const isoDate = dateObj.toISOString();
  const longDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pageUrl = /** @type {string} */ (post.pageUrl) || '';

  return renderToStringSync(html`
    <footer lang=${nonenglish ? 'en' : false}>
      <time class="dt-published" datetime=${isoDate} pubdate>
        <a class="u-url u-uid" href=${pageUrl}>${longDate}</a>
      </time>
        by
      <a class="p-author h-card" href="/"><img class="u-photo" src="/avatar.jpg" alt="" width="20" height="20" /> ${authorName}</a>
    </footer>
  `);
}
