/** @import { PostVars } from './render-post.js' */

import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { PostTags } from './components/post-metadata.js';
import { extractExcerpt } from './excerpt.js';
import { renderPostContent } from './render-post-content.js';
import { safePostUrl } from './render-post.js';
import { extractFullDomain, parseDateSafe } from './utils.js';

/**
 * @typedef {object} TilVarsBase
 * @property {'til'} category
 * @property {string} [title]
 * @property {string} [date]
 * @property {string} [lang]
 * @property {string} [pageUrl]
 * @property {string[]} [tags]
 * @property {string} [topic]
 * @property {string} [via]
 */

/** @typedef {TilVarsBase & Record<string, unknown>} TilVars */

/**
 * Render a TIL (Today I Learned) post.
 *
 * TILs are short, date-stamped notes with a required title (distinguishing
 * them from IndieWeb-style notes). This dispatcher renders a compact summary
 * in listings and delegates to renderPostContent for standalone article pages.
 *
 * Listing variant surfaces:
 * - title (linked to permalink)
 * - date (dt-published)
 * - topic badge (optional)
 * - via-link (optional source citation, jvns-style)
 * - excerpt / first paragraphs of content
 * - tags
 *
 * @param {object} options
 * @param {PostVars} options.post
 * @param {string} [options.content] - Rendered markdown content
 * @param {boolean} [options.standalone]
 * @param {boolean} [options.compact] - When true, suppress author attribution and webmention link (standalone only)
 * @param {boolean} [options.swedish]
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @returns {string}
 */
export function renderTil ({ authorName, compact, content, nonenglish, post, siteUrl, standalone, swedish }) {
  if (standalone) {
    return renderPostContent({
      authorName,
      compact,
      content,
      nonenglish,
      post,
      siteUrl,
      standalone,
      swedish,
    });
  }

  const dateObj = parseDateSafe(post.date);
  const isoDate = dateObj.toISOString();
  const isoDateShort = isoDate.slice(0, 10).replaceAll('-', '.');

  const postUrl = post.pageUrl || '';
  const safeUrl = safePostUrl(postUrl);

  const via = typeof post['via'] === 'string' ? /** @type {string} */ (post['via']) : undefined;
  const viaSafe = via ? safePostUrl(via) : '';
  const topic = typeof post['topic'] === 'string' ? /** @type {string} */ (post['topic']) : undefined;
  const tags = Array.isArray(post.tags) ? post.tags : undefined;

  const lang = swedish ? 'sv' : (nonenglish ? /** @type {string} */ (post.lang) : false);

  const excerptResult = content ? extractExcerpt(content) : undefined;
  const excerptHtml = excerptResult
    ? renderTilExcerpt(excerptResult, safeUrl)
    : '';

  return renderToStringSync(html`
    <article class="h-entry til-card" lang=${lang}>
        <div class="post-meta">
          <relative-time><time class="dt-published" datetime=${isoDate}>${isoDateShort}</time></relative-time>
          <span class="p-category" hidden>til</span>
          ${topic ? html`<a class="til-topic" href=${`/til/topics/${encodeURIComponent(topic.toLowerCase())}/`}>${topic}</a>` : ''}
        </div>
        <h3 class="post-title p-name"><a class="u-url u-uid" href=${safeUrl}>${post.title || ''}</a></h3>
        ${rawHtml(excerptHtml)}
        ${via && viaSafe
? html`<p class="til-via">via <a class="u-bookmark-of" href=${viaSafe}>${extractFullDomain(via)}</a></p>`
: ''}
        ${PostTags({ headingLang: false, swedish: swedish || false, tags })}
      </article>
  `);
}

/**
 * Render TIL excerpt HTML with optional fade and "read full" link.
 *
 * @param {import('./excerpt.js').ExcerptResult} result
 * @param {string} safeUrl
 * @returns {string}
 */
function renderTilExcerpt (result, safeUrl) {
  const mfClass = result.truncated ? 'p-summary' : 'e-content';
  const fade = result.truncated
    ? '<div class="post-excerpt-fade" aria-hidden="true"></div>'
    : '';
  const readMore = result.truncated && safeUrl
    ? `<a class="post-read-more" href="${safeUrl}">Read full TIL \u2192</a>`
    : '';
  return `<div class="post-excerpt ${mfClass}">${result.html}${fade}</div>${readMore}`;
}
