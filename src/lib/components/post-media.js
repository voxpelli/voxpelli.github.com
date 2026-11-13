import { html } from 'async-htm-to-string';

import { safePostUrl } from '../safe-url.js';

/** @import { HtmlTemplateValue } from 'async-htm-to-string' */

/**
 * Render video or photo media block.
 *
 * @param {object} options
 * @param {string[]|undefined} [options.photos]
 * @param {string[]|undefined} [options.videos]
 * @returns {HtmlTemplateValue | undefined}
 */
export function PostMedia ({ photos, videos }) {
  if (videos && videos.length > 0) {
    return html`
      <div class="media">
            ${videos.map(v => html`
              <video class="u-video" src=${safePostUrl(v)} controls loop>
                      <p lang="en">Looks like you can't see this video. <a href=${safePostUrl(v)} download>Download it</a> instead.</p>
                    </video>
            `)}
          </div>
    `;
  }
  if (photos && photos.length > 0) {
    return html`
      <div class="media">
            ${photos.map(p => html`<img class="u-photo" src=${safePostUrl(p)} alt="" />`)}
          </div>
    `;
  }
}
