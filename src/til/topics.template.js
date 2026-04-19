import { escapeXml } from '../lib/escape.js';
import { renderPost } from '../lib/render-post.js';
import rootLayout from '../root.layout.js';

/**
 * Normalise a topic string to a URL-safe slug.
 *
 * Topics come from TIL frontmatter as author-typed strings (e.g. `css`,
 * `File Formats`). Lowercase + kebab-case keeps URLs stable and predictable:
 * `/til/topics/file-formats/` rather than `/til/topics/File%20Formats/`.
 *
 * @param {string} topic
 * @returns {string}
 */
function slugifyTopic (topic) {
  return String(topic)
    .toLowerCase()
    .trim()
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/[^a-z0-9-]/g, '')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

/**
 * Generate per-topic TIL index pages at /til/topics/<slug>/.
 *
 * Topic vocabulary is kept separate from /tags/ — tag semantics on this site
 * are essay-meta (see src/global.data.js), whereas TIL `topic` frontmatter is
 * a discovery affordance for short-form notes. URL stability: because the
 * canonical TIL permalink lives under /til/YYYY/MM/slug/, renaming a topic
 * only changes these index pages — no individual post URL breaks.
 *
 * Templates receive `{ vars, pages }` where `vars` is global.vars only; the
 * global.data.js output (including `tilPosts`) is exposed via the
 * `PageData.vars` getter on any rendered page, so we pull it from `pages[0]`.
 *
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown>, styles: string[], scripts: string[] }> }} options
 * @returns {Array<{outputName: string, content: string}>}
 */
export default function topicsTemplate ({ pages, vars }) {
  const authorName = /** @type {string} */ (vars.authorName);
  const siteUrl = /** @type {string} */ (vars.siteUrl);

  const styles = pages[0]?.styles ?? [];
  const scripts = pages[0]?.scripts ?? [];

  const pageVars = pages[0]?.vars ?? {};
  const tilPosts = /** @type {Array<Record<string, unknown>>} */ (pageVars.tilPosts) || [];

  // `tilPosts` from global.data.js carries core post fields but not `topic`
  // (the shared filterAndSortPosts helper in src/lib/posts.js only preserves
  // content/tags/persontags/submitto/mf-*). Look up `topic` from each page's
  // raw frontmatter via pagesByPath.
  const pagesByPath = new Map(pages.map(p => [p.pageInfo.path, p]));

  // Group TILs by normalised topic slug. Preserve the first-seen display form
  // (author's original casing/spacing) so the page heading reads naturally.
  /** @type {Map<string, { display: string, posts: Array<Record<string, unknown>> }>} */
  const topicsBySlug = new Map();
  for (const post of tilPosts) {
    const postPath = typeof post['path'] === 'string' ? post['path'] : '';
    const rawVars = pagesByPath.get(postPath)?.vars ?? {};
    const rawTopic = rawVars['topic'];
    const topic = typeof rawTopic === 'string' ? rawTopic.trim() : '';
    if (!topic) continue;
    const slug = slugifyTopic(topic);
    if (!slug) continue;
    // Enrich the post with topic + content so renderPost/renderTil can surface
    // the topic badge and an excerpt without re-reading frontmatter.
    const enriched = {
      ...post,
      topic,
      content: typeof post['content'] === 'string' && post['content']
        ? post['content']
        : (typeof rawVars['content'] === 'string' ? rawVars['content'] : ''),
    };
    const existing = topicsBySlug.get(slug);
    if (existing) {
      existing.posts.push(enriched);
    } else {
      topicsBySlug.set(slug, { display: topic, posts: [enriched] });
    }
  }

  /** @type {Array<{outputName: string, content: string}>} */
  const output = [];

  // Emit one index page per topic. No index-of-topics page here — discovery
  // lives on the /til/ landing (handled separately).
  for (const [slug, { display, posts }] of topicsBySlug) {
    const postHtml = posts
      .map(post => renderPost({
        post: /** @type {import('../lib/render-post.js').PostVars} */ (post),
        content: /** @type {string} */ (post['content']) || '',
        authorName,
        siteUrl,
      }))
      .join('\n');

    const safeDisplay = escapeXml(display);

    output.push({
      outputName: `topics/${slug}/index.html`,
      content: rootLayout({
        children: `<div class="content-header">
      <p class="content-title">TILs tagged with: ${safeDisplay}</p>
    </div>
    <div class="post-list">
          ${postHtml}
        </div>`,
        vars: {
          ...vars,
          title: `TILs: ${safeDisplay}`,
          pageUrl: `/til/topics/${slug}/`,
        },
        styles,
        scripts,
      }),
    });
  }

  return output;
}
