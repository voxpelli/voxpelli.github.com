import { html } from 'async-htm-to-string';

/**
 * Render post title header with optional bookmark/repost link.
 *
 * @param {object} options
 * @param {string[]|undefined} [options.bookmarkOf]
 * @param {string[]|undefined} [options.repostOf]
 * @param {string} [options.title]
 * @returns {import('async-htm-to-string').HtmlTemplateValue | undefined}
 */
export function PostHeader ({ bookmarkOf, repostOf, title }) {
  if (!title) return;

  if (bookmarkOf && bookmarkOf[0]) {
    return html`<header><h2 class="p-name"><a class="u-bookmark-of" href=${bookmarkOf[0]}>${title}</a></h2></header>`;
  }
  if (repostOf && repostOf[0]) {
    return html`<header><h2 class="p-name"><a class="u-repost-of" href=${repostOf[0]}>${title}</a></h2></header>`;
  }
  return html`<header><h2 class="p-name">${title}</h2></header>`;
}
