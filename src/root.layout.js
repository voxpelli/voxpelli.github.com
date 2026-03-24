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

  // Determine active nav item
  const navItems = [
    { label: 'Blog Posts', href: '/', active: !!vars.frontpage },
    { label: 'Archive', href: '/archive/', active: pageUrl === '/archive/' },
    { label: 'Social Feed', href: '/social/', active: vars.category === 'social' || pageUrl === '/social/' },
    { label: 'Links', href: '/links/', active: vars.category === 'links' || pageUrl === '/links/' },
    { label: 'About', href: '/about/', active: pageUrl === '/about/' },
  ];

  const headContent = renderToStringSync(html`
    <meta charset="utf-8" />

    <title class=${vars.hfeed ? 'p-name' : false}>${title}</title>

    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <meta name="theme-color" content=${themeColor} />
    <link rel="manifest" href="/manifest.json" />

    ${rawHtml("<script>(function(){var s=localStorage.getItem('theme')||'system';var d=s==='dark'||(s==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'})()</script>")}

    <link rel="preconnect" href="https://fonts.bunny.net" />
    <link href="https://fonts.bunny.net/css?family=jetbrains-mono:400,500,700|newsreader:400,400i,500,600,700|public-sans:400,500,600&display=swap" rel="stylesheet" />

    ${styles.map(href => html`<link rel="stylesheet" href=${href} />`)}

    ${vars.category === 'links' ? html`<link rel="alternate" type="application/atom+xml" href="/links/all.xml" title="All links" />` : ''}
    <link rel=${vars.frontpage ? 'alternate' : 'home alternate'} type="application/atom+xml" href="/all.xml" title="All posts" />
    <link rel=${vars.frontpage ? 'alternate' : 'home alternate'} type="application/atom+xml" href="/english.xml" title="English posts" />

    <link rel="canonical" href=${canonicalUrl} />
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

  const navHtml = navItems.map(item => renderToStringSync(html`
    <a href=${item.href} class=${`nav-item${item.active ? ' active' : ''}`} aria-current=${item.active ? 'page' : false}>
      <span>${item.label}</span>
      <span aria-hidden="true" style=${item.active ? '' : 'opacity: 0;'}>\u2192</span>
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
          <img src="/avatar.jpg" alt=${authorName} class="u-photo" width="56" height="56" loading="lazy" />
          <div class="profile-info p-note">
            <strong>voxpelli</strong>
            Developer. IndieWeb advocate.
          </div>
        </div>

        <nav class="nav-menu">
          ${rawHtml(navHtml)}
        </nav>

        <button class="btn" type="button" onclick="(function(){var z=document.createElement('script');z.src='https://www.subtome.com/load.js';document.body.appendChild(z);})()">Subscribe to RSS</button>

        <theme-toggle></theme-toggle>
      </aside>

      <main id="main-content" class=${`content-area${vars.hfeed ? ' h-feed' : ''}`}>
        ${rawHtml(children)}
      </main>
    </div>
    ${scripts.map(src => html`<script type="module" src=${src}></script>`)}
  `);

  // Classes from page vars are sanitized to prevent attribute breakout
  const classes = String(vars.classes || '').replaceAll('"', '');

  const lang = String(vars.lang || 'en');

  return `<!DOCTYPE html>
<html lang="${lang}" class="no-js${classes ? ` ${classes}` : ''}">
<head>${headContent}</head>
<body>${bodyContent}</body>
</html>`;
}
