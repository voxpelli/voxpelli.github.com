/** @satisfies {import('./global-types.d.ts').SiteVars} */
const vars = {
  blogName: 'VoxPelli',
  siteUrl: 'https://voxpelli.com',
  // Jekyll's `uid_base`, verbatim: Atom entry <id>s are permanent identifiers,
  // NOT links — they keep the http:// scheme the feeds have always served.
  feedUidBase: 'http://voxpelli.com',
  authorName: 'Pelle Wessman',
  authorEmail: 'pelle@kodfabrik.se',
  pushHub: 'https://voxpelli.superfeedr.com/',
  themeColor: '#8c2121',
  webmentionEndpoint: 'https://webmention.herokuapp.com',
};

export default vars;
