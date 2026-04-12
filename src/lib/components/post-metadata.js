import { html } from 'async-htm-to-string';

import { capitalize, extractDomain, extractFullDomain, extractName } from '../utils.js';

/**
 * Render a bilingual heading with optional lang attribute.
 *
 * @param {object} options
 * @param {string|false} options.headingLang
 * @param {string} options.enText
 * @param {string} options.svText
 * @param {boolean} options.swedish
 * @returns {import('async-htm-to-string').HtmlTemplateValue}
 */
export function LocalizedHeading ({ enText, headingLang, svText, swedish }) {
  return html`<strong lang=${headingLang}>${swedish ? svText : enText}</strong>`;
}

/**
 * Render "In reply to" section.
 *
 * @param {object} options
 * @param {string|false} options.headingLang
 * @param {string[]|undefined} [options.inReplyTo]
 * @param {boolean} options.swedish
 * @returns {import('async-htm-to-string').HtmlTemplateValue | undefined}
 */
export function PostReply ({ headingLang, inReplyTo, swedish }) {
  if (!inReplyTo || inReplyTo.length === 0) return;

  if (inReplyTo.length === 1) {
    return html`
      <div class="replies linklist">
        ${LocalizedHeading({ enText: 'In reply to:', headingLang, svText: 'Svar p\u00E5:', swedish })}
        <p><a class="u-in-reply-to" rel="in-reply-to" href=${inReplyTo[0]}>${extractFullDomain(/** @type {string} */ (inReplyTo[0]))}</a></p>
      </div>
    `;
  }

  return html`
    <div class="replies linklist">
      ${LocalizedHeading({ enText: 'In reply to:', headingLang, svText: 'Svar p\u00E5:', swedish })}
      <ul>
        ${inReplyTo.map(r => html`<li><a class="u-in-reply-to" rel="in-reply-to" href=${r}>${extractFullDomain(r)}</a></li>`)}
      </ul>
    </div>
  `;
}

/**
 * Render syndication links ("Also posted on").
 *
 * @param {object} options
 * @param {string|false} options.headingLang
 * @param {boolean} [options.standalone]
 * @param {boolean} options.swedish
 * @param {string[]|undefined} [options.syndication]
 * @returns {import('async-htm-to-string').HtmlTemplateValue | undefined}
 */
export function PostSyndication ({ headingLang, standalone, swedish, syndication }) {
  if (!syndication || syndication.length === 0) return;
  return html`
    <div class="elsewhere linklist">
        ${LocalizedHeading({ enText: 'Also posted on:', headingLang, svText: 'Ocks\u00E5 postat p\u00E5:', swedish })}
        <ul>
          ${syndication.map(url => html`<li><a href=${url} class="u-syndication" rel=${standalone ? 'syndication' : false}>${capitalize(extractDomain(url))}</a></li>`)}
        </ul>
      </div>
  `;
}

/**
 * Render person tags ("Mentioned").
 *
 * @param {object} options
 * @param {string|false} options.headingLang
 * @param {string[]|undefined} [options.persontags]
 * @param {boolean} options.swedish
 * @returns {import('async-htm-to-string').HtmlTemplateValue | undefined}
 */
export function PostPersonTags ({ headingLang, persontags, swedish }) {
  if (!persontags || persontags.length === 0) return;
  return html`
    <div class="persons linklist">
        ${LocalizedHeading({ enText: 'Mentioned:', headingLang, svText: 'N\u00E4mnda:', swedish })}
        <ul>
          ${persontags.map(url => html`<li><a href=${url} class="u-category h-card">${extractName(url)}</a></li>`)}
        </ul>
      </div>
  `;
}

/**
 * Render "Submitted to" links.
 *
 * @param {object} options
 * @param {string|false} options.headingLang
 * @param {string[]|undefined} [options.submitto]
 * @param {boolean} options.swedish
 * @returns {import('async-htm-to-string').HtmlTemplateValue | undefined}
 */
export function PostSubmitTo ({ headingLang, submitto, swedish }) {
  if (!submitto || submitto.length === 0) return;
  return html`
    <div class="submitted-to linklist">
        ${LocalizedHeading({ enText: 'Submitted to:', headingLang, svText: 'Inskickad till:', swedish })}
        <ul>
          ${submitto.map(url => html`<li><a href=${url} class="u-category">${extractFullDomain(url)}</a></li>`)}
        </ul>
      </div>
  `;
}

/**
 * Render tags list.
 *
 * @param {object} options
 * @param {string|false} options.headingLang
 * @param {boolean} options.swedish
 * @param {string[]|undefined} [options.tags]
 * @returns {import('async-htm-to-string').HtmlTemplateValue | undefined}
 */
export function PostTags ({ headingLang, swedish, tags }) {
  if (!tags || tags.length === 0) return;
  return html`
    <div class="tags linklist">
        ${LocalizedHeading({ enText: 'Tags:', headingLang, svText: 'Taggar:', swedish })}
        <ul>
          ${tags.map(tag => html`<li class="p-category">${String(tag)}</li>`)}
        </ul>
      </div>
  `;
}
