import { html } from 'async-htm-to-string';

import { safePostUrl } from '../safe-url.js';
import { extractFullDomain } from '../utils.js';

/**
 * Render post title header with optional bookmark/repost link.
 *
 * @param {object} options
 * @param {string[]|undefined} [options.bookmarkOf]
 * @param {string[]|undefined} [options.repostOf]
 * @param {boolean} [options.standalone] - When true (article pages), renders h1. When false (listing), renders h2.
 * @param {string} [options.title]
 * @returns {import('async-htm-to-string').HtmlTemplateValue | undefined}
 */
export function PostHeader ({ bookmarkOf, repostOf, standalone, title }) {
  if (!title) return;

  const Tag = standalone ? 'h1' : 'h2';

  if (bookmarkOf && bookmarkOf[0]) {
    const domain = extractFullDomain(bookmarkOf[0]);
    return html`<header><${Tag} class="p-name"><a class="u-bookmark-of" href=${safePostUrl(bookmarkOf[0])}>${title}</a></${Tag}><span class="domain-badge" aria-hidden="true">${domain}</span></header>`;
  }
  if (repostOf && repostOf[0]) {
    return html`<header><${Tag} class="p-name"><a class="u-repost-of" href=${safePostUrl(repostOf[0])}>${title}</a></${Tag}></header>`;
  }
  return html`<header><${Tag} class="p-name">${title}</${Tag}></header>`;
}
