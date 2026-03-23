/**
 * @param {{ vars: Record<string, unknown> }} _options
 * @returns {string}
 */
export default function robotsTemplate (_options) {
  return `User-agent: *
Disallow: /webpage-kodfabrik-se/
Disallow: /webpage-svpt-nu/
`;
}
