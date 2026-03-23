import { html, renderToStringSync } from 'async-htm-to-string';

import { renderPostContent } from './render-post-content.js';
import { renderPostLike } from './render-post-like.js';

/**
 * Smart post dispatcher - renders as blog summary, like, or full content
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post - Post frontmatter/vars
 * @param {string} [options.content] - Rendered content
 * @param {boolean} [options.standalone]
 * @param {string} [options.container] - Container element tag (default: 'div')
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @returns {string}
 */
export function renderPost ({ authorName, container, content, post, siteUrl, standalone }) {
  const swedish = !post.lang || post.lang === 'sv';
  const nonenglish = post.lang !== 'en';
  const tag = container || 'div';

  // Blog article summary (no category, not standalone)
  if (!post.category && !standalone) {
    const dateObj = post.date ? new Date(/** @type {string} */ (post.date)) : new Date();
    const isoDate = dateObj.toISOString();
    const shortDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const wordCount = typeof content === 'string'
      ? content.replaceAll(/<[^>]*>/g, '').split(/\s+/).length
      : 0;
    const readTime = Math.round(wordCount / 275);

    const lang = swedish ? 'sv' : (nonenglish ? /** @type {string} */ (post.lang) : false);

    return renderToStringSync(html`
      <${tag} class="h-entry blog-article-summary">
          <a lang=${lang} class="u-url u-uid p-name" href=${/** @type {string} */ (post.pageUrl) || ''}>${String(post.title || '')}</a>
          <time class="dt-published" datetime=${isoDate} pubdate>
            - ${shortDate}
          </time>
          <span class="time-to-read">
            - ${readTime} min read
          </span>
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
