import { html, renderToStringSync } from 'async-htm-to-string';

import { renderPostContent } from './render-post-content.js';
import { renderPostLike } from './render-post-like.js';
import { parseDateSafe } from './utils.js';

/**
 * Smart post dispatcher - renders as blog summary, like, or full content
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post - Post frontmatter/vars
 * @param {string} [options.content] - Rendered content
 * @param {boolean} [options.standalone]
 * @param {string} [options.container] - Container element tag (default: 'article')
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @returns {string}
 */
export function renderPost ({ authorName, container, content, post, siteUrl, standalone }) {
  const swedish = !post.lang || post.lang === 'sv';
  const nonenglish = post.lang !== 'en';
  const tag = container || 'article';

  // Blog article summary (no category, not standalone)
  if (!post.category && !standalone) {
    const dateObj = parseDateSafe(post.date);
    const isoDate = dateObj.toISOString();
    const isoDateShort = isoDate.slice(0, 10).replaceAll('-', '.');
    const wordCount = typeof content === 'string' && content
      ? content.replaceAll(/<[^>]*>/g, '').split(/\s+/).length
      : 0;
    const readTime = Math.max(1, Math.round(wordCount / 275));

    const lang = swedish ? 'sv' : (nonenglish ? /** @type {string} */ (post.lang) : false);

    return renderToStringSync(html`
      <${tag} class="post-card h-entry">
          <div class="post-meta">
            <relative-time><time class="dt-published" datetime=${isoDate}>${isoDateShort}</time></relative-time>
            ${wordCount > 0 ? html`<span class="badge">${readTime} MIN READ</span>` : ''}
          </div>
          <h3 class="post-title p-name"><a lang=${lang} class="u-url u-uid" href=${/** @type {string} */ (post.pageUrl) || ''}>${String(post.title || '')}</a></h3>
        </${tag}>
    `);
  }

  // Like post
  if (post['mf-like-of']) {
    return renderPostLike({ authorName, post });
  }

  // Full content post
  return renderPostContent({
    authorName,
    content,
    nonenglish,
    post,
    siteUrl,
    standalone,
    swedish,
  });
}
