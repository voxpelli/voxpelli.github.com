/** @param {{ vars: Record<string, unknown> }} _options */
export default function robotsTemplate (_options) {
  return [{
    outputName: 'robots.txt',
    content: `User-agent: *
Disallow: /webpage-kodfabrik-se/
Disallow: /webpage-svpt-nu/
`,
  }];
}
