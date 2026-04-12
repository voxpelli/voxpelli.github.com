/** @import { PostVars } from './render-post.js' */

import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { PostHeader } from './components/post-header.js';
import { PostMedia } from './components/post-media.js';
import { PostPersonTags, PostReply, PostSubmitTo, PostSyndication, PostTags } from './components/post-metadata.js';
import { PostFooter } from './render-post-footer.js';

/**
 * Render full post content with all microformats.
 *
 * @param {object} options
 * @param {PostVars} options.post
 * @param {string} [options.content] - Rendered markdown content
 * @param {boolean} [options.standalone]
 * @param {boolean} [options.compact] - When true, suppress author attribution and webmention link
 * @param {boolean} [options.swedish]
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @param {string} [options.webmentionEndpoint]
 * @returns {string}
 */
export function renderPostContent ({ authorName, compact, content, nonenglish, post, siteUrl, standalone, swedish, webmentionEndpoint }) {
  const videos = /** @type {string[]|undefined} */ (post['mf-video']);
  const photos = /** @type {string[]|undefined} */ (post['mf-photo']);
  const bookmarkOf = /** @type {string[]|undefined} */ (post['mf-bookmark-of'] || post['mf-bookmark']);
  const repostOf = /** @type {string[]|undefined} */ (post['mf-repost-of']);
  const inReplyTo = /** @type {string[]|undefined} */ (post['mf-in-reply-to']);
  const syndication = /** @type {string[]|undefined} */ (post['mf-syndication']);
  const persontags = Array.isArray(post.persontags) ? post.persontags : undefined;
  const submitto = Array.isArray(post.submitto) ? post.submitto : undefined;
  const tags = Array.isArray(post.tags) ? post.tags : undefined;
  const title = post.title;
  const pageUrl = post.pageUrl || '';

  const lang = swedish ? 'sv' : (nonenglish ? /** @type {string} */ (post.lang) : false);
  const headingLang = !swedish && nonenglish ? 'en' : false;

  const wmBase = webmentionEndpoint || 'https://webmention.herokuapp.com';
  const mentionsUrl = `${wmBase}/api/mentions?format=html&url=${encodeURIComponent(siteUrl + pageUrl)}`;

  return renderToStringSync(html`
    <article class="h-entry" lang=${lang}>
        ${PostMedia({ photos, videos })}
        ${PostHeader({ bookmarkOf, repostOf, standalone: standalone || false, title })}
        ${PostReply({ headingLang, inReplyTo, swedish: swedish || false })}
        <div class="e-content">${rawHtml(content || '')}</div>
        ${PostSyndication({ headingLang, standalone: standalone || false, swedish: swedish || false, syndication })}
        ${PostPersonTags({ headingLang, persontags, swedish: swedish || false })}
        ${PostSubmitTo({ headingLang, submitto, swedish: swedish || false })}
        ${PostTags({ headingLang, swedish: swedish || false, tags })}
        ${PostFooter({ authorName, compact, nonenglish, post })}
        ${!compact ? html`<a class="u-responses" href=${mentionsUrl}>See mentions of this post</a>` : ''}
      </article>
  `);
}
