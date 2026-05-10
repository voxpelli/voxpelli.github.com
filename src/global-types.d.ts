export interface SiteVars {
  blogName: string;
  siteUrl: string;
  authorName: string;
  authorEmail: string;
  pushHub: string;
  themeColor: string;
  micropubEndpoint: string;
  webmentionEndpoint: string;
}

export type ValidatedSiteVars = SiteVars;

/**
 * Temporary shared stopgap until `@domstack/static` exports `PageData`.
 * Keep this aligned with the subset this repo actually consumes.
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
