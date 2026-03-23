# Native redirect support for URL migrations

`Labels: enhancement, feature-request, migration`

---

## Problem

Sites migrating from other static site generators (or from WordPress, etc.) often need **redirect pages** for old URLs that no longer match the new URL scheme. DomStack has no built-in mechanism for declaring redirects. Users must create a custom template that manually generates meta-refresh HTML pages for every redirect mapping.

This is boilerplate that every migrating site writes independently, with no standard pattern or best-practice documentation.

**Expected:** A declarative way to specify redirects (either per-page or globally) that DomStack processes into the correct output — whether that is HTML meta-refresh pages for static hosting, `_redirects` for Netlify, or `vercel.json` entries for Vercel.

**Actual:** Users must write a custom `.template.js` file that returns `TemplateOutputOverride[]` with hand-crafted HTML for each redirect.

---

## Current behavior

### This project's redirect template

This site migrated from a platform that allowed spaces in URL slugs. The current redirect implementation is a 38-line template file:

```js
// src/redirects.template.js
import { escapeXml } from './lib/escape.js';

const redirects = [
  { from: '2008/12/ny blogg', to: '/2008/12/ny-blogg/' },
  { from: '2009/01/backchannels och googlebuggar', to: '/2009/01/backchannels-och-googlebuggar/' },
  { from: '2009/01/pingback multiping och global redirect', to: '/2009/01/pingback-multiping-och-global-redirect/' },
  { from: '2009/02/norsk ie 6 revolt inledd jippie', to: '/2009/02/norsk-ie-6-revolt-inledd-jippie/' },
  { from: '2009/05/presentationer konferenser och meetups', to: '/2009/05/presentationer-konferenser-och-meetups/' },
  { from: '2009/07/sa varnar du om open source projekt', to: '/2009/07/s-vrnar-du-om-open-source-projekt/' },
  { from: '2010/07/fika som pa gymmet med fastpris', to: '/2010/07/fika-som-p-gymmet-med-fastpris/' },
  { from: '2010/09/du rostar inte bara pa valdagen', to: '/2010/09/du-rstar-inte-bara-p-valdagen/' },
  { from: '2010/10/iphone alarmen forvirrade nu i vintertider', to: '/2010/10/iphonealarmen-frvirrade-nu-i-vintertider/' },
  { from: '2010/10/iphonealarmen forvirrade nu i vintertider', to: '/2010/10/iphonealarmen-frvirrade-nu-i-vintertider/' },
  { from: '2010/10/satsa alltid med hela hjartat', to: '/2010/10/satsa-alltid-med-hela-hjrtat/' },
  { from: '2010/11/ubuntu cola en onodig rattvisemarkning', to: '/2010/11/ubuntu-cola-en-ondig-rttvisemrkning/' },
  { from: '2011/03/sista dagen pa good old', to: '/2011/03/sista-dagen-p-good-old/' },
];

export default function redirectsTemplate () {
  return redirects.map(({ from, to }) => ({
    outputName: `${from}/index.html`,
    content: `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=${escapeXml(to)}" />
  <link rel="canonical" href="${escapeXml(to)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeXml(to)}">${escapeXml(to)}</a></p>
</body>
</html>`,
  }));
}
```

The smoke test verifies one of these redirects:

```js
// test/smoke.spec.js (lines 29-34)
test('redirect pages generated from template', async () => {
  await access('public/2008/12/ny blogg/index.html');
  const html = await readFile('public/2008/12/ny blogg/index.html', 'utf8');
  assert.match(html, /http-equiv="refresh"/);
  assert.match(html, /url=\/2008\/12\/ny-blogg\//);
});
```

### What other SSGs provide

| SSG | Redirect mechanism |
|---|---|
| **Jekyll** | `jekyll-redirect-from` plugin — per-page `redirect_from` frontmatter |
| **Eleventy** | Community plugin `eleventy-plugin-redirects` + Netlify `_redirects` support |
| **Astro** | `astro.config.mjs` `redirects` object — generates HTML or platform-specific files |
| **Hugo** | `aliases` frontmatter field — generates HTML meta-refresh pages |
| **Next.js** | `next.config.js` `redirects()` function — generates server-side 301/302 |
| **DomStack** | None — manual template required |

---

## Workaround

Write a custom template (as shown above). This approach works but has several drawbacks:

1. **Every project reinvents the same HTML boilerplate** — the meta-refresh pattern, canonical link, and body fallback are identical across every DomStack site.
2. **No SEO-friendly HTTP status codes** — meta-refresh is a client-side redirect; search engines may not treat it as a 301. Platforms like Netlify and Cloudflare Pages support server-side redirects via `_redirects` files, but DomStack has no way to generate them.
3. **Redirect data is siloed in the template** — other parts of the build (e.g., the sitemap template) cannot access the redirect list to exclude old URLs or add redirect targets.
4. **No validation** — if a `to` target does not exist as an actual page, the redirect silently points to a 404. There is no build-time check.

---

## Proposed solution

### Option A: Configuration-based redirects in `global.vars.js` (recommended)

Allow a `redirects` array in `global.vars.js` (or a dedicated `redirects.js` file) that DomStack processes automatically:

```js
// src/global.vars.js
export default {
  blogName: 'VoxPelli',
  siteUrl: 'https://voxpelli.com',
  // ...
  redirects: [
    { from: '/2008/12/ny blogg/', to: '/2008/12/ny-blogg/' },
    { from: '/2009/01/backchannels och googlebuggar/', to: '/2009/01/backchannels-och-googlebuggar/' },
    // ...
  ],
};
```

DomStack would:
1. Generate an `index.html` with meta-refresh for each redirect (static hosting compatibility).
2. Optionally generate a `_redirects` file (Netlify/Cloudflare Pages format) if `redirectFormat: 'netlify'` is set.
3. Validate that each `to` target resolves to an actual page, warning if it does not.
4. Expose the redirects list in `globalVars` so other templates (sitemap, etc.) can exclude or reference them.

```js
// Proposed DomStack behavior for each redirect entry:
// Output: public/2008/12/ny blogg/index.html
`<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/2008/12/ny-blogg/" />
  <link rel="canonical" href="/2008/12/ny-blogg/" />
</head>
<body>
  <p>Redirecting to <a href="/2008/12/ny-blogg/">/2008/12/ny-blogg/</a></p>
</body>
</html>`
```

### Option B: Per-page `redirect_to` frontmatter

Allow individual pages to declare a redirect target, useful when a page has been moved:

```js
// src/old-path/page.vars.js
export default {
  layout: 'redirect',  // or a special 'redirect_to' var
  redirect_to: '/new-path/',
};
```

DomStack would detect the `redirect_to` var and generate a meta-refresh page instead of rendering the normal layout. This is similar to Hugo's `aliases` and Jekyll's `redirect_from`.

### Option C: Document the template pattern (minimum viable)

Add a "Redirects" cookbook section to the DomStack docs showing the template-based approach as a recommended pattern. Include:
- The meta-refresh HTML template
- XSS-safe escaping of URLs (using `escapeXml` or equivalent)
- A note on SEO implications of meta-refresh vs. server-side redirects
- A link to platform-specific alternatives (`_redirects` for Netlify, `vercel.json` for Vercel)

This is the lightest-touch option and could ship immediately while the framework-level solution is designed.

---

## Alternatives considered

| Approach | Pros | Cons |
|---|---|---|
| **A: Config-based redirects** | Centralized, validatable, platform-aware | New feature surface to design and maintain |
| **B: Per-page frontmatter** | Intuitive for page moves, familiar from Jekyll/Hugo | Does not handle bulk migrations well (13 redirects = 13 stub pages) |
| **C: Document the pattern** | Zero framework changes, ships immediately | Every project writes its own template; no validation |
| **A + B combined** | Handles both bulk migrations and individual page moves | Largest implementation scope |
| **Plugin system** | Maximum flexibility | DomStack does not have a plugin architecture (yet) |

Option A is recommended as the primary solution because redirect data is inherently global (it maps old URLs to new ones across the entire site) and belongs in site-level configuration rather than individual page files. Option C should be done regardless as a stopgap.

---

## Proposed redirect file formats

<details>
<summary><strong>Netlify <code>_redirects</code> format</strong></summary>

```
# Generated by DomStack from global.vars.js redirects
/2008/12/ny%20blogg/  /2008/12/ny-blogg/  301
/2009/01/backchannels%20och%20googlebuggar/  /2009/01/backchannels-och-googlebuggar/  301
/2009/01/pingback%20multiping%20och%20global%20redirect/  /2009/01/pingback-multiping-och-global-redirect/  301
```

</details>

<details>
<summary><strong>Cloudflare Pages <code>_redirects</code> format (same syntax)</strong></summary>

```
/2008/12/ny%20blogg/  /2008/12/ny-blogg/  301
```

</details>

<details>
<summary><strong>Vercel <code>vercel.json</code> format</strong></summary>

```json
{
  "redirects": [
    { "source": "/2008/12/ny%20blogg/", "destination": "/2008/12/ny-blogg/", "permanent": true },
    { "source": "/2009/01/backchannels%20och%20googlebuggar/", "destination": "/2009/01/backchannels-och-googlebuggar/", "permanent": true }
  ]
}
```

</details>

---

## Real-world impact

This project has **13 redirect entries**, all mapping legacy Swedish-language URLs with spaces to their URL-safe equivalents. These are URLs from 2008-2011 that have been indexed by search engines and may still receive traffic or backlinks.

The redirect template (`src/redirects.template.js`) is one of **5 template files** in this project. It exists solely to produce boilerplate HTML that every DomStack migration site would need to write independently.

The template approach also means:
- **The sitemap (`src/sitemap.xml.template.js`) includes redirect pages** — there is no way for the sitemap template to know which pages are "real" pages vs. redirect stubs, potentially confusing search engine crawlers.
- **No build-time validation** — if a `to` target URL is wrong (e.g., a typo in the slug), the redirect silently points to a 404 with no warning during the build.
- **Redirect data is not available to `global.data.js`** — since the redirect list is hardcoded in the template, other parts of the build cannot access it for filtering or cross-referencing.

---

## Related issues

- **#10 — Allow `--copy` to handle individual files**: For platforms that support `_redirects` files (Netlify, Cloudflare Pages), an alternative to generating redirect HTML is to place a `_redirects` file at the project root and copy it into the output. This requires `--copy` to support individual files.
- **#09 — Templates should receive `global.data` output in vars**: If redirect data were part of `globalVars`, templates like the sitemap could access it to exclude redirect stubs from the URL list.
