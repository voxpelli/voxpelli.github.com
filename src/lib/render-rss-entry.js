import { escapeXml } from './escape.js';

/**
 * Render a single Atom feed entry
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post
 * @param {string} [options.content] - Rendered HTML content
 * @param {string} options.siteUrl
 * @returns {string}
 */
export function renderRssEntry ({ content, post, siteUrl }) {
  const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
  const isoDate = dateObj.toISOString();
  const postUrl = `${siteUrl}${post.pageUrl || ''}`;

  return ` <entry>
  <title>${escapeXml(String(post.title || ''))}</title>
  <link href="${escapeXml(postUrl)}"/>
  <updated>${isoDate}</updated>
  <id>${escapeXml(postUrl)}</id>
  <content type="html">${escapeXml(content || '')}</content>
 </entry>`;
}
