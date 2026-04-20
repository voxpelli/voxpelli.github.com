import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { PostTags } from './components/post-metadata.js';
import { extractExcerpt } from './excerpt.js';
import { renderPostContent } from './render-post-content.js';
import { renderPostLike } from './render-post-like.js';
import { renderTil } from './render-til.js';
import { safeHref, safePostUrl } from './safe-url.js';
import { extractFullDomain, parseDateSafe } from './utils.js';

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

  // Links post (compact variant) — same visual family as til-card but the
  // title links to the external bookmark target (u-bookmark-of) rather than
  // the permalink, and a .domain-badge replaces the topic pill. Standalone
  // links articles still route through renderPostContent (full content +
  // PostHeader bookmark variant) for long-form commentary pages.
  if (post.category === 'links' && !standalone) {
    return renderBookmarkCard({ content, post, swedish, nonenglish });
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
 * Render a bookmark-style compact card for links posts in a listing context.
 *
 * Shape mirrors renderTil's til-card but the primary title link targets the
 * external bookmark URL (u-bookmark-of microformat) and a .domain-badge
 * shows the source domain. The permalink is inferable from the outer
 * h-entry context; no explicit "permalink" link is emitted to match the
 * editorial convention of linkblog entries (title IS the destination).
 *
 * @param {object} options
 * @param {PostVars} options.post
 * @param {string} [options.content] - Rendered markdown content (for excerpt)
 * @param {boolean} [options.swedish]
 * @param {boolean} [options.nonenglish]
 * @returns {string}
 */
function renderBookmarkCard ({ content, nonenglish, post, swedish }) {
  const bookmarkOf = Array.isArray(post['mf-bookmark-of']) ? post['mf-bookmark-of'] : undefined;
  const bookmarkUrl = typeof bookmarkOf?.[0] === 'string' ? bookmarkOf[0] : undefined;
  const safeBookmarkUrl = bookmarkUrl ? safePostUrl(bookmarkUrl) : '';
  const domain = bookmarkUrl ? extractFullDomain(bookmarkUrl) : '';

  const dateObj = parseDateSafe(post.date);
  const isoDate = dateObj.toISOString();
  const isoDateShort = isoDate.slice(0, 10).replaceAll('-', '.');

  const postUrl = post.pageUrl || '';
  const safeUrl = safePostUrl(postUrl);
  const tags = Array.isArray(post.tags) ? post.tags : undefined;
  const lang = swedish ? 'sv' : (nonenglish ? /** @type {string} */ (post.lang) : false);

  const excerptResult = content ? extractExcerpt(content) : undefined;
  // "My notes →" signals the permalink is commentary, not the primary
  // destination. The bookmark title (above) already links external.
  const excerptHtml = excerptResult
    ? renderExcerpt(excerptResult, postUrl, { readMoreLabel: 'My notes' })
    : '';

  return renderToStringSync(html`
    <article class="h-entry til-card til-card--bookmark" lang=${lang}>
        <div class="post-meta">
          <relative-time><time class="dt-published" datetime=${isoDate}>${isoDateShort}</time></relative-time>
          <span class="p-category" hidden>links</span>
          ${domain ? html`<span class="domain-badge" aria-hidden="true">${domain}</span>` : ''}
        </div>
        <h3 class="post-title p-name">
          ${safeBookmarkUrl
            ? html`<a class="u-bookmark-of" href=${safeBookmarkUrl}>${post.title || ''}</a>`
            : html`<a class="u-url u-uid" href=${safeUrl}>${post.title || ''}</a>`}
        </h3>
        ${rawHtml(excerptHtml)}
        ${PostTags({ headingLang: false, swedish: swedish || false, tags })}
      </article>
  `);
}

/**
 * Render excerpt HTML with optional fade and "read more" link.
 *
 * The read-more label varies by post type: blog/TIL excerpts say "Read full
 * article"; bookmark cards point at internal commentary via "My notes" since
 * their title already targets the external source.
 *
 * @param {import('./excerpt.js').ExcerptResult} result
 * @param {string} postUrl
 * @param {{ readMoreLabel?: string }} [options]
 * @returns {string}
 */
function renderExcerpt (result, postUrl, options = {}) {
  const { readMoreLabel = 'Read full article' } = options;
  const mfClass = result.truncated ? 'p-summary' : 'e-content';
  const fade = result.truncated
    ? '<div class="post-excerpt-fade" aria-hidden="true"></div>'
    : '';
  const href = safeHref(postUrl);
  const readMore = result.truncated && href
    ? `<a class="post-read-more" href="${href}">${readMoreLabel} \u2192</a>`
    : '';

  return `<div class="post-excerpt ${mfClass}">${result.html}${fade}</div>${readMore}`;
}
