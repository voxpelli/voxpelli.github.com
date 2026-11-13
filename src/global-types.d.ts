export interface SiteVars {
  blogName: string;
  siteUrl: string;
  /**
   * Base for Atom entry `<id>`s — Jekyll's `uid_base`, preserved verbatim.
   *
   * Entry ids are a write-once public contract: every id the live feeds have
   * ever served starts with `http://voxpelli.com` (no trailing slash on the
   * path), decoupled from the canonical `https://` link. Changing this — or
   * deriving ids from `siteUrl` — re-floods every subscriber with duplicates,
   * irreversibly. `test/smoke.spec.js` pins the scheme.
   */
  feedUidBase: string;
  authorName: string;
  authorEmail: string;
  pushHub: string;
  themeColor: string;
  webmentionEndpoint: string;
}

export type ValidatedSiteVars = SiteVars;

export type PageData = import('@domstack/static/types.js').PageData<Record<string, unknown>, unknown>;
export type { TemplateOutputOverride } from '@domstack/static/types.js';
