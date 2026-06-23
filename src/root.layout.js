import { html, rawHtml, renderToStringSync } from 'async-htm-to-string';

import { escapeXml } from './lib/escape.js';
import { safePostUrl } from './lib/safe-url.js';

/**
 * Path-based active-nav predicate.
 * - Home matches only exactly `/`.
 * - Articles matches `/articles/` + standalone blog posts `/YYYY/...` + `/archive/`.
 * - TIL matches `/til/`, `/links/`, and `/releases/` (the TIL superset).
 * - Others: exact or prefix match.
 *
 * @param {string} itemHref
 * @param {string} currentPath
 * @returns {boolean}
 */
function navActive (itemHref, currentPath) {
  if (itemHref === '/') return currentPath === '/';
  if (itemHref === '/articles/') {
    return currentPath === '/articles/' ||
      /^\/\d{4}\//.test(currentPath) ||
      currentPath.startsWith('/archive/');
  }
  if (itemHref === '/til/') {
    return currentPath.startsWith('/til/') ||
      currentPath.startsWith('/links/') ||
      currentPath.startsWith('/releases/');
  }
  return currentPath === itemHref || currentPath.startsWith(itemHref);
}

/**
 * @param {{ children: string, page?: { path: string } | undefined, vars: Record<string, unknown> & import('./global-types.d.ts').SiteVars & { noFeedAlternates?: boolean }, scripts?: string[], styles?: string[] }} options
 * @returns {string}
 */
export default function rootLayout ({ children, page, scripts = [], styles = [], vars }) {
  const blogName = String(vars.blogName || '');
  const siteUrl = String(vars.siteUrl || '');
  const authorName = String(vars.authorName || '');
  const themeColor = String(vars.themeColor || '');
  const pushHub = String(vars.pushHub || '');
  const webmentionEndpoint = String(vars.webmentionEndpoint || '');

  const title = vars.frontpage
    ? blogName
    : (vars.title ? `${vars.title} \u2013 ${blogName}` : blogName);

  const lang = String(vars.lang || 'en');

  const pageUrl = (page?.path ? '/' + page.path + '/' : String(vars.pageUrl || '')) || '/';
  const canonicalUrl = `${siteUrl}${vars.frontpage ? '/' : pageUrl}`;

  // Determine active nav item
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Articles', href: '/articles/' },
    { label: 'TIL', href: '/til/' },
    { label: 'Social Feed', href: '/social/' },
    { label: 'About', href: '/about/' },
  ].map(item => ({ ...item, active: navActive(item.href, pageUrl) }));

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

    ${!vars.noFeedAlternates
      ? html`<link rel="alternate" type="application/atom+xml" href="/stream.xml" title="Pelle Wessman — Stream (everything)" />`
      : ''}
    ${vars.category === undefined && !vars.frontpage && !vars.noFeedAlternates
      ? html`
        <link rel="home alternate" type="application/atom+xml" href="/all.xml" title="All posts" />
        <link rel="home alternate" type="application/atom+xml" href="/english.xml" title="English posts" />
      `
      : ''}
    ${vars.category === 'til'
      ? html`<link rel="alternate" type="application/atom+xml" href="/til/feed.atom" title="TIL" />`
      : ''}
    ${vars.category === 'links'
      ? html`
        <link rel="alternate" type="application/atom+xml" href="/links/all.xml" title="All links" />
        <link rel="alternate" type="application/atom+xml" href="/til/feed.atom" title="TIL" />
      `
      : ''}
    ${vars.category === 'release'
      ? html`
        <link rel="alternate" type="application/atom+xml" href="/releases/feed.atom" title="Releases" />
        <link rel="alternate" type="application/atom+xml" href="/til/feed.atom" title="TIL" />
      `
      : ''}

    ${!vars.noCanonical ? html`<link rel="canonical" href=${canonicalUrl} />` : ''}

    <meta property="og:title" content=${title} />
    ${!vars.noCanonical ? html`<meta property="og:url" content=${canonicalUrl} />` : ''}
    <meta property="og:site_name" content=${blogName} />
    <meta property="og:type" content=${vars.layout === 'article' ? 'article' : 'website'} />
    <meta property="og:locale" content=${lang === 'sv' ? 'sv_SE' : 'en_US'} />

    ${vars.frontpage
      ? html`
        ${pushHub ? html`<link rel="hub" href=${safePostUrl(pushHub)} />` : ''}
      `
      : ''}
    ${vars.author ? html`<link rel="author" type="text/html" href="/" title=${authorName} />` : ''}
    ${vars.webmentionable ? html`<link rel="webmention" href=${safePostUrl(`${webmentionEndpoint}/api/webmention`)} />` : ''}
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
? html`<h1 class="title"><a href="/" class="p-name u-url">${authorName}</a></h1>`
: html`<p class="title"><a href="/" class="p-name u-url">${authorName}</a></p>`}
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
            <a class="notbyai-badge notbyai-badge--drawer" href="https://notbyai.fyi/" rel="noopener" aria-label="Written by Human, Not by AI — visit notbyai.fyi">
              <picture>
                <source srcset="/badges/notbyai-human-white.svg" media="(prefers-color-scheme: dark)" />
                <img src="/badges/notbyai-human-black.svg" alt="Written by Human, Not by AI" width="240" height="60" loading="lazy" />
              </picture>
            </a>
          </div>
        </div>

        <a class="notbyai-badge notbyai-badge--sidebar" href="https://notbyai.fyi/" rel="noopener" aria-label="Written by Human, Not by AI — visit notbyai.fyi">
          <picture>
            <source srcset="/badges/notbyai-human-white.svg" media="(prefers-color-scheme: dark)" />
            <img src="/badges/notbyai-human-black.svg" alt="Written by Human, Not by AI" width="240" height="60" loading="lazy" />
          </picture>
        </a>
      </aside>

      <main id="main-content" class=${`content-area${vars.hfeed ? ' h-feed' : ''}`}>
        ${vars.hfeed ? html`<span class="sr-only p-name">${blogName}</span>` : ''}
        ${rawHtml(children)}
      </main>
    </div>
    ${scripts.map(src => html`<script type="module" src=${src}></script>`)}
  `);

  // Classes from page vars are HTML-encoded — escapeXml covers all five
  // attribute-breaker chars. Stripping `"` alone leaves `<` / `>` paths open.
  const classes = escapeXml(String(vars.classes || ''));

  return `<!DOCTYPE html>
<html lang="${escapeXml(lang)}" class="no-js${classes ? ` ${classes}` : ''}">
<head>${headContent}</head>
<body>${bodyContent}</body>
</html>`;
}
