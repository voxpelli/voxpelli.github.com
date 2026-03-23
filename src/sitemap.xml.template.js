import { escapeXml } from './lib/escape.js';

/**
 * @param {{ vars: Record<string, unknown>, pages: Array<{ pageInfo: { path: string, outputRelname: string } }> }} options
 * @returns {Array<{outputName: string, content: string}>}
 */
export default function sitemapTemplate ({ vars, pages }) {
  const siteUrl = /** @type {string} */ (vars.siteUrl);

  const urls = pages
    .map(p => {
      const pagePath = p.pageInfo?.path || '';
      const url = pagePath ? '/' + pagePath + '/' : '/';
      return `  <url>
    <loc>${escapeXml(siteUrl + url)}</loc>
  </url>`;
    })
    .join('\n');

  return [{
    outputName: 'sitemap.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
  }];
}

