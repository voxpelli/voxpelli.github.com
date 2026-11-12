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

/**
 * Keep these narrow local shapes until DOMStack's published v12 declarations
 * can be parsed by TypeScript 6.
 */
// TODO [@domstack/static@>=12.0.1]: use the public types from `@domstack/static/types.js` once its declarations parse under TypeScript 6.
export interface PageData {
  pageInfo: {
    path: string;
    url: string;
    outputRelname: string;
  };
  vars: Record<string, unknown>;
  renderInnerPage?: () => Promise<string>;
  styles?: string[];
  scripts?: string[];
}

export interface TemplateOutputOverride {
  outputName: string;
  content: string;
}
