import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

/**
 * @param {{ children: string, page?: { path: string } | undefined, vars: Record<string, unknown>, scripts?: string[], styles?: string[] }} options
 * @returns {string}
 */
export default function rootLayout ({ children, page, scripts = [], styles = [], vars }) {
  const blogName = String(vars.blogName || '');
  const siteUrl = String(vars.siteUrl || '');
  const authorName = String(vars.authorName || '');
  const themeColor = String(vars.themeColor || '');
  const pushHub = String(vars.pushHub || '');
  const micropubEndpoint = String(vars.micropubEndpoint || '');
  const webmentionEndpoint = String(vars.webmentionEndpoint || '');

  const title = vars.frontpage
    ? blogName
    : (vars.title ? `${vars.title} \u2013 ${blogName}` : blogName);

  const lang = String(vars.lang || 'en');

  const pageUrl = (page?.path ? '/' + page.path + '/' : String(vars.pageUrl || '')) || '/';
  const canonicalUrl = `${siteUrl}${vars.frontpage ? '/' : pageUrl}`;

  // Determine active nav item
  const navItems = [
    { label: 'Blog Posts', href: '/', active: !!vars.frontpage },
    { label: 'TIL', href: '/til/', active: vars.category === 'til' || pageUrl === '/til/' || pageUrl.startsWith('/til/') },
    { label: 'Social Feed', href: '/social/', active: vars.category === 'social' || pageUrl === '/social/' },
    { label: 'About', href: '/about/', active: pageUrl === '/about/' },
  ];

  const headContent = renderToStringSync(html`
    <meta charset="utf-8" />

    <title>${title}</title>

    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

    <meta name="theme-color" content=${themeColor} />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="/launcher-icon.png" />

    ${rawHtml("<script>(function(){var s=localStorage.getItem('theme')||'system';if(s!=='system')document.documentElement.dataset.theme=s})()</script>")}

    <link rel="preconnect" href="https://fonts.bunny.net" />
    <link rel="preload" as="font" href="https://fonts.bunny.net/newsreader/files/newsreader-latin-400-normal.woff2" type="font/woff2" crossorigin="anonymous" />
    <link href="https://fonts.bunny.net/css?family=jetbrains-mono:400,500,700|newsreader:400,400i,500,600,700|public-sans:400,500,600&display=swap" rel="stylesheet" />

    ${styles.map(href => html`<link rel="stylesheet" href=${href} />`)}

    ${vars.category === 'links' ? html`<link rel="alternate" type="application/atom+xml" href="/links/all.xml" title="All links" />` : ''}
    <link rel=${vars.frontpage ? 'alternate' : 'home alternate'} type="application/atom+xml" href="/all.xml" title="All posts" />
    <link rel=${vars.frontpage ? 'alternate' : 'home alternate'} type="application/atom+xml" href="/english.xml" title="English posts" />

    ${!vars.noCanonical ? html`<link rel="canonical" href=${canonicalUrl} />` : ''}

    <meta property="og:title" content=${title} />
    ${!vars.noCanonical ? html`<meta property="og:url" content=${canonicalUrl} />` : ''}
    <meta property="og:site_name" content=${blogName} />
    <meta property="og:type" content=${vars.layout === 'article' ? 'article' : 'website'} />
    <meta property="og:locale" content=${lang === 'sv' ? 'sv_SE' : 'en_US'} />

    ${vars.frontpage
      ? html`
        ${pushHub ? html`<link rel="hub" href=${pushHub} />` : ''}
        ${micropubEndpoint ? html`<link rel="micropub" href=${micropubEndpoint} />` : ''}
      `
      : ''}
    ${vars.author ? html`<link rel="author" type="text/html" href="/" title=${authorName} />` : ''}
    ${vars.webmentionable ? html`<link rel="webmention" href=${`${webmentionEndpoint}/api/webmention`} />` : ''}
  `);

  const navHtml = navItems.map(item => renderToStringSync(html`
    <a href=${item.href} class=${`nav-item${item.active ? ' active' : ''}`} aria-current=${item.active ? 'page' : false}>
      <span>${item.label}</span>
      <span class="nav-arrow" aria-hidden="true">\u2192</span>
    </a>
  `)).join('\n        ');

  const bodyContent = renderToStringSync(html`
    <a href="#main-content" class="skip-link">Skip to content</a>
    <div class="layout-wrapper">
      <aside class="sidebar h-card p-author">
        <header class="brand-header">
          ${vars.frontpage
? html`<h1 class="title"><a href="/" class="p-name">${authorName}</a></h1>`
: html`<p class="title"><a href="/" class="p-name">${authorName}</a></p>`}
          <p class="subtitle p-summary">Things <a rel="me" href="/about/">about me</a> and the world around us</p>
        </header>

        <div class="profile-widget">
          <img src="/avatar.jpg" alt=${authorName} class="u-photo" width="72" height="72" loading="lazy" />
          <div class="profile-info p-note">
            <strong>voxpelli</strong>
            <span>Developer. IndieWeb advocate.</span>
          </div>
        </div>

        <div class="nav-disclosure">
          <button class="hamburger-btn" type="button" aria-expanded="false" aria-controls="nav-drawer" aria-label="Open navigation menu">
            <span class="hamburger-icon" aria-hidden="true"><span></span><span></span><span></span></span>
          </button>
          <div class="nav-drawer" id="nav-drawer">
            <nav class="nav-menu">
              ${rawHtml(navHtml)}
            </nav>
            <button class="btn" type="button" data-subtome>Subscribe to RSS</button>
            <theme-toggle></theme-toggle>
          </div>
        </div>
      </aside>

      <main id="main-content" class=${`content-area${vars.hfeed ? ' h-feed' : ''}`}>
        ${vars.hfeed ? html`<span class="sr-only p-name">${blogName}</span>` : ''}
        ${rawHtml(children)}
      </main>
    </div>
    <footer class="site-footer">
      <p>
        <a href="https://notbyai.fyi/" rel="noopener">Written by Human, Not by AI</a>
      </p>
    </footer>
    ${scripts.map(src => html`<script type="module" src=${src}></script>`)}
  `);

  // Classes from page vars are sanitized to prevent attribute breakout
  const classes = String(vars.classes || '').replaceAll('"', '');

  return `<!DOCTYPE html>
<html lang="${lang}" class="no-js${classes ? ` ${classes}` : ''}">
<head>${headContent}</head>
<body>${bodyContent}</body>
</html>`;
}
