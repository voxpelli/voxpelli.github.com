/**
 * Escape a string for safe use in XML content.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeXml (str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
