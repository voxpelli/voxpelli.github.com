import { escapeXml } from './escape.js';

/**
 * Derive the tag URI authority (host) from a siteUrl.
 * Falls back to the raw string if URL parsing fails.
 *
 * @param {string} siteUrl
 * @returns {string}
 */
function tagAuthority (siteUrl) {
  try {
    return new URL(siteUrl).host || siteUrl;
  } catch {
    return siteUrl;
  }
}

/**
 * Build a stable Atom <id> for an entry.
 *
 * Prefers the canonical `siteUrl + pageUrl` when pageUrl is a non-empty string,
 * otherwise synthesizes a tag: URI (RFC 4151) seeded by the publish date and
 * post.path so entries with no URL don't collapse to the bare siteUrl.
 *
 * @param {Record<string, unknown>} post
 * @param {string} siteUrl
 * @param {Date} dateObj
 * @returns {string}
 */
function buildEntryId (post, siteUrl, dateObj) {
  const pageUrl = typeof post.pageUrl === 'string' ? post.pageUrl : '';
  if (pageUrl) {
    return `${siteUrl}${pageUrl}`;
  }

  const authority = tagAuthority(siteUrl);
  const datePart = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
  const specific = typeof post.path === 'string' && post.path
    ? `/${post.path}`
    : (typeof post.title === 'string' && post.title ? `/${post.title}` : '/');
  return `tag:${authority},${datePart}:${specific}`;
}

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
  const publishedIso = dateObj.toISOString();
  const updatedSource = post.updated
    ? new Date(/** @type {string} */ (post.updated))
    : dateObj;
  const updatedIso = updatedSource.toISOString();
  const pageUrl = typeof post.pageUrl === 'string' ? post.pageUrl : '';
  const postUrl = `${siteUrl}${pageUrl}`;
  const entryId = buildEntryId(post, siteUrl, dateObj);

  return ` <entry>
  <title>${escapeXml(String(post.title || ''))}</title>
  <link href="${escapeXml(postUrl)}"/>
  <published>${escapeXml(publishedIso)}</published>
  <updated>${escapeXml(updatedIso)}</updated>
  <id>${escapeXml(entryId)}</id>
  <content type="html">${escapeXml(content || '')}</content>
 </entry>`;
}
