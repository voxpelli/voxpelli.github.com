import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

/**
 * @param {{ children: string, vars: Record<string, unknown>, scripts?: string[], styles?: string[] }} options
 * @returns {string}
 */
export default function rootLayout ({ children, scripts = [], styles = [], vars }) {
  const blogName = String(vars.blogName || '');
  const siteUrl = String(vars.siteUrl || '');
  const authorName = String(vars.authorName || '');
  const themeColor = String(vars.themeColor || '');
  const pushHub = String(vars.pushHub || '');
  const webmentionEndpoint = String(vars.webmentionEndpoint || '');

  const title = vars.frontpage
    ? blogName
    : (vars.title ? `${vars.title} \u2013 ${blogName}` : blogName);

  const pageUrl = String(vars.pageUrl || '') || '/';
  const canonicalUrl = `${siteUrl}${vars.frontpage ? '/' : pageUrl}`;

  const headContent = renderToStringSync(html`
    <meta charset="utf-8" />

    <title class=${vars.hfeed ? 'p-name' : false}>${title}</title>

    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <meta name="theme-color" content=${themeColor} />
    <link rel="manifest" href="/manifest.json" />

    ${styles.map(href => html`<link rel="stylesheet" href=${href} />`)}

    ${vars.category === 'links' ? html`<link rel="alternate" type="application/atom+xml" href="/links/all.xml" title="All links" />` : ''}
    <link rel=${vars.frontpage ? 'alternate' : 'home alternate'} type="application/atom+xml" href="/all.xml" title="All posts" />
    <link rel=${vars.frontpage ? 'alternate' : 'home alternate'} type="application/atom+xml" href="/english.xml" title="English posts" />

    <link rel="canonical" href=${canonicalUrl} class=${vars.hfeed ? 'u-url' : false} />
    <meta name="twitter:site" content="@voxpelli" />
    ${vars.frontpage
? html`
  <link rel="self" href=${siteUrl} type="text/html" />
    ${pushHub ? html`<link rel="hub" href=${pushHub} />` : ''}
    <link rel="micropub" href="https://micropub-to-github.herokuapp.com/micropub/voxpelli.com" />
`
: ''}
    ${vars.author ? html`<link rel="author" type="text/html" href="/" title=${authorName} />` : ''}
    ${vars.webmentionable ? html`<link rel="webmention" href=${`${webmentionEndpoint}/api/webmention`} />` : ''}
  `);

  const bodyContent = renderToStringSync(html`
    <div class="page">
      <header>
        <h1><a href="/">${blogName}</a></h1>
        <div class="subtitle">Things <a rel=${vars.frontpage ? 'me' : false} href="/about/">about me</a> and the world around us</div>
      </header>

      ${rawHtml(children)}

      ${!vars.frontpage && vars.hfeed
      ? html`
        <section class="p-author h-card summary-card">
                  Hi! Thanks for reading my blog. Lots of words, right? Yeah, that's just me, <a class="p-name u-url" href="/"><img class="u-photo" src="/avatar.jpg" alt="" width="20" height="20" /> Pelle Wessman</a>, that sometimes likes to put a lot of words in certain orders to try to make sense of the world. Hope you enjoyed it!
                </section>
      `
      : ''}
    </div>
    ${scripts.map(src => html`<script type="module" src=${src}></script>`)}
  `);

  return `<!DOCTYPE html>
<html lang="en" class="no-js${vars.classes ? ` ${vars.classes}` : ''}${vars.hfeed ? ' h-feed' : ''}">
<head>${headContent}</head>
<body>${bodyContent}</body>
</html>`;
}
