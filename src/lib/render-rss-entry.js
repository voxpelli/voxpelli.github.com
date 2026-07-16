import { escapeXml } from './escape.js';
import { safePostUrl } from './safe-url.js';

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
 * Atom entry ids are a WRITE-ONCE public contract, not links: an id that
 * changes re-floods every subscriber with the entry as an unread duplicate,
 * and there is no way to recall it. The live feeds have always served
 * `uidBase + slash-less path` (Jekyll: `site.uid_base + post.id`, e.g.
 * `http://voxpelli.com/2019/10/use-type-script-3-7-to-generate`) — deliberately
 * decoupled from the canonical `https://…/` <link>. Preserve that derivation
 * for existing AND new entries; never "modernize" ids to match the link.
 *
 * Falls back to a tag: URI (RFC 4151) seeded by the publish date and
 * post.path so entries with no URL don't collapse to the bare uidBase.
 *
 * @param {Record<string, unknown>} post
 * @param {string} uidBase - `feedUidBase` site var (Jekyll's `uid_base`)
 * @param {Date} dateObj
 * @returns {string}
 */
function buildEntryId (post, uidBase, dateObj) {
  const pageUrl = typeof post.pageUrl === 'string' ? post.pageUrl : '';
  if (pageUrl) {
    return `${uidBase}${pageUrl.replace(/\/$/, '')}`;
  }

  const authority = tagAuthority(uidBase);
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
 * @param {string} options.siteUrl - canonical base for <link> (https)
 * @param {string} options.uidBase - permanent-id base for <id> (see buildEntryId)
 * @returns {string}
 */
export function renderRssEntry ({ content, post, siteUrl, uidBase }) {
  const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
  const publishedIso = dateObj.toISOString();
  const updatedSource = post.updated
    ? new Date(/** @type {string} */ (post.updated))
    : dateObj;
  const updatedIso = updatedSource.toISOString();
  const pageUrl = typeof post.pageUrl === 'string' ? post.pageUrl : '';
  const postUrl = safePostUrl(`${siteUrl}${pageUrl}`);
  const entryId = buildEntryId(post, uidBase, dateObj);

  return ` <entry>
  <title>${escapeXml(String(post.title || ''))}</title>
  <link href="${escapeXml(postUrl)}"/>
  <published>${escapeXml(publishedIso)}</published>
  <updated>${escapeXml(updatedIso)}</updated>
  <id>${escapeXml(entryId)}</id>
  <content type="html">${escapeXml(content || '')}</content>
 </entry>`;
}
