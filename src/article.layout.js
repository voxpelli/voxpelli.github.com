import rootLayout from './root.layout.js';
import { renderPostContent } from './lib/render-post-content.js';

/**
 * Article/post layout - extends root layout with webmention form and post rendering
 *
 * @param {{ children: string, vars: Record<string, unknown> }} options
 * @returns {string}
 */
export default function articleLayout ({ children, vars }) {
  const swedish = !vars.lang || vars.lang === 'sv';
  const nonenglish = vars.lang !== 'en';

  const postVars = {
    ...vars,
    pageUrl: vars.pageUrl || '',
  };

  const articleHtml = renderPostContent({
    post: postVars,
    content: children,
    standalone: true,
    indieactions: true,
    swedish,
    nonenglish,
    authorName: /** @type {string} */ (vars.authorName),
    siteUrl: /** @type {string} */ (vars.siteUrl),
    webmentionEndpoint: /** @type {string} */ (vars.webmentionEndpoint),
  });

  const wmEndpoint = /** @type {string} */ (vars.webmentionEndpoint);

  const webmentionForm = `<div>
  Have you written a response to this? Let me know the URL:
  <form action="${wmEndpoint}/api/webmention" method="post">
    <input name="source" type="url" placeholder="http://example.com/my-cool-post" />
    <input name="target" value="http://voxpelli.com${vars.pageUrl || ''}" type="hidden">
    <input value="Send Webmention" type="submit">
  </form>
</div>

<script defer src="${wmEndpoint}/js/cutting-edge.js"></script>`;

  const layoutVars = {
    ...vars,
    author: true,
    flattrable: true,
    webmentionable: true,
    hfeed: true,
  };

  return rootLayout({
    children: articleHtml + '\n' + webmentionForm,
    vars: layoutVars,
  });
}
