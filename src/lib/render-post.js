import { renderPostContent } from './render-post-content.js';
import { renderPostLike } from './render-post-like.js';

/**
 * Smart post dispatcher - renders as blog summary, like, or full content
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post - Post frontmatter/vars
 * @param {string} [options.content] - Rendered content
 * @param {boolean} [options.standalone]
 * @param {boolean} [options.indieactions]
 * @param {string} [options.container] - Container element tag (default: 'div')
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @returns {string}
 */
export function renderPost ({ post, content, standalone, indieactions, container, authorName, siteUrl }) {
  const swedish = !post.lang || post.lang === 'sv';
  const nonenglish = post.lang !== 'en';
  const tag = container || 'div';

  // Blog article summary (no category, not standalone)
  if (!post.category && !standalone) {
    const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
    const isoDate = dateObj.toISOString();
    const shortDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const wordCount = typeof content === 'string'
      ? content.replace(/<[^>]*>/g, '').split(/\s+/).length
      : 0;
    const readTime = Math.round(wordCount / 275);

    let langAttr = '';
    if (swedish) langAttr = ' lang="sv"';
    else if (nonenglish) langAttr = ` lang="${post.lang}"`;

    return `<${tag} class="h-entry blog-article-summary">
    <a${langAttr} class="u-url u-uid p-name" href="${post.pageUrl || ''}">${escapeHtml(String(post.title || ''))}</a>
    <time class="dt-published" datetime="${isoDate}" pubdate>
      - ${shortDate}
    </time>
    <span class="time-to-read">
      - ${readTime} min read
    </span>
  </${tag}>`;
  }

  // Like post
  if (post['mf-like-of']) {
    return renderPostLike({ post, authorName });
  }

  // Full content post
  return renderPostContent({
    post,
    content,
    standalone,
    indieactions,
    swedish,
    nonenglish,
    authorName,
    siteUrl,
  });
}

/** @param {string} str */
function escapeHtml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
