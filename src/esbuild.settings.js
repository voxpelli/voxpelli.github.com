/**
 * @param {import('esbuild').BuildOptions} opts
 * @returns {import('esbuild').BuildOptions}
 */
export default function esbuildSettings (opts) {
  return {
    ...opts,
    loader: {
      ...opts.loader,
      '.gif': 'dataurl',
    },
  };
}
