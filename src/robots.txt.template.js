/**
 * @param {{ vars: Record<string, unknown> }} _options
 * @returns {Array<{outputName: string, content: string}>}
 */
export default function robotsTemplate (_options) {
  return [{
    outputName: 'robots.txt',
    content: `User-agent: *
Disallow: /webpage-kodfabrik-se/
Disallow: /webpage-svpt-nu/
`,
  }];
}
