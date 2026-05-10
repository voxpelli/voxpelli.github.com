import { escapeXml } from './lib/escape.js';
import { getSiteVars } from './lib/get-site-vars.js';
import { renderPost } from './lib/render-post.js';
import rootLayout from './root.layout.js';

/**
 * Generate tag index page and individual tag pages.
 *
 * Templates receive { vars, pages } where vars is global.vars only (not global.data).
 * However, pages[].vars (the PageData getter) includes global.data output, so we
 * access pre-computed allTags/tagCounts from there — posts already have rendered content.
 *
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown>, styles: string[], scripts: string[] }> }} options
 * @returns {Array<{outputName: string, content: string}>}
 */
export default function tagsTemplate ({ pages, vars }) {
  const { authorName } = getSiteVars(vars);

  // Extract global styles/scripts from any initialized page
  const styles = pages[0]?.styles ?? [];
  const scripts = pages[0]?.scripts ?? [];

  // Access pre-computed tag data from global.data.js (via PageData.vars getter which includes globalDataVars)
  const pageVars = pages[0]?.vars ?? {};
  const allTags = /** @type {Record<string, Array<Record<string, unknown>>>} */ (pageVars.allTags) || {};
  const tagCounts = /** @type {Array<{tag: string, count: number}>} */ (pageVars.tagCounts) || [];

  /** @type {Array<{outputName: string, content: string}>} */
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
      vars: { ...vars, title: 'Tags', pageUrl: '/tags/' },
      styles,
      scripts,
    }),
  });

  // Individual tag pages
  for (const { tag } of tagCounts) {
    const posts = allTags[tag] || [];
    const postHtml = posts
      .map(post => renderPost({
        post: /** @type {import('./lib/render-post.js').PostVars} */ (post),
        content: /** @type {string} */ (post.content) || '',
        excerpt: true,
        authorName,
        siteUrl: /** @type {string} */ (vars.siteUrl),
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
        vars: { ...vars, title: `Tag: ${safeTag}`, pageUrl: `/tags/${encodeURIComponent(tag)}/` },
        styles,
        scripts,
      }),
    });
  }

  return output;
}
