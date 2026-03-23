# Native redirect support for URL migrations

## Problem

Sites migrating from other SSGs often need redirect pages for old URLs. Currently users must create a template that generates redirect HTML pages manually:

```js
// src/redirects.template.js
const redirects = [
  { from: '2008/12/ny blogg', to: '/2008/12/ny-blogg/' },
  // ... 12 more
];

export default function () {
  return redirects.map(({ from, to }) => ({
    outputName: `${from}/index.html`,
    content: `<!DOCTYPE html><html><head>
      <meta http-equiv="refresh" content="0;url=${to}" />
      <link rel="canonical" href="${to}" />
    </head><body><p>Redirecting to <a href="${to}">${to}</a></p></body></html>`,
  }));
}
```

This is boilerplate that every migrating site writes.

## Suggested improvements

### Option A: Frontmatter redirect support
Allow pages to specify a redirect target:
```yaml
---
redirect_to: /2008/12/ny-blogg/
---
```
DomStack generates the meta-refresh HTML automatically.

### Option B: Configuration-based redirects
```js
// In global.vars.js or domstack.config.js
export default {
  redirects: [
    { from: '/old-path/', to: '/new-path/' },
  ],
};
```

### Option C: Document the template pattern
Add a "Redirects" section to the docs showing the template-based approach (current workaround). This is the lightest-touch option.

## Impact

Every site migration needs redirects. Jekyll has `jekyll-redirect-from`, Astro has config-based redirects, Eleventy has community plugins. DomStack should at minimum document the pattern.
