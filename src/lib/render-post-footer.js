import { html } from 'async-htm-to-string';

import { parseDateSafe } from './utils.js';

/**
 * Render post footer with date, author, and permalink.
 * Returns an htm template for direct nesting (not a string).
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post - Post frontmatter/vars
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @param {boolean} [options.compact] - When true, omit author attribution (for social feeds)
 * @returns {import('async-htm-to-string').HtmlTemplateValue}
 */
export function PostFooter ({ authorName, compact, nonenglish, post }) {
  const dateObj = parseDateSafe(post.date);
  const isoDate = dateObj.toISOString();
  const longDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pageUrl = String(post.pageUrl || '');

  if (compact) {
    return html`
      <footer lang=${nonenglish ? 'en' : false}>
        <relative-time><time class="dt-published" datetime=${isoDate}>
          <a class="u-url u-uid" href=${pageUrl}>${longDate}</a>
        </time></relative-time>
      </footer>
    `;
  }

  return html`
    <footer lang=${nonenglish ? 'en' : false}>
        <relative-time><time class="dt-published" datetime=${isoDate}>
          <a class="u-url u-uid" href=${pageUrl}>${longDate}</a>
        </time></relative-time>${' '}by${' '}<a class="p-author h-card" href="/"><img class="u-photo" src="/avatar.jpg" alt="" width="20" height="20" />${' '}${authorName}</a>
      </footer>
  `;
}
