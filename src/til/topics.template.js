import { escapeXml } from '../lib/escape.js';
import { getSiteVars } from '../lib/get-site-vars.js';
import { renderPost } from '../lib/render-post.js';
import { groupTopics } from '../lib/topics.js';
import rootLayout from '../root.layout.js';

/** @import { TemplateOutputOverride } from '../global-types.d.ts' */

export const dataDeps = ['tilPosts', 'globalAssets'];

/**
 * Generate per-topic TIL index pages at /til/topics/<slug>/.
 *
 * Topic vocabulary is kept separate from /tags/ — tag semantics on this site
 * are essay-meta (see src/global.data.js), whereas TIL `topic` frontmatter is
 * a discovery affordance for short-form notes. URL stability: because the
 * canonical TIL permalink lives under /til/YYYY/MM/slug/, renaming a topic
 * only changes these index pages — no individual post URL breaks.
 *
 * Global data subscriptions provide posts and the assets used by normal pages.
 *
 * @param {{ vars: Record<string, unknown>, data: Record<string, unknown> }} options
 * @returns {TemplateOutputOverride[]}
 */
export default function topicsTemplate ({ data, vars }) {
  const siteVars = getSiteVars(vars);
  const { authorName, siteUrl } = siteVars;

  const { scripts = [], styles = [] } = /** @type {{ scripts?: string[], styles?: string[] }} */ (data.globalAssets);
  const tilPosts = /** @type {Array<Record<string, unknown>>} */ (data.tilPosts) || [];

  /** @type {TemplateOutputOverride[]} */
  const output = [];

  // Emit one index page per topic. No index-of-topics page here — discovery
  // lives on the /til/ landing (handled separately).
  for (const [slug, { display, posts }] of groupTopics(tilPosts)) {
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
          ...siteVars,
          title: `TILs: ${display}`,
          pageUrl: `/til/topics/${slug}/`,
        },
        styles,
        scripts,
      }),
    });
  }

  return output;
}
