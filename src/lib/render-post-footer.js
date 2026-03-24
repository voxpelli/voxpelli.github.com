import { html } from 'async-htm-to-string';

/**
 * Render post footer with date, author, and permalink.
 * Returns an htm template for direct nesting (not a string).
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post - Post frontmatter/vars
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @returns {import('async-htm-to-string').HtmlTemplateValue}
 */
export function PostFooter ({ authorName, nonenglish, post }) {
  const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
  const isoDate = dateObj.toISOString();
  const longDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pageUrl = String(post.pageUrl || '');

  return html`
    <footer lang=${nonenglish ? 'en' : false}>
        <relative-time><time class="dt-published" datetime=${isoDate}>
          <a class="u-url u-uid" href=${pageUrl}>${longDate}</a>
        </time></relative-time>${' '}by${' '}<a class="p-author h-card" href="/"><img class="u-photo" src="/avatar.jpg" alt="" width="20" height="20" />${' '}${authorName}</a>
      </footer>
  `;
}
