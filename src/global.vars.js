/**
 * @typedef {object} SiteVars
 * @property {string} blogName
 * @property {string} siteUrl
 * @property {string} authorName
 * @property {string} authorEmail
 * @property {string} pushHub
 * @property {string} themeColor
 * @property {string} micropubEndpoint
 * @property {string} webmentionEndpoint
 */

/** @satisfies {SiteVars} */
const vars = {
  blogName: 'VoxPelli',
  siteUrl: 'https://voxpelli.com',
  authorName: 'Pelle Wessman',
  authorEmail: 'pelle@kodfabrik.se',
  pushHub: 'https://voxpelli.superfeedr.com/',
  themeColor: '#8c2121',
  micropubEndpoint: 'https://micropub-to-github.herokuapp.com/micropub/voxpelli.com',
  webmentionEndpoint: 'https://webmention.herokuapp.com',
};

export default vars;
