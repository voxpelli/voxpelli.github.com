/**
 * Extract first-level domain name from a URL.
 *
 * @param {string} url
 * @returns {string}
 */
export function extractDomain (url) {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0] || '';
}

/**
 * Extract site name from a URL (strips protocol, www, .com, and path).
 *
 * @param {string} url
 * @returns {string}
 */
export function extractName (url) {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.com$/, '').split('/')[0] || '';
}

/**
 * Capitalize the first character of a string.
 *
 * @param {string} str
 * @returns {string}
 */
export function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
