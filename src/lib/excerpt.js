/**
 * @typedef {object} ExcerptResult
 * @property {string} html — The excerpt HTML (may be full content)
 * @property {boolean} truncated — true if content was cut short
 */

/**
 * Extract first N paragraphs from rendered HTML.
 * Scans for closing </p> tags. Includes any leading headings naturally.
 * If fewer paragraphs exist than the limit, returns full content as non-truncated.
 *
 * @param {string} html
 * @param {number} [paragraphLimit]
 * @returns {ExcerptResult}
 */
export function extractExcerpt (html, paragraphLimit = 2) {
  let count = 0;
  let pos = 0;

  while (count < paragraphLimit) {
    const idx = html.indexOf('</p>', pos);
    if (idx === -1) return { html, truncated: false };
    pos = idx + 4;
    count++;
  }

  const excerpt = html.slice(0, pos);

  // If we're near the end of the full content, show it all
  const remaining = html.slice(pos).trim();
  if (!remaining || remaining.length < 20) return { html, truncated: false };

  return { html: excerpt, truncated: true };
}
