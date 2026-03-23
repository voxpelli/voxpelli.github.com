import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { renderPostFooter } from './render-post-footer.js';

/**
 * Render full post content with all microformats
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post
 * @param {string} [options.content] - Rendered markdown content
 * @param {boolean} [options.standalone]
 * @param {boolean} [options.swedish]
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @param {string} [options.webmentionEndpoint]
 * @returns {string}
 */
export function renderPostContent ({ authorName, content, nonenglish, post, siteUrl, standalone, swedish, webmentionEndpoint }) {
  const videos = /** @type {string[]|undefined} */ (post['mf-video']);
  const photos = /** @type {string[]|undefined} */ (post['mf-photo']);
  const bookmarkOf = /** @type {string[]|undefined} */ (post['mf-bookmark-of'] || post['mf-bookmark']);
  const repostOf = /** @type {string[]|undefined} */ (post['mf-repost-of']);
  const inReplyTo = /** @type {string[]|undefined} */ (post['mf-in-reply-to']);
  const syndication = /** @type {string[]|undefined} */ (post['mf-syndication']);
  const persontags = /** @type {string[]|undefined} */ (post.persontags);
  const submitto = /** @type {string[]|undefined} */ (post.submitto);
  const rawTags = post.tags;
  const tags = Array.isArray(rawTags) ? /** @type {string[]} */ (rawTags) : undefined;
  const title = /** @type {string} */ (post.title);
  const pageUrl = /** @type {string} */ (post.pageUrl) || '';

  const lang = swedish ? 'sv' : (nonenglish ? /** @type {string} */ (post.lang) : false);
  const headingLang = !swedish && nonenglish ? 'en' : false;

  const mediaHtml = videos && videos.length > 0
    ? html`
      <div class="media">
            ${videos.map(v => html`
              <video class="u-video" src=${v} controls loop>
                        <div lang="en">Looks like you can't see this video. <a href=${v} download>Download it</a> instead.</div>
                      </video>
            `)}
          </div>
    `
    : (photos && photos.length > 0
        ? html`
          <div class="media">
                ${photos.map(p => html`<img class="u-photo" src=${p} alt="" />`)}
              </div>
        `
        : '');

  let headerHtml = '';
  if (title) {
    if (bookmarkOf && bookmarkOf[0]) {
      headerHtml = renderToStringSync(html`<header><h2 class="p-name"><a class="u-bookmark-of" href=${bookmarkOf[0]}>${title}</a></h2></header>`);
    } else if (repostOf && repostOf[0]) {
      headerHtml = renderToStringSync(html`<header><h2 class="p-name"><a class="u-repost-of" href=${repostOf[0]}>${title}</a></h2></header>`);
    } else {
      headerHtml = renderToStringSync(html`<header><h2 class="p-name">${title}</h2></header>`);
    }
  }

  const replyHtml = inReplyTo && inReplyTo.length > 0
    ? renderToStringSync(html`
      <h3 lang=${headingLang}>${swedish ? 'Svar p\u00E5:' : 'In reply to:'}</h3>
          <ul>
            ${inReplyTo.map(r => html`<li><a class="u-in-reply-to" rel="in-reply-to" href=${r}>${r}</a></li>`)}
          </ul>
    `)
    : '';

  const syndicationHtml = syndication && syndication.length > 0
    ? renderToStringSync(html`
      <div class="elsewhere linklist">
            <h3 lang=${headingLang}>${swedish ? 'Ocks\u00E5 postat p\u00E5:' : 'Also posted on:'}</h3>
            <ul>
              ${syndication.map(url => {
    const domain = extractDomain(url);
    return html`<li><a href=${url} class="u-syndication" rel=${standalone ? 'syndication' : false}>${capitalize(domain)}</a></li>`;
  })}
            </ul>
          </div>
    `)
    : '';

  const persontagsHtml = persontags && persontags.length > 0
    ? renderToStringSync(html`
      <div class="persons linklist">
            <h3 lang=${headingLang}>${swedish ? 'N\u00E4mnda:' : 'Mentioned:'}</h3>
            <ul>
              ${persontags.map(url => {
    const name = extractName(url);
    return html`<li><a href=${url} class="u-category h-card">${name}</a></li>`;
  })}
            </ul>
          </div>
    `)
    : '';

  const submittoHtml = submitto && submitto.length > 0
    ? renderToStringSync(html`
      <div class="submitted-to linklist">
            <h3 lang=${headingLang}>${swedish ? 'Inskickad till:' : 'Submitted to:'}</h3>
            <ul>
              ${submitto.map(url => {
    const name = extractName(url);
    return html`<li><a href=${url} class="u-category">${name}</a></li>`;
  })}
            </ul>
          </div>
    `)
    : '';

  const tagsHtml = tags && tags.length > 0
    ? renderToStringSync(html`
      <div class="tags linklist">
            <h3 lang=${headingLang}>${swedish ? 'Taggar:' : 'Tags:'}</h3>
            <ul>
              ${tags.map(tag => html`<li class="p-category">${String(tag)}</li>`)}
            </ul>
          </div>
    `)
    : '';

  const wmBase = webmentionEndpoint || 'https://webmention.herokuapp.com';
  const mentionsUrl = `${wmBase}/api/mentions?format=html&url=${encodeURIComponent(siteUrl + pageUrl)}`;

  return renderToStringSync(html`
    <article class="h-entry" lang=${lang}>

      ${rawHtml(typeof mediaHtml === 'string' ? mediaHtml : renderToStringSync(mediaHtml))}

      ${rawHtml(headerHtml)}

      ${rawHtml(replyHtml)}

      <div class="e-content">
        ${rawHtml(content || '')}
      </div>

      ${rawHtml(syndicationHtml)}

      ${rawHtml(persontagsHtml)}

      ${rawHtml(submittoHtml)}

      ${rawHtml(tagsHtml)}

      ${rawHtml(renderPostFooter({ authorName, nonenglish, post }))}

      <a class="u-responses" href=${mentionsUrl}>See mentions of this post</a>
    </article>
  `);
}

/**
 * @param {string} url
 * @returns {string}
 */
function extractDomain (url) {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0] || '';
}

/**
 * @param {string} url
 * @returns {string}
 */
function extractName (url) {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.com$/, '').split('/')[0] || '';
}

/**
 * @param {string} str
 * @returns {string}
 */
function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
