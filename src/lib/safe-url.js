import { escapeXml } from './escape.js';

/**
 * Restrict postUrl to safe schemes before href interpolation.
 *
 * Accepts same-origin absolute paths (starting with `/`) and explicit
 * http(s): URLs. Anything else (including `javascript:` and `data:`) returns
 * an empty string so callers can omit the link entirely. `encodeURI` alone is
 * NOT a safe guard — it does not encode `:` or `<`/`>`, so a `javascript:`
 * payload would survive unchanged.
 *
 * Use from `html` tagged-template href positions — the template engine will
 * handle attribute escaping. For raw-string concatenation into an attribute,
 * use {@link safeHref} instead.
 *
 * @param {string | undefined | null} url
 * @returns {string}
 */
export function safePostUrl (url) {
  if (!url) return '';
  // Trim incidental whitespace — frontmatter values often carry
  // copy-paste padding. `new URL(' https://x.com ')` throws (strict parse),
  // which would otherwise drop legitimate URLs entirely instead of
  // encoding the space into %20 and keeping them usable.
  url = url.trim();
  if (!url) return '';
  if (url.startsWith('/')) return encodeURI(url);
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return encodeURI(url);
  } catch { /* fall through */ }
  return '';
}

/**
 * Scheme-guard + attribute-escape combinator for raw-string concatenation into
 * `href` positions. Equivalent to `escapeXml(safePostUrl(url))`.
 *
 * Use this when building an `href` via template-literal string concat where no
 * HTML-aware template engine is escaping attributes for you. For `html` tagged
 * templates, use {@link safePostUrl} and let the template engine escape.
 *
 * @param {string | undefined | null} url
 * @returns {string}
 */
export function safeHref (url) {
  return escapeXml(safePostUrl(url));
}
