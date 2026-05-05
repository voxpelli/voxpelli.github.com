import { html, renderToStringSync } from 'async-htm-to-string';

import { getCategoryCollection } from './lib/categories.js';
import { renderPost } from './lib/render-post.js';
import { safePostUrl } from './lib/safe-url.js';
import rootLayout from './root.layout.js';

/**
 * Article/post layout - extends root layout with webmention form and post rendering
 *
 * @param {{ children: string, page?: { path: string }, vars: Record<string, unknown>, scripts?: string[], styles?: string[] }} options
 * @returns {string}
 */
export default function articleLayout ({ children, page, scripts = [], styles = [], vars }) {
  const pageUrl = page?.path ? '/' + page.path + '/' : String(vars.pageUrl || '');

  const postVars = {
    ...vars,
    pageUrl,
  };

  // Route through the renderPost dispatcher so category-specific renderers
  // (e.g. renderTil for TIL posts, renderPostLike for likes) can add their
  // own affordances on standalone article pages. Generic posts fall through
  // to renderPostContent, matching the prior direct-call behaviour.
  const articleHtml = renderPost({
    authorName: /** @type {string} */ (vars.authorName),
    content: children,
    post: postVars,
    siteUrl: /** @type {string} */ (vars.siteUrl),
    standalone: true,
    webmentionEndpoint: /** @type {string} */ (vars.webmentionEndpoint),
  });

  const wmEndpoint = /** @type {string} */ (vars.webmentionEndpoint);

  const webmentionForm = renderToStringSync(html`
    <section class="webmention-form">
      <form action=${safePostUrl(`${wmEndpoint}/api/webmention`)} method="post">
        <label for="webmention-source">Have you written a response to this? Let me know the URL:</label>
        <input id="webmention-source" name="source" type="url" placeholder="http://example.com/my-cool-post" />
        <input name="target" value=${`${vars.siteUrl}${pageUrl}`} type="hidden" />
        <input value="Send Webmention" type="submit" />
      </form>
    </section>

    <script defer src=${safePostUrl(`${wmEndpoint}/js/cutting-edge.js`)}></script>
  `);

  // Find adjacent posts for prev/next navigation (scoped to same content category).
  // Dispatch via CATEGORIES registry so new categories automatically get prev/next
  // — the previous if/else ladder silently dropped TIL into blogPosts, where
  // tilPosts were filter-excluded and currentIndex was always -1.
  const postList = getCategoryCollection(
    typeof vars.category === 'string' ? vars.category : undefined,
    vars
  );
  const currentIndex = postList.findIndex(p => String(p.pageUrl) === pageUrl);
  const prevPost = currentIndex !== -1 ? postList[currentIndex + 1] : undefined; // older
  const nextPost = currentIndex > 0 ? postList[currentIndex - 1] : undefined; // newer

  const postNav = (prevPost || nextPost)
    ? renderToStringSync(html`
      <nav class="post-nav" aria-label="Post navigation">
        ${prevPost
          ? html`
            <a class="post-nav-link post-nav-prev" href=${safePostUrl(String(prevPost.pageUrl || ''))} rel="prev">
              <span class="post-nav-label">Older</span>
              <span class="post-nav-title">${String(prevPost.title || '')}</span>
            </a>
          `
          : ''}
        ${nextPost
          ? html`
            <a class="post-nav-link post-nav-next" href=${safePostUrl(String(nextPost.pageUrl || ''))} rel="next">
              <span class="post-nav-label">Newer</span>
              <span class="post-nav-title">${String(nextPost.title || '')}</span>
            </a>
          `
          : ''}
      </nav>
    `)
    : '';

  const layoutVars = {
    ...vars,
    author: true,
    hfeed: false,
    webmentionable: true,
  };

  return rootLayout({
    children: articleHtml + '\n' + webmentionForm + '\n' + postNav,
    page,
    scripts,
    styles,
    vars: layoutVars,
  });
}
