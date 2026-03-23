import { escapeHtml } from './escape.js';
import { renderPostFooter } from './render-post-footer.js';

/**
 * Render full post content with all microformats
 *
 * @param {object} options
 * @param {Record<string, unknown>} options.post
 * @param {string} [options.content] - Rendered markdown content
 * @param {boolean} [options.standalone]
 * @param {boolean} [options.indieactions]
 * @param {boolean} [options.swedish]
 * @param {boolean} [options.nonenglish]
 * @param {string} options.authorName
 * @param {string} options.siteUrl
 * @param {string} [options.webmentionEndpoint]
 * @returns {string}
 */
export function renderPostContent ({ post, content, standalone, indieactions, swedish, nonenglish, authorName, siteUrl, webmentionEndpoint }) {
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

  let langAttr = '';
  if (swedish) langAttr = ' lang="sv"';
  else if (nonenglish) langAttr = ` lang="${post.lang}"`;

  let mediaHtml = '';
  if (videos && videos.length > 0) {
    mediaHtml = `<div class="media">
      ${videos.map(v => `<video class="u-video" src="${v}" controls loop>
          <div lang="en">Looks like you can't see this video. <a href="${v}" download>Download it</a> instead.</div>
        </video>`).join('\n      ')}
    </div>`;
  } else if (photos && photos.length > 0) {
    mediaHtml = `<div class="media">
      ${photos.map(p => `<img class="u-photo" src="${p}" alt="" />`).join('\n      ')}
    </div>`;
  }

  let headerHtml = '';
  if (title) {
    let titleContent = title;
    if (bookmarkOf && bookmarkOf[0]) {
      titleContent = `<a class="u-bookmark-of" href="${bookmarkOf[0]}">${escapeHtml(title)}</a>`;
    } else if (repostOf && repostOf[0]) {
      titleContent = `<a class="u-repost-of" href="${repostOf[0]}">${escapeHtml(title)}</a>`;
    } else {
      titleContent = escapeHtml(title);
    }
    headerHtml = `<header><h2 class="p-name">${titleContent}</h2></header>`;
  }

  let replyHtml = '';
  if (inReplyTo && inReplyTo.length > 0) {
    const heading = swedish ? 'Svar p\u00e5:' : 'In reply to:';
    const langTag = !swedish && nonenglish ? ' lang="en"' : '';
    replyHtml = `${swedish ? `<h3>${heading}</h3>` : `<h3${langTag}>${heading}</h3>`}
    <ul>
      ${inReplyTo.map(r => `<li><a class="u-in-reply-to" rel="in-reply-to" href="${r}">${r}</a></li>`).join('\n      ')}
    </ul>`;
  }

  let syndicationHtml = '';
  if (syndication && syndication.length > 0) {
    const heading = swedish ? 'Ocks\u00e5 postat p\u00e5:' : 'Also posted on:';
    const langTag = !swedish && nonenglish ? ' lang="en"' : '';
    syndicationHtml = `<div class="elsewhere linklist">
      ${swedish ? `<h3>${heading}</h3>` : `<h3${langTag}>${heading}</h3>`}
      <ul>
        ${syndication.map(url => {
    const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0] || '';
    const relAttr = standalone ? ' rel="syndication"' : '';
    return `<li><a href="${url}" class="u-syndication"${relAttr}>${capitalize(domain)}</a></li>`;
  }).join('\n        ')}
      </ul>
    </div>`;
  }

  let persontagsHtml = '';
  if (persontags && persontags.length > 0) {
    const heading = swedish ? 'N\u00e4mnda:' : 'Mentioned:';
    const langTag = !swedish && nonenglish ? ' lang="en"' : '';
    persontagsHtml = `<div class="persons linklist">
      ${swedish ? `<h3>${heading}</h3>` : `<h3${langTag}>${heading}</h3>`}
      <ul>
        ${persontags.map(url => {
    const name = url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.com$/, '').split('/')[0] || '';
    return `<li><a href="${url}" class="u-category h-card">${name}</a></li>`;
  }).join('\n        ')}
      </ul>
    </div>`;
  }

  let submittoHtml = '';
  if (submitto && submitto.length > 0) {
    const heading = swedish ? 'Inskickad till:' : 'Submitted to:';
    const langTag = !swedish && nonenglish ? ' lang="en"' : '';
    submittoHtml = `<div class="submitted-to linklist">
      ${swedish ? `<h3>${heading}</h3>` : `<h3${langTag}>${heading}</h3>`}
      <ul>
        ${submitto.map(url => {
    const name = url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.com$/, '').split('/')[0] || '';
    return `<li><a href="${url}" class="u-category">${name}</a></li>`;
  }).join('\n        ')}
      </ul>
    </div>`;
  }

  let tagsHtml = '';
  if (tags && tags.length > 0) {
    const heading = swedish ? 'Taggar:' : 'Tags:';
    const langTag = !swedish && nonenglish ? ' lang="en"' : '';
    tagsHtml = `<div class="tags linklist">
      ${swedish ? `<h3>${heading}</h3>` : `<h3${langTag}>${heading}</h3>`}
      <ul>
        ${tags.map(tag => `<li class="p-category">${escapeHtml(String(tag))}</li>`).join('\n        ')}
      </ul>
    </div>`;
  }

  const wmBase = webmentionEndpoint || 'https://webmention.herokuapp.com';
  const mentionsUrl = `${wmBase}/api/mentions?format=html&url=${encodeURIComponent(siteUrl + pageUrl)}`;

  return `<article class="h-entry"${langAttr}>

  ${mediaHtml}

  ${headerHtml}

  ${replyHtml}

  <div class="e-content">
    ${content || ''}
  </div>

  ${syndicationHtml}

  ${persontagsHtml}

  ${submittoHtml}

  ${tagsHtml}

  ${renderPostFooter({ post, nonenglish, indieactions, authorName })}

  <a class="u-responses" href="${mentionsUrl}">See mentions of this post</a>
</article>`;
}

/** @param {string} str */
function capitalize (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
