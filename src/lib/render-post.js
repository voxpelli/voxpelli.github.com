import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { extractExcerpt } from './excerpt.js';
import { renderPostContent } from './render-post-content.js';
import { renderPostLike } from './render-post-like.js';
import { renderTil } from './render-til.js';
import { safeHref } from './safe-url.js';
import { parseDateSafe } from './utils.js';

export { safePostUrl } from './safe-url.js';

/**
 * @typedef {object} PostVarsBase
 * @property {string} [title]
 * @property {string} [date]
 * @property {string} [lang]
 * @property {string} [category]
 * @property {string} [pageUrl]
 * @property {string[]} [tags]
 * @property {string[]} [persontags]
 * @property {string[]} [submitto]
 * @property {string} [content]
 */

/**
 * @typedef {object} TilPostVarsExtra
 * @property {'til'} category
 * @property {string} [topic]
 * @property {string} [via]
 */

/** @typedef {PostVarsBase & TilPostVarsExtra & Record<string, unknown>} TilPostVars */
/** @typedef {PostVarsBase & { category?: undefined | 'social' | 'links' } & Record<string, unknown>} BasePostVars */

/**
 * Discriminated union over post category. Narrowing (e.g. the cast inside
 * renderTil where the dispatcher guarantees category==='til') exposes
 * topic/via as typed fields. The Record<string, unknown> intersection on
 * both branches preserves the existing `post['mf-*']` bracket-access
 * pattern used by render-post-content.js et al. — a full typedef of every
 * microformat field is out of scope for this refactor.
 *
 * @typedef {TilPostVars | BasePostVars} PostVars
 */

/**
 * Smart post dispatcher - renders as blog summary, like, or full content
 *
 * @param {object} options
 * @param {PostVars} options.post - Post frontmatter/vars
 * @param {string} [options.content] - Rendered content
 * @param {boolean} [options.excerpt] - Show content excerpt in listing
 * @param {boolean} [options.standalone]
 * @param {string} [options.container] - Container element tag (default: 'article')
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @param {string} [options.webmentionEndpoint] - Webmention endpoint (forwarded to renderPostContent for standalone pages)
 * @returns {string}
 */
export function renderPost ({ authorName, container, content, excerpt, post, siteUrl, standalone, webmentionEndpoint }) {
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
    const postUrl = post.pageUrl || '';

    // Extract excerpt when requested and content is available
    const excerptResult = excerpt && content ? extractExcerpt(content) : undefined;
    const excerptHtml = excerptResult
      ? renderExcerpt(excerptResult, postUrl)
      : '';

    return renderToStringSync(html`
      <${tag} class="post-card h-entry">
          <div class="post-meta">
            <relative-time><time class="dt-published" datetime=${isoDate}>${isoDateShort}</time></relative-time>
            ${wordCount > 0 ? html`<span class="badge">${readTime} MIN READ</span>` : ''}
          </div>
          <h3 class="post-title p-name"><a lang=${lang} class="u-url u-uid" href=${postUrl}>${post.title || ''}</a></h3>
          ${rawHtml(excerptHtml)}
        </${tag}>
    `);
  }

  // TIL post — compact summary in listings, full content on standalone pages
  if (post.category === 'til') {
    return renderTil({
      authorName,
      compact: !standalone,
      content,
      nonenglish,
      post,
      siteUrl,
      standalone,
      swedish,
      webmentionEndpoint,
    });
  }

  // Like post — compact in listings, full on standalone pages
  if (post['mf-like-of']) {
    return renderPostLike({ authorName, compact: !standalone, post });
  }

  // Full content post — compact in listings (suppress author, webmention link)
  return renderPostContent({
    authorName,
    compact: !standalone,
    content,
    nonenglish,
    post,
    siteUrl,
    standalone,
    swedish,
    webmentionEndpoint,
  });
}

/**
 * Render excerpt HTML with optional fade and "read full" link.
 *
 * @param {import('./excerpt.js').ExcerptResult} result
 * @param {string} postUrl
 * @returns {string}
 */
function renderExcerpt (result, postUrl) {
  const mfClass = result.truncated ? 'p-summary' : 'e-content';
  const fade = result.truncated
    ? '<div class="post-excerpt-fade" aria-hidden="true"></div>'
    : '';
  const href = safeHref(postUrl);
  const readMore = result.truncated && href
    ? `<a class="post-read-more" href="${href}">Read full article \u2192</a>`
    : '';

  return `<div class="post-excerpt ${mfClass}">${result.html}${fade}</div>${readMore}`;
}
