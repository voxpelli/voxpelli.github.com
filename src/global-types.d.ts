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
 * Temporary shared stopgap until `@domstack/static` exports `PageData`.
 * Keep this aligned with the subset this repo actually consumes.
 * TODO [@domstack/static@>=11.0.4]: PR #241 (merged 2026-05-24, unreleased) exports PageData/PageInfo from the package entry — delete this stopgap interface and import the real types.
 */
export interface PageData {
  pageInfo: {
    path: string;
    outputRelname: string;
  };
  vars: Record<string, unknown>;
  renderInnerPage?: (opts: { pages: PageData[] }) => Promise<string>;
  styles?: string[];
  scripts?: string[];
}
