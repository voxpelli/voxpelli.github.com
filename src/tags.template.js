import { escapeXml } from './lib/escape.js';
import { getSiteVars } from './lib/get-site-vars.js';
import { renderPost } from './lib/render-post.js';
import rootLayout from './root.layout.js';

/** @import { PostVars } from './lib/render-post.js' */
/** @import { TemplateOutputOverride } from './global-types.d.ts' */

export const dataDeps = ['allTags', 'tagCounts', 'globalAssets'];

/**
 * Generate tag index page and individual tag pages.
 *
 * The global data subscriptions provide tag indexes and the assets used by
 * normal pages.
 *
 * @param {{ vars: Record<string, unknown>, data: Record<string, unknown> }} options
 * @returns {TemplateOutputOverride[]}
 */
export default function tagsTemplate ({ data, vars }) {
  const siteVars = getSiteVars(vars);
  const { authorName, siteUrl } = siteVars;

  const { scripts = [], styles = [] } = /** @type {{ scripts?: string[], styles?: string[] }} */ (data.globalAssets);
  const allTags = /** @type {Record<string, Array<Record<string, unknown>>>} */ (data.allTags) || {};
  const tagCounts = /** @type {Array<{tag: string, count: number}>} */ (data.tagCounts) || [];

  /** @type {TemplateOutputOverride[]} */
  const output = [];

  // Tag index page
  const tagLinks = tagCounts
    .map(({ count, tag }) =>
      `<a href="/tags/${encodeURIComponent(tag)}/">${escapeXml(tag)} <span>(${count})</span></a>`
    )
    .join('\n          ');

  output.push({
    outputName: 'tags/index.html',
    content: rootLayout({
      children: `<div class="content-header">
      <p class="content-title">Tags</p>
    </div>
    <div class="tag-cloud">
          ${tagLinks}
        </div>`,
      vars: {
        ...siteVars,
        title: 'Tags',
        pageUrl: '/tags/',
      },
      styles,
      scripts,
    }),
  });

  // Individual tag pages
  for (const { tag } of tagCounts) {
    const posts = allTags[tag] || [];
    const postHtml = posts
      .map(post => renderPost({
        post: /** @type {PostVars} */ (post),
        content: /** @type {string} */ (post.content) || '',
        excerpt: true,
        authorName,
        siteUrl,
      }))
      .join('\n');

    // Escape tag name before interpolating into HTML body and <title> via vars.title.
    // Tag values come from post frontmatter — treat as untrusted input.
    const safeTag = escapeXml(tag);

    output.push({
      outputName: `tags/${encodeURIComponent(tag)}/index.html`,
      content: rootLayout({
        children: `<div class="content-header">
      <p class="content-title">Tag: ${safeTag}</p>
    </div>
    <div class="post-list">
          ${postHtml}
        </div>`,
        vars: {
          ...siteVars,
          title: `Tag: ${safeTag}`,
          pageUrl: `/tags/${encodeURIComponent(tag)}/`,
        },
        styles,
        scripts,
      }),
    });
  }

  return output;
}
