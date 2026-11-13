/**
 * Normalise a topic string to a URL-safe slug.
 *
 * Topics come from TIL frontmatter as author-typed strings (e.g. `css`,
 * `File Formats`). Lowercase + kebab-case keeps URLs stable and predictable:
 * `/til/topics/file-formats/` rather than `/til/topics/File%20Formats/`.
 *
 * Shared between `src/til/topics.template.js` (page generator) and
 * `src/lib/render-til.js` (topic badge link). Keeping a single source of
 * truth prevents badge links from 404-ing when the two sides drift.
 *
 * @param {string} topic
 * @returns {string}
 */
export function slugifyTopic (topic) {
  return String(topic)
    .toLowerCase()
    .trim()
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}
