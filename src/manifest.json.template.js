/**
 * @param {{ vars: Record<string, unknown> }} _options
 * @returns {{outputName: string, content: string}}
 */
export default function manifestTemplate ({ vars }) {
  return {
    outputName: 'manifest.json',
    content: JSON.stringify({
      short_name: 'Pelle Wessman',
      name: "Pelle Wessman's Blog",
      icons: [
        {
          src: '/launcher-icon.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
      background_color: '#dedede',
      theme_color: vars.themeColor,
      start_url: '/',
      scope: '/',
      display: 'standalone',
    }, undefined, 2) + '\n',
  };
}
