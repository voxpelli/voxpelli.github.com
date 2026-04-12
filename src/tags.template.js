import { filterAndSortPosts } from './lib/posts.js';
import { renderPost } from './lib/render-post.js';
import { escapeXml } from './lib/escape.js';

/**
 * Generate tag index page and individual tag pages.
 *
 * Templates receive { vars, pages } where vars is global.vars only (not global.data).
 * We compute tag data from pages directly, same as feeds.template.js.
 *
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string }, vars: Record<string, unknown> }> }} options
 * @returns {Array<{outputName: string, content: string}>}
 */
export default function tagsTemplate ({ pages, vars }) {
  const siteUrl = /** @type {string} */ (vars.siteUrl);
  const blogName = /** @type {string} */ (vars.blogName);
  const authorName = /** @type {string} */ (vars.authorName);

  // Filter and sort posts, then build tag index
  const allPosts = filterAndSortPosts(pages);
  const blogPosts = allPosts.filter(p => !p.category);

  // Build page vars lookup for accessing tags from original page data
  /** @type {Map<string, Record<string, unknown>>} */
  const varsByPath = new Map(pages.map(p => [p.pageInfo.path, p.vars]));

  /** @type {Record<string, typeof blogPosts>} */
  const allTags = {};
  for (const post of blogPosts) {
    const pageVars = varsByPath.get(post.path);
    const postTags = /** @type {string[]|undefined} */ (pageVars?.tags);
    if (!postTags) continue;
    for (const tag of postTags) {
      const normalizedTag = String(tag).toLowerCase();
      if (!allTags[normalizedTag]) allTags[normalizedTag] = [];
      allTags[normalizedTag].push(post);
    }
  }

  const tagCounts = Object.entries(allTags)
    .map(([tag, posts]) => ({ tag, count: posts.length }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

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
    content: buildPage({
      title: 'Tags',
      heading: 'Tags',
      body: `<div class="tag-cloud">
          ${tagLinks}
        </div>`,
      siteUrl,
      blogName,
      pageUrl: '/tags/',
    }),
  });

  // Individual tag pages
  for (const { tag } of tagCounts) {
    const posts = /** @type {typeof blogPosts} */ (allTags[tag]);
    const postHtml = posts
      .map(post => renderPost({
        post: /** @type {import('./lib/render-post.js').PostVars} */ ({ ...post }),
        authorName,
        siteUrl,
      }))
      .join('\n');

    output.push({
      outputName: `tags/${encodeURIComponent(tag)}/index.html`,
      content: buildPage({
        title: `Tag: ${tag}`,
        heading: `Tag: ${tag}`,
        body: `<div class="post-list">
          ${postHtml}
        </div>`,
        siteUrl,
        blogName,
        pageUrl: `/tags/${encodeURIComponent(tag)}/`,
      }),
    });
  }

  return output;
}

/**
 * Build a minimal HTML page for tag output.
 *
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.heading
 * @param {string} options.body
 * @param {string} options.siteUrl
 * @param {string} options.blogName
 * @param {string} options.pageUrl
 * @returns {string}
 */
function buildPage ({ blogName, body, heading, pageUrl, siteUrl, title }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeXml(title)} – ${escapeXml(blogName)}</title>
  <link rel="canonical" href="${escapeXml(siteUrl + pageUrl)}" />
</head>
<body>
  <main>
    <div class="content-header">
      <p class="content-title">${escapeXml(heading)}</p>
    </div>
    ${body}
  </main>
</body>
</html>`;
}
