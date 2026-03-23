import { escapeHtml } from './lib/escape.js';

/**
 * @param {{ children: string, vars: Record<string, unknown>, scripts?: string[], styles?: string[] }} options
 * @returns {string}
 */
export default function rootLayout ({ children, scripts = [], styles = [], vars }) {
  const blogName = /** @type {string} */ (vars.blogName);
  const siteUrl = /** @type {string} */ (vars.siteUrl);
  const title = vars.frontpage
    ? blogName
    : (vars.title ? `${vars.title} – ${blogName}` : blogName);

  const pageUrl = /** @type {string} */ (vars.pageUrl) || '/';
  const canonicalUrl = `${siteUrl}${vars.frontpage ? '/' : pageUrl}`;

  return `<!DOCTYPE html>
<html lang="en" class="no-js ${vars.classes || ''}${vars.hfeed ? ' h-feed' : ''}">
<head>
  <meta charset="utf-8" />

  <title${vars.hfeed ? ' class="p-name"' : ''}>${escapeHtml(title)}</title>

  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <meta name="theme-color" content="${vars.themeColor}">
  <link rel="manifest" href="/manifest.json">

  ${styles.map(href => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n  ')}

  ${vars.category === 'links' ? '<link rel="alternate" type="application/atom+xml" href="/links/all.xml" title="All links" />' : ''}
  <link rel="${vars.frontpage ? '' : 'home '}alternate" type="application/atom+xml" href="/all.xml" title="All posts" />
  <link rel="${vars.frontpage ? '' : 'home '}alternate" type="application/atom+xml" href="/english.xml" title="English posts" />

  <link rel="canonical" href="${escapeHtml(canonicalUrl)}"${vars.hfeed ? ' class="u-url"' : ''} />
  <meta name="twitter:site" content="@voxpelli" />
  ${vars.frontpage
? `<link rel="self" href="${vars.siteUrl}" type="text/html" />
  <link rel="hub" href="${vars.pushHub}" />
  <link rel="micropub" href="http://micropub-to-github.herokuapp.com/micropub/voxpelli.com" />`
: ''}
  ${vars.author ? `<link rel="author" type="text/html" href="/" title="${escapeHtml(/** @type {string} */ (vars.authorName))}" />` : ''}
  ${vars.flattrable ? `<link rel="payment" type="text/html" href="https://flattr.com/submit/auto?url=${encodeURIComponent(siteUrl + pageUrl)}&amp;user_id=voxpelli${vars.title ? '&amp;title=' + encodeURIComponent(/** @type {string} */ (vars.title)) : ''}&amp;category=text&amp;tags=blog&amp;language=${encodeURIComponent(/** @type {string} */ (vars.lang) || 'sv')}" title="Flattr this post" />` : ''}
  ${vars.webmentionable ? `<link rel="webmention" href="${vars.webmentionEndpoint}/api/webmention" />` : ''}
</head>
<body>
  <div class="page">
    <header>
      <h1><a href="/">${escapeHtml(blogName)}</a></h1>
      <div class="subtitle">Things <a ${vars.frontpage ? 'rel="me"' : ''} href="/about/">about me</a> and the world around us</div>
    </header>

    ${children}

    ${!vars.frontpage && (vars.hfeed)
      ? `<section class="p-author h-card summary-card">
          Hi! Thanks for reading my blog. Lots of words, right? Yeah, that's just me, <a class="p-name u-url" href="/"><img class="u-photo" src="/avatar.jpg" alt="" width="20" height="20" /> Pelle Wessman</a>, that sometimes likes to put a lot of words in certain orders to try to make sense of the world. Hope you enjoyed it!
        </section>`
      : ''}
  </div>
  ${scripts.map(src => `<script type="module" src="${escapeHtml(src)}"></script>`).join('\n  ')}
</body>
</html>`;
}
