/**
 * @param {{ vars: Record<string, unknown> }} _options
 * @returns {Array<{outputName: string, content: string}>}
 */
export default function manifestTemplate (_options) {
  return [{
    outputName: 'manifest.json',
    content: JSON.stringify({
      short_name: 'Pelle Wessman',
      name: "Pelle Wessman's Blog",
      icons: [
        {
          src: 'images/launcher-icon.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
      background_color: '#dedede',
      theme_color: '#dd3333',
      start_url: '/',
      scope: '/',
      display: 'standalone',
    }, undefined, 2) + '\n',
  }];
}
