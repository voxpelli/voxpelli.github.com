import { escapeXml } from './lib/escape.js';
import { getSiteVars } from './lib/get-site-vars.js';
import { redirects } from './redirects.template.js';

export const dataDeps = ['sourcePagePaths'];

// Redirect stubs (meta-refresh), feed files, and the 404 page are not
// canonical content — excluding them keeps crawlers focused on real pages.
const redirectFromPaths = new Set(redirects.map(r => r.from));

/**
 * Decide whether a given page path should appear in the sitemap.
 *
 * @param {string} pagePath - DomStack page path, e.g. `2020/05/slug` or `404`.
 * @returns {boolean}
 */
function isIndexable (pagePath) {
  if (pagePath === '404' || pagePath === '404/') return false;
  if (pagePath.endsWith('.xml')) return false;
  if (redirectFromPaths.has(pagePath)) return false;
  return true;
}

/**
 * @param {{ vars: Record<string, unknown>, data: Record<string, unknown> }} options
 * @returns {import('./global-types.d.ts').TemplateOutputOverride}
 */
export default function sitemapTemplate ({ data, vars }) {
  const { siteUrl } = getSiteVars(vars);

  const urls = /** @type {string[]} */ (data.sourcePagePaths)
    .filter(pagePath => isIndexable(pagePath))
    .map(pagePath => {
      const url = pagePath ? '/' + pagePath + '/' : '/';
      return `  <url>
    <loc>${escapeXml(siteUrl + url)}</loc>
  </url>`;
    })
    .join('\n');

  return {
    outputName: 'sitemap.xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
  };
}
