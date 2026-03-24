import { html, renderToStringSync } from 'async-htm-to-string';

import { renderPostContent } from './lib/render-post-content.js';
import rootLayout from './root.layout.js';

/**
 * Article/post layout - extends root layout with webmention form and post rendering
 *
 * @param {{ children: string, vars: Record<string, unknown>, scripts?: string[], styles?: string[] }} options
 * @returns {string}
 */
export default function articleLayout ({ children, scripts = [], styles = [], vars }) {
  const swedish = !vars.lang || vars.lang === 'sv';
  const nonenglish = vars.lang !== 'en';

  const postVars = {
    ...vars,
    pageUrl: vars.pageUrl || '',
  };

  const articleHtml = renderPostContent({
    authorName: /** @type {string} */ (vars.authorName),
    content: children,
    nonenglish,
    post: postVars,
    siteUrl: /** @type {string} */ (vars.siteUrl),
    standalone: true,
    swedish,
    webmentionEndpoint: /** @type {string} */ (vars.webmentionEndpoint),
  });

  const wmEndpoint = /** @type {string} */ (vars.webmentionEndpoint);

  const webmentionForm = renderToStringSync(html`
    <div>
      <form action=${`${wmEndpoint}/api/webmention`} method="post">
        <label for="webmention-source">Have you written a response to this? Let me know the URL:</label>
        <input id="webmention-source" name="source" type="url" placeholder="http://example.com/my-cool-post" />
        <input name="target" value=${`${vars.siteUrl}${vars.pageUrl || ''}`} type="hidden" />
        <input value="Send Webmention" type="submit" />
      </form>
    </div>

    <script defer src=${`${wmEndpoint}/js/cutting-edge.js`}></script>
  `);

  const layoutVars = {
    ...vars,
    author: true,
    hfeed: true,
    webmentionable: true,
  };

  return rootLayout({
    children: articleHtml + '\n' + webmentionForm,
    scripts,
    styles,
    vars: layoutVars,
  });
}
