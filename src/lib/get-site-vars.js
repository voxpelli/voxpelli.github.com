import { assertKeyWithType, assertOptionalKeyWithType } from '@voxpelli/typed-utils';

/**
 * Extract and type-narrow site configuration variables from template vars object.
 *
 * Validates that required keys are strings using runtime assertions.
 * Throws TypeHelpersAssertionError if validation fails.
 *
 * @param {Record<string, unknown>} vars - Template vars object
 * @returns {import('../global-types.d.ts').SiteVars}
 * @throws {TypeHelpersAssertionError} if required keys are missing or not strings
 * @example
 * export default async function * feedsTemplate ({ pages, vars }) {
 *   const { siteUrl, blogName, authorName, authorEmail, pushHub } = getSiteVars(vars);
 *   // All properties are now guaranteed to be strings
 * }
 */
export function getSiteVars (vars) {
  assertKeyWithType(vars, 'siteUrl', 'string');
  assertKeyWithType(vars, 'feedUidBase', 'string');
  assertKeyWithType(vars, 'blogName', 'string');
  assertKeyWithType(vars, 'authorName', 'string');
  assertKeyWithType(vars, 'authorEmail', 'string');
  assertKeyWithType(vars, 'themeColor', 'string');
  assertKeyWithType(vars, 'webmentionEndpoint', 'string');
  assertOptionalKeyWithType(vars, 'pushHub', 'string');

  const { authorEmail, authorName, blogName, feedUidBase, pushHub = '', siteUrl, themeColor, webmentionEndpoint } = vars;

  return { authorEmail, authorName, blogName, feedUidBase, pushHub, siteUrl, themeColor, webmentionEndpoint };
}
